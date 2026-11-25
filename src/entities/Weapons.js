/**
 * Lesa.io - Weapon System & Gun Registry
 * Handles projectile creation, damage scaling, fire rates, spread angles, and special weapon behaviors
 */

class WeaponSystem {
    static SHARED_UNLOCKABLE_IDS = ['bubble', 'rusty_smg', 'nail_gun', 'plasma_pistol', 'sawnoff_shotgun', 'frost_cannon', 'm4_carbine', 'spas12', 'boomerang_saw', 'chrono_rifle', 'symbiote', 'carbine', 'dialtone', 'zeus_thunderbolt', 'helios_cannon', 'skewer_rifle', 'vulcan_minigun', 'hades_railgun', 'medusa_gaze', 'hyperion_glaive', 'tempest_bow', 'void_mortar', 'aurelion_scepter'];

    static isSharedWeapon(weaponType) {
        return this.SHARED_UNLOCKABLE_IDS.includes(weaponType);
    }

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
            case 'helios_cannon':
                return { baseDelay: 12, baseDamage: 52, radius: 11, extraPierce: 3, maxBounces: 0, speedMultiplier: 1.60, critChanceBonus: 0.16, range: 1020, singularityEveryNShots: 4, beamEveryNShots: 8 };
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
            case 'm4_carbine':
                return { baseDelay: 8, baseDamage: 24, radius: 7, extraPierce: 1, maxBounces: 0, speedMultiplier: 1.48, critChanceBonus: 0.08, range: 980 };
            case 'spas12':
                return { baseDelay: 32, baseDamage: 16, radius: 6, extraPierce: 0, maxBounces: 0, speedMultiplier: 1.44, critChanceBonus: 0.08, range: 560, fanEveryNShots: 4 };
            case 'boomerang_saw':
                return { baseDelay: 22, baseDamage: 42, radius: 15, extraPierce: 99, maxBounces: 0, speedMultiplier: 1.28, critChanceBonus: 0.10, range: 520 };
            case 'chrono_rifle':
                return { baseDelay: 11, baseDamage: 24, radius: 8, extraPierce: 0, maxBounces: 0, speedMultiplier: 1.58, critChanceBonus: 0.12, range: 960 };
            case 'symbiote':
                return { baseDelay: 14, baseDamage: 28, radius: 9, extraPierce: 0, maxBounces: 0, speedMultiplier: 1.52, critChanceBonus: 0.10, range: 960 };
            case 'rusty_smg':
                return { baseDelay: 6, baseDamage: 14, radius: 6, extraPierce: 0, maxBounces: 0, speedMultiplier: 1.38, range: 780 };
            case 'nail_gun':
                return { baseDelay: 12, baseDamage: 24, radius: 7, extraPierce: 2, maxBounces: 0, speedMultiplier: 1.44, range: 840 };
            case 'plasma_pistol':
                return { baseDelay: 11, baseDamage: 29, radius: 8, extraPierce: 1, maxBounces: 1, speedMultiplier: 1.48, critChanceBonus: 0.10, range: 920 };
            case 'sawnoff_shotgun':
                return { baseDelay: 24, baseDamage: 18, radius: 6, extraPierce: 0, maxBounces: 0, speedMultiplier: 1.38, critChanceBonus: 0.08, range: 520 };
            case 'frost_cannon':
                return { baseDelay: 17, baseDamage: 42, radius: 10, extraPierce: 1, maxBounces: 0, speedMultiplier: 1.46, critChanceBonus: 0.12, range: 940 };
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
            if (!ctxOptions.deferSave && window.SaveManager && typeof window.SaveManager.requestSave === 'function') {
                window.SaveManager.requestSave();
            } else if (!ctxOptions.deferSave && window.cloudSave && window.cloudSave.currentUser && typeof window.cloudSave.saveToCloud === 'function') {
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
        const isRemote = (typeof RemotePlayer !== 'undefined' && player instanceof RemotePlayer);
        const isEvolved = isRemote ? !!player.weaponEvolved : (player && player.weaponEvolved !== undefined ? !!player.weaponEvolved : (typeof WeaponEvolutionManager !== 'undefined' && WeaponEvolutionManager.isEvolved(weaponType)));
        if (weaponType === 'm4_carbine' && typeof M4Carbine !== 'undefined') {
            M4Carbine.drawWeapon(ctx, flash, recoil);
            return true;
        }
        if (weaponType === 'spas12' && typeof Spas12 !== 'undefined') { Spas12.drawWeapon(ctx, flash, recoil); return true; }
        if (weaponType === 'rusty_smg' && typeof StreetUzi !== 'undefined') { StreetUzi.drawWeapon(ctx, flash, recoil); return true; }
        if (weaponType === 'nail_gun' && typeof VillageNailgun !== 'undefined') { VillageNailgun.drawWeapon(ctx, flash, recoil); return true; }
        if (weaponType === 'plasma_pistol' && typeof NeonArcPistol !== 'undefined') { NeonArcPistol.drawWeapon(ctx, flash, recoil); return true; }
        if (weaponType === 'sawnoff_shotgun' && typeof SawnOffShotgun !== 'undefined') { SawnOffShotgun.drawWeapon(ctx, flash, recoil); return true; }
        if (weaponType === 'frost_cannon' && typeof CryoVortexCannon !== 'undefined') { CryoVortexCannon.drawWeapon(ctx, flash, recoil); return true; }
        if (weaponType === 'boomerang_saw' && typeof BoomerangSawblade !== 'undefined') {
            BoomerangSawblade.drawWeapon(ctx, flash, recoil);
            return true;
        }
        if (weaponType === 'chrono_rifle' && typeof ChronoRifle !== 'undefined') {
            ChronoRifle.drawWeapon(ctx, flash, recoil);
            return true;
        }
        if (weaponType === 'symbiote' && typeof SymbioteLauncher !== 'undefined') {
            SymbioteLauncher.drawWeapon(ctx, flash, recoil);
            return true;
        }
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
        if (weaponType === 'helios_cannon' && typeof HeliosOmegaCannon !== 'undefined') {
            HeliosOmegaCannon.drawWeapon(ctx, flash, recoil, isEvolved);
            return true;
        }
        if (weaponType === 'skewer_rifle' && typeof SkewerCharcoalRifle !== 'undefined') { SkewerCharcoalRifle.drawWeapon(ctx, flash, recoil); return true; }
        if (weaponType === 'vulcan_minigun' && typeof HephaestusVulcanMinigun !== 'undefined') { HephaestusVulcanMinigun.drawWeapon(ctx, flash, recoil, isEvolved, player); return true; }
        if (weaponType === 'hades_railgun' && typeof HadesOblivionRailgun !== 'undefined') { HadesOblivionRailgun.drawWeapon(ctx, flash, recoil, isEvolved); return true; }
        if (weaponType === 'medusa_gaze' && typeof MedusaGorgonGaze !== 'undefined') { MedusaGorgonGaze.drawWeapon(ctx, flash, recoil, isEvolved); return true; }
        if (weaponType === 'hyperion_glaive' && typeof HyperionCelestialGlaive !== 'undefined') { HyperionCelestialGlaive.drawWeapon(ctx, flash, recoil, isEvolved, player); return true; }
        if (typeof ChestWeaponsCoordinator !== 'undefined' && ChestWeaponsCoordinator.drawWeapon(weaponType, ctx, flash, recoil, isEvolved)) return true;
        if (weaponType === 'bubble' && typeof BubbleGun !== 'undefined' && typeof BubbleGun.drawWeapon === 'function') {
            BubbleGun.drawWeapon(ctx, flash, recoil, player ? (player.bubbleCharge || 0) : 0);
            return true;
        }
        return false;
    }

    static updateBullet(b, dt, effects, arena) {
        if (b.type === 'boomerang_saw' && typeof BoomerangSawblade !== 'undefined') {
            return BoomerangSawblade.updateBullet(b, dt, effects, arena);
        }
        if (b.type === 'symbiote_tendril' && typeof SymbioteLauncher !== 'undefined') {
            return SymbioteLauncher.updateBullet(b, dt, effects, arena);
        }
        if ((b.type === 'medusa_gaze' || b.type === 'medusa_serpent') && typeof MedusaGorgonGaze !== 'undefined') {
            return MedusaGorgonGaze.updateBullet(b, dt, effects, arena);
        }
        if (typeof ChestWeaponsCoordinator !== 'undefined') return ChestWeaponsCoordinator.updateBullet(b, dt, effects, arena);
        return false;
    }

    static drawBullet(ctx, b) {
        if (b.type === 'm4_carbine' && typeof M4Carbine !== 'undefined') { M4Carbine.drawBullet(ctx, b); return true; }
        if (b.type === 'spas12' && typeof Spas12 !== 'undefined') { Spas12.drawBullet(ctx, b); return true; }
        if (b.type === 'rusty_smg' && typeof StreetUzi !== 'undefined') { StreetUzi.drawBullet(ctx, b); return true; }
        if (b.type === 'nail_gun' && typeof VillageNailgun !== 'undefined') { VillageNailgun.drawBullet(ctx, b); return true; }
        if (b.type === 'plasma_pistol' && typeof NeonArcPistol !== 'undefined') { NeonArcPistol.drawBullet(ctx, b); return true; }
        if (b.type === 'sawnoff_shotgun' && typeof SawnOffShotgun !== 'undefined') { SawnOffShotgun.drawBullet(ctx, b); return true; }
        if ((b.type === 'frost_cannon' || b.type === 'cryo_shard') && typeof CryoVortexCannon !== 'undefined') { CryoVortexCannon.drawBullet(ctx, b); return true; }
        if (b.type === 'boomerang_saw' && typeof BoomerangSawblade !== 'undefined') { BoomerangSawblade.drawBullet(ctx, b); return true; }
        if (b.type === 'chrono_rifle' && typeof ChronoRifle !== 'undefined') { ChronoRifle.drawBullet(ctx, b); return true; }
        if ((b.type === 'symbiote' || b.type === 'symbiote_tendril') && typeof SymbioteLauncher !== 'undefined') { SymbioteLauncher.drawBullet(ctx, b); return true; }
        if (b.type === 'carbine' && typeof KiloumpasCarbine !== 'undefined') { KiloumpasCarbine.drawBullet(ctx, b); return true; }
        if (b.type === 'dialtone' && typeof RoufDialToneBlaster !== 'undefined') { RoufDialToneBlaster.drawBullet(ctx, b); return true; }
        if (b.type === 'zeus_thunderbolt' && typeof ZeusThunderbolt !== 'undefined') { ZeusThunderbolt.drawBullet(ctx, b); return true; }
        if (b.type === 'helios_cannon' && typeof HeliosOmegaCannon !== 'undefined') { HeliosOmegaCannon.drawBullet(ctx, b); return true; }
        if (b.type === 'skewer_rifle' && typeof SkewerCharcoalRifle !== 'undefined') { SkewerCharcoalRifle.drawBullet(ctx, b); return true; }
        if (b.type === 'vulcan_minigun' && typeof HephaestusVulcanMinigun !== 'undefined') { HephaestusVulcanMinigun.drawBullet(ctx, b); return true; }
        if (b.type === 'hades_railgun' && typeof HadesOblivionRailgun !== 'undefined') { HadesOblivionRailgun.drawBullet(ctx, b); return true; }
        if ((b.type === 'medusa_gaze' || b.type === 'medusa_serpent' || b.type === 'medusa_shard') && typeof MedusaGorgonGaze !== 'undefined') { MedusaGorgonGaze.drawBullet(ctx, b); return true; }
        if (typeof ChestWeaponsCoordinator !== 'undefined' && ChestWeaponsCoordinator.drawBullet(ctx, b)) return true;
        return false;
    }

    static onBulletHit(b, e, finalDmg, enemies, effects, game) {
        if (b.type === 'zeus_thunderbolt' && typeof ZeusThunderbolt !== 'undefined') {
            ZeusThunderbolt.onHit(b, e, finalDmg, enemies, effects, game);
        } else if (b.type === 'helios_cannon' && typeof HeliosOmegaCannon !== 'undefined') {
            HeliosOmegaCannon.onHit(b, e, finalDmg, enemies, effects, game);
        } else if (b.type === 'skewer_rifle' && typeof SkewerCharcoalRifle !== 'undefined') {
            SkewerCharcoalRifle.onHit(b, e, finalDmg, enemies, effects, game);
        } else if (b.type === 'vulcan_minigun' && typeof HephaestusVulcanMinigun !== 'undefined') {
            HephaestusVulcanMinigun.onHit(b, e, finalDmg, enemies, effects, game);
        } else if (b.type === 'hades_railgun' && typeof HadesOblivionRailgun !== 'undefined') {
            HadesOblivionRailgun.onHit(b, e, finalDmg, enemies, effects, game);
        } else if ((b.type === 'medusa_gaze' || b.type === 'medusa_serpent' || b.type === 'medusa_shard') && typeof MedusaGorgonGaze !== 'undefined') {
            MedusaGorgonGaze.onHit(b, e, finalDmg, enemies, effects, game);
        } else if (b.type === 'spas12' && typeof Spas12 !== 'undefined') {
            Spas12.onHit(b, e, finalDmg, enemies, effects, game);
        } else if (b.type === 'nail_gun' && typeof VillageNailgun !== 'undefined') {
            VillageNailgun.onHit(b, e, finalDmg, enemies, effects);
        } else if (b.type === 'plasma_pistol' && typeof NeonArcPistol !== 'undefined') {
            NeonArcPistol.onHit(b, e, finalDmg, enemies, effects);
        } else if (b.type === 'sawnoff_shotgun' && typeof SawnOffShotgun !== 'undefined') {
            SawnOffShotgun.onHit(b, e, finalDmg, enemies, effects);
        } else if ((b.type === 'frost_cannon' || b.type === 'cryo_shard') && typeof CryoVortexCannon !== 'undefined') {
            CryoVortexCannon.onHit(b, e, finalDmg, enemies, effects, game);
        } else if (b.type === 'chrono_rifle' && typeof ChronoRifle !== 'undefined') {
            ChronoRifle.onHit(b, e, finalDmg, enemies, effects, game);
        } else if ((b.type === 'symbiote' || b.type === 'symbiote_tendril') && typeof SymbioteLauncher !== 'undefined') {
            SymbioteLauncher.onHit(b, e, finalDmg, enemies, effects, game);
        } else if (typeof ChestWeaponsCoordinator !== 'undefined') {
            ChestWeaponsCoordinator.onBulletHit(b, e, finalDmg, enemies, effects, game);
        }
        if (b.type !== 'chrono_rifle' && typeof ChronoRifle !== 'undefined') {
            ChronoRifle.onAnyBulletHit(e, finalDmg, effects);
        }
        if (b.type !== 'symbiote' && !b.isSymbioteMirror && typeof SymbioteLauncher !== 'undefined') {
            SymbioteLauncher.onAnyDamage(e, finalDmg, effects, game);
        }
    }

    static onObstacleHit(b, obs, effects, game) {
        if (b.type === 'boomerang_saw' && typeof BoomerangSawblade !== 'undefined') {
            return BoomerangSawblade.onObstacleHit(b, obs, effects, game);
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
        if (player.weaponType === 'vulcan_minigun') {
            const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
            player._vulcanHeat = Math.min(1.0, (player._vulcanHeat || 0) + (isEvolved ? 0.13 : 0.11));
            player._vulcanLastShotAt = nowMs;
            delay *= 1 / (1 + player._vulcanHeat * (isEvolved ? 0.55 : 0.45));
        }

        if (player.frappesFrenzyTimer > 0) {
            delay *= player.frappesFireRateBuff ? Math.min(0.55, 1 / player.frappesFireRateBuff) : 0.55;
        } else if (player.frenzyTimer > 0) {
            delay *= 0.55;
        }
        const passiveFrMult = (typeof GearPassives !== 'undefined') ? GearPassives.getFireRateMultiplier(player) : 1.0;
        const perkFrMult = (typeof window !== 'undefined' && window.perkSystem && typeof window.perkSystem.getFireRateMultiplier === 'function') ? window.perkSystem.getFireRateMultiplier(player) : 1.0;
        player.fireCooldown = delay / (player.fireRateMultiplier * passiveFrMult * perkFrMult);
        player.recoilOffset = 8;

        if (window.soundEngine && typeof window.soundEngine.playShoot === 'function') {
            window.soundEngine.playShoot(player.weaponType);
        }

        const bullets = [];
        const startAngle = player.angle - ((player.multiShot - 1) * player.spreadAngle) / 2;
        const passiveCritBonus = (typeof GearPassives !== 'undefined') ? GearPassives.getCritBonus(player) : 0;
        const speedMult = config.speedMultiplier || 1.0;
        const shotSpeed = player.bulletSpeed * speedMult;
        const coopActive = !!(typeof window !== 'undefined' && window.gameInstance && window.gameInstance.coopSession);
        const adminDmgBoost = !coopActive && !!(typeof window !== 'undefined' && window.AdminCheats && window.AdminCheats.damageBoost);
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
        // Helios Omega Cannon: every 4th shot launches a Singularity Core; every 8th (6th Evolved) fires a Handheld Omega Beam
        let isHeliosSingularity = false;
        let isHeliosBeam = false;
        if (player.weaponType === 'helios_cannon') {
            player._heliosShotCount = (player._heliosShotCount || 0) + 1;
            const singN = config.singularityEveryNShots || 4;
            const beamN = config.beamEveryNShots || 8;
            isHeliosBeam = (player._heliosShotCount % beamN) === 0;
            isHeliosSingularity = !isHeliosBeam && (player._heliosShotCount % singN) === 0;
        }
        // Hephaestus Vulcan Minigun: every 8th shot (6th Evolved ★) fires a Molten Buster Slug
        let isVulcanBuster = false;
        if (player.weaponType === 'vulcan_minigun') {
            const busterN = config.busterEveryNShots || 8;
            player._vulcanShotCount = ((player._vulcanShotCount || 0) + 1) % busterN;
            isVulcanBuster = player._vulcanShotCount === 0;
        }
        // Hades Oblivion Railgun (Evolved ★): every 3rd shot unleashes twin flanking Phantom Rail Lances
        let isHadesPhantomTurn = false;
        if (player.weaponType === 'hades_railgun' && isEvolved) {
            const phN = config.phantomEveryNShots || 3;
            player._hadesShotCount = ((player._hadesShotCount || 0) + 1) % phN;
            if (player._hadesShotCount === 0) {
                fanOffsets = [-0.11, 0, 0.11];
                isHadesPhantomTurn = true;
            }
        }
        // Medusa's Gorgon Gaze (Evolved ★): every 4th shot unleashes a 130° Gorgon Stare Cone Flash
        let isMedusaStare = false;
        if (player.weaponType === 'medusa_gaze') {
            player._medusaShotCount = ((player._medusaShotCount || 0) + 1);
            isMedusaStare = isEvolved && ((player._medusaShotCount % (config.stareEveryNShots || 4)) === 0);
        }
        // SPAS-12 fires 6 buckshot pellets normally and an 8-pellet Breacher salvo on every 4th trigger pull
        let isSpasBreach = false;
        if (player.weaponType === 'spas12') {
            const breachN = config.fanEveryNShots || 4;
            player._spasShotCount = ((player._spasShotCount || 0) + 1) % breachN;
            isSpasBreach = player._spasShotCount === 0;
            fanOffsets = isSpasBreach
                ? ((typeof Spas12 !== 'undefined' && Spas12.BREACH_OFFSETS) || [-0.25, -0.175, -0.105, -0.035, 0.035, 0.105, 0.175, 0.25])
                : ((typeof Spas12 !== 'undefined' && Spas12.PELLET_OFFSETS) || [-0.21, -0.125, -0.042, 0.042, 0.125, 0.21]);
        }
        if (player.weaponType === 'sawnoff_shotgun') {
            fanOffsets = (typeof SawnOffShotgun !== 'undefined' && SawnOffShotgun.PELLET_OFFSETS) || [-0.17, -0.055, 0.055, 0.17];
        }
        const ps = (typeof window !== 'undefined' && window.perkSystem) ? window.perkSystem : null;
        const perkFire = (ps && typeof ps.onWeaponFire === 'function') ? ps.onWeaponFire(player) : null;
        const perkCritBonus = (ps && typeof ps.getCritDamageBonus === 'function') ? ps.getCritDamageBonus(player) : 0;

        if (player.weaponType === 'hyperion_glaive' && typeof HyperionCelestialGlaive !== 'undefined') {
            const gCritMult = (player.critMultiplier || 2.0) + perkCritBonus;
            const glaiveCfg = adminDmgBoost ? { ...config, baseDamage: (config.baseDamage || 80) * 10 } : config;
            HyperionCelestialGlaive.fireSwing(player, glaiveCfg, critChance, gCritMult, isEvolved, effects, (typeof window !== 'undefined' ? window.gameInstance : null));
            if (typeof GearPassives !== 'undefined') GearPassives.onShoot(player, [], effects);
            return [];
        }
        if ((player.weaponType === 'tempest_bow' || player.weaponType === 'aurelion_scepter') && typeof ChestWeaponsCoordinator !== 'undefined') {
            const cMult = (player.critMultiplier || 2.0) + perkCritBonus;
            const cCfg = adminDmgBoost ? { ...config, baseDamage: (config.baseDamage || 50) * 10 } : config;
            ChestWeaponsCoordinator.fireWeapon(player, cCfg, critChance, cMult, isEvolved, effects, bullets);
            if (typeof GearPassives !== 'undefined') GearPassives.onShoot(player, bullets, effects);
            return bullets;
        }

        for (let i = 0; i < player.multiShot; i++) {
            const baseAngle = startAngle + i * player.spreadAngle;
            for (let fIdx = 0; fIdx < fanOffsets.length; fIdx++) {
                const fOff = fanOffsets[fIdx];
                const jitter = player.weaponType === 'm4_carbine'
                    ? (Math.random() - 0.5) * 0.064
                    : (player.weaponType === 'rusty_smg'
                        ? (Math.random() - 0.5) * 0.15
                        : (player.weaponType === 'vulcan_minigun'
                            ? (Math.random() - 0.5) * 0.055
                            : ((player.weaponType === 'spas12' || player.weaponType === 'sawnoff_shotgun') ? (Math.random() - 0.5) * 0.035 : 0)));
                const shotAngle = baseAngle + fOff + jitter;
                const aimAngle = (player.weaponType === 'spas12' || player.weaponType === 'sawnoff_shotgun') ? baseAngle : shotAngle;
                const pr = player.radius || 25;
                let muzzleX = player.x + Math.cos(aimAngle) * (pr + 14);
                let muzzleY = player.y + Math.sin(aimAngle) * (pr + 14);
                if (player.weaponType === 'm4_carbine' || player.weaponType === 'spas12' || player.weaponType === 'boomerang_saw' || player.weaponType === 'chrono_rifle' || player.weaponType === 'symbiote' || player.weaponType === 'helios_cannon' || player.weaponType === 'rusty_smg' || player.weaponType === 'nail_gun' || player.weaponType === 'plasma_pistol' || player.weaponType === 'sawnoff_shotgun' || player.weaponType === 'frost_cannon' || player.weaponType === 'skewer_rifle' || player.weaponType === 'vulcan_minigun' || player.weaponType === 'hades_railgun' || player.weaponType === 'medusa_gaze' || player.weaponType === 'void_mortar') {
                    const tip = player.weaponType === 'boomerang_saw' ? 43 : (player.weaponType === 'm4_carbine' ? 46 : (player.weaponType === 'void_mortar' ? 45 : (player.weaponType === 'rusty_smg' || player.weaponType === 'plasma_pistol' || player.weaponType === 'nail_gun' || player.weaponType === 'sawnoff_shotgun' || player.weaponType === 'frost_cannon' ? 38 : 48)));
                    const gyBase = (player.weaponType === 'spas12' || player.weaponType === 'sawnoff_shotgun') ? 2.1 : ((player.weaponType === 'symbiote' || player.weaponType === 'helios_cannon' || player.weaponType === 'vulcan_minigun' || player.weaponType === 'hades_railgun' || player.weaponType === 'medusa_gaze' || player.weaponType === 'void_mortar') ? 0 : 1.05);
                    const gy = Math.cos(aimAngle) < 0 ? gyBase : -gyBase;
                    muzzleX = player.x + Math.cos(aimAngle) * tip - Math.sin(aimAngle) * gy;
                    muzzleY = (player.y - pr * 0.32) + Math.sin(aimAngle) * tip + Math.cos(aimAngle) * gy;
                }

                const pelletSpeed = (player.weaponType === 'spas12' || player.weaponType === 'sawnoff_shotgun') ? shotSpeed * (0.94 + Math.random() * 0.12) : shotSpeed;
                const isCrit = Math.random() < critChance;
                const isPhantomBolt = isHadesPhantomTurn && fOff !== 0;
                let dmg = config.baseDamage * (player.damageMultiplier || 1);
                if (adminDmgBoost) dmg *= 10;
                if (isZeusSkyBolt) dmg *= 1.6;
                if (isSpasBreach) dmg *= 1.28;
                if (isVulcanBuster) dmg *= isEvolved ? 1.85 : 1.75;
                if (isPhantomBolt) dmg *= 0.65;
                if (perkFire && perkFire.shardDmgMult) dmg *= perkFire.shardDmgMult;
                if (isCrit) dmg *= ((player.critMultiplier || 2.0) + perkCritBonus);

                const b = new Bullet({
                    x: muzzleX,
                    y: muzzleY,
                    vx: Math.cos(shotAngle) * pelletSpeed,
                    vy: Math.sin(shotAngle) * pelletSpeed,
                    damage: dmg,
                    speed: pelletSpeed,
                    radius: isHeliosSingularity ? (config.radius + 3) : (isVulcanBuster ? config.radius + 4 : config.radius),
                    type: player.weaponType,
                    isEnemy: false,
                    pierce: isHeliosSingularity ? 1 : (isPhantomBolt ? Math.max(4, (player.pierce + config.extraPierce) - 4) : (player.pierce + config.extraPierce)),
                    maxBounces: config.maxBounces > 0 ? config.maxBounces : player.maxBounces,
                    range: isHeliosSingularity ? Math.min(shotRange, 560) : shotRange,
                    shooter: player,
                    isCrit: isCrit
                });
                b.isCrit = isCrit;
                if (isEvolved) b.isWeaponEvolved = true;
                if (isZeusSkyBolt) b.isSkyBolt = true;
                if (isHeliosSingularity) b.isSingularityCore = true;
                if (isSpasBreach) b._spasBreach = true;
                if (isVulcanBuster) b.isMoltenBuster = true;
                if (isPhantomBolt) b.isPhantomRail = true;
                if (isMedusaStare && i === 0 && fIdx === 0) b.isStareShot = true;
                if (player.weaponType === 'medusa_gaze') b._wavePhase = ((player._medusaShotCount || 0) % 2) * Math.PI;
                if (perkFire && perkFire.isPermafrostShard) b.isPermafrostShard = true;
                bullets.push(b);

                if (player.weaponType === 'hades_railgun' && i === 0 && fOff === 0 && typeof HadesOblivionRailgun !== 'undefined') {
                    HadesOblivionRailgun.addShotRift(muzzleX, muzzleY, aimAngle, isEvolved);
                }

                if (effects && ((player.weaponType !== 'spas12' && !isHadesPhantomTurn) || fIdx === 0)) {
                    if (typeof effects.addMuzzleFlash === 'function') {
                        effects.addMuzzleFlash(muzzleX, muzzleY, aimAngle, player.weaponType, (isSpasBreach || isVulcanBuster) ? 1.25 : 1.0, false);
                    }
                    effects.addDust(muzzleX, muzzleY, 1, 3);
                }
            }
        }

        if (isHeliosBeam && typeof HeliosOmegaCannon !== 'undefined') {
            HeliosOmegaCannon.fireBeam(player, player.angle, config.baseDamage * (player.damageMultiplier || 1), isEvolved, effects, (typeof window !== 'undefined' ? window.gameInstance : null));
        }
        if (isMedusaStare && typeof MedusaGorgonGaze !== 'undefined') {
            MedusaGorgonGaze.fireStareCone(player, player.angle, config.baseDamage * (player.damageMultiplier || 1), effects, (typeof window !== 'undefined' ? window.gameInstance : null));
        }
        if (typeof GearPassives !== 'undefined') {
            GearPassives.onShoot(player, bullets, effects);
        }

        return bullets;
    }

    /**
     * Handle Armory weapon card click: reject locked chest/boss weapons, or equip when owned.
     */
    static handleWeaponCardClick(wt, modalManager = null, cardEl = null) {
        if (!wt) return false;
        const isShared = this.SHARED_UNLOCKABLE_IDS.includes(wt);

        if (isShared && !this.isWeaponUnlocked(wt)) {
            if (window.soundEngine && typeof window.soundEngine.playBuzzer === 'function') window.soundEngine.playBuzzer();
            return false;
        }

        if (typeof window !== 'undefined' && window.GameState && window.GameState.player) {
            window.GameState.player.weaponType = wt;
            window.GameState.player.selectedWeapon = wt;
        }
        if (typeof localStorage !== 'undefined') localStorage.setItem('lesaio_selected_weapon', wt);
        if (typeof window !== 'undefined' && window.SaveManager && typeof window.SaveManager.requestSave === 'function') window.SaveManager.requestSave(300);
        if (modalManager && typeof modalManager.updateGearScreen === 'function') modalManager.updateGearScreen();
        if (typeof window !== 'undefined' && window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
            window.soundEngine.playSelect();
        }
        return true;
    }
}

if (typeof window !== 'undefined') {
    window.WeaponSystem = WeaponSystem;
}
