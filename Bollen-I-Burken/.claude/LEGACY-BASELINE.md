# Legacy Cleanup Baseline - October 1, 2025

## Current Script Load Order (from index.html)

```html
<!-- Game Scripts -->
<script src="js/core/config.js"></script>
<script src="js/utils.js"></script>  <!-- ✅ KEEP - Critical utilities -->

<!-- ECS Core -->
<script src="js/core/entity.js"></script>
<script src="js/core/components/transform.js"></script>
<script src="js/core/components/player-input.js"></script>
<script src="js/core/components/renderable.js"></script>
<script src="js/core/components/movement.js"></script>
<script src="js/core/components/player.js"></script>
<script src="js/core/components/interactable.js"></script>
<script src="js/core/components/hideable.js"></script>
<script src="js/core/components/collider.js"></script>
<script src="js/core/components/ai-hunter.js"></script>
<script src="js/core/components/vision-cone.js"></script>
<script src="js/core/system.js"></script>
<script src="js/core/game-state.js"></script>
<script src="js/core/game-engine.js"></script>

<!-- Core Aggregator & Systems -->
<script src="js/managers/resource/resource-factories.js"></script>
<script src="js/managers/resource/resource-observers.js"></script>
<script src="js/managers/resource/resource-manager-core.js"></script>
<script src="js/resource-manager.js"></script>
<script src="js/game.js"></script>
<script src="js/controls.js"></script>
<script src="js/ui.js"></script>
<script src="js/audio.js"></script>
<script src="js/systems/movement-system.js"></script>
<script src="js/managers/player-factory.js"></script>
<script src="js/managers/player-manager.js"></script>
<script src="js/managers/arena/arena-helpers.js"></script>
<script src="js/managers/arena/arena-floor.js"></script>
<script src="js/managers/arena/arena-walls.js"></script>
<script src="js/managers/arena/arena-lighting.js"></script>
<script src="js/managers/arena/arena-can.js"></script>
<script src="js/managers/arena/arena-obstacles.js"></script>
<script src="js/managers/arena/arena-cleanup.js"></script>
<script src="js/managers/arena/arena-builder.js"></script>
<script src="js/systems/ai/ai-system.js"></script>
<script src="js/systems/interaction/interaction-visuals.js"></script>
<script src="js/systems/interaction/interaction-handlers.js"></script>
<script src="js/systems/interaction/interaction-system.js"></script>

<!-- ❌ LEGACY AGGREGATORS TO REMOVE -->
<script src="js/player.js"></script>
<script src="js/arena.js"></script>
<script src="js/ai.js"></script>
<script src="js/interaction.js"></script>
<script src="js/systems/network/network-system.js"></script>
<script src="js/networking.js"></script>

<!-- Game Lifecycle and UI -->
<script src="js/systems/ui/menu-overlay.js"></script>
<script src="js/managers/game-lifecycle.js"></script>

<!-- Main Bootstrap and Game Loop -->
<script src="js/main.js"></script>

<!-- Debug Commands (development) -->
<script src="js/debug-commands.js"></script>
```

## Files to Delete (Total: 8 files)

### Immediate - Enterprise Bloat (NOT in index.html)
1. ✅ `js/component-validator.js` (600 lines) - Validation disabled, no dependents
2. ✅ `js/config-manager.js` (747 lines) - Only used by component-validator
3. ✅ `js/error-handler.js` (605 lines) - Only used by enterprise files

### Phase 3 - Legacy Aggregators (IN index.html - remove one at a time)
4. `js/networking.js` - Pure aggregator, networking is placeholder
5. `js/interaction.js` - Pure aggregator, re-exports InteractionSystem
6. `js/ai.js` - Pure aggregator, re-exports AISystem
7. `js/arena.js` - Pure aggregator, re-exports ArenaBuilder
8. `js/player.js` - Pure aggregator, re-exports PlayerManager

### KEEP - Critical Implementation
- ✅ `js/utils.js` - **DO NOT DELETE** - 354 active references across 47 files

## Dependency Analysis

### js/player.js (Legacy Aggregator)
- **Exports:** `window.GamePlayer = { MovementSystem, PlayerFactory, PlayerManager }`
- **Dependencies:** All already loaded directly
- **Used by:** NONE (no code uses GamePlayer namespace)
- **Replacement:** Already loaded directly in index.html
- **Safe to remove:** YES

### js/arena.js (Legacy Aggregator)
- **Exports:** `window.GameArena.ArenaBuilder`
- **Dependencies:** ArenaBuilder from managers/arena/
- **Used by:** NONE
- **Replacement:** js/managers/arena/arena-builder.js
- **Safe to remove:** YES

### js/ai.js (Legacy Aggregator)
- **Exports:** `window.GameAI = { AIHunter, VisionCone, AI_STATES, AISystem }`
- **Dependencies:** All already loaded from core/components and systems/ai
- **Used by:** NONE
- **Replacement:** Already loaded directly
- **Safe to remove:** YES

### js/interaction.js (Legacy Aggregator)
- **Exports:** `window.GameSystems.InteractionSystem`
- **Dependencies:** InteractionSystem from systems/interaction/
- **Used by:** NONE
- **Replacement:** js/systems/interaction/interaction-system.js
- **Safe to remove:** YES

### js/networking.js (Legacy Aggregator)
- **Exports:** `window.GameNetwork = { NetworkSystem, WebRTCNetwork, WebSocketNetwork }`
- **Dependencies:** Networking components (placeholder functionality)
- **Used by:** NONE
- **Replacement:** js/systems/network/network-system.js
- **Safe to remove:** YES

### js/utils.js (CRITICAL - KEEP)
- **Exports:** `window.GameUtils = { Utils, GAME_CONFIG, GAME_STATES, PLAYER_STATES }`
- **Dependencies:** NONE (self-contained)
- **Used by:** 354 references across 47 files
- **Replacement:** NONE - this IS the implementation
- **Safe to remove:** NO - KEEP THIS FILE

## Safe Deletion Order

1. **Immediate (No index.html changes needed):**
   - js/component-validator.js
   - js/config-manager.js
   - js/error-handler.js

2. **Incremental (Remove from index.html one at a time, test between each):**
   - js/networking.js (safest - networking is placeholder)
   - js/interaction.js
   - js/ai.js
   - js/arena.js
   - js/player.js

## Baseline Game State

- **Branch:** chore/legacy-removal
- **Game loads:** [TO BE TESTED]
- **Start menu works:** [TO BE TESTED]
- **Gameplay works:** [TO BE TESTED]
- **Console errors:** [TO BE DOCUMENTED]
- **FPS:** [TO BE MEASURED]

## Expected Results After Cleanup

- **Lines removed:** ~2,952 lines of over-engineered code
- **Files removed:** 8 legacy/enterprise files
- **Regressions:** NONE expected (all are unused wrappers)
- **Performance impact:** None or slight improvement (less code to parse)
- **Maintenance impact:** Significantly improved (clearer structure, no misleading aggregators)
