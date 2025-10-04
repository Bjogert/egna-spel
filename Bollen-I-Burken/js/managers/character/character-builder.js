/* ==========================================
   CHARACTER BUILDER - GUBBAR PHASE 1
   Creates simple head + body characters
   ========================================== */

(function (global) {
    'use strict';

    // ========================================
    // 🎛️ CHARACTER PROPORTIONS CONFIG
    // ========================================
    // Adjust these values to change character appearance!
    
    const CHARACTER_CONFIG = {
        // HEAD SETTINGS - BIGGER for child-like proportions!
        head: {
            radius: 0.3,           // BIGGER head (was 0.2) - children have big heads!
            sphereSegments: 16,    // Head sphere detail (higher = smoother, lower = performance)
            verticalOffset: 1.0,   // Slightly lower (was 1.1) for shorter character
        },
        
        // TORSO SETTINGS - Rounder, child-like body
        torso: {
            width: 0.7,           // Narrower shoulders (was 1.0) - less adult-like
            height: 0.5,          // Shorter torso (was 0.8) - child proportions  
            depth: 0.5,           // Rounder front-to-back (was 0.4) - chubbier child body
            verticalOffset: 0.45, // Lower (was 0.6) for shorter character
        },
        
        // LEG SETTINGS - Stubby cute legs!
        legs: {
            radius: 0.12,         // THICKER legs (was 0.08) - chubby child legs!
            height: 0.4,          // SHORTER legs (was 0.7) - stubby child legs
            separation: 0.12,     // Closer together (was 0.15) - cute stance
            verticalOffset: 0.2,  // Lower (was 0.25) for shorter character
            segments: 8,          // Cylinder detail (higher = smoother, lower = performance)
        },
        
        // COLORS - Softer, more playful colors
        colors: {
            player: {
                head: 0x66BB6A,   // Softer green (was 0x4CAF50) - friendlier
                body: 0x4CAF50,   // Lighter body (was 0x2E7D32) - more playful
            },
            aiHunter: {
                head: 0xFF7043,   // Softer orange-red (was 0xF44336) - less aggressive
                body: 0xFF5722,   // Warmer red (was 0xC62828) - more playful
            }
        },
        
        // PHYSICS/COLLISION DIMENSIONS - Updated for child-like proportions
        // These should match the visual size for proper collision detection
        physics: {
            width: 0.7,           // Narrower collision box (match new torso.width)
            height: 1.0,          // Shorter total height (was 1.3) - child height!
            depth: 0.5,           // Match new rounder torso.depth
            centerY: 0.5,         // Lower center point (was 0.65) for shorter character
        },
        
        // RENDERING SETTINGS
        rendering: {
            castShadow: true,     // Whether character parts cast shadows
            receiveShadow: true,  // Whether character parts receive shadows
            opacity: 0.9,         // Character transparency (1.0 = opaque, 0.0 = invisible)
            materialType: 'lambert', // Material type (lambert = good performance)
        }
    };

    /**
     * CharacterBuilder - Creates modular characters with head + torso + legs
     * 
     * Phase 1: Head + Torso + Legs (4 parts) ✅ CURRENT
     * Phase 2: + Arms (6 parts) 
     * Phase 3: + Better proportions and details
     * Phase 4: Full ragdoll with animation
     */
    class CharacterBuilder {
        
        /**
         * Creates a simple character with head and body
         * @param {Object} options - Character configuration
         * @param {number} options.color - Base color (e.g., 0x00ff00 for green)
         * @param {string} options.type - 'player' or 'ai' 
         * @param {number} options.scale - Size multiplier (default 1.0)
         * @param {boolean} options.castShadow - Enable shadows (default true)
         * @returns {THREE.Group} Character group with head and body meshes
         */
        static createSimpleCharacter(options = {}) {
            const config = {
                color: options.color || 0x00ff00,
                type: options.type || 'player',
                scale: options.scale || 1.0,
                castShadow: options.castShadow !== false
            };

            // Create character group (parent container)
            const characterGroup = new THREE.Group();
            characterGroup.name = `character_${config.type}`;

            // Create body parts
            const head = this.createHead(config);
            const torso = this.createTorso(config);
            const leftLeg = this.createLeg(config, 'left');
            const rightLeg = this.createLeg(config, 'right');

            // Position parts relative to group center
            // Group center is at character's feet (ground level)
            torso.position.set(0, CHARACTER_CONFIG.torso.verticalOffset * config.scale, 0);
            head.position.set(0, CHARACTER_CONFIG.head.verticalOffset * config.scale, 0);
            leftLeg.position.set(
                -CHARACTER_CONFIG.legs.separation * config.scale, 
                CHARACTER_CONFIG.legs.verticalOffset * config.scale, 
                0
            );
            rightLeg.position.set(
                CHARACTER_CONFIG.legs.separation * config.scale, 
                CHARACTER_CONFIG.legs.verticalOffset * config.scale, 
                0
            );

            // Add parts to group
            characterGroup.add(torso);
            characterGroup.add(head);
            characterGroup.add(leftLeg);
            characterGroup.add(rightLeg);

            // Store references for later access
            characterGroup.userData = {
                type: config.type,
                parts: {
                    head: head,
                    torso: torso,
                    leftLeg: leftLeg,
                    rightLeg: rightLeg
                },
                config: config
            };

            console.log(`[CharacterBuilder] Created ${config.type} character with head + torso + legs (scale: ${config.scale})`);
            return characterGroup;
        }

        /**
         * Creates the head sphere
         * @param {Object} config - Character configuration
         * @returns {THREE.Mesh} Head mesh
         */
        static createHead(config) {
            const radius = CHARACTER_CONFIG.head.radius * config.scale;
            
            const geometry = new THREE.SphereGeometry(
                radius, 
                CHARACTER_CONFIG.head.sphereSegments, 
                CHARACTER_CONFIG.head.sphereSegments
            );
            const material = new THREE.MeshLambertMaterial({
                color: this.getHeadColor(config.type),
                transparent: true,
                opacity: CHARACTER_CONFIG.rendering.opacity
            });

            const headMesh = new THREE.Mesh(geometry, material);
            headMesh.name = 'head';
            headMesh.castShadow = CHARACTER_CONFIG.rendering.castShadow;
            headMesh.receiveShadow = CHARACTER_CONFIG.rendering.receiveShadow;

            return headMesh;
        }

        /**
         * Creates the torso with human-like proportions
         * @param {Object} config - Character configuration  
         * @returns {THREE.Mesh} Torso mesh
         */
        static createTorso(config) {
            // Human torso: wider shoulders (front-to-back), narrower depth (side-to-side)
            const width = CHARACTER_CONFIG.torso.width * config.scale;
            const height = CHARACTER_CONFIG.torso.height * config.scale;
            const depth = CHARACTER_CONFIG.torso.depth * config.scale;

            const geometry = new THREE.BoxGeometry(width, height, depth);
            const material = new THREE.MeshLambertMaterial({
                color: this.getBodyColor(config.type),
                transparent: true,
                opacity: CHARACTER_CONFIG.rendering.opacity
            });

            const torsoMesh = new THREE.Mesh(geometry, material);
            torsoMesh.name = 'torso';
            torsoMesh.castShadow = CHARACTER_CONFIG.rendering.castShadow;
            torsoMesh.receiveShadow = CHARACTER_CONFIG.rendering.receiveShadow;

            return torsoMesh;
        }

        /**
         * Creates a leg cylinder
         * @param {Object} config - Character configuration
         * @param {string} side - 'left' or 'right'
         * @returns {THREE.Mesh} Leg mesh
         */
        static createLeg(config, side) {
            const radius = CHARACTER_CONFIG.legs.radius * config.scale;
            const height = CHARACTER_CONFIG.legs.height * config.scale;
            const segments = CHARACTER_CONFIG.legs.segments;

            const geometry = new THREE.CylinderGeometry(radius, radius, height, segments);
            const material = new THREE.MeshLambertMaterial({
                color: this.getBodyColor(config.type),
                transparent: true,
                opacity: CHARACTER_CONFIG.rendering.opacity
            });

            const legMesh = new THREE.Mesh(geometry, material);
            legMesh.name = `leg_${side}`;
            legMesh.castShadow = CHARACTER_CONFIG.rendering.castShadow;
            legMesh.receiveShadow = CHARACTER_CONFIG.rendering.receiveShadow;

            return legMesh;
        }

        /**
         * Gets head color based on character type
         * @param {string} characterType - 'player' or 'ai_hunter'
         * @returns {number} Head color hex value
         */
        static getHeadColor(characterType) {
            if (characterType === 'player') {
                return CHARACTER_CONFIG.colors.player.head;
            } else if (characterType === 'ai_hunter') {
                return CHARACTER_CONFIG.colors.aiHunter.head;
            }
            // Fallback to player color if unknown type
            return CHARACTER_CONFIG.colors.player.head;
        }

        /**
         * Gets body/legs color based on character type
         * @param {string} characterType - 'player' or 'ai_hunter'
         * @returns {number} Body color hex value
         */
        static getBodyColor(characterType) {
            if (characterType === 'player') {
                return CHARACTER_CONFIG.colors.player.body;
            } else if (characterType === 'ai_hunter') {
                return CHARACTER_CONFIG.colors.aiHunter.body;
            }
            // Fallback to player color if unknown type
            return CHARACTER_CONFIG.colors.player.body;
        }

        /**
         * Updates character color (for team changes, power-ups, etc.)
         * @param {THREE.Group} characterGroup - Character group
         * @param {number} newColor - New base color
         */
        static updateCharacterColor(characterGroup, newColor) {
            if (!characterGroup.userData || !characterGroup.userData.parts) {
                Utils.warn('Cannot update color: invalid character group');
                return;
            }

            const parts = characterGroup.userData.parts;
            
            if (parts.head) {
                parts.head.material.color.setHex(this.getHeadColor(newColor));
            }
            
            if (parts.torso) {
                parts.torso.material.color.setHex(this.getBodyColor(newColor));
            }
            
            if (parts.leftLeg) {
                parts.leftLeg.material.color.setHex(this.getBodyColor(newColor));
            }
            
            if (parts.rightLeg) {
                parts.rightLeg.material.color.setHex(this.getBodyColor(newColor));
            }

            console.log(`[CharacterBuilder] Updated character color to ${newColor.toString(16)}`);
        }

        /**
         * Gets character dimensions for physics/collision
         * @param {number} scale - Character scale
         * @returns {Object} Bounding box dimensions
         */
        static getCharacterDimensions(scale = 1.0) {
            return {
                width: CHARACTER_CONFIG.physics.width * scale,
                height: CHARACTER_CONFIG.physics.height * scale,
                depth: CHARACTER_CONFIG.physics.depth * scale,
                centerY: CHARACTER_CONFIG.physics.centerY * scale
            };
        }

        /**
         * Creates AI hunter character with specific styling
         * @param {Object} options - AI configuration
         * @returns {THREE.Group} AI character group
         */
        static createAIHunter(options = {}) {
            const aiConfig = {
                color: 0xff4444,      // Red base color
                type: 'ai_hunter',
                scale: options.scale || 1.1,  // Slightly bigger than player
                castShadow: options.castShadow !== false
            };

            const character = this.createSimpleCharacter(aiConfig);
            character.name = 'ai_hunter_character';
            
            // AI hunters can have special effects later (glowing eyes, etc.)
            return character;
        }

        /**
         * Creates player character with specific styling
         * @param {Object} options - Player configuration
         * @returns {THREE.Group} Player character group
         */
        static createPlayer(options = {}) {
            const playerConfig = {
                color: 0x00ff00,      // Green base color
                type: 'player',
                scale: options.scale || 1.0,
                castShadow: options.castShadow !== false
            };

            const character = this.createSimpleCharacter(playerConfig);
            character.name = 'player_character';
            
            return character;
        }
    }

    // Export to global scope
    global.CharacterBuilder = CharacterBuilder;

    // Also export for module systems
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = CharacterBuilder;
    }

    console.log('[CharacterBuilder] CharacterBuilder module loaded - ready to build GUBBAR!');

})(typeof window !== 'undefined' ? window : globalThis);