/**
 * Lesa.io - Particle & Geometric Wave Visual FX
 * High-performance object pooled particles, shockwave rings, and slash crescent trails.
 */

class Particle {
    constructor() {
        this.reset(0, 0, 0, 0, '#ffffff', 4, 1.0, 'circle');
    }

    reset(x, y, vx, vy, color, radius, life = 1.0, shape = 'circle') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.radius = radius;
        this.maxRadius = radius;
        this.life = life;
        this.maxLife = life;
        this.shape = shape;
        this.rotation = Math.random() * Math.PI * 2;
        this.vRot = (Math.random() - 0.5) * 0.2;
    }

    update(dt = 1) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vx *= 0.92;
        this.vy *= 0.92;
        this.rotation += this.vRot;
        this.life -= 0.03 * dt;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        const progress = Math.max(0, this.life / this.maxLife);
        const r = this.radius * progress;

        if (this.shape === 'dust') {
            ctx.globalAlpha = progress * 0.65;
            ctx.fillStyle = '#ebd2b4';
            ctx.beginPath();
            ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.shape === 'star') {
            ctx.save();
            ctx.globalAlpha = progress;
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.fillStyle = this.color;
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * r, -Math.sin((18 + i * 72) * Math.PI / 180) * r);
                ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * (r * 0.4), -Math.sin((54 + i * 72) * Math.PI / 180) * (r * 0.4));
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        } else {
            ctx.globalAlpha = progress;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

class ShockwaveRing {
    constructor(x, y, maxRadius = 140, color = 'rgba(255, 120, 0, 0.8)', lineWidth = 8) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.maxRadius = maxRadius;
        this.color = color;
        this.lineWidth = lineWidth;
        this.life = 1.0;
        this.growthRate = 6.5;
    }

    update(dt = 1) {
        this.radius += this.growthRate * dt;
        this.life = 1 - (this.radius / this.maxRadius);
    }

    draw(ctx) {
        if (this.life <= 0) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth * this.life;
        ctx.globalAlpha = this.life;
        ctx.stroke();
    }
}

class SlashWave {
    constructor(x, y, angle, radius = 75, arcSpan = Math.PI * 0.95, color = '#00d2d3') {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.radius = radius;
        this.arcSpan = arcSpan;
        this.color = color;
        this.life = 1.0;
        this.decay = 0.085;
    }

    update(dt = 1) {
        this.life -= this.decay * dt;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const progress = 1 - this.life;
        const r = this.radius * (0.85 + progress * 0.35);

        // Wide Comic Energy Slash Trail
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 9 * this.life;
        ctx.lineCap = 'round';
        ctx.globalAlpha = Math.min(1, this.life * 1.5);
        ctx.beginPath();
        ctx.arc(0, 0, r, -this.arcSpan / 2, this.arcSpan / 2);
        ctx.stroke();

        // Razor-Sharp White Knife Edge
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.5 * this.life;
        ctx.beginPath();
        ctx.arc(0, 0, r - 1.5, -this.arcSpan / 2 * 0.95, this.arcSpan / 2 * 0.95);
        ctx.stroke();

        // Motion Sparkle Accents on Slash Tips
        ctx.fillStyle = '#ffffff';
        const tipAngle = this.arcSpan / 2;
        ctx.beginPath();
        ctx.arc(Math.cos(tipAngle) * r, Math.sin(tipAngle) * r, 3 * this.life, 0, Math.PI * 2);
        ctx.arc(Math.cos(-tipAngle) * r, Math.sin(-tipAngle) * r, 3 * this.life, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

class GroundCrack {
    constructor(x, y, radius = 160, color = '#2c3e50', glowColor = '#3498db', maxLife = 140) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.glowColor = glowColor;
        this.life = maxLife;
        this.maxLife = maxLife;
        this.fissures = [];
        this.rubble = [];

        // Generate 6 to 9 radiating jagged fracture branches
        const branchCount = Math.floor(Math.random() * 4) + 6;
        for (let i = 0; i < branchCount; i++) {
            const baseAngle = (i / branchCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
            const branchLength = this.radius * (0.65 + Math.random() * 0.45);
            const segments = [];
            let cx = this.x;
            let cy = this.y;
            const stepCount = Math.floor(Math.random() * 3) + 4; // 4-6 segments per branch
            const stepDist = branchLength / stepCount;

            for (let s = 1; s <= stepCount; s++) {
                const angleJitter = (Math.random() - 0.5) * 0.75;
                const segDist = stepDist * (0.8 + Math.random() * 0.4);
                const nx = cx + Math.cos(baseAngle + angleJitter) * segDist;
                const ny = cy + Math.sin(baseAngle + angleJitter) * segDist;

                let sub = null;
                // 35% chance of a mini side-fracture
                if (Math.random() < 0.35 && s < stepCount) {
                    const sideAngle = baseAngle + (Math.random() < 0.5 ? 1 : -1) * (0.6 + Math.random() * 0.5);
                    const subLen = stepDist * (0.6 + Math.random() * 0.6);
                    sub = {
                        x: nx + Math.cos(sideAngle) * subLen,
                        y: ny + Math.sin(sideAngle) * subLen
                    };
                }

                segments.push({ x: nx, y: ny, sub });
                cx = nx;
                cy = ny;
            }

            this.fissures.push(segments);
        }

        // Generate small rock chunks/rubble near the epicenter
        const rubbleCount = Math.floor(Math.random() * 6) + 8;
        for (let i = 0; i < rubbleCount; i++) {
            const rDist = Math.random() * (this.radius * 0.75);
            const rAngle = Math.random() * Math.PI * 2;
            this.rubble.push({
                x: this.x + Math.cos(rAngle) * rDist,
                y: this.y + Math.sin(rAngle) * rDist,
                size: 2.5 + Math.random() * 3.5,
                angle: Math.random() * Math.PI
            });
        }
    }

    update(dt = 1) {
        this.life -= dt;
    }

    draw(ctx) {
        if (this.life <= 0) return;

        // Fade out smoothly during the last 35% of its lifespan
        const fadeThreshold = this.maxLife * 0.35;
        const alpha = this.life < fadeThreshold ? (this.life / fadeThreshold) : 1.0;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

        // 1. Glowing seismic energy under deep fissure
        if (this.glowColor) {
            ctx.strokeStyle = this.glowColor;
            ctx.lineWidth = 5 * Math.min(1, alpha * 1.3);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            for (let b = 0; b < this.fissures.length; b++) {
                const segs = this.fissures[b];
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                for (let s = 0; s < segs.length; s++) {
                    ctx.lineTo(segs[s].x, segs[s].y);
                }
                ctx.stroke();
            }
        }

        // 2. Deep dark fractured bedrock fissures
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2.8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let b = 0; b < this.fissures.length; b++) {
            const segs = this.fissures[b];
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            for (let s = 0; s < segs.length; s++) {
                ctx.lineTo(segs[s].x, segs[s].y);
            }
            ctx.stroke();

            // Draw side branches
            for (let s = 0; s < segs.length; s++) {
                if (segs[s].sub) {
                    ctx.beginPath();
                    ctx.moveTo(segs[s].x, segs[s].y);
                    ctx.lineTo(segs[s].sub.x, segs[s].sub.y);
                    ctx.stroke();
                }
            }
        }

        // 3. Epicenter shatter hole
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 6.5, 0, Math.PI * 2);
        ctx.fill();

        // 4. Broken stone rubble pieces
        ctx.fillStyle = '#4b6584';
        for (let i = 0; i < this.rubble.length; i++) {
            const r = this.rubble[i];
            ctx.fillRect(r.x - r.size / 2, r.y - r.size / 2, r.size, r.size);
        }

        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.Particle = Particle;
    window.ShockwaveRing = ShockwaveRing;
    window.SlashWave = SlashWave;
    window.GroundCrack = GroundCrack;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Particle, ShockwaveRing, SlashWave, GroundCrack };
}
