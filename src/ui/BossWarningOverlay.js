/**
 * Lesa.io - UI Component: BossWarningOverlay
 * Fullscreen dramatic RED warning screen triggered on Wave 10 when Kleanthis Boss approaches:
 * - Pulsing crimson vignette & screen shake
 * - Animated top & bottom hazard caution stripes
 * - "⚠️ WARNING: BOSS INCOMING ⚠️" bold comic presentation
 */

class BossWarningOverlay {
    constructor() {
        this.active = false;
        this.timer = 0;
        this.maxTimer = 190; // ~3.1 seconds
        this.pulsePhase = 0;
        this.stripeOffset = 0;
        this.bossName = 'KLEANTHIS THE REBETIS';
        this.rankName = 'NORMAL BOSS';
    }

    trigger(bossName = 'KLEANTHIS THE REBETIS', rankName = '') {
        this.active = true;
        this.timer = this.maxTimer;
        this.bossName = bossName;
        if (rankName) {
            this.rankName = rankName;
        } else if (bossName.toUpperCase().includes('ROUF')) {
            this.rankName = 'HARD BOSS';
        } else {
            this.rankName = 'NORMAL BOSS';
        }
        this.pulsePhase = 0;
        this._hudBottomCss = BossWarningOverlay._measureHudBottomCss();

        if (window.soundEngine) {
            if (typeof window.soundEngine.playSelect === 'function') {
                window.soundEngine.playSelect();
            }
        }
    }

    static _measureHudBottomCss() {
        if (typeof document === 'undefined') return 0;
        const el = document.querySelector('#game-hud .hud-center-status, #game-hud .hud-center-score, #score-display');
        if (!el) return 0;
        const rect = el.getBoundingClientRect();
        return (rect && rect.height > 0) ? rect.bottom : 0;
    }

    static getSafeBannerAnchorY(cssH, bandHalfCss, isCompact, cachedHudBottom = 0) {
        const fallbackHud = isCompact ? 76 : 114;
        const hudBottom = cachedHudBottom > 0 ? Math.max(cachedHudBottom, fallbackHud * 0.7) : fallbackHud;
        const minSafeY = hudBottom + (isCompact ? 10 : 14) + bandHalfCss;
        const defaultY = isCompact ? Math.max(minSafeY, cssH * 0.28) : Math.max(minSafeY, cssH * 0.22);
        const maxSafeY = cssH * 0.5 - (isCompact ? 38 : 48) - bandHalfCss;
        return Math.min(defaultY, Math.max(minSafeY, maxSafeY));
    }

    update(dt = 1, camera = null) {
        if (!this.active) return;

        this.timer -= dt;
        this.pulsePhase += 0.16 * dt;
        this.stripeOffset = (this.stripeOffset + 3.5 * dt) % 40;

        // Rhythmic screen shakes on pulse peaks
        if (camera && Math.sin(this.pulsePhase) > 0.85) {
            camera.shake(3, 4);
        }

        if (this.timer <= 0) {
            this.active = false;
        }
    }

    static _getMobileVignetteCanvas() {
        if (BossWarningOverlay._mobileVigCanvas) return BossWarningOverlay._mobileVigCanvas;
        if (typeof document === 'undefined') return null;
        const size = 128;
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const vctx = c.getContext('2d');
        if (!vctx) return null;
        const r = size / 2;
        const grad = vctx.createRadialGradient(r, r, r * 0.25, r, r, r * 1.15);
        grad.addColorStop(0, 'rgba(255, 0, 0, 0)');
        grad.addColorStop(0.7, 'rgba(235, 47, 6, 0.45)');
        grad.addColorStop(1, 'rgba(180, 0, 0, 0.82)');
        vctx.fillStyle = grad;
        vctx.fillRect(0, 0, size, size);
        BossWarningOverlay._mobileVigCanvas = c;
        return c;
    }

    draw(ctx, width, height) {
        if (!this.active || this.timer <= 0 || !ctx) return;

        ctx.save();
        try {
            const game = (typeof window !== 'undefined') ? window.gameInstance : null;
            const dpr = (game && Number.isFinite(game.dpr) && game.dpr > 0) ? game.dpr : 1;
            const cssW = width / dpr;
            const cssH = height / dpr;
            const isCompact = cssW < 780 || cssH < 520;
            const uiScale = isCompact
                ? Math.max(0.80, Math.min(1.0, cssW / 760))
                : Math.max(0.90, Math.min(1.12, cssW / 1280));
            const s = dpr * uiScale;

            const elapsed = Math.max(0, this.maxTimer - this.timer);
            const inT = Math.min(1, elapsed / 14);
            const outT = Math.min(1, this.timer / 24);
            const easeIn = 1 - Math.pow(1 - inT, 3);
            const masterAlpha = Math.max(0, Math.min(1, Math.min(inT, outT)));
            if (masterAlpha <= 0.01) return;

            const pulse = 0.55 + Math.sin(this.pulsePhase) * 0.45; // 0.1 to 1.0
            const isMobile = typeof MobilePerf !== 'undefined' && MobilePerf.isMobile;

            // 1. Edge-only Crimson Vignette (keeps center hero unobstructed; cached low-res sprite on mobile)
            const vigSprite = isMobile ? BossWarningOverlay._getMobileVignetteCanvas() : null;
            if (vigSprite) {
                const prevAlpha = ctx.globalAlpha;
                ctx.globalAlpha = prevAlpha * masterAlpha * (0.45 + 0.35 * pulse);
                ctx.drawImage(vigSprite, 0, 0, width, height);
                ctx.globalAlpha = prevAlpha;
            } else if (isMobile) {
                ctx.fillStyle = `rgba(180, 0, 0, ${(0.18 * pulse * masterAlpha).toFixed(3)})`;
                ctx.fillRect(0, 0, width, height);
            } else {
                const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.24, width / 2, height / 2, width * 0.78);
                grad.addColorStop(0, 'rgba(255, 0, 0, 0)');
                grad.addColorStop(0.68, `rgba(220, 38, 38, ${(0.30 * pulse * masterAlpha).toFixed(3)})`);
                grad.addColorStop(1, `rgba(140, 0, 0, ${(0.58 * pulse * masterAlpha).toFixed(3)})`);
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, width, height);
            }

            // 2. Upper-Band Sleek Warning Ribbon (no screen-edge HUD overlap, no boxy border, clear center arena)
            const slideY = ((1 - easeIn) * -12 - (this.timer < 24 ? (1 - outT) * 8 : 0)) * s;
            const animScale = 0.93 + 0.07 * easeIn;
            const bandW = Math.min(cssW * (isCompact ? 0.86 : 0.64), isCompact ? 560 : 720) * dpr;
            const bandHCss = (isCompact ? 56 : 72) * uiScale;
            const bandH = bandHCss * dpr;
            const halfBandW = bandW / 2;
            const halfBandH = bandH / 2;

            const cssAnchorY = BossWarningOverlay.getSafeBannerAnchorY(cssH, bandHCss * 0.5, isCompact, this._hudBottomCss || 0);
            const centerX = width / 2;
            const centerY = cssAnchorY * dpr + slideY;

            const rUp = (this.rankName || '').toUpperCase();
            const rankColor = (rUp.includes('INSANE') || rUp.includes('APEX')) ? '#ff4757'
                : (rUp.includes('VERY HARD') ? '#ff9f43'
                    : (rUp.includes('HARD') ? '#e056fd'
                        : (rUp.includes('EASY') ? '#2ed573' : '#54a0ff')));

            ctx.translate(centerX, centerY);
            ctx.scale(animScale, animScale);
            ctx.globalAlpha *= masterAlpha;

            // Feathered crimson-obsidian backdrop fading to zero at both horizontal ends
            const bgGrad = ctx.createLinearGradient(-halfBandW, 0, halfBandW, 0);
            bgGrad.addColorStop(0, 'rgba(18, 4, 8, 0)');
            bgGrad.addColorStop(0.16, 'rgba(22, 4, 9, 0.56)');
            bgGrad.addColorStop(0.5, 'rgba(26, 4, 10, 0.80)');
            bgGrad.addColorStop(0.84, 'rgba(22, 4, 9, 0.56)');
            bgGrad.addColorStop(1, 'rgba(18, 4, 8, 0)');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(-halfBandW, -halfBandH, bandW, bandH);

            // Pulsing crimson energy wash
            const auraGrad = ctx.createLinearGradient(-halfBandW, 0, halfBandW, 0);
            auraGrad.addColorStop(0, 'rgba(255, 46, 76, 0)');
            auraGrad.addColorStop(0.35, `rgba(255, 46, 76, ${(0.10 + 0.08 * pulse).toFixed(3)})`);
            auraGrad.addColorStop(0.5, `rgba(255, 71, 87, ${(0.18 + 0.10 * pulse).toFixed(3)})`);
            auraGrad.addColorStop(0.65, `rgba(255, 46, 76, ${(0.10 + 0.08 * pulse).toFixed(3)})`);
            auraGrad.addColorStop(1, 'rgba(255, 46, 76, 0)');
            ctx.fillStyle = auraGrad;
            ctx.fillRect(-halfBandW, -halfBandH, bandW, bandH);

            // Slim animated tapered caution rails along top & bottom of the band
            const railH = Math.max(3, 4.2 * s);
            this.drawHazardStripes(ctx, -halfBandW, -halfBandH, bandW, railH, pulse, s);
            this.drawHazardStripes(ctx, -halfBandW, halfBandH - railH, bandW, railH, pulse, s);

            // Thin glowing accent hairlines framing the caution rails horizontally
            const lineH = Math.max(1.2, 1.6 * s);
            const lineGrad = ctx.createLinearGradient(-halfBandW, 0, halfBandW, 0);
            lineGrad.addColorStop(0, 'rgba(255, 71, 87, 0)');
            lineGrad.addColorStop(0.22, `rgba(255, 71, 87, ${(0.55 + 0.30 * pulse).toFixed(3)})`);
            lineGrad.addColorStop(0.5, 'rgba(254, 211, 48, 0.95)');
            lineGrad.addColorStop(0.78, `rgba(255, 71, 87, ${(0.55 + 0.30 * pulse).toFixed(3)})`);
            lineGrad.addColorStop(1, 'rgba(255, 71, 87, 0)');
            ctx.fillStyle = lineGrad;
            ctx.fillRect(-halfBandW, -halfBandH + railH, bandW, lineH);
            ctx.fillRect(-halfBandW, halfBandH - railH - lineH, bandW, lineH);

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.lineJoin = 'round';
            const maxTextW = bandW * 0.86;

            const eyebrowPx = Math.max(11, Math.round((isCompact ? 12.5 : 15.5) * s));
            const eyebrowY = -(isCompact ? 11.5 : 14.5) * s;
            ctx.font = `900 ${eyebrowPx}px 'Luckiest Guy', cursive`;
            ctx.lineWidth = Math.max(2, 3.6 * s);
            ctx.strokeStyle = '#14060a';
            const warnLabel = '⚠  WARNING  •  BOSS INCOMING  ⚠';
            ctx.strokeText(warnLabel, 0, eyebrowY, maxTextW);
            ctx.fillStyle = '#fed330';
            ctx.fillText(warnLabel, 0, eyebrowY, maxTextW);

            const titlePx = Math.max(15, Math.round((isCompact ? 19.5 : 26) * s));
            const titleY = (isCompact ? 10 : 13) * s;
            const bossTitle = this.bossName ? `${this.bossName}  •  ${this.rankName}` : `BOSS INCOMING  •  ${this.rankName}`;
            ctx.font = `900 ${titlePx}px 'Luckiest Guy', cursive`;
            ctx.lineWidth = Math.max(2.5, 4.4 * s);
            ctx.strokeStyle = '#14060a';
            ctx.strokeText(bossTitle, 0, titleY, maxTextW);
            ctx.fillStyle = rankColor;
            ctx.fillText(bossTitle, 0, titleY, maxTextW);
        } finally {
            ctx.restore();
        }
    }

    drawHazardStripes(ctx, x, y, w, h, pulse, scale = 1) {
        ctx.save();
        try {
            const halfW = w / 2;
            const midX = x + halfW;
            const step = Math.max(14, Math.round(20 * scale));
            const tickW = step * 0.48;
            const skew = h * 0.9;
            const offset = (((this.stripeOffset || 0) % 40) / 40) * step;
            const startX = x + offset - step;
            const endX = x + w;

            for (let sx = startX; sx < endX; sx += step) {
                const tickCenter = sx + tickW * 0.5;
                const edgeDist = Math.abs(tickCenter - midX) / Math.max(1, halfW);
                if (edgeDist >= 0.92) continue;
                const taper = Math.max(0, 1 - Math.pow(edgeDist / 0.92, 1.8));
                const tickAlpha = (0.45 + 0.45 * pulse) * taper;
                if (tickAlpha <= 0.03) continue;

                ctx.fillStyle = `rgba(255, 71, 87, ${tickAlpha.toFixed(3)})`;
                ctx.beginPath();
                ctx.moveTo(sx, y);
                ctx.lineTo(sx + tickW, y);
                ctx.lineTo(sx + tickW - skew, y + h);
                ctx.lineTo(sx - skew, y + h);
                ctx.closePath();
                ctx.fill();
            }
        } finally {
            ctx.restore();
        }
    }
}

if (typeof window !== 'undefined') {
    window.BossWarningOverlay = BossWarningOverlay;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BossWarningOverlay };
}
