# Bollen i Burken - 3D Arena Game

A multiplayer-ready 3D hide-and-seek arena game built with Three.js and modern web technologies.

## 🎮 Game Overview

**Bollen i Burken** (Swedish for "Ball in the Jar") is a 3D gladiatorial arena game where players navigate a circular arena from an "emperor's view" perspective. The game features a multiplayer-ready architecture designed for scalability from day one.

### Current Features (Phase 1)
- ✅ 3D arena environment with emperor's view camera
- ✅ Controllable player character with WASD movement
- ✅ Collision detection with arena boundaries
- ✅ Entity-Component-System architecture
- ✅ Tick-based game loop (network-ready)
- ✅ Real-time UI with game stats
- ✅ Procedural audio system
- ✅ Touch controls for mobile devices
- ✅ Responsive design

### Planned Features (Future Phases)
- 🔄 WebRTC/WebSocket multiplayer networking
- 🔄 Hide-and-seek gameplay mechanics
- 🔄 Multiple player roles (seeker vs hiders)
- 🔄 Enhanced arena with hiding spots
- 🔄 Spectator mode and replay system

## 🚀 Quick Start

1. **Clone or download** the `Bollen-I-Burken/` folder
2. **Open** `index.html` in a modern web browser
3. **Play** using WASD keys or arrow keys to move

### Browser Requirements
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🏗️ Architecture

### Multiplayer-Ready Design
The game is built with multiplayer in mind from the start:

- **Entity-Component-System (ECS)** - Scalable entity management
- **Tick-based Game Loop** - 60 TPS separate from rendering FPS
- **State Separation** - Game logic independent of rendering
- **Network-Ready Structure** - Player entities with IDs and timestamps

### File Structure
```
Bollen-I-Burken/
├── index.html              # Main HTML file
├── css/
│   ├── style.css           # Main stylesheet
│   ├── responsive.css      # Mobile responsive styles
│   └── ui.css             # Game UI specific styles
├── js/
│   ├── game.js             # Core game logic and ECS system
│   ├── controls.js         # Input handling system
│   ├── ui.js              # User interface management
│   ├── audio.js           # Sound management system
│   ├── arena.js           # 3D arena creation and management
│   ├── player.js          # Player entity and movement
│   ├── networking.js      # Multiplayer networking (placeholder)
│   └── utils.js           # Utility functions and helpers
├── assets/
│   ├── sounds/            # Audio files (placeholder)
│   ├── images/            # Graphics and sprites (placeholder)
│   └── models/            # 3D models (placeholder)
└── README.md              # This documentation
```

## 🎯 Controls

### Desktop
- **WASD** or **Arrow Keys** - Move player
- **P** - Pause game
- **ESC** - Menu/Settings

### Mobile
- **Touch D-Pad** - Move player
- **Action Buttons** - Game actions

### Gamepad
- **Left Stick** - Move player
- **A/B/X/Y** - Action buttons

## 🛠️ Development

### Core Systems

1. **Game Engine** (`js/game.js`)
   - Entity-Component-System implementation
   - Fixed timestep game loop (60 TPS)
   - Performance tracking and statistics

2. **Arena System** (`js/arena.js`)
   - 3D arena geometry creation
   - Lighting and visual effects
   - Camera positioning

3. **Player System** (`js/player.js`)
   - Player entity management
   - Movement with collision detection
   - Smooth interpolation for rendering

4. **Input System** (`js/controls.js`)
   - Keyboard, touch, and gamepad support
   - Input timestamping for networking
   - Mobile-friendly touch controls

5. **UI System** (`js/ui.js`)
   - Real-time game statistics
   - Player list and networking status
   - Responsive interface elements

6. **Audio System** (`js/audio.js`)
   - Procedural sound generation
   - Web Audio API with fallback
   - Ambient music and sound effects

7. **Network System** (`js/networking.js`)
   - Placeholder for future multiplayer
   - WebRTC and WebSocket support planned
   - Lag compensation architecture

### Technical Details

- **Three.js** - 3D graphics rendering
- **Web Audio API** - Procedural audio generation
- **Canvas API** - 2D UI elements
- **ECS Pattern** - Scalable entity management
- **Fixed Timestep** - Network-friendly game loop

## 🎨 Customization

### Arena Modifications
Edit `js/arena.js` to customize:
- Arena size and shape
- Lighting and atmosphere
- Decorative elements
- Hiding spots placement

### Player Behavior
Edit `js/player.js` to modify:
- Movement speed and physics
- Player appearance
- Collision boundaries
- Special abilities

### Visual Style
Edit CSS files to customize:
- Color schemes and themes
- UI layout and positioning
- Mobile responsive behavior
- Animation effects

## 🔧 Configuration

Game constants can be modified in `js/utils.js`:

```javascript
const GAME_CONFIG = {
    ARENA_SIZE: 10,          // Arena radius
    PLAYER_SPEED: 0.1,       // Movement speed per tick
    TICK_RATE: 60,           // Game updates per second
    CANVAS_WIDTH: 800,       // Rendering width
    CANVAS_HEIGHT: 600,      // Rendering height
    CAMERA_HEIGHT: 15,       // Camera Y position
    CAMERA_DISTANCE: 10      // Camera Z position
};
```

## 🐛 Debugging

Open browser console and use `debugGame()` to access:
- Game engine state
- System statistics
- Performance metrics
- Entity information

## 🤝 Contributing

The game is designed for easy expansion:

1. **Add new systems** by extending the `System` class
2. **Create new components** for additional game features
3. **Implement networking** in `js/networking.js`
4. **Add new game modes** by modifying game states

## 📱 Mobile Support

The game includes comprehensive mobile support:
- Touch controls with virtual D-pad
- Responsive UI scaling
- Performance optimization for mobile devices
- Progressive Web App capabilities (future)

## 🌐 Browser Compatibility

Built with modern web standards:
- ES6+ JavaScript features
- WebGL for 3D rendering
- Web Audio API for sound
- CSS Grid and Flexbox
- Progressive enhancement approach

## 📈 Performance

Optimized for smooth gameplay:
- 60 FPS rendering with interpolation
- Efficient memory management
- Object pooling for entities
- Minimal DOM manipulation
- Optimized shadow mapping

## 🔮 Future Roadmap

### Phase 2: Enhanced Arena
- Detailed 3D models and textures
- Dynamic lighting effects
- Particle systems for atmosphere
- Multiple arena layouts

### Phase 3: Multiplayer Foundation
- WebRTC peer-to-peer networking
- Real-time state synchronization
- Lag compensation and prediction
- Join/leave game functionality

### Phase 4: Hide and Seek Mechanics
- Seeker vs hider game modes
- Hiding spot mechanics
- Win/lose conditions
- Scoring and leaderboards

### Phase 5: Polish and Features
- Advanced audio system
- Replay and spectator modes
- Achievement system
- Tournament modes

## 📄 License

This project is part of a game development learning exercise. Feel free to use and modify for educational purposes.

## 🙏 Acknowledgments

- **Three.js** community for excellent 3D web graphics
- **Web Audio API** for procedural sound capabilities
- **Modern web standards** for cross-platform compatibility

---

**Ready to play?** Open `index.html` in your browser and start moving with WASD keys! 🎮