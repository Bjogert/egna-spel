/* ==========================================
   BOLLEN I BURKEN - SIMPLE CONFIGURATION
   KISS: Plain JavaScript object configuration
   ========================================== */

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
        floorColor: 0xcccccc,   // Floor color (light gray)
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
        spawnPosition: {        // Where player starts
            x: 0,
            y: 0.5,
            z: 0
        }
    },

    // ========== AI SETTINGS ==========
    ai: {
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
            spawnPosition: {     // Where AI hunter starts
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
            obstacles: {
                count: 45,
                minDistanceBetween: 2.0,
                canExclusionRadius: 3.0,
                heightScaling: {
                    nearMin: 0.5, nearMax: 1.2,  // 0-3m from can
                    midMin: 1.2, midMax: 2.5,    // 3-7m from can
                    farMin: 2.5, farMax: 4.5     // 7m+ from can
                }
            },
            ai: {
                patrolSpeed: 0.06,
                chaseSpeed: 0.10,
                visionRange: 8,
                visionAngle: 60
            }
        },
        // Level 2: Fyllekäring på Midsommar
        {
            id: 1,
            name: "Fyllekäring på Midsommar",
            nameEnglish: "Drunk Uncle at Midsummer",
            description: "Han ser inte så bra efter alla snapsar...",
            descriptionEnglish: "Can't see well after all those shots...",
            obstacles: {
                count: 35,
                minDistanceBetween: 2.2,
                canExclusionRadius: 3.5,
                heightScaling: {
                    nearMin: 0.5, nearMax: 1.2,
                    midMin: 1.2, midMax: 2.8,
                    farMin: 2.8, farMax: 4.5
                }
            },
            ai: {
                patrolSpeed: 0.07,
                chaseSpeed: 0.11,
                visionRange: 9,
                visionAngle: 65
            }
        },
        // Level 3: Dagisfröken Övervakar
        {
            id: 2,
            name: "Dagisfröken Övervakar",
            nameEnglish: "Daycare Teacher Watching",
            description: "Hon har ögon i nacken!",
            descriptionEnglish: "She has eyes in the back of her head!",
            obstacles: {
                count: 28,
                minDistanceBetween: 2.5,
                canExclusionRadius: 4.0,
                heightScaling: {
                    nearMin: 0.5, nearMax: 1.0,
                    midMin: 1.0, midMax: 2.5,
                    farMin: 2.5, farMax: 4.5
                }
            },
            ai: {
                patrolSpeed: 0.08,
                chaseSpeed: 0.12,
                visionRange: 10,
                visionAngle: 70
            }
        },
        // Level 4: Kvarterspolisen
        {
            id: 3,
            name: "Kvarterspolisen",
            nameEnglish: "Neighborhood Cop",
            description: "Patrullerar som ett proffs",
            descriptionEnglish: "Patrols like a pro",
            obstacles: {
                count: 22,
                minDistanceBetween: 2.8,
                canExclusionRadius: 4.5,
                heightScaling: {
                    nearMin: 0.5, nearMax: 0.8,
                    midMin: 0.8, midMax: 2.2,
                    farMin: 2.2, farMax: 4.5
                }
            },
            ai: {
                patrolSpeed: 0.09,
                chaseSpeed: 0.13,
                visionRange: 11,
                visionAngle: 75
            }
        },
        // Level 5: Fotbollstränaren
        {
            id: 4,
            name: "Fotbollstränaren",
            nameEnglish: "Soccer Coach",
            description: "Ser allt från sidan!",
            descriptionEnglish: "Sees everything from the sideline!",
            obstacles: {
                count: 18,
                minDistanceBetween: 3.0,
                canExclusionRadius: 5.0,
                heightScaling: {
                    nearMin: 0.5, nearMax: 0.7,
                    midMin: 0.7, midMax: 2.0,
                    farMin: 2.0, farMax: 4.0
                }
            },
            ai: {
                patrolSpeed: 0.10,
                chaseSpeed: 0.15,
                visionRange: 12,
                visionAngle: 80
            }
        },
        // Level 6: Gymnasieläraren
        {
            id: 5,
            name: "Gymnasieläraren",
            nameEnglish: "High School Teacher",
            description: "Inget mobilfuskande här!",
            descriptionEnglish: "No phone cheating here!",
            obstacles: {
                count: 14,
                minDistanceBetween: 3.5,
                canExclusionRadius: 5.5,
                heightScaling: {
                    nearMin: 0.5, nearMax: 0.6,
                    midMin: 0.6, midMax: 1.8,
                    farMin: 1.8, farMax: 4.0
                }
            },
            ai: {
                patrolSpeed: 0.11,
                chaseSpeed: 0.17,
                visionRange: 13,
                visionAngle: 85
            }
        },
        // Level 7: Vakten på Ikea
        {
            id: 6,
            name: "Vakten på Ikea",
            nameEnglish: "IKEA Security Guard",
            description: "Övervakar alla genvägar!",
            descriptionEnglish: "Watches all the shortcuts!",
            obstacles: {
                count: 10,                  // Keep same (user wants "way less")
                minDistanceBetween: 8.0,    // 2x scale (was 4.0)
                canExclusionRadius: 12.0,   // 2x scale (was 6.0)
                heightScaling: {
                    nearMin: 0.5, nearMax: 0.6,
                    midMin: 0.6, midMax: 1.5,
                    farMin: 1.5, farMax: 3.5
                }
            },
            ai: {
                patrolSpeed: 0.18,          // Increased for more threatening patrol
                chaseSpeed: 0.20,           // Slightly faster chase
                visionRange: 28,            // 2x scale (was 14)
                visionAngle: 90
            }
        },
        // Level 8: Säkerhetspolisen
        {
            id: 7,
            name: "Säkerhetspolisen",
            nameEnglish: "Secret Service",
            description: "Ser dig innan du ens ser honom...",
            descriptionEnglish: "Sees you before you see him...",
            obstacles: {
                count: 7,
                minDistanceBetween: 5.0,
                canExclusionRadius: 7.0,
                heightScaling: {
                    nearMin: 0.5, nearMax: 0.5,
                    midMin: 0.5, midMax: 1.2,
                    farMin: 1.2, farMax: 3.0
                }
            },
            ai: {
                patrolSpeed: 0.13,
                chaseSpeed: 0.20,
                visionRange: 15,
                visionAngle: 95
            }
        },
        // Level 9: Guds Öga
        {
            id: 8,
            name: "Guds Öga",
            nameEnglish: "God's Eye",
            description: "Ser allt, vet allt...",
            descriptionEnglish: "Sees all, knows all...",
            obstacles: {
                count: 4,
                minDistanceBetween: 6.0,
                canExclusionRadius: 8.0,
                heightScaling: {
                    nearMin: 0.5, nearMax: 0.5,
                    midMin: 0.5, midMax: 1.0,
                    farMin: 1.0, farMax: 2.5
                }
            },
            ai: {
                patrolSpeed: 0.14,
                chaseSpeed: 0.22,
                visionRange: 16,
                visionAngle: 100
            }
        },
        // Level 10: Systemet Stänger om 5 Minuter
        {
            id: 9,
            name: "Systemet Stänger om 5 Minuter",
            nameEnglish: "Liquor Store Closing in 5 Minutes",
            description: "Full panik! Ingen tid för gömlek!",
            descriptionEnglish: "Full panic! No time for hide and seek!",
            obstacles: {
                count: 2,
                minDistanceBetween: 8.0,
                canExclusionRadius: 10.0,
                heightScaling: {
                    nearMin: 0.5, nearMax: 0.5,
                    midMin: 0.5, midMax: 0.8,
                    farMin: 0.8, farMax: 2.0  // Even far obstacles are low = PANIC!
                }
            },
            ai: {
                patrolSpeed: 0.15,
                chaseSpeed: 0.25,
                visionRange: 18,
                visionAngle: 110
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