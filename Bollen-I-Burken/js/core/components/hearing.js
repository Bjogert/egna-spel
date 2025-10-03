/* ==========================================
   CORE COMPONENT - HEARING
   AI hearing detection for footstep sounds
   ========================================== */

(function (global) {
    class Hearing {
        constructor() {
            this.hearingRange = 8.0;  // How far AI can hear (meters)
            this.canHearPlayer = false;
            this.lastHeardPosition = null;
            this.lastHeardTime = 0;
            this.alertDuration = 2000;  // How long to stay alert after hearing (ms)
        }
    }

    global.Hearing = Hearing;
})(typeof window !== 'undefined' ? window : globalThis);
