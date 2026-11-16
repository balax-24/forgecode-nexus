/**
 * ForgeCode HunkReviewDecorator
 * Criteria A1 (In-editor diff rendering with per-hunk accept/reject)
 * & B2 (Hunk-by-hunk review prior to write)
 * 
 * Uses VS Code TextEditorDecorationType and CodeLensProvider to render diff hunks
 * directly in the editor buffer with per-hunk [Accept] and [Reject] actions.
 */

import * as vscode from 'vscode';
import { DiffHunk, FileHunkPlan } from './types';
import { DiffManager } from './DiffManager';
import { UndoManager } from './UndoManager';

export class HunkReviewDecorator implements vscode.CodeLensProvider {
  private activePlans: Map<string, FileHunkPlan> = new Map();
  private onDidChangeCodeLensesEmitter = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses = this.onDidChangeCodeLensesEmitter.event;

  private insertionDecorationType: vscode.TextEditorDecorationType;
  private deletionDecorationType: vscode.TextEditorDecorationType;

  constructor() {
    this.insertionDecorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(46, 160, 67, 0.18)',
      isWholeLine: true,
      overviewRulerColor: 'rgba(46, 160, 67, 0.8)',
      overviewRulerLane: vscode.OverviewRulerLane.Left,
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
    });

    this.deletionDecorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(248, 81, 73, 0.18)',
      isWholeLine: true,
      textDecoration: 'line-through',
      overviewRulerColor: 'rgba(248, 81, 73, 0.8)',
      overviewRulerLane: vscode.OverviewRulerLane.Left,
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
    });
  }

  /**
   * Set or update the active hunk plan for a file.
   */
  public setPlan(plan: FileHunkPlan, editor?: vscode.TextEditor): void {
    this.activePlans.set(plan.filePath, plan);
    this.onDidChangeCodeLensesEmitter.fire();

    if (editor && editor.document.uri.fsPath === plan.filePath) {
      this.refreshDecorations(editor);
    }
  }

  /**
   * Get the active hunk plan for a file path.
   */
  public getPlan(filePath: string): FileHunkPlan | undefined {
    return this.activePlans.get(filePath);
  }

  /**
   * Refresh decorations in the active editor.
   */
  public refreshDecorations(editor: vscode.TextEditor): void {
    const plan = this.activePlans.get(editor.document.uri.fsPath);
    if (!plan) {
      editor.setDecorations(this.insertionDecorationType, []);
      editor.setDecorations(this.deletionDecorationType, []);
      return;
    }

    const deletionRanges: vscode.Range[] = [];
    const insertionRanges: vscode.Range[] = [];

    for (const hunk of plan.hunks) {
      if (hunk.status !== 'pending') continue;

      const startLine = Math.max(0, hunk.oldStart - 1);
      const endLine = Math.max(startLine, startLine + Math.max(1, hunk.oldLines) - 1);

      deletionRanges.push(new vscode.Range(startLine, 0, endLine, 999));
    }

    editor.setDecorations(this.deletionDecorationType, deletionRanges);
    editor.setDecorations(this.insertionDecorationType, insertionRanges);
  }

  /**
   * Provide CodeLens [Accept Hunk] and [Reject Hunk] above each pending hunk.
   */
  public provideCodeLenses(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.CodeLens[] {
    const lenses: vscode.CodeLens[] = [];
    const plan = this.activePlans.get(document.uri.fsPath);
    if (!plan) return lenses;

    for (const hunk of plan.hunks) {
      if (hunk.status !== 'pending') continue;

      const line = Math.max(0, hunk.oldStart - 1);
      const range = new vscode.Range(line, 0, line, 0);

      const acceptLens = new vscode.CodeLens(range, {
        title: `✓ Accept Hunk (${hunk.id})`,
        command: 'forgecode.acceptHunk',
        arguments: [hunk.id, plan.filePath],
      });

      const rejectLens = new vscode.CodeLens(range, {
        title: `✕ Reject Hunk`,
        command: 'forgecode.rejectHunk',
        arguments: [hunk.id, plan.filePath],
      });

      lenses.push(acceptLens, rejectLens);
    }

    return lenses;
  }

  /**
   * User accepts a specific hunk.
   */
  public async acceptHunk(hunkId: string, filePath: string): Promise<boolean> {
    const plan = this.activePlans.get(filePath);
    if (!plan) return false;

    const hunk = plan.hunks.find((h) => h.id === hunkId);
    if (!hunk || hunk.status !== 'pending') return false;

    hunk.status = 'accepted';
    this.onDidChangeCodeLensesEmitter.fire();

    // Check if all hunks are resolved
    const remainingPending = plan.hunks.filter((h) => h.status === 'pending');
    if (remainingPending.length === 0) {
      await this.commitPlanToDisk(plan);
      this.activePlans.delete(filePath);
    }

    // Refresh active editor if visible
    const editor = vscode.window.visibleTextEditors.find((e) => e.document.uri.fsPath === filePath);
    if (editor) {
      this.refreshDecorations(editor);
    }

    return true;
  }

  /**
   * User rejects a specific hunk.
   */
  public async rejectHunk(hunkId: string, filePath: string): Promise<boolean> {
    const plan = this.activePlans.get(filePath);
    if (!plan) return false;

    const hunk = plan.hunks.find((h) => h.id === hunkId);
    if (!hunk || hunk.status !== 'pending') return false;

    hunk.status = 'rejected';
    this.onDidChangeCodeLensesEmitter.fire();

    // Check if all hunks are resolved
    const remainingPending = plan.hunks.filter((h) => h.status === 'pending');
    if (remainingPending.length === 0) {
      await this.commitPlanToDisk(plan);
      this.activePlans.delete(filePath);
    }

    const editor = vscode.window.visibleTextEditors.find((e) => e.document.uri.fsPath === filePath);
    if (editor) {
      this.refreshDecorations(editor);
    }

    return true;
  }

  /**
   * Commit accepted hunks to disk safely with Undo transaction.
   */
  public async commitPlanToDisk(plan: FileHunkPlan): Promise<void> {
    const acceptedCount = plan.hunks.filter((h) => h.status === 'accepted').length;
    if (acceptedCount === 0) {
      console.log(`[HunkReviewDecorator] All hunks rejected for ${plan.filePath}. Document untouched.`);
      return;
    }

    // Capture pre-edit snapshot for Undo
    const undoManager = UndoManager.getInstance();
    const tx = undoManager.createTransaction(`Applied ${acceptedCount} hunk(s) to ${plan.filePath}`, [plan.filePath]);

    const finalContent = DiffManager.applyAcceptedHunks(plan);

    const docUri = vscode.Uri.file(plan.filePath);
    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(0, 0, 999999, 999999);
    edit.replace(docUri, fullRange, finalContent);

    const applied = await vscode.workspace.applyEdit(edit);
    if (applied) {
      const doc = await vscode.workspace.openTextDocument(docUri);
      await doc.save();
      undoManager.commitTransaction(tx);
      vscode.window.showInformationMessage(`ForgeCode: Applied ${acceptedCount} hunk(s) to ${plan.filePath}. (Undoable)`);
    }
  }

  public dispose(): void {
    this.insertionDecorationType.dispose();
    this.deletionDecorationType.dispose();
    this.onDidChangeCodeLensesEmitter.dispose();
  }
}
