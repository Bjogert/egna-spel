/* ==========================================
   ARENA MODULE AGGREGATOR
   Exposes ArenaBuilder for legacy scripts
   ========================================== */

(function (global) {
    const ArenaBuilder = global.GameArena && global.GameArena.ArenaBuilder ? global.GameArena.ArenaBuilder : null;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { ArenaBuilder };
    } else {
        global.GameArena = global.GameArena || {};
        global.GameArena.ArenaBuilder = ArenaBuilder;
        if (ArenaBuilder) {
            global.ArenaBuilder = ArenaBuilder;
        }
    }
})(typeof window !== 'undefined' ? window : globalThis);