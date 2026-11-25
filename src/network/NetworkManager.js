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
        this.peers = new Map();
        this._pendingFastConns = new Map();
        this.maxGuests = 3;
        this.isHost = false;
        this.assignedPeerId = null;
        this.roomCode = '';
        this.connected = false;
        this.connecting = false;
        this.isPeerOpen = false;
        this._readyPromise = null;
        this._readyResolve = null;
        this._hostSessionId = 0;
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
                    { urls: 'stun:stun.turnix.io:3478' },
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun.cloudflare.com:3478' }
                ],
                iceCandidatePoolSize: 10
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
        const myHostId = ++this._hostSessionId;

        (async () => {
            try {
                if (typeof Peer === 'undefined') {
                    throw new Error('PeerJS library is not loaded');
                }
                if (typeof CoopNetTransport !== 'undefined' && typeof CoopNetTransport.refreshIceServers === 'function') {
                    await CoopNetTransport.refreshIceServers(false, 2200);
                }
                if (myHostId !== this._hostSessionId || !this.isHost) return;

                this.peer = new Peer(fullPeerId, this._getPeerOptions());
                if (typeof CoopNetTransport !== 'undefined') {
                    CoopNetTransport.bindPeerLifecycle(this);
                    CoopNetTransport.ensureVisibilityReconnect(this);
                }

                this.peer.on('open', (id) => {
                    this.isPeerOpen = true;
                    this.assignedPeerId = 'host';
                    if (this._readyResolve) { this._readyResolve(true); this._readyResolve = null; }
                    console.log(`[NetworkManager] Room created with ID: ${this.roomCode} (${id})`);
                    if (this.onStatusCallback && this.peers.size === 0) this.onStatusCallback('Waiting for squadmates to join (up to 3)...');
                });

                this.peer.on('connection', (connection) => {
                    const remoteId = connection && connection.peer;
                    const isFastChannel = !!(connection && connection.metadata && connection.metadata.channel === 'fast');
                    if (isFastChannel) {
                        const peerEntry = remoteId ? this.peers.get(remoteId) : null;
                        if (peerEntry && typeof CoopNetTransport !== 'undefined') {
                            CoopNetTransport.setupFastChannelHandlers(this, connection, peerEntry);
                        } else if (remoteId) {
                            this._pendingFastConns.set(remoteId, connection);
                            connection.on('close', () => {
                                if (this._pendingFastConns.get(remoteId) === connection) this._pendingFastConns.delete(remoteId);
                            });
                        } else {
                            try { connection.close(); } catch (_) {}
                        }
                        return;
                    }
                    const matchInProgress = (typeof window !== 'undefined' && window.gameInstance && window.gameInstance.coopSession && window.gameInstance.state === 'PLAYING');
                    let openCount = 0;
                    for (const [pid, p] of this.peers.entries()) {
                        if (pid !== remoteId && p && p.conn && p.conn.open) openCount++;
                    }
                    if (matchInProgress || openCount >= this.maxGuests || !remoteId) {
                        const reason = matchInProgress ? 'Match is already in progress' : 'Room is full (4/4 players)';
                        connection.on('open', () => {
                            try { connection.send({ type: 'ROOM_REJECTED', payload: { reason } }); } catch (_) {}
                            setTimeout(() => { try { connection.close(); } catch (_) {} }, 80);
                        });
                        if (connection.open) {
                            try { connection.send({ type: 'ROOM_REJECTED', payload: { reason } }); } catch (_) {}
                            setTimeout(() => { try { connection.close(); } catch (_) {} }, 80);
                        }
                        return;
                    }
                    const prev = this.peers.get(remoteId);
                    if (prev && prev.conn && prev.conn !== connection) {
                        try { prev.conn.close(); } catch (_) {}
                        if (prev.fastConn) { try { prev.fastConn.close(); } catch (_) {} }
                    }
                    const peerEntry = {
                        id: remoteId, conn: connection, fastConn: null, fastConnected: false,
                        userData: null, connected: false, lastMessageTime: performance.now(), latency: this.latency
                    };
                    this.peers.set(remoteId, peerEntry);
                    const pendingFast = this._pendingFastConns.get(remoteId);
                    if (pendingFast) {
                        this._pendingFastConns.delete(remoteId);
                        if (typeof CoopNetTransport !== 'undefined') {
                            CoopNetTransport.setupFastChannelHandlers(this, pendingFast, peerEntry);
                        }
                    }
                    this._syncPrimaryPeerAlias();
                    this.setupConnectionHandlers(peerEntry);
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
        })();

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

        (async () => {
            try {
                if (typeof Peer === 'undefined') {
                    throw new Error('PeerJS library is not loaded');
                }
                if (!this.roomCode) {
                    throw new Error('Invalid room code');
                }
                if (typeof CoopNetTransport !== 'undefined' && typeof CoopNetTransport.refreshIceServers === 'function') {
                    await CoopNetTransport.refreshIceServers(false, 2200);
                }
                if (myJoinId !== this._joinSessionId) return;

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
                }, 8500);
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
        })();
    }

    _syncPrimaryPeerAlias() {
        if (!this.isHost) return;
        let first = null, hasConn = false;
        for (const p of this.peers.values()) {
            if (!first && p.connected) first = p;
            if (p.connected) hasConn = true;
        }
        if (!first) first = this.peers.values().next().value || null;
        this.conn = first ? first.conn : null;
        this.fastConn = first ? first.fastConn : null;
        this._fastConnected = !!(first && first.fastConnected);
        this.peerUserData = first ? first.userData : null;
        this.connected = hasConn;
    }

    getConnectedPeers() {
        const list = [];
        for (const p of this.peers.values()) {
            if (p && p.connected) list.push({ id: p.id, ...(p.userData || {}) });
        }
        return list;
    }

    getPeerCount() {
        if (!this.isHost) return this.connected ? 1 : 0;
        let n = 0;
        for (const p of this.peers.values()) { if (p && p.connected) n++; }
        return n;
    }

    setupConnectionHandlers(peerEntry = null) {
        const activeConn = peerEntry ? peerEntry.conn : this.conn;
        if (!activeConn) return;
        if (typeof CoopNetTransport !== 'undefined') CoopNetTransport.attachIceRecovery(this, activeConn);
        const isCurrent = () => peerEntry ? (this.peers.get(peerEntry.id) === peerEntry) : (this.conn === activeConn);

        const onConnOpen = () => {
            if (!isCurrent()) return;
            if (peerEntry ? peerEntry.connected : this.connected) return;
            if (this._retryTimer) { clearTimeout(this._retryTimer); this._retryTimer = null; }
            if (this.connectTimeout) { clearTimeout(this.connectTimeout); this.connectTimeout = null; }
            this.connecting = false;
            const now = performance.now();
            this.lastMessageTime = now;
            if (peerEntry) {
                peerEntry.connected = true;
                peerEntry.lastMessageTime = now;
                this._syncPrimaryPeerAlias();
                this.sendTo(peerEntry.id, 'HANDSHAKE_HELLO', { isHost: true, userData: this.localUserData });
            } else {
                this.connected = true;
                this.send('HANDSHAKE_HELLO', { isHost: false, userData: this.localUserData });
            }
            console.log('[NetworkManager] Connection established!', peerEntry ? peerEntry.id : 'host');
            this.startHeartbeat();
        };

        activeConn.on('open', onConnOpen);
        if (activeConn.open) onConnOpen();

        activeConn.on('data', (raw) => {
            if (!isCurrent()) return;
            const now = performance.now();
            this.lastMessageTime = now;
            if (peerEntry) peerEntry.lastMessageTime = now;
            const data = this._decodePacket(raw);
            if (!data) return;

            if (data.type === 'ROOM_REJECTED') {
                this._joinSessionId++;
                this.connecting = false;
                if (this.connectTimeout) { clearTimeout(this.connectTimeout); this.connectTimeout = null; }
                const reason = (data.payload && data.payload.reason) || 'Room unavailable';
                try { activeConn.close(); } catch (_) {}
                if (this.onErrorCallback) this.onErrorCallback(reason);
                return;
            }
            if (data.type === 'HANDSHAKE_HELLO') {
                const uData = data.payload && data.payload.userData;
                if (peerEntry) {
                    peerEntry.userData = uData;
                    this._syncPrimaryPeerAlias();
                    const roster = this.getConnectedPeers();
                    this.sendTo(peerEntry.id, 'HANDSHAKE_ACK', {
                        userData: this.localUserData, assignedPeerId: peerEntry.id, peers: roster
                    });
                    if (roster.length > 1) {
                        this.broadcastExcept(peerEntry.id, 'LOBBY_ROSTER', { peers: roster, host: this.localUserData });
                    }
                    if (this.onConnectedCallback) this.onConnectedCallback(true, uData, peerEntry.id, roster);
                } else {
                    this.peerUserData = uData;
                    if (this.onConnectedCallback) this.onConnectedCallback(false, uData, 'host', []);
                }
                return;
            }
            if (data.type === 'HANDSHAKE_ACK') {
                this.peerUserData = data.payload && data.payload.userData;
                if (data.payload && data.payload.assignedPeerId) this.assignedPeerId = data.payload.assignedPeerId;
                const roster = (data.payload && Array.isArray(data.payload.peers)) ? data.payload.peers : [];
                this._lobbyPeers = roster;
                if (typeof CoopNetTransport !== 'undefined') CoopNetTransport.openGuestFastChannel(this);
                if (this.onConnectedCallback) this.onConnectedCallback(this.isHost, this.peerUserData, 'host', roster);
                return;
            }
            if (data.type === 'LOBBY_ROSTER') {
                this._lobbyPeers = (data.payload && Array.isArray(data.payload.peers)) ? data.payload.peers : [];
                if (this.onRosterCallback) this.onRosterCallback(this._lobbyPeers, data.payload && data.payload.host);
                return;
            }
            if (data.type === 'PING') {
                if (peerEntry) this.sendTo(peerEntry.id, 'PONG', data.payload);
                else this.send('PONG', data.payload);
                return;
            }
            if (data.type === 'PONG') {
                if (data.payload && data.payload.time) {
                    const sample = Math.round((now - data.payload.time) / 2);
                    if (peerEntry) peerEntry.latency = Math.round((peerEntry.latency * 0.7) + (sample * 0.3));
                    this.latency = Math.round((this.latency * 0.7) + (sample * 0.3));
                }
                return;
            }
            if (this.onMessageCallback) {
                try {
                    this.onMessageCallback(data.type, data.payload, peerEntry ? peerEntry.id : 'host');
                } catch (msgErr) {
                    console.error('[NetworkManager] Error in message handler:', data.type, msgErr);
                }
            }
        });

        activeConn.on('close', () => {
            if (!isCurrent()) return;
            if (peerEntry) this._dropHostPeer(peerEntry, 'Connection closed by peer');
            else this.handleDisconnect('Connection closed by peer', 'host', this.peerUserData, 0);
        });
        activeConn.on('error', (err) => {
            if (!isCurrent()) return;
            console.error('[NetworkManager] Data connection error:', err);
            const reason = err ? (err.message || String(err)) : 'Data connection error';
            if (peerEntry) this._dropHostPeer(peerEntry, reason);
            else this.handleDisconnect(reason, 'host', this.peerUserData, 0);
        });
    }

    _dropHostPeer(peerEntry, reason = 'Disconnected') {
        if (!peerEntry || this.peers.get(peerEntry.id) !== peerEntry) return;
        this.peers.delete(peerEntry.id);
        try { if (peerEntry.fastConn) peerEntry.fastConn.close(); } catch (_) {}
        try { if (peerEntry.conn) peerEntry.conn.close(); } catch (_) {}
        const wasConnected = !!peerEntry.connected;
        this._syncPrimaryPeerAlias();
        if (this.peers.size > 0) {
            this.send('LOBBY_ROSTER', { peers: this.getConnectedPeers(), host: this.localUserData });
            if (wasConnected && this.onDisconnectedCallback) {
                this.onDisconnectedCallback(reason, peerEntry.id, peerEntry.userData, this.peers.size);
            }
        } else {
            this.handleDisconnect(reason, peerEntry.id, peerEntry.userData, 0);
        }
    }

    sendTo(peerId, type, payload = {}, options = null) {
        return this.send(type, payload, { ...(options || {}), to: peerId });
    }

    broadcastExcept(excludePeerId, type, payload = {}, options = null) {
        return this.send(type, payload, { ...(options || {}), exclude: excludePeerId });
    }

    send(type, payload = {}, options = null) {
        if (!this.connected) return false;
        const opts = options || {};
        if (this.isHost) {
            if (opts.to) {
                const p = this.peers.get(opts.to);
                return !!(p && p.connected && CoopNetTransport.sendOnConnPair(p.conn, p.fastConn, type, payload, opts));
            }
            let anySent = false;
            for (const p of this.peers.values()) {
                if (!p || !p.connected || (opts.exclude && p.id === opts.exclude)) continue;
                if (CoopNetTransport.sendOnConnPair(p.conn, p.fastConn, type, payload, opts)) anySent = true;
            }
            return anySent;
        }
        return CoopNetTransport.sendOnConnPair(this.conn, this.fastConn, type, payload, opts);
    }

    startHeartbeat() {
        if (this.pingInterval) clearInterval(this.pingInterval);
        if (this.watchdogInterval) clearInterval(this.watchdogInterval);
        this.pingInterval = setInterval(() => {
            if (this.connected) this.send('PING', { time: performance.now() });
        }, 1500);
        this.watchdogInterval = setInterval(() => {
            if (!this.connected) return;
            const now = performance.now();
            if (this.isHost) {
                for (const p of Array.from(this.peers.values())) {
                    if (!p.connected) continue;
                    const idle = now - p.lastMessageTime;
                    if (idle > 4000 && idle <= 9500) this.sendTo(p.id, 'PING', { time: now });
                    else if (idle > 9500) {
                        console.warn(`[NetworkManager] Peer ${p.id} heartbeat timeout (${Math.round(idle)}ms idle)`);
                        this._dropHostPeer(p, 'Connection timed out');
                    }
                }
                return;
            }
            const idleTime = now - this.lastMessageTime;
            if (idleTime > 4000 && idleTime <= 9500) this.send('PING', { time: now });
            else if (idleTime > 9500) {
                console.warn(`[NetworkManager] Host heartbeat timeout (${Math.round(idleTime)}ms idle)`);
                this.handleDisconnect('Connection timed out', 'host', this.peerUserData, 0);
            }
        }, 1000);
    }

    handleDisconnect(reason = 'Disconnected', peerId = null, leftUserData = null, remaining = 0) {
        const wasConnected = this.connected;
        this.connected = false;
        this.connecting = false;
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = null;
        if (this.watchdogInterval) clearInterval(this.watchdogInterval);
        this.watchdogInterval = null;
        if (wasConnected && this.onDisconnectedCallback) {
            this.onDisconnectedCallback(reason, peerId, leftUserData, remaining);
        }
    }

    disconnectGracefully(reason = 'Host left the match', onDone = null, packetType = 'HOST_QUIT_MATCH', packetPayload = null) {
        if (this.isGracefulDisconnecting) return;
        this.isGracefulDisconnecting = true;
        if (this.connected) {
            try { this.send(packetType, packetPayload || { reason }); } catch (e) {}
        }
        if (this._gracefulTimer) clearTimeout(this._gracefulTimer);
        this._gracefulTimer = setTimeout(() => {
            this._gracefulTimer = null;
            this.disconnect();
            this.isGracefulDisconnecting = false;
            if (typeof onDone === 'function') onDone();
        }, 120);
    }

    disconnect(silent = false) {
        this._hostSessionId++;
        this._joinSessionId++;
        this._onAttemptIceFailed = null;
        if (this._retryTimer) { clearTimeout(this._retryTimer); this._retryTimer = null; }
        if (this._gracefulTimer) { clearTimeout(this._gracefulTimer); this._gracefulTimer = null; }
        this.isGracefulDisconnecting = false;
        this.connecting = false;
        this.isPeerOpen = false;
        if (this._readyResolve) { this._readyResolve(false); this._readyResolve = null; }
        this._readyPromise = null;
        if (this.connectTimeout) { clearTimeout(this.connectTimeout); this.connectTimeout = null; }
        if (silent) this.connected = false;
        this.handleDisconnect('Disconnected locally');
        for (const p of this.peers.values()) {
            try { if (p.fastConn) p.fastConn.close(); } catch (_) {}
            try { if (p.conn) p.conn.close(); } catch (_) {}
        }
        this.peers.clear();
        for (const fc of this._pendingFastConns.values()) { try { fc.close(); } catch (_) {} }
        this._pendingFastConns.clear();
        if (this.fastConn) { try { this.fastConn.close(); } catch (e) {} this.fastConn = null; }
        this._fastConnected = false;
        if (this.conn) { try { this.conn.close(); } catch (e) {} this.conn = null; }
        if (this.peer) { try { this.peer.destroy(); } catch (e) {} this.peer = null; }
        this.connected = false;
        this.roomCode = '';
        this.assignedPeerId = null;
        this.peerUserData = null;
        this._lobbyPeers = [];
    }
}

if (typeof window !== 'undefined') {
    window.NetworkManager = NetworkManager;
    window.networkManager = new NetworkManager();
}
