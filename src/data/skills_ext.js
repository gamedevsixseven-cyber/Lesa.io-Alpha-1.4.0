/**
 * Lesa.io - Active Skills Registry Extension (Alpha 1.6)
 * Adds: chair_throw (Uncommon), komboloi_vortex (Rare), ouzo_flambe (Rare)
 * Merges directly into global SKILLS registry so existing skills.js remains modular.
 */

const SKILLS_EXT = {
    chair_throw: {
        id: 'chair_throw',
        name: 'Kafenio Chair Throw',
        rarity: 'Uncommon',
        iconImg: 'assets/SkillsIcons/ChairThrowSkill.svg',
        icon: '🪑',
        key: 'E',
        badge: 'CHAIR SMASH',
        category: 'Offensive / Ricochet',
        unlockedDefault: false,
        unlockCost: 900,
        maxLevel: 3,
        cooldown: 7.0,
        desc: 'Hurl a solid oak Kafeneio chair spinning along your aim line! Bowls cleanly through mobs, micro-stuns targets, and ricochets off one obstacle or wall.',
        levels: {
            1: {
                level: 1, upgradeCost: 1100, damage: 115, radius: 30, speed: 14, range: 430, stunDuration: 0.65, bounces: 1,
                stats: [
                    { label: 'Chair Damage', value: '115 Pierce' },
                    { label: 'Micro-Stun', value: '0.65s Impact' },
                    { label: 'Cooldown', value: '7.0s' },
                    { label: 'Special', value: '1x Wall Ricochet' }
                ]
            },
            2: {
                level: 2, upgradeCost: 1950, damage: 160, radius: 33, speed: 15, range: 500, stunDuration: 0.85, bounces: 1,
                stats: [
                    { label: 'Chair Damage', value: '160 Pierce (+39%)' },
                    { label: 'Micro-Stun', value: '0.85s Impact' },
                    { label: 'Cooldown', value: '7.0s' },
                    { label: 'Range', value: '500px + Ricochet' }
                ]
            },
            3: {
                level: 3, upgradeCost: 0, damage: 215, radius: 36, speed: 16, range: 580, stunDuration: 1.05, bounces: 1,
                stats: [
                    { label: 'Chair Damage', value: '215 Oak Smash ⭐' },
                    { label: 'Micro-Stun', value: '1.05s Shock Stun' },
                    { label: 'Cooldown', value: '7.0s' },
                    { label: 'Special', value: 'Extended 580px Bowling' }
                ]
            }
        },
        stats: [
            { label: 'Chair Damage', value: '115 Pierce' },
            { label: 'Micro-Stun', value: '0.65s Impact' },
            { label: 'Cooldown', value: '7.0s' },
            { label: 'Special', value: '1x Wall Ricochet' }
        ]
    },
    komboloi_vortex: {
        id: 'komboloi_vortex',
        name: 'Komboloi Vortex',
        rarity: 'Rare',
        iconImg: 'assets/SkillsIcons/KomboloiVortexSkill.svg',
        icon: '📿',
        key: 'E',
        badge: 'BEAD BARRIER',
        category: 'Defense / Orbital Slash',
        unlockedDefault: false,
        unlockCost: 1600,
        maxLevel: 4,
        cooldown: 9.5,
        desc: 'Whip up an orbiting hurricane of oversized amber worry-beads around your hero! Slashes nearby enemies, shreds enemy projectiles, and pulls loot drops inward.',
        levels: {
            1: {
                level: 1, upgradeCost: 2300, beads: 4, radius: 120, duration: 192, damage: 48, deflectChance: 0.45,
                stats: [
                    { label: 'Orbit Beads', value: '4 Amber Beads (3.2s)' },
                    { label: 'Slash Damage', value: '48 per Hit' },
                    { label: 'Deflect Chance', value: '45% Enemy Shots' },
                    { label: 'Cooldown', value: '9.5s' }
                ]
            },
            2: {
                level: 2, upgradeCost: 3400, beads: 5, radius: 135, duration: 216, damage: 66, deflectChance: 0.55,
                stats: [
                    { label: 'Orbit Beads', value: '5 Amber Beads (3.6s)' },
                    { label: 'Slash Damage', value: '66 per Hit (+38%)' },
                    { label: 'Deflect Chance', value: '55% Enemy Shots' },
                    { label: 'Cooldown', value: '9.5s' }
                ]
            },
            3: {
                level: 3, upgradeCost: 5000, beads: 5, radius: 150, duration: 246, damage: 85, deflectChance: 0.65,
                stats: [
                    { label: 'Orbit Beads', value: '5 Amber Beads (4.1s)' },
                    { label: 'Slash Damage', value: '85 per Hit (+77%)' },
                    { label: 'Deflect Chance', value: '65% Enemy Shots' },
                    { label: 'Cooldown', value: '9.5s' }
                ]
            },
            4: {
                level: 4, upgradeCost: 0, beads: 6, radius: 165, duration: 276, damage: 110, deflectChance: 0.75,
                stats: [
                    { label: 'Orbit Beads', value: '6 Amber Beads (4.6s) ⭐' },
                    { label: 'Slash Damage', value: '110 Vortex Cleave' },
                    { label: 'Deflect Chance', value: '75% Bullet Shred ⭐' },
                    { label: 'Cooldown', value: '9.5s' }
                ]
            }
        },
        stats: [
            { label: 'Orbit Beads', value: '4 Amber Beads (3.2s)' },
            { label: 'Slash Damage', value: '48 per Hit' },
            { label: 'Deflect Chance', value: '45% Enemy Shots' },
            { label: 'Cooldown', value: '9.5s' }
        ]
    },
    ouzo_flambe: {
        id: 'ouzo_flambe',
        name: 'Ouzo Flambé',
        rarity: 'Rare',
        iconImg: 'assets/SkillsIcons/OuzoFlambeSkill.svg',
        icon: '🥃🔥',
        key: 'E',
        badge: 'BLUE INFERNO',
        category: 'Zone Burn / Gun Amp',
        unlockedDefault: false,
        unlockCost: 1800,
        maxLevel: 4,
        cooldown: 10.0,
        desc: 'Toss a lit bottle of Ouzo that shatters into roaring cartoon blue flames! Rapidly scorches enemies inside and ignites your shots passing through for bonus fire damage.',
        levels: {
            1: {
                level: 1, upgradeCost: 2400, radius: 145, duration: 240, tickDamage: 34, bulletAmp: 1.20,
                stats: [
                    { label: 'Blue Fire Burn', value: '34 DMG / 0.4s (4.0s)' },
                    { label: 'Bullet Ignite', value: '+20% Shot Damage' },
                    { label: 'Pool Radius', value: '145px Inferno' },
                    { label: 'Cooldown', value: '10.0s' }
                ]
            },
            2: {
                level: 2, upgradeCost: 3600, radius: 165, duration: 270, tickDamage: 46, bulletAmp: 1.25,
                stats: [
                    { label: 'Blue Fire Burn', value: '46 DMG / 0.4s (4.5s)' },
                    { label: 'Bullet Ignite', value: '+25% Shot Damage' },
                    { label: 'Pool Radius', value: '165px Inferno' },
                    { label: 'Cooldown', value: '10.0s' }
                ]
            },
            3: {
                level: 3, upgradeCost: 5200, radius: 185, duration: 300, tickDamage: 62, bulletAmp: 1.30,
                stats: [
                    { label: 'Blue Fire Burn', value: '62 DMG / 0.4s (5.0s)' },
                    { label: 'Bullet Ignite', value: '+30% Shot Damage' },
                    { label: 'Pool Radius', value: '185px Inferno' },
                    { label: 'Cooldown', value: '10.0s' }
                ]
            },
            4: {
                level: 4, upgradeCost: 0, radius: 205, duration: 330, tickDamage: 80, bulletAmp: 1.35,
                stats: [
                    { label: 'Blue Fire Burn', value: '80 DMG / 0.4s (5.5s) ⭐' },
                    { label: 'Bullet Ignite', value: '+35% Fire Shot Amp ⭐' },
                    { label: 'Pool Radius', value: '205px Aegean Blaze' },
                    { label: 'Cooldown', value: '10.0s' }
                ]
            }
        },
        stats: [
            { label: 'Blue Fire Burn', value: '34 DMG / 0.4s (4.0s)' },
            { label: 'Bullet Ignite', value: '+20% Shot Damage' },
            { label: 'Pool Radius', value: '145px Inferno' },
            { label: 'Cooldown', value: '10.0s' }
        ]
    },
    donkey_stampede: {
        id: 'donkey_stampede',
        name: 'Gaidaros Stampede',
        rarity: 'Epic',
        iconImg: 'assets/SkillsIcons/DonkeyStampedeSkill.svg',
        icon: '🫏',
        key: 'E',
        badge: 'VILLAGE CHARGE',
        category: 'Line Stampede / Stun',
        unlockedDefault: false,
        unlockCost: 2900,
        maxLevel: 5,
        cooldown: 11.5,
        desc: 'Whistle for a furious Greek Village Donkey! Charges down a wide lane toward your aim, trampling hordes aside with heavy damage, dust storms, and hoof stuns.',
        levels: {
            1: {
                level: 1, upgradeCost: 4200, damage: 160, radius: 48, range: 650, speed: 15.5, stunDuration: 1.2,
                stats: [
                    { label: 'Trample Damage', value: '160 Heavy Lane' },
                    { label: 'Hoof Stun', value: '1.2s + Knock Aside' },
                    { label: 'Charge Path', value: '650px (96px Wide)' },
                    { label: 'Cooldown', value: '11.5s' }
                ]
            },
            2: {
                level: 2, upgradeCost: 5600, damage: 205, radius: 52, range: 700, speed: 16.0, stunDuration: 1.4,
                stats: [
                    { label: 'Trample Damage', value: '205 Heavy Lane' },
                    { label: 'Hoof Stun', value: '1.4s + Knock Aside' },
                    { label: 'Charge Path', value: '700px (104px Wide)' },
                    { label: 'Cooldown', value: '11.5s' }
                ]
            },
            3: {
                level: 3, upgradeCost: 7500, damage: 255, radius: 56, range: 740, speed: 16.5, stunDuration: 1.6,
                stats: [
                    { label: 'Trample Damage', value: '255 Heavy Lane' },
                    { label: 'Hoof Stun', value: '1.6s + Knock Aside' },
                    { label: 'Charge Path', value: '740px (112px Wide)' },
                    { label: 'Cooldown', value: '11.5s' }
                ]
            },
            4: {
                level: 4, upgradeCost: 9800, damage: 315, radius: 60, range: 790, speed: 17.2, stunDuration: 1.8,
                stats: [
                    { label: 'Trample Damage', value: '315 Heavy Lane' },
                    { label: 'Hoof Stun', value: '1.8s + Heavy Throw' },
                    { label: 'Charge Path', value: '790px (120px Wide)' },
                    { label: 'Cooldown', value: '11.5s' }
                ]
            },
            5: {
                level: 5, upgradeCost: 0, damage: 385, radius: 66, range: 850, speed: 18.0, stunDuration: 2.0,
                stats: [
                    { label: 'Trample Damage', value: '385 Mega Stampede ⭐' },
                    { label: 'Hoof Stun', value: '2.0s Total Flatten ⭐' },
                    { label: 'Charge Path', value: '850px (132px Wide)' },
                    { label: 'Cooldown', value: '11.5s' }
                ]
            }
        },
        stats: [
            { label: 'Trample Damage', value: '160 Heavy Lane' },
            { label: 'Hoof Stun', value: '1.2s + Knock Aside' },
            { label: 'Charge Path', value: '650px (96px Wide)' },
            { label: 'Cooldown', value: '11.5s' }
        ]
    },
    bouzouki_decoy: {
        id: 'bouzouki_decoy',
        name: 'Bouzouki Jukebox',
        rarity: 'Epic',
        iconImg: 'assets/SkillsIcons/BouzoukiDecoySkill.svg',
        icon: '🎶',
        key: 'E',
        badge: 'SONIC TAUNT',
        category: 'Decoy Lure / Boom',
        unlockedDefault: false,
        unlockCost: 3200,
        maxLevel: 5,
        cooldown: 12.5,
        desc: 'Drop a bouncing neon Bouzouki speaker that blasts pulsing music waves, luring & slowing nearby enemies into dancing around it before detonating in a massive bass explosion.',
        levels: {
            1: {
                level: 1, upgradeCost: 4400, lureRadius: 240, blastRadius: 210, duration: 240, damage: 240, stunDuration: 1.0, pullSpeed: 1.15,
                stats: [
                    { label: 'Taunt Ring', value: '240px Lure (4.0s)' },
                    { label: 'Finale Boom', value: '240 Sonic AoE' },
                    { label: 'Bass Stun', value: '1.0s Finale Stun' },
                    { label: 'Cooldown', value: '12.5s' }
                ]
            },
            2: {
                level: 2, upgradeCost: 5900, lureRadius: 260, blastRadius: 230, duration: 270, damage: 295, stunDuration: 1.1, pullSpeed: 1.25,
                stats: [
                    { label: 'Taunt Ring', value: '260px Lure (4.5s)' },
                    { label: 'Finale Boom', value: '295 Sonic AoE' },
                    { label: 'Bass Stun', value: '1.1s Finale Stun' },
                    { label: 'Cooldown', value: '12.5s' }
                ]
            },
            3: {
                level: 3, upgradeCost: 7800, lureRadius: 280, blastRadius: 250, duration: 300, damage: 355, stunDuration: 1.25, pullSpeed: 1.35,
                stats: [
                    { label: 'Taunt Ring', value: '280px Lure (5.0s)' },
                    { label: 'Finale Boom', value: '355 Sonic AoE' },
                    { label: 'Bass Stun', value: '1.25s Finale Stun' },
                    { label: 'Cooldown', value: '12.5s' }
                ]
            },
            4: {
                level: 4, upgradeCost: 10200, lureRadius: 300, blastRadius: 270, duration: 330, damage: 420, stunDuration: 1.4, pullSpeed: 1.45,
                stats: [
                    { label: 'Taunt Ring', value: '300px Lure (5.5s)' },
                    { label: 'Finale Boom', value: '420 Sonic AoE' },
                    { label: 'Bass Stun', value: '1.4s Finale Stun' },
                    { label: 'Cooldown', value: '12.5s' }
                ]
            },
            5: {
                level: 5, upgradeCost: 0, lureRadius: 325, blastRadius: 295, duration: 360, damage: 495, stunDuration: 1.6, pullSpeed: 1.60,
                stats: [
                    { label: 'Taunt Ring', value: '325px Disco Magnet (6.0s) ⭐' },
                    { label: 'Finale Boom', value: '495 Megabass Blast ⭐' },
                    { label: 'Bass Stun', value: '1.6s Total Shockwave' },
                    { label: 'Cooldown', value: '12.5s' }
                ]
            }
        },
        stats: [
            { label: 'Taunt Ring', value: '240px Lure (4.0s)' },
            { label: 'Finale Boom', value: '240 Sonic AoE' },
            { label: 'Bass Stun', value: '1.0s Finale Stun' },
            { label: 'Cooldown', value: '12.5s' }
        ]
    },
    chrono_hourglass: {
        id: 'chrono_hourglass',
        name: 'Chronos Hourglass',
        masteryName: 'Chronos+ Eternity',
        rarity: 'Legendary',
        iconImg: 'assets/SkillsIcons/ChronoHourglassSkill.svg',
        icon: '⏳',
        key: 'E',
        badge: 'TIME DOME',
        category: 'Temporal Stasis / Haste',
        unlockedDefault: false,
        unlockCost: 5000,
        maxLevel: 5,
        cooldown: 13.5,
        masteryCooldown: 11.0,
        hasMastery: true,
        masteryBadgeText: 'ETERNITY',
        masteryIcon: '⏳',
        masteryLabel: 'Eternity Shatter Mastery',
        masteryButtonLabel: 'MASTER: ETERNITY',
        masteryDoneLabel: '⭐ MASTERED: ETERNITY ⏳',
        masteryTitleHtml: 'Chronos Hourglass <span class="mastery-sub" style="background:linear-gradient(135deg,#fed330,#a55eea);color:#1a1d2b;">Eternity ⏳</span>',
        masteryDesc: '⭐ MASTERED ETERNITY SHATTER: Permanent -2.5s Cooldown (11.0s), -85% Enemy & Projectile Time Slow, +40% Speed / +55% Fire Haste inside Dome, and triggers a 360+ DMG Temporal Shatter Explosion when ending!',
        desc: 'Slam a golden Chronos Hourglass to conjure a glowing Time Sanctuary Dome! Heavily slows enemies and enemy projectiles inside while accelerating your movement and firing speed.',
        levels: {
            1: {
                level: 1, upgradeCost: 6500, gemCost: 0, radius: 250, duration: 240, slowMultiplier: 0.30, bulletSlow: 0.72, speedBuff: 1.25, fireHaste: 0.35, shatterDamage: 0,
                stats: [
                    { label: 'Time Slow', value: '-70% Mobs & Bullets' },
                    { label: 'Player Haste', value: '+25% Spd / +35% Fire' },
                    { label: 'Dome Radius', value: '250px (4.0s)' },
                    { label: 'Cooldown', value: '13.5s' }
                ]
            },
            2: {
                level: 2, upgradeCost: 8500, gemCost: 0, radius: 270, duration: 264, slowMultiplier: 0.26, bulletSlow: 0.76, speedBuff: 1.28, fireHaste: 0.40, shatterDamage: 0,
                stats: [
                    { label: 'Time Slow', value: '-74% Mobs & Bullets' },
                    { label: 'Player Haste', value: '+28% Spd / +40% Fire' },
                    { label: 'Dome Radius', value: '270px (4.4s)' },
                    { label: 'Cooldown', value: '13.5s' }
                ]
            },
            3: {
                level: 3, upgradeCost: 11000, gemCost: 0, radius: 290, duration: 288, slowMultiplier: 0.22, bulletSlow: 0.80, speedBuff: 1.32, fireHaste: 0.45, shatterDamage: 0,
                stats: [
                    { label: 'Time Slow', value: '-78% Mobs & Bullets' },
                    { label: 'Player Haste', value: '+32% Spd / +45% Fire' },
                    { label: 'Dome Radius', value: '290px (4.8s)' },
                    { label: 'Cooldown', value: '13.5s' }
                ]
            },
            4: {
                level: 4, upgradeCost: 14000, gemCost: 100, radius: 315, duration: 312, slowMultiplier: 0.19, bulletSlow: 0.84, speedBuff: 1.36, fireHaste: 0.50, shatterDamage: 0,
                isMasteryNext: true,
                stats: [
                    { label: 'Time Slow', value: '-81% Mobs & Bullets' },
                    { label: 'Player Haste', value: '+36% Spd / +50% Fire' },
                    { label: 'Dome Radius', value: '315px (5.2s)' },
                    { label: 'Next Tier', value: '⏳ ETERNITY MASTERY' }
                ]
            },
            5: {
                level: 5, upgradeCost: 0, gemCost: 0, radius: 340, duration: 360, slowMultiplier: 0.15, bulletSlow: 0.88, speedBuff: 1.40, fireHaste: 0.55, shatterDamage: 360, stunDuration: 1.5,
                cooldown: 11.0,
                isMastered: true,
                stats: [
                    { label: 'Time Slow', value: '-85% Stasis Field ⏳' },
                    { label: 'Cooldown', value: '11.0s (-2.5s CDR)' },
                    { label: 'Player Haste', value: '+40% Spd / +55% Fire' },
                    { label: 'Mastery Perk', value: '360+ AoE Shatter & 1.5s Stun ⭐' }
                ]
            }
        },
        stats: [
            { label: 'Time Slow', value: '-70% Mobs & Bullets' },
            { label: 'Player Haste', value: '+25% Spd / +35% Fire' },
            { label: 'Dome Radius', value: '250px (4.0s)' },
            { label: 'Mastery', value: 'Eternity Shatter ⏳ (AoE Boom)' }
        ]
    }
};

if (typeof SKILLS !== 'undefined') Object.assign(SKILLS, SKILLS_EXT);
if (typeof window !== 'undefined') {
    window.SKILLS_EXT = SKILLS_EXT;
    if (window.SKILLS) Object.assign(window.SKILLS, SKILLS_EXT);
}
if (typeof module !== 'undefined' && module.exports) module.exports = { SKILLS_EXT };
