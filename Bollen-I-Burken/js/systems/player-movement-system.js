/* ==========================================
   PLAYER MOVEMENT SYSTEM
   Handles ONLY player movement physics and input
   KISS Architecture - Single responsibility
   ========================================== */

(function (global) {
    console.log('🔄 PLAYER MOVEMENT: Loading player-movement-system.js file');
    
    class PlayerMovementSystem extends System {
        constructor() {
            super('PlayerMovementSystem');
            console.log('🔄 PLAYER MOVEMENT: Constructor called');
            
            // Player movement configuration
            this.moveSpeed = 0.15;
            this.playerMaxSpeed = 0.16;
            this.playerAcceleration = 0.23;
            this.playerDeceleration = 0.35;
            this.playerDirection = { x: 0, z: 0 };  // Last movement direction (for sliding)
            this.playerCurrentSpeed = 0; // For AI hearing detection

            // Sneaking
            this.isSneaking = false;
            this.sneakMaxSpeed = 0.03;  // Max speed when sneaking (absolute value)

            // Momentum/drift physics
            this.momentumFactor = 0.85;  // How much old velocity carries over (0-1, higher = more drift)
            this.driftFriction = 0.2;  // How quickly drift decays (higher = less slide)

            // Physics timing
            const defaultTickRate = (CONFIG.game && CONFIG.game.tickRate) || 60;
            const fallbackTimeStep = 1 / defaultTickRate;
            const physicsEnabled = CONFIG.physics && CONFIG.physics.enabled;
            const configuredTimeStep = physicsEnabled && CONFIG.physics.timeStep ? CONFIG.physics.timeStep : null;
            this.physicsTimeStep = (configuredTimeStep && configuredTimeStep > 0) ? configuredTimeStep : fallbackTimeStep;
            this.physicsVelocityScale = physicsEnabled ? (1 / this.physicsTimeStep) : 1;

            // TEMPORARY: Comment out tweaks to avoid browser cache issues
            // this.registerTweaks();
        }

        registerTweaks() {
            if (!window.TweakPanel || typeof window.TweakPanel.addSlider !== 'function') {
                console.log('🔄 PLAYER MOVEMENT: TweakPanel not available, skipping tweak registration');
                return;
            }
            
            const category = 'Player Movement';
            window.TweakPanel.addSlider('Max Speed', this.playerMaxSpeed, 0.05, 0.5, 0.01, category, (value) => {
                this.playerMaxSpeed = value;
            });
            window.TweakPanel.addSlider('Acceleration', this.playerAcceleration, 0.1, 1.0, 0.01, category, (value) => {
                this.playerAcceleration = value;
            });
            window.TweakPanel.addSlider('Momentum Factor', this.momentumFactor, 0.0, 1.0, 0.01, category, (value) => {
                this.momentumFactor = value;
            });
        }

        update(gameState, deltaTime) {
            if (!gameState || gameState.gamePhase === GAME_STATES.PAUSED || gameState.gamePhase === GAME_STATES.GAME_OVER) {
                return;
            }

            // Allow movement during COUNTDOWN and PLAYING
            if (gameState.gamePhase !== GAME_STATES.COUNTDOWN && gameState.gamePhase !== GAME_STATES.PLAYING) {
                return;
            }

            // DEBUG: Log that player movement system is running
            if (!this.logCounter) this.logCounter = 0;
            if (this.logCounter % 60 === 0) { // Log every 60 frames (roughly once per second)
                console.log('🎮 PLAYER MOVEMENT SYSTEM: Running update', {
                    gameState: gameState ? 'defined' : 'undefined',
                    gamePhase: gameState?.gamePhase,
                    entityCount: gameState?.entities?.size
                });
            }
            this.logCounter++;

            // Process player movement
            this.processPlayerMovement(gameState, deltaTime);
        }

        processPlayerMovement(gameState, deltaTime) {
            // Process movement for all player entities
            for (const entity of gameState.entities.values()) {
                if (!entity.hasComponent('Player') || !entity.hasComponent('Transform') || !entity.hasComponent('PlayerInput')) {
                    continue;
                }
                
                const transform = entity.getComponent('Transform');
                const input = entity.getComponent('PlayerInput');

                if (!transform || !input) continue;

                // DEBUG: Log input state when any key is pressed
                if (input.keys.forward || input.keys.backward || input.keys.left || input.keys.right) {
                    console.log('🎮 PLAYER MOVEMENT: Input detected', {
                        forward: input.keys.forward,
                        backward: input.keys.backward,
                        left: input.keys.left,
                        right: input.keys.right,
                        position: transform.position
                    });
                }

                // Store previous position for collision detection
                if (transform.updatePrevious) {
                    transform.updatePrevious();
                } else {
                    transform.previousPosition = { ...transform.position };
                }

                // Get WASD input
                let desiredX = 0;
                let desiredZ = 0;

                if (input.keys.forward) desiredZ += 1;  // Forward is positive Z (FIXED)
                if (input.keys.backward) desiredZ -= 1; // Backward is negative Z
                if (input.keys.left) desiredX -= 1;     // Left is negative X
                if (input.keys.right) desiredX += 1;    // Right is positive X

                // CAMERA-RELATIVE MOVEMENT: Transform input based on camera direction
                let finalDesiredX = desiredX;
                let finalDesiredZ = desiredZ;
                
                // Use camera's world direction vector for accurate movement
                const camera = window.camera;
                if (camera && (desiredX !== 0 || desiredZ !== 0)) {
                    // Use the camera's world direction vector
                    const forward = new THREE.Vector3();
                    camera.getWorldDirection(forward);
                    forward.y = 0; // Ignore pitch to keep movement on ground
                    forward.normalize();

                    // Calculate right vector from camera's orientation
                    const right = new THREE.Vector3();
                    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

                    // Combine input directions (WASD) with camera-facing vectors
                    const moveDir = new THREE.Vector3();
                    moveDir.addScaledVector(forward, desiredZ);
                    moveDir.addScaledVector(right, desiredX);

                    // Normalize final desired movement direction
                    if (moveDir.lengthSq() > 0) moveDir.normalize();

                    // Apply to movement variables
                    finalDesiredX = moveDir.x;
                    finalDesiredZ = moveDir.z;
                }

                // Check if player is trying to move
                const isMoving = finalDesiredX !== 0 || finalDesiredZ !== 0;

                // Normalize input direction (use camera-transformed direction)
                if (isMoving) {
                    const magnitude = Math.sqrt(finalDesiredX * finalDesiredX + finalDesiredZ * finalDesiredZ);
                    if (magnitude > 0) {
                        finalDesiredX /= magnitude;
                        finalDesiredZ /= magnitude;
                    }
                    this.playerDirection.x = finalDesiredX;
                    this.playerDirection.z = finalDesiredZ;
                }

                // DRIFT MECHANICS: Add acceleration forces to existing velocity
                const dt = 1 / 60;
                const effectiveMaxSpeed = this.isSneaking
                    ? this.sneakMaxSpeed
                    : this.playerMaxSpeed;

                if (isMoving) {
                    // Add acceleration force in camera-relative direction
                    const accelForce = this.playerAcceleration * dt;
                    const oldVel = { x: transform.velocity.x, z: transform.velocity.z };
                    transform.velocity.x += finalDesiredX * accelForce;
                    transform.velocity.z += finalDesiredZ * accelForce;
                    
                    // DEBUG: Log velocity changes
                    if (input.keys.forward || input.keys.backward || input.keys.left || input.keys.right) {
                        console.log('🎮 PLAYER MOVEMENT: Velocity updated', {
                            oldVel,
                            newVel: { x: transform.velocity.x, z: transform.velocity.z },
                            accelForce,
                            finalDesired: { x: finalDesiredX, z: finalDesiredZ }
                        });
                    }
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

                    // Apply friction in opposite direction to velocity
                    const velocityDirX = transform.velocity.x / currentSpeed;
                    const velocityDirZ = transform.velocity.z / currentSpeed;

                    transform.velocity.x -= velocityDirX * frictionAmount * currentSpeed;
                    transform.velocity.z -= velocityDirZ * frictionAmount * currentSpeed;

                    // Prevent tiny oscillations
                    if (Math.abs(transform.velocity.x) < 0.001) transform.velocity.x = 0;
                    if (Math.abs(transform.velocity.z) < 0.001) transform.velocity.z = 0;
                }

                // Apply velocity to position
                if (transform.velocity.x !== 0 || transform.velocity.z !== 0) {
                    const oldPos = { x: transform.position.x, z: transform.position.z };
                    transform.position.x += transform.velocity.x;
                    transform.position.z += transform.velocity.z;
                    
                    // DEBUG: Log position updates
                    if (input.keys.forward || input.keys.backward || input.keys.left || input.keys.right) {
                        console.log('🎮 PLAYER MOVEMENT: Position updated', {
                            oldPos,
                            newPos: { x: transform.position.x, z: transform.position.z },
                            velocity: { x: transform.velocity.x, z: transform.velocity.z },
                            moved: Math.abs(oldPos.x - transform.position.x) > 0.001 || Math.abs(oldPos.z - transform.position.z) > 0.001
                        });
                    }
                }

                // Notify animation systems about movement
                this.notifyAnimationSystems(entity, isMoving, finalDesiredX, finalDesiredZ, input);
            }
        }

        notifyAnimationSystems(entity, isMoving, directionX, directionZ, input) {
            const playerId = entity.getComponent('Player')?.playerId;
            if (!playerId) return;

            // 🦵 SIMPLE LEG ANIMATION
            if (global.simpleLegAnimator) {
                if (isMoving) {
                    const magnitude = Math.sqrt(directionX * directionX + directionZ * directionZ);
                    if (magnitude > 0) {
                        const direction = { x: directionX / magnitude, z: directionZ / magnitude };
                        const isRunning = input.keys.action2 || false; // Shift to run
                        global.simpleLegAnimator.startWalking(playerId, direction, isRunning);
                    }
                } else {
                    global.simpleLegAnimator.stopMovement(playerId);
                }
            }

            // 🦵 RAGDOLL LOCOMOTION (if enabled)
            const ragdollPhysics = entity.getComponent('RagdollPhysics');
            if (ragdollPhysics && global.ragdollLocomotion) {
                if (isMoving) {
                    const magnitude = Math.sqrt(directionX * directionX + directionZ * directionZ);
                    if (magnitude > 0) {
                        const direction = { x: directionX / magnitude, z: directionZ / magnitude };
                        const isRunning = input.keys.action2 || false;
                        global.ragdollLocomotion.startWalking(playerId, direction, isRunning);
                    }
                } else {
                    global.ragdollLocomotion.stopMovement(playerId);
                }
            }
        }

        // API for other systems to query player movement
        getPlayerSpeed() {
            return this.playerCurrentSpeed;
        }

        getPlayerDirection() {
            return { x: this.playerDirection.x, z: this.playerDirection.z };
        }

        setSneeking(sneaking) {
            this.isSneaking = sneaking;
        }
    }

    // Register system globally
    global.PlayerMovementSystem = PlayerMovementSystem;
    console.log('🔄 PLAYER MOVEMENT: PlayerMovementSystem class registered globally');

})(typeof window !== 'undefined' ? window : global);