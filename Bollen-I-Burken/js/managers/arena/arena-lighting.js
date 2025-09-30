/* ==========================================
   ARENA LIGHTING BUILDER
   ========================================== */

(function (global) {
    function createBasicLighting(builder) {
        const ambientIntensity = CONFIG.graphics.ambientLightIntensity;
        const directionalIntensity = CONFIG.graphics.directionalLightIntensity;
        const shadowMapSize = CONFIG.graphics.shadowMapSize;
        const enableShadows = CONFIG.graphics.shadows;
        const resourceManager = builder.resourceManager;

        const ambientLight = new THREE.AmbientLight(0x404040, ambientIntensity);
        resourceManager.track(ambientLight, 'light', 'arena-ambient-light');
        builder.scene.add(ambientLight);
        builder.arenaObjects.push(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, directionalIntensity);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = enableShadows;

        directionalLight.shadow.mapSize.width = shadowMapSize;
        directionalLight.shadow.mapSize.height = shadowMapSize;

        const shadowBounds = builder.arenaSize + 5;
        directionalLight.shadow.camera.left = -shadowBounds;
        directionalLight.shadow.camera.right = shadowBounds;
        directionalLight.shadow.camera.top = shadowBounds;
        directionalLight.shadow.camera.bottom = -shadowBounds;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 50;

        resourceManager.track(directionalLight, 'light', 'arena-directional-light');
        builder.scene.add(directionalLight);
        builder.arenaObjects.push(directionalLight);

        Utils.log('Arena lighting created with ResourceManager tracking');
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { createBasicLighting };
    } else {
        global.ArenaLighting = { createBasicLighting };
    }
})(typeof window !== 'undefined' ? window : globalThis);