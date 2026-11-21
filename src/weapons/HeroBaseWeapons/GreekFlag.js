/**
 * Lesa.io - Greek Flag Weapon Definition
 * Signature spear-banner throwing weapon for Psgiannhs
 */

class GreekFlag extends WeaponBase {
    constructor() {
        super({
            id: 'greek_flag',
            name: 'Greek Flag',
            type: 'greek_flag',
            rarity: 'Rare',
            hero: 'psgiannhs',
            baseDelay: 14,
            baseDamage: 36,
            radius: 12,
            extraPierce: 1,
            maxBounces: 0,
            speedMultiplier: 1.15,
            color: '#0d5eaf',
            icon: 'assets/WeaponIcons/GreekFlag.png',
            description: 'Hurls spear-tipped waving Greek flags that pierce through enemies with patriotic force.',
            stats: {
                damage: '36 Impact',
                fireRate: 'Fast (0.23s)',
                pierce: '1 Target',
                special: 'Spear-Tipped Flag'
            }
        });
    }
}

if (typeof window !== 'undefined') {
    window.GreekFlag = GreekFlag;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GreekFlag };
}
