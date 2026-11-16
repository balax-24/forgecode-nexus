/**
 * ForgeCode: Main Extension Activation
 * TrueFoundry Forge-a-thon Official Implementation
 */

import * as vscode from 'vscode';
import { TrueForgeClient } from './TrueForgeClient';
import { ContextAssembler } from './ContextAssembler';
import { EditorMcpServer } from './EditorMcpServer';
import { HunkReviewDecorator } from './HunkReviewDecorator';
import { UndoManager } from './UndoManager';
import { ResilienceManager } from './ResilienceManager';
import { InlineEditController } from './InlineEditController';
import { SidebarProvider } from './SidebarProvider';
import { DiffManager } from './DiffManager';
import { FeatureRegistry } from './features/FeatureRegistry';
import { AdvancedContextEngine } from './features/AdvancedContextEngine';
import { DiffSafetyEngine } from './features/DiffSafetyEngine';
import { MultiAgentEngine } from './features/MultiAgentEngine';
import { DevExperienceEngine } from './features/DevExperienceEngine';
import { SelfHealingEngine } from './features/SelfHealingEngine';
import { EnterpriseMonorepoEngine } from './features/EnterpriseMonorepoEngine';
import { SecurityPrivacyEngine } from './features/SecurityPrivacyEngine';
import { TrueForgeUpstreamEngine } from './features/TrueForgeUpstreamEngine';

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  console.log('[ForgeCode] Activating extension...');

  const config = vscode.workspace.getConfiguration('forgecode');
  const baseUrl = config.get<string>('trueforgeUrl', 'http://127.0.0.1:8790');
  const primaryModel = config.get<string>('primaryModel', 'gpt-4o-mini');
  const fallbackModel = config.get<string>('fallbackModel', 'qwen2.5-coder:7b');
  const tokenBudget = config.get<number>('contextTokenBudget', 8000);
  const autoFallback = config.get<boolean>('autoFallbackEnabled', true);

  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();

  // Initialize core subsystem singletons
  const trueforgeClient = new TrueForgeClient({
    baseUrl,
    primaryModel,
    fallbackModel,
    tokenBudget,
    autoFallback,
  });

  const undoManager = UndoManager.getInstance();
  const contextAssembler = new ContextAssembler(workspaceRoot, tokenBudget);
  const mcpServer = new EditorMcpServer(workspaceRoot);
  const hunkDecorator = new HunkReviewDecorator();
  const resilienceManager = new ResilienceManager(trueforgeClient, workspaceRoot);

  const inlineEditController = new InlineEditController(trueforgeClient, hunkDecorator, resilienceManager);

  // Register CodeLens Provider for in-editor [Accept Hunk] / [Reject Hunk]
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider({ scheme: 'file' }, hunkDecorator)
  );

  // Register Sidebar Webview View Provider
  const sidebarProvider = new SidebarProvider(
    context.extensionUri,
    trueforgeClient,
    contextAssembler,
    mcpServer,
    hunkDecorator,
    undoManager,
    resilienceManager
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, sidebarProvider)
  );

  // Command: forgecode.inlineEdit (Ctrl+Shift+I / Cmd+Shift+I)
  context.subscriptions.push(
    vscode.commands.registerCommand('forgecode.inlineEdit', async () => {
      await inlineEditController.executeInlineEdit();
    })
  );

  // Command: forgecode.openPanel
  context.subscriptions.push(
    vscode.commands.registerCommand('forgecode.openPanel', () => {
      vscode.commands.executeCommand('workbench.view.extension.forgecode-sidebar');
    })
  );

  // Command: forgecode.acceptHunk
  context.subscriptions.push(
    vscode.commands.registerCommand('forgecode.acceptHunk', async (hunkId: string, filePath: string) => {
      await hunkDecorator.acceptHunk(hunkId, filePath);
    })
  );

  // Command: forgecode.rejectHunk
  context.subscriptions.push(
    vscode.commands.registerCommand('forgecode.rejectHunk', async (hunkId: string, filePath: string) => {
      await hunkDecorator.rejectHunk(hunkId, filePath);
    })
  );

  // Command: forgecode.undoLastApply
  context.subscriptions.push(
    vscode.commands.registerCommand('forgecode.undoLastApply', async () => {
      await sidebarProvider.handleUndo();
    })
  );

  // Command: forgecode.showSessionInspector
  context.subscriptions.push(
    vscode.commands.registerCommand('forgecode.showSessionInspector', () => {
      const history = resilienceManager.getFailoverHistory();
      const failoverText = history.length > 0
        ? `Failover events logged: ${history.length}`
        : 'Running on primary endpoint with zero failover events.';

      vscode.window.showInformationMessage(`TrueForge Agent Status: Connected to ${baseUrl} | ${failoverText}`);
    })
  );

  // Status Bar Integration
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'forgecode.showSessionInspector';
  statusBarItem.text = '$(zap) ForgeCode: TrueForge (8790)';
  statusBarItem.tooltip = 'Click to inspect TrueForge agent session & model status';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Initialize Feature Registry (62 Production Features)
  const featureRegistry = FeatureRegistry.getInstance(workspaceRoot);

  // Command: forgecode.showFeatureCatalog
  context.subscriptions.push(
    vscode.commands.registerCommand('forgecode.showFeatureCatalog', () => {
      const count = featureRegistry.getFeatureCount();
      vscode.window.showInformationMessage(`ForgeCode Active Features: ${count}/62 across 8 categories enabled.`);
    })
  );

  console.log(`[ForgeCode] Loaded ${featureRegistry.getFeatureCount()} features into registry.`);
  console.log('[ForgeCode] Extension activated successfully.');
}

export function deactivate() {
  console.log('[ForgeCode] Extension deactivated.');
}

export {
  TrueForgeClient,
  ContextAssembler,
  EditorMcpServer,
  HunkReviewDecorator,
  UndoManager,
  ResilienceManager,
  InlineEditController,
  SidebarProvider,
  DiffManager,
  FeatureRegistry,
  AdvancedContextEngine,
  DiffSafetyEngine,
  MultiAgentEngine,
  DevExperienceEngine,
  SelfHealingEngine,
  EnterpriseMonorepoEngine,
  SecurityPrivacyEngine,
  TrueForgeUpstreamEngine,
};

