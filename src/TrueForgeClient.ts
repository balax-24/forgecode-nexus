/**
 * ForgeCode TrueForgeClient
 * TrueFoundry Agent Harness Integration Bridge
 * 
 * Manages sessions, SSE turn streaming, MCP tool approval lifecycle,
 * and graceful mid-stream cancellation.
 */

import { EventEmitter } from 'events';
import { TrueForgeSession, TrueForgeTurnEvent, TrueForgeConfig } from './types';

export interface StreamCallbacks {
  onTokenDelta?: (token: string) => void;
  onToolCall?: (toolCall: { id: string; name: string; arguments: any }) => Promise<{ approved: boolean; result?: any }>;
  onCompaction?: (info: { originalTokens: number; compactedTokens: number }) => void;
  onError?: (err: Error) => void;
  onComplete?: () => void;
}

export class TrueForgeClient extends EventEmitter {
  private config: TrueForgeConfig;

  constructor(config: TrueForgeConfig) {
    super();
    this.config = config;
  }

  public updateConfig(newConfig: Partial<TrueForgeConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): TrueForgeConfig {
    return { ...this.config };
  }

  /**
   * Health check to test if TrueForge server endpoint is reachable.
   */
  public async checkHealth(customUrl?: string): Promise<{ reachable: boolean; latencyMs: number; error?: string }> {
    const url = (customUrl || this.config.baseUrl).replace(/\/$/, '');
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${url}/healthz`, {
        method: 'GET',
        signal: controller.signal,
      }).catch(async () => {
        // Fallback check to /api or /
        return fetch(`${url}/`, { method: 'GET', signal: controller.signal });
      });

      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;

      if (res && (res.ok || res.status < 500)) {
        return { reachable: true, latencyMs };
      }

      return {
        reachable: false,
        latencyMs,
        error: `Server responded with HTTP ${res ? res.status : 'No response'}`,
      };
    } catch (err: any) {
      return {
        reachable: false,
        latencyMs: Date.now() - startTime,
        error: err.name === 'AbortError' ? 'Connection timed out' : err.message || 'Endpoint unreachable',
      };
    }
  }

  /**
   * Create a stateful agent session on the local TrueForge harness.
   */
  public async createSession(agentId: string = 'forgecode-agent', metadata?: Record<string, any>): Promise<TrueForgeSession> {
    const url = `${this.config.baseUrl.replace(/\/$/, '')}/v1/sessions`;

    const payload = {
      agent: { name: agentId },
      metadata: {
        workspace: metadata?.workspace || process.cwd(),
        model: this.config.primaryModel,
        ...metadata,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`TrueForge createSession failed [HTTP ${res.status}]: ${errorText}`);
    }

    const data = await res.json() as any;
    return {
      id: data.id || `session_${Date.now()}`,
      agentId,
      createdAt: data.created_at || new Date().toISOString(),
      metadata: data.metadata,
    };
  }

  /**
   * Stream an agent turn over Server-Sent Events (SSE).
   * Supports real-time token delivery, MCP tool approvals, and instant abort cleanup.
   */
  public async streamTurn(
    sessionId: string,
    prompt: string,
    assembledContext: string,
    callbacks: StreamCallbacks,
    abortSignal?: AbortSignal,
    modelOverride?: string
  ): Promise<string> {
    const url = `${this.config.baseUrl.replace(/\/$/, '')}/v1/sessions/${sessionId}/turns`;
    const activeModel = modelOverride || this.config.primaryModel;

    const fullMessage = assembledContext
      ? `${assembledContext}\n\nUser Instruction:\n${prompt}`
      : prompt;

    const payload = {
      input: [
        {
          type: 'user.message',
          content: fullMessage,
        },
      ],
      model: activeModel,
      stream: true,
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(payload),
        signal: abortSignal,
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('[TrueForgeClient] Turn aborted by user before request completed.');
        throw new Error('TURN_ABORTED_BY_USER');
      }
      throw err;
    }

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`TrueForge turn failed [HTTP ${response.status}]: ${errBody}`);
    }

    if (!response.body) {
      throw new Error('TrueForge turn response has no readable stream body.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulatedContent = '';

    try {
      while (true) {
        if (abortSignal?.aborted) {
          console.log('[TrueForgeClient] Turn cancelled mid-stream. Closing reader.');
          await reader.cancel();
          throw new Error('TURN_ABORTED_BY_USER');
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === '[DONE]') {
              callbacks.onComplete?.();
              return accumulatedContent;
            }

            try {
              const event = JSON.parse(dataStr) as TrueForgeTurnEvent;

              // Token deltas
              if (event.content) {
                accumulatedContent += event.content;
                callbacks.onTokenDelta?.(event.content);
              }

              // Tool calls requiring review/approval
              if (event.toolCall && callbacks.onToolCall) {
                const approvalResult = await callbacks.onToolCall(event.toolCall);
                // Report approval back to harness
                await this.submitToolApproval(sessionId, event.id, event.toolCall.id, approvalResult.approved);
              }
            } catch (parseErr) {
              // Plain text delta fallback
              accumulatedContent += dataStr;
              callbacks.onTokenDelta?.(dataStr);
            }
          }
        }
      }

      callbacks.onComplete?.();
      return accumulatedContent;
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message === 'TURN_ABORTED_BY_USER') {
        console.log('[TrueForgeClient] Successfully cleaned up aborted turn stream.');
        throw new Error('TURN_ABORTED_BY_USER');
      }
      callbacks.onError?.(err);
      throw err;
    }
  }

  /**
   * Submit tool approval response to TrueForge.
   */
  public async submitToolApproval(
    sessionId: string,
    turnId: string,
    toolCallId: string,
    approved: boolean
  ): Promise<void> {
    const url = `${this.config.baseUrl.replace(/\/$/, '')}/v1/sessions/${sessionId}/turns/${turnId}/events`;
    const payload = {
      events: [
        {
          type: 'user.tool_approval',
          toolCallId,
          approved,
          timestamp: Date.now(),
        },
      ],
    };

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn(`[TrueForgeClient] Notice: Tool approval logged locally (${toolCallId}: ${approved})`);
    }
  }
}
