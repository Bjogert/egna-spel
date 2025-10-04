/* ==========================================
   ARENA FLOOR BUILDER
   ========================================== */

(function (global) {
    function createSquareArenaFloor(builder) {
        const floorSize = builder.arenaSize * 2;
        const resourceManager = builder.resourceManager;

        const floorGeometry = resourceManager.create('geometry', 'plane', [floorSize, floorSize], 'arena-floor-geometry');

        // Try to use textured floor if TextureManager is available
        let floorMaterial;
        if (window.TextureManager && TextureManager.loaded && window.TEXTURE_SETTINGS) {
            const floorTexture = TextureManager.getFloorTexture();
            if (floorTexture) {
                // Create brighter grass material using settings
                const baseColor = new THREE.Color(builder.floorColor);
                baseColor.multiplyScalar(TEXTURE_SETTINGS.grassBrightness);

                floorMaterial = TextureManager.createTexturedMaterial(
                    baseColor.getHex(),
                    floorTexture,
                    {
                        roughness: TEXTURE_SETTINGS.floorRoughness,
                        metalness: TEXTURE_SETTINGS.floorMetalness
                    }
                );
                Utils.log('Arena floor using grass texture with brightness: ' + TEXTURE_SETTINGS.grassBrightness);
            } else {
                floorMaterial = resourceManager.create('material', 'lambert', {
                    color: builder.floorColor
                }, 'arena-floor-material');
            }
        } else {
            floorMaterial = resourceManager.create('material', 'lambert', {
                color: builder.floorColor
            }, 'arena-floor-material');
        }

        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;

        resourceManager.track(floor, 'mesh', 'arena-floor-mesh');

        if (CONFIG.physics.enabled && typeof BodyFactory !== 'undefined' && global.physicsSystem) {
            const floorBody = BodyFactory.createStaticBox({
                width: floorSize,
                height: 0.5,
                depth: floorSize,
                position: { x: 0, y: -0.25, z: 0 },
                bodyType: 'obstacle'
            });
            builder.registerPhysicsBody(floorBody);
            floor.userData = floor.userData || {};
            floor.userData.physicsBody = floorBody;
        }

        builder.scene.add(floor);
        builder.arenaObjects.push(floor);

        Utils.log('Arena floor created with ResourceManager tracking');
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { createSquareArenaFloor };
    } else {
        global.ArenaFloor = { createSquareArenaFloor };
    }
})(typeof window !== 'undefined' ? window : globalThis);
