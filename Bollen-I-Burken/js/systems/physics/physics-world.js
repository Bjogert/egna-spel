/* ==========================================
   PHYSICS WORLD MANAGER
   Manages CANNON.World lifecycle and configuration
   KISS: One job - create and manage physics world
   ========================================== */

(function (global) {
    /**
     * PhysicsWorld - Singleton wrapper for CANNON.World
     */
    class PhysicsWorld {
        constructor() {
            if (PhysicsWorld.instance) {
                return PhysicsWorld.instance;
            }

            this.world = null;
            this.initialized = false;

            PhysicsWorld.instance = this;
        }

        /**
         * Initialize the physics world with config settings
         */
        initialize() {
            if (this.initialized) {
                Utils.warn('PhysicsWorld already initialized');
                return;
            }

            Utils.log('Initializing CANNON.World...');

            // Create physics world
            this.world = new CANNON.World();

            // Set gravity (0 in Phase 1 for 2D-style movement)
            this.world.gravity.set(0, CONFIG.physics.gravity, 0);

            // Use SAP Broadphase for better performance
            this.world.broadphase = new CANNON.SAPBroadphase(this.world);

            // Configure solver
            this.world.solver.iterations = CONFIG.physics.iterations;
            this.world.solver.tolerance = CONFIG.physics.tolerance;

            // Default contact material (global friction/restitution)
            const defaultMaterial = new CANNON.Material('default');
            const defaultContactMaterial = new CANNON.ContactMaterial(
                defaultMaterial,
                defaultMaterial,
                {
                    friction: 0.3,
                    restitution: 0.1
                }
            );
            this.world.addContactMaterial(defaultContactMaterial);
            this.world.defaultContactMaterial = defaultContactMaterial;

            // Allow bodies to sleep for performance
            this.world.allowSleep = true;

            this.initialized = true;
            Utils.log('PhysicsWorld initialized successfully');
            Utils.log(`  Gravity: ${CONFIG.physics.gravity}`);
            Utils.log(`  Iterations: ${CONFIG.physics.iterations}`);
            Utils.log(`  Broadphase: SAPBroadphase`);
        }

        /**
         * Step the physics simulation forward
         * @param {number} deltaTime - Time since last frame (seconds)
         */
        step(deltaTime) {
            if (!this.world) return;

            const fixedTimeStep = CONFIG.physics.timeStep;
            const maxSubSteps = CONFIG.physics.maxSubSteps;

            this.world.step(fixedTimeStep, deltaTime, maxSubSteps);
        }

        /**
         * Add a body to the physics world
         * @param {CANNON.Body} body
         */
        addBody(body) {
            if (!this.world) {
                Utils.error('Cannot add body - world not initialized');
                return;
            }

            this.world.addBody(body);
        }

        /**
         * Remove a body from the physics world
         * @param {CANNON.Body} body
         */
        removeBody(body) {
            if (!this.world) return;
            this.world.removeBody(body);
        }

        /**
         * Add a constraint (joint) to the world
         * @param {CANNON.Constraint} constraint
         */
        addConstraint(constraint) {
            if (!this.world) {
                Utils.error('Cannot add constraint - world not initialized');
                return;
            }

            this.world.addConstraint(constraint);
        }

        /**
         * Remove a constraint from the world
         * @param {CANNON.Constraint} constraint
         */
        removeConstraint(constraint) {
            if (!this.world) return;
            this.world.removeConstraint(constraint);
        }

        /**
         * Clear all bodies and constraints from the world
         */
        clear() {
            if (!this.world) return;

            Utils.log('Clearing physics world...');

            // Remove all bodies
            while (this.world.bodies.length > 0) {
                this.world.removeBody(this.world.bodies[0]);
            }

            // Remove all constraints
            while (this.world.constraints.length > 0) {
                this.world.removeConstraint(this.world.constraints[0]);
            }

            Utils.log('Physics world cleared');
        }

        /**
         * Get physics statistics for debugging
         * @returns {Object}
         */
        getStats() {
            if (!this.world) return null;

            return {
                bodyCount: this.world.bodies.length,
                constraintCount: this.world.constraints.length,
                contactCount: this.world.contacts.length,
                sleepingBodies: this.world.bodies.filter(b => b.sleepState === CANNON.Body.SLEEPING).length
            };
        }

        /**
         * Get singleton instance
         * @returns {PhysicsWorld}
         */
        static getInstance() {
            if (!PhysicsWorld.instance) {
                PhysicsWorld.instance = new PhysicsWorld();
            }
            return PhysicsWorld.instance;
        }
    }

    // ==========================================
    // EXPORTS
    // ==========================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PhysicsWorld;
    } else {
        global.PhysicsWorld = PhysicsWorld;
    }
})(typeof window !== 'undefined' ? window : globalThis);
