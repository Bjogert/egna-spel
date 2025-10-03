/* ==========================================
   CORNER DETECTION UTILITY
   Extracts corners from obstacles and finds nearest visible corner
   Used for AI "peek around corner" behavior
   ========================================== */

(function (global) {
    /**
     * Extracts all 4 corners from a box collider
     * @param {Object} collider - Box collider with width/depth
     * @param {Object} transform - Transform with position
     * @returns {Array} Array of 4 corner positions {x, z}
     */
    function getBoxCorners(collider, transform) {
        if (collider.type !== 'box') return [];

        const hw = collider.width / 2;
        const hd = collider.depth / 2;
        const pos = transform.position;

        return [
            { x: pos.x + hw, z: pos.z + hd },  // Top-right
            { x: pos.x + hw, z: pos.z - hd },  // Bottom-right
            { x: pos.x - hw, z: pos.z + hd },  // Top-left
            { x: pos.x - hw, z: pos.z - hd }   // Bottom-left
        ];
    }

    /**
     * Simple raycast to check if line from A to B intersects any obstacles
     * Uses AABB (Axis-Aligned Bounding Box) intersection
     * @param {Object} fromPos - Start position {x, z}
     * @param {Object} toPos - End position {x, z}
     * @param {Array} obstacles - Array of {collider, transform}
     * @param {Object} ignoreObstacle - Optional obstacle to ignore (itself)
     * @returns {Object|null} First blocking obstacle or null
     */
    function raycastObstacles(fromPos, toPos, obstacles, ignoreObstacle = null) {
        // Direction vector
        const dx = toPos.x - fromPos.x;
        const dz = toPos.z - fromPos.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < 0.001) return null;

        const dirX = dx / distance;
        const dirZ = dz / distance;

        // Check each obstacle
        for (const { collider, transform } of obstacles) {
            if (collider.type !== 'box') continue;
            if (ignoreObstacle && transform === ignoreObstacle.transform) continue;

            // AABB bounds
            const hw = collider.width / 2;
            const hd = collider.depth / 2;
            const minX = transform.position.x - hw;
            const maxX = transform.position.x + hw;
            const minZ = transform.position.z - hd;
            const maxZ = transform.position.z + hd;

            // Simple line-AABB intersection (stepping algorithm)
            const steps = Math.ceil(distance * 10);  // 10 samples per unit
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const px = fromPos.x + dirX * distance * t;
                const pz = fromPos.z + dirZ * distance * t;

                if (px >= minX && px <= maxX && pz >= minZ && pz <= maxZ) {
                    // Hit this obstacle!
                    return { collider, transform };
                }
            }
        }

        return null;  // No obstacle hit
    }

    /**
     * Find the nearest visible corner of a blocking obstacle
     * "Visible" means AI can see the corner (no other obstacles in the way)
     * @param {Object} aiPos - AI position {x, z}
     * @param {Object} blockingObstacle - The obstacle blocking line of sight
     * @param {Array} allObstacles - All static obstacles
     * @returns {Object|null} Nearest visible corner {x, z} or null
     */
    function findNearestVisibleCorner(aiPos, blockingObstacle, allObstacles) {
        const corners = getBoxCorners(blockingObstacle.collider, blockingObstacle.transform);

        let nearestCorner = null;
        let nearestDistance = Infinity;

        for (const corner of corners) {
            // Calculate distance from AI to this corner
            const dx = corner.x - aiPos.x;
            const dz = corner.z - aiPos.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            // Check if AI can see this corner (no other obstacles blocking)
            const blocked = raycastObstacles(aiPos, corner, allObstacles, blockingObstacle);

            if (!blocked && distance < nearestDistance) {
                nearestDistance = distance;
                nearestCorner = corner;
            }
        }

        return nearestCorner;
    }

    /**
     * Main function: Determine what the AI should look at
     * If direct line of sight is clear → look at target
     * If obstacle blocks → look at nearest visible corner
     *
     * @param {Object} aiPos - AI position {x, z}
     * @param {Object} targetPos - Target position (sound source) {x, z}
     * @param {Array} obstacles - All static obstacles
     * @returns {Object} {lookAtPos: {x, z}, isCorner: boolean, blockingObstacle: Object|null}
     */
    function determineLookAtTarget(aiPos, targetPos, obstacles) {
        // Check if direct path is clear
        const blockingObstacle = raycastObstacles(aiPos, targetPos, obstacles);

        if (!blockingObstacle) {
            // Direct line of sight - look at target
            return {
                lookAtPos: targetPos,
                isCorner: false,
                blockingObstacle: null
            };
        }

        // Obstacle blocks - find nearest visible corner
        const corner = findNearestVisibleCorner(aiPos, blockingObstacle, obstacles);

        if (corner) {
            return {
                lookAtPos: corner,
                isCorner: true,
                blockingObstacle: blockingObstacle
            };
        }

        // Fallback: No visible corner found, look at target anyway
        return {
            lookAtPos: targetPos,
            isCorner: false,
            blockingObstacle: blockingObstacle
        };
    }

    // Export to global scope
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            getBoxCorners,
            raycastObstacles,
            findNearestVisibleCorner,
            determineLookAtTarget
        };
    } else {
        global.CornerDetection = {
            getBoxCorners,
            raycastObstacles,
            findNearestVisibleCorner,
            determineLookAtTarget
        };
    }
})(typeof window !== 'undefined' ? window : globalThis);
