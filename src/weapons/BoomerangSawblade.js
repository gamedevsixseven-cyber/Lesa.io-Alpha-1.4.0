/**
 * Lesa.io - Heavy Workshop Weapon: Boomerang Sawblade
 * Fires spinning titanium sawblades that pierce outward, flip at max range,
 * clear hit history, and boomerang back to slice enemies a second time.
 */

class BoomerangSawblade extends WeaponBase {
    constructor() {
        super({
            id: 'boomerang_saw',
            name: 'Boomerang Sawblade',
            type: 'boomerang_saw',
            rarity: 'Epic',
            hero: null,
            baseDelay: 22,
            baseDamage: 42,
            radius: 15,
            extraPierce: 99,
            maxBounces: 0,
            speedMultiplier: 1.28,
            critChanceBonus: 0.10,
            range: 520,
            color: '#ff9f43',
            icon: 'assets/WeaponIcons/BoomerangSawblade.png',
            description: 'Industrial disc launcher firing high-torque titanium sawblades that pierce outward and boomerang back through crowds.',
            stats: {
                damage: '42 Out / +20% Return',
                fireRate: 'Medium (0.37s)',
                pierce: 'Infinite Pass',
                special: 'Boomerang 2x Slice'
            }
        });
    }

    /**
     * Render 2.5D Industrial Pneumatic Sawblade Launcher + seated circular saw disc
     */
    static drawWeapon(ctx, flash, recoil = 0) {
        ctx.save();
        ctx.translate(7, 0);
        const ink = '#14161c';
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Heavy buttstock & ergonomic grip
        ctx.fillStyle = flash ? '#ffffff' : '#2d3436';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        ctx.moveTo(-14, -4.5);
        ctx.lineTo(-3, -4.2);
        ctx.lineTo(-3, 2.6);
        ctx.lineTo(-11.5, 6.4);
        ctx.lineTo(-14.5, 4.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#1e222a';
        ctx.beginPath();
        ctx.moveTo(0, 2.5);
        ctx.lineTo(5, 2.5);
        ctx.lineTo(2.4, 11);
        ctx.lineTo(-2.2, 9.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Underslung copper pneumatic pressure cylinder + brass bands
        const copperGrad = ctx.createLinearGradient(0, 2.5, 0, 9.5);
        copperGrad.addColorStop(0, flash ? '#ffffff' : '#ff9f43');
        copperGrad.addColorStop(0.55, flash ? '#f1f2f6' : '#d35400');
        copperGrad.addColorStop(1, flash ? '#dfe4ea' : '#6e2c00');
        ctx.fillStyle = copperGrad;
        ctx.beginPath();
        ctx.roundRect(7, 2.6, 15, 6.2, 2.8);
        ctx.fill();
        ctx.stroke();
        if (!flash) {
            ctx.fillStyle = '#feca57';
            ctx.fillRect(10.5, 3.2, 2.0, 4.8);
            ctx.fillRect(16.8, 3.2, 2.0, 4.8);
        }

        // Main gunmetal launcher chassis
        const bodyGrad = ctx.createLinearGradient(0, -6.5, 0, 4);
        bodyGrad.addColorStop(0, flash ? '#ffffff' : '#636e72');
        bodyGrad.addColorStop(0.55, flash ? '#f1f2f6' : '#353b42');
        bodyGrad.addColorStop(1, flash ? '#dfe4ea' : '#1d2126');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.roundRect(-3.5, -5.6, 28, 9.0, 2.2);
        ctx.fill();
        ctx.stroke();

        // Caution yellow/black industrial stripe badge + cyan spin coil
        if (!flash) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(-0.5, -4.2, 11.5, 4.2, 1);
            ctx.clip();
            ctx.fillStyle = '#feca57';
            ctx.fillRect(-1, -5, 13, 6);
            ctx.fillStyle = ink;
            for (let sx = -3; sx < 13; sx += 3.8) {
                ctx.beginPath();
                ctx.moveTo(sx, 1);
                ctx.lineTo(sx + 1.9, 1);
                ctx.lineTo(sx + 3.8, -5);
                ctx.lineTo(sx + 1.9, -5);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
            ctx.fillStyle = '#00f5ff';
            ctx.beginPath();
            ctx.roundRect(13.5, -4.0, 7.2, 3.0, 1);
            ctx.fill();
            ctx.stroke();
        }

        // Seated ready-to-launch titanium sawblade inside front rail
        if (recoil <= 3.5) {
            const bladeSpin = (typeof performance !== 'undefined' ? performance.now() * 0.008 : 0);
            ctx.save();
            ctx.translate(34, -1.0);
            ctx.rotate(bladeSpin);
            ctx.fillStyle = flash ? '#ffffff' : '#dfe6e9';
            ctx.strokeStyle = ink;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const a1 = (i / 8) * Math.PI * 2;
                const a2 = a1 + Math.PI / 8;
                const x1 = Math.cos(a1) * 5.6, y1 = Math.sin(a1) * 5.6;
                const x2 = Math.cos(a1 + 0.16) * 8.2, y2 = Math.sin(a1 + 0.16) * 8.2;
                const x3 = Math.cos(a2) * 5.6, y3 = Math.sin(a2) * 5.6;
                if (i === 0) ctx.moveTo(x1, y1);
                else ctx.lineTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.lineTo(x3, y3);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            if (!flash) {
                ctx.fillStyle = '#ff9f43';
                ctx.beginPath();
                ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // Upper & lower forged steel guide forks
        ctx.fillStyle = flash ? '#ffffff' : '#485460';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.roundRect(23.5, -7.2, 16.5, 3.0, 1.2);
        ctx.roundRect(23.5, 2.2, 15.2, 3.0, 1.2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Render spinning toothed circular sawblade in flight
     */
    static drawBullet(ctx, bullet) {
        const r = Math.max(9, bullet.radius || 15);
        const returning = !!bullet._returning;
        ctx.save();

        // Kinetic spin glow halo
        ctx.fillStyle = returning ? 'rgba(0, 245, 255, 0.28)' : 'rgba(255, 159, 67, 0.26)';
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.18, 0, Math.PI * 2);
        ctx.fill();

        // 10 laser-cut saw teeth + brushed steel disc body
        const teeth = 10;
        const grad = ctx.createRadialGradient(0, 0, r * 0.15, 0, 0, r);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.55, '#ced6e0');
        grad.addColorStop(1, '#747d8c');
        ctx.fillStyle = grad;
        ctx.strokeStyle = '#14161c';
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        for (let i = 0; i < teeth; i++) {
            const a1 = (i / teeth) * Math.PI * 2;
            const a2 = a1 + (Math.PI * 2 / teeth) * 0.52;
            const x1 = Math.cos(a1) * (r * 0.72), y1 = Math.sin(a1) * (r * 0.72);
            const x2 = Math.cos(a1 + 0.14) * r, y2 = Math.sin(a1 + 0.14) * r;
            const x3 = Math.cos(a2) * (r * 0.72), y3 = Math.sin(a2) * (r * 0.72);
            if (i === 0) ctx.moveTo(x1, y1);
            else ctx.lineTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x3, y3);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Tempered edge ring & cooling vents
        ctx.strokeStyle = returning ? '#00f5ff' : '#ff9f43';
        ctx.lineWidth = 2.1;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.52, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#1e272e';
        for (let k = 0; k < 3; k++) {
            const ka = (k / 3) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(Math.cos(ka) * (r * 0.34), Math.sin(ka) * (r * 0.34), Math.max(1.4, r * 0.11), 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = returning ? '#00f5ff' : '#ff9f43';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    static _beginReturn(b, effects) {
        if (b._returning) return;
        b._returning = true;
        b._returnSpeed = Math.max(9, Math.hypot(b.vx, b.vy) || b.speed || 12) * 1.28;
        b._returnTime = 0;
        b.pierce = 99;
        b.damage = Math.round(b.damage * 1.20);
        if (b.shooter && !b.shooter.dead) {
            const dx = b.shooter.x - b.x;
            const dy = b.shooter.y - b.y;
            const d = Math.hypot(dx, dy) || 1;
            b.vx = (dx / d) * b._returnSpeed;
            b.vy = (dy / d) * b._returnSpeed;
        } else {
            b.vx = -b.vx;
            b.vy = -b.vy;
        }
        if (b.hitEntities) b.hitEntities.clear();
        if (b._hitObstacles) b._hitObstacles.clear();
        if (effects) {
            effects.addShockwave(b.x, b.y, 44, 'rgba(0, 245, 255, 0.72)');
            effects.addSparks(b.x, b.y, '#ff9f43', 6);
        }
    }

    /**
     * Boomerang flight update: high-speed spin, turnaround at maxRange/bounds, home back to shooter.
     * Returns true so Bullet.js preserves the sawblade instead of killing it at maxRange.
     */
    static updateBullet(b, dt, effects, arena) {
        b.rotation += (b._returning ? -0.46 : 0.42) * dt;
        b.scaleX = 1.0;
        b.scaleY = 1.0;

        // Clamp arena edges & trigger return cleanly on wall contact while outbound
        if (arena) {
            const ab = arena.dungeonBounds;
            const minX = (ab ? ab.minX : -arena.halfWidth) + b.radius;
            const maxX = (ab ? ab.maxX : arena.halfWidth) - b.radius;
            const minY = (ab ? ab.minY : -arena.halfHeight) + b.radius;
            const maxY = (ab ? ab.maxY : arena.halfHeight) - b.radius;
            if (b.x < minX || b.x > maxX || b.y < minY || b.y > maxY) {
                b.x = Math.max(minX, Math.min(maxX, b.x));
                b.y = Math.max(minY, Math.min(maxY, b.y));
                this._beginReturn(b, effects);
            }
        }

        if (!b._returning) {
            if (b.distanceTraveled >= b.maxRange) {
                this._beginReturn(b, effects);
            }
            return true;
        }

        // Return phase: home back to player and slice every enemy cleanly a second time
        b._returnTime = (b._returnTime || 0) + dt;
        b.distanceTraveled = Math.min(b.distanceTraveled, (b.maxRange || 520) - 1);
        if (!b.shooter || b.shooter.dead || b._returnTime > 165) {
            b.dead = true;
            return true;
        }

        const dx = b.shooter.x - b.x;
        const dy = b.shooter.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= 28) {
            b.dead = true;
            if (effects) effects.addSparks(b.x, b.y, '#00f5ff', 3);
            return true;
        }

        const spd = b._returnSpeed || 15;
        b.vx = (dx / dist) * spd;
        b.vy = (dy / dist) * spd;
        return true;
    }

    /**
     * Slice through destructible crates/barrels cleanly without stopping; bounce back off thick trees.
     */
    static onObstacleHit(b, obs, effects, game) {
        if (!b._hitObstacles) b._hitObstacles = new Set();
        if (b._hitObstacles.has(obs)) return true;
        b._hitObstacles.add(obs);

        const destroyed = obs.takeDamage(b.damage, effects, game);
        if (destroyed && obs.type === 'crate' && game) {
            game.drops.push(new Drop(obs.x, obs.y, 'xp', 20));
            if (Math.random() < 0.35) game.drops.push(new Drop(obs.x, obs.y, 'heart', 25));
        }
        if (effects) {
            effects.addSparks(b.x, b.y, '#ff9f43', 4);
            effects.addSparks(b.x, b.y, '#dfe6e9', 2);
        }
        if (!b._returning && obs.type === 'tree') {
            this._beginReturn(b, effects);
        }
        return true;
    }
}

if (typeof window !== 'undefined') window.BoomerangSawblade = BoomerangSawblade;
if (typeof module !== 'undefined' && module.exports) module.exports = { BoomerangSawblade };
