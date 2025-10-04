/* ==========================================
   PHYSICS SYSTEM
   Main ECS system for physics simulation
   KISS: Orchestrates PhysicsWorld + PhysicsSync
   ========================================== */

(function (global) {
    /**
     * PhysicsSystem - Main physics system
     * Extends base System class
     */
    class PhysicsSystem extends System {
        constructor() {
            super('physics');

            this.physicsWorld = null;
            this.physicsSync = null;
            this.enabled = CONFIG.physics.enabled;

            // Performance tracking
            this.physicsTime = 0;
            this.frameCount = 0;
        }

        /**
         * Initialize the physics system
         * Called once during game setup
         */
        initialize() {
            if (!this.enabled) {
                Utils.log('PhysicsSystem disabled in config');
                return;
            }

            Utils.log('Initializing PhysicsSystem...');

            // Create physics world
            this.physicsWorld = PhysicsWorld.getInstance();
            this.physicsWorld.initialize();

            // Create physics sync
            this.physicsSync = new PhysicsSync();

            Utils.log('PhysicsSystem initialized successfully');
        }

        /**
         * Update physics simulation
         * @param {GameState} gameState - ECS game state
         * @param {number} deltaTime - Time since last frame (milliseconds)
         */
        update(gameState, deltaTime) {
            if (!this.enabled || !this.physicsWorld || !this.physicsSync) {
                return;
            }

            // Track performance
            const startTime = performance.now();

            // Step physics world using seconds (game tick provides milliseconds)
            const deltaSeconds = Number.isFinite(deltaTime)
                ? Math.max(deltaTime / 1000, 0)
                : CONFIG.physics.timeStep;
            this.physicsWorld.step(deltaSeconds);
            // Sync Transform components from physics bodies
            this.physicsSync.update(gameState);

            // Update performance stats
            this.physicsTime = performance.now() - startTime;
            this.frameCount++;

            // Log stats every 5 seconds (if debug enabled)
            if (CONFIG.physics.debug.showStats && this.frameCount % 300 === 0) {
                this.logStats();
            }
        }

        /**
         * Add a physics body to the world
         * @param {CANNON.Body} body
         */
        addBody(body) {
            if (this.physicsWorld) {
                this.physicsWorld.addBody(body);
            }
        }

        /**
         * Remove a physics body from the world
         * @param {CANNON.Body} body
         */
        removeBody(body) {
            if (this.physicsWorld) {
                this.physicsWorld.removeBody(body);
            }
        }

        /**
         * Add a constraint (joint) to the world
         * @param {CANNON.Constraint} constraint
         */
        addConstraint(constraint) {
            if (this.physicsWorld) {
                this.physicsWorld.addConstraint(constraint);
            }
        }

        /**
         * Clear all physics bodies and constraints
         */
        clear() {
            if (this.physicsWorld) {
                this.physicsWorld.clear();
            }
        }

        /**
         * Log physics statistics
         */
        logStats() {
            if (!this.physicsWorld) return;

            const stats = this.physicsWorld.getStats();
            const syncCount = this.physicsSync.getSyncCount();

            Utils.log('=== Physics Stats ===');
            Utils.log(`  Bodies: ${stats.bodyCount}`);
            Utils.log(`  Sleeping: ${stats.sleepingBodies}`);
            Utils.log(`  Constraints: ${stats.constraintCount}`);
            Utils.log(`  Contacts: ${stats.contactCount}`);
            Utils.log(`  Synced Entities: ${syncCount}`);
            Utils.log(`  Physics Time: ${this.physicsTime.toFixed(2)}ms`);
        }

        /**
         * Get physics world instance (for external access)
         * @returns {PhysicsWorld}
         */
        getWorld() {
            return this.physicsWorld;
        }

        /**
         * Get performance time (milliseconds spent on physics last frame)
         * @returns {number}
         */
        getPhysicsTime() {
            return this.physicsTime;
        }
    }

    // ==========================================
    // EXPORTS
    // ==========================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PhysicsSystem;
    } else {
        global.PhysicsSystem = PhysicsSystem;
    }
})(typeof window !== 'undefined' ? window : globalThis);


