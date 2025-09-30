/* ==========================================
   ARENA CAN BUILDER
   Creates the central Swedish can (Burken)
   ========================================== */

(function (global) {
    function createCentralCan(builder) {
        Utils.log('Creating central Swedish can (Burken)...');

        const canRadius = CONFIG.can.radius;
        const canHeight = CONFIG.can.height;
        const canColor = CONFIG.can.color;
        const canPosition = CONFIG.can.position;
        const resourceManager = builder.resourceManager;

        const canGeometry = resourceManager.create(
            'geometry',
            'cylinder',
            [canRadius, canRadius, canHeight, 12],
            'central-can-geometry'
        );

        const canMaterial = resourceManager.create(
            'material',
            'lambert',
            {
                color: canColor,
                roughness: 0.7,
                metalness: 0.3
            },
            'central-can-material'
        );

        const canMesh = new THREE.Mesh(canGeometry, canMaterial);
        canMesh.position.set(canPosition.x, canPosition.y, canPosition.z);
        canMesh.castShadow = true;
        canMesh.receiveShadow = true;
        canMesh.name = 'central-burken';

        resourceManager.track(canMesh, 'mesh', 'central-can-mesh');

        builder.scene.add(canMesh);
        builder.arenaObjects.push(canMesh);

        Utils.log('Central Swedish can (Burken) created at arena center');
        return canMesh;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { createCentralCan };
    } else {
        global.ArenaCan = { createCentralCan };
    }
})(typeof window !== 'undefined' ? window : globalThis);