# Arena Scaling Plan - 4x Bigger Arena

**Goal:** Make arena 4 times bigger while maintaining the same camera viewing angle and adjusting difficulty for "Vakten på IKEA" level

---

## Current State Analysis

### Current Arena Dimensions:
- **Size:** 15x15 units (225 sq units)
- **Wall Height:** 3 units
- **Wall Thickness:** 0.2 units

### Current Camera Setup:
- **Height:** 25 units above arena
- **Distance:** 15 units back (Z-axis)
- **FOV:** 60 degrees
- **Look At:** (0, -3, 0)
- **Position:** (0, 25, 15)

### Current "Vakten på IKEA" (Level 7) Settings:
- **Obstacle Count:** 10
- **Min Distance Between:** 4.0 units
- **Can Exclusion Radius:** 6.0 units
- **AI Vision Range:** 14 units
- **AI Vision Angle:** 90 degrees

---

## Scaling Calculations

### New Arena Dimensions (4x area = 2x linear scale):
- **Current:** 15x15 = 225 sq units
- **Target:** 4x = 900 sq units
- **New Size:** 30x30 units (2x linear scale)

### Camera Scaling (maintain same viewing angle):

**Formula:** To keep the same viewing angle when doubling arena size, we need to:
1. Double the camera height: `25 → 50`
2. Double the camera distance: `15 → 30`
3. Double the lookAt offset: `y: -3 → y: -6`

**Why?** The viewing angle is determined by the ratio of camera distance to arena size. To maintain this ratio:
- Old ratio: height/arena = 25/15 = 1.67
- New ratio: height/arena = 50/30 = 1.67 ✅

**Field of View:** Keep FOV at 60° (no change needed)

### Obstacle Scaling for "Vakten på IKEA":

**Original (15x15 arena):**
- 10 obstacles
- Min distance: 4.0
- Can exclusion: 6.0

**Scaled (30x30 arena):**
- **Count:** 10 obstacles (SAME - user wants "way less" for easiest setting)
- **Min distance between:** 8.0 units (2x scale)
- **Can exclusion radius:** 12.0 units (2x scale)
- **Obstacle size ranges:** Also scale 2x:
  - Width/Depth: 0.8-2.5 → 1.6-5.0
  - Height scaling can stay the same (vertical axis less critical)

### AI Scaling:
- **Vision Range:** 14 → 28 units (2x scale)
- **Vision Angle:** Keep 90° (no change)
- **Patrol radius:** 3.0 → 6.0 units (can-guard orbit)
- **Race distance threshold:** 0.8 → 1.6 units (win condition)

### Player/AI Speed Considerations:
**Option 1: Keep speeds same**
- Arena feels bigger, more strategic
- Takes longer to cross
- More tense gameplay

**Option 2: Scale speeds 1.5x**
- Compensates for larger arena
- Maintains similar game duration
- Recommendation: Test both!

---

## Implementation Steps

### Step 1: Update Arena Config ✅
**File:** `js/core/config.js`

```javascript
arena: {
    size: 30,               // Was 15 → Now 30 (2x scale)
    wallHeight: 6,          // Was 3 → Now 6 (2x scale for visual consistency)
    wallThickness: 0.4,     // Was 0.2 → Now 0.4 (2x scale)
    floorColor: 0xcccccc,
    wallColor: 0x999999,
    floorY: 0
}
```

### Step 2: Update Camera Config ✅
**File:** `js/core/config.js`

```javascript
camera: {
    height: 50,             // Was 25 → Now 50 (2x scale)
    distance: 30,           // Was 15 → Now 30 (2x scale)
    fov: 60,                // Keep same
    lookAtOffset: {
        x: 0,
        y: -6,              // Was -3 → Now -6 (2x scale)
        z: 0
    }
}
```

### Step 3: Update "Vakten på IKEA" Difficulty ✅
**File:** `js/core/config.js` (difficulties array, index 6)

```javascript
// Level 7: Vakten på Ikea
{
    id: 6,
    name: "Vakten på Ikea",
    nameEnglish: "IKEA Security Guard",
    description: "Övervakar alla genvägar!",
    descriptionEnglish: "Watches all the shortcuts!",
    obstacles: {
        count: 10,                      // Keep same (user wants "way less")
        minDistanceBetween: 8.0,        // Was 4.0 → Now 8.0 (2x scale)
        canExclusionRadius: 12.0,       // Was 6.0 → Now 12.0 (2x scale)
        heightScaling: {
            nearMin: 0.5, nearMax: 0.6,  // Keep vertical scaling same
            midMin: 0.6, midMax: 1.5,
            farMin: 1.5, farMax: 3.5
        }
    },
    ai: {
        patrolSpeed: 0.12,              // Keep same (or 0.18 if scaling 1.5x)
        chaseSpeed: 0.18,               // Keep same (or 0.27 if scaling 1.5x)
        visionRange: 28,                // Was 14 → Now 28 (2x scale)
        visionAngle: 90                 // Keep same
    }
}
```

### Step 4: Update AI Can-Guard Patrol Radius ✅
**File:** `js/systems/ai/steering/can-guard-strategy.js`

```javascript
// In computeCanGuardPatrol initialization:
ai.guardState = {
    orbitRadius: 6.0,           // Was 3.0 → Now 6.0 (2x scale)
    // ... rest stays same
}
```

Also update distance thresholds:
- `if (distanceFromCan > 5.0)` → `if (distanceFromCan > 10.0)`
- `if (distanceFromCan < 1.8)` → `if (distanceFromCan < 3.6)`

### Step 5: Update AI Race Win Condition ✅
**File:** `js/systems/ai/ai-system.js`

```javascript
// In updateRaceBehavior:
if (distance < 1.6) {  // Was 0.8 → Now 1.6 (2x scale)
    this.triggerAIWins(gameState);
}
```

### Step 6: Update AI Spawn Position ✅
**File:** `js/core/config.js`

```javascript
ai: {
    hunter: {
        // ...
        spawnPosition: {
            x: -10,     // Was -5 → Now -10 (2x scale)
            y: 0.5,     // Keep same (height doesn't scale)
            z: 10       // Was 5 → Now 10 (2x scale)
        }
    }
}
```

### Step 7: Scale ALL Difficulty Levels (Optional) ⚠️
**Decision:** Do we scale all 10 levels or just "Vakten på IKEA"?

**Recommendation:** Scale all levels for consistency, but user specifically mentioned "Vakten på IKEA" as easiest setting.

If scaling all:
- Multiply all `count` values by same factor (or reduce proportionally)
- Multiply all `minDistanceBetween` by 2
- Multiply all `canExclusionRadius` by 2
- Multiply all `visionRange` by 2

---

## Testing Checklist

### Visual Tests:
- [ ] Arena is 30x30 (double check wall positions)
- [ ] Camera angle looks the same (same perspective)
- [ ] Obstacles are appropriately sized and spaced
- [ ] Can is visible from all corners
- [ ] AI hunter is visible during patrol

### Gameplay Tests:
- [ ] Player movement feels good (not too slow)
- [ ] AI patrol covers arena effectively
- [ ] Race to can is balanced (player has fair chance)
- [ ] 10 obstacles provide adequate hiding spots
- [ ] Vision range (28 units) feels right for new size

### Performance Tests:
- [ ] FPS stays stable (30x30 is still small)
- [ ] No rendering issues
- [ ] Collision detection works correctly

---

## Potential Issues & Solutions

### Issue 1: Arena feels too big / walking takes too long
**Solution:** Scale player/AI speeds by 1.5x:
```javascript
player: {
    speed: 0.225,        // Was 0.15 → Now 0.225 (1.5x)
    maxSpeed: 0.30       // Was 0.20 → Now 0.30 (1.5x)
}

ai.hunter: {
    patrolSpeed: 0.18,   // Was 0.12 → Now 0.18 (1.5x)
    chaseSpeed: 0.27     // Was 0.18 → Now 0.27 (1.5x)
}
```

### Issue 2: Obstacles look too small
**Solution:** Scale obstacle sizes by 2x:
```javascript
obstacles: {
    minWidth: 1.6,       // Was 0.8 → Now 1.6
    maxWidth: 5.0,       // Was 2.5 → Now 5.0
    minDepth: 1.6,
    maxDepth: 5.0
}
```

### Issue 3: Camera too far away (hard to see details)
**Solution:** Reduce camera distance slightly or increase FOV:
```javascript
camera: {
    height: 50,
    distance: 25,        // Reduce from 30 → 25 (closer)
    fov: 65              // Increase from 60 → 65 (wider view)
}
```

### Issue 4: Vision cone doesn't reach far enough
**Solution:** Vision range already scaled to 28 units (covers most of 30x30 arena from center)

---

## Files to Modify

1. ✅ `js/core/config.js` - Main config (arena, camera, obstacles, AI)
2. ✅ `js/systems/ai/steering/can-guard-strategy.js` - Patrol radius and distance thresholds
3. ✅ `js/systems/ai/ai-system.js` - Race win condition distance
4. ⚠️ `js/managers/obstacle-manager.js` - Verify obstacle placement works with new arena size
5. ⚠️ `js/managers/arena-manager.js` - Verify wall generation scales correctly

---

## Recommended Approach

### Phase 1: Basic Scaling (Do This First) ✅
1. Update arena size: 15 → 30
2. Update camera: height 25→50, distance 15→30, lookAt.y -3→-6
3. Update "Vakten på IKEA" obstacles: distances x2, vision x2
4. Test and observe

### Phase 2: Fine-Tuning (If Needed) ⚠️
1. Adjust speeds if arena feels too big
2. Adjust camera if viewing angle feels off
3. Adjust obstacle sizes if they look wrong
4. Scale other difficulty levels

### Phase 3: Polish (Optional) ⏳
1. Update all 10 difficulty levels consistently
2. Add difficulty selector UI
3. Balance testing for each level

---

## Math Reference

**Area Scaling:**
- 4x area = 2x linear scale (√4 = 2)
- Example: 15² = 225, 30² = 900 (900/225 = 4) ✅

**Camera Perspective Ratio:**
- Ratio = height / horizontal_distance
- Old: 25/15 = 1.67
- New: 50/30 = 1.67 (same angle) ✅

**FOV and Viewing Angle:**
- FOV determines vertical viewing angle
- Keeping FOV same = same vertical perspective ✅
- Horizontal is determined by aspect ratio (unchanged)

---

## User Request Summary

✅ **Arena 4x bigger:** 15x15 → 30x30
✅ **Camera same angle:** Scale height & distance proportionally
✅ **Vakten på IKEA difficulty:** Use as easiest setting (10 obstacles)
✅ **Way less obstacles:** 10 obstacles in 30x30 = much more open space

---

## Next Steps

1. **Execute Phase 1** - Update config values
2. **Test in browser** - Verify visual appearance
3. **Fine-tune** - Adjust speeds/sizes as needed
4. **User feedback** - Get approval before Phase 2

Ready to implement? 🚀
