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

### 2. Dunkgömme (In Development)
3D hide-and-seek arena game
- Location: Root folder
- Technologies: Three.js, WebGL, HTML5
- Features: 3D arena, character movement, gladiatorial theme

#### Recent Updates
- Added full-screen start / game over menu overlay with Swedish context and controls primer (`index.html`, `css/style.css`, `js/ui.js`)
- Implemented Play Again flow that rebuilds the arena and entities without reloading the page
- Gated input, movement, and AI systems to idle while in START_MENU or GAME_OVER states for reliable restarts

#### Notes for Next AI Assistant
- Preserve the new START_MENU and COUNTDOWN states; do not reintroduce the old MENU phase when expanding state handling
- When adding features, keep showStartMenu / hideStartMenu helpers centralized (exported on window) and reuse them instead of duplicating DOM logic
- Restart flow depends on PlayerManager.clearAll() and gameEngine.reset(); update both if you add new entities or resources so rounds remain leak-free

#### CRITICAL: Legacy Cleanup & KISS Refactoring Completed (Oct 2025)
**Major architectural cleanup completed - MUST preserve these improvements:**

1. **File Size Limits** - ALL files MUST be 400-500 lines maximum
   - If a file exceeds 500 lines, it MUST be split into smaller modules
   - Each system MUST be in its own file (no monolithic files)
   - Example: UI split into `ui-system.js` (main) + `menu-overlay.js` (menus)

2. **Folder Structure - KISS Architecture**
   ```
   js/
   ├── main.js                    # Bootstrap only (KEEP in root)
   ├── utils.js                   # Core utilities (KEEP in root)
   ├── debug-commands.js          # Debug tools (KEEP in root)
   ├── core/                      # ECS primitives
   │   ├── entity.js
   │   ├── components/            # Individual component files
   │   ├── game-state.js
   │   └── game-engine.js
   ├── systems/                   # ONE SYSTEM PER FILE
   │   ├── input/
   │   │   └── input-system.js    # MOVED from controls.js
   │   ├── audio/
   │   │   └── audio-system.js    # MOVED from audio.js
   │   ├── ui/
   │   │   ├── ui-system.js       # MOVED from ui.js
   │   │   └── menu-overlay.js    # Menu-specific logic
   │   ├── movement-system.js
   │   ├── ai/
   │   ├── interaction/
   │   └── network/
   └── managers/                  # Specific managers
       ├── arena/                 # Arena split into modules
       ├── player-manager.js
       ├── player-factory.js
       └── game-lifecycle.js
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
- Colorblind-friendly design
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

**Development Process:** Start with basic setup, implement core mechanics, add polish and features, then test across platforms.
