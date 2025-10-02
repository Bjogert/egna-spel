/* ==========================================
   OBSTACLE SHAPES
   Tetris-like wall shape definitions for arena obstacles
   ========================================== */

(function (global) {
    // ==========================================
    // SHAPE TYPE CONSTANTS
    // ==========================================
    const SHAPE_TYPES = {
        STRAIGHT: 'straight',       // Long straight wall (Tetris I-piece)
        L_CORNER: 'l_corner',       // L-shaped corner (Tetris L-piece)
        T_JUNCTION: 't_junction',   // T-shaped junction (Tetris T-piece)
        Z_SHAPE: 'z_shape',         // Z-shaped wall (Tetris Z-piece)
        SHORT: 'short',             // Short single wall
        SMALL_CUBE: 'small_cube'    // Small cube cluster
    };

    // ==========================================
    // BOX SIZE CONSTANTS
    // One "unit" in Tetris-like shapes
    // ==========================================
    const UNIT_SIZE = 0.8;  // Each small box is 0.8m x 0.8m
    const WALL_THICKNESS = 0.8;  // Walls are SOLID cubes (not thin slices!)

    // ==========================================
    // HEIGHT CALCULATION
    // Based on distance from center can
    // ==========================================
    function calculateHeightFromDistance(distanceFromCan, difficulty) {
        // MUCH MORE RANDOM - short obstacles can be far back, tall can be near
        // Just use full range with slight bias towards taller = further

        const minHeight = 0.5;  // Minimum possible
        const maxHeight = 4.5;  // Maximum possible

        // Random base height from full range
        let height = minHeight + Math.random() * (maxHeight - minHeight);

        // Slight bias: obstacles further from can have +20% chance to be taller
        if (distanceFromCan > 7.0 && Math.random() < 0.3) {
            // Boost far obstacles slightly (but still random!)
            height = Math.max(height, 2.0 + Math.random() * 2.5);
        }

        return height;
    }

    // ==========================================
    // COLOR CALCULATION
    // More variety - 8 colors based on height
    // ==========================================
    function getColorForHeight(height) {
        if (height < 0.8) {
            return 0x10b981;  // Bright green (very low)
        } else if (height < 1.2) {
            return 0x22c55e;  // Green (low)
        } else if (height < 1.8) {
            return 0xfbbf24;  // Yellow (medium-low)
        } else if (height < 2.4) {
            return 0xfb923c;  // Light orange
        } else if (height < 3.0) {
            return 0xf97316;  // Orange (medium-high)
        } else if (height < 3.6) {
            return 0xdc2626;  // Red (tall)
        } else if (height < 4.2) {
            return 0x991b1b;  // Dark red (very tall)
        } else {
            return 0x78350f;  // Dark brown (massive walls)
        }
    }

    // ==========================================
    // MATERIAL PROPERTIES
    // Based on obstacle height
    // ==========================================
    function getMaterialProperties(height) {
        const props = { color: getColorForHeight(height) };

        // Make very low obstacles slightly transparent
        if (height < 1.0) {
            props.transparent = true;
            props.opacity = 0.85;
        }

        return props;
    }

    // ==========================================
    // SHAPE DEFINITIONS
    // Each shape = array of boxes with relative positions
    // Format: { x, y, z, width, height, depth }
    // ==========================================

    /**
     * STRAIGHT WALL - Long straight line
     * Example: ████████████ (8-15 units long)
     */
    function createStraightWall(height) {
        const length = 8 + Math.floor(Math.random() * 8);  // 8-15 units long (LONGER!)
        const boxes = [];

        for (let i = 0; i < length; i++) {
            boxes.push({
                x: i * UNIT_SIZE - (length * UNIT_SIZE) / 2,
                y: 0,
                z: 0,
                width: UNIT_SIZE,
                height: height,
                depth: WALL_THICKNESS
            });
        }

        return boxes;
    }

    /**
     * L-CORNER - Two perpendicular walls meeting
     * Example:
     *   ██
     *   ██
     *   ██████████████████
     */
    function createLCorner(height) {
        const longSide = 5 + Math.floor(Math.random() * 4);  // 5-8 units
        const shortSide = 3 + Math.floor(Math.random() * 2);  // 3-4 units
        const boxes = [];

        // Horizontal part (bottom of L)
        for (let i = 0; i < longSide; i++) {
            boxes.push({
                x: i * UNIT_SIZE,
                y: 0,
                z: 0,
                width: UNIT_SIZE,
                height: height,
                depth: WALL_THICKNESS
            });
        }

        // Vertical part (side of L) - skip first box to avoid overlap
        for (let i = 1; i < shortSide; i++) {
            boxes.push({
                x: 0,
                y: 0,
                z: i * UNIT_SIZE,
                width: WALL_THICKNESS,
                height: height,
                depth: UNIT_SIZE
            });
        }

        return boxes;
    }

    /**
     * T-JUNCTION - Three walls meeting at center
     * Example:
     *     ██
     *     ██
     *   ██████████████████
     *     ██
     */
    function createTJunction(height) {
        const mainLength = 6 + Math.floor(Math.random() * 3);  // 6-8 units
        const branchLength = 3 + Math.floor(Math.random() * 2);  // 3-4 units
        const boxes = [];

        const centerX = Math.floor(mainLength / 2);

        // Horizontal main wall
        for (let i = 0; i < mainLength; i++) {
            boxes.push({
                x: (i - centerX) * UNIT_SIZE,
                y: 0,
                z: 0,
                width: UNIT_SIZE,
                height: height,
                depth: WALL_THICKNESS
            });
        }

        // Vertical branch (skip center to avoid overlap)
        for (let i = 1; i < branchLength; i++) {
            boxes.push({
                x: 0,
                y: 0,
                z: i * UNIT_SIZE,
                width: WALL_THICKNESS,
                height: height,
                depth: UNIT_SIZE
            });
        }

        return boxes;
    }

    /**
     * Z-SHAPE - Offset parallel walls
     * Example:
     *   ████
     *     ██
     *     ████████████
     */
    function createZShape(height) {
        const topLength = 3 + Math.floor(Math.random() * 2);  // 3-4 units
        const bottomLength = 3 + Math.floor(Math.random() * 2);  // 3-4 units
        const offset = 2;  // Vertical offset
        const boxes = [];

        // Top horizontal part
        for (let i = 0; i < topLength; i++) {
            boxes.push({
                x: i * UNIT_SIZE,
                y: 0,
                z: 0,
                width: UNIT_SIZE,
                height: height,
                depth: WALL_THICKNESS
            });
        }

        // Connecting vertical part
        for (let i = 1; i < offset; i++) {
            boxes.push({
                x: (topLength - 1) * UNIT_SIZE,
                y: 0,
                z: i * UNIT_SIZE,
                width: WALL_THICKNESS,
                height: height,
                depth: UNIT_SIZE
            });
        }

        // Bottom horizontal part
        for (let i = 0; i < bottomLength; i++) {
            boxes.push({
                x: (topLength - 1) * UNIT_SIZE + i * UNIT_SIZE,
                y: 0,
                z: offset * UNIT_SIZE,
                width: UNIT_SIZE,
                height: height,
                depth: WALL_THICKNESS
            });
        }

        return boxes;
    }

    /**
     * SHORT WALL - Short straight wall
     * Example: ████
     */
    function createShortWall(height) {
        const length = 3 + Math.floor(Math.random() * 3);  // 3-5 units
        const boxes = [];

        for (let i = 0; i < length; i++) {
            boxes.push({
                x: i * UNIT_SIZE - (length * UNIT_SIZE) / 2,
                y: 0,
                z: 0,
                width: UNIT_SIZE,
                height: height,
                depth: WALL_THICKNESS
            });
        }

        return boxes;
    }

    /**
     * SMALL CUBE - Small cluster of cubes
     * Example: ██
     *          ██
     */
    function createSmallCube(height) {
        const size = 2 + Math.floor(Math.random() * 2);  // 2-3 units per side
        const boxes = [];

        for (let x = 0; x < size; x++) {
            for (let z = 0; z < size; z++) {
                boxes.push({
                    x: x * UNIT_SIZE - (size * UNIT_SIZE) / 2,
                    y: 0,
                    z: z * UNIT_SIZE - (size * UNIT_SIZE) / 2,
                    width: UNIT_SIZE,
                    height: height,
                    depth: UNIT_SIZE
                });
            }
        }

        return boxes;
    }

    // ==========================================
    // SHAPE GENERATION
    // ==========================================

    /**
     * Generate random shape with weighted probabilities
     */
    function generateRandomShape(height, distanceFromCan) {
        // Weight probabilities based on distance
        // Far obstacles: prefer long walls and corners
        // Near obstacles: prefer small cubes and short walls
        let weights;

        // ALL SHAPES ENABLED - compound colliders make everything work perfectly!
        if (distanceFromCan < 4.0) {
            // Near can: variety of shapes
            weights = [
                { type: SHAPE_TYPES.STRAIGHT, weight: 0.30 },
                { type: SHAPE_TYPES.L_CORNER, weight: 0.25 },
                { type: SHAPE_TYPES.SHORT, weight: 0.20 },
                { type: SHAPE_TYPES.T_JUNCTION, weight: 0.15 },
                { type: SHAPE_TYPES.SMALL_CUBE, weight: 0.10 }
            ];
        } else {
            // Far from can: more complex walls
            weights = [
                { type: SHAPE_TYPES.STRAIGHT, weight: 0.35 },
                { type: SHAPE_TYPES.L_CORNER, weight: 0.25 },
                { type: SHAPE_TYPES.T_JUNCTION, weight: 0.20 },
                { type: SHAPE_TYPES.Z_SHAPE, weight: 0.15 },
                { type: SHAPE_TYPES.SHORT, weight: 0.05 }
            ];
        }

        // Weighted random selection
        const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
        let random = Math.random() * totalWeight;

        for (const w of weights) {
            random -= w.weight;
            if (random <= 0) {
                return createShape(w.type, height);
            }
        }

        // Fallback
        return createShape(SHAPE_TYPES.SHORT, height);
    }

    /**
     * Create specific shape type
     */
    function createShape(type, height) {
        switch (type) {
            case SHAPE_TYPES.STRAIGHT:
                return createStraightWall(height);
            case SHAPE_TYPES.L_CORNER:
                return createLCorner(height);
            case SHAPE_TYPES.T_JUNCTION:
                return createTJunction(height);
            case SHAPE_TYPES.Z_SHAPE:
                return createZShape(height);
            case SHAPE_TYPES.SHORT:
                return createShortWall(height);
            case SHAPE_TYPES.SMALL_CUBE:
                return createSmallCube(height);
            default:
                return createShortWall(height);
        }
    }

    /**
     * Rotate shape boxes by angle (0, 90, 180, 270 degrees)
     */
    function rotateShape(boxes, angleDegrees) {
        const angleRad = (angleDegrees * Math.PI) / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);

        return boxes.map(box => {
            const rotatedX = box.x * cos - box.z * sin;
            const rotatedZ = box.x * sin + box.z * cos;

            return {
                x: rotatedX,
                y: box.y,
                z: rotatedZ,
                width: box.width,
                height: box.height,
                depth: box.depth
            };
        });
    }

    /**
     * Calculate bounding box for entire shape
     */
    function calculateShapeBounds(boxes) {
        if (boxes.length === 0) {
            return { minX: 0, maxX: 0, minZ: 0, maxZ: 0, width: 0, depth: 0 };
        }

        let minX = Infinity, maxX = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        for (const box of boxes) {
            const halfWidth = box.width / 2;
            const halfDepth = box.depth / 2;

            minX = Math.min(minX, box.x - halfWidth);
            maxX = Math.max(maxX, box.x + halfWidth);
            minZ = Math.min(minZ, box.z - halfDepth);
            maxZ = Math.max(maxZ, box.z + halfDepth);
        }

        return {
            minX, maxX, minZ, maxZ,
            width: maxX - minX,
            depth: maxZ - minZ,
            centerX: (minX + maxX) / 2,
            centerZ: (minZ + maxZ) / 2
        };
    }

    // ==========================================
    // EXPORTS
    // ==========================================
    const ObstacleShapes = {
        SHAPE_TYPES,
        UNIT_SIZE,
        WALL_THICKNESS,
        calculateHeightFromDistance,
        getColorForHeight,
        getMaterialProperties,
        generateRandomShape,
        createShape,
        rotateShape,
        calculateShapeBounds
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ObstacleShapes;
    } else {
        global.ObstacleShapes = ObstacleShapes;
    }
})(typeof window !== 'undefined' ? window : globalThis);
