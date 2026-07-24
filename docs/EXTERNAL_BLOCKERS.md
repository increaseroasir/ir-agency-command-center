# External Blockers

These are items outside GHL Command's control that block workflow activation or launch. They are tracked here so they are never re-discovered mid-session and never confused with build problems.

---

| ID | Blocker | Blocks | Owner | Status |
|----|---------|--------|-------|--------|
| EXT-001 | Real users do not exist yet | Workflow actions 01-02 (contact enrollment triggers) | You | Open |
| EXT-002 | Calendar not created | Entire folder 06 (calendar-based workflows) | You | Open |
| EXT-003 | Manus intake path not confirmed | Workflow 01-00 (intake entry point) | You | Open |
| EXT-004 | A2P registration not started for new store | SMS actions in all workflows for new store | You | Open |

---

**Rule:** When a workflow build is blocked by an item in this table, do not attempt workarounds or placeholder logic. Record the dependency, stop, and surface the blocker to the human. Do not mark a workflow as complete if an external blocker prevents live validation.

---

## Update Log

| Date | Change |
|------|--------|
| 2025-07-23 | Initial four blockers identified and logged |
