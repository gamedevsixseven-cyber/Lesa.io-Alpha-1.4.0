/**
 * Lesa.io - Psgiannhs Hero Definition & 2-Style 2.5D Visual Engine
 * Modeled after Psgiannhs.png (Style 1: Hooded Black Nike Puffer Jacket)
 * and PsgiannhsStyle2.png (Style 2: Black Crewneck Tee + Gold Cross Chain).
 */

class PsgiannhsHero {
    static STYLE_STORAGE_KEY = 'lesaio_hero_style_psgiannhs';

    static STYLES = {
        jacket: { id: 'jacket', name: 'Puffer Jacket', shortLabel: 'JACKET', avatar: 'assets/HeroesIcons/PsgiannhsAvatar.png' },
        tee: { id: 'tee', name: 'No Jacket', shortLabel: 'NO JACKET', avatar: 'assets/HeroesIcons/PsgiannhsStyle2Avatar.png' }
    };

    static getActiveStyle(player = null) {
        if (player && player.heroStyle && this.STYLES[player.heroStyle]) return player.heroStyle;
        const gsSt = (typeof window !== 'undefined' && window.GameState && window.GameState.player && window.GameState.player.heroStyles)
            ? window.GameState.player.heroStyles.psgiannhs : null;
        if (gsSt && this.STYLES[gsSt]) return gsSt;
        if (typeof localStorage !== 'undefined') {
            const saved = localStorage.getItem(this.STYLE_STORAGE_KEY);
            if (saved && this.STYLES[saved]) return saved;
        }
        return 'jacket';
    }

    static setActiveStyle(styleId) {
        const clean = this.STYLES[styleId] ? styleId : 'jacket';
        if (typeof localStorage !== 'undefined') localStorage.setItem(this.STYLE_STORAGE_KEY, clean);
        if (typeof window !== 'undefined' && window.GameState && window.GameState.player) {
            if (!window.GameState.player.heroStyles || typeof window.GameState.player.heroStyles !== 'object') {
                window.GameState.player.heroStyles = {};
            }
            window.GameState.player.heroStyles.psgiannhs = clean;
        }
        if (typeof window !== 'undefined' && window.gameInstance && window.gameInstance.player && window.gameInstance.player.heroType === 'psgiannhs') {
            window.gameInstance.player.heroStyle = clean;
        }
        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.emit('heroStyleChanged', { heroId: 'psgiannhs', styleId: clean });
        }
        return clean;
    }

    static getAvatarForStyle(styleId = null) {
        return (this.STYLES[styleId || this.getActiveStyle()] || this.STYLES.jacket).avatar;
    }

    static getLegsConfig() {
        return {
            pantsColor: '#1a1b20', pantsAccent: '#2b2d34',
            shoePrimary: '#eef0f4', shoeAccent: '#d6dbe3', midsoleColor: '#f8f9fb', shoeSole: '#cdd2dc',
            hipWidth: 7.2, thighHalf: 4.2, legTopY: -9, isHighTop: false
        };
    }

    static getArmConfig(flash, player = null) {
        if (this.getActiveStyle(player) === 'tee') {
            return { sleeveColor: null, cuffColor: null, skinColor: flash ? '#ffffff' : '#e5ab81' };
        }
        return {
            sleeveColor: flash ? '#ffffff' : '#1b1d22',
            sleevePanelColor: flash ? null : '#2a2d35',
            cuffColor: '#111216',
            cuffStripeColor: flash ? null : '#252830',
            skinColor: flash ? '#ffffff' : '#e5ab81'
        };
    }

    /* ====================================================================
       1. RELAXED BLACK NIKE SWEATPANTS & ALL-WHITE AIR FORCE 1 SNEAKERS
       ==================================================================== */
    static drawLegs(player, ctx, r, walkCycle, moving, facingLeft, flash = false) {
        const feetBaseY = r * 0.54, hipWidth = 6.8, strideRange = moving ? 10.6 : 0;
        const leftStride = Math.sin(walkCycle) * strideRange;
        const rightStride = Math.sin(walkCycle + Math.PI) * strideRange;
        const leftLift = moving ? Math.max(0, -Math.cos(walkCycle)) * 5.6 : 0;
        const rightLift = moving ? Math.max(0, -Math.cos(walkCycle + Math.PI)) * 5.6 : 0;

        if (rightLift > leftLift) {
            PsgiannhsHero.drawSingleSweatpantAndAF1(ctx, hipWidth, feetBaseY, rightStride, rightLift, facingLeft, 1, true, flash);
            PsgiannhsHero.drawSingleSweatpantAndAF1(ctx, -hipWidth, feetBaseY, leftStride, leftLift, facingLeft, -1, false, flash);
        } else {
            PsgiannhsHero.drawSingleSweatpantAndAF1(ctx, -hipWidth, feetBaseY, leftStride, leftLift, facingLeft, -1, false, flash);
            PsgiannhsHero.drawSingleSweatpantAndAF1(ctx, hipWidth, feetBaseY, rightStride, rightLift, facingLeft, 1, true, flash);
        }
    }

    static drawSingleSweatpantAndAF1(ctx, hipX, baseY, strideX, liftY, facingLeft, sideSign, showSwoosh, flash) {
        ctx.save();
        ctx.translate(hipX, baseY);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        const footX = strideX, footY = -liftY, shoeDir = facingLeft ? -1 : 1;
        if (liftY > 1) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
            ctx.beginPath(); ctx.ellipse(footX, 10.2, 7.2, 2.9, 0, 0, Math.PI * 2); ctx.fill();
        }

        // Matte charcoal-black Nike sweatpants with relaxed knee drape
        const thighHalf = 4.3, legTopY = -12.5, kneeX = footX * 0.45, kneeY = footY * 0.45 - 5.2;
        const legGrad = ctx.createLinearGradient(-thighHalf, legTopY, thighHalf, footY);
        legGrad.addColorStop(0, flash ? '#ffffff' : '#24262d');
        legGrad.addColorStop(0.55, flash ? '#f5f6fa' : '#191a20');
        legGrad.addColorStop(1, flash ? '#eceef2' : '#111216');

        ctx.fillStyle = legGrad; ctx.strokeStyle = '#090a0d'; ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(-thighHalf, legTopY); ctx.lineTo(thighHalf, legTopY);
        ctx.quadraticCurveTo(kneeX + 4.8, kneeY, footX + 4.3, footY - 1.2);
        ctx.lineTo(footX - 4.3, footY - 1.2);
        ctx.quadraticCurveTo(kneeX - 4.8, kneeY, -thighHalf, legTopY);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        if (!flash) {
            ctx.strokeStyle = '#2f323b'; ctx.lineWidth = 1.15;
            ctx.beginPath();
            ctx.moveTo(sideSign * 0.5, legTopY + 2.5);
            ctx.quadraticCurveTo(kneeX + sideSign * 1.4, kneeY + 0.8, footX + sideSign * 0.5, footY - 3.2);
            ctx.stroke();
            if (showSwoosh) PsgiannhsHero.drawMiniSwoosh(ctx, 0.3, legTopY + 7.2, 0.85, '#f4f6fa');
        }

        // Bunched sweatpant ankle cuff
        ctx.fillStyle = flash ? '#ffffff' : '#14151a'; ctx.strokeStyle = '#090a0d'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.roundRect(footX - 4.6, footY - 2.9, 9.2, 2.7, 1.3); ctx.fill(); ctx.stroke();

        // All-White Nike Air Force 1 Low
        ctx.translate(footX, footY);
        ctx.fillStyle = '#e4e7ee'; ctx.strokeStyle = '#14151a'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(-4.4 * shoeDir, -4.0, 7.6 * shoeDir, 3.6, 1.6); ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#f2f4f8'; ctx.lineWidth = 1.75;
        ctx.beginPath(); ctx.roundRect(-6.0 * shoeDir, -2.2, 13.2 * shoeDir, 6.0, 2.5); ctx.fill(); ctx.stroke();

        // Heel panel, laces & tonal stitched AF1 Swoosh
        ctx.fillStyle = '#e0e4ec';
        ctx.beginPath(); ctx.roundRect(-5.6 * shoeDir, -1.8, 3.3 * shoeDir, 4.9, 1.2); ctx.fill();

        ctx.strokeStyle = '#9aa3b2'; ctx.lineWidth = 0.85;
        for (const ly of [-2.4, -1.3]) {
            ctx.beginPath(); ctx.moveTo(0.3 * shoeDir, ly); ctx.lineTo(2.9 * shoeDir, ly + 0.35); ctx.stroke();
        }
        ctx.strokeStyle = '#8b94a5'; ctx.lineWidth = 1.05;
        ctx.beginPath(); ctx.moveTo(-2.7 * shoeDir, 1.0); ctx.quadraticCurveTo(-0.3 * shoeDir, 2.2, 3.0 * shoeDir, -0.3); ctx.stroke();

        // Chunky white AF1 platform midsole + subtle outsole tread
        ctx.fillStyle = '#fafbfd'; ctx.strokeStyle = '#1c2029'; ctx.lineWidth = 1.25;
        ctx.beginPath(); ctx.roundRect(-6.4 * shoeDir, 3.1, 13.9 * shoeDir, 3.2, 1.2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#cfd5df'; ctx.fillRect(-5.9 * shoeDir, 5.4, 12.9 * shoeDir, 0.9);
        ctx.restore();
    }

    static drawMiniSwoosh(ctx, x, y, scale, color) {
        ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
        ctx.fillStyle = color; ctx.beginPath();
        ctx.moveTo(-2.6, 0.2); ctx.quadraticCurveTo(-3.2, 1.6, -1.4, 1.6);
        ctx.quadraticCurveTo(0.8, 1.3, 3.6, -1.1); ctx.quadraticCurveTo(0.5, 0.2, -1.3, 0.4);
        ctx.quadraticCurveTo(-2.1, 0.4, -2.6, 0.2); ctx.closePath(); ctx.fill();
        ctx.restore();
    }

    /* ====================================================================
       2. TORSO (STYLE 1 PUFFER JACKET / STYLE 2 BLACK TEE) & HEAD LIKENESS
       ==================================================================== */
    static drawLikeness(ctx, r, flash, dir, isBack, player = null) {
        ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        const style = PsgiannhsHero.getActiveStyle(player);
        const skinFill = flash ? '#ffffff' : '#e5ab81';
        const skinShadow = flash ? '#ffffff' : '#c68459';
        const skinStroke = flash ? '#dfe4ea' : '#5e341b';

        if (style === 'tee') PsgiannhsHero.drawTeeTorso(ctx, r, flash, isBack, skinFill);
        else PsgiannhsHero.drawPufferJacketTorso(ctx, r, flash, isBack);

        // Sweatpants waistband
        if (!flash) {
            ctx.fillStyle = '#17181d'; ctx.strokeStyle = '#090a0d'; ctx.lineWidth = 1.9;
            ctx.beginPath(); ctx.roundRect(-r * 0.43, r * 0.23, r * 0.86, r * 0.13, 2); ctx.fill(); ctx.stroke();
        }

        // Neck + subtle chin shadow
        ctx.fillStyle = skinFill; ctx.strokeStyle = skinStroke; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(-r * 0.17, -r * 0.67, r * 0.34, r * 0.28, 3); ctx.fill(); ctx.stroke();

        if (!flash && !isBack) {
            ctx.fillStyle = skinShadow; ctx.beginPath();
            ctx.moveTo(-r * 0.13, -r * 0.61); ctx.lineTo(0, -r * 0.50); ctx.lineTo(r * 0.13, -r * 0.61);
            ctx.quadraticCurveTo(0, -r * 0.56, -r * 0.13, -r * 0.61); ctx.fill();
        }

        // Style 2 back-of-neck gold chain / Style 1 rear folded puffer hood
        if (style === 'tee' && !flash && isBack) {
            ctx.strokeStyle = '#f0c94d'; ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.moveTo(-r * 0.18, -r * 0.47); ctx.quadraticCurveTo(0, -r * 0.43, r * 0.18, -r * 0.47); ctx.stroke();
        } else if (style === 'jacket' && isBack) {
            PsgiannhsHero.drawBackHood(ctx, r, flash);
        }

        PsgiannhsHero.drawHead(ctx, r, flash, dir, isBack, skinFill, skinShadow, skinStroke);
        ctx.restore();
    }

    static drawPufferJacketTorso(ctx, r, flash, isBack) {
        // Thick black hood collar wrapping shoulders
        ctx.fillStyle = flash ? '#ffffff' : '#18191e'; ctx.strokeStyle = '#090a0d'; ctx.lineWidth = 2.1;
        ctx.beginPath(); ctx.ellipse(0, -r * 0.47, r * 0.46, r * 0.18, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        if (!flash && !isBack) {
            ctx.strokeStyle = '#2d3039'; ctx.lineWidth = 1.4;
            ctx.beginPath(); ctx.arc(0, -r * 0.47, r * 0.34, 0.15, Math.PI - 0.15); ctx.stroke();
        }

        // Boxy matte-black quilted puffer jacket body
        const jktGrad = ctx.createLinearGradient(0, -r * 0.48, 0, r * 0.25);
        jktGrad.addColorStop(0, flash ? '#ffffff' : '#272930');
        jktGrad.addColorStop(0.5, flash ? '#f5f6fa' : '#1b1c22');
        jktGrad.addColorStop(1, flash ? '#eceef2' : '#121318');

        ctx.fillStyle = jktGrad; ctx.strokeStyle = '#090a0d'; ctx.lineWidth = 2.3;
        ctx.beginPath();
        ctx.moveTo(-r * 0.40, -r * 0.48); ctx.quadraticCurveTo(0, -r * 0.42, r * 0.40, -r * 0.48);
        ctx.quadraticCurveTo(r * 0.59, -r * 0.40, r * 0.56, -r * 0.12);
        ctx.quadraticCurveTo(r * 0.54, r * 0.08, r * 0.48, r * 0.23);
        ctx.quadraticCurveTo(0, r * 0.28, -r * 0.48, r * 0.23);
        ctx.quadraticCurveTo(-r * 0.54, r * 0.08, -r * 0.56, -r * 0.12);
        ctx.quadraticCurveTo(-r * 0.59, -r * 0.40, -r * 0.40, -r * 0.48);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        if (flash) return;

        // 4 horizontal quilted baffle chambers + subtle top highlight
        for (const by of [-r * 0.27, -r * 0.10, r * 0.06, r * 0.18]) {
            const halfW = by > r * 0.10 ? r * 0.46 : r * 0.52;
            ctx.strokeStyle = '#0c0d10'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(-halfW, by); ctx.quadraticCurveTo(0, by + 2.0, halfW, by); ctx.stroke();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)'; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(-halfW + 2, by - 2.0); ctx.quadraticCurveTo(0, by - 0.2, halfW - 2, by - 2.0); ctx.stroke();
        }

        // Ribbed elastic bottom hem
        ctx.fillStyle = '#131419'; ctx.strokeStyle = '#090a0d'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.roundRect(-r * 0.47, r * 0.18, r * 0.94, r * 0.08, 2); ctx.fill(); ctx.stroke();

        if (!isBack) {
            ctx.strokeStyle = '#0a0b0e'; ctx.lineWidth = 2.6;
            ctx.beginPath(); ctx.moveTo(0, -r * 0.44); ctx.lineTo(0, r * 0.24); ctx.stroke();
            ctx.strokeStyle = '#3b3f4a'; ctx.lineWidth = 1.05;
            ctx.beginPath(); ctx.moveTo(0, -r * 0.43); ctx.lineTo(0, r * 0.23); ctx.stroke();
            ctx.fillStyle = '#7c8394'; ctx.fillRect(-1.3, -r * 0.44, 2.6, 3.6);

            ctx.strokeStyle = '#090a0d'; ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-r * 0.36, -r * 0.02); ctx.lineTo(-r * 0.27, r * 0.14);
            ctx.moveTo(r * 0.36, -r * 0.02); ctx.lineTo(r * 0.27, r * 0.14);
            ctx.stroke();

            PsgiannhsHero.drawMiniSwoosh(ctx, r * 0.24, -r * 0.31, 0.94, '#f5f7fa');
        }
    }

    static drawBackHood(ctx, r, flash) {
        ctx.save();
        ctx.fillStyle = flash ? '#ffffff' : '#1b1d23'; ctx.strokeStyle = '#090a0d'; ctx.lineWidth = 2.1;
        ctx.beginPath();
        ctx.moveTo(-r * 0.42, -r * 0.49); ctx.quadraticCurveTo(0, -r * 0.62, r * 0.42, -r * 0.49);
        ctx.quadraticCurveTo(r * 0.48, -r * 0.26, r * 0.32, -r * 0.19);
        ctx.quadraticCurveTo(0, -r * 0.13, -r * 0.32, -r * 0.19);
        ctx.quadraticCurveTo(-r * 0.48, -r * 0.26, -r * 0.42, -r * 0.49);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        if (!flash) {
            ctx.strokeStyle = '#2d3039'; ctx.lineWidth = 1.25;
            ctx.beginPath(); ctx.moveTo(-r * 0.28, -r * 0.33); ctx.quadraticCurveTo(0, -r * 0.24, r * 0.28, -r * 0.33); ctx.stroke();
        }
        ctx.restore();
    }

    static drawTeeTorso(ctx, r, flash, isBack, skinFill) {
        // Lean bare upper arms below short sleeves
        ctx.fillStyle = skinFill; ctx.strokeStyle = '#0e0f12'; ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(-r * 0.50, -r * 0.10, 3.4, 6.2, -0.10, 0, Math.PI * 2);
        ctx.ellipse(r * 0.50, -r * 0.10, 3.4, 6.2, 0.10, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        // Matte black short-sleeve crewneck tee
        const teeGrad = ctx.createLinearGradient(0, -r * 0.48, 0, r * 0.25);
        teeGrad.addColorStop(0, flash ? '#ffffff' : '#22242a');
        teeGrad.addColorStop(0.55, flash ? '#f5f6fa' : '#16171c');
        teeGrad.addColorStop(1, flash ? '#eceef2' : '#101115');

        ctx.fillStyle = teeGrad; ctx.strokeStyle = '#090a0d'; ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-r * 0.32, -r * 0.47); ctx.quadraticCurveTo(0, -r * 0.37, r * 0.32, -r * 0.47);
        ctx.lineTo(r * 0.56, -r * 0.39); ctx.lineTo(r * 0.64, -r * 0.16); ctx.lineTo(r * 0.46, -r * 0.13);
        ctx.lineTo(r * 0.43, r * 0.24); ctx.quadraticCurveTo(0, r * 0.27, -r * 0.43, r * 0.24);
        ctx.lineTo(-r * 0.46, -r * 0.13); ctx.lineTo(-r * 0.64, -r * 0.16); ctx.lineTo(-r * 0.56, -r * 0.39);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        if (flash) return;

        ctx.strokeStyle = '#30333c'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(-r * 0.30, -r * 0.45); ctx.quadraticCurveTo(0, -r * 0.34, r * 0.30, -r * 0.45); ctx.stroke();

        if (!isBack) {
            // Gold chain & ornate gold cross pendant
            ctx.strokeStyle = '#f0c94d'; ctx.lineWidth = 1.45;
            ctx.beginPath(); ctx.moveTo(-r * 0.21, -r * 0.44); ctx.lineTo(0, -r * 0.21); ctx.lineTo(r * 0.21, -r * 0.44); ctx.stroke();

            const cy = -r * 0.15;
            ctx.fillStyle = '#f4ce52'; ctx.strokeStyle = '#875c14'; ctx.lineWidth = 0.95;
            ctx.fillRect(-1.3, cy - 3.6, 2.6, 7.2); ctx.strokeRect(-1.3, cy - 3.6, 2.6, 7.2);
            ctx.fillRect(-3.1, cy - 1.7, 6.2, 2.2); ctx.strokeRect(-3.1, cy - 1.7, 6.2, 2.2);
            ctx.fillStyle = '#fff5bd'; ctx.fillRect(-0.5, cy - 2.9, 1.0, 1.4);

            // Left-chest white circular laurel wreath ('K') + crisp "Κασιδιάρης" print below
            const ex = r * 0.24, ey = -r * 0.12;
            ctx.strokeStyle = '#eff2f7'; ctx.lineWidth = 1.0;
            ctx.beginPath(); ctx.arc(ex, ey, 2.5, 0.45, Math.PI * 2 - 0.45); ctx.stroke();
            ctx.fillStyle = '#eff2f7';
            ctx.textAlign = 'center';
            ctx.font = 'bold 2.8px sans-serif';
            ctx.fillText('K', ex, ey + 1.0);
            ctx.font = 'bold 2.15px sans-serif';
            ctx.fillText('Κασιδιάρης', ex, ey + 4.7);
        } else {
            ctx.strokeStyle = '#272931'; ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-r * 0.24, -r * 0.24); ctx.lineTo(-r * 0.06, -r * 0.08);
            ctx.moveTo(r * 0.24, -r * 0.24); ctx.lineTo(r * 0.06, -r * 0.08);
            ctx.stroke();
        }
    }

    /* ====================================================================
       3. PORTRAIT-ACCURATE HEAD, TAPERED BUZZ-FADE HAIR & SMILING FACE
       ==================================================================== */
    static drawHead(ctx, r, flash, dir, isBack, skinFill, skinShadow, skinStroke) {
        ctx.save(); ctx.translate(0, -r * 0.94);
        const headW = r * 0.44, headH = r * 0.54;

        // Distinct tucked rounded ears
        ctx.fillStyle = skinFill; ctx.strokeStyle = skinStroke; ctx.lineWidth = 1.45;
        ctx.beginPath();
        ctx.ellipse(-headW * 0.96, 0.8, 2.5, 4.0, -0.15, 0, Math.PI * 2);
        ctx.ellipse(headW * 0.96, 0.8, 2.5, 4.0, 0.15, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        // Youthful sculpted head silhouette (tapered chin)
        ctx.fillStyle = skinFill; ctx.strokeStyle = '#0f0f11'; ctx.lineWidth = 2.05;
        ctx.beginPath();
        ctx.moveTo(-headW, -headH * 0.22);
        ctx.quadraticCurveTo(-headW, -headH * 1.04, 0, -headH * 1.04);
        ctx.quadraticCurveTo(headW, -headH * 1.04, headW, -headH * 0.22);
        ctx.quadraticCurveTo(headW * 0.96, headH * 0.52, headW * 0.42, headH * 0.88);
        ctx.quadraticCurveTo(0, headH * 1.06, -headW * 0.42, headH * 0.88);
        ctx.quadraticCurveTo(-headW * 0.96, headH * 0.52, -headW, -headH * 0.22);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        if (isBack) {
            if (!flash) {
                const fadeGrad = ctx.createLinearGradient(0, -headH * 1.02, 0, headH * 0.72);
                fadeGrad.addColorStop(0, '#4a3222'); fadeGrad.addColorStop(0.50, '#5f422d');
                fadeGrad.addColorStop(0.76, '#9c7557'); fadeGrad.addColorStop(1, '#d99e75');
                ctx.fillStyle = fadeGrad;
            } else {
                ctx.fillStyle = '#ffffff';
            }
            ctx.strokeStyle = '#18110c'; ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(-headW * 0.97, 0);
            ctx.quadraticCurveTo(-headW * 0.98, -headH * 1.05, 0, -headH * 1.06);
            ctx.quadraticCurveTo(headW * 0.98, -headH * 1.05, headW * 0.97, 0);
            ctx.quadraticCurveTo(headW * 0.72, headH * 0.58, 0, headH * 0.62);
            ctx.quadraticCurveTo(-headW * 0.72, headH * 0.58, -headW * 0.97, 0);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.restore(); return;
        }

        // Front / 3/4 View: temple buzz taper fade & short brown buzz-cut crown
        if (!flash) {
            ctx.fillStyle = 'rgba(196, 128, 86, 0.24)';
            ctx.beginPath(); ctx.ellipse(-dir * headW * 0.35, headH * 0.38, headW * 0.42, headH * 0.34, 0, 0, Math.PI * 2); ctx.fill();

            const sideFade = ctx.createLinearGradient(0, -headH * 0.55, 0, -headH * 0.04);
            sideFade.addColorStop(0, 'rgba(92, 64, 44, 0.72)'); sideFade.addColorStop(1, 'rgba(196, 146, 110, 0.0)');
            ctx.fillStyle = sideFade;
            ctx.fillRect(-headW * 0.95, -headH * 0.56, headW * 0.24, headH * 0.52);
            ctx.fillRect(headW * 0.71, -headH * 0.56, headW * 0.24, headH * 0.52);
        }

        const hairGrad = ctx.createLinearGradient(0, -headH * 1.10, 0, -headH * 0.35);
        hairGrad.addColorStop(0, flash ? '#ffffff' : '#442d1e');
        hairGrad.addColorStop(0.65, flash ? '#f5f6fa' : '#5d402b');
        hairGrad.addColorStop(1, flash ? '#e8ecf2' : '#75533a');
        ctx.fillStyle = hairGrad; ctx.strokeStyle = '#1b110b'; ctx.lineWidth = 1.75;
        ctx.beginPath();
        ctx.moveTo(-headW * 0.96, -headH * 0.24);
        ctx.quadraticCurveTo(-headW * 1.00, -headH * 1.08, 0, -headH * 1.09);
        ctx.quadraticCurveTo(headW * 1.00, -headH * 1.08, headW * 0.96, -headH * 0.24);
        ctx.quadraticCurveTo(headW * 0.78, -headH * 0.48, headW * 0.42, -headH * 0.53);
        ctx.quadraticCurveTo(0, -headH * 0.57, -headW * 0.42, -headH * 0.53);
        ctx.quadraticCurveTo(-headW * 0.78, -headH * 0.48, -headW * 0.96, -headH * 0.24);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        if (!flash) {
            const fx = dir * 1.1;
            ctx.strokeStyle = '#3b2517'; ctx.lineWidth = 1.45;
            ctx.beginPath();
            ctx.moveTo(fx - 5.9, -headH * 0.18); ctx.quadraticCurveTo(fx - 3.6, -headH * 0.26, fx - 1.5, -headH * 0.19);
            ctx.moveTo(fx + 1.5, -headH * 0.19); ctx.quadraticCurveTo(fx + 3.6, -headH * 0.26, fx + 5.9, -headH * 0.18);
            ctx.stroke();

            ctx.fillStyle = 'rgba(166, 102, 68, 0.25)';
            ctx.beginPath();
            ctx.ellipse(fx - 3.6, -headH * 0.01, 2.2, 0.95, 0, 0, Math.PI * 2);
            ctx.ellipse(fx + 3.6, -headH * 0.01, 2.2, 0.95, 0, 0, Math.PI * 2);
            ctx.fill();

            for (const ex of [fx - 3.6, fx + 3.6]) {
                ctx.fillStyle = '#fbfbfc'; ctx.strokeStyle = '#1c120c'; ctx.lineWidth = 0.95;
                ctx.beginPath(); ctx.ellipse(ex, -headH * 0.08, 2.15, 1.32, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                ctx.fillStyle = '#3a2212'; ctx.beginPath(); ctx.arc(ex + dir * 0.30, -headH * 0.08, 1.08, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ex + dir * 0.55 - 0.3, -headH * 0.11, 0.42, 0, Math.PI * 2); ctx.fill();
            }

            ctx.fillStyle = '#f3c5a2'; ctx.beginPath(); ctx.ellipse(fx + dir * 0.15, headH * 0.14, 1.25, 1.9, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#a86742'; ctx.lineWidth = 0.9;
            ctx.beginPath(); ctx.arc(fx + dir * 0.15, headH * 0.22, 1.25, 0.2, Math.PI - 0.2); ctx.stroke();

            ctx.fillStyle = '#faf7f3'; ctx.strokeStyle = '#6b3328'; ctx.lineWidth = 1.05;
            ctx.beginPath();
            ctx.moveTo(fx - 3.4, headH * 0.45); ctx.quadraticCurveTo(fx, headH * 0.48, fx + 3.4, headH * 0.45);
            ctx.quadraticCurveTo(fx, headH * 0.65, fx - 3.4, headH * 0.45); ctx.closePath(); ctx.fill(); ctx.stroke();

            ctx.strokeStyle = '#d47c70'; ctx.lineWidth = 0.95;
            ctx.beginPath(); ctx.moveTo(fx - 2.1, headH * 0.59); ctx.quadraticCurveTo(fx, headH * 0.65, fx + 2.1, headH * 0.59); ctx.stroke();
        }
        ctx.restore();
    }

    /**
     * Draw shared Greek Flag cloth banner (9 stripes + white cross canton) attached to a horizontal pole
     */
    static _drawFlagCloth(ctx, x, y, w, h, wavePhase, flash) {
        const stripeH = h / 9;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y + Math.sin(wavePhase) * 1.4);
        ctx.lineTo(x + w, y + h + Math.sin(wavePhase + 0.8) * 1.4);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        ctx.save();
        ctx.clip();

        for (let i = 0; i < 9; i++) {
            ctx.fillStyle = flash ? '#ffffff' : (i % 2 === 0 ? '#0d5eaf' : '#f8faff');
            ctx.fillRect(x - 1, y - 2 + i * stripeH, w + 3, stripeH + 1.5);
        }
        const cw = w * 0.42, ch = stripeH * 5;
        ctx.fillStyle = flash ? '#ffffff' : '#0d5eaf';
        ctx.fillRect(x - 1, y - 2, cw + 1, ch + 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + cw * 0.39, y - 2, cw * 0.22, ch + 2);
        ctx.fillRect(x - 1, y + ch * 0.37, cw + 1, ch * 0.24);
        ctx.restore();

        ctx.strokeStyle = '#12161f';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();
    }

    /**
     * Held Signature Weapon: Spear-tipped Greek Flag carried at ready-to-throw angle
     */
    static drawWeapon(ctx, flash, recoil) {
        ctx.save();
        ctx.translate(10 - recoil * 0.5, 1);

        // Wooden pole + gold finial + steel spear tip
        ctx.fillStyle = flash ? '#ffffff' : '#c89b62';
        ctx.strokeStyle = '#12161f';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-2, -1.8, 30, 3.6, 1.5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#ffd32a';
        ctx.beginPath();
        ctx.arc(28, 0, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#dfe6e9';
        ctx.beginPath();
        ctx.moveTo(36, 0);
        ctx.lineTo(29, -3.0);
        ctx.lineTo(29, 3.0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Trailing waving Greek flag behind spear tip
        const wave = Date.now() * 0.012;
        PsgiannhsHero._drawFlagCloth(ctx, 8, -11.5, 19, 10.5, wave, flash);
        ctx.restore();
    }

    /**
     * Flying Projectile: Thrown Greek Flag Spear streaking forward
     */
    static drawBullet(ctx, bullet) {
        const wave = (bullet.age || 0) * 0.55;
        ctx.save();
        // Pole & spearhead pointing right along velocity vector
        ctx.fillStyle = '#c89b62';
        ctx.strokeStyle = '#12161f';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-16, -1.8, 28, 3.6, 1.5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffd32a';
        ctx.beginPath();
        ctx.arc(12, 0, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ecf0f1';
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(13, -3.2);
        ctx.lineTo(13, 3.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Fluttering flag trailing backward off the spear shaft
        PsgiannhsHero._drawFlagCloth(ctx, -13, -12.5, 22, 11.5, wave, false);
        ctx.restore();
    }
}

if (typeof window !== 'undefined') window.PsgiannhsHero = PsgiannhsHero;
if (typeof module !== 'undefined' && module.exports) module.exports = { PsgiannhsHero };
