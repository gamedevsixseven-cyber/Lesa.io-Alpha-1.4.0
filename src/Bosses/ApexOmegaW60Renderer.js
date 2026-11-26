/**
 * Lesa.io - W60 Final Apex Boss ("Erebus, Sovereign of the End") Advanced 2.5D Renderer
 * Features:
 *   - Hidden during OMEN_STORM & MAP_FRACTURE (only Singularity Rift shows)
 *   - Chromatic Sovereign Aura flames & celestial shock rings during AURA_RISE & combat
 *   - Triple Astrolabe Eclipse Halo + 6 curved Seraphic-Abyssal Bezier Wings
 *   - Sculpted Sovereign Mantle, Obsidian Armor & Singularity Reactor Core
 *   - Horned Eclipse Crown, Omega Scythe-Halberd & Orbiting Singularity Grimoire Sphere
 *   - Cross-Arena Omega Space-Tear Slicers, Collapsing Ring & Star Beams
 */

class ApexOmegaW60Renderer {
    static draw(ctx, b) {
        const t = (b.age || b.entranceAge || 0) * 0.055;
        if (b.hideBossModel && typeof ApexW60Cutscene !== 'undefined') {
            ApexW60Cutscene.drawRiftEpicenter(ctx, b, t);
            return;
        }

        EndlessBossRenderer.drawTelegraphs(ctx, b.telegraphs);
        this._drawOmegaHazards(ctx, b, t);
        if (typeof EndlessBossRenderer === 'undefined') return;

        const r = b.radius, fl = b.hitFlash > 0, ang = b.angle || 0, ph = b.phase || 1;
        const dropY = b.entranceDropY || 0;
        const isDef = !!b.isDefeated;
        const fade = isDef ? Math.max(0, Math.min(1, b._defeatFade ?? 1)) : 1;
        const auraScale = b.cutsceneState !== 'COMBAT' ? Math.max(0.08, b.auraScale || 0.4) : (ph >= 4 ? 1.25 : 1.0);

        ctx.save();
        EndlessBossRenderer.drawShadow(ctx, b.x, b.y, r * 1.24 * (0.45 + 0.55 * fade), true, true);
        if (fade < 1) ctx.globalAlpha = fade;
        ctx.translate(b.x, b.y - dropY + (isDef ? 10 : Math.sin(t * 2) * 3));

        // 1. Blazing Chromatic Sovereign Aura Field (Rising plasma tongues & expanding halo)
        this._drawSovereignAura(ctx, r, t, ph, auraScale);

        // 2. Triple Counter-Rotating Celestial Eclipse Astrolabe Rings
        ctx.save();
        ctx.translate(0, -r * 0.42);
        ctx.rotate(t * 0.45);
        ctx.strokeStyle = '#fed330'; ctx.lineWidth = 4.2; ctx.setLineDash([28, 12]);
        ctx.beginPath(); ctx.arc(0, 0, r * 1.38, 0, Math.PI * 2); ctx.stroke();
        ctx.rotate(-t * 1.2);
        ctx.strokeStyle = ph >= 4 ? '#fef08a' : '#ff2e4c'; ctx.lineWidth = 3; ctx.setLineDash([16, 10]);
        ctx.beginPath(); ctx.arc(0, 0, r * 1.10, 0, Math.PI * 2); ctx.stroke();
        ctx.rotate(t * 1.8);
        ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 2.4; ctx.setLineDash([]);
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            ctx.fillStyle = '#fed330';
            ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 1.48, Math.sin(a) * r * 1.48);
            ctx.lineTo(Math.cos(a + 0.08) * r * 1.32, Math.sin(a + 0.08) * r * 1.32);
            ctx.lineTo(Math.cos(a - 0.08) * r * 1.32, Math.sin(a - 0.08) * r * 1.32);
            ctx.closePath(); ctx.fill();
        }
        ctx.restore();

        // 3. Six Curved Spectral Seraph-Abyssal Bezier Wings
        this._drawLayeredWings(ctx, r, t, ph, fl, isDef);

        // 4. Flowing Multi-Fold Sovereign Void Mantle Cloak
        const cw = Math.sin(t * 3.1) * 7;
        const cloakGrad = ctx.createLinearGradient(0, -r * 0.35, 0, r * 1.05);
        cloakGrad.addColorStop(0, '#090414'); cloakGrad.addColorStop(0.65, '#450a0a'); cloakGrad.addColorStop(1, '#7e22ce');
        ctx.fillStyle = fl ? '#ffffff' : cloakGrad;
        ctx.strokeStyle = '#fed330'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-r * 0.66, -r * 0.36);
        ctx.quadraticCurveTo(-r * 1.02, r * 0.25, -r * 0.96, r * 0.94 + cw);
        ctx.lineTo(-r * 0.36, r * 1.08);
        ctx.lineTo(0, r * 0.90 + cw * 0.6);
        ctx.lineTo(r * 0.36, r * 1.08);
        ctx.lineTo(r * 0.96, r * 0.94 - cw);
        ctx.quadraticCurveTo(r * 1.02, r * 0.25, r * 0.66, -r * 0.36);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        // 5. Obsidian Sovereign Torso, Floating Shoulder Shields & Black-Hole Solar Core
        ctx.fillStyle = fl ? '#ffffff' : '#09090b'; ctx.strokeStyle = '#fed330'; ctx.lineWidth = 3.6;
        ctx.beginPath();
        ctx.moveTo(-r * 0.56, -r * 0.44); ctx.lineTo(0, -r * 0.58); ctx.lineTo(r * 0.56, -r * 0.44);
        ctx.lineTo(r * 0.42, r * 0.48); ctx.lineTo(0, r * 0.66); ctx.lineTo(-r * 0.42, r * 0.48);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        // Levitating Spiked Pauldrons
        for (const side of [-1, 1]) {
            ctx.save();
            ctx.translate(side * r * 0.68, -r * 0.30 + Math.sin(t * 2.5 + side) * 3);
            ctx.rotate(side * 0.28);
            ctx.fillStyle = fl ? '#ffffff' : '#18181b'; ctx.strokeStyle = '#ff2e4c'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(-16, -12); ctx.lineTo(22, -24); ctx.lineTo(18, 12); ctx.lineTo(-14, 16); ctx.closePath();
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#fed330';
            ctx.beginPath(); ctx.arc(4, -3, 5, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }

        // Black-Hole Eclipse Reactor Heart
        ctx.fillStyle = '#030108'; ctx.strokeStyle = '#fed330'; ctx.lineWidth = 3.2;
        ctx.beginPath(); ctx.arc(0, -r * 0.04, r * 0.27, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#ff2e4c'; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.ellipse(0, -r * 0.04, r * 0.39, r * 0.13, t * 2.4, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = ph >= 4 ? '#fef08a' : '#ff2e4c';
        ctx.beginPath(); ctx.arc(0, -r * 0.04, r * 0.13 + Math.sin(t * 6) * 2.2, 0, Math.PI * 2); ctx.fill();

        // 6. Sovereign Omega Crowned Helm & Trident Eclipse Halo
        ctx.fillStyle = fl ? '#ffffff' : '#111827'; ctx.strokeStyle = '#fed330'; ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.12); ctx.lineTo(r * 0.38, -r * 0.80);
        ctx.lineTo(r * 0.28, -r * 0.42); ctx.lineTo(-r * 0.28, -r * 0.42); ctx.lineTo(-r * 0.38, -r * 0.80);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        // Curved Dread Horns + Trident Crest
        ctx.fillStyle = '#ff2e4c'; ctx.strokeStyle = '#07090f'; ctx.lineWidth = 2.6;
        for (const s of [-1, 1]) {
            ctx.beginPath(); ctx.moveTo(s * r * 0.26, -r * 0.88); ctx.quadraticCurveTo(s * r * 0.62, -r * 1.18, s * r * 0.42, -r * 1.38); ctx.lineTo(s * r * 0.18, -r * 0.96); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
        ctx.fillStyle = '#fed330';
        ctx.beginPath(); ctx.moveTo(-7, -r * 1.06); ctx.lineTo(0, -r * 1.48); ctx.lineTo(7, -r * 1.06); ctx.closePath(); ctx.fill(); ctx.stroke();
        // Twin Blazing Optic Slits (dim & flicker to embers when defeated)
        ctx.fillStyle = isDef ? (Math.sin(t * 18) > 0 ? 'rgba(255, 71, 87, 0.55)' : '#27272a') : (ph >= 4 ? '#ffffff' : '#fef08a');
        ctx.fillRect(-r * 0.22, -r * 0.72, r * 0.16, 5); ctx.fillRect(r * 0.06, -r * 0.72, r * 0.16, 5);

        // Glowing golden-white armor fracture cracks spreading across obsidian chestplate on defeat
        if (isDef) {
            ctx.save();
            ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.moveTo(-r * 0.34, -r * 0.34); ctx.lineTo(-r * 0.10, -r * 0.08); ctx.lineTo(-r * 0.24, r * 0.26);
            ctx.moveTo(r * 0.32, -r * 0.22); ctx.lineTo(r * 0.08, r * 0.06); ctx.lineTo(r * 0.22, r * 0.38);
            ctx.moveTo(-r * 0.12, -r * 0.92); ctx.lineTo(0, -r * 0.56);
            ctx.stroke();
            ctx.restore();
        }

        // 7. Aimed Omega Eclipse Scythe-Halberd (droops downward in defeat)
        const weaponAng = isDef ? (Math.PI * 0.42) : ang;
        EndlessBossRenderer.drawAimedLayer(ctx, weaponAng, 0, isDef ? 8 : 0, () => {
            ctx.strokeStyle = '#07090f'; ctx.lineWidth = 3;
            ctx.fillStyle = '#1f2937'; ctx.fillRect(-r * 0.28, -5, r * 1.98, 10); ctx.strokeRect(-r * 0.28, -5, r * 1.98, 10);
            ctx.fillStyle = '#fed330';
            ctx.beginPath(); ctx.arc(r * 1.38, 0, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            const bladeGrad = ctx.createLinearGradient(r * 1.3, -46, r * 1.95, 22);
            bladeGrad.addColorStop(0, '#fed330'); bladeGrad.addColorStop(0.5, '#ff2e4c'); bladeGrad.addColorStop(1, '#a855f7');
            ctx.fillStyle = bladeGrad;
            ctx.beginPath();
            ctx.moveTo(r * 1.38, -10); ctx.quadraticCurveTo(r * 2.08, -46, r * 1.88, -68);
            ctx.quadraticCurveTo(r * 1.84, -8, r * 1.42, 34); ctx.lineTo(r * 1.30, 8);
            ctx.closePath(); ctx.fill(); ctx.stroke();
        });

        // 8. Six Orbiting Sovereign Runestones + Floating Abyssal Singularity Offhand + Shield Dome
        for (let i = 0; i < 6; i++) {
            const a = t * 1.4 + (i / 6) * Math.PI * 2;
            const px = Math.cos(a) * (r * 1.54), py = Math.sin(a) * (r * 1.02);
            ctx.save(); ctx.translate(px, py); ctx.rotate(a + Math.PI / 2);
            ctx.fillStyle = i % 2 === 0 ? '#ff2e4c' : '#a855f7'; ctx.strokeStyle = '#fed330'; ctx.lineWidth = 2.4;
            ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(8, 0); ctx.lineTo(0, 14); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
        // Off-hand orbiting Black-Hole Grimoire Core
        const orbX = -Math.cos(ang) * r * 0.85 - Math.sin(ang) * r * 0.52;
        const orbY = -Math.sin(ang) * r * 0.85 + Math.cos(ang) * r * 0.52;
        ctx.save(); ctx.translate(orbX, orbY);
        ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.ellipse(0, 0, 22, 8, t * 2.6, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#090414'; ctx.strokeStyle = '#fed330'; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ff2e4c'; ctx.beginPath(); ctx.arc(0, 0, 5 + Math.sin(t * 7) * 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        if (b.shieldActive && typeof ApexSovereignW30Renderer !== 'undefined' && ApexSovereignW30Renderer._drawAegisShieldDome) {
            ApexSovereignW30Renderer._drawAegisShieldDome(ctx, b, r, t);
        }
        if (isDef && b.cutsceneState === 'DEFEAT_SHATTER') {
            ctx.save();
            ctx.fillStyle = `rgba(254, 240, 138, ${0.55 * fade + 0.25})`;
            ctx.beginPath(); ctx.arc(0, -r * 0.12, r * (0.35 + (1 - fade) * 0.9), 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
        ctx.restore();
        if (!isDef && b.cutsceneState === 'COMBAT') EndlessBossRenderer.drawBossHUD(ctx, b);
    }

    static _drawSovereignAura(ctx, r, t, ph, scale) {
        const auraR = r * 2.45 * scale;
        const pulse = 0.5 + 0.5 * Math.sin(t * 5.2);
        const grad = ctx.createRadialGradient(0, -r * 0.15, r * 0.2, 0, 0, auraR);
        grad.addColorStop(0, `rgba(254, 211, 48, ${0.52 * scale})`);
        grad.addColorStop(0.42, `rgba(255, 46, 76, ${(0.34 + pulse * 0.14) * scale})`);
        grad.addColorStop(0.75, `rgba(168, 85, 247, ${0.24 * scale})`);
        grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, auraR, 0, Math.PI * 2); ctx.fill();

        // Swirling ground Aura wave ring + vertical Sovereign Energy Spires
        ctx.strokeStyle = `rgba(254, 211, 48, ${(0.62 + pulse * 0.3) * scale})`;
        ctx.lineWidth = 3.2;
        ctx.beginPath(); ctx.ellipse(0, r * 0.58, r * 1.65 * scale, r * 0.62 * scale, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = `rgba(192, 132, 252, ${0.72 * scale})`; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.ellipse(0, r * 0.58, r * 2.05 * scale, r * 0.78 * scale, 0, 0, Math.PI * 2); ctx.stroke();

        // Rising volumetric plasma flame plumes around silhouette
        for (let i = 0; i < 10; i++) {
            const a = t * 0.75 + (i / 10) * Math.PI * 2;
            const flameH = r * (1.55 + Math.sin(t * 9 + i * 1.7) * 0.32) * scale;
            const bx = Math.cos(a) * r * 0.86, by = Math.sin(a) * r * 0.65;
            const tx = Math.cos(a) * flameH, ty = Math.sin(a) * flameH - 42 * scale;
            ctx.fillStyle = i % 2 === 0 ? `rgba(255, 46, 76, ${0.42 * scale})` : `rgba(254, 211, 48, ${0.38 * scale})`;
            ctx.beginPath();
            ctx.moveTo(bx - 10, by); ctx.quadraticCurveTo(tx - 16, (by + ty) * 0.5, tx, ty);
            ctx.quadraticCurveTo(tx + 16, (by + ty) * 0.5, bx + 10, by);
            ctx.closePath(); ctx.fill();
        }
    }

    static _drawLayeredWings(ctx, r, t, ph, fl, isDef = false) {
        const flap = isDef ? (0.32 + Math.sin(t * 1.1) * 0.02) : Math.sin(t * 2.3) * 0.09;
        for (const side of [-1, 1]) {
            ctx.save(); ctx.scale(side, 1); ctx.rotate(flap);
            for (let i = 0; i < 3; i++) {
                ctx.save();
                ctx.translate(r * 0.42, -r * (0.34 - i * 0.16));
                ctx.rotate(-0.68 + i * 0.36);
                const len = r * (1.58 - i * 0.18);
                const grad = ctx.createLinearGradient(0, 0, len, 0);
                grad.addColorStop(0, '#09090b'); grad.addColorStop(0.55, '#9f1239'); grad.addColorStop(1, ph >= 4 ? '#fef08a' : '#a855f7');
                ctx.fillStyle = fl ? '#ffffff' : grad;
                ctx.strokeStyle = '#fed330'; ctx.lineWidth = 2.6;
                ctx.beginPath();
                ctx.moveTo(0, -9); ctx.quadraticCurveTo(len * 0.55, -24, len, -6);
                ctx.quadraticCurveTo(len * 0.72, 16, 0, 9);
                ctx.closePath(); ctx.fill(); ctx.stroke();
                ctx.restore();
            }
            ctx.restore();
        }
    }

    static _drawOmegaHazards(ctx, b, t) {
        // Space-Tear Rift Slicer Lines (warn -> violent crimson-white cleave)
        if (Array.isArray(b._riftLines)) {
            for (const rf of b._riftLines) {
                const warn = rf.warnTimer > 0;
                const ex = rf.ax + Math.cos(rf.ang) * rf.len, ey = rf.ay + Math.sin(rf.ang) * rf.len;
                ctx.save(); ctx.lineCap = 'round';
                if (warn) {
                    ctx.strokeStyle = 'rgba(192, 132, 252, 0.85)'; ctx.lineWidth = 4; ctx.setLineDash([18, 12]);
                    ctx.beginPath(); ctx.moveTo(rf.ax, rf.ay); ctx.lineTo(ex, ey); ctx.stroke();
                } else {
                    ctx.strokeStyle = 'rgba(255, 46, 76, 0.55)'; ctx.lineWidth = 42;
                    ctx.beginPath(); ctx.moveTo(rf.ax, rf.ay); ctx.lineTo(ex, ey); ctx.stroke();
                    ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 10;
                    ctx.stroke();
                }
                ctx.restore();
            }
        }
        // Star Apocalypse Beams
        if (typeof ApexSovereignW30Renderer !== 'undefined' && ApexSovereignW30Renderer._drawStarBeams) {
            ApexSovereignW30Renderer._drawStarBeams(ctx, b);
        }
        // Shadow-Step Blink Target Warning
        if (b.blinkTarget) {
            ctx.save(); ctx.translate(b.blinkTarget.x, b.blinkTarget.y);
            ctx.strokeStyle = '#ff2e4c'; ctx.lineWidth = 3.5; ctx.setLineDash([12, 8]);
            ctx.beginPath(); ctx.arc(0, 0, 125, t, t + Math.PI * 2); ctx.stroke();
            ctx.fillStyle = 'rgba(255, 46, 76, 0.18)'; ctx.fill();
            ctx.restore();
        }
    }
}

if (typeof window !== 'undefined') window.ApexOmegaW60Renderer = ApexOmegaW60Renderer;
if (typeof module !== 'undefined' && module.exports) module.exports = { ApexOmegaW60Renderer };
