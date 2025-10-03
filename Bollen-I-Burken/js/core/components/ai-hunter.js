/* ==========================================
   CORE COMPONENT - AI HUNTER
   ========================================== */

(function (global) {
    class AIHunter {
        constructor() {
            // State machine (PATROL, INVESTIGATE, RACE)
            this.state = 'PATROL';

            // Reaction state (for spotted-player visual reaction)
            this.reactionState = null;      // 'SPOTTED', 'REACTING', null
            this.reactionStartTime = 0;
            this.reactionDuration = 800;    // 800ms reaction before racing
            this.reactionJumpTime = 200;    // Jump at 200ms into reaction

            // Steering-based movement
            this.heading = Math.random() * Math.PI * 2;  // Current facing direction (radians)
            this.velocity = { x: 0, z: 0 };              // Current velocity vector
            this.currentSpeed = 0;                       // Current actual speed (for acceleration)
            this.maxSpeed = 0.12;                        // Max speed during patrol
            this.maxSpeedHunting = 0.20;                 // Max speed during hunting
            this.acceleration = 0.15;                    // Acceleration rate (units/sec²)
            this.maxAccel = 0.15;                        // Linear acceleration
            this.maxAngularAccel = 4.5;                  // Angular acceleration (rad/sec)

            // Wander behavior state (used by can-guard patrol)
            this.wanderAngle = 0;                        // Random offset for patrol wandering
            this.nextTurnTime = 0;                       // Time until next direction change
            this.currentTurnSpeed = 1.0;                 // Current turn multiplier

            // Hearing investigation
            this.lastHeardPosition = null;       // Where we last heard the player
            this.investigateStartTime = 0;       // When we started investigating
            this.investigateDuration = 8000;     // How long to investigate (8 seconds)
            this.investigateLookAroundTime = 0;  // Time spent looking around at investigation point
            this.investigateStuckCount = 0;      // Number of times stuck during investigation (give up after 3)

            // Wall collision cooldown (for obstacle handling)
            this.wallCollisionCooldown = 0;
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = AIHunter;
    } else {
        global.AIHunter = AIHunter;
    }
})(typeof window !== 'undefined' ? window : globalThis);