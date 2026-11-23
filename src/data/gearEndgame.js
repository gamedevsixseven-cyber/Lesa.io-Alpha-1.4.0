/**
 * Lesa.io - Endgame Armory Data Registry (Alpha 1.5)
 * Defines the 20 Chest-Only Epic (Purple) & Legendary (Orange) Gear Items
 * across all 5 slots (2 Epic + 2 Legendary per slot) and merges them into GEAR_DATA.
 */

const ENDGAME_GEAR_DATA = {
    // ==========================================
    // HELMETS / HEADGEAR — EPIC & LEGENDARY
    // ==========================================
    yaya_scarf: {
        id: 'yaya_scarf',
        name: "Yaya's Black Scarf",
        slot: 'helmet',
        rarity: 'epic',
        cost: 0,
        chestOnly: true,
        stats: { critChance: 9, critDamage: 18, maxHp: 30 },
        icon: '🧣',
        iconImg: 'assets/Helmets/YayaBlackScarf.png',
        desc: "Blessed village mourning kerchief woven with a protective Mati charm.",
        passive: {
            id: 'evil_eye_ward',
            name: 'Evil Eye Ward',
            desc: 'Every 20s, blocks 1 enemy hit completely.'
        }
    },
    rebetis_flatcap: {
        id: 'rebetis_flatcap',
        name: 'Rebetis Wool Flatcap',
        slot: 'helmet',
        rarity: 'epic',
        cost: 0,
        chestOnly: true,
        stats: { critChance: 10, critDamage: 15, speed: 5 },
        icon: '🧢',
        iconImg: 'assets/Helmets/RebetisWoolFlatcap.png',
        desc: 'Sharp peak and streetwise poise for picking apart tough foes.',
        passive: {
            id: 'sharp_focus',
            name: 'Sharp Focus',
            desc: 'Critical hits deal +15% bonus damage to Bosses & Elites.'
        }
    },
    olympus_crown: {
        id: 'olympus_crown',
        name: 'Laurel Crown of Olympus',
        slot: 'helmet',
        rarity: 'legendary',
        cost: 0,
        chestOnly: true,
        stats: { critChance: 14, critDamage: 30, fireRate: 10 },
        icon: '👑',
        iconImg: 'assets/Helmets/LaurelCrownOlympus.png',
        desc: 'Gilded olive-leaf diadem sparking with leftover mountain thunder.',
        passive: {
            id: 'bolt_of_criticism',
            name: 'Bolt of Criticism',
            desc: 'Critical hits have a 20% chance to strike with a lightning bolt.'
        }
    },
    bouzouki_fedora: {
        id: 'bouzouki_fedora',
        name: 'Golden Bouzouki Fedora',
        slot: 'helmet',
        rarity: 'legendary',
        cost: 0,
        chestOnly: true,
        stats: { critChance: 12, critDamage: 25, maxHp: 65 },
        icon: '🎩',
        iconImg: 'assets/Helmets/GoldenBouzoukiFedora.png',
        desc: 'Spun-gold hat of late-night bouzoukia legends that keeps the crowd roaring.',
        passive: {
            id: 'encore',
            name: 'Encore',
            desc: 'Every 15 kills heals +4 HP and emits a damaging radial shockwave.'
        }
    },

    // ==========================================
    // ARMOR / TORSO — EPIC & LEGENDARY
    // ==========================================
    psistis_coat: {
        id: 'psistis_coat',
        name: 'Psistis Thermal Butcher Coat',
        slot: 'armor',
        rarity: 'epic',
        cost: 0,
        chestOnly: true,
        stats: { maxHp: 95, damageReduction: 9, bulletDamage: 6 },
        icon: '🦺',
        iconImg: 'assets/Armors/PsistisButcherCoat.png',
        desc: 'Quilted grillmaster apron lined with glowing charcoal embers.',
        passive: {
            id: 'hot_coals',
            name: 'Hot Coals',
            desc: 'Enemies that hit you take burn & knockback splash.'
        }
    },
    mat_riot_vest: {
        id: 'mat_riot_vest',
        name: 'MAT Tactical Riot Vest',
        slot: 'armor',
        rarity: 'epic',
        cost: 0,
        chestOnly: true,
        stats: { maxHp: 110, damageReduction: 12 },
        icon: '🛡️',
        iconImg: 'assets/Armors/MatRiotVest.png',
        desc: 'High-density ballistic plating built for rapid emergency disengages.',
        passive: {
            id: 'shock_absorber',
            name: 'Shock Absorber',
            desc: 'Gain +25% Move Speed for 2s after taking damage.'
        }
    },
    aegis_jacket: {
        id: 'aegis_jacket',
        name: 'Aegis Kafenio Jacket',
        slot: 'armor',
        rarity: 'legendary',
        cost: 0,
        chestOnly: true,
        stats: { maxHp: 165, damageReduction: 16, speed: 8 },
        icon: '🧥',
        iconImg: 'assets/Armors/AegisKafenioJacket.png',
        desc: 'Divine bronze-trimmed coat carrying the stubborn spirit of the village elders.',
        passive: {
            id: 'blessed_shield',
            name: 'Blessed Shield',
            desc: 'Every 12s gain a 30 HP shield; once per run a fatal hit leaves 1 HP + 2s invulnerability.'
        }
    },
    grandmaster_cuirass: {
        id: 'grandmaster_cuirass',
        name: 'Grandmaster Butcher Cuirass',
        slot: 'armor',
        rarity: 'legendary',
        cost: 0,
        chestOnly: true,
        stats: { maxHp: 145, damageReduction: 14, bulletDamage: 12 },
        icon: '🔥',
        iconImg: 'assets/Armors/GrandmasterButcherCuirass.png',
        desc: 'Forged over white-hot rotisserie coals to scorch challengers who dare close in.',
        passive: {
            id: 'charcoal_aura',
            name: 'Charcoal Aura',
            desc: 'Periodically scorches nearby enemies and deals +15% damage vs Bosses.'
        }
    },

    // ==========================================
    // BELTS & SASHES — EPIC & LEGENDARY
    // ==========================================
    komboloi_sash: {
        id: 'komboloi_sash',
        name: 'Brass Komboloi Sash',
        slot: 'belt',
        rarity: 'epic',
        cost: 0,
        chestOnly: true,
        stats: { dashCooldown: 14, magnetRadius: 45, fireRate: 6 },
        icon: '📿',
        iconImg: 'assets/Belts/BrassKomboloiSash.png',
        desc: 'Weighted prayer beads strapped tightly to lock in a deadly tempo after every roll.',
        passive: {
            id: 'steady_rhythm',
            name: 'Steady Rhythm',
            desc: 'Dashing grants +12% Fire Rate for 2.5s.'
        }
    },
    waiter_pouch: {
        id: 'waiter_pouch',
        name: 'Taverna Waiter Coin Pouch',
        slot: 'belt',
        rarity: 'epic',
        cost: 0,
        chestOnly: true,
        stats: { dashCooldown: 11, magnetRadius: 60, maxHp: 35 },
        icon: '👛',
        iconImg: 'assets/Belts/TavernaWaiterPouch.png',
        desc: 'Heavy leather billfold seasoned by decades of bustling tourist tips.',
        passive: {
            id: 'tip_jar',
            name: 'Tip Jar',
            desc: '+10% Gold Coins dropped by enemies & matches.'
        }
    },
    hermes_girdle: {
        id: 'hermes_girdle',
        name: 'Girdle of Hermes',
        slot: 'belt',
        rarity: 'legendary',
        cost: 0,
        chestOnly: true,
        stats: { dashCooldown: 20, magnetRadius: 85, speed: 10 },
        icon: '⚡',
        iconImg: 'assets/Belts/GirdleOfHermes.png',
        desc: 'Featherlight sky-messenger belt that turns every evade into a razor gale.',
        passive: {
            id: 'sonic_slipstream',
            name: 'Sonic Slipstream',
            desc: 'Dashing damages enemies passed through and grants +20% Crit Chance for 1.5s.'
        }
    },
    tyche_belt: {
        id: 'tyche_belt',
        name: 'Golden Tavli Belt of Tyche',
        slot: 'belt',
        rarity: 'legendary',
        cost: 0,
        chestOnly: true,
        stats: { dashCooldown: 16, maxHp: 75, fireRate: 10 },
        icon: '🎲',
        iconImg: 'assets/Belts/GoldenTavliBeltOfTyche.png',
        desc: 'Inlaid with blessed ivory dice that sweep every treasure across the floor.',
        passive: {
            id: 'lucky_roll',
            name: 'Lucky Roll',
            desc: '+20% Gold Coins + attracts pickups across the arena on wave clear.'
        }
    },

    // ==========================================
    // GLOVES / WRISTWEAR — EPIC & LEGENDARY
    // ==========================================
    souvlaki_tongs: {
        id: 'souvlaki_tongs',
        name: 'Tongs of the Souvlaki King',
        slot: 'gloves',
        rarity: 'epic',
        cost: 0,
        chestOnly: true,
        stats: { fireRate: 12, bulletDamage: 12, bulletSpeed: 8 },
        icon: '🥢',
        iconImg: 'assets/Gloves/SouvlakiKingTongs.png',
        desc: 'Mirror-polished steel grips built to skewer straight through tight packs.',
        passive: {
            id: 'sizzling_skewers',
            name: 'Sizzling Skewers',
            desc: 'Shots have a 15% chance to pierce 1 extra enemy.'
        }
    },
    moto_gauntlets: {
        id: 'moto_gauntlets',
        name: 'Carbon Motorcycle Gauntlets',
        slot: 'gloves',
        rarity: 'epic',
        cost: 0,
        chestOnly: true,
        stats: { fireRate: 14, bulletSpeed: 10, critChance: 4 },
        icon: '🏍️',
        iconImg: 'assets/Gloves/CarbonMotoGauntlets.png',
        desc: 'Knuckle-armored racing gloves that wind up faster with sustained trigger pull.',
        passive: {
            id: 'throttle_grip',
            name: 'Throttle Grip',
            desc: 'Continuous firing ramps +2% Fire Rate per shot up to +10%.'
        }
    },
    thunder_grips: {
        id: 'thunder_grips',
        name: 'Thunder-Forged Olympian Grips',
        slot: 'gloves',
        rarity: 'legendary',
        cost: 0,
        chestOnly: true,
        stats: { fireRate: 18, bulletDamage: 18, bulletSpeed: 15 },
        icon: '⚡',
        iconImg: 'assets/Gloves/ThunderOlympianGrips.png',
        desc: 'Storm-tempered gauntlets that conduct arcing bolts between clustered enemies.',
        passive: {
            id: 'chain_shock',
            name: 'Chain Shock',
            desc: '15% chance on hit to chain lightning to 2 nearby enemies for 40% damage.'
        }
    },
    golden_mitts: {
        id: 'golden_mitts',
        name: "Yaya's Golden Oven Mitts",
        slot: 'gloves',
        rarity: 'legendary',
        cost: 0,
        chestOnly: true,
        stats: { fireRate: 15, bulletDamage: 16, maxHp: 60 },
        icon: '🧤',
        iconImg: 'assets/Gloves/YayaGoldenOvenMitts.png',
        desc: 'Embroidered heirloom mitts baking every 8th shot into a blistering casserole bomb.',
        passive: {
            id: 'too_hot_to_handle',
            name: 'Too Hot to Handle',
            desc: 'Every 8th shot fires an oversized piercing explosive shot.'
        }
    },

    // ==========================================
    // BOOTS & FOOTWEAR — EPIC & LEGENDARY
    // ==========================================
    tavli_sandals: {
        id: 'tavli_sandals',
        name: 'Winged Tavli Sandals',
        slot: 'boots',
        rarity: 'epic',
        cost: 0,
        chestOnly: true,
        stats: { speed: 14, dashCooldown: 8, maxHp: 25 },
        icon: '🩴',
        iconImg: 'assets/boots/WingedTavliSandals.png',
        desc: 'Custom leather slides counting off lucky sixes to slam the floorboards.',
        passive: {
            id: 'double_sixes',
            name: 'Double Sixes',
            desc: 'Every 6th dash releases a stun & knockback shockwave.'
        }
    },
    trail_runners: {
        id: 'trail_runners',
        name: 'Spiked Mountain Trail Runners',
        slot: 'boots',
        rarity: 'epic',
        cost: 0,
        chestOnly: true,
        stats: { speed: 11, maxHp: 40, damageReduction: 5 },
        icon: '🥾',
        iconImg: 'assets/boots/SpikedTrailRunners.png',
        desc: 'Tungsten-cleated mountain sneakers that bite through frost, smoke, and rapids.',
        passive: {
            id: 'sure_footed',
            name: 'Sure-Footed',
            desc: 'Immune to ice/smoke slows and river current drag.'
        }
    },
    nike_sandals: {
        id: 'nike_sandals',
        name: 'Winged Sandals of Nike',
        slot: 'boots',
        rarity: 'legendary',
        cost: 0,
        chestOnly: true,
        stats: { speed: 20, dashCooldown: 12, maxHp: 60 },
        icon: '🪽',
        iconImg: 'assets/boots/WingedSandalsOfNike.png',
        desc: 'Quicksilver Victory sandals worn only by champions in perpetual motion.',
        passive: {
            id: 'untouchable_stride',
            name: 'Untouchable Stride',
            desc: '15% dodge chance while moving + dash recharges 25% faster while moving.'
        }
    },
    titan_greaves: {
        id: 'titan_greaves',
        name: 'Titan-Greaves of Mt. Olympus',
        slot: 'boots',
        rarity: 'legendary',
        cost: 0,
        chestOnly: true,
        stats: { speed: 15, maxHp: 90, damageReduction: 8 },
        icon: '🥾',
        iconImg: 'assets/boots/TitanGreavesOfOlympus.png',
        desc: 'Colossal bronze shin-guards that rupture stone whenever a dash concludes.',
        passive: {
            id: 'seismic_step',
            name: 'Seismic Step',
            desc: 'Landing a dash triggers a quake stomp stunning nearby enemies for 0.8s.'
        }
    },
    zeus_aegis_cuirass: {
        id: 'zeus_aegis_cuirass',
        name: 'Aegis Cuirass of Zeus',
        slot: 'armor',
        rarity: 'mythic',
        cost: 0,
        excludeFromChests: true,
        bossUnlock: 'zeus',
        hideWhenLocked: true,
        unlockLabel: 'DEFEAT ZEUS',
        stats: { maxHp: 210, damageReduction: 20, bulletDamage: 14, speed: 6 },
        icon: '⚡',
        iconImg: 'assets/Armors/AegisCuirassZeus.svg',
        desc: 'Forged from Zeus\'s golden stormplate on Mount Olympus. Grants an Olympian Storm Barrier and unleashes thunderous retaliation on impact.',
        passive: {
            id: 'stormborn_aegis',
            name: 'Stormborn Aegis',
            desc: 'Every 10s gain a 45 HP Storm Barrier. Taking a hit (or barrier break) unleashes a 190px thunder shockwave for 65 DMG and stuns foes for 0.6s.'
        }
    }
};

// Merge seamlessly into global GEAR_DATA / GEAR_ITEMS / ALL_GEAR
if (typeof GEAR_DATA !== 'undefined') {
    Object.assign(GEAR_DATA, ENDGAME_GEAR_DATA);
    if (typeof GEAR_ITEMS !== 'undefined') {
        for (const item of Object.values(ENDGAME_GEAR_DATA)) {
            if (GEAR_ITEMS[item.slot] && !GEAR_ITEMS[item.slot].some(g => g.id === item.id)) {
                GEAR_ITEMS[item.slot].push(item);
            }
        }
    }
    const allList = Object.values(GEAR_DATA);
    if (typeof ALL_GEAR !== 'undefined' && Array.isArray(ALL_GEAR)) {
        ALL_GEAR.length = 0;
        ALL_GEAR.push(...allList);
    } else if (typeof window !== 'undefined') {
        window.ALL_GEAR = allList;
    }
}

if (typeof window !== 'undefined') {
    window.ENDGAME_GEAR_DATA = ENDGAME_GEAR_DATA;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ENDGAME_GEAR_DATA };
}
