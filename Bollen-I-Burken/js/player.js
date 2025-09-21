/* ==========================================
   BOLLEN I BURKEN - PLAYER SYSTEM
   Player entity management and movement
   ========================================== */

class MovementSystem extends System {
    constructor() {
        super('MovementSystem');
        // Use fallback values initially - will be updated when ConfigManager is available
        this.configManager = null;
        this.moveSpeed = 0.15; // Fallback speed from GAME_CONFIG
        this.arenaSize = 15;   // Fallback arena size from GAME_CONFIG
        this.configInitialized = false;
    }

    initializeConfig() {
        // Initialize ConfigManager when it's available
        if (typeof ConfigManager !== 'undefined' && !this.configInitialized) {
            try {
                this.configManager = ConfigManager.getInstance();
                this.moveSpeed = this.configManager.get('player.speed', 0.15);
                this.arenaSize = this.configManager.get('arena.size', 15);
                this.configInitialized = true;
                Utils.log('MovementSystem: ConfigManager initialized successfully');
            } catch (error) {
                Utils.warn('MovementSystem: ConfigManager not available, using fallback values');
            }
        }
    }

    update(gameState) {
        // Initialize config if needed
        this.initializeConfig();

        // Update all entities with movement components
        gameState.entities.forEach(entity => {
            const transform = entity.getComponent(Transform);
            const movement = entity.getComponent(Movement);

            // Handle player movement (with input)
            const input = entity.getComponent(PlayerInput);
            if (transform && input && movement) {
                this.updatePlayerMovement(transform, input, movement);
            }
            // Handle AI movement (without input - velocity set by AI system)
            else if (transform && movement) {
                this.updateAIMovement(transform, movement);
            }

            // Update mesh position from transform for all entities with renderable
            const renderable = entity.getComponent(Renderable);
            if (transform && renderable) {
                // Update mesh position from transform
                renderable.mesh.position.set(
                    transform.position.x,
                    transform.position.y,
                    transform.position.z
                );

                // Update mesh rotation
                renderable.mesh.rotation.y = transform.rotation.y;
            }
        });
    }

    updatePlayerMovement(transform, input, movementComponent) {
        // Enhanced debug logging for movement system
        if (input.hasInput()) {
            Utils.log(`Player movement - Input: forward=${input.keys.forward}, backward=${input.keys.backward}, left=${input.keys.left}, right=${input.keys.right}`);
            Utils.log(`Player position before: (${transform.position.x.toFixed(3)}, ${transform.position.z.toFixed(3)})`);
        }

        // Store previous position for interpolation
        transform.updatePrevious();

        // Reset velocity
        transform.velocity = Utils.vector3();

        // Calculate movement vector based on input
        const movementVector = Utils.vector3();

        if (input.keys.forward) movementVector.z -= 1;
        if (input.keys.backward) movementVector.z += 1;
        if (input.keys.left) movementVector.x -= 1;
        if (input.keys.right) movementVector.x += 1;

        // Normalize diagonal movement and use Movement component speed
        if (Utils.vectorLength(movementVector) > 0) {
            const normalizedMovement = Utils.vectorNormalize(movementVector);
            const speed = movementComponent.speed || this.moveSpeed;
            transform.velocity = Utils.vectorMultiply(normalizedMovement, speed);
        }

        // Apply velocity to position
        transform.position = Utils.vectorAdd(transform.position, transform.velocity);

        // Apply square arena boundaries
        const arenaLimit = (this.arenaSize / 2) - 0.5; // Leave some space from the wall
        transform.position.x = Math.max(-arenaLimit, Math.min(arenaLimit, transform.position.x));
        transform.position.z = Math.max(-arenaLimit, Math.min(arenaLimit, transform.position.z));

        // Debug logging for movement result
        if (input.hasInput()) {
            Utils.log(`Player position after: (${transform.position.x.toFixed(3)}, ${transform.position.z.toFixed(3)}), velocity: (${transform.velocity.x.toFixed(3)}, ${transform.velocity.z.toFixed(3)})`);
        }

        // Update rotation based on movement direction
        if (Utils.vectorLength(transform.velocity) > 0) {
            transform.rotation.y = Math.atan2(transform.velocity.x, transform.velocity.z);
        }
    }

    updateAIMovement(transform, movementComponent) {
        // Debug logging for AI movement
        if (transform.velocity.x !== 0 || transform.velocity.z !== 0) {
            Utils.log(`AI movement - velocity: (${transform.velocity.x.toFixed(3)}, ${transform.velocity.z.toFixed(3)}), position: (${transform.position.x.toFixed(2)}, ${transform.position.z.toFixed(2)})`);
        }

        // Store previous position for interpolation
        transform.updatePrevious();

        // Apply AI velocity to position (velocity set by AI system)
        transform.position = Utils.vectorAdd(transform.position, transform.velocity);

        // Apply square arena boundaries
        const arenaLimit = (this.arenaSize / 2) - 0.5; // Leave some space from the wall
        transform.position.x = Math.max(-arenaLimit, Math.min(arenaLimit, transform.position.x));
        transform.position.z = Math.max(-arenaLimit, Math.min(arenaLimit, transform.position.z));

        // Update rotation based on movement direction
        if (Utils.vectorLength(transform.velocity) > 0) {
            transform.rotation.y = Math.atan2(transform.velocity.x, transform.velocity.z);
        }
    }

    render(gameState, interpolationFactor) {
        // Interpolate positions for smooth rendering
        gameState.entities.forEach(entity => {
            const transform = entity.getComponent(Transform);
            const renderable = entity.getComponent(Renderable);

            if (transform && renderable && renderable.mesh) {
                // Interpolate position between previous and current
                const interpolatedPosition = Utils.lerpVector(
                    transform.previousPosition,
                    transform.position,
                    interpolationFactor
                );

                // Update mesh position
                renderable.mesh.position.set(
                    interpolatedPosition.x,
                    interpolatedPosition.y,
                    interpolatedPosition.z
                );

                // Update mesh rotation
                renderable.mesh.rotation.y = transform.rotation.y;
            }
        });
    }
}

class PlayerFactory {
    static createPlayer(scene, playerId, isLocal = false, color = 0x00ff00) {
        // Create player geometry
        const geometry = new THREE.BoxGeometry(0.8, 1.0, 0.8);
        const material = new THREE.MeshLambertMaterial({
            color: color,
            transparent: true,
            opacity: 0.9
        });
        const mesh = new THREE.Mesh(geometry, material);

        // Add shadow casting
        mesh.castShadow = true;
        mesh.receiveShadow = false;

        // Add to scene
        scene.add(mesh);

        // Create player entity components
        const entity = new Entity(playerId);
        entity.addComponent(new Transform(0, 0.5, 0));
        entity.addComponent(new Renderable(mesh));
        entity.addComponent(new PlayerController(playerId, isLocal));

        if (isLocal) {
            entity.addComponent(new PlayerInput());
            // Local player gets a different material
            material.color.setHex(0x00ff00);
            material.emissive.setHex(0x002200);
        } else {
            // Remote players get different colors
            material.color.setHex(color);
        }

        Utils.log(`Created player: ${playerId} (local: ${isLocal})`);
        return entity;
    }

    static createPlayerNameTag(playerId, position) {
        // Create a simple text sprite for player names
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;

        // Draw background
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Draw text
        context.fillStyle = 'white';
        context.font = '20px Arial';
        context.textAlign = 'center';
        context.fillText(playerId, canvas.width / 2, canvas.height / 2 + 7);

        // Create texture and sprite
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);

        sprite.position.set(position.x, position.y + 1.5, position.z);
        sprite.scale.set(2, 0.5, 1);

        return sprite;
    }
}

class PlayerManager {
    constructor(scene, gameEngine) {
        this.scene = scene;
        this.gameEngine = gameEngine;
        this.playerColors = [
            0x4a90e2, // Neutral blue (local player)
            0x7ed321, // Neutral green
            0xf5a623, // Neutral orange
            0xd0021b, // Neutral red
            0x9013fe, // Neutral purple
            0x50e3c2, // Neutral teal
            0xb8e986, // Neutral lime
            0xbd10e0  // Neutral magenta
        ];
        this.colorIndex = 1; // Start from 1 (0 is reserved for local player)
    }

    addLocalPlayer(playerId) {
        // Create player mesh
        const geometry = new THREE.BoxGeometry(0.8, 1.0, 0.8);
        const material = new THREE.MeshLambertMaterial({
            color: this.playerColors[0],
            transparent: true,
            opacity: 0.9
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.position.set(0, 0.5, 0);
        this.scene.add(mesh);

        // Create and add player to game state
        const gameEntity = this.gameEngine.gameState.addPlayer(playerId, true);

        // Add renderable component
        gameEntity.addComponent(new Renderable(mesh));

        Utils.log(`Added local player: ${playerId}`);
        return gameEntity;
    }

    addRemotePlayer(playerId) {
        const color = this.playerColors[this.colorIndex % this.playerColors.length];
        this.colorIndex++;

        // Create player mesh
        const geometry = new THREE.BoxGeometry(0.8, 1.0, 0.8);
        const material = new THREE.MeshLambertMaterial({
            color: color,
            transparent: true,
            opacity: 0.9
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.position.set(0, 0.5, 0);
        this.scene.add(mesh);

        // Create and add player to game state
        const gameEntity = this.gameEngine.gameState.addPlayer(playerId, false);

        // Add renderable component
        gameEntity.addComponent(new Renderable(mesh));

        Utils.log(`Added remote player: ${playerId}`);
        return gameEntity;
    }

    removePlayer(playerId) {
        const entity = this.gameEngine.gameState.getPlayerEntity(playerId);
        if (entity) {
            const renderable = entity.getComponent(Renderable);
            if (renderable && renderable.mesh) {
                this.scene.remove(renderable.mesh);

                // Dispose of geometry and material
                if (renderable.mesh.geometry) {
                    renderable.mesh.geometry.dispose();
                }
                if (renderable.mesh.material) {
                    renderable.mesh.material.dispose();
                }
            }

            this.gameEngine.gameState.removePlayer(playerId);
            Utils.log(`Removed player: ${playerId}`);
        }
    }

    updatePlayerPositions(playerUpdates) {
        // Update remote player positions (for multiplayer)
        for (const update of playerUpdates) {
            const entity = this.gameEngine.gameState.getPlayerEntity(update.playerId);
            if (entity && !entity.getComponent(PlayerController).isLocal) {
                const transform = entity.getComponent(Transform);
                if (transform) {
                    transform.position = Utils.vector3(update.x, update.y, update.z);
                    transform.rotation.y = update.rotation || 0;
                }
            }
        }
    }

    getPlayerList() {
        const players = [];
        for (const [playerId, entityId] of this.gameEngine.gameState.players) {
            const entity = this.gameEngine.gameState.getEntity(entityId);
            if (entity && entity.active) {
                const controller = entity.getComponent(PlayerController);
                const transform = entity.getComponent(Transform);

                players.push({
                    id: playerId,
                    isLocal: controller.isLocal,
                    position: transform.position,
                    state: controller.state,
                    health: controller.health,
                    score: controller.score
                });
            }
        }
        return players;
    }

    getLocalPlayerPosition() {
        const localPlayer = this.gameEngine.gameState.getLocalPlayer();
        if (localPlayer) {
            const transform = localPlayer.getComponent(Transform);
            return transform ? transform.position : null;
        }
        return null;
    }

    setPlayerState(playerId, state) {
        const entity = this.gameEngine.gameState.getPlayerEntity(playerId);
        if (entity) {
            const controller = entity.getComponent(PlayerController);
            if (controller) {
                controller.state = state;
                Utils.log(`Player ${playerId} state: ${state}`);
            }
        }
    }

    respawnPlayer(playerId, position = null) {
        const entity = this.gameEngine.gameState.getPlayerEntity(playerId);
        if (entity) {
            const transform = entity.getComponent(Transform);
            if (transform) {
                if (position) {
                    transform.position = Utils.vector3(position.x, position.y, position.z);
                } else {
                    // Default spawn position
                    transform.position = Utils.vector3(0, 0.5, 0);
                }
                transform.velocity = Utils.vector3();
                transform.rotation.y = 0;

                const controller = entity.getComponent(PlayerController);
                if (controller) {
                    controller.state = PLAYER_STATES.IDLE;
                    controller.health = 100;
                }

                Utils.log(`Respawned player: ${playerId}`);
            }
        }
    }

    addAIHunter(hunterId, position = null) {
        // Create AI hunter mesh - different color and slightly larger
        const geometry = new THREE.BoxGeometry(0.9, 1.1, 0.9);
        const material = new THREE.MeshLambertMaterial({
            color: 0xff4444, // Red color for AI hunter
            transparent: true,
            opacity: 0.9
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;

        // Set initial position
        const spawnPos = position || Utils.vector3(-5, 0.5, 5); // Corner spawn
        mesh.position.set(spawnPos.x, spawnPos.y, spawnPos.z);
        this.scene.add(mesh);

        // Create AI entity using GameState's createEntity method (with validation)
        const aiEntity = this.gameEngine.gameState.createEntity();
        aiEntity.addComponent(new Transform(spawnPos.x, spawnPos.y, spawnPos.z));
        aiEntity.addComponent(new Movement(0.08)); // AI hunter movement speed
        aiEntity.addComponent(new Renderable(mesh));
        aiEntity.addComponent(new AIHunter());
        aiEntity.addComponent(new VisionCone());

        // Register with AI system
        const aiSystem = this.gameEngine.systems.find(system => system.name === 'AISystem');
        if (aiSystem) {
            aiSystem.addEntity(aiEntity);
        }

        Utils.log(`Added AI hunter: ${hunterId} at position (${spawnPos.x}, ${spawnPos.z})`);
        return aiEntity;
    }
}

// Export for module systems or global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MovementSystem, PlayerFactory, PlayerManager };
} else {
    window.GamePlayer = { MovementSystem, PlayerFactory, PlayerManager };
}