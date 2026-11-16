/**
 * Lesa.io - Permanent Power Upgrades Data Definitions
 * Subtle, balanced stats designed for gradual progression.
 */

const UPGRADE_COSTS = [500, 1000, 2000, 3500, 6000];

const UPGRADE_DEFINITIONS = [
    {
        id: 'critChance',
        title: 'Critical Chance',
        icon: '🎯',
        iconImg: 'assets/ui-icons/target.svg',
        iconBg: '#ff4757',
        desc: '+1% critical strike chance per level',
        maxLevel: 5,
        costs: UPGRADE_COSTS,
        formatCurrent: (lvl) => lvl > 0 ? `+${lvl}% Crit Chance` : 'Base (0%)',
        formatNext: (lvl) => `+1% Crit Chance (+${lvl + 1}% total)`
    },
    {
        id: 'critDamage',
        title: 'Critical Damage',
        icon: '💥',
        iconImg: 'assets/ui-icons/boom.svg',
        iconBg: '#ffa502',
        desc: '+0.05x (+5%) critical strike damage multiplier',
        maxLevel: 5,
        costs: UPGRADE_COSTS,
        formatCurrent: (lvl) => lvl > 0 ? `+${(lvl * 0.05).toFixed(2)}x Crit DMG` : 'Base (0x)',
        formatNext: (lvl) => `+0.05x Crit DMG (+${((lvl + 1) * 0.05).toFixed(2)}x total)`
    },
    {
        id: 'maxHealth',
        title: 'Max Health',
        icon: '❤️',
        iconImg: 'assets/GearUIIcons/HP.png',
        iconBg: '#2ed573',
        desc: '+6 base survivability HP per level',
        maxLevel: 5,
        costs: UPGRADE_COSTS,
        formatCurrent: (lvl) => lvl > 0 ? `+${lvl * 6} Base HP` : 'Base (0 HP)',
        formatNext: (lvl) => `+6 Base HP (+${(lvl + 1) * 6} HP total)`
    },
    {
        id: 'goldBonus',
        title: 'Gold Bonus',
        icon: '🪙',
        iconImg: 'assets/ui-icons/coin.svg',
        iconBg: '#eccc68',
        desc: '+3% extra coins earned from match clears',
        maxLevel: 5,
        costs: UPGRADE_COSTS,
        formatCurrent: (lvl) => lvl > 0 ? `+${lvl * 3}% Bonus Gold` : 'Base (0%)',
        formatNext: (lvl) => `+3% Bonus Gold (+${(lvl + 1) * 3}% total)`
    }
];

if (typeof window !== 'undefined') {
    window.UPGRADE_DEFINITIONS = UPGRADE_DEFINITIONS;
    window.UPGRADE_COSTS = UPGRADE_COSTS;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UPGRADE_DEFINITIONS, UPGRADE_COSTS };
}
