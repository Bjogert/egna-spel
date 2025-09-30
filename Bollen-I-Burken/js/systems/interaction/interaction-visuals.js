/* ==========================================
   INTERACTION VISUAL HELPERS
   Handles visual feedback for interactions
   ========================================== */

(function (global) {
    function createCanKickEffect(system, canEntity) {
        const canTransform = canEntity.getComponent('Transform');
        if (!canTransform) return;

        const renderable = canEntity.getComponent('Renderable');
        if (renderable && renderable.mesh) {
            const originalScale = renderable.mesh.scale.clone();

            renderable.mesh.scale.multiplyScalar(1.1);

            setTimeout(() => {
                if (renderable.mesh) {
                    renderable.mesh.scale.copy(originalScale);
                }
            }, 200);

            Utils.log('?? Can kick visual effect triggered');
        }
    }

    function createInteractionFeedback(system, targetEntity, interactable) {
        Utils.log(`? Interaction feedback for ${interactable.type}`);
    }

    function updateVisualFeedback(system, gameState) {
        // Placeholder for future highlight/indicator logic
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            createCanKickEffect,
            createInteractionFeedback,
            updateVisualFeedback
        };
    } else {
        global.InteractionVisuals = {
            createCanKickEffect,
            createInteractionFeedback,
            updateVisualFeedback
        };
    }
})(typeof window !== 'undefined' ? window : globalThis);