/**
 * Lesa.io - Endless Hard Mode Main Bosses (Wave 10 & Wave 20)
 * Feature detailed 4-stage entrance cutscenes, multi-phase transitions,
 * telegraphed hazards, and summon mechanics.
 */

class PlagueSovereign extends EndlessBossBase {
    constructor(x, y, waveMultiplier = 1.0, extra = {}) {
        super(x, y, 'plague_sovereign', waveMultiplier, {
            name: 'Malakor, Lord of Blight',
            hudLabel: extra.hudLabel || '☣️ MALAKOR, LORD OF BLIGHT [HARD BOSS] ☣️',
            isMiniBoss: false,
            bossRank: 'very_hard',
            rankColor: extra.rankColor || '#2ed573',
            crateId: extra.crateId || 'boss_crate_very_hard',
            radius: 48,
            baseHp: 3900,
            speed: 2.35,
            baseDmg: 38,
            xpDrop: 880,
            scoreValue: 2600,
            goldBonus: 720,
            xpBonus: 540
        });
        this.isHardMainBoss = true;
        this.cutsceneState = 'ARRIVAL';
        this.cutsceneTimer = 64;
        this.ringCooldown = 140;
        this.helixCooldown = 95;
        this.helixShots = 0;
        this.regenCooldown = 280;
        this._acidZones = [];
        this.covenTriggered = false;
    }

    takeDamage(amount, effects = null, fromCrit = null, playSound = true) {
        if (this.cutsceneState !== 'COMBAT') {
            if (effects && Math.random() < 0.35) effects.addSparks(this.x, this.y, '#2ed573', 3);
            return false;
        }
        return super.takeDamage(amount, effects, fromCrit, playSound);
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        if (this.cutsceneState !== 'COMBAT' && typeof HardBossEntranceFX !== 'undefined') {
            HardBossEntranceFX.updateMainBossCutscene(this, dt, player, effects, {
                subText: 'HARD WAVE 10 • MAIN BOSS AWAKENING',
                speaker: 'MALAKOR, LORD OF BLIGHT',
                avatar: '☣️',
                color: '#2ed573',
                shockColor: 'rgba(46, 213, 115, 0.94)',
                line1: 'YOU DARE TREAD UPON THE BLIGHTED SANCTUM? LET THE CORRUPTION CONSUME YOU!',
                surgeSub: 'MALAKOR IGNITES THE CAULDRONS OF ROT...',
                line2: 'WITNESS MY ALCHEMICAL REIGN — ROT IN EMERALD FIRE!'
            });
            return;
        }

        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        this.updateTelegraphs(dt, player, effects);
        this._tickAcidZones(dt, player, effects);
        if (!player || player.hp <= 0) return;

        // Coven Summon under 72% HP
        if (!this.covenTriggered && this.hp <= this.maxHp * 0.72) {
            this.covenTriggered = true;
            if (typeof VoidAcolyte === 'function') {
                enemies.push(new VoidAcolyte(this.x - 105, this.y + 45, this.waveMultiplier * 0.85));
                enemies.push(new VoidAcolyte(this.x + 105, this.y - 45, this.waveMultiplier * 0.85));
            }
            if (effects) effects.addComicSplash(this.x, this.y - 54, 'COVEN RISES! 🔮', '#2ed573');
        }

        // Phase 2 Sovereign Rot under 50% HP
        if (this.checkEnrage(0.50, effects, '☣️ SOVEREIGN ROT ASCENSION! ☣️', 1.30, 'rgba(190, 242, 100, 0.95)')) {
            for (let k = 0; k < 12; k++) this.fireFan(bullets, (k / 12) * Math.PI * 2, [0], 9.4, Math.round(this.damage * 0.78), 10, 'bio_acid');
        }

        const dx = player.x - this.x, dy = player.y - this.y, dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);
        if (this.ringCooldown > 0) this.ringCooldown -= dt;
        if (this.helixCooldown > 0) this.helixCooldown -= dt;
        if (this.regenCooldown > 0) this.regenCooldown -= dt;

        if (this.ringCooldown <= 0) {
            this.ringCooldown = this.isEnraged ? 120 : 165;
            for (const [ox, oy] of [[0, 0], [115, 0], [-115, 0], [0, 115]]) {
                const tx = player.x + ox, ty = player.y + oy;
                this.addTelegraph(tx, ty, 78, 48, Math.round(this.damage * 1.10), '☣️', 'rgba(46, 213, 115, 0.94)', 'venom_rune', '#bef264');
                if (this._acidZones.length < 6) this._acidZones.push({ x: tx, y: ty, radius: 68, life: 250, tick: 30 });
            }
        }

        if (this.helixShots > 0 && Math.floor(this.age) % 6 === 0) {
            this.helixShots--;
            const spin = this.age * 0.25;
            this.fireFan(bullets, spin, [0, Math.PI], 10.2, Math.round(this.damage * 0.72), 9, 'bio_acid');
        } else if (this.helixCooldown <= 0) {
            this.helixCooldown = this.isEnraged ? 115 : 155;
            this.helixShots = this.isEnraged ? 14 : 9;
        }

        if (this.isEnraged && this.regenCooldown <= 0) {
            this.regenCooldown = 270;
            const heal = Math.round(this.maxHp * 0.04);
            this.hp = Math.min(this.maxHp, this.hp + heal);
            if (effects) effects.addPopup(this.x, this.y - 52, `+${heal} ☣️`, '#bef264', 20, true);
        }

        this.moveTowards(dt, dx, dy, dist, 230, arena);
    }

    _tickAcidZones(dt, player, effects) {
        for (let i = this._acidZones.length - 1; i >= 0; i--) {
            const z = this._acidZones[i];
            z.life -= dt; z.tick -= dt;
            if (z.tick <= 0) {
                z.tick = 28;
                if (player && Math.hypot(player.x - z.x, player.y - z.y) <= z.radius && player.invulnerableTimer <= 0) {
                    player.takeDamage(Math.max(10, Math.round(this.damage * 0.38)), effects);
                }
            }
            if (z.life <= 0) this._acidZones.splice(i, 1);
        }
    }

    draw(ctx) {
        if (typeof PlagueSovereignRenderer !== 'undefined') PlagueSovereignRenderer.draw(ctx, this);
    }
}

class AbyssalSeraph extends EndlessBossBase {
    constructor(x, y, waveMultiplier = 1.0, extra = {}) {
        super(x, y, 'abyssal_seraph', waveMultiplier, {
            name: 'Vaelor, Blood Eclipse Seraph',
            hudLabel: extra.hudLabel || '⚔️ VAELOR, ECLIPSE SERAPH [HARD BOSS] ⚔️',
            isMiniBoss: false,
            bossRank: 'very_hard',
            rankColor: extra.rankColor || '#fed330',
            crateId: extra.crateId || 'boss_crate_very_hard',
            radius: 50,
            baseHp: 5600,
            speed: 2.75,
            baseDmg: 42,
            xpDrop: 1200,
            scoreValue: 3600,
            goldBonus: 980,
            xpBonus: 760
        });
        this.isHardMainBoss = true;
        this.cutsceneState = 'ARRIVAL';
        this.cutsceneTimer = 68;
        this.beamCooldown = 140;
        this.fanCooldown = 92;
        this.dashCooldown = 195;
        this.dashTimer = 0;
        this.dashAngle = 0;
        this._beams = [];
        this.summoned = false;
        this.isCritical = false;
    }

    takeDamage(amount, effects = null, fromCrit = null, playSound = true) {
        if (this.cutsceneState !== 'COMBAT') {
            if (effects && Math.random() < 0.35) effects.addSparks(this.x, this.y, '#fed330', 3);
            return false;
        }
        return super.takeDamage(amount, effects, fromCrit, playSound);
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        if (this.cutsceneState !== 'COMBAT' && typeof HardBossEntranceFX !== 'undefined') {
            HardBossEntranceFX.updateMainBossCutscene(this, dt, player, effects, {
                subText: 'HARD WAVE 20 • APEX SERAPH DESCENT',
                speaker: 'VAELOR, BLOOD ECLIPSE SERAPH',
                avatar: '⚔️',
                color: '#fed330',
                shockColor: 'rgba(255, 46, 76, 0.94)',
                line1: 'MORTAL SPARTAN... YOUR PATH ENDS BENEATH THE CRIMSON ECLIPSE!',
                surgeSub: 'THREE SOLAR HALOS IGNITE WITH BLOOD FIRE...',
                line2: 'KNEEL BEFORE THE SUN THAT BLEEDS — NO ESCAPE FROM THE ABYSS!'
            });
            return;
        }

        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        this.updateTelegraphs(dt, player, effects);
        this._tickBeams(dt, player, effects);
        if (!player || player.hp <= 0) return;

        // Phase 2 Eclipse Ascension <= 60% HP
        if (this.checkEnrage(0.60, effects, '☀️ ECLIPSE ASCENSION! ☀️', 1.32, 'rgba(254, 211, 48, 0.95)') && !this.summoned) {
            this.summoned = true;
            if (typeof CrimsonWraith === 'function') enemies.push(new CrimsonWraith(this.x - 110, this.y, this.waveMultiplier * 0.9));
            if (typeof EclipseHarbinger === 'function') enemies.push(new EclipseHarbinger(this.x + 110, this.y, this.waveMultiplier * 0.9));
        }

        // Phase 3 Blood Sun Supernova <= 28% HP
        if (!this.isCritical && this.hp <= this.maxHp * 0.28) {
            this.isCritical = true;
            this.speed = this.baseSpeed * 1.48;
            this.addTelegraph(player.x, player.y, 175, 58, Math.round(this.damage * 1.35), '☄️', 'rgba(255, 46, 76, 0.96)', 'orbital_nuke', '#fed330');
            if (effects) effects.addComicSplash(this.x, this.y - 62, '🩸 BLOOD SUN SUPERNOVA! 🩸', '#ff2e4c');
        }

        const dx = player.x - this.x, dy = player.y - this.y, dist = Math.hypot(dx, dy) || 1;
        if (this.dashTimer > 0) {
            this.dashTimer -= dt;
            this.x += Math.cos(this.dashAngle) * 14.2 * dt;
            this.y += Math.sin(this.dashAngle) * 14.2 * dt;
            if (Math.floor(this.dashTimer) % 5 === 0) this.fireFan(bullets, this.dashAngle + Math.PI, [-0.5, 0.5], 8.5, Math.round(this.damage * 0.70), 11, 'crimson_slash');
            this.applyArenaBounds(arena);
            return;
        }

        this.angle = Math.atan2(dy, dx);
        if (this.beamCooldown > 0) this.beamCooldown -= dt;
        if (this.fanCooldown > 0) this.fanCooldown -= dt;
        if (this.dashCooldown > 0) this.dashCooldown -= dt;

        // 1. Judgment Beams (2 lines -> 4 star lines in Phase 2+)
        if (this.beamCooldown <= 0 && this._beams.length === 0) {
            this.beamCooldown = this.isCritical ? 120 : (this.isEnraged ? 155 : 195);
            const angles = this.isEnraged ? [this.angle, this.angle + Math.PI * 0.5, this.angle + 0.45, this.angle - 0.45] : [this.angle, this.angle + Math.PI * 0.5];
            for (const ang of angles) this._beams.push({ x: player.x, y: player.y, ang, timer: 44, maxTimer: 44, activeTimer: 0 });
        }

        // 2. Seraph Crescent Fan
        if (this.fanCooldown <= 0) {
            this.fanCooldown = this.isCritical ? 54 : (this.isEnraged ? 72 : 95);
            const spread = this.isEnraged ? [-0.48, -0.32, -0.16, 0, 0.16, 0.32, 0.48] : [-0.36, -0.18, 0, 0.18, 0.36];
            this.fireFan(bullets, this.angle, spread, 12.2, Math.round(this.damage * 0.85), 11, 'eclipse_glaive');
        }

        if (this.dashCooldown <= 0 && dist < 480) {
            this.dashCooldown = this.isEnraged ? 155 : 210;
            this.dashTimer = 22;
            this.dashAngle = this.angle;
            return;
        }
        this.moveTowards(dt, dx, dy, dist, 200, arena);
    }

    _tickBeams(dt, player, effects) {
        for (let i = this._beams.length - 1; i >= 0; i--) {
            const bm = this._beams[i];
            if (bm.timer > 0) {
                bm.timer -= dt;
                if (bm.timer <= 0) {
                    bm.activeTimer = 16;
                    if (effects) effects.addShockwave(bm.x, bm.y, 90, 'rgba(255, 46, 76, 0.88)');
                }
            } else {
                bm.activeTimer -= dt;
                if (player && player.invulnerableTimer <= 0) {
                    // Perpendicular point-to-line distance along beam
                    const d = Math.abs((player.x - bm.x) * -Math.sin(bm.ang) + (player.y - bm.y) * Math.cos(bm.ang));
                    if (d <= 28) player.takeDamage(Math.round(this.damage * 1.15), effects);
                }
                if (bm.activeTimer <= 0) this._beams.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        if (typeof AbyssalSeraphRenderer !== 'undefined') AbyssalSeraphRenderer.draw(ctx, this);
    }
}

if (typeof window !== 'undefined') {
    window.PlagueSovereign = PlagueSovereign;
    window.AbyssalSeraph = AbyssalSeraph;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { PlagueSovereign, AbyssalSeraph };
