/* ==========================================
   CORE SYSTEM BASE CLASS
   ========================================== */

(function (global) {
    class System {
        constructor(name) {
            this.name = name;
            this.enabled = true;
        }

        update(gameState, deltaTime) {
            // Override in subclasses
        }

        render(gameState, interpolationFactor) {
            // Override in subclasses
        }
    }

    global.System = System;
})(typeof window !== 'undefined' ? window : globalThis);