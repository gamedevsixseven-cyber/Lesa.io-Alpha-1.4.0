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
        this.kickAnimTimer = 0;
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        if (this.hitFlash > 0) this.hitFlash -= dt;
        if (this.kickAnimTimer > 0) this.kickAnimTimer -= dt;

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
        this.kickAnimTimer = 14;

        if (window.effectsManager) {
            window.effectsManager.addComicSplash(this.x, this.y - 25, 'KICK!');
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Ground shadow under shoes
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.beginPath();
        ctx.ellipse(0, this.radius * 0.88, this.radius * 0.85, this.radius * 0.34, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dive / dodge motion streak
        if (this.isDodging) {
            ctx.strokeStyle = 'rgba(46, 213, 115, 0.55)';
            ctx.lineWidth = 3;
            for (let s = -1; s <= 1; s++) {
                ctx.beginPath();
                ctx.moveTo(-Math.sign(this.vx || 1) * 14, s * 9);
                ctx.lineTo(-Math.sign(this.vx || 1) * 32, s * 9);
                ctx.stroke();
            }
        }

        const bob = Math.abs(Math.sin(this.walkCycle)) * -2.6;
        ctx.translate(0, bob);

        const facingLeft = Math.cos(this.angle) < 0;
        const isBack = Math.sin(this.angle) < -0.25;
        if (!this.isDodging && (this.kickAnimTimer || 0) <= 0 && typeof SpriteAtlasCache !== 'undefined') {
            const r = this.radius || 20;
            const rKey = Math.round(r * 2);
            const walkBin = SpriteAtlasCache.quantizePhase(this.walkCycle || 0, 8);
            const qCycle = SpriteAtlasCache.binAngle(walkBin, 8);
            const flash = this.hitFlash > 0;
            const dirKey = isBack ? 'b' : (facingLeft ? 'fl' : 'fr');
            const bodyKey = `casillas_b:${rKey}:${walkBin}:${dirKey}:${flash ? 1 : 0}`;
            const bw = Math.ceil(r * 4.4);
            const bh = Math.ceil(r * 4.4);
            SpriteAtlasCache.drawCached(ctx, bodyKey, bw, bh, bw * 0.5, bh * 0.5, (bctx) => {
                const origCycle = this.walkCycle;
                this.walkCycle = qCycle;
                try {
                    this.drawCasillasBody(bctx, flash, facingLeft, isBack);
                } finally {
                    this.walkCycle = origCycle;
                }
            });
        } else {
            this.drawCasillasBody(ctx, this.hitFlash > 0, facingLeft, isBack);
        }

        ctx.restore();
        this.drawOverheadHUD(ctx);
    }

    drawCasillasBody(ctx, flash, facingLeft, isBack) {
        const r = this.radius;
        const skin = flash ? '#ffffff' : '#e6b287';
        const hair = flash ? '#ffffff' : '#533527';
        const shirt = flash ? '#ffffff' : '#10ac84';
        const shirtTrim = flash ? '#ffffff' : '#0a7a5c';
        const jeans = flash ? '#ffffff' : '#2d4b73';
        const swing = Math.sin(this.walkCycle);
        const kickT = this.kickAnimTimer > 0 ? Math.sin((this.kickAnimTimer / 14) * Math.PI) : 0;

        ctx.save();
        if (facingLeft) ctx.scale(-1, 1);
        if (this.isDodging) ctx.rotate(0.22);

        ctx.lineWidth = 2.4;
        ctx.strokeStyle = '#141418';

        // 1. Animated Jeans Legs & Casual Sneakers (no keeper gear)
        const drawLeg = (hipX, stride, kickLift) => {
            ctx.save();
            ctx.translate(hipX, r * 0.32);
            ctx.rotate(stride * 0.28 - kickLift * 0.7);
            ctx.fillStyle = jeans;
            ctx.beginPath();
            ctx.roundRect(-4.5, -2, 9, r * 0.52, 4);
            ctx.fill();
            ctx.stroke();
            // Casual white-and-navy sneaker
            ctx.fillStyle = flash ? '#ffffff' : '#f1f2f6';
            ctx.beginPath();
            ctx.roundRect(-4, r * 0.44, 12, 6, 3);
            ctx.fill();
            ctx.stroke();
            if (!flash) {
                ctx.fillStyle = '#2d4b73';
                ctx.fillRect(-3.5, r * 0.44 + 3.5, 11, 2);
            }
            ctx.restore();
        };
        drawLeg(-r * 0.28, -swing, 0);
        drawLeg(r * 0.24, swing, kickT);

        // 2. Back-side Arm (ordinary bare arm swinging)
        ctx.save();
        ctx.translate(-r * 0.56, -r * 0.14);
        ctx.rotate(-swing * 0.35);
        ctx.fillStyle = shirt;
        ctx.beginPath();
        ctx.roundRect(-4, -3, 8, 9, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.roundRect(-3.5, 5, 7, 10, 3);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // 3. Oversized "Casillas" Fan T-Shirt Torso
        ctx.fillStyle = shirt;
        ctx.beginPath();
        ctx.roundRect(-r * 0.60, -r * 0.36, r * 1.20, r * 0.80, [8, 8, 5, 5]);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            // Shoulder stripes & collar trim
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-r * 0.56, -r * 0.34, 3.5, r * 0.42);
            ctx.fillRect(r * 0.56 - 3.5, -r * 0.34, 3.5, r * 0.42);

            ctx.fillStyle = shirtTrim;
            ctx.beginPath();
            ctx.ellipse(0, -r * 0.34, r * 0.24, r * 0.1, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Crisp un-mirrored shirt print ("CASILLAS" + "1") constrained inside torso width
            ctx.save();
            if (facingLeft) ctx.scale(-1, 1);
            if (isBack) {
                const lName = EnemyBase.getLabelSprite('CASILLAS', '900 6.5px "Fredoka", Arial, sans-serif', '#ffffff', '#093b2d', 2, r * 0.94, 'middle');
                EnemyBase.drawLabel(ctx, lName, 0, -r * 0.14);
                const lNum = EnemyBase.getLabelSprite('1', '900 12px "Luckiest Guy", Arial, sans-serif', '#ffffff', '#093b2d', 2, 0, 'middle');
                EnemyBase.drawLabel(ctx, lNum, 0, r * 0.16);
            } else {
                // Chest banner print so front view clearly shows "CASILLAS" shirt
                ctx.fillStyle = '#094535';
                ctx.beginPath();
                ctx.roundRect(-r * 0.48, -r * 0.16, r * 0.96, r * 0.46, 4);
                ctx.fill();
                const lName = EnemyBase.getLabelSprite('CASILLAS', '900 6px "Fredoka", Arial, sans-serif', '#ffffff', '', 0, r * 0.86, 'middle');
                EnemyBase.drawLabel(ctx, lName, 0, -r * 0.04);
                const lNum = EnemyBase.getLabelSprite('#1', '900 8.5px "Fredoka", Arial, sans-serif', '#feca57', '', 0, r * 0.72, 'middle');
                EnemyBase.drawLabel(ctx, lNum, 0, r * 0.18);
            }
            ctx.restore();
        }

        // 4. Head & Regular Guy Face
        ctx.save();
        ctx.translate(0, -r * 0.72);
        // Neck
        ctx.fillStyle = skin;
        ctx.fillRect(-4, r * 0.2, 8, 7);

        // Ears & Head
        ctx.beginPath();
        ctx.ellipse(-r * 0.42, 0, 3.5, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(r * 0.42, 0, 3.5, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.43, r * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (isBack) {
            ctx.fillStyle = hair;
            ctx.beginPath();
            ctx.arc(0, -1, r * 0.44, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else {
            // Messy tousled hair swoosh
            ctx.fillStyle = hair;
            ctx.beginPath();
            ctx.arc(0, -r * 0.16, r * 0.43, Math.PI * 0.92, Math.PI * 2.08);
            ctx.quadraticCurveTo(r * 0.18, -r * 0.04, 0, -r * 0.16);
            ctx.quadraticCurveTo(-r * 0.22, -r * 0.02, -r * 0.41, -r * 0.08);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            if (!flash) {
                // Casual fan guy eyebrows, eyes & cheeky smirk
                ctx.strokeStyle = hair;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-r * 0.22, -4);
                ctx.lineTo(-r * 0.06, -3);
                ctx.moveTo(r * 0.1, -3);
                ctx.lineTo(r * 0.28, -4.5);
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#141418';
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.arc(-r * 0.12, 0, 3.2, 0, Math.PI * 2);
                ctx.arc(r * 0.18, 0, 3.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#2d1a12';
                ctx.beginPath();
                ctx.arc(-r * 0.09, 0, 1.5, 0, Math.PI * 2);
                ctx.arc(r * 0.21, 0, 1.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#141418';
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.arc(r * 0.05, 5, 3.5, 0.15, Math.PI - 0.3);
                ctx.stroke();
            }
        }
        ctx.restore();

        // 5. Front-side Arm (bare hand, relaxed fan stance)
        ctx.save();
        ctx.translate(r * 0.56, -r * 0.14);
        ctx.rotate(swing * 0.35 - kickT * 0.45);
        ctx.fillStyle = shirt;
        ctx.beginPath();
        ctx.roundRect(-4, -3, 8, 9, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.roundRect(-3.5, 5, 7, 10, 3);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.restore();
    }
}
