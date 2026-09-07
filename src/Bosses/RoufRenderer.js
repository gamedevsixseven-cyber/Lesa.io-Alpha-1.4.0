/**
 * Lesa.io - Boss Subsystem: RoufRenderer
 * Dedicated procedural canvas renderer for Wave 20 Climax Boss "Rouf":
 * - 55yo neighborhood informant aesthetic: balding grey comb-over, reading glasses,
 *   bushy grey mustache, knit cardigan vest, dress trousers, leather moccasins
 * - 90s heavy black brick mobile phone with long telescopic metallic antenna
 * - Dynamic animations: hunched walk cycle, accusing finger point, phone swat, electric arcs
 * - Overhead Boss HUD with health bar, name badge, and Phase 2 indicator
 */

class RoufRenderer {
    static draw(boss, ctx) {
        if (!boss || boss.dead) return;

        ctx.save();
        const flash = boss.hitFlash > 0;
        const groundY = boss.y;
        const bob = Math.sin(boss.walkCycle) * 2.6;

        // 1. Ground Shadow
        ctx.save();
        ctx.translate(boss.x, groundY);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
        ctx.beginPath();
        ctx.ellipse(0, boss.radius * 0.75, boss.radius * 0.92, boss.radius * 0.36, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 1.5 Police Car (Arrives in ending cutscene)
        if (boss.policeCar) {
            this.drawPoliceCar(boss.policeCar, ctx);
        }

        // 2. Boss Character Body
        ctx.save();
        ctx.translate(boss.x, boss.y + bob);

        // Tremble / jitter during panic call or phase 2
        if (boss.isCalling || boss.isPhase2 || boss.isDefeated) {
            const jitter = (Math.random() - 0.5) * (boss.isPhase2 ? 2.5 : 1.2);
            ctx.translate(jitter, jitter);
        }

        if (boss.isDefeated) {
            this.drawDefeatedBody(boss, ctx, flash);
        } else {
            this.drawBody(boss, ctx, flash);
        }

        ctx.restore();
        ctx.restore();

        // 3. Overhead Boss HUD (Only during active combat before defeat)
        if (boss.cutsceneState === 'COMBAT' && !boss.isDefeated) {
            this.drawHUD(boss, ctx);
        }
    }

    static drawBody(boss, ctx, flash) {
        const r = boss.radius;
        const facingLeft = Math.cos(boss.angle) < 0;

        const skinColor = flash ? '#ffffff' : '#f5cd79';
        const vestColor = flash ? '#ffffff' : (boss.isPhase2 ? '#c0392b' : '#2c3e50');
        const shirtColor = flash ? '#ffffff' : '#ecf0f1';
        const pantsColor = flash ? '#ffffff' : '#4a3525';
        const moccasinColor = flash ? '#ffffff' : '#2d1e18';
        const hairColor = flash ? '#ffffff' : '#7f8c8d';

        ctx.save();
        if (facingLeft) ctx.scale(-1, 1);

        ctx.lineWidth = 3.0;
        ctx.strokeStyle = '#1e272e';

        // --- A. LEGS & LEATHER MOCCASINS ---
        // Left Leg & Moccasin
        ctx.fillStyle = pantsColor;
        ctx.beginPath();
        ctx.roundRect(-r * 0.44, r * 0.32, r * 0.36, r * 0.54, 5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = moccasinColor;
        ctx.beginPath();
        ctx.roundRect(-r * 0.5, r * 0.72, r * 0.42, r * 0.22, 4);
        ctx.fill();
        ctx.stroke();

        // Right Leg & Moccasin
        ctx.fillStyle = pantsColor;
        ctx.beginPath();
        ctx.roundRect(r * 0.08, r * 0.32, r * 0.36, r * 0.54, 5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = moccasinColor;
        ctx.beginPath();
        ctx.roundRect(r * 0.04, r * 0.72, r * 0.42, r * 0.22, 4);
        ctx.fill();
        ctx.stroke();

        // --- B. TORSO: COLLARED SHIRT & KNIT CARDIGAN VEST ---
        // White Under-Shirt
        ctx.fillStyle = shirtColor;
        ctx.beginPath();
        ctx.roundRect(-r * 0.65, -r * 0.42, r * 1.3, r * 0.82, 8);
        ctx.fill();
        ctx.stroke();

        // Cardigan Knit Vest (Navy blue or Crimson Enrage)
        ctx.fillStyle = vestColor;
        ctx.beginPath();
        ctx.roundRect(-r * 0.6, -r * 0.4, r * 1.2, r * 0.8, 7);
        ctx.fill();
        ctx.stroke();

        // V-Neck Cutout showing shirt collar & tie
        ctx.fillStyle = shirtColor;
        ctx.beginPath();
        ctx.moveTo(-r * 0.25, -r * 0.4);
        ctx.lineTo(0, -r * 0.05);
        ctx.lineTo(r * 0.25, -r * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Vest Button strip
        ctx.fillStyle = '#1e272e';
        ctx.beginPath();
        ctx.arc(0, r * 0.08, 2.2, 0, Math.PI * 2);
        ctx.arc(0, r * 0.24, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // --- C. HEAD & 55YO FACIAL FEATURES ---
        // Neck
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.roundRect(-r * 0.2, -r * 0.58, r * 0.4, r * 0.22, 3);
        ctx.fill();

        // Head Base
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.72, r * 0.48, r * 0.52, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Forehead Wrinkles
        ctx.strokeStyle = '#d4a373';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-r * 0.22, -r * 0.95);
        ctx.lineTo(r * 0.18, -r * 0.95);
        ctx.moveTo(-r * 0.18, -r * 0.88);
        ctx.lineTo(r * 0.14, -r * 0.88);
        ctx.stroke();

        // Grey Hair Fringe & Balding Comb-Over Strands
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 2.4;
        ctx.fillStyle = hairColor;

        // Thinning Hair Fringe around back/ears
        ctx.beginPath();
        ctx.arc(-r * 0.38, -r * 0.7, r * 0.22, Math.PI * 0.6, Math.PI * 1.6);
        ctx.fill();
        ctx.stroke();

        // Grey Comb-over strands curving across top
        ctx.lineWidth = 2.0;
        ctx.strokeStyle = hairColor;
        ctx.beginPath();
        ctx.moveTo(-r * 0.35, -r * 0.96);
        ctx.quadraticCurveTo(0, -r * 1.15, r * 0.32, -r * 0.94);
        ctx.moveTo(-r * 0.32, -r * 0.92);
        ctx.quadraticCurveTo(0, -r * 1.10, r * 0.35, -r * 0.90);
        ctx.stroke();

        // Bushy Grey Mustache
        ctx.fillStyle = hairColor;
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.ellipse(r * 0.12, -r * 0.58, r * 0.26, r * 0.12, 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Wire-Frame Reading Glasses
        ctx.lineWidth = 2.0;
        ctx.strokeStyle = '#d4af37'; // Gold wireframe
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';

        // Lens
        ctx.beginPath();
        ctx.roundRect(r * 0.08, -r * 0.74, r * 0.26, r * 0.18, 3);
        ctx.fill();
        ctx.stroke();

        // Glass Bridge
        ctx.beginPath();
        ctx.moveTo(r * 0.08, -r * 0.68);
        ctx.lineTo(-r * 0.04, -r * 0.68);
        ctx.stroke();

        // Glass Temple Stem towards ear
        ctx.beginPath();
        ctx.moveTo(-r * 0.04, -r * 0.68);
        ctx.lineTo(-r * 0.35, -r * 0.72);
        ctx.stroke();

        // Squinting Suspicious Eye behind glass
        ctx.fillStyle = '#1e272e';
        ctx.beginPath();
        ctx.ellipse(r * 0.2, -r * 0.66, 3.2, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // --- D. WEAPONS & HANDS ---
        this.drawHandsAndPhone(boss, ctx, flash, r);

        ctx.restore();
    }

    static drawHandsAndPhone(boss, ctx, flash, r) {
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = '#1e272e';
        const skinColor = flash ? '#ffffff' : '#f5cd79';

        // 1. Right Hand: Pointing Accusing Finger OR Flailing
        ctx.save();
        if (boss.isCalling || boss.cutsceneState === 'DIALOGUE_3') {
            // Accusing Finger Point
            ctx.translate(r * 0.45, -r * 0.15);
            ctx.fillStyle = skinColor;
            ctx.beginPath();
            ctx.roundRect(0, -4, r * 0.55, 8, 4); // Outstretched index finger
            ctx.fill();
            ctx.stroke();
        } else {
            // Hunched resting / sprint hand
            ctx.translate(r * 0.35, r * 0.1);
            ctx.fillStyle = skinColor;
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.15, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();

        // 2. Left Hand: Vintage 90s Heavy Brick Phone & Telescopic Antenna
        ctx.save();
        if (boss.smashAnimTimer > 0) {
            // Melee Phone Smash Animation: Swung overhead down!
            const smashAngle = (boss.smashAnimTimer / 25) * 1.8 - 0.4;
            ctx.translate(r * 0.4, -r * 0.2);
            ctx.rotate(smashAngle);
        } else {
            // Standard Stance: Phone firmly pressed to ear
            ctx.translate(-r * 0.22, -r * 0.58);
            ctx.rotate(-0.25);
        }

        // Heavy Black Brick Phone Chassis
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.roundRect(-r * 0.16, -r * 0.45, r * 0.32, r * 0.72, 4);
        ctx.fill();
        ctx.stroke();

        // Green Backlit Numeric Keypad Screen
        ctx.fillStyle = '#2ed573';
        ctx.fillRect(-r * 0.11, -r * 0.38, r * 0.22, r * 0.18);
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-r * 0.11, -r * 0.38, r * 0.22, r * 0.18);

        // Keypad grid dots
        ctx.fillStyle = '#747d8c';
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                ctx.fillRect(-r * 0.09 + col * (r * 0.07), -r * 0.12 + row * (r * 0.08), 2.2, 2.2);
            }
        }

        // Long Metallic Telescopic Antenna
        ctx.strokeStyle = '#bdc3c7';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.45);
        ctx.lineTo(r * 0.05, -r * 1.25); // Long antenna tip
        ctx.stroke();

        // Antenna Tip Orb
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(r * 0.05, -r * 1.25, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Crackling Electric Arcs on Antenna (Phase 2 Overclock)
        if (boss.isPhase2) {
            ctx.strokeStyle = '#fed330';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(r * 0.05, -r * 1.25);
            ctx.lineTo(r * 0.15 + Math.random() * 8, -r * 1.4);
            ctx.lineTo(-r * 0.05 + Math.random() * 8, -r * 1.55);
            ctx.stroke();
        }

        // Hand holding the phone
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    static drawHUD(boss, ctx) {
        const bw = 180;
        const bh = 14;
        const bx = boss.x - bw / 2;
        const by = boss.y - boss.radius - 38;

        ctx.save();

        // Name Badge (Without "FINAL BOSS")
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.font = "900 13px 'Luckiest Guy', sans-serif";
        ctx.fillStyle = '#1e272e';
        ctx.fillText('🚨 ROUF [HARD BOSS] 🚨', boss.x, by - 4);
        ctx.fillStyle = boss.isPhase2 ? '#ff4757' : '#fed330';
        ctx.fillText('🚨 ROUF [HARD BOSS] 🚨', boss.x - 1, by - 5);

        // Health Bar Container Frame
        ctx.fillStyle = '#1e272e';
        ctx.fillRect(bx - 3, by - 3, bw + 6, bh + 6);
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(bx - 3, by - 3, bw + 6, bh + 6);

        // Dark track
        ctx.fillStyle = '#2f3542';
        ctx.fillRect(bx, by, bw, bh);

        // Health Fill
        const hpRatio = Math.max(0, Math.min(1, boss.hp / boss.maxHp));
        const healthGrad = ctx.createLinearGradient(bx, by, bx + bw, by);
        if (boss.isPhase2) {
            healthGrad.addColorStop(0, '#eb4d4b');
            healthGrad.addColorStop(1, '#ff7979');
        } else {
            healthGrad.addColorStop(0, '#f0932b');
            healthGrad.addColorStop(1, '#fed330');
        }

        ctx.fillStyle = healthGrad;
        ctx.fillRect(bx, by, bw * hpRatio, bh);

        // 50% Phase 2 Enrage Marker Line
        ctx.fillStyle = '#ff4757';
        ctx.fillRect(bx + bw * 0.5 - 1, by - 2, 2, bh + 4);

        // Numeric HP readout
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.ceil(boss.hp)} / ${boss.maxHp}`, boss.x, by + bh / 2);

        ctx.restore();
    }

    static drawDefeatedBody(boss, ctx, flash) {
        const r = boss.radius;
        const skinColor = flash ? '#ffffff' : '#f5cd79';
        const vestColor = flash ? '#ffffff' : '#2c3e50';
        const shirtColor = flash ? '#ffffff' : '#ecf0f1';
        const pantsColor = flash ? '#ffffff' : '#4a3525';
        const hairColor = flash ? '#ffffff' : '#7f8c8d';

        ctx.save();
        ctx.lineWidth = 2.6;
        ctx.strokeStyle = '#1e272e';

        // Kneeling bent legs on ground
        ctx.fillStyle = pantsColor;
        ctx.beginPath();
        ctx.roundRect(-r * 0.55, r * 0.25, r * 1.1, r * 0.45, 6);
        ctx.fill();
        ctx.stroke();

        // Slumped forward torso
        ctx.fillStyle = vestColor;
        ctx.beginPath();
        ctx.roundRect(-r * 0.5, -r * 0.2, r * 1.0, r * 0.65, 8);
        ctx.fill();
        ctx.stroke();

        // Drooping Head
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.ellipse(r * 0.2, -r * 0.35, r * 0.42, r * 0.44, 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Thinning Hair & Comb-over
        ctx.strokeStyle = hairColor;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(r * 0.05, -r * 0.58);
        ctx.quadraticCurveTo(r * 0.25, -r * 0.72, r * 0.45, -r * 0.48);
        ctx.stroke();

        // Drooping glasses
        ctx.strokeStyle = '#d4af37';
        ctx.strokeRect(r * 0.3, -r * 0.38, r * 0.22, r * 0.16);

        // Despairing eyes
        ctx.fillStyle = '#1e272e';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('x x', r * 0.32, -r * 0.26);

        // Hands groveling on ground
        ctx.fillStyle = skinColor;
        ctx.strokeStyle = '#1e272e';
        ctx.beginPath();
        ctx.arc(-r * 0.4, r * 0.45, r * 0.14, 0, Math.PI * 2);
        ctx.arc(r * 0.4, r * 0.45, r * 0.14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Shattered Brick Phone on Ground (smoking)
        ctx.save();
        ctx.translate(r * 0.8, r * 0.4);
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.roundRect(-8, -12, 16, 12, 2);
        ctx.roundRect(-6, 2, 14, 10, 2); // Split half
        ctx.fill();
        ctx.stroke();

        // Bent antenna
        ctx.strokeStyle = '#bdc3c7';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(-6, -22);
        ctx.lineTo(2, -30);
        ctx.stroke();

        // Smoke puff from broken battery
        ctx.fillStyle = 'rgba(149, 165, 166, 0.6)';
        ctx.beginPath();
        ctx.arc(-2 + Math.sin(Date.now() * 0.005) * 3, -26 - (Date.now() % 1000) * 0.015, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.restore();
    }

    static drawPoliceCar(car, ctx) {
        ctx.save();
        ctx.translate(car.x, car.y);
        ctx.rotate(car.angle || 0);

        const w = 110;
        const h = 54;
        const halfW = w / 2;
        const halfH = h / 2;

        // Ground shadow under car
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, halfH + 4, halfW * 1.05, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // 4 Wheels / Tires
        ctx.fillStyle = '#1e272e';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-halfW + 12, -halfH - 5, 20, 10, 3);
        ctx.roundRect(halfW - 32, -halfH - 5, 20, 10, 3);
        ctx.roundRect(-halfW + 12, halfH - 5, 20, 10, 3);
        ctx.roundRect(halfW - 32, halfH - 5, 20, 10, 3);
        ctx.fill();
        ctx.stroke();

        // Main Car Body (White Greek Police Sedan)
        ctx.lineWidth = 3.0;
        ctx.strokeStyle = '#1e272e';
        ctx.fillStyle = '#f5f6fa';
        ctx.beginPath();
        ctx.roundRect(-halfW, -halfH, w, h, 10);
        ctx.fill();
        ctx.stroke();

        // Blue Side Stripe (Greek Police Standard)
        ctx.fillStyle = '#1e3799';
        ctx.fillRect(-halfW + 4, -halfH + 16, w - 8, 14);

        // "ΑΣΤΥΝΟΜΙΑ" Text along side
        ctx.fillStyle = '#ffffff';
        ctx.font = "900 9px 'Luckiest Guy', sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ΑΣΤΥΝΟΜΙΑ 100', 0, -halfH + 23);

        // Windshield & Rear Window
        ctx.fillStyle = 'rgba(52, 152, 219, 0.65)';
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 1.6;
        // Front Windshield
        ctx.beginPath();
        ctx.roundRect(halfW - 30, -halfH + 6, 18, h - 12, 4);
        ctx.fill();
        ctx.stroke();
        // Rear Window
        ctx.beginPath();
        ctx.roundRect(-halfW + 12, -halfH + 6, 16, h - 12, 4);
        ctx.fill();
        ctx.stroke();

        // Headlight Beams (Forward glow)
        const lightGrad = ctx.createRadialGradient(halfW + 8, 0, 4, halfW + 45, 0, 50);
        lightGrad.addColorStop(0, 'rgba(255, 242, 0, 0.55)');
        lightGrad.addColorStop(1, 'rgba(255, 242, 0, 0.0)');
        ctx.fillStyle = lightGrad;
        ctx.beginPath();
        ctx.moveTo(halfW, -halfH + 10);
        ctx.lineTo(halfW + 50, -halfH - 12);
        ctx.lineTo(halfW + 50, halfH + 12);
        ctx.lineTo(halfW, halfH - 10);
        ctx.closePath();
        ctx.fill();

        // Roof Emergency Lightbar (Alternating Red & Blue Strobes)
        const phase = car.sirenPhase || 0;
        const isRedActive = Math.sin(phase * 0.3) > 0;

        ctx.fillStyle = '#2f3542';
        ctx.fillRect(-8, -8, 16, 16);

        // Left strobe (Red)
        ctx.fillStyle = isRedActive ? '#ff4757' : '#c0392b';
        ctx.beginPath();
        ctx.roundRect(-8, -8, 7, 16, 2);
        ctx.fill();

        // Right strobe (Blue)
        ctx.fillStyle = !isRedActive ? '#3867d6' : '#273c75';
        ctx.beginPath();
        ctx.roundRect(1, -8, 7, 16, 2);
        ctx.fill();

        // Rooftop siren neon flare
        ctx.fillStyle = isRedActive ? 'rgba(255, 71, 87, 0.45)' : 'rgba(56, 103, 214, 0.45)';
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.RoufRenderer = RoufRenderer;
}
