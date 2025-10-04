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

            // Player acceleration tracking
            this.playerCurrentSpeed = 0;
            this.playerMaxSpeed = 0.16;
            this.playerAcceleration = 0.23;
            this.playerDeceleration = 0.35;
            this.playerDirection = { x: 0, z: 0 };  // Last movement direction (for sliding)

            // Sneaking
            this.isSneaking = false;
            this.sneakMaxSpeed = 0.03;  // Max speed when sneaking (absolute value)

            // Momentum/drift
            this.momentumFactor = 0.85;  // How much old velocity carries over (0-1, higher = more drift)
            this.driftFriction = 0.2;  // How quickly drift decays (higher = less slide)

            // Pre-compute conversion between per-tick (ECS) and per-second (physics) velocities
            const defaultTickRate = (CONFIG.game && CONFIG.game.tickRate) || 60;
            const fallbackTimeStep = 1 / defaultTickRate;
            const physicsEnabled = CONFIG.physics && CONFIG.physics.enabled;
            const configuredTimeStep = physicsEnabled && CONFIG.physics.timeStep ? CONFIG.physics.timeStep : null;
            this.physicsTimeStep = (configuredTimeStep && configuredTimeStep > 0) ? configuredTimeStep : fallbackTimeStep;
            this.physicsVelocityScale = physicsEnabled ? (1 / this.physicsTimeStep) : 1;

            this.registerTweaks();
        }

        registerTweaks() {
            if (!window.TweakPanel) return;

            window.TweakPanel.addSetting('Player', 'Max Speed', {
                type: 'range',
                min: 0.05,
                max: 0.3,
                step: 0.01,
                decimals: 2,
                label: 'Max Speed',
                getValue: () => this.playerMaxSpeed,
                setValue: (v) => this.playerMaxSpeed = v
            });

            window.TweakPanel.addSetting('Player', 'Acceleration', {
                type: 'range',
                min: 0.05,
                max: 0.5,
                step: 0.01,
                decimals: 2,
                label: 'Acceleration',
                getValue: () => this.playerAcceleration,
                setValue: (v) => this.playerAcceleration = v
            });

            window.TweakPanel.addSetting('Player', 'Deceleration', {
                type: 'range',
                min: 0.1,
                max: 1.0,
                step: 0.05,
                decimals: 2,
                label: 'Deceleration',
                getValue: () => this.playerDeceleration,
                setValue: (v) => this.playerDeceleration = v
            });

            window.TweakPanel.addSetting('Player', 'Sneak Max Speed', {
                type: 'range',
                min: 0.02,
                max: 0.15,
                step: 0.01,
                decimals: 2,
                label: 'Sneak Max Speed',
                getValue: () => this.sneakMaxSpeed,
                setValue: (v) => this.sneakMaxSpeed = v
            });

            window.TweakPanel.addSetting('Player', 'Momentum', {
                type: 'range',
                min: 0.0,
                max: 0.95,
                step: 0.05,
                decimals: 2,
                label: 'Momentum (overspeed tolerance)',
                getValue: () => this.momentumFactor,
                setValue: (v) => this.momentumFactor = v
            });

            window.TweakPanel.addSetting('Player', 'Drift Friction', {
                type: 'range',
                min: 0.05,
                max: 0.5,
                step: 0.05,
                decimals: 2,
                label: 'Drift Friction (higher=less slide)',
                getValue: () => this.driftFriction,
                setValue: (v) => this.driftFriction = v
            });
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
                    this.updatePlayerMovement(transform, input, entity);
                } else if (transform && entity.getComponent('AIHunter')) {
                    this.updateAIMovement(transform, entity);
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

                    // Update hearing circle
                    if (renderable.mesh.hearingCircle) {
                        renderable.mesh.hearingCircle.position.set(
                            transform.position.x,
                            0.1, // Fixed height slightly above ground
                            transform.position.z
                        );

                        // Get player speed to calculate effective hearing range
                        const movementSystem = window.movementSystem;
                        const audioSystem = window.audioSystem;
                        const aiSystem = window.aiSystem;

                        if (movementSystem && audioSystem && aiSystem) {
                            const playerSpeed = movementSystem.playerCurrentSpeed;
                            const isSneaking = movementSystem.isSneaking;

                            // Calculate sound level (same logic as AI hearing)
                            let soundLevel = playerSpeed / movementSystem.playerMaxSpeed;
                            if (isSneaking) {
                                soundLevel *= audioSystem.sneakVolumeMultiplier;
                            }

                            // Effective hearing range
                            const baseRange = aiSystem.hearingRange || 8.0;
                            const effectiveRange = baseRange * Math.max(soundLevel, 0.1); // Min 10% visible

                            // Scale the circle to match effective range
                            const scale = effectiveRange / 100.0; // 100.0 is the base mesh radius
                            renderable.mesh.hearingCircle.scale.set(scale, 1, scale);

                            // Update opacity based on sound level
                            if (renderable.mesh.hearingCircle.material) {
                                renderable.mesh.hearingCircle.material.opacity = 0.2 + (soundLevel * 0.3);
                            }
                        }
                    }
                }
            }
        }

        updatePlayerMovement(transform, input, entity) {
            // Get physics body if available
            const physicsBody = entity ? entity.getComponent('PhysicsBody') : null;

            if (transform.updatePrevious) {
                transform.updatePrevious();
            } else {
                transform.previousPosition = { ...transform.position };
            }

            // Get desired direction from input
            let desiredX = 0;
            let desiredZ = 0;

            if (input.keys.forward) desiredZ -= 1;
            if (input.keys.backward) desiredZ += 1;
            if (input.keys.left) desiredX -= 1;
            if (input.keys.right) desiredX += 1;

            // Check if player is trying to move
            const isMoving = desiredX !== 0 || desiredZ !== 0;

            // Normalize input direction
            if (isMoving) {
                const magnitude = Math.sqrt(desiredX * desiredX + desiredZ * desiredZ);
                if (magnitude > 0) {
                    desiredX /= magnitude;
                    desiredZ /= magnitude;
                }
                this.playerDirection.x = desiredX;
                this.playerDirection.z = desiredZ;
            }

            // DRIFT MECHANICS: Add acceleration forces to existing velocity
            const dt = 1 / 60;
            const effectiveMaxSpeed = this.isSneaking
                ? this.sneakMaxSpeed
                : this.playerMaxSpeed;

            if (isMoving) {
                // Add acceleration force in input direction (builds speed in new direction)
                const accelForce = this.playerAcceleration * dt;
                transform.velocity.x += desiredX * accelForce;
                transform.velocity.z += desiredZ * accelForce;
                console.log(`[MOVE DEBUG] input:(${desiredX.toFixed(2)}, ${desiredZ.toFixed(2)}), accel:${accelForce.toFixed(3)}, velocity:(${transform.velocity.x.toFixed(3)}, ${transform.velocity.z.toFixed(3)})`);
            }

            // Always apply friction/deceleration to current velocity
            const currentSpeed = Math.sqrt(transform.velocity.x ** 2 + transform.velocity.z ** 2);

            // Store current player speed for AI hearing detection
            this.playerCurrentSpeed = currentSpeed;

            if (currentSpeed > 0.001) {
                let frictionAmount;

                if (isMoving && currentSpeed > effectiveMaxSpeed) {
                    // Over max speed - apply drift friction
                    frictionAmount = (1 - this.momentumFactor) * this.driftFriction;
                } else if (!isMoving) {
                    // Not moving - apply deceleration
                    frictionAmount = this.playerDeceleration * dt / currentSpeed;
                } else {
                    // Moving but under max speed - minimal friction
                    frictionAmount = 0.02;
                }

                const frictionFactor = Math.max(0, 1 - frictionAmount);
                transform.velocity.x *= frictionFactor;
                transform.velocity.z *= frictionFactor;

                // Clamp to max speed
                const newSpeed = Math.sqrt(transform.velocity.x ** 2 + transform.velocity.z ** 2);
                if (newSpeed > effectiveMaxSpeed * 1.5) {  // Allow some overspeed for drift
                    transform.velocity.x *= (effectiveMaxSpeed * 1.5) / newSpeed;
                    transform.velocity.z *= (effectiveMaxSpeed * 1.5) / newSpeed;
                }
            } else {
                transform.velocity.x = 0;
                transform.velocity.z = 0;
            }

            transform.velocity.y = 0;

            if (CONFIG.physics.enabled && physicsBody && physicsBody.body) {
                // PHYSICS-BASED MOVEMENT (GUBBAR Phase 1)
                // Wake up body if sleeping (important for player movement!)
                physicsBody.wakeUp();

                // Apply velocity to physics body - physics handles collision
                const velocityScale = this.physicsVelocityScale || 1;
                physicsBody.body.velocity.x = transform.velocity.x * velocityScale;
                physicsBody.body.velocity.z = transform.velocity.z * velocityScale;
                physicsBody.body.velocity.y = 0;
                // Physics sync will update transform.position in next frame
            } else if (!CONFIG.physics.enabled) {
                // FALLBACK: Old collision system (no physics)
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
            } else {
                // Physics should be enabled, but no body found - minimal fallback to avoid freezing
                transform.position.x += transform.velocity.x;
                transform.position.z += transform.velocity.z;
            }
            // Rotate player to face INPUT direction (not velocity/drift direction!)
            if (isMoving) {
                // Instantly face the direction player is pressing
                transform.rotation.y = Math.atan2(desiredX, desiredZ);
            } else if (this.playerDirection.x !== 0 || this.playerDirection.z !== 0) {
                // When stopped, keep facing last input direction
                transform.rotation.y = Math.atan2(this.playerDirection.x, this.playerDirection.z);
            }
        }

        updateAIMovement(transform, entity) {
            // Get physics body if available
            const physicsBody = entity ? entity.getComponent('PhysicsBody') : null;

            if (CONFIG.physics.enabled && physicsBody && physicsBody.body) {
                // PHYSICS-BASED MOVEMENT (GUBBAR Phase 1)
                // Wake up body if sleeping (important for AI movement!)
                physicsBody.wakeUp();

                // Set velocity directly on physics body (AI uses velocity-based steering)
                const velocityScale = this.physicsVelocityScale || 1;
                physicsBody.body.velocity.x = transform.velocity.x * velocityScale;
                physicsBody.body.velocity.z = transform.velocity.z * velocityScale;
                physicsBody.body.velocity.y = 0;  // No vertical movement
                // Physics sync will update transform.position in next frame
            } else if (!CONFIG.physics.enabled) {
                // FALLBACK: Old collision system (no physics)
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
            } else {
                // Physics should be enabled, but no body found - minimal fallback to avoid freezing
                transform.position.x += transform.velocity.x;
                transform.position.z += transform.velocity.z;
            }
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
                            message: 'DUNK FÖR MIG!',
                            reason: 'won',
                            elapsedMs: 0
                        });
                    }
                }
            }
        }

        applyPlayerPush(gameState, playerEntity) {
            if (!playerEntity) {
                return;
            }

            const pushStrength = (CONFIG.player && typeof CONFIG.player.pushStrength === 'number') ? CONFIG.player.pushStrength : 0.6;
            const pushRadius = (CONFIG.player && typeof CONFIG.player.pushRadius === 'number') ? CONFIG.player.pushRadius : 1.0;

            if (pushStrength <= 0 || pushRadius <= 0) {
                return;
            }

            const playerPhysics = playerEntity.getComponent('PhysicsBody');
            const playerTransform = playerEntity.getComponent('Transform');

            if (!playerPhysics || !playerPhysics.body || !playerTransform) {
                return;
            }

            const velocity = playerPhysics.body.velocity;
            const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
            if (speed < 0.05) {
                return;
            }

            const dirX = velocity.x / speed;
            const dirZ = velocity.z / speed;
            const impulseBase = pushStrength * speed;

            for (const entity of gameState.entities.values()) {
                if (entity === playerEntity || !entity.getComponent('AIHunter')) {
                    continue;
                }

                const aiPhysics = entity.getComponent('PhysicsBody');
                const aiTransform = entity.getComponent('Transform');

                if (!aiPhysics || !aiPhysics.body || !aiTransform) {
                    continue;
                }

                const dx = aiTransform.position.x - playerTransform.position.x;
                const dz = aiTransform.position.z - playerTransform.position.z;
                const distance = Math.sqrt(dx * dx + dz * dz);

                if (distance > pushRadius) {
                    continue;
                }

                const separation = Math.max(0, pushRadius - distance);
                aiPhysics.body.velocity.x += dirX * impulseBase;
                aiPhysics.body.velocity.z += dirZ * impulseBase;

                if (distance > 0.0001 && separation > 0) {
                    const awayX = dx / distance;
                    const awayZ = dz / distance;
                    const separationImpulse = separation * pushStrength * 2;
                    aiPhysics.body.velocity.x += awayX * separationImpulse;
                    aiPhysics.body.velocity.z += awayZ * separationImpulse;
                }

                aiPhysics.body.velocity.y = 0;

                if (aiTransform.velocity) {
                    aiTransform.velocity.x = aiPhysics.body.velocity.x * this.physicsTimeStep;
                    aiTransform.velocity.z = aiPhysics.body.velocity.z * this.physicsTimeStep;
                }

                aiPhysics.body.wakeUp();
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


