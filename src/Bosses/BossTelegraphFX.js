/**
 * Lesa.io - Themed Boss Telegraph & Hazard Zone Renderer
 * Gives every boss distinct ground warning reticles, runes, and detonation rings
 * instead of sharing uniform plain circles.
 */

class BossTelegraphFX {
    static drawZones(ctx, zones, defaultStyle = 'generic') {
        if (!Array.isArray(zones) || zones.length === 0) return;
        const now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.003;
        for (const z of zones) {
            const p = typeof z.progress === 'number'
                ? Math.max(0, Math.min(1, z.progress))
                : (typeof z.age === 'number' && z.maxAge > 0)
                    ? Math.max(0, Math.min(1, z.age / z.maxAge))
                    : (z.maxTimer > 0)
                        ? Math.max(0, Math.min(1, 1 - (z.timer / z.maxTimer)))
                        : 0;
            this.drawSingle(ctx, z, p, z.style || defaultStyle, now);
        }
    }

    static drawSingle(ctx, z, p, style, t = 0) {
        const r = Math.max(8, z.radius || 64);
        ctx.save();
        ctx.translate(z.x, z.y);

        if (style === 'cryo_vortex' || style === 'frost_prism') {
            this.drawCryoVortex(ctx, r, p, t, style === 'frost_prism');
        } else if (style === 'butcher_chop') {
            this.drawButcherChop(ctx, r, p, t);
        } else if (style === 'tax_seal') {
            this.drawTaxSeal(ctx, r, p, t);
        } else if (style === 'cartel_laser') {
            this.drawCartelLaser(ctx, r, p, t);
        } else if (style === 'orbital_nuke') {
            this.drawOrbitalNuke(ctx, r, p, t);
        } else if (style === 'venom_rune') {
            this.drawVenomRune(ctx, r, p, t);
        } else if (style === 'avalanche_target') {
            this.drawAvalancheTarget(ctx, r, p, t);
        } else if (style === 'zeus_storm') {
            this.drawZeusStorm(ctx, r, p, t);
        } else {
            this.drawGenericFallback(ctx, r, p, z);
        }

        ctx.restore();
    }

    static drawCryoVortex(ctx, r, p, t, isPrism) {
        const grad = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
        grad.addColorStop(0, 'rgba(223, 249, 251, 0.34)');
        grad.addColorStop(0.6, 'rgba(0, 210, 211, 0.22)');
        grad.addColorStop(1, 'rgba(9, 132, 227, 0.08)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Outer frosted ice ring
        ctx.strokeStyle = p > 0.78 ? '#ffffff' : '#00f5ff';
        ctx.lineWidth = 3;
        ctx.setLineDash(isPrism ? [10, 4] : [8, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, r, t * 0.5, t * 0.5 + Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Rotating 6-branch snowflake / frost crystal lattice
        ctx.save();
        ctx.rotate(t * (isPrism ? 0.45 : -0.6));
        ctx.strokeStyle = isPrism ? 'rgba(129, 236, 236, 0.85)' : 'rgba(223, 249, 251, 0.85)';
        ctx.lineWidth = 2.2;
        const innerR = Math.max(8, r * (0.25 + p * 0.72));
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            const ca = Math.cos(a), sa = Math.sin(a);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(ca * innerR, sa * innerR);
            const tip = innerR * 0.72;
            const side = innerR * 0.16;
            ctx.moveTo(ca * tip - sa * side, sa * tip + ca * side);
            ctx.lineTo(ca * innerR * 0.88, sa * innerR * 0.88);
            ctx.lineTo(ca * tip + sa * side, sa * tip - ca * side);
            ctx.stroke();
        }
        ctx.restore();

        // Espresso-frost swirl or glacial prism badge in center
        ctx.fillStyle = isPrism ? '#81ecec' : '#c49a6c';
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (isPrism) {
            ctx.moveTo(0, -10); ctx.lineTo(8, 0); ctx.lineTo(0, 10); ctx.lineTo(-8, 0); ctx.closePath();
        } else {
            ctx.roundRect(-7, -7, 14, 14, 3);
        }
        ctx.fill();
        ctx.stroke();
    }

    static drawButcherChop(ctx, r, p, t) {
        ctx.fillStyle = `rgba(214, 48, 49, ${0.14 + p * 0.24})`;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Saw-tooth serrated hazard ring
        ctx.strokeStyle = '#e67e22';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        const teeth = 16;
        for (let i = 0; i <= teeth; i++) {
            const a = (i / teeth) * Math.PI * 2 + t * 0.3;
            const rr = i % 2 === 0 ? r : r * 0.91;
            const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Closing crimson cleaver X-slashes
        const span = Math.max(10, r * (1.05 - p * 0.35));
        ctx.strokeStyle = p > 0.75 ? '#ffffff' : '#ff4757';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(-span * 0.55, -span * 0.55); ctx.lineTo(span * 0.55, span * 0.55);
        ctx.moveTo(span * 0.55, -span * 0.55); ctx.lineTo(-span * 0.55, span * 0.55);
        ctx.stroke();

        // Progress chop fill ring
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, r * Math.max(0.08, p), 0, Math.PI * 2);
        ctx.stroke();
    }

    static drawTaxSeal(ctx, r, p, t) {
        ctx.fillStyle = `rgba(241, 196, 15, ${0.12 + p * 0.22})`;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Ornate scalloped wax seal border
        ctx.strokeStyle = '#fed330';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i <= 24; i++) {
            const a = (i / 24) * Math.PI * 2 - t * 0.25;
            const rr = r * (0.94 + Math.sin(i * Math.PI) * 0.05);
            const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Inner converging stamp seal
        const sr = Math.max(6, r * p);
        ctx.fillStyle = 'rgba(235, 77, 75, 0.28)';
        ctx.strokeStyle = '#eb4d4b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, sr, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.font = '900 22px "Trebuchet MS", sans-serif';
        ctx.fillStyle = '#fed330';
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 3.5;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText('€', 0, 1);
        ctx.fillText('€', 0, 1);
    }

    static drawCartelLaser(ctx, r, p, t) {
        ctx.fillStyle = `rgba(45, 52, 54, ${0.22 + p * 0.2})`;
        ctx.beginPath();
        ctx.arc(0, 0, r * p, 0, Math.PI * 2);
        ctx.fill();

        // Rotating tactical diamond + corner laser brackets
        ctx.save();
        ctx.rotate(t * 0.55);
        ctx.strokeStyle = '#ff4757';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(0, -r); ctx.lineTo(r, 0); ctx.lineTo(0, r); ctx.lineTo(-r, 0); ctx.closePath();
        ctx.stroke();
        ctx.restore();

        ctx.strokeStyle = p > 0.72 ? '#ffffff' : 'rgba(255, 71, 87, 0.92)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
        ctx.stroke();

        // Blinking sniper laser dot
        ctx.fillStyle = '#ff3b30';
        ctx.beginPath();
        ctx.arc(0, 0, 4 + Math.sin(t * 6) * 2, 0, Math.PI * 2);
        ctx.fill();
    }

    static drawOrbitalNuke(ctx, r, p, t) {
        ctx.fillStyle = `rgba(214, 48, 49, ${0.15 + p * 0.25})`;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Rotating 3 orbital warning arcs
        ctx.save();
        ctx.rotate(t * 0.7);
        ctx.strokeStyle = '#ff9f43';
        ctx.lineWidth = 4;
        for (let i = 0; i < 3; i++) {
            const sa = (i / 3) * Math.PI * 2 + 0.18;
            ctx.beginPath();
            ctx.arc(0, 0, r, sa, sa + Math.PI * 0.45);
            ctx.stroke();
        }
        ctx.restore();

        // Closing target ring + crimson reactor core
        const ringR = Math.max(8, r * (1 - p * 0.82));
        ctx.strokeStyle = p > 0.75 ? '#ffffff' : '#ff4757';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, ringR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-r * 0.32, 0); ctx.lineTo(-7, 0);
        ctx.moveTo(7, 0); ctx.lineTo(r * 0.32, 0);
        ctx.moveTo(0, -r * 0.32); ctx.lineTo(0, -7);
        ctx.moveTo(0, 7); ctx.lineTo(0, r * 0.32);
        ctx.stroke();
    }

    static drawVenomRune(ctx, r, p, t) {
        ctx.fillStyle = `rgba(142, 68, 173, ${0.16 + p * 0.26})`;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = p > 0.72 ? '#ff9ff3' : '#be2edd';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        // Spinning toxic triangle sigil
        ctx.save();
        ctx.rotate(-t * 0.65);
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 2.4;
        const triR = Math.max(8, r * (0.28 + p * 0.64));
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            const a = (i / 3) * Math.PI * 2;
            const px = Math.cos(a) * triR, py = Math.sin(a) * triR;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }

    static drawAvalancheTarget(ctx, r, p, t) {
        ctx.fillStyle = `rgba(235, 77, 75, ${0.15 + p * 0.25})`;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Cracked boulder impact spokes
        ctx.strokeStyle = 'rgba(255, 107, 107, 0.92)';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#dfe6e9';
        ctx.lineWidth = 2.2;
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + 0.25;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * (r * 0.35), Math.sin(a) * (r * 0.35));
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            ctx.stroke();
        }

        ctx.fillStyle = 'rgba(116, 185, 255, 0.30)';
        ctx.beginPath();
        ctx.arc(0, 0, r * p, 0, Math.PI * 2);
        ctx.fill();
    }

    static drawZeusStorm(ctx, r, p, t) {
        ctx.fillStyle = `rgba(0, 206, 201, ${0.14 + p * 0.24})`;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Outer golden Olympic ring + spinning jagged storm arcs
        ctx.strokeStyle = p > 0.75 ? '#ffffff' : '#f1c40f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.save();
        ctx.rotate(t * 0.9);
        ctx.strokeStyle = '#00f5ff';
        ctx.lineWidth = 2.2;
        const inner = Math.max(8, r * p);
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2;
            ctx.save();
            ctx.rotate(a);
            ctx.beginPath();
            ctx.moveTo(0, -inner * 0.2);
            ctx.lineTo(6, -inner * 0.55);
            ctx.lineTo(-4, -inner * 0.7);
            ctx.lineTo(2, -inner);
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();

        // Bold crisp vector lightning sigil at center
        ctx.fillStyle = '#fed330';
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(3, -10); ctx.lineTo(-6, 1); ctx.lineTo(0, 1);
        ctx.lineTo(-3, 10); ctx.lineTo(6, -1); ctx.lineTo(0, -1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    static drawGenericFallback(ctx, r, p, z) {
        ctx.strokeStyle = z.color || 'rgba(255, 71, 87, 0.92)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = z.fillColor || 'rgba(255, 71, 87, 0.24)';
        ctx.beginPath();
        ctx.arc(0, 0, r * p, 0, Math.PI * 2);
        ctx.fill();

        if (z.icon) {
            ctx.font = '800 13px "Luckiest Guy", cursive';
            ctx.fillStyle = '#fed330';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(z.icon, 0, 0);
        }
    }
}

if (typeof window !== 'undefined') {
    window.BossTelegraphFX = BossTelegraphFX;
}
