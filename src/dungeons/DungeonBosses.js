/**
 * Lesa.io - Mount Olympus Late Stage Bosses (Floors 3 & 4)
 * Floors 1 & 2 (CasillasSentinel, RavineChieftain) live in OlympusEarlyBosses.js.
 * 3. FrostTitanBoreas (Floor 3): Glacial colossus with cryo breath, glacial slam, frost eruptions & 25% Absolute Zero.
 * 4. KiloumpasBerserker (Floor 4): Glacial alpine berserker with carbine burst, multi-boulder toss & Avalanche Crush slam.
 */

function renderFloorBossHUD(ctx, boss, color = '#f1c40f', barW = 60) {
    if (typeof drawDungeonBossHUD === 'function') {
        drawDungeonBossHUD(ctx, boss, color, barW);
    }
}

class FrostTitanBoreas extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0) {
        super(x, y, 'frost_titan', waveMultiplier);
        this.name = 'Boreas the Frost Titan';
        this.isBoss = true;
        this.radius = 48;
        this.maxHp = Math.round(5400 * Math.max(1.0, waveMultiplier));
        this.hp = this.maxHp;
        this.baseSpeed = 2.3;
        this.speed = this.baseSpeed;
        this.damage = Math.round(43 * Math.max(1.0, waveMultiplier * 0.7));
        this.xpDrop = 550;
        this.scoreValue = 1500;
        this.slamTimer = 165;
        this.breathTimer = 90;
        this.frostGeyserTimer = 140;
        this.frostZones = [];
        this.howlTriggered = false;
        this.absoluteZeroTriggered = false;
        this.isAbsoluteZero = false;
        this.frostArmorTimer = 0;
    }

    takeDamage(amount, effects = null, fromCrit = null, playSound = true) {
        let finalAmt = amount;
        if (this.frostArmorTimer > 0) {
            finalAmt = Math.max(1, Math.round(amount * 0.6));
            if (effects) effects.addSparks(this.x, this.y, '#81ecec', 4);
        }
        return super.takeDamage(finalAmt, effects, fromCrit, playSound);
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        if (this.hitFlash > 0) this.hitFlash -= dt;
        if (this.frostArmorTimer > 0) this.frostArmorTimer = Math.max(0, this.frostArmorTimer - dt);
        this.updateFrostZones(dt, player, bullets, effects);
        if (this.updateStun(dt, effects)) return;
        if (!player || player.hp <= 0) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);

        this.x += (dx / dist) * this.speed * dt;
        this.y += (dy / dist) * this.speed * dt;
        this.applyArenaBounds(arena);

        this.breathTimer -= dt;
        if (this.breathTimer <= 0) {
            this.breathTimer = (this.isAbsoluteZero ? 78 : 105) + Math.random() * 35;
            this.fireCryoBreath(bullets, effects);
        }

        this.slamTimer -= dt;
        if (this.slamTimer <= 0) {
            this.slamTimer = (this.isAbsoluteZero ? 145 : 195) + Math.random() * 45;
            this.executeGlacialSlam(bullets, effects);
        }

        this.frostGeyserTimer -= dt;
        if (this.frostGeyserTimer <= 0) {
            this.frostGeyserTimer = (this.isAbsoluteZero ? 145 : 205) + Math.random() * 40;
            this.triggerFrostEruption(player, effects, arena);
        }

        if (!this.howlTriggered && this.hp <= this.maxHp * 0.5) {
            this.howlTriggered = true;
            if (effects) {
                effects.addShockwave(this.x, this.y, 145, 'rgba(116, 185, 255, 0.9)');
                effects.addComicSplash(this.x, this.y - 45, '❄️ WINTER HOWL!');
            }
            if (typeof FrostWolf !== 'undefined') {
                enemies.push(new FrostWolf(this.x + 60, this.y + 30, this.waveMultiplier));
            }
        }

        if (!this.absoluteZeroTriggered && this.hp <= this.maxHp * 0.25) {
            this.executeAbsoluteZero(player, enemies, bullets, effects);
        }
    }

    fireCryoBreath(bullets, effects) {
        if (typeof Bullet === 'undefined') return;
        for (let i = 0; i < 5; i++) {
            const a = this.angle + (i - 2) * 0.15;
            const b = new Bullet(this.x, this.y, Math.cos(a) * 7.2, Math.sin(a) * 7.2, Math.round(this.damage * 0.8), 7.2, 10, 'boreas_frost_lance', true);
            b.color = '#00d2d3';
            b.frostChillFrames = 85;
            bullets.push(b);
        }
        if (effects) effects.addSparks(this.x, this.y, '#74b9ff', 10);
    }

    executeGlacialSlam(bullets, effects) {
        if (effects) {
            effects.addShockwave(this.x, this.y, 130, 'rgba(0, 206, 201, 0.88)');
            effects.addComicSplash(this.x, this.y - 35, '💥 GLACIAL SLAM!');
            if (typeof effects.onBossSlam === 'function') effects.onBossSlam(0.05);
        }
        if (typeof Bullet === 'undefined') return;
        const count = this.isAbsoluteZero ? 12 : 10;
        for (let i = 0; i < count; i++) {
            const a = (i / count) * Math.PI * 2;
            const b = new Bullet(this.x, this.y, Math.cos(a) * 6.4, Math.sin(a) * 6.4, Math.round(this.damage * 0.85), 6.4, 10, 'boreas_frost_lance', true);
            b.color = '#74b9ff';
            b.frostChillFrames = 85;
            bullets.push(b);
        }
    }

    triggerFrostEruption(player, effects, arena) {
        if (!player) return;
        if (effects) {
            effects.addComicSplash(this.x, this.y - 42, '❄️ PERMAFROST SPIKES!');
            effects.addSparks(this.x, this.y, '#81ecec', 10);
        }
        const b = arena && arena.dungeonBounds ? arena.dungeonBounds : null;
        const minX = b ? b.minX + 65 : (arena ? -arena.halfWidth + 65 : -900);
        const maxX = b ? b.maxX - 65 : (arena ? arena.halfWidth - 65 : 900);
        const minY = b ? b.minY + 65 : (arena ? -arena.halfHeight + 65 : -900);
        const maxY = b ? b.maxY - 65 : (arena ? arena.halfHeight - 65 : 900);

        const offsets = this.isAbsoluteZero
            ? [{ x: 0, y: 0 }, { x: 120, y: -40 }, { x: -120, y: -40 }, { x: 0, y: 115 }]
            : [{ x: 0, y: 0 }, { x: 110, y: 55 }, { x: -110, y: 55 }];
        for (const off of offsets) {
            const zx = Math.max(minX, Math.min(maxX, player.x + off.x));
            const zy = Math.max(minY, Math.min(maxY, player.y + off.y));
            this.frostZones.push({ x: zx, y: zy, radius: 64, timer: 50, maxTimer: 50 });
        }
    }

    updateFrostZones(dt, player, bullets, effects) {
        for (let i = this.frostZones.length - 1; i >= 0; i--) {
            const z = this.frostZones[i];
            z.timer -= dt;
            if (z.timer > 0) continue;

            if (effects) {
                effects.addShockwave(z.x, z.y, z.radius * 1.35, 'rgba(129, 236, 236, 0.92)');
                effects.addSparks(z.x, z.y, '#81ecec', 12);
                effects.addSparks(z.x, z.y, '#ffffff', 6);
            }
            if (player && player.hp > 0 && Math.hypot(player.x - z.x, player.y - z.y) <= z.radius + player.radius) {
                player.takeDamage(Math.round(this.damage * 0.85), effects);
                player.speedDebuffTimer = Math.max(player.speedDebuffTimer || 0, 120);
            }
            if (typeof Bullet !== 'undefined' && bullets) {
                for (let k = 0; k < 4; k++) {
                    const a = (Math.PI / 4) + (k * Math.PI / 2);
                    const s = new Bullet(z.x, z.y, Math.cos(a) * 7.4, Math.sin(a) * 7.4, Math.round(this.damage * 0.7), 7.4, 10, 'boreas_icicle_shard', true, 1, 0, 520);
                    s.color = '#81ecec';
                    s.frostChillFrames = 90;
                    bullets.push(s);
                }
            }
            this.frostZones.splice(i, 1);
        }
    }

    executeAbsoluteZero(player, enemies, bullets, effects) {
        this.absoluteZeroTriggered = true;
        this.isAbsoluteZero = true;
        this.frostArmorTimer = 240;
        this.speed = this.baseSpeed * 1.35;

        if (effects) {
            effects.addShockwave(this.x, this.y, 220, 'rgba(129, 236, 236, 0.96)');
            effects.addSparks(this.x, this.y, '#ffffff', 18);
            effects.addComicSplash(this.x, this.y - 52, '🥶 ABSOLUTE ZERO!');
            if (typeof effects.onBossSlam === 'function') effects.onBossSlam(0.065);
        }
        if (player && player.hp > 0) {
            const dist = Math.hypot(player.x - this.x, player.y - this.y);
            if (dist <= 240) {
                player.speedDebuffTimer = Math.max(player.speedDebuffTimer || 0, 150);
                if (dist <= 170) player.takeDamage(Math.round(this.damage * 0.7), effects);
            }
        }
        if (typeof Bullet !== 'undefined' && bullets) {
            for (let i = 0; i < 16; i++) {
                const a = (i / 16) * Math.PI * 2;
                const b = new Bullet(this.x, this.y, Math.cos(a) * 6.8, Math.sin(a) * 6.8, Math.round(this.damage * 0.8), 6.8, 10, 'boreas_frost_lance', true);
                b.color = '#81ecec';
                b.frostChillFrames = 100;
                bullets.push(b);
            }
        }
        if (typeof IceGolem !== 'undefined' && Array.isArray(enemies)) {
            enemies.push(new IceGolem(this.x - 80, this.y + 30, this.waveMultiplier));
        }
    }

    draw(ctx) {
        if (typeof OlympusBossRenderer !== 'undefined') {
            if (typeof OlympusBossRenderer.drawFrostZones === 'function') {
                OlympusBossRenderer.drawFrostZones(this, ctx);
            }
            OlympusBossRenderer.drawFrostTitanBoreas(this, ctx);
        }
        const hudColor = this.frostArmorTimer > 0 ? '#dff9fb' : (this.isAbsoluteZero ? '#00f5ff' : '#00cec9');
        drawDungeonBossHUD(ctx, this, hudColor, 76);
    }
}

class KiloumpasBerserker extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0) {
        super(x, y, 'kiloumpas_berserker', waveMultiplier);
        this.name = 'Kiloumpas Berserker';
        this.isBoss = true;
        this.radius = 42;
        this.maxHp = Math.round(9200 * Math.max(1.0, waveMultiplier));
        this.hp = this.maxHp;
        this.baseSpeed = 2.95;
        this.speed = this.baseSpeed;
        this.damage = Math.round(56 * Math.max(1.0, waveMultiplier * 0.7));
        this.xpDrop = 780;
        this.scoreValue = 2500;
        this.burstTimer = 65;
        this.isEnraged = false;
        this.boulderTimer = 140;

        // Special Ability: Avalanche Crush (Telegraphed Leap Slam + Cross Rolling Boulders)
        this.avalancheTimer = 140;
        this.avalancheWindup = 0;
        this.avalancheDuration = 34;
        this.avalancheStartX = x;
        this.avalancheStartY = y;
        this.avalancheTargetX = x;
        this.avalancheTargetY = y;
        this.jumpLift = 0;
    }

    startAvalancheCrush(player, effects, arena) {
        this.avalancheWindup = this.avalancheDuration;
        this.avalancheTimer = this.isEnraged ? 135 : 185;
        this.avalancheStartX = this.x;
        this.avalancheStartY = this.y;

        let tx = player.x;
        let ty = player.y;
        if (arena) {
            const b = arena.dungeonBounds;
            const m = this.radius + 10;
            const minX = (b ? b.minX : -arena.halfWidth) + m;
            const maxX = (b ? b.maxX : arena.halfWidth) - m;
            const minY = (b ? b.minY : -arena.halfHeight) + m;
            const maxY = (b ? b.maxY : arena.halfHeight) - m;
            tx = Math.max(minX, Math.min(maxX, tx));
            ty = Math.max(minY, Math.min(maxY, ty));
        }
        this.avalancheTargetX = tx;
        this.avalancheTargetY = ty;

        if (effects) {
            effects.addComicSplash(this.x, this.y - 38, '⛰️ AVALANCHE CRUSH!');
            effects.addDust(this.x, this.y, 12, 18);
        }
    }

    executeAvalancheImpact(player, bullets, effects, arena) {
        this.jumpLift = 0;
        this.x = this.avalancheTargetX;
        this.y = this.avalancheTargetY;
        this.applyArenaBounds(arena);

        const impactRadius = 145;
        if (player && player.hp > 0 && Math.hypot(player.x - this.x, player.y - this.y) <= impactRadius) {
            player.takeDamage(Math.round(this.damage * 1.45), effects);
        }

        if (typeof Bullet !== 'undefined') {
            for (let i = 0; i < 4; i++) {
                const ba = this.angle + (i * Math.PI * 0.5);
                const b = new Bullet(this.x, this.y, Math.cos(ba) * 7.6, Math.sin(ba) * 7.6, Math.round(this.damage * 1.25), 7.6, 17, 'berserker_alpine_boulder', true);
                b.color = '#74b9ff';
                bullets.push(b);
            }
        }

        if (effects) {
            effects.addShockwave(this.x, this.y, 155, 'rgba(235, 77, 75, 0.95)');
            effects.addDust(this.x, this.y, 18, 28);
            effects.addSparks(this.x, this.y, '#ff6b6b', 14);
        }
        if (typeof window !== 'undefined' && window.gameInstance && window.gameInstance.camera && typeof window.gameInstance.camera.onBossSlam === 'function') {
            window.gameInstance.camera.onBossSlam(0.06);
        }
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        if (this.hitFlash > 0) this.hitFlash -= dt;
        if (this.updateStun(dt, effects)) return;
        if (!player || player.hp <= 0) return;

        if (!this.isEnraged && this.hp <= this.maxHp * 0.5) {
            this.isEnraged = true;
            this.speed = this.baseSpeed * 1.5;
            if (effects) {
                effects.addShockwave(this.x, this.y, 115, 'rgba(235, 77, 75, 0.9)');
                effects.addComicSplash(this.x, this.y - 35, '😡 BERSERK RAGE!');
            }
            if (this.avalancheWindup <= 0) {
                this.startAvalancheCrush(player, effects, arena);
            }
        }

        if (this.avalancheWindup > 0) {
            this.avalancheWindup -= dt;
            const prog = Math.min(1, Math.max(0, 1 - (this.avalancheWindup / this.avalancheDuration)));
            this.x = this.avalancheStartX + (this.avalancheTargetX - this.avalancheStartX) * prog;
            this.y = this.avalancheStartY + (this.avalancheTargetY - this.avalancheStartY) * prog;
            this.jumpLift = Math.sin(prog * Math.PI) * 34;
            this.angle = Math.atan2(this.avalancheTargetY - this.avalancheStartY, this.avalancheTargetX - this.avalancheStartX);
            if (this.avalancheWindup <= 0) {
                this.executeAvalancheImpact(player, bullets, effects, arena);
            }
            return;
        }

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);

        this.x += (dx / dist) * this.speed * dt;
        this.y += (dy / dist) * this.speed * dt;
        this.applyArenaBounds(arena);

        this.avalancheTimer -= dt;
        if (this.avalancheTimer <= 0 && dist < 440) {
            this.startAvalancheCrush(player, effects, arena);
            return;
        }

        this.burstTimer -= dt;
        if (this.burstTimer <= 0) {
            this.burstTimer = (this.isEnraged ? 48 : 75) + Math.random() * 20;
            this.fireCarbineBurst(bullets, effects);
        }

        this.boulderTimer -= dt;
        if (this.boulderTimer <= 0) {
            this.boulderTimer = (this.isEnraged ? 125 : 155) + Math.random() * 35;
            if (typeof Bullet !== 'undefined') {
                const bAngles = this.isEnraged
                    ? [this.angle - 0.24, this.angle, this.angle + 0.24]
                    : [this.angle - 0.16, this.angle + 0.16];
                for (const ba of bAngles) {
                    const b = new Bullet(this.x, this.y, Math.cos(ba) * 7.4, Math.sin(ba) * 7.4, Math.round(this.damage * 1.28), 7.4, 16, 'berserker_alpine_boulder', true);
                    b.color = '#74b9ff';
                    bullets.push(b);
                }
                if (effects) effects.addComicSplash(this.x, this.y - 25, '🪨 BOULDER!');
            }
        }
    }

    fireCarbineBurst(bullets, effects) {
        if (typeof Bullet === 'undefined') return;
        const baseA = this.angle;
        const rounds = this.isEnraged ? 5 : 4;
        for (let i = 0; i < rounds; i++) {
            setTimeout(() => {
                if (this.dead) return;
                const a = baseA + (Math.random() - 0.5) * 0.12;
                bullets.push(new Bullet(this.x, this.y, Math.cos(a) * 11.2, Math.sin(a) * 11.2, Math.round(this.damage * 0.88), 11.2, 8, 'berserker_frost_round', true));
            }, i * 95);
        }
        if (effects) effects.addDust(this.x, this.y, 8, 14);
    }

    draw(ctx) {
        if (this.avalancheWindup > 0) {
            const prog = 1 - Math.max(0, this.avalancheWindup / this.avalancheDuration);
            if (typeof BossTelegraphFX !== 'undefined') {
                BossTelegraphFX.drawZones(ctx, [{ x: this.avalancheTargetX, y: this.avalancheTargetY, radius: 145, progress: prog }], 'avalanche_target');
            } else {
                ctx.save();
                ctx.fillStyle = `rgba(235, 77, 75, ${0.14 + prog * 0.24})`;
                ctx.strokeStyle = 'rgba(255, 107, 107, 0.9)';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(this.avalancheTargetX, this.avalancheTargetY, 145, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(this.avalancheTargetX, this.avalancheTargetY, Math.max(12, 145 * (1 - prog)), 0, Math.PI * 2);
                ctx.strokeStyle = '#ffdd59';
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.restore();
            }
        }

        if (typeof OlympusBossRenderer !== 'undefined') {
            ctx.save();
            if (this.jumpLift > 0) ctx.translate(0, -this.jumpLift);
            OlympusBossRenderer.drawKiloumpasBerserker(this, ctx);
            ctx.restore();
        }
        renderFloorBossHUD(ctx, this, this.isEnraged ? '#ff4757' : '#e67e22', 75);
    }
}

if (typeof window !== 'undefined') {
    window.FrostTitanBoreas = FrostTitanBoreas;
    window.KiloumpasBerserker = KiloumpasBerserker;
}

if (typeof module !== 'undefined' && module.exports) {
    let early = {};
    try {
        early = (typeof require !== 'undefined') ? require('./OlympusEarlyBosses.js') : {};
    } catch (_) {
        early = {};
    }
    module.exports = {
        CasillasSentinel: (typeof CasillasSentinel !== 'undefined') ? CasillasSentinel : early.CasillasSentinel,
        RavineChieftain: (typeof RavineChieftain !== 'undefined') ? RavineChieftain : early.RavineChieftain,
        FrostTitanBoreas,
        KiloumpasBerserker
    };
}
