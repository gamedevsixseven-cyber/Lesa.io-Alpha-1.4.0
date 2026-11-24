/**
 * Lesa.io - Clan Buffs Engine, Honor Crest Shop & Weekly Clan Chest (V1.1.0 Phase 2)
 * Applies live Clan passive bonuses across Combat, Gold, XP, Chests, Materials & Co-op Synergy,
 * and handles Honor Crest purchases & Sunday Weekly Clan Chest rewards.
 */

class ClanBuffs {
    static BANNER_STORAGE_KEY = 'lesaio_clan_unlocked_banners_v1';
    static WEEKLY_CHEST_KEY = 'lesaio_clan_weekly_chest_claimed_v1';

    static _getClan() {
        return (typeof window !== 'undefined' && window.clanService && window.clanService.currentClan)
            ? window.clanService.currentClan : null;
    }

    static getClanLevel() {
        const clan = this._getClan();
        if (!clan || typeof ClanConfigHelper === 'undefined') return 0;
        return ClanConfigHelper.getLevelFromXp(clan.xp || 0).level;
    }

    static isCoopClanmate() {
        const clan = this._getClan();
        if (!clan || typeof window === 'undefined') return false;
        const g = window.gameInstance;
        const net = (g && g.coopSession && g.coopSession.net) || window.networkManager;
        if (!net || !net.connected || !net.peerUserData) return false;
        return Boolean(net.peerUserData.clanId && net.peerUserData.clanId === clan.id);
    }

    static getPerkValue(perkKey) {
        const lv = this.getClanLevel();
        if (lv <= 0 || typeof CLAN_LEVEL_PERKS === 'undefined') return 0;
        const def = CLAN_LEVEL_PERKS.find(p => p.key === perkKey);
        if (!def || !Array.isArray(def.values)) return 0;
        return def.values[Math.min(def.values.length - 1, lv - 1)] || 0;
    }

    static getActiveVaultBoosters(clan = this._getClan()) {
        const active = (clan && clan.activeBoosters && typeof clan.activeBoosters === 'object') ? clan.activeBoosters : {};
        const now = Date.now(), out = [];
        if (typeof CLAN_VAULT_BOOSTERS === 'undefined') return out;
        CLAN_VAULT_BOOSTERS.forEach((def) => {
            const exp = Number(active[def.id]) || 0;
            if (exp > now) out.push({ def, expiresAt: exp, remainingMs: exp - now });
        });
        return out;
    }

    static getActiveBoosterSum(field) {
        return this.getActiveVaultBoosters().reduce((sum, entry) => {
            const val = entry.def && entry.def.effects ? Number(entry.def.effects[field]) || 0 : 0;
            return sum + val;
        }, 0);
    }

    static getDamageMultiplier() {
        const basePct = this.getPerkValue('war_banner');
        const coopBonus = (basePct > 0 && this.isCoopClanmate()) ? 5 : 0;
        return 1 + (basePct + coopBonus + this.getActiveBoosterSum('damagePct')) / 100;
    }

    static getMaxHpMultiplier() {
        const basePct = this.getPerkValue('stamina_reserve');
        const coopBonus = (basePct > 0 && this.isCoopClanmate()) ? 5 : 0;
        return 1 + (basePct + coopBonus + this.getActiveBoosterSum('hpPct')) / 100;
    }

    static getGoldMultiplier() {
        return 1 + (this.getPerkValue('golden_tithe') + this.getActiveBoosterSum('goldPct')) / 100;
    }

    static getXpMultiplier() {
        return 1 + (this.getPerkValue('golden_tithe') + this.getActiveBoosterSum('xpPct')) / 100;
    }

    static getChestCoinsMultiplier() {
        return 1 + (this.getPerkValue('salvage_mastery') + this.getActiveBoosterSum('chestCoinsPct')) / 100;
    }

    static getMaterialLuckBonus() {
        return (this.getPerkValue('salvage_mastery') + this.getActiveBoosterSum('matLuckPct')) / 100;
    }

    static getPurchasedBanners() {
        if (typeof localStorage === 'undefined') return [];
        try {
            const raw = localStorage.getItem(this.BANNER_STORAGE_KEY);
            const arr = raw ? JSON.parse(raw) : [];
            return Array.isArray(arr) ? arr : [];
        } catch (_) { return []; }
    }

    static hasBanner(bannerId) {
        return this.getPurchasedBanners().includes(bannerId);
    }

    static _saveBannerUnlock(bannerId) {
        const list = Array.from(new Set([...this.getPurchasedBanners(), bannerId]));
        if (typeof localStorage !== 'undefined') localStorage.setItem(this.BANNER_STORAGE_KEY, JSON.stringify(list));
        if (typeof CosmeticManager !== 'undefined') {
            CosmeticManager.syncUnlocks({ silent: false, syncRemote: true });
        }
    }

    static buyShopItem(svc, itemId) {
        if (!svc || !svc.clanId || !svc.currentClan) return { ok: false, error: 'Join or found a Clan first.' };
        const item = (typeof CLAN_SHOP_ITEMS !== 'undefined') ? CLAN_SHOP_ITEMS.find(i => i.id === itemId) : null;
        if (!item) return { ok: false, error: 'Unknown Clan Shop item.' };
        if (item.kind === 'banner' && this.hasBanner(item.bannerId)) return { ok: false, error: 'Banner already unlocked!' };
        if ((svc.honorCrests || 0) < item.cost) return { ok: false, error: `Need ${item.cost} Honor Crests.` };

        if (item.kind === 'chest') {
            if (typeof window === 'undefined' || !window.chestManager) return { ok: false, error: 'Chest system unavailable.' };
            const res = window.chestManager.addChest(item.chestType);
            if (!res) return { ok: false, error: 'Could not deliver Chest right now.' };
        } else if (item.kind === 'material') {
            if (typeof window === 'undefined' || !window.inventoryManager) return { ok: false, error: 'Inventory unavailable.' };
            window.inventoryManager.addMaterials({ [item.matId]: item.qty }, { source: 'clan_shop' });
        } else if (item.kind === 'evo_stone') {
            if (typeof GearUpgradeManager === 'undefined') return { ok: false, error: 'Forge Manager unavailable.' };
            GearUpgradeManager.addEvolutionStones(item.qty || 1);
        } else if (item.kind === 'banner') {
            this._saveBannerUnlock(item.bannerId);
        }

        svc.honorCrests = Math.max(0, (svc.honorCrests || 0) - item.cost);
        svc.saveLocal();
        svc._emitUpdate();
        return { ok: true, item };
    }

    static getWeeklyChestState(svc) {
        const clan = svc && svc.currentClan;
        const weekKey = ClanConfigHelper.getIsoWeekKey();
        const bounties = (clan && clan.bounties && clan.bounties[weekKey]) || {};
        let completedCount = 0;
        if (typeof CLAN_WEEKLY_BOUNTIES !== 'undefined') {
            CLAN_WEEKLY_BOUNTIES.forEach(b => { if ((bounties[b.id] || 0) >= b.target) completedCount++; });
        }
        const tiers = typeof CLAN_WEEKLY_CHEST_TIERS !== 'undefined' ? CLAN_WEEKLY_CHEST_TIERS : [];
        const tier = tiers.find(t => completedCount >= t.minBounties) || tiers[tiers.length - 1];
        const claimedWeek = typeof localStorage !== 'undefined' ? localStorage.getItem(this.WEEKLY_CHEST_KEY) : '';
        const isSundayUtc = new Date().getUTCDay() === 0;
        const me = svc ? svc.getMyPlayerMeta() : { uid: '' };
        const myPts = (clan && clan.members && clan.members[me.uid] && clan.members[me.uid].weeklyContrib) || 0;
        return {
            weekKey, completedCount, tier,
            alreadyClaimed: claimedWeek === weekKey,
            isSundayUtc,
            myPts,
            canClaim: Boolean(clan && isSundayUtc && claimedWeek !== weekKey && myPts >= tier.minWeeklyPts)
        };
    }

    static claimWeeklyChest(svc) {
        const st = this.getWeeklyChestState(svc);
        if (!svc || !svc.currentClan) return { ok: false, error: 'No Clan joined.' };
        if (!st.isSundayUtc) return { ok: false, error: 'Weekly Clan War Chest unlocks every Sunday (UTC)!' };
        if (st.alreadyClaimed) return { ok: false, error: 'Weekly Clan War Chest already claimed this week!' };
        if (st.myPts < st.tier.minWeeklyPts) return { ok: false, error: `Anti-Leech: Earn ${st.tier.minWeeklyPts} weekly pts first (${st.myPts}/${st.tier.minWeeklyPts}).` };

        if (typeof window !== 'undefined' && window.chestManager) window.chestManager.addChest(st.tier.chestType);
        if (typeof window !== 'undefined' && window.GameState) window.GameState.addCurrency(0, st.tier.gemsBonus);
        svc.honorCrests = (svc.honorCrests || 0) + st.tier.crestsBonus;
        if (typeof localStorage !== 'undefined') localStorage.setItem(this.WEEKLY_CHEST_KEY, st.weekKey);
        svc.saveLocal();
        svc._emitUpdate();
        return { ok: true, tier: st.tier };
    }
}

if (typeof window !== 'undefined') window.ClanBuffs = ClanBuffs;
