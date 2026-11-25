/**
 * Lesa.io - Celestial Chest Weapon: Aurelion Astral Scepter (Evolvable ★ + Skill Tree)
 * Fires piercing prismatic starlight lances; every 3rd burst drops a Celestial Starfall Meteor.
 * Supports Celestial Skill Tree Capstone traits:
 *   - path_starfall -> 'starfall_judgment': drops 3 orbital meteors around hit target + stun
 *   - path_prism -> 'refracting_halo_beams': refracts 3 homing mini prism bolts on hit + crit speed surge
 */

class AurelionAstralScepter extends WeaponBase {
    static _meteors = [];

    static drawWeapon(ctx, flash, recoil = 0, isEvolved = false) {
        ctx.save();
        ctx.translate(4 - Math.min(7, recoil) * 0.35, 0);
        const now = typeof performance !== 'undefined' ? performance.now() * 0.0065 : 0;
        const ink = '#0e101c';
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        const goldG = ctx.createLinearGradient(0, -14, 0, 14);
        goldG.addColorStop(0, '#b45309');
        goldG.addColorStop(0.28, '#fbbf24');
        goldG.addColorStop(0.5, '#fef9c3');
        goldG.addColorStop(0.72, '#f59e0b');
        goldG.addColorStop(1, '#92400e');

        // 1. Jeweled Astral Counterweight Pommel & Staff Shaft
        ctx.fillStyle = flash ? '#ffffff' : goldG;
        ctx.strokeStyle = flash ? '#ffffff' : ink;
        ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.roundRect(-19, -4, 6.5, 8, 2); ctx.fill(); ctx.stroke();
        if (!flash) {
            ctx.fillStyle = '#f0abfc';
            ctx.beginPath(); ctx.arc(-19.5, 0, 2.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }

        const shaftG = ctx.createLinearGradient(0, -3, 0, 3);
        shaftG.addColorStop(0, flash ? '#ffffff' : '#4f46e5');
        shaftG.addColorStop(0.5, flash ? '#ffffff' : '#1e1b4b');
        shaftG.addColorStop(1, flash ? '#ffffff' : '#090d1f');
        ctx.fillStyle = shaftG;
        ctx.lineWidth = 1.9;
        ctx.beginPath(); ctx.roundRect(-14, -2.6, 34, 5.2, 2.5); ctx.fill(); ctx.stroke();

        if (!flash) {
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(-10, -0.7, 26, 1.4);
            ctx.fillStyle = goldG;
            ctx.fillRect(15.5, -4, 4.5, 8); ctx.strokeRect(15.5, -4, 4.5, 8);
        }

        // 2. Sculpted Sun-Crescent Astrolabe Horns & Crystal Wings
        for (const s of [-1, 1]) {
            ctx.fillStyle = flash ? '#ffffff' : goldG;
            ctx.strokeStyle = flash ? '#ffffff' : ink;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(18, s * 3);
            ctx.quadraticCurveTo(27, s * 17, 42, s * 11);
            ctx.quadraticCurveTo(32, s * 8, 29, s * 2.5);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            if (!flash) {
                ctx.fillStyle = s > 0 ? '#c084fc' : '#38bdf8';
                ctx.beginPath();
                ctx.moveTo(24, s * 6.5); ctx.lineTo(35, s * 10); ctx.lineTo(29, s * 5); ctx.closePath();
                ctx.fill();
            }
        }

        // Spearhead Prismatic Tip
        ctx.fillStyle = flash ? '#ffffff' : '#7dd3fc';
        ctx.strokeStyle = flash ? '#ffffff' : ink;
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(44, 0); ctx.lineTo(32, -3.5); ctx.lineTo(34, 0); ctx.lineTo(32, 3.5); ctx.closePath();
        ctx.fill(); ctx.stroke();

        // 3. Spinning Dual Armillary Rings + Incandescent Star Core (cx = 28)
        if (!flash) {
            ctx.save();
            ctx.translate(28, 0);
            ctx.fillStyle = isEvolved ? 'rgba(254, 240, 138, 0.35)' : 'rgba(56, 189, 248, 0.30)';
            ctx.beginPath(); ctx.arc(0, 0, 10.5, 0, Math.PI * 2); ctx.fill();

            ctx.save();
            ctx.rotate(now * 1.4);
            ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.ellipse(0, 0, 8.5, 3.8, 0.4, 0, Math.PI * 2); ctx.stroke();
            ctx.rotate(-now * 2.5);
            ctx.strokeStyle = '#38bdf8';
            ctx.beginPath(); ctx.ellipse(0, 0, 8.5, 3.8, -0.4, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();

            ctx.rotate(now);
            ctx.fillStyle = isEvolved ? '#fef08a' : '#e0f2fe';
            ctx.strokeStyle = ink; ctx.lineWidth = 1.3;
            ctx.beginPath();
            for (let p = 0; p < 8; p++) {
                const rad = p % 2 === 0 ? 6.8 : 2.6;
                const a = (p / 8) * Math.PI * 2;
                if (p === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
                else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
            }
            ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
    }

    /**
     * Draw prismatic Starlight Lance / Prism Bolt centered at (0, 0) pointing +X (Bullet.draw already translates & rotates!).
     */
    static drawBullet(ctx, b) {
        const isMini = b.type === 'aurelion_prism_bolt';
        const isStar = !!b.isStarfallShot;
        const r = b.radius || (isMini ? 7 : 11);
        const ink = '#0c101b';
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Outer astral bloom
        ctx.fillStyle = isStar ? 'rgba(254, 240, 138, 0.34)' : (isMini ? 'rgba(232, 121, 249, 0.30)' : 'rgba(56, 189, 248, 0.32)');
        ctx.beginPath();
        ctx.ellipse(0, 0, isMini ? r * 2.1 : r * 2.35, r * 0.72, 0, 0, Math.PI * 2);
        ctx.fill();

        if (isMini) {
            // Crisp Prism Diamond Bolt
            ctx.fillStyle = '#f0abfc';
            ctx.strokeStyle = ink; ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(r * 1.65, 0); ctx.lineTo(-r * 0.2, -r * 0.65); ctx.lineTo(-r * 1.4, 0); ctx.lineTo(-r * 0.2, r * 0.65);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(r * 0.3, 0, 2.2, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
            return;
        }

        // Main Winged Starlight Lance
        const grad = ctx.createLinearGradient(-r * 1.8, 0, r * 1.9, 0);
        grad.addColorStop(0, isStar ? '#f59e0b' : '#a855f7');
        grad.addColorStop(0.5, isStar ? '#fef08a' : '#38bdf8');
        grad.addColorStop(1, '#ffffff');
        ctx.fillStyle = grad;
        ctx.strokeStyle = ink; ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(r * 1.95, 0);
        ctx.lineTo(r * 0.15, -r * 0.62);
        ctx.lineTo(-r * 1.35, -r * 0.42);
        ctx.lineTo(-r * 0.85, 0);
        ctx.lineTo(-r * 1.35, r * 0.42);
        ctx.lineTo(r * 0.15, r * 0.62);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Inner blazing filament core & twinkling star flare
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(r * 1.45, 0); ctx.lineTo(0, -r * 0.22); ctx.lineTo(-r * 0.9, 0); ctx.lineTo(0, r * 0.22);
        ctx.closePath(); ctx.fill();

        if (isStar) {
            ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.arc(r * 0.4, 0, r * 0.88, -1.1, 1.1); ctx.stroke();
        }
        ctx.restore();
    }

    static fire(player, config, critChance, critMult, isEvolved, effects, bullets) {
        const g = typeof window !== 'undefined' ? window.gameInstance : null;
        const n = config.starfallEveryNShots || 3;
        player._aurelionShotCount = ((player._aurelionShotCount || 0) + 1) % n;
        const isStarfall = player._aurelionShotCount === 0;
        const aim = Number.isFinite(player.angle) ? player.angle : 0;
        const pr = player.radius || 25;
        const multiCount = Math.max(1, player.multiShot || 1);
        const startAngle = aim - ((multiCount - 1) * (player.spreadAngle || 0.15)) / 2;
        const speed = (player.bulletSpeed || 14) * (config.speedMultiplier || 1.65);

        let primaryMx = player.x + Math.cos(aim) * (pr + 22);
        let primaryMy = (player.y - pr * 0.32) + Math.sin(aim) * (pr + 22);

        for (let m = 0; m < multiCount; m++) {
            const ang = startAngle + m * (player.spreadAngle || 0.15);
            const isCrit = Math.random() < critChance;
            let dmg = (config.baseDamage || 66) * (player.damageMultiplier || 1);
            if (isStarfall) dmg *= 1.35;
            if (isCrit) dmg *= critMult;

            const mx = player.x + Math.cos(ang) * (pr + 22);
            const my = (player.y - pr * 0.32) + Math.sin(ang) * (pr + 22);
            if (m === 0) { primaryMx = mx; primaryMy = my; }

            const b = new Bullet({
                x: mx, y: my,
                vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
                damage: dmg, speed, radius: config.radius || 11,
                type: 'aurelion_scepter', isEnemy: false,
                pierce: (player.pierce || 1) + (config.extraPierce || 3),
                maxBounces: player.maxBounces || 0,
                range: config.range || 1060,
                shooter: player, isCrit
            });
            b.isWeaponEvolved = !!isEvolved;
            b.isStarfallShot = isStarfall;
            b.celestialTrait = config.celestialTraitId || null;
            bullets.push(b);
        }

        if (effects) effects.addSparks(primaryMx, primaryMy, isStarfall ? '#fef08a' : '#38bdf8', isStarfall ? 6 : 3);
        const fx = effects || (g && g.effects);
        if (fx && typeof fx.addMuzzleFlash === 'function') {
            fx.addMuzzleFlash(primaryMx, primaryMy, aim, 'aurelion_scepter', isStarfall ? 1.35 : 0.98, false);
        }
    }

    static updateBullet(b, dt) {
        if (b.type !== 'aurelion_prism_bolt') return false;
        const g = typeof window !== 'undefined' ? window.gameInstance : null;
        const enemies = g && Array.isArray(g.enemies) ? g.enemies : null;
        if (enemies && enemies.length > 0) {
            let best = null, bestSq = 340 * 340;
            for (let i = 0; i < enemies.length; i++) {
                const e = enemies[i];
                if (!e || e.dead || e.isDying || e.isAirborneImmune || (b.hitEntities && b.hitEntities.has(e))) continue;
                const dSq = (e.x - b.x) ** 2 + (e.y - b.y) ** 2;
                if (dSq < bestSq) { bestSq = dSq; best = e; }
            }
            if (best) {
                const desired = Math.atan2(best.y - b.y, best.x - b.x);
                const cur = Math.atan2(b.vy, b.vx);
                let diff = desired - cur;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                const next = cur + Math.max(-0.22 * dt, Math.min(0.22 * dt, diff));
                const spd = Math.hypot(b.vx, b.vy) || 14;
                b.vx = Math.cos(next) * spd;
                b.vy = Math.sin(next) * spd;
                b.rotation = next;
            }
        }
        return false;
    }

    static onHit(b, target, finalDmg, enemies, effects, game) {
        if (!target || (game && game.isCoopGuest)) return;
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        if (b.isStarfallShot && !b._starfallTriggered) {
            b._starfallTriggered = true;
            const count = b.celestialTrait === 'starfall_judgment' ? 3 : 1;
            const baseRad = b.celestialTrait === 'starfall_judgment' ? 148 : 118;
            const mult = b.celestialTrait === 'starfall_judgment' ? 1.45 : 1.05;
            for (let k = 0; k < count; k++) {
                const ang = (k / Math.max(1, count)) * Math.PI * 2;
                const off = count > 1 ? 68 : 0;
                this._meteors.push({
                    x: target.x + Math.cos(ang) * off,
                    y: target.y + Math.sin(ang) * off,
                    radius: baseRad,
                    damage: Math.round(finalDmg * mult),
                    stun: b.celestialTrait === 'starfall_judgment' ? 42 : 0,
                    timer: 14 + k * 6,
                    maxTimer: 14 + k * 6
                });
            }
        }
        // Celestial Path B Capstone Trait: Refracting Halo Beams -> split 3 homing mini prism bolts
        if (b.type === 'aurelion_scepter' && b.celestialTrait === 'refracting_halo_beams' && !b._refracted) {
            b._refracted = true;
            if (g && Array.isArray(g.bullets)) {
                const baseDir = Math.atan2(b.vy, b.vx);
                for (let k = 0; k < 3; k++) {
                    const spread = (k - 1) * 0.72 + baseDir;
                    const spd = 14.5;
                    const mini = new Bullet({
                        x: target.x, y: target.y,
                        vx: Math.cos(spread) * spd, vy: Math.sin(spread) * spd,
                        damage: Math.max(14, Math.round(finalDmg * 0.45)),
                        speed: spd, radius: 7, type: 'aurelion_prism_bolt',
                        isEnemy: false, pierce: 1, range: 520,
                        shooter: b.shooter, isCrit: false
                    });
                    if (mini.hitEntities) mini.hitEntities.add(target);
                    g.bullets.push(mini);
                }
            }
            if (b.isCrit && b.shooter) {
                b.shooter.secondWindSpeedTimer = Math.max(b.shooter.secondWindSpeedTimer || 0, 75);
                b.shooter.secondWindSpeedMult = Math.max(b.shooter.secondWindSpeedMult || 1.25, 1.25);
            }
        }
    }

    static update(dt = 1, game = null) {
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        const enemies = g && Array.isArray(g.enemies) ? g.enemies : null;
        const effects = g ? g.effects : null;
        for (let i = this._meteors.length - 1; i >= 0; i--) {
            const m = this._meteors[i];
            m.timer -= dt;
            if (m.timer <= 0) {
                if (enemies && (!g || !g.isCoopGuest)) {
                    for (let j = 0; j < enemies.length; j++) {
                        const e = enemies[j];
                        if (!e || e.dead || e.isDying || e.isAirborneImmune) continue;
                        if (Math.hypot(e.x - m.x, e.y - m.y) <= m.radius + (e.radius || 20)) {
                            if (typeof e.takeDamage === 'function') e.takeDamage(m.damage, effects, true);
                            if (m.stun > 0 && !e.isStationary) e.stunTimer = Math.max(e.stunTimer || 0, m.stun);
                        }
                    }
                }
                if (effects) {
                    effects.addShockwave(m.x, m.y, m.radius, 'rgba(254, 240, 138, 0.94)');
                    effects.addShockwave(m.x, m.y, m.radius * 0.58, 'rgba(56, 189, 248, 0.90)');
                    effects.addSparks(m.x, m.y, '#fef08a', 10);
                    effects.addSparks(m.x, m.y, '#38bdf8', 7);
                    effects.addComicSplash(m.x, m.y - 26, '✦ STARFALL!', '#fef08a', 20);
                }
                this._meteors.splice(i, 1);
            }
        }
    }

    static drawWorld(ctx, cam) {
        if (!ctx || this._meteors.length === 0) return;
        for (let i = 0; i < this._meteors.length; i++) {
            const m = this._meteors[i];
            if (cam && typeof cam.isVisible === 'function' && !cam.isVisible(m.x, m.y, m.radius + 50)) continue;
            const t = Math.max(0, Math.min(1, m.timer / (m.maxTimer || 14)));
            ctx.save();
            ctx.translate(m.x, m.y);

            // Ground Astral Telegraph Sigil
            ctx.fillStyle = `rgba(56, 189, 248, ${(1 - t) * 0.22})`;
            ctx.beginPath(); ctx.arc(0, 0, m.radius, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(254, 240, 138, 0.85)';
            ctx.lineWidth = 2.4;
            ctx.beginPath(); ctx.arc(0, 0, m.radius * (1 - t * 0.35), 0, Math.PI * 2); ctx.stroke();

            // Descending Diagonal Celestial Comet + Prismatic Tail
            const cy = -t * 170;
            const cx = t * 52;
            const tailG = ctx.createLinearGradient(cx, cy, cx + 26, cy - 85);
            tailG.addColorStop(0, 'rgba(254, 240, 138, 0.92)');
            tailG.addColorStop(0.5, 'rgba(56, 189, 248, 0.55)');
            tailG.addColorStop(1, 'rgba(232, 121, 249, 0)');
            ctx.strokeStyle = tailG;
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 26, cy - 85); ctx.stroke();

            ctx.fillStyle = '#fef08a';
            ctx.strokeStyle = '#0c101b';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    }

    static clear() { this._meteors.length = 0; }
}

if (typeof window !== 'undefined') window.AurelionAstralScepter = AurelionAstralScepter;
if (typeof module !== 'undefined' && module.exports) module.exports = { AurelionAstralScepter };
