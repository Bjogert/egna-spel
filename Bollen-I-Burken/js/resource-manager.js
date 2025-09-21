/* ==========================================
   BOLLEN I BURKEN - RESOURCE MANAGER
   Enterprise-grade Three.js resource lifecycle management
   ========================================== */

/**
 * Enterprise Resource Manager
 * Implements: Singleton + Observer + Factory patterns
 * Purpose: Centralized Three.js object lifecycle management
 * Benefits: Memory leak prevention, performance monitoring, clean disposal
 */
class ResourceManager {
    constructor() {
        if (ResourceManager.instance) {
            return ResourceManager.instance;
        }

        // Resource tracking by type
        this.resources = {
            geometries: new Map(),
            materials: new Map(),
            textures: new Map(),
            meshes: new Map(),
            lights: new Map(),
            scenes: new Map()
        };

        // Resource factories for consistent creation
        this.factories = new Map();

        // Observers for resource lifecycle events
        this.observers = new Set();

        // Performance tracking
        this.stats = {
            created: { total: 0, byType: {} },
            disposed: { total: 0, byType: {} },
            active: { total: 0, byType: {} }
        };

        ResourceManager.instance = this;
        this.initializeFactories();

        Utils.log('ResourceManager initialized (Singleton pattern)');
    }

    /**
     * Get correct plural form for resource type
     * @param {string} type - Resource type
     * @returns {string} Plural form
     */
    getPluralType(type) {
        // Handle special plural cases
        const pluralMap = {
            'geometry': 'geometries',
            'material': 'materials',
            'texture': 'textures',
            'mesh': 'meshes',
            'light': 'lights',
            'scene': 'scenes'
        };

        return pluralMap[type] || (type + 's');
    }

    /**
     * Initialize resource factories (Factory pattern)
     */
    initializeFactories() {
        // Geometry factory
        this.factories.set('geometry', {
            box: (width, height, depth) => new THREE.BoxGeometry(width, height, depth),
            plane: (width, height) => new THREE.PlaneGeometry(width, height),
            sphere: (radius, segments) => new THREE.SphereGeometry(radius, segments || 32)
        });

        // Material factory
        this.factories.set('material', {
            lambert: (params) => new THREE.MeshLambertMaterial(params),
            basic: (params) => new THREE.MeshBasicMaterial(params),
            standard: (params) => new THREE.MeshStandardMaterial(params)
        });
    }

    /**
     * Create and track a resource (Factory + Tracking pattern)
     * @param {string} type - Resource type (geometry, material, texture, etc.)
     * @param {string} subtype - Specific type (box, lambert, etc.)
     * @param {*} params - Creation parameters
     * @param {string} id - Optional custom ID
     * @returns {Object} Created resource
     */
    create(type, subtype, params, id = null) {
        try {
            // Generate unique ID if not provided
            const resourceId = id || this.generateId(type, subtype);

            // Create resource using factory
            let resource;
            const factory = this.factories.get(type);

            if (factory && factory[subtype]) {
                // Handle array parameters by spreading them
                if (Array.isArray(params)) {
                    resource = factory[subtype](...params);
                } else {
                    resource = factory[subtype](params);
                }
            } else {
                throw new Error(`Unknown resource type: ${type}.${subtype}`);
            }

            // Track the resource
            this.track(resource, type, resourceId);

            // Notify observers
            this.notifyObservers('created', { type, subtype, id: resourceId, resource });

            Utils.log(`Created ${type}.${subtype} with ID: ${resourceId}`);
            return resource;

        } catch (error) {
            Utils.error(`Failed to create ${type}.${subtype}:`, error);
            throw error;
        }
    }

    /**
     * Track an existing resource
     * @param {Object} resource - Three.js resource
     * @param {string} type - Resource type
     * @param {string} id - Resource ID
     */
    track(resource, type, id) {
        // Get the correct plural form
        const pluralType = this.getPluralType(type);
        if (!this.resources[pluralType]) {
            throw new Error(`Invalid resource type: ${type} (looking for ${pluralType})`);
        }

        // Add metadata to resource
        resource._resourceId = id;
        resource._resourceType = type;
        resource._createdAt = Date.now();

        // Store in tracking map
        this.resources[pluralType].set(id, resource);

        // Update statistics
        this.updateStats('created', type);
        this.updateStats('active', type, 1);

        return resource;
    }

    /**
     * Get a tracked resource by ID
     * @param {string} type - Resource type
     * @param {string} id - Resource ID
     * @returns {Object|null} Resource or null if not found
     */
    get(type, id) {
        const pluralType = this.getPluralType(type);
        return this.resources[pluralType].get(id) || null;
    }

    /**
     * Dispose of a resource properly
     * @param {string} type - Resource type
     * @param {string} id - Resource ID
     * @returns {boolean} Success status
     */
    dispose(type, id) {
        try {
            const resource = this.get(type, id);
            if (!resource) {
                Utils.warn(`Resource not found for disposal: ${type}.${id}`);
                return false;
            }

            // Call Three.js dispose method if available
            if (resource.dispose && typeof resource.dispose === 'function') {
                resource.dispose();
            }

            // Remove from tracking
            const pluralType = this.getPluralType(type);
            this.resources[pluralType].delete(id);

            // Update statistics
            this.updateStats('disposed', type);
            this.updateStats('active', type, -1);

            // Notify observers
            this.notifyObservers('disposed', { type, id, resource });

            Utils.log(`Disposed ${type} resource: ${id}`);
            return true;

        } catch (error) {
            Utils.error(`Failed to dispose ${type}.${id}:`, error);
            return false;
        }
    }

    /**
     * Dispose of a resource by reference
     * @param {Object} resource - Three.js resource
     * @returns {boolean} Success status
     */
    disposeByReference(resource) {
        if (!resource._resourceId || !resource._resourceType) {
            Utils.warn('Resource not tracked by ResourceManager');
            return false;
        }

        return this.dispose(resource._resourceType, resource._resourceId);
    }

    /**
     * Dispose all resources of a specific type
     * @param {string} type - Resource type to dispose
     * @returns {number} Number of resources disposed
     */
    disposeAllOfType(type) {
        const pluralType = this.getPluralType(type);
        const resources = this.resources[pluralType];
        if (!resources) {
            Utils.warn(`Invalid resource type: ${type}`);
            return 0;
        }

        let disposed = 0;
        for (const [id] of resources) {
            if (this.dispose(type, id)) {
                disposed++;
            }
        }

        Utils.log(`Disposed ${disposed} ${type} resources`);
        return disposed;
    }

    /**
     * Dispose all tracked resources (Nuclear option)
     * @returns {number} Total resources disposed
     */
    disposeAll() {
        let totalDisposed = 0;

        for (const type of Object.keys(this.resources)) {
            const typeName = type.slice(0, -1); // Remove 's' suffix
            totalDisposed += this.disposeAllOfType(typeName);
        }

        Utils.log(`ResourceManager: Disposed all ${totalDisposed} resources`);
        return totalDisposed;
    }

    /**
     * Add observer for resource lifecycle events (Observer pattern)
     * @param {Function} observer - Observer function
     */
    addObserver(observer) {
        this.observers.add(observer);
    }

    /**
     * Remove observer
     * @param {Function} observer - Observer function
     */
    removeObserver(observer) {
        this.observers.delete(observer);
    }

    /**
     * Notify all observers of resource events
     * @param {string} event - Event type (created, disposed)
     * @param {Object} data - Event data
     */
    notifyObservers(event, data) {
        for (const observer of this.observers) {
            try {
                observer(event, data);
            } catch (error) {
                Utils.error('Observer error:', error);
            }
        }
    }

    /**
     * Generate unique resource ID
     * @param {string} type - Resource type
     * @param {string} subtype - Resource subtype
     * @returns {string} Unique ID
     */
    generateId(type, subtype) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 5);
        return `${type}-${subtype}-${timestamp}-${random}`;
    }

    /**
     * Update resource statistics
     * @param {string} category - Stats category
     * @param {string} type - Resource type
     * @param {number} delta - Change amount (default: 1)
     */
    updateStats(category, type, delta = 1) {
        if (!this.stats[category]) {
            this.stats[category] = { total: 0, byType: {} };
        }

        this.stats[category].total += delta;

        if (!this.stats[category].byType[type]) {
            this.stats[category].byType[type] = 0;
        }
        this.stats[category].byType[type] += delta;
    }

    /**
     * Get resource statistics
     * @returns {Object} Current resource statistics
     */
    getStats() {
        return {
            ...this.stats,
            memory: this.getMemoryUsage()
        };
    }

    /**
     * Get memory usage information
     * @returns {Object} Memory usage statistics
     */
    getMemoryUsage() {
        const usage = {};

        for (const [type, resources] of Object.entries(this.resources)) {
            usage[type] = resources.size;
        }

        return usage;
    }

    /**
     * Get all tracked resources of a type
     * @param {string} type - Resource type
     * @returns {Map} Resource map
     */
    getAllOfType(type) {
        const pluralType = this.getPluralType(type);
        return this.resources[pluralType] || new Map();
    }

    /**
     * Check if a resource is tracked
     * @param {string} type - Resource type
     * @param {string} id - Resource ID
     * @returns {boolean} Is tracked
     */
    isTracked(type, id) {
        const pluralType = this.getPluralType(type);
        return this.resources[pluralType].has(id);
    }

    /**
     * Debug method to log all tracked resources
     */
    debugLogResources() {
        Utils.log('=== RESOURCE MANAGER DEBUG ===');

        for (const [type, resources] of Object.entries(this.resources)) {
            Utils.log(`${type}: ${resources.size} tracked`);

            for (const [id, resource] of resources) {
                const age = Date.now() - (resource._createdAt || 0);
                Utils.log(`  - ${id} (age: ${age}ms)`);
            }
        }

        Utils.log('Stats:', this.getStats());
        Utils.log('=== END DEBUG ===');
    }
}

// Singleton instance access
ResourceManager.getInstance = function () {
    if (!ResourceManager.instance) {
        new ResourceManager();
    }
    return ResourceManager.instance;
};

// Export for module systems or global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ResourceManager };
} else {
    window.GameResources = { ResourceManager };
}