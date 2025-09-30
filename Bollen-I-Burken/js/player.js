/* ==========================================
   BOLLEN I BURKEN - PLAYER SYSTEM
   Simple working movement system
   ========================================== */

class MovementSystem extends System {
    constructor() {
        super('MovementSystem');
        this.moveSpeed = 0.15;
        this.arenaSize = CONFIG.arena.size;

        // Collision detection properties
        this.staticColliders = [];
        this.playerBounds = { width: 0.8, height: 1.0, depth: 0.8 }; // Player collision box
        this.aiBounds = { width: 0.9, height: 1.1, depth: 0.9 }; // AI collision box
    }

    update(gameState) {
        if (!gameState || gameState.gamePhase !== GAME_STATES.PLAYING) {
            return;
        }

        // Collect static colliders once per frame for performance
        this.collectStaticColliders(gameState);

        // Update all entities with movement components
        for (const entity of gameState.entities.values()) {
            const transform = entity.getComponent('Transform');
            const input = entity.getComponent('PlayerInput');

            // Handle player movement (with input) - no Movement component required
            if (transform && input) {
                this.updatePlayerMovement(transform, input);
            }
            // Handle AI movement (check for AIHunter component)
            else if (transform && entity.getComponent('AIHunter')) {
                this.updateAIMovement(transform);
            }

            // Update mesh position from transform
            const renderable = entity.getComponent('Renderable');
            if (transform && renderable && renderable.mesh) {
                renderable.mesh.position.set(
                    transform.position.x,
                    transform.position.y,
                    transform.position.z
                );
                renderable.mesh.rotation.y = transform.rotation.y;

                // Update vision cone position and rotation if it exists
                if (renderable.mesh.visionConeMesh) {
                    renderable.mesh.visionConeMesh.position.set(
                        transform.position.x,
                        transform.position.y,
                        transform.position.z
                    );
                    renderable.mesh.visionConeMesh.rotation.y = transform.rotation.y;

                    // Change vision cone color based on whether AI can see player
                    const visionCone = entity.getComponent('VisionCone');
                    if (visionCone && renderable.mesh.visionConeMesh.material) {
                        if (visionCone.canSeePlayer) {
                            renderable.mesh.visionConeMesh.material.color.setHex(0xff0000); // Bright red when player spotted
                            renderable.mesh.visionConeMesh.material.opacity = 0.9;
                            // Make vision cone more visible when player is spotted
                            renderable.mesh.visionConeMesh.material.linewidth = 3;
                        } else {
                            renderable.mesh.visionConeMesh.material.color.setHex(0xffaa00); // Orange when scanning
                            renderable.mesh.visionConeMesh.material.opacity = 0.4;
                            renderable.mesh.visionConeMesh.material.linewidth = 1;
                        }
                    }
                }
            }
        }
    }

    updatePlayerMovement(transform, input) {
        // Store previous position using proper method
        if (transform.updatePrevious) {
            transform.updatePrevious();
        } else {
            transform.previousPosition = { ...transform.position };
        }

        // Reset velocity
        transform.velocity.x = 0;
        transform.velocity.y = 0;
        transform.velocity.z = 0;

        // Calculate movement based on input
        const speed = this.moveSpeed;

        if (input.keys.forward) transform.velocity.z -= speed;
        if (input.keys.backward) transform.velocity.z += speed;
        if (input.keys.left) transform.velocity.x -= speed;
        if (input.keys.right) transform.velocity.x += speed;

        // Apply velocity to position
        transform.position.x += transform.velocity.x;
        transform.position.z += transform.velocity.z;

        // Check collision with obstacles BEFORE applying arena boundaries
        const newPosition = {
            x: transform.position.x,
            y: transform.position.y,
            z: transform.position.z
        };

        const correctedPosition = this.checkObstacleCollision(
            transform.previousPosition || transform.position,
            newPosition,
            this.playerBounds
        );

        // Apply corrected position
        transform.position.x = correctedPosition.x;
        transform.position.z = correctedPosition.z;

        // Apply arena boundaries - match arena wall positions exactly
        // Arena walls are positioned at ±arenaSize, so movement should go almost to the walls
        const limit = this.arenaSize - 0.5; // Leave small buffer for player collision
        transform.position.x = Math.max(-limit, Math.min(limit, transform.position.x));
        transform.position.z = Math.max(-limit, Math.min(limit, transform.position.z));

        // Update rotation based on movement
        if (transform.velocity.x !== 0 || transform.velocity.z !== 0) {
            transform.rotation.y = Math.atan2(transform.velocity.x, transform.velocity.z);
        }
    }

    updateAIMovement(transform) {
        // Store previous position using proper method
        if (transform.updatePrevious) {
            transform.updatePrevious();
        } else {
            transform.previousPosition = { ...transform.position };
        }

        // Apply AI velocity to position
        transform.position.x += transform.velocity.x;
        transform.position.z += transform.velocity.z;

        // Check collision with obstacles for AI as well
        const newPosition = {
            x: transform.position.x,
            y: transform.position.y,
            z: transform.position.z
        };

        const correctedPosition = this.checkObstacleCollision(
            transform.previousPosition || transform.position,
            newPosition,
            this.aiBounds
        );

        // Apply corrected position
        transform.position.x = correctedPosition.x;
        transform.position.z = correctedPosition.z;

        // Apply arena boundaries - match arena wall positions exactly
        // Arena walls are positioned at ±arenaSize, so movement should go almost to the walls
        const limit = this.arenaSize - 0.5; // Leave small buffer for AI collision
        transform.position.x = Math.max(-limit, Math.min(limit, transform.position.x));
        transform.position.z = Math.max(-limit, Math.min(limit, transform.position.z));

        // Update rotation based on movement
        if (transform.velocity.x !== 0 || transform.velocity.z !== 0) {
            transform.rotation.y = Math.atan2(transform.velocity.x, transform.velocity.z);
        }
    }

    // Collision Detection Methods
    collectStaticColliders(gameState) {
        // Reset colliders array
        this.staticColliders = [];

        // Find all entities with Collider components
        for (const entity of gameState.entities.values()) {
            const collider = entity.getComponent('Collider');
            const transform = entity.getComponent('Transform');

            if (collider && transform && collider.isStatic && collider.blockMovement) {
                this.staticColliders.push({
                    entity: entity,
                    collider: collider,
                    transform: transform
                });
            }
        }
    }

    checkObstacleCollision(oldPos, newPos, entityBounds) {
        // Safety check: if obstacles disabled or no colliders, skip collision
        if (this.staticColliders.length === 0) {
            return newPos; // No obstacles to check
        }

        // Safety check: prevent infinite loops by limiting correction attempts
        const maxCorrectionAttempts = 3;
        let correctedPos = { ...newPos };
        let attempts = 0;

        // Check collision with each static collider
        for (const obstacle of this.staticColliders) {
            if (attempts >= maxCorrectionAttempts) {
                console.warn('Collision correction limit reached, using original position');
                return oldPos; // Fallback to prevent infinite loops
            }

            const obstaclePos = obstacle.transform.position;
            const obstacleCollider = obstacle.collider;

            // Only handle box collisions for now
            if (obstacleCollider.type === 'box') {
                const collision = obstacleCollider.checkBoxCollision(
                    correctedPos,
                    entityBounds,
                    obstaclePos,
                    obstacleCollider.bounds
                );

                if (collision) {
                    attempts++;

                    // Calculate slide response
                    const slideResponse = obstacleCollider.calculateSlideResponse(
                        oldPos,
                        correctedPos,
                        entityBounds,
                        obstaclePos
                    );

                    // Ensure slide response doesn't create invalid position
                    if (slideResponse &&
                        !isNaN(slideResponse.x) && !isNaN(slideResponse.z) &&
                        isFinite(slideResponse.x) && isFinite(slideResponse.z)) {
                        correctedPos = slideResponse;
                    } else {
                        console.warn('Invalid slide response, using old position');
                        return oldPos;
                    }

                    // Debug logging for collision issues
                    if (window.DEBUG) {
                        console.log('Collision detected and corrected:', {
                            attempt: attempts,
                            oldPos: oldPos,
                            newPos: newPos,
                            correctedPos: correctedPos,
                            obstaclePos: obstaclePos
                        });
                    }
                }
            }
        }

        return correctedPos;
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

        mesh.castShadow = true;
        mesh.receiveShadow = false;
        scene.add(mesh);

        // Create player entity
        const entity = new Entity(playerId);
        entity.addComponent(new Transform(0, 0.5, 0));
        entity.addComponent(new Renderable(mesh));
        entity.addComponent(new Player(playerId, isLocal));

        if (isLocal) {
            entity.addComponent(new PlayerInput());
            material.color.setHex(0x00ff00);
            material.emissive.setHex(0x002200);
        } else {
            material.color.setHex(color);
        }

        Utils.log(`Created player: ${playerId} (local: ${isLocal})`);
        return entity;
    }
}

class PlayerManager {
    constructor(scene, gameEngine) {
        this.scene = scene;
        this.gameEngine = gameEngine;
        this.playerColors = [
            0x4a90e2, // Blue (local)
            0x7ed321, // Green
            0xf5a623, // Orange
            0xd0021b, // Red
            0x9013fe, // Purple
            0x50e3c2, // Teal
            0xb8e986, // Lime
            0xbd10e0  // Magenta
        ];
        this.colorIndex = 1;
        this.playerMeshes = new Map();
        this.playerEntities = new Map();
        this.hunterData = new Map();
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
        gameEntity.addComponent(new Renderable(mesh));

        this.playerMeshes.set(playerId, mesh);
        this.playerEntities.set(playerId, gameEntity);

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
        gameEntity.addComponent(new Renderable(mesh));

        this.playerMeshes.set(playerId, mesh);
        this.playerEntities.set(playerId, gameEntity);

        Utils.log(`Added remote player: ${playerId}`);
        return gameEntity;
    }

    removePlayer(playerId) {
        const entity = this.gameEngine.gameState.getPlayerEntity(playerId);
        if (entity) {
            const renderable = entity.getComponent('Renderable');
            if (renderable && renderable.mesh) {
                this.scene.remove(renderable.mesh);
                if (renderable.mesh.geometry) renderable.mesh.geometry.dispose();
                if (renderable.mesh.material) renderable.mesh.material.dispose();
            }
            Utils.log(`Removed player: ${playerId}`);
        } else {
            const mesh = this.playerMeshes.get(playerId);
            if (mesh) {
                this.scene.remove(mesh);
                if (mesh.geometry) mesh.geometry.dispose();
                if (mesh.material) {
                    if (Array.isArray(mesh.material)) {
                        mesh.material.forEach(material => material.dispose());
                    } else {
                        mesh.material.dispose();
                    }
                }
            }
        }

        this.gameEngine.gameState.removePlayer(playerId);
        this.playerMeshes.delete(playerId);
        this.playerEntities.delete(playerId);
    }

    addAIHunter(hunterId, position = null) {
        // Create AI hunter mesh
        const geometry = new THREE.BoxGeometry(0.9, 1.1, 0.9);
        const material = new THREE.MeshLambertMaterial({
            color: 0xff4444,
            transparent: true,
            opacity: 0.9
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;

        const spawnPos = position || { x: -5, y: 0.5, z: 5 };
        mesh.position.set(spawnPos.x, spawnPos.y, spawnPos.z);
        this.scene.add(mesh);

        // Create vision cone debug visualization
        const visionCone = this.createVisionConeDebugMesh(60, 8);
        visionCone.position.copy(mesh.position);
        this.scene.add(visionCone);

        // Create AI entity
        const aiEntity = this.gameEngine.gameState.createEntity();
        aiEntity.addComponent(new Transform(spawnPos.x, spawnPos.y, spawnPos.z));
        aiEntity.addComponent(new Movement(0.08));
        aiEntity.addComponent(new Renderable(mesh));
        aiEntity.addComponent(new AIHunter());
        aiEntity.addComponent(new VisionCone(60, 8)); // 60 degree cone, 8 unit range

        // Store vision cone mesh for updates
        mesh.visionConeMesh = visionCone;

        // Register with AI system
        const aiSystem = this.gameEngine.getSystem('AISystem');
        if (aiSystem) {
            aiSystem.addEntity(aiEntity);
            Utils.log(`AI hunter ${hunterId} registered with AISystem`);
        } else {
            Utils.warn(`AISystem not found - AI hunter ${hunterId} will not move`);
        }

        this.hunterData.set(hunterId, { entity: aiEntity, mesh, visionCone });

        Utils.log(`Added AI hunter: ${hunterId} at position (${spawnPos.x}, ${spawnPos.z})`);
        return aiEntity;
    }


    removeAIHunter(hunterId) {
        const hunterInfo = this.hunterData.get(hunterId);
        if (!hunterInfo) {
            return;
        }

        if (hunterInfo.mesh) {
            this.scene.remove(hunterInfo.mesh);
            if (hunterInfo.mesh.geometry) hunterInfo.mesh.geometry.dispose();
            if (hunterInfo.mesh.material) hunterInfo.mesh.material.dispose();
        }

        if (hunterInfo.visionCone) {
            this.scene.remove(hunterInfo.visionCone);
            if (hunterInfo.visionCone.geometry) hunterInfo.visionCone.geometry.dispose();
            if (hunterInfo.visionCone.material) hunterInfo.visionCone.material.dispose();
        }

        const aiSystem = this.gameEngine.getSystem('AISystem');
        if (aiSystem) {
            aiSystem.removeEntity(hunterInfo.entity);
        }

        if (hunterInfo.entity) {
            this.gameEngine.gameState.removeEntity(hunterInfo.entity.id);
        }

        this.hunterData.delete(hunterId);
        Utils.log(`Removed AI hunter: ${hunterId}`);
    }

    clearAll() {
        const playerIds = Array.from(this.playerMeshes.keys());
        playerIds.forEach(playerId => this.removePlayer(playerId));

        const hunterIds = Array.from(this.hunterData.keys());
        hunterIds.forEach(hunterId => this.removeAIHunter(hunterId));

        this.playerMeshes.clear();
        this.playerEntities.clear();
        this.hunterData.clear();
        this.colorIndex = 1;
    }

    createVisionConeDebugMesh(angleInDegrees, range) {
        // Create a wireframe cone to visualize AI vision
        const angleInRadians = (angleInDegrees * Math.PI) / 180;
        const segments = 8;

        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];

        // Cone center (AI position)
        vertices.push(0, 0, 0);

        // Create cone arc vertices
        for (let i = 0; i <= segments; i++) {
            const angle = (-angleInRadians / 2) + (angleInRadians * i / segments);
            const x = Math.sin(angle) * range;
            const z = Math.cos(angle) * range;
            vertices.push(x, 0, z);
        }

        // Create lines from center to arc points
        for (let i = 1; i <= segments + 1; i++) {
            indices.push(0, i);
        }

        // Create arc lines
        for (let i = 1; i <= segments; i++) {
            indices.push(i, i + 1);
        }

        geometry.setIndex(indices);
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        const material = new THREE.LineBasicMaterial({
            color: 0xffaa00, // Orange color for vision cone
            transparent: true,
            opacity: 0.6
        });

        return new THREE.LineSegments(geometry, material);
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MovementSystem, PlayerFactory, PlayerManager };
} else {
    window.GamePlayer = { MovementSystem, PlayerFactory, PlayerManager };
}