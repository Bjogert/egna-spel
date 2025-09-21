/**
 * FANTASTIC TETRIS - MAIN GAME ENGINE
 * Advanced Tetris implementation with modern web technologies
 */

import { TetrisBoard } from './board.js';
import { TetrominoFactory } from './pieces.js';
import { InputController } from './controls.js';
import { UIManager } from './ui.js';
import { AudioManager } from './audio.js';
import { AIAssistant } from './ai.js';

class FantasticTetris {
  constructor() {
    // Game State
    this.state = {
      isPlaying: false,
      isPaused: false,
      isGameOver: false,
      isLoading: true,
      score: 0,
      level: 1,
      lines: 0,
      combo: 0,
      startTime: null,
      elapsedTime: 0
    };

    // Game Settings
    this.settings = {
      dropInterval: 1000,
      softDropInterval: 50,
      lockDelay: 500,
      enableGhost: true,
      enableAI: false,
      enableSounds: true,
      enableMusic: true,
      theme: 'dark',
      difficulty: 'normal'
    };

    // Performance Monitoring
    this.performance = {
      fps: 60,
      pps: 0, // Pieces per second
      frameCount: 0,
      lastFrameTime: 0,
      lastStatsUpdate: 0
    };

    // Game Objects
    this.board = null;
    this.tetrominoFactory = null;
    this.currentPiece = null;
    this.holdPiece = null;
    this.nextPieces = [];
    this.ghostPiece = null;

    // Managers
    this.ui = null;
    this.audio = null;
    this.input = null;
    this.ai = null;

    // Canvas Elements
    this.gameCanvas = null;
    this.gameCtx = null;
    this.ghostCanvas = null;
    this.ghostCtx = null;
    this.effectsCanvas = null;
    this.effectsCtx = null;

    // Animation and Timing
    this.animationId = null;
    this.lastDropTime = 0;
    this.lastMoveTime = 0;
    this.dropTimer = 0;
    this.lockTimer = 0;
    this.isLocking = false;

    // Particle Effects
    this.particles = [];
    this.effectsQueue = [];

    // Statistics
    this.stats = {
      totalPieces: 0,
      totalLines: 0,
      singleLines: 0,
      doubleLines: 0,
      tripleLines: 0,
      tetrisLines: 0,
      tSpins: 0,
      perfectClears: 0,
      maxCombo: 0,
      piecesPlaced: {
        I: 0, O: 0, T: 0, S: 0, Z: 0, J: 0, L: 0
      }
    };

    // Initialize game
    this.init();
  }

  /**
   * Initialize the game
   */
  async init() {
    try {
      await this.loadAssets();
      this.setupCanvas();
      this.initializeManagers();
      this.bindEvents();
      this.startGameLoop();
      this.hideLoadingScreen();

      console.log('🎮 Fantastic Tetris initialized successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize game:', error);
      this.showError('Failed to load game. Please refresh and try again.');
    }
  }

  /**
   * Load game assets
   */
  async loadAssets() {
    const loadingProgress = document.getElementById('loading-progress');
    const loadingText = document.querySelector('.loading-text');

    const assets = [
      { type: 'audio', src: 'assets/sounds/background-music.mp3', name: 'bgMusic' },
      { type: 'audio', src: 'assets/sounds/piece-drop.mp3', name: 'pieceDrop' },
      { type: 'audio', src: 'assets/sounds/line-clear.mp3', name: 'lineClear' },
      { type: 'audio', src: 'assets/sounds/tetris.mp3', name: 'tetris' },
      { type: 'audio', src: 'assets/sounds/rotate.mp3', name: 'rotate' },
      { type: 'audio', src: 'assets/sounds/move.mp3', name: 'move' }
    ];

    let loaded = 0;
    const total = assets.length;

    for (const asset of assets) {
      try {
        loadingText.textContent = `Loading ${asset.name}...`;

        if (asset.type === 'audio') {
          // Audio loading will be handled by AudioManager
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        loaded++;
        const progress = (loaded / total) * 100;
        loadingProgress.style.width = `${progress}%`;

        // Simulate realistic loading time
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.warn(`Failed to load asset: ${asset.name}`, error);
      }
    }

    loadingText.textContent = 'Initializing game engine...';
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * Setup canvas elements
   */
  setupCanvas() {
    // Get canvas elements
    this.gameCanvas = document.getElementById('game-canvas');
    this.ghostCanvas = document.getElementById('ghost-canvas');
    this.effectsCanvas = document.getElementById('effects-canvas');

    if (!this.gameCanvas || !this.ghostCanvas || !this.effectsCanvas) {
      throw new Error('Canvas elements not found');
    }

    // Get 2D contexts
    this.gameCtx = this.gameCanvas.getContext('2d');
    this.ghostCtx = this.ghostCanvas.getContext('2d');
    this.effectsCtx = this.effectsCanvas.getContext('2d');

    // Configure canvas settings
    [this.gameCtx, this.ghostCtx, this.effectsCtx].forEach(ctx => {
      ctx.imageSmoothingEnabled = false;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
    });

    // Set canvas focus for keyboard input
    this.gameCanvas.tabIndex = 0;
    this.gameCanvas.focus();
  }

  /**
   * Initialize game managers
   */
  initializeManagers() {
    // Initialize board
    this.board = new TetrisBoard(10, 20);

    // Initialize tetromino factory
    this.tetrominoFactory = new TetrominoFactory();

    // Initialize managers
    this.ui = new UIManager(this);
    this.audio = new AudioManager(this.settings);
    this.input = new InputController(this);
    this.ai = new AIAssistant(this);

    // Initialize next pieces queue
    this.fillNextQueue();
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Window events
    window.addEventListener('beforeunload', () => this.saveGameState());
    window.addEventListener('focus', () => this.handleWindowFocus());
    window.addEventListener('blur', () => this.handleWindowBlur());

    // Visibility API for pause on tab switch
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state.isPlaying) {
        this.pause();
      }
    });

    // Error handling
    window.addEventListener('error', (event) => {
      console.error('Game error:', event.error);
      this.handleError(event.error);
    });
  }

  /**
   * Start the main game loop
   */
  startGameLoop() {
    const gameLoop = (timestamp) => {
      if (!this.state.isLoading) {
        this.update(timestamp);
        this.render(timestamp);
        this.updatePerformance(timestamp);
      }

      this.animationId = requestAnimationFrame(gameLoop);
    };

    gameLoop(performance.now());
  }

  /**
   * Main game update loop
   */
  update(timestamp) {
    if (!this.state.isPlaying || this.state.isPaused) return;

    const deltaTime = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;

    // Update timers
    this.updateTimers(deltaTime);

    // Update current piece
    if (this.currentPiece) {
      this.updatePiece(deltaTime);
    }

    // Update particles and effects
    this.updateParticles(deltaTime);

    // Update AI if enabled
    if (this.settings.enableAI && this.ai) {
      this.ai.update();
    }

    // Update elapsed time
    if (this.state.startTime) {
      this.state.elapsedTime = timestamp - this.state.startTime;
    }
  }

  /**
   * Update game timers
   */
  updateTimers(deltaTime) {
    // Drop timer
    this.dropTimer += deltaTime;
    if (this.dropTimer >= this.settings.dropInterval) {
      this.dropCurrentPiece();
      this.dropTimer = 0;
    }

    // Lock timer
    if (this.isLocking) {
      this.lockTimer += deltaTime;
      if (this.lockTimer >= this.settings.lockDelay) {
        this.lockCurrentPiece();
      }
    }
  }

  /**
   * Update current piece
   */
  updatePiece(deltaTime) {
    if (!this.currentPiece) return;

    // Check if piece should start locking
    if (this.board.isColliding(this.currentPiece, 0, 1)) {
      if (!this.isLocking) {
        this.isLocking = true;
        this.lockTimer = 0;
      }
    } else {
      this.isLocking = false;
      this.lockTimer = 0;
    }

    // Update ghost piece
    if (this.settings.enableGhost) {
      this.updateGhostPiece();
    }
  }

  /**
   * Update ghost piece position
   */
  updateGhostPiece() {
    if (!this.currentPiece) return;

    this.ghostPiece = { ...this.currentPiece };

    // Drop ghost piece to lowest possible position
    while (!this.board.isColliding(this.ghostPiece, 0, 1)) {
      this.ghostPiece.y++;
    }
  }

  /**
   * Update particle effects
   */
  updateParticles(deltaTime) {
    this.particles = this.particles.filter(particle => {
      particle.update(deltaTime);
      return particle.isAlive();
    });
  }

  /**
   * Main render loop
   */
  render(timestamp) {
    // Clear canvases
    this.clearCanvases();

    // Render game board
    this.renderBoard();

    // Render current piece
    if (this.currentPiece) {
      this.renderPiece(this.gameCtx, this.currentPiece, false);
    }

    // Render ghost piece
    if (this.ghostPiece && this.settings.enableGhost) {
      this.renderPiece(this.ghostCtx, this.ghostPiece, true);
    }

    // Render particles and effects
    this.renderParticles();

    // Render UI overlays
    this.renderOverlays();
  }

  /**
   * Clear all canvases
   */
  clearCanvases() {
    const { width, height } = this.gameCanvas;

    this.gameCtx.clearRect(0, 0, width, height);
    this.ghostCtx.clearRect(0, 0, width, height);
    this.effectsCtx.clearRect(0, 0, width, height);
  }

  /**
   * Render the game board
   */
  renderBoard() {
    const cellSize = 20;
    const { grid } = this.board;

    // Render placed pieces
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (grid[y][x]) {
          this.renderCell(this.gameCtx, x, y, grid[y][x], cellSize);
        }
      }
    }

    // Render grid lines
    this.renderGrid();
  }

  /**
   * Render grid lines
   */
  renderGrid() {
    const { width, height } = this.gameCanvas;
    const cellSize = 20;

    this.gameCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.gameCtx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= width; x += cellSize) {
      this.gameCtx.beginPath();
      this.gameCtx.moveTo(x, 0);
      this.gameCtx.lineTo(x, height);
      this.gameCtx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += cellSize) {
      this.gameCtx.beginPath();
      this.gameCtx.moveTo(0, y);
      this.gameCtx.lineTo(width, y);
      this.gameCtx.stroke();
    }
  }

  /**
   * Render a tetris piece
   */
  renderPiece(ctx, piece, isGhost = false) {
    const cellSize = 20;
    const { shape, x, y, color } = piece;

    for (let py = 0; py < shape.length; py++) {
      for (let px = 0; px < shape[py].length; px++) {
        if (shape[py][px]) {
          const renderX = x + px;
          const renderY = y + py;

          if (renderY >= 0) { // Only render visible cells
            this.renderCell(ctx, renderX, renderY, color, cellSize, isGhost);
          }
        }
      }
    }
  }

  /**
   * Render a single cell
   */
  renderCell(ctx, x, y, color, cellSize, isGhost = false) {
    const pixelX = x * cellSize;
    const pixelY = y * cellSize;

    if (isGhost) {
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(pixelX + 1, pixelY + 1, cellSize - 2, cellSize - 2);
      ctx.globalAlpha = 1;
    } else {
      // Main cell
      ctx.fillStyle = color;
      ctx.fillRect(pixelX, pixelY, cellSize, cellSize);

      // Cell border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(pixelX, pixelY, cellSize, cellSize);

      // Inner highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(pixelX + 1, pixelY + 1, cellSize - 2, 2);
    }
  }

  /**
   * Render particle effects
   */
  renderParticles() {
    this.particles.forEach(particle => {
      particle.render(this.effectsCtx);
    });
  }

  /**
   * Render UI overlays
   */
  renderOverlays() {
    // Render debug info if enabled
    if (this.settings.showDebug) {
      this.renderDebugInfo();
    }
  }

  /**
   * Render debug information
   */
  renderDebugInfo() {
    const ctx = this.effectsCtx;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 100);

    ctx.fillStyle = 'white';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';

    const debugInfo = [
      `FPS: ${this.performance.fps}`,
      `PPS: ${this.performance.pps.toFixed(1)}`,
      `Particles: ${this.particles.length}`,
      `State: ${this.state.isPlaying ? 'Playing' : 'Paused'}`
    ];

    debugInfo.forEach((text, index) => {
      ctx.fillText(text, 15, 25 + index * 15);
    });
  }

  /**
   * Update performance metrics
   */
  updatePerformance(timestamp) {
    this.performance.frameCount++;

    if (timestamp - this.performance.lastStatsUpdate >= 1000) {
      this.performance.fps = this.performance.frameCount;
      this.performance.frameCount = 0;
      this.performance.lastStatsUpdate = timestamp;

      // Update UI
      this.ui.updatePerformanceDisplay(this.performance);
    }
  }

  /**
   * Game Control Methods
   */

  /**
   * Start a new game
   */
  newGame() {
    this.resetGameState();
    this.board.clear();
    this.spawnNewPiece();
    this.state.isPlaying = true;
    this.state.isGameOver = false;
    this.state.startTime = performance.now();

    this.ui.updateDisplay();
    this.audio.playBackgroundMusic();

    console.log('🎮 New game started!');
  }

  /**
   * Pause/unpause the game
   */
  togglePause() {
    if (this.state.isGameOver) return;

    this.state.isPaused = !this.state.isPaused;

    if (this.state.isPaused) {
      this.pause();
    } else {
      this.resume();
    }
  }

  /**
   * Pause the game
   */
  pause() {
    if (!this.state.isPlaying || this.state.isPaused) return;

    this.state.isPaused = true;
    this.audio.pauseBackgroundMusic();
    this.ui.showPauseModal();

    console.log('⏸️ Game paused');
  }

  /**
   * Resume the game
   */
  resume() {
    if (!this.state.isPlaying || !this.state.isPaused) return;

    this.state.isPaused = false;
    this.audio.resumeBackgroundMusic();
    this.ui.hidePauseModal();
    this.gameCanvas.focus();

    console.log('▶️ Game resumed');
  }

  /**
   * End the game
   */
  gameOver() {
    this.state.isGameOver = true;
    this.state.isPlaying = false;

    this.audio.stopBackgroundMusic();
    this.audio.playGameOverSound();

    this.saveHighScore();
    this.ui.showGameOverModal();

    console.log('💀 Game Over! Final Score:', this.state.score);
  }

  /**
   * Piece Movement Methods
   */

  /**
   * Spawn a new tetromino piece
   */
  spawnNewPiece() {
    if (this.nextPieces.length === 0) {
      this.fillNextQueue();
    }

    this.currentPiece = this.nextPieces.shift();
    this.currentPiece.x = Math.floor((this.board.width - this.currentPiece.shape[0].length) / 2);
    this.currentPiece.y = 0;

    // Add new piece to next queue
    this.nextPieces.push(this.tetrominoFactory.createRandom());

    // Check for game over
    if (this.board.isColliding(this.currentPiece, 0, 0)) {
      this.gameOver();
      return;
    }

    this.stats.totalPieces++;
    this.stats.piecesPlaced[this.currentPiece.type]++;

    this.ui.updateNextPieces(this.nextPieces);
    this.updateGhostPiece();
  }

  /**
   * Fill the next pieces queue
   */
  fillNextQueue() {
    while (this.nextPieces.length < 3) {
      this.nextPieces.push(this.tetrominoFactory.createRandom());
    }
  }

  /**
   * Drop current piece by one row
   */
  dropCurrentPiece() {
    if (!this.currentPiece || !this.state.isPlaying) return;

    if (!this.board.isColliding(this.currentPiece, 0, 1)) {
      this.currentPiece.y++;
      this.updateGhostPiece();
    }
  }

  /**
   * Lock current piece in place
   */
  lockCurrentPiece() {
    if (!this.currentPiece) return;

    this.board.placePiece(this.currentPiece);
    this.audio.playPieceDropSound();

    const linesCleared = this.board.clearLines();
    if (linesCleared > 0) {
      this.handleLinesCleared(linesCleared);
    }

    this.currentPiece = null;
    this.ghostPiece = null;
    this.isLocking = false;
    this.lockTimer = 0;

    this.spawnNewPiece();
  }

  /**
   * Handle cleared lines
   */
  handleLinesCleared(count) {
    this.state.lines += count;
    this.stats.totalLines += count;

    // Update statistics
    switch (count) {
      case 1: this.stats.singleLines++; break;
      case 2: this.stats.doubleLines++; break;
      case 3: this.stats.tripleLines++; break;
      case 4: this.stats.tetrisLines++; break;
    }

    // Calculate score
    const baseScore = [0, 100, 300, 500, 800][count];
    const scoreGained = baseScore * this.state.level;
    this.state.score += scoreGained;

    // Update level
    const newLevel = Math.floor(this.state.lines / 10) + 1;
    if (newLevel > this.state.level) {
      this.state.level = newLevel;
      this.updateGameSpeed();
    }

    // Play sound
    if (count === 4) {
      this.audio.playTetrisSound();
    } else {
      this.audio.playLineClearSound();
    }

    // Create particles
    this.createLineClearEffect(count);

    this.ui.updateDisplay();
  }

  /**
   * Create line clear particle effect
   */
  createLineClearEffect(lineCount) {
    // Implementation for particle effects will be added later
    console.log(`✨ ${lineCount} line(s) cleared!`);
  }

  /**
   * Update game speed based on level
   */
  updateGameSpeed() {
    this.settings.dropInterval = Math.max(50, 1000 - (this.state.level - 1) * 50);
  }

  /**
   * Player Input Methods
   */

  /**
   * Rotate current piece
   */
  rotatePiece(direction = 1) {
    if (!this.currentPiece || !this.state.isPlaying || this.state.isPaused) return false;

    const success = this.currentPiece.rotate(direction, this.board);

    if (success) {
      this.updateGhostPiece();
      this.audio.playPieceRotateSound();

      // Reset lock timer on successful rotation
      if (this.isLocking) {
        this.lockTimer = 0;
      }
    }

    return success;
  }

  /**
   * Move current piece horizontally or vertically
   */
  movePiece(dx, dy = 0) {
    if (!this.currentPiece || !this.state.isPlaying || this.state.isPaused) return false;

    const success = this.currentPiece.move(dx, dy, this.board);

    if (success) {
      this.updateGhostPiece();

      if (dx !== 0) {
        this.audio.playPieceMoveSound();
      }

      // Reset lock timer on successful horizontal movement
      if (this.isLocking && dx !== 0) {
        this.lockTimer = 0;
      }
    }

    return success;
  }

  /**
   * Soft drop current piece (faster falling)
   */
  softDropPiece() {
    if (!this.currentPiece || !this.state.isPlaying || this.state.isPaused) return false;

    const success = this.movePiece(0, 1);

    if (success) {
      // Add soft drop points
      this.state.score += 1;
      this.ui.updateDisplay();
    }

    return success;
  }

  /**
   * Hard drop current piece (instant drop to bottom)
   */
  hardDropPiece() {
    if (!this.currentPiece || !this.state.isPlaying || this.state.isPaused) return false;

    const dropDistance = this.currentPiece.hardDrop(this.board);

    if (dropDistance > 0) {
      // Add hard drop points
      this.state.score += dropDistance * 2;
      this.updateGhostPiece();
      this.ui.updateDisplay();

      // Lock piece immediately
      this.lockCurrentPiece();
    }

    return dropDistance > 0;
  }

  /**
   * Hold current piece for later use
   */
  holdPiece() {
    if (!this.currentPiece || !this.state.isPlaying || this.state.isPaused) return false;

    // Can only hold once per piece spawn
    if (this.currentPiece.hasBeenHeld) return false;

    const pieceToHold = this.currentPiece;
    pieceToHold.hasBeenHeld = true;

    if (this.holdPiece) {
      // Swap current piece with held piece
      this.currentPiece = this.holdPiece;
      this.currentPiece.x = Math.floor((this.board.width - this.currentPiece.shape[0].length) / 2);
      this.currentPiece.y = 0;
      this.currentPiece.hasBeenHeld = false;
    } else {
      // Hold current piece and spawn new one
      this.spawnNewPiece();
    }

    this.holdPiece = pieceToHold;

    // Reset hold piece position
    this.holdPiece.x = 0;
    this.holdPiece.y = 0;
    this.holdPiece.rotation = 0;
    this.holdPiece.shape = this.holdPiece.shapes[0];

    this.updateGhostPiece();
    this.ui.updateHoldPiece(this.holdPiece);
    this.audio.playHoldSound();

    return true;
  }

  /**
   * Utility Methods
   */

  /**
   * Reset game state
   */
  resetGameState() {
    this.state.score = 0;
    this.state.level = 1;
    this.state.lines = 0;
    this.state.combo = 0;
    this.state.elapsedTime = 0;
    this.state.startTime = null;

    this.settings.dropInterval = 1000;

    Object.keys(this.stats.piecesPlaced).forEach(key => {
      this.stats.piecesPlaced[key] = 0;
    });

    this.stats.totalPieces = 0;
    this.stats.totalLines = 0;
  }

  /**
   * Save game state to localStorage
   */
  saveGameState() {
    const gameState = {
      settings: this.settings,
      highScore: this.getHighScore(),
      stats: this.stats
    };

    localStorage.setItem('fantastic-tetris-state', JSON.stringify(gameState));
  }

  /**
   * Load game state from localStorage
   */
  loadGameState() {
    try {
      const saved = localStorage.getItem('fantastic-tetris-state');
      if (saved) {
        const gameState = JSON.parse(saved);
        Object.assign(this.settings, gameState.settings || {});
        Object.assign(this.stats, gameState.stats || {});
      }
    } catch (error) {
      console.warn('Failed to load saved game state:', error);
    }
  }

  /**
   * Get high score
   */
  getHighScore() {
    const saved = localStorage.getItem('fantastic-tetris-highscore');
    return saved ? parseInt(saved, 10) : 0;
  }

  /**
   * Save high score
   */
  saveHighScore() {
    const currentHigh = this.getHighScore();
    if (this.state.score > currentHigh) {
      localStorage.setItem('fantastic-tetris-highscore', this.state.score.toString());
      console.log('🏆 New high score!', this.state.score);
    }
  }

  /**
   * Hide loading screen
   */
  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const gameContainer = document.getElementById('game-container');

    if (loadingScreen && gameContainer) {
      loadingScreen.style.opacity = '0';
      setTimeout(() => {
        loadingScreen.style.display = 'none';
        gameContainer.style.display = 'block';
        this.state.isLoading = false;
        this.gameCanvas.focus();

        // Auto-start the game
        console.log('🎮 Starting new game automatically...');
        this.newGame();
      }, 500);
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const loadingText = document.querySelector('.loading-text');
    if (loadingText) {
      loadingText.textContent = message;
      loadingText.style.color = '#f44336';
    }
  }

  /**
   * Handle window focus
   */
  handleWindowFocus() {
    if (this.gameCanvas) {
      this.gameCanvas.focus();
    }
  }

  /**
   * Handle window blur
   */
  handleWindowBlur() {
    if (this.state.isPlaying && !this.state.isPaused) {
      this.pause();
    }
  }

  /**
   * Handle errors
   */
  handleError(error) {
    console.error('Game error:', error);

    if (this.state.isPlaying) {
      this.pause();
    }

    // Could show error modal here
  }

  /**
   * Cleanup method
   */
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    this.saveGameState();

    if (this.audio) {
      this.audio.destroy();
    }

    if (this.input) {
      this.input.destroy();
    }

    console.log('🎮 Game destroyed');
  }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.tetrisGame = new FantasticTetris();
});

// Export for module usage
export { FantasticTetris };