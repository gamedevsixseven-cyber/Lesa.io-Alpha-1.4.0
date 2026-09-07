/**
 * Lesa.io - Projectile Engine
 * Cartoon bullets with squash-stretch, trails, bounces, and splash hits
 */

class Bullet {
    constructor(optOrX, y, vx, vy, damage = 25, speed = 12, radius = 8, type = 'pea', isEnemy = false, pierce = 1, maxBounces = 0, range = 900, shooter = null) {
        let opt = {};
        if (typeof optOrX === 'object' && optOrX !== null) {
            opt = optOrX;
        } else {
            opt = {
                x: optOrX,
                y: y,
                vx: vx,
                vy: vy,
                damage: damage,
                speed: speed,
                radius: radius,
                type: type,
                isEnemy: isEnemy,
                pierce: pierce,
                maxBounces: maxBounces,
                range: range,
                shooter: shooter
            };
        }

        this.x = opt.x || 0;
        this.y = opt.y || 0;
        this.vx = opt.vx || 0;
        this.vy = opt.vy || 0;
        this.damage = opt.damage !== undefined ? opt.damage : 25;
        this.speed = opt.speed || 12;
        this.radius = opt.radius || 8;
        this.type = opt.type || 'pea';
        this.isEnemy = opt.isEnemy || false;
        this.pierce = opt.pierce !== undefined ? opt.pierce : 1;
        this.bouncesLeft = opt.maxBounces || 0;
        this.distanceTraveled = 0;
        this.maxRange = opt.range || 900;
        this.shooter = opt.shooter || null;
        this.dead = false;
        this.isCrit = opt.isCrit || false;
        this.hitEntities = new Set(); // Track pierced entities so each target is damaged only once per bullet pass

        this.rotation = Math.atan2(this.vy, this.vx);
        this.trail = [];
        this.age = 0;
        this.scaleX = 1.3;
        this.scaleY = 0.8;
    }

    update(dt = 1, arena = null, effects = null) {
        this.age += dt;
        const moveDist = Math.hypot(this.vx, this.vy) * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.distanceTraveled += moveDist;

        // Trail recording
        if (this.age % 2 === 0) {
            this.trail.unshift({ x: this.x, y: this.y, alpha: 0.7 });
            if (this.trail.length > 5) this.trail.pop();
        }

        // Bouncy bubble wobble or watermelon spin
        if (this.type === 'bubble') {
            this.scaleX = 1 + Math.sin(this.age * 0.3) * 0.2;
            this.scaleY = 1 + Math.cos(this.age * 0.3) * 0.2;
        } else if (this.type === 'watermelon' || this.type === 'soccer') {
            this.rotation += 0.15 * dt;
        } else if (this.type === 'money_gun' || this.type === 'euro') {
            this.rotation += Math.sin(this.age * 0.4) * 0.04;
        }

        // Range expiration
        if (this.distanceTraveled >= this.maxRange) {
            this.explode(effects);
            this.dead = true;
        }

        // Arena boundary collision
        if (arena) {
            if (this.x - this.radius < -arena.halfWidth || this.x + this.radius > arena.halfWidth) {
                if (this.bouncesLeft > 0) {
                    this.vx = -this.vx;
                    this.bouncesLeft--;
                    if (this.hitEntities) this.hitEntities.clear();
                    this.rotation = Math.atan2(this.vy, this.vx);
                    if (effects) effects.addSparks(this.x, this.y, '#34c759', 4);
                } else {
                    this.explode(effects);
                    this.dead = true;
                }
            }
            if (this.y - this.radius < -arena.halfHeight || this.y + this.radius > arena.halfHeight) {
                if (this.bouncesLeft > 0) {
                    this.vy = -this.vy;
                    this.bouncesLeft--;
                    if (this.hitEntities) this.hitEntities.clear();
                    this.rotation = Math.atan2(this.vy, this.vx);
                    if (effects) effects.addSparks(this.x, this.y, '#34c759', 4);
                } else {
                    this.explode(effects);
                    this.dead = true;
                }
            }
        }
    }

    explode(effects) {
        if (!effects) return;
        if (this.type === 'watermelon') {
            effects.addShockwave(this.x, this.y, 90, 'rgba(235, 77, 75, 0.7)');
            effects.addSparks(this.x, this.y, '#eb4d4b', 10);
            effects.addSparks(this.x, this.y, '#6ab04c', 8);
        } else if (this.type === 'pepper') {
            effects.addSparks(this.x, this.y, '#ff4757', 8);
        } else if (this.type === 'soccer') {
            effects.addDust(this.x, this.y, 4, 8);
        } else if (this.type === 'bubble') {
            if (this.isChargedBubble) {
                effects.addShockwave(this.x, this.y, 75, 'rgba(0, 206, 201, 0.85)');
                effects.addSparks(this.x, this.y, '#00d2d3', 10);
                effects.addSparks(this.x, this.y, '#70a1ff', 8);
                effects.addComicSplash(this.x, this.y - 22, '🫧 POP!');
            } else {
                effects.addSparks(this.x, this.y, '#70a1ff', 6);
                effects.addSparks(this.x, this.y, '#00d2d3', 4);
            }
            if (window.soundEngine && typeof window.soundEngine.playShoot === 'function') {
                window.soundEngine.playShoot('bubble');
            }
        } else {
            effects.addSparks(this.x, this.y, this.isEnemy ? '#ff3b30' : '#7bed9f', 5);
        }
    }

    draw(ctx) {
        // Draw trail (Optimized: Zero save/restore per trail point)
        if (this.trail.length > 0) {
            ctx.fillStyle = this.getTrailColor();
            const len = this.trail.length;
            for (let i = 0; i < len; i++) {
                const pt = this.trail[i];
                ctx.globalAlpha = (1 - i / len) * 0.38;
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, this.radius * (1 - i / len * 0.6), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scaleX, this.scaleY);

        if (this.type === 'watermelon') {
            this.drawWatermelon(ctx);
        } else if (this.type === 'bubble') {
            this.drawBubble(ctx);
        } else if (this.type === 'pepper') {
            this.drawPepper(ctx);
        } else if (this.type === 'soccer') {
            this.drawSoccerBall(ctx);
        } else if (this.type === 'smoke') {
            this.drawSmokeBomb(ctx);
        } else if (this.type === 'money_gun' || this.type === 'euro') {
            this.drawEuroBill(ctx);
        } else if (this.type === 'soundwave' || this.type === 'dialtone') {
            this.drawSoundwave(ctx);
        } else {
            this.drawPea(ctx);
        }

        ctx.restore();
    }

    getTrailColor() {
        if (this.type === 'watermelon') return '#eb4d4b';
        if (this.type === 'bubble') return '#70a1ff';
        if (this.type === 'pepper') return '#ff6b6b';
        if (this.type === 'soccer') return '#ffffff';
        if (this.type === 'smoke') return '#9b59b6';
        if (this.type === 'money_gun' || this.type === 'euro') return '#f39c12';
        if (this.type === 'soundwave' || this.type === 'dialtone') return '#fed330';
        return this.isEnemy ? '#ff4757' : '#2ed573';
    }

    drawPea(ctx) {
        // Outline
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#1b1b1b';
        ctx.fillStyle = this.isEnemy ? '#ff4757' : '#2ed573';

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Highlight shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(-this.radius * 0.35, -this.radius * 0.35, this.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
    }

    drawWatermelon(ctx) {
        const r = this.radius * 1.5;
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#1b1b1b';

        // Green Rind
        ctx.fillStyle = '#20bf6b';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Dark green stripes
        ctx.fillStyle = '#0b6623';
        for (let a = -0.5; a <= 0.5; a += 0.5) {
            ctx.beginPath();
            ctx.ellipse(a * r * 0.8, 0, r * 0.15, r * 0.85, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Inner Red Flesh (slice preview shine)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(-r * 0.3, -r * 0.3, r * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBubble(ctx) {
        const wobble = Math.sin(this.wobblePhase || 0) * 0.12;
        const rx = this.radius * (1.2 + wobble);
        const ry = this.radius * (1.2 - wobble);

        ctx.save();
        ctx.rotate(this.wobblePhase ? this.wobblePhase * 0.3 : 0);

        // 1. Translucent iridescent bubble fill
        const bubbleGrad = ctx.createRadialGradient(-rx * 0.3, -ry * 0.3, rx * 0.1, 0, 0, rx);
        bubbleGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        bubbleGrad.addColorStop(0.3, 'rgba(112, 161, 255, 0.45)');
        bubbleGrad.addColorStop(0.7, 'rgba(0, 206, 201, 0.55)');
        bubbleGrad.addColorStop(0.95, 'rgba(224, 86, 253, 0.65)');
        bubbleGrad.addColorStop(1, 'rgba(112, 161, 255, 0.7)');

        ctx.fillStyle = bubbleGrad;
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 2.2;

        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 2. Inner soap film rainbow rim
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx * 0.85, ry * 0.85, 0, 0, Math.PI * 2);
        ctx.stroke();

        // 3. Primary gloss crescent highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-rx * 0.42, -ry * 0.42, rx * 0.32, ry * 0.18, -0.6, 0, Math.PI * 2);
        ctx.fill();

        // 4. Secondary lower specular glint
        ctx.beginPath();
        ctx.arc(rx * 0.45, ry * 0.45, rx * 0.12, 0, Math.PI * 2);
        ctx.fill();

        // 5. Charged Mega Bubble Radiant Effects
        if (this.isChargedBubble) {
            ctx.strokeStyle = 'rgba(0, 206, 201, 0.85)';
            ctx.lineWidth = 3.0;
            ctx.beginPath();
            ctx.ellipse(0, 0, rx + 3.5, ry + 3.5, 0, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.beginPath();
            ctx.arc(0, 0, rx * 0.28, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    drawEuroBill(ctx) {
        const w = this.radius * 2.5;
        const h = this.radius * 1.4;
        const halfW = w / 2;
        const halfH = h / 2;

        ctx.save();

        // 1. Banknote Border & Outer Fill (50 Euro Note Warm Orange)
        ctx.fillStyle = '#f39c12';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(-halfW, -halfH, w, h, 2.5);
        ctx.fill();
        ctx.stroke();

        // 2. Inner Pattern Layer
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(-halfW + 2, -halfH + 2, w - 4, h - 4);

        // Holographic Silver Strip
        ctx.fillStyle = '#dfe6e9';
        ctx.fillRect(-halfW + 3, -halfH + 2, 3, h - 4);

        // EU Stars Motif
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(-halfW + 9, 0, 2, 0, Math.PI * 2);
        ctx.fill();

        // 3. Denomination "50" Text
        ctx.fillStyle = '#2c3e50';
        ctx.font = '900 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('50', 2, 0);

        // 4. "€" Euro Symbol
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 6px sans-serif';
        ctx.fillText('€', halfW - 4, 0);

        // Shimmer glint across bill
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(-halfW + 4, -halfH + 2);
        ctx.lineTo(-halfW + 9, -halfH + 2);
        ctx.lineTo(-halfW + 6, halfH - 2);
        ctx.lineTo(-halfW + 1, halfH - 2);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    drawPepper(ctx) {
        const r = this.radius * 1.4;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#1b1b1b';

        // Fiery pepper body
        ctx.fillStyle = '#ff4757';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.2, r * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Green stem
        ctx.fillStyle = '#2ed573';
        ctx.beginPath();
        ctx.arc(-r * 0.9, 0, r * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    drawSoccerBall(ctx) {
        const r = this.radius * 1.3;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#1b1b1b';

        // White base
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Black patches
        ctx.fillStyle = '#2f3542';
        // Center pentagon
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 72 - 90) * Math.PI / 180;
            const px = Math.cos(angle) * (r * 0.35);
            const py = Math.sin(angle) * (r * 0.35);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Perimeter patches
        for (let i = 0; i < 5; i++) {
            const angle = (i * 72 - 90) * Math.PI / 180;
            const px = Math.cos(angle) * (r * 0.85);
            const py = Math.sin(angle) * (r * 0.85);
            ctx.beginPath();
            ctx.arc(px, py, r * 0.2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawSmokeBomb(ctx) {
        const r = this.radius * 1.3;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#1b1b1b';

        // Purple swirling smoke canister / bomb
        ctx.fillStyle = '#8e44ad';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Swirl puffs
        ctx.fillStyle = '#9b59b6';
        ctx.beginPath();
        ctx.arc(-r * 0.3, -r * 0.2, r * 0.45, 0, Math.PI * 2);
        ctx.arc(r * 0.3, r * 0.2, r * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Center fuse spark
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
        ctx.fill();
    }

    drawSoundwave(ctx) {
        const r = this.radius * 1.35;
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = '#fed330';
        ctx.fillStyle = '#fffa65';

        // Outer sonic soundwave arc
        ctx.beginPath();
        ctx.arc(0, 0, r, -Math.PI * 0.55, Math.PI * 0.55);
        ctx.stroke();

        // Inner sonic soundwave arc
        ctx.beginPath();
        ctx.arc(-r * 0.25, 0, r * 0.65, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();

        // Electric pulse core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-r * 0.35, 0, r * 0.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}
