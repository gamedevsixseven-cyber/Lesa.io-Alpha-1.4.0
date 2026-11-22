/**
 * Lesa.io - Online Player ID, Friends & Co-op Invite Service
 * Syncs shareable Player Tags (#ABCDEF), enables searching players by Name or Online ID,
 * manages mutual friendships & incoming requests, and coordinates Co-op game invites via Firestore.
 */

class FriendService {
    constructor() {
        this.friends = [];           // Accepted friendships enriched with latest player snapshot
        this.incomingRequests = [];  // Pending requests sent by other players
        this.outgoingRequests = [];  // Pending requests sent by current player
        this.incomingInvites = [];   // Live Co-op room invites from friends
        this.friendProfiles = {};    // Cache of uid -> public player summary

        this._unsubFriendships = null;
        this._unsubInvites = null;
        this._presenceTimer = null;
        this._lastPresenceSync = 0;
        this._currentStatus = 'In Lobby';
        this._activeRoomCode = null;
        this._seenInviteIds = new Set();
        this._seenRequestIds = new Set();
        this._friendshipsErrored = false;
        this._initialized = false;
        this.lastError = null;
    }

    _describeDbError(err) {
        const code = err && err.code ? String(err.code) : '';
        if (code === 'permission-denied') {
            return 'Firestore permission denied — update Firestore Rules in Firebase Console.';
        }
        if (code === 'unavailable') {
            return 'Cloud unavailable — check your internet connection.';
        }
        return (err && err.message) ? err.message : 'Cloud request failed.';
    }

    getDb() {
        return (typeof window !== 'undefined' && window.cloudSave && window.cloudSave.isInitialized)
            ? window.cloudSave.db
            : null;
    }

    getMyUid() {
        if (typeof window !== 'undefined' && window.cloudSave && typeof window.cloudSave.getEffectivePlayerUid === 'function') {
            return window.cloudSave.getEffectivePlayerUid();
        }
        if (typeof PlayerIdentity !== 'undefined') {
            return PlayerIdentity.getEffectiveUid(null, null);
        }
        return localStorage.getItem('lesaio_player_uid') || '';
    }

    getMyTag() {
        const uid = this.getMyUid();
        if (typeof PlayerIdentity !== 'undefined' && typeof PlayerIdentity.getOnlineTag === 'function') {
            return PlayerIdentity.getOnlineTag(uid);
        }
        return '#GUEST0';
    }

    static _maxNum(...vals) {
        let best = 0;
        for (let i = 0; i < vals.length; i++) {
            const n = Number(vals[i]);
            if (Number.isFinite(n) && n > best) best = n;
        }
        return best;
    }

    getMySummary() {
        const gs = (typeof window !== 'undefined' && window.GameState) ? window.GameState : null;
        const p = (gs && gs.player) ? gs.player : {};
        const stats = p.stats || {};
        const name = p.name || localStorage.getItem('lesaio_player_name') || 'Hero';
        const uid = this.getMyUid();
        const tag = this.getMyTag();
        const tagClean = (typeof PlayerIdentity !== 'undefined' && PlayerIdentity.normalizeTag)
            ? PlayerIdentity.normalizeTag(tag) : tag.replace(/[^A-Z0-9]/g, '').toUpperCase();
        const rawMaxWave = FriendService._maxNum(1, stats.maxWave, parseInt(localStorage.getItem('lesaio_max_wave') || '1', 10));
        const featSnap = (typeof PerkProgression !== 'undefined' && typeof PerkProgression.getFeatSnapshot === 'function')
            ? PerkProgression.getFeatSnapshot(gs) : null;
        const endlessMaxWave = FriendService._maxNum(p.combatFeats && p.combatFeats.endlessMaxWave, featSnap && featSnap.endlessMaxWave, rawMaxWave > 20 ? rawMaxWave : 0);

        return {
            uid, tag, tagClean, name, nameLower: name.trim().toLowerCase(),
            level: p.accountLevel || parseInt(localStorage.getItem('lesaio_account_level') || '1', 10) || 1,
            selectedHero: p.selectedHero || localStorage.getItem('lesaio_selected_hero') || 'psanas',
            highScore: FriendService._maxNum(stats.highScore, parseInt(localStorage.getItem('lesaio_highscore') || '0', 10)),
            maxWave: rawMaxWave,
            totalKills: FriendService._maxNum(stats.totalKills, parseInt(localStorage.getItem('lesaio_total_kills') || '0', 10)),
            endlessMaxWave,
            olympusMaxFloor: FriendService._maxNum(p.combatFeats && p.combatFeats.olympusMaxFloor, featSnap && featSnap.olympusMaxFloor),
            cosmetics: typeof CosmeticManager !== 'undefined' ? CosmeticManager.getPublicSummary() : {}
        };
    }

    start() {
        if (this._initialized) return;
        this._initialized = true;

        this.attachListeners();
        this.syncMyProfile(true);

        // Heartbeat presence & fallback request poll every 45 seconds
        this._presenceTimer = setInterval(() => {
            this.syncMyProfile(false);
            this.pollFriendships();
        }, 45000);

        if (typeof window !== 'undefined') {
            const markOffline = () => this.markOfflineBeacon();
            window.addEventListener('pagehide', markOffline);
            window.addEventListener('beforeunload', markOffline);
        }
    }

    onAuthChanged() {
        this._seenInviteIds.clear();
        this._seenRequestIds.clear();
        this._friendshipsErrored = false;
        this.attachListeners();
        this.syncMyProfile(true);
        this.emitUpdate();
    }

    setPresenceStatus(statusText = 'In Lobby', roomCode = null) {
        this._currentStatus = statusText;
        this._activeRoomCode = roomCode;
        this.syncMyProfile(true);
    }

    async syncMyProfile(force = false) {
        const db = this.getDb();
        const me = this.getMySummary();
        if (!db || !me.uid) return false;

        const cs = (typeof window !== 'undefined') ? window.cloudSave : null;
        if (cs && (cs.isHydratingAuth || cs.isSyncingFromCloud)) return false;

        const now = Date.now();
        if (!force && now - this._lastPresenceSync < 15000) return true;
        this._lastPresenceSync = now;

        // Before initial cloud hydration completes, push ONLY presence fields so unhydrated Lv.1 defaults never clobber cloud progress
        const statsReady = !cs || cs.hasCompletedInitialSync || (typeof SaveMigration !== 'undefined' && SaveMigration.hasEstablishedProgress());
        const baseDoc = {
            uid: me.uid, online: true,
            currentStatus: this._currentStatus || 'In Lobby',
            coopRoomCode: this._activeRoomCode || null, lastSeenAt: now
        };
        if (statsReady) {
            const c = (cs && cs.lastCloudData && typeof cs.lastCloudData === 'object') ? cs.lastCloudData : null;
            const wiped = c && typeof SaveMigration !== 'undefined' && SaveMigration.wasWipedByDev(c, now);
            const cp = (!wiped && c && c.player) ? c.player : (!wiped ? c : null);
            const csStats = (cp && cp.stats) ? cp.stats : {};
            const cSocial = (!wiped && c && c.socialStats) ? c.socialStats : {};
            const lvl = FriendService._maxNum(1, me.level, !wiped && cp && (cp.accountLevel || cp.level), !wiped && c && (c.accountLevel || c.level));
            const hs = FriendService._maxNum(0, me.highScore, csStats.highScore, cSocial.highScore, !wiped && c && (c.lbHighScore || c.highScore));
            const mw = FriendService._maxNum(1, me.maxWave, csStats.maxWave, cSocial.maxWave, !wiped && c && c.maxWave);
            const ew = FriendService._maxNum(0, me.endlessMaxWave, cSocial.endlessMaxWave, !wiped && c && c.lbEndlessWave);
            const tk = FriendService._maxNum(0, me.totalKills, csStats.totalKills, cSocial.totalKills, !wiped && c && c.lbTotalKills);
            Object.assign(baseDoc, {
                friendTag: me.tag, friendTagClean: me.tagClean,
                playerName: me.name, playerNameLower: me.nameLower,
                accountLevel: lvl, level: lvl, selectedHero: me.selectedHero,
                socialStats: { highScore: hs, maxWave: mw, totalKills: tk, endlessMaxWave: ew, olympusMaxFloor: me.olympusMaxFloor },
                cosmetics: me.cosmetics, lbHighScore: hs,
                lbEndlessWave: Math.max(ew || 0, mw || 1), lbTotalKills: tk
            });
        }

        try {
            await db.collection('players').doc(me.uid).set(baseDoc, { merge: true });
            this.lastError = null;
            return true;
        } catch (err) {
            this.lastError = this._describeDbError(err);
            return false;
        }
    }

    markOfflineBeacon() {
        if (typeof window !== 'undefined' && window._lesaioSuppressUnloadSave) return;
        const db = this.getDb();
        const uid = this.getMyUid();
        if (!db || !uid) return;
        try {
            db.collection('players').doc(uid).set({
                online: false,
                coopRoomCode: null,
                lastSeenAt: Date.now()
            }, { merge: true }).catch(() => {});
        } catch (_) {}
    }

    attachListeners() {
        const db = this.getDb();
        const myUid = this.getMyUid();

        if (this._unsubFriendships) { try { this._unsubFriendships(); } catch (_) {} this._unsubFriendships = null; }
        if (this._unsubInvites) { try { this._unsubInvites(); } catch (_) {} this._unsubInvites = null; }

        if (!db || !myUid) return;

        // 1. Real-time friendships & pending requests listener
        try {
            this._unsubFriendships = db.collection('friendships')
                .where('users', 'array-contains', myUid)
                .onSnapshot((snap) => {
                    this._friendshipsErrored = false;
                    this._applyFriendshipsSnap(snap, myUid);
                }, (err) => {
                    this._friendshipsErrored = true;
                    this.lastError = this._describeDbError(err);
                    console.warn('[FriendService] Friendship listener notice:', err && err.message ? err.message : err);
                });
        } catch (err) {
            this._friendshipsErrored = true;
            console.warn('[FriendService] Failed attaching friendship listener:', err);
        }

        // 2. Real-time Co-op match invites listener
        try {
            this._unsubInvites = db.collection('friend_invites').where('toUid', '==', myUid).onSnapshot((snap) => {
                const now = Date.now(), invites = [];
                let newestUnseen = null;
                snap.forEach((doc) => {
                    const d = doc.data();
                    if (!d || !d.roomCode || (d.expiresAt && d.expiresAt < now)) return;
                    const inv = { id: doc.id, ...d };
                    invites.push(inv);
                    if (!this._seenInviteIds.has(doc.id)) { this._seenInviteIds.add(doc.id); newestUnseen = inv; }
                });
                invites.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                this.incomingInvites = invites;
                this.emitUpdate();
                if (newestUnseen && typeof window !== 'undefined' && window.EventBus) window.EventBus.emit('coopInviteReceived', newestUnseen);
            }, () => {});
        } catch (_) {}
    }

    _applyFriendshipsSnap(snap, myUid) {
        const accepted = [], incoming = [], outgoing = [], uidsToRefresh = [], activeReqKeys = new Set();
        let newestUnseenReq = null;
        snap.forEach((doc) => {
            const d = doc.data();
            if (!d || !Array.isArray(d.users)) return;
            const otherUid = d.users.find(u => u !== myUid) || myUid;
            const c = (d.profiles && d.profiles[otherUid]) || {};
            const tag = c.tag || (typeof PlayerIdentity !== 'undefined' ? PlayerIdentity.getOnlineTag(otherUid) : '#HERO00');
            const entry = { id: doc.id, otherUid, status: d.status, requestedBy: d.requestedBy, createdAt: d.createdAt || 0, updatedAt: d.updatedAt || 0,
                profile: { uid: otherUid, name: c.name || 'Hero', tag, hero: c.hero || 'psanas', level: c.level || 1 } };
            if (d.status === 'accepted') { accepted.push(entry); uidsToRefresh.push(otherUid); }
            else if (d.status === 'pending') {
                if (d.requestedBy === myUid) outgoing.push(entry);
                else {
                    incoming.push(entry);
                    if (!this.friendProfiles[otherUid]) uidsToRefresh.push(otherUid);
                    const reqKey = `${doc.id}:${entry.updatedAt || entry.createdAt}`;
                    activeReqKeys.add(reqKey);
                    if (!this._seenRequestIds.has(reqKey)) {
                        this._seenRequestIds.add(reqKey);
                        if (!newestUnseenReq || (entry.updatedAt || entry.createdAt) >= (newestUnseenReq.updatedAt || newestUnseenReq.createdAt)) newestUnseenReq = entry;
                    }
                }
            }
        });
        for (const k of [...this._seenRequestIds]) if (!activeReqKeys.has(k)) this._seenRequestIds.delete(k);
        this.friends = accepted; this.incomingRequests = incoming; this.outgoingRequests = outgoing;
        this.emitUpdate();
        if (uidsToRefresh.length > 0) this.refreshFriendStatuses(uidsToRefresh);
        if (newestUnseenReq && typeof window !== 'undefined' && window.EventBus) window.EventBus.emit('friendRequestReceived', newestUnseenReq);
    }

    async pollFriendships() {
        const db = this.getDb();
        const myUid = this.getMyUid();
        if (!db || !myUid) return;
        if (this._friendshipsErrored || !this._unsubFriendships) this.attachListeners();
        try {
            const snap = await db.collection('friendships').where('users', 'array-contains', myUid).get();
            this._friendshipsErrored = false;
            this._applyFriendshipsSnap(snap, myUid);
        } catch (err) {
            this.lastError = this._describeDbError(err);
        }
    }

    async refreshFriendStatuses(uids = null) {
        const db = this.getDb();
        if (!db) return;
        const list = uids || this.friends.map(f => f.otherUid);
        if (!list.length) return;

        try {
            const docs = await Promise.all(list.map(uid => db.collection('players').doc(uid).get().catch(() => null)));
            docs.forEach((doc) => {
                if (doc && doc.exists) {
                    const data = doc.data() || {};
                    this.friendProfiles[doc.id] = this._formatPlayerDoc(doc.id, data);
                }
            });
            this.emitUpdate();
        } catch (_) {}
    }

    _formatPlayerDoc(uid, data) {
        const p = data.player || {};
        const social = data.socialStats || {};
        const pStats = p.stats || {};
        const rStats = data.stats || {};
        const pFeats = p.combatFeats || {};
        const cosRaw = data.cosmetics || {};
        const name = data.playerName || p.name || 'Hero';
        const tag = data.friendTag || (typeof PlayerIdentity !== 'undefined' ? PlayerIdentity.getOnlineTag(uid) : '#HERO00');
        const level = parseInt(data.level || data.accountLevel || p.accountLevel || 1, 10) || 1;
        const hero = data.selectedHero || p.selectedHero || 'psanas';
        const lastSeenAt = data.lastSeenAt || 0;
        const isOnline = Boolean(data.online && lastSeenAt && (Date.now() - lastSeenAt < 120000));
        const maxWave = FriendService._maxNum(1, social.maxWave, pStats.maxWave, rStats.maxWave, data.maxWave);
        const endlessMaxWave = FriendService._maxNum(1, social.endlessMaxWave, pFeats.endlessMaxWave, cosRaw.endlessMaxWave, data.lbEndlessWave, maxWave);

        return {
            uid, name, tag, tagClean: (data.friendTagClean || tag.replace(/[^A-Z0-9]/g, '')).toUpperCase(),
            level, hero, isOnline, lastSeenAt,
            currentStatus: isOnline ? (data.currentStatus || 'In Lobby') : 'Offline',
            coopRoomCode: isOnline ? (data.coopRoomCode || null) : null,
            highScore: FriendService._maxNum(social.highScore, pStats.highScore, rStats.highScore, data.highScore, data.lbHighScore),
            maxWave,
            totalKills: FriendService._maxNum(social.totalKills, pStats.totalKills, rStats.totalKills, data.totalKills, data.lbTotalKills),
            endlessMaxWave,
            olympusMaxFloor: FriendService._maxNum(social.olympusMaxFloor, pFeats.olympusMaxFloor, cosRaw.olympusMaxFloor),
            cosmetics: typeof CosmeticManager !== 'undefined' ? CosmeticManager.extractPublicCosmetics(data) : {}
        };
    }

    getRelationState(otherUid) {
        if (otherUid === this.getMyUid()) return { state: 'self' };
        const acc = this.friends.find(f => f.otherUid === otherUid);
        if (acc) return { state: 'accepted', id: acc.id };
        const inc = this.incomingRequests.find(f => f.otherUid === otherUid);
        if (inc) return { state: 'pending_incoming', id: inc.id };
        const out = this.outgoingRequests.find(f => f.otherUid === otherUid);
        if (out) return { state: 'pending_outgoing', id: out.id };
        return { state: 'none' };
    }

    async fetchDiscoverablePlayers(maxCount = 8) {
        const db = this.getDb();
        if (!db) return { ok: false, error: 'Offline mode: Connect to internet/cloud to find friends.', results: [] };
        const myUid = this.getMyUid();
        try {
            const snap = await db.collection('players').orderBy('lastSeenAt', 'desc').limit(maxCount + 3).get();
            const list = [];
            snap.forEach((doc) => {
                if (!doc.exists || doc.id === myUid) return;
                const entry = this._formatPlayerDoc(doc.id, doc.data() || {});
                list.push({ ...entry, relation: this.getRelationState(entry.uid) });
            });
            return { ok: true, results: list.slice(0, maxCount) };
        } catch (err) {
            return { ok: false, error: this._describeDbError(err), results: [] };
        }
    }

    /**
     * Search players across Firestore by either Online ID (#XXXXXX) or Player Name.
     */
    async searchPlayers(rawQuery) {
        const db = this.getDb();
        if (!db) {
            return { ok: false, error: 'Offline mode: Connect to internet/cloud to find friends.', results: [] };
        }

        const q = (rawQuery || '').trim();
        if (q.length < 2) {
            return { ok: false, error: 'Type at least 2 characters (Name or #OnlineID).', results: [] };
        }

        await this.syncMyProfile(false);

        const myUid = this.getMyUid();
        const cleanTag = (typeof PlayerIdentity !== 'undefined' && PlayerIdentity.normalizeTag)
            ? PlayerIdentity.normalizeTag(q)
            : q.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const lowerName = q.replace(/^#/, '').trim().toLowerCase();

        const candidates = new Map();
        const collect = (snap) => {
            if (!snap || snap.empty) return;
            snap.forEach((doc) => {
                if (!doc.exists || doc.id === myUid) return;
                if (!candidates.has(doc.id)) {
                    candidates.set(doc.id, this._formatPlayerDoc(doc.id, doc.data() || {}));
                }
            });
        };

        try {
            const queries = [];

            // 1. Search by Online ID (exact friendTagClean match OR direct uid lookup)
            if (cleanTag.length >= 4 && cleanTag.length <= 10) {
                queries.push(db.collection('players').where('friendTagClean', '==', cleanTag).limit(6).get());
                queries.push(db.collection('players').where('friendTag', '==', `#${cleanTag}`).limit(6).get());
            }
            if (q.length >= 12 && !q.includes(' ')) {
                queries.push(db.collection('players').doc(q).get().then(doc => {
                    if (doc.exists && doc.id !== myUid && !candidates.has(doc.id)) {
                        candidates.set(doc.id, this._formatPlayerDoc(doc.id, doc.data() || {}));
                    }
                }).catch(() => {}));
            }

            // 2. Search by Name prefix (case-insensitive) + legacy exact/title-case name fallbacks
            if (!q.startsWith('#') && lowerName.length >= 2) {
                queries.push(
                    db.collection('players')
                        .where('playerNameLower', '>=', lowerName)
                        .where('playerNameLower', '<=', lowerName + '\uf8ff')
                        .limit(10)
                        .get()
                );
                const titleName = lowerName.charAt(0).toUpperCase() + lowerName.slice(1);
                const variants = Array.from(new Set([q, lowerName, titleName]));
                variants.forEach((v) => {
                    queries.push(db.collection('players').where('playerName', '==', v).limit(5).get());
                });
                queries.push(db.collection('players').where('player.name', '==', q).limit(5).get());
            }

            const results = await Promise.allSettled(queries);
            results.forEach((res) => {
                if (res.status === 'fulfilled' && res.value && typeof res.value.forEach === 'function') {
                    collect(res.value);
                }
            });

            if (candidates.size === 0 && results.length > 0 && results.every(r => r.status === 'rejected')) {
                const firstErr = results[0].reason;
                return { ok: false, error: this._describeDbError(firstErr), results: [] };
            }

            const list = Array.from(candidates.values()).map((entry) => ({
                ...entry,
                relation: this.getRelationState(entry.uid)
            }));

            // Sort exact tag matches & online players first
            list.sort((a, b) => {
                const aExact = (a.tagClean === cleanTag || a.name.toLowerCase() === lowerName) ? 1 : 0;
                const bExact = (b.tagClean === cleanTag || b.name.toLowerCase() === lowerName) ? 1 : 0;
                if (aExact !== bExact) return bExact - aExact;
                return (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0);
            });

            return { ok: true, results: list };
        } catch (err) {
            console.warn('[FriendService] Search warning:', err);
            return { ok: false, error: 'Search unavailable right now. Check connection.', results: [] };
        }
    }

    getRelationshipDocId(uidA, uidB) {
        return [uidA, uidB].sort().join('__');
    }

    async sendFriendRequest(targetProfile) {
        const db = this.getDb(), me = this.getMySummary();
        if (!db || !me.uid || !targetProfile || !targetProfile.uid) return { ok: false, message: 'Cloud unavailable.' };
        if (targetProfile.uid === me.uid) return { ok: false, message: 'You cannot add yourself!' };

        const relId = this.getRelationshipDocId(me.uid, targetProfile.uid);
        const docRef = db.collection('friendships').doc(relId);

        try {
            const snap = await docRef.get();
            if (snap.exists) {
                const existing = snap.data() || {};
                if (existing.status === 'accepted') return { ok: true, status: 'accepted', message: 'Already friends!' };
                if (existing.status === 'pending' && existing.requestedBy !== me.uid) {
                    await this.acceptFriendRequest(relId);
                    return { ok: true, status: 'accepted', message: `Accepted ${targetProfile.name}!` };
                }
                return { ok: true, status: 'pending_outgoing', message: 'Friend request already sent!' };
            }

            const now = Date.now();
            const targetObj = { name: targetProfile.name, tag: targetProfile.tag, hero: targetProfile.hero, level: targetProfile.level };
            await docRef.set({
                users: [me.uid, targetProfile.uid].sort(), status: 'pending', requestedBy: me.uid,
                profiles: { [me.uid]: { name: me.name, tag: me.tag, hero: me.selectedHero, level: me.level }, [targetProfile.uid]: targetObj },
                createdAt: now, updatedAt: now
            });
            if (!this.outgoingRequests.some(r => r.id === relId)) {
                this.outgoingRequests.push({ id: relId, otherUid: targetProfile.uid, status: 'pending', requestedBy: me.uid, createdAt: now, updatedAt: now, profile: { uid: targetProfile.uid, ...targetObj } });
                this.emitUpdate();
            }
            return { ok: true, status: 'pending_outgoing', message: `Friend request sent to ${targetProfile.name}!` };
        } catch (err) {
            return { ok: false, message: this._describeDbError(err) };
        }
    }

    async acceptFriendRequest(relId) {
        const db = this.getDb(), me = this.getMySummary();
        if (!db || !relId) return false;
        try {
            const now = Date.now();
            await db.collection('friendships').doc(relId).update({
                status: 'accepted', acceptedAt: now, updatedAt: now,
                [`profiles.${me.uid}`]: { name: me.name, tag: me.tag, hero: me.selectedHero, level: me.level }
            });
            const req = this.incomingRequests.find(r => r.id === relId);
            if (req) {
                this.incomingRequests = this.incomingRequests.filter(r => r.id !== relId);
                if (!this.friends.some(f => f.id === relId)) this.friends.push({ ...req, status: 'accepted' });
                this.emitUpdate();
            }
            return true;
        } catch (err) {
            this.lastError = this._describeDbError(err);
            return false;
        }
    }

    async removeOrDeclineFriendship(relId) {
        const db = this.getDb();
        if (!db || !relId) return false;
        try {
            await db.collection('friendships').doc(relId).delete();
            this.friends = this.friends.filter(f => f.id !== relId);
            this.incomingRequests = this.incomingRequests.filter(r => r.id !== relId);
            this.outgoingRequests = this.outgoingRequests.filter(r => r.id !== relId);
            this.emitUpdate();
            return true;
        } catch (err) {
            this.lastError = this._describeDbError(err);
            return false;
        }
    }

    async sendCoopInvite(targetUid, roomCode, gameMode = 'story') {
        const db = this.getDb();
        const me = this.getMySummary();
        if (!db || !me.uid || !targetUid || !roomCode) return false;
        const now = Date.now();
        try {
            await db.collection('friend_invites').doc(`${me.uid}__${targetUid}`).set({
                fromUid: me.uid, fromName: me.name, fromTag: me.tag, fromHero: me.selectedHero, toUid: targetUid,
                roomCode: String(roomCode).trim().toUpperCase(), gameMode, createdAt: now, expiresAt: now + 600000
            });
            return true;
        } catch (_) {
            return false;
        }
    }

    setPendingInvite(inviteId) {
        this._pendingAcceptedInviteId = inviteId || null;
    }

    dismissPendingInvite() {
        const id = this._pendingAcceptedInviteId;
        this._pendingAcceptedInviteId = null;
        if (id) return this.dismissInvite(id);
    }

    async dismissInvite(inviteId) {
        const db = this.getDb();
        if (!db || !inviteId) return;
        try { await db.collection('friend_invites').doc(inviteId).delete(); } catch (_) {}
    }

    getTotalNotificationCount() {
        return this.incomingRequests.length + this.incomingInvites.length;
    }

    emitUpdate() {
        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.emit('friendsUpdated', {
                friendsCount: this.friends.length,
                requestsCount: this.incomingRequests.length,
                invitesCount: this.incomingInvites.length
            });
        }
    }
}

if (typeof window !== 'undefined') window.FriendService = FriendService;
if (typeof module !== 'undefined' && module.exports) module.exports = { FriendService };

