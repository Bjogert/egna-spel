/* ==========================================
   CAMERA MODE SYSTEM
   Simple state management for camera modes
   ========================================== */

(function (global) {
    // Camera mode constants
    const CAMERA_MODES = {
        THIRD_PERSON: 'third_person',
        FIRST_PERSON: 'first_person'
    };

    class CameraModeSystem extends System {
        constructor(scene, camera) {
            super('CameraModeSystem');
            this.scene = scene;
            this.camera = camera;
            
            // Current state
            this.currentMode = CAMERA_MODES.THIRD_PERSON;  // Start in third-person
            this.playerEntity = null;
            
            // Camera settings for each mode - ONLY DIFFERENCE is camera position
            this.modeSettings = {
                [CAMERA_MODES.THIRD_PERSON]: {
                    eyeHeight: 0,  // Not used in third-person
                    fov: 75
                },
                [CAMERA_MODES.FIRST_PERSON]: {
                    eyeHeight: 1.7,  // Height above player position
                    fov: 75
                }
            };

            // Bind event listener for camera toggle
            this.boundToggleHandler = this.handleCameraToggle.bind(this);
            window.addEventListener('camera-mode-toggle', this.boundToggleHandler);

            Utils.log('Camera mode system initialized - both modes use unified controls');
        }

        /**
         * Handle V key camera toggle events
         */
        handleCameraToggle(event) {
            this.toggleMode();
        }

        /**
         * Toggle between camera modes
         */
        toggleMode() {
            const oldMode = this.currentMode;
            
            if (this.currentMode === CAMERA_MODES.THIRD_PERSON) {
                this.currentMode = CAMERA_MODES.FIRST_PERSON;
            } else {
                this.currentMode = CAMERA_MODES.THIRD_PERSON;
            }

            Utils.log(`🎥 Camera mode switched: ${oldMode} → ${this.currentMode}`);
            
            // Apply camera settings for new mode
            this.applyCameraSettings();
        }

        /**
         * Apply camera settings based on current mode
         */
        applyCameraSettings() {
            const settings = this.modeSettings[this.currentMode];
            
            if (this.camera && settings) {
                // Update FOV if needed
                if (this.camera.fov !== settings.fov) {
                    this.camera.fov = settings.fov;
                    this.camera.updateProjectionMatrix();
                }
            }
        }

        /**
         * Update camera position and rotation based on current mode
         */
        update(gameState) {
            if (!gameState) return;

            // Find player entity if we don't have it
            if (!this.playerEntity) {
                this.playerEntity = gameState.getLocalPlayer();
                if (!this.playerEntity) return;
            }

            const playerTransform = this.playerEntity.getComponent('Transform');
            if (!playerTransform) return;

            if (this.currentMode === CAMERA_MODES.THIRD_PERSON) {
                this.updateThirdPersonCamera(playerTransform);
            } else if (this.currentMode === CAMERA_MODES.FIRST_PERSON) {
                this.updateFirstPersonCamera(playerTransform);
            }
        }

        /**
         * Update camera for third-person mode (existing behavior)
         */
        updateThirdPersonCamera(playerTransform) {
            // Use existing third-person camera logic from main.js
            if (window.updateDynamicCamera && typeof window.updateDynamicCamera === 'function') {
                window.updateDynamicCamera();
            } else {
                Utils.warn('updateDynamicCamera function not found - third-person camera may not work properly');
            }
        }

        /**
         * Update camera for first-person mode
         */
        updateFirstPersonCamera(playerTransform) {
            if (!this.camera || !playerTransform) return;

            const settings = this.modeSettings[CAMERA_MODES.FIRST_PERSON];
            
            // Position camera at player eye level
            this.camera.position.x = playerTransform.position.x;
            this.camera.position.y = playerTransform.position.y + settings.eyeHeight;
            this.camera.position.z = playerTransform.position.z;

            // FIRST-PERSON: Camera uses ONLY mouse rotation WITH LIMITS
            const inputSystem = window.inputSystem;
            if (inputSystem && inputSystem.getMouseRotation) {
                const mouseRotation = inputSystem.getMouseRotation();
                
                // Get current body direction
                const bodyAngle = playerTransform.rotation.y;
                
                // STEP 1: LIMIT HEAD ROTATION RELATIVE TO BODY
                // Head can only turn 90 degrees left/right from body direction
                const maxHeadTurnAngle = Math.PI / 2; // 90 degrees
                
                // Calculate desired head angle from mouse input
                const desiredHeadAngle = mouseRotation.x;
                
                // Calculate head angle relative to body
                let headRelativeToBody = desiredHeadAngle - bodyAngle;
                
                // Normalize to [-π, π]
                while (headRelativeToBody > Math.PI) headRelativeToBody -= 2 * Math.PI;
                while (headRelativeToBody < -Math.PI) headRelativeToBody += 2 * Math.PI;
                
                // Clamp head rotation to max turn angle
                const clampedHeadRelative = Math.max(-maxHeadTurnAngle, 
                    Math.min(maxHeadTurnAngle, headRelativeToBody));
                
                // Final head angle = body angle + clamped relative angle
                const finalHeadAngle = bodyAngle + clampedHeadRelative;
                
                // FIXED: Use correct Euler rotation order to avoid gimbal lock
                // Set rotation order to YXZ (yaw first, then pitch, then roll)
                this.camera.rotation.order = 'YXZ';
                
                // Apply horizontal rotation (yaw) around Y axis
                this.camera.rotation.y = finalHeadAngle;
                
                // Apply vertical rotation (pitch) around X axis
                const maxVerticalAngle = Math.PI / 2.2; // About 80 degrees up/down
                this.camera.rotation.x = Math.max(-maxVerticalAngle, 
                    Math.min(maxVerticalAngle, -mouseRotation.y));
                
                // No roll rotation
                this.camera.rotation.z = 0;
            } else {
                // Fallback to player rotation if input system not available
                this.camera.rotation.y = playerTransform.rotation.y;
                this.camera.rotation.x = 0;
                this.camera.rotation.z = 0;
            }
        }

        /**
         * Check if currently in first-person mode
         */
        isFirstPerson() {
            return this.currentMode === CAMERA_MODES.FIRST_PERSON;
        }

        /**
         * Check if currently in third-person mode  
         */
        isThirdPerson() {
            return this.currentMode === CAMERA_MODES.THIRD_PERSON;
        }

        /**
         * Get current camera mode
         */
        getCurrentMode() {
            return this.currentMode;
        }

        /**
         * Force set camera mode (for debugging/testing)
         */
        setMode(mode) {
            if (Object.values(CAMERA_MODES).includes(mode)) {
                const oldMode = this.currentMode;
                this.currentMode = mode;
                Utils.log(`🎥 Camera mode forced: ${oldMode} → ${this.currentMode}`);
                this.applyCameraSettings();
            } else {
                Utils.warn(`Invalid camera mode: ${mode}`);
            }
        }

        /**
         * Clean up event listeners
         */
        destroy() {
            window.removeEventListener('camera-mode-toggle', this.boundToggleHandler);
            Utils.log('Camera mode system destroyed');
        }
    }

    // Export camera modes for external use
    CameraModeSystem.CAMERA_MODES = CAMERA_MODES;

    // Export for module systems or global access
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { CameraModeSystem, CAMERA_MODES };
    } else {
        global.GameSystems = global.GameSystems || {};
        global.GameSystems.CameraModeSystem = CameraModeSystem;
        global.CameraModeSystem = CameraModeSystem;
        global.CAMERA_MODES = CAMERA_MODES;
    }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));