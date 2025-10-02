/* ==========================================
   CORE COMPONENT - PARENT
   Links child entities for hierarchical structures
   ========================================== */

(function (global) {
    class Parent {
        constructor() {
            this.children = [];  // Array of child entity IDs or references
        }

        addChild(entityOrId) {
            const childId = typeof entityOrId === 'object' ? entityOrId.id : entityOrId;
            if (!this.children.includes(childId)) {
                this.children.push(childId);
            }
        }

        removeChild(entityOrId) {
            const childId = typeof entityOrId === 'object' ? entityOrId.id : entityOrId;
            const index = this.children.indexOf(childId);
            if (index !== -1) {
                this.children.splice(index, 1);
            }
        }

        hasChildren() {
            return this.children.length > 0;
        }

        getChildCount() {
            return this.children.length;
        }
    }

    global.Parent = Parent;
})(typeof window !== 'undefined' ? window : globalThis);
