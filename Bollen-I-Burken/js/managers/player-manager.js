/* ==========================================
   PLAYER MANAGER
   Handles player and AI entity lifecycle
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

        addLocalPlayer(playerId) {
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
                    if (renderable.mesh.material) {
                        if (Array.isArray(renderable.mesh.material)) {
                            renderable.mesh.material.forEach(material => material.dispose());
                        } else {
                            renderable.mesh.material.dispose();
                        }
                    }
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

            const visionCone = this.createVisionConeDebugMesh(visionAngle, visionRange);
            visionCone.position.copy(mesh.position);
            this.scene.add(visionCone);

            // Create hearing radius circle (at max range)
            const hearingCircle = this.createHearingRadiusDebugMesh(100.0);
            hearingCircle.position.copy(mesh.position);
            this.scene.add(hearingCircle);

            const aiEntity = this.gameEngine.gameState.createEntity();
            const aiTransform = new Transform(spawnPos.x, spawnPos.y, spawnPos.z);
            aiEntity.addComponent(aiTransform);
            aiEntity.addComponent(new Movement(patrolSpeed));
            aiEntity.addComponent(new Renderable(mesh));

            // Create AI Hunter component with difficulty-based speeds
            const aiHunter = new AIHunter();
            aiHunter.speed = patrolSpeed;
            aiHunter.huntingSpeed = chaseSpeed;
            aiEntity.addComponent(aiHunter);

            aiEntity.addComponent(new VisionCone(visionAngle, visionRange));

            mesh.visionConeMesh = visionCone;
            mesh.hearingCircle = hearingCircle;

            const aiSystem = this.gameEngine.getSystem('AISystem');
            if (aiSystem) {
                aiSystem.addEntity(aiEntity);
                Utils.log(`AI hunter ${hunterId} registered with AISystem`);
            } else {
                Utils.warn(`AISystem not found - AI hunter ${hunterId} will not move`);
            }

            this.hunterData.set(hunterId, { entity: aiEntity, mesh, visionCone, hearingCircle });

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
})(typeof window !== 'undefined' ? window : globalThis);