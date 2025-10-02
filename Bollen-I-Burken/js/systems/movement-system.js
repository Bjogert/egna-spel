/* ==========================================
   MOVEMENT SYSTEM
   Handles player and AI movement plus collision checks
   ========================================== */

(function (global) {
    class MovementSystem extends System {
        constructor() {
            super('MovementSystem');
            this.moveSpeed = 0.15;
            this.arenaSize = CONFIG.arena.size;

            this.staticColliders = [];
            this.playerBounds = { width: 0.8, height: 1.0, depth: 0.8 };
            this.aiBounds = { width: 0.9, height: 1.1, depth: 0.9 };
            this._playerHasWon = false;  // Track win state
        }

        update(gameState) {
            // Allow movement during COUNTDOWN and PLAYING
            if (!gameState || (gameState.gamePhase !== GAME_STATES.PLAYING && gameState.gamePhase !== GAME_STATES.COUNTDOWN)) {
                // Reset win flag when not playing
                if (gameState && gameState.gamePhase === GAME_STATES.START_MENU) {
                    this._playerHasWon = false;
                }
                return;
            }

            this.collectStaticColliders(gameState);

            // Check for player win condition (reach can + press space)
            this.checkPlayerWinCondition(gameState);

            for (const entity of gameState.entities.values()) {
                const transform = entity.getComponent('Transform');
                const input = entity.getComponent('PlayerInput');

                if (transform && input) {
                    this.updatePlayerMovement(transform, input);
                } else if (transform && entity.getComponent('AIHunter')) {
                    this.updateAIMovement(transform);
                }

                const renderable = entity.getComponent('Renderable');
                if (transform && renderable && renderable.mesh) {
                    renderable.mesh.position.set(
                        transform.position.x,
                        transform.position.y,
                        transform.position.z
                    );
                    renderable.mesh.rotation.y = transform.rotation.y;

                    if (renderable.mesh.visionConeMesh) {
                        renderable.mesh.visionConeMesh.position.set(
                            transform.position.x,
                            transform.position.y,
                            transform.position.z
                        );
                        renderable.mesh.visionConeMesh.rotation.y = transform.rotation.y;

                        const visionCone = entity.getComponent('VisionCone');
                        if (visionCone) {
                            // UPDATE CONE GEOMETRY to match dynamic vision parameters
                            this.updateVisionConeGeometry(
                                renderable.mesh.visionConeMesh,
                                visionCone.angle,
                                visionCone.range
                            );

                            // Update color based on detection state
                            if (renderable.mesh.visionConeMesh.material) {
                                if (visionCone.canSeePlayer) {
                                    // PLAYER DETECTED - RED
                                    renderable.mesh.visionConeMesh.material.color.setHex(0xff0000);
                                    renderable.mesh.visionConeMesh.material.opacity = 0.9;
                                    renderable.mesh.visionConeMesh.material.linewidth = 3;
                                } else if (visionCone.isFocusing) {
                                    // FOCUSED (narrow beam) - BRIGHT YELLOW
                                    renderable.mesh.visionConeMesh.material.color.setHex(0xffdd00);
                                    renderable.mesh.visionConeMesh.material.opacity = 0.5;
                                    renderable.mesh.visionConeMesh.material.linewidth = 2;
                                } else {
                                    // NORMAL PATROL - ORANGE
                                    renderable.mesh.visionConeMesh.material.color.setHex(0xffaa00);
                                    renderable.mesh.visionConeMesh.material.opacity = 0.4;
                                    renderable.mesh.visionConeMesh.material.linewidth = 1;
                                }
                            }
                        }
                    }
                }
            }
        }

        updatePlayerMovement(transform, input) {
            if (transform.updatePrevious) {
                transform.updatePrevious();
            } else {
                transform.previousPosition = { ...transform.position };
            }

            transform.velocity.x = 0;
            transform.velocity.y = 0;
            transform.velocity.z = 0;

            const speed = this.moveSpeed;

            if (input.keys.forward) transform.velocity.z -= speed;
            if (input.keys.backward) transform.velocity.z += speed;
            if (input.keys.left) transform.velocity.x -= speed;
            if (input.keys.right) transform.velocity.x += speed;

            transform.position.x += transform.velocity.x;
            transform.position.z += transform.velocity.z;

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

            transform.position.x = correctedPosition.x;
            transform.position.z = correctedPosition.z;

            const limit = this.arenaSize - 0.5;
            transform.position.x = Math.max(-limit, Math.min(limit, transform.position.x));
            transform.position.z = Math.max(-limit, Math.min(limit, transform.position.z));

            if (transform.velocity.x !== 0 || transform.velocity.z !== 0) {
                transform.rotation.y = Math.atan2(transform.velocity.x, transform.velocity.z);
            }
        }

        updateAIMovement(transform) {
            if (transform.updatePrevious) {
                transform.updatePrevious();
            } else {
                transform.previousPosition = { ...transform.position };
            }

            transform.position.x += transform.velocity.x;
            transform.position.z += transform.velocity.z;

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

            transform.position.x = correctedPosition.x;
            transform.position.z = correctedPosition.z;

            const limit = this.arenaSize - 0.5;
            transform.position.x = Math.max(-limit, Math.min(limit, transform.position.x));
            transform.position.z = Math.max(-limit, Math.min(limit, transform.position.z));

            // NOTE: AI rotation is handled by AISystem via steering behaviors (aiComponent.heading)
            // Do NOT override it here based on velocity - causes vision cone desync!
        }

        collectStaticColliders(gameState) {
            this.staticColliders = [];

            for (const entity of gameState.entities.values()) {
                const collider = entity.getComponent('Collider');
                const transform = entity.getComponent('Transform');

                if (collider && transform && collider.isStatic && collider.blockMovement) {
                    this.staticColliders.push({ entity, collider, transform });
                }

                // Also collect child colliders for compound obstacles
                const parent = entity.getComponent('Parent');
                if (parent && parent.hasChildren()) {
                    for (const childId of parent.children) {
                        const childEntity = gameState.entities.get(childId);
                        if (childEntity) {
                            const childCollider = childEntity.getComponent('Collider');
                            const childTransform = childEntity.getComponent('Transform');

                            if (childCollider && childTransform && childCollider.isStatic && childCollider.blockMovement) {
                                this.staticColliders.push({
                                    entity: childEntity,
                                    collider: childCollider,
                                    transform: childTransform
                                });
                            }
                        }
                    }
                }
            }
        }

        checkObstacleCollision(oldPos, newPos, entityBounds) {
            if (this.staticColliders.length === 0) {
                return newPos;
            }

            const maxCorrectionAttempts = 3;
            let correctedPos = { ...newPos };
            let attempts = 0;

            for (const obstacle of this.staticColliders) {
                if (attempts >= maxCorrectionAttempts) {
                    console.warn('Collision correction limit reached, using original position');
                    return oldPos;
                }

                const obstaclePos = obstacle.transform.position;
                const obstacleCollider = obstacle.collider;

                if (obstacleCollider.type === 'box') {
                    const collision = obstacleCollider.checkBoxCollision(
                        correctedPos,
                        entityBounds,
                        obstaclePos,
                        obstacleCollider.bounds
                    );

                    if (collision) {
                        attempts++;

                        const slideResponse = obstacleCollider.calculateSlideResponse(
                            oldPos,
                            correctedPos,
                            entityBounds,
                            obstaclePos
                        );

                        if (slideResponse &&
                            !isNaN(slideResponse.x) && !isNaN(slideResponse.z) &&
                            isFinite(slideResponse.x) && isFinite(slideResponse.z)) {
                            correctedPos = slideResponse;
                        } else {
                            console.warn('Invalid slide response, using old position');
                            return oldPos;
                        }

                        if (global.DEBUG) {
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

        /**
         * Check if player reached the can and pressed space to win
         */
        checkPlayerWinCondition(gameState) {
            // Only check during active gameplay
            if (gameState.gamePhase !== GAME_STATES.PLAYING) {
                return;
            }

            // Prevent multiple triggers
            if (this._playerHasWon) return;

            const player = gameState.getLocalPlayer();
            if (!player) return;

            const playerTransform = player.getComponent('Transform');
            const playerInput = player.getComponent('PlayerInput');
            if (!playerTransform || !playerInput) return;

            // Get can position from config
            const canPosition = CONFIG.can.position;
            const canRadius = CONFIG.can.radius;

            // Calculate distance to can (2D distance, ignore Y)
            const dx = playerTransform.position.x - canPosition.x;
            const dz = playerTransform.position.z - canPosition.z;
            const distanceToCan = Math.sqrt(dx * dx + dz * dz);

            // Win condition: within 2 meters of can + pressing space
            const winDistance = canRadius + 1.5;  // Can radius + buffer

            if (distanceToCan <= winDistance && playerInput.keys.action1) {
                // PLAYER WINS!
                this._playerHasWon = true;
                Utils.log('🎉 PLAYER REACHED THE CAN AND WON!');

                // Use window instead of global for browser
                const gameEngine = window.gameEngine || global.gameEngine;

                if (gameEngine && typeof gameEngine.playerWin === 'function') {
                    Utils.log('Calling gameEngine.playerWin()');
                    gameEngine.playerWin();
                } else {
                    Utils.warn('gameEngine.playerWin not found, using fallback');
                    gameState.setGamePhase(GAME_STATES.PLAYER_WIN);

                    // Fallback: manually show menu
                    if (window.showStartMenu) {
                        Utils.log('Calling window.showStartMenu directly');
                        window.showStartMenu({
                            gameOver: true,
                            message: 'DUNK FÖR DIG!',
                            reason: 'won',
                            elapsedMs: 0
                        });
                    }
                }
            }
        }

        /**
         * Update vision cone mesh geometry to match dynamic vision parameters
         * This ensures the VISUAL cone always matches the DETECTION cone
         */
        updateVisionConeGeometry(coneMesh, angleInDegrees, range) {
            // Skip if no change (optimization)
            if (coneMesh._cachedAngle === angleInDegrees && coneMesh._cachedRange === range) {
                return;
            }

            coneMesh._cachedAngle = angleInDegrees;
            coneMesh._cachedRange = range;

            const angleInRadians = (angleInDegrees * Math.PI) / 180;
            const segments = 8;

            const vertices = [];
            const indices = [];

            // Apex of cone (AI position)
            vertices.push(0, 0, 0);

            // Arc vertices
            for (let i = 0; i <= segments; i++) {
                const angle = (-angleInRadians / 2) + (angleInRadians * i / segments);
                const x = Math.sin(angle) * range;
                const z = Math.cos(angle) * range;
                vertices.push(x, 0, z);
            }

            // Indices for lines
            // Lines from apex to arc
            for (let i = 1; i <= segments + 1; i++) {
                indices.push(0, i);
            }

            // Lines along arc
            for (let i = 1; i <= segments; i++) {
                indices.push(i, i + 1);
            }

            // Update geometry
            const positionAttribute = new THREE.Float32BufferAttribute(vertices, 3);
            coneMesh.geometry.setAttribute('position', positionAttribute);
            coneMesh.geometry.setIndex(indices);
            coneMesh.geometry.attributes.position.needsUpdate = true;
            coneMesh.geometry.computeBoundingSphere();
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = MovementSystem;
    } else {
        global.GameSystems = global.GameSystems || {};
        global.GameSystems.MovementSystem = MovementSystem;
        global.MovementSystem = MovementSystem;
    }
})(typeof window !== 'undefined' ? window : globalThis);