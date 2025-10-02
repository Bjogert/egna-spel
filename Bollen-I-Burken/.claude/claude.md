# Game Development Repository

## 🎮 GAME DEVELOPMENT PROJECTS

This repository contains various web-based game projects built with modern web technologies.

## 🚀 INNOVATIVE TECHNOLOGIES & CREATIVE VISION

### Modern Web Technologies Available
- **WebGL/Three.js 3D Rendering**: Create stunning 3D games with realistic lighting, shadows, and particle effects
- **WebAssembly Core Engine**: Ultra-fast game processing for buttery-smooth 60fps+ gameplay
- **Progressive Web App (PWA)**: Offline play, background sync, and native-like mobile experience
- **WebRTC Real-time Multiplayer**: Server-less peer-to-peer gameplay and spectator modes

### Game Enhancement Features
- **Procedural Music Engine**: Dynamic soundtracks that adapt to player performance and game state
- **AI-Powered Assistance**: Machine learning algorithms for game mechanics and player guidance
- **Advanced Scoring Systems**: Combo chains, multipliers, and achievement systems
- **Power-up Systems**: Special abilities and temporary enhancements
- **Rhythm-Based Mechanics**: Music-synchronized gameplay elements

### Available Control Schemes
- **Voice Command Integration**: Voice-controlled game actions
- **Eye Tracking Controls**: Gaze-based interaction using WebRTC camera access
- **Haptic Feedback Engine**: Advanced vibration patterns for tactile gameplay feedback
- **Gesture Recognition**: Hand tracking for touchless interaction
- **Traditional Controls**: Keyboard, mouse, touch, and gamepad support

### Versatile Game Modes
- **Zen Mode**: Stress-free gameplay with meditative visuals and ambient sounds
- **Battle Royale**: Multi-player elimination tournaments
- **Collaborative Mode**: Multiple players working together
- **Creative/Builder Modes**: Custom content creation with physics testing
- **Augmented Reality Mode**: Camera overlay for mixed reality experiences

### Advanced Visual Systems
- **Shader-Based Effects**: Custom GLSL shaders for stunning visual effects
- **Procedural Art**: Generative visuals that respond to gameplay
- **Particle Physics Engine**: Realistic effects for debris, sparks, and celebrations
- **Dynamic Theme Engine**: User-generated themes with custom physics and aesthetics

### Social & Competitive Features
- **Real-time Spectator Mode**: Live streaming with interactive chat
- **Mentor System**: Experienced players guide newcomers
- **Replay Theater**: Record, analyze, and share epic moments
- **Cloud Leaderboards**: Global competitions with seasonal events

### Accessibility Features
- **Audio-Only Gameplay**: Complete spatial audio for visually impaired players
- **Pattern-Based Systems**: Texture and shape recognition alternatives
- **Motor Accessibility**: Single-switch controls with timing assistance
- **Cognitive Aid Mode**: Visual guides and simplified interactions

---

## Current Projects

### 1. Tetris (Complete)
Classic puzzle game with modern web technologies
- Location: `Tetris/` folder
- Technologies: HTML5 Canvas, JavaScript, CSS3
- Features: Full Tetris gameplay with sound and visual effects

### 2. Bollen-I-Burken (In Active Development)
3D hide-and-seek arena game - Swedish "Can in the Can" game
- Location: `Bollen-I-Burken/` folder
- Technologies: Three.js, WebGL, HTML5, ECS Architecture
- Features: 3D arena, character movement, AI hunters, dynamic vision, difficulty system

#### Recent Updates (October 2025) 🎉

**🔍 Dynamic Vision System (NEW)**
- AI hunters have adaptive vision that trades range vs angle
- Looking FAR → NARROW cone (focused beam), 2.875x range
- Looking NEAR → WIDE cone (peripheral vision), 0.8x range
- Smoothing prevents vision twitching (10% new, 90% old)
- Uses real obstacle distances for accurate focusing
- File: `js/systems/ai/dynamic-vision.js` (~192 lines)

**👥 Multiple AI Hunters (NEW)**
- Difficulty-based hunter counts: 1-6 hunters per level
- Level 0-1: 1 hunter (learning mode)
- Level 2-3: 2 hunters (balanced challenge)
- Level 4-5: 3 hunters (hard mode)
- Level 6-7: 4 hunters (expert mode)
- Level 8: 5 hunters (nightmare)
- Level 9: 6 hunters (impossible - "Systemet Stänger")
- Hunters spawn in circle formation around arena (60% radius)

**🏆 Player Win Condition (NEW)**
- Player can reach the can and press SPACE to win
- Win distance: within 2m of can + action1 key (space)
- Shows "DU VÄN FÖR DIG!" victory message
- New PLAYER_WIN state added to GAME_STATES
- playerWin() method in GameEngine

**🤖 Independent Hunter Behaviors (NEW)**
- Each hunter has unique randomized patrol patterns
- Random orbit radius per hunter: 4.5-7.5m from can
- Random speeds: move (0.8-1.2x), turn (1.2-2.2x)
- Random scan intervals: 600-1000ms between scans
- Dynamic behavior modes:
  - PAUSE: Stop and look around (scary!)
  - REPOSITION: Quick move to opposite side
  - SLOW CREEP: Methodical, tense movement
  - FAST PATROL: Quick sweep with direction reversal
- Sometimes skip obstacles randomly for variety
- Obstacle-aware scanning: AI looks at hiding spots, not random air

**📦 Improved Obstacle System (NEW)**
- Height-based color coding:
  - Green: 0-1m (short obstacles)
  - Yellow: 1-2m (medium)
  - Orange: 2-3m (tall)
  - Red: 3m+ (very tall)
- Near-can obstacles forced short (0.3-0.6m) & green for visibility
- Difficulty-based canExclusionRadius (3m-12m) keeps obstacles away from can
- Compound colliders with Parent component for complex shapes
- heightScaling zones: nearMin/nearMax, midMin/midMax, farMin/farMax

**🏟️ Arena Scaling (NEW)**
- 4x bigger arena: 30x30 units (was 15x15)
- Wall height scaled 2x: 6m (was 3m)
- Camera height/distance scaled 2x for better view
- Hunters patrol at 4.5-7.5m radius (scaled for larger arena)

**⏱️ 5-Second Countdown (NEW)**
- Game starts with countdown: "Vakten räknar... Hitta gömställe!"
- Large number display with pulse animation
- UI system handles countdown display and hiding
- Players can move during countdown to find hiding spots

#### Game Architecture

**Dynamic Vision Trade-Off System**
The AI vision system creates realistic hunter behavior by adapting based on what the AI is looking at:

```javascript
// Looking at distant obstacle (15m away)
// → NARROW beam (0.15x angle = 85% narrower)
// → LONGER range (2.875x = can see VERY far)

// Looking nearby while patrolling (5m)
// → WIDE peripheral (1.2x angle = 20% wider)
// → SHORTER range (0.8x = saves processing)
```

**Integration Points:**
1. `can-guard-strategy.js` sets scan targets (which obstacle AI is looking at)
2. `dynamic-vision.js` calculates dynamic range/angle based on scan distance
3. `ai-system.js` applies dynamic vision to VisionCone component
4. `movement-system.js` updates vision cone mesh geometry to match

**Multiple Hunter System**
Each hunter operates independently with randomized parameters:
- Unique orbit radius around can (4.5-7.5m)
- Unique patrol speed (0.8-1.2x multiplier)
- Unique turn speed (1.2-2.2x multiplier)
- Unique scan timing (600-1000ms intervals)
- Random starting position and direction
- Random behavior pattern changes (PAUSE/REPOSITION/CREEP/PATROL)

This creates emergent complexity where 6 hunters feel like 6 different personalities!

#### Architecture Highlights
- **ECS Pattern**: Entity-Component-System for clean separation
- **KISS Principle**: Simple code over enterprise patterns
- **File Size Limit**: 400-500 lines max per file (enforced)
- **No Aggregators**: Direct imports only, no re-export files
- **Modular Systems**: Complex systems split into focused subfolders
- **Difficulty System**: 10 levels with Swedish cultural names

#### Notes for Next AI Assistant
- **PRESERVE START_MENU and COUNTDOWN states** - do not reintroduce old MENU phase
- **Dynamic Vision System** - don't remove the range/angle trade-off, it creates realistic AI behavior
- **Multiple Hunters** - each hunter's randomized parameters are initialized once in guardState (can-guard-strategy.js)
- **Player Win Condition** - movement-system.js checks distance to can + action1 key press
- **Vision Cone Updates** - movement-system.js updateVisionConeGeometry() must stay synced with dynamic vision
- **Restart Flow** depends on PlayerManager.clearAll() and gameEngine.reset()
- Keep showStartMenu / hideStartMenu helpers centralized (exported on window)
- Update both PlayerManager.clearAll() and gameEngine.reset() if adding new entities/resources

#### CRITICAL: Legacy Cleanup & KISS Refactoring Completed (Oct 2025)
**Major architectural cleanup completed - MUST preserve these improvements:**

1. **File Size Limits** - ALL files MUST be 400-500 lines maximum
   - If a file exceeds 500 lines, it MUST be split into smaller modules
   - Each system MUST be in its own file (no monolithic files)
   - Example: UI split into `ui-system.js` (main) + `menu-overlay.js` (menus)
   - **Current violations needing attention:**
     - `config.js`: 510 lines (consider splitting difficulty config)
     - `ai-system.js`: 526 lines (consider splitting vision logic)
     - `ui-system.js`: 628 lines (consider splitting message handling)

2. **Folder Structure - KISS Architecture**
   ```
   js/
   ├── main.js                    # Bootstrap only (KEEP in root)
   ├── utils.js                   # Core utilities (KEEP in root) - PLAYER_WIN state added
   ├── debug-commands.js          # Debug tools (KEEP in root)
   ├── core/                      # ECS primitives
   │   ├── entity.js
   │   ├── components/            # Individual component files (11 components)
   │   ├── game-state.js
   │   ├── game-engine.js         # playerWin() method added
   │   └── config.js              # numHunters per difficulty added
   ├── systems/                   # ONE SYSTEM PER FILE
   │   ├── input/
   │   │   └── input-system.js    # MOVED from controls.js
   │   ├── audio/
   │   │   └── audio-system.js    # MOVED from audio.js
   │   ├── ui/
   │   │   ├── ui-system.js       # MOVED from ui.js - countdown + win state
   │   │   └── menu-overlay.js    # Menu-specific logic
   │   ├── movement-system.js     # Win condition + vision cone updates
   │   ├── ai/
   │   │   ├── ai-system.js       # Dynamic vision integration
   │   │   ├── dynamic-vision.js  # NEW - Adaptive vision system
   │   │   └── steering/
   │   │       ├── steering-behaviors.js
   │   │       ├── obstacle-avoidance.js
   │   │       └── can-guard-strategy.js  # Randomized hunter behavior
   │   ├── interaction/
   │   └── network/
   └── managers/                  # Specific managers
       ├── arena/                 # Arena split into 8 modules
       ├── player-manager.js
       ├── player-factory.js
       └── game-lifecycle.js      # Multiple hunter spawning
   ```

3. **NO Aggregator Files** - DELETED during cleanup:
   - `js/player.js` (was re-exporting PlayerManager/Factory)
   - `js/arena.js` (was re-exporting ArenaBuilder)
   - `js/ai.js` (was re-exporting AISystem/components)
   - `js/interaction.js` (was re-exporting InteractionSystem)
   - `js/networking.js` (was re-exporting NetworkSystem)
   - `js/game.js` (was aggregating core components)
   - `js/resource-manager.js` (aggregator - real code in managers/resource/)

4. **NO Enterprise Patterns** - DELETED during cleanup:
   - `js/config-manager.js` (747 lines of Singleton/Observer/Strategy bloat)
   - `js/error-handler.js` (605 lines of enterprise error handling)
   - `js/component-validator.js` (600 lines of unused validation)
   - **Replacement:** Simple `CONFIG` object exported from `js/core/config.js`

5. **Rules for Adding New Systems:**
   - Create new file in `js/systems/[category]/[system-name].js`
   - NEVER add aggregator files that just re-export other modules
   - NEVER use Singleton, Observer, or Strategy patterns unless absolutely necessary
   - Keep files under 500 lines - split if needed
   - Direct imports/exports only - no global namespace aggregators

6. **Files That MUST Stay in Root:**
   - `js/main.js` - Bootstrap and game loop entry point
   - `js/utils.js` - Core utilities (Utils class, GAME_STATES, constants)
   - `js/debug-commands.js` - Development debugging helpers

**DO NOT reintroduce deleted patterns. Keep architecture KISS.**

---

## General Development Guidelines

### KISS Architecture Standards (Keep It Simple, Stupid)
- **Start simple, scale when needed** - Don't over-engineer from day one
- **Avoid enterprise patterns in small projects** - No Singleton, Observer, Strategy unless clearly needed
- **One concern per file** - Each file should have a single, clear responsibility
- **Small, focused files** - Target 200-400 lines max; if >500 lines, split it
- **Clear folder structure** - Organize by system (core/, systems/, managers/, utils/)
- **Explicit over clever** - Simple code that's easy to understand beats clever abstractions
- **Test in isolation** - If you can't test a system independently, it's too coupled
- **No premature abstraction** - Solve the problem first, abstract patterns later when needed

### Scalability Requirements (Applied Gradually)
- **Component-based architecture** - Simple components without validation overhead
- **Loose coupling** - Systems communicate through clear interfaces, not singletons
- **Configuration as simple objects** - No enterprise ConfigManager, just export const CONFIG
- **Performance through simplicity** - Less code = faster execution = easier optimization
- **Memory management where it matters** - Focus on Three.js resource cleanup, not everything
- **Grow complexity incrementally** - Add features one at a time, test thoroughly

## Technical Requirements

### Core Technologies
- **HTML5** - Structure and Canvas/WebGL for game rendering
- **CSS3** - Styling, animations, and responsive design
- **JavaScript** - Game logic, controls, and interactivity
- **Three.js** - 3D graphics and WebGL abstraction
- **Canvas API** - 2D graphics rendering
- **Web Audio API** - Sound effects and music

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Standard File Structure for New Games
```
game-name/
├── index.html          # Main HTML file
├── css/
│   ├── style.css       # Main stylesheet
│   └── responsive.css  # Mobile responsive styles
├── js/
│   ├── core/          # Core engine components
│   │   ├── entity.js       # Entity class
│   │   ├── components.js   # Component definitions
│   │   ├── game-engine.js  # Game loop and state
│   │   └── config.js       # Simple configuration object
│   ├── systems/       # Game systems (one per file)
│   │   ├── input-system.js
│   │   ├── movement-system.js
│   │   ├── ai-system.js
│   │   └── ui-system.js
│   ├── managers/      # Specific managers
│   │   ├── arena-builder.js
│   │   └── player-manager.js
│   └── utils/         # Helper functions
│       ├── utils.js
│       └── constants.js
├── assets/
│   ├── sounds/        # Audio files
│   ├── images/        # Graphics and sprites
│   └── models/        # 3D models (if applicable)
└── README.md          # Game documentation
```

## Development Best Practices

### Professional Code Standards (KISS Approach)
- **Simple, readable code** - Code that clearly expresses its intent without clever tricks
- **Start basic, refactor when needed** - Build working features before optimizing structure
- **Clear separation of concerns** - One file, one purpose; one function, one responsibility
- **Explicit dependencies** - Pass what you need, don't hide behind singletons or globals
- **Simple error handling** - Use try-catch where needed, log clearly with console.error
- **Configuration as code** - Simple exported objects, no configuration frameworks
- **Avoid premature patterns** - Don't add Singleton/Observer/Factory until you need them twice

### Performance Optimization
- Use requestAnimationFrame for smooth animations
- Optimize rendering (only redraw changed areas)
- Implement object pooling for frequently created objects
- Minimize DOM manipulations
- Use CSS transforms for UI animations

### Accessibility Standards
- High contrast mode support
- Colorblind-friendly design (obstacle height-based colors help)
- Keyboard-only navigation
- Screen reader compatibility
- Adjustable difficulty/speed settings

### Cross-Platform Considerations
- Responsive design for various screen sizes
- Touch controls for mobile devices
- Performance optimization for lower-end devices
- Progressive enhancement approach

## Common Game Features to Implement

### Essential Systems
1. **Game Loop** - Main update and render cycle
2. **Input Handling** - Keyboard, mouse, touch controls
3. **Collision Detection** - Physics and boundary checking
4. **State Management** - Game states (menu, playing, paused, game over)
5. **Audio System** - Sound effects and background music
6. **UI System** - Menus, HUD, and user interface elements

### Advanced Features
7. **Particle Systems** - Visual effects and feedback
8. **Animation System** - Smooth transitions and movements
9. **Save/Load System** - Game progress persistence
10. **Settings System** - User preferences and customization

---

## Bollen-I-Burken Specific Notes

### Dynamic Vision System Architecture
The dynamic vision system creates realistic AI hunter behavior through range/angle trade-offs:

**Core Concept**: AI vision adapts based on scan target distance
- **Far targets (>60% of max range)**: Narrow beam (0.15x angle), extended range (2.875x)
- **Near targets (<30% of max range)**: Wide peripheral (1.2x angle), reduced range (0.8x)
- **Mid-range**: Normal vision (1.0x both)

**Key Features**:
- Smoothing factor (10% new, 90% old) prevents vision twitching
- Uses REAL obstacle distances from can-guard-strategy.js
- Vision cone mesh updates dynamically in movement-system.js
- Color changes: red (detected), bright yellow (focused), orange (patrol)

**Integration Flow**:
```
can-guard-strategy.js (sets scan target obstacle)
    ↓
dynamic-vision.js (calculates dynamic range/angle)
    ↓
ai-system.js (applies to VisionCone component)
    ↓
movement-system.js (updates mesh geometry & color)
```

### Multiple Hunter Patrol Patterns
Each hunter initializes randomized state once in can-guard-strategy.js:
- `orbitRadius`: 4.5-7.5m (each hunter patrols at different distance)
- `orbitDirection`: +1 or -1 (clockwise/counter-clockwise)
- `moveSpeedMultiplier`: 0.8-1.2x (varied movement speed)
- `turnSpeedMultiplier`: 1.2-2.2x (varied turn rate)
- `scanDuration`: 0-500ms random offset
- `nextScanChange`: 500-2000ms (varied scan intervals)

**Emergent Complexity**: 6 hunters with randomized parameters create the illusion of 6 different AI personalities patrolling independently!

### Difficulty System
10 levels with Swedish cultural names:
- **Level 0-1**: 1 hunter (learning mode)
- **Level 2-3**: 2 hunters (balanced)
- **Level 4-5**: 3 hunters (challenging)
- **Level 6-7**: 4 hunters (expert)
- **Level 8**: 5 hunters (nightmare - "Guds Öga")
- **Level 9**: 6 hunters (impossible - "Systemet Stänger om 5 Minuter")

Obstacle scaling:
- More obstacles = easier (more hiding spots)
- Near-can obstacles always short (0.3-0.6m) & green
- Difficulty-based canExclusionRadius (3-12m)
- Height-based colors: green→yellow→orange→red

### Player Win Condition
Located in `movement-system.js checkPlayerWinCondition()`:
1. Check game phase is PLAYING
2. Check distance to can (<= 2m)
3. Check action1 key (space) is pressed
4. Call `gameEngine.playerWin()`
5. Show "DU VÄN FÖR DIG!" victory menu

**Important**: Vision cone geometry updates in same file - keep synced with dynamic vision!

---

**Development Process:** Start with basic setup, implement core mechanics, add polish and features, then test across platforms.

**Remember**: KISS over enterprise patterns, direct imports over aggregators, simple CONFIG over ConfigManager, 500-line file limit enforced!
