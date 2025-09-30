/* ==========================================
   MOVEMENT SYSTEM
   Handles player and AI movement plus collision checks
   ========================================== */

(function (global) {
    class MovementSystem extends System {
        constructor() {
            super('MovementSystem');
            this.moveSpeed = 0.15;
            this.arenaSize = CONFIG.arena.size;

            this.staticColliders = [];
            this.playerBounds = { width: 0.8, height: 1.0, depth: 0.8 };
            this.aiBounds = { width: 0.9, height: 1.1, depth: 0.9 };
        }

        update(gameState) {
            if (!gameState || gameState.gamePhase !== GAME_STATES.PLAYING) {
                return;
            }

            this.collectStaticColliders(gameState);

            for (const entity of gameState.entities.values()) {
                const transform = entity.getComponent('Transform');
                const input = entity.getComponent('PlayerInput');

                if (transform && input) {
                    this.updatePlayerMovement(transform, input);
                } else if (transform && entity.getComponent('AIHunter')) {
                    this.updateAIMovement(transform);
                }

                const renderable = entity.getComponent('Renderable');
                if (transform && renderable && renderable.mesh) {
                    renderable.mesh.position.set(
                        transform.position.x,
                        transform.position.y,
                        transform.position.z
                    );
                    renderable.mesh.rotation.y = transform.rotation.y;

                    if (renderable.mesh.visionConeMesh) {
                        renderable.mesh.visionConeMesh.position.set(
                            transform.position.x,
                            transform.position.y,
                            transform.position.z
                        );
                        renderable.mesh.visionConeMesh.rotation.y = transform.rotation.y;

                        const visionCone = entity.getComponent('VisionCone');
                        if (visionCone && renderable.mesh.visionConeMesh.material) {
                            if (visionCone.canSeePlayer) {
                                renderable.mesh.visionConeMesh.material.color.setHex(0xff0000);
                                renderable.mesh.visionConeMesh.material.opacity = 0.9;
                                renderable.mesh.visionConeMesh.material.linewidth = 3;
                            } else {
                                renderable.mesh.visionConeMesh.material.color.setHex(0xffaa00);
                                renderable.mesh.visionConeMesh.material.opacity = 0.4;
                                renderable.mesh.visionConeMesh.material.linewidth = 1;
                            }
                        }
                    }
                }
            }
        }

        updatePlayerMovement(transform, input) {
            if (transform.updatePrevious) {
                transform.updatePrevious();
            } else {
                transform.previousPosition = { ...transform.position };
            }

            transform.velocity.x = 0;
            transform.velocity.y = 0;
            transform.velocity.z = 0;

            const speed = this.moveSpeed;

            if (input.keys.forward) transform.velocity.z -= speed;
            if (input.keys.backward) transform.velocity.z += speed;
            if (input.keys.left) transform.velocity.x -= speed;
            if (input.keys.right) transform.velocity.x += speed;

            transform.position.x += transform.velocity.x;
            transform.position.z += transform.velocity.z;

            const newPosition = {
                x: transform.position.x,
                y: transform.position.y,
                z: transform.position.z
            };

            const correctedPosition = this.checkObstacleCollision(
                transform.previousPosition || transform.position,
                newPosition,
                this.playerBounds
            );

            transform.position.x = correctedPosition.x;
            transform.position.z = correctedPosition.z;

            const limit = this.arenaSize - 0.5;
            transform.position.x = Math.max(-limit, Math.min(limit, transform.position.x));
            transform.position.z = Math.max(-limit, Math.min(limit, transform.position.z));

            if (transform.velocity.x !== 0 || transform.velocity.z !== 0) {
                transform.rotation.y = Math.atan2(transform.velocity.x, transform.velocity.z);
            }
        }

        updateAIMovement(transform) {
            if (transform.updatePrevious) {
                transform.updatePrevious();
            } else {
                transform.previousPosition = { ...transform.position };
            }

            transform.position.x += transform.velocity.x;
            transform.position.z += transform.velocity.z;

            const newPosition = {
                x: transform.position.x,
                y: transform.position.y,
                z: transform.position.z
            };

            const correctedPosition = this.checkObstacleCollision(
                transform.previousPosition || transform.position,
                newPosition,
                this.aiBounds
            );

            transform.position.x = correctedPosition.x;
            transform.position.z = correctedPosition.z;

            const limit = this.arenaSize - 0.5;
            transform.position.x = Math.max(-limit, Math.min(limit, transform.position.x));
            transform.position.z = Math.max(-limit, Math.min(limit, transform.position.z));

            if (transform.velocity.x !== 0 || transform.velocity.z !== 0) {
                transform.rotation.y = Math.atan2(transform.velocity.x, transform.velocity.z);
            }
        }

        collectStaticColliders(gameState) {
            this.staticColliders = [];

            for (const entity of gameState.entities.values()) {
                const collider = entity.getComponent('Collider');
                const transform = entity.getComponent('Transform');

                if (collider && transform && collider.isStatic && collider.blockMovement) {
                    this.staticColliders.push({ entity, collider, transform });
                }
            }
        }

        checkObstacleCollision(oldPos, newPos, entityBounds) {
            if (this.staticColliders.length === 0) {
                return newPos;
            }

            const maxCorrectionAttempts = 3;
            let correctedPos = { ...newPos };
            let attempts = 0;

            for (const obstacle of this.staticColliders) {
                if (attempts >= maxCorrectionAttempts) {
                    console.warn('Collision correction limit reached, using original position');
                    return oldPos;
                }

                const obstaclePos = obstacle.transform.position;
                const obstacleCollider = obstacle.collider;

                if (obstacleCollider.type === 'box') {
                    const collision = obstacleCollider.checkBoxCollision(
                        correctedPos,
                        entityBounds,
                        obstaclePos,
                        obstacleCollider.bounds
                    );

                    if (collision) {
                        attempts++;

                        const slideResponse = obstacleCollider.calculateSlideResponse(
                            oldPos,
                            correctedPos,
                            entityBounds,
                            obstaclePos
                        );

                        if (slideResponse &&
                            !isNaN(slideResponse.x) && !isNaN(slideResponse.z) &&
                            isFinite(slideResponse.x) && isFinite(slideResponse.z)) {
                            correctedPos = slideResponse;
                        } else {
                            console.warn('Invalid slide response, using old position');
                            return oldPos;
                        }

                        if (global.DEBUG) {
                            console.log('Collision detected and corrected:', {
                                attempt: attempts,
                                oldPos: oldPos,
                                newPos: newPos,
                                correctedPos: correctedPos,
                                obstaclePos: obstaclePos
                            });
                        }
                    }
                }
            }

            return correctedPos;
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = MovementSystem;
    } else {
        global.GameSystems = global.GameSystems || {};
        global.GameSystems.MovementSystem = MovementSystem;
        global.MovementSystem = MovementSystem;
    }
})(typeof window !== 'undefined' ? window : globalThis);