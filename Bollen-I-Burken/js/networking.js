/* ==========================================
   BOLLEN I BURKEN - NETWORKING SYSTEM
   Multiplayer networking (placeholder for future)
   ========================================== */

class NetworkSystem extends System {
    constructor() {
        super('NetworkSystem');

        this.isConnected = false;
        this.isHost = false;
        this.connection = null;
        this.players = new Map();
        this.latency = 0;

        // Network protocol configuration
        this.messageTypes = {
            PLAYER_JOIN: 'player_join',
            PLAYER_LEAVE: 'player_leave',
            PLAYER_UPDATE: 'player_update',
            GAME_STATE: 'game_state',
            PING: 'ping',
            PONG: 'pong'
        };

        Utils.log('Network system initialized (placeholder)');
    }

    // Initialize networking - placeholder for future implementation
    async initializeNetwork(mode = 'local') {
        switch (mode) {
            case 'local':
                this.initializeLocalMode();
                break;
            case 'host':
                await this.initializeHost();
                break;
            case 'join':
                await this.initializeClient();
                break;
            default:
                Utils.warn('Unknown network mode:', mode);
        }
    }

    initializeLocalMode() {
        this.isConnected = false;
        this.isHost = false;
        Utils.log('Network system running in local mode');
    }

    async initializeHost() {
        // Future: WebRTC or WebSocket server setup
        Utils.log('Host mode not yet implemented');
        throw new Error('Host mode not yet implemented');
    }

    async initializeClient() {
        // Future: Connect to WebRTC or WebSocket server
        Utils.log('Client mode not yet implemented');
        throw new Error('Client mode not yet implemented');
    }

    // Send player update to other players
    sendPlayerUpdate(playerId, position, rotation, state) {
        if (!this.isConnected) return;

        const message = {
            type: this.messageTypes.PLAYER_UPDATE,
            playerId: playerId,
            position: position,
            rotation: rotation,
            state: state,
            timestamp: Utils.now()
        };

        this.sendMessage(message);
    }

    // Send game state update (host only)
    sendGameState(gameState) {
        if (!this.isConnected || !this.isHost) return;

        const message = {
            type: this.messageTypes.GAME_STATE,
            tick: gameState.currentTick,
            players: this.serializePlayerStates(gameState),
            timestamp: Utils.now()
        };

        this.sendMessage(message);
    }

    // Handle incoming network messages
    handleMessage(message) {
        switch (message.type) {
            case this.messageTypes.PLAYER_JOIN:
                this.handlePlayerJoin(message);
                break;
            case this.messageTypes.PLAYER_LEAVE:
                this.handlePlayerLeave(message);
                break;
            case this.messageTypes.PLAYER_UPDATE:
                this.handlePlayerUpdate(message);
                break;
            case this.messageTypes.GAME_STATE:
                this.handleGameState(message);
                break;
            case this.messageTypes.PING:
                this.handlePing(message);
                break;
            case this.messageTypes.PONG:
                this.handlePong(message);
                break;
            default:
                Utils.warn('Unknown message type:', message.type);
        }
    }

    handlePlayerJoin(message) {
        Utils.log('Player joined:', message.playerId);
        // Future: Add remote player to game
    }

    handlePlayerLeave(message) {
        Utils.log('Player left:', message.playerId);
        // Future: Remove remote player from game
    }

    handlePlayerUpdate(message) {
        // Future: Update remote player position
        Utils.log('Player update received:', message.playerId);
    }

    handleGameState(message) {
        // Future: Apply authoritative game state from host
        Utils.log('Game state update received');
    }

    handlePing(message) {
        // Respond to ping with pong
        const pongMessage = {
            type: this.messageTypes.PONG,
            timestamp: message.timestamp,
            serverTime: Utils.now()
        };
        this.sendMessage(pongMessage);
    }

    handlePong(message) {
        // Calculate latency
        const currentTime = Utils.now();
        this.latency = currentTime - message.timestamp;
        Utils.log(`Latency: ${this.latency}ms`);
    }

    // Send periodic ping to measure latency
    sendPing() {
        if (!this.isConnected) return;

        const pingMessage = {
            type: this.messageTypes.PING,
            timestamp: Utils.now()
        };
        this.sendMessage(pingMessage);
    }

    // Generic message sending (to be implemented with actual networking)
    sendMessage(message) {
        if (!this.connection) {
            Utils.warn('No network connection available');
            return;
        }

        // Future: Implement actual message sending
        Utils.log('Sending message:', message);
    }

    // Serialize player states for network transmission
    serializePlayerStates(gameState) {
        const playerStates = [];

        for (const [playerId, entityId] of gameState.players) {
            const entity = gameState.getEntity(entityId);
            if (entity && entity.active) {
                const transform = entity.getComponent('Transform');
                const player = entity.getComponent('Player');

                if (transform && player) {
                    playerStates.push({
                        playerId: playerId,
                        position: transform.position,
                        rotation: transform.rotation,
                        state: player.state,
                        health: player.health
                    });
                }
            }
        }

        return playerStates;
    }

    // Apply received player states to local game
    applyPlayerStates(playerStates, gameState) {
        for (const playerState of playerStates) {
            const entity = gameState.getPlayerEntity(playerState.playerId);
            if (entity) {
                const transform = entity.getComponent('Transform');
                const player = entity.getComponent('Player');

                if (transform && player && !player.isLocal) {
                    // Apply interpolation for smooth movement
                    transform.previousPosition = { ...transform.position };
                    transform.position = playerState.position;
                    transform.rotation = playerState.rotation;
                }

                if (player && !player.isLocal) {
                    player.state = playerState.state;
                    player.health = playerState.health;
                }
            }
        }
    }

    // Interpolate between network updates for smooth movement
    interpolatePlayerPositions(gameState, deltaTime) {
        // Future: Implement client-side prediction and interpolation
        Utils.log('Player position interpolation not yet implemented');
    }

    // Client-side prediction for local player
    predictLocalPlayer(gameState, deltaTime) {
        // Future: Implement client-side prediction to reduce input lag
        Utils.log('Client-side prediction not yet implemented');
    }

    // Handle connection events
    onConnected() {
        this.isConnected = true;
        Utils.log('Network connection established');
    }

    onDisconnected() {
        this.isConnected = false;
        Utils.log('Network connection lost');
    }

    onError(error) {
        Utils.error('Network error:', error);
    }

    // Update network system
    update(gameState) {
        if (!this.isConnected) return;

        // Send periodic pings for latency measurement
        if (Utils.now() % 5000 < 16) { // Every 5 seconds (roughly)
            this.sendPing();
        }

        // Send local player updates
        this.sendLocalPlayerUpdate(gameState);

        // Handle interpolation and prediction
        this.interpolatePlayerPositions(gameState, 16); // Assume 60 FPS
        this.predictLocalPlayer(gameState, 16);
    }

    sendLocalPlayerUpdate(gameState) {
        const localPlayer = gameState.getLocalPlayer();
        if (!localPlayer) return;

        const transform = localPlayer.getComponent('Transform');
        const player = localPlayer.getComponent('Player');

        if (transform && player) {
            this.sendPlayerUpdate(
                gameState.localPlayerId,
                transform.position,
                transform.rotation,
                player.state
            );
        }
    }

    // Get network statistics
    getNetworkStats() {
        return {
            connected: this.isConnected,
            isHost: this.isHost,
            latency: this.latency,
            playerCount: this.players.size
        };
    }

    // Disconnect from network
    disconnect() {
        if (this.connection) {
            // Future: Properly close connection
            this.connection = null;
        }

        this.isConnected = false;
        this.isHost = false;
        this.players.clear();

        Utils.log('Disconnected from network');
    }

    destroy() {
        this.disconnect();
        Utils.log('Network system destroyed');
    }
}

// WebRTC implementation placeholder
class WebRTCNetwork {
    constructor() {
        this.peerConnection = null;
        this.dataChannel = null;
        this.isInitiator = false;
    }

    async initialize(isInitiator = false) {
        this.isInitiator = isInitiator;

        // Future: Implement WebRTC peer connection
        Utils.log('WebRTC not yet implemented');
        throw new Error('WebRTC networking not yet implemented');
    }

    sendData(data) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(JSON.stringify(data));
        }
    }

    onMessage(callback) {
        if (this.dataChannel) {
            this.dataChannel.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    callback(data);
                } catch (error) {
                    Utils.error('Failed to parse WebRTC message', error);
                }
            };
        }
    }

    close() {
        if (this.dataChannel) {
            this.dataChannel.close();
        }
        if (this.peerConnection) {
            this.peerConnection.close();
        }
    }
}

// WebSocket implementation placeholder
class WebSocketNetwork {
    constructor() {
        this.socket = null;
        this.url = null;
    }

    async connect(url) {
        this.url = url;

        // Future: Implement WebSocket connection
        Utils.log('WebSocket not yet implemented');
        throw new Error('WebSocket networking not yet implemented');
    }

    send(data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        }
    }

    onMessage(callback) {
        if (this.socket) {
            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    callback(data);
                } catch (error) {
                    Utils.error('Failed to parse WebSocket message', error);
                }
            };
        }
    }

    close() {
        if (this.socket) {
            this.socket.close();
        }
    }
}

// Export for module systems or global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NetworkSystem, WebRTCNetwork, WebSocketNetwork };
} else {
    window.GameNetwork = { NetworkSystem, WebRTCNetwork, WebSocketNetwork };
}