# Bollen i Burken - 3D Swedish Hide-and-Seek Game

A 3D digital version of the classic Swedish hide-and-seek game "Bollen i Burken" (Ball in the Jar), built with Three.js and modern web technologies.

## 🎮 What is "Bollen i Burken"?

**Bollen i Burken** (also called "Burken" or "Dunkgömme" in some parts of Sweden) is a beloved Swedish outdoor game that's like an advanced version of hide-and-seek. Here's how the traditional game works:

### Traditional Game Rules:
1. **The Guard (Vaktare)**: One player protects a can/bucket/object (the "burk")
2. **The Hiders**: All other players hide while the guard counts
3. **Spotting**: The guard tries to spot hidden players and "tag" them by running to the can and shouting: *"[Name] bakom [hiding spot] är burkad, 1, 2, 3!"* (e.g., "Lisa behind the shed is tagged, 1, 2, 3!")
4. **The Rescue**: Hidden players try to sneak to the can and kick it over, shouting *"Burken är sparkad, 1, 2, 3!"* (The can is kicked, 1, 2, 3!) to free themselves and any tagged players
5. **Victory**: The guard wins when all players are tagged. If someone kicks the can, all tagged players are freed and the round continues

### Our 3D Digital Version:
This game brings the classic Swedish game into a 3D arena environment:
- **3D Arena**: A gladiatorial-style arena viewed from an "emperor's perspective" 
- **Player Character**: Move around the arena using WASD controls
- **AI Seeker**: An AI-controlled "guard" that hunts for the player
- **Hide and Seek Mechanics**: Future features will include hiding spots and the classic "can kicking" rescue mechanic
- **Swedish Gaming Heritage**: Preserving and modernizing this classic Swedish children's game for the digital age

### Current Features (Phase 1)
- ✅ 3D arena environment with "emperor's view" camera positioning
- ✅ Controllable player character with smooth WASD movement
- ✅ AI hunter with basic patrol behavior (the digital "guard")
- ✅ Collision detection with arena boundaries
- ✅ Entity-Component-System architecture for scalable gameplay
- ✅ Professional debugging and development tools
- ✅ Enterprise-level code structure and error handling
- ✅ Real-time UI with game statistics

### Planned Features (Future Phases)
- 🔄 **Hide-and-Seek Mechanics**: Hiding spots around the arena
- 🔄 **"Can Kicking" System**: Digital version of the rescue mechanic
- 🔄 **AI Vision System**: Seeker can spot and chase the player
- 🔄 **Multiple Game Modes**: Classic rules, timed rounds, team play
- 🔄 **Multiplayer Support**: WebRTC/WebSocket for online play
- 🔄 **Swedish Localization**: Game text and instructions in Swedish
- 🔄 **Sound Effects**: Traditional Swedish children's game sounds
- 🔄 **Arena Variations**: Different environments and hiding spot layouts

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

## �🇪 Cultural Heritage & Game Origins

**Bollen i Burken** is an important part of Swedish childhood culture, traditionally played outdoors in yards, parks, and playgrounds across Sweden. The game:

- **Trains Skills**: Develops motor skills, reaction time, and group dynamics
- **Social Play**: Teaches strategy, teamwork, and fair play
- **Age Range**: Suitable for children from about 5 years old
- **Regional Variations**: Different names and slight rule variations across Sweden
- **Seasonal Game**: Traditionally played during warmer months when children can play outdoors

### Why Digital Preservation Matters
By creating a 3D digital version, we're:
- **Preserving Culture**: Keeping Swedish gaming traditions alive for new generations
- **Global Sharing**: Introducing international players to Swedish childhood games
- **Weather Independence**: Allowing the game to be played year-round, indoors
- **Educational Value**: Teaching traditional Swedish games in schools and cultural centers
- **Modern Innovation**: Showing how classic games can evolve with technology

## �🏗️ Technical Architecture

### Game-Ready Design
The technical foundation is built to support the unique mechanics of Bollen i Burken:

- **Entity-Component-System (ECS)** - Scalable management of players, AI seekers, and game objects
- **3D Spatial Awareness** - Arena-based movement with hiding spot detection
- **AI Seeker System** - Intelligent hunter that can spot and chase players
- **State Management** - Game phases (hiding, seeking, caught, rescued)
- **Future Multiplayer** - Architecture ready for online Swedish hide-and-seek sessions

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
- **WASD** or **Arrow Keys** - Move your character around the arena
- **P** - Pause game
- **ESC** - Menu/Settings

### Mobile (Future)
- **Touch D-Pad** - Move player
- **Action Buttons** - Game actions

### Debug Commands (Development)
Open browser console and try:
- `debugGame()` - View game engine state
- `debugMovement()` - Check movement system
- `debugConfig()` - View configuration settings

## 🛠️ Development

### Core Systems

1. **Game Engine** (`js/game.js`)
   - Entity-Component-System implementation
   - Game state management for hide-and-seek phases
   - Performance tracking and statistics

2. **Arena System** (`js/arena.js`)
   - 3D arena geometry creation
   - Lighting and "emperor's view" camera positioning
   - Future: Hiding spot placement and management

3. **Player System** (`js/player.js`)
   - Player entity management with Swedish game mechanics
   - Movement with collision detection
   - Future: Hiding state and visibility management

4. **AI Seeker System** (`js/ai.js`)
   - AI hunter behavior (the digital "guard")
   - Patrol patterns and player detection
   - Future: Advanced vision system and hunting behavior

5. **Input System** (`js/controls.js`)
   - WASD movement controls
   - Future: Quick-hide and can-kicking actions

6. **UI System** (`js/ui.js`)
   - Real-time game statistics
   - Future: Swedish text localization and cultural elements

7. **Audio System** (`js/audio.js`)
   - Placeholder for traditional Swedish game sounds
   - Future: Footstep sounds, ambient arena audio, victory/defeat sounds

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

### Phase 2: Classic Bollen i Burken Mechanics
- **Hiding Spots**: Interactive objects to hide behind/in
- **AI Vision System**: Seeker can spot players who aren't hidden
- **"Can" Object**: Central object that can be "kicked" to free caught players
- **Tagging System**: Players get "caught" when spotted by the seeker
- **Rescue Mechanics**: Implement the classic Swedish rescue gameplay

### Phase 3: Enhanced Swedish Experience  
- **Multiple Arena Layouts**: Different Swedish-inspired environments
- **Seasonal Themes**: Summer playground, winter courtyard, forest clearing
- **Swedish Audio**: Traditional children's rhymes and game calls
- **Cultural Education**: In-game information about Swedish game traditions
- **Achievement System**: Unlock Swedish folklore and gaming history

### Phase 4: Modern Multiplayer
- **Online Multiplayer**: Play traditional Bollen i Burken with friends worldwide
- **Tournament Mode**: Competitive Swedish hide-and-seek championships
- **Spectator Mode**: Watch games with traditional Swedish commentary
- **Mobile App**: Take Swedish gaming culture on the go

### Phase 5: Educational & Cultural Impact
- **School Integration**: Curriculum modules for teaching Swedish culture
- **Museum Partnerships**: Interactive exhibits about Swedish childhood games
- **International Festivals**: Showcase Swedish gaming heritage globally
- **Documentation Project**: Record regional variations and family traditions

## 📄 License

This project is part of a game development learning exercise. Feel free to use and modify for educational purposes.

## 🙏 Acknowledgments

- **Swedish Children**: For generations of Bollen i Burken players who kept this tradition alive
- **Cultural Heritage**: The importance of preserving traditional Swedish games
- **Three.js Community**: For excellent 3D web graphics capabilities
- **Modern Web Standards**: Enabling cross-platform Swedish gaming experiences
- **Swedish Gaming Culture**: Inspiration from the rich tradition of outdoor children's games

---

**Ready to experience Swedish gaming heritage?** Open `index.html` in your browser and start exploring the digital arena! Use WASD keys to move your character and experience the foundation of this classic Swedish hide-and-seek game. 🇸🇪🎮