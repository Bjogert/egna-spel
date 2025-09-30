/* ==========================================
   RESOURCE OBSERVER & STATS HELPERS
   Handles observer notifications and stat bookkeeping
   ========================================== */

(function (global) {
    function addObserver(manager, observer) {
        if (!manager || !manager.observers || typeof observer !== 'function') {
            return;
        }
        manager.observers.add(observer);
    }

    function removeObserver(manager, observer) {
        if (!manager || !manager.observers) {
            return;
        }
        manager.observers.delete(observer);
    }

    function notifyObservers(manager, event, data) {
        if (!manager || !manager.observers) {
            return;
        }
        for (const observer of manager.observers) {
            try {
                observer(event, data);
            } catch (error) {
                Utils.error('Observer error:', error);
            }
        }
    }

    function updateStats(manager, category, type, delta) {
        if (!manager.stats[category]) {
            manager.stats[category] = { total: 0, byType: {} };
        }

        manager.stats[category].total += delta;

        if (!manager.stats[category].byType[type]) {
            manager.stats[category].byType[type] = 0;
        }
        manager.stats[category].byType[type] += delta;
    }

    function getMemoryUsage(manager) {
        const usage = {};
        for (const [type, resources] of Object.entries(manager.resources)) {
            usage[type] = resources.size;
        }
        return usage;
    }

    function getStats(manager) {
        return {
            ...manager.stats,
            memory: getMemoryUsage(manager)
        };
    }

    function debugLogResources(manager) {
        Utils.log('=== RESOURCE MANAGER DEBUG ===');

        for (const [type, resources] of Object.entries(manager.resources)) {
            Utils.log(`${type}: ${resources.size} tracked`);
            for (const [id, resource] of resources) {
                const age = Date.now() - (resource._createdAt || 0);
                Utils.log(`  - ${id} (age: ${age}ms)`);
            }
        }

        Utils.log('Stats:', getStats(manager));
        Utils.log('=== END DEBUG ===');
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            addObserver,
            removeObserver,
            notifyObservers,
            updateStats,
            getStats,
            getMemoryUsage,
            debugLogResources
        };
    } else {
        global.ResourceObservers = {
            addObserver,
            removeObserver,
            notifyObservers,
            updateStats,
            getStats,
            getMemoryUsage,
            debugLogResources
        };
    }
})(typeof window !== 'undefined' ? window : globalThis);