/**
 * Lesa.io - Boss Subsystem: KiloumpasRenderer
 * Dedicated rendering engine for Wave 15 Mini-Boss Kiloumpas:
 * - Shirtless, fat, big-stomached angry old Greek villager
 * - Empty-fisted approach vs two-handed Hunting Carbine (Karampina) stance
 * - Comic expressions: furious scowl, bushy eyebrows, belly button, chest hair
 * - Overhead Mini-Boss HUD with health bar & name badge
 */

class KiloumpasRenderer {
    static draw(boss, ctx) {
        if (boss.hidden) return; // Hidden during 3-second reload wait

        ctx.save();
        const flash = boss.hitFlash > 0;
        const groundY = boss.y;
        const bob = Math.sin(boss.walkCycle) * 3.0;

        // 1. Ground Shadow
        ctx.save();
        ctx.translate(boss.x, groundY);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.30)';
        ctx.beginPath();
        ctx.ellipse(0, boss.radius * 0.75, boss.radius * 0.95, boss.radius * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2. Boss Body & Weapon
        ctx.save();
        ctx.translate(boss.x, boss.y + bob);

        // Aim / Attack shake
        if (boss.isAiming) {
            const shake = (Math.random() - 0.5) * 2;
            ctx.translate(shake, shake);
        }

        this.drawBody(boss, ctx, flash);

        if (boss.isGrabbing) {
            this.drawGrabbingHands(boss, ctx, flash);
        } else if (boss.throwAnimTimer > 0) {
            this.drawThrowFollowThrough(boss, ctx, flash);
        } else if (boss.hasCarbine) {
            this.drawCarbine(boss, ctx, flash);
        } else {
            this.drawBareHands(boss, ctx, flash);
        }

        ctx.restore();
        ctx.restore();

        // 3. Overhead Mini-Boss HUD (Health & Title)
        if (boss.cutsceneState === 'COMBAT') {
            this.drawHUD(boss, ctx);
        }
    }

    static drawBody(boss, ctx, flash) {
        const r = boss.radius;
        const facingLeft = Math.cos(boss.angle) < 0;
        const skinColor = flash ? '#ffffff' : '#fab1a0';
        const pantsColor = flash ? '#ffffff' : '#3d3d3d';

        ctx.save();
        if (facingLeft) ctx.scale(-1, 1);

        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#1e272e';

        // --- A. LEGS & BOOTS ---
        // Left Leg
        ctx.fillStyle = pantsColor;
        ctx.beginPath();
        ctx.roundRect(-r * 0.48, r * 0.35, r * 0.38, r * 0.52, 6);
        ctx.fill();
        ctx.stroke();

        // Right Leg
        ctx.beginPath();
        ctx.roundRect(r * 0.10, r * 0.35, r * 0.38, r * 0.52, 6);
        ctx.fill();
        ctx.stroke();

        // Heavy Boots
        ctx.fillStyle = flash ? '#ffffff' : '#4a2810';
        ctx.beginPath();
        ctx.roundRect(-r * 0.52, r * 0.72, r * 0.44, r * 0.22, 5);
        ctx.roundRect(r * 0.08, r * 0.72, r * 0.44, r * 0.22, 5);
        ctx.fill();
        ctx.stroke();

        // Belt & Buckle
        ctx.fillStyle = flash ? '#ffffff' : '#1e272e';
        ctx.fillRect(-r * 0.55, r * 0.25, r * 1.1, r * 0.14);
        ctx.fillStyle = flash ? '#ffffff' : '#fed330';
        ctx.fillRect(-r * 0.14, r * 0.24, r * 0.28, r * 0.16);

        // --- B. SHIRTLESS FAT BELLY & TORSO ---
        // Massive round beer belly protruding forward
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.ellipse(r * 0.08, -r * 0.05, r * 0.85, r * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Comic Belly Button
        ctx.fillStyle = '#e17055';
        ctx.beginPath();
        ctx.arc(r * 0.12, r * 0.12, 3.2, 0, Math.PI * 2);
        ctx.fill();

        // Chest Hair Lines (Comic details)
        ctx.strokeStyle = '#636e72';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(-r * 0.10, -r * 0.25, 4, 0, Math.PI);
        ctx.arc(r * 0.15, -r * 0.25, 4, 0, Math.PI);
        ctx.stroke();

        // --- C. HEAD & ANGRY OLD FACE ---
        // Neck
        ctx.fillStyle = skinColor;
        ctx.fillRect(-r * 0.22, -r * 0.65, r * 0.44, r * 0.25);

        // Head Base
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#1e272e';
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.85, r * 0.48, r * 0.44, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Gray hair tufts on the sides (balding on top)
        ctx.fillStyle = flash ? '#ffffff' : '#b2bec3';
        ctx.beginPath();
        ctx.ellipse(-r * 0.46, -r * 0.85, r * 0.16, r * 0.28, 0, 0, Math.PI * 2);
        ctx.ellipse(r * 0.46, -r * 0.85, r * 0.16, r * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Red bulbous nose
        ctx.fillStyle = flash ? '#ffffff' : '#e17055';
        ctx.beginPath();
        ctx.ellipse(r * 0.04, -r * 0.82, r * 0.14, r * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Furious Eyes & Bushy Eyebrows
        ctx.fillStyle = '#1e272e';
        // Left Eye
        ctx.beginPath();
        ctx.arc(-r * 0.16, -r * 0.90, 3, 0, Math.PI * 2);
        ctx.arc(r * 0.18, -r * 0.90, 3, 0, Math.PI * 2);
        ctx.fill();

        // Slanted Angry Eyebrows (V shape)
        ctx.strokeStyle = '#2d3436';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-r * 0.30, -r * 1.02);
        ctx.lineTo(-r * 0.06, -r * 0.94);
        ctx.moveTo(r * 0.30, -r * 1.02);
        ctx.lineTo(r * 0.06, -r * 0.94);
        ctx.stroke();

        // Gritted Angry Teeth / Mouth
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        if (boss.isGrabbing) {
            // Straining wide roaring mouth during grab
            ctx.roundRect(-r * 0.22, -r * 0.72, r * 0.44, r * 0.20, 4);
        } else {
            ctx.roundRect(-r * 0.18, -r * 0.68, r * 0.38, r * 0.14, 3);
        }
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    static drawBareHands(boss, ctx, flash) {
        const r = boss.radius;
        const skinColor = flash ? '#ffffff' : '#fab1a0';

        ctx.save();
        ctx.fillStyle = skinColor;
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#1e272e';

        // Bare fists swinging
        const swing = Math.sin(boss.walkCycle) * 8;
        ctx.beginPath();
        ctx.arc(-r * 0.75, r * 0.05 + swing, r * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(r * 0.75, r * 0.05 - swing, r * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    static drawCarbine(boss, ctx, flash) {
        const r = boss.radius;
        ctx.save();

        // Rotate carbine towards aim direction
        ctx.rotate(boss.angle);

        // Hunting Carbine Wooden Stock & Grip
        ctx.fillStyle = flash ? '#ffffff' : '#795548';
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.roundRect(-10, -5, 30, 10, 3);
        ctx.fill();
        ctx.stroke();

        // Long Gunmetal Barrel
        ctx.fillStyle = flash ? '#ffffff' : '#2f3542';
        ctx.beginPath();
        ctx.fillRect(18, -4, 42, 8);
        ctx.strokeRect(18, -4, 42, 8);

        // Muzzle Tip / Sight
        ctx.fillStyle = '#fed330';
        ctx.fillRect(56, -6, 6, 4);

        // Hands gripping the weapon
        ctx.fillStyle = flash ? '#ffffff' : '#fab1a0';
        ctx.beginPath();
        ctx.arc(6, -2, 7, 0, Math.PI * 2);
        ctx.arc(28, -1, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Muzzle Flash Effect during aim shot
        if (boss.isAiming) {
            ctx.fillStyle = 'rgba(255, 235, 59, 0.9)';
            ctx.beginPath();
            ctx.arc(62, 0, 10, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    static drawGrabbingHands(boss, ctx, flash) {
        const r = boss.radius;
        const skinColor = flash ? '#ffffff' : '#fab1a0';

        ctx.save();
        ctx.rotate(boss.angle);

        // Slung Carbine on back
        ctx.save();
        ctx.rotate(-Math.PI * 0.45);
        ctx.fillStyle = flash ? '#ffffff' : '#795548';
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.roundRect(-22, -r * 0.35, 45, 7, 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Outstretched Grabbing Arms reaching forward to hold player
        // Lift height increases over the 0.7s grab hold (grabHoldTimer goes 42 -> 0)
        const progress = Math.min(1.0, Math.max(0, 1.0 - ((boss.grabHoldTimer || 0) / 42)));
        const armLength = r * 1.05;
        const armSpread = r * 0.38;
        const liftY = -r * 0.15 - progress * 12;
        const shake = (Math.random() - 0.5) * 3.0; // Angry strain jitter

        ctx.fillStyle = skinColor;
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 3.5;

        // Upper Left Arm & Clamping Fist
        ctx.beginPath();
        ctx.roundRect(0, -armSpread + liftY + shake, armLength, r * 0.28, 6);
        ctx.fill();
        ctx.stroke();
        // Left Fist
        ctx.beginPath();
        ctx.arc(armLength, -armSpread + liftY + shake + r * 0.14, r * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Lower Right Arm & Clamping Fist
        ctx.beginPath();
        ctx.roundRect(0, armSpread * 0.25 + liftY - shake, armLength, r * 0.28, 6);
        ctx.fill();
        ctx.stroke();
        // Right Fist
        ctx.beginPath();
        ctx.arc(armLength, armSpread * 0.25 + liftY - shake + r * 0.14, r * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    static drawThrowFollowThrough(boss, ctx, flash) {
        const r = boss.radius;
        const skinColor = flash ? '#ffffff' : '#fab1a0';

        ctx.save();
        ctx.rotate(boss.angle);

        ctx.fillStyle = skinColor;
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 3.5;

        // Powerful forward heave extension
        const t = (boss.throwAnimTimer || 0) / 18;
        const ext = r * (1.25 + (1.0 - t) * 0.35);

        ctx.beginPath();
        ctx.roundRect(0, -r * 0.45, ext, r * 0.26, 5);
        ctx.roundRect(0, r * 0.18, ext, r * 0.26, 5);
        ctx.fill();
        ctx.stroke();

        // Open hands thrusting forward
        ctx.beginPath();
        ctx.arc(ext, -r * 0.32, r * 0.18, 0, Math.PI * 2);
        ctx.arc(ext, r * 0.31, r * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    static drawHUD(boss, ctx) {
        ctx.save();
        const hudY = boss.y - boss.radius - 38;

        // Boss Title Badge
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = "900 13px 'Luckiest Guy', cursive";
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#1e272e';
        ctx.fillStyle = '#fed330';
        ctx.strokeText('💀 MINI-BOSS: KILOUMPAS 💀', boss.x, hudY - 14);
        ctx.fillText('💀 MINI-BOSS: KILOUMPAS 💀', boss.x, hudY - 14);

        // Health Bar Background
        const barW = 120;
        const barH = 12;
        const barX = boss.x - barW / 2;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(barX - 2, hudY - 2, barW + 4, barH + 4);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#1e272e';
        ctx.strokeRect(barX - 2, hudY - 2, barW + 4, barH + 4);

        // HP Fill
        const hpRatio = Math.max(0, Math.min(1, boss.hp / boss.maxHp));
        const fillW = barW * hpRatio;
        ctx.fillStyle = hpRatio > 0.4 ? '#ff4757' : '#eb2f06';
        ctx.fillRect(barX, hudY, fillW, barH);

        // HP Inner Glow / Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(barX, hudY, fillW, barH * 0.4);

        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.KiloumpasRenderer = KiloumpasRenderer;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { KiloumpasRenderer };
}
