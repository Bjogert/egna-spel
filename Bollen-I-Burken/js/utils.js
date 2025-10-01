/* ==========================================
   BOLLEN I BURKEN - UTILITIES
   Helper functions and constants
   ========================================== */

// Game Constants
const GAME_CONFIG = {
    ARENA_SIZE: 15,           // Bigger arena for more movement space
    PLAYER_SPEED: 0.15,       // Slightly faster movement for bigger arena
    TICK_RATE: 60,
    CANVAS_WIDTH: 1200,       // Bigger canvas than 800x600
    CANVAS_HEIGHT: 800,       // Bigger canvas than 800x600
    CAMERA_HEIGHT: 25,        // Lower camera for closer view
    CAMERA_DISTANCE: 15       // Much closer to arena
};

// Game States
const GAME_STATES = {
    LOADING: 'loading',
    START_MENU: 'start_menu',
    COUNTDOWN: 'countdown',  // Hunter counting before game starts
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over'
};

// Player States
const PLAYER_STATES = {
    IDLE: 'idle',
    MOVING: 'moving',
    HIDING: 'hiding',
    SEEKING: 'seeking',
    FOUND: 'found'
};

// Utility Functions
class Utils {
    // Vector math utilities
    static vector3(x = 0, y = 0, z = 0) {
        return { x, y, z };
    }

    static vectorAdd(a, b) {
        return {
            x: a.x + b.x,
            y: a.y + b.y,
            z: a.z + b.z
        };
    }

    static vectorSubtract(a, b) {
        return {
            x: a.x - b.x,
            y: a.y - b.y,
            z: a.z - b.z
        };
    }

    static vectorMultiply(v, scalar) {
        return {
            x: v.x * scalar,
            y: v.y * scalar,
            z: v.z * scalar
        };
    }

    static vectorLength(v) {
        return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    }

    static vectorNormalize(v) {
        const length = Utils.vectorLength(v);
        if (length === 0) return Utils.vector3();
        return Utils.vectorMultiply(v, 1 / length);
    }

    static vectorDistance(a, b) {
        return Utils.vectorLength(Utils.vectorSubtract(a, b));
    }

    // Collision detection utilities
    static pointInSquare(point, center, size) {
        const halfSize = size / 2;
        return (
            point.x >= center.x - halfSize &&
            point.x <= center.x + halfSize &&
            point.z >= center.z - halfSize &&
            point.z <= center.z + halfSize
        );
    }

    static clampToSquare(position, center, size) {
        const halfSize = size / 2;
        return {
            x: Math.max(center.x - halfSize, Math.min(center.x + halfSize, position.x)),
            y: position.y,
            z: Math.max(center.z - halfSize, Math.min(center.z + halfSize, position.z))
        };
    }

    // Interpolation utilities
    static lerp(a, b, t) {
        return a + (b - a) * t;
    }

    static lerpVector(a, b, t) {
        return {
            x: Utils.lerp(a.x, b.x, t),
            y: Utils.lerp(a.y, b.y, t),
            z: Utils.lerp(a.z, b.z, t)
        };
    }

    // Angle utilities (for rotation)
    static degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

    static radToDeg(radians) {
        return radians * 180 / Math.PI;
    }

    static normalizeAngle(angle) {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    }

    // Random utilities
    static randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    // Time utilities
    static now() {
        return performance.now();
    }

    static formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Debug utilities
    static log(message, data = null) {
        if (typeof DEBUG !== 'undefined' && DEBUG) {
            console.log(`[Game] ${message}`, data || '');
        }
    }

    static warn(message, data = null) {
        console.warn(`[Game Warning] ${message}`, data || '');
    }

    static error(message, error = null) {
        console.error(`[Game Error] ${message}`, error || '');
    }

    // DOM utilities
    static getElementById(id) {
        const element = document.getElementById(id);
        if (!element) {
            Utils.error(`Element with id '${id}' not found`);
        }
        return element;
    }

    static createElement(tag, className = '', textContent = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (textContent) element.textContent = textContent;
        return element;
    }

    // Network utilities (for future multiplayer)
    static generatePlayerId() {
        return 'player_' + Math.random().toString(36).substr(2, 9);
    }

    static serializeGameState(gameState) {
        // Basic serialization - will be expanded for networking
        return JSON.stringify({
            tick: gameState.currentTick,
            players: Array.from(gameState.players.entries())
        });
    }

    static deserializeGameState(data) {
        try {
            return JSON.parse(data);
        } catch (error) {
            Utils.error('Failed to deserialize game state', error);
            return null;
        }
    }

    // Performance utilities
    static throttle(func, limit) {
        let inThrottle;
        return function () {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    static debounce(func, wait) {
        let timeout;
        return function () {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                func.apply(context, args);
            }, wait);
        };
    }
}

// Export for module systems or global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Utils, GAME_CONFIG, GAME_STATES, PLAYER_STATES };
} else {
    window.GameUtils = { Utils, GAME_CONFIG, GAME_STATES, PLAYER_STATES };
}
