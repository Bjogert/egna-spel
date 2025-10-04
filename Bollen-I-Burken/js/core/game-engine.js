/* ==========================================
   CORE GAME ENGINE
   Manages systems, loop timing, and game lifecycle
   ========================================== */

(function (global) {
    class GameEngine {
        constructor() {
            this.gameState = new GameState();
            this.systems = [];
            this.systemsMap = new Map();

            // Timing
            this.tickRate = GAME_CONFIG.TICK_RATE;
            this.tickInterval = 1000 / this.tickRate;
            this.lastTickTime = 0;
            this.accumulator = 0;

            // Performance tracking
            this.frameCount = 0;
            this.lastFpsTime = 0;
            this.currentFps = 0;

            // Game timer and state
            this.gameStartTime = 0;
            this.gameDuration = 0; // No automatic win timer (was 60 seconds)
            this.gameStatus = 'idle'; // 'idle', 'playing', 'won', 'tagged', 'player_win'

            Utils.log('Game engine initialized');

            // Make game engine accessible globally for AI system and UI
            if (typeof global !== 'undefined') {
                global.GameEngine = this;
            }
        }

        addSystem(system) {
            this.systems.push(system);
            this.systemsMap.set(system.name, system);
            Utils.log(`Added system: ${system.name}`);
        }

        getSystem(name) {
            return this.systemsMap.get(name);
        }

        removeSystem(name) {
            const system = this.systemsMap.get(name);
            if (system) {
                const index = this.systems.indexOf(system);
                if (index !== -1) {
                    this.systems.splice(index, 1);
                }
                this.systemsMap.delete(name);
                Utils.log(`Removed system: ${name}`);
            }
        }

        update(deltaTime) {
            this.accumulator += deltaTime;

            // Fixed timestep updates (important for networking / physics stability)
            while (this.accumulator >= this.tickInterval) {
                this.tick();
                this.accumulator -= this.tickInterval;
                this.gameState.currentTick++;
            }

            // Variable timestep rendering with interpolation
            const interpolationFactor = this.accumulator / this.tickInterval;
            this.render(interpolationFactor);

            // Update FPS counter
            this.updateFps();
        }

        tick() {
            // If paused, only update InputSystem to allow unpausing
            if (this.gameState.gamePhase === GAME_STATES.PAUSED) {
                const inputSystem = this.systemsMap.get('InputSystem');
                if (inputSystem && inputSystem.enabled && typeof inputSystem.update === 'function') {
                    inputSystem.update(this.gameState, this.tickInterval);
                }
                return;
            }

            // Check game timer (only if game is still playing and timer enabled)
            if (this.gameStatus === 'playing') {
                this.checkGameTimer();
            }

            // Update all systems during countdown and playing phases
            if (this.gameStatus === 'countdown' || this.gameStatus === 'playing') {
                for (const system of this.systems) {
                    if (system.enabled && typeof system.update === 'function') {
                        try {
                            system.update(this.gameState, this.tickInterval);
                        } catch (error) {
                            Utils.error(`System ${system.name} update failed`, error);
                        }
                    }
                }
            }
        }

        render(interpolationFactor) {
            for (const system of this.systems) {
                if (system.enabled && typeof system.render === 'function') {
                    try {
                        system.render(this.gameState, interpolationFactor);
                    } catch (error) {
                        Utils.error(`System ${system.name} render failed`, error);
                    }
                }
            }
        }

        updateFps() {
            this.frameCount++;
            const currentTime = Utils.now();

            if (currentTime - this.lastFpsTime >= 1000) {
                this.currentFps = this.frameCount;
                this.frameCount = 0;
                this.lastFpsTime = currentTime;
            }
        }

        start() {
            this.gameState.setGamePhase(GAME_STATES.PLAYING);
            this.gameStartTime = Date.now();
            this.gameStatus = 'playing';
            Utils.log('Game Started - Stay hidden!');
        }

        pause() {
            this.gameState.setGamePhase(GAME_STATES.PAUSED);
            Utils.log('Game engine paused');
        }

        resume() {
            this.gameState.setGamePhase(GAME_STATES.PLAYING);
            Utils.log('Game engine resumed');
        }

        checkGameTimer() {
            if (this.gameStartTime === 0 || this.gameDuration <= 0) {
                return; // Timer disabled or game not started
            }

            const currentTime = Date.now();
            const elapsedTime = currentTime - this.gameStartTime;

            if (elapsedTime >= this.gameDuration) {
                this.gameOver('won');
            }
        }

        gameOver(reason) {
            if (this.gameStatus !== 'playing') return; // Already ended

            this.gameStatus = reason; // 'won' or 'tagged'
            this.gameState.setGamePhase(GAME_STATES.GAME_OVER);
            this.gameStartTime = 0;

            if (reason === 'won') {
                Utils.log('You won! Great hiding!');
            } else if (reason === 'tagged') {
                Utils.log('Game over! The hunter caught you.');
            }

            // Stop all AI movement
            const aiSystem = this.getSystem('AISystem');
            if (aiSystem && typeof aiSystem.getHunters === 'function') {
                for (const hunter of aiSystem.getHunters()) {
                    const transform = hunter.getComponent('Transform');
                    if (transform) {
                        transform.velocity.x = 0;
                        transform.velocity.z = 0;
                    }
                }
            }

            if (typeof global !== 'undefined' && typeof global.showStartMenu === 'function') {
                const message = reason === 'won' ? 'You Won! Play Again?' : 'Game Over';
                global.showStartMenu({ gameOver: reason !== 'won', message });
            }
        }

        playerWin() {
            if (this.gameStatus !== 'playing') return; // Already ended

            this.gameStatus = 'player_win';
            this.gameState.setGamePhase(GAME_STATES.PLAYER_WIN);

            const elapsedTime = Date.now() - this.gameStartTime;
            this.gameStartTime = 0;

            Utils.log('Player reached the can and won!');

            const aiSystem = this.getSystem('AISystem');
            if (aiSystem && typeof aiSystem.getHunters === 'function') {
                for (const hunter of aiSystem.getHunters()) {
                    const transform = hunter.getComponent('Transform');
                    if (transform) {
                        transform.velocity.x = 0;
                        transform.velocity.z = 0;
                    }
                }
            }

            if (typeof global !== 'undefined' && typeof global.showStartMenu === 'function') {
                global.showStartMenu({
                    gameOver: true,
                    message: 'DUNK FÖR MIG!',
                    reason: 'won',
                    elapsedMs: elapsedTime
                });
            } else {
                Utils.warn('showStartMenu function not found!');
            }
        }

        getRemainingTime() {
            if (this.gameStartTime === 0 || this.gameStatus !== 'playing' || this.gameDuration <= 0) {
                return 0;
            }

            const currentTime = Date.now();
            const elapsedTime = currentTime - this.gameStartTime;
            const remainingTime = Math.max(0, this.gameDuration - elapsedTime);

            return Math.ceil(remainingTime / 1000);
        }

        stop() {
            this.gameState.setGamePhase(GAME_STATES.GAME_OVER);
            this.gameStartTime = 0;
            Utils.log('Game engine stopped');
        }

        reset() {
            this.gameState.entities.clear();
            this.gameState.players.clear();
            this.gameState.nextEntityId = 1;
            this.gameState.currentTick = 0;
            this.gameState.localPlayerId = null;
            this.gameState.startTime = Utils.now();
            this.gameState.setGamePhase(GAME_STATES.START_MENU);

            this.gameStatus = 'idle';
            this.gameStartTime = 0;
            this.accumulator = 0;

            Utils.log('Game engine reset');
        }

        getStats() {
            return {
                fps: this.currentFps,
                tick: this.gameState.currentTick,
                entities: this.gameState.entities.size,
                players: this.gameState.players.size,
                gameTime: this.gameState.getGameTime(),
                gamePhase: this.gameState.gamePhase
            };
        }
    }

    if (typeof global !== 'undefined') {
        global.GameEngine = global.GameEngine || GameEngine;
        global.GameEngineClass = GameEngine;
        global.GameEngineConstructor = GameEngine;
    }
})(typeof window !== 'undefined' ? window : globalThis);