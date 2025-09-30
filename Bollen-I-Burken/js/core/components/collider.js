/* ==========================================
   CORE COMPONENT - COLLIDER
   ========================================== */

(function (global) {
    class Collider {
        constructor(type = 'box', bounds = null) {
            this.type = type;
            this.bounds = bounds || { width: 1, height: 1, depth: 1 };

            // Collision behavior flags
            this.isStatic = true;
            this.blockMovement = true;
            this.blockVision = true;
            this.allowSliding = true;

            // Simple caching for repeated collision checks
            this.lastCollisionCheck = 0;
            this.collisionCacheMs = 16;
        }

        containsPoint(point, entityPosition) {
            if (this.type !== 'box') {
                return false;
            }

            const halfWidth = this.bounds.width / 2;
            const halfDepth = this.bounds.depth / 2;
            const halfHeight = this.bounds.height / 2;

            return (
                point.x >= entityPosition.x - halfWidth &&
                point.x <= entityPosition.x + halfWidth &&
                point.z >= entityPosition.z - halfDepth &&
                point.z <= entityPosition.z + halfDepth &&
                point.y >= entityPosition.y - halfHeight &&
                point.y <= entityPosition.y + halfHeight
            );
        }

        checkBoxCollision(posA, boundsA, posB, boundsB) {
            const halfWidthA = boundsA.width / 2;
            const halfDepthA = boundsA.depth / 2;
            const halfWidthB = boundsB.width / 2;
            const halfDepthB = boundsB.depth / 2;

            return (
                Math.abs(posA.x - posB.x) < (halfWidthA + halfWidthB) &&
                Math.abs(posA.z - posB.z) < (halfDepthA + halfDepthB) &&
                Math.abs(posA.y - posB.y) < (boundsA.height / 2 + boundsB.height / 2)
            );
        }

        calculateSlideResponse(oldPos, newPos, entityBounds, obstaclePos) {
            if (!this.allowSliding) return oldPos;

            const entityHalfWidth = entityBounds.width / 2;
            const entityHalfDepth = entityBounds.depth / 2;
            const obstacleHalfWidth = this.bounds.width / 2;
            const obstacleHalfDepth = this.bounds.depth / 2;

            const overlapX = (entityHalfWidth + obstacleHalfWidth) - Math.abs(newPos.x - obstaclePos.x);
            const overlapZ = (entityHalfDepth + obstacleHalfDepth) - Math.abs(newPos.z - obstaclePos.z);

            const correctedPos = { ...newPos };

            if (overlapX < overlapZ) {
                if (newPos.x > obstaclePos.x) {
                    correctedPos.x = obstaclePos.x + obstacleHalfWidth + entityHalfWidth + 0.01;
                } else {
                    correctedPos.x = obstaclePos.x - obstacleHalfWidth - entityHalfWidth - 0.01;
                }
            } else {
                if (newPos.z > obstaclePos.z) {
                    correctedPos.z = obstaclePos.z + obstacleHalfDepth + entityHalfDepth + 0.01;
                } else {
                    correctedPos.z = obstaclePos.z - obstacleHalfDepth - entityHalfDepth - 0.01;
                }
            }

            return correctedPos;
        }
    }

    global.Collider = Collider;
})(typeof window !== 'undefined' ? window : globalThis);