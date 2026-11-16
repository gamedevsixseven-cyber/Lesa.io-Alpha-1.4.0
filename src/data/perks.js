/**
 * Lesa.io - Battle Perks Data Registry
 * Defines starter & forgeable Battle Perks, Upgrade Ranks (Lv.1 -> Lv.3),
 * Craft Costs (Coins + Materials), Combat Feat Gates, and Exclusive Slot Groups.
 */

const EXCLUSIVE_PERK_TAGS = ['dash', 'capstone'];

const EXCLUSIVE_TAG_META = {
    dash: {
        label: 'DASH MOD',
        max: 1,
        swapLabel: 'Dash Perk',
        badgeText: 'MAX 1 DASH'
    },
    capstone: {
        label: 'OLYMPUS CAPSTONE',
        max: 1,
        swapLabel: 'Capstone Perk',
        badgeText: 'CAPSTONE (MAX 1)'
    }
};

const PERK_RARITIES = {
    starter: { id: 'starter', label: 'STARTER', color: '#00b894', bg: '#dff9fb', border: '#00b894' },
    rare: { id: 'rare', label: 'RARE', color: '#0984e3', bg: '#e8f4fd', border: '#3498db' },
    epic: { id: 'epic', label: 'EPIC', color: '#8e44ad', bg: '#f5eef8', border: '#9b59b6' },
    legendary: { id: 'legendary', label: 'LEGENDARY', color: '#d97706', bg: '#fef5e7', border: '#f59e0b' },
    mythic: { id: 'mythic', label: 'MYTHIC', color: '#c0392b', bg: '#fdecea', border: '#e74c3c' }
};

const PERKS_DATA = {
    hot_foot: {
        id: 'hot_foot',
        name: 'Hot Foot',
        icon: '🔥',
        iconImg: 'assets/ui-icons/flame.svg',
        badge: 'MOBILITY',
        rarity: 'starter',
        tag: 'dash',
        tagLabel: 'DASH MOD',
        exclusiveGroup: 'dash',
        desc: 'Dashing leaves a burning fire trail (lasts 2s) that deals 35 dmg/s and slows enemies by 30%. (Free at Level 5!)',
        cost: 0,
        unlockLevel: 5,
        unlockRequirements: { level: 5 },
        maxRank: 3,
        ranks: [
            {
                rank: 1,
                summary: '35 dmg/s burn • 2.0s trail • 30% slow',
                stats: { dps: 35, durationSec: 2.0, slowFactor: 0.70, radius: 30 }
            },
            {
                rank: 2,
                summary: '50 dmg/s burn • 2.4s trail • 35% slow • +20% trail width',
                upgradeCost: { coins: 3000, materials: { armory_shards: 15 } },
                stats: { dps: 50, durationSec: 2.4, slowFactor: 0.65, radius: 36 }
            },
            {
                rank: 3,
                summary: '70 dmg/s burn • 2.8s trail • 40% slow • +40% trail width',
                upgradeCost: { coins: 7500, materials: { mati_crystal: 6 } },
                stats: { dps: 70, durationSec: 2.8, slowFactor: 0.60, radius: 42 }
            }
        ],
        color: '#ff4757',
        accent: '#ff6b81'
    },
    counter_blast: {
        id: 'counter_blast',
        name: 'Counter-Blast',
        icon: '💥',
        iconImg: 'assets/ui-icons/boom.svg',
        badge: 'DEFENSE',
        rarity: 'rare',
        tag: 'on_hurt',
        tagLabel: 'ON HURT',
        desc: 'Taking damage triggers a 360° radial shockwave burst that deals 25 dmg and knocks back nearby enemies.',
        cost: 2400,
        maxRank: 3,
        ranks: [
            {
                rank: 1,
                summary: '8 radial bolts • 25 dmg • 36px push',
                stats: { projectileCount: 8, damage: 25, knockback: 36 }
            },
            {
                rank: 2,
                summary: '10 radial bolts • 38 dmg • 44px push',
                upgradeCost: { coins: 3500, materials: { armory_shards: 15 } },
                stats: { projectileCount: 10, damage: 38, knockback: 44 }
            },
            {
                rank: 3,
                summary: '12 radial bolts • 55 dmg • 54px push',
                upgradeCost: { coins: 8000, materials: { mati_crystal: 6 } },
                stats: { projectileCount: 12, damage: 55, knockback: 54 }
            }
        ],
        color: '#e67e22',
        accent: '#f39c12'
    },
    golden_touch: {
        id: 'golden_touch',
        name: 'Golden Touch',
        icon: '🪙',
        iconImg: 'assets/ui-icons/coin.svg',
        badge: 'ECONOMY',
        rarity: 'rare',
        tag: 'economy',
        tagLabel: 'BRUTE DROP',
        desc: 'Defeated brutes (Fatmirs, Casillases, Skarmogyftos) have a 60% chance to drop Gold Pouches (+15–25 coins).',
        cost: 3500,
        maxRank: 3,
        ranks: [
            {
                rank: 1,
                summary: '60% brute drop • +15–25 Coin Pouches',
                stats: { dropChance: 0.60, minCoins: 15, maxCoins: 25 }
            },
            {
                rank: 2,
                summary: '75% brute drop • +20–35 Coin Pouches',
                upgradeCost: { coins: 4500, materials: { armory_shards: 20 } },
                stats: { dropChance: 0.75, minCoins: 20, maxCoins: 35 }
            },
            {
                rank: 3,
                summary: '90% brute drop • +28–45 Coin Pouches',
                upgradeCost: { coins: 9000, materials: { mati_crystal: 8 } },
                stats: { dropChance: 0.90, minCoins: 28, maxCoins: 45 }
            }
        ],
        color: '#f1c40f',
        accent: '#ffeaa7'
    },
    last_laugh: {
        id: 'last_laugh',
        name: 'Last Laugh',
        icon: '💣',
        iconImg: 'assets/ui-icons/bomb.svg',
        badge: 'CHAOS',
        rarity: 'rare',
        tag: 'on_kill',
        tagLabel: 'ON KILL',
        desc: 'Defeated enemies have a 20% chance to drop a live mini-dynamite that detonates after 1s for 40 AoE damage.',
        cost: 3000,
        maxRank: 3,
        ranks: [
            {
                rank: 1,
                summary: '20% trigger • 100px blast • 40 AoE dmg',
                stats: { procChance: 0.20, radius: 100, damage: 40 }
            },
            {
                rank: 2,
                summary: '25% trigger • 115px blast • 60 AoE dmg',
                upgradeCost: { coins: 4000, materials: { armory_shards: 18 } },
                stats: { procChance: 0.25, radius: 115, damage: 60 }
            },
            {
                rank: 3,
                summary: '30% trigger • 130px blast • 85 AoE dmg',
                upgradeCost: { coins: 8500, materials: { mati_crystal: 8 } },
                stats: { procChance: 0.30, radius: 130, damage: 85 }
            }
        ],
        color: '#e74c3c',
        accent: '#ff7675'
    },
    second_wind: {
        id: 'second_wind',
        name: 'Second Wind',
        icon: '⚡',
        iconImg: 'assets/ui-icons/bolt.svg',
        badge: 'SURVIVAL',
        rarity: 'rare',
        tag: 'survival',
        tagLabel: 'LOW HP',
        desc: 'When HP drops below 25%, instantly reset Dash cooldown and gain +25% move speed for 3s (30s CD).',
        cost: 4500,
        maxRank: 3,
        ranks: [
            {
                rank: 1,
                summary: '<25% HP • +25% speed (3s) • 30s CD',
                stats: { hpThreshold: 0.25, speedMult: 1.25, durationSec: 3.0, cooldownSec: 30 }
            },
            {
                rank: 2,
                summary: '<30% HP • +30% speed (3.5s) • 24s CD',
                upgradeCost: { coins: 5500, materials: { armory_shards: 20, mati_crystal: 3 } },
                stats: { hpThreshold: 0.30, speedMult: 1.30, durationSec: 3.5, cooldownSec: 24 }
            },
            {
                rank: 3,
                summary: '<35% HP • +35% speed (4s) • 18s CD',
                upgradeCost: { coins: 11000, materials: { mati_crystal: 8, olympian_bronze: 4 } },
                stats: { hpThreshold: 0.35, speedMult: 1.35, durationSec: 4.0, cooldownSec: 18 }
            }
        ],
        color: '#3498db',
        accent: '#70a1ff'
    },
    headhunter: {
        id: 'headhunter',
        name: 'Headhunter',
        icon: '🎯',
        iconImg: 'assets/ui-icons/target.svg',
        badge: 'OFFENSE',
        rarity: 'epic',
        tag: 'execute',
        tagLabel: 'EXECUTE',
        desc: 'Deals +25% execute damage against weakened enemies that are below 35% health.',
        cost: 6000,
        maxRank: 3,
        ranks: [
            {
                rank: 1,
                summary: '+25% execute damage below 35% HP',
                stats: { hpThreshold: 0.35, damageMult: 1.25 }
            },
            {
                rank: 2,
                summary: '+35% execute damage below 40% HP',
                upgradeCost: { coins: 7000, materials: { armory_shards: 25, mati_crystal: 4 } },
                stats: { hpThreshold: 0.40, damageMult: 1.35 }
            },
            {
                rank: 3,
                summary: '+45% execute damage below 45% HP',
                upgradeCost: { coins: 14000, materials: { olympian_bronze: 8, ambrosia_spark: 1 } },
                stats: { hpThreshold: 0.45, damageMult: 1.45 }
            }
        ],
        color: '#9b59b6',
        accent: '#a29bfe'
    },
    phantom_espresso: {
        id: 'phantom_espresso',
        name: 'Phantom Espresso',
        icon: '☕',
        iconImg: 'assets/ui-icons/swirl.svg',
        badge: 'MOBILITY',
        rarity: 'epic',
        tag: 'dash',
        tagLabel: 'DASH MOD',
        exclusiveGroup: 'dash',
        desc: 'Dashing leaves an electric Espresso Decoy that lures non-boss enemies & pops in a shock burst, trims Hero Skill CD, and surges Fire Rate.',
        cost: 6500,
        materials: { armory_shards: 20, mati_crystal: 4 },
        unlockRequirements: { bossId: 'kleanthis', level: 10 },
        maxRank: 3,
        ranks: [
            {
                rank: 1,
                summary: '1.1s decoy (45 shock AoE) • -25% Skill CD • +22% Fire Rate (1.6s)',
                stats: { decoyDurationSec: 1.1, blastDamage: 45, blastRadius: 115, tauntRadius: 320, skillCdTrim: 0.25, fireRateBonus: 0.22, hasteDurationSec: 1.6 }
            },
            {
                rank: 2,
                summary: '1.4s decoy (65 shock AoE) • -35% Skill CD • +30% Fire Rate (1.8s)',
                upgradeCost: { coins: 7500, materials: { armory_shards: 25, mati_crystal: 5 } },
                stats: { decoyDurationSec: 1.4, blastDamage: 65, blastRadius: 130, tauntRadius: 350, skillCdTrim: 0.35, fireRateBonus: 0.30, hasteDurationSec: 1.8 }
            },
            {
                rank: 3,
                summary: '1.8s decoy (90 shock AoE) • -45% Skill CD • +38% Fire Rate (2.0s)',
                upgradeCost: { coins: 11500, materials: { mati_crystal: 8, olympian_bronze: 3 } },
                stats: { decoyDurationSec: 1.8, blastDamage: 90, blastRadius: 145, tauntRadius: 380, skillCdTrim: 0.45, fireRateBonus: 0.38, hasteDurationSec: 2.0 }
            }
        ],
        color: '#6c5ce7',
        accent: '#a29bfe'
    },
    evil_eye_mirror: {
        id: 'evil_eye_mirror',
        name: 'Evil-Eye Mirror',
        icon: '🧿',
        iconImg: 'assets/ui-icons/orb_blue.svg',
        badge: 'DEFENSE',
        rarity: 'epic',
        tag: 'ward',
        tagLabel: 'WARD ORB',
        desc: 'Conjures an orbiting Cobalt Mati Ward every 14s without taking damage. Absorbs an incoming strike and fires a piercing Curse Bolt.',
        cost: 7500,
        materials: { armory_shards: 25, mati_crystal: 6 },
        unlockRequirements: { bossId: 'kiloumpas' },
        maxRank: 3,
        ranks: [
            {
                rank: 1,
                summary: '14s recharge • Blocks non-boss hits (65% vs bosses) • 55 curse bolt + slow',
                stats: { rechargeSec: 14, absorbRatio: 0.65, fullBlockNonBoss: true, reflectDamage: 55, slowSec: 1.5, boltRadius: 11 }
            },
            {
                rank: 2,
                summary: '11.5s recharge • Blocks non-boss hits (75% vs bosses) • 80 curse bolt + slow',
                upgradeCost: { coins: 8500, materials: { mati_crystal: 7, olympian_bronze: 2 } },
                stats: { rechargeSec: 11.5, absorbRatio: 0.75, fullBlockNonBoss: true, reflectDamage: 80, slowSec: 2.0, boltRadius: 13 }
            },
            {
                rank: 3,
                summary: '9s recharge • Full 100% block on ANY hit • 115 curse bolt + freeze chill',
                upgradeCost: { coins: 12500, materials: { mati_crystal: 10, olympian_bronze: 4 } },
                stats: { rechargeSec: 9.0, absorbRatio: 1.0, fullBlockNonBoss: true, reflectDamage: 115, slowSec: 2.5, boltRadius: 15 }
            }
        ],
        color: '#0984e3',
        accent: '#74b9ff'
    },
    bloodstring_bouzouki: {
        id: 'bloodstring_bouzouki',
        name: 'Bloodstring Bouzouki',
        icon: '🪕',
        iconImg: 'assets/ui-icons/music.svg',
        badge: 'SURVIVAL',
        rarity: 'epic',
        tag: 'lifesteal',
        tagLabel: 'KILL RHYTHM',
        desc: 'Every 12 kills unleashes a Cordial Chord: heals HP (overflows into Temp Barrier up to +25) and widens item Magnet.',
        cost: 8000,
        materials: { armory_shards: 20, mati_crystal: 5 },
        unlockRequirements: { anyOf: [{ endlessWave: 12 }, { storyWave: 16 }] },
        maxRank: 3,
        ranks: [
            {
                rank: 1,
                summary: 'Every 12 kills • Heal 12 HP (+25 max Barrier) • +50% Magnet (4s)',
                stats: { killsPerPulse: 12, healAmount: 12, maxBarrier: 25, magnetBonus: 0.50, magnetDurationSec: 4.0 }
            },
            {
                rank: 2,
                summary: 'Every 10 kills • Heal 17 HP (+35 max Barrier) • +65% Magnet (4.5s)',
                upgradeCost: { coins: 9000, materials: { armory_shards: 25, mati_crystal: 6 } },
                stats: { killsPerPulse: 10, healAmount: 17, maxBarrier: 35, magnetBonus: 0.65, magnetDurationSec: 4.5 }
            },
            {
                rank: 3,
                summary: 'Every 8 kills • Heal 22 HP (+45 max Barrier) • +80% Magnet (5s)',
                upgradeCost: { coins: 13500, materials: { mati_crystal: 9, olympian_bronze: 4 } },
                stats: { killsPerPulse: 8, healAmount: 22, maxBarrier: 45, magnetBonus: 0.80, magnetDurationSec: 5.0 }
            }
        ],
        color: '#e84393',
        accent: '#fd79a8'
    },
    ouzo_chain_spark: {
        id: 'ouzo_chain_spark',
        name: 'Ouzo Chain-Spark',
        icon: '🌩️',
        iconImg: 'assets/ui-icons/sparkle.svg',
        badge: 'OFFENSE',
        rarity: 'epic',
        tag: 'chain_arc',
        tagLabel: 'CHAIN ARC',
        desc: 'Critical hits and kills have a 30% chance to arc Ouzo Lightning across nearby enemies for 35% bullet damage (+20% vs slowed foes).',
        cost: 9000,
        materials: { mati_crystal: 6, olympian_bronze: 3 },
        unlockRequirements: { bossId: 'casillas_sentinel' },
        maxRank: 3,
        ranks: [
            {
                rank: 1,
                summary: '30% on crit/kill • Arcs to 2 foes (160px) • 35% dmg (+20% slowed)',
                stats: { procChance: 0.30, maxJumps: 2, arcRadius: 160, dmgRatio: 0.35, slowedBonus: 1.20 }
            },
            {
                rank: 2,
                summary: '40% on crit/kill • Arcs to 3 foes (180px) • 45% dmg (+25% slowed)',
                upgradeCost: { coins: 10000, materials: { mati_crystal: 8, olympian_bronze: 5 } },
                stats: { procChance: 0.40, maxJumps: 3, arcRadius: 180, dmgRatio: 0.45, slowedBonus: 1.25 }
            },
            {
                rank: 3,
                summary: '50% on crit/kill • Arcs to 4 foes (200px) • 55% dmg (+30% slowed)',
                upgradeCost: { coins: 14500, materials: { olympian_bronze: 9, ambrosia_spark: 1 } },
                stats: { procChance: 0.50, maxJumps: 4, arcRadius: 200, dmgRatio: 0.55, slowedBonus: 1.30 }
            }
        ],
        color: '#00a8ff',
        accent: '#4cd137'
    },
    tavli_double_sixes: {
        id: 'tavli_double_sixes',
        name: 'Tavli Double-Sixes',
        icon: '🎲',
        iconImg: 'assets/ui-icons/bag_gold.svg',
        badge: 'ECONOMY',
        rarity: 'epic',
        tag: 'fortune',
        tagLabel: 'DOUBLE DICE',
        desc: '+8% Coin & Account XP rewards. Every 6th Crate or Brute rolls Double-Sixes for extra Coin Pouches & Shards/Mati chance.',
        cost: 8500,
        materials: { armory_shards: 18, mati_crystal: 5 },
        unlockRequirements: { endlessWave: 15, bossId: 'kleanthis' },
        maxRank: 3,
        ranks: [
            {
                rank: 1,
                summary: '+8% Coins & XP • Every 6th Crate/Brute: +22 Pouch & 30% Shard roll',
                stats: { coinMultBonus: 0.08, xpMultBonus: 0.08, rollInterval: 6, pouchBonus: 22, shardChance: 0.30, crystalChance: 0.12 }
            },
            {
                rank: 2,
                summary: '+12% Coins & XP • Every 5th Crate/Brute: +32 Pouch & 45% Shard / 20% Mati',
                upgradeCost: { coins: 9500, materials: { armory_shards: 22, mati_crystal: 7 } },
                stats: { coinMultBonus: 0.12, xpMultBonus: 0.12, rollInterval: 5, pouchBonus: 32, shardChance: 0.45, crystalChance: 0.20 }
            },
            {
                rank: 3,
                summary: '+16% Coins & XP • Every 4th Crate/Brute: +45 Pouch & 60% Shard / 30% Mati',
                upgradeCost: { coins: 13500, materials: { mati_crystal: 10, olympian_bronze: 5 } },
                stats: { coinMultBonus: 0.16, xpMultBonus: 0.16, rollInterval: 4, pouchBonus: 45, shardChance: 0.60, crystalChance: 0.30 }
            }
        ],
        color: '#d35400',
        accent: '#f39c12'
    },
    ...(typeof LEGENDARY_PERKS_DATA !== 'undefined' ? LEGENDARY_PERKS_DATA : {}),
    ...(typeof MYTHIC_PERKS_DATA !== 'undefined' ? MYTHIC_PERKS_DATA : {})
};

if (typeof window !== 'undefined') {
    window.EXCLUSIVE_PERK_TAGS = EXCLUSIVE_PERK_TAGS;
    window.EXCLUSIVE_TAG_META = EXCLUSIVE_TAG_META;
    window.PERK_RARITIES = PERK_RARITIES;
    window.PERKS_DATA = PERKS_DATA;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EXCLUSIVE_PERK_TAGS, EXCLUSIVE_TAG_META, PERK_RARITIES, PERKS_DATA };
}
