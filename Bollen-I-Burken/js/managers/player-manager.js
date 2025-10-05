/* ==========================================
   PLAYER MANAGER - v2
   Handles player and AI entity lifecycle management
   ========================================== */

(function (global) {
    class PlayerManager {
        constructor(scene, gameEngine) {
            this.scene = scene;
            this.gameEngine = gameEngine;
            this.playerColors = [
                0x4a90e2,
                0x7ed321,
                0xf5a623,
                0xd0021b,
                0x9013fe,
                0x50e3c2,
                0xb8e986,
                0xbd10e0
            ];
            this.colorIndex = 1;
            this.playerMeshes = new Map();
            this.playerEntities = new Map();
            this.hunterData = new Map();
        }

        buildCharacterMesh(options = {}) {
            const {
                color = 0x4a90e2,
                playerId = null,
                opacity = 0.95,
                accentColor = null,
                type = 'player',
                namePrefix = 'character'
            } = options;

            let mesh;
            if (typeof GubbeBuilder !== 'undefined' && typeof GubbeBuilder.createCharacterMesh === 'function') {
                const suffix = (playerId !== null && playerId !== undefined) ? playerId : `visual_${Math.floor(Math.random() * 100000)}`;
                mesh = GubbeBuilder.createCharacterMesh({
                    baseColor: color,
                    accentColor: accentColor,
                    opacity: opacity,
                    name: `${namePrefix}_${suffix}`
                });
            } else {
                const geometry = new THREE.BoxGeometry(0.8, 1.0, 0.8);
                const material = new THREE.MeshLambertMaterial({
                    color: color,
                    transparent: opacity < 1,
                    opacity: opacity
                });
                mesh = new THREE.Mesh(geometry, material);
                mesh.castShadow = true;
                mesh.receiveShadow = false;
                mesh.userData = mesh.userData || {};
                mesh.userData.parts = mesh.userData.parts || {};
                mesh.userData.defaultPose = mesh.userData.defaultPose || {};
            }

            mesh.userData = mesh.userData || {};
            if (playerId !== null && playerId !== undefined) {
                mesh.userData.playerId = playerId;
            }
            mesh.userData.characterType = type;
            mesh.userData.baseColor = color;
            mesh.userData.accentColor = accentColor;

            if (typeof mesh.traverse === 'function') {
                mesh.traverse(child => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = false;
                    }
                });
            }

            if (!mesh.userData.parts) {
                mesh.userData.parts = {};
            }
            if (!mesh.userData.defaultPose) {
                mesh.userData.defaultPose = {};
            }

            return mesh;
        }

        positionCharacterMesh(mesh, position) {
            if (!mesh || !position) {
                return;
            }
            if (mesh.position && typeof mesh.position.set === 'function') {
                mesh.position.set(position.x || 0, position.y || 0, position.z || 0);
            }
        }

        applyLocalPlayerTint(mesh) {
            if (!mesh) {
                return;
            }
            const userData = mesh.userData || {};
            const parts = userData.parts || null;
            const emissiveHex = 0x002200;

            if (parts && parts.torso && parts.torso.material && parts.torso.material.emissive) {
                parts.torso.material.emissive.setHex(emissiveHex);
            } else if (mesh.material && mesh.material.emissive) {
                mesh.material.emissive.setHex(emissiveHex);
            }
        }

        disposeCharacterMesh(mesh) {
            if (!mesh) {
                return;
            }

            const disposeMaterial = (material) => {
                if (!material) {
                    return;
                }
                if (Array.isArray(material)) {
                    material.forEach(item => disposeMaterial(item));
                } else if (typeof material.dispose === 'function') {
                    material.dispose();
                }
            };

            if (typeof mesh.traverse === 'function') {
                mesh.traverse(child => {
                    if (child.isMesh) {
                        if (child.geometry && typeof child.geometry.dispose === 'function') {
                            child.geometry.dispose();
                        }
                        disposeMaterial(child.material);
                    }
                });
            } else {
                if (mesh.geometry && typeof mesh.geometry.dispose === 'function') {
                    mesh.geometry.dispose();
                }
                disposeMaterial(mesh.material);
            }
        }

        /**
         * 🔧 Helper to get physics world from physics system
         * @returns {CANNON.World|null} Physics world or null if not available
         */
        getPhysicsWorld() {
            // Try multiple access patterns
            if (global.physicsSystem && global.physicsSystem.physicsWorld && global.physicsSystem.physicsWorld.world) {
                return global.physicsSystem.physicsWorld.world;
            }
            
            if (this.gameEngine && this.gameEngine.getSystem) {
                const physicsSystem = this.gameEngine.getSystem('PhysicsSystem') || this.gameEngine.getSystem('physics');
                if (physicsSystem && physicsSystem.physicsWorld && physicsSystem.physicsWorld.world) {
                    return physicsSystem.physicsWorld.world;
                }
            }
            
            Utils.warn('⚠️ Physics world not available for ragdoll characters');
            return null;
        }

        addLocalPlayer(playerId) {
            // 🦴 Try to create ragdoll character first (GUBBAR Phase 1A)
            let playerCharacter = null;
            let ragdollData = null;

            // Get physics world from physics system
            const physicsWorld = this.getPhysicsWorld();
            
            // Check if ragdoll system is available and enabled
            const ragdollAvailable = physicsWorld && 
                                   typeof CHARACTER_CONFIG !== 'undefined' && 
                                   CHARACTER_CONFIG && 
                                   CHARACTER_CONFIG.ragdoll && 
                                   CHARACTER_CONFIG.ragdoll.enabled;
            
            if (ragdollAvailable) {
                try {
                    const ragdollResult = CharacterBuilder.createRagdollPlayer({
                        scale: 1.0,
                        castShadow: true
                    }, physicsWorld);
                    
                    playerCharacter = ragdollResult.visualGroup;
                    ragdollData = ragdollResult.physicsData;
                    Utils.log(`✅ Created ragdoll player with articulated legs: ${playerId}`);
                } catch (error) {
                    Utils.warn(`⚠️ Ragdoll player creation failed, falling back to simple character:`, error);
                    playerCharacter = CharacterBuilder.createPlayer({
                        scale: 1.0,
                        castShadow: true
                    });
                }
            } else {
                // Fallback to simple character
                playerCharacter = CharacterBuilder.createPlayer({
                    scale: 1.0,
                    castShadow: true
                });
                const reason = !physicsWorld ? "no physics world" :
                             typeof CHARACTER_CONFIG === 'undefined' ? "CHARACTER_CONFIG not loaded" :
                             !CHARACTER_CONFIG.ragdoll.enabled ? "ragdoll disabled" : "unknown";
                Utils.log(`📦 Created simple player character (${reason}): ${playerId}`);
            }
            
            // Position character at spawn point
            playerCharacter.position.set(0, 0.5, 0);
            this.scene.add(playerCharacter);

            // Create ECS entity and add components
            const gameEntity = this.gameEngine.gameState.addPlayer(playerId, true);
            gameEntity.addComponent(new Renderable(playerCharacter));

            // Add ragdoll physics data if available
            if (ragdollData) {
                gameEntity.addComponent('RagdollPhysics', ragdollData);
                
                // 🦵 Initialize with locomotion system (GUBBAR Phase 2)
                if (global.ragdollLocomotion) {
                    global.ragdollLocomotion.initializeCharacter(playerId, ragdollData);
                    Utils.log(`🦵 Initialized ragdoll locomotion for LOCAL player: ${playerId}`);
                }
            } else {
                // � FORCE DUMMY RAGDOLL: Always add ragdoll component to trigger locomotion
                Utils.log(`🔧 Adding dummy ragdoll physics to enable leg movement for ${playerId}`);
                const dummyRagdollData = {
                    isTemporary: true,
                    physicsBodies: null,
                    joints: null,
                    visualMeshes: null
                };
                gameEntity.addComponent('RagdollPhysics', dummyRagdollData);
                
                // Initialize locomotion system even with dummy data
                if (global.ragdollLocomotion) {
                    global.ragdollLocomotion.initializeCharacter(playerId, dummyRagdollData);
                    Utils.log(`🦵 Initialized DUMMY ragdoll locomotion for LOCAL player: ${playerId}`);
                }
            }

            // Store references
            this.playerMeshes.set(playerId, playerCharacter);
            this.playerEntities.set(playerId, gameEntity);

            // Register with leg animator
            const movementSystem = this.gameEngine.getSystem('MovementSystem');
            if (movementSystem && movementSystem.legAnimator) {
                movementSystem.legAnimator.registerCharacter(playerId, playerCharacter);
            }

            const characterType = ragdollData ? "ragdoll character with articulated legs" : "simple character with head + body";
            Utils.log(`Added local player as ${characterType}: ${playerId}`);
            return gameEntity;
        }

        addRemotePlayer(playerId) {
            const color = this.playerColors[this.colorIndex % this.playerColors.length];
            this.colorIndex++;

            // 🦴 Try to create ragdoll character first (GUBBAR Phase 1A)
            let playerCharacter = null;
            let ragdollData = null;

            // Get physics world from physics system
            const physicsWorld = this.getPhysicsWorld();
            
            // Check if ragdoll system is available and enabled
            const ragdollAvailable = physicsWorld && 
                                   typeof CHARACTER_CONFIG !== 'undefined' && 
                                   CHARACTER_CONFIG && 
                                   CHARACTER_CONFIG.ragdoll && 
                                   CHARACTER_CONFIG.ragdoll.enabled;
            
            if (ragdollAvailable) {
                try {
                    const ragdollResult = CharacterBuilder.createRagdollPlayer({
                        scale: 1.0,
                        castShadow: true
                    }, physicsWorld);
                    
                    playerCharacter = ragdollResult.visualGroup;
                    ragdollData = ragdollResult.physicsData;
                    Utils.log(`✅ Created ragdoll remote player with articulated legs: ${playerId}`);
                } catch (error) {
                    Utils.warn(`⚠️ Ragdoll remote player creation failed, falling back to simple character:`, error);
                    playerCharacter = CharacterBuilder.createPlayer({
                        scale: 1.0,
                        castShadow: true
                    });
                }
            } else {
                // Fallback to simple character
                playerCharacter = CharacterBuilder.createPlayer({
                    scale: 1.0,
                    castShadow: true
                });
                const reason = !physicsWorld ? "no physics world" :
                             typeof CHARACTER_CONFIG === 'undefined' ? "CHARACTER_CONFIG not loaded" :
                             !CHARACTER_CONFIG.ragdoll.enabled ? "ragdoll disabled" : "unknown";
                Utils.log(`📦 Created simple remote player character (${reason}): ${playerId}`);
            }
            
            // Update color to match assigned player color
            CharacterBuilder.updateCharacterColor(playerCharacter, color);
            
            // Position character at spawn point
            playerCharacter.position.set(0, 0.5, 0);
            this.scene.add(playerCharacter);

            // Create ECS entity and add components
            const gameEntity = this.gameEngine.gameState.addPlayer(playerId, false);
            gameEntity.addComponent(new Renderable(playerCharacter));

            // Add ragdoll physics data if available
            if (ragdollData) {
                gameEntity.addComponent('RagdollPhysics', ragdollData);
                
                // 🦵 Initialize with locomotion system (GUBBAR Phase 2)
                if (global.ragdollLocomotion) {
                    global.ragdollLocomotion.initializeCharacter(playerId, ragdollData);
                    Utils.log(`🦵 Initialized ragdoll locomotion for REMOTE player: ${playerId}`);
                }
            } else {
                // � FORCE DUMMY RAGDOLL: Always add ragdoll component to trigger locomotion
                Utils.log(`🔧 Adding dummy ragdoll physics to enable leg movement for ${playerId}`);
                const dummyRagdollData = {
                    isTemporary: true,
                    physicsBodies: null,
                    joints: null,
                    visualMeshes: null
                };
                gameEntity.addComponent('RagdollPhysics', dummyRagdollData);
                
                // Initialize locomotion system even with dummy data
                if (global.ragdollLocomotion) {
                    global.ragdollLocomotion.initializeCharacter(playerId, dummyRagdollData);
                    Utils.log(`🦵 Initialized DUMMY ragdoll locomotion for REMOTE player: ${playerId}`);
                }
            }

            // Store references
            this.playerMeshes.set(playerId, playerCharacter);
            this.playerEntities.set(playerId, gameEntity);

            // Register with leg animator
            const movementSystem = this.gameEngine.getSystem('MovementSystem');
            if (movementSystem && movementSystem.legAnimator) {
                movementSystem.legAnimator.registerCharacter(playerId, playerCharacter);
            }

            const characterType = ragdollData ? "ragdoll character with articulated legs" : "simple character with head + body";
            Utils.log(`Added remote player as ${characterType}: ${playerId}`);
            return gameEntity;
        }

        removePlayer(playerId) {
            const entity = this.gameEngine.gameState.getPlayerEntity(playerId);
            if (entity) {
                const renderable = entity.getComponent('Renderable');
                if (renderable && renderable.mesh) {
                    this.scene.remove(renderable.mesh);
                    this.disposeCharacterMesh(renderable.mesh);
                }
                Utils.log(`Removed player: ${playerId}`);
            } else {
                const mesh = this.playerMeshes.get(playerId);
                if (mesh) {
                    this.scene.remove(mesh);
                    this.disposeCharacterMesh(mesh);
                }
            }

            this.gameEngine.gameState.removePlayer(playerId);
            this.playerMeshes.delete(playerId);
            this.playerEntities.delete(playerId);
        }

        addAIHunter(hunterId, position = null) {
            // Get difficulty settings
            const difficultyLevel = CONFIG.currentDifficulty;
            const difficulty = CONFIG.difficulties[difficultyLevel];

            const patrolSpeed = difficulty.ai.patrolSpeed;
            const chaseSpeed = difficulty.ai.chaseSpeed;
            const visionAngle = difficulty.ai.visionAngle;
            const visionRange = difficulty.ai.visionRange;

            Utils.log(`Creating AI Hunter with difficulty: ${difficulty.name}`);
            Utils.log(`  Patrol Speed: ${patrolSpeed}, Chase Speed: ${chaseSpeed}`);
            Utils.log(`  Vision: ${visionAngle}° angle, ${visionRange}m range`);

            // Create AI hunter character using CharacterBuilder (GUBBAR Phase 1)
            const aiCharacter = CharacterBuilder.createAIHunter({
                scale: 1.1,  // Slightly bigger than player
                castShadow: true
            });

            // Position AI at spawn location
            const spawnPos = position || CONFIG.ai.hunter.spawnPosition;
            aiCharacter.position.set(spawnPos.x, spawnPos.y, spawnPos.z);
            this.scene.add(aiCharacter);

            const visionCone = this.createVisionConeDebugMesh(visionAngle, visionRange);
            visionCone.position.copy(aiCharacter.position);
            this.scene.add(visionCone);

            // Create hearing radius circle (at max range)
            const hearingCircle = this.createHearingRadiusDebugMesh(100.0);
            hearingCircle.position.copy(aiCharacter.position);
            this.scene.add(hearingCircle);

            const aiEntity = this.gameEngine.gameState.createEntity();
            const aiTransform = new Transform(spawnPos.x, spawnPos.y, spawnPos.z);
            aiEntity.addComponent(aiTransform);
            aiEntity.addComponent(new Movement(patrolSpeed));
            aiEntity.addComponent(new Renderable(aiCharacter));

            // Add physics body to AI (GUBBAR Phase 1)
            if (CONFIG.physics.enabled && typeof BodyFactory !== 'undefined' && global.physicsSystem) {
                const aiPhysicsBody = BodyFactory.createAIBody(spawnPos);
                global.physicsSystem.addBody(aiPhysicsBody);
                aiEntity.addComponent(new PhysicsBody(aiPhysicsBody));
                Utils.log(`  Physics body added to AI hunter ${hunterId}`);
            }

            // Create AI Hunter component with difficulty-based speeds
            const aiHunter = new AIHunter();
            aiHunter.speed = patrolSpeed;
            aiHunter.huntingSpeed = chaseSpeed;
            aiEntity.addComponent(aiHunter);

            aiEntity.addComponent(new VisionCone(visionAngle, visionRange));

            aiCharacter.visionConeMesh = visionCone;
            aiCharacter.hearingCircle = hearingCircle;

            const aiSystem = this.gameEngine.getSystem('AISystem');
            if (aiSystem) {
                aiSystem.addEntity(aiEntity);
                Utils.log(`AI hunter ${hunterId} registered with AISystem`);
            } else {
                Utils.warn(`AISystem not found - AI hunter ${hunterId} will not move`);
            }

            this.hunterData.set(hunterId, { entity: aiEntity, mesh: aiCharacter, visionCone, hearingCircle });

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
                this.disposeCharacterMesh(hunterInfo.mesh);
            }

            if (hunterInfo.visionCone) {
                this.scene.remove(hunterInfo.visionCone);
                if (hunterInfo.visionCone.geometry) hunterInfo.visionCone.geometry.dispose();
                if (hunterInfo.visionCone.material) hunterInfo.visionCone.material.dispose();
            }

            if (hunterInfo.hearingCircle) {
                this.scene.remove(hunterInfo.hearingCircle);
                if (hunterInfo.hearingCircle.geometry) hunterInfo.hearingCircle.geometry.dispose();
                if (hunterInfo.hearingCircle.material) hunterInfo.hearingCircle.material.dispose();
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
            const angleInRadians = (angleInDegrees * Math.PI) / 180;
            const segments = 8;

            const geometry = new THREE.BufferGeometry();
            const vertices = [];
            const indices = [];

            vertices.push(0, 0, 0);

            for (let i = 0; i <= segments; i++) {
                const angle = (-angleInRadians / 2) + (angleInRadians * i / segments);
                const x = Math.sin(angle) * range;
                const z = Math.cos(angle) * range;
                vertices.push(x, 0, z);
            }

            for (let i = 1; i <= segments + 1; i++) {
                indices.push(0, i);
            }

            for (let i = 1; i <= segments; i++) {
                indices.push(i, i + 1);
            }

            geometry.setIndex(indices);
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

            const material = new THREE.LineBasicMaterial({
                color: 0xffaa00,
                transparent: true,
                opacity: 0.6
            });

            return new THREE.LineSegments(geometry, material);
        }

        createHearingRadiusDebugMesh(radius) {
            const segments = 32; // Smooth circle
            const geometry = new THREE.BufferGeometry();
            const vertices = [];

            // Create circle vertices
            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                vertices.push(x, 0.1, z); // Slightly above ground
            }

            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

            const material = new THREE.LineBasicMaterial({
                color: 0x00ff00, // Green for hearing
                transparent: true,
                opacity: 0.3,
                linewidth: 2
            });

            return new THREE.Line(geometry, material);
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PlayerManager;
    } else {
        global.GameManagers = global.GameManagers || {};
        global.GameManagers.PlayerManager = PlayerManager;
        global.PlayerManager = PlayerManager;
    }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));