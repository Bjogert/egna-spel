Create a 3D digital version of the classic Swedish hide-and-seek game "Dunkgömme" using Three.js with the following specifications:

## 🇸🇪 GAME CONCEPT: TRADITIONAL SWEDISH HIDE-AND-SEEK

**"Dunkgömme"** (Ball in the Jar) is a beloved Swedish children's game that combines hide-and-seek with strategy and rescue mechanics. This 3D version brings the traditional outdoor game into a digital arena environment while preserving the core Swedish gaming heritage.

### Traditional Game Elements to Digitize:
- **The Guard (Vaktare)**: AI seeker that hunts players
- **The Can (Burken)**: Central object that can be "kicked" to rescue caught players  
- **Hiding Mechanics**: Players must find cover to avoid being spotted
- **Tagging System**: Players get caught when spotted by the guard
- **Rescue System**: Free caught players by reaching the can
- **Swedish Calls**: Digital versions of traditional Swedish game phrases

### Cultural Preservation Goals:
- Introduce international players to Swedish gaming traditions
- Preserve classic childhood game mechanics in digital form
- Educational value about Swedish cultural heritage
- Modern accessibility while maintaining traditional spirit

**KISS + PROFESSIONAL ARCHITECTURE**
Build slow and keep it as simple as possible. 
No unnecessary fluff and functions. Always keep scalability in mind.
Use enterprise-level code structure and professional development patterns.

**SCALABILITY & PROFESSIONAL STANDARDS:**
- Design every system to handle growth and expansion from day one
- Use industry-standard architectural patterns (MVC, Observer, Factory, etc.)
- Implement clean code principles with clear separation of concerns
- Build modular, reusable components that can be easily extended
- Use dependency injection and configuration-driven design
- Structure code for maintainability, testing, and team collaboration
- Follow SOLID principles and enterprise development best practices


CAMERA & PERSPECTIVE:
- 3D scene with camera positioned high above the arena, looking down at an angle
- Camera should be like an "emperor's view" from the top edge of a gladiatorial arena
- Slightly tilted perspective (not straight top-down) to show depth and 3D structure
- Fixed camera position initially

**ARENA DESIGN: SWEDISH PLAYGROUND INSPIRED**
- Simple SQUARE arena floor representing a Swedish schoolyard/playground
- BIGGER arena size for authentic hide-and-seek movement space
- Raised arena walls around the perimeter (traditional playground boundaries)
- Arena should have depth - representing a sunken play area
- **Central "Can" Object**: The focal point for rescue mechanics (future feature)
- **Hiding Spots**: Strategic placement for authentic Swedish game experience (future)
- NO decorative elements initially - focus on gameplay fundamentals

**PLAYER CHARACTER: THE HIDER**
- 3D character (simple cube evolving to child-like figure) representing the "hider"
- Smooth movement using WASD keys (traditional playground running)
- Character moves on the 3D arena floor plane
- Collision detection with arena walls and obstacles
- **Future**: Hiding states (crouched, behind objects, in spots)

**AI SEEKER: THE DIGITAL GUARD**
- AI-controlled seeker representing the traditional "vaktare" (guard)
- Patrol behavior around the arena perimeter and center
- **Future**: Vision system for spotting players
- **Future**: Swedish-style "tagging" calls when spotting players
- **Future**: Intelligent hunting and searching behavior

TECHNICAL REQUIREMENTS:
- HTML file with Three.js (import from CDN)
- Basic lighting setup to show 3D depth
- 60fps render loop
- BIGGER canvas size (larger than 800x600 pixels)
- Remove unnecessary complex systems until basics work

Start with the folder structure and then do the basic 3D arena geometry and a controllable 3D character - we'll add hide and seek gameplay later.

**SIMPLIFICATION REQUIREMENTS: FOCUS ON SWEDISH GAME CORE**

**KEEP IT MINIMAL AND CULTURALLY AUTHENTIC:**
- Focus on the essential Swedish hide-and-seek mechanics first
- Build the digital "playground" foundation before adding complexity
- Prepare clean architecture for traditional game rule implementation
- Future integration of Swedish cultural elements and language

**ARENA CHANGES FOR AUTHENTICITY:**
- Change from circular to simple SQUARE arena (Swedish schoolyard style)
- Make arena BIGGER than current size for proper hide-and-seek gameplay
- Remove complex decorations that don't serve Swedish game mechanics
- Keep only: square floor, simple walls, basic lighting, central space for "can"

**TECHNICAL FOUNDATION:**
- Make game window BIGGER for better arena visibility
- Increase canvas size for immersive Swedish playground experience
- Professional code structure ready for Swedish cultural features

**DEVELOPMENT PRIORITIES:**
1. Get basic square arena working perfectly (Swedish playground foundation)
2. Get player movement smooth with WASD (traditional playground running)
3. Get camera positioned correctly (observer perspective)
4. Add AI seeker with basic patrol behavior (digital guard)
5. Prepare clean foundation for Swedish hide-and-seek mechanics

**FUTURE SWEDISH INTEGRATION:**
- **Phase 2**: Add central "can" object and rescue mechanics
- **Phase 3**: Implement hiding spots and vision system
- **Phase 4**: Add Swedish language elements and cultural audio
- **Phase 5**: Educational content about Swedish gaming heritage

## COMPLETE FILE STRUCTURE

Following the standard game structure from CLAUDE.md with multiplayer-ready architecture:

```
Bollen-I-Burken/
├── index.html              # Main HTML file with Three.js integration
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
│   ├── networking.js      # Future multiplayer networking (placeholder)
│   └── utils.js           # Utility functions and helpers
├── assets/
│   ├── sounds/            # Audio files
│   │   ├── ambient.mp3    # Arena ambient sounds
│   │   ├── footsteps.mp3  # Player movement sounds
│   │   └── effects/       # Game effect sounds
│   ├── images/            # Graphics and sprites
│   │   ├── ui/           # UI elements
│   │   └── textures/     # 3D textures
│   └── models/            # 3D models (if applicable)
├── Bollen-I-Burken.md     # This specification file
└── README.md              # Game documentation
```

## DEVELOPMENT PLAN: DIGITAL SWEDISH HERITAGE PROJECT

**ARCHITECTURE FOCUS: Swedish Game Mechanics + Professional Foundation**
- **Cultural Authenticity**: Preserve traditional Swedish hide-and-seek gameplay
- **Enterprise-grade patterns**: Professional architecture for educational/cultural use
- **Scalability-first design**: Support for multiple players and Swedish regional variations
- **Educational Integration**: Built for schools and cultural institutions
- **Heritage Documentation**: Code structure that supports cultural preservation goals

### Phase 1: Swedish Playground Foundation (COMPLETED ✅)
**Goal: Digital recreation of Swedish schoolyard with basic movement + AI guard**

**Step 1.1: Core Swedish Arena Foundation (COMPLETED ✅)**
- [x] Simple square arena representing Swedish playground/schoolyard
- [x] "Emperor's view" camera (adult supervisor perspective)
- [x] BIGGER arena size suitable for traditional hide-and-seek
- [x] Remove decorative elements that don't serve Swedish game mechanics
- [x] Professional enterprise architecture supporting cultural features

**Step 1.2: Basic Swedish Gameplay (COMPLETED ✅)**
- [x] Player character with WASD movement (traditional running)
- [x] AI hunter with patrol behavior (digital "vaktare"/guard)
- [x] Arena collision detection for playground boundaries
- [x] Clean foundation ready for Swedish hide-and-seek mechanics

**Step 1.3: Enterprise Foundation for Cultural Project (COMPLETED ✅)**
- [x] **ResourceManager**: Professional Three.js management for educational stability
- [x] **ErrorHandler**: Enterprise error handling for institutional use
- [x] **ConfigManager**: Configuration system ready for Swedish localization
- [x] **ComponentValidator**: Robust validation for educational software standards
- [x] ECS architecture supporting traditional game rule implementation

**REMOVE FROM CURRENT BUILD:**
- Complex arena architecture (pillars, decorations)
- Advanced lighting systems
- Complex material systems
- Networking code (save for later)
- Advanced UI elements
- Sound system (save for later)

### Phase 2: Traditional Swedish Game Mechanics (NEXT PRIORITY)
**Goal: Implement core "Dunkgömme" hide-and-seek gameplay**

**Step 2.1: The Central "Can" (Burken)**
- [ ] Add 3D can/bucket object at arena center
- [ ] Interactive collision detection for "kicking" the can
- [ ] Visual feedback when can is approached or kicked
- [ ] Can reset mechanics for continuous gameplay
- [ ] Swedish-style "sparkad" (kicked) audio feedback

**Step 2.2: Hiding Mechanics**
- [ ] Add simple hiding spots around arena perimeter
- [ ] Player hiding state management (visible/hidden)
- [ ] Line-of-sight system for seeker vision
- [ ] Hiding spot validation and feedback
- [ ] Strategic hiding spot placement for balanced gameplay

**Step 2.3: Tagging and Rescue System**
- [ ] AI seeker vision cone and player detection
- [ ] "Tagging" system when player is spotted while not hidden
- [ ] Caught player state management
- [ ] Rescue mechanics: reach can to free caught players
- [ ] Traditional Swedish game victory/defeat conditions

**Step 2.4: Swedish Cultural Elements**
- [ ] Swedish language UI elements and calls
- [ ] Traditional "burkad" (tagged) announcement system
- [ ] Swedish playground ambient sounds
- [ ] Cultural context and education panel
- [ ] Regional Swedish game variations information

### Phase 3: Enhanced Swedish Experience (FUTURE)
**Goal: Rich cultural heritage features and educational value**

**Step 3.1: Multiple Swedish Environments**
- [ ] Different Swedish playground and schoolyard layouts
- [ ] Seasonal variations (summer/winter Swedish settings)
- [ ] Traditional Swedish building and landscape elements
- [ ] Regional architecture influences (different parts of Sweden)

**Step 3.2: Educational and Cultural Features**
- [ ] In-game Swedish language learning elements
- [ ] Historical information about Swedish children's games
- [ ] Regional variation documentation and gameplay
- [ ] Integration with Swedish cultural education curricula
- [ ] Museum and cultural institution partnership features

### Phase 4: Multiplayer Swedish Gaming (FUTURE)
**Goal: Share Swedish gaming heritage globally through online play**

**Step 4.1: Online Swedish Hide-and-Seek**
- [ ] Multiplayer networking for traditional Dunkgömme
- [ ] Swedish game room creation and joining
- [ ] International players learning Swedish game rules
- [ ] Cross-cultural gaming experiences and exchange

**Step 4.2: Cultural Tournaments and Events**
- [ ] Swedish midsummer hide-and-seek tournaments
- [ ] International Swedish culture gaming festivals  
- [ ] School exchange programs through gaming
- [ ] Swedish heritage celebration events

### Phase 5: Cultural Preservation and Documentation (FUTURE)
**Goal: Comprehensive Swedish gaming heritage project**

**Step 5.1: Heritage Documentation**
- [ ] Record regional Swedish game variations
- [ ] Interview elderly Swedes about childhood game memories
- [ ] Create digital archive of Swedish playground games
- [ ] Partner with Swedish cultural preservation organizations

**Step 5.2: Global Cultural Impact**
- [ ] International school programs teaching Swedish culture
- [ ] Museum installations and cultural exhibits
- [ ] Academic research partnerships on gaming heritage
- [ ] Swedish government cultural export initiatives