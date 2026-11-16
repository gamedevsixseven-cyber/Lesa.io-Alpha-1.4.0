/**
 * Lesa.io - Mount Olympus Early Stage Bosses (Floors 1 & 2)
 * Modularized to keep boss files concise while expanding abilities:
 * 1. CasillasSentinel (Floor 1): Golden Parry Stance + 5-Ball Penalty Volley + Slide Tackle.
 * 2. RavineChieftain (Floor 2): Phantom Gorge Ambush + Venom Trap Zones + 8-Dagger Nova.
 */

function drawDungeonBossHUD(ctx, boss, color = '#f1c40f', barW = 60) {
    const hudY = boss.y - (boss.radius + 26);
    ctx.save();
    ctx.font = '800 13px "Luckiest Guy", cursive, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#101014';
    ctx.strokeText(boss.name, boss.x, hudY - 4);
    ctx.fillStyle = color;
    ctx.fillText(boss.name, boss.x, hudY - 4);

    const h = 6;
    const hpR = Math.max(0, boss.hp / boss.maxHp);
    ctx.fillStyle = '#1e272e';
    ctx.fillRect(boss.x - barW / 2, hudY, barW, h);
    ctx.fillStyle = color;
    ctx.fillRect(boss.x - barW / 2, hudY, barW * hpR, h);
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(boss.x - barW / 2, hudY, barW, h);
    ctx.restore();
}

function clampPointToArena(x, y, margin, arena) {
    if (!arena) return { x, y };
    const b = arena.dungeonBounds;
    const minX = (b ? b.minX : -arena.halfWidth) + margin;
    const maxX = (b ? b.maxX : arena.halfWidth) - margin;
    const minY = (b ? b.minY : -arena.halfHeight) + margin;
    const maxY = (b ? b.maxY : arena.halfHeight) - margin;
    return {
        x: Math.max(minX, Math.min(maxX, x)),
        y: Math.max(minY, Math.min(maxY, y))
    };
}

class CasillasSentinel extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0) {
        super(x, y, 'casillas_sentinel', waveMultiplier);
        this.name = 'Casillas Sentinel';
        this.isBoss = true;
        this.isMiniBoss = true;
        this.radius = 36;
        this.maxHp = Math.round(3100 * Math.max(1.0, waveMultiplier));
        this.hp = this.maxHp;
        this.baseSpeed = 3.25;
        this.speed = this.baseSpeed;
        this.damage = Math.round(36 * Math.max(1.0, waveMultiplier * 0.7));
        this.xpDrop = 320;
        this.scoreValue = 750;

        this.shootTimer = 75;
        this.slideDashTimer = 150;
        this.isDashing = false;
        this.dashDuration = 0;
        this.dashVx = 0;
        this.dashVy = 0;

        // Special Ability: Golden Parry Stance + 5-Ball Penalty Volley
        this.parryCooldown = 145;
        this.parryTimer = 0;
        this.hasPhase2Parry = false;
        this.volleyFiredInParry = false;
    }

    takeDamage(amount, effects = null, fromCrit = null, playSound = true) {
        if (this.parryTimer > 0) {
            // Golden Parry halves incoming damage while stance is active
            const reduced = Math.max(1, Math.round(amount * 0.5));
            if (effects) effects.addSparks(this.x, this.y, '#f1c40f', 4);
            return super.takeDamage(reduced, effects, fromCrit, playSound);
        }
        return super.takeDamage(amount, effects, fromCrit, playSound);
    }

    triggerGoldenParry(effects) {
        this.parryTimer = 72;
        this.parryCooldown = (this.hp <= this.maxHp * 0.5) ? 185 : 225;
        this.volleyFiredInParry = false;
        if (effects) {
            effects.addShockwave(this.x, this.y, 95, 'rgba(241, 196, 15, 0.9)');
            effects.addComicSplash(this.x, this.y - 38, '🧤 GOLDEN PARRY!');
        }
    }

    firePenaltyVolley(bullets, effects) {
        if (typeof Bullet === 'undefined') return;
        const spread = [-0.44, -0.22, 0, 0.22, 0.44];
        for (const offset of spread) {
            const a = this.angle + offset;
            const b = new Bullet(
                this.x,
                this.y,
                Math.cos(a) * 9.2,
                Math.sin(a) * 9.2,
                Math.round(this.damage * 1.05),
                9.2,
                12,
                'sentinel_golden_ball',
                true
            );
            b.maxBounces = 2;
            b.bouncesLeft = 2;
            bullets.push(b);
        }
        if (effects) {
            effects.addShockwave(this.x, this.y, 75, 'rgba(241, 196, 15, 0.75)');
            effects.addComicSplash(this.x, this.y - 32, '⚽ PENALTY VOLLEY!');
        }
    }

    startSlideTackle(dx, dy, dist, effects) {
        this.isDashing = true;
        this.dashDuration = 28;
        const dashSpeed = 10.8;
        this.dashVx = (dx / dist) * dashSpeed;
        this.dashVy = (dy / dist) * dashSpeed;
        if (effects) {
            effects.addShockwave(this.x, this.y, 75, 'rgba(241, 196, 15, 0.75)');
            effects.addComicSplash(this.x, this.y - 30, '⚡ SLIDE TACKLE!');
        }
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        if (this.hitFlash > 0) this.hitFlash -= dt;
        if (this.updateStun(dt, effects)) return;
        if (!player || player.hp <= 0) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);

        if (!this.hasPhase2Parry && this.hp <= this.maxHp * 0.6 && this.parryTimer <= 0) {
            this.hasPhase2Parry = true;
            this.triggerGoldenParry(effects);
        }

        if (this.parryTimer > 0) {
            this.parryTimer -= dt;
            if (!this.volleyFiredInParry && this.parryTimer <= 42) {
                this.volleyFiredInParry = true;
                this.firePenaltyVolley(bullets, effects);
                if (dist > 120) this.startSlideTackle(dx, dy, dist, effects);
            }
        }

        if (this.isDashing) {
            this.dashDuration -= dt;
            this.x += this.dashVx * dt;
            this.y += this.dashVy * dt;
            if (effects && Math.random() < 0.4) {
                effects.addDust(this.x, this.y, 4, 8);
                effects.addSparks(this.x, this.y, '#f1c40f', 2);
            }
            if (dist < this.radius + player.radius) {
                player.takeDamage(this.damage * 1.4, effects);
                this.isDashing = false;
            }
            if (this.dashDuration <= 0) this.isDashing = false;
            this.applyArenaBounds(arena);
            return;
        }

        const targetDist = 250;
        if (dist > targetDist) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        } else if (dist < 155) {
            this.x -= (dx / dist) * this.speed * 0.85 * dt;
            this.y -= (dy / dist) * this.speed * 0.85 * dt;
        }
        this.applyArenaBounds(arena);

        this.parryCooldown -= dt;
        if (this.parryCooldown <= 0 && this.parryTimer <= 0) {
            this.triggerGoldenParry(effects);
        }

        this.shootTimer -= dt;
        if (this.shootTimer <= 0) {
            this.shootTimer = 78 + Math.random() * 25;
            this.fireSoccerPair(bullets, effects);
        }

        this.slideDashTimer -= dt;
        if (this.slideDashTimer <= 0 && dist > 130 && dist < 500) {
            this.slideDashTimer = 150 + Math.random() * 50;
            this.startSlideTackle(dx, dy, dist, effects);
        }
    }

    fireSoccerPair(bullets, effects) {
        if (typeof Bullet === 'undefined') return;
        const angles = (this.hp <= this.maxHp * 0.5)
            ? [this.angle - 0.30, this.angle - 0.10, this.angle + 0.10, this.angle + 0.30]
            : [this.angle - 0.22, this.angle, this.angle + 0.22];
        for (const a of angles) {
            const b = new Bullet(this.x, this.y, Math.cos(a) * 8.8, Math.sin(a) * 8.8, Math.round(this.damage * 0.95), 8.8, 11, 'sentinel_match_ball', true);
            b.maxBounces = 1;
            b.bouncesLeft = 1;
            bullets.push(b);
        }
        if (effects) effects.addDust(this.x, this.y, 6, 10);
    }

    draw(ctx) {
        if (this.parryTimer > 0) {
            ctx.save();
            const pulse = 0.72 + Math.sin(this.age * 0.3) * 0.22;
            const ringR = this.radius + 18;
            ctx.translate(this.x, this.y);
            ctx.rotate(this.age * 0.08);
            ctx.strokeStyle = `rgba(241, 196, 15, ${pulse})`;
            ctx.fillStyle = 'rgba(241, 196, 15, 0.16)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                const px = Math.cos(a) * ringR;
                const py = Math.sin(a) * ringR;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
        if (typeof OlympusBossRenderer !== 'undefined') {
            OlympusBossRenderer.drawCasillasSentinel(this, ctx);
        }
        drawDungeonBossHUD(ctx, this, this.parryTimer > 0 ? '#ffeaa7' : '#f1c40f', 58);
    }
}

class RavineChieftain extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0) {
        super(x, y, 'ravine_chieftain', waveMultiplier);
        this.name = 'Ravine Chieftain';
        this.isBoss = true;
        this.isMiniBoss = true;
        this.radius = 38;
        this.maxHp = Math.round(4650 * Math.max(1.0, waveMultiplier));
        this.hp = this.maxHp;
        this.baseSpeed = 3.35;
        this.speed = this.baseSpeed;
        this.damage = Math.round(42 * Math.max(1.0, waveMultiplier * 0.7));
        this.xpDrop = 420;
        this.scoreValue = 1100;

        this.daggerTimer = 65;
        this.smokeBlinkTimer = 155;
        this.whirlwindTimer = 165;
        this.isWhirlwind = false;
        this.whirlwindDuration = 0;

        // Special Ability: Phantom Gorge Ambush + 3 Timed Venom Traps + 8-Dagger Nova
        this.ambushCooldown = 145;
        this.ambushWindup = 0;
        this.ambushTargetX = x;
        this.ambushTargetY = y;
        this.hasPhase2Ambush = false;
        this.poisonZones = [];
    }

    takeDamage(amount, effects = null, fromCrit = null, playSound = true) {
        if (this.ambushWindup > 0) {
            const reduced = Math.max(1, Math.round(amount * 0.55));
            if (effects) effects.addSparks(this.x, this.y, '#9b59b6', 4);
            return super.takeDamage(reduced, effects, fromCrit, playSound);
        }
        return super.takeDamage(amount, effects, fromCrit, playSound);
    }

    startPhantomAmbush(player, effects, arena) {
        this.ambushWindup = 24;
        this.ambushCooldown = (this.hp <= this.maxHp * 0.5) ? 175 : 215;
        const behindA = (player.angle || 0) + Math.PI;
        const rawX = player.x + Math.cos(behindA) * 140;
        const rawY = player.y + Math.sin(behindA) * 140;
        const clamped = clampPointToArena(rawX, rawY, this.radius + 10, arena);
        this.ambushTargetX = clamped.x;
        this.ambushTargetY = clamped.y;
        if (effects) {
            effects.addDust(this.x, this.y, 12, 18);
            effects.addComicSplash(this.x, this.y - 34, '🗡️ PHANTOM AMBUSH!');
        }
    }

    executePhantomAmbush(player, bullets, effects, arena) {
        if (effects) effects.addDust(this.x, this.y, 14, 22);
        this.x = this.ambushTargetX;
        this.y = this.ambushTargetY;
        this.applyArenaBounds(arena);

        // 8-dagger 360 degree venom nova
        if (typeof Bullet !== 'undefined') {
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                const b = new Bullet(this.x, this.y, Math.cos(a) * 8.6, Math.sin(a) * 8.6, Math.round(this.damage * 0.9), 8.6, 10, 'chieftain_venom_dagger', true);
                b.color = '#9b59b6';
                bullets.push(b);
            }
        }

        // Plant 3 timed Venom Trap Zones around player
        for (let i = 0; i < 3; i++) {
            const ta = (player.angle || 0) + (i * (Math.PI * 2 / 3));
            const rawX = player.x + Math.cos(ta) * 110;
            const rawY = player.y + Math.sin(ta) * 110;
            const clamped = clampPointToArena(rawX, rawY, 72, arena);
            this.poisonZones.push({ x: clamped.x, y: clamped.y, radius: 72, age: 0, maxAge: 48 });
        }

        if (effects) {
            effects.addShockwave(this.x, this.y, 95, 'rgba(155, 89, 182, 0.9)');
            effects.addSparks(this.x, this.y, '#a29bfe', 10);
        }
    }

    updatePoisonZones(dt, player, effects) {
        for (let i = this.poisonZones.length - 1; i >= 0; i--) {
            const z = this.poisonZones[i];
            z.age += dt;
            if (z.age >= z.maxAge) {
                if (player && player.hp > 0 && Math.hypot(player.x - z.x, player.y - z.y) <= z.radius + (player.radius * 0.4)) {
                    player.takeDamage(Math.round(this.damage * 1.15), effects);
                }
                if (effects) {
                    effects.addShockwave(z.x, z.y, z.radius, 'rgba(155, 89, 182, 0.88)');
                    effects.addSparks(z.x, z.y, '#9b59b6', 10);
                }
                this.poisonZones.splice(i, 1);
            }
        }
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        if (this.hitFlash > 0) this.hitFlash -= dt;
        if (this.updateStun(dt, effects)) return;
        if (!player || player.hp <= 0) return;

        this.updatePoisonZones(dt, player, effects);

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);

        if (!this.hasPhase2Ambush && this.hp <= this.maxHp * 0.5 && this.ambushWindup <= 0) {
            this.hasPhase2Ambush = true;
            this.startPhantomAmbush(player, effects, arena);
        }

        if (this.ambushWindup > 0) {
            this.ambushWindup -= dt;
            if (effects && Math.random() < 0.45) effects.addSparks(this.x, this.y, '#9b59b6', 2);
            if (this.ambushWindup <= 0) {
                this.executePhantomAmbush(player, bullets, effects, arena);
            }
            return;
        }

        if (this.isWhirlwind) {
            this.whirlwindDuration -= dt;
            this.x += (dx / dist) * this.speed * 1.65 * dt;
            this.y += (dy / dist) * this.speed * 1.65 * dt;
            if (effects && Math.random() < 0.5) effects.addSparks(this.x, this.y, '#9b59b6', 3);
            if (dist < this.radius + player.radius + 16) player.takeDamage(this.damage * 0.55, effects);
            if (this.whirlwindDuration <= 0) this.isWhirlwind = false;
            this.applyArenaBounds(arena);
            return;
        }

        this.x += (dx / dist) * this.speed * dt;
        this.y += (dy / dist) * this.speed * dt;
        this.applyArenaBounds(arena);

        this.ambushCooldown -= dt;
        if (this.ambushCooldown <= 0) {
            this.startPhantomAmbush(player, effects, arena);
            return;
        }

        this.daggerTimer -= dt;
        if (this.daggerTimer <= 0) {
            this.daggerTimer = 66 + Math.random() * 24;
            this.firePoisonFan(bullets, effects);
        }

        this.smokeBlinkTimer -= dt;
        if (this.smokeBlinkTimer <= 0 && dist > 165) {
            this.smokeBlinkTimer = 155 + Math.random() * 40;
            if (effects) {
                effects.addDust(this.x, this.y, 14, 20);
                effects.addComicSplash(this.x, this.y - 25, '💨 SHADOW DASH!');
            }
            const behindA = (player.angle || 0) + Math.PI;
            this.x = player.x + Math.cos(behindA) * 150;
            this.y = player.y + Math.sin(behindA) * 150;
            this.applyArenaBounds(arena);
            if (effects) effects.addDust(this.x, this.y, 14, 20);
        }

        this.whirlwindTimer -= dt;
        if (this.whirlwindTimer <= 0 && dist < 140) {
            this.whirlwindTimer = 165;
            this.isWhirlwind = true;
            this.whirlwindDuration = 65;
            if (effects) effects.addShockwave(this.x, this.y, 90, 'rgba(155, 89, 182, 0.85)');
        }
    }

    firePoisonFan(bullets, effects) {
        if (typeof Bullet === 'undefined') return;
        const spread = (this.hp <= this.maxHp * 0.55)
            ? [-0.42, -0.25, -0.08, 0.08, 0.25, 0.42]
            : [-0.36, -0.18, 0, 0.18, 0.36];
        for (const sa of spread) {
            const a = this.angle + sa;
            const b = new Bullet(this.x, this.y, Math.cos(a) * 9.2, Math.sin(a) * 9.2, Math.round(this.damage * 0.9), 9.2, 10, 'chieftain_venom_dagger', true);
            b.color = '#9b59b6';
            bullets.push(b);
        }
        if (effects) effects.addSparks(this.x, this.y, '#9b59b6', 5);
    }

    draw(ctx) {
        if (this.poisonZones && this.poisonZones.length > 0) {
            if (typeof BossTelegraphFX !== 'undefined') {
                BossTelegraphFX.drawZones(ctx, this.poisonZones, 'venom_rune');
            } else {
                ctx.save();
                for (const z of this.poisonZones) {
                    const prog = Math.min(1, z.age / z.maxAge);
                    ctx.fillStyle = `rgba(155, 89, 182, ${0.15 + prog * 0.28})`;
                    ctx.strokeStyle = `rgba(190, 46, 221, ${0.65 + prog * 0.35})`;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.arc(z.x, z.y, z.radius * prog, 0, Math.PI * 2);
                    ctx.strokeStyle = '#ff9ff3';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
                ctx.restore();
            }
        }

        if (this.ambushWindup > 0) {
            ctx.save();
            ctx.globalAlpha = 0.48;
            ctx.strokeStyle = '#be2edd';
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.arc(this.ambushTargetX, this.ambushTargetY, this.radius + 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        if (typeof OlympusBossRenderer !== 'undefined') {
            if (this.ambushWindup > 0) {
                ctx.save();
                ctx.globalAlpha = 0.42;
                OlympusBossRenderer.drawRavineChieftain(this, ctx);
                ctx.restore();
            } else {
                OlympusBossRenderer.drawRavineChieftain(this, ctx);
            }
        }
        drawDungeonBossHUD(ctx, this, this.ambushWindup > 0 ? '#be2edd' : '#9b59b6', 64);
    }
}

if (typeof window !== 'undefined') {
    window.drawDungeonBossHUD = drawDungeonBossHUD;
    window.CasillasSentinel = CasillasSentinel;
    window.RavineChieftain = RavineChieftain;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { drawDungeonBossHUD, CasillasSentinel, RavineChieftain };
}
