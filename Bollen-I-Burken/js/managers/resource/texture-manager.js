/* ==========================================
   TEXTURE MANAGER
   Loads and manages Kenney Prototype Textures
   ========================================== */

// ==========================================
// 🎨 TEXTURE SETTINGS - TWEAK THESE!
// ==========================================
const TEXTURE_SETTINGS = {
    // Floor/Grass Settings
    grassRepeat: 20,           // How many times grass texture repeats (higher = smaller grass pattern)
    grassBrightness: 1.5,      // Brightness multiplier (1.0 = normal, 1.5 = brighter, 2.0 = very bright)
    grassSaturation: 0.8,      // Color saturation (1.0 = normal, 0.5 = less colorful, 1.5 = more colorful)

    // Wall Settings
    wallRepeat: 4,             // How many times wall texture repeats

    // Material Settings
    floorRoughness: 1.0,       // How rough/matte the floor is (0 = shiny, 1 = matte)
    floorMetalness: 0.1,       // How metallic the floor is (0 = not metal, 1 = full metal)
    wallRoughness: 0.85,
    wallMetalness: 0.15
};

(function (global) {
    const TextureManager = {
        textures: {
            dark: [],
            green: [],
            light: [],
            orange: [],
            purple: [],
            red: [],
            grass: null  // Dedicated grass texture for floor
        },
        loaded: false,
        loader: new THREE.TextureLoader(),

        /**
         * Load all textures from the Kenney prototype texture pack
         */
        loadTextures(onComplete) {
            Utils.log('TextureManager: Loading textures...');

            const basePath = 'assets/images/textures/kenney_prototype-textures/PNG/';
            const colors = ['Dark', 'Green', 'Light', 'Orange', 'Purple', 'Red'];
            const textureCount = 13;
            let loadedCount = 0;
            const totalTextures = colors.length * textureCount + 1; // +1 for grass texture

            colors.forEach(color => {
                for (let i = 1; i <= textureCount; i++) {
                    const texturePath = `${basePath}${color}/texture_${String(i).padStart(2, '0')}.png`;

                    this.loader.load(
                        texturePath,
                        (texture) => {
                            // Configure texture for proper tiling
                            texture.wrapS = THREE.RepeatWrapping;
                            texture.wrapT = THREE.RepeatWrapping;
                            texture.repeat.set(1, 1);

                            // Store texture
                            const colorKey = color.toLowerCase();
                            this.textures[colorKey].push(texture);

                            loadedCount++;

                            if (loadedCount === totalTextures) {
                                this.loaded = true;
                                Utils.log(`TextureManager: Loaded ${totalTextures} textures successfully`);
                                if (onComplete) onComplete();
                            }
                        },
                        undefined,
                        (error) => {
                            Utils.error(`TextureManager: Failed to load ${texturePath}`, error);
                            loadedCount++;

                            if (loadedCount === totalTextures) {
                                this.loaded = true;
                                if (onComplete) onComplete();
                            }
                        }
                    );
                }
            });

            // Load dedicated grass texture
            this.loader.load(
                'assets/images/textures/grass-seamless.png',
                (texture) => {
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.set(1, 1);
                    this.textures.grass = texture;
                    loadedCount++;
                    Utils.log('TextureManager: Grass texture loaded');
                    if (loadedCount === totalTextures) {
                        this.loaded = true;
                        Utils.log(`TextureManager: All textures loaded successfully`);
                        if (onComplete) onComplete();
                    }
                },
                undefined,
                (error) => {
                    Utils.warn('TextureManager: Grass texture failed to load, will use fallback');
                    loadedCount++;
                    if (loadedCount === totalTextures) {
                        this.loaded = true;
                        if (onComplete) onComplete();
                    }
                }
            );
        },

        /**
         * Get texture by color and pattern index
         */
        getTexture(color, patternIndex = 0) {
            if (!this.loaded) {
                Utils.warn('TextureManager: Textures not yet loaded');
                return null;
            }

            const colorKey = color.toLowerCase();
            if (!this.textures[colorKey]) {
                Utils.warn(`TextureManager: Invalid color ${color}`);
                return null;
            }

            const textures = this.textures[colorKey];
            if (patternIndex < 0 || patternIndex >= textures.length) {
                Utils.warn(`TextureManager: Invalid pattern index ${patternIndex}`);
                return textures[0];
            }

            return textures[patternIndex];
        },

        /**
         * Get random texture from a color set
         */
        getRandomTexture(color) {
            const colorKey = color.toLowerCase();
            if (!this.textures[colorKey] || this.textures[colorKey].length === 0) {
                return null;
            }

            const textures = this.textures[colorKey];
            const randomIndex = Math.floor(Math.random() * textures.length);
            return textures[randomIndex];
        },

        /**
         * Get texture based on obstacle height (matches color coding)
         */
        getTextureForHeight(height, patternIndex = null) {
            let color;

            if (height < 1.0) {
                color = 'green';
            } else if (height < 2.0) {
                color = 'light';  // Yellow obstacles get light textures
            } else if (height < 3.0) {
                color = 'orange';
            } else {
                color = 'red';
            }

            if (patternIndex !== null) {
                return this.getTexture(color, patternIndex);
            } else {
                return this.getRandomTexture(color);
            }
        },

        /**
         * Create a textured material with proper configuration
         */
        createTexturedMaterial(baseColor, texture, options = {}) {
            const materialConfig = {
                color: baseColor,
                map: texture,
                roughness: options.roughness !== undefined ? options.roughness : 0.8,
                metalness: options.metalness !== undefined ? options.metalness : 0.2,
                ...options
            };

            return new THREE.MeshStandardMaterial(materialConfig);
        },

        /**
         * Get floor texture (realistic grass texture for park theme!)
         */
        getFloorTexture() {
            // Use dedicated grass texture (CC0 from OpenGameArt)
            if (this.textures.grass) {
                const floorTexture = this.textures.grass.clone();
                floorTexture.repeat.set(TEXTURE_SETTINGS.grassRepeat, TEXTURE_SETTINGS.grassRepeat);
                return floorTexture;
            }
            return null;
        },

        /**
         * Get wall texture (subtle pattern for boundaries)
         */
        getWallTexture() {
            // Use Dark texture_02 (vertical lines) for walls
            const texture = this.getTexture('dark', 1);
            if (texture) {
                const wallTexture = texture.clone();
                wallTexture.repeat.set(TEXTURE_SETTINGS.wallRepeat, 2);
                return wallTexture;
            }
            return null;
        }
    };

    // ==========================================
    // EXPORTS
    // ==========================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = TextureManager;
    } else {
        global.TextureManager = TextureManager;
    }
})(typeof window !== 'undefined' ? window : globalThis);
