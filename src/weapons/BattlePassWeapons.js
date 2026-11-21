/**
 * Lesa.io - Season 1 Battle Pass Weapons (Uncommon & Rare Arsenal Additions)
 * Contains 4 shared unlockable Battle Pass weapons:
 *   - Uncommon Tier 4: Street Uzi (`rusty_smg`) - Ultra-fast street spray SMG
 *   - Uncommon Tier 9: Village Nailgun (`nail_gun`) - High-pierce pneumatic nailer
 *   - Rare Tier 14: Neon Arc Pistol (`plasma_pistol`) - Ricocheting plasma sidearm
 *   - Rare Tier 19: Sawn-Off Double Barrel (`sawnoff_shotgun`) - Heavy 4-pellet knockback blast
 */

class StreetUzi {
    static drawWeapon(ctx, flash, recoil = 0) {
        ctx.save();
        ctx.translate(6, 0);
        const ink = '#14161c';
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Extended stick magazine protruding beneath grip
        ctx.fillStyle = flash ? '#ffffff' : '#2f3542';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        ctx.roundRect(1, 3, 5.5, 13.5, 1.5);
        ctx.fill();
        ctx.stroke();

        // Olive-drab & charcoal boxy MAC-10 / Uzi receiver
        ctx.fillStyle = flash ? '#ffffff' : '#526846';
        ctx.beginPath();
        ctx.roundRect(-5, -5.5, 22, 9.5, 2);
        ctx.fill();
        ctx.stroke();

        // Top folded wire stock + bolt handle
        ctx.strokeStyle = flash ? '#ffffff' : '#1e272e';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(-4, -5.5);
        ctx.lineTo(-4, -8.8);
        ctx.lineTo(13, -8.8);
        ctx.stroke();
        if (!flash) {
            ctx.fillStyle = '#d1ccc0';
            ctx.fillRect(4, -4, 5, 2.2);
        }

        // Threaded snub suppressor / perforated heat barrel
        ctx.fillStyle = flash ? '#ffffff' : '#2d3436';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(16.5, -3.5, 11.5, 5.2, 1.5);
        ctx.fill();
        ctx.stroke();
        if (!flash) {
            ctx.fillStyle = '#ffa502';
            ctx.fillRect(26, -2.5, 2.2, 3.2);
        }
        ctx.restore();
    }

    static drawBullet(ctx, b) {
        ctx.fillStyle = '#ff9f43';
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-8, -2.5, 14, 5, 2.5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff3b0';
        ctx.fillRect(-3, -1.2, 7, 2.4);
    }
}

class VillageNailgun {
    static drawWeapon(ctx, flash, recoil = 0) {
        ctx.save();
        ctx.translate(6, 0);
        const ink = '#14161c';
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Slanted copper framing nail strip magazine
        ctx.fillStyle = flash ? '#ffffff' : '#d35400';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(4, 3);
        ctx.lineTo(10, 3);
        ctx.lineTo(18, 12.5);
        ctx.lineTo(11, 13.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Orange pressurized air cylinder on top
        ctx.fillStyle = flash ? '#ffffff' : '#ff6348';
        ctx.beginPath();
        ctx.roundRect(-7, -8.2, 15, 5.2, 2.5);
        ctx.fill();
        ctx.stroke();

        // Bright industrial yellow pneumatic housing
        ctx.fillStyle = flash ? '#ffffff' : '#fed330';
        ctx.beginPath();
        ctx.roundRect(-3, -4.5, 22, 9.2, 2.2);
        ctx.fill();
        ctx.stroke();

        // Charcoal handle grip & safety nose striker
        ctx.fillStyle = flash ? '#ffffff' : '#2f3542';
        ctx.fillRect(-2, 3.5, 6, 8);
        ctx.strokeRect(-2, 3.5, 6, 8);

        ctx.fillStyle = flash ? '#ffffff' : '#cbd5e1';
        ctx.beginPath();
        ctx.roundRect(18.5, -2.8, 10, 5.2, 1.4);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    static drawBullet(ctx, b) {
        // Steel framing nail with flat head & diamond point
        ctx.fillStyle = '#e2e8f0';
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-10, -3.5);
        ctx.lineTo(-7, -3.5);
        ctx.lineTo(-7, -1.6);
        ctx.lineTo(7, -1.6);
        ctx.lineTo(12, 0);
        ctx.lineTo(7, 1.6);
        ctx.lineTo(-7, 1.6);
        ctx.lineTo(-7, 3.5);
        ctx.lineTo(-10, 3.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    static onHit(b, e, finalDmg, enemies, effects) {
        if (effects) {
            effects.addSparks(e.x, e.y, '#fed330', 5);
            effects.addSparks(e.x, e.y, '#e2e8f0', 4);
        }
    }
}

class NeonArcPistol {
    static drawWeapon(ctx, flash, recoil = 0) {
        ctx.save();
        ctx.translate(6, 0);
        const ink = '#0f172a';
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Angled cyber grip with violet energy cell bottom
        ctx.fillStyle = flash ? '#ffffff' : '#1e293b';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        ctx.moveTo(-2, 2);
        ctx.lineTo(5, 2);
        ctx.lineTo(2.5, 11.5);
        ctx.lineTo(-3.5, 10.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Gunmetal upper plasma slide & vented cooling fins
        ctx.fillStyle = flash ? '#ffffff' : '#334155';
        ctx.beginPath();
        ctx.roundRect(-2, -6, 26, 9, 2.5);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            // Cyan glowing barrel channel + violet core battery
            ctx.fillStyle = '#00f5ff';
            ctx.fillRect(6, -3.5, 17, 2.8);
            ctx.fillStyle = '#d946ef';
            ctx.beginPath();
            ctx.roundRect(0, -4, 5, 4, 1);
            ctx.fill();
            ctx.fillStyle = '#00f5ff';
            ctx.fillRect(23.5, -3.2, 3.5, 3.4);
        }
        ctx.restore();
    }

    static drawBullet(ctx, b) {
        ctx.fillStyle = 'rgba(0, 245, 255, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 6.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#00f5ff';
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(11, 0);
        ctx.lineTo(-2, -4.5);
        ctx.lineTo(-9, 0);
        ctx.lineTo(-2, 4.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(2, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }

    static onHit(b, e, finalDmg, enemies, effects) {
        if (effects) {
            effects.addSparks(e.x, e.y, '#00f5ff', 6);
            effects.addSparks(e.x, e.y, '#d946ef', 4);
        }
    }
}

class SawnOffShotgun {
    static PELLET_OFFSETS = [-0.17, -0.055, 0.055, 0.17];

    static drawWeapon(ctx, flash, recoil = 0) {
        ctx.save();
        ctx.translate(6, 0);
        const ink = '#14161c';
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Curved walnut wood sawed-off pistol grip & forend
        ctx.fillStyle = flash ? '#ffffff' : '#8b4513';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(-7, 2);
        ctx.quadraticCurveTo(-2, -3, 7, -2);
        ctx.lineTo(8, 3.5);
        ctx.lineTo(-1, 4.5);
        ctx.lineTo(-5, 11);
        ctx.lineTo(-10, 8.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Forend walnut grip under barrels
        ctx.fillStyle = flash ? '#ffffff' : '#a0522d';
        ctx.beginPath();
        ctx.roundRect(10, 0, 12, 4.5, 1.5);
        ctx.fill();
        ctx.stroke();

        // Chrome break-action receiver + twin shortened steel barrels
        ctx.fillStyle = flash ? '#ffffff' : '#cbd5e1';
        ctx.beginPath();
        ctx.roundRect(1, -4.2, 8, 6.2, 1.2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#64748b';
        ctx.beginPath();
        ctx.roundRect(8, -5.2, 20, 3.2, 1);
        ctx.roundRect(8, -1.6, 20, 3.2, 1);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    static drawBullet(ctx, b) {
        ctx.fillStyle = '#ff9f43';
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(3.5, b.radius * 0.72), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff3b0';
        ctx.beginPath();
        ctx.arc(-1, -1, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    static onHit(b, e, finalDmg, enemies, effects) {
        if (e && !e.isBoss && !e.isStationary) {
            const ang = Math.atan2(b.vy || 0, b.vx || 1);
            e.x += Math.cos(ang) * 14;
            e.y += Math.sin(ang) * 14;
        }
        if (effects) {
            effects.addSparks(e.x, e.y, '#ff9f43', 6);
            effects.addSparks(e.x, e.y, '#fed330', 4);
        }
    }
}

class CryoVortexCannon {
    static drawWeapon(ctx, flash, recoil = 0) {
        ctx.save();
        ctx.translate(5, 0);
        const ink = '#0f172a';
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Heavy rear pistol grip & trigger guard
        ctx.fillStyle = flash ? '#ffffff' : '#1e293b';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(-4, 2.5); ctx.lineTo(3, 2.5); ctx.lineTo(0.5, 13); ctx.lineTo(-5.5, 11.5);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        // Main gunmetal cryo housing
        ctx.fillStyle = flash ? '#ffffff' : '#334155';
        ctx.beginPath(); ctx.roundRect(-4, -6.5, 29, 10.5, 2.5); ctx.fill(); ctx.stroke();

        // Flared Cryo Vortex Muzzle Shroud
        ctx.fillStyle = flash ? '#ffffff' : '#475569';
        ctx.beginPath(); ctx.roundRect(22, -7.8, 9, 13.0, 2); ctx.fill(); ctx.stroke();

        if (!flash) {
            // Glowing Liquid-Nitrogen Side Canister (#00f5ff)
            ctx.fillStyle = '#00f5ff';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1.4;
            ctx.beginPath(); ctx.roundRect(0, -1.0, 11, 5.2, 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#e0f2fe';
            ctx.fillRect(2, -0.2, 6, 1.4);

            // Frosted White-Ice Cooling Vents along Upper Shroud
            ctx.fillStyle = '#bae6fd';
            for (let vx = 10; vx <= 19; vx += 4.5) {
                ctx.fillRect(vx, -5.0, 2.6, 3.6);
            }
            // Swirling Cryo Bore Core Glow
            ctx.fillStyle = '#00f5ff';
            ctx.fillRect(29, -4.2, 3.2, 5.8);
        }
        ctx.restore();
    }

    static drawBullet(ctx, b) {
        if (b.type === 'cryo_shard') {
            ctx.fillStyle = '#7dd3fc';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(9, 0); ctx.lineTo(-2, -3.6); ctx.lineTo(-7, 0); ctx.lineTo(-2, 3.6);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-1, -1.0, 5, 2.0);
            return;
        }
        ctx.fillStyle = 'rgba(0, 245, 255, 0.34)';
        ctx.beginPath(); ctx.arc(0, 0, Math.max(9, (b.radius || 10) * 1.2), 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#00f5ff';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(11, 0); ctx.lineTo(0, -6.5); ctx.lineTo(-10, 0); ctx.lineTo(0, 6.5);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(1, 0, 2.8, 0, Math.PI * 2); ctx.fill();
    }

    static onHit(b, e, finalDmg, enemies, effects, game) {
        if (e && typeof e.applyIceSlow === 'function') {
            e.applyIceSlow(2.2, 0.55, effects);
        }
        if (effects) {
            effects.addSparks(e.x, e.y, '#00f5ff', 7);
            effects.addSparks(e.x, e.y, '#ffffff', 5);
            if (!b.isCryoShard && typeof effects.addShockwave === 'function') {
                effects.addShockwave(e.x, e.y, 46, 'rgba(0, 245, 255, 0.72)');
            }
        }
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        if (b.isCryoShard || !g || !Array.isArray(g.bullets) || typeof Bullet === 'undefined') return;

        // Shatter primary Cryo Orb into 3 piercing ice splinters fanning behind the frozen target
        const baseAng = Math.atan2(b.vy || 0, b.vx || 1);
        const speed = Math.max(10, (b.speed || 12) * 0.92);
        const shardDmg = Math.max(8, Math.round(finalDmg * 0.52));
        for (const off of [-0.42, 0, 0.42]) {
            const ang = baseAng + off;
            const s = new Bullet({
                x: e.x + Math.cos(ang) * 10,
                y: e.y + Math.sin(ang) * 10,
                vx: Math.cos(ang) * speed,
                vy: Math.sin(ang) * speed,
                damage: shardDmg,
                speed: speed,
                radius: 6,
                type: 'cryo_shard',
                isEnemy: false,
                pierce: 1,
                maxBounces: 0,
                range: 380,
                shooter: b.shooter || g.player
            });
            s.isCryoShard = true;
            if (s.hitEntities) s.hitEntities.add(e);
            g.bullets.push(s);
        }
    }
}

if (typeof window !== 'undefined') {
    window.StreetUzi = StreetUzi;
    window.VillageNailgun = VillageNailgun;
    window.NeonArcPistol = NeonArcPistol;
    window.SawnOffShotgun = SawnOffShotgun;
    window.CryoVortexCannon = CryoVortexCannon;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StreetUzi, VillageNailgun, NeonArcPistol, SawnOffShotgun, CryoVortexCannon };
}
