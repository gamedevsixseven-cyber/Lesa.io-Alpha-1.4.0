/**
 * Lesa.io - P2P Network Manager
 * Powered by WebRTC DataChannel (PeerJS) for ultra-low latency multiplayer
 */

class NetworkManager {
    constructor() {
        this.peer = null;
        this.conn = null;
        this.fastConn = null;
        this._fastConnected = false;
        this.isHost = false;
        this.roomCode = '';
        this.connected = false;
        this.connecting = false;
        this.isPeerOpen = false;
        this._readyPromise = null;
        this._readyResolve = null;
        this._joinSessionId = 0;
        this._retryTimer = null;

        this.localUserData = {
            name: 'Hero',
            heroType: 'psanas',
            weaponType: 'pea',
            heroSkin: 'default',
            heroStyle: null,
            starBlessed: false,
            maxHp: 100,
            damageReduction: 0
        };
        this.peerUserData = null;
        this._gracefulTimer = null;

        this.onConnectedCallback = null;
        this.onDisconnectedCallback = null;
        this.onMessageCallback = null;
        this.onErrorCallback = null;
        this.onStatusCallback = null;

        this.pingInterval = null;
        this.lastPingTime = 0;
        this.latency = 20; // Default estimate ms
        this.lastMessageTime = performance.now();
        this.watchdogInterval = null;
        this.isGracefulDisconnecting = false;
    }

    _getPeerOptions() {
        if (typeof CoopNetTransport !== 'undefined') return CoopNetTransport.buildPeerOptions();
        return {
            debug: 1,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun.cloudflare.com:3478' }
                ],
                iceCandidatePoolSize: 6
            }
        };
    }

    _decodePacket(raw) {
        let data = raw;
        if (typeof raw === 'string') {
            try { data = JSON.parse(raw); } catch (_) { return null; }
        }
        return (data && data.type) ? data : null;
    }

    normalizeRoomId(code) {
        const clean = (code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        return `lesaio-${clean}`;
    }

    createRoomCode() {
        // Generate memorable 4-digit code e.g. 7429
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    waitUntilReady(timeoutMs = 6500) {
        if (this.isPeerOpen && this.peer && !this.peer.destroyed) return Promise.resolve(true);
        if (!this._readyPromise) return Promise.resolve(false);
        return new Promise((resolve) => {
            let done = false;
            const timer = setTimeout(() => { if (!done) { done = true; resolve(false); } }, timeoutMs);
            this._readyPromise.then((ok) => {
                if (!done) { done = true; clearTimeout(timer); resolve(!!ok); }
            });
        });
    }

    host(code = null, userData = null) {
        this.disconnect(true);
        this.isHost = true;
        this.isPeerOpen = false;
        this.roomCode = code || this.createRoomCode();
        if (userData) this.localUserData = { ...this.localUserData, ...userData };
        this._readyPromise = new Promise((resolve) => { this._readyResolve = resolve; });

        const fullPeerId = this.normalizeRoomId(this.roomCode);

        try {
            if (typeof Peer === 'undefined') {
                throw new Error('PeerJS library is not loaded');
            }

            this.peer = new Peer(fullPeerId, this._getPeerOptions());
            if (typeof CoopNetTransport !== 'undefined') {
                CoopNetTransport.bindPeerLifecycle(this);
                CoopNetTransport.ensureVisibilityReconnect(this);
            }

            this.peer.on('open', (id) => {
                this.isPeerOpen = true;
                if (this._readyResolve) { this._readyResolve(true); this._readyResolve = null; }
                console.log(`[NetworkManager] Room created with ID: ${this.roomCode} (${id})`);
                if (this.onStatusCallback && !this.connected) this.onStatusCallback('Waiting for partner to join...');
            });

            this.peer.on('connection', (connection) => {
                const isFastChannel = !!(connection && connection.metadata && connection.metadata.channel === 'fast');
                if (isFastChannel) {
                    if (this.conn && typeof CoopNetTransport !== 'undefined') {
                        CoopNetTransport.setupFastChannelHandlers(this, connection);
                    } else {
                        try { connection.close(); } catch (_) {}
                    }
                    return;
                }
                const matchInProgress = (typeof window !== 'undefined' && window.gameInstance && window.gameInstance.coopSession && window.gameInstance.state === 'PLAYING');
                if ((this.conn && this.conn.open) || matchInProgress) {
                    connection.close();
                    return;
                }
                this.conn = connection;
                this.setupConnectionHandlers();
            });

            this.peer.on('error', (err) => {
                console.error('[NetworkManager] Peer error:', err);
                if (!this.isPeerOpen && this._readyResolve) { this._readyResolve(false); this._readyResolve = null; }
                if (this.onErrorCallback) this.onErrorCallback(err.type || err.message);
            });

        } catch (err) {
            console.error('[NetworkManager] Host init error:', err);
            if (this._readyResolve) { this._readyResolve(false); this._readyResolve = null; }
            if (this.onErrorCallback) this.onErrorCallback(err.message);
        }

        return this.roomCode;
    }

    join(code, userData = null) {
        this.disconnect(true);
        this.isHost = false;
        this.connecting = true;
        this.roomCode = (code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (userData) this.localUserData = { ...this.localUserData, ...userData };

        const targetPeerId = this.normalizeRoomId(this.roomCode);
        const myJoinId = ++this._joinSessionId;

        try {
            if (typeof Peer === 'undefined') {
                throw new Error('PeerJS library is not loaded');
            }
            if (!this.roomCode) {
                throw new Error('Invalid room code');
            }

            this.peer = new Peer(undefined, this._getPeerOptions());
            if (typeof CoopNetTransport !== 'undefined') {
                CoopNetTransport.bindPeerLifecycle(this);
                CoopNetTransport.ensureVisibilityReconnect(this);
            }

            let attempt = 0;
            const maxAttempts = 4;
            const retryDelays = [900, 1600, 2400];
            let retrying = false;

            const scheduleRetry = (reason) => {
                if (myJoinId !== this._joinSessionId || this.connected || retrying || !this.peer || this.peer.destroyed) return;
                if (attempt >= maxAttempts) {
                    this.connecting = false;
                    const msg = (typeof CoopNetTransport !== 'undefined') ? CoopNetTransport.describeError(reason) : reason;
                    if (this.onErrorCallback) this.onErrorCallback(msg);
                    return;
                }
                retrying = true;
                const delay = retryDelays[Math.min(attempt - 1, retryDelays.length - 1)] || 1800;
                if (this.onStatusCallback) this.onStatusCallback(`Mobile connection retry ${attempt + 1}/${maxAttempts}...`);
                if (this.conn) {
                    try { this.conn.close(); } catch (_) {}
                    this.conn = null;
                }
                if (this._retryTimer) clearTimeout(this._retryTimer);
                this._retryTimer = setTimeout(() => {
                    this._retryTimer = null;
                    retrying = false;
                    if (myJoinId === this._joinSessionId && !this.connected) startAttempt();
                }, delay);
            };

            this._onAttemptIceFailed = () => scheduleRetry('ice-failed');

            const startAttempt = () => {
                if (myJoinId !== this._joinSessionId || this.connected || !this.peer || this.peer.destroyed) return;
                attempt++;
                this.conn = this.peer.connect(targetPeerId, { reliable: true });
                this.setupConnectionHandlers();
                if (this.connectTimeout) clearTimeout(this.connectTimeout);
                this.connectTimeout = setTimeout(() => {
                    if (!this.connected && myJoinId === this._joinSessionId) {
                        if (attempt < maxAttempts) {
                            scheduleRetry('peer-unavailable');
                        } else {
                            this.connecting = false;
                            console.warn('[NetworkManager] Join connection timed out');
                            if (this.onErrorCallback) this.onErrorCallback('Room not found or connection timed out');
                        }
                    }
                }, 5000);
            };

            this.peer.on('open', () => {
                if (myJoinId !== this._joinSessionId || this.connected) return;
                if (this.onStatusCallback) this.onStatusCallback(`Connecting to room ${this.roomCode}...`);
                startAttempt();
            });

            this.peer.on('error', (err) => {
                console.error('[NetworkManager] Join error:', err);
                const errType = (err && (err.type || err.message)) || 'network';
                const transient = (typeof CoopNetTransport !== 'undefined') ? CoopNetTransport.isTransientError(errType) : (errType === 'peer-unavailable');
                if (!this.connected && transient && attempt < maxAttempts) {
                    scheduleRetry(errType);
                    return;
                }
                this.connecting = false;
                const msg = (typeof CoopNetTransport !== 'undefined') ? CoopNetTransport.describeError(errType) : errType;
                if (this.onErrorCallback) this.onErrorCallback(msg);
            });

        } catch (err) {
            this.connecting = false;
            console.error('[NetworkManager] Join init error:', err);
            if (this.onErrorCallback) this.onErrorCallback(err.message);
        }
    }

    setupConnectionHandlers() {
        if (!this.conn) return;
        const activeConn = this.conn;
        if (typeof CoopNetTransport !== 'undefined') {
            CoopNetTransport.attachIceRecovery(this, activeConn);
        }

        const onConnOpen = () => {
            if (this.conn !== activeConn || this.connected) return;
            if (this._retryTimer) { clearTimeout(this._retryTimer); this._retryTimer = null; }
            if (this.connectTimeout) {
                clearTimeout(this.connectTimeout);
                this.connectTimeout = null;
            }
            this.connecting = false;
            this.connected = true;
            this.lastMessageTime = performance.now();
            console.log('[NetworkManager] Connection established!');

            // Send handshake hello
            this.send('HANDSHAKE_HELLO', {
                isHost: this.isHost,
                userData: this.localUserData
            });

            this.startHeartbeat();
        };

        activeConn.on('open', onConnOpen);
        if (activeConn.open) {
            onConnOpen();
        }

        activeConn.on('data', (raw) => {
            if (this.conn !== activeConn) return;
            this.lastMessageTime = performance.now();
            const data = this._decodePacket(raw);
            if (!data) return;

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
                if (typeof CoopNetTransport !== 'undefined') {
                    CoopNetTransport.openGuestFastChannel(this);
                }
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
                    const sample = Math.round((now - data.payload.time) / 2);
                    // Smoothed moving average latency
                    this.latency = Math.round((this.latency * 0.7) + (sample * 0.3));
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

        activeConn.on('close', () => {
            if (this.conn !== activeConn) return;
            this.handleDisconnect('Connection closed by peer');
        });

        activeConn.on('error', (err) => {
            if (this.conn !== activeConn) return;
            console.error('[NetworkManager] Data connection error:', err);
            this.handleDisconnect(err ? (err.message || String(err)) : 'Data connection error');
        });
    }

    send(type, payload = {}, options = null) {
        if (!this.connected) return false;
        const opts = options || {};
        const useFast = !!(opts.fast && this.fastConn && this.fastConn.open);
        const targetConn = useFast ? this.fastConn : this.conn;
        if (!targetConn || !targetConn.open) return false;

        const dc = targetConn.dataChannel || targetConn._dc;
        const maxBuf = opts.maxBufferedBytes || 98304;
        if (opts.droppable && dc && typeof dc.bufferedAmount === 'number' && dc.bufferedAmount > maxBuf) {
            return false;
        }
        try {
            const msg = { type, payload };
            targetConn.send(targetConn.serialization === 'json' ? JSON.stringify(msg) : msg);
            return true;
        } catch (err) {
            if (useFast && this.conn && this.conn.open) {
                try {
                    const msg = { type, payload };
                    this.conn.send(this.conn.serialization === 'json' ? JSON.stringify(msg) : msg);
                    return true;
                } catch (_) {}
            }
            console.warn('[NetworkManager] Failed to send packet:', type, err);
            return false;
        }
    }

    startHeartbeat() {
        if (this.pingInterval) clearInterval(this.pingInterval);
        if (this.watchdogInterval) clearInterval(this.watchdogInterval);

        // Ping at 1.5s interval
        this.pingInterval = setInterval(() => {
            if (this.connected) {
                this.send('PING', { time: performance.now() });
            }
        }, 1500);

        // Resilient Watchdog for mobile 4G spikes/handoffs: probe at 4s, disconnect after 9.5s silence
        this.watchdogInterval = setInterval(() => {
            if (this.connected) {
                const idleTime = performance.now() - this.lastMessageTime;
                if (idleTime > 4000 && idleTime <= 9500) {
                    this.send('PING', { time: performance.now() });
                } else if (idleTime > 9500) {
                    console.warn(`[NetworkManager] Peer heartbeat timeout (${Math.round(idleTime)}ms idle)`);
                    this.handleDisconnect('Connection timed out');
                }
            }
        }, 1000);
    }

    handleDisconnect(reason = 'Disconnected') {
        const wasConnected = this.connected;
        this.connected = false;
        this.connecting = false;
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = null;
        if (this.watchdogInterval) clearInterval(this.watchdogInterval);
        this.watchdogInterval = null;

        if (wasConnected && this.onDisconnectedCallback) {
            this.onDisconnectedCallback(reason);
        }
    }

    disconnectGracefully(reason = 'Host left the match', onDone = null, packetType = 'HOST_QUIT_MATCH', packetPayload = null) {
        if (this.isGracefulDisconnecting) return;
        this.isGracefulDisconnecting = true;

        if (this.connected) {
            try {
                this.send(packetType, packetPayload || { reason });
            } catch (e) {}
        }

        // Allow outgoing buffer to flush onto network wire
        if (this._gracefulTimer) clearTimeout(this._gracefulTimer);
        this._gracefulTimer = setTimeout(() => {
            this._gracefulTimer = null;
            this.disconnect();
            this.isGracefulDisconnecting = false;
            if (typeof onDone === 'function') onDone();
        }, 120);
    }

    disconnect(silent = false) {
        this._joinSessionId++;
        this._onAttemptIceFailed = null;
        if (this._retryTimer) {
            clearTimeout(this._retryTimer);
            this._retryTimer = null;
        }
        if (this._gracefulTimer) {
            clearTimeout(this._gracefulTimer);
            this._gracefulTimer = null;
        }
        this.isGracefulDisconnecting = false;
        this.connecting = false;
        this.isPeerOpen = false;
        if (this._readyResolve) { this._readyResolve(false); this._readyResolve = null; }
        this._readyPromise = null;
        if (this.connectTimeout) {
            clearTimeout(this.connectTimeout);
            this.connectTimeout = null;
        }
        if (silent) this.connected = false;
        this.handleDisconnect('Disconnected locally');
        if (this.fastConn) {
            try { this.fastConn.close(); } catch (e) {}
            this.fastConn = null;
        }
        this._fastConnected = false;
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
