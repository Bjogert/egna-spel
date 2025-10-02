three.min.js:1  Scripts "build/three.js" and "build/three.min.js" are deprecated with r150+, and will be removed with r160. Please use ES Modules or alternatives: https://threejs.org/docs/index.html#manual/en/introduction/Installation
(anonymous) @ three.min.js:1
utils.js:157 [Game] Debug commands loaded 
index.html:162 Live reload enabled.
utils.js:157 [Game] Bootstrapping Bollen i Burken... 
utils.js:157 [Game] Simple KISS configuration loaded from config.js 
utils.js:157 [Game] ResourceManager initialized (Singleton pattern) 
utils.js:157 [Game] Initializing Three.js... 
utils.js:157 [Game] Canvas resized to: 2512x1314 
three.min.js:7  THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead.
set outputEncoding @ three.min.js:7
utils.js:157 [Game] Three.js initialized successfully 
utils.js:157 [Game] bootstrapping game engine... 
utils.js:157 [Game] Game engine initialized 
utils.js:157 [Game] Game engine initialized - Local player: player_920s1npoh 
utils.js:157 [Game] bootstrapping game systems... 
utils.js:157 [Game] Input system initialized 
utils.js:157 [Game] UI system initialized 
utils.js:157 [Game] Network system initialized (placeholder) 
utils.js:157 [Game] AI system initialized 
utils.js:157 [Game] InteractionSystem initialized with enterprise patterns 
utils.js:157 [Game] Added system: InputSystem 
utils.js:157 [Game] Added system: MovementSystem 
utils.js:157 [Game] Added system: UISystem 
utils.js:157 [Game] Added system: NetworkSystem 
utils.js:157 [Game] Added system: AISystem 
utils.js:157 [Game] Added system: InteractionSystem 
utils.js:157 [Game] Network system running in local mode 
utils.js:157 [Game] All systems initialized 
utils.js:157 [Game] Menu overlay setup complete 
utils.js:157 [Game] Game bootstrap complete 
utils.js:157 [Game] Starting new round... 
utils.js:157 [Game] Game phase: start_menu -> start_menu 
utils.js:157 [Game] Game engine reset 
utils.js:157 [Game] Game phase: start_menu -> loading 
utils.js:157 [Game] Creating arena... 
utils.js:157 [Game] ArenaBuilder initialized with simple config 
utils.js:157 [Game] Creating simple square arena... 
utils.js:157 [Game] Clearing arena using ResourceManager... 
utils.js:157 [Game] Created geometry.plane with ID: arena-floor-geometry 
utils.js:157 [Game] Created material.lambert with ID: arena-floor-material 
utils.js:157 [Game] Arena floor created with ResourceManager tracking 
utils.js:157 [Game] Created material.lambert with ID: arena-wall-material 
utils.js:157 [Game] Created geometry.box with ID: arena-wall-north-geometry 
utils.js:157 [Game] Created geometry.box with ID: arena-wall-south-geometry 
utils.js:157 [Game] Created geometry.box with ID: arena-wall-east-geometry 
utils.js:157 [Game] Created geometry.box with ID: arena-wall-west-geometry 
utils.js:157 [Game] Arena walls created with ResourceManager tracking 
utils.js:157 [Game] Arena lighting created with ResourceManager tracking 
utils.js:157 [Game] Simple square arena created 
utils.js:157 [Game] Creating central Swedish can (Burken)... 
utils.js:157 [Game] Created geometry.cylinder with ID: central-can-geometry 
three.min.js:7  THREE.Material: 'roughness' is not a property of THREE.MeshLambertMaterial.
setValues @ three.min.js:7
three.min.js:7  THREE.Material: 'metalness' is not a property of THREE.MeshLambertMaterial.
setValues @ three.min.js:7
utils.js:157 [Game] Created material.lambert with ID: central-can-material 
utils.js:157 [Game] Central Swedish can (Burken) created at arena center 
utils.js:157 [Game] Creating central can entity... 
utils.js:157 [Game] Created entity 1 
utils.js:157 [Game] Central Swedish can entity created with interaction components 
utils.js:157 [Game] Creating Tetris-like wall obstacles... 
utils.js:157 [Game] Difficulty: Fyllekäring på Midsommar (Level 2) 
utils.js:157 [Game]   Description: Han ser inte så bra efter alla snapsar... 
main.js:285  Global error: Object
(anonymous) @ main.js:285
utils.js:166  [Game Error] Global error caught TypeError: Cannot read properties of undefined (reading 'mergeGeometries')
    at createShapeGroup (arena-obstacles.js:163:58)
    at tryPlaceShape (arena-obstacles.js:129:22)
    at Object.createRandomObstacles (arena-obstacles.js:44:35)
    at ArenaBuilder.createRandomObstacles (arena-builder.js:49:35)
    at GameLifecycle.createArena (game-lifecycle.js:64:49)
    at GameLifecycle.startNewGame (game-lifecycle.js:37:18)
    at HTMLButtonElement.<anonymous> (menu-overlay.js:61:42)
error @ utils.js:166
utils.js:166  [Game Error] Game error displayed to user: An unexpected error occurred. Please reload the game.
error @ utils.js:166
arena-obstacles.js:163  Uncaught TypeError: Cannot read properties of undefined (reading 'mergeGeometries')
    at createShapeGroup (arena-obstacles.js:163:58)
    at tryPlaceShape (arena-obstacles.js:129:22)
    at Object.createRandomObstacles (arena-obstacles.js:44:35)
    at ArenaBuilder.createRandomObstacles (arena-builder.js:49:35)
    at GameLifecycle.createArena (game-lifecycle.js:64:49)
    at GameLifecycle.startNewGame (game-lifecycle.js:37:18)
    at HTMLButtonElement.<anonymous> (menu-overlay.js:61:42)
utils.js:157 [Game] Key down: ArrowUp -> forward 
utils.js:157 [Game] InputSystem: No gameState available - deferring input update 
utils.js:157 [Game] Key down: ArrowLeft -> left 
utils.js:157 [Game] InputSystem: No gameState available - deferring input update 
utils.js:157 [Game] InputSystem: No gameState available - deferring input update 
utils.js:157 [Game] InputSystem: No gameState available - deferring input update 
utils.js:157 [Game] Key down: ArrowUp -> forward 
utils.js:157 [Game] InputSystem: No gameState available - deferring input update 
utils.js:157 [Game] InputSystem: No gameState available - deferring input update 
utils.js:157 [Game] Key down: ArrowLeft -> left 
utils.js:157 [Game] InputSystem: No gameState available - deferring input update 
utils.js:157 [Game] InputSystem: No gameState available - deferring input update 
utils.js:157 [Game] Key down: ArrowUp -> forward 
utils.js:157 [Game] InputSystem: No gameState available - deferring input update 
utils.js:157 [Game] InputSystem: No gameState available - deferring input update 
utils.js:157 [Game] Canvas resized to: 2114x1314 
[NEW] Explain Console errors by using Copilot in Edge: click
         
         to explain an error. 
        Learn more
        Don't show again
