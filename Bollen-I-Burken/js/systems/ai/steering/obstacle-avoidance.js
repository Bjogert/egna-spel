/* ==========================================
   OBSTACLE AVOIDANCE
   Basic wall detection and steering away from obstacles
   ========================================== */

(function (global) {
    /**
     * Simple raycast forward to detect nearby obstacles
     * Returns steering to avoid collision
     *
     * @param {Object} transform - AI transform component
     * @param {Object} ai - AI component with heading
     * @param {Array} staticColliders - Array of {collider, transform} obstacles
     * @param {number} lookAheadDistance - How far to check (default 1.5m)
     * @returns {Object} Avoidance steering { linear: {x, z}, angular: number }
     */
    function computeObstacleAvoidance(transform, ai, staticColliders, lookAheadDistance = 2.5) {
        const avoidanceSteering = {
            linear: { x: 0, z: 0 },
            angular: 0
        };

        if (!staticColliders || staticColliders.length === 0) {
            return avoidanceSteering;
        }

        // Raycast forward in heading direction
        const rayOrigin = { x: transform.position.x, z: transform.position.z };
        const rayDir = { x: Math.sin(ai.heading), z: Math.cos(ai.heading) };

        let closestDistance = Infinity;
        let closestObstacle = null;

        // Check each obstacle - MUCH simpler detection
        for (const { collider, transform: obstacleTransform } of staticColliders) {
            if (collider.type !== 'box') continue;

            // Vector to obstacle
            const dx = obstacleTransform.position.x - rayOrigin.x;
            const dz = obstacleTransform.position.z - rayOrigin.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            // Only check nearby obstacles
            if (distance > lookAheadDistance + 1.0) continue;

            // Check if obstacle is in front (dot product with heading)
            const dotProduct = (dx * rayDir.x + dz * rayDir.z) / distance;  // Normalized

            // If obstacle is ahead (dot > 0.3 = ~70° cone in front)
            if (dotProduct > 0.3 && distance < closestDistance) {
                closestDistance = distance;

                // Determine which way to turn (left or right)
                // Cross product tells us if obstacle is on left (negative) or right (positive)
                const crossProduct = rayDir.x * dz - rayDir.z * dx;
                const turnDirection = Math.sign(crossProduct);

                closestObstacle = {
                    distance,
                    turnDirection,
                    dx,
                    dz
                };
            }
        }

        // If obstacle detected, STRONGLY steer away
        if (closestObstacle && closestObstacle.distance < lookAheadDistance) {
            const urgency = 1.0 - (closestObstacle.distance / lookAheadDistance);  // 0-1
            const panicLevel = urgency * urgency;  // Square for more aggressive close-range steering

            // HARD turn away from obstacle
            avoidanceSteering.angular = closestObstacle.turnDirection * ai.maxAngularAccel * 8.0 * panicLevel;

            // Push sideways HARD (perpendicular to heading)
            const perpAngle = ai.heading + (closestObstacle.turnDirection * Math.PI / 2);
            avoidanceSteering.linear.x = Math.sin(perpAngle) * ai.maxAccel * 5.0 * panicLevel;
            avoidanceSteering.linear.z = Math.cos(perpAngle) * ai.maxAccel * 5.0 * panicLevel;

            // Debug log when avoiding
            if (panicLevel > 0.5) {
                console.log(`[AVOID] Distance: ${closestObstacle.distance.toFixed(2)}m, Turn: ${closestObstacle.turnDirection > 0 ? 'RIGHT' : 'LEFT'}, Urgency: ${urgency.toFixed(2)}`);
            }
        }

        return avoidanceSteering;
    }

    /**
     * Check if AI is stuck against a wall (barely moving despite trying)
     * Returns true if stuck, triggers emergency unstuck behavior
     */
    function isStuckOnWall(ai, transform, deltaTime) {
        // Initialize tracking
        if (!ai.stuckTimer) ai.stuckTimer = 0;
        if (!ai.lastPosition) {
            ai.lastPosition = { x: transform.position.x, z: transform.position.z };
            return false;  // Need at least one frame to compare
        }

        // Check ACTUAL position change (more reliable than velocity, which gets zeroed by collisions)
        const dx = transform.position.x - ai.lastPosition.x;
        const dz = transform.position.z - ai.lastPosition.z;
        const actualMovement = Math.sqrt(dx * dx + dz * dz);

        // Update last position for next frame
        ai.lastPosition.x = transform.position.x;
        ai.lastPosition.z = transform.position.z;

        // Check if stuck: trying to move (maxSpeed > 0.05) but barely moving (<0.005 per frame at 60fps)
        const frameMovementThreshold = 0.005;

        if (ai.maxSpeed > 0.05 && actualMovement < frameMovementThreshold) {
            ai.stuckTimer += deltaTime;

            // Stuck for more than 150ms? Emergency unstick (fast trigger)
            if (ai.stuckTimer > 150) {
                console.log(`[UNSTUCK] Stuck ${ai.stuckTimer.toFixed(0)}ms, movement: ${actualMovement.toFixed(4)}`);
                return true;
            }
        } else {
            ai.stuckTimer = 0;
        }

        return false;
    }

    /**
     * Emergency unstuck behavior - rotate away from wall and move
     */
    function unstuck(ai) {
        console.log('[UNSTUCK] Executing emergency escape');

        // Turn 120-180° (bigger turn to really get away from wall)
        const turnAmount = (Math.PI * 0.6) + (Math.random() * Math.PI * 0.4);  // 120°-180°
        const turnDirection = Math.random() < 0.5 ? 1 : -1;
        ai.heading += turnAmount * turnDirection;

        // Normalize angle
        while (ai.heading > Math.PI) ai.heading -= 2 * Math.PI;
        while (ai.heading < -Math.PI) ai.heading += 2 * Math.PI;

        // Reset stuck timer and position tracker
        ai.stuckTimer = 0;
        if (ai.lastPosition) {
            ai.lastPosition.x = 0;
            ai.lastPosition.z = 0;
        }

        // STRONG forward impulse in new direction
        ai.velocity.x = Math.sin(ai.heading) * ai.maxSpeed * 0.8;
        ai.velocity.z = Math.cos(ai.heading) * ai.maxSpeed * 0.8;
    }

    // Export to global scope
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            computeObstacleAvoidance,
            isStuckOnWall,
            unstuck
        };
    } else {
        global.ObstacleAvoidance = {
            computeObstacleAvoidance,
            isStuckOnWall,
            unstuck
        };
    }
})(typeof window !== 'undefined' ? window : globalThis);
