/* ==========================================
   BOLLEN I BURKEN - AI SYSTEM
   AI hunter behavior and components
   ========================================== */

// AI States
const AI_STATES = {
    PATROL: 'patrol',
    HUNTING: 'hunting',
    SEARCHING: 'searching'
};

// AI Hunter Component (Updated for Component Validation)
class AIHunter {
    constructor() {
        // Required properties matching validation schema
        this.state = 'PATROL'; // Use string enum values

        // Optional properties with defaults from schema
        this.patrolPoints = [
            { x: 0, z: 5 },
            { x: 5, z: 0 },
            { x: 0, z: -5 },
            { x: -5, z: 0 }
        ];
        this.currentPatrolIndex = 0;
        this.searchStartTime = 0;
        this.searchDuration = 5000;
        this.alertLevel = 0;

        // Legacy properties (will be migrated gradually)
        this.target = null;
        this.lastKnownPosition = null;
        this.patrolTimer = 0;
        this.patrolDirection = Math.random() * Math.PI * 2;
        this.patrolChangeTime = 2000;
        this.speed = 0.08; // This should be in Movement component
    }
}

// Vision Cone Component (Updated for Component Validation)
class VisionCone {
    constructor(angle = 60, range = 12) {
        // Required properties matching validation schema
        this.angle = angle; // degrees (will be validated against range [10, 180])
        this.range = range; // distance (will be validated against range [1, 50])

        // Optional properties with defaults from schema
        this.enabled = true;
        this.targetSeen = false;
        this.lastSeenPosition = null;

        // Legacy properties (for backward compatibility)
        this.canSeePlayer = false;
        this.playerEntity = null;
    }
}

// AI System - manages all AI entities
class AISystem extends System {
    constructor() {
        super('AISystem');
        this.hunters = new Set();
        Utils.log('AI system initialized');
    }

    addEntity(entity) {
        if (entity.hasComponent(AIHunter)) {
            this.hunters.add(entity);
            Utils.log(`AI hunter entity added: ${entity.id}`);
        }
    }

    removeEntity(entity) {
        this.hunters.delete(entity);
    }

    update(gameState, deltaTime) {
        // Update all AI hunters with error handling
        for (const hunter of this.hunters) {
            if (!hunter.active) {
                this.hunters.delete(hunter);
                continue;
            }

            try {
                this.updateHunter(hunter, gameState, deltaTime);
            } catch (error) {
                Utils.error(`AI Hunter ${hunter.id} update failed:`, error);

                // Try to get ErrorHandler if available
                if (typeof ErrorHandler !== 'undefined') {
                    try {
                        const errorHandler = ErrorHandler.getInstance();
                        errorHandler.handle(new GameError('Hunter update failed', ERROR_CATEGORIES.SYSTEM, {
                            hunterId: hunter.id,
                            deltaTime: deltaTime,
                            phase: 'update',
                            error: error.message
                        }), 'ERROR');
                    } catch (handlerError) {
                        Utils.warn('ErrorHandler not available for AI error logging');
                    }
                }

                // Continue with other hunters
                continue;
            }
        }
    }

    updateHunter(hunter, gameState, deltaTime) {
        const aiComponent = hunter.getComponent(AIHunter);
        const transform = hunter.getComponent(Transform);
        const movement = hunter.getComponent(Movement);
        const visionCone = hunter.getComponent(VisionCone);

        if (!aiComponent || !transform || !movement) return;

        // Update patrol timer
        aiComponent.patrolTimer += deltaTime;

        // Update AI based on current state
        switch (aiComponent.state) {
            case 'PATROL':
                this.updatePatrolBehavior(aiComponent, transform, movement, deltaTime);
                break;
            case 'HUNTING':
                this.updateHuntingBehavior(aiComponent, transform, movement, deltaTime);
                break;
            case 'SEARCHING':
                this.updateSearchingBehavior(aiComponent, transform, movement, deltaTime);
                break;
        }

        // Check vision if vision cone component exists
        if (visionCone) {
            this.updateVision(hunter, visionCone, gameState);
        }

        // Apply movement with collision detection
        this.applyMovementWithCollision(transform);
    }

    updatePatrolBehavior(aiComponent, transform, movement, deltaTime) {
        // Change direction periodically
        if (aiComponent.patrolTimer >= aiComponent.patrolChangeTime) {
            aiComponent.patrolDirection = Math.random() * Math.PI * 2;
            aiComponent.patrolTimer = 0;
            aiComponent.patrolChangeTime = 1500 + Math.random() * 2000; // Random between 1.5-3.5 seconds
        }

        // Move in patrol direction using Movement component speed
        const speed = movement.speed || 0.08;
        transform.velocity.x = Math.cos(aiComponent.patrolDirection) * speed;
        transform.velocity.z = Math.sin(aiComponent.patrolDirection) * speed;
    }

    updateHuntingBehavior(aiComponent, transform, movement, deltaTime) {
        // For now, just continue patrol behavior
        // Will implement direct hunting in next phase
        this.updatePatrolBehavior(aiComponent, transform, movement, deltaTime);
    }

    updateSearchingBehavior(aiComponent, transform, movement, deltaTime) {
        // For now, just continue patrol behavior
        // Will implement searching in next phase
        this.updatePatrolBehavior(aiComponent, transform, movement, deltaTime);
    }

    updateVision(hunter, visionCone, gameState) {
        // Vision system will be implemented in Phase 2
        // For now, just reset vision state
        visionCone.canSeePlayer = false;
    }

    applyMovementWithCollision(transform) {
        // Get arena bounds from global config
        const config = window.GameUtils ? window.GameUtils.GAME_CONFIG : { ARENA_SIZE: 15 };
        const arenaLimit = (config.ARENA_SIZE / 2) - 0.8; // Leave space from walls

        // Check if AI would hit arena boundaries and reverse velocity if needed
        const nextPosX = transform.position.x + transform.velocity.x;
        const nextPosZ = transform.position.z + transform.velocity.z;

        if (nextPosX > arenaLimit || nextPosX < -arenaLimit) {
            transform.velocity.x *= -1; // Reverse direction
        }

        if (nextPosZ > arenaLimit || nextPosZ < -arenaLimit) {
            transform.velocity.z *= -1; // Reverse direction
        }

        // Note: MovementSystem will handle the actual position updates and boundary clamping
    }

    getHunters() {
        return Array.from(this.hunters);
    }

    destroy() {
        this.hunters.clear();
        Utils.log('AI system destroyed');
    }
}

// Export for module systems or global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AIHunter, VisionCone, AISystem, AI_STATES };
} else {
    window.GameAI = { AIHunter, VisionCone, AISystem, AI_STATES };
}