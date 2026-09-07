/**
 * Lesa.io - Battle Perks Data Registry
 * 6 loadout perks unlockable via Gold Coins (Hot Foot free starter) and equippable across 3 loadout slots.
 * Includes trigger tags with smart exclusivity (e.g. max 1 [DASH] perk equipped at a time).
 */

const EXCLUSIVE_PERK_TAGS = ['dash'];

const PERKS_DATA = {
    hot_foot: {
        id: 'hot_foot',
        name: 'Hot Foot',
        icon: '🔥',
        badge: 'MOBILITY',
        tag: 'dash',
        tagLabel: 'DASH MOD',
        desc: 'Dashing leaves a burning fire trail (lasts 2s) that deals 35 dmg/s and slows enemies by 30%. (Free at Level 5!)',
        cost: 0,
        unlockLevel: 5,
        color: '#ff4757',
        accent: '#ff6b81'
    },
    counter_blast: {
        id: 'counter_blast',
        name: 'Counter-Blast',
        icon: '💥',
        badge: 'DEFENSE',
        tag: 'on_hurt',
        tagLabel: 'ON HURT',
        desc: 'Taking damage triggers a 360° radial shockwave burst that deals 25 dmg and knocks back nearby enemies.',
        cost: 2400,
        color: '#e67e22',
        accent: '#f39c12'
    },
    golden_touch: {
        id: 'golden_touch',
        name: 'Golden Touch',
        icon: '🪙',
        badge: 'ECONOMY',
        tag: 'economy',
        tagLabel: 'BRUTE DROP',
        desc: 'Defeated brutes (Fatmirs, Casillases, Skarmogyftos) have a 60% chance to drop Gold Pouches (+15–25 coins).',
        cost: 3500,
        color: '#f1c40f',
        accent: '#ffeaa7'
    },
    last_laugh: {
        id: 'last_laugh',
        name: 'Last Laugh',
        icon: '💣',
        badge: 'CHAOS',
        tag: 'on_kill',
        tagLabel: 'ON KILL',
        desc: 'Defeated enemies have a 20% chance to drop a live mini-dynamite that detonates after 1s for 40 AoE damage.',
        cost: 3000,
        color: '#e74c3c',
        accent: '#ff7675'
    },
    second_wind: {
        id: 'second_wind',
        name: 'Second Wind',
        icon: '⚡',
        badge: 'SURVIVAL',
        tag: 'survival',
        tagLabel: 'LOW HP',
        desc: 'When HP drops below 25%, instantly reset Dash cooldown and gain +25% move speed for 3s (30s CD).',
        cost: 4500,
        color: '#3498db',
        accent: '#70a1ff'
    },
    headhunter: {
        id: 'headhunter',
        name: 'Headhunter',
        icon: '🎯',
        badge: 'OFFENSE',
        tag: 'execute',
        tagLabel: 'EXECUTE',
        desc: 'Deals +25% execute damage against weakened enemies that are below 35% health.',
        cost: 6000,
        color: '#9b59b6',
        accent: '#a29bfe'
    }
};

if (typeof window !== 'undefined') {
    window.EXCLUSIVE_PERK_TAGS = EXCLUSIVE_PERK_TAGS;
    window.PERKS_DATA = PERKS_DATA;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EXCLUSIVE_PERK_TAGS, PERKS_DATA };
}

