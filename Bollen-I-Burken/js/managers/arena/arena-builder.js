/* ==========================================
   ARENA BUILDER
   Coordinates arena creation using helper modules
   ========================================== */

(function (global) {
    class ArenaBuilder {
        constructor(scene) {
            this.scene = scene;
            this.resourceManager = ResourceManager.getInstance();

            this.arenaSize = CONFIG.arena.size;
            this.wallHeight = CONFIG.arena.wallHeight;
            this.wallThickness = CONFIG.arena.wallThickness;
            this.floorColor = CONFIG.arena.floorColor;
            this.wallColor = CONFIG.arena.wallColor;

            this.arenaObjects = [];
            this.physicsBodies = [];

            Utils.log('ArenaBuilder initialized with simple config');
        }

        createBasicArena() {
            Utils.log('Creating simple square arena...');
            this.clearArena();
            ArenaFloor.createSquareArenaFloor(this);
            ArenaWalls.createSquareArenaWalls(this);
            ArenaLighting.createBasicLighting(this);
            Utils.log('Simple square arena created');
        }

        createSquareArenaFloor() {
            ArenaFloor.createSquareArenaFloor(this);
        }

        createSquareArenaWalls() {
            ArenaWalls.createSquareArenaWalls(this);
        }

        createBasicLighting() {
            ArenaLighting.createBasicLighting(this);
        }

        createCentralCan() {
            return ArenaCan.createCentralCan(this);
        }

        createRandomObstacles() {
            return ArenaObstacles.createRandomObstacles(this);
        }

        registerPhysicsBody(body) {
            Utils.log(`Registering arena physics body id: ${body ? body.id : "n/a"}`);
            if (body) {
                Utils.log(`  group=${body.collisionFilterGroup}, mask=${body.collisionFilterMask}, type=${body.type}, mass=${body.mass}`);
            }
            if (!body || !CONFIG.physics || !CONFIG.physics.enabled) {
                return;
            Utils.log('Skipping physics body registration - physics disabled or body missing.');
            }

            try {
                if (global.physicsSystem && typeof global.physicsSystem.addBody === 'function') {
                    global.physicsSystem.addBody(body);
                }
            } catch (error) {
                console.warn('Failed to add physics body to world', error);
            }

            Utils.log(`Registered arena physics body id=${body.id}`);
            if (!this.physicsBodies) {
                this.physicsBodies = [];
            }
            this.physicsBodies.push(body);
        }
        clearArena() {
            ArenaCleanup.clearArena(this);
        }

        randomBetween(min, max) {
            return ArenaHelpers.randomBetween(this, min, max);
        }

        generateRandomPosition(size, canExclusionRadius, minDistanceFromWalls) {
            return ArenaHelpers.generateRandomPosition(this, size, canExclusionRadius, minDistanceFromWalls);
        }

        getDistanceFromCenter(position) {
            return ArenaHelpers.getDistanceFromCenter(this, position);
        }

        isValidObstaclePosition(position, size, existingPositions, minDistance) {
            return ArenaHelpers.isValidObstaclePosition(this, position, size, existingPositions, minDistance);
        }

        getArenaInfo() {
            return {
                size: this.arenaSize,
                objectCount: this.arenaObjects.length,
                center: { x: 0, y: 0, z: 0 },
                bounds: {
                    min: { x: -this.arenaSize, z: -this.arenaSize },
                    max: { x: this.arenaSize, z: this.arenaSize }
                }
            };
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { ArenaBuilder };
    } else {
        global.GameArena = { ArenaBuilder };
        global.ArenaBuilder = ArenaBuilder;
    }
})(typeof window !== 'undefined' ? window : globalThis);
