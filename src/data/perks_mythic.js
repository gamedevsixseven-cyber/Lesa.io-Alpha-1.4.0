/**
 * Lesa.io - Mythic Capstone Battle Perks Registry
 * Capstone perks share the mutually exclusive 'capstone' group (MAX 1 equipped)
 * and pair godlike Olympus power with meaningful trade-off drawbacks.
 */

const MYTHIC_PERKS_DATA = {
    zeus_storm_crown: {
        id: 'zeus_storm_crown',
        name: "Zeus's Storm Crown",
        icon: '👑',
        iconImg: 'assets/ui-icons/crown.svg',
        badge: 'OFFENSE',
        rarity: 'mythic',
        tag: 'capstone',
        tagLabel: 'STORM CROWN',
        exclusiveGroup: 'capstone',
        desc: '+25% Damage & +12% Crit Chance; Critical Hits call down an arcing Sky-Bolt AoE that shocks nearby foes (+15% dmg taken).',
        drawback: '-25% Max HP (glass-cannon glass-god pact).',
        cost: 24000,
        materials: { ambrosia_spark: 1, olympian_bronze: 10, mati_crystal: 8 },
        unlockRequirements: { bossId: 'zeus' },
        maxRank: 3,
        ranks: [
            {
                rank: 1,
                summary: '+25% Dmg • +12% Crit • Crits call 115px Sky-Bolt (75+ dmg, +15% Shock vuln)',
                stats: {
                    damageBonus: 0.25,
                    critBonus: 0.12,
                    maxHpPenalty: 0.25,
                    boltRadius: 115,
                    boltScale: 0.55,
                    boltMinDmg: 75,
                    shockBonus: 0.15,
                    boltCdSec: 0.25
                }
            },
            {
                rank: 2,
                summary: '+32% Dmg • +16% Crit • Crits call 130px Sky-Bolt (105+ dmg, +20% Shock vuln)',
                upgradeCost: { coins: 28000, materials: { ambrosia_spark: 2, olympian_bronze: 12 } },
                stats: {
                    damageBonus: 0.32,
                    critBonus: 0.16,
                    maxHpPenalty: 0.25,
                    boltRadius: 130,
                    boltScale: 0.65,
                    boltMinDmg: 105,
                    shockBonus: 0.20,
                    boltCdSec: 0.25
                }
            },
            {
                rank: 3,
                summary: '+40% Dmg • +20% Crit • Crits call 145px Sky-Bolt (140+ dmg, +25% Shock vuln)',
                upgradeCost: { coins: 36000, materials: { ambrosia_spark: 3, olympian_bronze: 16, mati_crystal: 10 } },
                stats: {
                    damageBonus: 0.40,
                    critBonus: 0.20,
                    maxHpPenalty: 0.25,
                    boltRadius: 145,
                    boltScale: 0.75,
                    boltMinDmg: 140,
                    shockBonus: 0.25,
                    boltCdSec: 0.22
                }
            }
        ],
        color: '#c0392b',
        accent: '#00f5ff'
    },
    immortal_ambrosia: {
        id: 'immortal_ambrosia',
        name: 'Immortal Ambrosia Pact',
        icon: '🔥',
        iconImg: 'assets/ui-icons/orb_red.svg',
        badge: 'SURVIVAL',
        rarity: 'mythic',
        tag: 'capstone',
        tagLabel: 'UNDYING PACT',
        exclusiveGroup: 'capstone',
        desc: 'Fatal blows trigger a Phoenix Revive (45% HP, 2.5s i-frames, 240 Sunburst dmg + 1.5s stun) plus +4 HP/s regen below 50% HP.',
        drawback: '+35% Dash Cooldown.',
        cost: 26000,
        materials: { ambrosia_spark: 1, mati_crystal: 10, armory_shards: 20 },
        unlockRequirements: { bossId: 'zeus', endlessWave: 35 },
        maxRank: 3,
        ranks: [
            {
                rank: 1,
                summary: 'Revive 45% HP (110s CD) • 240 Sunburst + 1.5s Stun • +4 HP/s under 50% HP',
                stats: {
                    reviveHpRatio: 0.45,
                    invulnSec: 2.5,
                    cooldownSec: 110,
                    sunburstRadius: 210,
                    sunburstDamage: 240,
                    stunSec: 1.5,
                    regenPerSec: 4,
                    regenThreshold: 0.50,
                    dashCdPenalty: 0.35
                }
            },
            {
                rank: 2,
                summary: 'Revive 55% HP (90s CD) • 310 Sunburst + 1.8s Stun • +5.5 HP/s under 50% HP',
                upgradeCost: { coins: 30000, materials: { ambrosia_spark: 2, mati_crystal: 12, armory_shards: 24 } },
                stats: {
                    reviveHpRatio: 0.55,
                    invulnSec: 2.5,
                    cooldownSec: 90,
                    sunburstRadius: 230,
                    sunburstDamage: 310,
                    stunSec: 1.8,
                    regenPerSec: 5.5,
                    regenThreshold: 0.50,
                    dashCdPenalty: 0.35
                }
            },
            {
                rank: 3,
                summary: 'Revive 65% HP (75s CD) • 400 Sunburst + 2.0s Stun • +7 HP/s under 50% HP',
                upgradeCost: { coins: 38000, materials: { ambrosia_spark: 3, olympian_bronze: 12, mati_crystal: 14 } },
                stats: {
                    reviveHpRatio: 0.65,
                    invulnSec: 3.0,
                    cooldownSec: 75,
                    sunburstRadius: 260,
                    sunburstDamage: 400,
                    stunSec: 2.0,
                    regenPerSec: 7,
                    regenThreshold: 0.50,
                    dashCdPenalty: 0.35
                }
            }
        ],
        color: '#d63031',
        accent: '#ffd32a'
    },
    chronos_hourglass: {
        id: 'chronos_hourglass',
        name: 'Chronos Time-Rift',
        icon: '⏳',
        iconImg: 'assets/ui-icons/hourglass.svg',
        badge: 'CHAOS',
        rarity: 'mythic',
        tag: 'capstone',
        tagLabel: 'TIME RIFT',
        exclusiveGroup: 'capstone',
        desc: 'Dash or Active Skill opens a 3.0s Time-Rift slowing enemies 50% & granting +35% Fire Rate inside, plus -20% Skill Cooldown.',
        drawback: '-12% Move Speed.',
        cost: 28000,
        materials: { ambrosia_spark: 2, olympian_bronze: 10, mati_crystal: 9 },
        unlockRequirements: { bossId: 'zeus', endlessWave: 40 },
        maxRank: 3,
        ranks: [
            {
                rank: 1,
                summary: '3.0s Rift (300px) • -50% Enemy Speed • +35% Fire Rate inside • -20% Skill CD',
                stats: {
                    riftDurationSec: 3.0,
                    riftRadius: 300,
                    enemySlowMult: 0.50,
                    insideFireRateBonus: 0.35,
                    skillCdReduction: 0.20,
                    moveSpeedPenalty: 0.12
                }
            },
            {
                rank: 2,
                summary: '3.5s Rift (325px) • -58% Enemy Speed • +45% Fire Rate inside • -28% Skill CD',
                upgradeCost: { coins: 32000, materials: { ambrosia_spark: 2, olympian_bronze: 13, mati_crystal: 11 } },
                stats: {
                    riftDurationSec: 3.5,
                    riftRadius: 325,
                    enemySlowMult: 0.42,
                    insideFireRateBonus: 0.45,
                    skillCdReduction: 0.28,
                    moveSpeedPenalty: 0.12
                }
            },
            {
                rank: 3,
                summary: '4.0s Rift (350px) • -65% Enemy Speed • +55% Fire Rate inside • -35% Skill CD',
                upgradeCost: { coins: 40000, materials: { ambrosia_spark: 3, olympian_bronze: 16, armory_shards: 25 } },
                stats: {
                    riftDurationSec: 4.0,
                    riftRadius: 350,
                    enemySlowMult: 0.35,
                    insideFireRateBonus: 0.55,
                    skillCdReduction: 0.35,
                    moveSpeedPenalty: 0.12
                }
            }
        ],
        color: '#8e44ad',
        accent: '#00cec9'
    },
    midas_curse: {
        id: 'midas_curse',
        name: 'Gilded Curse of Midas',
        icon: '🪙',
        iconImg: 'assets/ui-icons/coin.svg',
        badge: 'ECONOMY',
        rarity: 'mythic',
        tag: 'capstone',
        tagLabel: 'MIDAS CURSE',
        exclusiveGroup: 'capstone',
        desc: '+25% Run Coins & Account XP, +1% Damage per 20 carried Coins (max +25%), and Elites/Mini-Bosses can drop bonus Shards or Mati Crystals.',
        drawback: 'Health Hearts heal 35% less HP.',
        cost: 30000,
        materials: { ambrosia_spark: 2, olympian_bronze: 12, armory_shards: 24 },
        unlockRequirements: { bossId: 'endless_boss', endlessWave: 45 },
        maxRank: 3,
        ranks: [
            {
                rank: 1,
                summary: '+25% Coins & XP • +1% Dmg/20 Coins (max +25%) • 22% Elite/Boss Shard/Crystal drop',
                stats: {
                    coinBonus: 0.25,
                    xpBonus: 0.25,
                    coinsPerPct: 20,
                    maxCoinDmgBonus: 0.25,
                    matDropChance: 0.22,
                    crystalShare: 0.25,
                    healPenalty: 0.35
                }
            },
            {
                rank: 2,
                summary: '+35% Coins & XP • +1% Dmg/16 Coins (max +35%) • 32% Elite/Boss Shard/Crystal drop',
                upgradeCost: { coins: 35000, materials: { ambrosia_spark: 2, olympian_bronze: 14, mati_crystal: 12 } },
                stats: {
                    coinBonus: 0.35,
                    xpBonus: 0.35,
                    coinsPerPct: 16,
                    maxCoinDmgBonus: 0.35,
                    matDropChance: 0.32,
                    crystalShare: 0.35,
                    healPenalty: 0.35
                }
            },
            {
                rank: 3,
                summary: '+45% Coins & XP • +1% Dmg/12 Coins (max +45%) • Guaranteed Mini-Boss Shards + 45% Crystal chance',
                upgradeCost: { coins: 45000, materials: { ambrosia_spark: 3, olympian_bronze: 18, mati_crystal: 15 } },
                stats: {
                    coinBonus: 0.45,
                    xpBonus: 0.45,
                    coinsPerPct: 12,
                    maxCoinDmgBonus: 0.45,
                    matDropChance: 0.45,
                    crystalShare: 0.45,
                    guaranteedMiniBossDrop: true,
                    healPenalty: 0.35
                }
            }
        ],
        color: '#b7791f',
        accent: '#ffd32a'
    }
};

if (typeof window !== 'undefined') {
    window.MYTHIC_PERKS_DATA = MYTHIC_PERKS_DATA;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MYTHIC_PERKS_DATA };
}
