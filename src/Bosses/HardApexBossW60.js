/**
 * Lesa.io - Wave 60 Final Apex Boss: "Erebus, Sovereign of the End"
 * By far the strongest encounter in the game:
 *   - 6-Stage Delay-Reveal Entrance (weather & map transform BEFORE boss materializes in full aura)
 *   - 4 Escalating Combat Phases + 50% HP Invulnerable Omega Aegis Shield with 4 Pillars
 *   - Intersecting Space-Tear Rift Slicers, Inward-Collapsing Glaive Rings,
 *     Abyssal Shadow-Step Blink Slams, Solar-Void Spirals & Rotating Cataclysm Star Beams
 */

class OmegaApocalypse extends EndlessBossBase {
    constructor(x, y, waveMultiplier = 1.0, extra = {}) {
        super(x, y, 'apex_omega_w60', waveMultiplier, {
            name: 'Erebus, Sovereign of the End',
            hudLabel: extra.hudLabel || '🔥 EREBUS, SOVEREIGN OF THE END [FINAL APEX] 🔥',
            isMiniBoss: false,
            bossRank: 'apex',
            rankColor: extra.rankColor || '#ff2e4c',
            crateId: extra.crateId || 'boss_crate_insane',
            isApex: true,
            radius: 62,
            baseHp: 87345,
            speed: 3.15,
            baseDmg: 72,
            xpDrop: 5000,
            scoreValue: 25000,
            goldBonus: 6500,
            xpBonus: 4200
        });
        this.isHardMainBoss = true;
        this.isApexBoss = true;
        this.fixedHardHp = 4500000;
        this.apexTitle = 'Erebus, Sovereign of the End';
        this.apexBadgeText = '🔥 W60 FINAL APEX 🔥';
        this.phaseNotches = [0.75, 0.50, 0.25];
        this.phase = 1;
        this.phaseLabel = 'PHASE I • ECLIPSE APOCALYPSE';

        this.cutsceneState = 'OMEN_STORM';
        this.cutsceneTimer = 56;
        this.hideBossModel = true;
        this.auraScale = 0;
        this.entranceDropY = 180;

        this.riftCooldown = 125;
        this.ringCooldown = 145;
        this.blinkCooldown = 175;
        this.spiralCooldown = 62;
        this.starCooldown = 155;
        this.attackRange = 800;
        this.blinkTarget = null;
        this.blinkWindup = 0;

        this._riftLines = [];
        this._starBeams = [];
        this.phase2Triggered = false;
        this.halfShieldTriggered = false;
        this.shieldActive = false;
        this.shieldPillars = [];
        this.shieldTotalCount = 4;
        this.shieldFlash = 0;
        this._immuneTxtCd = 0;
        this._pendingShieldSpawn = false;
        this.phase4Triggered = false;
    }

    takeDamage(amount, effects = null, fromCrit = null, playSound = true) {
        if (this.cutsceneState !== 'COMBAT') {
            if (effects && Math.random() < 0.4) effects.addSparks(this.x, this.y, '#c084fc', 4);
            return false;
        }
        if (this.shieldActive) {
            this.shieldFlash = 10;
            if (effects) {
                if (Math.random() < 0.8) effects.addSparks(this.x, this.y - 12, '#fed330', 4);
                if (this._immuneTxtCd <= 0) {
                    this._immuneTxtCd = 36;
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
                this.hp = halfFloor; this.dead = false;
                this._activateHalfHpShield();
                return false;
            }
        }

        const res = super.takeDamage(amount, effects, fromCrit, playSound);
        if (!this.halfShieldTriggered && this.hp <= halfFloor) {
            this.hp = halfFloor; this.dead = false;
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
        this.phase = Math.max(this.phase, 3);
        this.shieldFlash = 14;
        this.phaseLabel = '🛡️ OMEGA AEGIS • SHATTER ALL 4 PILLARS (4/4)';
    }

    onShieldPillarDestroyed(pillar = null, effects = null) {
        if (!this.shieldActive) return;
        const remaining = this.shieldPillars.filter(p => p && !p.dead && p.hp > 0).length;
        const total = this.shieldTotalCount || 4;
        if (remaining > 0) {
            this.shieldFlash = 8;
            this.phaseLabel = `🛡️ OMEGA AEGIS • SHATTER PILLARS (${remaining}/${total})`;
            if (effects) {
                effects.addShockwave(this.x, this.y, 150, 'rgba(254, 211, 48, 0.85)');
                effects.addComicSplash(this.x, this.y + this.radius + 24, `⚡ PILLAR DOWN (${remaining} LEFT)!`, '#fed330');
            }
        } else {
            this.shieldActive = false;
            this.shieldFlash = 18; this.hitFlash = 12;
            this.phaseLabel = this.phase >= 4 ? 'PHASE IV • END OF ALL THINGS' : 'PHASE III • OMEGA AEGIS SHATTERED!';
            if (effects) {
                effects.addShockwave(this.x, this.y, 310, 'rgba(254, 211, 48, 0.98)');
                effects.addComicSplash(this.x, this.y + this.radius + 24, '💥 OMEGA SHIELD SHATTERED! 💥', '#fef08a');
                if (typeof effects.triggerScreenFlash === 'function') effects.triggerScreenFlash('#fed330', 0.36, 24);
            }
        }
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        if (this.cutsceneState !== 'COMBAT' && typeof ApexW60Cutscene !== 'undefined') {
            ApexW60Cutscene.update(this, dt, player, effects);
            return;
        }

        this.hideBossModel = false;
        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        if (this.shieldFlash > 0) this.shieldFlash = Math.max(0, this.shieldFlash - dt);
        if (this._immuneTxtCd > 0) this._immuneTxtCd = Math.max(0, this._immuneTxtCd - dt);

        if (this._pendingShieldSpawn) {
            this._pendingShieldSpawn = false;
            if (typeof ApexShieldPillar !== 'undefined' && typeof ApexShieldPillar.spawnForBoss === 'function') {
                ApexShieldPillar.spawnForBoss(this, enemies, arena, effects);
            }
            if (typeof InfernoArtillery === 'function') enemies.push(new InfernoArtillery(this.x - 135, this.y, this.waveMultiplier * 0.9));
            if (typeof CrimsonWraith === 'function') enemies.push(new CrimsonWraith(this.x + 135, this.y, this.waveMultiplier * 0.9));
            if (effects) {
                effects.addShockwave(this.x, this.y, 260, 'rgba(255, 46, 76, 0.96)');
                effects.addComicSplash(this.x, this.y - this.radius - 14, '🛡️ OMEGA AEGIS ENGAGED!', '#fed330');
                if (typeof effects.triggerScreenFlash === 'function') effects.triggerScreenFlash('#ff2e4c', 0.34, 22);
            }
        }
        if (this.shieldActive && this.shieldPillars.length > 0 && this.shieldPillars.every(p => !p || p.dead || p.hp <= 0)) {
            this.onShieldPillarDestroyed(null, effects);
        }

        this.updateTelegraphs(dt, player, effects);
        this._tickRiftLines(dt, player, bullets, effects);
        this._tickStarBeams(dt, player, effects);
        if (!player || player.hp <= 0) return;

        // Phase 2 <= 75% HP
        if (!this.phase2Triggered && this.hp <= this.maxHp * 0.75) {
            this.phase2Triggered = true;
            this.phase = 2;
            this.phaseLabel = 'PHASE II • SOVEREIGN OVERDRIVE';
            this.checkEnrage(0.76, effects, '🔥 SOVEREIGN OVERDRIVE! 🔥', 1.18, 'rgba(255, 46, 76, 0.96)');
            if (typeof StormTempest === 'function') enemies.push(new StormTempest(this.x - 130, this.y + 40, this.waveMultiplier * 0.9));
            if (typeof EclipseHarbinger === 'function') enemies.push(new EclipseHarbinger(this.x + 130, this.y - 40, this.waveMultiplier * 0.9));
            if (typeof VoidAcolyte === 'function') enemies.push(new VoidAcolyte(this.x, this.y - 130, this.waveMultiplier * 0.9));
        }

        // Phase 4 <= 25% HP
        if (!this.phase4Triggered && this.hp <= this.maxHp * 0.25) {
            this.phase4Triggered = true;
            this.phase = 4;
            this.phaseLabel = 'PHASE IV • END OF ALL THINGS';
            this.speed = this.baseSpeed * 1.48;
            this.apexBadgeText = '💀 OMEGA APOCALYPSE 💀';
            if (effects) {
                effects.addShockwave(this.x, this.y, 300, 'rgba(254, 211, 48, 0.98)');
                effects.addComicSplash(this.x, this.y - 72, '💀 FINAL FORM: APOCALYPSE! 💀', '#fed330');
                if (typeof effects.triggerScreenFlash === 'function') effects.triggerScreenFlash('#ff2e4c', 0.42, 26);
            }
            this._spawnStarBeams(6);
        }

        const dx = player.x - this.x, dy = player.y - this.y, dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);

        // Abyssal Shadow-Step Blink Slam
        if (this.blinkWindup > 0 && this.blinkTarget) {
            this.blinkWindup -= dt;
            if (this.blinkWindup <= 0) {
                if (effects) {
                    effects.addLightningChain(this.x, this.y, this.blinkTarget.x, this.blinkTarget.y, '#ff2e4c');
                    effects.addShockwave(this.blinkTarget.x, this.blinkTarget.y, 175, 'rgba(255, 46, 76, 0.96)');
                }
                this.x = this.blinkTarget.x; this.y = this.blinkTarget.y;
                this.applyArenaBounds(arena);
                if (Math.hypot(player.x - this.x, player.y - this.y) <= 135 && player.invulnerableTimer <= 0) {
                    player.takeDamage(Math.round(this.damage * 1.25), effects);
                }
                for (let k = 0; k < 10; k++) this.fireFan(bullets, (k / 10) * Math.PI * 2, [0], 11.2, Math.round(this.damage * 0.85), 11, 'eclipse_glaive');
                this.blinkTarget = null;
            }
            return;
        }

        if (this.riftCooldown > 0) this.riftCooldown -= dt;
        if (this.ringCooldown > 0) this.ringCooldown -= dt;
        if (this.blinkCooldown > 0) this.blinkCooldown -= dt;
        if (this.spiralCooldown > 0) this.spiralCooldown -= dt;
        if (this.starCooldown > 0) this.starCooldown -= dt;

        const inRange = dist <= (this.attackRange || 800);

        // 1. Intersecting Space-Tear Rift Slicers (range-gated)
        if (this.riftCooldown <= 0 && inRange) {
            this.riftCooldown = this.phase >= 4 ? 85 : (this.phase >= 2 ? 115 : 140);
            const count = this.phase >= 4 ? 3 : 2;
            for (let i = 0; i < count; i++) {
                const a = this.angle + (i - (count - 1) * 0.5) * 0.85 + (Math.random() - 0.5) * 0.25;
                this._riftLines.push({ ax: player.x - Math.cos(a) * 320, ay: player.y - Math.sin(a) * 320, ang: a, len: 640, warnTimer: 40, activeTimer: 16, hit: false });
            }
        }

        // 2. Inward-Collapsing Glaive Ring around Player (range-gated)
        if (this.ringCooldown <= 0 && inRange && typeof Bullet !== 'undefined') {
            this.ringCooldown = this.phase >= 4 ? 110 : 148;
            const ringCount = this.phase >= 4 ? 12 : 9;
            const gap = Math.floor(Math.random() * ringCount);
            for (let k = 0; k < ringCount; k++) {
                if (k === gap) continue;
                const a = (k / ringCount) * Math.PI * 2;
                const sx = player.x + Math.cos(a) * 265, sy = player.y + Math.sin(a) * 265;
                bullets.push(new Bullet({
                    x: sx, y: sy, vx: -Math.cos(a) * 7.8, vy: -Math.sin(a) * 7.8,
                    damage: Math.round(this.damage * 0.85), speed: 7.8, radius: 11,
                    type: 'eclipse_glaive', isEnemy: true, range: 520
                }));
            }
        }

        // 3. Shadow-Step Blink Slam
        if (this.blinkCooldown <= 0 && dist < 620) {
            this.blinkCooldown = this.phase >= 4 ? 135 : 185;
            this.blinkTarget = { x: player.x + (player.vx || 0) * 14, y: player.y + (player.vy || 0) * 14 };
            this.blinkWindup = 32;
            return;
        }

        // 4. Solar-Void Barrage + Orbital Meteor Strikes (Phase 2+, range-gated)
        if (this.spiralCooldown <= 0 && inRange) {
            this.spiralCooldown = this.phase >= 4 ? 38 : (this.phase >= 2 ? 50 : 66);
            const spinOff = Math.sin(this.age * 0.14) * 0.35;
            const fan = this.phase >= 4 ? [-0.46, -0.23, 0, 0.23, 0.46] : [-0.28, 0, 0.28];
            this.fireFan(bullets, this.angle + spinOff, fan, 12.6, Math.round(this.damage * 0.88), 11, 'void_orb');
            if (this.phase >= 2) {
                this.fireFan(bullets, this.angle - spinOff, [-0.18, 0.18], 13.4, Math.round(this.damage * 0.84), 11, 'magma_shard');
                if (Math.random() < 0.45) {
                    this.addTelegraph(player.x + (player.vx || 0) * 14, player.y + (player.vy || 0) * 14, 102, 46, Math.round(this.damage * 1.22), '☄️', 'rgba(255, 46, 76, 0.96)', 'orbital_nuke', '#fed330');
                }
            }
        }

        // 5. Phase 4+ Rotating Cataclysm Star Beams (range-gated)
        if (this.phase >= 4 && this.starCooldown <= 0 && inRange) {
            this.starCooldown = 145;
            this._spawnStarBeams(5);
        }

        this.moveTowards(dt * (this.shieldActive ? 0.75 : 1), dx, dy, dist, 230, arena);
    }

    _tickRiftLines(dt, player, bullets, effects) {
        for (let i = this._riftLines.length - 1; i >= 0; i--) {
            const rf = this._riftLines[i];
            if (rf.warnTimer > 0) rf.warnTimer -= dt;
            else {
                rf.activeTimer -= dt;
                if (!rf.hit && player && player.invulnerableTimer <= 0) {
                    const bx = rf.ax + Math.cos(rf.ang) * rf.len, by = rf.ay + Math.sin(rf.ang) * rf.len;
                    const vx = bx - rf.ax, vy = by - rf.ay, lenSq = vx * vx + vy * vy || 1;
                    const u = Math.max(0, Math.min(1, ((player.x - rf.ax) * vx + (player.y - rf.ay) * vy) / lenSq));
                    const d = Math.hypot(player.x - (rf.ax + vx * u), player.y - (rf.ay + vy * u));
                    if (d <= 24) {
                        rf.hit = true;
                        player.takeDamage(Math.round(this.damage * 1.22), effects);
                    }
                }
                if (rf.activeTimer <= 0) this._riftLines.splice(i, 1);
            }
        }
    }

    _spawnStarBeams(count = 5) {
        const base = this.angle || 0;
        for (let i = 0; i < count; i++) this._starBeams.push({ ang: base + (i / count) * Math.PI * 2, spin: 0.014, warnTimer: 40, activeTimer: 44 });
    }

    _tickStarBeams(dt, player, effects) {
        for (let i = this._starBeams.length - 1; i >= 0; i--) {
            const sb = this._starBeams[i];
            sb.ang += (sb.spin || 0.014) * dt;
            if (sb.warnTimer > 0) sb.warnTimer -= dt;
            else {
                sb.activeTimer -= dt;
                if (player && player.invulnerableTimer <= 0) {
                    const vx = Math.cos(sb.ang), vy = Math.sin(sb.ang);
                    const px = player.x - this.x, py = player.y - this.y, proj = px * vx + py * vy;
                    if (proj > 0 && proj <= 780 && Math.abs(px * -vy + py * vx) <= 26) {
                        player.takeDamage(Math.round(this.damage * 1.15), effects);
                    }
                }
                if (sb.activeTimer <= 0) this._starBeams.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        if (typeof ApexOmegaW60Renderer !== 'undefined') ApexOmegaW60Renderer.draw(ctx, this);
    }
}

if (typeof window !== 'undefined') window.OmegaApocalypse = OmegaApocalypse;
if (typeof module !== 'undefined' && module.exports) module.exports = { OmegaApocalypse };
