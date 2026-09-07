/**
 * Lesa.io - Authoritative Weapon Registry & Stats
 * Single source of truth for weapon damage, fire rates, projectiles, bounces, and pierce
 */

const WEAPONS = {
    pea: {
        id: 'pea',
        name: 'Pea Slingshot',
        icon: '🌱',
        baseDelay: 16,
        baseDamage: 25,
        radius: 8,
        extraPierce: 0,
        maxBounces: 0,
        color: '#2ed573'
    },
    watermelon: {
        id: 'watermelon',
        name: 'Melon Cannon',
        icon: '🍉',
        baseDelay: 30,
        baseDamage: 65,
        radius: 14,
        extraPierce: 0,
        maxBounces: 0,
        color: '#20bf6b'
    },
    pepper: {
        id: 'pepper',
        name: 'Chili Blaster',
        icon: '🌶️',
        baseDelay: 9,
        baseDamage: 22,
        radius: 8,
        extraPierce: 2,
        maxBounces: 0,
        color: '#eb4d4b'
    },
    bubble: {
        id: 'bubble',
        name: 'Bubble Gun',
        rarity: 'Exclusive',
        icon: '🫧',
        baseDelay: 12,
        baseDamage: 22,
        radius: 10,
        extraPierce: 0,
        maxBounces: 3,
        color: '#70a1ff'
    },
    money_gun: {
        id: 'money_gun',
        name: 'Money Gun',
        icon: '💶',
        baseDelay: 10,
        baseDamage: 28,
        radius: 10,
        extraPierce: 1,
        maxBounces: 0,
        color: '#e67e22',
        image: 'assets/WeaponIcons/MoneyGun.png'
    }
};

if (typeof window !== 'undefined') {
    window.WEAPONS = WEAPONS;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WEAPONS };
}
