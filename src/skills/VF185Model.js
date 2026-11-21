/**
 * Lesa.io - 2.5D Rideable SYM VF185 Underbone Motorcycle Model & FX
 * Modeled faithfully after assets/VF185.jpg:
 *   - Gloss Obsidian Black angular underbone cowling with Magenta/White racing slashes
 *   - Round silver SYM front crest, sharp V-twin LED headlamps + headlight beam cone
 *   - 17-inch twin-spoke black alloy wheels with white rim tape, silver petal rotors & gold calipers
 *   - Exposed silver aluminum radiator, chrome telescopic forks + amber fork reflector
 *   - Stepped charcoal dual seat, swept matte exhaust muffler & silver passenger footpeg bracket
 */

class VF185Model {
    static _wheelSprite = null;

    static recordStep(player, dt, effects) {
        if (!player._vfSkids) player._vfSkids = [];
        const speed = Math.hypot(player.vx || 0, player.vy || 0);
        player._vfWheelSpin = (player._vfWheelSpin || 0) + (0.12 + speed * 0.042) * dt;

        // Smoothly steer bike chassis toward movement direction
        const targetAng = speed > 0.4 ? Math.atan2(player.vy, player.vx) : (player.angle || 0);
        if (!Number.isFinite(player.vf185Angle)) player.vf185Angle = targetAng;
        let diff = targetAng - player.vf185Angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        player.vf185Angle += diff * Math.min(1, 0.28 * dt);

        // Tire tracks & exhaust nitro pops
        if (speed > 1.0) {
            if ((Math.abs(diff) > 0.12 || player.isDashing || Math.random() < 0.42 * dt) && player._vfSkids.length < 44) {
                player._vfSkids.push({
                    x: player.x - Math.cos(player.vf185Angle) * 14,
                    y: player.y + 12 - Math.sin(player.vf185Angle) * 6,
                    ang: player.vf185Angle,
                    alpha: player.isDashing ? 0.65 : 0.38
                });
            }
            if (effects && Math.random() < (player.isDashing ? 0.85 : 0.35) * dt) {
                const exX = player.x - Math.cos(player.vf185Angle) * 28;
                const exY = player.y + 4 - Math.sin(player.vf185Angle) * 14;
                effects.addDust(exX, exY, 1, player.isDashing ? 8 : 4);
                if (player.isDashing || Math.random() < 0.25) {
                    effects.addSparks(exX, exY, Math.random() < 0.5 ? '#ff4785' : '#fed330', 2);
                }
            }
        }

        for (let i = player._vfSkids.length - 1; i >= 0; i--) {
            player._vfSkids[i].alpha -= 0.015 * dt;
            if (player._vfSkids[i].alpha <= 0) player._vfSkids.splice(i, 1);
        }
    }

    static drawTireSkids(player, ctx) {
        if (!player._vfSkids || player._vfSkids.length === 0) return;
        ctx.save();
        for (let i = 0; i < player._vfSkids.length; i++) {
            const s = player._vfSkids[i];
            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate(s.ang);
            ctx.fillStyle = `rgba(20, 20, 26, ${s.alpha})`;
            ctx.fillRect(-10, -4, 18, 4);
            ctx.fillRect(-10, 2, 18, 4);
            ctx.restore();
        }
        ctx.restore();
    }

    static drawMountedPetros(player, ctx, flash, wheelieAngle = 0) {
        const ang = Number.isFinite(player.vf185Angle) ? player.vf185Angle : (player.angle || 0);
        const cosA = Math.cos(ang);
        const sinA = Math.sin(ang);
        const spin = player._vfWheelSpin || 0;
        const speed = Math.hypot(player.vx || 0, player.vy || 0);
        const rumble = speed > 0.5 ? Math.sin(spin * 2) * 1.1 : Math.sin(Date.now() * 0.04) * 0.45;
        const facingLeft = cosA < 0;
        const isVerticalView = Math.abs(cosA) < 0.36;

        ctx.save();
        // Forward twin-LED headlight cone illuminating the ground
        ctx.save();
        ctx.translate(0, 6);
        ctx.rotate(ang);
        const beamGrad = ctx.createRadialGradient(24, 0, 4, 96, 0, 120);
        beamGrad.addColorStop(0, 'rgba(215, 248, 255, 0.38)');
        beamGrad.addColorStop(0.55, 'rgba(140, 225, 255, 0.14)');
        beamGrad.addColorStop(1, 'rgba(100, 200, 255, 0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(16, -6);
        ctx.lineTo(155, -54);
        ctx.lineTo(155, 54);
        ctx.lineTo(16, 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Dark road contact shadow underneath both tires
        ctx.fillStyle = 'rgba(10, 12, 18, 0.42)';
        ctx.beginPath();
        ctx.ellipse(0, 18, isVerticalView ? 22 : 44, 13, 0, 0, Math.PI * 2);
        ctx.fill();

        // Subtle magenta & cyan VF185 underglow
        ctx.fillStyle = 'rgba(255, 71, 133, 0.18)';
        ctx.beginPath();
        ctx.ellipse(0, 14, isVerticalView ? 18 : 36, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.translate(0, rumble);

        if (isVerticalView) {
            if (wheelieAngle !== 0) {
                ctx.translate(0, wheelieAngle * 14);
                ctx.scale(1, 1 + Math.abs(wheelieAngle) * 0.25);
            }
            this._drawVerticalStance(player, ctx, sinA < 0, flash, spin, speed);
        } else {
            this._drawSideStance(player, ctx, facingLeft, sinA < -0.25, flash, spin, speed, wheelieAngle);
        }
        ctx.restore();
    }

    static _drawWheel(ctx, x, y, r, spin, isRear) {
        const ink = '#0b0c10';
        ctx.save();
        ctx.translate(x, y);

        // Wide tubeless tire
        ctx.fillStyle = '#181920';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Alloy rim bed + White rim tape arcs
        ctx.fillStyle = '#242731';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 1.6;
        ctx.save();
        ctx.rotate(spin);
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.70, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // 5 Sporty Twin-Spokes
        ctx.strokeStyle = '#383d4a';
        ctx.lineWidth = 2.1;
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * 2.5, Math.sin(a) * 2.5);
            ctx.lineTo(Math.cos(a) * r * 0.65, Math.sin(a) * r * 0.65);
            ctx.stroke();
        }
        ctx.restore();

        // Silver Wave Petal Brake Rotor (250mm Front / 200mm Rear)
        const discR = isRear ? r * 0.42 : r * 0.50;
        ctx.fillStyle = '#d2dae2';
        ctx.strokeStyle = '#636e72';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, discR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Iconic Yellow-Gold SYM VF185 Brake Caliper
        ctx.fillStyle = '#eccc3b';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        if (isRear) {
            ctx.roundRect(1, -discR - 2, 7, 6, 1.8);
        } else {
            ctx.roundRect(-discR - 2, -5, 6.5, 8.5, 2);
        }
        ctx.fill();
        ctx.stroke();

        // Axle nut
        ctx.fillStyle = '#57606f';
        ctx.beginPath();
        ctx.arc(0, 0, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    static _drawSideStance(player, ctx, facingLeft, isBack, flash, spin, speed, wheelieAngle = 0) {
        const ink = '#0b0c10';
        ctx.save();
        if (facingLeft) ctx.scale(-1, 1);
        if (wheelieAngle) {
            ctx.translate(-27, 4);
            ctx.rotate(wheelieAngle);
            ctx.translate(27, -4);
        }

        // 1. Rear & Front 17" Alloy Wheels
        this._drawWheel(ctx, -27, 4, 15.5, spin, true);
        this._drawWheel(ctx, 29, 4, 15.0, spin, false);

        // 2. Central Engine Belly + Chrome Telescopic Front Fork + Silver Radiator
        ctx.fillStyle = flash ? '#ffffff' : '#1f222a';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.roundRect(-14, -2, 26, 14, 3);
        ctx.fill();
        ctx.stroke();

        // Exposed Silver Radiator Grille behind front fork
        ctx.fillStyle = flash ? '#ffffff' : '#cfd6de';
        ctx.strokeStyle = '#4b5563';
        ctx.lineWidth = 1.3;
        ctx.fillRect(10, -14, 10, 11);
        ctx.strokeRect(10, -14, 10, 11);

        // Chrome Front Fork Tube + Amber Circular Side Reflector
        ctx.strokeStyle = flash ? '#ffffff' : '#e2e8f0';
        ctx.lineWidth = 4.2;
        ctx.beginPath();
        ctx.moveTo(19, -24);
        ctx.lineTo(29, 4);
        ctx.stroke();
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(19, -24);
        ctx.lineTo(29, 4);
        ctx.stroke();
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.arc(24, -6, 2.4, 0, Math.PI * 2);
        ctx.fill();

        // Gloss Black Front Fender with tiny Magenta ABS line
        ctx.fillStyle = flash ? '#ffffff' : '#161820';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(13, -7);
        ctx.quadraticCurveTo(28, -16, 42, -7);
        ctx.quadraticCurveTo(30, -9, 15, -3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        if (!flash) {
            ctx.strokeStyle = '#ff4785';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(25, -12);
            ctx.lineTo(32, -10);
            ctx.stroke();
        }

        // 3. Gloss Obsidian Underbone Frame & Front Nose Shield
        const bodyGrad = ctx.createLinearGradient(-34, -26, 30, 8);
        bodyGrad.addColorStop(0, flash ? '#ffffff' : '#262933');
        bodyGrad.addColorStop(0.55, flash ? '#f1f2f6' : '#15171e');
        bodyGrad.addColorStop(1, flash ? '#dfe4ea' : '#0b0c10');

        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(-36, -18);
        ctx.lineTo(-10, -21);
        ctx.lineTo(-2, -12);
        ctx.lineTo(14, -28);
        ctx.lineTo(28, -22);
        ctx.lineTo(20, 4);
        ctx.lineTo(4, 10);
        ctx.lineTo(-15, 7);
        ctx.lineTo(-34, -10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Exact VF185 Magenta-Pink & White Racing Decals on Leg Shield + Nose
        if (!flash) {
            ctx.fillStyle = '#ff4785';
            ctx.beginPath();
            ctx.moveTo(5, -6);
            ctx.lineTo(18, -20);
            ctx.lineTo(21, -15);
            ctx.lineTo(8, -1);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(7, -3);
            ctx.lineTo(19, -15);
            ctx.lineTo(20, -12);
            ctx.lineTo(9, 1);
            ctx.closePath();
            ctx.fill();

            // Upper nose magenta accent + round silver SYM badge
            ctx.fillStyle = '#ff4785';
            ctx.fillRect(15, -24, 9, 2.6);
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.arc(24, -19, 2.3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Sharp V-Twin LED Headlight Pod
        ctx.fillStyle = '#dff9fb';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(21, -22);
        ctx.lineTo(29, -19);
        ctx.lineTo(24, -15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 4. Mounted Hero Petros sitting cleanly on the Seat
        this._drawRiderBody(player, ctx, flash, false);

        // 5. Stepped Charcoal Seat rim & Silver Cast Rear Footpeg Bracket + Swept Exhaust Muffler
        ctx.fillStyle = flash ? '#ffffff' : '#2d323e';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.roundRect(-34, -22, 29, 7, 3);
        ctx.fill();
        ctx.stroke();

        // Matte-black swept muffler with silver guard
        ctx.fillStyle = flash ? '#ffffff' : '#23262e';
        ctx.beginPath();
        ctx.moveTo(-12, 6);
        ctx.lineTo(-37, -3);
        ctx.lineTo(-39, -10);
        ctx.lineTo(-9, 1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Nitrous exhaust backfire spark when boosting/moving fast
        if (speed > 2.5) {
            const p = (Math.sin(Date.now() * 0.06) + 1) * 0.5;
            ctx.fillStyle = player.isDashing ? '#00f5ff' : '#ff9f1a';
            ctx.beginPath();
            ctx.ellipse(-41 - p * 4, -7, 4 + p * 3, 2.2, -0.35, 0, Math.PI * 2);
            ctx.fill();
        }

        // Brushed Aluminum Rear Passenger Footpeg Bracket
        ctx.fillStyle = flash ? '#ffffff' : '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(-14, -4);
        ctx.lineTo(-4, -8);
        ctx.lineTo(-6, 4);
        ctx.lineTo(-16, 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Stealth Handlebar Cowl + Grip + Silver Brake Lever
        ctx.fillStyle = flash ? '#ffffff' : '#2c313d';
        ctx.beginPath();
        ctx.roundRect(7, -33, 14, 8, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#111217';
        ctx.fillRect(6, -30, 8, 4);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(9, -28);
        ctx.lineTo(4, -27);
        ctx.stroke();

        ctx.restore();
    }

    static _drawVerticalStance(player, ctx, facingUp, flash, spin, speed) {
        const ink = '#0b0c10';
        ctx.save();

        // Vertical tire silhouette
        ctx.fillStyle = '#181920';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.roundRect(-7, facingUp ? -6 : -2, 14, 24, 6);
        ctx.fill();
        ctx.stroke();

        // Gold caliper glint on side of wheel
        ctx.fillStyle = '#eccc3b';
        ctx.fillRect(facingUp ? -9 : 5, 4, 4, 6);

        if (!facingUp) {
            // Front Fairing View: Gloss Black Apron, Magenta Nose Slashes, Silver Radiator & Twin LED Eyes
            ctx.fillStyle = flash ? '#ffffff' : '#161820';
            ctx.beginPath();
            ctx.moveTo(-15, -24);
            ctx.lineTo(15, -24);
            ctx.lineTo(11, 2);
            ctx.lineTo(-11, 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Front Twin V-Shaped LEDs & SYM Crest
            ctx.fillStyle = '#dff9fb';
            ctx.beginPath();
            ctx.moveTo(-13, -18); ctx.lineTo(-3, -13); ctx.lineTo(-12, -11); ctx.closePath();
            ctx.moveTo(13, -18); ctx.lineTo(3, -13); ctx.lineTo(12, -11); ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#ff4785';
            ctx.fillRect(-13, -22, 7, 2.5);
            ctx.fillRect(6, -22, 7, 2.5);
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath(); ctx.arc(0, -16, 2.6, 0, Math.PI * 2); ctx.fill();

            // Wide Handlebars + Brake Levers
            ctx.fillStyle = '#111217';
            ctx.beginPath();
            ctx.roundRect(-21, -32, 42, 6, 3);
            ctx.fill();
            ctx.stroke();
        } else {
            // Rear View: Chunky Black Exhaust Side + Crimson Tail LED Bar
            ctx.fillStyle = flash ? '#ffffff' : '#23262e';
            ctx.fillRect(8, -6, 6, 16);
            ctx.strokeRect(8, -6, 6, 16);
            ctx.fillStyle = '#161820';
            ctx.beginPath();
            ctx.roundRect(-13, -20, 26, 20, 6);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#ff3838';
            ctx.fillRect(-9, -17, 18, 4.5);
        }

        this._drawRiderBody(player, ctx, flash, true, facingUp);
        if (speed > 2.5 && facingUp) {
            ctx.fillStyle = '#ff9f1a';
            ctx.beginPath(); ctx.arc(11, 13, 3.2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }

    static _drawRiderBody(player, ctx, flash, vertical = false, facingUp = false) {
        const r = (player.radius || 26) * 0.78;
        ctx.save();
        ctx.translate(vertical ? 0 : -11, vertical ? -20 : -24);

        // Mounted cargo leg & Nike sneaker gripping footpeg
        ctx.fillStyle = flash ? '#ffffff' : '#242426';
        ctx.strokeStyle = '#0f0f11';
        ctx.lineWidth = 2.0;
        if (!vertical) {
            ctx.beginPath();
            ctx.roundRect(-4, 6, 10, 14, 3);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#1e272e';
            ctx.fillRect(-3, 18, 12, 5);
        }

        // Petros's signature Royal-Blue Puffer Jacket & Head
        if (typeof PetrosHero !== 'undefined' && typeof PetrosHero.drawLikeness === 'function') {
            PetrosHero.drawLikeness(ctx, r, flash, 1, facingUp);
        }

        // Rider's Blue Puffer Arm reaching cleanly forward onto the VF185 handlebar
        if (!vertical) {
            ctx.strokeStyle = '#0f2f5c';
            ctx.lineWidth = 6.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(4, -5);
            ctx.lineTo(18, -3);
            ctx.stroke();
            ctx.strokeStyle = flash ? '#ffffff' : '#1e70d6';
            ctx.lineWidth = 4.2;
            ctx.stroke();
            ctx.fillStyle = flash ? '#ffffff' : '#e0a97c';
            ctx.beginPath();
            ctx.arc(19, -3, 3.6, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.VF185Model = VF185Model;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VF185Model;
}
