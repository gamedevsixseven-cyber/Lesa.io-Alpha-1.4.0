/**
 * Lesa.io - Common, Uncommon, Rare & Exclusive Streetwear Armor Renderer
 * Covers: tank_top, tourist_tee, denim_vest, lifeguard_vest, striped_shirt,
 *         tracksuit_top, leather_apron, biker_jacket, gucci_blazer
 */

class HeroArmorCommon {
    static drawArmor(id, ctx, r, flash, isBack, evolved) {
        switch (id) {
            case 'tank_top': this.drawTankTop(ctx, r, flash, isBack); return true;
            case 'tourist_tee': this.drawTouristTee(ctx, r, flash, isBack); return true;
            case 'denim_vest': this.drawDenimVest(ctx, r, flash, isBack); return true;
            case 'lifeguard_vest': this.drawLifeguardVest(ctx, r, flash, isBack); return true;
            case 'striped_shirt': this.drawStripedShirt(ctx, r, flash, isBack); return true;
            case 'tracksuit_top': this.drawTracksuitTop(ctx, r, flash, isBack); return true;
            case 'leather_apron': this.drawLeatherApron(ctx, r, flash, isBack); return true;
            case 'biker_jacket': this.drawBikerJacket(ctx, r, flash, isBack, evolved); return true;
            case 'gucci_blazer': this.drawGucciBlazer(ctx, r, flash, isBack, evolved); return true;
            default: return false;
        }
    }

    static drawTankTop(ctx, r, flash, isBack) {
        const g = ctx.createLinearGradient(0, -r * 0.45, 0, r * 0.40);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(1, flash ? '#ffffff' : '#dce3ec');
        ctx.fillStyle = g;
        ctx.strokeStyle = flash ? '#ffffff' : '#1e293b';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(-r * 0.54, -r * 0.45);
        ctx.lineTo(-r * 0.28, -r * 0.45);
        ctx.quadraticCurveTo(0, isBack ? -r * 0.36 : -r * 0.20, r * 0.28, -r * 0.45);
        ctx.lineTo(r * 0.54, -r * 0.45);
        ctx.quadraticCurveTo(r * 0.49, -r * 0.14, r * 0.55, r * 0.35);
        ctx.quadraticCurveTo(0, r * 0.41, -r * 0.55, r * 0.35);
        ctx.quadraticCurveTo(-r * 0.49, -r * 0.14, -r * 0.54, -r * 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        if (flash) return;

        ctx.strokeStyle = '#0984e3'; ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-r * 0.28, -r * 0.44); ctx.quadraticCurveTo(0, isBack ? -r * 0.35 : -r * 0.19, r * 0.28, -r * 0.44);
        ctx.moveTo(-r * 0.52, -r * 0.44); ctx.quadraticCurveTo(-r * 0.48, -r * 0.14, -r * 0.54, r * 0.33);
        ctx.moveTo(r * 0.52, -r * 0.44); ctx.quadraticCurveTo(r * 0.48, -r * 0.14, r * 0.54, r * 0.33);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.36)'; ctx.lineWidth = 1.0;
        for (let x = -r * 0.30; x <= r * 0.30; x += r * 0.12) {
            ctx.beginPath(); ctx.moveTo(x, -r * 0.16); ctx.lineTo(x, r * 0.33); ctx.stroke();
        }
        if (!isBack) {
            ctx.fillStyle = '#0284c7'; ctx.fillRect(r * 0.15, -r * 0.21, 7, 5);
            ctx.fillStyle = '#ffffff'; ctx.fillRect(r * 0.15, -r * 0.19, 7, 1.2); ctx.fillRect(r * 0.15, -r * 0.16, 7, 1.0);
            ctx.fillStyle = '#0284c7'; ctx.beginPath(); ctx.arc(-r * 0.12, r * 0.18, r * 0.10, Math.PI, 0); ctx.fill();
            ctx.fillStyle = '#f8fafc'; ctx.fillRect(-r * 0.22, r * 0.18, r * 0.20, r * 0.13);
        }
    }

    static drawTouristTee(ctx, r, flash, isBack) {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = flash ? '#ffffff' : '#1e293b';
        ctx.lineWidth = 2.1;
        ctx.beginPath(); ctx.roundRect(-r * 0.56, -r * 0.44, r * 1.12, r * 0.84, [8, 8, 5, 5]); ctx.fill(); ctx.stroke();
        if (flash) return;

        ctx.strokeStyle = '#0984e3'; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.moveTo(-r * 0.26, -r * 0.43); ctx.quadraticCurveTo(0, isBack ? -r * 0.36 : -r * 0.24, r * 0.26, -r * 0.43); ctx.stroke();

        if (!isBack) {
            ctx.fillStyle = '#0f172a'; ctx.font = 'bold 7.5px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('I', -r * 0.16, -r * 0.04);
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.moveTo(r * 0.10, -r * 0.01);
            ctx.bezierCurveTo(-r * 0.04, -r * 0.08, -r * 0.02, -r * 0.19, r * 0.10, -r * 0.13);
            ctx.bezierCurveTo(r * 0.22, -r * 0.19, r * 0.24, -r * 0.08, r * 0.10, -r * 0.01);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#0284c7'; ctx.beginPath(); ctx.roundRect(-r * 0.36, r * 0.12, r * 0.72, r * 0.20, 4); ctx.fill();
            ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, r * 0.22, r * 0.10, Math.PI, 0); ctx.fill();
        }
    }

    static drawDenimVest(ctx, r, flash, isBack) {
        const d = ctx.createLinearGradient(0, -r * 0.45, 0, r * 0.40);
        d.addColorStop(0, flash ? '#ffffff' : '#4479b5');
        d.addColorStop(0.6, flash ? '#ffffff' : '#2e598d');
        d.addColorStop(1, flash ? '#ffffff' : '#1e3e66');
        ctx.fillStyle = d; ctx.strokeStyle = flash ? '#ffffff' : '#0f2036'; ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(-r * 0.50, -r * 0.45); ctx.lineTo(-r * 0.24, -r * 0.45);
        ctx.quadraticCurveTo(0, isBack ? -r * 0.38 : -r * 0.18, r * 0.24, -r * 0.45);
        ctx.lineTo(r * 0.50, -r * 0.45); ctx.lineTo(r * 0.52, r * 0.36); ctx.lineTo(-r * 0.52, r * 0.36);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        if (flash) return;

        if (!isBack) {
            ctx.fillStyle = '#f8fafc'; ctx.fillRect(-r * 0.11, -r * 0.24, r * 0.22, r * 0.59);
            ctx.strokeStyle = '#d99b38'; ctx.lineWidth = 1.0;
            for (const s of [-1, 1]) {
                const px = s < 0 ? -r * 0.40 : r * 0.16;
                ctx.fillStyle = '#2d578a'; ctx.fillRect(px, -r * 0.12, r * 0.24, r * 0.20); ctx.strokeRect(px, -r * 0.12, r * 0.24, r * 0.20);
                ctx.fillStyle = '#f59e0b';
                ctx.beginPath();
                ctx.arc(px + r * 0.12, -r * 0.04, 1.7, 0, Math.PI * 2);
                ctx.arc(s * r * 0.14, r * 0.02 + (s > 0 ? r * 0.16 : 0), 1.6, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            ctx.strokeStyle = '#d99b38'; ctx.lineWidth = 1.2;
            ctx.strokeRect(-r * 0.44, -r * 0.24, r * 0.88, r * 0.52);
        }
    }

    static drawLifeguardVest(ctx, r, flash, isBack) {
        const v = ctx.createLinearGradient(0, -r * 0.44, 0, r * 0.36);
        v.addColorStop(0, flash ? '#ffffff' : '#ff7b00');
        v.addColorStop(0.6, flash ? '#ffffff' : '#f97316');
        v.addColorStop(1, flash ? '#ffffff' : '#c2410c');
        ctx.fillStyle = v; ctx.strokeStyle = flash ? '#ffffff' : '#111827'; ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-r * 0.48, -r * 0.44); ctx.lineTo(-r * 0.26, -r * 0.44);
        ctx.quadraticCurveTo(0, isBack ? -r * 0.36 : -r * 0.12, r * 0.26, -r * 0.44);
        ctx.lineTo(r * 0.48, -r * 0.44); ctx.lineTo(r * 0.52, r * 0.34);
        ctx.quadraticCurveTo(0, r * 0.38, -r * 0.52, r * 0.34);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        if (flash) return;

        for (const by of [r * 0.02, r * 0.18]) {
            ctx.fillStyle = '#18181b'; ctx.fillRect(-r * 0.52, by, r * 1.04, 4.2);
            if (!isBack) {
                ctx.fillStyle = '#3f3f46'; ctx.strokeStyle = '#09090b'; ctx.lineWidth = 1.1;
                ctx.fillRect(-r * 0.12, by - 1, r * 0.24, 6.2); ctx.strokeRect(-r * 0.12, by - 1, r * 0.24, 6.2);
            }
        }
        ctx.fillStyle = '#f8fafc';
        if (!isBack) {
            ctx.fillRect(-r * 0.46, -r * 0.10, r * 0.24, 3.6);
            ctx.fillRect(r * 0.21, -r * 0.28, 3.5, 9); ctx.fillRect(r * 0.16, -r * 0.22, 9, 3.5);
        } else {
            ctx.fillRect(-r * 0.40, -r * 0.22, r * 0.80, 4.5);
        }
    }

    static drawStripedShirt(ctx, r, flash, isBack) {
        ctx.fillStyle = flash ? '#ffffff' : '#f8fafc';
        ctx.strokeStyle = flash ? '#ffffff' : '#0f172a'; ctx.lineWidth = 2.1;
        ctx.beginPath(); ctx.roundRect(-r * 0.55, -r * 0.45, r * 1.10, r * 0.85, [8, 8, 5, 5]); ctx.fill(); ctx.stroke();
        if (flash) return;

        ctx.save();
        ctx.beginPath(); ctx.roundRect(-r * 0.54, -r * 0.44, r * 1.08, r * 0.83, [7, 7, 4, 4]); ctx.clip();
        ctx.fillStyle = '#1d4ed8';
        for (let y = -r * 0.36; y < r * 0.40; y += r * 0.18) ctx.fillRect(-r * 0.58, y, r * 1.16, r * 0.08);
        ctx.restore();

        ctx.fillStyle = '#1e3a8a'; ctx.strokeStyle = '#090f24'; ctx.lineWidth = 1.6;
        if (!isBack) {
            ctx.beginPath();
            ctx.moveTo(-r * 0.46, -r * 0.45); ctx.lineTo(0, -r * 0.16); ctx.lineTo(r * 0.46, -r * 0.45);
            ctx.lineTo(r * 0.28, -r * 0.45); ctx.quadraticCurveTo(0, -r * 0.28, -r * 0.28, -r * 0.45);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#172554'; ctx.beginPath(); ctx.arc(0, -r * 0.14, 3.0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#172554'; ctx.lineWidth = 2.0;
            ctx.beginPath(); ctx.moveTo(-3.5, -r * 0.01); ctx.lineTo(0, -r * 0.13); ctx.lineTo(3.5, -r * 0.01); ctx.stroke();
        } else {
            ctx.fillRect(-r * 0.44, -r * 0.44, r * 0.88, r * 0.22); ctx.strokeRect(-r * 0.44, -r * 0.44, r * 0.88, r * 0.22);
        }
    }

    static drawTracksuitTop(ctx, r, flash, isBack) {
        const c = ctx.createLinearGradient(0, -r * 0.46, 0, r * 0.42);
        c.addColorStop(0, flash ? '#ffffff' : '#fbf5e5');
        c.addColorStop(1, flash ? '#ffffff' : '#dfd4b8');
        ctx.fillStyle = c; ctx.strokeStyle = flash ? '#ffffff' : '#0f172a'; ctx.lineWidth = 2.1;
        ctx.beginPath(); ctx.roundRect(-r * 0.56, -r * 0.45, r * 1.12, r * 0.86, [8, 8, 5, 5]); ctx.fill(); ctx.stroke();
        if (flash) return;

        ctx.fillStyle = '#0f295c'; ctx.fillRect(-r * 0.54, r * 0.30, r * 1.08, r * 0.11);
        for (const s of [-1, 1]) {
            ctx.fillStyle = '#0f295c'; ctx.fillRect(s < 0 ? -r * 0.54 : r * 0.28, -r * 0.44, r * 0.26, 3.2);
            ctx.fillStyle = '#e11d48'; ctx.fillRect(s < 0 ? -r * 0.54 : r * 0.28, -r * 0.41, r * 0.26, 2.2);
        }
        if (!isBack) {
            ctx.fillStyle = '#0f295c';
            ctx.beginPath();
            ctx.moveTo(-r * 0.34, -r * 0.44); ctx.lineTo(0, -r * 0.22); ctx.lineTo(r * 0.34, -r * 0.44);
            ctx.lineTo(r * 0.22, -r * 0.44); ctx.quadraticCurveTo(0, -r * 0.30, -r * 0.22, -r * 0.44);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1.8;
            ctx.beginPath(); ctx.moveTo(0, -r * 0.22); ctx.lineTo(0, r * 0.40); ctx.stroke();
            ctx.fillStyle = '#0f295c';
            ctx.beginPath();
            ctx.moveTo(r * 0.18, -r * 0.08); ctx.lineTo(r * 0.15, -r * 0.18); ctx.lineTo(r * 0.22, -r * 0.13);
            ctx.lineTo(r * 0.26, -r * 0.20); ctx.lineTo(r * 0.30, -r * 0.13); ctx.lineTo(r * 0.37, -r * 0.18);
            ctx.lineTo(r * 0.34, -r * 0.08); ctx.closePath(); ctx.fill();
        }
    }

    static drawLeatherApron(ctx, r, flash, isBack) {
        const l = ctx.createLinearGradient(0, -r * 0.38, 0, r * 0.44);
        l.addColorStop(0, flash ? '#ffffff' : '#783f22');
        l.addColorStop(0.55, flash ? '#ffffff' : '#592c16');
        l.addColorStop(1, flash ? '#ffffff' : '#3d1d0d');
        ctx.strokeStyle = flash ? '#ffffff' : '#4a2310'; ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(-r * 0.32, -r * 0.44); ctx.lineTo(-r * 0.26, -r * 0.26);
        ctx.moveTo(r * 0.32, -r * 0.44); ctx.lineTo(r * 0.26, -r * 0.26);
        ctx.stroke();

        if (!isBack) {
            ctx.fillStyle = l; ctx.strokeStyle = flash ? '#ffffff' : '#1f0e06'; ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(-r * 0.34, -r * 0.26); ctx.lineTo(r * 0.34, -r * 0.26);
            ctx.lineTo(r * 0.50, r * 0.38); ctx.quadraticCurveTo(0, r * 0.44, -r * 0.50, r * 0.38);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            if (!flash) {
                ctx.fillStyle = '#fbbf24';
                ctx.beginPath(); ctx.arc(-r * 0.25, -r * 0.23, 2.0, 0, Math.PI * 2); ctx.arc(r * 0.25, -r * 0.23, 2.0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#3b1d0e'; ctx.fillRect(-r * 0.48, r * 0.12, r * 0.96, 4.0);
                ctx.fillStyle = '#f97316';
                ctx.beginPath(); ctx.moveTo(0, -r * 0.16); ctx.quadraticCurveTo(r * 0.11, -r * 0.02, 0, r * 0.05); ctx.quadraticCurveTo(-r * 0.11, -r * 0.02, 0, -r * 0.16); ctx.fill();
                ctx.fillStyle = '#cbd5e1'; ctx.fillRect(-r * 0.34, -r * 0.02, 4.5, 7);
                ctx.fillStyle = '#dc2626'; ctx.fillRect(r * 0.24, r * 0.01, 4.2, 6);
            }
        } else {
            ctx.strokeStyle = flash ? '#ffffff' : '#5c2d17'; ctx.lineWidth = 3.2;
            ctx.beginPath();
            ctx.moveTo(-r * 0.34, -r * 0.44); ctx.lineTo(r * 0.34, r * 0.16);
            ctx.moveTo(r * 0.34, -r * 0.44); ctx.lineTo(-r * 0.34, r * 0.16);
            ctx.stroke();
            if (!flash) { ctx.fillStyle = '#472211'; ctx.fillRect(-r * 0.50, r * 0.12, r * 1.0, 4.5); }
        }
    }

    static drawBikerJacket(ctx, r, flash, isBack, evolved) {
        const m = ctx.createLinearGradient(0, -r * 0.46, 0, r * 0.42);
        m.addColorStop(0, flash ? '#ffffff' : '#2c2e38');
        m.addColorStop(0.55, flash ? '#ffffff' : '#191b22');
        m.addColorStop(1, flash ? '#ffffff' : '#101116');
        ctx.fillStyle = m; ctx.strokeStyle = flash ? '#ffffff' : '#08090c'; ctx.lineWidth = 2.2;
        if (typeof HeroArmorEndgame !== 'undefined') {
            HeroArmorEndgame.drawBaseJacketPath(ctx, r, r * 0.54, r * 0.53, -r * 0.45, r * 0.41, -r * 0.24, isBack);
        } else {
            ctx.beginPath(); ctx.roundRect(-r * 0.55, -r * 0.45, r * 1.10, r * 0.85, 7);
        }
        ctx.fill(); ctx.stroke();

        for (const s of [-1, 1]) {
            ctx.fillStyle = flash ? '#ffffff' : '#94a3b8';
            ctx.strokeStyle = flash ? '#ffffff' : '#0f172a'; ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.ellipse(s * r * 0.50, -r * 0.35, r * 0.15, r * 0.10, s * 0.35, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
        if (flash) return;

        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2.4;
        for (const s of [-1, 1]) {
            ctx.beginPath(); ctx.moveTo(s * r * 0.44, -r * 0.16); ctx.lineTo(s * r * 0.22, -r * 0.02); ctx.lineTo(s * r * 0.22, r * 0.32); ctx.stroke();
        }
        if (!isBack) {
            for (const s of [-1, 1]) {
                ctx.fillStyle = '#f1f5f9';
                ctx.beginPath();
                ctx.moveTo(s * r * 0.34, -r * 0.19); ctx.lineTo(s * r * 0.12, -r * 0.11);
                ctx.lineTo(s * r * 0.12, -r * 0.04); ctx.lineTo(s * r * 0.34, -r * 0.12);
                ctx.closePath(); ctx.fill();
            }
            ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2.0;
            ctx.beginPath(); ctx.moveTo(0, -r * 0.24); ctx.lineTo(0, r * 0.39); ctx.stroke();
        }
        if (evolved && typeof HeroArmorEndgame !== 'undefined') HeroArmorEndgame.drawEvolvedShimmer(ctx, r, true, flash);
    }

    static drawGucciBlazer(ctx, r, flash, isBack, evolved) {
        const g = ctx.createLinearGradient(0, -r * 0.46, 0, r * 0.44);
        g.addColorStop(0, flash ? '#ffffff' : '#1e222e');
        g.addColorStop(0.6, flash ? '#ffffff' : '#13161f');
        g.addColorStop(1, flash ? '#ffffff' : '#0b0c12');
        ctx.fillStyle = g; ctx.strokeStyle = flash ? '#ffffff' : '#090a0f'; ctx.lineWidth = 2.2;
        HeroArmorEndgame.drawBaseJacketPath(ctx, r, r * 0.52, r * 0.54, -r * 0.45, r * 0.42, -r * 0.14, isBack);
        ctx.fill(); ctx.stroke();
        if (flash) return;

        if (!isBack) {
            ctx.fillStyle = '#090b10';
            ctx.beginPath(); ctx.moveTo(-r * 0.24, -r * 0.44); ctx.lineTo(0, -r * 0.08); ctx.lineTo(r * 0.24, -r * 0.44); ctx.closePath(); ctx.fill();
            ctx.fillStyle = HeroArmorEndgame.drawGoldGrad(ctx, r, -r * 0.46, r * 0.02);
            ctx.strokeStyle = '#78500b'; ctx.lineWidth = 1.2;
            for (const s of [-1, 1]) {
                ctx.beginPath();
                ctx.moveTo(s * r * 0.24, -r * 0.44); ctx.lineTo(s * r * 0.37, -r * 0.37);
                ctx.lineTo(s * r * 0.29, -r * 0.26); ctx.lineTo(s * r * 0.34, -r * 0.22);
                ctx.lineTo(0, -r * 0.05); ctx.lineTo(s * r * 0.14, -r * 0.30); ctx.closePath();
                ctx.fill(); ctx.stroke();
            }
            ctx.strokeStyle = '#2d3345'; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(0, -r * 0.05); ctx.lineTo(0, r * 0.41); ctx.stroke();
            for (let i = 0; i < 3; i++) {
                const by = r * (0.04 + i * 0.13);
                ctx.fillStyle = '#fbbf24'; ctx.strokeStyle = '#6d4406'; ctx.lineWidth = 1.0;
                ctx.beginPath(); ctx.arc(0, by, 2.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            }
            ctx.fillStyle = '#15803d'; ctx.fillRect(r * 0.16, -r * 0.21, r * 0.22, 2.8);
            ctx.fillStyle = '#dc2626'; ctx.fillRect(r * 0.16, -r * 0.18, r * 0.22, 2.0);
            for (const s of [-1, 1]) {
                ctx.fillStyle = '#191d28'; ctx.strokeStyle = '#f6c945'; ctx.lineWidth = 1.3;
                ctx.beginPath(); ctx.roundRect(s * r * 0.31 - r * 0.13, r * 0.15, r * 0.26, r * 0.09, 2); ctx.fill(); ctx.stroke();
            }
        } else {
            ctx.strokeStyle = '#f6c945'; ctx.lineWidth = 2.0;
            ctx.beginPath(); ctx.moveTo(-r * 0.34, -r * 0.44); ctx.quadraticCurveTo(0, -r * 0.38, r * 0.34, -r * 0.44); ctx.stroke();
            ctx.strokeStyle = '#2d3345'; ctx.lineWidth = 1.4;
            ctx.beginPath(); ctx.moveTo(0, -r * 0.38); ctx.lineTo(0, r * 0.41); ctx.stroke();
        }
        HeroArmorEndgame.drawEvolvedShimmer(ctx, r, evolved, flash);
    }
}

if (typeof window !== 'undefined') window.HeroArmorCommon = HeroArmorCommon;
if (typeof module !== 'undefined') module.exports = HeroArmorCommon;
