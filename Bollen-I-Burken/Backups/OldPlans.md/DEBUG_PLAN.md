# SYSTEMATIC DEBUG PLAN - Player Can't Move

**Date**: 2025-10-04
**Status**: Player spawns correctly at (-10, 0.5, -10) but CANNOT MOVE
**AI Status**: Still spawning in can - fixed in game-lifecycle.js, needs browser refresh

---

## CURRENT STATE

### What Works ✅
- Player spawns at correct position (-10, 0.5, -10) - visible in screenshot
- Player can rotate/look around (rotation system works)
- Physics system initializes
- Physics bodies are created (logs show creation)
- AI rotation works (vision cone moves)

### What Doesn't Work ❌
- Player cannot move (WASD does nothing)
- AI cannot move (stuck in place)
- Position stays frozen despite velocity being set

---

## ANALYSIS FROM SERENA

### Files Involved in Movement
1. `js/systems/input/input-system.js` - Captures WASD input
2. `js/core/components/player-input.js` - Stores input state
3. `js/systems/movement-system.js` - Calculates velocity, applies to physics
4. `js/systems/physics/physics-system.js` - Steps CANNON world
5. `js/systems/physics/physics-sync.js` - Copies position from physics to Transform
6. `js/core/components/transform.js` - Stores position/rotation
7. `js/core/components/physics-body.js` - Wraps CANNON.Body

### Movement Flow (Expected)
```
1. InputSystem: Reads keyboard → Updates PlayerInput.keys
2. MovementSystem.updatePlayerMovement():
   - Reads PlayerInput.keys
   - Calculates transform.velocity
   - Calls physicsBody.wakeUp()
   - Sets physicsBody.body.velocity = transform.velocity
3. PhysicsSystem.update():
   - Steps CANNON.World (bodies move based on velocity)
4. PhysicsSync.syncEntityTransform():
   - Copies body.position → transform.position
   - Copies body.velocity → transform.velocity
5. MovementSystem (later in same frame):
   - Updates mesh.position = transform.position
```

### System Execution Order (from main.js)
```
1. InputSystem
2. AISystem
3. MovementSystem
4. PhysicsSystem
5. UISystem
6. AudioSystem
7. NetworkSystem
8. InteractionSystem
```

---

## HYPOTHESIS: Why Movement Is Broken

### Hypothesis #1: Physics Bodies Are Sleeping ❓
**Evidence**:
- Config has `allowSleep: false` but it's not being applied
- body-factory.js was updated to set `body.allowSleep`
- But browser cache might not have loaded it

**Test**: Check console for "allowSleep=false" in body creation log

**Fix**: Hard refresh browser (Ctrl+Shift+R)

---

### Hypothesis #2: Velocity Is Not Being Calculated ❓
**Evidence**:
- Player can rotate (input system works)
- But no position change (velocity might be 0)

**Test**: Add logging to movement-system.js to see if velocity is non-zero:
```javascript
if (isMoving) {
    console.log(`[MOVE] desiredX=${desiredX}, desiredZ=${desiredZ}, velocity=(${transform.velocity.x}, ${transform.velocity.z})`);
}
```

**Fix**: If velocity is 0, check input system is reading keys correctly

---

### Hypothesis #3: Physics Body Mass Is Zero (Static) ❓
**Evidence**:
- Static bodies (mass=0) don't move
- If mass is accidentally 0, body won't respond to velocity

**Test**: Check console log for "mass=70" when player body is created

**Fix**: Verify BodyFactory.createPlayerBody() passes correct mass

---

### Hypothesis #4: Collision Constraint Locking Body ❓
**Evidence**:
- Even though player spawns outside can, nearby obstacle might lock it
- Physics solver might be creating constraints that prevent movement

**Test**:
1. Check console for "Physics contacts" logs
2. Temporarily disable all obstacles to test

**Fix**: Verify collision groups/masks are correct

---

### Hypothesis #5: PhysicsSync Overwriting Velocity to Zero ❓
**Evidence**:
- PhysicsSync copies body.velocity → transform.velocity AFTER MovementSystem sets it
- If body.velocity is 0, it overwrites the calculated velocity

**Test**: Log body.velocity in PhysicsSync to see if it's 0

**Fix**: This would indicate physics engine is zeroing velocity (collision or constraint issue)

---

### Hypothesis #6: Transform.velocity vs PhysicsBody.velocity Mismatch ❓
**Evidence**:
- MovementSystem sets transform.velocity first
- Then copies to physicsBody.body.velocity
- But if transform.velocity is never set, nothing happens

**Test**: Add logs BEFORE and AFTER velocity assignment:
```javascript
console.log(`[BEFORE] transform.velocity=(${transform.velocity.x}, ${transform.velocity.z})`);
physicsBody.body.velocity.x = transform.velocity.x;
console.log(`[AFTER] body.velocity=(${physicsBody.body.velocity.x}, ${physicsBody.body.velocity.z})`);
```

---

## SYSTEMATIC DEBUG STEPS

### Step 1: Verify Browser Cache ✅
**Action**: Hard refresh (Ctrl+Shift+R)
**Check**: Console shows updated logs with "allowSleep=false"
**Result**: Player spawns at (-10, 0.5, -10) ✅ | AI spawns away from can ❓

---

### Step 2: Add Movement Logging 🔄
**Action**: Add detailed logs to movement-system.js:

```javascript
// In updatePlayerMovement(), after calculating velocity:
if (isMoving || currentSpeed > 0.01) {
    console.log(`[PLAYER] input:(${desiredX.toFixed(2)}, ${desiredZ.toFixed(2)}), velocity:(${transform.velocity.x.toFixed(3)}, ${transform.velocity.z.toFixed(3)}), position:(${transform.position.x.toFixed(2)}, ${transform.position.z.toFixed(2)})`);
}

// After setting physics body velocity:
if (physicsBody && physicsBody.body) {
    console.log(`[PHYSICS] body.velocity:(${physicsBody.body.velocity.x.toFixed(3)}, ${physicsBody.body.velocity.z.toFixed(3)}), body.position:(${physicsBody.body.position.x.toFixed(2)}, ${physicsBody.body.position.z.toFixed(2)}), sleepState:${physicsBody.body.sleepState}`);
}
```

**Check**:
- Does pressing W show non-zero velocity?
- Is body.velocity being set correctly?
- What is sleepState? (0=AWAKE, 1=SLEEPY, 2=SLEEPING)

---

### Step 3: Check Physics Body Properties 🔄
**Action**: Log physics body details when created:

```javascript
// In body-factory.js createPlayerBody():
console.log(`[BODY CREATED] mass=${body.mass}, sleepSpeedLimit=${body.sleepSpeedLimit}, allowSleep=${body.allowSleep}, position=(${body.position.x}, ${body.position.y}, ${body.position.z})`);
```

**Check**:
- mass = 70? (not 0)
- allowSleep = false?
- sleepSpeedLimit = 0?

---

### Step 4: Monitor Physics Sync 🔄
**Action**: Add logs to physics-sync.js:

```javascript
// In syncEntityTransform():
if (Math.abs(body.velocity.x) > 0.001 || Math.abs(body.velocity.z) > 0.001) {
    console.log(`[SYNC] Copying physics to transform: body.pos=(${body.position.x.toFixed(2)}, ${body.position.z.toFixed(2)}), body.vel=(${body.velocity.x.toFixed(3)}, ${body.velocity.z.toFixed(3)})`);
}
```

**Check**: Is physics body actually moving in CANNON simulation?

---

### Step 5: Test Without Obstacles 🔄
**Action**: Temporarily disable obstacle collision:

```javascript
// In config.js, change collision mask:
player: {
    ...
    // TEST ONLY - remove obstacle collision
    collisionMask: COLLISION_GROUPS.WALL  // Only walls, no obstacles
}
```

**Check**: Can player move now? If yes → collision issue. If no → velocity issue.

---

### Step 6: Verify Input System 🔄
**Action**: Add log to input-system.js:

```javascript
// In update(), check if keys are being pressed:
if (this.keys.forward || this.keys.backward || this.keys.left || this.keys.right) {
    console.log(`[INPUT] Keys: W=${this.keys.forward}, A=${this.keys.left}, S=${this.keys.backward}, D=${this.keys.right}`);
}
```

**Check**: Does pressing WASD show true in console?

---

## LIKELY ROOT CAUSE (PREDICTION)

Based on evidence:
1. Player spawns correctly ✅
2. Rotation works ✅
3. Physics initializes ✅
4. But movement frozen ❌

**Most Likely**: Physics bodies are SLEEPING or have mass=0

**Second Most Likely**: Collision constraint locking body in place

**Third Most Likely**: Velocity not being calculated (input issue)

---

## NEXT ACTIONS

1. ✅ **DONE**: Fixed AI spawn in game-lifecycle.js
2. ✅ **DONE**: Added allowSleep to body-factory.js
3. ⏳ **PENDING**: User needs to hard refresh browser
4. ⏳ **PENDING**: Add debug logging if still broken after refresh
5. ⏳ **PENDING**: Systematically test each hypothesis

---

## FILES TO MODIFY FOR DEBUGGING

If still broken after browser refresh, add logging to these files:

1. `js/systems/movement-system.js` (lines 240-320) - Add velocity logs
2. `js/managers/physics/body-factory.js` (line 50) - Add body property logs
3. `js/systems/physics/physics-sync.js` (lines 45-55) - Add sync logs
4. `js/systems/input/input-system.js` (line 80-100) - Add key press logs

**IMPORTANT**: Only add ONE set of logs at a time, test, then add next set. Don't add all at once!

---

## CRITICAL REMINDERS

1. **Browser cache is the enemy** - Always hard refresh after changes
2. **One change at a time** - Don't modify multiple files before testing
3. **Log everything** - Can't debug what you can't see
4. **Trust the system** - Movement logic is correct, issue is likely config/setup
5. **Physics is source of truth** - If body doesn't move in CANNON, transform won't update

---

*This plan will systematically identify the root cause through controlled testing and logging.*
---
### 2025-10-04 - Investigation Update (Codex)
- Confirmed MovementSystem sets physics body velocity equal to Transform velocity without converting to per-second units.
- PhysicsSync multiplies body velocity by CONFIG.physics.timeStep when copying back, shrinking Transform velocity to near zero each frame (matches console logs showing ~0.000x speeds).
- Player and AI appear stuck because their per-tick velocity collapses after every physics sync despite input registering.
- Suggested fix: when physics is enabled, scale Transform velocity by MovementSystem.physicsVelocityScale (1 / timeStep) before writing to physicsBody.body.velocity for both player and AI paths, ensuring PhysicsSync restores the original per-tick velocity.
- Next: Apply scaling fix in MovementSystem, retest player/AI movement, and monitor logs for expected ~0.1 velocity magnitudes.
### 2025-10-04 - Velocity Scaling Fix Applied (Codex)
- Updated movement-system.js player and AI physics branches to multiply body velocity by physicsVelocityScale (per-second conversion).
- Expect [MOVE DEBUG] logs to report ~0.1 values while physics bodies now receive ~6.0 (per second) speeds, so Cannon should advance them properly and PhysicsSync will restore 0.1 per tick velocities.
- Please hard refresh and retest movement; if characters still stick, capture fresh console output (including [MOVE DEBUG] and any physics warnings) so we can confirm the new velocities and contact counts.
### 2025-10-04 - Countdown Removal (Codex)
- Replaced GameLifecycle.startGame() to skip the 5s countdown and call gameEngine.start() immediately while hiding any stale countdown UI.
- Existing AI recklessness ramp (45s delay + 30s expansion to 12m radius) remains active because AISystem still records PLAYING phase start from gameEngine.start().
- Next test pass: confirm menu transitions feel smooth without the countdown overlay, verify AI expands patrol radius after ~45s, and ensure no stray logs mention countdown.
### 2025-10-04 - Countdown Restored & Timer Disabled (Codex)
- Restored GameLifecycle.startGame()/startCountdown so 5-second pre-round countdown works as before.
- Replaced GameEngine with fresh implementation: auto-win timer disabled (gameDuration=0) and start() log updated.
- UI timer now shows '8' when no round timer is active to avoid red 0 display.
- Next: Verify 5s countdown overlay appears, ensure HUD timer shows infinity, confirm hunters escalate after 45s without round auto-ending.
### 2025-10-04 - Spawn Positions Updated (Codex)
- Tweaked CONFIG spawn positions so player starts at (-4, 0.5, -4) and AI default spawn (for single hunter) is (4, 0.5, 4); should place everyone closer to the can without overlapping its collider.
- For multiple hunters, PlayerManager still arranges them in a circle via difficulty settings, so no further change required.
- Next verification: load into the arena, confirm both player and all hunters spawn closer to the center, and ensure no one collides with the can at start.
### 2025-10-04 - Movement Tuning Applied (Codex)
- Set MovementSystem defaults to playerMaxSpeed=0.16 and sneakMaxSpeed=0.03 to match requested tweak values; other requested parameters already matched current settings.
- Audio step interval/volume multipliers already align with request, and AISystem still defaults aiFrozen=false.
- Next test: verify walking vs sneaking feels correct and HUD/footsteps behave as expected, ensuring AI remains active.
### 2025-10-04 - AI Tweak Panel Expanded (Codex)
- Added full AI tuning controls to the T panel: patrol/chase speeds, acceleration, turn accel, investigation/reaction timing, reckless timing/radius, and base vision stats.
- Implemented setter helpers that live-update existing hunters and capture defaults from spawned difficulty presets; included refresh hook so the panel reflects overrides.
- Reworked reckless ramp logic to use configurable durations/radii (defaults preserved) and cleaned stray artefacts from ai-system.js.
- Please open the T panel in-game, tweak a few values (e.g., slow patrol speed, extend reckless radius) and ensure hunters respond immediately.
### 2025-10-04 - AI Vision & Sweep Controls Added (Codex)
- Added tweak sliders for dynamic-vision thresholds (Vision Wide Threshold, Vision Focus Threshold) so the hunter dips into wide-angle view sooner instead of only at max range.
- Introduced Scan Turn Speed and Scan Interval (ms) controls plus supporting guard-turn setters; patrol sweep now respects a configurable base speed and updates existing hunters live.
- Dynamic vision formulas and can-guard patrol logic now read the new values; default tuning set to 0.45/0.70 thresholds and faster 2.0x scan speed with 700?ms interval.
- Next step: open the T panel, experiment with the thresholds and sweep speed, and confirm the hunter visibly oscillates wider while scanning obstacles more frequently.
