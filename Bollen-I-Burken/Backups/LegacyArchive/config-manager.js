/* ==========================================
   BOLLEN I BURKEN - CONFIGURATION MANAGER
   Enterprise-grade configuration management system
   ========================================== */

/**
 * Configuration Schema Definitions
 * Type-safe configuration with validation
 */
const CONFIG_SCHEMA = {
    // Game Core Settings
    game: {
        tickRate: { type: 'number', min: 30, max: 120, default: 60 },
        debug: { type: 'boolean', default: true },
        version: { type: 'string', default: '1.0.0' }
    },

    // Arena Configuration
    arena: {
        size: { type: 'number', min: 10, max: 50, default: 15 },
        wallHeight: { type: 'number', min: 1, max: 10, default: 3 },
        wallThickness: { type: 'number', min: 0.1, max: 1, default: 0.2 },
        floorColor: { type: 'color', default: 0xcccccc },
        wallColor: { type: 'color', default: 0x999999 }
    },

    // Camera Settings
    camera: {
        height: { type: 'number', min: 5, max: 50, default: 25 },
        distance: { type: 'number', min: 5, max: 30, default: 15 },
        fov: { type: 'number', min: 30, max: 120, default: 60 },
        lookAtOffset: { type: 'object', default: { x: 0, y: -3, z: 0 } }
    },

    // Player Configuration
    player: {
        speed: { type: 'number', min: 0.05, max: 0.5, default: 0.15 },
        size: { type: 'object', default: { width: 0.8, height: 1.0, depth: 0.8 } },
        color: { type: 'color', default: 0x4a90e2 },
        spawnPosition: { type: 'object', default: { x: 0, y: 0.5, z: 0 } }
    },

    // AI Configuration
    ai: {
        hunter: {
            speed: { type: 'number', min: 0.03, max: 0.2, default: 0.08 },
            size: { type: 'object', default: { width: 0.9, height: 1.1, depth: 0.9 } },
            color: { type: 'color', default: 0xff4444 },
            spawnPosition: { type: 'object', default: { x: -5, y: 0.5, z: 5 } },
            patrolChangeTimeMin: { type: 'number', min: 500, max: 5000, default: 1500 },
            patrolChangeTimeMax: { type: 'number', min: 1000, max: 10000, default: 3500 }
        },
        vision: {
            angle: { type: 'number', min: 30, max: 180, default: 60 },
            distance: { type: 'number', min: 5, max: 25, default: 12 },
            updateFrequency: { type: 'number', min: 30, max: 60, default: 60 },
            debugRender: { type: 'boolean', default: false }
        },
        states: {
            huntingSpeedMultiplier: { type: 'number', min: 1, max: 3, default: 1.5 },
            searchTime: { type: 'number', min: 2000, max: 10000, default: 5000 },
            memoryDecayTime: { type: 'number', min: 1000, max: 8000, default: 3000 }
        }
    },

    // Graphics Settings
    graphics: {
        shadows: { type: 'boolean', default: true },
        shadowMapSize: { type: 'number', min: 512, max: 2048, default: 1024 },
        ambientLightIntensity: { type: 'number', min: 0.1, max: 2, default: 1.5 },
        directionalLightIntensity: { type: 'number', min: 0.1, max: 2, default: 0.6 },
        backgroundColor: { type: 'color', default: 0x404040 }
    },

    // Performance Settings
    performance: {
        maxFPS: { type: 'number', min: 30, max: 144, default: 60 },
        resourceCleanupInterval: { type: 'number', min: 5000, max: 60000, default: 30000 },
        errorLogMaxEntries: { type: 'number', min: 50, max: 500, default: 100 }
    },

    // UI Configuration
    ui: {
        showStats: { type: 'boolean', default: true },
        showControls: { type: 'boolean', default: true },
        showDebugInfo: { type: 'boolean', default: false },
        statsUpdateInterval: { type: 'number', min: 100, max: 2000, default: 1000 }
    },

    // Obstacle Configuration (Swedish Playground Objects)
    obstacles: {
        // Generation Control
        enabled: { type: 'boolean', default: true }, // Re-enabled with ComponentValidator fix applied
        count: { type: 'number', min: 0, max: 50, default: 2 }, // Even smaller count for testing

        // Size Ranges (Fully Configurable - No Magic Numbers!)
        minWidth: { type: 'number', min: 0.5, max: 3, default: 0.8 },
        maxWidth: { type: 'number', min: 0.5, max: 5, default: 2.5 },
        minHeight: { type: 'number', min: 0.5, max: 3, default: 0.8 },
        maxHeight: { type: 'number', min: 0.5, max: 4, default: 1.8 },
        minDepth: { type: 'number', min: 0.5, max: 3, default: 0.8 },
        maxDepth: { type: 'number', min: 0.5, max: 5, default: 2.5 },

        // Placement Control (Swedish Playground Layout)
        canExclusionRadius: { type: 'number', min: 2, max: 10, default: 4 },
        minDistanceFromWalls: { type: 'number', min: 0.5, max: 3, default: 1.0 },
        minDistanceBetween: { type: 'number', min: 0.5, max: 3, default: 1.5 },

        // Generation Attempts (Prevent Infinite Loops)
        maxPlacementAttempts: { type: 'number', min: 100, max: 1000, default: 300 },

        // Visual Properties (Swedish Playground Style)
        color: { type: 'color', default: 0x8B4513 }, // Swedish brown
        material: { type: 'string', default: 'lambert' }
    }
};

/**
 * Configuration Value Types
 */
const CONFIG_TYPES = {
    number: (value, schema) => {
        const num = Number(value);
        if (isNaN(num)) return null;
        if (schema.min !== undefined && num < schema.min) return schema.min;
        if (schema.max !== undefined && num > schema.max) return schema.max;
        return num;
    },
    boolean: (value) => {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
            return value.toLowerCase() === 'true' || value === '1';
        }
        return Boolean(value);
    },
    string: (value) => {
        return String(value);
    },
    color: (value) => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            // Handle hex colors
            if (value.startsWith('#')) {
                return parseInt(value.substring(1), 16);
            }
            if (value.startsWith('0x')) {
                return parseInt(value, 16);
            }
        }
        return Number(value) || 0x000000;
    },
    object: (value) => {
        if (typeof value === 'object' && value !== null) return value;
        try {
            return JSON.parse(value);
        } catch {
            return {};
        }
    }
};

/**
 * Enterprise Configuration Manager
 * Patterns: Singleton + Observer + Strategy + Validation
 */
class ConfigManager {
    constructor() {
        if (ConfigManager.instance) {
            return ConfigManager.instance;
        }

        // Configuration storage
        this.config = new Map();
        this.schema = CONFIG_SCHEMA;
        this.observers = new Set();

        // Configuration sources (Strategy pattern)
        this.sources = new Map();

        // Change tracking
        this.changeHistory = [];
        this.maxHistoryEntries = 100;

        // Validation settings
        this.strictValidation = true;
        this.allowUnknownKeys = false;

        // Performance tracking
        this.accessCounts = new Map();
        this.lastAccessed = new Map();

        ConfigManager.instance = this;
        this.initializeDefaultConfig();

        Utils.log('ConfigManager initialized (Enterprise patterns)');
    }

    /**
     * Initialize configuration with default values
     */
    initializeDefaultConfig() {
        this.loadDefaults(this.schema, '');
    }

    /**
     * Recursively load default values from schema
     */
    loadDefaults(schema, prefix) {
        for (const [key, value] of Object.entries(schema)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;

            if (value.default !== undefined) {
                // This is a configuration value
                this.config.set(fullKey, value.default);
            } else if (typeof value === 'object' && value !== null) {
                // This is a nested configuration section
                this.loadDefaults(value, fullKey);
            }
        }
    }

    /**
     * Get configuration value with path notation
     * @param {string} path - Configuration path (e.g., 'ai.hunter.speed')
     * @param {*} defaultValue - Default value if not found
     * @returns {*} Configuration value
     */
    get(path, defaultValue = undefined) {
        try {
            // Track access for performance monitoring
            this.trackAccess(path);

            // Get value from config
            const value = this.config.get(path);

            if (value !== undefined) {
                return value;
            }

            // Return default if provided
            if (defaultValue !== undefined) {
                return defaultValue;
            }

            // Look for default in schema
            const schemaValue = this.getSchemaValue(path);
            if (schemaValue && schemaValue.default !== undefined) {
                return schemaValue.default;
            }

            // Log warning for missing config
            const errorHandler = ErrorHandler.getInstance();
            errorHandler.handle(new ValidationError(`Configuration key not found: ${path}`, {
                path: path,
                availableKeys: Array.from(this.config.keys()).slice(0, 10)
            }), 'WARN');

            return undefined;

        } catch (error) {
            const errorHandler = ErrorHandler.getInstance();
            errorHandler.handle(new ValidationError(`Config get error: ${path}`, {
                path: path,
                error: error.message
            }), 'ERROR');
            return defaultValue;
        }
    }

    /**
     * Set configuration value with validation
     * @param {string} path - Configuration path
     * @param {*} value - Value to set
     * @param {Object} options - Options for setting
     * @returns {boolean} Success status
     */
    set(path, value, options = {}) {
        try {
            const oldValue = this.config.get(path);

            // Validate value if schema exists
            const validatedValue = this.validateValue(path, value);
            if (validatedValue === null && this.strictValidation) {
                throw new ValidationError(`Invalid value for ${path}: ${value}`);
            }

            // Set the value
            this.config.set(path, validatedValue || value);

            // Record change history
            this.recordChange(path, oldValue, validatedValue || value, options);

            // Notify observers
            this.notifyObservers(path, validatedValue || value, oldValue);

            Utils.log(`Config updated: ${path} = ${JSON.stringify(validatedValue || value)}`);
            return true;

        } catch (error) {
            const errorHandler = ErrorHandler.getInstance();
            errorHandler.handle(new ValidationError(`Config set error: ${path}`, {
                path: path,
                value: value,
                error: error.message
            }), 'ERROR');
            return false;
        }
    }

    /**
     * Set multiple configuration values at once
     * @param {Object} configObject - Object with configuration values
     * @param {string} prefix - Optional prefix for all keys
     * @returns {boolean} Success status
     */
    setMultiple(configObject, prefix = '') {
        let success = true;

        for (const [key, value] of Object.entries(configObject)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;

            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                // Recursively set nested objects
                success = this.setMultiple(value, fullKey) && success;
            } else {
                success = this.set(fullKey, value) && success;
            }
        }

        return success;
    }

    /**
     * Validate configuration value against schema
     * @param {string} path - Configuration path
     * @param {*} value - Value to validate
     * @returns {*} Validated value or null if invalid
     */
    validateValue(path, value) {
        const schemaValue = this.getSchemaValue(path);
        if (!schemaValue || !schemaValue.type) {
            return value; // No validation available
        }

        const validator = CONFIG_TYPES[schemaValue.type];
        if (!validator) {
            return value; // Unknown type
        }

        return validator(value, schemaValue);
    }

    /**
     * Get schema value for a configuration path
     * @param {string} path - Configuration path
     * @returns {Object|null} Schema definition
     */
    getSchemaValue(path) {
        const parts = path.split('.');
        let current = this.schema;

        for (const part of parts) {
            if (current[part]) {
                current = current[part];
            } else {
                return null;
            }
        }

        return current.type ? current : null;
    }

    /**
     * Track configuration access for performance monitoring
     * @param {string} path - Configuration path
     */
    trackAccess(path) {
        const count = this.accessCounts.get(path) || 0;
        this.accessCounts.set(path, count + 1);
        this.lastAccessed.set(path, Date.now());
    }

    /**
     * Record configuration change for history tracking
     * @param {string} path - Configuration path
     * @param {*} oldValue - Previous value
     * @param {*} newValue - New value
     * @param {Object} options - Change options
     */
    recordChange(path, oldValue, newValue, options) {
        const change = {
            timestamp: Date.now(),
            path: path,
            oldValue: oldValue,
            newValue: newValue,
            source: options.source || 'manual',
            user: options.user || 'system'
        };

        this.changeHistory.push(change);

        // Keep history size manageable
        if (this.changeHistory.length > this.maxHistoryEntries) {
            this.changeHistory.shift();
        }
    }

    /**
     * Add configuration observer (Observer pattern)
     * @param {Function} observer - Observer function
     * @param {string} pathFilter - Optional path filter
     */
    addObserver(observer, pathFilter = null) {
        const wrappedObserver = {
            callback: observer,
            pathFilter: pathFilter
        };
        this.observers.add(wrappedObserver);
    }

    /**
     * Remove configuration observer
     * @param {Function} observer - Observer function
     */
    removeObserver(observer) {
        for (const wrappedObserver of this.observers) {
            if (wrappedObserver.callback === observer) {
                this.observers.delete(wrappedObserver);
                break;
            }
        }
    }

    /**
     * Notify observers of configuration changes
     * @param {string} path - Configuration path
     * @param {*} newValue - New value
     * @param {*} oldValue - Previous value
     */
    notifyObservers(path, newValue, oldValue) {
        for (const observer of this.observers) {
            try {
                // Check path filter
                if (observer.pathFilter && !path.startsWith(observer.pathFilter)) {
                    continue;
                }

                observer.callback(path, newValue, oldValue);
            } catch (error) {
                const errorHandler = ErrorHandler.getInstance();
                errorHandler.handle(new GameError('Config observer error', ERROR_CATEGORIES.SYSTEM, {
                    path: path,
                    error: error.message
                }), 'ERROR');
            }
        }
    }

    /**
     * Add configuration source (Strategy pattern)
     * @param {string} name - Source name
     * @param {Object} source - Source implementation
     */
    addSource(name, source) {
        this.sources.set(name, source);
    }

    /**
     * Load configuration from a source
     * @param {string} sourceName - Source name
     * @param {Object} options - Load options
     * @returns {Promise<boolean>} Success status
     */
    async loadFromSource(sourceName, options = {}) {
        try {
            const source = this.sources.get(sourceName);
            if (!source) {
                throw new Error(`Configuration source not found: ${sourceName}`);
            }

            const configData = await source.load(options);
            return this.setMultiple(configData);

        } catch (error) {
            const errorHandler = ErrorHandler.getInstance();
            errorHandler.handle(new GameError(`Config load error from ${sourceName}`, ERROR_CATEGORIES.SYSTEM, {
                source: sourceName,
                error: error.message
            }), 'ERROR');
            return false;
        }
    }

    /**
     * Save configuration to a source
     * @param {string} sourceName - Source name
     * @param {Object} options - Save options
     * @returns {Promise<boolean>} Success status
     */
    async saveToSource(sourceName, options = {}) {
        try {
            const source = this.sources.get(sourceName);
            if (!source) {
                throw new Error(`Configuration source not found: ${sourceName}`);
            }

            const configData = this.exportConfig();
            return await source.save(configData, options);

        } catch (error) {
            const errorHandler = ErrorHandler.getInstance();
            errorHandler.handle(new GameError(`Config save error to ${sourceName}`, ERROR_CATEGORIES.SYSTEM, {
                source: sourceName,
                error: error.message
            }), 'ERROR');
            return false;
        }
    }

    /**
     * Reset configuration to defaults
     * @param {string} path - Optional path to reset (resets all if not provided)
     */
    reset(path = null) {
        if (path) {
            // Reset specific path
            const schemaValue = this.getSchemaValue(path);
            if (schemaValue && schemaValue.default !== undefined) {
                this.set(path, schemaValue.default, { source: 'reset' });
            }
        } else {
            // Reset all configuration
            this.config.clear();
            this.initializeDefaultConfig();
            Utils.log('Configuration reset to defaults');
        }
    }

    /**
     * Export current configuration
     * @param {string} section - Optional section to export
     * @returns {Object} Configuration object
     */
    exportConfig(section = null) {
        const result = {};

        for (const [path, value] of this.config.entries()) {
            if (section && !path.startsWith(section)) {
                continue;
            }

            // Convert flat path to nested object
            const parts = path.split('.');
            let current = result;

            for (let i = 0; i < parts.length - 1; i++) {
                if (!current[parts[i]]) {
                    current[parts[i]] = {};
                }
                current = current[parts[i]];
            }

            current[parts[parts.length - 1]] = value;
        }

        return result;
    }

    /**
     * Get configuration schema
     * @param {string} section - Optional section
     * @returns {Object} Schema object
     */
    getSchema(section = null) {
        if (section) {
            const parts = section.split('.');
            let current = this.schema;

            for (const part of parts) {
                if (current[part]) {
                    current = current[part];
                } else {
                    return null;
                }
            }

            return current;
        }

        return this.schema;
    }

    /**
     * Get configuration statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        return {
            totalKeys: this.config.size,
            accessCounts: Object.fromEntries(this.accessCounts),
            changeHistory: this.changeHistory.slice(-10), // Last 10 changes
            observersCount: this.observers.size,
            sourcesCount: this.sources.size,
            memoryUsage: {
                configSize: this.config.size,
                historySize: this.changeHistory.length,
                lastAccessed: this.lastAccessed.size
            }
        };
    }

    /**
     * Validate entire configuration against schema
     * @returns {Object} Validation results
     */
    validateAll() {
        const results = {
            valid: true,
            errors: [],
            warnings: []
        };

        for (const [path, value] of this.config.entries()) {
            const validatedValue = this.validateValue(path, value);

            if (validatedValue === null) {
                results.valid = false;
                results.errors.push({
                    path: path,
                    value: value,
                    message: 'Invalid value'
                });
            } else if (validatedValue !== value) {
                results.warnings.push({
                    path: path,
                    original: value,
                    corrected: validatedValue,
                    message: 'Value was corrected'
                });
            }
        }

        return results;
    }

    /**
     * Debug method to log configuration state
     */
    debugLogConfig() {
        Utils.log('=== CONFIGURATION MANAGER DEBUG ===');

        Utils.log('Current Configuration:');
        for (const [path, value] of this.config.entries()) {
            Utils.log(`  ${path}: ${JSON.stringify(value)}`);
        }

        Utils.log('Statistics:', this.getStats());
        Utils.log('Recent Changes:', this.changeHistory.slice(-5));
        Utils.log('=== END CONFIG DEBUG ===');
    }
}

/**
 * Configuration Source Implementations
 */

/**
 * LocalStorage Configuration Source
 */
class LocalStorageConfigSource {
    constructor(key = 'bollen-i-burken-config') {
        this.storageKey = key;
    }

    async load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            throw new Error(`Failed to load from localStorage: ${error.message}`);
        }
    }

    async save(configData) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(configData, null, 2));
            return true;
        } catch (error) {
            throw new Error(`Failed to save to localStorage: ${error.message}`);
        }
    }
}

/**
 * URL Parameters Configuration Source
 */
class URLConfigSource {
    async load() {
        const params = new URLSearchParams(window.location.search);
        const config = {};

        for (const [key, value] of params.entries()) {
            if (key.startsWith('config.')) {
                const configKey = key.substring(7); // Remove 'config.' prefix
                config[configKey] = this.parseValue(value);
            }
        }

        return config;
    }

    parseValue(value) {
        // Try to parse as JSON first
        try {
            return JSON.parse(value);
        } catch {
            // Return as string if JSON parsing fails
            return value;
        }
    }

    async save() {
        // URL source is read-only
        throw new Error('URLConfigSource is read-only');
    }
}

// Singleton instance access
ConfigManager.getInstance = function() {
    if (!ConfigManager.instance) {
        new ConfigManager();
    }
    return ConfigManager.instance;
};

// Export for module systems or global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ConfigManager, LocalStorageConfigSource, URLConfigSource,
        CONFIG_SCHEMA, CONFIG_TYPES
    };
} else {
    window.GameConfig = {
        ConfigManager, LocalStorageConfigSource, URLConfigSource,
        CONFIG_SCHEMA, CONFIG_TYPES
    };
}