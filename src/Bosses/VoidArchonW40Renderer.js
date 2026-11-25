/**
 * Lesa.io - W40 Hard Main Boss ("Nyxor, Herald of the Void Eclipse") High-Detail 2.5D Renderer
 * Renders levitating Astral Void Sovereign with Eclipse Corona Halo, 8 Spectral Filigree Wing-Blades,
 * Black-Hole Accretion Chest Singularity, Hooded Triple-Horned Cowl, Orbiting Void Monoliths,
 * Astral Pulsar Scythe-Staff, and violet-cyan Eclipse Judgment Beams.
 */

class VoidArchonW40Renderer {
    static draw(ctx, b) {
        EndlessBossRenderer.drawTelegraphs(ctx, b.telegraphs);
        this._drawEclipseBeams(ctx, b);
        if (typeof EndlessBossRenderer === 'undefined') return;
        const r = b.radius, fl = b.hitFlash > 0, ang = b.angle || 0, t = (b.age || 0) * 0.055;
        const hover = Math.sin(t * 2.2) * 4.5;

        ctx.save();
        EndlessBossRenderer.drawShadow(ctx, b.x, b.y, r * 1.15, b.isEnraged);
        if (typeof HardBossEntranceFX !== 'undefined') HardBossEntranceFX.drawEntrancePortal(ctx, b, '#a855f7', '#38bdf8');
        ctx.translate(b.x, b.y + hover);

        // 1. Levitating Void Vortex Ring under hovering Archon robes
        ctx.save();
        ctx.translate(0, r * 0.62); ctx.scale(1, 0.42);
        ctx.strokeStyle = b.isEnraged ? 'rgba(244, 63, 94, 0.72)' : 'rgba(56, 189, 248, 0.62)';
        ctx.lineWidth = 3; ctx.setLineDash([16, 10]);
        ctx.rotate(t * 1.6);
        ctx.beginPath(); ctx.arc(0, 0, r * 1.05, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // 2. Solar-Void Eclipse Corona behind shoulders (black moon + glowing halo)
        ctx.save();
        ctx.translate(0, -r * 0.46);
        ctx.fillStyle = 'rgba(168, 85, 247, 0.28)';
        ctx.beginPath(); ctx.arc(0, 0, r * 1.25, 0, Math.PI * 2); ctx.fill();
        ctx.rotate(-t * 0.75);
        ctx.strokeStyle = b.isEnraged ? '#f43f5e' : '#38bdf8';
        ctx.lineWidth = 3.8; ctx.setLineDash([24, 10]);
        ctx.beginPath(); ctx.arc(0, 0, r * 1.14, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#09090b'; ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, r * 0.66, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.restore();

        // 3. 8 Elongated Spectral Filigree Wing-Blades (4 per side)
        for (const side of [-1, 1]) {
            ctx.save(); ctx.scale(side, 1);
            for (let k = 0; k < 4; k++) {
                ctx.save();
                ctx.translate(r * 0.32, -r * (0.28 - k * 0.14));
                ctx.rotate(-0.68 + k * 0.34 + Math.sin(t * 2 + k) * 0.05);
                ctx.fillStyle = fl ? '#ffffff' : (k % 2 === 0 ? '#1e1b4b' : '#4c1d95');
                ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.4;
                ctx.beginPath();
                ctx.moveTo(0, -6); ctx.quadraticCurveTo(r * 0.9, -14, r * (1.58 - k * 0.16), 0);
                ctx.quadraticCurveTo(r * 0.85, 11, 0, 6);
                ctx.closePath(); ctx.fill(); ctx.stroke();
                ctx.fillStyle = '#c084fc'; ctx.fillRect(r * 0.2, -1.5, r * 0.82, 3);
                ctx.restore();
            }
            ctx.restore();
        }

        // 4. Sculpted Astral War Robes, Crimson/Indigo Tabard & Gilded Mantles
        ctx.fillStyle = fl ? '#ffffff' : '#1e1b4b'; ctx.strokeStyle = '#09090b'; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-r * 0.56, -r * 0.44); ctx.lineTo(r * 0.56, -r * 0.44);
        ctx.lineTo(r * 0.72, r * 0.72); ctx.lineTo(r * 0.24, r * 0.54);
        ctx.lineTo(0, r * 0.82); ctx.lineTo(-r * 0.24, r * 0.54);
        ctx.lineTo(-r * 0.72, r * 0.72);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        // Ornate Tabard Center Panel & Shoulder Spires
        ctx.fillStyle = '#4c1d95'; ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 2.4;
        ctx.fillRect(-r * 0.22, -r * 0.36, r * 0.44, r * 0.88); ctx.strokeRect(-r * 0.22, -r * 0.36, r * 0.44, r * 0.88);
        for (const side of [-1, 1]) {
            ctx.fillStyle = fl ? '#ffffff' : '#312e81'; ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.moveTo(side * r * 0.36, -r * 0.50); ctx.lineTo(side * r * 0.92, -r * 0.62);
            ctx.lineTo(side * r * 0.78, -r * 0.20); ctx.lineTo(side * r * 0.42, -r * 0.14);
            ctx.closePath(); ctx.fill(); ctx.stroke();
        }

        // Black-Hole Chest Singularity Core
        ctx.fillStyle = b.isEnraged ? '#ff2e4c' : '#38bdf8';
        ctx.beginPath(); ctx.arc(0, -r * 0.08, r * 0.26, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#09090b'; ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.arc(0, -r * 0.08, r * 0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // 5. Hooded Cowl + Triple Swept Astral Horns + Luminous Cyan Eyes
        ctx.fillStyle = fl ? '#ffffff' : '#0f172a'; ctx.strokeStyle = '#09090b'; ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.96); ctx.lineTo(r * 0.34, -r * 0.72); ctx.lineTo(r * 0.26, -r * 0.36);
        ctx.lineTo(0, -r * 0.28); ctx.lineTo(-r * 0.26, -r * 0.36); ctx.lineTo(-r * 0.34, -r * 0.72);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#c084fc';
        for (const s of [-1, 1]) {
            ctx.beginPath(); ctx.moveTo(s * r * 0.24, -r * 0.78); ctx.lineTo(s * r * 0.52, -r * 1.24); ctx.lineTo(s * r * 0.08, -r * 0.88); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-r * 0.18, -r * 0.62, 8, 5); ctx.fillRect(r * 0.18 - 8, -r * 0.62, 8, 5);

        // 6. Astral Pulsar Scythe-Staff aimed toward player
        EndlessBossRenderer.drawAimedLayer(ctx, ang, 0, 0, () => {
            ctx.strokeStyle = '#09090b'; ctx.lineWidth = 3;
            ctx.fillStyle = '#1e1b4b'; ctx.fillRect(-r * 0.2, 16, r * 1.48, 7); ctx.strokeRect(-r * 0.2, 16, r * 1.48, 7);
            ctx.fillStyle = '#c084fc'; ctx.strokeStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(r * 1.24, 19.5, 22, -Math.PI * 0.55, Math.PI * 0.55);
            ctx.quadraticCurveTo(r * 1.15, 19.5, r * 1.24, -2.5);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#e0f2fe'; ctx.beginPath(); ctx.arc(r * 1.32, 19.5, 8, 0, Math.PI * 2); ctx.fill();
        });

        // 7. 4 Faceted Orbiting Void Obelisk Shards
        for (let i = 0; i < 4; i++) {
            const oa = t * 1.15 + (i / 4) * Math.PI * 2;
            const ox = Math.cos(oa) * (r * 1.36), oy = Math.sin(oa) * (r * 0.88);
            ctx.save(); ctx.translate(ox, oy); ctx.rotate(oa + Math.PI / 2);
            ctx.fillStyle = fl ? '#ffffff' : '#6b21a8'; ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.4;
            ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(8, 0); ctx.lineTo(0, 14); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
        EndlessBossRenderer.drawBossHUD(ctx, b);
    }

    static _drawEclipseBeams(ctx, b) {
        if (!Array.isArray(b._beams)) return;
        for (const bm of b._beams) {
            const x2 = bm.x + Math.cos(bm.ang) * 900, y2 = bm.y + Math.sin(bm.ang) * 900;
            const x1 = bm.x - Math.cos(bm.ang) * 900, y1 = bm.y - Math.sin(bm.ang) * 900;
            ctx.save();
            if (bm.timer > 0) {
                ctx.strokeStyle = 'rgba(168, 85, 247, 0.34)'; ctx.lineWidth = 28;
                ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
                ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3; ctx.setLineDash([16, 10]);
                ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
            } else {
                ctx.strokeStyle = 'rgba(168, 85, 247, 0.72)'; ctx.lineWidth = 42;
                ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
                ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 14;
                ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
            }
            ctx.restore();
        }
    }
}

if (typeof window !== 'undefined') window.VoidArchonW40Renderer = VoidArchonW40Renderer;
if (typeof module !== 'undefined' && module.exports) module.exports = { VoidArchonW40Renderer };
