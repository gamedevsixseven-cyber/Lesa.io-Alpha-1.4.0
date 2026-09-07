/**
 * Lesa.io - Chest System Data Registry & Drop Tables
 * Defines the 6 chest tiers, unlock timers, gem costs, and item drop probabilities.
 */

const CHEST_TYPES = {
    common: {
        id: 'common',
        name: 'Common Chest',
        rarity: 'common',
        icon: 'assets/Chests/CommonChest.png',
        color: '#2ed573',
        bannerColor: '#20bf6b',
        unlockTimeSec: 900, // 15 minutes
        gemSpeedCost: 5,
        buyGems: 100,
        buyCoins: 2500,
        minCoins: 250,
        maxCoins: 500,
        gemDropChance: 0.20,
        minGems: 1,
        maxGems: 2,
        gearCount: 2,
        gearOdds: {
            common: 0.88,
            uncommon: 0.12,
            rare: 0.00,
            epic: 0.00,
            legendary: 0.00
        }
    },
    uncommon: {
        id: 'uncommon',
        name: 'Uncommon Chest',
        rarity: 'uncommon',
        icon: 'assets/Chests/UncommonChest.png',
        color: '#10ac84',
        bannerColor: '#05c46b',
        unlockTimeSec: 1800, // 30 minutes
        gemSpeedCost: 10,
        buyGems: 175,
        buyCoins: 6000,
        minCoins: 600,
        maxCoins: 1200,
        gemDropChance: 0.40,
        minGems: 2,
        maxGems: 5,
        gearCount: 2,
        gearOdds: {
            common: 0.35,
            uncommon: 0.60,
            rare: 0.05,
            epic: 0.00,
            legendary: 0.00
        }
    },
    rare: {
        id: 'rare',
        name: 'Rare Chest',
        rarity: 'rare',
        icon: 'assets/Chests/RareChest.png',
        color: '#1e90ff',
        bannerColor: '#0984e3',
        unlockTimeSec: 5400, // 1.5 hours (90 minutes)
        gemSpeedCost: 25,
        buyGems: 250,
        buyCoins: 15000,
        minCoins: 1500,
        maxCoins: 3200,
        gemDropChance: 1.00, // Guaranteed
        minGems: 5,
        maxGems: 12,
        gearCount: 3,
        guaranteedRare: 1,
        gearOdds: {
            common: 0.15,
            uncommon: 0.60,
            rare: 0.25,
            epic: 0.01,
            legendary: 0.00
        }
    },
    epic: {
        id: 'epic',
        name: 'Epic Chest',
        rarity: 'epic',
        icon: 'assets/Chests/EpicChest.png',
        color: '#9b59b6',
        bannerColor: '#8e44ad',
        unlockTimeSec: 18000, // 5 hours
        gemSpeedCost: 60,
        buyGems: 500,
        buyCoins: 35000,
        minCoins: 4500,
        maxCoins: 9000,
        gemDropChance: 1.00, // Guaranteed
        minGems: 15,
        maxGems: 35,
        gearCount: 4,
        guaranteedEpic: 1,
        gearOdds: {
            common: 0.00,
            uncommon: 0.30,
            rare: 0.55,
            epic: 0.14,
            legendary: 0.01
        }
    },
    legendary: {
        id: 'legendary',
        name: 'Legendary Chest',
        rarity: 'legendary',
        icon: 'assets/Chests/LegendaryChest.png',
        color: '#f39c12',
        bannerColor: '#e67e22',
        unlockTimeSec: 43200, // 12 hours
        gemSpeedCost: 150,
        buyGems: 1000,
        buyCoins: null,
        minCoins: 12000,
        maxCoins: 28000,
        gemDropChance: 1.00, // Guaranteed
        minGems: 50,
        maxGems: 120,
        gearCount: 5,
        guaranteedLegendary: 1,
        gearOdds: {
            common: 0.00,
            uncommon: 0.00,
            rare: 0.40,
            epic: 0.45,
            legendary: 0.15
        }
    },
    mythic: {
        id: 'mythic',
        name: 'Mythic Chest',
        rarity: 'mythic',
        icon: 'assets/Chests/MythicChest.png',
        color: '#e056fd',
        bannerColor: '#be2edd',
        unlockTimeSec: 86400, // 24 hours
        gemSpeedCost: 300,
        buyGems: 2500,
        buyCoins: null,
        minCoins: 35000,
        maxCoins: 75000,
        gemDropChance: 1.00,
        minGems: 150,
        maxGems: 350,
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

/**
 * Match victory chest drop probability table based on waves cleared
 */
const CHEST_DROP_RATES = [
    {
        minWave: 1,
        maxWave: 4,
        rates: [
            { id: 'common', weight: 80 },
            { id: 'uncommon', weight: 20 }
        ]
    },
    {
        minWave: 5,
        maxWave: 8,
        rates: [
            { id: 'common', weight: 40 },
            { id: 'uncommon', weight: 45 },
            { id: 'rare', weight: 15 }
        ]
    },
    {
        minWave: 9,
        maxWave: 9,
        rates: [
            { id: 'uncommon', weight: 55 },
            { id: 'rare', weight: 40 },
            { id: 'epic', weight: 5 }
        ]
    },
    {
        minWave: 10,
        maxWave: 999, // Boss victory (Wave 10 / Kleanthis)
        rates: [
            { id: 'uncommon', weight: 60 },
            { id: 'rare', weight: 38 },
            { id: 'epic', weight: 2 }
        ]
    }
];

if (typeof window !== 'undefined') {
    window.CHEST_TYPES = CHEST_TYPES;
    window.CHEST_DROP_RATES = CHEST_DROP_RATES;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CHEST_TYPES, CHEST_DROP_RATES };
}
