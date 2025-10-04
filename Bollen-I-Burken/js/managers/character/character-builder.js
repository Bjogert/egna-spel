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
        
        // LEG SETTINGS - Much longer, visible legs!
        legs: {
            radius: 0.15,         // Even THICKER legs for visibility
            height: 0.8,          // MUCH LONGER legs (was 0.4) - clearly visible!
            separation: 0.15,     // Slightly wider stance for stability
            verticalOffset: -0.1, // LOWER positioning (was 0.2) - legs below torso!
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
        
        // PHYSICS/COLLISION DIMENSIONS - Updated for longer legs
        // These should match the visual size for proper collision detection
        physics: {
            width: 0.7,           // Narrower collision box (match new torso.width)
            height: 1.6,          // TALLER total height (was 1.0) - account for longer legs!
            depth: 0.5,           // Match new rounder torso.depth
            centerY: 0.8,         // Higher center point (was 0.5) for taller character
        },
        
        // RENDERING SETTINGS
        rendering: {
            castShadow: true,     // Whether character parts cast shadows
            receiveShadow: true,  // Whether character parts receive shadows
            opacity: 0.9,         // Character transparency (1.0 = opaque, 0.0 = invisible)
            materialType: 'lambert', // Material type (lambert = good performance)
        },
        
        // 🦴 RAGDOLL PHYSICS SETTINGS (Phase 1A: Proof of Concept)
        ragdoll: {
            enabled: true,        // Enable ragdoll physics for legs
            upperLeg: {
                length: 0.4,      // Half of total leg height (0.8/2)
                radius: 0.15,     // MATCH simple leg radius for consistent size
                mass: 3.0,        // Physics mass
            },
            lowerLeg: {
                length: 0.4,      // Half of total leg height (0.8/2)
                radius: 0.15,     // MATCH simple leg radius for consistent size
                mass: 2.0,        // Physics mass (lighter than thigh)
            },
            joints: {
                kneeMaxAngle: 160 * Math.PI / 180,  // Max knee bend (160 degrees)
                kneeMinAngle: 0,                    // Min knee bend (straight)
                kneeStiffness: 100,                 // Joint motor force
                kneeDamping: 10,                    // Joint damping (smoothness)
            }
        }
    };

    /**
     * 🦴 RagdollCharacterBuilder - Phase 1A: Articulated Physics Characters
     * Creates characters with individual physics bodies and joint constraints
     */
    class RagdollCharacterBuilder {
        
        /**
         * Creates an articulated left leg with knee joint (Phase 1A proof of concept)
         * @param {Object} config - Character configuration
         * @param {CANNON.World} physicsWorld - Cannon.js physics world
         * @returns {Object} { visualGroup, physicsBodies, joints }
         */
        static createArticulatedLeftLeg(config, physicsWorld) {
            const scale = config.scale || 1.0;
            
            // Create visual meshes
            const upperLegMesh = this.createUpperLegMesh(config, scale);
            const lowerLegMesh = this.createLowerLegMesh(config, scale);
            
            // Create physics bodies
            const upperLegBody = this.createUpperLegPhysicsBody(scale);
            const lowerLegBody = this.createLowerLegPhysicsBody(scale);
            
            // Position physics bodies
            const legSeparation = CHARACTER_CONFIG.legs.separation * scale;
            const baseY = CHARACTER_CONFIG.legs.verticalOffset * scale;
            
            // Upper leg position (attached to hip)
            upperLegBody.position.set(-legSeparation, baseY + CHARACTER_CONFIG.ragdoll.upperLeg.length * 0.5, 0);
            
            // Lower leg position (hanging from upper leg)
            lowerLegBody.position.set(-legSeparation, baseY - CHARACTER_CONFIG.ragdoll.lowerLeg.length * 0.5, 0);
            
            // Add bodies to physics world
            physicsWorld.addBody(upperLegBody);
            physicsWorld.addBody(lowerLegBody);
            
            // Create knee joint constraint
            const kneeJoint = this.createKneeJoint(upperLegBody, lowerLegBody);
            physicsWorld.addConstraint(kneeJoint);
            
            // Create visual group
            const legGroup = new THREE.Group();
            
            // Position visual meshes relative to their physics bodies
            // Since physics bodies are in world space, we need to position meshes relatively
            upperLegMesh.position.set(-legSeparation, baseY + CHARACTER_CONFIG.ragdoll.upperLeg.length * 0.5, 0);
            lowerLegMesh.position.set(-legSeparation, baseY - CHARACTER_CONFIG.ragdoll.lowerLeg.length * 0.5, 0);
            
            legGroup.add(upperLegMesh);
            legGroup.add(lowerLegMesh);
            legGroup.name = 'articulated_left_leg';
            
            // Store references for physics sync
            upperLegMesh.userData.physicsBody = upperLegBody;
            lowerLegMesh.userData.physicsBody = lowerLegBody;
            
            return {
                visualGroup: legGroup,
                physicsBodies: {
                    upperLeg: upperLegBody,
                    lowerLeg: lowerLegBody
                },
                joints: {
                    knee: kneeJoint
                },
                visualMeshes: {
                    upperLeg: upperLegMesh,
                    lowerLeg: lowerLegMesh
                }
            };
        }
        
        /**
         * Creates upper leg visual mesh
         */
        static createUpperLegMesh(config, scale) {
            const radius = CHARACTER_CONFIG.ragdoll.upperLeg.radius * scale;
            const length = CHARACTER_CONFIG.ragdoll.upperLeg.length * scale;
            
            const geometry = new THREE.CylinderGeometry(radius, radius, length, 8);
            const material = new THREE.MeshLambertMaterial({
                color: CharacterBuilder.getBodyColor(config.type),
                transparent: true,
                opacity: CHARACTER_CONFIG.rendering.opacity
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.name = 'upper_leg_left';
            mesh.castShadow = CHARACTER_CONFIG.rendering.castShadow;
            mesh.receiveShadow = CHARACTER_CONFIG.rendering.receiveShadow;
            
            return mesh;
        }
        
        /**
         * Creates lower leg visual mesh  
         */
        static createLowerLegMesh(config, scale) {
            const radius = CHARACTER_CONFIG.ragdoll.lowerLeg.radius * scale;
            const length = CHARACTER_CONFIG.ragdoll.lowerLeg.length * scale;
            
            const geometry = new THREE.CylinderGeometry(radius, radius, length, 8);
            const material = new THREE.MeshLambertMaterial({
                color: CharacterBuilder.getBodyColor(config.type),
                transparent: true,
                opacity: CHARACTER_CONFIG.rendering.opacity
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.name = 'lower_leg_left';
            mesh.castShadow = CHARACTER_CONFIG.rendering.castShadow;
            mesh.receiveShadow = CHARACTER_CONFIG.rendering.receiveShadow;
            
            return mesh;
        }
        
        /**
         * Creates upper leg physics body
         */
        static createUpperLegPhysicsBody(scale) {
            const radius = CHARACTER_CONFIG.ragdoll.upperLeg.radius * scale;
            const length = CHARACTER_CONFIG.ragdoll.upperLeg.length * scale;
            const mass = CHARACTER_CONFIG.ragdoll.upperLeg.mass;
            
            const shape = new CANNON.Cylinder(radius, radius, length, 8);
            const body = new CANNON.Body({ mass: mass });
            body.addShape(shape);
            
            // Add collision group for character parts
            body.collisionFilterGroup = 2;  // Character parts group
            body.collisionFilterMask = 1 | 4;  // Collide with environment and other characters
            
            return body;
        }
        
        /**
         * Creates lower leg physics body
         */
        static createLowerLegPhysicsBody(scale) {
            const radius = CHARACTER_CONFIG.ragdoll.lowerLeg.radius * scale;
            const length = CHARACTER_CONFIG.ragdoll.lowerLeg.length * scale;
            const mass = CHARACTER_CONFIG.ragdoll.lowerLeg.mass;
            
            const shape = new CANNON.Cylinder(radius, radius, length, 8);
            const body = new CANNON.Body({ mass: mass });
            body.addShape(shape);
            
            // Add collision group for character parts
            body.collisionFilterGroup = 2;  // Character parts group  
            body.collisionFilterMask = 1 | 4;  // Collide with environment and other characters
            
            return body;
        }
        
        /**
         * Creates knee joint constraint between upper and lower leg
         */
        static createKneeJoint(upperLegBody, lowerLegBody) {
            const upperLegLength = CHARACTER_CONFIG.ragdoll.upperLeg.length;
            const lowerLegLength = CHARACTER_CONFIG.ragdoll.lowerLeg.length;
            
            // Create hinge constraint for knee (single-axis rotation)
            const kneeJoint = new CANNON.HingeConstraint(upperLegBody, lowerLegBody, {
                pivotA: new CANNON.Vec3(0, -upperLegLength * 0.5, 0),  // Bottom of upper leg
                pivotB: new CANNON.Vec3(0, lowerLegLength * 0.5, 0),   // Top of lower leg
                axisA: new CANNON.Vec3(1, 0, 0),                       // Rotation axis (sideways)
                axisB: new CANNON.Vec3(1, 0, 0),                       // Same axis
            });
            
            // Enable motor for active control
            kneeJoint.enableMotor();
            kneeJoint.setMotorSpeed(0); // Start with no rotation
            kneeJoint.setMotorMaxForce(CHARACTER_CONFIG.ragdoll.joints.kneeStiffness);
            
            // Set joint limits (prevent hyperextension)
            kneeJoint.collideConnected = false;  // Don't collide connected bodies
            
            console.log(`[RagdollCharacterBuilder] Created knee joint with stiffness: ${CHARACTER_CONFIG.ragdoll.joints.kneeStiffness}`);
            
            return kneeJoint;
        }
        
        /**
         * Updates visual meshes to match physics body positions
         * Call this every frame to sync visual with physics
         */
        static syncVisualWithPhysics(articulatedLeg) {
            // Sync upper leg
            const upperMesh = articulatedLeg.visualMeshes.upperLeg;
            const upperBody = articulatedLeg.physicsBodies.upperLeg;
            upperMesh.position.copy(upperBody.position);
            upperMesh.quaternion.copy(upperBody.quaternion);
            
            // Sync lower leg
            const lowerMesh = articulatedLeg.visualMeshes.lowerLeg;
            const lowerBody = articulatedLeg.physicsBodies.lowerLeg;
            lowerMesh.position.copy(lowerBody.position);
            lowerMesh.quaternion.copy(lowerBody.quaternion);
        }
    }

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
         * 🦴 Creates a character with ragdoll physics (Phase 1A: Left leg articulated)
         * @param {Object} options - Character configuration
         * @param {CANNON.World} physicsWorld - Cannon.js physics world for constraints
         * @returns {Object} { visualGroup, physicsData }
         */
        static createRagdollCharacter(options = {}, physicsWorld) {
            const config = {
                color: options.color || 0x00ff00,
                type: options.type || 'player',
                scale: options.scale || 1.0,
                castShadow: options.castShadow !== false
            };

            // Create standard character parts (head, torso, right leg)
            const characterGroup = new THREE.Group();
            characterGroup.name = `ragdoll_character_${config.type}`;

            // Create standard parts
            const head = this.createHead(config);
            const torso = this.createTorso(config);
            const rightLeg = this.createLeg(config, 'right'); // Keep right leg static for comparison

            // Position standard parts
            torso.position.set(0, CHARACTER_CONFIG.torso.verticalOffset * config.scale, 0);
            head.position.set(0, CHARACTER_CONFIG.head.verticalOffset * config.scale, 0);
            rightLeg.position.set(
                CHARACTER_CONFIG.legs.separation * config.scale, 
                CHARACTER_CONFIG.legs.verticalOffset * config.scale, 
                0
            );

            // Create articulated left leg with knee joint
            let articulatedLeftLeg = null;
            let physicsData = null;
            
            if (CHARACTER_CONFIG.ragdoll.enabled && physicsWorld) {
                try {
                    console.log(`[CharacterBuilder] Attempting to create articulated leg with physics world:`, physicsWorld ? 'Available' : 'Missing');
                    articulatedLeftLeg = RagdollCharacterBuilder.createArticulatedLeftLeg(config, physicsWorld);
                    physicsData = {
                        articulatedLegs: {
                            left: articulatedLeftLeg
                        }
                    };
                    console.log(`[CharacterBuilder] ✅ Created articulated left leg with knee joint for ${config.type}`);
                } catch (error) {
                    console.error(`[CharacterBuilder] ❌ Failed to create articulated leg:`, error);
                    console.error(`[CharacterBuilder] Error stack:`, error.stack);
                    console.error(`[CharacterBuilder] Physics world available:`, physicsWorld ? 'Yes' : 'No');
                    console.error(`[CharacterBuilder] Config:`, config);
                    // Fallback to static leg
                    const leftLeg = this.createLeg(config, 'left');
                    leftLeg.position.set(
                        -CHARACTER_CONFIG.legs.separation * config.scale, 
                        CHARACTER_CONFIG.legs.verticalOffset * config.scale, 
                        0
                    );
                    characterGroup.add(leftLeg);
                    // Store as fallback leftLeg for animator
                    articulatedLeftLeg = leftLeg;
                }
            } else {
                // Fallback to static leg if no physics world
                const leftLeg = this.createLeg(config, 'left');
                leftLeg.position.set(
                    -CHARACTER_CONFIG.legs.separation * config.scale, 
                    CHARACTER_CONFIG.legs.verticalOffset * config.scale, 
                    0
                );
                characterGroup.add(leftLeg);
            }

            // Add standard parts to group
            characterGroup.add(torso);
            characterGroup.add(head);
            characterGroup.add(rightLeg);

            // Add articulated leg if created
            if (articulatedLeftLeg) {
                characterGroup.add(articulatedLeftLeg.visualGroup);
            }

            // Store references for later access
            characterGroup.userData = {
                type: config.type,
                parts: {
                    head: head,
                    torso: torso,
                    leftLeg: articulatedLeftLeg || null,  // Use articulatedLeftLeg as leftLeg for animator
                    rightLeg: rightLeg,                   // Keep rightLeg as is
                    articulatedLeftLeg: articulatedLeftLeg
                },
                config: config,
                isRagdoll: true,
                physicsData: physicsData
            };

            const legType = articulatedLeftLeg ? "articulated left leg + static right leg" : "static legs";
            console.log(`[CharacterBuilder] Created ${config.type} ragdoll character with ${legType} (scale: ${config.scale})`);
            
            return {
                visualGroup: characterGroup,
                physicsData: physicsData
            };
        }

        /**
         * Sync ragdoll visual meshes with their physics bodies
         * Call this each frame for characters with articulated parts
         * @param {THREE.Group} characterMesh - Character mesh with userData.parts
         */
        static syncRagdollPhysics(characterMesh) {
            if (!characterMesh.userData || !characterMesh.userData.parts) {
                return;
            }

            const parts = characterMesh.userData.parts;
            
            // Sync articulated left leg if it exists
            if (parts.articulatedLeftLeg && parts.articulatedLeftLeg.visualGroup) {
                const legGroup = parts.articulatedLeftLeg.visualGroup;
                
                // Sync each child mesh with its physics body
                legGroup.children.forEach(mesh => {
                    if (mesh.userData.physicsBody) {
                        // Copy position and rotation from physics body to visual mesh
                        mesh.position.copy(mesh.userData.physicsBody.position);
                        mesh.quaternion.copy(mesh.userData.physicsBody.quaternion);
                    }
                });
            }
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

        /**
         * 🦴 Creates ragdoll AI hunter character with articulated physics
         * @param {Object} options - AI configuration
         * @param {CANNON.World} physicsWorld - Physics world for constraints
         * @returns {Object} { visualGroup, physicsData }
         */
        static createRagdollAIHunter(options = {}, physicsWorld) {
            const aiConfig = {
                color: 0xff4444,      // Red base color
                type: 'ai_hunter',
                scale: options.scale || 1.1,  // Slightly bigger than player
                castShadow: options.castShadow !== false
            };

            const result = this.createRagdollCharacter(aiConfig, physicsWorld);
            result.visualGroup.name = 'ragdoll_ai_hunter_character';
            
            return result;
        }

        /**
         * 🦴 Creates ragdoll player character with articulated physics
         * @param {Object} options - Player configuration
         * @param {CANNON.World} physicsWorld - Physics world for constraints
         * @returns {Object} { visualGroup, physicsData }
         */
        static createRagdollPlayer(options = {}, physicsWorld) {
            const playerConfig = {
                color: 0x00ff00,      // Green base color
                type: 'player',
                scale: options.scale || 1.0,
                castShadow: options.castShadow !== false
            };

            const result = this.createRagdollCharacter(playerConfig, physicsWorld);
            result.visualGroup.name = 'ragdoll_player_character';
            
            return result;
        }

        /**
         * 🔄 Updates ragdoll character visuals to match physics bodies (call every frame)
         * @param {THREE.Group} characterGroup - Character group with ragdoll data
         */
        static updateRagdollPhysics(characterGroup) {
            if (!characterGroup.userData || !characterGroup.userData.isRagdoll || !characterGroup.userData.physicsData) {
                return; // Not a ragdoll character
            }

            const physicsData = characterGroup.userData.physicsData;
            
            // Update articulated legs
            if (physicsData.articulatedLegs) {
                if (physicsData.articulatedLegs.left) {
                    RagdollCharacterBuilder.syncVisualWithPhysics(physicsData.articulatedLegs.left);
                }
                if (physicsData.articulatedLegs.right) {
                    RagdollCharacterBuilder.syncVisualWithPhysics(physicsData.articulatedLegs.right);
                }
            }
        }
    }

    // Export to global scope
    global.CharacterBuilder = CharacterBuilder;
    global.CHARACTER_CONFIG = CHARACTER_CONFIG;  // 🎛️ Export config for access

    // Also export for module systems
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = CharacterBuilder;
        module.exports.CHARACTER_CONFIG = CHARACTER_CONFIG;
    }

    console.log('[CharacterBuilder] CharacterBuilder module loaded - ready to build GUBBAR!');

})(typeof window !== 'undefined' ? window : globalThis);