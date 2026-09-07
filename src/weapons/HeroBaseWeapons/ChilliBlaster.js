/**
 * Lesa.io - Chili Blaster Weapon Definition
 * Default high-pierce rapid weapon for Psogas
 */

class ChilliBlaster extends WeaponBase {
    constructor() {
        super({
            id: 'pepper',
            name: 'Chili Blaster',
            type: 'pepper',
            rarity: 'Common',
            hero: 'psogas',
            baseDelay: 9,
            baseDamage: 22,
            radius: 8,
            extraPierce: 2,
            maxBounces: 0,
            color: '#eb4d4b',
            icon: 'assets/WeaponIcons/ChilliBlaster.png',
            description: 'Scorching hot pepper blaster that cuts through enemy ranks with piercing spicy fire.',
            stats: {
                damage: '22 Searing',
                fireRate: 'Rapid (0.15s)',
                pierce: '2 Targets',
                special: 'Searing Heat'
            }
        });
    }
}

if (typeof window !== 'undefined') {
    window.ChilliBlaster = ChilliBlaster;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ChilliBlaster };
}
