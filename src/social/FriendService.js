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
        this._presenceBound = false;
        this._lastSocialHash = '';
        this._lastFriendsLoadedAt = 0;
        this.lastError = null;
    }

    _describeDbError(err) {
        const code = err && err.code ? String(err.code) : '';
        if (code === 'permission-denied') return 'Firestore permission denied — update Firestore Rules in Firebase Console.';
        if (code === 'unavailable') return 'Cloud unavailable — check your internet connection.';
        return (err && err.message) ? err.message : 'Cloud request failed.';
    }
    getDb() { return (typeof window !== 'undefined' && window.cloudSave && window.cloudSave.isInitialized) ? window.cloudSave.db : null; }
    getPresence() { return (typeof window !== 'undefined' && window.presenceService) ? window.presenceService : null; }
    getMyUid() {
        if (typeof window !== 'undefined' && window.cloudSave && typeof window.cloudSave.getEffectivePlayerUid === 'function') return window.cloudSave.getEffectivePlayerUid();
        return (typeof PlayerIdentity !== 'undefined') ? PlayerIdentity.getEffectiveUid(null, null) : (localStorage.getItem('lesaio_player_uid') || '');
    }
    getMyTag() {
        const uid = this.getMyUid();
        return (typeof PlayerIdentity !== 'undefined' && typeof PlayerIdentity.getOnlineTag === 'function') ? PlayerIdentity.getOnlineTag(uid) : '#GUEST0';
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

        const _cs = (typeof window !== 'undefined' && window.clanService) ? window.clanService : null;
        const _cl = (_cs && _cs.currentClan) || null;
        const _cloud = (typeof window !== 'undefined' && window.cloudSave && window.cloudSave.lastCloudData) ? window.cloudSave.lastCloudData : null;
        const _cid = _cl ? _cl.id : (_cs && _cs.clanId ? _cs.clanId : null);
        return {
            uid, tag, tagClean, name, nameLower: name.trim().toLowerCase(),
            clanId: _cid, clanTag: _cl ? _cl.tag : (_cid && _cloud && _cloud.clanId === _cid ? (_cloud.clanTag || null) : null),
            clanName: _cl ? _cl.name : (_cid && _cloud && _cloud.clanId === _cid ? (_cloud.clanName || null) : null),
            level: p.accountLevel || parseInt(localStorage.getItem('lesaio_account_level') || '1', 10) || 1,
            selectedHero: p.selectedHero || localStorage.getItem('lesaio_selected_hero') || 'psanas',
            highScore: FriendService._maxNum(stats.highScore, parseInt(localStorage.getItem('lesaio_highscore') || '0', 10)),
            maxWave: rawMaxWave, totalKills: FriendService._maxNum(stats.totalKills, parseInt(localStorage.getItem('lesaio_total_kills') || '0', 10)),
            endlessMaxWave, olympusMaxFloor: FriendService._maxNum(p.combatFeats && p.combatFeats.olympusMaxFloor, featSnap && featSnap.olympusMaxFloor),
            cosmetics: typeof CosmeticManager !== 'undefined' ? CosmeticManager.getPublicSummary() : {},
            loadout: typeof PlayerLoadoutExtractor !== 'undefined' ? PlayerLoadoutExtractor.getLocalSummary() : null
        };
    }

    start() {
        if (this._initialized) return;
        this._initialized = true;

        const ps = this.getPresence();
        if (ps && !this._presenceBound) {
            this._presenceBound = true;
            ps.onChange(() => this.emitUpdate());
        }
        if (ps) ps.start(this.getMyUid(), this._currentStatus, this._activeRoomCode);

        this.attachListeners();
        this.syncMyProfile(true);

        // Low-frequency fallback recovery (live presence & friendships use RTDB + Firestore snapshots)
        this._presenceTimer = setInterval(() => {
            const rt = this.getPresence();
            if (!(rt && rt.isReady())) this.syncMyProfile(false);
            if (this._friendshipsErrored || !this._unsubFriendships) this.pollFriendships();
        }, 180000);

        if (typeof window !== 'undefined') {
            const markOffline = () => this.markOfflineBeacon();
            window.addEventListener('pagehide', markOffline);
            window.addEventListener('beforeunload', markOffline);
            if (typeof document !== 'undefined') {
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'hidden') markOffline();
                    else if (document.visibilityState === 'visible') {
                        const rt = this.getPresence();
                        if (rt && rt.isReady()) rt.start(this.getMyUid(), this._currentStatus, this._activeRoomCode);
                        else this.syncMyProfile(true);
                    }
                });
            }
        }
    }

    onAuthChanged() {
        this._seenInviteIds.clear();
        this._seenRequestIds.clear();
        this._friendshipsErrored = false;
        this._lastSocialHash = '';
        this._lastFriendsLoadedAt = 0;
        const ps = this.getPresence();
        if (ps) ps.start(this.getMyUid(), this._currentStatus, this._activeRoomCode);
        this.attachListeners();
        this.syncMyProfile(true);
        this.emitUpdate();
    }

    setPresenceStatus(statusText = 'In Lobby', roomCode = null) {
        this._currentStatus = statusText;
        this._activeRoomCode = roomCode;
        const ps = this.getPresence();
        if (ps && ps.isReady()) {
            ps.setStatus(this.getMyUid(), statusText, roomCode);
            this.emitUpdate();
            return;
        }
        this.syncMyProfile(true);
    }

    async syncMyProfile(force = false) {
        const db = this.getDb();
        const me = this.getMySummary();
        if (!db || !me.uid) return false;

        const cs = (typeof window !== 'undefined') ? window.cloudSave : null;
        if (cs && (cs.isHydratingAuth || cs.isSyncingFromCloud)) {
            if (!this._deferredSyncTimer) this._deferredSyncTimer = setTimeout(() => { this._deferredSyncTimer = null; this.syncMyProfile(true); }, 1500);
            return false;
        }

        const ps = this.getPresence();
        const rtdbReady = Boolean(ps && ps.isReady());
        if (rtdbReady) ps.start(me.uid, this._currentStatus, this._activeRoomCode);

        const now = Date.now();
        if (!force && now - this._lastPresenceSync < (rtdbReady ? 30000 : 15000)) return true;

        // Before initial cloud hydration completes, push ONLY presence fields so unhydrated Lv.1 defaults never clobber cloud progress
        const statsReady = !cs || cs.hasCompletedInitialSync || (typeof SaveMigration !== 'undefined' && SaveMigration.hasEstablishedProgress());
        if (rtdbReady && !statsReady) return true;
        const baseDoc = {
            uid: me.uid, online: true,
            currentStatus: this._currentStatus || 'In Lobby',
            coopRoomCode: this._activeRoomCode || null, lastSeenAt: now
        };
        let socialSig = '';
        if (statsReady) {
            const c = (cs && cs.lastCloudData && typeof cs.lastCloudData === 'object') ? cs.lastCloudData : null;
            const wiped = c && typeof SaveMigration !== 'undefined' && SaveMigration.wasWipedByDev(c, now);
            const cp = (!wiped && c && c.player) ? c.player : (!wiped ? c : null);
            const csStats = (cp && cp.stats) ? cp.stats : {};
            const cSocial = (!wiped && c && c.socialStats) ? c.socialStats : {};
            const lvl = FriendService._maxNum(1, me.level, !wiped && cp && (cp.accountLevel || cp.level), !wiped && c && (c.accountLevel || c.level));
            const hs = FriendService._maxNum(0, me.highScore, csStats.highScore, cSocial.highScore, !wiped && c && (c.lbHighScore || c.highScore));
            const mw = FriendService._maxNum(1, me.maxWave, csStats.maxWave, cSocial.maxWave, !wiped && c && c.maxWave);
            const cpEndless = (!wiped && cp && cp.combatFeats && typeof cp.combatFeats.endlessMaxWave === 'number') ? cp.combatFeats.endlessMaxWave : 0;
            const ew = FriendService._maxNum(0, me.endlessMaxWave, cpEndless, mw > 20 ? mw : 0);
            const tk = FriendService._maxNum(0, me.totalKills, csStats.totalKills, cSocial.totalKills, !wiped && c && c.lbTotalKills);
            Object.assign(baseDoc, {
                friendTag: me.tag, friendTagClean: me.tagClean, playerName: me.name, playerNameLower: me.nameLower,
                accountLevel: lvl, level: lvl, selectedHero: me.selectedHero,
                socialStats: { highScore: hs, maxWave: mw, totalKills: tk, endlessMaxWave: ew, olympusMaxFloor: me.olympusMaxFloor },
                ...(me.clanId || !(typeof window !== 'undefined' && window.clanService && window.clanService.clanId) ? { clanId: me.clanId || null, clanTag: me.clanTag || null, clanName: me.clanName || null } : {}),
                cosmetics: me.cosmetics, lbHighScore: hs, lbEndlessWave: ew, lbTotalKills: tk
            });
            if (typeof PlayerLoadoutExtractor !== 'undefined') {
                baseDoc.publicLoadout = PlayerLoadoutExtractor.serializeForPublicCloud();
                baseDoc.privateLoadout = PlayerLoadoutExtractor.isLocalPrivate();
            }
            socialSig = JSON.stringify([me.uid, me.name, lvl, me.selectedHero, hs, mw, ew, tk, me.olympusMaxFloor, me.clanId, me.clanTag, me.cosmetics, baseDoc.privateLoadout, baseDoc.publicLoadout && baseDoc.publicLoadout.weapon]);
            if (rtdbReady && this._lastSocialHash === socialSig) {
                this._lastPresenceSync = now;
                return true;
            }
        }
        this._lastPresenceSync = now;
        try {
            const edge = (typeof window !== 'undefined' && window.edgeApi && window.edgeApi.isEnabled()) ? window.edgeApi : null;
            let syncedEdge = false;
            if (edge) {
                const er = await edge.post(`/player/${encodeURIComponent(me.uid)}`, baseDoc).catch(() => null);
                if (er && !er.fallback && er.ok) syncedEdge = true;
            }
            if (!syncedEdge) {
                await db.collection('players').doc(me.uid).set(baseDoc, { merge: true }).catch(async (firstErr) => {
                    if (firstErr && firstErr.code === 'permission-denied') {
                        const { uid: _omitUid, ...safeDoc } = baseDoc;
                        await db.collection('players').doc(me.uid).set(safeDoc, { merge: true });
                    } else throw firstErr;
                });
            }
            if (socialSig) this._lastSocialHash = socialSig;
            if (cs && cs.lastCloudData && typeof cs.lastCloudData === 'object') {
                cs.lastCloudData.playerName = me.name; cs.lastCloudData.playerNameLower = me.nameLower;
                if (cs.lastCloudData.player && typeof cs.lastCloudData.player === 'object') cs.lastCloudData.player.name = me.name;
            }
            this.lastError = null;
            return true;
        } catch (err) { this.lastError = this._describeDbError(err); return false; }
    }

    markOfflineBeacon() {
        if (typeof window !== 'undefined' && window._lesaioSuppressUnloadSave) return;
        const uid = this.getMyUid();
        this._lastPresenceSync = 0;
        const ps = this.getPresence();
        if (ps && ps.isReady() && uid) { ps.markOffline(uid); return; }
        const db = this.getDb();
        if (!db || !uid) return;
        try { db.collection('players').doc(uid).set({ online: false, coopRoomCode: null, lastSeenAt: Date.now() }, { merge: true }).catch(() => {}); } catch (_) {}
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
        const ps = this.getPresence();
        if (ps) ps.watchUids(accepted.map(f => f.otherUid));
        this.emitUpdate();
        const missingProfile = uidsToRefresh.some(u => !this.friendProfiles[u]);
        if (uidsToRefresh.length > 0 && (missingProfile || Date.now() - this._lastFriendsLoadedAt > 120000)) {
            this._lastFriendsLoadedAt = Date.now();
            this.refreshFriendStatuses(uidsToRefresh);
        }
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
        const ps = this.getPresence();
        const list = uids || this.friends.map(f => f.otherUid);
        if (!list.length) return;
        try {
            const [docs] = await Promise.all([
                db ? Promise.all(list.map(uid => db.collection('players').doc(uid).get().catch(() => null))) : Promise.resolve([]),
                ps ? ps.fetchOnce(list).catch(() => {}) : Promise.resolve()
            ]);
            this._lastFriendsLoadedAt = Date.now();
            docs.forEach((doc) => {
                if (doc && doc.exists) this.friendProfiles[doc.id] = this._formatPlayerDoc(doc.id, doc.data() || {});
            });
            this.emitUpdate();
        } catch (_) {}
    }

    _formatPlayerDoc(uid, data) {
        const p = data.player || {}, social = data.socialStats || {}, pStats = p.stats || {}, rStats = data.stats || {}, pFeats = p.combatFeats || {}, cosRaw = data.cosmetics || {};
        const name = data.playerName || p.name || 'Hero';
        const tag = data.friendTag || (typeof PlayerIdentity !== 'undefined' ? PlayerIdentity.getOnlineTag(uid) : '#HERO00');
        const level = parseInt(data.level || data.accountLevel || p.accountLevel || 1, 10) || 1;
        const hero = data.selectedHero || p.selectedHero || 'psanas';
        const ps = this.getPresence();
        const pres = (typeof PresenceService !== 'undefined') ? PresenceService.resolve(uid, data, ps ? ps.cache : null) : (() => {
            const updMs = data.lastUpdated ? (typeof data.lastUpdated.toMillis === 'function' ? data.lastUpdated.toMillis() : (Number(data.lastUpdated.seconds) * 1000 || 0)) : 0;
            const lastSeenAt = FriendService._maxNum(data.lastSeenAt, updMs, data.timestamp);
            const isOnline = Boolean(data.online && lastSeenAt && (Date.now() - lastSeenAt < 120000));
            return { isOnline, lastSeenAt, currentStatus: isOnline ? (data.currentStatus || 'In Lobby') : 'Offline', coopRoomCode: isOnline ? (data.coopRoomCode || null) : null };
        })();
        const { isOnline, lastSeenAt, currentStatus, coopRoomCode } = pres;
        const maxWave = FriendService._maxNum(1, social.maxWave, pStats.maxWave, rStats.maxWave, data.maxWave);
        const hasAuthFeats = Boolean(p.combatFeats && typeof p.combatFeats.endlessMaxWave === 'number');
        const endlessMaxWave = hasAuthFeats
            ? FriendService._maxNum(0, pFeats.endlessMaxWave, maxWave > 20 ? maxWave : 0)
            : FriendService._maxNum(0, (social.endlessMaxWave !== maxWave || maxWave > 20) ? social.endlessMaxWave : 0, (data.lbEndlessWave !== maxWave || maxWave > 20) ? data.lbEndlessWave : 0, maxWave > 20 ? maxWave : 0);

        return {
            uid, name, tag, tagClean: (data.friendTagClean || tag.replace(/[^A-Z0-9]/g, '')).toUpperCase(),
            clanId: data.clanId || null, clanTag: data.clanTag || null, clanName: data.clanName || null,
            level, hero, isOnline, lastSeenAt, currentStatus, coopRoomCode,
            highScore: FriendService._maxNum(social.highScore, pStats.highScore, rStats.highScore, data.highScore, data.lbHighScore),
            maxWave, totalKills: FriendService._maxNum(social.totalKills, pStats.totalKills, rStats.totalKills, data.totalKills, data.lbTotalKills),
            endlessMaxWave, olympusMaxFloor: FriendService._maxNum(social.olympusMaxFloor, pFeats.olympusMaxFloor, cosRaw.olympusMaxFloor),
            cosmetics: typeof CosmeticManager !== 'undefined' ? CosmeticManager.extractPublicCosmetics(data) : {},
            loadout: typeof PlayerLoadoutExtractor !== 'undefined' ? PlayerLoadoutExtractor.extractFromDoc(data, { isSelf: uid === this.getMyUid() }) : null
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
        const db = this.getDb(), ps = this.getPresence(), edge = (typeof window !== 'undefined' && window.edgeApi && window.edgeApi.isEnabled()) ? window.edgeApi : null;
        if (!db && !edge) return { ok: false, error: 'Offline mode: Connect to internet/cloud to find friends.', results: [] };
        const myUid = this.getMyUid();
        try {
            const rawDocs = [];
            const seenIds = new Set();
            if (edge) {
                const er = await edge.get(`/players/discover?limit=${maxCount}`).catch(() => null);
                if (er && !er.fallback && er.ok && Array.isArray(er.players)) {
                    er.players.forEach((p) => { const pid = p.uid || p.id; if (pid && pid !== myUid && !seenIds.has(pid)) { seenIds.add(pid); rawDocs.push({ id: pid, data: p }); } });
                }
            }
            if (rawDocs.length < maxCount && db) {
                const snap = await db.collection('players').orderBy('lastSeenAt', 'desc').limit(maxCount + 3).get();
                snap.forEach((doc) => { if (doc.exists && doc.id !== myUid && !seenIds.has(doc.id)) { seenIds.add(doc.id); rawDocs.push({ id: doc.id, data: doc.data() || {} }); } });
            }
            if (ps && rawDocs.length) await ps.fetchOnce(rawDocs.map(d => d.id)).catch(() => {});
            const list = rawDocs.map((d) => { const e = this._formatPlayerDoc(d.id, d.data); return { ...e, relation: this.getRelationState(e.uid) }; });
            return { ok: true, results: list.slice(0, maxCount) };
        } catch (err) { return { ok: false, error: this._describeDbError(err), results: [] }; }
    }

    /**
     * Search players across Firestore by either Online ID (#XXXXXX) or Player Name.
     */
    async searchPlayers(rawQuery) {
        const db = this.getDb(), ps = this.getPresence(), edge = (typeof window !== 'undefined' && window.edgeApi && window.edgeApi.isEnabled()) ? window.edgeApi : null;
        if (!db && !edge) return { ok: false, error: 'Offline mode: Connect to internet/cloud to find friends.', results: [] };
        const q = (rawQuery || '').trim();
        if (q.length < 2) return { ok: false, error: 'Type at least 2 characters (Name or #OnlineID).', results: [] };
        await this.syncMyProfile(false);

        const myUid = this.getMyUid();
        const cleanTag = (typeof PlayerIdentity !== 'undefined' && PlayerIdentity.normalizeTag) ? PlayerIdentity.normalizeTag(q) : q.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const lowerName = q.replace(/^#/, '').trim().toLowerCase();
        const rawMap = new Map();
        const collect = (snap) => {
            if (!snap || snap.empty) return;
            snap.forEach((doc) => { if (doc.exists && doc.id !== myUid && !rawMap.has(doc.id)) rawMap.set(doc.id, doc.data() || {}); });
        };

        try {
            if (edge) {
                const er = await edge.get(`/players/search?q=${encodeURIComponent(q)}`).catch(() => null);
                if (er && !er.fallback && er.ok && Array.isArray(er.players)) {
                    er.players.forEach((p) => { const pid = p.uid || p.id; if (pid && pid !== myUid && !rawMap.has(pid)) rawMap.set(pid, p); });
                }
            }
            if (rawMap.size < 5 && db) {
                const queries = [];
                if (cleanTag.length >= 4 && cleanTag.length <= 10) {
                    queries.push(db.collection('players').where('friendTagClean', '==', cleanTag).limit(6).get());
                    queries.push(db.collection('players').where('friendTag', '==', `#${cleanTag}`).limit(6).get());
                }
                if (q.length >= 12 && !q.includes(' ')) {
                    queries.push(db.collection('players').doc(q).get().then(doc => { if (doc.exists && doc.id !== myUid && !rawMap.has(doc.id)) rawMap.set(doc.id, doc.data() || {}); }).catch(() => {}));
                }
                if (!q.startsWith('#') && lowerName.length >= 2) {
                    queries.push(db.collection('players').where('playerNameLower', '>=', lowerName).where('playerNameLower', '<=', lowerName + '\uf8ff').limit(10).get());
                    const titleName = lowerName.charAt(0).toUpperCase() + lowerName.slice(1);
                    Array.from(new Set([q, lowerName, titleName])).forEach(v => queries.push(db.collection('players').where('playerName', '==', v).limit(5).get()));
                    queries.push(db.collection('players').where('player.name', '==', q).limit(5).get());
                }
                const results = await Promise.allSettled(queries);
                results.forEach(r => { if (r.status === 'fulfilled' && r.value && typeof r.value.forEach === 'function') collect(r.value); });
                if (rawMap.size === 0 && results.length > 0 && results.every(r => r.status === 'rejected')) return { ok: false, error: this._describeDbError(results[0].reason), results: [] };
            }
            if (ps && rawMap.size > 0) await ps.fetchOnce(Array.from(rawMap.keys())).catch(() => {});

            const list = Array.from(rawMap.entries()).map(([id, d]) => {
                const entry = this._formatPlayerDoc(id, d);
                return { ...entry, relation: this.getRelationState(entry.uid) };
            });
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
    getRelationshipDocId(uidA, uidB) { return [uidA, uidB].sort().join('__'); }
    async sendFriendRequest(targetProfile) {
        const db = this.getDb(), me = this.getMySummary();
        if (!db || !me.uid || !targetProfile || !targetProfile.uid) return { ok: false, message: 'Cloud unavailable.' };
        if (targetProfile.uid === me.uid) return { ok: false, message: 'You cannot add yourself!' };
        const relId = this.getRelationshipDocId(me.uid, targetProfile.uid), docRef = db.collection('friendships').doc(relId);
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
            const now = Date.now(), targetObj = { name: targetProfile.name, tag: targetProfile.tag, hero: targetProfile.hero, level: targetProfile.level };
            await docRef.set({ users: [me.uid, targetProfile.uid].sort(), status: 'pending', requestedBy: me.uid, profiles: { [me.uid]: { name: me.name, tag: me.tag, hero: me.selectedHero, level: me.level }, [targetProfile.uid]: targetObj }, createdAt: now, updatedAt: now });
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
        } catch (err) { this.lastError = this._describeDbError(err); return false; }
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
        } catch (err) { this.lastError = this._describeDbError(err); return false; }
    }

    async sendCoopInvite(targetUid, roomCode, gameMode = 'story') {
        const db = this.getDb(), me = this.getMySummary();
        if (!db || !me.uid || !targetUid || !roomCode) return false;
        const now = Date.now();
        try {
            await db.collection('friend_invites').doc(`${me.uid}__${targetUid}`).set({
                fromUid: me.uid, fromName: me.name, fromTag: me.tag, fromHero: me.selectedHero, toUid: targetUid,
                roomCode: String(roomCode).trim().toUpperCase(), gameMode, createdAt: now, expiresAt: now + 600000
            });
            return true;
        } catch (_) { return false; }
    }
    setPendingInvite(inviteId) { this._pendingAcceptedInviteId = inviteId || null; }
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

