/**
 * Lesa.io - Endless Hard Mode Mini-Bosses (Wave 5 & Wave 15)
 * No entrance cutscenes; tough multi-ability Mini-Boss fights with telegraphs.
 */

class CrimsonExecutioner extends EndlessBossBase {
    constructor(x, y, waveMultiplier = 1.0, extra = {}) {
        super(x, y, 'crimson_executioner', waveMultiplier, {
            name: 'Malkor Executioner',
            hudLabel: extra.hudLabel || '🩸 MALKOR EXECUTIONER [HARD MINI] 🩸',
            isMiniBoss: true,
            bossRank: 'hard',
            rankColor: extra.rankColor || '#ff4757',
            crateId: extra.crateId || 'boss_crate_hard',
            radius: 40,
            baseHp: 2150,
            speed: 2.75,
            baseDmg: 35,
            xpDrop: 460,
            scoreValue: 1350,
            goldBonus: 420,
            xpBonus: 310
        });
        this.slashCooldown = 90;
        this.leapCooldown = 175;
        this.whirlCooldown = 230;
        this.whirlTimer = 0;
        this.leapTarget = null;
        this.leapOrigin = null;
        this.leapProg = 0;
        this.summoned = false;
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        this.updateTelegraphs(dt, player, effects);
        if (!player || player.hp <= 0) return;

        if (this.checkEnrage(0.55, effects, '🩸 BLOODLUST ENRAGE! 🩸', 1.30, 'rgba(255, 46, 76, 0.94)') && !this.summoned) {
            this.summoned = true;
            if (typeof Fatmir === 'function') {
                enemies.push(new Fatmir(this.x - 85, this.y, this.waveMultiplier * 0.9, { isCrimson: true }));
                enemies.push(new Fatmir(this.x + 85, this.y, this.waveMultiplier * 0.9, { isCrimson: true }));
            }
        }

        // 1. Guillotine Leap Airborne Phase
        if (this.leapTarget) {
            this.leapProg += (this.isEnraged ? 0.032 : 0.025) * dt;
            const u = Math.min(1, this.leapProg);
            this.x = this.leapOrigin.x + (this.leapTarget.x - this.leapOrigin.x) * u;
            this.y = this.leapOrigin.y + (this.leapTarget.y - this.leapOrigin.y) * u;
            this.isAirborne = u > 0.1 && u < 0.92;
            this.isAirborneImmune = this.isAirborne;
            if (u >= 1) {
                this.isAirborne = false; this.isAirborneImmune = false;
                if (effects) {
                    effects.addShockwave(this.x, this.y, 165, 'rgba(255, 46, 76, 0.95)');
                    effects.addComicSplash(this.x, this.y - 45, 'GUILLOTINE SLAM! 🩸', '#ff2e4c');
                }
                if (Math.hypot(player.x - this.x, player.y - this.y) <= 155 && player.invulnerableTimer <= 0) {
                    player.takeDamage(Math.round(this.damage * 1.25), effects);
                }
                for (let k = 0; k < 8; k++) this.fireFan(bullets, (k / 8) * Math.PI * 2, [0], 10.2, Math.round(this.damage * 0.72), 11, 'crimson_slash');
                this.leapTarget = null; this.leapOrigin = null;
                this.leapCooldown = this.isEnraged ? 135 : 195;
            }
            return;
        }

        const dx = player.x - this.x, dy = player.y - this.y, dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);
        if (this.slashCooldown > 0) this.slashCooldown -= dt;
        if (this.leapCooldown > 0) this.leapCooldown -= dt;
        if (this.whirlCooldown > 0) this.whirlCooldown -= dt;

        if (this.whirlTimer > 0) {
            this.whirlTimer -= dt;
            if (Math.floor(this.whirlTimer) % 12 === 0) {
                this.fireFan(bullets, this.age * 0.45, [0, Math.PI], 10.6, Math.round(this.damage * 0.78), 11, 'crimson_slash');
            }
            this.moveTowards(dt * 1.35, dx, dy, dist, 60, arena);
            return;
        }

        if (this.leapCooldown <= 0 && dist < 440) {
            this.leapOrigin = { x: this.x, y: this.y };
            this.leapTarget = { x: player.x, y: player.y };
            this.leapProg = 0;
            return;
        }
        if (this.whirlCooldown <= 0 && dist < 240) {
            this.whirlTimer = 46;
            this.whirlCooldown = this.isEnraged ? 150 : 210;
            return;
        }
        if (this.slashCooldown <= 0) {
            this.slashCooldown = this.isEnraged ? 62 : 90;
            this.fireFan(bullets, this.angle, [-0.28, 0, 0.28], 11.4, Math.round(this.damage * 0.85), 11, 'crimson_slash');
        }
        this.moveTowards(dt, dx, dy, dist, 110, arena);
    }

    draw(ctx) {
        if (typeof HardMiniBossRenderers !== 'undefined') HardMiniBossRenderers.drawExecutioner(ctx, this);
    }
}

class ChronoWarden extends EndlessBossBase {
    constructor(x, y, waveMultiplier = 1.0, extra = {}) {
        super(x, y, 'chrono_warden', waveMultiplier, {
            name: 'Kaelos Chrono Warden',
            hudLabel: extra.hudLabel || '⏳ KAELOS WARDEN [HARD MINI] ⏳',
            isMiniBoss: true,
            bossRank: 'very_hard',
            rankColor: extra.rankColor || '#38bdf8',
            crateId: extra.crateId || 'boss_crate_very_hard',
            radius: 40,
            baseHp: 2850,
            speed: 2.85,
            baseDmg: 38,
            xpDrop: 620,
            scoreValue: 1850,
            goldBonus: 580,
            xpBonus: 420
        });
        this.blinkCooldown = 140;
        this.wellCooldown = 175;
        this.burstCooldown = 95;
        this._echoes = [];
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        this.updateTelegraphs(dt, player, effects);
        this._tickEchoes(dt, player, bullets);
        if (!player || player.hp <= 0) return;

        this.checkEnrage(0.5, effects, '⏳ TEMPORAL OVERCLOCK! ⏳', 1.28, 'rgba(56, 189, 248, 0.94)');
        const dx = player.x - this.x, dy = player.y - this.y, dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);
        if (this.blinkCooldown > 0) this.blinkCooldown -= dt;
        if (this.wellCooldown > 0) this.wellCooldown -= dt;
        if (this.burstCooldown > 0) this.burstCooldown -= dt;

        // 1. Temporal Blink + Leaving Armed Mirage Echo
        if (this.blinkCooldown <= 0) {
            this.blinkCooldown = this.isEnraged ? 120 : 165;
            this._echoes.push({ x: this.x, y: this.y, ang: this.angle, aiming: 32, life: 85 });
            if (effects) effects.addShockwave(this.x, this.y, 120, 'rgba(56, 189, 248, 0.85)');
            const flank = this.angle + (Math.random() < 0.5 ? 1 : -1) * 1.35;
            this.x = player.x + Math.cos(flank) * 260;
            this.y = player.y + Math.sin(flank) * 260;
            this.applyArenaBounds(arena);
        }

        // 2. Twin Stasis Gravity Wells
        if (this.wellCooldown <= 0) {
            this.wellCooldown = this.isEnraged ? 135 : 180;
            this.addTelegraph(player.x, player.y, 92, 46, Math.round(this.damage * 1.15), '⏳', 'rgba(56, 189, 248, 0.95)', 'frost_prism', '#00f5ff');
            this.addTelegraph(player.x + (player.vx || 0) * 18, player.y + (player.vy || 0) * 18, 84, 46, Math.round(this.damage * 1.05), '⏳', 'rgba(234, 179, 8, 0.95)', 'frost_prism', '#fed330');
        }

        if (this.burstCooldown <= 0) {
            this.burstCooldown = this.isEnraged ? 62 : 92;
            const fan = this.isEnraged ? [-0.36, -0.18, 0, 0.18, 0.36] : [-0.24, 0, 0.24];
            this.fireFan(bullets, this.angle, fan, 12.2, Math.round(this.damage * 0.85), 9, 'tempest_bolt');
        }
        this.moveTowards(dt, dx, dy, dist, 240, arena);
    }

    _tickEchoes(dt, player, bullets) {
        for (let i = this._echoes.length - 1; i >= 0; i--) {
            const ec = this._echoes[i];
            ec.life -= dt;
            if (ec.aiming > 0) {
                ec.aiming -= dt;
                if (player) ec.ang = Math.atan2(player.y - ec.y, player.x - ec.x);
                if (ec.aiming <= 0 && typeof Bullet !== 'undefined') {
                    bullets.push(new Bullet({
                        x: ec.x, y: ec.y, vx: Math.cos(ec.ang) * 13.5, vy: Math.sin(ec.ang) * 13.5,
                        damage: Math.max(15, Math.round(this.damage * 0.78)),
                        speed: 13.5, radius: 9, type: 'tempest_bolt', isEnemy: true, range: 640
                    }));
                }
            }
            if (ec.life <= 0) this._echoes.splice(i, 1);
        }
    }

    draw(ctx) {
        if (typeof HardMiniBossRenderers !== 'undefined') HardMiniBossRenderers.drawChronoWarden(ctx, this);
    }
}

if (typeof window !== 'undefined') {
    window.CrimsonExecutioner = CrimsonExecutioner;
    window.ChronoWarden = ChronoWarden;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { CrimsonExecutioner, ChronoWarden };
