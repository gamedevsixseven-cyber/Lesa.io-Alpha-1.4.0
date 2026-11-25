/**
 * Lesa.io - Endless Hard Mode Wave 50 Main Boss
 * "Kronarch, Weaver of Fractured Time" — 4-stage Main Boss entrance cutscene,
 * Golden Rewind Anchor Blink + Delayed Future X-Slash, Drifting Stasis Time-Bubbles,
 * 12-Tick Clock-Hand Sweeper, and Phase 3 Paradox Detonation Marks.
 */

class AstralChronoReaver extends EndlessBossBase {
    constructor(x, y, waveMultiplier = 1.0, extra = {}) {
        super(x, y, 'chrono_reaver', waveMultiplier, {
            name: 'Kronarch, Time Weaver',
            hudLabel: extra.hudLabel || '⌛ KRONARCH, TIME WEAVER [HARD BOSS] ⌛',
            isMiniBoss: false,
            bossRank: 'insane',
            rankColor: extra.rankColor || '#2ed573',
            crateId: extra.crateId || 'boss_crate_insane',
            radius: 54,
            baseHp: 13800,
            speed: 2.90,
            baseDmg: 58,
            xpDrop: 2100,
            scoreValue: 6800,
            goldBonus: 1750,
            xpBonus: 1350
        });
        this.isHardMainBoss = true;
        this.cutsceneState = 'ARRIVAL';
        this.cutsceneTimer = 68;

        this.bubbleCooldown = 145;
        this.rewindCooldown = 185;
        this.clockCooldown = 115;
        this.paradoxCooldown = 135;

        this._timeZones = [];
        this._rewindAnchor = null;
        this._chronoSlashes = [];
        this._clockSweep = null;
        this._paradoxMarks = [];
        this.phase2Triggered = false;
        this.phase3Triggered = false;
    }

    takeDamage(amount, effects = null, fromCrit = null, playSound = true) {
        if (this.cutsceneState !== 'COMBAT') {
            if (effects && Math.random() < 0.35) effects.addSparks(this.x, this.y, '#00f5ff', 3);
            return false;
        }
        return super.takeDamage(amount, effects, fromCrit, playSound);
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        if (this.cutsceneState !== 'COMBAT' && typeof HardBossEntranceFX !== 'undefined') {
            HardBossEntranceFX.updateMainBossCutscene(this, dt, player, effects, {
                subText: 'HARD WAVE 50 • FRACTURED HOROLOGIUM CITADEL',
                speaker: 'KRONARCH, WEAVER OF FRACTURED TIME',
                avatar: '⌛',
                color: '#2ed573',
                shockColor: 'rgba(46, 213, 115, 0.94)',
                line1: 'FIFTY WAVES ALREADY... EVERY SECOND YOU FIGHT BELONGS TO MY HOURGLASS!',
                surgeSub: 'TWELVE ASTRAL CLOCK GEARS ALIGN INTO PARADOX...',
                line2: 'PAST AND FUTURE COLLIDE — YOUR TIMELINE ENDS AT ZERO!'
            });
            return;
        }

        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        this.updateTelegraphs(dt, player, effects);
        this._tickTimeZones(dt, player, effects);
        this._tickRewindAndSlashes(dt, player, effects);
        this._tickClockSweep(dt, bullets);
        this._tickParadoxMarks(dt, player, effects);
        if (!player || player.hp <= 0) return;

        // Phase 2 <= 55% HP: Paradox Escorts + Enrage
        if (!this.phase2Triggered && this.checkEnrage(0.55, effects, '⌛ PARADOX ENGINE OVERCLOCK! ⌛', 1.30, 'rgba(0, 245, 255, 0.96)')) {
            this.phase2Triggered = true;
            if (typeof CryoSniper === 'function') enemies.push(new CryoSniper(this.x - 115, this.y + 45, this.waveMultiplier * 0.85));
            if (typeof VoidAcolyte === 'function') enemies.push(new VoidAcolyte(this.x + 115, this.y - 45, this.waveMultiplier * 0.85));
        }

        // Phase 3 <= 28% HP: Fracture Critical Speed + Instant Stasis Implosion Surge
        if (!this.phase3Triggered && this.hp <= this.maxHp * 0.28) {
            this.phase3Triggered = true;
            this.speed = this.baseSpeed * 1.45;
            if (effects) effects.addComicSplash(this.x, this.y - 58, '⚡ CHRONO PARADOX PROTOCOL! ⚡', '#00f5ff');
        }

        const dx = player.x - this.x, dy = player.y - this.y, dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);
        if (this.bubbleCooldown > 0) this.bubbleCooldown -= dt;
        if (this.rewindCooldown > 0) this.rewindCooldown -= dt;
        if (this.clockCooldown > 0) this.clockCooldown -= dt;
        if (this.paradoxCooldown > 0) this.paradoxCooldown -= dt;

        // 1. Drifting Temporal Stasis Bubbles (slow inside + implosion blast)
        if (this.bubbleCooldown <= 0 && this._timeZones.length < 4) {
            this.bubbleCooldown = this.isEnraged ? 135 : 175;
            for (let i = 0; i < 3; i++) {
                const a = (i / 3) * Math.PI * 2 + this.age * 0.04;
                this._timeZones.push({
                    x: player.x + Math.cos(a) * 155,
                    y: player.y + Math.sin(a) * 155,
                    vx: Math.cos(a + Math.PI * 0.72) * 1.65,
                    vy: Math.sin(a + Math.PI * 0.72) * 1.65,
                    radius: 102,
                    life: 165,
                    implodeAt: 42
                });
            }
        }

        // 2. Chrono Rewind Anchor -> Aggressive Lunge -> Snap Rewind + Future X-Slash
        if (this.rewindCooldown <= 0 && !this._rewindAnchor) {
            this.rewindCooldown = this.isEnraged ? 165 : 215;
            this._rewindAnchor = { x: this.x, y: this.y, timer: 82 };
            if (effects) effects.addComicSplash(this.x, this.y - 54, '⏪ ANCHOR SET!', '#fed330');
        }

        // 3. 12-Tick Clockwork Sweeper (Single Hand -> Dual Counter-Rotating Hands in Phase 2+)
        if (this.clockCooldown <= 0 && !this._clockSweep) {
            this.clockCooldown = this.isEnraged ? 105 : 140;
            this._clockSweep = { ang: this.angle, ticksLeft: 12, tickCd: 1, dual: this.isEnraged };
        }

        // 4. Phase 3 Trailing Paradox Detonation Silos along player path
        if (this.phase3Triggered && this.paradoxCooldown <= 0) {
            this.paradoxCooldown = 120;
            for (const lead of [8, 22]) {
                this._paradoxMarks.push({
                    x: player.x + (player.vx || 0) * lead,
                    y: player.y + (player.vy || 0) * lead,
                    radius: 92, timer: 46, maxTimer: 46
                });
            }
        }

        const pace = this._rewindAnchor ? 1.48 : 1.0;
        this.moveTowards(dt * pace, dx, dy, dist, this._rewindAnchor ? 120 : 240, arena);
    }

    _tickTimeZones(dt, player, effects) {
        for (let i = this._timeZones.length - 1; i >= 0; i--) {
            const tz = this._timeZones[i];
            tz.life -= dt;
            tz.x += tz.vx * dt; tz.y += tz.vy * dt;
            if (player && player.hp > 0) {
                const dx = tz.x - player.x, dy = tz.y - player.y, d = Math.hypot(dx, dy) || 1;
                if (d < tz.radius) {
                    // Damping pull mimics sluggish distorted time while inside the stasis sphere
                    player.x += (dx / d) * (tz.life <= tz.implodeAt ? 2.1 : 0.75) * dt;
                    player.y += (dy / d) * (tz.life <= tz.implodeAt ? 2.1 : 0.75) * dt;
                }
            }
            if (tz.life <= 0) {
                if (effects) effects.addShockwave(tz.x, tz.y, 110, 'rgba(0, 245, 255, 0.92)');
                if (player && player.invulnerableTimer <= 0 && Math.hypot(player.x - tz.x, player.y - tz.y) <= tz.radius * 0.72) {
                    player.takeDamage(Math.round(this.damage * 1.12), effects);
                }
                this._timeZones.splice(i, 1);
            }
        }
    }

    _tickRewindAndSlashes(dt, player, effects) {
        if (this._rewindAnchor) {
            this._rewindAnchor.timer -= dt;
            if (this._rewindAnchor.timer <= 0) {
                const futureX = this.x, futureY = this.y;
                if (effects) {
                    effects.addLightningChain(futureX, futureY, this._rewindAnchor.x, this._rewindAnchor.y, '#fed330');
                    effects.addShockwave(this._rewindAnchor.x, this._rewindAnchor.y, 130, 'rgba(46, 213, 115, 0.92)');
                    effects.addComicSplash(this._rewindAnchor.x, this._rewindAnchor.y - 50, '⏪ TIME REWOUND!', '#00f5ff');
                }
                this.x = this._rewindAnchor.x;
                this.y = this._rewindAnchor.y;
                this._chronoSlashes.push({ x: futureX, y: futureY, rot: Math.PI * 0.25, timer: 34, active: 14, hit: false });
                this._rewindAnchor = null;
            }
        }
        for (let i = this._chronoSlashes.length - 1; i >= 0; i--) {
            const cs = this._chronoSlashes[i];
            if (cs.timer > 0) cs.timer -= dt;
            else {
                cs.active -= dt;
                if (!cs.hit && player && player.invulnerableTimer <= 0) {
                    for (const baseAng of [cs.rot, cs.rot + Math.PI * 0.5]) {
                        const vx = Math.cos(baseAng), vy = Math.sin(baseAng);
                        const px = player.x - cs.x, py = player.y - cs.y;
                        const along = Math.abs(px * vx + py * vy), perp = Math.abs(px * -vy + py * vx);
                        if (along <= 155 && perp <= 20) {
                            cs.hit = true;
                            player.takeDamage(Math.round(this.damage * 1.20), effects);
                            break;
                        }
                    }
                }
                if (cs.active <= 0) this._chronoSlashes.splice(i, 1);
            }
        }
    }

    _tickClockSweep(dt, bullets) {
        if (!this._clockSweep || typeof Bullet === 'undefined') return;
        this._clockSweep.tickCd -= dt;
        while (this._clockSweep && this._clockSweep.tickCd <= 0 && this._clockSweep.ticksLeft > 0) {
            this._clockSweep.tickCd += 5;
            this._clockSweep.ticksLeft--;
            const a1 = this._clockSweep.ang;
            this.fireFan(bullets, a1, [0], 11.4, Math.round(this.damage * 0.82), 10, 'boreas_frost_round');
            if (this._clockSweep.dual) {
                this.fireFan(bullets, -a1, [0], 12.2, Math.round(this.damage * 0.78), 10, 'void_orb');
            }
            this._clockSweep.ang += Math.PI / 6;
            if (this._clockSweep.ticksLeft <= 0) this._clockSweep = null;
        }
    }

    _tickParadoxMarks(dt, player, effects) {
        for (let i = this._paradoxMarks.length - 1; i >= 0; i--) {
            const pm = this._paradoxMarks[i];
            pm.timer -= dt;
            if (pm.timer <= 0) {
                if (effects) effects.addShockwave(pm.x, pm.y, pm.radius, 'rgba(0, 245, 255, 0.95)');
                if (player && player.invulnerableTimer <= 0 && Math.hypot(player.x - pm.x, player.y - pm.y) <= pm.radius) {
                    player.takeDamage(Math.round(this.damage * 1.15), effects);
                }
                this._paradoxMarks.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        if (typeof W50ChronoReaverRenderer !== 'undefined') W50ChronoReaverRenderer.draw(ctx, this);
    }
}

if (typeof window !== 'undefined') window.AstralChronoReaver = AstralChronoReaver;
if (typeof module !== 'undefined' && module.exports) module.exports = { AstralChronoReaver };
