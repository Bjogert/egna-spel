/* ==========================================
   ARENA HELPERS
   Shared helper functions for arena generation
   ========================================== */

(function (global) {
    function randomBetween(builder, min, max) {
        return Math.random() * (max - min) + min;
    }

    function generateRandomPosition(builder, size, canExclusionRadius, minDistanceFromWalls) {
        const arenaSize = builder.arenaSize;
        const validMinX = -arenaSize + minDistanceFromWalls + size.width / 2;
        const validMaxX = arenaSize - minDistanceFromWalls - size.width / 2;
        const validMinZ = -arenaSize + minDistanceFromWalls + size.depth / 2;
        const validMaxZ = arenaSize - minDistanceFromWalls - size.depth / 2;

        let position;
        let attempts = 0;
        const maxPositionAttempts = 50;

        do {
            position = {
                x: randomBetween(builder, validMinX, validMaxX),
                y: size.height / 2,
                z: randomBetween(builder, validMinZ, validMaxZ)
            };
            attempts++;
        } while (attempts < maxPositionAttempts && getDistanceFromCenter(builder, position) < canExclusionRadius);

        return position;
    }

    function getDistanceFromCenter(builder, position) {
        return Math.sqrt(position.x * position.x + position.z * position.z);
    }

    function isValidObstaclePosition(builder, position, size, existingPositions, minDistance) {
        for (const existing of existingPositions) {
            const distance = Math.sqrt(
                Math.pow(position.x - existing.position.x, 2) +
                Math.pow(position.z - existing.position.z, 2)
            );

            const requiredDistance = minDistance + (size.width + existing.size.width) / 2;

            if (distance < requiredDistance) {
                return false;
            }
        }
        return true;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            randomBetween,
            generateRandomPosition,
            getDistanceFromCenter,
            isValidObstaclePosition
        };
    } else {
        global.ArenaHelpers = {
            randomBetween,
            generateRandomPosition,
            getDistanceFromCenter,
            isValidObstaclePosition
        };
    }
})(typeof window !== 'undefined' ? window : globalThis);