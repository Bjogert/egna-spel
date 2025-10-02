/* ==========================================
   CAN GUARD STRATEGY
   AI hunter stays near can, scans arena systematically
   ========================================== */

(function (global) {
    /**
     * Can-guarding patrol strategy - OBSTACLE AWARE
     *
     * The hunter wants to:
     * 1. Stay close to the can (defend it)
     * 2. Check behind OBSTACLES where players hide (not random air!)
     * 3. Systematically investigate each hiding spot
     * 4. Vary tempo to create tension (pause, quick turn, slow creep)
     *
     * @param {Object} ai - AIHunter component
     * @param {Object} transform - AI transform
     * @param {Object} canPosition - Can position {x, y, z} (usually {x: 0, y: 0.3, z: 0})
     * @param {number} deltaTime - Time in seconds
     * @param {Array} obstacles - Array of obstacle transforms [{position: {x,z}}]
     * @returns {Object} Steering { linear: {x, z}, angular: number }
     */
    function computeCanGuardPatrol(ai, transform, canPosition, deltaTime, obstacles = []) {
        // Initialize patrol state
        if (!ai.guardState) {
            ai.guardState = {
                orbitRadius: 3.0,           // Distance from can to patrol (3 meters)
                orbitAngle: Math.random() * Math.PI * 2,  // Current angle around can
                orbitDirection: Math.random() < 0.5 ? 1 : -1,  // Clockwise or counter-clockwise
                scanTarget: 0,              // Current scan target angle
                scanDuration: 0,            // Time spent scanning current direction
                nextScanChange: 2000,       // When to change scan direction (ms)
                mode: 'ORBIT',              // ORBIT | REPOSITION | PAUSE | INVESTIGATE
                moveSpeedMultiplier: 1.0,   // Varies movement speed (0.3 - 2.0)
                turnSpeedMultiplier: 1.0,   // Varies turn speed (0.5 - 3.0)
                nextBehaviorChange: 3000,   // When to change tempo (ms)
                behaviorTimer: 0,
                currentObstacleIndex: 0,    // Which obstacle to check next
                checkedObstacles: []        // Track which obstacles checked this patrol cycle
            };
        }

        // If we have obstacles, focus on them instead of random scanning
        const hasObstacles = obstacles && obstacles.length > 0;

        const state = ai.guardState;

        // Calculate position relative to can
        const dx = transform.position.x - canPosition.x;
        const dz = transform.position.z - canPosition.z;
        const distanceFromCan = Math.sqrt(dx * dx + dz * dz);
        const angleFromCan = Math.atan2(dx, dz);

        // Calculate target position on orbit circle
        const targetX = canPosition.x + Math.sin(state.orbitAngle) * state.orbitRadius;
        const targetZ = canPosition.z + Math.cos(state.orbitAngle) * state.orbitRadius;
        const toTargetX = targetX - transform.position.x;
        const toTargetZ = targetZ - transform.position.z;
        const distanceToTarget = Math.sqrt(toTargetX * toTargetX + toTargetZ * toTargetZ);

        // DYNAMIC BEHAVIOR: Change tempo/mode randomly (but only when settled)
        state.behaviorTimer += deltaTime * 1000;
        const isSettled = distanceToTarget < 0.8;  // Close to current target position

        if (state.behaviorTimer > state.nextBehaviorChange && isSettled) {
            state.behaviorTimer = 0;
            state.nextBehaviorChange = 2000 + Math.random() * 4000;  // 2-6 seconds

            // Random behavior changes (SCARY variations):
            const roll = Math.random();

            if (roll < 0.20) {
                // 20%: PAUSE - Stop and look around (SCARY!)
                state.mode = 'PAUSE';
                state.moveSpeedMultiplier = 0.0;  // Stop moving
                state.turnSpeedMultiplier = 3.0;  // But look around quickly
                state.nextBehaviorChange = 1000 + Math.random() * 2000;  // Pause for 1-3 seconds
                console.log('[GUARD] 🔍 PAUSE - Looking around...');
            } else if (roll < 0.35) {
                // 15%: QUICK REPOSITION - Sudden move to opposite side
                state.mode = 'REPOSITION';
                state.targetOrbitAngle = state.orbitAngle + Math.PI + (Math.random() - 0.5) * Math.PI / 3;
                state.moveSpeedMultiplier = 2.0;  // Fast movement
                state.turnSpeedMultiplier = 3.0;  // Quick turns
                console.log('[GUARD] ⚡ Quick reposition!');
            } else if (roll < 0.55) {
                // 20%: SLOW CREEP - Methodical, tense movement
                state.mode = 'ORBIT';
                state.moveSpeedMultiplier = 0.3;  // Very slow
                state.turnSpeedMultiplier = 2.5;  // But scanning frequently
                console.log('[GUARD] 🐌 Slow creep...');
            } else if (roll < 0.70) {
                // 15%: FAST PATROL - Quick sweep
                state.mode = 'ORBIT';
                state.moveSpeedMultiplier = 1.6;  // Fast
                state.turnSpeedMultiplier = 1.5;
                state.orbitDirection *= -1;  // Reverse direction unexpectedly
                console.log('[GUARD] 🏃 Fast sweep (reversed)');
            } else {
                // 30%: NORMAL ORBIT
                state.mode = 'ORBIT';
                state.moveSpeedMultiplier = 1.0;
                state.turnSpeedMultiplier = 1.0;
                console.log('[GUARD] 👁️ Normal patrol');
            }
        }

        // Decide behavior based on distance from can
        let steering = { linear: { x: 0, z: 0 }, angular: 0 };

        // If too far from can (>5m), return urgently
        if (distanceFromCan > 5.0) {
            steering = returnToCan(ai, transform, canPosition, state.orbitRadius);
        }
        // If too close to can (<1.8m), move away
        else if (distanceFromCan < 1.8) {
            steering = moveAwayFromCan(ai, transform, canPosition);
        }
        // At good distance - orbit/reposition with varied tempo
        else {
            // SMOOTH REPOSITION: If we have a target angle, smoothly transition to it
            if (state.targetOrbitAngle !== undefined) {
                let angleDiff = state.targetOrbitAngle - state.orbitAngle;
                // Normalize difference
                while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

                // Smoothly move toward target angle (fast movement during reposition)
                const repositionSpeed = 2.0;  // rad/sec
                const angleStep = repositionSpeed * deltaTime;

                if (Math.abs(angleDiff) < angleStep) {
                    // Reached target angle
                    state.orbitAngle = state.targetOrbitAngle;
                    state.targetOrbitAngle = undefined;  // Clear target
                } else {
                    // Move toward target angle
                    state.orbitAngle += Math.sign(angleDiff) * angleStep;
                }
            } else {
                // Normal orbit: gradually move around can
                const baseOrbitSpeed = 0.3;  // rad/sec
                const orbitSpeed = baseOrbitSpeed * state.moveSpeedMultiplier;
                state.orbitAngle += state.orbitDirection * orbitSpeed * deltaTime;
            }

            // Normalize angle
            while (state.orbitAngle > Math.PI) state.orbitAngle -= 2 * Math.PI;
            while (state.orbitAngle < -Math.PI) state.orbitAngle += 2 * Math.PI;

            // Calculate target position on orbit circle (already calculated above for isSettled check)
            // Recalculate with updated orbit angle
            const finalTargetX = canPosition.x + Math.sin(state.orbitAngle) * state.orbitRadius;
            const finalTargetZ = canPosition.z + Math.cos(state.orbitAngle) * state.orbitRadius;

            // Move toward orbit position (speed varies)
            const finalToTargetX = finalTargetX - transform.position.x;
            const finalToTargetZ = finalTargetZ - transform.position.z;
            const finalToTargetDist = Math.sqrt(finalToTargetX * finalToTargetX + finalToTargetZ * finalToTargetZ);

            if (finalToTargetDist > 0.4) {  // Slightly larger threshold to prevent micro-movements
                // Move toward orbit position
                const moveDir = Math.atan2(finalToTargetX, finalToTargetZ);
                steering.linear.x = Math.sin(moveDir) * ai.maxAccel * state.moveSpeedMultiplier;
                steering.linear.z = Math.cos(moveDir) * ai.maxAccel * state.moveSpeedMultiplier;
            } else {
                // Very close to target - slow down to prevent overshoot
                steering.linear.x *= 0.5;
                steering.linear.z *= 0.5;
            }

            // INTELLIGENT SCANNING: Focus on obstacles (hiding spots)
            state.scanDuration += deltaTime * 1000;

            // Change scan direction periodically (faster when cautious)
            const baseScanInterval = 1500;
            const scanInterval = baseScanInterval / state.turnSpeedMultiplier;

            if (state.scanDuration > scanInterval) {
                if (hasObstacles) {
                    // Cycle through obstacles systematically
                    state.currentObstacleIndex = (state.currentObstacleIndex + 1) % obstacles.length;
                    const targetObstacle = obstacles[state.currentObstacleIndex];

                    // Calculate angle to obstacle from AI position
                    const toObstacleX = targetObstacle.position.x - transform.position.x;
                    const toObstacleZ = targetObstacle.position.z - transform.position.z;
                    state.scanTarget = Math.atan2(toObstacleX, toObstacleZ);

                    console.log(`[GUARD] Checking obstacle ${state.currentObstacleIndex + 1}/${obstacles.length}`);
                } else {
                    // No obstacles - scan opposite side (fallback)
                    const oppositeAngle = angleFromCan + Math.PI;
                    const scanRange = Math.PI / 2;
                    state.scanTarget = oppositeAngle + (Math.random() - 0.5) * scanRange;
                }

                state.scanDuration = 0;
            }

            // Turn toward scan target (turn speed varies)
            const desiredHeading = state.scanTarget;
            steering.angular = computeAngularSteering(ai.heading, desiredHeading, ai.maxAngularAccel * state.turnSpeedMultiplier);
        }

        return steering;
    }

    /**
     * Return to can when too far away
     */
    function returnToCan(ai, transform, canPosition, targetRadius) {
        // Calculate direction to can
        const dx = canPosition.x - transform.position.x;
        const dz = canPosition.z - transform.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        // Approach position at target radius
        const approachDist = Math.max(0, distance - targetRadius);
        const urgency = Math.min(approachDist / 3.0, 1.0);  // More urgent when further

        const approachAngle = Math.atan2(dx, dz);

        return {
            linear: {
                x: Math.sin(approachAngle) * ai.maxAccel * 1.5 * urgency,
                z: Math.cos(approachAngle) * ai.maxAccel * 1.5 * urgency
            },
            angular: computeAngularSteering(ai.heading, approachAngle, ai.maxAngularAccel * 2.0)
        };
    }

    /**
     * Move away from can when too close
     */
    function moveAwayFromCan(ai, transform, canPosition) {
        // Calculate direction AWAY from can
        const dx = transform.position.x - canPosition.x;
        const dz = transform.position.z - canPosition.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < 0.1) {
            // Right on top of can, pick random escape direction
            const escapeAngle = Math.random() * Math.PI * 2;
            return {
                linear: {
                    x: Math.sin(escapeAngle) * ai.maxAccel,
                    z: Math.cos(escapeAngle) * ai.maxAccel
                },
                angular: computeAngularSteering(ai.heading, escapeAngle, ai.maxAngularAccel)
            };
        }

        // Move directly away from can, facing outward
        const awayAngle = Math.atan2(dx, dz);

        return {
            linear: {
                x: Math.sin(awayAngle) * ai.maxAccel,
                z: Math.cos(awayAngle) * ai.maxAccel
            },
            angular: computeAngularSteering(ai.heading, awayAngle, ai.maxAngularAccel)
        };
    }

    /**
     * Compute angular steering (copied from steering-behaviors.js)
     */
    function computeAngularSteering(currentHeading, targetHeading, maxAngularAccel) {
        let angleDiff = targetHeading - currentHeading;

        // Normalize to -PI to PI
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        return Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), maxAngularAccel);
    }

    // Export to global scope
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            computeCanGuardPatrol
        };
    } else {
        global.CanGuardStrategy = {
            computeCanGuardPatrol
        };
    }
})(typeof window !== 'undefined' ? window : globalThis);
