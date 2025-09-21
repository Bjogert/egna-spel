/**
 * FANTASTIC TETRIS - GAME BOARD CLASS
 * Manages the game board grid, collision detection, and line clearing
 */

export class TetrisBoard {
  constructor(width = 10, height = 20) {
    this.width = width;
    this.height = height;
    this.grid = [];
    this.clearingLines = [];
    this.clearedLinesHistory = [];

    // Initialize empty grid
    this.clear();
  }

  /**
   * Clear the entire board
   */
  clear() {
    this.grid = Array(this.height).fill(null).map(() => Array(this.width).fill(null));
    this.clearingLines = [];
  }

  /**
   * Check if a position is valid on the board
   */
  isValidPosition(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /**
   * Check if a cell is occupied
   */
  isCellOccupied(x, y) {
    if (!this.isValidPosition(x, y)) return true;
    return this.grid[y][x] !== null;
  }

  /**
   * Get cell value at position
   */
  getCell(x, y) {
    if (!this.isValidPosition(x, y)) return null;
    return this.grid[y][x];
  }

  /**
   * Set cell value at position
   */
  setCell(x, y, value) {
    if (this.isValidPosition(x, y)) {
      this.grid[y][x] = value;
    }
  }

  /**
   * Check if a piece collides with the board or other pieces
   */
  isColliding(piece, offsetX = 0, offsetY = 0) {
    if (!piece || !piece.shape) return true;

    const { shape, x, y } = piece;
    const newX = x + offsetX;
    const newY = y + offsetY;

    for (let py = 0; py < shape.length; py++) {
      for (let px = 0; px < shape[py].length; px++) {
        if (shape[py][px]) {
          const boardX = newX + px;
          const boardY = newY + py;

          // Check boundaries
          if (boardX < 0 || boardX >= this.width || boardY >= this.height) {
            return true;
          }

          // Check collision with placed pieces (but allow negative Y for spawning)
          if (boardY >= 0 && this.grid[boardY][boardX]) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Place a piece on the board
   */
  placePiece(piece) {
    if (!piece || !piece.shape) return;

    const { shape, x, y, color } = piece;

    for (let py = 0; py < shape.length; py++) {
      for (let px = 0; px < shape[py].length; px++) {
        if (shape[py][px]) {
          const boardX = x + px;
          const boardY = y + py;

          if (this.isValidPosition(boardX, boardY)) {
            this.grid[boardY][boardX] = color;
          }
        }
      }
    }
  }

  /**
   * Check for complete lines and clear them
   */
  clearLines() {
    const completedLines = [];

    // Find completed lines
    for (let y = 0; y < this.height; y++) {
      if (this.isLineComplete(y)) {
        completedLines.push(y);
      }
    }

    if (completedLines.length === 0) return 0;

    // Store for animation
    this.clearingLines = [...completedLines];

    // Remove completed lines from bottom to top
    for (let i = completedLines.length - 1; i >= 0; i--) {
      const lineY = completedLines[i];
      this.removeLine(lineY);
    }

    // Add to history for statistics
    this.clearedLinesHistory.push({
      lines: completedLines.length,
      timestamp: Date.now(),
      positions: completedLines
    });

    return completedLines.length;
  }

  /**
   * Check if a line is complete
   */
  isLineComplete(y) {
    if (y < 0 || y >= this.height) return false;

    for (let x = 0; x < this.width; x++) {
      if (!this.grid[y][x]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Remove a line and shift everything down
   */
  removeLine(lineY) {
    if (lineY < 0 || lineY >= this.height) return;

    // Remove the line
    this.grid.splice(lineY, 1);

    // Add new empty line at the top
    this.grid.unshift(Array(this.width).fill(null));
  }

  /**
   * Get the height of the highest piece in a column
   */
  getColumnHeight(x) {
    if (x < 0 || x >= this.width) return 0;

    for (let y = 0; y < this.height; y++) {
      if (this.grid[y][x]) {
        return this.height - y;
      }
    }

    return 0;
  }

  /**
   * Get the number of holes in the board
   */
  getHoleCount() {
    let holes = 0;

    for (let x = 0; x < this.width; x++) {
      let foundBlock = false;

      for (let y = 0; y < this.height; y++) {
        if (this.grid[y][x]) {
          foundBlock = true;
        } else if (foundBlock) {
          holes++;
        }
      }
    }

    return holes;
  }

  /**
   * Calculate board roughness (height differences between adjacent columns)
   */
  getRoughness() {
    let roughness = 0;

    for (let x = 0; x < this.width - 1; x++) {
      const heightDiff = Math.abs(this.getColumnHeight(x) - this.getColumnHeight(x + 1));
      roughness += heightDiff;
    }

    return roughness;
  }

  /**
   * Get the aggregate height of all columns
   */
  getAggregateHeight() {
    let totalHeight = 0;

    for (let x = 0; x < this.width; x++) {
      totalHeight += this.getColumnHeight(x);
    }

    return totalHeight;
  }

  /**
   * Find the lowest position a piece can be placed
   */
  getDropPosition(piece) {
    if (!piece) return null;

    let dropY = piece.y;

    while (!this.isColliding(piece, 0, dropY - piece.y + 1)) {
      dropY++;
    }

    return {
      x: piece.x,
      y: dropY,
      shape: piece.shape,
      color: piece.color,
      type: piece.type
    };
  }

  /**
   * Check if the board is empty
   */
  isEmpty() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x]) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Check if the top rows are blocked (game over condition)
   */
  isTopBlocked() {
    const checkRows = 2; // Check top 2 rows

    for (let y = 0; y < checkRows; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x]) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get a copy of the current board state
   */
  clone() {
    const clonedBoard = new TetrisBoard(this.width, this.height);
    clonedBoard.grid = this.grid.map(row => [...row]);
    return clonedBoard;
  }

  /**
   * Simulate placing a piece and return the resulting board
   */
  simulatePlacement(piece) {
    const clonedBoard = this.clone();
    const droppedPiece = this.getDropPosition(piece);

    if (droppedPiece) {
      clonedBoard.placePiece(droppedPiece);
      clonedBoard.clearLines();
    }

    return clonedBoard;
  }

  /**
   * Calculate a score for the current board state (for AI)
   */
  calculateScore() {
    const aggregateHeight = this.getAggregateHeight();
    const completedLines = this.getCompletedLinesCount();
    const holes = this.getHoleCount();
    const roughness = this.getRoughness();

    // Weights for different factors (these can be tuned)
    const weights = {
      aggregateHeight: -0.510066,
      completedLines: 0.760666,
      holes: -0.35663,
      roughness: -0.184483
    };

    return (
      weights.aggregateHeight * aggregateHeight +
      weights.completedLines * completedLines +
      weights.holes * holes +
      weights.roughness * roughness
    );
  }

  /**
   * Get the number of completed lines that would be cleared
   */
  getCompletedLinesCount() {
    let count = 0;

    for (let y = 0; y < this.height; y++) {
      if (this.isLineComplete(y)) {
        count++;
      }
    }

    return count;
  }

  /**
   * Get board statistics
   */
  getStatistics() {
    return {
      height: this.getAggregateHeight(),
      holes: this.getHoleCount(),
      roughness: this.getRoughness(),
      completedLines: this.getCompletedLinesCount(),
      isEmpty: this.isEmpty(),
      isTopBlocked: this.isTopBlocked(),
      columnHeights: Array.from({ length: this.width }, (_, x) => this.getColumnHeight(x))
    };
  }

  /**
   * Find all possible positions for a piece
   */
  getAllValidPositions(piece) {
    if (!piece) return [];

    const positions = [];
    const rotations = this.getAllRotations(piece);

    rotations.forEach((rotatedPiece, rotationIndex) => {
      for (let x = -rotatedPiece.shape[0].length + 1; x < this.width; x++) {
        const testPiece = {
          ...rotatedPiece,
          x: x,
          y: 0
        };

        // Find the lowest valid position
        let y = 0;
        while (y < this.height && !this.isColliding(testPiece, 0, 0)) {
          testPiece.y = y;
          y++;
        }

        // Step back to the last valid position
        if (y > 0) {
          testPiece.y = y - 1;

          // Make sure the final position is valid
          if (!this.isColliding(testPiece, 0, 0)) {
            positions.push({
              ...testPiece,
              rotation: rotationIndex,
              score: this.simulatePlacement(testPiece).calculateScore()
            });
          }
        }
      }
    });

    return positions.sort((a, b) => b.score - a.score);
  }

  /**
   * Get all possible rotations of a piece
   */
  getAllRotations(piece) {
    const rotations = [piece];
    let currentPiece = piece;

    // Get up to 4 rotations
    for (let i = 0; i < 3; i++) {
      currentPiece = this.rotatePiece(currentPiece, 1);

      // Check if we've completed a full rotation
      if (this.arePiecesEqual(currentPiece, piece)) {
        break;
      }

      rotations.push(currentPiece);
    }

    return rotations;
  }

  /**
   * Rotate a piece
   */
  rotatePiece(piece, direction = 1) {
    if (!piece || !piece.shape) return piece;

    const { shape } = piece;
    const size = shape.length;
    const rotatedShape = Array(size).fill(null).map(() => Array(size).fill(0));

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (direction === 1) {
          // Clockwise rotation
          rotatedShape[x][size - 1 - y] = shape[y][x];
        } else {
          // Counter-clockwise rotation
          rotatedShape[size - 1 - x][y] = shape[y][x];
        }
      }
    }

    return {
      ...piece,
      shape: rotatedShape
    };
  }

  /**
   * Check if two pieces are equal
   */
  arePiecesEqual(piece1, piece2) {
    if (!piece1 || !piece2 || !piece1.shape || !piece2.shape) return false;

    const shape1 = piece1.shape;
    const shape2 = piece2.shape;

    if (shape1.length !== shape2.length) return false;

    for (let y = 0; y < shape1.length; y++) {
      if (shape1[y].length !== shape2[y].length) return false;

      for (let x = 0; x < shape1[y].length; x++) {
        if (shape1[y][x] !== shape2[y][x]) return false;
      }
    }

    return true;
  }

  /**
   * Get a visual representation of the board (for debugging)
   */
  toString() {
    let result = '';

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        result += this.grid[y][x] ? '█' : '·';
      }
      result += '\n';
    }

    return result;
  }

  /**
   * Export board state to JSON
   */
  toJSON() {
    return {
      width: this.width,
      height: this.height,
      grid: this.grid,
      statistics: this.getStatistics(),
      clearedLinesHistory: this.clearedLinesHistory
    };
  }

  /**
   * Import board state from JSON
   */
  fromJSON(data) {
    if (data.width) this.width = data.width;
    if (data.height) this.height = data.height;
    if (data.grid) this.grid = data.grid;
    if (data.clearedLinesHistory) this.clearedLinesHistory = data.clearedLinesHistory;
  }

  /**
   * Reset cleared lines animation
   */
  resetClearingAnimation() {
    this.clearingLines = [];
  }

  /**
   * Get lines currently being cleared (for animation)
   */
  getClearingLines() {
    return [...this.clearingLines];
  }
}