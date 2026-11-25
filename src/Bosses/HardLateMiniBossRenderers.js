/**
 * Lesa.io - Endless Hard Mode W25 & W35 Mini-Boss High-Detail 2.5D Renderers
 *   - VoidDreadnought (W25): Obsidian Siegebreaker Juggernaut with recessed furnace chamber,
 *     tiered fortress pauldrons, spiked bulwark ram shield & rotary triple-barrel magma cannon.
 *   - InfernoHydra (W35): Winged Twin-Core Wyrm-Lord with dual sinuous drake heads,
 *     bone-webbed fire wings, linked combustion heart & clawed twin flame-maws.
 */

class HardLateMiniBossRenderers {
    static drawDreadnought(ctx, b) {
        EndlessBossRenderer.drawTelegraphs(ctx, b.telegraphs);
        if (typeof EndlessBossRenderer === 'undefined') return;
        const r = b.radius, fl = b.hitFlash > 0, ang = b.angle || 0, t = (b.age || 0) * 0.08;
        const facingLeft = Math.cos(ang) < 0;

        ctx.save();
        EndlessBossRenderer.drawShadow(ctx, b.x, b.y, r * 1.12, b.isEnraged);
        if (b.chargeWindup > 0) {
            ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.chargeAngle || ang);
            ctx.fillStyle = 'rgba(255, 107, 53, 0.22)'; ctx.strokeStyle = '#ff9f43'; ctx.lineWidth = 3; ctx.setLineDash([14, 8]);
            ctx.fillRect(0, -36, 360, 72); ctx.strokeRect(0, -36, 360, 72);
            ctx.restore();
        }
        ctx.translate(b.x, b.y + Math.sin(t) * 2.5);

        if (b.isEnraged) {
            ctx.strokeStyle = 'rgba(255, 107, 53, 0.72)'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(0, 0, r * 1.38 + Math.sin(t * 2) * 3, 0, Math.PI * 2); ctx.stroke();
        }

        // Hydraulic Mechanized Treads & Brass Knee Pistons
        for (const side of [-1, 1]) {
            const stride = Math.sin(t * 2 + (side > 0 ? Math.PI : 0)) * 5;
            ctx.fillStyle = fl ? '#ffffff' : '#18181b'; ctx.strokeStyle = '#09090b'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.roundRect(side * r * 0.34 - 11, r * 0.25 + stride, 22, r * 0.56, 5); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#d97706'; ctx.fillRect(side * r * 0.34 - 8, r * 0.34 + stride, 16, 6);
            ctx.fillStyle = '#ff6b35'; ctx.fillRect(side * r * 0.34 - 9, r * 0.68 + stride, 18, 7);
        }

        // Layered Basalt Dreadnought Backplate & Twin Exhaust Smoke Stacks
        ctx.save();
        if (facingLeft) ctx.scale(-1, 1);
        for (const sx of [-r * 0.42, r * 0.42]) {
            ctx.fillStyle = fl ? '#ffffff' : '#27272a'; ctx.strokeStyle = '#09090b'; ctx.lineWidth = 3;
            ctx.fillRect(sx - 6, -r * 1.18, 12, r * 0.45); ctx.strokeRect(sx - 6, -r * 1.18, 12, r * 0.45);
            ctx.fillStyle = '#ff9f43'; ctx.beginPath(); ctx.arc(sx, -r * 1.18, 5, 0, Math.PI * 2); ctx.fill();
        }

        // Sculpted Beveled Obsidian Chassis
        ctx.fillStyle = fl ? '#ffffff' : '#18181b'; ctx.strokeStyle = '#09090b'; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-r * 0.68, -r * 0.48); ctx.lineTo(r * 0.68, -r * 0.48);
        ctx.lineTo(r * 0.80, r * 0.14); ctx.lineTo(r * 0.54, r * 0.54);
        ctx.lineTo(-r * 0.54, r * 0.54); ctx.lineTo(-r * 0.80, r * 0.14);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        // Recessed Molten Furnace Chamber with Bronze Grate Bars
        ctx.fillStyle = '#431407'; ctx.strokeStyle = '#d97706'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(-r * 0.36, -r * 0.24, r * 0.72, r * 0.56, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle = fl ? '#ffffff' : '#ff6b35';
        ctx.beginPath(); ctx.arc(0, r * 0.04, r * 0.22 + Math.sin(t * 3) * 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath(); ctx.arc(0, r * 0.04, r * 0.10, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#18181b'; ctx.lineWidth = 3;
        for (const bx of [-r * 0.16, 0, r * 0.16]) {
            ctx.beginPath(); ctx.moveTo(bx, -r * 0.24); ctx.lineTo(bx, r * 0.32); ctx.stroke();
        }

        // Tiered Shoulder Fortress Pauldrons + Glowing Lava Vents & Studs
        for (const side of [-1, 1]) {
            ctx.fillStyle = fl ? '#ffffff' : '#27272a'; ctx.strokeStyle = '#d97706'; ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(side * r * 0.42, -r * 0.56); ctx.lineTo(side * r * 1.12, -r * 0.40);
            ctx.lineTo(side * r * 1.00, r * 0.16); ctx.lineTo(side * r * 0.48, r * 0.08);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#ff6b35';
            ctx.fillRect(side * r * 0.76 - 6, -r * 0.28, 12, 18);
            ctx.fillStyle = '#fed330';
            ctx.beginPath(); ctx.arc(side * r * 0.92, -r * 0.28, 3.5, 0, Math.PI * 2); ctx.fill();
        }

        // Armored Blast Collar & 3-Optic Horned Juggernaut Helm
        ctx.fillStyle = fl ? '#ffffff' : '#0f172a'; ctx.strokeStyle = '#09090b'; ctx.lineWidth = 3.6;
        ctx.beginPath(); ctx.roundRect(-r * 0.34, -r * 0.88, r * 0.68, r * 0.48, 8); ctx.fill(); ctx.stroke();
        for (const s of [-1, 1]) {
            ctx.fillStyle = '#ff9f43'; ctx.strokeStyle = '#09090b'; ctx.lineWidth = 2.4;
            ctx.beginPath(); ctx.moveTo(s * r * 0.22, -r * 0.82); ctx.lineTo(s * r * 0.46, -r * 1.16); ctx.lineTo(s * r * 0.08, -r * 0.86); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
        ctx.fillStyle = '#ff2e4c';
        ctx.fillRect(-r * 0.20, -r * 0.68, 9, 5); ctx.fillRect(r * 0.20 - 9, -r * 0.68, 9, 5);
        ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(0, -r * 0.65, 3.8, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // Aimed Weapons: Spiked Siege Ram Shield + Rotary Triple-Barrel Magma Cannon
        EndlessBossRenderer.drawAimedLayer(ctx, ang, 0, 0, () => {
            ctx.strokeStyle = '#09090b'; ctx.lineWidth = 3;
            // Left: Beveled Siege Bulwark Shield
            ctx.fillStyle = '#334155';
            ctx.beginPath(); ctx.moveTo(r * 0.56, -r * 0.66); ctx.lineTo(r * 0.94, -r * 0.42); ctx.lineTo(r * 0.56, -r * 0.16); ctx.closePath(); ctx.fill(); ctx.stroke();
            // Right: Rotary Triple-Barrel Magma Cannon
            ctx.fillStyle = '#1f2937'; ctx.fillRect(r * 0.08, r * 0.26, r * 1.05, 22); ctx.strokeRect(r * 0.08, r * 0.26, r * 1.05, 22);
            for (const by of [r * 0.30, r * 0.37, r * 0.44]) {
                ctx.fillStyle = '#d97706'; ctx.fillRect(r * 0.82, by - 2, r * 0.42, 4);
            }
            ctx.fillStyle = '#ff6b35'; ctx.fillRect(r * 1.14, r * 0.28, 7, 18);
        });
        ctx.restore();
        EndlessBossRenderer.drawBossHUD(ctx, b);
    }

    static drawInfernoHydra(ctx, b) {
        EndlessBossRenderer.drawTelegraphs(ctx, b.telegraphs);
        if (typeof EndlessBossRenderer === 'undefined') return;
        const r = b.radius, fl = b.hitFlash > 0, ang = b.angle || 0, t = (b.age || 0) * 0.09;

        ctx.save();
        EndlessBossRenderer.drawShadow(ctx, b.x, b.y, r * 1.15, b.isEnraged);
        ctx.translate(b.x, b.y + Math.sin(t) * 3.5);

        // Articulated Bone-Spined Infernal Wyrm Wings (3 struts per wing)
        const flap = Math.sin(t * 1.4) * 0.1;
        for (const s of [-1, 1]) {
            ctx.save(); ctx.scale(s, 1); ctx.rotate(flap);
            ctx.fillStyle = fl ? '#ffffff' : 'rgba(185, 28, 28, 0.88)';
            ctx.strokeStyle = '#450a0a'; ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(r * 0.25, -r * 0.28); ctx.lineTo(r * 1.62, -r * 0.94);
            ctx.lineTo(r * 1.44, -r * 0.28); ctx.lineTo(r * 1.56, r * 0.18);
            ctx.lineTo(r * 0.96, r * 0.34); ctx.lineTo(r * 0.36, r * 0.18);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.strokeStyle = '#ffa502'; ctx.lineWidth = 2.4;
            for (const [wx, wy] of [[r * 1.55, -r * 0.90], [r * 1.38, -r * 0.28], [r * 1.46, r * 0.16]]) {
                ctx.beginPath(); ctx.moveTo(r * 0.3, -r * 0.18); ctx.lineTo(wx, wy); ctx.stroke();
            }
            ctx.restore();
        }

        // Scaled Drake Legs & Spined Crimson Dorsal Crest
        EndlessBossRenderer.drawLegs(ctx, r, t * 1.6, '#291515', '#7c2d12', fl);
        ctx.fillStyle = fl ? '#ffffff' : '#291515'; ctx.strokeStyle = '#09090b'; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-r * 0.56, -r * 0.44); ctx.lineTo(r * 0.56, -r * 0.44);
        ctx.lineTo(r * 0.68, r * 0.22); ctx.lineTo(0, r * 0.56); ctx.lineTo(-r * 0.68, r * 0.22);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        // Twin Linked Magma Reactor Hearts + Plasma Conduit Bridge
        ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(-r * 0.26, -r * 0.04); ctx.lineTo(r * 0.26, -r * 0.04); ctx.stroke();
        for (const cx of [-r * 0.26, r * 0.26]) {
            ctx.fillStyle = fl ? '#ffffff' : '#ff6b35'; ctx.strokeStyle = '#fed330'; ctx.lineWidth = 2.8;
            ctx.beginPath(); ctx.arc(cx, -r * 0.04, r * 0.18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(cx, -r * 0.04, r * 0.08, 0, Math.PI * 2); ctx.fill();
        }

        // Center Jagged Molten Crest between Twin Necks
        ctx.fillStyle = '#ffa502'; ctx.strokeStyle = '#09090b'; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.moveTo(-9, -r * 0.42); ctx.lineTo(0, -r * 0.96); ctx.lineTo(9, -r * 0.42); ctx.closePath(); ctx.fill(); ctx.stroke();

        // Twin Sinuous Serpentine Drake Necks + Sculpted Horned Dragon Heads
        for (const [side, sway] of [[-1, Math.sin(t * 2) * 3], [1, Math.cos(t * 2) * 3]]) {
            ctx.strokeStyle = '#09090b'; ctx.lineWidth = 15; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(side * r * 0.26, -r * 0.36); ctx.quadraticCurveTo(side * r * 0.56, -r * 0.62, side * r * 0.44 + sway, -r * 0.90); ctx.stroke();
            ctx.strokeStyle = '#b91c1c'; ctx.lineWidth = 9; ctx.stroke();
            ctx.strokeStyle = '#fed330'; ctx.lineWidth = 2.4; ctx.setLineDash([4, 6]); ctx.stroke(); ctx.setLineDash([]);

            ctx.save();
            ctx.translate(side * r * 0.44 + sway, -r * 0.94);
            ctx.rotate(side * 0.22);
            ctx.fillStyle = fl ? '#ffffff' : '#7f1d1d'; ctx.strokeStyle = '#fed330'; ctx.lineWidth = 2.8;
            ctx.beginPath();
            ctx.moveTo(0, -22); ctx.lineTo(16, -4); ctx.lineTo(12, 15); ctx.lineTo(-12, 15); ctx.lineTo(-16, -4);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            // Snout bridge + ember fangs
            ctx.fillStyle = '#fef08a'; ctx.strokeStyle = '#09090b'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(-4, -18); ctx.lineTo(4, -18); ctx.lineTo(2, -4); ctx.lineTo(-2, -4); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#ffa502';
            ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(-20, -30); ctx.lineTo(-3, -16); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(10, -10); ctx.lineTo(20, -30); ctx.lineTo(3, -16); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#fef08a'; ctx.fillRect(-9, -3, 6, 4.5); ctx.fillRect(3, -3, 6, 4.5);
            ctx.restore();
        }

        // Aimed Twin Magma Maw Gauntlets
        EndlessBossRenderer.drawAimedLayer(ctx, ang, 0, 0, () => {
            ctx.strokeStyle = '#09090b'; ctx.lineWidth = 2.8;
            for (const oy of [-17, 17]) {
                ctx.fillStyle = '#7f1d1d'; ctx.fillRect(10, oy - 6, r * 0.92, 12); ctx.strokeRect(10, oy - 6, r * 0.92, 12);
                ctx.fillStyle = '#ffa502';
                ctx.beginPath(); ctx.moveTo(r * 0.92, oy - 8); ctx.lineTo(r * 1.24, oy); ctx.lineTo(r * 0.92, oy + 8); ctx.closePath(); ctx.fill(); ctx.stroke();
            }
        });
        ctx.restore();
        EndlessBossRenderer.drawBossHUD(ctx, b);
    }
}

if (typeof window !== 'undefined') window.HardLateMiniBossRenderers = HardLateMiniBossRenderers;
if (typeof module !== 'undefined' && module.exports) module.exports = { HardLateMiniBossRenderers };
