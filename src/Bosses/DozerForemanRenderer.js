/**
 * Lesa.io - Wave 20 Main Boss 2.5D Vector Renderer: DozerForeman ("Foreman Kostas")
 * Heavyweight Greek roadworks foreman wearing hi-vis caution vest, hazard pauldrons,
 * tool belt, safety goggles, headlamp hardhat, pipe wrench off-hand, and a massive
 * reciprocating pneumatic jackhammer drill.
 */

class DozerForemanRenderer {
    static draw(ctx, b) {
        const r = b.radius || 46;
        const flash = b.hitFlash > 0;
        const age = b.age || 0;
        const aimAngle = b.angle || 0;
        const facingLeft = Math.cos(aimAngle) < 0;
        const isBack = Math.sin(aimAngle) < -0.68;
        const isDrilling = (b.drillTimer || 0) > 0;
        const vib = isDrilling ? Math.sin(age * 1.4) * 1.8 : 0;
        const bob = (isDrilling ? -3 : Math.sin(b.walkCycle || age * 0.11) * 3) + vib;

        EndlessBossRenderer.drawTelegraphs(ctx, b.telegraphs);

        ctx.save();
        EndlessBossRenderer.drawShadow(ctx, b.x, b.y, r, b.isEnraged, b.isApex);

        if (!flash && (b.isEnraged || isDrilling)) {
            DozerForemanRenderer.drawHazardAura(ctx, b.x, b.y + r * 0.72, r, age, isDrilling);
        }

        ctx.translate(b.x, b.y + bob);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#141418';

        if (isDrilling && !flash) {
            DozerForemanRenderer.drawDrillStreaks(ctx, b.drillAngle || aimAngle, age, r);
        }

        // Character Body Layer
        ctx.save();
        if (facingLeft) ctx.scale(-1, 1);
        if (isDrilling) ctx.rotate(0.20);

        EndlessBossRenderer.drawLegs(ctx, r, b.walkCycle || age * 0.11, '#273c75', '#a0522d', flash);
        DozerForemanRenderer.drawWrenchOffHand(ctx, r, age, flash);
        DozerForemanRenderer.drawWorkTorso(ctx, r, facingLeft, isBack, b.isEnraged, flash);
        DozerForemanRenderer.drawHeadAndHardhat(ctx, r, age, isBack, b.isEnraged, flash);
        ctx.restore();

        // Aimed Pneumatic Jackhammer Drill from aiming shoulder
        const anchorX = facingLeft ? -r * 0.28 : r * 0.28;
        EndlessBossRenderer.drawAimedLayer(ctx, aimAngle, anchorX, r * 0.06, () => {
            DozerForemanRenderer.drawJackhammerDrill(ctx, r, age, b.isEnraged, isDrilling, flash);
        });

        EndlessBossRenderer.endBody(ctx, b);
    }

    static drawHazardAura(ctx, x, y, r, age, isDrilling) {
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = isDrilling ? 'rgba(241, 196, 15, 0.94)' : 'rgba(230, 126, 34, 0.85)';
        ctx.lineWidth = 4;
        ctx.setLineDash([12, 8]);
        ctx.lineDashOffset = -age * 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.24, r * 0.46, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }

    static drawDrillStreaks(ctx, drillAngle, age, r) {
        const dx = -Math.cos(drillAngle);
        const dy = -Math.sin(drillAngle);
        ctx.save();
        ctx.lineCap = 'round';
        for (const [off, col, len] of [[-16, '#f39c12', 56], [0, '#fff200', 70], [16, '#95a5a6', 54]]) {
            ctx.strokeStyle = col;
            ctx.lineWidth = 4.2;
            ctx.beginPath();
            ctx.moveTo(dx * (r * 0.35) - dy * off, dy * (r * 0.35) + dx * off);
            ctx.lineTo(dx * (r * 0.35 + len) - dy * off, dy * (r * 0.35 + len) + dx * off);
            ctx.stroke();
        }
        // Flying gravel chunks kicked back by bulldozer dash
        ctx.fillStyle = '#7f8c8d';
        for (let i = 0; i < 3; i++) {
            const p = ((age * 0.16 + i * 0.33) % 1);
            const gx = dx * (r * 0.55 + p * 44) - dy * ((i - 1) * 14);
            const gy = r * 0.45 + dy * (r * 0.4 + p * 22) + dx * ((i - 1) * 10) - Math.sin(p * Math.PI) * 10;
            ctx.beginPath();
            ctx.arc(gx, gy, 3.8 * (1 - p * 0.4), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    static drawWrenchOffHand(ctx, r, age, flash) {
        ctx.save();
        ctx.translate(-r * 0.72, -r * 0.04);
        ctx.rotate(-0.28 + Math.sin(age * 0.16) * 0.14);

        // Muscular Foreman Forearm + Thick Leather Work Glove
        ctx.fillStyle = flash ? '#ffffff' : '#d9966c';
        ctx.beginPath();
        ctx.roundRect(-r * 0.13, -r * 0.12, r * 0.25, r * 0.36, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#f1c40f';
        ctx.beginPath();
        ctx.roundRect(-r * 0.15, r * 0.18, r * 0.29, r * 0.22, 6);
        ctx.fill();
        ctx.stroke();

        // Heavy Steel Pipe Wrench
        if (!flash) {
            ctx.fillStyle = '#b2bec3';
            ctx.beginPath();
            ctx.roundRect(-r * 0.06, r * 0.26, r * 0.12, r * 0.46, 3);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#d63031';
            ctx.beginPath();
            ctx.roundRect(-r * 0.13, r * 0.62, r * 0.26, r * 0.16, 4);
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }

    static drawWorkTorso(ctx, r, facingLeft, isBack, isEnraged, flash) {
        // Heavy Navy Denim Coveralls Base
        ctx.fillStyle = flash ? '#ffffff' : '#273c75';
        ctx.beginPath();
        ctx.roundRect(-r * 0.68, -r * 0.44, r * 1.36, r * 0.92, [14, 14, 9, 9]);
        ctx.fill();
        ctx.stroke();

        // Armored Hazard Pauldrons
        for (const px of [-r * 0.65, r * 0.65]) {
            ctx.fillStyle = flash ? '#ffffff' : '#f39c12';
            ctx.beginPath();
            ctx.roundRect(px - r * 0.17, -r * 0.45, r * 0.34, r * 0.30, 7);
            ctx.fill();
            ctx.stroke();
            if (!flash) {
                ctx.fillStyle = '#1e272e';
                ctx.fillRect(px - r * 0.12, -r * 0.36, r * 0.24, r * 0.09);
            }
        }

        if (flash) return;

        // Hi-Vis Construction Vest
        ctx.fillStyle = isEnraged ? '#ffa502' : '#f1c40f';
        ctx.beginPath();
        ctx.roundRect(-r * 0.56, -r * 0.40, r * 1.12, r * 0.72, [8, 8, 6, 6]);
        ctx.fill();
        ctx.stroke();

        // Neon Reflective Strips
        ctx.fillStyle = '#dfe6e9';
        ctx.fillRect(-r * 0.54, r * 0.04, r * 1.08, r * 0.09);
        if (!isBack) {
            ctx.fillRect(-r * 0.42, -r * 0.38, r * 0.12, r * 0.42);
            ctx.fillRect(r * 0.30, -r * 0.38, r * 0.12, r * 0.42);

            // Walkie-Talkie clipped at shoulder
            ctx.fillStyle = '#1e272e';
            ctx.fillRect(-r * 0.44, -r * 0.34, r * 0.14, r * 0.20);
            ctx.strokeStyle = '#1e272e';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-r * 0.39, -r * 0.34);
            ctx.lineTo(-r * 0.43, -r * 0.54);
            ctx.stroke();

            // Chest ID Plate "KOSTAS"
            ctx.fillStyle = '#ffffff';
            ctx.lineWidth = 2.2;
            ctx.strokeStyle = '#141418';
            ctx.fillRect(-r * 0.25, -r * 0.26, r * 0.50, r * 0.20);
            ctx.strokeRect(-r * 0.25, -r * 0.26, r * 0.50, r * 0.20);
            EndlessBossRenderer.drawUnmirroredText(
                ctx, facingLeft, 'KOSTAS', 0, -r * 0.16,
                '900 8px "Fredoka", Arial, sans-serif', '#c0392b', null, r * 0.46
            );
        } else {
            ctx.strokeStyle = '#dfe6e9';
            ctx.lineWidth = 4.2;
            ctx.beginPath();
            ctx.moveTo(-r * 0.38, -r * 0.34);
            ctx.lineTo(r * 0.38, r * 0.04);
            ctx.moveTo(r * 0.38, -r * 0.34);
            ctx.lineTo(-r * 0.38, r * 0.04);
            ctx.stroke();
        }

        // Caution Hazard Waist Belt with Brass Buckle & Hanging Tool Pouches
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = '#141418';
        ctx.fillStyle = '#1e272e';
        ctx.fillRect(-r * 0.64, r * 0.21, r * 1.28, r * 0.14);
        ctx.fillStyle = '#fed330';
        for (let bx = -r * 0.54; bx < r * 0.48; bx += r * 0.22) {
            ctx.fillRect(bx, r * 0.23, r * 0.11, r * 0.10);
        }
        ctx.fillStyle = '#b2bec3';
        ctx.beginPath();
        ctx.roundRect(-r * 0.13, r * 0.18, r * 0.26, r * 0.19, 4);
        ctx.fill();
        ctx.stroke();
    }

    static drawHeadAndHardhat(ctx, r, age, isBack, isEnraged, flash) {
        ctx.save();
        ctx.translate(0, -r * 0.70);

        ctx.fillStyle = flash ? '#ffffff' : '#df9b72';
        for (const ex of [-r * 0.40, r * 0.40]) {
            ctx.beginPath();
            ctx.arc(ex, 0, r * 0.10, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        ctx.fillStyle = flash ? '#ffffff' : '#eeaa7b';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.40, r * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Grizzled short hair under hardhat (full back hair when facing north)
        ctx.fillStyle = flash ? '#ffffff' : '#4b4b4b';
        ctx.beginPath();
        if (isBack) {
            ctx.arc(0, -r * 0.02, r * 0.39, 0, Math.PI * 2);
        } else {
            ctx.arc(0, -r * 0.14, r * 0.39, Math.PI * 0.95, Math.PI * 2.05);
        }
        ctx.fill();
        ctx.stroke();

        if (!flash && !isBack) {
            // Stubbled Jaw, Thick Bushy Eyebrows & Protective Amber Goggles
            ctx.fillStyle = 'rgba(45, 52, 54, 0.24)';
            ctx.beginPath();
            ctx.arc(0, r * 0.06, r * 0.34, 0.22, Math.PI - 0.22);
            ctx.fill();

            ctx.fillStyle = '#1e272e';
            ctx.strokeStyle = '#636e72';
            ctx.lineWidth = 2.4;
            for (const gx of [-r * 0.14, r * 0.14]) {
                ctx.beginPath();
                ctx.roundRect(gx - r * 0.13, -r * 0.10, r * 0.26, r * 0.16, 5);
                ctx.fill();
                ctx.stroke();
            }
            ctx.fillStyle = isEnraged ? '#ff4757' : '#fed330';
            ctx.globalAlpha = 0.85;
            ctx.fillRect(-r * 0.23, -r * 0.07, r * 0.17, r * 0.10);
            ctx.fillRect(r * 0.05, -r * 0.07, r * 0.17, r * 0.10);
            ctx.globalAlpha = 1;

            // Thick Bushy Grizzled Mustache & Scowl
            ctx.fillStyle = '#3d3d3d';
            ctx.strokeStyle = '#141418';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(r * 0.04, r * 0.11);
            ctx.quadraticCurveTo(-r * 0.16, r * 0.07, -r * 0.28, r * 0.20);
            ctx.quadraticCurveTo(-r * 0.10, r * 0.23, r * 0.04, r * 0.16);
            ctx.quadraticCurveTo(r * 0.18, r * 0.23, r * 0.32, r * 0.19);
            ctx.quadraticCurveTo(r * 0.18, r * 0.07, r * 0.04, r * 0.11);
            ctx.fill();
            ctx.stroke();
        }

        // Ribbed Construction Hardhat + Brim + Bright LED Headlamp
        ctx.strokeStyle = '#141418';
        ctx.lineWidth = 2.8;
        ctx.fillStyle = flash ? '#ffffff' : '#f39c12';
        ctx.beginPath();
        ctx.arc(0, -r * 0.16, r * 0.43, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Center Hardhat Ridge & Molded Visor Brim
        ctx.fillStyle = flash ? '#ffffff' : '#fed330';
        ctx.beginPath();
        ctx.roundRect(-r * 0.10, -r * 0.59, r * 0.20, r * 0.26, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#e67e22';
        ctx.beginPath();
        ctx.ellipse(isBack ? 0 : r * 0.04, -r * 0.16, r * 0.48, r * 0.09, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (!flash && !isBack) {
            ctx.fillStyle = '#2f3640';
            ctx.beginPath();
            ctx.roundRect(-r * 0.11, -r * 0.34, r * 0.22, r * 0.15, 4);
            ctx.fill();
            ctx.stroke();

            const lampPulse = 0.8 + Math.sin(age * 0.25) * 0.2;
            ctx.fillStyle = isEnraged ? '#ff4757' : '#00f5ff';
            ctx.beginPath();
            ctx.arc(0, -r * 0.265, r * 0.055 * lampPulse, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    static drawJackhammerDrill(ctx, r, age, isEnraged, isDrilling, flash) {
        const pump = Math.sin(age * (isDrilling ? 1.85 : 0.48)) * (isDrilling ? 4.5 : 1.8);
        ctx.lineWidth = 2.8;
        ctx.strokeStyle = '#141418';

        // Looped Pneumatic Air Hose
        if (!flash) {
            ctx.strokeStyle = '#1e272e';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(r * 0.14, r * 0.16);
            ctx.quadraticCurveTo(r * 0.34, r * 0.42, r * 0.58, r * 0.20);
            ctx.stroke();
            ctx.lineWidth = 2.8;
            ctx.strokeStyle = '#141418';
        }

        // Heavy Amber Hydraulic Breaker Body & Twin Grip
        ctx.fillStyle = flash ? '#ffffff' : '#f39c12';
        ctx.beginPath();
        ctx.roundRect(r * 0.06, -r * 0.23, r * 0.68, r * 0.46, 8);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            // Caution Stripes & Hydraulic Valve Cylinder
            ctx.fillStyle = '#1e272e';
            ctx.fillRect(r * 0.24, -r * 0.21, r * 0.12, r * 0.42);
            ctx.fillRect(r * 0.46, -r * 0.21, r * 0.10, r * 0.42);
            ctx.fillStyle = '#dfe6e9';
            ctx.fillRect(r * 0.62, -r * 0.14, r * 0.22, r * 0.28);
            ctx.strokeRect(r * 0.62, -r * 0.14, r * 0.22, r * 0.28);
        }

        // Reciprocating Giant Spiral Auger Drill Bit
        ctx.save();
        ctx.translate(pump, 0);
        ctx.fillStyle = flash ? '#ffffff' : '#b2bec3';
        ctx.beginPath();
        ctx.moveTo(r * 0.82, -r * 0.26);
        ctx.lineTo(r * 1.62, 0);
        ctx.lineTo(r * 0.82, r * 0.26);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            // Animated Scrolling Steel Drill Flutes
            const scroll = (age * (isDrilling ? 0.5 : 0.16)) % 1;
            ctx.strokeStyle = '#2d3436';
            ctx.lineWidth = 2.6;
            for (let i = 0; i < 4; i++) {
                const f = (i + scroll) / 4.2;
                const fx = r * (0.86 + f * 0.66);
                const fh = r * 0.23 * (1 - f * 0.82);
                ctx.beginPath();
                ctx.moveTo(fx - r * 0.04, -fh);
                ctx.lineTo(fx + r * 0.05, fh);
                ctx.stroke();
            }

            if (isDrilling || isEnraged) {
                ctx.fillStyle = 'rgba(255, 211, 42, 0.92)';
                ctx.beginPath();
                ctx.arc(r * 1.60, 0, r * (0.09 + Math.abs(Math.sin(age * 0.9)) * 0.05), 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();

        // Work-Gloved Foreman Hand on Trigger Grip
        ctx.strokeStyle = '#141418';
        ctx.lineWidth = 2.8;
        ctx.fillStyle = flash ? '#ffffff' : '#f1c40f';
        ctx.beginPath();
        ctx.arc(r * 0.16, r * 0.04, r * 0.13, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}

if (typeof window !== 'undefined') {
    window.DozerForemanRenderer = DozerForemanRenderer;
}
