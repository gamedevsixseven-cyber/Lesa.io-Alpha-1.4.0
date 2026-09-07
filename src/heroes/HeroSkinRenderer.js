/**
 * Lesa.io - Advanced 2.5D Rigged Hero Model Engine & Coordinator
 * Modular Animation & Skeletal Rigging:
 * - Dynamic movement lean, idle breathing, and aim tilt
 * - Animated walking & running legs with realistic stride, foot lift, contact shadows, and authentic sneakers
 * - Articulated dual-arm tactical weapon gripping (hands firmly hold trigger and foregrip)
 * - Delegates character likeness and signature weapons to modular hero classes:
 *     - PsanasHero.js
 *     - PetrosHero.js
 *     - PsogasHero.js
 */

class HeroSkinRenderer {
    /**
     * Resolve the hero visual module
     */
    static getHeroModule(heroType) {
        if (heroType === '50balos' && typeof FiftyBalosHero !== 'undefined') return FiftyBalosHero;
        if (heroType === 'petros' && typeof PetrosHero !== 'undefined') return PetrosHero;
        if (heroType === 'psogas' && typeof PsogasHero !== 'undefined') return PsogasHero;
        if (typeof PsanasHero !== 'undefined') return PsanasHero;
        return null;
    }

    /**
     * Master draw method for the rigged hero model
     */
    static drawModel(player, ctx, walkCycle, flash, moving) {
        const r = player.radius || 25;
        const angle = player.angle || 0;
        const facingLeft = Math.cos(angle) < 0;
        const isBack = Math.sin(angle) < -0.25;
        const heroType = player.heroType || 'psanas';
        const weaponType = player.weaponType || (heroType === 'petros' ? 'watermelon' : (heroType === 'psogas' ? 'pepper' : 'pea'));
        const recoil = player.recoilOffset || 0;
        const bladeTimer = player.bladeTimer || 0;

        ctx.save();

        // 1. Dynamic Movement Lean into velocity direction
        if (moving && (player.vx !== 0 || player.vy !== 0)) {
            const moveAngle = Math.atan2(player.vy, player.vx);
            const leanAmount = 0.08;
            ctx.rotate(Math.sin(moveAngle - angle) * leanAmount);
        }

        // 2. Animated Stepping Legs (Bottom Layer)
        HeroSkinRenderer.drawAnimatedLegs(player, ctx, r, walkCycle, moving, facingLeft, heroType);

        // 3. Torso, Head & Character Likeness (Middle Layer)
        HeroSkinRenderer.drawTorsoAndHead(player, ctx, r, flash, moving, walkCycle, facingLeft, isBack, heroType);

        // 4. Dual-Arm Weapon Rig & Active Gripping (Top Layer)
        HeroSkinRenderer.drawArmsAndWeapon(player, ctx, r, flash, angle, facingLeft, recoil, bladeTimer, heroType, weaponType);

        ctx.restore();
    }

    /**
     * Backward-compatible bridge for legacy calls
     */
    static drawCartoonBody(player, ctx, bob, flash, moving) {
        HeroSkinRenderer.drawModel(player, ctx, player.walkCycle || 0, flash, moving);
    }

    /* ====================================================================
       1. ANIMATED STEPPING LEGS & AUTHENTIC FOOTWEAR
       ==================================================================== */
    static drawAnimatedLegs(player, ctx, r, walkCycle, moving, facingLeft, heroType) {
        ctx.save();

        const feetBaseY = r * 0.35;
        const hipWidth = r * 0.42;

        // Dynamic 2-phase stride cycle
        const strideRange = moving ? 11 : 0;
        const leftStride = Math.sin(walkCycle) * strideRange;
        const rightStride = Math.sin(walkCycle + Math.PI) * strideRange;

        // Foot lift: swinging foot elevates slightly off the arena floor
        const leftLift = moving ? Math.max(0, -Math.cos(walkCycle)) * 6 : 0;
        const rightLift = moving ? Math.max(0, -Math.cos(walkCycle + Math.PI)) * 6 : 0;

        // Fetch styling tokens from dedicated hero module
        const heroModule = HeroSkinRenderer.getHeroModule(heroType);
        const legConfig = heroModule ? heroModule.getLegsConfig() : {
            pantsColor: '#1a1a1c',
            pantsAccent: '#2a2a2e',
            shoePrimary: '#111113',
            shoeAccent: '#c8d6e5',
            isHighTop: true
        };

        // Draw Left Leg & Shoe
        HeroSkinRenderer.drawSingleLeg(ctx, -hipWidth, feetBaseY, leftStride, leftLift, 
            legConfig.pantsColor, legConfig.pantsAccent, legConfig.shoePrimary, legConfig.shoeAccent, legConfig.isHighTop, facingLeft);

        // Draw Right Leg & Shoe
        HeroSkinRenderer.drawSingleLeg(ctx, hipWidth, feetBaseY, rightStride, rightLift, 
            legConfig.pantsColor, legConfig.pantsAccent, legConfig.shoePrimary, legConfig.shoeAccent, legConfig.isHighTop, facingLeft);

        ctx.restore();
    }

    static drawSingleLeg(ctx, hipX, baseY, strideX, liftY, pantsColor, pantsAccent, shoePrimary, shoeAccent, isHighTop, facingLeft) {
        ctx.save();
        ctx.translate(hipX, baseY);

        const footX = strideX;
        const footY = -liftY;

        // Leg Shadow on ground when foot lifts
        if (liftY > 1) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.ellipse(footX, 10, 7, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // 1. Pants Leg (Upper thigh to ankle with athletic taper)
        ctx.fillStyle = pantsColor;
        ctx.strokeStyle = '#0f0f11';
        ctx.lineWidth = 2.4;

        ctx.beginPath();
        ctx.moveTo(-5, -12);
        ctx.lineTo(5, -12);
        ctx.lineTo(footX + 4, footY);
        ctx.lineTo(footX - 4, footY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Pants Seam / Cargo Crease
        ctx.strokeStyle = pantsAccent;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(footX, footY - 3);
        ctx.stroke();

        // Ankle Cuff
        ctx.fillStyle = pantsAccent;
        ctx.fillRect(footX - 4.5, footY - 2, 9, 3);

        // 2. Sneaker
        const shoeDir = facingLeft ? -1 : 1;
        ctx.translate(footX, footY);

        if (isHighTop) {
            // High-top collar
            ctx.fillStyle = shoePrimary;
            ctx.fillRect(-4.5, -6, 9, 6);
        }

        // Sneaker Upper
        ctx.fillStyle = shoePrimary;
        ctx.strokeStyle = '#0a0a0c';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(-6 * shoeDir, -3, 13 * shoeDir, 7, 3);
        ctx.fill();
        ctx.stroke();

        // Sneaker Swoosh / Accent Panel
        ctx.fillStyle = shoeAccent;
        ctx.beginPath();
        ctx.ellipse(1 * shoeDir, 0, 3.5, 1.8, 0.2 * shoeDir, 0, Math.PI * 2);
        ctx.fill();

        // Sole (Clean crisp white/grey rubber sole)
        ctx.fillStyle = '#f5f6fa';
        ctx.fillRect(-6.5 * shoeDir, 3, 14 * shoeDir, 2.5);
        ctx.strokeStyle = '#2f3542';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-6.5 * shoeDir, 3, 14 * shoeDir, 2.5);

        ctx.restore();
    }

    /* ====================================================================
       2. TORSO, HEAD & CHARACTER LIKENESS
       ==================================================================== */
    static drawTorsoAndHead(player, ctx, r, flash, moving, walkCycle, facingLeft, isBack, heroType) {
        ctx.save();

        // Hip & Torso vertical bobbing (synchronized to footsteps or breathing)
        const idleBreath = Math.sin(Date.now() * 0.0035) * 1.5;
        const walkBob = moving ? -Math.abs(Math.sin(walkCycle * 2)) * 2.8 : idleBreath;
        ctx.translate(0, walkBob);

        const dir = facingLeft ? -1 : 1;
        const heroModule = HeroSkinRenderer.getHeroModule(heroType);

        if (heroModule && heroModule.drawLikeness) {
            heroModule.drawLikeness(ctx, r, flash, dir, isBack);
        } else {
            HeroSkinRenderer.drawPsanasLikeness(ctx, r, flash, dir, isBack);
        }

        ctx.restore();
    }

    /* ====================================================================
       3. ARTICULATED DUAL-ARM COMBAT RIG & WEAPON DELEGATION
       ==================================================================== */
    static drawArmsAndWeapon(player, ctx, r, flash, angle, facingLeft, recoil, bladeTimer, heroType, weaponType) {
        ctx.save();

        // Weapon pivot anchored at upper chest level
        ctx.translate(0, -r * 0.32);
        ctx.rotate(angle);

        // Recoil displacement along aim vector
        ctx.translate(-recoil, 0);

        // Weapon flip when aiming left
        if (facingLeft) {
            ctx.scale(1, -1);
        }

        // Arm styling tokens from dedicated hero module
        const heroModule = HeroSkinRenderer.getHeroModule(heroType);
        const armConfig = heroModule ? heroModule.getArmConfig(flash) : {
            sleeveColor: null,
            cuffColor: '#1e1e24',
            skinColor: flash ? '#ffffff' : '#d49b6a'
        };

        // 1. Off-Hand / Support Arm (Foregrip Arm reaching under barrel)
        HeroSkinRenderer.drawSupportArm(ctx, r, armConfig.skinColor, armConfig.sleeveColor, armConfig.cuffColor, flash);

        // 2. High-Detail Game Weapon Model
        if (weaponType === 'watermelon') {
            HeroSkinRenderer.drawWatermelonCannon(ctx, flash, recoil);
        } else if (weaponType === 'pepper') {
            HeroSkinRenderer.drawChiliBlaster(ctx, flash, recoil);
        } else if (weaponType === 'money_gun') {
            HeroSkinRenderer.drawMoneyGun(ctx, flash, recoil);
        } else if (weaponType === 'bubble') {
            HeroSkinRenderer.drawBubbleGun(ctx, flash, recoil, player ? (player.bubbleCharge || 0) : 0);
        } else {
            HeroSkinRenderer.drawTacticalSlingshot(ctx, flash, recoil);
        }

        // 3. Main Arm (Trigger Hand firmly wrapped around grip)
        HeroSkinRenderer.drawTriggerArm(ctx, r, armConfig.skinColor, armConfig.sleeveColor, armConfig.cuffColor, flash);

        // 4. Tactical Blade Rush Bowie Knife in off-hand
        if (bladeTimer > 0) {
            HeroSkinRenderer.drawBladeRushKnife(ctx, flash, bladeTimer);
        }

        ctx.restore();
    }

    /**
     * Trigger Arm (Right Shoulder -> Pistol Grip -> Hand)
     */
    static drawTriggerArm(ctx, r, skinColor, sleeveColor, cuffColor, flash) {
        ctx.save();
        ctx.translate(0, 10);

        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.strokeStyle = sleeveColor || skinColor;

        // Arm stroke reaching to pistol grip (x=10, y=0)
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(4, 5, 10, 0);
        ctx.stroke();

        // Outline
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = '#0f0f11';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(4, 5, 10, 0);
        ctx.stroke();

        // Wristband for bare arms
        if (!sleeveColor) {
            ctx.fillStyle = '#1e1e24';
            ctx.fillRect(7, -3, 3.5, 6);
        }

        // Hand wrapped around trigger grip
        ctx.fillStyle = skinColor;
        ctx.strokeStyle = '#0f0f11';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(11, -1, 4.2, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Support Arm (Left Shoulder -> Foregrip -> Hand supporting barrel)
     */
    static drawSupportArm(ctx, r, skinColor, sleeveColor, cuffColor, flash) {
        ctx.save();
        ctx.translate(-4, -12);

        ctx.lineWidth = 4.8;
        ctx.lineCap = 'round';
        ctx.strokeStyle = sleeveColor || skinColor;

        // Arm reaching across under barrel to foregrip (x=24, y=4)
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(12, -8, 24, 4);
        ctx.stroke();

        // Outline
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = '#0f0f11';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(12, -8, 24, 4);
        ctx.stroke();

        // Hand cupping the foregrip
        ctx.fillStyle = skinColor;
        ctx.strokeStyle = '#0f0f11';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(24, 4, 4.5, 4, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Tactical Bowie Knife during Blade Rush [E]
     */
    static drawBladeRushKnife(ctx, flash, timer) {
        ctx.save();
        ctx.translate(14, 10);
        const slashProgress = Math.sin((timer / 24) * Math.PI);
        ctx.rotate(0.4 + slashProgress * 0.7);

        // Blade Hilt
        ctx.fillStyle = '#1e272e';
        ctx.fillRect(-4, -2.5, 8, 5);

        // Crossguard
        ctx.fillStyle = '#747d8c';
        ctx.fillRect(4, -6, 3, 12);

        // Damascus Steel Blade
        ctx.fillStyle = flash ? '#ffffff' : '#dfe4ea';
        ctx.strokeStyle = '#2ed573';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(7, -3.5);
        ctx.lineTo(24, 0);
        ctx.lineTo(7, 3.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    /* ====================================================================
       4. BACKWARD COMPATIBILITY BRIDGES
       ==================================================================== */
    static drawPsanasLikeness(ctx, r, flash, dir, isBack) {
        if (typeof PsanasHero !== 'undefined') {
            PsanasHero.drawLikeness(ctx, r, flash, dir, isBack);
        }
    }

    static drawPetrosLikeness(ctx, r, flash, dir, isBack) {
        if (typeof PetrosHero !== 'undefined') {
            PetrosHero.drawLikeness(ctx, r, flash, dir, isBack);
        }
    }

    static drawPsogasLikeness(ctx, r, flash, dir, isBack) {
        if (typeof PsogasHero !== 'undefined') {
            PsogasHero.drawLikeness(ctx, r, flash, dir, isBack);
        }
    }

    static drawTacticalSlingshot(ctx, flash, recoil) {
        if (typeof PsanasHero !== 'undefined') {
            PsanasHero.drawWeapon(ctx, flash, recoil);
        }
    }

    static drawWatermelonCannon(ctx, flash, recoil) {
        if (typeof PetrosHero !== 'undefined') {
            PetrosHero.drawWeapon(ctx, flash, recoil);
        }
    }

    static drawChiliBlaster(ctx, flash, recoil) {
        if (typeof PsogasHero !== 'undefined') {
            PsogasHero.drawWeapon(ctx, flash, recoil);
        }
    }

    static drawFiftyBalosLikeness(ctx, r, flash, dir, isBack) {
        if (typeof FiftyBalosHero !== 'undefined') {
            FiftyBalosHero.drawLikeness(ctx, r, flash, dir, isBack);
        }
    }

    static drawMoneyGun(ctx, flash, recoil) {
        if (typeof FiftyBalosHero !== 'undefined') {
            FiftyBalosHero.drawWeapon(ctx, flash, recoil);
        }
    }

    static drawBubbleGun(ctx, flash, recoil, charge = 0) {
        if (typeof BubbleGun !== 'undefined' && typeof BubbleGun.drawWeapon === 'function') {
            BubbleGun.drawWeapon(ctx, flash, recoil, charge);
        }
    }
}

if (typeof window !== 'undefined') {
    window.HeroSkinRenderer = HeroSkinRenderer;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HeroSkinRenderer };
}
