/* ==========================================
   INVESTIGATE BEHAVIOR
   AI navigates to last heard player position
   Uses steering behaviors + obstacle avoidance
   ========================================== */

(function (global) {
    /**
     * Updates AI in INVESTIGATE state
     * Navigates to last heard position using arrive steering + obstacle avoidance
     * Gives up after 3 stuck attempts and returns to patrol
     *
     * @param {Object} aiComponent - AIHunter component
     * @param {Object} transform - Transform component
     * @param {Object} movement - Movement component
     * @param {number} deltaTime - Time delta in milliseconds
     * @param {Object} gameState - Game state
     * @param {Function} getStaticColliders - Function to get obstacle colliders
     * @returns {string|null} - New state if changed, null otherwise
     */
    function updateInvestigateBehavior(aiComponent, transform, movement, deltaTime, gameState, getStaticColliders) {
        const dt = deltaTime / 1000;  // Convert to seconds
        const now = Date.now();
        const investigateElapsed = now - aiComponent.investigateStartTime;

        if (!aiComponent.lastHeardPosition) {
            // No position to investigate, return to patrol
            return 'PATROL';
        }

        // Calculate distance to investigation point
        const dx = aiComponent.lastHeardPosition.x - transform.position.x;
        const dz = aiComponent.lastHeardPosition.z - transform.position.z;
        const distanceToTarget = Math.sqrt(dx * dx + dz * dz);

        // Phase 1: Move to heard position using steering behaviors
        if (distanceToTarget > 1.5) {
            // Check if stuck and handle it
            if (ObstacleAvoidance.isStuckOnWall(aiComponent, transform, deltaTime)) {
                aiComponent.investigateStuckCount = (aiComponent.investigateStuckCount || 0) + 1;

                if (aiComponent.investigateStuckCount > 3) {
                    // Tried 3 times, can't reach it - give up
                    Utils.log('🔍 Can\'t reach heard position after 3 attempts, giving up investigation');
                    aiComponent.lastHeardPosition = null;
                    aiComponent.investigateLookAroundTime = 0;
                    aiComponent.investigateStuckCount = 0;
                    return 'PATROL';
                }

                ObstacleAvoidance.unstuck(aiComponent);
                Utils.log(`🔍 Investigation unstuck (attempt ${aiComponent.investigateStuckCount}/3)`);
            }

            // Get obstacle avoidance steering
            const staticColliders = getStaticColliders(gameState);
            const avoidance = ObstacleAvoidance.computeObstacleAvoidance(
                transform,
                aiComponent,
                staticColliders,
                3.0  // Look ahead 3.0 meters
            );

            // Use arrive behavior to smoothly approach target
            const arriveSteering = SteeringBehaviors.arrive(
                aiComponent,
                aiComponent.lastHeardPosition,
                { x: transform.position.x, z: transform.position.z },
                2.5  // Start slowing down 2.5m away
            );

            // Combine arrive + avoidance (avoidance 3x more important)
            const combinedSteering = SteeringBehaviors.combineSteeringBehaviors([
                { steering: arriveSteering, weight: 1.0 },
                { steering: avoidance, weight: 3.0 }
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

            // Apply friction
            const friction = 0.92;
            aiComponent.velocity.x *= friction;
            aiComponent.velocity.z *= friction;

            // Update transform
            transform.velocity.x = aiComponent.velocity.x;
            transform.velocity.z = aiComponent.velocity.z;
            transform.rotation.y = aiComponent.heading;
        }
        // Phase 2: Arrived at heard position - look around
        else {
            // Reset stuck counter when we arrive
            aiComponent.investigateStuckCount = 0;

            // Stop moving
            aiComponent.velocity.x = 0;
            aiComponent.velocity.z = 0;
            transform.velocity.x = 0;
            transform.velocity.z = 0;

            // Slowly rotate to look around
            aiComponent.investigateLookAroundTime += deltaTime;
            const rotationSpeed = 1.0; // radians per second
            aiComponent.heading += rotationSpeed * dt;
            transform.rotation.y = aiComponent.heading;
        }

        // Timeout: Return to patrol after investigation time
        if (investigateElapsed > aiComponent.investigateDuration) {
            Utils.log('🔍 Investigation complete. Returning to patrol.');
            aiComponent.lastHeardPosition = null;
            aiComponent.investigateLookAroundTime = 0;
            aiComponent.investigateStuckCount = 0;
            return 'PATROL';
        }

        return null;  // No state change
    }

    // Export to global scope
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { updateInvestigateBehavior };
    } else {
        global.InvestigateBehavior = { updateInvestigateBehavior };
    }
})(typeof window !== 'undefined' ? window : globalThis);
