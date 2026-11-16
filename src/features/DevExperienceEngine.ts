/**
 * Category 4: Developer Experience & UI/UX (Features 28–35)
 * 
 * 28. Floating In-Editor Chat Bar (Cursor-Style Overlay)
 * 29. Sound Cues for Long Turn Completion
 * 30. Interactive Token Cost & Latency HUD
 * 31. Prompt Template Bookmarks (.forgecode/prompts/)
 * 32. CodeLens "Explain Diff" Button
 * 33. Keyboard-Only Review Mode (Tab + Y / N)
 * 34. Export Diff as PR / Git Patch
 * 35. Multi-Theme Diff Syntax Highlighting
 */

import * as fs from 'fs';
import * as path from 'path';

export interface TokenMetricsHUD {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  tokensPerSec: number;
  estimatedCostUsd: number;
  latencyMs: number;
}

export interface PromptTemplate {
  name: string;
  trigger: string;
  template: string;
}

export class DevExperienceEngine {
  private workspaceRoot: string;
  private templates: Map<string, PromptTemplate> = new Map();

  constructor(workspaceRoot: string = process.cwd()) {
    this.workspaceRoot = workspaceRoot;
    this.initializeDefaultTemplates();
  }

  // Feature 28: Floating In-Editor Chat Bar (Configuration Generator)
  public getFloatingWidgetLayout(): { width: number; anchor: 'cursor' | 'top_right'; maxHeight: number } {
    return {
      width: 580,
      anchor: 'cursor',
      maxHeight: 280,
    };
  }

  // Feature 29: Sound Cues for Long Turn Completion
  public getNotificationAudioPayload(turnDurationMs: number): { playChime: boolean; soundType: 'subtle_bell' | 'none' } {
    if (turnDurationMs > 3000) {
      return { playChime: true, soundType: 'subtle_bell' };
    }
    return { playChime: false, soundType: 'none' };
  }

  // Feature 30: Interactive Token Cost & Latency HUD
  public calculateTurnMetrics(promptChars: number, completionChars: number, latencyMs: number): TokenMetricsHUD {
    const promptTokens = Math.ceil(promptChars / 3.8);
    const completionTokens = Math.ceil(completionChars / 3.8);
    const totalTokens = promptTokens + completionTokens;

    const seconds = Math.max(0.1, latencyMs / 1000);
    const tokensPerSec = Math.round(completionTokens / seconds);

    // Standard blended rate (~$0.15 / 1M prompt, $0.60 / 1M completion for mini class)
    const cost = (promptTokens * 0.00000015) + (completionTokens * 0.00000060);

    return {
      promptTokens,
      completionTokens,
      totalTokens,
      tokensPerSec,
      estimatedCostUsd: Number(cost.toFixed(6)),
      latencyMs,
    };
  }

  // Feature 31: Prompt Template Bookmarks (.forgecode/prompts/)
  private initializeDefaultTemplates(): void {
    this.templates.set('test', {
      name: 'Add Pytest Test Case',
      trigger: '/test',
      template: 'Write a comprehensive test for the selected function covering standard, error, and edge conditions.',
    });
    this.templates.set('doc', {
      name: 'Generate Documentation',
      trigger: '/doc',
      template: 'Generate clear Sphinx/Google-style docstrings and usage examples for this module.',
    });
    this.templates.set('refactor', {
      name: 'Refactor Clean Code',
      trigger: '/refactor',
      template: 'Refactor this logic to eliminate duplicated branches, reduce cyclomatic complexity, and improve readability.',
    });
  }

  public getTemplate(trigger: string): PromptTemplate | undefined {
    return this.templates.get(trigger.replace(/^\//, ''));
  }

  public registerTemplate(t: PromptTemplate): void {
    this.templates.set(t.trigger.replace(/^\//, ''), t);
  }

  public listTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  // Feature 32: CodeLens "Explain Diff" Button
  public generateHunkExplanation(oldContent: string, newContent: string): string {
    const deletedCount = oldContent.split('\n').length;
    const addedCount = newContent.split('\n').length;
    return `ForgeCode revision: modified ${deletedCount} lines with ${addedCount} replacement lines to fulfill requested instruction.`;
  }

  // Feature 33: Keyboard-Only Review Mode
  public processKeyboardReviewAction(key: 'y' | 'n' | 'tab', currentHunkIndex: number, totalHunks: number): {
    action: 'accept' | 'reject' | 'next';
    nextIndex: number;
  } {
    if (key === 'y') {
      return { action: 'accept', nextIndex: (currentHunkIndex + 1) % totalHunks };
    }
    if (key === 'n') {
      return { action: 'reject', nextIndex: (currentHunkIndex + 1) % totalHunks };
    }
    return { action: 'next', nextIndex: (currentHunkIndex + 1) % totalHunks };
  }

  // Feature 34: Export Diff as PR / Git Patch
  public exportAsUnifiedPatch(files: { path: string; original: string; modified: string }[]): string {
    const patches: string[] = [];
    const timestamp = new Date().toISOString();

    patches.push(`# ForgeCode Autonomous Agent Patch Export`);
    patches.push(`# Date: ${timestamp}\n`);

    for (const f of files) {
      patches.push(`--- a/${f.path}`);
      patches.push(`+++ b/${f.path}`);
      patches.push(`@@ -1,${f.original.split('\n').length} +1,${f.modified.split('\n').length} @@`);
      for (const line of f.original.split('\n')) {
        patches.push(`-${line}`);
      }
      for (const line of f.modified.split('\n')) {
        patches.push(`+${line}`);
      }
      patches.push('');
    }

    return patches.join('\n');
  }

  // Feature 35: Multi-Theme Diff Syntax Highlighting
  public getThemeColorTokens(isDarkTheme: boolean): {
    insertionBg: string;
    deletionBg: string;
    borderGutter: string;
  } {
    return isDarkTheme
      ? {
          insertionBg: 'rgba(46, 160, 67, 0.18)',
          deletionBg: 'rgba(248, 81, 73, 0.18)',
          borderGutter: '#007acc',
        }
      : {
          insertionBg: 'rgba(46, 160, 67, 0.12)',
          deletionBg: 'rgba(248, 81, 73, 0.12)',
          borderGutter: '#005fb8',
        };
  }
}
