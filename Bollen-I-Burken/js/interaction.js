/* ==========================================
   BOLLEN I BURKEN - INTERACTION SYSTEM
   Proximity-based interaction handling for Swedish gameplay
   ========================================== */

// Interaction System for handling player-object interactions
class InteractionSystem extends System {
    constructor() {
        super('InteractionSystem');

        // Interaction configuration from simple CONFIG
        this.maxInteractionDistance = CONFIG.interaction.maxDistance;
        this.interactionCooldown = CONFIG.interaction.cooldownMs;
        this.enableVisualFeedback = CONFIG.interaction.visualFeedback;

        // State tracking
        this.lastInteractionTime = new Map(); // playerId -> timestamp
        this.activeInteractions = new Map(); // entityId -> interactionData
        this.nearbyInteractables = new Map(); // playerId -> [entityIds]

        // Visual feedback objects
        this.interactionIndicators = new Map(); // entityId -> indicatorMesh

        Utils.log('InteractionSystem initialized with enterprise patterns');
    }

    update(gameState, deltaTime) {
        try {
            // Find all players with input components
            const players = this.getPlayersWithInput(gameState);

            // Update nearby interactables for each player
            players.forEach(player => {
                this.updateNearbyInteractables(player, gameState);
                this.processPlayerInput(player, gameState);
            });

            // Update visual feedback
            if (this.enableVisualFeedback) {
                this.updateVisualFeedback(gameState);
            }

        } catch (error) {
            // Simple error logging
            console.error('InteractionSystem update failed:', error);
            Utils.error('InteractionSystem update failed:', error);
        }
    }

    getPlayersWithInput(gameState) {
        const players = [];

        for (const entity of gameState.entities.values()) {
            if (entity.hasComponent('Player') && entity.hasComponent('PlayerInput') && entity.hasComponent('Transform')) {
                players.push(entity);
            }
        }

        return players;
    }

    updateNearbyInteractables(player, gameState) {
        const playerTransform = player.getComponent('Transform');
        const playerComponent = player.getComponent('Player');
        const playerId = playerComponent.playerId;

        const nearbyEntities = [];

        // Find all entities with Interactable components
        for (const entity of gameState.entities.values()) {
            const interactable = entity.getComponent('Interactable');
            if (!interactable || !interactable.isActive) continue;

            const entityTransform = entity.getComponent('Transform');
            if (!entityTransform) continue;

            // Calculate distance
            const distance = this.calculateDistance(
                playerTransform.position,
                entityTransform.position
            );

            // Check if within interaction range
            if (distance <= interactable.interactDistance) {
                nearbyEntities.push({
                    entity: entity,
                    distance: distance,
                    interactable: interactable
                });
            }
        }

        // Sort by distance (closest first)
        nearbyEntities.sort((a, b) => a.distance - b.distance);

        // Store nearby interactables
        this.nearbyInteractables.set(playerId, nearbyEntities);
    }

    processPlayerInput(player, gameState) {
        const playerInput = player.getComponent('PlayerInput');
        const playerComponent = player.getComponent('Player');
        const playerId = playerComponent.playerId;

        // Check for interaction key press (E key)
        if (playerInput.keys.interact) {
            this.handleInteractionAttempt(player, gameState);
        }
    }

    handleInteractionAttempt(player, gameState) {
        const playerComponent = player.getComponent('Player');
        const playerId = playerComponent.playerId;

        // Check cooldown
        const currentTime = Date.now();
        const lastInteraction = this.lastInteractionTime.get(playerId) || 0;

        if (currentTime - lastInteraction < this.interactionCooldown) {
            Utils.log(`Player ${playerId} interaction on cooldown`);
            return false;
        }

        // Get nearest interactable
        const nearbyEntities = this.nearbyInteractables.get(playerId) || [];
        if (nearbyEntities.length === 0) {
            Utils.log(`No interactables nearby for player ${playerId}`);
            return false;
        }

        const target = nearbyEntities[0]; // Closest interactable
        const success = this.triggerInteraction(player, target.entity, gameState);

        if (success) {
            this.lastInteractionTime.set(playerId, currentTime);
        }

        return success;
    }

    triggerInteraction(player, targetEntity, gameState) {
        const playerComponent = player.getComponent('Player');
        const playerId = playerComponent.playerId;
        const interactable = targetEntity.getComponent('Interactable');

        if (!interactable || !interactable.isActive) {
            return false;
        }

        try {
            // Trigger the interaction
            const success = interactable.triggerInteraction(playerId);

            if (success) {
                Utils.log(`🎯 Interaction triggered: ${interactable.type} by player ${playerId}`);

                // Handle specific interaction types
                this.handleSpecificInteraction(player, targetEntity, interactable, gameState);

                // Create interaction feedback
                this.createInteractionFeedback(targetEntity, interactable);

                return true;
            }

        } catch (error) {
            // Simple error logging
            console.error(`Interaction trigger failed for player ${playerId}:`, error);
            Utils.error('Interaction trigger failed:', error);
        }

        return false;
    }

    handleSpecificInteraction(player, targetEntity, interactable, gameState) {
        const playerComponent = player.getComponent('Player');
        const playerId = playerComponent.playerId;

        switch (interactable.type) {
            case 'can':
            case 'burken':
                this.handleCanInteraction(player, targetEntity, gameState);
                break;

            case 'door':
                this.handleDoorInteraction(player, targetEntity, gameState);
                break;

            case 'lever':
            case 'button':
                this.handleControlInteraction(player, targetEntity, gameState);
                break;

            default:
                Utils.log(`Unknown interaction type: ${interactable.type}`);
        }
    }

    handleCanInteraction(player, canEntity, gameState) {
        const playerComponent = player.getComponent('Player');
        const playerId = playerComponent.playerId;

        Utils.log(`🥫 Swedish Can (Burken) kicked by player ${playerId}!`);

        // Future: Implement rescue mechanics here
        // For now, just visual feedback and scoring

        // Add score for successful can interaction
        if (playerComponent.score !== undefined) {
            playerComponent.score += 10;
            Utils.log(`Player ${playerId} score: ${playerComponent.score}`);
        }

        // Create visual effect for can "kick"
        this.createCanKickEffect(canEntity);

        // Potential future: Check for rescue mechanics
        // this.checkForPlayerRescue(gameState);
    }

    handleDoorInteraction(player, doorEntity, gameState) {
        Utils.log('🚪 Door interaction (future feature)');
        // Future implementation for doors
    }

    handleControlInteraction(player, controlEntity, gameState) {
        Utils.log('🎛️ Control interaction (future feature)');
        // Future implementation for levers/buttons
    }

    createCanKickEffect(canEntity) {
        const canTransform = canEntity.getComponent('Transform');
        if (!canTransform) return;

        // Simple visual feedback - make can briefly change color or size
        const renderable = canEntity.getComponent('Renderable');
        if (renderable && renderable.mesh) {
            const originalScale = renderable.mesh.scale.clone();

            // Brief scaling animation to show "kick" impact
            renderable.mesh.scale.multiplyScalar(1.1);

            setTimeout(() => {
                if (renderable.mesh) {
                    renderable.mesh.scale.copy(originalScale);
                }
            }, 200);

            Utils.log('🥫 Can kick visual effect triggered');
        }
    }

    createInteractionFeedback(targetEntity, interactable) {
        // Future: Create visual indicators for successful interactions
        // For now, just log feedback
        Utils.log(`✨ Interaction feedback for ${interactable.type}`);
    }

    updateVisualFeedback(gameState) {
        // Future: Update visual indicators for nearby interactables
        // Show "Press E to interact" messages, highlight objects, etc.
    }

    calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    // Professional debugging methods
    getInteractionStats() {
        return {
            playersTracked: this.lastInteractionTime.size,
            activeInteractions: this.activeInteractions.size,
            nearbyInteractablesCount: Array.from(this.nearbyInteractables.values())
                .reduce((sum, arr) => sum + arr.length, 0),
            maxDistance: this.maxInteractionDistance,
            cooldownMs: this.interactionCooldown
        };
    }

    debugLogInteractions() {
        console.log('=== INTERACTION SYSTEM DEBUG ===');
        console.log('Stats:', this.getInteractionStats());
        console.log('Nearby Interactables:', this.nearbyInteractables);
        console.log('Last Interaction Times:', this.lastInteractionTime);
        console.log('=== END INTERACTION DEBUG ===');
    }

    // Cleanup method
    dispose() {
        this.lastInteractionTime.clear();
        this.activeInteractions.clear();
        this.nearbyInteractables.clear();
        this.interactionIndicators.clear();
        Utils.log('InteractionSystem disposed');
    }
}

// Export for module systems or global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { InteractionSystem };
} else {
    window.GameSystems = window.GameSystems || {};
    window.GameSystems.InteractionSystem = InteractionSystem;
}