/**
 * FANTASTIC TETRIS - AUDIO MANAGER
 * Advanced audio system with Web Audio API, dynamic music, and spatial audio
 */

/**
 * Audio file definitions
 */
const AUDIO_FILES = {
  music: {
    background: {
      src: ['assets/sounds/background-music.mp3', 'assets/sounds/background-music.ogg'],
      loop: true,
      volume: 0.5,
      fadeIn: true
    },
    gameOver: {
      src: ['assets/sounds/game-over.mp3'],
      loop: false,
      volume: 0.7
    }
  },

  sfx: {
    pieceDrop: {
      src: ['assets/sounds/piece-drop.mp3'],
      volume: 0.6,
      polyphony: 3
    },
    pieceRotate: {
      src: ['assets/sounds/rotate.mp3'],
      volume: 0.4,
      polyphony: 2
    },
    pieceMove: {
      src: ['assets/sounds/move.mp3'],
      volume: 0.3,
      polyphony: 1
    },
    lineClear: {
      src: ['assets/sounds/line-clear.mp3'],
      volume: 0.8,
      polyphony: 1
    },
    tetris: {
      src: ['assets/sounds/tetris.mp3'],
      volume: 1.0,
      polyphony: 1
    },
    levelUp: {
      src: ['assets/sounds/level-up.mp3'],
      volume: 0.9,
      polyphony: 1
    },
    hold: {
      src: ['assets/sounds/hold.mp3'],
      volume: 0.5,
      polyphony: 1
    },
    warning: {
      src: ['assets/sounds/warning.mp3'],
      volume: 0.7,
      polyphony: 1
    }
  }
};

/**
 * Procedural music configuration
 */
const MUSIC_CONFIG = {
  baseFrequency: 220, // A3
  scale: [0, 2, 4, 5, 7, 9, 11], // Major scale intervals
  chordProgressions: [
    [0, 3, 5, 0], // I-IV-V-I
    [0, 5, 3, 0], // I-V-IV-I
    [0, 2, 3, 0], // I-iii-IV-I
    [5, 3, 0, 0]  // V-IV-I-I
  ],
  tempos: {
    slow: 60,
    normal: 90,
    fast: 120,
    intense: 150
  }
};

export class AudioManager {
  constructor(settings = {}) {
    this.settings = {
      masterVolume: 0.7,
      musicVolume: 0.5,
      sfxVolume: 0.8,
      enableMusic: true,
      enableSFX: true,
      enableSpatialAudio: true,
      enableProceduralMusic: false,
      ...settings
    };

    // Web Audio API context
    this.audioContext = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;

    // Audio buffers and sources
    this.audioBuffers = new Map();
    this.activeSources = new Map();
    this.soundInstances = new Map();

    // Music system
    this.currentMusic = null;
    this.musicState = {
      isPlaying: false,
      isPaused: false,
      currentTrack: null,
      fadeDuration: 2000
    };

    // Procedural music
    this.proceduralMusic = {
      enabled: false,
      oscillators: [],
      currentChord: 0,
      tempo: 90,
      nextNoteTime: 0,
      isPlaying: false
    };

    // Audio analysis
    this.analyser = null;
    this.frequencyData = null;
    this.timeDomainData = null;

    // Performance tracking
    this.stats = {
      soundsPlayed: 0,
      musicStartTime: 0,
      audioLatency: 0,
      bufferUnderruns: 0
    };

    this.initialize();
  }

  /**
   * Initialize audio system
   */
  async initialize() {
    try {
      await this.initializeWebAudio();
      await this.loadAudioAssets();
      this.setupAnalyser();

      console.log('🔊 Audio Manager initialized');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      this.handleAudioError(error);
    }
  }

  /**
   * Initialize Web Audio API
   */
  async initializeWebAudio() {
    // Create audio context
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Resume context if needed (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Create gain nodes
    this.masterGain = this.audioContext.createGain();
    this.musicGain = this.audioContext.createGain();
    this.sfxGain = this.audioContext.createGain();

    // Connect gain nodes
    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.audioContext.destination);

    // Set initial volumes
    this.updateVolumes();
  }

  /**
   * Load all audio assets
   */
  async loadAudioAssets() {
    const loadPromises = [];

    // Load music files
    Object.entries(AUDIO_FILES.music).forEach(([name, config]) => {
      loadPromises.push(this.loadAudioFile(name, config, 'music'));
    });

    // Load SFX files
    Object.entries(AUDIO_FILES.sfx).forEach(([name, config]) => {
      loadPromises.push(this.loadAudioFile(name, config, 'sfx'));
    });

    await Promise.all(loadPromises);
    console.log('🎵 Audio assets loaded');
  }

  /**
   * Load individual audio file
   */
  async loadAudioFile(name, config, type) {
    const sources = Array.isArray(config.src) ? config.src : [config.src];

    for (const src of sources) {
      try {
        const response = await fetch(src);
        if (!response.ok) continue;

        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

        this.audioBuffers.set(name, {
          buffer: audioBuffer,
          config: config,
          type: type
        });

        console.log(`🎵 Loaded audio: ${name}`);
        return; // Success, break out of loop
      } catch (error) {
        console.warn(`Failed to load audio source: ${src}`, error);
      }
    }

    // If we get here, all sources failed
    console.warn(`Failed to load any source for audio: ${name}`);
  }

  /**
   * Setup audio analyser for visualizations
   */
  setupAnalyser() {
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;

    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeDomainData = new Uint8Array(this.analyser.fftSize);

    // Connect to master gain for analysis
    this.masterGain.connect(this.analyser);
  }

  /**
   * Update volume levels
   */
  updateVolumes() {
    if (this.masterGain) {
      this.masterGain.gain.value = this.settings.masterVolume;
    }

    if (this.musicGain) {
      this.musicGain.gain.value = this.settings.musicVolume;
    }

    if (this.sfxGain) {
      this.sfxGain.gain.value = this.settings.sfxVolume;
    }
  }

  /**
   * Play sound effect
   */
  playSFX(name, options = {}) {
    if (!this.settings.enableSFX || !this.audioBuffers.has(name)) {
      return null;
    }

    const audioData = this.audioBuffers.get(name);
    const config = { ...audioData.config, ...options };

    // Check polyphony limits
    if (config.polyphony && this.getActiveInstanceCount(name) >= config.polyphony) {
      this.stopOldestInstance(name);
    }

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = audioData.buffer;

    // Configure gain
    gainNode.gain.value = config.volume || 1.0;

    // Spatial audio (if enabled and position provided)
    if (this.settings.enableSpatialAudio && config.position) {
      const panner = this.audioContext.createStereoPanner();
      panner.pan.value = this.calculatePanning(config.position);

      source.connect(gainNode);
      gainNode.connect(panner);
      panner.connect(this.sfxGain);
    } else {
      source.connect(gainNode);
      gainNode.connect(this.sfxGain);
    }

    // Start playback
    const startTime = this.audioContext.currentTime + (config.delay || 0);
    source.start(startTime);

    // Track active instance
    const instanceId = `${name}_${Date.now()}_${Math.random()}`;
    this.soundInstances.set(instanceId, {
      source,
      gainNode,
      name,
      startTime: Date.now()
    });

    // Cleanup when finished
    source.onended = () => {
      this.soundInstances.delete(instanceId);
    };

    this.stats.soundsPlayed++;

    return {
      stop: () => source.stop(),
      setVolume: (volume) => { gainNode.gain.value = volume; },
      setPan: (pan) => {
        if (source.panner) {
          source.panner.pan.value = pan;
        }
      }
    };
  }

  /**
   * Play background music
   */
  async playBackgroundMusic(trackName = 'background') {
    if (!this.settings.enableMusic || !this.audioBuffers.has(trackName)) {
      return;
    }

    // Stop current music
    this.stopBackgroundMusic();

    const audioData = this.audioBuffers.get(trackName);
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = audioData.buffer;
    source.loop = audioData.config.loop;

    // Fade in if configured
    if (audioData.config.fadeIn) {
      gainNode.gain.value = 0;
      gainNode.gain.linearRampToValueAtTime(
        audioData.config.volume,
        this.audioContext.currentTime + this.musicState.fadeDuration / 1000
      );
    } else {
      gainNode.gain.value = audioData.config.volume;
    }

    source.connect(gainNode);
    gainNode.connect(this.musicGain);

    source.start();

    this.currentMusic = {
      source,
      gainNode,
      trackName,
      startTime: Date.now()
    };

    this.musicState.isPlaying = true;
    this.musicState.isPaused = false;
    this.musicState.currentTrack = trackName;
    this.stats.musicStartTime = Date.now();

    console.log(`🎵 Playing music: ${trackName}`);
  }

  /**
   * Stop background music
   */
  stopBackgroundMusic(fadeOut = true) {
    if (!this.currentMusic) return;

    if (fadeOut) {
      // Fade out
      this.currentMusic.gainNode.gain.linearRampToValueAtTime(
        0,
        this.audioContext.currentTime + this.musicState.fadeDuration / 1000
      );

      setTimeout(() => {
        if (this.currentMusic) {
          this.currentMusic.source.stop();
          this.currentMusic = null;
        }
      }, this.musicState.fadeDuration);
    } else {
      this.currentMusic.source.stop();
      this.currentMusic = null;
    }

    this.musicState.isPlaying = false;
    this.musicState.isPaused = false;
  }

  /**
   * Pause background music
   */
  pauseBackgroundMusic() {
    if (this.currentMusic && this.musicState.isPlaying) {
      this.currentMusic.source.stop();
      this.musicState.isPaused = true;
      this.musicState.isPlaying = false;
    }
  }

  /**
   * Resume background music
   */
  resumeBackgroundMusic() {
    if (this.musicState.isPaused && this.musicState.currentTrack) {
      this.playBackgroundMusic(this.musicState.currentTrack);
    }
  }

  /**
   * Game-specific sound methods
   */

  playPieceDropSound() {
    this.playSFX('pieceDrop');
  }

  playPieceRotateSound() {
    this.playSFX('pieceRotate');
  }

  playPieceMoveSound() {
    this.playSFX('pieceMove');
  }

  playLineClearSound() {
    this.playSFX('lineClear');
  }

  playTetrisSound() {
    this.playSFX('tetris');
  }

  playLevelUpSound() {
    this.playSFX('levelUp');
  }

  playHoldSound() {
    this.playSFX('hold');
  }

  playWarningSound() {
    this.playSFX('warning');
  }

  playGameOverSound() {
    this.stopBackgroundMusic();
    this.playBackgroundMusic('gameOver');
  }

  /**
   * Procedural music system
   */
  startProceduralMusic() {
    if (!this.settings.enableProceduralMusic || this.proceduralMusic.isPlaying) {
      return;
    }

    this.proceduralMusic.isPlaying = true;
    this.proceduralMusic.nextNoteTime = this.audioContext.currentTime;

    this.scheduleNextNote();
    console.log('🎼 Procedural music started');
  }

  stopProceduralMusic() {
    this.proceduralMusic.isPlaying = false;

    // Stop all oscillators
    this.proceduralMusic.oscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Oscillator may already be stopped
      }
    });

    this.proceduralMusic.oscillators = [];
  }

  scheduleNextNote() {
    if (!this.proceduralMusic.isPlaying) return;

    const beatsPerMinute = this.proceduralMusic.tempo;
    const secondsPerBeat = 60.0 / beatsPerMinute;

    // Schedule next beat
    while (this.proceduralMusic.nextNoteTime < this.audioContext.currentTime + 0.1) {
      this.playProceduralNote(this.proceduralMusic.nextNoteTime);
      this.proceduralMusic.nextNoteTime += secondsPerBeat;
    }

    // Schedule next call
    setTimeout(() => this.scheduleNextNote(), 25);
  }

  playProceduralNote(time) {
    const progression = MUSIC_CONFIG.chordProgressions[0];
    const chordIndex = this.proceduralMusic.currentChord % progression.length;
    const rootNote = progression[chordIndex];

    // Play bass note
    this.createProceduralTone(
      this.getFrequency(rootNote - 12), // One octave lower
      time,
      0.5, // Duration
      0.3, // Volume
      'sawtooth'
    );

    // Play chord tones
    const chordTones = [0, 2, 4]; // Major triad
    chordTones.forEach((interval, index) => {
      const frequency = this.getFrequency(rootNote + interval);
      this.createProceduralTone(
        frequency,
        time + index * 0.1,
        0.4,
        0.1,
        'sine'
      );
    });

    this.proceduralMusic.currentChord++;
  }

  createProceduralTone(frequency, startTime, duration, volume, waveType = 'sine') {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filterNode = this.audioContext.createBiquadFilter();

    oscillator.type = waveType;
    oscillator.frequency.value = frequency;

    filterNode.type = 'lowpass';
    filterNode.frequency.value = frequency * 2;

    gainNode.gain.value = 0;
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(this.musicGain);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);

    this.proceduralMusic.oscillators.push(oscillator);

    // Cleanup
    oscillator.onended = () => {
      const index = this.proceduralMusic.oscillators.indexOf(oscillator);
      if (index > -1) {
        this.proceduralMusic.oscillators.splice(index, 1);
      }
    };
  }

  getFrequency(noteIndex) {
    const scale = MUSIC_CONFIG.scale;
    const octave = Math.floor(noteIndex / scale.length);
    const scaleIndex = noteIndex % scale.length;
    const semitones = octave * 12 + scale[scaleIndex];

    return MUSIC_CONFIG.baseFrequency * Math.pow(2, semitones / 12);
  }

  /**
   * Audio analysis and visualization
   */
  getFrequencyData() {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.frequencyData);
      return this.frequencyData;
    }
    return null;
  }

  getTimeDomainData() {
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(this.timeDomainData);
      return this.timeDomainData;
    }
    return null;
  }

  getAudioLevel() {
    const frequencyData = this.getFrequencyData();
    if (!frequencyData) return 0;

    let sum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      sum += frequencyData[i];
    }

    return sum / frequencyData.length / 255;
  }

  /**
   * Utility methods
   */

  calculatePanning(position) {
    // Convert game position to stereo panning (-1 to 1)
    // Assuming position.x is between 0 and game width
    const gameWidth = 10; // Tetris board width
    return (position.x / gameWidth) * 2 - 1;
  }

  getActiveInstanceCount(soundName) {
    let count = 0;
    this.soundInstances.forEach(instance => {
      if (instance.name === soundName) count++;
    });
    return count;
  }

  stopOldestInstance(soundName) {
    let oldestTime = Date.now();
    let oldestKey = null;

    this.soundInstances.forEach((instance, key) => {
      if (instance.name === soundName && instance.startTime < oldestTime) {
        oldestTime = instance.startTime;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      const instance = this.soundInstances.get(oldestKey);
      instance.source.stop();
      this.soundInstances.delete(oldestKey);
    }
  }

  handleAudioError(error) {
    console.warn('Audio system error:', error);

    // Fallback to HTML5 audio if Web Audio API fails
    this.settings.enableSpatialAudio = false;
    this.settings.enableProceduralMusic = false;
  }

  /**
   * Settings and configuration
   */

  setMasterVolume(volume) {
    this.settings.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  setMusicVolume(volume) {
    this.settings.musicVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  setSFXVolume(volume) {
    this.settings.sfxVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  toggleMusic() {
    this.settings.enableMusic = !this.settings.enableMusic;

    if (!this.settings.enableMusic) {
      this.stopBackgroundMusic();
    }
  }

  toggleSFX() {
    this.settings.enableSFX = !this.settings.enableSFX;
  }

  adaptToGameState(gameState) {
    // Adjust music tempo based on game level
    if (this.proceduralMusic.isPlaying) {
      const baseTempo = MUSIC_CONFIG.tempos.normal;
      const levelMultiplier = 1 + (gameState.level - 1) * 0.1;
      this.proceduralMusic.tempo = Math.min(baseTempo * levelMultiplier, MUSIC_CONFIG.tempos.intense);
    }

    // Play warning sounds when board gets full
    if (gameState.board && gameState.board.isTopBlocked()) {
      this.playWarningSound();
    }
  }

  /**
   * Statistics and debugging
   */
  getStatistics() {
    return {
      ...this.stats,
      activeInstances: this.soundInstances.size,
      musicPlaying: this.musicState.isPlaying,
      audioContextState: this.audioContext?.state,
      bufferCount: this.audioBuffers.size,
      proceduralMusicActive: this.proceduralMusic.isPlaying
    };
  }

  /**
   * Export settings
   */
  toJSON() {
    return {
      settings: this.settings,
      musicState: {
        currentTrack: this.musicState.currentTrack,
        isPaused: this.musicState.isPaused
      }
    };
  }

  /**
   * Import settings
   */
  fromJSON(data) {
    if (data.settings) {
      Object.assign(this.settings, data.settings);
      this.updateVolumes();
    }

    if (data.musicState && data.musicState.currentTrack && data.musicState.isPaused) {
      this.musicState.currentTrack = data.musicState.currentTrack;
      this.musicState.isPaused = data.musicState.isPaused;
    }
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    // Stop all audio
    this.stopBackgroundMusic(false);
    this.stopProceduralMusic();

    // Stop all SFX instances
    this.soundInstances.forEach(instance => {
      try {
        instance.source.stop();
      } catch (e) {
        // May already be stopped
      }
    });

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
    }

    console.log('🔊 Audio Manager destroyed');
  }
}