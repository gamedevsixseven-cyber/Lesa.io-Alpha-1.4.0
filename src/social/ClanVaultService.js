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
            if (db && !clanClaimed.includes(rewardClaimKey)) {
                await db.collection('clans').doc(svc.clanId).update({
                    xp: firebase.firestore.FieldValue.increment(def.rewardXp),
                    claimedXpKeys: firebase.firestore.FieldValue.arrayUnion(rewardClaimKey)
                });
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

    static bindGameplayEvents(svc) {
        if (typeof window === 'undefined' || !window.EventBus) return;
        window.EventBus.on('waveCompleted', ({ isDungeon }) => {
            if (!svc.clanId) return;
            const g = window.gameInstance;
            if (g && g.gameMode === 'endless' && !isDungeon) {
                svc._pendingBounties.endless_waves = (svc._pendingBounties.endless_waves || 0) + 1;
                svc.saveLocal();
                this.scheduleBountyFlush(svc);
            }
        });
        window.EventBus.on('combatFeatsUpdated', ({ bossId }) => {
            if (!svc.clanId || bossId !== 'zeus') return;
            svc._pendingBounties.zeus_defeats = (svc._pendingBounties.zeus_defeats || 0) + 1;
            svc.saveLocal();
            this.scheduleBountyFlush(svc, 400);
        });
        window.EventBus.on('enemyKilled', () => {
            if (!svc.clanId) return;
            const g = window.gameInstance;
            if (g && g.coopSession && !g.isCoopGuest) {
                svc._pendingBounties.coop_kills = (svc._pendingBounties.coop_kills || 0) + 1;
                if (svc._pendingBounties.coop_kills % 50 === 0) svc.saveLocal();
            }
        });
        window.EventBus.on('gameOver', () => this.flushPendingBounties(svc));
    }

    static scheduleBountyFlush(svc, delayMs = 2500) {
        if (svc._bountyFlushTimer) return;
        svc._bountyFlushTimer = setTimeout(() => {
            svc._bountyFlushTimer = null;
            this.flushPendingBounties(svc);
        }, delayMs);
    }

    static async flushPendingBounties(svc) {
        const db = svc.getDb();
        const p = svc._pendingBounties;
        if (!db || !svc.clanId || (!p.endless_waves && !p.zeus_defeats && !p.coop_kills)) return;
        const delta = { ...p };
        svc._pendingBounties = { endless_waves: 0, zeus_defeats: 0, coop_kills: 0 };
        svc.saveLocal();

        const weekKey = ClanConfigHelper.getIsoWeekKey();
        const me = svc.getMyPlayerMeta();
        const contribPts = (delta.endless_waves * 4) + (delta.zeus_defeats * 30) + Math.floor(delta.coop_kills / 25);
        try {
            const updates = {};
            if (delta.endless_waves > 0) updates[`bounties.${weekKey}.endless_waves`] = firebase.firestore.FieldValue.increment(delta.endless_waves);
            if (delta.zeus_defeats > 0) updates[`bounties.${weekKey}.zeus_defeats`] = firebase.firestore.FieldValue.increment(delta.zeus_defeats);
            if (delta.coop_kills > 0) updates[`bounties.${weekKey}.coop_kills`] = firebase.firestore.FieldValue.increment(delta.coop_kills);
            if (contribPts > 0 && me.uid) {
                updates[`members.${me.uid}.weeklyContrib`] = firebase.firestore.FieldValue.increment(contribPts);
                updates[`members.${me.uid}.contributedPoints`] = firebase.firestore.FieldValue.increment(contribPts);
            }
            if (Object.keys(updates).length > 0) await db.collection('clans').doc(svc.clanId).update(updates);
        } catch (_) {
            svc._pendingBounties.endless_waves += delta.endless_waves;
            svc._pendingBounties.zeus_defeats += delta.zeus_defeats;
            svc._pendingBounties.coop_kills += delta.coop_kills;
            svc.saveLocal();
        }
    }
}

if (typeof window !== 'undefined') window.ClanVaultService = ClanVaultService;
