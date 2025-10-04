/* ==========================================
   ARENA CLEANUP
   Handles resource disposal for arena objects
   ========================================== */

(function (global) {
    function clearArena(builder) {
        const resourceManager = builder.resourceManager;
        Utils.log('Clearing arena using ResourceManager...');

        if (builder.physicsBodies && builder.physicsBodies.length > 0) {
            const physicsSystem = global.physicsSystem;
            builder.physicsBodies.forEach(body => {
                try {
                    if (physicsSystem && body) {
                        physicsSystem.removeBody(body);
                    }
                } catch (error) {
                    console.warn('Failed to remove physics body during arena cleanup', error);
                }
            });
            builder.physicsBodies = [];
        }
        if (!builder.arenaObjects || builder.arenaObjects.length === 0) {
            builder.arenaObjects = [];
            return;
        }

        builder.arenaObjects.forEach(obj => {
            builder.scene.remove(obj);

            if (obj._resourceId && obj._resourceType) {
                resourceManager.disposeByReference(obj);
            } else {
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
            ['geometry', 'material', 'mesh', 'light'].forEach(type => {
                resourceManager.dispose(type, id);
            });
        });

        const obstacleCount = CONFIG.obstacles.count;
        for (let i = 0; i < obstacleCount; i++) {
            const obstacleIds = [
                `obstacle-${i}-geometry`,
                `obstacle-${i}-material`,
                `obstacle-${i}-mesh`
            ];

            obstacleIds.forEach(id => {
                ['geometry', 'material', 'mesh'].forEach(type => {
                    resourceManager.dispose(type, id);
                });
            });
        }

        builder.arenaObjects = [];
        Utils.log('Arena cleared with ResourceManager');
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { clearArena };
    } else {
        global.ArenaCleanup = { clearArena };
    }
})(typeof window !== 'undefined' ? window : globalThis);