/* ==========================================
   BOLLEN I BURKEN - PLAYER MODULE AGGREGATOR
   Exposes movement system and player helpers for legacy consumers
   ========================================== */

(function (global) {
    const MovementSystem = global.GameSystems && global.GameSystems.MovementSystem ? global.GameSystems.MovementSystem : global.MovementSystem;
    const PlayerFactory = global.GameManagers && global.GameManagers.PlayerFactory ? global.GameManagers.PlayerFactory : global.PlayerFactory;
    const PlayerManager = global.GameManagers && global.GameManagers.PlayerManager ? global.GameManagers.PlayerManager : global.PlayerManager;

    const exports = { MovementSystem, PlayerFactory, PlayerManager };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports;
    } else {
        global.GamePlayer = exports;
    }
})(typeof window !== 'undefined' ? window : globalThis);