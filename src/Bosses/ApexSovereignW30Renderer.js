/**
 * Lesa.io - W30 Apex Boss ("Aethelgard, Sovereign of Ruin") High-Detail 2.5D Renderer
 * Features 6-point Runic Circle, Triple Astrolabe Crown Halos, Flowing Gold-Trimmed Cape,
 * 6 Dragon-Plate Wings, Riveted Vent Pauldrons, Singularity Reactor Heart, Dread Crown Helm,
 * Twin-Edge Cataclysm Halberd, Orbiting Graviton Rift Sphere & Faceted Rune Pylons.
 */

class ApexSovereignW30Renderer {
    static draw(ctx, b) {
        EndlessBossRenderer.drawTelegraphs(ctx, b.telegraphs);
        this._drawStarBeams(ctx, b);
        if (typeof EndlessBossRenderer === 'undefined') return;
        const r = b.radius, fl = b.hitFlash > 0, ang = b.angle || 0, t = (b.age || 0) * 0.05;
        const ph = b.phase || 1;
        const dropY = b.entranceDropY || 0;

        ctx.save();
        EndlessBossRenderer.drawShadow(ctx, b.x, b.y, r * 1.18, ph >= 2, true);
        if (typeof HardBossEntranceFX !== 'undefined' && HardBossEntranceFX.drawApexEntranceFX) {
            HardBossEntranceFX.drawApexEntranceFX(ctx, b);
        }

        if (b.dashWindup > 0) {
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(b.dashAngle || ang);
            ctx.fillStyle = 'rgba(255, 46, 76, 0.22)';
            ctx.strokeStyle = '#fed330'; ctx.lineWidth = 3; ctx.setLineDash([16, 8]);
            ctx.fillRect(0, -30, 420, 60); ctx.strokeRect(0, -30, 420, 60);
            ctx.restore();
        }

        ctx.translate(b.x, b.y - dropY);

        // 1. Anchored 6-point Runic Magic Circle + radial glyphs
        ctx.save();
        ctx.rotate(t * (ph >= 3 ? 0.95 : 0.48));
        ctx.strokeStyle = ph >= 3 ? 'rgba(254, 211, 48, 0.78)' : 'rgba(255, 46, 76, 0.56)';
        ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.arc(0, 0, r * 1.56, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            const px = Math.cos(a) * r * 1.50, py = Math.sin(a) * r * 1.50;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.stroke();
        ctx.restore();

        // 2. Triple Counter-Rotating Celestial Astrolabe Halos
        ctx.save();
        ctx.translate(0, -r * 0.48);
        ctx.rotate(-t * 0.65);
        ctx.strokeStyle = '#fed330'; ctx.lineWidth = 4; ctx.setLineDash([22, 10]);
        ctx.beginPath(); ctx.arc(0, 0, r * (ph >= 2 ? 1.24 : 1.04), 0, Math.PI * 2); ctx.stroke();
        ctx.rotate(t * 1.35);
        ctx.strokeStyle = '#ff2e4c'; ctx.lineWidth = 2.8; ctx.setLineDash([10, 8]);
        ctx.beginPath(); ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2;
            ctx.fillStyle = '#fef08a';
            ctx.beginPath(); ctx.arc(Math.cos(a) * r * 1.04, Math.sin(a) * r * 1.04, 4.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();

        // 3. Flowing Layered Sovereign Cloak with Gold Trim
        const cloakWave = Math.sin(t * 3.2) * 5;
        ctx.fillStyle = fl ? '#ffffff' : '#450a0a';
        ctx.strokeStyle = '#fed330'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-r * 0.62, -r * 0.34);
        ctx.lineTo(-r * 0.94, r * 0.72 + cloakWave);
        ctx.lineTo(-r * 0.34, r * 0.88);
        ctx.lineTo(0, r * 0.74 + cloakWave * 0.6);
        ctx.lineTo(r * 0.34, r * 0.88);
        ctx.lineTo(r * 0.94, r * 0.72 - cloakWave);
        ctx.lineTo(r * 0.62, -r * 0.34);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        // 4. Articulated Dragon-Plate Pauldron Wings (3 blades per side + energy ribs)
        const wingFlap = Math.sin(t * 2.1) * 0.08;
        for (const side of [-1, 1]) {
            ctx.save();
            ctx.scale(side, 1);
            ctx.rotate(wingFlap);
            for (let f = 0; f < 3; f++) {
                ctx.save();
                ctx.translate(r * 0.36, -r * (0.30 - f * 0.14));
                ctx.rotate(-0.62 + f * 0.34);
                ctx.fillStyle = fl ? '#ffffff' : (f === 0 ? '#18181b' : '#7f1d1d');
                ctx.strokeStyle = '#fed330'; ctx.lineWidth = 2.8;
                ctx.beginPath();
                ctx.moveTo(0, -8); ctx.lineTo(r * (1.30 - f * 0.14), -14);
                ctx.lineTo(r * (1.48 - f * 0.14), 0); ctx.lineTo(r * (1.12 - f * 0.14), 11); ctx.lineTo(0, 8);
                ctx.closePath(); ctx.fill(); ctx.stroke();
                ctx.fillStyle = ph >= 3 ? '#fef08a' : '#ff2e4c';
                ctx.fillRect(r * 0.22, -2.5, r * 0.78, 5);
                ctx.restore();
            }
            ctx.restore();
        }

        // 5. Lower Armored Greaves & Multi-Plate Cuirass
        EndlessBossRenderer.drawLegs(ctx, r, (b.age || 0) * 0.14, '#09090b', '#7f1d1d', fl);
        ctx.fillStyle = fl ? '#ffffff' : '#18181b';
        ctx.strokeStyle = '#09090b'; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-r * 0.62, -r * 0.45); ctx.lineTo(r * 0.62, -r * 0.45);
        ctx.lineTo(r * 0.78, r * 0.42); ctx.lineTo(0, r * 0.60); ctx.lineTo(-r * 0.78, r * 0.42);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        // Spiked Pauldron Reactors on Both Shoulders + Rivets
        for (const side of [-1, 1]) {
            ctx.fillStyle = fl ? '#ffffff' : '#27272a'; ctx.strokeStyle = '#fed330'; ctx.lineWidth = 2.8;
            ctx.beginPath(); ctx.roundRect(side * r * 0.48 - 14, -r * 0.54, 28, 26, 7); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#ff2e4c';
            ctx.beginPath(); ctx.arc(side * r * 0.48, -r * 0.41, 6, 0, Math.PI * 2); ctx.fill();
        }

        // Ribbed Gold Chest Frame + Double-Ringed Singularity Reactor Heart
        ctx.strokeStyle = '#fed330'; ctx.lineWidth = 3;
        ctx.strokeRect(-r * 0.42, -r * 0.34, r * 0.84, r * 0.58);
        const coreR = r * 0.25 + Math.sin(t * 4) * 2.5;
        ctx.fillStyle = fl ? '#ffffff' : '#ff2e4c';
        ctx.beginPath(); ctx.arc(0, -r * 0.05, coreR, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fed330'; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath(); ctx.arc(0, -r * 0.05, coreR * 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(0, -r * 0.05, coreR * 0.24, 0, Math.PI * 2); ctx.fill();

        // 6. Sculpted Sovereign Dread Helm + Jagged Gold Crown + Tri-Optic Visor
        ctx.fillStyle = fl ? '#ffffff' : '#111827';
        ctx.strokeStyle = '#09090b'; ctx.lineWidth = 3.8;
        ctx.beginPath();
        ctx.moveTo(-r * 0.34, -r * 0.88); ctx.lineTo(r * 0.34, -r * 0.88);
        ctx.lineTo(r * 0.28, -r * 0.40); ctx.lineTo(0, -r * 0.34); ctx.lineTo(-r * 0.28, -r * 0.40);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fed330'; ctx.strokeStyle = '#09090b'; ctx.lineWidth = 2.6;
        for (const [hx, topY, w] of [[-r * 0.25, -r * 1.26, 10], [0, -r * 1.40, 12], [r * 0.25, -r * 1.26, 10]]) {
            ctx.beginPath(); ctx.moveTo(hx - w * 0.5, -r * 0.86); ctx.lineTo(hx, topY); ctx.lineTo(hx + w * 0.5, -r * 0.86); ctx.closePath();
            ctx.fill(); ctx.stroke();
        }
        ctx.fillStyle = '#ff2e4c';
        ctx.fillRect(-r * 0.21, -r * 0.72, 11, 5);
        ctx.fillRect(r * 0.21 - 11, -r * 0.72, 11, 5);
        ctx.fillStyle = '#fef08a';
        ctx.beginPath(); ctx.arc(0, -r * 0.80, 5, 0, Math.PI * 2); ctx.fill();

        // 7. Dual Weapons (Twin-Crescent Cataclysm Halberd & Orbital Graviton Sphere)
        EndlessBossRenderer.drawAimedLayer(ctx, ang, 0, 0, () => {
            ctx.strokeStyle = '#09090b'; ctx.lineWidth = 3;
            ctx.fillStyle = '#3f3f46';
            ctx.fillRect(-r * 0.14, r * 0.30, r * 1.62, 8); ctx.strokeRect(-r * 0.14, r * 0.30, r * 1.62, 8);
            ctx.fillStyle = fl ? '#ffffff' : '#ff2e4c'; ctx.strokeStyle = '#fed330';
            ctx.beginPath();
            ctx.moveTo(r * 0.96, r * 0.10); ctx.lineTo(r * 1.78, r * 0.34);
            ctx.lineTo(r * 1.08, r * 0.62); ctx.lineTo(r * 1.22, r * 0.34);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            // Graviton Sphere + mini electron ring
            ctx.save();
            ctx.translate(r * 0.84, -r * 0.42);
            ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 2.2;
            ctx.beginPath(); ctx.ellipse(0, 0, 20, 8, t * 2, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = '#a855f7'; ctx.strokeStyle = '#fed330'; ctx.lineWidth = 2.6;
            ctx.beginPath(); ctx.arc(0, 0, 13 + Math.sin(t * 5) * 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        });

        // 8. 6 Orbiting Faceted Rune Pylon Crystals + Energy Tethers
        const pylonSpin = t * (ph >= 2 ? 1.55 : 0.9);
        for (let i = 0; i < 6; i++) {
            const pa = pylonSpin + (i / 6) * Math.PI * 2;
            const px = Math.cos(pa) * (r * 1.36), py = Math.sin(pa) * (r * 0.96);
            if (ph >= 2) {
                ctx.strokeStyle = ph >= 3 ? 'rgba(254, 211, 48, 0.5)' : 'rgba(255, 46, 76, 0.38)';
                ctx.lineWidth = 1.8;
                ctx.beginPath(); ctx.moveTo(0, -r * 0.05); ctx.lineTo(px, py); ctx.stroke();
            }
            ctx.save();
            ctx.translate(px, py); ctx.rotate(pa + Math.PI / 2);
            ctx.fillStyle = ph >= 3 ? '#fed330' : '#ff2e4c';
            ctx.strokeStyle = '#09090b'; ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.moveTo(0, -13); ctx.lineTo(7, -3); ctx.lineTo(5, 11); ctx.lineTo(0, 14); ctx.lineTo(-5, 11); ctx.lineTo(-7, -3);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#ffffff'; ctx.fillRect(-2, -6, 4, 10);
            ctx.restore();
        }
        if (b.shieldActive) this._drawAegisShieldDome(ctx, b, r, t);
        ctx.restore();
        EndlessBossRenderer.drawBossHUD(ctx, b);
    }

    static _drawAegisShieldDome(ctx, b, r, t) {
        const flash = Math.min(1, (b.shieldFlash || 0) / 10);
        const pulse = 0.5 + 0.5 * Math.sin(t * 4.5);
        const domeR = r * 1.68 + Math.sin(t * 3.8) * 2.2;
        const cy = -r * 0.06;

        ctx.save();
        ctx.translate(0, cy);

        // 1. Volumetric crimson-gold translucent Aegis barrier aura
        const grad = ctx.createRadialGradient(0, -domeR * 0.2, domeR * 0.15, 0, 0, domeR);
        grad.addColorStop(0, `rgba(255, 46, 76, ${0.04 + flash * 0.14})`);
        grad.addColorStop(0.68, `rgba(255, 46, 76, ${0.14 + pulse * 0.06 + flash * 0.18})`);
        grad.addColorStop(0.92, `rgba(254, 211, 48, ${0.34 + pulse * 0.12 + flash * 0.25})`);
        grad.addColorStop(1, `rgba(254, 240, 138, ${0.65 + flash * 0.28})`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, domeR, 0, Math.PI * 2);
        ctx.fill();

        // 2. Clipped internal hexagonal honeycomb forcefield lattice
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, domeR * 0.97, 0, Math.PI * 2);
        ctx.clip();
        const hexR = 22;
        const dx = hexR * 1.5, dy = hexR * Math.sqrt(3);
        const driftX = (t * 14) % dx, driftY = (t * 9) % dy;
        ctx.strokeStyle = flash > 0.2
            ? `rgba(254, 240, 138, ${0.32 + flash * 0.35})`
            : `rgba(254, 211, 48, ${0.16 + pulse * 0.08})`;
        ctx.lineWidth = 1.4;
        for (let gx = -domeR - dx; gx <= domeR + dx; gx += dx) {
            const colIdx = Math.round(gx / dx);
            const yOff = (Math.abs(colIdx) % 2) * (dy * 0.5);
            for (let gy = -domeR - dy; gy <= domeR + dy; gy += dy) {
                const hx = gx + driftX, hy = gy + yOff + driftY;
                ctx.beginPath();
                for (let k = 0; k < 6; k++) {
                    const a = (k / 6) * Math.PI * 2;
                    const vx = hx + Math.cos(a) * (hexR * 0.72), vy = hy + Math.sin(a) * (hexR * 0.72);
                    if (k === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
                }
                ctx.closePath();
                ctx.stroke();
            }
        }
        ctx.restore();

        // 3. Outer rotating segmented shield bezel + 6 node locks
        ctx.save();
        ctx.rotate(t * 0.55);
        ctx.strokeStyle = flash > 0.15 ? '#ffffff' : '#fed330';
        ctx.lineWidth = 3.2;
        ctx.setLineDash([24, 12]);
        ctx.beginPath();
        ctx.arc(0, 0, domeR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        for (let i = 0; i < 6; i++) {
            const na = (i / 6) * Math.PI * 2;
            const nx = Math.cos(na) * domeR, ny = Math.sin(na) * domeR;
            ctx.save();
            ctx.translate(nx, ny);
            ctx.rotate(na + Math.PI * 0.25);
            ctx.fillStyle = '#ff2e4c';
            ctx.strokeStyle = '#fed330';
            ctx.lineWidth = 2;
            ctx.fillRect(-5, -5, 10, 10);
            ctx.strokeRect(-5, -5, 10, 10);
            ctx.restore();
        }
        ctx.restore();

        // 4. Inner specular rim crescent + crisp IMMUNE crest above dome
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.42 + flash * 0.36})`;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, 0, domeR * 0.88, -Math.PI * 0.82, -Math.PI * 0.42);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.font = '900 12px "Luckiest Guy", cursive, sans-serif';
        ctx.lineWidth = 3.4;
        ctx.strokeStyle = '#07090f';
        ctx.strokeText('🛡️ IMMUNE', 0, -domeR - 10);
        ctx.fillStyle = flash > 0.2 ? '#ffffff' : '#fef08a';
        ctx.fillText('🛡️ IMMUNE', 0, -domeR - 10);
        ctx.restore();
    }

    static _drawStarBeams(ctx, b) {
        if (!Array.isArray(b._starBeams) || b._starBeams.length === 0) return;
        for (const sb of b._starBeams) {
            const isWarn = sb.warnTimer > 0;
            const endX = b.x + Math.cos(sb.ang) * 760, endY = b.y + Math.sin(sb.ang) * 760;
            ctx.save();
            if (isWarn) {
                ctx.strokeStyle = 'rgba(254, 211, 48, 0.85)'; ctx.lineWidth = 6; ctx.setLineDash([16, 12]);
                ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(endX, endY); ctx.stroke();
            } else {
                ctx.strokeStyle = 'rgba(255, 46, 76, 0.55)'; ctx.lineWidth = 34;
                ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(endX, endY); ctx.stroke();
                ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 12;
                ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(endX, endY); ctx.stroke();
            }
            ctx.restore();
        }
    }
}

if (typeof window !== 'undefined') window.ApexSovereignW30Renderer = ApexSovereignW30Renderer;
if (typeof module !== 'undefined' && module.exports) module.exports = { ApexSovereignW30Renderer };
