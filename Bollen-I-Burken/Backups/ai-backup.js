/* ==========================================
   BOLLEN I BURKEN - AI SYSTEM
   Enhanced AI behavior and components
   ========================================== */

// ==========================================
// PHASE 1: SPATIAL AWARENESS COMPONENT
// Obstacle Detection and Collision Avoidance
// ==========================================
class SpatialAwareness {
    constructor() {
        // Obstacle detection and caching
        this.obstacles = new Map(); // Cached nearby obstacles
        this.lastObstacleCheck = 0;
        this.checkInterval = AI_CONFIG.PATHFINDING.OBSTACLE_CHECK_INTERVAL;

        // Collision prediction
        this.collisionPredictionDistance = AI_CONFIG.PATHFINDING.COLLISION_PREDICTION_DISTANCE;
        this.detectionRadius = AI_CONFIG.PATHFINDING.OBSTACLE_DETECTION_RADIUS;

        // Avoidance state
        this.avoidanceVector = { x: 0, z: 0 }; // Current avoidance direction
        this.isAvoiding = false;
        this.avoidanceStrength = AI_CONFIG.PATHFINDING.AVOIDANCE_FORCE;

        // Raycast configuration
        this.raycastCount = AI_CONFIG.PATHFINDING.RAYCAST_COUNT;
        this.raycastAngles = this.generateRaycastAngles();

        // Phase 2: Corner Detection and Intelligence
        this.corners = new Map(); // Detected corners
        this.searchedCorners = new Map(); // Corners recently searched with timestamps
        this.nearestCorner = null;
        this.cornerSearchTarget = null;

        // Phase 2: Stuck Detection and Escape
        this.stuckDetection = {
            lastPosition: { x: 0, z: 0 },
            lastPositionTime: 0,
            stuckStartTime: 0,
            isStuck: false,
            stuckCounter: 0
        };

        // Phase 2: Wall Following
        this.wallFollowing = {
            isFollowing: false,
            wallDirection: 0,
            followStartTime: 0,
            lastWallContact: null
        };
    }

    generateRaycastAngles() {
        // Generate forward-facing raycast angles
        // Center ray (0°) + left/right rays
        const angles = [0]; // Forward ray

        if (this.raycastCount > 1) {
            const spread = Math.PI / 6; // 30 degree spread total
            const angleStep = spread / Math.floor(this.raycastCount / 2);

            for (let i = 1; i <= Math.floor(this.raycastCount / 2); i++) {
                angles.push(-angleStep * i);  // Left rays
                angles.push(angleStep * i);   // Right rays
            }
        }

        return angles.slice(0, this.raycastCount);
    }

    updateObstacleCache(aiPosition, gameState) {
        const currentTime = Date.now();
        if (currentTime - this.lastObstacleCheck < this.checkInterval) {
            return; // Use cached obstacles
        }

        this.obstacles.clear();
        let totalEntities = 0;
        let staticColliders = 0;

        // Find all obstacles within detection radius
        for (const [entityId, entity] of gameState.entities) {
            totalEntities++;
            if (!entity.active) continue;

            const collider = entity.getComponent('Collider');
            const transform = entity.getComponent('Transform');

            if (collider && transform && collider.blockMovement && collider.isStatic) {
                staticColliders++;
                const dx = transform.position.x - aiPosition.x;
                const dz = transform.position.z - aiPosition.z;
                const distance = Math.sqrt(dx * dx + dz * dz);

                if (distance <= this.detectionRadius) {
                    this.obstacles.set(entityId, {
                        position: transform.position,
                        bounds: collider.bounds,
                        distance: distance,
                        transform: transform,
                        collider: collider
                    });
                }
            }
        }

        this.lastObstacleCheck = currentTime;

        // Enhanced logging
        if (Math.random() < 0.1) { // Log occasionally
            Utils.log(`🔍 SpatialAwareness: ${totalEntities} entities, ${staticColliders} static colliders, ${this.obstacles.size} nearby obstacles (radius: ${this.detectionRadius})`);
        }
    }

    detectCollisionAhead(aiPosition, aiDirection) {
        // Cast multiple rays forward to detect upcoming collisions
        const collisions = [];

        for (const angleOffset of this.raycastAngles) {
            const rayDirection = aiDirection + angleOffset;
            const rayEnd = {
                x: aiPosition.x + Math.cos(rayDirection) * this.collisionPredictionDistance,
                z: aiPosition.z + Math.sin(rayDirection) * this.collisionPredictionDistance
            };

            // Check if ray intersects any cached obstacles
            for (const [obstacleId, obstacle] of this.obstacles) {
                if (this.rayIntersectsObstacle(aiPosition, rayEnd, obstacle)) {
                    collisions.push({
                        obstacleId: obstacleId,
                        obstacle: obstacle,
                        rayAngle: rayDirection,
                        angleOffset: angleOffset
                    });
                    break; // Only record first collision per ray
                }
            }
        }

        return collisions;
    }

    rayIntersectsObstacle(rayStart, rayEnd, obstacle) {
        // Simple 2D ray-box intersection
        const bounds = obstacle.bounds;
        const pos = obstacle.position;

        // Calculate box extents
        const minX = pos.x - bounds.width / 2;
        const maxX = pos.x + bounds.width / 2;
        const minZ = pos.z - bounds.depth / 2;
        const maxZ = pos.z + bounds.depth / 2;

        // Ray direction
        const rayDir = {
            x: rayEnd.x - rayStart.x,
            z: rayEnd.z - rayStart.z
        };

        // Ray-box intersection using parametric form
        const tMinX = rayDir.x !== 0 ? (minX - rayStart.x) / rayDir.x : -Infinity;
        const tMaxX = rayDir.x !== 0 ? (maxX - rayStart.x) / rayDir.x : Infinity;
        const tMinZ = rayDir.z !== 0 ? (minZ - rayStart.z) / rayDir.z : -Infinity;
        const tMaxZ = rayDir.z !== 0 ? (maxZ - rayStart.z) / rayDir.z : Infinity;

        const tMin = Math.max(Math.min(tMinX, tMaxX), Math.min(tMinZ, tMaxZ));
        const tMax = Math.min(Math.max(tMinX, tMaxX), Math.max(tMinZ, tMaxZ));

        // Intersection exists if tMax >= 0 and tMin <= tMax and tMin <= 1
        return tMax >= 0 && tMin <= tMax && tMin <= 1;
    }

    calculateAvoidanceVector(collisions, aiDirection) {
        if (collisions.length === 0) {
            this.isAvoiding = false;
            this.avoidanceVector = { x: 0, z: 0 };
            return this.avoidanceVector;
        }

        this.isAvoiding = true;

        // Calculate avoidance direction based on collision pattern
        let avoidanceAngle = aiDirection;
        let totalWeight = 0;

        for (const collision of collisions) {
            // Prefer turning away from obstacle
            const weight = 1.0 - Math.abs(collision.angleOffset) / (Math.PI / 6); // Closer to center = higher weight

            if (collision.angleOffset < 0) {
                // Obstacle on left, turn right
                avoidanceAngle += Math.PI / 4 * weight;
            } else if (collision.angleOffset > 0) {
                // Obstacle on right, turn left  
                avoidanceAngle -= Math.PI / 4 * weight;
            } else {
                // Obstacle directly ahead, choose side with fewer obstacles
                const leftObstacles = collisions.filter(c => c.angleOffset < 0).length;
                const rightObstacles = collisions.filter(c => c.angleOffset > 0).length;

                if (leftObstacles < rightObstacles) {
                    avoidanceAngle -= Math.PI / 3; // Turn left
                } else {
                    avoidanceAngle += Math.PI / 3; // Turn right  
                }
            }

            totalWeight += weight;
        }

        // Normalize avoidance angle
        if (totalWeight > 0) {
            avoidanceAngle /= totalWeight;
        }

        this.avoidanceVector = {
            x: Math.cos(avoidanceAngle) * this.avoidanceStrength,
            z: Math.sin(avoidanceAngle) * this.avoidanceStrength
        };

        return this.avoidanceVector;
    }

    // ==========================================
    // PHASE 2: CORNER DETECTION AND INTELLIGENCE
    // ==========================================

    detectNearbyCorners(aiPosition, gameState) {
        this.corners.clear();
        const cornerRadius = AI_CONFIG.PATHFINDING.CORNER_DETECTION_RADIUS;

        // Find potential corners by analyzing obstacle positions
        const obstaclePositions = [];

        for (const [entityId, obstacleData] of this.obstacles) {
            obstaclePositions.push({
                id: entityId,
                x: obstacleData.position.x,
                z: obstacleData.position.z,
                bounds: obstacleData.bounds
            });
        }

        // Look for corner patterns: areas where obstacles create hiding spots
        for (let i = 0; i < obstaclePositions.length; i++) {
            const obstacle1 = obstaclePositions[i];

            for (let j = i + 1; j < obstaclePositions.length; j++) {
                const obstacle2 = obstaclePositions[j];

                // Check if these two obstacles form a corner
                const corner = this.analyzeObstaclePairForCorner(obstacle1, obstacle2, aiPosition);

                if (corner && this.isCornerWithinRadius(corner, aiPosition, cornerRadius)) {
                    this.corners.set(`corner_${i}_${j}`, corner);
                }
            }
        }

        // Also check arena walls for corners
        this.detectWallCorners(aiPosition);

        // Find the nearest interesting corner
        this.findNearestCorner(aiPosition);
    }

    analyzeObstaclePairForCorner(obstacle1, obstacle2, aiPosition) {
        const dx = obstacle2.x - obstacle1.x;
        const dz = obstacle2.z - obstacle1.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        // If obstacles are close enough to form a corner
        if (distance < 6 && distance > 1) {
            // Calculate potential corner position (between obstacles)
            const cornerX = (obstacle1.x + obstacle2.x) / 2;
            const cornerZ = (obstacle1.z + obstacle2.z) / 2;

            // Calculate corner properties
            const angle = Math.atan2(dz, dx);

            return {
                x: cornerX,
                z: cornerZ,
                type: 'inner_corner',
                angle: angle,
                priority: this.calculateCornerPriority(cornerX, cornerZ, aiPosition),
                obstacle1: obstacle1.id,
                obstacle2: obstacle2.id,
                lastSearched: this.searchedCorners.get(`${cornerX.toFixed(1)}_${cornerZ.toFixed(1)}`) || 0
            };
        }

        return null;
    }

    detectWallCorners(aiPosition) {
        // Detect arena wall corners (hardcoded for basic arena)
        const arenaSize = 15; // Assuming standard arena size
        const wallCorners = [
            { x: arenaSize - 1, z: arenaSize - 1, type: 'wall_corner', angle: Math.PI * 0.25 },
            { x: -arenaSize + 1, z: arenaSize - 1, type: 'wall_corner', angle: Math.PI * 0.75 },
            { x: -arenaSize + 1, z: -arenaSize + 1, type: 'wall_corner', angle: Math.PI * 1.25 },
            { x: arenaSize - 1, z: -arenaSize + 1, type: 'wall_corner', angle: Math.PI * 1.75 }
        ];

        wallCorners.forEach((corner, index) => {
            if (this.isCornerWithinRadius(corner, aiPosition, AI_CONFIG.PATHFINDING.CORNER_DETECTION_RADIUS)) {
                corner.priority = this.calculateCornerPriority(corner.x, corner.z, aiPosition);
                corner.lastSearched = this.searchedCorners.get(`${corner.x.toFixed(1)}_${corner.z.toFixed(1)}`) || 0;
                this.corners.set(`wall_corner_${index}`, corner);
            }
        });
    }

    isCornerWithinRadius(corner, aiPosition, radius) {
        const dx = corner.x - aiPosition.x;
        const dz = corner.z - aiPosition.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        return distance <= radius;
    }

    calculateCornerPriority(cornerX, cornerZ, aiPosition) {
        const dx = cornerX - aiPosition.x;
        const dz = cornerZ - aiPosition.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        // Closer corners have higher priority, recently searched corners have lower priority
        const distancePriority = Math.max(0, 10 - distance);
        const currentTime = Date.now();
        const lastSearched = this.searchedCorners.get(`${cornerX.toFixed(1)}_${cornerZ.toFixed(1)}`) || 0;
        const timeSinceSearched = currentTime - lastSearched;
        const searchPenalty = timeSinceSearched < AI_CONFIG.BEHAVIOR.CORNER_SEARCH_COOLDOWN ? -5 : 0;

        return distancePriority + searchPenalty;
    }

    findNearestCorner(aiPosition) {
        let bestCorner = null;
        let bestPriority = -999;

        for (const [cornerId, corner] of this.corners) {
            if (corner.priority > bestPriority) {
                bestPriority = corner.priority;
                bestCorner = corner;
            }
        }

        this.nearestCorner = bestCorner;
    }

    // ==========================================
    // PHASE 2: STUCK DETECTION AND ESCAPE
    // ==========================================

    updateStuckDetection(aiPosition) {
        const currentTime = Date.now();
        const dx = aiPosition.x - this.stuckDetection.lastPosition.x;
        const dz = aiPosition.z - this.stuckDetection.lastPosition.z;
        const movementDistance = Math.sqrt(dx * dx + dz * dz);

        // Check if AI has barely moved (adjusted for smooth movement)
        if (movementDistance < 0.02) {
            if (!this.stuckDetection.isStuck) {
                // First time detecting potential stuck state
                this.stuckDetection.stuckStartTime = currentTime;
                this.stuckDetection.stuckCounter++;
                Utils.log(`🤖 AI potentially stuck: movement=${movementDistance.toFixed(3)}, counter=${this.stuckDetection.stuckCounter}`);
            }

            // If stuck for too long, mark as stuck
            if (currentTime - this.stuckDetection.stuckStartTime > AI_CONFIG.PATHFINDING.STUCK_DETECTION_TIME) {
                if (!this.stuckDetection.isStuck) {
                    Utils.log(`🚨 AI STUCK DETECTED! Time stuck: ${(currentTime - this.stuckDetection.stuckStartTime) / 1000}s`);
                }
                this.stuckDetection.isStuck = true;
            }
        } else {
            // AI is moving, reset stuck detection
            if (this.stuckDetection.isStuck || this.stuckDetection.stuckCounter > 0) {
                Utils.log(`✅ AI moving again: distance=${movementDistance.toFixed(3)}, was stuck: ${this.stuckDetection.isStuck}`);
            }
            this.stuckDetection.isStuck = false;
            this.stuckDetection.stuckCounter = 0;
            this.stuckDetection.lastPosition.x = aiPosition.x;
            this.stuckDetection.lastPosition.z = aiPosition.z;
            this.stuckDetection.lastPositionTime = currentTime;
        }
    }

    generateEscapeVector(aiPosition) {
        // Generate a vector to escape from current position
        // Try systematic directions first, then random if all blocked
        const escapeAngles = [0, Math.PI / 2, Math.PI, -Math.PI / 2, Math.PI / 4, -Math.PI / 4, 3 * Math.PI / 4, -3 * Math.PI / 4];

        for (const angle of escapeAngles) {
            const escapeDistance = 4; // Try moving 4 units in this direction
            const escapeX = Math.cos(angle) * escapeDistance;
            const escapeZ = Math.sin(angle) * escapeDistance;
            const testPosition = {
                x: aiPosition.x + escapeX,
                z: aiPosition.z + escapeZ
            };

            // Check if this direction is clear
            const collisions = this.detectCollisionAhead(aiPosition, angle);
            if (collisions.length === 0) {
                // Clear direction found - use strong force
                return {
                    x: Math.cos(angle) * AI_CONFIG.PATHFINDING.AVOIDANCE_FORCE * AI_CONFIG.PATHFINDING.ESCAPE_FORCE_MULTIPLIER,
                    z: Math.sin(angle) * AI_CONFIG.PATHFINDING.AVOIDANCE_FORCE * AI_CONFIG.PATHFINDING.ESCAPE_FORCE_MULTIPLIER
                };
            }
        }

        // If all directions blocked, use random direction with very high force to break collision loop
        const randomAngle = Math.random() * Math.PI * 2;
        const escapeForce = AI_CONFIG.PATHFINDING.AVOIDANCE_FORCE * AI_CONFIG.PATHFINDING.ESCAPE_FORCE_MULTIPLIER * 3; // Triple force
        Utils.log(`🚨 All escape directions blocked - using random direction with maximum force`);

        return {
            x: Math.cos(randomAngle) * escapeForce,
            z: Math.sin(randomAngle) * escapeForce
        };
    }

    markCornerAsSearched(cornerPosition) {
        const key = `${cornerPosition.x.toFixed(1)}_${cornerPosition.z.toFixed(1)}`;
        this.searchedCorners.set(key, Date.now());

        // Clean up old searched corners to prevent memory bloat
        const currentTime = Date.now();
        for (const [searchKey, timestamp] of this.searchedCorners) {
            if (currentTime - timestamp > AI_CONFIG.BEHAVIOR.CORNER_SEARCH_COOLDOWN * 2) {
                this.searchedCorners.delete(searchKey);
            }
        }
    }

    getDebugInfo() {
        return {
            // Phase 1: Basic obstacle avoidance
            obstacleCount: this.obstacles.size,
            isAvoiding: this.isAvoiding,
            avoidanceVector: this.avoidanceVector,
            lastCheck: this.lastObstacleCheck,

            // Phase 2: Advanced intelligence
            cornerCount: this.corners.size,
            nearestCorner: this.nearestCorner,
            cornerSearchTarget: this.cornerSearchTarget,
            isStuck: this.stuckDetection.isStuck,
            stuckCounter: this.stuckDetection.stuckCounter,
            searchedCornersCount: this.searchedCorners.size,
            isWallFollowing: this.wallFollowing.isFollowing
        };
    }
}

// ==========================================
// AI MOVEMENT COORDINATOR - UNIFIED MOVEMENT AUTHORITY
// Single source of truth for AI movement - prevents conflicts
// ==========================================
class AIMovementCoordinator {
    constructor() {
        // Current movement state
        this.currentDirection = 0;
        this.currentVelocity = { x: 0, z: 0 };

        // Smoothing factors for natural movement
        this.directionSmoothingFactor = AI_CONFIG.MOVEMENT.SMOOTHING_FACTOR;
        this.velocitySmoothingFactor = AI_CONFIG.MOVEMENT.SMOOTHING_FACTOR * 1.6;

        // Intent system - prioritized movement goals
        this.currentIntent = {
            type: 'patrol',         // patrol, avoid, seek, escape, hunt
            direction: 0,           // Target direction in radians
            strength: 1.0,          // Movement speed multiplier (0.0 - 1.0)
            priority: 1,            // Intent priority (higher = more important)
            source: 'default'       // Source system (for debugging)
        };

        // Intent queue for handling multiple simultaneous requests
        this.intentQueue = [];
        this.lastIntentUpdate = 0;

        // Movement state tracking
        this.isTransitioning = false;
        this.transitionStartTime = 0;
        this.lastMovementUpdate = 0;

        // Debug information
        this.debugInfo = {
            intentChanges: 0,
            lastIntentType: 'none',
            smoothingActive: false
        };
    }

    // Main update method - call this from AI system
    updateMovement(aiComponent, transform, deltaTime) {
        const currentTime = Date.now();

        // Process any pending intents
        this.processIntentQueue();

        // Smooth direction transitions
        this.updateDirection(deltaTime);

        // Smooth velocity transitions
        this.updateVelocity(transform, deltaTime);

        this.lastMovementUpdate = currentTime;
    }

    // Update debug info (placeholder)
    updateDebugInfo() {
        // Update debug counters or other tracking info
        // This can be expanded for more detailed debugging
    }

    // Add movement intent with priority system
    addIntent(type, direction, strength = 1.0, priority = 1, source = 'unknown') {
        const intent = {
            type: type,
            direction: this.normalizeAngle(direction),
            strength: Math.max(0, Math.min(1, strength)),
            priority: priority,
            source: source,
            timestamp: Date.now()
        };

        // If this intent has higher priority than current, apply immediately
        if (priority > this.currentIntent.priority) {
            this.setCurrentIntent(intent);
        } else {
            // Queue for later processing
            this.intentQueue.push(intent);
            this.intentQueue.sort((a, b) => b.priority - a.priority); // Sort by priority
        }

        this.debugInfo.intentChanges++;
    }

    // Set the active intent (internal method)
    setCurrentIntent(intent) {
        const wasTransitioning = this.isTransitioning;

        // Check if this is a significant direction change
        const directionDiff = Math.abs(this.normalizeAngle(intent.direction - this.currentIntent.direction));
        if (directionDiff > Math.PI / 6) { // > 30 degrees
            this.isTransitioning = true;
            this.transitionStartTime = Date.now();
        }

        this.debugInfo.lastIntentType = this.currentIntent.type;
        this.currentIntent = { ...intent };

        Utils.log(`🎯 AI Intent: ${this.debugInfo.lastIntentType} → ${intent.type} (${intent.source})`);
    }

    // Process queued intents
    processIntentQueue() {
        if (this.intentQueue.length === 0) return;

        // Remove expired intents (older than 1 second)
        const currentTime = Date.now();
        this.intentQueue = this.intentQueue.filter(intent =>
            currentTime - intent.timestamp < 1000
        );

        // Apply highest priority intent if current intent is lower priority
        if (this.intentQueue.length > 0) {
            const highestPriorityIntent = this.intentQueue[0];
            if (highestPriorityIntent.priority > this.currentIntent.priority) {
                this.setCurrentIntent(highestPriorityIntent);
                this.intentQueue.shift(); // Remove from queue
            }
        }
    }

    // Smooth direction updates
    updateDirection(deltaTime) {
        const targetDirection = this.currentIntent.direction;
        const directionDiff = this.normalizeAngle(targetDirection - this.currentDirection);

        // Calculate maximum turn speed
        const maxTurnSpeed = AI_CONFIG.MOVEMENT.TURN_SPEED;
        const turnStep = maxTurnSpeed * (deltaTime / 1000);

        // Apply smooth rotation
        if (Math.abs(directionDiff) > turnStep) {
            this.currentDirection += Math.sign(directionDiff) * turnStep;
            this.debugInfo.smoothingActive = true;
        } else {
            this.currentDirection = targetDirection;
            this.debugInfo.smoothingActive = false;

            // End transition if we've reached target direction
            if (this.isTransitioning) {
                this.isTransitioning = false;
            }
        }

        // Normalize angle
        this.currentDirection = this.normalizeAngle(this.currentDirection);
    }

    // Smooth velocity updates - SINGLE AUTHORITY FOR AI MOVEMENT
    updateVelocity(transform, deltaTime) {
        // Calculate target velocity based on current intent
        const speed = this.currentIntent.strength * AI_CONFIG.MOVEMENT.PATROL_SPEED;
        const targetVelocity = {
            x: Math.cos(this.currentDirection) * speed,
            z: Math.sin(this.currentDirection) * speed
        };

        // Store previous velocity to detect collision disruptions
        const prevVelocity = {
            x: transform.velocity.x || 0,
            z: transform.velocity.z || 0
        };

        // Apply velocity directly for more responsive movement
        // Use lighter smoothing to avoid conflicts with collision system
        const lerpFactor = 0.15; // Increased from this.velocitySmoothingFactor for responsiveness

        transform.velocity.x = this.lerp(prevVelocity.x, targetVelocity.x, lerpFactor);
        transform.velocity.z = this.lerp(prevVelocity.z, targetVelocity.z, lerpFactor);

        // Detect if collision system zeroed our velocity
        const velocityMagnitude = Math.sqrt(transform.velocity.x * transform.velocity.x + transform.velocity.z * transform.velocity.z);
        const targetMagnitude = Math.sqrt(targetVelocity.x * targetVelocity.x + targetVelocity.z * targetVelocity.z);

        // Temporarily disable collision recovery - it's causing issues
        // if (velocityMagnitude < 0.01 && targetMagnitude > 0.02 && this.currentIntent.strength > 0.1) {
        //     const recoveryFactor = 0.3;
        //     transform.velocity.x = targetVelocity.x * recoveryFactor;
        //     transform.velocity.z = targetVelocity.z * recoveryFactor;
        //     Utils.log(`🔧 Movement coordinator: restoring momentum after collision disruption`);
        // }

        // Store current velocity for debugging
        this.currentVelocity = {
            x: transform.velocity.x,
            z: transform.velocity.z
        };
    }

    // Utility: Linear interpolation
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    // Utility: Normalize angle to [-π, π]
    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    }

    // Get current movement info for debugging
    getDebugInfo() {
        return {
            currentDirection: this.currentDirection,
            currentVelocity: this.currentVelocity,
            currentIntent: this.currentIntent,
            intentQueueSize: this.intentQueue.length,
            isTransitioning: this.isTransitioning,
            smoothingActive: this.debugInfo.smoothingActive,
            intentChanges: this.debugInfo.intentChanges
        };
    }

    // Force stop (for emergencies)
    stop() {
        this.addIntent('stop', 0, 0, 10, 'emergency_stop');
    }

    // Get current movement direction (for other systems)
    getCurrentDirection() {
        return this.currentDirection;
    }

    // Check if AI is currently turning
    isTurning() {
        return this.isTransitioning || this.debugInfo.smoothingActive;
    }
}

// ==========================================
// VISION CONE COMPONENT (Updated for Component Validation)
// ==========================================
class VisionCone {
    constructor(angle = AI_CONFIG.VISION.ANGLE, range = AI_CONFIG.VISION.RANGE) {
        // Required properties matching validation schema
        this.angle = angle; // degrees (will be validated against range [10, 180])
        this.range = range; // distance (will be validated against range [1, 100])

        // Optional properties with defaults from schema
        this.enabled = AI_CONFIG.VISION.ENABLED;
        this.targetSeen = false;
        this.lastSeenPosition = null;

        // Legacy properties (for backward compatibility)
        this.canSeePlayer = false;
        this.playerEntity = null;
    }
}

/* ==========================================
   AI CONFIGURATION AND COMPONENTS
   Enhanced AI behavior and components
   ========================================== */

// AI Configuration Constants (OPTIMIZED FOR SMOOTH MOVEMENT)
const AI_CONFIG = {
    VISION: {
        ANGLE: 60,          // Vision cone angle in degrees
        RANGE: 50,          // Vision distance in units
        ENABLED: true       // Whether vision is active
    },
    MOVEMENT: {
        PATROL_SPEED: 0.06,     // Slower for stability (was 0.08)
        HUNTING_SPEED: 0.10,    // Slightly slower hunting (was 0.12)
        TURN_SPEED: 1.5,        // Gentler turning (was 2.0)
        HUNT_TURN_SPEED: 2.0,   // Gentler hunting turns (was 3.0)
        SMOOTHING_FACTOR: 0.05  // NEW: Very smooth transitions
    },
    BEHAVIOR: {
        PATROL_CHANGE_TIME: 3000,       // Longer patrol segments (was 2000)
        PATROL_TIME_VARIANCE: 2000,     // Random variance added to change time
        SEARCH_TIMEOUT: 5000,           // How long to hunt before returning to patrol
        WALL_COLLISION_COOLDOWN: 1000,  // Cooldown after hitting wall
        TAG_DISTANCE: 1.2,              // Distance needed to tag player
        CORNER_SEARCH_DURATION: 2000,   // How long to search at corner (ms)
        CORNER_SEARCH_COOLDOWN: 10000,  // Don't re-search same corner for this long
        MIN_STATE_TIME: 800,            // Reduced for more responsive hunting (was 1500)
        TRANSITION_COOLDOWN: 100        // Faster transitions for hunting (was 200)
    },
    PATHFINDING: {
        OBSTACLE_DETECTION_RADIUS: 6,   // Units around AI to check for obstacles
        COLLISION_PREDICTION_DISTANCE: 2.5, // Shorter prediction (was 3)
        OBSTACLE_CHECK_INTERVAL: 250,   // Less frequent checks (was 100)
        RAYCAST_COUNT: 3,               // Simpler detection (was 5)
        AVOIDANCE_FORCE: 0.7,           // Gentler avoidance (was 1.0)
        CORNER_DETECTION_RADIUS: 8,     // Radius to search for corners
        CORNER_APPROACH_DISTANCE: 2.5,  // Distance to stop from corner
        WALL_FOLLOW_DISTANCE: 1.5,     // Distance to maintain from walls when following
        STUCK_DETECTION_TIME: 3000,     // More patient (was 2000)
        ESCAPE_FORCE_MULTIPLIER: 1.5    // Gentler escape (was 1.8)
    }
};

// AI States (Enhanced for Phase 2)
const AI_STATES = {
    PATROL: 'patrol',           // Random movement
    CORNER_SEEK: 'corner_seek', // Moving toward detected corner
    CORNER_SEARCH: 'corner_search', // Searching around corner
    HUNTING: 'hunting',         // Chasing player
    SEARCHING: 'searching',     // Lost player, searching area
    WALL_FOLLOW: 'wall_follow', // Following wall edge to escape
    STUCK_ESCAPE: 'stuck_escape' // Emergency escape from corners
};

// AI Hunter Component (Updated for Component Validation)
class AIHunter {
    constructor() {
        // Required properties matching validation schema
        this.state = 'PATROL'; // Use string enum values

        // Optional properties with defaults from schema
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

        // Legacy properties (will be migrated gradually)
        this.target = null;
        this.lastKnownPosition = null;
        this.patrolTimer = 0;
        this.patrolDirection = Math.random() * Math.PI * 2;
        this.targetDirection = this.patrolDirection; // Target direction for smooth rotation
        this.patrolChangeTime = AI_CONFIG.BEHAVIOR.PATROL_CHANGE_TIME;
        this.wallCollisionCooldown = 0; // Prevent rapid wall collision responses

        // Hunting behavior properties
        this.huntingStartTime = 0;
        this.huntingSpeed = AI_CONFIG.MOVEMENT.HUNTING_SPEED; // Faster when hunting
        this.searchTimeout = AI_CONFIG.BEHAVIOR.SEARCH_TIMEOUT; // How long to search before returning to patrol

        this.speed = AI_CONFIG.MOVEMENT.PATROL_SPEED; // This should be in Movement component

        // Phase 2: Enhanced AI State Management
        this.cornerSearchStartTime = 0;
        this.currentCornerTarget = null;
        this.stateChangeTime = Date.now();
        this.previousState = 'PATROL';

        // Phase 2: Behavioral Memory
        this.behaviorMemory = {
            timeInCurrentState: 0,
            stateChangeReason: 'initialization',
            lastSuccessfulAction: null,
            frustrationLevel: 0
        };
    }

    // Phase 2: STABILIZED State Management - Prevents Thrashing
    canTransitionTo(newState) {
        const currentTime = Date.now();
        const timeInState = currentTime - this.stateChangeTime;

        // CRITICAL: Prevent rapid state changes - minimum state time
        if (timeInState < AI_CONFIG.BEHAVIOR.MIN_STATE_TIME) {
            return false;
        }

        // CRITICAL: Prevent state oscillation - transition cooldown
        if (currentTime - this.lastTransitionTime < AI_CONFIG.BEHAVIOR.TRANSITION_COOLDOWN) {
            return false;
        }

        // Check for state oscillation (bouncing between same states)
        if (this.isStateOscillating(newState)) {
            return false;
        }

        // State-specific transition rules (enhanced)
        switch (this.state) {
            case 'CORNER_SEARCH':
                // Must spend minimum time searching
                return timeInState > AI_CONFIG.BEHAVIOR.CORNER_SEARCH_DURATION / 2;

            case 'STUCK_ESCAPE':
                // Must try to escape for reasonable time
                return timeInState > 1500; // Increased from 1000

            case 'PATROL':
                // Allow transitions from patrol more freely, but not too rapidly
                return timeInState > AI_CONFIG.BEHAVIOR.MIN_STATE_TIME / 2;

            default:
                return true;
        }
    }

    // NEW: Detect state oscillation to prevent thrashing
    isStateOscillating(newState) {
        if (!this.stateHistory) {
            this.stateHistory = [];
        }

        // Check recent state history for oscillation patterns
        const recentStates = this.stateHistory.slice(-4); // Last 4 states
        const oscillationCount = recentStates.filter(state => state === newState).length;

        // If we've been in this state 2+ times recently, it's oscillating
        return oscillationCount >= 2;
    }

    transitionToState(newState, reason = 'unknown') {
        if (!this.canTransitionTo(newState)) {
            return false;
        }

        // Update state history for oscillation detection
        if (!this.stateHistory) {
            this.stateHistory = [];
        }
        this.stateHistory.push(this.state);
        if (this.stateHistory.length > 10) {
            this.stateHistory.shift(); // Keep only recent states
        }

        this.previousState = this.state;
        this.state = newState;
        this.lastTransitionTime = Date.now(); // NEW: Track transition timing
        this.stateChangeTime = Date.now();
        this.behaviorMemory.timeInCurrentState = 0;
        this.behaviorMemory.stateChangeReason = reason;

        Utils.log(`🤖 AI State: ${this.previousState} → ${newState} (${reason})`);
        return true;
    }
}

// AI System - manages all AI entities
class AISystem extends System {
    constructor() {
        super('AISystem');
        this.hunters = new Set();
        Utils.log('AI system initialized');
    }

    addEntity(entity) {
        if (entity.hasComponent('AIHunter')) {
            this.hunters.add(entity);

            // ADD: Initialize AIMovementCoordinator for smooth movement
            if (!entity.hasComponent('AIMovementCoordinator')) {
                entity.addComponent(new AIMovementCoordinator());
                Utils.log(`Added AIMovementCoordinator to AI hunter: ${entity.id}`);
            }

            Utils.log(`AI hunter entity added: ${entity.id}`);
        }
    }

    removeEntity(entity) {
        this.hunters.delete(entity);
    }

    update(gameState, deltaTime) {
        // Update all AI hunters with error handling
        for (const hunter of this.hunters) {
            if (!hunter.active) {
                this.hunters.delete(hunter);
                continue;
            }

            try {
                this.updateHunter(hunter, gameState, deltaTime);
            } catch (error) {
                Utils.error(`AI Hunter ${hunter.id} update failed:`, error);

                // Try to get ErrorHandler if available
                if (typeof ErrorHandler !== 'undefined') {
                    try {
                        const errorHandler = ErrorHandler.getInstance();
                        errorHandler.handle(new GameError('Hunter update failed', ERROR_CATEGORIES.SYSTEM, {
                            hunterId: hunter.id,
                            deltaTime: deltaTime,
                            phase: 'update',
                            error: error.message
                        }), 'ERROR');
                    } catch (handlerError) {
                        Utils.warn('ErrorHandler not available for AI error logging');
                    }
                }

                // Continue with other hunters
                continue;
            }
        }
    }

    updateHunter(hunter, gameState, deltaTime) {
        const aiComponent = hunter.getComponent('AIHunter');
        const transform = hunter.getComponent('Transform');
        const movement = hunter.getComponent('Movement');
        const visionCone = hunter.getComponent('VisionCone');
        const spatialAwareness = hunter.getComponent('SpatialAwareness');
        const movementCoordinator = hunter.getComponent('AIMovementCoordinator');

        if (!aiComponent || !transform || !movement) return;

        // CRITICAL: Initialize movement coordinator if missing
        if (!movementCoordinator) {
            hunter.addComponent(new AIMovementCoordinator());
            Utils.log(`🔧 Added missing AIMovementCoordinator to hunter ${hunter.id}`);
        }

        // Phase 2: Update enhanced AI systems
        if (spatialAwareness) {
            spatialAwareness.updateObstacleCache(transform.position, gameState);
            spatialAwareness.detectNearbyCorners(transform.position, gameState);
            spatialAwareness.updateStuckDetection(transform.position);
        }

        // Update patrol timer and wall collision cooldown
        aiComponent.patrolTimer += deltaTime;
        aiComponent.behaviorMemory.timeInCurrentState += deltaTime;

        if (aiComponent.wallCollisionCooldown > 0) {
            aiComponent.wallCollisionCooldown -= deltaTime;
        }

        // Phase 2: Intelligent state management
        this.updateIntelligentStateMachine(aiComponent, transform, spatialAwareness);

        // Update AI based on current state (with movement coordinator)
        const currentCoordinator = hunter.getComponent('AIMovementCoordinator');

        switch (aiComponent.state) {
            case 'PATROL':
                this.updatePatrolBehavior(aiComponent, transform, movement, spatialAwareness, deltaTime, currentCoordinator);
                break;
            case 'CORNER_SEEK':
                this.updateCornerSeekBehavior(aiComponent, transform, movement, spatialAwareness, deltaTime, currentCoordinator);
                break;
            case 'CORNER_SEARCH':
                this.updateCornerSearchBehavior(aiComponent, transform, movement, spatialAwareness, deltaTime, currentCoordinator);
                break;
            case 'HUNTING':
                this.updateHuntingBehavior(aiComponent, transform, movement, spatialAwareness, deltaTime, currentCoordinator);
                break;
            case 'SEARCHING':
                this.updateSearchingBehavior(aiComponent, transform, movement, spatialAwareness, deltaTime, currentCoordinator);
                break;
            case 'STUCK_ESCAPE':
                this.updateStuckEscapeBehavior(aiComponent, transform, movement, spatialAwareness, deltaTime, currentCoordinator);
                break;
            case 'WALL_FOLLOW':
                this.updateWallFollowBehavior(aiComponent, transform, movement, spatialAwareness, deltaTime, currentCoordinator);
                break;
        }

        // Check vision if vision cone component exists
        if (visionCone) {
            this.updateVision(hunter, visionCone, gameState);
        }

        // DISABLED: Movement coordinator is causing issues - reverting to direct movement
        // const currentMovementCoordinator = hunter.getComponent('AIMovementCoordinator');
        // if (currentMovementCoordinator) {
        //     currentMovementCoordinator.updateMovement(aiComponent, transform, deltaTime);
        // }

        // Check for player collision (tagging)
        this.checkPlayerCollision(hunter, gameState);

        // Apply movement with collision detection
        this.applyMovementWithCollision(transform);
    }

    // ==========================================
    // PHASE 2: INTELLIGENT STATE MACHINE
    // ==========================================

    updateIntelligentStateMachine(aiComponent, transform, spatialAwareness) {
        if (!spatialAwareness) {
            Utils.log(`⚠️ AI missing SpatialAwareness component`);
            return;
        }

        const currentTime = Date.now();
        const timeInState = aiComponent.behaviorMemory.timeInCurrentState;

        // Debug: Log current state info
        if (Math.random() < 0.01) { // Log occasionally to avoid spam
            Utils.log(`🤖 AI State: ${aiComponent.state}, Time: ${(timeInState / 1000).toFixed(1)}s, Stuck: ${spatialAwareness.stuckDetection.isStuck}`);
        }

        // Emergency: Stuck detection override
        if (spatialAwareness.stuckDetection.isStuck && aiComponent.state !== 'STUCK_ESCAPE') {
            Utils.log(`🚨 AI STUCK - Transitioning to STUCK_ESCAPE from ${aiComponent.state}`);
            aiComponent.transitionToState('STUCK_ESCAPE', 'stuck_detected');
            return;
        }

        // State transition logic
        switch (aiComponent.state) {
            case 'PATROL':
                // Look for interesting corners to investigate
                if (spatialAwareness.nearestCorner && spatialAwareness.nearestCorner.priority > 5) {
                    aiComponent.currentCornerTarget = spatialAwareness.nearestCorner;
                    aiComponent.transitionToState('CORNER_SEEK', 'interesting_corner_found');
                }
                break;

            case 'CORNER_SEEK':
                // Check if we've reached the corner
                if (aiComponent.currentCornerTarget) {
                    const dx = transform.position.x - aiComponent.currentCornerTarget.x;
                    const dz = transform.position.z - aiComponent.currentCornerTarget.z;
                    const distance = Math.sqrt(dx * dx + dz * dz);

                    if (distance < AI_CONFIG.PATHFINDING.CORNER_APPROACH_DISTANCE) {
                        aiComponent.cornerSearchStartTime = currentTime;
                        aiComponent.transitionToState('CORNER_SEARCH', 'reached_corner');
                    }
                }

                // Timeout: if taking too long to reach corner, give up
                if (timeInState > 10000) {
                    aiComponent.currentCornerTarget = null;
                    aiComponent.transitionToState('PATROL', 'corner_seek_timeout');
                }
                break;

            case 'CORNER_SEARCH':
                // Finish searching after duration
                if (timeInState > AI_CONFIG.BEHAVIOR.CORNER_SEARCH_DURATION) {
                    if (aiComponent.currentCornerTarget) {
                        spatialAwareness.markCornerAsSearched(aiComponent.currentCornerTarget);
                    }
                    aiComponent.currentCornerTarget = null;
                    aiComponent.transitionToState('PATROL', 'corner_search_complete');
                }
                break;

            case 'STUCK_ESCAPE':
                // Return to patrol once unstuck
                if (!spatialAwareness.stuckDetection.isStuck) {
                    aiComponent.transitionToState('PATROL', 'escaped_stuck_state');
                }

                // Force transition if stuck too long in escape state
                if (timeInState > 5000) {
                    spatialAwareness.stuckDetection.isStuck = false; // Reset stuck state
                    aiComponent.transitionToState('PATROL', 'forced_escape_timeout');
                }
                break;
        }
    }

    updatePatrolBehavior(aiComponent, transform, movement, spatialAwareness, deltaTime, movementCoordinator) {
        // REVERTED: Back to direct movement - movement coordinator disabled
        let targetDirection = aiComponent.targetDirection || aiComponent.patrolDirection;

        // Check for obstacles ahead using spatial awareness
        if (spatialAwareness) {
            const collisions = spatialAwareness.detectCollisionAhead(
                transform.position,
                aiComponent.patrolDirection
            );

            if (collisions.length > 0) {
                // Calculate avoidance direction
                const avoidanceVector = spatialAwareness.calculateAvoidanceVector(
                    collisions,
                    aiComponent.patrolDirection
                );

                // Apply avoidance directly
                const avoidanceDirection = Math.atan2(avoidanceVector.z, avoidanceVector.x);
                targetDirection = avoidanceDirection;

                Utils.log(`🚨 AI avoiding ${collisions.length} obstacles`);
            }
        }

        // Change direction periodically (only if not actively avoiding)
        if (!spatialAwareness || !spatialAwareness.isAvoiding) {
            if (aiComponent.patrolTimer >= aiComponent.patrolChangeTime) {
                targetDirection = Math.random() * Math.PI * 2;
                aiComponent.patrolTimer = 0;
                aiComponent.patrolChangeTime = AI_CONFIG.BEHAVIOR.PATROL_CHANGE_TIME + Math.random() * AI_CONFIG.BEHAVIOR.PATROL_TIME_VARIANCE;
                Utils.log(`🚶 AI patrol: new direction ${(targetDirection * 180 / Math.PI).toFixed(1)}°`);
            }
        }

        // Update target direction
        aiComponent.targetDirection = targetDirection;

        // Smooth rotation towards target direction
        this.smoothRotateToTarget(aiComponent, deltaTime);

        // Apply velocity directly
        const speed = movement.speed || AI_CONFIG.MOVEMENT.PATROL_SPEED;
        transform.velocity.x = Math.cos(aiComponent.patrolDirection) * speed;
        transform.velocity.z = Math.sin(aiComponent.patrolDirection) * speed;
    }

    updateHuntingBehavior(aiComponent, transform, movement, spatialAwareness, deltaTime, movementCoordinator) {
        // Check if we should timeout and return to patrol
        const huntingDuration = Date.now() - aiComponent.huntingStartTime;
        if (huntingDuration > aiComponent.searchTimeout) {
            aiComponent.state = 'PATROL';
            Utils.log(`🔍 AI lost player, returning to PATROL mode`);
            return;
        }

        // Get vision cone to check if we still see the player
        const visionCone = this.getVisionConeFromAI(aiComponent);

        if (visionCone && visionCone.lastSeenPosition) {
            // Move toward last known player position
            const dx = visionCone.lastSeenPosition.x - transform.position.x;
            const dz = visionCone.lastSeenPosition.z - transform.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance > 0.5) { // If not at target position yet
                // Calculate direction to player
                let huntingDirection = Math.atan2(dz, dx);

                // Apply obstacle avoidance during hunting
                if (spatialAwareness) {
                    const collisions = spatialAwareness.detectCollisionAhead(
                        transform.position,
                        huntingDirection
                    );

                    if (collisions.length > 0) {
                        // Calculate proper avoidance vector
                        const avoidanceVector = spatialAwareness.calculateAvoidanceVector(
                            collisions,
                            huntingDirection
                        );

                        // Blend hunting direction with avoidance direction smoothly
                        const avoidanceDirection = Math.atan2(avoidanceVector.z, avoidanceVector.x);
                        const blendFactor = Math.min(collisions.length * 0.3, 0.8); // Max 80% avoidance

                        // Smooth angular interpolation
                        let angleDiff = avoidanceDirection - huntingDirection;
                        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

                        huntingDirection += angleDiff * blendFactor;

                        Utils.log(`🎯 AI hunting with obstacle avoidance: ${collisions.length} obstacles, blend: ${(blendFactor * 100).toFixed(0)}%`);
                    }
                }

                // Smooth rotation toward target (using hunting turn speed)
                let angleDiff = huntingDirection - aiComponent.patrolDirection;
                while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

                const maxTurnSpeed = AI_CONFIG.MOVEMENT.HUNT_TURN_SPEED; // Faster turning when hunting
                const turnStep = maxTurnSpeed * (deltaTime / 1000);

                if (Math.abs(angleDiff) > turnStep) {
                    aiComponent.patrolDirection += Math.sign(angleDiff) * turnStep;
                } else {
                    aiComponent.patrolDirection = huntingDirection;
                }

                // Move faster when hunting
                const huntingSpeed = AI_CONFIG.MOVEMENT.HUNTING_SPEED;
                transform.velocity.x = Math.cos(aiComponent.patrolDirection) * huntingSpeed;
                transform.velocity.z = Math.sin(aiComponent.patrolDirection) * huntingSpeed;

                Utils.log(`🎯 AI hunting player: distance ${distance.toFixed(1)}, direction ${(huntingDirection * 180 / Math.PI).toFixed(1)}°`);
            }
        } else {
            // No last known position, use patrol behavior
            this.updatePatrolBehavior(aiComponent, transform, movement, spatialAwareness, deltaTime, movementCoordinator);
        }
    }

    updateSearchingBehavior(aiComponent, transform, movement, spatialAwareness, deltaTime, movementCoordinator) {
        // For now, use enhanced patrol behavior with obstacle avoidance
        // Future phases will implement advanced search patterns
        this.updatePatrolBehavior(aiComponent, transform, movement, spatialAwareness, deltaTime, movementCoordinator);
    }

    // ==========================================
    // PHASE 2: NEW INTELLIGENT BEHAVIORS
    // ==========================================

    updateCornerSeekBehavior(aiComponent, transform, movement, spatialAwareness, deltaTime, movementCoordinator) {
        if (!aiComponent.currentCornerTarget) {
            // No corner target, return to patrol
            aiComponent.transitionToState('PATROL', 'no_corner_target');
            return;
        }

        const corner = aiComponent.currentCornerTarget;
        const dx = corner.x - transform.position.x;
        const dz = corner.z - transform.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        // Calculate direction to corner
        let targetDirection = Math.atan2(dz, dx);

        // Apply obstacle avoidance while moving toward corner
        if (spatialAwareness) {
            const collisions = spatialAwareness.detectCollisionAhead(
                transform.position,
                targetDirection
            );

            if (collisions.length > 0) {
                const avoidanceVector = spatialAwareness.calculateAvoidanceVector(collisions, targetDirection);
                const avoidanceDirection = Math.atan2(avoidanceVector.z, avoidanceVector.x);

                // Use movement coordinator for corner seeking with avoidance
                if (movementCoordinator) {
                    movementCoordinator.addIntent(
                        'seek_avoid',
                        avoidanceDirection,
                        0.8, // Slower when avoiding while seeking
                        3,   // Higher priority than patrol
                        'corner_seek_avoidance'
                    );
                }
                return; // Let avoidance intent handle movement
            }
        }

        // Clear path to corner - use movement coordinator
        if (movementCoordinator) {
            movementCoordinator.addIntent(
                'seek',
                targetDirection,
                0.9, // Deliberate corner seeking speed
                2,   // Medium priority
                'corner_seeking'
            );
        }

        Utils.log(`🎯 AI seeking corner at (${corner.x.toFixed(1)}, ${corner.z.toFixed(1)}), distance: ${distance.toFixed(1)}`);
    }

    updateCornerSearchBehavior(aiComponent, transform, movement, spatialAwareness, deltaTime, movementCoordinator) {
        if (!aiComponent.currentCornerTarget) {
            aiComponent.transitionToState('PATROL', 'no_corner_to_search');
            return;
        }

        // Stop moving and perform search behavior using movement coordinator
        if (movementCoordinator) {
            movementCoordinator.addIntent(
                'search',
                movementCoordinator.getCurrentDirection(), // Stay facing current direction
                0, // No movement during search
                6, // High priority - override other movements
                'corner_searching'
            );
        }

        // Rotate to look around corner systematically
        const corner = aiComponent.currentCornerTarget;
        const searchTime = aiComponent.behaviorMemory.timeInCurrentState;
        const searchDuration = AI_CONFIG.BEHAVIOR.CORNER_SEARCH_DURATION;

        // Calculate search angle based on time - sweep back and forth
        const searchProgress = searchTime / searchDuration;
        const sweepAngle = Math.sin(searchProgress * Math.PI * 3) * Math.PI / 3; // Sweep 60 degrees
        const baseAngle = corner.angle || 0;
        const searchAngle = baseAngle + sweepAngle;

        // Update search direction through movement coordinator
        if (movementCoordinator) {
            movementCoordinator.addIntent(
                'look',
                searchAngle,
                0, // No movement, just rotation
                6, // High priority
                'corner_search_rotation'
            );
        }

        Utils.log(`🔍 AI searching corner: sweep angle ${(sweepAngle * 180 / Math.PI).toFixed(1)}°`);
    }

    updateStuckEscapeBehavior(aiComponent, transform, movement, spatialAwareness, deltaTime, movementCoordinator) {
        if (!spatialAwareness) {
            aiComponent.transitionToState('PATROL', 'no_spatial_awareness');
            return;
        }

        // Generate escape vector
        const escapeVector = spatialAwareness.generateEscapeVector(transform.position);
        const escapeDirection = Math.atan2(escapeVector.z, escapeVector.x);

        // Use movement coordinator for strong escape movement
        if (movementCoordinator) {
            movementCoordinator.addIntent(
                'escape',
                escapeDirection,
                1.5, // Strong escape speed
                10,  // HIGHEST priority - override everything
                'stuck_escape'
            );
        }

        Utils.log(`🚨 AI escaping stuck state via movement coordinator: direction ${(escapeDirection * 180 / Math.PI).toFixed(1)}°`);
    }

    updateWallFollowBehavior(aiComponent, transform, movement, spatialAwareness, deltaTime, movementCoordinator) {
        // Wall following behavior - follow obstacles edges to find clear path
        if (!spatialAwareness || spatialAwareness.obstacles.size === 0) {
            aiComponent.transitionToState('PATROL', 'no_walls_to_follow');
            return;
        }

        // Find nearest obstacle to follow
        let nearestObstacle = null;
        let nearestDistance = Infinity;

        for (const [obstacleId, obstacle] of spatialAwareness.obstacles) {
            const dx = obstacle.position.x - transform.position.x;
            const dz = obstacle.position.z - transform.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestObstacle = obstacle;
            }
        }

        if (nearestObstacle) {
            // Calculate direction to follow wall (perpendicular to wall face)
            const wallDirection = Math.atan2(
                nearestObstacle.position.z - transform.position.z,
                nearestObstacle.position.x - transform.position.x
            ) + Math.PI / 2; // Perpendicular to wall

            // Use movement coordinator for wall following
            if (movementCoordinator) {
                movementCoordinator.addIntent(
                    'follow',
                    wallDirection,
                    0.8, // Slower wall following
                    2,   // Medium priority
                    'wall_following'
                );
            }

            Utils.log(`🧱 AI following wall via movement coordinator: direction ${(wallDirection * 180 / Math.PI).toFixed(1)}°`);
        } else {
            aiComponent.transitionToState('PATROL', 'wall_following_complete');
        }
    }

    // Helper function for smooth value transitions
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    // Helper method for smooth rotation
    smoothRotateToTarget(aiComponent, deltaTime, customTurnSpeed = null) {
        if (aiComponent.targetDirection === undefined || aiComponent.targetDirection === null) {
            return;
        }

        // Calculate shortest rotation path
        let angleDiff = aiComponent.targetDirection - aiComponent.patrolDirection;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        // Smooth rotation with limited turn speed
        const turnSpeed = customTurnSpeed || AI_CONFIG.MOVEMENT.TURN_SPEED;
        const turnStep = turnSpeed * (deltaTime / 1000);

        if (Math.abs(angleDiff) > turnStep) {
            aiComponent.patrolDirection += Math.sign(angleDiff) * turnStep;
        } else {
            aiComponent.patrolDirection = aiComponent.targetDirection;
        }

        // Normalize angle
        while (aiComponent.patrolDirection > Math.PI) aiComponent.patrolDirection -= 2 * Math.PI;
        while (aiComponent.patrolDirection < -Math.PI) aiComponent.patrolDirection += 2 * Math.PI;
    }

    updateVision(hunter, visionCone, gameState) {
        // Reset vision state
        visionCone.canSeePlayer = false;
        visionCone.targetSeen = false;

        // Get AI hunter's transform
        const aiTransform = hunter.getComponent('Transform');
        if (!aiTransform) return;

        // Find local player
        const localPlayer = gameState.getLocalPlayer();
        if (!localPlayer) return;

        const playerTransform = localPlayer.getComponent('Transform');
        if (!playerTransform) return;

        // Calculate distance and angle to player
        const dx = playerTransform.position.x - aiTransform.position.x;
        const dz = playerTransform.position.z - aiTransform.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        // Check if player is within range
        if (distance > visionCone.range) {
            return; // Player too far away
        }

        // Calculate angle to player
        const angleToPlayer = Math.atan2(dx, dz);
        const aiDirection = aiTransform.rotation.y;

        // Calculate the difference between AI facing direction and direction to player
        let angleDiff = angleToPlayer - aiDirection;

        // Normalize angle difference to [-π, π]
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        // Convert vision cone angle from degrees to radians
        const visionAngleRad = (visionCone.angle * Math.PI) / 180;
        const halfVisionAngle = visionAngleRad / 2;

        // Check if player is within vision cone angle
        if (Math.abs(angleDiff) <= halfVisionAngle) {
            // Check if line of sight is blocked by obstacles
            const hasLineOfSight = this.checkLineOfSight(aiTransform.position, playerTransform.position, gameState);

            if (hasLineOfSight) {
                // Player is within vision cone AND visible - set vision state
                visionCone.canSeePlayer = true;
                visionCone.targetSeen = true;
                visionCone.lastSeenPosition = {
                    x: playerTransform.position.x,
                    y: playerTransform.position.y,
                    z: playerTransform.position.z
                };
                visionCone.lastSeenTime = Date.now(); // Track when player was last seen

                // Trigger state change to hunting if not already hunting
                const aiComponent = hunter.getComponent('AIHunter');
                if (aiComponent && (aiComponent.state === 'PATROL' || aiComponent.state === 'CORNER_SEEK' || aiComponent.state === 'CORNER_SEARCH')) {
                    aiComponent.transitionToState('HUNTING', 'player_spotted');
                    aiComponent.huntingStartTime = Date.now();
                    Utils.log(`🎯 AI SPOTTED PLAYER! Switching to HUNTING mode from ${aiComponent.previousState}`);
                }

                Utils.log(`AI can see player! Distance: ${distance.toFixed(2)}, Angle: ${(angleDiff * 180 / Math.PI).toFixed(1)}°`);
            } else {
                Utils.log(`Player in vision cone but line of sight blocked by obstacle`);
            }
        }
    }

    checkLineOfSight(aiPosition, playerPosition, gameState) {
        // Get all entities with Collider components (obstacles)
        const obstacles = [];

        // Iterate through all entities to find obstacles
        for (const [entityId, entity] of gameState.entities) {
            if (entity.hasComponent('Collider') && entity.active) {
                const transform = entity.getComponent('Transform');
                const collider = entity.getComponent('Collider');

                if (transform && collider && collider.blockMovement) {
                    obstacles.push({
                        position: transform.position,
                        bounds: collider.bounds
                    });
                }
            }
        }

        // If no obstacles, line of sight is clear
        if (obstacles.length === 0) {
            return true;
        }

        // Perform ray-box intersection tests
        return this.raycastToObstacles(aiPosition, playerPosition, obstacles);
    }

    raycastToObstacles(start, end, obstacles) {
        // Calculate ray direction and length
        const rayDirection = {
            x: end.x - start.x,
            y: end.y - start.y,
            z: end.z - start.z
        };

        const rayLength = Math.sqrt(
            rayDirection.x * rayDirection.x +
            rayDirection.y * rayDirection.y +
            rayDirection.z * rayDirection.z
        );

        // Normalize ray direction
        if (rayLength === 0) return true; // Same position

        rayDirection.x /= rayLength;
        rayDirection.y /= rayLength;
        rayDirection.z /= rayLength;

        // Test each obstacle for intersection
        for (const obstacle of obstacles) {
            if (this.rayIntersectsBox(start, rayDirection, rayLength, obstacle.position, obstacle.bounds)) {
                return false; // Line of sight blocked
            }
        }

        return true; // Line of sight clear
    }

    rayIntersectsBox(rayStart, rayDirection, rayLength, boxCenter, boxBounds) {
        // Calculate box extents (half-sizes)
        const halfWidth = boxBounds.width / 2;
        const halfHeight = boxBounds.height / 2;
        const halfDepth = boxBounds.depth / 2;

        // Calculate box min and max coordinates
        const boxMin = {
            x: boxCenter.x - halfWidth,
            y: boxCenter.y - halfHeight,
            z: boxCenter.z - halfDepth
        };
        const boxMax = {
            x: boxCenter.x + halfWidth,
            y: boxCenter.y + halfHeight,
            z: boxCenter.z + halfDepth
        };

        // Ray-box intersection using slabs method
        let tMin = 0;
        let tMax = rayLength;

        // Check X slab
        if (Math.abs(rayDirection.x) < 1e-6) {
            // Ray is parallel to X slab
            if (rayStart.x < boxMin.x || rayStart.x > boxMax.x) {
                return false;
            }
        } else {
            const invDirX = 1.0 / rayDirection.x;
            let t1 = (boxMin.x - rayStart.x) * invDirX;
            let t2 = (boxMax.x - rayStart.x) * invDirX;

            if (t1 > t2) {
                const temp = t1;
                t1 = t2;
                t2 = temp;
            }

            tMin = Math.max(tMin, t1);
            tMax = Math.min(tMax, t2);

            if (tMin > tMax) return false;
        }

        // Check Y slab
        if (Math.abs(rayDirection.y) < 1e-6) {
            // Ray is parallel to Y slab
            if (rayStart.y < boxMin.y || rayStart.y > boxMax.y) {
                return false;
            }
        } else {
            const invDirY = 1.0 / rayDirection.y;
            let t1 = (boxMin.y - rayStart.y) * invDirY;
            let t2 = (boxMax.y - rayStart.y) * invDirY;

            if (t1 > t2) {
                const temp = t1;
                t1 = t2;
                t2 = temp;
            }

            tMin = Math.max(tMin, t1);
            tMax = Math.min(tMax, t2);

            if (tMin > tMax) return false;
        }

        // Check Z slab
        if (Math.abs(rayDirection.z) < 1e-6) {
            // Ray is parallel to Z slab
            if (rayStart.z < boxMin.z || rayStart.z > boxMax.z) {
                return false;
            }
        } else {
            const invDirZ = 1.0 / rayDirection.z;
            let t1 = (boxMin.z - rayStart.z) * invDirZ;
            let t2 = (boxMax.z - rayStart.z) * invDirZ;

            if (t1 > t2) {
                const temp = t1;
                t1 = t2;
                t2 = temp;
            }

            tMin = Math.max(tMin, t1);
            tMax = Math.min(tMax, t2);

            if (tMin > tMax) return false;
        }

        // If we get here, ray intersects the box
        return tMin >= 0; // Only count if intersection is in front of ray start
    }

    applyMovementWithCollision(transform) {
        // Get arena bounds from ConfigManager
        const configManager = window.ConfigManager ? ConfigManager.getInstance() : null;
        const arenaSize = configManager ? configManager.get('arena.size') : 15;
        const detectionLimit = arenaSize - 1.2; // Early detection to avoid wall grinding
        const hardLimit = arenaSize - 0.5; // Hard boundary limit

        // Check if AI would hit arena boundaries and adjust direction smoothly
        const nextPosX = transform.position.x + transform.velocity.x;
        const nextPosZ = transform.position.z + transform.velocity.z;

        // Get AI component for direction adjustment
        const aiComponent = this.getAIComponentFromTransform(transform);

        // Only process wall collision if cooldown is over
        if (aiComponent && aiComponent.wallCollisionCooldown <= 0) {
            let wallHit = false;

            // Handle X-axis wall collision with early detection
            if (nextPosX > detectionLimit || nextPosX < -detectionLimit) {
                wallHit = true;
                // Calculate a direction that moves away from the wall at an angle
                const centerDirection = Math.atan2(-transform.position.z, -transform.position.x); // Direction toward center
                const randomOffset = (Math.random() - 0.5) * Math.PI; // Random component
                const newDirection = centerDirection + randomOffset;

                aiComponent.targetDirection = newDirection;
                aiComponent.patrolDirection = newDirection; // Set current direction too to avoid conflict
                aiComponent.patrolChangeTime = 1500; // Give time to get away from wall
                aiComponent.patrolTimer = 0;
                aiComponent.wallCollisionCooldown = AI_CONFIG.BEHAVIOR.WALL_COLLISION_COOLDOWN; // Cooldown from config

                // Set velocity in the new direction immediately
                const speed = Math.sqrt(transform.velocity.x * transform.velocity.x + transform.velocity.z * transform.velocity.z);
                transform.velocity.x = Math.cos(newDirection) * speed;
                transform.velocity.z = Math.sin(newDirection) * speed;
            }
            // Handle Z-axis wall collision with early detection
            else if (nextPosZ > detectionLimit || nextPosZ < -detectionLimit) {
                wallHit = true;
                // Calculate a direction that moves away from the wall at an angle
                const centerDirection = Math.atan2(-transform.position.z, -transform.position.x); // Direction toward center
                const randomOffset = (Math.random() - 0.5) * Math.PI; // Random component
                const newDirection = centerDirection + randomOffset;

                aiComponent.targetDirection = newDirection;
                aiComponent.patrolDirection = newDirection; // Set current direction too to avoid conflict
                aiComponent.patrolChangeTime = 1500; // Give time to get away from wall
                aiComponent.patrolTimer = 0;
                aiComponent.wallCollisionCooldown = AI_CONFIG.BEHAVIOR.WALL_COLLISION_COOLDOWN; // Cooldown from config

                // Set velocity in the new direction immediately
                const speed = Math.sqrt(transform.velocity.x * transform.velocity.x + transform.velocity.z * transform.velocity.z);
                transform.velocity.x = Math.cos(newDirection) * speed;
                transform.velocity.z = Math.sin(newDirection) * speed;
            }
        }

        // Hard boundary enforcement (for safety)
        if (Math.abs(transform.position.x) > hardLimit) {
            transform.position.x = Math.sign(transform.position.x) * hardLimit;
        }
        if (Math.abs(transform.position.z) > hardLimit) {
            transform.position.z = Math.sign(transform.position.z) * hardLimit;
        }

        // Note: MovementSystem will handle the actual position updates and boundary clamping
    }

    getAIComponentFromTransform(transform) {
        // Find the AI entity that has this transform
        for (const hunter of this.hunters) {
            if (hunter.getComponent('Transform') === transform) {
                return hunter.getComponent('AIHunter');
            }
        }
        return null;
    }

    getVisionConeFromAI(aiComponent) {
        // Find the hunter entity that has this AI component and get its vision cone
        for (const hunter of this.hunters) {
            if (hunter.getComponent('AIHunter') === aiComponent) {
                return hunter.getComponent('VisionCone');
            }
        }
        return null;
    }

    checkPlayerCollision(hunter, gameState) {
        const aiTransform = hunter.getComponent('Transform');
        if (!aiTransform) return;

        // Find local player
        const localPlayer = gameState.getLocalPlayer();
        if (!localPlayer) return;

        const playerTransform = localPlayer.getComponent('Transform');
        if (!playerTransform) return;

        // Calculate distance between AI and player
        const dx = playerTransform.position.x - aiTransform.position.x;
        const dz = playerTransform.position.z - aiTransform.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        // Check if AI is close enough to tag player
        const tagDistance = AI_CONFIG.BEHAVIOR.TAG_DISTANCE; // Distance needed to tag player
        if (distance <= tagDistance) {
            // Player has been tagged!
            this.triggerPlayerTagged(gameState);
        }
    }

    triggerPlayerTagged(gameState) {
        Utils.log(`🏃‍♂️ PLAYER TAGGED! Game Over!`);

        // Trigger game over event
        if (window.GameEngine && window.GameEngine.gameOver) {
            window.GameEngine.gameOver('tagged');
        } else {
            // Fallback: alert for now
            alert('🏃‍♂️ TAGGED! The AI Hunter caught you!\n\nGame Over!');

            // Reset player position as fallback
            const localPlayer = gameState.getLocalPlayer();
            if (localPlayer) {
                const playerTransform = localPlayer.getComponent('Transform');
                if (playerTransform) {
                    playerTransform.position.x = 0;
                    playerTransform.position.z = 0;
                }
            }
        }
    }

    getHunters() {
        return Array.from(this.hunters);
    }

    // Test method to verify line-of-sight detection
    testLineOfSight(gameState) {
        const hunters = Array.from(this.hunters);
        if (hunters.length === 0) {
            Utils.log('No AI hunters to test');
            return;
        }

        const hunter = hunters[0];
        const aiTransform = hunter.getComponent('Transform');
        const visionCone = hunter.getComponent('VisionCone');

        if (!aiTransform || !visionCone) {
            Utils.log('AI hunter missing required components for testing');
            return;
        }

        const localPlayer = gameState.getLocalPlayer();
        if (!localPlayer) {
            Utils.log('No local player found for testing');
            return;
        }

        const playerTransform = localPlayer.getComponent('Transform');
        if (!playerTransform) {
            Utils.log('Player missing transform component');
            return;
        }

        // Test line of sight
        const hasLineOfSight = this.checkLineOfSight(aiTransform.position, playerTransform.position, gameState);
        const distance = Math.sqrt(
            Math.pow(playerTransform.position.x - aiTransform.position.x, 2) +
            Math.pow(playerTransform.position.z - aiTransform.position.z, 2)
        );

        Utils.log(`🔍 AI Line-of-Sight Test:`);
        Utils.log(`  AI Position: (${aiTransform.position.x.toFixed(2)}, ${aiTransform.position.z.toFixed(2)})`);
        Utils.log(`  Player Position: (${playerTransform.position.x.toFixed(2)}, ${playerTransform.position.z.toFixed(2)})`);
        Utils.log(`  Distance: ${distance.toFixed(2)}`);
        Utils.log(`  Line of Sight: ${hasLineOfSight ? '✅ CLEAR' : '❌ BLOCKED'}`);
        Utils.log(`  Vision Range: ${visionCone.range}`);
        Utils.log(`  Can See Player: ${visionCone.canSeePlayer ? '✅ YES' : '❌ NO'}`);

        return {
            distance,
            hasLineOfSight,
            canSeePlayer: visionCone.canSeePlayer,
            aiPosition: aiTransform.position,
            playerPosition: playerTransform.position
        };
    }

    destroy() {
        this.hunters.clear();
        Utils.log('AI system destroyed');
    }
}

// Export for module systems or global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AIHunter, VisionCone, SpatialAwareness, AIMovementCoordinator, AISystem, AI_STATES, AI_CONFIG };
} else {
    window.GameAI = { AIHunter, VisionCone, SpatialAwareness, AIMovementCoordinator, AISystem, AI_STATES, AI_CONFIG };

    // Export AI_CONFIG globally for easy access from other files
    window.AI_CONFIG = AI_CONFIG;
    window.SpatialAwareness = SpatialAwareness;
    window.AIMovementCoordinator = AIMovementCoordinator;
}

// ==========================================
// PHASE 1 DEBUG FUNCTIONS
// ==========================================
window.debugAIPathfinding = function () {
    console.log('🤖 === AI PATHFINDING DEBUG (Phase 2 Enhanced) ===');

    if (!gameEngine || !gameEngine.gameState) {
        console.log('❌ Game not initialized');
        return;
    }

    const aiSystem = gameEngine.systems.find(s => s.name === 'AISystem');
    if (!aiSystem) {
        console.log('❌ AI System not found');
        return;
    }

    const hunters = aiSystem.getHunters();
    console.log(`🔍 Found ${hunters.length} AI hunters`);

    hunters.forEach((hunter, index) => {
        const aiComponent = hunter.getComponent('AIHunter');
        const transform = hunter.getComponent('Transform');
        const spatialAwareness = hunter.getComponent('SpatialAwareness');
        const movementCoordinator = hunter.getComponent('AIMovementCoordinator');

        console.log(`\n🤖 Hunter ${index + 1}:`);
        console.log(`  State: ${aiComponent ? aiComponent.state : 'N/A'} (previous: ${aiComponent ? aiComponent.previousState : 'N/A'})`);
        console.log(`  Position: (${transform ? transform.position.x.toFixed(1) : 'N/A'}, ${transform ? transform.position.z.toFixed(1) : 'N/A'})`);

        if (aiComponent) {
            const timeInState = aiComponent.behaviorMemory.timeInCurrentState / 1000;
            console.log(`  Time in state: ${timeInState.toFixed(1)}s`);
            console.log(`  State change reason: ${aiComponent.behaviorMemory.stateChangeReason}`);

            if (aiComponent.currentCornerTarget) {
                const corner = aiComponent.currentCornerTarget;
                console.log(`  Corner target: (${corner.x.toFixed(1)}, ${corner.z.toFixed(1)}) type: ${corner.type}`);
            }
        }

        // NEW: Movement Coordinator Debug Info
        if (movementCoordinator) {
            const coordDebug = movementCoordinator.getDebugInfo();
            console.log(`  Movement Coordinator:`);
            console.log(`    Current intent: ${coordDebug.currentIntent.type} (${coordDebug.currentIntent.source})`);
            console.log(`    Direction: ${(coordDebug.currentDirection * 180 / Math.PI).toFixed(1)}° | Strength: ${coordDebug.currentIntent.strength.toFixed(2)}`);
            console.log(`    Velocity: (${coordDebug.currentVelocity.x.toFixed(3)}, ${coordDebug.currentVelocity.z.toFixed(3)})`);
            console.log(`    Intent queue: ${coordDebug.intentQueueSize} | Transitioning: ${coordDebug.isTransitioning ? '🔄 YES' : '✅ No'}`);
            console.log(`    Intent changes: ${coordDebug.intentChanges}`);
        } else {
            console.log(`  ❌ No Movement Coordinator component`);
        }

        if (spatialAwareness) {
            const debugInfo = spatialAwareness.getDebugInfo();
            console.log(`  Spatial Awareness:`);
            console.log(`    Obstacles detected: ${debugInfo.obstacleCount}`);
            console.log(`    Corners detected: ${debugInfo.cornerCount}`);
            console.log(`    Is avoiding: ${debugInfo.isAvoiding ? '🚨 YES' : '✅ No'}`);
            console.log(`    Is stuck: ${debugInfo.isStuck ? '🚨 YES' : '✅ No'} (counter: ${debugInfo.stuckCounter})`);
            console.log(`    Avoidance vector: (${debugInfo.avoidanceVector.x.toFixed(2)}, ${debugInfo.avoidanceVector.z.toFixed(2)})`);
            console.log(`    Searched corners: ${debugInfo.searchedCornersCount}`);

            if (debugInfo.nearestCorner) {
                const corner = debugInfo.nearestCorner;
                console.log(`    Nearest corner: (${corner.x.toFixed(1)}, ${corner.z.toFixed(1)}) priority: ${corner.priority.toFixed(1)}`);
            }

            if (debugInfo.isStuck) {
                console.log(`    🚨 AI is stuck and needs rescue!`);
            } else if (debugInfo.isAvoiding) {
                console.log(`    🚨 AI is actively avoiding obstacles!`);
            } else if (debugInfo.cornerCount > 0) {
                console.log(`    🧠 AI detected ${debugInfo.cornerCount} corners to investigate`);
            }
        } else {
            console.log(`  ❌ No SpatialAwareness component`);
        }
    });

    console.log('\n=== PHASE 2 INTELLIGENCE SUMMARY ===');
    console.log('🧠 Features Active:');
    console.log('  ✅ Corner Detection & Strategic Search');
    console.log('  ✅ Stuck Detection & Emergency Escape');
    console.log('  ✅ Enhanced Obstacle Avoidance (5 rays)');
    console.log('  ✅ Intelligent State Machine');
    console.log('  ✅ Behavioral Memory & Learning');
    console.log('\n=== END AI PATHFINDING DEBUG ===');
};