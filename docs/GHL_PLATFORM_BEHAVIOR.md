# GHL Platform Behavior Log

This file is the permanent record of discovered GHL API and workflow builder behaviors that are **not obvious from documentation**, were discovered through live testing, or caused a failure or rebuild.

Every entry here was paid for once. It must never be paid for again.

---

## How This File Gets Updated

**Write-back rule:** After any session where a GHL MCP call, workflow build, or API interaction produced unexpected behavior, required a retry, or revealed a platform constraint — append a new entry to this file before closing.

**Promotion rule:** If the same behavior is confirmed in a second independent context, add a `> CONFIRMED` tag. If it causes a failure or rebuild, open a GitHub issue referencing the entry.

---

## Entry Format

```
### [GHL-NNN] Short title
- **Date discovered:** YYYY-MM-DD
- **Context:** What was being built or tested
- **Behavior:** What GHL actually did
- **Expected:** What was assumed or documented
- **Impact:** What it broke or slowed down
- **Resolution:** What rule or workaround was adopted
- **Status:** CONFIRMED | CANDIDATE | RESOLVED
```

---

## Entries

### [GHL-001] Workflow action replacement semantics — silent wipe on update
- **Date discovered:** 2025-07-23
- **Context:** Building GHL automation workflows via MCP; updating an existing workflow's action set
- **Behavior:** When updating workflow actions, GHL replaces the entire action array rather than merging or appending. Actions not included in the update payload are silently deleted.
- **Expected:** Update would modify specified actions and leave others intact (additive/patch semantics)
- **Impact:** Three previously built and validated actions were silently wiped. Discovered only because a read-back verification step was in place.
- **Resolution:** **Permanent rule — always read the full current action list before any workflow update. Include all existing actions in the payload when updating. Never assume patch semantics.**
- **Status:** CONFIRMED

---

### [GHL-002] Workflow action ceiling — maximum actions per workflow unknown
- **Date discovered:** 2025-07-23
- **Context:** Planning Batch 3 workflow builds (Cold Drip, Warm Track) which are action-heavy
- **Behavior:** GHL may enforce a maximum number of actions per workflow. Exact ceiling not yet probed.
- **Expected:** No hard ceiling, or ceiling is high enough to be irrelevant
- **Impact:** If ceiling is 6–7 actions, Cold Drip and Warm Track require splitting into sub-workflows before build. Discovering this during build costs a full rebuild.
- **Resolution:** **Pending — probe the action ceiling before starting Batch 3. Do not begin Cold Drip or Warm Track until ceiling is confirmed.**
- **Status:** CANDIDATE — probe required

---

### [GHL-003] `get_social_accounts` MCP tool silently returns empty on 401
- **Date discovered:** 2026-07-24
- **Context:** Social post agent attempting to preflight connected Facebook accounts before publishing for Paradise Spas
- **Behavior:** The `get_social_accounts` MCP tool returns `{success: true, accounts: [], groups: []}` even when the sub-account has a connected Facebook page. The underlying GHL endpoint `/social-media-posting/oauth/accounts?locationId=...` returns HTTP 401 `"This location is not accessible from this token!"`, but the MCP wrapper catches the error silently and returns a clean empty success response.
- **Expected:** Tool returns connected accounts, or raises an error on 401
- **Impact:** Wasted multiple retries diagnosing a "no accounts connected" state that was actually a silent auth failure. Nearly blocked a post from going live.
- **Resolution:** **Permanent rule — never trust `get_social_accounts` returning 0 results. Always look up `ghlFacebookAccountId` from the Supabase `clients` table first. If NULL, ask the user to confirm visually in GHL Social Planner. Do NOT use `get_social_accounts` as a preflight check.**
- **Status:** CONFIRMED

---

### [GHL-004] Correct endpoint for listing connected social accounts is `/social-media-posting/{locationId}/accounts`
- **Date discovered:** 2026-07-24
- **Context:** Investigating why `get_social_accounts` returned empty; inspecting MCP source code at `ssaofficial/GoHighLevel-MCP`
- **Behavior:** The MCP's `get_social_accounts` calls `/social-media-posting/{locationId}/accounts` (locationId in path). This endpoint works correctly with sub-account PITs and returns all connected accounts including Facebook pages and Google Business Profiles. The `/social-media-posting/oauth/accounts?locationId=...` endpoint (query param) is a different, restricted endpoint that returns 401 for PITs.
- **Expected:** Both endpoint patterns would work
- **Impact:** All 49 clients were initially reported as having no social accounts connected. After switching to the correct endpoint, Paradise Spas and Straight Cuts Tree Service returned their connected accounts.
- **Resolution:** **Permanent rule — when querying social accounts directly via HTTP, always use `GET /social-media-posting/{locationId}/accounts` with locationId in the path, not as a query parameter. The MCP tool handles this correctly internally; the raw curl approach was using the wrong endpoint.**
- **Status:** CONFIRMED

---

### [GHL-005] `create_social_post` requires `userId` field — locationId works as a valid value
- **Date discovered:** 2026-07-24
- **Context:** Publishing Paradise Spas sauna video to Facebook via `create_social_post`
- **Behavior:** `create_social_post` returns HTTP 422 `"userId must be a string, userId should not be empty"` if `userId` is omitted. Passing the `locationId` as the `userId` value satisfies the validation and the post is created successfully.
- **Expected:** `userId` would be optional or auto-resolved from the token
- **Impact:** First publish attempt failed; required a second call with `userId` populated.
- **Resolution:** **Permanent rule — always include `userId` in `create_social_post` calls. Use the sub-account's `ghlLocationId` as the `userId` value when no specific user ID is available.**
- **Status:** CONFIRMED

---

### [GHL-006] BEHAVIOR_LOG path in project instructions is wrong
- **Date discovered:** 2026-07-24
- **Context:** Project instructions reference `infrastructure/ghl/ghl-full-tools-mcp/BEHAVIOR_LOG.md` but that path does not exist in the repo
- **Behavior:** The actual behavior log is at `docs/GHL_PLATFORM_BEHAVIOR.md`
- **Expected:** Path in project instructions matches actual file location
- **Impact:** The GHL Brain Loop (read before session, write back after) was not executed at the start of this session because the file path was wrong
- **Resolution:** **Update project instructions to reference `docs/GHL_PLATFORM_BEHAVIOR.md`. Until fixed, agents should check `docs/` if the instructed path is not found.**
- **Status:** CONFIRMED

---
