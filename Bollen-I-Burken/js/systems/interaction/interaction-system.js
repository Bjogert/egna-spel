/* ==========================================
   INTERACTION SYSTEM
   Player proximity and interaction control
   ========================================== */

(function (global) {
    const handlers = global.InteractionHandlers;
    const visuals = global.InteractionVisuals;

    class InteractionSystem extends System {
        constructor() {
            super('InteractionSystem');

            this.maxInteractionDistance = CONFIG.interaction.maxDistance;
            this.interactionCooldown = CONFIG.interaction.cooldownMs;
            this.enableVisualFeedback = CONFIG.interaction.visualFeedback;

            this.lastInteractionTime = new Map();
            this.activeInteractions = new Map();
            this.nearbyInteractables = new Map();
            this.interactionIndicators = new Map();

            Utils.log('InteractionSystem initialized with enterprise patterns');
        }

        update(gameState, deltaTime) {
            try {
                const players = this.getPlayersWithInput(gameState);

                players.forEach(player => {
                    this.updateNearbyInteractables(player, gameState);
                    this.processPlayerInput(player, gameState);
                });

                if (this.enableVisualFeedback && visuals && visuals.updateVisualFeedback) {
                    visuals.updateVisualFeedback(this, gameState);
                }
            } catch (error) {
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

            for (const entity of gameState.entities.values()) {
                const interactable = entity.getComponent('Interactable');
                if (!interactable || !interactable.isActive) continue;

                const entityTransform = entity.getComponent('Transform');
                if (!entityTransform) continue;

                const distance = this.calculateDistance(
                    playerTransform.position,
                    entityTransform.position
                );

                if (distance <= interactable.interactDistance) {
                    nearbyEntities.push({
                        entity,
                        distance,
                        interactable
                    });
                }
            }

            nearbyEntities.sort((a, b) => a.distance - b.distance);
            this.nearbyInteractables.set(playerId, nearbyEntities);
        }

        processPlayerInput(player, gameState) {
            const playerInput = player.getComponent('PlayerInput');

            // Allow both E (interact) and Space (action1) to kick the can
            if (playerInput.keys.interact || playerInput.keys.action1) {
                this.handleInteractionAttempt(player, gameState);
            }
        }

        handleInteractionAttempt(player, gameState) {
            const playerComponent = player.getComponent('Player');
            const playerId = playerComponent.playerId;

            const currentTime = Date.now();
            const lastInteraction = this.lastInteractionTime.get(playerId) || 0;

            if (currentTime - lastInteraction < this.interactionCooldown) {
                Utils.log(`Player ${playerId} interaction on cooldown`);
                return false;
            }

            const nearbyEntities = this.nearbyInteractables.get(playerId) || [];
            if (nearbyEntities.length === 0) {
                Utils.log(`No interactables nearby for player ${playerId}`);
                return false;
            }

            const target = nearbyEntities[0];
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
                const success = interactable.triggerInteraction(playerId);

                if (success) {
                    Utils.log(`?? Interaction triggered: ${interactable.type} by player ${playerId}`);

                    if (handlers && handlers.handleSpecificInteraction) {
                        handlers.handleSpecificInteraction(this, player, targetEntity, interactable, gameState);
                    }

                    if (visuals && visuals.createInteractionFeedback) {
                        visuals.createInteractionFeedback(this, targetEntity, interactable);
                    }

                    return true;
                }
            } catch (error) {
                console.error(`Interaction trigger failed for player ${playerId}:`, error);
                Utils.error('Interaction trigger failed:', error);
            }

            return false;
        }

        calculateDistance(pos1, pos2) {
            const dx = pos1.x - pos2.x;
            const dy = pos1.y - pos2.y;
            const dz = pos1.z - pos2.z;
            return Math.sqrt(dx * dx + dy * dy + dz * dz);
        }

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

        dispose() {
            this.lastInteractionTime.clear();
            this.activeInteractions.clear();
            this.nearbyInteractables.clear();
            this.interactionIndicators.clear();
            Utils.log('InteractionSystem disposed');
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = InteractionSystem;
    } else {
        global.GameSystems = global.GameSystems || {};
        global.GameSystems.InteractionSystem = InteractionSystem;
        global.InteractionSystem = InteractionSystem;
    }
})(typeof window !== 'undefined' ? window : globalThis);