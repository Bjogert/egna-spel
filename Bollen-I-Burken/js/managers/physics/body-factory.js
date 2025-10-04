/* ==========================================
   BODY FACTORY
   Helper functions to create CANNON physics bodies
   KISS: Simple factory functions for common shapes
   ========================================== */

(function (global) {
    const BodyFactory = {
        /**
         * Create a box-shaped physics body (for characters and obstacles)
         * @param {Object} options - Configuration
         * @returns {CANNON.Body}
         */
        createBoxBody(options = {}) {
            const {
                width = 0.8,
                height = 1.0,
                depth = 0.8,
                mass = 70,
                position = { x: 0, y: 0.5, z: 0 },
                bodyType = 'player'
            } = options;

            // Create box shape (half-extents)
            const shape = new CANNON.Box(new CANNON.Vec3(
                width / 2,
                height / 2,
                depth / 2
            ));

            // Get collision configuration
            const collisionConfig = CollisionGroups.getConfig(bodyType);

            // Create physics body
            const body = new CANNON.Body({
                mass: mass,
                shape: shape,
                position: new CANNON.Vec3(position.x, position.y, position.z),
                linearDamping: options.linearDamping || CONFIG.physics.player.linearDamping,
                angularDamping: options.angularDamping || CONFIG.physics.player.angularDamping,
                collisionFilterGroup: collisionConfig.group,
                collisionFilterMask: collisionConfig.mask,
                fixedRotation: options.fixedRotation !== undefined ? options.fixedRotation : true,
                sleepSpeedLimit: options.sleepSpeedLimit || CONFIG.physics.player.sleepSpeedLimit
            });

            // Disable sleeping for player/AI to prevent getting stuck
            body.allowSleep = options.allowSleep !== undefined ? options.allowSleep : CONFIG.physics.player.allowSleep;

            Utils.log(`Created ${bodyType} body: group=${collisionConfig.group}, mask=${collisionConfig.mask}, mass=${mass}, allowSleep=${body.allowSleep}`);

            return body;
        },

        /**
         * Create a sphere-shaped physics body (for heads, balls, etc.)
         * @param {Object} options - Configuration
         * @returns {CANNON.Body}
         */
        createSphereBody(options = {}) {
            const {
                radius = 0.5,
                mass = 10,
                position = { x: 0, y: 0.5, z: 0 },
                bodyType = 'player'
            } = options;

            const shape = new CANNON.Sphere(radius);
            const collisionConfig = CollisionGroups.getConfig(bodyType);

            const body = new CANNON.Body({
                mass: mass,
                shape: shape,
                position: new CANNON.Vec3(position.x, position.y, position.z),
                linearDamping: options.linearDamping || 0.1,
                angularDamping: options.angularDamping || 0.1,
                collisionFilterGroup: collisionConfig.group,
                collisionFilterMask: collisionConfig.mask
            });

            return body;
        },

        /**
         * Create a cylinder-shaped physics body (for limbs, trees, etc.)
         * @param {Object} options - Configuration
         * @returns {CANNON.Body}
         */
        createCylinderBody(options = {}) {
            const {
                radiusTop = 0.1,
                radiusBottom = 0.1,
                height = 1.0,
                numSegments = 8,
                mass = 5,
                position = { x: 0, y: 0.5, z: 0 },
                bodyType = 'obstacle'
            } = options;

            const shape = new CANNON.Cylinder(radiusTop, radiusBottom, height, numSegments);
            const collisionConfig = CollisionGroups.getConfig(bodyType);

            const body = new CANNON.Body({
                mass: mass,
                shape: shape,
                position: new CANNON.Vec3(position.x, position.y, position.z),
                linearDamping: options.linearDamping || 0.1,
                angularDamping: options.angularDamping || 0.1,
                collisionFilterGroup: collisionConfig.group,
                collisionFilterMask: collisionConfig.mask
            });

            return body;
        },

        /**
         * Create a static (immovable) box body (for obstacles, walls)
         * @param {Object} options - Configuration
         * @returns {CANNON.Body}
         */
        createStaticBox(options = {}) {
            const {
                width = 1.0,
                height = 1.0,
                depth = 1.0,
                position = { x: 0, y: 0.5, z: 0 },
                bodyType = 'obstacle'
            } = options;

            const shape = new CANNON.Box(new CANNON.Vec3(
                width / 2,
                height / 2,
                depth / 2
            ));

            const collisionConfig = CollisionGroups.getConfig(bodyType);

            const body = new CANNON.Body({
                mass: 0,  // Static (infinite mass)
                shape: shape,
                position: new CANNON.Vec3(position.x, position.y, position.z),
                collisionFilterGroup: collisionConfig.group,
                collisionFilterMask: collisionConfig.mask,
                type: CANNON.Body.STATIC  // Explicitly mark as static
            });

            return body;
        },

        /**
         * Create a player physics body using config settings
         * @param {Object} position - {x, y, z}
         * @returns {CANNON.Body}
         */
        createPlayerBody(position) {
            return this.createBoxBody({
                width: CONFIG.physics.player.radius * 2,
                height: CONFIG.physics.player.height,
                depth: CONFIG.physics.player.radius * 2,
                mass: CONFIG.physics.player.mass,
                position: position,
                bodyType: 'player',
                linearDamping: CONFIG.physics.player.linearDamping,
                angularDamping: CONFIG.physics.player.angularDamping,
                fixedRotation: CONFIG.physics.player.fixedRotation,
                sleepSpeedLimit: CONFIG.physics.player.sleepSpeedLimit
            });
        },

        /**
         * Create an AI hunter physics body using config settings
         * @param {Object} position - {x, y, z}
         * @returns {CANNON.Body}
         */
        createAIBody(position) {
            return this.createBoxBody({
                width: CONFIG.physics.ai.radius * 2,
                height: CONFIG.physics.ai.height,
                depth: CONFIG.physics.ai.radius * 2,
                mass: CONFIG.physics.ai.mass,
                position: position,
                bodyType: 'ai',
                linearDamping: CONFIG.physics.ai.linearDamping,
                angularDamping: CONFIG.physics.ai.angularDamping,
                fixedRotation: CONFIG.physics.ai.fixedRotation,
                sleepSpeedLimit: CONFIG.physics.ai.sleepSpeedLimit
            });
        }
    };

    // ==========================================
    // EXPORTS
    // ==========================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = BodyFactory;
    } else {
        global.BodyFactory = BodyFactory;
    }

    Utils.log('BodyFactory loaded - Physics body creation helpers ready');
})(typeof window !== 'undefined' ? window : globalThis);


