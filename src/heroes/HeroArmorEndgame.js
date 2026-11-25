/**
 * Lesa.io - Endgame Armor Vector Renderer (Epic, Legendary & Mythic)
 * Renders: psistis_coat, mat_riot_vest, aegis_jacket, grandmaster_cuirass, zeus_aegis_cuirass
 * Shared utilities (drawBaseJacketPath, drawGoldGrad, drawEvolvedShimmer) are also reused by HeroArmorCommon.
 */

class HeroArmorEndgame {
    static drawArmor(id, ctx, r, flash, isBack, evolved) {
        switch (id) {
            case 'psistis_coat': this.drawPsistisCoat(ctx, r, flash, isBack, evolved); return true;
            case 'mat_riot_vest': this.drawMatRiotVest(ctx, r, flash, isBack, evolved); return true;
            case 'aegis_jacket': this.drawAegisJacket(ctx, r, flash, isBack, evolved); return true;
            case 'grandmaster_cuirass': this.drawGrandmasterCuirass(ctx, r, flash, isBack, evolved); return true;
            case 'zeus_aegis_cuirass': this.drawZeusAegisCuirass(ctx, r, flash, isBack, evolved); return true;
            case 'apex_omega_mantle': return typeof HeroArmorApexMythic !== 'undefined' && (HeroArmorApexMythic.drawApexOmegaMantle(ctx, r, flash, isBack, evolved), true);
            case 'mythic_chronos_cuirass': return typeof HeroArmorApexMythic !== 'undefined' && (HeroArmorApexMythic.drawChronosBrigandine(ctx, r, flash, isBack, evolved), true);
            case 'mythic_poseidon_plate': return typeof HeroArmorApexMythic !== 'undefined' && (HeroArmorApexMythic.drawPoseidonPlate(ctx, r, flash, isBack, evolved), true);
            default: return false;
        }
    }

    static drawBaseJacketPath(ctx, r, topW, hipW, topY, botY, neckDropY, isBack) {
        ctx.beginPath();
        ctx.moveTo(-topW, topY);
        if (isBack) {
            ctx.quadraticCurveTo(0, topY - r * 0.03, topW, topY);
        } else {
            ctx.quadraticCurveTo(-r * 0.14, topY + r * 0.04, 0, neckDropY);
            ctx.quadraticCurveTo(r * 0.14, topY + r * 0.04, topW, topY);
        }
        ctx.lineTo(r * 0.61, topY + r * 0.18);
        ctx.lineTo(hipW, botY - r * 0.05);
        ctx.quadraticCurveTo(0, botY + r * 0.05, -hipW, botY - r * 0.05);
        ctx.lineTo(-r * 0.61, topY + r * 0.18);
        ctx.closePath();
    }

    static drawGoldGrad(ctx, r, topY, botY) {
        const g = ctx.createLinearGradient(-r * 0.4, topY, r * 0.4, botY);
        g.addColorStop(0, '#fff3a1');
        g.addColorStop(0.45, '#f6c945');
        g.addColorStop(1, '#b87d14');
        return g;
    }

    static drawEvolvedShimmer(ctx, r, evolved, flash) {
        if (!evolved || flash) return;
        const pulse = 0.45 + 0.35 * Math.sin(Date.now() * 0.006);
        ctx.save();
        ctx.strokeStyle = `rgba(255, 232, 117, ${pulse})`;
        ctx.lineWidth = 2.0;
        for (const s of [-1, 1]) {
            ctx.beginPath();
            ctx.arc(s * r * 0.56, -r * 0.36, r * 0.11, s > 0 ? -2.2 : -0.9, s > 0 ? 0.3 : 2.2);
            ctx.stroke();
        }
        ctx.restore();
    }

    /* 1. PSISTIS THERMAL BUTCHER COAT (Epic) */
    static drawPsistisCoat(ctx, r, flash, isBack, evolved) {
        ctx.save();
        const g = ctx.createLinearGradient(0, -r * 0.46, 0, r * 0.44);
        g.addColorStop(0, flash ? '#ffffff' : '#333642');
        g.addColorStop(0.6, flash ? '#ffffff' : '#23262f');
        g.addColorStop(1, flash ? '#ffffff' : '#181920');
        ctx.fillStyle = g;
        ctx.strokeStyle = flash ? '#ffffff' : '#7f1d28';
        ctx.lineWidth = 2.3;
        this.drawBaseJacketPath(ctx, r, r * 0.56, r * 0.59, -r * 0.46, r * 0.43, -r * 0.24, isBack);
        ctx.fill();
        ctx.stroke();
        if (flash) { ctx.restore(); return; }

        // Diamond quilted stitching clipped cleanly inside coat
        ctx.save();
        this.drawBaseJacketPath(ctx, r, r * 0.55, r * 0.58, -r * 0.45, r * 0.42, -r * 0.24, isBack);
        ctx.clip();
        ctx.strokeStyle = 'rgba(14, 15, 20, 0.55)';
        ctx.lineWidth = 1.15;
        for (let d = -r * 1.4; d <= r * 1.4; d += r * 0.24) {
            ctx.beginPath();
            ctx.moveTo(d, -r * 0.5); ctx.lineTo(d + r * 0.9, r * 0.5);
            ctx.moveTo(d, -r * 0.5); ctx.lineTo(d - r * 0.9, r * 0.5);
            ctx.stroke();
        }
        ctx.restore();

        // Brown studded butcher shoulder caps
        for (const s of [-1, 1]) {
            ctx.fillStyle = '#5c3626';
            ctx.strokeStyle = '#1b110d';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.ellipse(s * r * 0.48, -r * 0.36, r * 0.16, r * 0.10, s * 0.35, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#d4a359';
            ctx.beginPath(); ctx.arc(s * r * 0.52, -r * 0.36, 1.3, 0, Math.PI * 2); ctx.fill();
        }

        const glow = 0.72 + 0.28 * Math.sin(Date.now() * 0.009);
        if (!isBack) {
            ctx.strokeStyle = '#991b2b'; ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(-r * 0.26, -r * 0.45); ctx.lineTo(0, -r * 0.21); ctx.lineTo(r * 0.26, -r * 0.45);
            ctx.moveTo(0, -r * 0.21); ctx.lineTo(0, r * 0.43);
            ctx.stroke();
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = '#facc15'; ctx.strokeStyle = '#422006'; ctx.lineWidth = 1.0;
                ctx.beginPath(); ctx.roundRect(-r * 0.14, -r * 0.08 + i * r * 0.18 - 2.3, r * 0.28, 4.6, 1.5);
                ctx.fill(); ctx.stroke();
            }
            for (const s of [-1, 1]) {
                ctx.fillStyle = `rgba(255, 107, 26, ${0.42 * glow})`;
                ctx.beginPath(); ctx.ellipse(s * r * 0.34, r * 0.16, r * 0.16, r * 0.12, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#3b2421'; ctx.strokeStyle = '#991b2b'; ctx.lineWidth = 1.4;
                ctx.beginPath(); ctx.roundRect(s * r * 0.34 - r * 0.14, r * 0.17, r * 0.28, r * 0.18, 3);
                ctx.fill(); ctx.stroke();
                ctx.fillStyle = `rgba(254, 211, 48, ${glow})`;
                ctx.fillRect(s * r * 0.34 - r * 0.08, r * 0.15, r * 0.07, 3);
                ctx.fillRect(s * r * 0.34 + r * 0.01, r * 0.14, r * 0.06, 3);
            }
        } else {
            ctx.strokeStyle = `rgba(255, 120, 30, ${0.8 * glow})`; ctx.lineWidth = 2.0;
            ctx.beginPath(); ctx.moveTo(-r * 0.42, r * 0.22); ctx.quadraticCurveTo(0, r * 0.28, r * 0.42, r * 0.22); ctx.stroke();
        }
        this.drawEvolvedShimmer(ctx, r, evolved, flash);
        ctx.restore();
    }

    /* 2. MAT TACTICAL RIOT VEST (Epic Plate Carrier + Cyan Piping) */
    static drawMatRiotVest(ctx, r, flash, isBack, evolved) {
        ctx.save();
        const g = ctx.createLinearGradient(0, -r * 0.46, 0, r * 0.38);
        g.addColorStop(0, flash ? '#ffffff' : '#304156');
        g.addColorStop(0.55, flash ? '#ffffff' : '#1e293b');
        g.addColorStop(1, flash ? '#ffffff' : '#0f172a');
        ctx.fillStyle = g;
        ctx.strokeStyle = flash ? '#ffffff' : '#090d14';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-r * 0.48, -r * 0.46); ctx.lineTo(-r * 0.28, -r * 0.46);
        ctx.quadraticCurveTo(0, isBack ? -r * 0.41 : -r * 0.24, r * 0.28, -r * 0.46);
        ctx.lineTo(r * 0.48, -r * 0.46); ctx.lineTo(r * 0.54, -r * 0.20);
        ctx.lineTo(r * 0.50, r * 0.33); ctx.quadraticCurveTo(0, r * 0.39, -r * 0.50, r * 0.33);
        ctx.lineTo(-r * 0.54, -r * 0.20); ctx.closePath();
        ctx.fill(); ctx.stroke();
        if (flash) { ctx.restore(); return; }

        for (const s of [-1, 1]) {
            ctx.fillStyle = '#00f5ff';
            ctx.fillRect(s * r * 0.38 - (s < 0 ? 4 : 0), -r * 0.46, 4.2, r * 0.14);
            ctx.strokeStyle = '#00f5ff'; ctx.lineWidth = 2.1;
            ctx.beginPath(); ctx.moveTo(s * r * 0.44, -r * 0.04); ctx.lineTo(s * r * 0.38, r * 0.32); ctx.stroke();
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(s > 0 ? r * 0.44 : -r * 0.54, r * 0.02, r * 0.10, 4.0);
            ctx.fillRect(s > 0 ? r * 0.44 : -r * 0.54, r * 0.18, r * 0.10, 4.0);
        }

        if (!isBack) {
            for (const s of [-1, 1]) {
                ctx.fillStyle = '#2b3d52'; ctx.strokeStyle = '#0a0f18'; ctx.lineWidth = 1.4;
                ctx.beginPath(); ctx.roundRect(s < 0 ? -r * 0.38 : r * 0.04, -r * 0.24, r * 0.34, r * 0.22, 3);
                ctx.fill(); ctx.stroke();
            }
            ctx.fillStyle = '#384e68'; ctx.strokeStyle = '#090d14'; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.roundRect(r * 0.10, -r * 0.20, r * 0.22, r * 0.18, 2); ctx.fill(); ctx.stroke();
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = i % 2 === 0 ? '#27384d' : '#1e2c3d';
                ctx.beginPath(); ctx.roundRect(-r * 0.28, r * (0.02 + i * 0.095), r * 0.56, r * 0.075, 2);
                ctx.fill(); ctx.stroke();
            }
        } else {
            ctx.fillStyle = '#27384d'; ctx.strokeStyle = '#090d14'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.roundRect(-r * 0.34, -r * 0.28, r * 0.68, r * 0.52, 4); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#00f5ff'; ctx.fillRect(-r * 0.26, -r * 0.16, r * 0.52, r * 0.11);
            ctx.fillStyle = '#090d14'; ctx.font = 'bold 5.5px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('M.A.T', 0, -r * 0.08);
        }
        this.drawEvolvedShimmer(ctx, r, evolved, flash);
        ctx.restore();
    }

    /* 3. AEGIS KAFENIO JACKET (Legendary Aegean Coat & Gold Pauldrons) */
    static drawAegisJacket(ctx, r, flash, isBack, evolved) {
        ctx.save();
        const g = ctx.createLinearGradient(0, -r * 0.46, 0, r * 0.44);
        g.addColorStop(0, flash ? '#ffffff' : '#1d4ed8');
        g.addColorStop(0.55, flash ? '#ffffff' : '#17387a');
        g.addColorStop(1, flash ? '#ffffff' : '#0c1f4a');
        ctx.fillStyle = g;
        ctx.strokeStyle = flash ? '#ffffff' : '#081229';
        ctx.lineWidth = 2.2;
        this.drawBaseJacketPath(ctx, r, r * 0.55, r * 0.57, -r * 0.45, r * 0.43, -r * 0.18, isBack);
        ctx.fill(); ctx.stroke();

        const gold = flash ? '#ffffff' : this.drawGoldGrad(ctx, r, -r * 0.50, -r * 0.20);
        for (const s of [-1, 1]) {
            ctx.fillStyle = gold; ctx.strokeStyle = flash ? '#ffffff' : '#654107'; ctx.lineWidth = 1.7;
            ctx.beginPath(); ctx.ellipse(s * r * 0.51, -r * 0.37, r * 0.19, r * 0.12, s * 0.38, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
            if (!flash) {
                ctx.strokeStyle = '#78500b'; ctx.lineWidth = 1.0;
                ctx.beginPath(); ctx.arc(s * r * 0.51, -r * 0.37, r * 0.08, 0, Math.PI); ctx.stroke();
            }
        }
        if (flash) { ctx.restore(); return; }

        if (!isBack) {
            ctx.fillStyle = gold; ctx.strokeStyle = '#78500b'; ctx.lineWidth = 1.2;
            for (const s of [-1, 1]) {
                ctx.beginPath();
                ctx.moveTo(s * r * 0.25, -r * 0.44); ctx.lineTo(s * r * 0.37, -r * 0.34);
                ctx.lineTo(0, -r * 0.06); ctx.lineTo(s * r * 0.14, -r * 0.28); ctx.closePath();
                ctx.fill(); ctx.stroke();
            }
            ctx.fillStyle = '#fde047'; ctx.strokeStyle = '#854d0e'; ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.moveTo(r * 0.15, -r * 0.26); ctx.lineTo(r * 0.37, -r * 0.26);
            ctx.lineTo(r * 0.36, -r * 0.10); ctx.lineTo(r * 0.26, -r * 0.02); ctx.lineTo(r * 0.16, -r * 0.10);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = '#fbbf24';
                ctx.beginPath(); ctx.arc(0, r * (0.04 + i * 0.13), 2.1, 0, Math.PI * 2); ctx.fill();
            }
        } else {
            ctx.fillStyle = '#facc15'; ctx.strokeStyle = '#78500b'; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.arc(0, -r * 0.10, r * 0.13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2.0;
            ctx.beginPath(); ctx.moveTo(-r * 0.50, r * 0.36); ctx.quadraticCurveTo(0, r * 0.41, r * 0.50, r * 0.36); ctx.stroke();
        }
        this.drawEvolvedShimmer(ctx, r, evolved, flash);
        ctx.restore();
    }

    /* 4. GRANDMASTER BUTCHER CUIRASS (Legendary Obsidian & Magma Plate) */
    static drawGrandmasterCuirass(ctx, r, flash, isBack, evolved) {
        ctx.save();
        const g = ctx.createLinearGradient(0, -r * 0.46, 0, r * 0.44);
        g.addColorStop(0, flash ? '#ffffff' : '#4b4e5c');
        g.addColorStop(0.55, flash ? '#ffffff' : '#2b2d36');
        g.addColorStop(1, flash ? '#ffffff' : '#191a20');
        ctx.fillStyle = g;
        ctx.strokeStyle = flash ? '#ffffff' : '#ca8a04';
        ctx.lineWidth = 2.2;
        this.drawBaseJacketPath(ctx, r, r * 0.54, r * 0.53, -r * 0.45, r * 0.42, -r * 0.24, isBack);
        ctx.fill(); ctx.stroke();

        for (const s of [-1, 1]) {
            ctx.fillStyle = flash ? '#ffffff' : '#404350';
            ctx.strokeStyle = flash ? '#ffffff' : '#eab308'; ctx.lineWidth = 1.8;
            ctx.beginPath(); ctx.ellipse(s * r * 0.53, -r * 0.34, r * 0.19, r * 0.14, s * 0.35, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
            if (!flash) {
                ctx.fillStyle = '#cbd5e1';
                ctx.beginPath();
                ctx.arc(s * r * 0.50, -r * 0.38, 1.3, 0, Math.PI * 2);
                ctx.arc(s * r * 0.58, -r * 0.32, 1.3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        if (flash) { ctx.restore(); return; }

        const flicker = 0.72 + 0.28 * Math.sin(Date.now() * 0.011);
        const lava = ctx.createLinearGradient(0, r * 0.06, 0, r * 0.41);
        lava.addColorStop(0, '#1e1b20');
        lava.addColorStop(0.65, `rgba(234, 88, 12, ${0.85 * flicker})`);
        lava.addColorStop(1, `rgba(253, 224, 71, ${flicker})`);
        ctx.fillStyle = lava; ctx.strokeStyle = '#ca8a04'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.roundRect(-r * 0.44, r * 0.06, r * 0.88, r * 0.32, 4); ctx.fill(); ctx.stroke();

        ctx.strokeStyle = `rgba(254, 240, 138, ${flicker})`; ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-r * 0.28, r * 0.36); ctx.lineTo(-r * 0.16, r * 0.22); ctx.lineTo(-r * 0.24, r * 0.10);
        ctx.moveTo(r * 0.22, r * 0.36); ctx.lineTo(r * 0.12, r * 0.20);
        ctx.stroke();
        ctx.fillStyle = '#141215';
        ctx.fillRect(-r * 0.34, r * 0.26, 4, 4);
        ctx.fillRect(r * 0.24, r * 0.27, 4, 4);

        if (!isBack) {
            ctx.fillStyle = '#facc15'; ctx.strokeStyle = '#854d0e'; ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(0, -r * 0.24); ctx.quadraticCurveTo(r * 0.16, -r * 0.10, 0, r * 0.02);
            ctx.quadraticCurveTo(-r * 0.16, -r * 0.10, 0, -r * 0.24);
            ctx.fill(); ctx.stroke();
        }
        this.drawEvolvedShimmer(ctx, r, evolved, flash);
        ctx.restore();
    }

    /* 5. AEGIS CUIRASS OF ZEUS (Mythic Olympian Gold, Mantle & Lightning) */
    static drawZeusAegisCuirass(ctx, r, flash, isBack, evolved) {
        ctx.save();
        const t = Date.now() * 0.008;

        ctx.fillStyle = flash ? '#ffffff' : '#1e3a8a';
        ctx.strokeStyle = flash ? '#ffffff' : '#090f26';
        ctx.lineWidth = 2.0;
        if (isBack) {
            ctx.beginPath();
            ctx.moveTo(-r * 0.56, -r * 0.42); ctx.lineTo(r * 0.56, -r * 0.42);
            ctx.lineTo(r * 0.64, r * 0.44); ctx.quadraticCurveTo(0, r * 0.50, -r * 0.64, r * 0.44);
            ctx.closePath(); ctx.fill(); ctx.stroke();
        } else {
            for (const s of [-1, 1]) {
                ctx.beginPath();
                ctx.moveTo(s * r * 0.46, -r * 0.42); ctx.lineTo(s * r * 0.68, r * 0.34);
                ctx.lineTo(s * r * 0.44, r * 0.26); ctx.closePath(); ctx.fill(); ctx.stroke();
            }
        }

        ctx.fillStyle = flash ? '#ffffff' : this.drawGoldGrad(ctx, r, -r * 0.46, r * 0.42);
        ctx.strokeStyle = flash ? '#ffffff' : '#573706';
        ctx.lineWidth = 2.2;
        this.drawBaseJacketPath(ctx, r, r * 0.53, r * 0.50, -r * 0.45, r * 0.40, -r * 0.26, isBack);
        ctx.fill(); ctx.stroke();

        for (const s of [-1, 1]) {
            ctx.fillStyle = flash ? '#ffffff' : '#fbbf24';
            ctx.strokeStyle = flash ? '#ffffff' : '#573706'; ctx.lineWidth = 1.9;
            ctx.beginPath(); ctx.ellipse(s * r * 0.54, -r * 0.36, r * 0.21, r * 0.13, s * 0.32, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
        }
        if (flash) { ctx.restore(); return; }

        ctx.fillStyle = '#0284c7'; ctx.strokeStyle = '#090f26'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(-r * 0.49, r * 0.20, r * 0.98, r * 0.13, 3); ctx.fill(); ctx.stroke();

        const pulse = 0.78 + 0.22 * Math.sin(t * 2);
        ctx.fillStyle = `rgba(0, 245, 255, ${0.32 * pulse})`;
        ctx.beginPath(); ctx.arc(0, -r * 0.04, r * 0.24, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#00f5ff'; ctx.strokeStyle = '#090f26'; ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(r * 0.05, -r * 0.21); ctx.lineTo(-r * 0.12, -r * 0.01);
        ctx.lineTo(0, -r * 0.01); ctx.lineTo(-r * 0.05, r * 0.17);
        ctx.lineTo(r * 0.13, -r * 0.04); ctx.lineTo(r * 0.01, -r * 0.04);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#e0f2fe';
        for (let i = 0; i < 2; i++) {
            const a = t + i * Math.PI;
            ctx.beginPath();
            ctx.arc(Math.cos(a) * r * 0.66, -r * 0.18 + Math.sin(a * 2) * r * 0.14, 1.8, 0, Math.PI * 2);
            ctx.fill();
        }
        this.drawEvolvedShimmer(ctx, r, evolved, flash);
        ctx.restore();
    }
}

if (typeof window !== 'undefined') window.HeroArmorEndgame = HeroArmorEndgame;
if (typeof module !== 'undefined') module.exports = HeroArmorEndgame;
