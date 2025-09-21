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
        const arenaResourceIds = [
            'arena-floor-geometry', 'arena-floor-material', 'arena-floor-mesh',
            'arena-wall-material',
            'arena-wall-north-geometry', 'arena-wall-north-mesh',
            'arena-wall-south-geometry', 'arena-wall-south-mesh',
            'arena-wall-east-geometry', 'arena-wall-east-mesh',
            'arena-wall-west-geometry', 'arena-wall-west-mesh',
            'arena-ambient-light', 'arena-directional-light'
        ];

        arenaResourceIds.forEach(id => {
            // Try to dispose from each resource type
            ['geometry', 'material', 'mesh', 'light'].forEach(type => {
                this.resourceManager.dispose(type, id);
            });
        });

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