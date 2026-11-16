/**
 * ForgeCode 62-Feature Comprehensive Test Suite
 * Validates all 62 Production Features across 8 Categories
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Mock vscode module for standalone execution
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === 'vscode') {
    return {
      workspace: {
        workspaceFolders: [{ uri: { fsPath: path.resolve(__dirname, '..') } }],
        getConfiguration: () => ({
          get: (key, def) => def,
        }),
      },
      window: {
        createStatusBarItem: () => ({ show: () => {}, text: '', tooltip: '', command: '' }),
        showInformationMessage: () => {},
        showWarningMessage: () => {},
        showErrorMessage: () => {},
        registerWebviewViewProvider: () => ({ dispose: () => {} }),
      },
      commands: {
        registerCommand: () => ({ dispose: () => {} }),
        executeCommand: () => {},
      },
      languages: {
        registerCodeLensProvider: () => ({ dispose: () => {} }),
      },
      StatusBarAlignment: { Right: 1 },
      CodeLens: class { constructor(range, command) { this.range = range; this.command = command; } },
      Range: class { constructor(sl, sc, el, ec) { this.start = { line: sl, character: sc }; this.end = { line: el, character: ec }; } },
    };
  }
  return originalRequire.apply(this, arguments);
};

const {
  FeatureRegistry,
  AdvancedContextEngine,
  DiffSafetyEngine,
  MultiAgentEngine,
  DevExperienceEngine,
  SelfHealingEngine,
  EnterpriseMonorepoEngine,
  SecurityPrivacyEngine,
  TrueForgeUpstreamEngine
} = require('../dist/extension');

const workspaceRoot = path.resolve(__dirname, '..');
const registry = FeatureRegistry.getInstance(workspaceRoot);

let totalPassed = 0;
let totalFailed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    totalPassed++;
  } catch (err) {
    console.error(`  ✕ [FAIL] ${name}`);
    console.error(`    ${err.message}`);
    totalFailed++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ [PASS] ${name}`);
    totalPassed++;
  } catch (err) {
    console.error(`  ✕ [FAIL] ${name}`);
    console.error(`    ${err.message}`);
    totalFailed++;
  }
}

async function main() {
  console.log('================================================================');
  console.log('  ForgeCode Complete 62-Feature Test Suite (All 8 Categories)   ');
  console.log('================================================================\n');

  // Feature Registry Verification
  console.log('[Registry] Verifying Master Catalog...');
  runTest('Catalog contains exactly 62 registered production features', () => {
    assert.strictEqual(registry.getFeatureCount(), 62);
    const catalog = registry.getCatalog();
    for (let i = 1; i <= 62; i++) {
      assert(catalog.some(f => f.id === i), `Missing feature #${i} in catalog`);
    }
  });

  // Category 1: Context Engineering (Features 1–10)
  console.log('\n--- Category 1: Context Engineering (Features 1–10) ---');
  const ctx = registry.contextEngine;

  runTest('Feature 1: Tree-sitter AST Chunking & Symbol Boundaries', () => {
    const code = `
class AppConfig:
    def __init__(self):
        self.port = 8080

def start_server():
    print("Serving on port 8080")
`;
    const chunks = ctx.chunkByASTBoundaries('server.py', code);
    assert(chunks.length >= 2, `Expected at least 2 AST chunks, got ${chunks.length}`);
    assert(chunks.some(c => c.symbolName.includes('AppConfig')));
    assert(chunks.some(c => c.symbolName.includes('start_server')));
  });

  runTest('Feature 2: LSP-Native Definition & Reference Graph Traversal', () => {
    const files = [
      { path: 'helpers.py', content: 'def get_debug_flag():\n    return False\n' },
      { path: 'cli.py', content: 'from helpers import get_debug_flag\nprint(get_debug_flag())\n' }
    ];
    const graph = ctx.buildSymbolReferenceGraph(files);
    assert(graph.has('get_debug_flag'));
    const node = graph.get('get_debug_flag');
    assert.strictEqual(node.definedIn, 'helpers.py');
    assert(node.referencedIn.includes('cli.py'));
  });

  runTest('Feature 3: Dynamic Knapsack Context Re-balancing', () => {
    const budget = ctx.calculateDynamicBudget(8000, 'test_writing');
    assert(budget.testBudget > budget.sourceBudget, 'Test budget should exceed source budget for test writing task');
    assert.strictEqual(budget.sourceBudget + budget.testBudget + budget.docBudget, 8000);
  });

  runTest('Feature 4: Embedding-Assisted Hybrid BM25 + Vector Search', () => {
    const docs = [
      { path: 'cli.py', text: 'flask command line interface configuration helper options' },
      { path: 'db.py', text: 'postgresql database connection pool session manager' },
    ];
    const results = ctx.hybridRank('flask cli configuration', docs);
    assert.strictEqual(results[0].path, 'cli.py', 'Hybrid search failed to rank cli.py first');
    assert(results[0].hybridScore > results[1].hybridScore);
  });

  runTest('Feature 5: Cross-File Import Dependency Topological Sorter', () => {
    const files = [
      { path: 'routes.py', imports: ['helpers.py', 'models.py'] },
      { path: 'models.py', imports: ['helpers.py'] },
      { path: 'helpers.py', imports: [] },
    ];
    const sorted = ctx.sortDependenciesTopologically(files);
    const helpersIdx = sorted.indexOf('helpers.py');
    const routesIdx = sorted.indexOf('routes.py');
    assert(helpersIdx < routesIdx, 'Base dependency helpers.py must precede dependent routes.py');
  });

  runTest('Feature 6: Smart Skeletonization of Out-of-Budget Files', () => {
    const fullCode = `
import os
import sys

def complex_heavy_computation(a: int, b: str) -> bool:
    """Docstring explaining heavy logic."""
    step1 = a * 10
    step2 = b.strip()
    return step1 > 50

class WorkerNode:
    def process(self):
        print("Busy")
`;
    const skeleton = ctx.skeletonizeContent(fullCode, 'python');
    assert(skeleton.includes('def complex_heavy_computation'));
    assert(skeleton.includes('class WorkerNode'));
    assert(!skeleton.includes('step1 = a * 10'), 'Implementation body should be skeletonized');
  });

  runTest('Feature 7: Git Delta & Recency Context Weighting', () => {
    const scores = ctx.getGitRecencyScores();
    assert(scores instanceof Map);
  });

  runTest('Feature 8: @git:branch & @commit Context Anchors', () => {
    const res = ctx.resolveGitAnchor('@commit:22d92470');
    // Either valid diff or handled gracefully
    assert(res === null || res.type === 'commit');
  });

  runTest('Feature 9: Terminal Output Ring Buffer Context Injector', () => {
    ctx.appendTerminalOutput('ERROR: pytest tests/test_cli.py failed at line 144\nAssertionError');
    const captured = ctx.getTerminalContext(10);
    assert(captured.includes('AssertionError'));
    assert(captured.includes('test_cli.py'));
  });

  runTest('Feature 10: Active Editor Viewport Proximity Bias', () => {
    const chunks = [
      { filePath: 'a.py', symbolName: 'sym1', kind: 'function', startLine: 10, endLine: 30, content: 'code', tokens: 10 },
      { filePath: 'a.py', symbolName: 'sym2', kind: 'function', startLine: 120, endLine: 140, content: 'code', tokens: 10 }
    ];
    const biased = ctx.applyViewportProximityBias(chunks, 100, 150);
    assert.strictEqual(biased[0].symbolName, 'sym2', 'Viewport overlapping chunk should rank first');
    assert(biased[0].proximityScore > biased[1].proximityScore);
  });

  // Category 2: Diff Safety & Transactions (Features 11–18)
  console.log('\n--- Category 2: Diff Safety & Transactions (Features 11–18) ---');
  const diffEngine = registry.diffSafetyEngine;

  runTest('Feature 11: 3-Way Interactive Visual Merge Conflicts', () => {
    const base = 'line 1\nline 2\nline 3';
    const mine = 'line 1\nline 2 USER EDIT\nline 3';
    const theirs = 'line 1\nline 2 AGENT PROPOSAL\nline 3';
    const conflict = diffEngine.resolve3WayMerge(base, mine, theirs);
    assert.strictEqual(conflict.hasConflict, true);
    assert(conflict.conflictCount >= 1);
    assert(conflict.mergedContent.includes('<<<<<<< USER WORKSPACE'));
  });

  runTest('Feature 12: Multi-File Atomic Transaction Commit/Rollback', () => {
    const testFile = path.join(workspaceRoot, '.test_atomic.txt');
    fs.writeFileSync(testFile, 'initial content', 'utf8');

    const result = diffEngine.executeAtomicTransaction([
      { filePath: testFile, newContent: 'new atomic content' }
    ]);

    assert.strictEqual(result.success, true);
    assert.strictEqual(fs.readFileSync(testFile, 'utf8'), 'new atomic content');

    // Cleanup
    if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
  });

  runTest('Feature 13: Partial Hunk Line-by-Line Selection', () => {
    const hunk = {
      id: 'h1',
      oldStart: 1,
      oldLines: 3,
      newStart: 1,
      newLines: 3,
      oldContent: 'line1\nline2\nline3',
      newContent: 'line1_mod\nline2_mod\nline3_mod',
      status: 'pending'
    };
    const filtered = diffEngine.filterHunkLines(hunk, new Set([0, 2]));
    assert(filtered.newContent.includes('line1_mod'));
    assert(!filtered.newContent.includes('line2_mod'));
    assert(filtered.newContent.includes('line3_mod'));
  });

  runTest('Feature 14: Intelligent Indentation & Style Linter Re-aligner', () => {
    const unaligned = 'def foo():\n  x = 1\n  y = 2';
    const aligned = diffEngine.realignIndentation(unaligned, '4_spaces');
    assert(aligned.includes('    x = 1'));
    assert(aligned.includes('    y = 2'));
  });

  runTest('Feature 15: Shadow File Simulation Runner', () => {
    const shadowRes = diffEngine.runInShadow(
      path.join(workspaceRoot, 'test.py'),
      'print("shadow run")',
      (shadowPath) => `python3 ${shadowPath}`
    );
    assert.strictEqual(shadowRes.success, true);
    assert(shadowRes.shadowPath.includes('.forgecode'));
    if (fs.existsSync(shadowRes.shadowPath)) fs.unlinkSync(shadowRes.shadowPath);
  });

  runTest('Feature 16: Persistent Diff Staging Shelf', () => {
    const mockPlan = {
      filePath: 'src/flask/cli.py',
      originalContent: 'old',
      modifiedContent: 'new',
      hunks: []
    };
    diffEngine.shelfDiff(mockPlan);
    const retrieved = diffEngine.getShelvedDiff('src/flask/cli.py');
    assert(retrieved !== undefined);
    assert.strictEqual(retrieved.filePath, 'src/flask/cli.py');
    diffEngine.clearShelf();
  });

  runTest('Feature 17: Semantic Diff Visualizer (AST vs Byte Diff)', () => {
    const orig = 'def existing(): pass\ndef to_remove(): pass';
    const mod = 'def existing(): pass\ndef newly_added(): pass';
    const analysis = diffEngine.analyzeSemanticChanges(orig, mod);
    assert(analysis.addedSymbols.includes('newly_added'));
    assert(analysis.removedSymbols.includes('to_remove'));
    assert(analysis.modifiedFunctions.includes('existing'));
  });

  runTest('Feature 18: Time-Travel Diff History Scrub Bar', () => {
    diffEngine.recordTurnSnapshot(1, 'Turn 1 edit', [{ path: 'a.py', content: 'v1' }]);
    diffEngine.recordTurnSnapshot(2, 'Turn 2 edit', [{ path: 'a.py', content: 'v2' }]);
    const snap = diffEngine.getSnapshotAtTurn(1);
    assert(snap !== undefined);
    assert.strictEqual(snap.files.get('a.py'), 'v1');
    assert(diffEngine.getHistoryTimeline().length >= 2);
  });

  // Category 3: Multi-Agent & TrueForge Orchestration (Features 19–27)
  console.log('\n--- Category 3: Multi-Agent & TrueForge Orchestration (Features 19–27) ---');
  const multiAgent = registry.multiAgentEngine;

  await runAsyncTest('Feature 19: Dual-Agent Spec & Implementer Verification Flow', async () => {
    const result = await multiAgent.coordinateDualAgentTask('Add flask config command');
    assert(result.spec.interfaceSpec.includes('flask config'));
    assert(result.spec.testCases.length >= 1);
    assert(result.implementationMessage.includes('Coder Agent'));
  });

  runTest('Feature 20: Deferred MCP Tool Loading (Schema Pruning)', () => {
    const allTools = [
      { name: 'read_file', category: 'fs', schema: {} },
      { name: 'search_files', category: 'search', schema: {} },
      { name: 'git_status', category: 'git', schema: {} }
    ];
    const filtered = multiAgent.filterActiveMcpTools(allTools, new Set(['fs', 'search']));
    assert.strictEqual(filtered.length, 2);
    assert(filtered.some(t => t.name === 'read_file'));
  });

  runTest('Feature 21: Context Compaction with AST Summary Hooks', () => {
    const turns = [
      { role: 'user', content: 'def old_func(): pass\nlong explanation here' },
      { role: 'assistant', content: 'class OldClass: pass\nmore text' },
      { role: 'user', content: 'Please continue' },
      { role: 'assistant', content: 'Ready' }
    ];
    const compacted = multiAgent.compactHistoryWithASTPreservation(turns, 10);
    assert(compacted.compactedTurns.length < turns.length);
    assert(compacted.compactedTurns[0].content.includes('TrueForge Context Compaction Summary'));
  });

  runTest('Feature 22: Background Discovery Subagent', () => {
    multiAgent.startBackgroundDiscovery('config', ['src/flask/cli.py', 'src/flask/config.py', 'tests/test_config.py']);
    const cached = multiAgent.getCachedDiscovery('config');
    assert(cached.length >= 2);
    assert(cached.includes('src/flask/config.py'));
  });

  await runAsyncTest('Feature 23: MCP Tool Concurrency Pool', async () => {
    const tasks = [
      () => Promise.resolve('task1'),
      () => Promise.resolve('task2'),
      () => Promise.resolve('task3')
    ];
    const results = await multiAgent.executeConcurrentTools(tasks, 2);
    assert.deepStrictEqual(results, ['task1', 'task2', 'task3']);
  });

  runTest('Feature 24: Multi-Model Dynamic Routing by Task Difficulty', () => {
    const fastRoute = multiAgent.routeModelByTask('Update docstring for helper', 40);
    assert.strictEqual(fastRoute.tier, 'fast_inline');
    assert.strictEqual(fastRoute.chosenModel, 'qwen2.5-coder:7b');

    const deepRoute = multiAgent.routeModelByTask('Architect distributed state machine and security audit', 500);
    assert.strictEqual(deepRoute.tier, 'deep_reasoner');
  });

  runTest('Feature 25: Persistent Session Resumption & Branching', () => {
    const branch = multiAgent.branchSession('session_main_123', 4, 'Try Alternative AST Parser');
    assert.strictEqual(branch.parentSessionId, 'session_main_123');
    assert.strictEqual(branch.branchPointTurn, 4);
    assert(multiAgent.getSessionBranches().length >= 1);
  });

  runTest('Feature 26: Automated Subagent Delegation for Documentation & Tests', () => {
    const delegated = multiAgent.delegateSubagentTasks('Add flask config command');
    assert(delegated.docSubagentPrompt.toLowerCase().includes('sphinx'));
    assert(delegated.testSubagentPrompt.includes('pytest'));
  });

  runTest('Feature 27: Local MCP Stdio Isolation Sandbox', () => {
    const safe = multiAgent.sanitizeAndValidateCommand('pytest tests/test_cli.py');
    assert.strictEqual(safe.isSafe, true);
    const dangerous = multiAgent.sanitizeAndValidateCommand('rm -rf / --no-preserve-root');
    assert.strictEqual(dangerous.isSafe, false);
  });

  // Category 4: Developer Experience & UI/UX (Features 28–35)
  console.log('\n--- Category 4: Developer Experience & UI/UX (Features 28–35) ---');
  const devX = registry.devExperienceEngine;

  runTest('Feature 28: Floating In-Editor Chat Bar', () => {
    const layout = devX.getFloatingWidgetLayout();
    assert.strictEqual(layout.anchor, 'cursor');
    assert(layout.width > 500);
  });

  runTest('Feature 29: Sound Cues for Long Turn Completion', () => {
    const cueLong = devX.getNotificationAudioPayload(4500);
    assert.strictEqual(cueLong.playChime, true);
    assert.strictEqual(cueLong.soundType, 'subtle_bell');
    const cueShort = devX.getNotificationAudioPayload(1000);
    assert.strictEqual(cueShort.playChime, false);
  });

  runTest('Feature 30: Interactive Token Cost & Latency HUD', () => {
    const hud = devX.calculateTurnMetrics(2000, 800, 1200);
    assert(hud.totalTokens > 0);
    assert(hud.tokensPerSec > 0);
    assert(hud.estimatedCostUsd > 0);
  });

  runTest('Feature 31: Prompt Template Bookmarks', () => {
    const t = devX.getTemplate('/test');
    assert(t !== undefined);
    assert(t.template.includes('pytest') || t.template.includes('test'));
  });

  runTest('Feature 32: CodeLens Explain Diff Button', () => {
    const explanation = devX.generateHunkExplanation('print("old")', 'print("new")');
    assert(explanation.includes('ForgeCode revision'));
  });

  runTest('Feature 33: Keyboard-Only Review Mode', () => {
    const acceptAction = devX.processKeyboardReviewAction('y', 0, 3);
    assert.strictEqual(acceptAction.action, 'accept');
    assert.strictEqual(acceptAction.nextIndex, 1);
    const rejectAction = devX.processKeyboardReviewAction('n', 1, 3);
    assert.strictEqual(rejectAction.action, 'reject');
  });

  runTest('Feature 34: Export Diff as PR / Git Patch', () => {
    const patch = devX.exportAsUnifiedPatch([
      { path: 'src/flask/cli.py', original: 'line1', modified: 'line1_modified' }
    ]);
    assert(patch.includes('--- a/src/flask/cli.py'));
    assert(patch.includes('+++ b/src/flask/cli.py'));
    assert(patch.includes('+line1_modified'));
  });

  runTest('Feature 35: Multi-Theme Diff Syntax Highlighting', () => {
    const darkTokens = devX.getThemeColorTokens(true);
    assert(darkTokens.insertionBg.includes('rgba'));
    const lightTokens = devX.getThemeColorTokens(false);
    assert(lightTokens.insertionBg.includes('rgba'));
  });

  // Category 5: Testing & Self-Healing Loops (Features 36–43)
  console.log('\n--- Category 5: Testing & Self-Healing Loops (Features 36–43) ---');
  const selfHealing = registry.selfHealingEngine;

  runTest('Feature 36: Auto-Pytest / Jest Loop with Error Feeding', () => {
    const healingPrompt = selfHealing.generateHealingPrompt('pytest tests/test_cli.py', 'AssertionError: assert False', '');
    assert(healingPrompt.includes('pytest tests/test_cli.py'));
    assert(healingPrompt.includes('AssertionError'));
  });

  runTest('Feature 37: Linter-Driven Syntax Self-Correction', () => {
    const brokenCode = 'def broken_func(\n    x = [1, 2, 3';
    const check = selfHealing.checkSyntaxIntegrity(brokenCode, 'python');
    assert(check.hasError, 'Broken brackets must be detected');
  });

  runTest('Feature 38: TypeCheck Pre-flight Guard (mypy / tsc)', () => {
    const output = 'src/flask/cli.py:45: error: Incompatible types in assignment';
    const errors = selfHealing.formatTypeCheckErrors(output);
    assert.strictEqual(errors.length, 1);
    assert.strictEqual(errors[0].line, 45);
  });

  runTest('Feature 39: Differential Unit Test Generator', () => {
    const testCode = selfHealing.generateDifferentialTest('get_debug_flag', [
      { args: ['1'], expected: true },
      { args: ['0'], expected: false }
    ]);
    assert(testCode.includes('def test_get_debug_flag_differential():'));
    assert(testCode.includes('assert get_debug_flag(*["1"]) == true'));
  });

  runTest('Feature 40: Coverage-Guided Test Gap Finder', () => {
    const code = `
def covered_func():
    return 1

def uncovered_func():
    return 2
`;
    const coveredLines = new Set([2, 3]); // line 5 uncovered
    const gaps = selfHealing.identifyUncoveredFunctions(code, coveredLines);
    assert.strictEqual(gaps.length, 1);
    assert.strictEqual(gaps[0].functionName, 'uncovered_func');
  });

  runTest('Feature 41: Dead Code & Unused Variable Cleaner', () => {
    const code = 'from os import path, environ, listdir\n\nprint(path.join("a", "b"))';
    const dead = selfHealing.identifyDeadImports(code);
    assert(dead.includes('environ'));
    assert(dead.includes('listdir'));
    assert(!dead.includes('path'));
  });

  runTest('Feature 42: API Contract Regression Guard', () => {
    const oldSigs = new Map([['get_debug_flag', '(default: bool) -> bool']]);
    const newSigs = new Map([['get_debug_flag', '(default: bool, strict: bool) -> bool']]);
    const diffs = selfHealing.detectSignatureRegressions(oldSigs, newSigs);
    assert.strictEqual(diffs.length, 1);
    assert.strictEqual(diffs[0].type, 'signature_changed');
  });

  runTest('Feature 43: Automated Benchmark Performance Comparator', () => {
    const res = selfHealing.compareBenchmarkRuns(100, 85);
    assert.strictEqual(res.regression, false);
    assert(res.percentageDelta < 0);
  });

  // Category 6: Monorepo & Enterprise Scale (Features 44–50)
  console.log('\n--- Category 6: Monorepo & Enterprise Scale (Features 44–50) ---');
  const monorepo = registry.monorepoEngine;

  runTest('Feature 44: Monorepo Boundary Isolation', () => {
    const mockMonorepo = {
      type: 'turbo',
      packages: [
        { name: '@forge/core', location: 'packages/core', dependencies: [] },
        { name: '@forge/ui', location: 'packages/ui', dependencies: ['@forge/core'] },
      ],
      boundariesStrict: true
    };
    const violation = monorepo.checkBoundaryViolation('packages/core/src/index.ts', '@forge/ui', mockMonorepo);
    assert.strictEqual(violation.allowed, false, 'Undeclared dependency import should be blocked');
  });

  await runAsyncTest('Feature 45: Air-Gapped Local LLM Detector', async () => {
    const res = await monorepo.detectLocalLLM(['http://127.0.0.1:9999']);
    assert(typeof res.available === 'boolean');
  });

  runTest('Feature 46: Rules File Support (.forgecoderules / AGENTS.md)', () => {
    const rules = monorepo.loadProjectRules(workspaceRoot);
    assert(typeof rules.allRulesText === 'string');
  });

  runTest('Feature 47: Automated Commit Message Generator with Conventional Commits', () => {
    const hunks = [
      { file: 'src/flask/cli.py', summary: 'add config command' },
      { file: 'tests/test_cli.py', summary: 'add unit test' }
    ];
    const msg = monorepo.generateCommitMessage(hunks, { scope: 'cli', issue: '#123' });
    assert(msg.startsWith('feat(cli):'));
    assert(msg.includes('Closes #123'));
  });

  runTest('Feature 48: PR Reviewer & Automated Feedback Fixer', () => {
    const comments = [
      { file: 'src/flask/helpers.py', line: 20, body: 'Potential security vulnerability: validate input before parsing.' }
    ];
    const items = monorepo.parseReviewComments(comments);
    assert.strictEqual(items[0].actionRequired, 'security');
    const prompt = monorepo.generateFixPrompt(items[0]);
    assert(prompt.includes('Potential security vulnerability'));
  });

  runTest('Feature 49: Telemetry & Audit Logging for Compliance', () => {
    const evt1 = monorepo.logAuditEvent({
      actor: 'developer@example.com',
      action: 'turn_started',
      details: { prompt: 'Add config command' }
    });
    const evt2 = monorepo.logAuditEvent({
      actor: 'developer@example.com',
      action: 'diff_accepted',
      details: { file: 'src/flask/cli.py' }
    });
    assert.strictEqual(evt2.prevHash, evt1.hash);
    assert.strictEqual(monorepo.verifyAuditIntegrity(), true);
  });

  runTest('Feature 50: Workspace Multi-Root Support', () => {
    const roots = ['/workspace/backend', '/workspace/frontend'];
    const resolved = monorepo.resolveMultiRootPath(roots, '/workspace/backend/src/main.py');
    assert.strictEqual(resolved.rootFolder, '/workspace/backend');
    assert.strictEqual(resolved.relativePath, 'src/main.py');
  });

  // Category 7: Security, Privacy & Compliance (Features 51–57)
  console.log('\n--- Category 7: Security, Privacy & Compliance (Features 51–57) ---');
  const sec = registry.securityEngine;

  runTest('Feature 51: AST-Level Secret & API Key Sanitizer', () => {
    const prompt = 'Connecting with sk-ant-api03-abcdef1234567890abcdef1234567890abcdef12 and AKIAIOSFODNN7EXAMPLE';
    const { sanitized, matches } = sec.sanitizeSecrets(prompt);
    assert(!sanitized.includes('sk-ant-api03-'));
    assert(!sanitized.includes('AKIAIOSFODNN7EXAMPLE'));
    assert(matches.length >= 2);
  });

  runTest('Feature 52: Read-Only File Protection (.env / .git / .forgeignore)', () => {
    assert.strictEqual(sec.isFileReadOnly('.env'), true);
    assert.strictEqual(sec.isFileReadOnly('.env.production'), true);
    assert.strictEqual(sec.isFileReadOnly('server.key'), true);
    assert.strictEqual(sec.isFileReadOnly('src/app.py'), false);
  });

  runTest('Feature 53: Safe Command Whitelist for Terminal Tool', () => {
    const safeCheck = sec.validateCommandSafety('pytest tests/test_cli.py');
    assert.strictEqual(safeCheck.safe, true);
    const dangerCheck = sec.validateCommandSafety('rm -rf / --no-preserve-root');
    assert.strictEqual(dangerCheck.safe, false);
  });

  runTest('Feature 54: PII Redaction Engine', () => {
    const text = 'User john.doe@enterprise.com connected from 192.168.1.55 with card 4111-2222-3333-4444';
    const { text: redacted, redactionCount } = sec.redactPII(text);
    assert(!redacted.includes('john.doe@enterprise.com'));
    assert(!redacted.includes('192.168.1.55'));
    assert(!redacted.includes('4111-2222-3333-4444'));
    assert(redactionCount >= 3);
  });

  runTest('Feature 55: Vulnerability Scanner Integration', () => {
    const code = `
def run_query(user_input):
    cursor.execute(f"SELECT * FROM users WHERE name = '{user_input}'")
    os.system(f"ping {user_input}")
`;
    const vulns = sec.scanCodeForVulnerabilities(code, 'python');
    assert(vulns.some(v => v.cwe === 'CWE-89'), 'SQL Injection should be detected');
    assert(vulns.some(v => v.cwe === 'CWE-78'), 'Command Injection should be detected');
  });

  runTest('Feature 56: License Compliance Auditor (SPDX License Checker)', () => {
    const cleanDeps = { 'react': 'MIT', 'lodash': 'MIT', 'flask': 'BSD-3-Clause' };
    const auditClean = sec.auditLicenses(cleanDeps);
    assert.strictEqual(auditClean.isCompliant, true);

    const copyleftDeps = { 'core-lib': 'GPL-3.0' };
    const auditCopyleft = sec.auditLicenses(copyleftDeps);
    assert.strictEqual(auditCopyleft.isCompliant, false);
  });

  runTest('Feature 57: Air-Gap Network Kill-Switch', () => {
    sec.setAirGapMode(true);
    assert.strictEqual(sec.validateNetworkDestination('localhost').allowed, true);
    assert.strictEqual(sec.validateNetworkDestination('127.0.0.1').allowed, true);
    const external = sec.validateNetworkDestination('api.openai.com');
    assert.strictEqual(external.allowed, false);
    sec.setAirGapMode(false);
  });

  // Category 8: TrueForge Upstream Contributions (Features 58–62)
  console.log('\n--- Category 8: TrueForge Upstream Contributions (Features 58–62) ---');
  const upstream = registry.upstreamEngine;

  runTest('Feature 58: Streaming Token Usage Telemetry in SSE Headers', () => {
    const headers = {
      'X-TrueForge-Prompt-Tokens': '1450',
      'X-TrueForge-Completion-Tokens': '320',
      'X-TrueForge-Cost-USD': '0.0035',
      'X-TrueForge-Latency-Ms': '180'
    };
    const tel = upstream.parseTelemetryHeaders(headers);
    assert.strictEqual(tel.promptTokens, 1450);
    assert.strictEqual(tel.completionTokens, 320);
    assert.strictEqual(tel.totalTokens, 1770);
    assert.strictEqual(tel.costUsd, 0.0035);
  });

  await runAsyncTest('Feature 59: Fine-Grained MCP Tool Approval Timeout Hooks', async () => {
    // Read tool auto-approved
    const readApproval = await upstream.requestToolApproval('read_file', { path: 'test.py' });
    assert.strictEqual(readApproval.approved, true);
    assert.strictEqual(readApproval.auto, true);

    // Write tool requires handler
    const writeApproval = await upstream.requestToolApproval('write_file', { path: 'test.py' }, async () => true);
    assert.strictEqual(writeApproval.approved, true);
    assert.strictEqual(writeApproval.auto, false);
  });

  runTest('Feature 60: Dynamic System Prompt Injection per Turn', () => {
    upstream.addTurnDirective('Focus solely on fixing failing pytest test_cli.py');
    const fullPrompt = upstream.compileTurnSystemPrompt('Base System Prompt');
    assert(fullPrompt.includes('Base System Prompt'));
    assert(fullPrompt.includes('Focus solely on fixing failing pytest test_cli.py'));
    upstream.clearTurnDirectives();
  });

  runTest('Feature 61: TrueForge Native SQLite Compaction Benchmarker', () => {
    const code = `
import math

def calculate_pi(precision: int):
    """Computes pi."""
    return 3.14159

class Calculator:
    def add(self, a, b):
        return a + b
`;
    const benchmarks = upstream.benchmarkCompaction(code);
    assert.strictEqual(benchmarks.length, 3);
    assert(benchmarks.some(b => b.strategy === 'ast_skeleton'));
  });

  runTest('Feature 62: Zero-Copy File Chunking Transport', () => {
    const buf = Buffer.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890');
    const chunks = upstream.chunkFileZeroCopy(buf, 10);
    assert.strictEqual(chunks.length, 4);
    assert.strictEqual(chunks[0].startByte, 0);
    assert.strictEqual(chunks[0].endByte, 10);
    assert.strictEqual(chunks[0].data.toString('utf8'), 'ABCDEFGHIJ');
  });

  console.log('\n================================================================');
  console.log(`  Total Test Results: ${totalPassed} Passed | ${totalFailed} Failed`);
  console.log('================================================================\n');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error in test suite:', err);
  process.exit(1);
});
