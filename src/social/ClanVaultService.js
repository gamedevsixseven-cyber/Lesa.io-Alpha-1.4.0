/**
 * Lesa.io - Clan Tax Vault & Shared Weekly Bounties Service (V1.1.0)
 * Handles daily capped Vault donations (Coins, Armory Shards, Mati Crystal, Olympian Bronze),
 * EventBus-driven gameplay progress tracking, batched Firestore bounty sync, and claims.
 */

class ClanVaultService {
    static async donateToVault(svc, resourceId, rawQty) {
        const db = svc.getDb();
        if (!db || !svc.clanId || !svc.currentClan) return { ok: false, error: 'Join or create a Clan first.' };
        const cfg = (typeof CLAN_VAULT_RESOURCES !== 'undefined') ? CLAN_VAULT_RESOURCES.find(r => r.id === resourceId) : null;
        if (!cfg) return { ok: false, error: 'Unknown Vault resource.' };

        const qty = Math.floor(Number(rawQty) || 0);
        if (qty <= 0 || qty % cfg.unitAmount !== 0) return { ok: false, error: `Donate in multiples of ${cfg.unitAmount.toLocaleString()}.` };
        const remCap = svc.getRemainingDailyCap(resourceId);
        if (qty > remCap) return { ok: false, error: `Exceeds daily cap (${remCap.toLocaleString()} left today).` };

        const gs = (typeof window !== 'undefined' && window.GameState) ? window.GameState : null;
        const inv = (typeof window !== 'undefined' && window.inventoryManager) ? window.inventoryManager : null;
        if (cfg.kind === 'currency') {
            if (!gs || (gs.player.coins || 0) < qty) return { ok: false, error: 'Not enough Gold Coins.' };
        } else {
            if (!inv || !inv.hasMaterials({ [resourceId]: qty })) return { ok: false, error: `Not enough ${cfg.name}.` };
        }

        const units = qty / cfg.unitAmount;
        const xpGain = Math.round(units * cfg.xpPerUnit);
        const contribGain = Math.round(units * cfg.contribPerUnit);
        const weekKey = ClanConfigHelper.getIsoWeekKey();
        const me = svc.getMyPlayerMeta();

        try {
            const edge = (typeof svc.getEdge === 'function') ? svc.getEdge() : null;
            let donatedViaEdge = false;
            if (edge) {
                const res = await svc._postEdgeClan(svc.clanId, 'donate', {
                    me, resourceId, qty, xpGain, contribGain, weekKey, shortName: cfg.shortName
                });
                if (res && !res.fallback) {
                    if (!res.ok) return { ok: false, error: res.error || 'Donation failed.' };
                    if (res.clan) { svc.currentClan = res.clan; svc.saveLocal(); }
                    donatedViaEdge = true;
                }
            }
            if (!donatedViaEdge) {
                await db.runTransaction(async (tx) => {
                    const ref = db.collection('clans').doc(svc.clanId);
                    const snap = await tx.get(ref);
                    if (!snap.exists) throw new Error('Clan not found.');
                    const data = snap.data() || {};
                    const vault = { ...(data.vault || {}) };
                    vault[resourceId] = (vault[resourceId] || 0) + qty;

                    const newXp = (data.xp || 0) + xpGain;
                    const newLvl = ClanConfigHelper.getLevelFromXp(newXp).level;
                    const members = { ...(data.members || {}) };
                    const prevMem = members[me.uid] || { uid: me.uid, name: me.name, tag: me.tag, hero: me.hero, role: 'member', joinedAt: Date.now() };
                    members[me.uid] = {
                        ...prevMem, name: me.name, level: me.level, hero: me.hero,
                        contributedPoints: (prevMem.contributedPoints || 0) + contribGain,
                        weeklyContrib: (prevMem.weeklyContrib || 0) + contribGain
                    };

                    const bounties = { ...(data.bounties || {}) };
                    const wk = { ...(bounties[weekKey] || {}) };
                    wk.vault_tributes = (wk.vault_tributes || 0) + contribGain;
                    bounties[weekKey] = wk;

                    const log = [`${me.name} vaulted ${qty.toLocaleString()} ${cfg.shortName} (+${contribGain} pts)`, ...((data.activityLog || []).slice(0, 9))];
                    tx.update(ref, { vault, xp: newXp, level: newLvl, members, bounties, activityLog: log });
                });
            }

            if (cfg.kind === 'currency') {
                gs.spendCoins(qty);
                gs.save();
            } else {
                inv.consumeMaterials({ [resourceId]: qty }, { source: 'clan_vault', clanId: svc.clanId });
            }

            svc._ensureTodayReset();
            svc.dailyDonations.counts[resourceId] = (svc.dailyDonations.counts[resourceId] || 0) + qty;
            svc.saveLocal();
            svc._emitUpdate();
            return { ok: true, xpGain, contribGain };
        } catch (err) {
            return { ok: false, error: svc._describeError(err) };
        }
    }

    static async claimWeeklyBounty(svc, bountyId) {
        if (!svc.currentClan || !svc.clanId) return { ok: false, error: 'No Clan joined.' };
        const def = (typeof CLAN_WEEKLY_BOUNTIES !== 'undefined') ? CLAN_WEEKLY_BOUNTIES.find(b => b.id === bountyId) : null;
        if (!def) return { ok: false, error: 'Unknown bounty.' };
        const weekKey = ClanConfigHelper.getIsoWeekKey();
        const prog = (((svc.currentClan.bounties || {})[weekKey] || {})[bountyId]) || 0;
        if (prog < def.target) return { ok: false, error: 'Bounty target not reached yet.' };

        const claimed = svc.claimedBounties[weekKey] || [];
        if (claimed.includes(bountyId)) return { ok: false, error: 'Already claimed this week.' };

        const me = svc.getMyPlayerMeta();
        const mem = (svc.currentClan.members || {})[me.uid];
        if (!mem || (mem.weeklyContrib || 0) < def.minContribToClaim) {
            return { ok: false, error: `Anti-Leech Guard: Earn ${def.minContribToClaim} weekly Contribution Pts first.` };
        }

        const db = svc.getDb();
        try {
            const rewardClaimKey = `${weekKey}_${bountyId}`;
            const clanClaimed = Array.isArray(svc.currentClan.claimedXpKeys) ? svc.currentClan.claimedXpKeys : [];
            if (!clanClaimed.includes(rewardClaimKey)) {
                let doneEdge = false;
                if (typeof svc.getEdge === 'function' && svc.getEdge()) {
                    const er = await svc._postEdgeClan(svc.clanId, 'claim-bounty', { me, rewardClaimKey, rewardXp: def.rewardXp });
                    if (er && !er.fallback && er.ok) { if (er.clan) svc.currentClan = er.clan; doneEdge = true; }
                }
                if (!doneEdge && db) {
                    await db.collection('clans').doc(svc.clanId).update({
                        xp: firebase.firestore.FieldValue.increment(def.rewardXp),
                        claimedXpKeys: firebase.firestore.FieldValue.arrayUnion(rewardClaimKey)
                    });
                }
            }
            svc.honorCrests += def.rewardCrests;
            svc.claimedBounties[weekKey] = [...claimed, bountyId];
            svc.saveLocal();
            svc._emitUpdate();
            return { ok: true, crests: def.rewardCrests, xp: def.rewardXp };
        } catch (err) {
            return { ok: false, error: svc._describeError(err) };
        }
    }

    static async activateBooster(svc, boosterId) {
        if (!svc || !svc.clanId || !svc.currentClan) return { ok: false, error: 'Join or create a Clan first.' };
        const def = (typeof CLAN_VAULT_BOOSTERS !== 'undefined') ? CLAN_VAULT_BOOSTERS.find(b => b.id === boosterId) : null;
        if (!def) return { ok: false, error: 'Unknown Booster.' };
        const me = svc.getMyPlayerMeta();
        const mem = (svc.currentClan.members && svc.currentClan.members[me.uid]) || {};
        if (ClanConfigHelper.getRoleRank(mem.role) < 2) return { ok: false, error: 'Only Officers, Co-Leaders, or Leaders can activate Vault Boosters.' };
        const now = Date.now(), curExp = Number((svc.currentClan.activeBoosters || {})[def.id]) || 0;
        if (curExp > now) return { ok: false, error: `${def.name} is already active!` };
        const vault = svc.currentClan.vault || {};
        for (const [resId, amt] of Object.entries(def.cost || {})) {
            if ((Number(vault[resId]) || 0) < amt) return { ok: false, error: `Not enough ${resId.replace(/_/g, ' ')} in Clan Vault.` };
        }
        try {
            const edge = (typeof svc.getEdge === 'function') ? svc.getEdge() : null;
            if (edge) {
                const er = await svc._postEdgeClan(svc.clanId, 'activate-booster', {
                    me, boosterId: def.id, boosterName: def.name, summary: def.summary, durationMs: def.durationMs, cost: def.cost
                });
                if (er && !er.fallback) {
                    if (!er.ok) return { ok: false, error: er.error || 'Activation failed.' };
                    if (er.clan) { svc.currentClan = er.clan; svc.saveLocal(); svc._emitUpdate(); }
                    return { ok: true, booster: def };
                }
            }
            const db = svc.getDb();
            if (!db) return { ok: false, error: 'Cloud unavailable.' };
            await db.runTransaction(async (tx) => {
                const ref = db.collection('clans').doc(svc.clanId), snap = await tx.get(ref);
                if (!snap.exists) throw new Error('Clan not found.');
                const data = snap.data() || {}, v = { ...(data.vault || {}) }, act = { ...(data.activeBoosters || {}) };
                if ((Number(act[def.id]) || 0) > Date.now()) throw new Error('This Booster is already active!');
                for (const [r, amt] of Object.entries(def.cost || {})) {
                    if ((Number(v[r]) || 0) < amt) throw new Error(`Not enough ${r.replace(/_/g, ' ')} in Vault.`);
                    v[r] = (Number(v[r]) || 0) - amt;
                }
                act[def.id] = Date.now() + def.durationMs;
                const log = [`⚡ ${me.name} activated ${def.name} (${def.summary}) for 2h!`, ...((data.activityLog || []).slice(0, 9))];
                tx.update(ref, { vault: v, activeBoosters: act, xp: (Number(data.xp) || 0) + 50, activityLog: log });
            });
            svc._emitUpdate();
            return { ok: true, booster: def };
        } catch (err) {
            return { ok: false, error: svc._describeError(err) };
        }
    }

    static bindGameplayEvents(svc) {
        if (typeof window === 'undefined' || !window.EventBus || !svc || svc._gameplayBound) return;
        svc._gameplayBound = true;
        let lastRunTimeAwarded = 0, runTimePts = 0;
        const cfg = (typeof CLAN_PLAYTIME_REWARDS !== 'undefined')
            ? CLAN_PLAYTIME_REWARDS
            : { perWavePts: 1, perWaveXp: 2, runFinishPts: 2, runFinishXp: 4, playtimeStepSec: 120, playtimeMaxPtsPerRun: 8 };

        window.EventBus.on('waveCompleted', ({ wave, isDungeon } = {}) => {
            if (!svc.clanId) return;
            const g = window.gameInstance;
            if (g && g.gameMode === 'endless' && !isDungeon) {
                svc._pendingBounties.endless_waves = (svc._pendingBounties.endless_waves || 0) + 1;
            }
            // Slow passive Clan Points + XP for advancing waves & surviving over time (never per kill)
            svc._pendingBounties.play_pts = (svc._pendingBounties.play_pts || 0) + cfg.perWavePts;
            svc._pendingBounties.play_xp = (svc._pendingBounties.play_xp || 0) + cfg.perWaveXp;
            if (g && g.gameMode === 'story' && !isDungeon && wave >= 20) {
                svc._pendingBounties.play_pts += cfg.runFinishPts;
                svc._pendingBounties.play_xp += cfg.runFinishXp;
            }
            const gt = (g && Number(g.gameTime)) || 0;
            if (gt < lastRunTimeAwarded) { lastRunTimeAwarded = 0; runTimePts = 0; }
            while (runTimePts < cfg.playtimeMaxPtsPerRun && (gt - lastRunTimeAwarded) >= cfg.playtimeStepSec) {
                lastRunTimeAwarded += cfg.playtimeStepSec;
                runTimePts += 1;
                svc._pendingBounties.play_pts += 1;
                svc._pendingBounties.play_xp += cfg.perWaveXp;
            }
            svc.saveLocal();
            this.scheduleBountyFlush(svc);
        });
        window.EventBus.on('combatFeatsUpdated', ({ bossId }) => {
            if (!svc.clanId || bossId !== 'zeus') return;
            svc._pendingBounties.zeus_defeats = (svc._pendingBounties.zeus_defeats || 0) + 1;
            svc.saveLocal();
            this.scheduleBountyFlush(svc, 5000);
        });
        window.EventBus.on('enemyKilled', () => {
            if (!svc.clanId) return;
            const g = window.gameInstance;
            if (g && g.coopSession && !g.isCoopGuest) {
                svc._pendingBounties.coop_kills = (svc._pendingBounties.coop_kills || 0) + 1;
                if (svc._pendingBounties.coop_kills % 50 === 0) svc.saveLocal();
            }
        });
        window.EventBus.on('gameOver', (info) => {
            if (svc.clanId && ((info && info.wave >= 2) || (window.gameInstance && window.gameInstance.gameTime >= 60))) {
                svc._pendingBounties.play_pts = (svc._pendingBounties.play_pts || 0) + cfg.runFinishPts;
                svc._pendingBounties.play_xp = (svc._pendingBounties.play_xp || 0) + cfg.runFinishXp;
            }
            lastRunTimeAwarded = 0; runTimePts = 0;
            this.flushPendingBounties(svc);
        });
        if (typeof document !== 'undefined' && !svc._visFlushBound) {
            svc._visFlushBound = true;
            document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') this.flushPendingBounties(svc); });
        }
    }

    static scheduleBountyFlush(svc, delayMs = 45000) {
        if (svc._bountyFlushTimer) return;
        svc._bountyFlushTimer = setTimeout(() => {
            svc._bountyFlushTimer = null;
            this.flushPendingBounties(svc);
        }, delayMs);
    }

    static async flushPendingBounties(svc) {
        const db = svc.getDb();
        const edge = (typeof svc.getEdge === 'function') ? svc.getEdge() : null;
        const p = svc._pendingBounties;
        if ((!db && !edge) || !svc.clanId || (!p.endless_waves && !p.zeus_defeats && !p.coop_kills && !p.play_pts)) return;
        const delta = { ...p };
        svc._pendingBounties = { endless_waves: 0, zeus_defeats: 0, coop_kills: 0, play_pts: 0, play_xp: 0 };
        svc.saveLocal();

        const weekKey = ClanConfigHelper.getIsoWeekKey();
        const me = svc.getMyPlayerMeta();
        const bountyPts = (delta.endless_waves * 4) + (delta.zeus_defeats * 30) + Math.floor(delta.coop_kills / 25);
        const totalPts = bountyPts + (delta.play_pts || 0);
        try {
            if (edge) {
                const er = await svc._postEdgeClan(svc.clanId, 'bounties', {
                    me, weekKey, endless_waves: delta.endless_waves, zeus_defeats: delta.zeus_defeats, coop_kills: delta.coop_kills,
                    contribPts: bountyPts, playPts: delta.play_pts || 0, playXp: delta.play_xp || 0
                });
                if (er && !er.fallback && er.ok) { if (er.clan) { svc.currentClan = er.clan; svc._emitUpdate(); } return; }
            }
            const updates = {};
            if (delta.endless_waves > 0) updates[`bounties.${weekKey}.endless_waves`] = firebase.firestore.FieldValue.increment(delta.endless_waves);
            if (delta.zeus_defeats > 0) updates[`bounties.${weekKey}.zeus_defeats`] = firebase.firestore.FieldValue.increment(delta.zeus_defeats);
            if (delta.coop_kills > 0) updates[`bounties.${weekKey}.coop_kills`] = firebase.firestore.FieldValue.increment(delta.coop_kills);
            if ((delta.play_xp || 0) > 0) updates.xp = firebase.firestore.FieldValue.increment(delta.play_xp);
            if (totalPts > 0 && me.uid) {
                updates[`members.${me.uid}.weeklyContrib`] = firebase.firestore.FieldValue.increment(totalPts);
                updates[`members.${me.uid}.contributedPoints`] = firebase.firestore.FieldValue.increment(totalPts);
            }
            if (db && Object.keys(updates).length > 0) await db.collection('clans').doc(svc.clanId).update(updates);
        } catch (_) {
            svc._pendingBounties.endless_waves += delta.endless_waves;
            svc._pendingBounties.zeus_defeats += delta.zeus_defeats;
            svc._pendingBounties.coop_kills += delta.coop_kills;
            svc._pendingBounties.play_pts += (delta.play_pts || 0);
            svc._pendingBounties.play_xp += (delta.play_xp || 0);
            svc.saveLocal();
        }
    }
}

if (typeof window !== 'undefined') window.ClanVaultService = ClanVaultService;
