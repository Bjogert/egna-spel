# AI Hearing System - Comprehensive Code Path Analysis

**Analysis Date**: 2025-10-03
**Codebase**: Bollen-I-Burken (Hide & Seek AI Game)
**Focus**: Complete mapping of AI hearing → investigation flow

---

## Executive Summary

The AI hearing system implements a sophisticated sound detection and investigation mechanism where the AI hunter:
1. Continuously monitors player movement speed and proximity
2. Calculates effective hearing range based on player speed and sneaking state
3. Transitions to INVESTIGATE state when player is heard
4. Navigates to the heard position using steering behaviors + obstacle avoidance
5. Performs a look-around behavior before returning to patrol

**Key Finding**: The system uses **gradual rotation** via steering behaviors, but there is NO **instant snap rotation** when hearing the player initially. This creates a delayed reaction that may feel less responsive.

---

## 1. HEARING DETECTION FLOW

### 1.1 Entry Point: `updateHearing()` (ai-system.js:121-194)

```
AISystem.update() → updateHunter() → updateHearing()
```

**Execution Frequency**: Every frame during PLAYING phase (60 FPS typically)

### 1.2 Complete Hearing Detection Algorithm

**File**: `C:\Users\robert\egna-spel\Bollen-I-Burken\js\systems\ai\ai-system.js`

**Flow Diagram**:
```
START: updateHearing(hunter, gameState)
  ↓
[1] Get AI Transform (position)
  ↓
[2] Get Local Player Transform (position)
  ↓
[3] Calculate 2D Distance (Euclidean)
    dx = playerX - aiX
    dz = playerZ - aiZ
    distance = sqrt(dx² + dz²)
  ↓
[4] Get Player Movement Data (from MovementSystem)
    - playerSpeed: current speed (from acceleration tracking)
    - isSneaking: boolean sneaking state
  ↓
[5] Calculate Sound Level (0-1 normalized)
    soundLevel = playerSpeed / playerMaxSpeed
    IF isSneaking:
      soundLevel *= sneakVolumeMultiplier (0.3 = 30%)
  ↓
[6] Calculate Effective Hearing Range
    effectiveRange = hearingRange * soundLevel
    (hearingRange = 19.0m default, tweakable)
  ↓
[7] Debug Log (throttled to 1/second)
    console.log("🎧 Hearing Check: Distance, EffectiveRange, PlayerSpeed, SoundLevel")
  ↓
[8] Check Hearing Condition
    IF distance <= effectiveRange AND playerSpeed > 0.01:
      ↓
      [9] Check AI State (must be PATROL or INVESTIGATE)
          ↓
          [10a] IF state == PATROL:
                - Set state = INVESTIGATE
                - Store lastHeardPosition = {x: playerX, z: playerZ}
                - Set investigateStartTime = now
                - Reset investigateLookAroundTime = 0
                - Reset investigateStuckCount = 0
                - Log: "🚨 AI HEARD PLAYER at distance X! Going to investigate"
          ↓
          [10b] IF state == INVESTIGATE:
                - Update lastHeardPosition (continuous tracking)
                - Reset investigateStartTime (extends investigation timer)
                - Log: "🔄 AI updated investigation target"
          ↓
          [10c] ELSE (state == RACE):
                - Log: "🎧 AI hears player but is in RACE state (can't investigate)"
                - No state change
    ELSE:
      No action (player too quiet or too far)
  ↓
END
```

### 1.3 Sound Level Calculation Details

**Key Variables** (from MovementSystem):
- `playerCurrentSpeed`: Real-time speed calculated from velocity magnitude (line 267)
- `playerMaxSpeed`: 0.13 (default, tweakable)
- `isSneaking`: Boolean flag from MovementSystem (line 26)

**Audio System Integration**:
- `sneakVolumeMultiplier`: 0.3 (30% volume when sneaking) - defined in AudioSystem
- This same multiplier affects BOTH audio playback AND hearing detection (intentional consistency)

**Effective Range Examples**:
```
Scenario 1: Running at max speed (0.13), not sneaking
  soundLevel = 0.13 / 0.13 = 1.0
  effectiveRange = 19.0 * 1.0 = 19.0 meters (FULL range)

Scenario 2: Walking at half speed (0.065), not sneaking
  soundLevel = 0.065 / 0.13 = 0.5
  effectiveRange = 19.0 * 0.5 = 9.5 meters (HALF range)

Scenario 3: Running at max speed (0.13), sneaking
  soundLevel = (0.13 / 0.13) * 0.3 = 0.3
  effectiveRange = 19.0 * 0.3 = 5.7 meters (REDUCED by 70%)

Scenario 4: Standing still (0.0)
  soundLevel = 0.0 / 0.13 = 0.0
  effectiveRange = 0.0 meters (INAUDIBLE)
```

### 1.4 State Transition Trigger

**Critical Code** (ai-system.js:177-188):
```javascript
if (aiComponent.state !== AI_STATES.INVESTIGATE) {
    aiComponent.state = AI_STATES.INVESTIGATE;  // STATE CHANGE HERE
    aiComponent.investigateStartTime = Date.now();
    aiComponent.investigateLookAroundTime = 0;
    aiComponent.investigateStuckCount = 0;
    console.log(`🚨 AI HEARD PLAYER...`);
}
```

**Important**: NO instant rotation happens at this moment. Rotation is handled later by InvestigateBehavior using gradual steering.

---

## 2. INVESTIGATION BEHAVIOR FLOW

### 2.1 Entry Point: `updateInvestigateBehavior()` (investigate-behavior.js:21-136)

```
AISystem.updateHunter() → updateInvestigateBehavior() (when state == INVESTIGATE)
```

**Delegation Pattern** (ai-system.js:272-287):
```javascript
updateInvestigateBehavior(aiComponent, transform, movement, deltaTime, gameState) {
    const newState = InvestigateBehavior.updateInvestigateBehavior(
        aiComponent, transform, movement, deltaTime, gameState,
        this.getStaticColliders.bind(this)
    );
    if (newState) {
        aiComponent.state = AI_STATES[newState];  // Handle state transition back to PATROL
    }
}
```

### 2.2 Investigation State Machine

**File**: `C:\Users\robert\egna-spel\Bollen-I-Burken\js\systems\ai\behaviors\investigate-behavior.js`

**Flow Diagram**:
```
START: updateInvestigateBehavior()
  ↓
[1] Check if lastHeardPosition exists
    IF null → return 'PATROL' (abort investigation)
  ↓
[2] Calculate Distance to Investigation Target
    dx = lastHeardPosition.x - aiX
    dz = lastHeardPosition.z - aiZ
    distanceToTarget = sqrt(dx² + dz²)
  ↓
[3] PHASE DECISION
    ↓
    IF distanceToTarget > 1.5m:
      ┌─────────────────────────────────────────────────┐
      │ PHASE 1: NAVIGATION TO HEARD POSITION          │
      └─────────────────────────────────────────────────┘
      ↓
      [4] Check Stuck Detection
          IF isStuckOnWall():
            investigateStuckCount++
            IF stuckCount > 3:
              → Give up, return 'PATROL'
            ELSE:
              → Execute unstuck() (rotate 120-180° randomly)
      ↓
      [5] Get Obstacle Avoidance Steering
          staticColliders = getStaticColliders()
          avoidance = ObstacleAvoidance.computeObstacleAvoidance(
            transform, aiComponent, staticColliders, 3.0m lookahead
          )
      ↓
      [6] Get Arrive Steering (smooth approach)
          arriveSteering = SteeringBehaviors.arrive(
            ai, lastHeardPosition, currentPosition, 2.5m slowRadius
          )
      ↓
      [7] Combine Steering (weighted blend)
          combined = {
            arrive: weight 1.0
            avoidance: weight 3.0  (3x more important!)
          }
      ↓
      [8] Apply Steering to Heading
          aiComponent.heading += combined.angular * dt
          (heading normalized to -π to π)
      ↓
      [9] Update Velocity
          velocity.x += combined.linear.x * dt
          velocity.z += combined.linear.z * dt
          (clamped to maxSpeed, friction applied)
      ↓
      [10] Update Transform
          transform.velocity = aiComponent.velocity
          transform.rotation.y = aiComponent.heading  ← GRADUAL ROTATION
    ↓
    ELSE (distanceToTarget <= 1.5m):
      ┌─────────────────────────────────────────────────┐
      │ PHASE 2: LOOK AROUND AT HEARD POSITION         │
      └─────────────────────────────────────────────────┘
      ↓
      [11] Reset Stuck Counter (arrived safely)
      ↓
      [12] Stop Movement
          velocity.x = 0, velocity.z = 0
      ↓
      [13] Rotate Slowly in Place
          investigateLookAroundTime += deltaTime
          rotationSpeed = 1.0 rad/sec
          heading += rotationSpeed * dt
          transform.rotation.y = heading
  ↓
[14] Check Investigation Timeout
    elapsed = now - investigateStartTime
    IF elapsed > investigateDuration (8000ms):
      → Reset all investigation state
      → return 'PATROL'
  ↓
END (return null = no state change)
```

### 2.3 Steering Behavior Integration

**Arrive Behavior** (steering-behaviors.js:110-130):
- Calculates direction to target
- Applies speed scaling based on distance (slowRadius = 2.5m)
- Within slowRadius: speed factor = distance/slowRadius (0-1)
- Beyond slowRadius: speed factor = 1.0 (full speed)

**Obstacle Avoidance** (obstacle-avoidance.js:17-87):
- Raycasts forward in heading direction (lookAhead = 3.0m)
- Detects closest obstacle in cone (70° = dot product > 0.3)
- Calculates turn direction via cross product
- Urgency = 1.0 - (distance/lookAhead), squared for panic
- Angular steering = turnDirection * maxAngularAccel * 8.0 * panic
- Linear steering = perpendicular push (sideways) * 5.0 * panic

**Combination Weights**:
```javascript
arrive: 1.0x
avoidance: 3.0x  // Avoidance 3x more important (prevents wall-sticking)
```

### 2.4 Component Dependencies

**Required Components** (checked in ai-system.js:86-93):
- `AIHunter`: State machine and investigation tracking
- `Transform`: Position, rotation, velocity
- `Movement`: (Currently unused in investigation, legacy)
- `VisionCone`: (Optional, for vision checks)

**External System Dependencies**:
- `MovementSystem`: Player speed tracking (window.movementSystem)
- `AudioSystem`: Sneak volume multiplier (window.audioSystem)
- `ObstacleAvoidance`: Wall detection and avoidance
- `SteeringBehaviors`: Arrive, wander, seek behaviors

---

## 3. AI COMPONENT STATE MACHINE

### 3.1 All AI States

**Defined in** ai-system.js:11-15
```javascript
const AI_STATES = {
    PATROL: 'PATROL',          // Orbit can at ~3m radius
    INVESTIGATE: 'INVESTIGATE', // Move to last heard position and look around
    RACE: 'RACE'               // Sprint straight to can (player spotted)
};
```

### 3.2 State Transition Map

```
┌──────────┐
│  PATROL  │ ← Initial state
└──────────┘
     │
     │ [1] Player heard within effectiveRange
     ↓
┌──────────────┐
│ INVESTIGATE  │
└──────────────┘
     │
     ├─→ [2a] Investigation timeout (8s) → PATROL
     ├─→ [2b] Can't reach position (stuck 3x) → PATROL
     └─→ [2c] Player spotted during investigation → RACE
     │
     │ [3] Player spotted by vision during patrol
     ↓
┌──────────┐
│   RACE   │
└──────────┘
     │
     ├─→ [4a] Race lock expired + far from can (>6m) → PATROL
     ├─→ [4b] AI reaches can first (< 1.6m) → AI WINS
     └─→ [4c] Player reaches can → PLAYER WINS
```

### 3.3 State-Specific Behaviors

| State | Update Function | Behavior Description |
|-------|----------------|---------------------|
| PATROL | `updatePatrolBehavior()` | Orbit can using CanGuardStrategy, scan obstacles, wander with obstacle avoidance |
| INVESTIGATE | `updateInvestigateBehavior()` | Navigate to lastHeardPosition using arrive + avoidance, then look around |
| RACE | `updateRaceBehavior()` | Sprint directly to can at maxSpeedHunting (0.20), ignore player position |

### 3.4 State Persistence Fields (AIHunter component)

**Investigation-Specific**:
```javascript
lastHeardPosition: { x, z }     // Where player was heard (null if not investigating)
investigateStartTime: timestamp // When investigation started (for timeout)
investigateLookAroundTime: ms   // Time spent looking around at target
investigateStuckCount: number   // Failed unstuck attempts (give up at 3)
```

**Steering-Based Movement**:
```javascript
heading: radians               // Current facing direction (CRITICAL for rotation)
velocity: { x, z }            // Current velocity vector
currentSpeed: number          // Current actual speed (for acceleration)
```

**Patrol-Specific** (CanGuardStrategy):
```javascript
guardState: {
  orbitRadius: 4.5-7.5m (randomized per hunter)
  orbitAngle: radians (current position on orbit)
  scanTarget: radians (where AI is looking)
  scanTargetObstacle: ref (obstacle being examined)
  mode: 'ORBIT' | 'REPOSITION' | 'PAUSE' | 'INVESTIGATE'
  // ... many more randomized timing fields
}
```

---

## 4. MOVEMENT & ROTATION CONTROL

### 4.1 Rotation Control Architecture

**CRITICAL DISTINCTION**: The codebase uses TWO rotation representations:

1. **`aiComponent.heading`** (radians) - **PRIMARY CONTROL**
   - Source of truth for AI facing direction
   - Updated by steering behaviors (angular component)
   - Used for movement calculations (velocity direction)

2. **`transform.rotation.y`** (radians) - **VISUAL REPRESENTATION**
   - Synced FROM heading every frame
   - Drives 3D mesh rotation in renderer
   - Also drives vision cone rotation

**Synchronization Point** (investigate-behavior.js:106):
```javascript
transform.rotation.y = aiComponent.heading;  // Visual sync
```

### 4.2 Heading Update Flow

**During Investigation** (investigate-behavior.js:78-80):
```javascript
// Apply angular steering from combined behaviors
aiComponent.heading += combinedSteering.angular * dt;
aiComponent.heading = SteeringBehaviors.normalizeAngle(aiComponent.heading);
```

**Angular Steering Calculation** (steering-behaviors.js:23-28):
```javascript
function computeAngularSteering(currentHeading, targetHeading, maxAngularAccel) {
    let angleDiff = targetHeading - currentHeading;
    angleDiff = normalizeAngle(angleDiff);  // -π to π
    return Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), maxAngularAccel);
}
```

**Max Angular Acceleration** (ai-hunter.js:30):
```javascript
maxAngularAccel: 4.5  // rad/sec² (increased from 2.0)
```

### 4.3 Rotation Speed Analysis

**Time to rotate 180°**:
```
angleDiff = π radians (180°)
maxAngularAccel = 4.5 rad/sec²

At constant max acceleration:
time ≈ sqrt(2 * π / 4.5) ≈ 1.05 seconds

ACTUAL: Gradual, smooth rotation over ~1 second for 180° turn
```

**Time to rotate 90°** (more typical when hearing player):
```
angleDiff = π/2 radians (90°)
time ≈ sqrt(2 * π/2 / 4.5) ≈ 0.75 seconds
```

**ISSUE IDENTIFIED**: When player is heard, AI does NOT snap instantly to face the heard position. Instead, it rotates gradually via steering behaviors, which takes 0.5-1 seconds. This may feel unresponsive.

### 4.4 Vision Cone Rotation Sync

**Vision cone always matches transform.rotation.y** (movement-system.js:140-146):
```javascript
if (renderable.mesh.visionConeMesh) {
    renderable.mesh.visionConeMesh.position.set(transform.position.x, ...);
    renderable.mesh.visionConeMesh.rotation.y = transform.rotation.y;  // SYNC
}
```

**Dynamic Vision Updates** (ai-system.js:436-449):
- Vision range/angle calculated based on scanTarget distance
- Applied to visionCone component (range, angle)
- Visual cone geometry updated to match (movement-system.js:523-566)

---

## 5. OBSTACLE DETECTION & COLLISION

### 5.1 Static Collider Collection

**Collection Point**: `getStaticColliders()` (ai-system.js:307-318)

**Criteria**:
```javascript
collider.isStatic === true
collider.blockMovement === true
```

**Structure**:
```javascript
[
  { collider: ColliderComponent, transform: TransformComponent },
  { collider: ColliderComponent, transform: TransformComponent },
  ...
]
```

**Used By**:
- Obstacle avoidance (steering)
- Line-of-sight checks (vision)
- Investigation navigation
- Patrol navigation

### 5.2 Obstacle Avoidance Raycasting

**File**: `C:\Users\robert\egna-spel\Bollen-I-Burken\js\systems\ai\steering\obstacle-avoidance.js`

**Algorithm** (lines 28-86):
```
1. Raycast forward in heading direction
2. For each static collider:
   a. Calculate distance to obstacle
   b. Check if obstacle is ahead (dot product > 0.3 = 70° cone)
   c. Track closest obstacle
3. If obstacle within lookAhead distance:
   a. Calculate urgency = 1.0 - (distance/lookAhead), squared
   b. Calculate turn direction (left/right via cross product)
   c. Apply HARD angular steering (8.0x * panic)
   d. Apply perpendicular linear push (5.0x * panic)
```

**Detection Cone**: 70° in front (±35° from heading)
**LookAhead Distance**: 3.0 meters (during investigation)

### 5.3 Line-of-Sight Checks (Vision)

**File**: ai-system.js:528-575

**Algorithm**:
```
1. Get obstacles with blockVision flag
2. Calculate ray from AI to player
3. Step along ray (steps = distance * 2)
4. For each step:
   a. Check AABB collision with each obstacle
   b. If collision → return false (blocked)
5. If no collisions → return true (clear LOS)
```

**Used For**:
- Vision cone player detection
- Only checks obstacles with `blockVision: true`
- More precise than obstacle avoidance (uses AABB intersection)

### 5.4 Stuck Detection & Recovery

**Stuck Detection** (obstacle-avoidance.js:93-126):
```javascript
// Track actual position change per frame
actualMovement = distance(currentPos, lastPos)

// Stuck if trying to move but not moving
if (maxSpeed > 0.05 && actualMovement < 0.005) {
    stuckTimer += deltaTime
    if (stuckTimer > 150ms) {
        return true  // STUCK!
    }
}
```

**Unstuck Recovery** (obstacle-avoidance.js:131-153):
```javascript
1. Rotate 120-180° (random direction)
2. Reset stuck timer
3. Apply strong forward impulse (0.8 * maxSpeed)
```

**Investigation-Specific Handling**:
- Track `investigateStuckCount`
- Give up after 3 stuck attempts
- Return to PATROL state

---

## 6. DEBUG LOGGING ANALYSIS

### 6.1 Hearing-Related Logs

| Location | Type | Message | Frequency | Purpose |
|----------|------|---------|-----------|---------|
| ai-system.js:159 | console.log | "🎧 Hearing Check: Distance=X, EffectiveRange=X, PlayerSpeed=X, SoundLevel=X" | Throttled (1/sec) | Monitor hearing detection calculations |
| ai-system.js:182 | console.log | "🚨 AI HEARD PLAYER at distance Xm! Going to investigate at (X, Y)" | Event | Announce investigation start |
| ai-system.js:187 | console.log | "🔄 AI updated investigation target to (X, Y)" | Event | Continuous hearing updates |
| ai-system.js:190 | console.log | "🎧 AI hears player but is in X state (can't investigate)" | Event | Debug state-based blocking |

### 6.2 Investigation-Related Logs

| Location | Type | Message | Frequency | Purpose |
|----------|------|---------|-----------|---------|
| investigate-behavior.js:44 | Utils.log | "🔍 Can't reach heard position after 3 attempts, giving up investigation" | Event | Investigation failure |
| investigate-behavior.js:52 | Utils.log | "🔍 Investigation unstuck (attempt X/3)" | Event | Stuck recovery tracking |
| investigate-behavior.js:128 | Utils.log | "🔍 Investigation complete. Returning to patrol." | Event | Investigation timeout |

### 6.3 Obstacle Avoidance Logs

| Location | Type | Message | Frequency | Purpose |
|----------|------|---------|-----------|---------|
| obstacle-avoidance.js:82 | console.log | "[AVOID] Distance: Xm, Turn: LEFT/RIGHT, Urgency: X" | Conditional (panic>0.5) | High-urgency avoidance |
| obstacle-avoidance.js:118 | console.log | "[UNSTUCK] Stuck Xms, movement: X" | Event | Stuck detection trigger |
| obstacle-avoidance.js:132 | console.log | "[UNSTUCK] Executing emergency escape" | Event | Unstuck execution |

### 6.4 Recommendations for Log Cleanup

**Essential Logs (KEEP)**:
- Investigation start/stop events (🚨, 🔍)
- Stuck detection and recovery (critical for debugging navigation)
- High-urgency obstacle avoidance (panic > 0.5)

**Debugging Noise (REMOVE or CONDITIONAL)**:
- Hearing check throttled log (line 159) - too frequent, remove after testing
- "AI hears player but is in X state" (line 190) - only needed during development
- Guard patrol mode changes (can-guard-strategy.js) - verbose, make conditional

**Missing Logs (ADD)**:
- Instant rotation execution (if implemented)
- Corner detection triggers (if implemented)
- Failed investigation attempts with detailed reason

---

## 7. KEY SYMBOLS & RELATIONSHIPS

### 7.1 Core Classes & Files

```
AISystem (ai-system.js)
  ├─→ manages Set<hunters>
  ├─→ calls updateHearing() [ENTRY: Hearing Detection]
  ├─→ calls updateInvestigateBehavior() [ENTRY: Investigation]
  ├─→ calls updatePatrolBehavior() [ENTRY: Patrol]
  ├─→ calls updateRaceBehavior() [ENTRY: Race]
  └─→ uses getStaticColliders() [Provides obstacle data]

InvestigateBehavior (investigate-behavior.js)
  ├─→ updateInvestigateBehavior() [MAIN: Investigation Logic]
  ├─→ uses SteeringBehaviors.arrive()
  ├─→ uses ObstacleAvoidance.computeObstacleAvoidance()
  ├─→ uses ObstacleAvoidance.isStuckOnWall()
  └─→ uses ObstacleAvoidance.unstuck()

SteeringBehaviors (steering-behaviors.js)
  ├─→ arrive(ai, targetPos, currentPos, slowRadius)
  ├─→ seek(ai, targetPos, currentPos)
  ├─→ wander(ai, deltaTime)
  ├─→ flee(ai, threatPos, currentPos)
  ├─→ combineSteeringBehaviors(behaviors[])
  └─→ computeAngularSteering() [CRITICAL: Rotation calculation]

ObstacleAvoidance (obstacle-avoidance.js)
  ├─→ computeObstacleAvoidance(transform, ai, colliders, lookAhead)
  ├─→ isStuckOnWall(ai, transform, deltaTime)
  └─→ unstuck(ai) [Emergency rotation]

CanGuardStrategy (can-guard-strategy.js)
  └─→ computeCanGuardPatrol(ai, transform, canPos, dt, obstacles)

AIHunter Component (ai-hunter.js)
  ├─→ state: 'PATROL' | 'INVESTIGATE' | 'RACE'
  ├─→ heading: radians [PRIMARY rotation control]
  ├─→ velocity: {x, z}
  ├─→ lastHeardPosition: {x, z} [Investigation target]
  ├─→ investigateStartTime, investigateLookAroundTime, investigateStuckCount
  └─→ guardState: {...} [Patrol behavior state]

MovementSystem (movement-system.js)
  ├─→ playerCurrentSpeed [Used by hearing detection]
  ├─→ isSneaking [Used by hearing detection]
  ├─→ updatePlayerMovement()
  ├─→ updateAIMovement()
  └─→ checkObstacleCollision()

AudioSystem (audio-system.js)
  ├─→ sneakVolumeMultiplier [Used by hearing detection]
  ├─→ playFootstep()
  └─→ updateFootsteps()
```

### 7.2 Data Flow: Hearing → Investigation

```
MovementSystem.playerCurrentSpeed ─┐
MovementSystem.isSneaking ─────────┼─→ AISystem.updateHearing()
AudioSystem.sneakVolumeMultiplier ─┘         │
                                              ↓
                                    [Calculate soundLevel & effectiveRange]
                                              │
                                              ↓
                                    [Check distance <= effectiveRange]
                                              │
                                              ↓ (TRUE)
                                    [Set state = INVESTIGATE]
                                    [Store lastHeardPosition]
                                              │
                                              ↓ (Next frame)
                                    AISystem.updateInvestigateBehavior()
                                              │
                                              ↓
                        InvestigateBehavior.updateInvestigateBehavior()
                                              │
                        ┌─────────────────────┴─────────────────────┐
                        ↓                                           ↓
            SteeringBehaviors.arrive()              ObstacleAvoidance.computeObstacleAvoidance()
                        ↓                                           ↓
                        └─────────────────────┬─────────────────────┘
                                              ↓
                            SteeringBehaviors.combineSteeringBehaviors()
                                              │
                                              ↓
                            [Update aiComponent.heading] ← GRADUAL ROTATION
                            [Update aiComponent.velocity]
                                              │
                                              ↓
                            [Sync transform.rotation.y = heading]
                            [Sync transform.velocity = velocity]
```

### 7.3 Component Dependencies Graph

```
AIHunter Component
  ├─→ REQUIRES: Transform (position, rotation, velocity)
  ├─→ REQUIRES: Movement (legacy, minimal use)
  ├─→ OPTIONAL: VisionCone (for vision checks)
  └─→ USES: Collider (via getStaticColliders)

Transform Component
  ├─→ position: {x, y, z}
  ├─→ rotation: {y: radians} [Visual rotation, synced FROM heading]
  ├─→ velocity: {x, y, z} [Applied by MovementSystem]
  └─→ previousPosition: {x, y, z} [For collision resolution]
```

---

## 8. ISSUES & IMPROVEMENT OPPORTUNITIES

### 8.1 Critical Issues

**ISSUE #1: No Instant Rotation on Hearing**
- **Location**: ai-system.js:177-183 (state transition)
- **Problem**: When AI hears player, it starts investigation but continues facing current direction. Rotation happens gradually via steering behaviors.
- **Impact**: AI appears unaware/unresponsive for 0.5-1 seconds while turning
- **Player Experience**: "AI heard me but didn't react immediately"

**ISSUE #2: No Corner Detection**
- **Location**: None (feature missing)
- **Problem**: AI navigates using steering + avoidance but has no concept of "corners" or "peek around obstacles"
- **Impact**: AI may walk into obstacle repeatedly if heard position is directly behind it
- **Mitigation**: Stuck detection (3 attempts) prevents infinite loops, but wastes time

**ISSUE #3: Hearing Debug Log Spam**
- **Location**: ai-system.js:158-161 (throttled to 1/sec, but still spam)
- **Problem**: Console log every second during gameplay
- **Impact**: Performance negligible, but clutters console during debugging other issues

### 8.2 Architectural Strengths

**STRENGTH #1: Clean Separation of Concerns**
- Hearing detection: AISystem
- Navigation: InvestigateBehavior
- Steering math: SteeringBehaviors module
- Obstacle detection: ObstacleAvoidance module
- Very modular and maintainable

**STRENGTH #2: Robust Stuck Detection**
- Tracks actual position change (not just velocity)
- Fast trigger (150ms)
- Graceful degradation (give up after 3 attempts)

**STRENGTH #3: Dynamic Hearing Range**
- Scales with player speed (realistic sound propagation)
- Integrates sneaking state (consistent with audio volume)
- Tweakable via TweakPanel

---

## 9. RECOMMENDATIONS

### 9.1 Instant Rotation Implementation

**WHERE TO ADD**: ai-system.js:177 (immediately after state transition to INVESTIGATE)

**Proposed Code**:
```javascript
if (aiComponent.state !== AI_STATES.INVESTIGATE) {
    aiComponent.state = AI_STATES.INVESTIGATE;
    aiComponent.investigateStartTime = Date.now();
    aiComponent.investigateLookAroundTime = 0;
    aiComponent.investigateStuckCount = 0;

    // INSTANT SNAP ROTATION TO HEARD POSITION
    const dx = playerTransform.position.x - aiTransform.position.x;
    const dz = playerTransform.position.z - aiTransform.position.z;
    const targetHeading = Math.atan2(dx, dz);
    aiComponent.heading = targetHeading;  // Instant snap
    transform.rotation.y = targetHeading;  // Sync visual immediately

    console.log(`🚨 AI HEARD PLAYER at distance ${distance.toFixed(2)}m! INSTANT ROTATION + Going to investigate`);
    Utils.log(`🚨 AI state changed: ${aiComponent.state}`);
}
```

**Impact**:
- AI immediately faces heard position
- Feels more responsive and aware
- Still uses gradual steering for subsequent adjustments during navigation

### 9.2 Corner Detection (Advanced)

**WHERE TO ADD**: New module `js/systems/ai/corner-detection.js`

**Concept**:
1. When investigating, raycast from AI to heard position
2. If obstacle blocking direct path, identify obstacle edges (corners)
3. Add waypoint at corner + 1m clearance
4. Navigate to waypoint first, then to heard position
5. "Peek" around corner by looking toward heard position while at waypoint

**Integration Point**: investigate-behavior.js:64 (before arrive steering)

**Complexity**: HIGH (requires obstacle edge detection, pathfinding)

**Alternative (Simpler)**:
- If stuck on same obstacle 2x, add random offset waypoint (±3m perpendicular to heading)
- Navigate to waypoint, then resume investigation
- Much simpler than full corner detection

### 9.3 Debug Log Cleanup

**Remove Entirely**:
- ai-system.js:159 (hearing check throttled log) - only useful during initial testing
- can-guard-strategy.js:78,85,90,98,104 (mode change logs) - too verbose

**Make Conditional (global.DEBUG flag)**:
- ai-system.js:190 (state blocking log)
- obstacle-avoidance.js:82 (avoidance urgency log)

**Keep Always**:
- All investigation event logs (start, update, complete, give up)
- All stuck detection/recovery logs (critical for navigation debugging)

### 9.4 Heading vs Rotation Clarification

**Current Issue**: Two rotation representations (heading vs transform.rotation.y) can cause confusion

**Recommendation**: Add comment header to ai-hunter.js clarifying:
```javascript
// ROTATION SYSTEM:
// - aiComponent.heading (radians): PRIMARY control, updated by steering behaviors
// - transform.rotation.y (radians): VISUAL sync, always set to heading
// - DO NOT set transform.rotation.y directly (will be overwritten by heading)
```

### 9.5 State Machine Visualization Tool

**Recommendation**: Add debug command to visualize current AI state

**Implementation** (debug-commands.js):
```javascript
window.debugAIState = function() {
    const hunters = window.aiSystem.getHunters();
    hunters.forEach((hunter, i) => {
        const ai = hunter.getComponent('AIHunter');
        const transform = hunter.getComponent('Transform');
        console.log(`Hunter ${i}:`, {
            state: ai.state,
            heading: (ai.heading * 180 / Math.PI).toFixed(1) + '°',
            position: `(${transform.position.x.toFixed(1)}, ${transform.position.z.toFixed(1)})`,
            lastHeardPos: ai.lastHeardPosition,
            investigateTime: ai.investigateStartTime ? Date.now() - ai.investigateStartTime : null
        });
    });
};
```

---

## 10. SUMMARY & NEXT STEPS

### 10.1 Complete File List (By Role)

**Core AI System**:
- `C:\Users\robert\egna-spel\Bollen-I-Burken\js\systems\ai\ai-system.js` (main system, hearing detection, state management)
- `C:\Users\robert\egna-spel\Bollen-I-Burken\js\core\components\ai-hunter.js` (component, state machine fields)

**Investigation Behavior**:
- `C:\Users\robert\egna-spel\Bollen-I-Burken\js\systems\ai\behaviors\investigate-behavior.js` (navigation to heard position)

**Steering & Navigation**:
- `C:\Users\robert\egna-spel\Bollen-I-Burken\js\systems\ai\steering\steering-behaviors.js` (arrive, seek, wander, flee)
- `C:\Users\robert\egna-spel\Bollen-I-Burken\js\systems\ai\steering\obstacle-avoidance.js` (raycast, stuck detection, unstuck)
- `C:\Users\robert\egna-spel\Bollen-I-Burken\js\systems\ai\steering\can-guard-strategy.js` (patrol behavior)

**Supporting Systems**:
- `C:\Users\robert\egna-spel\Bollen-I-Burken\js\systems\movement-system.js` (player speed tracking, collision resolution)
- `C:\Users\robert\egna-spel\Bollen-I-Burken\js\systems\audio\audio-system.js` (sneak volume multiplier, footstep timing)
- `C:\Users\robert\egna-spel\Bollen-I-Burken\js\systems\ai\dynamic-vision.js` (vision cone adaptation, not directly related to hearing)

**Core Components**:
- `C:\Users\robert\egna-spel\Bollen-I-Burken\js\core\components\transform.js` (position, rotation, velocity)
- `C:\Users\robert\egna-spel\Bollen-I-Burken\js\core\components\hearing.js` (legacy component, NOT USED - hearing logic is in AISystem)

### 10.2 Priority Action Items

**HIGH PRIORITY (Immediate Feel Improvement)**:
1. Add instant rotation on hearing (Section 9.1) - 15 minutes
2. Remove hearing debug log spam (Section 9.3) - 5 minutes

**MEDIUM PRIORITY (Polish)**:
3. Add debug state visualization command (Section 9.5) - 20 minutes
4. Add rotation system comment header (Section 9.4) - 5 minutes

**LOW PRIORITY (Advanced Features)**:
5. Implement simple waypoint offset for stuck situations (Section 9.2 alternative) - 1-2 hours
6. Full corner detection system (Section 9.2 full) - 4-8 hours

### 10.3 Testing Checklist

After implementing instant rotation:
- [ ] AI snaps to face player immediately when heard (visual confirmation)
- [ ] AI still navigates smoothly using steering (no jitter)
- [ ] Vision cone rotates with heading (stays synced)
- [ ] Investigation completes successfully (reaches position, looks around, returns to patrol)
- [ ] Stuck detection still works (AI gives up after 3 failed attempts)
- [ ] State transitions work correctly (PATROL → INVESTIGATE → PATROL or RACE)

---

**END OF ANALYSIS**

This analysis provides a complete map of all code paths related to AI hearing and investigation. Use this as a reference document for implementing instant rotation and corner detection features.
