/* ==========================================
   RESOURCE MANAGER AGGREGATOR
   Keeps legacy global access to ResourceManager
   ========================================== */

(function (global) {
    const ResourceManager = global.ResourceManagerClass || global.ResourceManager;
    const exports = { ResourceManager };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports;
    } else {
        global.GameResources = exports;
        global.ResourceManager = ResourceManager;
    }
})(typeof window !== 'undefined' ? window : globalThis);