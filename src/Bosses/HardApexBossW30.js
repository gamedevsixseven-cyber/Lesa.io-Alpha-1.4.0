/**
 * Lesa.io - Wave 30 Apex Boss: "Alpha, Sovereign of Ruin"
 * First Hard-Mode APEX BOSS (`isApexBoss: true`, `bossRank: 'apex'`).
 * Uses 5-stage Reality-Shatter entrance ritual, 3 multi-mechanics combat phases
 * (Pylon Laser Stars, Singularity Pull Collapse, Halberd Dash, Meteor Barrage),
 * and the exclusive screen-top ApexBossHUD health bar.
 */

class OblivionEngine extends EndlessBossBase {
    constructor(x, y, waveMultiplier = 1.0, extra = {}) {
        super(x, y, 'apex_sovereign_w30', waveMultiplier, {
            name: 'Alpha, Sovereign of Ruin',
            hudLabel: extra.hudLabel || '👑 ALPHA [APEX BOSS] 👑',
            isMiniBoss: false,
            bossRank: 'apex',
            rankColor: extra.rankColor || '#ff2e4c',
            crateId: extra.crateId || 'boss_crate_insane',
            isApex: true,
            radius: 56,
            baseHp: 43844,
            speed: 3.25,
            baseDmg: 64,
            xpDrop: 2400,
            scoreValue: 9500,
            goldBonus: 2100,
            xpBonus: 1500
        });
        this.isHardMainBoss = true;
        this.isApexBoss = true;
        this.fixedHardHp = 1500000;
        this.apexTitle = 'Alpha, Sovereign of Ruin';
        this.apexBadgeText = '👑 W30 APEX BOSS';
        this.phaseNotches = [0.65, 0.50, 0.30];
        this.phase = 1;
        this.phaseLabel = 'PHASE I • PYLON DOMINION';

        this.cutsceneState = 'RIFT_OPEN';
        this.cutsceneTimer = 54;
        this.entranceDropY = 260;

        this.starCooldown = 95;
        this.gravCooldown = 135;
        this.dashCooldown = 155;
        this.volleyCooldown = 64;
        this.meteorCooldown = 170;
        this.attackRange = 760;
        this.dashWindup = 0;
        this.dashTimer = 0;
        this.dashAngle = 0;
        this._starBeams = [];
        this._gravPools = [];
        this.phase2Triggered = false;
        this.phase3Triggered = false;

        // Half-HP Aegis Pillar Shield state
        this.halfShieldTriggered = false;
        this.shieldActive = false;
        this.shieldPillars = [];
        this.shieldTotalCount = 4;
        this.shieldFlash = 0;
        this._immuneTxtCd = 0;
        this._pendingShieldSpawn = false;
    }

    takeDamage(amount, effects = null, fromCrit = null, playSound = true) {
        if (this.cutsceneState !== 'COMBAT') {
            if (effects && Math.random() < 0.45) effects.addSparks(this.x, this.y, '#fed330', 4);
            return false;
        }
        if (this.shieldActive) {
            this.shieldFlash = 10;
            if (effects) {
                if (Math.random() < 0.75) effects.addSparks(this.x, this.y - 12, '#fed330', 4);
                if (this._immuneTxtCd <= 0) {
                    this._immuneTxtCd = 38;
                    effects.addComicSplash(this.x, this.y - this.radius - 12, '🛡️ IMMUNE!', '#fed330');
                }
            }
            return false;
        }

        const halfFloor = Math.max(1, Math.ceil(this.maxHp * 0.50));
        if (!this.halfShieldTriggered && this.hp > halfFloor) {
            let dmgScale = 1.0;
            if (this.waterDrenchedTimer > 0) dmgScale *= (this.damageVulnerabilityMultiplier || 1.30);
            if (this.shockedTimer > 0) dmgScale *= (this.shockVulnerabilityMultiplier || 1.12);
            if (this.hp - amount * dmgScale <= halfFloor) {
                const clampedRaw = Math.max(0, Math.floor((this.hp - halfFloor) / dmgScale));
                super.takeDamage(clampedRaw, effects, fromCrit, playSound);
                this.hp = halfFloor;
                this.dead = false;
                this._activateHalfHpShield();
                return false;
            }
        }

        const res = super.takeDamage(amount, effects, fromCrit, playSound);
        if (!this.halfShieldTriggered && this.hp <= halfFloor) {
            this.hp = halfFloor;
            this.dead = false;
            this._activateHalfHpShield();
            return false;
        }
        return res;
    }

    _activateHalfHpShield() {
        if (this.halfShieldTriggered) return;
        this.halfShieldTriggered = true;
        this.shieldActive = true;
        this._pendingShieldSpawn = true;
        this.shieldFlash = 14;
        this.phaseLabel = '🛡️ AEGIS SHIELD • SHATTER ALL 4 PILLARS (4/4)';
    }

    onShieldPillarDestroyed(pillar = null, effects = null) {
        if (!this.shieldActive) return;
        const remaining = this.shieldPillars.filter(p => p && !p.dead && p.hp > 0).length;
        const total = this.shieldTotalCount || 4;
        if (remaining > 0) {
            this.shieldFlash = 8;
            this.phaseLabel = `🛡️ AEGIS SHIELD • SHATTER PILLARS (${remaining}/${total})`;
            if (effects) {
                effects.addShockwave(this.x, this.y, 130, 'rgba(254, 211, 48, 0.85)');
                effects.addComicSplash(this.x, this.y - this.radius - 12, `⚡ PILLAR DOWN (${remaining} LEFT)!`, '#fed330');
            }
        } else {
            this.shieldActive = false;
            this.shieldFlash = 16;
            this.hitFlash = 10;
            this.phaseLabel = this.phase >= 3 ? 'PHASE III • RUIN CATACLYSM PROTOCOL' : 'PHASE II • AEGIS SHATTERED!';
            if (effects) {
                effects.addShockwave(this.x, this.y, 260, 'rgba(254, 211, 48, 0.98)');
                effects.addSparks(this.x, this.y, '#fed330', 22);
                effects.addSparks(this.x, this.y, '#ff2e4c', 16);
                effects.addComicSplash(this.x, this.y - this.radius - 14, '💥 SHIELD SHATTERED! 💥', '#fef08a');
                if (typeof effects.triggerScreenFlash === 'function') effects.triggerScreenFlash('#fed330', 0.34, 24);
            }
        }
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        if (this.cutsceneState !== 'COMBAT' && typeof HardBossEntranceFX !== 'undefined' && HardBossEntranceFX.updateApexBossCutscene) {
            HardBossEntranceFX.updateApexBossCutscene(this, dt, player, effects, {
                subText: 'HARD WAVE 30 • APEX BOSS AWAKENING',
                speaker: 'ALPHA, SOVEREIGN OF RUIN',
                avatar: '👑',
                color: '#ff2e4c',
                line1: 'SIX RUNES SHATTERED... NO MORTAL HAS SURVIVED THE APEX SOVEREIGN!',
                awakenSub: 'THE SIX RUNE PYLONS IGNITE — APEX OVERDRIVE IMMINENT...',
                line2: 'BOW BEFORE OBLIVION — WITNESS TRUE RUIN!'
            });
            return;
        }

        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        if (this.shieldFlash > 0) this.shieldFlash = Math.max(0, this.shieldFlash - dt);
        if (this._immuneTxtCd > 0) this._immuneTxtCd = Math.max(0, this._immuneTxtCd - dt);

        if (this._pendingShieldSpawn) {
            this._pendingShieldSpawn = false;
            if (typeof ApexShieldPillar !== 'undefined' && typeof ApexShieldPillar.spawnForBoss === 'function') {
                ApexShieldPillar.spawnForBoss(this, enemies, arena, effects);
            }
            if (effects) {
                effects.addShockwave(this.x, this.y, 230, 'rgba(255, 46, 76, 0.96)');
                effects.addComicSplash(this.x, this.y - this.radius - 14, '🛡️ AEGIS ACTIVE!', '#fed330');
                if (typeof effects.triggerScreenFlash === 'function') effects.triggerScreenFlash('#ff2e4c', 0.32, 22);
            }
        }

        if (this.shieldActive && this.shieldPillars.length > 0) {
            const aliveCount = this.shieldPillars.filter(p => p && !p.dead && p.hp > 0).length;
            if (aliveCount <= 0) this.onShieldPillarDestroyed(null, effects);
        }

        this.updateTelegraphs(dt, player, effects);
        this._tickStarBeams(dt, player, effects);
        this._tickGravPulls(dt, player);
        if (!player || player.hp <= 0) return;

        // Phase 2 <= 65% HP: Seal Shattered -> Summon StormTempest + EclipseHarbinger
        if (!this.phase2Triggered && this.hp <= this.maxHp * 0.65) {
            this.phase2Triggered = true;
            this.phase = 2;
            if (!this.shieldActive) this.phaseLabel = 'PHASE II • SEAL SHATTERED & METEOR STORM';
            this.checkEnrage(0.66, effects, '👑 APEX PHASE II: SEAL SHATTERED! 👑', 1.18, 'rgba(255, 46, 76, 0.96)');
            if (typeof StormTempest === 'function') {
                enemies.push(new StormTempest(this.x - 120, this.y + 45, this.waveMultiplier * 0.85));
                enemies.push(new StormTempest(this.x + 120, this.y - 45, this.waveMultiplier * 0.85));
            }
            if (typeof EclipseHarbinger === 'function') enemies.push(new EclipseHarbinger(this.x, this.y - 120, this.waveMultiplier * 0.88));
            if (effects && typeof effects.triggerScreenFlash === 'function') effects.triggerScreenFlash('#ff2e4c', 0.30, 22);
            for (let k = 0; k < 14; k++) this.fireFan(bullets, (k / 14) * Math.PI * 2, [0], 10.6, Math.round(this.damage * 0.85), 11, 'eclipse_glaive');
        }

        // Phase 3 <= 30% HP: Cataclysm Protocol
        if (!this.phase3Triggered && this.hp <= this.maxHp * 0.30) {
            this.phase3Triggered = true;
            this.phase = 3;
            this.phaseLabel = 'PHASE III • RUIN CATACLYSM PROTOCOL';
            this.speed = this.baseSpeed * 1.40;
            this.apexBadgeText = '🔥 APEX CATACLYSM 🔥';
            if (typeof CrimsonWraith === 'function') {
                enemies.push(new CrimsonWraith(this.x - 120, this.y - 70, this.waveMultiplier * 0.90));
                enemies.push(new CrimsonWraith(this.x + 120, this.y + 70, this.waveMultiplier * 0.90));
            }
            if (effects) {
                effects.addShockwave(this.x, this.y, 240, 'rgba(255, 46, 76, 0.96)');
                effects.addComicSplash(this.x, this.y - 68, '🔥 FINAL APEX PROTOCOL! 🔥', '#fed330');
                if (typeof effects.triggerScreenFlash === 'function') effects.triggerScreenFlash('#fed330', 0.36, 26);
            }
            this._spawnStarBeams(6);
        }

        const dx = player.x - this.x, dy = player.y - this.y, dist = Math.hypot(dx, dy) || 1;
        if (this.dashWindup > 0) {
            this.dashWindup -= dt;
            if (this.dashWindup <= 0) {
                this.dashTimer = 24;
                if (effects) effects.addShockwave(this.x, this.y, 130, 'rgba(254, 211, 48, 0.92)');
            }
            return;
        }
        if (this.dashTimer > 0) {
            this.dashTimer -= dt;
            this.x += Math.cos(this.dashAngle) * 17.2 * dt;
            this.y += Math.sin(this.dashAngle) * 17.2 * dt;
            if (Math.floor(this.dashTimer) % 6 === 0) {
                this.addTelegraph(this.x, this.y, 82, 34, Math.round(this.damage * 0.95), '💥', 'rgba(255, 46, 76, 0.92)', 'orbital_nuke', '#fed330');
                this.fireFan(bullets, this.dashAngle + Math.PI * 0.5, [0, Math.PI], 10.6, Math.round(this.damage * 0.78), 11, 'crimson_slash');
            }
            this.applyArenaBounds(arena);
            return;
        }

        this.angle = Math.atan2(dy, dx);
        if (this.starCooldown > 0) this.starCooldown -= dt;
        if (this.gravCooldown > 0) this.gravCooldown -= dt;
        if (this.dashCooldown > 0) this.dashCooldown -= dt;
        if (this.volleyCooldown > 0) this.volleyCooldown -= dt;
        if (this.meteorCooldown > 0) this.meteorCooldown -= dt;

        const inRange = dist <= (this.attackRange || 760);

        // 1. Rotating Pylon Laser Star
        if (this.starCooldown <= 0 && inRange) {
            this.starCooldown = this.phase >= 3 ? 112 : 152;
            this._spawnStarBeams(this.phase >= 3 ? 6 : 4);
        }

        // 2. Singularity Graviton Pull + Radial Glaive Burst (range-gated)
        if (this.gravCooldown <= 0 && inRange) {
            this.gravCooldown = this.phase >= 2 ? 115 : 150;
            this.addTelegraph(player.x, player.y, 138, 52, Math.round(this.damage * 1.25), '🌀', 'rgba(168, 85, 247, 0.95)', 'frost_prism', '#ff2e4c');
            this._gravPools.push({ x: player.x, y: player.y, life: 50 });
            for (let k = 0; k < 8; k++) this.fireFan(bullets, (k / 8) * Math.PI * 2 + this.age * 0.03, [0], 10.2, Math.round(this.damage * 0.8), 11, 'eclipse_glaive');
        }

        // 3. Cataclysm Halberd Dash
        if (this.dashCooldown <= 0 && dist < 500) {
            this.dashCooldown = this.phase >= 3 ? 105 : 148;
            this.dashWindup = 22;
            this.dashAngle = this.angle;
        }

        // 4. Phase 2+ Abyssal Meteor Barrage (range-gated so meteors never spawn across map)
        if (this.phase >= 2 && this.meteorCooldown <= 0 && inRange) {
            this.meteorCooldown = this.phase >= 3 ? 98 : 138;
            for (let m = 0; m < (this.phase >= 3 ? 5 : 4); m++) {
                const mx = player.x + (player.vx || 0) * (m * 10) + (Math.random() - 0.5) * 140;
                const my = player.y + (player.vy || 0) * (m * 10) + (Math.random() - 0.5) * 140;
                this.addTelegraph(mx, my, 96, 44 + m * 6, Math.round(this.damage * 1.18), '☄️', 'rgba(255, 46, 76, 0.96)', 'orbital_nuke', '#fed330');
            }
        }

        // 5. Dual Alternating Ruin Volleys (void_orb + magma_shard, range-gated)
        if (this.volleyCooldown <= 0 && inRange) {
            this.volleyCooldown = this.phase >= 3 ? 38 : (this.phase >= 2 ? 50 : 64);
            const fan = this.phase >= 2 ? [-0.42, -0.21, 0, 0.21, 0.42] : [-0.26, 0, 0.26];
            this.fireFan(bullets, this.angle, fan, 12.2, Math.round(this.damage * 0.86), 11, 'void_orb');
            if (this.phase >= 2) this.fireFan(bullets, this.angle + 0.12, [-0.2, 0.2], 13.0, Math.round(this.damage * 0.82), 11, 'magma_shard');
        }

        this.moveTowards(dt * (this.shieldActive ? 0.72 : 1), dx, dy, dist, 235, arena);
    }

    _spawnStarBeams(count = 4) {
        const base = this.angle || 0;
        for (let i = 0; i < count; i++) {
            this._starBeams.push({ ang: base + (i / count) * Math.PI * 2, spin: 0.013, warnTimer: 40, activeTimer: 44 });
        }
    }

    _tickStarBeams(dt, player, effects) {
        for (let i = this._starBeams.length - 1; i >= 0; i--) {
            const sb = this._starBeams[i];
            sb.ang += (sb.spin || 0.012) * dt;
            if (sb.warnTimer > 0) sb.warnTimer -= dt;
            else {
                sb.activeTimer -= dt;
                if (player && player.invulnerableTimer <= 0) {
                    const vx = Math.cos(sb.ang), vy = Math.sin(sb.ang);
                    const px = player.x - this.x, py = player.y - this.y;
                    const proj = px * vx + py * vy;
                    if (proj > 0 && proj <= 760) {
                        const perp = Math.abs(px * -vy + py * vx);
                        if (perp <= 26) player.takeDamage(Math.round(this.damage * 1.1), effects);
                    }
                }
                if (sb.activeTimer <= 0) this._starBeams.splice(i, 1);
            }
        }
    }

    _tickGravPulls(dt, player) {
        for (let i = this._gravPools.length - 1; i >= 0; i--) {
            const gp = this._gravPools[i];
            gp.life -= dt;
            if (player) {
                const dx = gp.x - player.x, dy = gp.y - player.y, d = Math.hypot(dx, dy) || 1;
                if (d > 18 && d < 240) { player.x += (dx / d) * 1.45 * dt; player.y += (dy / d) * 1.45 * dt; }
            }
            if (gp.life <= 0) this._gravPools.splice(i, 1);
        }
    }

    draw(ctx) {
        if (typeof ApexSovereignW30Renderer !== 'undefined') ApexSovereignW30Renderer.draw(ctx, this);
    }
}

if (typeof window !== 'undefined') window.OblivionEngine = OblivionEngine;
if (typeof module !== 'undefined' && module.exports) module.exports = { OblivionEngine };
