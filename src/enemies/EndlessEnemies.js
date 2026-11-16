/**
 * Lesa.io - Endless Progressive Enemy Archetypes
 * Unlocked sequentially after Wave 1 in Endless Mode:
 * - Wave 6+:  BouzoukiSniper (long-range laser telegraph sniper)
 * - Wave 12+: KafeneioTank (frontal table-shield juggernaut + smash)
 * - Wave 18+: OuzoBomber (blue-flame ouzo bottle area-denial lobber)
 * - Wave 26+: DimotikiEnforcer (dash + 3-round pulse burst elite)
 */

function endlessSoftDamageScale(waveMultiplier = 1.0) {
    return 1.0 + Math.max(0, waveMultiplier - 1.0) * 0.35;
}

class BouzoukiSniper extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0) {
        super(x, y, 'bouzouki_sniper', waveMultiplier);
        this.name = 'Bouzouki Sniper';
        this.radius = 23;
        this.maxHp = Math.round(135 * Math.max(1.0, waveMultiplier));
        this.hp = this.maxHp;
        this.speed = 2.85;
        this.damage = Math.round(28 * endlessSoftDamageScale(waveMultiplier));
        this.color = '#6c5ce7';
        this.xpDrop = 48;
        this.scoreValue = 280;

        this.aimMax = 45;
        this.aimTimer = 0;
        this.aimAngle = 0;
        this.shootCooldown = 95 + Math.random() * 50;
        this.strafeDir = Math.random() < 0.5 ? 1 : -1;
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        if (!player || player.hp <= 0) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        const dir = Math.atan2(dy, dx);

        if (this.shootCooldown > 0) this.shootCooldown -= dt;

        if (this.aimTimer > 0) {
            this.aimTimer -= dt;
            // Track slowly early in telegraph, lock aim right before firing
            if (this.aimTimer > this.aimMax * 0.25) {
                this.aimAngle = dir;
            }
            this.angle = this.aimAngle;
            this.vx = 0;
            this.vy = 0;
            if (this.aimTimer <= 0) {
                this.fireSniperShot(bullets, effects);
                this.shootCooldown = 135 + Math.random() * 45;
            }
            return;
        }

        this.angle = dir;
        if (dist < 430 && dist > 150 && this.shootCooldown <= 0) {
            this.aimTimer = this.aimMax;
            this.aimAngle = dir;
            if (effects) effects.addSparks(this.x, this.y - 10, '#ff4757', 4);
            return;
        }

        const spd = this.getEffectiveSpeed() * dt;
        if (dist > 370) {
            this.vx = (dx / dist) * spd;
            this.vy = (dy / dist) * spd;
        } else if (dist < 230) {
            this.vx = -(dx / dist) * spd * 0.95;
            this.vy = -(dy / dist) * spd * 0.95;
        } else {
            const sa = dir + this.strafeDir * Math.PI * 0.5;
            this.vx = Math.cos(sa) * spd * 0.72;
            this.vy = Math.sin(sa) * spd * 0.72;
        }

        this.x += this.vx;
        this.y += this.vy;
        this.walkCycle += 0.22 * dt;
        this.applySeparation(enemies);
        this.applyArenaBounds(arena);
    }

    fireSniperShot(bullets, effects) {
        if (typeof Bullet === 'undefined') return;
        const speed = 15.5;
        bullets.push(new Bullet({
            x: this.x + Math.cos(this.aimAngle) * (this.radius + 8),
            y: this.y + Math.sin(this.aimAngle) * (this.radius + 8),
            vx: Math.cos(this.aimAngle) * speed,
            vy: Math.sin(this.aimAngle) * speed,
            damage: this.damage,
            speed,
            radius: 7,
            type: 'carbine',
            isEnemy: true,
            range: 920
        }));
        if (effects) {
            effects.addComicSplash(this.x, this.y - 34, 'SNIPE! 🎯', '#fed330', 18);
            effects.addSparks(this.x, this.y, '#fed330', 5);
        }
    }

    draw(ctx) {
        if (typeof EndlessEnemyRenderer !== 'undefined') EndlessEnemyRenderer.drawSniper(ctx, this);
    }
}

class KafeneioTank extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0) {
        super(x, y, 'kafeneio_tank', waveMultiplier);
        this.name = 'Kafeneio Tank';
        this.radius = 35;
        this.maxHp = Math.round(440 * Math.max(1.0, waveMultiplier));
        this.hp = this.maxHp;
        this.speed = 1.95;
        this.damage = Math.round(32 * endlessSoftDamageScale(waveMultiplier));
        this.color = '#b33939';
        this.xpDrop = 70;
        this.scoreValue = 360;

        this.slamRadius = 120;
        this.slamCooldown = 190 + Math.random() * 60;
        this.slamWindup = 0;
    }

    takeDamage(amount, effects = null, fromCrit = null, playSound = true, attackerAngle = null) {
        let finalAmt = amount;
        let incAngle = attackerAngle;
        if (incAngle === null && typeof window !== 'undefined' && window.gameInstance && window.gameInstance.player) {
            const p = window.gameInstance.player;
            incAngle = Math.atan2(p.y - this.y, p.x - this.x);
        }
        if (incAngle !== null && Number.isFinite(incAngle)) {
            const diff = Math.abs(Math.atan2(Math.sin(incAngle - this.angle), Math.cos(incAngle - this.angle)));
            if (diff < Math.PI * 0.36) {
                finalAmt = Math.max(1, Math.round(amount * 0.65));
                if (effects && Math.random() < 0.45) {
                    effects.addSparks(this.x + Math.cos(this.angle) * 20, this.y + Math.sin(this.angle) * 20, '#f1c40f', 4);
                }
            }
        }
        return super.takeDamage(finalAmt, effects, fromCrit, playSound);
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        if (!player || player.hp <= 0) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);

        if (this.slamCooldown > 0) this.slamCooldown -= dt;

        if (this.slamWindup > 0) {
            this.slamWindup -= dt;
            this.vx = 0;
            this.vy = 0;
            if (this.slamWindup <= 0) {
                if (effects) {
                    effects.addShockwave(this.x, this.y, this.slamRadius, 'rgba(230, 126, 34, 0.9)');
                    effects.addComicSplash(this.x, this.y - 36, 'TABLE SMASH! 💥');
                }
                if (dist <= this.slamRadius + player.radius) {
                    player.takeDamage(Math.round(this.damage * 1.15), effects);
                }
                this.slamCooldown = 210 + Math.random() * 60;
            }
            return;
        }

        if (dist <= 105 && this.slamCooldown <= 0) {
            this.slamWindup = 42;
            return;
        }

        const spd = this.getEffectiveSpeed() * dt;
        this.vx = (dx / dist) * spd;
        this.vy = (dy / dist) * spd;
        this.x += this.vx;
        this.y += this.vy;
        this.walkCycle += 0.16 * dt;
        this.applySeparation(enemies);
        this.applyArenaBounds(arena);
    }

    draw(ctx) {
        if (typeof EndlessEnemyRenderer !== 'undefined') EndlessEnemyRenderer.drawTank(ctx, this);
    }
}

class OuzoBomber extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0) {
        super(x, y, 'ouzo_bomber', waveMultiplier);
        this.name = 'Ouzo Bomber';
        this.radius = 25;
        this.maxHp = Math.round(215 * Math.max(1.0, waveMultiplier));
        this.hp = this.maxHp;
        this.speed = 2.65;
        this.damage = Math.round(26 * endlessSoftDamageScale(waveMultiplier));
        this.color = '#ff793f';
        this.xpDrop = 60;
        this.scoreValue = 320;

        this.lobCooldown = 110 + Math.random() * 55;
        this.fireZones = [];
        this.burnTick = 0;
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;

        // Update active fire puddles even if repositioning
        this.burnTick += dt;
        const doBurn = this.burnTick >= 24;
        if (doBurn) this.burnTick = 0;
        for (let i = this.fireZones.length - 1; i >= 0; i--) {
            const z = this.fireZones[i];
            if (z.fuse > 0) {
                z.fuse -= dt;
                if (z.fuse <= 0 && effects) {
                    effects.addShockwave(z.x, z.y, z.radius * 1.1, 'rgba(0, 210, 211, 0.85)');
                    effects.addSparks(z.x, z.y, '#00d2d3', 8);
                }
            } else {
                z.life -= dt;
                if (doBurn && player && player.hp > 0 && Math.hypot(player.x - z.x, player.y - z.y) <= z.radius + player.radius * 0.7) {
                    player.takeDamage(Math.max(8, Math.round(this.damage * 0.45)), effects);
                }
                if (z.life <= 0) this.fireZones.splice(i, 1);
            }
        }

        if (!player || player.hp <= 0) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);

        if (this.lobCooldown > 0) this.lobCooldown -= dt;
        if (dist < 360 && this.lobCooldown <= 0 && this.fireZones.length < 3) {
            this.lobCooldown = 165 + Math.random() * 55;
            this.fireZones.push({
                x: player.x + (player.vx || 0) * 14,
                y: player.y + (player.vy || 0) * 14,
                radius: 64,
                fuse: 40,
                maxFuse: 40,
                life: 165
            });
            if (typeof Bullet !== 'undefined') {
                const spd = 8.5;
                bullets.push(new Bullet({
                    x: this.x, y: this.y,
                    vx: Math.cos(this.angle) * spd, vy: Math.sin(this.angle) * spd,
                    damage: Math.round(this.damage * 0.75), speed: spd, radius: 10,
                    type: 'smoke', isEnemy: true, range: 440
                }));
            }
            if (effects) effects.addComicSplash(this.x, this.y - 34, 'OPA! 🔥', '#00d2d3', 18);
        }

        const spd = this.getEffectiveSpeed() * dt;
        const desiredDist = 250;
        if (dist > desiredDist + 30) {
            this.vx = (dx / dist) * spd;
            this.vy = (dy / dist) * spd;
        } else if (dist < desiredDist - 55) {
            this.vx = -(dx / dist) * spd * 0.85;
            this.vy = -(dy / dist) * spd * 0.85;
        } else {
            this.vx = Math.cos(this.angle + 1.4) * spd * 0.65;
            this.vy = Math.sin(this.angle + 1.4) * spd * 0.65;
        }
        this.x += this.vx;
        this.y += this.vy;
        this.walkCycle += 0.22 * dt;
        this.applySeparation(enemies);
        this.applyArenaBounds(arena);
    }

    draw(ctx) {
        if (typeof EndlessEnemyRenderer !== 'undefined') EndlessEnemyRenderer.drawBomber(ctx, this);
    }
}

class DimotikiEnforcer extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0) {
        super(x, y, 'dimotiki_enforcer', waveMultiplier);
        this.name = 'Dimotiki Enforcer';
        this.radius = 27;
        this.maxHp = Math.round(350 * Math.max(1.0, waveMultiplier));
        this.hp = this.maxHp;
        this.speed = 3.25;
        this.damage = Math.round(30 * endlessSoftDamageScale(waveMultiplier));
        this.color = '#fed330';
        this.xpDrop = 85;
        this.scoreValue = 440;

        this.burstCooldown = 95 + Math.random() * 45;
        this.dashCooldown = 165 + Math.random() * 55;
        this.dashTimer = 0;
        this.dashAngle = 0;
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        if (!player || player.hp <= 0) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);

        if (this.burstCooldown > 0) this.burstCooldown -= dt;
        if (this.dashCooldown > 0) this.dashCooldown -= dt;

        if (this.dashTimer > 0) {
            this.dashTimer -= dt;
            const dashSpd = 9.5 * dt;
            this.vx = Math.cos(this.dashAngle) * dashSpd;
            this.vy = Math.sin(this.dashAngle) * dashSpd;
            this.x += this.vx;
            this.y += this.vy;
            if (effects && Math.floor(this.age) % 3 === 0) effects.addSparks(this.x, this.y, '#fed330', 3);
            this.applyArenaBounds(arena);
            return;
        }

        if (dist > 150 && dist < 380 && this.dashCooldown <= 0) {
            this.dashTimer = 18;
            this.dashCooldown = 190 + Math.random() * 50;
            // Side-cut intercept angle
            this.dashAngle = this.angle + (Math.random() < 0.5 ? 0.35 : -0.35);
            if (effects) effects.addDust(this.x, this.y, 4, 8);
            return;
        }

        if (dist < 420 && this.burstCooldown <= 0 && typeof Bullet !== 'undefined') {
            this.burstCooldown = 115 + Math.random() * 35;
            const spd = 11.2;
            for (const offset of [-0.18, 0, 0.18]) {
                const a = this.angle + offset;
                bullets.push(new Bullet({
                    x: this.x + Math.cos(a) * (this.radius + 6),
                    y: this.y + Math.sin(a) * (this.radius + 6),
                    vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
                    damage: Math.round(this.damage * 0.75), speed: spd, radius: 8,
                    type: 'lightning', isEnemy: true, range: 640
                }));
            }
            if (effects) effects.addSparks(this.x, this.y, '#00d2d3', 5);
        }

        const spd = this.getEffectiveSpeed() * dt;
        this.vx = (dx / dist) * spd;
        this.vy = (dy / dist) * spd;
        this.x += this.vx;
        this.y += this.vy;
        this.walkCycle += 0.26 * dt;
        this.applySeparation(enemies);
        this.applyArenaBounds(arena);
    }

    draw(ctx) {
        if (typeof EndlessEnemyRenderer !== 'undefined') EndlessEnemyRenderer.drawEnforcer(ctx, this);
    }
}

if (typeof window !== 'undefined') {
    window.BouzoukiSniper = BouzoukiSniper;
    window.KafeneioTank = KafeneioTank;
    window.OuzoBomber = OuzoBomber;
    window.DimotikiEnforcer = DimotikiEnforcer;
}
