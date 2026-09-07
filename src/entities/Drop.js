/**
 * Lesa.io - Collectibles & Drops Engine
 * XP Cookies, Milk Bottles / Health Hearts, Magnet Candies, Powerup Stars
 */

class Drop {
    constructor(x, y, type = 'xp', value = 10) {
        this.x = x;
        this.y = y;
        this.type = type; // 'xp', 'heart', 'magnet', 'star', 'shield'
        this.value = value;
        this.radius = type === 'xp' ? 12 : 16;
        this.magnetized = false;
        this.vx = (Math.random() * 2 - 1) * 3;
        this.vy = (Math.random() * 2 - 1) * 3;
        this.age = Math.random() * 100;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.dead = false;
        this.life = 1200; // Despawn after 20 seconds if not picked
    }

    update(dt = 1, player = null, effects = null) {
        this.age += dt;
        this.life -= dt;
        if (this.life <= 0) {
            this.dead = true;
            return;
        }

        // Friction on initial burst
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vx *= 0.88;
        this.vy *= 0.88;

        if (player) {
            const dist = Math.hypot(player.x - this.x, player.y - this.y);
            const magDist = player.magnetRadius + (this.type === 'xp' ? 0 : 30);

            if (dist < magDist || this.magnetized) {
                this.magnetized = true;
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                const pullSpeed = Math.min(20, 4 + (magDist - dist) * 0.12 + 6);
                this.x += Math.cos(angle) * pullSpeed * dt;
                this.y += Math.sin(angle) * pullSpeed * dt;

                // Picked up!
                if (dist < player.radius + this.radius) {
                    this.onCollect(player, effects);
                    this.dead = true;
                }
            }
        }
    }

    onCollect(player, effects) {
        if (this.type === 'xp') {
            player.addXP(this.value);
            if (window.soundEngine) window.soundEngine.playPickup('xp');
            if (effects) effects.addSparks(this.x, this.y, '#ffd32a', 4);
        } else if (this.type === 'heart') {
            player.heal(this.value || 30);
            if (window.soundEngine) window.soundEngine.playPickup('heart');
            if (effects) {
                effects.addPopup(this.x, this.y, `+${this.value || 30} HP`, '#2ed573', 24);
                effects.addSparks(this.x, this.y, '#2ed573', 8);
            }
        } else if (this.type === 'magnet') {
            if (window.soundEngine) window.soundEngine.playPickup('star');
            if (effects) effects.addComicSplash(this.x, this.y, 'MAGNET!');
            if (window.gameInstance) {
                window.gameInstance.vacuumAllXP();
            }
        } else if (this.type === 'star') {
            player.activatePepperFrenzy(7000);
            if (window.soundEngine) window.soundEngine.playPickup('star');
            if (effects) effects.addComicSplash(this.x, this.y, 'FRENZY!');
        } else if (this.type === 'shield') {
            player.addShield();
            if (window.soundEngine) window.soundEngine.playPickup('star');
            if (effects) effects.addComicSplash(this.x, this.y, 'SHIELD!');
        } else if (this.type === 'coin_pouch') {
            const coins = this.value || 20;
            if (window.GameState) {
                window.GameState.addCurrency(coins, 0);
            }
            if (window.gameInstance) {
                window.gameInstance.coinsEarnedThisRun = (window.gameInstance.coinsEarnedThisRun || 0) + coins;
            }
            if (window.soundEngine && typeof window.soundEngine.playPickup === 'function') {
                window.soundEngine.playPickup('xp');
            }
            if (effects) {
                effects.addPopup(this.x, this.y, `+${coins} 🪙`, '#ffd32a', 26);
                effects.addSparks(this.x, this.y, '#ffd32a', 8);
                effects.addComicSplash(this.x, this.y - 20, 'GOLD!');
            }
        }

        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.emit('dropCollected', { type: this.type, value: this.value });
        }
    }

    draw(ctx) {
        const bob = Math.sin((this.age * 0.08) + this.bobOffset) * 4;
        const currentY = this.y + bob;

        ctx.save();
        ctx.translate(this.x, currentY);

        // Blinking if close to despawn
        if (this.life < 180 && Math.floor(this.age / 5) % 2 === 0) {
            ctx.globalAlpha = 0.4;
        }

        // Drop Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(0, -bob + this.radius * 0.8, this.radius * 0.8, this.radius * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.type === 'xp') {
            this.drawXpCookie(ctx);
        } else if (this.type === 'heart') {
            this.drawHeart(ctx);
        } else if (this.type === 'magnet') {
            this.drawMagnet(ctx);
        } else if (this.type === 'star') {
            this.drawStar(ctx);
        } else if (this.type === 'shield') {
            this.drawShield(ctx);
        } else if (this.type === 'coin_pouch') {
            this.drawCoinPouch(ctx);
        }

        ctx.restore();
    }

    drawXpCookie(ctx) {
        const r = this.radius;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#1b1b1b';

        // Chocolate chip cookie
        ctx.fillStyle = '#e58e26';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Choco chips
        ctx.fillStyle = '#4b2a0c';
        const chips = [
            { x: -r * 0.35, y: -r * 0.3, s: 2.5 },
            { x: r * 0.3, y: -r * 0.2, s: 3 },
            { x: 0, y: r * 0.35, s: 2.5 },
            { x: -r * 0.3, y: r * 0.25, s: 2 }
        ];
        for (const c of chips) {
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.s, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawHeart(ctx) {
        const r = this.radius * 1.1;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#1b1b1b';
        ctx.fillStyle = '#ff4757';

        ctx.beginPath();
        const topCurveHeight = r * 0.3;
        ctx.moveTo(0, topCurveHeight);
        ctx.bezierCurveTo(0, 0, -r, 0, -r, topCurveHeight);
        ctx.bezierCurveTo(-r, (r + topCurveHeight) / 1.5, 0, (r + topCurveHeight) * 1.1, 0, r * 1.3);
        ctx.bezierCurveTo(0, (r + topCurveHeight) * 1.1, r, (r + topCurveHeight) / 1.5, r, topCurveHeight);
        ctx.bezierCurveTo(r, 0, 0, 0, 0, topCurveHeight);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // White shine
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-r * 0.4, topCurveHeight * 0.7, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawMagnet(ctx) {
        const r = this.radius;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#1b1b1b';

        // Horseshoe magnet
        ctx.fillStyle = '#eb4d4b';
        ctx.beginPath();
        ctx.arc(0, 0, r, Math.PI, 0, false);
        ctx.lineTo(r, r * 0.6);
        ctx.lineTo(r * 0.5, r * 0.6);
        ctx.lineTo(r * 0.5, 0);
        ctx.arc(0, 0, r * 0.5, 0, Math.PI, true);
        ctx.lineTo(-r * 0.5, r * 0.6);
        ctx.lineTo(-r, r * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Silver tips
        ctx.fillStyle = '#dfe4ea';
        ctx.fillRect(-r, r * 0.2, r * 0.5, r * 0.4);
        ctx.strokeRect(-r, r * 0.2, r * 0.5, r * 0.4);
        ctx.fillRect(r * 0.5, r * 0.2, r * 0.5, r * 0.4);
        ctx.strokeRect(r * 0.5, r * 0.2, r * 0.5, r * 0.4);
    }

    drawStar(ctx) {
        const r = this.radius * 1.2;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#1b1b1b';
        ctx.fillStyle = '#ffa502';

        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * r, -Math.sin((18 + i * 72) * Math.PI / 180) * r);
            ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * (r * 0.45), -Math.sin((54 + i * 72) * Math.PI / 180) * (r * 0.45));
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Comic face on star
        ctx.fillStyle = '#1b1b1b';
        ctx.beginPath();
        ctx.arc(-3, -2, 1.5, 0, Math.PI * 2);
        ctx.arc(3, -2, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#1b1b1b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 1, 3, 0.2, Math.PI - 0.2);
        ctx.stroke();
    }

    drawShield(ctx) {
        const r = this.radius * 1.2;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#1b1b1b';

        // Cartoon Blue Shield
        ctx.fillStyle = '#70a1ff';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-r * 0.35, -r * 0.35, r * 0.25, 0, Math.PI * 2);
        ctx.fill();
    }

    drawCoinPouch(ctx) {
        const r = this.radius * 1.15;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#1b1b1b';

        // Pouch sack body (golden fabric)
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.ellipse(0, 3, r, r * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Pouch neck / gathered ruffled top
        ctx.fillStyle = '#e67e22';
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.7, r * 0.6, r * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Red tied ribbon string
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-r * 0.45, -r * 0.45);
        ctx.lineTo(r * 0.45, -r * 0.45);
        ctx.stroke();

        // Shiny Golden Coin on center
        ctx.fillStyle = '#f1c40f';
        ctx.strokeStyle = '#1b1b1b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 3, r * 0.48, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Coin shine highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-r * 0.16, -r * 0.1, r * 0.12, 0, Math.PI * 2);
        ctx.fill();

        // Inner coin ring
        ctx.strokeStyle = '#d68910';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 3, r * 0.35, 0, Math.PI * 2);
        ctx.stroke();
    }
}
