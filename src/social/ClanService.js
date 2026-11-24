/**
 * Lesa.io - Online Clan Service & Tax Vault Coordinator (V1.1.0 Step 1)
 * Manages Firestore clan persistence, clan creation (1,000,000 Coins + 1,000 Gems),
 * daily donation caps + Tax Vault tributes, Shared Weekly Clan Bounties, and roster actions.
 */

class ClanService {
    constructor() {
        this.localKey = 'lesaio_clan_local_v1';
        this.currentClan = null;
        this.browseList = [];
        this.clanId = null;
        this.honorCrests = 0;
        this.dailyDonations = { day: '', counts: {} };
        this.claimedBounties = {}; // { [weekKey]: [bountyId, ...] }
        this.lastLeftAt = 0;
        this._pendingBounties = { endless_waves: 0, zeus_defeats: 0, coop_kills: 0 };
        this._unsubClan = null;
        this._bountyFlushTimer = null;
        this.lastError = null;

        this.loadLocal();
        this.bindGameplayEvents();
    }

    getDb() {
        return (typeof window !== 'undefined' && window.cloudSave && window.cloudSave.isInitialized)
            ? window.cloudSave.db : null;
    }

    getEdge() {
        return (typeof window !== 'undefined' && window.edgeApi && window.edgeApi.isEnabled()) ? window.edgeApi : null;
    }

    async _migrateClanToEdge(clanId) {
        const db = this.getDb(), edge = this.getEdge();
        if (!db || !edge || !clanId) return null;
        try {
            const snap = await db.collection('clans').doc(clanId).get();
            if (!snap || !snap.exists) return null;
            const res = await edge.post('/clans/migrate', { clan: { id: snap.id, ...snap.data() } });
            return (res && res.ok && res.clan) ? res.clan : null;
        } catch (_) { return null; }
    }

    async _postEdgeClan(clanId, action, payload) {
        const edge = this.getEdge();
        if (!edge || !clanId) return { fallback: true };
        let res = await edge.post(`/clan/${encodeURIComponent(clanId)}/${action}`, payload);
        if (res && !res.fallback && res.status === 404) {
            const migrated = await this._migrateClanToEdge(clanId);
            if (migrated) res = await edge.post(`/clan/${encodeURIComponent(clanId)}/${action}`, payload);
        }
        return res;
    }

    getMyUid() {
        if (typeof window !== 'undefined' && window.cloudSave && typeof window.cloudSave.getEffectivePlayerUid === 'function') {
            return window.cloudSave.getEffectivePlayerUid();
        }
        return (typeof PlayerIdentity !== 'undefined')
            ? PlayerIdentity.getEffectiveUid(null, null)
            : (localStorage.getItem('lesaio_player_uid') || '');
    }

    getMyPlayerMeta() {
        const gs = (typeof window !== 'undefined' && window.GameState) ? window.GameState.player : {};
        const uid = this.getMyUid();
        const tag = (typeof PlayerIdentity !== 'undefined') ? PlayerIdentity.getOnlineTag(uid) : '#HERO00';
        return {
            uid,
            name: gs.name || localStorage.getItem('lesaio_player_name') || 'Hero',
            tag,
            hero: gs.selectedHero || 'psanas',
            level: Math.max(1, parseInt(gs.accountLevel || 1, 10) || 1)
        };
    }

    loadLocal() {
        try {
            const raw = localStorage.getItem(this.localKey);
            if (raw) {
                const d = JSON.parse(raw);
                this.clanId = d.clanId || null;
                this.honorCrests = Math.max(0, Math.floor(Number(d.honorCrests) || 0));
                this.dailyDonations = (d.dailyDonations && typeof d.dailyDonations === 'object')
                    ? d.dailyDonations : { day: '', counts: {} };
                this.claimedBounties = (d.claimedBounties && typeof d.claimedBounties === 'object')
                    ? d.claimedBounties : {};
                this.lastLeftAt = Number(d.lastLeftAt) || 0;
                if (d.pendingBounties && typeof d.pendingBounties === 'object') {
                    this._pendingBounties = {
                        endless_waves: Math.max(0, Math.floor(d.pendingBounties.endless_waves || 0)),
                        zeus_defeats: Math.max(0, Math.floor(d.pendingBounties.zeus_defeats || 0)),
                        coop_kills: Math.max(0, Math.floor(d.pendingBounties.coop_kills || 0))
                    };
                }
            }
        } catch (_) {}
        this._ensureTodayReset();
    }

    saveLocal() {
        try {
            localStorage.setItem(this.localKey, JSON.stringify({
                clanId: this.clanId,
                honorCrests: this.honorCrests,
                dailyDonations: this.dailyDonations,
                claimedBounties: this.claimedBounties,
                lastLeftAt: this.lastLeftAt,
                pendingBounties: this._pendingBounties
            }));
        } catch (_) {}
    }

    _ensureTodayReset() {
        const today = (typeof ClanConfigHelper !== 'undefined')
            ? ClanConfigHelper.getUtcDayKey()
            : new Date().toISOString().slice(0, 10);
        if (!this.dailyDonations || this.dailyDonations.day !== today) {
            this.dailyDonations = { day: today, counts: { coins: 0, armory_shards: 0, mati_crystal: 0, olympian_bronze: 0 } };
            this.saveLocal();
        }
    }

    getDonatedToday(resourceId) {
        this._ensureTodayReset();
        return Math.max(0, Math.floor(Number((this.dailyDonations.counts || {})[resourceId]) || 0));
    }

    getRemainingDailyCap(resourceId) {
        const cfg = (typeof CLAN_VAULT_RESOURCES !== 'undefined')
            ? CLAN_VAULT_RESOURCES.find(r => r.id === resourceId) : null;
        if (!cfg) return 0;
        return Math.max(0, cfg.dailyCap - this.getDonatedToday(resourceId));
    }

    _emitUpdate() {
        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.emit('clansUpdated', { clan: this.currentClan, clanId: this.clanId });
        }
    }

    _describeError(err) {
        const code = err && err.code ? String(err.code) : '';
        if (code === 'permission-denied') {
            return 'Firestore permission denied for "clans" — add the Clans security rule from V1_1_0_README.md in Firebase Console.';
        }
        if (code === 'unavailable') return 'Cloud offline — check your internet connection.';
        return (err && err.message) ? err.message : 'Clan operation failed.';
    }

    async start() {
        await this.syncMyClanMembership();
        this.bindClanListener();
    }

    onAuthChanged() {
        this.syncMyClanMembership().then(() => this.bindClanListener());
    }

    async syncMyClanMembership() {
        const uid = this.getMyUid();
        if (!uid) return;
        const cached = (typeof window !== 'undefined' && window.cloudSave && window.cloudSave.lastCloudData) ? window.cloudSave.lastCloudData : null;
        if (cached && 'clanId' in cached) {
            if ((cached.clanId || null) !== (this.clanId || null)) { this.clanId = cached.clanId || null; this.saveLocal(); }
            return;
        }
        const edge = this.getEdge(), db = this.getDb();
        if (edge) {
            const er = await edge.get(`/player/${encodeURIComponent(uid)}`).catch(() => null);
            if (er && er.ok && er.doc && typeof er.doc.clanId === 'string') {
                if (er.doc.clanId !== (this.clanId || '')) { this.clanId = er.doc.clanId || null; this.saveLocal(); }
                return;
            }
        }
        if (!db) return;
        try {
            const pDoc = await db.collection('players').doc(uid).get();
            if (pDoc && pDoc.exists) {
                const pData = pDoc.data() || {};
                if (typeof pData.clanId === 'string' && pData.clanId !== (this.clanId || '')) { this.clanId = pData.clanId || null; this.saveLocal(); }
            }
        } catch (_) {}
    }

    async _syncPlayerClanBadge(clanDoc = null) {
        const uid = this.getMyUid();
        if (!uid) return;
        const badge = { clanId: clanDoc ? clanDoc.id : null, clanTag: clanDoc ? clanDoc.tag : null, clanName: clanDoc ? clanDoc.name : null };
        const edge = this.getEdge();
        if (edge) {
            const er = await edge.post(`/player/${encodeURIComponent(uid)}`, badge).catch(() => null);
            if (er && !er.fallback && er.ok) return;
        }
        const db = this.getDb();
        if (db) { try { await db.collection('players').doc(uid).set(badge, { merge: true }); } catch (_) {} }
    }

    async refreshActiveClan() {
        const edge = this.getEdge();
        if (!edge || !this.clanId) return false;
        let er = await edge.get(`/clan/${encodeURIComponent(this.clanId)}`).catch(() => null);
        if (er && !er.fallback && er.status === 404) {
            const migrated = await this._migrateClanToEdge(this.clanId);
            if (migrated) er = { ok: true, fallback: false, clan: migrated };
        }
        if (!er || er.fallback) return false;
        if (!er.ok && er.status === 404) { this.clanId = null; this.currentClan = null; this.saveLocal(); this._emitUpdate(); return true; }
        if (er.ok && er.clan) {
            const uid = this.getMyUid();
            if (uid && (!er.clan.members || !er.clan.members[uid])) {
                this.clanId = null; this.currentClan = null; this.saveLocal(); this._syncPlayerClanBadge(null);
            } else { this.currentClan = er.clan; }
            this._emitUpdate();
            return true;
        }
        return false;
    }

    bindClanListener() {
        if (this._unsubClan) { try { this._unsubClan(); } catch (_) {} this._unsubClan = null; }
        const db = this.getDb(), edge = this.getEdge();
        if ((!db && !edge) || !this.clanId) { this.currentClan = null; this._emitUpdate(); return; }
        if (edge) {
            this.refreshActiveClan().then((handled) => { if (!handled && db) this._bindFirestoreClanDoc(db); });
            return;
        }
        if (db) this._bindFirestoreClanDoc(db);
    }

    _bindFirestoreClanDoc(db) {
        if (!db || !this.clanId) return;
        this._unsubClan = db.collection('clans').doc(this.clanId).onSnapshot((doc) => {
            if (!doc || !doc.exists) { this.clanId = null; this.currentClan = null; this.saveLocal(); this._emitUpdate(); return; }
            const data = { id: doc.id, ...doc.data() }, uid = this.getMyUid();
            if (uid && (!data.members || !data.members[uid])) { this.clanId = null; this.currentClan = null; this.saveLocal(); this._syncPlayerClanBadge(null); }
            else { this.currentClan = data; }
            this._emitUpdate();
        }, (err) => { this.lastError = this._describeError(err); });
    }

    async fetchBrowseClans() {
        const db = this.getDb(), edge = this.getEdge();
        if (!db && !edge) return { ok: false, error: 'Connect to internet/cloud to browse Clans.', clans: [] };
        try {
            const byId = new Map();
            let edgeOk = false;
            if (edge) {
                const er = await edge.get('/clans').catch(() => null);
                if (er && !er.fallback && er.ok) {
                    edgeOk = true;
                    (er.clans || []).forEach(c => { if (c && c.id) byId.set(c.id, c); });
                }
            }
            if (db && (!edgeOk || (!this._mergedBrowseOnce && byId.size < 25))) {
                this._mergedBrowseOnce = true;
                try {
                    const snap = await db.collection('clans').orderBy('xp', 'desc').limit(25).get().catch(() => null);
                    if (snap && typeof snap.forEach === 'function') {
                        snap.forEach((doc) => {
                            if (!doc.exists || byId.has(doc.id)) return;
                            const c = { id: doc.id, ...doc.data() };
                            byId.set(doc.id, c);
                            if (edge && edgeOk) edge.post('/clans/migrate', { clan: c }).catch(() => {});
                        });
                    }
                } catch (_) {}
            }
            const list = Array.from(byId.values()).sort((a, b) => (Number(b.xp) || 0) - (Number(a.xp) || 0)).slice(0, 25);
            this.browseList = list; this._emitUpdate();
            return { ok: true, clans: list };
        } catch (err) { return { ok: false, error: this._describeError(err), clans: [] }; }
    }

    validateCreateInputs(rawName, rawTag) {
        const name = String(rawName || '').trim().replace(/\s+/g, ' ');
        const tag = String(rawTag || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (name.length < 3 || name.length > 20) return { ok: false, error: 'Clan Name must be 3–20 characters.' };
        if (tag.length < 3 || tag.length > 4) return { ok: false, error: 'Clan Tag must be 3–4 letters or numbers.' };
        if (this.clanId && this.currentClan) return { ok: false, error: 'Leave your current Clan before founding a new one.' };

        const gs = (typeof window !== 'undefined' && window.GameState) ? window.GameState : null;
        const coins = gs && gs.player ? (gs.player.coins || 0) : 0;
        const gems = gs && gs.player ? (gs.player.gems || 0) : 0;
        const cost = (typeof CLAN_CREATE_COST !== 'undefined') ? CLAN_CREATE_COST : { coins: 1000000, gems: 1000 };
        if (coins < cost.coins) return { ok: false, error: `Need ${cost.coins.toLocaleString()} Coins to found a Clan.` };
        if (gems < cost.gems) return { ok: false, error: `Need ${cost.gems.toLocaleString()} Gems to found a Clan.` };
        return { ok: true, name, tag, cost };
    }

    async createClan({ name, tag, emblemId = 'spartan_shield', colorId = 'crimson', motto = '', joinMode = 'open' }) {
        const v = this.validateCreateInputs(name, tag);
        if (!v.ok) return v;
        const db = this.getDb(), edge = this.getEdge();
        if (!db && !edge) return { ok: false, error: 'Cloud connection required to register your Clan online.' };
        const me = this.getMyPlayerMeta();
        if (!me.uid) return { ok: false, error: 'Player identity missing — reload and try again.' };

        try {
            const clanId = `clan_${v.tag.toLowerCase()}_${Date.now().toString(36)}`;
            const weekKey = (typeof ClanConfigHelper !== 'undefined') ? ClanConfigHelper.getIsoWeekKey() : '2026-W01';
            const cleanMotto = String(motto || 'Forged in Lesa.io • No Leeches Allowed').trim().slice(0, 72);
            const clanPayload = {
                id: clanId, name: v.name, nameLower: v.name.toLowerCase(), tag: v.tag, emblemId, colorId, motto: cleanMotto,
                joinMode: joinMode === 'request' ? 'request' : 'open', leaderUid: me.uid, xp: 0, level: 1, memberCount: 1, createdAt: Date.now(),
                vault: { coins: 0, armory_shards: 0, mati_crystal: 0, olympian_bronze: 0 },
                bounties: { [weekKey]: { endless_waves: 0, zeus_defeats: 0, coop_kills: 0, vault_tributes: 0 } },
                members: { [me.uid]: { uid: me.uid, name: me.name, tag: me.tag, hero: me.hero, level: me.level, role: 'leader', contributedPoints: 0, weeklyContrib: 0, joinedAt: Date.now() } },
                joinRequests: {}, activityLog: [`${me.name} founded [${v.tag}] ${v.name}!`]
            };

            let createdEdge = false;
            if (edge) {
                const er = await edge.post('/clans', { clan: clanPayload });
                if (er && !er.fallback) {
                    if (!er.ok) return { ok: false, error: er.error || 'Could not create Clan.' };
                    createdEdge = true;
                }
            }
            if (!createdEdge) {
                const dupTag = await db.collection('clans').where('tag', '==', v.tag).limit(1).get();
                if (!dupTag.empty) return { ok: false, error: `Clan Tag [${v.tag}] is already taken!` };
                await db.collection('clans').doc(clanId).set(clanPayload);
            }

            // Spend currencies ONLY after Firestore confirmed creation
            const gs = window.GameState;
            gs.spendCoins(v.cost.coins);
            gs.spendGems(v.cost.gems);
            gs.save();

            this.clanId = clanId;
            this.currentClan = clanPayload;
            this.saveLocal();
            await this._syncPlayerClanBadge(clanPayload);
            this.bindClanListener();
            this._emitUpdate();
            return { ok: true, clan: clanPayload };
        } catch (err) {
            return { ok: false, error: this._describeError(err) };
        }
    }

    async joinClan(clanId) {
        const db = this.getDb(), edge = this.getEdge();
        if ((!db && !edge) || !clanId) return { ok: false, error: 'Cloud unavailable.' };
        if (this.clanId && this.currentClan) return { ok: false, error: 'You are already in a Clan!' };
        const cdMs = (typeof CLAN_REJOIN_COOLDOWN_MS !== 'undefined') ? CLAN_REJOIN_COOLDOWN_MS : 86400000;
        const leftAgo = Date.now() - (this.lastLeftAt || 0);
        if (this.lastLeftAt > 0 && leftAgo < cdMs) return { ok: false, error: `Clan Cooldown active — wait ${Math.ceil((cdMs - leftAgo) / 3600000)}h before joining a new Clan.` };

        const me = this.getMyPlayerMeta();
        try {
            let outcome = 'joined', joinedDoc = null;
            const maxMemEst = (typeof ClanConfigHelper !== 'undefined') ? ClanConfigHelper.getMaxMembersForLevel(10) : 30;
            const er = await this._postEdgeClan(clanId, 'join', { me, maxMembers: maxMemEst });
            if (er && !er.fallback) {
                if (!er.ok) return { ok: false, error: er.error || 'Unable to join Clan.' };
                outcome = er.outcome || 'joined'; joinedDoc = er.clan || null;
            } else {
                await db.runTransaction(async (tx) => {
                    const ref = db.collection('clans').doc(clanId), snap = await tx.get(ref);
                    if (!snap.exists) throw new Error('Clan no longer exists.');
                    const data = snap.data() || {}, lvl = (typeof ClanConfigHelper !== 'undefined') ? ClanConfigHelper.getLevelFromXp(data.xp || 0).level : 1;
                    const maxMem = (typeof ClanConfigHelper !== 'undefined') ? ClanConfigHelper.getMaxMembersForLevel(lvl) : 12;
                    const members = { ...(data.members || {}) };
                    if (members[me.uid]) { joinedDoc = { id: clanId, ...data }; return; }
                    if (Object.keys(members).length >= maxMem) throw new Error('Clan roster is full!');
                    if (data.joinMode === 'request') {
                        const reqs = { ...(data.joinRequests || {}), [me.uid]: { uid: me.uid, name: me.name, tag: me.tag, hero: me.hero, level: me.level, requestedAt: Date.now() } };
                        tx.update(ref, { joinRequests: reqs }); outcome = 'requested'; return;
                    }
                    members[me.uid] = { uid: me.uid, name: me.name, tag: me.tag, hero: me.hero, level: me.level, role: 'member', contributedPoints: 0, weeklyContrib: 0, joinedAt: Date.now() };
                    const log = [`${me.name} joined the Clan!`, ...((data.activityLog || []).slice(0, 9))];
                    tx.update(ref, { members, memberCount: Object.keys(members).length, activityLog: log });
                    joinedDoc = { id: clanId, ...data, members, memberCount: Object.keys(members).length, activityLog: log };
                });
            }
            if (outcome === 'joined' && joinedDoc) { this.clanId = clanId; this.currentClan = joinedDoc; this.saveLocal(); await this._syncPlayerClanBadge(joinedDoc); this.bindClanListener(); this._emitUpdate(); }
            return { ok: true, outcome };
        } catch (err) { return { ok: false, error: this._describeError(err) }; }
    }

    async respondJoinRequest(targetUid, accept) {
        const db = this.getDb(), edge = this.getEdge(), me = this.getMyPlayerMeta();
        if ((!db && !edge) || !this.clanId || !targetUid) return { ok: false, error: 'Unavailable.' };
        try {
            const er = await this._postEdgeClan(this.clanId, 'respond', { me, targetUid, accept });
            if (er && !er.fallback) {
                if (!er.ok) return { ok: false, error: er.error || 'Failed.' };
                if (er.clan) { this.currentClan = er.clan; this._emitUpdate(); }
                return { ok: true };
            }
            await db.runTransaction(async (tx) => {
                const ref = db.collection('clans').doc(this.clanId), snap = await tx.get(ref);
                if (!snap.exists) throw new Error('Clan missing.');
                const data = snap.data() || {}, myRole = data.members && data.members[me.uid] && data.members[me.uid].role;
                if (myRole !== 'leader' && myRole !== 'officer' && myRole !== 'co_leader') throw new Error('Only Leaders or Officers can review requests.');
                const reqs = { ...(data.joinRequests || {}) }, req = reqs[targetUid]; delete reqs[targetUid];
                if (!accept || !req) { tx.update(ref, { joinRequests: reqs }); return; }
                const members = { ...(data.members || {}), [targetUid]: { uid: targetUid, name: req.name, tag: req.tag, hero: req.hero, level: req.level, role: 'member', contributedPoints: 0, weeklyContrib: 0, joinedAt: Date.now() } };
                tx.update(ref, { joinRequests: reqs, members, memberCount: Object.keys(members).length, activityLog: [`${req.name} joined the Clan!`, ...((data.activityLog || []).slice(0, 9))] });
            });
            return { ok: true };
        } catch (err) { return { ok: false, error: this._describeError(err) }; }
    }

    async donateToVault(resourceId, rawQty) {
        return (typeof ClanVaultService !== 'undefined') ? ClanVaultService.donateToVault(this, resourceId, rawQty) : { ok: false, error: 'Vault service unavailable.' };
    }

    async claimWeeklyBounty(bountyId) {
        return (typeof ClanVaultService !== 'undefined') ? ClanVaultService.claimWeeklyBounty(this, bountyId) : { ok: false, error: 'Vault service unavailable.' };
    }

    async leaveClan() {
        const db = this.getDb(), edge = this.getEdge(), me = this.getMyPlayerMeta();
        if ((!db && !edge) || !this.clanId) return { ok: false, error: 'Not in a Clan.' };
        try {
            let deleted = false;
            const er = await this._postEdgeClan(this.clanId, 'leave', { me });
            if (er && !er.fallback) {
                if (!er.ok) return { ok: false, error: er.error || 'Leave failed.' };
                deleted = Boolean(er.deleted);
            } else {
                await db.runTransaction(async (tx) => {
                    const ref = db.collection('clans').doc(this.clanId), snap = await tx.get(ref);
                    if (!snap.exists) { deleted = true; return; }
                    const data = snap.data() || {}, members = { ...(data.members || {}) };
                    delete members[me.uid];
                    const remUids = Object.keys(members);
                    if (remUids.length === 0) { tx.delete(ref); deleted = true; return; }
                    let nextLeader = data.leaderUid;
                    if (data.leaderUid === me.uid) { remUids.sort((a, b) => (members[b].contributedPoints || 0) - (members[a].contributedPoints || 0)); nextLeader = remUids[0]; members[nextLeader] = { ...members[nextLeader], role: 'leader' }; }
                    const patch = { members, memberCount: remUids.length, activityLog: [`${me.name} left the Clan.`, ...((data.activityLog || []).slice(0, 9))] };
                    if (nextLeader !== data.leaderUid) patch.leaderUid = nextLeader;
                    tx.update(ref, patch);
                });
            }
            this.clanId = null; this.currentClan = null; this.lastLeftAt = deleted ? 0 : Date.now(); this.saveLocal();
            await this._syncPlayerClanBadge(null); this.bindClanListener(); this._emitUpdate();
            return { ok: true };
        } catch (err) { return { ok: false, error: this._describeError(err) }; }
    }

    async kickMember(targetUid) {
        const db = this.getDb(), edge = this.getEdge(), me = this.getMyPlayerMeta();
        if ((!db && !edge) || !this.clanId || !targetUid || targetUid === me.uid) return { ok: false, error: 'Invalid target.' };
        try {
            const er = await this._postEdgeClan(this.clanId, 'kick', { me, targetUid });
            if (er && !er.fallback) { if (!er.ok) return { ok: false, error: er.error }; if (er.clan) { this.currentClan = er.clan; this._emitUpdate(); } return { ok: true }; }
            await db.runTransaction(async (tx) => {
                const ref = db.collection('clans').doc(this.clanId), snap = await tx.get(ref);
                if (!snap.exists) throw new Error('Clan missing.');
                const data = snap.data() || {}, members = { ...(data.members || {}) }, actor = members[me.uid], target = members[targetUid];
                if (!target) return;
                const myRank = ClanConfigHelper.getRoleRank(actor && actor.role), tRank = ClanConfigHelper.getRoleRank(target.role);
                if (myRank < 3 || myRank <= tRank) throw new Error('Insufficient Clan rank to remove this member.');
                delete members[targetUid];
                tx.update(ref, { members, memberCount: Object.keys(members).length, activityLog: [`${target.name} was removed from the Clan.`, ...((data.activityLog || []).slice(0, 9))] });
            });
            return { ok: true };
        } catch (err) { return { ok: false, error: this._describeError(err) }; }
    }

    async changeMemberRole(targetUid, direction = 1) {
        const db = this.getDb(), edge = this.getEdge(), me = this.getMyPlayerMeta();
        if ((!db && !edge) || !this.clanId || !targetUid || targetUid === me.uid) return { ok: false, error: 'Invalid member target.' };
        const order = ['member', 'officer', 'co_leader'];
        try {
            const er = await this._postEdgeClan(this.clanId, 'role', { me, targetUid, direction });
            if (er && !er.fallback) {
                if (!er.ok) return { ok: false, error: er.error || 'Role update failed.' };
                if (er.clan) { this.currentClan = er.clan; this._emitUpdate(); }
                return { ok: true, role: er.role, name: er.name };
            }
            let resultRole = 'member', targetName = 'Member';
            await db.runTransaction(async (tx) => {
                const ref = db.collection('clans').doc(this.clanId), snap = await tx.get(ref);
                if (!snap.exists) throw new Error('Clan missing.');
                const data = snap.data() || {}, members = { ...(data.members || {}) }, actor = members[me.uid], target = members[targetUid];
                if (!actor || !target) throw new Error('Member not found.');
                const actorRank = ClanConfigHelper.getRoleRank(actor.role), targetRank = ClanConfigHelper.getRoleRank(target.role);
                if (actorRank < 3) throw new Error('Only Leaders or Co-Leaders can adjust roles.');
                if (targetRank >= actorRank) throw new Error('You cannot alter a member of equal or higher rank.');
                const nextIdx = Math.max(0, order.indexOf(target.role || 'member')) + (direction > 0 ? 1 : -1);
                if (nextIdx < 0 || nextIdx >= order.length) throw new Error(direction > 0 ? 'Max promotable role reached.' : 'Already at lowest rank.');
                const nextRole = order[nextIdx];
                if (ClanConfigHelper.getRoleRank(nextRole) >= actorRank) throw new Error('Only the Leader can promote to Co-Leader.');
                members[targetUid] = { ...target, role: nextRole }; resultRole = nextRole; targetName = target.name || 'Member';
                const log = [`${me.name} ${direction > 0 ? 'promoted' : 'demoted'} ${targetName} to ${ClanConfigHelper.getRoleMeta(nextRole).label}!`, ...((data.activityLog || []).slice(0, 9))];
                tx.update(ref, { members, activityLog: log });
            });
            return { ok: true, role: resultRole, name: targetName };
        } catch (err) { return { ok: false, error: this._describeError(err) }; }
    }

    async transferLeadership(targetUid) {
        const db = this.getDb(), edge = this.getEdge(), me = this.getMyPlayerMeta();
        if ((!db && !edge) || !this.clanId || !targetUid || targetUid === me.uid) return { ok: false, error: 'Invalid target.' };
        try {
            const er = await this._postEdgeClan(this.clanId, 'transfer', { me, targetUid });
            if (er && !er.fallback) { if (!er.ok) return { ok: false, error: er.error }; if (er.clan) { this.currentClan = er.clan; this._emitUpdate(); } return { ok: true, name: er.name }; }
            let newName = 'Member';
            await db.runTransaction(async (tx) => {
                const ref = db.collection('clans').doc(this.clanId), snap = await tx.get(ref);
                if (!snap.exists) throw new Error('Clan missing.');
                const data = snap.data() || {};
                if (data.leaderUid !== me.uid) throw new Error('Only the current Leader can transfer Leadership.');
                const members = { ...(data.members || {}) };
                if (!members[targetUid]) throw new Error('Member not found.');
                members[me.uid] = { ...members[me.uid], role: 'co_leader' }; members[targetUid] = { ...members[targetUid], role: 'leader' };
                newName = members[targetUid].name || 'Member';
                tx.update(ref, { leaderUid: targetUid, members, activityLog: [`👑 ${me.name} passed Clan Leadership to ${newName}!`, ...((data.activityLog || []).slice(0, 9))] });
            });
            return { ok: true, name: newName };
        } catch (err) { return { ok: false, error: this._describeError(err) }; }
    }

    async updateMotto(newMotto) {
        const db = this.getDb(), edge = this.getEdge(), clean = String(newMotto || '').trim().slice(0, 72);
        if ((!db && !edge) || !this.clanId || !this.currentClan) return { ok: false, error: 'Unavailable.' };
        try {
            const er = await this._postEdgeClan(this.clanId, 'motto', { me: this.getMyPlayerMeta(), motto: clean });
            if (er && !er.fallback) { if (!er.ok) return { ok: false, error: er.error }; if (er.clan) { this.currentClan = er.clan; this._emitUpdate(); } return { ok: true }; }
            await db.collection('clans').doc(this.clanId).update({ motto: clean });
            return { ok: true };
        } catch (err) { return { ok: false, error: this._describeError(err) }; }
    }

    bindGameplayEvents() {
        if (typeof ClanVaultService !== 'undefined') ClanVaultService.bindGameplayEvents(this);
    }

    async flushPendingBounties() {
        if (typeof ClanVaultService !== 'undefined') return ClanVaultService.flushPendingBounties(this);
    }

    static boot() {
        if (typeof window === 'undefined') return null;
        if (!window.clanService) {
            window.clanService = new ClanService();
            window.clanService.start();
        }
        if (!window.clansModal && typeof ClansModal !== 'undefined') {
            window.clansModal = new ClansModal(window.clanService);
        }
        return window.clanService;
    }
}

if (typeof window !== 'undefined') window.ClanService = ClanService;
