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
                // Create PARENT entity for this obstacle shape (visual only)
                const obstacleEntity = this.gameEngine.gameState.createEntity();

                // Add Transform component (center of shape group)
                obstacleEntity.addComponent(new Transform(
                    obstacle.position.x,
                    obstacle.position.y,
                    obstacle.position.z
                ));

                // Add Renderable component (the visual mesh group)
                obstacleEntity.addComponent(new Renderable(obstacle.group));

                // Add Parent component to track child colliders
                const parentComponent = new Parent();
                obstacleEntity.addComponent(parentComponent);

                // Add Hideable component (hiding logic attached to parent)
                const hideRadius = Math.max(obstacle.bounds.width, obstacle.bounds.depth) + 1.0;
                obstacleEntity.addComponent(new Hideable(1, hideRadius));

                // Create CHILD entities for each box (colliders only)
                obstacle.boxes.forEach((box, boxIndex) => {
                    const colliderEntity = this.gameEngine.gameState.createEntity();

                    // Calculate world position of this box
                    const worldX = obstacle.position.x + box.x;
                    const worldY = obstacle.position.y + box.y;
                    const worldZ = obstacle.position.z + box.z;

                    // Add Transform (world position of this specific box)
                    colliderEntity.addComponent(new Transform(worldX, worldY + box.height / 2, worldZ));

                    // Add Collider (exact box size)
                    const boxCollider = new Collider('box', {
                        width: box.width,
                        height: box.height,
                        depth: box.depth
                    });
                    colliderEntity.addComponent(boxCollider);

                    // Link child to parent
                    parentComponent.addChild(colliderEntity);

                    obstacleEntities.push(colliderEntity);
                });

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

            // Spawn multiple AI hunters at different positions based on difficulty
            const difficulty = CONFIG.difficulties[CONFIG.currentDifficulty];
            const numHunters = difficulty.numHunters || CONFIG.ai.numHunters || 1;
            const arenaSize = CONFIG.arena.size;
            const spawnRadius = arenaSize * 0.6; // Spawn 60% out from center

            Utils.log(`Spawning ${numHunters} hunters for difficulty: ${difficulty.name}`);

            for (let i = 0; i < numHunters; i++) {
                // Distribute hunters evenly around the arena
                const angle = (Math.PI * 2 * i) / numHunters;
                const x = Math.cos(angle) * spawnRadius;
                const z = Math.sin(angle) * spawnRadius;

                this.playerManager.addAIHunter(`ai-hunter-${i + 1}`, { x, y: 0.5, z });
            }

            Utils.log(`Local player and ${numHunters} AI hunter(s) created for ${difficulty.name}`);
        }

        startGame() {
            Utils.log('Starting countdown...');

            // Hide loading screen
            if (global.MenuOverlay) {
                global.MenuOverlay.hideLoadingScreen();
            }

            // Set game state to COUNTDOWN (don't start game engine yet!)
            if (this.gameEngine.gameState && typeof this.gameEngine.gameState.setGamePhase === 'function') {
                this.gameEngine.gameState.setGamePhase(GAME_STATES.COUNTDOWN);
            }

            // Set game status to indicate countdown phase
            this.gameEngine.gameStatus = 'countdown';
            this.gameEngine.gameStartTime = 0; // Don't start timer yet

            // Ensure the game loop is running
            if (global.gameLoopStarted !== undefined && !global.gameLoopStarted) {
                requestAnimationFrame(global.gameLoop);
                global.gameLoopStarted = true;
            }

            // Start 5 second countdown
            this.startCountdown(5);
        }

        startCountdown(seconds) {
            let remainingSeconds = seconds;

            // Show countdown UI
            if (global.uiSystem && typeof global.uiSystem.showCountdown === 'function') {
                global.uiSystem.showCountdown(remainingSeconds);
            }

            const countdownInterval = setInterval(() => {
                remainingSeconds--;

                if (remainingSeconds > 0) {
                    // Update countdown display
                    if (global.uiSystem && typeof global.uiSystem.showCountdown === 'function') {
                        global.uiSystem.showCountdown(remainingSeconds);
                    }
                    Utils.log(`Countdown: ${remainingSeconds}...`);
                } else {
                    // Countdown finished
                    clearInterval(countdownInterval);

                    // Hide countdown UI
                    if (global.uiSystem && typeof global.uiSystem.hideCountdown === 'function') {
                        global.uiSystem.hideCountdown();
                    }

                    // NOW start the actual game (this sets phase to PLAYING)
                    this.gameEngine.start();

                    Utils.log('Game started successfully - Hunter is now active!');
                }
            }, 1000);
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
