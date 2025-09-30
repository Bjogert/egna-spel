/* ==========================================
   AI SYSTEM
   Manages hunter behaviour and vision checks
   ========================================== */

(function (global) {
    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const AI_STATES = {
        PATROL: 'PATROL',
        HUNTING: 'HUNTING',
        SEARCHING: 'SEARCHING'
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
                    this.updatePatrolBehavior(aiComponent, transform, movement, deltaTime);
                    break;
                case AI_STATES.HUNTING:
                    this.updateHuntingBehavior(aiComponent, transform, movement, deltaTime);
                    break;
                case AI_STATES.SEARCHING:
                    this.updateSearchingBehavior(aiComponent, transform, movement, deltaTime);
                    break;
            }

            if (visionCone) {
                this.updateVision(hunter, visionCone, gameState);
            }

            this.checkPlayerCollision(hunter, gameState);
        }

        updatePatrolBehavior(aiComponent, transform, movement, deltaTime) {
            const patrolSpeed = movement.speed || aiComponent.speed;

            if (!aiComponent.target || aiComponent.patrolTimer <= 0) {
                aiComponent.patrolTimer = randomInRange(1500, 3500);
                aiComponent.patrolDirection = Math.random() * Math.PI * 2;
                aiComponent.targetDirection = aiComponent.patrolDirection;
            }

            aiComponent.patrolTimer -= deltaTime;

            const turnSpeed = 2.0;
            let angleDiff = aiComponent.targetDirection - aiComponent.patrolDirection;
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

            const turnStep = turnSpeed * (deltaTime / 1000);
            if (Math.abs(angleDiff) > turnStep) {
                aiComponent.patrolDirection += Math.sign(angleDiff) * turnStep;
            } else {
                aiComponent.patrolDirection = aiComponent.targetDirection;
            }

            transform.velocity.x = Math.sin(aiComponent.patrolDirection) * patrolSpeed;
            transform.velocity.z = Math.cos(aiComponent.patrolDirection) * patrolSpeed;
        }

        updateHuntingBehavior(aiComponent, transform, movement, deltaTime) {
            const visionCone = this.getVisionConeFromAI(aiComponent);

            if (visionCone && visionCone.lastSeenPosition) {
                const dx = visionCone.lastSeenPosition.x - transform.position.x;
                const dz = visionCone.lastSeenPosition.z - transform.position.z;
                const distance = Math.sqrt(dx * dx + dz * dz);

                if (distance > 0.5) {
                    const huntingDirection = Math.atan2(dz, dx);

                    let angleDiff = huntingDirection - aiComponent.patrolDirection;
                    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

                    const maxTurnSpeed = 3.0;
                    const turnStep = maxTurnSpeed * (deltaTime / 1000);

                    if (Math.abs(angleDiff) > turnStep) {
                        aiComponent.patrolDirection += Math.sign(angleDiff) * turnStep;
                    } else {
                        aiComponent.patrolDirection = huntingDirection;
                    }

                    const huntingSpeed = aiComponent.huntingSpeed;
                    transform.velocity.x = Math.cos(aiComponent.patrolDirection) * huntingSpeed;
                    transform.velocity.z = Math.sin(aiComponent.patrolDirection) * huntingSpeed;
                }
            } else {
                this.updatePatrolBehavior(aiComponent, transform, movement, deltaTime);
            }
        }

        updateSearchingBehavior(aiComponent, transform, movement, deltaTime) {
            this.updatePatrolBehavior(aiComponent, transform, movement, deltaTime);
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
                        aiComponent.state = AI_STATES.HUNTING;
                        aiComponent.huntingStartTime = Date.now();
                        Utils.log('AI spotted player, switching to HUNTING mode');
                    }

                    Utils.log(`AI can see player. Distance: ${distance.toFixed(2)}, Angle: ${(angleDiff * 180 / Math.PI).toFixed(1)} deg`);
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
