/**
 * Lesa.io - Clan System Configuration, Role Hierarchy, Buffs & Shop (V1.1.0 Phase 2)
 */

const CLAN_CREATE_COST = {
    coins: 1000000,
    gems: 1000
};

const CLAN_REJOIN_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const CLAN_ROLES = {
    leader: { id: 'leader', label: 'LEADER', rank: 4, icon: '👑', color: '#f59e0b', text: '#1e272e' },
    co_leader: { id: 'co_leader', label: 'CO-LEADER', rank: 3, icon: '⭐', color: '#ff6b6b', text: '#ffffff' },
    officer: { id: 'officer', label: 'OFFICER', rank: 2, icon: '🛡️', color: '#0984e3', text: '#ffffff' },
    member: { id: 'member', label: 'MEMBER', rank: 1, icon: '⚔️', color: '#64748b', text: '#ffffff' }
};

const CLAN_EMBLEMS = [
    { id: 'spartan_shield', name: 'Aegis Shield', iconKey: 'shield', fallback: '🛡️' },
    { id: 'olympus_crown', name: 'Basileus Crown', iconKey: 'crown', fallback: '👑' },
    { id: 'zeus_bolt', name: 'Storm Bolt', iconKey: 'bolt', fallback: '⚡' },
    { id: 'forge_flame', name: 'Vulcan Flame', iconKey: 'flame', fallback: '🔥' },
    { id: 'twin_swords', name: 'Hoplite Blades', iconKey: 'swords', fallback: '⚔️' },
    { id: 'ascent_crest', name: 'Olympian Crest', iconKey: 'crest', fallback: '🏛️' },
    { id: 'trophy_laurel', name: 'Champion Laurel', iconKey: 'trophy', fallback: '🏆' },
    { id: 'void_spark', name: 'Stygian Star', iconKey: 'star', fallback: '🌟' }
];

const CLAN_COLOR_THEMES = [
    { id: 'crimson', name: 'Spartan Crimson', primary: '#ff4757', secondary: '#b33939', accent: '#fed330' },
    { id: 'cobalt', name: 'Aegean Cobalt', primary: '#1e90ff', secondary: '#0984e3', accent: '#dfe6e9' },
    { id: 'gold', name: 'Olympian Gold', primary: '#fed330', secondary: '#e67e22', accent: '#ffffff' },
    { id: 'emerald', name: 'Olive Emerald', primary: '#2ed573', secondary: '#10ac84', accent: '#ffffff' },
    { id: 'violet', name: 'Stygian Violet', primary: '#9b59b6', secondary: '#6c5ce7', accent: '#fed330' },
    { id: 'obsidian', name: 'Vulcan Forge', primary: '#ff7f50', secondary: '#2f3542', accent: '#fed330' }
];

const CLAN_LEVEL_XP = [
    0, 2500, 6500, 13000, 22000, 35000, 52000, 75000, 105000, 145000
];

const CLAN_LEVEL_PERKS = [
    { key: 'war_banner', name: 'War Banner', desc: 'Hero Bullet & Skill Damage boost', unit: '%', values: [2, 3, 5, 6, 8, 9, 11, 12, 14, 15], iconKey: 'swords' },
    { key: 'golden_tithe', name: 'Golden Tithe', desc: 'Match Gold, Pouch & Account XP bonus', unit: '%', values: [5, 7, 9, 12, 14, 16, 19, 21, 23, 25], iconKey: 'coin' },
    { key: 'salvage_mastery', name: 'Salvage Mastery', desc: 'Chest Coins & Material Drop Bonus', unit: '%', values: [4, 6, 8, 10, 12, 14, 16, 17, 19, 20], iconKey: 'crate' },
    { key: 'stamina_reserve', name: 'Stamina Reserve', desc: 'Max HP boost (+5% DMG/HP w/ Clanmate)', unit: '%', values: [3, 4, 6, 7, 9, 10, 11, 13, 14, 15], iconKey: 'heart' }
];

const CLAN_VAULT_RESOURCES = [
    {
        id: 'coins', kind: 'currency', name: 'Gold Coins', shortName: 'Coins',
        iconKey: 'coin', iconImg: 'assets/ui-icons/coin.svg',
        dailyCap: 250000, stepSmall: 10000, stepLarge: 50000, unitAmount: 10000,
        xpPerUnit: 12, contribPerUnit: 8, color: '#e67e22'
    },
    {
        id: 'armory_shards', kind: 'material', name: 'Armory Shards', shortName: 'Shards',
        iconKey: 'mat_armory_shards', iconImg: 'assets/ui-icons/mat_armory_shards.svg',
        dailyCap: 40, stepSmall: 1, stepLarge: 5, unitAmount: 1,
        xpPerUnit: 6, contribPerUnit: 4, color: '#0984e3'
    },
    {
        id: 'mati_crystal', kind: 'material', name: 'Mati Crystal', shortName: 'Mati',
        iconKey: 'mat_mati_crystal', iconImg: 'assets/ui-icons/mat_mati_crystal.svg',
        dailyCap: 15, stepSmall: 1, stepLarge: 5, unitAmount: 1,
        xpPerUnit: 25, contribPerUnit: 15, color: '#2563eb'
    },
    {
        id: 'olympian_bronze', kind: 'material', name: 'Olympian Bronze', shortName: 'Bronze',
        iconKey: 'mat_olympian_bronze', iconImg: 'assets/ui-icons/mat_olympian_bronze.svg',
        dailyCap: 10, stepSmall: 1, stepLarge: 3, unitAmount: 1,
        xpPerUnit: 45, contribPerUnit: 28, color: '#8e44ad'
    }
];

const CLAN_WEEKLY_BOUNTIES = [
    {
        id: 'endless_waves', title: 'Endless Endurance',
        desc: 'Squad clears 1,500 Endless Waves total',
        target: 1500, rewardXp: 1200, rewardCrests: 150, minContribToClaim: 50,
        iconKey: 'wave', color: '#0984e3'
    },
    {
        id: 'zeus_defeats', title: 'Olympian Stormbreakers',
        desc: 'Defeat Zeus 15 times as a Clan',
        target: 15, rewardXp: 1800, rewardCrests: 220, minContribToClaim: 50,
        iconKey: 'bolt', color: '#e67e22'
    },
    {
        id: 'coop_kills', title: 'Co-op Meatgrinder',
        desc: 'Kill 50,000 Enemies in Co-op',
        target: 50000, rewardXp: 1500, rewardCrests: 180, minContribToClaim: 50,
        iconKey: 'people', color: '#10ac84'
    },
    {
        id: 'vault_tributes', title: 'Forge Vault Tithe',
        desc: 'Donate 2,000 Contribution Pts to the Vault',
        target: 2000, rewardXp: 950, rewardCrests: 120, minContribToClaim: 25,
        iconKey: 'crate', color: '#e84118'
    }
];

const CLAN_SHOP_ITEMS = [
    { id: 'rare_chest', name: 'Rare Chest', desc: 'Delivered to Chest Slots or Backpack', cost: 80, kind: 'chest', chestType: 'rare', iconImg: 'assets/Chests/RareChest.png', badge: 'CHEST' },
    { id: 'epic_chest', name: 'Epic Chest', desc: 'Delivered to Chest Slots or Backpack', cost: 160, kind: 'chest', chestType: 'epic', iconImg: 'assets/Chests/EpicChest.png', badge: 'EPIC' },
    { id: 'legendary_chest', name: 'Legendary Chest', desc: 'Delivered to Chest Slots or Backpack', cost: 320, kind: 'chest', chestType: 'legendary', iconImg: 'assets/Chests/LegendaryChest.png', badge: 'LEGEND' },
    { id: 'mati_pack', name: '5× Mati Crystals', desc: 'Instant crafting material bundle', cost: 110, kind: 'material', matId: 'mati_crystal', qty: 5, iconImg: 'assets/ui-icons/mat_mati_crystal.svg', badge: 'RARE' },
    { id: 'bronze_pack', name: '4× Olympian Bronze', desc: 'High-tier forge catalyst bundle', cost: 190, kind: 'material', matId: 'olympian_bronze', qty: 4, iconImg: 'assets/ui-icons/mat_olympian_bronze.svg', badge: 'EPIC' },
    { id: 'evo_stone', name: 'Evolution Stone', desc: 'Awakens Hero ★ or Mythic/Apex Weapons', cost: 380, kind: 'evo_stone', qty: 1, iconImg: 'assets/ui-icons/evolution_stone.svg', badge: 'MYTHIC' },
    { id: 'banner_clan_spartan', name: 'Spartan Phalanx Banner', desc: 'Clan Shop Exclusive Profile Banner', cost: 260, kind: 'banner', bannerId: 'banner_clan_spartan', cssClass: 'cos-banner-clan-spartan', iconImg: 'assets/GearUIIcons/DEF.png', badge: 'CLAN ONLY', oneTime: true },
    { id: 'banner_clan_obsidian', name: 'Obsidian Citadel Banner', desc: 'Clan Shop Exclusive Apex Profile Banner', cost: 450, kind: 'banner', bannerId: 'banner_clan_obsidian', cssClass: 'cos-banner-clan-obsidian', iconImg: 'assets/ui-icons/crown.svg', badge: 'EXOTIC', oneTime: true }
];

const CLAN_WEEKLY_CHEST_TIERS = [
    { minBounties: 4, name: 'Mythic Clan War Chest', chestType: 'mythic', crestsBonus: 120, gemsBonus: 25, minWeeklyPts: 100 },
    { minBounties: 3, name: 'Legendary Clan War Chest', chestType: 'legendary', crestsBonus: 80, gemsBonus: 15, minWeeklyPts: 100 },
    { minBounties: 2, name: 'Epic Clan War Chest', chestType: 'epic', crestsBonus: 50, gemsBonus: 8, minWeeklyPts: 75 },
    { minBounties: 0, name: 'Rare Clan Supply Chest', chestType: 'rare', crestsBonus: 25, gemsBonus: 3, minWeeklyPts: 50 }
];

const CLAN_VAULT_BOOSTERS = [
    {
        id: 'golden_feast', name: 'Golden Feast', desc: '+25% Match Gold & Account XP for all members (2h)',
        summary: '+25% Gold & XP', iconKey: 'coin', fallback: '🪙', color: '#e67e22',
        durationMs: 2 * 60 * 60 * 1000,
        cost: { coins: 250000, armory_shards: 15 },
        effects: { goldPct: 25, xpPct: 25 }
    },
    {
        id: 'forge_overdrive', name: 'Forge Overdrive', desc: '+25% Chest Coins & Material Drops for all members (2h)',
        summary: '+25% Chests & Drops', iconKey: 'crate', fallback: '📦', color: '#0984e3',
        durationMs: 2 * 60 * 60 * 1000,
        cost: { coins: 150000, armory_shards: 20, mati_crystal: 5 },
        effects: { chestCoinsPct: 25, matLuckPct: 25 }
    },
    {
        id: 'godslayer_horn', name: 'Godslayer Horn', desc: '+15% Damage & +10% Max HP for all members (2h)',
        summary: '+15% DMG & +10% HP', iconKey: 'bolt', fallback: '⚡', color: '#ff4757',
        durationMs: 2 * 60 * 60 * 1000,
        cost: { coins: 300000, mati_crystal: 8, olympian_bronze: 4 },
        effects: { damagePct: 15, hpPct: 10 }
    }
];

const CLAN_PLAYTIME_REWARDS = {
    perWavePts: 1,
    perWaveXp: 2,
    runFinishPts: 2,
    runFinishXp: 4,
    playtimeStepSec: 120,
    playtimeMaxPtsPerRun: 8
};

class ClanConfigHelper {
    static getRoleMeta(roleId) {
        return CLAN_ROLES[roleId] || CLAN_ROLES.member;
    }

    static getRoleRank(roleId) {
        return (CLAN_ROLES[roleId] && CLAN_ROLES[roleId].rank) || 1;
    }

    static getLevelFromXp(xp = 0) {
        const cleanXp = Math.max(0, Math.floor(Number(xp) || 0));
        let lvl = 1;
        for (let i = 1; i < CLAN_LEVEL_XP.length; i++) {
            if (cleanXp >= CLAN_LEVEL_XP[i]) lvl = i + 1;
        }
        const curFloor = CLAN_LEVEL_XP[lvl - 1] || 0;
        const nextReq = CLAN_LEVEL_XP[lvl] || null;
        return {
            level: lvl, maxLevel: CLAN_LEVEL_XP.length, xp: cleanXp, curFloor, nextReq,
            pct: nextReq ? Math.min(100, Math.round(((cleanXp - curFloor) / Math.max(1, nextReq - curFloor)) * 100)) : 100
        };
    }

    static getMaxMembersForLevel(level = 1) {
        return 12 + Math.floor(Math.max(0, level - 1) / 3) * 2;
    }

    static getEmblem(id) { return CLAN_EMBLEMS.find(e => e.id === id) || CLAN_EMBLEMS[0]; }
    static getColorTheme(id) { return CLAN_COLOR_THEMES.find(c => c.id === id) || CLAN_COLOR_THEMES[0]; }
    static getUtcDayKey(now = Date.now()) { return new Date(now).toISOString().slice(0, 10); }

    static getIsoWeekKey(now = Date.now()) {
        const d = new Date(now);
        const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
        const day = utc.getUTCDay() || 7;
        utc.setUTCDate(utc.getUTCDate() + 4 - day);
        const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((utc - yearStart) / 86400000) + 1) / 7);
        return `${utc.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    }

    static formatTimeUntilNextUtcDay(now = Date.now()) {
        const d = new Date(now);
        return this._fmtMs(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0) - now);
    }

    static formatTimeUntilNextMonday(now = Date.now()) {
        const d = new Date(now);
        const daysAhead = (8 - d.getUTCDay()) % 7 || 7;
        return this._fmtMs(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + daysAhead, 0, 0, 0) - now);
    }

    static _fmtMs(ms) {
        const totalMin = Math.max(0, Math.floor(ms / 60000));
        const days = Math.floor(totalMin / 1440);
        const hrs = Math.floor((totalMin % 1440) / 60);
        const mins = totalMin % 60;
        return days > 0 ? `${days}d ${hrs}h` : `${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`;
    }
}

if (typeof window !== 'undefined') {
    window.CLAN_CREATE_COST = CLAN_CREATE_COST;
    window.CLAN_REJOIN_COOLDOWN_MS = CLAN_REJOIN_COOLDOWN_MS;
    window.CLAN_ROLES = CLAN_ROLES;
    window.CLAN_EMBLEMS = CLAN_EMBLEMS;
    window.CLAN_COLOR_THEMES = CLAN_COLOR_THEMES;
    window.CLAN_LEVEL_XP = CLAN_LEVEL_XP;
    window.CLAN_LEVEL_PERKS = CLAN_LEVEL_PERKS;
    window.CLAN_VAULT_RESOURCES = CLAN_VAULT_RESOURCES;
    window.CLAN_WEEKLY_BOUNTIES = CLAN_WEEKLY_BOUNTIES;
    window.CLAN_SHOP_ITEMS = CLAN_SHOP_ITEMS;
    window.CLAN_WEEKLY_CHEST_TIERS = CLAN_WEEKLY_CHEST_TIERS;
    window.ClanConfigHelper = ClanConfigHelper;
}
