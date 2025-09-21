/* ==========================================
   BOLLEN I BURKEN - ERROR HANDLING FRAMEWORK
   Enterprise-grade error management and debugging
   ========================================== */

/**
 * Error Levels - Professional categorization
 */
const ERROR_LEVELS = {
    DEBUG: { value: 0, name: 'DEBUG', color: '#888888' },
    INFO: { value: 1, name: 'INFO', color: '#0066cc' },
    WARN: { value: 2, name: 'WARN', color: '#ff9900' },
    ERROR: { value: 3, name: 'ERROR', color: '#cc0000' },
    CRITICAL: { value: 4, name: 'CRITICAL', color: '#ff0000' },
    FATAL: { value: 5, name: 'FATAL', color: '#990000' }
};

/**
 * Error Categories - System-specific categorization
 */
const ERROR_CATEGORIES = {
    SYSTEM: 'system',
    RESOURCE: 'resource',
    AI: 'ai',
    PLAYER: 'player',
    NETWORK: 'network',
    RENDERING: 'rendering',
    PHYSICS: 'physics',
    AUDIO: 'audio',
    UI: 'ui',
    VALIDATION: 'validation'
};

/**
 * Custom Error Classes for different domains
 */
class GameError extends Error {
    constructor(message, category = ERROR_CATEGORIES.SYSTEM, context = {}) {
        super(message);
        this.name = 'GameError';
        this.category = category;
        this.context = context;
        this.timestamp = Date.now();
        this.stack = this.stack || (new Error()).stack;
    }
}

class AIError extends GameError {
    constructor(message, context = {}) {
        super(message, ERROR_CATEGORIES.AI, context);
        this.name = 'AIError';
    }
}

class ResourceError extends GameError {
    constructor(message, context = {}) {
        super(message, ERROR_CATEGORIES.RESOURCE, context);
        this.name = 'ResourceError';
    }
}

class ValidationError extends GameError {
    constructor(message, context = {}) {
        super(message, ERROR_CATEGORIES.VALIDATION, context);
        this.name = 'ValidationError';
    }
}

class RenderingError extends GameError {
    constructor(message, context = {}) {
        super(message, ERROR_CATEGORIES.RENDERING, context);
        this.name = 'RenderingError';
    }
}

/**
 * Error Handler Strategy Interface
 */
class ErrorHandlerStrategy {
    handle(error, level, context) {
        throw new Error('Strategy must implement handle method');
    }
}

/**
 * Console Error Handler Strategy
 */
class ConsoleErrorStrategy extends ErrorHandlerStrategy {
    handle(error, level, context) {
        const timestamp = new Date().toISOString();
        const levelInfo = ERROR_LEVELS[level] || ERROR_LEVELS.ERROR;

        const prefix = `[${timestamp}] [${levelInfo.name}]`;
        const message = error instanceof Error ? error.message : String(error);

        // Style console output based on level
        const style = `color: ${levelInfo.color}; font-weight: bold;`;

        if (level === 'CRITICAL' || level === 'FATAL') {
            console.error(`%c${prefix}`, style, message);
            if (error.stack) console.error(error.stack);
            if (context) console.error('Context:', context);
        } else if (level === 'ERROR') {
            console.error(`%c${prefix}`, style, message);
            if (error.stack) console.error(error.stack);
        } else if (level === 'WARN') {
            console.warn(`%c${prefix}`, style, message);
        } else {
            console.log(`%c${prefix}`, style, message);
        }

        // Additional context logging
        if (context && Object.keys(context).length > 0) {
            console.groupCollapsed('Error Context');
            console.table(context);
            console.groupEnd();
        }
    }
}

/**
 * Error Storage Strategy (for error analytics)
 */
class StorageErrorStrategy extends ErrorHandlerStrategy {
    constructor() {
        super();
        this.errors = [];
        this.maxErrors = 100; // Keep last 100 errors
    }

    handle(error, level, context) {
        const errorRecord = {
            timestamp: Date.now(),
            level: level,
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : null,
            category: error.category || ERROR_CATEGORIES.SYSTEM,
            context: context || {},
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        this.errors.push(errorRecord);

        // Keep only the most recent errors
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }
    }

    getErrors(category = null, level = null) {
        return this.errors.filter(error => {
            if (category && error.category !== category) return false;
            if (level && error.level !== level) return false;
            return true;
        });
    }

    clearErrors() {
        this.errors = [];
    }

    exportErrors() {
        return JSON.stringify(this.errors, null, 2);
    }
}

/**
 * Enterprise Error Handler (Singleton + Strategy + Observer patterns)
 */
class ErrorHandler {
    constructor() {
        if (ErrorHandler.instance) {
            return ErrorHandler.instance;
        }

        // Error handling strategies
        this.strategies = new Map();
        this.observers = new Set();

        // Performance tracking
        this.errorCounts = new Map();
        this.performanceImpact = new Map();

        // Configuration
        this.config = {
            minLevel: ERROR_LEVELS.DEBUG.value,
            enableStackTrace: true,
            enablePerformanceTracking: true,
            enableRecovery: true,
            maxRecoveryAttempts: 3
        };

        // Recovery strategies
        this.recoveryStrategies = new Map();
        this.recoveryAttempts = new Map();

        // Initialize default strategies
        this.initializeDefaultStrategies();

        ErrorHandler.instance = this;
        Utils.log('ErrorHandler initialized (Enterprise patterns)');
    }

    /**
     * Initialize default error handling strategies
     */
    initializeDefaultStrategies() {
        this.addStrategy('console', new ConsoleErrorStrategy());
        this.addStrategy('storage', new StorageErrorStrategy());
    }

    /**
     * Add error handling strategy (Strategy pattern)
     */
    addStrategy(name, strategy) {
        if (!(strategy instanceof ErrorHandlerStrategy)) {
            throw new ValidationError('Strategy must extend ErrorHandlerStrategy');
        }
        this.strategies.set(name, strategy);
    }

    /**
     * Remove error handling strategy
     */
    removeStrategy(name) {
        return this.strategies.delete(name);
    }

    /**
     * Add error observer (Observer pattern)
     */
    addObserver(observer) {
        this.observers.add(observer);
    }

    /**
     * Remove error observer
     */
    removeObserver(observer) {
        this.observers.delete(observer);
    }

    /**
     * Handle error with full enterprise features
     */
    handle(error, level = 'ERROR', context = {}, options = {}) {
        const startTime = performance.now();

        try {
            // Validate level
            if (!ERROR_LEVELS[level]) {
                level = 'ERROR';
            }

            // Check minimum level
            if (ERROR_LEVELS[level].value < this.config.minLevel) {
                return;
            }

            // Enhance context with system information
            const enhancedContext = this.enhanceContext(context);

            // Track error statistics
            this.trackError(error, level);

            // Execute all strategies
            for (const [name, strategy] of this.strategies) {
                try {
                    strategy.handle(error, level, enhancedContext);
                } catch (strategyError) {
                    console.error(`Error in ${name} strategy:`, strategyError);
                }
            }

            // Notify observers
            this.notifyObservers(error, level, enhancedContext);

            // Attempt recovery if enabled
            if (this.config.enableRecovery && level !== 'DEBUG' && level !== 'INFO') {
                this.attemptRecovery(error, context);
            }

            // Track performance impact
            if (this.config.enablePerformanceTracking) {
                const duration = performance.now() - startTime;
                this.trackPerformance(level, duration);
            }

        } catch (handlingError) {
            // Fallback error handling
            console.error('Critical error in ErrorHandler:', handlingError);
            console.error('Original error:', error);
        }
    }

    /**
     * Enhance error context with system information
     */
    enhanceContext(context) {
        return {
            ...context,
            timestamp: new Date().toISOString(),
            gameState: this.getGameState(),
            performance: this.getPerformanceMetrics(),
            browser: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform
            },
            memory: this.getMemoryInfo()
        };
    }

    /**
     * Get current game state information
     */
    getGameState() {
        try {
            if (typeof window !== 'undefined' && window.debugGame) {
                const debug = window.debugGame();
                return {
                    phase: debug.gameEngine?.gameState?.gamePhase,
                    tick: debug.gameEngine?.gameState?.currentTick,
                    players: debug.gameEngine?.gameState?.players?.size,
                    entities: debug.gameEngine?.gameState?.entities?.size
                };
            }
        } catch (e) {
            // Ignore errors getting game state
        }
        return null;
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        try {
            return {
                timing: performance.timing ? {
                    loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart
                } : null,
                memory: performance.memory ? {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                } : null
            };
        } catch (e) {
            return null;
        }
    }

    /**
     * Get memory information
     */
    getMemoryInfo() {
        try {
            if (performance.memory) {
                return {
                    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                    limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
                };
            }
        } catch (e) {
            // Memory API not available
        }
        return null;
    }

    /**
     * Track error statistics
     */
    trackError(error, level) {
        const key = `${level}:${error.category || 'unknown'}`;
        const count = this.errorCounts.get(key) || 0;
        this.errorCounts.set(key, count + 1);
    }

    /**
     * Track performance impact of error handling
     */
    trackPerformance(level, duration) {
        const impacts = this.performanceImpact.get(level) || [];
        impacts.push(duration);

        // Keep only last 100 measurements
        if (impacts.length > 100) {
            impacts.shift();
        }

        this.performanceImpact.set(level, impacts);
    }

    /**
     * Notify all observers of error
     */
    notifyObservers(error, level, context) {
        for (const observer of this.observers) {
            try {
                observer(error, level, context);
            } catch (observerError) {
                console.error('Error in observer:', observerError);
            }
        }
    }

    /**
     * Attempt error recovery
     */
    attemptRecovery(error, context) {
        const errorKey = error.category || error.constructor.name;
        const strategy = this.recoveryStrategies.get(errorKey);

        if (strategy) {
            const attempts = this.recoveryAttempts.get(errorKey) || 0;

            if (attempts < this.config.maxRecoveryAttempts) {
                try {
                    strategy(error, context);
                    this.recoveryAttempts.set(errorKey, attempts + 1);
                } catch (recoveryError) {
                    this.handle(new GameError('Recovery failed', ERROR_CATEGORIES.SYSTEM, {
                        originalError: error.message,
                        recoveryError: recoveryError.message
                    }), 'ERROR');
                }
            }
        }
    }

    /**
     * Add recovery strategy for error category
     */
    addRecoveryStrategy(errorCategory, recoveryFunction) {
        this.recoveryStrategies.set(errorCategory, recoveryFunction);
    }

    /**
     * Configure error handler
     */
    configure(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Get error statistics
     */
    getStats() {
        return {
            errorCounts: Object.fromEntries(this.errorCounts),
            performanceImpact: Object.fromEntries(this.performanceImpact),
            strategiesCount: this.strategies.size,
            observersCount: this.observers.size,
            config: this.config
        };
    }

    /**
     * Get stored errors
     */
    getStoredErrors(category = null, level = null) {
        const storageStrategy = this.strategies.get('storage');
        if (storageStrategy && storageStrategy.getErrors) {
            return storageStrategy.getErrors(category, level);
        }
        return [];
    }

    /**
     * Clear all stored errors
     */
    clearErrors() {
        const storageStrategy = this.strategies.get('storage');
        if (storageStrategy && storageStrategy.clearErrors) {
            storageStrategy.clearErrors();
        }
    }

    /**
     * Export error data for analysis
     */
    exportErrors() {
        const storageStrategy = this.strategies.get('storage');
        if (storageStrategy && storageStrategy.exportErrors) {
            return storageStrategy.exportErrors();
        }
        return '[]';
    }
}

/**
 * Error Boundary Decorator - Wrap functions with error handling
 */
class ErrorBoundary {
    static wrap(fn, context = {}, options = {}) {
        return function(...args) {
            try {
                return fn.apply(this, args);
            } catch (error) {
                const errorHandler = ErrorHandler.getInstance();
                errorHandler.handle(error, options.level || 'ERROR', {
                    ...context,
                    function: fn.name || 'anonymous',
                    arguments: options.logArgs ? args : '[hidden]'
                });

                // Return default value or rethrow based on options
                if (options.returnDefault !== undefined) {
                    return options.returnDefault;
                } else if (options.suppressErrors) {
                    return null;
                } else {
                    throw error;
                }
            }
        };
    }

    static async wrapAsync(fn, context = {}, options = {}) {
        return async function(...args) {
            try {
                return await fn.apply(this, args);
            } catch (error) {
                const errorHandler = ErrorHandler.getInstance();
                errorHandler.handle(error, options.level || 'ERROR', {
                    ...context,
                    function: fn.name || 'anonymous',
                    arguments: options.logArgs ? args : '[hidden]',
                    async: true
                });

                if (options.returnDefault !== undefined) {
                    return options.returnDefault;
                } else if (options.suppressErrors) {
                    return null;
                } else {
                    throw error;
                }
            }
        };
    }
}

/**
 * Utility functions for common error scenarios
 */
class ErrorUtils {
    static createAIError(message, aiContext = {}) {
        return new AIError(message, {
            ...aiContext,
            system: 'AI',
            timestamp: Date.now()
        });
    }

    static createResourceError(message, resourceInfo = {}) {
        return new ResourceError(message, {
            ...resourceInfo,
            system: 'ResourceManager',
            timestamp: Date.now()
        });
    }

    static createValidationError(message, validationInfo = {}) {
        return new ValidationError(message, {
            ...validationInfo,
            system: 'Validation',
            timestamp: Date.now()
        });
    }

    static createRenderingError(message, renderingInfo = {}) {
        return new RenderingError(message, {
            ...renderingInfo,
            system: 'Rendering',
            timestamp: Date.now()
        });
    }
}

// Singleton instance access
ErrorHandler.getInstance = function() {
    if (!ErrorHandler.instance) {
        new ErrorHandler();
    }
    return ErrorHandler.instance;
};

// Export for module systems or global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ErrorHandler, ErrorBoundary, ErrorUtils,
        GameError, AIError, ResourceError, ValidationError, RenderingError,
        ERROR_LEVELS, ERROR_CATEGORIES
    };
} else {
    window.GameErrors = {
        ErrorHandler, ErrorBoundary, ErrorUtils,
        GameError, AIError, ResourceError, ValidationError, RenderingError,
        ERROR_LEVELS, ERROR_CATEGORIES
    };
}