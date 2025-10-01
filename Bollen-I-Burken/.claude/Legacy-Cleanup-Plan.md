# Legacy Cleanup Execution Plan

## Goal
Remove all remaining legacy root scripts and enterprise-era helpers while keeping the Three.js build stable. Follow the steps in order; each completes only after its validation checklist passes.

**Key Principles:**
- One change at a time with testing after each step
- Git commit after each successful phase for granular rollback
- Never assume—always verify before deleting
- Test immediately after each change to isolate failures

---

## Phase 0 – Preparation & Baseline
1. **Branch & Backup**
   - Create a safety branch: `git checkout -b chore/legacy-removal`
   - Verify `Backups/` has current snapshots; if not, copy legacy files there before editing.
   - Validation: `git status` shows only the new branch and no pending changes.

2. **Smoke Test Current Build**
   - Launch `index.html` in a browser and ensure start menu -> play -> restart works.
   - **Document working state**: Screenshot console, note FPS, confirm game loop runs for 30+ seconds.
   - Record any console warnings; fix regressions later if they reappear.
   - Validation: baseline behavior documented so regressions are obvious.

3. **Document Current Script Load Order**
   - Open `index.html` and record the exact order of all `<script>` tags.
   - Note any CSS/asset references that might depend on JS globals.
   - Check if `main.js` exists and what it currently imports.
   - Validation: Load order saved to scratch file for reference.

**Phase 0 Checkpoint:**
- [ ] Browser test passes
- [ ] Baseline documented
- [ ] Script order recorded
- **Git commit:** `chore: document baseline before legacy cleanup`

---

## Phase 1 – Map Legacy Usage & Dependencies
4. **Trace Legacy Globals**
   - Files: `js/player.js`, `js/arena.js`, `js/ai.js`, `js/interaction.js`, `js/networking.js`, `js/utils.js`.
   - Document which globals each registers (e.g., `window.PlayerModule`).
   - Validation: short notes committed to `Console_Output.md` or local scratch pad.

5. **Map Function-Level Dependencies**
   - For each legacy file, list:
     - What it exports (functions, constants, classes)
     - What globals it reads (dependencies on other legacy files)
     - Example: `player.js` exports `PlayerModule`, depends on `window.GAME_CONFIG` from `utils.js`
   - Use dependency graph to determine safe deletion order (leaves first, roots last).
   - Validation: Dependency graph shows which files must be migrated first.

6. **Verify KISS Module Completeness**
   - For each legacy export, confirm replacement exists in new architecture:
     - `PlayerModule` → `js/systems/player/PlayerController.js`?
     - `GAME_CONFIG` → `js/core/config.js`?
   - **Critical:** If replacement is missing or incomplete, document what needs to be built first.
   - Test each KISS module independently if possible.
   - Validation: Checklist shows 100% coverage or lists gaps to fill.

7. **Identify All Consumers**
   - Ripgrep for each global (`rg "PlayerModule" js` etc.) to find every usage location.
   - Document which files will break if a legacy module is removed.
   - Check `index.html`, `main.js`, and any other aggregator files.
   - Validation: Complete consumer list for each legacy module.

**Phase 1 Checkpoint:**
- [ ] All legacy exports documented
- [ ] Dependencies mapped with safe order identified
- [ ] Replacement APIs verified or gaps identified
- [ ] All consumers documented
- **Git commit:** `docs: map legacy dependencies and KISS replacements`

---

## Phase 2 – Promote KISS Modules
8. **Create Missing Replacement APIs**
   - For any gaps identified in step 6, create KISS modules before deleting legacy.
   - Ensure new modules export the same interface (or document breaking changes).
   - Test new modules in isolation before integrating.
   - Validation: All gaps from step 6 are filled.

9. **Update `main.js` to Import KISS Modules**
   - Add ES6 imports for all KISS replacements (e.g., `import { PlayerController } from './systems/player/PlayerController.js'`).
   - Replace any `window.PlayerModule` references with direct imports.
   - **Do not delete legacy files yet**—let them coexist temporarily.
   - Validation: `main.js` lint pass or manual review shows no references to legacy globals.

10. **Migrate Utility Constants**
    - Move any remaining values from `js/utils.js` into `js/core/config.js` or `js/utils-new/` as appropriate.
    - Delete duplicated constants to avoid diverging configs.
    - Validation: `rg "GAME_CONFIG" js` shows only the new location.

**Phase 2 Checkpoint:**
- [ ] All KISS modules complete
- [ ] `main.js` uses new imports
- [ ] Browser test passes with both legacy and KISS coexisting
- **Git commit:** `refactor: migrate main.js to KISS modules (legacy still present)`

---

## Phase 3 – Incremental Script Removal
**Critical:** Remove ONE script at a time, testing after each removal.

11. **Remove First Legacy Script from `index.html`**
    - Identify the safest script to remove first (usually leaf nodes with no dependents).
    - Comment out the `<script>` tag in `index.html` (don't delete yet).
    - Browser test: reload and verify game still works.
    - If test passes: delete the `<script>` tag permanently.
    - If test fails: uncomment, document the failure, and investigate why KISS module didn't cover it.
    - Validation: Game works with one fewer legacy script.

12. **Document Rollback Procedure**
    - Before removing each script, note:
      - Which exports it provided
      - Which KISS modules replaced it
      - Expected console output if removal succeeds
    - If rollback needed: `git checkout HEAD -- index.html` to restore script tag.
    - Validation: Rollback procedure tested and documented.

13. **Repeat for Remaining Legacy Scripts**
    - Remove in this order (safest first):
      1. `js/utils.js` (if constants fully migrated)
      2. `js/networking.js` (if unused or replaced)
      3. `js/interaction.js`
      4. `js/ai.js`
      5. `js/arena.js`
      6. `js/player.js` (last, as most likely to have deep dependencies)
    - **Test after each removal** before moving to the next.
    - Validation: After each script removal, browser test passes.

**Phase 3 Checkpoint:**
- [ ] All 6 legacy scripts removed from `index.html` one at a time
- [ ] Browser test passes after each removal
- **Git commits:** One per script removal, e.g., `chore: remove js/utils.js from index.html`

---

## Phase 4 – Remove Enterprise Files
14. **Archive then Delete**
    - Move `config-manager.js`, `error-handler.js`, `component-validator.js` into `Backups/LegacyArchive/` (create directory if missing).
    - Remove script references if they exist in `index.html`.
    - Validation: `rg "config-manager" js` returns nothing.

15. **Clean Sandbox References**
    - Search docs (`rg "config-manager" -g"*.md"`) and update wording to state the files were archived.
    - Validation: Documentation reflects post-cleanup state.

**Phase 4 Checkpoint:**
- [ ] Enterprise files archived
- [ ] Browser test still passes
- **Git commit:** `chore: archive enterprise-era helpers`

---

## Phase 5 – Delete Legacy Files & Final Verification
16. **Delete Legacy Files from Filesystem**
    - Now that scripts are removed from `index.html`, delete the actual legacy files:
      - `js/player.js`, `js/arena.js`, `js/ai.js`, `js/interaction.js`, `js/networking.js`, `js/utils.js`
    - Validation: `Get-ChildItem js | rg "player.js"` returns nothing.

17. **Consolidate Aggregators**
    - If `js/game.js` or other aggregators remain, confirm they still add value.
    - Otherwise, rehome the functionality into `main.js` and delete the file.
    - Validation: `rg "GameCore" js` to ensure no orphan references.

18. **Browser Smoke Test (Final)**
    - Reload `index.html`; exercise start menu, gameplay loop, and restart path.
    - Let game run for 60+ seconds to catch late-loading issues.
    - Confirm no console errors and FPS overlays still trigger via `debug-commands.js`.
    - Validation: Document results + screenshots if regressions appear.

19. **Static Checks**
    - Run `rg "window\." js` to ensure no unexpected globals remain.
    - Check for any remaining references to deleted files: `rg "player\.js" .`
    - Optionally run ESLint/Prettier if available; otherwise, manual formatting review.
    - Validation: All checks clean.

20. **Final Commit**
    - `git status` should show only intended deletions/edits.
    - Commit message suggestion: `chore: remove legacy bootstrap scripts and complete KISS migration`.
    - Validation: push branch or share diff for review.

**Phase 5 Checkpoint:**
- [ ] All legacy files deleted
- [ ] Browser test passes
- [ ] Static checks clean
- **Git commit:** `chore: remove legacy bootstrap scripts and complete KISS migration`

---

## Contingency & Rollback
### If Regression Appears During Phase 3
- **Immediate rollback:** `git checkout HEAD -- index.html` to restore script tag.
- **Investigate:** Diff legacy file against KISS module to find missing exports.
- **Document:** Note what was missing in the dependency map for future reference.
- **Fix forward:** Add missing functionality to KISS module, test, then retry removal.

### If Regression Appears After Phase 5
- **Partial rollback:** Restore specific legacy file from `Backups/LegacyArchive/`.
- **Add script tag back:** Re-add to `index.html` in original position.
- **Test:** Verify restoration fixes the issue.
- **Document:** Update plan with what went wrong for next attempt.

### Rollback Decision Tree
1. Is the regression critical (game doesn't load)? → Full rollback to last working commit.
2. Is the regression minor (console warning)? → Document and continue, fix later.
3. Is the regression specific to one feature? → Restore only the related legacy file.

**Keep `Backups/LegacyArchive/` until:**
- Game runs successfully for 1 week in production/testing
- All stakeholders confirm no regressions
- Minimum 3 successful end-to-end test runs

---

## Success Criteria
- [ ] All 6 legacy scripts removed from `index.html`
- [ ] All legacy files deleted from `js/` directory
- [ ] `main.js` imports only from KISS architecture (`core/`, `systems/`, `managers/`)
- [ ] Game loads and runs without console errors
- [ ] Start menu, gameplay, and restart all function correctly
- [ ] FPS overlay and debug commands still work
- [ ] No references to `window.PlayerModule` or similar legacy globals
- [ ] Git history shows incremental commits for easy rollback

---

## Estimated Timeline
- **Phase 0:** 30 minutes (documentation and baseline)
- **Phase 1:** 2-3 hours (dependency mapping and verification)
- **Phase 2:** 1-2 hours (updating main.js and migrating constants)
- **Phase 3:** 2-4 hours (incremental script removal with testing)
- **Phase 4:** 30 minutes (archiving enterprise files)
- **Phase 5:** 1 hour (final cleanup and verification)

**Total:** 7-11 hours spread across multiple sessions to allow for testing and validation.
