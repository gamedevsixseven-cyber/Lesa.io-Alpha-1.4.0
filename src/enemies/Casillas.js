/**
 * Lesa.io - Enemy: "Casillas"
 * Agile Goalkeeper / Striker with curved soccer kicks & balanced diving dodges (nerfed)
 */

class Casillas extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0) {
        super(x, y, 'casillas', waveMultiplier);
        this.name = 'Casillas';
        this.radius = 24;
        this.maxHp = Math.round(85 * waveMultiplier);
        this.hp = this.maxHp;
        this.speed = 3.9;
        this.damage = 18;
        this.color = '#2ed573';
        this.xpDrop = 30;

        // Casillas Special State & Nerfed Dodge
        this.strafeAngle = (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 0.4);
        this.shootCooldown = 110 + Math.random() * 60;
        this.dodgeCooldown = 320 + Math.random() * 60; // Much longer cooldown (5-6s)
        this.dodgeChance = 0.35; // Only 35% chance to dodge
        this.isDodging = false;
        this.dodgeTimer = 0;
        this.stumbleTimer = 0; // Post-dodge recovery window
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        if (this.hitFlash > 0) this.hitFlash -= dt;

        if (!player || player.hp <= 0) return;

        const pdx = player.x - this.x;
        const pdy = player.y - this.y;
        const distSq = pdx * pdx + pdy * pdy;
        const dist = Math.sqrt(distSq);
        const dir = Math.atan2(pdy, pdx);

        if (this.shootCooldown > 0) this.shootCooldown -= dt;
        if (this.dodgeCooldown > 0) this.dodgeCooldown -= dt;
        if (this.stumbleTimer > 0) this.stumbleTimer -= dt;

        // Balanced Dive Dodge check (only triggers if off cooldown and passes dodge chance)
        if (this.dodgeCooldown <= 0 && !this.isDodging && this.stumbleTimer <= 0) {
            for (let i = 0; i < bullets.length; i++) {
                const b = bullets[i];
                if (b.isEnemy) continue;

                const bdx = b.x - this.x;
                const bdy = b.y - this.y;
                const bDistSq = bdx * bdx + bdy * bdy;

                if (bDistSq < 80 * 80) { // Bullet within 80px
                    if (Math.random() < this.dodgeChance) {
                        this.isDodging = true;
                        this.dodgeTimer = 11; // Short dodge duration
                        this.dodgeCooldown = 340; // 5.5s cooldown
                        this.stumbleTimer = 25; // Brief post-dodge recovery where he is vulnerable

                        // Dodge perpendicular to bullet velocity
                        const dodgeAngle = Math.atan2(b.vy, b.vx) + (Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2);
                        this.vx = Math.cos(dodgeAngle) * 6.8;
                        this.vy = Math.sin(dodgeAngle) * 6.8;

                        if (window.soundEngine) {
                            window.soundEngine.playCasillasDash();
                        }
                        if (effects) {
                            effects.addComicSplash(this.x, this.y - 30, 'SAVE!');
                            effects.addDust(this.x, this.y, 3, 6);
                        }
                    } else {
                        // Failed dodge roll - triggers slight cooldown so he doesn't check every bullet
                        this.dodgeCooldown = 60;
                    }
                    break;
                }
            }
        }

        if (this.isDodging) {
            this.dodgeTimer -= dt;
            if (this.dodgeTimer <= 0) {
                this.isDodging = false;
            }
        } else {
            this.angle = dir;

            // Soccer Kick attack when in 150-450px range
            if (this.shootCooldown <= 0 && dist < 450) {
                this.shootCooldown = 110 + Math.random() * 45;
                this.shootSoccerBall(player, dir);
            }

            this.updateDebuffs(dt);
            // Current speed (slower if recovering from stumble or drenched by Nerobalonaki)
            let currentSpeed = this.stumbleTimer > 0 ? this.speed * 0.45 : this.speed;
            if (this.waterDrenchedTimer > 0) {
                currentSpeed *= (this.waterSlowMultiplier || 0.55);
            }

            // Tactical Strafing movement
            const preferredDist = 220;
            let moveAngle = dir;

            if (dist < preferredDist - 40) {
                moveAngle = dir + Math.PI + this.strafeAngle * 0.4;
            } else if (dist > preferredDist + 60) {
                moveAngle = dir + this.strafeAngle * 0.5;
            } else {
                moveAngle = dir + Math.PI / 2 * this.strafeAngle;
            }

            this.vx = Math.cos(moveAngle) * currentSpeed;
            this.vy = Math.sin(moveAngle) * currentSpeed;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Separation & Bounds
        this.applySeparation(enemies);
        this.applyArenaBounds(arena);

        // Walking animation
        if (Math.abs(this.vx) > 0.3 || Math.abs(this.vy) > 0.3) {
            this.walkCycle += 0.22 * dt;
        }
    }

    shootSoccerBall(player, dir) {
        if (!window.gameInstance) return;

        if (window.soundEngine) {
            window.soundEngine.playShoot('normal');
        }

        const muzzleX = this.x + Math.cos(dir) * (this.radius + 12);
        const muzzleY = this.y + Math.sin(dir) * (this.radius + 12);

        const soccerBullet = new Bullet({
            x: muzzleX,
            y: muzzleY,
            vx: Math.cos(dir) * 9.5,
            vy: Math.sin(dir) * 9.5,
            damage: this.damage,
            speed: 9.5,
            radius: 11,
            type: 'soccer',
            isEnemy: true,
            range: 650,
            shooter: this
        });

        window.gameInstance.bullets.push(soccerBullet);

        if (window.effectsManager) {
            window.effectsManager.addComicSplash(this.x, this.y - 25, 'KICK!');
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
        ctx.beginPath();
        ctx.ellipse(0, this.radius * 0.8, this.radius * 0.9, this.radius * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(this.angle);

        const bob = Math.sin(this.walkCycle) * 2.5;
        ctx.translate(0, bob);

        this.drawCasillasBody(ctx, bob, this.hitFlash > 0);

        ctx.restore();

        // Overhead HUD
        this.drawOverheadHUD(ctx);
    }

    drawCasillasBody(ctx, bob, flash) {
        const r = this.radius;
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#1e272e';

        // Green Goalkeeper Jersey (#1)
        ctx.fillStyle = flash ? '#ffffff' : '#20bf6b';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // White Jersey stripes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-r * 0.4, -r * 0.7, 5, r * 1.4);

        // Brown Athletic Spiky Hair
        ctx.fillStyle = flash ? '#ffffff' : '#4b2a0c';
        ctx.beginPath();
        ctx.arc(-r * 0.25, 0, r * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Goalkeeper Padded Gloves
        ctx.fillStyle = flash ? '#ffffff' : '#fa8231';
        ctx.beginPath();
        ctx.arc(r * 0.65, -r * 0.65, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(r * 0.65, r * 0.65, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Face & Smirking Eyes
        if (!flash) {
            const eyeX = r * 0.35;

            // Focused Eyebrows
            ctx.strokeStyle = '#4b2a0c';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(eyeX - 2, -9);
            ctx.lineTo(eyeX + 6, -5);
            ctx.moveTo(eyeX - 2, 9);
            ctx.lineTo(eyeX + 6, 5);
            ctx.stroke();

            // Eyes
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#1e272e';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(eyeX, -5, 4.5, 0, Math.PI * 2);
            ctx.arc(eyeX, 5, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Brown Pupils
            ctx.fillStyle = '#4b2a0c';
            ctx.beginPath();
            ctx.arc(eyeX + 1.5, -5, 2, 0, Math.PI * 2);
            ctx.arc(eyeX + 1.5, 5, 2, 0, Math.PI * 2);
            ctx.fill();

            // Smirk
            ctx.strokeStyle = '#1e272e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(eyeX + 2, 0, 3, -0.4, 0.4);
            ctx.stroke();
        }
    }
}
