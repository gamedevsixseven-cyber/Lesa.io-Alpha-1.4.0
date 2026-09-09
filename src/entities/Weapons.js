/**
 * Lesa.io - Weapon System & Gun Registry
 * Handles projectile creation, damage scaling, fire rates, spread angles, and special weapon behaviors
 */

class WeaponSystem {
    static getWeaponConfig(type) {
        if (typeof WEAPONS !== 'undefined' && WEAPONS[type]) {
            return WEAPONS[type];
        }

        switch (type) {
            case 'watermelon':
                return { baseDelay: 30, baseDamage: 65, radius: 14, extraPierce: 0, maxBounces: 0 };
            case 'bubble':
                return { baseDelay: 12, baseDamage: 22, radius: 10, extraPierce: 0, maxBounces: 3 };
            case 'pepper':
                return { baseDelay: 9, baseDamage: 22, radius: 8, extraPierce: 2, maxBounces: 0 };
            case 'money_gun':
                return { baseDelay: 10, baseDamage: 28, radius: 10, extraPierce: 1, maxBounces: 0 };
            case 'burger':
                return { baseDelay: 18, baseDamage: 45, radius: 12, extraPierce: 1, maxBounces: 0 };
            case 'lightning':
                return { baseDelay: 15, baseDamage: 38, radius: 10, extraPierce: 0, maxBounces: 0 };
            case 'pea':
            default:
                return { baseDelay: 16, baseDamage: 25, radius: 8, extraPierce: 0, maxBounces: 0 };
        }
    }

    /**
     * Fire active player weapon and generate projectile array
     */
    static fire(player, effects = null) {
        if (player.fireCooldown > 0) return null;

        const config = WeaponSystem.getWeaponConfig(player.weaponType);
        let delay = config.baseDelay;

        if (player.frappesFrenzyTimer > 0) {
            delay *= player.frappesFireRateBuff ? Math.min(0.55, 1 / player.frappesFireRateBuff) : 0.55;
        } else if (player.frenzyTimer > 0) {
            delay *= 0.55;
        }
        player.fireCooldown = delay / player.fireRateMultiplier;
        player.recoilOffset = 8;

        if (window.soundEngine) {
            window.soundEngine.playShoot(player.weaponType);
        }

        const bullets = [];
        const startAngle = player.angle - ((player.multiShot - 1) * player.spreadAngle) / 2;

        for (let i = 0; i < player.multiShot; i++) {
            const shotAngle = startAngle + i * player.spreadAngle;
            const muzzleX = player.x + Math.cos(shotAngle) * (player.radius + 14);
            const muzzleY = player.y + Math.sin(shotAngle) * (player.radius + 14);

            const isCrit = Math.random() < player.critChance;
            let dmg = config.baseDamage * (player.damageMultiplier || 1);
            if (isCrit) dmg *= (player.critMultiplier || 2.0);

            const b = new Bullet({
                x: muzzleX,
                y: muzzleY,
                vx: Math.cos(shotAngle) * player.bulletSpeed,
                vy: Math.sin(shotAngle) * player.bulletSpeed,
                damage: dmg,
                speed: player.bulletSpeed,
                radius: config.radius,
                type: player.weaponType,
                isEnemy: false,
                pierce: player.pierce + config.extraPierce,
                maxBounces: config.maxBounces > 0 ? config.maxBounces : player.maxBounces,
                shooter: player,
                isCrit: isCrit
            });
            b.isCrit = isCrit;
            bullets.push(b);

            if (effects) {
                effects.addDust(muzzleX, muzzleY, 2, 4);
            }
        }

        return bullets;
    }
}

if (typeof window !== 'undefined') {
    window.WeaponSystem = WeaponSystem;
}
