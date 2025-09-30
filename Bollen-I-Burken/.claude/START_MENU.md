# Start & Game Over Menu Plan

## Goals
- Full-screen start menu that hides the arena until play begins.
- "Start" button launches gameplay; menu overlay disappears.
- After a loss, return to the same overlay with "Game Over" / "Play Again?" messaging.
- Keep implementation simple (Option A) but leave a clean path to promote menu logic into `UISystem` later.
- Move gameplay tips, controls, and objectives onto the start screen to keep the in-game HUD minimal.

## Implementation Steps

1. **Extend Game State Definitions**
   - Add `START_MENU` and `GAME_OVER` to `GAME_STATES` in `js/utils.js`.
   - Initialize the engine in `START_MENU` state so systems know to idle until gameplay begins.

2. **Defer Arena/Entity Creation**
   - In `index.html` initialization, only build the Three.js renderer and lightweight scaffolding while in the start menu.
   - Move arena, player, and AI creation into a `startGameplay()` helper so they are instantiated when the user presses `Start` or `Play Again`.

3. **Create Menu Overlay Structure**
   - Insert a `<div id="startMenu">` after `#gameUI` with child elements:
     - Title block, Swedish cultural blurb, controls/how-to-play list, and goal description.
     - Primary button (`#startButton`) that toggles between "Start Game" and "Play Again".
     - Status text (`#menuStatus`) initially hidden; shows "Game Over" when appropriate.
   - Use semantic HTML to make future UISystem migration straightforward.

4. **Add Full-Screen Styling**
   - In `css/ui.css`, create rules for `#startMenu` to cover the viewport (fixed, top/left 0, `width: 100vw`, `height: 100vh`, dark overlay background, centered content via flex).
   - Style buttons with existing blue/gray palette, hover/focus states, and responsive typography.
   - Add `.hidden` utility class (if needed) for toggling visibility.

5. **Wire Menu Logic (Option A, Future-Friendly)**
   - In `index.html`, cache references to `startMenu`, `menuStatus`, `startButton`.
   - Implement `showStartMenu({ gameOver })` and `hideStartMenu()` functions:
     - When showing, pause HUD updates (call lightweight hooks on `uiSystem` such as `uiSystem.setMenuVisible(true)` to blank stats/timers).
     - When hiding, resume HUD updates.
   - Keep logic co-located with bootstrap code for now, but structure helpers so they delegate to `uiSystem` if you later promote to Option B (i.e., wrap DOM changes in functions that can be moved).

6. **Start / Restart Flow (Reuse Engine Reset)**
   - `startButton` click handler should:
     - Hide the menu overlay.
     - Call `gameEngine.reset()` to clear prior entities/state before each round.
     - Run `startGameplay()` to rebuild arena, player, AI, and set `gameEngine.start()`.
   - Ensure `gameEngine.reset()` also refreshes arena visuals via `arenaBuilder.clearArena()` so repeated plays do not leak meshes.

7. **Game Over Handling**
   - Update `GameEngine.gameOver(reason)` to:
     - Stop systems as today.
     - Call `showStartMenu({ gameOver: true })`, which updates button label to "Play Again" and populates `menuStatus` with "Game Over".
     - Optional: surface survival time or best score on the menu.

8. **Input and System Gating**
   - Prevent `MovementSystem` and similar systems from acting when not in `PLAYING` state (e.g., early return if `gameEngine.gameState.gamePhase !== GAME_STATES.PLAYING`).
   - On menu show, disable pointer/touch listeners that affect gameplay; re-enable on start.

9. **Clean In-Game HUD**
   - Move control reminders/goals from the HUD to the start menu content.
   - Optionally hide the HUD panel (`#controlsHelp`, etc.) when menu is shown, and keep only critical stats visible during gameplay.

10. **Accessibility & Polish**
    - Focus the start button when menu opens; allow `Enter`/`Space` activation.
    - Consider gentle fade-in/out transitions between menu and game (CSS opacity or camera tween).
    - Optional creative touches: Swedish folklore facts, subtle ambient loop on menu, best-time tracker.

11. **Testing Checklist**
    - Load the page; verify arena is hidden and menu covers the viewport.
    - Click `Start Game`; ensure gameplay begins, menu hides, HUD resumes, and movement works.
    - Trigger game over via AI tag; confirm menu reappears with "Game Over" messaging and `Play Again` button.
    - Start multiple rounds back-to-back; verify no duplicate entities or resource leaks.
    - Test keyboard, mouse, and touch interactions with the menu overlay.

## Future Migration Path (Option B)
- If menu logic grows, move `showStartMenu`/`hideStartMenu` into `UISystem` and swap DOM references to methods there.
- Centralize state handling by letting `UISystem` listen for `gameState` phase changes and update overlays accordingly.
- Because the helper functions already encapsulate DOM manipulation, promotion should only require relocating the helpers and updating call sites.

