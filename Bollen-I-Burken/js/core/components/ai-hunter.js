/* ==========================================
   CORE COMPONENT - AI HUNTER
   ========================================== */

(function (global) {
    class AIHunter {
        constructor() {
            this.state = 'PATROL';
            this.patrolPoints = [
                { x: 0, z: 5 },
                { x: 5, z: 0 },
                { x: 0, z: -5 },
                { x: -5, z: 0 }
            ];
            this.currentPatrolIndex = 0;
            this.searchStartTime = 0;
            this.searchDuration = 5000;
            this.alertLevel = 0;

            this.target = null;
            this.lastKnownPosition = null;
            this.patrolTimer = 0;
            this.patrolDirection = Math.random() * Math.PI * 2;
            this.targetDirection = this.patrolDirection;
            this.patrolChangeTime = 2000;
            this.wallCollisionCooldown = 0;

            this.huntingStartTime = 0;
            this.huntingSpeed = 0.12;
            this.searchTimeout = 5000;
            this.speed = 0.08;
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = AIHunter;
    } else {
        global.AIHunter = AIHunter;
    }
})(typeof window !== 'undefined' ? window : globalThis);