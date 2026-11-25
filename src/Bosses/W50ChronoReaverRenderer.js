/**
 * Lesa.io - Endless Hard Mode W50 Main Boss 2.5D Renderer
 * "Kronarch, Weaver of Fractured Time" — 12-hour Clockwork Floor Dial,
 * Winged Astrolabe Pendulum Ribs, Sandglass Chamber Chest, Asymmetric Mask Crown,
 * Temporal Stasis Bubbles, Golden Rewind Ghost & Chrono Cross-Slashes.
 */

class W50ChronoReaverRenderer {
    static draw(ctx, b) {
        this._drawTemporalArenaFX(ctx, b);
        EndlessBossRenderer.drawTelegraphs(ctx, b.telegraphs);
        if (typeof EndlessBossRenderer === 'undefined') return;
        const r = b.radius, fl = b.hitFlash > 0, ang = b.angle || 0, t = (b.age || 0) * 0.055;

        ctx.save();
        EndlessBossRenderer.drawShadow(ctx, b.x, b.y, r * 1.15, b.isEnraged);
        if (typeof HardBossEntranceFX !== 'undefined' && HardBossEntranceFX.drawEntrancePortal) {
            HardBossEntranceFX.drawEntrancePortal(ctx, b, '#2ed573', '#00f5ff');
        }
        ctx.translate(b.x, b.y + Math.sin(t * 2.2) * 3.5);

        // 1. 12-Hour Astronomical Clockwork Floor Dial + Spinning Hands
        ctx.save();
        ctx.scale(1, 0.56);
        ctx.strokeStyle = b.isEnraged ? 'rgba(0, 245, 255, 0.82)' : 'rgba(46, 213, 115, 0.62)';
        ctx.lineWidth = 2.8;
        ctx.beginPath(); ctx.arc(0, 32, r * 1.65, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#fed330'; ctx.lineWidth = 2;
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * r * 1.44, 32 + Math.sin(a) * r * 1.44);
            ctx.lineTo(Math.cos(a) * r * 1.65, 32 + Math.sin(a) * r * 1.65);
            ctx.stroke();
        }
        // Ticking Clockwork Hour & Minute Hands on floor dial
        ctx.strokeStyle = '#00f5ff'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, 32); ctx.lineTo(Math.cos(t * 1.8) * r * 1.38, 32 + Math.sin(t * 1.8) * r * 1.38); ctx.stroke();
        ctx.strokeStyle = '#fed330'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(0, 32); ctx.lineTo(Math.cos(t * 0.35) * r * 0.95, 32 + Math.sin(t * 0.35) * r * 0.95); ctx.stroke();
        ctx.restore();

        // 2. Tattered Starlight Cloak + 6 Articulated Brass/Emerald Pendulum Ribs
        const sway = Math.sin(t * 2.6) * 6;
        ctx.fillStyle = fl ? '#ffffff' : '#0f172a'; ctx.strokeStyle = '#2ed573'; ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(-r * 0.55, -r * 0.35); ctx.lineTo(-r * 0.85, r * 0.82 + sway);
        ctx.lineTo(0, r * 0.72); ctx.lineTo(r * 0.85, r * 0.82 - sway); ctx.lineTo(r * 0.55, -r * 0.35);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        for (const side of [-1, 1]) {
            ctx.save();
            ctx.scale(side, 1);
            for (let i = 0; i < 3; i++) {
                ctx.save();
                ctx.translate(r * 0.38, -r * (0.28 - i * 0.14));
                ctx.rotate(-0.55 + i * 0.36 + Math.sin(t * 2 + i) * 0.05);
                ctx.fillStyle = fl ? '#ffffff' : '#1e293b'; ctx.strokeStyle = '#fed330'; ctx.lineWidth = 2.4;
                ctx.beginPath();
                ctx.moveTo(0, -6); ctx.lineTo(r * (1.24 - i * 0.14), -10);
                ctx.lineTo(r * (1.38 - i * 0.14), 0); ctx.lineTo(r * (1.10 - i * 0.14), 9); ctx.lineTo(0, 6);
                ctx.closePath(); ctx.fill(); ctx.stroke();
                ctx.fillStyle = b.isEnraged ? '#00f5ff' : '#2ed573';
                ctx.fillRect(r * 0.25, -2.5, r * 0.68, 5);
                ctx.restore();
            }
            ctx.restore();
        }

        // 3. Chest Chamber & Suspended Emerald Hourglass Core
        ctx.fillStyle = fl ? '#ffffff' : '#111827'; ctx.strokeStyle = '#fed330'; ctx.lineWidth = 3.2;
        ctx.beginPath(); ctx.roundRect(-r * 0.46, -r * 0.46, r * 0.92, r * 0.82, 10); ctx.fill(); ctx.stroke();
        ctx.save();
        ctx.rotate(Math.sin(t * 1.4) * 0.18);
        ctx.fillStyle = '#064e3b'; ctx.strokeStyle = '#00f5ff'; ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(-r * 0.24, -r * 0.32); ctx.lineTo(r * 0.24, -r * 0.32);
        ctx.lineTo(-r * 0.24, r * 0.24); ctx.lineTo(r * 0.24, r * 0.24);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath(); ctx.arc(0, -r * 0.12 + ((t * 18) % (r * 0.22)), 3.2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // 4. Asymmetric Golden Mask Helm & Crescent Temporal Halo
        ctx.fillStyle = fl ? '#ffffff' : '#f8fafc'; ctx.strokeStyle = '#09090b'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.06); ctx.lineTo(r * 0.34, -r * 0.82);
        ctx.lineTo(r * 0.28, -r * 0.44); ctx.lineTo(-r * 0.28, -r * 0.44); ctx.lineTo(-r * 0.34, -r * 0.82);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#020617';
        ctx.beginPath(); ctx.moveTo(-2, -r * 1.05); ctx.lineTo(r * 0.32, -r * 0.82); ctx.lineTo(0, -r * 0.44); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#00f5ff'; ctx.beginPath(); ctx.arc(r * 0.12, -r * 0.72, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2ed573'; ctx.fillRect(-r * 0.18, -r * 0.75, 7, 4);

        ctx.strokeStyle = '#fed330'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, -r * 0.78, r * 0.48, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();

        // 5. Aimed Clockwork Pendulum Scythe-Staff
        EndlessBossRenderer.drawAimedLayer(ctx, ang, 0, 0, () => {
            ctx.strokeStyle = '#09090b'; ctx.lineWidth = 2.6;
            ctx.fillStyle = '#1e293b'; ctx.fillRect(10, -4, r * 1.18, 8); ctx.strokeRect(10, -4, r * 1.18, 8);
            ctx.fillStyle = '#fed330';
            ctx.beginPath(); ctx.arc(r * 1.05, 0, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = b.isEnraged ? '#00f5ff' : '#2ed573';
            ctx.beginPath();
            ctx.moveTo(r * 1.08, -8); ctx.quadraticCurveTo(r * 1.65, -24, r * 1.54, 18);
            ctx.lineTo(r * 1.18, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
        });
        ctx.restore();
        EndlessBossRenderer.drawBossHUD(ctx, b);
    }

    static _drawTemporalArenaFX(ctx, b) {
        const t = (b.age || 0) * 0.06;
        // 1. Drifting Stasis Time-Bubbles
        if (Array.isArray(b._timeZones)) {
            for (const tz of b._timeZones) {
                const imploding = tz.life <= tz.implodeAt;
                const p = imploding ? (1 - tz.life / tz.implodeAt) : 0;
                const rad = imploding ? Math.max(24, tz.radius * (1 - p * 0.55)) : tz.radius;
                ctx.save();
                ctx.translate(tz.x, tz.y);
                const g = ctx.createRadialGradient(0, 0, 6, 0, 0, rad);
                g.addColorStop(0, imploding ? 'rgba(0, 245, 255, 0.34)' : 'rgba(46, 213, 115, 0.24)');
                g.addColorStop(1, 'rgba(6, 78, 59, 0.06)');
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(0, 0, rad, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = 'rgba(7, 9, 15, 0.65)'; ctx.lineWidth = 5;
                ctx.beginPath(); ctx.arc(0, 0, rad, 0, Math.PI * 2); ctx.stroke();
                ctx.strokeStyle = imploding ? '#fef08a' : '#2ed573'; ctx.lineWidth = 2.8;
                ctx.setLineDash([14, 10]); ctx.beginPath(); ctx.arc(0, 0, rad, t, t + Math.PI * 2); ctx.stroke();
                ctx.setLineDash([]);
                ctx.strokeStyle = 'rgba(0, 245, 255, 0.55)'; ctx.lineWidth = 1.6;
                ctx.beginPath(); ctx.arc(0, 0, rad * 0.55, -t * 1.4, -t * 1.4 + Math.PI * 1.5); ctx.stroke();
                // Crisp vector hourglass reticle (zero emojis)
                ctx.fillStyle = '#00f5ff'; ctx.strokeStyle = '#fed330'; ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-7, -10); ctx.lineTo(7, -10); ctx.lineTo(-7, 10); ctx.lineTo(7, 10);
                ctx.closePath(); ctx.fill(); ctx.stroke();
                ctx.restore();
            }
        }
        // 2. Golden Rewind Anchor Silhouette + Tether Thread
        if (b._rewindAnchor) {
            const ra = b._rewindAnchor;
            ctx.save();
            ctx.strokeStyle = 'rgba(254, 211, 48, 0.52)'; ctx.lineWidth = 2.4; ctx.setLineDash([10, 8]);
            ctx.beginPath(); ctx.moveTo(ra.x, ra.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            ctx.setLineDash([]);
            ctx.translate(ra.x, ra.y);
            ctx.fillStyle = 'rgba(254, 211, 48, 0.22)'; ctx.strokeStyle = '#fed330'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(0, 0, b.radius * 0.78, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.font = '900 11px "Luckiest Guy", cursive, sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.lineWidth = 3; ctx.strokeStyle = '#07090f';
            const lbl = `⏪ ${(Math.ceil(ra.timer / 60 * 10) / 10).toFixed(1)}s`;
            ctx.strokeText(lbl, 0, 0);
            ctx.fillStyle = '#fef08a';
            ctx.fillText(lbl, 0, 0);
            ctx.restore();
        }
        // 3. Post-Rewind Chrono Cross-Slashes & Paradox Detonation Marks
        if (Array.isArray(b._chronoSlashes)) {
            for (const cs of b._chronoSlashes) {
                const isWarn = cs.timer > 0;
                ctx.save();
                ctx.translate(cs.x, cs.y);
                ctx.rotate(cs.rot || 0);
                for (const rOff of [0, Math.PI * 0.5]) {
                    ctx.save();
                    ctx.rotate(rOff);
                    ctx.fillStyle = isWarn ? 'rgba(0, 245, 255, 0.22)' : 'rgba(254, 211, 48, 0.85)';
                    ctx.strokeStyle = isWarn ? '#00f5ff' : '#ffffff'; ctx.lineWidth = 2.4;
                    ctx.fillRect(-155, -14, 310, 28); ctx.strokeRect(-155, -14, 310, 28);
                    ctx.restore();
                }
                ctx.restore();
            }
        }
        if (Array.isArray(b._paradoxMarks)) {
            for (const pm of b._paradoxMarks) {
                const p = 1 - Math.max(0, pm.timer / pm.maxTimer);
                ctx.save();
                ctx.translate(pm.x, pm.y);
                ctx.fillStyle = 'rgba(168, 85, 247, 0.20)';
                ctx.beginPath(); ctx.arc(0, 0, pm.radius, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#00f5ff'; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(0, 0, pm.radius * p, 0, Math.PI * 2); ctx.stroke();
                ctx.restore();
            }
        }
    }
}

if (typeof window !== 'undefined') window.W50ChronoReaverRenderer = W50ChronoReaverRenderer;
if (typeof module !== 'undefined' && module.exports) module.exports = { W50ChronoReaverRenderer };
