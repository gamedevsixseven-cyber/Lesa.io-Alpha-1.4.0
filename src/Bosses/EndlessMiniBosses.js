/**
 * Lesa.io - Endless Mode Mini-Bosses (Spawns every 5 waves: 5, 15, 25, 35, 45...)
 * Shared EndlessBossBase + SouvlakiBrawler (Easy), TrafficWarden (Normal),
 * ButcherGoliath (Very Hard), and SyndicateCapo (Insane).
 */

class EndlessBossBase extends EnemyBase {
    constructor(x, y, type, waveMultiplier = 1.0, cfg = {}) {
        super(x, y, type, waveMultiplier);
        const dmgScale = 1.0 + Math.max(0, waveMultiplier - 1.0) * 0.35;
        this.name = cfg.name || 'Endless Boss';
        this.isBoss = true;
        this.isMiniBoss = !!cfg.isMiniBoss;
        this.bossRank = cfg.bossRank || 'normal';
        this.rankColor = cfg.rankColor || '#1e90ff';
        this.crateId = cfg.crateId || 'boss_crate_normal';
        this.crateAwarded = false;
        this.isEndlessBoss = true;
        this.isApex = !!cfg.isApex;
        this.hudLabel = cfg.hudLabel || this.name.toUpperCase();

        this.radius = cfg.radius || (this.isMiniBoss ? 36 : 44);
        this.maxHp = Math.round((cfg.baseHp || 1500) * Math.max(1.0, waveMultiplier));
        this.hp = this.maxHp;
        this.baseSpeed = cfg.speed || 2.5;
        this.speed = this.baseSpeed;
        this.damage = Math.round((cfg.baseDmg || 30) * dmgScale);
        this.xpDrop = cfg.xpDrop || 260;
        this.scoreValue = cfg.scoreValue || 900;
        this.goldBonus = cfg.goldBonus || 300;
        this.xpBonus = cfg.xpBonus || 200;

        this.isEnraged = false;
        this.telegraphs = [];
    }

    fireFan(bullets, baseAngle, offsets, speed, damage, radius, type) {
        if (typeof Bullet === 'undefined') return;
        for (const off of offsets) {
            const a = baseAngle + off;
            bullets.push(new Bullet({
                x: this.x + Math.cos(a) * (this.radius + 8),
                y: this.y + Math.sin(a) * (this.radius + 8),
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed,
                damage,
                speed,
                radius,
                type,
                isEnemy: true,
                range: 820
            }));
        }
    }

    addTelegraph(x, y, radius, timer, damage, icon = '⚠️', color = 'rgba(255, 71, 87, 0.9)', style = 'generic', sparkColor = '#fed330') {
        this.telegraphs.push({ x, y, radius, timer, maxTimer: timer, damage, icon, color, style, sparkColor });
    }

    updateTelegraphs(dt, player, effects) {
        for (let i = this.telegraphs.length - 1; i >= 0; i--) {
            const z = this.telegraphs[i];
            z.timer -= dt;
            if (z.timer <= 0) {
                if (effects) {
                    effects.addShockwave(z.x, z.y, z.radius * 1.15, z.color || 'rgba(255, 71, 87, 0.9)');
                    effects.addSparks(z.x, z.y, z.sparkColor || '#fed330', 10);
                    if (z.style === 'orbital_nuke' && typeof effects.addGroundCrack === 'function') {
                        effects.addGroundCrack(z.x, z.y, z.radius * 0.9, '#2f3542', '#ff6348', 110);
                    }
                }
                if (player && player.hp > 0 && Math.hypot(player.x - z.x, player.y - z.y) <= z.radius + player.radius * 0.85) {
                    player.takeDamage(z.damage, effects);
                }
                this.telegraphs.splice(i, 1);
            }
        }
    }

    checkEnrage(threshold, effects, splash, speedMult = 1.25, shockColor = 'rgba(255, 71, 87, 0.9)') {
        if (this.isEnraged || this.hp > this.maxHp * threshold) return false;
        this.isEnraged = true;
        this.speed = this.baseSpeed * speedMult;
        if (effects) {
            effects.addShockwave(this.x, this.y, 150, shockColor);
            effects.addComicSplash(this.x, this.y - 50, splash);
        }
        return true;
    }

    moveTowards(dt, dx, dy, dist, desiredDist = 0, arena = null) {
        const spd = this.getEffectiveSpeed() * dt;
        if (desiredDist > 0 && dist < desiredDist - 30) {
            this.vx = -(dx / dist) * spd * 0.7;
            this.vy = -(dy / dist) * spd * 0.7;
        } else if (dist > desiredDist + 10) {
            this.vx = (dx / dist) * spd;
            this.vy = (dy / dist) * spd;
        } else {
            const strafe = this.angle + Math.PI * 0.5;
            this.vx = Math.cos(strafe) * spd * 0.75;
            this.vy = Math.sin(strafe) * spd * 0.75;
        }
        this.x += this.vx;
        this.y += this.vy;
        this.walkCycle += 0.20 * dt;
        this.applyArenaBounds(arena);
    }
}

class SouvlakiBrawler extends EndlessBossBase {
    constructor(x, y, waveMultiplier = 1.0, extra = {}) {
        super(x, y, 'souvlaki_brawler', waveMultiplier, {
            name: 'Psistis Brawler',
            hudLabel: extra.hudLabel || '🔥 PSISTIS BRAWLER [EASY MINI] 🔥',
            isMiniBoss: true,
            bossRank: extra.bossRank || 'easy',
            rankColor: extra.rankColor || '#2ed573',
            crateId: extra.crateId || 'boss_crate_easy',
            isApex: extra.isApex,
            radius: 36,
            baseHp: 1200,
            speed: 2.55,
            baseDmg: 24,
            xpDrop: 240,
            scoreValue: 650,
            goldBonus: 200,
            xpBonus: 140
        });
        this.emberCooldown = 95;
        this.dashCooldown = 165;
        this.dashTimer = 0;
        this.dashAngle = 0;
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        if (!player || player.hp <= 0) return;

        this.checkEnrage(0.5, effects, '🔥 EXTRA CHARCOAL! 🔥', 1.25, 'rgba(255, 159, 67, 0.92)');
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);

        if (this.emberCooldown > 0) this.emberCooldown -= dt;
        if (this.dashCooldown > 0) this.dashCooldown -= dt;

        if (this.dashTimer > 0) {
            this.dashTimer -= dt;
            const rushSpd = 9.0 * dt;
            this.x += Math.cos(this.dashAngle) * rushSpd;
            this.y += Math.sin(this.dashAngle) * rushSpd;
            if (effects && Math.floor(this.age) % 3 === 0) {
                effects.addSparks(this.x, this.y, Math.floor(this.age) % 2 === 0 ? '#ff9f43' : '#ff4757', 4);
                effects.addDust(this.x, this.y, 1, 5);
            }
            this.applyArenaBounds(arena);
            return;
        }

        if (dist < 320 && this.dashCooldown <= 0) {
            this.dashTimer = 24;
            this.dashCooldown = this.isEnraged ? 130 : 175;
            this.dashAngle = this.angle;
            if (effects) effects.addComicSplash(this.x, this.y - 40, 'SKEWER RUSH! 🔥');
            return;
        }

        if (this.emberCooldown <= 0) {
            this.emberCooldown = this.isEnraged ? 80 : 115;
            const spread = this.isEnraged ? [-0.26, 0, 0.26] : [-0.18, 0.18];
            this.fireFan(bullets, this.angle, spread, 9.5, Math.round(this.damage * 0.8), 10, 'souvlaki_skewer');
            if (effects) effects.addSparks(this.x, this.y, '#ff9f43', 5);
        }

        this.moveTowards(dt, dx, dy, dist, 0, arena);
    }

    draw(ctx) {
        if (typeof EndlessBossRenderer !== 'undefined') EndlessBossRenderer.drawSouvlakiBrawler(ctx, this);
    }
}

class TrafficWarden extends EndlessBossBase {
    constructor(x, y, waveMultiplier = 1.0, extra = {}) {
        super(x, y, 'traffic_warden', waveMultiplier, {
            name: 'Warden Nikos',
            hudLabel: extra.hudLabel || '🛵 WARDEN NIKOS [NORMAL MINI] 🛵',
            isMiniBoss: true,
            bossRank: extra.bossRank || 'normal',
            rankColor: extra.rankColor || '#1e90ff',
            crateId: extra.crateId || 'boss_crate_normal',
            isApex: extra.isApex,
            radius: 38,
            baseHp: 1550,
            speed: 3.1,
            baseDmg: 28,
            xpDrop: 360,
            scoreValue: 950,
            goldBonus: 320,
            xpBonus: 220
        });
        this.ticketCooldown = 90;
        this.driftCooldown = 140;
        this.driftTimer = 0;
        this.driftAngle = 0;
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        if (!player || player.hp <= 0) return;

        this.checkEnrage(0.5, effects, '🚨 DOUBLE FINE! 🚨', 1.25, 'rgba(55, 66, 250, 0.9)');
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);

        if (this.ticketCooldown > 0) this.ticketCooldown -= dt;
        if (this.driftCooldown > 0) this.driftCooldown -= dt;

        if (this.driftTimer > 0) {
            this.driftTimer -= dt;
            const dSpd = 10.2 * dt;
            this.x += Math.cos(this.driftAngle) * dSpd;
            this.y += Math.sin(this.driftAngle) * dSpd;
            if (effects && Math.floor(this.age) % 3 === 0) {
                effects.addDust(this.x, this.y, 2, 6);
                effects.addSparks(this.x, this.y, Math.floor(this.age) % 2 === 0 ? '#ff4757' : '#3742fa', 3);
            }
            this.applyArenaBounds(arena);
            return;
        }

        if (this.driftCooldown <= 0) {
            this.driftTimer = 28;
            this.driftCooldown = this.isEnraged ? 115 : 155;
            this.driftAngle = this.angle + (Math.random() < 0.5 ? 0.25 : -0.25);
            if (effects) {
                effects.addShockwave(this.x, this.y, 100, 'rgba(55, 66, 250, 0.85)');
                effects.addShockwave(this.x, this.y, 72, 'rgba(255, 71, 87, 0.85)');
            }
            return;
        }

        if (this.ticketCooldown <= 0) {
            this.ticketCooldown = this.isEnraged ? 75 : 105;
            const arcs = this.isEnraged ? [-0.36, -0.18, 0, 0.18, 0.36] : [-0.22, 0, 0.22];
            this.fireFan(bullets, this.angle, arcs, 10.5, Math.round(this.damage * 0.82), 10, 'traffic_ticket');
        }

        this.moveTowards(dt, dx, dy, dist, 180, arena);
    }

    draw(ctx) {
        if (typeof EndlessBossRenderer !== 'undefined') EndlessBossRenderer.drawTrafficWarden(ctx, this);
    }
}

class ButcherGoliath extends EndlessBossBase {
    constructor(x, y, waveMultiplier = 1.0, extra = {}) {
        super(x, y, 'butcher_goliath', waveMultiplier, {
            name: 'Makis the Butcher',
            hudLabel: extra.hudLabel || '🥩 MAKIS GOLIATH [VERY HARD MINI] 🥩',
            isMiniBoss: true,
            bossRank: extra.bossRank || 'very_hard',
            rankColor: extra.rankColor || '#e67e22',
            crateId: extra.crateId || 'boss_crate_very_hard',
            isApex: extra.isApex,
            radius: 42,
            baseHp: 2450,
            speed: 2.35,
            baseDmg: 34,
            xpDrop: 520,
            scoreValue: 1450,
            goldBonus: 480,
            xpBonus: 340
        });
        this.cleaverCooldown = 95;
        this.chopCooldown = 175;
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        this.updateTelegraphs(dt, player, effects);
        if (!player || player.hp <= 0) return;

        if (this.checkEnrage(0.5, effects, '🥩 CHOPPER FRENZY! 🥩', 1.32, 'rgba(214, 48, 49, 0.95)')) {
            this.fireFan(bullets, 0, [0, 0.78, 1.57, 2.35, 3.14, 3.92, 4.71, 5.49], 9.5, Math.round(this.damage * 0.8), 11, 'butcher_hook');
        }

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);

        if (this.cleaverCooldown > 0) this.cleaverCooldown -= dt;
        if (this.chopCooldown > 0) this.chopCooldown -= dt;

        if (this.cleaverCooldown <= 0) {
            this.cleaverCooldown = this.isEnraged ? 70 : 100;
            this.fireFan(bullets, this.angle, [-0.28, -0.10, 0.10, 0.28], 11.2, Math.round(this.damage * 0.85), 11, 'butcher_cleaver');
        }

        if (this.chopCooldown <= 0) {
            this.chopCooldown = this.isEnraged ? 130 : 175;
            this.addTelegraph(player.x, player.y, 82, 46, Math.round(this.damage * 1.15), '🔪', 'rgba(235, 77, 75, 0.95)', 'butcher_chop', '#eb4d4b');
            if (effects) effects.addComicSplash(this.x, this.y - 45, 'HEAVY CHOP!');
        }

        this.moveTowards(dt, dx, dy, dist, 0, arena);
    }

    draw(ctx) {
        if (typeof EndlessBossRenderer !== 'undefined') EndlessBossRenderer.drawButcherGoliath(ctx, this);
    }
}

class SyndicateCapo extends EndlessBossBase {
    constructor(x, y, waveMultiplier = 1.0, extra = {}) {
        super(x, y, 'syndicate_capo', waveMultiplier, {
            name: 'Don Stavros',
            hudLabel: extra.hudLabel || '🕶️ DON STAVROS [INSANE MINI] 🕶️',
            isMiniBoss: true,
            bossRank: extra.bossRank || 'insane',
            rankColor: extra.rankColor || '#ff4757',
            crateId: extra.crateId || 'boss_crate_insane',
            isApex: extra.isApex,
            radius: 38,
            baseHp: 3400,
            speed: 3.05,
            baseDmg: 38,
            xpDrop: 750,
            scoreValue: 2200,
            goldBonus: 700,
            xpBonus: 500
        });
        this.tommyCooldown = 78;
        this.blinkCooldown = 155;
        this.mineCooldown = 190;
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        this.updateTelegraphs(dt, player, effects);
        if (!player || player.hp <= 0) return;

        this.checkEnrage(0.5, effects, '🔴 SYNDICATE OVERDRIVE! 🔴', 1.28);
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);

        if (this.tommyCooldown > 0) this.tommyCooldown -= dt;
        if (this.blinkCooldown > 0) this.blinkCooldown -= dt;
        if (this.mineCooldown > 0) this.mineCooldown -= dt;

        if (this.blinkCooldown <= 0) {
            this.blinkCooldown = this.isEnraged ? 115 : 165;
            if (effects) effects.addSparks(this.x, this.y, '#ff4757', 10);
            const flankAngle = this.angle + (Math.random() < 0.5 ? 1.8 : -1.8);
            this.x = player.x + Math.cos(flankAngle) * 210;
            this.y = player.y + Math.sin(flankAngle) * 210;
            this.applyArenaBounds(arena);
            if (effects) {
                effects.addShockwave(this.x, this.y, 95, 'rgba(255, 71, 87, 0.85)');
                effects.addComicSplash(this.x, this.y - 42, 'SYNDICATE BLINK! 🕶️');
            }
            const nova = [0, 0.78, 1.57, 2.35, 3.14, 3.92, 4.71, 5.49];
            this.fireFan(bullets, this.angle, nova, 10.5, Math.round(this.damage * 0.78), 10, 'syndicate_chip');
        }

        if (this.tommyCooldown <= 0) {
            this.tommyCooldown = this.isEnraged ? 52 : 76;
            this.fireFan(bullets, this.angle, [-0.22, -0.07, 0.07, 0.22], 12.2, Math.round(this.damage * 0.85), 9, 'syndicate_slug');
        }

        if (this.mineCooldown <= 0) {
            this.mineCooldown = this.isEnraged ? 135 : 185;
            this.addTelegraph(player.x, player.y, 75, 48, Math.round(this.damage * 1.1), '💼', 'rgba(255, 71, 87, 0.95)', 'cartel_laser', '#ff4757');
        }

        this.moveTowards(dt, dx, dy, dist, 230, arena);
    }

    draw(ctx) {
        if (typeof EndlessBossRenderer !== 'undefined') EndlessBossRenderer.drawSyndicateCapo(ctx, this);
    }
}

if (typeof window !== 'undefined') {
    window.EndlessBossBase = EndlessBossBase;
    window.SouvlakiBrawler = SouvlakiBrawler;
    window.TrafficWarden = TrafficWarden;
    window.ButcherGoliath = ButcherGoliath;
    window.SyndicateCapo = SyndicateCapo;
}
