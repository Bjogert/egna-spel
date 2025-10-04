/* ==========================================
   PHYSICS SYNC
   Syncs ECS Transform components from physics bodies
   KISS: One job - copy position/velocity from physics to ECS
   ========================================== */

(function (global) {
    /**
     * PhysicsSync - Synchronizes ECS components with physics bodies
     */
    class PhysicsSync {
        constructor() {
            this.syncCount = 0;

            const defaultTickRate = (CONFIG.game && CONFIG.game.tickRate) || 60;
            const fallbackTimeStep = 1 / defaultTickRate;
            const configuredTimeStep = CONFIG.physics && CONFIG.physics.timeStep;
            this.timeStep = (configuredTimeStep && configuredTimeStep > 0) ? configuredTimeStep : fallbackTimeStep;
        }

        /**
         * Update all entities - sync Transform from PhysicsBody
         * @param {GameState} gameState - ECS game state
         */
        update(gameState) {
            if (!gameState || !gameState.entities) return;

            this.syncCount = 0;

            for (const entity of gameState.entities.values()) {
                const physicsBody = entity.getComponent('PhysicsBody');
                const transform = entity.getComponent('Transform');

                if (physicsBody && physicsBody.body && transform) {
                    this.syncEntityTransform(physicsBody, transform);
                    this.syncCount++;
                }
            }
        }

        /**
         * Sync a single entity's Transform from its PhysicsBody
         * @param {PhysicsBody} physicsBody - Physics body component
         * @param {Transform} transform - Transform component
         */
        syncEntityTransform(physicsBody, transform) {
            const body = physicsBody.body;

            // Copy position (physics is source of truth)
            transform.position.x = body.position.x;
            transform.position.y = body.position.y;
            transform.position.z = body.position.z;

            // Copy velocity
            const perTickFactor = this.timeStep;
            transform.velocity.x = body.velocity.x * perTickFactor;
            transform.velocity.y = body.velocity.y * perTickFactor;
            transform.velocity.z = body.velocity.z * perTickFactor;
            // Only sync rotation for entities without fixedRotation
            // (AI and player control their own rotation via steering/input)
            if (!body.fixedRotation) {
                const quaternion = body.quaternion;
                const euler = this.quaternionToEuler(quaternion);
                transform.rotation.y = euler.y;
            }

            // Update sleeping state
            physicsBody.isSleeping = body.sleepState === CANNON.Body.SLEEPING;
        }

        /**
         * Convert CANNON quaternion to euler angles
         * @param {CANNON.Quaternion} quaternion
         * @returns {{x: number, y: number, z: number}}
         */
        quaternionToEuler(quaternion) {
            // Convert cannon quaternion to THREE quaternion
            const threeQuat = new THREE.Quaternion(
                quaternion.x,
                quaternion.y,
                quaternion.z,
                quaternion.w
            );

            // Convert to euler angles
            const euler = new THREE.Euler().setFromQuaternion(threeQuat, 'YXZ');

            return {
                x: euler.x,
                y: euler.y,
                z: euler.z
            };
        }

        /**
         * Get number of entities synced last frame
         * @returns {number}
         */
        getSyncCount() {
            return this.syncCount;
        }
    }

    // ==========================================
    // EXPORTS
    // ==========================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PhysicsSync;
    } else {
        global.PhysicsSync = PhysicsSync;
    }
})(typeof window !== 'undefined' ? window : globalThis);

