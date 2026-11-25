/**
 * Lesa.io - Endless Hard Mode W25 & W35 Mini-Bosses
 * No entrance cutscenes; aggressive Hard Mode combat kits with telegraphs and summons.
 */

class VoidDreadnought extends EndlessBossBase {
    constructor(x, y, waveMultiplier = 1.0, extra = {}) {
        super(x, y, 'void_dreadnought', waveMultiplier, {
            name: 'Xylar Siegebreaker',
            hudLabel: extra.hudLabel || '🌋 XYLAR SIEGEBREAKER [HARD MINI] 🌋',
            isMiniBoss: true,
            bossRank: 'very_hard',
            rankColor: extra.rankColor || '#ff6b35',
            crateId: extra.crateId || 'boss_crate_very_hard',
            radius: 44,
            baseHp: 5200,
            speed: 2.55,
            baseDmg: 45,
            xpDrop: 840,
            scoreValue: 2600,
            goldBonus: 720,
            xpBonus: 540
        });
        this.mortarCooldown = 125;
        this.chargeCooldown = 190;
        this.cannonCooldown = 78;
        this.chargeWindup = 0;
        this.chargeTimer = 0;
        this.chargeAngle = 0;
        this.summoned = false;
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        this.updateTelegraphs(dt, player, effects);
        if (!player || player.hp <= 0) return;

        if (this.checkEnrage(0.50, effects, '🌋 OBSIDIAN CITADEL OVERHEAT! 🌋', 1.28, 'rgba(255, 107, 53, 0.94)') && !this.summoned) {
            this.summoned = true;
            if (typeof ObsidianGolem === 'function') {
                enemies.push(new ObsidianGolem(this.x - 95, this.y + 30, this.waveMultiplier * 0.85));
                enemies.push(new ObsidianGolem(this.x + 95, this.y - 30, this.waveMultiplier * 0.85));
            }
        }

        const dx = player.x - this.x, dy = player.y - this.y, dist = Math.hypot(dx, dy) || 1;
        if (this.chargeWindup > 0) {
            this.chargeWindup -= dt;
            if (this.chargeWindup <= 0) {
                this.chargeTimer = 24;
                if (effects) effects.addShockwave(this.x, this.y, 130, 'rgba(255, 107, 53, 0.9)');
            }
            return;
        }
        if (this.chargeTimer > 0) {
            this.chargeTimer -= dt;
            this.x += Math.cos(this.chargeAngle) * 14.5 * dt;
            this.y += Math.sin(this.chargeAngle) * 14.5 * dt;
            if (Math.floor(this.chargeTimer) % 6 === 0) this.fireFan(bullets, this.chargeAngle, [-0.55, 0, 0.55], 9.2, Math.round(this.damage * 0.72), 11, 'crimson_slash');
            this.applyArenaBounds(arena);
            return;
        }

        this.angle = Math.atan2(dy, dx);
        if (this.mortarCooldown > 0) this.mortarCooldown -= dt;
        if (this.chargeCooldown > 0) this.chargeCooldown -= dt;
        if (this.cannonCooldown > 0) this.cannonCooldown -= dt;

        // 1. Staggered 3-Zone Magma Mortar Salvo
        if (this.mortarCooldown <= 0) {
            this.mortarCooldown = this.isEnraged ? 115 : 150;
            for (const lead of [0, 16, 30]) {
                const tx = player.x + (player.vx || 0) * lead + (Math.random() - 0.5) * 45;
                const ty = player.y + (player.vy || 0) * lead + (Math.random() - 0.5) * 45;
                this.addTelegraph(tx, ty, 92, 46, Math.round(this.damage * 1.15), '🌋', 'rgba(255, 107, 53, 0.94)', 'zeus_storm', '#ff9f43');
            }
        }

        // 2. Bull-Rush Siege Barge
        if (this.chargeCooldown <= 0 && dist < 440) {
            this.chargeCooldown = this.isEnraged ? 145 : 195;
            this.chargeWindup = 26;
            this.chargeAngle = this.angle;
        }

        // 3. Dual Siege Cannon Barrage
        if (this.cannonCooldown <= 0) {
            this.cannonCooldown = this.isEnraged ? 54 : 78;
            const spread = this.isEnraged ? [-0.28, -0.1, 0.1, 0.28] : [-0.14, 0.14];
            this.fireFan(bullets, this.angle, spread, 11.2, Math.round(this.damage * 0.85), 11, 'magma_shard');
        }
        this.moveTowards(dt, dx, dy, dist, 220, arena);
    }

    draw(ctx) {
        if (typeof HardLateMiniBossRenderers !== 'undefined') HardLateMiniBossRenderers.drawDreadnought(ctx, this);
    }
}

class InfernoHydra extends EndlessBossBase {
    constructor(x, y, waveMultiplier = 1.0, extra = {}) {
        super(x, y, 'inferno_hydra', waveMultiplier, {
            name: 'Ignis Twin-Core',
            hudLabel: extra.hudLabel || '🔥 IGNIS TWIN-CORE [HARD MINI] 🔥',
            isMiniBoss: true,
            bossRank: 'insane',
            rankColor: extra.rankColor || '#ffa502',
            crateId: extra.crateId || 'boss_crate_insane',
            radius: 46,
            baseHp: 7400,
            speed: 2.85,
            baseDmg: 48,
            xpDrop: 1120,
            scoreValue: 3400,
            goldBonus: 920,
            xpBonus: 700
        });
        this.sweepCooldown = 88;
        this.carpetCooldown = 148;
        this.dashCooldown = 195;
        this.dashTimer = 0;
        this.dashAngle = 0;
        this.summoned = false;
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        this.updateTelegraphs(dt, player, effects);
        if (!player || player.hp <= 0) return;

        if (this.checkEnrage(0.50, effects, '🔥 TWIN-CORE MELTDOWN! 🔥', 1.32, 'rgba(255, 165, 2, 0.95)') && !this.summoned) {
            this.summoned = true;
            if (typeof InfernoArtillery === 'function') {
                enemies.push(new InfernoArtillery(this.x - 105, this.y + 40, this.waveMultiplier * 0.85));
                enemies.push(new InfernoArtillery(this.x + 105, this.y - 40, this.waveMultiplier * 0.85));
            }
            for (let k = 0; k < 10; k++) this.fireFan(bullets, (k / 10) * Math.PI * 2, [0], 9.8, Math.round(this.damage * 0.8), 10, 'magma_shard');
        }

        const dx = player.x - this.x, dy = player.y - this.y, dist = Math.hypot(dx, dy) || 1;
        if (this.dashTimer > 0) {
            this.dashTimer -= dt;
            this.x += Math.cos(this.dashAngle) * 13.5 * dt;
            this.y += Math.sin(this.dashAngle) * 13.5 * dt;
            if (Math.floor(this.dashTimer) % 5 === 0) {
                this.addTelegraph(this.x, this.y, 74, 34, Math.round(this.damage * 0.9), '💥', 'rgba(255, 99, 72, 0.92)', 'orbital_nuke', '#fed330');
            }
            this.applyArenaBounds(arena);
            return;
        }

        this.angle = Math.atan2(dy, dx);
        if (this.sweepCooldown > 0) this.sweepCooldown -= dt;
        if (this.carpetCooldown > 0) this.carpetCooldown -= dt;
        if (this.dashCooldown > 0) this.dashCooldown -= dt;

        // 1. Twin Sweeping Flame Stream
        if (this.sweepCooldown <= 0) {
            this.sweepCooldown = this.isEnraged ? 58 : 84;
            this.fireFan(bullets, this.angle - 0.16, [-0.12, 0, 0.12], 11.8, Math.round(this.damage * 0.80), 10, 'magma_shard');
            this.fireFan(bullets, this.angle + 0.16, [-0.12, 0, 0.12], 11.8, Math.round(this.damage * 0.80), 10, 'crimson_slash');
        }

        // 2. 4-Zone Carpet Bombardment
        if (this.carpetCooldown <= 0) {
            this.carpetCooldown = this.isEnraged ? 115 : 155;
            for (let i = 0; i < 4; i++) {
                const a = (i / 4) * Math.PI * 2 + this.age * 0.05;
                this.addTelegraph(player.x + Math.cos(a) * 110, player.y + Math.sin(a) * 110, 86, 44, Math.round(this.damage * 1.15), '🔥', 'rgba(255, 71, 87, 0.94)', 'orbital_nuke', '#ffa502');
            }
        }

        // 3. Trailing Fire Dash
        if (this.dashCooldown <= 0) {
            this.dashCooldown = this.isEnraged ? 150 : 200;
            this.dashTimer = 22;
            this.dashAngle = this.angle + (Math.random() - 0.5) * 0.5;
        }
        this.moveTowards(dt, dx, dy, dist, 240, arena);
    }

    draw(ctx) {
        if (typeof HardLateMiniBossRenderers !== 'undefined') HardLateMiniBossRenderers.drawInfernoHydra(ctx, this);
    }
}

if (typeof window !== 'undefined') {
    window.VoidDreadnought = VoidDreadnought;
    window.InfernoHydra = InfernoHydra;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { VoidDreadnought, InfernoHydra };
