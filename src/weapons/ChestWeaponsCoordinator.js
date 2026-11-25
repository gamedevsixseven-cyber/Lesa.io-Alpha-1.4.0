/**
 * Lesa.io - Unified Coordinator for Chest Expansion Weapons
 * Keeps Weapons.js and Effects.js compact (<600 lines) while dispatching
 * custom drawing, projectiles, hits, and world FX cleanly.
 */

class ChestWeaponsCoordinator {
    static drawWeapon(weaponType, ctx, flash, recoil = 0, isEvolved = false) {
        if (weaponType === 'tempest_bow' && typeof TempestLongbow !== 'undefined') {
            TempestLongbow.drawWeapon(ctx, flash, recoil);
            return true;
        }
        if (weaponType === 'void_mortar' && typeof VoidSingularityMortar !== 'undefined') {
            VoidSingularityMortar.drawWeapon(ctx, flash, recoil, isEvolved);
            return true;
        }
        if (weaponType === 'aurelion_scepter' && typeof AurelionAstralScepter !== 'undefined') {
            AurelionAstralScepter.drawWeapon(ctx, flash, recoil, isEvolved);
            return true;
        }
        return false;
    }

    static fireWeapon(player, config, critChance, critMult, isEvolved, effects, bullets) {
        if (!player) return false;
        if (player.weaponType === 'tempest_bow' && typeof TempestLongbow !== 'undefined') {
            TempestLongbow.fire(player, config, critChance, critMult, effects, bullets);
            return true;
        }
        if (player.weaponType === 'aurelion_scepter' && typeof AurelionAstralScepter !== 'undefined') {
            AurelionAstralScepter.fire(player, config, critChance, critMult, isEvolved, effects, bullets);
            return true;
        }
        return false;
    }

    static updateBullet(b, dt, effects, arena) {
        if ((b.type === 'tempest_bow' || b.type === 'tempest_seeker') && typeof TempestLongbow !== 'undefined') {
            return TempestLongbow.updateBullet(b, dt, effects, arena);
        }
        if (b.type === 'aurelion_prism_bolt' && typeof AurelionAstralScepter !== 'undefined') {
            return AurelionAstralScepter.updateBullet(b, dt);
        }
        return false;
    }

    static drawBullet(ctx, b) {
        if ((b.type === 'tempest_bow' || b.type === 'tempest_seeker') && typeof TempestLongbow !== 'undefined') {
            TempestLongbow.drawBullet(ctx, b); return true;
        }
        if (b.type === 'void_mortar' && typeof VoidSingularityMortar !== 'undefined') {
            VoidSingularityMortar.drawBullet(ctx, b); return true;
        }
        if ((b.type === 'aurelion_scepter' || b.type === 'aurelion_prism_bolt') && typeof AurelionAstralScepter !== 'undefined') {
            AurelionAstralScepter.drawBullet(ctx, b); return true;
        }
        return false;
    }

    static onBulletHit(b, target, finalDmg, enemies, effects, game) {
        if ((b.type === 'tempest_bow' || b.type === 'tempest_seeker') && typeof TempestLongbow !== 'undefined') {
            TempestLongbow.onHit(b, target, finalDmg, enemies, effects, game);
        } else if (b.type === 'void_mortar' && typeof VoidSingularityMortar !== 'undefined') {
            VoidSingularityMortar.onHit(b, target, finalDmg, enemies, effects, game);
        } else if ((b.type === 'aurelion_scepter' || b.type === 'aurelion_prism_bolt') && typeof AurelionAstralScepter !== 'undefined') {
            AurelionAstralScepter.onHit(b, target, finalDmg, enemies, effects, game);
        }
    }

    static updateWorldFx(dt, gameRef) {
        if (typeof VoidSingularityMortar !== 'undefined') VoidSingularityMortar.update(dt, gameRef);
        if (typeof AurelionAstralScepter !== 'undefined') AurelionAstralScepter.update(dt, gameRef);
    }

    static drawWorldFx(ctx, cam) {
        if (typeof VoidSingularityMortar !== 'undefined') VoidSingularityMortar.drawWorld(ctx, cam);
        if (typeof AurelionAstralScepter !== 'undefined') AurelionAstralScepter.drawWorld(ctx, cam);
    }

    static clearWorldFx() {
        if (typeof VoidSingularityMortar !== 'undefined') VoidSingularityMortar.clear();
        if (typeof AurelionAstralScepter !== 'undefined') AurelionAstralScepter.clear();
    }
}

if (typeof window !== 'undefined') window.ChestWeaponsCoordinator = ChestWeaponsCoordinator;
if (typeof module !== 'undefined' && module.exports) module.exports = { ChestWeaponsCoordinator };
