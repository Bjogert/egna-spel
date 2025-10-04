/* ==========================================
   CORE GAME STATE MANAGER
   ========================================== */

(function (global) {
    class GameState {
        constructor() {
            this.entities = new Map();
            this.nextEntityId = 1;
            this.currentTick = 0;
            this.players = new Map(); // playerId -> entityId
            this.localPlayerId = null;
            this.gamePhase = GAME_STATES.START_MENU;
            this.startTime = Utils.now();
        }

        createEntity() {
            // Use simple Entity - no validation overhead (KISS)
            const entity = new Entity(this.nextEntityId++);
            this.entities.set(entity.id, entity);
            Utils.log(`Created entity ${entity.id}`);
            return entity;
        }

        getEntity(id) {
            return this.entities.get(id);
        }

        removeEntity(id) {
            const entity = this.entities.get(id);
            if (entity) {
                entity.destroy();
                this.entities.delete(id);
                Utils.log(`Removed entity ${id}`);
            }
        }

        addPlayer(playerId, isLocal = false) {
            const playerEntity = this.createEntity();

            // Add core components (use config spawn position to avoid spawning in can) - v2
            const spawnPos = CONFIG.player.spawnPosition;
            Utils.log(`Creating player at spawn position: (${spawnPos.x}, ${spawnPos.y}, ${spawnPos.z})`);
            playerEntity.addComponent(new Transform(spawnPos.x, spawnPos.y, spawnPos.z));
            playerEntity.addComponent(new Player(playerId, isLocal));
            playerEntity.addComponent(new Movement(0.1)); // Player movement speed

            if (isLocal) {
                playerEntity.addComponent(new PlayerInput());
                this.localPlayerId = playerId;
            }

            // Add physics body (GUBBAR Phase 1)
            if (CONFIG.physics.enabled && typeof BodyFactory !== 'undefined' && global.physicsSystem) {
                const transform = playerEntity.getComponent('Transform');
                const spawnPos = {
                    x: transform.position.x,
                    y: transform.position.y,
                    z: transform.position.z
                };
                const playerPhysicsBody = BodyFactory.createPlayerBody(spawnPos);
                global.physicsSystem.addBody(playerPhysicsBody);
                playerEntity.addComponent(new PhysicsBody(playerPhysicsBody));
                Utils.log(`Physics body added to player ${playerId} at (${spawnPos.x}, ${spawnPos.y}, ${spawnPos.z}): group=1, mask=12`);
            }

            this.players.set(playerId, playerEntity.id);
            Utils.log(`Added player ${playerId} (local: ${isLocal})`);
            return playerEntity;
        }

        removePlayer(playerId) {
            const entityId = this.players.get(playerId);
            if (entityId) {
                this.removeEntity(entityId);
                this.players.delete(playerId);
                Utils.log(`Removed player ${playerId}`);
            }
        }

        getPlayerEntity(playerId) {
            const entityId = this.players.get(playerId);
            return entityId ? this.getEntity(entityId) : null;
        }

        getLocalPlayer() {
            return this.localPlayerId ? this.getPlayerEntity(this.localPlayerId) : null;
        }

        getAllPlayers() {
            const players = [];
            for (const [playerId, entityId] of this.players) {
                const entity = this.getEntity(entityId);
                if (entity && entity.active) {
                    players.push(entity);
                }
            }
            return players;
        }

        setGamePhase(phase) {
            Utils.log(`Game phase: ${this.gamePhase} -> ${phase}`);
            this.gamePhase = phase;
        }

        getGameTime() {
            return Utils.now() - this.startTime;
        }
    }

    global.GameState = GameState;
})(typeof window !== 'undefined' ? window : globalThis);