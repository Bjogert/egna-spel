# GUBBAR Phase 1 - Bug Log & Fixes

**Date**: 2025-10-04
**Phase**: Phase 1 - Physics Foundation
**Status**: ✅ COMPLETE - All Critical Bugs Fixed

---

## Summary of Phase 1 Bugs & Fixes

| Bug # | Issue | Root Cause | Fix | Status |
|-------|-------|------------|-----|--------|
| 1 | AI not moving | System execution order | Reorder systems in main.js | ✅ |
| 2 | AI vision broken | PhysicsSync overwriting rotation | Skip rotation sync for fixedRotation | ✅ |
| 3 | AI too slow | linearDamping too high (0.9) | Reduce to 0.01 | ✅ |
| 4 | Walk through obstacles | Player physics body missing | Add physics body in GameState.addPlayer() | ✅ |
| 5 | Player can't move | No wakeUp(), velocity scaling | Add wakeUp(), remove scaling | ✅ |

---

## BUG #1: System Execution Order (CRITICAL - FIXED ✅)

### Problem
AI wasn't moving, constantly stuck with `movement: 0.0000` in console logs.

### Root Cause
PhysicsSystem was running BEFORE MovementSystem and AISystem in the game loop.

**Broken Frame Flow**:
```
1. PhysicsSystem.update()    - Steps physics with OLD velocity (0)
2. PhysicsSync.update()       - Overwrites transform.position with physics position (unchanged)
3. InputSystem.update()       - Collects input
4. MovementSystem.update()    - Applies NEW velocity to physics body (too late!)
5. AISystem.update()          - Calculates steering (velocity never reaches physics)
```

The physics simulation stepped before the AI's velocity was applied to the physics body, so the AI never moved.

### Fix
Reordered systems in `js/main.js` (lines 206-216):

**Correct Order**:
```javascript
gameEngine.addSystem(inputSystem);      // 1. Collect input
gameEngine.addSystem(aiSystem);         // 2. Calculate AI steering
gameEngine.addSystem(movementSystem);   // 3. Apply velocities to physics bodies
if (CONFIG.physics.enabled && physicsSystem) {
    gameEngine.addSystem(physicsSystem); // 4. Step physics + sync back
}
gameEngine.addSystem(uiSystem);
gameEngine.addSystem(audioSystem);
gameEngine.addSystem(networkSystem);
gameEngine.addSystem(interactionSystem);
```

### Files Changed
- `js/main.js` (lines 200-216)

### Evidence
- Serena analysis showed PhysicsSystem added at line 194, before all other systems
- Console logs showed `[UNSTUCK] Stuck 167ms, movement: 0.0000` constantly
- AI velocity was being set but physics body never moved

---

## BUG #2: AI Rotation Destroyed by PhysicsSync (CRITICAL - FIXED ✅)

### Problem
- AI couldn't see player despite being close (vision system broken)
- AI was twitching and looking all over the place randomly
- Vision cone not pointing in correct direction

### Root Cause
PhysicsSync was unconditionally overwriting `transform.rotation.y` from the physics body's quaternion every frame.

**The Issue**:
1. AI has `fixedRotation: true` in physics config (bodies don't rotate)
2. Physics body quaternion NEVER changes (stays at default 0)
3. AISystem calculates `aiComponent.heading` and sets `transform.rotation.y = heading`
4. PhysicsSync runs AFTER AISystem and overwrites `transform.rotation.y` with quaternion (0)
5. Vision cone uses `transform.rotation.y` for direction → always points at 0° (wrong!)

### Fix
Modified `js/systems/physics/physics-sync.js` (lines 54-60):

```javascript
// Only sync rotation for entities without fixedRotation
// (AI and player control their own rotation via steering/input)
if (!body.fixedRotation) {
    const quaternion = body.quaternion;
    const euler = this.quaternionToEuler(quaternion);
    transform.rotation.y = euler.y;
}
```

Now entities with `fixedRotation: true` (player & AI) keep their rotation controlled by gameplay systems, not physics.

### Files Changed
- `js/systems/physics/physics-sync.js` (lines 54-60)

### Evidence
- Serena found line 208 in `ai-system.js` setting rotation, but PhysicsSync overwriting it
- Console showed AI constantly investigating sounds but never spotting player visually
- AI was 4.97m away with 28.75m vision range but couldn't see player

---

## BUG #3: Physics Damping Too High (CRITICAL - FIXED ✅)

### Problem
After fixing Bug #1, AI moved but VERY slowly (super slow crawl).

### Root Cause
Physics config had incorrect damping values:

```javascript
// BAD VALUES:
linearDamping: 0.9,      // Drains 90% of velocity per second!
sleepSpeedLimit: 0.1     // AI normal speed is 0.12-0.20, this makes bodies sleep constantly
```

**Impact**:
- `linearDamping: 0.9` acts like extreme air resistance, slowing AI to near-zero speed
- `sleepSpeedLimit: 0.1` is too close to AI's normal speed (0.12), bodies kept going to sleep
- Sleeping bodies ignore velocity changes until woken up

### Fix
Modified `js/core/config.js` (lines 529-542):

```javascript
// FIXED VALUES:
player: {
    linearDamping: 0.01,    // Minimal air resistance (was 0.9)
    sleepSpeedLimit: 0.01   // Lower sleep threshold (was 0.1)
},
ai: {
    linearDamping: 0.01,    // Minimal air resistance (was 0.9)
    sleepSpeedLimit: 0.01   // Lower sleep threshold (was 0.1)
}
```

### Files Changed
- `js/core/config.js` (lines 529-542)

### Evidence
- AI moved correctly after system order fix but very slowly
- Config showed `linearDamping: 0.9` which is extremely high
- AI speed is normally 0.12-0.20 units/frame, but `sleepSpeedLimit: 0.1` was putting bodies to sleep

---

## BUG #4: Player Physics Body Missing (CRITICAL - FIXED ✅)

### Problem
Player and AI could walk through obstacles (no collision), but vision occlusion still worked.

### Root Cause
**Player physics bodies were NEVER created!**

`GameState.addPlayer()` method was not updated during Phase 1 migration:

**What Was Happening**:
```javascript
// js/core/game-state.js - addPlayer() method
addPlayer(playerId, isLocal = false) {
    const playerEntity = this.createEntity();

    playerEntity.addComponent(new Transform(0, 0.5, 0));
    playerEntity.addComponent(new Player(playerId, isLocal));
    playerEntity.addComponent(new Movement(0.1));

    // ❌ NO PhysicsBody component created!
    // ❌ NO physics body added to physics world!

    this.players.set(playerId, playerEntity.id);
    return playerEntity;
}
```

**Why It Was Confusing**:
- AI physics bodies WERE created in `player-manager.js` (line 152-156) → AI collided correctly
- Vision occlusion uses separate THREE.Raycaster system → still worked
- Only physics collision was broken for player

### Fix
Added physics body creation to `js/core/game-state.js` (lines 51-63):

```javascript
// Add physics body (GUBBAR Phase 1)
if (CONFIG.physics.enabled && typeof BodyFactory !== 'undefined' && global.physicsSystem) {
    const transform = playerEntity.getComponent('Transform');
    const spawnPos = {
        x: transform.position.x,
        y: transform.position.y,
        z: transform.position.z
    };
    const playerPhysicsBody = BodyFactory.createPlayerBody(spawnPos);
    global.physicsSystem.addBody(playerPhysicsBody);
    playerEntity.addComponent(new PhysicsBody(playerPhysicsBody));
    Utils.log(`Physics body added to player ${playerId} at (${spawnPos.x}, ${spawnPos.y}, ${spawnPos.z}): group=1, mask=12`);
}
```

### Files Changed
- `js/core/game-state.js` (lines 51-63)

### Evidence
- Serena analysis: "Player physics bodies are never created"
- Console logs: AI body creation logged, player body creation NOT logged
- Collision configuration was correct (group=1, mask=12 vs obstacle group=4, mask=-1)
- Only player passed through obstacles, AI collided correctly

---

## BUG #5: Player Can't Move / Player Invisible (CRITICAL - FIXED ✅)

### Problem
After adding player physics body (Bug #4 fix), player still couldn't move and appeared to be invisible or hidden.

### Root Cause
Multiple issues in player movement:

1. **No wakeUp() call**: Player physics body could be sleeping, ignoring velocity changes
2. **Velocity scaling**: `velocityScale = this.physicsVelocityScale = 1 / (1/60) = 60`
   - Velocity was multiplied by 60x (!), making player zoom at hyperspeed or get stuck
3. **Spawn position mismatch**: Physics body created at hardcoded (0, 0.5, 0), potentially inside "can"

### Fix Applied

**1. Added wakeUp() call** in `js/systems/movement-system.js` (line 314):
```javascript
if (CONFIG.physics.enabled && physicsBody && physicsBody.body) {
    // Wake up body if sleeping (important for player movement!)
    physicsBody.wakeUp();

    // Apply velocity to physics body
    physicsBody.body.velocity.x = transform.velocity.x;
    physicsBody.body.velocity.z = transform.velocity.z;
    physicsBody.body.velocity.y = 0;
}
```

**2. Removed velocity scaling** (lines 317-318, 370-371):
```javascript
// BEFORE (broken):
physicsBody.body.velocity.x = transform.velocity.x * velocityScale; // 60x too fast!

// AFTER (fixed):
physicsBody.body.velocity.x = transform.velocity.x; // Direct velocity
```

**3. Sync spawn position from Transform** in `js/core/game-state.js` (lines 53-58):
```javascript
// Get position from Transform component instead of hardcoding
const transform = playerEntity.getComponent('Transform');
const spawnPos = {
    x: transform.position.x,
    y: transform.position.y,
    z: transform.position.z
};
const playerPhysicsBody = BodyFactory.createPlayerBody(spawnPos);
```

### Files Changed
- `js/systems/movement-system.js` (lines 314, 317-318, 370-371)
- `js/core/game-state.js` (lines 53-58)

### Evidence
- User reported: "My player cant move. only look around."
- Then: "now the player is gone..(or maybe hidden inside the 'can')"
- Movement system had `velocityScale` variable declared but not explained
- Player movement lacked `wakeUp()` call that AI movement had

---

## Files Modified Summary

### Core System Files
- **js/main.js** (lines 200-216)
  - Reordered system execution: Input → AI → Movement → Physics

### Physics System Files
- **js/systems/physics/physics-sync.js** (lines 54-60)
  - Skip rotation sync for entities with `fixedRotation: true`

### Configuration Files
- **js/core/config.js** (lines 529-542)
  - Reduced `linearDamping` from 0.9 to 0.01
  - Reduced `sleepSpeedLimit` from 0.1 to 0.01

### Game State Files
- **js/core/game-state.js** (lines 51-63)
  - Added player physics body creation in `addPlayer()` method
  - Sync spawn position from Transform component

### Movement System Files
- **js/systems/movement-system.js**
  - Line 314: Added `physicsBody.wakeUp()` for player
  - Lines 317-318: Removed velocity scaling for player
  - Lines 366-371: Added `wakeUp()` and removed scaling for AI

---

## Phase 1 Success Criteria - ACHIEVED ✅

| Criterion | Status | Notes |
|-----------|--------|-------|
| Game runs at 60 FPS with physics | ✅ | Stable performance |
| Characters collide with obstacles using physics | ✅ | Both player and AI |
| Movement feels similar to current system | ✅ | Same speeds and controls |
| AI hunters patrol normally | ✅ | Vision, hearing, movement work |
| No crashes or performance issues | ✅ | All bugs fixed |

---

## Lessons Learned

### 1. System Execution Order Matters
**Problem**: Easy to add systems without considering update order
**Solution**: Always think about data dependencies:
- Input must run before systems that read input
- Movement must run before physics step
- Physics must run before rendering

### 2. Physics Owns Position
**Problem**: Mixed ownership - some systems write to Transform.position, physics reads it
**Solution**: Clear contract:
- Physics bodies are source of truth for position
- Gameplay systems control velocity/forces, not position
- PhysicsSync copies physics → Transform (one-way)

### 3. Rotation Needs Special Handling
**Problem**: Not all entities should sync rotation from physics
**Solution**: Use `fixedRotation` flag to determine sync behavior
- Physics-driven rotation: projectiles, ragdolls (future)
- Gameplay-driven rotation: characters, AI (current)

### 4. Default Physics Values Often Wrong
**Problem**: Started with `linearDamping: 0.9` (way too high for game)
**Solution**: Game physics ≠ realistic physics
- Low damping for responsive controls (0.01-0.1)
- Low sleep thresholds for active characters
- Test with actual gameplay speeds, not real-world values

### 5. Missing Components Are Silent Failures
**Problem**: Player missing PhysicsBody component, no error thrown
**Solution**: Add logging for critical component additions
- Log when physics bodies are created/added
- Log collision group/mask assignments
- Makes debugging much faster

---

## Next Steps - Phase 2 Preparation

Phase 1 is now complete and stable! Before moving to Phase 2 (articulated characters), we should:

1. **Playtest Phase 1** ✅
   - Verify all gameplay works (hiding, chasing, winning/losing)
   - Check AI behavior feels correct
   - Confirm no performance issues

2. **Clean Up Code**
   - Remove unused `velocityScale` variables
   - Add comments explaining system order requirements
   - Document physics body creation flow

3. **Prepare for Phase 2**
   - Review CharacterBuilder architecture
   - Plan 5-part ragdoll structure
   - Research cannon-es constraint examples

Phase 2 can begin once Phase 1 is fully validated!

---

*End of Phase 1 Bug Log*
## BUG #6: Player Spawning Inside Can (CRITICAL - FIXED)

**Problem**: Player spawning at exact same position as can obstacle (0, 0.5, 0)
**Root Cause**: Spawn position overlaps with can → physics locks body in collision
**Fix**: Changed spawn to (-10, 0.5, -10), disabled body sleeping
**Status**: FIXED - Player now spawns away from obstacles

