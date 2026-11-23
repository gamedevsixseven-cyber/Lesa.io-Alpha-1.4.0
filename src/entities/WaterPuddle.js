/**
 * Lesa.io - Entity: "WaterPuddle"
 * Persistent cartoon puddle spawned by the "Nerobalonaki" (Water Balloon) skill.
 * Drenches enemies: slows movement by 45% and amplifies incoming damage by +30%.
 */

class WaterPuddle {
    constructor(x, y, radius = 105, duration = 360, slowMultiplier = 0.55, damageAmp = 1.30) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.maxRadius = radius;
        this.duration = duration;
        this.maxDuration = duration;
        this.slowMultiplier = slowMultiplier;
        this.damageAmp = damageAmp;
        this.age = 0;
        this.dead = false;

        // Animated ripple wave phase
        this.ripplePhase = 0;

        // Static organic blob points for cartoon styling
        this.points = [];
        const numPoints = 12;
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const variance = 0.82 + Math.random() * 0.36;
            this.points.push({ angle, variance });
        }
    }

    update(dt = 1, enemies = [], player = null, effects = null) {
        this.age += dt;
        this.duration -= dt;
        this.ripplePhase += 0.08 * dt;

        if (this.duration <= 0) {
            this.dead = true;
            return;
        }

        const currentRadius = this.radius * Math.min(1.0, this.age / 12);
        const radiusSq = (currentRadius + 30) * (currentRadius + 30);

        // Check collision with nearby active enemies
        if (enemies && enemies.length > 0) {
            const visit = (enemy) => {
                if (!enemy || enemy.dead) return;
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                if (dx * dx + dy * dy <= (currentRadius + enemy.radius) ** 2) {
                    enemy.waterDrenchedTimer = 50;
                    enemy.waterSlowMultiplier = this.slowMultiplier;
                    enemy.damageVulnerabilityMultiplier = this.damageAmp;
                    if (effects && Math.random() < 0.12 * dt) {
                        effects.addSparks(enemy.x, enemy.y, '#00d2d3', 2);
                        effects.addSparks(enemy.x, enemy.y, '#54a0ff', 2);
                    }
                }
            };
            if (typeof SpatialHashGrid !== 'undefined') SpatialHashGrid.forEachEnemyNear(this.x, this.y, currentRadius, enemies, visit);
            else for (let i = 0; i < enemies.length; i++) visit(enemies[i]);
        }
    }

    draw(ctx) {
        if (this.dead) return;

        const lifeRatio = Math.max(0, this.duration / this.maxDuration);
        const alpha = Math.min(0.85, (this.age / 15)) * Math.min(1.0, lifeRatio * 2.5);
        const scale = Math.min(1.0, this.age / 14);

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.globalAlpha = alpha;

        // 1. Outer Deep Water Ring
        ctx.beginPath();
        for (let i = 0; i < this.points.length; i++) {
            const p = this.points[i];
            const r = this.radius * scale * p.variance;
            const px = Math.cos(p.angle) * r;
            const py = Math.sin(p.angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();

        ctx.fillStyle = 'rgba(10, 189, 227, 0.45)';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#00d2d3';
        ctx.stroke();

        // 2. Inner Glossy Water Pool
        ctx.beginPath();
        for (let i = 0; i < this.points.length; i++) {
            const p = this.points[i];
            const r = this.radius * 0.72 * scale * p.variance;
            const px = Math.cos(p.angle) * r;
            const py = Math.sin(p.angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(72, 219, 251, 0.65)';
        ctx.fill();

        // 3. Dynamic Expanding Water Ripples
        const ripple1 = (this.ripplePhase % 1.0) * (this.radius * 0.75);
        ctx.beginPath();
        ctx.arc(0, 0, ripple1, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 4. Shiny Surface Reflection Highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.beginPath();
        ctx.ellipse(-this.radius * 0.3, -this.radius * 0.25, this.radius * 0.22, this.radius * 0.08, -0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(this.radius * 0.25, this.radius * 0.2, this.radius * 0.14, this.radius * 0.05, 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.WaterPuddle = WaterPuddle;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WaterPuddle };
}
