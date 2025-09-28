/* ==========================================
   BOLLEN I BURKEN - ARENA SYSTEM
   3D Arena creation and management
   ========================================== */

class ArenaBuilder {
    constructor(scene) {
        this.scene = scene;

        // Get enterprise managers (Enterprise pattern)
        this.configManager = ConfigManager.getInstance();
        this.resourceManager = ResourceManager.getInstance();

        // Get arena configuration
        this.arenaSize = this.configManager.get('arena.size');
        this.wallHeight = this.configManager.get('arena.wallHeight');
        this.wallThickness = this.configManager.get('arena.wallThickness');
        this.floorColor = this.configManager.get('arena.floorColor');
        this.wallColor = this.configManager.get('arena.wallColor');

        this.arenaObjects = [];

        Utils.log('ArenaBuilder initialized with ConfigManager and ResourceManager');
    }

    createBasicArena() {
        Utils.log('Creating simple square arena...');

        // Clear existing arena objects
        this.clearArena();

        // Create arena floor
        this.createSquareArenaFloor();

        // Create arena walls
        this.createSquareArenaWalls();

        // Create basic lighting only
        this.createBasicLighting();

        Utils.log('Simple square arena created');
    }

    createSquareArenaFloor() {
        // Create floor using ResourceManager (Enterprise pattern)
        const floorSize = this.arenaSize * 2;

        // Create tracked geometry and material
        const floorGeometry = this.resourceManager.create('geometry', 'plane', [floorSize, floorSize], 'arena-floor-geometry');
        const floorMaterial = this.resourceManager.create('material', 'lambert', {
            color: this.floorColor
        }, 'arena-floor-material');

        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;

        // Track the mesh itself
        this.resourceManager.track(floor, 'mesh', 'arena-floor-mesh');

        this.scene.add(floor);
        this.arenaObjects.push(floor);

        Utils.log('Arena floor created with ResourceManager tracking');
    }

    createSquareArenaWalls() {
        const arenaHalfSize = this.arenaSize;

        // Create shared wall material using ResourceManager
        const wallMaterial = this.resourceManager.create('material', 'lambert', {
            color: this.wallColor
        }, 'arena-wall-material');

        // Create 4 walls for square arena
        const walls = [
            { name: 'north', pos: [0, this.wallHeight / 2, arenaHalfSize], size: [arenaHalfSize * 2, this.wallHeight, this.wallThickness] },
            { name: 'south', pos: [0, this.wallHeight / 2, -arenaHalfSize], size: [arenaHalfSize * 2, this.wallHeight, this.wallThickness] },
            { name: 'east', pos: [arenaHalfSize, this.wallHeight / 2, 0], size: [this.wallThickness, this.wallHeight, arenaHalfSize * 2] },
            { name: 'west', pos: [-arenaHalfSize, this.wallHeight / 2, 0], size: [this.wallThickness, this.wallHeight, arenaHalfSize * 2] }
        ];

        walls.forEach(wallData => {
            // Create tracked geometry for each wall
            const geometry = this.resourceManager.create('geometry', 'box', wallData.size, `arena-wall-${wallData.name}-geometry`);
            const wall = new THREE.Mesh(geometry, wallMaterial);

            wall.position.set(...wallData.pos);
            wall.castShadow = true;
            wall.receiveShadow = true;

            // Track the mesh
            this.resourceManager.track(wall, 'mesh', `arena-wall-${wallData.name}-mesh`);

            this.scene.add(wall);
            this.arenaObjects.push(wall);
        });

        Utils.log('Arena walls created with ResourceManager tracking');
    }

    createBasicLighting() {
        // Get lighting configuration
        const ambientIntensity = this.configManager.get('graphics.ambientLightIntensity');
        const directionalIntensity = this.configManager.get('graphics.directionalLightIntensity');
        const shadowMapSize = this.configManager.get('graphics.shadowMapSize');
        const enableShadows = this.configManager.get('graphics.shadows');

        // Simple ambient lighting - tracked by ResourceManager
        const ambientLight = new THREE.AmbientLight(0x404040, ambientIntensity);
        this.resourceManager.track(ambientLight, 'light', 'arena-ambient-light');
        this.scene.add(ambientLight);
        this.arenaObjects.push(ambientLight);

        // Simple directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, directionalIntensity);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = enableShadows;

        // Basic shadow mapping
        directionalLight.shadow.mapSize.width = shadowMapSize;
        directionalLight.shadow.mapSize.height = shadowMapSize;

        // Fix shadow camera bounds to cover entire arena
        const shadowBounds = this.arenaSize + 5; // Add 5 units padding
        directionalLight.shadow.camera.left = -shadowBounds;
        directionalLight.shadow.camera.right = shadowBounds;
        directionalLight.shadow.camera.top = shadowBounds;
        directionalLight.shadow.camera.bottom = -shadowBounds;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 50;

        this.resourceManager.track(directionalLight, 'light', 'arena-directional-light');
        this.scene.add(directionalLight);
        this.arenaObjects.push(directionalLight);

        Utils.log('Arena lighting created with ResourceManager tracking');
    }

    createCentralCan() {
        Utils.log('Creating central Swedish can (Burken)...');

        // Get can configuration from ConfigManager
        const canRadius = this.configManager.get('can.radius', 0.8);
        const canHeight = this.configManager.get('can.height', 1.6);
        const canColor = this.configManager.get('can.color', 0x8B4513); // Swedish brown
        const canPosition = this.configManager.get('can.position', { x: 0, y: canHeight / 2, z: 0 });

        // Create tracked geometry and material for Swedish-style metal can
        const canGeometry = this.resourceManager.create(
            'geometry',
            'cylinder',
            [canRadius, canRadius, canHeight, 12], // 12 segments for smooth cylinder
            'central-can-geometry'
        );

        const canMaterial = this.resourceManager.create(
            'material',
            'lambert',
            {
                color: canColor,
                roughness: 0.7,
                metalness: 0.3
            },
            'central-can-material'
        );

        // Create the can mesh
        const canMesh = new THREE.Mesh(canGeometry, canMaterial);
        canMesh.position.set(canPosition.x, canPosition.y, canPosition.z);
        canMesh.castShadow = true;
        canMesh.receiveShadow = true;

        // Add some Swedish character with simple texture/details
        canMesh.name = 'central-burken'; // Swedish name for the can

        // Track the mesh with ResourceManager
        this.resourceManager.track(canMesh, 'mesh', 'central-can-mesh');

        // Add to scene and track
        this.scene.add(canMesh);
        this.arenaObjects.push(canMesh);

        Utils.log('Central Swedish can (Burken) created at arena center');
        return canMesh;
    }

    createRandomObstacles() {
        Utils.log('Creating random Swedish playground obstacles...');

        // Get obstacle configuration (no magic numbers!)
        const enabled = this.configManager.get('obstacles.enabled');
        if (!enabled) {
            Utils.log('Obstacles disabled in configuration');
            return [];
        }

        const count = this.configManager.get('obstacles.count');
        const canExclusionRadius = this.configManager.get('obstacles.canExclusionRadius');
        const minDistanceFromWalls = this.configManager.get('obstacles.minDistanceFromWalls');
        const minDistanceBetween = this.configManager.get('obstacles.minDistanceBetween');
        const maxAttempts = this.configManager.get('obstacles.maxPlacementAttempts');

        // Size ranges (fully configurable)
        const minWidth = this.configManager.get('obstacles.minWidth');
        const maxWidth = this.configManager.get('obstacles.maxWidth');
        const minHeight = this.configManager.get('obstacles.minHeight');
        const maxHeight = this.configManager.get('obstacles.maxHeight');
        const minDepth = this.configManager.get('obstacles.minDepth');
        const maxDepth = this.configManager.get('obstacles.maxDepth');

        // Visual properties
        const color = this.configManager.get('obstacles.color');
        const materialType = this.configManager.get('obstacles.material');

        const obstacles = [];
        const positions = [];

        // Generate obstacles
        for (let i = 0; i < count; i++) {
            let placed = false;
            let attempts = 0;

            while (!placed && attempts < maxAttempts) {
                attempts++;

                // Generate random size within configured ranges
                const size = {
                    width: this.randomBetween(minWidth, maxWidth),
                    height: this.randomBetween(minHeight, maxHeight),
                    depth: this.randomBetween(minDepth, maxDepth)
                };

                // Generate random position
                const position = this.generateRandomPosition(size, canExclusionRadius, minDistanceFromWalls);

                // Check if position is valid (no overlaps)
                if (this.isValidObstaclePosition(position, size, positions, minDistanceBetween)) {
                    // Create obstacle mesh
                    const obstacleMesh = this.createObstacleMesh(position, size, color, materialType, i);

                    // Store position and size for collision checking
                    positions.push({
                        position: position,
                        size: size,
                        mesh: obstacleMesh
                    });

                    obstacles.push({
                        mesh: obstacleMesh,
                        position: position,
                        size: size
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

    randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }

    generateRandomPosition(size, canExclusionRadius, minDistanceFromWalls) {
        // Calculate valid placement area
        const validMinX = -this.arenaSize + minDistanceFromWalls + size.width / 2;
        const validMaxX = this.arenaSize - minDistanceFromWalls - size.width / 2;
        const validMinZ = -this.arenaSize + minDistanceFromWalls + size.depth / 2;
        const validMaxZ = this.arenaSize - minDistanceFromWalls - size.depth / 2;

        let position;
        let attempts = 0;
        const maxPositionAttempts = 50;

        do {
            position = {
                x: this.randomBetween(validMinX, validMaxX),
                y: size.height / 2, // Place on ground
                z: this.randomBetween(validMinZ, validMaxZ)
            };
            attempts++;
        } while (attempts < maxPositionAttempts && this.getDistanceFromCenter(position) < canExclusionRadius);

        return position;
    }

    getDistanceFromCenter(position) {
        return Math.sqrt(position.x * position.x + position.z * position.z);
    }

    isValidObstaclePosition(position, size, existingPositions, minDistance) {
        // Check distance from existing obstacles
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

    createObstacleMesh(position, size, color, materialType, index) {
        // Create tracked geometry and material
        const geometry = this.resourceManager.create(
            'geometry',
            'box',
            [size.width, size.height, size.depth],
            `obstacle-${index}-geometry`
        );

        const material = this.resourceManager.create(
            'material',
            materialType,
            { color: color },
            `obstacle-${index}-material`
        );

        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Add Swedish naming
        mesh.name = `swedish-obstacle-${index}`;

        // Track mesh with ResourceManager
        this.resourceManager.track(mesh, 'mesh', `obstacle-${index}-mesh`);

        // Add to scene and track
        this.scene.add(mesh);
        this.arenaObjects.push(mesh);

        return mesh;
    }

    clearArena() {
        // Professional resource cleanup using ResourceManager
        Utils.log('Clearing arena using ResourceManager...');

        // Remove all arena objects from scene
        this.arenaObjects.forEach(obj => {
            this.scene.remove(obj);

            // Use ResourceManager for proper disposal if tracked
            if (obj._resourceId && obj._resourceType) {
                this.resourceManager.disposeByReference(obj);
            } else {
                // Fallback for untracked objects (legacy cleanup)
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(mat => mat.dispose());
                    } else {
                        obj.material.dispose();
                    }
                }
            }
        });

        // Clear arena-specific resources through ResourceManager
        const staticResourceIds = [
            'arena-floor-geometry', 'arena-floor-material', 'arena-floor-mesh',
            'arena-wall-material',
            'arena-wall-north-geometry', 'arena-wall-north-mesh',
            'arena-wall-south-geometry', 'arena-wall-south-mesh',
            'arena-wall-east-geometry', 'arena-wall-east-mesh',
            'arena-wall-west-geometry', 'arena-wall-west-mesh',
            'arena-ambient-light', 'arena-directional-light',
            'central-can-geometry', 'central-can-material', 'central-can-mesh'
        ];

        staticResourceIds.forEach(id => {
            // Try to dispose from each resource type
            ['geometry', 'material', 'mesh', 'light'].forEach(type => {
                this.resourceManager.dispose(type, id);
            });
        });

        // Clear dynamically generated obstacles
        const obstacleCount = this.configManager.get('obstacles.count', 50); // Use max possible
        for (let i = 0; i < obstacleCount; i++) {
            const obstacleIds = [
                `obstacle-${i}-geometry`,
                `obstacle-${i}-material`,
                `obstacle-${i}-mesh`
            ];

            obstacleIds.forEach(id => {
                ['geometry', 'material', 'mesh'].forEach(type => {
                    this.resourceManager.dispose(type, id);
                });
            });
        }

        this.arenaObjects = [];
        Utils.log('Arena cleared with ResourceManager');
    }

    getArenaInfo() {
        return {
            size: this.arenaSize,
            objectCount: this.arenaObjects.length,
            center: { x: 0, y: 0, z: 0 },
            bounds: {
                min: { x: -this.arenaSize, z: -this.arenaSize },
                max: { x: this.arenaSize, z: this.arenaSize }
            }
        };
    }
}

// Export for module systems or global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ArenaBuilder };
} else {
    window.GameArena = { ArenaBuilder };
}