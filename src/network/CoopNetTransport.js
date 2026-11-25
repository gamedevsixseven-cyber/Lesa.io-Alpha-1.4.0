/**
 * Lesa.io - Co-op WebRTC Transport, ICE Resilience & Dual-Channel Helper
 * Improves mobile-data P2P connectivity with multi-port STUN/ICE pre-gathering,
 * signaling auto-reconnect, automatic cellular retry backoff, and an unordered
 * fast channel for snapshots/state so dropped packets never block combat inputs.
 */

class CoopNetTransport {
    static TURNIX_BROKER_URL = 'https://lesaio-turnix.gamedevsixseven.workers.dev/';
    static _cachedTurnIce = [];
    static _cachedTurnExpiresAt = 0;
    static _refreshPromise = null;

    static DEFAULT_ICE_SERVERS = [
        { urls: 'stun:stun.turnix.io:3478' },
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' }
    ];

    static TRANSIENT_ERRORS = new Set([
        'peer-unavailable',
        'network',
        'socket-error',
        'socket-closed',
        'webrtc',
        'disconnected'
    ]);

    static getIceServers() {
        const list = [];
        if (typeof window !== 'undefined' && Array.isArray(window.LESAIO_ICE_SERVERS)) {
            window.LESAIO_ICE_SERVERS.forEach((s) => {
                if (s && s.urls) list.push(s);
            });
        }
        if (Array.isArray(this._cachedTurnIce) && this._cachedTurnIce.length > 0 && Date.now() < (this._cachedTurnExpiresAt || 0)) {
            this._cachedTurnIce.forEach((s) => {
                if (s && s.urls) list.push({ ...s });
            });
        }
        this.DEFAULT_ICE_SERVERS.forEach((s) => list.push({ ...s }));
        try {
            const raw = (typeof localStorage !== 'undefined') ? localStorage.getItem('lesaio_ice_servers') : null;
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    parsed.forEach((s) => { if (s && s.urls) list.push(s); });
                }
            }
        } catch (_) {}
        return list;
    }

    static async refreshIceServers(force = false, timeoutMs = 2200) {
        const now = Date.now();
        if (!force && this._cachedTurnIce.length > 0 && now < (this._cachedTurnExpiresAt - 120000)) {
            return this._cachedTurnIce;
        }
        if (this._refreshPromise) return this._refreshPromise;
        const url = (typeof window !== 'undefined' && window.LESAIO_TURN_BROKER_URL) || this.TURNIX_BROKER_URL;
        if (!url || typeof fetch !== 'function') return this._cachedTurnIce;

        this._refreshPromise = (async () => {
            const ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
            const timer = ctrl ? setTimeout(() => { try { ctrl.abort(); } catch (_) {} }, timeoutMs) : null;
            try {
                const res = await fetch(url, { method: 'POST', cache: 'no-store', signal: ctrl ? ctrl.signal : undefined });
                if (!res.ok) return this._cachedTurnIce;
                const data = await res.json();
                if (data && Array.isArray(data.iceServers) && data.iceServers.length > 0) {
                    this._cachedTurnIce = data.iceServers.filter(s => s && s.urls);
                    const parsedExp = data.expiresAt ? Date.parse(data.expiresAt) : NaN;
                    this._cachedTurnExpiresAt = Number.isFinite(parsedExp) ? parsedExp : (Date.now() + 45 * 60 * 1000);
                }
            } catch (_) {
                // Keep STUN fallback cleanly if broker is unreachable
            } finally {
                if (timer) clearTimeout(timer);
                this._refreshPromise = null;
            }
            return this._cachedTurnIce;
        })();
        return this._refreshPromise;
    }

    static buildPeerOptions() {
        return {
            debug: 1,
            config: {
                iceServers: this.getIceServers(),
                iceCandidatePoolSize: 10,
                iceTransportPolicy: 'all'
            }
        };
    }

    static isTransientError(errType) {
        if (!errType) return false;
        const clean = String(errType).toLowerCase();
        if (this.TRANSIENT_ERRORS.has(clean)) return true;
        return clean.includes('peer-unavailable') || clean.includes('could not connect to peer') || clean.includes('lost connection');
    }

    static describeError(errType) {
        const clean = String(errType || '').toLowerCase();
        if (clean.includes('peer-unavailable') || clean.includes('could not connect to peer')) {
            return 'Host room not ready yet or offline. Ask host to keep lobby open.';
        }
        if (clean.includes('ice-failed')) {
            return 'Carrier NAT blocked direct P2P. Try Wi-Fi/hotspot or retry.';
        }
        if (clean.includes('network') || clean.includes('socket')) {
            return 'Mobile data signal hiccup — reconnecting...';
        }
        return String(errType || 'Network error');
    }

    static bindPeerLifecycle(nm) {
        if (!nm || !nm.peer) return;
        const peer = nm.peer;
        peer.on('disconnected', () => {
            if (nm.isGracefulDisconnecting || peer.destroyed || nm.peer !== peer) return;
            try {
                if (typeof peer.reconnect === 'function') peer.reconnect();
            } catch (_) {}
        });
    }

    static attachIceRecovery(nm, conn) {
        if (!nm || !conn || conn._iceMonitorBound) return;
        conn._iceMonitorBound = true;

        const bindPc = () => {
            const pc = conn.peerConnection;
            if (!pc || pc._lesaioIceBound) return;
            pc._lesaioIceBound = true;
            pc.addEventListener('iceconnectionstatechange', () => {
                const state = pc.iceConnectionState;
                if (state === 'disconnected' && nm.connected) {
                    // Mobile 4G/Wi-Fi handoff: nudge ICE restart gracefully before watchdog expires
                    try {
                        if (typeof pc.restartIce === 'function') pc.restartIce();
                    } catch (_) {}
                } else if (state === 'failed') {
                    if (!nm.connected && typeof nm._onAttemptIceFailed === 'function') {
                        nm._onAttemptIceFailed();
                    } else if (nm.connected) {
                        try {
                            if (typeof pc.restartIce === 'function') pc.restartIce();
                        } catch (_) {}
                    }
                }
            });
        };

        if (conn.peerConnection) {
            bindPc();
        } else if (typeof conn.on === 'function') {
            conn.on('iceStateChanged', () => bindPc());
        }
    }

    static getDataChannel(conn) {
        if (!conn) return null;
        return conn.dataChannel || conn._dc || null;
    }

    static getBufferedAmount(nm) {
        if (!nm) return 0;
        if (nm.isHost && nm.peers && nm.peers.size > 0) {
            let maxBuf = 0;
            for (const p of nm.peers.values()) {
                const b1 = (this.getDataChannel(p.fastConn) || {}).bufferedAmount || 0;
                const b2 = (this.getDataChannel(p.conn) || {}).bufferedAmount || 0;
                if (b1 > maxBuf) maxBuf = b1;
                if (b2 > maxBuf) maxBuf = b2;
            }
            return maxBuf;
        }
        const fastDc = this.getDataChannel(nm.fastConn);
        const mainDc = this.getDataChannel(nm.conn);
        const b1 = (fastDc && typeof fastDc.bufferedAmount === 'number') ? fastDc.bufferedAmount : 0;
        const b2 = (mainDc && typeof mainDc.bufferedAmount === 'number') ? mainDc.bufferedAmount : 0;
        return Math.max(b1, b2);
    }

    static sendOnConnPair(mainConn, fastConn, type, payload, opts = {}) {
        const useFast = !!(opts.fast && fastConn && fastConn.open);
        const targetConn = useFast ? fastConn : mainConn;
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
            if (useFast && mainConn && mainConn.open) {
                try {
                    const msg = { type, payload };
                    mainConn.send(mainConn.serialization === 'json' ? JSON.stringify(msg) : msg);
                    return true;
                } catch (_) {}
            }
            console.warn('[CoopNetTransport] Failed to send packet:', type, err);
            return false;
        }
    }

    static setupFastChannelHandlers(nm, conn, peerEntry = null) {
        if (!nm || !conn || conn._fastBound) return;
        conn._fastBound = true;
        const targetEntry = peerEntry || (nm.isHost && nm.peers && conn.peer ? nm.peers.get(conn.peer) : null);
        const senderId = targetEntry ? targetEntry.id : (conn.peer || 'host');

        if (targetEntry) {
            targetEntry.fastConn = conn;
            if (nm.conn === targetEntry.conn) nm.fastConn = conn;
        } else {
            nm.fastConn = conn;
        }

        const markOpen = () => {
            if (targetEntry) {
                targetEntry.fastConnected = true;
                if (nm.conn === targetEntry.conn) nm._fastConnected = true;
            } else {
                nm._fastConnected = true;
            }
        };
        conn.on('open', markOpen);
        if (conn.open) markOpen();

        conn.on('data', (raw) => {
            const now = performance.now();
            nm.lastMessageTime = now;
            if (targetEntry) targetEntry.lastMessageTime = now;
            const data = nm._decodePacket(raw);
            if (!data || !data.type) return;
            if (nm.onMessageCallback) {
                try {
                    nm.onMessageCallback(data.type, data.payload, targetEntry ? targetEntry.id : 'host');
                } catch (err) {
                    console.error('[CoopNetTransport] Fast message handler error:', data.type, err);
                }
            }
        });

        const clearFast = () => {
            if (targetEntry && targetEntry.fastConn === conn) {
                targetEntry.fastConn = null;
                targetEntry.fastConnected = false;
                if (nm.fastConn === conn) { nm.fastConn = null; nm._fastConnected = false; }
            } else if (nm.fastConn === conn) {
                nm.fastConn = null;
                nm._fastConnected = false;
            }
        };
        conn.on('close', clearFast);
        conn.on('error', clearFast);
    }

    static openGuestFastChannel(nm) {
        if (!nm || nm.isHost || !nm.peer || nm.peer.destroyed || !nm.connected) return;
        if (nm.fastConn && nm.fastConn.open) return;
        const targetPeerId = nm.normalizeRoomId(nm.roomCode);
        try {
            const fc = nm.peer.connect(targetPeerId, {
                reliable: false,
                serialization: 'binary',
                metadata: { channel: 'fast' }
            });
            this.setupFastChannelHandlers(nm, fc);
        } catch (_) {}
    }

    static ensureVisibilityReconnect(nm) {
        if (typeof document === 'undefined' || !nm || nm._visHookBound) return;
        nm._visHookBound = true;
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState !== 'visible') return;
            const peer = nm.peer;
            if (!peer || peer.destroyed || nm.isGracefulDisconnecting) return;
            if (peer.disconnected && typeof peer.reconnect === 'function') {
                try { peer.reconnect(); } catch (_) {}
            }
        });
    }
}

if (typeof window !== 'undefined') {
    window.CoopNetTransport = CoopNetTransport;
    if (typeof fetch === 'function') {
        setTimeout(() => { CoopNetTransport.refreshIceServers().catch(() => {}); }, 800);
    }
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CoopNetTransport };
}
