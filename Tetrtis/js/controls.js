/**
 * FANTASTIC TETRIS - INPUT CONTROLLER
 * Handles keyboard, mouse, touch, and gamepad input
 */

/**
 * Default key bindings
 */
const DEFAULT_KEYBINDINGS = {
  // Movement
  moveLeft: ['ArrowLeft', 'KeyA'],
  moveRight: ['ArrowRight', 'KeyD'],
  softDrop: ['ArrowDown', 'KeyS'],
  hardDrop: ['Space'],

  // Rotation
  rotateClockwise: ['ArrowUp', 'KeyW', 'KeyX'],
  rotateCounterClockwise: ['KeyZ', 'KeyQ'],

  // Actions
  hold: ['KeyC', 'Shift'],
  pause: ['KeyP', 'Escape'],
  restart: ['KeyR'],

  // UI
  toggleSettings: ['F1'],
  toggleHelp: ['F2'],
  toggleFullscreen: ['F11'],

  // Debug (development only)
  toggleDebug: ['F12'],
  forceLineClear: ['KeyL'], // Ctrl+L
  spawnSpecificPiece: ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7']
};

/**
 * Input timing configuration
 */
const INPUT_TIMING = {
  // Auto-repeat rates (ARR)
  initialDelay: 300, // ms before repeat starts
  repeatRate: 50,    // ms between repeats

  // Delayed Auto Shift (DAS)
  dasDelay: 100,     // ms before DAS starts
  dasRate: 30,       // ms between DAS movements

  // Lock delay
  lockDelay: 500,    // ms before piece locks

  // Soft drop
  softDropRate: 50,  // ms between soft drop steps

  // Double tap detection
  doubleTapWindow: 300 // ms window for double tap
};

export class InputController {
  constructor(game) {
    this.game = game;
    this.keybindings = { ...DEFAULT_KEYBINDINGS };
    this.timing = { ...INPUT_TIMING };

    // Input state
    this.pressedKeys = new Set();
    this.keyStates = new Map();
    this.lastKeyTime = new Map();
    this.repeatTimers = new Map();

    // DAS (Delayed Auto Shift) state
    this.dasLeft = { active: false, timer: 0, started: false };
    this.dasRight = { active: false, timer: 0, started: false };

    // Mobile touch state
    this.touchState = {
      active: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      lastTap: 0,
      swipeThreshold: 50,
      tapThreshold: 10
    };

    // Gamepad state
    this.gamepadState = {
      connected: false,
      index: -1,
      deadzone: 0.3,
      lastButtons: [],
      stickState: { x: 0, y: 0 }
    };

    // Input statistics
    this.stats = {
      keyPresses: 0,
      mouseMoves: 0,
      touches: 0,
      gamepadInputs: 0,
      pps: 0, // Presses per second
      apm: 0  // Actions per minute
    };

    this.initialize();
  }

  /**
   * Initialize input handlers
   */
  initialize() {
    this.bindKeyboardEvents();
    this.bindMouseEvents();
    this.bindTouchEvents();
    this.bindGamepadEvents();
    this.bindUIEvents();

    console.log('🎮 Input controller initialized');
  }

  /**
   * Bind keyboard event listeners
   */
  bindKeyboardEvents() {
    document.addEventListener('keydown', (event) => this.handleKeyDown(event));
    document.addEventListener('keyup', (event) => this.handleKeyUp(event));

    // Prevent default browser actions for game keys
    document.addEventListener('keydown', (event) => {
      if (this.isGameKey(event.code) && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
      }
    });
  }

  /**
   * Handle key down events
   */
  handleKeyDown(event) {
    const { code } = event;

    // Ignore if already pressed (prevent key repeat from OS)
    if (this.pressedKeys.has(code)) return;

    this.pressedKeys.add(code);
    this.keyStates.set(code, {
      pressed: true,
      timestamp: Date.now(),
      repeat: false
    });

    this.stats.keyPresses++;

    // Handle immediate actions (non-repeating)
    this.handleImmediateAction(code, event);

    // Setup auto-repeat for movement keys
    this.setupAutoRepeat(code);

    // Handle DAS for horizontal movement
    this.handleDASStart(code);
  }

  /**
   * Handle key up events
   */
  handleKeyUp(event) {
    const { code } = event;

    this.pressedKeys.delete(code);
    this.keyStates.delete(code);

    // Clear auto-repeat timer
    if (this.repeatTimers.has(code)) {
      clearTimeout(this.repeatTimers.get(code));
      this.repeatTimers.delete(code);
    }

    // Handle DAS stop
    this.handleDASStop(code);
  }

  /**
   * Handle immediate (non-repeating) actions
   */
  handleImmediateAction(code, event) {
    // Rotation
    if (this.isKeyBound(code, 'rotateClockwise')) {
      this.game.rotatePiece(1);
      return;
    }

    if (this.isKeyBound(code, 'rotateCounterClockwise')) {
      this.game.rotatePiece(-1);
      return;
    }

    // Hard drop
    if (this.isKeyBound(code, 'hardDrop')) {
      this.game.hardDropPiece();
      return;
    }

    // Hold
    if (this.isKeyBound(code, 'hold')) {
      this.game.holdPiece();
      return;
    }

    // Pause
    if (this.isKeyBound(code, 'pause')) {
      this.game.togglePause();
      return;
    }

    // Restart
    if (this.isKeyBound(code, 'restart')) {
      if (event.ctrlKey || this.game.state.isGameOver) {
        this.game.newGame();
      }
      return;
    }

    // UI toggles
    if (this.isKeyBound(code, 'toggleSettings')) {
      this.game.ui.toggleSettings();
      return;
    }

    if (this.isKeyBound(code, 'toggleHelp')) {
      this.game.ui.toggleHelp();
      return;
    }

    if (this.isKeyBound(code, 'toggleFullscreen')) {
      this.toggleFullscreen();
      return;
    }

    // Debug commands (development only)
    if (this.game.settings.debug) {
      this.handleDebugCommand(code, event);
    }
  }

  /**
   * Setup auto-repeat for movement keys
   */
  setupAutoRepeat(code) {
    const isMovementKey = this.isKeyBound(code, 'moveLeft') ||
                         this.isKeyBound(code, 'moveRight') ||
                         this.isKeyBound(code, 'softDrop');

    if (!isMovementKey) return;

    // Initial delay before repeat starts
    const timer = setTimeout(() => {
      this.startAutoRepeat(code);
    }, this.timing.initialDelay);

    this.repeatTimers.set(code, timer);
  }

  /**
   * Start auto-repeat for a key
   */
  startAutoRepeat(code) {
    if (!this.pressedKeys.has(code)) return;

    // Execute the action
    this.executeMovementAction(code, true);

    // Schedule next repeat
    const timer = setTimeout(() => {
      this.startAutoRepeat(code);
    }, this.timing.repeatRate);

    this.repeatTimers.set(code, timer);
  }

  /**
   * Execute movement actions
   */
  executeMovementAction(code, isRepeat = false) {
    if (this.isKeyBound(code, 'moveLeft')) {
      this.game.movePiece(-1, 0);
    } else if (this.isKeyBound(code, 'moveRight')) {
      this.game.movePiece(1, 0);
    } else if (this.isKeyBound(code, 'softDrop')) {
      this.game.softDropPiece();
    }

    // Mark as repeat for statistics
    if (isRepeat) {
      const state = this.keyStates.get(code);
      if (state) state.repeat = true;
    }
  }

  /**
   * Handle DAS (Delayed Auto Shift) start
   */
  handleDASStart(code) {
    if (this.isKeyBound(code, 'moveLeft')) {
      this.dasLeft.active = true;
      this.dasLeft.timer = 0;
      this.dasLeft.started = false;
      // Execute immediate movement
      this.game.movePiece(-1, 0);
    } else if (this.isKeyBound(code, 'moveRight')) {
      this.dasRight.active = true;
      this.dasRight.timer = 0;
      this.dasRight.started = false;
      // Execute immediate movement
      this.game.movePiece(1, 0);
    }
  }

  /**
   * Handle DAS stop
   */
  handleDASStop(code) {
    if (this.isKeyBound(code, 'moveLeft')) {
      this.dasLeft.active = false;
      this.dasLeft.started = false;
    } else if (this.isKeyBound(code, 'moveRight')) {
      this.dasRight.active = false;
      this.dasRight.started = false;
    }
  }

  /**
   * Update DAS timers (called from game loop)
   */
  updateDAS(deltaTime) {
    this.updateDASDirection(this.dasLeft, -1, deltaTime);
    this.updateDASDirection(this.dasRight, 1, deltaTime);
  }

  /**
   * Update DAS for a specific direction
   */
  updateDASDirection(das, direction, deltaTime) {
    if (!das.active) return;

    das.timer += deltaTime;

    if (!das.started && das.timer >= this.timing.dasDelay) {
      das.started = true;
      das.timer = 0;
    }

    if (das.started && das.timer >= this.timing.dasRate) {
      this.game.movePiece(direction, 0);
      das.timer = 0;
    }
  }

  /**
   * Bind mouse event listeners
   */
  bindMouseEvents() {
    const canvas = this.game.gameCanvas;

    canvas.addEventListener('click', (event) => this.handleMouseClick(event));
    canvas.addEventListener('wheel', (event) => this.handleMouseWheel(event));
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());

    // Mouse tracking for statistics
    canvas.addEventListener('mousemove', () => {
      this.stats.mouseMoves++;
    });
  }

  /**
   * Handle mouse click events
   */
  handleMouseClick(event) {
    event.preventDefault();

    if (event.button === 0) { // Left click
      this.game.rotatePiece(1);
    } else if (event.button === 2) { // Right click
      this.game.holdPiece();
    }
  }

  /**
   * Handle mouse wheel events
   */
  handleMouseWheel(event) {
    event.preventDefault();

    if (event.deltaY < 0) {
      this.game.rotatePiece(1);
    } else {
      this.game.rotatePiece(-1);
    }
  }

  /**
   * Bind touch event listeners
   */
  bindTouchEvents() {
    const canvas = this.game.gameCanvas;

    canvas.addEventListener('touchstart', (event) => this.handleTouchStart(event));
    canvas.addEventListener('touchmove', (event) => this.handleTouchMove(event));
    canvas.addEventListener('touchend', (event) => this.handleTouchEnd(event));

    // Prevent default touch behaviors
    canvas.addEventListener('touchstart', (event) => event.preventDefault());
    canvas.addEventListener('touchmove', (event) => event.preventDefault());
    canvas.addEventListener('touchend', (event) => event.preventDefault());

    // Bind mobile control buttons
    this.bindMobileControls();
  }

  /**
   * Handle touch start events
   */
  handleTouchStart(event) {
    const touch = event.touches[0];
    const now = Date.now();

    this.touchState.active = true;
    this.touchState.startX = touch.clientX;
    this.touchState.startY = touch.clientY;
    this.touchState.currentX = touch.clientX;
    this.touchState.currentY = touch.clientY;

    // Double tap detection
    if (now - this.touchState.lastTap < this.timing.doubleTapWindow) {
      this.game.hardDropPiece();
    }

    this.touchState.lastTap = now;
    this.stats.touches++;
  }

  /**
   * Handle touch move events
   */
  handleTouchMove(event) {
    if (!this.touchState.active) return;

    const touch = event.touches[0];
    this.touchState.currentX = touch.clientX;
    this.touchState.currentY = touch.clientY;
  }

  /**
   * Handle touch end events
   */
  handleTouchEnd(event) {
    if (!this.touchState.active) return;

    const deltaX = this.touchState.currentX - this.touchState.startX;
    const deltaY = this.touchState.currentY - this.touchState.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Determine gesture type
    if (distance < this.touchState.tapThreshold) {
      // Tap
      this.game.rotatePiece(1);
    } else if (distance > this.touchState.swipeThreshold) {
      // Swipe
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          this.game.movePiece(1, 0);
        } else {
          this.game.movePiece(-1, 0);
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          this.game.softDropPiece();
        }
      }
    }

    this.touchState.active = false;
  }

  /**
   * Bind mobile control buttons
   */
  bindMobileControls() {
    const buttons = {
      'mobile-left': () => this.game.movePiece(-1, 0),
      'mobile-right': () => this.game.movePiece(1, 0),
      'mobile-rotate': () => this.game.rotatePiece(1),
      'mobile-soft-drop': () => this.game.softDropPiece(),
      'mobile-hard-drop': () => this.game.hardDropPiece()
    };

    Object.entries(buttons).forEach(([id, action]) => {
      const button = document.getElementById(id);
      if (button) {
        button.addEventListener('touchstart', (event) => {
          event.preventDefault();
          action();
          button.classList.add('active');
        });

        button.addEventListener('touchend', (event) => {
          event.preventDefault();
          button.classList.remove('active');
        });
      }
    });
  }

  /**
   * Bind gamepad event listeners
   */
  bindGamepadEvents() {
    window.addEventListener('gamepadconnected', (event) => {
      this.gamepadState.connected = true;
      this.gamepadState.index = event.gamepad.index;
      console.log('🎮 Gamepad connected:', event.gamepad.id);
    });

    window.addEventListener('gamepaddisconnected', (event) => {
      this.gamepadState.connected = false;
      this.gamepadState.index = -1;
      console.log('🎮 Gamepad disconnected');
    });
  }

  /**
   * Update gamepad input (called from game loop)
   */
  updateGamepad() {
    if (!this.gamepadState.connected) return;

    const gamepad = navigator.getGamepads()[this.gamepadState.index];
    if (!gamepad) return;

    // Button mapping (standard gamepad)
    const buttons = {
      0: () => this.game.rotatePiece(1),    // A
      1: () => this.game.holdPiece(),       // B
      2: () => this.game.rotatePiece(-1),   // X
      3: () => this.game.hardDropPiece(),   // Y
      9: () => this.game.togglePause(),     // Start
      14: () => this.game.movePiece(-1, 0), // D-pad left
      15: () => this.game.movePiece(1, 0),  // D-pad right
      13: () => this.game.softDropPiece()   // D-pad down
    };

    // Handle button presses
    gamepad.buttons.forEach((button, index) => {
      const wasPressed = this.gamepadState.lastButtons[index];
      const isPressed = button.pressed;

      if (isPressed && !wasPressed && buttons[index]) {
        buttons[index]();
        this.stats.gamepadInputs++;
      }
    });

    // Handle analog sticks
    const leftStick = {
      x: gamepad.axes[0],
      y: gamepad.axes[1]
    };

    this.handleAnalogStick(leftStick);

    // Store button states for next frame
    this.gamepadState.lastButtons = gamepad.buttons.map(b => b.pressed);
  }

  /**
   * Handle analog stick input
   */
  handleAnalogStick(stick) {
    const { deadzone } = this.gamepadState;
    const { x, y } = stick;

    // Apply deadzone
    if (Math.abs(x) < deadzone && Math.abs(y) < deadzone) return;

    const prevState = this.gamepadState.stickState;

    // Horizontal movement
    if (x < -deadzone && prevState.x >= -deadzone) {
      this.game.movePiece(-1, 0);
    } else if (x > deadzone && prevState.x <= deadzone) {
      this.game.movePiece(1, 0);
    }

    // Vertical movement (soft drop)
    if (y > deadzone && prevState.y <= deadzone) {
      this.game.softDropPiece();
    }

    this.gamepadState.stickState = { x, y };
  }

  /**
   * Bind UI event listeners
   */
  bindUIEvents() {
    // Pause/resume buttons
    const pauseBtn = document.getElementById('pause-btn');
    const resumeBtn = document.getElementById('resume-btn');

    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this.game.togglePause());
    }

    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => this.game.resume());
    }

    // Restart button
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.game.newGame());
    }

    // Settings and help buttons
    const settingsBtn = document.getElementById('settings-btn');
    const helpBtn = document.getElementById('help-btn');

    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.game.ui.toggleSettings());
    }

    if (helpBtn) {
      helpBtn.addEventListener('click', () => this.game.ui.toggleHelp());
    }
  }

  /**
   * Handle debug commands
   */
  handleDebugCommand(code, event) {
    if (this.isKeyBound(code, 'toggleDebug')) {
      this.game.settings.showDebug = !this.game.settings.showDebug;
      console.log('🐛 Debug mode:', this.game.settings.showDebug);
    }

    if (this.isKeyBound(code, 'forceLineClear') && event.ctrlKey) {
      this.game.board.forceClearLines();
      console.log('🐛 Forced line clear');
    }

    // Spawn specific pieces (1-7 keys)
    const pieceTypes = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    const digitMatch = code.match(/^Digit(\d)$/);
    if (digitMatch && event.ctrlKey) {
      const digit = parseInt(digitMatch[1]) - 1;
      if (digit >= 0 && digit < pieceTypes.length) {
        this.game.tetrominoFactory.forceCreate(pieceTypes[digit]);
        console.log(`🐛 Spawned ${pieceTypes[digit]} piece`);
      }
    }
  }

  /**
   * Check if a key code is bound to an action
   */
  isKeyBound(code, action) {
    const bindings = this.keybindings[action] || [];
    return bindings.includes(code);
  }

  /**
   * Check if a key is a game key
   */
  isGameKey(code) {
    return Object.values(this.keybindings).flat().includes(code);
  }

  /**
   * Update input controller (called from game loop)
   */
  update(deltaTime) {
    this.updateDAS(deltaTime);
    this.updateGamepad();
    this.updateStatistics();
  }

  /**
   * Update input statistics
   */
  updateStatistics() {
    const now = Date.now();

    // Calculate actions per minute and presses per second
    // This is a simplified calculation; in a real implementation,
    // you'd want to track actions over time windows

    this.stats.pps = this.stats.keyPresses / ((now - this.game.state.startTime) / 1000) || 0;
    this.stats.apm = this.stats.keyPresses * 60 / ((now - this.game.state.startTime) / 1000) || 0;
  }

  /**
   * Toggle fullscreen mode
   */
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Could not enter fullscreen:', err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.warn('Could not exit fullscreen:', err);
      });
    }
  }

  /**
   * Customize key bindings
   */
  setKeyBinding(action, keys) {
    if (!Array.isArray(keys)) keys = [keys];
    this.keybindings[action] = keys;
    console.log(`🎮 Key binding updated: ${action} = ${keys.join(', ')}`);
  }

  /**
   * Reset key bindings to default
   */
  resetKeyBindings() {
    this.keybindings = { ...DEFAULT_KEYBINDINGS };
    console.log('🎮 Key bindings reset to default');
  }

  /**
   * Get input statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      dasState: {
        left: { ...this.dasLeft },
        right: { ...this.dasRight }
      },
      gamepadConnected: this.gamepadState.connected
    };
  }

  /**
   * Export input settings
   */
  toJSON() {
    return {
      keybindings: this.keybindings,
      timing: this.timing,
      gamepadDeadzone: this.gamepadState.deadzone
    };
  }

  /**
   * Import input settings
   */
  fromJSON(data) {
    if (data.keybindings) {
      Object.assign(this.keybindings, data.keybindings);
    }
    if (data.timing) {
      Object.assign(this.timing, data.timing);
    }
    if (data.gamepadDeadzone !== undefined) {
      this.gamepadState.deadzone = data.gamepadDeadzone;
    }
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    // Clear all timers
    this.repeatTimers.forEach(timer => clearTimeout(timer));
    this.repeatTimers.clear();

    // Remove event listeners would go here in a real implementation
    // For brevity, we'll just log the cleanup
    console.log('🎮 Input controller destroyed');
  }
}