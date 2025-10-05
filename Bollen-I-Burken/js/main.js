/* ==========================================
   MAIN GAME BOOTSTRAP AND LOOP
   Initializes Three.js, game engine, systems, and runs game loop
   ========================================== */

(function (global) {
    // Global game variables
    let scene, camera, renderer;
    let gameEngine;
    let localPlayerId;
    let resourceManager;

    // Game systems
    let inputSystem;
    let cameraManager;
    // New Four-System Architecture
    let playerMovementSystem;
    let aiVisualizationSystem;
    let animationIntegrationSystem;
    let collisionDetectionSystem;
    let uiSystem;
    let audioSystem;
    let networkSystem;
    let aiSystem;
    let interactionSystem;
    let physicsSystem;  // GUBBAR Phase 1
    let ragdollLocomotion;  // GUBBAR Phase 2: Natural movement

    // Performance tracking
    let lastTime = 0;
    let frameCount = 0;
    let lastFpsTime = 0;
    let gameLoopStarted = false;

    // ==========================================
    // 🎥 DYNAMIC CAMERA ZOOM SETTINGS - FIDDLE WITH THESE!
    // ==========================================
    const CAMERA_ZOOM_AT_CENTER = 0.3;  // How zoomed in at center (0.6 = 60% of normal distance)
    const CAMERA_ZOOM_AT_EDGE = 0.8;    // How zoomed out at edge (1.0 = normal distance)
    const CAMERA_HORIZONTAL_FOLLOW = 0.3;  // How much camera follows player horizontally (0-1)
    const CAMERA_ZOOM_WHEN_STILL = 0.35;  // Extra zoom in when player is standing still (0.85 = 15% closer)
    const CAMERA_STILL_DELAY = 3000;  // Wait 3 seconds before zooming when still (milliseconds)
    const CAMERA_STILL_SPEED_THRESHOLD = 0.25;  // Consider "still" if speed < 25% of max
    const CAMERA_LOOKAT_SPLIT = 0.05;  // Look at point between center and player (0.5 = halfway, 0 = center only, 1 = player only)

    // Camera smoothness settings (lower = smoother, but slower)
    const CAMERA_POSITION_SMOOTH = 0.001;  // Position movement smoothness (0.01-0.1)
    const CAMERA_LOOKAT_SMOOTH = 0.001;    // Look-at pan smoothness (0.01-0.1)
    const CAMERA_STILLZOOM_SMOOTH = 0.001; // Still zoom transition smoothness (0.01-0.05)

    // Camera state tracking
    let playerStillStartTime = null;
    let currentStillZoomFactor = 0;
    let currentLookAtX = 0;
    let currentLookAtY = -6;
    let currentLookAtZ = 0;

    // Initialize the game
    async function bootstrapGame() {
        try {
            Utils.log('Bootstrapping Bollen i Burken...');
            Utils.log('Simple KISS configuration loaded from config.js');

            // Initialize Resource Manager (simple cleanup tracking)
            resourceManager = new ResourceManager();

            // Expose resourceManager global immediately after creation
            global.resourceManager = resourceManager;

            // Initialize Three.js
            await initializeThreeJS();

            // Load textures (async, but don't block)
            if (window.TextureManager) {
                TextureManager.loadTextures(() => {
                    Utils.log('Textures loaded and ready for use');
                });
            }

            // Initialize game engine and systems
            initializeGameEngine();
            initializeSystems();

            // Prepare menu controls
            if (global.MenuOverlay) {
                global.MenuOverlay.setup();
            }

            // Hide loading screen once base systems are ready
            if (global.MenuOverlay) {
                global.MenuOverlay.hideLoadingScreen();
            }

            // Show start menu overlay by default
            if (global.MenuOverlay) {
                global.MenuOverlay.showStartMenu();
            }

            // Kick off the render loop (remains active across rounds)
            requestAnimationFrame(gameLoop);
            gameLoopStarted = true;

            Utils.log('Game bootstrap complete');

        } catch (error) {
            console.error('Failed to bootstrap game:', error);
            Utils.error('Game bootstrap failed', error);
            if (global.MenuOverlay) {
                global.MenuOverlay.showErrorMessage('Failed to initialize game: ' + error.message);
            }
        }
    }

    async function initializeThreeJS() {
        Utils.log('Initializing Three.js...');

        // Check if Three.js loaded
        if (typeof THREE === 'undefined') {
            throw new Error('Three.js failed to load from CDN');
        }

        // Create scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(CONFIG.graphics.backgroundColor);

        // Create camera with "emperor's view" using simple CONFIG
        const cameraHeight = CONFIG.camera.height;
        const cameraDistance = CONFIG.camera.distance;
        const cameraFov = CONFIG.camera.fov;
        const lookAtOffset = CONFIG.camera.lookAtOffset;

        camera = new THREE.PerspectiveCamera(
            cameraFov, // field of view from config
            window.innerWidth / window.innerHeight, // responsive aspect ratio
            0.1, // near clipping plane
            1000 // far clipping plane
        );

        // Position camera high above arena, looking down at angle
        camera.position.set(0, cameraHeight, cameraDistance);
        camera.lookAt(lookAtOffset.x, lookAtOffset.y, lookAtOffset.z);

        // Create renderer
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            throw new Error('Game canvas not found');
        }

        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: false
        });

        // Set initial size based on window
        updateCanvasSize();
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputEncoding = THREE.sRGBEncoding;

        // Expose Three.js globals immediately after creation
        global.scene = scene;
        global.camera = camera;
        global.renderer = renderer;

        Utils.log('Three.js initialized successfully');
    }

    function initializeGameEngine() {
        Utils.log('bootstrapping game engine...');

        // Create game engine
        gameEngine = new GameEngine();

        // Generate local player ID
        localPlayerId = Utils.generatePlayerId();

        // Expose gameEngine global immediately after creation
        global.gameEngine = gameEngine;

        Utils.log(`Game engine initialized - Local player: ${localPlayerId}`);
    }

    function initializeSystems() {
        Utils.log('bootstrapping game systems...');

        // Initialize all systems
        inputSystem = new InputSystem();
        
        // Initialize camera mode system
        cameraManager = new CameraModeSystem(scene, camera);
        
        // Clear any leftover movement/animation state from previous session
        if (typeof animationIntegrationSystem !== 'undefined' && animationIntegrationSystem && animationIntegrationSystem.getLegAnimator) {
            animationIntegrationSystem.getLegAnimator().clear();
        }

        // Initialize new four-system architecture
        playerMovementSystem = new PlayerMovementSystem();
        aiVisualizationSystem = new AIVisualizationSystem();
        animationIntegrationSystem = new AnimationIntegrationSystem();
        collisionDetectionSystem = new CollisionDetectionSystem();
        uiSystem = new UISystem();
        audioSystem = new AudioSystem();
        networkSystem = new NetworkSystem();
        aiSystem = new AISystem();
        interactionSystem = new InteractionSystem();

        // Initialize physics system (GUBBAR Phase 1)
        if (CONFIG.physics.enabled && typeof PhysicsSystem !== 'undefined') {
            physicsSystem = new PhysicsSystem();
            physicsSystem.initialize();
            
            // Clear any leftover physics bodies/constraints from previous game sessions
            if (physicsSystem.physicsWorld) {
                physicsSystem.physicsWorld.clear();
                Utils.log('🧹 Cleared physics world from previous session');
            }
            
            global.physicsSystem = physicsSystem;  // Expose globally
            Utils.log('PhysicsSystem initialized (will be added to engine in correct order)');
        } else {
            Utils.log('PhysicsSystem disabled or not loaded');
        }

        // Initialize ragdoll locomotion system (GUBBAR Phase 2)
        if (typeof RagdollLocomotion !== 'undefined') {
            ragdollLocomotion = new RagdollLocomotion();
            global.ragdollLocomotion = ragdollLocomotion;  // Expose globally
            Utils.log('RagdollLocomotion system initialized 🚶‍♂️');
        } else {
            Utils.log('RagdollLocomotion system not loaded');
        }

        // Add systems to game engine in correct order:
        // 1. Input - collect user input
        // 2. AI - calculate steering and velocities
        // 3. Movement - apply velocities to physics bodies
        // 4. Physics - step simulation and sync positions back
        // 5. UI/Audio/Network/Interaction - render and respond
        gameEngine.addSystem(inputSystem);
        gameEngine.addSystem(cameraManager);
        gameEngine.addSystem(aiSystem);
        // Add new four-system architecture
        gameEngine.addSystem(playerMovementSystem);
        gameEngine.addSystem(aiVisualizationSystem);
        gameEngine.addSystem(animationIntegrationSystem);
        gameEngine.addSystem(collisionDetectionSystem);
        if (CONFIG.physics.enabled && physicsSystem) {
            gameEngine.addSystem(physicsSystem);
            Utils.log('PhysicsSystem added to game engine');
        }
        gameEngine.addSystem(uiSystem);
        gameEngine.addSystem(audioSystem);
        gameEngine.addSystem(networkSystem);
        gameEngine.addSystem(interactionSystem);

        // Initialize networking in local mode
        networkSystem.initializeNetwork('local');

        // Systems are now initialized with their own configuration
        console.log('🔄 MAIN: New four-system architecture initialized successfully');

        // Set up GameLifecycle dependencies
        if (global.GameLifecycle) {
            global.GameLifecycle.setDependencies({
                scene: scene,
                gameEngine: gameEngine,
                localPlayerId: localPlayerId
            });
        }

        // Expose system globals AFTER initialization (so they're not undefined)
        global.inputSystem = inputSystem;
        window.inputSystem = inputSystem;  // Also expose as window.inputSystem for camera mode system
        global.cameraManager = cameraManager;
        // Expose new systems globally
        global.playerMovementSystem = playerMovementSystem;
        global.aiVisualizationSystem = aiVisualizationSystem;
        global.animationIntegrationSystem = animationIntegrationSystem;
        global.collisionDetectionSystem = collisionDetectionSystem;
        // Legacy compatibility
        global.movementSystem = playerMovementSystem;
        global.uiSystem = uiSystem;
        global.audioSystem = audioSystem;
        global.networkSystem = networkSystem;
        global.aiSystem = aiSystem;
        global.interactionSystem = interactionSystem;

        Utils.log('All systems initialized');
    }

    // Main game loop (simple, with try-catch)
    function gameLoop(currentTime) {
        try {
            if (!lastTime) {
                lastTime = currentTime;
            }

            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;

            // Update game engine (handles tick-based updates)
            gameEngine.update(deltaTime);

            // � Update simple leg animations
            if (global.simpleLegAnimator) {
                global.simpleLegAnimator.update(deltaTime);
            }

            // �🦴 Update ragdoll physics visuals (GUBBAR Phase 1A)
            updateRagdollCharacters();

            // Update camera (third-person dynamic zoom OR first-person positioning)
            if (cameraManager) {
                cameraManager.update(gameEngine.gameState);
            }

            // Render the Three.js scene
            renderer.render(scene, camera);

            // Update FPS counter
            updateFPS(currentTime);

            // Update UI with current stats
            updateGameUI();

            // Continue the game loop
            requestAnimationFrame(gameLoop);
        } catch (error) {
            console.error('Game loop error:', error);
            // Try to continue anyway
            requestAnimationFrame(gameLoop);
        }
    }

    function updateDynamicCamera() {
        if (!gameEngine || !gameEngine.gameState) return;

        const localPlayer = gameEngine.gameState.getLocalPlayer();
        if (!localPlayer) return;

        const playerTransform = localPlayer.getComponent('Transform');
        if (!playerTransform) return;

        // Calculate distance from center
        const dx = playerTransform.position.x;
        const dz = playerTransform.position.z;
        const distanceFromCenter = Math.sqrt(dx * dx + dz * dz);

        // Arena size (half the arena width/depth)
        const arenaHalfSize = CONFIG.arena.size / 2;

        // Calculate zoom factor (0 at center, 1 at edge)
        const zoomFactor = Math.min(distanceFromCenter / arenaHalfSize, 1.0);

        // Check player speed relative to max speed
        const velocity = Math.sqrt(
            playerTransform.velocity.x ** 2 +
            playerTransform.velocity.z ** 2
        );
        const maxSpeed = CONFIG.player.maxSpeed || 0.2;
        const speedRatio = velocity / maxSpeed;
        const isStill = speedRatio < CAMERA_STILL_SPEED_THRESHOLD;

        // Track how long player has been still
        const currentTime = Date.now();
        if (isStill) {
            if (playerStillStartTime === null) {
                playerStillStartTime = currentTime;
            }
        } else {
            playerStillStartTime = null;
        }

        // Calculate still zoom factor (0 = no zoom, 1 = full zoom)
        let targetStillZoom = 0;
        if (playerStillStartTime !== null) {
            const stillDuration = currentTime - playerStillStartTime;
            if (stillDuration >= CAMERA_STILL_DELAY) {
                targetStillZoom = 1.0;
            }
        }

        // Super smoothly interpolate still zoom factor
        currentStillZoomFactor += (targetStillZoom - currentStillZoomFactor) * CAMERA_STILLZOOM_SMOOTH;

        // Calculate movement factor based on still zoom
        const movementFactor = 1.0 - (currentStillZoomFactor * (1.0 - CAMERA_ZOOM_WHEN_STILL));

        // Normal camera settings from config (used at EDGE)
        const maxHeight = CONFIG.camera.height * CAMERA_ZOOM_AT_EDGE * movementFactor;
        const maxDistance = CONFIG.camera.distance * CAMERA_ZOOM_AT_EDGE * movementFactor;

        // Zoomed in settings (used at CENTER)
        const minHeight = CONFIG.camera.height * CAMERA_ZOOM_AT_CENTER * movementFactor;
        const minDistance = CONFIG.camera.distance * CAMERA_ZOOM_AT_CENTER * movementFactor;

        // Interpolate camera position (zoom IN at center, zoom OUT at edge)
        const newHeight = minHeight + (maxHeight - minHeight) * zoomFactor;
        const newDistance = minDistance + (maxDistance - minDistance) * zoomFactor;

        // Horizontal camera follow (dollying OPPOSITE direction of player)
        const targetCameraX = -playerTransform.position.x * CAMERA_HORIZONTAL_FOLLOW;

        // SUPER SMOOTHLY update camera position
        camera.position.x += (targetCameraX - camera.position.x) * CAMERA_POSITION_SMOOTH;
        camera.position.y += (newHeight - camera.position.y) * CAMERA_POSITION_SMOOTH;
        camera.position.z += (newDistance - camera.position.z) * CAMERA_POSITION_SMOOTH;

        // Calculate target look-at position: split between center and player
        const lookAtOffset = CONFIG.camera.lookAtOffset;

        // Base split: always look partway between center and player (not just when still)
        const baseLookAtX = lookAtOffset.x + (playerTransform.position.x - lookAtOffset.x) * CAMERA_LOOKAT_SPLIT;
        const baseLookAtY = lookAtOffset.y + (playerTransform.position.y - lookAtOffset.y) * CAMERA_LOOKAT_SPLIT;
        const baseLookAtZ = lookAtOffset.z + (playerTransform.position.z - lookAtOffset.z) * CAMERA_LOOKAT_SPLIT;

        // When still, zoom focus even more toward player
        const targetLookAtX = baseLookAtX + (playerTransform.position.x - baseLookAtX) * currentStillZoomFactor;
        const targetLookAtY = baseLookAtY + (playerTransform.position.y - baseLookAtY) * currentStillZoomFactor;
        const targetLookAtZ = baseLookAtZ + (playerTransform.position.z - baseLookAtZ) * currentStillZoomFactor;

        // SMOOTHLY interpolate look-at position to avoid jerky panning
        currentLookAtX += (targetLookAtX - currentLookAtX) * CAMERA_LOOKAT_SMOOTH;
        currentLookAtY += (targetLookAtY - currentLookAtY) * CAMERA_LOOKAT_SMOOTH;
        currentLookAtZ += (targetLookAtZ - currentLookAtZ) * CAMERA_LOOKAT_SMOOTH;

        camera.lookAt(currentLookAtX, currentLookAtY, currentLookAtZ);
    }

    function updateFPS(currentTime) {
        frameCount++;

        if (currentTime - lastFpsTime >= 1000) {
            const fps = frameCount;
            frameCount = 0;
            lastFpsTime = currentTime;

            // Update FPS in UI
            uiSystem.updateFPS(fps);
        }
    }

    function updateGameUI() {
        // Get game stats
        const stats = gameEngine.getStats();

        // Update network status
        const networkStats = networkSystem.getNetworkStats();
        uiSystem.updateNetworkStatus(
            networkStats.connected ? 'connected' : 'disconnected',
            networkStats.latency
        );
    }

    /**
     * 🦴 Updates ragdoll character visuals to match physics (GUBBAR Phase 1A)
     * and handles ragdoll locomotion (GUBBAR Phase 2)
     * Syncs visual meshes with physics bodies for all ragdoll characters
     */
    function updateRagdollCharacters() {
        // Skip if ragdoll system not available
        if (!gameEngine || !gameEngine.gameState || typeof CharacterBuilder === 'undefined') {
            return;
        }

        try {
            // 🚶‍♂️ Update ragdoll locomotion system (Phase 2)
            if (ragdollLocomotion) {
                ragdollLocomotion.update(0.016); // Assume ~60fps for now
            }

            // 🔄 Update ragdoll visual sync (Phase 1A)
            // Try to get players using different API methods
            let players = null;
            
            if (typeof gameEngine.gameState.getPlayers === 'function') {
                players = gameEngine.gameState.getPlayers();
            } else if (typeof gameEngine.gameState.getAllPlayers === 'function') {
                players = gameEngine.gameState.getAllPlayers();
            } else if (gameEngine.gameState.players) {
                players = gameEngine.gameState.players;
            }

            if (players && typeof players.forEach === 'function') {
                players.forEach(player => {
                    const renderable = player.getComponent('Renderable');
                    if (renderable && renderable.object && CharacterBuilder.updateRagdollPhysics) {
                        CharacterBuilder.updateRagdollPhysics(renderable.object);
                    }
                });
            }

        } catch (error) {
            // Silently handle ragdoll update errors to avoid spam
            // console.debug('Ragdoll update error:', error);
        }
    }

    // Update canvas size to be responsive
    function updateCanvasSize() {
        if (!camera || !renderer) return;

        // Use full window size
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Update camera aspect ratio
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        // Update renderer size
        renderer.setSize(width, height, false); // false prevents setting CSS size

        Utils.log(`Canvas resized to: ${width}x${height}`);
    }

    // Handle window resize
    function handleResize() {
        updateCanvasSize();
    }

    // Handle visibility change (pause when tab is hidden)
    function handleVisibilityChange() {
        if (document.hidden) {
            if (gameEngine && gameEngine.gameState.gamePhase === GAME_STATES.PLAYING) {
                gameEngine.pause();
                uiSystem.showMessage('PAUSED', 'Game paused (tab hidden)');
            }
        } else {
            if (gameEngine && gameEngine.gameState.gamePhase === GAME_STATES.PAUSED) {
                gameEngine.resume();
                uiSystem.hideMessage();
            }
        }
    }

    // Event listeners
    window.addEventListener('resize', Utils.throttle(handleResize, 250));
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle errors globally (simple logging)
    window.addEventListener('error', (event) => {
        console.error('Global error:', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error
        });
        Utils.error('Global error caught', event.error);
        if (global.MenuOverlay) {
            global.MenuOverlay.showErrorMessage('An unexpected error occurred. Please reload the game.');
        }
    });

    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        Utils.error('Unhandled promise rejection', event.reason);
        if (global.MenuOverlay) {
            global.MenuOverlay.showErrorMessage('An unexpected error occurred. Please reload the game.');
        }
    });

    // Expose camera functions for camera mode system
    window.updateDynamicCamera = updateDynamicCamera;
    window.camera = camera;  // Expose main camera for movement system

    // Debug functions (available in console)
    window.debugGame = function () {
        return {
            gameEngine: gameEngine,
            scene: scene,
            camera: camera,
            renderer: renderer,
            config: CONFIG,  // Simple config object
            resourceManager: resourceManager,
            systems: {
                input: inputSystem,
                movement: movementSystem,
                ui: uiSystem,
                audio: audioSystem,
                network: networkSystem,
                ai: aiSystem,
                interaction: interactionSystem
            },
            stats: gameEngine ? gameEngine.getStats() : null,
            resources: resourceManager ? resourceManager.getStats() : null
        };
    };

    // Professional debug commands
    window.debugResources = function () {
        if (resourceManager) {
            resourceManager.debugLogResources();
        } else {
            console.log('ResourceManager not initialized');
        }
    };

    // Simple config debug
    window.debugConfig = function () {
        console.log('=== SIMPLE CONFIG (KISS) ===');
        console.log(CONFIG);
        console.log('=== END CONFIG ===');
    };

    // Expose remaining globals for cross-module access
    // NOTE: scene, camera, renderer are exposed in initializeThreeJS() after creation
    // NOTE: gameEngine is exposed in initializeGameEngine() after creation
    // NOTE: resourceManager is exposed in bootstrapGame() after creation
    // NOTE: Systems are exposed in initializeSystems() after creation
    global.gameLoop = gameLoop;
    global.gameLoopStarted = gameLoopStarted;

    // Start the game when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrapGame);
    } else {
        bootstrapGame();
    }

    // Export for module systems
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { bootstrapGame };
    }
})(typeof window !== 'undefined' ? window : globalThis);
