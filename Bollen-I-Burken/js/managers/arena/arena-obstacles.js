/* ==========================================
   ARENA OBSTACLE BUILDER
   Generates Tetris-like wall obstacles using shape system
   ========================================== */

(function (global) {
    const helpers = global.ArenaHelpers;
    const shapes = global.ObstacleShapes;

    function createRandomObstacles(builder) {
        Utils.log('Creating Tetris-like wall obstacles...');

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
        const clearZoneRadius = difficulty.obstacles.canExclusionRadius;
        const minDistanceBetween = difficulty.obstacles.minDistanceBetween;
        const minDistanceFromWalls = CONFIG.obstacles.minDistanceFromWalls;
        const maxAttempts = CONFIG.obstacles.maxPlacementAttempts;

        const obstacles = [];
        const placedShapes = [];  // Track placed shapes for collision detection

        for (let i = 0; i < count; i++) {
            let placed = false;
            let attempts = 0;

            while (!placed && attempts < maxAttempts) {
                attempts++;

                // Try to place a shape
                const shapeData = tryPlaceShape(
                    builder,
                    difficulty,
                    clearZoneRadius,
                    minDistanceFromWalls,
                    minDistanceBetween,
                    placedShapes,
                    i
                );

                if (shapeData) {
                    obstacles.push(shapeData);
                    placedShapes.push(shapeData);
                    placed = true;

                    const colorName = getColorName(shapeData.color);
                    Utils.log(
                        `Obstacle ${i + 1} [${shapeData.shapeType}] placed at ` +
                        `(${shapeData.position.x.toFixed(1)}, ${shapeData.position.z.toFixed(1)}) - ` +
                        `height: ${shapeData.height.toFixed(1)}m, color: ${colorName}, boxes: ${shapeData.boxCount}`
                    );
                }
            }

            if (!placed) {
                Utils.warn(`Failed to place obstacle ${i + 1} after ${maxAttempts} attempts`);
            }
        }

        Utils.log(`Created ${obstacles.length} Tetris-like wall obstacles`);
        return obstacles;
    }

    /**
     * Try to place a single shape obstacle
     */
    function tryPlaceShape(builder, difficulty, clearZoneRadius, minDistanceFromWalls, minDistanceBetween, placedShapes, index) {
        // Generate random position (approximate - will refine)
        const arenaSize = builder.arenaSize;
        const roughX = helpers.randomBetween(builder, -arenaSize + 2, arenaSize - 2);
        const roughZ = helpers.randomBetween(builder, -arenaSize + 2, arenaSize - 2);
        const roughPosition = { x: roughX, y: 0, z: roughZ };

        // Calculate distance from center (for height)
        const distanceFromCan = helpers.getDistanceFromCenter(builder, roughPosition);

        // Check clear zone
        if (distanceFromCan < clearZoneRadius) {
            return null;  // Too close to can
        }

        // Calculate height based on distance
        const height = shapes.calculateHeightFromDistance(distanceFromCan, difficulty);

        // Generate random shape with random rotation
        const rotation = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
        let shapeBoxes = shapes.generateRandomShape(height, distanceFromCan);
        shapeBoxes = shapes.rotateShape(shapeBoxes, rotation);

        // Calculate shape bounds
        const bounds = shapes.calculateShapeBounds(shapeBoxes);

        // Adjust position to center the shape
        const centerX = roughX - bounds.centerX;
        const centerZ = roughZ - bounds.centerZ;
        const shapePosition = { x: centerX, y: 0, z: centerZ };

        // Check if shape fits in arena
        if (!isShapeInArena(builder, shapePosition, bounds, minDistanceFromWalls)) {
            return null;
        }

        // Check clear zone with actual bounds
        if (!isShapeClearOfCan(shapePosition, bounds, clearZoneRadius)) {
            return null;
        }

        // Check collision with existing shapes
        if (!isShapeValidPosition(shapePosition, bounds, placedShapes, minDistanceBetween)) {
            return null;
        }

        // Create the shape!
        const color = shapes.getColorForHeight(height);
        const materialProps = shapes.getMaterialProperties(height);
        const group = createShapeGroup(builder, shapePosition, shapeBoxes, height, color, materialProps, index);

        return {
            group: group,
            position: shapePosition,
            bounds: bounds,
            height: height,
            color: color,
            boxCount: shapeBoxes.length,
            shapeType: getShapeTypeName(shapeBoxes.length),
            boxes: shapeBoxes  // Include box definitions for compound colliders
        };
    }

    /**
     * Create THREE.Group containing all boxes in shape
     */
    function createShapeGroup(builder, position, boxes, height, color, materialProps, index) {
        const resourceManager = builder.resourceManager;
        const group = new THREE.Group();

        // Get texture for this obstacle if TextureManager is available
        let obstacleTexture = null;
        if (window.TextureManager && TextureManager.loaded) {
            obstacleTexture = TextureManager.getTextureForHeight(height);
            if (obstacleTexture) {
                // Clone texture for this obstacle to avoid shared repeat settings
                obstacleTexture = obstacleTexture.clone();
                obstacleTexture.repeat.set(1, 1);
            }
        }

        // Create each box in the shape
        boxes.forEach((box, boxIndex) => {
            const geometry = resourceManager.create(
                'geometry',
                'box',
                [box.width, box.height, box.depth],
                `obstacle-${index}-box-${boxIndex}-geometry`
            );

            let material;
            if (obstacleTexture) {
                // Use textured material
                material = TextureManager.createTexturedMaterial(
                    color,
                    obstacleTexture,
                    materialProps
                );
            } else {
                // Fallback to solid color
                material = resourceManager.create(
                    'material',
                    'standard',
                    materialProps,
                    `obstacle-${index}-box-${boxIndex}-material`
                );
            }

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(box.x, box.y + box.height / 2, box.z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.name = `obstacle-${index}-box-${boxIndex}`;

            group.add(mesh);
            resourceManager.track(mesh, 'mesh', `obstacle-${index}-box-${boxIndex}-mesh`);
        });

        // Position the group
        group.position.set(position.x, position.y, position.z);
        group.name = `obstacle-group-${index}`;

        // Add to scene
        builder.scene.add(group);
        builder.arenaObjects.push(group);

        return group;
    }

    /**
     * Check if shape fits within arena bounds
     */
    function isShapeInArena(builder, position, bounds, minDistanceFromWalls) {
        const arenaSize = builder.arenaSize;

        const minX = position.x + bounds.minX;
        const maxX = position.x + bounds.maxX;
        const minZ = position.z + bounds.minZ;
        const maxZ = position.z + bounds.maxZ;

        const validMin = -arenaSize + minDistanceFromWalls;
        const validMax = arenaSize - minDistanceFromWalls;

        return minX >= validMin && maxX <= validMax && minZ >= validMin && maxZ <= validMax;
    }

    /**
     * Check if shape is clear of can exclusion zone
     */
    function isShapeClearOfCan(position, bounds, clearZoneRadius) {
        // Check if any corner of the bounding box enters clear zone
        const corners = [
            { x: position.x + bounds.minX, z: position.z + bounds.minZ },
            { x: position.x + bounds.maxX, z: position.z + bounds.minZ },
            { x: position.x + bounds.minX, z: position.z + bounds.maxZ },
            { x: position.x + bounds.maxX, z: position.z + bounds.maxZ }
        ];

        for (const corner of corners) {
            const distFromCenter = Math.sqrt(corner.x * corner.x + corner.z * corner.z);
            if (distFromCenter < clearZoneRadius) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if shape position is valid (no overlap with existing shapes)
     */
    function isShapeValidPosition(position, bounds, placedShapes, minDistance) {
        for (const existing of placedShapes) {
            // Simple bounding box check with padding
            const dx = Math.abs(position.x - existing.position.x);
            const dz = Math.abs(position.z - existing.position.z);

            const combinedWidth = (bounds.width + existing.bounds.width) / 2 + minDistance;
            const combinedDepth = (bounds.depth + existing.bounds.depth) / 2 + minDistance;

            if (dx < combinedWidth && dz < combinedDepth) {
                return false;  // Overlap!
            }
        }

        return true;
    }

    /**
     * Get human-readable color name
     */
    function getColorName(colorHex) {
        switch (colorHex) {
            case 0x22c55e: return 'green (low)';
            case 0xfbbf24: return 'yellow (medium-low)';
            case 0xf97316: return 'orange (medium-high)';
            case 0x8B4513: return 'brown (tall)';
            default: return 'unknown';
        }
    }

    /**
     * Get shape type name from box count
     */
    function getShapeTypeName(boxCount) {
        if (boxCount <= 4) return 'small';
        if (boxCount <= 8) return 'medium';
        if (boxCount <= 12) return 'large';
        return 'huge';
    }

    // ==========================================
    // EXPORTS
    // ==========================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { createRandomObstacles };
    } else {
        global.ArenaObstacles = { createRandomObstacles };
    }
})(typeof window !== 'undefined' ? window : globalThis);
