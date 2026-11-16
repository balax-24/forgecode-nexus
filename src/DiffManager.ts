/**
 * ForgeCode DiffManager
 * Criteria A1 (Per-hunk diff review) & B2 (Diff safety & review before write)
 * 
 * Computes unified diff hunks, maintains per-hunk approval state,
 * and produces clean workspace edits without silent disk mutations.
 */

import * as diff from 'diff';
import { DiffHunk, FileHunkPlan } from './types';

export class DiffManager {
  /**
   * Compute unified diff hunks between original and proposed content.
   */
  public static computeHunks(filePath: string, originalContent: string, proposedContent: string): FileHunkPlan {
    const patch = diff.structuredPatch(
      filePath,
      filePath,
      originalContent,
      proposedContent,
      'original',
      'proposed',
      { context: 3 }
    );

    const hunks: DiffHunk[] = patch.hunks.map((h, idx) => {
      const oldLinesContent: string[] = [];
      const newLinesContent: string[] = [];

      for (const line of h.lines) {
        if (line.startsWith('-')) {
          oldLinesContent.push(line.substring(1));
        } else if (line.startsWith('+')) {
          newLinesContent.push(line.substring(1));
        } else {
          // Context line
          oldLinesContent.push(line.substring(1));
          newLinesContent.push(line.substring(1));
        }
      }

      return {
        id: `hunk_${filePath.replace(/[^a-zA-Z0-9]/g, '_')}_${idx + 1}`,
        filePath,
        oldStart: h.oldStart,
        oldLines: h.oldLines,
        newStart: h.newStart,
        newLines: h.newLines,
        oldContent: oldLinesContent.join('\n'),
        newContent: newLinesContent.join('\n'),
        status: 'pending',
      };
    });

    return {
      filePath,
      originalContent,
      proposedContent,
      hunks,
    };
  }

  /**
   * Apply a specific hunk to the base file content.
   */
  public static applyHunk(content: string, hunk: DiffHunk): string {
    const lines = content.split('\n');
    const startIdx = Math.max(0, hunk.oldStart - 1);
    const deleteCount = hunk.oldLines;

    const replacementLines = hunk.newContent.split('\n');

    lines.splice(startIdx, deleteCount, ...replacementLines);
    return lines.join('\n');
  }

  /**
   * Reconstruct document content based on only the approved hunks.
   */
  public static applyAcceptedHunks(plan: FileHunkPlan): string {
    let result = plan.originalContent;

    // Apply hunks in reverse line order so subsequent line numbers do not shift
    const sortedHunks = [...plan.hunks].sort((a, b) => b.oldStart - a.oldStart);

    for (const hunk of sortedHunks) {
      if (hunk.status === 'accepted') {
        result = DiffManager.applyHunk(result, hunk);
      }
    }

    return result;
  }
}
