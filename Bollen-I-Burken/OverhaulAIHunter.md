# AI Hunter System - Technical Documentation

**Status:** ANALYSIS - Spinning bug identified
**Goal:** Understand current AI behavior and fix spinning issue

---

## 🐛 **CURRENT BUG**

**Symptom:** AI hunter spins uncontrollably until it sees the player

**Observed Behavior:**
- At game start, hunter rotates rapidly in place
- Spinning continues until player enters vision cone
- Once player spotted, AI works correctly (chases player)
- After losing sight, may resume spinning

---

## Current AI Architecture

### ECS Components Used

1. **AIHunter Component** (`js/core/components/ai-hunter.js`)
   - Stores AI state and behavior data
   - Does NOT contain logic (data only)

2. **VisionCone Component** (`js/core/components/vision-cone.js`)
   - Stores vision parameters and seen targets
   - Does NOT contain logic (data only)

3. **Transform Component** (`js/core/components/transform.js`)
   - Position, rotation, velocity
   - Shared with all movable entities

4. **Movement Component** (`js/core/components/movement.js`)
   - Speed, acceleration, friction
   - Shared with players

5. **Renderable Component** (`js/core/components/renderable.js`)
   - Links to THREE.js mesh for visual

---

## AI System (`js/systems/ai/ai-system.js`)

**Purpose:** Updates all AI hunters every frame

### Update Loop

```
AISystem.update(gameState, deltaTime)
  ↓
  For each hunter entity:
    ↓
    updateHunter(hunter, gameState, deltaTime)
      ↓
      Based on aiComponent.state:
        - PATROL → updatePatrolBehavior()
        - HUNTING → updateHuntingBehavior()
        - SEARCHING → updateSearchingBehavior()
      ↓
      updateVision() - Check if player is visible
      ↓
      checkPlayerCollision() - Tag player if close
```

---

## AI States

```javascript
const AI_STATES = {
    PATROL: 'PATROL',      // Default - wandering around
    HUNTING: 'HUNTING',    // Chasing visible player
    SEARCHING: 'SEARCHING' // Lost player, searching last known position
};
```

### State Transitions

```
PATROL
  ↓ (player spotted by vision cone)
HUNTING
  ↓ (player lost from vision)
SEARCHING
  ↓ (timeout after 5 seconds)
PATROL
```

---

## Patrol Behavior (THE SPINNING BUG IS HERE!)

### Current Implementation (`updatePatrolBehavior()`)

```javascript
updatePatrolBehavior(aiComponent, transform, movement, deltaTime) {
    const patrolSpeed = movement.speed || aiComponent.speed;

    // Pick new random direction every 1.5-3.5 seconds
    if (!aiComponent.target || aiComponent.patrolTimer <= 0) {
        aiComponent.patrolTimer = randomInRange(1500, 3500);
        aiComponent.patrolDirection = Math.random() * Math.PI * 2;  // NEW random direction
        aiComponent.targetDirection = aiComponent.patrolDirection;  // Set target to same
    }

    aiComponent.patrolTimer -= deltaTime;

    // Smooth turning toward target direction
    const turnSpeed = 2.0;
    let angleDiff = aiComponent.targetDirection - aiComponent.patrolDirection;

    // Normalize angle difference (-π to π)
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    const turnStep = turnSpeed * (deltaTime / 1000);
    if (Math.abs(angleDiff) > turnStep) {
        aiComponent.patrolDirection += Math.sign(angleDiff) * turnStep;  // Turn gradually
    } else {
        aiComponent.patrolDirection = aiComponent.targetDirection;  // Snap to target
    }

    // Move forward in current direction
    transform.velocity.x = Math.sin(aiComponent.patrolDirection) * patrolSpeed;
    transform.velocity.z = Math.cos(aiComponent.patrolDirection) * patrolSpeed;
}
```

### 🔴 **THE PROBLEM**

**Lines 93-94:**
```javascript
aiComponent.patrolDirection = Math.random() * Math.PI * 2;  // Random 0-360°
aiComponent.targetDirection = aiComponent.patrolDirection;  // SAME as current!
```

**What This Does:**
1. Every 1.5-3.5 seconds, pick NEW random direction
2. Set `patrolDirection` = new random angle
3. Set `targetDirection` = SAME angle
4. **Result:** `angleDiff = targetDirection - patrolDirection = 0`
5. **No turning happens!** AI just sets new direction instantly

**But Wait... Why Spinning?**

Looking at lines 100-109, the turning logic runs EVERY FRAME:
```javascript
let angleDiff = aiComponent.targetDirection - aiComponent.patrolDirection;
// ... normalize ...
const turnStep = turnSpeed * (deltaTime / 1000);
if (Math.abs(angleDiff) > turnStep) {
    aiComponent.patrolDirection += Math.sign(angleDiff) * turnStep;
}
```

**The Bug:**
- `patrolDirection` and `targetDirection` start IDENTICAL
- But `patrolDirection` gets modified by turning logic
- `targetDirection` stays fixed
- Creates tiny angle differences that cause micro-adjustments
- These accumulate into continuous rotation

**Additional Issue - Initial State:**

In `ai-hunter.js` constructor:
```javascript
this.patrolDirection = Math.random() * Math.PI * 2;  // Random start direction
this.targetDirection = this.patrolDirection;         // Same as start
```

At game start:
- Both are equal
- But transform.rotation.y might be DIFFERENT (set elsewhere)
- Creates mismatch → spinning to align

---

## Movement System Integration

`movement-system.js` applies the velocity set by AI:

```javascript
updateAIMovement(transform) {
    // Apply velocity from AI system
    transform.position.x += transform.velocity.x;
    transform.position.z += transform.velocity.z;

    // Check collisions
    const correctedPosition = this.checkObstacleCollision(...);
    transform.position.x = correctedPosition.x;
    transform.position.z = correctedPosition.z;

    // Update mesh rotation to match velocity direction
    if (transform.velocity.x !== 0 || transform.velocity.z !== 0) {
        transform.rotation.y = Math.atan2(transform.velocity.x, transform.velocity.z);
    }
}
```

**Issue Here:**
- `transform.rotation.y` is set based on **velocity**
- But AI uses `aiComponent.patrolDirection` for logic
- These can drift apart → more spinning

---

## Hunting Behavior

```javascript
updateHuntingBehavior(aiComponent, transform, movement, deltaTime) {
    // Get last seen player position from vision cone
    if (visionCone && visionCone.lastSeenPosition) {
        const dx = visionCone.lastSeenPosition.x - transform.position.x;
        const dz = visionCone.lastSeenPosition.z - transform.position.z;

        const huntingDirection = Math.atan2(dz, dx);  // Direction to player

        // Smooth turn toward player
        let angleDiff = huntingDirection - aiComponent.patrolDirection;
        // ... normalize ...

        // Turn gradually
        aiComponent.patrolDirection += Math.sign(angleDiff) * turnStep;

        // Move toward player at hunting speed
        transform.velocity.x = Math.cos(aiComponent.patrolDirection) * huntingSpeed;
        transform.velocity.z = Math.sin(aiComponent.patrolDirection) * huntingSpeed;
    }
}
```

**This Works Better Because:**
- `huntingDirection` is constantly updated based on player position
- Creates real angle difference to turn toward
- No instant snapping

---

## Vision System

### How Vision Detection Works

```javascript
updateVision(hunter, visionCone, gameState) {
    // 1. Get AI and player positions
    const dx = playerPos.x - aiPos.x;
    const dz = playerPos.z - aiPos.z;
    const distance = Math.sqrt(dx*dx + dz*dz);

    // 2. Check distance
    if (distance > visionCone.range) return;  // Too far

    // 3. Check angle (is player in cone?)
    const angleToPlayer = Math.atan2(dx, dz);
    const aiDirection = aiTransform.rotation.y;

    let angleDiff = angleToPlayer - aiDirection;
    // normalize to -π to π

    const halfVisionAngle = (visionCone.angle * Math.PI / 180) / 2;

    if (Math.abs(angleDiff) <= halfVisionAngle) {
        // 4. Check line of sight (raycast)
        if (checkLineOfSight(aiPos, playerPos, gameState)) {
            // PLAYER SPOTTED!
            visionCone.canSeePlayer = true;
            visionCone.lastSeenPosition = playerPos;

            // Switch to HUNTING
            if (aiComponent.state === 'PATROL') {
                aiComponent.state = 'HUNTING';
            }
        }
    }
}
```

### Line of Sight Check

```javascript
checkLineOfSight(aiPosition, playerPosition, gameState) {
    // Get all obstacles that block vision
    const obstacles = [];
    for (entity of gameState.entities) {
        if (entity.has('Collider') && collider.blockVision) {
            obstacles.push(entity);
        }
    }

    // Raycast from AI to player
    const steps = Math.ceil(distance * 2);  // Sample points along line
    for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const x = aiPos.x + dx * t;
        const z = aiPos.z + dz * t;

        // Check if this point hits any obstacle
        for (obstacle of obstacles) {
            if (point inside obstacle bounding box) {
                return false;  // BLOCKED!
            }
        }
    }

    return true;  // CLEAR LINE OF SIGHT
}
```

---

## AI Hunter Creation

### Where AI is Spawned (`player-manager.js`)

```javascript
addAIHunter() {
    // Get difficulty settings from CONFIG
    const difficultyLevel = CONFIG.currentDifficulty;
    const difficulty = CONFIG.difficulties[difficultyLevel];

    const patrolSpeed = difficulty.ai.patrolSpeed;    // 0.06-0.15
    const chaseSpeed = difficulty.ai.chaseSpeed;      // 0.10-0.25
    const visionAngle = difficulty.ai.visionAngle;    // 60-110°
    const visionRange = difficulty.ai.visionRange;    // 8-18m

    // Create mesh
    const geometry = new THREE.BoxGeometry(0.9, 1.1, 0.9);
    const material = new THREE.MeshLambertMaterial({ color: 0xff4444 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-5, 0.5, 5);  // Spawn position

    // Create entity
    const aiEntity = this.gameEngine.gameState.createEntity();

    // Add components
    aiEntity.addComponent(new Transform(-5, 0.5, 5));
    aiEntity.addComponent(new Renderable(mesh));
    aiEntity.addComponent(new Movement(patrolSpeed, 0.9));

    // AI-specific components
    const aiHunter = new AIHunter();
    aiHunter.speed = patrolSpeed;
    aiHunter.huntingSpeed = chaseSpeed;
    aiEntity.addComponent(aiHunter);

    aiEntity.addComponent(new VisionCone(visionAngle, visionRange));

    // Register with AI system
    this.gameEngine.aiSystem.addEntity(aiEntity);
}
```

---

## Configuration (`js/core/config.js`)

### Difficulty-Based AI Settings

Each of 10 difficulty levels has:

```javascript
{
    ai: {
        patrolSpeed: 0.06,     // Movement speed while patrolling
        chaseSpeed: 0.10,      // Movement speed while hunting
        visionRange: 8,        // How far AI can see (meters)
        visionAngle: 60        // Vision cone angle (degrees)
    }
}
```

**Easiest (Level 1 - Barnkalas):**
```javascript
ai: {
    patrolSpeed: 0.06,
    chaseSpeed: 0.10,
    visionRange: 8,
    visionAngle: 60
}
```

**Hardest (Level 10 - Systemet Stänger):**
```javascript
ai: {
    patrolSpeed: 0.15,
    chaseSpeed: 0.25,
    visionRange: 18,
    visionAngle: 110
}
```

---

## Movement Calculations

### Direction vs Rotation

**Three different angle systems in use:**

1. **`aiComponent.patrolDirection`** (radians, 0-2π)
   - Used by AI logic
   - 0 = north (+Z), π/2 = east (+X)

2. **`transform.rotation.y`** (radians)
   - Visual mesh rotation
   - Set by movement system based on velocity

3. **`transform.velocity.x/z`** (units/frame)
   - Actual movement vector
   - Set by AI system

**Conversion:**
```javascript
// Direction (angle) → Velocity (vector)
velocity.x = Math.sin(direction) * speed;
velocity.z = Math.cos(direction) * speed;

// Velocity → Rotation
rotation.y = Math.atan2(velocity.x, velocity.z);
```

---

## File Structure

```
js/
├─ core/
│  └─ components/
│     ├─ ai-hunter.js         ← AI state data
│     ├─ vision-cone.js       ← Vision parameters
│     ├─ transform.js         ← Position/rotation
│     └─ movement.js          ← Speed/acceleration
│
├─ systems/
│  ├─ ai/
│  │  └─ ai-system.js         ← AI BEHAVIOR LOGIC (update loop)
│  └─ movement-system.js      ← Applies velocity, handles collision
│
└─ managers/
   └─ player-manager.js       ← Creates AI hunter entities
```

---

## Potential Fixes for Spinning Bug

### Option 1: Fix Patrol Direction Logic

**Problem:** `targetDirection` set same as `patrolDirection`

**Fix:**
```javascript
// In updatePatrolBehavior, line 93-94
if (!aiComponent.target || aiComponent.patrolTimer <= 0) {
    aiComponent.patrolTimer = randomInRange(1500, 3500);

    // KEEP current direction, pick NEW target
    // aiComponent.patrolDirection stays unchanged
    aiComponent.targetDirection = Math.random() * Math.PI * 2;  // NEW target only
}
```

**Result:** AI will smoothly turn from current direction to new target over time

---

### Option 2: Simplified Patrol (No Turning Logic)

**Problem:** Over-complicated turning

**Fix:**
```javascript
updatePatrolBehavior(aiComponent, transform, movement, deltaTime) {
    // Pick new direction periodically
    if (aiComponent.patrolTimer <= 0) {
        aiComponent.patrolTimer = randomInRange(2000, 4000);
        aiComponent.patrolDirection = Math.random() * Math.PI * 2;
    }

    aiComponent.patrolTimer -= deltaTime;

    // Just move in current direction (no gradual turning)
    const patrolSpeed = movement.speed || aiComponent.speed;
    transform.velocity.x = Math.sin(aiComponent.patrolDirection) * patrolSpeed;
    transform.velocity.z = Math.cos(aiComponent.patrolDirection) * patrolSpeed;

    // Rotation handled by movement system
}
```

**Result:** Instant direction changes but no spinning

---

### Option 3: Sync with Transform Rotation

**Problem:** `patrolDirection` and `transform.rotation.y` drift apart

**Fix:**
```javascript
// At start of updatePatrolBehavior
// Sync AI direction with actual mesh rotation
aiComponent.patrolDirection = transform.rotation.y;

// Then do turning logic as normal
```

**Result:** No mismatch between internal state and visual

---

### Option 4: Waypoint-Based Patrol

**Problem:** Random directions cause erratic movement

**Fix:** Use actual waypoints instead of random angles

```javascript
// In AIHunter constructor
this.patrolWaypoints = [
    { x: -5, z: -5 },
    { x: 5, z: -5 },
    { x: 5, z: 5 },
    { x: -5, z: 5 }
];
this.currentWaypointIndex = 0;

// In updatePatrolBehavior
updatePatrolBehavior(aiComponent, transform, movement, deltaTime) {
    const target = aiComponent.patrolWaypoints[aiComponent.currentWaypointIndex];

    const dx = target.x - transform.position.x;
    const dz = target.z - transform.position.z;
    const distance = Math.sqrt(dx*dx + dz*dz);

    // Reached waypoint?
    if (distance < 1.0) {
        aiComponent.currentWaypointIndex = (aiComponent.currentWaypointIndex + 1) % aiComponent.patrolWaypoints.length;
    }

    // Move toward current waypoint
    const direction = Math.atan2(dx, dz);
    transform.velocity.x = Math.sin(direction) * patrolSpeed;
    transform.velocity.z = Math.cos(direction) * patrolSpeed;
}
```

**Result:** Predictable patrol routes, no spinning

---

## Research Questions

1. **Smooth Turning:** How do other ECS games handle smooth rotation without drift?

2. **Behavior Trees:** Should AI use a behavior tree instead of state machine?

3. **Steering Behaviors:** Should we implement proper steering (seek, wander, avoid)?
   - Resources: Craig Reynolds' steering behaviors, boids algorithms

4. **Performance:** With compound colliders adding 300+ entities, can we optimize AI vision raycasting?

5. **Patrol Patterns:** What patrol patterns feel best for hide-and-seek gameplay?
   - Random wander
   - Fixed waypoints
   - Grid search pattern
   - Sound-based investigation

6. **Detection Balance:** How to make vision feel fair?
   - Peripheral vision (reduced range at edges of cone)
   - Detection time (must see player for X seconds to trigger)
   - Alertness levels (patrol = slow detection, alert = fast detection)

---

## Next Steps

1. **Immediate Fix:** Implement Option 1 or 2 to stop spinning
2. **Test:** Verify AI patrols smoothly without player
3. **Playtest:** Check if hunting behavior still works
4. **Iterate:** Adjust patrol patterns based on gameplay feel
5. **Polish:** Add smooth acceleration/deceleration

---

**Recommendation:** Start with **Option 1** (simplest fix) and test. If that doesn't work, try **Option 4** (waypoint-based) for more predictable behavior.
