# 🤖 GUBBAR OVERHAUL PLAN
**Project**: Bollen-I-Burken Character Physics Upgrade
**Goal**: Transform simple box characters into articulated ragdoll characters with physics
**Physics Engine**: Cannon-es (https://github.com/pmndrs/cannon-es)
**Date Created**: 2025-10-04

---

## 📋 TABLE OF CONTENTS
1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Vision: The New GUBBAR](#vision-the-new-gubbar)
4. [Three-Phase Implementation Plan](#three-phase-implementation-plan)
5. [Technical Architecture](#technical-architecture)
6. [File Changes Required](#file-changes-required)
7. [Testing Strategy](#testing-strategy)
8. [Risks & Mitigation](#risks--mitigation)

---

## Update Log

### 2025-10-04 - Phase 1 Static Collision Pass In Progress
- Walls and obstacle meshes now spawn matching `CANNON.Body` statics, but player/AI still pass through them during playtests.
- Suspect causes: static bodies may not be registering with the global `physicsSystem` or collision filters (groups/masks) prevent player contacts.
- Next steps:
  - Inspect the physics world during runtime (`physicsSystem.getWorld().world.bodies`) to confirm static bodies are present.
  - Log the collision filter values for player vs wall/obstacle to ensure masks overlap.
  - Verify Cannon bodies mirror the obstacle positions and Y offsets (center vs base).
- Once resolved, re-run a round to confirm characters collide properly and update this log with the fix status.

### 2025-10-04 - Phase 1 Collision Migration Planned
- Next focus: move arena walls, floor, and obstacles onto Cannon static bodies so the physics world handles every collision.
- Reuse existing obstacle dimensions and spawn logic from arena builders; just add `BodyFactory.createStaticBox` calls and register with `physicsSystem`.
- After static bodies are in, delete or hard-disable the old AABB fallback paths in `movement-system.js` to complete Phase 1�s "replace collision system" objective.
- Validation checklist:
  - Player/AI collide with walls/obstacles solely via Cannon bodies.
  - Legacy collider code removed/guarded without regressions.
  - Physics performance still holds 60 FPS with current obstacle counts.
### 2025-10-04 � AI Hunter Physics Sync Stabilized
- Observed hunter twitching, stalling, or exploding at spawn due to mixed time units between the ECS tick loop and Cannon step.
- Root cause: MovementSystem wrote per-tick velocities straight into Cannon bodies while PhysicsSync read per-second velocities back, and PhysicsSystem stepped the world with millisecond deltas. The unit mismatch starved the hunter of forward speed and occasionally caused solver explosions.
- Fix applied: scale velocities when crossing the ECS/physics boundary (MovementSystem & PhysicsSync) and convert tick delta to seconds before stepping Cannon. All updates respect CONFIG.physics.timeStep so future tuning stays centralized.
- Result: Hunter resumes smooth patrol/chase behaviour with consistent speeds and no launch glitches.
## ?YZ? EXECUTIVE SUMMARY

### Current Problem
- Characters are **simple boxes** (0.8x1.0x0.8 units)
- **No physics engine** - custom AABB collision only
- Characters feel **static and lifeless**
- No ragdoll physics, falling, or dynamic movement
- Hard to distinguish player from AI visually

### Solution
Add **cannon-es physics engine** to create **articulated characters** with:
- ✅ **Head, torso, arms, and legs** connected by joints
- ✅ **Realistic physics** (balance, falling, stumbling)
- ✅ **Ragdoll effects** when caught or colliding
- ✅ **Joint constraints** for realistic movement limits
- ✅ **Motor forces** for active movement control
- ✅ **Visual appeal** - characters that feel alive!

### Impact
**Gameplay**: More engaging, physics-based hide-and-seek
**Visual**: Park setting with human-like characters
**Technical**: Modern physics engine replaces custom collision
**Future**: Foundation for animations, different character types

---

## 🔍 CURRENT STATE ANALYSIS
*Based on Serena's codebase analysis*

### Current Character Structure

#### Player Character
```javascript
// File: js/managers/player-factory.js
const geometry = new THREE.BoxGeometry(0.8, 1.0, 0.8);
const material = new THREE.MeshLambertMaterial({
    color: 0x00ff00,  // Green
    transparent: true,
    opacity: 0.9
});
```
- **Shape**: Single box primitive
- **Size**: 0.8m wide, 1.0m tall, 0.8m deep
- **Material**: Basic Lambert (no physics)
- **Position**: Static at Y=0.5

#### AI Hunter
```javascript
// File: js/managers/player-manager.js
const geometry = new THREE.BoxGeometry(0.9, 1.1, 0.9);
const material = new THREE.MeshLambertMaterial({ color: 0xff4444 });
```
- **Shape**: Slightly larger box
- **Size**: 0.9m wide, 1.1m tall
- **Additional**: Vision cone + hearing circle meshes

### Current Movement System
**File**: `js/systems/movement-system.js`

**Player Movement**:
- Acceleration-based (builds velocity over time)
- Drift mechanics (momentum when changing direction)
- Sneaking mode (reduced speed)
- Custom friction/deceleration

**Collision Detection**:
- Custom AABB (Axis-Aligned Bounding Box)
- Slide response for wall collision
- Arena boundary clamping
- NO physics engine

**AI Movement**:
- Steering behaviors (seek, flee, wander)
- Obstacle avoidance
- Can-guard orbit strategy
- Direct velocity manipulation

### ECS Architecture
```
Entity (Player/AI)
 ├─ Transform      (position, rotation, velocity) ← Source of truth
 ├─ Player/AIHunter (state, score, behavior)
 ├─ Movement       (speed, acceleration, friction)
 ├─ Renderable     (THREE.Mesh reference)
 └─ Collider       (AABB bounds, collision response)
```

**Key Insight**: Transform component is the **source of truth**. Systems directly modify `transform.position` and `transform.velocity`.

### Files Involved in Character System
**Total**: ~15 core files

**Critical Files**:
1. `js/managers/player-factory.js` - Creates player mesh + entity
2. `js/managers/player-manager.js` - Manages all players/AI
3. `js/systems/movement-system.js` - Movement + collision (425 lines)
4. `js/systems/ai/ai-system.js` - AI behavior
5. `js/core/components/transform.js` - Position/rotation/velocity
6. `js/core/components/collider.js` - AABB collision detection
7. `js/core/components/renderable.js` - Links mesh to entity

---

## 🌟 VISION: THE NEW GUBBAR

### Character Design Concept

```
         ⚫ HEAD (sphere, 0.3m diameter)
          |
    ━━━━━━┻━━━━━━  SHOULDERS
    |           |
   ARM        ARM   (cylinders, 0.5m each)
    |           |
  ELBOW      ELBOW
    |           |
  FOREARM   FOREARM (cylinders, 0.4m)

    ┃ TORSO ┃       (box, 0.4x0.6x0.3m)

    ┃ PELVIS┃       (box, 0.35x0.25x0.3m)

    |           |
   LEG        LEG   (cylinders, 0.45m thigh)
    |           |
   KNEE      KNEE
    |           |
   SHIN      SHIN   (cylinders, 0.4m)
    |           |
   FOOT      FOOT   (small boxes)
```

### Body Parts Breakdown

| Part | Shape | Size | Mass | Color |
|------|-------|------|------|-------|
| **Head** | Sphere | r=0.15m | 4.5 kg | Player: Green / AI: Red |
| **Torso** | Box | 0.4×0.6×0.3m | 25 kg | Lighter shade |
| **Pelvis** | Box | 0.35×0.25×0.3m | 10 kg | Mid tone |
| **Upper Arm** | Cylinder | 0.1×0.45m | 2 kg | Match torso |
| **Forearm** | Cylinder | 0.08×0.4m | 1.5 kg | Match torso |
| **Thigh** | Cylinder | 0.12×0.45m | 5 kg | Match pelvis |
| **Shin** | Cylinder | 0.1×0.4m | 3 kg | Match pelvis |
| **Foot** | Box | 0.15×0.1×0.25m | 1 kg | Darker |

**Total Mass**: ~70 kg (realistic human weight)

### Joint Constraints

| Joint | Type | Body A | Body B | Limits |
|-------|------|--------|--------|--------|
| **Neck** | ConeTwist | Head | Torso | ±30° tilt, 60° rotation |
| **Spine** | Hinge | Torso | Pelvis | ±20° forward/back |
| **Shoulder** | ConeTwist | Torso | Upper Arm | ±90° all axes |
| **Elbow** | Hinge | Upper Arm | Forearm | 0° to 150° |
| **Hip** | ConeTwist | Pelvis | Thigh | ±45° all axes |
| **Knee** | Hinge | Thigh | Shin | 0° to 135° |
| **Ankle** | Hinge | Shin | Foot | ±20° |

### Visual Appearance
- **Player**: Bright green gradient (head lighter, legs darker)
- **AI Hunter**: Red/orange gradient (menacing look)
- **Material**: MeshStandardMaterial (better shading than Lambert)
- **Textures**: Optional colored patterns from Kenney textures
- **Effects**: Subtle glow/outline when detected

---

## 🚀 THREE-PHASE IMPLEMENTATION PLAN

### 📦 PHASE 1: FOUNDATION (RECOMMENDED START)
**Duration**: 2-3 days
**Risk**: Low
**Goal**: Replace collision system with cannon-es physics

#### Objectives
1. ✅ Add cannon-es library to project
2. ✅ Create PhysicsSystem (new ECS system)
3. ✅ Add PhysicsBody component
4. ✅ Replace AABB collision with physics world
5. ✅ Keep box characters (no visual changes yet)
6. ✅ Validate physics works with existing gameplay

#### Files to Create
- `js/systems/physics/physics-system.js` (NEW)
- `js/core/components/physics-body.js` (NEW)
- `js/systems/physics/collision-filters.js` (NEW)

#### Files to Modify
- `index.html` - Add cannon-es CDN
- `js/main.js` - Initialize PhysicsSystem
- `js/core/config.js` - Add physics config section
- `js/systems/movement-system.js` - Remove collision code
- `js/managers/player-factory.js` - Add physics body to player
- `js/managers/player-manager.js` - Add physics body to AI

#### Success Criteria
- ✅ Game runs at 60 FPS with physics
- ✅ Characters collide with obstacles using physics
- ✅ Movement feels similar to current system
- ✅ AI hunters patrol normally
- ✅ No crashes or performance issues

---

### 🤸 PHASE 2: SIMPLE ARTICULATED CHARACTERS
**Duration**: 1-2 weeks
**Risk**: Medium
**Goal**: Multi-part characters with basic joints

#### Objectives
1. ✅ Create CharacterBuilder module
2. ✅ Build 5-part ragdoll (head, torso, pelvis, 2 legs)
3. ✅ Add joint constraints (neck, spine, hips, knees)
4. ✅ Update Renderable for multi-mesh characters
5. ✅ Implement upright balance controller
6. ✅ Test ragdoll falls when AI catches player

#### Files to Create
- `js/managers/character/character-builder.js` (NEW)
- `js/managers/character/character-rig.js` (NEW)
- `js/systems/physics/balance-controller.js` (NEW)
- `js/systems/physics/motor-controller.js` (NEW)

#### Files to Modify
- `js/core/components/renderable.js` - Support mesh groups
- `js/managers/player-factory.js` - Use CharacterBuilder
- `js/managers/player-manager.js` - Update AI creation
- `js/systems/movement-system.js` - Apply forces, not positions
- `js/systems/ai/ai-system.js` - Use motor controller

#### Character Structure (Phase 2)
```javascript
// 5-part simplified character
parts = {
    head: CANNON.Sphere (radius: 0.15),
    torso: CANNON.Box (0.4×0.6×0.3),
    pelvis: CANNON.Box (0.35×0.25×0.3),
    leftLeg: CANNON.Cylinder (0.1×0.85),
    rightLeg: CANNON.Cylinder (0.1×0.85)
}

joints = {
    neck: ConeTwist (head ↔ torso),
    spine: Hinge (torso ↔ pelvis),
    leftHip: ConeTwist (pelvis ↔ leftLeg),
    rightHip: ConeTwist (pelvis ↔ rightLeg)
}
```

#### Success Criteria
- ✅ Characters have visible head/torso/legs
- ✅ Joints move realistically (no weird bending)
- ✅ Characters stay upright while walking
- ✅ Ragdoll falls when caught/colliding
- ✅ Performance remains 60 FPS

---

### 🎪 PHASE 3: FULL RAGDOLL + ARMS
**Duration**: 2-3 weeks
**Risk**: High
**Goal**: Complete articulated character with all limbs

#### Objectives
1. ✅ Add arms (shoulders, elbows, hands)
2. ✅ Add feet with ankle joints
3. ✅ Implement IK (inverse kinematics) for feet
4. ✅ Add procedural walk cycle
5. ✅ Fine-tune all joint limits and damping
6. ✅ Create "get up from ragdoll" animation
7. ✅ Add motor strength parameters to config

#### Files to Create
- `js/systems/animation/ik-solver.js` (NEW)
- `js/systems/animation/walk-cycle.js` (NEW)
- `js/systems/animation/ragdoll-recovery.js` (NEW)

#### Files to Modify
- `js/managers/character/character-builder.js` - 11-part full body
- `js/managers/character/character-rig.js` - All joints
- `js/core/config.js` - Add motor/IK parameters

#### Character Structure (Phase 3)
```javascript
// 11-part full character
parts = {
    head, torso, pelvis,
    leftUpperArm, leftForearm,
    rightUpperArm, rightForearm,
    leftThigh, leftShin, leftFoot,
    rightThigh, rightShin, rightFoot
}

joints = {
    neck, spine,
    leftShoulder, leftElbow,
    rightShoulder, rightElbow,
    leftHip, leftKnee, leftAnkle,
    rightHip, rightKnee, rightAnkle
}
```

#### Success Criteria
- ✅ Full ragdoll with arms and feet
- ✅ Natural walking animation
- ✅ Feet stay planted on ground (IK)
- ✅ Smooth ragdoll-to-standing recovery
- ✅ Configurable motor strength
- ✅ Still 60 FPS performance

---

## 🏗️ TECHNICAL ARCHITECTURE

### New System: PhysicsSystem

```javascript
// File: js/systems/physics/physics-system.js

class PhysicsSystem extends System {
    constructor() {
        super('physics');
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);

        // Optimize for game performance
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.solver.iterations = 10;
        this.world.defaultContactMaterial.friction = 0.4;

        // Fixed timestep for stability
        this.fixedTimeStep = 1.0 / 60.0;
        this.maxSubSteps = 3;

        Utils.log('PhysicsSystem initialized with cannon-es');
    }

    update(gameState, deltaTime) {
        // Step physics world
        this.world.step(this.fixedTimeStep, deltaTime, this.maxSubSteps);

        // Sync ECS Transform from PhysicsBody
        for (const entity of gameState.entities.values()) {
            const physicsBody = entity.getComponent('PhysicsBody');
            const transform = entity.getComponent('Transform');

            if (physicsBody && transform) {
                // Physics body is source of truth
                transform.position.copy(physicsBody.body.position);
                transform.velocity.copy(physicsBody.body.velocity);

                // Convert quaternion to euler Y rotation
                const euler = new THREE.Euler().setFromQuaternion(
                    new THREE.Quaternion(
                        physicsBody.body.quaternion.x,
                        physicsBody.body.quaternion.y,
                        physicsBody.body.quaternion.z,
                        physicsBody.body.quaternion.w
                    )
                );
                transform.rotation.y = euler.y;
            }
        }
    }

    addBody(body) {
        this.world.addBody(body);
    }

    removeBody(body) {
        this.world.removeBody(body);
    }
}
```

### New Component: PhysicsBody

```javascript
// File: js/core/components/physics-body.js

class PhysicsBody {
    constructor(body, options = {}) {
        this.name = 'PhysicsBody';
        this.body = body;  // CANNON.Body instance
        this.isKinematic = options.isKinematic || false;
        this.collisionGroup = options.collisionGroup || 1;
        this.collisionMask = options.collisionMask || -1;
    }

    applyForce(force, worldPoint) {
        this.body.applyForce(
            new CANNON.Vec3(force.x, force.y, force.z),
            worldPoint || this.body.position
        );
    }

    applyImpulse(impulse, worldPoint) {
        this.body.applyImpulse(
            new CANNON.Vec3(impulse.x, impulse.y, impulse.z),
            worldPoint || this.body.position
        );
    }

    setVelocity(velocity) {
        this.body.velocity.set(velocity.x, velocity.y, velocity.z);
    }
}
```

### Character Builder Architecture

```javascript
// File: js/managers/character/character-builder.js

class CharacterBuilder {
    static createSimpleRagdoll(physicsWorld, position, isAI = false) {
        const scale = 1.0;
        const color = isAI ? 0xff4444 : 0x00ff00;

        // Create body parts (physics + visual)
        const parts = {
            head: this.createHead(position, scale, color),
            torso: this.createTorso(position, scale, color),
            pelvis: this.createPelvis(position, scale, color),
            leftLeg: this.createLeg(position, scale, color, 'left'),
            rightLeg: this.createLeg(position, scale, color, 'right')
        };

        // Add physics bodies to world
        Object.values(parts).forEach(part => {
            physicsWorld.addBody(part.body);
        });

        // Create joints
        const joints = this.createJoints(parts, physicsWorld);

        return { parts, joints };
    }

    static createHead(position, scale, color) {
        const radius = 0.15 * scale;

        // Physics shape
        const shape = new CANNON.Sphere(radius);
        const body = new CANNON.Body({
            mass: 4.5,
            shape: shape,
            position: new CANNON.Vec3(
                position.x,
                position.y + 1.4 * scale,
                position.z
            ),
            linearDamping: 0.1,
            angularDamping: 0.1
        });

        // Visual mesh
        const geometry = new THREE.SphereGeometry(radius, 16, 16);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.7,
            metalness: 0.1
        });
        const mesh = new THREE.Mesh(geometry, material);

        return { body, mesh };
    }

    // Similar methods for torso, pelvis, legs, arms...

    static createJoints(parts, physicsWorld) {
        const joints = {};

        // Neck (head to torso)
        joints.neck = new CANNON.ConeTwistConstraint(
            parts.head.body,
            parts.torso.body,
            {
                pivotA: new CANNON.Vec3(0, -0.15, 0),
                pivotB: new CANNON.Vec3(0, 0.3, 0),
                axisA: new CANNON.Vec3(0, 1, 0),
                axisB: new CANNON.Vec3(0, 1, 0),
                angle: Math.PI / 6,  // 30 degree cone
                twistAngle: Math.PI / 3,  // 60 degree twist
                maxForce: 1e6,
                collideConnected: false
            }
        );
        physicsWorld.addConstraint(joints.neck);

        // More joints...

        return joints;
    }
}
```

### Data Flow with Physics

#### Before (Current):
```
Input → MovementSystem → Transform.position
                       → Custom AABB Collision
                       → Slide Response
                       → Transform.position (corrected)
                       → Renderable.mesh.position
```

#### After (With Physics):
```
Input → MotorController → PhysicsBody.applyForce()
                        → CANNON.World.step()
                        → PhysicsBody.body.position
                        → Transform.position (sync)
                        → Renderable.mesh.position
```

**Key Change**: Physics engine owns position, ECS syncs FROM physics

---

## 📂 FILE CHANGES REQUIRED

### Phase 1: Foundation Files

#### New Files (3)
```
js/systems/physics/
  ├── physics-system.js          (~150 lines) - Main physics loop
  ├── collision-filters.js       (~50 lines)  - Group/mask definitions
  └── README.md                   (docs)       - Physics config guide

js/core/components/
  └── physics-body.js             (~80 lines)  - Physics body component
```

#### Modified Files (6)
```
index.html                        - Add cannon-es CDN script
js/main.js                        - Initialize PhysicsSystem
js/core/config.js                 - Add physics configuration
js/systems/movement-system.js     - Remove collision code (~100 lines deleted)
js/managers/player-factory.js     - Add physics body creation
js/managers/player-manager.js     - Add physics body to AI
```

### Phase 2: Articulated Characters

#### New Files (4)
```
js/managers/character/
  ├── character-builder.js        (~300 lines) - Create ragdoll parts
  ├── character-rig.js            (~200 lines) - Define all joints
  └── character-visuals.js        (~150 lines) - Mesh creation/materials

js/systems/physics/
  ├── balance-controller.js       (~120 lines) - Keep upright
  └── motor-controller.js         (~150 lines) - Apply movement forces
```

#### Modified Files (5)
```
js/core/components/renderable.js  - Support mesh groups
js/managers/player-factory.js     - Use CharacterBuilder
js/managers/player-manager.js     - Create articulated AI
js/systems/movement-system.js     - Use motor controller
js/systems/ai/ai-system.js        - Physics-based AI movement
```

### Phase 3: Full Ragdoll

#### New Files (3)
```
js/systems/animation/
  ├── ik-solver.js                (~200 lines) - Inverse kinematics
  ├── walk-cycle.js               (~180 lines) - Procedural walking
  └── ragdoll-recovery.js         (~150 lines) - Stand up from fall
```

#### Modified Files (3)
```
js/managers/character/character-builder.js - 11-part full body
js/managers/character/character-rig.js     - All 11 joints
js/core/config.js                          - Motor/IK parameters
```

---

## 🧪 TESTING STRATEGY

### Phase 1 Testing (Foundation)

#### Unit Tests
- [ ] PhysicsSystem initializes CANNON.World
- [ ] PhysicsBody component wraps CANNON.Body
- [ ] Collision detection works (box vs box, box vs obstacle)
- [ ] Transform syncs correctly from physics body

#### Integration Tests
- [ ] Player can move with physics (WASD controls)
- [ ] AI hunters patrol with physics
- [ ] Obstacles block movement
- [ ] Arena walls contain characters
- [ ] No penetration or tunneling

#### Performance Tests
- [ ] Maintain 60 FPS with 1 player + 2 AI + 40 obstacles
- [ ] Physics world step < 5ms per frame
- [ ] Memory usage stable (no leaks)

### Phase 2 Testing (Articulated)

#### Visual Tests
- [ ] Character parts render correctly
- [ ] Joints connect body parts visually
- [ ] No gaps or overlaps in character
- [ ] Character proportions look human-like

#### Physics Tests
- [ ] Character stays upright when standing still
- [ ] Character walks forward smoothly
- [ ] Character falls realistically when pushed
- [ ] Joints have correct limits (no weird bending)
- [ ] Ragdoll recovery works

#### Gameplay Tests
- [ ] Player can hide behind obstacles
- [ ] AI can see/catch player with vision cone
- [ ] Collision with obstacles feels good
- [ ] Character doesn't get stuck

### Phase 3 Testing (Full Ragdoll)

#### Animation Tests
- [ ] Walk cycle looks natural
- [ ] Feet don't slide on ground (IK works)
- [ ] Arms swing during walk
- [ ] Smooth transitions between states

#### Advanced Physics Tests
- [ ] Character balance on uneven terrain
- [ ] Recovery from various fall angles
- [ ] Motor forces don't over-power physics
- [ ] Joint damping prevents jitter

---

## ⚠️ RISKS & MITIGATION

### Risk 1: Performance Degradation
**Severity**: HIGH
**Probability**: MEDIUM

**Description**: Articulated ragdolls require many physics bodies + constraints. Each character could have 11 bodies + 10 joints = significant physics overhead.

**Impact**:
- Frame rate drops below 60 FPS
- Physics world step takes > 10ms
- Game feels sluggish/unresponsive

**Mitigation**:
1. **Start Simple** - Phase 1 uses single body per character
2. **Optimize Broadphase** - Use SAPBroadphase instead of Naive
3. **Reduce Solver Iterations** - Start with 5-10 iterations, not 20+
4. **Limit Character Count** - Cap at 1 player + 2 AI max
5. **Use Sleeping Bodies** - Put inactive characters to sleep
6. **Profile Early** - Measure physics time in Phase 1

**Contingency**: If FPS drops, reduce character part count or simplify joints

---

### Risk 2: Balance Control Difficulty
**Severity**: MEDIUM
**Probability**: HIGH

**Description**: Keeping articulated characters upright while moving is HARD. Without good balance control, characters fall over constantly.

**Impact**:
- Characters can't walk, just fall
- Gameplay breaks (can't hide/chase)
- Frustrating user experience

**Mitigation**:
1. **Incremental Approach** - Phase 2 starts with 5 parts, simpler to balance
2. **Reference Examples** - Use cannon-es ragdoll example as starting point
3. **Tunable Parameters** - Expose damping, motor strength in config
4. **PID Controller** - Implement proper balance controller with feedback
5. **Physics Constraints** - Limit joint angles to prevent over-rotation

**Contingency**: Add "training wheels" - kinematic torso with physics limbs only

---

### Risk 3: ECS Architecture Conflicts
**Severity**: MEDIUM
**Probability**: LOW

**Description**: Current ECS expects Transform to be source of truth. Physics engine becomes new source of truth, potentially breaking systems.

**Impact**:
- Systems that directly modify Transform.position break
- AI steering behaviors need rewrite
- Collision system changes break hiding mechanics

**Mitigation**:
1. **Clear Ownership** - PhysicsBody owns position, Transform is read-only
2. **Facade Pattern** - MotorController provides same interface as Movement
3. **Gradual Migration** - Keep old Movement system for Phase 1 fallback
4. **Thorough Testing** - Test all gameplay mechanics after each phase

**Contingency**: Maintain dual systems - physics for visuals, logic for gameplay

---

### Risk 4: Joint Jitter/Instability
**Severity**: MEDIUM
**Probability**: MEDIUM

**Description**: Physics constraints can become unstable with high forces or poor tuning, causing joints to jitter/vibrate/explode.

**Impact**:
- Character limbs shake uncontrollably
- Characters "explode" and fly apart
- Immersion broken, looks buggy

**Mitigation**:
1. **Proper Damping** - Add linearDamping (0.1) and angularDamping (0.3)
2. **Limit Forces** - Cap motor forces to reasonable values
3. **Stable Solver** - Use cannon-es default SPLIT solver
4. **Soft Constraints** - Start with softer constraints, tighten later
5. **Reference Values** - Use realistic masses, joint limits

**Contingency**: Add "stabilize" button to reset character physics

---

### Risk 5: Complexity Creep
**Severity**: LOW
**Probability**: MEDIUM

**Description**: Articulated characters are complex. Easy to over-engineer or get stuck in animation/IK rabbit holes.

**Impact**:
- Development takes months instead of weeks
- Code becomes unmaintainable
- Feature bloat, loss of KISS principle

**Mitigation**:
1. **Three-Phase Plan** - Clear milestones, stop after any phase
2. **MVP Mindset** - Simple working > complex perfect
3. **Time Boxes** - If Phase 2 takes > 2 weeks, reassess
4. **Skip Phase 3** - Phase 2 might be "good enough"

**Contingency**: Accept simpler characters, focus on gameplay

---

## 📊 SUCCESS METRICS

### Phase 1 Success
- ✅ Game runs at 60 FPS with physics
- ✅ 0 crashes or game-breaking bugs
- ✅ Collision feels same or better than before
- ✅ Code is cleaner (delete custom collision code)

### Phase 2 Success
- ✅ Characters visually distinguishable (not just boxes)
- ✅ Players say "wow, cool ragdolls!"
- ✅ Ragdoll falls look funny/entertaining
- ✅ Still 60 FPS with articulated characters

### Phase 3 Success
- ✅ Walking animation looks natural
- ✅ Characters feel alive and responsive
- ✅ Polish worthy of sharing/showcasing
- ✅ Foundation for future character types

---

## 🎬 NEXT STEPS

### Immediate Actions (Phase 1 Kickoff)

1. **Add Cannon-es Library**
   - [ ] Add `<script src="https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js"></script>` to index.html
   - [ ] Verify CANNON global object loads
   - [ ] Test basic CANNON.World creation in console

2. **Create Physics Configuration**
   - [ ] Add physics section to `js/core/config.js`
   - [ ] Define gravity, timestep, iterations
   - [ ] Add collision group constants

3. **Implement PhysicsSystem**
   - [ ] Create `js/systems/physics/physics-system.js`
   - [ ] Initialize CANNON.World
   - [ ] Add update() with world.step()
   - [ ] Implement Transform sync

4. **Test with Single Character**
   - [ ] Modify `player-factory.js` to add CANNON.Body
   - [ ] Create PhysicsBody component
   - [ ] Verify character falls with gravity
   - [ ] Test WASD movement with forces

5. **Verify Gameplay**
   - [ ] Test player vs obstacle collision
   - [ ] Test AI hunter patrol
   - [ ] Test game win/lose conditions
   - [ ] Performance check (FPS counter)

### Decision Points

**After Phase 1**: Evaluate physics feel. If good, proceed to Phase 2.
**After Phase 2**: Evaluate ragdoll appeal. If awesome, proceed to Phase 3.
**After Phase 3**: Evaluate polish level. Ship or iterate?

---

## 📚 REFERENCES

### Cannon-es Documentation
- **GitHub**: https://github.com/pmndrs/cannon-es
- **Ragdoll Example**: https://github.com/pmndrs/cannon-es/blob/master/examples/ragdoll.html
- **API Docs**: https://pmndrs.github.io/cannon-es/

### Three.js + Physics
- **Three.js Docs**: https://threejs.org/docs/
- **Physics Integration Guide**: https://threejs.org/manual/#en/physics

### Character Physics Resources
- **Ragdoll Physics (Wikipedia)**: https://en.wikipedia.org/wiki/Ragdoll_physics
- **Active Ragdoll Tutorial**: https://www.gamasutra.com/view/feature/131313/creating_a_solid_active_ragdoll.php

### Project Files
- **Architecture Overview**: `.claude/Architecture-Overview.md`
- **Project Structure**: `PROJECT_STRUCTURE.yaml`
- **Config File**: `js/core/config.js`

---

## ✅ APPROVAL & SIGN-OFF

**Plan Created**: 2025-10-04
**Analyzed By**: Serena (Code Detective Agent)
**Documented By**: Claude (AI Assistant)
**Reviewed By**: [Awaiting User Approval]

**Ready to Proceed?**: ⬜ YES / ⬜ NO / ⬜ MODIFY PLAN

---

*End of GUBBAR Overhaul Plan*

### 2025-10-05 - Player Visual Upgrade Planning Kickoff
- Investigated player visuals: PlayerManager builds single `THREE.BoxGeometry` for all players; AI uses similar block with additional overlays.
- Confirmed movement/physics unaffected by visual mesh change because collisions rely on Cannon bodies.
- Next actions: implement modular character builder returning grouped mesh (torso, head, limbs), integrate into PlayerManager for players/hunters, ensure colors configurable, validate physics alignment.
