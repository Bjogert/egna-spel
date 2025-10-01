# Dunkgömme - Architecture Overview (KISS Edition)

**Last Updated**: September 29, 2025
**Status**: Post-Revert, Refactoring In Progress
**Philosophy**: **Keep It Simple, Stupid (KISS)**

---

## 📋 Executive Summary

This document outlines the **simplified, maintainable architecture** for Dunkgömme after identifying and removing over-engineering that caused the AI vision system to break.

### Core Philosophy: KISS Over Enterprise

**Before (Broken)**:
- 6,500 lines of code with 38% enterprise bloat
- ConfigManager (746 lines), ErrorHandler (604 lines), ComponentValidator (599 lines)
- Vision system buried in 678-line ai.js file
- ComponentValidator bug destroyed object prototypes
- Impossible to test systems independently

**After (Target)**:
- ~4,000 lines of focused, simple code
- Plain JavaScript config object (50 lines)
- Simple try-catch error handling
- No component validation overhead
- Vision system extracted (independently testable)
- Clear folder structure: core/, systems/, managers/, utils/

### Key Principles
✅ **One concern per file** - Each file has single, clear responsibility
✅ **Small files** - Target 200-400 lines; never exceed 500
✅ **No enterprise patterns** - Avoid Singleton/Observer/Strategy unless truly needed
✅ **Explicit over clever** - Simple code beats abstract frameworks
✅ **Test in isolation** - Systems should work independently
✅ **Grow incrementally** - Add complexity only when needed

---

## 🗂️ Proposed Folder Structure

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
│   │   ├── components.js           (250 lines) All component definitions
│   │   ├── collision.js            (150 lines) Collider + collision math
│   │   ├── game-engine.js          (200 lines) GameEngine, GameState, System
│   │   └── config.js               (50 lines) Simple configuration object
│   │
│   ├── systems/                    ⭐ GAME SYSTEMS (one per file)
│   │   ├── input-system.js         (300 lines) Keyboard, touch, gamepad
│   │   ├── movement-system.js      (200 lines) Player and AI movement
│   │   ├── ai-behavior.js          (250 lines) AI state machine
│   │   ├── vision-system.js        (200 lines) Vision cone + line-of-sight
│   │   ├── interaction-system.js   (300 lines) Object interactions
│   │   ├── ui-system.js            (400 lines) UI rendering
│   │   └── audio-system.js         (350 lines) Sound management
│   │
│   ├── managers/                   ⭐ DOMAIN MANAGERS
│   │   ├── arena-builder.js        (400 lines) Arena creation
│   │   ├── player-manager.js       (200 lines) Player spawning
│   │   └── resource-manager.js     (300 lines) Three.js cleanup
│   │
│   └── utils/                      ⭐ UTILITIES
│       ├── utils.js                (200 lines) Vector math, helpers
│       ├── collision-utils.js      (150 lines) Ray-box intersection
│       └── constants.js            (50 lines) Game constants
│
├── assets/                         (Future)
│   ├── sounds/
│   ├── images/
│   └── models/
│
└── documentation/
    ├── README.md
    ├── Architecture-Overview.md    (This file)
    ├── Function-Glossary.md        (Complete function reference)
    ├── Bug.md
    └── documentation.md
```

**Benefits**:
- Find code by category (all systems in systems/)
- File sizes manageable (<400 lines)
- Test systems independently
- Clear import relationships
- Professional without over-engineering

---

## 🎯 What Went Wrong (Root Cause Analysis)

### The Enterprise Bloat Problem

**Files That Caused Issues**:
1. **config-manager.js (746 lines)** - Singleton + Observer + Strategy patterns for simple config
2. **error-handler.js (604 lines)** - Complex categorization and recovery for basic errors
3. **component-validator.js (599 lines)** - Spread operator bug (line 454) destroyed prototypes

**Total Bloat**: 1,949 lines (38% of codebase) providing **ZERO gameplay value**

### The ComponentValidator Bug

**What Happened**:
```javascript
// component-validator.js line 454
const corrected = { ...component }; // ❌ Strips all methods!
```

**Impact**:
- Collider component lost `.checkBoxCollision()` method
- Vision system depends on collision → vision broke
- AI can't see player → gameplay broken
- Cascade failure from "helpful" validation

**Lesson**: Enterprise patterns created bugs that wouldn't exist in simple code

### The Vision System Coupling Problem

**Before**: Vision code buried in 678-line ai.js
- Lines 250-320: Vision cone checking (70 lines)
- Lines 322-474: Line-of-sight raycasting (152 lines)
- **Impossible to test vision independently**
- **Can't debug vision without loading all AI logic**

**After**: Extracted to vision-system.js (200 lines)
- Test vision separately
- Reuse for cameras, spotlights
- Debug vision bugs in isolation
- Clear separation of concerns

---

## 🏗️ Core Architecture (js/core/)

### entity.js (130 lines)

**Responsibility**: Entity-Component-System entity container

```javascript
class Entity {
    constructor(id) {
        this.id = id;
        this.components = new Map(); // String key → component object
    }

    addComponent(name, component) {
        // Use simple string keys (no reflection)
        this.components.set(name, component);
    }

    getComponent(name) {
        return this.components.get(name);
    }

    hasComponent(name) {
        return this.components.has(name);
    }

    removeComponent(name) {
        this.components.delete(name);
    }

    destroy() {
        this.components.clear();
    }
}
```

**Key Decision**: String keys instead of constructor.name reflection
- Minification-safe
- Explicit and reliable
- Fast lookup

---

### components.js (250 lines)

**Responsibility**: All game component definitions

**Simple Component Objects** - No validation, no methods that get stripped

```javascript
// Transform: Position, rotation, velocity
const Transform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { y: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    previousPosition: { x: 0, y: 0, z: 0 }
};

// Movement: Speed and direction
const Movement = {
    speed: 0.15,
    maxSpeed: 0.2,
    acceleration: 0.01,
    friction: 0.9,
    direction: { x: 0, z: 0 }
};

// PlayerInput: Key states
const PlayerInput = {
    keys: {
        forward: false,
        backward: false,
        left: false,
        right: false,
        interact: false,
        special: false
    },
    lastInputTime: 0
};

// Player: Player-specific data
const Player = {
    isLocal: true,
    playerId: '',
    team: 'hiders'
};

// Renderable: Three.js mesh reference
const Renderable = {
    mesh: null,
    visible: true
};

// Interactable: Objects player can interact with
const Interactable = {
    type: 'can', // 'can', 'door', 'hiding_spot'
    interactDistance: 2.0,
    isActive: true,
    onInteract: null // Callback function
};

// Hideable: Hiding spots
const Hideable = {
    hideCapacity: 1,
    hideRadius: 1.5,
    occupants: [],
    hideEffectiveness: 0.8
};

// AIHunter: AI state machine
const AIHunter = {
    state: 'PATROL', // 'PATROL' | 'HUNTING' | 'SEARCHING'
    patrolPoints: [],
    currentPatrolIndex: 0,
    alertLevel: 0.5,
    lastSeenPlayerPos: null,
    lastSeenTime: 0
};

// VisionCone: AI vision parameters
const VisionCone = {
    angle: 60,          // Degrees
    range: 12,          // Units
    enabled: true,
    targetSeen: false
};
```

**Factory Functions** to create clean component instances:
```javascript
function createTransform(x, y, z) {
    return {
        position: { x, y, z },
        rotation: { y: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        previousPosition: { x, y, z }
    };
}

function createMovement(speed) {
    return {
        speed,
        maxSpeed: speed * 1.5,
        acceleration: speed * 0.1,
        friction: 0.9,
        direction: { x: 0, z: 0 }
    };
}

// ... factory functions for all components
```

---

### collision.js (150 lines)

**Responsibility**: Collision detection and response math

```javascript
// Collider component
const Collider = {
    bounds: { width: 1, height: 1, depth: 1 },
    offset: { x: 0, y: 0, z: 0 },
    isTrigger: false,
    layer: 'default'
};

// Pure collision functions
function containsPoint(point, entityPosition, collider) {
    const halfWidth = collider.bounds.width / 2;
    const halfDepth = collider.bounds.depth / 2;

    return (
        point.x >= entityPosition.x - halfWidth &&
        point.x <= entityPosition.x + halfWidth &&
        point.z >= entityPosition.z - halfDepth &&
        point.z <= entityPosition.z + halfDepth
    );
}

function checkBoxCollision(posA, boundsA, posB, boundsB) {
    // AABB collision test
    return (
        Math.abs(posA.x - posB.x) < (boundsA.width + boundsB.width) / 2 &&
        Math.abs(posA.z - posB.z) < (boundsA.depth + boundsB.depth) / 2
    );
}

function calculateSlideResponse(oldPos, newPos, entityBounds, obstaclePos, obstacleBounds) {
    // Calculate sliding collision response
    // Returns corrected position that slides along obstacle edge

    // Try X-axis slide
    const slideX = { x: newPos.x, z: oldPos.z };
    if (!checkBoxCollision(slideX, entityBounds, obstaclePos, obstacleBounds)) {
        return slideX;
    }

    // Try Z-axis slide
    const slideZ = { x: oldPos.x, z: newPos.z };
    if (!checkBoxCollision(slideZ, entityBounds, obstaclePos, obstacleBounds)) {
        return slideZ;
    }

    // Can't slide, return old position
    return oldPos;
}
```

**Pure Math** - No classes, no state, just collision geometry

---

### game-engine.js (200 lines)

**Responsibility**: Core game loop and system management

```javascript
class GameState {
    constructor() {
        this.currentTick = 0;
        this.gameTime = 0;
        this.isRunning = false;
        this.isPaused = false;

        this.entities = new Map();     // id → Entity
        this.players = new Set();      // Player entity IDs
        this.aiHunters = new Set();    // AI hunter entity IDs
    }

    addEntity(entity) {
        this.entities.set(entity.id, entity);
    }

    removeEntity(entityId) {
        this.entities.delete(entityId);
        this.players.delete(entityId);
        this.aiHunters.delete(entityId);
    }

    getEntity(entityId) {
        return this.entities.get(entityId);
    }
}

class System {
    // Base class for all systems
    update(gameState, deltaTime) {
        // Override in subclass
    }
}

class GameEngine {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.gameState = new GameState();
        this.systems = [];

        this.tickRate = 60;
        this.tickInterval = 1000 / this.tickRate;
        this.accumulator = 0;
        this.lastTime = 0;
    }

    addSystem(system) {
        this.systems.push(system);
    }

    start() {
        this.gameState.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }

    stop() {
        this.gameState.isRunning = false;
    }

    tick() {
        // Fixed timestep update (60 FPS)
        if (this.gameState.isPaused) return;

        const deltaTime = this.tickInterval / 1000; // Convert to seconds

        // Update all systems
        for (const system of this.systems) {
            try {
                system.update(this.gameState, deltaTime);
            } catch (error) {
                console.error(`System update error:`, system.constructor.name, error);
            }
        }

        this.gameState.currentTick++;
        this.gameState.gameTime += deltaTime;
    }

    render(interpolation) {
        // Variable timestep rendering (smooth visuals)
        this.renderer.render(this.scene, this.camera);
    }

    gameLoop() {
        if (!this.gameState.isRunning) return;

        const currentTime = performance.now();
        const deltaTime = Math.min(currentTime - this.lastTime, 100); // Cap at 100ms
        this.lastTime = currentTime;

        this.accumulator += deltaTime;

        // Fixed timestep updates
        while (this.accumulator >= this.tickInterval) {
            this.tick();
            this.accumulator -= this.tickInterval;
        }

        // Variable rendering with interpolation
        const interpolation = this.accumulator / this.tickInterval;
        this.render(interpolation);

        requestAnimationFrame(() => this.gameLoop());
    }
}
```

**Fixed Timestep + Variable Rendering** for smooth, consistent gameplay

---

### config.js (50 lines)

**Responsibility**: Simple game configuration

**NO ConfigManager** - Just a plain JavaScript object

```javascript
export const CONFIG = {
    arena: {
        size: 15,           // 15x15 units
        wallHeight: 3,
        floorY: 0
    },

    player: {
        speed: 0.15,
        size: 0.8,
        color: 0x4444ff    // Blue
    },

    ai: {
        speed: 0.08,        // Slower than player
        size: 0.8,
        color: 0xff4444,   // Red

        visionRange: 12,
        visionAngle: 60,    // Degrees

        patrolChangeInterval: 3000,  // ms
        searchDuration: 5000,         // ms
        wallBuffer: 0.5
    },

    game: {
        tickRate: 60,
        maxDeltaTime: 0.1
    }
};

// Simple getter (optional convenience)
export function getConfig(path) {
    const keys = path.split('.');
    let value = CONFIG;
    for (const key of keys) {
        value = value[key];
        if (value === undefined) break;
    }
    return value;
}
```

**Usage**:
```javascript
// Direct access (preferred)
const arenaSize = CONFIG.arena.size;

// Or with helper
const playerSpeed = getConfig('player.speed');
```

**No observers, no validation, no complexity** - Change values directly during development

---

## 🎮 Systems Architecture (js/systems/)

### input-system.js (300 lines)

**Responsibility**: Capture player input from all devices

```javascript
class InputSystem extends System {
    constructor() {
        super();
        this.keyStates = new Map();
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        window.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        window.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    }

    update(gameState, deltaTime) {
        // Update PlayerInput components from keyStates
        for (const [id, entity] of gameState.entities) {
            const playerInput = entity.getComponent('player_input');
            if (!playerInput) continue;

            // Update from keyboard state
            playerInput.keys.forward = this.isKeyPressed('KeyW') || this.isKeyPressed('ArrowUp');
            playerInput.keys.backward = this.isKeyPressed('KeyS') || this.isKeyPressed('ArrowDown');
            playerInput.keys.left = this.isKeyPressed('KeyA') || this.isKeyPressed('ArrowLeft');
            playerInput.keys.right = this.isKeyPressed('KeyD') || this.isKeyPressed('ArrowRight');
            playerInput.keys.interact = this.isKeyPressed('KeyE');
            playerInput.keys.special = this.isKeyPressed('KeyQ');

            playerInput.lastInputTime = performance.now();
        }
    }

    isKeyPressed(keyCode) {
        return this.keyStates.get(keyCode) === true;
    }

    handleKeyDown(event) {
        this.keyStates.set(event.code, true);
    }

    handleKeyUp(event) {
        this.keyStates.set(event.code, false);
    }

    // Touch and gamepad methods...

    destroy() {
        // Clean up event listeners
    }
}
```

**Multi-platform** - Keyboard, touch, gamepad

---

### movement-system.js (200 lines)

**Responsibility**: Move entities based on input and physics

```javascript
class MovementSystem extends System {
    update(gameState, deltaTime) {
        for (const [id, entity] of gameState.entities) {
            const transform = entity.getComponent('transform');
            const movement = entity.getComponent('movement');

            if (!transform || !movement) continue;

            // Store previous position for interpolation
            transform.previousPosition.x = transform.position.x;
            transform.previousPosition.y = transform.position.y;
            transform.previousPosition.z = transform.position.z;

            // Check if this is player or AI
            if (entity.hasComponent('player_input')) {
                this.updatePlayerMovement(entity, deltaTime);
            } else if (entity.hasComponent('ai_hunter')) {
                this.updateAIMovement(entity, deltaTime);
            }
        }
    }

    updatePlayerMovement(entity, deltaTime) {
        const transform = entity.getComponent('transform');
        const movement = entity.getComponent('movement');
        const input = entity.getComponent('player_input');

        // Calculate direction from input
        const direction = { x: 0, z: 0 };

        if (input.keys.forward) direction.z -= 1;
        if (input.keys.backward) direction.z += 1;
        if (input.keys.left) direction.x -= 1;
        if (input.keys.right) direction.x += 1;

        // Normalize direction
        const length = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
        if (length > 0) {
            direction.x /= length;
            direction.z /= length;
        }

        // Apply movement
        if (length > 0) {
            // Accelerate
            transform.velocity.x += direction.x * movement.acceleration * deltaTime * 60;
            transform.velocity.z += direction.z * movement.acceleration * deltaTime * 60;
        } else {
            // Apply friction
            transform.velocity.x *= movement.friction;
            transform.velocity.z *= movement.friction;
        }

        // Cap at max speed
        const speed = Math.sqrt(
            transform.velocity.x * transform.velocity.x +
            transform.velocity.z * transform.velocity.z
        );
        if (speed > movement.maxSpeed) {
            const scale = movement.maxSpeed / speed;
            transform.velocity.x *= scale;
            transform.velocity.z *= scale;
        }

        // Update position
        transform.position.x += transform.velocity.x;
        transform.position.z += transform.velocity.z;

        // Check arena boundaries
        this.applyBoundaryCollision(transform, CONFIG.arena.size);
    }

    updateAIMovement(entity, deltaTime) {
        // Similar to player but using AI direction instead of input
        // (AI direction set by AISystem)
    }

    applyBoundaryCollision(transform, arenaSize) {
        const boundary = arenaSize - 0.5;

        // Clamp position to arena bounds
        if (transform.position.x < -boundary) {
            transform.position.x = -boundary;
            transform.velocity.x = 0;
        }
        if (transform.position.x > boundary) {
            transform.position.x = boundary;
            transform.velocity.x = 0;
        }
        if (transform.position.z < -boundary) {
            transform.position.z = -boundary;
            transform.velocity.z = 0;
        }
        if (transform.position.z > boundary) {
            transform.position.z = boundary;
            transform.velocity.z = 0;
        }
    }
}
```

**Velocity-based physics** with acceleration and friction

---

### ai-behavior.js (250 lines)

**Responsibility**: AI state machine and decision-making

```javascript
class AISystem extends System {
    update(gameState, deltaTime) {
        // Update all AI hunters
        for (const hunterId of gameState.aiHunters) {
            const hunter = gameState.getEntity(hunterId);
            if (!hunter) continue;

            this.updateHunter(hunter, gameState, deltaTime);
        }
    }

    updateHunter(hunter, gameState, deltaTime) {
        const aiComponent = hunter.getComponent('ai_hunter');
        const transform = hunter.getComponent('transform');
        const visionCone = hunter.getComponent('vision_cone');

        // Check vision to detect player (uses VisionSystem)
        const playerSeen = this.checkVision(hunter, gameState);

        // Update AI state based on vision
        if (playerSeen) {
            aiComponent.state = 'HUNTING';
            aiComponent.lastSeenPlayerPos = playerSeen.position;
            aiComponent.lastSeenTime = performance.now();
        } else if (aiComponent.state === 'HUNTING') {
            // Lost sight of player, switch to searching
            aiComponent.state = 'SEARCHING';
        } else if (aiComponent.state === 'SEARCHING') {
            // Check if search timeout
            const timeSinceSeen = performance.now() - aiComponent.lastSeenTime;
            if (timeSinceSeen > CONFIG.ai.searchDuration) {
                aiComponent.state = 'PATROL';
            }
        }

        // Execute behavior for current state
        switch (aiComponent.state) {
            case 'PATROL':
                this.updatePatrolBehavior(aiComponent, transform, deltaTime);
                break;
            case 'HUNTING':
                this.updateHuntingBehavior(aiComponent, transform, playerSeen, deltaTime);
                break;
            case 'SEARCHING':
                this.updateSearchingBehavior(aiComponent, transform, deltaTime);
                break;
        }

        // Check if hunter caught player
        this.checkPlayerCollision(hunter, gameState);
    }

    checkVision(hunter, gameState) {
        // Use VisionSystem to check if player is visible
        // This is now a separate, testable system

        const visionSystem = window.visionSystem; // Injected dependency
        if (!visionSystem) return null;

        const players = Array.from(gameState.players)
            .map(id => gameState.getEntity(id))
            .filter(p => p);

        for (const player of players) {
            const obstacles = this.getObstacles(gameState);
            if (visionSystem.canSee(hunter, player, obstacles)) {
                return player;
            }
        }

        return null;
    }

    updatePatrolBehavior(aiComponent, transform, deltaTime) {
        // Random patrol with periodic direction changes
        // Simple patrol pattern
    }

    updateHuntingBehavior(aiComponent, transform, player, deltaTime) {
        // Move toward player's position
        // Direct chase
    }

    updateSearchingBehavior(aiComponent, transform, deltaTime) {
        // Move toward last known player position
        // Search area
    }

    checkPlayerCollision(hunter, gameState) {
        // Check if hunter touched player (tagging)
        // Trigger game over if caught
    }
}
```

**State Machine** - PATROL → HUNTING → SEARCHING

---

### vision-system.js (200 lines) ⭐

**Responsibility**: Vision cone and line-of-sight detection

**🎯 EXTRACTED FOR INDEPENDENT TESTING**

```javascript
class VisionSystem {
    canSee(observer, target, obstacles) {
        // Main vision check
        // Returns true if target visible to observer

        const observerTransform = observer.getComponent('transform');
        const targetTransform = target.getComponent('transform');
        const visionCone = observer.getComponent('vision_cone');

        if (!observerTransform || !targetTransform || !visionCone) {
            return false;
        }

        // 1. Check range
        const distance = this.calculateDistance(
            observerTransform.position,
            targetTransform.position
        );

        if (distance > visionCone.range) {
            return false;
        }

        // 2. Check if within cone angle
        if (!this.isWithinCone(observerTransform, targetTransform, visionCone)) {
            return false;
        }

        // 3. Check line-of-sight (no obstacles blocking)
        return this.checkLineOfSight(
            observerTransform.position,
            targetTransform.position,
            obstacles
        );
    }

    calculateDistance(posA, posB) {
        const dx = posB.x - posA.x;
        const dz = posB.z - posA.z;
        return Math.sqrt(dx * dx + dz * dz);
    }

    isWithinCone(observerTransform, targetTransform, visionCone) {
        // Calculate angle from observer to target
        const dx = targetTransform.position.x - observerTransform.position.x;
        const dz = targetTransform.position.z - observerTransform.position.z;
        const angleToTarget = Math.atan2(dx, dz);

        // Observer's facing direction
        const observerAngle = observerTransform.rotation.y;

        // Calculate angle difference
        let angleDiff = angleToTarget - observerAngle;

        // Normalize to [-π, π]
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // Check if within cone
        const halfConeAngle = (visionCone.angle * Math.PI / 180) / 2;
        return Math.abs(angleDiff) <= halfConeAngle;
    }

    checkLineOfSight(start, end, obstacles) {
        // Raycast from start to end
        // Return false if any obstacle blocks ray

        for (const obstacle of obstacles) {
            const obstacleTransform = obstacle.getComponent('transform');
            const obstacleCollider = obstacle.getComponent('collider');

            if (!obstacleTransform || !obstacleCollider) continue;

            // Use CollisionUtils for ray-box intersection
            if (CollisionUtils.rayIntersectsBox(
                start,
                end,
                obstacleTransform.position,
                obstacleCollider.bounds
            )) {
                return false; // Blocked
            }
        }

        return true; // Clear line of sight
    }

    // Debug visualization
    renderVisionCone(observer, scene) {
        // Draw debug cone for tuning vision parameters
        // Useful during development
    }
}
```

**Key Benefits of Extraction**:
✅ Test vision independently: `visionSystem.canSee(hunter, player, [])`
✅ Reuse for other entities: cameras, spotlights, NPCs
✅ Debug vision without AI complexity
✅ Clear separation of concerns

---

## 🛠️ Utilities (js/utils/)

### collision-utils.js (150 lines)

**Responsibility**: Advanced collision math (ray casting)

```javascript
class CollisionUtils {
    static rayIntersectsBox(rayStart, rayEnd, boxCenter, boxBounds) {
        // Ray-AABB intersection test
        // Algorithm: Slab method

        const rayDirection = {
            x: rayEnd.x - rayStart.x,
            y: rayEnd.y - rayStart.y,
            z: rayEnd.z - rayStart.z
        };

        const rayLength = Math.sqrt(
            rayDirection.x * rayDirection.x +
            rayDirection.y * rayDirection.y +
            rayDirection.z * rayDirection.z
        );

        // Normalize direction
        rayDirection.x /= rayLength;
        rayDirection.y /= rayLength;
        rayDirection.z /= rayLength;

        // Box bounds
        const halfWidth = boxBounds.width / 2;
        const halfHeight = boxBounds.height / 2;
        const halfDepth = boxBounds.depth / 2;

        const boxMin = {
            x: boxCenter.x - halfWidth,
            y: boxCenter.y - halfHeight,
            z: boxCenter.z - halfDepth
        };

        const boxMax = {
            x: boxCenter.x + halfWidth,
            y: boxCenter.y + halfHeight,
            z: boxCenter.z + halfDepth
        };

        // Slab method: calculate t values for each axis
        let tMin = 0;
        let tMax = rayLength;

        // X axis
        if (Math.abs(rayDirection.x) > 0.0001) {
            const t1 = (boxMin.x - rayStart.x) / rayDirection.x;
            const t2 = (boxMax.x - rayStart.x) / rayDirection.x;
            tMin = Math.max(tMin, Math.min(t1, t2));
            tMax = Math.min(tMax, Math.max(t1, t2));
        }

        // Y axis
        if (Math.abs(rayDirection.y) > 0.0001) {
            const t1 = (boxMin.y - rayStart.y) / rayDirection.y;
            const t2 = (boxMax.y - rayStart.y) / rayDirection.y;
            tMin = Math.max(tMin, Math.min(t1, t2));
            tMax = Math.min(tMax, Math.max(t1, t2));
        }

        // Z axis
        if (Math.abs(rayDirection.z) > 0.0001) {
            const t1 = (boxMin.z - rayStart.z) / rayDirection.z;
            const t2 = (boxMax.z - rayStart.z) / rayDirection.z;
            tMin = Math.max(tMin, Math.min(t1, t2));
            tMax = Math.min(tMax, Math.max(t1, t2));
        }

        // Check intersection
        if (tMax < tMin || tMax < 0) {
            return false; // No intersection
        }

        return true; // Intersection
    }
}
```

**Complex Math Extracted** - Pure functions, no game logic mixed in

---

## 📊 Key Architectural Decisions

### Decision 1: Remove Enterprise Patterns

**Deleted**:
- config-manager.js (746 lines) → config.js (50 lines)
- error-handler.js (604 lines) → try-catch + console.error
- component-validator.js (599 lines) → removed entirely

**Reasoning**:
- Added 1,949 lines for zero gameplay benefit
- Created bugs (ComponentValidator spread operator)
- Made debugging difficult (errors hidden, configs wrapped)
- Violated KISS principle stated in Bug.md

---

### Decision 2: Extract Vision System

**Before**: Buried in 678-line ai.js
**After**: Separate vision-system.js (200 lines)

**Reasoning**:
- Can't test vision when embedded in AI
- Vision reusable for cameras, spotlights
- Easier to debug vision bugs separately
- Clear separation of concerns

---

### Decision 3: String-Based Component Keys

**Instead of**: `entity.getComponent(Transform)` (reflection)
**Use**: `entity.getComponent('transform')` (string literal)

**Reasoning**:
- Minification breaks constructor.name
- Reflection is slow and fragile
- String keys are explicit and reliable

---

### Decision 4: Split Large Files

**game.js (734 lines) →**
- entity.js (130 lines)
- components.js (250 lines)
- collision.js (150 lines)
- game-engine.js (200 lines)

**Reasoning**:
- Hard to find code in 700+ line files
- Can't test components without entire engine
- Clear file boundaries = clear mental model

---

### Decision 5: Folder Organization

**Before**: Flat js/ folder (14 files)
**After**: js/core/, js/systems/, js/managers/, js/utils/

**Reasoning**:
- Find code by category
- New developers navigate easily
- Professional without over-engineering

---

## 🔄 System Update Order

Systems update in this order each tick:

```
1. InputSystem          ← Capture player input
2. AISystem             ← AI decision-making
3. VisionSystem         ← Check vision cones
4. MovementSystem       ← Apply physics
5. InteractionSystem    ← Handle interactions
6. AudioSystem          ← Update 3D audio
7. UISystem             ← Render UI

Then: renderer.render(scene, camera)
```

**Order matters** - Input before movement, movement before rendering

---

## 🚀 Migration Plan

### Phase 1: Remove Enterprise Bloat ⚠️ CRITICAL

**Time**: 1-2 hours
**Priority**: CRITICAL

**Actions**:
1. Delete config-manager.js, error-handler.js, component-validator.js
2. Create js/core/config.js (simple object export)
3. Replace all `ConfigManager.get()` with `CONFIG.arena.size`
4. Replace all `ErrorHandler.handle()` with `try-catch + console.error`
5. Remove ValidatedEntity, use regular Entity

**Impact**: Remove 1,949 lines of bloat

---

### Phase 2: Extract Vision System ⚠️ HIGH

**Time**: 2-3 hours
**Priority**: HIGH

**Actions**:
1. Create js/systems/vision-system.js
2. Copy vision methods from ai.js (lines 250-474)
3. Create js/utils/collision-utils.js for ray-box math
4. Update AISystem to use VisionSystem
5. Test vision independently

**Impact**: Vision system testable, AI file reduced 225 lines

---

### Phase 3: Split game.js ⚠️ HIGH

**Time**: 3-4 hours
**Priority**: HIGH

**Actions**:
1. Create js/core/entity.js (Entity class)
2. Create js/core/components.js (all components)
3. Create js/core/collision.js (Collider + math)
4. Create js/core/game-engine.js (GameEngine + GameState)
5. Update index.html load order
6. Test game loads correctly

**Impact**: Clear separation, easier modifications

---

### Phase 4: Reorganize Folders ⚠️ MEDIUM

**Time**: 1-2 hours
**Priority**: MEDIUM

**Actions**:
1. Create folders: core/, systems/, managers/, utils/
2. Move files to appropriate folders
3. Update all script src paths in index.html
4. Test game loads

**Impact**: Professional organization

---

### Phase 5: Test & Validate ⚠️ HIGH

**Time**: 2-3 hours
**Priority**: HIGH

**Actions**:
1. Test vision system independently
2. Test AI behavior (patrol, hunting, searching)
3. Test player movement and collision
4. Full integration testing
5. Performance testing (FPS, memory)

**Impact**: Ensure no regressions

---

## ✅ Success Metrics

### Code Quality
- ✅ No files >500 lines
- ✅ Clear folder structure (core/, systems/, managers/, utils/)
- ✅ No enterprise patterns
- ✅ Simple config (exported object)
- ✅ Vision system independently testable

### Functionality
- ✅ AI vision working
- ✅ Player movement smooth
- ✅ Collision accurate
- ✅ No console errors
- ✅ 60 FPS performance

### Maintainability
- ✅ Easy to find code
- ✅ Can modify vision without breaking AI
- ✅ Can add components without touching core
- ✅ Clear dependencies
- ✅ Debug commands work

---

## 📚 Lessons Learned

### What Went Wrong

1. **Over-engineering** - Added enterprise patterns without need
2. **Large files** - 734-line game.js mixed concerns
3. **Tight coupling** - Vision buried in AI prevented testing
4. **Validation bugs** - ComponentValidator destroyed prototypes
5. **Complexity creep** - 38% bloat (1,949 lines)

### What We'll Do Differently

1. **KISS first** - Start simple, add complexity when needed
2. **Split files early** - Keep under 400 lines
3. **Extract systems** - Make testable independently
4. **Avoid singletons** - Use explicit dependencies
5. **No premature patterns** - Don't add until needed twice

### Code Review Checklist

❓ Is this file >400 lines? → Split it
❓ Am I adding a Singleton? → Do I really need it?
❓ Can I test this independently? → If not, extract it
❓ Am I adding validation? → Is it truly necessary?
❓ Does this add complexity or value? → Be honest

---

## 🔮 Future Enhancements

### Short Term
- Visual polish (better materials, particles)
- Sound system (footsteps, ambient, alerts)
- Hiding spots mechanics
- Multiple AI hunters
- Game timer and scoring

### Medium Term
- Obstacle generation (procedural)
- Player animations
- AI coordination
- Swedish language UI
- Mobile touch polish

### Long Term
- Multiplayer networking (WebRTC)
- Replay system
- Custom arena builder
- Tournament mode
- Educational content

**All on KISS foundation** - Add incrementally, test thoroughly

---

## 📝 Conclusion

The Dunkgömme architecture has been redesigned around **KISS principles**:

✅ **Simple code** over enterprise patterns
✅ **Small files** over 2000-line mosaics
✅ **Clear organization** over flat structure
✅ **Explicit dependencies** over singletons
✅ **Testable systems** over tight coupling

**Result**: Maintainable, scalable codebase supporting Swedish cultural preservation without unnecessary complexity.

**Next Steps**: Execute migration plan, test thoroughly, maintain KISS discipline.

---

**Architecture Status**: ✅ Designed, ⏳ Implementation In Progress
**Philosophy**: Keep It Simple, Stupid (KISS)
**Target Size**: ~4,000 lines (from 6,500)
**Enterprise Patterns**: NONE (by design)
**Last Updated**: September 29, 2025