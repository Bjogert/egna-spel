/* ==========================================
   CORE COMPONENT - MOVEMENT
   ========================================== */

(function (global) {
    class Movement {
        constructor(speed = 0.1) {
            // Required properties matching validation schema
            this.speed = speed;

            // Optional properties with defaults from schema
            this.maxSpeed = 2.0;
            this.acceleration = 1.0;
            this.friction = 0.8;
            this.direction = { x: 0, z: 0 };
        }
    }

    global.Movement = Movement;
})(typeof window !== 'undefined' ? window : globalThis);