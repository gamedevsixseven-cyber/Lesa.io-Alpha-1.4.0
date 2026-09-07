/**
 * Lesa.io - Money Gun Weapon Definition
 * Default signature weapon for 50balos
 */

class MoneyGun extends WeaponBase {
    constructor() {
        super({
            id: 'money_gun',
            name: 'Money Gun',
            type: 'money_gun',
            rarity: 'Epic',
            hero: '50balos',
            baseDelay: 10,
            baseDamage: 28,
            radius: 10,
            extraPierce: 1,
            maxBounces: 0,
            color: '#e67e22',
            icon: 'assets/WeaponIcons/MoneyGun.png',
            description: 'Rapidly blasts crisp 50€ banknotes that slice through enemies with paper-thin velocity.',
            stats: {
                damage: '28 Cash',
                fireRate: 'Rapid (0.16s)',
                pierce: '1 Target',
                special: '50€ Bills'
            }
        });
    }
}

if (typeof window !== 'undefined') {
    window.MoneyGun = MoneyGun;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MoneyGun };
}
