/* ==========================================
   STEERING BEHAVIORS
   Core AI movement behaviors for smooth navigation
   ========================================== */

(function (global) {
    /**
     * Normalizes an angle to the range [-PI, PI]
     */
    function normalizeAngle(angle) {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    }

    /**
     * Computes angular steering to smoothly turn toward a target heading
     * @param {number} currentHeading - Current heading in radians
     * @param {number} targetHeading - Desired heading in radians
     * @param {number} maxAngularAccel - Maximum angular acceleration (rad/sec)
     * @returns {number} Angular steering value
     */
    function computeAngularSteering(currentHeading, targetHeading, maxAngularAccel) {
        let angleDiff = targetHeading - currentHeading;
        angleDiff = normalizeAngle(angleDiff);

        return Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), maxAngularAccel);
    }

    /**
     * WANDER - Random wandering behavior for patrol
     * Creates smooth, organic-looking movement with random direction changes
     *
     * @param {Object} ai - AI component with heading, wanderAngle, maxAccel
     * @param {number} deltaTime - Time delta in seconds
     * @returns {Object} Steering output { linear: {x, z}, angular: number }
     */
    function wander(ai, deltaTime, currentTime = Date.now()) {
        // Initialize wander angle if not set
        if (ai.wanderAngle === undefined) {
            ai.wanderAngle = 0;
        }
        if (ai.nextTurnTime === undefined || currentTime >= ai.nextTurnTime) {
            // Vary turn speed: sometimes slow, sometimes fast (more interesting patrol)
            ai.currentTurnSpeed = 0.5 + Math.random() * 1.5;  // 0.5x to 2.0x turn speed
            ai.nextTurnTime = currentTime + (800 + Math.random() * 1500);  // Change every 0.8-2.3 seconds
        }

        // Random jitter to wander angle (creates organic direction changes)
        const wanderStrength = 1.5;  // Increased from 0.8 for more dynamic movement
        const randomJitter = (Math.random() - 0.5) * wanderStrength * deltaTime;
        ai.wanderAngle += randomJitter;

        // Clamp wander angle to prevent extreme turns
        ai.wanderAngle = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, ai.wanderAngle));  // Wider range

        // Target heading is current heading + wander offset
        const targetHeading = ai.heading + ai.wanderAngle;

        // Compute angular steering toward target (with variable turn speed)
        const effectiveAngularAccel = ai.maxAngularAccel * ai.currentTurnSpeed;
        const angular = computeAngularSteering(ai.heading, targetHeading, effectiveAngularAccel);

        // Linear acceleration in current heading direction
        const linear = {
            x: Math.sin(ai.heading) * ai.maxAccel,
            z: Math.cos(ai.heading) * ai.maxAccel
        };

        return { linear, angular };
    }

    /**
     * SEEK - Move directly toward a target position
     * Used for hunting/chasing player
     *
     * @param {Object} ai - AI component with heading, maxAccel, maxAngularAccel
     * @param {Object} targetPos - Target position {x, z}
     * @param {Object} currentPos - Current position {x, z}
     * @returns {Object} Steering output { linear: {x, z}, angular: number }
     */
    function seek(ai, targetPos, currentPos) {
        // Calculate direction to target
        const dx = targetPos.x - currentPos.x;
        const dz = targetPos.z - currentPos.z;
        const desiredHeading = Math.atan2(dx, dz);

        // Turn toward target VERY FAST when hunting (3.5x faster)
        const angular = computeAngularSteering(ai.heading, desiredHeading, ai.maxAngularAccel * 3.5);

        // Accelerate forward AGGRESSIVELY (3.0x stronger)
        const linear = {
            x: Math.sin(ai.heading) * ai.maxAccel * 3.0,
            z: Math.cos(ai.heading) * ai.maxAccel * 3.0
        };

        return { linear, angular };
    }

    /**
     * ARRIVE - Move toward target and slow down when close
     * Used for moving to waypoints without overshooting
     *
     * @param {Object} ai - AI component with heading, maxAccel, maxAngularAccel
     * @param {Object} targetPos - Target position {x, z}
     * @param {Object} currentPos - Current position {x, z}
     * @param {number} slowRadius - Distance at which to start slowing (default 2.0)
     * @returns {Object} Steering output { linear: {x, z}, angular: number }
     */
    function arrive(ai, targetPos, currentPos, slowRadius = 2.0) {
        // Calculate direction and distance to target
        const dx = targetPos.x - currentPos.x;
        const dz = targetPos.z - currentPos.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        // Turn toward target
        const desiredHeading = Math.atan2(dx, dz);
        const angular = computeAngularSteering(ai.heading, desiredHeading, ai.maxAngularAccel);

        // Slow down within slow radius (0 at target, 1 at slowRadius or beyond)
        const speedFactor = Math.min(distance / slowRadius, 1.0);

        // Linear acceleration scaled by distance
        const linear = {
            x: Math.sin(ai.heading) * ai.maxAccel * speedFactor,
            z: Math.cos(ai.heading) * ai.maxAccel * speedFactor
        };

        return { linear, angular };
    }

    /**
     * FLEE - Move away from a target position
     * Opposite of seek - used for evasion
     *
     * @param {Object} ai - AI component with heading, maxAccel, maxAngularAccel
     * @param {Object} threatPos - Position to flee from {x, z}
     * @param {Object} currentPos - Current position {x, z}
     * @returns {Object} Steering output { linear: {x, z}, angular: number }
     */
    function flee(ai, threatPos, currentPos) {
        // Calculate direction AWAY from threat
        const dx = currentPos.x - threatPos.x;  // Reversed from seek
        const dz = currentPos.z - threatPos.z;
        const desiredHeading = Math.atan2(dx, dz);

        // Turn away from threat
        const angular = computeAngularSteering(ai.heading, desiredHeading, ai.maxAngularAccel * 2.0);

        // Accelerate forward (away from threat)
        const linear = {
            x: Math.sin(ai.heading) * ai.maxAccel * 2.0,
            z: Math.cos(ai.heading) * ai.maxAccel * 2.0
        };

        return { linear, angular };
    }

    /**
     * Combines multiple steering behaviors by summing their outputs
     * Useful for blending behaviors (e.g., seek + avoid obstacles)
     *
     * @param {Array} behaviors - Array of {steering, weight} objects
     * @returns {Object} Combined steering output
     */
    function combineSteeringBehaviors(behaviors) {
        const combined = {
            linear: { x: 0, z: 0 },
            angular: 0
        };

        for (const { steering, weight } of behaviors) {
            combined.linear.x += steering.linear.x * weight;
            combined.linear.z += steering.linear.z * weight;
            combined.angular += steering.angular * weight;
        }

        return combined;
    }

    // Export to global scope
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            wander,
            seek,
            arrive,
            flee,
            combineSteeringBehaviors,
            normalizeAngle
        };
    } else {
        global.SteeringBehaviors = {
            wander,
            seek,
            arrive,
            flee,
            combineSteeringBehaviors,
            normalizeAngle
        };
    }
})(typeof window !== 'undefined' ? window : globalThis);
