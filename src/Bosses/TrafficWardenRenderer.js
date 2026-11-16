/**
 * Lesa.io - Wave 15 Mini-Boss 2.5D Vector Renderer: TrafficWarden ("Warden Nikos")
 * Athenian Municipal Police traffic officer riding a high-vis patrol scooter
 * with flashing red/cyan siren beacon, traffic whistle, peaked gold-crested cap,
 * parking fine slips, and a shoulder-aimed speed-radar ticket blaster.
 */

class TrafficWardenRenderer {
    static draw(ctx, b) {
        const r = b.radius || 38;
        const flash = b.hitFlash > 0;
        const age = b.age || 0;
        const aimAngle = b.angle || 0;
        const facingLeft = Math.cos(aimAngle) < 0;
        const isBack = Math.sin(aimAngle) < -0.68;
        const isDrifting = (b.driftTimer || 0) > 0;
        const engineVib = Math.sin(age * 0.85) * (isDrifting ? 1.8 : 1.0);
        const bob = (isDrifting ? -3 : Math.sin(b.walkCycle || age * 0.14) * 2.2) + engineVib;

        EndlessBossRenderer.drawTelegraphs(ctx, b.telegraphs);

        ctx.save();
        EndlessBossRenderer.drawShadow(ctx, b.x, b.y, r, b.isEnraged, b.isApex);

        if (!flash && (b.isEnraged || isDrifting)) {
            TrafficWardenRenderer.drawSirenAura(ctx, b.x, b.y + r * 0.72, r, age, isDrifting);
        }

        ctx.translate(b.x, b.y + bob);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#141418';

        if (isDrifting && !flash) {
            TrafficWardenRenderer.drawDriftStreaks(ctx, b.driftAngle || aimAngle, r);
        }

        // Scooter & Officer Body Layer
        ctx.save();
        if (facingLeft) ctx.scale(-1, 1);
        if (isDrifting) ctx.rotate(0.18);

        TrafficWardenRenderer.drawPatrolScooter(ctx, r, age, facingLeft, isDrifting, b.isEnraged, flash);
        TrafficWardenRenderer.drawOfficerBody(ctx, r, age, isBack, b.isEnraged, flash);
        TrafficWardenRenderer.drawOfficerHead(ctx, r, isBack, b.isEnraged, flash);
        ctx.restore();

        // Aimed Handheld Speed-Radar Ticket Blaster from aiming shoulder
        const anchorX = facingLeft ? -r * 0.18 : r * 0.18;
        EndlessBossRenderer.drawAimedLayer(ctx, aimAngle, anchorX, -r * 0.24, () => {
            TrafficWardenRenderer.drawRadarBlaster(ctx, r, age, b.isEnraged, isDrifting, flash);
        });

        EndlessBossRenderer.endBody(ctx, b);
    }

    static drawSirenAura(ctx, x, y, r, age, isDrifting) {
        ctx.save();
        ctx.translate(x, y);
        const strobe = Math.floor(age / 7) % 2 === 0;
        ctx.strokeStyle = isDrifting
            ? 'rgba(0, 245, 255, 0.88)'
            : (strobe ? 'rgba(255, 71, 87, 0.78)' : 'rgba(30, 144, 255, 0.78)');
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 8]);
        ctx.lineDashOffset = -age * 1.6;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.24, r * 0.46, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }

    static drawDriftStreaks(ctx, driftAngle, r) {
        const dx = -Math.cos(driftAngle);
        const dy = -Math.sin(driftAngle);
        ctx.save();
        ctx.lineCap = 'round';
        for (const [off, col, len] of [[-13, '#00f5ff', 52], [0, '#dfe6e9', 64], [13, '#1e90ff', 48]]) {
            ctx.strokeStyle = col;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(dx * (r * 0.45) - dy * off, r * 0.42 + dy * (r * 0.45) + dx * off);
            ctx.lineTo(dx * (r * 0.45 + len) - dy * off, r * 0.42 + dy * (r * 0.45 + len) + dx * off);
            ctx.stroke();
        }
        ctx.restore();
    }

    static drawScooterWheel(ctx, cx, cy, wr, age, flash) {
        ctx.fillStyle = flash ? '#ffffff' : '#1e272e';
        ctx.beginPath();
        ctx.arc(cx, cy, wr, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        if (flash) return;

        ctx.fillStyle = '#dfe6e9';
        ctx.beginPath();
        ctx.arc(cx, cy, wr * 0.56, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        const spin = age * 0.42;
        ctx.strokeStyle = '#636e72';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const a = spin + (i * Math.PI * 2) / 3;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * wr * 0.48, cy + Math.sin(a) * wr * 0.48);
            ctx.lineTo(cx - Math.cos(a) * wr * 0.48, cy - Math.sin(a) * wr * 0.48);
            ctx.stroke();
        }
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#141418';
    }

    static drawPatrolScooter(ctx, r, age, facingLeft, isDrifting, isEnraged, flash) {
        const wr = r * 0.27;
        // Chrome Exhaust Muffler & Exhaust Puffs
        ctx.fillStyle = flash ? '#ffffff' : '#95a5a6';
        ctx.beginPath();
        ctx.roundRect(-r * 0.96, r * 0.34, r * 0.44, r * 0.14, 5);
        ctx.fill();
        ctx.stroke();

        if (!flash && (isDrifting || isEnraged)) {
            const puff = (age * 0.14) % 1;
            ctx.fillStyle = `rgba(220, 230, 235, ${0.65 * (1 - puff)})`;
            ctx.beginPath();
            ctx.arc(-r * (1.04 + puff * 0.36), r * (0.36 - puff * 0.18), r * (0.08 + puff * 0.08), 0, Math.PI * 2);
            ctx.fill();
        }

        // Front & Rear Alloy Wheels
        TrafficWardenRenderer.drawScooterWheel(ctx, -r * 0.62, r * 0.52, wr, age, flash);
        TrafficWardenRenderer.drawScooterWheel(ctx, r * 0.66, r * 0.52, wr, age, flash);

        // Rear Tall Strobe Police Beacon Mast + Saddle Cargo Box
        if (!flash) {
            ctx.strokeStyle = '#2d3436';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-r * 0.78, r * 0.05);
            ctx.lineTo(-r * 0.84, -r * 0.66);
            ctx.stroke();

            const strobeRed = Math.floor(age / 6) % 2 === 0;
            const beaconCol = strobeRed ? '#ff4757' : '#00f5ff';
            ctx.fillStyle = beaconCol;
            ctx.strokeStyle = '#141418';
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.roundRect(-r * 0.93, -r * 0.80, r * 0.18, r * 0.18, 4);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = strobeRed ? 'rgba(255, 71, 87, 0.28)' : 'rgba(0, 245, 255, 0.28)';
            ctx.beginPath();
            ctx.arc(-r * 0.84, -r * 0.71, r * 0.22, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.lineWidth = 3;
        ctx.strokeStyle = '#141418';

        // Scooter Fairing Bodywork + Front Shield + Tail Box
        ctx.fillStyle = flash ? '#ffffff' : '#0984e3';
        ctx.beginPath();
        ctx.moveTo(-r * 0.86, r * 0.10);
        ctx.lineTo(-r * 0.42, r * 0.02);
        ctx.lineTo(-r * 0.28, r * 0.26);
        ctx.lineTo(r * 0.34, r * 0.26);
        ctx.lineTo(r * 0.42, -r * 0.22);
        ctx.lineTo(r * 0.78, -r * 0.14);
        ctx.lineTo(r * 0.86, r * 0.34);
        ctx.lineTo(r * 0.46, r * 0.46);
        ctx.lineTo(-r * 0.80, r * 0.42);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // White Police Side Panel & Hi-Vis Yellow Strip
        if (!flash) {
            ctx.fillStyle = '#f5f6fa';
            ctx.beginPath();
            ctx.roundRect(-r * 0.74, r * 0.10, r * 0.44, r * 0.24, 5);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#fed330';
            ctx.fillRect(r * 0.42, r * 0.06, r * 0.34, r * 0.09);

            // Fluttering Pink & Yellow Parking Ticket Slips poking from rear box
            const flutter = Math.sin(age * 0.32) * 0.16;
            ctx.save();
            ctx.translate(-r * 0.68, r * 0.06);
            ctx.rotate(-0.35 + flutter);
            ctx.fillStyle = '#ff9ff3';
            ctx.fillRect(-r * 0.08, -r * 0.22, r * 0.14, r * 0.20);
            ctx.strokeRect(-r * 0.08, -r * 0.22, r * 0.14, r * 0.20);
            ctx.rotate(0.28);
            ctx.fillStyle = '#fed330';
            ctx.fillRect(-r * 0.04, -r * 0.24, r * 0.14, r * 0.20);
            ctx.strokeRect(-r * 0.04, -r * 0.24, r * 0.14, r * 0.20);
            ctx.restore();

            EndlessBossRenderer.drawUnmirroredText(
                ctx, facingLeft, 'Δ.Α.', -r * 0.52, r * 0.23,
                '900 8px "Fredoka", Arial, sans-serif', '#0984e3', null, r * 0.40
            );

            // Cushioned Leather Seat
            ctx.fillStyle = '#2d3436';
            ctx.beginPath();
            ctx.roundRect(-r * 0.36, -r * 0.05, r * 0.52, r * 0.16, 6);
            ctx.fill();
            ctx.stroke();

            // Clear Windscreen & Glowing Headlight Cone
            ctx.fillStyle = 'rgba(129, 236, 236, 0.52)';
            ctx.beginPath();
            ctx.moveTo(r * 0.48, -r * 0.20);
            ctx.lineTo(r * 0.58, -r * 0.54);
            ctx.lineTo(r * 0.72, -r * 0.48);
            ctx.lineTo(r * 0.68, -r * 0.16);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = 'rgba(255, 242, 117, 0.22)';
            ctx.beginPath();
            ctx.moveTo(r * 0.80, -r * 0.06);
            ctx.lineTo(r * 1.48, -r * 0.26);
            ctx.lineTo(r * 1.48, r * 0.16);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#fff200';
            ctx.beginPath();
            ctx.arc(r * 0.78, -r * 0.05, r * 0.10, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
    }

    static drawOfficerBody(ctx, r, age, isBack, isEnraged, flash) {
        // Seated Leg & Boot Planted on Scooter Deck
        ctx.fillStyle = flash ? '#ffffff' : '#192a56';
        ctx.beginPath();
        ctx.roundRect(-r * 0.12, -r * 0.02, r * 0.44, r * 0.24, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#1e272e';
        ctx.beginPath();
        ctx.roundRect(r * 0.12, r * 0.16, r * 0.30, r * 0.19, 5);
        ctx.fill();
        ctx.stroke();

        // Officer Navy Tunic + High-Vis Reflective Vest
        ctx.fillStyle = flash ? '#ffffff' : '#1e3799';
        ctx.beginPath();
        ctx.roundRect(-r * 0.36, -r * 0.62, r * 0.68, r * 0.68, [11, 11, 7, 7]);
        ctx.fill();
        ctx.stroke();

        // Off-hand steering arm reaching for the scooter handlebar
        ctx.fillStyle = flash ? '#ffffff' : '#1e3799';
        ctx.beginPath();
        ctx.roundRect(r * 0.08, -r * 0.48, r * 0.42, r * 0.18, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#2d3436';
        ctx.beginPath();
        ctx.arc(r * 0.48, -r * 0.36, r * 0.10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (flash) return;

        // Neon Hi-Vis Safety Vest
        ctx.fillStyle = isEnraged ? '#ffeaa7' : '#badc58';
        ctx.beginPath();
        ctx.roundRect(-r * 0.32, -r * 0.56, r * 0.60, r * 0.54, 6);
        ctx.fill();
        ctx.stroke();

        if (!isBack) {
            ctx.fillStyle = '#ecf0f1';
            ctx.fillRect(-r * 0.30, -r * 0.26, r * 0.56, r * 0.08);
            ctx.fillRect(-r * 0.18, -r * 0.54, r * 0.08, r * 0.46);
            ctx.fillRect(r * 0.08, -r * 0.54, r * 0.08, r * 0.46);

            // Golden Officer Badge & Patrol Belt
            ctx.fillStyle = '#fed330';
            ctx.beginPath();
            ctx.arc(-r * 0.01, -r * 0.40, r * 0.09, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.strokeStyle = '#ecf0f1';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(-r * 0.24, -r * 0.50);
            ctx.lineTo(r * 0.20, -r * 0.12);
            ctx.moveTo(r * 0.20, -r * 0.50);
            ctx.lineTo(-r * 0.24, -r * 0.12);
            ctx.stroke();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#141418';
        }

        // Utility Belt with Silver Buckle
        ctx.fillStyle = '#1e272e';
        ctx.fillRect(-r * 0.34, -r * 0.10, r * 0.64, r * 0.11);
        ctx.fillStyle = '#dfe6e9';
        ctx.fillRect(-r * 0.07, -r * 0.11, r * 0.16, r * 0.13);
        ctx.strokeRect(-r * 0.07, -r * 0.11, r * 0.16, r * 0.13);
    }

    static drawOfficerHead(ctx, r, isBack, isEnraged, flash) {
        ctx.save();
        ctx.translate(-r * 0.02, -r * 0.88);

        ctx.fillStyle = flash ? '#ffffff' : '#f3c18c';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.33, r * 0.31, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Dark hair under cap (full back hair when facing away)
        ctx.fillStyle = flash ? '#ffffff' : '#2d3436';
        ctx.beginPath();
        if (isBack) {
            ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2);
        } else {
            ctx.arc(0, -r * 0.08, r * 0.31, Math.PI, Math.PI * 2);
        }
        ctx.fill();
        ctx.stroke();

        if (!flash && !isBack) {
            // Mirrored Police Aviator Sunglasses
            ctx.fillStyle = '#1e272e';
            ctx.strokeStyle = '#dfe6e9';
            ctx.lineWidth = 2;
            for (const lx of [-r * 0.10, r * 0.14]) {
                ctx.beginPath();
                ctx.roundRect(lx - r * 0.11, -r * 0.10, r * 0.22, r * 0.14, 4);
                ctx.fill();
                ctx.stroke();
            }
            ctx.strokeStyle = isEnraged ? '#ff4757' : '#00d2d3';
            ctx.beginPath();
            ctx.moveTo(-r * 0.16, -r * 0.06);
            ctx.lineTo(-r * 0.06, r * 0.01);
            ctx.moveTo(r * 0.08, -r * 0.06);
            ctx.lineTo(r * 0.18, r * 0.01);
            ctx.stroke();

            // Mustache + Clenched Silver Traffic Whistle
            ctx.fillStyle = '#2d3436';
            ctx.strokeStyle = '#141418';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.roundRect(-r * 0.12, r * 0.07, r * 0.28, r * 0.065, 3);
            ctx.fill();

            ctx.fillStyle = '#dfe6e9';
            ctx.beginPath();
            ctx.roundRect(r * 0.06, r * 0.14, r * 0.20, r * 0.09, 3);
            ctx.fill();
            ctx.stroke();
        }

        // Peaked Greek Traffic Officer Cap + Gold Emblem
        ctx.strokeStyle = '#141418';
        ctx.lineWidth = 2.6;
        ctx.fillStyle = flash ? '#ffffff' : '#f5f6fa';
        ctx.beginPath();
        ctx.roundRect(-r * 0.35, -r * 0.38, r * 0.70, r * 0.22, [9, 9, 3, 3]);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            ctx.fillStyle = '#fed330';
            ctx.fillRect(-r * 0.34, -r * 0.22, r * 0.68, r * 0.07);
            if (!isBack) {
                ctx.fillStyle = '#1e272e';
                ctx.beginPath();
                ctx.ellipse(r * 0.05, -r * 0.15, r * 0.34, r * 0.07, 0.05, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#fed330';
                ctx.beginPath();
                ctx.arc(r * 0.03, -r * 0.29, r * 0.08, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    static drawRadarBlaster(ctx, r, age, isEnraged, isDrifting, flash) {
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#141418';

        // Radar Housing Barrel + Megaphone Cone
        ctx.fillStyle = flash ? '#ffffff' : '#2f3640';
        ctx.beginPath();
        ctx.roundRect(r * 0.06, -r * 0.15, r * 0.68, r * 0.30, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#f5f6fa';
        ctx.beginPath();
        ctx.moveTo(r * 0.70, -r * 0.14);
        ctx.lineTo(r * 1.04, -r * 0.25);
        ctx.lineTo(r * 1.04, r * 0.25);
        ctx.lineTo(r * 0.70, r * 0.14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            ctx.fillStyle = '#ff4757';
            ctx.fillRect(r * 0.96, -r * 0.23, r * 0.08, r * 0.46);
            ctx.strokeRect(r * 0.96, -r * 0.23, r * 0.08, r * 0.46);
        }

        if (!flash) {
            // Red Digital Speed Trap Readout & Pulsing Sonic Arc
            ctx.fillStyle = '#141418';
            ctx.fillRect(r * 0.18, -r * 0.10, r * 0.36, r * 0.14);
            ctx.fillStyle = isEnraged ? '#ff4757' : '#2ed573';
            ctx.fillRect(r * 0.22, -r * 0.07, r * 0.28, r * 0.08);

            if (isEnraged || isDrifting) {
                const waveR = r * (0.28 + ((age * 0.08) % 0.22));
                ctx.strokeStyle = 'rgba(0, 245, 255, 0.85)';
                ctx.lineWidth = 2.4;
                ctx.beginPath();
                ctx.arc(r * 1.04, 0, waveR, -0.55, 0.55);
                ctx.stroke();
            }
        }

        // Gloved Trigger Hand
        ctx.strokeStyle = '#141418';
        ctx.lineWidth = 2.5;
        ctx.fillStyle = flash ? '#ffffff' : '#2d3436';
        ctx.beginPath();
        ctx.arc(r * 0.16, r * 0.08, r * 0.11, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}

if (typeof window !== 'undefined') {
    window.TrafficWardenRenderer = TrafficWardenRenderer;
}
