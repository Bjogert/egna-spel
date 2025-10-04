/* ==========================================
   PHYSICS BODY COMPONENT
   Links ECS entity to cannon-es physics body
   ========================================== */

(function (global) {
    /**
     * PhysicsBody Component
     * Wraps a CANNON.Body and provides helper methods
     */
    class PhysicsBody {
        constructor(cannonBody, options = {}) {
            this.name = 'PhysicsBody';
            this.body = cannonBody;  // CANNON.Body instance

            // Collision properties
            this.collisionGroup = options.collisionGroup || 1;
            this.collisionMask = options.collisionMask || -1;

            // Apply collision filters to body
            if (this.body) {
                this.body.collisionFilterGroup = this.collisionGroup;
                this.body.collisionFilterMask = this.collisionMask;
            }

            // Metadata
            this.isKinematic = options.isKinematic || false;  // Controlled by code, not physics
            this.isSleeping = false;

            Utils.log(`PhysicsBody component created with group ${this.collisionGroup}`);
        }

        /**
         * Apply force at world point
         * @param {Object} force - {x, y, z}
         * @param {Object} worldPoint - Optional {x, y, z}, defaults to center of mass
         */
        applyForce(force, worldPoint = null) {
            if (!this.body) return;

            const cannonForce = new CANNON.Vec3(force.x || 0, force.y || 0, force.z || 0);
            const point = worldPoint
                ? new CANNON.Vec3(worldPoint.x, worldPoint.y, worldPoint.z)
                : this.body.position;

            this.body.applyForce(cannonForce, point);
        }

        /**
         * Apply impulse (instant velocity change)
         * @param {Object} impulse - {x, y, z}
         * @param {Object} worldPoint - Optional {x, y, z}
         */
        applyImpulse(impulse, worldPoint = null) {
            if (!this.body) return;

            const cannonImpulse = new CANNON.Vec3(impulse.x || 0, impulse.y || 0, impulse.z || 0);
            const point = worldPoint
                ? new CANNON.Vec3(worldPoint.x, worldPoint.y, worldPoint.z)
                : this.body.position;

            this.body.applyImpulse(cannonImpulse, point);
        }

        /**
         * Set velocity directly (use sparingly, forces are better)
         * @param {Object} velocity - {x, y, z}
         */
        setVelocity(velocity) {
            if (!this.body) return;
            this.body.velocity.set(
                velocity.x || 0,
                velocity.y || 0,
                velocity.z || 0
            );
        }

        /**
         * Get current velocity as simple object
         * @returns {{x: number, y: number, z: number}}
         */
        getVelocity() {
            if (!this.body) return { x: 0, y: 0, z: 0 };
            return {
                x: this.body.velocity.x,
                y: this.body.velocity.y,
                z: this.body.velocity.z
            };
        }

        /**
         * Wake up the physics body (if sleeping)
         */
        wakeUp() {
            if (this.body) {
                this.body.wakeUp();
                this.isSleeping = false;
            }
        }

        /**
         * Put body to sleep (stops simulation for performance)
         */
        sleep() {
            if (this.body) {
                this.body.sleep();
                this.isSleeping = true;
            }
        }

        /**
         * Get position as simple object
         * @returns {{x: number, y: number, z: number}}
         */
        getPosition() {
            if (!this.body) return { x: 0, y: 0, z: 0 };
            return {
                x: this.body.position.x,
                y: this.body.position.y,
                z: this.body.position.z
            };
        }
    }

    // ==========================================
    // EXPORTS
    // ==========================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PhysicsBody;
    } else {
        global.PhysicsBody = PhysicsBody;
    }
})(typeof window !== 'undefined' ? window : globalThis);
