/* ==========================================
   CORE COMPONENT - RENDERABLE
   ========================================== */

(function (global) {
    class Renderable {
        constructor(mesh) {
            this.mesh = mesh;
            this.visible = true;
        }

        setVisible(visible) {
            this.visible = visible;
            if (this.mesh) {
                this.mesh.visible = visible;
            }
        }
    }

    global.Renderable = Renderable;
})(typeof window !== 'undefined' ? window : globalThis);