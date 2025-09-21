# 🎮 Fantastic Tetris

A modern, advanced web-based Tetris game built with cutting-edge web technologies, featuring AI assistance, 3D graphics capabilities, and innovative gameplay mechanics.

## 🚀 Features

### Core Gameplay
- **Classic Tetris Mechanics**: All 7 standard tetrominoes (I, O, T, S, Z, J, L)
- **Super Rotation System (SRS)**: Authentic piece rotation with wall kicks
- **Ghost Piece**: Preview where pieces will land
- **Hold Function**: Save pieces for later use
- **Next Piece Preview**: See upcoming pieces
- **Progressive Difficulty**: Speed increases with level

### Advanced Features
- **🤖 AI Assistant**: Smart piece placement suggestions with confidence scoring
- **🎵 Procedural Music**: Dynamic soundtrack that adapts to gameplay
- **📱 Mobile Support**: Touch controls and responsive design
- **🎨 Modern UI**: Beautiful gradients, animations, and particle effects
- **⚡ Performance Monitoring**: Real-time FPS and PPS tracking
- **🔧 Customizable Controls**: Keyboard, mouse, touch, and gamepad support

### Technical Excellence
- **ES6 Modules**: Clean, modular architecture
- **Web Audio API**: Advanced sound management with spatial audio
- **Canvas Rendering**: Multi-layer rendering system
- **PWA Ready**: Service worker support for offline play
- **Accessibility**: Screen reader support, high contrast mode
- **Cross-Platform**: Works on desktop, mobile, and tablets

## 🛠️ Technologies Used

- **HTML5**: Semantic structure and Canvas API
- **CSS3**: Custom properties, animations, responsive design
- **JavaScript ES6+**: Modern syntax with modules
- **Web Audio API**: Advanced audio processing
- **Canvas API**: High-performance 2D rendering
- **Service Worker**: PWA functionality
- **LocalStorage**: Save game state and settings

## 📁 Project Structure

```
hemsida/
├── index.html              # Main game page
├── css/
│   ├── style.css          # Main stylesheet
│   └── responsive.css     # Mobile optimizations
├── js/
│   ├── game.js           # Main game engine
│   ├── board.js          # Game board logic
│   ├── pieces.js         # Tetromino system
│   ├── controls.js       # Input handling
│   ├── ui.js            # User interface
│   ├── audio.js         # Audio management
│   └── ai.js            # AI assistant
├── assets/
│   ├── sounds/          # Audio files
│   └── images/          # Graphics and icons
├── package.json         # Dependencies and scripts
├── claude.md           # Detailed project documentation
└── Plan.md             # Development roadmap
```

## 🎯 Getting Started

### Prerequisites
- Modern web browser (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
- Local web server (for development)

### Quick Start

1. **Clone or download** this repository
2. **Start a local server**:
   ```bash
   # Python 3
   python -m http.server 8000

   # Node.js (if you have live-server installed)
   npx live-server --port=8000

   # PHP
   php -S localhost:8000
   ```
3. **Open your browser** and navigate to `http://localhost:8000`
4. **Start playing!** 🎮

### Development Setup

For development with hot reload and advanced features:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## 🎮 How to Play

### Basic Controls

| Key | Action |
|-----|--------|
| `←` `→` | Move piece left/right |
| `↑` | Rotate piece clockwise |
| `Z` | Rotate piece counterclockwise |
| `↓` | Soft drop (faster fall) |
| `Space` | Hard drop (instant fall) |
| `C` | Hold piece |
| `P` | Pause game |
| `R` | Restart game |

### Mobile Controls
- **Swipe left/right**: Move piece
- **Swipe down**: Soft drop
- **Tap**: Rotate piece
- **Double tap**: Hard drop
- **Long press**: Hold piece

### Scoring System
- **Single line**: 100 × level
- **Double lines**: 300 × level
- **Triple lines**: 500 × level
- **Tetris (4 lines)**: 800 × level
- **Soft drop**: 1 point per cell
- **Hard drop**: 2 points per cell

## 🤖 AI Assistant

The built-in AI assistant provides intelligent piece placement suggestions:

- **Difficulty Levels**: Easy, Normal, Hard, Expert
- **Pattern Recognition**: Detects T-spin and Tetris setups
- **Confidence Scoring**: Shows how certain the AI is about suggestions
- **Learning System**: Adapts to your playing style
- **Performance Analytics**: Tracks improvement over time

### AI Features
- Multi-step lookahead analysis
- Board evaluation with weighted factors
- T-spin and perfect clear detection
- Opening pattern recognition
- Real-time performance monitoring

## 📱 Progressive Web App

This game is PWA-ready, meaning you can:

- **Install on mobile**: Add to home screen for native-like experience
- **Play offline**: Game works without internet connection
- **Background sync**: Save progress across devices
- **Push notifications**: Get notified about achievements

## 🎨 Themes and Customization

### Visual Themes
- **Dark Mode** (default): Sleek, modern appearance
- **Light Mode**: Clean, bright interface
- **High Contrast**: Accessibility-focused design
- **Colorblind Friendly**: Alternative color schemes

### Audio Settings
- **Master Volume**: Overall audio level
- **Music Volume**: Background music control
- **SFX Volume**: Sound effects control
- **Spatial Audio**: 3D positional sound
- **Procedural Music**: AI-generated adaptive music

### Gameplay Options
- **Ghost Piece**: Toggle piece preview
- **AI Assistance**: Enable/disable AI hints
- **Drop Speed**: Adjust piece fall rate
- **Control Sensitivity**: Customize input timing

## 🏆 Achievements System

Unlock achievements as you play:

- 🎯 **First Steps**: Score 1,000 points
- 🏆 **Tetris Master**: Clear 4 lines at once
- ⚡ **Speed Demon**: Reach level 10
- 📏 **Line Clearer**: Clear 100 lines total
- 🏃 **Marathon Runner**: Play for 10 minutes

## 📊 Statistics Tracking

Detailed performance metrics:

- **Games Played**: Total game sessions
- **Best Score**: Personal high score
- **Average PPS**: Pieces per second
- **Line Efficiency**: Single vs. multi-line clears
- **Piece Distribution**: Usage of each tetromino
- **T-spin Count**: Advanced technique tracking

## 🔧 Development

### Architecture

The game follows a modular architecture with clear separation of concerns:

- **Game Engine** (`game.js`): Main game loop and state management
- **Board Logic** (`board.js`): Grid operations and collision detection
- **Piece System** (`pieces.js`): Tetromino definitions and behaviors
- **Input Controller** (`controls.js`): Multi-input handling with DAS/ARR
- **UI Manager** (`ui.js`): Interface updates and modal management
- **Audio Manager** (`audio.js`): Web Audio API integration
- **AI Assistant** (`ai.js`): Machine learning for gameplay assistance

### Performance Optimizations

- **Canvas Layering**: Separate canvases for game, ghost, and effects
- **Object Pooling**: Reuse objects for particles and effects
- **Efficient Rendering**: Only redraw changed areas
- **Web Workers**: Background processing for AI calculations
- **Caching**: Smart caching of expensive operations

### Browser Compatibility

| Browser | Version | Support Level |
|---------|---------|---------------|
| Chrome | 80+ | ✅ Full |
| Firefox | 75+ | ✅ Full |
| Safari | 13+ | ✅ Full |
| Edge | 79+ | ✅ Full |
| Mobile Safari | 13+ | ✅ Full |
| Chrome Mobile | 80+ | ✅ Full |

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Report Bugs**: Use the issue tracker for bug reports
2. **Suggest Features**: Propose new gameplay mechanics or features
3. **Code Contributions**: Submit pull requests with improvements
4. **Documentation**: Help improve documentation and guides
5. **Testing**: Test on different devices and browsers

### Development Guidelines

- Use ES6+ features and modern JavaScript
- Follow the existing code style and architecture
- Add comments for complex algorithms
- Test on multiple browsers and devices
- Ensure accessibility compliance

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Tetris**: Created by Alexey Pajitnov
- **SRS Guidelines**: The Tetris Company specification
- **Web Audio API**: Advanced audio processing
- **Canvas API**: High-performance graphics rendering
- **Modern Web Standards**: Progressive Web App capabilities

## 🔗 Links

- **Live Demo**: [Play Now](http://localhost:8000) (when server is running)
- **Documentation**: See `claude.md` for detailed technical docs
- **Development Plan**: See `Plan.md` for roadmap and milestones
- **Issue Tracker**: Report bugs and request features

---

**Built with ❤️ using modern web technologies**

*Experience Tetris like never before with AI assistance, procedural music, and cutting-edge web features!*