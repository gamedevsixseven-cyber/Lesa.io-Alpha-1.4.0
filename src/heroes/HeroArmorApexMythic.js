/**
 * Lesa.io - Apex & Mythic Endgame Armor Renderers
 * Detailed multi-layered worn hero armor models matching the PNG gear icons:
 * - Apex 'Mantle of the End' (W60 Boss Armor)
 * - Mythic 'Chronos Aegis Brigandine' & 'Abyssal Tideguard Cuirass'
 */

class HeroArmorApexMythic {
    static traceCuirassBody(ctx, r, topW, hipW, topY, botY, neckDropY, isBack) {
        if (typeof HeroArmorEndgame !== 'undefined' && HeroArmorEndgame.drawBaseJacketPath) {
            HeroArmorEndgame.drawBaseJacketPath(ctx, r, topW, hipW, topY, botY, neckDropY, isBack);
            return;
        }
        ctx.beginPath();
        ctx.moveTo(-topW, topY);
        if (isBack) ctx.quadraticCurveTo(0, topY - r * 0.03, topW, topY);
        else {
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
        const g = ctx.createLinearGradient(-r * 0.42, topY, r * 0.42, botY);
        g.addColorStop(0, '#fef08a');
        g.addColorStop(0.42, '#f59e0b');
        g.addColorStop(1, '#92400e');
        return g;
    }

    static drawEvolvedAura(ctx, r, evolved, flash, accentColor) {
        if (!evolved || flash) return;
        const pulse = 0.50 + 0.35 * Math.sin(Date.now() * 0.0065);
        ctx.save();
        ctx.strokeStyle = `rgba(255, 232, 117, ${pulse})`;
        ctx.lineWidth = 2.0;
        for (const s of [-1, 1]) {
            ctx.beginPath();
            ctx.arc(s * r * 0.58, -r * 0.36, r * 0.15, s > 0 ? -2.2 : -0.9, s > 0 ? 0.35 : 2.25);
            ctx.stroke();
        }
        if (accentColor) {
            ctx.strokeStyle = accentColor;
            ctx.globalAlpha = 0.36 + 0.24 * Math.sin(Date.now() * 0.009);
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.arc(0, -r * 0.05, r * 0.34, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }

    static drawOmegaGlyph(ctx, cx, cy, rad, color, lw) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.arc(cx, cy - rad * 0.15, rad, Math.PI * 0.78, Math.PI * 0.22);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - rad * 1.25, cy + rad * 0.72);
        ctx.lineTo(cx - rad * 0.45, cy + rad * 0.72);
        ctx.moveTo(cx + rad * 0.45, cy + rad * 0.72);
        ctx.lineTo(cx + rad * 1.25, cy + rad * 0.72);
        ctx.stroke();
    }

    /* =========================================================================
       APEX BOSS ARMOR: MANTLE OF THE END
       ========================================================================= */
    static drawApexOmegaMantle(ctx, r, flash, isBack, evolved) {
        ctx.save();
        const t = Date.now() * 0.0075;
        const wave = Math.sin(t) * r * 0.032;

        // 1. Wide Animated Tattered Crimson-Obsidian Cloak
        const capeGrad = ctx.createLinearGradient(0, -r * 0.48, 0, r * 0.60);
        capeGrad.addColorStop(0, flash ? '#ffffff' : '#b91c1c');
        capeGrad.addColorStop(0.5, flash ? '#ffffff' : '#7f1d1d');
        capeGrad.addColorStop(1, flash ? '#ffffff' : '#26060b');
        ctx.fillStyle = capeGrad;
        ctx.strokeStyle = flash ? '#ffffff' : '#09090d';
        ctx.lineWidth = 2.1;

        if (isBack) {
            ctx.beginPath();
            ctx.moveTo(-r * 0.64, -r * 0.44);
            ctx.lineTo(r * 0.64, -r * 0.44);
            ctx.lineTo(r * 0.84 + wave * 0.6, r * 0.34);
            ctx.lineTo(r * 0.60, r * 0.54 + wave);
            ctx.lineTo(r * 0.36, r * 0.43);
            ctx.lineTo(r * 0.16, r * 0.58 - wave * 0.6);
            ctx.lineTo(0, r * 0.47);
            ctx.lineTo(-r * 0.16, r * 0.59 + wave * 0.6);
            ctx.lineTo(-r * 0.36, r * 0.43);
            ctx.lineTo(-r * 0.60, r * 0.54 - wave);
            ctx.lineTo(-r * 0.84 - wave * 0.6, r * 0.34);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            if (!flash) {
                ctx.strokeStyle = '#3b0712'; ctx.lineWidth = 1.4;
                for (const s of [-1, 1]) {
                    ctx.beginPath(); ctx.moveTo(s * r * 0.30, -r * 0.24); ctx.lineTo(s * r * 0.48, r * 0.38); ctx.stroke();
                }
                ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1.7;
                ctx.beginPath(); ctx.moveTo(-r * 0.50, -r * 0.36); ctx.quadraticCurveTo(0, -r * 0.16, r * 0.50, -r * 0.36); ctx.stroke();
            }
        } else {
            for (const s of [-1, 1]) {
                ctx.beginPath();
                ctx.moveTo(s * r * 0.46, -r * 0.42);
                ctx.lineTo(s * r * 0.84, r * 0.16 + s * wave * 0.4);
                ctx.lineTo(s * r * 0.72, r * 0.46 - s * wave * 0.5);
                ctx.lineTo(s * r * 0.54, r * 0.34);
                ctx.lineTo(s * r * 0.44, r * 0.48);
                ctx.closePath();
                ctx.fill(); ctx.stroke();
            }
        }

        // 2. Sculpted Obsidian Breastplate + Flared Hip Tassets
        const bodyGrad = ctx.createLinearGradient(0, -r * 0.48, 0, r * 0.44);
        bodyGrad.addColorStop(0, flash ? '#ffffff' : '#3a3e52');
        bodyGrad.addColorStop(0.5, flash ? '#ffffff' : '#1b1d26');
        bodyGrad.addColorStop(1, flash ? '#ffffff' : '#0b0c11');
        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = flash ? '#ffffff' : '#09090d';
        ctx.lineWidth = 2.3;
        this.traceCuirassBody(ctx, r, r * 0.56, r * 0.52, -r * 0.46, r * 0.42, -r * 0.24, isBack);
        ctx.fill(); ctx.stroke();

        for (const s of [-1, 1]) {
            ctx.fillStyle = flash ? '#ffffff' : '#161720';
            ctx.strokeStyle = flash ? '#ffffff' : (isBack ? '#09090d' : '#f59e0b');
            ctx.lineWidth = 1.7;
            ctx.beginPath();
            ctx.moveTo(s * r * 0.22, r * 0.28);
            ctx.lineTo(s * r * 0.55, r * 0.24);
            ctx.lineTo(s * r * 0.60, r * 0.50);
            ctx.lineTo(s * r * 0.26, r * 0.45);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
        }

        // 3. Double-Horned Obsidian & Antique-Gold Pauldrons (bold silhouette!)
        for (const s of [-1, 1]) {
            // Outer secondary shoulder spike
            ctx.fillStyle = flash ? '#ffffff' : this.drawGoldGrad(ctx, r, -r * 0.58, -r * 0.28);
            ctx.strokeStyle = flash ? '#ffffff' : '#09090d';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(s * r * 0.62, -r * 0.28);
            ctx.quadraticCurveTo(s * r * 0.80, -r * 0.34, s * r * 0.86, -r * 0.47);
            ctx.quadraticCurveTo(s * r * 0.72, -r * 0.44, s * r * 0.56, -r * 0.36);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            // Primary curved upward war horn
            ctx.beginPath();
            ctx.moveTo(s * r * 0.52, -r * 0.34);
            ctx.quadraticCurveTo(s * r * 0.74, -r * 0.48, s * r * 0.81, -r * 0.68);
            ctx.quadraticCurveTo(s * r * 0.62, -r * 0.54, s * r * 0.45, -r * 0.42);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            // Lower crimson-trimmed obsidian spaulder tier
            ctx.fillStyle = flash ? '#ffffff' : '#242632';
            ctx.strokeStyle = flash ? '#ffffff' : '#b91c1c';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.ellipse(s * r * 0.59, -r * 0.25, r * 0.22, r * 0.11, s * 0.32, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();

            // Upper gilded antique-gold pauldron shell + ruby jewel pin
            ctx.fillStyle = flash ? '#ffffff' : this.drawGoldGrad(ctx, r, -r * 0.48, -r * 0.26);
            ctx.strokeStyle = flash ? '#ffffff' : '#09090d';
            ctx.lineWidth = 1.9;
            ctx.beginPath();
            ctx.ellipse(s * r * 0.56, -r * 0.37, r * 0.23, r * 0.135, s * 0.34, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();

            if (!flash) {
                ctx.fillStyle = '#ff2e4c';
                ctx.strokeStyle = '#09090d';
                ctx.lineWidth = 1.1;
                ctx.beginPath();
                ctx.arc(s * r * 0.54, -r * 0.36, r * 0.042, 0, Math.PI * 2);
                ctx.fill(); ctx.stroke();
            }
        }

        if (flash) { ctx.restore(); return; }

        // 4. High Spiked Gorget Trim, Chest Chevrons & Ruby War Belt
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.7;
        if (!isBack) {
            ctx.beginPath();
            ctx.moveTo(-r * 0.42, -r * 0.42);
            ctx.lineTo(0, -r * 0.20);
            ctx.lineTo(r * 0.42, -r * 0.42);
            ctx.stroke();

            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 1.3;
            for (const py of [0.02, 0.11]) {
                ctx.beginPath();
                ctx.moveTo(-r * 0.28, r * py);
                ctx.lineTo(0, r * (py + 0.065));
                ctx.lineTo(r * 0.28, r * py);
                ctx.stroke();
            }
        }

        ctx.fillStyle = this.drawGoldGrad(ctx, r, r * 0.18, r * 0.34);
        ctx.strokeStyle = '#09090d';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.roundRect(-r * 0.51, r * 0.20, r * 1.02, r * 0.13, 3);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ff2e4c';
        ctx.beginPath();
        ctx.roundRect(-r * 0.10, r * 0.19, r * 0.20, r * 0.15, 3);
        ctx.fill(); ctx.stroke();

        // 5. High Sternum Molten Ruby Omega Core (positioned cleanly above weapon line!)
        const pulse = 0.78 + 0.22 * Math.sin(t * 2.2);
        if (!isBack) {
            const cy = -r * 0.12;
            ctx.fillStyle = `rgba(255, 42, 74, ${0.46 * pulse})`;
            ctx.beginPath(); ctx.arc(0, cy, r * 0.24, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = '#dc2626';
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 1.7;
            ctx.beginPath();
            ctx.moveTo(0, cy - r * 0.17); ctx.lineTo(r * 0.16, cy);
            ctx.lineTo(0, cy + r * 0.17); ctx.lineTo(-r * 0.16, cy);
            ctx.closePath(); ctx.fill(); ctx.stroke();

            this.drawOmegaGlyph(ctx, 0, cy + r * 0.005, r * 0.068, '#fef9c3', 1.8);
        } else {
            this.drawOmegaGlyph(ctx, 0, r * 0.01, r * 0.12, `rgba(251, 191, 36, ${0.88 * pulse})`, 2.3);
        }

        // Orbiting eclipse embers
        const emberCount = evolved ? 4 : 2;
        for (let i = 0; i < emberCount; i++) {
            const ang = t * 1.15 + i * ((Math.PI * 2) / emberCount);
            ctx.fillStyle = i % 2 === 0 ? '#ff2e4c' : '#fde047';
            ctx.beginPath();
            ctx.arc(Math.cos(ang) * r * (evolved ? 0.74 : 0.66), -r * 0.14 + Math.sin(ang * 1.7) * r * 0.20, evolved ? 2.2 : 1.7, 0, Math.PI * 2);
            ctx.fill();
        }

        this.drawEvolvedAura(ctx, r, evolved, flash, '#ff2e4c');
        ctx.restore();
    }

    /* =========================================================================
       MYTHIC: CHRONOS AEGIS BRIGANDINE
       ========================================================================= */
    static drawChronosBrigandine(ctx, r, flash, isBack, evolved) {
        ctx.save();
        const t = Date.now() * 0.007;

        ctx.fillStyle = flash ? '#ffffff' : '#991b1b';
        ctx.strokeStyle = flash ? '#ffffff' : '#111827';
        ctx.lineWidth = 1.9;
        if (isBack) {
            ctx.beginPath();
            ctx.moveTo(-r * 0.56, -r * 0.42); ctx.lineTo(r * 0.56, -r * 0.42);
            ctx.lineTo(r * 0.66, r * 0.45); ctx.quadraticCurveTo(0, r * 0.52, -r * 0.66, r * 0.45);
            ctx.closePath(); ctx.fill(); ctx.stroke();
        } else {
            for (const s of [-1, 1]) {
                ctx.beginPath();
                ctx.moveTo(s * r * 0.46, -r * 0.40); ctx.lineTo(s * r * 0.70, r * 0.34);
                ctx.lineTo(s * r * 0.46, r * 0.27); ctx.closePath(); ctx.fill(); ctx.stroke();
            }
        }

        const brigGrad = ctx.createLinearGradient(0, -r * 0.44, 0, r * 0.42);
        brigGrad.addColorStop(0, flash ? '#ffffff' : '#475569');
        brigGrad.addColorStop(0.5, flash ? '#ffffff' : '#1e293b');
        brigGrad.addColorStop(1, flash ? '#ffffff' : '#0f172a');
        ctx.fillStyle = brigGrad;
        ctx.strokeStyle = flash ? '#ffffff' : '#d97706';
        ctx.lineWidth = 2.1;
        this.traceCuirassBody(ctx, r, r * 0.54, r * 0.50, -r * 0.44, r * 0.40, -r * 0.24, isBack);
        ctx.fill(); ctx.stroke();

        // Notched Clockwork Pauldrons
        for (const s of [-1, 1]) {
            ctx.fillStyle = flash ? '#ffffff' : this.drawGoldGrad(ctx, r, -r * 0.46, -r * 0.24);
            ctx.strokeStyle = flash ? '#ffffff' : '#111827';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.ellipse(s * r * 0.55, -r * 0.36, r * 0.22, r * 0.13, s * 0.32, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
            if (!flash) {
                ctx.fillStyle = '#00f5ff';
                ctx.beginPath(); ctx.arc(s * r * 0.57, -r * 0.36, r * 0.042, 0, Math.PI * 2); ctx.fill();
            }
        }

        if (flash) { ctx.restore(); return; }

        if (!isBack) {
            ctx.fillStyle = '#7f1d1d';
            ctx.beginPath();
            ctx.moveTo(-r * 0.42, -r * 0.38); ctx.lineTo(0, -r * 0.14); ctx.lineTo(r * 0.42, -r * 0.38);
            ctx.lineTo(r * 0.34, -r * 0.18); ctx.lineTo(0, -r * 0.02); ctx.lineTo(-r * 0.34, -r * 0.18);
            ctx.closePath(); ctx.fill();

            ctx.fillStyle = '#fde047';
            for (const [sx, sy] of [[-0.29, -0.26], [0.29, -0.26], [-0.26, 0.06], [0.26, 0.06]]) {
                ctx.beginPath(); ctx.arc(r * sx, r * sy, 1.5, 0, Math.PI * 2); ctx.fill();
            }
        }

        ctx.fillStyle = this.drawGoldGrad(ctx, r, r * 0.19, r * 0.33);
        ctx.strokeStyle = '#111827'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(-r * 0.48, r * 0.21, r * 0.96, r * 0.12, 3); ctx.fill(); ctx.stroke();

        const pulse = 0.78 + 0.22 * Math.sin(t * 2);
        if (!isBack) {
            const hy = -r * 0.11;
            ctx.fillStyle = `rgba(56, 189, 248, ${0.32 * pulse})`;
            ctx.beginPath(); ctx.arc(0, hy, r * 0.20, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#38bdf8'; ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(-r * 0.12, hy - r * 0.13); ctx.lineTo(r * 0.12, hy - r * 0.13);
            ctx.lineTo(-r * 0.12, hy + r * 0.13); ctx.lineTo(r * 0.12, hy + r * 0.13);
            ctx.closePath(); ctx.fill(); ctx.stroke();
        } else {
            ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(0, -r * 0.02, r * 0.14, 0, Math.PI * 2);
            ctx.moveTo(0, -r * 0.02); ctx.lineTo(Math.cos(t) * r * 0.10, -r * 0.02 + Math.sin(t) * r * 0.10);
            ctx.stroke();
        }

        this.drawEvolvedAura(ctx, r, evolved, flash, '#38bdf8');
        ctx.restore();
    }

    /* =========================================================================
       MYTHIC: ABYSSAL TIDEGUARD CUIRASS
       ========================================================================= */
    static drawPoseidonPlate(ctx, r, flash, isBack, evolved) {
        ctx.save();
        const t = Date.now() * 0.007;

        ctx.fillStyle = flash ? '#ffffff' : '#0f766e';
        ctx.strokeStyle = flash ? '#ffffff' : '#062c38';
        ctx.lineWidth = 1.9;
        if (isBack) {
            ctx.beginPath();
            ctx.moveTo(-r * 0.56, -r * 0.42); ctx.lineTo(r * 0.56, -r * 0.42);
            ctx.lineTo(r * 0.66, r * 0.42); ctx.quadraticCurveTo(r * 0.32, r * 0.52, 0, r * 0.44);
            ctx.quadraticCurveTo(-r * 0.32, r * 0.52, -r * 0.66, r * 0.42);
            ctx.closePath(); ctx.fill(); ctx.stroke();
        } else {
            for (const s of [-1, 1]) {
                ctx.beginPath();
                ctx.moveTo(s * r * 0.46, -r * 0.40); ctx.lineTo(s * r * 0.70, r * 0.33);
                ctx.lineTo(s * r * 0.45, r * 0.27); ctx.closePath(); ctx.fill(); ctx.stroke();
            }
        }

        const seaGrad = ctx.createLinearGradient(0, -r * 0.44, 0, r * 0.42);
        seaGrad.addColorStop(0, flash ? '#ffffff' : '#0ea5e9');
        seaGrad.addColorStop(0.5, flash ? '#ffffff' : '#0369a1');
        seaGrad.addColorStop(1, flash ? '#ffffff' : '#082f49');
        ctx.fillStyle = seaGrad;
        ctx.strokeStyle = flash ? '#ffffff' : '#fbbf24';
        ctx.lineWidth = 2.1;
        this.traceCuirassBody(ctx, r, r * 0.54, r * 0.50, -r * 0.44, r * 0.40, -r * 0.24, isBack);
        ctx.fill(); ctx.stroke();

        for (const s of [-1, 1]) {
            ctx.fillStyle = flash ? '#ffffff' : '#22d3ee';
            ctx.strokeStyle = flash ? '#ffffff' : '#082f49'; ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(s * r * 0.54, -r * 0.42); ctx.lineTo(s * r * 0.78, -r * 0.56);
            ctx.lineTo(s * r * 0.69, -r * 0.31); ctx.closePath();
            ctx.fill(); ctx.stroke();

            ctx.fillStyle = flash ? '#ffffff' : this.drawGoldGrad(ctx, r, -r * 0.46, -r * 0.24);
            ctx.strokeStyle = flash ? '#ffffff' : '#082f49'; ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.ellipse(s * r * 0.54, -r * 0.35, r * 0.21, r * 0.125, s * 0.32, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
        }

        if (flash) { ctx.restore(); return; }

        ctx.strokeStyle = 'rgba(253, 224, 71, 0.55)'; ctx.lineWidth = 1.2;
        for (const sx of [-0.18, 0, 0.18]) {
            ctx.beginPath(); ctx.arc(r * sx, r * 0.08, r * 0.10, 0.1, Math.PI - 0.1); ctx.stroke();
        }

        ctx.fillStyle = this.drawGoldGrad(ctx, r, r * 0.19, r * 0.33);
        ctx.strokeStyle = '#082f49'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(-r * 0.48, r * 0.21, r * 0.96, r * 0.12, 3); ctx.fill(); ctx.stroke();

        const pulse = 0.78 + 0.22 * Math.sin(t * 2);
        const ty = isBack ? -r * 0.02 : -r * 0.10;
        ctx.fillStyle = `rgba(34, 211, 238, ${0.36 * pulse})`;
        ctx.beginPath(); ctx.arc(0, ty, r * 0.20, 0, Math.PI * 2); ctx.fill();

        ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 2.3;
        ctx.beginPath();
        ctx.moveTo(0, ty - r * 0.16); ctx.lineTo(0, ty + r * 0.15);
        ctx.moveTo(-r * 0.12, ty - r * 0.11); ctx.lineTo(-r * 0.12, ty + r * 0.02);
        ctx.lineTo(r * 0.12, ty + r * 0.02); ctx.lineTo(r * 0.12, ty - r * 0.11);
        ctx.stroke();

        ctx.fillStyle = '#a5f3fc';
        for (let i = 0; i < 2; i++) {
            const a = t + i * Math.PI;
            ctx.beginPath();
            ctx.arc(Math.cos(a) * r * 0.64, -r * 0.16 + Math.sin(a * 2) * r * 0.12, 1.7, 0, Math.PI * 2);
            ctx.fill();
        }

        this.drawEvolvedAura(ctx, r, evolved, flash, '#22d3ee');
        ctx.restore();
    }
}

if (typeof window !== 'undefined') window.HeroArmorApexMythic = HeroArmorApexMythic;
if (typeof module !== 'undefined') module.exports = HeroArmorApexMythic;
