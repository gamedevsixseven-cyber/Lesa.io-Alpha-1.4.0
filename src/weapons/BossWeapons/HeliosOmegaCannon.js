/**
 * Lesa.io - Mythic Boss Weapon: Helios Omega Cannon
 * First-kill reward from defeating Endless Wave 40 Boss Kolossos MK-IV.
 * - Primary: High-velocity piercing Crimson-Gold Reactor Bolts (+16% Crit, +3 Pierce).
 * - Every 4th shot: Deploys a 1.2s Micro-Singularity Gravity Well pulling nearby foes inward.
 * - Every 8th shot (6th Evolved ★): Fires a scorching 680px Handheld Omega Beam (with mini Star-Lance Nova when Evolved ★).
 */

class HeliosOmegaCannon extends WeaponBase {
    static _vortices = [];
    static _beams = [];

    constructor() {
        super({
            id: 'helios_cannon',
            name: 'Helios Omega Cannon',
            type: 'helios_cannon',
            rarity: 'Apex',
            hero: null,
            baseDelay: 12,
            baseDamage: 52,
            radius: 11,
            extraPierce: 3,
            maxBounces: 0,
            speedMultiplier: 1.60,
            critChanceBonus: 0.16,
            range: 1020,
            color: '#ff9f43',
            icon: 'assets/WeaponIcons/HeliosOmegaCannon.png',
            description: 'Kolossos MK-IV W40 Boss Relic • Piercing reactor bolts; every 4th shot pulls enemies into a Micro-Singularity, and every 8th shot unleashes a sweeping Omega Beam.',
            stats: {
                damage: '52 Solar Plasma',
                fireRate: 'Rapid (0.20s)',
                pierce: '+3 Pierces & +16% Crit',
                special: '4th Singularity • 8th Omega Beam'
            }
        });
    }

    /**
     * Render 2.5D Bronze & Obsidian Neo-Hellenic Helios Siege Cannon (x: -14 .. +48)
     */
    static drawWeapon(ctx, flash, recoil = 0, isEvolved = false) {
        ctx.save();
        ctx.translate(6, 0);
        const ink = '#141418';
        const now = typeof performance !== 'undefined' ? performance.now() * 0.006 : 0;
        const corePulse = 1 + Math.sin(now) * 0.10;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // 1. Rear Bronze Shoulder Buttstock & Exhaust Fin
        ctx.fillStyle = flash ? '#ffffff' : '#9c5a25';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(-14.5, -5.2);
        ctx.lineTo(-3, -4.4);
        ctx.lineTo(-3, 3.6);
        ctx.lineTo(-12.5, 6.8);
        ctx.lineTo(-15.5, 4.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Heavy Tactical Grip
        ctx.fillStyle = flash ? '#ffffff' : '#1e272e';
        ctx.beginPath();
        ctx.moveTo(-1.2, 2.8);
        ctx.lineTo(4.5, 2.8);
        ctx.lineTo(2.0, 11.4);
        ctx.lineTo(-2.8, 10.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 2. Main Obsidian & Gunmetal Receiver Chassis
        const hullGrad = ctx.createLinearGradient(0, -6.5, 0, 6.5);
        hullGrad.addColorStop(0, flash ? '#ffffff' : '#4b5563');
        hullGrad.addColorStop(0.55, flash ? '#f1f2f6' : '#2f3542');
        hullGrad.addColorStop(1, flash ? '#dfe4ea' : '#161b22');
        ctx.fillStyle = hullGrad;
        ctx.beginPath();
        ctx.moveTo(-4, -5.6);
        ctx.lineTo(27, -5.6);
        ctx.lineTo(29.5, -2.2);
        ctx.lineTo(29.5, 3.2);
        ctx.lineTo(26, 5.4);
        ctx.lineTo(-4, 4.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 3. Miniature 3-Spiked Helios Solar Crown atop Receiver
        if (!flash) {
            ctx.fillStyle = isEvolved ? '#fff3b0' : '#fed330';
            ctx.strokeStyle = ink;
            ctx.lineWidth = 1.3;
            for (let s = 0; s < 3; s++) {
                const sx = 6.5 + s * 5.2;
                const sh = s === 1 ? 6.2 : 4.6;
                ctx.beginPath();
                ctx.moveTo(sx - 2.0, -5.4);
                ctx.lineTo(sx, -5.4 - sh);
                ctx.lineTo(sx + 2.0, -5.4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        }

        // 4. Twin Bronze Rail-Accelerator Barrels (Upper & Lower) framing Reactor Core
        ctx.fillStyle = flash ? '#ffffff' : '#d4893b';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.7;
        // Upper Rail
        ctx.beginPath();
        ctx.roundRect(14, -6.2, 26.5, 3.6, 1.4);
        ctx.fill();
        ctx.stroke();
        // Lower Rail
        ctx.beginPath();
        ctx.roundRect(14, 2.6, 25.0, 3.5, 1.4);
        ctx.fill();
        ctx.stroke();

        // Forward Crimson Cooling Cowling & Prongs at Muzzle (tip x ~ 42 local = 48 world)
        ctx.fillStyle = flash ? '#ffffff' : '#ff2e4c';
        ctx.beginPath();
        ctx.moveTo(35, -6.0);
        ctx.lineTo(42.2, -3.4);
        ctx.lineTo(40.5, -1.6);
        ctx.lineTo(35, -2.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(35, 5.8);
        ctx.lineTo(42.2, 3.4);
        ctx.lineTo(40.5, 1.6);
        ctx.lineTo(35, 2.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 5. Spinning Molten Helios Reactor Core suspended in Chamber (x ~ 17)
        if (!flash) {
            const cx = 17.5;
            ctx.fillStyle = isEvolved ? 'rgba(255, 211, 42, 0.38)' : 'rgba(255, 46, 76, 0.34)';
            ctx.beginPath();
            ctx.arc(cx, 0, 7.6 * corePulse, 0, Math.PI * 2);
            ctx.fill();

            const cGrad = ctx.createRadialGradient(cx - 1, -1, 0.6, cx, 0, 4.8);
            cGrad.addColorStop(0, '#ffffff');
            cGrad.addColorStop(0.45, '#fed330');
            cGrad.addColorStop(1, '#ff2e4c');
            ctx.fillStyle = cGrad;
            ctx.strokeStyle = ink;
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.arc(cx, 0, 4.4 * corePulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Plasma Ion Channel beaming down between the twin rails to the muzzle
            ctx.strokeStyle = isEvolved ? '#ffffff' : '#ff9f43';
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(21.5, 0);
            ctx.lineTo(40.5, 0);
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(40.8, 0, 2.2 * corePulse, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * Render either a Piercing Solar Plasma Lance or a 4th-shot Micro-Singularity Core
     */
    static drawBullet(ctx, b) {
        const now = typeof performance !== 'undefined' ? performance.now() * 0.015 : 0;
        const isEvo = !!b.isWeaponEvolved;
        const ink = '#141418';
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        if (b.isSingularityCore) {
            const r = (b.radius || 11) * 1.42;
            ctx.fillStyle = isEvo ? 'rgba(254, 211, 48, 0.34)' : 'rgba(255, 46, 76, 0.34)';
            ctx.beginPath();
            ctx.arc(0, 0, r * 1.35, 0, Math.PI * 2);
            ctx.fill();

            ctx.rotate(now * 0.45);
            ctx.fillStyle = '#1e272e';
            ctx.strokeStyle = ink;
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            for (let i = 0; i < 3; i++) {
                const a = (i / 3) * Math.PI * 2;
                ctx.strokeStyle = i % 2 === 0 ? '#ff2e4c' : '#fed330';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.72, a, a + 1.05);
                ctx.stroke();
            }

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.34, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return;
        }

        // Standard Helios Solar Plasma Lance
        const r = (b.radius || 11) * (isEvo ? 1.15 : 1.0);
        ctx.fillStyle = isEvo ? 'rgba(254, 211, 48, 0.34)' : 'rgba(255, 99, 72, 0.30)';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.7, r * 0.72, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bronze-crimson winged spear body
        ctx.fillStyle = '#ff4757';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.1;
        ctx.beginPath();
        ctx.moveTo(r * 1.65, 0);
        ctx.lineTo(r * 0.15, -r * 0.62);
        ctx.lineTo(-r * 1.35, -r * 0.46);
        ctx.lineTo(-r * 0.80, 0);
        ctx.lineTo(-r * 1.35, r * 0.46);
        ctx.lineTo(r * 0.15, r * 0.62);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Incandescent solar core vein
        ctx.fillStyle = '#fed330';
        ctx.beginPath();
        ctx.moveTo(r * 1.25, 0);
        ctx.lineTo(0, -r * 0.28);
        ctx.lineTo(-r * 0.55, 0);
        ctx.lineTo(0, r * 0.28);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(r * 0.35, 0, r * 0.38, r * 0.14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    static spawnVortex(x, y, baseDmg, isEvolved, effects, shooter) {
        if (this._vortices.length >= 4) this._vortices.shift();
        const radius = isEvolved ? 215 : 175;
        this._vortices.push({
            x, y, radius,
            timer: 72,
            maxTimer: 72,
            tickAcc: 18,
            tickDmg: Math.max(8, Math.round(baseDmg * (isEvolved ? 0.42 : 0.32))),
            isEvolved: !!isEvolved,
            shooter
        });
        if (effects) {
            effects.addShockwave(x, y, radius * 0.72, 'rgba(255, 46, 76, 0.88)');
            effects.addSparks(x, y, '#fed330', 10);
            effects.addComicSplash(x, y - 34, '🌀 SINGULARITY!', '#ff9f43', 20);
        }
    }

    static fireBeam(player, aimAngle, baseDmg, isEvolved, effects, game) {
        if (!player) return;
        const pr = player.radius || 25;
        const length = isEvolved ? 780 : 680;
        const halfWidth = isEvolved ? 38 : 30;
        const beam = {
            owner: player,
            x: player.x + Math.cos(aimAngle) * 46,
            y: (player.y - pr * 0.32) + Math.sin(aimAngle) * 46,
            angle: aimAngle,
            length,
            halfWidth,
            timer: 28,
            maxTimer: 28,
            tickAcc: 7,
            tickDmg: Math.max(16, Math.round(baseDmg * (isEvolved ? 0.80 : 0.65))),
            isEvolved: !!isEvolved
        };
        if (this._beams.length >= 3) this._beams.shift();
        this._beams.push(beam);

        if (effects) {
            effects.addShockwave(player.x, player.y, 110, 'rgba(254, 211, 48, 0.90)');
            effects.addSparks(player.x + Math.cos(aimAngle) * 44, player.y + Math.sin(aimAngle) * 44, '#ff2e4c', 12);
            effects.addComicSplash(player.x, player.y - 46, isEvolved ? '★ AWAKENED OMEGA BEAM!' : '☢️ OMEGA BEAM!', '#fed330', 22, true);
            if (typeof effects.onBossSlam === 'function') effects.onBossSlam(0.045);
        }

        // Evolved ★ Perk: Unleashes 4 Star-Lance Reactor Bolts radiating from beam's mid-impact zone
        if (isEvolved && typeof Bullet !== 'undefined') {
            const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
            const bullets = g && Array.isArray(g.bullets) ? g.bullets : null;
            if (bullets) {
                const bx = player.x + Math.cos(aimAngle) * 240;
                const by = player.y + Math.sin(aimAngle) * 240;
                for (let k = 0; k < 4; k++) {
                    const ang = aimAngle + Math.PI * 0.25 + (k * Math.PI) / 2;
                    const bolt = new Bullet({
                        x: bx,
                        y: by,
                        vx: Math.cos(ang) * 14.5,
                        vy: Math.sin(ang) * 14.5,
                        damage: Math.round(baseDmg * 0.85),
                        speed: 14.5,
                        radius: 10,
                        type: 'helios_cannon',
                        isEnemy: false,
                        pierce: 3,
                        maxBounces: 0,
                        range: 520,
                        shooter: player
                    });
                    bolt.isWeaponEvolved = true;
                    bullets.push(bolt);
                }
            }
        }
    }

    static onHit(b, target, finalDmg, enemies, effects, game) {
        if (!b || !b.isSingularityCore || b._vortexSpawned || !target) return;
        b._vortexSpawned = true;
        this.spawnVortex(target.x, target.y, b.damage || finalDmg, !!b.isWeaponEvolved, effects, b.shooter);
    }

    static onExpire(b, effects) {
        if (!b) return;
        if (b.isSingularityCore && !b._vortexSpawned) {
            b._vortexSpawned = true;
            this.spawnVortex(b.x, b.y, b.damage || 52, !!b.isWeaponEvolved, effects, b.shooter);
        } else if (effects) {
            effects.addShockwave(b.x, b.y, 68, 'rgba(255, 159, 67, 0.78)');
            effects.addSparks(b.x, b.y, '#fed330', 6);
            effects.addSparks(b.x, b.y, '#ff2e4c', 4);
        }
    }

    static _pointToSegDist(px, py, x1, y1, x2, y2) {
        const vx = x2 - x1;
        const vy = y2 - y1;
        const len2 = vx * vx + vy * vy || 1;
        const t = Math.max(0, Math.min(1, ((px - x1) * vx + (py - y1) * vy) / len2));
        return Math.hypot(px - (x1 + t * vx), py - (y1 + t * vy));
    }

    static update(dt = 1, game = null) {
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        const enemies = (g && Array.isArray(g.enemies)) ? g.enemies : null;
        const effects = g ? g.effects : null;
        const arena = g ? g.arena : null;

        // 1. Update Active Micro-Singularity Gravity Wells
        for (let i = this._vortices.length - 1; i >= 0; i--) {
            const v = this._vortices[i];
            v.timer -= dt;
            v.tickAcc += dt;
            const doTick = v.tickAcc >= 18;
            if (doTick) v.tickAcc -= 18;

            if (enemies) {
                for (let j = 0; j < enemies.length; j++) {
                    const e = enemies[j];
                    if (!e || e.dead || e.isDying || e.hp <= 0 || e.isAirborneImmune) continue;
                    const dx = v.x - e.x;
                    const dy = v.y - e.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist <= v.radius + (e.radius || 20)) {
                        if (dist > 14) {
                            const pullScale = (e.isBoss || e.isMiniBoss) ? 0.35 : 1.0;
                            const pull = (3.4 + (1 - dist / v.radius) * 3.2) * pullScale * dt;
                            e.x += (dx / dist) * pull;
                            e.y += (dy / dist) * pull;
                            if (typeof e.applyArenaBounds === 'function' && arena) e.applyArenaBounds(arena);
                        }
                        if (doTick && typeof e.takeDamage === 'function') {
                            e.takeDamage(v.tickDmg, effects, false, false);
                            if (g && g.isCoopGuest) e.dead = false;
                        }
                    }
                }
            }
            if (v.timer <= 0) this._vortices.splice(i, 1);
        }

        // 2. Update Handheld Omega Beams (smoothly tracks player's aim & deals rapid cleave ticks)
        for (let i = this._beams.length - 1; i >= 0; i--) {
            const bm = this._beams[i];
            bm.timer -= dt;
            bm.tickAcc += dt;
            if (bm.owner && !bm.owner.dead) {
                const pr = bm.owner.radius || 25;
                bm.angle = bm.owner.angle;
                bm.x = bm.owner.x + Math.cos(bm.angle) * 46;
                bm.y = (bm.owner.y - pr * 0.32) + Math.sin(bm.angle) * 46;
            }
            const doTick = bm.tickAcc >= 7;
            if (doTick) {
                bm.tickAcc -= 7;
                if (enemies) {
                    const ex = bm.x + Math.cos(bm.angle) * bm.length;
                    const ey = bm.y + Math.sin(bm.angle) * bm.length;
                    for (let j = 0; j < enemies.length; j++) {
                        const e = enemies[j];
                        if (!e || e.dead || e.isDying || e.hp <= 0 || e.isAirborneImmune) continue;
                        const d = this._pointToSegDist(e.x, e.y, bm.x, bm.y, ex, ey);
                        if (d <= bm.halfWidth + (e.radius || 22) * 0.85) {
                            e.takeDamage(bm.tickDmg, effects, Math.random() < 0.25);
                            if (g && g.isCoopGuest) e.dead = false;
                            if (effects) effects.addSparks(e.x, e.y, '#fed330', 4);
                        }
                    }
                }
            }
            if (bm.timer <= 0) this._beams.splice(i, 1);
        }
    }

    static drawWorld(ctx, cam) {
        const now = typeof performance !== 'undefined' ? performance.now() * 0.006 : 0;

        // 1. Render Active Singularity Gravity Vortices
        for (let i = 0; i < this._vortices.length; i++) {
            const v = this._vortices[i];
            if (cam && !cam.isVisible(v.x, v.y, v.radius + 40)) continue;
            const fade = Math.min(1, v.timer / 16);

            ctx.save();
            ctx.translate(v.x, v.y);
            ctx.globalAlpha = fade;

            const grad = ctx.createRadialGradient(0, 0, 8, 0, 0, v.radius);
            grad.addColorStop(0, 'rgba(15, 10, 24, 0.88)');
            grad.addColorStop(0.32, v.isEvolved ? 'rgba(254, 211, 48, 0.42)' : 'rgba(255, 46, 76, 0.40)');
            grad.addColorStop(1, 'rgba(255, 159, 67, 0.02)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, v.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.rotate(-now * 0.9);
            ctx.strokeStyle = v.isEvolved ? 'rgba(254, 211, 48, 0.72)' : 'rgba(255, 165, 2, 0.65)';
            ctx.lineWidth = 2.4;
            for (let a = 0; a < 5; a++) {
                ctx.save();
                ctx.rotate((a / 5) * Math.PI * 2);
                ctx.beginPath();
                ctx.moveTo(14, 0);
                ctx.quadraticCurveTo(v.radius * 0.46, v.radius * 0.34, v.radius * 0.92, v.radius * 0.06);
                ctx.stroke();
                ctx.restore();
            }

            ctx.strokeStyle = 'rgba(255, 71, 87, 0.72)';
            ctx.lineWidth = 2.2;
            ctx.setLineDash([12, 9]);
            ctx.beginPath();
            ctx.arc(0, 0, v.radius * 0.96, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#0f0a18';
            ctx.strokeStyle = '#ff9f43';
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        // 2. Render Handheld Crimson-Gold Omega Beams
        for (let i = 0; i < this._beams.length; i++) {
            const bm = this._beams[i];
            const ratio = Math.max(0, bm.timer / bm.maxTimer);
            const pulse = (1 + Math.sin(now * 6) * 0.12) * Math.min(1, ratio * 2.2);

            ctx.save();
            ctx.translate(bm.x, bm.y);
            ctx.rotate(bm.angle);
            ctx.globalAlpha = Math.min(1, ratio * 1.8);
            ctx.lineCap = 'round';

            ctx.strokeStyle = 'rgba(255, 46, 76, 0.36)';
            ctx.lineWidth = bm.halfWidth * 1.9 * pulse;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(bm.length, 0); ctx.stroke();

            ctx.strokeStyle = '#ff2e4c';
            ctx.lineWidth = bm.halfWidth * 1.15 * pulse;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(bm.length, 0); ctx.stroke();

            ctx.strokeStyle = '#ffa502';
            ctx.lineWidth = bm.halfWidth * 0.58 * pulse;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(bm.length, 0); ctx.stroke();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = bm.halfWidth * 0.25 * pulse;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(bm.length, 0); ctx.stroke();

            // Traveling Reactor Energy Ellipses
            const off = (now * 260) % 150;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.lineWidth = 2.2;
            for (let rx = off; rx < bm.length; rx += 150) {
                ctx.beginPath();
                ctx.ellipse(rx, 0, 4.5, bm.halfWidth * 0.72 * pulse, 0, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Origin & Tip Corona Flares
            ctx.fillStyle = '#fed330';
            ctx.beginPath();
            ctx.arc(0, 0, bm.halfWidth * 0.65 * pulse, 0, Math.PI * 2);
            ctx.arc(bm.length, 0, bm.halfWidth * 0.58 * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, bm.halfWidth * 0.32 * pulse, 0, Math.PI * 2);
            ctx.arc(bm.length, 0, bm.halfWidth * 0.28 * pulse, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    static clear() {
        this._vortices.length = 0;
        this._beams.length = 0;
    }
}

if (typeof window !== 'undefined') window.HeliosOmegaCannon = HeliosOmegaCannon;
if (typeof module !== 'undefined' && module.exports) module.exports = { HeliosOmegaCannon };
