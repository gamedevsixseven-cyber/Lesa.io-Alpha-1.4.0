/**
 * Lesa.io - Admin Cheats & Playtesting Controller
 * Manages runtime cheats, entity spawning, wave jumps, and game testing tools.
 */

class AdminCheatsService {
    constructor() {
        this.godMode = false;
        this.infiniteDash = false;
        this.noSkillCooldown = false;
        this.ghostMode = false;
        this.gameSpeed = 1.0;
        this.instaKillEnemies = false;
    }

    /**
     * Applied each frame in the Game update loop
     */
    applyToUpdate(game, dt) {
        if (!game || !game.player) return;
        const p = game.player;

        // 1. God Mode
        if (this.godMode) {
            p.hp = p.maxHp;
            p.hitFlash = 0;
            p.stunTimer = 0;
        }

        // 2. Infinite Dash
        if (this.infiniteDash) {
            p.dashCooldown = 0;
            p.canDash = true;
        }

        // 3. 0s Skill Cooldown
        if (this.noSkillCooldown) {
            p.skillCooldown = 0;
        }

        // 4. Instakill Enemies Aura (if active)
        if (this.instaKillEnemies && game.enemies.length > 0) {
            for (let i = game.enemies.length - 1; i >= 0; i--) {
                const enemy = game.enemies[i];
                if (enemy && enemy.takeDamage) {
                    enemy.takeDamage(99999, game.effects);
                }
            }
        }
    }

    /**
     * Nuke all active enemies currently in the arena
     */
    nukeArena(game) {
        if (!game || !game.enemies || game.enemies.length === 0) return 0;
        const count = game.enemies.length;

        for (let i = game.enemies.length - 1; i >= 0; i--) {
            const enemy = game.enemies[i];
            if (enemy && enemy.takeDamage) {
                if (game.effects) {
                    game.effects.addComicSplash(enemy.x, enemy.y - 30, 'NUKE! 💥', '#ff4757', 28, true);
                    game.effects.addShockwave(enemy.x, enemy.y, 80, 'rgba(255, 71, 87, 0.8)');
                    game.effects.addDust(enemy.x, enemy.y, 10, 12);
                }
                enemy.takeDamage(999999, game.effects);
            }
        }

        if (window.soundEngine) {
            window.soundEngine.playHit(true, true);
        }

        return count;
    }

    /**
     * Pull all drops on the map straight into the player
     */
    magnetizeDrops(game) {
        if (!game || !game.drops || game.drops.length === 0 || !game.player) return 0;
        const count = game.drops.length;
        const px = game.player.x;
        const py = game.player.y;

        for (const drop of game.drops) {
            drop.x = px + (Math.random() * 20 - 10);
            drop.y = py + (Math.random() * 20 - 10);
        }

        if (game.effects) {
            game.effects.addComicSplash(px, py - 45, 'MAGNET! 🧲✨', '#fed330', 26);
            game.effects.addShockwave(px, py, 140, 'rgba(254, 211, 48, 0.7)');
        }

        if (window.soundEngine) {
            window.soundEngine.playPickup('cookie');
        }

        return count;
    }

    /**
     * Clear all drops from the arena
     */
    clearDrops(game) {
        if (!game) return 0;
        const count = game.drops.length;
        game.drops = [];
        return count;
    }

    /**
     * Jump immediately to any wave
     */
    jumpToWave(game, waveNum) {
        if (!game || !game.waveManager) return;
        const targetWave = Math.max(1, parseInt(waveNum, 10) || 1);

        // Clear existing enemies & bullets
        game.enemies = [];
        game.bullets = [];

        // Start desired wave
        game.waveManager.startWave(targetWave, game.player, game.enemies, game.effects);

        if (game.effects) {
            game.effects.addComicSplash(game.player.x, game.player.y - 60, `WARP TO WAVE ${targetWave}! ⚡`, '#2ed573', 28, true);
        }

        if (window.soundEngine) {
            window.soundEngine.playLevelUp();
        }
    }

    /**
     * Spawn specific enemy type in custom quantity
     */
    spawnEntity(game, type, count = 1) {
        if (!game || !game.player) return 0;
        const px = game.player.x;
        const py = game.player.y;
        const waveMult = game.waveManager ? (1.0 + (game.waveManager.wave - 1) * 0.18) : 1.0;

        let spawned = 0;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
            const dist = 140 + Math.random() * 120;
            const ex = px + Math.cos(angle) * dist;
            const ey = py + Math.sin(angle) * dist;

            let enemy = null;
            if (type === 'fatmir' && typeof Fatmir !== 'undefined') {
                enemy = new Fatmir(ex, ey, waveMult);
            } else if (type === 'casillas' && typeof Casillas !== 'undefined') {
                enemy = new Casillas(ex, ey, waveMult);
            } else if (type === 'skarmogyftos' && typeof Skarmogyftos !== 'undefined') {
                enemy = new Skarmogyftos(ex, ey, waveMult);
            } else if (type === 'kleanthis' && typeof Kleanthis !== 'undefined') {
                enemy = new Kleanthis(ex, ey, waveMult);
            } else if (type === 'kiloumpas' && typeof Kiloumpas !== 'undefined') {
                enemy = new Kiloumpas(ex, ey, waveMult);
            } else if (type === 'rouf' && typeof Rouf !== 'undefined') {
                enemy = new Rouf(ex, ey, waveMult);
            } else if (type === 'astynomos' && typeof Astynomos !== 'undefined') {
                enemy = new Astynomos(ex, ey, waveMult, false);
            } else if (type === 'mat' && typeof Astynomos !== 'undefined') {
                enemy = new Astynomos(ex, ey, waveMult, true);
            }

            if (enemy) {
                game.enemies.push(enemy);
                spawned++;
            }
        }

        if (game.effects && spawned > 0) {
            game.effects.addComicSplash(px, py - 40, `SPAWNED ${spawned}x ${type.toUpperCase()}! 👾`, '#fed330', 22);
        }

        return spawned;
    }

    /**
     * Trigger specific Boss actions on active Kleanthis boss
     */
    forceBossAction(game, action) {
        if (!game || !game.enemies) return false;
        const boss = game.enemies.find(e => e.name === 'Kleanthis' || e.isBoss);
        if (!boss) return false;

        if (action === 'drink' && boss.startDrinking) {
            boss.startDrinking(game.effects);
            return true;
        }
        if (action === 'drunk' && boss.triggerDrunkMode) {
            boss.drunkMeter = 100;
            boss.triggerDrunkMode(game.effects);
            return true;
        }
        if (action === 'rage' && boss.triggerRageMode) {
            boss.hp = Math.min(boss.hp, boss.maxHp * 0.48);
            boss.triggerRageMode(game.effects);
            return true;
        }
        if (action === 'kick' && boss.startKarateKick) {
            boss.startKarateKick(game.player, game.effects);
            return true;
        }
        if (action === 'summon' && boss.summonMinions) {
            boss.summonMinions(game.enemies, game.effects);
            return true;
        }
        if (action === 'volley' && boss.executeShatterVolley) {
            boss.executeShatterVolley(game.player, game.bullets, game.effects);
            return true;
        }
        return false;
    }

    /**
     * Economy & Hero manipulation
     */
    addCurrency(type, amount) {
        if (!window.uiController) return;
        const val = parseInt(amount, 10) || 0;

        if (type === 'coins') {
            const current = window.uiController.coins || 0;
            window.uiController.setCoins(current + val, true);
        } else if (type === 'gems') {
            const current = window.uiController.gems || 0;
            window.uiController.setGems(current + val, true);
        }

        if (window.soundEngine) {
            window.soundEngine.playPickup('star');
        }
    }

    maxAllSkills() {
        if (typeof SkillManager !== 'undefined' && SkillManager.upgradeSkill) {
            SkillManager.upgradeSkill('blade_rush', 3);
            SkillManager.upgradeSkill('nerobalonaki', 3);
        } else {
            localStorage.setItem('lesaio_skill_lvl_blade_rush', '3');
            localStorage.setItem('lesaio_skill_lvl_nerobalonaki', '3');
        }
        if (window.soundEngine) {
            window.soundEngine.playLevelUp();
        }
    }

    unlockAllHeroes() {
        const heroes = ['psanas', 'petros', 'psogas'];
        localStorage.setItem('lesaio_unlocked_heroes', JSON.stringify(heroes));
        if (window.uiController && window.uiController.heroRoster) {
            window.uiController.heroRoster.loadUnlockedState();
        }
        if (window.soundEngine) {
            window.soundEngine.playLevelUp();
        }
    }

    triggerCredits() {
        if (window.creditsScreen) {
            window.creditsScreen.start(() => {
                if (window.uiController) {
                    window.uiController.showMenuScreen();
                }
            });
        }
    }
}

// Global Singleton
window.AdminCheats = new AdminCheatsService();
