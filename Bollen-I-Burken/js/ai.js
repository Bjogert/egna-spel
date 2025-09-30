/* ==========================================
   AI MODULE AGGREGATOR
   Exposes AI components and system for legacy consumers
   ========================================== */

(function (global) {
    const AIHunter = global.AIHunter;
    const VisionCone = global.VisionCone;
    const AI_STATES = global.AI_STATES;
    const AISystem = global.AISystem;

    const exports = { AIHunter, VisionCone, AI_STATES, AISystem };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports;
    } else {
        global.GameAI = exports;
    }
})(typeof window !== 'undefined' ? window : globalThis);