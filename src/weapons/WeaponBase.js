/**
 * Lesa.io - Weapon Base Class
 * Authoritative base architecture for all equippable survivor weapons
 */

class WeaponBase {
    constructor(config = {}) {
        this.id = config.id || 'weapon';
        this.name = config.name || 'Weapon';
        this.type = config.type || this.id;
        this.slot = 'weapon';
        this.rarity = config.rarity || 'Common';
        this.hero = config.hero || null;

        // Combat Mechanics & Ballistics
        this.baseDelay = config.baseDelay || 16;
        this.baseDamage = config.baseDamage || 25;
        this.radius = config.radius || 8;
        this.extraPierce = config.extraPierce || 0;
        this.maxBounces = config.maxBounces || 0;
        this.color = config.color || '#2ed573';
        this.icon = config.icon || 'assets/WeaponIcons/PeaSlingshot.png';

        this.description = config.description || '';
        this.stats = config.stats || {};
    }

    getConfig() {
        return {
            id: this.id,
            name: this.name,
            icon: this.icon,
            baseDelay: this.baseDelay,
            baseDamage: this.baseDamage,
            radius: this.radius,
            extraPierce: this.extraPierce,
            maxBounces: this.maxBounces,
            color: this.color,
            description: this.description,
            stats: this.stats
        };
    }
}

if (typeof window !== 'undefined') {
    window.WeaponBase = WeaponBase;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WeaponBase };
}
