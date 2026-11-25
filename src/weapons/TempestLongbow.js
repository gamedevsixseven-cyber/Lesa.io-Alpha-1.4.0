/**
 * Lesa.io - Legendary Chest Weapon: Stormcaller Longbow
 * Rapid piercing storm arrows; every 4th shot unleashes a 3-arrow homing Storm Seeker salvo.
 */

class TempestLongbow extends WeaponBase {
    static drawWeapon(ctx, flash, recoil = 0) {
        ctx.save();
        const pull = Math.min(8, Math.max(0, recoil));
        const stringX = -4 - pull * 0.45;
        ctx.translate(4 - pull * 0.25, 0);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        const ink = '#0c0f18';
        const now = typeof performance !== 'undefined' ? performance.now() * 0.01 : 0;

        // 1. Crackling Electric Bowstring (taut -> snapped with recoil)
        if (!flash) {
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
            ctx.lineWidth = 3.4;
            ctx.beginPath();
            ctx.moveTo(4, -18.5); ctx.lineTo(stringX, 0); ctx.lineTo(4, 18.5);
            ctx.stroke();

            ctx.strokeStyle = '#e0f2fe';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(4, -18.5); ctx.lineTo(stringX, 0); ctx.lineTo(4, 18.5);
            ctx.stroke();
        }

        // 2. Sculpted Cobalt-Steel & Antique-Gold Recurve Stave Limbs
        const goldG = ctx.createLinearGradient(0, -20, 0, 20);
        goldG.addColorStop(0, '#b45309');
        goldG.addColorStop(0.28, '#fbbf24');
        goldG.addColorStop(0.5, '#fef08a');
        goldG.addColorStop(0.72, '#fbbf24');
        goldG.addColorStop(1, '#b45309');

        for (const s of [-1, 1]) {
            // Swept cobalt storm-steel limb
            ctx.fillStyle = flash ? '#ffffff' : '#0369a1';
            ctx.strokeStyle = flash ? '#ffffff' : ink;
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(13, s * 4.5);
            ctx.quadraticCurveTo(23, s * 10.5, 11, s * 16);
            ctx.quadraticCurveTo(5, s * 18.5, 2, s * 20);
            ctx.quadraticCurveTo(12, s * 17.5, 20, s * 12.5);
            ctx.quadraticCurveTo(26, s * 8.5, 17, s * 4);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            // Golden limb cap & shoulder bracket
            ctx.fillStyle = flash ? '#ffffff' : goldG;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(13, s * 4); ctx.lineTo(20, s * 6);
            ctx.lineTo(18, s * 9.5); ctx.lineTo(12, s * 8.5);
            ctx.closePath(); ctx.fill(); ctx.stroke();

            if (!flash) {
                ctx.fillStyle = '#38bdf8';
                ctx.beginPath(); ctx.arc(16.5, s * 7, 1.5, 0, Math.PI * 2); ctx.fill();
            }
        }

        // 3. Central Gold-Wrapped Riser Handle & Sapphire Storm Core
        ctx.fillStyle = flash ? '#ffffff' : goldG;
        ctx.strokeStyle = flash ? '#ffffff' : ink;
        ctx.lineWidth = 1.9;
        ctx.beginPath(); ctx.roundRect(12.5, -6, 5.5, 12, 2); ctx.fill(); ctx.stroke();

        if (!flash) {
            ctx.fillStyle = '#22d3ee';
            ctx.beginPath(); ctx.arc(15.5, 0, 2.2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(15.1, -0.5, 0.85, 0, Math.PI * 2); ctx.fill();
        }

        // 4. Nocked Blazing Storm Arrow (always points forward +X)
        ctx.strokeStyle = flash ? '#ffffff' : ink;
        ctx.lineWidth = 3.6;
        ctx.beginPath(); ctx.moveTo(stringX, 0); ctx.lineTo(27, 0); ctx.stroke();

        ctx.strokeStyle = flash ? '#ffffff' : '#bae6fd';
        ctx.lineWidth = 2.0;
        ctx.beginPath(); ctx.moveTo(stringX, 0); ctx.lineTo(27, 0); ctx.stroke();

        // Cyan Fletching Fins
        if (!flash) {
            ctx.fillStyle = '#0ea5e9';
            ctx.strokeStyle = ink;
            ctx.lineWidth = 1.1;
            for (const s of [-1, 1]) {
                ctx.beginPath();
                ctx.moveTo(stringX + 2, 0); ctx.lineTo(stringX - 3, s * 3.5); ctx.lineTo(stringX + 5, 0);
                ctx.closePath(); ctx.fill(); ctx.stroke();
            }
        }

        // Razor Lightning Broadhead Arrowhead
        ctx.fillStyle = flash ? '#ffffff' : '#38bdf8';
        ctx.strokeStyle = flash ? '#ffffff' : ink;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(33.5, 0); ctx.lineTo(22.5, -5.0); ctx.lineTo(25.0, 0); ctx.lineTo(22.5, 5.0);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        if (!flash) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(27, Math.sin(now * 2.5) * 0.4, 1.3, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }

    static fire(player, config, critChance, critMult, effects, bullets) {
        const g = typeof window !== 'undefined' ? window.gameInstance : null;
        const n = config.seekerEveryNShots || 4;
        player._tempestShotCount = ((player._tempestShotCount || 0) + 1) % n;
        const isSeekerSalvo = player._tempestShotCount === 0;
        const aim = player.angle || 0;
        const pr = player.radius || 25;
        const multiCount = Math.max(1, player.multiShot || 1);
        const startAngle = aim - ((multiCount - 1) * (player.spreadAngle || 0.15)) / 2;
        const speed = (player.bulletSpeed || 14) * (config.speedMultiplier || 1.72);
        const offsets = isSeekerSalvo ? [-0.20, 0, 0.20] : [0];

        let primaryMx = player.x + Math.cos(aim) * (pr + 18);
        let primaryMy = (player.y - pr * 0.32) + Math.sin(aim) * (pr + 18);

        for (let m = 0; m < multiCount; m++) {
            const baseAng = startAngle + m * (player.spreadAngle || 0.15);
            for (let i = 0; i < offsets.length; i++) {
                const ang = baseAng + offsets[i];
                const isCrit = Math.random() < critChance;
                let dmg = (config.baseDamage || 48) * (player.damageMultiplier || 1);
                if (isSeekerSalvo && offsets[i] !== 0) dmg *= 0.85;
                if (isCrit) dmg *= critMult;

                const mx = player.x + Math.cos(ang) * (pr + 18);
                const my = (player.y - pr * 0.32) + Math.sin(ang) * (pr + 18);
                if (m === 0 && i === 0) { primaryMx = mx; primaryMy = my; }

                const b = new Bullet({
                    x: mx, y: my,
                    vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
                    damage: dmg, speed, radius: config.radius || 9,
                    type: isSeekerSalvo && offsets[i] !== 0 ? 'tempest_seeker' : 'tempest_bow',
                    isEnemy: false,
                    pierce: (player.pierce || 1) + (config.extraPierce || 2),
                    maxBounces: player.maxBounces || 0,
                    range: config.range || 1080,
                    shooter: player, isCrit
                });
                bullets.push(b);
            }
        }
        if (isSeekerSalvo && effects) {
            effects.addComicSplash(player.x, player.y - 44, '🏹 STORM SALVO!', '#38bdf8', 18);
        }
        if (effects) effects.addSparks(primaryMx, primaryMy, isSeekerSalvo ? '#fde047' : '#38bdf8', isSeekerSalvo ? 6 : 4);
        const fx = effects || (g && g.effects);
        if (fx && typeof fx.addMuzzleFlash === 'function') {
            fx.addMuzzleFlash(primaryMx, primaryMy, aim, 'tempest_bow', isSeekerSalvo ? 1.25 : 0.95, false);
        }
    }

    static updateBullet(b, dt) {
        if (b.type !== 'tempest_seeker') return false;
        const g = typeof window !== 'undefined' ? window.gameInstance : null;
        const enemies = g && Array.isArray(g.enemies) ? g.enemies : null;
        if (enemies && enemies.length > 0) {
            let best = null, bestSq = 380 * 380;
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
                const next = cur + Math.max(-0.16 * dt, Math.min(0.16 * dt, diff));
                const spd = Math.hypot(b.vx, b.vy) || (b.speed || 15);
                b.vx = Math.cos(next) * spd;
                b.vy = Math.sin(next) * spd;
                b.rotation = next;
            }
        }
        return false; // Standard Bullet movement advances using updated (vx, vy)
    }

    /**
     * Draw sleek piercing storm arrow centered at (0, 0) facing +X (Bullet.draw already translates & rotates!).
     */
    static drawBullet(ctx, b) {
        const isSeeker = b.type === 'tempest_seeker';
        const r = b.radius || 9;
        const ink = '#0c101b';
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Outer electric aura glow
        ctx.fillStyle = isSeeker ? 'rgba(250, 204, 21, 0.34)' : 'rgba(56, 189, 248, 0.30)';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 2.15, r * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();

        // Fletching Feathers at tail
        ctx.fillStyle = isSeeker ? '#f59e0b' : '#0284c7';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.4;
        for (const s of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(-14, 0); ctx.lineTo(-19, s * 5.2); ctx.lineTo(-12, s * 4.5); ctx.lineTo(-9, 0);
            ctx.closePath(); ctx.fill(); ctx.stroke();
        }

        // Blazing Arrow Shaft
        ctx.strokeStyle = ink; ctx.lineWidth = 5.2;
        ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(10, 0); ctx.stroke();
        ctx.strokeStyle = isSeeker ? '#fde047' : '#38bdf8'; ctx.lineWidth = 3.2;
        ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(10, 0); ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(11, 0); ctx.stroke();

        // Barbed Razor Lightning Spearhead Tip
        ctx.fillStyle = isSeeker ? '#fef08a' : '#7dd3fc';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.moveTo(17, 0); ctx.lineTo(3.5, -6.2); ctx.lineTo(6.5, 0); ctx.lineTo(3.5, 6.2);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Seeker micro-arc crest
        if (isSeeker) {
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(4, 0, 7.5, -1.1, 1.1); ctx.stroke();
        }
        ctx.restore();
    }

    static onHit(b, target, finalDmg, enemies, effects, game) {
        if (!Array.isArray(enemies) || !target) return;
        // Static Storm Arc to nearest adjacent enemies on Seeker/Crit hits
        if (!b.isCrit && b.type !== 'tempest_seeker') return;
        let chains = 0;
        const maxChains = b.type === 'tempest_seeker' ? 2 : 1;
        const hitSet = new Set([target]);
        let src = target;
        while (chains < maxChains) {
            let best = null, bestSq = 225 * 225;
            for (let i = 0; i < enemies.length; i++) {
                const e = enemies[i];
                if (!e || hitSet.has(e) || e.dead || e.isDying || e.isAirborneImmune) continue;
                const dSq = (e.x - src.x) ** 2 + (e.y - src.y) ** 2;
                if (dSq < bestSq) { bestSq = dSq; best = e; }
            }
            if (!best) break;
            hitSet.add(best);
            if (typeof best.takeDamage === 'function') {
                best.takeDamage(Math.max(8, Math.round(finalDmg * 0.45)), effects, false);
                if (game && game.isCoopGuest) best.dead = false;
                if (effects) effects.addLightningChain(src.x, src.y, best.x, best.y, '#38bdf8');
            }
            src = best;
            chains++;
        }
    }
}

if (typeof window !== 'undefined') window.TempestLongbow = TempestLongbow;
if (typeof module !== 'undefined' && module.exports) module.exports = { TempestLongbow };
