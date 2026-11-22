/**
 * Lesa.io - Season 1 Battle Pass Progression & Dual-Track Reward Manager
 * Supports both Free Track rewards (available to everyone) and Paid Premium Track
 * rewards (unlocked across all 20 tiers via a one-time Gem Pass purchase).
 */

class BattlePassManager {
    static STORAGE_KEY = 'lesaio_battle_pass_s1';
    static SEASON_ID = 'season_1';
    static BASE_XP_PER_TIER = 200;
    static XP_STEP_PER_TIER = 50;
    static XP_PER_TIER = 200;
    static MAX_TIER = 30;
    static SKIP_TIER_GEM_COST = 40;
    static PASS_GEM_COST = 500;

    /** XP required to advance from `tier` to `tier + 1` (each tier costs +50 more XP). */
    static getXpForNextTier(tier) {
        const t = Math.max(1, Math.min(BattlePassManager.MAX_TIER - 1, Math.floor(Number(tier) || 1)));
        return BattlePassManager.BASE_XP_PER_TIER + (t - 1) * BattlePassManager.XP_STEP_PER_TIER;
    }

    /** Cumulative XP required to unlock `targetTier` (Tier 1 = 0, Tier 2 = 200, Tier 3 = 450, ..., Tier 30 = 26,100). */
    static getXpToReachTier(targetTier) {
        const steps = Math.max(0, Math.min(BattlePassManager.MAX_TIER, Math.floor(Number(targetTier) || 1)) - 1);
        return (steps * BattlePassManager.BASE_XP_PER_TIER)
            + (BattlePassManager.XP_STEP_PER_TIER * steps * (steps - 1)) / 2;
    }

    static getMaxXp() {
        return BattlePassManager.getXpToReachTier(BattlePassManager.MAX_TIER);
    }

    static TIERS = [
        {
            tier: 1,
            free: { type: 'gold', amount: 300, label: '300 GOLD', sub: 'Starter Coins', rarity: 'common', icon: 'assets/ui-icons/coin.svg' },
            paid: { type: 'gold', amount: 1200, label: '1,200 GOLD', sub: 'VIP Bonus Treasury', rarity: 'uncommon', icon: 'assets/ui-icons/coin.svg' }
        },
        {
            tier: 2,
            free: { type: 'chest', chestType: 'common', label: 'COMMON CHEST', sub: 'Starter Supply Crate', rarity: 'common', icon: 'assets/Chests/CommonChest.png' },
            paid: { type: 'chest', chestType: 'uncommon', label: 'UNCOMMON CHEST', sub: 'Bonus VIP Crate', rarity: 'uncommon', icon: 'assets/Chests/UncommonChest.png' }
        },
        {
            tier: 3,
            free: { type: 'gems', amount: 10, label: '10 GEMS', sub: 'Free Gem Pouch', rarity: 'uncommon', icon: 'assets/ui-icons/gem.svg' },
            paid: { type: 'gems', amount: 25, label: '25 GEMS', sub: 'VIP Gem Cache', rarity: 'rare', icon: 'assets/ui-icons/gem.svg' }
        },
        {
            tier: 4,
            free: { type: 'gold', amount: 500, label: '500 GOLD', sub: 'Village Allowance', rarity: 'common', icon: 'assets/ui-icons/coin.svg' },
            paid: { type: 'weapon', weaponId: 'rusty_smg', label: 'STREET UZI', sub: 'New Uncommon SMG', rarity: 'uncommon', icon: 'assets/WeaponIcons/StreetUzi.png' }
        },
        {
            tier: 5,
            free: { type: 'chest', chestType: 'uncommon', label: 'UNCOMMON CHEST', sub: 'Free Upgrade Crate', rarity: 'uncommon', icon: 'assets/Chests/UncommonChest.png' },
            paid: { type: 'skin', heroId: 'psanas', skinId: 'cyber_neon', label: 'CYBER NEON PSANAS', sub: 'Exclusive Hero Skin', rarity: 'epic', icon: 'assets/HeroesIcons/PsanasAvatar.png' }
        },
        {
            tier: 6,
            free: { type: 'gold', amount: 650, label: '650 GOLD', sub: 'Combat Pay', rarity: 'common', icon: 'assets/ui-icons/coin.svg' },
            paid: { type: 'gold', amount: 1800, label: '1,800 GOLD', sub: 'Warlord Stash', rarity: 'uncommon', icon: 'assets/ui-icons/coin.svg' }
        },
        {
            tier: 7,
            free: { type: 'gems', amount: 15, label: '15 GEMS', sub: 'Sparkling Shards', rarity: 'uncommon', icon: 'assets/ui-icons/gem.svg' },
            paid: { type: 'chest', chestType: 'rare', label: 'RARE CHEST', sub: 'Guaranteed Rare Gear', rarity: 'rare', icon: 'assets/Chests/RareChest.png' }
        },
        {
            tier: 8,
            free: { type: 'chest', chestType: 'common', label: 'COMMON CHEST', sub: 'Supply Drop', rarity: 'common', icon: 'assets/Chests/CommonChest.png' },
            paid: { type: 'gems', amount: 35, label: '35 GEMS', sub: 'VIP Gem Vault', rarity: 'rare', icon: 'assets/ui-icons/gem.svg' }
        },
        {
            tier: 9,
            free: { type: 'gold', amount: 850, label: '850 GOLD', sub: 'Battle Bounty', rarity: 'common', icon: 'assets/ui-icons/coin.svg' },
            paid: { type: 'weapon', weaponId: 'nail_gun', label: 'VILLAGE NAILGUN', sub: 'New Uncommon Nailer', rarity: 'uncommon', icon: 'assets/WeaponIcons/VillageNailgun.png' }
        },
        {
            tier: 10,
            free: { type: 'chest', chestType: 'rare', label: 'RARE CHEST', sub: 'Mid-Season Milestone', rarity: 'rare', icon: 'assets/Chests/RareChest.png' },
            paid: { type: 'skin', heroId: 'psogas', skinId: 'inferno_flame', label: 'INFERNO PSOGAS', sub: 'Fiery Hero Skin', rarity: 'epic', icon: 'assets/HeroesIcons/PsogasAvatar.png' }
        },
        {
            tier: 11,
            free: { type: 'gold', amount: 1000, label: '1,000 GOLD', sub: 'Arena Purse', rarity: 'uncommon', icon: 'assets/ui-icons/coin.svg' },
            paid: { type: 'gold', amount: 2500, label: '2,500 GOLD', sub: 'Elite Coin Hoard', rarity: 'rare', icon: 'assets/ui-icons/coin.svg' }
        },
        {
            tier: 12,
            free: { type: 'gems', amount: 20, label: '20 GEMS', sub: 'Village Crystals', rarity: 'uncommon', icon: 'assets/ui-icons/gem.svg' },
            paid: { type: 'chest', chestType: 'rare', label: 'RARE CHEST', sub: 'Armory Drop', rarity: 'rare', icon: 'assets/Chests/RareChest.png' }
        },
        {
            tier: 13,
            free: { type: 'chest', chestType: 'uncommon', label: 'UNCOMMON CHEST', sub: 'Veteran Crate', rarity: 'uncommon', icon: 'assets/Chests/UncommonChest.png' },
            paid: { type: 'gems', amount: 45, label: '45 GEMS', sub: 'Royal Crystal Bundle', rarity: 'rare', icon: 'assets/ui-icons/gem.svg' }
        },
        {
            tier: 14,
            free: { type: 'gold', amount: 1200, label: '1,200 GOLD', sub: 'Golden Reserve', rarity: 'uncommon', icon: 'assets/ui-icons/coin.svg' },
            paid: { type: 'weapon', weaponId: 'plasma_pistol', label: 'NEON ARC PISTOL', sub: 'New Rare Plasma Gun', rarity: 'rare', icon: 'assets/WeaponIcons/NeonArcPistol.png' }
        },
        {
            tier: 15,
            free: { type: 'chest', chestType: 'rare', label: 'RARE CHEST', sub: 'Free Tier 15 Crate', rarity: 'rare', icon: 'assets/Chests/RareChest.png' },
            paid: { type: 'skin', heroId: 'petros', skinId: 'biker_midnight', label: 'BIKER MIDNIGHT PETROS', sub: 'Stealth Moto Skin', rarity: 'epic', icon: 'assets/HeroesIcons/PetrosAvatar.png' }
        },
        {
            tier: 16,
            free: { type: 'gold', amount: 1500, label: '1,500 GOLD', sub: 'Champion Bag', rarity: 'uncommon', icon: 'assets/ui-icons/coin.svg' },
            paid: { type: 'gold', amount: 4000, label: '4,000 GOLD', sub: 'Grand Treasury', rarity: 'rare', icon: 'assets/ui-icons/coin.svg' }
        },
        {
            tier: 17,
            free: { type: 'gems', amount: 25, label: '25 GEMS', sub: 'Endgame Shards', rarity: 'rare', icon: 'assets/ui-icons/gem.svg' },
            paid: { type: 'chest', chestType: 'epic', label: 'EPIC CHEST', sub: 'Guaranteed Epic Gear', rarity: 'epic', icon: 'assets/Chests/EpicChest.png' }
        },
        {
            tier: 18,
            free: { type: 'chest', chestType: 'uncommon', label: 'UNCOMMON CHEST', sub: 'Field Supply', rarity: 'uncommon', icon: 'assets/Chests/UncommonChest.png' },
            paid: { type: 'gems', amount: 65, label: '65 GEMS', sub: 'Imperator Gem Chest', rarity: 'epic', icon: 'assets/ui-icons/gem.svg' }
        },
        {
            tier: 19,
            free: { type: 'gold', amount: 2000, label: '2,000 GOLD', sub: 'Pre-Finale Bonus', rarity: 'rare', icon: 'assets/ui-icons/coin.svg' },
            paid: { type: 'weapon', weaponId: 'sawnoff_shotgun', label: 'SAWN-OFF SHOTGUN', sub: 'New Rare Double-Barrel', rarity: 'rare', icon: 'assets/WeaponIcons/SawnOffShotgun.png' }
        },
        {
            tier: 20,
            free: { type: 'chest', chestType: 'epic', label: 'EPIC CHEST', sub: 'Free Tier 20 Crate', rarity: 'epic', icon: 'assets/Chests/EpicChest.png' },
            paid: { type: 'skin', heroId: '50balos', skinId: 'gold_drip', bonusChest: 'legendary', label: '24K GOLD 50BALOS', sub: '24K Skin + Legendary Chest', rarity: 'legendary', icon: 'assets/HeroesIcons/50balosCrop.png' }
        },
        {
            tier: 21,
            free: { type: 'gold', amount: 2200, label: '2,200 GOLD', sub: 'Extended War Treasury', rarity: 'rare', icon: 'assets/ui-icons/coin.svg' },
            paid: { type: 'gold', amount: 5000, label: '5,000 GOLD', sub: 'Olympian Coin Vault', rarity: 'epic', icon: 'assets/ui-icons/coin.svg' }
        },
        {
            tier: 22,
            free: { type: 'gems', amount: 30, label: '30 GEMS', sub: 'Free Shards Cache', rarity: 'rare', icon: 'assets/ui-icons/gem.svg' },
            paid: { type: 'gems', amount: 75, label: '75 GEMS', sub: 'Cosmic Gem Pouch', rarity: 'epic', icon: 'assets/ui-icons/gem.svg' }
        },
        {
            tier: 23,
            free: { type: 'chest', chestType: 'rare', label: 'RARE CHEST', sub: 'Veteran Supply Crate', rarity: 'rare', icon: 'assets/Chests/RareChest.png' },
            paid: { type: 'chest', chestType: 'epic', label: 'EPIC CHEST', sub: 'Guaranteed Epic Drop', rarity: 'epic', icon: 'assets/Chests/EpicChest.png' }
        },
        {
            tier: 24,
            free: { type: 'gold', amount: 2500, label: '2,500 GOLD', sub: 'Titan War Bounty', rarity: 'rare', icon: 'assets/ui-icons/coin.svg' },
            paid: { type: 'gold', amount: 6500, label: '6,500 GOLD', sub: 'Titan Royal Purse', rarity: 'epic', icon: 'assets/ui-icons/coin.svg' }
        },
        {
            tier: 25,
            free: { type: 'chest', chestType: 'epic', label: 'EPIC CHEST', sub: 'Free Tier 25 Crate', rarity: 'epic', icon: 'assets/Chests/EpicChest.png' },
            paid: { type: 'weapon', weaponId: 'frost_cannon', label: 'CRYO VORTEX CANNON', sub: 'Unique Epic Frost Blaster', rarity: 'epic', icon: 'assets/WeaponIcons/CryoVortexCannon.png' }
        },
        {
            tier: 26,
            free: { type: 'gold', amount: 3000, label: '3,000 GOLD', sub: 'Champion Stash', rarity: 'rare', icon: 'assets/ui-icons/coin.svg' },
            paid: { type: 'gems', amount: 90, label: '90 GEMS', sub: 'Celestial Gem Vault', rarity: 'epic', icon: 'assets/ui-icons/gem.svg' }
        },
        {
            tier: 27,
            free: { type: 'gems', amount: 35, label: '35 GEMS', sub: 'Endgame Crystal Pack', rarity: 'epic', icon: 'assets/ui-icons/gem.svg' },
            paid: { type: 'chest', chestType: 'epic', label: 'EPIC CHEST', sub: 'VIP Armory Crate', rarity: 'epic', icon: 'assets/Chests/EpicChest.png' }
        },
        {
            tier: 28,
            free: { type: 'chest', chestType: 'rare', label: 'RARE CHEST', sub: 'Pre-Finale Supply', rarity: 'rare', icon: 'assets/Chests/RareChest.png' },
            paid: { type: 'chest', chestType: 'legendary', label: 'LEGENDARY CHEST', sub: 'Guaranteed Legendary Gear', rarity: 'legendary', icon: 'assets/Chests/LegendaryChest.png' }
        },
        {
            tier: 29,
            free: { type: 'gold', amount: 4000, label: '4,000 GOLD', sub: 'Finale Gold Reserve', rarity: 'epic', icon: 'assets/ui-icons/coin.svg' },
            paid: { type: 'gems', amount: 125, label: '125 GEMS', sub: 'Grand Finale Gem Hoard', rarity: 'legendary', icon: 'assets/ui-icons/gem.svg' }
        },
        {
            tier: 30,
            free: { type: 'gems', amount: 50, label: '50 GEMS', sub: 'Free Season Finale Gems', rarity: 'epic', icon: 'assets/ui-icons/gem.svg' },
            paid: { type: 'skin', heroId: 'psgiannhs', skinId: 'olympian_celestial', label: 'CELESTIAL TITAN PSGIANNHS', sub: 'Tier 30 Astral Halo Finale Skin', rarity: 'legendary', icon: 'assets/HeroesIcons/PsgiannhsAvatar.png' }
        }
    ];

    constructor() {
        this.xp = 0;
        this.hasPremium = false;
        this.claimedFree = [];
        this.claimedPremium = [];
        this._eventsBound = false;
        this.load();
        this.bindProgressionEvents();
        this.updateMenuCard();
    }

    _sanitizeTierArray(arr) {
        if (!Array.isArray(arr)) return [];
        return Array.from(new Set(arr.map(n => parseInt(n, 10)).filter(n => n >= 1 && n <= BattlePassManager.MAX_TIER)));
    }

    load() {
        try {
            const raw = localStorage.getItem(BattlePassManager.STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return;
            this.xp = Math.max(0, Math.floor(Number(parsed.xp) || 0));
            this.hasPremium = Boolean(parsed.hasPremium);
            if (Array.isArray(parsed.claimedFree) || Array.isArray(parsed.claimedPremium)) {
                this.claimedFree = this._sanitizeTierArray(parsed.claimedFree);
                this.claimedPremium = this._sanitizeTierArray(parsed.claimedPremium);
            } else if (Array.isArray(parsed.claimedTiers)) {
                // Legacy single-track save migration: preserve prior claims cleanly without auto-granting unpaid VIP rewards
                this.claimedFree = this._sanitizeTierArray(parsed.claimedTiers);
                this.claimedPremium = [];
            }
        } catch (_) {}
    }

    save() {
        const state = this.getState();
        try {
            localStorage.setItem(BattlePassManager.STORAGE_KEY, JSON.stringify(state));
        } catch (_) {}
        if (typeof window !== 'undefined' && window.GameState && window.GameState.player) {
            window.GameState.player.battlePass = state;
        }
        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.emit('battlePassUpdated', state);
        }
        this.updateMenuCard();
    }

    getState() {
        return {
            season: BattlePassManager.SEASON_ID,
            xp: this.xp,
            hasPremium: this.hasPremium,
            claimedFree: [...this.claimedFree],
            claimedPremium: [...this.claimedPremium]
        };
    }

    applyState(state) {
        if (!state || typeof state !== 'object') return;
        this.xp = Math.max(this.xp, Math.floor(Number(state.xp) || 0));
        this.hasPremium = this.hasPremium || Boolean(state.hasPremium);
        const freeIn = Array.isArray(state.claimedFree) ? state.claimedFree : (Array.isArray(state.claimedTiers) ? state.claimedTiers : []);
        const paidIn = Array.isArray(state.claimedPremium) ? state.claimedPremium : [];
        this.claimedFree = this._sanitizeTierArray([...this.claimedFree, ...freeIn]);
        this.claimedPremium = this._sanitizeTierArray([...this.claimedPremium, ...paidIn]);

        this._ensureTrackUnlocks(this.claimedFree, 'free');
        this._ensureTrackUnlocks(this.claimedPremium, 'paid');

        try {
            localStorage.setItem(BattlePassManager.STORAGE_KEY, JSON.stringify(this.getState()));
        } catch (_) {}
        this.updateMenuCard();
    }

    _ensureTrackUnlocks(tiers, track) {
        for (const t of tiers) {
            const entry = BattlePassManager.TIERS.find(item => item.tier === t);
            const r = entry ? entry[track] : null;
            if (!r) continue;
            if (r.type === 'weapon' && typeof WeaponSystem !== 'undefined' && !WeaponSystem.isWeaponUnlocked(r.weaponId)) {
                WeaponSystem.unlockWeapon(r.weaponId, { silent: true });
            } else if (r.type === 'skin' && typeof HeroSkinSystem !== 'undefined' && !HeroSkinSystem.isSkinUnlocked(r.heroId, r.skinId)) {
                HeroSkinSystem.unlockSkin(r.heroId, r.skinId);
            }
        }
    }

    getCurrentTier() {
        let tier = 1;
        for (let t = 2; t <= BattlePassManager.MAX_TIER; t++) {
            if (this.xp >= BattlePassManager.getXpToReachTier(t)) tier = t;
            else break;
        }
        return tier;
    }

    getTierProgress() {
        const tier = this.getCurrentTier();
        if (tier >= BattlePassManager.MAX_TIER) {
            const finalStep = BattlePassManager.getXpForNextTier(BattlePassManager.MAX_TIER - 1);
            return { tier, intoTier: finalStep, needed: finalStep, pct: 100 };
        }
        const tierStart = BattlePassManager.getXpToReachTier(tier);
        const needed = BattlePassManager.getXpForNextTier(tier);
        const intoTier = Math.max(0, this.xp - tierStart);
        const pct = Math.min(100, Math.round((intoTier / needed) * 100));
        return { tier, intoTier, needed, pct };
    }

    getClaimableRewards() {
        const cur = this.getCurrentTier();
        const free = BattlePassManager.TIERS.filter(e => e.tier <= cur && !this.claimedFree.includes(e.tier)).map(e => e.tier);
        const paid = this.hasPremium
            ? BattlePassManager.TIERS.filter(e => e.tier <= cur && !this.claimedPremium.includes(e.tier)).map(e => e.tier)
            : [];
        return { free, paid, total: free.length + paid.length };
    }

    getClaimableTiers() {
        return this.getClaimableRewards().free;
    }

    addXp(amount, source = 'gameplay') {
        const gain = Math.max(0, Math.floor(Number(amount) || 0));
        if (gain <= 0) return;
        const maxXp = BattlePassManager.getMaxXp();
        const prevTier = this.getCurrentTier();
        this.xp = Math.min(maxXp, this.xp + gain);
        this.save();
        const newTier = this.getCurrentTier();
        if (newTier > prevTier && typeof window !== 'undefined' && window.modalManager && typeof window.modalManager.showQuickToast === 'function') {
            window.modalManager.showQuickToast(`👑 BATTLE PASS TIER ${newTier} UNLOCKED!`, 2200);
        }
    }

    bindProgressionEvents() {
        if (this._eventsBound || typeof window === 'undefined' || !window.EventBus) return;
        this._eventsBound = true;
        window.EventBus.on('enemyKilled', (data) => {
            const type = data && data.enemyType;
            const bonus = (type === 'kleanthis' || type === 'rouf' || type === 'zeus' || type === 'kolossos') ? 45
                : ((type === 'kiloumpas') ? 25 : 2);
            this.addXp(bonus, 'kill');
        });
        window.EventBus.on('waveCompleted', () => this.addXp(35, 'wave'));
        window.EventBus.on('questClaimed', () => this.addXp(120, 'quest'));
    }

    _grantReward(r) {
        if (r.type === 'gold') {
            if (window.GameState) window.GameState.addCurrency(r.amount, 0);
        } else if (r.type === 'gems') {
            if (window.GameState) window.GameState.addCurrency(0, r.amount);
        } else if (r.type === 'chest') {
            this._awardChest(r.chestType);
        } else if (r.type === 'weapon') {
            if (typeof WeaponSystem !== 'undefined') WeaponSystem.unlockWeapon(r.weaponId, { silent: true });
        } else if (r.type === 'skin') {
            if (typeof HeroSkinSystem !== 'undefined') HeroSkinSystem.unlockSkin(r.heroId, r.skinId);
            if (r.bonusChest) this._awardChest(r.bonusChest);
        }
    }

    _awardChest(chestType) {
        if (typeof window !== 'undefined' && window.chestManager && typeof window.chestManager.addChest === 'function') {
            if (window.chestManager.addChest(chestType)) return;
        }
        if (typeof window !== 'undefined' && window.inventoryManager && typeof window.inventoryManager.addChestToInventory === 'function') {
            window.inventoryManager.addChestToInventory(chestType, 1);
        }
    }

    claimReward(tierNum, track = 'free') {
        const entry = BattlePassManager.TIERS.find(e => e.tier === tierNum);
        const isPaid = track === 'paid';
        const reward = entry ? (isPaid ? entry.paid : entry.free) : null;
        if (!reward || tierNum > this.getCurrentTier()) return null;
        if (isPaid && !this.hasPremium) return null;

        const bucket = isPaid ? this.claimedPremium : this.claimedFree;
        if (bucket.includes(tierNum)) return null;

        bucket.push(tierNum);
        this._grantReward(reward);
        this.save();

        if (window.soundEngine && typeof window.soundEngine.playLevelUp === 'function') {
            window.soundEngine.playLevelUp();
        }
        if (window.modalManager && typeof window.modalManager.showQuickToast === 'function') {
            const tag = isPaid ? 'VIP ' : 'FREE ';
            window.modalManager.showQuickToast(`🎁 Claimed ${tag}T${tierNum}: ${reward.label}!`, 2100);
        }
        return reward;
    }

    claimTier(tierNum) {
        const freeClaimed = this.claimReward(tierNum, 'free');
        const paidClaimed = this.hasPremium ? this.claimReward(tierNum, 'paid') : null;
        return paidClaimed || freeClaimed;
    }

    claimAllAvailable() {
        const { free, paid } = this.getClaimableRewards();
        if (!free.length && !paid.length) return 0;
        let count = 0;
        for (const t of free) {
            const entry = BattlePassManager.TIERS.find(e => e.tier === t);
            if (entry && entry.free) {
                this.claimedFree.push(t);
                this._grantReward(entry.free);
                count++;
            }
        }
        for (const t of paid) {
            const entry = BattlePassManager.TIERS.find(e => e.tier === t);
            if (entry && entry.paid) {
                this.claimedPremium.push(t);
                this._grantReward(entry.paid);
                count++;
            }
        }
        this.save();
        if (window.soundEngine && typeof window.soundEngine.playLevelUp === 'function') window.soundEngine.playLevelUp();
        if (window.modalManager && typeof window.modalManager.showQuickToast === 'function') {
            window.modalManager.showQuickToast(`🎉 Claimed ${count} Battle Pass reward${count > 1 ? 's' : ''}!`, 2200);
        }
        return count;
    }

    buyPremiumPassWithGems() {
        if (this.hasPremium) return { success: false, reason: 'Premium Battle Pass already unlocked!' };
        const cost = BattlePassManager.PASS_GEM_COST;
        if (!window.GameState || !window.GameState.spendGems(cost)) {
            return { success: false, reason: `Need 💎 ${cost} Gems to buy the Battle Pass!` };
        }
        this.hasPremium = true;
        this.save();
        if (window.soundEngine && typeof window.soundEngine.playLevelUp === 'function') window.soundEngine.playLevelUp();
        const unlockedReady = this.getClaimableRewards().paid.length;
        if (window.modalManager && typeof window.modalManager.showQuickToast === 'function') {
            const extra = unlockedReady > 0 ? ` (${unlockedReady} Paid Rewards ready!)` : '';
            window.modalManager.showQuickToast(`👑 PREMIUM BATTLE PASS UNLOCKED!${extra}`, 2600);
        }
        return { success: true, readyCount: unlockedReady };
    }

    buyNextTierWithGems() {
        const cur = this.getCurrentTier();
        if (cur >= BattlePassManager.MAX_TIER) return { success: false, reason: 'Already at Max Tier!' };
        const cost = BattlePassManager.SKIP_TIER_GEM_COST;
        if (!window.GameState || !window.GameState.spendGems(cost)) {
            return { success: false, reason: `Need 💎 ${cost} Gems to unlock Tier ${cur + 1}!` };
        }
        const needXp = BattlePassManager.getXpToReachTier(cur + 1) - this.xp;
        this.addXp(Math.max(1, needXp), 'gem_skip');
        return { success: true, newTier: this.getCurrentTier() };
    }

    updateMenuCard() {
        if (typeof document === 'undefined') return;
        const prog = this.getTierProgress();
        const readyCount = this.getClaimableRewards().total;
        const tierEl = document.querySelector('.battle-pass-card .bp-tier-num');
        const fillEl = document.querySelector('.battle-pass-card .bp-fill');
        const titleEl = document.querySelector('.battle-pass-card .bp-title-text');
        const btnBadge = document.getElementById('bp-claim-badge');

        if (tierEl) tierEl.textContent = prog.tier;
        if (fillEl) fillEl.style.width = `${prog.pct}%`;
        if (titleEl) {
            const modeTag = this.hasPremium ? 'VIP' : 'FREE';
            titleEl.textContent = prog.tier >= BattlePassManager.MAX_TIER ? `MAX TIER • ${modeTag}` : `TIER ${prog.tier}/${BattlePassManager.MAX_TIER} • ${modeTag}`;
        }

        if (btnBadge) {
            if (readyCount > 0) {
                btnBadge.textContent = readyCount;
                btnBadge.classList.remove('hidden');
            } else {
                btnBadge.classList.add('hidden');
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.BattlePassManager = BattlePassManager;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BattlePassManager;
}
