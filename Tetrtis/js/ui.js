/**
 * FANTASTIC TETRIS - UI MANAGER
 * Manages user interface updates, modals, animations, and HUD elements
 */

export class UIManager {
  constructor(game) {
    this.game = game;
    this.elements = {};
    this.modals = {};
    this.animations = new Map();
    this.updateCallbacks = new Map();

    // Animation settings
    this.animationSettings = {
      scoreIncrement: { duration: 800, easing: 'easeOutQuart' },
      levelUp: { duration: 1000, easing: 'easeOutBounce' },
      lineClear: { duration: 500, easing: 'easeInOut' },
      gameOver: { duration: 1500, easing: 'easeOutCubic' }
    };

    this.initialize();
  }

  /**
   * Initialize UI Manager
   */
  initialize() {
    this.cacheElements();
    this.setupModals();
    this.bindEvents();
    this.initializeDisplays();

    console.log('🎨 UI Manager initialized');
  }

  /**
   * Cache DOM elements for better performance
   */
  cacheElements() {
    // Main game elements
    this.elements = {
      // Score and stats
      scoreDisplay: document.getElementById('score-display'),
      levelDisplay: document.getElementById('level-display'),
      linesDisplay: document.getElementById('lines-display'),
      timeDisplay: document.getElementById('time-display'),

      // Performance
      fpsDisplay: document.getElementById('fps-display'),
      ppsDisplay: document.getElementById('pps-display'),

      // AI
      aiToggle: document.getElementById('ai-toggle'),
      aiSuggestion: document.getElementById('ai-suggestion'),

      // Next pieces canvases
      nextCanvas1: document.getElementById('next-canvas-1'),
      nextCanvas2: document.getElementById('next-canvas-2'),
      nextCanvas3: document.getElementById('next-canvas-3'),
      holdCanvas: document.getElementById('hold-canvas'),

      // Buttons
      pauseBtn: document.getElementById('pause-btn'),
      restartBtn: document.getElementById('restart-btn'),
      settingsBtn: document.getElementById('settings-btn'),
      helpBtn: document.getElementById('help-btn'),

      // Modal elements
      gameOverModal: document.getElementById('game-over-modal'),
      pauseModal: document.getElementById('pause-modal'),
      settingsModal: document.getElementById('settings-modal'),
      helpModal: document.getElementById('help-modal'),

      // Final score elements
      finalScore: document.getElementById('final-score'),
      finalLevel: document.getElementById('final-level'),
      finalLines: document.getElementById('final-lines'),
      finalTime: document.getElementById('final-time'),

      // Game controls
      playAgainBtn: document.getElementById('play-again-btn'),
      resumeBtn: document.getElementById('resume-btn')
    };

    // Cache canvas contexts for next pieces
    this.nextCanvases = [
      { canvas: this.elements.nextCanvas1, ctx: this.elements.nextCanvas1?.getContext('2d') },
      { canvas: this.elements.nextCanvas2, ctx: this.elements.nextCanvas2?.getContext('2d') },
      { canvas: this.elements.nextCanvas3, ctx: this.elements.nextCanvas3?.getContext('2d') }
    ];

    this.holdCanvasCtx = this.elements.holdCanvas?.getContext('2d');
  }

  /**
   * Setup modal handlers
   */
  setupModals() {
    this.modals = {
      gameOver: new Modal(this.elements.gameOverModal),
      pause: new Modal(this.elements.pauseModal),
      settings: new Modal(this.elements.settingsModal),
      help: new Modal(this.elements.helpModal)
    };

    // Setup settings modal content
    this.setupSettingsModal();
  }

  /**
   * Bind UI event listeners
   */
  bindEvents() {
    // Play again button
    if (this.elements.playAgainBtn) {
      this.elements.playAgainBtn.addEventListener('click', () => {
        this.hideGameOverModal();
        this.game.newGame();
      });
    }

    // Resume button
    if (this.elements.resumeBtn) {
      this.elements.resumeBtn.addEventListener('click', () => {
        this.game.resume();
      });
    }

    // AI toggle
    if (this.elements.aiToggle) {
      this.elements.aiToggle.addEventListener('change', (event) => {
        this.game.settings.enableAI = event.target.checked;
        this.updateAISuggestion(event.target.checked ? 'AI assistance enabled' : 'AI assistance disabled');
      });
    }

    // Modal close buttons
    Object.values(this.modals).forEach(modal => {
      modal.onClose(() => {
        // Resume game if paused when closing modals
        if (this.game.state.isPaused && modal !== this.modals.pause) {
          // Don't auto-resume, let user decide
        }
      });
    });
  }

  /**
   * Initialize display values
   */
  initializeDisplays() {
    this.updateScore(0);
    this.updateLevel(1);
    this.updateLines(0);
    this.updateTime(0);
    this.updatePerformanceDisplay({ fps: 60, pps: 0 });
  }

  /**
   * Update all UI displays
   */
  updateDisplay() {
    const { state } = this.game;

    this.updateScore(state.score);
    this.updateLevel(state.level);
    this.updateLines(state.lines);
    this.updateTime(state.elapsedTime);
  }

  /**
   * Update score display with animation
   */
  updateScore(newScore, animated = true) {
    if (!this.elements.scoreDisplay) return;

    const currentScore = parseInt(this.elements.scoreDisplay.textContent) || 0;

    if (animated && newScore !== currentScore) {
      this.animateNumber(this.elements.scoreDisplay, currentScore, newScore, {
        duration: this.animationSettings.scoreIncrement.duration,
        format: (value) => value.toLocaleString()
      });
    } else {
      this.elements.scoreDisplay.textContent = newScore.toLocaleString();
    }
  }

  /**
   * Update level display with animation
   */
  updateLevel(newLevel, animated = true) {
    if (!this.elements.levelDisplay) return;

    const currentLevel = parseInt(this.elements.levelDisplay.textContent) || 1;

    if (animated && newLevel > currentLevel) {
      this.animateNumber(this.elements.levelDisplay, currentLevel, newLevel);
      this.showLevelUpEffect();
    } else {
      this.elements.levelDisplay.textContent = newLevel;
    }
  }

  /**
   * Update lines display
   */
  updateLines(lines) {
    if (this.elements.linesDisplay) {
      this.elements.linesDisplay.textContent = lines;
    }
  }

  /**
   * Update time display
   */
  updateTime(elapsedTime) {
    if (!this.elements.timeDisplay) return;

    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);

    this.elements.timeDisplay.textContent =
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Update performance displays
   */
  updatePerformanceDisplay(performance) {
    if (this.elements.fpsDisplay) {
      this.elements.fpsDisplay.textContent = Math.round(performance.fps);
    }

    if (this.elements.ppsDisplay) {
      this.elements.ppsDisplay.textContent = performance.pps.toFixed(1);
    }
  }

  /**
   * Update next pieces display
   */
  updateNextPieces(nextPieces) {
    if (!nextPieces || nextPieces.length === 0) return;

    nextPieces.slice(0, 3).forEach((piece, index) => {
      const canvasData = this.nextCanvases[index];
      if (canvasData && canvasData.ctx) {
        this.renderPieceOnCanvas(canvasData.ctx, piece, canvasData.canvas.width, canvasData.canvas.height);
      }
    });
  }

  /**
   * Update hold piece display
   */
  updateHoldPiece(piece) {
    if (!this.holdCanvasCtx) return;

    this.clearCanvas(this.holdCanvasCtx, this.elements.holdCanvas.width, this.elements.holdCanvas.height);

    if (piece) {
      this.renderPieceOnCanvas(this.holdCanvasCtx, piece, this.elements.holdCanvas.width, this.elements.holdCanvas.height);
    }
  }

  /**
   * Render a piece on a small canvas
   */
  renderPieceOnCanvas(ctx, piece, canvasWidth, canvasHeight) {
    this.clearCanvas(ctx, canvasWidth, canvasHeight);

    if (!piece || !piece.shape) return;

    const { shape, color } = piece;
    const cellSize = Math.min(canvasWidth, canvasHeight) / Math.max(shape.length, shape[0]?.length || 0) * 0.8;

    // Calculate centering offset
    const offsetX = (canvasWidth - shape[0].length * cellSize) / 2;
    const offsetY = (canvasHeight - shape.length * cellSize) / 2;

    // Render each cell
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const pixelX = offsetX + x * cellSize;
          const pixelY = offsetY + y * cellSize;

          // Main cell
          ctx.fillStyle = color;
          ctx.fillRect(pixelX, pixelY, cellSize, cellSize);

          // Border
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 1;
          ctx.strokeRect(pixelX, pixelY, cellSize, cellSize);

          // Highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.fillRect(pixelX + 1, pixelY + 1, cellSize - 2, 2);
        }
      }
    }
  }

  /**
   * Clear a canvas
   */
  clearCanvas(ctx, width, height) {
    ctx.clearRect(0, 0, width, height);
  }

  /**
   * Show game over modal
   */
  showGameOverModal() {
    if (!this.modals.gameOver) return;

    // Update final stats
    const { state, stats } = this.game;

    if (this.elements.finalScore) {
      this.elements.finalScore.textContent = state.score.toLocaleString();
    }

    if (this.elements.finalLevel) {
      this.elements.finalLevel.textContent = state.level;
    }

    if (this.elements.finalLines) {
      this.elements.finalLines.textContent = state.lines;
    }

    if (this.elements.finalTime) {
      const minutes = Math.floor(state.elapsedTime / 60000);
      const seconds = Math.floor((state.elapsedTime % 60000) / 1000);
      this.elements.finalTime.textContent =
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Show achievements
    this.displayAchievements();

    this.modals.gameOver.show();
  }

  /**
   * Hide game over modal
   */
  hideGameOverModal() {
    if (this.modals.gameOver) {
      this.modals.gameOver.hide();
    }
  }

  /**
   * Show pause modal
   */
  showPauseModal() {
    if (this.modals.pause) {
      this.modals.pause.show();
    }
  }

  /**
   * Hide pause modal
   */
  hidePauseModal() {
    if (this.modals.pause) {
      this.modals.pause.hide();
    }
  }

  /**
   * Toggle settings modal
   */
  toggleSettings() {
    if (this.modals.settings) {
      this.modals.settings.toggle();
    }
  }

  /**
   * Toggle help modal
   */
  toggleHelp() {
    if (this.modals.help) {
      this.modals.help.toggle();
    }
  }

  /**
   * Setup settings modal content
   */
  setupSettingsModal() {
    const settingsContent = document.querySelector('.settings-content');
    if (!settingsContent) return;

    // Create tabs content
    const tabsContent = {
      gameplay: this.createGameplaySettings(),
      audio: this.createAudioSettings(),
      controls: this.createControlsSettings(),
      accessibility: this.createAccessibilitySettings()
    };

    // Handle tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabName = button.dataset.tab;

        // Update active tab
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Update content
        settingsContent.innerHTML = tabsContent[tabName] || '';
        this.bindSettingsEvents();
      });
    });

    // Load default tab
    settingsContent.innerHTML = tabsContent.gameplay;
    this.bindSettingsEvents();
  }

  /**
   * Create gameplay settings HTML
   */
  createGameplaySettings() {
    return `
      <div class="settings-section">
        <h4>Game Settings</h4>

        <div class="setting-item">
          <label for="ghost-piece">Ghost Piece</label>
          <input type="checkbox" id="ghost-piece" ${this.game.settings.enableGhost ? 'checked' : ''}>
        </div>

        <div class="setting-item">
          <label for="ai-assistance">AI Assistance</label>
          <input type="checkbox" id="ai-assistance" ${this.game.settings.enableAI ? 'checked' : ''}>
        </div>

        <div class="setting-item">
          <label for="difficulty">Difficulty</label>
          <select id="difficulty">
            <option value="easy" ${this.game.settings.difficulty === 'easy' ? 'selected' : ''}>Easy</option>
            <option value="normal" ${this.game.settings.difficulty === 'normal' ? 'selected' : ''}>Normal</option>
            <option value="hard" ${this.game.settings.difficulty === 'hard' ? 'selected' : ''}>Hard</option>
            <option value="extreme" ${this.game.settings.difficulty === 'extreme' ? 'selected' : ''}>Extreme</option>
          </select>
        </div>

        <div class="setting-item">
          <label for="drop-speed">Drop Speed</label>
          <input type="range" id="drop-speed" min="100" max="2000" value="${this.game.settings.dropInterval}" step="50">
          <span class="setting-value">${this.game.settings.dropInterval}ms</span>
        </div>
      </div>
    `;
  }

  /**
   * Create audio settings HTML
   */
  createAudioSettings() {
    return `
      <div class="settings-section">
        <h4>Audio Settings</h4>

        <div class="setting-item">
          <label for="master-volume">Master Volume</label>
          <input type="range" id="master-volume" min="0" max="100" value="70">
          <span class="setting-value">70%</span>
        </div>

        <div class="setting-item">
          <label for="music-volume">Music Volume</label>
          <input type="range" id="music-volume" min="0" max="100" value="50">
          <span class="setting-value">50%</span>
        </div>

        <div class="setting-item">
          <label for="sfx-volume">Sound Effects</label>
          <input type="range" id="sfx-volume" min="0" max="100" value="80">
          <span class="setting-value">80%</span>
        </div>

        <div class="setting-item">
          <label for="enable-music">Background Music</label>
          <input type="checkbox" id="enable-music" ${this.game.settings.enableMusic ? 'checked' : ''}>
        </div>

        <div class="setting-item">
          <label for="enable-sounds">Sound Effects</label>
          <input type="checkbox" id="enable-sounds" ${this.game.settings.enableSounds ? 'checked' : ''}>
        </div>
      </div>
    `;
  }

  /**
   * Create controls settings HTML
   */
  createControlsSettings() {
    return `
      <div class="settings-section">
        <h4>Control Settings</h4>

        <div class="setting-item">
          <label for="das-delay">DAS Delay</label>
          <input type="range" id="das-delay" min="50" max="300" value="${this.game.input?.timing.dasDelay || 100}" step="10">
          <span class="setting-value">${this.game.input?.timing.dasDelay || 100}ms</span>
        </div>

        <div class="setting-item">
          <label for="arr-rate">ARR Rate</label>
          <input type="range" id="arr-rate" min="10" max="100" value="${this.game.input?.timing.repeatRate || 50}" step="5">
          <span class="setting-value">${this.game.input?.timing.repeatRate || 50}ms</span>
        </div>

        <div class="setting-item">
          <label for="lock-delay">Lock Delay</label>
          <input type="range" id="lock-delay" min="100" max="1000" value="${this.game.settings.lockDelay}" step="50">
          <span class="setting-value">${this.game.settings.lockDelay}ms</span>
        </div>

        <div class="controls-info">
          <h5>Key Bindings</h5>
          <p>Move: ← → or A D</p>
          <p>Rotate: ↑ or W X</p>
          <p>Soft Drop: ↓ or S</p>
          <p>Hard Drop: Space</p>
          <p>Hold: C or Shift</p>
          <p>Pause: P or Esc</p>
        </div>
      </div>
    `;
  }

  /**
   * Create accessibility settings HTML
   */
  createAccessibilitySettings() {
    return `
      <div class="settings-section">
        <h4>Accessibility</h4>

        <div class="setting-item">
          <label for="high-contrast">High Contrast Mode</label>
          <input type="checkbox" id="high-contrast">
        </div>

        <div class="setting-item">
          <label for="colorblind-mode">Colorblind Friendly</label>
          <input type="checkbox" id="colorblind-mode">
        </div>

        <div class="setting-item">
          <label for="reduced-motion">Reduce Motion</label>
          <input type="checkbox" id="reduced-motion">
        </div>

        <div class="setting-item">
          <label for="font-size">UI Font Size</label>
          <select id="font-size">
            <option value="small">Small</option>
            <option value="normal" selected>Normal</option>
            <option value="large">Large</option>
            <option value="xl">Extra Large</option>
          </select>
        </div>

        <div class="setting-item">
          <label for="screen-reader">Screen Reader Support</label>
          <input type="checkbox" id="screen-reader">
        </div>
      </div>
    `;
  }

  /**
   * Bind settings events
   */
  bindSettingsEvents() {
    // Range inputs with value display
    const ranges = document.querySelectorAll('input[type="range"]');
    ranges.forEach(range => {
      const valueDisplay = range.nextElementSibling;
      if (valueDisplay && valueDisplay.classList.contains('setting-value')) {
        range.addEventListener('input', () => {
          let value = range.value;
          let unit = '';

          // Add appropriate unit
          if (range.id.includes('volume')) {
            unit = '%';
          } else if (range.id.includes('delay') || range.id.includes('speed') || range.id.includes('rate')) {
            unit = 'ms';
          }

          valueDisplay.textContent = value + unit;
        });
      }
    });

    // Settings change handlers
    this.bindSettingChange('ghost-piece', (checked) => {
      this.game.settings.enableGhost = checked;
    });

    this.bindSettingChange('ai-assistance', (checked) => {
      this.game.settings.enableAI = checked;
      if (this.elements.aiToggle) {
        this.elements.aiToggle.checked = checked;
      }
    });

    this.bindSettingChange('enable-music', (checked) => {
      this.game.settings.enableMusic = checked;
    });

    this.bindSettingChange('enable-sounds', (checked) => {
      this.game.settings.enableSounds = checked;
    });
  }

  /**
   * Bind individual setting change
   */
  bindSettingChange(id, callback) {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('change', (event) => {
        callback(event.target.type === 'checkbox' ? event.target.checked : event.target.value);
      });
    }
  }

  /**
   * Update AI suggestion display
   */
  updateAISuggestion(suggestion) {
    if (this.elements.aiSuggestion) {
      const textElement = this.elements.aiSuggestion.querySelector('.ai-text');
      if (textElement) {
        textElement.textContent = suggestion;
      }
    }
  }

  /**
   * Display achievements in game over modal
   */
  displayAchievements() {
    const achievementsContainer = document.getElementById('achievements-container');
    if (!achievementsContainer) return;

    const achievements = this.calculateAchievements();

    achievementsContainer.innerHTML = achievements.map(achievement => `
      <div class="achievement ${achievement.earned ? 'earned' : 'not-earned'}">
        <span class="achievement-icon">${achievement.icon}</span>
        <div class="achievement-info">
          <h4>${achievement.name}</h4>
          <p>${achievement.description}</p>
        </div>
      </div>
    `).join('');
  }

  /**
   * Calculate achievements based on game stats
   */
  calculateAchievements() {
    const { state, stats } = this.game;

    return [
      {
        name: 'First Steps',
        description: 'Score your first 1,000 points',
        icon: '🎯',
        earned: state.score >= 1000
      },
      {
        name: 'Tetris Master',
        description: 'Clear 4 lines at once',
        icon: '🏆',
        earned: stats.tetrisLines > 0
      },
      {
        name: 'Speed Demon',
        description: 'Reach level 10',
        icon: '⚡',
        earned: state.level >= 10
      },
      {
        name: 'Line Clearer',
        description: 'Clear 100 lines total',
        icon: '📏',
        earned: state.lines >= 100
      },
      {
        name: 'Marathon Runner',
        description: 'Play for 10 minutes',
        icon: '🏃',
        earned: state.elapsedTime >= 600000
      }
    ];
  }

  /**
   * Animate a number change
   */
  animateNumber(element, from, to, options = {}) {
    const duration = options.duration || 500;
    const formatter = options.format || ((value) => Math.round(value).toString());

    const startTime = performance.now();
    const difference = to - from;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (easeOutQuart)
      const eased = 1 - Math.pow(1 - progress, 4);

      const currentValue = from + difference * eased;
      element.textContent = formatter(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.textContent = formatter(to);
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Show level up effect
   */
  showLevelUpEffect() {
    // Create level up notification
    const notification = document.createElement('div');
    notification.className = 'level-up-notification';
    notification.textContent = 'LEVEL UP!';
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(45deg, #4fc3f7, #9c27b0);
      color: white;
      padding: 20px 40px;
      border-radius: 10px;
      font-size: 2rem;
      font-weight: bold;
      z-index: 10001;
      animation: levelUpAnimation 2s ease-out forwards;
    `;

    document.body.appendChild(notification);

    // Remove after animation
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 2000);
  }

  /**
   * Show line clear effect
   */
  showLineClearEffect(lineCount) {
    const effects = {
      1: { text: 'SINGLE', color: '#4caf50' },
      2: { text: 'DOUBLE', color: '#ff9800' },
      3: { text: 'TRIPLE', color: '#f44336' },
      4: { text: 'TETRIS!', color: '#9c27b0' }
    };

    const effect = effects[lineCount];
    if (!effect) return;

    const notification = document.createElement('div');
    notification.className = 'line-clear-notification';
    notification.textContent = effect.text;
    notification.style.cssText = `
      position: fixed;
      top: 30%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: ${effect.color};
      color: white;
      padding: 15px 30px;
      border-radius: 8px;
      font-size: 1.5rem;
      font-weight: bold;
      z-index: 10001;
      animation: lineClearAnimation 1s ease-out forwards;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 1000);
  }

  /**
   * Save settings to localStorage
   */
  saveSettings() {
    const settings = {
      ...this.game.settings,
      timestamp: Date.now()
    };

    localStorage.setItem('fantastic-tetris-settings', JSON.stringify(settings));
    console.log('⚙️ Settings saved');
  }

  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
      const saved = localStorage.getItem('fantastic-tetris-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        Object.assign(this.game.settings, settings);
        console.log('⚙️ Settings loaded');
      }
    } catch (error) {
      console.warn('Failed to load settings:', error);
    }
  }

  /**
   * Export UI state
   */
  toJSON() {
    return {
      animationSettings: this.animationSettings,
      lastUpdate: Date.now()
    };
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    // Clear any running animations
    this.animations.clear();

    // Close all modals
    Object.values(this.modals).forEach(modal => modal.hide());

    console.log('🎨 UI Manager destroyed');
  }
}

/**
 * Modal helper class
 */
class Modal {
  constructor(element) {
    this.element = element;
    this.isVisible = false;
    this.callbacks = { close: [] };

    this.bindEvents();
  }

  bindEvents() {
    if (!this.element) return;

    // Close button
    const closeBtn = this.element.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // Click outside to close
    this.element.addEventListener('click', (event) => {
      if (event.target === this.element) {
        this.hide();
      }
    });

    // Escape key to close
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
  }

  show() {
    if (!this.element) return;

    this.element.classList.add('active');
    this.element.setAttribute('aria-hidden', 'false');
    this.isVisible = true;

    // Focus first focusable element
    const focusable = this.element.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable) {
      focusable.focus();
    }
  }

  hide() {
    if (!this.element) return;

    this.element.classList.remove('active');
    this.element.setAttribute('aria-hidden', 'true');
    this.isVisible = false;

    // Trigger close callbacks
    this.callbacks.close.forEach(callback => callback());
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  onClose(callback) {
    this.callbacks.close.push(callback);
  }
}