three.min.js:1  Scripts "build/three.js" and "build/three.min.js" are deprecated with r150+, and will be removed with r160. Please use ES Modules or alternatives: https://threejs.org/docs/index.html#manual/en/introduction/Installation
(anonymous) @ three.min.js:1
[NEW] Explain Console errors by using Copilot in Edge: click
         
         to explain an error. 
        Learn more
        Don't show again
utils.js:156 [Game] Page loaded, bootstrapping game... 
utils.js:156 [Game] Bootstrapping Bollen i Burken... 
utils.js:156 [Game] Simple KISS configuration loaded from config.js 
utils.js:156 [Game] ResourceManager initialized (Singleton pattern) 
utils.js:156 [Game] Initializing Three.js... 
utils.js:156 [Game] Canvas resized to: 1261x941 
three.min.js:7  THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead.
set outputEncoding @ three.min.js:7
initializeThreeJS @ index.html:226
bootstrapGame @ index.html:153
(anonymous) @ index.html:1001
utils.js:156 [Game] Three.js initialized successfully 
utils.js:156 [Game] bootstrapping game engine... 
utils.js:156 [Game] Game engine initialized 
utils.js:156 [Game] Game engine initialized - Local player: player_16mdchcpk 
utils.js:156 [Game] bootstrapping game systems... 
utils.js:156 [Game] Input system initialized 
utils.js:156 [Game] UI system initialized 
utils.js:156 [Game] Network system initialized (placeholder) 
utils.js:156 [Game] AI system initialized 
utils.js:156 [Game] InteractionSystem initialized with enterprise patterns 
utils.js:156 [Game] Added system: InputSystem 
utils.js:156 [Game] Added system: MovementSystem 
utils.js:156 [Game] Added system: UISystem 
utils.js:156 [Game] Added system: NetworkSystem 
utils.js:156 [Game] Added system: AISystem 
utils.js:156 [Game] Added system: InteractionSystem 
utils.js:156 [Game] Network system running in local mode 
utils.js:156 [Game] All systems initialized 
utils.js:156 [Game] Game phase: start_menu -> start_menu 
utils.js:156 [Game] Game bootstrap complete 
utils.js:156 [Game] Starting new round... 
utils.js:156 [Game] Game phase: start_menu -> start_menu 
utils.js:156 [Game] Game engine reset 
utils.js:156 [Game] Game phase: start_menu -> loading 
utils.js:156 [Game] Creating arena... 
utils.js:156 [Game] ArenaBuilder initialized with simple config 
utils.js:156 [Game] Creating simple square arena... 
utils.js:156 [Game] Clearing arena using ResourceManager... 
utils.js:156 [Game] Created geometry.plane with ID: arena-floor-geometry 
utils.js:156 [Game] Created material.lambert with ID: arena-floor-material 
utils.js:156 [Game] Arena floor created with ResourceManager tracking 
utils.js:156 [Game] Created material.lambert with ID: arena-wall-material 
utils.js:156 [Game] Created geometry.box with ID: arena-wall-north-geometry 
utils.js:156 [Game] Created geometry.box with ID: arena-wall-south-geometry 
utils.js:156 [Game] Created geometry.box with ID: arena-wall-east-geometry 
utils.js:156 [Game] Created geometry.box with ID: arena-wall-west-geometry 
utils.js:156 [Game] Arena walls created with ResourceManager tracking 
utils.js:156 [Game] Arena lighting created with ResourceManager tracking 
utils.js:156 [Game] Simple square arena created 
utils.js:156 [Game] Creating central Swedish can (Burken)... 
utils.js:156 [Game] Created geometry.cylinder with ID: central-can-geometry 
three.min.js:7  THREE.Material: 'roughness' is not a property of THREE.MeshLambertMaterial.
setValues @ three.min.js:7
Xc @ three.min.js:7
lambert @ resource-manager.js:80
create @ resource-manager.js:108
createCentralCan @ arena-can.js:23
createCentralCan @ arena-builder.js:45
createArena @ index.html:451
startNewGame @ index.html:420
(anonymous) @ index.html:294
three.min.js:7  THREE.Material: 'metalness' is not a property of THREE.MeshLambertMaterial.
setValues @ three.min.js:7
Xc @ three.min.js:7
lambert @ resource-manager.js:80
create @ resource-manager.js:108
createCentralCan @ arena-can.js:23
createCentralCan @ arena-builder.js:45
createArena @ index.html:451
startNewGame @ index.html:420
(anonymous) @ index.html:294
utils.js:156 [Game] Created material.lambert with ID: central-can-material 
utils.js:156 [Game] Central Swedish can (Burken) created at arena center 
utils.js:156 [Game] Creating central can entity... 
utils.js:156 [Game] Created entity 1 
utils.js:156 [Game] Central Swedish can entity created with interaction components 
utils.js:156 [Game] Creating random Swedish playground obstacles... 
utils.js:156 [Game] Created geometry.box with ID: obstacle-0-geometry 
utils.js:156 [Game] Created material.standard with ID: obstacle-0-material 
utils.js:156 [Game] Obstacle 1 placed at (-12.3, 10.7) 
utils.js:156 [Game] Created geometry.box with ID: obstacle-1-geometry 
utils.js:156 [Game] Created material.standard with ID: obstacle-1-material 
utils.js:156 [Game] Obstacle 2 placed at (0.7, -7.1) 
utils.js:156 [Game] Created 2 Swedish playground obstacles 
utils.js:156 [Game] Creating obstacle entities with collision... 
utils.js:156 [Game] Created entity 2 
utils.js:156 [Game] Created entity 3 
utils.js:156 [Game] Created 2 obstacle entities with collision 
utils.js:156 [Game] Arena created 
utils.js:156 [Game] Creating local player... 
utils.js:156 [Game] Created entity 4 
utils.js:156 [Game] Added player player_16mdchcpk (local: true) 
utils.js:156 [Game] Added local player: player_16mdchcpk 
utils.js:156 [Game] Created entity 5 
utils.js:156 [Game] AI hunter entity added: 5 
utils.js:156 [Game] AI hunter ai-hunter-1 registered with AISystem 
utils.js:156 [Game] Added AI hunter: ai-hunter-1 at position (-5, 5) 
utils.js:156 [Game] Local player and AI hunter created 
utils.js:156 [Game] Starting game... 
utils.js:156 [Game] Game phase: loading -> playing 
utils.js:156 [Game] Game Started - Survive for 60 seconds! 
utils.js:156 [Game] Game started successfully 
