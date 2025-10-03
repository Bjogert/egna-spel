/* ==========================================
   ARENA WALL BUILDER
   ========================================== */

(function (global) {
    function createSquareArenaWalls(builder) {
        const arenaHalfSize = builder.arenaSize;
        const resourceManager = builder.resourceManager;

        // Try to use textured walls if TextureManager is available
        let wallMaterial;
        if (window.TextureManager && TextureManager.loaded) {
            const wallTexture = TextureManager.getWallTexture();
            if (wallTexture) {
                wallMaterial = TextureManager.createTexturedMaterial(
                    builder.wallColor,
                    wallTexture,
                    { roughness: 0.85, metalness: 0.15 }
                );
                Utils.log('Arena walls using textured material');
            } else {
                wallMaterial = resourceManager.create('material', 'lambert', {
                    color: builder.wallColor
                }, 'arena-wall-material');
            }
        } else {
            wallMaterial = resourceManager.create('material', 'lambert', {
                color: builder.wallColor
            }, 'arena-wall-material');
        }

        const walls = [
            { name: 'north', pos: [0, builder.wallHeight / 2, arenaHalfSize], size: [arenaHalfSize * 2, builder.wallHeight, builder.wallThickness] },
            { name: 'south', pos: [0, builder.wallHeight / 2, -arenaHalfSize], size: [arenaHalfSize * 2, builder.wallHeight, builder.wallThickness] },
            { name: 'east', pos: [arenaHalfSize, builder.wallHeight / 2, 0], size: [builder.wallThickness, builder.wallHeight, arenaHalfSize * 2] },
            { name: 'west', pos: [-arenaHalfSize, builder.wallHeight / 2, 0], size: [builder.wallThickness, builder.wallHeight, arenaHalfSize * 2] }
        ];

        walls.forEach(wallData => {
            const geometry = resourceManager.create('geometry', 'box', wallData.size, `arena-wall-${wallData.name}-geometry`);
            const wall = new THREE.Mesh(geometry, wallMaterial);

            wall.position.set(...wallData.pos);
            wall.castShadow = true;
            wall.receiveShadow = true;

            resourceManager.track(wall, 'mesh', `arena-wall-${wallData.name}-mesh`);

            builder.scene.add(wall);
            builder.arenaObjects.push(wall);
        });

        Utils.log('Arena walls created with ResourceManager tracking');
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { createSquareArenaWalls };
    } else {
        global.ArenaWalls = { createSquareArenaWalls };
    }
})(typeof window !== 'undefined' ? window : globalThis);