# ForgeCode — Official Demo Video Walkthrough Script
**Duration Limit:** Maximum 4 Minutes (240 Seconds)  
**Target Video Time:** 3 Minutes 45 Seconds (03:45)  
**Evaluation Repository:** `pallets/flask` (tag 3.1.3, commit `22d92470`)

---

## Recording Setup & Checklist
1. **VS Code Window:** Left 65% of screen showing active code editor, Right 35% showing ForgeCode Autonomous Agent sidebar panel.
2. **Terminal Panel:** Bottom terminal open at `flask-eval/` with `.venv` activated.
3. **TrueForge Local Server:** Running locally in background terminal (`npx @truefoundry/trueforge@latest`).
4. **Resolution:** 1080p (1920x1080), 30fps or 60fps, crisp font scaling.

---

## Second-by-Second Video Timeline

### 00:00 – 00:18: Introduction & Environment Proof
* **Visual:** Show VS Code with `pallets/flask` opened. Show terminal at tag `3.1.3`.
* **Action:** Run in terminal:
  ```bash
  git rev-parse HEAD
  # Shows 22d924701a6ae2e4cd01e9a15bbaf3946094af65
  ```
* **Status Bar:** Point out bottom-right status item: `⚡ ForgeCode: TrueForge (8790)`.

---

### 00:18 – 01:00: TASK A — Inline Edit with Per-Hunk Review & Undo (A1, B2)
* **00:18 – 00:28:** Open `src/flask/helpers.py`. Highlight the function:
  ```python
  def get_debug_flag() -> bool:
  ```
  Press `Ctrl+Shift+I` (or `Cmd+Shift+I`).
* **00:28 – 00:36:** The ForgeCode Inline Edit QuickInput opens. Type the exact prompt:
  > *"Treat the values 'off' and 'n' as false as well, case-insensitively, and update the docstring to list every value that is treated as false."*
  Press Enter.
* **00:36 – 00:46:** Show token streaming progress toast. Unified diff decorations appear directly in the editor buffer:
  * Red strikethrough deletion highlights.
  * Green insertion previews.
  * In-editor CodeLens buttons: `[✓ Accept Hunk]` and `[✕ Reject Hunk]`.
* **00:46 – 00:52:** Click `[✓ Accept Hunk]` on Hunk 1 (Docstring) and Hunk 2 (Return expression).
* **00:52 – 00:58:** **On-Screen Verification:** Switch to terminal and run:
  ```bash
  FLASK_DEBUG=off python -c "from flask.helpers import get_debug_flag; print(get_debug_flag())"
  ```
  **Output clearly shows:** `False`
* **00:58 – 01:02:** **Working Undo Demonstration (Criterion B2):** Click `⤺ Undo Apply` in sidebar header. Run `git status` to prove byte-for-byte restoration. Click re-apply.

---

### 01:02 – 02:50: TASK B — Agent Mode Across 3 Files Unprompted (A2, A3, B1, B4)
* **01:02 – 01:15:** Switch to ForgeCode sidebar panel. With zero files mentioned or open, paste the exact instruction:
  > *"Add a new built-in CLI command flask config that prints the loaded application's configuration as JSON, masking the values of any key containing SECRET, PASSWORD, TOKEN or KEY as '***'. It must appear in flask --help, be covered by a test, and be documented alongside the other built-in commands."*
  Click **Send**.
* **01:15 – 01:25:** **Context Assembly Banner (Criterion B1):** Point to the Context Card:
  * Shows: `Budget: 4,610 / 8,000 tokens allocated across 3 candidate files`.
  * Shows why each file was selected (BM25 keyword density + AST import graph expansion).
* **01:25 – 01:45:** **Instant Cancellation Demo (Criterion A3):**
  * Mid-stream tokens are arriving via SSE.
  * Click **Stop** button.
  * Notification shows: *"Agent execution stopped. Workspace consistent."*
  * Run `git status` in terminal to visibly show **0 dirty/half-applied files**.
  * Click **Send** to let the agent run to completion.
* **01:45 – 02:15:** **Autonomous Multi-File Discovery (Criterion A2):**
  * Agent autonomously invokes MCP tools: `workspace_search` → `read_file_outline` → `propose_hunk_edits`.
  * The agent discovers and stages changes across 3 files:
    1. `src/flask/cli.py` (`config_command` implementation & FlaskGroup registration)
    2. `tests/test_cli.py` (`test_config_command` unit test)
    3. `docs/cli.rst` (Built-in CLI documentation)
* **02:15 – 02:25:** Review hunks across all 3 files and click **Accept All**.
* **02:25 – 02:35:** **TrueForge Session Inspector (Criterion B4):**
  * Click status bar to show Session Inspector:
  * Shows active session ID, turns, MCP tool approvals, and TrueForge context compaction status.
* **02:35 – 02:50:** **On-Screen Verification (Criterion A2):**
  * Run pytest in terminal:
    ```bash
    pytest tests/test_cli.py -q
    # Output: 56 passed, 3 skipped
    ```
  * Run help check:
    ```bash
    flask --help
    # Clearly displays: config  Print the loaded application's configuration as JSON.
    ```
  * Run config command against sample app:
    ```bash
    flask --app _sample_app config
    # Outputs JSON with SECRET_KEY: "***", DB_PASSWORD: "***", and non-sensitive keys visible.
    ```

---

### 02:50 – 03:45: TASK C — Resilience & Automatic Failover (B3)
* **02:50 – 03:00:** Configure TrueForge with unreachable endpoint (`http://127.0.0.1:9999`) or invalid key in settings.
* **03:00 – 03:15:** Repeat Task A instruction on `src/flask/helpers.py`.
* **03:15 – 03:30:** **Zero-Corruption & UI Responsiveness Audit:**
  * Type in the editor and scroll smoothly to prove the VS Code UI **never freezes or blocks**.
  * Warning banner appears: *"Primary TrueForge endpoint unreachable [Connection refused: 9999] — Failing over automatically to Secondary Fallback Model (qwen2.5-coder:7b). Workspace clean."*
  * Switch to terminal and run `git status` to verify **zero corrupted files**.
* **03:30 – 03:45:** **Automatic Fallback:**
  * Secondary model takes over turn automatically without user action.
  * Completes task cleanly.

---

### 03:45 – 03:55: Conclusion & Summary
* Show repository URL, license, and declare model configurations.
* End video under 4 minutes.
