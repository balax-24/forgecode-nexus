#!/usr/bin/env python3
"""
Compiles SUBMISSION_WRITEUP.md into SUBMISSION_WRITEUP.pdf
Using reportlab with clean typographic formatting, tables, and exact 8-heading layout.
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

OUTPUT_PDF = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "SUBMISSION_WRITEUP.pdf"))

def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT_PDF,
        pagesize=letter,
        leftMargin=0.55 * inch,
        rightMargin=0.55 * inch,
        topMargin=0.55 * inch,
        bottomMargin=0.55 * inch
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=4,
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#0284c7'),
        spaceAfter=8,
    )

    h1_style = ParagraphStyle(
        'Heading1Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True,
    )

    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155'),
        spaceBefore=6,
        spaceAfter=3,
        keepWithNext=True,
    )

    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#334155'),
        spaceAfter=4,
    )

    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#334155'),
        leftIndent=12,
        spaceAfter=2,
    )

    code_style = ParagraphStyle(
        'CodeCustom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#0f172a'),
        backColor=colors.HexColor('#f1f5f9'),
        borderPadding=4,
        spaceBefore=4,
        spaceAfter=6,
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white,
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#1e293b'),
    )

    elements = []

    # Title & Metadata
    elements.append(Paragraph("ForgeCode — Autonomous Coding Agent on TrueForge", title_style))
    elements.append(Paragraph("Techfest 2026–27, IIT Bombay • TrueFoundry Forge-a-thon (Round 1 Submission)", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#cbd5e1'), spaceAfter=8))

    # Section 1: Team
    elements.append(Paragraph("1. Team", h1_style))
    elements.append(Paragraph("<b>Lead Engineer:</b> Balaharish Saravanan | <b>Email:</b> balaharish0202@gmail.com | <b>GitHub:</b> @balaharish0202", bullet_style))
    elements.append(Paragraph("<b>Affiliation:</b> Registered Contestant, Techfest IIT Bombay 2026–27 (Team ID: ForgeCode)", bullet_style))
    elements.append(Paragraph("<b>Responsibilities:</b> End-to-end architecture, TrueForge harness bridge, MCP tool server, token-budgeted context assembler, and verification suites.", bullet_style))

    # Section 2: Starting Point
    elements.append(Paragraph("2. Starting Point", h1_style))
    elements.append(Paragraph("<b>Declared Fork Point:</b> Forked from <code>https://github.com/cline/cline</code> at clean commit <code>e52cb8b4f174c3eef5dfd5c4323c9ce0534267bb</code>. Upstream Apache 2.0 license preserved in root LICENSE and NOTICE.", bullet_style))
    elements.append(Paragraph("<b>Modifications & Purged Upstream Loops:</b> All proprietary model SDKs (@anthropic-ai/sdk, openai, @google/generative-ai) were completely excised to comply with the Eligibility Gate. The entire agent execution loop was built 100% on TrueForge sessions, SSE streaming turns, and a local Model Context Protocol (MCP) server. Added custom in-editor CodeLens diff reviews and byte-level UndoManager.", bullet_style))

    # Section 3: Architecture on TrueForge
    elements.append(Paragraph("3. Architecture on TrueForge", h1_style))
    elements.append(Paragraph("ForgeCode is an editor-native VS Code extension communicating strictly with the local TrueForge agent harness (<code>npx @truefoundry/trueforge@latest</code> running on port 8790):", body_style))
    elements.append(Paragraph("<b>1. TrueForge Sessions & Turns:</b> All instructions initiate stateful sessions via <code>POST /v1/sessions</code> and stream events via <code>POST /v1/sessions/:id/turns</code> over Server-Sent Events (SSE). An AbortController handles instant mid-flight cancellation with zero dirty workspace files.", bullet_style))
    elements.append(Paragraph("<b>2. Editor MCP Server:</b> Exposes 5 strict tools to TrueForge: <code>workspace_search</code>, <code>read_file_outline</code>, <code>read_file_chunk</code>, <code>propose_hunk_edits</code>, and <code>run_terminal_command</code>. Diff review is directly gated behind TrueForge's native tool approval callback.", bullet_style))
    elements.append(Paragraph("<b>3. Context Compaction & Harness Features:</b> Uses <code>agent.trueforge.yaml</code> with automatic context compaction (threshold: 6,000 tokens) to compress older turn histories, and deferred tool loading to preserve context windows.", bullet_style))

    # Section 4: How Context is Selected
    elements.append(Paragraph("4. How Context is Selected", h1_style))
    elements.append(Paragraph("Context assembly represents the intellectual core of the architecture. ForgeCode uses a deterministic <b>3-Stage Context Funnel</b> with a strict 8,000-token budget:", body_style))
    elements.append(Paragraph("<b>Stage 1 — Explicit Mentions:</b> Parses <code>@file:&lt;path&gt;</code> and <code>@symbol:&lt;name&gt;</code> pins with guaranteed priority allocation (up to 30% budget).", bullet_style))
    elements.append(Paragraph("<b>Stage 2 — Multi-Signal Hybrid Retrieval:</b> For unprompted tasks (Task B), extracts domain keywords (<code>cli</code>, <code>config</code>, <code>command</code>, <code>json</code>, <code>secret</code>), ranks candidates using BM25 keyword density over relative paths, and performs AST import graph expansion (expanding <code>src/flask/cli.py</code> to <code>tests/test_cli.py</code> and <code>docs/cli.rst</code>).", bullet_style))
    elements.append(Paragraph("<b>Stage 3 — Knapsack Token Budget Packing:</b> Packs files within the 8,000-token budget. If a file exceeds available space, extracts a structural AST skeleton (functions, classes, docstrings) rather than truncating blindly. Emits a visible <code>ContextSelectionReport</code> in the agent webview showing token breakdowns and selection rationales.", bullet_style))

    # Section 5: Model Setup
    elements.append(Paragraph("5. Model Setup", h1_style))
    elements.append(Paragraph("<b>Primary Model:</b> <code>gpt-4o-mini</code> (OpenAI-compatible gateway endpoint). Total development and verification cost: ~$0.04.", bullet_style))
    elements.append(Paragraph("<b>Secondary Fallback Model:</b> <code>qwen2.5-coder:7b</code> via local Ollama (<code>http://127.0.0.1:11434/v1</code>). Cost: $0.00.", bullet_style))
    elements.append(Paragraph("<b>Model Switching:</b> Users or judges can switch models in under 30 seconds by updating <code>trueforge.config.yaml</code> or passing <code>--model</code> to TrueForge. Zero provider lock-in.", bullet_style))

    # Section 6: Scorecard Table
    elements.append(Paragraph("6. Scorecard (100-Point Rubric Alignment)", h1_style))

    table_data = [
        [
            Paragraph("Criterion", table_header_style),
            Paragraph("Pts", table_header_style),
            Paragraph("Timestamp", table_header_style),
            Paragraph("Verified Rubric Claim (Highest Anchor)", table_header_style)
        ],
        [
            Paragraph("A1 Inline edit", table_cell_style),
            Paragraph("10", table_cell_style),
            Paragraph("00:18 – 00:58", table_cell_style),
            Paragraph("Diff rendered in editor with per-hunk [Accept] and [Reject] CodeLens buttons. Verified via FLASK_DEBUG=off.", table_cell_style)
        ],
        [
            Paragraph("A2 Agent mode", table_cell_style),
            Paragraph("10", table_cell_style),
            Paragraph("01:02 – 02:20", table_cell_style),
            Paragraph("Discovers & edits 3 files unprompted (cli.py, test_cli.py, docs/cli.rst). Verified via pytest and flask config.", table_cell_style)
        ],
        [
            Paragraph("A3 Streaming & cancel", table_cell_style),
            Paragraph("10", table_cell_style),
            Paragraph("01:25 – 01:45", table_cell_style),
            Paragraph("Non-blocking real-time SSE streaming. Instant cancellation demonstrated with 100% clean workspace.", table_cell_style)
        ],
        [
            Paragraph("B1 Context assembly", table_cell_style),
            Paragraph("15", table_cell_style),
            Paragraph("01:05 – 01:22", table_cell_style),
            Paragraph("8,000-token budget knapsack engine with visible on-screen Context Report showing why files were chosen.", table_cell_style)
        ],
        [
            Paragraph("B2 Diff safety", table_cell_style),
            Paragraph("10", table_cell_style),
            Paragraph("00:45 – 01:00", table_cell_style),
            Paragraph("Zero silent writes. Per-hunk interactive review paired with working byte-for-byte Undo restoring clean git state.", table_cell_style)
        ],
        [
            Paragraph("B3 Resilience (Task C)", table_cell_style),
            Paragraph("10", table_cell_style),
            Paragraph("02:58 – 03:45", table_cell_style),
            Paragraph("Unreachable endpoint (:9999) intercepted without UI freeze; clean workspace confirmed; auto-failover to 2nd model.", table_cell_style)
        ],
        [
            Paragraph("B4 TrueForge depth", table_cell_style),
            Paragraph("10", table_cell_style),
            Paragraph("02:22 – 02:50", table_cell_style),
            Paragraph("5 editor MCP tools, diff review driven by TrueForge tool approvals, and active context compaction.", table_cell_style)
        ],
        [
            Paragraph("C1 Video presentation", table_cell_style),
            Paragraph("10", table_cell_style),
            Paragraph("00:00 – 03:55", table_cell_style),
            Paragraph("Tasks A, B, C executed in exact order, under 4 minutes, with high-legibility terminal verifications.", table_cell_style)
        ],
        [
            Paragraph("C2 Write-up completeness", table_cell_style),
            Paragraph("15", table_cell_style),
            Paragraph("Document", table_cell_style),
            Paragraph("Complete PDF following exact 8 headings, architectural breakdown, model setup, and limitations.", table_cell_style)
        ],
    ]

    table = Table(table_data, colWidths=[1.1 * inch, 0.4 * inch, 0.9 * inch, 4.6 * inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('ALIGN', (2, 0), (2, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))

    elements.append(table)
    elements.append(Spacer(1, 6))

    # Section 7: Tools Used
    elements.append(Paragraph("7. Tools Used", h1_style))
    elements.append(Paragraph("TypeScript & Node.js 22, @truefoundry/trueforge-sdk (v0.185.1), esbuild, pytest 8.4.2, Click 8.5.1, diff, and Antigravity AI assistant for rapid scaffolding (in accordance with Rule 4).", body_style))

    # Section 8: Known Limitations & Next Steps
    elements.append(Paragraph("8. Known Limitations & What We Would Do With Another Month", h1_style))
    elements.append(Paragraph("<b>1. Monorepo LSP Indexing:</b> Integrate full Language Server Protocol (LSP) symbol indexing (definition/references) to navigate codebases beyond 500,000 lines without hitting file-traversal bottlenecks.", bullet_style))
    elements.append(Paragraph("<b>2. Interactive 3-Way Visual Merge:</b> Add 3-way merge conflict visualizers for complex overlapping multi-file branch edits.", bullet_style))
    elements.append(Paragraph("<b>3. Upstream Pull Request to TrueForge:</b> For Round 2 at IIT Bombay, submit an upstream PR to <code>truefoundry/trueforge</code> improving MCP tool approval timeouts and streaming token telemetry.", bullet_style))

    doc.build(elements)
    print(f"Generated {OUTPUT_PDF} successfully.")

if __name__ == "__main__":
    build_pdf()
