/* ==========================================
   PLAYER FACTORY
   Builds player entities and meshes
   ========================================== */

(function (global) {
    class PlayerFactory {
        static createPlayer(scene, playerId, isLocal = false, color = 0x00ff00) {
            const geometry = new THREE.BoxGeometry(0.8, 1.0, 0.8);
            const material = new THREE.MeshLambertMaterial({
                color: color,
                transparent: true,
                opacity: 0.9
            });
            const mesh = new THREE.Mesh(geometry, material);

            mesh.castShadow = true;
            mesh.receiveShadow = false;
            scene.add(mesh);

            const entity = new Entity(playerId);
            entity.addComponent(new Transform(0, 0.5, 0));
            entity.addComponent(new Renderable(mesh));
            entity.addComponent(new Player(playerId, isLocal));

            // Add physics body (GUBBAR Phase 1)
            if (CONFIG.physics.enabled && typeof BodyFactory !== 'undefined' && global.physicsSystem) {
                const physicsBody = BodyFactory.createPlayerBody({ x: 0, y: 0.5, z: 0 });
                global.physicsSystem.addBody(physicsBody);
                entity.addComponent(new PhysicsBody(physicsBody));
                Utils.log(`  Physics body added to player ${playerId}`);
            }

            if (isLocal) {
                entity.addComponent(new PlayerInput());
                material.color.setHex(0x00ff00);
                material.emissive.setHex(0x002200);
            } else {
                material.color.setHex(color);
            }

            Utils.log(`Created player: ${playerId} (local: ${isLocal})`);
            return entity;
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PlayerFactory;
    } else {
        global.GameManagers = global.GameManagers || {};
        global.GameManagers.PlayerFactory = PlayerFactory;
        global.PlayerFactory = PlayerFactory;
    }
})(typeof window !== 'undefined' ? window : globalThis);