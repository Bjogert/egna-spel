/* ==========================================
   BOLLEN I BURKEN - UI SYSTEM
   User interface management and updates
   ========================================== */

class UISystem extends System {
    constructor() {
        super('UISystem');

        this.elements = {
            gameTitle: null,
            gameStats: null,
            gameTimer: null,
            playerList: null,
            controlsHelp: null,
            gameMessages: null,
            networkStatus: null
        };

        this.initializeUI();
        Utils.log('UI system initialized');
    }

    initializeUI() {
        this.createGameTitle();
        this.createGameStats();
        this.createGameTimer();
        this.createPlayerList();
        this.createControlsHelp();
        this.createGameMessages();
        this.createNetworkStatus();
    }

    createGameTitle() {
        const existingTitle = document.querySelector('.game-title');
        if (existingTitle) return;

        const title = document.createElement('div');
        title.className = 'game-title';
        title.textContent = 'Bollen i Burken';

        const gameUI = document.getElementById('gameUI');
        if (gameUI) {
            gameUI.insertBefore(title, gameUI.firstChild);
            this.elements.gameTitle = title;
        }
    }

    createGameStats() {
        let statsContainer = document.getElementById('gameStats');
        if (!statsContainer) {
            statsContainer = document.createElement('div');
            statsContainer.id = 'gameStats';
            statsContainer.className = 'game-stats';

            const gameUI = document.getElementById('gameUI');
            if (gameUI) {
                gameUI.appendChild(statsContainer);
            }
        }

        statsContainer.innerHTML = `
            <div class="stat-row">
                <span class="stat-label">Players:</span>
                <span class="stat-value" id="playerCount">1</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Game Tick:</span>
                <span class="stat-value" id="gameTick">0</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">FPS:</span>
                <span class="stat-value" id="fps">0</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Time:</span>
                <span class="stat-value" id="gameTime">0:00</span>
            </div>
        `;

        this.elements.gameStats = statsContainer;
    }

    createGameTimer() {
        let timerContainer = document.getElementById('gameTimer');
        if (!timerContainer) {
            timerContainer = document.createElement('div');
            timerContainer.id = 'gameTimer';
            timerContainer.className = 'game-timer';

            const gameUI = document.getElementById('gameUI');
            if (gameUI) {
                // Insert timer right after the title
                const title = gameUI.querySelector('.game-title');
                if (title) {
                    title.insertAdjacentElement('afterend', timerContainer);
                } else {
                    gameUI.appendChild(timerContainer);
                }
            }
        }

        timerContainer.innerHTML = `
            <div class="timer-display">
                <div class="timer-label">🕒 Survive:</div>
                <div class="timer-value" id="timerValue">60</div>
                <div class="timer-unit">seconds</div>
            </div>
            <div class="game-status" id="gameStatus">Hide from the AI Hunter!</div>
        `;

        this.elements.gameTimer = timerContainer;
    }

    createPlayerList() {
        let playerList = document.getElementById('playerList');
        if (!playerList) {
            playerList = document.createElement('div');
            playerList.id = 'playerList';
            playerList.innerHTML = '<h4>Players</h4>';

            document.body.appendChild(playerList);
        }

        this.elements.playerList = playerList;
    }

    createControlsHelp() {
        let controlsHelp = document.getElementById('controlsHelp');
        if (!controlsHelp) {
            controlsHelp = document.createElement('div');
            controlsHelp.id = 'controlsHelp';
            controlsHelp.innerHTML = `
                <div class="control-row">
                    <span class="key">WASD</span> or <span class="key">↑↓←→</span> Move
                </div>
                <div class="control-row">
                    <span class="key">P</span> Pause
                </div>
                <div class="control-row">
                    <span class="key">ESC</span> Menu
                </div>
            `;

            document.body.appendChild(controlsHelp);
        }

        this.elements.controlsHelp = controlsHelp;
    }

    createGameMessages() {
        let gameMessages = document.getElementById('gameMessages');
        if (!gameMessages) {
            gameMessages = document.createElement('div');
            gameMessages.id = 'gameMessages';

            document.body.appendChild(gameMessages);
        }

        this.elements.gameMessages = gameMessages;
    }

    createNetworkStatus() {
        let networkStatus = document.getElementById('networkStatus');
        if (!networkStatus) {
            networkStatus = document.createElement('div');
            networkStatus.id = 'networkStatus';
            networkStatus.innerHTML = `
                <div class="network-indicator connected"></div>
                <span>Local Game</span>
            `;

            document.body.appendChild(networkStatus);
        }

        this.elements.networkStatus = networkStatus;
    }

    update(gameState) {
        this.updateGameStats(gameState);
        this.updateGameTimer();
        this.updatePlayerList(gameState);
        this.updateGamePhase(gameState);
    }

    updateGameTimer() {
        const timerValueElement = document.getElementById('timerValue');
        const gameStatusElement = document.getElementById('gameStatus');

        if (!window.GameEngine) {
            return;
        }

        const remainingTime = window.GameEngine.getRemainingTime();
        const gameStatus = window.GameEngine.gameStatus;

        if (timerValueElement) {
            timerValueElement.textContent = Math.max(0, remainingTime);

            if (gameStatus === 'playing') {
                if (remainingTime <= 10) {
                    timerValueElement.style.color = '#ff4444';
                    timerValueElement.style.fontWeight = 'bold';
                } else if (remainingTime <= 30) {
                    timerValueElement.style.color = '#ffaa00';
                    timerValueElement.style.fontWeight = 'bold';
                } else {
                    timerValueElement.style.color = '#44ff44';
                    timerValueElement.style.fontWeight = 'normal';
                }
            } else {
                timerValueElement.style.color = '#44ff44';
                timerValueElement.style.fontWeight = 'normal';
            }
        }

        if (gameStatusElement) {
            if (gameStatus === 'won') {
                gameStatusElement.textContent = 'You won! Great job!';
                gameStatusElement.style.color = '#44ff44';
            } else if (gameStatus === 'tagged') {
                gameStatusElement.textContent = 'The hunter caught you.';
                gameStatusElement.style.color = '#ff4444';
            } else if (gameStatus === 'playing') {
                let message = 'Stay hidden from the hunter!';
                let color = '#ffffff';

                const aiSystem = window.GameEngine.getSystem('AISystem');
                if (aiSystem) {
                    const hunters = aiSystem.getHunters();
                    const isHunting = hunters.some(hunter => {
                        const ai = hunter.getComponent('AIHunter');
                        return ai && ai.state === 'HUNTING';
                    });

                    if (isHunting) {
                        message = 'The hunter spotted you! Run!';
                        color = '#ff4444';
                    }
                }

                gameStatusElement.textContent = message;
                gameStatusElement.style.color = color;
            } else {
                gameStatusElement.textContent = 'Press Start to enter the arena.';
                gameStatusElement.style.color = '#ffffff';
            }
        }
    }

    updateGameStats(gameState) {
        const stats = {
            playerCount: gameState.players.size,
            gameTick: gameState.currentTick,
            gameTime: gameState.getGameTime()
        };

        // Update player count
        const playerCountElement = document.getElementById('playerCount');
        if (playerCountElement) {
            playerCountElement.textContent = stats.playerCount;
        }

        // Update game tick
        const gameTickElement = document.getElementById('gameTick');
        if (gameTickElement) {
            gameTickElement.textContent = stats.gameTick;
        }

        // Update game time
        const gameTimeElement = document.getElementById('gameTime');
        if (gameTimeElement) {
            gameTimeElement.textContent = Utils.formatTime(stats.gameTime);
        }
    }

    updatePlayerList(gameState) {
        const playerListElement = this.elements.playerList;
        if (!playerListElement) return;

        // Keep the header and clear the rest
        const header = playerListElement.querySelector('h4');
        playerListElement.innerHTML = '';
        if (header) {
            playerListElement.appendChild(header);
        }

        // Add each player
        for (const [playerId, entityId] of gameState.players) {
            const entity = gameState.getEntity(entityId);
            if (entity && entity.active) {
                const player = entity.getComponent('Player');
                const transform = entity.getComponent('Transform');

                const playerItem = document.createElement('div');
                playerItem.className = `player-item ${player && player.isLocal ? 'local' : ''}`;

                const playerName = document.createElement('span');
                playerName.className = 'player-name';
                playerName.textContent = playerId;

                const playerStatus = document.createElement('div');
                playerStatus.className = 'player-status';

                playerItem.appendChild(playerName);
                playerItem.appendChild(playerStatus);
                playerListElement.appendChild(playerItem);
            }
        }
    }

    updateGamePhase(gameState) {
        const gameContainer = document.getElementById('gameContainer');
        if (!gameContainer) return;

        // Update visual state based on game phase
        const messages = this.elements.gameMessages;


        switch (gameState.gamePhase) {
            case GAME_STATES.LOADING:
                this.showLoadingScreen();
                break;
            case GAME_STATES.START_MENU:
                this.hideLoadingScreen();
                gameContainer.className = 'game-start-menu';
                if (messages) {
                    messages.innerHTML = '';
                }
                break;
            case GAME_STATES.PLAYING:
                this.hideLoadingScreen();
                gameContainer.className = 'game-active';
                if (messages) {
                    messages.innerHTML = '';
                }
                break;
            case GAME_STATES.PAUSED:
                gameContainer.className = 'game-paused';
                this.showMessage('Paused', 'Press P to resume');
                break;
            case GAME_STATES.GAME_OVER:
                gameContainer.className = 'game-over';
                if (messages) {
                    messages.innerHTML = '';
                }
                break;
        }
    }

    showLoadingScreen() {
        let loadingScreen = document.getElementById('loadingScreen');
        if (!loadingScreen) {
            loadingScreen = document.createElement('div');
            loadingScreen.id = 'loadingScreen';
            loadingScreen.className = 'loading';
            loadingScreen.textContent = 'Loading Arena...';

            const gameContainer = document.getElementById('gameContainer');
            if (gameContainer) {
                gameContainer.appendChild(loadingScreen);
            }
        }
        loadingScreen.style.display = 'block';
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }

    showMessage(title, subtitle = '', duration = 0) {
        const messageElement = document.createElement('div');
        messageElement.className = 'game-message';

        const titleElement = document.createElement('div');
        titleElement.style.fontSize = '24px';
        titleElement.textContent = title;
        messageElement.appendChild(titleElement);

        if (subtitle) {
            const subtitleElement = document.createElement('div');
            subtitleElement.style.fontSize = '16px';
            subtitleElement.style.marginTop = '10px';
            subtitleElement.textContent = subtitle;
            messageElement.appendChild(subtitleElement);
        }

        const gameMessages = this.elements.gameMessages;
        if (gameMessages) {
            gameMessages.innerHTML = '';
            gameMessages.appendChild(messageElement);

            if (duration > 0) {
                setTimeout(() => {
                    if (gameMessages.contains(messageElement)) {
                        gameMessages.removeChild(messageElement);
                    }
                }, duration);
            }
        }
    }

    hideMessage() {
        const gameMessages = this.elements.gameMessages;
        if (gameMessages) {
            gameMessages.innerHTML = '';
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            border-left: 4px solid ${type === 'error' ? '#ff0000' : type === 'warning' ? '#ffff00' : '#00ff00'};
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    updateFPS(fps) {
        const fpsElement = document.getElementById('fps');
        if (fpsElement) {
            fpsElement.textContent = fps;

            // Color code based on performance using neutral theme
            if (fps >= 50) {
                fpsElement.style.color = '#4a90e2';
            } else if (fps >= 30) {
                fpsElement.style.color = '#ff9500';
            } else {
                fpsElement.style.color = '#e74c3c';
            }
        }
    }

    updateNetworkStatus(status, ping = null) {
        const networkStatus = this.elements.networkStatus;
        if (!networkStatus) return;

        const indicator = networkStatus.querySelector('.network-indicator');
        const text = networkStatus.querySelector('span');

        if (indicator) {
            indicator.className = `network-indicator ${status}`;
        }

        if (text) {
            switch (status) {
                case 'connected':
                    text.textContent = ping ? `Connected (${ping}ms)` : 'Connected';
                    break;
                case 'connecting':
                    text.textContent = 'Connecting...';
                    break;
                case 'disconnected':
                    text.textContent = 'Disconnected';
                    break;
                default:
                    text.textContent = 'Local Game';
            }
        }
    }

    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <h3>Error</h3>
            <p>${message}</p>
            <button onclick="location.reload()">Reload Game</button>
        `;

        document.body.appendChild(errorDiv);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (document.body.contains(errorDiv)) {
                document.body.removeChild(errorDiv);
            }
        }, 10000);
    }

    toggleUI(visible) {
        const uiElements = [
            this.elements.gameStats,
            this.elements.playerList,
            this.elements.controlsHelp,
            this.elements.networkStatus
        ];

        uiElements.forEach(element => {
            if (element) {
                element.style.display = visible ? 'block' : 'none';
            }
        });
    }

    setMenuVisible(isVisible) {
        this.toggleUI(!isVisible);

        const optionalElements = [
            this.elements.gameTimer,
            this.elements.gameTitle
        ];

        optionalElements.forEach(element => {
            if (element) {
                element.style.display = isVisible ? 'none' : 'block';
            }
        });

        if (this.elements.controlsHelp) {
            this.elements.controlsHelp.style.display = 'none';
        }
    }

    destroy() {
        // Clean up UI elements
        Object.values(this.elements).forEach(element => {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });

        Utils.log('UI system destroyed');
    }
}

// Export for module systems or global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UISystem };
} else {
    window.GameUI = { UISystem };
}

