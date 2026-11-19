# ForgeCode Nexus — Official Demo Video Walkthrough Script
**Competition:** Techfest 2026–27, IIT Bombay • TrueFoundry Forge-a-thon (Round 1)  
**Team Name:** `Internzz` | **Team ID:** `TM-14B3C2A245A` | **Competition ID:** `TFF-EF1C44D4BBBB`  
**Lead Engineer:** Balaharish Saravanan (`balaharish0202@gmail.com`)  
**Duration Limit:** Maximum 4 Minutes (240 Seconds)  
**Target Video Time:** 3 Minutes 45 Seconds (03:45)  
**Evaluation Target Repository:** `pallets/flask` @ Release Tag `3.1.3` (commit `22d92470`)

---

## 🎬 Recording Setup & Quick Checklist

1. **Screen Layout (1920x1080 recommended):**
   * **Left 65% of screen:** Active VS Code editor showing `flask-eval/` (`pallets/flask`).
   * **Right 35% of screen:** ForgeCode Autonomous Agent webview sidebar panel.
   * **Bottom 30% of screen:** Integrated VS Code terminal inside `flask-eval/` with `.venv` active.
2. **Recording Tool:**
   * **Windows:** Press `Win + Alt + R` (built-in Windows Game Bar) or use OBS Studio.
   * **Audio:** You can speak over it following the voiceover cues below, or record silently (we can add automated subtitle captions and title overlays via `ffmpeg`!).
3. **If you want me to edit your raw video:**
   * Record your screen without worrying about pauses or mistakes.
   * Save the raw video file as `raw_demo.mp4` in the project root directory: `/mnt/d/Projects/Hackathons/Forge-a-thon/raw_demo.mp4`.
   * Tell me in the chat: *"I've saved raw_demo.mp4, please edit it."*
   * I will use `ffmpeg` to trim dead air, speed up slower turn outputs, add professional title banners and timestamps, and export a clean, compliant `<4 min` video ready for submission!

---

## ⏱️ Second-by-Second Video Timeline & Script

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 00:00 – 00:18 │ Intro & Environment Proof (Tag 3.1.3 & TrueForge Session)              │
│ 00:18 – 01:02 │ TASK A: Inline Edit with Per-Hunk Review & Undo (Criteria A1, B2)     │
│ 01:02 – 02:50 │ TASK B: Agent Mode Across 3 Files Unprompted (Criteria A2, A3, B1, B4) │
│ 02:50 – 03:45 │ TASK C: Resilience & Automatic Failover (Criterion B3)                 │
│ 03:45 – 03:55 │ Conclusion & Links                                                     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 00:00 – 00:18: Introduction & Environment Proof
* **Visual:** VS Code opened to `pallets/flask`. Integrated terminal visible at bottom.
* **Spoken / Subtitle:** *"Hello, this is team Internzz (Team ID TM-14B3C2A245A) presenting ForgeCode Nexus for the TrueFoundry Forge-a-thon at Techfest, IIT Bombay. We are evaluating on pallets/flask at official tag 3.1.3."*
* **Terminal Action:** Run:
  ```bash
  git rev-parse HEAD
  ```
  *(Confirms `22d924701a6ae2e4cd01e9a15bbaf3946094af65`).*
* **Visual Cue:** Highlight bottom status bar: `⚡ ForgeCode: TrueForge (8790)`.

---

### 00:18 – 01:02: TASK A — Inline Edit with Per-Hunk Review & Undo (Criteria A1, B2)
* **00:18 – 00:26:** Open `src/flask/helpers.py`. Scroll to function `get_debug_flag()`. Select the function lines. Press `Ctrl+Shift+I`.
* **00:26 – 00:36:** The ForgeCode Inline Edit prompt opens. Paste the exact task prompt:
  > *"Treat the values 'off' and 'n' as false as well, case-insensitively, and update the docstring to list every value that is treated as false."*
  Press Enter.
* **00:36 – 00:46:**
  * Real-time SSE streaming diff appears directly in the editor buffer.
  * Point out in-editor CodeLens buttons: `[✓ Accept Hunk]` and `[✕ Reject Hunk]`.
  * Point out Hunk 1 (Docstring update) and Hunk 2 (Return expression update).
* **00:46 – 00:52:** Click `[✓ Accept Hunk]` on both hunks.
* **00:52 – 00:58: On-Screen Verification:**
  * Switch to bottom terminal and execute:
    ```bash
    FLASK_DEBUG=off python -c "from flask.helpers import get_debug_flag; print(get_debug_flag())"
    ```
    **Output on screen:** `False`
* **00:58 – 01:02: Working Undo Demonstration (Criterion B2):**
  * Click `⤺ Undo Apply` in the ForgeCode header.
  * Run `git status` in terminal — shows working tree clean (0 dirty files).
  * Click re-apply to keep the verified fix.

---

### 01:02 – 02:50: TASK B — Agent Mode Across 3 Files Unprompted (Criteria A2, A3, B1, B4)
* **01:02 – 01:15:** Switch focus to ForgeCode sidebar panel. Notice **zero files are open or mentioned**. Paste the exact unprompted instruction:
  > *"Add a new built-in CLI command flask config that prints the loaded application's configuration as JSON, masking the values of any key containing SECRET, PASSWORD, TOKEN or KEY as '***'. It must appear in flask --help, be covered by a test, and be documented alongside the other built-in commands."*
  Click **Send**.
* **01:15 – 01:25: Context Assembly Banner (Criterion B1):**
  * Point to the visible Context Card:
    * `Budget: 4,610 / 8,000 tokens allocated across 3 candidate files`.
    * Explains multi-signal ranking: BM25 keyword density + AST import graph expansion.
* **01:25 – 01:45: Instant Cancellation Demo (Criterion A3):**
  * While tokens are actively streaming via SSE, click the **Stop** button.
  * Notification appears: *"Agent execution stopped. Workspace consistent."*
  * Run `git status` in terminal: visibly proves **zero half-applied or corrupt files**.
  * Click **Send** to let the agent run to completion.
* **01:45 – 02:15: Autonomous Multi-File Discovery (Criterion A2):**
  * Watch the agent autonomously call MCP tools: `workspace_search` → `read_file_outline` → `propose_hunk_edits`.
  * The agent discovers and stages changes across exactly 3 files:
    1. `src/flask/cli.py` (`config_command` implementation & registration)
    2. `tests/test_cli.py` (`test_config_command` unit test)
    3. `docs/cli.rst` (Built-in commands documentation)
* **02:15 – 02:25:** Review diff cards and click **Accept All**.
* **02:25 – 02:35: TrueForge Session Inspector (Criterion B4):**
  * Click status bar to reveal Session Inspector: active Session ID, turn telemetry, MCP tool approval gates, and TrueForge compaction state.
* **02:35 – 02:50: On-Screen Verification (Criterion A2):**
  * In the bottom terminal, run pytest:
    ```bash
    pytest tests/test_cli.py -q
    ```
    **Output:** `56 passed, 3 skipped`
  * Verify CLI help:
    ```bash
    flask --help
    ```
    **Output:** Contains `config  Print the loaded application's configuration as JSON.`
  * Verify masking on sample app:
    ```bash
    flask --app _sample_app config
    ```
    **Output:** JSON output with `SECRET_KEY: "***"`, `DB_PASSWORD: "***"`, `API_TOKEN: "***"`.

---

### 02:50 – 03:45: TASK C — Resilience & Automatic Model Failover (Criterion B3)
* **02:50 – 03:00:**
  * Point out TrueForge failover configuration: Primary model endpoint pointed to an unreachable port (`http://127.0.0.1:9999`) or simulated 503 outage.
* **03:00 – 03:15:** Trigger an instruction to test resilience.
* **03:15 – 03:30: Zero-Corruption & UI Responsiveness:**
  * While the failure occurs, scroll and type in the editor to demonstrate that the VS Code UI **never freezes or blocks**.
  * Point to the toast notification: *"Primary TrueForge endpoint unreachable [Connection refused: 9999] — Failing over automatically to Secondary Fallback Model (qwen2.5-coder:7b). Workspace clean."*
  * Run `git status` in terminal — confirms **zero corrupted files**.
* **03:30 – 03:45: Automatic Fallback Execution:**
  * The fallback model (`qwen2.5-coder:7b`) takes over turn execution smoothly without manual intervention.

---

### 03:45 – 03:55: Conclusion & Wrap-Up
* **Visual:** Show GitHub repository: `https://github.com/balax-24/forgecode-nexus`.
* **Spoken / Subtitle:** *"ForgeCode Nexus delivers 100% compliance with TrueForge harness requirements, robust context engineering, and autonomous multi-file editing. Thank you from Team Internzz!"*
* **Video ends at:** ~03:52 (strictly under 4 minutes).
