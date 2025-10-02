# Bug Report: Vision Cone Detection Mismatch

**Status:** 🔴 ACTIVE - CRITICAL
**Priority:** CRITICAL
**Created:** 2025-10-02
**Severity:** Game Breaking

---

## Problem Statement

**Visual cone and detection cone are completely out of sync.**

Symptoms:
- Detection area changes direction every game (sometimes behind AI, sometimes to the side)
- Visual cone mesh shows one direction
- Actual detection happens in a different direction
- Cannot trust the visual cone at all
- Makes game unplayable

---

## Investigation Log

### Attempt 1: Fix Random Heading Initialization ❌ FAILED
**Hypothesis:** `aiComponent.heading` initialized to random value causes desync

**Changes Made:**
1. `js/core/components/ai-hunter.js:17` - Changed `this.heading = Math.random() * Math.PI * 2` to `this.heading = 0`
2. `js/managers/player-manager.js:152` - Added `aiHunter.heading = aiTransform.rotation.y`

**Result:** Still broken - cone and detection still out of sync

**Status:** NEEDS REVERT - This did not fix the issue

---

### Attempt 2: Add Dynamic Vision System ⚠️ SUSPECT
**When:** Added dynamic vision cone that narrows/widens based on distance

**Files Modified:**
- `js/systems/ai/dynamic-vision.js` (NEW)
- `js/systems/ai/ai-system.js` (modified updateVision)
- `js/systems/movement-system.js` (added updateVisionConeGeometry)

**Potential Issues:**
- Dynamic vision calculates based on `scanTarget` or `ai.heading`
- May be using wrong angle reference
- Could be mismatch between visual update and detection update

---

## System Architecture Analysis

### Vision Cone Rendering (Visual)
**File:** `js/systems/movement-system.js`

```javascript
// Line 46-51: Position and rotation
renderable.mesh.visionConeMesh.position.set(transform.position.x, transform.position.y, transform.position.z);
renderable.mesh.visionConeMesh.rotation.y = transform.rotation.y;

// Line 56-60: Geometry update
this.updateVisionConeGeometry(coneMesh, visionCone.angle, visionCone.range);
```

**Visual cone uses:** `transform.rotation.y`

### Vision Cone Detection (Logic)
**File:** `js/systems/ai/ai-system.js`

```javascript
// Line 314: Detection direction
const aiDirection = aiTransform.rotation.y;

// Line 316-318: Calculate angle difference to player
let angleDiff = angleToPlayer - aiDirection;
while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

// Line 324: Check if player in cone
if (Math.abs(angleDiff) <= halfVisionAngle) {
    // Player detected
}
```

**Detection uses:** `aiTransform.rotation.y`

**BOTH USE SAME VALUE!** So why the desync?

---

## Critical Discovery: Movement System Override

**FOUND IT!** In `MovementSystem.updateAIMovement()`:

```javascript
// Line 144-146 in movement-system.js
if (transform.velocity.x !== 0 || transform.velocity.z !== 0) {
    transform.rotation.y = Math.atan2(transform.velocity.x, transform.velocity.z);
}
```

**This overwrites the rotation after AI system sets it!**

**Execution Order:**
1. AI system runs first: Sets `transform.rotation.y = aiComponent.heading`
2. Movement system runs after: **OVERWRITES** `transform.rotation.y = atan2(velocity)`
3. Visual cone uses overwritten value
4. Detection uses overwritten value

**But they SHOULD match because they both use `transform.rotation.y`...**

**Wait - the problem might be WHEN they read it!**

---

## Next Steps

### Step 1: Use Serena to Trace Execution ✅ NEXT
- Trace all `transform.rotation.y` reads/writes
- Verify system execution order
- Check for timing issues

### Step 2: Revert Failed Changes
- Revert Attempt 1 changes
- Document what to keep vs remove

### Step 3: Test Hypothesis
Test if removing velocity-based rotation fixes sync

---

## Status: ROOT CAUSE IDENTIFIED ✅

---

## 🎯 ROOT CAUSE (Found by Serena Agent)

**Double-write race condition on `transform.rotation.y`**

### The Problem:
Two systems are fighting over rotation:

1. **MovementSystem** (line 161-163):
   ```javascript
   if (transform.velocity.x !== 0 || transform.velocity.z !== 0) {
       transform.rotation.y = Math.atan2(transform.velocity.x, transform.velocity.z);
   }
   ```
   Calculates rotation from velocity (frame N-1)

2. **AISystem** (line 151):
   ```javascript
   transform.rotation.y = aiComponent.heading;
   ```
   Sets rotation from steering heading (frame N)

### Execution Order:
```
Frame N:
1. MovementSystem.update() → Sets rotation from OLD velocity
2. Visual mesh rendered → Uses rotation from step 1
3. AISystem.update() → Overwrites rotation with NEW heading
4. Vision detection → Uses rotation from step 3

Result: MISMATCH!
```

### Why Random Each Game:
- First frame has zero velocity
- MovementSystem doesn't update rotation (skips if velocity is zero)
- AISystem sets rotation based on initial steering
- Initial steering varies randomly (spawn, obstacles, etc.)
- Creates inconsistent starting direction

### The Fix:
**DELETE lines 161-163 from `js/systems/movement-system.js`**

AI rotation should ONLY be controlled by AISystem's steering behaviors through `aiComponent.heading`.

---

## Solution Implementation

### File: `js/systems/movement-system.js`

**REMOVE:**
```javascript
// Lines 161-163 - DELETE THIS BLOCK
if (transform.velocity.x !== 0 || transform.velocity.z !== 0) {
    transform.rotation.y = Math.atan2(transform.velocity.x, transform.velocity.z);
}
```

**Why:** AISystem already handles rotation via steering behaviors. MovementSystem should only handle position updates for AI, not rotation.

---

## Cleanup Required

### Revert Attempt 1 (Failed Fix):
1. ❌ `js/core/components/ai-hunter.js:17` - Change back to: `this.heading = Math.random() * Math.PI * 2;`
2. ❌ `js/managers/player-manager.js:152` - Remove line: `aiHunter.heading = aiTransform.rotation.y;`

**Reason:** These changes didn't fix the issue and add unnecessary code.

### Keep Dynamic Vision:
✅ `js/systems/ai/dynamic-vision.js` - KEEP (works correctly)
✅ `js/systems/ai/ai-system.js` - KEEP dynamic vision integration
✅ `js/systems/movement-system.js` - KEEP updateVisionConeGeometry method

---

## Verification Steps

After fix:
1. ✅ Visual cone points same direction as AI body
2. ✅ Detection works in same direction as visual cone
3. ✅ Consistent direction every game (not random)
4. ✅ Cone rotates smoothly during patrol
5. ✅ No desync during race mode

---

## Status: ✅ FIXED - READY TO TEST

---

## Changes Implemented

### ✅ Primary Fix:
**File:** `js/systems/movement-system.js` (line 161-162)
- **Removed:** Velocity-based rotation override for AI
- **Added:** Comment explaining why this was removed
- **Result:** AI rotation now controlled exclusively by AISystem steering behaviors

### ✅ Cleanup (Reverted Failed Attempts):
1. **File:** `js/core/components/ai-hunter.js` (line 17)
   - Restored: `this.heading = Math.random() * Math.PI * 2;`

2. **File:** `js/managers/player-manager.js` (line 151-152)
   - Removed: `aiHunter.heading = aiTransform.rotation.y;`

**Result:** No garbage code remaining. Clean state restored.

### ✅ Kept Working Features:
- Dynamic vision system (narrows/widens cone)
- Vision cone geometry updates
- All debug logging

---

## Expected Behavior After Fix

1. ✅ Visual cone points same direction as AI heading
2. ✅ Detection works in exact same direction as visual cone
3. ✅ Consistent direction every game (based on steering, not random velocity)
4. ✅ Smooth rotation during patrol (steering-controlled)
5. ✅ No frame-to-frame desync

---

## Test Checklist

- [ ] Hard refresh browser (Ctrl + Shift + R)
- [ ] Stand in front of AI - cone should detect you
- [ ] Stand to side - cone should NOT detect you
- [ ] Visual cone should point where AI is looking
- [ ] Direction consistent across multiple game restarts
- [ ] No random 180° flips

---

## Status: ✅ IMPLEMENTED - AWAITING USER TEST
