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
    let movementSystem;
    let uiSystem;
    let audioSystem;
    let networkSystem;
    let aiSystem;
    let interactionSystem;

    // Performance tracking
    let lastTime = 0;
    let frameCount = 0;
    let lastFpsTime = 0;
    let gameLoopStarted = false;

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
        movementSystem = new MovementSystem();
        uiSystem = new UISystem();
        audioSystem = new AudioSystem();
        networkSystem = new NetworkSystem();
        aiSystem = new AISystem();
        interactionSystem = new InteractionSystem();

        // Add systems to game engine
        gameEngine.addSystem(inputSystem);
        gameEngine.addSystem(movementSystem);
        gameEngine.addSystem(uiSystem);
        gameEngine.addSystem(audioSystem);
        gameEngine.addSystem(networkSystem);
        gameEngine.addSystem(aiSystem);
        gameEngine.addSystem(interactionSystem);

        // Initialize networking in local mode
        networkSystem.initializeNetwork('local');

        // Initialize MovementSystem config after ConfigManager is available
        if (movementSystem && typeof movementSystem.initializeConfig === 'function') {
            movementSystem.initializeConfig();
        }

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
        global.movementSystem = movementSystem;
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
