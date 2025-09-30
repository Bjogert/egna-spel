/* ==========================================
   INTERACTION HANDLERS
   Domain-specific interaction logic
   ========================================== */

(function (global) {
    const visuals = global.InteractionVisuals;

    function handleCanInteraction(system, player, canEntity, gameState) {
        const playerComponent = player.getComponent('Player');
        const playerId = playerComponent.playerId;

        Utils.log(`?? Swedish Can (Burken) kicked by player ${playerId}!`);

        if (playerComponent.score !== undefined) {
            playerComponent.score += 10;
            Utils.log(`Player ${playerId} score: ${playerComponent.score}`);
        }

        if (visuals && visuals.createCanKickEffect) {
            visuals.createCanKickEffect(system, canEntity);
        }
    }

    function handleDoorInteraction(system, player, doorEntity, gameState) {
        Utils.log('?? Door interaction (future feature)');
    }

    function handleControlInteraction(system, player, controlEntity, gameState) {
        Utils.log('?? Control interaction (future feature)');
    }

    function handleSpecificInteraction(system, player, targetEntity, interactable, gameState) {
        switch (interactable.type) {
            case 'can':
            case 'burken':
                handleCanInteraction(system, player, targetEntity, gameState);
                break;
            case 'door':
                handleDoorInteraction(system, player, targetEntity, gameState);
                break;
            case 'lever':
            case 'button':
                handleControlInteraction(system, player, targetEntity, gameState);
                break;
            default:
                Utils.log(`Unknown interaction type: ${interactable.type}`);
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            handleSpecificInteraction,
            handleCanInteraction,
            handleDoorInteraction,
            handleControlInteraction
        };
    } else {
        global.InteractionHandlers = {
            handleSpecificInteraction,
            handleCanInteraction,
            handleDoorInteraction,
            handleControlInteraction
        };
    }
})(typeof window !== 'undefined' ? window : globalThis);