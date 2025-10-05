/* ==========================================
   ANIMATION INTEGRATION SYSTEM
   Handles ONLY leg animations and ragdoll physics
   KISS Architecture - Single responsibility
   ========================================== */

(function (global) {
    console.log('🔄 ANIMATION INTEGRATION: Loading animation-integration-system.js file');
    
    class AnimationIntegrationSystem extends System {
        constructor() {
            super('AnimationIntegrationSystem');
            console.log('🔄 ANIMATION INTEGRATION: Constructor called');
            
            // Initialize leg animator
            this.legAnimator = new LegAnimator();
        }

        update(gameState, deltaTime) {
            if (!gameState || gameState.gamePhase === GAME_STATES.PAUSED || gameState.gamePhase === GAME_STATES.GAME_OVER) {
                return;
            }

            // Update leg animations for all characters
            if (this.legAnimator) {
                this.legAnimator.update(0.016, { gameState }); // ~60fps deltaTime
            }

            // Update ragdoll physics animations
            this.updateRagdollAnimations(gameState, deltaTime);
        }

        updateRagdollAnimations(gameState, deltaTime) {
            // Update ragdoll physics for entities that have it
            for (const entity of gameState.entities.values()) {
                if (!entity.hasComponent('PhysicsBody') || !entity.hasComponent('Transform')) {
                    continue;
                }
                const physicsBody = entity.getComponent('PhysicsBody');
                const transform = entity.getComponent('Transform');

                if (!physicsBody || !transform) continue;

                // Update physics animation state (placeholder for future ragdoll integration)
                this.updatePhysicsAnimation(entity, physicsBody, transform, deltaTime);
            }
        }

        updatePhysicsAnimation(entity, physicsBody, transform, deltaTime) {
            // This is where physics animation updates would go
            // For now, this is a placeholder for future ragdoll integration
            
            // Example of what might be here:
            // - Update physics body positions
            // - Sync transform with physics simulation
            // - Handle animation state transitions
            
            if (global.ragdollLocomotion && physicsBody.body) {
                // Update physics locomotion system
                const playerId = entity.getComponent('Player')?.playerId;
                if (playerId) {
                    // Ragdoll system handles its own updates
                    // This system just provides the interface
                }
            }
        }

        // API for movement system to trigger animations
        startWalking(playerId, direction, isRunning) {
            // Delegate to appropriate animation system
            if (global.simpleLegAnimator) {
                global.simpleLegAnimator.startWalking(playerId, direction, isRunning);
            }
            
            if (global.ragdollLocomotion) {
                global.ragdollLocomotion.startWalking(playerId, direction, isRunning);
            }
        }

        stopMovement(playerId) {
            // Stop all animations
            if (global.simpleLegAnimator) {
                global.simpleLegAnimator.stopMovement(playerId);
            }
            
            if (global.ragdollLocomotion) {
                global.ragdollLocomotion.stopMovement(playerId);
            }
        }

        // Leg animator access for other systems
        getLegAnimator() {
            return this.legAnimator;
        }

        // Enable/disable ragdoll physics
        enableRagdoll(entity, enabled) {
            const ragdollPhysics = entity.getComponent('RagdollPhysics');
            if (ragdollPhysics) {
                ragdollPhysics.isActive = enabled;
            }
        }

        // Check if entity has active ragdoll physics
        hasActiveRagdoll(entity) {
            const ragdollPhysics = entity.getComponent('RagdollPhysics');
            return ragdollPhysics && ragdollPhysics.isActive;
        }
    }

    // Register system globally
    global.AnimationIntegrationSystem = AnimationIntegrationSystem;
    console.log('🔄 ANIMATION INTEGRATION: AnimationIntegrationSystem class registered globally');

})(typeof window !== 'undefined' ? window : global);