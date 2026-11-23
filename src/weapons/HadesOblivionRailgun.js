/**
 * Lesa.io - Apex Underworld Railgun: Hades Oblivion Railgun
 * Apex Mythic-Chest Drop (Evolvable ★).
 * - High-velocity piercing Stygian Void Lances (+18% Crit, +8 Pierce) leaving crackling violet-crimson Rift Streaks.
 * - Executes non-boss targets below 15% Max HP (20% Evolved ★).
 * - Every 6 kills (5 Evolved ★) siphons +3 HP (+5 HP Evolved ★).
 * - Awakened ★ Evolution: Every 3rd shot unleashes twin flanking Phantom Rail Lances.
 */

class HadesOblivionRailgun extends WeaponBase {
    static _rifts = [];

    constructor() {
        super({
            id: 'hades_railgun',
            name: 'Hades Oblivion Railgun',
            type: 'hades_railgun',
            rarity: 'Apex',
            hero: null,
            baseDelay: 22,
            baseDamage: 74,
            radius: 10,
            extraPierce: 8,
            maxBounces: 0,
            speedMultiplier: 1.85,
            critChanceBonus: 0.18,
            range: 1200,
            color: '#a855f7',
            icon: 'assets/WeaponIcons/HadesOblivionRailgun.png',
            description: 'Underworld electromagnetic railgun. Fires piercing Stygian Lances that execute weakened foes (<15% HP) and siphon +3 HP every 6 kills.',
            stats: {
                damage: '74 Stygian Void',
                fireRate: 'Heavy Rail (0.37s)',
                pierce: '+8 Pierces & +18% Crit',
                special: '15% Execute • 6-Kill HP Siphon'
            }
        });
    }

    /**
     * Render 2.5D Obsidian, Cerberus Crest & Floating Twin-Rail Stygian Accelerator (x: -14 .. +48)
     */
    static drawWeapon(ctx, flash, recoil = 0, isEvolved = false) {
        ctx.save();
        ctx.translate(5 - recoil * 0.35, 0);
        const ink = '#12101a';
        const now = typeof performance !== 'undefined' ? performance.now() * 0.009 : 0;
        const pulse = 0.88 + Math.sin(now) * 0.12;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // 1. Jagged Obsidian Underworld Buttstock & Pistol Grip
        ctx.fillStyle = flash ? '#ffffff' : '#1b1826';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(-14.5, -4.8);
        ctx.lineTo(-2.5, -4.5);
        ctx.lineTo(-2.5, 3.2);
        ctx.lineTo(-10.8, 6.8);
        ctx.lineTo(-15.5, 4.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Tactical Grip
        ctx.fillStyle = flash ? '#ffffff' : '#262136';
        ctx.beginPath();
        ctx.moveTo(-1.0, 2.8);
        ctx.lineTo(4.2, 2.8);
        ctx.lineTo(1.8, 11.2);
        ctx.lineTo(-3.0, 10.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Glowing Underworld Stock Rune
        if (!flash) {
            ctx.strokeStyle = isEvolved ? '#ffd32a' : '#c084fc';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(-11.8, -1.6);
            ctx.lineTo(-7.0, -1.6);
            ctx.lineTo(-8.6, 1.6);
            ctx.stroke();
        }

        // 2. Angular Breech Housing + Silver Cerberus Horns
        const recGrad = ctx.createLinearGradient(0, -6.5, 0, 5.5);
        recGrad.addColorStop(0, flash ? '#ffffff' : '#3a3352');
        recGrad.addColorStop(0.6, flash ? '#f1f2f6' : '#1f1b2e');
        recGrad.addColorStop(1, flash ? '#dfe4ea' : '#110f1a');
        ctx.fillStyle = recGrad;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        ctx.moveTo(-3.5, -5.5);
        ctx.lineTo(17.5, -5.8);
        ctx.lineTo(19.5, -2.5);
        ctx.lineTo(19.5, 3.2);
        ctx.lineTo(16.5, 4.8);
        ctx.lineTo(-3.5, 4.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Silver Cerberus Horn Ironsight Crest atop Breech
        if (!flash) {
            ctx.fillStyle = isEvolved ? '#fef08a' : '#cbd5e1';
            ctx.strokeStyle = ink;
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.moveTo(4.2, -5.4);
            ctx.lineTo(1.8, -10.8);
            ctx.lineTo(7.4, -7.8);
            ctx.lineTo(11.4, -10.4);
            ctx.lineTo(9.8, -5.5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        // 3. Split Floating Electromagnetic Rail Prongs (x: 17..45)
        ctx.fillStyle = flash ? '#ffffff' : '#334155';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.7;
        // Upper Rail Prong
        ctx.beginPath();
        ctx.moveTo(17.0, -5.8);
        ctx.lineTo(44.5, -4.4);
        ctx.lineTo(42.5, -2.0);
        ctx.lineTo(17.0, -2.4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Lower Rail Prong
        ctx.beginPath();
        ctx.moveTo(17.0, 5.4);
        ctx.lineTo(43.5, 4.2);
        ctx.lineTo(41.5, 1.8);
        ctx.lineTo(17.0, 2.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            // Violet / Gold Outer Rail Conduits
            const trimColor = isEvolved ? '#ffd32a' : '#a855f7';
            ctx.fillStyle = trimColor;
            ctx.fillRect(21.5, -4.8, 16.5, 1.2);
            ctx.fillRect(21.5, 3.3, 15.5, 1.2);

            // 4. Suspended Stygian Soul Capacitor Core & Crackling Arc
            const cx = 18.8;
            ctx.fillStyle = 'rgba(217, 70, 239, 0.36)';
            ctx.beginPath();
            ctx.arc(cx, 0, 7.2 * pulse, 0, Math.PI * 2);
            ctx.fill();

            const cGrad = ctx.createRadialGradient(cx, 0, 0.5, cx, 0, 4.4);
            cGrad.addColorStop(0, '#ffffff');
            cGrad.addColorStop(0.45, '#f43f5e');
            cGrad.addColorStop(1, '#7e22ce');
            ctx.fillStyle = cGrad;
            ctx.strokeStyle = ink;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(cx, 0, 4.0 * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Crackling Muzzle Arc inside Channel
            ctx.strokeStyle = '#e879f9';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(22.5, 0);
            ctx.lineTo(29.0, Math.sin(now * 2.2) * 1.4);
            ctx.lineTo(35.5, -Math.cos(now * 2.0) * 1.4);
            ctx.lineTo(42.2, 0);
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * Render High-Velocity Stygian Void Rail Lance
     */
    static drawBullet(ctx, b) {
        const r = b.radius || 10;
        const isPhantom = !!b.isPhantomRail;
        const ink = '#12101a';
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        if (isPhantom) ctx.globalAlpha = 0.82;

        // Outer Void Plasma Aura
        ctx.fillStyle = b.isWeaponEvolved ? 'rgba(232, 121, 249, 0.36)' : 'rgba(168, 85, 247, 0.34)';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 2.0, r * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main Spearhead Lance
        ctx.fillStyle = isPhantom ? '#c084fc' : '#f43f5e';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(r * 1.85, 0);
        ctx.lineTo(r * 0.1, -r * 0.48);
        ctx.lineTo(-r * 1.55, -r * 0.28);
        ctx.lineTo(-r * 1.15, 0);
        ctx.lineTo(-r * 1.55, r * 0.28);
        ctx.lineTo(r * 0.1, r * 0.48);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner White-Hot Stygian Core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(r * 1.45, 0);
        ctx.lineTo(r * 0.1, -r * 0.18);
        ctx.lineTo(-r * 0.9, 0);
        ctx.lineTo(r * 0.1, r * 0.18);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    /**
     * Record brief crackling Stygian Rift Streak along shot trajectory
     */
    static addShotRift(x, y, angle, isEvolved = false) {
        if (this._rifts.length >= 16) this._rifts.shift();
        this._rifts.push({
            x, y, angle,
            length: isEvolved ? 230 : 185,
            timer: 16,
            maxTimer: 16,
            isEvolved: !!isEvolved
        });
    }

    /**
     * Oblivion Execute (<15% non-boss HP, 20% Evolved ★) & 6-Kill HP Siphon
     */
    static onHit(b, e, finalDmg, enemies, effects, game) {
        if (!e || !b) return;
        const isEvo = !!b.isWeaponEvolved;
        const execPct = isEvo ? 0.20 : 0.15;
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        const isGuest = !!(g && g.isCoopGuest);

        if (!isGuest && !e.dead && !e.isBoss && !e.isMiniBoss && !e.isStationary && e.maxHp > 0 && (e.hp / e.maxHp) <= execPct) {
            const overkill = Math.ceil(Math.max(e.hp + 25, 999));
            if (typeof e.takeDamage === 'function') {
                e.takeDamage(overkill, effects, true, true);
            } else {
                e.hp = 0;
                e.dead = true;
            }
            if (effects) {
                effects.addShockwave(e.x, e.y, (e.radius || 22) + 52, 'rgba(217, 70, 239, 0.88)');
                effects.addSparks(e.x, e.y, '#e879f9', 8);
                effects.addSparks(e.x, e.y, '#f43f5e', 6);
                effects.addComicSplash(e.x, e.y - 26, '💀 OBLIVION!', '#e879f9', 22, true);
            }
        } else if (effects) {
            effects.addSparks(e.x, e.y, '#a855f7', 5);
        }

        // Soul Siphon Passive: Every 6 kills (5 Evolved ★) restores +3 HP (+5 HP Evolved ★)
        if (!isGuest && e.dead && !e._hadesSiphoned && b.shooter && b.shooter.hp > 0) {
            e._hadesSiphoned = true;
            const shooter = b.shooter;
            const targetKills = isEvo ? 5 : 6;
            shooter._hadesKills = (shooter._hadesKills || 0) + 1;
            if (shooter._hadesKills >= targetKills) {
                shooter._hadesKills = 0;
                const healAmt = isEvo ? 5 : 3;
                if (shooter.hp < shooter.maxHp) {
                    shooter.hp = Math.min(shooter.maxHp, shooter.hp + healAmt);
                    if (effects) {
                        effects.addComicSplash(shooter.x, shooter.y - 34, `+${healAmt} HP 💀`, '#d946ef', 18);
                        effects.addShockwave(shooter.x, shooter.y, 44, 'rgba(217, 70, 239, 0.72)');
                    }
                }
            }
        }
    }

    static update(dt = 1) {
        for (let i = this._rifts.length - 1; i >= 0; i--) {
            this._rifts[i].timer -= dt;
            if (this._rifts[i].timer <= 0) this._rifts.splice(i, 1);
        }
    }

    static drawWorld(ctx, cam) {
        if (this._rifts.length === 0 || !ctx) return;
        for (let i = 0; i < this._rifts.length; i++) {
            const rf = this._rifts[i];
            const t = Math.max(0, rf.timer / rf.maxTimer);
            const ex = rf.x + Math.cos(rf.angle) * rf.length;
            const ey = rf.y + Math.sin(rf.angle) * rf.length;
            if (cam && typeof cam.isVisible === 'function' && !cam.isVisible((rf.x + ex) * 0.5, (rf.y + ey) * 0.5, rf.length * 0.6)) continue;

            ctx.save();
            ctx.lineCap = 'round';
            ctx.globalAlpha = t * 0.85;
            ctx.strokeStyle = rf.isEvolved ? '#e879f9' : '#9333ea';
            ctx.lineWidth = (rf.isEvolved ? 7.5 : 5.5) * t;
            ctx.beginPath();
            ctx.moveTo(rf.x, rf.y);
            ctx.lineTo(ex, ey);
            ctx.stroke();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.0 * t;
            ctx.beginPath();
            ctx.moveTo(rf.x, rf.y);
            ctx.lineTo(ex, ey);
            ctx.stroke();
            ctx.restore();
        }
    }

    static clear() {
        this._rifts.length = 0;
    }
}

if (typeof window !== 'undefined') {
    window.HadesOblivionRailgun = HadesOblivionRailgun;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HadesOblivionRailgun };
}
