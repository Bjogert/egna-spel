/* ==========================================
   BOLLEN I BURKEN - SIMPLE CONFIGURATION
   KISS: Plain JavaScript object configuration
   ========================================== */

// ==========================================
// 🎮 EASY TWEAK CONSTANTS - CHANGE THESE!
// ==========================================

// Hunter counts per difficulty level
const HUNTERS_LEVEL_1_5 = 1;    // Levels 1-5: 1 hunter
const HUNTERS_LEVEL_6_10 = 2;   // Levels 6-10: 2 hunters

// Obstacle counts per level (more = easier)
const OBSTACLES_LEVEL_1 = 40;
const OBSTACLES_LEVEL_2 = 35;
const OBSTACLES_LEVEL_3 = 25;
const OBSTACLES_LEVEL_4 = 20;
const OBSTACLES_LEVEL_5 = 25;
const OBSTACLES_LEVEL_6 = 20;
const OBSTACLES_LEVEL_7 = 18;
const OBSTACLES_LEVEL_8 = 15;
const OBSTACLES_LEVEL_9 = 12;
const OBSTACLES_LEVEL_10 = 10;

// How far obstacles spawn from can (bigger = harder, less cover)
const CAN_EXCLUSION_LEVEL_1 = 6.0;
const CAN_EXCLUSION_LEVEL_2 = 8.0;
const CAN_EXCLUSION_LEVEL_3 = 10.0;
const CAN_EXCLUSION_LEVEL_4 = 11.0;
const CAN_EXCLUSION_LEVEL_5 = 12.0;
const CAN_EXCLUSION_LEVEL_6 = 13.0;
const CAN_EXCLUSION_LEVEL_7 = 13.0;
const CAN_EXCLUSION_LEVEL_8 = 13.0;
const CAN_EXCLUSION_LEVEL_9 = 13.0;
const CAN_EXCLUSION_LEVEL_10 = 13.0;

// AI patrol speeds (how fast they move)
const PATROL_SPEED_LEVEL_1 = 0.06;
const PATROL_SPEED_LEVEL_2 = 0.07;
const PATROL_SPEED_LEVEL_3 = 0.08;
const PATROL_SPEED_LEVEL_4 = 0.09;
const PATROL_SPEED_LEVEL_5 = 0.10;
const PATROL_SPEED_LEVEL_6 = 0.11;
const PATROL_SPEED_LEVEL_7 = 0.18;
const PATROL_SPEED_LEVEL_8 = 0.13;
const PATROL_SPEED_LEVEL_9 = 0.14;
const PATROL_SPEED_LEVEL_10 = 0.15;

// AI chase speeds (how fast they chase you)
const CHASE_SPEED_LEVEL_1 = 0.10;
const CHASE_SPEED_LEVEL_2 = 0.11;
const CHASE_SPEED_LEVEL_3 = 0.12;
const CHASE_SPEED_LEVEL_4 = 0.13;
const CHASE_SPEED_LEVEL_5 = 0.15;
const CHASE_SPEED_LEVEL_6 = 0.17;
const CHASE_SPEED_LEVEL_7 = 0.20;
const CHASE_SPEED_LEVEL_8 = 0.20;
const CHASE_SPEED_LEVEL_9 = 0.22;
const CHASE_SPEED_LEVEL_10 = 0.25;

// AI vision range (how far they can see)
const VISION_RANGE_LEVEL_1 = 8;
const VISION_RANGE_LEVEL_2 = 9;
const VISION_RANGE_LEVEL_3 = 10;
const VISION_RANGE_LEVEL_4 = 11;
const VISION_RANGE_LEVEL_5 = 12;
const VISION_RANGE_LEVEL_6 = 13;
const VISION_RANGE_LEVEL_7 = 28;
const VISION_RANGE_LEVEL_8 = 15;
const VISION_RANGE_LEVEL_9 = 16;
const VISION_RANGE_LEVEL_10 = 18;

// AI vision angle (how wide their vision cone is)
const VISION_ANGLE_LEVEL_1 = 60;
const VISION_ANGLE_LEVEL_2 = 65;
const VISION_ANGLE_LEVEL_3 = 70;
const VISION_ANGLE_LEVEL_4 = 75;
const VISION_ANGLE_LEVEL_5 = 80;
const VISION_ANGLE_LEVEL_6 = 85;
const VISION_ANGLE_LEVEL_7 = 90;
const VISION_ANGLE_LEVEL_8 = 95;
const VISION_ANGLE_LEVEL_9 = 100;
const VISION_ANGLE_LEVEL_10 = 110;
// ==========================================
// GAME CONFIGURATION - FIDDLE WITH THESE!
// All settings in one place, no magic numbers
// ==========================================

const CONFIG = {
    // ========== CORE GAME SETTINGS ==========
    game: {
        tickRate: 60,           // Fixed update rate (updates per second)
        debug: true,            // Enable debug mode
        version: '1.0.0'        // Game version
    },

    // ========== ARENA SETTINGS ==========
    arena: {
        size: 30,               // Arena size in units (30x30 square - 4x area)
        wallHeight: 6,          // How tall the walls are (2x scale)
        wallThickness: 0.4,     // How thick the walls are (2x scale)
        floorColor: 0x7cb342,   // Floor color (grass green for park theme!)
        wallColor: 0x999999,    // Wall color (gray)
        floorY: 0               // Floor Y position
    },

    // ========== CAMERA SETTINGS ==========
    camera: {
        height: 50,             // How high camera is above arena (2x scale)
        distance: 30,           // How far back camera is (2x scale)
        fov: 60,                // Field of view (degrees)
        lookAtOffset: {         // Where camera looks
            x: 0,
            y: -6,              // 2x scale to maintain same angle
            z: 0
        }
    },

    // ========== PLAYER SETTINGS ==========
    player: {
        speed: 0.15,            // Movement speed (units per frame)
        maxSpeed: 0.2,          // Maximum velocity
        acceleration: 0.01,     // How fast player speeds up
        friction: 0.9,          // How fast player slows down (0-1)
        size: {                 // Player bounding box
            width: 0.8,
            height: 1.0,
            depth: 0.8
        },
        color: 0x4a90e2,        // Player color (blue)
        spawnPosition: {        // Where player starts (middle of arena)
            x: 0,
            y: 0.5,
            z: 0
        },
        pullDistance: 2.0,      // How close to pull hunter's shirt
        pullSlowdown: 0.5       // Speed multiplier when pulling (0.5 = 50% speed)
    },

    // ========== AI SETTINGS ==========
    ai: {
        numHunters: 2,           // Number of AI hunters (they spawn evenly around arena)

        hunter: {
            speed: 0.08,         // AI movement speed (slower than player for balance)
            maxSpeed: 0.12,      // Maximum AI velocity
            acceleration: 0.008, // How fast AI speeds up
            friction: 0.9,       // How fast AI slows down
            size: {              // AI bounding box (slightly bigger than player)
                width: 0.9,
                height: 1.1,
                depth: 0.9
            },
            color: 0xff4444,     // AI color (red)
            spawnPosition: {     // Where AI hunter starts (only used if numHunters = 1)
                x: -10,          // 2x scale
                y: 0.5,
                z: 10            // 2x scale
            },
            // Patrol behavior timing
            patrolChangeTimeMin: 1500,  // Min ms before changing direction
            patrolChangeTimeMax: 3500,  // Max ms before changing direction
            wallBuffer: 0.5              // Distance to stay away from walls
        },

        vision: {
            angle: 60,           // Vision cone angle (degrees)
            distance: 12,        // How far AI can see (units)
            updateFrequency: 60, // How often to check vision (Hz)
            debugRender: false   // Draw vision cone for debugging
        },

        states: {
            huntingSpeedMultiplier: 1.5,  // Speed boost when hunting
            searchTime: 5000,              // How long to search after losing player (ms)
            memoryDecayTime: 3000          // How long to remember last position (ms)
        }
    },

    // ========== GRAPHICS SETTINGS ==========
    graphics: {
        shadows: true,                      // Enable shadows
        shadowMapSize: 1024,                // Shadow quality (512, 1024, 2048)
        ambientLightIntensity: 1.5,         // Overall scene brightness
        directionalLightIntensity: 0.6,     // Sun light strength
        backgroundColor: 0x404040           // Scene background color (dark gray)
    },

    // ========== PERFORMANCE SETTINGS ==========
    performance: {
        maxFPS: 60,                         // Frame rate cap
        maxDeltaTime: 0.1,                  // Max delta to prevent spiral of death (seconds)
        resourceCleanupInterval: 30000,     // How often to cleanup resources (ms)
        errorLogMaxEntries: 100             // Max errors to store in memory
    },

    // ========== UI SETTINGS ==========
    ui: {
        showStats: true,            // Show FPS and game stats
        showControls: true,         // Show control instructions
        showDebugInfo: false,       // Show technical debug info
        statsUpdateInterval: 1000   // How often to update UI stats (ms)
    },

    // ========== OBSTACLE SETTINGS ==========
    obstacles: {
        enabled: true,              // Generate obstacles or not
        count: 2,                   // Number of obstacles to create
        // Size ranges for procedural generation
        minWidth: 0.8,              // Minimum obstacle width
        maxWidth: 2.5,              // Maximum obstacle width
        minHeight: 0.8,             // Minimum obstacle height
        maxHeight: 1.8,             // Maximum obstacle height
        minDepth: 0.8,              // Minimum obstacle depth
        maxDepth: 2.5,              // Maximum obstacle depth
        canExclusionRadius: 3.5,    // Keep obstacles away from center can
        color: 0x8B4513             // Obstacle color (brown)
    },

    // ========== CAN (BURKEN) SETTINGS ==========
    can: {
        radius: 0.8,                // Can radius (cylinder)
        height: 1.6,                // Can height
        color: 0x8B4513,            // Swedish brown
        position: { x: 0, y: 0.8, z: 0 }  // Center of arena, elevated
    },

    // ========== INTERACTION SETTINGS ==========
    interaction: {
        maxDistance: 5.0,           // Max interaction distance
        cooldownMs: 500,            // Cooldown between interactions (ms)
        visualFeedback: true,       // Show visual feedback
        canInteractDistance: 2.0,   // How close to interact with can
        hideRadius: 2.5,            // Radius for hiding spots
        hideCapacity: 2             // Max players per hiding spot
    },

    // ========== VALIDATION SETTINGS (DISABLED) ==========
    validation: {
        enabled: false,             // Component validation disabled (KISS)
        strictMode: false           // No strict validation
    },

    // ========== DIFFICULTY SYSTEM ==========
    // 10 levels: More obstacles = easier, fewer obstacles = harder
    currentDifficulty: 1,  // Default to level 2 (Fyllekäring)

    difficulties: [
        // Level 1: Barnkalas (Children's Party)
        {
            id: 0,
            name: "Barnkalas",
            nameEnglish: "Children's Party",
            description: "Mer gömställen än barn på festen!",
            descriptionEnglish: "More hiding spots than kids at the party!",
            numHunters: HUNTERS_LEVEL_1_5,
            obstacles: {
                count: OBSTACLES_LEVEL_1,
                minDistanceBetween: 2.0,
                canExclusionRadius: CAN_EXCLUSION_LEVEL_1,
                heightScaling: {
                    nearMin: 0.3, nearMax: 0.6,  // 0-3m from can - SHORT & GREEN
                    midMin: 1.2, midMax: 2.5,    // 3-7m from can
                    farMin: 2.5, farMax: 4.5     // 7m+ from can
                }
            },
            ai: {
                patrolSpeed: PATROL_SPEED_LEVEL_1,
                chaseSpeed: CHASE_SPEED_LEVEL_1,
                visionRange: VISION_RANGE_LEVEL_1,
                visionAngle: VISION_ANGLE_LEVEL_1
            }
        },
        // Level 2: Fyllekäring på Midsommar
        {
            id: 1,
            name: "Fyllekäring på Midsommar",
            nameEnglish: "Drunk Uncle at Midsummer",
            description: "Han ser inte så bra efter alla snapsar...",
            descriptionEnglish: "Can't see well after all those shots...",
            numHunters: HUNTERS_LEVEL_1_5,
            obstacles: {
                count: OBSTACLES_LEVEL_2,
                minDistanceBetween: 2.2,
                canExclusionRadius: CAN_EXCLUSION_LEVEL_2,
                heightScaling: {
                    nearMin: 0.3, nearMax: 0.6,  // SHORT & GREEN near can
                    midMin: 1.2, midMax: 2.8,
                    farMin: 2.8, farMax: 4.5
                }
            },
            ai: {
                patrolSpeed: PATROL_SPEED_LEVEL_2,
                chaseSpeed: CHASE_SPEED_LEVEL_2,
                visionRange: VISION_RANGE_LEVEL_2,
                visionAngle: VISION_ANGLE_LEVEL_2
            }
        },
        // Level 3: Dagisfröken Övervakar
        {
            id: 2,
            name: "Dagisfröken Övervakar",
            nameEnglish: "Daycare Teacher Watching",
            description: "Hon har ögon i nacken!",
            descriptionEnglish: "She has eyes in the back of her head!",
            numHunters: HUNTERS_LEVEL_1_5,
            obstacles: {
                count: OBSTACLES_LEVEL_3,
                minDistanceBetween: 2.5,
                canExclusionRadius: CAN_EXCLUSION_LEVEL_3,
                heightScaling: {
                    nearMin: 0.3, nearMax: 0.5,  // SHORT & GREEN
                    midMin: 1.0, midMax: 2.5,
                    farMin: 2.5, farMax: 4.5
                }
            },
            ai: {
                patrolSpeed: PATROL_SPEED_LEVEL_3,
                chaseSpeed: CHASE_SPEED_LEVEL_3,
                visionRange: VISION_RANGE_LEVEL_3,
                visionAngle: VISION_ANGLE_LEVEL_3
            }
        },
        // Level 4: Kvarterspolisen
        {
            id: 3,
            name: "Kvarterspolisen",
            nameEnglish: "Neighborhood Cop",
            description: "Patrullerar som ett proffs",
            descriptionEnglish: "Patrols like a pro",
            numHunters: HUNTERS_LEVEL_1_5,
            obstacles: {
                count: OBSTACLES_LEVEL_4,
                minDistanceBetween: 2.8,
                canExclusionRadius: CAN_EXCLUSION_LEVEL_4,
                heightScaling: {
                    nearMin: 0.3, nearMax: 0.5,  // SHORT & GREEN
                    midMin: 0.8, midMax: 2.2,
                    farMin: 2.2, farMax: 4.5
                }
            },
            ai: {
                patrolSpeed: PATROL_SPEED_LEVEL_4,
                chaseSpeed: CHASE_SPEED_LEVEL_4,
                visionRange: VISION_RANGE_LEVEL_4,
                visionAngle: VISION_ANGLE_LEVEL_4
            }
        },
        // Level 5: Fotbollstränaren
        {
            id: 4,
            name: "Fotbollstränaren",
            nameEnglish: "Soccer Coach",
            description: "Ser allt från sidan!",
            descriptionEnglish: "Sees everything from the sideline!",
            numHunters: HUNTERS_LEVEL_1_5,
            obstacles: {
                count: OBSTACLES_LEVEL_5,
                minDistanceBetween: 3.0,
                canExclusionRadius: CAN_EXCLUSION_LEVEL_5,
                heightScaling: {
                    nearMin: 0.3, nearMax: 0.4,  // SUPER SHORT & GREEN
                    midMin: 0.7, midMax: 2.0,
                    farMin: 2.0, farMax: 4.0
                }
            },
            ai: {
                patrolSpeed: PATROL_SPEED_LEVEL_5,
                chaseSpeed: CHASE_SPEED_LEVEL_5,
                visionRange: VISION_RANGE_LEVEL_5,
                visionAngle: VISION_ANGLE_LEVEL_5
            }
        },
        // Level 6: Gymnasieläraren
        {
            id: 5,
            name: "Gymnasieläraren",
            nameEnglish: "High School Teacher",
            description: "Inget mobilfuskande här!",
            descriptionEnglish: "No phone cheating here!",
            numHunters: HUNTERS_LEVEL_6_10,
            obstacles: {
                count: OBSTACLES_LEVEL_6,
                minDistanceBetween: 3.5,
                canExclusionRadius: CAN_EXCLUSION_LEVEL_6,
                heightScaling: {
                    nearMin: 0.3, nearMax: 0.4,  // SUPER SHORT & GREEN
                    midMin: 0.6, midMax: 1.8,
                    farMin: 1.8, farMax: 4.0
                }
            },
            ai: {
                patrolSpeed: PATROL_SPEED_LEVEL_6,
                chaseSpeed: CHASE_SPEED_LEVEL_6,
                visionRange: VISION_RANGE_LEVEL_6,
                visionAngle: VISION_ANGLE_LEVEL_6
            }
        },
        // Level 7: Vakten på Ikea
        {
            id: 6,
            name: "Vakten på Ikea",
            nameEnglish: "IKEA Security Guard",
            description: "Övervakar alla genvägar!",
            descriptionEnglish: "Watches all the shortcuts!",
            numHunters: HUNTERS_LEVEL_6_10,
            obstacles: {
                count: OBSTACLES_LEVEL_7,
                minDistanceBetween: 8.0,
                canExclusionRadius: CAN_EXCLUSION_LEVEL_7,
                heightScaling: {
                    nearMin: 0.3, nearMax: 0.4,  // SUPER SHORT & GREEN (but far from can!)
                    midMin: 0.6, midMax: 1.5,
                    farMin: 1.5, farMax: 3.5
                }
            },
            ai: {
                patrolSpeed: PATROL_SPEED_LEVEL_7,
                chaseSpeed: CHASE_SPEED_LEVEL_7,
                visionRange: VISION_RANGE_LEVEL_7,
                visionAngle: VISION_ANGLE_LEVEL_7
            }
        },
        // Level 8: Säkerhetspolisen
        {
            id: 7,
            name: "Säkerhetspolisen",
            nameEnglish: "Secret Service",
            description: "Ser dig innan du ens ser honom...",
            descriptionEnglish: "Sees you before you see him...",
            numHunters: HUNTERS_LEVEL_6_10,
            obstacles: {
                count: OBSTACLES_LEVEL_8,
                minDistanceBetween: 5.0,
                canExclusionRadius: CAN_EXCLUSION_LEVEL_8,
                heightScaling: {
                    nearMin: 0.3, nearMax: 0.3,  // ULTRA SHORT & GREEN
                    midMin: 0.5, midMax: 1.2,
                    farMin: 1.2, farMax: 3.0
                }
            },
            ai: {
                patrolSpeed: PATROL_SPEED_LEVEL_8,
                chaseSpeed: CHASE_SPEED_LEVEL_8,
                visionRange: VISION_RANGE_LEVEL_8,
                visionAngle: VISION_ANGLE_LEVEL_8
            }
        },
        // Level 9: Guds Öga
        {
            id: 8,
            name: "Guds Öga",
            nameEnglish: "God's Eye",
            description: "Ser allt, vet allt...",
            descriptionEnglish: "Sees all, knows all...",
            numHunters: HUNTERS_LEVEL_6_10,
            obstacles: {
                count: OBSTACLES_LEVEL_9,
                minDistanceBetween: 6.0,
                canExclusionRadius: CAN_EXCLUSION_LEVEL_9,
                heightScaling: {
                    nearMin: 0.3, nearMax: 0.3,  // ULTRA SHORT & GREEN
                    midMin: 0.5, midMax: 1.0,
                    farMin: 1.0, farMax: 2.5
                }
            },
            ai: {
                patrolSpeed: PATROL_SPEED_LEVEL_9,
                chaseSpeed: CHASE_SPEED_LEVEL_9,
                visionRange: VISION_RANGE_LEVEL_9,
                visionAngle: VISION_ANGLE_LEVEL_9
            }
        },
        // Level 10: Systemet Stänger om 5 Minuter
        {
            id: 9,
            name: "Systemet Stänger om 5 Minuter",
            nameEnglish: "Liquor Store Closing in 5 Minutes",
            description: "Full panik! Ingen tid för gömlek!",
            descriptionEnglish: "Full panic! No time for hide and seek!",
            numHunters: HUNTERS_LEVEL_6_10,
            obstacles: {
                count: OBSTACLES_LEVEL_10,
                minDistanceBetween: 8.0,
                canExclusionRadius: CAN_EXCLUSION_LEVEL_10,
                heightScaling: {
                    nearMin: 0.3, nearMax: 0.3,  // ULTRA SHORT & GREEN
                    midMin: 0.5, midMax: 0.8,
                    farMin: 0.8, farMax: 2.0
                }
            },
            ai: {
                patrolSpeed: PATROL_SPEED_LEVEL_10,
                chaseSpeed: CHASE_SPEED_LEVEL_10,
                visionRange: VISION_RANGE_LEVEL_10,
                visionAngle: VISION_ANGLE_LEVEL_10
            }
        }
    ]
};

// Add missing obstacle settings that arena.js needs
CONFIG.obstacles.minDistanceFromWalls = 1.0;
CONFIG.obstacles.minDistanceBetween = 2.0;
CONFIG.obstacles.maxPlacementAttempts = 100;
CONFIG.obstacles.material = 'standard';  // 'standard', 'phong', 'lambert'

// ==========================================
// SIMPLE HELPER FUNCTIONS
// ==========================================

// Simple getter function with dot notation support
function getConfig(path, defaultValue) {
    const keys = path.split('.');
    let value = CONFIG;

    for (const key of keys) {
        if (value === undefined || value === null) {
            return defaultValue;
        }
        value = value[key];
    }

    return value !== undefined ? value : defaultValue;
}

// Simple setter function
function setConfig(path, value) {
    const keys = path.split('.');
    let target = CONFIG;

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in target)) {
            target[key] = {};
        }
        target = target[key];
    }

    target[keys[keys.length - 1]] = value;
    return true;
}

// ==========================================
// COMPATIBILITY SHIM FOR MIGRATION
// Allows old ConfigManager code to work during transition
// ==========================================

class ConfigManager {
    static getInstance() {
        if (!ConfigManager._instance) {
            ConfigManager._instance = new ConfigManager();
        }
        return ConfigManager._instance;
    }

    get(path, defaultValue) {
        return getConfig(path, defaultValue);
    }

    set(path, value) {
        return setConfig(path, value);
    }

    getStats() {
        return {
            totalKeys: Object.keys(CONFIG).length,
            type: 'Simple KISS Config'
        };
    }

    debugLogConfig() {
        console.log('=== SIMPLE CONFIG (KISS) ===');
        console.log(CONFIG);
        console.log('=== END CONFIG ===');
    }
}

// ==========================================
// MAKE GLOBALLY AVAILABLE
// ==========================================

window.ConfigManager = ConfigManager;  // Compatibility shim
window.CONFIG = CONFIG;                // Direct access (preferred)
window.getConfig = getConfig;          // Helper function
window.setConfig = setConfig;          // Helper function

// Export for module systems (if used in future)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, getConfig, setConfig, ConfigManager };
}