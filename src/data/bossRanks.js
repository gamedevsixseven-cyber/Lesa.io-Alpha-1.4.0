/**
 * Lesa.io - Boss Ranking & Boss Crates Registry
 * Defines the 5 Boss Tiers, visual identity, and tier-specific Boss Crate loot tables.
 */

const BOSS_RANKS = {
    easy: {
        id: 'easy',
        name: 'Easy Boss',
        displayName: 'Easy Boss',
        tierNumber: 1,
        badgeText: '🟢 EASY BOSS',
        color: '#2ed573',
        bannerColor: '#20bf6b',
        crateId: 'boss_crate_easy',
        crateName: 'Easy Boss Crate',
        crateIcon: 'assets/Chests/CommonChest.png'
    },
    normal: {
        id: 'normal',
        name: 'Normal Boss',
        displayName: 'Normal Boss',
        tierNumber: 2,
        badgeText: '🔵 NORMAL BOSS',
        color: '#1e90ff',
        bannerColor: '#0984e3',
        crateId: 'boss_crate_normal',
        crateName: 'Normal Boss Crate',
        crateIcon: 'assets/Chests/RareChest.png'
    },
    hard: {
        id: 'hard',
        name: 'Hard Boss',
        displayName: 'Hard Boss',
        tierNumber: 3,
        badgeText: '🟣 HARD BOSS',
        color: '#9b59b6',
        bannerColor: '#8e44ad',
        crateId: 'boss_crate_hard',
        crateName: 'Hard Boss Crate',
        crateIcon: 'assets/Chests/EpicChest.png'
    },
    very_hard: {
        id: 'very_hard',
        name: 'Very Hard Boss',
        displayName: 'Very Hard Boss',
        tierNumber: 4,
        badgeText: '🟠 VERY HARD BOSS',
        color: '#e67e22',
        bannerColor: '#d35400',
        crateId: 'boss_crate_very_hard',
        crateName: 'Very Hard Boss Crate',
        crateIcon: 'assets/Chests/LegendaryChest.png'
    },
    insane: {
        id: 'insane',
        name: 'Insane Boss',
        displayName: 'Insane Boss',
        tierNumber: 5,
        badgeText: '🔴 INSANE BOSS',
        color: '#ff4757',
        bannerColor: '#c0392b',
        crateId: 'boss_crate_insane',
        crateName: 'Insane Boss Crate',
        crateIcon: 'assets/Chests/MythicChest.png'
    }
};

const BOSS_CRATES = {
    boss_crate_easy: {
        id: 'boss_crate_easy',
        rank: 'easy',
        name: 'Easy Boss Crate',
        rarity: 'uncommon',
        icon: 'assets/Chests/CommonChest.png',
        color: '#2ed573',
        bannerColor: '#20bf6b',
        description: 'Earned by defeating an Easy Boss. Contains introductory coins, gems, and early gear cards.',
        bossNote: 'Drop: Easy Boss Encounters',
        minCoins: 600,
        maxCoins: 1200,
        gemDropChance: 0.50,
        minGems: 2,
        maxGems: 5,
        gearCount: 2,
        gearOdds: {
            common: 0.70,
            uncommon: 0.30,
            rare: 0.00,
            epic: 0.00,
            legendary: 0.00
        }
    },
    boss_crate_normal: {
        id: 'boss_crate_normal',
        rank: 'normal',
        name: 'Normal Boss Crate',
        rarity: 'rare',
        icon: 'assets/Chests/RareChest.png',
        color: '#1e90ff',
        bannerColor: '#0984e3',
        description: 'Earned by taking down Normal Bosses like Kleanthis. Grants a bounty of coins, guaranteed gems, and rare gear!',
        bossNote: 'Drop: Kleanthis (Wave 10 Boss)',
        minCoins: 1800,
        maxCoins: 3800,
        gemDropChance: 1.00,
        minGems: 8,
        maxGems: 18,
        gearCount: 3,
        guaranteedRare: 1,
        gearOdds: {
            common: 0.15,
            uncommon: 0.55,
            rare: 0.25,
            epic: 0.05,
            legendary: 0.00
        }
    },
    boss_crate_hard: {
        id: 'boss_crate_hard',
        rank: 'hard',
        name: 'Hard Boss Crate',
        rarity: 'epic',
        icon: 'assets/Chests/EpicChest.png',
        color: '#9b59b6',
        bannerColor: '#8e44ad',
        description: 'Lavish crate awarded for busting Hard Bosses like Rouf. Stuffed with thousands of coins, piles of gems, and epic gear!',
        bossNote: 'Drop: Rouf (Wave 20 Climax Boss)',
        minCoins: 5000,
        maxCoins: 10000,
        gemDropChance: 1.00,
        minGems: 25,
        maxGems: 50,
        gearCount: 4,
        guaranteedEpic: 1,
        gearOdds: {
            common: 0.00,
            uncommon: 0.25,
            rare: 0.50,
            epic: 0.20,
            legendary: 0.05
        }
    },
    boss_crate_very_hard: {
        id: 'boss_crate_very_hard',
        rank: 'very_hard',
        name: 'Very Hard Boss Crate',
        rarity: 'legendary',
        icon: 'assets/Chests/LegendaryChest.png',
        color: '#e67e22',
        bannerColor: '#d35400',
        description: 'High-tier crate awarded for surviving terrifying Very Hard Bosses. Delivers huge gem payouts and legendary gear!',
        bossNote: 'Drop: Very Hard Boss Encounters',
        minCoins: 12000,
        maxCoins: 25000,
        gemDropChance: 1.00,
        minGems: 60,
        maxGems: 120,
        gearCount: 5,
        guaranteedLegendary: 1,
        gearOdds: {
            common: 0.00,
            uncommon: 0.00,
            rare: 0.30,
            epic: 0.50,
            legendary: 0.20
        }
    },
    boss_crate_insane: {
        id: 'boss_crate_insane',
        rank: 'insane',
        name: 'Insane Boss Crate',
        rarity: 'mythic',
        icon: 'assets/Chests/MythicChest.png',
        color: '#ff4757',
        bannerColor: '#c0392b',
        description: 'The pinnacle of arena spoils. Only the greatest warriors who slay Insane Bosses claim this mythical vault!',
        bossNote: 'Drop: Insane Boss Encounters',
        minCoins: 30000,
        maxCoins: 65000,
        gemDropChance: 1.00,
        minGems: 150,
        maxGems: 300,
        gearCount: 6,
        guaranteedLegendary: 2,
        gearOdds: {
            common: 0.00,
            uncommon: 0.00,
            rare: 0.10,
            epic: 0.40,
            legendary: 0.50
        }
    }
};

function getBossRank(rankId) {
    if (!rankId) return BOSS_RANKS.normal;
    return BOSS_RANKS[rankId.toLowerCase()] || BOSS_RANKS.normal;
}

function getBossCrate(crateId) {
    if (!crateId) return null;
    return BOSS_CRATES[crateId] || null;
}

if (typeof window !== 'undefined') {
    window.BOSS_RANKS = BOSS_RANKS;
    window.BOSS_CRATES = BOSS_CRATES;
    window.getBossRank = getBossRank;
    window.getBossCrate = getBossCrate;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BOSS_RANKS, BOSS_CRATES, getBossRank, getBossCrate };
}
