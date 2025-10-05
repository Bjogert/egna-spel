/* ==========================================
   MENU OVERLAY SYSTEM
   Handles start menu, game over overlay, loading screen
   ========================================== */

(function (global) {
    // Menu overlay references
    let startMenuElement;
    let startButtonElement;
    let menuStatusElement;
    let menuSummaryElement;
    let difficultySelectElement;
    let difficultyDescriptionElement;

    class MenuOverlay {
        constructor() {
            this.initialized = false;
        }

        setup() {
            startMenuElement = document.getElementById('startMenu');
            startButtonElement = document.getElementById('startButton');
            menuStatusElement = document.getElementById('menuStatus');
            menuSummaryElement = document.getElementById('menuSummary');
            difficultySelectElement = document.getElementById('difficultySelect');
            difficultyDescriptionElement = document.getElementById('difficultyDescription');

            if (!startButtonElement) {
                Utils.warn('Start button not found in DOM');
                return;
            }

            // Difficulty selector handler
            if (difficultySelectElement) {
                difficultySelectElement.addEventListener('change', (event) => {
                    const selectedLevel = parseInt(event.target.value, 10);
                    CONFIG.currentDifficulty = selectedLevel;

                    // Update description text
                    const difficulty = CONFIG.difficulties[selectedLevel];
                    if (difficultyDescriptionElement && difficulty) {
                        difficultyDescriptionElement.textContent = difficulty.description;
                    }

                    Utils.log(`Difficulty changed to: ${difficulty.name} (Level ${selectedLevel + 1})`);
                });

                // Set initial description
                const initialDifficulty = CONFIG.difficulties[CONFIG.currentDifficulty];
                if (difficultyDescriptionElement && initialDifficulty) {
                    difficultyDescriptionElement.textContent = initialDifficulty.description;
                }
            }

            startButtonElement.addEventListener('click', () => {
                if (global.gameEngine && global.gameEngine.gameState && global.gameEngine.gameState.gamePhase === GAME_STATES.PLAYING) {
                    return; // Already in play
                }
                startButtonElement.disabled = true;
                if (global.GameLifecycle && global.GameLifecycle.startNewGame) {
                    global.GameLifecycle.startNewGame();
                }
            });

            if (startMenuElement) {
                startMenuElement.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' && !startMenuElement.classList.contains('hidden') && !startButtonElement.disabled) {
                        startButtonElement.click();
                    }
                });
            }

            this.initialized = true;
            Utils.log('Menu overlay setup complete');
        }

        showStartMenu(options = {}) {
            const {
                gameOver = false,
                message = '',
                reason = 'tagged',
                elapsedMs = 0
            } = options;

            if (startMenuElement) {
                startMenuElement.classList.remove('hidden');
                startMenuElement.classList.add('visible');
                startMenuElement.setAttribute('aria-hidden', 'false');
            }

            if (menuStatusElement) {
                let statusText = message;
                if (!statusText && gameOver) {
                    statusText = reason === 'won' ? 'You survived!' : 'You were tagged!';
                }

                menuStatusElement.textContent = statusText;

                if (statusText) {
                    menuStatusElement.classList.remove('hidden');
                    menuStatusElement.style.color = reason === 'won' ? '#7ef29d' : '#ffc857';
                } else {
                    menuStatusElement.classList.add('hidden');
                    menuStatusElement.style.removeProperty('color');
                }
            }

            if (menuSummaryElement) {
                if (gameOver) {
                    const formattedTime = Utils.formatTime(Math.max(0, elapsedMs));
                    const summaryText = reason === 'won'
                        ? `Victory time: ${formattedTime}`
                        : `Survival time: ${formattedTime}`;

                    menuSummaryElement.textContent = summaryText;
                    menuSummaryElement.classList.remove('hidden');
                } else {
                    menuSummaryElement.textContent = '';
                    menuSummaryElement.classList.add('hidden');
                }
            }

            if (startButtonElement) {
                startButtonElement.textContent = gameOver ? 'Play Again' : 'Start Game';
                startButtonElement.disabled = false;
                setTimeout(() => startButtonElement.focus({ preventScroll: true }), 50);
            }

            if (global.uiSystem) {
                if (typeof global.uiSystem.setMenuVisible === 'function') {
                    global.uiSystem.setMenuVisible(true);
                } else if (typeof global.uiSystem.toggleUI === 'function') {
                    global.uiSystem.toggleUI(false);
                }
            }

            if (global.gameEngine && global.gameEngine.gameState && typeof global.gameEngine.gameState.setGamePhase === 'function') {
                const phase = gameOver ? GAME_STATES.GAME_OVER : GAME_STATES.START_MENU;
                global.gameEngine.gameState.setGamePhase(phase);
            }

            if (!gameOver && global.gameEngine) {
                global.gameEngine.gameStatus = 'idle';
            }
        }

        hideStartMenu() {
            if (startMenuElement) {
                startMenuElement.classList.remove('visible');
                startMenuElement.classList.add('hidden');
                startMenuElement.setAttribute('aria-hidden', 'true');
            }

            if (menuStatusElement) {
                menuStatusElement.textContent = '';
                menuStatusElement.classList.add('hidden');
                menuStatusElement.style.removeProperty('color');
            }

            if (menuSummaryElement) {
                menuSummaryElement.textContent = '';
                menuSummaryElement.classList.add('hidden');
            }

            if (global.uiSystem) {
                if (typeof global.uiSystem.setMenuVisible === 'function') {
                    global.uiSystem.setMenuVisible(false);
                } else if (typeof global.uiSystem.toggleUI === 'function') {
                    global.uiSystem.toggleUI(true);
                }
            }
        }

        showLoadingScreen() {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.display = 'flex';
            }
        }

        hideLoadingScreen() {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
        }

        showErrorMessage(message) {
            const gameUI = document.getElementById('gameUI');
            if (gameUI) {
                gameUI.innerHTML = `
                    <div style="color: red; background: rgba(0,0,0,0.8); padding: 20px; border-radius: 8px;">
                        <h3>Error</h3>
                        <p>${message}</p>
                        <button onclick="location.reload()" style="margin-top: 10px; padding: 5px 10px;">
                            Reload Game
                        </button>
                    </div>
                `;
            }

            Utils.error('Game error displayed to user:', message);
        }
    }

    // Export singleton instance
    const instance = new MenuOverlay();

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { MenuOverlay: instance };
    } else {
        global.MenuOverlay = instance;
        // Legacy global functions
        global.showStartMenu = (opts) => instance.showStartMenu(opts);
        global.hideStartMenu = () => instance.hideStartMenu();
    }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
