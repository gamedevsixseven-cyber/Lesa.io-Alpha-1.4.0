/**
 * Lesa.io - Mythic Chest Weapon: Vortex Void Mortar (Evolvable ★)
 * Launches singularity orbs that detonate in an AoE void blast and pull enemies
 * inward into a lingering spinning Gravity Well.
 */

class VoidSingularityMortar extends WeaponBase {
    static _wells = [];

    static drawWeapon(ctx, flash, recoil = 0, isEvolved = false) {
        ctx.save();
        ctx.translate(4 - Math.min(7, recoil) * 0.45, 0);
        const ink = '#0e0b18';
        const now = typeof performance !== 'undefined' ? performance.now() * 0.009 : 0;
        const pulse = 0.85 + Math.sin(now) * 0.15;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // 1. Obsidian Counterweight Stock & Grip
        ctx.fillStyle = flash ? '#ffffff' : '#1b1433';
        ctx.strokeStyle = flash ? '#ffffff' : ink;
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        ctx.moveTo(-14, -4.5); ctx.lineTo(-2, -4.5); ctx.lineTo(-2, 3.5);
        ctx.lineTo(-12, 7); ctx.lineTo(-16, 4); ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Tactical Rear Pistol Grip
        ctx.fillStyle = flash ? '#ffffff' : '#261b47';
        ctx.beginPath();
        ctx.moveTo(0, 3); ctx.lineTo(5, 3); ctx.lineTo(2.5, 11.5); ctx.lineTo(-2, 10.5);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        // Underslung Swirling Amethyst Gravity Drum Canister
        ctx.fillStyle = flash ? '#ffffff' : '#2e1065';
        ctx.beginPath(); ctx.roundRect(7.5, 3.5, 13, 9.5, 3); ctx.fill(); ctx.stroke();
        if (!flash) {
            ctx.fillStyle = isEvolved ? '#f0abfc' : '#a855f7';
            ctx.fillRect(10, 5.5, 8, 5);
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(8.5, 3.5, 2.2, 9.5);
            ctx.fillRect(17.5, 3.5, 2.2, 9.5);
        }

        // 2. Stepped Mortar Receiver Chassis + Neon Cooling Ribs
        const chG = ctx.createLinearGradient(0, -7, 0, 6);
        chG.addColorStop(0, flash ? '#ffffff' : '#4c1d95');
        chG.addColorStop(0.55, flash ? '#ffffff' : '#1e1b4b');
        chG.addColorStop(1, flash ? '#ffffff' : '#090517');
        ctx.fillStyle = chG;
        ctx.strokeStyle = flash ? '#ffffff' : ink;
        ctx.lineWidth = 2.0;
        ctx.beginPath(); ctx.roundRect(-3, -6.8, 30, 12.2, 3.5); ctx.fill(); ctx.stroke();

        // Top Gold Sight Rail & Sapphire Optic
        if (!flash) {
            ctx.fillStyle = '#f59e0b';
            ctx.strokeStyle = ink; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.roundRect(1, -9.2, 12, 3, 1.2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath(); ctx.arc(4, -7.8, 1.5, 0, Math.PI * 2); ctx.fill();

            // Glowing Singularity Cooling Coils
            for (const rx of [9, 15, 21]) {
                ctx.fillStyle = isEvolved ? '#f5d0fe' : '#c084fc';
                ctx.fillRect(rx, -5.6, 3.2, 9.6);
            }
        }

        // 3. Flared Antique-Gold Bell Muzzle & Open Swirling Black-Hole Aperture
        const bellG = ctx.createLinearGradient(25, -9, 25, 9);
        bellG.addColorStop(0, flash ? '#ffffff' : '#b45309');
        bellG.addColorStop(0.45, flash ? '#ffffff' : '#fef08a');
        bellG.addColorStop(1, flash ? '#ffffff' : '#92400e');
        ctx.fillStyle = bellG;
        ctx.strokeStyle = flash ? '#ffffff' : ink;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(25.5, -6.5); ctx.quadraticCurveTo(33, -7.5, 38.5, -10);
        ctx.lineTo(41, -7.8); ctx.lineTo(41, 7.8); ctx.lineTo(38.5, 10);
        ctx.quadraticCurveTo(33, 7.5, 25.5, 6.5); ctx.closePath();
        ctx.fill(); ctx.stroke();

        if (!flash) {
            // Pitch-black vortex muzzle throat & glowing magenta accretion lip
            ctx.fillStyle = '#070210';
            ctx.strokeStyle = isEvolved ? '#fef08a' : '#e879f9';
            ctx.lineWidth = 1.7;
            ctx.beginPath(); ctx.ellipse(39.5, 0, 3.6, 7.6 * pulse, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

            ctx.fillStyle = '#c084fc';
            ctx.beginPath(); ctx.arc(39.5, 0, 1.8 * pulse, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }

    /**
     * Draw spinning Singularity Orb centered cleanly at (0, 0) (Bullet.draw already translates & rotates!).
     */
    static drawBullet(ctx, b) {
        const evo = !!b.isWeaponEvolved;
        const r = b.radius || 13;
        const now = typeof performance !== 'undefined' ? performance.now() * 0.012 : (b.age || 0) * 0.2;
        ctx.save();

        // Outer warp distortion aura
        ctx.fillStyle = evo ? 'rgba(232, 121, 249, 0.34)' : 'rgba(168, 85, 247, 0.28)';
        ctx.beginPath(); ctx.arc(0, 0, r * 1.65, 0, Math.PI * 2); ctx.fill();

        // Tilted spinning Accretion Rings
        for (const [tilt, lw, col] of [[now, 2.0, evo ? '#fef08a' : '#e879f9'], [-now * 1.3 + 1.0, 1.5, '#38bdf8']]) {
            ctx.save();
            ctx.rotate(tilt);
            ctx.strokeStyle = col;
            ctx.lineWidth = lw;
            ctx.beginPath(); ctx.ellipse(0, 0, r * 1.38, r * 0.56, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
        }

        // Dark Event Horizon Core + Bright Rim
        ctx.fillStyle = '#070212';
        ctx.strokeStyle = evo ? '#fef08a' : '#f0abfc';
        ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // Inner singularity glint & orbiting star dot
        ctx.fillStyle = '#fdf4ff';
        ctx.beginPath(); ctx.arc(-r * 0.25, -r * 0.25, r * 0.26, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = evo ? '#fef08a' : '#38bdf8';
        ctx.beginPath(); ctx.arc(Math.cos(now * 2) * r * 1.25, Math.sin(now * 2) * r * 1.25, 2.4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    static onHit(b, target, finalDmg, enemies, effects, game) {
        if (!target || (game && game.isCoopGuest)) return;
        this._triggerWellFromBullet(b, target.x, target.y, finalDmg, effects, game, target);
    }

    static onExpire(b, effects) {
        const g = typeof window !== 'undefined' ? window.gameInstance : null;
        if (!b || (g && g.isCoopGuest)) return;
        this._triggerWellFromBullet(b, b.x, b.y, b.damage || 62, effects, g, null);
    }

    static _triggerWellFromBullet(b, x, y, dmg, effects, game, directTarget) {
        if (!b || b._wellSpawned) return;
        b._wellSpawned = true;
        const evolved = !!b.isWeaponEvolved;
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        const blastRad = evolved ? 145 : 115;
        const splashDmg = Math.max(15, Math.round((dmg || 62) * (evolved ? 0.52 : 0.38)));

        // Immediate Vortex Implosion Blast on nearby non-direct enemies
        if (g && Array.isArray(g.enemies) && !g.isCoopGuest) {
            for (let i = 0; i < g.enemies.length; i++) {
                const e = g.enemies[i];
                if (!e || e === directTarget || e.dead || e.isDying || e.isAirborneImmune) continue;
                if (Math.hypot(e.x - x, e.y - y) <= blastRad + (e.radius || 20)) {
                    if (typeof e.takeDamage === 'function') e.takeDamage(splashDmg, effects, !!b.isCrit);
                }
            }
        }
        this._spawnWell(x, y, dmg, evolved, effects);
    }

    static _spawnWell(x, y, dmg, evolved, effects) {
        if (this._wells.length >= 6) this._wells.shift();
        const rad = evolved ? 195 : 155;
        this._wells.push({
            x, y, radius: rad,
            tickDmg: Math.max(12, Math.round((dmg || 62) * (evolved ? 0.44 : 0.34))),
            timer: evolved ? 105 : 88,
            maxTimer: evolved ? 105 : 88,
            tickAcc: 16,
            evolved
        });
        if (effects) {
            effects.addShockwave(x, y, rad, evolved ? 'rgba(254, 240, 138, 0.9)' : 'rgba(192, 132, 252, 0.85)');
            effects.addSparks(x, y, '#e879f9', 8);
            effects.addSparks(x, y, evolved ? '#fef08a' : '#38bdf8', 5);
        }
    }

    static update(dt = 1, game = null) {
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        const enemies = g && Array.isArray(g.enemies) ? g.enemies : null;
        const effects = g ? g.effects : null;
        for (let i = this._wells.length - 1; i >= 0; i--) {
            const w = this._wells[i];
            w.timer -= dt;
            w.tickAcc += dt;
            const doTick = w.tickAcc >= 20;
            if (enemies && (!g || !g.isCoopGuest)) {
                for (let j = 0; j < enemies.length; j++) {
                    const e = enemies[j];
                    if (!e || e.dead || e.isDying || e.isAirborneImmune) continue;
                    const dx = w.x - e.x, dy = w.y - e.y, d = Math.hypot(dx, dy);
                    if (d <= w.radius + (e.radius || 20)) {
                        if (!(e.isBoss || e.isMiniBoss || e.isStationary) && d > 12) {
                            const pullStep = Math.min(d - 10, (w.evolved ? 2.6 : 2.15) * dt);
                            e.x += (dx / d) * pullStep;
                            e.y += (dy / d) * pullStep;
                        }
                        if (doTick && typeof e.takeDamage === 'function') {
                            e.takeDamage(w.tickDmg, effects, false);
                        }
                    }
                }
            }
            if (doTick) w.tickAcc -= 20;
            if (w.timer <= 0) this._wells.splice(i, 1);
        }
    }

    static drawWorld(ctx, cam) {
        if (!ctx || this._wells.length === 0) return;
        const now = typeof performance !== 'undefined' ? performance.now() * 0.0085 : 0;
        for (let i = 0; i < this._wells.length; i++) {
            const w = this._wells[i];
            if (cam && typeof cam.isVisible === 'function' && !cam.isVisible(w.x, w.y, w.radius + 35)) continue;
            const fade = Math.min(1, (w.timer / w.maxTimer) * 2.2);
            ctx.save();
            ctx.translate(w.x, w.y);
            ctx.globalAlpha = fade * 0.85;

            // Outer translucent gravity field
            const fieldG = ctx.createRadialGradient(0, 0, w.radius * 0.08, 0, 0, w.radius * 0.88);
            fieldG.addColorStop(0, 'rgba(7, 2, 18, 0.88)');
            fieldG.addColorStop(0.42, 'rgba(107, 33, 168, 0.42)');
            fieldG.addColorStop(0.85, 'rgba(217, 70, 239, 0.14)');
            fieldG.addColorStop(1, 'rgba(168, 85, 247, 0)');
            ctx.fillStyle = fieldG;
            ctx.beginPath(); ctx.arc(0, 0, w.radius * 0.88, 0, Math.PI * 2); ctx.fill();

            // Outer dashed capture ring
            ctx.save();
            ctx.rotate(now * 0.45);
            ctx.strokeStyle = w.evolved ? 'rgba(254, 240, 138, 0.75)' : 'rgba(192, 132, 252, 0.65)';
            ctx.lineWidth = 2.2;
            ctx.setLineDash([12, 9]);
            ctx.beginPath(); ctx.arc(0, 0, w.radius * 0.78, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();

            // 3 Spinning Cosmic Vortex Spiral Arms
            ctx.save();
            ctx.rotate(-now * 1.4);
            for (let a = 0; a < 3; a++) {
                ctx.save();
                ctx.rotate((a * Math.PI * 2) / 3);
                ctx.strokeStyle = a % 2 === 0 ? (w.evolved ? '#fef08a' : '#e879f9') : '#a855f7';
                ctx.lineWidth = 2.6;
                ctx.beginPath();
                ctx.moveTo(w.radius * 0.12, 0);
                ctx.quadraticCurveTo(w.radius * 0.34, w.radius * 0.28, w.radius * 0.56, w.radius * 0.08);
                ctx.stroke();
                ctx.restore();
            }
            ctx.restore();

            // Dark Singularity Eye Core + Bright Rim
            ctx.fillStyle = '#05010b';
            ctx.strokeStyle = w.evolved ? '#fef08a' : '#f0abfc';
            ctx.lineWidth = 2.4;
            ctx.beginPath(); ctx.arc(0, 0, Math.max(12, w.radius * 0.12), 0, Math.PI * 2); ctx.fill(); ctx.stroke();

            // Inward pulled starlight particles
            ctx.fillStyle = '#fdf4ff';
            for (let k = 0; k < 4; k++) {
                const ph = ((now * 0.35 + k * 0.25) % 1);
                const d = (1 - ph) * w.radius * 0.68;
                const ang = now * 1.6 + k * 1.57 + ph * 2.2;
                ctx.beginPath(); ctx.arc(Math.cos(ang) * d, Math.sin(ang) * d, 2.2 * (1 - ph * 0.5), 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
        }
    }

    static clear() { this._wells.length = 0; }
}

if (typeof window !== 'undefined') window.VoidSingularityMortar = VoidSingularityMortar;
if (typeof module !== 'undefined' && module.exports) module.exports = { VoidSingularityMortar };
