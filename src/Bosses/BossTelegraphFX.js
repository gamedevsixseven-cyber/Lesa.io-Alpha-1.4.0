/**
 * Lesa.io - High-Detail Boss Telegraph & Ground Attack Zone Renderer
 * Renders crisp multi-layered tactical/arcane circles (beveled rims, progress
 * sweep arcs, converging reticles & vector sigils) with ZERO raw center emojis.
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
        const r = Math.max(10, z.radius || 64);
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
            this.drawGenericFallback(ctx, r, p, z, t);
        }

        ctx.restore();
    }

    static _drawBezelAndSweep(ctx, r, p, outerCol, sweepCol, ticks = 12) {
        // Dark contrast halo beneath rim for clarity on every arena floor
        ctx.strokeStyle = 'rgba(7, 9, 15, 0.72)';
        ctx.lineWidth = 5.5;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();

        ctx.strokeStyle = p > 0.78 ? '#ffffff' : outerCol;
        ctx.lineWidth = p > 0.78 ? 3.2 : 2.5;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();

        // Radial calibration ticks around inner bezel
        ctx.strokeStyle = outerCol;
        ctx.lineWidth = 1.6;
        for (let i = 0; i < ticks; i++) {
            const a = (i / ticks) * Math.PI * 2;
            const len = i % 3 === 0 ? 7 : 4;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * (r - len), Math.sin(a) * (r - len));
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            ctx.stroke();
        }

        // Cast-progress perimeter sweep arc
        if (p > 0.01) {
            ctx.strokeStyle = sweepCol;
            ctx.lineWidth = 3.8;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(0, 0, r + 3, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * p);
            ctx.stroke();
            ctx.lineCap = 'butt';
        }
    }

    static _drawCenterJewel(ctx, rad, fillCol, rimCol) {
        ctx.fillStyle = fillCol;
        ctx.strokeStyle = '#07090f';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(0, -rad); ctx.lineTo(rad * 0.78, 0);
        ctx.lineTo(0, rad); ctx.lineTo(-rad * 0.78, 0);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = rimCol;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -rad * 0.55); ctx.lineTo(rad * 0.42, 0);
        ctx.lineTo(0, rad * 0.55); ctx.lineTo(-rad * 0.42, 0);
        ctx.closePath(); ctx.stroke();
    }

    static drawCryoVortex(ctx, r, p, t, isPrism) {
        const grad = ctx.createRadialGradient(0, 0, r * 0.08, 0, 0, r);
        grad.addColorStop(0, isPrism ? 'rgba(168, 85, 247, 0.34)' : 'rgba(223, 249, 251, 0.34)');
        grad.addColorStop(0.65, isPrism ? 'rgba(56, 189, 248, 0.22)' : 'rgba(0, 210, 211, 0.22)');
        grad.addColorStop(1, 'rgba(9, 132, 227, 0.06)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();

        // Rising inner burst wave
        const waveR = Math.max(6, r * p);
        ctx.fillStyle = isPrism ? 'rgba(56, 189, 248, 0.16)' : 'rgba(0, 245, 255, 0.16)';
        ctx.beginPath(); ctx.arc(0, 0, waveR, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = p > 0.75 ? '#ffffff' : (isPrism ? '#c084fc' : '#00f5ff');
        ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, waveR, 0, Math.PI * 2); ctx.stroke();

        this._drawBezelAndSweep(ctx, r, p, isPrism ? '#38bdf8' : '#00f5ff', '#fef08a', 12);

        // Counter-rotating hexagonal crystal cage + 6 dendrites
        ctx.save();
        ctx.rotate(t * (isPrism ? 0.55 : -0.6));
        ctx.strokeStyle = isPrism ? 'rgba(192, 132, 252, 0.85)' : 'rgba(223, 249, 251, 0.85)';
        ctx.lineWidth = 2;
        const innerR = Math.max(10, r * (0.34 + p * 0.58));
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            const px = Math.cos(a) * innerR, py = Math.sin(a) * innerR;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.stroke();
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * innerR, Math.sin(a) * innerR); ctx.stroke();
        }
        ctx.restore();

        this._drawCenterJewel(ctx, 10, isPrism ? '#c084fc' : '#81ecec', '#ffffff');
    }

    static drawButcherChop(ctx, r, p, t) {
        const grad = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
        grad.addColorStop(0, `rgba(255, 71, 87, ${0.22 + p * 0.24})`);
        grad.addColorStop(1, 'rgba(127, 29, 29, 0.10)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();

        // Serrated saw-tooth hazard bezel
        ctx.strokeStyle = '#07090f'; ctx.lineWidth = 5;
        ctx.beginPath();
        const teeth = 20;
        for (let i = 0; i <= teeth; i++) {
            const a = (i / teeth) * Math.PI * 2 + t * 0.35;
            const rr = i % 2 === 0 ? r : r * 0.90;
            const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.strokeStyle = p > 0.78 ? '#ffffff' : '#ff6b35'; ctx.lineWidth = 2.6;
        ctx.stroke();

        // Closing crimson cleaver X-blades with steel edge highlights
        const span = Math.max(12, r * (0.95 - p * 0.32));
        for (const [col, w] of [['#07090f', 6.5], [p > 0.75 ? '#ffffff' : '#ff4757', 3.4]]) {
            ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-span * 0.56, -span * 0.56); ctx.lineTo(span * 0.56, span * 0.56);
            ctx.moveTo(span * 0.56, -span * 0.56); ctx.lineTo(-span * 0.56, span * 0.56);
            ctx.stroke();
        }
        ctx.lineCap = 'butt';
        ctx.strokeStyle = '#fed330'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.arc(0, 0, r * Math.max(0.08, p), 0, Math.PI * 2); ctx.stroke();
        this._drawCenterJewel(ctx, 8, '#ff2e4c', '#fed330');
    }

    static drawTaxSeal(ctx, r, p, t) {
        ctx.fillStyle = `rgba(241, 196, 15, ${0.12 + p * 0.22})`;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
        this._drawBezelAndSweep(ctx, r, p, '#fed330', '#eb4d4b', 16);

        ctx.save();
        ctx.rotate(-t * 0.4);
        ctx.strokeStyle = '#f5cd79'; ctx.lineWidth = 2.2; ctx.setLineDash([10, 6]);
        ctx.beginPath(); ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        const sr = Math.max(8, r * p);
        ctx.fillStyle = 'rgba(235, 77, 75, 0.28)'; ctx.strokeStyle = '#eb4d4b'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.arc(0, 0, sr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // Embossed vector Byzantine medallion star (zero text glyphs)
        ctx.fillStyle = '#fed330'; ctx.strokeStyle = '#07090f'; ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            const rad = i % 2 === 0 ? 12 : 5.5;
            const px = Math.cos(a) * rad, py = Math.sin(a) * rad;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    static drawCartelLaser(ctx, r, p, t) {
        const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, r);
        grad.addColorStop(0, `rgba(255, 71, 87, ${0.18 + p * 0.28})`);
        grad.addColorStop(1, 'rgba(15, 23, 42, 0.14)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
        this._drawBezelAndSweep(ctx, r, p, '#ff4757', '#fef08a', 8);

        // Converging 4 corner lock-on brackets
        ctx.save();
        ctx.rotate(t * 0.55);
        const lockR = r * (0.95 - p * 0.45);
        ctx.strokeStyle = p > 0.75 ? '#ffffff' : '#ff4757'; ctx.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2;
            ctx.save();
            ctx.rotate(a);
            ctx.beginPath();
            ctx.moveTo(lockR - 12, -8); ctx.lineTo(lockR, -8); ctx.lineTo(lockR, 8); ctx.lineTo(lockR - 12, 8);
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();

        ctx.fillStyle = '#ff2e4c'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.arc(0, 0, 5 + Math.sin(t * 6) * 1.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }

    static drawOrbitalNuke(ctx, r, p, t) {
        const grad = ctx.createRadialGradient(0, 0, 6, 0, 0, r);
        grad.addColorStop(0, `rgba(255, 107, 53, ${0.26 + p * 0.30})`);
        grad.addColorStop(0.65, `rgba(214, 48, 49, ${0.16 + p * 0.22})`);
        grad.addColorStop(1, 'rgba(127, 29, 29, 0.08)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();

        this._drawBezelAndSweep(ctx, r, p, '#ff6b35', '#fed330', 12);

        // Rotating 3 heavy orbital stabilizer arcs
        ctx.save();
        ctx.rotate(t * 0.75);
        ctx.strokeStyle = '#fed330'; ctx.lineWidth = 3.6;
        for (let i = 0; i < 3; i++) {
            const sa = (i / 3) * Math.PI * 2 + 0.2;
            ctx.beginPath(); ctx.arc(0, 0, r * 0.86, sa, sa + Math.PI * 0.42); ctx.stroke();
        }
        ctx.restore();

        // Shrinking plasma lock ring + 4 inward chevrons
        const ringR = Math.max(8, r * (1 - p * 0.84));
        ctx.strokeStyle = p > 0.75 ? '#ffffff' : '#ff2e4c'; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.arc(0, 0, ringR, 0, Math.PI * 2); ctx.stroke();
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2;
            ctx.save(); ctx.rotate(a);
            ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 2.2;
            ctx.beginPath(); ctx.moveTo(ringR + 9, -5); ctx.lineTo(ringR + 2, 0); ctx.lineTo(ringR + 9, 5); ctx.stroke();
            ctx.restore();
        }
        this._drawCenterJewel(ctx, 9, '#ff2e4c', '#fed330');

        // Descending Orbital Targeting Sky-Laser Pillar in final 38% of countdown
        if (p > 0.62) {
            const beamA = Math.min(1, (p - 0.62) / 0.38);
            const g = ctx.createLinearGradient(0, -240, 0, 0);
            g.addColorStop(0, 'rgba(255, 46, 76, 0)');
            g.addColorStop(1, `rgba(255, 71, 87, ${0.58 * beamA})`);
            ctx.fillStyle = g;
            ctx.fillRect(-11 * beamA, -240, 22 * beamA, 240);
            ctx.fillStyle = `rgba(255, 255, 255, ${0.80 * beamA})`;
            ctx.fillRect(-2.5 * beamA, -240, 5 * beamA, 240);
        }
    }

    static drawVenomRune(ctx, r, p, t) {
        const grad = ctx.createRadialGradient(0, 0, 6, 0, 0, r);
        grad.addColorStop(0, `rgba(46, 204, 113, ${0.22 + p * 0.24})`);
        grad.addColorStop(0.7, `rgba(142, 68, 173, ${0.18 + p * 0.22})`);
        grad.addColorStop(1, 'rgba(88, 28, 135, 0.06)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
        this._drawBezelAndSweep(ctx, r, p, '#2ed573', '#be2edd', 12);

        // Counter-rotating dual alchemical triangles (Hexagram of Blight)
        const triR = Math.max(10, r * (0.34 + p * 0.56));
        for (const [dir, col] of [[-1, '#2ecc71'], [1, '#be2edd']]) {
            ctx.save();
            ctx.rotate(t * 0.6 * dir);
            ctx.strokeStyle = col; ctx.lineWidth = 2.4;
            ctx.beginPath();
            for (let i = 0; i < 3; i++) {
                const a = (i / 3) * Math.PI * 2;
                const px = Math.cos(a) * triR, py = Math.sin(a) * triR;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath(); ctx.stroke();
            ctx.restore();
        }
        this._drawCenterJewel(ctx, 9, '#2ed573', '#ff9ff3');
    }

    static drawAvalancheTarget(ctx, r, p, t) {
        const grad = ctx.createRadialGradient(0, 0, 6, 0, 0, r);
        grad.addColorStop(0, `rgba(116, 185, 255, ${0.24 + p * 0.25})`);
        grad.addColorStop(1, 'rgba(235, 77, 75, 0.12)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
        this._drawBezelAndSweep(ctx, r, p, '#ff6b6b', '#74b9ff', 12);

        ctx.strokeStyle = '#dfe6e9'; ctx.lineWidth = 2.2;
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + 0.25;
            ctx.beginPath(); ctx.moveTo(Math.cos(a) * (r * 0.28), Math.sin(a) * (r * 0.28)); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(116, 185, 255, 0.34)';
        ctx.beginPath(); ctx.arc(0, 0, r * p, 0, Math.PI * 2); ctx.fill();
        this._drawCenterJewel(ctx, 9, '#74b9ff', '#ffffff');
    }

    static drawZeusStorm(ctx, r, p, t) {
        const grad = ctx.createRadialGradient(0, 0, 6, 0, 0, r);
        grad.addColorStop(0, `rgba(0, 245, 255, ${0.22 + p * 0.24})`);
        grad.addColorStop(1, 'rgba(241, 196, 15, 0.08)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
        this._drawBezelAndSweep(ctx, r, p, '#f1c40f', '#00f5ff', 12);

        ctx.save();
        ctx.rotate(t * 0.95);
        ctx.strokeStyle = '#00f5ff'; ctx.lineWidth = 2.4;
        const inner = Math.max(8, r * p);
        for (let i = 0; i < 4; i++) {
            ctx.save(); ctx.rotate((i / 4) * Math.PI * 2);
            ctx.beginPath();
            ctx.moveTo(0, -inner * 0.2); ctx.lineTo(6, -inner * 0.55); ctx.lineTo(-4, -inner * 0.72); ctx.lineTo(2, -inner);
            ctx.stroke(); ctx.restore();
        }
        ctx.restore();

        ctx.fillStyle = '#fed330'; ctx.strokeStyle = '#07090f'; ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(3, -11); ctx.lineTo(-6, 1); ctx.lineTo(0, 1);
        ctx.lineTo(-3, 11); ctx.lineTo(6, -1); ctx.lineTo(0, -1);
        ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    static drawGenericFallback(ctx, r, p, z, t) {
        const rimCol = z.color || '#ff4757';
        const coreCol = z.sparkColor || '#fed330';
        const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, r);
        grad.addColorStop(0, 'rgba(255, 71, 87, 0.14)');
        grad.addColorStop(0.7, 'rgba(255, 71, 87, 0.22)');
        grad.addColorStop(1, 'rgba(15, 23, 42, 0.06)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();

        const waveR = Math.max(6, r * p);
        ctx.fillStyle = z.fillColor || 'rgba(255, 71, 87, 0.26)';
        ctx.beginPath(); ctx.arc(0, 0, waveR, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = p > 0.75 ? '#ffffff' : coreCol;
        ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.arc(0, 0, waveR, 0, Math.PI * 2); ctx.stroke();

        this._drawBezelAndSweep(ctx, r, p, rimCol, coreCol, 12);

        // Counter-rotating 4-prong arcane target brackets (ZERO emojis)
        ctx.save();
        ctx.rotate(-t * 0.7);
        ctx.strokeStyle = coreCol; ctx.lineWidth = 2.2;
        const br = r * 0.62;
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
            ctx.beginPath(); ctx.arc(0, 0, br, a - 0.22, a + 0.22); ctx.stroke();
        }
        ctx.restore();

        this._drawCenterJewel(ctx, 9, rimCol, coreCol);
    }
}

if (typeof window !== 'undefined') {
    window.BossTelegraphFX = BossTelegraphFX;
}
