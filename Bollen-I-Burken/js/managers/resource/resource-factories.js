/* ==========================================
   RESOURCE FACTORY HELPERS
   Registers default Three.js resource factories
   ========================================== */

(function (global) {
    function registerDefaultFactories(manager) {
        if (!manager || !manager.factories) {
            return;
        }

        manager.factories.set('geometry', {
            box: (width, height, depth) => new THREE.BoxGeometry(width, height, depth),
            plane: (width, height) => new THREE.PlaneGeometry(width, height),
            sphere: (radius, segments) => new THREE.SphereGeometry(radius, segments || 32),
            cylinder: (radiusTop, radiusBottom, height, segments) => new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments || 8)
        });

        manager.factories.set('material', {
            lambert: (params) => new THREE.MeshLambertMaterial(params),
            basic: (params) => new THREE.MeshBasicMaterial(params),
            standard: (params) => new THREE.MeshStandardMaterial(params)
        });
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { registerDefaultFactories };
    } else {
        global.ResourceFactories = { registerDefaultFactories };
    }
})(typeof window !== 'undefined' ? window : globalThis);