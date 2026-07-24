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
