/**
 * Lesa.io - Endless Hard Mode W45 & W55 Mini-Bosses High-Detail 2.5D Renderers
 *   - StormforgeAutomaton (W45): Magnetic Forgemaster Titan with shoulder Tesla coils,
 *     spinning dynamo chest cage, polarity field rings & N/S magnetic tether pylons.
 *   - AbyssalLeviathan (W55): Deep-Sea Kraken Warlord with 6 undulating tentacles,
 *     angler-lantern crown, bioluminescent coral carapace, submerged wake & crush lanes.
 */

class HardW45_55MiniRenderers {
    static drawMagnetarForgemaster(ctx, b) {
        this._drawPolarPylons(ctx, b);
        EndlessBossRenderer.drawTelegraphs(ctx, b.telegraphs);
        if (typeof EndlessBossRenderer === 'undefined') return;
        const r = b.radius, fl = b.hitFlash > 0, ang = b.angle || 0, t = (b.age || 0) * 0.06;

        ctx.save();
        EndlessBossRenderer.drawShadow(ctx, b.x, b.y, r * 1.12, b.isEnraged);
        ctx.translate(b.x, b.y + Math.sin(b.walkCycle || t * 2) * 2.5);

        // 1. Anchored N/S Polarity Field Ground Halo
        ctx.save();
        ctx.scale(1, 0.56);
        ctx.strokeStyle = b.isEnraged ? 'rgba(56, 189, 248, 0.85)' : 'rgba(56, 189, 248, 0.52)';
        ctx.lineWidth = 2.6;
        ctx.setLineDash([14, 9]);
        ctx.beginPath(); ctx.arc(0, 26, r * 1.55, t * 0.6, t * 0.6 + Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        for (const [off, col, sym] of [[0, '#00f5ff', '+'], [Math.PI, '#ffa502', '-']]) {
            const pa = t * 0.9 + off;
            const px = Math.cos(pa) * r * 1.55, py = 26 + Math.sin(pa) * r * 1.55;
            ctx.fillStyle = col; ctx.strokeStyle = '#09090b'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#09090b'; ctx.font = '900 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(sym, px, py);
        }
        ctx.restore();

        // 2. Heavy Bronze-Steel Pistons & Treads + Riveted Cobalt Torso
        EndlessBossRenderer.drawLegs(ctx, r, t * 1.6, '#1e293b', '#b45309', fl);
        ctx.fillStyle = fl ? '#ffffff' : '#0f172a'; ctx.strokeStyle = '#09090b'; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-r * 0.72, -r * 0.44); ctx.lineTo(-r * 0.38, -r * 0.74);
        ctx.lineTo(r * 0.38, -r * 0.74); ctx.lineTo(r * 0.72, -r * 0.44);
        ctx.lineTo(r * 0.56, r * 0.46); ctx.lineTo(-r * 0.56, r * 0.46);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        // Beveled Cobalt & Brass Armor Plating + Rotating Electro-Core Dynamo Window
        ctx.fillStyle = fl ? '#ffffff' : '#1e3a5f'; ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.roundRect(-r * 0.54, -r * 0.38, r * 1.08, r * 0.76, 8); ctx.fill(); ctx.stroke();

        ctx.save();
        ctx.translate(0, r * 0.02);
        ctx.fillStyle = '#020617'; ctx.strokeStyle = '#d97706'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.rotate(t * 2.8);
        ctx.strokeStyle = b.isEnraged ? '#fef08a' : '#00f5ff'; ctx.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r * 0.28, Math.sin(a) * r * 0.28); ctx.stroke();
        }
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, r * 0.11, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // 3. Twin Shoulder Tesla Capacitor Coils + Bridging Corona Arc
        for (const side of [-1, 1]) {
            ctx.save();
            ctx.translate(side * r * 0.74, -r * 0.36);
            ctx.rotate(side * 0.26);
            ctx.fillStyle = '#78350f'; ctx.strokeStyle = '#09090b'; ctx.lineWidth = 2.6;
            ctx.fillRect(-9, -28, 18, 28); ctx.strokeRect(-9, -28, 18, 28);
            ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.2;
            for (const cy of [-22, -14, -6]) { ctx.beginPath(); ctx.moveTo(-10, cy); ctx.lineTo(10, cy); ctx.stroke(); }
            ctx.fillStyle = '#00f5ff'; ctx.strokeStyle = '#09090b';
            ctx.beginPath(); ctx.arc(0, -32, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.restore();
        }
        if (Math.sin(t * 11) > 0.1) {
            ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 2.2;
            ctx.beginPath(); ctx.moveTo(-r * 0.85, -r * 0.82);
            ctx.lineTo(-r * 0.25, -r * 1.05 + Math.sin(t * 19) * 8);
            ctx.lineTo(r * 0.28, -r * 0.94 - Math.cos(t * 17) * 8);
            ctx.lineTo(r * 0.85, -r * 0.82); ctx.stroke();
        }

        // 4. Welded Automaton Helm with Cyan Slotted Optic & Dual Antenna Horns
        ctx.fillStyle = fl ? '#ffffff' : '#1e293b'; ctx.strokeStyle = '#09090b'; ctx.lineWidth = 3.2;
        ctx.beginPath(); ctx.roundRect(-r * 0.38, -r * 0.92, r * 0.76, r * 0.56, 9); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#020617'; ctx.fillRect(-r * 0.28, -r * 0.70, r * 0.56, r * 0.16);
        ctx.fillStyle = b.isEnraged ? '#fef08a' : '#00f5ff';
        ctx.fillRect(-r * 0.22, -r * 0.66, r * 0.44, r * 0.08);
        ctx.fillStyle = '#d97706';
        for (const s of [-1, 1]) {
            ctx.beginPath(); ctx.moveTo(s * r * 0.24, -r * 0.90); ctx.lineTo(s * r * 0.48, -r * 1.18); ctx.lineTo(s * r * 0.12, -r * 0.90); ctx.closePath(); ctx.fill(); ctx.stroke();
        }

        // 5. Aimed Horseshoe Magnet Rail-Tongs + Crackling Plasma Orb
        EndlessBossRenderer.drawAimedLayer(ctx, ang, 0, 0, () => {
            ctx.fillStyle = '#b45309'; ctx.strokeStyle = '#09090b'; ctx.lineWidth = 2.8;
            ctx.fillRect(r * 0.28, -r * 0.26, r * 0.55, r * 0.14); ctx.strokeRect(r * 0.28, -r * 0.26, r * 0.55, r * 0.14);
            ctx.fillRect(r * 0.28, r * 0.12, r * 0.55, r * 0.14); ctx.strokeRect(r * 0.28, r * 0.12, r * 0.55, r * 0.14);
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(r * 0.75, -r * 0.26, r * 0.24, r * 0.14); ctx.strokeRect(r * 0.75, -r * 0.26, r * 0.24, r * 0.14);
            ctx.fillStyle = '#ffa502';
            ctx.fillRect(r * 0.75, r * 0.12, r * 0.24, r * 0.14); ctx.strokeRect(r * 0.75, r * 0.12, r * 0.24, r * 0.14);
            ctx.fillStyle = '#e0f2fe'; ctx.strokeStyle = '#00f5ff'; ctx.lineWidth = 2.4;
            ctx.beginPath(); ctx.arc(r * 0.94, 0, 10 + Math.sin(t * 7) * 2.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        });
        ctx.restore();
        EndlessBossRenderer.drawBossHUD(ctx, b);
    }

    static _drawPolarPylons(ctx, b) {
        if (!Array.isArray(b._polarPylons) || b._polarPylons.length === 0) return;
        for (const pair of b._polarPylons) {
            const [pA, pB] = pair.stakes;
            const armed = pair.warnTimer <= 0;
            ctx.save();
            // Connecting Magnetic Arc Fence Beam
            if (!armed) {
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.72)'; ctx.lineWidth = 5; ctx.setLineDash([12, 10]);
                ctx.beginPath(); ctx.moveTo(pA.x, pA.y); ctx.lineTo(pB.x, pB.y); ctx.stroke();
                ctx.setLineDash([]);
            } else {
                ctx.strokeStyle = 'rgba(0, 245, 255, 0.42)'; ctx.lineWidth = 26;
                ctx.beginPath(); ctx.moveTo(pA.x, pA.y); ctx.lineTo(pB.x, pB.y); ctx.stroke();
                ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 7;
                ctx.beginPath(); ctx.moveTo(pA.x, pA.y);
                for (let k = 1; k <= 4; k++) {
                    const u = k / 5;
                    const j = Math.sin((b.age || 0) * 0.8 + k * 2.1) * 9;
                    const ang = Math.atan2(pB.y - pA.y, pB.x - pA.x) + Math.PI / 2;
                    ctx.lineTo(pA.x + (pB.x - pA.x) * u + Math.cos(ang) * j, pA.y + (pB.y - pA.y) * u + Math.sin(ang) * j);
                }
                ctx.lineTo(pB.x, pB.y); ctx.stroke();
            }
            for (const [st, col, lbl] of [[pA, '#00f5ff', 'N+'], [pB, '#ffa502', 'S-']]) {
                ctx.fillStyle = '#0f172a'; ctx.strokeStyle = col; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.ellipse(st.x, st.y + 8, 18, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                ctx.fillRect(st.x - 7, st.y - 24, 14, 30); ctx.strokeRect(st.x - 7, st.y - 24, 14, 30);
                ctx.fillStyle = col;
                ctx.beginPath(); ctx.arc(st.x, st.y - 28, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                ctx.fillStyle = '#ffffff'; ctx.font = '900 10px sans-serif'; ctx.textAlign = 'center';
                ctx.fillText(lbl, st.x, st.y - 40);
            }
            ctx.restore();
        }
    }

    static drawAbyssalLeviathan(ctx, b) {
        this._drawAbyssalHazards(ctx, b);
        EndlessBossRenderer.drawTelegraphs(ctx, b.telegraphs);
        if (typeof EndlessBossRenderer === 'undefined') return;
        const r = b.radius, fl = b.hitFlash > 0, ang = b.angle || 0, t = (b.age || 0) * 0.06;

        // If submerged during Burrowing Trench Surge, draw swirling whirlpool ambush wake instead of solid body
        if (b.submergeTimer > 0) {
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.scale(1, 0.62);
            ctx.fillStyle = 'rgba(0, 210, 211, 0.25)';
            ctx.beginPath(); ctx.arc(0, 0, r * 1.45, 0, Math.PI * 2); ctx.fill();
            ctx.rotate(t * 2.8);
            ctx.strokeStyle = '#00f5ff'; ctx.lineWidth = 4; ctx.setLineDash([18, 12]);
            ctx.beginPath(); ctx.arc(0, 0, r * 1.25, 0, Math.PI * 2); ctx.stroke();
            ctx.rotate(-t * 4.5);
            ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2); ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
            EndlessBossRenderer.drawBossHUD(ctx, b);
            return;
        }

        ctx.save();
        EndlessBossRenderer.drawShadow(ctx, b.x, b.y, r * 1.18, b.isEnraged);
        ctx.translate(b.x, b.y + Math.sin(t * 2.2) * 3);

        // 1. Swirling Abyssal Whirlpool Base Ring
        ctx.save();
        ctx.scale(1, 0.56);
        ctx.strokeStyle = b.isEnraged ? 'rgba(255, 107, 107, 0.72)' : 'rgba(0, 210, 211, 0.58)';
        ctx.lineWidth = 3; ctx.setLineDash([20, 12]);
        ctx.beginPath(); ctx.arc(0, 28, r * 1.62, -t, -t + Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // 2. Six Animated Kraken Tentacles with Bioluminescent Coral Suckers
        for (let i = 0; i < 6; i++) {
            const side = i < 3 ? -1 : 1;
            const idx = i % 3;
            const wave = Math.sin(t * 2.4 + idx * 1.6 + side) * 14;
            const bx = side * (r * 0.42), by = -r * 0.1 + idx * 13;
            const ex = side * (r * 1.52 - idx * 8), ey = r * 0.32 + idx * 14 + wave;
            ctx.strokeStyle = '#09090b'; ctx.lineWidth = 14; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(side * r * 1.05, by - 24 + wave * 0.5, ex, ey); ctx.stroke();
            ctx.strokeStyle = fl ? '#ffffff' : '#134e4a'; ctx.lineWidth = 8.5; ctx.stroke();
            ctx.fillStyle = '#ff6b6b';
            ctx.beginPath(); ctx.arc(ex, ey, 4.5, 0, Math.PI * 2); ctx.fill();
        }

        // 3. Chitinous Abyssal Carapace + Coral Dorsal Spikes + Trench Heart Core
        for (const side of [-1, 1]) {
            ctx.fillStyle = '#be123c'; ctx.strokeStyle = '#09090b'; ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.moveTo(side * r * 0.50, -r * 0.38); ctx.lineTo(side * r * 0.92, -r * 0.62); ctx.lineTo(side * r * 0.64, -r * 0.14);
            ctx.closePath(); ctx.fill(); ctx.stroke();
        }
        ctx.fillStyle = fl ? '#ffffff' : '#0f172a'; ctx.strokeStyle = '#00d2d3'; ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.68); ctx.lineTo(r * 0.68, -r * 0.25);
        ctx.lineTo(r * 0.54, r * 0.54); ctx.lineTo(0, r * 0.70);
        ctx.lineTo(-r * 0.54, r * 0.54); ctx.lineTo(-r * 0.68, -r * 0.25);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        // Glowing Heart of the Trench Core + Rib Seams
        ctx.strokeStyle = 'rgba(0, 245, 255, 0.55)'; ctx.lineWidth = 2;
        for (const ry of [-r * 0.18, r * 0.24]) {
            ctx.beginPath(); ctx.moveTo(-r * 0.44, ry); ctx.quadraticCurveTo(0, ry + 8, r * 0.44, ry); ctx.stroke();
        }
        ctx.fillStyle = '#ff4757'; ctx.strokeStyle = '#00f5ff'; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.arc(0, r * 0.04, r * 0.24, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath(); ctx.arc(0, r * 0.04, r * 0.10, 0, Math.PI * 2); ctx.fill();

        // 4. Horned Leviathan Skull + 4 Glowing Eyes + Mandible Fangs + Angler-Lantern Crown Stalk
        ctx.fillStyle = fl ? '#ffffff' : '#115e59'; ctx.strokeStyle = '#09090b'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.04); ctx.lineTo(r * 0.46, -r * 0.72);
        ctx.lineTo(r * 0.34, -r * 0.34); ctx.lineTo(-r * 0.34, -r * 0.34); ctx.lineTo(-r * 0.46, -r * 0.72);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#fef08a';
        for (const fx of [-r * 0.20, r * 0.20]) {
            ctx.beginPath(); ctx.moveTo(fx - 3, -r * 0.36); ctx.lineTo(fx, -r * 0.20); ctx.lineTo(fx + 3, -r * 0.36); ctx.closePath(); ctx.fill();
        }

        ctx.fillStyle = b.isEnraged ? '#fef08a' : '#ff6b6b';
        for (const ex of [-r * 0.18, r * 0.18]) {
            ctx.beginPath(); ctx.arc(ex, -r * 0.68, 4.2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(ex * 0.68, -r * 0.54, 3, 0, Math.PI * 2); ctx.fill();
        }
        // Overhead glowing Angler Lure
        const lureX = Math.sin(t * 2.5) * 8, lureY = -r * 1.42;
        ctx.strokeStyle = '#00f5ff'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, -r * 0.98); ctx.quadraticCurveTo(lureX * 0.5, -r * 1.32, lureX, lureY); ctx.stroke();
        ctx.fillStyle = '#fef08a'; ctx.strokeStyle = '#00d2d3'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(lureX, lureY, 8 + Math.sin(t * 6) * 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // 5. Aimed Dual Abyssal Trident Harpoons
        EndlessBossRenderer.drawAimedLayer(ctx, ang, 0, 0, () => {
            ctx.strokeStyle = '#09090b'; ctx.lineWidth = 2.6;
            for (const oy of [-16, 16]) {
                ctx.fillStyle = '#0f172a'; ctx.fillRect(10, oy - 4, r * 0.88, 8); ctx.strokeRect(10, oy - 4, r * 0.88, 8);
                ctx.fillStyle = '#00f5ff';
                ctx.beginPath(); ctx.moveTo(r * 0.88, oy - 9); ctx.lineTo(r * 1.32, oy); ctx.lineTo(r * 0.88, oy + 9); ctx.closePath(); ctx.fill(); ctx.stroke();
            }
        });
        ctx.restore();
        EndlessBossRenderer.drawBossHUD(ctx, b);
    }

    static _drawAbyssalHazards(ctx, b) {
        // Tentacle Crush Lanes (warn rectangles -> slamming coral tentacles)
        if (Array.isArray(b._tentacleLanes)) {
            for (const ln of b._tentacleLanes) {
                const isSlam = ln.warnTimer <= 0;
                ctx.save();
                ctx.translate(ln.ax, ln.ay);
                ctx.rotate(ln.ang);
                ctx.fillStyle = isSlam ? 'rgba(0, 245, 255, 0.58)' : 'rgba(0, 210, 211, 0.18)';
                ctx.strokeStyle = isSlam ? '#fef08a' : '#ff6b6b';
                ctx.lineWidth = 2.6;
                if (!isSlam) ctx.setLineDash([12, 8]);
                ctx.fillRect(0, -ln.hw, ln.len, ln.hw * 2);
                ctx.strokeRect(0, -ln.hw, ln.len, ln.hw * 2);
                ctx.setLineDash([]);
                if (isSlam) {
                    ctx.fillStyle = '#115e59'; ctx.strokeStyle = '#09090b';
                    ctx.fillRect(0, -ln.hw * 0.55, ln.len, ln.hw * 1.1);
                    ctx.strokeRect(0, -ln.hw * 0.55, ln.len, ln.hw * 1.1);
                }
                ctx.restore();
            }
        }
        // Splitting Depth-Charge Coral Mines
        if (Array.isArray(b._depthCharges)) {
            for (const dc of b._depthCharges) {
                const p = 1 - Math.max(0, dc.timer / dc.maxTimer);
                ctx.save();
                ctx.translate(dc.x, dc.y);
                ctx.fillStyle = p > 0.72 ? 'rgba(255, 71, 87, 0.35)' : 'rgba(0, 210, 211, 0.22)';
                ctx.beginPath(); ctx.arc(0, 0, dc.blastRadius, 0, Math.PI * 2); ctx.fill();
                ctx.rotate((b.age || 0) * 0.08);
                ctx.fillStyle = p > 0.72 && Math.floor((b.age || 0) / 3) % 2 === 0 ? '#ffffff' : '#ff4757';
                ctx.strokeStyle = '#00f5ff'; ctx.lineWidth = 2.4;
                ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                ctx.fillStyle = '#fef08a';
                for (let k = 0; k < 6; k++) {
                    const a = (k / 6) * Math.PI * 2;
                    ctx.fillRect(Math.cos(a) * 14 - 3, Math.sin(a) * 14 - 3, 6, 6);
                }
                ctx.restore();
            }
        }
    }
}

if (typeof window !== 'undefined') window.HardW45_55MiniRenderers = HardW45_55MiniRenderers;
if (typeof module !== 'undefined' && module.exports) module.exports = { HardW45_55MiniRenderers };
