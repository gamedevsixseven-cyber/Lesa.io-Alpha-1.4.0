/**
 * Lesa.io - P2P Network Manager
 * Powered by WebRTC DataChannel (PeerJS) for ultra-low latency multiplayer
 */

class NetworkManager {
    constructor() {
        this.peer = null;
        this.conn = null;
        this.isHost = false;
        this.roomCode = '';
        this.connected = false;

        this.localUserData = {
            name: 'Hero',
            heroType: 'psanas',
            weaponType: 'pea'
        };
        this.peerUserData = null;

        this.onConnectedCallback = null;
        this.onDisconnectedCallback = null;
        this.onMessageCallback = null;
        this.onErrorCallback = null;

        this.pingInterval = null;
        this.lastPingTime = 0;
        this.latency = 0;
    }

    normalizeRoomId(code) {
        const clean = (code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        return `lesaio-${clean}`;
    }

    createRoomCode() {
        // Generate memorable 4-digit code e.g. 7429
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    host(code = null, userData = null) {
        this.disconnect();
        this.isHost = true;
        this.roomCode = code || this.createRoomCode();
        if (userData) this.localUserData = { ...this.localUserData, ...userData };

        const fullPeerId = this.normalizeRoomId(this.roomCode);

        try {
            if (typeof Peer === 'undefined') {
                throw new Error('PeerJS library is not loaded');
            }

            this.peer = new Peer(fullPeerId, {
                debug: 1,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' }
                    ]
                }
            });

            this.peer.on('open', (id) => {
                console.log(`[NetworkManager] Room created with ID: ${this.roomCode} (${id})`);
            });

            this.peer.on('connection', (connection) => {
                if (this.conn && this.conn.open) {
                    connection.close();
                    return;
                }
                this.conn = connection;
                this.setupConnectionHandlers();
            });

            this.peer.on('error', (err) => {
                console.error('[NetworkManager] Peer error:', err);
                if (this.onErrorCallback) this.onErrorCallback(err.type || err.message);
            });

        } catch (err) {
            console.error('[NetworkManager] Host init error:', err);
            if (this.onErrorCallback) this.onErrorCallback(err.message);
        }

        return this.roomCode;
    }

    join(code, userData = null) {
        this.disconnect();
        this.isHost = false;
        this.roomCode = (code || '').trim().toUpperCase();
        if (userData) this.localUserData = { ...this.localUserData, ...userData };

        const targetPeerId = this.normalizeRoomId(this.roomCode);

        try {
            if (typeof Peer === 'undefined') {
                throw new Error('PeerJS library is not loaded');
            }

            this.peer = new Peer(undefined, {
                debug: 1,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' }
                    ]
                }
            });

            this.peer.on('open', () => {
                this.conn = this.peer.connect(targetPeerId, { reliable: true, serialization: 'json' });
                this.setupConnectionHandlers();
            });

            this.peer.on('error', (err) => {
                console.error('[NetworkManager] Join error:', err);
                if (this.onErrorCallback) this.onErrorCallback(err.type || err.message);
            });

        } catch (err) {
            console.error('[NetworkManager] Join init error:', err);
            if (this.onErrorCallback) this.onErrorCallback(err.message);
        }
    }

    setupConnectionHandlers() {
        if (!this.conn) return;

        this.conn.on('open', () => {
            this.connected = true;
            console.log('[NetworkManager] Connection established!');

            // Send handshake hello
            this.send('HANDSHAKE_HELLO', {
                isHost: this.isHost,
                userData: this.localUserData
            });

            this.startHeartbeat();
        });

        this.conn.on('data', (raw) => {
            let data = raw;
            if (typeof raw === 'string') {
                try {
                    data = JSON.parse(raw);
                } catch (e) {
                    return;
                }
            }
            if (!data || !data.type) return;

            if (data.type === 'HANDSHAKE_HELLO') {
                this.peerUserData = data.payload.userData;
                if (this.isHost) {
                    this.send('HANDSHAKE_ACK', {
                        userData: this.localUserData
                    });
                }
                if (this.onConnectedCallback) {
                    this.onConnectedCallback(this.isHost, this.peerUserData);
                }
                return;
            }

            if (data.type === 'HANDSHAKE_ACK') {
                this.peerUserData = data.payload.userData;
                if (this.onConnectedCallback) {
                    this.onConnectedCallback(this.isHost, this.peerUserData);
                }
                return;
            }

            if (data.type === 'PING') {
                this.send('PONG', data.payload);
                return;
            }

            if (data.type === 'PONG') {
                const now = performance.now();
                if (data.payload && data.payload.time) {
                    this.latency = Math.round((now - data.payload.time) / 2);
                }
                return;
            }

            if (this.onMessageCallback) {
                try {
                    this.onMessageCallback(data.type, data.payload);
                } catch (msgErr) {
                    console.error('[NetworkManager] Error in message handler:', data.type, msgErr);
                }
            }
        });

        this.conn.on('close', () => {
            this.handleDisconnect('Connection closed by peer');
        });

        this.conn.on('error', (err) => {
            console.error('[NetworkManager] Data connection error:', err);
            this.handleDisconnect(err.message);
        });
    }

    send(type, payload = {}) {
        if (!this.conn || !this.connected) return;
        try {
            const raw = JSON.stringify({ type, payload });
            this.conn.send(raw);
        } catch (err) {
            console.warn('[NetworkManager] Failed to send packet:', type, err);
        }
    }

    startHeartbeat() {
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
            if (this.connected) {
                this.send('PING', { time: performance.now() });
            }
        }, 2000);
    }

    handleDisconnect(reason = 'Disconnected') {
        const wasConnected = this.connected;
        this.connected = false;
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = null;

        if (wasConnected && this.onDisconnectedCallback) {
            this.onDisconnectedCallback(reason);
        }
    }

    disconnect() {
        this.handleDisconnect('Disconnected locally');
        if (this.conn) {
            try { this.conn.close(); } catch (e) {}
            this.conn = null;
        }
        if (this.peer) {
            try { this.peer.destroy(); } catch (e) {}
            this.peer = null;
        }
        this.connected = false;
        this.roomCode = '';
        this.peerUserData = null;
    }
}

if (typeof window !== 'undefined') {
    window.NetworkManager = NetworkManager;
    window.networkManager = new NetworkManager();
}
