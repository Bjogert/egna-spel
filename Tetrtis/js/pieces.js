/**
 * FANTASTIC TETRIS - TETROMINO PIECES SYSTEM
 * Manages all tetris piece types, rotations, and generation
 */

/**
 * Tetromino piece definitions with all rotations
 */
const TETROMINO_SHAPES = {
  I: {
    color: '#00f5ff',
    shapes: [
      [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ],
      [
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0]
      ],
      [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0]
      ],
      [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0]
      ]
    ]
  },

  O: {
    color: '#ffeb3b',
    shapes: [
      [
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ]
    ]
  },

  T: {
    color: '#9c27b0',
    shapes: [
      [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
      ],
      [
        [0, 1, 0],
        [0, 1, 1],
        [0, 1, 0]
      ],
      [
        [0, 0, 0],
        [1, 1, 1],
        [0, 1, 0]
      ],
      [
        [0, 1, 0],
        [1, 1, 0],
        [0, 1, 0]
      ]
    ]
  },

  S: {
    color: '#4caf50',
    shapes: [
      [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
      ],
      [
        [0, 1, 0],
        [0, 1, 1],
        [0, 0, 1]
      ],
      [
        [0, 0, 0],
        [0, 1, 1],
        [1, 1, 0]
      ],
      [
        [1, 0, 0],
        [1, 1, 0],
        [0, 1, 0]
      ]
    ]
  },

  Z: {
    color: '#f44336',
    shapes: [
      [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
      ],
      [
        [0, 0, 1],
        [0, 1, 1],
        [0, 1, 0]
      ],
      [
        [0, 0, 0],
        [1, 1, 0],
        [0, 1, 1]
      ],
      [
        [0, 1, 0],
        [1, 1, 0],
        [1, 0, 0]
      ]
    ]
  },

  J: {
    color: '#2196f3',
    shapes: [
      [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
      ],
      [
        [0, 1, 1],
        [0, 1, 0],
        [0, 1, 0]
      ],
      [
        [0, 0, 0],
        [1, 1, 1],
        [0, 0, 1]
      ],
      [
        [0, 1, 0],
        [0, 1, 0],
        [1, 1, 0]
      ]
    ]
  },

  L: {
    color: '#ff9800',
    shapes: [
      [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
      ],
      [
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 1]
      ],
      [
        [0, 0, 0],
        [1, 1, 1],
        [1, 0, 0]
      ],
      [
        [1, 1, 0],
        [0, 1, 0],
        [0, 1, 0]
      ]
    ]
  }
};

/**
 * Super Rotation System (SRS) kick data for wall kicks
 */
const SRS_KICK_DATA = {
  // Normal pieces (J, L, T, S, Z)
  normal: {
    '0->1': [[-1, 0], [-1, 1], [0, -2], [-1, -2]],
    '1->0': [[1, 0], [1, -1], [0, 2], [1, 2]],
    '1->2': [[1, 0], [1, -1], [0, 2], [1, 2]],
    '2->1': [[-1, 0], [-1, 1], [0, -2], [-1, -2]],
    '2->3': [[1, 0], [1, 1], [0, -2], [1, -2]],
    '3->2': [[-1, 0], [-1, -1], [0, 2], [-1, 2]],
    '3->0': [[-1, 0], [-1, -1], [0, 2], [-1, 2]],
    '0->3': [[1, 0], [1, 1], [0, -2], [1, -2]]
  },
  // I piece has different kick data
  I: {
    '0->1': [[-2, 0], [1, 0], [-2, -1], [1, 2]],
    '1->0': [[2, 0], [-1, 0], [2, 1], [-1, -2]],
    '1->2': [[-1, 0], [2, 0], [-1, 2], [2, -1]],
    '2->1': [[1, 0], [-2, 0], [1, -2], [-2, 1]],
    '2->3': [[2, 0], [-1, 0], [2, 1], [-1, -2]],
    '3->2': [[-2, 0], [1, 0], [-2, -1], [1, 2]],
    '3->0': [[1, 0], [-2, 0], [1, -2], [-2, 1]],
    '0->3': [[-1, 0], [2, 0], [-1, 2], [2, -1]]
  }
};

/**
 * Tetromino class representing a single tetris piece
 */
export class Tetromino {
  constructor(type, x = 0, y = 0, rotation = 0) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.rotation = rotation;
    this.color = TETROMINO_SHAPES[type].color;
    this.shapes = TETROMINO_SHAPES[type].shapes;
    this.shape = this.shapes[rotation] || this.shapes[0];

    // Metadata
    this.id = Math.random().toString(36).substr(2, 9);
    this.spawnTime = Date.now();
    this.lockTime = null;
    this.moveCount = 0;
    this.rotationCount = 0;
  }

  /**
   * Get the current shape matrix
   */
  getShape() {
    return this.shape;
  }

  /**
   * Get the bounding box of the piece
   */
  getBoundingBox() {
    const shape = this.getShape();
    let minX = shape[0].length;
    let maxX = -1;
    let minY = shape.length;
    let maxY = -1;

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }

    return {
      left: minX,
      right: maxX,
      top: minY,
      bottom: maxY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    };
  }

  /**
   * Get all filled cells relative to piece position
   */
  getFilledCells() {
    const cells = [];
    const shape = this.getShape();

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          cells.push({
            x: this.x + x,
            y: this.y + y
          });
        }
      }
    }

    return cells;
  }

  /**
   * Rotate the piece clockwise or counterclockwise
   */
  rotate(direction = 1, board = null) {
    const oldRotation = this.rotation;
    const newRotation = (this.rotation + direction + 4) % this.shapes.length;

    this.rotation = newRotation;
    this.shape = this.shapes[this.rotation];
    this.rotationCount++;

    // If board is provided, try wall kicks
    if (board) {
      if (board.isColliding(this, 0, 0)) {
        const kicked = this.tryWallKicks(oldRotation, newRotation, board);
        if (!kicked) {
          // Revert rotation if no valid kick found
          this.rotation = oldRotation;
          this.shape = this.shapes[this.rotation];
          this.rotationCount--;
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Try wall kick positions for rotation
   */
  tryWallKicks(fromRotation, toRotation, board) {
    const kickData = this.type === 'I' ? SRS_KICK_DATA.I : SRS_KICK_DATA.normal;
    const kickKey = `${fromRotation}->${toRotation}`;
    const kicks = kickData[kickKey] || [];

    for (const [dx, dy] of kicks) {
      if (!board.isColliding(this, dx, dy)) {
        this.x += dx;
        this.y += dy;
        return true;
      }
    }

    return false;
  }

  /**
   * Move the piece
   */
  move(dx, dy, board = null) {
    const oldX = this.x;
    const oldY = this.y;

    this.x += dx;
    this.y += dy;

    // Check collision if board is provided
    if (board && board.isColliding(this, 0, 0)) {
      this.x = oldX;
      this.y = oldY;
      return false;
    }

    if (dx !== 0 || dy !== 0) {
      this.moveCount++;
    }

    return true;
  }

  /**
   * Hard drop the piece to the bottom
   */
  hardDrop(board) {
    let dropDistance = 0;

    while (!board.isColliding(this, 0, 1)) {
      this.y++;
      dropDistance++;
    }

    return dropDistance;
  }

  /**
   * Create a copy of this piece
   */
  clone() {
    const cloned = new Tetromino(this.type, this.x, this.y, this.rotation);
    cloned.id = this.id;
    cloned.spawnTime = this.spawnTime;
    cloned.lockTime = this.lockTime;
    cloned.moveCount = this.moveCount;
    cloned.rotationCount = this.rotationCount;
    return cloned;
  }

  /**
   * Lock the piece (mark it as placed)
   */
  lock() {
    this.lockTime = Date.now();
  }

  /**
   * Check if the piece is locked
   */
  isLocked() {
    return this.lockTime !== null;
  }

  /**
   * Get piece statistics
   */
  getStats() {
    const now = Date.now();
    return {
      type: this.type,
      id: this.id,
      position: { x: this.x, y: this.y },
      rotation: this.rotation,
      spawnTime: this.spawnTime,
      lockTime: this.lockTime,
      lifeTime: this.lockTime ? this.lockTime - this.spawnTime : now - this.spawnTime,
      moveCount: this.moveCount,
      rotationCount: this.rotationCount,
      isLocked: this.isLocked()
    };
  }

  /**
   * Export piece to JSON
   */
  toJSON() {
    return {
      type: this.type,
      x: this.x,
      y: this.y,
      rotation: this.rotation,
      id: this.id,
      spawnTime: this.spawnTime,
      lockTime: this.lockTime,
      moveCount: this.moveCount,
      rotationCount: this.rotationCount
    };
  }

  /**
   * Create piece from JSON data
   */
  static fromJSON(data) {
    const piece = new Tetromino(data.type, data.x, data.y, data.rotation);
    piece.id = data.id;
    piece.spawnTime = data.spawnTime;
    piece.lockTime = data.lockTime;
    piece.moveCount = data.moveCount || 0;
    piece.rotationCount = data.rotationCount || 0;
    return piece;
  }
}

/**
 * Tetromino Factory for creating and managing pieces
 */
export class TetrominoFactory {
  constructor() {
    this.bag = [];
    this.history = [];
    this.statistics = {
      total: 0,
      byType: {
        I: 0, O: 0, T: 0, S: 0, Z: 0, J: 0, L: 0
      }
    };

    // Initialize bag
    this.refillBag();
  }

  /**
   * Create a random tetromino using 7-bag system
   */
  createRandom() {
    if (this.bag.length === 0) {
      this.refillBag();
    }

    const randomIndex = Math.floor(Math.random() * this.bag.length);
    const type = this.bag.splice(randomIndex, 1)[0];

    return this.create(type);
  }

  /**
   * Create a specific tetromino type
   */
  create(type) {
    if (!TETROMINO_SHAPES[type]) {
      throw new Error(`Unknown tetromino type: ${type}`);
    }

    const piece = new Tetromino(type);

    // Update statistics
    this.statistics.total++;
    this.statistics.byType[type]++;

    // Add to history
    this.history.push({
      type,
      id: piece.id,
      timestamp: Date.now()
    });

    // Keep history manageable
    if (this.history.length > 1000) {
      this.history = this.history.slice(-500);
    }

    return piece;
  }

  /**
   * Refill the bag with all 7 piece types
   */
  refillBag() {
    this.bag = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  }

  /**
   * Preview the next pieces in the bag
   */
  previewNext(count = 3) {
    const preview = [];
    const tempBag = [...this.bag];

    for (let i = 0; i < count; i++) {
      if (tempBag.length === 0) {
        tempBag.push(...['I', 'O', 'T', 'S', 'Z', 'J', 'L']);
      }

      const randomIndex = Math.floor(Math.random() * tempBag.length);
      const type = tempBag.splice(randomIndex, 1)[0];
      preview.push(type);
    }

    return preview;
  }

  /**
   * Get all possible tetromino types
   */
  getAllTypes() {
    return Object.keys(TETROMINO_SHAPES);
  }

  /**
   * Get tetromino shape data
   */
  getShapeData(type) {
    return TETROMINO_SHAPES[type];
  }

  /**
   * Get factory statistics
   */
  getStatistics() {
    return {
      ...this.statistics,
      bagRemaining: this.bag.length,
      recentHistory: this.history.slice(-10)
    };
  }

  /**
   * Reset factory statistics
   */
  resetStatistics() {
    this.statistics = {
      total: 0,
      byType: {
        I: 0, O: 0, T: 0, S: 0, Z: 0, J: 0, L: 0
      }
    };
    this.history = [];
  }

  /**
   * Check if a sequence is fair (roughly equal distribution)
   */
  isFairDistribution() {
    const { byType, total } = this.statistics;
    if (total < 70) return true; // Not enough data

    const expectedPerType = total / 7;
    const tolerance = total * 0.2; // 20% tolerance

    return Object.values(byType).every(count =>
      Math.abs(count - expectedPerType) <= tolerance
    );
  }

  /**
   * Get the rarest piece type
   */
  getRarestType() {
    const { byType } = this.statistics;
    let minCount = Infinity;
    let rarestType = null;

    Object.entries(byType).forEach(([type, count]) => {
      if (count < minCount) {
        minCount = count;
        rarestType = type;
      }
    });

    return rarestType;
  }

  /**
   * Force create a specific type (for testing or special modes)
   */
  forceCreate(type) {
    const piece = this.create(type);
    console.log(`🔧 Force created ${type} piece`);
    return piece;
  }

  /**
   * Export factory state
   */
  toJSON() {
    return {
      bag: this.bag,
      statistics: this.statistics,
      recentHistory: this.history.slice(-50)
    };
  }

  /**
   * Import factory state
   */
  fromJSON(data) {
    if (data.bag) this.bag = data.bag;
    if (data.statistics) this.statistics = data.statistics;
    if (data.recentHistory) this.history = data.recentHistory;
  }
}

/**
 * Utility functions for piece manipulation
 */
export const PieceUtils = {
  /**
   * Calculate piece center point
   */
  getCenter(piece) {
    const bbox = piece.getBoundingBox();
    return {
      x: piece.x + bbox.left + bbox.width / 2,
      y: piece.y + bbox.top + bbox.height / 2
    };
  },

  /**
   * Check if two pieces overlap
   */
  areOverlapping(piece1, piece2) {
    const cells1 = piece1.getFilledCells();
    const cells2 = piece2.getFilledCells();

    return cells1.some(cell1 =>
      cells2.some(cell2 =>
        cell1.x === cell2.x && cell1.y === cell2.y
      )
    );
  },

  /**
   * Get all unique rotations of a piece
   */
  getAllRotations(piece) {
    const rotations = [];
    const originalRotation = piece.rotation;

    for (let i = 0; i < 4; i++) {
      piece.rotation = i % piece.shapes.length;
      piece.shape = piece.shapes[piece.rotation];
      rotations.push(piece.clone());
    }

    // Restore original rotation
    piece.rotation = originalRotation;
    piece.shape = piece.shapes[piece.rotation];

    return rotations;
  },

  /**
   * Calculate T-spin detection
   */
  isTSpin(piece, board) {
    if (piece.type !== 'T') return false;

    // Check if T-piece is in a T-spin position
    const cornerPositions = [
      [piece.x, piece.y], // Top-left
      [piece.x + 2, piece.y], // Top-right
      [piece.x, piece.y + 2], // Bottom-left
      [piece.x + 2, piece.y + 2] // Bottom-right
    ];

    let occupiedCorners = 0;
    cornerPositions.forEach(([x, y]) => {
      if (x < 0 || x >= board.width || y < 0 || y >= board.height || board.getCell(x, y)) {
        occupiedCorners++;
      }
    });

    return occupiedCorners >= 3;
  }
};