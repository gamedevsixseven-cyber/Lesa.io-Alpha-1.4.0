/**
 * Lesa.io - Arena Obstacles & Interactive Props
 * Destructible Crates, Bouncy Mushrooms, and Stealth Bushes
 */

class Obstacle {
    constructor(x, y, type = 'crate') {
        this.x = x;
        this.y = y;
        this.type = type; // 'crate', 'barrel', 'mushroom', 'bush', 'tree'
        this.radius = type === 'tree' ? 36 : (type === 'crate' ? 26 : (type === 'barrel' ? 24 : (type === 'mushroom' ? 24 : 32)));
        this.maxHp = (type === 'tree' || type === 'mushroom' || type === 'bush') ? 99999 : (type === 'crate' ? 40 : 35);
        this.hp = this.maxHp;
        this.hitFlash = 0;
        this.dead = false;
        this.bounceScale = 1.0;
        this.bounceCooldown = 0;
    }

    takeDamage(amount, effects = null, game = null) {
        if (this.type !== 'crate' && this.type !== 'barrel') return false;

        this.hp -= amount;
        this.hitFlash = 6;
        if (effects) {
            effects.addSparks(this.x, this.y, this.type === 'barrel' ? '#ff4757' : '#d28c38', 4);
        }

        if (this.hp <= 0) {
            this.dead = true;

            if (this.type === 'barrel') {
                this.explode(effects, game);
                return true;
            }

            if (window.soundEngine) {
                window.soundEngine.playCrateBreak();
            }
            if (effects) {
                effects.addDust(this.x, this.y, 8, 14);
                effects.addSparks(this.x, this.y, '#e58e26', 8);
            }
            return true; // Destroyed!
        }
        return false;
    }

    explode(effects = null, game = null) {
        if (window.soundEngine) {
            if (typeof window.soundEngine.playTntExplosion === 'function') {
                window.soundEngine.playTntExplosion();
            } else if (typeof window.soundEngine.playFatmirSlam === 'function') {
                window.soundEngine.playFatmirSlam();
            } else if (typeof window.soundEngine.playHit === 'function') {
                window.soundEngine.playHit(false, true);
            }
        }

        if (effects) {
            effects.addShockwave(this.x, this.y, 160, 'rgba(255, 71, 87, 0.95)');
            effects.addComicSplash(this.x, this.y - 30, 'BOOM!');
            effects.addSparks(this.x, this.y, '#ff4757', 12);
            effects.addSparks(this.x, this.y, '#ffa502', 10);
            effects.addDust(this.x, this.y, 8, 16);
        }

        const activeGame = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        if (activeGame) {
            if (activeGame.camera) activeGame.camera.addShake(16);

            const blastRadius = 175;
            const blastRadiusSq = blastRadius * blastRadius;

            // Damage nearby enemies for 250 AoE damage
            if (activeGame.enemies) {
                for (let i = 0; i < activeGame.enemies.length; i++) {
                    const e = activeGame.enemies[i];
                    if (e.dead) continue;
                    const dx = e.x - this.x;
                    const dy = e.y - this.y;
                    if (dx * dx + dy * dy <= blastRadiusSq) {
                        e.takeDamage(250, effects);
                        // Blast knockback
                        const dist = Math.hypot(dx, dy) || 1;
                        e.x += (dx / dist) * 35;
                        e.y += (dy / dist) * 35;
                    }
                }
            }

            // Damage player if standing too close
            if (activeGame.player && activeGame.player.hp > 0) {
                const pdx = activeGame.player.x - this.x;
                const pdy = activeGame.player.y - this.y;
                if (pdx * pdx + pdy * pdy <= 110 * 110) {
                    activeGame.player.takeDamage(25, effects, activeGame.camera);
                }
            }

            // Chain reaction with adjacent barrels
            if (activeGame.arena && activeGame.arena.obstacles) {
                for (let oi = 0; oi < activeGame.arena.obstacles.length; oi++) {
                    const other = activeGame.arena.obstacles[oi];
                    if (other !== this && !other.dead && other.type === 'barrel') {
                        const odx = other.x - this.x;
                        const ody = other.y - this.y;
                        if (odx * odx + ody * ody <= 150 * 150) {
                            setTimeout(() => {
                                if (!other.dead) other.takeDamage(100, effects, activeGame);
                            }, 120);
                        }
                    }
                }
            }

            // Spawn reward drops from barrel
            if (activeGame.drops) {
                activeGame.drops.push(new Drop(this.x, this.y, 'xp', 35));
                activeGame.drops.push(new Drop(this.x + 15, this.y - 10, 'xp', 25));
                if (Math.random() < 0.4) activeGame.drops.push(new Drop(this.x - 15, this.y, 'heart', 30));
                if (Math.random() < 0.25) activeGame.drops.push(new Drop(this.x, this.y + 15, 'star', 1));
            }
        }
    }

    triggerMushroom(entity, effects = null) {
        if (this.type !== 'mushroom' || this.bounceCooldown > 0) return;

        this.bounceCooldown = 25;
        this.bounceScale = 1.5;
        window.soundEngine.playMushroomBounce();

        // Launch entity in current direction or random angle
        const angle = entity.angle !== undefined ? entity.angle : Math.random() * Math.PI * 2;
        entity.vx = Math.cos(angle) * 16;
        entity.vy = Math.sin(angle) * 16;

        if (effects) {
            effects.addComicSplash(this.x, this.y - 20, 'BOING!');
            effects.addShockwave(this.x, this.y, 70, 'rgba(255, 107, 129, 0.8)');
        }
    }

    update(dt = 1) {
        if (this.hitFlash > 0) this.hitFlash -= dt;
        if (this.bounceCooldown > 0) this.bounceCooldown -= dt;
        if (this.bounceScale > 1.0) {
            this.bounceScale -= 0.05 * dt;
            if (this.bounceScale < 1.0) this.bounceScale = 1.0;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Shadow (tree illustration already has an authentic baked soft shadow)
        if (this.type !== 'tree') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
            ctx.beginPath();
            ctx.ellipse(0, this.radius * 0.75, this.radius * 0.9, this.radius * 0.35, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.type === 'crate') {
            this.drawCrate(ctx);
        } else if (this.type === 'barrel') {
            this.drawBarrel(ctx);
        } else if (this.type === 'mushroom') {
            this.drawMushroom(ctx);
        } else if (this.type === 'bush') {
            this.drawBush(ctx);
        } else if (this.type === 'tree') {
            this.drawTree(ctx);
        }

        ctx.restore();
    }

    drawCrate(ctx) {
        const size = this.radius * 1.6;
        const half = size / 2;

        ctx.lineWidth = 3;
        ctx.strokeStyle = '#1b1b1b';
        ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : '#cc8e35';

        // Outer wooden box
        ctx.fillRect(-half, -half, size, size);
        ctx.strokeRect(-half, -half, size, size);

        // Inner X planks
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#9c6615';
        ctx.beginPath();
        ctx.moveTo(-half + 4, -half + 4);
        ctx.lineTo(half - 4, half - 4);
        ctx.moveTo(half - 4, -half + 4);
        ctx.lineTo(-half + 4, half - 4);
        ctx.stroke();

        // Corner iron brackets
        ctx.fillStyle = '#57606f';
        ctx.fillRect(-half, -half, 6, 6);
        ctx.fillRect(half - 6, -half, 6, 6);
        ctx.fillRect(-half, half - 6, 6, 6);
        ctx.fillRect(half - 6, half - 6, 6, 6);
    }

    drawMushroom(ctx) {
        ctx.scale(this.bounceScale, 2 - this.bounceScale);
        const r = this.radius;

        // White Stem
        ctx.fillStyle = '#f1f2f6';
        ctx.strokeStyle = '#1b1b1b';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.rect(-r * 0.3, 0, r * 0.6, r * 0.8);
        ctx.fill();
        ctx.stroke();

        // Red Polka-dot Mushroom Cap
        ctx.fillStyle = '#ff4757';
        ctx.beginPath();
        ctx.arc(0, 0, r, Math.PI, 0, false);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // White Spots
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -r * 0.5, r * 0.22, 0, Math.PI * 2);
        ctx.arc(-r * 0.5, -r * 0.2, r * 0.16, 0, Math.PI * 2);
        ctx.arc(r * 0.5, -r * 0.2, r * 0.16, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBush(ctx) {
        const r = this.radius;
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#1b1b1b';
        ctx.fillStyle = '#2ed573';

        // Fluffy cartoon leafy bush
        ctx.beginPath();
        ctx.arc(-r * 0.45, 0, r * 0.55, 0, Math.PI * 2);
        ctx.arc(r * 0.45, 0, r * 0.55, 0, Math.PI * 2);
        ctx.arc(0, -r * 0.4, r * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Highlights
        ctx.fillStyle = '#7bed9f';
        ctx.beginPath();
        ctx.arc(0, -r * 0.5, r * 0.3, 0, Math.PI * 2);
        ctx.arc(-r * 0.4, -r * 0.1, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBarrel(ctx) {
        const r = this.radius;
        const w = r * 1.5;
        const h = r * 1.8;
        const halfW = w / 2;
        const halfH = h / 2;

        ctx.lineWidth = 3;
        ctx.strokeStyle = '#1e272e';

        // Red explosive drum body
        ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : '#ff4757';
        ctx.beginPath();
        ctx.roundRect(-halfW, -halfH, w, h, 6);
        ctx.fill();
        ctx.stroke();

        // Dark metal reinforcement hoops
        ctx.fillStyle = '#2f3542';
        ctx.fillRect(-halfW + 1, -halfH + 6, w - 2, 5);
        ctx.fillRect(-halfW + 1, halfH - 11, w - 2, 5);

        // Yellow & Black Diagonal Hazard Stripes Center Band
        ctx.save();
        ctx.beginPath();
        ctx.rect(-halfW + 2, -6, w - 4, 12);
        ctx.clip();

        ctx.fillStyle = '#fed330';
        ctx.fillRect(-halfW + 2, -6, w - 4, 12);

        ctx.fillStyle = '#2f3542';
        for (let x = -halfW - 10; x < halfW + 15; x += 10) {
            ctx.beginPath();
            ctx.moveTo(x, -6);
            ctx.lineTo(x + 5, -6);
            ctx.lineTo(x, 6);
            ctx.lineTo(x - 5, 6);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        // White warning flame icon or exclamation
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 12px "Luckiest Guy", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TNT', 0, -halfH + 16);

        // Highlight sheen
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillRect(-halfW + 3, -halfH + 3, 3, h - 6);
    }

    static treeImage = null;
    static getTreeImage() {
        if (!Obstacle.treeImage && typeof Image !== 'undefined') {
            Obstacle.treeImage = new Image();
            Obstacle.treeImage.src = 'assets/GameWorldModels/UpdatedTreeLESAIO_transparent.png';
        }
        return Obstacle.treeImage;
    }

    drawTree(ctx) {
        const img = Obstacle.getTreeImage();
        // 2.5D Scale: 215px wide by 210px tall
        const w = 215;
        const h = 210;
        // Align bottom trunk center with this.x, this.y
        const drawX = -w * 0.5;
        const drawY = -h * 0.86;

        // Soft natural ground shadow under trunk base
        ctx.fillStyle = 'rgba(20, 45, 15, 0.30)';
        ctx.beginPath();
        ctx.ellipse(0, 4, 38, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, drawX, drawY, w, h);
        } else {
            // Fallback while loading
            ctx.fillStyle = '#2ed573';
            ctx.beginPath();
            ctx.arc(0, -this.radius * 0.8, this.radius * 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#795548';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
