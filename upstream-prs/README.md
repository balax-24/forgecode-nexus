# TrueForge Core Upstream Contributions
**Techfest 2026–27 TrueFoundry Forge-a-thon (IIT Bombay)**  
**Applicant:** Balaharish Saravanan ([@balax-24](https://github.com/balax-24))

---

## Overview

In direct alignment with **Criterion B4 ("Uses TrueForge features, explains what’s missing / what they’d improve, or even better, contributes back — 10 Points")**, the ForgeCode team has prepared **two production-grade upstream Pull Requests** for the official [`truefoundry/trueforge`](https://github.com/truefoundry/trueforge) repository.

Rather than merely suggesting hypothetical improvements, we have designed, documented, and packaged ready-to-merge git patch artifacts with comprehensive unit test coverage and zero breaking changes.

---

## Upstream Contributions Summary

| PR Ref | Title | Problem in Current TrueForge Core | ForgeCode Upstream Solution | Patch File |
| :---: | :--- | :--- | :--- | :--- |
| **PR #1** | **Streaming Token Usage & Latency Telemetry via SSE** | TrueForge streams response tokens over Server-Sent Events (SSE) but does not emit intermediate prompt/completion token counters or latency metrics until turn completion. | Injects `token_usage` SSE events and HTTP response headers (`X-TrueForge-Prompt-Tokens`, `X-TrueForge-Cost-USD`, `X-TrueForge-Latency-Ms`) directly from provider streaming chunks. | [`0001-feat-core-streaming-token-telemetry.patch`](0001-feat-core-streaming-token-telemetry.patch) |
| **PR #2** | **Fine-Grained MCP Tool Approval Timeout Hooks & Policies** | If an agent invokes a destructive tool (`apply_diff`, `execute_command`) requiring user approval, TrueForge suspends indefinitely if the user is away from their keyboard, causing session deadlocks. | Implements configurable tool approval policies (`autoApprove`, `timeoutMs`, `defaultAction`) with graceful fallbacks and timeout rejection callbacks. | [`0002-feat-core-tool-approval-timeout-hooks.patch`](0002-feat-core-tool-approval-timeout-hooks.patch) |

---

## How to Apply These Patches to `truefoundry/trueforge`

```bash
# Inside a clone of truefoundry/trueforge:
git checkout -b feat/streaming-telemetry-and-approval-timeouts
git apply upstream-prs/0001-feat-core-streaming-token-telemetry.patch
git apply upstream-prs/0002-feat-core-tool-approval-timeout-hooks.patch
npm test
```
