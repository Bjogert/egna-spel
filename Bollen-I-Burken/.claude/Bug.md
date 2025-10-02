# Bug Report: Obstacle Collision Mismatch

**Status:** ✅ RESOLVED - Compound colliders implemented (2025-10-02)
**Priority:** ~~Medium~~ **FIXED**

---

## ✅ SOLUTION IMPLEMENTED

**Implementation:** Option 2 - Individual Box Entities (Compound Colliders)

### How It Works:

```javascript
// PARENT entity (visual)
ObstacleEntity
├─ Transform (group center position)
├─ Renderable (THREE.Group with visual meshes)
├─ Parent (component tracking child IDs)
└─ Hideable (hiding logic)

// CHILD entities (collision)
ColliderEntity1
├─ Transform (box 1 world position)
└─ Collider (box 1 exact dimensions)

ColliderEntity2
├─ Transform (box 2 world position)
└─ Collider (box 2 exact dimensions)

... (one child per box)
```

### Files Modified:

1. **`js/core/components/parent.js`** (NEW) - Links child entities to parents
2. **`js/systems/movement-system.js`** - Updated `collectStaticColliders()` to gather child colliders
3. **`js/managers/game-lifecycle.js`** - Creates parent + child entities per obstacle
4. **`js/managers/arena/arena-obstacles.js`** - Returns `boxes` array for compound colliders

### Result:

- ✅ **Pixel-perfect collision** - each visual box has matching collider
- ✅ **No invisible walls** - gaps in shapes are walkable
- ✅ **No fuzzy edges** - collision exactly matches what you see
- ✅ **Performance:** ~300-400 collider entities (negligible impact at 60fps)

---

## Context

**Project:** Bollen I Burken (Three.js ECS hide-and-seek game)
**Recent Work:** Obstacle Overhaul - replaced simple cube obstacles with Tetris-like wall shapes
**Branch:** `obstacle-overhaul`

---

## The Problem

**Visual obstacles don't match collision boundaries exactly.**

### What the player experiences:
- Can walk slightly "into" visible walls before colliding
- Collision happens ~0.2-0.4m away from visual edge
- Sometimes collision blocks movement where there's no visible obstacle
- Edges of walls don't feel "crisp" - collision is fuzzy

### Example scenario:
```
Visual wall:  [████████████]
Collision:    [  ▓▓▓▓▓▓▓▓  ]  ← Smaller or offset from visual
              ↑            ↑
           Edges don't align perfectly
```

---

## Systems Involved

### 1. **Obstacle Generation System** (`js/managers/arena/obstacle-shapes.js`)

**Purpose:** Creates Tetris-like wall shapes using multiple small boxes

**How it works:**
- Each "shape" (straight wall, L-corner, etc.) = array of box definitions
- Each box = `{ x, y, z, width, height, depth }`
- Boxes positioned relative to each other using `UNIT_SIZE = 0.8m`
- Example straight wall: 8-15 boxes in a row

**Current state:**
```javascript
// Straight wall = row of cubes
for (let i = 0; i < length; i++) {
    boxes.push({
        x: i * UNIT_SIZE,  // 0.8m apart
        y: 0,
        z: 0,
        width: UNIT_SIZE,   // 0.8m
        height: height,     // Varies by distance from can
        depth: WALL_THICKNESS  // 0.8m (was 0.4m - caused thin slices)
    });
}
```

### 2. **Rendering System** (`js/managers/arena/arena-obstacles.js`)

**Purpose:** Creates THREE.js meshes for visual display

**How it works:**
- Each shape → `THREE.Group` parent object
- Each box in shape → `THREE.Mesh` (box geometry) added as child to group
- Group positioned at world coordinates
- Individual boxes positioned relative to group center

**Current state:**
```javascript
// Create visual mesh for each box
const mesh = new THREE.Mesh(geometry, material);
mesh.position.set(box.x, box.y + box.height / 2, box.z);  // Relative to group
group.add(mesh);

// Position entire group
group.position.set(position.x, position.y, position.z);  // World coords
```

**Issue:** Boxes positioned relative to group, then group positioned in world = two-level transform

### 3. **Collision System** (ECS Architecture)

**Purpose:** Detect when player/AI collide with obstacles

**Components used:**
- `Transform` - World position (x, y, z)
- `Collider` - Collision box (width, height, depth)
- `Renderable` - Link to THREE.js mesh/group

**How collision works:**
```
1. Movement System calculates new player position
2. Collision System checks if new position overlaps with any Collider
3. Uses AABB (Axis-Aligned Bounding Box) collision detection
4. If collision: prevent movement in that direction
```

**Current collision entity creation:**
```javascript
obstacles.forEach((obstacle) => {
    const entity = createEntity();

    // Position = center of entire shape group
    entity.addComponent(new Transform(
        obstacle.position.x,
        obstacle.position.y,
        obstacle.position.z
    ));

    // Collider = SINGLE bounding box around ENTIRE shape
    entity.addComponent(new Collider('box', {
        width: obstacle.bounds.width,   // Max X - Min X of all boxes
        height: obstacle.height,
        depth: obstacle.bounds.depth    // Max Z - Min Z of all boxes
    }));
});
```

**The Core Problem:**
- **Visual:** 8-15 separate boxes with gaps between them
- **Collision:** 1 big box covering entire shape (fills gaps!)

Example:
```
Visual:  ██  ██  ██  ██  ██  (5 separate cubes)
Bounds:  [████████████████]  (single bounding box)
         ↑ Invisible walls in gaps!
```

---

## What We Tried

### ❌ **Attempt 1: One collider per box**
```javascript
obstacle.group.children.forEach((mesh) => {
    const entity = createEntity();
    entity.addComponent(new Collider(mesh.geometry.parameters));
});
```
**Result:** Game broke - didn't work
**Reason:** Unknown (didn't investigate further before reverting)

### ✅ **Attempt 2: Simplified shapes**
Removed L-corners, T-junctions, Z-shapes. Only use:
- Straight walls (single row of boxes)
- Short walls
- Small cubes (2×2 or 3×3)

**Result:** Much better! But edges still ~0.2m off

**Why it helped:**
- Straight walls have narrow bounding boxes (width × 0.8m depth)
- Less "gap filling" by bounding box
- But still single collider for multi-box shape

---

## Technical Details

### Bounding Box Calculation
```javascript
function calculateShapeBounds(boxes) {
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (const box of boxes) {
        minX = Math.min(minX, box.x - box.width / 2);
        maxX = Math.max(maxX, box.x + box.width / 2);
        minZ = Math.min(minZ, box.z - box.depth / 2);
        maxZ = Math.max(maxZ, box.z + box.depth / 2);
    }

    return {
        width: maxX - minX,   // Total width
        depth: maxZ - minZ,   // Total depth
        centerX: (minX + maxX) / 2,
        centerZ: (minZ + maxZ) / 2
    };
}
```

### Position Offset Issue
**Group position** = world coords
**Box positions** = relative to group
**Collider position** = group center (may not align with visual center if boxes asymmetric)

Example with 5-box straight wall:
```
Boxes at relative X: [0, 0.8, 1.6, 2.4, 3.2]
Visual center: X = 1.6
Bounds center: X = 1.6  ✓ Matches

But if boxes are: [0, 0.8, 1.6, 2.4, 3.2, 4.0]
Visual has 6 boxes, center between box 3 and 4
Collider might be slightly off
```

---

## Possible Solutions to Research

### Option 1: **Compound Colliders**
Create multiple collider components per obstacle entity
- Each box gets its own collider
- All attached to same entity
- Collision system checks ALL colliders

**Pros:** Perfect accuracy
**Cons:** Need to modify collision system to support compound colliders

**Research needed:**
- Does ECS architecture support multiple components of same type?
- How to handle collision detection with compound shapes?

### Option 2: **Individual Box Entities**
Each visual box = separate entity
- Straight wall with 10 boxes = 10 entities
- Each entity has Transform + Collider + Renderable

**Pros:** Uses existing systems
**Cons:**
- Creates MANY entities (35 obstacles × 10 boxes = 350 entities)
- Performance concerns?
- Complexity in managing shape as a group

**Research needed:**
- Performance impact of hundreds of obstacle entities?
- How to group boxes for game logic (hiding behind obstacle)?

### Option 3: **Mesh-Based Collision**
Use THREE.js raycasting or built-in collision
- Don't use ECS Collider component
- Directly check if position intersects THREE.Mesh

**Pros:** Perfect visual alignment
**Cons:**
- Bypasses ECS architecture
- THREE.js collision may be slower than AABB
- Need to rewrite collision detection

**Research needed:**
- THREE.js collision detection methods
- Performance vs AABB collision
- Integration with existing ECS movement system

### Option 4: **Physics Engine**
Integrate physics library (Rapier, Cannon.js, Ammo.js)
- Physics engine handles collision
- Automatically creates colliders from meshes

**Pros:**
- Professional solution
- Accurate collision
- Future-proof for gameplay expansion

**Cons:**
- Big dependency
- Overkill for simple hide-and-seek?
- Learning curve

**Research needed:**
- Lightweight physics libraries for web
- Three.js + physics integration tutorials
- Performance benchmarks

### Option 5: **Accept the Fuzziness**
Keep current system, just tweak values
- Reduce UNIT_SIZE to 0.6m (smaller boxes = less gap)
- Increase obstacle count to compensate
- Adjust collision tolerance

**Pros:** No code changes
**Cons:** Still imprecise, just less noticeable

---

## Current Architecture Summary

```
┌─────────────────────────────────────────────────┐
│ VISUAL LAYER (THREE.js)                         │
├─────────────────────────────────────────────────┤
│ ObstacleShapes.generateRandomShape()            │
│   ↓ Creates array of box definitions            │
│ ArenaObstacles.createShapeGroup()               │
│   ↓ Creates THREE.Group with Mesh children      │
│ Scene.add(group)                                │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ COLLISION LAYER (ECS)                           │
├─────────────────────────────────────────────────┤
│ GameLifecycle.createObstacleEntities()          │
│   ↓ ONE entity per shape (not per box!)        │
│ Entity.addComponent(Transform)                  │
│   ↓ Position = group center                     │
│ Entity.addComponent(Collider)                   │
│   ↓ Size = bounding box of entire shape        │
│ Entity.addComponent(Renderable)                 │
│   ↓ Link to THREE.Group                         │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ GAME LOOP                                       │
├─────────────────────────────────────────────────┤
│ MovementSystem.update()                         │
│   ↓ Calculate new player position               │
│ CollisionSystem.checkCollision()                │
│   ↓ AABB test: player box vs obstacle box      │
│   ↓ Uses Transform.position + Collider.size    │
│   ↓ DOES NOT check individual meshes!          │
│ If collision: reject movement                   │
└─────────────────────────────────────────────────┘

KEY INSIGHT:
Visual = Group of many boxes
Collision = Single bounding box
→ Collision is approximate, not exact
```

---

## Files Involved

### Created/Modified:
- `js/managers/arena/obstacle-shapes.js` (NEW) - Shape definitions
- `js/managers/arena/arena-obstacles.js` (REFACTORED) - Uses shape system
- `js/managers/game-lifecycle.js:97-133` - Creates obstacle entities
- `js/core/config.js` - Added `heightScaling` to difficulty levels

### Relevant Existing Systems:
- `js/components/collider.js` - Collision component
- `js/components/transform.js` - Position component
- `js/systems/collision-system.js` - AABB collision detection
- `js/systems/movement-system.js` - Player movement

---

## Questions for Research

1. **ECS patterns:** How do other ECS games handle complex collision shapes?
2. **THREE.js collision:** What are best practices for accurate 3D collision in Three.js?
3. **Performance:** How many entities/colliders can browser handle at 60fps?
4. **Physics engines:** What's the lightest-weight physics lib for web?
5. **Game feel:** Is pixel-perfect collision necessary for hide-and-seek gameplay?

---

## Recommendations

**Short term:** Keep current system - it's "good enough" for playtesting
**Medium term:** Research Option 2 (individual box entities) or Option 3 (mesh collision)
**Long term:** Consider Option 4 (physics engine) if game expands beyond prototype

**Priority:** Test with real players - does the collision imprecision break gameplay?
If players don't notice/care, don't over-engineer the fix.

---

**KISS Reminder:** Don't add complexity until it's proven necessary. Current system works, just not perfect.
