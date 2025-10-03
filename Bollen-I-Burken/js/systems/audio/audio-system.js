/* ==========================================
   BOLLEN I BURKEN - AUDIO SYSTEM
   Sound management and music
   ========================================== */

class AudioSystem extends System {
    constructor() {
        super('AudioSystem');

        this.audioContext = null;
        this.masterVolume = 0.7;
        this.soundEnabled = true;

        this.sounds = new Map();

        // Footstep tracking for alternating feet
        this.isLeftFoot = true;
        this.playerLastFootstepTime = 0;
        this.aiLastFootstepTime = new Map(); // Track per AI entity

        // Tweak-able settings
        this.stepInterval = 120;  // Single interval for all footsteps
        this.stepVolume = 0.20;
        this.sneakVolumeMultiplier = 0.3;  // 30% volume when sneaking
        this.sneakIntervalMultiplier = 1.8;  // 1.8x slower steps when sneaking

        this.initializeAudio();
        this.registerTweaks();
        Utils.log('Audio system initialized');
    }

    registerTweaks() {
        if (!window.TweakPanel) return;

        window.TweakPanel.addSetting('Audio', 'Step Interval', {
            type: 'range',
            min: 100,
            max: 600,
            step: 10,
            decimals: 0,
            label: 'Footstep Interval (ms)',
            getValue: () => this.stepInterval,
            setValue: (v) => this.stepInterval = v
        });

        window.TweakPanel.addSetting('Audio', 'Step Volume', {
            type: 'range',
            min: 0,
            max: 1,
            step: 0.05,
            decimals: 2,
            label: 'Footstep Volume',
            getValue: () => this.stepVolume,
            setValue: (v) => this.stepVolume = v
        });

        window.TweakPanel.addSetting('Audio', 'Sneak Volume', {
            type: 'range',
            min: 0.1,
            max: 1.0,
            step: 0.05,
            decimals: 2,
            label: 'Sneak Volume Multiplier',
            getValue: () => this.sneakVolumeMultiplier,
            setValue: (v) => this.sneakVolumeMultiplier = v
        });
    }

    async initializeAudio() {
        try {
            // Create Web Audio API context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.setValueAtTime(this.masterVolume, this.audioContext.currentTime);
            this.masterGain.connect(this.audioContext.destination);

            // Create gain node for sound effects
            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.gain.setValueAtTime(0.8, this.audioContext.currentTime);
            this.sfxGain.connect(this.masterGain);

            // Handle audio context state
            if (this.audioContext.state === 'suspended') {
                // Web browsers require user interaction to start audio
                this.setupUserInteractionHandler();
            }

            // Load external sound files
            await this.loadExternalSounds();

            // Note: Old procedural sounds disabled - using external files now
            // this.generateProcedualSounds();
            Utils.log('Web Audio API initialized');

        } catch (error) {
            Utils.warn('Web Audio API not available, falling back to HTML5 audio', error);
            this.initializeFallbackAudio();
        }
    }

    async loadExternalSounds() {
        if (!this.audioContext) return;

        const soundFiles = [
            { name: 'footstep_left', path: 'assets/sounds/kenney_impact-sounds/Audio/footstep_concrete_000.ogg' },
            { name: 'footstep_right', path: 'assets/sounds/kenney_impact-sounds/Audio/footstep_concrete_003.ogg' }
        ];

        for (const sound of soundFiles) {
            try {
                const buffer = await this.loadSoundFile(sound.path);
                this.sounds.set(sound.name, buffer);
                Utils.log(`Loaded sound: ${sound.name}`);
            } catch (error) {
                Utils.warn(`Failed to load sound: ${sound.name}`, error);
            }
        }
    }

    async loadSoundFile(path) {
        try {
            Utils.log(`Loading sound file: ${path}`);
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            return audioBuffer;
        } catch (error) {
            Utils.error(`Failed to load sound file: ${path}`, error);
            throw error;
        }
    }

    setupUserInteractionHandler() {
        const startAudio = () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    Utils.log('Audio context resumed');
                });
            }
            // Remove listeners after first interaction
            document.removeEventListener('click', startAudio);
            document.removeEventListener('keydown', startAudio);
            document.removeEventListener('touchstart', startAudio);
        };

        document.addEventListener('click', startAudio);
        document.addEventListener('keydown', startAudio);
        document.addEventListener('touchstart', startAudio);
    }

    initializeFallbackAudio() {
        // Fallback to HTML5 audio elements
        this.audioContext = null;
        this.fallbackMode = true;
        Utils.log('Using HTML5 audio fallback');
    }

    playSound(soundName, volume = 1.0, pitch = 1.0) {
        if (!this.soundEnabled) return;

        if (this.audioContext && this.sounds.has(soundName)) {
            this.playWebAudioSound(soundName, volume, pitch);
        } else if (this.fallbackMode) {
            this.playFallbackSound(soundName, volume);
        }
    }

    playWebAudioSound(soundName, volume, pitch) {
        const buffer = this.sounds.get(soundName);
        if (!buffer) return;

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        source.buffer = buffer;
        source.playbackRate.setValueAtTime(pitch, this.audioContext.currentTime);

        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);

        source.connect(gainNode);
        gainNode.connect(this.sfxGain);

        source.start();

        // Clean up after sound finishes
        source.onended = () => {
            source.disconnect();
            gainNode.disconnect();
        };
    }

    playFallbackSound(soundName, volume) {
        // Create HTML5 audio element for fallback
        const audio = new Audio();
        audio.volume = volume * this.masterVolume;

        // Generate data URL for simple beep (placeholder)
        if (soundName === 'click') {
            audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmcdCjiA0+/FeSMFJIzS9diKOAYTY67k5Z9NEAxtL+fwr2EaBkOX2/LNeSsFJHfH8N6QPwkUXrTp66hVFApGn+DyvmcdCjiA0+/FeSMFJI7U9tiIOAUVY67k5Z9NEAxtL+fwr2EaBkOX2/LNeSsFJHfH8N6QPwkUXrTp66hVFApGn+DyvmcdCjiA0+/FeSMFJILM89OKOgUVXq3d7aFOFAxfqeXuuGwdBkCU1vLOeSsFJHTH8N6QPwkUXrTp66hVFApGn+DyvmcdCjiA0+/FeSMFJIzS9diIOAYTY67k5Z9NEAxtL+fwr2EaBkOX2/LNeSsFJHfH8N6QPwkUXrTp66hVFApGn+DyvmcdCjiA0+/FeSMFJILM89OKOgUVXq3d7aFOFAxfqeXuuGwdBkCU1vLOeSsFJHTH8N6QPwkUXrTp66hVFApGn+DyvmcdCjiA0+/FeSMFJIzS9diIOAYTY67k5Z9NEAxtL+fwr2EaBkOX2/LNeSsFJHfH8N6QPwkUXrTp66hVFApGn+DyvmcdCjiA0+/FeSMFJILM89OKOgUVXq3d7aFOFAxfqeXuuGwdBkCU1vLOeSsFJHTH8N6QPwkUXrTp66hVFApGn+DyvmcdCjiA0+/FeSMFJIzS9diIOAYTY67k5Z9NEAxtL+fwr2EaBkOX2/LNeSsFJHfH8N6QPwkUXrTp66hVFApGn+DyvmcdCjiA0+/FeSMFJILM89OKOgUVXq3d7aFOFAxfqeXuuGwdBkCU1vLOeSsFJHTH8N6QPwkUXrTp66hVFA==';
        }

        audio.play().catch(error => {
            Utils.warn('Could not play fallback sound', error);
        });
    }

    playFootstep(volume = 0.5, pitch = 1.0) {
        if (!this.sounds.has('footstep_left') || !this.sounds.has('footstep_right')) {
            Utils.warn('Footstep sounds not loaded');
            return;
        }

        const soundName = this.isLeftFoot ? 'footstep_left' : 'footstep_right';
        this.playSound(soundName, volume, pitch);
        this.isLeftFoot = !this.isLeftFoot; // Alternate feet
    }

    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));

        if (this.audioContext && this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.masterVolume, this.audioContext.currentTime);
        }

        Utils.log(`Master volume set to ${this.masterVolume}`);
    }

    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
        Utils.log(`Sound effects ${enabled ? 'enabled' : 'disabled'}`);
    }

    update(gameState) {
        // Play footsteps for moving players
        this.updateFootsteps(gameState);
    }

    updateFootsteps(gameState) {
        // Player footsteps
        const localPlayer = gameState.getLocalPlayer();
        if (localPlayer) {
            const input = localPlayer.getComponent('PlayerInput');
            const transform = localPlayer.getComponent('Transform');

            if (input && transform && input.hasInput()) {
                const velocity = Utils.vectorLength(transform.velocity);
                if (velocity > 0.01) {
                    const currentTime = Utils.now();

                    // Get movement system to check current speed (acceleration state)
                    const movementSystem = window.movementSystem;
                    let speedFactor = 1.0;
                    let isSneaking = false;

                    if (movementSystem) {
                        // Use actual current speed which reflects acceleration
                        const currentSpeed = movementSystem.playerCurrentSpeed;
                        const maxSpeed = movementSystem.playerMaxSpeed;
                        speedFactor = Math.max(0.5, Math.min(currentSpeed / maxSpeed, 2.0));
                        isSneaking = movementSystem.isSneaking || false;
                    } else {
                        // Fallback to velocity-based
                        speedFactor = Math.min(velocity / 0.15, 2.0);
                    }

                    let adjustedInterval = this.stepInterval / speedFactor;
                    let volume = this.stepVolume;
                    let pitch = 1.0;

                    if (isSneaking) {
                        adjustedInterval *= this.sneakIntervalMultiplier;  // Slower steps
                        volume *= this.sneakVolumeMultiplier;  // Quieter
                        pitch = 0.8;  // Lower pitch for sneaking
                    }

                    if (currentTime - this.playerLastFootstepTime > adjustedInterval) {
                        this.playFootstep(volume, pitch);
                        this.playerLastFootstepTime = currentTime;
                    }
                }
            }
        }

        // AI footsteps
        for (const entity of gameState.entities.values()) {
            if (entity.hasComponent('AIHunter')) {
                this.updateAIFootsteps(entity);
            }
        }
    }

    updateAIFootsteps(aiEntity) {
        const transform = aiEntity.getComponent('Transform');
        if (!transform) return;

        const velocity = Utils.vectorLength(transform.velocity);
        if (velocity > 0.05) {
            const currentTime = Utils.now();

            // Adjust step interval based on velocity
            const speedFactor = Math.min(velocity / 0.20, 2.0);
            const adjustedInterval = this.stepInterval / speedFactor;

            const lastStepTime = this.aiLastFootstepTime.get(aiEntity.id) || 0;

            if (currentTime - lastStepTime > adjustedInterval) {
                this.playFootstep(this.stepVolume * 0.8, 0.9);  // AI slightly quieter and lower pitch
                this.aiLastFootstepTime.set(aiEntity.id, currentTime);
            }
        }
    }

    getAudioSettings() {
        return {
            masterVolume: this.masterVolume,
            soundEnabled: this.soundEnabled,
            audioContext: !!this.audioContext,
            fallbackMode: this.fallbackMode,
            loadedSounds: Array.from(this.sounds.keys())
        };
    }

    destroy() {
        if (this.audioContext) {
            this.audioContext.close();
        }

        Utils.log('Audio system destroyed');
    }
}

// Export for module systems or global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioSystem };
} else {
    window.AudioSystem = AudioSystem;
}