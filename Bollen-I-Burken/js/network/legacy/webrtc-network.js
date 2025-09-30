/* ==========================================
   LEGACY WEBRTC NETWORK PLACEHOLDER
   ========================================== */

(function (global) {
    class WebRTCNetwork {
        constructor() {
            this.peerConnection = null;
            this.dataChannel = null;
            this.isInitiator = false;
        }

        async initialize(isInitiator = false) {
            this.isInitiator = isInitiator;
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
                        callback(JSON.parse(event.data));
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

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = WebRTCNetwork;
    } else {
        global.WebRTCNetwork = WebRTCNetwork;
    }
})(typeof window !== 'undefined' ? window : globalThis);