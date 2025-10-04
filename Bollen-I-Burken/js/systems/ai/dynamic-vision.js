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
        static clamp(value, min, max) {
            return Math.min(Math.max(value, min), max);
        }

        static computeDynamicVision(ai, transform, scanTarget, baseVision) {
            const baseRange = baseVision.range;
            const baseAngle = baseVision.angle;

            let targetDistance = baseRange * 0.5;

            if (scanTarget && scanTarget.distance !== undefined) {
                targetDistance = scanTarget.distance;
            } else if (scanTarget && scanTarget.x !== undefined && scanTarget.z !== undefined) {
                const dx = scanTarget.x - transform.position.x;
                const dz = scanTarget.z - transform.position.z;
                targetDistance = Math.sqrt(dx * dx + dz * dz);
            }

            if (!ai._visionState) {
                ai._visionState = { smoothedDistance: targetDistance };
            }

            const smoothingFactor = 0.1;
            ai._visionState.smoothedDistance =
                ai._visionState.smoothedDistance * (1 - smoothingFactor) +
                targetDistance * smoothingFactor;

            const normalizedDistance = Math.min(ai._visionState.smoothedDistance / baseRange, 1.0);

            const nearThreshold = this.clamp(typeof ai.visionCloseThreshold === 'number' ? ai.visionCloseThreshold : 0.3, 0.05, 0.95);
            const farThreshold = this.clamp(typeof ai.visionFarThreshold === 'number' ? ai.visionFarThreshold : 0.6, nearThreshold + 0.01, 0.99);

            const rangeFactor = this.computeRangeFactor(normalizedDistance, nearThreshold, farThreshold);
            const angleFactor = this.computeAngleFactor(normalizedDistance, nearThreshold, farThreshold);

            return {
                range: baseRange * rangeFactor,
                angle: baseAngle * angleFactor,
                targetDistance: targetDistance,
                isFocusing: normalizedDistance > farThreshold
            };
        }

        static computeRangeFactor(normalizedDistance, nearThreshold, farThreshold) {
            if (normalizedDistance <= nearThreshold) {
                const closeProgress = nearThreshold <= 0 ? 1 : normalizedDistance / nearThreshold;
                return 0.8 + closeProgress * 0.2;
            } else if (normalizedDistance <= farThreshold) {
                return 1.0;
            } else {
                const farProgress = (normalizedDistance - farThreshold) / Math.max(0.0001, 1 - farThreshold);
                return 1.0 + farProgress * 1.875;
            }
        }

        static computeAngleFactor(normalizedDistance, nearThreshold, farThreshold) {
            if (normalizedDistance <= nearThreshold) {
                const closeProgress = nearThreshold <= 0 ? 1 : normalizedDistance / nearThreshold;
                return 1.2 - closeProgress * 0.2;
            } else if (normalizedDistance <= farThreshold) {
                return 1.0;
            } else {
                const farProgress = (normalizedDistance - farThreshold) / Math.max(0.0001, 1 - farThreshold);
                return 1.0 - farProgress * 0.85;
            }
        }

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
