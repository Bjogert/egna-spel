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
        this.musicEnabled = true;

        this.sounds = new Map();
        this.music = new Map();
        this.currentMusic = null;

        this.initializeAudio();
        Utils.log('Audio system initialized');
    }

    async initializeAudio() {
        try {
            // Create Web Audio API context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.setValueAtTime(this.masterVolume, this.audioContext.currentTime);
            this.masterGain.connect(this.audioContext.destination);

            // Create separate gain nodes for different audio types
            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.gain.setValueAtTime(0.8, this.audioContext.currentTime);
            this.sfxGain.connect(this.masterGain);

            this.musicGain = this.audioContext.createGain();
            this.musicGain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
            this.musicGain.connect(this.masterGain);

            // Handle audio context state
            if (this.audioContext.state === 'suspended') {
                // Web browsers require user interaction to start audio
                this.setupUserInteractionHandler();
            }

            this.generateProcedualSounds();
            Utils.log('Web Audio API initialized');

        } catch (error) {
            Utils.warn('Web Audio API not available, falling back to HTML5 audio', error);
            this.initializeFallbackAudio();
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

    generateProcedualSounds() {
        if (!this.audioContext) return;

        // Generate footstep sound
        this.createFootstepSound();

        // Generate UI sounds
        this.createUISound('click', 800, 0.1, 'square');
        this.createUISound('hover', 600, 0.05, 'sine');
        this.createUISound('error', 200, 0.3, 'sawtooth');

        // Generate ambient sounds
        this.createAmbientSound();
    }

    createFootstepSound() {
        if (!this.audioContext) return;

        const duration = 0.15;
        const buffer = this.audioContext.createBuffer(1, duration * this.audioContext.sampleRate, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        // Generate noise-based footstep sound
        for (let i = 0; i < buffer.length; i++) {
            const noise = (Math.random() * 2 - 1) * 0.3;
            const decay = Math.pow(1 - (i / buffer.length), 2);
            data[i] = noise * decay;
        }

        this.sounds.set('footstep', buffer);
    }

    createUISound(name, frequency, volume, waveType = 'sine') {
        if (!this.audioContext) return;

        const duration = 0.1;
        const buffer = this.audioContext.createBuffer(1, duration * this.audioContext.sampleRate, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const time = i / this.audioContext.sampleRate;
            const decay = Math.pow(1 - (i / buffer.length), 2);

            let sample = 0;
            switch (waveType) {
                case 'sine':
                    sample = Math.sin(2 * Math.PI * frequency * time);
                    break;
                case 'square':
                    sample = Math.sin(2 * Math.PI * frequency * time) > 0 ? 1 : -1;
                    break;
                case 'sawtooth':
                    sample = 2 * (time * frequency - Math.floor(time * frequency + 0.5));
                    break;
            }

            data[i] = sample * volume * decay;
        }

        this.sounds.set(name, buffer);
    }

    createAmbientSound() {
        if (!this.audioContext) return;

        // Create a longer ambient loop
        const duration = 4; // 4 seconds
        const buffer = this.audioContext.createBuffer(2, duration * this.audioContext.sampleRate, this.audioContext.sampleRate);

        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const data = buffer.getChannelData(channel);

            for (let i = 0; i < buffer.length; i++) {
                const time = i / this.audioContext.sampleRate;

                // Create layered ambient sound
                const low = Math.sin(2 * Math.PI * 60 * time) * 0.1;
                const mid = Math.sin(2 * Math.PI * 120 * time) * 0.05;
                const high = (Math.random() * 2 - 1) * 0.02;

                data[i] = low + mid + high;
            }
        }

        this.sounds.set('ambient', buffer);
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

    playFootstep() {
        // Randomize footstep sounds slightly
        const volume = Utils.randomFloat(0.3, 0.6);
        const pitch = Utils.randomFloat(0.8, 1.2);
        this.playSound('footstep', volume, pitch);
    }

    playUIClick() {
        this.playSound('click', 0.5);
    }

    playUIHover() {
        this.playSound('hover', 0.3);
    }

    playError() {
        this.playSound('error', 0.8);
    }

    startAmbientMusic() {
        if (!this.musicEnabled || !this.audioContext) return;

        this.stopMusic();

        // Create oscillator-based ambient music
        this.createProceduralMusic();
    }

    createProceduralMusic() {
        if (!this.audioContext) return;

        // Create multiple oscillators for layered ambient music
        const oscillators = [];
        const frequencies = [55, 82.4, 110, 164.8]; // A1, E2, A2, E3

        frequencies.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.type = index % 2 === 0 ? 'sine' : 'triangle';
            oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);

            // Set volume based on frequency (lower = louder)
            const volume = 0.1 / (index + 1);
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);

            // Add subtle vibrato
            const lfo = this.audioContext.createOscillator();
            const lfoGain = this.audioContext.createGain();

            lfo.frequency.setValueAtTime(1 + Math.random() * 2, this.audioContext.currentTime);
            lfoGain.gain.setValueAtTime(2, this.audioContext.currentTime);

            lfo.connect(lfoGain);
            lfoGain.connect(oscillator.frequency);

            oscillator.connect(gainNode);
            gainNode.connect(this.musicGain);

            oscillator.start();
            lfo.start();

            oscillators.push({ oscillator, gainNode, lfo, lfoGain });
        });

        this.currentMusic = oscillators;
    }

    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.forEach(({ oscillator, gainNode, lfo, lfoGain }) => {
                try {
                    oscillator.stop();
                    lfo.stop();
                    oscillator.disconnect();
                    gainNode.disconnect();
                    lfo.disconnect();
                    lfoGain.disconnect();
                } catch (error) {
                    // Ignore errors when stopping already stopped oscillators
                }
            });
            this.currentMusic = null;
        }
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

    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;

        if (!enabled) {
            this.stopMusic();
        } else {
            this.startAmbientMusic();
        }

        Utils.log(`Music ${enabled ? 'enabled' : 'disabled'}`);
    }

    update(gameState) {
        // Update audio based on game state
        if (gameState.gamePhase === GAME_STATES.PLAYING && this.musicEnabled && !this.currentMusic) {
            this.startAmbientMusic();
        } else if (gameState.gamePhase !== GAME_STATES.PLAYING && this.currentMusic) {
            this.stopMusic();
        }

        // Play footsteps for moving players
        this.updateFootsteps(gameState);
    }

    updateFootsteps(gameState) {
        const localPlayer = gameState.getLocalPlayer();
        if (!localPlayer) return;

        const input = localPlayer.getComponent('PlayerInput');
        const transform = localPlayer.getComponent('Transform');

        if (input && transform && input.hasInput()) {
            const velocity = Utils.vectorLength(transform.velocity);
            if (velocity > 0.01) {
                // Play footsteps at regular intervals when moving
                const currentTime = Utils.now();
                const stepInterval = 300; // milliseconds between steps

                if (!this.lastFootstepTime || currentTime - this.lastFootstepTime > stepInterval) {
                    this.playFootstep();
                    this.lastFootstepTime = currentTime;
                }
            }
        }
    }

    getAudioSettings() {
        return {
            masterVolume: this.masterVolume,
            soundEnabled: this.soundEnabled,
            musicEnabled: this.musicEnabled,
            audioContext: !!this.audioContext,
            fallbackMode: this.fallbackMode
        };
    }

    destroy() {
        this.stopMusic();

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
    window.GameAudio = { AudioSystem };
}