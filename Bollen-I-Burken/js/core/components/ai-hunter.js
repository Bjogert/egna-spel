/* ==========================================
   CORE COMPONENT - AI HUNTER
   ========================================== */

(function (global) {
    class AIHunter {
        constructor() {
            // State machine
            this.state = 'PATROL';
            this.huntingStartTime = 0;
            this.searchStartTime = 0;
            this.searchDuration = 5000;
            this.searchTimeout = 5000;
            this.alertLevel = 0;

            // STEERING-BASED MOVEMENT (new system)
            this.heading = Math.random() * Math.PI * 2;  // Current facing direction (radians)
            this.velocity = { x: 0, z: 0 };              // Current velocity vector
            this.maxSpeed = 0.12;                        // Max speed during patrol (increased from 0.08)
            this.maxSpeedHunting = 0.20;                 // Max speed during hunting (increased from 0.12)
            this.maxAccel = 0.15;                        // Linear acceleration (increased from 0.05)
            this.maxAngularAccel = 4.5;                  // Angular acceleration - rad/sec (increased from 2.0)

            // Wander behavior state
            this.wanderAngle = 0;                        // Random offset for patrol wandering
            this.nextTurnTime = 0;                       // Time until next direction change
            this.currentTurnSpeed = 1.0;                 // Current turn multiplier (varies for interesting movement)

            // Waypoint system (for future methodical search)
            this.patrolPoints = [
                { x: 0, z: 5 },
                { x: 5, z: 0 },
                { x: 0, z: -5 },
                { x: -5, z: 0 }
            ];
            this.currentPatrolIndex = 0;

            // Legacy fields (to be removed after migration complete)
            this.target = null;
            this.lastKnownPosition = null;
            this.wallCollisionCooldown = 0;

            // OLD DIRECTION SYSTEM - DEPRECATED (will be removed)
            // this.patrolDirection, this.targetDirection, this.patrolTimer
            // Replaced by steering behaviors (heading + velocity)
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = AIHunter;
    } else {
        global.AIHunter = AIHunter;
    }
})(typeof window !== 'undefined' ? window : globalThis);