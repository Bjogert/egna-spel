/* ==========================================
   BOLLEN I BURKEN - GAME ENGINE
   Entity-Component-System and Core Logic
   ========================================== */

// Entity-Component-System Implementation
class Entity {
    constructor(id) {
        this.id = id;
        this.components = new Map();
        this.active = true;
    }

    addComponent(component) {
        // Get component type name with fallback for constructor.name === 'Object'
        let componentName = component.constructor.name;

        // Handle naming collision where multiple components have constructor.name === 'Object'
        if (componentName === 'Object') {
            // Smart detection based on component properties
            if (component.position && component.velocity && component.rotation) {
                componentName = 'Transform';
            } else if (component.speed !== undefined && component.maxSpeed !== undefined) {
                componentName = 'Movement';
            } else if (component.keys && typeof component.hasInput === 'function') {
                componentName = 'PlayerInput';
            } else if (component.playerId && component.isLocal !== undefined) {
                componentName = 'Player';
            } else if (component.mesh && component.visible !== undefined) {
                componentName = 'Renderable';
            } else if (component.state && component.patrolPoints !== undefined) {
                componentName = 'AIHunter';
            } else if (component.angle !== undefined && component.range !== undefined) {
                componentName = 'VisionCone';
            } else {
                // Fallback: use a unique identifier to prevent collisions
                componentName = `UnknownComponent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                Utils.warn(`Component with unknown type detected, assigned name: ${componentName}`);
            }

            Utils.log(`Component naming collision resolved: 'Object' -> '${componentName}'`);
        }

        this.components.set(componentName, component);
        return this;
    }

    getComponent(componentType) {
        let typeName;
        if (typeof componentType === 'string') {
            typeName = componentType;
        } else {
            typeName = componentType.name;
            // Handle case where class name is 'Object' - try to find by component type
            if (typeName === 'Object') {
                typeName = this._findComponentNameByType(componentType);
            }
        }
        return this.components.get(typeName);
    }

    hasComponent(componentType) {
        let typeName;
        if (typeof componentType === 'string') {
            typeName = componentType;
        } else {
            typeName = componentType.name;
            // Handle case where class name is 'Object' - try to find by component type
            if (typeName === 'Object') {
                typeName = this._findComponentNameByType(componentType);
            }
        }
        return this.components.has(typeName);
    }

    removeComponent(componentType) {
        let typeName;
        if (typeof componentType === 'string') {
            typeName = componentType;
        } else {
            typeName = componentType.name;
            // Handle case where class name is 'Object' - try to find by component type
            if (typeName === 'Object') {
                typeName = this._findComponentNameByType(componentType);
            }
        }
        return this.components.delete(typeName);
    }

    // Helper method to find component name by checking stored components against class type
    _findComponentNameByType(componentType) {
        for (const [name, component] of this.components) {
            if (component instanceof componentType) {
                return name;
            }
        }

        // Fallback: return the class name even if it's 'Object'
        return componentType.name;
    }

    // Debug method to check for potential component naming issues
    debugComponents() {
        Utils.log(`Entity ${this.id} components:`);
        for (const [name, component] of this.components) {
            const actualClassName = component.constructor.name;
            const hasNameCollision = actualClassName === 'Object';

            Utils.log(`  - ${name}: ${actualClassName}${hasNameCollision ? ' (naming collision resolved)' : ''}`);

            // Log key properties to help identify component types
            if (hasNameCollision) {
                const keys = Object.keys(component).slice(0, 3).join(', ');
                Utils.log(`    Properties: ${keys}...`);
            }
        }
    }

    destroy() {
        this.active = false;
        this.components.clear();
    }
}

// Core Components
class Transform {
    constructor(x = 0, y = 0, z = 0, rotationY = 0) {
        this.position = Utils.vector3(x, y, z);
        this.rotation = { y: rotationY };
        this.velocity = Utils.vector3();
        this.previousPosition = Utils.vector3(x, y, z);
    }

    updatePrevious() {
        this.previousPosition = { ...this.position };
    }
}

class PlayerInput {
    constructor() {
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };
        this.lastInputTime = 0;
        this.inputSequence = 0;
    }

    hasInput() {
        return this.keys.forward || this.keys.backward || this.keys.left || this.keys.right;
    }
}

class Renderable {
    constructor(mesh) {
        this.mesh = mesh;
        this.visible = true;
    }

    setVisible(visible) {
        this.visible = visible;
        if (this.mesh) {
            this.mesh.visible = visible;
        }
    }
}

// Movement Component (Updated for Component Validation)
class Movement {
    constructor(speed = 0.1) {
        // Required properties matching validation schema
        this.speed = speed;

        // Optional properties with defaults from schema
        this.maxSpeed = 2.0;
        this.acceleration = 1.0;
        this.friction = 0.8;
        this.direction = { x: 0, z: 0 };
    }
}

// Player Component (Unified - removed redundant PlayerController)
class Player {
    constructor(playerId, isLocal = false) {
        // Required properties matching validation schema
        this.playerId = playerId;

        // Optional properties with defaults from schema
        this.isLocal = isLocal;
        this.score = 0;
        this.lives = 3;
        this.powerUps = [];

        // Game state properties
        this.state = PLAYER_STATES.IDLE;
        this.health = 100;
    }
}

// Game State Manager
class GameState {
    constructor() {
        this.entities = new Map();
        this.nextEntityId = 1;
        this.currentTick = 0;
        this.players = new Map(); // playerId -> entityId
        this.localPlayerId = null;
        this.gamePhase = GAME_STATES.LOADING;
        this.startTime = Utils.now();
    }

    createEntity() {
        // Use ValidatedEntity for enterprise-grade component validation
        if (typeof ValidatedEntity === 'undefined') {
            Utils.error('ValidatedEntity is not available, falling back to Entity');
            const entity = new Entity(this.nextEntityId++);
            this.entities.set(entity.id, entity);
            Utils.log(`Created fallback entity ${entity.id}`);
            return entity;
        }

        const entity = new ValidatedEntity(this.nextEntityId++);
        this.entities.set(entity.id, entity);
        Utils.log(`Created validated entity ${entity.id}`);
        return entity;
    }

    getEntity(id) {
        return this.entities.get(id);
    }

    removeEntity(id) {
        const entity = this.entities.get(id);
        if (entity) {
            entity.destroy();
            this.entities.delete(id);
            Utils.log(`Removed entity ${id}`);
        }
    }

    addPlayer(playerId, isLocal = false) {
        const playerEntity = this.createEntity();

        // Add core components
        playerEntity.addComponent(new Transform(0, 0.5, 0));
        playerEntity.addComponent(new Player(playerId, isLocal));
        playerEntity.addComponent(new Movement(0.1)); // Player movement speed

        if (isLocal) {
            playerEntity.addComponent(new PlayerInput());
            this.localPlayerId = playerId;
        }

        this.players.set(playerId, playerEntity.id);
        Utils.log(`Added player ${playerId} (local: ${isLocal})`);
        return playerEntity;
    }

    removePlayer(playerId) {
        const entityId = this.players.get(playerId);
        if (entityId) {
            this.removeEntity(entityId);
            this.players.delete(playerId);
            Utils.log(`Removed player ${playerId}`);
        }
    }

    getPlayerEntity(playerId) {
        const entityId = this.players.get(playerId);
        return entityId ? this.getEntity(entityId) : null;
    }

    getLocalPlayer() {
        return this.localPlayerId ? this.getPlayerEntity(this.localPlayerId) : null;
    }

    getAllPlayers() {
        const players = [];
        for (const [playerId, entityId] of this.players) {
            const entity = this.getEntity(entityId);
            if (entity && entity.active) {
                players.push(entity);
            }
        }
        return players;
    }

    setGamePhase(phase) {
        Utils.log(`Game phase: ${this.gamePhase} -> ${phase}`);
        this.gamePhase = phase;
    }

    getGameTime() {
        return Utils.now() - this.startTime;
    }
}

// System Base Class
class System {
    constructor(name) {
        this.name = name;
        this.enabled = true;
    }

    update(gameState, deltaTime) {
        // Override in subclasses
    }

    render(gameState, interpolationFactor) {
        // Override in subclasses
    }
}

// Game Engine
class GameEngine {
    constructor() {
        this.gameState = new GameState();
        this.systems = [];
        this.systemsMap = new Map();

        // Timing
        this.tickRate = GAME_CONFIG.TICK_RATE;
        this.tickInterval = 1000 / this.tickRate;
        this.lastTickTime = 0;
        this.accumulator = 0;

        // Performance tracking
        this.frameCount = 0;
        this.lastFpsTime = 0;
        this.currentFps = 0;

        // Game timer and state
        this.gameStartTime = 0;
        this.gameDuration = 60000; // 60 seconds to survive
        this.gameStatus = 'playing'; // 'playing', 'won', 'lost'

        Utils.log('Game engine initialized');

        // Make game engine accessible globally for AI system
        window.GameEngine = this;
    }

    addSystem(system) {
        this.systems.push(system);
        this.systemsMap.set(system.name, system);
        Utils.log(`Added system: ${system.name}`);
    }

    getSystem(name) {
        return this.systemsMap.get(name);
    }

    removeSystem(name) {
        const system = this.systemsMap.get(name);
        if (system) {
            const index = this.systems.indexOf(system);
            if (index !== -1) {
                this.systems.splice(index, 1);
                this.systemsMap.delete(name);
                Utils.log(`Removed system: ${name}`);
            }
        }
    }

    update(deltaTime) {
        this.accumulator += deltaTime;

        // Fixed timestep updates (important for networking)
        while (this.accumulator >= this.tickInterval) {
            this.tick();
            this.accumulator -= this.tickInterval;
            this.gameState.currentTick++;
        }

        // Variable timestep rendering with interpolation
        const interpolationFactor = this.accumulator / this.tickInterval;
        this.render(interpolationFactor);

        // Update FPS counter
        this.updateFps();
    }

    tick() {
        // Check game timer (only if game is still playing)
        if (this.gameStatus === 'playing') {
            this.checkGameTimer();
        }

        // Update all systems with fixed timestep (only if game is playing)
        if (this.gameStatus === 'playing') {
            for (const system of this.systems) {
                if (system.enabled && system.update) {
                    try {
                        system.update(this.gameState, this.tickInterval);
                    } catch (error) {
                        Utils.error(`System ${system.name} update failed`, error);
                    }
                }
            }
        }
    }

    render(interpolationFactor) {
        // Render all systems with interpolation
        for (const system of this.systems) {
            if (system.enabled && system.render) {
                try {
                    system.render(this.gameState, interpolationFactor);
                } catch (error) {
                    Utils.error(`System ${system.name} render failed`, error);
                }
            }
        }
    }

    updateFps() {
        this.frameCount++;
        const currentTime = Utils.now();

        if (currentTime - this.lastFpsTime >= 1000) {
            this.currentFps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsTime = currentTime;
        }
    }

    start() {
        this.gameState.setGamePhase(GAME_STATES.PLAYING);
        this.gameStartTime = Date.now();
        this.gameStatus = 'playing';
        Utils.log('🎮 Game Started - Survive for 60 seconds!');
    }

    pause() {
        this.gameState.setGamePhase(GAME_STATES.PAUSED);
        Utils.log('Game engine paused');
    }

    resume() {
        this.gameState.setGamePhase(GAME_STATES.PLAYING);
        Utils.log('Game engine resumed');
    }

    checkGameTimer() {
        if (this.gameStartTime === 0) return; // Game not started

        const currentTime = Date.now();
        const elapsedTime = currentTime - this.gameStartTime;

        // Check if player has survived long enough to win
        if (elapsedTime >= this.gameDuration) {
            this.gameOver('won');
        }
    }

    gameOver(reason) {
        if (this.gameStatus !== 'playing') return; // Already ended

        this.gameStatus = reason; // 'won' or 'tagged'

        if (reason === 'won') {
            Utils.log('🎉 YOU WON! You survived for 60 seconds!');
            alert('🎉 CONGRATULATIONS!\n\nYou survived for 60 seconds and won the game!\n\nWell done!');
        } else if (reason === 'tagged') {
            Utils.log('🏃‍♂️ GAME OVER! You were tagged!');
            alert('🏃‍♂️ TAGGED!\n\nThe AI Hunter caught you!\n\nGame Over!');
        }

        // Stop all AI movement
        const aiSystem = this.getSystem('AISystem');
        if (aiSystem) {
            for (const hunter of aiSystem.getHunters()) {
                const transform = hunter.getComponent('Transform');
                if (transform) {
                    transform.velocity.x = 0;
                    transform.velocity.z = 0;
                }
            }
        }
    }

    getRemainingTime() {
        if (this.gameStartTime === 0 || this.gameStatus !== 'playing') return 0;

        const currentTime = Date.now();
        const elapsedTime = currentTime - this.gameStartTime;
        const remainingTime = Math.max(0, this.gameDuration - elapsedTime);

        return Math.ceil(remainingTime / 1000); // Return seconds
    }

    stop() {
        this.gameState.setGamePhase(GAME_STATES.GAME_OVER);
        Utils.log('Game engine stopped');
    }

    reset() {
        // Clear all entities
        this.gameState.entities.clear();
        this.gameState.players.clear();
        this.gameState.nextEntityId = 1;
        this.gameState.currentTick = 0;
        this.gameState.localPlayerId = null;
        this.gameState.startTime = Utils.now();

        Utils.log('Game engine reset');
    }

    getStats() {
        return {
            fps: this.currentFps,
            tick: this.gameState.currentTick,
            entities: this.gameState.entities.size,
            players: this.gameState.players.size,
            gameTime: this.gameState.getGameTime(),
            gamePhase: this.gameState.gamePhase
        };
    }
}

// Export for module systems or global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Entity,
        Transform,
        PlayerInput,
        Renderable,
        Movement,
        Player,
        GameState,
        System,
        GameEngine
    };
} else {
    window.GameCore = {
        Entity,
        Transform,
        PlayerInput,
        Renderable,
        Movement,
        Player,
        GameState,
        System,
        GameEngine,
        GAME_STATES,
        PLAYER_STATES
    };
}