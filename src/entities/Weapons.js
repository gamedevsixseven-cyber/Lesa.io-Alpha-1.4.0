/**
 * Lesa.io - Weapon System & Gun Registry
 * Handles projectile creation, damage scaling, fire rates, spread angles, and special weapon behaviors
 */

class WeaponSystem {
    static SHARED_UNLOCKABLE_IDS = ['bubble', 'carbine', 'dialtone', 'zeus_thunderbolt'];

    static getWeaponConfig(type) {
        if (typeof WEAPONS !== 'undefined' && WEAPONS[type]) {
            return WEAPONS[type];
        }

        switch (type) {
            case 'watermelon':
                return { baseDelay: 25, baseDamage: 75, radius: 18, extraPierce: 0, maxBounces: 0 };
            case 'bubble':
                return { baseDelay: 12, baseDamage: 22, radius: 10, extraPierce: 0, maxBounces: 3 };
            case 'carbine':
                return { baseDelay: 22, baseDamage: 54, radius: 9, extraPierce: 2, maxBounces: 0, speedMultiplier: 1.42, critChanceBonus: 0.15, range: 1150 };
            case 'dialtone':
                return { baseDelay: 14, baseDamage: 34, radius: 13, extraPierce: 2, maxBounces: 0, speedMultiplier: 0.94, range: 820, slowDuration: 1.5, slowMultiplier: 0.70, fanEveryNShots: 4 };
            case 'zeus_thunderbolt':
                return { baseDelay: 15, baseDamage: 46, radius: 12, extraPierce: 2, maxBounces: 0, speedMultiplier: 1.55, critChanceBonus: 0.12, range: 1050, skyBoltEveryNShots: 5 };
            case 'pepper':
                return { baseDelay: 9, baseDamage: 22, radius: 8, extraPierce: 2, maxBounces: 0 };
            case 'money_gun':
                return { baseDelay: 10, baseDamage: 28, radius: 10, extraPierce: 1, maxBounces: 0 };
            case 'burger':
                return { baseDelay: 18, baseDamage: 45, radius: 12, extraPierce: 1, maxBounces: 0 };
            case 'lightning':
                return { baseDelay: 15, baseDamage: 38, radius: 10, extraPierce: 0, maxBounces: 0 };
            case 'greek_flag':
                return { baseDelay: 14, baseDamage: 36, radius: 12, extraPierce: 1, maxBounces: 0, speedMultiplier: 1.15 };
            case 'pea':
            default:
                return { baseDelay: 16, baseDamage: 25, radius: 8, extraPierce: 0, maxBounces: 0 };
        }
    }

    /**
     * Check whether a shared or hero weapon is currently unlocked.
     */
    static isWeaponUnlocked(weaponId) {
        if (!weaponId) return false;
        if (weaponId === 'bubble' && typeof localStorage !== 'undefined' && localStorage.getItem('lesaio_weapon_bubble_unlocked') === 'true') {
            return true;
        }
        const stateList = (typeof window !== 'undefined' && window.GameState && window.GameState.player && Array.isArray(window.GameState.player.unlockedWeapons))
            ? window.GameState.player.unlockedWeapons
            : null;
        if (stateList && stateList.includes(weaponId)) return true;

        if (typeof localStorage !== 'undefined') {
            try {
                const raw = JSON.parse(localStorage.getItem('lesaio_unlocked_weapons') || '[]');
                if (Array.isArray(raw) && raw.includes(weaponId)) return true;
            } catch (err) { }
        }
        return false;
    }

    /**
     * Resolve currently selected weapon if unlocked for the active hero, else hero default.
     */
    static resolveEquippedWeapon(heroDefaultWeapon = 'pea') {
        const chosen = (typeof window !== 'undefined' && window.GameState && window.GameState.player && (window.GameState.player.selectedWeapon || window.GameState.player.weaponType))
            || (typeof localStorage !== 'undefined' && localStorage.getItem('lesaio_selected_weapon'));
        if (chosen && this.SHARED_UNLOCKABLE_IDS.includes(chosen) && this.isWeaponUnlocked(chosen)) {
            return chosen;
        }
        return heroDefaultWeapon;
    }

    /**
     * Permanently unlock an Arsenal weapon (e.g., on boss defeat) and celebrate if newly obtained.
     */
    static unlockWeapon(weaponId, ctxOptions = {}) {
        if (!weaponId) return { unlockedNow: false, weapon: null };
        const weaponMeta = (typeof WEAPONS !== 'undefined' && WEAPONS[weaponId])
            || (typeof window !== 'undefined' && window.WEAPONS && window.WEAPONS[weaponId])
            || null;
        const alreadyOwned = this.isWeaponUnlocked(weaponId);

        let list = [];
        if (typeof window !== 'undefined' && window.GameState && window.GameState.player) {
            if (!Array.isArray(window.GameState.player.unlockedWeapons)) {
                window.GameState.player.unlockedWeapons = ['pea'];
            }
            list = window.GameState.player.unlockedWeapons;
        } else if (typeof localStorage !== 'undefined') {
            try {
                const parsed = JSON.parse(localStorage.getItem('lesaio_unlocked_weapons') || '["pea"]');
                if (Array.isArray(parsed)) list = parsed;
            } catch (err) {
                list = ['pea'];
            }
        }

        if (!list.includes(weaponId)) {
            list.push(weaponId);
        }
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('lesaio_unlocked_weapons', JSON.stringify(list));
            if (weaponId === 'bubble') localStorage.setItem('lesaio_weapon_bubble_unlocked', 'true');
        }

        if (!alreadyOwned && typeof window !== 'undefined') {
            if (window.cloudSave && window.cloudSave.currentUser && typeof window.cloudSave.saveToCloud === 'function') {
                window.cloudSave.saveToCloud({ unlockedWeapons: list });
            }
            if (window.uiController && window.uiController.modalManager && typeof window.uiController.modalManager.updateWeaponsModal === 'function') {
                window.uiController.modalManager.updateWeaponsModal();
            }
            if (window.EventBus && typeof window.EventBus.emit === 'function') {
                window.EventBus.emit('weaponUnlocked', { weaponId, weapon: weaponMeta });
            }
            if (!ctxOptions.silent && ctxOptions.effects) {
                const sx = Number.isFinite(ctxOptions.x) ? ctxOptions.x : 0;
                const sy = Number.isFinite(ctxOptions.y) ? ctxOptions.y : 0;
                const title = (weaponMeta && weaponMeta.name) || weaponId;
                ctxOptions.effects.addComicSplash(sx, sy - 68, `UNLOCKED: ${title.toUpperCase()}!`, '#fed330', 22, true);
                if (typeof ctxOptions.effects.addConfetti === 'function') {
                    ctxOptions.effects.addConfetti(sx, sy, 30);
                }
            }
            if (!ctxOptions.silent && window.soundEngine && typeof window.soundEngine.playPickup === 'function') {
                window.soundEngine.playPickup('star');
            }
        }
        return { unlockedNow: !alreadyOwned, weapon: weaponMeta };
    }

    /**
     * Draw shared unlockable weapon model when held by any hero.
     */
    static drawEquippedModel(ctx, weaponType, flash, recoil = 0, player = null) {
        const isEvolved = typeof WeaponEvolutionManager !== 'undefined' && WeaponEvolutionManager.isEvolved(weaponType);
        if (weaponType === 'carbine' && typeof KiloumpasCarbine !== 'undefined') {
            KiloumpasCarbine.drawWeapon(ctx, flash, recoil);
            return true;
        }
        if (weaponType === 'dialtone' && typeof RoufDialToneBlaster !== 'undefined') {
            RoufDialToneBlaster.drawWeapon(ctx, flash, recoil);
            return true;
        }
        if (weaponType === 'zeus_thunderbolt' && typeof ZeusThunderbolt !== 'undefined') {
            ZeusThunderbolt.drawWeapon(ctx, flash, recoil, isEvolved);
            return true;
        }
        if (weaponType === 'bubble' && typeof BubbleGun !== 'undefined' && typeof BubbleGun.drawWeapon === 'function') {
            BubbleGun.drawWeapon(ctx, flash, recoil, player ? (player.bubbleCharge || 0) : 0);
            return true;
        }
        return false;
    }

    /**
     * Fire active player weapon and generate projectile array
     */
    static fire(player, effects = null) {
        if (player.fireCooldown > 0) return null;

        const baseConfig = WeaponSystem.getWeaponConfig(player.weaponType);
        const isEvolved = typeof WeaponEvolutionManager !== 'undefined' && WeaponEvolutionManager.isEvolved(player.weaponType);
        const config = (typeof WeaponEvolutionManager !== 'undefined')
            ? WeaponEvolutionManager.getEffectiveConfig(player.weaponType, baseConfig, isEvolved)
            : baseConfig;
        let delay = config.baseDelay;

        if (player.frappesFrenzyTimer > 0) {
            delay *= player.frappesFireRateBuff ? Math.min(0.55, 1 / player.frappesFireRateBuff) : 0.55;
        } else if (player.frenzyTimer > 0) {
            delay *= 0.55;
        }
        const passiveFrMult = (typeof GearPassives !== 'undefined') ? GearPassives.getFireRateMultiplier(player) : 1.0;
        const perkFrMult = (typeof window !== 'undefined' && window.perkSystem && typeof window.perkSystem.getFireRateMultiplier === 'function') ? window.perkSystem.getFireRateMultiplier(player) : 1.0;
        player.fireCooldown = delay / (player.fireRateMultiplier * passiveFrMult * perkFrMult);
        player.recoilOffset = 8;

        if (window.soundEngine) {
            window.soundEngine.playShoot(player.weaponType);
        }

        const bullets = [];
        const startAngle = player.angle - ((player.multiShot - 1) * player.spreadAngle) / 2;
        const passiveCritBonus = (typeof GearPassives !== 'undefined') ? GearPassives.getCritBonus(player) : 0;
        const speedMult = config.speedMultiplier || 1.0;
        const shotSpeed = player.bulletSpeed * speedMult;
        const adminDmgBoost = !!(typeof window !== 'undefined' && window.AdminCheats && window.AdminCheats.damageBoost);
        const critChance = adminDmgBoost ? 1.0 : Math.min(0.95, player.critChance + passiveCritBonus + (config.critChanceBonus || 0));
        const shotRange = config.range || 900;

        // Every Nth shot on Dial-Tone Blaster fires a 3-way Speed-Dial fan
        let fanOffsets = [0];
        if (player.weaponType === 'dialtone') {
            const fanN = config.fanEveryNShots || 4;
            player._dialtoneShotCount = ((player._dialtoneShotCount || 0) + 1) % fanN;
            if (player._dialtoneShotCount === 0) {
                fanOffsets = [-0.20, 0, 0.20];
                if (effects && typeof effects.addShockwave === 'function') {
                    effects.addShockwave(player.x, player.y, 68, 'rgba(254, 211, 48, 0.55)');
                }
            }
        }

        // Every Nth shot on Zeus's Master Thunderbolt charges a Sky-Bolt Spear (1.6x damage + vertical sky strike)
        let isZeusSkyBolt = false;
        if (player.weaponType === 'zeus_thunderbolt') {
            const skyN = config.skyBoltEveryNShots || 5;
            player._zeusBoltShotCount = ((player._zeusBoltShotCount || 0) + 1) % skyN;
            isZeusSkyBolt = player._zeusBoltShotCount === 0;
        }
        const ps = (typeof window !== 'undefined' && window.perkSystem) ? window.perkSystem : null;
        const perkFire = (ps && typeof ps.onWeaponFire === 'function') ? ps.onWeaponFire(player) : null;
        const perkCritBonus = (ps && typeof ps.getCritDamageBonus === 'function') ? ps.getCritDamageBonus(player) : 0;

        for (let i = 0; i < player.multiShot; i++) {
            const baseAngle = startAngle + i * player.spreadAngle;
            for (const fOff of fanOffsets) {
                const shotAngle = baseAngle + fOff;
                const muzzleX = player.x + Math.cos(shotAngle) * (player.radius + 14);
                const muzzleY = player.y + Math.sin(shotAngle) * (player.radius + 14);

                const isCrit = Math.random() < critChance;
                let dmg = config.baseDamage * (player.damageMultiplier || 1);
                if (adminDmgBoost) dmg *= 10;
                if (isZeusSkyBolt) dmg *= 1.6;
                if (perkFire && perkFire.shardDmgMult) dmg *= perkFire.shardDmgMult;
                if (isCrit) dmg *= ((player.critMultiplier || 2.0) + perkCritBonus);

                const b = new Bullet({
                    x: muzzleX,
                    y: muzzleY,
                    vx: Math.cos(shotAngle) * shotSpeed,
                    vy: Math.sin(shotAngle) * shotSpeed,
                    damage: dmg,
                    speed: shotSpeed,
                    radius: config.radius,
                    type: player.weaponType,
                    isEnemy: false,
                    pierce: player.pierce + config.extraPierce,
                    maxBounces: config.maxBounces > 0 ? config.maxBounces : player.maxBounces,
                    range: shotRange,
                    shooter: player,
                    isCrit: isCrit
                });
                b.isCrit = isCrit;
                if (isEvolved) b.isWeaponEvolved = true;
                if (isZeusSkyBolt) b.isSkyBolt = true;
                if (perkFire && perkFire.isPermafrostShard) b.isPermafrostShard = true;
                bullets.push(b);

                if (effects) {
                    if (typeof effects.addMuzzleFlash === 'function') {
                        effects.addMuzzleFlash(muzzleX, muzzleY, shotAngle, player.weaponType, 1.0, false);
                    }
                    effects.addDust(muzzleX, muzzleY, 1, 3);
                }
            }
        }

        if (typeof GearPassives !== 'undefined') {
            GearPassives.onShoot(player, bullets, effects);
        }

        return bullets;
    }
}

if (typeof window !== 'undefined') {
    window.WeaponSystem = WeaponSystem;
}
