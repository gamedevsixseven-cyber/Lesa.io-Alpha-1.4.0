/**
 * Lesa.io - Bio-Parasitic Mythic Weapon: Symbiote Launcher
 * Fires barbed Symbiote Needles that infect an enemy as a Symbiote Host (4s).
 * While tethered, 40% of damage dealt to any other enemy mirrors to the Host;
 * hitting an infected Host triggers a +25% Parasite Bite, and slaying the
 * Host erupts into 3 seeking Symbiote Swarm Tendrils that hunt nearby foes.
 */

class SymbioteLauncher extends WeaponBase {
    static _activeHost = null;
    static _tethers = [];
    static LINK_DURATION = 240; // 4s at 60fps
    static MIRROR_RATIO = 0.40;
    static MAX_LINK_DIST = 950;

    constructor() {
        super({
            id: 'symbiote',
            name: 'Symbiote Launcher',
            type: 'symbiote',
            rarity: 'Mythic',
            hero: null,
            baseDelay: 14,
            baseDamage: 28,
            radius: 9,
            extraPierce: 0,
            maxBounces: 0,
            speedMultiplier: 1.52,
            critChanceBonus: 0.10,
            range: 960,
            color: '#ff2e63',
            icon: 'assets/WeaponIcons/SymbioteLauncher.png',
            description: 'Bio-organic parasite launcher that infects a Symbiote Host; 40% of damage dealt to other enemies mirrors onto the Host, and killing the Host unleashes 3 homing Swarm Tendrils.',
            stats: {
                damage: '28 Bio-Needle',
                fireRate: 'Brisk (0.23s)',
                pierce: 'Carrier Mark',
                special: '40% Voodoo Link + 3x Swarm'
            }
        });
    }

    /**
     * Render 2.5D Bio-Organic Symbiote Launcher (carapace plates, pulsing core pod, coiled veins, hooked fang jaws)
     */
    static drawWeapon(ctx, flash, recoil = 0) {
        ctx.save();
        ctx.translate(7, 0);
        const ink = '#14161c';
        const now = typeof performance !== 'undefined' ? performance.now() * 0.005 : 0;
        const bioPulse = 1 + Math.sin(now) * 0.08;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // 1. Segmented obsidian-violet chitin buttstock
        ctx.fillStyle = flash ? '#ffffff' : '#241633';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        ctx.moveTo(-14.5, -4.6);
        ctx.lineTo(-3, -4.2);
        ctx.lineTo(-3, 2.8);
        ctx.lineTo(-11.8, 6.8);
        ctx.lineTo(-15.2, 4.4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Organic pistol grip
        ctx.fillStyle = flash ? '#ffffff' : '#180f24';
        ctx.beginPath();
        ctx.moveTo(-1.0, 2.5);
        ctx.lineTo(4.2, 2.6);
        ctx.lineTo(1.8, 11.0);
        ctx.lineTo(-2.6, 9.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 2. Underslung rib cage & creeping violet tendril barrel cradle
        const bodyGrad = ctx.createLinearGradient(0, -6, 0, 5.5);
        bodyGrad.addColorStop(0, flash ? '#ffffff' : '#532674');
        bodyGrad.addColorStop(0.5, flash ? '#f1f2f6' : '#311748');
        bodyGrad.addColorStop(1, flash ? '#dfe4ea' : '#150d20');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.moveTo(-3.5, -5.2);
        ctx.lineTo(27.5, -5.0);
        ctx.lineTo(31.5, 0.2);
        ctx.lineTo(27.0, 4.6);
        ctx.lineTo(-3.5, 3.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Segmented dorsal carapace scales along top spine
        if (!flash) {
            ctx.fillStyle = '#3b1c54';
            ctx.strokeStyle = ink;
            ctx.lineWidth = 1.3;
            for (let p = 0; p < 4; p++) {
                const px = -1.5 + p * 6.8;
                ctx.beginPath();
                ctx.roundRect(px, -6.2, 6.2, 2.8, 1.1);
                ctx.fill();
                ctx.stroke();
            }
        }

        // 3. Pulsing Living Symbiote Egg Sac Core
        ctx.save();
        ctx.translate(9.5, -0.5);
        ctx.scale(bioPulse, bioPulse);
        if (!flash) {
            const sacGrad = ctx.createRadialGradient(-1.5, -1.2, 0.8, 0, 0, 7.2);
            sacGrad.addColorStop(0, '#ff9ff3');
            sacGrad.addColorStop(0.45, '#ff2e63');
            sacGrad.addColorStop(1, '#780b2c');
            ctx.fillStyle = sacGrad;
        } else {
            ctx.fillStyle = '#ffffff';
        }
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(0, 0, 7.2, 3.8, -0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        if (!flash) {
            // Glossy bio-membrane specular highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
            ctx.beginPath();
            ctx.ellipse(-2.0, -1.4, 2.6, 1.0, -0.15, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Coiling dark parasitic tendril veins wrapping forward barrel
        if (!flash) {
            ctx.strokeStyle = '#9b59b6';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(4, 2.8);
            ctx.bezierCurveTo(12, -4.5, 19, 4.8, 28, -2.6);
            ctx.stroke();
            ctx.strokeStyle = '#ff2e63';
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(14, -3.5);
            ctx.quadraticCurveTo(21, 2.4, 29, 2.2);
            ctx.stroke();
        }

        // 4. Twin Hooked Chitin Fang Jaws + Glowing Neon Symbiote Orb at Muzzle (x ~ 41)
        const clawGrad = flash ? '#ffffff' : '#4a2166';
        ctx.fillStyle = clawGrad;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.6;
        // Upper mandible prong
        ctx.beginPath();
        ctx.moveTo(26, -4.8);
        ctx.quadraticCurveTo(36, -8.2, 41.2, -3.2);
        ctx.quadraticCurveTo(36.5, -4.6, 30.5, -2.4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Lower mandible prong
        ctx.beginPath();
        ctx.moveTo(26, 4.4);
        ctx.quadraticCurveTo(36, 8.2, 41.2, 3.2);
        ctx.quadraticCurveTo(36.5, 4.6, 30.5, 2.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Suspended Neon Magenta-Violet Symbiote Orb inside the jaws
        const orbR = 3.2 * bioPulse;
        if (!flash) {
            ctx.fillStyle = 'rgba(224, 86, 253, 0.35)';
            ctx.beginPath();
            ctx.arc(36.5, 0, orbR * 1.75, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ff2e93';
            ctx.beginPath();
            ctx.arc(36.5, 0, orbR, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(37.2, -0.8, orbR * 0.42, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * Render flying Symbiote Needle or Homing Swarm Tendril
     */
    static drawBullet(ctx, b) {
        const now = typeof performance !== 'undefined' ? performance.now() * 0.014 : 0;
        const ink = '#14161c';
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        if (b.type === 'symbiote_tendril') {
            const r = b.radius || 7;
            const wag = Math.sin(now * 1.3 + (b.x + b.y) * 0.05) * 4.2;
            // Sinuous parasitic tendril whip tail
            ctx.strokeStyle = '#ff2e63';
            ctx.lineWidth = 3.4;
            ctx.beginPath();
            ctx.moveTo(-2, 0);
            ctx.quadraticCurveTo(-r * 1.4, wag, -r * 2.5, -wag * 0.7);
            ctx.stroke();

            ctx.fillStyle = '#9b59b6';
            ctx.strokeStyle = ink;
            ctx.lineWidth = 1.9;
            ctx.beginPath();
            ctx.moveTo(r * 1.45, 0);
            ctx.lineTo(-r * 0.55, -r * 0.78);
            ctx.lineTo(-r * 0.9, 0);
            ctx.lineTo(-r * 0.55, r * 0.78);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ff6bff';
            ctx.beginPath();
            ctx.arc(r * 0.25, 0, r * 0.42, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return;
        }

        // Primary Barbed Symbiote Needle + Twin Whipping Tendril Filaments
        const r = b.radius || 9;
        const wiggle = Math.sin(now + (b.age || 0) * 0.45) * 3.5;

        ctx.strokeStyle = '#9b59b6';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(-r * 0.6, -2);
        ctx.quadraticCurveTo(-r * 1.6, -4 + wiggle, -r * 2.4, -2.5 - wiggle);
        ctx.moveTo(-r * 0.6, 2);
        ctx.quadraticCurveTo(-r * 1.6, 4 - wiggle, -r * 2.4, 2.5 + wiggle);
        ctx.stroke();

        // Obsidian chitin dart silhouette + crimson bio core
        ctx.fillStyle = '#2c1342';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.1;
        ctx.beginPath();
        ctx.moveTo(r * 1.65, 0);
        ctx.lineTo(-r * 0.15, -r * 0.68);
        ctx.lineTo(-r * 0.75, -r * 0.36);
        ctx.lineTo(-r * 0.45, 0);
        ctx.lineTo(-r * 0.75, r * 0.36);
        ctx.lineTo(-r * 0.15, r * 0.68);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ff2e63';
        ctx.beginPath();
        ctx.moveTo(r * 1.25, 0);
        ctx.lineTo(-r * 0.2, -r * 0.28);
        ctx.lineTo(-r * 0.2, r * 0.28);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(r * 0.55, 0, 1.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    /**
     * Steer Swarm Tendril projectiles smoothly toward nearest valid enemy
     */
    static updateBullet(b, dt, effects, arena) {
        if (!b || b.type !== 'symbiote_tendril') return false;
        const g = (typeof window !== 'undefined') ? window.gameInstance : null;
        const enemies = (g && Array.isArray(g.enemies)) ? g.enemies : null;
        if (!enemies || enemies.length === 0) return false;

        let best = null;
        let bestD2 = 520 * 520;
        const pickTendril = (e) => {
            if (!e || e.dead || e.hp <= 0 || e.isDying || e.isAirborneImmune) return;
            if (b.hitEntities && b.hitEntities.has(e)) return;
            const dx = e.x - b.x, dy = e.y - b.y, d2 = dx * dx + dy * dy;
            if (d2 < bestD2) { bestD2 = d2; best = e; }
        };
        if (typeof SpatialHashGrid !== 'undefined' && enemies.length > 45) SpatialHashGrid.forEachEnemyNear(b.x, b.y, 520, enemies, pickTendril);
        else for (let i = 0; i < enemies.length; i++) pickTendril(enemies[i]);
        if (best) {
            const curAng = Math.atan2(b.vy, b.vx);
            const targetAng = Math.atan2(best.y - b.y, best.x - b.x);
            let diff = targetAng - curAng;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            const nextAng = curAng + Math.max(-0.14 * dt, Math.min(0.14 * dt, diff));
            const spd = Math.hypot(b.vx, b.vy) || b.speed || 13;
            b.vx = Math.cos(nextAng) * spd;
            b.vy = Math.sin(nextAng) * spd;
            b.rotation = nextAng;
        }
        return false; // Continue standard movement & range bookkeeping
    }

    /**
     * Apply Symbiote Host infection when hit by Symbiote Needle or Swarm Tendril
     */
    static onHit(b, e, finalDmg, enemies, effects, game) {
        if (!e || e.dead) return;
        const isAlreadyHost = (this._activeHost === e && e._symbioteTimer > 0);
        if (isAlreadyHost) {
            // Bonus Parasite Bite on direct follow-up shots to an already infected Host
            const biteDmg = Math.max(4, Math.round(finalDmg * 0.25));
            if (typeof e.takeDamage === 'function') {
                e.takeDamage(biteDmg, effects, false, false);
                if (game && game.isCoopGuest) e.dead = false;
            }
            if (effects) effects.addSparks(e.x, e.y, '#ff2e63', 4);
        } else {
            if (this._activeHost && this._activeHost !== e) {
                this._activeHost._symbioteHost = false;
                this._activeHost._symbioteTimer = 0;
            }
            this._activeHost = e;
            if (effects) {
                effects.addShockwave(e.x, e.y, (e.radius || 22) + 28, 'rgba(255, 46, 99, 0.85)');
                effects.addComicSplash(e.x, e.y - 26, 'SYMBIOTE LINK!', '#ff2e63', 24, true);
            }
        }
        e._symbioteHost = true;
        e._symbioteTimer = this.LINK_DURATION;
        e._symbioteMax = this.LINK_DURATION;
        e._symbioteBursted = false;
    }

    /**
     * Mirror 40% of damage dealt to ANY other enemy straight onto the active Symbiote Host
     */
    static onAnyDamage(hitEnemy, finalDmg, effects, game) {
        const host = this._activeHost;
        if (!host || host === hitEnemy || host.dead || host.hp <= 0 || !(host._symbioteTimer > 0)) return;
        if (finalDmg <= 0) return;
        const dx = host.x - hitEnemy.x;
        const dy = host.y - hitEnemy.y;
        if (dx * dx + dy * dy > this.MAX_LINK_DIST * this.MAX_LINK_DIST) return;

        const mirrored = Math.max(4, Math.round(finalDmg * this.MIRROR_RATIO));
        if (typeof host.takeDamage === 'function') {
            host.takeDamage(mirrored, effects, false, false);
            if (game && game.isCoopGuest) host.dead = false;
        }
        if (this._tethers.length < 14) {
            this._tethers.push({
                x1: hitEnemy.x, y1: hitEnemy.y,
                x2: host.x, y2: host.y,
                life: 14, maxLife: 14, dmg: mirrored
            });
        }
        if (effects) {
            effects.addSparks(host.x, host.y, '#e056fd', 3);
        }
    }

    /**
     * Trigger Hive Burst of 3 seeking Swarm Tendrils when an infected Symbiote Host dies
     */
    static onEnemyDeath(enemy, game) {
        if (!enemy || !(enemy._symbioteHost || enemy._symbioteTimer > 0) || enemy._symbioteBursted) return;
        enemy._symbioteBursted = true;
        enemy._symbioteHost = false;
        enemy._symbioteTimer = 0;
        if (this._activeHost === enemy) this._activeHost = null;

        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        const effects = g ? g.effects : null;
        if (effects) {
            effects.addShockwave(enemy.x, enemy.y, (enemy.radius || 22) + 84, 'rgba(255, 46, 99, 0.88)');
            effects.addSparks(enemy.x, enemy.y, '#ff2e63', 9);
            effects.addSparks(enemy.x, enemy.y, '#9b59b6', 6);
            effects.addComicSplash(enemy.x, enemy.y - 28, 'HIVE BURST!', '#e056fd', 26, true);
        }
        if (!g || !Array.isArray(g.bullets) || typeof Bullet === 'undefined') return;

        const player = g.player;
        const tendrilDmg = Math.max(20, Math.round(24 * ((player && player.damageMultiplier) || 1)));
        const baseAng = Math.random() * Math.PI * 2;
        const speed = 13.5;

        for (let k = 0; k < 3; k++) {
            const ang = baseAng + (k * (Math.PI * 2)) / 3;
            const b = new Bullet({
                x: enemy.x + Math.cos(ang) * 14,
                y: enemy.y + Math.sin(ang) * 14,
                vx: Math.cos(ang) * speed,
                vy: Math.sin(ang) * speed,
                damage: tendrilDmg,
                speed: speed,
                radius: 7,
                type: 'symbiote_tendril',
                isEnemy: false,
                pierce: 1,
                maxBounces: 0,
                range: 640,
                shooter: player
            });
            b.isSymbioteSwarm = true;
            if (b.hitEntities) b.hitEntities.add(enemy);
            g.bullets.push(b);
        }
    }

    static clear() {
        if (this._activeHost) {
            this._activeHost._symbioteHost = false;
            this._activeHost._symbioteTimer = 0;
        }
        this._activeHost = null;
        this._tethers.length = 0;
    }

    static update(dt = 1, game = null) {
        if (this._activeHost) {
            const h = this._activeHost;
            if (h.dead || h.hp <= 0) {
                this.onEnemyDeath(h, game);
                this._activeHost = null;
            } else {
                h._symbioteTimer = (h._symbioteTimer || 0) - dt;
                if (h._symbioteTimer <= 0) {
                    h._symbioteHost = false;
                    h._symbioteTimer = 0;
                    this._activeHost = null;
                }
            }
        }
        let w = 0;
        for (let i = 0; i < this._tethers.length; i++) {
            const t = this._tethers[i];
            t.life -= dt;
            if (t.life > 0) this._tethers[w++] = t;
        }
        this._tethers.length = w;
    }

    /**
     * Render pulsing Symbiote Host tendrils/halo and Voodoo-link tether beams
     */
    static drawWorld(ctx, cam) {
        if (!ctx) return;
        const now = typeof performance !== 'undefined' ? performance.now() * 0.005 : 0;

        // 1. Voodoo Damage-Mirror Tether Beams
        for (let i = 0; i < this._tethers.length; i++) {
            const t = this._tethers[i];
            const ratio = Math.max(0, t.life / t.maxLife);
            ctx.save();
            ctx.globalAlpha = ratio * 0.92;
            const mx = (t.x1 + t.x2) * 0.5 + Math.sin(now * 2 + i) * 18;
            const my = (t.y1 + t.y2) * 0.5 + Math.cos(now * 2 + i) * 18;
            ctx.strokeStyle = '#9b59b6';
            ctx.lineWidth = 5.5 * ratio;
            ctx.beginPath();
            ctx.moveTo(t.x1, t.y1);
            ctx.quadraticCurveTo(mx, my, t.x2, t.y2);
            ctx.stroke();

            ctx.strokeStyle = '#ff2e63';
            ctx.lineWidth = 2.4 * ratio;
            ctx.stroke();
            ctx.restore();
        }

        // 2. Infected Symbiote Host Aura & Writhe Tentacles
        const h = this._activeHost;
        if (!h || h.dead || !(h._symbioteTimer > 0)) return;
        const r = (h.radius || 22) + 12;
        if (cam && typeof cam.isVisible === 'function' && !cam.isVisible(h.x, h.y, r + 24)) return;

        const ratio = Math.max(0, Math.min(1, h._symbioteTimer / (h._symbioteMax || this.LINK_DURATION)));
        ctx.save();
        ctx.translate(h.x, h.y);

        // 6 writhing obsidian/crimson symbiote tendrils hugging host
        for (let k = 0; k < 6; k++) {
            const a = now * 0.55 + (k * Math.PI * 2) / 6;
            const wave = Math.sin(now * 1.4 + k * 1.3) * 5;
            const sx = Math.cos(a) * (r * 0.55);
            const sy = Math.sin(a) * (r * 0.55);
            const ex = Math.cos(a) * (r + 5) + Math.sin(a) * wave;
            const ey = Math.sin(a) * (r + 5) - Math.cos(a) * wave;
            ctx.strokeStyle = k % 2 === 0 ? '#ff2e63' : '#6c2bd9';
            ctx.lineWidth = 3.2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.quadraticCurveTo((sx + ex) * 0.5 - wave * 0.5, (sy + ey) * 0.5 + wave * 0.5, ex, ey);
            ctx.stroke();
        }

        ctx.strokeStyle = '#ff2e63';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.arc(0, 0, r + 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
        ctx.stroke();

        ctx.font = '900 10px "Fredoka", sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#14161c';
        ctx.strokeText('HOST LINK', 0, r + 16);
        ctx.fillStyle = '#ff6b81';
        ctx.fillText('HOST LINK', 0, r + 16);
        ctx.restore();
    }
}

if (typeof window !== 'undefined') window.SymbioteLauncher = SymbioteLauncher;
if (typeof module !== 'undefined' && module.exports) module.exports = { SymbioteLauncher };
