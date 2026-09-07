/**
 * Lesa.io - Pea Slingshot Weapon Definition
 * Default starter kinetic weapon for Psanas
 */

class PeaSlingshot extends WeaponBase {
    constructor() {
        super({
            id: 'pea',
            name: 'Pea Slingshot',
            type: 'pea',
            rarity: 'Common',
            hero: 'psanas',
            baseDelay: 16,
            baseDamage: 25,
            radius: 8,
            extraPierce: 0,
            maxBounces: 0,
            color: '#2ed573',
            icon: 'assets/WeaponIcons/PeaSlingshot.png',
            description: 'A rapid tactical slingshot firing high-velocity charged kinetic garden peas.',
            stats: {
                damage: '25 Heavy',
                fireRate: 'Rapid (0.27s)',
                pierce: 'None',
                special: 'Kinetic Shot'
            }
        });
    }
}

if (typeof window !== 'undefined') {
    window.PeaSlingshot = PeaSlingshot;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PeaSlingshot };
}
