/* ==========================================
   NETWORK MODULE AGGREGATOR
   Keeps legacy global access to networking helpers
   ========================================== */

(function (global) {
    const NetworkSystem = global.NetworkSystem;
    const WebRTCNetwork = global.WebRTCNetwork;
    const WebSocketNetwork = global.WebSocketNetwork;

    const exports = { NetworkSystem, WebRTCNetwork, WebSocketNetwork };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports;
    } else {
        global.GameNetwork = exports;
    }
})(typeof window !== 'undefined' ? window : globalThis);