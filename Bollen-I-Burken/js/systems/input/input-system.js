/* ==========================================
   BOLLEN I BURKEN - CONTROLS SYSTEM
   Input handling for keyboard, touch, and gamepad
   ========================================== */

class InputSystem extends System {
    constructor() {
        super('InputSystem');

        this.keys = new Map();
        this.touchControls = new Map();
        this.gamepad = null;
        this.pendingInput = false;
        this.currentGameState = null;

        // Mouse input tracking
        this.mouseInput = {
            isLocked: false,
            totalRotationX: 0,  // Accumulated horizontal rotation
            totalRotationY: 0,  // Accumulated vertical rotation (for future use)
            sensitivity: 0.002  // Mouse sensitivity multiplier
        };

        this.setupKeyboardControls();
        this.setupMouseControls();
        this.setupTouchControls();
        this.setupGamepadControls();

        Utils.log('Input system initialized');
    }

    setupKeyboardControls() {
        // Key mappings
        this.keyMappings = {
            // Movement
            'KeyW': 'forward',
            'ArrowUp': 'forward',
            'KeyS': 'backward',
            'ArrowDown': 'backward',
            'KeyA': 'left',
            'ArrowLeft': 'left',
            'KeyD': 'right',
            'ArrowRight': 'right',

            // Actions
            'Space': 'action1',
            'Enter': 'action2',
            'KeyE': 'interact',
            'KeyQ': 'special',

            // System
            'Escape': 'pause',
            'KeyP': 'menu',
            'KeyM': 'mute',
            'KeyV': 'camera_toggle',  // V key for camera mode switching
            'ShiftLeft': 'sneak',
            'ShiftRight': 'sneak'
        };

        // Bind event handlers to preserve 'this' context
        this.boundKeyDown = this.handleKeyDown.bind(this);
        this.boundKeyUp = this.handleKeyUp.bind(this);

        document.addEventListener('keydown', this.boundKeyDown);
        document.addEventListener('keyup', this.boundKeyUp);

        // Prevent default behavior for game keys
        document.addEventListener('keydown', (event) => {
            if (this.keyMappings[event.code]) {
                event.preventDefault();
            }
        });
    }

    setupMouseControls() {
        // Mouse movement tracking
        this.boundMouseMove = this.handleMouseMove.bind(this);
        this.boundPointerLockChange = this.handlePointerLockChange.bind(this);
        this.boundClick = this.handleClick.bind(this);

        // Add event listeners
        document.addEventListener('mousemove', this.boundMouseMove);
        document.addEventListener('pointerlockchange', this.boundPointerLockChange);
        document.addEventListener('pointerlockerror', this.handlePointerLockError.bind(this));
        document.addEventListener('click', this.boundClick);
    }

    handleMouseMove(event) {
        if (this.mouseInput.isLocked) {
            // Accumulate mouse rotation when pointer is locked
            this.mouseInput.totalRotationX += event.movementX * this.mouseInput.sensitivity;
            this.mouseInput.totalRotationY += event.movementY * this.mouseInput.sensitivity;
            
            // Keep rotations within reasonable bounds
            this.mouseInput.totalRotationX = this.mouseInput.totalRotationX % (2 * Math.PI);
        }
    }

    handlePointerLockChange() {
        this.mouseInput.isLocked = document.pointerLockElement === document.body;
        if (this.mouseInput.isLocked) {
            Utils.log('🖱️ Mouse locked - camera control enabled');
        } else {
            Utils.log('🖱️ Mouse unlocked - camera control disabled');
        }
    }

    handlePointerLockError() {
        Utils.warn('🖱️ Pointer lock failed');
        this.mouseInput.isLocked = false;
    }

    handleClick() {
        // Request pointer lock on click (if not already locked)
        if (!this.mouseInput.isLocked && document.pointerLockElement !== document.body) {
            document.body.requestPointerLock();
        }
    }

    isMouseLocked() {
        return this.mouseInput.isLocked;
    }

    /**
     * Get current mouse rotation values for camera control
     */
    getMouseRotation() {
        return {
            x: this.mouseInput.totalRotationX,
            y: this.mouseInput.totalRotationY
        };
    }

    setupTouchControls() {
        // Touch controls for mobile devices
        this.touchZones = {
            dpad: null,
            actions: null
        };

        // Create touch controls if on mobile
        if (this.isMobileDevice()) {
            this.createTouchControls();
        }
    }

    setupGamepadControls() {
        // Gamepad support
        window.addEventListener('gamepadconnected', (event) => {
            this.gamepad = event.gamepad;
            Utils.log(`Gamepad connected: ${this.gamepad.id}`);
        });

        window.addEventListener('gamepaddisconnected', (event) => {
            if (this.gamepad && this.gamepad.index === event.gamepad.index) {
                this.gamepad = null;
                Utils.log('Gamepad disconnected');
            }
        });
    }

    handleKeyDown(event) {
        // Debug: Key down detected (log removed to prevent spam)
        const action = this.keyMappings[event.code];
        if (action) {
            // Debug: Mapped to action (log removed to prevent spam)
            this.keys.set(action, true);
            this.updatePlayerInput();
        } else {
            // Debug: No mapping for key (log removed to prevent spam)
        }
    }

    handleKeyUp(event) {
        // Debug: Key up detected (log removed to prevent spam)
        const action = this.keyMappings[event.code];
        if (action) {
            // Debug: Released action (log removed to prevent spam)
            this.keys.set(action, false);
            this.updatePlayerInput();
        }
    }

    updatePlayerInput() {
        // Update input for local player
        const gameState = this.currentGameState;
        if (!gameState) {
            // Store input state for when gameState becomes available
            this.pendingInput = true;
            return;
        }

        // Allow input during COUNTDOWN and PLAYING
        if (gameState.gamePhase !== GAME_STATES.PLAYING && gameState.gamePhase !== GAME_STATES.COUNTDOWN) {
            return;
        }

        const localPlayer = gameState.getLocalPlayer();
        if (!localPlayer) {
            return;
        }

        const input = localPlayer.getComponent('PlayerInput');
        if (!input) {
            return;
        }

        // Update movement keys
        input.keys.forward = this.keys.get('forward') || false;
        input.keys.backward = this.keys.get('backward') || false;
        input.keys.left = this.keys.get('left') || false;
        input.keys.right = this.keys.get('right') || false;

        // Update action keys
        input.keys.interact = this.keys.get('interact') || false;
        input.keys.special = this.keys.get('special') || false;
        input.keys.action1 = this.keys.get('action1') || false;
        input.keys.action2 = this.keys.get('action2') || false;

        // Update input timestamp and sequence
        input.lastInputTime = Utils.now();
        input.inputSequence++;
    }

    createTouchControls() {
        // Create touch control overlay
        const touchContainer = document.createElement('div');
        touchContainer.className = 'touch-controls';
        touchContainer.style.display = 'none'; // Hidden by default

        // D-Pad for movement
        const dpad = this.createDPad();
        touchContainer.appendChild(dpad);

        // Action buttons
        const actions = this.createActionButtons();
        touchContainer.appendChild(actions);

        document.body.appendChild(touchContainer);

        // Show touch controls on mobile
        if (this.isMobileDevice()) {
            touchContainer.style.display = 'flex';
        }
    }

    createDPad() {
        const dpad = document.createElement('div');
        dpad.className = 'touch-dpad';

        const directions = [
            { name: 'up', action: 'forward', text: '↑' },
            { name: 'down', action: 'backward', text: '↓' },
            { name: 'left', action: 'left', text: '←' },
            { name: 'right', action: 'right', text: '→' }
        ];

        directions.forEach(dir => {
            const button = document.createElement('div');
            button.className = `touch-button ${dir.name}`;
            button.textContent = dir.text;

            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys.set(dir.action, true);
                this.updatePlayerInput();
                button.classList.add('active');
            });

            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys.set(dir.action, false);
                this.updatePlayerInput();
                button.classList.remove('active');
            });

            dpad.appendChild(button);
        });

        return dpad;
    }

    createActionButtons() {
        const actions = document.createElement('div');
        actions.className = 'touch-actions';

        const buttons = [
            { action: 'action1', text: 'A' },
            { action: 'action2', text: 'B' }
        ];

        buttons.forEach(btn => {
            const button = document.createElement('div');
            button.className = 'action-button';
            button.textContent = btn.text;

            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys.set(btn.action, true);
                this.updatePlayerInput();
                button.classList.add('active');
            });

            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys.set(btn.action, false);
                this.updatePlayerInput();
                button.classList.remove('active');
            });

            actions.appendChild(button);
        });

        return actions;
    }

    updateGamepad() {
        if (!this.gamepad) return;

        // Update gamepad state
        const gamepads = navigator.getGamepads();
        if (gamepads[this.gamepad.index]) {
            this.gamepad = gamepads[this.gamepad.index];
        } else {
            return;
        }

        // Read gamepad inputs
        const deadzone = 0.2;
        const leftStick = {
            x: Math.abs(this.gamepad.axes[0]) > deadzone ? this.gamepad.axes[0] : 0,
            y: Math.abs(this.gamepad.axes[1]) > deadzone ? this.gamepad.axes[1] : 0
        };

        // Convert analog stick to digital inputs
        this.keys.set('left', leftStick.x < -deadzone);
        this.keys.set('right', leftStick.x > deadzone);
        this.keys.set('forward', leftStick.y < -deadzone);
        this.keys.set('backward', leftStick.y > deadzone);

        // Button inputs
        this.keys.set('action1', this.gamepad.buttons[0].pressed); // A
        this.keys.set('action2', this.gamepad.buttons[1].pressed); // B
        this.keys.set('special', this.gamepad.buttons[2].pressed); // X
        this.keys.set('interact', this.gamepad.buttons[3].pressed); // Y

        this.updatePlayerInput();
    }

    update(gameState) {
        this.currentGameState = gameState; // Store reference for input updates

        // Handle system keys regardless of phase
        if (this.keys.get('pause')) {
            this.keys.set('pause', false); // Prevent repeat
            this.togglePause(gameState);
        }

        if (this.keys.get('menu')) {
            this.keys.set('menu', false); // Prevent repeat
            this.showMenu(gameState);
        }

        // Handle sneak toggle
        if (window.movementSystem) {
            window.movementSystem.isSneaking = this.keys.get('sneak') || false;
        }

        // Handle camera mode toggle (V key)
        if (this.keys.get('camera_toggle')) {
            this.keys.set('camera_toggle', false); // Prevent repeat
            console.log('🎥 INPUT SYSTEM: V key pressed - dispatching camera-mode-toggle event');
            // Dispatch custom event for camera mode toggle
            const event = new CustomEvent('camera-mode-toggle', {
                detail: { timestamp: Utils.now() }
            });
            window.dispatchEvent(event);
        }

        // Allow input during COUNTDOWN and PLAYING
        if (!gameState || (gameState.gamePhase !== GAME_STATES.PLAYING && gameState.gamePhase !== GAME_STATES.COUNTDOWN)) {
            return;
        }

        // Process any pending input updates
        if (this.pendingInput) {
            this.updatePlayerInput();
            this.pendingInput = false;
        }

        // Update gamepad input
        this.updateGamepad();
    }

    togglePause(gameState) {
        // Use gameEngine.pause()/resume() to properly halt system updates
        const gameEngine = window.gameEngine || global.gameEngine;
        if (!gameEngine) {
            Utils.warn('InputSystem: Cannot toggle pause - gameEngine not available');
            return;
        }

        if (gameState.gamePhase === GAME_STATES.PLAYING) {
            gameEngine.pause();
        } else if (gameState.gamePhase === GAME_STATES.PAUSED) {
            gameEngine.resume();
        }
    }

    showMenu(gameState) {
        this.togglePause(gameState);
    }

    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            ('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0);
    }

    getInputState() {
        // Return current input state for debugging
        const state = {};
        for (const [key, value] of this.keys) {
            if (value) {
                state[key] = value;
            }
        }
        return state;
    }

    isKeyPressed(action) {
        return this.keys.get(action) || false;
    }

    // Method to programmatically simulate input (useful for AI or replay)
    simulateInput(action, pressed) {
        this.keys.set(action, pressed);
        this.updatePlayerInput();
    }

    destroy() {
        // Clean up event listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        
        // Clean up mouse event listeners
        document.removeEventListener('mousemove', this.boundMouseMove);
        document.removeEventListener('pointerlockchange', this.boundPointerLockChange);
        document.removeEventListener('click', this.boundClick);

        // Remove touch controls
        const touchControls = document.querySelector('.touch-controls');
        if (touchControls) {
            touchControls.remove();
        }

        Utils.log('Input system destroyed');
    }
}

// Export for module systems or global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { InputSystem };
} else {
    window.GameControls = { InputSystem };
}