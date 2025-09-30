/* ==========================================
   CORE COMPONENT - INTERACTABLE
   ========================================== */

(function (global) {
    class Interactable {
        constructor(type = 'can', interactDistance = 1.5) {
            this.type = type;
            this.interactDistance = interactDistance;
            this.isActive = true;
            this.requiresProximity = true;
            this.interactionCount = 0;
            this.lastInteractionTime = 0;
            this.onInteract = null;
        }

        canInteract(playerDistance) {
            return this.isActive && this.requiresProximity && playerDistance <= this.interactDistance;
        }

        triggerInteraction(playerId) {
            if (!this.isActive) {
                return false;
            }

            this.interactionCount++;
            this.lastInteractionTime = Date.now();

            if (typeof this.onInteract === 'function') {
                this.onInteract(playerId, this);
            }

            Utils.log(`${this.type} interacted with by player ${playerId}`);
            return true;
        }
    }

    global.Interactable = Interactable;
})(typeof window !== 'undefined' ? window : globalThis);