// ==========================================
// MAIN AI SYSTEM - SIMPLIFIED MODULAR VERSION
// Uses components from ai-config.js, ai-vision.js, ai-spatial.js
// ==========================================

// ==========================================
// AI HUNTER COMPONENT - Core AI entity component
class AIHunter {
    constructor() {
        this.state = 'GUARDING_CAN'; // Start by guarding the can
        this.previousState = null;
        this.stateChangeTime = Date.now();
        this.lastTransitionTime = 0;
        this.stateHistory = [];

        // Patrol behavior
        this.patrolDirection = Math.random() * Math.PI * 2;
        this.targetDirection = this.patrolDirection;
        this.patrolTimer = 0;
        this.patrolChangeTime = AI_CONFIG.BEHAVIOR.PATROL_CHANGE_TIME;

        // Hunting behavior
        this.huntingStartTime = 0;
        this.searchTimeout = AI_CONFIG.BEHAVIOR.SEARCH_TIMEOUT;
        this.huntingSpeed = AI_CONFIG.MOVEMENT.HUNTING_SPEED;

        // Corner search
        this.currentCornerTarget = null;

        // Bollen i Burken specific properties
        this.canPosition = { x: 0, z: 0 }; // Will be set when can is found
        this.playerSpottedTime = 0;
        this.isRacingToCan = false;
        this.lastPlayerPosition = null;
        this.lastSpottedPlayerId = null; // For race-to-can elimination mechanics
        this.isBlindfolded = false; // Traditional counting phase

        // Behavior memory
        this.behaviorMemory = {
            timeInCurrentState: 0,
            stateChangeReason: 'initialization',
            lastPlayerSeen: 0,
            frustrationLevel: 0
        };
    }

    // State management - prevents thrashing
    canTransitionTo(newState) {
        const currentTime = Date.now();
        const timeInState = currentTime - this.stateChangeTime;

        // Prevent rapid state changes
        if (timeInState < AI_CONFIG.BEHAVIOR.MIN_STATE_TIME) {
            return false;
        }

        // Prevent transition cooldown
        if (currentTime - this.lastTransitionTime < AI_CONFIG.BEHAVIOR.TRANSITION_COOLDOWN) {
            return false;
        }

        // Check for state oscillation
        if (this.isStateOscillating(newState)) {
            return false;
        }

        return true;
    }

    isStateOscillating(newState) {
        if (!this.stateHistory) {
            this.stateHistory = [];
        }

        const recentStates = this.stateHistory.slice(-4);
        const oscillationCount = recentStates.filter(state => state === newState).length;
        return oscillationCount >= 2;
    }

    transitionToState(newState, reason = 'unknown') {
        if (!this.canTransitionTo(newState)) {
            return false;
        }

        // Update state history
        if (!this.stateHistory) {
            this.stateHistory = [];
        }
        this.stateHistory.push(this.state);
        if (this.stateHistory.length > 10) {
            this.stateHistory.shift();
        }

        this.previousState = this.state;
        this.state = newState;
        this.lastTransitionTime = Date.now();
        this.stateChangeTime = Date.now();
        this.behaviorMemory.timeInCurrentState = 0;
        this.behaviorMemory.stateChangeReason = reason;

        Utils.log(`🤖 AI State: ${this.previousState} → ${newState} (${reason})`);
        return true;
    }
}

// AI System - manages all AI entities
class AISystem extends System {
    constructor() {
        super();
        this.name = 'AISystem';
        this.enabled = true;
        this.hunters = new Set();
        // Vision system removed - will be rebuilt simply
        Utils.log('AI system initialized');
    }

    addEntity(entity) {
        if (entity.hasComponent('AIHunter')) {
            this.hunters.add(entity);
            Utils.log(`AI hunter entity added: ${entity.id}`);
        }
    }

    // Create AI hunter entity (moved from player.js for proper architecture)
    createAIHunter(hunterId, scene, gameEngine, position = null) {
        // Create AI hunter mesh
        const geometry = new THREE.BoxGeometry(0.9, 1.1, 0.9);
        const material = new THREE.MeshLambertMaterial({
            color: 0x8B4513, // Brown color for AI hunter
            transparent: true,
            opacity: 0.9
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;

        // Position AI hunter
        const spawnPos = position || {
            x: Math.random() * 20 - 10,
            y: 0.55,
            z: Math.random() * 20 - 10
        };
        mesh.position.set(spawnPos.x, spawnPos.y, spawnPos.z);
        scene.add(mesh);

        // Create AI entity
        const aiEntity = gameEngine.gameState.createEntity();
        aiEntity.addComponent(new Transform(spawnPos.x, spawnPos.y, spawnPos.z));
        aiEntity.addComponent(new Movement(AI_CONFIG.MOVEMENT.PATROL_SPEED));
        aiEntity.addComponent(new Renderable(mesh));
        aiEntity.addComponent(new AIHunter());

        // Vision system will be added back later - simplified

        aiEntity.addComponent(new SpatialAwareness(aiEntity.id));

        // Register with AI system
        this.addEntity(aiEntity);

        Utils.log(`Created AI hunter: ${hunterId} at position (${spawnPos.x}, ${spawnPos.z})`);
        return aiEntity;
    }

    removeEntity(entity) {
        this.hunters.delete(entity);
    }

    update(gameState, deltaTime) {
        if (!this.enabled) return;

        // AI is blindfolded during countdown - traditional Bollen i Burken rules
        if (window.GameEngine && window.GameEngine.gameStatus === 'countdown') {
            // Stop all AI movement during countdown
            this.hunters.forEach(hunter => {
                const transform = hunter.getComponent('Transform');
                if (transform) {
                    transform.velocity.x = 0;
                    transform.velocity.z = 0;
                }

                // Set AI to idle/blindfolded state
                const aiComponent = hunter.getComponent('AIHunter');
                if (aiComponent && !aiComponent.isBlindfolded) {
                    aiComponent.isBlindfolded = true;
                    aiComponent.state = 'COUNTING'; // Special state during countdown
                    Utils.log('🙈 AI Hunter is now blindfolded and counting!');
                }
            });
            return; // Skip all AI processing during countdown
        }

        // Re-enable AI when countdown ends
        this.hunters.forEach(hunter => {
            const aiComponent = hunter.getComponent('AIHunter');
            if (aiComponent && aiComponent.isBlindfolded) {
                aiComponent.isBlindfolded = false;
                aiComponent.state = 'GUARDING_CAN'; // Resume normal behavior
                Utils.log('👀 AI Hunter is no longer blindfolded! Game begins!');
            }
        });

        // Update behavior memory timers
        for (const hunter of this.hunters) {
            const aiComponent = hunter.getComponent('AIHunter');
            if (aiComponent) {
                aiComponent.behaviorMemory.timeInCurrentState += deltaTime;
                aiComponent.patrolTimer += deltaTime;
            }
        }

        for (const hunter of this.hunters) {
            try {
                this.updateHunter(hunter, gameState, deltaTime);
            } catch (error) {
                Utils.error(`AI hunter update failed for entity ${hunter.id}`, error);
            }
        }
    }

    updateHunter(hunter, gameState, deltaTime) {
        const aiComponent = hunter.getComponent('AIHunter');
        const transform = hunter.getComponent('Transform');
        const movement = hunter.getComponent('Movement');
        // VisionCone component removed
        const spatialAwareness = hunter.getComponent('SpatialAwareness');

        if (!aiComponent || !transform || !movement) return;

        // 🛠️ DEBUG MODE: Check if AI should be frozen
        const isAIFrozen = AI_CONFIG.DEBUG && AI_CONFIG.DEBUG.FREEZE_AI;
        const isMovementFrozen = AI_CONFIG.DEBUG && (AI_CONFIG.DEBUG.FREEZE_AI || AI_CONFIG.DEBUG.FREEZE_MOVEMENT);
        const isRotationFrozen = AI_CONFIG.DEBUG && (AI_CONFIG.DEBUG.FREEZE_AI || AI_CONFIG.DEBUG.FREEZE_ROTATION);
        const isManualControl = AI_CONFIG.DEBUG && AI_CONFIG.DEBUG.MANUAL_AI_CONTROL;

        // Skip all AI behavior if completely frozen
        if (isAIFrozen) {
            // Still update vision for testing, but no movement/rotation
            // Player spotting removed
            return;
        }

        // Update spatial awareness
        if (spatialAwareness) {
            spatialAwareness.updateObstacleCache(transform.position, gameState);
            spatialAwareness.updateStuckDetection(transform.position);
        }

        // Update AI behavior based on current state
        switch (aiComponent.state) {
            case 'COUNTING':
                // AI is blindfolded and counting - no movement or vision
                transform.velocity.x = 0;
                transform.velocity.z = 0;
                break;
            case 'PATROL':
                this.updatePatrolBehavior(aiComponent, transform, movement, spatialAwareness, deltaTime);
                break;
            case 'GUARDING_CAN':
                this.updateGuardingCanBehavior(aiComponent, transform, movement, spatialAwareness, gameState, deltaTime);
                break;
            case 'RACING_TO_CAN':
                this.updateRacingToCanBehavior(aiComponent, transform, movement, spatialAwareness, gameState, deltaTime);
                break;
            case 'HUNTING':
                this.updateHuntingBehavior(hunter, aiComponent, transform, movement, spatialAwareness, deltaTime);
                break;
            case 'SEARCHING':
                this.updatePatrolBehavior(aiComponent, transform, movement, spatialAwareness, deltaTime);
                break;
            case 'STUCK_ESCAPE':
                this.updateStuckEscapeBehavior(aiComponent, transform, movement, spatialAwareness, deltaTime);
                break;
        }

        // Vision system removed - will add simple detection later

        // Check if AI can eliminate player at can (only if not blindfolded)
        if (!aiComponent.isBlindfolded && aiComponent.state !== 'COUNTING') {
            this.checkCanElimination(hunter, gameState);
        }

        // Apply movement with collision detection
        this.applyMovementWithCollision(transform);
    }

    // ==========================================
    // BOLLEN I BURKEN SPECIFIC BEHAVIORS
    // ==========================================

    updateGuardingCanBehavior(aiComponent, transform, movement, spatialAwareness, gameState, deltaTime) {
        // Find and store can position
        this.updateCanPosition(aiComponent, gameState);

        const canPos = aiComponent.canPosition;
        const aiPos = transform.position;

        // Calculate distance to can
        const dx = canPos.x - aiPos.x;
        const dz = canPos.z - aiPos.z;
        const distanceToCan = Math.sqrt(dx * dx + dz * dz);

        // If too far from can, move back toward it
        if (distanceToCan > AI_CONFIG.BEHAVIOR.CAN_GUARD_DISTANCE) {
            const direction = Math.atan2(dz, dx);
            aiComponent.targetDirection = direction;

            // Move toward can
            const speed = movement.speed || AI_CONFIG.MOVEMENT.PATROL_SPEED;

            // 🛠️ DEBUG MODE: Skip movement if frozen
            const isMovementFrozen = AI_CONFIG.DEBUG && (AI_CONFIG.DEBUG.FREEZE_AI || AI_CONFIG.DEBUG.FREEZE_MOVEMENT);
            if (isMovementFrozen) {
                transform.velocity.x = 0;
                transform.velocity.z = 0;
            } else {
                transform.velocity.x = Math.cos(direction) * speed;
                transform.velocity.z = Math.sin(direction) * speed;
            }

            Utils.log(`🛡️ AI returning to guard can (distance: ${distanceToCan.toFixed(1)})`);;
        } else {
            // Patrol around the can while guarding
            this.patrolAroundCan(aiComponent, transform, movement, spatialAwareness, deltaTime);
        }
    }

    patrolAroundCan(aiComponent, transform, movement, spatialAwareness, deltaTime) {
        // Patrol in a circle around the can
        aiComponent.patrolTimer += deltaTime;

        if (aiComponent.patrolTimer >= aiComponent.patrolChangeTime) {
            // Change direction - pick new angle around can
            const canPos = aiComponent.canPosition;
            const randomAngle = Math.random() * Math.PI * 2;
            const patrolRadius = AI_CONFIG.BEHAVIOR.GUARD_PATROL_RADIUS;

            // Target position around can
            const targetX = canPos.x + Math.cos(randomAngle) * patrolRadius;
            const targetZ = canPos.z + Math.sin(randomAngle) * patrolRadius;

            // Direction to target
            aiComponent.targetDirection = Math.atan2(targetZ - transform.position.z, targetX - transform.position.x);
            aiComponent.patrolTimer = 0;
            aiComponent.patrolChangeTime = AI_CONFIG.BEHAVIOR.PATROL_CHANGE_TIME + Math.random() * AI_CONFIG.BEHAVIOR.PATROL_TIME_VARIANCE;

            Utils.log(`🔄 AI patrolling around can: new angle ${(randomAngle * 180 / Math.PI).toFixed(1)}°`);
        }

        // Smooth rotation toward can
        this.smoothRotateToTarget(aiComponent, deltaTime, transform, transform);

        // Move in patrol direction with obstacle avoidance
        let targetDirection = aiComponent.targetDirection || aiComponent.patrolDirection;

        // Apply obstacle avoidance
        if (spatialAwareness) {
            const collisions = spatialAwareness.detectCollisionAhead(transform.position, aiComponent.patrolDirection);
            if (collisions.length > 0) {
                const avoidanceVector = spatialAwareness.calculateAvoidanceVector(collisions, aiComponent.patrolDirection);
                targetDirection = Math.atan2(avoidanceVector.z, avoidanceVector.x);
            }
        }

        // Apply movement
        const speed = movement.speed || AI_CONFIG.MOVEMENT.PATROL_SPEED;
        transform.velocity.x = Math.cos(targetDirection) * speed;
        transform.velocity.z = Math.sin(targetDirection) * speed;
    }

    updateRacingToCanBehavior(aiComponent, transform, movement, spatialAwareness, gameState, deltaTime) {
        // Race back to can as fast as possible
        this.updateCanPosition(aiComponent, gameState);

        const canPos = aiComponent.canPosition;
        const aiPos = transform.position;

        // Direct path to can
        const dx = canPos.x - aiPos.x;
        const dz = canPos.z - aiPos.z;
        const distanceToCan = Math.sqrt(dx * dx + dz * dz);
        const direction = Math.atan2(dz, dx);

        // Set direction and move at increased speed
        aiComponent.targetDirection = direction;
        const raceSpeed = (movement.speed || AI_CONFIG.MOVEMENT.PATROL_SPEED) * AI_CONFIG.BEHAVIOR.RETURN_TO_CAN_SPEED;

        // Apply obstacle avoidance even while racing
        let finalDirection = direction;
        if (spatialAwareness) {
            const collisions = spatialAwareness.detectCollisionAhead(transform.position, direction);
            if (collisions.length > 0) {
                const avoidanceVector = spatialAwareness.calculateAvoidanceVector(collisions, direction);
                // Blend racing direction with avoidance (70% race, 30% avoid)
                finalDirection = direction * 0.7 + Math.atan2(avoidanceVector.z, avoidanceVector.x) * 0.3;
            }
        }

        transform.velocity.x = Math.cos(finalDirection) * raceSpeed;
        transform.velocity.z = Math.sin(finalDirection) * raceSpeed;

        // Check timeout - if taking too long, give up race
        const raceTime = Date.now() - aiComponent.playerSpottedTime;
        if (raceTime > AI_CONFIG.BEHAVIOR.PLAYER_SPOTTED_RACE_TIME) {
            Utils.log(`⏰ AI race timeout - returning to guarding`);
            aiComponent.isRacingToCan = false;
            aiComponent.transitionToState('GUARDING_CAN', 'race_timeout');
        }

        Utils.log(`🏃‍♂️ AI racing to can! Distance: ${distanceToCan.toFixed(1)}, Speed: ${raceSpeed.toFixed(2)}`);
    }

    updateCanPosition(aiComponent, gameState) {
        // Find the central can entity and store its position
        for (const entity of gameState.entities.values()) {
            const interactable = entity.getComponent('Interactable');
            const transform = entity.getComponent('Transform');

            if (interactable && transform && (interactable.type === 'can' || interactable.type === 'burken')) {
                aiComponent.canPosition.x = transform.position.x;
                aiComponent.canPosition.z = transform.position.z;
                return;
            }
        }
    }

    handlePlayerSpotting(hunter, visionCone, gameState) {
        // Update vision system
        this.visionSystem.updateVision(hunter, visionCone, gameState);

        const aiComponent = hunter.getComponent('AIHunter');
        if (!aiComponent) return;

        // If player is spotted and we're guarding, switch to racing
        if (visionCone.canSeePlayer && aiComponent.state === 'GUARDING_CAN') {
            Utils.log(`👀 PLAYER SPOTTED! AI racing to can to eliminate!`);

            aiComponent.playerSpottedTime = Date.now();
            aiComponent.isRacingToCan = true;
            aiComponent.transitionToState('RACING_TO_CAN', 'player_spotted');

            // Store last seen position and player ID for elimination
            const localPlayer = gameState.getLocalPlayer();
            if (localPlayer) {
                const playerTransform = localPlayer.getComponent('Transform');
                const playerComponent = localPlayer.getComponent('Player');

                if (playerTransform) {
                    aiComponent.lastPlayerPosition = { ...playerTransform.position };
                }

                if (playerComponent) {
                    aiComponent.lastSpottedPlayerId = playerComponent.playerId;
                    Utils.log(`🎯 AI will try to eliminate player: ${aiComponent.lastSpottedPlayerId}`);
                }
            }
        }
    }

    smoothRotateToTarget(aiComponent, deltaTime, transform = null, customTurnSpeed = null) {
        if (aiComponent.targetDirection === undefined || aiComponent.targetDirection === null) {
            return;
        }

        // 🛠️ DEBUG MODE: Skip rotation if frozen
        const isRotationFrozen = AI_CONFIG.DEBUG && (AI_CONFIG.DEBUG.FREEZE_AI || AI_CONFIG.DEBUG.FREEZE_ROTATION);
        if (isRotationFrozen) {
            return;
        }

        // Calculate shortest rotation path
        let angleDiff = aiComponent.targetDirection - aiComponent.patrolDirection;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        // Smooth rotation with limited turn speed
        const turnSpeed = customTurnSpeed || AI_CONFIG.MOVEMENT.TURN_SPEED;
        const turnStep = turnSpeed * (deltaTime / 1000);

        if (Math.abs(angleDiff) > turnStep) {
            aiComponent.patrolDirection += Math.sign(angleDiff) * turnStep;
        } else {
            aiComponent.patrolDirection = aiComponent.targetDirection;
        }

        // Normalize angle
        while (aiComponent.patrolDirection > Math.PI) aiComponent.patrolDirection -= 2 * Math.PI;
        while (aiComponent.patrolDirection < -Math.PI) aiComponent.patrolDirection += 2 * Math.PI;

        // 🔧 VISION FIX: Sync visual rotation with patrol direction  
        // Use same coordinate system as vision mesh for consistency
        if (transform) {
            transform.rotation.y = aiComponent.patrolDirection;
        }
    }

    // ==========================================
    // TRADITIONAL AI BEHAVIORS (Updated)
    // ==========================================

    updatePatrolBehavior(aiComponent, transform, movement, spatialAwareness, deltaTime) {
        let targetDirection = aiComponent.targetDirection || aiComponent.patrolDirection;

        // Check for obstacles ahead
        if (spatialAwareness) {
            const collisions = spatialAwareness.detectCollisionAhead(
                transform.position,
                aiComponent.patrolDirection
            );

            if (collisions.length > 0) {
                const avoidanceVector = spatialAwareness.calculateAvoidanceVector(
                    collisions,
                    aiComponent.patrolDirection
                );
                targetDirection = Math.atan2(avoidanceVector.z, avoidanceVector.x);
                Utils.log(`🚨 AI avoiding ${collisions.length} obstacles`);
            }
        }

        // Change direction periodically
        if (!spatialAwareness || !spatialAwareness.isAvoiding) {
            if (aiComponent.patrolTimer >= aiComponent.patrolChangeTime) {
                targetDirection = Math.random() * Math.PI * 2;
                aiComponent.patrolTimer = 0;
                aiComponent.patrolChangeTime = AI_CONFIG.BEHAVIOR.PATROL_CHANGE_TIME + Math.random() * AI_CONFIG.BEHAVIOR.PATROL_TIME_VARIANCE;
                Utils.log(`🚶 AI patrol: new direction ${(targetDirection * 180 / Math.PI).toFixed(1)}°`);
            }
        }

        // Update target direction
        aiComponent.targetDirection = targetDirection;

        // Smooth rotation
        this.smoothRotateToTarget(aiComponent, deltaTime);

        // Apply velocity
        const speed = movement.speed || AI_CONFIG.MOVEMENT.PATROL_SPEED;

        // 🛠️ DEBUG MODE: Skip movement if frozen
        const isMovementFrozen = AI_CONFIG.DEBUG && (AI_CONFIG.DEBUG.FREEZE_AI || AI_CONFIG.DEBUG.FREEZE_MOVEMENT);
        if (isMovementFrozen) {
            transform.velocity.x = 0;
            transform.velocity.z = 0;
        } else {
            transform.velocity.x = Math.cos(aiComponent.patrolDirection) * speed;
            transform.velocity.z = Math.sin(aiComponent.patrolDirection) * speed;
        }
    }

    updateHuntingBehavior(hunter, aiComponent, transform, movement, spatialAwareness, deltaTime) {
        const huntingDuration = Date.now() - aiComponent.huntingStartTime;
        if (huntingDuration > aiComponent.searchTimeout) {
            aiComponent.state = 'PATROL';
            Utils.log(`🔍 AI lost player, returning to PATROL mode`);
            return;
        }

        // VisionCone component removed
        if (visionCone && visionCone.lastSeenPosition) {
            const dx = visionCone.lastSeenPosition.x - transform.position.x;
            const dz = visionCone.lastSeenPosition.z - transform.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance > 0.5) {
                let huntingDirection = Math.atan2(dz, dx);

                // Apply obstacle avoidance during hunting
                if (spatialAwareness) {
                    const collisions = spatialAwareness.detectCollisionAhead(
                        transform.position,
                        huntingDirection
                    );

                    if (collisions.length > 0) {
                        const avoidanceVector = spatialAwareness.calculateAvoidanceVector(
                            collisions,
                            huntingDirection
                        );
                        const avoidanceDirection = Math.atan2(avoidanceVector.z, avoidanceVector.x);
                        const blendFactor = Math.min(collisions.length * 0.3, 0.8);

                        let angleDiff = avoidanceDirection - huntingDirection;
                        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

                        huntingDirection += angleDiff * blendFactor;
                        Utils.log(`🎯 AI hunting with obstacle avoidance: ${collisions.length} obstacles`);
                    }
                }

                // Smooth rotation toward target
                let angleDiff = huntingDirection - aiComponent.patrolDirection;
                while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

                const maxTurnSpeed = AI_CONFIG.MOVEMENT.HUNT_TURN_SPEED;
                const turnStep = maxTurnSpeed * (deltaTime / 1000);

                if (Math.abs(angleDiff) > turnStep) {
                    aiComponent.patrolDirection += Math.sign(angleDiff) * turnStep;
                } else {
                    aiComponent.patrolDirection = huntingDirection;
                }

                // Move faster when hunting
                const huntingSpeed = AI_CONFIG.MOVEMENT.HUNTING_SPEED;

                // 🛠️ DEBUG MODE: Skip movement if frozen
                const isMovementFrozen = AI_CONFIG.DEBUG && (AI_CONFIG.DEBUG.FREEZE_AI || AI_CONFIG.DEBUG.FREEZE_MOVEMENT);
                if (isMovementFrozen) {
                    transform.velocity.x = 0;
                    transform.velocity.z = 0;
                } else {
                    transform.velocity.x = Math.cos(aiComponent.patrolDirection) * huntingSpeed;
                    transform.velocity.z = Math.sin(aiComponent.patrolDirection) * huntingSpeed;
                }

                Utils.log(`🎯 AI hunting player: distance ${distance.toFixed(1)}`);
            }
        } else {
            this.updatePatrolBehavior(aiComponent, transform, movement, spatialAwareness, deltaTime);
        }
    }

    updateStuckEscapeBehavior(aiComponent, transform, movement, spatialAwareness, deltaTime) {
        if (!spatialAwareness) {
            aiComponent.transitionToState('PATROL', 'no_spatial_awareness');
            return;
        }

        const escapeVector = spatialAwareness.generateEscapeVector(transform.position);
        const escapeDirection = Math.atan2(escapeVector.z, escapeVector.x);

        // Apply strong escape movement
        const escapeSpeed = AI_CONFIG.MOVEMENT.PATROL_SPEED * 2.0;

        // 🛠️ DEBUG MODE: Skip movement if frozen but allow rotation for testing
        const isMovementFrozen = AI_CONFIG.DEBUG && (AI_CONFIG.DEBUG.FREEZE_AI || AI_CONFIG.DEBUG.FREEZE_MOVEMENT);
        if (isMovementFrozen) {
            transform.velocity.x = 0;
            transform.velocity.z = 0;
        } else {
            transform.velocity.x = Math.cos(escapeDirection) * escapeSpeed;
            transform.velocity.z = Math.sin(escapeDirection) * escapeSpeed;
        }

        // Use smooth rotation instead of instant assignment for stuck escape
        aiComponent.targetDirection = escapeDirection;
        Utils.log(`🚨 AI escaping stuck state - rotating smoothly to ${(escapeDirection * 180 / Math.PI).toFixed(1)}°`);
    }

    checkCanElimination(hunter, gameState) {
    }

    smoothRotateToTarget(aiComponent, deltaTime) {
        if (!aiComponent.targetDirection) return;

        let angleDiff = aiComponent.targetDirection - aiComponent.patrolDirection;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        const maxTurnSpeed = AI_CONFIG.MOVEMENT.TURN_SPEED;
        const turnStep = maxTurnSpeed * (deltaTime / 1000);

        if (Math.abs(angleDiff) > turnStep) {
            aiComponent.patrolDirection += Math.sign(angleDiff) * turnStep;
        } else {
            aiComponent.patrolDirection = aiComponent.targetDirection;
        }

        // Normalize angle
        while (aiComponent.patrolDirection > Math.PI) aiComponent.patrolDirection -= 2 * Math.PI;
        while (aiComponent.patrolDirection < -Math.PI) aiComponent.patrolDirection += 2 * Math.PI;
    }

    checkCanElimination(hunter, gameState) {
        const localPlayer = gameState.getLocalPlayer();
        if (!localPlayer) return;

        const aiComponent = hunter.getComponent('AIHunter');
        if (!aiComponent || !aiComponent.isRacingToCan) return;

        // Find the central can entity
        let canEntity = null;
        for (const entity of gameState.entities.values()) {
            const interactable = entity.getComponent('Interactable');
            if (interactable && (interactable.type === 'can' || interactable.type === 'burken')) {
                canEntity = entity;
                break;
            }
        }

        if (!canEntity) return;

        const aiTransform = hunter.getComponent('Transform');
        const canTransform = canEntity.getComponent('Transform');
        if (!aiTransform || !canTransform) return;

        // Check if AI reached the can first
        const dx = aiTransform.position.x - canTransform.position.x;
        const dz = aiTransform.position.z - canTransform.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance <= AI_CONFIG.BEHAVIOR.CAN_ELIMINATION_DISTANCE) {
            // AI reached can first - player is eliminated!
            const eliminatedPlayerId = aiComponent.lastSpottedPlayerId || 'player';

            // Use interaction system for proper visual effects
            const interactionSystem = window.GameEngine?.getSystem('InteractionSystem');
            if (interactionSystem && typeof interactionSystem.handleAIElimination === 'function') {
                interactionSystem.handleAIElimination(hunter, canEntity, gameState, eliminatedPlayerId);
            } else {
                // Fallback if interaction system not available
                Utils.log(`🤖 AI ELIMINATION! AI reached can first - Player ${eliminatedPlayerId} is eliminated!`);

                if (window.GameEngine && typeof window.GameEngine.gameOver === 'function') {
                    window.GameEngine.gameOver('tagged');
                } else {
                    Utils.error('GameEngine not available - cannot trigger game over');
                }

                // Reset AI state
                aiComponent.isRacingToCan = false;
                aiComponent.transitionToState('GUARDING_CAN', 'player_eliminated');
            }
        }
    }

    applyMovementWithCollision(transform) {
        // This would normally be handled by the MovementSystem
        // For now, just ensure velocity is applied
        if (transform.velocity) {
            // The movement will be handled by the MovementSystem in player.js
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

// Debug function
window.debugAI = function () {
    const gameEngine = window.gameEngine;
    if (!gameEngine) {
        console.log('❌ Game engine not found');
        return;
    }

    const aiSystem = gameEngine.getSystem('AISystem');
    if (!aiSystem) {
        console.log('❌ AI system not found');
        return;
    }

    const hunters = aiSystem.getHunters();
    console.log(`🔍 Found ${hunters.length} AI hunters`);

    hunters.forEach((hunter, index) => {
        const aiComponent = hunter.getComponent('AIHunter');
        const transform = hunter.getComponent('Transform');
        const spatialAwareness = hunter.getComponent('SpatialAwareness');

        console.log(`\n🤖 Hunter ${index + 1}:`);
        console.log(`  State: ${aiComponent ? aiComponent.state : 'N/A'}`);
        console.log(`  Position: (${transform ? transform.position.x.toFixed(1) : 'N/A'}, ${transform ? transform.position.z.toFixed(1) : 'N/A'})`);

        if (spatialAwareness) {
            const debugInfo = spatialAwareness.getDebugInfo();
            console.log(`  Obstacles: ${debugInfo.obstacleCount} | Stuck: ${debugInfo.stuckCounter}`);
        }
    });
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AIHunter, AISystem };
} else {
    window.GameAI = { AIHunter, AISystem };
}