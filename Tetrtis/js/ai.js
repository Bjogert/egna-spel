/**
 * FANTASTIC TETRIS - AI ASSISTANT
 * Advanced AI system for piece placement suggestions and game analysis
 */

/**
 * AI algorithm weights for board evaluation
 */
const AI_WEIGHTS = {
  // Primary factors
  aggregateHeight: -0.510066,
  completedLines: 0.760666,
  holes: -0.35663,
  bumpiness: -0.184483,

  // Advanced factors
  wellDepth: -0.1,
  pillars: -0.05,
  tetrisReady: 0.2,
  tSpinReady: 0.15,
  blockades: -0.08,
  dependencies: -0.05
};

/**
 * T-Spin detection patterns
 */
const T_SPIN_PATTERNS = {
  // T-Spin Triple setups
  tst: [
    {
      name: 'LST Stacking',
      pattern: [
        [1, 0, 1],
        [1, 0, 1],
        [1, 1, 1]
      ],
      description: 'L-S-T stacking pattern'
    }
  ],

  // T-Spin Double setups
  tsd: [
    {
      name: 'TKI Opening',
      pattern: [
        [1, 0, 1],
        [1, 1, 1]
      ],
      description: 'T-Spin Double setup'
    }
  ]
};

export class AIAssistant {
  constructor(game) {
    this.game = game;
    this.enabled = false;
    this.difficulty = 'normal'; // easy, normal, hard, expert

    // AI state
    this.currentSuggestion = null;
    this.analysisCache = new Map();
    this.moveHistory = [];
    this.patternRecognition = new PatternRecognizer();

    // Performance settings
    this.settings = {
      maxDepth: 3,           // Lookahead depth
      maxPositions: 50,      // Max positions to evaluate per piece
      cacheSize: 1000,       // Analysis cache size
      updateFrequency: 100,  // ms between updates
      showHints: true,       // Show visual hints
      showReasons: true      // Show reasoning text
    };

    // Statistics
    this.stats = {
      suggestionsGiven: 0,
      correctPlacements: 0,
      analysisTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    };

    this.lastUpdate = 0;
    this.initialize();
  }

  /**
   * Initialize AI Assistant
   */
  initialize() {
    this.adjustDifficulty();
    console.log('🤖 AI Assistant initialized');
  }

  /**
   * Adjust AI settings based on difficulty
   */
  adjustDifficulty() {
    const difficultySettings = {
      easy: {
        maxDepth: 1,
        maxPositions: 20,
        showHints: true,
        showReasons: true,
        weights: { ...AI_WEIGHTS, completedLines: 1.0, holes: -0.2 }
      },
      normal: {
        maxDepth: 2,
        maxPositions: 35,
        showHints: true,
        showReasons: true,
        weights: AI_WEIGHTS
      },
      hard: {
        maxDepth: 3,
        maxPositions: 50,
        showHints: false,
        showReasons: true,
        weights: { ...AI_WEIGHTS, tSpinReady: 0.3, tetrisReady: 0.4 }
      },
      expert: {
        maxDepth: 4,
        maxPositions: 75,
        showHints: false,
        showReasons: false,
        weights: { ...AI_WEIGHTS, tSpinReady: 0.5, tetrisReady: 0.6 }
      }
    };

    const config = difficultySettings[this.difficulty] || difficultySettings.normal;
    Object.assign(this.settings, config);
    this.weights = config.weights;
  }

  /**
   * Main update loop
   */
  update() {
    if (!this.enabled || !this.game.currentPiece) return;

    const now = Date.now();
    if (now - this.lastUpdate < this.settings.updateFrequency) return;

    this.lastUpdate = now;
    this.generateSuggestion();
  }

  /**
   * Generate AI suggestion for current piece
   */
  async generateSuggestion() {
    const startTime = performance.now();

    try {
      const suggestion = await this.analyzeCurrentPosition();

      if (suggestion) {
        this.currentSuggestion = suggestion;
        this.displaySuggestion(suggestion);
        this.stats.suggestionsGiven++;
      }
    } catch (error) {
      console.warn('AI analysis error:', error);
    }

    this.stats.analysisTime += performance.now() - startTime;
  }

  /**
   * Analyze current board position
   */
  async analyzeCurrentPosition() {
    const { currentPiece, board, nextPieces } = this.game;
    if (!currentPiece || !board) return null;

    // Create cache key
    const cacheKey = this.createCacheKey(board, currentPiece, nextPieces.slice(0, 2));

    // Check cache
    if (this.analysisCache.has(cacheKey)) {
      this.stats.cacheHits++;
      return this.analysisCache.get(cacheKey);
    }

    this.stats.cacheMisses++;

    // Generate all possible positions for current piece
    const positions = this.getAllPossiblePositions(currentPiece, board);

    // Evaluate each position
    const evaluatedPositions = await Promise.all(
      positions.map(pos => this.evaluatePosition(pos, board, nextPieces))
    );

    // Sort by score and get best
    evaluatedPositions.sort((a, b) => b.score - a.score);
    const bestPosition = evaluatedPositions[0];

    if (bestPosition) {
      const suggestion = {
        position: bestPosition.position,
        score: bestPosition.score,
        reasoning: bestPosition.reasoning,
        confidence: this.calculateConfidence(evaluatedPositions),
        alternatives: evaluatedPositions.slice(1, 3) // Top 2 alternatives
      };

      // Cache result
      this.cacheResult(cacheKey, suggestion);
      return suggestion;
    }

    return null;
  }

  /**
   * Get all possible positions for a piece
   */
  getAllPossiblePositions(piece, board) {
    const positions = [];
    const rotations = this.getAllRotations(piece);

    rotations.forEach((rotatedPiece, rotationIndex) => {
      // Try all horizontal positions
      for (let x = -rotatedPiece.shape[0].length + 1; x < board.width; x++) {
        const testPiece = {
          ...rotatedPiece,
          x: x,
          y: 0
        };

        // Drop to lowest position
        while (!board.isColliding(testPiece, 0, 1)) {
          testPiece.y++;
        }

        // Check if final position is valid
        if (!board.isColliding(testPiece, 0, 0) && testPiece.y >= 0) {
          positions.push({
            ...testPiece,
            rotation: rotationIndex,
            dropDistance: testPiece.y
          });
        }
      }
    });

    return positions.slice(0, this.settings.maxPositions);
  }

  /**
   * Get all rotations of a piece
   */
  getAllRotations(piece) {
    const rotations = [];
    const maxRotations = piece.shapes ? piece.shapes.length : 4;

    for (let i = 0; i < maxRotations; i++) {
      const rotatedPiece = { ...piece };
      rotatedPiece.rotation = i;
      rotatedPiece.shape = piece.shapes ? piece.shapes[i] : this.rotatePiece(piece.shape, i);
      rotations.push(rotatedPiece);
    }

    return rotations;
  }

  /**
   * Rotate a piece matrix
   */
  rotatePiece(shape, rotations) {
    let result = shape;

    for (let i = 0; i < rotations; i++) {
      const size = result.length;
      const rotated = Array(size).fill(null).map(() => Array(size).fill(0));

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          rotated[x][size - 1 - y] = result[y][x];
        }
      }

      result = rotated;
    }

    return result;
  }

  /**
   * Evaluate a position with lookahead
   */
  async evaluatePosition(position, board, nextPieces) {
    // Simulate placing the piece
    const simulatedBoard = board.clone();
    simulatedBoard.placePiece(position);
    const linesCleared = simulatedBoard.clearLines();

    // Calculate immediate score
    let score = this.evaluateBoard(simulatedBoard);

    // Add line clear bonus
    score += linesCleared * this.weights.completedLines * 100;

    // Lookahead analysis
    if (this.settings.maxDepth > 1 && nextPieces.length > 0) {
      const lookaheadScore = await this.lookaheadAnalysis(
        simulatedBoard,
        nextPieces.slice(0, this.settings.maxDepth - 1),
        1
      );
      score += lookaheadScore * 0.5; // Weight future moves less
    }

    // Pattern recognition bonuses
    const patternScore = this.patternRecognition.analyze(simulatedBoard, position);
    score += patternScore;

    // Generate reasoning
    const reasoning = this.generateReasoning(position, simulatedBoard, linesCleared, score);

    return {
      position,
      score,
      reasoning,
      linesCleared,
      boardState: simulatedBoard
    };
  }

  /**
   * Lookahead analysis for future pieces
   */
  async lookaheadAnalysis(board, nextPieces, depth) {
    if (depth >= this.settings.maxDepth || nextPieces.length === 0) {
      return 0;
    }

    const nextPiece = nextPieces[0];
    const positions = this.getAllPossiblePositions(nextPiece, board);

    let bestScore = -Infinity;

    for (const position of positions.slice(0, 10)) { // Limit for performance
      const simulatedBoard = board.clone();
      simulatedBoard.placePiece(position);
      simulatedBoard.clearLines();

      let score = this.evaluateBoard(simulatedBoard);

      if (depth < this.settings.maxDepth - 1) {
        const futureScore = await this.lookaheadAnalysis(
          simulatedBoard,
          nextPieces.slice(1),
          depth + 1
        );
        score += futureScore * 0.7; // Diminishing weight for deeper analysis
      }

      bestScore = Math.max(bestScore, score);
    }

    return bestScore;
  }

  /**
   * Evaluate board state using weighted factors
   */
  evaluateBoard(board) {
    const stats = board.getStatistics();

    let score = 0;

    // Primary factors
    score += stats.height * this.weights.aggregateHeight;
    score += stats.holes * this.weights.holes;
    score += stats.roughness * this.weights.bumpiness;
    score += stats.completedLines * this.weights.completedLines;

    // Advanced factors
    score += this.calculateWellDepth(board) * this.weights.wellDepth;
    score += this.calculatePillars(board) * this.weights.pillars;
    score += this.checkTetrisReady(board) * this.weights.tetrisReady;
    score += this.checkTSpinReady(board) * this.weights.tSpinReady;
    score += this.calculateBlockades(board) * this.weights.blockades;

    return score;
  }

  /**
   * Calculate well depth for Tetris setups
   */
  calculateWellDepth(board) {
    let maxWellDepth = 0;

    for (let x = 0; x < board.width; x++) {
      const leftHeight = x > 0 ? board.getColumnHeight(x - 1) : board.height;
      const rightHeight = x < board.width - 1 ? board.getColumnHeight(x + 1) : board.height;
      const currentHeight = board.getColumnHeight(x);

      const wellDepth = Math.min(leftHeight, rightHeight) - currentHeight;
      if (wellDepth > 0) {
        maxWellDepth = Math.max(maxWellDepth, wellDepth);
      }
    }

    return maxWellDepth;
  }

  /**
   * Calculate pillar formations
   */
  calculatePillars(board) {
    let pillars = 0;

    for (let x = 1; x < board.width - 1; x++) {
      const leftHeight = board.getColumnHeight(x - 1);
      const rightHeight = board.getColumnHeight(x + 1);
      const currentHeight = board.getColumnHeight(x);

      if (currentHeight > leftHeight + 2 && currentHeight > rightHeight + 2) {
        pillars++;
      }
    }

    return pillars;
  }

  /**
   * Check if board is ready for Tetris (4-line clear)
   */
  checkTetrisReady(board) {
    // Look for deep well suitable for I-piece
    const rightmostWell = this.calculateWellDepth(board);
    return rightmostWell >= 4 ? 1 : 0;
  }

  /**
   * Check if board is ready for T-Spin
   */
  checkTSpinReady(board) {
    // Simplified T-Spin detection
    // Look for T-Spin setups in the board
    return this.patternRecognition.detectTSpinSetups(board);
  }

  /**
   * Calculate blockade problems
   */
  calculateBlockades(board) {
    let blockades = 0;

    for (let y = 0; y < board.height - 1; y++) {
      for (let x = 0; x < board.width; x++) {
        if (!board.getCell(x, y) && board.getCell(x, y + 1)) {
          // Empty cell with filled cell below - potential blockade
          blockades++;
        }
      }
    }

    return blockades;
  }

  /**
   * Generate human-readable reasoning
   */
  generateReasoning(position, boardState, linesCleared, score) {
    const reasons = [];

    if (linesCleared > 0) {
      const clearTypes = ['', 'Single', 'Double', 'Triple', 'Tetris'];
      reasons.push(`Clears ${linesCleared} line(s) (${clearTypes[linesCleared]})`);
    }

    const stats = boardState.getStatistics();

    if (stats.holes === 0) {
      reasons.push('Creates no holes');
    } else if (stats.holes <= 2) {
      reasons.push('Minimizes holes');
    }

    if (this.checkTetrisReady(boardState)) {
      reasons.push('Sets up Tetris opportunity');
    }

    if (this.checkTSpinReady(boardState)) {
      reasons.push('Creates T-Spin setup');
    }

    if (stats.roughness <= 3) {
      reasons.push('Maintains flat surface');
    }

    if (reasons.length === 0) {
      reasons.push('Best available option');
    }

    return reasons.join(', ');
  }

  /**
   * Calculate confidence in suggestion
   */
  calculateConfidence(evaluatedPositions) {
    if (evaluatedPositions.length < 2) return 1.0;

    const best = evaluatedPositions[0];
    const second = evaluatedPositions[1];

    const scoreDifference = best.score - second.score;
    const maxDifference = Math.abs(best.score) * 0.2; // 20% of best score

    return Math.min(1.0, scoreDifference / maxDifference);
  }

  /**
   * Display suggestion to user
   */
  displaySuggestion(suggestion) {
    if (!this.settings.showReasons) return;

    const message = `${suggestion.reasoning} (${(suggestion.confidence * 100).toFixed(0)}% confidence)`;

    // Update UI
    if (this.game.ui) {
      this.game.ui.updateAISuggestion(message);
    }

    // Visual hints (if enabled)
    if (this.settings.showHints) {
      this.showVisualHint(suggestion.position);
    }
  }

  /**
   * Show visual hint on game board
   */
  showVisualHint(position) {
    // This would integrate with the rendering system
    // to show where the AI suggests placing the piece
    console.log('💡 AI suggests:', position);
  }

  /**
   * Cache management
   */
  createCacheKey(board, piece, nextPieces) {
    const boardKey = board.grid.map(row => row.map(cell => cell ? '1' : '0').join('')).join('|');
    const pieceKey = `${piece.type}_${piece.rotation}`;
    const nextKey = nextPieces.map(p => p.type).join('');

    return `${boardKey}_${pieceKey}_${nextKey}`;
  }

  cacheResult(key, result) {
    if (this.analysisCache.size >= this.settings.cacheSize) {
      // Remove oldest entries
      const keysToDelete = Array.from(this.analysisCache.keys()).slice(0, 100);
      keysToDelete.forEach(k => this.analysisCache.delete(k));
    }

    this.analysisCache.set(key, result);
  }

  /**
   * Learning and adaptation
   */
  recordPlayerMove(position) {
    this.moveHistory.push({
      position,
      suggestion: this.currentSuggestion,
      timestamp: Date.now()
    });

    // Analyze if player followed suggestion
    if (this.currentSuggestion && this.isPositionSimilar(position, this.currentSuggestion.position)) {
      this.stats.correctPlacements++;
    }

    // Keep history manageable
    if (this.moveHistory.length > 100) {
      this.moveHistory = this.moveHistory.slice(-50);
    }
  }

  isPositionSimilar(pos1, pos2) {
    return pos1.x === pos2.x && pos1.y === pos2.y && pos1.rotation === pos2.rotation;
  }

  /**
   * Settings and configuration
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log('🤖 AI Assistant:', enabled ? 'enabled' : 'disabled');
  }

  setDifficulty(difficulty) {
    this.difficulty = difficulty;
    this.adjustDifficulty();
    console.log('🤖 AI difficulty set to:', difficulty);
  }

  /**
   * Statistics and debugging
   */
  getStatistics() {
    const accuracy = this.stats.suggestionsGiven > 0
      ? (this.stats.correctPlacements / this.stats.suggestionsGiven) * 100
      : 0;

    return {
      ...this.stats,
      accuracy: accuracy.toFixed(1) + '%',
      cacheSize: this.analysisCache.size,
      avgAnalysisTime: this.stats.suggestionsGiven > 0
        ? (this.stats.analysisTime / this.stats.suggestionsGiven).toFixed(2) + 'ms'
        : '0ms'
    };
  }

  /**
   * Export AI state
   */
  toJSON() {
    return {
      enabled: this.enabled,
      difficulty: this.difficulty,
      settings: this.settings,
      stats: this.stats
    };
  }

  /**
   * Import AI state
   */
  fromJSON(data) {
    if (data.enabled !== undefined) this.enabled = data.enabled;
    if (data.difficulty) this.setDifficulty(data.difficulty);
    if (data.settings) Object.assign(this.settings, data.settings);
    if (data.stats) Object.assign(this.stats, data.stats);
  }

  /**
   * Cleanup
   */
  destroy() {
    this.analysisCache.clear();
    this.moveHistory = [];
    console.log('🤖 AI Assistant destroyed');
  }
}

/**
 * Pattern Recognition System
 */
class PatternRecognizer {
  constructor() {
    this.knownPatterns = new Map();
    this.setupPatterns();
  }

  setupPatterns() {
    // Setup known Tetris patterns
    this.knownPatterns.set('tetris_well', {
      pattern: [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 0]
      ],
      value: 50,
      description: 'Tetris well setup'
    });
  }

  analyze(board, position) {
    let score = 0;

    // Check for T-Spin setups
    score += this.detectTSpinSetups(board) * 30;

    // Check for Tetris setups
    score += this.detectTetrisSetups(board) * 20;

    // Check for opening patterns
    score += this.detectOpeningPatterns(board) * 10;

    return score;
  }

  detectTSpinSetups(board) {
    // Simplified T-Spin detection
    let tSpinSetups = 0;

    for (let y = 0; y < board.height - 2; y++) {
      for (let x = 1; x < board.width - 1; x++) {
        if (this.checkTSpinPattern(board, x, y)) {
          tSpinSetups++;
        }
      }
    }

    return tSpinSetups;
  }

  checkTSpinPattern(board, x, y) {
    // Check for basic T-Spin double setup
    const pattern = [
      [true, false, true],
      [true, true, true]
    ];

    for (let py = 0; py < pattern.length; py++) {
      for (let px = 0; px < pattern[py].length; px++) {
        const boardX = x + px - 1;
        const boardY = y + py;

        if (boardX < 0 || boardX >= board.width || boardY < 0 || boardY >= board.height) {
          continue;
        }

        const shouldBeEmpty = !pattern[py][px];
        const isEmpty = !board.getCell(boardX, boardY);

        if (shouldBeEmpty !== isEmpty) {
          return false;
        }
      }
    }

    return true;
  }

  detectTetrisSetups(board) {
    // Look for 9-wide setup with deep well
    let tetrisSetups = 0;

    for (let x = 0; x < board.width; x++) {
      const height = board.getColumnHeight(x);
      const adjacentHeights = [
        x > 0 ? board.getColumnHeight(x - 1) : 0,
        x < board.width - 1 ? board.getColumnHeight(x + 1) : 0
      ];

      const avgAdjacent = adjacentHeights.reduce((a, b) => a + b) / adjacentHeights.length;

      if (avgAdjacent - height >= 4) {
        tetrisSetups++;
      }
    }

    return tetrisSetups;
  }

  detectOpeningPatterns(board) {
    // Detect efficient opening builds
    const totalHeight = board.getAggregateHeight();

    if (totalHeight < 40) { // Early game
      const rightSide = board.getColumnHeight(board.width - 1);
      const leftSide = board.getColumnHeight(0);

      // Reward balanced builds
      if (Math.abs(rightSide - leftSide) <= 2) {
        return 1;
      }
    }

    return 0;
  }
}