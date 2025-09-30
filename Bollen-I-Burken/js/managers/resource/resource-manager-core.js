/* ==========================================
   RESOURCE MANAGER CORE
   Handles Three.js resource tracking and lifecycle
   ========================================== */

(function (global) {
    const factories = global.ResourceFactories || {};
    const observers = global.ResourceObservers || {};

    class ResourceManager {
        constructor() {
            if (ResourceManager.instance) {
                return ResourceManager.instance;
            }

            this.resources = {
                geometries: new Map(),
                materials: new Map(),
                textures: new Map(),
                meshes: new Map(),
                lights: new Map(),
                scenes: new Map()
            };

            this.factories = new Map();
            this.observers = new Set();
            this.stats = {
                created: { total: 0, byType: {} },
                disposed: { total: 0, byType: {} },
                active: { total: 0, byType: {} }
            };

            ResourceManager.instance = this;
            this.initializeFactories();

            Utils.log('ResourceManager initialized (Singleton pattern)');
        }

        initializeFactories() {
            if (factories.registerDefaultFactories) {
                factories.registerDefaultFactories(this);
            }
        }

        getPluralType(type) {
            const pluralMap = {
                geometry: 'geometries',
                material: 'materials',
                texture: 'textures',
                mesh: 'meshes',
                light: 'lights',
                scene: 'scenes'
            };

            return pluralMap[type] || `${type}s`;
        }

        create(type, subtype, params, id = null) {
            const resourceId = id || this.generateId(type, subtype);
            const factory = this.factories.get(type);
            if (!factory || !factory[subtype]) {
                throw new Error(`Unknown resource type: ${type}.${subtype}`);
            }

            const resource = Array.isArray(params) ? factory[subtype](...params) : factory[subtype](params);
            this.track(resource, type, resourceId);
            this.notifyObservers('created', { type, subtype, id: resourceId, resource });
            Utils.log(`Created ${type}.${subtype} with ID: ${resourceId}`);
            return resource;
        }

        track(resource, type, id) {
            const pluralType = this.getPluralType(type);
            if (!this.resources[pluralType]) {
                throw new Error(`Invalid resource type: ${type}`);
            }

            resource._resourceId = id;
            resource._resourceType = type;
            resource._createdAt = Date.now();

            this.resources[pluralType].set(id, resource);
            this.updateStats('created', type, 1);
            this.updateStats('active', type, 1);
            return resource;
        }

        get(type, id) {
            const pluralType = this.getPluralType(type);
            return this.resources[pluralType].get(id) || null;
        }

        dispose(type, id) {
            const resource = this.get(type, id);
            if (!resource) {
                Utils.warn(`Resource not found for disposal: ${type}.${id}`);
                return false;
            }

            if (resource.dispose) {
                resource.dispose();
            }

            const pluralType = this.getPluralType(type);
            this.resources[pluralType].delete(id);

            this.updateStats('disposed', type, 1);
            this.updateStats('active', type, -1);
            this.notifyObservers('disposed', { type, id, resource });
            Utils.log(`Disposed ${type} resource: ${id}`);
            return true;
        }

        disposeByReference(resource) {
            if (!resource._resourceId || !resource._resourceType) {
                Utils.warn('Resource not tracked by ResourceManager');
                return false;
            }
            return this.dispose(resource._resourceType, resource._resourceId);
        }

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

        disposeAll() {
            let totalDisposed = 0;
            for (const type of Object.keys(this.resources)) {
                const singular = type.slice(0, -1);
                totalDisposed += this.disposeAllOfType(singular);
            }

            Utils.log(`ResourceManager: Disposed all ${totalDisposed} resources`);
            return totalDisposed;
        }

        addObserver(observer) {
            observers.addObserver && observers.addObserver(this, observer);
        }

        removeObserver(observer) {
            observers.removeObserver && observers.removeObserver(this, observer);
        }

        notifyObservers(event, data) {
            observers.notifyObservers && observers.notifyObservers(this, event, data);
        }

        generateId(type, subtype) {
            const timestamp = Date.now();
            const random = Math.random().toString(36).substr(2, 5);
            return `${type}-${subtype}-${timestamp}-${random}`;
        }

        updateStats(category, type, delta) {
            observers.updateStats && observers.updateStats(this, category, type, delta);
        }

        getStats() {
            return observers.getStats ? observers.getStats(this) : this.stats;
        }

        getMemoryUsage() {
            return observers.getMemoryUsage ? observers.getMemoryUsage(this) : {};
        }

        getAllOfType(type) {
            const pluralType = this.getPluralType(type);
            return this.resources[pluralType] || new Map();
        }

        isTracked(type, id) {
            const pluralType = this.getPluralType(type);
            return this.resources[pluralType].has(id);
        }

        debugLogResources() {
            if (observers.debugLogResources) {
                observers.debugLogResources(this);
            }
        }
    }

    ResourceManager.getInstance = function () {
        if (!ResourceManager.instance) {
            new ResourceManager();
        }
        return ResourceManager.instance;
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { ResourceManager };
    } else {
        global.ResourceManagerClass = ResourceManager;
        global.ResourceManager = ResourceManager;
    }
})(typeof window !== 'undefined' ? window : globalThis);