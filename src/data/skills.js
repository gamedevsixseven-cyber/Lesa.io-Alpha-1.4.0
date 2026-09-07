/**
 * Lesa.io - Authoritative Skills & Battle Abilities Registry
 * Defines active player skills, rarities, multi-tier upgrade progressions, and stat scalings.
 * Rarities:
 *  - Common (⚪): 3 Upgrades (Nerobalonaki - lowest cost)
 *  - Uncommon (🟢): 3 Upgrades (Blade Rush)
 *  - Rare (🔵): 4 Upgrades (Seismic Quake)
 *  - Epic (🟣): 5 Upgrades (Yaya Scream)
 *  - Legendary (🟠): 5 Upgrades + Pagakia Mastery (Frappes - costs Coins & Diamonds)
 */

const SKILLS = {
    nerobalonaki: {
        id: 'nerobalonaki',
        name: 'Nerobalonaki',
        rarity: 'Common',
        iconImg: 'assets/SkillsIcons/NerobalonakiSkill.png',
        icon: '💧🎈',
        key: 'E',
        badge: 'WATER HAZARD',
        category: 'Control / Debuff',
        unlockedDefault: true,
        unlockCost: 0,
        maxLevel: 3,
        cooldown: 6.0,
        desc: 'Drop a cartoon water balloon that bursts into a huge slippery splash puddle! Drenches enemies, heavily slowing movement and amplifying incoming damage.',
        levels: {
            1: {
                level: 1,
                upgradeCost: 450,
                radius: 105,
                duration: 360, // 6.0s
                slowMultiplier: 0.55, // -45% slow
                damageAmp: 1.30, // +30% damage taken
                stats: [
                    { label: 'Enemy Slow', value: '-45% Walk Speed' },
                    { label: 'Damage Amp', value: '+30% Damage Taken' },
                    { label: 'Cooldown', value: '6.0s' },
                    { label: 'Puddle Radius', value: '105px (6.0s)' }
                ]
            },
            2: {
                level: 2,
                upgradeCost: 950,
                radius: 130,
                duration: 450, // 7.5s
                slowMultiplier: 0.45, // -55% slow
                damageAmp: 1.40, // +40% damage taken
                stats: [
                    { label: 'Enemy Slow', value: '-55% Walk Speed' },
                    { label: 'Damage Amp', value: '+40% Damage Taken' },
                    { label: 'Cooldown', value: '6.0s' },
                    { label: 'Puddle Radius', value: '130px (7.5s)' }
                ]
            },
            3: {
                level: 3,
                upgradeCost: 0, // MAX LEVEL
                radius: 155,
                duration: 540, // 9.0s
                slowMultiplier: 0.35, // -65% slow
                damageAmp: 1.50, // +50% damage taken
                stats: [
                    { label: 'Enemy Slow', value: '-65% Walk Speed' },
                    { label: 'Damage Amp', value: '+50% Damage Taken' },
                    { label: 'Cooldown', value: '6.0s' },
                    { label: 'Puddle Radius', value: '155px Torrent (9.0s) ⭐' }
                ]
            }
        },
        stats: [
            { label: 'Enemy Slow', value: '-45% Walk Speed' },
            { label: 'Damage Amp', value: '+30% Damage Taken' },
            { label: 'Cooldown', value: '6.0s' },
            { label: 'Puddle Duration', value: '6.0 Seconds' }
        ]
    },
    blade_rush: {
        id: 'blade_rush',
        name: 'Blade Rush',
        rarity: 'Uncommon',
        iconImg: 'assets/SkillsIcons/BladeRushSkill.png',
        icon: '🗡️',
        key: 'E',
        badge: 'SLASH DASH',
        category: 'Offensive / Mobility',
        unlockedDefault: true,
        unlockCost: 0,
        maxLevel: 3,
        cooldown: 8.0,
        desc: 'Dash forward drawing a razor-sharp tactical combat knife with an airy swish arc, slicing through all enemies with invulnerability frames!',
        levels: {
            1: {
                level: 1,
                upgradeCost: 750,
                damage: 90,
                reach: 75,
                rushDist: 210,
                stats: [
                    { label: 'Damage', value: '90 Slash' },
                    { label: 'Cooldown', value: '8.0s' },
                    { label: 'Slash Reach', value: '75px' },
                    { label: 'Special', value: 'Invulnerability Frames' }
                ]
            },
            2: {
                level: 2,
                upgradeCost: 1600,
                damage: 135,
                reach: 92,
                rushDist: 245,
                stats: [
                    { label: 'Damage', value: '135 Slash (+50%)' },
                    { label: 'Cooldown', value: '8.0s' },
                    { label: 'Slash Reach', value: '92px (+23%)' },
                    { label: 'Special', value: 'Extended Dash Reach' }
                ]
            },
            3: {
                level: 3,
                upgradeCost: 0, // MAX LEVEL
                damage: 185,
                reach: 110,
                rushDist: 280,
                stats: [
                    { label: 'Damage', value: '185 Slash (+105%)' },
                    { label: 'Cooldown', value: '8.0s' },
                    { label: 'Slash Reach', value: '110px (+47%)' },
                    { label: 'Special', value: 'Razor Cleave Mastery ⭐' }
                ]
            }
        },
        stats: [
            { label: 'Damage', value: '90 Slash' },
            { label: 'Cooldown', value: '8.0s' },
            { label: 'Knockback', value: 'High' },
            { label: 'Special', value: 'Invulnerability Frames' }
        ]
    },
    seismic_quake: {
        id: 'seismic_quake',
        name: 'Seismic Quake',
        rarity: 'Rare',
        iconImg: 'assets/SkillsIcons/SeismicQuakeSkill.png',
        icon: '🪨',
        key: 'E',
        badge: 'TITAN QUAKE',
        category: 'Crowd Control / Heavy',
        unlockedDefault: false,
        unlockCost: 1400,
        maxLevel: 4,
        cooldown: 10.0,
        desc: 'Leap and slam the ground with titan force! Releases 360° crushing seismic shockwaves that stun enemies and interrupt brute charges!',
        levels: {
            1: {
                level: 1,
                upgradeCost: 2100,
                damage: 140,
                radius: 160,
                stunDuration: 2.0,
                knockback: 18,
                stats: [
                    { label: 'Crush Damage', value: '140 Area' },
                    { label: 'Stun Duration', value: '2.0s Shockwave' },
                    { label: 'Cooldown', value: '10.0s' },
                    { label: 'Quake Radius', value: '160px Stomp' }
                ]
            },
            2: {
                level: 2,
                upgradeCost: 3200,
                damage: 210,
                radius: 185,
                stunDuration: 2.5,
                knockback: 22,
                stats: [
                    { label: 'Crush Damage', value: '210 Area (+50%)' },
                    { label: 'Stun Duration', value: '2.5s Shockwave' },
                    { label: 'Cooldown', value: '10.0s' },
                    { label: 'Quake Radius', value: '185px Stomp' }
                ]
            },
            3: {
                level: 3,
                upgradeCost: 4800,
                damage: 290,
                radius: 215,
                stunDuration: 3.0,
                knockback: 26,
                stats: [
                    { label: 'Crush Damage', value: '290 Area (+107%)' },
                    { label: 'Stun Duration', value: '3.0s Shockwave' },
                    { label: 'Cooldown', value: '10.0s' },
                    { label: 'Quake Radius', value: '215px Stomp' }
                ]
            },
            4: {
                level: 4,
                upgradeCost: 0, // MAX LEVEL
                damage: 380,
                radius: 250,
                stunDuration: 3.8,
                knockback: 32,
                stats: [
                    { label: 'Crush Damage', value: '380 Titan Crush (+171%)' },
                    { label: 'Stun Duration', value: '3.8s Massive Stun' },
                    { label: 'Cooldown', value: '10.0s' },
                    { label: 'Special', value: 'Interrupts Brute Charges ⭐' }
                ]
            }
        },
        stats: [
            { label: 'Crush Damage', value: '140 Area' },
            { label: 'Stun Duration', value: '2.0s Shockwave' },
            { label: 'Cooldown', value: '10.0s' },
            { label: 'Special', value: 'Interrupts Brute Charges' }
        ]
    },
    yaya_scream: {
        id: 'yaya_scream',
        name: 'Yaya Scream',
        rarity: 'Epic',
        iconImg: 'assets/SkillsIcons/YayaScreamSkill.png',
        icon: '📢',
        key: 'E',
        badge: 'YAYA TERROR',
        category: 'Debuff / Projectile Deflect',
        unlockedDefault: false,
        unlockCost: 2800,
        maxLevel: 5,
        cooldown: 11.0,
        desc: 'Unleash an ear-splitting Greek auntie scream through a vintage megaphone! Blasts a 180° sonic wave that deflects enemy bullets and terrifies enemies into fleeing!',
        levels: {
            1: {
                level: 1,
                upgradeCost: 3800,
                damage: 110,
                range: 240,
                coneAngle: Math.PI, // 180 deg
                fearDuration: 3.0,
                stats: [
                    { label: 'Sonic Damage', value: '110 Frontal Cone' },
                    { label: 'Fear Duration', value: '3.0s Enemies Flee' },
                    { label: 'Cooldown', value: '11.0s' },
                    { label: 'Special', value: 'Knocks Back Bullets' }
                ]
            },
            2: {
                level: 2,
                upgradeCost: 5200,
                damage: 160,
                range: 270,
                coneAngle: Math.PI,
                fearDuration: 3.5,
                stats: [
                    { label: 'Sonic Damage', value: '160 Frontal Cone (+45%)' },
                    { label: 'Fear Duration', value: '3.5s Enemies Flee' },
                    { label: 'Cooldown', value: '11.0s' },
                    { label: 'Range', value: '270px Megaphone' }
                ]
            },
            3: {
                level: 3,
                upgradeCost: 6900,
                damage: 220,
                range: 300,
                coneAngle: Math.PI,
                fearDuration: 4.0,
                stats: [
                    { label: 'Sonic Damage', value: '220 Frontal Cone (+100%)' },
                    { label: 'Fear Duration', value: '4.0s Enemies Flee' },
                    { label: 'Cooldown', value: '11.0s' },
                    { label: 'Range', value: '300px Megaphone' }
                ]
            },
            4: {
                level: 4,
                upgradeCost: 9000,
                damage: 290,
                range: 330,
                coneAngle: Math.PI,
                fearDuration: 4.5,
                stats: [
                    { label: 'Sonic Damage', value: '290 Frontal Cone (+163%)' },
                    { label: 'Fear Duration', value: '4.5s Enemies Flee' },
                    { label: 'Cooldown', value: '11.0s' },
                    { label: 'Special', value: 'Sonic Shockwaves' }
                ]
            },
            5: {
                level: 5,
                upgradeCost: 0, // MAX LEVEL
                damage: 370,
                range: 370,
                coneAngle: Math.PI,
                fearDuration: 5.5,
                stats: [
                    { label: 'Sonic Damage', value: '370 Ear-Splitter (+236%)' },
                    { label: 'Fear Duration', value: '5.5s Total Panic' },
                    { label: 'Cooldown', value: '11.0s' },
                    { label: 'Special', value: 'Deflects All Projectiles ⭐' }
                ]
            }
        },
        stats: [
            { label: 'Sonic Damage', value: '110 Frontal Cone' },
            { label: 'Fear Duration', value: '3.0s Enemies Flee' },
            { label: 'Cooldown', value: '11.0s' },
            { label: 'Special', value: 'Deflects Bullets' }
        ]
    },
    frappes: {
        id: 'frappes',
        name: 'Frappes',
        masteryName: 'Frappes+',
        rarity: 'Legendary',
        iconImg: 'assets/SkillsIcons/FrappesSkill.png',
        icon: '🥤',
        key: 'E',
        badge: 'GREEK FRENZY',
        category: 'Frenzy / Mastery Capstone',
        unlockedDefault: false,
        unlockCost: 5000,
        maxLevel: 5,
        cooldown: 12.0,
        masteryCooldown: 9.0,
        hasMastery: true,
        masteryBonusText: 'Pagakia 🧊 (-3s Cooldown, Ice Slow Aura, Kills Extend Frenzy)',
        desc: 'Chug an iced-cold frothy Greek Frappé! Enters a high-speed Caffeinated Frenzy: hyper movement speed, accelerated fire rate, and instant ammo reload.',
        levels: {
            1: {
                level: 1,
                upgradeCost: 6800,
                gemCost: 0,
                duration: 300, // 5.0s
                speedBuff: 1.65,
                fireRateBuff: 1.50,
                stats: [
                    { label: 'Speed Boost', value: '+65% Move Speed' },
                    { label: 'Fire Rate', value: '+50% Attack Speed' },
                    { label: 'Duration', value: '5.0s Caffeinated' },
                    { label: 'Special', value: 'Instant Ammo Reload' }
                ]
            },
            2: {
                level: 2,
                upgradeCost: 8900,
                gemCost: 0,
                duration: 330, // 5.5s
                speedBuff: 1.70,
                fireRateBuff: 1.55,
                stats: [
                    { label: 'Speed Boost', value: '+70% Move Speed' },
                    { label: 'Fire Rate', value: '+55% Attack Speed' },
                    { label: 'Duration', value: '5.5s Caffeinated' },
                    { label: 'Special', value: 'Instant Ammo Reload' }
                ]
            },
            3: {
                level: 3,
                upgradeCost: 11500,
                gemCost: 0,
                duration: 360, // 6.0s
                speedBuff: 1.75,
                fireRateBuff: 1.60,
                stats: [
                    { label: 'Speed Boost', value: '+75% Move Speed' },
                    { label: 'Fire Rate', value: '+60% Attack Speed' },
                    { label: 'Duration', value: '6.0s Caffeinated' },
                    { label: 'Special', value: 'Instant Ammo Reload' }
                ]
            },
            4: {
                level: 4,
                upgradeCost: 15000,
                gemCost: 120, // Mastery requires Diamonds as requested!
                duration: 390, // 6.5s
                speedBuff: 1.80,
                fireRateBuff: 1.65,
                isMasteryNext: true,
                stats: [
                    { label: 'Speed Boost', value: '+80% Move Speed' },
                    { label: 'Fire Rate', value: '+65% Attack Speed' },
                    { label: 'Duration', value: '6.5s Caffeinated' },
                    { label: 'Next Tier', value: '⭐ PAGAKIA MASTERY' }
                ]
            },
            5: {
                level: 5,
                upgradeCost: 0, // MAX LEVEL
                gemCost: 0,
                duration: 480, // 8.0s
                speedBuff: 1.85,
                fireRateBuff: 1.70,
                cooldown: 9.0, // Permanent CDR
                isMastered: true,
                stats: [
                    { label: 'Bonus Form', value: 'Frappes+ with Pagakia 🧊' },
                    { label: 'Cooldown', value: '9.0s (-3.0s CDR)' },
                    { label: 'Frost Aura', value: 'Attacks Slow -50%' },
                    { label: 'Mastery Perk', value: 'Kills Add +0.8s Duration ⭐' }
                ]
            }
        },
        stats: [
            { label: 'Speed Boost', value: '+65% Move Speed' },
            { label: 'Fire Rate', value: '+50% Attack Speed' },
            { label: 'Duration', value: '5.0s Caffeinated' },
            { label: 'Mastery', value: 'Pagakia 🧊 (Frappes+)' }
        ]
    }
};

if (typeof window !== 'undefined') {
    window.SKILLS = SKILLS;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SKILLS };
}
