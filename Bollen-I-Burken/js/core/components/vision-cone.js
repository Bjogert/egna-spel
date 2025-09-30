/* ==========================================
   CORE COMPONENT - VISION CONE
   ========================================== */

(function (global) {
    class VisionCone {
        constructor(angle = 60, range = 12) {
            this.angle = angle;
            this.range = range;
            this.enabled = true;
            this.targetSeen = false;
            this.lastSeenPosition = null;
            this.canSeePlayer = false;
            this.playerEntity = null;
            this.lastSeenTime = 0;
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = VisionCone;
    } else {
        global.VisionCone = VisionCone;
    }
})(typeof window !== 'undefined' ? window : globalThis);