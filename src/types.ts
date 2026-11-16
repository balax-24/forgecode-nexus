/**
 * ForgeCode Type Definitions
 * TrueFoundry Forge-a-thon Architecture Core Types
 */

export interface ContextItem {
  path: string;
  tokens: number;
  priority: number;
  reason: string;
  content: string;
  isPinned?: boolean;
}

export interface ContextSelectionReport {
  budgetMax: number;
  budgetUsed: number;
  query: string;
  pinnedMentions: string[];
  selectedFiles: Array<{
    path: string;
    tokens: number;
    reason: string;
    role: 'primary' | 'reference' | 'test' | 'doc';
  }>;
  omittedFilesCount: number;
  summary: string;
}

export interface DiffHunk {
  id: string;
  filePath: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  oldContent: string;
  newContent: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface FileHunkPlan {
  filePath: string;
  originalContent: string;
  proposedContent: string;
  hunks: DiffHunk[];
}

export interface FileSnapshot {
  filePath: string;
  content: string;
  timestamp: number;
}

export interface UndoTransaction {
  id: string;
  description: string;
  timestamp: number;
  snapshots: FileSnapshot[];
}

export interface TrueForgeConfig {
  baseUrl: string;
  primaryModel: string;
  fallbackModel: string;
  tokenBudget: number;
  autoFallback: boolean;
}

export interface TrueForgeSession {
  id: string;
  agentId: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface TrueForgeTurnEvent {
  id: string;
  type: string;
  content?: string;
  toolCall?: {
    id: string;
    name: string;
    arguments: Record<string, any>;
  };
  toolResult?: {
    id: string;
    content: string;
    isError?: boolean;
  };
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface McpToolApprovalRequest {
  toolCallId: string;
  toolName: string;
  filePath: string;
  hunks: DiffHunk[];
  resolve: (approved: boolean) => void;
}

export interface FailoverEvent {
  timestamp: number;
  primaryUrl: string;
  error: string;
  fallbackModel: string;
  workspaceClean: boolean;
}
