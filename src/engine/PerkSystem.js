/**
 * Lesa.io - Battle Perks Gameplay & Physics System
 * Handles runtime combat execution for the 5 Battle Perks:
 * - Hot Foot (Flame trail on dash with 35 dmg/s & 30% enemy slow)
 * - Second Wind (Instant dash reset & +25% speed buff at <25% HP)
 * - Counter-Blast (Radial 8-projectile knockback shockwave on hit)
 * - Headhunter (+25% execute damage against enemies <35% HP)
 * - Golden Touch (60% chance for brutes to drop 15-25 Gold Pouches)
 */

class PerkSystem {
    constructor() {
        this.flameTrails = []; // Hot Foot burning patches: { x, y, radius, life, maxLife }
        this.counterProjectiles = []; // Counter-Blast shockwaves: { x, y, vx, vy, life, damage, hitEnemies }
        this.dynamites = []; // Last Laugh live mini-dynamites: { x, y, timer, maxTimer, radius, damage }
        this.secondWindCooldown = 0; // 30s cooldown (1800 frames)
        this.flameSpawnTimer = 0;
        this.epic = (typeof EpicPerkEffects !== 'undefined') ? new EpicPerkEffects() : null;
        this.legendary = (typeof LegendaryPerkEffects !== 'undefined') ? new LegendaryPerkEffects() : null;
        this.mythic = (typeof MythicPerkEffects !== 'undefined') ? new MythicPerkEffects() : null;
    }

    /**
     * Reset per-run timers and active hazard entities
     */
    init(game) {
        this.flameTrails = [];
        this.counterProjectiles = [];
        this.dynamites = [];
        this.secondWindCooldown = 0;
        this.flameSpawnTimer = 0;
        if (this.epic) this.epic.reset();
        else if (typeof EpicPerkEffects !== 'undefined') this.epic = new EpicPerkEffects();
        if (this.legendary) this.legendary.reset();
        else if (typeof LegendaryPerkEffects !== 'undefined') this.legendary = new LegendaryPerkEffects();
        if (this.mythic) this.mythic.reset();
        else if (typeof MythicPerkEffects !== 'undefined') this.mythic = new MythicPerkEffects();
    }

    onDash(player, effects) {
        if (this.epic) this.epic.onDash(player, effects);
        if (this.legendary) this.legendary.onDash(player, effects, typeof window !== 'undefined' ? window.gameInstance : null);
        if (this.mythic) this.mythic.onDash(player, effects);
    }
    onSkillActivated(player, effects, game) {
        if (this.mythic) this.mythic.onSkillActivated(player, effects, game);
    }
    applyPlayerStatModifiers(player, refreshBaseline = false) {
        if (this.mythic) this.mythic.applyPlayerStatModifiers(player, refreshBaseline);
    }
    getHealMultiplier(player) { return this.mythic ? this.mythic.getHealMultiplier(player) : 1.0; }
    onWeaponFire(player) { return this.legendary ? this.legendary.onWeaponFire(player) : null; }
    getTargetOverride(enemy, fallback) { return this.epic ? this.epic.getTargetOverride(enemy, fallback) : fallback; }
    getFireRateMultiplier(player) {
        return (this.epic ? this.epic.getFireRateMultiplier(player) : 1.0)
            * (this.legendary ? this.legendary.getFireRateMultiplier(player) : 1.0)
            * (this.mythic ? this.mythic.getFireRateMultiplier(player) : 1.0);
    }
    getCritDamageBonus(player) { return this.legendary ? this.legendary.getCritDamageBonus(player) : 0; }
    getDashSpeedMultiplier() { return this.legendary ? this.legendary.getDashSpeedMultiplier() : 1.0; }
    getMagnetMultiplier() {
        return (this.epic ? this.epic.getMagnetMultiplier() : 1.0) * (this.legendary ? this.legendary.getMagnetMultiplier() : 1.0);
    }
    getCoinMultiplier() {
        return (this.epic ? this.epic.getCoinMultiplier() : 1.0) * (this.mythic ? this.mythic.getCoinMultiplier() : 1.0);
    }
    getXpMultiplier() {
        return (this.epic ? this.epic.getXpMultiplier() : 1.0) * (this.mythic ? this.mythic.getXpMultiplier() : 1.0);
    }
    getMaterialDropLuckBonus() { return this.legendary ? this.legendary.getMaterialDropLuckBonus() : 0; }
    getFullHpHeartCoinValue(player) { return this.legendary ? this.legendary.getFullHpHeartCoinValue(player) : 0; }
    interceptPlayerDamage(player, amount, effects, game) {
        let res = this.epic ? this.epic.interceptPlayerDamage(player, amount, effects, game) : { blocked: false, remainingDamage: amount };
        if (res && res.blocked) return res;
        if (this.legendary) res = this.legendary.interceptPlayerDamage(player, res.remainingDamage, effects, game);
        return res;
    }
    onBulletHit(bullet, targetEnemy, damageDealt, enemies, effects, game) {
        if (this.epic) this.epic.onBulletHit(bullet, targetEnemy, damageDealt, enemies, effects, game);
        if (this.legendary) this.legendary.onBulletHit(bullet, targetEnemy, damageDealt, enemies, effects, game);
        if (this.mythic) this.mythic.onBulletHit(bullet, targetEnemy, damageDealt, enemies, effects, game);
    }
    onCrateDestroyed(obs, game) { if (this.epic) this.epic.onCrateDestroyed(obs, game); }

    /**
     * Check if player has a specific perk equipped in their active 3 slots
     */
    static hasPerk(perkId) {
        if (typeof window === 'undefined' || !window.GameState || !window.GameState.player) return false;
        const equipped = window.GameState.player.equippedPerks;
        return Array.isArray(equipped) && equipped.includes(perkId);
    }

    /**
     * Resolve active rank stats for a perk (defaults safely to Rank 1 stats)
     */
    static getRankStats(perkId) {
        if (typeof window !== 'undefined' && window.GameState && typeof window.GameState.getPerkRankStats === 'function') {
            const st = window.GameState.getPerkRankStats(perkId);
            if (st) return st;
        }
        if (typeof PERKS_DATA !== 'undefined' && PERKS_DATA[perkId] && Array.isArray(PERKS_DATA[perkId].ranks) && PERKS_DATA[perkId].ranks[0]) {
            return PERKS_DATA[perkId].ranks[0].stats || {};
        }
        return {};
    }

    /**
     * Update active perk hazards, cooldowns, and status effects
     */
    update(dt = 1, game) {
        if (!game || !game.player) return;
        const player = game.player;

        // 1. Second Wind Cooldown & Active Speed Buff
        if (this.secondWindCooldown > 0) {
            this.secondWindCooldown -= dt;
        }

        if (player.secondWindSpeedTimer > 0) {
            player.secondWindSpeedTimer -= dt;
            if (game.effects && Math.random() < 0.3) {
                game.effects.addSparks(player.x, player.y, '#3498db', 2);
            }
        }

        // 2. Hot Foot: Spawn flame hazard when dashing
        if (PerkSystem.hasPerk('hot_foot') && player.isDashing) {
            this.flameSpawnTimer += dt;
            if (this.flameSpawnTimer >= 2.0) {
                this.flameSpawnTimer = 0;
                const hfStats = PerkSystem.getRankStats('hot_foot');
                const lifeFrames = Math.round((hfStats.durationSec || 2.0) * 60);
                this.flameTrails.push({
                    x: player.x,
                    y: player.y,
                    radius: hfStats.radius || 30,
                    life: lifeFrames,
                    maxLife: lifeFrames,
                    dps: (hfStats.dps || 35) / 60,
                    slowFactor: hfStats.slowFactor || 0.70
                });
                if (game.effects && Math.random() < 0.5) {
                    game.effects.addSparks(player.x, player.y, '#ff4757', 3);
                }
            }
        } else {
            this.flameSpawnTimer = 0;
        }

        // 3. Hot Foot: Update active flame trails & burn/slow enemies
        for (let i = this.flameTrails.length - 1; i >= 0; i--) {
            const flame = this.flameTrails[i];
            flame.life -= dt;
            if (flame.life <= 0) {
                this.flameTrails.splice(i, 1);
                continue;
            }

            // Check enemies within flame radius
            if (game.enemies && game.enemies.length > 0) {
                for (let ei = 0; ei < game.enemies.length; ei++) {
                    const e = game.enemies[ei];
                    if (e.dead || e.isDying) continue;

                    const dx = e.x - flame.x;
                    const dy = e.y - flame.y;
                    const distSq = dx * dx + dy * dy;
                    const totalRad = flame.radius + e.radius;

                    if (distSq < totalRad * totalRad) {
                        // Apply flame slow factor for 20 frames
                        e.slowTimer = Math.max(e.slowTimer || 0, 20);
                        e.slowFactor = flame.slowFactor || 0.70;

                        // Apply burn tick damage (playSound = false to prevent repetitive hitmarker clicks)
                        e.takeDamage(flame.dps * dt, null, false, false);

                        if (Math.random() < 0.12 * dt && game.effects) {
                            game.effects.addSparks(e.x, e.y, '#ff6b81', 2);
                        }
                    }
                }
            }
        }

        // 4. Counter-Blast: Update radial projectiles
        for (let i = this.counterProjectiles.length - 1; i >= 0; i--) {
            const cp = this.counterProjectiles[i];
            cp.x += cp.vx * dt;
            cp.y += cp.vy * dt;
            cp.life -= dt;

            // Check collision with enemies
            if (game.enemies) {
                for (let ei = 0; ei < game.enemies.length; ei++) {
                    const e = game.enemies[ei];
                    if (e.dead || e.isDying || cp.hitEnemies.has(e)) continue;

                    const dist = Math.hypot(e.x - cp.x, e.y - cp.y);
                    if (dist < cp.radius + e.radius) {
                        cp.hitEnemies.add(e);
                        e.takeDamage(cp.damage, game.effects, true);

                        // Push enemy away strongly (knockback)
                        const kb = cp.knockback || 36;
                        const pushAngle = Math.atan2(cp.vy, cp.vx);
                        e.x += Math.cos(pushAngle) * kb;
                        e.y += Math.sin(pushAngle) * kb;

                        if (game.effects) {
                            game.effects.addSparks(e.x, e.y, '#f39c12', 4);
                            game.effects.addComicSplash(e.x, e.y - 18, 'POW!');
                        }
                    }
                }
            }

            if (cp.life <= 0) {
                this.counterProjectiles.splice(i, 1);
            }
        }

        // 5. Last Laugh: Update ticking live mini-dynamite sticks
        for (let i = this.dynamites.length - 1; i >= 0; i--) {
            const d = this.dynamites[i];
            d.timer -= dt;

            // Flash sparks while fuse burns
            if (game.effects && Math.random() < 0.35 * dt) {
                game.effects.addSparks(d.x, d.y - 12, '#fed330', 2);
            }

            if (d.timer <= 0) {
                // Detonate dynamite!
                this.dynamites.splice(i, 1);

                if (window.soundEngine && typeof window.soundEngine.playTntExplosion === 'function') {
                    window.soundEngine.playTntExplosion();
                } else if (window.soundEngine && typeof window.soundEngine.playFatmirSlam === 'function') {
                    window.soundEngine.playFatmirSlam();
                }

                if (game.camera) {
                    game.camera.addShake(12);
                }

                if (game.effects) {
                    game.effects.addShockwave(d.x, d.y, 110, 'rgba(231, 76, 60, 0.9)');
                    game.effects.addComicSplash(d.x, d.y - 25, 'BOOM!');
                    game.effects.addSparks(d.x, d.y, '#e74c3c', 10);
                    game.effects.addSparks(d.x, d.y, '#f39c12', 8);
                    game.effects.addDust(d.x, d.y, 6, 12);
                }

                // AoE Damage & Knockback to nearby enemies
                if (game.enemies) {
                    const blastSq = d.radius * d.radius;
                    for (let ei = 0; ei < game.enemies.length; ei++) {
                        const e = game.enemies[ei];
                        if (e.dead || e.isDying) continue;

                        const dx = e.x - d.x;
                        const dy = e.y - d.y;
                        const distSq = dx * dx + dy * dy;

                        if (distSq <= blastSq) {
                            e.takeDamage(d.damage, game.effects, true);
                            const dist = Math.hypot(dx, dy) || 1;
                            e.x += (dx / dist) * 28;
                            e.y += (dy / dist) * 28;
                        }
                    }
                }
            }
        }

        if (this.epic) this.epic.update(dt, game);
        if (this.legendary) this.legendary.update(dt, game);
        if (this.mythic) this.mythic.update(dt, game);
    }

    /**
     * Triggered when player takes damage (handles Second Wind & Counter-Blast)
     */
    onPlayerDamage(player, amount, effects, camera, game) {
        if (!player) return;

        // --- Perk 2: Second Wind ---
        if (PerkSystem.hasPerk('second_wind')) {
            const swStats = PerkSystem.getRankStats('second_wind');
            const hpThreshold = player.maxHp * (swStats.hpThreshold || 0.25);
            if (player.hp <= hpThreshold && this.secondWindCooldown <= 0) {
                this.secondWindCooldown = Math.round((swStats.cooldownSec || 30) * 60);
                player.dashCooldown = 0; // Instant dash reset!
                player.secondWindSpeedTimer = Math.round((swStats.durationSec || 3.0) * 60);
                player.secondWindSpeedMult = swStats.speedMult || 1.25;

                if (window.soundEngine && typeof window.soundEngine.playPickup === 'function') {
                    window.soundEngine.playPickup('star');
                }
                if (effects) {
                    effects.addComicSplash(player.x, player.y - 35, '⚡ SECOND WIND!');
                    effects.addShockwave(player.x, player.y, 90, 'rgba(52, 152, 219, 0.85)');
                    effects.addSparks(player.x, player.y, '#3498db', 14);
                }
                if (typeof CoopCombatFx !== 'undefined') CoopCombatFx.relayRing(player, 90, 'rgba(52, 152, 219, 0.85)', '⚡ SECOND WIND!', '#3498db', 10);
            }
        }

        // --- Perk 3: Counter-Blast ---
        if (PerkSystem.hasPerk('counter_blast')) {
            const cbStats = PerkSystem.getRankStats('counter_blast');
            const projectileCount = cbStats.projectileCount || 8;
            const speed = 11;

            for (let i = 0; i < projectileCount; i++) {
                const angle = (i / projectileCount) * Math.PI * 2;
                this.counterProjectiles.push({
                    x: player.x,
                    y: player.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    radius: 12,
                    damage: cbStats.damage || 25,
                    knockback: cbStats.knockback || 36,
                    life: 22,
                    hitEnemies: new Set()
                });
            }

            if (effects) {
                effects.addShockwave(player.x, player.y, 85, 'rgba(230, 126, 34, 0.85)');
                effects.addComicSplash(player.x, player.y - 30, '💥 BLAST!');
            }
            if (typeof CoopCombatFx !== 'undefined') CoopCombatFx.relayRing(player, 85, 'rgba(230, 126, 34, 0.85)', '💥 BLAST!');
            if (window.soundEngine && typeof window.soundEngine.playHitmarker === 'function') {
                window.soundEngine.playHitmarker(true);
            }
        }

        if (this.epic) this.epic.onPlayerDamage(player, amount, effects, game);
        if (this.mythic) this.mythic.onPlayerDamage(player, amount, effects, camera, game);
    }

    /**
     * Compute bullet damage multiplier (handles Headhunter +25% execute bonus)
     */
    getDamageMultiplier(targetEnemy) {
        if (!targetEnemy || targetEnemy.dead) return 1.0;
        let mult = 1.0;

        if (PerkSystem.hasPerk('headhunter')) {
            const hhStats = PerkSystem.getRankStats('headhunter');
            const hpRatio = (targetEnemy.hp || 0) / (targetEnemy.maxHp || 100);
            if (hpRatio < (hhStats.hpThreshold || 0.35)) {
                mult *= (hhStats.damageMult || 1.25);
            }
        }
        if (this.legendary) mult *= this.legendary.getDamageMultiplier(targetEnemy);
        if (this.mythic) mult *= this.mythic.getDamageMultiplier(targetEnemy);
        return mult;
    }

    /**
     * Triggered on enemy defeat (handles Golden Touch gold pouch drops)
     */
    onEnemyKilled(enemy, game) {
        if (!enemy) return;

        // Track story/olympus boss defeats cleanly for combat feat unlocks
        if (!enemy._featRecorded && enemy.type && typeof PerkProgression !== 'undefined' && PerkProgression.BOSS_FEAT_LABELS[enemy.type]) {
            enemy._featRecorded = true;
            if (typeof window !== 'undefined' && window.GameState && typeof window.GameState.recordBossDefeat === 'function') {
                window.GameState.recordBossDefeat(enemy.type);
            }
        }

        if (!game || !game.drops) return;

        if (PerkSystem.hasPerk('golden_touch')) {
            const isBrute = enemy.type === 'fatmir' || enemy.type === 'casillas' || enemy.type === 'skarmogyftos' || enemy.type === 'kleanthis';
            if (isBrute) {
                const gtStats = PerkSystem.getRankStats('golden_touch');
                if (Math.random() < (gtStats.dropChance || 0.60)) {
                    const minC = gtStats.minCoins || 15;
                    const maxC = gtStats.maxCoins || 25;
                    const pouchCoins = Math.floor(Math.random() * (maxC - minC + 1)) + minC;
                    if (typeof Drop !== 'undefined') {
                        game.drops.push(new Drop(enemy.x, enemy.y, 'coin_pouch', pouchCoins));
                    }
                }
            }
        }

        // Perk 6: Last Laugh (chance on enemy defeat to drop live mini-dynamite)
        if (PerkSystem.hasPerk('last_laugh')) {
            const llStats = PerkSystem.getRankStats('last_laugh');
            if (Math.random() < (llStats.procChance || 0.20)) {
                this.dynamites.push({
                    x: enemy.x,
                    y: enemy.y,
                    timer: 60, // 1 second (60 frames)
                    maxTimer: 60,
                    radius: llStats.radius || 100,
                    damage: llStats.damage || 40
                });
                if (game.effects) {
                    game.effects.addSparks(enemy.x, enemy.y - 10, '#e74c3c', 4);
                }
            }
        }

        if (this.epic) this.epic.onEnemyKilled(enemy, game);
        if (this.legendary) this.legendary.onEnemyKilled(enemy, game);
        if (this.mythic) this.mythic.onEnemyKilled(enemy, game);
    }

    /**
     * Draw Hot Foot flame pools and Counter-Blast projectiles
     */
    draw(ctx, camera) {
        if (!ctx) return;

        // 1. Draw Hot Foot flame pools
        if (this.flameTrails.length > 0) {
            let flameDisc = PerkSystem._flameDisc;
            if (!flameDisc) {
                const c = document.createElement('canvas');
                c.width = 128;
                c.height = 128;
                const fctx = c.getContext('2d');
                if (fctx) {
                    const g = fctx.createRadialGradient(64, 64, 4, 64, 64, 64);
                    g.addColorStop(0, 'rgba(255, 230, 0, 0.85)');
                    g.addColorStop(0.45, 'rgba(255, 71, 87, 0.7)');
                    g.addColorStop(1, 'rgba(235, 77, 75, 0)');
                    fctx.fillStyle = g;
                    fctx.beginPath();
                    fctx.arc(64, 64, 64, 0, Math.PI * 2);
                    fctx.fill();
                    flameDisc = PerkSystem._flameDisc = c;
                }
            }
            const prevAlpha = ctx.globalAlpha;
            for (let i = 0; i < this.flameTrails.length; i++) {
                const f = this.flameTrails[i];
                const alpha = Math.min(1.0, f.life / (f.maxLife * 0.4));
                ctx.globalAlpha = prevAlpha * alpha;

                // Outer burning glow (cached radial disc)
                if (flameDisc) ctx.drawImage(flameDisc, f.x - f.radius, f.y - f.radius, f.radius * 2, f.radius * 2);

                // Inner flame tongue embers
                ctx.fillStyle = '#fffa65';
                ctx.beginPath();
                ctx.arc(f.x + (Math.sin(f.life * 0.2) * 6), f.y - 4, f.radius * 0.35, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = prevAlpha;
        }

        // 2. Draw Counter-Blast projectiles
        for (let i = 0; i < this.counterProjectiles.length; i++) {
            const cp = this.counterProjectiles[i];
            ctx.save();
            ctx.fillStyle = '#f39c12';
            ctx.strokeStyle = '#1b1b1b';
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.arc(cp.x, cp.y, cp.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // White core spark
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(cp.x, cp.y, cp.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        // 3. Draw Last Laugh mini-dynamite sticks
        for (let i = 0; i < this.dynamites.length; i++) {
            const d = this.dynamites[i];
            const flash = (Math.floor(d.timer / 6) % 2 === 0);

            ctx.save();
            ctx.translate(d.x, d.y);

            // Red dynamite body
            ctx.fillStyle = flash ? '#ff4757' : '#c0392b';
            ctx.strokeStyle = '#1b1b1b';
            ctx.lineWidth = 2;

            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(-7, -11, 14, 22, 3);
            } else {
                ctx.rect(-7, -11, 14, 22);
            }
            ctx.fill();
            ctx.stroke();

            // Dark center band
            ctx.fillStyle = '#2d3436';
            ctx.fillRect(-7, -3, 14, 6);

            // Fuse cord
            ctx.strokeStyle = '#d63031';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -11);
            ctx.quadraticCurveTo(3, -16, 2, -20);
            ctx.stroke();

            // Sizzling spark at tip of fuse
            ctx.fillStyle = flash ? '#fed330' : '#ffa502';
            ctx.beginPath();
            ctx.arc(2, -20, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        if (this.epic) {
            this.epic.draw(ctx, typeof window !== 'undefined' ? window.gameInstance : null);
        }
        if (this.legendary) {
            this.legendary.draw(ctx, typeof window !== 'undefined' ? window.gameInstance : null);
        }
        if (this.mythic) {
            this.mythic.draw(ctx, typeof window !== 'undefined' ? window.gameInstance : null);
        }
    }
}

// Global Singleton Instance
const perkSystemInstance = new PerkSystem();

if (typeof window !== 'undefined') {
    window.PerkSystem = PerkSystem;
    window.perkSystem = perkSystemInstance;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PerkSystem, perkSystemInstance };
}
