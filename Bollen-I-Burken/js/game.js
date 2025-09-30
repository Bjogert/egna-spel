/* ==========================================
   BOLLEN I BURKEN - GAME CORE AGGREGATOR
   Collects ECS primitives exposed by individual core files
   ========================================== */

(function (global) {
    const coreExports = {
        Entity: global.Entity,
        Transform: global.Transform,
        PlayerInput: global.PlayerInput,
        Renderable: global.Renderable,
        Movement: global.Movement,
        Player: global.Player,
        Interactable: global.Interactable,
        Hideable: global.Hideable,
        Collider: global.Collider,
        GameState: global.GameState,
        System: global.System,
        GameEngine: global.GameEngineClass || global.GameEngineConstructor || global.GameEngine,
        GAME_STATES: global.GAME_STATES,
        PLAYER_STATES: global.PLAYER_STATES
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = coreExports;
    } else {
        global.GameCore = coreExports;
        global.GameEngineClass = global.GameEngineClass || coreExports.GameEngine;
    }
})(typeof window !== 'undefined' ? window : globalThis);