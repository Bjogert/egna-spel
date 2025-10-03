/* ==========================================
   AI SYSTEM
   Manages hunter behaviour and vision checks
   ========================================== */

(function (global) {
    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const AI_STATES = {
        PATROL: 'PATROL',      // Orbit can at ~3m radius
        RACE: 'RACE'           // Sprint straight to can
    };

    class AISystem extends System {
        constructor() {
            super('AISystem');
            this.hunters = new Set();
            this.aiFrozen = false;  // Debug toggle to freeze AI
            this.hearingRange = 8.0;  // How far AI can hear
            this.registerTweaks();
            Utils.log('AI system initialized');
        }

        registerTweaks() {
            if (!window.TweakPanel) return;

            window.TweakPanel.addSetting('AI', 'Freeze AI', {
                type: 'checkbox',
                label: 'Freeze AI (for testing)',
                getValue: () => this.aiFrozen,
                setValue: (v) => this.aiFrozen = v
            });

            window.TweakPanel.addSetting('AI', 'Hearing Range', {
                type: 'range',
                min: 2,
                max: 20,
                step: 0.5,
                decimals: 1,
                label: 'Hearing Range (meters)',
                getValue: () => this.hearingRange || 8.0,
                setValue: (v) => this.hearingRange = v
            });
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
            if (!gameState || gameState.gamePhase !== GAME_STATES.PLAYING) {
                return;
            }

            // Skip AI updates if frozen (for testing)
            if (this.aiFrozen) {
                return;
            }

            for (const hunter of this.hunters) {
                if (!hunter.active) {
                    this.hunters.delete(hunter);
                    continue;
                }

                try {
                    this.updateHunter(hunter, gameState, deltaTime);
                } catch (error) {
                    Utils.error(`AI Hunter ${hunter.id} update failed:`, error);
                    console.error(`Hunter ${hunter.id} update failed:`, error);
                }
            }
        }

        updateHunter(hunter, gameState, deltaTime) {
            const aiComponent = hunter.getComponent('AIHunter');
            const transform = hunter.getComponent('Transform');
            const movement = hunter.getComponent('Movement');
            const visionCone = hunter.getComponent('VisionCone');

            if (!aiComponent || !transform || !movement) {
                return;
            }

            if (aiComponent.wallCollisionCooldown > 0) {
                aiComponent.wallCollisionCooldown -= deltaTime;
            }

            switch (aiComponent.state) {
                case AI_STATES.PATROL:
                    this.updatePatrolBehavior(aiComponent, transform, movement, deltaTime, gameState);
                    break;
                case AI_STATES.RACE:
                    this.updateRaceBehavior(aiComponent, transform, movement, deltaTime, gameState);
                    break;
            }

            if (visionCone) {
                this.updateVision(hunter, visionCone, gameState);
            }

            // Check if AI can hear player
            this.updateHearing(hunter, gameState);

            this.checkPlayerCollision(hunter, gameState);
        }

        updateHearing(hunter, gameState) {
            const aiTransform = hunter.getComponent('Transform');
            if (!aiTransform) return;

            const localPlayer = gameState.getLocalPlayer();
            if (!localPlayer) return;

            const playerTransform = localPlayer.getComponent('Transform');
            if (!playerTransform) return;

            // Calculate distance to player
            const dx = playerTransform.position.x - aiTransform.position.x;
            const dz = playerTransform.position.z - aiTransform.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            // Get player movement info
            const movementSystem = window.movementSystem;
            const audioSystem = window.audioSystem;

            if (!movementSystem || !audioSystem) return;

            const playerSpeed = movementSystem.playerCurrentSpeed;
            const isSneaking = movementSystem.isSneaking;

            // Calculate sound level based on speed and sneaking
            let soundLevel = playerSpeed / movementSystem.playerMaxSpeed;  // 0-1 range
            if (isSneaking) {
                soundLevel *= audioSystem.sneakVolumeMultiplier;  // Quieter when sneaking
            }

            // Effective hearing range based on sound level
            const effectiveRange = this.hearingRange * soundLevel;

            // Check if player is within hearing range
            const aiComponent = hunter.getComponent('AIHunter');
            if (distance <= effectiveRange && playerSpeed > 0.01) {
                // AI hears player!
                if (aiComponent && aiComponent.state === AI_STATES.PATROL && !aiComponent.reactionState) {
                    aiComponent.reactionState = 'SPOTTED';
                    aiComponent.reactionStartTime = Date.now();
                    Utils.log(`AI heard player at distance ${distance.toFixed(2)}m! (range: ${effectiveRange.toFixed(2)})`);
                }
            }
        }

        updatePatrolBehavior(aiComponent, transform, movement, deltaTime, gameState) {
            const dt = deltaTime / 1000;  // Convert to seconds

            // Handle reaction sequence if player was spotted
            if (aiComponent.reactionState) {
                this.handleReaction(aiComponent, transform, deltaTime);
                return;  // Don't do normal patrol while reacting
            }

            // Check if stuck and need emergency unstuck
            if (ObstacleAvoidance.isStuckOnWall(aiComponent, transform, deltaTime)) {
                ObstacleAvoidance.unstuck(aiComponent);
                Utils.log('AI unstuck - rotated away from wall');
            }

            // Get obstacle avoidance steering and obstacle positions
            const staticColliders = this.getStaticColliders(gameState);
            const avoidance = ObstacleAvoidance.computeObstacleAvoidance(
                transform,
                aiComponent,
                staticColliders,
                3.0  // Look ahead 3.0 meters
            );

            // Extract obstacle positions for intelligent scanning
            const obstacles = staticColliders
                .filter(o => !o.collider.isWall)  // Ignore walls, focus on hiding spots
                .map(o => ({ position: { x: o.transform.position.x, z: o.transform.position.z } }));

            // Use CAN-GUARDING strategy (orbit can, check obstacles systematically)
            const canPosition = this.getCanPosition(gameState);
            const guardPatrol = CanGuardStrategy.computeCanGuardPatrol(
                aiComponent,
                transform,
                canPosition,
                dt,
                obstacles  // Pass obstacles so AI knows where to look
            );

            // Combine guard patrol + avoidance (balanced for smooth navigation)
            const combinedSteering = SteeringBehaviors.combineSteeringBehaviors([
                { steering: guardPatrol, weight: 1.0 },
                { steering: avoidance, weight: 3.0 }  // Avoidance 3x important (reduced from 5x to avoid corner sticking)
            ]);

            // Update heading (rotation)
            aiComponent.heading += combinedSteering.angular * dt;
            aiComponent.heading = SteeringBehaviors.normalizeAngle(aiComponent.heading);

            // Update velocity with acceleration
            aiComponent.velocity.x += combinedSteering.linear.x * dt;
            aiComponent.velocity.z += combinedSteering.linear.z * dt;

            // Clamp to max patrol speed
            const currentSpeed = Math.sqrt(
                aiComponent.velocity.x * aiComponent.velocity.x +
                aiComponent.velocity.z * aiComponent.velocity.z
            );

            if (currentSpeed > aiComponent.maxSpeed) {
                const scale = aiComponent.maxSpeed / currentSpeed;
                aiComponent.velocity.x *= scale;
                aiComponent.velocity.z *= scale;
            }

            // Apply friction (less friction for more responsive movement)
            const friction = 0.92;
            aiComponent.velocity.x *= friction;
            aiComponent.velocity.z *= friction;

            // Update transform (apply to entity)
            transform.velocity.x = aiComponent.velocity.x;
            transform.velocity.z = aiComponent.velocity.z;
            transform.rotation.y = aiComponent.heading;
        }

        getCanPosition(gameState) {
            // Find can entity in game state
            for (const entity of gameState.entities.values()) {
                if (entity.getComponent('Interactable')) {
                    const interactable = entity.getComponent('Interactable');
                    if (interactable.type === 'can') {
                        const transform = entity.getComponent('Transform');
                        if (transform) {
                            return { x: transform.position.x, y: transform.position.y, z: transform.position.z };
                        }
                    }
                }
            }

            // Fallback: can is at center (0, 0.3, 0)
            return { x: 0, y: 0.3, z: 0 };
        }

        getStaticColliders(gameState) {
            const colliders = [];
            for (const entity of gameState.entities.values()) {
                const collider = entity.getComponent('Collider');
                const transform = entity.getComponent('Transform');

                if (collider && transform && collider.isStatic && collider.blockMovement) {
                    colliders.push({ collider, transform });
                }
            }
            return colliders;
        }

        handleReaction(aiComponent, transform, deltaTime) {
            const now = Date.now();
            const reactionElapsed = now - aiComponent.reactionStartTime;

            // Stop moving during reaction (freeze in surprise)
            transform.velocity.x = 0;
            transform.velocity.z = 0;
            aiComponent.velocity.x = 0;
            aiComponent.velocity.z = 0;

            // Jump animation at 200ms
            if (reactionElapsed >= aiComponent.reactionJumpTime && aiComponent.reactionState === 'SPOTTED') {
                // Trigger jump (quick up-down motion)
                transform.position.y += 0.3;  // Jump up
                aiComponent.reactionState = 'REACTING';  // Mark that we've jumped
                Utils.log('AI JUMPS in surprise!');
            }

            // Return to ground if we jumped
            if (transform.position.y > 0.5) {
                transform.position.y = Math.max(0.5, transform.position.y - deltaTime * 0.003);  // Fall back down
            }

            // After reaction time, start racing
            if (reactionElapsed >= aiComponent.reactionDuration) {
                aiComponent.state = AI_STATES.RACE;
                aiComponent.raceLockUntil = now + 2000;  // Lock in race for 2 seconds
                aiComponent.reactionState = null;
                aiComponent.currentSpeed = 0;  // Start from zero speed (will accelerate)
                Utils.log('AI reaction complete! RACE TO CAN BEGINS!');
            }
        }

        updateRaceBehavior(aiComponent, transform, movement, deltaTime, gameState) {
            const canPosition = this.getCanPosition(gameState);

            // Calculate direction to can
            const dx = canPosition.x - transform.position.x;
            const dz = canPosition.z - transform.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            // Check race lock timer - once racing, commit for 2 seconds
            const now = Date.now();
            if (!aiComponent.raceLockUntil) {
                aiComponent.raceLockUntil = now + 2000;  // Lock in for 2 seconds
            }

            // If lock expired and far from can, return to patrol (2x scale)
            if (now > aiComponent.raceLockUntil && distance > 6.0) {
                aiComponent.state = AI_STATES.PATROL;
                aiComponent.raceLockUntil = null;
                return;
            }

            // ALWAYS run directly to can (ignore player position entirely)
            const direction = Math.atan2(dx, dz);

            // Accelerate toward max hunting speed (takes ~1 second to reach full speed)
            const dt = deltaTime / 1000;
            aiComponent.currentSpeed = Math.min(
                aiComponent.maxSpeedHunting,
                aiComponent.currentSpeed + aiComponent.acceleration * dt
            );

            // Set velocity with current speed (gradual acceleration)
            transform.velocity.x = Math.sin(direction) * aiComponent.currentSpeed;
            transform.velocity.z = Math.cos(direction) * aiComponent.currentSpeed;

            // Align heading with movement
            aiComponent.heading = direction;
            transform.rotation.y = direction;

            // Win condition (2x scale)
            if (distance < 1.6) {
                Utils.log('AI reached can first! AI WINS the race!');
                this.triggerAIWins(gameState);
            }
        }

        triggerAIWins(gameState) {
            Utils.log('AI Won! Player was too slow to reach the can.');

            if (global.GameEngine && global.GameEngine.gameOver) {
                global.GameEngine.gameOver('ai_won');
            } else {
                alert('AI WON! The hunter reached the can before you could kick it. Game Over.');
            }
        }

        updateVision(hunter, visionCone, gameState) {
            visionCone.canSeePlayer = false;
            visionCone.targetSeen = false;

            const aiTransform = hunter.getComponent('Transform');
            if (!aiTransform) {
                return;
            }

            const aiComponent = hunter.getComponent('AIHunter');
            if (!aiComponent) {
                return;
            }

            // DYNAMIC VISION: Calculate vision parameters based on what AI is looking at
            const baseVision = {
                range: visionCone.baseRange || visionCone.range,
                angle: visionCone.baseAngle || visionCone.angle
            };

            // Store base values if not already stored
            if (!visionCone.baseRange) {
                visionCone.baseRange = visionCone.range;
                visionCone.baseAngle = visionCone.angle;
            }

            // Get scan target from guard state
            const scanTarget = DynamicVision.getScanTargetInfo(aiComponent, aiTransform);

            // Calculate dynamic vision parameters
            let dynamicVision;
            try {
                dynamicVision = DynamicVision.computeDynamicVision(
                    aiComponent,
                    aiTransform,
                    scanTarget,
                    baseVision
                );

                // Apply dynamic vision to cone
                DynamicVision.applyDynamicVision(visionCone, dynamicVision);
            } catch (error) {
                // Fallback to base vision if dynamic vision fails
                console.warn('Dynamic vision calculation failed, using base vision:', error);
                visionCone.range = baseVision.range;
                visionCone.angle = baseVision.angle;
            }

            const localPlayer = gameState.getLocalPlayer();
            if (!localPlayer) {
                return;
            }

            const playerTransform = localPlayer.getComponent('Transform');
            if (!playerTransform) {
                return;
            }

            const dx = playerTransform.position.x - aiTransform.position.x;
            const dz = playerTransform.position.z - aiTransform.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            // DEBUG: Log vision parameters occasionally
            if (Math.random() < 0.01) {  // 1% chance per frame
                console.log('[VISION DEBUG]', {
                    range: visionCone.range,
                    angle: visionCone.angle,
                    baseRange: visionCone.baseRange,
                    baseAngle: visionCone.baseAngle,
                    distanceToPlayer: distance.toFixed(2),
                    isFocusing: visionCone.isFocusing,
                    aiHeading: aiComponent.heading ? (aiComponent.heading * 180 / Math.PI).toFixed(1) : 'undefined',
                    transformRotation: (aiTransform.rotation.y * 180 / Math.PI).toFixed(1),
                    scanTarget: aiComponent.guardState?.scanTarget ? (aiComponent.guardState.scanTarget * 180 / Math.PI).toFixed(1) : 'none'
                });
            }

            // Use DYNAMIC range (changes based on what AI is looking at)
            if (distance > visionCone.range) {
                return;
            }

            const angleToPlayer = Math.atan2(dx, dz);
            const aiDirection = aiTransform.rotation.y;

            let angleDiff = angleToPlayer - aiDirection;
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

            // Use DYNAMIC angle (narrower when focused on distant targets)
            const visionAngleRad = (visionCone.angle * Math.PI) / 180;
            const halfVisionAngle = visionAngleRad / 2;

            if (Math.abs(angleDiff) <= halfVisionAngle) {
                const hasLineOfSight = this.checkLineOfSight(aiTransform.position, playerTransform.position, gameState);

                if (hasLineOfSight) {
                    visionCone.canSeePlayer = true;
                    visionCone.targetSeen = true;
                    visionCone.lastSeenPosition = {
                        x: playerTransform.position.x,
                        y: playerTransform.position.y,
                        z: playerTransform.position.z
                    };
                    visionCone.lastSeenTime = Date.now();

                    const aiComponent = hunter.getComponent('AIHunter');
                    if (aiComponent && aiComponent.state === AI_STATES.PATROL && !aiComponent.reactionState) {
                        // Start reaction sequence
                        aiComponent.reactionState = 'SPOTTED';
                        aiComponent.reactionStartTime = Date.now();
                        Utils.log('AI spotted player! Reacting...');
                    }
                } else {
                    Utils.log('Player in vision cone but line of sight blocked by obstacle');
                }
            }
        }

        checkLineOfSight(aiPosition, playerPosition, gameState) {
            const obstacles = [];

            for (const entity of gameState.entities.values()) {
                const collider = entity.getComponent('Collider');
                const transform = entity.getComponent('Transform');

                if (collider && transform && collider.blockVision) {
                    obstacles.push({ collider, transform });
                }
            }

            const dx = playerPosition.x - aiPosition.x;
            const dz = playerPosition.z - aiPosition.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            const steps = Math.ceil(distance * 2);
            for (let i = 1; i < steps; i++) {
                const t = i / steps;
                const x = aiPosition.x + dx * t;
                const z = aiPosition.z + dz * t;
                const y = aiPosition.y;

                for (const obstacle of obstacles) {
                    const obstaclePos = obstacle.transform.position;
                    const collider = obstacle.collider;

                    if (collider.type === 'box') {
                        const halfWidth = collider.bounds.width / 2;
                        const halfDepth = collider.bounds.depth / 2;
                        const halfHeight = collider.bounds.height / 2;

                        if (
                            x >= obstaclePos.x - halfWidth &&
                            x <= obstaclePos.x + halfWidth &&
                            z >= obstaclePos.z - halfDepth &&
                            z <= obstaclePos.z + halfDepth &&
                            y >= obstaclePos.y - halfHeight &&
                            y <= obstaclePos.y + halfHeight
                        ) {
                            return false;
                        }
                    }
                }
            }

            return true;
        }

        checkPlayerCollision(hunter, gameState) {
            const aiTransform = hunter.getComponent('Transform');
            if (!aiTransform) {
                return;
            }

            const localPlayer = gameState.getLocalPlayer();
            if (!localPlayer) {
                return;
            }

            const playerTransform = localPlayer.getComponent('Transform');
            if (!playerTransform) {
                return;
            }

            const dx = playerTransform.position.x - aiTransform.position.x;
            const dz = playerTransform.position.z - aiTransform.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            const tagDistance = 1.2;
            if (distance <= tagDistance) {
                this.triggerPlayerTagged(gameState);
            }
        }

        triggerPlayerTagged(gameState) {
            Utils.log('Player tagged. Game over.');

            if (global.GameEngine && global.GameEngine.gameOver) {
                global.GameEngine.gameOver('tagged');
            } else {
                alert('TAGGED! The AI Hunter caught you. Game Over.');

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

        testLineOfSight(gameState) {
            const hunters = Array.from(this.hunters);
            if (hunters.length === 0) {
                Utils.log('No AI hunters to test');
                return;
            }

            const hunter = hunters[0];
            const aiTransform = hunter.getComponent('Transform');
            const visionCone = hunter.getComponent('VisionCone');

            if (!aiTransform || !visionCone) {
                Utils.log('AI hunter missing required components for testing');
                return;
            }

            const localPlayer = gameState.getLocalPlayer();
            if (!localPlayer) {
                Utils.log('No local player found for testing');
                return;
            }

            const playerTransform = localPlayer.getComponent('Transform');
            if (!playerTransform) {
                Utils.log('Player missing transform component');
                return;
            }

            const hasLineOfSight = this.checkLineOfSight(aiTransform.position, playerTransform.position, gameState);
            const distance = Math.sqrt(
                Math.pow(playerTransform.position.x - aiTransform.position.x, 2) +
                Math.pow(playerTransform.position.z - aiTransform.position.z, 2)
            );

            Utils.log('AI Line-of-Sight Test:');
            Utils.log(`  AI Position: (${aiTransform.position.x.toFixed(2)}, ${aiTransform.position.z.toFixed(2)})`);
            Utils.log(`  Player Position: (${playerTransform.position.x.toFixed(2)}, ${playerTransform.position.z.toFixed(2)})`);
            Utils.log(`  Distance: ${distance.toFixed(2)}`);
            Utils.log(`  Line of Sight: ${hasLineOfSight ? 'CLEAR' : 'BLOCKED'}`);
            Utils.log(`  Vision Range: ${visionCone.range}`);
            Utils.log(`  Can See Player: ${visionCone.canSeePlayer ? 'YES' : 'NO'}`);

            return {
                distance,
                hasLineOfSight,
                canSeePlayer: visionCone.canSeePlayer,
                aiPosition: aiTransform.position,
                playerPosition: playerTransform.position
            };
        }

        destroy() {
            this.hunters.clear();
            Utils.log('AI system destroyed');
        }

        getVisionConeFromAI(aiComponent) {
            for (const hunter of this.hunters) {
                const component = hunter.getComponent('AIHunter');
                if (component === aiComponent) {
                    return hunter.getComponent('VisionCone');
                }
            }
            return null;
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { AI_STATES, AISystem };
    } else {
        global.GameAI = global.GameAI || {};
        global.GameAI.AI_STATES = AI_STATES;
        global.GameAI.AISystem = AISystem;
        global.AI_STATES = AI_STATES;
        global.AISystem = AISystem;
    }
})(typeof window !== 'undefined' ? window : globalThis);
