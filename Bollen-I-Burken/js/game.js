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
        this.components.set(component.constructor.name, component);
        return this;
    }

    getComponent(componentType) {
        const typeName = typeof componentType === 'string' ? componentType : componentType.name;
        return this.components.get(typeName);
    }

    hasComponent(componentType) {
        const typeName = typeof componentType === 'string' ? componentType : componentType.name;
        return this.components.has(typeName);
    }

    removeComponent(componentType) {
        const typeName = typeof componentType === 'string' ? componentType : componentType.name;
        return this.components.delete(typeName);
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

// Player Component (Updated for Component Validation)
class Player {
    constructor(playerId, isLocal = false) {
        // Required properties matching validation schema
        this.playerId = playerId;

        // Optional properties with defaults from schema
        this.isLocal = isLocal;
        this.score = 0;
        this.lives = 3;
        this.powerUps = [];

        // Legacy properties (for backward compatibility)
        this.state = PLAYER_STATES.IDLE;
        this.health = 100;
    }
}

class PlayerController {
    constructor(playerId, isLocal = false) {
        this.playerId = playerId;
        this.isLocal = isLocal;
        this.state = PLAYER_STATES.IDLE;
        this.health = 100;
        this.score = 0;
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

        // Add validated core components
        playerEntity.addComponent(new Transform(0, 0.5, 0));
        playerEntity.addComponent(new Player(playerId, isLocal));
        playerEntity.addComponent(new Movement(0.1)); // Player movement speed

        // Add legacy component for backward compatibility
        playerEntity.addComponent(new PlayerController(playerId, isLocal));

        if (isLocal) {
            playerEntity.addComponent(new PlayerInput());
            this.localPlayerId = playerId;
        }

        this.players.set(playerId, playerEntity.id);
        Utils.log(`Added validated player ${playerId} (local: ${isLocal})`);
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

        Utils.log('Game engine initialized');
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
        // Update all systems with fixed timestep
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
        Utils.log('Game engine started');
    }

    pause() {
        this.gameState.setGamePhase(GAME_STATES.PAUSED);
        Utils.log('Game engine paused');
    }

    resume() {
        this.gameState.setGamePhase(GAME_STATES.PLAYING);
        Utils.log('Game engine resumed');
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
        PlayerController,
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
        PlayerController,
        GameState,
        System,
        GameEngine
    };
}