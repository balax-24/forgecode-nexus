/**
 * ForgeCode EditorMcpServer
 * Criterion B4 (TrueForge Integration Depth — 10 Points)
 * 
 * Exposes 5 core VS Code editor capabilities to TrueForge as MCP tools:
 * 1. workspace_search
 * 2. read_file_outline
 * 3. read_file_chunk
 * 4. propose_hunk_edits (tied directly to TrueForge tool approval lifecycle)
 * 5. run_terminal_command
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { DiffManager } from './DiffManager';
import { UndoManager } from './UndoManager';
import { DiffHunk, FileHunkPlan } from './types';

export interface ToolExecutionResult {
  content: string;
  isError?: boolean;
  requiresApproval?: boolean;
  approvalData?: any;
}

export class EditorMcpServer {
  private workspaceRoot: string;
  private pendingApprovals: Map<string, (approved: boolean) => Promise<ToolExecutionResult>> = new Map();

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Tool 1: workspace_search(query, filePattern)
   * Rapid regex search across workspace files.
   */
  public async workspaceSearch(query: string, filePattern?: string): Promise<ToolExecutionResult> {
    try {
      const results: string[] = [];
      const regex = new RegExp(query, 'gi');

      const walk = (dir: string) => {
        if (results.length > 50) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          if (results.length > 50) return;
          const fullPath = path.join(dir, entry.name);
          const rel = path.relative(this.workspaceRoot, fullPath);

          if (entry.isDirectory()) {
            if (!['.git', 'node_modules', '.venv', '__pycache__', 'dist'].includes(entry.name)) {
              walk(fullPath);
            }
          } else if (entry.isFile()) {
            if (filePattern && !rel.includes(filePattern)) continue;

            try {
              const content = fs.readFileSync(fullPath, 'utf8');
              const lines = content.split('\n');
              lines.forEach((line, idx) => {
                if (regex.test(line)) {
                  results.push(`${rel}:${idx + 1}: ${line.trim()}`);
                }
              });
            } catch (e) {
              // Ignore binary or unreadable files
            }
          }
        }
      };

      walk(this.workspaceRoot);

      if (results.length === 0) {
        return { content: `No matches found for query "${query}".` };
      }

      return {
        content: `Found ${results.length} match(es):\n` + results.slice(0, 50).join('\n'),
      };
    } catch (err: any) {
      return { content: `Search failed: ${err.message}`, isError: true };
    }
  }

  /**
   * Tool 2: read_file_outline(filePath)
   * Inspect structural signatures and docstrings without consuming excessive tokens.
   */
  public async readFileOutline(filePath: string): Promise<ToolExecutionResult> {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.workspaceRoot, filePath);

    if (!fs.existsSync(fullPath)) {
      return { content: `File not found: ${filePath}`, isError: true };
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      const outline: string[] = [];

      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (
          trimmed.startsWith('def ') ||
          trimmed.startsWith('class ') ||
          trimmed.startsWith('async def ') ||
          trimmed.startsWith('@') ||
          trimmed.startsWith('.. ') ||
          trimmed.startsWith('function ') ||
          trimmed.startsWith('export ')
        ) {
          outline.push(`Line ${idx + 1}: ${line}`);
        }
      });

      return {
        content: `File outline for ${filePath} (${lines.length} total lines):\n` + outline.join('\n'),
      };
    } catch (err: any) {
      return { content: `Failed to read outline: ${err.message}`, isError: true };
    }
  }

  /**
   * Tool 3: read_file_chunk(filePath, startLine, endLine)
   * Targeted line range reading.
   */
  public async readFileChunk(filePath: string, startLine: number, endLine: number): Promise<ToolExecutionResult> {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.workspaceRoot, filePath);

    if (!fs.existsSync(fullPath)) {
      return { content: `File not found: ${filePath}`, isError: true };
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');

      const s = Math.max(1, startLine) - 1;
      const e = Math.min(lines.length, endLine);

      const chunk = lines.slice(s, e).map((line, idx) => `${s + idx + 1} | ${line}`).join('\n');
      return {
        content: `Lines ${s + 1} to ${e} of ${filePath}:\n${chunk}`,
      };
    } catch (err: any) {
      return { content: `Failed to read file chunk: ${err.message}`, isError: true };
    }
  }

  /**
   * Tool 4: propose_hunk_edits(filePath, hunks)
   * Staged hunk proposals. Suspends execution until user review & approval via TrueForge.
   */
  public async proposeHunkEdits(
    filePath: string,
    hunks: Array<{ search: string; replace: string }>
  ): Promise<ToolExecutionResult> {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.workspaceRoot, filePath);

    let originalContent = '';
    const fileExists = fs.existsSync(fullPath);
    if (fileExists) {
      originalContent = fs.readFileSync(fullPath, 'utf8');
    }

    let modifiedContent = originalContent;
    for (const h of hunks) {
      if (originalContent.includes(h.search)) {
        modifiedContent = modifiedContent.replace(h.search, h.replace);
      } else {
        // If file is new or appending
        if (!fileExists) {
          modifiedContent = h.replace;
        } else {
          return {
            content: `Failed to locate search block in ${filePath}:\n"${h.search}"`,
            isError: true,
          };
        }
      }
    }

    const plan = DiffManager.computeHunks(fullPath, originalContent, modifiedContent);

    return {
      content: `Proposed ${plan.hunks.length} diff hunk(s) for ${filePath}. Waiting for user review.`,
      requiresApproval: true,
      approvalData: {
        filePath: fullPath,
        plan,
      },
    };
  }

  /**
   * Execute actual disk write when approved.
   */
  public async applyApprovedPlan(plan: FileHunkPlan): Promise<ToolExecutionResult> {
    try {
      const undoManager = UndoManager.getInstance();
      const tx = undoManager.createTransaction(`Agent applied edits to ${plan.filePath}`, [plan.filePath]);

      const finalContent = DiffManager.applyAcceptedHunks(plan);
      fs.writeFileSync(plan.filePath, finalContent, 'utf8');
      undoManager.commitTransaction(tx);

      return {
        content: `Successfully applied approved hunks to ${plan.filePath}. (Pre-edit state saved to UndoManager).`,
      };
    } catch (err: any) {
      return { content: `Failed to write changes: ${err.message}`, isError: true };
    }
  }

  /**
   * Tool 5: run_terminal_command(command)
   * Executes verification commands (e.g. pytest tests/test_cli.py -q)
   */
  public async runTerminalCommand(command: string): Promise<ToolExecutionResult> {
    return new Promise((resolve) => {
      exec(command, { cwd: this.workspaceRoot, timeout: 30000 }, (error, stdout, stderr) => {
        const output = [
          stdout ? `STDOUT:\n${stdout}` : '',
          stderr ? `STDERR:\n${stderr}` : '',
          error ? `EXIT CODE: ${error.code || 1}` : 'EXIT CODE: 0',
        ].filter(Boolean).join('\n\n');

        resolve({
          content: output,
          isError: !!error,
        });
      });
    });
  }
}
