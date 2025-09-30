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

        const count = CONFIG.obstacles.count;
        const canExclusionRadius = CONFIG.obstacles.canExclusionRadius;
        const minDistanceFromWalls = CONFIG.obstacles.minDistanceFromWalls;
        const minDistanceBetween = CONFIG.obstacles.minDistanceBetween;
        const maxAttempts = CONFIG.obstacles.maxPlacementAttempts;

        const minWidth = CONFIG.obstacles.minWidth;
        const maxWidth = CONFIG.obstacles.maxWidth;
        const minHeight = CONFIG.obstacles.minHeight;
        const maxHeight = CONFIG.obstacles.maxHeight;
        const minDepth = CONFIG.obstacles.minDepth;
        const maxDepth = CONFIG.obstacles.maxDepth;

        const color = CONFIG.obstacles.color;
        const materialType = CONFIG.obstacles.material;

        const obstacles = [];
        const positions = [];

        for (let i = 0; i < count; i++) {
            let placed = false;
            let attempts = 0;

            while (!placed && attempts < maxAttempts) {
                attempts++;

                const size = {
                    width: helpers.randomBetween(builder, minWidth, maxWidth),
                    height: helpers.randomBetween(builder, minHeight, maxHeight),
                    depth: helpers.randomBetween(builder, minDepth, maxDepth)
                };

                const position = helpers.generateRandomPosition(builder, size, canExclusionRadius, minDistanceFromWalls);

                if (helpers.isValidObstaclePosition(builder, position, size, positions, minDistanceBetween)) {
                    const obstacleMesh = createObstacleMesh(builder, position, size, color, materialType, i);

                    positions.push({ position, size, mesh: obstacleMesh });

                    obstacles.push({
                        mesh: obstacleMesh,
                        position,
                        size
                    });

                    placed = true;
                    Utils.log(`Obstacle ${i + 1} placed at (${position.x.toFixed(1)}, ${position.z.toFixed(1)})`);
                }
            }

            if (!placed) {
                Utils.warn(`Failed to place obstacle ${i + 1} after ${maxAttempts} attempts`);
            }
        }

        Utils.log(`Created ${obstacles.length} Swedish playground obstacles`);
        return obstacles;
    }

    function createObstacleMesh(builder, position, size, color, materialType, index) {
        const resourceManager = builder.resourceManager;

        const geometry = resourceManager.create(
            'geometry',
            'box',
            [size.width, size.height, size.depth],
            `obstacle-${index}-geometry`
        );

        const material = resourceManager.create(
            'material',
            materialType,
            { color: color },
            `obstacle-${index}-material`
        );

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = `swedish-obstacle-${index}`;

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