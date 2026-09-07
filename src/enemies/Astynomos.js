/**
 * Lesa.io - Enemy Subsystem: Astynomos (Greek Police & MAT Riot Officer)
 * Summoned by Boss Rouf ("100! Emergency Call")
 * - Standard Officer: Fast baton pursuit, police cap, uniform shirt
 * - Phase 2 MAT Riot Officer: Riot helmet, shield with 50% frontal damage reduction
 */

class Astynomos extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0, isMAT = false) {
        super(x, y, isMAT ? 'mat_officer' : 'astynomos', waveMultiplier);
        this.name = isMAT ? 'MAT Riot Police' : 'Astynomos';
        this.isMAT = isMAT;
        this.radius = isMAT ? 28 : 24;

        // Base attributes scaled with wave multiplier
        const baseHp = isMAT ? 320 : 180;
        this.maxHp = Math.round(baseHp * Math.max(1.0, waveMultiplier));
        this.hp = this.maxHp;

        this.baseSpeed = isMAT ? 2.6 : 3.4;
        this.speed = this.baseSpeed;
        this.damage = isMAT ? 30 : 22;
        this.xpDrop = isMAT ? 60 : 35;
        this.color = isMAT ? '#2c3e50' : '#3498db';

        // Combat & Animation state
        this.attackCooldown = 0;
        this.isSwinging = false;
        this.swingAnimTimer = 0;
        this.whistleTimer = Math.random() * 200;
        this.sirenTimer = 0;
        this.walkCycle = Math.random() * 10;
    }

    takeDamage(amount, effects = null, fromCrit = null, playSound = true, attackerAngle = null) {
        let finalAmount = amount;

        // Frontal Riot Shield Defense for MAT officers
        if (this.isMAT && attackerAngle !== null && attackerAngle !== undefined) {
            const angleDiff = Math.abs(Math.atan2(Math.sin(attackerAngle - this.angle), Math.cos(attackerAngle - this.angle)));
            // If attacked from within front 120-degree arc
            if (angleDiff > Math.PI * 0.6) {
                finalAmount = Math.round(finalAmount * 0.5); // 50% shield deflection
                if (effects) {
                    effects.addComicSplash(this.x, this.y - 25, 'BLOCK! 🛡️', '#dfe6e9', 18);
                    effects.addSparks(this.x, this.y, '#f1c40f', 4);
                }
            }
        }

        return super.takeDamage(finalAmount, effects, fromCrit, playSound);
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        if (this.hitFlash > 0) this.hitFlash -= dt;

        if (!player || player.hp <= 0) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq) || 1;

        // Face player
        this.angle = Math.atan2(dy, dx);

        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.swingAnimTimer > 0) this.swingAnimTimer -= dt;

        // Occasional whistle comic splash
        this.whistleTimer -= dt;
        if (this.whistleTimer <= 0) {
            this.whistleTimer = 300 + Math.random() * 240;
            if (effects && Math.random() < 0.6) {
                effects.addComicSplash(this.x, this.y - 35, 'TWEEEET! 📢', '#fed330', 16);
            }
        }

        // Baton Swing Attack Range (~45px)
        if (dist <= 45 && this.attackCooldown <= 0) {
            this.attackCooldown = 55;
            this.swingAnimTimer = 22;
            this.isSwinging = true;

            player.takeDamage(this.damage, effects);

            if (effects) {
                effects.addComicSplash(player.x, player.y - 30, 'BONK! 💥', '#ff4757', 20);
                effects.addShockwave(this.x, this.y, 40, 'rgba(52, 152, 219, 0.7)');
            }
            if (window.soundEngine && typeof window.soundEngine.playHit === 'function') {
                window.soundEngine.playHit(false, false);
            }
        }

        // Pursue player if not currently swinging
        if (this.swingAnimTimer <= 0) {
            const moveSpeed = this.speed * dt;
            this.vx = (dx / dist) * moveSpeed;
            this.vy = (dy / dist) * moveSpeed;
            this.x += this.vx;
            this.y += this.vy;
            this.walkCycle += 0.22 * dt;
        } else {
            this.vx *= 0.6;
            this.vy *= 0.6;
        }

        this.applySeparation(enemies);
        this.applyArenaBounds(arena);
    }

    draw(ctx) {
        ctx.save();
        const flash = this.hitFlash > 0;
        const groundY = this.y;
        const bob = Math.sin(this.walkCycle) * 2.2;

        // 1. Ground Shadow
        ctx.save();
        ctx.translate(this.x, groundY);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.beginPath();
        ctx.ellipse(0, this.radius * 0.75, this.radius * 0.9, this.radius * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2. Character Model
        ctx.save();
        ctx.translate(this.x, this.y + bob);

        const facingLeft = Math.cos(this.angle) < 0;
        if (facingLeft) ctx.scale(-1, 1);

        ctx.lineWidth = 2.4;
        ctx.strokeStyle = '#1e272e';

        const r = this.radius;
        const skinColor = flash ? '#ffffff' : '#fbc531';
        const uniformColor = flash ? '#ffffff' : (this.isMAT ? '#1e272e' : '#2980b9');
        const pantsColor = flash ? '#ffffff' : '#2c3e50';
        const bootColor = flash ? '#ffffff' : '#111111';

        // A. Legs & Boots
        ctx.fillStyle = pantsColor;
        ctx.beginPath();
        ctx.roundRect(-r * 0.45, r * 0.25, r * 0.35, r * 0.55, 4);
        ctx.roundRect(r * 0.1, r * 0.25, r * 0.35, r * 0.55, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = bootColor;
        ctx.beginPath();
        ctx.roundRect(-r * 0.5, r * 0.65, r * 0.42, r * 0.22, 3);
        ctx.roundRect(r * 0.08, r * 0.65, r * 0.42, r * 0.22, 3);
        ctx.fill();
        ctx.stroke();

        // B. Torso (Uniform)
        ctx.fillStyle = uniformColor;
        ctx.beginPath();
        ctx.roundRect(-r * 0.6, -r * 0.4, r * 1.2, r * 0.8, 6);
        ctx.fill();
        ctx.stroke();

        // Gold Police Badge
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(-r * 0.2, -r * 0.1, r * 0.14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // C. Head
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(0, -r * 0.55, r * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // D. Headwear: Police Peaked Cap OR MAT Riot Helmet
        if (!this.isMAT) {
            // Greek Police Peaked Cap
            ctx.fillStyle = '#1e272e';
            ctx.beginPath();
            ctx.ellipse(0, -r * 0.82, r * 0.52, r * 0.22, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Gold Cap Emblem
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(0, -r * 0.85, r * 0.1, 0, Math.PI * 2);
            ctx.fill();

            // Black Visor
            ctx.fillStyle = '#111111';
            ctx.beginPath();
            ctx.ellipse(r * 0.2, -r * 0.72, r * 0.32, r * 0.1, 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else {
            // Heavy Riot Helmet with Visor
            ctx.fillStyle = '#2c3e50';
            ctx.beginPath();
            ctx.arc(0, -r * 0.6, r * 0.55, Math.PI, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Clear Blue Face Visor
            ctx.fillStyle = 'rgba(52, 152, 219, 0.5)';
            ctx.strokeStyle = '#2980b9';
            ctx.beginPath();
            ctx.roundRect(0, -r * 0.68, r * 0.55, r * 0.45, 3);
            ctx.fill();
            ctx.stroke();
        }

        // Eyes
        ctx.fillStyle = '#1e272e';
        ctx.beginPath();
        ctx.arc(r * 0.18, -r * 0.52, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // E. Arms & Weapons
        if (this.isMAT) {
            // Heavy Transparent Riot Shield in front
            ctx.save();
            ctx.translate(r * 0.55, -r * 0.05);
            ctx.fillStyle = 'rgba(236, 240, 241, 0.75)';
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.roundRect(-r * 0.15, -r * 0.75, r * 0.32, r * 1.5, 4);
            ctx.fill();
            ctx.stroke();

            // Shield Handle & Grip lines
            ctx.fillStyle = '#34495e';
            ctx.fillRect(-r * 0.12, -r * 0.1, r * 0.26, 4);
            ctx.restore();
        }

        // Nightstick / Baton
        const swingAngle = this.swingAnimTimer > 0 ? (this.swingAnimTimer / 22) * 1.6 : 0.2;
        ctx.save();
        ctx.translate(r * 0.3, 0);
        ctx.rotate(swingAngle);
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.roundRect(0, -3, r * 0.85, 6, 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.restore(); // Character
        ctx.restore(); // Total

        this.drawHUD(ctx);
    }

    drawHUD(ctx) {
        if (this.hp >= this.maxHp) return;
        const bw = this.radius * 1.8;
        const bh = 5;
        const bx = this.x - bw / 2;
        const by = this.y - this.radius - 14;

        ctx.save();
        ctx.fillStyle = '#1e272e';
        ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);

        const hpRatio = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = this.isMAT ? '#3498db' : '#2ecc71';
        ctx.fillRect(bx, by, bw * hpRatio, bh);
        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.Astynomos = Astynomos;
}
