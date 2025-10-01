/* ==========================================
   ARENA OBSTACLE BUILDER
   Generates random playground obstacles
   ========================================== */

(function (global) {
    const helpers = global.ArenaHelpers;

    function createRandomObstacles(builder) {
        Utils.log('Creating random Swedish playground obstacles...');

        const enabled = CONFIG.obstacles.enabled;
        if (!enabled) {
            Utils.log('Obstacles disabled in configuration');
            return [];
        }

        // Get difficulty settings
        const difficultyLevel = CONFIG.currentDifficulty;
        const difficulty = CONFIG.difficulties[difficultyLevel];

        Utils.log(`Difficulty: ${difficulty.name} (Level ${difficultyLevel + 1})`);
        Utils.log(`  Description: ${difficulty.description}`);

        // Use difficulty-specific settings
        const count = difficulty.obstacles.count;
        const canExclusionRadius = difficulty.obstacles.canExclusionRadius;
        const minDistanceBetween = difficulty.obstacles.minDistanceBetween;
        const minDistanceFromWalls = CONFIG.obstacles.minDistanceFromWalls;
        const maxAttempts = CONFIG.obstacles.maxPlacementAttempts;

        const minWidth = difficulty.obstacles.minWidth;
        const maxWidth = difficulty.obstacles.maxWidth;
        const minHeight = difficulty.obstacles.minHeight;
        const maxHeight = difficulty.obstacles.maxHeight;
        const minDepth = difficulty.obstacles.minDepth;
        const maxDepth = difficulty.obstacles.maxDepth;

        const lowObstacleRatio = difficulty.obstacles.lowObstacleRatio || 0;

        const color = CONFIG.obstacles.color;
        const materialType = CONFIG.obstacles.material;

        const obstacles = [];
        const positions = [];

        for (let i = 0; i < count; i++) {
            let placed = false;
            let attempts = 0;

            // Determine if this should be a low obstacle
            const isLowObstacle = Math.random() < lowObstacleRatio;

            while (!placed && attempts < maxAttempts) {
                attempts++;

                const size = {
                    width: helpers.randomBetween(builder, minWidth, maxWidth),
                    height: isLowObstacle
                        ? helpers.randomBetween(builder, 0.5, 1.2)  // Low: 0.5-1.2m (can see over)
                        : helpers.randomBetween(builder, minHeight, maxHeight),  // Normal height
                    depth: helpers.randomBetween(builder, minDepth, maxDepth)
                };

                const position = helpers.generateRandomPosition(builder, size, canExclusionRadius, minDistanceFromWalls);

                if (helpers.isValidObstaclePosition(builder, position, size, positions, minDistanceBetween)) {
                    const obstacleColor = isLowObstacle ? 0x22c55e : color;  // Green for low obstacles
                    const obstacleMesh = createObstacleMesh(builder, position, size, obstacleColor, materialType, i, isLowObstacle);

                    positions.push({ position, size, mesh: obstacleMesh });

                    obstacles.push({
                        mesh: obstacleMesh,
                        position,
                        size,
                        isLowObstacle
                    });

                    placed = true;
                    const type = isLowObstacle ? 'LOW' : 'FULL';
                    Utils.log(`Obstacle ${i + 1} [${type}] placed at (${position.x.toFixed(1)}, ${position.z.toFixed(1)}) - height: ${size.height.toFixed(1)}m`);
                }
            }

            if (!placed) {
                Utils.warn(`Failed to place obstacle ${i + 1} after ${maxAttempts} attempts`);
            }
        }

        Utils.log(`Created ${obstacles.length} Swedish playground obstacles`);
        return obstacles;
    }

    function createObstacleMesh(builder, position, size, color, materialType, index, isLowObstacle = false) {
        const resourceManager = builder.resourceManager;

        const geometry = resourceManager.create(
            'geometry',
            'box',
            [size.width, size.height, size.depth],
            `obstacle-${index}-geometry`
        );

        const materialOptions = { color: color };

        // Make low obstacles slightly transparent to show they're different
        if (isLowObstacle) {
            materialOptions.opacity = 0.85;
            materialOptions.transparent = true;
        }

        const material = resourceManager.create(
            'material',
            materialType,
            materialOptions,
            `obstacle-${index}-material`
        );

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = `swedish-obstacle-${index}${isLowObstacle ? '-low' : ''}`;
        mesh.userData.isLowObstacle = isLowObstacle;

        resourceManager.track(mesh, 'mesh', `obstacle-${index}-mesh`);

        builder.scene.add(mesh);
        builder.arenaObjects.push(mesh);

        return mesh;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { createRandomObstacles };
    } else {
        global.ArenaObstacles = { createRandomObstacles };
    }
})(typeof window !== 'undefined' ? window : globalThis);