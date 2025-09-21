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
        this.targetDirection = this.patrolDirection; // Target direction for smooth rotation
        this.patrolChangeTime = 2000;
        this.wallCollisionCooldown = 0; // Prevent rapid wall collision responses

        // Hunting behavior properties
        this.huntingStartTime = 0;
        this.huntingSpeed = 0.12; // Faster when hunting
        this.searchTimeout = 5000; // How long to search before returning to patrol

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
        if (entity.hasComponent('AIHunter')) {
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
        const aiComponent = hunter.getComponent('AIHunter');
        const transform = hunter.getComponent('Transform');
        const movement = hunter.getComponent('Movement');
        const visionCone = hunter.getComponent('VisionCone');

        if (!aiComponent || !transform || !movement) return;

        // Update patrol timer and wall collision cooldown
        aiComponent.patrolTimer += deltaTime;
        if (aiComponent.wallCollisionCooldown > 0) {
            aiComponent.wallCollisionCooldown -= deltaTime;
        }

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

        // Check for player collision (tagging)
        this.checkPlayerCollision(hunter, gameState);

        // Apply movement with collision detection
        this.applyMovementWithCollision(transform);
    }

    updatePatrolBehavior(aiComponent, transform, movement, deltaTime) {
        // Change direction periodically
        if (aiComponent.patrolTimer >= aiComponent.patrolChangeTime) {
            aiComponent.targetDirection = Math.random() * Math.PI * 2;
            aiComponent.patrolTimer = 0;
            aiComponent.patrolChangeTime = 1500 + Math.random() * 2000; // Random between 1.5-3.5 seconds
        }

        // Smooth rotation towards target direction
        if (!aiComponent.targetDirection) {
            aiComponent.targetDirection = aiComponent.patrolDirection || 0;
        }

        // Calculate shortest rotation path
        let angleDiff = aiComponent.targetDirection - aiComponent.patrolDirection;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        // Smooth rotation with limited turn speed
        const maxTurnSpeed = 2.0; // radians per second
        const turnStep = maxTurnSpeed * (deltaTime / 1000);

        if (Math.abs(angleDiff) > turnStep) {
            aiComponent.patrolDirection += Math.sign(angleDiff) * turnStep;
        } else {
            aiComponent.patrolDirection = aiComponent.targetDirection;
        }

        // Normalize angle
        while (aiComponent.patrolDirection > Math.PI) aiComponent.patrolDirection -= 2 * Math.PI;
        while (aiComponent.patrolDirection < -Math.PI) aiComponent.patrolDirection += 2 * Math.PI;

        // Move in current direction using Movement component speed
        const speed = movement.speed || 0.08;
        transform.velocity.x = Math.cos(aiComponent.patrolDirection) * speed;
        transform.velocity.z = Math.sin(aiComponent.patrolDirection) * speed;
    }

    updateHuntingBehavior(aiComponent, transform, movement, deltaTime) {
        // Check if we should timeout and return to patrol
        const huntingDuration = Date.now() - aiComponent.huntingStartTime;
        if (huntingDuration > aiComponent.searchTimeout) {
            aiComponent.state = 'PATROL';
            Utils.log(`🔍 AI lost player, returning to PATROL mode`);
            return;
        }

        // Get vision cone to check if we still see the player
        const visionCone = this.getVisionConeFromAI(aiComponent);

        if (visionCone && visionCone.lastSeenPosition) {
            // Move toward last known player position
            const dx = visionCone.lastSeenPosition.x - transform.position.x;
            const dz = visionCone.lastSeenPosition.z - transform.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance > 0.5) { // If not at target position yet
                // Calculate direction to player
                const huntingDirection = Math.atan2(dz, dx);

                // Smooth rotation toward target (keeping 2.0 rad/sec limit)
                let angleDiff = huntingDirection - aiComponent.patrolDirection;
                while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

                const maxTurnSpeed = 3.0; // Slightly faster turning when hunting
                const turnStep = maxTurnSpeed * (deltaTime / 1000);

                if (Math.abs(angleDiff) > turnStep) {
                    aiComponent.patrolDirection += Math.sign(angleDiff) * turnStep;
                } else {
                    aiComponent.patrolDirection = huntingDirection;
                }

                // Move faster when hunting
                const huntingSpeed = aiComponent.huntingSpeed;
                transform.velocity.x = Math.cos(aiComponent.patrolDirection) * huntingSpeed;
                transform.velocity.z = Math.sin(aiComponent.patrolDirection) * huntingSpeed;
            }
        } else {
            // No last known position, just patrol faster
            this.updatePatrolBehavior(aiComponent, transform, movement, deltaTime);
        }
    }

    updateSearchingBehavior(aiComponent, transform, movement, deltaTime) {
        // For now, just continue patrol behavior
        // Will implement searching in next phase
        this.updatePatrolBehavior(aiComponent, transform, movement, deltaTime);
    }

    updateVision(hunter, visionCone, gameState) {
        // Reset vision state
        visionCone.canSeePlayer = false;
        visionCone.targetSeen = false;

        // Get AI hunter's transform
        const aiTransform = hunter.getComponent('Transform');
        if (!aiTransform) return;

        // Find local player
        const localPlayer = gameState.getLocalPlayer();
        if (!localPlayer) return;

        const playerTransform = localPlayer.getComponent('Transform');
        if (!playerTransform) return;

        // Calculate distance and angle to player
        const dx = playerTransform.position.x - aiTransform.position.x;
        const dz = playerTransform.position.z - aiTransform.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        // Check if player is within range
        if (distance > visionCone.range) {
            return; // Player too far away
        }

        // Calculate angle to player
        const angleToPlayer = Math.atan2(dx, dz);
        const aiDirection = aiTransform.rotation.y;

        // Calculate the difference between AI facing direction and direction to player
        let angleDiff = angleToPlayer - aiDirection;

        // Normalize angle difference to [-π, π]
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        // Convert vision cone angle from degrees to radians
        const visionAngleRad = (visionCone.angle * Math.PI) / 180;
        const halfVisionAngle = visionAngleRad / 2;

        // Check if player is within vision cone angle
        if (Math.abs(angleDiff) <= halfVisionAngle) {
            // Player is within vision cone - set vision state
            visionCone.canSeePlayer = true;
            visionCone.targetSeen = true;
            visionCone.lastSeenPosition = {
                x: playerTransform.position.x,
                y: playerTransform.position.y,
                z: playerTransform.position.z
            };
            visionCone.lastSeenTime = Date.now(); // Track when player was last seen

            // Trigger state change to hunting if not already hunting
            const aiComponent = hunter.getComponent('AIHunter');
            if (aiComponent && aiComponent.state === 'PATROL') {
                aiComponent.state = 'HUNTING';
                aiComponent.huntingStartTime = Date.now();
                Utils.log(`🎯 AI SPOTTED PLAYER! Switching to HUNTING mode`);
            }

            Utils.log(`AI can see player! Distance: ${distance.toFixed(2)}, Angle: ${(angleDiff * 180 / Math.PI).toFixed(1)}°`);
        }
    }

    applyMovementWithCollision(transform) {
        // Get arena bounds from ConfigManager
        const configManager = window.ConfigManager ? ConfigManager.getInstance() : null;
        const arenaSize = configManager ? configManager.get('arena.size') : 15;
        const detectionLimit = arenaSize - 1.2; // Early detection to avoid wall grinding
        const hardLimit = arenaSize - 0.5; // Hard boundary limit

        // Check if AI would hit arena boundaries and adjust direction smoothly
        const nextPosX = transform.position.x + transform.velocity.x;
        const nextPosZ = transform.position.z + transform.velocity.z;

        // Get AI component for direction adjustment
        const aiComponent = this.getAIComponentFromTransform(transform);

        // Only process wall collision if cooldown is over
        if (aiComponent && aiComponent.wallCollisionCooldown <= 0) {
            let wallHit = false;

            // Handle X-axis wall collision with early detection
            if (nextPosX > detectionLimit || nextPosX < -detectionLimit) {
                wallHit = true;
                // Calculate a direction that moves away from the wall at an angle
                const centerDirection = Math.atan2(-transform.position.z, -transform.position.x); // Direction toward center
                const randomOffset = (Math.random() - 0.5) * Math.PI; // Random component
                const newDirection = centerDirection + randomOffset;

                aiComponent.targetDirection = newDirection;
                aiComponent.patrolDirection = newDirection; // Set current direction too to avoid conflict
                aiComponent.patrolChangeTime = 1500; // Give time to get away from wall
                aiComponent.patrolTimer = 0;
                aiComponent.wallCollisionCooldown = 1000; // 1 second cooldown

                // Set velocity in the new direction immediately
                const speed = Math.sqrt(transform.velocity.x * transform.velocity.x + transform.velocity.z * transform.velocity.z);
                transform.velocity.x = Math.cos(newDirection) * speed;
                transform.velocity.z = Math.sin(newDirection) * speed;
            }
            // Handle Z-axis wall collision with early detection
            else if (nextPosZ > detectionLimit || nextPosZ < -detectionLimit) {
                wallHit = true;
                // Calculate a direction that moves away from the wall at an angle
                const centerDirection = Math.atan2(-transform.position.z, -transform.position.x); // Direction toward center
                const randomOffset = (Math.random() - 0.5) * Math.PI; // Random component
                const newDirection = centerDirection + randomOffset;

                aiComponent.targetDirection = newDirection;
                aiComponent.patrolDirection = newDirection; // Set current direction too to avoid conflict
                aiComponent.patrolChangeTime = 1500; // Give time to get away from wall
                aiComponent.patrolTimer = 0;
                aiComponent.wallCollisionCooldown = 1000; // 1 second cooldown

                // Set velocity in the new direction immediately
                const speed = Math.sqrt(transform.velocity.x * transform.velocity.x + transform.velocity.z * transform.velocity.z);
                transform.velocity.x = Math.cos(newDirection) * speed;
                transform.velocity.z = Math.sin(newDirection) * speed;
            }
        }

        // Hard boundary enforcement (for safety)
        if (Math.abs(transform.position.x) > hardLimit) {
            transform.position.x = Math.sign(transform.position.x) * hardLimit;
        }
        if (Math.abs(transform.position.z) > hardLimit) {
            transform.position.z = Math.sign(transform.position.z) * hardLimit;
        }

        // Note: MovementSystem will handle the actual position updates and boundary clamping
    }

    getAIComponentFromTransform(transform) {
        // Find the AI entity that has this transform
        for (const hunter of this.hunters) {
            if (hunter.getComponent('Transform') === transform) {
                return hunter.getComponent('AIHunter');
            }
        }
        return null;
    }

    getVisionConeFromAI(aiComponent) {
        // Find the hunter entity that has this AI component and get its vision cone
        for (const hunter of this.hunters) {
            if (hunter.getComponent('AIHunter') === aiComponent) {
                return hunter.getComponent('VisionCone');
            }
        }
        return null;
    }

    checkPlayerCollision(hunter, gameState) {
        const aiTransform = hunter.getComponent('Transform');
        if (!aiTransform) return;

        // Find local player
        const localPlayer = gameState.getLocalPlayer();
        if (!localPlayer) return;

        const playerTransform = localPlayer.getComponent('Transform');
        if (!playerTransform) return;

        // Calculate distance between AI and player
        const dx = playerTransform.position.x - aiTransform.position.x;
        const dz = playerTransform.position.z - aiTransform.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        // Check if AI is close enough to tag player
        const tagDistance = 1.2; // Distance needed to tag player
        if (distance <= tagDistance) {
            // Player has been tagged!
            this.triggerPlayerTagged(gameState);
        }
    }

    triggerPlayerTagged(gameState) {
        Utils.log(`🏃‍♂️ PLAYER TAGGED! Game Over!`);

        // Trigger game over event
        if (window.GameEngine && window.GameEngine.gameOver) {
            window.GameEngine.gameOver('tagged');
        } else {
            // Fallback: alert for now
            alert('🏃‍♂️ TAGGED! The AI Hunter caught you!\n\nGame Over!');

            // Reset player position as fallback
            const localPlayer = gameState.getLocalPlayer();
            if (localPlayer) {
                const playerTransform = localPlayer.getComponent('Transform');
                if (playerTransform) {
                    playerTransform.position.x = 0;
                    playerTransform.position.z = 0;
                }
            }
        }
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