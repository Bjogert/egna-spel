# Phase 1: Ultra-Detailed Execution Plan

**CRITICAL**: This phase removes 1,949 lines of enterprise code. Must be done carefully!

---

## Analysis Complete - All Dependencies Mapped

### ConfigManager Dependencies (36 total uses)
1. **index.html** - 7 uses (camera setup, debug functions)
2. **js/arena.js** - 27 uses (**HEAVIEST USER**)
3. **js/ai.js** - 1 use (arena size with fallback)
4. **js/player.js** - 1 use (arena size with fallback)
5. **js/interaction.js** - 3 uses (interaction settings)
6. **js/component-validator.js** - 2 uses (validation settings)

### ErrorHandler Dependencies (12 total uses)
1. **index.html** - 5 uses (init, game loop ErrorBoundary, global handlers)
2. **js/ai.js** - 1 use (hunter update try-catch)
3. **js/interaction.js** - 2 uses (interaction try-catch)
4. **js/component-validator.js** - 2 uses (validation errors)
5. **js/config-manager.js** - Multiple internal uses (being deleted)
6. **js/error-handler.js** - Internal uses (being deleted)

### ComponentValidator Dependencies (Critical!)
1. **index.html** - Initialization and debug functions
2. **js/game.js** - **LINE 401-412: Uses ValidatedEntity for createEntity()!**

---

## Execution Order (From Safest to Most Critical)

### Step 1: Create Compatibility Shims (SAFETY FIRST!)

Before touching anything, create compatibility shims in config.js to minimize breakage:

```javascript
// At bottom of js/core/config.js

// === COMPATIBILITY SHIMS FOR MIGRATION ===
// These allow old code to work during transition

// Fake ConfigManager for code that uses getInstance()
class ConfigManager {
    static getInstance() {
        if (!ConfigManager._instance) {
            ConfigManager._instance = new ConfigManager();
        }
        return ConfigManager._instance;
    }

    get(path, defaultValue) {
        return getConfig(path, defaultValue);
    }

    set(path, value) {
        return setConfig(path, value);
    }
}

// Make globally available
window.ConfigManager = ConfigManager;
window.CONFIG = CONFIG;
window.getConfig = getConfig;
window.setConfig = setConfig;
```

**Benefit**: Existing code continues to work while we migrate!

---

### Step 2: Update config.js with Missing Settings

Current config.js is missing some settings that arena.js needs:

**Add to CONFIG object**:
```javascript
can: {
    radius: 0.8,
    height: 1.6,
    color: 0x8B4513,  // Swedish brown
    position: { x: 0, y: 0.8, z: 0 }
},

obstacles: {
    // ... existing ...
    minDistanceFromWalls: 1.0,
    minDistanceBetween: 2.0,
    maxPlacementAttempts: 100,
    material: 'standard'  // 'standard', 'phong', 'lambert'
},

interaction: {
    maxDistance: 5.0,
    cooldownMs: 500,
    visualFeedback: true
},

validation: {
    enabled: false,  // DISABLED - no validation needed
    strictMode: false
}
```

---

### Step 3: Update index.html (Carefully!)

**File**: c:\Users\robert\egna-spel\Bollen-I-Burken\index.html

#### 3a. Update script tags (lines 35-48)

**REMOVE**:
```html
<script src="js/error-handler.js"></script>
<script src="js/config-manager.js"></script>
<script src="js/component-validator.js"></script>
```

**ADD** (before utils.js):
```html
<script src="js/core/config.js"></script>
```

**Result**:
```html
<!-- Game Scripts -->
<script src="js/core/config.js"></script>  <!-- NEW! -->
<script src="js/utils.js"></script>
<script src="js/resource-manager.js"></script>
<script src="js/game.js"></script>
<script src="js/controls.js"></script>
<script src="js/ui.js"></script>
<script src="js/audio.js"></script>
<script src="js/arena.js"></script>
<script src="js/player.js"></script>
<script src="js/ai.js"></script>
<script src="js/interaction.js"></script>
<script src="js/networking.js"></script>
```

#### 3b. Update global variables (lines 58-76)

**REMOVE**:
```javascript
let errorHandler;
let configManager;
let componentValidator;
```

**KEEP**: All other variables

#### 3c. Update initializeGame() function (lines 83-140)

**REMOVE** (lines 87-106):
```javascript
// Initialize Error Handler (Enterprise foundation)
errorHandler = new ErrorHandler();

// Initialize Configuration Manager (Enterprise foundation)
configManager = new ConfigManager();

// Add configuration sources
configManager.addSource('localStorage', new LocalStorageConfigSource());
configManager.addSource('url', new URLConfigSource());

// Load configuration from URL parameters and localStorage
await configManager.loadFromSource('url');
await configManager.loadFromSource('localStorage');

// Initialize Resource Manager (Enterprise foundation)
resourceManager = new ResourceManager();

// Initialize Component Validator (Enterprise foundation)
componentValidator = new ComponentValidator();
componentValidator.initialize(errorHandler, configManager);
```

**REPLACE WITH**:
```javascript
// Initialize Resource Manager (simple cleanup tracking)
resourceManager = new ResourceManager();

Utils.log('Simple KISS configuration loaded from config.js');
```

**UPDATE** error handling (lines 128-140):
```javascript
} catch (error) {
    // Simple error handling - no enterprise ErrorHandler
    console.error('Failed to initialize game:', error);
    Utils.error('Game initialization failed', error);
    showErrorMessage('Failed to initialize game: ' + error.message);
}
```

#### 3d. Update initializeThreeJS() function (lines 142-190)

**REPLACE** (line 152):
```javascript
// OLD:
scene.background = new THREE.Color(configManager.get('graphics.backgroundColor'));

// NEW:
scene.background = new THREE.Color(CONFIG.graphics.backgroundColor);
```

**REPLACE** (lines 155-158):
```javascript
// OLD:
const cameraHeight = configManager.get('camera.height');
const cameraDistance = configManager.get('camera.distance');
const cameraFov = configManager.get('camera.fov');
const lookAtOffset = configManager.get('camera.lookAtOffset');

// NEW:
const cameraHeight = CONFIG.camera.height;
const cameraDistance = CONFIG.camera.distance;
const cameraFov = CONFIG.camera.fov;
const lookAtOffset = CONFIG.camera.lookAtOffset;
```

#### 3e. Update game loop (lines 347-373)

**REMOVE ErrorBoundary.wrap** (line 348):
```javascript
// OLD:
const gameLoop = ErrorBoundary.wrap(function gameLoop(currentTime) {
    // ... game loop code ...
}, {
    system: 'GameLoop',
    function: 'gameLoop'
}, {
    level: 'ERROR',
    suppressErrors: false,
    returnDefault: null
});

// NEW (simple function):
function gameLoop(currentTime) {
    try {
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;

        // Update game engine (handles tick-based updates)
        gameEngine.update(deltaTime);

        // Render the Three.js scene
        renderer.render(scene, camera);

        // Update FPS counter
        updateFPS(currentTime);

        // Update UI with current stats
        updateGameUI();

        // Continue the game loop
        requestAnimationFrame(gameLoop);
    } catch (error) {
        console.error('Game loop error:', error);
        // Try to continue anyway
        requestAnimationFrame(gameLoop);
    }
}
```

#### 3f. Update global error handlers (lines 467-491)

**REPLACE** (lines 467-479):
```javascript
// OLD:
window.addEventListener('error', (event) => {
    if (errorHandler) {
        errorHandler.handle(new GameError('Uncaught global error', ERROR_CATEGORIES.SYSTEM, {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack
        }), 'CRITICAL');
    } else {
        Utils.error('Global error caught', event.error);
    }
    showErrorMessage('An unexpected error occurred. Please reload the game.');
});

// NEW:
window.addEventListener('error', (event) => {
    console.error('Global error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
    Utils.error('Global error caught', event.error);
    showErrorMessage('An unexpected error occurred. Please reload the game.');
});
```

**REPLACE** (lines 481-491):
```javascript
// OLD:
window.addEventListener('unhandledrejection', (event) => {
    if (errorHandler) {
        errorHandler.handle(new GameError('Unhandled promise rejection', ERROR_CATEGORIES.SYSTEM, {
            reason: event.reason,
            promise: event.promise
        }), 'CRITICAL');
    } else {
        Utils.error('Unhandled promise rejection', event.reason);
    }
    showErrorMessage('An unexpected error occurred. Please reload the game.');
});

// NEW:
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    Utils.error('Unhandled promise rejection', event.reason);
    showErrorMessage('An unexpected error occurred. Please reload the game.');
});
```

#### 3g. Update debug functions (lines 494-650)

**SIMPLIFY debugGame()**:
```javascript
window.debugGame = function () {
    return {
        gameEngine: gameEngine,
        scene: scene,
        camera: camera,
        renderer: renderer,
        config: CONFIG,  // Simple object instead of manager
        resourceManager: resourceManager,
        systems: {
            input: inputSystem,
            movement: movementSystem,
            ui: uiSystem,
            network: networkSystem,
            ai: aiSystem,
            interaction: interactionSystem
        },
        stats: gameEngine ? gameEngine.getStats() : null,
        resources: resourceManager ? resourceManager.getStats() : null
    };
};
```

**REMOVE** (lines 520-605):
- debugResources() - keep if useful
- debugErrors() - DELETE
- clearErrors() - DELETE
- exportErrors() - DELETE
- debugConfig() - SIMPLIFY
- getConfig() - KEEP (use global function)
- setConfig() - KEEP (use global function)
- saveConfig() - DELETE
- resetConfig() - DELETE

**REPLACE debugConfig()**:
```javascript
window.debugConfig = function () {
    console.log('=== SIMPLE CONFIG ===');
    console.log(CONFIG);
    console.log('=== END CONFIG ===');
};
```

**REMOVE** (lines 607-647):
- debugValidation() - DELETE
- validateAllEntities() - DELETE
- testValidation() - DELETE

#### 3h. Update obstacle debug (lines 759-762)

**REPLACE**:
```javascript
// OLD:
console.log(`  Enabled: ${configManager.get('obstacles.enabled')}`);
console.log(`  Count: ${configManager.get('obstacles.count')}`);
console.log(`  Can Exclusion Radius: ${configManager.get('obstacles.canExclusionRadius')}`);
console.log(`  Size Range: ${configManager.get('obstacles.minWidth')}-${configManager.get('obstacles.maxWidth')} width`);

// NEW:
console.log(`  Enabled: ${CONFIG.obstacles.enabled}`);
console.log(`  Count: ${CONFIG.obstacles.count}`);
console.log(`  Can Exclusion Radius: ${CONFIG.obstacles.canExclusionRadius}`);
console.log(`  Size Range: ${CONFIG.obstacles.minWidth}-${CONFIG.obstacles.maxWidth} width`);
```

---

### Step 4: Update game.js (Critical!)

**File**: c:\Users\robert\egna-spel\Bollen-I-Burken\js\game.js

**REPLACE** createEntity() function (lines 399-413):
```javascript
createEntity() {
    // Use simple Entity - no validation needed
    const entity = new Entity(this.nextEntityId++);
    this.entities.set(entity.id, entity);
    Utils.log(`Created entity ${entity.id}`);
    return entity;
}
```

**That's it for game.js!** The fallback was already there.

---

### Step 5: Update arena.js (Heaviest User!)

**File**: c:\Users\robert\egna-spel\Bollen-I-Burken\js\arena.js

**REPLACE** constructor (lines 10-23):
```javascript
constructor(scene) {
    this.scene = scene;

    // Get resource manager (for cleanup tracking)
    this.resourceManager = ResourceManager.getInstance();

    // Get arena configuration from simple CONFIG object
    this.arenaSize = CONFIG.arena.size;
    this.wallHeight = CONFIG.arena.wallHeight;
    this.wallThickness = CONFIG.arena.wallThickness;
    this.floorColor = CONFIG.arena.floorColor;
    this.wallColor = CONFIG.arena.wallColor;

    this.arenaObjects = [];

    Utils.log('ArenaBuilder initialized with simple config');
}
```

**FIND/REPLACE ALL** in arena.js:
```
Find: this.configManager.get('
Replace: CONFIG.
```

**CAREFUL**: This will create `CONFIG.arena.size')` with extra `')`, need to clean up:
```
Find: CONFIG.
Replace with proper reference
```

**Actually, better approach**:

**LINE BY LINE replacements** (safer):
- Line 15: `this.arenaSize = CONFIG.arena.size;`
- Line 16: `this.wallHeight = CONFIG.arena.wallHeight;`
- Line 17: `this.wallThickness = CONFIG.arena.wallThickness;`
- Line 18: `this.floorColor = CONFIG.arena.floorColor;`
- Line 19: `this.wallColor = CONFIG.arena.wallColor;`
- Line 105: `const ambientIntensity = CONFIG.graphics.ambientLightIntensity;`
- Line 106: `const directionalIntensity = CONFIG.graphics.directionalLightIntensity;`
- Line 107: `const shadowMapSize = CONFIG.graphics.shadowMapSize;`
- Line 108: `const enableShadows = CONFIG.graphics.shadows;`
- Line 145: `const canRadius = CONFIG.can.radius;`
- Line 146: `const canHeight = CONFIG.can.height;`
- Line 147: `const canColor = CONFIG.can.color;`
- Line 148: `const canPosition = CONFIG.can.position;`
- Line 193: `const enabled = CONFIG.obstacles.enabled;`
- Line 199: `const count = CONFIG.obstacles.count;`
- Line 200: `const canExclusionRadius = CONFIG.obstacles.canExclusionRadius;`
- Line 201: `const minDistanceFromWalls = CONFIG.obstacles.minDistanceFromWalls;`
- Line 202: `const minDistanceBetween = CONFIG.obstacles.minDistanceBetween;`
- Line 203: `const maxAttempts = CONFIG.obstacles.maxPlacementAttempts;`
- Line 206-211: All obstacle size settings
- Line 214: `const color = CONFIG.obstacles.color;`
- Line 215: `const materialType = CONFIG.obstacles.material;`
- Line 398: `const obstacleCount = CONFIG.obstacles.count;`

---

### Step 6: Update ai.js

**File**: c:\Users\robert\egna-spel\Bollen-I-Burken\js\ai.js

**Line 479** - Already has fallback! Just simplify:
```javascript
// OLD:
const arenaSize = configManager ? configManager.get('arena.size') : 15;

// NEW:
const arenaSize = CONFIG.arena.size;
```

**Lines 103-109** - Remove errorHandler.handle:
```javascript
// OLD:
try {
    this.updateHunter(hunter, gameState, deltaTime);
} catch (error) {
    errorHandler.handle(new GameError('Hunter update failed', ERROR_CATEGORIES.SYSTEM, {
        hunterId: hunter.id,
        error: error.message
    }), 'ERROR');
}

// NEW:
try {
    this.updateHunter(hunter, gameState, deltaTime);
} catch (error) {
    console.error(`Hunter ${hunter.id} update failed:`, error);
    Utils.error('Hunter update failed', error);
}
```

---

### Step 7: Update player.js

**File**: c:\Users\robert\egna-spel\Bollen-I-Burken\js\player.js

**Line 11** - Simplify:
```javascript
// OLD:
this.arenaSize = this.configManager ? this.configManager.get('arena.size') : 15;

// NEW:
this.arenaSize = CONFIG.arena.size;
```

---

### Step 8: Update interaction.js

**File**: c:\Users\robert\egna-spel\Bollen-I-Burken\js\interaction.js

**Lines 16-18** - Use CONFIG:
```javascript
// OLD:
this.maxInteractionDistance = this.configManager.get('interaction.maxDistance', 5.0);
this.interactionCooldown = this.configManager.get('interaction.cooldownMs', 500);
this.enableVisualFeedback = this.configManager.get('interaction.visualFeedback', true);

// NEW:
this.maxInteractionDistance = CONFIG.interaction.maxDistance;
this.interactionCooldown = CONFIG.interaction.cooldownMs;
this.enableVisualFeedback = CONFIG.interaction.visualFeedback;
```

**Lines 49-54, 178-183** - Remove errorHandler:
```javascript
// Replace errorHandler.handle() with console.error()
console.error('Interaction error:', error);
Utils.error('Interaction failed', error);
```

---

### Step 9: Test Thoroughly!

**Open index.html in browser**:

1. ✅ Check console - no errors about missing configManager
2. ✅ Game loads and shows arena
3. ✅ Player can move with WASD
4. ✅ AI hunter moves and patrols
5. ✅ Can interact with central can
6. ✅ Collision works (player can't go through walls)
7. ✅ FPS counter shows ~60 FPS
8. ✅ Debug commands work: `debugGame()`, `debugConfig()`

**If any errors**: Check console, fix the specific issue

---

### Step 10: Delete Enterprise Files (Only After Testing!)

**ONLY** after game works perfectly:

```bash
# Move to permanent backup
mv js/config-manager.js Backups/config-manager-DELETED.js
mv js/error-handler.js Backups/error-handler-DELETED.js
mv js/component-validator.js Backups/component-validator-DELETED.js
```

---

## Safety Checklist

Before starting:
- [ ] All files backed up in Backups/ folder
- [ ] Git commit of working state (if using git)
- [ ] Browser DevTools open to see any errors
- [ ] This detailed plan printed/available for reference

During migration:
- [ ] Update one file at a time
- [ ] Test after each file
- [ ] If error occurs, revert that file and debug
- [ ] Keep notes of any unexpected issues

After completion:
- [ ] All tests pass
- [ ] No console errors
- [ ] Gameplay smooth and responsive
- [ ] Enterprise files deleted
- [ ] Git commit of cleaned state

---

## Expected Results

**Before**:
- config-manager.js: 746 lines
- error-handler.js: 604 lines
- component-validator.js: 599 lines
- **Total**: 1,949 lines

**After**:
- js/core/config.js: 200 lines (with all settings + compat shim)
- Simple try-catch blocks: ~20 lines total
- **Total**: 220 lines

**Reduction**: 1,729 lines removed (89% reduction)

---

## Confidence Level: HIGH

**Why confident**:
- All dependencies mapped
- Compatibility shim allows gradual migration
- Fallbacks already exist in ai.js, player.js
- game.js already has Entity fallback
- Clear step-by-step plan
- Test after each change

**Risks mitigated**:
- Compatibility shim prevents instant breakage
- Line-by-line arena.js update is surgical
- Testing after each file catches issues early
- Backups allow instant rollback

---

## Time Estimate

- Config.js updates (shim + settings): 15 minutes
- index.html updates: 30 minutes
- game.js update: 5 minutes
- arena.js update: 20 minutes (many lines)
- ai.js, player.js, interaction.js: 15 minutes
- Testing: 30 minutes
- Delete enterprise files: 5 minutes
- **Total**: ~2 hours

Ready to execute!