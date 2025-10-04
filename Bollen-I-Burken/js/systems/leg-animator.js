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
                restRotation: {
                    left: { x: 0, y: 0, z: 0 },
                    right: { x: 0, y: 0, z: 0 }
                }
            });

            // Store initial leg rotations as rest pose
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

            // Check if character is moving by comparing position
            const currentPos = data.mesh.position;
            const lastPos = data.lastPosition;
            
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

            // Calculate leg rotations
            this.animateLegs(data);
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
         * Clear all registered characters
         */
        clear() {
            this.characters.clear();
            Utils.log('🦵 Cleared all leg animation data');
        }
    }

    // Export for use
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = LegAnimator;
    } else {
        global.LegAnimator = LegAnimator;
    }

})(typeof window !== 'undefined' ? window : globalThis);