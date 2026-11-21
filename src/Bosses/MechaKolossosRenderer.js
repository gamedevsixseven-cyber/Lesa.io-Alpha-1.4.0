/**
 * Lesa.io - Wave 40+ Insane Main Boss 2.5D Vector Renderer: MechaKolossos ("Kolossos MK-IV")
 * Towering Neo-Hellenic Mechanical Titan inspired by the Colossus of Rhodes:
 * dorsal orbital-strike mortar pods, articulated dreadnought pistons, bronze & obsidian
 * chestplate with Greek key trim and spinning reactor core, 7-rayed Solar Crown of
 * Helios, and twin-linked Siege Plasma Cannons.
 */

class MechaKolossosRenderer {
    static draw(ctx, b) {
        const r = b.radius || 56;
        const flash = b.hitFlash > 0;
        const age = b.age || 0;
        const aimAngle = b.angle || 0;
        const facingLeft = Math.cos(aimAngle) < 0;
        const isBack = Math.sin(aimAngle) < -0.68;
        const beamCharging = !!(b.omegaBeam || b.solarNova);
        const orbitalGlow = (b.orbitalCooldown || 999) <= 22 || beamCharging || !!b.criticalTriggered;
        const venting = (b.solarVentTimer || 0) > 0;
        const sweepRecoil = (b.sweepCooldown || 999) <= 9 ? 0.14 : 0;
        const trembleX = b.isDying ? (Math.random() - 0.5) * 9 : 0;
        const trembleY = b.isDying ? (Math.random() - 0.5) * 9 : 0;
        const lift = b.jumpLift || 0;
        const bob = lift > 1 ? 0 : Math.sin(b.walkCycle || age * 0.10) * 2.5;

        if (typeof KolossosAttackSystem !== 'undefined') {
            KolossosAttackSystem.drawWorldHazards(ctx, b);
        }
        EndlessBossRenderer.drawTelegraphs(ctx, b.telegraphs);

        ctx.save();
        const shadowScale = Math.max(0.45, 1.15 - (lift / 280));
        EndlessBossRenderer.drawShadow(ctx, b.x, b.y, r * shadowScale, b.isEnraged, true);

        if (!flash && lift < 25) {
            MechaKolossosRenderer.drawReactorAura(ctx, b.x, b.y + r * 0.78, r, age, b.isEnraged, orbitalGlow, b.criticalTriggered);
        }

        ctx.translate(b.x + trembleX, b.y + bob - lift + trembleY);
        if (lift > 4 && !flash) {
            // Blazing jet-thruster flames beneath piston boots while airborne!
            for (const side of [-1, 1]) {
                const fx = side * r * 0.42;
                const fy = r * 0.84;
                const flameH = r * (0.55 + Math.sin(age * 0.8 + side) * 0.14);
                ctx.fillStyle = '#ff2e4c';
                ctx.beginPath();
                ctx.moveTo(fx - 9, fy); ctx.lineTo(fx, fy + flameH); ctx.lineTo(fx + 9, fy);
                ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#fed330';
                ctx.beginPath();
                ctx.moveTo(fx - 4.5, fy); ctx.lineTo(fx, fy + flameH * 0.65); ctx.lineTo(fx + 4.5, fy);
                ctx.closePath(); ctx.fill();
            }
        }
        ctx.lineWidth = 3.2;
        ctx.strokeStyle = '#141418';

        // Character Body Layer
        ctx.save();
        if (facingLeft) ctx.scale(-1, 1);

        MechaKolossosRenderer.drawDorsalOrbitalPods(ctx, r, age, isBack, b.isEnraged, orbitalGlow, flash);
        MechaKolossosRenderer.drawMechPistons(ctx, r, b.walkCycle || age * 0.10, b.isEnraged, flash);
        MechaKolossosRenderer.drawKolossosChassis(ctx, r, age, isBack, b.isEnraged, orbitalGlow, flash);
        MechaKolossosRenderer.drawHeliosHead(ctx, r, age, isBack, b.isEnraged, orbitalGlow, flash);
        ctx.restore();

        // Aimed Twin Siege Plasma Cannons
        const anchorX = facingLeft ? -r * 0.28 : r * 0.28;
        EndlessBossRenderer.drawAimedLayer(ctx, aimAngle, anchorX, r * 0.04, () => {
            MechaKolossosRenderer.drawSiegeCannons(ctx, r, age, b.isEnraged, sweepRecoil, flash);
        });

        // Reactor exhaust vent flare during post-Solar-Nova punish window
        if (venting) {
            const vPulse = 0.65 + 0.35 * Math.sin(age * 0.45);
            const vFade = Math.min(1, (b.solarVentTimer || 0) / 28);
            ctx.save();
            ctx.globalAlpha = 0.72 * vFade * vPulse;
            const ventGrad = ctx.createRadialGradient(0, 0, r * 0.15, 0, 0, r * 1.15);
            ventGrad.addColorStop(0, 'rgba(255, 244, 190, 0.9)');
            ventGrad.addColorStop(0.5, 'rgba(255, 130, 35, 0.55)');
            ventGrad.addColorStop(1, 'rgba(255, 55, 20, 0)');
            ctx.fillStyle = ventGrad;
            ctx.beginPath();
            ctx.arc(0, 0, r * 1.15, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = `rgba(255, 220, 120, ${0.85 * vFade})`;
            ctx.lineWidth = Math.max(2, r * 0.055);
            for (let k = 0; k < 4; k++) {
                const va = Math.PI * 0.25 + k * Math.PI * 0.5;
                ctx.beginPath();
                ctx.moveTo(Math.cos(va) * r * 0.55, Math.sin(va) * r * 0.55);
                ctx.lineTo(Math.cos(va) * r * (1.05 + 0.18 * vPulse), Math.sin(va) * r * (1.05 + 0.18 * vPulse));
                ctx.stroke();
            }
            ctx.restore();
        }

        EndlessBossRenderer.endBody(ctx, b);

        // Render sweeping Omega Beam on top so core laser clarity stays razor-sharp
        if (typeof KolossosAttackSystem !== 'undefined') {
            KolossosAttackSystem.drawOmegaBeam(ctx, b);
        }
    }

    static drawReactorAura(ctx, x, y, r, age, isEnraged, orbitalGlow, isCritical = false) {
        ctx.save();
        ctx.translate(x, y);
        const outerR = r * (isCritical ? 1.50 : 1.36);
        const outerYr = outerR * 0.36;

        // Soft glowing crimson ground aura
        const g = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, outerR);
        g.addColorStop(0, isEnraged ? 'rgba(255, 46, 76, 0.38)' : 'rgba(255, 71, 87, 0.22)');
        g.addColorStop(1, 'rgba(255, 46, 76, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(0, 0, outerR, outerYr * 1.15, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = (isEnraged || orbitalGlow) ? 'rgba(255, 46, 76, 0.94)' : 'rgba(255, 99, 72, 0.78)';
        ctx.lineWidth = isCritical ? 4.2 : 3.4;
        ctx.setLineDash([14, 7]);
        ctx.lineDashOffset = -age * (isCritical ? 2.4 : 1.6);
        ctx.beginPath();
        ctx.ellipse(0, 0, outerR, outerYr, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Orbiting Crimson/Magma Heat Capacitors (6 in Overdrive, 4 base)
        const capCount = isEnraged ? 6 : 4;
        for (let i = 0; i < capCount; i++) {
            const a = age * (isCritical ? 0.11 : 0.08) + (i * Math.PI * 2) / capCount;
            const px = Math.cos(a) * outerR;
            const py = Math.sin(a) * outerYr;
            ctx.fillStyle = isCritical ? '#ffffff' : (isEnraged ? '#ff2e4c' : '#ffa502');
            ctx.strokeStyle = '#141418';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(px, py - 6.5); ctx.lineTo(px + 5.5, py); ctx.lineTo(px, py + 6.5); ctx.lineTo(px - 5.5, py);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }

    static drawDorsalOrbitalPods(ctx, r, age, isBack, isEnraged, orbitalGlow, flash) {
        const lift = orbitalGlow ? -r * 0.14 : Math.sin(age * 0.10) * r * 0.04;
        for (const side of [-1, 1]) {
            ctx.save();
            ctx.translate(side * r * 0.62, -r * 0.56 + lift);
            ctx.rotate(side * 0.14);

            // Heavy armored missile/orbital battery pod
            ctx.fillStyle = flash ? '#ffffff' : '#2f3542';
            ctx.beginPath();
            ctx.roundRect(-r * 0.22, -r * 0.34, r * 0.44, r * 0.50, 6);
            ctx.fill();
            ctx.stroke();

            if (!flash) {
                // Bronze trim collar + 3 glowing magma missile warheads
                ctx.fillStyle = '#cd6133';
                ctx.fillRect(-r * 0.20, -r * 0.10, r * 0.40, r * 0.14);
                const cellCol = orbitalGlow ? '#ffffff' : (isEnraged ? '#ff4757' : '#ffa502');
                for (const mx of [-r * 0.11, 0, r * 0.11]) {
                    ctx.fillStyle = cellCol;
                    ctx.beginPath();
                    ctx.arc(mx, -r * 0.24, r * 0.06, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.restore();
        }

        if (isBack && !flash) {
            // Subtle vent slits on dorsal pods only; main fusion spine is drawn on chassis exterior below
            ctx.fillStyle = isEnraged ? '#ff4757' : '#ff9f43';
            ctx.fillRect(-r * 0.28, -r * 0.12, r * 0.56, r * 0.08);
        }
    }

    static drawMechPistons(ctx, r, phase, isEnraged, flash) {
        const stride = Math.sin(phase) * 0.18;
        for (const [lx, rot] of [[-r * 0.34, -stride], [r * 0.34, stride]]) {
            ctx.save();
            ctx.translate(lx, r * 0.42);
            ctx.rotate(rot);

            // Hydraulic steel cylinder + bronze knee armor + heavy stomp greave
            ctx.fillStyle = flash ? '#ffffff' : '#576574';
            ctx.beginPath();
            ctx.roundRect(-r * 0.18, -r * 0.04, r * 0.36, r * 0.36, 5);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = flash ? '#ffffff' : '#cd6133';
            ctx.beginPath();
            ctx.roundRect(-r * 0.24, r * 0.24, r * 0.48, r * 0.28, 6);
            ctx.fill();
            ctx.stroke();

            if (!flash) {
                ctx.fillStyle = isEnraged ? '#ff4757' : '#f1c40f';
                ctx.fillRect(-r * 0.14, r * 0.08, r * 0.28, r * 0.09);
            }
            ctx.restore();
        }
    }

    static drawKolossosChassis(ctx, r, age, isBack, isEnraged, orbitalGlow, flash) {
        // Broad tapered bronze dreadnought breastplate
        ctx.fillStyle = flash ? '#ffffff' : '#2d3436';
        ctx.beginPath();
        ctx.moveTo(-r * 0.84, -r * 0.46);
        ctx.lineTo(r * 0.84, -r * 0.46);
        ctx.lineTo(r * 0.62, r * 0.54);
        ctx.lineTo(-r * 0.62, r * 0.54);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Twin massive Bronze Shoulder Pauldrons with golden bolts
        for (const side of [-1, 1]) {
            ctx.fillStyle = flash ? '#ffffff' : '#cd6133';
            ctx.beginPath();
            ctx.moveTo(side * r * 0.44, -r * 0.54);
            ctx.lineTo(side * r * 0.96, -r * 0.36);
            ctx.lineTo(side * r * 0.88, -r * 0.02);
            ctx.lineTo(side * r * 0.46, -r * 0.10);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            if (!flash) {
                ctx.fillStyle = '#fed330';
                ctx.beginPath();
                ctx.arc(side * r * 0.72, -r * 0.26, r * 0.06, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (flash) return;

        if (isBack) {
            // Back view: colossal exposed nuclear cooling spine & bronze radiator fins
            ctx.fillStyle = '#cd6133';
            ctx.beginPath();
            ctx.roundRect(-r * 0.44, -r * 0.38, r * 0.88, r * 0.76, 8);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#1e272e';
            ctx.beginPath();
            ctx.roundRect(-r * 0.30, -r * 0.32, r * 0.60, r * 0.64, 6);
            ctx.fill();
            ctx.stroke();

            for (const fy of [-r * 0.18, r * 0.16]) {
                ctx.fillStyle = '#e58e26';
                ctx.fillRect(-r * 0.38, fy - r * 0.04, r * 0.76, r * 0.08);
            }

            ctx.fillStyle = orbitalGlow ? '#ffffff' : (isEnraged ? '#ff4757' : '#ff7f50');
            ctx.beginPath();
            ctx.arc(0, -r * 0.02, r * 0.20, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            return;
        }

        // Sculpted Bronze Pectoral Armor Plates
        ctx.fillStyle = '#cd6133';
        ctx.beginPath();
        ctx.moveTo(-r * 0.56, -r * 0.40);
        ctx.lineTo(r * 0.56, -r * 0.40);
        ctx.lineTo(r * 0.42, r * 0.26);
        ctx.lineTo(-r * 0.42, r * 0.26);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Golden Hellenic Meander Waist Belt + Armored Tasset Skirt Plates
        ctx.fillStyle = '#e58e26';
        ctx.fillRect(-r * 0.54, r * 0.26, r * 1.08, r * 0.16);
        ctx.strokeRect(-r * 0.54, r * 0.26, r * 1.08, r * 0.16);
        ctx.fillStyle = '#1e272e';
        for (const bx of [-r * 0.34, -r * 0.12, r * 0.12, r * 0.34]) {
            ctx.fillRect(bx - r * 0.05, r * 0.30, r * 0.10, r * 0.08);
        }

        // Spinning Multi-Ring Molten Plasma Core in Chest
        ctx.fillStyle = '#141418';
        ctx.beginPath();
        ctx.arc(0, -r * 0.08, r * 0.26, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.save();
        ctx.translate(0, -r * 0.08);
        ctx.rotate(age * (isEnraged ? 0.12 : 0.06));
        ctx.strokeStyle = '#fed330';
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
            const a = (i / 3) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.20, a, a + 1.15);
            ctx.stroke();
        }
        ctx.restore();

        const corePulse = r * (0.14 + Math.sin(age * 0.24) * 0.03);
        ctx.fillStyle = orbitalGlow ? '#ffffff' : (isEnraged ? '#ff4757' : '#ff6348');
        ctx.beginPath();
        ctx.arc(0, -r * 0.08, Math.max(3, corePulse), 0, Math.PI * 2);
        ctx.fill();
    }

    static drawHeliosHead(ctx, r, age, isBack, isEnraged, orbitalGlow, flash) {
        ctx.save();
        ctx.translate(0, -r * 0.70);

        // 7-Rayed Iconic Helios Solar Crown behind helmet
        if (!flash) {
            const glow = Math.sin(age * 0.2) * 0.05;
            ctx.fillStyle = (isEnraged || orbitalGlow) ? '#ffa502' : '#fed330';
            ctx.strokeStyle = '#141418';
            ctx.lineWidth = 2.2;
            for (let i = -3; i <= 3; i++) {
                const a = -Math.PI * 0.5 + i * 0.34;
                const len = r * ((Math.abs(i) === 0 ? 0.92 : Math.abs(i) === 1 ? 0.82 : 0.70) + glow);
                ctx.beginPath();
                ctx.moveTo(Math.cos(a - 0.24) * r * 0.30, Math.sin(a - 0.24) * r * 0.30);
                ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
                ctx.lineTo(Math.cos(a + 0.24) * r * 0.30, Math.sin(a + 0.24) * r * 0.30);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        }

        // Sculpted Corinthian Cyber-Helm
        ctx.fillStyle = flash ? '#ffffff' : '#e58e26';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.40, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            // Cheek plates & jaw radiator vent
            ctx.fillStyle = '#cd6133';
            ctx.beginPath();
            ctx.roundRect(-r * 0.32, -r * 0.02, r * 0.64, r * 0.32, 6);
            ctx.fill();
            ctx.stroke();

            if (!isBack) {
                // Piercing V-shaped Cyber Optic Visor
                ctx.fillStyle = '#141418';
                ctx.beginPath();
                ctx.moveTo(-r * 0.30, -r * 0.14);
                ctx.lineTo(0, -r * 0.02);
                ctx.lineTo(r * 0.30, -r * 0.14);
                ctx.lineTo(r * 0.24, r * 0.06);
                ctx.lineTo(0, r * 0.10);
                ctx.lineTo(-r * 0.24, r * 0.06);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = orbitalGlow ? '#ffffff' : (isEnraged ? '#ff4757' : '#ff9f43');
                ctx.beginPath();
                ctx.moveTo(-r * 0.24, -r * 0.08);
                ctx.lineTo(0, r * 0.02);
                ctx.lineTo(r * 0.24, -r * 0.08);
                ctx.lineTo(r * 0.20, r * 0.03);
                ctx.lineTo(0, r * 0.06);
                ctx.lineTo(-r * 0.20, r * 0.03);
                ctx.closePath();
                ctx.fill();
            }
        }
        ctx.restore();
    }

    static drawSiegeCannons(ctx, r, age, isEnraged, recoil, flash) {
        const kick = recoil * r * 0.55;
        ctx.save();
        ctx.translate(-kick, 0);

        // Dual under/over Siege Plasma Barrels
        for (const by of [-r * 0.24, r * 0.10]) {
            ctx.fillStyle = flash ? '#ffffff' : '#2f3542';
            ctx.beginPath();
            ctx.roundRect(r * 0.22, by, r * 0.88, r * 0.18, 4);
            ctx.fill();
            ctx.stroke();

            if (flash) continue;

            // Bronze recoil sleeve + glowing magma ion strip
            ctx.fillStyle = '#cd6133';
            ctx.fillRect(r * 0.34, by - 1, r * 0.30, r * 0.20);
            ctx.strokeRect(r * 0.34, by - 1, r * 0.30, r * 0.20);

            ctx.fillStyle = isEnraged ? '#ff4757' : '#ff6348';
            ctx.fillRect(r * 0.68, by + r * 0.04, r * 0.38, r * 0.09);

            if (recoil > 0) {
                ctx.fillStyle = '#ffd32a';
                ctx.beginPath();
                ctx.arc(r * 1.14, by + r * 0.09, r * 0.11, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.MechaKolossosRenderer = MechaKolossosRenderer;
}
