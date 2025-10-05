/* ==========================================
   COLLISION DETECTION SYSTEM
   Handles ONLY collision detection and bounds checking
   KISS Architecture - Single responsibility
   ========================================== */

(function (global) {
    console.log('🔄 COLLISION DETECTION: Loading collision-detection-system.js file');
    
    class CollisionDetectionSystem extends System {
        constructor() {
            super('CollisionDetectionSystem');
            console.log('🔄 COLLISION DETECTION: Constructor called');
            
            // Collision configuration
            this.arenaSize = CONFIG.arena.size;
            this.staticColliders = [];
            this.playerBounds = { width: 0.8, height: 1.0, depth: 0.8 };
            this.aiBounds = { width: 0.9, height: 1.1, depth: 0.9 };
            this._playerHasWon = false;  // Track win state

            // TEMPORARY: Comment out tweaks to avoid browser cache issues  
            // this.registerTweaks();
        }

        registerTweaks() {
            if (!window.TweakPanel || typeof window.TweakPanel.addSlider !== 'function') {
                console.log('🔄 COLLISION DETECTION: TweakPanel not available, skipping tweak registration');
                return;
            }
            
            const category = 'Collision Detection';
            window.TweakPanel.addSlider('Player Width', this.playerBounds.width, 0.1, 2.0, 0.1, category, (value) => {
                this.playerBounds.width = value;
            });
            window.TweakPanel.addSlider('Player Depth', this.playerBounds.depth, 0.1, 2.0, 0.1, category, (value) => {
                this.playerBounds.depth = value;
            });
        }

        update(gameState, deltaTime) {
            if (!gameState || gameState.gamePhase === GAME_STATES.PAUSED || gameState.gamePhase === GAME_STATES.GAME_OVER) {
                return;
            }

            // Allow collision during COUNTDOWN and PLAYING
            if (gameState.gamePhase !== GAME_STATES.COUNTDOWN && gameState.gamePhase !== GAME_STATES.PLAYING) {
                // Reset win flag when not playing
                this._playerHasWon = false;
                return;
            }

            // Check for player win condition (reach can + press space)
            this.checkWinCondition(gameState);

            // Process collisions for all entities
            this.processCollisions(gameState);
            
            // Update visual meshes from transform positions (CRITICAL for visibility)
            this.updateVisualSync(gameState);
        }

        processCollisions(gameState) {
            // Check collisions for players
            for (const entity of gameState.entities.values()) {
                if (!entity.hasComponent('Player') || !entity.hasComponent('Transform')) {
                    continue;
                }
                const transform = entity.getComponent('Transform');
                if (!transform) continue;

                // Arena boundary collision
                this.checkArenaBounds(entity, transform);
                
                // Static collider collision
                this.checkStaticColliders(entity, transform);
                
                // AI collision (if needed)
                this.checkAICollisions(entity, transform, gameState);
            }
        }

        checkArenaBounds(entity, transform) {
            const halfSize = this.arenaSize / 2;
            const bounds = this.playerBounds;
            
            // Check X bounds
            if (transform.position.x - bounds.width/2 < -halfSize) {
                transform.position.x = -halfSize + bounds.width/2;
                if (transform.velocity) transform.velocity.x = 0;
            } else if (transform.position.x + bounds.width/2 > halfSize) {
                transform.position.x = halfSize - bounds.width/2;
                if (transform.velocity) transform.velocity.x = 0;
            }
            
            // Check Z bounds
            if (transform.position.z - bounds.depth/2 < -halfSize) {
                transform.position.z = -halfSize + bounds.depth/2;
                if (transform.velocity) transform.velocity.z = 0;
            } else if (transform.position.z + bounds.depth/2 > halfSize) {
                transform.position.z = halfSize - bounds.depth/2;
                if (transform.velocity) transform.velocity.z = 0;
            }
        }

        checkStaticColliders(entity, transform) {
            // Check collision with static objects
            for (const collider of this.staticColliders) {
                if (this.isColliding(transform, this.playerBounds, collider)) {
                    // Resolve collision by moving player away from collider
                    this.resolveCollision(transform, this.playerBounds, collider);
                }
            }
        }

        checkAICollisions(entity, transform, gameState) {
            // Optional: Check player-AI collisions
            for (const aiEntity of gameState.entities.values()) {
                if (!aiEntity.hasComponent('AIHunter') || !aiEntity.hasComponent('Transform')) {
                    continue;
                }
                if (aiEntity === entity) continue; // Don't collide with self
                
                const aiTransform = aiEntity.getComponent('Transform');
                if (!aiTransform) continue;

                if (this.isEntityColliding(transform, this.playerBounds, aiTransform, this.aiBounds)) {
                    // Handle player-AI collision
                    this.resolveEntityCollision(entity, transform, aiEntity, aiTransform);
                }
            }
        }

        checkWinCondition(gameState) {
            if (this._playerHasWon) return; // Already won

            for (const entity of gameState.entities.values()) {
                if (!entity.hasComponent('Player') || !entity.hasComponent('Transform') || !entity.hasComponent('PlayerInput')) {
                    continue;
                }
                const transform = entity.getComponent('Transform');
                const input = entity.getComponent('PlayerInput');

                if (!transform || !input) continue;

                // Check if player is near win condition (example: reach specific position)
                const winPosition = { x: 0, z: 0 }; // Example win position
                const distanceToWin = Math.sqrt(
                    Math.pow(transform.position.x - winPosition.x, 2) +
                    Math.pow(transform.position.z - winPosition.z, 2)
                );

                if (distanceToWin < 2.0 && input.keys.interact) {
                    this._playerHasWon = true;
                    console.log('🎉 COLLISION DETECTION: Player has won!');
                    // Trigger win event
                    if (gameState.onPlayerWin) {
                        gameState.onPlayerWin();
                    }
                }
            }
        }

        // Collision detection utilities
        isColliding(transform1, bounds1, staticCollider) {
            // AABB collision detection
            const left1 = transform1.position.x - bounds1.width / 2;
            const right1 = transform1.position.x + bounds1.width / 2;
            const top1 = transform1.position.z - bounds1.depth / 2;
            const bottom1 = transform1.position.z + bounds1.depth / 2;

            const left2 = staticCollider.position.x - staticCollider.width / 2;
            const right2 = staticCollider.position.x + staticCollider.width / 2;
            const top2 = staticCollider.position.z - staticCollider.depth / 2;
            const bottom2 = staticCollider.position.z + staticCollider.depth / 2;

            return !(left1 > right2 || right1 < left2 || top1 > bottom2 || bottom1 < top2);
        }

        isEntityColliding(transform1, bounds1, transform2, bounds2) {
            // Entity-to-entity collision detection
            const left1 = transform1.position.x - bounds1.width / 2;
            const right1 = transform1.position.x + bounds1.width / 2;
            const top1 = transform1.position.z - bounds1.depth / 2;
            const bottom1 = transform1.position.z + bounds1.depth / 2;

            const left2 = transform2.position.x - bounds2.width / 2;
            const right2 = transform2.position.x + bounds2.width / 2;
            const top2 = transform2.position.z - bounds2.depth / 2;
            const bottom2 = transform2.position.z + bounds2.depth / 2;

            return !(left1 > right2 || right1 < left2 || top1 > bottom2 || bottom1 < top2);
        }

        resolveCollision(transform, bounds, staticCollider) {
            // Simple collision resolution - push away from collider
            const centerX = transform.position.x;
            const centerZ = transform.position.z;
            const colliderCenterX = staticCollider.position.x;
            const colliderCenterZ = staticCollider.position.z;

            const deltaX = centerX - colliderCenterX;
            const deltaZ = centerZ - colliderCenterZ;
            const distance = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);

            if (distance > 0) {
                const pushDistance = (bounds.width + staticCollider.width) / 2;
                const pushX = (deltaX / distance) * pushDistance;
                const pushZ = (deltaZ / distance) * pushDistance;

                transform.position.x = colliderCenterX + pushX;
                transform.position.z = colliderCenterZ + pushZ;

                // Stop velocity in collision direction
                if (transform.velocity) {
                    transform.velocity.x = 0;
                    transform.velocity.z = 0;
                }
            }
        }

        resolveEntityCollision(entity1, transform1, entity2, transform2) {
            // Entity-to-entity collision resolution
            const deltaX = transform1.position.x - transform2.position.x;
            const deltaZ = transform1.position.z - transform2.position.z;
            const distance = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);

            if (distance > 0) {
                const pushDistance = (this.playerBounds.width + this.aiBounds.width) / 2;
                const pushX = (deltaX / distance) * (pushDistance - distance) * 0.5;
                const pushZ = (deltaZ / distance) * (pushDistance - distance) * 0.5;

                // Push both entities apart
                transform1.position.x += pushX;
                transform1.position.z += pushZ;
                transform2.position.x -= pushX;
                transform2.position.z -= pushZ;
            }
        }

        // API for other systems
        addStaticCollider(collider) {
            this.staticColliders.push(collider);
        }

        removeStaticCollider(collider) {
            const index = this.staticColliders.indexOf(collider);
            if (index > -1) {
                this.staticColliders.splice(index, 1);
            }
        }

        getPlayerBounds() {
            return { ...this.playerBounds };
        }

        getAIBounds() {
            return { ...this.aiBounds };
        }

        hasPlayerWon() {
            return this._playerHasWon;
        }
        
        updateVisualSync(gameState) {
            // Update visual mesh positions from transform positions
            // This is CRITICAL for making entities visible on screen
            for (const entity of gameState.entities.values()) {
                const transform = entity.getComponent('Transform');
                const renderable = entity.getComponent('Renderable');
                
                if (transform && renderable && renderable.mesh) {
                    // Update main mesh position and rotation
                    renderable.mesh.position.set(
                        transform.position.x,
                        transform.position.y,
                        transform.position.z
                    );
                    renderable.mesh.rotation.y = transform.rotation.y;

                    // Update vision cone position if it exists (for AI)
                    if (renderable.mesh.visionConeMesh) {
                        renderable.mesh.visionConeMesh.position.set(
                            transform.position.x,
                            transform.position.y,
                            transform.position.z
                        );
                        renderable.mesh.visionConeMesh.rotation.y = transform.rotation.y;
                    }
                }
            }
        }
    }

    // Register system globally
    global.CollisionDetectionSystem = CollisionDetectionSystem;
    console.log('🔄 COLLISION DETECTION: CollisionDetectionSystem class registered globally');

})(typeof window !== 'undefined' ? window : global);