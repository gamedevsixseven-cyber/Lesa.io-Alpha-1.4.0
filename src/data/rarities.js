/**
 * Lesa.io - Weapon & Equipment Rarity Registry
 * Defines color schemes, visual tiers, and metadata for all gear rarities
 */

const RARITIES = {
    Common: {
        id: 'Common',
        key: 'common',
        name: 'Common',
        color: '#95a5a6',
        bg: '#ecf0f1',
        border: '#7f8c8d',
        badgeClass: 'badge-common',
        glow: 'rgba(149, 165, 166, 0.4)'
    },
    Uncommon: {
        id: 'Uncommon',
        key: 'uncommon',
        name: 'Uncommon',
        color: '#2ecc71',
        bg: '#e8f8f5',
        border: '#27ae60',
        badgeClass: 'badge-uncommon',
        glow: 'rgba(46, 204, 113, 0.4)'
    },
    Rare: {
        id: 'Rare',
        key: 'rare',
        name: 'Rare',
        color: '#3498db',
        bg: '#ebf5fb',
        border: '#2980b9',
        badgeClass: 'badge-rare',
        glow: 'rgba(52, 152, 219, 0.45)'
    },
    Epic: {
        id: 'Epic',
        key: 'epic',
        name: 'Epic',
        color: '#9b59b6',
        bg: '#f5eef8',
        border: '#8e44ad',
        badgeClass: 'badge-epic',
        glow: 'rgba(155, 89, 182, 0.5)'
    },
    Legendary: {
        id: 'Legendary',
        key: 'legendary',
        name: 'Legendary',
        color: '#f39c12',
        bg: '#fef9e7',
        border: '#d35400',
        badgeClass: 'badge-legendary',
        glow: 'rgba(243, 156, 18, 0.55)'
    },
    Mythic: {
        id: 'Mythic',
        key: 'mythic',
        name: 'Mythic',
        color: '#e74c3c',
        bg: '#fdedec',
        border: '#c0392b',
        badgeClass: 'badge-mythic',
        glow: 'rgba(231, 76, 60, 0.6)'
    },
    Exotic: {
        id: 'Exotic',
        key: 'exotic',
        name: 'Exotic',
        color: '#00cec9',
        bg: '#e0fbfb',
        border: '#00b894',
        badgeClass: 'badge-exotic',
        glow: 'rgba(0, 206, 201, 0.65)'
    },
    Exclusive: {
        id: 'Exclusive',
        key: 'exclusive',
        name: 'Exclusive',
        color: '#fd79a8',
        bg: '#fdeef4',
        border: '#e84393',
        badgeClass: 'badge-exclusive',
        glow: 'rgba(253, 121, 168, 0.7)'
    },
    Special: {
        id: 'Special',
        key: 'special',
        name: 'Special',
        color: '#f1c40f',
        bg: '#fefde8',
        border: '#f39c12',
        badgeClass: 'badge-special',
        glow: 'rgba(241, 196, 15, 0.5)'
    },
    Dev: {
        id: 'Dev',
        key: 'dev',
        name: 'Dev',
        color: '#00ff88',
        bg: '#1a1a1a',
        border: '#00ff88',
        badgeClass: 'badge-dev',
        glow: 'rgba(0, 255, 136, 0.8)'
    }
};

class RarityRegistry {
    static get(rarityName) {
        if (!rarityName) return RARITIES.Common;
        const normalized = rarityName.charAt(0).toUpperCase() + rarityName.slice(1).toLowerCase();
        return RARITIES[normalized] || RARITIES[rarityName] || RARITIES.Common;
    }

    static getColor(rarityName) {
        return this.get(rarityName).color;
    }

    static getBadgeClass(rarityName) {
        return this.get(rarityName).badgeClass;
    }
}

if (typeof window !== 'undefined') {
    window.RARITIES = RARITIES;
    window.RarityRegistry = RarityRegistry;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RARITIES, RarityRegistry };
}
