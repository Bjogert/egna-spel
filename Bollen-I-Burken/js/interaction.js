/* ==========================================
   INTERACTION MODULE AGGREGATOR
   Keeps legacy accessors pointing to new interaction modules
   ========================================== */

(function (global) {
    const InteractionSystem = global.InteractionSystem;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { InteractionSystem };
    } else {
        global.GameSystems = global.GameSystems || {};
        global.GameSystems.InteractionSystem = InteractionSystem;
    }
})(typeof window !== 'undefined' ? window : globalThis);