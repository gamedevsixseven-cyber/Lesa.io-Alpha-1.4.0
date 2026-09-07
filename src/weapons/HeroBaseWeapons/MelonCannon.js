/**
 * Lesa.io - Melon Cannon Weapon Definition
 * Default heavy artillery weapon for Petros
 */

class MelonCannon extends WeaponBase {
    constructor() {
        super({
            id: 'watermelon',
            name: 'Melon Cannon',
            type: 'watermelon',
            rarity: 'Common',
            hero: 'petros',
            baseDelay: 30,
            baseDamage: 65,
            radius: 14,
            extraPierce: 0,
            maxBounces: 0,
            color: '#20bf6b',
            icon: 'assets/WeaponIcons/MelonCannon.png',
            description: 'Heavy melon mortar launching devastating explosive watermelons with high impact.',
            stats: {
                damage: '65 Impact',
                fireRate: 'Slow (0.50s)',
                pierce: 'None',
                special: 'Heavy Blast'
            }
        });
    }
}

if (typeof window !== 'undefined') {
    window.MelonCannon = MelonCannon;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MelonCannon };
}
