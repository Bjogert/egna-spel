# Bollen-I-Burken - Architecture Overview (KISS Edition)

**Last Updated**: October 2, 2025
**Status**: Active Development - Recent Major Updates
**Philosophy**: **Keep It Simple, Stupid (KISS)**

---

## 📋 Executive Summary

This document outlines the **simplified, maintainable architecture** for Bollen-I-Burken, a 3D hide-and-seek arena game built with Three.js and vanilla JavaScript.

### Core Philosophy: KISS Over Enterprise

**Current State (Optimized)**:
- ~4,500 lines of focused, simple code
- Plain JavaScript CONFIG object (510 lines with difficulty system)
- Simple try-catch error handling
- No component validation overhead
- Dynamic vision system independently testable (192 lines)
- Multiple hunter support with randomized behaviors
- Player win condition system
- Clear folder structure: core/, systems/, managers/

### Key Principles
✅ **One concern per file** - Each file has single, clear responsibility
✅ **Small files** - Target 200-400 lines; never exceed 500 (current violations noted)
✅ **No enterprise patterns** - Avoid Singleton/Observer/Strategy unless truly needed
✅ **Explicit over clever** - Simple code beats abstract frameworks
✅ **Test in isolation** - Systems should work independently
✅ **Grow incrementally** - Add complexity only when needed

---

## 🗂️ Current Folder Structure

```
Bollen-I-Burken/
├── index.html                      # Main entry point
│
├── css/
│   ├── style.css                   # Core game styles
│   ├── ui.css                      # UI-specific styles
│   └── responsive.css              # Mobile responsiveness
│
├── js/
│   │
│   ├── core/                       ⭐ CORE GAME ENGINE
│   │   ├── entity.js               (130 lines) Entity class
│   │   ├── components/             (11 component files)
│   │   │   ├── transform.js        Position, rotation, velocity
│   │   │   ├── player-input.js     Input state
│   │   │   ├── renderable.js       Three.js mesh reference
│   │   │   ├── movement.js         Movement properties
│   │   │   ├── player.js           Player identity
│   │   │   ├── interactable.js     Interaction callbacks
│   │   │   ├── hideable.js         Hiding spot data
│   │   │   ├── collider.js         Collision bounds
│   │   │   ├── ai-hunter.js        AI state machine
│   │   │   ├── vision-cone.js      Vision parameters
│   │   │   └── parent.js           Parent-child relationships (NEW)
│   │   ├── game-state.js           (96 lines) Entity/player tracking
│   │   ├── game-engine.js          (270 lines) Game loop + playerWin() (NEW)
│   │   ├── system.js               (22 lines) Base System class
│   │   └── config.js               (510 lines) Simple config + difficulty system
│   │
│   ├── systems/                    ⭐ GAME SYSTEMS (one per file)
│   │   ├── input/
│   │   │   └── input-system.js     (365 lines) Keyboard, touch, gamepad
│   │   │
│   │   ├── movement-system.js      (383 lines) Physics + win condition (NEW)
│   │   │
│   │   ├── ai/
│   │   │   ├── ai-system.js        (526 lines) Main AI + dynamic vision (EXCEEDS LIMIT)
│   │   │   ├── dynamic-vision.js   (192 lines) Adaptive vision system (NEW - Oct 2025)
│   │   │   └── steering/
│   │   │       ├── steering-behaviors.js    (180 lines) Core steering
│   │   │       ├── obstacle-avoidance.js    (220 lines) Avoidance logic
│   │   │       └── can-guard-strategy.js    (292 lines) Randomized patrol (NEW)
│   │   │
│   │   ├── ui/
│   │   │   ├── ui-system.js        (628 lines) HUD + countdown (EXCEEDS LIMIT)
│   │   │   └── menu-overlay.js     (350 lines) Menus + difficulty selector
│   │   │
│   │   ├── interaction/
│   │   │   ├── interaction-system.js        (250 lines) Main orchestration
│   │   │   ├── interaction-handlers.js      (180 lines) Type handlers
│   │   │   └── interaction-visuals.js       (120 lines) Visual feedback
│   │   │
│   │   ├── audio/
│   │   │   └── audio-system.js     (200 lines) Sound effects (DISABLED)
│   │   │
│   │   └── network/
│   │       └── network-system.js   (200 lines) Network sync (LOCAL MODE)
│   │
│   ├── managers/                   ⭐ DOMAIN MANAGERS
│   │   ├── arena/
│   │   │   ├── arena-builder.js            (91 lines) Main coordinator
│   │   │   ├── arena-floor.js              (80 lines) Floor creation
│   │   │   ├── arena-walls.js              (120 lines) Wall creation
│   │   │   ├── arena-lighting.js           (100 lines) Lighting setup
│   │   │   ├── arena-can.js                (90 lines) Central can
│   │   │   ├── arena-obstacles.js          (280 lines) Obstacle generation (NEW colors)
│   │   │   ├── obstacle-shapes.js          (150 lines) Compound shapes
│   │   │   ├── arena-helpers.js            (150 lines) Shared helpers
│   │   │   └── arena-cleanup.js            (120 lines) Resource cleanup
│   │   │
│   │   ├── player-manager.js       (259 lines) Player spawning
│   │   ├── player-factory.js       (100 lines) Entity creation
│   │   ├── game-lifecycle.js       (259 lines) Round init + multiple hunters (NEW)
│   │   │
│   │   └── resource/
│   │       ├── resource-manager-core.js    (300 lines) Main manager
│   │       ├── resource-factories.js       (150 lines) Creation factories
│   │       └── resource-observers.js       (100 lines) Lifecycle observers
│   │
│   └── ROOT FILES (MUST STAY IN ROOT)
│       ├── main.js                 (367 lines) Bootstrap + game loop
│       ├── utils.js                (240 lines) Utilities + GAME_STATES (PLAYER_WIN added)
│       └── debug-commands.js       (305 lines) Debug console commands
│
└── .claude/
    ├── claude.md                   Project guidelines + recent updates
    ├── Architecture-Overview.md    This file
    └── settings.local.json         Claude settings
```

---

## 🎯 Major Features (October 2025)

### 1. Dynamic Vision System (NEW)

**File**: `js/systems/ai/dynamic-vision.js` (192 lines)

**Concept**: AI vision adapts based on what it's looking at

**Trade-Off System**:
- **Looking FAR** (distant obstacles) → **NARROW cone** (focused), **2.875x range**
- **Looking NEAR** (general patrol) → **WIDE cone** (peripheral), **0.8x range**
- **Mid-range** → **NORMAL vision** (1.0x both)

**Key Features**:
```javascript
// Smoothing prevents vision twitching
smoothingFactor = 0.1 (10% new, 90% old distance)

// Range calculation
computeRangeFactor(normalizedDistance):
  - Close (<0.3): 0.8x → 1.0x
  - Mid (0.3-0.6): 1.0x
  - Far (>0.6): 1.0x → 2.875x

// Angle calculation
computeAngleFactor(normalizedDistance):
  - Close (<0.3): 1.2x → 1.0x (wider peripheral)
  - Mid (0.3-0.6): 1.0x
  - Far (>0.6): 1.0x → 0.15x (85% narrower - laser focus!)
```

**Integration Flow**:
1. `can-guard-strategy.js` → sets scan target (which obstacle AI is looking at)
2. `dynamic-vision.js` → calculates dynamic range/angle based on scan distance
3. `ai-system.js` → applies dynamic vision to VisionCone component
4. `movement-system.js` → updates vision cone mesh geometry to match

**Visual Feedback** (in movement-system.js):
- **Red cone**: Player detected
- **Bright yellow cone**: Focused on distant target (narrow beam)
- **Orange cone**: Normal patrol (wide peripheral)

---

### 2. Multiple AI Hunters (NEW)

**Implementation**: `game-lifecycle.js` spawns multiple hunters

**Difficulty-Based Hunter Counts**:
- Level 0-1: **1 hunter** (learning mode)
- Level 2-3: **2 hunters** (balanced)
- Level 4-5: **3 hunters** (challenging)
- Level 6-7: **4 hunters** (expert)
- Level 8: **5 hunters** (nightmare - "Guds Öga")
- Level 9: **6 hunters** (impossible - "Systemet Stänger om 5 Minuter")

**Spawning Logic** (game-lifecycle.js):
```javascript
const numHunters = difficulty.numHunters;
const spawnRadius = arenaSize * 0.6; // 60% out from center

for (let i = 0; i < numHunters; i++) {
    // Distribute evenly in circle formation
    const angle = (Math.PI * 2 * i) / numHunters;
    const x = Math.cos(angle) * spawnRadius;
    const z = Math.sin(angle) * spawnRadius;

    playerManager.addAIHunter(`ai-hunter-${i + 1}`, { x, y: 0.5, z });
}
```

---

### 3. Independent Hunter Behaviors (NEW)

**File**: `js/systems/ai/steering/can-guard-strategy.js` (292 lines)

**Each hunter has unique randomized parameters** (initialized once in guardState):

```javascript
guardState: {
    orbitRadius: 4.5 + Math.random() * 3.0,    // RANDOM 4.5-7.5m per hunter
    orbitAngle: Math.random() * Math.PI * 2,   // RANDOM starting angle
    orbitDirection: Math.random() < 0.5 ? 1 : -1,  // RANDOM direction
    scanTarget: Math.random() * Math.PI * 2,   // RANDOM initial scan
    scanDuration: Math.random() * 500,         // RANDOM offset (0-500ms)
    nextScanChange: 500 + Math.random() * 1500, // RANDOM 0.5-2s
    mode: 'ORBIT',
    moveSpeedMultiplier: 0.8 + Math.random() * 0.4,  // RANDOM 0.8-1.2x
    turnSpeedMultiplier: 1.2 + Math.random() * 1.0,  // RANDOM 1.2-2.2x
    currentObstacleIndex: Math.floor(Math.random() * obstacles.length)
}
```

**Dynamic Behavior Modes** (20% pause, 15% reposition, 20% creep, 15% fast, 30% normal):
- **PAUSE**: Stop & look around (scary!) - `moveSpeed: 0.0, turnSpeed: 3.0`
- **REPOSITION**: Quick move to opposite side - `moveSpeed: 2.0, turnSpeed: 3.0`
- **SLOW CREEP**: Methodical, tense - `moveSpeed: 0.3, turnSpeed: 2.5`
- **FAST PATROL**: Quick sweep with reverse - `moveSpeed: 1.6, turnSpeed: 1.5`

**Obstacle-Aware Scanning**:
- AI looks at actual hiding spots (obstacles), not random air
- Sometimes skips 1-2 obstacles randomly for variety
- Passes obstacle reference to dynamic-vision.js for accurate distance calculation

**Emergent Complexity**: 6 hunters with randomized parameters create the illusion of 6 different AI personalities!

---

### 4. Player Win Condition (NEW)

**File**: `js/systems/movement-system.js` (383 lines)

**Win Condition Logic**:
```javascript
checkPlayerWinCondition(gameState) {
    // 1. Check game is playing
    if (gameState.gamePhase !== GAME_STATES.PLAYING) return;

    // 2. Prevent multiple triggers
    if (this._playerHasWon) return;

    // 3. Get player and can positions
    const playerTransform = player.getComponent('Transform');
    const canPosition = CONFIG.can.position;

    // 4. Calculate distance (2D, ignore Y)
    const dx = playerTransform.position.x - canPosition.x;
    const dz = playerTransform.position.z - canPosition.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // 5. Check win conditions
    const winDistance = canRadius + 1.5; // ~2m
    if (distance <= winDistance && playerInput.keys.action1) {
        this._playerHasWon = true;
        gameEngine.playerWin(); // Triggers victory!
    }
}
```

**GameEngine.playerWin()** (game-engine.js):
```javascript
playerWin() {
    this.gameStatus = 'player_win';
    this.gameState.setGamePhase(GAME_STATES.PLAYER_WIN);

    // Stop all AI movement
    const aiSystem = this.getSystem('AISystem');
    for (const hunter of aiSystem.getHunters()) {
        const transform = hunter.getComponent('Transform');
        transform.velocity.x = 0;
        transform.velocity.z = 0;
    }

    // Show victory menu
    showStartMenu({
        gameOver: true,
        message: 'DU VÄN FÖR DIG!',  // Swedish: "You won for you!"
        reason: 'won',
        elapsedMs: elapsedTime
    });
}
```

**New Game State**: `PLAYER_WIN` added to `GAME_STATES` in utils.js

---

### 5. Improved Obstacle System (NEW)

**File**: `js/managers/arena/arena-obstacles.js` (280 lines)

**Height-Based Color System**:
```javascript
function getObstacleColor(height) {
    if (height <= 1.0) return 0x228B22;  // Green (0-1m)
    if (height <= 2.0) return 0xFFD700;  // Yellow (1-2m)
    if (height <= 3.0) return 0xFF8C00;  // Orange (2-3m)
    return 0xFF4500;                      // Red (3m+)
}
```

**Zone-Based Height Scaling** (from difficulty config):
```javascript
heightScaling: {
    nearMin: 0.3, nearMax: 0.6,  // 0-3m from can - SHORT & GREEN
    midMin: 1.2, midMax: 2.5,    // 3-7m from can - MEDIUM
    farMin: 2.5, farMax: 4.5     // 7m+ from can - TALL
}
```

**Near-Can Obstacle Rule**:
- All obstacles within 3-7m of can forced to 0.3-0.6m height
- Always colored green for visibility
- Ensures fair gameplay near objective

**Difficulty-Based canExclusionRadius**:
- Easy levels: 3-4m (obstacles closer to can)
- Hard levels: 10-12m (obstacles FAR from can, wide open space)

**Compound Colliders**:
- Parent component tracks child colliders
- Complex L-shapes, T-shapes supported
- Each box has precise collision bounds

---

### 6. Arena Scaling (NEW)

**4x Bigger Arena**:
- **Size**: 30x30 units (was 15x15) - 4x area!
- **Wall height**: 6m (was 3m) - 2x taller
- **Camera height**: 50 units (was 25) - 2x higher
- **Camera distance**: 30 units (was 15) - 2x further

**Hunter Scaling**:
- Spawn at 60% radius: ~18m from center (was ~9m)
- Patrol radii: 4.5-7.5m from can (scaled for larger arena)

**Benefits**:
- More space for stealth gameplay
- Better camera view of entire arena
- Room for 6 hunters without overcrowding

---

### 7. 5-Second Countdown (NEW)

**File**: `js/systems/ui/ui-system.js` (628 lines - EXCEEDS LIMIT)

**Countdown Display**:
```javascript
showCountdown(seconds) {
    // Large number display
    countdownElement.textContent = seconds;
    countdownElement.style.fontSize = '120px';
    countdownElement.style.color = '#ffc857';

    // Pulse animation
    countdownElement.style.animation = 'countdownPulse 0.5s ease-in-out';

    // Subtitle
    subtitleElement.textContent = 'Vakten räknar... Hitta gömställe!';
    // "The guard is counting... Find a hiding spot!"
}
```

**Game Flow**:
1. Player clicks "Start Game"
2. Arena builds, entities spawn
3. Game enters **COUNTDOWN state** (not PLAYING yet)
4. UI shows 5 → 4 → 3 → 2 → 1 countdown
5. **Players can move during countdown** to find hiding spots
6. Countdown finishes → **PLAYING state** → Hunters activate!

---

## 🏗️ Core Architecture (js/core/)

### entity.js (130 lines)

**Responsibility**: Entity-Component-System entity container

```javascript
class Entity {
    constructor(id) {
        this.id = id;
        this.components = new Map(); // String key → component object
        this.active = true;
    }

    addComponent(component) {
        // Smart component name resolution
        const name = component.constructor?.name ||
                     Object.getPrototypeOf(component).constructor.name;
        this.components.set(name, component);
    }

    getComponent(name) {
        return this.components.get(name);
    }

    hasComponent(name) {
        return this.components.has(name);
    }
}
```

**Key Decision**: String keys instead of constructor.name reflection
- Minification-safe
- Explicit and reliable
- Fast lookup

---

### game-engine.js (270 lines)

**Responsibility**: Game loop, tick management, system orchestration

**New Methods (October 2025)**:
```javascript
playerWin() {
    // NEW: Handle player victory condition
    this.gameStatus = 'player_win';
    this.gameState.setGamePhase(GAME_STATES.PLAYER_WIN);

    // Stop all AI
    const aiSystem = this.getSystem('AISystem');
    for (const hunter of aiSystem.getHunters()) {
        hunter.getComponent('Transform').velocity = { x: 0, z: 0 };
    }

    // Show victory menu
    showStartMenu({
        gameOver: true,
        message: 'DU VÄN FÖR DIG!',
        reason: 'won',
        elapsedMs: Date.now() - this.gameStartTime
    });
}
```

**Fixed Timestep + Variable Rendering** for smooth, consistent gameplay

---

### config.js (510 lines - EXCEEDS LIMIT)

**Responsibility**: Simple game configuration + difficulty system

**⚠️ ACTION NEEDED**: Consider splitting into:
- `config.js` (core config - ~200 lines)
- `difficulty-config.js` (10 difficulty levels - ~310 lines)

**Difficulty System Structure**:
```javascript
difficulties: [
    {
        id: 0,
        name: "Barnkalas",
        numHunters: 1,    // NEW: Hunter count per level
        obstacles: {
            count: 45,
            canExclusionRadius: 3.0,
            heightScaling: {     // NEW: Zone-based height control
                nearMin: 0.3, nearMax: 0.6,
                midMin: 1.2, midMax: 2.5,
                farMin: 2.5, farMax: 4.5
            }
        },
        ai: {
            patrolSpeed: 0.06,
            chaseSpeed: 0.10,
            visionRange: 8,
            visionAngle: 60
        }
    },
    // ... 9 more levels
]
```

---

## 🎮 Systems Architecture (js/systems/)

### movement-system.js (383 lines)

**Responsibility**: Movement physics, collision, **win condition**, **vision cone updates**

**New Features (October 2025)**:

1. **Player Win Condition**:
```javascript
checkPlayerWinCondition(gameState) {
    if (distanceToCan <= 2.0 && playerInput.keys.action1) {
        this._playerHasWon = true;
        gameEngine.playerWin();
    }
}
```

2. **Dynamic Vision Cone Geometry Updates**:
```javascript
updateVisionConeGeometry(coneMesh, angleInDegrees, range) {
    // Skip if no change (optimization)
    if (coneMesh._cachedAngle === angleInDegrees &&
        coneMesh._cachedRange === range) return;

    // Rebuild cone geometry with new parameters
    const vertices = [];
    const angleInRadians = (angleInDegrees * Math.PI) / 180;

    vertices.push(0, 0, 0); // Apex
    for (let i = 0; i <= segments; i++) {
        const angle = (-angleInRadians/2) + (angleInRadians * i / segments);
        vertices.push(Math.sin(angle) * range, 0, Math.cos(angle) * range);
    }

    coneMesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
}
```

3. **Vision Cone Color Coding**:
- **Red** (`0xff0000`): Player detected - `opacity: 0.9`
- **Bright Yellow** (`0xffdd00`): Focused (narrow beam) - `opacity: 0.5`
- **Orange** (`0xffaa00`): Normal patrol - `opacity: 0.4`

---

### ai-system.js (526 lines - EXCEEDS LIMIT)

**Responsibility**: AI hunter patrol, chase, vision, **dynamic vision integration**

**⚠️ ACTION NEEDED**: Consider extracting vision logic to `ai-vision.js`

**New Features (October 2025)**:

1. **Dynamic Vision Integration**:
```javascript
updateVision(hunter, visionCone, gameState) {
    // Get base vision stats
    const baseVision = {
        range: visionCone.baseRange || visionCone.range,
        angle: visionCone.baseAngle || visionCone.angle
    };

    // Get what AI is looking at
    const scanTarget = DynamicVision.getScanTargetInfo(aiComponent, aiTransform);

    // Calculate dynamic vision
    const dynamicVision = DynamicVision.computeDynamicVision(
        aiComponent, aiTransform, scanTarget, baseVision
    );

    // Apply to vision cone
    DynamicVision.applyDynamicVision(visionCone, dynamicVision);

    // Check if player visible with dynamic parameters
    if (distance <= visionCone.range && withinAngle) {
        if (hasLineOfSight) {
            visionCone.canSeePlayer = true;
            aiComponent.state = AI_STATES.RACE; // Sprint to can!
        }
    }
}
```

2. **AI States**:
- **PATROL**: Orbit can at 4.5-7.5m radius, scan obstacles systematically
- **RACE**: Sprint directly to can when player spotted (2-second lock-in)

3. **Multiple Hunter Support**:
- Each hunter operates independently
- Circle formation spawning
- Randomized patrol parameters per hunter

---

### dynamic-vision.js (192 lines - NEW)

**Responsibility**: Dynamic vision cone calculator - adaptive AI vision

**Core Algorithm**:

```javascript
class DynamicVision {
    static computeDynamicVision(ai, transform, scanTarget, baseVision) {
        // Calculate distance to scan target
        const targetDistance = calculateDistance(scanTarget, transform);

        // SMOOTHING: Prevent vision twitching
        if (!ai._visionState) {
            ai._visionState = { smoothedDistance: targetDistance };
        }

        const smoothingFactor = 0.1; // 10% new, 90% old
        ai._visionState.smoothedDistance =
            ai._visionState.smoothedDistance * 0.9 + targetDistance * 0.1;

        // Normalize distance (0.0 = close, 1.0 = far)
        const normalizedDistance = Math.min(
            ai._visionState.smoothedDistance / baseVision.range,
            1.0
        );

        // Apply trade-off formulas
        const rangeFactor = this.computeRangeFactor(normalizedDistance);
        const angleFactor = this.computeAngleFactor(normalizedDistance);

        return {
            range: baseVision.range * rangeFactor,
            angle: baseVision.angle * angleFactor,
            isFocusing: normalizedDistance > 0.6
        };
    }

    static computeRangeFactor(normalizedDistance) {
        if (normalizedDistance < 0.3) {
            // Close: 0.8x → 1.0x
            return 0.8 + (normalizedDistance / 0.3) * 0.2;
        } else if (normalizedDistance < 0.6) {
            // Mid: 1.0x
            return 1.0;
        } else {
            // Far: 1.0x → 2.875x (extended!)
            const farProgress = (normalizedDistance - 0.6) / 0.4;
            return 1.0 + farProgress * 1.875;
        }
    }

    static computeAngleFactor(normalizedDistance) {
        if (normalizedDistance < 0.3) {
            // Close: 1.2x → 1.0x (wider)
            return 1.2 - (normalizedDistance / 0.3) * 0.2;
        } else if (normalizedDistance < 0.6) {
            // Mid: 1.0x
            return 1.0;
        } else {
            // Far: 1.0x → 0.15x (85% narrower!)
            const farProgress = (normalizedDistance - 0.6) / 0.4;
            return 1.0 - farProgress * 0.85;
        }
    }
}
```

**Smoothing Explanation**:
- Without smoothing: Vision twitches as AI looks around
- With 10% factor: Smooth transitions, realistic focus shifts
- Formula: `new = old * 0.9 + target * 0.1`

---

### can-guard-strategy.js (292 lines)

**Responsibility**: AI hunter can-guarding patrol with randomized behavior

**Randomized Initialization** (per hunter):
```javascript
if (!ai.guardState) {
    ai.guardState = {
        orbitRadius: 4.5 + Math.random() * 3.0,        // 4.5-7.5m
        orbitAngle: Math.random() * Math.PI * 2,       // Random start
        orbitDirection: Math.random() < 0.5 ? 1 : -1,  // CW or CCW
        scanTarget: Math.random() * Math.PI * 2,       // Random initial
        moveSpeedMultiplier: 0.8 + Math.random() * 0.4, // 0.8-1.2x
        turnSpeedMultiplier: 1.2 + Math.random() * 1.0, // 1.2-2.2x
        currentObstacleIndex: Math.floor(Math.random() * obstacles.length)
    };
}
```

**Dynamic Behavior Changes** (every 1-3 seconds when settled):
```javascript
if (behaviorTimer > nextBehaviorChange && isSettled) {
    const roll = Math.random();

    if (roll < 0.20) {
        // 20%: PAUSE - Stop and look
        mode = 'PAUSE';
        moveSpeedMultiplier = 0.0;
        turnSpeedMultiplier = 3.0;
    } else if (roll < 0.35) {
        // 15%: REPOSITION - Quick move
        mode = 'REPOSITION';
        targetOrbitAngle = currentAngle + Math.PI;
        moveSpeedMultiplier = 2.0;
    } else if (roll < 0.55) {
        // 20%: SLOW CREEP
        mode = 'ORBIT';
        moveSpeedMultiplier = 0.3;
        turnSpeedMultiplier = 2.5;
    } else if (roll < 0.70) {
        // 15%: FAST PATROL
        mode = 'ORBIT';
        moveSpeedMultiplier = 1.6;
        orbitDirection *= -1; // Reverse!
    } else {
        // 30%: NORMAL
        mode = 'ORBIT';
        moveSpeedMultiplier = 1.0;
    }
}
```

**Obstacle-Aware Scanning**:
```javascript
if (hasObstacles) {
    // Sometimes skip obstacles for variety
    const skipCount = Math.random() < 0.3 ?
        1 + Math.floor(Math.random() * 2) : 1;

    currentObstacleIndex = (currentObstacleIndex + skipCount) % obstacles.length;
    const targetObstacle = obstacles[currentObstacleIndex];

    // Look directly at obstacle
    scanTarget = Math.atan2(
        targetObstacle.position.x - transform.position.x,
        targetObstacle.position.z - transform.position.z
    );

    // Store for dynamic vision distance calculation
    scanTargetObstacle = targetObstacle;
}
```

---

### ui-system.js (628 lines - EXCEEDS LIMIT)

**Responsibility**: HUD, stats, countdown, **player win state**

**⚠️ ACTION NEEDED**: Consider splitting into:
- `ui-system.js` (core UI - ~350 lines)
- `ui-messages.js` (countdown, messages - ~280 lines)

**New Features (October 2025)**:

1. **Countdown Display**:
```javascript
showCountdown(seconds) {
    countdownElement.textContent = seconds;
    countdownElement.style.cssText = `
        font-size: 120px;
        color: #ffc857;
        text-shadow: 0 0 20px rgba(255, 200, 87, 0.8);
        animation: countdownPulse 0.5s ease-in-out;
    `;

    subtitleElement.textContent = 'Vakten räknar... Hitta gömställe!';
}
```

2. **PLAYER_WIN State Support**:
```javascript
case GAME_STATES.PLAYER_WIN:
    gameContainer.className = 'game-player-win';
    // No popup message - menu shows instead
    break;
```

---

## 📊 Key Architectural Decisions

### Decision 1: Dynamic Vision System (Oct 2025)

**Problem**: AI vision felt unrealistic - always same range/angle

**Solution**: Adaptive vision based on scan target distance
- Looking far → narrow beam, extended range
- Looking near → wide peripheral, reduced range
- Smooth transitions prevent twitching

**Benefits**:
- More realistic AI behavior
- Clear visual feedback (cone narrows when focused)
- Reusable for cameras, spotlights
- Independently testable (192-line module)

---

### Decision 2: Multiple Independent Hunters (Oct 2025)

**Problem**: Single hunter too predictable

**Solution**: 1-6 hunters with randomized behaviors
- Each hunter unique patrol radius
- Randomized speeds, turn rates
- Dynamic behavior mode changes
- Circle formation spawning

**Benefits**:
- Emergent complexity from simple randomization
- 6 hunters feel like 6 different personalities
- Difficulty scales naturally (1 → 6 hunters)
- Each playthrough feels different

---

### Decision 3: Player Win Condition (Oct 2025)

**Problem**: Game had no win condition (only time survival)

**Solution**: Reach can + press space = victory
- Distance check: within 2m of can
- Input check: action1 key (space) pressed
- New PLAYER_WIN game state
- Victory message: "DU VÄN FÖR DIG!"

**Benefits**:
- Clear objective for players
- Race dynamic when AI spots player
- Swedish cultural authenticity
- Satisfying win feedback

---

### Decision 4: Height-Based Obstacle Colors (Oct 2025)

**Problem**: All obstacles same color - hard to judge height

**Solution**: Color-coded by height
- Green (0-1m): Short, easy to hide behind
- Yellow (1-2m): Medium height
- Orange (2-3m): Tall cover
- Red (3m+): Very tall obstacles

**Benefits**:
- Instant visual feedback on obstacle height
- Near-can obstacles forced short & green (fair gameplay)
- Colorblind-friendly progression
- Accessibility improvement

---

### Decision 5: Arena 4x Scaling (Oct 2025)

**Problem**: 15x15 arena felt cramped with multiple hunters

**Solution**: Scale to 30x30 (4x area)
- Double wall height (6m)
- Double camera height/distance
- Scaled hunter patrol radii

**Benefits**:
- Room for 6 hunters without crowding
- Better stealth gameplay opportunities
- Improved camera view
- More strategic hiding options

---

## 🔄 System Update Order

Systems update in this order each tick:

```
1. InputSystem          ← Capture player input
2. AISystem             ← AI decision-making + dynamic vision
3. MovementSystem       ← Apply physics + check win condition + update vision cones
4. InteractionSystem    ← Handle interactions
5. AudioSystem          ← Update 3D audio (DISABLED)
6. UISystem             ← Render UI + countdown

Then: renderer.render(scene, camera)
```

**Order matters** - Input before movement, AI vision before movement updates

---

## 🚀 Current Status & Next Steps

### Files Needing Attention

1. **config.js (510 lines - EXCEEDS LIMIT)**
   - **Action**: Split into `config.js` + `difficulty-config.js`
   - **Benefit**: Each file under 500 lines

2. **ai-system.js (526 lines - EXCEEDS LIMIT)**
   - **Action**: Extract vision logic to `ai-vision.js`
   - **Benefit**: Vision system independently testable

3. **ui-system.js (628 lines - EXCEEDS LIMIT)**
   - **Action**: Split into `ui-system.js` + `ui-messages.js`
   - **Benefit**: Separate core UI from messages/countdown

### Completed (October 2025)

**v1.1.0 - Core Features:**
✅ Dynamic vision system implemented
✅ Multiple hunter support (1-6 hunters)
✅ Player win condition added
✅ Randomized hunter behaviors
✅ Height-based obstacle coloring
✅ Arena scaled to 4x size (30x30)
✅ 5-second countdown system
✅ PLAYER_WIN game state
✅ Vision cone dynamic geometry updates

**v1.2.0 - Refinement & Polish:**
✅ Vision fine-tuned to 15% angle, 2.875x range when focused
✅ Fixed vision mode switching with real obstacle distances
✅ Comprehensive hunter randomization (4.5-7.5m orbit, 0.8-2.2x speeds)
✅ Variable scan intervals (600-1000ms) per hunter
✅ Obstacle-aware scanning with real distance calculation
✅ Dynamic behavior modes (PAUSE, REPOSITION, SLOW CREEP, FAST PATROL)
✅ Each hunter completely independent
✅ Removed unnecessary win popup
✅ Documentation complete (claude.md, PROJECT_STRUCTURE.yaml, Architecture-Overview.md)

### Future Enhancements

**Short Term**:
- Split oversized files (config, ai-system, ui-system)
- Add sound effects (footsteps, alerts)
- Polish victory/defeat animations
- Mobile touch controls optimization

**Medium Term**:
- Save/load difficulty preferences
- Achievement system
- Replay system
- Statistics tracking

**Long Term**:
- Multiplayer networking (WebRTC)
- Custom arena builder
- Tournament mode
- Additional game modes

---

## 📝 Maintenance Checklist

### When Adding Features:
- [ ] Check file size doesn't exceed 500 lines
- [ ] Never create aggregator files
- [ ] Follow KISS principles
- [ ] Update PROJECT_STRUCTURE.yaml
- [ ] Update this Architecture-Overview.md
- [ ] Test with debug commands

### When Refactoring:
- [ ] Preserve KISS architecture
- [ ] Keep critical root files in place
- [ ] Don't reintroduce deleted patterns
- [ ] Update index.html script order if needed
- [ ] Run game to verify no breakage
- [ ] Document changes in all 3 files

### Code Review Standards:
- [ ] File size under 500 lines?
- [ ] No aggregator patterns?
- [ ] No Singleton/Observer unless justified?
- [ ] Clear single responsibility?
- [ ] Proper error handling (try-catch)?
- [ ] Uses CONFIG instead of hardcoded values?
- [ ] Follows naming conventions?

---

## 📚 Integration Flow Diagrams

### Dynamic Vision Integration
```
Player/Obstacle Position
    ↓
can-guard-strategy.js
    → Sets scanTarget (angle to obstacle)
    → Stores scanTargetObstacle reference
    ↓
dynamic-vision.js
    → getScanTargetInfo() gets obstacle + distance
    → computeDynamicVision() calculates range/angle
    → Smoothing prevents twitching
    ↓
ai-system.js
    → updateVision() applies to VisionCone component
    → Checks player visibility with dynamic params
    ↓
movement-system.js
    → updateVisionConeGeometry() rebuilds mesh
    → Updates color (red/yellow/orange)
    ↓
Visual Feedback (Vision Cone)
```

### Multiple Hunter Flow
```
MenuOverlay (difficulty selected)
    ↓
CONFIG.difficulties[level].numHunters
    ↓
game-lifecycle.js
    → startNewGame()
    → createLocalPlayer()
    → for (i = 0; i < numHunters; i++)
        → Calculate circle position: angle = (2π * i / numHunters)
        → playerManager.addAIHunter(id, position)
    ↓
player-manager.js
    → Creates AI entity with components
    → Sets difficulty-based vision/speed
    ↓
can-guard-strategy.js
    → Initializes guardState with RANDOM parameters
    → orbitRadius, speeds, scan timing all unique
    ↓
ai-system.js
    → updateHunter() for each hunter independently
    → Each uses own guardState (different behavior)
    ↓
Emergent Complexity (6 different "personalities")
```

### Player Win Flow
```
Player Movement (WASD)
    ↓
movement-system.js
    → updatePlayerMovement()
    → checkPlayerWinCondition()
        → Distance to can <= 2m?
        → action1 key (space) pressed?
    ↓
gameEngine.playerWin()
    → Set gameStatus = 'player_win'
    → Set gamePhase = PLAYER_WIN
    → Stop all AI movement
    ↓
showStartMenu()
    → Display "DU VÄN FÖR DIG!"
    → Show play again / menu buttons
    ↓
Victory!
```

---

**Architecture Status**: ✅ Implemented with Recent Major Updates (v1.2.0)
**Philosophy**: Keep It Simple, Stupid (KISS)
**Current Size**: ~4,500 lines focused code (3 files exceed limit)
**Enterprise Patterns**: NONE (by design)
**Last Updated**: October 2, 2025 (v1.2.0 - Vision refinement & hunter independence)

---

## 📖 For Next AI Assistant

**CRITICAL - DO NOT REMOVE OR MODIFY:**
1. **Dynamic Vision System** - Range/angle trade-off is core to AI realism
2. **Randomized Hunter Behaviors** - guardState initialization creates variety
3. **Player Win Condition** - checkPlayerWinCondition() in movement-system.js
4. **Vision Cone Geometry Updates** - updateVisionConeGeometry() must stay synced
5. **PLAYER_WIN State** - New game state in GAME_STATES
6. **Height-Based Colors** - Obstacle color system aids accessibility

**FILES TO SPLIT (when convenient):**
- `config.js` (510 lines) → `config.js` + `difficulty-config.js`
- `ai-system.js` (526 lines) → `ai-system.js` + `ai-vision.js`
- `ui-system.js` (628 lines) → `ui-system.js` + `ui-messages.js`

**PRESERVE KISS ARCHITECTURE:**
- No aggregator files
- No enterprise patterns (Singleton/Observer/Strategy)
- Direct imports only
- Simple CONFIG object
- 500-line file limit (split when exceeded)
