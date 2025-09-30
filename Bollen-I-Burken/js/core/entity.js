/* ==========================================
   BOLLEN I BURKEN - CORE ENTITY
   ECS entity container handling component maps
   ========================================== */

(function (global) {
    class Entity {
        constructor(id) {
            this.id = id;
            this.components = new Map();
            this.active = true;
        }

        addComponent(component) {
            // Get component type name with fallback for constructor.name === 'Object'
            let componentName = component.constructor.name;

            // Handle naming collision where multiple components have constructor.name === 'Object'
            if (componentName === 'Object') {
                // Smart detection based on component properties
                if (component.position && component.velocity && component.rotation) {
                    componentName = 'Transform';
                } else if (component.speed !== undefined && component.maxSpeed !== undefined) {
                    componentName = 'Movement';
                } else if (component.keys && typeof component.hasInput === 'function') {
                    componentName = 'PlayerInput';
                } else if (component.playerId && component.isLocal !== undefined) {
                    componentName = 'Player';
                } else if (component.mesh && component.visible !== undefined) {
                    componentName = 'Renderable';
                } else if (component.state && component.patrolPoints !== undefined) {
                    componentName = 'AIHunter';
                } else if (component.angle !== undefined && component.range !== undefined) {
                    componentName = 'VisionCone';
                } else if (component.type !== undefined && component.interactDistance !== undefined) {
                    componentName = 'Interactable';
                } else if (component.hideCapacity !== undefined && component.hideRadius !== undefined) {
                    componentName = 'Hideable';
                } else if (component.type !== undefined && component.bounds !== undefined && component.blockMovement !== undefined) {
                    componentName = 'Collider';
                } else {
                    // Fallback: use a unique identifier to prevent collisions
                    componentName = `UnknownComponent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    Utils.warn(`Component with unknown type detected, assigned name: ${componentName}`);
                }

                Utils.log(`Component naming collision resolved: 'Object' -> '${componentName}'`);
            }

            this.components.set(componentName, component);
            return this;
        }

        getComponent(componentType) {
            let typeName;
            if (typeof componentType === 'string') {
                typeName = componentType;
            } else {
                typeName = componentType.name;
                // Handle case where class name is 'Object' - try to find by component type
                if (typeName === 'Object') {
                    typeName = this._findComponentNameByType(componentType);
                }
            }
            return this.components.get(typeName);
        }

        hasComponent(componentType) {
            let typeName;
            if (typeof componentType === 'string') {
                typeName = componentType;
            } else {
                typeName = componentType.name;
                // Handle case where class name is 'Object' - try to find by component type
                if (typeName === 'Object') {
                    typeName = this._findComponentNameByType(componentType);
                }
            }
            return this.components.has(typeName);
        }

        removeComponent(componentType) {
            let typeName;
            if (typeof componentType === 'string') {
                typeName = componentType;
            } else {
                typeName = componentType.name;
                // Handle case where class name is 'Object' - try to find by component type
                if (typeName === 'Object') {
                    typeName = this._findComponentNameByType(componentType);
                }
            }
            return this.components.delete(typeName);
        }

        // Helper method to find component name by checking stored components against class type
        _findComponentNameByType(componentType) {
            for (const [name, component] of this.components) {
                if (component instanceof componentType) {
                    return name;
                }
            }

            // Fallback: return the class name even if it's 'Object'
            return componentType.name;
        }

        // Debug method to check for potential component naming issues
        debugComponents() {
            Utils.log(`Entity ${this.id} components:`);
            for (const [name, component] of this.components) {
                const actualClassName = component.constructor.name;
                const hasNameCollision = actualClassName === 'Object';

                Utils.log(`  - ${name}: ${actualClassName}${hasNameCollision ? ' (naming collision resolved)' : ''}`);

                // Log key properties to help identify component types
                if (hasNameCollision) {
                    const keys = Object.keys(component).slice(0, 3).join(', ');
                    Utils.log(`    Properties: ${keys}...`);
                }
            }
        }

        destroy() {
            this.active = false;
            this.components.clear();
        }
    }

    global.Entity = Entity;
})(typeof window !== 'undefined' ? window : globalThis);