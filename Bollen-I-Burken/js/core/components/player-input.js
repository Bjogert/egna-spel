/* ==========================================
   CORE COMPONENT - PLAYER INPUT
   ========================================== */

(function (global) {
    class PlayerInput {
        constructor() {
            this.keys = {
                forward: false,
                backward: false,
                left: false,
                right: false,
                interact: false,
                special: false,
                action1: false,
                action2: false
            };
            this.lastInputTime = 0;
            this.inputSequence = 0;
        }

        hasInput() {
            return this.keys.forward || this.keys.backward || this.keys.left || this.keys.right;
        }

        hasActionInput() {
            return this.keys.interact || this.keys.special || this.keys.action1 || this.keys.action2;
        }
    }

    global.PlayerInput = PlayerInput;
})(typeof window !== 'undefined' ? window : globalThis);