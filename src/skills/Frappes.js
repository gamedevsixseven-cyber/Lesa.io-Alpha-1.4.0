/**
 * Lesa.io - Active Skill: Frappes (Legendary)
 * Greek Frappé Caffeinated Frenzy with "Pagakia" (Ice Cubes) Mastery Capstone (Frappes+).
 * Mastery features:
 *  - Permanent Cooldown Reduction (-3.0s: 9s cooldown vs 12s)
 *  - Sub-Zero Ice Aura: bullets & contact chill and slow enemies by 50%
 *  - Caffeine Extension: kills during frenzy extend duration by +0.8s
 */

class FrappesSkill {
    static init() {
        if (this._initialized) return;
        this._initialized = true;

        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.on('enemyKilled', (data) => {
                const game = window.gameInstance;
                const player = game ? game.player : null;
                if (!player) return;

                // Mastery perk: kills extend frenzy duration
                if (player.frappesFrenzyTimer > 0 && player.hasPagakiaMastery) {
                    player.frappesFrenzyTimer = Math.min(600, player.frappesFrenzyTimer + 48); // +0.8s
                    if (player.frappesFrenzyTimer > (player.frappesFrenzyMaxTimer || 0)) {
                        player.frappesFrenzyMaxTimer = player.frappesFrenzyTimer;
                    }
                    player.frenzyTimer = Math.max(player.frenzyTimer || 0, player.frappesFrenzyTimer);
                    if (game.effects) {
                        game.effects.addComicSplash(player.x, player.y - 32, '+0.8s 🧊');
                        game.effects.addSparks(player.x, player.y, '#00cec9', 5);
                    }
                }
            });
        }
    }

    static execute(player, level, enemies = [], effects = null, camera = null, game = null) {
        this.init();

        const skillData = (typeof SKILLS !== 'undefined' && SKILLS.frappes) ? SKILLS.frappes : null;
        const levelData = (skillData && skillData.levels) ? skillData.levels[level] : null;

        const hasPagakia = level >= 5;
        const duration = levelData ? levelData.duration : (hasPagakia ? 480 : 300);
        const speedBuff = levelData ? levelData.speedBuff : 1.65;
        const fireRateBuff = levelData ? levelData.fireRateBuff : 1.50;

        // Apply Player Frenzy Buff State
        player.frappesFrenzyTimer = duration;
        player.frappesFrenzyMaxTimer = duration;
        player.frappesSpeedBuff = speedBuff;
        player.frappesFireRateBuff = fireRateBuff;
        player.hasPagakiaMastery = hasPagakia;

        // Skill cooldown duration; countdown begins ONLY after frenzy ends
        const cdSec = hasPagakia ? (skillData ? skillData.masteryCooldown : 9.0) : (skillData ? skillData.cooldown : 12.0);
        player.maxSkillCooldown = Math.round(cdSec * 60);
        player.skillCooldown = 0; // Effect is active; cooldown begins upon completion

        // Also light up the engine's built-in frenzy timer for unified fire-rate boost
        player.frenzyTimer = Math.max(player.frenzyTimer || 0, duration);

        // Instant Ammo / Magazine Reload
        player.fireCooldown = 0;
        if (typeof WeaponSystem !== 'undefined' && WeaponSystem.currentWeapon) {
            WeaponSystem.currentWeapon.ammo = WeaponSystem.currentWeapon.maxAmmo || 999;
            WeaponSystem.currentWeapon.reloadTimer = 0;
        }

        // Frothy Coffee & Ice Splash Visuals
        if (effects) {
            const popupText = hasPagakia ? 'FRAPPES+! 🧊' : 'FRAPPES FRENZY! 🥤';
            effects.addComicSplash(player.x, player.y - 35, popupText);
            effects.addShockwave(player.x, player.y, 120, hasPagakia ? 'rgba(0, 206, 201, 0.85)' : 'rgba(243, 156, 18, 0.85)');
            effects.addSparks(player.x, player.y, hasPagakia ? '#00cec9' : '#f39c12', 18);
            effects.addSparks(player.x, player.y, '#ffffff', 10);
            effects.addDust(player.x, player.y, 8, 12);
        }

        if (camera) {
            camera.addShake(6);
        }

        if (window.soundEngine) {
            if (typeof window.soundEngine.playPickup === 'function') {
                window.soundEngine.playPickup('health');
            } else if (typeof window.soundEngine.playSelect === 'function') {
                window.soundEngine.playSelect();
            }
        }
    }

    static update(player, dt = 1, effects = null, enemies = []) {
        if (!player || player.frappesFrenzyTimer <= 0) return;

        player.frappesFrenzyTimer -= dt;
        player.frenzyTimer = Math.max(player.frenzyTimer || 0, player.frappesFrenzyTimer);

        // Motion blur and trailing particles
        if (effects && Math.random() < 0.45) {
            const trailCol = player.hasPagakiaMastery ? '#00cec9' : '#f39c12';
            effects.addSparks(player.x, player.y, trailCol, 2);
        }

        // Mastery Perk: Sub-zero frost contact aura
        if (player.hasPagakiaMastery && enemies && enemies.length > 0) {
            const auraRadius = player.radius + 35;
            for (let i = 0; i < enemies.length; i++) {
                const enemy = enemies[i];
                if (enemy.dead) continue;

                const dx = enemy.x - player.x;
                const dy = enemy.y - player.y;
                if (dx * dx + dy * dy <= auraRadius * auraRadius) {
                    if (typeof enemy.applyIceSlow === 'function') {
                        enemy.applyIceSlow(2.5, 0.50, effects);
                    } else {
                        enemy.iceSlowTimer = 150;
                        enemy.iceSlowMultiplier = 0.50;
                    }
                }
            }
        }

        // Frenzy duration has ended! The moment the effect ends, cooldown begins and drops down!
        if (player.frappesFrenzyTimer <= 0) {
            player.frappesFrenzyTimer = 0;
            player.frenzyTimer = 0;
            player.skillCooldown = player.maxSkillCooldown;
            if (effects) {
                effects.addComicSplash(player.x, player.y - 32, 'COOLDOWN ⏱️');
                effects.addDust(player.x, player.y, 6, 10);
            }
        }
    }
}

// Auto-initialize kill hook
if (typeof window !== 'undefined') {
    window.FrappesSkill = FrappesSkill;
    FrappesSkill.init();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FrappesSkill };
}
