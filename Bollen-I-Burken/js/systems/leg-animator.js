/* ==========================================
   LEG ANIMATOR - Simple Walking Animation v1.0
   Animates character legs when moving
   ========================================== */

(function (global) {
    'use strict';

    // ==========================================
    // ANIMATION CONFIGURATION - TWEAK THESE VALUES
    // ==========================================
    const ANIMATION_CONFIG = {
        // Speed Controls
        walkingSpeedMultiplier: 6.0,    // How fast animation timer builds up (higher = faster response)
        walkCycleSpeed: 4.0,            // How fast each leg swing cycle completes (higher = faster legs)
        
        // Movement Controls  
        legSwingAmount: 0.5,            // Radians - how much legs swing back/forth (0.1-0.5 recommended)
        legLiftAmount: 0.2,             // How much legs lift forward during swing (0.05-0.2 recommended)
        
        // Body Lean Controls (NEW!)
        leanSensitivity: 2.0,           // How much to lean based on acceleration (higher = more lean)
        maxLeanAngle: 0.3,              // Maximum lean angle in radians (0.1-0.5 recommended)
        leanSmoothness: 0.15,           // How smoothly lean changes (0.05-0.3, lower = smoother)
        
        // Smoothing Controls
        decayFactor: 0.9,               // How quickly legs return to rest when stopping (0.8-0.95)
        returnSpeed: 0.1,               // Speed of returning to rest pose (0.05-0.2)
        movementThreshold: 0.001,       // Minimum movement to trigger animation (0.0001-0.01)
        minimumWalkTime: 0.01           // Minimum walk time to show animation (0.001-0.1)
    };

    class LegAnimator {
        constructor() {
            this.characters = new Map(); // playerId -> animation data
            this.enabled = true;
            Utils.log('🦵 LegAnimator initialized');
        }

        /**
         * Register a character for leg animation
         * @param {string} playerId - Player ID
         * @param {THREE.Group} characterMesh - Character mesh with userData.parts
         */
        registerCharacter(playerId, characterMesh) {
            if (!characterMesh || !characterMesh.userData || !characterMesh.userData.parts) {
                Utils.warn(`⚠️ Cannot register character ${playerId} - no parts data`);
                return;
            }

            const parts = characterMesh.userData.parts;
            if (!parts.leftLeg || !parts.rightLeg) {
                Utils.warn(`⚠️ Cannot register character ${playerId} - no leg parts`);
                return;
            }

            // Handle different leg types
            let leftLegMesh = parts.leftLeg;
            let rightLegMesh = parts.rightLeg;

            // If leftLeg is articulated, it has a visualGroup property
            if (parts.leftLeg && parts.leftLeg.visualGroup) {
                leftLegMesh = parts.leftLeg.visualGroup;
            }

            // Validate that we have rotatable objects
            if (!leftLegMesh.rotation || !rightLegMesh.rotation) {
                Utils.warn(`⚠️ Cannot register character ${playerId} - legs missing rotation properties`);
                return;
            }

            // Store character data for animation
            this.characters.set(playerId, {
                mesh: characterMesh,
                leftLeg: leftLegMesh,
                rightLeg: rightLegMesh,
                walkTime: 0,
                isMoving: false,
                lastPosition: { x: 0, y: 0, z: 0 },
                velocity: { x: 0, z: 0 },           // Current velocity
                acceleration: { x: 0, z: 0 },       // Current acceleration
                currentLean: { x: 0, z: 0 },        // Current body lean
                restRotation: {
                    left: { x: 0, y: 0, z: 0 },
                    right: { x: 0, y: 0, z: 0 },
                    body: { x: 0, y: 0, z: 0 }      // Store body rest rotation
                }
            });

            // Store initial rotations as rest pose
            const data = this.characters.get(playerId);
            data.restRotation.left = {
                x: leftLegMesh.rotation.x,
                y: leftLegMesh.rotation.y,
                z: leftLegMesh.rotation.z
            };
            data.restRotation.right = {
                x: rightLegMesh.rotation.x,
                y: rightLegMesh.rotation.y,
                z: rightLegMesh.rotation.z
            };
            data.restRotation.body = {
                x: characterMesh.rotation.x,
                y: characterMesh.rotation.y,
                z: characterMesh.rotation.z
            };

            // Initialize position tracking
            data.lastPosition.x = characterMesh.position.x;
            data.lastPosition.y = characterMesh.position.y;
            data.lastPosition.z = characterMesh.position.z;

            Utils.log(`🦵 Registered character for leg animation: ${playerId}`);
        }

        /**
         * Unregister a character from leg animation
         * @param {string} playerId - Player ID
         */
        unregisterCharacter(playerId) {
            if (this.characters.has(playerId)) {
                this.characters.delete(playerId);
                Utils.log(`🦵 Unregistered character from leg animation: ${playerId}`);
            }
        }

        /**
         * Update leg animations based on movement
         * @param {number} deltaTime - Time since last frame
         * @param {GameEngine} gameEngine - Game engine for entity data
         */
        update(deltaTime, gameEngine) {
            if (!this.enabled || !gameEngine) {
                return;
            }

            // Iterate through all registered characters
            for (const [playerId, data] of this.characters) {
                this.updateCharacterLegs(playerId, data, deltaTime, gameEngine);
            }
        }

        /**
         * Update legs for a single character
         * @param {string} playerId - Player ID
         * @param {Object} data - Character animation data
         * @param {number} deltaTime - Time since last frame
         * @param {GameEngine} gameEngine - Game engine for entity data
         */
        updateCharacterLegs(playerId, data, deltaTime, gameEngine) {
            // Get player entity to check movement
            const playerEntity = gameEngine.gameState.getPlayerEntity(playerId);
            if (!playerEntity) {
                return;
            }

            // Calculate velocity and acceleration for body leaning
            const currentPos = data.mesh.position;
            const lastPos = data.lastPosition;
            
            // Calculate current velocity
            const newVelocity = {
                x: (currentPos.x - lastPos.x) / deltaTime,
                z: (currentPos.z - lastPos.z) / deltaTime
            };
            
            // Calculate acceleration (change in velocity)
            const acceleration = {
                x: (newVelocity.x - data.velocity.x) / deltaTime,
                z: (newVelocity.z - data.velocity.z) / deltaTime
            };
            
            // Store velocity and acceleration
            data.velocity = newVelocity;
            data.acceleration = acceleration;
            
            const moved = Math.abs(currentPos.x - lastPos.x) > ANIMATION_CONFIG.movementThreshold || 
                         Math.abs(currentPos.z - lastPos.z) > ANIMATION_CONFIG.movementThreshold;

            // Update movement state
            if (moved) {
                data.isMoving = true;
                data.walkTime += deltaTime * ANIMATION_CONFIG.walkingSpeedMultiplier;
            } else {
                data.isMoving = false;
                // Gradually return to rest pose when not moving
                data.walkTime *= ANIMATION_CONFIG.decayFactor;
            }

            // Update last position
            data.lastPosition.x = currentPos.x;
            data.lastPosition.y = currentPos.y;
            data.lastPosition.z = currentPos.z;

            // Calculate and apply body leaning based on acceleration
            this.updateBodyLean(data, deltaTime);

            // Sync ragdoll physics with visual meshes (for articulated legs)
            if (global.CharacterBuilder && global.CharacterBuilder.syncRagdollPhysics) {
                try {
                    global.CharacterBuilder.syncRagdollPhysics(data.mesh);
                } catch (error) {
                    // Physics sync failed - likely due to invalid physics bodies
                    console.warn('🚨 Physics sync failed, disabling for this character:', error);
                    // Clear the physics references to prevent further errors
                    if (data.mesh && data.mesh.userData && data.mesh.userData.parts && data.mesh.userData.parts.articulatedLeftLeg) {
                        const legGroup = data.mesh.userData.parts.articulatedLeftLeg.visualGroup;
                        if (legGroup) {
                            legGroup.children.forEach(mesh => {
                                mesh.userData.physicsBody = null;
                            });
                        }
                    }
                }
            }

            // Calculate leg rotations
            this.animateLegs(data);
        }

        /**
         * Update body lean based on acceleration forces
         * @param {Object} data - Character animation data
         * @param {number} deltaTime - Time since last frame
         */
        updateBodyLean(data, deltaTime) {
            // Calculate target lean based on acceleration
            // Forward acceleration -> lean forward (negative X rotation)
            // Backward acceleration -> lean backward (positive X rotation)
            // Left acceleration -> lean left (negative Z rotation) - MIRRORED
            // Right acceleration -> lean right (positive Z rotation) - MIRRORED
            
            const targetLean = {
                x: -data.acceleration.z * ANIMATION_CONFIG.leanSensitivity, // Forward/backward lean
                z: -data.acceleration.x * ANIMATION_CONFIG.leanSensitivity  // Left/right lean (MIRRORED)
            };
            
            // Clamp lean angles to maximum values
            targetLean.x = Math.max(-ANIMATION_CONFIG.maxLeanAngle, 
                          Math.min(ANIMATION_CONFIG.maxLeanAngle, targetLean.x));
            targetLean.z = Math.max(-ANIMATION_CONFIG.maxLeanAngle, 
                          Math.min(ANIMATION_CONFIG.maxLeanAngle, targetLean.z));
            
            // Smoothly interpolate current lean toward target lean
            data.currentLean.x += (targetLean.x - data.currentLean.x) * ANIMATION_CONFIG.leanSmoothness;
            data.currentLean.z += (targetLean.z - data.currentLean.z) * ANIMATION_CONFIG.leanSmoothness;
            
            // Apply lean to character body rotation
            data.mesh.rotation.x = data.restRotation.body.x + data.currentLean.x;
            data.mesh.rotation.z = data.restRotation.body.z + data.currentLean.z;
            
            // Debug output (remove this later if too spammy)
            if (Math.abs(data.acceleration.x) > 0.1 || Math.abs(data.acceleration.z) > 0.1) {
                console.log(`🎯 Lean - Accel: (${data.acceleration.x.toFixed(2)}, ${data.acceleration.z.toFixed(2)}) -> Lean: (${data.currentLean.x.toFixed(3)}, ${data.currentLean.z.toFixed(3)})`);
            }
        }

        /**
         * Animate leg rotations based on walk time
         * @param {Object} data - Character animation data
         */
        animateLegs(data) {
            if (!data.leftLeg || !data.rightLeg) {
                return;
            }

            // Walking animation parameters (from config)
            const walkCycleSpeed = ANIMATION_CONFIG.walkCycleSpeed;
            const legSwingAmount = ANIMATION_CONFIG.legSwingAmount;
            const legLiftAmount = ANIMATION_CONFIG.legLiftAmount;

            if (data.isMoving && data.walkTime > ANIMATION_CONFIG.minimumWalkTime) {
                // Create alternating leg swing pattern
                const leftPhase = Math.sin(data.walkTime * walkCycleSpeed) * legSwingAmount;
                const rightPhase = Math.sin(data.walkTime * walkCycleSpeed + Math.PI) * legSwingAmount;

                // Add slight forward lift when leg swings forward
                const leftLift = Math.max(0, Math.sin(data.walkTime * walkCycleSpeed)) * legLiftAmount;
                const rightLift = Math.max(0, Math.sin(data.walkTime * walkCycleSpeed + Math.PI)) * legLiftAmount;

                // Apply rotations (X = forward/back swing, Z = lift)
                data.leftLeg.rotation.x = data.restRotation.left.x + leftPhase + leftLift;
                data.rightLeg.rotation.x = data.restRotation.right.x + rightPhase + rightLift;

            } else {
                // Return to rest pose when not moving
                const returnSpeed = ANIMATION_CONFIG.returnSpeed;
                data.leftLeg.rotation.x += (data.restRotation.left.x - data.leftLeg.rotation.x) * returnSpeed;
                data.rightLeg.rotation.x += (data.restRotation.right.x - data.rightLeg.rotation.x) * returnSpeed;
            }
        }

        /**
         * Enable/disable leg animation
         * @param {boolean} enabled - Whether to enable leg animation
         */
        setEnabled(enabled) {
            this.enabled = enabled;
            Utils.log(`🦵 Leg animation ${enabled ? 'enabled' : 'disabled'}`);
        }

        /**
         * Clear all registered characters and reset state
         */
        clear() {
            Utils.log('🦵 Clearing leg animation data...');
            
            // Clean up any physics references in character meshes
            this.characters.forEach((data, playerId) => {
                if (data.mesh && data.mesh.userData && data.mesh.userData.parts) {
                    const parts = data.mesh.userData.parts;
                    
                    // Clear physics references from articulated leg
                    if (parts.articulatedLeftLeg && parts.articulatedLeftLeg.visualGroup) {
                        parts.articulatedLeftLeg.visualGroup.children.forEach(mesh => {
                            if (mesh.userData.physicsBody) {
                                mesh.userData.physicsBody = null;
                                console.log(`🧹 Cleared physics reference from leg mesh: ${mesh.name}`);
                            }
                        });
                    }
                }
            });
            
            // Clear character animation data
            this.characters.clear();
            
            Utils.log('🦵 Cleared all leg animation data');
        }

        /**
         * Reset and cleanup - called when game restarts
         */
        reset() {
            Utils.log('🦵 Resetting LegAnimator for new game session');
            this.clear();
            this.enabled = true;
        }
    }

    // Export for use
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = LegAnimator;
    } else {
        global.LegAnimator = LegAnimator;
    }

})(typeof window !== 'undefined' ? window : globalThis);