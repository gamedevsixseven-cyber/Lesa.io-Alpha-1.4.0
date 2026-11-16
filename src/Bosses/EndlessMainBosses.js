/**
 * Lesa.io - Endless Mode Main Bosses (Spawns every 10 waves: 10, 20, 30, 40, 50...)
 * - Wave 10: FrappeBaron (Normal Boss Crate)
 * - Wave 20: DozerForeman (Hard Boss Crate)
 * - Wave 30: DimarchosBoss (Very Hard Boss Crate)
 * - Wave 40+: MechaKolossos (Insane Boss Crate)
 */

class FrappeBaron extends EndlessBossBase {
    constructor(x, y, waveMultiplier = 1.0, extra = {}) {
        super(x, y, 'frappe_baron', waveMultiplier, {
            name: 'Frappe Baron',
            hudLabel: extra.hudLabel || '🧊 FRAPPE BARON [NORMAL BOSS] 🧊',
            isMiniBoss: false,
            bossRank: extra.bossRank || 'normal',
            rankColor: extra.rankColor || '#1e90ff',
            crateId: extra.crateId || 'boss_crate_normal',
            isApex: extra.isApex,
            radius: 44,
            baseHp: 1750,
            speed: 2.55,
            baseDmg: 30,
            xpDrop: 460,
            scoreValue: 1300,
            goldBonus: 360,
            xpBonus: 260
        });
        this.shotCooldown = 85;
        this.vortexCooldown = 190;
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        this.updateTelegraphs(dt, player, effects);
        if (!player || player.hp <= 0) return;

        this.checkEnrage(0.5, effects, '🧊 TRIPLE ESPRESSO RAGE! 🧊', 1.25, 'rgba(0, 210, 211, 0.92)');
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);

        if (this.shotCooldown > 0) this.shotCooldown -= dt;
        if (this.vortexCooldown > 0) this.vortexCooldown -= dt;

        if (this.shotCooldown <= 0) {
            this.shotCooldown = this.isEnraged ? 60 : 88;
            const spread = this.isEnraged ? [-0.30, -0.15, 0, 0.15, 0.30] : [-0.20, 0, 0.20];
            this.fireFan(bullets, this.angle, spread, 10.5, Math.round(this.damage * 0.85), 10, 'frappe_ice_cube');
            if (effects) effects.addSparks(this.x, this.y, '#00d2d3', 5);
        }

        if (this.vortexCooldown <= 0) {
            this.vortexCooldown = this.isEnraged ? 145 : 195;
            this.addTelegraph(player.x, player.y, 75, 50, Math.round(this.damage * 1.1), '🧊', 'rgba(0, 210, 211, 0.95)', 'cryo_vortex', '#00f5ff');
            this.addTelegraph(player.x + 115, player.y - 60, 68, 50, Math.round(this.damage * 1.0), '🧊', 'rgba(0, 210, 211, 0.95)', 'cryo_vortex', '#c49a6c');
            if (effects) effects.addComicSplash(this.x, this.y - 50, 'ICE BREW! 🧊');
        }

        this.moveTowards(dt, dx, dy, dist, 210, arena);
    }

    draw(ctx) {
        if (typeof EndlessBossRenderer !== 'undefined') EndlessBossRenderer.drawFrappeBaron(ctx, this);
    }
}

class DozerForeman extends EndlessBossBase {
    constructor(x, y, waveMultiplier = 1.0, extra = {}) {
        super(x, y, 'dozer_foreman', waveMultiplier, {
            name: 'Foreman Kostas',
            hudLabel: extra.hudLabel || '🚧 FOREMAN KOSTAS [HARD BOSS] 🚧',
            isMiniBoss: false,
            bossRank: extra.bossRank || 'hard',
            rankColor: extra.rankColor || '#9b59b6',
            crateId: extra.crateId || 'boss_crate_hard',
            isApex: extra.isApex,
            radius: 46,
            baseHp: 2150,
            speed: 2.35,
            baseDmg: 34,
            xpDrop: 640,
            scoreValue: 1850,
            goldBonus: 500,
            xpBonus: 360
        });
        this.drillCooldown = 155;
        this.drillTimer = 0;
        this.drillAngle = 0;
        this.rubbleCooldown = 110;
        this.summoned = false;
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        if (!player || player.hp <= 0) return;

        if (this.checkEnrage(0.5, effects, '🚧 ROADWORKS OVERDRIVE! 🚧', 1.28, 'rgba(241, 196, 15, 0.95)') && !this.summoned) {
            this.summoned = true;
            if (typeof OuzoBomber !== 'undefined') {
                enemies.push(new OuzoBomber(this.x - 80, this.y + 40, Math.max(1.0, this.waveMultiplier * 0.7)));
                enemies.push(new OuzoBomber(this.x + 80, this.y - 40, Math.max(1.0, this.waveMultiplier * 0.7)));
            }
        }

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);

        if (this.drillCooldown > 0) this.drillCooldown -= dt;
        if (this.rubbleCooldown > 0) this.rubbleCooldown -= dt;

        if (this.drillTimer > 0) {
            this.drillTimer -= dt;
            const dSpd = 9.8 * dt;
            this.x += Math.cos(this.drillAngle) * dSpd;
            this.y += Math.sin(this.drillAngle) * dSpd;
            if (effects && Math.floor(this.age) % 6 === 0) {
                effects.addGroundCrack(this.x, this.y, 70, '#636e72', '#f1c40f', 90);
            }
            this.applyArenaBounds(arena);
            return;
        }

        if (dist < 380 && this.drillCooldown <= 0) {
            this.drillTimer = 30;
            this.drillCooldown = this.isEnraged ? 120 : 165;
            this.drillAngle = this.angle;
            if (effects) effects.addComicSplash(this.x, this.y - 48, 'BULLDOZER! 🚧');
            return;
        }

        if (this.rubbleCooldown <= 0) {
            this.rubbleCooldown = this.isEnraged ? 75 : 108;
            this.fireFan(bullets, this.angle, [-0.45, -0.22, 0, 0.22, 0.45], 9.8, Math.round(this.damage * 0.85), 11, 'dozer_asphalt_chunk');
            if (effects) effects.addDust(this.x, this.y, 5, 10);
        }

        this.moveTowards(dt, dx, dy, dist, 0, arena);
    }

    draw(ctx) {
        if (typeof EndlessBossRenderer !== 'undefined') EndlessBossRenderer.drawDozerForeman(ctx, this);
    }
}

class DimarchosBoss extends EndlessBossBase {
    constructor(x, y, waveMultiplier = 1.0, extra = {}) {
        super(x, y, 'dimarchos_boss', waveMultiplier, {
            name: 'O Dimarchos',
            hudLabel: extra.hudLabel || '🏛️ O DIMARCHOS [VERY HARD BOSS] 🏛️',
            isMiniBoss: false,
            bossRank: extra.bossRank || 'very_hard',
            rankColor: extra.rankColor || '#e67e22',
            crateId: extra.crateId || 'boss_crate_very_hard',
            isApex: extra.isApex,
            radius: 46,
            baseHp: 3100,
            speed: 2.65,
            baseDmg: 36,
            xpDrop: 920,
            scoreValue: 2600,
            goldBonus: 750,
            xpBonus: 540
        });
        this.decreeCooldown = 80;
        this.taxStrikeCooldown = 165;
        this.summoned = false;
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        this.updateTelegraphs(dt, player, effects);
        if (!player || player.hp <= 0) return;

        if (this.checkEnrage(0.55, effects, '🏛️ EMERGENCY TAX HIKE! 🏛️', 1.28, 'rgba(254, 211, 48, 0.95)') && !this.summoned) {
            this.summoned = true;
            if (typeof DimotikiEnforcer !== 'undefined') {
                const subMult = Math.max(1.0, this.waveMultiplier * 0.65);
                enemies.push(new DimotikiEnforcer(this.x - 95, this.y + 30, subMult));
                enemies.push(new DimotikiEnforcer(this.x + 95, this.y - 30, subMult));
            }
        }

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);

        if (this.decreeCooldown > 0) this.decreeCooldown -= dt;
        if (this.taxStrikeCooldown > 0) this.taxStrikeCooldown -= dt;

        if (this.decreeCooldown <= 0) {
            this.decreeCooldown = this.isEnraged ? 52 : 76;
            const spread = this.isEnraged ? [-0.34, -0.17, 0, 0.17, 0.34] : [-0.20, 0, 0.20];
            this.fireFan(bullets, this.angle, spread, 11.5, Math.round(this.damage * 0.85), 11, 'tax_decree');
        }

        if (this.taxStrikeCooldown <= 0) {
            this.taxStrikeCooldown = this.isEnraged ? 125 : 170;
            for (let i = 0; i < (this.isEnraged ? 4 : 3); i++) {
                const a = Math.random() * Math.PI * 2;
                const off = 45 + Math.random() * 140;
                this.addTelegraph(
                    player.x + Math.cos(a) * off,
                    player.y + Math.sin(a) * off,
                    72, 48, Math.round(this.damage * 1.1), '💶', 'rgba(241, 196, 15, 0.95)', 'tax_seal', '#fed330'
                );
            }
            if (effects) effects.addComicSplash(this.x, this.y - 52, 'MUNICIPAL FINE! 💶');
        }

        this.moveTowards(dt, dx, dy, dist, 240, arena);
    }

    draw(ctx) {
        if (typeof EndlessBossRenderer !== 'undefined') EndlessBossRenderer.drawDimarchosBoss(ctx, this);
    }
}

class MechaKolossos extends EndlessBossBase {
    constructor(x, y, waveMultiplier = 1.0, extra = {}) {
        super(x, y, 'mecha_kolossos', waveMultiplier, {
            name: 'Kolossos MK-IV',
            hudLabel: extra.hudLabel || '🤖 KOLOSSOS MK-IV [FINAL ENDLESS BOSS] 🤖',
            isMiniBoss: false,
            bossRank: extra.bossRank || 'insane',
            rankColor: extra.rankColor || '#ff2e4c',
            crateId: extra.crateId || 'boss_crate_insane',
            isApex: extra.isApex,
            radius: 56,
            baseHp: 24000,
            speed: 2.65,
            baseDmg: 48,
            xpDrop: 2400,
            scoreValue: 10000,
            goldBonus: 2200,
            xpBonus: 1600
        });
        this.sweepCooldown = 62;
        this.sawCooldown = 140;
        this.gridCooldown = 185;
        this.wellCooldown = 235;
        this.beamCooldown = 290;
        this.orbitalCooldown = 215;
        this.stompCooldown = 160;
        this.criticalTriggered = false;
        this.totalDronesSpawned = 0;

        this.omegaBeam = null;
        this.laserGrids = [];
        this.gravityWells = [];
        this.helixShotsLeft = 0;
        this.helixTick = 0;
        this.helixAngle = 0;
        this._gridFlip = false;

        this.isDying = false;
        this.deathTimer = 0;
        this.maxDeathTimer = 65;
    }

    applyStun(durationSeconds = 2.0, effects = null) {
        if (this.isDying || this.dead) return;
        this.omegaBeam = null;
        super.applyStun(durationSeconds, effects);
    }

    applyFear(durationSeconds = 3.0, effects = null) {
        if (this.isDying || this.dead) return;
        this.omegaBeam = null;
        super.applyFear(durationSeconds, effects);
    }

    takeDamage(amount, effects = null, fromCrit = null, playSound = true) {
        if (this.isDying || this.dead) return false;
        const hit = super.takeDamage(amount, effects, fromCrit, playSound);
        if (this.hp <= 0) {
            this.hp = 0;
            this.dead = false;
            if (!this.isDying) {
                this.isDying = true;
                this.deathTimer = 0;
                this.omegaBeam = null;
                this.laserGrids = [];
                this.gravityWells = [];
                this.telegraphs = [];
                this.helixShotsLeft = 0;
                if (effects) {
                    effects.addShockwave(this.x, this.y, 190, 'rgba(255, 46, 76, 0.95)');
                    effects.addComicSplash(this.x, this.y - 62, '☢️ CORE MELTDOWN! ☢️');
                }
            }
        }
        return hit;
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        if (this.hitFlash > 0) this.hitFlash -= dt;

        if (this.isDying) {
            this.deathTimer += dt;
            if (effects && Math.floor(this.deathTimer) % 5 === 0) {
                const rx = this.x + (Math.random() - 0.5) * 140;
                const ry = this.y + (Math.random() - 0.5) * 140;
                effects.addSparks(rx, ry, '#ff2e4c', 8);
                effects.addSparks(rx, ry, '#fed330', 6);
                effects.addShockwave(rx, ry, 65 + Math.random() * 45, 'rgba(255, 46, 76, 0.88)');
                effects.addLightningChain(this.x, this.y, rx, ry, '#ff4757');
            }
            if (this.deathTimer >= this.maxDeathTimer) {
                this.dead = true;
                for (let i = 0; i < enemies.length; i++) {
                    const e = enemies[i];
                    if (e && !e.dead && e.type === 'kolossos_drone' && e.ownedByBoss === this) {
                        e.dead = true;
                        if (effects) effects.addShockwave(e.x, e.y, 85, 'rgba(255, 46, 76, 0.9)');
                    }
                }
                if (effects) {
                    effects.addShockwave(this.x, this.y, 260, 'rgba(255, 46, 76, 0.96)');
                    effects.addShockwave(this.x, this.y, 185, 'rgba(254, 211, 48, 0.92)');
                    effects.addConfetti(this.x, this.y, 160);
                    effects.addComicSplash(this.x, this.y - 68, '💥 KOLOSSOS ANNIHILATED! 💥');
                    if (typeof effects.triggerScreenFlash === 'function') effects.triggerScreenFlash('#ff4757', 0.36, 26);
                    if (typeof effects.onBossSlam === 'function') effects.onBossSlam(0.09);
                }
            }
            return;
        }

        this.updateDebuffs(dt);
        this.updateTelegraphs(dt, player, effects);
        if (typeof KolossosAttackSystem !== 'undefined') {
            KolossosAttackSystem.updateLaserGrids(this, dt, player, effects);
            KolossosAttackSystem.updateGravityWells(this, dt, player, bullets, effects);
            KolossosAttackSystem.updateOmegaBeam(this, dt, player, effects);
            KolossosAttackSystem.updateSpiralHelix(this, dt, bullets, effects);
        }
        if (!player || player.hp <= 0) return;

        // Phase 2 (<= 55% HP): Crimson Overdrive + Twin Siege Drones + Double Helix Burst
        if (this.checkEnrage(0.55, effects, '🔴 CRIMSON OVERDRIVE! 🔴', 1.28, 'rgba(255, 46, 76, 0.95)')) {
            this.helixShotsLeft = Math.max(this.helixShotsLeft, 22);
            this.helixAngle = this.angle;
            if (effects) {
                if (typeof effects.triggerScreenFlash === 'function') effects.triggerScreenFlash('#ff2e4c', 0.32, 26);
                if (typeof effects.onBossSlam === 'function') effects.onBossSlam(0.065);
            }
            if (typeof KolossosAttackSystem !== 'undefined') {
                KolossosAttackSystem.spawnDrones(this, enemies, effects, 2);
            }
        }

        // Phase 3 (<= 25% HP): Critical Meltdown Protocol
        if (!this.criticalTriggered && this.hp <= this.maxHp * 0.25) {
            this.criticalTriggered = true;
            this.speed = this.baseSpeed * 1.44;
            this.helixShotsLeft = Math.max(this.helixShotsLeft, 26);
            if (effects) {
                effects.addShockwave(this.x, this.y, 200, 'rgba(255, 46, 76, 0.95)');
                effects.addComicSplash(this.x, this.y - 68, '☢️ CRITICAL MELTDOWN! ☢️');
                if (typeof effects.triggerScreenFlash === 'function') effects.triggerScreenFlash('#ff2e4c', 0.34, 24);
                if (typeof effects.onBossSlam === 'function') effects.onBossSlam(0.075);
            }
            if (typeof KolossosAttackSystem !== 'undefined') {
                KolossosAttackSystem.spawnDrones(this, enemies, effects, 2);
            }
        }

        if (this.criticalTriggered && effects && Math.floor(this.age) % 9 === 0) {
            const ang = Math.random() * Math.PI * 2;
            effects.addLightningChain(this.x, this.y, this.x + Math.cos(ang) * 72, this.y + Math.sin(ang) * 72, '#ff2e4c');
        }

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (!this.omegaBeam) this.angle = Math.atan2(dy, dx);

        if (this.sweepCooldown > 0) this.sweepCooldown -= dt;
        if (this.sawCooldown > 0) this.sawCooldown -= dt;
        if (this.gridCooldown > 0) this.gridCooldown -= dt;
        if (this.wellCooldown > 0) this.wellCooldown -= dt;
        if (this.beamCooldown > 0) this.beamCooldown -= dt;
        if (this.orbitalCooldown > 0) this.orbitalCooldown -= dt;
        if (this.stompCooldown > 0) this.stompCooldown -= dt;

        if (!this.omegaBeam) {
            if (this.beamCooldown <= 0 && typeof KolossosAttackSystem !== 'undefined') {
                this.beamCooldown = this.criticalTriggered ? 245 : (this.isEnraged ? 280 : 340);
                KolossosAttackSystem.startOmegaBeam(this, player, effects);
            } else if (this.gridCooldown <= 0 && typeof KolossosAttackSystem !== 'undefined') {
                this.gridCooldown = this.criticalTriggered ? 165 : (this.isEnraged ? 195 : 235);
                KolossosAttackSystem.spawnLaserCrossGrid(this, player, effects, arena);
            } else if (this.wellCooldown <= 0 && typeof KolossosAttackSystem !== 'undefined') {
                this.wellCooldown = this.criticalTriggered ? 210 : (this.isEnraged ? 235 : 285);
                KolossosAttackSystem.spawnSingularityWell(this, player, effects, arena);
            } else if (this.sawCooldown <= 0 && typeof KolossosAttackSystem !== 'undefined') {
                this.sawCooldown = this.isEnraged ? 145 : 185;
                KolossosAttackSystem.fireBoomerangSawFan(this, bullets, effects);
            } else if (this.sweepCooldown <= 0) {
                this.sweepCooldown = this.isEnraged ? 68 : 90;
                const twin = this.isEnraged ? [-0.32, -0.14, 0, 0.14, 0.32] : [-0.24, -0.07, 0.07, 0.24];
                this.fireFan(bullets, this.angle, twin, 12.2, Math.round(this.damage * 0.80), 11, 'kolossos_plasma');
                if (effects) effects.addSparks(this.x, this.y, '#ff6348', 5);
            }

            if (this.orbitalCooldown <= 0) {
                this.orbitalCooldown = this.isEnraged ? 165 : 210;
                const ringCount = this.isEnraged ? 5 : 4;
                for (let i = 0; i < ringCount; i++) {
                    const a = (i / ringCount) * Math.PI * 2 + Math.random() * 0.4;
                    const r = i === 0 ? 12 : (72 + Math.random() * 145);
                    this.addTelegraph(
                        player.x + Math.cos(a) * r,
                        player.y + Math.sin(a) * r,
                        78, 52, Math.round(this.damage * 1.12), '☢️', 'rgba(255, 46, 76, 0.95)', 'orbital_nuke', '#ff4757'
                    );
                }
            }
        }

        if (dist < 145 && this.stompCooldown <= 0) {
            this.stompCooldown = 165;
            if (effects) {
                effects.addShockwave(this.x, this.y, 175, 'rgba(255, 46, 76, 0.94)');
                effects.addComicSplash(this.x, this.y - 44, 'TITAN STOMP!');
                if (typeof effects.onBossSlam === 'function') effects.onBossSlam(0.05);
            }
            player.takeDamage(Math.round(this.damage * 0.92), effects);
        }

        const speedScale = this.omegaBeam ? 0.38 : 1.0;
        this.moveTowards(dt * speedScale, dx, dy, dist, 235, arena);
    }

    draw(ctx) {
        if (typeof EndlessBossRenderer !== 'undefined') EndlessBossRenderer.drawMechaKolossos(ctx, this);
    }
}

if (typeof window !== 'undefined') {
    window.FrappeBaron = FrappeBaron;
    window.DozerForeman = DozerForeman;
    window.DimarchosBoss = DimarchosBoss;
    window.MechaKolossos = MechaKolossos;
}
