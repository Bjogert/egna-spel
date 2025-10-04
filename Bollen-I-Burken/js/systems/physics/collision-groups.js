/* ==========================================
   COLLISION GROUPS
   Physics collision filtering constants
   ========================================== */

(function (global) {
    /**
     * Collision groups using bit flags
     * Each group is a power of 2 so they can be combined with bitwise OR
     */
    const COLLISION_GROUPS = {
        NONE:       0,          // Nothing
        PLAYER:     1 << 0,     // 1  - Local player
        AI:         1 << 1,     // 2  - AI hunters
        OBSTACLE:   1 << 2,     // 4  - Park obstacles (cars, benches, trees)
        WALL:       1 << 3,     // 8  - Arena boundary walls
        CAN:        1 << 4,     // 16 - Central can (burken)
        GROUND:     1 << 5      // 32 - Floor (future use)
    };

    /**
     * Collision masks - defines what each group collides with
     * Use bitwise OR to combine multiple groups
     */
    const COLLISION_MASKS = {
        // Player collides with: obstacles and walls (can pass through AI and can)
        PLAYER: COLLISION_GROUPS.OBSTACLE | COLLISION_GROUPS.WALL,

        // AI collides with: obstacles and walls (can pass through player and can)
        AI: COLLISION_GROUPS.OBSTACLE | COLLISION_GROUPS.WALL,

        // Obstacles collide with: everyone (static, blocks all)
        OBSTACLE: -1,  // All bits set (collides with everything)

        // Walls collide with: everyone (arena boundaries)
        WALL: -1,

        // Can collides with: nothing (can be passed through)
        CAN: COLLISION_GROUPS.NONE,

        // Ground collides with: everything (future use for realistic gravity)
        GROUND: -1
    };

    /**
     * Get collision configuration for a given body type
     * @param {string} bodyType - 'player', 'ai', 'obstacle', 'wall', 'can', 'ground'
     * @returns {{group: number, mask: number}}
     */
    function getCollisionConfig(bodyType) {
        const type = bodyType.toUpperCase();

        if (!COLLISION_GROUPS[type]) {
            Utils.warn(`Unknown collision body type: ${bodyType}, using default`);
            return { group: COLLISION_GROUPS.OBSTACLE, mask: -1 };
        }

        return {
            group: COLLISION_GROUPS[type],
            mask: COLLISION_MASKS[type] !== undefined ? COLLISION_MASKS[type] : -1
        };
    }

    /**
     * Check if two groups should collide
     * @param {number} groupA - Collision group of body A
     * @param {number} maskA - Collision mask of body A
     * @param {number} groupB - Collision group of body B
     * @param {number} maskB - Collision mask of body B
     * @returns {boolean}
     */
    function shouldCollide(groupA, maskA, groupB, maskB) {
        return (groupA & maskB) !== 0 && (groupB & maskA) !== 0;
    }

    // ==========================================
    // EXPORTS
    // ==========================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { COLLISION_GROUPS, COLLISION_MASKS, getCollisionConfig, shouldCollide };
    } else {
        global.CollisionGroups = {
            GROUPS: COLLISION_GROUPS,
            MASKS: COLLISION_MASKS,
            getConfig: getCollisionConfig,
            shouldCollide: shouldCollide
        };
    }

    Utils.log('CollisionGroups loaded - Physics collision filtering ready');
})(typeof window !== 'undefined' ? window : globalThis);
