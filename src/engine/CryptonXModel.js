/**
 * Lesa.io - White Yamaha Crypton X 135 (T135) & Mounted 50balos Model
 * Styled after the iconic Greek pearl-white Crypton X 135 underbone:
 *   - Slim 17" black multi-spoke alloy wheels with white rim tape & 220mm front disc + gold caliper
 *   - Pearl-white angular front leg shield with matte-black side air-vent scoops, red/gold decals & diamond headlight
 *   - Central exposed vertical SOHC engine + yellow Monocross rear monoshock & rectangular swingarm
 *   - Swept pearl-white tail cowl with split LED taillight + upswept black/chrome exhaust muffler
 *   - 50balos riding in navy/cobalt TIMES tracksuit, curly taper fade, charcoal joggers & Cream/Black AJ1s
 */

class CryptonXModel {
    static recordStep(player, dt, effects) {
        if (typeof HeroUltimates !== 'undefined' && HeroUltimates.stepBikeChassis) {
            HeroUltimates.stepBikeChassis(player, dt, effects, 'cryptonXAngle', '_cxWheelSpin', '_cxSkids', '#ff6b35');
        }
    }

    static drawTireSkids(player, ctx) {
        if (typeof HeroUltimates !== 'undefined' && HeroUltimates.drawBikeSkids) {
            HeroUltimates.drawBikeSkids(player, ctx, '_cxSkids');
        }
    }

    static drawMounted50Balos(rider, ctx, flash = false, wheelieAngle = 0) {
        const ang = Number.isFinite(rider.cryptonXAngle) ? rider.cryptonXAngle : (Number.isFinite(rider.angle) ? rider.angle : 0);
        const cosA = Math.cos(ang);
        const sinA = Math.sin(ang);
        const spin = Number.isFinite(rider._cxWheelSpin) ? rider._cxWheelSpin : (rider._spin || 0);
        const speed = Math.hypot(rider.vx || 0, rider.vy || 0);
        const rumble = speed > 0.5 ? Math.sin(spin * 2.2) * 0.95 : (rider.cryptonXActive ? Math.sin(Date.now() * 0.05) * 0.45 : 0);
        const facingLeft = cosA < 0;
        const isVertical = Math.abs(cosA) < 0.36;

        ctx.save();
        // Bright multi-reflector halogen/LED diamond headlight cone
        ctx.save();
        ctx.translate(0, 5);
        ctx.rotate(ang);
        const beam = ctx.createRadialGradient(20, 0, 4, 88, 0, 108);
        beam.addColorStop(0, 'rgba(255, 250, 224, 0.36)');
        beam.addColorStop(0.55, 'rgba(241, 245, 249, 0.13)');
        beam.addColorStop(1, 'rgba(241, 245, 249, 0)');
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(15, -5);
        ctx.lineTo(138, -46);
        ctx.lineTo(138, 46);
        ctx.lineTo(15, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Dark road contact shadow underneath the slim 17" tires
        ctx.fillStyle = 'rgba(10, 12, 18, 0.40)';
        ctx.beginPath();
        ctx.ellipse(0, 17, isVertical ? 20 : 41, 11.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Crisp white/gold underglow accent (hot exhaust orange glow while Crypton X ulti is active)
        ctx.fillStyle = rider.cryptonXActive ? 'rgba(255, 107, 53, 0.24)' : 'rgba(248, 250, 252, 0.14)';
        ctx.beginPath();
        ctx.ellipse(0, 13, isVertical ? 16 : 33, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.translate(0, rumble);

        if (isVertical) {
            if (wheelieAngle !== 0) {
                ctx.translate(0, wheelieAngle * 13);
                ctx.scale(1, 1 + Math.abs(wheelieAngle) * 0.22);
            }
            this._drawVerticalStance(rider, ctx, sinA < 0, flash, speed);
        } else {
            this._drawSideStance(rider, ctx, facingLeft, flash, spin, speed, wheelieAngle);
        }
        ctx.restore();
    }

    static _drawWheel(ctx, x, y, r, spin, isRear) {
        const ink = '#0b0c10';
        ctx.save();
        ctx.translate(x, y);

        // Slimmer 17-inch Crypton X underbone rubber (60/100F, 80/90R)
        ctx.fillStyle = '#181920';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Cast alloy rim + crisp white rim tape
        ctx.fillStyle = '#222631';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.67, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.65, spin, spin + Math.PI * 0.65);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.65, spin + Math.PI, spin + Math.PI * 1.65);
        ctx.stroke();

        // 5 Y-spokes in matte gunmetal-black
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.6;
        for (let i = 0; i < 5; i++) {
            const a = spin + (i * Math.PI * 2) / 5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62);
            ctx.stroke();
        }

        if (!isRear) {
            // 220mm front hydraulic ventilated wave disc + gold caliper
            ctx.fillStyle = '#cbd5e1';
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.44, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#eab308';
            ctx.strokeStyle = ink;
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.roundRect(-4.6, -4.4, 4.0, 6.2, 1.3);
            ctx.fill();
            ctx.stroke();
        } else {
            // Rear drum hub + silver chain adjuster
            ctx.fillStyle = '#94a3b8';
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    static _drawSideStance(rider, ctx, facingLeft, flash, spin, speed, wheelieAngle = 0) {
        const ink = '#0b0c10';
        ctx.save();
        if (facingLeft) ctx.scale(-1, 1);
        if (wheelieAngle) {
            ctx.translate(-25, 4);
            ctx.rotate(wheelieAngle);
            ctx.translate(25, -4);
        }

        // 1. Slim 17" Wheels
        this._drawWheel(ctx, -25, 4, 14.5, spin, true);
        this._drawWheel(ctx, 27, 4, 14.0, spin, false);

        // 2. Rectangular Swingarm + Iconic Yellow Monocross Central Shock + 135cc Vertical Engine
        ctx.fillStyle = flash ? '#ffffff' : '#64748b';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.roundRect(-27, 1, 21, 5.5, 2.5);
        ctx.fill();
        ctx.stroke();

        // Exposed yellow monoshock coil tucked diagonally above swingarm
        ctx.strokeStyle = flash ? '#ffffff' : '#facc15';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(-14, 1);
        ctx.lineTo(-9, -11);
        ctx.stroke();

        // Liquid-cooled 135cc Crankcase & Vertical Cylinder + Radiator Shroud
        ctx.fillStyle = flash ? '#ffffff' : '#334155';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        ctx.roundRect(-9, -5, 16, 11, 3.5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(-1, 1, 3.6, 0, Math.PI * 2);
        ctx.fill();

        // Telescopic Front Fork + Pearl-White Front Mudguard
        ctx.strokeStyle = flash ? '#ffffff' : '#cbd5e1';
        ctx.lineWidth = 3.6;
        ctx.beginPath();
        ctx.moveTo(27, 4);
        ctx.lineTo(17, -23);
        ctx.stroke();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 4.6;
        ctx.beginPath();
        ctx.moveTo(27, 4);
        ctx.lineTo(22.5, -9);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(27, 3, 16, Math.PI * 1.15, Math.PI * 1.88);
        ctx.lineTo(38, -6);
        ctx.quadraticCurveTo(28, -14, 14, -7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 3. Signature Pure-White Crypton X Fairing, Side Spine Cowl, Deep Leg Shield & Swept Tail
        const whiteBody = '#ffffff';
        // Step-through center spine trim (dark top strip + white side fairing wrap)
        ctx.fillStyle = flash ? '#ffffff' : '#334155';
        ctx.beginPath();
        ctx.moveTo(-6, -16);
        ctx.lineTo(13, -15);
        ctx.lineTo(11, -11);
        ctx.lineTo(-7, -12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = whiteBody;
        ctx.beginPath();
        ctx.moveTo(-7, -12);
        ctx.lineTo(11, -11);
        ctx.lineTo(9, -3);
        ctx.lineTo(-7, -4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Pearl-white swept rear tail cowl + underseat paneling
        ctx.fillStyle = whiteBody;
        ctx.beginPath();
        ctx.moveTo(-36, -15);
        ctx.lineTo(-10, -17);
        ctx.lineTo(-2, -13);
        ctx.lineTo(-6, -3);
        ctx.lineTo(-32, -8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Red & gold T135 racing graphic slash on tail panel
        if (!flash) {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.moveTo(-33, -13);
            ctx.lineTo(-13, -14);
            ctx.lineTo(-15, -11);
            ctx.lineTo(-31, -10);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#eab308';
            ctx.fillRect(-26, -10, 12, 1.8);
        }

        // Crisp split red tail lens & rear chrome grab rail
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-37, -14, 4, 4.5);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-34, -17);
        ctx.lineTo(-26, -18);
        ctx.stroke();

        // Wide angular pearl-white Front Leg Shield + Aerodynamic Side Vent Scoop
        ctx.fillStyle = whiteBody;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.1;
        ctx.beginPath();
        ctx.moveTo(9, -24);
        ctx.lineTo(25, -20);
        ctx.lineTo(22, -6);
        ctx.lineTo(9, -2);
        ctx.lineTo(6, -15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            // Matte-black recessed air vent + Yamaha crest & red/gold shield accent
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.moveTo(13, -14);
            ctx.lineTo(20, -13);
            ctx.lineTo(18, -7);
            ctx.lineTo(11, -8);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.moveTo(11, -21);
            ctx.lineTo(22, -18);
            ctx.lineTo(21, -15.5);
            ctx.lineTo(11, -18.5);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath();
            ctx.arc(19, -18, 2.0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Front Shield Multi-Reflector Headlight + Integrated Amber Blinker Glint
        ctx.fillStyle = '#fef9c3';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(22, -19);
        ctx.lineTo(28, -16);
        ctx.lineTo(23, -12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fb923c';
        ctx.fillRect(21, -13, 3.2, 2.2);

        // 4. Mounted 50balos Sitting on the Seat
        this._drawRiderBody(rider, ctx, flash, false, false);

        // 5. Stepped Charcoal Seat + Upswept Exhaust Silencer + Pearl-White Handlebar Cowl
        ctx.fillStyle = flash ? '#ffffff' : '#1f2937';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        ctx.roundRect(-30, -21, 25, 6.2, 2.8);
        ctx.fill();
        ctx.stroke();

        // Signature upswept right-side aftermarket/stock silencer with brushed chrome guard
        ctx.fillStyle = flash ? '#ffffff' : '#1e293b';
        ctx.beginPath();
        ctx.moveTo(-7, 6);
        ctx.lineTo(-35, -3);
        ctx.lineTo(-37, -9);
        ctx.lineTo(-5, 1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = flash ? '#ffffff' : '#e2e8f0';
        ctx.fillRect(-31, -6, 14, 3);

        if (rider.cryptonXActive) {
            const p = (Math.sin(Date.now() * 0.055) + 1) * 0.5;
            const len = speed > 2.2 ? (14 + p * 8) : (8 + p * 4);
            ctx.fillStyle = '#ff4757';
            ctx.beginPath();
            ctx.moveTo(-36, -9);
            ctx.lineTo(-39 - len, -7.5 - p * 2.5);
            ctx.lineTo(-37 - len * 0.55, -5.5);
            ctx.lineTo(-39 - len * 0.9, -2.5 + p * 1.5);
            ctx.lineTo(-35, -3);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ffa502';
            ctx.beginPath();
            ctx.ellipse(-40 - p * 4.5, -6, 5.5 + p * 3.5, 2.7, -0.25, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff3b0';
            ctx.beginPath();
            ctx.ellipse(-38 - p * 2.5, -6, 3.0 + p * 1.8, 1.5, -0.25, 0, Math.PI * 2);
            ctx.fill();
        } else if (speed > 2.5) {
            const p = (Math.sin(Date.now() * 0.06) + 1) * 0.5;
            ctx.fillStyle = rider.wheeliePitch < -0.15 ? '#facc15' : '#cbd5e1';
            ctx.beginPath();
            ctx.ellipse(-39 - p * 3.5, -7, 3.6 + p * 2.5, 2.0, -0.3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Pearl-white handlebar cowl + black grip + silver brake lever
        ctx.fillStyle = whiteBody;
        ctx.beginPath();
        ctx.roundRect(7, -31, 13, 7.2, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(6, -28.5, 7, 3.6);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(8, -26.5);
        ctx.lineTo(3, -25.5);
        ctx.stroke();

        ctx.restore();
    }

    static _drawVerticalStance(rider, ctx, facingUp, flash, speed) {
        const ink = '#0b0c10';
        ctx.save();

        // Slim 17" vertical tire silhouette
        ctx.fillStyle = '#181920';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.roundRect(-6, facingUp ? -6 : -2, 12, 23, 5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#eab308';
        ctx.fillRect(facingUp ? -8 : 4, 4, 3.5, 5.5);

        if (!facingUp) {
            // Front View: Iconic wide Pure-White Crypton X Shield, White Front Fender, Diamond Headlight & Blinker Cheeks
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(-5.5, -2, 11, 11, 3.5);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(-14, -23);
            ctx.lineTo(14, -23);
            ctx.lineTo(10, 2);
            ctx.lineTo(-10, 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Red racing cheeks + large diamond headlight
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(-13, -19, 5, 2.4);
            ctx.fillRect(8, -19, 5, 2.4);
            ctx.fillStyle = '#fef9c3';
            ctx.beginPath();
            ctx.moveTo(0, -21);
            ctx.lineTo(6.5, -15);
            ctx.lineTo(0, -10);
            ctx.lineTo(-6.5, -15);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // Amber integrated front turn signals
            ctx.fillStyle = '#fb923c';
            ctx.fillRect(-12, -13, 4.5, 3);
            ctx.fillRect(7.5, -13, 4.5, 3);

            // White handlebar cowl + grips
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(-19, -31, 38, 6.5, 3);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-20, -29.5, 6, 4);
            ctx.fillRect(14, -29.5, 6, 4);
        } else {
            // Rear View: Upswept right exhaust pipe + Pure-White Tail + Red Split Taillight
            ctx.fillStyle = flash ? '#ffffff' : '#1e293b';
            ctx.fillRect(7, -6, 5.5, 15);
            ctx.strokeRect(7, -6, 5.5, 15);
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(-12, -20, 24, 19, 5);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(-8, -17, 16, 4.2);
        }

        this._drawRiderBody(rider, ctx, flash, true, facingUp);
        if ((speed > 2.5 || rider.cryptonXActive) && facingUp) {
            const p = (Math.sin(Date.now() * 0.055) + 1) * 0.5;
            if (rider.cryptonXActive) {
                ctx.fillStyle = '#ff4757';
                ctx.beginPath();
                ctx.ellipse(10, 14 + p * 4, 4.2 + p * 1.4, 6.2 + p * 2.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff3b0';
                ctx.beginPath();
                ctx.arc(10, 12 + p * 2, 2.6, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = '#facc15';
                ctx.beginPath();
                ctx.arc(10, 12, 2.8, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    static _drawRiderBody(rider, ctx, flash, vertical = false, facingUp = false) {
        const r = (rider.radius || 24) * 0.78;
        const isKitsos = !!(rider && rider.heroType === 'kitsos');
        ctx.save();
        ctx.translate(vertical ? 0 : -10, vertical ? -20 : -23);

        // Mounted leg & sneaker resting on footpeg (Kitsos shorts + AJ1 or 50balos joggers + AJ1)
        if (!vertical) {
            ctx.fillStyle = flash ? '#ffffff' : (isKitsos ? '#782832' : '#191a1f');
            ctx.strokeStyle = '#090a0d';
            ctx.lineWidth = 1.9;
            ctx.beginPath();
            ctx.roundRect(-4, 5, 9.5, isKitsos ? 9 : 13, 3);
            ctx.fill();
            ctx.stroke();

            if (isKitsos) {
                ctx.fillStyle = flash ? '#ffffff' : '#dfa575';
                ctx.fillRect(-2.5, 13.5, 6.5, 3);
                ctx.strokeRect(-2.5, 13.5, 6.5, 3);
            }

            ctx.fillStyle = flash ? '#ffffff' : (isKitsos ? '#141416' : '#e2d8c5');
            ctx.beginPath();
            ctx.roundRect(-3, 16, 12, 5.5, 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = isKitsos ? '#95a5a6' : '#111216';
            ctx.fillRect(4, 16.5, 5, 4);
        }

        // Exact rider head + torso likeness (Kitsos or 50balos)
        if (isKitsos && typeof KitsosHero !== 'undefined' && typeof KitsosHero.drawLikeness === 'function') {
            KitsosHero.drawLikeness(ctx, r, flash, 1, facingUp);
        } else if (typeof FiftyBalosHero !== 'undefined' && typeof FiftyBalosHero.drawLikeness === 'function') {
            FiftyBalosHero.drawLikeness(ctx, r, flash, 1, facingUp);
        }

        // Rider arm reaching cleanly onto Crypton X handlebar
        if (!vertical) {
            ctx.lineCap = 'round';
            ctx.strokeStyle = isKitsos ? '#0d0e11' : '#0a1834';
            ctx.lineWidth = 6.2;
            ctx.beginPath();
            ctx.moveTo(4, -5);
            ctx.lineTo(17, -3);
            ctx.stroke();

            ctx.strokeStyle = flash ? '#ffffff' : (isKitsos ? '#dfa575' : '#1162df');
            ctx.lineWidth = 4.0;
            ctx.stroke();

            ctx.strokeStyle = flash ? '#ffffff' : (isKitsos ? '#1e1f24' : '#ece5d7');
            ctx.lineWidth = isKitsos ? 5.2 : 1.4;
            ctx.beginPath();
            ctx.moveTo(4, -5);
            ctx.lineTo(isKitsos ? 10.5 : 17, isKitsos ? -4 : -3);
            ctx.stroke();

            ctx.fillStyle = flash ? '#ffffff' : (isKitsos ? '#dfa575' : '#db8f5d');
            ctx.beginPath();
            ctx.arc(18, -3, 3.4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.CryptonXModel = CryptonXModel;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CryptonXModel;
}
