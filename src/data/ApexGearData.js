/**
 * Lesa.io - Apex Rarity Boss Gear Catalog
 * Earned exclusively from Hard Endless Apex Bosses:
 *   - Wave 30 Apex Boss (Alpha, Sovereign of Ruin): Apex Belt & Apex Gloves
 *   - Wave 60 Final Apex Boss (Omega, Sovereign of the End): Apex Armor, Helmet & Boots
 * W60 pieces carry modestly higher stat totals than W30 pieces while sharing Apex rarity.
 */

const APEX_GEAR_DATA = {
    // ==========================================
    // WAVE 30 APEX BOSS DROPS (BELT & GLOVES)
    // ==========================================
    apex_ruin_cord: {
        id: 'apex_ruin_cord',
        name: 'Sovereign War-Cord',
        slot: 'belt',
        rarity: 'apex',
        cost: 0,
        excludeFromChests: true,
        bossUnlock: 'apex_sovereign_w30',
        unlockLabel: 'DEFEAT W30 APEX',
        stats: { dashCooldown: 15, magnetRadius: 115, maxHp: 120, bulletDamage: 14, fireRate: 10 },
        statSummary: '-15% Dash CD, +115 Magnet, +120 HP, +14% DMG, +10% Fire Rate',
        icon: '♦️',
        iconImg: 'assets/Belts/ApexSovereignCord.png',
        desc: 'Forged from Alpha’s shattered pylon core; channels crimson slipstreams on every dash.',
        passive: {
            id: 'ruin_slipstream',
            name: 'Ruin Slipstream',
            desc: 'Dashing tears a 55 DMG crimson rift through foes, pulls pickups, and grants +22% Crit & +12% Fire Rate for 2s.'
        }
    },
    apex_rift_gauntlets: {
        id: 'apex_rift_gauntlets',
        name: 'Pylon Rift Gauntlets',
        slot: 'gloves',
        rarity: 'apex',
        cost: 0,
        excludeFromChests: true,
        bossUnlock: 'apex_sovereign_w30',
        unlockLabel: 'DEFEAT W30 APEX',
        stats: { fireRate: 24, bulletDamage: 25, bulletSpeed: 19, critDamage: 18, maxHp: 85 },
        statSummary: '+24% Fire Rate, +25% DMG, +19% Proj Spd, +18% Crit DMG, +85 HP',
        icon: '🥊',
        iconImg: 'assets/Gloves/ApexRiftGauntlets.png',
        desc: 'Twin reactor gauntlets crackling with shield-pylon lightning and volatile overcharge shells.',
        passive: {
            id: 'pylon_overload',
            name: 'Pylon Overload',
            desc: 'Every 6th shot fires a pierced Crimson Overcharge round (+45% DMG blast); 18% hit chance to arc pylon lightning to 2 foes.'
        }
    },

    // ==========================================
    // WAVE 60 FINAL APEX BOSS DROPS (ARMOR, HELMET, BOOTS)
    // ==========================================
    apex_omega_mantle: {
        id: 'apex_omega_mantle',
        name: 'Mantle of the End',
        slot: 'armor',
        rarity: 'apex',
        cost: 0,
        excludeFromChests: true,
        bossUnlock: 'apex_omega_w60',
        unlockLabel: 'DEFEAT W60 APEX',
        stats: { maxHp: 295, bulletDamage: 22, fireRate: 15, critDamage: 24, damageReduction: 4 },
        statSummary: '+295 HP, +22% DMG, +15% Fire Rate, +24% Crit DMG, +4% DEF',
        icon: '🛡️',
        iconImg: 'assets/Armors/ApexOmegaMantle.png',
        desc: 'Omega’s sovereign plate woven from dying starlight, towering above Olympian myth.',
        passive: {
            id: 'omega_aegis_barrier',
            name: 'Omega Eclipse Barrier',
            desc: 'Every 7s gain a 95 HP Omega Barrier; hit/break unleashes a 110 DMG shockwave (0.75s stun). +18% DMG vs Bosses & 1x fatal save.'
        }
    },
    apex_omega_crown: {
        id: 'apex_omega_crown',
        name: 'Crown of Oblivion',
        slot: 'helmet',
        rarity: 'apex',
        cost: 0,
        excludeFromChests: true,
        bossUnlock: 'apex_omega_w60',
        unlockLabel: 'DEFEAT W60 APEX',
        stats: { critChance: 13, critDamage: 46, fireRate: 16, bulletDamage: 15, maxHp: 95 },
        statSummary: '+13% Crit, +46% Crit DMG, +16% Fire Rate, +15% DMG, +95 HP',
        icon: '👑',
        iconImg: 'assets/Helmets/ApexOmegaCrown.png',
        desc: 'Crowned helm of the Final Horizon that locks onto boss vitals with lethal eclipse precision.',
        passive: {
            id: 'sovereign_execution',
            name: 'Sovereign Execution',
            desc: 'Crits vs Bosses/Elites deal +22% DMG; 22% crit chance to smite foes with crimson lightning (+42% DMG) + 15-kill heal pulse.'
        }
    },
    apex_eclipse_greaves: {
        id: 'apex_eclipse_greaves',
        name: 'Eclipse Stride Sabatons',
        slot: 'boots',
        rarity: 'apex',
        cost: 0,
        excludeFromChests: true,
        bossUnlock: 'apex_omega_w60',
        unlockLabel: 'DEFEAT W60 APEX',
        stats: { speed: 20, dashCooldown: 10, damageReduction: 15, maxHp: 145, critDamage: 16 },
        statSummary: '+20% Move Speed, -10% Dash CD, +15% DEF, +145 HP, +16% Crit DMG',
        icon: '🥾',
        iconImg: 'assets/boots/ApexEclipseGreaves.png',
        desc: 'Gravity-warping war greaves forged from Omega’s ash that shatter the arena on landing.',
        passive: {
            id: 'eclipse_phase_step',
            name: 'Eclipse Phase Step',
            desc: 'Slow-immune, +18% dodge & +30% dash recharge while moving; landing a dash triggers a 48 DMG Eclipse Quake (0.9s stun).'
        }
    }
};

if (typeof GEAR_DATA !== 'undefined') {
    Object.assign(GEAR_DATA, APEX_GEAR_DATA);
    Object.values(APEX_GEAR_DATA).forEach(item => {
        if (typeof GEAR_ITEMS !== 'undefined' && GEAR_ITEMS[item.slot]) {
            const exists = GEAR_ITEMS[item.slot].some(g => g.id === item.id);
            if (!exists) GEAR_ITEMS[item.slot].push(item);
        }
        if (typeof ALL_GEAR !== 'undefined' && !ALL_GEAR.some(g => g.id === item.id)) {
            ALL_GEAR.push(item);
        }
    });
}

if (typeof window !== 'undefined') window.APEX_GEAR_DATA = APEX_GEAR_DATA;
if (typeof module !== 'undefined' && module.exports) module.exports = { APEX_GEAR_DATA };
