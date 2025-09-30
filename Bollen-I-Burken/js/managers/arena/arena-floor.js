/* ==========================================
   ARENA FLOOR BUILDER
   ========================================== */

(function (global) {
    function createSquareArenaFloor(builder) {
        const floorSize = builder.arenaSize * 2;
        const resourceManager = builder.resourceManager;

        const floorGeometry = resourceManager.create('geometry', 'plane', [floorSize, floorSize], 'arena-floor-geometry');
        const floorMaterial = resourceManager.create('material', 'lambert', {
            color: builder.floorColor
        }, 'arena-floor-material');

        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;

        resourceManager.track(floor, 'mesh', 'arena-floor-mesh');

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