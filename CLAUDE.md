# CLAUDE.md — IR Agency Command Center

This file contains operating rules for Claude when working in this repository. It travels with the repo and is version-controlled. These rules are permanent until explicitly changed via pull request.

---

## Core Behavioral Rules

- Never guess IDs. Always look up locationId and ghlPrivateToken from Supabase before any GHL operation.
- Read before writing. Fetch the current state of any GHL object before modifying it.
- Verify after writing. Read back every GHL write to confirm actual state matches intended state.
- Do not delete without explicit human approval.
- Use test accounts first for any new workflow pattern before applying to production clients.
- Never assume patch semantics on GHL API calls. Always treat updates as full replacements.

---

## Brain Loop — Write-Back Rules

These rules ensure that knowledge discovered during a session is never lost.

### Rule 1 — GHL Platform Behavior
After any session where a GHL MCP call, workflow build, or API interaction produced unexpected behavior, required more than one retry, revealed an undocumented constraint, or caused a rebuild — append a new entry to `/docs/GHL_PLATFORM_BEHAVIOR.md` before closing. Use the entry format defined in that file.

### Rule 2 — Raw Event Log
After any MCP tool call that fails, returns an error, or produces a result inconsistent with the documented schema — append a JSONL line to `/logs/mcp-events.jsonl` with: timestamp, tool name, status, a short summary, and occurrence count.

### Rule 3 — External Blockers
If a workflow or build step cannot be completed or validated because of an external dependency (missing user, missing calendar, unconfirmed integration, pending registration) — add or update the relevant row in `/docs/EXTERNAL_BLOCKERS.md`. Do not attempt workarounds. Surface the blocker and stop.

---

## Brain Loop — Promotion Rules

These rules determine when a recorded observation becomes a permanent operating rule.

- **1 occurrence:** Record raw entry in `GHL_PLATFORM_BEHAVIOR.md` with status `CANDIDATE`.
- **2 occurrences in different contexts:** Update status to `CONFIRMED`.
- **3 occurrences or any occurrence that causes a rebuild:** Open a GitHub issue proposing a specific change to the relevant runbook or this `CLAUDE.md`. Do not self-promote — wait for human approval.
- **Human approves via PR:** Promote the lesson into this file or the relevant runbook. Add a regression note.

---

## GHL Workflow Build Protocol

Before modifying any GHL workflow:

1. Look up the client's `ghlLocationId` and `ghlPrivateToken` from Supabase.
2. Read the current workflow state in full — including all existing actions.
3. Check `/docs/GHL_PLATFORM_BEHAVIOR.md` for any relevant known behaviors.
4. Check `/docs/EXTERNAL_BLOCKERS.md` for any blockers affecting this workflow.
5. Produce a written plan before making any changes.
6. Apply changes with all existing actions included in the payload (never partial update).
7. Read back and verify actual state matches intended state.
8. If verification fails, record the discrepancy in `GHL_PLATFORM_BEHAVIOR.md` before retrying.

---

## File Map

| File | Purpose |
|------|---------|
| `CLAUDE.md` | This file — operating rules, write-back rules, promotion rules |
| `docs/GHL_PLATFORM_BEHAVIOR.md` | Permanent record of discovered GHL platform behaviors |
| `docs/EXTERNAL_BLOCKERS.md` | External dependencies blocking workflow activation or launch |
| `logs/mcp-events.jsonl` | Raw event log for MCP tool failures and anomalies |
| `TASK_STARTUP.md` | Environment setup and startup checklist for new sessions |

---

## Change History

| Date | Change | Approved by |
|------|--------|-------------|
| 2025-07-23 | Initial CLAUDE.md created with brain loop rules | IR |
