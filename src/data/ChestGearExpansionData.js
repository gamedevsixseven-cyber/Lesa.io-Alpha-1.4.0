/**
 * Lesa.io - Mythic Chest Gear Pool (2 Mythic pieces per slot = 10 total)
 * Obtainable directly from Epic (rare), Legendary, Mythic & Apex chests.
 * Supports up to Lv.5 (4 upgrades max) + ★ Evolution.
 */

const CHEST_GEAR_EXPANSION_DATA = {
    // ==========================================
    // HELMETS (+2 Mythic Chest Pieces)
    // ==========================================
    mythic_oracle_diadem: {
        id: 'mythic_oracle_diadem',
        name: 'Oracle Eclipse Diadem',
        slot: 'helmet',
        rarity: 'mythic',
        cost: 0,
        chestOnly: true,
        stats: { critChance: 15, critDamage: 34, fireRate: 11, maxHp: 75 },
        icon: '🔮',
        iconImg: 'assets/Helmets/OracleEclipseDiadem.png',
        desc: 'Mythic prophetic helm locking onto vital arteries every fourth shot.',
        passive: {
            id: 'oracle_foreshadow',
            name: 'Oracle Foreshadow',
            desc: 'Every 4th shot guarantees Crit (+28% Crit DMG vs Bosses/Elites) and grants +12% Move Speed briefly on crit.'
        }
    },
    mythic_ares_visage: {
        id: 'mythic_ares_visage',
        name: 'Ares Warlord Casque',
        slot: 'helmet',
        rarity: 'mythic',
        cost: 0,
        chestOnly: true,
        stats: { critChance: 14, critDamage: 32, bulletDamage: 12, maxHp: 85 },
        icon: '⚔️',
        iconImg: 'assets/Helmets/AresWarlordCasque.png',
        desc: 'Plumed Olympian war-helm erupting crimson sparks on critical strikes.',
        passive: {
            id: 'warlord_frenzy',
            name: 'Warlord Frenzy',
            desc: 'Crits cleave a 110px Crimson Spark (38% DMG); every 18 kills heal +5 HP & emit a War Shockwave.'
        }
    },

    // ==========================================
    // ARMORS (+2 Mythic Chest Pieces)
    // ==========================================
    mythic_chronos_cuirass: {
        id: 'mythic_chronos_cuirass',
        name: 'Chronos Aegis Brigandine',
        slot: 'armor',
        rarity: 'mythic',
        cost: 0,
        chestOnly: true,
        stats: { maxHp: 205, damageReduction: 19, fireRate: 10, bulletDamage: 10 },
        icon: '⏳',
        iconImg: 'assets/Armors/ChronosAegisBrigandine.png',
        desc: 'Mythic temporal plate shielding the wearer and slowing attackers in distorted time.',
        passive: {
            id: 'chronos_bulwark',
            name: 'Chronos Bulwark',
            desc: 'Every 10s gain a 50 HP Stasis Barrier; taking damage emits a 165px Temporal Pulse slowing foes 45% (45 DMG).'
        }
    },
    mythic_poseidon_plate: {
        id: 'mythic_poseidon_plate',
        name: 'Abyssal Tideguard Cuirass',
        slot: 'armor',
        rarity: 'mythic',
        cost: 0,
        chestOnly: true,
        stats: { maxHp: 215, damageReduction: 20, speed: 7, bulletDamage: 11 },
        icon: '🔱',
        iconImg: 'assets/Armors/AbyssalTideguardCuirass.png',
        desc: 'Deep-sea Mythic bronze forged to crash back against encroaching swarms.',
        passive: {
            id: 'abyssal_surge',
            name: 'Abyssal Riptide',
            desc: 'On damage erupt a 175px Riptide knockback (58 DMG + 0.6s stun) and deal +14% DMG vs Bosses.'
        }
    },

    // ==========================================
    // BELTS (+2 Mythic Chest Pieces)
    // ==========================================
    mythic_phoenix_sash: {
        id: 'mythic_phoenix_sash',
        name: 'Phoenix Rebirth Sash',
        slot: 'belt',
        rarity: 'mythic',
        cost: 0,
        chestOnly: true,
        stats: { dashCooldown: 21, fireRate: 14, bulletDamage: 10, maxHp: 90 },
        icon: '🔥',
        iconImg: 'assets/Belts/PhoenixRebirthSash.png',
        desc: 'Incandescent Mythic war-sash erupting in fire whenever the wearer dashes.',
        passive: {
            id: 'phoenix_wake',
            name: 'Phoenix Wake',
            desc: 'Dashing erupts a 145px Ember Nova (60 DMG) and grants +18% Bullet DMG & +15% Crit for 2s.'
        }
    },
    mythic_hermes_cord: {
        id: 'mythic_hermes_cord',
        name: 'Hermes Quicksilver Girdle',
        slot: 'belt',
        rarity: 'mythic',
        cost: 0,
        chestOnly: true,
        stats: { dashCooldown: 22, magnetRadius: 95, speed: 12, maxHp: 80 },
        icon: '🪽',
        iconImg: 'assets/Belts/HermesQuicksilverGirdle.png',
        desc: 'Winged herald belt sweeping entire arenas of gold and crystal rewards per dash.',
        passive: {
            id: 'quicksilver_magnet',
            name: 'Quicksilver Sweep',
            desc: 'Dashing magnetizes all drops within 320px and grants +18% Move Speed & +12% Fire Rate for 2s.'
        }
    },

    // ==========================================
    // GLOVES (+2 Mythic Chest Pieces)
    // ==========================================
    mythic_blood_gauntlets: {
        id: 'mythic_blood_gauntlets',
        name: 'Valkyrie Siphon Gauntlets',
        slot: 'gloves',
        rarity: 'mythic',
        cost: 0,
        chestOnly: true,
        stats: { fireRate: 19, bulletDamage: 19, critChance: 5, maxHp: 75 },
        icon: '🩸',
        iconImg: 'assets/Gloves/ValkyrieSiphonGauntlets.png',
        desc: 'Mythic crimson gauntlets converting relentless hit streaks into vitality and heavy lances.',
        passive: {
            id: 'valkyrie_siphon',
            name: 'Valkyrie Siphon',
            desc: 'Every 10 hits siphon +4 HP & +16% Speed; every 6th shot fires a pierced Crimson Lance (+40% DMG).'
        }
    },
    mythic_hephaestus_fists: {
        id: 'mythic_hephaestus_fists',
        name: 'Forgefire Thunder Grips',
        slot: 'gloves',
        rarity: 'mythic',
        cost: 0,
        chestOnly: true,
        stats: { fireRate: 20, bulletDamage: 20, bulletSpeed: 16, critChance: 4 },
        icon: '⚡',
        iconImg: 'assets/Gloves/ForgefireThunderGrips.png',
        desc: 'Anvil-forged Mythic gauntlets arcing molten blasts and chained storm sparks.',
        passive: {
            id: 'forgefire_arc',
            name: 'Forgefire Arc',
            desc: 'Every 7th shot fires a Molten Blast (+45% AoE DMG); 16% hit chance to arc lightning to 2 nearby foes.'
        }
    },

    // ==========================================
    // BOOTS (+2 Mythic Chest Pieces)
    // ==========================================
    mythic_gale_greaves: {
        id: 'mythic_gale_greaves',
        name: 'Zephyr Tempest Greaves',
        slot: 'boots',
        rarity: 'mythic',
        cost: 0,
        chestOnly: true,
        stats: { speed: 22, dashCooldown: 15, damageReduction: 9, maxHp: 95 },
        icon: '💨',
        iconImg: 'assets/boots/ZephyrTempestGreaves.png',
        desc: 'Winged Mythic storm-greaves weaving immunity winds on every dash.',
        passive: {
            id: 'zephyr_tailwind',
            name: 'Zephyr Tailwind',
            desc: 'Slow-immune + 14% dodge while moving; dashing grants 0.6s dodge immunity & fires a 165px Gale Stomp (42 DMG).'
        }
    },
    mythic_tartarus_treads: {
        id: 'mythic_tartarus_treads',
        name: 'Stygian Vanguard Sabatons',
        slot: 'boots',
        rarity: 'mythic',
        cost: 0,
        chestOnly: true,
        stats: { speed: 19, dashCooldown: 13, damageReduction: 10, maxHp: 110 },
        icon: '🥾',
        iconImg: 'assets/boots/StygianVanguardSabatons.png',
        desc: 'Underworld siege greaves shattering concrete wherever a dash touches down.',
        passive: {
            id: 'stygian_tremor',
            name: 'Stygian Tremor',
            desc: 'Dash recharges 25% faster while moving; landing a dash triggers a 175px Stygian Quake (46 DMG + 0.85s stun).'
        }
    }
};

if (typeof GEAR_DATA !== 'undefined') {
    Object.assign(GEAR_DATA, CHEST_GEAR_EXPANSION_DATA);
    Object.values(CHEST_GEAR_EXPANSION_DATA).forEach(item => {
        if (typeof GEAR_ITEMS !== 'undefined' && GEAR_ITEMS[item.slot]) {
            if (!GEAR_ITEMS[item.slot].some(g => g.id === item.id)) {
                GEAR_ITEMS[item.slot].push(item);
            }
        }
        if (typeof ALL_GEAR !== 'undefined' && !ALL_GEAR.some(g => g.id === item.id)) {
            ALL_GEAR.push(item);
        }
    });
}

if (typeof window !== 'undefined') window.CHEST_GEAR_EXPANSION_DATA = CHEST_GEAR_EXPANSION_DATA;
if (typeof module !== 'undefined' && module.exports) module.exports = { CHEST_GEAR_EXPANSION_DATA };
