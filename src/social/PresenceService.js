/**
 * Lesa.io - Firebase Realtime Database (RTDB) Presence Service
 * Moves high-frequency online / last-online / co-op room presence out of Firestore
 * onto RTDB with native server-side onDisconnect() to save Firestore writes & reads.
 */

class PresenceService {
    constructor() {
        this.cache = {};
        this._uid = '';
        this._status = 'In Lobby';
        this._roomCode = null;
        this._connRef = null;
        this._connHandler = null;
        this._watches = new Map();
        this._listeners = new Set();
        this._disabled = false;
        this._lastPresencePush = 0;
    }

    getRtdb() {
        if (this._disabled) return null;
        if (typeof window !== 'undefined' && window.cloudSave && window.cloudSave.rtdb) {
            return window.cloudSave.rtdb;
        }
        if (typeof firebase !== 'undefined' && typeof firebase.database === 'function') {
            try { return firebase.database(); } catch (_) { return null; }
        }
        return null;
    }

    isReady() {
        return Boolean(this.getRtdb() && !this._disabled);
    }

    _serverTs() {
        return (typeof firebase !== 'undefined' && firebase.database && firebase.database.ServerValue)
            ? firebase.database.ServerValue.TIMESTAMP
            : Date.now();
    }

    _handleRtdbErr(err) {
        const msg = err && (err.code || err.message || '');
        if (/permission_denied|PERMISSION_DENIED/i.test(String(msg))) {
            this._disabled = true;
            this.stop();
        }
    }

    onChange(cb) {
        if (typeof cb === 'function') this._listeners.add(cb);
    }

    _notify(uid) {
        this._listeners.forEach((cb) => {
            try { cb(uid, this.cache[uid] || null); } catch (_) {}
        });
    }

    start(uid, statusText = 'In Lobby', roomCode = null) {
        this._status = statusText || 'In Lobby';
        this._roomCode = roomCode || null;
        const rtdb = this.getRtdb();
        if (!rtdb || !uid || (typeof PlayerIdentity !== 'undefined' && PlayerIdentity.isAwaitingInitialName() && !(typeof window !== 'undefined' && window.cloudSave && window.cloudSave.currentUser))) return false;

        if (this._uid === uid && this._connRef) {
            this.setOnline(uid, this._status, this._roomCode);
            return true;
        }

        if (this._uid && this._uid !== uid) {
            this.markOffline(this._uid);
        }
        this._detachConn();
        this._uid = uid;

        try {
            const infoRef = rtdb.ref('.info/connected');
            this._connRef = infoRef;
            this._connHandler = (snap) => {
                if (!snap || snap.val() !== true || !this._uid) return;
                const userRef = rtdb.ref(`presence/${this._uid}`);
                const offPayload = {
                    online: false, lastSeenAt: this._serverTs(),
                    currentStatus: 'Offline', coopRoomCode: null
                };
                userRef.onDisconnect().set(offPayload).then(() => {
                    return this.setOnline(this._uid, this._status, this._roomCode);
                }).catch((e) => this._handleRtdbErr(e));
            };
            infoRef.on('value', this._connHandler);
            this.setOnline(uid, this._status, this._roomCode);
            return true;
        } catch (err) {
            this._handleRtdbErr(err);
            return false;
        }
    }

    setOnline(uid, statusText = this._status, roomCode = this._roomCode) {
        const targetUid = uid || this._uid;
        if (!targetUid) return false;
        this._status = statusText || 'In Lobby';
        this._roomCode = roomCode || null;
        const rtdb = this.getRtdb();
        if (!rtdb) return false;

        const now = Date.now();
        this._lastPresencePush = now;
        this.cache[targetUid] = {
            online: true, lastSeenAt: now,
            currentStatus: this._status, coopRoomCode: this._roomCode
        };
        try {
            rtdb.ref(`presence/${targetUid}`).set({
                online: true, lastSeenAt: this._serverTs(),
                currentStatus: this._status, coopRoomCode: this._roomCode
            }).catch((e) => this._handleRtdbErr(e));
            return true;
        } catch (err) {
            this._handleRtdbErr(err);
            return false;
        }
    }

    setStatus(uid, statusText = 'In Lobby', roomCode = null) {
        return this.start(uid || this._uid, statusText, roomCode);
    }

    markOffline(uid = this._uid) {
        const targetUid = uid || this._uid;
        const rtdb = this.getRtdb();
        if (!rtdb || !targetUid) return false;
        const now = Date.now();
        this.cache[targetUid] = {
            online: false, lastSeenAt: now,
            currentStatus: 'Offline', coopRoomCode: null
        };
        try {
            rtdb.ref(`presence/${targetUid}`).set({
                online: false, lastSeenAt: this._serverTs(),
                currentStatus: 'Offline', coopRoomCode: null
            }).catch((e) => this._handleRtdbErr(e));
            return true;
        } catch (_) {
            return false;
        }
    }

    watchUids(uids = []) {
        const rtdb = this.getRtdb();
        const wanted = new Set((Array.isArray(uids) ? uids : []).filter(Boolean));
        for (const [uid, entry] of this._watches.entries()) {
            if (!wanted.has(uid) || !rtdb) {
                try { entry.ref.off('value', entry.fn); } catch (_) {}
                this._watches.delete(uid);
            }
        }
        if (!rtdb) return;
        wanted.forEach((uid) => {
            if (this._watches.has(uid)) return;
            try {
                const ref = rtdb.ref(`presence/${uid}`);
                const fn = (snap) => {
                    const val = snap ? snap.val() : null;
                    if (val && typeof val === 'object') {
                        this.cache[uid] = val;
                    } else {
                        delete this.cache[uid];
                    }
                    this._notify(uid);
                };
                ref.on('value', fn, (e) => this._handleRtdbErr(e));
                this._watches.set(uid, { ref, fn });
            } catch (_) {}
        });
    }

    async fetchOnce(uids = []) {
        const rtdb = this.getRtdb();
        const list = (Array.isArray(uids) ? uids : []).filter(Boolean);
        if (!rtdb || list.length === 0) return {};
        const tasks = list.map((uid) => Promise.race([
            rtdb.ref(`presence/${uid}`).once('value').then((snap) => {
                const val = snap ? snap.val() : null;
                if (val && typeof val === 'object') this.cache[uid] = val;
            }).catch((e) => this._handleRtdbErr(e)),
            new Promise((res) => setTimeout(res, 1200))
        ]));
        await Promise.all(tasks);
        return this.cache;
    }

    getCached(uid) {
        return uid ? (this.cache[uid] || null) : null;
    }

    static resolve(uid, docData = {}, cache = null) {
        const r = cache && uid ? cache[uid] : null;
        const updMs = docData.lastUpdated
            ? (typeof docData.lastUpdated.toMillis === 'function' ? docData.lastUpdated.toMillis() : (Number(docData.lastUpdated.seconds) * 1000 || 0))
            : 0;
        const docLastSeen = Math.max(Number(docData.lastSeenAt) || 0, updMs, Number(docData.timestamp) || 0);

        if (r && typeof r === 'object') {
            const rtdbLastSeen = Number(r.lastSeenAt) || 0;
            const lastSeenAt = Math.max(rtdbLastSeen, docLastSeen);
            const isOnline = Boolean(r.online === true);
            return {
                isOnline,
                lastSeenAt,
                currentStatus: isOnline ? (r.currentStatus || docData.currentStatus || 'In Lobby') : 'Offline',
                coopRoomCode: isOnline ? (r.coopRoomCode || null) : null
            };
        }

        const isOnline = Boolean(docData.online && docLastSeen && (Date.now() - docLastSeen < 120000));
        return {
            isOnline,
            lastSeenAt: docLastSeen,
            currentStatus: isOnline ? (docData.currentStatus || 'In Lobby') : 'Offline',
            coopRoomCode: isOnline ? (docData.coopRoomCode || null) : null
        };
    }

    _detachConn() {
        if (this._connRef && this._connHandler) {
            try { this._connRef.off('value', this._connHandler); } catch (_) {}
        }
        this._connRef = null;
        this._connHandler = null;
    }

    stop() {
        this._detachConn();
        for (const entry of this._watches.values()) {
            try { entry.ref.off('value', entry.fn); } catch (_) {}
        }
        this._watches.clear();
    }
}

if (typeof window !== 'undefined') {
    window.PresenceService = PresenceService;
    if (!window.presenceService) window.presenceService = new PresenceService();
}
if (typeof module !== 'undefined' && module.exports) module.exports = { PresenceService };
