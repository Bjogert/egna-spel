/* ==========================================
   GAME LIFECYCLE MANAGER
   Handles round initialization, cleanup, and game over
   ========================================== */

(function (global) {
    class GameLifecycle {
        constructor() {
            this.arenaBuilder = null;
            this.playerManager = null;
            this.localPlayerId = null;
        }

        setDependencies(deps) {
            this.scene = deps.scene;
            this.gameEngine = deps.gameEngine;
            this.localPlayerId = deps.localPlayerId;
        }

        startNewGame() {
            Utils.log('Starting new round...');

            if (global.MenuOverlay) {
                global.MenuOverlay.hideStartMenu();
                global.MenuOverlay.showLoadingScreen();
            }

            this.cleanupGameWorld();

            if (this.gameEngine) {
                this.gameEngine.reset();
                if (this.gameEngine.gameState && typeof this.gameEngine.gameState.setGamePhase === 'function') {
                    this.gameEngine.gameState.setGamePhase(GAME_STATES.LOADING);
                }
            }

            this.createArena();
            this.createLocalPlayer();
            this.startGame();
        }

        cleanupGameWorld() {
            if (this.playerManager && typeof this.playerManager.clearAll === 'function') {
                this.playerManager.clearAll();
            }

            if (this.arenaBuilder && typeof this.arenaBuilder.clearArena === 'function') {
                this.arenaBuilder.clearArena();
            }
        }

        createArena() {
            Utils.log('Creating arena...');

            if (!this.arenaBuilder) {
                this.arenaBuilder = new ArenaBuilder(this.scene);
            }

            this.arenaBuilder.createBasicArena();

            const canMesh = this.arenaBuilder.createCentralCan();
            this.createCentralCanEntity(canMesh);

            const obstacles = this.arenaBuilder.createRandomObstacles();
            this.createObstacleEntities(obstacles);

            Utils.log('Arena created');
        }

        createCentralCanEntity(canMesh) {
            Utils.log('Creating central can entity...');

            // Create entity for the central Swedish can
            const canEntity = this.gameEngine.gameState.createEntity();

            // Add Transform component (positioned at arena center)
            canEntity.addComponent(new Transform(0, 0.8, 0)); // Center position, elevated

            // Add Renderable component
            canEntity.addComponent(new Renderable(canMesh));

            // Add Interactable component - the heart of Swedish "Bollen i Burken"
            const interactable = new Interactable('burken', 2.0); // Swedish can, 2 units interaction distance
            interactable.onInteract = function(playerId, component) {
                Utils.log(`Swedish Can (Burken) kicked by player ${playerId}! Traditional rescue mechanic triggered!`);
                // Future: Implement full rescue mechanics here
            };
            canEntity.addComponent(interactable);

            // Add Hideable component - can provide hiding near it
            canEntity.addComponent(new Hideable(2, 2.5)); // Can hide 2 players within 2.5 units

            Utils.log('Central Swedish can entity created with interaction components');
            return canEntity;
        }

        createObstacleEntities(obstacles) {
            Utils.log('Creating obstacle entities with collision...');

            const obstacleEntities = [];

            obstacles.forEach((obstacle, index) => {
                // Create entity for this obstacle
                const obstacleEntity = this.gameEngine.gameState.createEntity();

                // Add Transform component
                obstacleEntity.addComponent(new Transform(
                    obstacle.position.x,
                    obstacle.position.y,
                    obstacle.position.z
                ));

                // Add Renderable component
                obstacleEntity.addComponent(new Renderable(obstacle.mesh));

                // Add Collider component for solid collision
                obstacleEntity.addComponent(new Collider('box', obstacle.size));

                // Add Hideable component - can hide behind obstacles
                const hideRadius = Math.max(obstacle.size.width, obstacle.size.depth) + 1.0;
                obstacleEntity.addComponent(new Hideable(1, hideRadius));

                obstacleEntities.push(obstacleEntity);
            });

            Utils.log(`Created ${obstacleEntities.length} obstacle entities with collision`);
            return obstacleEntities;
        }

        createLocalPlayer() {
            Utils.log('Creating local player...');

            if (!this.playerManager) {
                this.playerManager = new PlayerManager(this.scene, this.gameEngine);
            }

            this.playerManager.addLocalPlayer(this.localPlayerId);
            this.playerManager.addAIHunter('ai-hunter-1');

            Utils.log('Local player and AI hunter created');
        }

        startGame() {
            Utils.log('Starting game...');

            // Set game state to playing
            this.gameEngine.start();

            // Hide loading screen
            if (global.MenuOverlay) {
                global.MenuOverlay.hideLoadingScreen();
            }

            // Ensure the game loop is running (it persists across rounds)
            if (global.gameLoopStarted !== undefined && !global.gameLoopStarted) {
                requestAnimationFrame(global.gameLoop);
                global.gameLoopStarted = true;
            }

            Utils.log('Game started successfully');
        }
    }

    // Export singleton instance
    const instance = new GameLifecycle();

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { GameLifecycle: instance };
    } else {
        global.GameLifecycle = instance;
        // Expose commonly used references
        global.arenaBuilder = instance.arenaBuilder;
        global.playerManager = instance.playerManager;
    }
})(typeof window !== 'undefined' ? window : globalThis);
