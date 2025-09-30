/* ==========================================
   CORE COMPONENT - TRANSFORM
   ========================================== */

(function (global) {
    class Transform {
        constructor(x = 0, y = 0, z = 0, rotationY = 0) {
            this.position = Utils.vector3(x, y, z);
            this.rotation = { y: rotationY };
            this.velocity = Utils.vector3();
            this.previousPosition = Utils.vector3(x, y, z);
        }

        updatePrevious() {
            this.previousPosition = { ...this.position };
        }
    }

    global.Transform = Transform;
})(typeof window !== 'undefined' ? window : globalThis);