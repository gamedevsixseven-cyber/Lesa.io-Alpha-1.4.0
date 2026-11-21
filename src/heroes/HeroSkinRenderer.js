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
        if (heroType === 'psgiannhs' && typeof PsgiannhsHero !== 'undefined') return PsgiannhsHero;
        if (heroType === '50balos' && typeof FiftyBalosHero !== 'undefined') return FiftyBalosHero;
        if (heroType === 'billias' && typeof BilliasHero !== 'undefined') return BilliasHero;
        if (heroType === 'kitsos' && typeof KitsosHero !== 'undefined') return KitsosHero;
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
        HeroSkinRenderer.drawAnimatedLegs(player, ctx, r, walkCycle, moving, facingLeft, heroType, flash);

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
    static drawAnimatedLegs(player, ctx, r, walkCycle, moving, facingLeft, heroType, flash = false) {
        ctx.save();

        const customHero = HeroSkinRenderer.getHeroModule(heroType);
        if (customHero && typeof customHero.drawLegs === 'function') {
            customHero.drawLegs(player, ctx, r, walkCycle, moving, facingLeft, flash);
            ctx.restore();
            return;
        }

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
        const legHipWidth = (legConfig && typeof legConfig.hipWidth === 'number') ? legConfig.hipWidth : hipWidth;

        // Draw Left Leg & Shoe
        HeroSkinRenderer.drawSingleLeg(ctx, -legHipWidth, feetBaseY, leftStride, leftLift,
            legConfig.pantsColor, legConfig.pantsAccent, legConfig.shoePrimary, legConfig.shoeAccent, legConfig.isHighTop, facingLeft, legConfig);

        // Draw Right Leg & Shoe
        HeroSkinRenderer.drawSingleLeg(ctx, legHipWidth, feetBaseY, rightStride, rightLift,
            legConfig.pantsColor, legConfig.pantsAccent, legConfig.shoePrimary, legConfig.shoeAccent, legConfig.isHighTop, facingLeft, legConfig);

        ctx.restore();
    }

    static drawSingleLeg(ctx, hipX, baseY, strideX, liftY, pantsColor, pantsAccent, shoePrimary, shoeAccent, isHighTop, facingLeft, legConfig = null) {
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
        const thighHalf = (legConfig && typeof legConfig.thighHalf === 'number') ? legConfig.thighHalf : 5;
        const legTopY = (legConfig && typeof legConfig.legTopY === 'number') ? legConfig.legTopY : -12;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.fillStyle = pantsColor;
        ctx.strokeStyle = '#0f0f11';
        ctx.lineWidth = 2.4;

        ctx.beginPath();
        ctx.moveTo(-thighHalf, legTopY);
        ctx.lineTo(thighHalf, legTopY);
        ctx.lineTo(footX + 4, footY);
        ctx.lineTo(footX - 4, footY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Pants Seam / Cargo Crease
        ctx.strokeStyle = pantsAccent;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(0, legTopY + 2);
        ctx.lineTo(footX, footY - 3);
        ctx.stroke();

        // Ankle Cuff (+ optional white crew sock peeking above high-top collar)
        ctx.fillStyle = pantsAccent;
        ctx.fillRect(footX - 4.5, footY - 2, 9, 3);

        // 2. Sneaker
        const shoeDir = facingLeft ? -1 : 1;
        ctx.translate(footX, footY);

        if (legConfig && legConfig.sockColor) {
            ctx.fillStyle = legConfig.sockColor;
            ctx.fillRect(-3.6, -4.5, 7.2, 3.2);
        }

        if (isHighTop) {
            // High-top collar (optional mocha heel flap + black collar)
            ctx.fillStyle = shoePrimary;
            ctx.fillRect(-4.5, -6, 9, 6);
            if (legConfig && legConfig.shoeQuarter) {
                ctx.fillStyle = shoeAccent;
                ctx.fillRect(-4.5 * shoeDir, -5.5, 4.2 * shoeDir, 4.5);
            }
        }

        // Sneaker Upper
        ctx.fillStyle = (legConfig && legConfig.shoeQuarter) ? legConfig.shoeQuarter : shoePrimary;
        ctx.strokeStyle = '#0a0a0c';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(-6 * shoeDir, -3, 13 * shoeDir, 7, 3);
        ctx.fill();
        ctx.stroke();

        if (legConfig && legConfig.shoeQuarter) {
            // AJ1 Dark Mocha panels: mocha heel counter + black forefoot mudguard & swoosh
            ctx.fillStyle = shoeAccent;
            ctx.fillRect(-6 * shoeDir, -2.5, 4.5 * shoeDir, 6);
            ctx.fillStyle = shoePrimary;
            ctx.beginPath();
            ctx.roundRect(1.5 * shoeDir, -1.5, 5.2 * shoeDir, 5, 2);
            ctx.fill();
            ctx.strokeStyle = shoePrimary;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(-3 * shoeDir, 1.2);
            ctx.quadraticCurveTo(0, 2.2, 3.2 * shoeDir, -0.8);
            ctx.stroke();
        } else {
            // Sneaker Swoosh / Accent Panel
            ctx.fillStyle = shoeAccent;
            ctx.beginPath();
            ctx.ellipse(1 * shoeDir, 0, 3.5, 1.8, 0.2 * shoeDir, 0, Math.PI * 2);
            ctx.fill();
        }

        // Sole (Crisp white/cream midsole + optional dark/mocha outsole)
        ctx.fillStyle = (legConfig && legConfig.midsoleColor) ? legConfig.midsoleColor : '#f5f6fa';
        ctx.fillRect(-6.5 * shoeDir, 3, 14 * shoeDir, 2.5);
        ctx.strokeStyle = '#2f3542';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-6.5 * shoeDir, 3, 14 * shoeDir, 2.5);
        if (legConfig && legConfig.shoeSole) {
            ctx.fillStyle = legConfig.shoeSole;
            ctx.fillRect(-6.5 * shoeDir, 5.1, 14 * shoeDir, 1.6);
        }

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
            heroModule.drawLikeness(ctx, r, flash, dir, isBack, player);
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
        if (heroModule && typeof heroModule.drawCustomArmsAndWeapon === 'function') {
            heroModule.drawCustomArmsAndWeapon(ctx, r, flash, recoil, bladeTimer, player, weaponType);
            if (bladeTimer > 0) {
                HeroSkinRenderer.drawBladeRushKnife(ctx, flash, bladeTimer);
            }
            ctx.restore();
            return;
        }
        const armConfig = heroModule ? heroModule.getArmConfig(flash, player) : {
            sleeveColor: null,
            cuffColor: '#1e1e24',
            skinColor: flash ? '#ffffff' : '#d49b6a'
        };

        // 1. Off-Hand / Support Arm (Foregrip Arm reaching under barrel)
        HeroSkinRenderer.drawSupportArm(ctx, r, armConfig.skinColor, armConfig.sleeveColor, armConfig.cuffColor, flash, armConfig);

        // 2. High-Detail Game Weapon Model
        if ((weaponType === 'carbine' || weaponType === 'dialtone' || weaponType === 'zeus_thunderbolt') && typeof WeaponSystem !== 'undefined') {
            WeaponSystem.drawEquippedModel(ctx, weaponType, flash, recoil, player);
        } else if (weaponType === 'watermelon') {
            HeroSkinRenderer.drawWatermelonCannon(ctx, flash, recoil);
        } else if (weaponType === 'pepper') {
            HeroSkinRenderer.drawChiliBlaster(ctx, flash, recoil);
        } else if (weaponType === 'money_gun') {
            HeroSkinRenderer.drawMoneyGun(ctx, flash, recoil);
        } else if (weaponType === 'bubble') {
            HeroSkinRenderer.drawBubbleGun(ctx, flash, recoil, player ? (player.bubbleCharge || 0) : 0);
        } else if (weaponType === 'burger') {
            HeroSkinRenderer.drawBurger(ctx, flash, recoil);
        } else if (weaponType === 'lightning') {
            HeroSkinRenderer.drawLightningGauntlet(ctx, flash, recoil);
        } else if (weaponType === 'greek_flag' && typeof PsgiannhsHero !== 'undefined' && typeof PsgiannhsHero.drawWeapon === 'function') {
            PsgiannhsHero.drawWeapon(ctx, flash, recoil);
        } else {
            HeroSkinRenderer.drawTacticalSlingshot(ctx, flash, recoil);
        }

        // 3. Main Arm (Trigger Hand firmly wrapped around grip)
        HeroSkinRenderer.drawTriggerArm(ctx, r, armConfig.skinColor, armConfig.sleeveColor, armConfig.cuffColor, flash, armConfig);

        // 4. Tactical Blade Rush Bowie Knife in off-hand
        if (bladeTimer > 0) {
            HeroSkinRenderer.drawBladeRushKnife(ctx, flash, bladeTimer);
        }

        ctx.restore();
    }

    /**
     * Optional Striped Tracksuit Sleeve & Ribbed Cuff Trim (used by customized sleeved heroes)
     */
    static drawStyledSleeve(ctx, cpx, cpy, endX, endY, cuffX, cuffY, cuffAng, sleeveColor, armConfig, flash) {
        ctx.lineCap = 'round';
        ctx.lineWidth = 5.6;
        ctx.strokeStyle = '#0c1324';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(cpx, cpy, endX, endY);
        ctx.stroke();

        ctx.lineWidth = 3.9;
        ctx.strokeStyle = sleeveColor;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(cpx, cpy, endX, endY);
        ctx.stroke();

        if (!flash && armConfig.sleevePanelColor) {
            ctx.lineWidth = 2.0;
            ctx.strokeStyle = armConfig.sleevePanelColor;
            ctx.beginPath();
            ctx.moveTo(0, -0.7);
            ctx.quadraticCurveTo(cpx, cpy - 0.7, endX, endY - 0.7);
            ctx.stroke();
        }
        if (!flash && armConfig.sleeveStripeColor) {
            ctx.lineWidth = 1.1;
            ctx.strokeStyle = armConfig.sleeveStripeColor;
            ctx.beginPath();
            ctx.moveTo(0, -0.8);
            ctx.quadraticCurveTo(cpx, cpy - 0.8, endX, endY - 0.8);
            ctx.stroke();
        }
        if (!flash && armConfig.cuffStripeColor) {
            ctx.save();
            ctx.translate(cuffX, cuffY);
            ctx.rotate(cuffAng);
            ctx.fillStyle = armConfig.cuffColor || '#0d1b33';
            ctx.strokeStyle = '#0c1324';
            ctx.lineWidth = 1.1;
            ctx.fillRect(-1.8, -2.7, 3.6, 5.4);
            ctx.strokeRect(-1.8, -2.7, 3.6, 5.4);
            ctx.fillStyle = armConfig.cuffStripeColor;
            ctx.fillRect(-1.0, -2.3, 1.1, 4.6);
            ctx.fillStyle = armConfig.sleeveStripeColor || '#eae3d4';
            ctx.fillRect(0.4, -2.3, 0.8, 4.6);
            ctx.restore();
        }
    }

    /**
     * Trigger Arm (Right Shoulder -> Pistol Grip -> Hand)
     */
    static drawTriggerArm(ctx, r, skinColor, sleeveColor, cuffColor, flash, armConfig = null) {
        ctx.save();
        ctx.translate(0, 10);

        if (sleeveColor && armConfig && (armConfig.sleeveStripeColor || armConfig.sleevePanelColor || armConfig.cuffStripeColor)) {
            HeroSkinRenderer.drawStyledSleeve(ctx, 4, 5, 10, 0, 8.2, 1.2, -0.35, sleeveColor, armConfig, flash);
        } else {
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

            // Wristband for bare arms when cuffColor is explicitly provided
            if (!sleeveColor && cuffColor) {
                ctx.fillStyle = cuffColor;
                ctx.fillRect(7, -3, 3.5, 6);
            } else if (!sleeveColor && !flash) {
                // Subtle biceps/forearm muscle contour on bare athletic arms
                ctx.strokeStyle = '#a46134';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(2, 1.5);
                ctx.quadraticCurveTo(5.5, 3, 8.5, 0.5);
                ctx.stroke();
            }
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
    static drawSupportArm(ctx, r, skinColor, sleeveColor, cuffColor, flash, armConfig = null) {
        ctx.save();
        ctx.translate(-5, -3);

        if (sleeveColor && armConfig && (armConfig.sleeveStripeColor || armConfig.sleevePanelColor || armConfig.cuffStripeColor)) {
            HeroSkinRenderer.drawStyledSleeve(ctx, 9, 8, 22, 3, 18.8, 3.8, -0.25, sleeveColor, armConfig, flash);
        } else {
            ctx.lineWidth = 4.6;
            ctx.lineCap = 'round';
            ctx.strokeStyle = sleeveColor || skinColor;

            // Arm reaching cleanly along chest/under-barrel to foregrip (keeps face/eyes clear)
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(9, 8, 22, 3);
            ctx.stroke();

            // Outline
            ctx.lineWidth = 1.8;
            ctx.strokeStyle = '#0f0f11';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(9, 8, 22, 3);
            ctx.stroke();
        }

        // Hand cupping the foregrip
        ctx.fillStyle = skinColor;
        ctx.strokeStyle = '#0f0f11';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(22, 3, 4.3, 3.8, 0.25, 0, Math.PI * 2);
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

    static drawBurger(ctx, flash, recoil) {
        if (typeof BilliasHero !== 'undefined' && typeof BilliasHero.drawWeapon === 'function') {
            BilliasHero.drawWeapon(ctx, flash, recoil);
        }
    }

    static drawLightningGauntlet(ctx, flash, recoil) {
        if (typeof KitsosHero !== 'undefined' && typeof KitsosHero.drawWeapon === 'function') {
            KitsosHero.drawWeapon(ctx, flash, recoil);
        }
    }
}

if (typeof window !== 'undefined') {
    window.HeroSkinRenderer = HeroSkinRenderer;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HeroSkinRenderer };
}
