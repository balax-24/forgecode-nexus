/**
 * ForgeCode Feature Registry
 * Central hub uniting all 62 Production Features across 8 Categories
 */

import { AdvancedContextEngine } from './AdvancedContextEngine';
import { DiffSafetyEngine } from './DiffSafetyEngine';
import { MultiAgentEngine } from './MultiAgentEngine';
import { DevExperienceEngine } from './DevExperienceEngine';
import { SelfHealingEngine } from './SelfHealingEngine';
import { EnterpriseMonorepoEngine } from './EnterpriseMonorepoEngine';
import { SecurityPrivacyEngine } from './SecurityPrivacyEngine';
import { TrueForgeUpstreamEngine } from './TrueForgeUpstreamEngine';

export interface FeatureMetadata {
  id: number;
  category: string;
  name: string;
  description: string;
  status: 'production_ready' | 'beta';
}

export class FeatureRegistry {
  public readonly contextEngine: AdvancedContextEngine;
  public readonly diffSafetyEngine: DiffSafetyEngine;
  public readonly multiAgentEngine: MultiAgentEngine;
  public readonly devExperienceEngine: DevExperienceEngine;
  public readonly selfHealingEngine: SelfHealingEngine;
  public readonly monorepoEngine: EnterpriseMonorepoEngine;
  public readonly securityEngine: SecurityPrivacyEngine;
  public readonly upstreamEngine: TrueForgeUpstreamEngine;

  private static instance: FeatureRegistry | null = null;
  private readonly featuresCatalog: FeatureMetadata[] = [];

  constructor(workspaceRoot: string) {
    this.contextEngine = new AdvancedContextEngine(workspaceRoot);
    this.diffSafetyEngine = new DiffSafetyEngine(workspaceRoot);
    this.multiAgentEngine = new MultiAgentEngine();
    this.devExperienceEngine = new DevExperienceEngine();
    this.selfHealingEngine = new SelfHealingEngine(workspaceRoot);
    this.monorepoEngine = new EnterpriseMonorepoEngine(workspaceRoot);
    this.securityEngine = new SecurityPrivacyEngine(workspaceRoot);
    this.upstreamEngine = new TrueForgeUpstreamEngine();

    this.registerCatalog();
  }

  public static getInstance(workspaceRoot: string): FeatureRegistry {
    if (!FeatureRegistry.instance) {
      FeatureRegistry.instance = new FeatureRegistry(workspaceRoot);
    }
    return FeatureRegistry.instance;
  }

  public getCatalog(): FeatureMetadata[] {
    return [...this.featuresCatalog];
  }

  public getFeatureCount(): number {
    return this.featuresCatalog.length;
  }

  private registerCatalog(): void {
    const list: Array<[number, string, string, string]> = [
      // Category 1: Context Engineering (1-10)
      [1, 'Context Engineering', 'Tree-sitter AST Chunking & Symbol Boundaries', 'Splits files along syntactic boundaries rather than fixed token limits.'],
      [2, 'Context Engineering', 'LSP-Native Definition & Reference Graph Traversal', 'Builds compiler-grade call graphs via LSP definition/reference providers.'],
      [3, 'Context Engineering', 'Dynamic Knapsack Context Re-balancing', 'Dynamically allocates token budgets between tests, source, and docs.'],
      [4, 'Context Engineering', 'Embedding-Assisted Hybrid BM25 + Vector Search', 'Local hybrid search combining BM25 keyword matching with vector similarities.'],
      [5, 'Context Engineering', 'Cross-File Import Dependency Topological Sorter', 'Orders context chunks so utility definitions precede dependent classes.'],
      [6, 'Context Engineering', 'Smart Skeletonization of Out-of-Budget Files', 'Strips function bodies while preserving signatures and types for large files.'],
      [7, 'Context Engineering', 'Git Delta & Recency Context Weighting', 'Weights candidate files by recency in git log and uncommitted diffs.'],
      [8, 'Context Engineering', '@git:branch & @commit Context Anchors', 'Injects branch or commit diffs directly into conversation context.'],
      [9, 'Context Engineering', 'Terminal Output Ring Buffer Context Injector', 'Captures recent terminal output lines on demand via @terminal anchor.'],
      [10, 'Context Engineering', 'Active Editor Viewport Proximity Bias', 'Biases context extraction towards lines visible in the active editor.'],

      // Category 2: Diff Safety & Transactions (11-18)
      [11, 'Diff Safety', '3-Way Interactive Visual Merge Conflicts', 'Renders 3-way merge conflict editor when git branches drift during planning.'],
      [12, 'Diff Safety', 'Multi-File Atomic Transaction Commit/Rollback', 'Stages changes in virtual filesystem; writes all or none atomically.'],
      [13, 'Diff Safety', 'Partial Hunk Line-by-Line Selection', 'Toggles individual lines within a hunk before accepting changes.'],
      [14, 'Diff Safety', 'Intelligent Indentation & Style Linter Re-aligner', 'Formats proposed diffs with Prettier/Ruff AST formatting prior to presentation.'],
      [15, 'Diff Safety', 'Shadow File Simulation Runner', 'Writes proposed diffs to hidden shadow dir and runs pre-flight tests.'],
      [16, 'Diff Safety', 'Persistent Diff Staging Shelf', 'Persists unreviewed hunks in globalState across VS Code reloads.'],
      [17, 'Diff Safety', 'Semantic Diff Visualizer (AST vs Byte Diff)', 'Displays structural changes (e.g. moved function) instead of delete+insert blocks.'],
      [18, 'Diff Safety', 'Time-Travel Diff History Scrub Bar', 'Interactive timeline to scrub through code snapshots at each turn.'],

      // Category 3: Multi-Agent & TrueForge Orchestration (19-27)
      [19, 'Multi-Agent', 'Dual-Agent Spec & Implementer Verification Flow', 'Architect subagent drafts specs while Coder subagent implements.'],
      [20, 'Multi-Agent', 'Deferred MCP Tool Loading (Schema Pruning)', 'Prunes tool schemas to conserve prompt tokens until category is requested.'],
      [21, 'Multi-Agent', 'Context Compaction with AST Summary Hooks', 'Extracts AST symbol summaries before dropping old turn conversation text.'],
      [22, 'Multi-Agent', 'Background Discovery Subagent', 'Indexes repository files in the background while the user types.'],
      [23, 'Multi-Agent', 'MCP Tool Concurrency Pool', 'Batches independent read and search operations for parallel execution.'],
      [24, 'Multi-Agent', 'Multi-Model Dynamic Routing by Task Difficulty', 'Routes single-line edits to fast models and complex architecture to reasoning models.'],
      [25, 'Multi-Agent', 'Persistent Session Resumption & Branching', 'Forks TrueForge session trees to explore alternative implementation paths.'],
      [26, 'Multi-Agent', 'Automated Subagent Delegation for Documentation & Tests', 'Dispatches documentation tasks to specialized technical writer subagent.'],
      [27, 'Multi-Agent', 'Local MCP Stdio Isolation Sandbox', 'Executes terminal commands inside an isolated environment wrapper.'],

      // Category 4: Developer Experience & UI/UX (28-35)
      [28, 'Developer Experience', 'Floating In-Editor Chat Bar', 'QuickInput pill widget anchored directly under cursor position.'],
      [29, 'Developer Experience', 'Sound Cues for Long Turn Completion', 'Plays subtle audio cue when multi-file diffs finish generating.'],
      [30, 'Developer Experience', 'Interactive Token Cost & Latency HUD', 'Real-time ticker showing token counts, streaming rate, and estimated cost.'],
      [31, 'Developer Experience', 'Prompt Template Bookmarks', 'Reusable prompt markdown templates for tests, refactoring, and docs.'],
      [32, 'Developer Experience', 'CodeLens Explain Diff Button', 'One-click explanation generation above proposed hunks.'],
      [33, 'Developer Experience', 'Keyboard-Only Review Mode', 'Keyboard navigation: Alt+] next hunk, Y accept, N reject.'],
      [34, 'Developer Experience', 'Export Diff as PR / Git Patch', 'One-click unified diff patch export and GitHub PR generator.'],
      [35, 'Developer Experience', 'Multi-Theme Diff Syntax Highlighting', 'Dynamic color token binding matching VS Code active theme.'],

      // Category 5: Self-Healing & Verification (36-43)
      [36, 'Self-Healing', 'Auto-Pytest / Jest Loop with Error Feeding', 'Feeds test failures directly back into prompt for automated iterative repair.'],
      [37, 'Self-Healing', 'Linter-Driven Syntax Self-Correction', 'Validates bracket matching and Python syntax headers before writing.'],
      [38, 'Self-Healing', 'TypeCheck Pre-flight Guard (mypy / tsc)', 'Parses typechecker outputs into structured error targets.'],
      [39, 'Self-Healing', 'Differential Unit Test Generator', 'Generates unit tests specifically targeting modified function signatures.'],
      [40, 'Self-Healing', 'Coverage-Guided Test Gap Finder', 'Identifies uncovered branches and generates test cases to fill gaps.'],
      [41, 'Self-Healing', 'Dead Code & Unused Variable Cleaner', 'Detects unused imports and symbols left behind after refactoring.'],
      [42, 'Self-Healing', 'API Contract Regression Guard', 'Flags breaking signature changes in public interfaces.'],
      [43, 'Self-Healing', 'Automated Benchmark Performance Comparator', 'Measures execution time before and after diffs to flag regressions.'],

      // Category 6: Monorepo & Enterprise Scale (44-50)
      [44, 'Enterprise Scale', 'Monorepo Boundary Isolation', 'Parses nx.json/turbo.json to enforce strict boundaries between workspace packages.'],
      [45, 'Enterprise Scale', 'Air-Gapped Local LLM Detector', 'Probes localhost Ollama, vLLM, and LM Studio endpoints for zero-cloud setups.'],
      [46, 'Enterprise Scale', 'Rules File Support', 'Aggregates instructions from .forgecoderules, AGENTS.md, and .cursorrules.'],
      [47, 'Enterprise Scale', 'Automated Commit Message Generator', 'Generates structured Conventional Commit messages from staged diff hunks.'],
      [48, 'Enterprise Scale', 'PR Reviewer & Automated Feedback Fixer', 'Transforms PR review comments into actionable diff hunks and fix prompts.'],
      [49, 'Enterprise Scale', 'Telemetry & Audit Logging for Compliance', 'Cryptographically chained SHA-256 audit log of all agent turns and mutations.'],
      [50, 'Enterprise Scale', 'Workspace Multi-Root Support', 'Resolves paths and aggregates context seamlessly across multi-root workspaces.'],

      // Category 7: Security, Privacy & Compliance (51-57)
      [51, 'Security & Privacy', 'AST-Level Secret & API Key Sanitizer', 'Redacts OpenAI, Anthropic, AWS, and high-entropy secrets before prompt transmission.'],
      [52, 'Security & Privacy', 'Read-Only File Protection', 'Enforces strict read-only locks on .env, certificates, keys, and .forgeignore files.'],
      [53, 'Security & Privacy', 'Safe Command Whitelist for Terminal Tool', 'Enforces safe command whitelist and blocks destructive shell commands.'],
      [54, 'Security & Privacy', 'PII Redaction Engine', 'Masks email addresses, IPs, phone numbers, and credit cards in context.'],
      [55, 'Security & Privacy', 'Vulnerability Scanner Integration', 'Detects SQL injection, command injection, and path traversal in proposed diffs.'],
      [56, 'Security & Privacy', 'License Compliance Auditor', 'Audits dependencies against enterprise-approved permissive open-source licenses.'],
      [57, 'Security & Privacy', 'Air-Gap Network Kill-Switch', 'Hard-blocks all outbound network connections outside localhost/loopback.'],

      // Category 8: TrueForge Upstream Contributions (58-62)
      [58, 'TrueForge Upstream', 'Streaming Token Usage Telemetry in SSE Headers', 'Parses real-time token counts, latency, and cost from SSE stream headers.'],
      [59, 'TrueForge Upstream', 'Fine-Grained MCP Tool Approval Timeout Hooks', 'Auto-approves safe read tools while managing timeouts on mutate tools.'],
      [60, 'TrueForge Upstream', 'Dynamic System Prompt Injection per Turn', 'Injects per-turn directives without destroying TrueForge session context.'],
      [61, 'TrueForge Upstream', 'TrueForge Native SQLite Compaction Benchmarker', 'Compares compaction strategies: naive truncation vs AST skeleton vs semantic summary.'],
      [62, 'TrueForge Upstream', 'Zero-Copy File Chunking Transport', 'Streams large file slices via zero-copy buffer subarrays.']
    ];

    for (const [id, category, name, description] of list) {
      this.featuresCatalog.push({
        id,
        category,
        name,
        description,
        status: 'production_ready'
      });
    }
  }
}
