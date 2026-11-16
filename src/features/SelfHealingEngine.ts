/**
 * Category 5: Testing, Verification & Self-Healing Loops (Features 36–43)
 * 
 * 36. Auto-Pytest / Jest Loop with Error Feeding
 * 37. Linter-Driven Syntax Self-Correction
 * 38. TypeCheck Pre-flight Guard (mypy / tsc)
 * 39. Differential Unit Test Generator
 * 40. Coverage-Guided Test Gap Finder
 * 41. Dead Code & Unused Variable Cleaner
 * 42. API Contract Regression Guard
 * 43. Automated Benchmark Performance Comparator
 */

import { exec } from 'child_process';

export interface TestSelfHealingResult {
  passed: boolean;
  attempts: number;
  lastStderr?: string;
  healingPrompt?: string;
}

export interface ContractDifference {
  symbol: string;
  type: 'signature_changed' | 'removed' | 'added';
  details: string;
}

export class SelfHealingEngine {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  // Feature 36: Auto-Pytest / Jest Loop with Error Feeding
  public generateHealingPrompt(testCommand: string, stderr: string, stdout: string): string {
    const errorTrace = stderr || stdout;
    const truncated = errorTrace.split('\n').slice(-30).join('\n');
    return `The previous code change caused test execution to fail with command \`${testCommand}\`:\n\`\`\`\n${truncated}\n\`\`\`\nPlease analyze the failure and provide targeted hunk fixes to make all tests pass cleanly.`;
  }

  // Feature 37: Linter-Driven Syntax Self-Correction
  public checkSyntaxIntegrity(code: string, language: 'python' | 'typescript'): { hasError: boolean; errors: string[] } {
    const errors: string[] = [];

    // Bracket balance check
    const stack: string[] = [];
    const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };

    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      if (['(', '[', '{'].includes(char)) {
        stack.push(char);
      } else if ([')', ']', '}'].includes(char)) {
        const expected = pairs[char];
        if (stack.length === 0 || stack.pop() !== expected) {
          errors.push(`Mismatched bracket '${char}' at index ${i}`);
          break;
        }
      }
    }

    if (stack.length > 0) {
      errors.push(`Unclosed opening brackets: ${stack.join(', ')}`);
    }

    if (language === 'python') {
      const lines = code.split('\n');
      for (let idx = 0; idx < lines.length; idx++) {
        const line = lines[idx];
        const trimmed = line.trim();
        if ((trimmed.startsWith('def ') || trimmed.startsWith('class ') || trimmed.startsWith('if ') || trimmed.startsWith('for ')) && !trimmed.endsWith(':')) {
          errors.push(`Line ${idx + 1}: Missing colon ':' at end of header statement: "${trimmed}"`);
        }
      }
    }

    return { hasError: errors.length > 0, errors };
  }

  // Feature 38: TypeCheck Pre-flight Guard (mypy / tsc)
  public formatTypeCheckErrors(rawCompilerOutput: string): Array<{ file: string; line: number; message: string }> {
    const lines = rawCompilerOutput.split('\n');
    const parsed: Array<{ file: string; line: number; message: string }> = [];

    for (const l of lines) {
      const match = l.match(/^(.*?):(\d+):(?:\d+:)?\s*(error:.*)$/);
      if (match) {
        parsed.push({
          file: match[1],
          line: parseInt(match[2], 10),
          message: match[3],
        });
      }
    }

    return parsed;
  }

  // Feature 39: Differential Unit Test Generator
  public generateDifferentialTest(
    functionName: string,
    inputCases: Array<{ args: any[]; expected: any }>
  ): string {
    const testLines = [
      `def test_${functionName}_differential():`,
      `    from flask.helpers import ${functionName}`,
    ];

    for (const c of inputCases) {
      testLines.push(`    assert ${functionName}(*${JSON.stringify(c.args)}) == ${JSON.stringify(c.expected)}`);
    }

    return testLines.join('\n');
  }

  // Feature 40: Coverage-Guided Test Gap Finder
  public identifyUncoveredFunctions(
    fileContent: string,
    coveredLines: Set<number>
  ): Array<{ functionName: string; line: number }> {
    const lines = fileContent.split('\n');
    const gaps: Array<{ functionName: string; line: number }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^\s*(?:def|async def)\s+([a-zA-Z0-9_]+)/);
      if (match) {
        const lineNum = i + 1;
        if (!coveredLines.has(lineNum)) {
          gaps.push({ functionName: match[1], line: lineNum });
        }
      }
    }

    return gaps;
  }

  // Feature 41: Dead Code & Unused Variable Cleaner
  public identifyDeadImports(code: string): string[] {
    const lines = code.split('\n');
    const imports: string[] = [];
    const usedImports: Set<string> = new Set();

    for (const line of lines) {
      const m = line.match(/^from\s+[^\s]+\s+import\s+([a-zA-Z0-9_,\s]+)/);
      if (m) {
        const symbols = m[1].split(',').map(s => s.trim());
        imports.push(...symbols);
      }
    }

    const restOfCode = code.replace(/^(?:from|import).*$/gm, '');
    const dead: string[] = [];

    for (const sym of imports) {
      const re = new RegExp(`\\b${sym}\\b`, 'g');
      if (!re.test(restOfCode)) {
        dead.push(sym);
      }
    }

    return dead;
  }

  // Feature 42: API Contract Regression Guard
  public detectSignatureRegressions(
    oldSignatures: Map<string, string>,
    newSignatures: Map<string, string>
  ): ContractDifference[] {
    const diffs: ContractDifference[] = [];

    for (const [sym, oldSig] of oldSignatures.entries()) {
      if (!newSignatures.has(sym)) {
        diffs.push({
          symbol: sym,
          type: 'removed',
          details: `Public function '${sym}' was removed!`,
        });
      } else {
        const newSig = newSignatures.get(sym)!;
        if (oldSig !== newSig) {
          diffs.push({
            symbol: sym,
            type: 'signature_changed',
            details: `Signature changed from '${oldSig}' to '${newSig}'.`,
          });
        }
      }
    }

    for (const sym of newSignatures.keys()) {
      if (!oldSignatures.has(sym)) {
        diffs.push({
          symbol: sym,
          type: 'added',
          details: `New public API '${sym}' added.`,
        });
      }
    }

    return diffs;
  }

  // Feature 43: Automated Benchmark Performance Comparator
  public compareBenchmarkRuns(baselineMs: number, candidateMs: number): {
    regression: boolean;
    percentageDelta: number;
    summary: string;
  } {
    const delta = ((candidateMs - baselineMs) / baselineMs) * 100;
    const isRegression = delta > 15;

    return {
      regression: isRegression,
      percentageDelta: Number(delta.toFixed(2)),
      summary: isRegression
        ? `Performance Regression: candidate is ${delta.toFixed(1)}% slower (${baselineMs}ms vs ${candidateMs}ms)`
        : `Performance verified clean (${delta >= 0 ? '+' : ''}${delta.toFixed(1)}% change)`,
    };
  }
}
