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
            baseDelay: 25,
            baseDamage: 75,
            radius: 18,
            extraPierce: 0,
            maxBounces: 0,
            color: '#20bf6b',
            icon: 'assets/WeaponIcons/MelonCannon.png',
            description: 'Heavy melon mortar launching devastating explosive watermelons with high impact.',
            stats: {
                damage: '75 Impact',
                fireRate: 'Heavy (0.42s)',
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
