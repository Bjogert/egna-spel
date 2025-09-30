/* ==========================================
   CORE COMPONENT - HIDEABLE
   ========================================== */

(function (global) {
    class Hideable {
        constructor(hideCapacity = 1, hideRadius = 2.0) {
            this.hideCapacity = hideCapacity;
            this.hideRadius = hideRadius;
            this.occupants = [];
            this.isOccupied = false;
            this.hideEffectiveness = 0.8;
            this.detectionReduction = 0.7;
        }

        canHide(playerId) {
            return this.occupants.length < this.hideCapacity && !this.occupants.includes(playerId);
        }

        addOccupant(playerId) {
            if (this.canHide(playerId)) {
                this.occupants.push(playerId);
                this.isOccupied = this.occupants.length > 0;
                Utils.log(`Player ${playerId} is now hiding`);
                return true;
            }
            return false;
        }

        removeOccupant(playerId) {
            const index = this.occupants.indexOf(playerId);
            if (index !== -1) {
                this.occupants.splice(index, 1);
                this.isOccupied = this.occupants.length > 0;
                Utils.log(`Player ${playerId} is no longer hiding`);
                return true;
            }
            return false;
        }

        isPlayerHiding(playerId) {
            return this.occupants.includes(playerId);
        }
    }

    global.Hideable = Hideable;
})(typeof window !== 'undefined' ? window : globalThis);