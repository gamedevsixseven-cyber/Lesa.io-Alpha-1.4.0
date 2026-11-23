/**
 * Lesa.io - Co-op WebRTC Transport, ICE Resilience & Dual-Channel Helper
 * Improves mobile-data P2P connectivity with multi-port STUN/ICE pre-gathering,
 * signaling auto-reconnect, automatic cellular retry backoff, and an unordered
 * fast channel for snapshots/state so dropped packets never block combat inputs.
 */

class CoopNetTransport {
    static DEFAULT_ICE_SERVERS = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
        { urls: 'stun:openrelay.metered.ca:80' },
        {
            urls: [
                'turn:openrelay.metered.ca:80',
                'turn:openrelay.metered.ca:80?transport=tcp',
                'turn:openrelay.metered.ca:443',
                'turn:openrelay.metered.ca:443?transport=tcp',
                'turns:openrelay.metered.ca:443',
                'turns:openrelay.metered.ca:443?transport=tcp'
            ],
            username: 'openrelayproject',
            credential: 'openrelayproject'
        }
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
        const list = this.DEFAULT_ICE_SERVERS.map((s) => ({ ...s }));
        if (typeof window !== 'undefined' && Array.isArray(window.LESAIO_ICE_SERVERS)) {
            window.LESAIO_ICE_SERVERS.forEach((s) => {
                if (s && s.urls) list.push(s);
            });
        }
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
        const fastDc = this.getDataChannel(nm.fastConn);
        const mainDc = this.getDataChannel(nm.conn);
        const b1 = (fastDc && typeof fastDc.bufferedAmount === 'number') ? fastDc.bufferedAmount : 0;
        const b2 = (mainDc && typeof mainDc.bufferedAmount === 'number') ? mainDc.bufferedAmount : 0;
        return Math.max(b1, b2);
    }

    static setupFastChannelHandlers(nm, conn) {
        if (!nm || !conn || conn._fastBound) return;
        conn._fastBound = true;
        nm.fastConn = conn;

        const markOpen = () => {
            nm._fastConnected = true;
        };
        conn.on('open', markOpen);
        if (conn.open) markOpen();

        conn.on('data', (raw) => {
            nm.lastMessageTime = performance.now();
            const data = nm._decodePacket(raw);
            if (!data || !data.type) return;
            if (nm.onMessageCallback) {
                try {
                    nm.onMessageCallback(data.type, data.payload);
                } catch (err) {
                    console.error('[CoopNetTransport] Fast message handler error:', data.type, err);
                }
            }
        });

        conn.on('close', () => {
            if (nm.fastConn === conn) {
                nm.fastConn = null;
                nm._fastConnected = false;
            }
        });
        conn.on('error', () => {
            if (nm.fastConn === conn) {
                nm.fastConn = null;
                nm._fastConnected = false;
            }
        });
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
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CoopNetTransport };
}
