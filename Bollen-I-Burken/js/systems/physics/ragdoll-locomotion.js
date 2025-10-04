/* ==========================================
   RAGDOLL LOCOMOTION SYSTEM
   Natural physics-based character movement
   Phase 2: From static legs to walking physics
   ========================================== */

(function (global) {
    /**
     * 🚶‍♂️ RagdollLocomotion - Handles natural physics-based character movement
     * 
     * PHASE ROADMAP:
     * Phase 2A: Basic leg swing mechanics (hip rotation)
     * Phase 2B: Walking cycle with alternating legs  
     * Phase 2C: Running, jumping, and balance control
     * Phase 2D: Leaning mechanics for acceleration/deceleration
     */
    class RagdollLocomotion {
        constructor() {
            this.enabled = true;
            
            // 🎛️ LOCOMOTION SETTINGS - Easily adjustable!
            this.settings = {
                // Basic movement forces
                walkSpeed: 2.0,           // Walking force magnitude
                runSpeed: 5.0,            // Running force magnitude
                legLiftForce: 8.0,        // Force to lift leg during step
                
                // Walking cycle timing
                stepDuration: 0.8,        // Seconds per step (0.8 = realistic walking)
                stepHeight: 0.3,          // How high to lift leg during step
                hipSwingAngle: 0.3,       // Hip rotation during walk (radians)
                
                // Balance and stability
                balanceForce: 15.0,       // Force to keep character upright
                leanAngle: 0.2,           // Max lean angle during movement
                stabilityDamping: 0.3,    // Damping to prevent wobbling
                
                // Ground interaction
                groundLevel: 0.0,         // Y coordinate of ground
                stepDetectionHeight: 0.1, // How close to ground to detect "step"
                
                // Phase 2A: Hip rotation system
                hipRotationSpeed: 2.0,    // Speed of hip rotation during walk
                legReturnSpeed: 3.0,      // Speed legs return to neutral position
            };
            
            // 📊 CHARACTER STATE TRACKING
            this.characterStates = new Map(); // Store locomotion state per character
        }

        /**
         * 🎯 Initialize locomotion for a ragdoll character
         * @param {string} characterId - Unique character identifier
         * @param {Object} ragdollData - Physics data from CharacterBuilder
         */
        initializeCharacter(characterId, ragdollData) {
            const state = {
                // Character reference
                characterId: characterId,
                ragdollData: ragdollData,
                
                // Movement state
                isWalking: false,
                isRunning: false,
                currentSpeed: 0,
                targetDirection: { x: 0, z: 0 },
                
                // Walking cycle
                walkCycleTime: 0,         // Current time in walk cycle (0-1)
                currentSteppingLeg: 'left', // Which leg is currently stepping
                
                // Leg positions and targets
                leftLegTarget: { x: 0, y: 0, z: 0 },
                rightLegTarget: { x: 0, y: 0, z: 0 },
                
                // Balance and lean
                currentLean: { x: 0, z: 0 },
                targetLean: { x: 0, z: 0 },
                
                // Debug tracking
                lastDummyLogTime: 0,
                
                // Physics forces
                activeForces: [],
                
                // Debug info
                debugInfo: {
                    lastUpdate: Date.now(),
                    forcesApplied: 0,
                    currentPhase: 'idle'
                }
            };
            
            this.characterStates.set(characterId, state);
            console.log(`[RagdollLocomotion] Initialized character: ${characterId}`);
            return state;
        }

        /**
         * 🚶‍♂️ Start walking in a direction
         * @param {string} characterId - Character to move
         * @param {Object} direction - Normalized direction vector {x, z}
         * @param {boolean} isRunning - Whether to run instead of walk
         */
        startWalking(characterId, direction, isRunning = false) {
            const state = this.characterStates.get(characterId);
            if (!state) {
                console.warn(`[RagdollLocomotion] Character ${characterId} not initialized`);
                return;
            }

            state.isWalking = true;
            state.isRunning = isRunning;
            state.targetDirection = { ...direction };
            state.currentSpeed = isRunning ? this.settings.runSpeed : this.settings.walkSpeed;
            
            // Reset walk cycle if starting fresh
            if (state.debugInfo.currentPhase === 'idle') {
                state.walkCycleTime = 0;
                state.currentSteppingLeg = 'left';
            }
            
            state.debugInfo.currentPhase = isRunning ? 'running' : 'walking';
            // 🦵 ENHANCED DEBUG: Show when locomotion starts
            const isDummy = state.ragdollData?.isTemporary || false;
            console.log(`[RagdollLocomotion] 🚶‍♂️ ${characterId} started ${state.debugInfo.currentPhase} toward (${direction.x.toFixed(2)}, ${direction.z.toFixed(2)}) - Dummy mode: ${isDummy}`);
        }

        /**
         * 🛑 Stop character movement
         * @param {string} characterId - Character to stop
         */
        stopWalking(characterId) {
            const state = this.characterStates.get(characterId);
            if (!state) return;

            state.isWalking = false;
            state.isRunning = false;
            state.currentSpeed = 0;
            state.targetDirection = { x: 0, z: 0 };
            state.debugInfo.currentPhase = 'stopping';
            
            console.log(`[RagdollLocomotion] ${characterId} stopping movement`);
        }

        /**
         * 🔄 Update locomotion physics (call every frame)
         * @param {number} deltaTime - Time since last frame (seconds)
         */
        update(deltaTime) {
            if (!this.enabled) return;

            this.characterStates.forEach((state, characterId) => {
                this.updateCharacterLocomotion(state, deltaTime);
            });
        }

        /**
         * 🚶‍♂️ Update individual character locomotion
         * @param {Object} state - Character locomotion state
         * @param {number} deltaTime - Time since last frame
         */
        updateCharacterLocomotion(state, deltaTime) {
            if (!state.ragdollData || !state.ragdollData.articulatedLegs) {
                // 🦵 TEMPORARY: Handle dummy ragdoll data
                if (state.ragdollData && state.ragdollData.isTemporary) {
                    // Show periodic debug messages in dummy mode
                    if (Math.floor(Date.now() / 1000) !== state.lastDummyLogTime) {
                        state.lastDummyLogTime = Math.floor(Date.now() / 1000);
                        console.log(`[RagdollLocomotion] 🦵 DUMMY MODE: Character ${characterId} walking toward (${state.targetDirection.x.toFixed(2)}, ${state.targetDirection.z.toFixed(2)})`);
                    }
                }
                return; // No ragdoll physics available
            }

            const leftLeg = state.ragdollData.articulatedLegs.left;
            if (!leftLeg) return; // Phase 1A: only left leg implemented

            // Update walk cycle timing
            if (state.isWalking) {
                state.walkCycleTime += deltaTime / this.settings.stepDuration;
                if (state.walkCycleTime >= 1.0) {
                    state.walkCycleTime = 0;
                    // Switch stepping leg for next cycle
                    state.currentSteppingLeg = state.currentSteppingLeg === 'left' ? 'right' : 'left';
                }
            }

            // 🦵 PHASE 2A: Basic hip rotation and leg swing
            this.applyLegSwingForces(state, leftLeg, deltaTime);
            
            // 🏃‍♂️ Apply forward movement forces
            this.applyMovementForces(state, leftLeg, deltaTime);
            
            // ⚖️ Apply balance and stability forces
            this.applyBalanceForces(state, leftLeg, deltaTime);
            
            // 📊 Update debug info
            state.debugInfo.lastUpdate = Date.now();
            state.debugInfo.forcesApplied++;
        }

        /**
         * 🦵 Apply leg swing forces for walking motion (Phase 2A)
         * @param {Object} state - Character state
         * @param {Object} leftLeg - Left leg ragdoll data  
         * @param {number} deltaTime - Frame time
         */
        applyLegSwingForces(state, leftLeg, deltaTime) {
            if (!state.isWalking) {
                // Return legs to neutral position when not walking
                this.returnLegsToNeutral(state, leftLeg, deltaTime);
                return;
            }

            // Calculate swing phase (0 = start of step, 0.5 = mid-step, 1 = end of step)
            const swingPhase = state.walkCycleTime;
            
            // Only move left leg during its stepping phase (Phase 1A limitation)
            if (state.currentSteppingLeg === 'left') {
                // Lift leg during first half of step
                if (swingPhase < 0.5) {
                    const liftForce = this.settings.legLiftForce * Math.sin(swingPhase * Math.PI);
                    leftLeg.upperBody.applyForce(new CANNON.Vec3(0, liftForce, 0), leftLeg.upperBody.position);
                }
                
                // Swing leg forward during entire step
                const swingForce = this.settings.walkSpeed * Math.sin(swingPhase * Math.PI);
                const forwardDirection = state.targetDirection;
                leftLeg.upperBody.applyForce(
                    new CANNON.Vec3(
                        forwardDirection.x * swingForce,
                        0,
                        forwardDirection.z * swingForce
                    ),
                    leftLeg.upperBody.position
                );
                
                // Add hip rotation for more natural movement
                const hipRotation = this.settings.hipSwingAngle * Math.sin(swingPhase * Math.PI * 2);
                leftLeg.upperBody.angularVelocity.x = hipRotation * this.settings.hipRotationSpeed;
            }
        }

        /**
         * 🏃‍♂️ Apply forward movement forces
         * @param {Object} state - Character state
         * @param {Object} leftLeg - Left leg ragdoll data
         * @param {number} deltaTime - Frame time
         */
        applyMovementForces(state, leftLeg, deltaTime) {
            if (!state.isWalking) return;

            // Apply forward push force to character
            const moveForce = state.currentSpeed * deltaTime;
            const direction = state.targetDirection;
            
            // Apply force to upper leg (main driver of movement)
            leftLeg.upperBody.applyForce(
                new CANNON.Vec3(
                    direction.x * moveForce,
                    0,
                    direction.z * moveForce
                ),
                leftLeg.upperBody.position
            );
        }

        /**
         * ⚖️ Apply balance and stability forces
         * @param {Object} state - Character state
         * @param {Object} leftLeg - Left leg ragdoll data
         * @param {number} deltaTime - Frame time
         */
        applyBalanceForces(state, leftLeg, deltaTime) {
            // Keep character upright by applying corrective forces
            const upperLegRotation = leftLeg.upperBody.quaternion;
            
            // Calculate how much the leg is tilted from vertical
            const upVector = new CANNON.Vec3(0, 1, 0);
            const legVector = new CANNON.Vec3(0, 1, 0);
            upperLegRotation.vmult(legVector, legVector);
            
            // Apply corrective torque to keep leg vertical
            const correctionTorque = upVector.cross(legVector);
            correctionTorque.scale(this.settings.balanceForce * deltaTime, correctionTorque);
            
            leftLeg.upperBody.applyTorque(correctionTorque);
            
            // Apply damping to reduce oscillation
            leftLeg.upperBody.angularVelocity.scale(1 - this.settings.stabilityDamping * deltaTime, leftLeg.upperBody.angularVelocity);
        }

        /**
         * 🔄 Return legs to neutral position when not walking
         * @param {Object} state - Character state
         * @param {Object} leftLeg - Left leg ragdoll data
         * @param {number} deltaTime - Frame time
         */
        returnLegsToNeutral(state, leftLeg, deltaTime) {
            // Apply gentle forces to return legs to neutral stance
            const returnForce = this.settings.legReturnSpeed * deltaTime;
            
            // Reduce any excessive movement
            leftLeg.upperBody.velocity.scale(0.95, leftLeg.upperBody.velocity);
            leftLeg.lowerBody.velocity.scale(0.95, leftLeg.lowerBody.velocity);
            
            // Gradually stop any rotation
            leftLeg.upperBody.angularVelocity.scale(0.9, leftLeg.upperBody.angularVelocity);
            leftLeg.lowerBody.angularVelocity.scale(0.9, leftLeg.lowerBody.angularVelocity);
        }

        /**
         * 🎛️ Update locomotion settings
         * @param {Object} newSettings - Settings to update
         */
        updateSettings(newSettings) {
            Object.assign(this.settings, newSettings);
            console.log(`[RagdollLocomotion] Settings updated:`, newSettings);
        }

        /**
         * 📊 Get character locomotion info for debugging
         * @param {string} characterId - Character to inspect
         * @returns {Object} Locomotion state info
         */
        getCharacterInfo(characterId) {
            const state = this.characterStates.get(characterId);
            if (!state) return null;

            return {
                phase: state.debugInfo.currentPhase,
                isWalking: state.isWalking,
                isRunning: state.isRunning,
                speed: state.currentSpeed,
                direction: state.targetDirection,
                walkCycle: state.walkCycleTime,
                steppingLeg: state.currentSteppingLeg,
                forcesApplied: state.debugInfo.forcesApplied
            };
        }

        /**
         * 🛠️ Enable/disable locomotion system
         * @param {boolean} enabled - Whether to enable locomotion
         */
        setEnabled(enabled) {
            this.enabled = enabled;
            console.log(`[RagdollLocomotion] System ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    // Export to global scope
    global.RagdollLocomotion = RagdollLocomotion;

    // Also export for module systems
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = RagdollLocomotion;
    }

    console.log('[RagdollLocomotion] Natural physics-based movement system loaded! 🚶‍♂️');

})(typeof window !== 'undefined' ? window : globalThis);