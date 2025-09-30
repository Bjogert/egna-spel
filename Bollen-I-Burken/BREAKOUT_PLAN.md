# BREAKOUT PLAN

## Goals
- Keep every playable feature working after each move (start menu, movement, AI tagging, HUD, audio stubs).
- Shrink oversized scripts toward the 200-500 line target without introducing new abstractions that break the current KISS flow.
- Reuse the existing js/core, js/systems, and js/managers folders so new files land where the architecture docs expect them.
- Preserve global exports (window.GameCore, window.GameUI, etc.) until we have a full ES module build.

## Current Hotspot Files
| File | Lines | Primary Role | Notes |
| --- | --- | --- | --- |
| js/game.js | 747 | ECS primitives, component classes, GameEngine | Everything depends on its System base; needs to be the first breakout.
| js/ai.js | 672 | AIHunter and VisionCone components plus AISystem logic | Mixed responsibilities; heavy vision helper methods.
| js/ui.js | 557 | UISystem, DOM builders, notifications, menu toggles | Contains both setup and runtime updates; over 20 DOM helpers.
| js/player.js | 536 | MovementSystem, PlayerFactory, PlayerManager, vision mesh helpers | Three separate concerns in one file.
| js/arena.js | 434 | ArenaBuilder plus lighting, obstacles, can creation | Geometry helpers and validation utilities bundled together.
| js/networking.js | 409 | NetworkSystem, message handlers, WebRTC/WebSocket stubs | Transport classes share file with gameplay sync logic.
| js/resource-manager.js | 402 | ResourceManager singleton with factories and observers | Factories + tracking + stats; candidate for splitting by concern.
| js/audio.js | 391 | AudioSystem and procedural generators | Setup, procedural synthesis, and runtime updates all inline.
| js/controls.js | 363 | InputSystem handling keyboard, touch, gamepad | Device-specific setup functions can move out.
| js/interaction.js | 307 | InteractionSystem, can/door handlers, VFX | Interaction effects and cooldown logic are separable.
| js/core/config.js | 252 | CONFIG object | Already within target, keep as-is for now.
| js/utils.js | 238 | GAME_CONFIG constants + Utility helpers | Within range; revisit only if we modularise constants later.

Legacy enterprise modules (config-manager.js, component-validator.js, error-handler.js) remain untouched unless we decide to archive them separately.

## File-by-File Breakouts

### game.js (747 lines)
- Keep a thin game.js that stitches the core modules together and publishes legacy globals.
- Move Entity class into js/core/entity.js (focus on component map helpers and debug utilities).
- Move component classes: Transform, PlayerInput, Renderable, Movement, Player, Interactable, Hideable, Collider into js/core/components/ (grouped by gameplay vs world components so each file stays under ~250 lines).
- Move GameState into js/core/game-state.js, keeping entity/player management and phase tracking.
- Move System base class into js/core/system.js so all systems can import a lightweight parent.
- Move GameEngine into js/core/game-engine.js, leaving only bootstrap glue in game.js.
- Update index.html script order to load new core files before any system scripts; maintain global window.GameCore aggregator that pulls from the new modules.

### ai.js (672 lines)
- Create js/core/components/ai-hunter.js and js/core/components/vision-cone.js for the ECS components (they are referenced by MovementSystem and InteractionSystem).
- Move the remaining AI logic into js/systems/ai-system.js, focusing on state updates and vision checks.
- Extract line-of-sight geometry helpers (checkLineOfSight, getObstacleCollisionPoint, etc.) into js/utils-new/vision-utils.js so both AI and future stealth features can share them.
- After the split, keep a slim i.js that re-exports the pieces for backward compatibility until script tags are updated everywhere.

### player.js (536 lines)
- Move MovementSystem into js/systems/movement-system.js; keep collision helpers either inside or break into js/systems/movement/collision-helpers.js if the file still exceeds 400 lines.
- Move PlayerFactory static helper into js/managers/player-factory.js (responsible for mesh creation and component wiring).
- Move PlayerManager class into js/managers/player-manager.js (handles entity bookkeeping, spawn/clear logic, vision debug meshes).
- Provide a temporary player.js shim that loads the three new files and preserves existing globals (window.GamePlayer).

### controls.js (363 lines)
- Move the class to js/systems/input/input-system.js.
- Break device-specific setup (setupKeyboardControls, setupTouchControls, setupGamepadControls) into standalone helpers under js/systems/input/keyboard.js, 	ouch.js, and gamepad.js (each exporting init + teardown functions).
- Keep shared state transitions (updatePlayerInput, update, 	ogglePause) inside the main system file.

### ui.js (557 lines)
- Create js/systems/ui/ui-system.js for the runtime update loop (update, updateGameStats, updateGameTimer, etc.).
- Extract DOM construction into js/systems/ui/ui-dom-factory.js (functions: createGameTitle, createGameStats, createGameTimer, etc.).
- Extract overlay controls and messaging (showMessage, showNotification, setMenuVisible, 	oggleUI) into js/systems/ui/ui-overlays.js.
- Leave ui.js as a compatibility wrapper until index.html references the new files directly.

### audio.js (391 lines)
- Move the class to js/systems/audio/audio-system.js.
- Lift procedural generators (generateProcedualSounds, createFootstepSound, createUISound, createAmbientSound, createProceduralMusic) into js/systems/audio/procedural-bank.js.
- Move fallback HTML5 helpers into js/systems/audio/audio-fallback.js.
- Keep runtime update functions (update, updateFootsteps, setMasterVolume, toggles) in the main system file.

### arena.js (434 lines)
- Relocate ArenaBuilder to js/managers/arena/arena-builder.js.
- Split geometry helpers into js/managers/arena/floor.js, walls.js, central-can.js, and obstacles.js (each exporting a build function the builder composes).
- Move validation utilities (generateRandomPosition, isValidObstaclePosition, getDistanceFromCenter) to js/managers/arena/placement-utils.js so both obstacles and future spawn points can reuse them.

### networking.js (409 lines)
- Move NetworkSystem into js/systems/network/network-system.js.
- Extract message handlers into js/systems/network/message-handlers.js (functions for handlePlayerJoin, handleGameState, etc.).
- Keep transport stubs in dedicated files: js/systems/network/webrtc-network.js and js/systems/network/websocket-network.js.
- Ensure compatibility exports continue to populate window.GameNetwork until the HTML script order is updated.

### resource-manager.js (402 lines)
- Keep singleton creation in js/managers/resource-manager.js.
- Move factory registration into js/managers/resource/resource-factories.js (export a function that injects geometry/material factories).
- Move observer + stats helpers (ddObserver, emoveObserver, 
otifyObservers, updateStats, getStats) into js/managers/resource/resource-observers.js.
- This lets the core manager focus on track/dispose logic while related utilities stay under 250 lines each.

### interaction.js (307 lines)
- Move the class into js/systems/interaction/interaction-system.js.
- Extract specific interaction handlers into js/systems/interaction/interactions.js (functions for can, door, control panels) and visual feedback helpers into js/systems/interaction/interaction-visuals.js.
- Leave cooldown/state bookkeeping inside the main system file.

### Remaining Notes
- js/core/config.js and js/utils.js can stay put for now; once the rest is trimmed we can revisit moving GAME_STATES constants into a js/core/constants.js file.
- The inline bootstrap script in index.html is already >400 lines; once the systems are modular we can plan a follow-up breakout into js/main.js plus per-feature initialisers.

## Execution Sequence (ship-ready checkpoints)
1. **Baseline Smoke Test**: launch index.html, ensure the current build plays without errors (record a quick console screenshot for reference).
2. **Stage 1 – Core ECS extraction**:
   - Create new files under js/core/ and copy-move Entity, components, GameState, System, and GameEngine.
   - Adjust index.html script tags to load js/core/*.js before any system files.
   - Verify: page loads, start menu appears, console shows Game engine initialized, movement still works.
3. **Stage 2 – Player and Movement**:
   - Move MovementSystem, PlayerFactory, PlayerManager into their targets.
   - Update script tags and window.GamePlayer aggregator.
   - Verify: player spawns, movement and collisions still function, AI vision cone attaches to hunter.
4. **Stage 3 – Input, UI, Audio**:
   - Split controls.js, ui.js, udio.js as outlined.
   - Wire new scripts, ensure menu buttons, HUD updates, and audio toggles still respond.
   - Verify: keyboard/touch/gamepad input, timer updates, menu overlay toggles, no audio errors in console.
5. **Stage 4 – AI, Interaction, Arena**:
   - Move AI components/system, interaction helpers, and arena builder pieces.
   - Rebuild script order (arena helpers before bootstrap, AI system before movement update).
   - Verify: AI patrols, vision cone reacts, tagging ends the round, can interaction logs the placeholder message.
6. **Stage 5 – Networking and Resource Manager**:
   - Split networking transports/handlers and resource manager utilities.
   - Verify: local mode still logs Network system running in local mode, resource stats appear in console without errors.
7. **Cleanup Pass**:
   - Remove shim files once index.html references the new modules directly.
   - Re-run full manual test: start menu -> start game -> survive/take tag -> return to menu.

## Verification Checklist per Stage
- Load index.html in Chrome/Firefox, watch the console for uncaught errors.
- Confirm the Start button transitions the phase to PLAYING and that GameEngine tick counter advances.
- Ensure AI tagging still calls window.GameEngine.gameOver('tagged') and the menu returns.
- Run window.GameEngine.getStats() in the dev console to confirm systems report expected counts.

## Additional Considerations
- Keep using global namespace exports until every consumer is updated; we can codify ES module imports later.
- Script order matters: core -> components -> systems -> managers -> bootstrap; adjust incrementally so each stage remains runnable.
- Maintain ASCII output to avoid new mojibake issues highlighted in documentation.
- Each move deserves a commit with manual test notes so we can bisect if gameplay regresses.