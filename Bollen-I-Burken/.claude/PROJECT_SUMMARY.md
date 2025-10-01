# PROJECT_SUMMARY

## Overview
- Web-based Three.js prototype of the Swedish hide-and-seek game "Dunkgömme"
- Goal: preserve cultural rules (guard, can kicking, rescues) while building scalable ECS foundation
- Target platforms: modern desktop and mobile browsers; no build step, just open `index.html`

## Current Implementation
- Square arena with walls, lighting, central can, and optional obstacles (`js/arena.js`)
- WASD, touch, and gamepad input driving local player cube plus collision-aware movement (`js/controls.js`, `js/player.js`)
- Single AI hunter patrolling with state machine, vision checks, and tagging detection (`js/ai.js`)
- HUD with timers, stats, notifications, and debug helpers (`js/ui.js`)
- Full-screen start / game over menu overlay with cultural context, restart flow, and survival summary (`index.html`, `css/style.css`, `js/ui.js`)
- Procedural audio stubs for footsteps, UI, and ambient loops (`js/audio.js`)
- Interaction system recognizes proximity to the can and logs placeholder rescue effects (`js/interaction.js`)
- Networking layer scaffolded for future WebRTC/WebSocket work (`js/networking.js`)

## Architecture Notes
- Custom ECS in `js/game.js` manages entities, components, systems, and game loop timers
- Simplified configuration lives in `js/core/config.js` (`CONFIG` object plus helper getters/setters)
- Utility helpers (`js/utils.js`) provide vector math, logging, timing, constants, and debug flags
- Game loop now idles in `START_MENU`/`GAME_OVER` phases so input, movement, and AI systems stay paused until a round begins (`js/game.js`, `js/controls.js`, `js/player.js`, `js/ai.js`)
- `ResourceManager` singleton still active for geometry/material tracking despite KISS push (`js/resource-manager.js`)
- Legacy enterprise modules (`config-manager.js`, `error-handler.js`, `component-validator.js`) remain in repo for reference but are no longer loaded

## Active Systems (JS)
- `MovementSystem` updates player and AI transforms, clamps to arena, and syncs meshes and vision cones
- `InputSystem` normalizes keyboard, touch, and gamepad actions and writes to `PlayerInput` components
- `AISystem` handles patrol, hunting, and search states, vision occlusion, and player tagging
- `UISystem` builds DOM overlays, exposes stat timers, and surfaces notifications
- `AudioSystem` wires Web Audio API, footstep cadence, and ambient score placeholders
- `InteractionSystem` tracks nearby interactables, cooldowns, and can-kick responses
- `NetworkSystem` currently a placeholder with serialization hooks for future multiplayer

## Tooling & Debugging
- Launch by opening `Bollen-I-Burken/index.html` in a supported browser (Chrome 60+, Firefox 55+, Safari 12+, Edge 79+)
- Global helpers: `debugGame()`, `debugMovement()`, `testKeyboard()`, `testAIVision()`, `debugResources()`
- Toggle collision with `disableCollision()` and `enableCollision()` for diagnostics
- Logs gated by `window.DEBUG` flag (enabled in `index.html` on load)

## Known Gaps / Next Steps
- Phase 1 refactor: validate gameplay, then delete unused enterprise files and finish folder split (core/systems/managers/utils)
- Phase 2 targets: implement can kicking mechanics, hiding spots, and the vision-driven rescue loop
- UI plan (`.claude/Configuration-Sliders-Plan.md`): obstacle sliders and dynamic regeneration not yet built
- README and other docs contain mojibake characters and need encoding cleanup
- Multiplayer, advanced audio, obstacle presets, and cultural localization remain future phases

## Key Documents
- `.claude/Architecture-Overview.md` - KISS-oriented architecture and migration phases
- `.claude/PHASE1-*` - status logs for enterprise bloat removal
- `.claude/Bug.md` - historical movement bugs, validation issues, and fixes
- `.claude/documentation.md` - running notes on resolved issues and current feature set
- `.claude/Configuration-Sliders-Plan.md` - UI and design brief for obstacle tuning
- `README.md` - high-level pitch (needs encoding cleanup)

