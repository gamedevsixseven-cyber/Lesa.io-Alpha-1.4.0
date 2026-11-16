/**
 * Lesa.io - Legendary Tier Perks Data Definitions (Alpha 1.5)
 * Loaded before perks.js so PERKS_DATA remains cohesive and modular.
 */

const LEGENDARY_PERKS_DATA = {
    boreas_permafrost: {
        id: 'boreas_permafrost',
        name: 'Boreas Permafrost',
        icon: '❄️',
        iconImg: 'assets/ui-icons/snowflake.svg',
        badge: 'CHAOS',
        rarity: 'legendary',
        tag: 'crowd_control',
        tagLabel: 'FROST SHARD',
        desc: 'Every 6th shot fires a Glacial Shard (40% chill slow). At 3 stacks — or when Dashed through — foes freeze solid & take bonus Shatter damage.',
        cost: 14000,
        materials: { mati_crystal: 6, olympian_bronze: 5 },
        unlockRequirements: { bossId: 'frost_titan' },
        maxRank: 3,
        ranks: [
            {
                rank: 1,
                summary: 'Every 6th shot • 1.45x Glacial Shard • 1.2s Freeze & +20% Shatter vuln',
                stats: { everyNShots: 6, shardDmgMult: 1.45, slowRatio: 0.40, slowSec: 2.5, freezeSec: 1.2, vulnBonus: 0.20, shatterRadius: 150 }
            },
            {
                rank: 2,
                summary: 'Every 5th shot • 1.60x Glacial Shard • 1.4s Freeze & +28% Shatter vuln',
                upgradeCost: { coins: 17000, materials: { mati_crystal: 9, olympian_bronze: 7 } },
                stats: { everyNShots: 5, shardDmgMult: 1.60, slowRatio: 0.45, slowSec: 2.8, freezeSec: 1.4, vulnBonus: 0.28, shatterRadius: 165 }
            },
            {
                rank: 3,
                summary: 'Every 4th shot • 1.80x Glacial Shard • 1.6s Freeze & +35% Shatter vuln',
                upgradeCost: { coins: 24000, materials: { olympian_bronze: 10, ambrosia_spark: 1 } },
                stats: { everyNShots: 4, shardDmgMult: 1.80, slowRatio: 0.50, slowSec: 3.0, freezeSec: 1.6, vulnBonus: 0.35, shatterRadius: 180 }
            }
        ],
        color: '#00a8ff',
        accent: '#74b9ff'
    },
    raki_overdrive: {
        id: 'raki_overdrive',
        name: 'Raki Overdrive',
        icon: '🔥',
        iconImg: 'assets/ui-icons/flame.svg',
        badge: 'OFFENSE',
        rarity: 'legendary',
        tag: 'fire_rate',
        tagLabel: 'OVERDRIVE',
        desc: 'Gain up to +28% Fire Rate & +15% Crit Damage as HP drops (peaks below 35% HP). Mini-Boss & Boss kills trim Dash & Skill CDs by 15% (6s CD).',
        cost: 15000,
        materials: { armory_shards: 14, mati_crystal: 7 },
        unlockRequirements: { endlessWave: 25, endlessMiniBossKills: 3 },
        maxRank: 3,
        ranks: [
            {
                rank: 1,
                summary: 'Up to +28% Fire Rate & +15% Crit Dmg • Mini-Boss/Boss kills trim CDs by 15% (6s CD)',
                stats: { maxFireRateBonus: 0.28, maxCritDmgBonus: 0.15, lowHpCap: 0.35, cdTrimRatio: 0.15, trimCdSec: 6.0 }
            },
            {
                rank: 2,
                summary: 'Up to +36% Fire Rate & +20% Crit Dmg • Mini-Boss/Boss kills trim CDs by 20% (6s CD)',
                upgradeCost: { coins: 18500, materials: { mati_crystal: 10, olympian_bronze: 6 } },
                stats: { maxFireRateBonus: 0.36, maxCritDmgBonus: 0.20, lowHpCap: 0.35, cdTrimRatio: 0.20, trimCdSec: 6.0 }
            },
            {
                rank: 3,
                summary: 'Up to +45% Fire Rate & +25% Crit Dmg • Mini-Boss/Boss kills trim CDs by 25% (6s CD)',
                upgradeCost: { coins: 25000, materials: { olympian_bronze: 10, ambrosia_spark: 1 } },
                stats: { maxFireRateBonus: 0.45, maxCritDmgBonus: 0.25, lowHpCap: 0.35, cdTrimRatio: 0.25, trimCdSec: 6.0 }
            }
        ],
        color: '#e17055',
        accent: '#fdcb6e'
    },
    olympian_phalanx: {
        id: 'olympian_phalanx',
        name: 'Olympian Phalanx',
        icon: '🛡️',
        iconImg: 'assets/ui-icons/crest.svg',
        badge: 'DEFENSE',
        rarity: 'legendary',
        tag: 'ward',
        tagLabel: 'PHALANX',
        desc: 'Hits taken above 50% HP deal 18% less damage & build Phalanx stacks (max 5). At 5 stacks, your next Dash slams a golden stun cone.',
        cost: 14500,
        materials: { armory_shards: 12, mati_crystal: 6, olympian_bronze: 4 },
        unlockRequirements: { olympusFloor: 2, bossId: 'rouf' },
        maxRank: 3,
        ranks: [
            {
                rank: 1,
                summary: '18% DR >50% HP • 5 stacks empower Dash Slam: 120 AoE + 1.0s stun',
                stats: { hpMinRatio: 0.50, dmgReduction: 0.18, maxStacks: 5, slamDamage: 120, slamRange: 210, stunSec: 1.0 }
            },
            {
                rank: 2,
                summary: '24% DR >50% HP • 5 stacks empower Dash Slam: 165 AoE + 1.15s stun',
                upgradeCost: { coins: 18000, materials: { mati_crystal: 8, olympian_bronze: 7 } },
                stats: { hpMinRatio: 0.50, dmgReduction: 0.24, maxStacks: 5, slamDamage: 165, slamRange: 230, stunSec: 1.15 }
            },
            {
                rank: 3,
                summary: '30% DR >50% HP • 5 stacks empower Dash Slam: 220 AoE + 1.3s stun',
                upgradeCost: { coins: 24500, materials: { olympian_bronze: 11, ambrosia_spark: 1 } },
                stats: { hpMinRatio: 0.50, dmgReduction: 0.30, maxStacks: 5, slamDamage: 220, slamRange: 250, stunSec: 1.30 }
            }
        ],
        color: '#d97706',
        accent: '#f59e0b'
    },
    spartan_blink: {
        id: 'spartan_blink',
        name: 'Spartan Blink',
        icon: '⚡',
        iconImg: 'assets/ui-icons/bolt.svg',
        badge: 'MOBILITY',
        rarity: 'legendary',
        tag: 'dash',
        tagLabel: 'DASH MOD',
        exclusiveGroup: 'dash',
        desc: 'Upgrades Dash into an invulnerable Lightning Warp (+25% range), piercing passed foes & leaving a crackling static tether behind.',
        cost: 16500,
        materials: { mati_crystal: 8, olympian_bronze: 8 },
        unlockRequirements: { bossId: 'kiloumpas_berserker' },
        maxRank: 3,
        ranks: [
            {
                rank: 1,
                summary: '+25% Warp range • 75 path dmg • 1.5s crackling tether (35 DPS)',
                stats: { speedBonus: 0.25, pathDamage: 75, tetherDurationSec: 1.5, tetherDps: 35, tetherWidth: 34 }
            },
            {
                rank: 2,
                summary: '+30% Warp range • 105 path dmg • 1.8s crackling tether (48 DPS)',
                upgradeCost: { coins: 20000, materials: { olympian_bronze: 10, ambrosia_spark: 1 } },
                stats: { speedBonus: 0.30, pathDamage: 105, tetherDurationSec: 1.8, tetherDps: 48, tetherWidth: 38 }
            },
            {
                rank: 3,
                summary: '+35% Warp range • 140 path dmg • 2.2s crackling tether (65 DPS)',
                upgradeCost: { coins: 27000, materials: { olympian_bronze: 14, ambrosia_spark: 2 } },
                stats: { speedBonus: 0.35, pathDamage: 140, tetherDurationSec: 2.2, tetherDps: 65, tetherWidth: 42 }
            }
        ],
        color: '#0984e3',
        accent: '#00f5ff'
    },
    agora_alchemist: {
        id: 'agora_alchemist',
        name: 'Agora Alchemist',
        icon: '⚖️',
        iconImg: 'assets/ui-icons/magnet.svg',
        badge: 'ECONOMY',
        rarity: 'legendary',
        tag: 'fortune',
        tagLabel: 'ALCHEMIST',
        desc: '+80% permanent Magnet radius, +15% Boss/Elite Material Drop luck, and full-HP Hearts transmute into +10 bonus Run Coins.',
        cost: 16000,
        materials: { armory_shards: 15, mati_crystal: 7, olympian_bronze: 6 },
        unlockRequirements: { endlessWave: 30, bossId: 'rouf' },
        maxRank: 3,
        ranks: [
            {
                rank: 1,
                summary: '+80% Magnet • +15% Material Drop luck • Full-HP Heart → +10 Coins',
                stats: { magnetBonus: 0.80, matLuckBonus: 0.15, heartCoinValue: 10 }
            },
            {
                rank: 2,
                summary: '+100% Magnet • +22% Material Drop luck • Full-HP Heart → +14 Coins',
                upgradeCost: { coins: 19500, materials: { mati_crystal: 10, olympian_bronze: 9 } },
                stats: { magnetBonus: 1.00, matLuckBonus: 0.22, heartCoinValue: 14 }
            },
            {
                rank: 3,
                summary: '+125% Magnet • +30% Material Drop luck • Full-HP Heart → +18 Coins',
                upgradeCost: { coins: 26000, materials: { olympian_bronze: 12, ambrosia_spark: 1 } },
                stats: { magnetBonus: 1.25, matLuckBonus: 0.30, heartCoinValue: 18 }
            }
        ],
        color: '#f39c12',
        accent: '#2ed573'
    }
};

if (typeof window !== 'undefined') {
    window.LEGENDARY_PERKS_DATA = LEGENDARY_PERKS_DATA;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LEGENDARY_PERKS_DATA };
}
