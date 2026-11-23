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
        const db = this.getDb();
        const uid = this.getMyUid();
        if (!db || !uid) return;
        try {
            const pDoc = await db.collection('players').doc(uid).get();
            if (pDoc && pDoc.exists) {
                const pData = pDoc.data() || {};
                if (typeof pData.clanId === 'string' && pData.clanId !== (this.clanId || '')) {
                    this.clanId = pData.clanId || null;
                    this.saveLocal();
                }
            }
        } catch (_) {}
    }

    async _syncPlayerClanBadge(clanDoc = null) {
        const db = this.getDb();
        const uid = this.getMyUid();
        if (!db || !uid) return;
        try {
            await db.collection('players').doc(uid).set({
                clanId: clanDoc ? clanDoc.id : null,
                clanTag: clanDoc ? clanDoc.tag : null,
                clanName: clanDoc ? clanDoc.name : null
            }, { merge: true });
        } catch (_) {}
    }

    bindClanListener() {
        if (this._unsubClan) {
            try { this._unsubClan(); } catch (_) {}
            this._unsubClan = null;
        }
        const db = this.getDb();
        if (!db || !this.clanId) {
            this.currentClan = null;
            this._emitUpdate();
            return;
        }
        this._unsubClan = db.collection('clans').doc(this.clanId).onSnapshot((doc) => {
            if (!doc || !doc.exists) {
                this.clanId = null;
                this.currentClan = null;
                this.saveLocal();
                this._emitUpdate();
                return;
            }
            const data = { id: doc.id, ...doc.data() };
            const uid = this.getMyUid();
            if (uid && (!data.members || !data.members[uid])) {
                this.clanId = null;
                this.currentClan = null;
                this.saveLocal();
                this._syncPlayerClanBadge(null);
            } else {
                this.currentClan = data;
            }
            this._emitUpdate();
        }, (err) => {
            this.lastError = this._describeError(err);
        });
    }

    async fetchBrowseClans() {
        const db = this.getDb();
        if (!db) return { ok: false, error: 'Connect to internet/cloud to browse Clans.', clans: [] };
        try {
            const snap = await db.collection('clans').orderBy('xp', 'desc').limit(25).get();
            const list = [];
            snap.forEach((doc) => {
                if (doc.exists) list.push({ id: doc.id, ...doc.data() });
            });
            this.browseList = list;
            this._emitUpdate();
            return { ok: true, clans: list };
        } catch (err) {
            const msg = this._describeError(err);
            return { ok: false, error: msg, clans: [] };
        }
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
        const db = this.getDb();
        if (!db) return { ok: false, error: 'Cloud connection required to register your Clan online.' };

        const me = this.getMyPlayerMeta();
        if (!me.uid) return { ok: false, error: 'Player identity missing — reload and try again.' };

        try {
            const dupTag = await db.collection('clans').where('tag', '==', v.tag).limit(1).get();
            if (!dupTag.empty) return { ok: false, error: `Clan Tag [${v.tag}] is already taken!` };

            const clanId = `clan_${v.tag.toLowerCase()}_${Date.now().toString(36)}`;
            const weekKey = (typeof ClanConfigHelper !== 'undefined') ? ClanConfigHelper.getIsoWeekKey() : '2026-W01';
            const cleanMotto = String(motto || 'Forged in Lesa.io • No Leeches Allowed').trim().slice(0, 72);
            const clanPayload = {
                id: clanId,
                name: v.name,
                nameLower: v.name.toLowerCase(),
                tag: v.tag,
                emblemId,
                colorId,
                motto: cleanMotto,
                joinMode: joinMode === 'request' ? 'request' : 'open',
                leaderUid: me.uid,
                xp: 0,
                level: 1,
                memberCount: 1,
                createdAt: Date.now(),
                vault: { coins: 0, armory_shards: 0, mati_crystal: 0, olympian_bronze: 0 },
                bounties: { [weekKey]: { endless_waves: 0, zeus_defeats: 0, coop_kills: 0, vault_tributes: 0 } },
                members: {
                    [me.uid]: {
                        uid: me.uid, name: me.name, tag: me.tag, hero: me.hero, level: me.level,
                        role: 'leader', contributedPoints: 0, weeklyContrib: 0, joinedAt: Date.now()
                    }
                },
                joinRequests: {},
                activityLog: [`${me.name} founded [${v.tag}] ${v.name}!`]
            };

            await db.collection('clans').doc(clanId).set(clanPayload);

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
        const db = this.getDb();
        if (!db || !clanId) return { ok: false, error: 'Cloud unavailable.' };
        if (this.clanId && this.currentClan) return { ok: false, error: 'You are already in a Clan!' };

        const cdMs = (typeof CLAN_REJOIN_COOLDOWN_MS !== 'undefined') ? CLAN_REJOIN_COOLDOWN_MS : 86400000;
        const leftAgo = Date.now() - (this.lastLeftAt || 0);
        if (this.lastLeftAt > 0 && leftAgo < cdMs) {
            const hrsLeft = Math.ceil((cdMs - leftAgo) / 3600000);
            return { ok: false, error: `Clan Cooldown active — wait ${hrsLeft}h before joining a new Clan.` };
        }

        const me = this.getMyPlayerMeta();
        try {
            let outcome = 'joined';
            let joinedDoc = null;
            await db.runTransaction(async (tx) => {
                const ref = db.collection('clans').doc(clanId);
                const snap = await tx.get(ref);
                if (!snap.exists) throw new Error('Clan no longer exists.');
                const data = snap.data() || {};
                const lvl = (typeof ClanConfigHelper !== 'undefined') ? ClanConfigHelper.getLevelFromXp(data.xp || 0).level : 1;
                const maxMem = (typeof ClanConfigHelper !== 'undefined') ? ClanConfigHelper.getMaxMembersForLevel(lvl) : 12;
                const members = { ...(data.members || {}) };
                if (members[me.uid]) { joinedDoc = { id: clanId, ...data }; return; }
                if (Object.keys(members).length >= maxMem) throw new Error('Clan roster is full!');

                if (data.joinMode === 'request') {
                    const reqs = { ...(data.joinRequests || {}) };
                    reqs[me.uid] = { uid: me.uid, name: me.name, tag: me.tag, hero: me.hero, level: me.level, requestedAt: Date.now() };
                    tx.update(ref, { joinRequests: reqs });
                    outcome = 'requested';
                    return;
                }

                members[me.uid] = {
                    uid: me.uid, name: me.name, tag: me.tag, hero: me.hero, level: me.level,
                    role: 'member', contributedPoints: 0, weeklyContrib: 0, joinedAt: Date.now()
                };
                const log = [`${me.name} joined the Clan!`, ...((data.activityLog || []).slice(0, 9))];
                tx.update(ref, { members, memberCount: Object.keys(members).length, activityLog: log });
                joinedDoc = { id: clanId, ...data, members, memberCount: Object.keys(members).length, activityLog: log };
            });

            if (outcome === 'joined' && joinedDoc) {
                this.clanId = clanId;
                this.currentClan = joinedDoc;
                this.saveLocal();
                await this._syncPlayerClanBadge(joinedDoc);
                this.bindClanListener();
                this._emitUpdate();
            }
            return { ok: true, outcome };
        } catch (err) {
            return { ok: false, error: this._describeError(err) };
        }
    }

    async respondJoinRequest(targetUid, accept) {
        const db = this.getDb();
        const me = this.getMyPlayerMeta();
        if (!db || !this.clanId || !targetUid) return { ok: false, error: 'Unavailable.' };
        try {
            await db.runTransaction(async (tx) => {
                const ref = db.collection('clans').doc(this.clanId);
                const snap = await tx.get(ref);
                if (!snap.exists) throw new Error('Clan missing.');
                const data = snap.data() || {};
                const myRole = data.members && data.members[me.uid] && data.members[me.uid].role;
                if (myRole !== 'leader' && myRole !== 'officer') throw new Error('Only Leaders or Officers can review requests.');

                const reqs = { ...(data.joinRequests || {}) };
                const req = reqs[targetUid];
                delete reqs[targetUid];
                if (!accept || !req) {
                    tx.update(ref, { joinRequests: reqs });
                    return;
                }
                const members = { ...(data.members || {}) };
                members[targetUid] = {
                    uid: targetUid, name: req.name, tag: req.tag, hero: req.hero, level: req.level,
                    role: 'member', contributedPoints: 0, weeklyContrib: 0, joinedAt: Date.now()
                };
                const log = [`${req.name} joined the Clan!`, ...((data.activityLog || []).slice(0, 9))];
                tx.update(ref, { joinRequests: reqs, members, memberCount: Object.keys(members).length, activityLog: log });
            });
            return { ok: true };
        } catch (err) {
            return { ok: false, error: this._describeError(err) };
        }
    }

    async donateToVault(resourceId, rawQty) {
        return (typeof ClanVaultService !== 'undefined') ? ClanVaultService.donateToVault(this, resourceId, rawQty) : { ok: false, error: 'Vault service unavailable.' };
    }

    async claimWeeklyBounty(bountyId) {
        return (typeof ClanVaultService !== 'undefined') ? ClanVaultService.claimWeeklyBounty(this, bountyId) : { ok: false, error: 'Vault service unavailable.' };
    }

    async leaveClan() {
        const db = this.getDb();
        const me = this.getMyPlayerMeta();
        if (!db || !this.clanId) return { ok: false, error: 'Not in a Clan.' };
        try {
            let deleted = false;
            await db.runTransaction(async (tx) => {
                const ref = db.collection('clans').doc(this.clanId);
                const snap = await tx.get(ref);
                if (!snap.exists) { deleted = true; return; }
                const data = snap.data() || {};
                const members = { ...(data.members || {}) };
                delete members[me.uid];
                const remUids = Object.keys(members);
                if (remUids.length === 0) {
                    tx.delete(ref);
                    deleted = true;
                    return;
                }
                let nextLeader = data.leaderUid;
                if (data.leaderUid === me.uid) {
                    remUids.sort((a, b) => (members[b].contributedPoints || 0) - (members[a].contributedPoints || 0));
                    nextLeader = remUids[0];
                    members[nextLeader] = { ...members[nextLeader], role: 'leader' };
                }
                const log = [`${me.name} left the Clan.`, ...((data.activityLog || []).slice(0, 9))];
                const patch = { members, memberCount: remUids.length, activityLog: log };
                if (nextLeader !== data.leaderUid) patch.leaderUid = nextLeader;
                tx.update(ref, patch);
            });
            this.clanId = null;
            this.currentClan = null;
            this.lastLeftAt = deleted ? 0 : Date.now();
            this.saveLocal();
            await this._syncPlayerClanBadge(null);
            this.bindClanListener();
            this._emitUpdate();
            return { ok: true };
        } catch (err) {
            return { ok: false, error: this._describeError(err) };
        }
    }

    async kickMember(targetUid) {
        const db = this.getDb();
        const me = this.getMyPlayerMeta();
        if (!db || !this.clanId || !targetUid || targetUid === me.uid) return { ok: false, error: 'Invalid target.' };
        try {
            await db.runTransaction(async (tx) => {
                const ref = db.collection('clans').doc(this.clanId);
                const snap = await tx.get(ref);
                if (!snap.exists) throw new Error('Clan missing.');
                const data = snap.data() || {};
                const members = { ...(data.members || {}) };
                const actor = members[me.uid];
                const target = members[targetUid];
                if (!target) return;
                const myRank = ClanConfigHelper.getRoleRank(actor && actor.role);
                const tRank = ClanConfigHelper.getRoleRank(target.role);
                if (myRank < 3 || myRank <= tRank) throw new Error('Insufficient Clan rank to remove this member.');
                delete members[targetUid];
                const log = [`${target.name} was removed from the Clan.`, ...((data.activityLog || []).slice(0, 9))];
                tx.update(ref, { members, memberCount: Object.keys(members).length, activityLog: log });
            });
            return { ok: true };
        } catch (err) {
            return { ok: false, error: this._describeError(err) };
        }
    }

    async changeMemberRole(targetUid, direction = 1) {
        const db = this.getDb();
        const me = this.getMyPlayerMeta();
        if (!db || !this.clanId || !targetUid || targetUid === me.uid) return { ok: false, error: 'Invalid member target.' };
        const order = ['member', 'officer', 'co_leader'];
        try {
            let resultRole = 'member';
            let targetName = 'Member';
            await db.runTransaction(async (tx) => {
                const ref = db.collection('clans').doc(this.clanId);
                const snap = await tx.get(ref);
                if (!snap.exists) throw new Error('Clan missing.');
                const data = snap.data() || {};
                const members = { ...(data.members || {}) };
                const actor = members[me.uid];
                const target = members[targetUid];
                if (!actor || !target) throw new Error('Member not found.');
                const actorRank = ClanConfigHelper.getRoleRank(actor.role);
                const targetRank = ClanConfigHelper.getRoleRank(target.role);
                if (actorRank < 3) throw new Error('Only Leaders or Co-Leaders can adjust roles.');
                if (targetRank >= actorRank) throw new Error('You cannot alter a member of equal or higher rank.');

                const curIdx = Math.max(0, order.indexOf(target.role || 'member'));
                const nextIdx = curIdx + (direction > 0 ? 1 : -1);
                if (nextIdx < 0 || nextIdx >= order.length) throw new Error(direction > 0 ? 'Max promotable role reached.' : 'Already at lowest rank.');
                const nextRole = order[nextIdx];
                if (ClanConfigHelper.getRoleRank(nextRole) >= actorRank) throw new Error('Only the Leader can promote to Co-Leader.');

                members[targetUid] = { ...target, role: nextRole };
                resultRole = nextRole;
                targetName = target.name || 'Member';
                const verb = direction > 0 ? 'promoted' : 'demoted';
                const roleLabel = ClanConfigHelper.getRoleMeta(nextRole).label;
                const log = [`${me.name} ${verb} ${targetName} to ${roleLabel}!`, ...((data.activityLog || []).slice(0, 9))];
                tx.update(ref, { members, activityLog: log });
            });
            return { ok: true, role: resultRole, name: targetName };
        } catch (err) {
            return { ok: false, error: this._describeError(err) };
        }
    }

    async transferLeadership(targetUid) {
        const db = this.getDb();
        const me = this.getMyPlayerMeta();
        if (!db || !this.clanId || !targetUid || targetUid === me.uid) return { ok: false, error: 'Invalid target.' };
        try {
            let newName = 'Member';
            await db.runTransaction(async (tx) => {
                const ref = db.collection('clans').doc(this.clanId);
                const snap = await tx.get(ref);
                if (!snap.exists) throw new Error('Clan missing.');
                const data = snap.data() || {};
                if (data.leaderUid !== me.uid) throw new Error('Only the current Leader can transfer Leadership.');
                const members = { ...(data.members || {}) };
                if (!members[targetUid]) throw new Error('Member not found.');
                members[me.uid] = { ...members[me.uid], role: 'co_leader' };
                members[targetUid] = { ...members[targetUid], role: 'leader' };
                newName = members[targetUid].name || 'Member';
                const log = [`👑 ${me.name} passed Clan Leadership to ${newName}!`, ...((data.activityLog || []).slice(0, 9))];
                tx.update(ref, { leaderUid: targetUid, members, activityLog: log });
            });
            return { ok: true, name: newName };
        } catch (err) {
            return { ok: false, error: this._describeError(err) };
        }
    }

    async updateMotto(newMotto) {
        const db = this.getDb();
        if (!db || !this.clanId || !this.currentClan) return { ok: false, error: 'Unavailable.' };
        const clean = String(newMotto || '').trim().slice(0, 72);
        try {
            await db.collection('clans').doc(this.clanId).update({ motto: clean });
            return { ok: true };
        } catch (err) {
            return { ok: false, error: this._describeError(err) };
        }
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
