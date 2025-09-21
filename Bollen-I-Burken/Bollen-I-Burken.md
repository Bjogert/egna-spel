Create a 3D game called "Bollen i Burken" using Three.js with the following specifications:

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

ARENA DESIGN:
- Simple SQUARE arena floor (not circular)
- BIGGER arena size for more movement space
- Raised arena walls around the perimeter (simple walls only)
- Arena should have depth - the floor is lower than ground level
- NO decorative elements (pillars, torches, gates) - keep minimal
- Remove all complex architecture until basic gameplay works

PLAYER CHARACTER:
- 3D character (simple cube or basic 3D model) on the arena floor
- Smooth movement using WASD or arrow keys
- Character moves on the 3D arena floor plane
- Collision detection with arena walls

TECHNICAL REQUIREMENTS:
- HTML file with Three.js (import from CDN)
- Basic lighting setup to show 3D depth
- 60fps render loop
- BIGGER canvas size (larger than 800x600 pixels)
- Remove unnecessary complex systems until basics work

Start with the folder structure and then do the basic 3D arena geometry and a controllable 3D character - we'll add hide and seek gameplay later.

## SIMPLIFICATION REQUIREMENTS (Updated)

**KEEP IT MINIMAL AND SIMPLE:**
- Delete all unnecessary complex functions and features
- Focus on getting basic visuals working correctly first
- Avoid adding complexity that makes future development harder
- Prepare foundation for AI seeker to be added later

**ARENA CHANGES:**
- Change from circular arena to simple SQUARE arena
- Make arena BIGGER than current size
- Remove complex decorations (pillars, torches, gates, etc.)
- Keep only: square floor, simple walls, basic lighting

**GAME WINDOW:**
- Make game window BIGGER than current 800x600
- Increase canvas size for better visibility

**SIMPLIFICATION GOALS:**
1. Get basic square arena working perfectly
2. Get player cube moving smoothly with WASD
3. Get camera positioned correctly 
4. Remove all decorative/complex elements
5. Prepare clean foundation for AI seeker system later

**FUTURE AI INTEGRATION:**
- Current goal: Simple player movement in square arena
- Next step: Add AI character that seeks the player
- Keep code structure clean for easy AI addition

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

## DEVELOPMENT PLAN

**ARCHITECTURE FOCUS: Professional & Scalable from Day 1**
- **Enterprise-grade patterns** - Use proven industry architectural patterns
- **Scalability-first design** - Every system built to handle growth and complexity
- **Clean code standards** - Maintainable, testable, and self-documenting code
- **Modular architecture** - Loose coupling, high cohesion, dependency injection
- **Configuration-driven** - External config files for easy customization and scaling
- **Component-based design** - Reusable, composable game systems and entities
- **Professional structure** - Industry-standard file organization and naming conventions
- **Future-proof foundation** - Built to support feature expansion and team scaling
- **Professional code structure** - Enterprise-level organization and patterns
- **Scalable system design** - Built to handle growth and feature expansion  
- **Clean architecture** - Clear separation of concerns and dependency management
- **Configuration-driven** - External config management for easy scaling
- **Component-based ECS** - Reusable, composable entity-component systems
- **Modular file structure** - Professional organization for team collaboration and maintenance

### Phase 1: Foundation (COMPLETED ✅)
**Goal: Get basic 3D square arena working with controllable character + Enterprise Architecture**
**Focus: Professional foundation with enterprise patterns and scalability**

**Step 1.1: Core Game Foundation (COMPLETED ✅)**
- [x] Remove all complex arena decorations (pillars, torches, gates)
- [x] Change arena from circular to simple SQUARE
- [x] Make arena BIGGER for more movement space
- [x] Increase game window/canvas size
- [x] Remove unnecessary complex systems

**Step 1.2: Basic Gameplay (COMPLETED ✅)**
- [x] Simple square arena floor and walls
- [x] Player cube that moves with WASD
- [x] Basic camera positioning (emperor's view)
- [x] Simple collision detection with square arena walls
- [x] Basic lighting with shadow coverage fix

**Step 1.3: UI Layout Issues (COMPLETED ✅)**
- [x] Fix stats panel visibility - ensure game stats are fully visible and not cut off
- [x] Remove green bar overlap - fix the green progress bar overlapping game area
- [x] Proper UI overlay positioning - position all UI elements as proper overlays
- [x] Canvas size adjustment - make canvas large but leave space for UI elements
- [x] Z-index/layering - ensure UI elements appear on top with proper layering
- [x] Test responsive layout - verified UI works on different screen sizes

**Step 1.4: Enterprise Foundation (COMPLETED ✅)**
- [x] **ResourceManager** - Professional Three.js lifecycle management (Singleton + Factory + Observer patterns)
- [x] **ErrorHandler** - Enterprise error handling with structured debugging (Strategy + Chain of Responsibility patterns)
- [x] **AI Hunter Entity** - Basic patrol behavior with ECS integration
- [x] Professional code structure with SOLID principles
- [x] Enterprise-level debugging and monitoring tools

**Step 1.5: AI Foundation (COMPLETED ✅)**
- [x] AI Hunter entity with red cube visual
- [x] Basic patrol movement with collision detection
- [x] ECS integration for AI components (AIHunter, VisionCone)
- [x] Clean architecture prepared for vision system and hunting behavior

**REMOVE FROM CURRENT BUILD:**
- Complex arena architecture (pillars, decorations)
- Advanced lighting systems
- Complex material systems
- Networking code (save for later)
- Advanced UI elements
- Sound system (save for later)

### Phase 2: Complete Enterprise Foundation (CURRENT STEP)
**Goal: Finish enterprise architecture before advanced AI features**
**Focus: Configuration management, validation, and dependency injection**

**Step 2.1: Configuration Manager (COMPLETED ✅)**
- [x] Centralized configuration system for all game parameters
- [x] Multiple configuration sources (localStorage, URL parameters)
- [x] Live configuration updates for development
- [x] Type-safe configuration validation with schema
- [x] Professional debugging commands and analytics
- [x] AI parameter tuning ready (vision, speed, behavior)
- [x] Full integration with ArenaBuilder, camera, and all game systems
- [x] Debug commands: `debugConfig()`, `getConfig()`, `setConfig()`, `saveConfig()`, `resetConfig()`
- [x] Schema-based validation with comprehensive error handling
- [x] Observer pattern for live configuration change notifications

**Step 2.2: Component Validation (COMPLETED ✅)**
- [x] ECS component validation framework with type checking
- [x] Runtime validation for component data integrity
- [x] Defensive programming patterns for component safety
- [x] Error recovery and fallback handling for invalid components
- [x] Component schema definitions for Transform, Movement, VisionCone, AIHunter, Player
- [x] Professional validation error reporting and debugging
- [x] ValidatedEntity class with automatic component validation
- [x] Multiple validation strategies (Type, Range, Enum, Array)
- [x] Auto-correction and default value application
- [x] Integration with ErrorHandler and ConfigManager
- [x] Debug commands: `debugValidation()`, `validateAllEntities()`
- [x] Enterprise patterns: Strategy + Template Method + Chain of Responsibility

**Step 2.3: Service Container (IN PROGRESS)**
- [ ] Dependency injection container with service registration
- [ ] Service lifecycle management (Singleton, Transient, Scoped)
- [ ] Interface-based service resolution and loose coupling
- [ ] Configuration-driven service composition
- [ ] Testing support through mocking and dependency replacement
- [ ] Professional factory patterns for service creation

### Phase 3: Advanced AI Features (NEXT)
**Goal: Implement AI vision system and hunting behavior**
**Focus: Professional AI architecture on solid foundation**

**Step 3.1: AI Vision System**
- [ ] Vision cone implementation with configurable parameters
- [ ] Line-of-sight detection with raycasting
- [ ] Visual debug rendering for vision cones
- [ ] Performance optimization for multiple AI entities

**Step 3.2: AI State Machine**
- [ ] Professional state machine pattern (PATROL → HUNTING → SEARCHING)
- [ ] State transition logic with proper events
- [ ] AI behavior trees for complex decision making
- [ ] Error handling and recovery for AI states

**Step 3.3: AI Hunting Behavior**
- [ ] Direct chase mechanics when player spotted
- [ ] Basic pathfinding around obstacles
- [ ] Last known position searching
- [ ] AI coordination (if multiple hunters)

### Phase 3: Game Mechanics (FUTURE)
- Add hiding spots in square arena
- Implement win/lose conditions
- Add timer and basic scoring

### Phase 4: Polish (FUTURE)
- Enhanced visuals and effects
- Sound system
- UI improvements
- Mobile optimization

### Phase 5: Advanced Features (FUTURE)
- Multiplayer networking
- Advanced AI behaviors
- More complex arena layouts
- Additional game modes