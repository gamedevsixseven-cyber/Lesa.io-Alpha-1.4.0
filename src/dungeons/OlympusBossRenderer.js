/**
 * Lesa.io - Mount Olympus Floor Bosses 2.5D Vector Renderer
 * Remakes Floors 1-4 Guardians from scratch:
 * CasillasSentinel, RavineChieftain, FrostTitanBoreas, KiloumpasBerserker.
 */

class OlympusBossRenderer {
    static drawBaseShadow(ctx, x, y, r, extraY = 0.86) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
        ctx.beginPath();
        ctx.ellipse(x, y + r * extraY, r * 1.02, r * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    static drawBootLegs(ctx, r, phase, pantsCol, bootCol, bootTrim, flash) {
        const legSwing = Math.sin(phase);
        const drawLeg = (hx, rot) => {
            ctx.save();
            ctx.translate(hx, r * 0.32);
            ctx.rotate(rot);
            ctx.fillStyle = flash ? '#ffffff' : pantsCol;
            ctx.beginPath();
            ctx.roundRect(-r * 0.16, -2, r * 0.32, r * 0.44, 5);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = flash ? '#ffffff' : bootCol;
            ctx.beginPath();
            ctx.roundRect(-r * 0.19, r * 0.34, r * 0.44, r * 0.24, 4);
            ctx.fill();
            ctx.stroke();
            if (!flash && bootTrim) {
                ctx.fillStyle = bootTrim;
                ctx.fillRect(-r * 0.16, r * 0.34, r * 0.36, 3);
            }
            ctx.restore();
        };
        drawLeg(-r * 0.28, -legSwing * 0.24);
        drawLeg(r * 0.26, legSwing * 0.24);
    }

    static drawPoly(ctx, pts, fill, stroke, flash) {
        ctx.fillStyle = flash ? '#ffffff' : fill;
        if (stroke) ctx.strokeStyle = stroke;
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.closePath();
        ctx.fill();
        if (stroke) ctx.stroke();
    }

    /* ==============================================================
       FLOOR 1 GUARDIAN: CASILLAS SENTINEL (Golden Keeper Juggernaut)
       ============================================================== */
    static drawCasillasSentinel(boss, ctx) {
        const r = boss.radius || 36;
        const flash = boss.hitFlash > 0;
        const facingLeft = Math.cos(boss.angle || 0) < 0;
        const isBack = Math.sin(boss.angle || 0) < -0.25;
        const phase = (boss.age || 0) * 0.18;
        const bob = boss.isDashing ? -4 : Math.abs(Math.sin(phase)) * -3;

        ctx.save();
        this.drawBaseShadow(ctx, boss.x, boss.y, r);
        ctx.translate(boss.x, boss.y + bob);

        if (boss.isDashing) {
            ctx.strokeStyle = 'rgba(241, 196, 15, 0.7)';
            ctx.lineWidth = 4;
            for (let s = -1; s <= 1; s++) {
                ctx.beginPath();
                ctx.moveTo(-Math.sign(boss.dashVx || 1) * 18, s * 11);
                ctx.lineTo(-Math.sign(boss.dashVx || 1) * 44, s * 11);
                ctx.stroke();
            }
        }

        if (facingLeft) ctx.scale(-1, 1);
        if (boss.isDashing) ctx.rotate(0.24);

        ctx.lineWidth = 2.8;
        ctx.strokeStyle = '#141418';

        // 1. Legs & Golden Cleats
        this.drawBootLegs(ctx, r, phase, '#1e272e', '#d4a017', '#ffffff', flash);

        // 2. Oversized Black & Gold "CASILLAS #1" Sentinel Jersey
        ctx.fillStyle = flash ? '#ffffff' : '#f1c40f';
        ctx.beginPath();
        ctx.roundRect(-r * 0.62, -r * 0.36, r * 1.24, r * 0.82, [12, 12, 6, 6]);
        ctx.fill();
        ctx.stroke();

        // Golden Soccer-Ball Shoulder Armor Pauldrons
        for (const sx of [-r * 0.64, r * 0.64]) {
            ctx.fillStyle = flash ? '#ffffff' : '#ffffff';
            ctx.beginPath();
            ctx.arc(sx, -r * 0.24, r * 0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            if (!flash) {
                ctx.fillStyle = '#1e272e';
                ctx.beginPath();
                ctx.arc(sx, -r * 0.24, r * 0.1, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (!flash) {
            // Black athletic chest stripe + bold un-mirrored CASILLAS text
            ctx.fillStyle = '#1e272e';
            ctx.fillRect(-r * 0.58, -r * 0.16, r * 1.16, r * 0.42);
            ctx.save();
            if (facingLeft) ctx.scale(-1, 1);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#feca57';
            ctx.font = '900 8px "Fredoka", Arial, sans-serif';
            ctx.fillText('CASILLAS', 0, isBack ? -r * 0.05 : -r * 0.04, r * 0.98);
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 12px "Luckiest Guy", Arial, sans-serif';
            ctx.fillText('1', 0, isBack ? r * 0.18 : r * 0.17);
            ctx.restore();
        }

        // 3. Head, Athletic Headband & Smirk
        ctx.save();
        ctx.translate(0, -r * 0.72);
        ctx.fillStyle = flash ? '#ffffff' : '#e0a97c';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.42, r * 0.44, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Spiky Hair + Gold Captain Headband
        ctx.fillStyle = flash ? '#ffffff' : '#3e2723';
        ctx.beginPath();
        ctx.arc(0, -r * 0.14, r * 0.42, Math.PI * 0.9, Math.PI * 2.1);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#f1c40f';
        ctx.fillRect(-r * 0.42, -r * 0.22, r * 0.84, 6);
        ctx.strokeRect(-r * 0.42, -r * 0.22, r * 0.84, 6);

        if (!isBack && !flash) {
            ctx.fillStyle = '#1e272e';
            ctx.beginPath();
            ctx.arc(-r * 0.14, 1, 2.5, 0, Math.PI * 2);
            ctx.arc(r * 0.18, 1, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#1e272e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(r * 0.04, 7, 4.5, 0.1, Math.PI - 0.35);
            ctx.stroke();
        }
        ctx.restore();

        // 4. Heavy Padded Gauntlet Fists
        for (const [ax, rot] of [[-r * 0.79, -0.2], [r * 0.79, 0.2]]) {
            ctx.save();
            ctx.translate(ax, r * 0.05);
            ctx.rotate(rot + Math.sin(phase) * 0.15);
            ctx.fillStyle = flash ? '#ffffff' : '#fa8231';
            ctx.beginPath();
            ctx.roundRect(-8, -8, 16, 16, 6);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
    }

    /* ==============================================================
       FLOOR 2 WARLORD: RAVINE CHIEFTAIN (Enipeas Gorge Assassin)
       ============================================================== */
    static drawRavineChieftain(boss, ctx) {
        const r = boss.radius || 38;
        const flash = boss.hitFlash > 0;
        const facingLeft = Math.cos(boss.angle || 0) < 0;
        const phase = (boss.age || 0) * 0.2;
        const bob = Math.abs(Math.sin(phase)) * -3;

        ctx.save();
        this.drawBaseShadow(ctx, boss.x, boss.y, r);

        // Whirlwind purple blade storm ring
        if (boss.isWhirlwind) {
            ctx.save();
            ctx.translate(boss.x, boss.y);
            ctx.rotate((boss.age || 0) * 0.38);
            ctx.strokeStyle = 'rgba(155, 89, 182, 0.85)';
            ctx.lineWidth = 4;
            ctx.setLineDash([18, 12]);
            ctx.beginPath();
            ctx.arc(0, 0, r + 18, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }

        ctx.translate(boss.x, boss.y + bob);
        if (facingLeft) ctx.scale(-1, 1);

        ctx.lineWidth = 2.6;
        ctx.strokeStyle = '#120d1d';

        // 1. Tattered Gorge Cloak fluttering behind
        ctx.save();
        ctx.rotate(Math.sin(phase * 0.5) * 0.08);
        this.drawPoly(ctx, [[-r * 0.45, -r * 0.35], [-r * 1.05, r * 0.35], [-r * 0.55, r * 0.72], [r * 0.2, r * 0.45]], '#4a1b6d', '#120d1d', flash);
        ctx.restore();

        // 2. Assassin Boots & Armored Greaves
        this.drawBootLegs(ctx, r, phase, '#2c1e3e', '#574b68', '#9b59b6', flash);

        // 3. Violet Leather Brigandine Chest + Bronze Skull Buckle
        ctx.fillStyle = flash ? '#ffffff' : '#6c2b96';
        ctx.beginPath();
        ctx.roundRect(-r * 0.55, -r * 0.38, r * 1.1, r * 0.78, 9);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            ctx.fillStyle = '#2d1a3d';
            ctx.fillRect(-r * 0.54, r * 0.14, r * 1.08, 7);
            ctx.fillStyle = '#e1b12c';
            ctx.beginPath();
            ctx.arc(0, r * 0.17, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // 4. Deep Assassin Hood & Glowing Violet Eyes
        ctx.save();
        ctx.translate(0, -r * 0.68);
        this.drawPoly(ctx, [[-r * 0.5, r * 0.28], [-r * 0.45, -r * 0.26], [0, -r * 0.55], [r * 0.48, -r * 0.22], [r * 0.44, r * 0.28]], '#5b2182', '#120d1d', flash);
        if (!flash) {
            ctx.fillStyle = '#140c1f';
            ctx.beginPath();
            ctx.ellipse(r * 0.08, 0, r * 0.28, r * 0.24, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#e056fd';
            if (!(typeof MobilePerf !== 'undefined' && MobilePerf.isMobile)) {
                ctx.shadowColor = '#e056fd';
                ctx.shadowBlur = 8;
            }
            ctx.beginPath();
            ctx.arc(-2, -1, 2.8, 0, Math.PI * 2);
            ctx.arc(10, -1, 2.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        ctx.restore();

        // 5. Twin Curved Obsidian Cleavers
        const spin = boss.isWhirlwind ? ((boss.age || 0) * 0.5) : 0;
        for (const side of [-1, 1]) {
            ctx.save();
            ctx.translate(side * r * 0.74, -r * 0.04);
            ctx.rotate(spin + side * 0.45 + Math.sin(phase) * 0.2);
            this.drawPoly(ctx, [[-3, -2], [6, -24], [14, -14], [4, 4]], '#dfe6e9', '#120d1d', flash);
            ctx.fillStyle = flash ? '#ffffff' : '#8e44ad';
            ctx.fillRect(-3, 2, 7, 8);
            ctx.restore();
        }
        ctx.restore();
    }

    /* ==============================================================
       FLOOR 3 COLOSSUS: FROST TITAN BOREAS (Northern Wind Giant)
       ============================================================== */
    static drawFrostZones(boss, ctx) {
        if (!boss.frostZones || boss.frostZones.length === 0) return;
        if (typeof BossTelegraphFX !== 'undefined') {
            BossTelegraphFX.drawZones(ctx, boss.frostZones, 'frost_prism');
            return;
        }
        for (const z of boss.frostZones) {
            const prog = Math.min(1, Math.max(0, 1 - (z.timer / z.maxTimer)));
            ctx.save();
            ctx.fillStyle = 'rgba(0, 210, 211, 0.18)';
            ctx.beginPath();
            ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(129, 236, 236, 0.34)';
            ctx.beginPath();
            ctx.arc(z.x, z.y, z.radius * prog, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = prog > 0.72 ? '#ffffff' : '#00f5ff';
            ctx.lineWidth = 3;
            ctx.setLineDash([7, 5]);
            ctx.beginPath();
            ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }
    }

    static drawFrostTitanBoreas(boss, ctx) {
        const r = boss.radius || 48;
        const flash = boss.hitFlash > 0;
        const facingLeft = Math.cos(boss.angle || 0) < 0;
        const phase = (boss.age || 0) * (boss.isAbsoluteZero ? 0.2 : 0.14);
        const bob = Math.abs(Math.sin(phase)) * -3.5;

        ctx.save();
        this.drawBaseShadow(ctx, boss.x, boss.y, r, 0.9);

        if (boss.isAbsoluteZero) {
            const pulse = r + 14 + Math.sin((boss.age || 0) * 0.22) * 5;
            ctx.save();
            ctx.strokeStyle = 'rgba(0, 245, 255, 0.78)';
            ctx.fillStyle = 'rgba(0, 210, 211, 0.16)';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.arc(boss.x, boss.y, pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        // Orbiting frost-wind crystals beneath colossus
        ctx.save();
        ctx.translate(boss.x, boss.y + r * 0.25);
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + (boss.age || 0) * 0.04;
            this.drawPoly(ctx, [
                [Math.cos(a) * (r + 12), Math.sin(a) * (r * 0.48) - 8],
                [Math.cos(a) * (r + 12) + 5, Math.sin(a) * (r * 0.48)],
                [Math.cos(a) * (r + 12), Math.sin(a) * (r * 0.48) + 8],
                [Math.cos(a) * (r + 12) - 5, Math.sin(a) * (r * 0.48)]
            ], '#81ecec', '#0984e3', flash);
        }
        ctx.restore();

        ctx.translate(boss.x, boss.y + bob);
        if (facingLeft) ctx.scale(-1, 1);

        ctx.lineWidth = 3;
        ctx.strokeStyle = '#0c1f33';

        // 1. Frost Cape
        this.drawPoly(ctx, [[-r * 0.45, -r * 0.42], [-r * 1.0, r * 0.45], [-r * 0.2, r * 0.65], [r * 0.3, r * 0.45]], '#1e6091', '#0c1f33', flash);

        // 2. Heavy Permafrost Greaves
        this.drawBootLegs(ctx, r, phase, '#1b4965', '#62b6cb', '#cae9ff', flash);

        // 3. Glacial Titan Breastplate & Bronze Meander Trim
        this.drawPoly(ctx, [
            [-r * 0.68, -r * 0.44], [0, -r * 0.56], [r * 0.68, -r * 0.44],
            [r * 0.52, r * 0.4], [0, r * 0.48], [-r * 0.52, r * 0.4]
        ], '#0984e3', '#0c1f33', flash);

        if (!flash) {
            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 2.4;
            ctx.strokeRect(-r * 0.42, -r * 0.34, r * 0.84, r * 0.14);
            ctx.fillStyle = '#81ecec';
            if (!(typeof MobilePerf !== 'undefined' && MobilePerf.isMobile)) {
                ctx.shadowColor = '#00cec9';
                ctx.shadowBlur = 10;
            }
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Giant Crystal Shoulder Pauldrons
        this.drawPoly(ctx, [[-r * 0.62, -r * 0.25], [-r * 0.96, -r * 0.72], [-r * 0.35, -r * 0.48]], '#74b9ff', '#0c1f33', flash);
        this.drawPoly(ctx, [[r * 0.35, -r * 0.48], [r * 0.96, -r * 0.72], [r * 0.62, -r * 0.25]], '#81ecec', '#0c1f33', flash);

        // 4. Boreas Face, Icicle Beard & Crown
        ctx.save();
        ctx.translate(0, -r * 0.72);
        ctx.fillStyle = flash ? '#ffffff' : '#9ed8f5';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.36, r * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Jagged Ice Beard
        this.drawPoly(ctx, [[-12, 4], [-8, 22], [0, 28], [8, 22], [12, 4]], '#dff9fb', '#0c1f33', flash);
        // Frozen Crown Spikes
        this.drawPoly(ctx, [[-15, -10], [-12, -24], [-4, -14], [0, -28], [4, -14], [12, -24], [15, -10]], '#00cec9', '#0c1f33', flash);

        if (!flash) {
            ctx.fillStyle = '#00f5ff';
            if (!(typeof MobilePerf !== 'undefined' && MobilePerf.isMobile)) {
                ctx.shadowColor = '#00f5ff';
                ctx.shadowBlur = 7;
            }
            ctx.beginPath();
            ctx.arc(-5, -3, 3, 0, Math.PI * 2);
            ctx.arc(7, -3, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        ctx.restore();

        // 5. Glacial Great-Hammer in front hand
        ctx.save();
        ctx.translate(r * 0.74, -r * 0.08);
        ctx.rotate(-0.35 + Math.sin(phase) * 0.18);
        ctx.fillStyle = flash ? '#ffffff' : '#3d2817';
        ctx.fillRect(-3, -r * 0.75, 6, r * 1.15);
        ctx.strokeRect(-3, -r * 0.75, 6, r * 1.15);
        this.drawPoly(ctx, [[-16, -r * 0.85], [16, -r * 0.85], [19, -r * 0.56], [-19, -r * 0.56]], '#74b9ff', '#0c1f33', flash);
        ctx.restore();

        ctx.restore();

        // 6. Permafrost Armor Hex-Shield during Absolute Zero defense window
        if (boss.frostArmorTimer > 0) {
            ctx.save();
            ctx.translate(boss.x, boss.y);
            ctx.rotate((boss.age || 0) * 0.03);
            ctx.strokeStyle = '#dff9fb';
            ctx.fillStyle = 'rgba(129, 236, 236, 0.16)';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                const px = Math.cos(a) * (r + 20);
                const py = Math.sin(a) * (r + 20);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
    }

    /* ==============================================================
       FLOOR 4 GLACIAL BOSS: KILOUMPAS BERSERKER (Frosted Pelt Brute)
       ============================================================== */
    static drawKiloumpasBerserker(boss, ctx) {
        const r = boss.radius || 42;
        const flash = boss.hitFlash > 0;
        const enraged = boss.isEnraged;
        const facingLeft = Math.cos(boss.angle || 0) < 0;
        const phase = (boss.age || 0) * (enraged ? 0.26 : 0.16);
        const bob = Math.abs(Math.sin(phase)) * -3;

        ctx.save();
        this.drawBaseShadow(ctx, boss.x, boss.y, r, 0.88);

        if (enraged) {
            ctx.strokeStyle = 'rgba(235, 77, 75, 0.75)';
            ctx.fillStyle = 'rgba(235, 77, 75, 0.16)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(boss.x, boss.y, r + 10 + Math.sin((boss.age || 0) * 0.25) * 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        ctx.translate(boss.x, boss.y + bob);
        if (facingLeft) ctx.scale(-1, 1);

        ctx.lineWidth = 3;
        ctx.strokeStyle = '#141418';

        const skin = flash ? '#ffffff' : (enraged ? '#e67e73' : '#f3a683');

        // 1. Sturdy Mountain Boots & Trousers
        this.drawBootLegs(ctx, r, phase, '#2d3436', '#4a2c18', '#b2bec3', flash);

        // 2. Barrel-Chested Muscular Torso + Fur Pelt Mantle
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.68, r * 0.52, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Thick Frosted Wolf-Fur Cloak Collar across shoulders
        this.drawPoly(ctx, [
            [-r * 0.76, -r * 0.34], [-r * 0.42, -r * 0.52], [r * 0.42, -r * 0.52],
            [r * 0.76, -r * 0.34], [r * 0.52, -r * 0.08], [0, -r * 0.18], [-r * 0.52, -r * 0.08]
        ], '#dfe6e9', '#141418', flash);

        if (!flash) {
            // Heavy Leather Belt + Alpine War-Paint Chest Stripes
            ctx.fillStyle = '#3d2314';
            ctx.fillRect(-r * 0.64, r * 0.2, r * 1.28, 9);
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(-7, r * 0.18, 14, 12);

            ctx.strokeStyle = enraged ? '#ff4757' : '#0984e3';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-12, -4); ctx.lineTo(-4, 10);
            ctx.moveTo(4, -4); ctx.lineTo(12, 10);
            ctx.stroke();
        }

        // 3. Furious Head, Wild Beard & Snow-Crusted Brows
        ctx.save();
        ctx.translate(0, -r * 0.7);
        ctx.fillStyle = skin;
        ctx.strokeStyle = '#141418';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.38, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Frosted Wild Beard & Shaggy Hair
        ctx.fillStyle = flash ? '#ffffff' : '#63473a';
        ctx.beginPath();
        ctx.arc(0, -r * 0.16, r * 0.39, Math.PI * 0.9, Math.PI * 2.1);
        ctx.fill();
        ctx.stroke();
        this.drawPoly(ctx, [[-r * 0.32, 3], [-r * 0.2, 20], [0, 24], [r * 0.2, 20], [r * 0.32, 3]], '#8c6d5c', '#141418', flash);

        if (!flash) {
            ctx.strokeStyle = '#dfe6e9';
            ctx.lineWidth = 3.2;
            ctx.beginPath();
            ctx.moveTo(-11, -8); ctx.lineTo(-2, -3);
            ctx.moveTo(11, -8); ctx.lineTo(2, -3);
            ctx.stroke();

            ctx.fillStyle = enraged ? '#ffeb3b' : '#ffffff';
            ctx.beginPath();
            ctx.arc(-5, -2, 3, 0, Math.PI * 2);
            ctx.arc(7, -2, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = enraged ? '#ff0000' : '#1e272e';
            ctx.beginPath();
            ctx.arc(-4.5, -2, 1.5, 0, Math.PI * 2);
            ctx.arc(7.5, -2, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // 4. Frosted Heavy Carbine Rifle aimed toward target
        ctx.save();
        ctx.rotate(facingLeft ? Math.PI - (boss.angle || 0) : (boss.angle || 0));
        ctx.fillStyle = flash ? '#ffffff' : '#5c3a21';
        ctx.beginPath();
        ctx.roundRect(-8, 2, 28, 9, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = flash ? '#ffffff' : '#2d3436';
        ctx.fillRect(10, -2, 30, 6);
        ctx.strokeRect(10, -2, 30, 6);
        if (!flash) {
            ctx.fillStyle = '#74b9ff';
            ctx.fillRect(16, -3, 8, 3);
        }
        ctx.restore();

        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.OlympusBossRenderer = OlympusBossRenderer;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OlympusBossRenderer };
}
