# Obstacle System & Proper "Bollen i Burken" Mechanics Plan

## Phase 1: Enhanced Obstacle System

### Goal
Create varied, configurable obstacles with color-coded sizes and better spatial distribution.

### New CONFIG Parameters (add to config.js)
```javascript
obstacles: {
    enabled: true,
    count: 12,                    // 1-100 obstacles
    minDistanceBetween: 3.0,      // Minimum spacing between obstacles
    canExclusionRadius: 5.0,      // How close to center can they spawn

    // Size randomness (0-1, higher = more variation)
    sizeRandomness: 0.6,

    // Size ranges
    minWidth: 0.8,
    maxWidth: 4.0,
    minDepth: 0.8,
    maxDepth: 4.0,
    minHeight: 0.5,
    maxHeight: 3.5,

    // Shape variety
    shapes: {
        box: 0.4,           // 40% boxes
        tallBox: 0.2,       // 20% tall narrow boxes
        wall: 0.2,          // 20% long horizontal walls
        lShape: 0.1,        // 10% L-shaped obstacles
        tShape: 0.1         // 10% T-shaped obstacles
    },

    // Color coding by size
    colorBySize: true,      // Green (small) -> Red (large)
}
```

### Implementation Steps

#### 1. Update arena-obstacles.js
- Add shape generation functions:
  - `createBoxObstacle()` - Standard box
  - `createTallObstacle()` - Tall narrow pillar
  - `createWallObstacle()` - Long horizontal barrier
  - `createLShapeObstacle()` - Corner piece
  - `createTShapeObstacle()` - T-junction piece

- Add color-by-size function:
  - Calculate size (volume or max dimension)
  - Map to color: Green (#4ade80) → Yellow (#fbbf24) → Red (#dc2626)

- Improve placement algorithm:
  - Check `minDistanceBetween` for all existing obstacles
  - Respect `canExclusionRadius`
  - Use `sizeRandomness` to vary dimensions

#### 2. Update CONFIG in core/config.js
- Add new obstacle configuration section
- Keep existing physics/collision settings

#### 3. Test & Tune
- Spawn 5, 20, 50, 100 obstacles
- Verify spacing works
- Check color coding
- Ensure playability

---

## Phase 2: Proper "Bollen i Burken" Mechanics

### Current Issues
- Game is "get tagged = lose immediately"
- No interaction with the can
- No race mechanic
- No proper win condition

### Real Game Rules (from RulesOfTheGame.md)

#### When Hunter Spots Player:
1. Hunter must run BACK to the can
2. Hunter touches can + shouts name → Player eliminated
3. BUT if player reaches can ad presses the space bar first → **Player wins!**

#### Player Goal:
1. Sneak to the can while hidden
2. Touch/kick the can (SPACE key)
3. Shout "1, 2, 3, Dunk för mig!!!"
4. **WIN THE ROUND**

### Implementation Steps

#### 1. Add Can Interaction System
**File**: `js/systems/interaction/interaction-system.js`

- Already has `Interactable` component on can
- Enable player to kick can:
  ```javascript
  if (playerNearCan && pressedSpace) {
      kickCan(playerId);
      // Trigger win!
  }
  ```

#### 2. Modify AI Behavior (AISystem)
**File**: `js/systems/ai/ai-system.js`

Current: Spots player → Move toward player → Touch player = win

New: Spots player → **Run to can** → Touch can first = win

- Add new AI state: `RACING_TO_CAN`
- When player spotted:
  - Set target to can position (0, 0, 0)
  - Move at max speed
  - Check who reaches can first

#### 3. Add Race Mechanic
**New File**: `js/systems/race-system.js` or add to `game-lifecycle.js`

```javascript
class RaceMechanic {
    startRace(playerId, hunterId) {
        // Both race to can
        // First to touch wins
    }

    onPlayerReachesCan() {
        // Player wins!
        showVictoryScreen();
    }

    onHunterReachesCan() {
        // Player eliminated
        showDefeatScreen();
    }
}
```

#### 4. Update Win/Lose Conditions
**File**: `js/core/game-engine.js` or `js/managers/game-lifecycle.js`

- **Current**: Hunter touches player → `gameOver('tagged')`
- **New**:
  - Hunter reaches can first → `gameOver('caught')`
  - Player reaches can first → `gameOver('won')`

#### 5. Update UI Messages
**File**: `js/systems/ui/menu-overlay.js`

- Victory message: "You kicked the can! You win!"
- Defeat message: "The hunter caught you at the can!"
- Race notification: "Race to the can!"

---

## Implementation Order

### Sprint 1: Enhanced Obstacles (1-2 hours)
1. ✅ Add new CONFIG parameters
2. ✅ Implement shape generation functions
3. ✅ Add color-by-size system
4. ✅ Improve placement algorithm
5. ✅ Test with various counts (5, 20, 50, 100)

### Sprint 2: Can Interaction (30 min)
1. ✅ Enable player to kick can (SPACE key)
2. ✅ Add visual/audio feedback
3. ✅ Trigger victory when can is kicked

### Sprint 3: Proper AI Race Mechanic (1 hour)
1. ✅ Modify AI to run to can when player spotted
2. ✅ Implement race detection
3. ✅ Handle both win/lose scenarios

### Sprint 4: Polish (30 min)
1. ✅ Update UI messages
2. ✅ Add race notification
3. ✅ Test full game loop: hide → spotted → race → win/lose

---

## Success Criteria

### Obstacles
- [x] Can spawn 1-100 obstacles
- [x] Obstacles have varied shapes (box, tall, wall, L, T)
- [x] Color-coded by size (green → red)
- [x] Proper spacing between obstacles
- [x] Respect can exclusion radius
- [x] Playable at all obstacle counts

### Gameplay
- [x] Player can kick the can to win
- [x] Hunter races to can when player is spotted
- [x] First to reach can wins the race
- [x] Proper victory/defeat screens
- [x] Matches traditional "Bollen i Burken" rules
- [x] Fun and strategic gameplay loop

---

## Configuration Examples

### Easy Mode (Few Large Obstacles)
```javascript
obstacles: { count: 5, maxWidth: 5.0, canExclusionRadius: 8.0 }
```

### Normal Mode (Balanced)
```javascript
obstacles: { count: 12, maxWidth: 4.0, canExclusionRadius: 5.0 }
```

### Hard Mode (Many Small Obstacles)
```javascript
obstacles: { count: 30, maxWidth: 2.0, minDistanceBetween: 2.0 }
```

### Chaos Mode (Maximum Obstacles)
```javascript
obstacles: { count: 100, sizeRandomness: 1.0, minDistanceBetween: 1.5 }
```
