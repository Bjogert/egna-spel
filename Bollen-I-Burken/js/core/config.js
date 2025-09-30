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
        size: 15,               // Arena size in units (15x15 square)
        wallHeight: 3,          // How tall the walls are
        wallThickness: 0.2,     // How thick the walls are
        floorColor: 0xcccccc,   // Floor color (light gray)
        wallColor: 0x999999,    // Wall color (gray)
        floorY: 0               // Floor Y position
    },

    // ========== CAMERA SETTINGS ==========
    camera: {
        height: 25,             // How high camera is above arena
        distance: 15,           // How far back camera is
        fov: 60,                // Field of view (degrees)
        lookAtOffset: {         // Where camera looks
            x: 0,
            y: -3,
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
                x: -5,
                y: 0.5,
                z: 5
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
    }
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