/**
 * Lesa.io - Mount Olympus Ice Enemies Subsystem
 * Introduces specialized cold-climate enemies active on Mount Olympus Floors 3, 4, and 5:
 * 1. FrostWolf: Fast, agile predator that lunges and applies frost chill slow to the player.
 * 2. IceGolem: Heavy glacial brute that periodically slams the ground, launching 4 ice shard projectiles.
 */

class FrostWolf extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0) {
        super(x, y, 'frost_wolf', waveMultiplier);
        this.name = 'Frost Wolf';
        this.radius = 24;

        // Stats scaled for aggressive dungeon encounters
        this.maxHp = Math.round(260 * Math.max(1.0, waveMultiplier));
        this.hp = this.maxHp;
        this.baseSpeed = 3.6;
        this.speed = this.baseSpeed;
        this.damage = Math.round(22 * Math.max(1.0, waveMultiplier * 0.7));
        this.xpDrop = 45;
        this.scoreValue = 90;
        this.color = '#74b9ff';

        // Lunge Attack Mechanics
        this.lungeCooldown = 150 + Math.random() * 60;
        this.isLunging = false;
        this.lungeTimer = 0;
        this.lungeDx = 0;
        this.lungeDy = 0;
        this.frostTrailTimer = 0;
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        if (this.hitFlash > 0) this.hitFlash -= dt;
        if (this.stunTimer > 0) {
            this.stunTimer -= dt;
            return;
        }

        if (!player || player.hp <= 0) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            this.angle = Math.atan2(dy, dx);
        }

        // Lunge Execution
        if (this.isLunging) {
            this.lungeTimer -= dt;
            this.x += this.lungeDx * 6.5 * dt;
            this.y += this.lungeDy * 6.5 * dt;

            // Frost trail while lunging
            this.frostTrailTimer += dt;
            if (this.frostTrailTimer >= 2.0 && effects) {
                this.frostTrailTimer = 0;
                effects.addSparks(this.x, this.y, '#74b9ff', 2);
                effects.addDust(this.x, this.y, 1, 3);
            }

            // Hit check during lunge
            if (dist < this.radius + player.radius + 10) {
                player.takeDamage(this.damage, effects);
                player.speedDebuffTimer = 120; // 2 seconds of 32% frost chill slow!
                if (effects) {
                    effects.addComicSplash(player.x, player.y - 40, '❄️ FROST CHILL!');
                    effects.addSparks(player.x, player.y, '#00d2d3', 6);
                }
                this.isLunging = false;
                this.lungeCooldown = 200;
            }

            if (this.lungeTimer <= 0) {
                this.isLunging = false;
                this.lungeCooldown = 180;
            }
            return;
        }

        // Lunge Cooldown & Trigger
        if (this.lungeCooldown > 0) {
            this.lungeCooldown -= dt;
        } else if (dist < 230 && dist > 40) {
            // Initiate lunge
            this.isLunging = true;
            this.lungeTimer = 22; // ~0.35s burst
            this.lungeDx = dx / dist;
            this.lungeDy = dy / dist;
            if (effects) {
                effects.addDust(this.x, this.y, 4, 8);
            }
            return;
        }

        // Standard Chasing Movement
        if (dist > 25) {
            const moveSpeed = this.speed * dt;
            this.x += (dx / dist) * moveSpeed;
            this.y += (dy / dist) * moveSpeed;
            this.walkCycle += 0.3 * dt;
        }

        // Standard Contact Damage
        if (dist < this.radius + player.radius) {
            player.takeDamage(this.damage * 0.75, effects);
            player.speedDebuffTimer = 80;
        }

        this.applySeparation(enemies);
    }

    draw(ctx) {
        if (typeof OlympusIceRenderer !== 'undefined') {
            OlympusIceRenderer.drawFrostWolf(this, ctx);
        }
        this.drawOverheadHUD(ctx);
    }
}

class IceGolem extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0) {
        super(x, y, 'ice_golem', waveMultiplier);
        this.name = 'Ice Golem';
        this.radius = 34;
        this.hudOffsetY = 58;

        // Heavy armor & HP
        this.maxHp = Math.round(780 * Math.max(1.0, waveMultiplier));
        this.hp = this.maxHp;
        this.baseSpeed = 1.85;
        this.speed = this.baseSpeed;
        this.damage = Math.round(34 * Math.max(1.0, waveMultiplier * 0.7));
        this.xpDrop = 80;
        this.scoreValue = 160;
        this.color = '#00cec9';

        // Ground Slam & Radial Ice Shard Volley
        this.slamCooldown = 180 + Math.random() * 80;
        this.isSlamming = false;
        this.slamTimer = 0;
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        if (this.hitFlash > 0) this.hitFlash -= dt;
        if (this.stunTimer > 0) {
            this.stunTimer -= dt;
            return;
        }

        if (!player || player.hp <= 0) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            this.angle = Math.atan2(dy, dx);
        }

        // Slamming State
        if (this.isSlamming) {
            this.slamTimer -= dt;
            if (this.slamTimer <= 0) {
                this.isSlamming = false;
                this.slamCooldown = 240;

                // Erupt 4 directional ice shards outward!
                if (typeof Bullet !== 'undefined' && bullets) {
                    for (let i = 0; i < 4; i++) {
                        const sAngle = this.angle + (i * Math.PI / 2);
                        const svx = Math.cos(sAngle) * 7.5;
                        const svy = Math.sin(sAngle) * 7.5;
                        const shard = new Bullet({
                            x: this.x + Math.cos(sAngle) * 20,
                            y: this.y + Math.sin(sAngle) * 20,
                            vx: svx,
                            vy: svy,
                            damage: Math.round(this.damage * 0.75),
                            speed: 7.5,
                            radius: 9,
                            type: 'ice_spike',
                            isEnemy: true,
                            range: 650
                        });
                        bullets.push(shard);
                    }
                }

                if (effects) {
                    effects.addShockwave(this.x, this.y, 75, 'rgba(0, 206, 201, 0.85)');
                    effects.addDust(this.x, this.y, 8, 16);
                    effects.addComicSplash(this.x, this.y - 45, '💥 ICE SLAM!');
                    if (typeof effects.onBossSlam === 'function') effects.onBossSlam(0.032);
                }
            }
            return;
        }

        // Slam Cooldown Check
        if (this.slamCooldown > 0) {
            this.slamCooldown -= dt;
        } else if (dist < 320) {
            this.isSlamming = true;
            this.slamTimer = 35; // ~0.6s windup
            if (effects) {
                effects.addSparks(this.x, this.y, '#00cec9', 5);
            }
            return;
        }

        // Move towards player
        if (dist > 30) {
            const moveSpeed = this.speed * dt;
            this.x += (dx / dist) * moveSpeed;
            this.y += (dy / dist) * moveSpeed;
            this.walkCycle += 0.18 * dt;
        }

        // Melee Contact
        if (dist < this.radius + player.radius) {
            player.takeDamage(this.damage, effects);
            player.speedDebuffTimer = 90;
        }

        this.applySeparation(enemies);
    }

    draw(ctx) {
        if (typeof OlympusIceRenderer !== 'undefined') {
            OlympusIceRenderer.drawIceGolem(this, ctx);
        }
        this.drawOverheadHUD(ctx);
    }
}

if (typeof window !== 'undefined') {
    window.FrostWolf = FrostWolf;
    window.IceGolem = IceGolem;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FrostWolf, IceGolem };
}
