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
            if (!gameState || gameState.gamePhase !== GAME_STATES.PLAYING) {
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

            this.checkPlayerCollision(hunter, gameState);
        }

        updatePatrolBehavior(aiComponent, transform, movement, deltaTime, gameState) {
            const dt = deltaTime / 1000;  // Convert to seconds

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

            // If lock expired and far from can, return to patrol
            if (now > aiComponent.raceLockUntil && distance > 3.0) {
                aiComponent.state = AI_STATES.PATROL;
                aiComponent.raceLockUntil = null;
                return;
            }

            // ALWAYS run directly to can (ignore player position entirely)
            const direction = Math.atan2(dx, dz);

            // Set velocity directly (no steering, no acceleration - just GO!)
            transform.velocity.x = Math.sin(direction) * aiComponent.maxSpeedHunting;
            transform.velocity.z = Math.cos(direction) * aiComponent.maxSpeedHunting;

            // Align heading with movement
            aiComponent.heading = direction;
            transform.rotation.y = direction;

            // Win condition
            if (distance < 0.8) {
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

            if (distance > visionCone.range) {
                return;
            }

            const angleToPlayer = Math.atan2(dx, dz);
            const aiDirection = aiTransform.rotation.y;

            let angleDiff = angleToPlayer - aiDirection;
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

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
                    if (aiComponent && aiComponent.state === AI_STATES.PATROL) {
                        aiComponent.state = AI_STATES.RACE;
                        aiComponent.raceLockUntil = Date.now() + 2000;  // Lock in race for 2 seconds
                        Utils.log('AI spotted player! RACE TO CAN BEGINS!');
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
