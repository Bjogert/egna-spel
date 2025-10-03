/* ==========================================
   DEBUG COMMANDS
   Console debug helpers for development
   ========================================== */

(function (global) {
    // Config helpers (use global functions from config.js)
    global.getConfig = getConfig;  // Direct reference to config.js function
    global.setConfig = setConfig;  // Direct reference to config.js function

    global.testAudio = function () {
        console.log('=== AUDIO SYSTEM TEST ===');

        if (!global.audioSystem) {
            console.log('❌ AudioSystem not initialized');
            return;
        }

        console.log('✓ AudioSystem exists');
        console.log('Audio settings:', global.audioSystem.getAudioSettings());
        console.log('Loaded sounds:', Array.from(global.audioSystem.sounds.keys()));

        console.log('\nTesting footstep sound...');
        global.audioSystem.playFootstep();

        console.log('=== END AUDIO TEST ===');
        console.log('If you heard a footstep, audio is working!');
    };

    global.debugInteractions = function () {
        console.log('=== INTERACTION SYSTEM DEBUG ===');

        if (global.interactionSystem) {
            console.log('InteractionSystem Stats:', global.interactionSystem.getInteractionStats());
            global.interactionSystem.debugLogInteractions();
        } else {
            console.log('InteractionSystem not initialized');
        }

        // Find interactable entities
        if (global.gameEngine && global.gameEngine.gameState) {
            console.log('Interactable entities:');
            for (const entity of global.gameEngine.gameState.entities.values()) {
                const interactable = entity.getComponent('Interactable');
                if (interactable) {
                    const transform = entity.getComponent('Transform');
                    console.log(`  Entity ${entity.id}: ${interactable.type} at`, transform ? transform.position : 'no position');
                    console.log(`    Distance: ${interactable.interactDistance}, Active: ${interactable.isActive}`);
                }
            }
        }

        console.log('=== END INTERACTION DEBUG ===');
    };

    global.testCanInteraction = function () {
        console.log('Testing Can Interaction...');

        if (!global.gameEngine || !global.gameEngine.gameState) {
            console.log('Game not initialized');
            return;
        }

        const localPlayer = global.gameEngine.gameState.getLocalPlayer();
        if (!localPlayer) {
            console.log('No local player found');
            return;
        }

        // Find the central can
        let canEntity = null;
        for (const entity of global.gameEngine.gameState.entities.values()) {
            const interactable = entity.getComponent('Interactable');
            if (interactable && (interactable.type === 'can' || interactable.type === 'burken')) {
                canEntity = entity;
                break;
            }
        }

        if (!canEntity) {
            console.log('Central can not found');
            return;
        }

        // Move player near the can
        const playerTransform = localPlayer.getComponent('Transform');
        const canTransform = canEntity.getComponent('Transform');

        if (playerTransform && canTransform) {
            playerTransform.position.x = canTransform.position.x + 1.0; // 1 unit away
            playerTransform.position.z = canTransform.position.z;
            console.log(`Player moved near can at (${playerTransform.position.x}, ${playerTransform.position.z})`);
        }

        // Trigger interaction manually
        if (global.interactionSystem) {
            const success = global.interactionSystem.handleInteractionAttempt(localPlayer, global.gameEngine.gameState);
            console.log(`Interaction attempt: ${success ? 'Success' : 'Failed'}`);
        }
    };

    global.debugObstacles = function () {
        console.log('=== OBSTACLE SYSTEM DEBUG ===');

        if (!global.gameEngine || !global.gameEngine.gameState) {
            console.log('Game not initialized');
            return;
        }

        // Count obstacles
        let obstacleCount = 0;
        let colliderCount = 0;

        for (const entity of global.gameEngine.gameState.entities.values()) {
            const collider = entity.getComponent('Collider');
            const transform = entity.getComponent('Transform');

            if (collider && transform) {
                colliderCount++;
                if (collider.isStatic && collider.blockMovement) {
                    obstacleCount++;
                    console.log(`Obstacle ${obstacleCount}: Position (${transform.position.x.toFixed(1)}, ${transform.position.z.toFixed(1)}), Size: ${collider.bounds.width.toFixed(1)}x${collider.bounds.height.toFixed(1)}x${collider.bounds.depth.toFixed(1)}`);
                }
            }
        }

        console.log(`Total Entities with Colliders: ${colliderCount}`);
        console.log(`Static Blocking Obstacles: ${obstacleCount}`);

        // Check movement system collision state
        if (global.movementSystem) {
            console.log(`MovementSystem Static Colliders: ${global.movementSystem.staticColliders ? global.movementSystem.staticColliders.length : 'N/A'}`);
        }

        // Test collision configuration
        console.log('Obstacle Configuration:');
        console.log(`  Enabled: ${CONFIG.obstacles.enabled}`);
        console.log(`  Count: ${CONFIG.obstacles.count}`);
        console.log(`  Can Exclusion Radius: ${CONFIG.obstacles.canExclusionRadius}`);
        console.log(`  Size Range: ${CONFIG.obstacles.minWidth}-${CONFIG.obstacles.maxWidth} width`);

        console.log('=== END OBSTACLE DEBUG ===');
    };

    global.testObstacleCollision = function () {
        console.log('Testing Obstacle Collision...');

        if (!global.gameEngine || !global.gameEngine.gameState) {
            console.log('Game not initialized');
            return;
        }

        const localPlayer = global.gameEngine.gameState.getLocalPlayer();
        if (!localPlayer) {
            console.log('No local player found');
            return;
        }

        // Find first obstacle
        let obstacleEntity = null;
        for (const entity of global.gameEngine.gameState.entities.values()) {
            const collider = entity.getComponent('Collider');
            if (collider && collider.isStatic && collider.blockMovement) {
                obstacleEntity = entity;
                break;
            }
        }

        if (!obstacleEntity) {
            console.log('No obstacles found to test collision');
            return;
        }

        // Move player to obstacle position (should trigger collision)
        const playerTransform = localPlayer.getComponent('Transform');
        const obstacleTransform = obstacleEntity.getComponent('Transform');

        if (playerTransform && obstacleTransform) {
            const originalPos = { ...playerTransform.position };

            // Try to move player into obstacle
            playerTransform.position.x = obstacleTransform.position.x;
            playerTransform.position.z = obstacleTransform.position.z;

            console.log(`Player moved from (${originalPos.x.toFixed(1)}, ${originalPos.z.toFixed(1)}) to obstacle at (${obstacleTransform.position.x.toFixed(1)}, ${obstacleTransform.position.z.toFixed(1)})`);
            console.log('Try moving with WASD - collision should prevent overlap');
        }
    };

    global.testMovement = function () {
        console.log('Testing Player Movement...');

        if (!global.gameEngine || !global.gameEngine.gameState) {
            console.log('Game not initialized');
            return;
        }

        const localPlayer = global.gameEngine.gameState.getLocalPlayer();
        if (!localPlayer) {
            console.log('No local player found');
            return;
        }

        const playerTransform = localPlayer.getComponent('Transform');
        const playerInput = localPlayer.getComponent('PlayerInput');

        if (playerTransform && playerInput) {
            console.log('Player Position:', playerTransform.position);
            console.log('Player Velocity:', playerTransform.velocity);
            console.log('Player Input Keys:', playerInput.keys);
            console.log('Movement System Colliders:', global.movementSystem.staticColliders.length);

            // Test direct movement
            const oldPos = { ...playerTransform.position };
            playerTransform.position.x += 1.0;
            console.log(`Moved player from (${oldPos.x.toFixed(1)}, ${oldPos.z.toFixed(1)}) to (${playerTransform.position.x.toFixed(1)}, ${playerTransform.position.z.toFixed(1)})`);
            console.log('Player should move if you can see position change');
        }
    };

    global.disableCollision = function () {
        console.log('Temporarily disabling collision detection...');
        if (global.movementSystem) {
            global.movementSystem.staticColliders = [];
            console.log('Collision disabled - try moving with WASD');
            console.log('Use enableCollision() to re-enable');
        }
    };

    global.enableCollision = function () {
        console.log('Re-enabling collision detection...');
        if (global.movementSystem) {
            console.log('Collision re-enabled');
        }
    };

    global.debugMovement = function () {
        console.log('=== MOVEMENT SYSTEM DEBUG ===');

        // Check systems
        if (global.gameEngine && global.gameEngine.systems) {
            console.log('Registered systems:', global.gameEngine.systems.map(s => s.name));
            const inputSys = global.gameEngine.systems.find(s => s.name === 'InputSystem');
            const moveSys = global.gameEngine.systems.find(s => s.name === 'MovementSystem');
            console.log('InputSystem found:', !!inputSys);
            console.log('MovementSystem found:', !!moveSys);
        }

        // Check local player
        if (global.gameEngine && global.gameEngine.gameState) {
            const localPlayer = global.gameEngine.gameState.getLocalPlayer();
            if (localPlayer) {
                console.log('Local player entity ID:', localPlayer.id);
                console.log('Local player components:', Array.from(localPlayer.components.keys()));

                const transform = localPlayer.getComponent('Transform');
                const movement = localPlayer.getComponent('Movement');
                const playerInput = localPlayer.getComponent('PlayerInput');

                console.log('Transform component:', {
                    exists: !!transform,
                    position: transform ? transform.position : 'N/A'
                });
                console.log('Movement component:', {
                    exists: !!movement,
                    speed: movement ? movement.speed : 'N/A'
                });
                console.log('PlayerInput component:', {
                    exists: !!playerInput,
                    keys: playerInput ? playerInput.keys : 'N/A'
                });
            } else {
                console.log('No local player found');
            }
        }

        console.log('=== END MOVEMENT DEBUG ===');
    };

    global.testKeyboard = function () {
        console.log('Testing keyboard input...');
        console.log('Press W, A, S, D keys and watch console');

        document.addEventListener('keydown', (e) => {
            console.log('RAW KEY DOWN:', e.code, e.key);
        });

        document.addEventListener('keyup', (e) => {
            console.log('RAW KEY UP:', e.code, e.key);
        });
    };

    global.testAIVision = function () {
        console.log('Testing AI Vision System...');

        if (!global.gameEngine || !global.gameEngine.gameState) {
            console.log('Game not initialized');
            return;
        }

        const aiSystem = global.gameEngine.systems.get('AISystem');
        if (!aiSystem) {
            console.log('AI System not found');
            return;
        }

        // Run the line-of-sight test
        const result = aiSystem.testLineOfSight(global.gameEngine.gameState);
        if (result) {
            console.log('Test completed successfully!');
            if (!result.hasLineOfSight && result.distance < 12) {
                console.log('Obstacle occlusion working correctly!');
            } else if (result.hasLineOfSight && result.distance < 12) {
                console.log('Clear line of sight detected correctly!');
            }
        }
    };

    // Enable debug mode in development
    global.DEBUG = true;

    Utils.log('Debug commands loaded');
})(typeof window !== 'undefined' ? window : globalThis);
