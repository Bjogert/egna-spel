/* ==========================================
   BOLLEN I BURKEN - COMPONENT VALIDATION FRAMEWORK
   Enterprise-grade ECS component validation and error recovery
   ========================================== */

// ==========================================
// COMPONENT VALIDATION FRAMEWORK
// Enterprise Pattern: Strategy + Template Method + Chain of Responsibility
// ==========================================

// Component validation error types
const VALIDATION_ERROR_TYPES = {
    TYPE_MISMATCH: 'TYPE_MISMATCH',
    MISSING_REQUIRED: 'MISSING_REQUIRED',
    INVALID_RANGE: 'INVALID_RANGE',
    INVALID_FORMAT: 'INVALID_FORMAT',
    DEPENDENCY_MISSING: 'DEPENDENCY_MISSING'
};

class ComponentValidationError extends Error {
    constructor(message, type, componentName, propertyPath = null, details = {}) {
        super(message);
        this.name = 'ComponentValidationError';
        this.type = type;
        this.componentName = componentName;
        this.propertyPath = propertyPath;
        this.details = details;
        this.timestamp = Date.now();
    }
}

// ==========================================
// COMPONENT SCHEMAS (Enterprise Configuration Pattern)
// ==========================================
const COMPONENT_SCHEMAS = {
    Transform: {
        required: ['position'],
        properties: {
            position: {
                type: 'object',
                required: ['x', 'y', 'z'],
                properties: {
                    x: { type: 'number', range: [-1000, 1000] },
                    y: { type: 'number', range: [-1000, 1000] },
                    z: { type: 'number', range: [-1000, 1000] }
                }
            },
            rotation: {
                type: 'object',
                properties: {
                    y: { type: 'number', range: [-Math.PI * 2, Math.PI * 2] }
                }
            },
            velocity: {
                type: 'object',
                properties: {
                    x: { type: 'number', range: [-50, 50] },
                    y: { type: 'number', range: [-50, 50] },
                    z: { type: 'number', range: [-50, 50] }
                }
            }
        }
    },

    Movement: {
        required: ['speed'],
        properties: {
            speed: { type: 'number', range: [0, 10], default: 0.1 },
            maxSpeed: { type: 'number', range: [0, 20], default: 2.0 },
            acceleration: { type: 'number', range: [0, 5], default: 1.0 },
            friction: { type: 'number', range: [0, 1], default: 0.8 },
            direction: {
                type: 'object',
                properties: {
                    x: { type: 'number', range: [-1, 1] },
                    z: { type: 'number', range: [-1, 1] }
                }
            }
        }
    },

    VisionCone: {
        required: ['angle', 'range'],
        properties: {
            angle: { type: 'number', range: [10, 180], default: 60 },
            range: { type: 'number', range: [1, 50], default: 10 },
            enabled: { type: 'boolean', default: true },
            targetSeen: { type: 'boolean', default: false },
            lastSeenPosition: {
                type: 'object',
                properties: {
                    x: { type: 'number' },
                    z: { type: 'number' }
                }
            }
        }
    },

    AIHunter: {
        required: ['state'],
        properties: {
            state: {
                type: 'string',
                enum: ['PATROL', 'HUNTING', 'SEARCHING'],
                default: 'PATROL'
            },
            patrolPoints: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        x: { type: 'number', range: [-50, 50] },
                        z: { type: 'number', range: [-50, 50] }
                    }
                }
            },
            currentPatrolIndex: { type: 'number', range: [0, 100], default: 0 },
            searchStartTime: { type: 'number', default: 0 },
            searchDuration: { type: 'number', range: [1000, 30000], default: 5000 },
            alertLevel: { type: 'number', range: [0, 1], default: 0 }
        },
        dependencies: ['Transform', 'Movement', 'VisionCone']
    },

    Player: {
        required: ['playerId'],
        properties: {
            playerId: { type: 'string', minLength: 1 },
            isLocal: { type: 'boolean', default: false },
            score: { type: 'number', range: [0, Number.MAX_SAFE_INTEGER], default: 0 },
            lives: { type: 'number', range: [0, 10], default: 3 },
            powerUps: { type: 'array', default: [] }
        },
        dependencies: ['Transform', 'Movement']
    }
};

// ==========================================
// VALIDATION STRATEGIES (Strategy Pattern)
// ==========================================
class ValidationStrategy {
    validate(value, schema, path) {
        throw new Error('ValidationStrategy.validate must be implemented by subclass');
    }
}

class TypeValidationStrategy extends ValidationStrategy {
    validate(value, schema, path) {
        const errors = [];

        if (schema.type) {
            let actualType = typeof value;

            // Handle array type properly
            if (schema.type === 'array') {
                if (!Array.isArray(value)) {
                    errors.push(new ComponentValidationError(
                        `Expected type 'array' but got '${actualType}' at ${path}`,
                        VALIDATION_ERROR_TYPES.TYPE_MISMATCH,
                        null,
                        path,
                        { expected: 'array', actual: actualType }
                    ));
                }
            } else if (typeof value !== schema.type) {
                errors.push(new ComponentValidationError(
                    `Expected type '${schema.type}' but got '${actualType}' at ${path}`,
                    VALIDATION_ERROR_TYPES.TYPE_MISMATCH,
                    null,
                    path,
                    { expected: schema.type, actual: actualType }
                ));
            }
        }

        return errors;
    }
}

class RangeValidationStrategy extends ValidationStrategy {
    validate(value, schema, path) {
        const errors = [];

        if (schema.range && typeof value === 'number') {
            const [min, max] = schema.range;
            if (value < min || value > max) {
                errors.push(new ComponentValidationError(
                    `Value ${value} out of range [${min}, ${max}] at ${path}`,
                    VALIDATION_ERROR_TYPES.INVALID_RANGE,
                    null,
                    path,
                    { value, min, max }
                ));
            }
        }

        return errors;
    }
}

class EnumValidationStrategy extends ValidationStrategy {
    validate(value, schema, path) {
        const errors = [];

        if (schema.enum && !schema.enum.includes(value)) {
            errors.push(new ComponentValidationError(
                `Value '${value}' not in allowed enum [${schema.enum.join(', ')}] at ${path}`,
                VALIDATION_ERROR_TYPES.INVALID_FORMAT,
                null,
                path,
                { value, allowedValues: schema.enum }
            ));
        }

        return errors;
    }
}

// ArrayValidationStrategy removed - now handled by TypeValidationStrategy

// ==========================================
// COMPONENT VALIDATOR (Enterprise Foundation)
// Patterns: Singleton + Template Method + Strategy + Chain of Responsibility
// ==========================================
class ComponentValidator {
    constructor() {
        if (ComponentValidator.instance) {
            return ComponentValidator.instance;
        }

        this.strategies = [
            new TypeValidationStrategy(),
            new RangeValidationStrategy(),
            new EnumValidationStrategy()
        ];

        this.errorHandler = null;
        this.configManager = null;
        this.validationEnabled = true;
        this.strictMode = false;

        ComponentValidator.instance = this;
    }

    static getInstance() {
        if (!ComponentValidator.instance) {
            ComponentValidator.instance = new ComponentValidator();
        }
        return ComponentValidator.instance;
    }

    // Initialize with enterprise dependencies
    initialize(errorHandler, configManager) {
        this.errorHandler = errorHandler;
        this.configManager = configManager;

        if (configManager) {
            this.validationEnabled = configManager.get('validation.enabled', true);
            this.strictMode = configManager.get('validation.strictMode', false);
        }

        Utils.log('ComponentValidator initialized with enterprise dependencies');
    }

    // Main validation entry point (Template Method Pattern)
    validateComponent(component, componentName = null) {
        if (!this.validationEnabled) {
            return { isValid: true, errors: [], warnings: [] };
        }

        try {
            const name = componentName || component.constructor.name;
            const schema = COMPONENT_SCHEMAS[name];

            if (!schema) {
                const warning = `No validation schema found for component '${name}'`;
                Utils.warn(warning);
                return { isValid: true, errors: [], warnings: [warning] };
            }

            const result = this.performValidation(component, schema, name);

            // Handle errors through ErrorHandler if available
            if (result.errors.length > 0 && this.errorHandler) {
                result.errors.forEach(error => {
                    this.errorHandler.handle(error, this.strictMode ? 'CRITICAL' : 'WARNING');
                });
            }

            return result;

        } catch (error) {
            const validationError = new ComponentValidationError(
                `Validation process failed: ${error.message}`,
                VALIDATION_ERROR_TYPES.TYPE_MISMATCH,
                componentName,
                null,
                { originalError: error.message }
            );

            if (this.errorHandler) {
                this.errorHandler.handle(validationError, 'ERROR');
            }

            return { isValid: false, errors: [validationError], warnings: [] };
        }
    }

    // Core validation logic (Template Method Pattern)
    performValidation(component, schema, componentName) {
        const errors = [];
        const warnings = [];

        // 1. Check required properties
        this.validateRequiredProperties(component, schema, componentName, errors);

        // 2. Validate each property using strategies
        this.validateProperties(component, schema, componentName, errors);

        // 3. Check component dependencies
        this.validateDependencies(component, schema, componentName, errors);

        // 4. Apply auto-correction if possible
        const correctedComponent = this.applyAutoCorrection(component, schema, errors, warnings);

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            correctedComponent
        };
    }

    validateRequiredProperties(component, schema, componentName, errors) {
        if (!schema.required) return;

        schema.required.forEach(propertyName => {
            if (!(propertyName in component)) {
                errors.push(new ComponentValidationError(
                    `Required property '${propertyName}' missing from component '${componentName}'`,
                    VALIDATION_ERROR_TYPES.MISSING_REQUIRED,
                    componentName,
                    propertyName
                ));
            }
        });
    }

    validateProperties(component, schema, componentName, errors) {
        if (!schema.properties) return;

        Object.keys(schema.properties).forEach(propertyName => {
            if (propertyName in component) {
                const value = component[propertyName];
                const propertySchema = schema.properties[propertyName];
                const path = `${componentName}.${propertyName}`;

                // Apply all validation strategies
                this.strategies.forEach(strategy => {
                    const strategyErrors = strategy.validate(value, propertySchema, path);
                    errors.push(...strategyErrors);
                });

                // Recursive validation for nested objects
                if (propertySchema.type === 'object' && propertySchema.properties) {
                    this.validateNestedObject(value, propertySchema, path, errors);
                }
            }
        });
    }

    validateNestedObject(obj, schema, path, errors) {
        if (!obj || typeof obj !== 'object') return;

        Object.keys(schema.properties).forEach(propertyName => {
            if (propertyName in obj) {
                const value = obj[propertyName];
                const propertySchema = schema.properties[propertyName];
                const nestedPath = `${path}.${propertyName}`;

                this.strategies.forEach(strategy => {
                    const strategyErrors = strategy.validate(value, propertySchema, nestedPath);
                    errors.push(...strategyErrors);
                });
            }
        });
    }

    validateDependencies(component, schema, componentName, errors) {
        if (!schema.dependencies) return;

        // This would need access to the entity to check for other components
        // For now, we'll skip this validation but the framework is in place
        Utils.log(`Dependency validation for ${componentName} would require entity context`);
    }

    // Auto-correction and fallback handling (Enterprise robustness)
    applyAutoCorrection(component, schema, errors, warnings) {
        const corrected = { ...component };
        let hasCorrections = false;

        if (!schema.properties) return corrected;

        Object.keys(schema.properties).forEach(propertyName => {
            const propertySchema = schema.properties[propertyName];

            // Apply default values for missing properties
            if (!(propertyName in corrected) && 'default' in propertySchema) {
                corrected[propertyName] = propertySchema.default;
                hasCorrections = true;
                warnings.push(`Applied default value for missing property '${propertyName}'`);
            }

            // Clamp numeric values to valid ranges
            if (propertyName in corrected && propertySchema.range && typeof corrected[propertyName] === 'number') {
                const [min, max] = propertySchema.range;
                const original = corrected[propertyName];
                corrected[propertyName] = Math.max(min, Math.min(max, corrected[propertyName]));

                if (corrected[propertyName] !== original) {
                    hasCorrections = true;
                    warnings.push(`Clamped '${propertyName}' from ${original} to ${corrected[propertyName]}`);
                }
            }
        });

        if (hasCorrections) {
            Utils.log(`Applied auto-corrections to component '${component.constructor.name}'`);
        }

        return corrected;
    }

    // Professional debugging and monitoring
    getValidationStats() {
        return {
            enabled: this.validationEnabled,
            strictMode: this.strictMode,
            strategiesCount: this.strategies.length,
            schemasCount: Object.keys(COMPONENT_SCHEMAS).length,
            availableSchemas: Object.keys(COMPONENT_SCHEMAS)
        };
    }

    // Debug helper for development
    debugLogSchemas() {
        console.log('=== COMPONENT VALIDATION SCHEMAS ===');
        Object.keys(COMPONENT_SCHEMAS).forEach(name => {
            console.log(`${name}:`, COMPONENT_SCHEMAS[name]);
        });
        console.log('=== END SCHEMAS ===');
    }
}

// ==========================================
// ENHANCED ENTITY WITH VALIDATION
// ==========================================
class ValidatedEntity extends Entity {
    constructor(id) {
        super(id);
        this.validator = ComponentValidator.getInstance();
    }

    addComponent(component) {
        // Validate component before adding
        const validation = this.validator.validateComponent(component);

        if (!validation.isValid) {
            if (this.validator.strictMode) {
                throw new ComponentValidationError(
                    `Component validation failed in strict mode: ${validation.errors.map(e => e.message).join(', ')}`,
                    VALIDATION_ERROR_TYPES.TYPE_MISMATCH,
                    component.constructor.name
                );
            } else {
                // Use corrected component if available
                const componentToAdd = validation.correctedComponent || component;
                Utils.warn(`Component validation warnings for ${component.constructor.name}:`, validation.warnings);
                return super.addComponent(componentToAdd);
            }
        }

        return super.addComponent(validation.correctedComponent || component);
    }

    // Validate all components (useful for debugging)
    validateAllComponents() {
        const results = [];

        for (const [componentName, component] of this.components) {
            const validation = this.validator.validateComponent(component, componentName);
            results.push({
                componentName,
                ...validation
            });
        }

        return results;
    }
}

// ==========================================
// GLOBAL ACCESS AND INTEGRATION
// ==========================================

// Global debug functions for professional development
window.debugComponentValidation = function() {
    const validator = ComponentValidator.getInstance();
    console.log('=== COMPONENT VALIDATOR DEBUG ===');
    console.log('Validation Stats:', validator.getValidationStats());
    validator.debugLogSchemas();
    console.log('=== END VALIDATION DEBUG ===');
};

window.validateComponent = function(component, componentName = null) {
    const validator = ComponentValidator.getInstance();
    const result = validator.validateComponent(component, componentName);
    console.log('Validation Result:', result);
    return result;
};

// Export for module systems or global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ComponentValidator,
        ValidatedEntity,
        ComponentValidationError,
        VALIDATION_ERROR_TYPES,
        COMPONENT_SCHEMAS
    };
} else {
    // Export to GameValidation namespace
    window.GameValidation = {
        ComponentValidator,
        ValidatedEntity,
        ComponentValidationError,
        VALIDATION_ERROR_TYPES,
        COMPONENT_SCHEMAS
    };

    // Also export key classes to global scope for easy access
    window.ValidatedEntity = ValidatedEntity;
    window.ComponentValidator = ComponentValidator;
    window.ComponentValidationError = ComponentValidationError;
}