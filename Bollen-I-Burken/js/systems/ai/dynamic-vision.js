/* ==========================================
   DYNAMIC VISION CONE SYSTEM
   AI vision adapts based on what it's looking at
   ========================================== */

(function (global) {
    /**
     * Dynamic Vision Cone Calculator
     *
     * Concept: Trade-off between range and angle
     * - Looking FAR (at obstacles/points of interest) → NARROW cone (focused)
     * - Looking NEAR (general patrol) → WIDE cone (peripheral vision)
     *
     * This makes AI feel intelligent:
     * - "Focuses" on distant hiding spots (narrow beam)
     * - Has wider awareness when close (peripheral)
     */

    class DynamicVision {
        /**
         * Calculate dynamic vision parameters based on scan target distance
         *
         * @param {Object} ai - AI component
         * @param {Object} transform - AI transform
         * @param {Object} scanTarget - What AI is looking at {x, z, distance}
         * @param {Object} baseVision - Base vision stats {range, angle}
         * @returns {Object} {range, angle} - Dynamic vision parameters
         */
        static computeDynamicVision(ai, transform, scanTarget, baseVision) {
            // Base vision stats (from config)
            const baseRange = baseVision.range;      // e.g., 28 units
            const baseAngle = baseVision.angle;      // e.g., 90 degrees

            // Calculate distance to what AI is looking at
            let targetDistance = baseRange * 0.5;  // Default: mid-range

            if (scanTarget && scanTarget.distance !== undefined) {
                targetDistance = scanTarget.distance;
            } else if (scanTarget && scanTarget.x !== undefined && scanTarget.z !== undefined) {
                // Calculate distance from AI to scan target
                const dx = scanTarget.x - transform.position.x;
                const dz = scanTarget.z - transform.position.z;
                targetDistance = Math.sqrt(dx * dx + dz * dz);
            }

            // SMOOTHING: Gradually transition to new distance (prevents twitching!)
            if (!ai._visionState) {
                ai._visionState = { smoothedDistance: targetDistance };
            }

            const smoothingFactor = 0.1;  // Lower = smoother (0.1 = 10% new, 90% old)
            ai._visionState.smoothedDistance =
                ai._visionState.smoothedDistance * (1 - smoothingFactor) +
                targetDistance * smoothingFactor;

            // Use SMOOTHED distance instead of raw distance
            const normalizedDistance = Math.min(ai._visionState.smoothedDistance / baseRange, 1.0);

            // TRADE-OFF FORMULA:
            // Close (0.0): Wide angle (100% base), shorter range (80% base)
            // Mid (0.5):   Normal angle (100% base), normal range (100% base)
            // Far (1.0):   Narrow angle (50% base), longer range (120% base)

            const rangeFactor = this.computeRangeFactor(normalizedDistance);
            const angleFactor = this.computeAngleFactor(normalizedDistance);

            return {
                range: baseRange * rangeFactor,
                angle: baseAngle * angleFactor,
                targetDistance: targetDistance,
                isFocusing: normalizedDistance > 0.6  // Is AI "focusing" on distant target?
            };
        }

        /**
         * Range factor based on distance
         * Close: 0.8x (shorter range)
         * Mid: 1.0x (normal)
         * Far: 2.875x (15% further than 2.5x - can see VERY far!)
         */
        static computeRangeFactor(normalizedDistance) {
            if (normalizedDistance < 0.3) {
                // Close: Shorter range (0.8x)
                return 0.8 + (normalizedDistance / 0.3) * 0.2;  // 0.8 → 1.0
            } else if (normalizedDistance < 0.6) {
                // Mid: Normal range (1.0x)
                return 1.0;
            } else {
                // Far: 2.875x range when focused! (1.0 → 2.875) - 15% further!
                const farProgress = (normalizedDistance - 0.6) / 0.4;
                return 1.0 + farProgress * 1.875;  // 1.0 → 2.875
            }
        }

        /**
         * Angle factor based on distance
         * Close: 1.2x (wider angle - peripheral vision)
         * Mid: 1.0x (normal)
         * Far: 0.15x (85% narrower - tight laser focus!)
         */
        static computeAngleFactor(normalizedDistance) {
            if (normalizedDistance < 0.3) {
                // Close: Wide angle (1.0 → 1.2)
                const closeProgress = normalizedDistance / 0.3;
                return 1.2 - closeProgress * 0.2;  // 1.2 → 1.0
            } else if (normalizedDistance < 0.6) {
                // Mid: Normal angle (1.0x)
                return 1.0;
            } else {
                // Far: 85% narrower (1.0 → 0.15)
                const farProgress = (normalizedDistance - 0.6) / 0.4;
                return 1.0 - farProgress * 0.85;  // 1.0 → 0.15
            }
        }

        /**
         * Get scan target info (what AI is currently looking at)
         * This comes from the can-guard strategy
         */
        static getScanTargetInfo(ai, transform) {
            if (!ai.guardState || ai.guardState.scanTarget === undefined) {
                // No guard state (e.g., AI is racing) - use AI's current heading
                const estimatedDistance = 15;  // Mid-range default
                const heading = ai.heading || 0;

                const targetX = transform.position.x + Math.sin(heading) * estimatedDistance;
                const targetZ = transform.position.z + Math.cos(heading) * estimatedDistance;

                return {
                    x: targetX,
                    z: targetZ,
                    angle: heading,
                    distance: estimatedDistance
                };
            }

            // Calculate ACTUAL distance to obstacle (if looking at one)
            const scanAngle = ai.guardState.scanTarget;
            let actualDistance = 20;  // Far default (no obstacle)

            if (ai.guardState.scanTargetObstacle) {
                // Calculate real distance to obstacle AI is looking at
                const obstacle = ai.guardState.scanTargetObstacle;
                const dx = obstacle.position.x - transform.position.x;
                const dz = obstacle.position.z - transform.position.z;
                actualDistance = Math.sqrt(dx * dx + dz * dz);
            }

            const targetX = transform.position.x + Math.sin(scanAngle) * actualDistance;
            const targetZ = transform.position.z + Math.cos(scanAngle) * actualDistance;

            return {
                x: targetX,
                z: targetZ,
                angle: scanAngle,
                distance: actualDistance  // Now uses REAL distance!
            };
        }

        /**
         * Update vision cone component with dynamic parameters
         */
        static applyDynamicVision(visionCone, dynamicVision) {
            visionCone.range = dynamicVision.range;
            visionCone.angle = dynamicVision.angle;
            visionCone.isFocusing = dynamicVision.isFocusing;
        }

        /**
         * Calculate vision for obstacle checking
         * When AI looks at specific obstacle, narrow cone and extend range
         */
        static computeObstacleFocusVision(ai, transform, obstacle, baseVision) {
            const dx = obstacle.position.x - transform.position.x;
            const dz = obstacle.position.z - transform.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            return this.computeDynamicVision(ai, transform, {
                x: obstacle.position.x,
                z: obstacle.position.z,
                distance: distance
            }, baseVision);
        }
    }

    // Export to global scope
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { DynamicVision };
    } else {
        global.DynamicVision = DynamicVision;
    }
})(typeof window !== 'undefined' ? window : globalThis);
