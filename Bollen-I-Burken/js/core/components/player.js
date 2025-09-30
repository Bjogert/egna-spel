/* ==========================================
   CORE COMPONENT - PLAYER
   ========================================== */

(function (global) {
    class Player {
        constructor(playerId, isLocal = false) {
            this.playerId = playerId;
            this.isLocal = isLocal;
            this.score = 0;
            this.lives = 3;
            this.powerUps = [];
            this.state = PLAYER_STATES.IDLE;
            this.health = 100;

            // Additional runtime stats used by newer systems
            this.tags = 0;
            this.rescues = 0;
            this.kicks = 0;
            this.lastSeenTime = 0;
            this.lastKnownPosition = null;
        }
    }

    global.Player = Player;
})(typeof window !== 'undefined' ? window : globalThis);