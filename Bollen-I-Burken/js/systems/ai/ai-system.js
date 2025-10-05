// @ts-nocheck
/* ==========================================
   AI SYSTEM
   Manages hunter behaviour and vision checks
   ========================================== */

(function (global) {
    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const AI_STATES = {
        PATROL: 'PATROL',          // Orbit can at ~3m radius
        INVESTIGATE: 'INVESTIGATE', // Move to last heard position and look around
        RACE: 'RACE'               // Sprint straight to can
    };

    // Debug flag - set to true for verbose console logging
    const AI_DEBUG = false;

    // AI Recklessness settings (defaults, tweakable via T panel)
    const DEFAULT_RECKLESS_START_TIME = 45000;  // Start getting reckless after 45 seconds (milliseconds)
    const DEFAULT_RECKLESS_RAMP_DURATION = 30000;  // Ramp up over 30 seconds once active
    const DEFAULT_RECKLESS_MAX_RADIUS = 12.0;   // How far AI ventures when fully reckless (from can)
    const BASE_PATROL_RADIUS = 4.5;

    class AISystem extends System {
        constructor() {
            super('AISystem');
            this.hunters = new Set();
            this.aiFrozen = false;  // Debug toggle to freeze AI
            this.hearingRange = 10.0;  // How far AI can hear
            this.gameStartTime = null;  // Track when game started for recklessness

            const difficulty = (typeof CONFIG !== 'undefined' && CONFIG.difficulties && CONFIG.difficulties[CONFIG.currentDifficulty])
                ? CONFIG.difficulties[CONFIG.currentDifficulty]
                : null;
            const difficultyAI = (difficulty && difficulty.ai) ? difficulty.ai : {};

            this.patrolMaxSpeed = (typeof difficultyAI.patrolSpeed === 'number') ? difficultyAI.patrolSpeed : 0.12;
            this.chaseMaxSpeed = (typeof difficultyAI.chaseSpeed === 'number') ? difficultyAI.chaseSpeed : 0.20;
            this.accelerationRate = 0.12;
            this.maxAngularAcceleration = 4.5;
            this.investigateDuration = 8000;
            this.reactionDuration = 800;
            this.reactionJumpTime = 200;
            this.recklessStartTime = DEFAULT_RECKLESS_START_TIME;
            this.recklessRampDuration = DEFAULT_RECKLESS_RAMP_DURATION;
            this.recklessMaxRadius = DEFAULT_RECKLESS_MAX_RADIUS;
            this.visionBaseAngle = (typeof difficultyAI.visionAngle === 'number') ? difficultyAI.visionAngle : 85;
            this.visionBaseRange = (typeof difficultyAI.visionRange === 'number') ? difficultyAI.visionRange : 13;
            this.visionCloseThreshold = 0.79;
            this.visionFarThreshold = 0.84;
            this.guardTurnSpeed = 2.0;
            this.guardScanInterval = 550;

            this._tweakOverrides = {
                patrolMaxSpeed: false,
                chaseMaxSpeed: false,
                accelerationRate: false,
                maxAngularAcceleration: false,
                investigateDuration: false,
                reactionDuration: false,
                reactionJumpTime: false,
                visionBaseAngle: false,
                visionBaseRange: false,
                recklessStartTime: false,
                recklessRampDuration: false,
                recklessMaxRadius: false,
                visionCloseThreshold: false,
                visionFarThreshold: false,
                guardTurnSpeed: false,
                guardScanInterval: false
            };

            // Apply default tuning so tweak panel reflects desired baseline values
            this.setHearingRange(10);
            this.setPatrolMaxSpeed(0.12);
            this.setChaseMaxSpeed(0.20);
            this.setAccelerationRate(0.15);
            this.setMaxAngularAcceleration(4.5);
            this.setInvestigateDuration(8000);
            this.setReactionDuration(800);
            this.setReactionJumpTime(200);
            this.setRecklessStartTime(30000);
            this.setRecklessRampDuration(60000);
            this.setRecklessMaxRadius(17);
            this.setVisionBaseAngle(62);
            this.setVisionBaseRange(29);
            this.setVisionCloseThreshold(0.45);
            this.setVisionFarThreshold(0.7);
            this.setGuardTurnSpeed(2.0);
            this.setGuardScanInterval(700);

            this.registerTweaks();
            Utils.log('AI system initialized');
        }

        registerTweaks() {
            if (!window.TweakPanel) return;

            window.TweakPanel.addSetting('AI', 'Freeze AI', {
                type: 'checkbox',
                label: 'Freeze AI (for testing)',
                getValue: () => this.aiFrozen,
                setValue: (v) => this.setFreezeAI(v)
            });

            window.TweakPanel.addSetting('AI', 'Hearing Range', {
                type: 'range',
                min: 2,
                max: 100,
                step: 1,
                decimals: 1,
                label: 'Hearing Range (meters)',
                getValue: () => this.hearingRange,
                setValue: (v) => this.setHearingRange(v)
            });

            window.TweakPanel.addSetting('AI', 'Patrol Max Speed', {
                type: 'range',
                min: 0.05,
                max: 0.40,
                step: 0.01,
                decimals: 2,
                label: 'Patrol Max Speed',
                getValue: () => this.patrolMaxSpeed,
                setValue: (v) => this.setPatrolMaxSpeed(v)
            });

            window.TweakPanel.addSetting('AI', 'Chase Max Speed', {
                type: 'range',
                min: 0.05,
                max: 0.60,
                step: 0.01,
                decimals: 2,
                label: 'Chase Max Speed',
                getValue: () => this.chaseMaxSpeed,
                setValue: (v) => this.setChaseMaxSpeed(v)
            });

            window.TweakPanel.addSetting('AI', 'Acceleration', {
                type: 'range',
                min: 0.05,
                max: 0.50,
                step: 0.01,
                decimals: 2,
                label: 'Acceleration (m/s^2)',
                getValue: () => this.accelerationRate,
                setValue: (v) => this.setAccelerationRate(v)
            });

            window.TweakPanel.addSetting('AI', 'Max Angular Accel', {
                type: 'range',
                min: 0.5,
                max: 12.0,
                step: 0.1,
                decimals: 2,
                label: 'Max Angular Accel (rad/s)',
                getValue: () => this.maxAngularAcceleration,
                setValue: (v) => this.setMaxAngularAcceleration(v)
            });

            window.TweakPanel.addSetting('AI', 'Scan Turn Speed', {
                type: 'range',
                min: 0.5,
                max: 4.0,
                step: 0.1,
                decimals: 2,
                label: 'Scan Turn Speed (x)',
                getValue: () => this.guardTurnSpeed,
                setValue: (v) => this.setGuardTurnSpeed(v)
            });

            window.TweakPanel.addSetting('AI', 'Investigate Duration (s)', {
                type: 'range',
                min: 2,
                max: 20,
                step: 1,
                decimals: 0,
                label: 'Investigate Duration (s)',
                getValue: () => this.investigateDuration / 1000,
                setValue: (v) => this.setInvestigateDuration(v * 1000)
            });

            window.TweakPanel.addSetting('AI', 'Reaction Duration (s)', {
                type: 'range',
                min: 0.2,
                max: 3.0,
                step: 0.05,
                decimals: 2,
                label: 'Reaction Duration (s)',
                getValue: () => this.reactionDuration / 1000,
                setValue: (v) => this.setReactionDuration(v * 1000)
            });

            window.TweakPanel.addSetting('AI', 'Reaction Jump Delay (s)', {
                type: 'range',
                min: 0,
                max: 1.0,
                step: 0.05,
                decimals: 2,
                label: 'Reaction Jump Delay (s)',
                getValue: () => this.reactionJumpTime / 1000,
                setValue: (v) => this.setReactionJumpTime(v * 1000)
            });

            window.TweakPanel.addSetting('AI', 'Reckless Start (s)', {
                type: 'range',
                min: 5,
                max: 90,
                step: 1,
                decimals: 0,
                label: 'Reckless Start (s)',
                getValue: () => this.recklessStartTime / 1000,
                setValue: (v) => this.setRecklessStartTime(v * 1000)
            });

            window.TweakPanel.addSetting('AI', 'Reckless Ramp (s)', {
                type: 'range',
                min: 5,
                max: 60,
                step: 1,
                decimals: 0,
                label: 'Reckless Ramp (s)',
                getValue: () => this.recklessRampDuration / 1000,
                setValue: (v) => this.setRecklessRampDuration(v * 1000)
            });

            window.TweakPanel.addSetting('AI', 'Scan Interval (ms)', {
                type: 'range',
                min: 200,
                max: 2000,
                step: 50,
                decimals: 0,
                label: 'Scan Interval (ms)',
                getValue: () => this.guardScanInterval,
                setValue: (v) => this.setGuardScanInterval(v)
            });

            window.TweakPanel.addSetting('AI', 'Reckless Max Radius', {
                type: 'range',
                min: 5,
                max: 20,
                step: 0.5,
                decimals: 1,
                label: 'Reckless Max Radius (m)',
                getValue: () => this.recklessMaxRadius,
                setValue: (v) => this.setRecklessMaxRadius(v)
            });

            window.TweakPanel.addSetting('AI', 'Vision Base Angle', {
                type: 'range',
                min: 30,
                max: 160,
                step: 1,
                decimals: 0,
                label: 'Vision Base Angle (deg)',
                getValue: () => this.visionBaseAngle,
                setValue: (v) => this.setVisionBaseAngle(v)
            });

            window.TweakPanel.addSetting('AI', 'Vision Base Range', {
                type: 'range',
                min: 5,
                max: 60,
                step: 1,
                decimals: 0,
                label: 'Vision Base Range (m)',
                getValue: () => this.visionBaseRange,
                setValue: (v) => this.setVisionBaseRange(v)
            });

            window.TweakPanel.addSetting('AI', 'Vision Wide Threshold', {
                type: 'range',
                min: 0.05,
                max: 0.9,
                step: 0.01,
                decimals: 2,
                label: 'Vision Wide Threshold',
                getValue: () => this.visionCloseThreshold,
                setValue: (v) => this.setVisionCloseThreshold(v)
            });

            window.TweakPanel.addSetting('AI', 'Vision Focus Threshold', {
                type: 'range',
                min: 0.1,
                max: 0.98,
                step: 0.01,
                decimals: 2,
                label: 'Vision Focus Threshold',
                getValue: () => this.visionFarThreshold,
                setValue: (v) => this.setVisionFarThreshold(v)
            });
        }

        setFreezeAI(value) {
            this.aiFrozen = !!value;
        }

        setHearingRange(value) {
            this.hearingRange = Math.max(0, value);
        }

        setPatrolMaxSpeed(value) {
            this._tweakOverrides.patrolMaxSpeed = true;
            this.patrolMaxSpeed = value;
            this.applyToHunters((aiComponent, movement) => {
                aiComponent.maxSpeed = value;
                if (movement) {
                    movement.speed = value;
                    movement.baseSpeed = value;
                }
            });
        }

        setChaseMaxSpeed(value) {
            this._tweakOverrides.chaseMaxSpeed = true;
            this.chaseMaxSpeed = value;
            this.applyToHunters((aiComponent) => {
                aiComponent.maxSpeedHunting = value;
                if (typeof aiComponent.currentSpeed === 'number' && aiComponent.currentSpeed > value) {
                    aiComponent.currentSpeed = value;
                }
            });
        }

        setAccelerationRate(value) {
            this._tweakOverrides.accelerationRate = true;
            this.accelerationRate = value;
            this.applyToHunters((aiComponent) => {
                aiComponent.acceleration = value;
                aiComponent.maxAccel = value;
            });
        }

        setMaxAngularAcceleration(value) {
            this._tweakOverrides.maxAngularAcceleration = true;
            this.maxAngularAcceleration = value;
            this.applyToHunters((aiComponent) => {
                aiComponent.maxAngularAccel = value;
            });
        }

        setInvestigateDuration(value) {
            this._tweakOverrides.investigateDuration = true;
            this.investigateDuration = Math.max(0, value);
            this.applyToHunters((aiComponent) => {
                aiComponent.investigateDuration = this.investigateDuration;
            });
        }

        setReactionDuration(value) {
            this._tweakOverrides.reactionDuration = true;
            this.reactionDuration = Math.max(0, value);
            if (this.reactionJumpTime > this.reactionDuration) {
                this.reactionJumpTime = this.reactionDuration;
            }
            this.applyToHunters((aiComponent) => {
                aiComponent.reactionDuration = this.reactionDuration;
                aiComponent.reactionJumpTime = Math.min(aiComponent.reactionJumpTime || this.reactionJumpTime, this.reactionDuration);
            });
        }

        setReactionJumpTime(value) {
            this._tweakOverrides.reactionJumpTime = true;
            const clamped = Math.max(0, Math.min(value, this.reactionDuration));
            this.reactionJumpTime = clamped;
            this.applyToHunters((aiComponent) => {
                aiComponent.reactionJumpTime = Math.min(clamped, aiComponent.reactionDuration || this.reactionDuration);
            });
        }

        setRecklessStartTime(value) {
            this._tweakOverrides.recklessStartTime = true;
            this.recklessStartTime = Math.max(0, value);
        }

        setRecklessRampDuration(value) {
            this._tweakOverrides.recklessRampDuration = true;
            this.recklessRampDuration = Math.max(1000, value);
        }

        setRecklessMaxRadius(value) {
            this._tweakOverrides.recklessMaxRadius = true;
            this.recklessMaxRadius = Math.max(BASE_PATROL_RADIUS, value);
        }

        setVisionBaseAngle(value) {
            this._tweakOverrides.visionBaseAngle = true;
            this.visionBaseAngle = value;
            this.applyToHunters((aiComponent, movement, visionCone) => {
                this.applyVisionBaseSettings(visionCone);
            });
        }

        setVisionBaseRange(value) {
            this._tweakOverrides.visionBaseRange = true;
            this.visionBaseRange = value;
            this.applyToHunters((aiComponent, movement, visionCone) => {
                this.applyVisionBaseSettings(visionCone);
            });
        }

        setVisionCloseThreshold(value) {
            this._tweakOverrides.visionCloseThreshold = true;
            const clamped = Math.max(0.05, Math.min(value, 0.9));
            this.visionCloseThreshold = clamped;
            if (this.visionFarThreshold <= this.visionCloseThreshold + 0.05) {
                this.visionFarThreshold = Math.min(0.98, this.visionCloseThreshold + 0.05);
            }
            this.applyToHunters((aiComponent) => {
                aiComponent.visionCloseThreshold = this.visionCloseThreshold;
                aiComponent.visionFarThreshold = this.visionFarThreshold;
            });
            this.refreshTweakPanel();
        }

        setVisionFarThreshold(value) {
            this._tweakOverrides.visionFarThreshold = true;
            const minFar = this.visionCloseThreshold + 0.05;
            const clamped = Math.max(minFar, Math.min(value, 0.98));
            this.visionFarThreshold = clamped;
            this.applyToHunters((aiComponent) => {
                aiComponent.visionCloseThreshold = this.visionCloseThreshold;
                aiComponent.visionFarThreshold = this.visionFarThreshold;
            });
            this.refreshTweakPanel();
        }

        setGuardTurnSpeed(value) {
            this._tweakOverrides.guardTurnSpeed = true;
            const clamped = Math.max(0.1, value);
            this.guardTurnSpeed = clamped;
            this.applyToHunters((aiComponent) => {
                aiComponent.guardTurnSpeedBase = this.guardTurnSpeed;
                if (aiComponent.guardState) {
                    const randomFactor = aiComponent.guardState.turnSpeedRandomFactor || aiComponent.guardState.turnSpeedMultiplier || 1;
                    aiComponent.guardState.turnSpeedRandomFactor = randomFactor;
                    aiComponent.guardState.baseTurnSpeed = this.guardTurnSpeed;
                    aiComponent.guardState.turnSpeedMultiplier = randomFactor;
                }
            });
            this.refreshTweakPanel();
        }

        setGuardScanInterval(value) {
            this._tweakOverrides.guardScanInterval = true;
            const clamped = Math.max(100, value);
            this.guardScanInterval = clamped;
            this.applyToHunters((aiComponent) => {
                aiComponent.guardScanIntervalBase = this.guardScanInterval;
                if (aiComponent.guardState) {
                    aiComponent.guardState.scanIntervalBase = this.guardScanInterval;
                }
            });
            this.refreshTweakPanel();
        }

        refreshTweakPanel() {
            if (window.TweakPanel && window.TweakPanel.isVisible && typeof window.TweakPanel.refresh === 'function') {
                window.TweakPanel.refresh();
            }
        }

        applyVisionBaseSettings(visionCone) {
            if (!visionCone) return;
            visionCone.baseAngle = this.visionBaseAngle;
            visionCone.baseRange = this.visionBaseRange;
            visionCone.angle = this.visionBaseAngle;
            visionCone.range = this.visionBaseRange;
        }

        applyCurrentTweaksToHunter(aiComponent, movement, visionCone) {
            if (!aiComponent) return;

            aiComponent.maxSpeed = this.patrolMaxSpeed;
            aiComponent.maxSpeedHunting = this.chaseMaxSpeed;
            aiComponent.acceleration = this.accelerationRate;
            aiComponent.maxAccel = this.accelerationRate;
            aiComponent.maxAngularAccel = this.maxAngularAcceleration;
            aiComponent.investigateDuration = this.investigateDuration;
            aiComponent.reactionDuration = this.reactionDuration;
            aiComponent.reactionJumpTime = Math.min(this.reactionJumpTime, this.reactionDuration);
            aiComponent.visionCloseThreshold = this.visionCloseThreshold;
            aiComponent.visionFarThreshold = this.visionFarThreshold;
            aiComponent.guardTurnSpeedBase = this.guardTurnSpeed;
            aiComponent.guardScanIntervalBase = this.guardScanInterval;
            if (typeof aiComponent.currentSpeed === 'number' && aiComponent.currentSpeed > aiComponent.maxSpeed) {
                aiComponent.currentSpeed = aiComponent.maxSpeed;
            }

            if (movement) {
                movement.speed = this.patrolMaxSpeed;
                movement.baseSpeed = this.patrolMaxSpeed;
            }

            if (aiComponent.guardState) {
                const state = aiComponent.guardState;
                state.turnSpeedRandomFactor = state.turnSpeedRandomFactor || state.turnSpeedMultiplier || 1;
                state.baseTurnSpeed = this.guardTurnSpeed;
                state.turnSpeedMultiplier = state.turnSpeedRandomFactor;
                state.scanIntervalBase = this.guardScanInterval;
            }

            this.applyVisionBaseSettings(visionCone);
        }

        captureHunterDefaults(aiComponent, visionCone) {
            if (aiComponent) {
                if (!this._tweakOverrides.patrolMaxSpeed && typeof aiComponent.maxSpeed === 'number') {
                    this.patrolMaxSpeed = aiComponent.maxSpeed;
                }
                if (!this._tweakOverrides.chaseMaxSpeed && typeof aiComponent.maxSpeedHunting === 'number') {
                    this.chaseMaxSpeed = aiComponent.maxSpeedHunting;
                }
                if (!this._tweakOverrides.accelerationRate && typeof aiComponent.acceleration === 'number') {
                    this.accelerationRate = aiComponent.acceleration;
                }
                if (!this._tweakOverrides.maxAngularAcceleration && typeof aiComponent.maxAngularAccel === 'number') {
                    this.maxAngularAcceleration = aiComponent.maxAngularAccel;
                }
                if (!this._tweakOverrides.investigateDuration && typeof aiComponent.investigateDuration === 'number') {
                    this.investigateDuration = aiComponent.investigateDuration;
                }
                if (!this._tweakOverrides.reactionDuration && typeof aiComponent.reactionDuration === 'number') {
                    this.reactionDuration = aiComponent.reactionDuration;
                }
                if (!this._tweakOverrides.reactionJumpTime && typeof aiComponent.reactionJumpTime === 'number') {
                    this.reactionJumpTime = aiComponent.reactionJumpTime;
                }
                if (!this._tweakOverrides.visionCloseThreshold && typeof aiComponent.visionCloseThreshold === 'number') {
                    this.visionCloseThreshold = aiComponent.visionCloseThreshold;
                }
                if (!this._tweakOverrides.visionFarThreshold && typeof aiComponent.visionFarThreshold === 'number') {
                    this.visionFarThreshold = aiComponent.visionFarThreshold;
                }
                if (!this._tweakOverrides.guardTurnSpeed && typeof aiComponent.guardTurnSpeedBase === 'number') {
                    this.guardTurnSpeed = aiComponent.guardTurnSpeedBase;
                }
                if (!this._tweakOverrides.guardScanInterval && typeof aiComponent.guardScanIntervalBase === 'number') {
                    this.guardScanInterval = aiComponent.guardScanIntervalBase;
                }
            }

            if (visionCone) {
                const baseAngle = visionCone.baseAngle || visionCone.angle;
                if (!this._tweakOverrides.visionBaseAngle && typeof baseAngle === 'number') {
                    this.visionBaseAngle = baseAngle;
                }

                const baseRange = visionCone.baseRange || visionCone.range;
                if (!this._tweakOverrides.visionBaseRange && typeof baseRange === 'number') {
                    this.visionBaseRange = baseRange;
                }
            }

            if (!this._tweakOverrides.guardTurnSpeed) {
                this.guardTurnSpeed = this.guardTurnSpeed || 1.0;
            }
        }

        applyToHunters(callback) {
            for (const hunter of this.hunters) {
                if (!hunter || typeof hunter.getComponent !== 'function') {
                    continue;
                }
                const aiComponent = hunter.getComponent('AIHunter');
                if (!aiComponent) {
                    continue;
                }
                const movement = hunter.getComponent('Movement');
                const visionCone = hunter.getComponent('VisionCone');
                callback(aiComponent, movement, visionCone, hunter);
            }
        }



        addEntity(entity) {
            if (!entity || !entity.hasComponent('AIHunter')) {
                return;
            }

            this.hunters.add(entity);

            const aiComponent = entity.getComponent('AIHunter');
            const movement = entity.getComponent('Movement');
            const visionCone = entity.getComponent('VisionCone');

            this.captureHunterDefaults(aiComponent, visionCone);
            this.applyCurrentTweaksToHunter(aiComponent, movement, visionCone);
            this.refreshTweakPanel();

            Utils.log(`AI hunter entity added: ${entity.id}`);
        }

        removeEntity(entity) {
            this.hunters.delete(entity);
        }

        update(gameState, deltaTime) {
            if (!gameState || gameState.gamePhase !== GAME_STATES.PLAYING) {
                // Reset game timer when not playing
                this.gameStartTime = null;
                return;
            }

            // Track game start time for recklessness (set once when PLAYING phase starts)
            if (this.gameStartTime === null) {
                this.gameStartTime = Date.now();
                Utils.log('AI recklessness timer started - will venture further after 45 seconds');
            }

            // Skip AI updates if frozen (for testing)
            if (this.aiFrozen) {
                return;
            }

            for (const hunter of this.hunters) {
                if (!hunter.active) {
                    this.hunters.delete(hunter);
                    continue;
                }

                try {
                    this.updateHunter(hunter, gameState, deltaTime);
                } catch (error) {
                    Utils.error(`AI Hunter ${hunter.id} update failed:`, error);
                    console.error(`Hunter ${hunter.id} update failed:`, error);
                }
            }
        }

        updateHunter(hunter, gameState, deltaTime) {
            const aiComponent = hunter.getComponent('AIHunter');
            const transform = hunter.getComponent('Transform');
            const movement = hunter.getComponent('Movement');
            const visionCone = hunter.getComponent('VisionCone');

            if (!aiComponent || !transform || !movement) {
                return;
            }

            if (aiComponent.wallCollisionCooldown > 0) {
                aiComponent.wallCollisionCooldown -= deltaTime;
            }

            switch (aiComponent.state) {
                case AI_STATES.PATROL:
                    this.updatePatrolBehavior(aiComponent, transform, movement, deltaTime, gameState);
                    break;
                case AI_STATES.INVESTIGATE:
                    this.updateInvestigateBehavior(aiComponent, transform, movement, deltaTime, gameState);
                    break;
                case AI_STATES.RACE:
                    this.updateRaceBehavior(aiComponent, transform, movement, deltaTime, gameState);
                    break;
            }

            if (visionCone) {
                this.updateVision(hunter, visionCone, gameState);
            }

            // Check if AI can hear player
            this.updateHearing(hunter, gameState);

            // Check for shirt pulling
            this.checkShirtPull(hunter, gameState);

            this.checkPlayerCollision(hunter, gameState);
        }

        updateHearing(hunter, gameState) {
            const aiTransform = hunter.getComponent('Transform');
            if (!aiTransform) return;

            const localPlayer = gameState.getLocalPlayer();
            if (!localPlayer) return;

            const playerTransform = localPlayer.getComponent('Transform');
            if (!playerTransform) return;

            // Calculate distance to player
            const dx = playerTransform.position.x - aiTransform.position.x;
            const dz = playerTransform.position.z - aiTransform.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            // Get player movement info
            const movementSystem = window.movementSystem;
            const audioSystem = window.audioSystem;

            if (!movementSystem || !audioSystem) return;

            const playerSpeed = movementSystem.playerCurrentSpeed;
            const isSneaking = movementSystem.isSneaking;

            // Calculate sound level based on speed and sneaking
            let soundLevel = playerSpeed / movementSystem.playerMaxSpeed;  // 0-1 range
            if (isSneaking) {
                soundLevel *= audioSystem.sneakVolumeMultiplier;  // Quieter when sneaking
            }

            // Effective hearing range based on sound level
            const effectiveRange = this.hearingRange * soundLevel;

            // Check if player is within hearing range
            const aiComponent = hunter.getComponent('AIHunter');

            // Debug: Log hearing info every second (throttled) - only if AI_DEBUG enabled
            if (AI_DEBUG && (!this._lastHearingLog || Date.now() - this._lastHearingLog > 1000)) {
                console.log(`?? Hearing Check: Distance=${distance.toFixed(2)}m, EffectiveRange=${effectiveRange.toFixed(2)}m, PlayerSpeed=${playerSpeed.toFixed(3)}, SoundLevel=${soundLevel.toFixed(3)}`);
                this._lastHearingLog = Date.now();
            }

            if (distance <= effectiveRange && playerSpeed > 0.01) {
                // AI hears player!
                if (aiComponent) {
                    // Update heard position unless we're reacting or racing to the can
                    if (!aiComponent.reactionState && (aiComponent.state === AI_STATES.PATROL || aiComponent.state === 'PATROL' ||
                        aiComponent.state === AI_STATES.INVESTIGATE)) {

                        // Update the position where we heard the player (always use latest)
                        aiComponent.lastHeardPosition = {
                            x: playerTransform.position.x,
                            z: playerTransform.position.z
                        };

                        // CORNER DETECTION: Determine what to look at (sound or nearest corner)
                        const staticColliders = this.getStaticColliders(gameState);
                        const aiPos = { x: aiTransform.position.x, z: aiTransform.position.z };
                        const soundPos = { x: playerTransform.position.x, z: playerTransform.position.z };

                        const lookAtResult = CornerDetection.determineLookAtTarget(aiPos, soundPos, staticColliders);

                        // INSTANT REACTION: Snap heading to face look-at target (corner or sound)
                        const dx2 = lookAtResult.lookAtPos.x - aiPos.x;
                        const dz2 = lookAtResult.lookAtPos.z - aiPos.z;
                        const angleToTarget = Math.atan2(dx2, dz2);

                        aiComponent.heading = angleToTarget;
                        transform.rotation.y = angleToTarget;  // Update visual rotation immediately

                        // If not already investigating, start investigation
                        if (aiComponent.state !== AI_STATES.INVESTIGATE) {
                            aiComponent.state = AI_STATES.INVESTIGATE;
                            aiComponent.investigateStartTime = Date.now();
                            aiComponent.investigateLookAroundTime = 0;
                            aiComponent.investigateStuckCount = 0;

                            const targetType = lookAtResult.isCorner ? 'CORNER' : 'SOUND';
                            const angleDeg = (angleToTarget * 180 / Math.PI).toFixed(0);
                            console.log(`?? AI HEARD PLAYER at ${distance.toFixed(2)}m! Looking at ${targetType} (angle ${angleDeg}�)`);
                            Utils.log(`?? AI state changed: ${aiComponent.state}`);
                        } else {
                            // Already investigating - update target and reset timer
                            aiComponent.investigateStartTime = Date.now();
                            if (AI_DEBUG) {
                                const targetType = lookAtResult.isCorner ? 'corner' : 'sound';
                                console.log(`?? AI updated target to ${targetType} at (${lookAtResult.lookAtPos.x.toFixed(1)}, ${lookAtResult.lookAtPos.z.toFixed(1)})`);
                            }
                        }
                    } else {
                        if (AI_DEBUG) {
                            console.log(`?? AI hears player but is in ${aiComponent.state} state (can't investigate)`);
                        }
                    }
                }
            }
        }

    updatePatrolBehavior(aiComponent, transform, movement, deltaTime, gameState) {
            const dt = deltaTime / 1000;  // Convert to seconds

            // Handle reaction sequence if player was spotted
            if (aiComponent.reactionState) {
                this.handleReaction(aiComponent, transform, deltaTime);
                return;  // Don't do normal patrol while reacting
            }

            // Check if stuck and need emergency unstuck
            if (ObstacleAvoidance.isStuckOnWall(aiComponent, transform, deltaTime)) {
                ObstacleAvoidance.unstuck(aiComponent);
                Utils.log('AI unstuck - rotated away from wall');
            }

            // Get obstacle avoidance steering and obstacle positions
            const staticColliders = this.getStaticColliders(gameState);
            const avoidance = ObstacleAvoidance.computeObstacleAvoidance(
                transform,
                aiComponent,
                staticColliders,
                3.0  // Look ahead 3.0 meters
            );

            // Extract obstacle positions for intelligent scanning
            const obstacles = staticColliders
                .filter(o => !o.collider.isWall)  // Ignore walls, focus on hiding spots
                .map(o => ({ position: { x: o.transform.position.x, z: o.transform.position.z } }));

            // Calculate recklessness factor (0 = cautious, 1 = fully reckless)
            const gameTime = Date.now() - this.gameStartTime;
            let recklessFactor = 0;
            if (gameTime > this.recklessStartTime) {
                const rampDuration = Math.max(1, this.recklessRampDuration);
                recklessFactor = Math.min((gameTime - this.recklessStartTime) / rampDuration, 1.0);
            }
            const recklessRadius = recklessFactor > 0
                ? BASE_PATROL_RADIUS + (this.recklessMaxRadius - BASE_PATROL_RADIUS) * recklessFactor
                : null;

            // Use CAN-GUARDING strategy (orbit can, check obstacles systematically)
            const canPosition = this.getCanPosition(gameState);
            const guardPatrol = CanGuardStrategy.computeCanGuardPatrol(
                aiComponent,
                transform,
                canPosition,
                dt,
                obstacles,  // Pass obstacles so AI knows where to look
                recklessRadius  // Pass reckless radius override
            );

            // Combine guard patrol + avoidance (balanced for smooth navigation)
            const combinedSteering = SteeringBehaviors.combineSteeringBehaviors([
                { steering: guardPatrol, weight: 1.0 },
                { steering: avoidance, weight: 3.0 }  // Avoidance 3x important (reduced from 5x to avoid corner sticking)
            ]);

            // Update heading (rotation)
            aiComponent.heading += combinedSteering.angular * dt;
            aiComponent.heading = SteeringBehaviors.normalizeAngle(aiComponent.heading);

            // Update velocity with acceleration
            aiComponent.velocity.x += combinedSteering.linear.x * dt;
            aiComponent.velocity.z += combinedSteering.linear.z * dt;

            // Clamp to max patrol speed
            const currentSpeed = Math.sqrt(
                aiComponent.velocity.x * aiComponent.velocity.x +
                aiComponent.velocity.z * aiComponent.velocity.z
            );

            if (currentSpeed > aiComponent.maxSpeed) {
                const scale = aiComponent.maxSpeed / currentSpeed;
                aiComponent.velocity.x *= scale;
                aiComponent.velocity.z *= scale;
            }

            // Apply friction (less friction for more responsive movement)
            const friction = 0.92;
            aiComponent.velocity.x *= friction;
            aiComponent.velocity.z *= friction;

            // Update transform (apply to entity)
            transform.velocity.x = aiComponent.velocity.x;
            transform.velocity.z = aiComponent.velocity.z;
            transform.rotation.y = aiComponent.heading;
        }

        updateInvestigateBehavior(aiComponent, transform, movement, deltaTime, gameState) {
            // Delegate to InvestigateBehavior module
            const newState = InvestigateBehavior.updateInvestigateBehavior(
                aiComponent,
                transform,
                movement,
                deltaTime,
                gameState,
                this.getStaticColliders.bind(this)
            );

            // Handle state transitions
            if (newState) {
                aiComponent.state = AI_STATES[newState];
            }
        }

        getCanPosition(gameState) {
            // Find can entity in game state
            for (const entity of gameState.entities.values()) {
                if (entity.getComponent('Interactable')) {
                    const interactable = entity.getComponent('Interactable');
                    if (interactable.type === 'can') {
                        const transform = entity.getComponent('Transform');
                        if (transform) {
                            return { x: transform.position.x, y: transform.position.y, z: transform.position.z };
                        }
                    }
                }
            }

            // Fallback: can is at center (0, 0.3, 0)
            return { x: 0, y: 0.3, z: 0 };
        }

        getStaticColliders(gameState) {
            const colliders = [];
            for (const entity of gameState.entities.values()) {
                const collider = entity.getComponent('Collider');
                const transform = entity.getComponent('Transform');

                if (collider && transform && collider.isStatic && collider.blockMovement) {
                    colliders.push({ collider, transform });
                }
            }
            return colliders;
        }

        handleReaction(aiComponent, transform, deltaTime) {
            const now = Date.now();
            const reactionElapsed = now - aiComponent.reactionStartTime;

            // Stop moving during reaction (freeze in surprise)
            transform.velocity.x = 0;
            transform.velocity.z = 0;
            aiComponent.velocity.x = 0;
            aiComponent.velocity.z = 0;

            // Jump animation at 200ms
            if (reactionElapsed >= aiComponent.reactionJumpTime && aiComponent.reactionState === 'SPOTTED') {
                // Trigger jump (quick up-down motion)
                transform.position.y += 0.3;  // Jump up
                aiComponent.reactionState = 'REACTING';  // Mark that we've jumped
                Utils.log('AI JUMPS in surprise!');
            }

            // Return to ground if we jumped
            if (transform.position.y > 0.5) {
                transform.position.y = Math.max(0.5, transform.position.y - deltaTime * 0.003);  // Fall back down
            }

            // After reaction time, start racing
            if (reactionElapsed >= aiComponent.reactionDuration) {
                aiComponent.state = AI_STATES.RACE;
                aiComponent.raceLockUntil = now + 2000;  // Lock in race for 2 seconds
                aiComponent.reactionState = null;
                aiComponent.currentSpeed = 0;  // Start from zero speed (will accelerate)
                Utils.log('AI reaction complete! RACE TO CAN BEGINS!');
            }
        }

        updateRaceBehavior(aiComponent, transform, movement, deltaTime, gameState) {
            const canPosition = this.getCanPosition(gameState);

            // Calculate direction to can
            const dx = canPosition.x - transform.position.x;
            const dz = canPosition.z - transform.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            // Check race lock timer - once racing, commit for 2 seconds
            const now = Date.now();
            if (!aiComponent.raceLockUntil) {
                aiComponent.raceLockUntil = now + 2000;  // Lock in for 2 seconds
            }

            // If lock expired and far from can, return to patrol (2x scale)
            if (now > aiComponent.raceLockUntil && distance > 6.0) {
                aiComponent.state = AI_STATES.PATROL;
                aiComponent.raceLockUntil = null;
                return;
            }

            // ALWAYS run directly to can (ignore player position entirely)
            const direction = Math.atan2(dx, dz);

            // Accelerate toward max hunting speed (takes ~1 second to reach full speed)
            const dt = deltaTime / 1000;
            aiComponent.currentSpeed = Math.min(
                aiComponent.maxSpeedHunting,
                aiComponent.currentSpeed + aiComponent.acceleration * dt
            );

            // Set velocity with current speed (gradual acceleration)
            transform.velocity.x = Math.sin(direction) * aiComponent.currentSpeed;
            transform.velocity.z = Math.cos(direction) * aiComponent.currentSpeed;

            // Align heading with movement
            aiComponent.heading = direction;
            transform.rotation.y = direction;

            // Win condition (2x scale)
            if (distance < 1.6) {
                Utils.log('AI reached can first! AI WINS the race!');
                this.triggerAIWins(gameState);
            }
        }

        triggerAIWins(gameState) {
            Utils.log('AI Won! Player was too slow to reach the can.');

            if (global.GameEngine && global.GameEngine.gameOver) {
                global.GameEngine.gameOver('ai_won');
            } else {
                alert('AI WON! The hunter reached the can before you could kick it. Game Over.');
            }
        }

        updateVision(hunter, visionCone, gameState) {
            visionCone.canSeePlayer = false;
            visionCone.targetSeen = false;

            const aiTransform = hunter.getComponent('Transform');
            if (!aiTransform) {
                return;
            }

            const aiComponent = hunter.getComponent('AIHunter');
            if (!aiComponent) {
                return;
            }

            // DYNAMIC VISION: Calculate vision parameters based on what AI is looking at
            const baseVision = {
                range: visionCone.baseRange || visionCone.range,
                angle: visionCone.baseAngle || visionCone.angle
            };

            // Store base values if not already stored
            if (!visionCone.baseRange) {
                visionCone.baseRange = visionCone.range;
                visionCone.baseAngle = visionCone.angle;
            }

            // Get scan target from guard state
            const scanTarget = DynamicVision.getScanTargetInfo(aiComponent, aiTransform);

            // Calculate dynamic vision parameters
            let dynamicVision;
            try {
                dynamicVision = DynamicVision.computeDynamicVision(
                    aiComponent,
                    aiTransform,
                    scanTarget,
                    baseVision
                );

                // Apply dynamic vision to cone
                DynamicVision.applyDynamicVision(visionCone, dynamicVision);
            } catch (error) {
                // Fallback to base vision if dynamic vision fails
                console.warn('Dynamic vision calculation failed, using base vision:', error);
                visionCone.range = baseVision.range;
                visionCone.angle = baseVision.angle;
            }

            const localPlayer = gameState.getLocalPlayer();
            if (!localPlayer) {
                return;
            }

            const playerTransform = localPlayer.getComponent('Transform');
            if (!playerTransform) {
                return;
            }

            const dx = playerTransform.position.x - aiTransform.position.x;
            const dz = playerTransform.position.z - aiTransform.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            // DEBUG: Log vision parameters occasionally
            if (Math.random() < 0.01) {  // 1% chance per frame
                console.log('[VISION DEBUG]', {
                    range: visionCone.range,
                    angle: visionCone.angle,
                    baseRange: visionCone.baseRange,
                    baseAngle: visionCone.baseAngle,
                    distanceToPlayer: distance.toFixed(2),
                    isFocusing: visionCone.isFocusing,
                    aiHeading: aiComponent.heading ? (aiComponent.heading * 180 / Math.PI).toFixed(1) : 'undefined',
                    transformRotation: (aiTransform.rotation.y * 180 / Math.PI).toFixed(1),
                    scanTarget: aiComponent.guardState?.scanTarget ? (aiComponent.guardState.scanTarget * 180 / Math.PI).toFixed(1) : 'none'
                });
            }

            // Use DYNAMIC range (changes based on what AI is looking at)
            if (distance > visionCone.range) {
                return;
            }

            const angleToPlayer = Math.atan2(dx, dz);
            const aiDirection = aiTransform.rotation.y;

            let angleDiff = angleToPlayer - aiDirection;
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

            // Use DYNAMIC angle (narrower when focused on distant targets)
            const visionAngleRad = (visionCone.angle * Math.PI) / 180;
            const halfVisionAngle = visionAngleRad / 2;

            if (Math.abs(angleDiff) <= halfVisionAngle) {
                const hasLineOfSight = this.checkLineOfSight(aiTransform.position, playerTransform.position, gameState);

                if (hasLineOfSight) {
                    visionCone.canSeePlayer = true;
                    visionCone.targetSeen = true;
                    visionCone.lastSeenPosition = {
                        x: playerTransform.position.x,
                        y: playerTransform.position.y,
                        z: playerTransform.position.z
                    };
                    visionCone.lastSeenTime = Date.now();

                    const aiComponent = hunter.getComponent('AIHunter');
                    if (aiComponent && aiComponent.state === AI_STATES.PATROL && !aiComponent.reactionState) {
                        // Start reaction sequence
                        aiComponent.reactionState = 'SPOTTED';
                        aiComponent.reactionStartTime = Date.now();
                        Utils.log('AI spotted player! Reacting...');
                    } else {
                        Utils.log('Player in vision cone but line of sight blocked by obstacle');
                    }
                }
            }
        }

        checkLineOfSight(aiPosition, playerPosition, gameState) {
            const obstacles = [];

            for (const entity of gameState.entities.values()) {
                const collider = entity.getComponent('Collider');
                const transform = entity.getComponent('Transform');

                if (collider && transform && collider.blockVision) {
                    obstacles.push({ collider, transform });
                }
            }

            const dx = playerPosition.x - aiPosition.x;
            const dz = playerPosition.z - aiPosition.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            const steps = Math.ceil(distance * 2);
            for (let i = 1; i < steps; i++) {
                const t = i / steps;
                const x = aiPosition.x + dx * t;
                const z = aiPosition.z + dz * t;
                const y = aiPosition.y;

                for (const obstacle of obstacles) {
                    const obstaclePos = obstacle.transform.position;
                    const collider = obstacle.collider;

                    if (collider.type === 'box') {
                        const halfWidth = collider.bounds.width / 2;
                        const halfDepth = collider.bounds.depth / 2;
                        const halfHeight = collider.bounds.height / 2;

                        if (
                            x >= obstaclePos.x - halfWidth &&
                            x <= obstaclePos.x + halfWidth &&
                            z >= obstaclePos.z - halfDepth &&
                            z <= obstaclePos.z + halfDepth &&
                            y >= obstaclePos.y - halfHeight &&
                            y <= obstaclePos.y + halfHeight
                        ) {
                            return false;
                        }
                    }
                }
            }

            return true;
        }

        checkShirtPull(hunter, gameState) {
            const aiTransform = hunter.getComponent('Transform');
            const aiMovement = hunter.getComponent('Movement');
            const aiComponent = hunter.getComponent('AIHunter');
            if (!aiTransform || !aiMovement || !aiComponent) {
                return;
            }

            const localPlayer = gameState.getLocalPlayer();
            if (!localPlayer) {
                return;
            }

            const playerTransform = localPlayer.getComponent('Transform');
            const playerInput = localPlayer.getComponent('PlayerInput');
            if (!playerTransform || !playerInput) {
                return;
            }

            // Calculate distance to player
            const dx = playerTransform.position.x - aiTransform.position.x;
            const dz = playerTransform.position.z - aiTransform.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            // Check if player is pressing space and is close enough to pull shirt
            const pullDistance = CONFIG.player.pullDistance || 2.0;
            const isPulling = playerInput.keys.action1 && distance <= pullDistance;

            // Apply slowdown if pulling
            if (isPulling) {
                const slowdownMultiplier = CONFIG.player.pullSlowdown || 0.5;
                aiMovement.speed = aiMovement.baseSpeed * slowdownMultiplier;

                const aiPhysics = hunter.getComponent('PhysicsBody');
                const playerPhysics = localPlayer.getComponent('PhysicsBody');

                if (aiPhysics && aiPhysics.body && playerPhysics && playerPhysics.body) {
                    const tetherStrength = (CONFIG.player && typeof CONFIG.player.pullTetherStrength === 'number') ? CONFIG.player.pullTetherStrength : 4.5;
                    const attraction = (CONFIG.player && typeof CONFIG.player.pullAttraction === 'number') ? CONFIG.player.pullAttraction : 6.0;

                    const playerVel = playerPhysics.body.velocity;
                    const safeDistance = Math.max(distance, 0.0001);
                    const towardPlayerX = (playerTransform.position.x - aiTransform.position.x) / safeDistance;
                    const towardPlayerZ = (playerTransform.position.z - aiTransform.position.z) / safeDistance;

                    const followVelX = playerVel.x * slowdownMultiplier + towardPlayerX * attraction + playerVel.x * tetherStrength * 0.1;
                    const followVelZ = playerVel.z * slowdownMultiplier + towardPlayerZ * attraction + playerVel.z * tetherStrength * 0.1;

                    aiPhysics.body.velocity.x = followVelX;
                    aiPhysics.body.velocity.z = followVelZ;
                    aiPhysics.body.velocity.y = 0;

                    if (aiTransform.velocity) {
                        const timeStep = (window.movementSystem && window.movementSystem.physicsTimeStep) ? window.movementSystem.physicsTimeStep : 1 / 60;
                        aiTransform.velocity.x = followVelX * timeStep;
                        aiTransform.velocity.z = followVelZ * timeStep;
                    }

                    aiPhysics.body.wakeUp();
                }

                if (!aiComponent.isBeingPulled) {
                    aiComponent.isBeingPulled = true;
                    Utils.log('[PULL] Player grabbed hunter\'s shirt');
                }

                if (AI_DEBUG) {
                    Utils.log(`?? Player pulling hunter's shirt! Speed: ${aiMovement.speed.toFixed(2)}`);
                }
            } else {
                if (aiComponent.isBeingPulled) {
                    aiComponent.isBeingPulled = false;
                    Utils.log('[PULL] Player released hunter');
                }
                aiMovement.speed = aiMovement.baseSpeed;
            }
        }

        checkPlayerCollision(hunter, gameState) {
            const aiTransform = hunter.getComponent('Transform');
            if (!aiTransform) {
                return;
            }

            const localPlayer = gameState.getLocalPlayer();
            if (!localPlayer) {
                return;
            }

            const playerTransform = localPlayer.getComponent('Transform');
            if (!playerTransform) {
                return;
            }

            // NO TAGGING - Player can't be caught!
            // The goal is for player to reach the can, not avoid being tagged
        }

        getHunters() {
            return Array.from(this.hunters);
        }

        testLineOfSight(gameState) {
            const hunters = Array.from(this.hunters);
            if (hunters.length === 0) {
                Utils.log('No AI hunters to test');
                return;
            }

            const hunter = hunters[0];
            const aiTransform = hunter.getComponent('Transform');
            const visionCone = hunter.getComponent('VisionCone');

            if (!aiTransform || !visionCone) {
                Utils.log('AI hunter missing required components for testing');
                return;
            }

            const localPlayer = gameState.getLocalPlayer();
            if (!localPlayer) {
                Utils.log('No local player found for testing');
                return;
            }

            const playerTransform = localPlayer.getComponent('Transform');
            if (!playerTransform) {
                Utils.log('Player missing transform component');
                return;
            }

            const hasLineOfSight = this.checkLineOfSight(aiTransform.position, playerTransform.position, gameState);
            const distance = Math.sqrt(
                Math.pow(playerTransform.position.x - aiTransform.position.x, 2) +
                Math.pow(playerTransform.position.z - aiTransform.position.z, 2)
            );

            Utils.log('AI Line-of-Sight Test:');
            Utils.log(`  AI Position: (${aiTransform.position.x.toFixed(2)}, ${aiTransform.position.z.toFixed(2)})`);
            Utils.log(`  Player Position: (${playerTransform.position.x.toFixed(2)}, ${playerTransform.position.z.toFixed(2)})`);
            Utils.log(`  Distance: ${distance.toFixed(2)}`);
            Utils.log(`  Line of Sight: ${hasLineOfSight ? 'CLEAR' : 'BLOCKED'}`);
            Utils.log(`  Vision Range: ${visionCone.range}`);
            Utils.log(`  Can See Player: ${visionCone.canSeePlayer ? 'YES' : 'NO'}`);

            return {
                distance,
                hasLineOfSight,
                canSeePlayer: visionCone.canSeePlayer,
                aiPosition: aiTransform.position,
                playerPosition: playerTransform.position
            };
        }

        destroy() {
            this.hunters.clear();
            Utils.log('AI system destroyed');
        }

        getVisionConeFromAI(aiComponent) {
            for (const hunter of this.hunters) {
                const component = hunter.getComponent('AIHunter');
                if (component === aiComponent) {
                    return hunter.getComponent('VisionCone');
                }
            }
            return null;
        }
    }

    // Export modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { AI_STATES, AISystem };
    } else {
        global.GameAI = global.GameAI || {};
        global.GameAI.AI_STATES = AI_STATES;
        global.GameAI.AISystem = AISystem;
        global.AI_STATES = AI_STATES;
        global.AISystem = AISystem;
    }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
