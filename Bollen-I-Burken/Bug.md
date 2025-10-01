# ?? Bug Report: ResourceManager Constructor Missing After Refactor

**KISS Reminder**  
Keep the fix targeted and simple; do not reintroduce the old enterprise scaffold.

## Context
- Project: Dunkgömme (Three.js ECS prototype)
- Recent Work: Stage 5 refactor moved networking and ResourceManager logic into smaller modules (`js/systems/network/`, `js/managers/resource/`).

## Problem Summary
Launching `index.html` after the refactor throws:
```
Failed to initialize game: ResourceManager is not a constructor
```
The bootstrap halts before Three.js setup finishes, so nothing renders.

## Reproduction Steps
1. Perform a hard reload of `index.html` in the browser.
2. Watch the console during the initial bootstrap.
3. Error appears immediately after �Simple KISS configuration loaded from config.js�.

## Root Cause
- The new `resource-manager-core.js` file defines the actual `ResourceManager` class, but the aggregator shim (`js/resource-manager.js`) only re-exported whatever existed on `window.ResourceManager`.
- Because the core file originally *only* set `window.ResourceManagerClass`, `new ResourceManager()` in the bootstrap received `undefined`, triggering the constructor error.

## Fix Overview
- Ensure the core file publishes the class to both `window.ResourceManagerClass` and `window.ResourceManager`.
- Keep `resource-manager.js` as a thin compatibility shim that assigns `window.GameResources` and leaves the existing bootstrap untouched.

```js
// resource-manager-core.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ResourceManager };
} else {
    global.ResourceManagerClass = ResourceManager;
    global.ResourceManager = ResourceManager; // ?? critical line
}
```

Once this runs before the shim, `new ResourceManager()` works again and the bootstrap completes.

## Status
? Fixed and verified manually:
- Game boots to menu.
- Arena loads; AI and player spawn correctly.

Please keep the two-file setup (core + shim); future refactors can swap the bootstrap to import modules directly instead of relying on globals.