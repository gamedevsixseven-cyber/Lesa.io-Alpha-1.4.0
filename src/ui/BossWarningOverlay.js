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

        if (window.soundEngine) {
            if (typeof window.soundEngine.playSelect === 'function') {
                window.soundEngine.playSelect();
            }
        }
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
            const progress = 1.0 - (this.timer / this.maxTimer);
            const pulse = 0.55 + Math.sin(this.pulsePhase) * 0.45; // 0.1 to 1.0
            const isMobile = typeof MobilePerf !== 'undefined' && MobilePerf.isMobile;

            // 1. Fullscreen Red Flashing Vignette (cached low-res sprite on mobile to avoid Wave 10 GPU gradient churn)
            const vigSprite = isMobile ? BossWarningOverlay._getMobileVignetteCanvas() : null;
            if (vigSprite) {
                const prevAlpha = ctx.globalAlpha;
                ctx.globalAlpha = prevAlpha * pulse;
                ctx.drawImage(vigSprite, 0, 0, width, height);
                ctx.globalAlpha = prevAlpha;
            } else if (isMobile) {
                ctx.fillStyle = `rgba(180, 0, 0, ${0.22 * pulse})`;
                ctx.fillRect(0, 0, width, height);
            } else {
                const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.2, width / 2, height / 2, width * 0.75);
                grad.addColorStop(0, 'rgba(255, 0, 0, 0)');
                grad.addColorStop(0.7, `rgba(235, 47, 6, ${0.45 * pulse})`);
                grad.addColorStop(1, `rgba(180, 0, 0, ${0.82 * pulse})`);
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, width, height);
            }

            // 2. Animated Top & Bottom Hazard Warning Stripes
            const stripeH = 34;
            this.drawHazardStripes(ctx, 0, 0, width, stripeH, pulse);
            this.drawHazardStripes(ctx, 0, height - stripeH, width, stripeH, pulse);

            // 3. Center Warning Presentation Banner
            const halfW = width / 2;
            const halfH = height / 2;

            const scale = Math.min(1.0, Math.max(0.48, width / 720));
            const bannerW = Math.min(640, width * 0.92);
            const bannerH = 150 * scale;
            const halfBannerW = bannerW / 2;
            const halfBannerH = bannerH / 2;

            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Warning Pill Background
            ctx.fillStyle = 'rgba(20, 0, 0, 0.88)';
            ctx.beginPath();
            ctx.roundRect(halfW - halfBannerW, halfH - halfBannerH, bannerW, bannerH, 20 * scale);
            ctx.fill();
            ctx.lineWidth = Math.max(2, 5 * scale);
            ctx.strokeStyle = `rgba(255, 71, 87, ${0.8 + 0.2 * pulse})`;
            ctx.stroke();

            // Inner Glow Stroke
            ctx.lineWidth = Math.max(1, 2 * scale);
            ctx.strokeStyle = '#fed330';
            ctx.strokeRect(halfW - halfBannerW + 6 * scale, halfH - halfBannerH + 6 * scale, bannerW - 12 * scale, bannerH - 12 * scale);

            // Title 1: "⚠️ WARNING ⚠️"
            const title1Size = Math.max(18, Math.round(38 * scale));
            ctx.font = `900 ${title1Size}px 'Luckiest Guy', cursive`;
            ctx.lineWidth = Math.max(3, 8 * scale);
            ctx.strokeStyle = '#1e272e';
            ctx.strokeText('⚠️ WARNING ⚠️', halfW, halfH - 20 * scale);
            ctx.fillStyle = '#fed330';
            ctx.fillText('⚠️ WARNING ⚠️', halfW, halfH - 20 * scale);

            // Title 2: "BOSS INCOMING! • [RANK]"
            const title2Size = Math.max(20, Math.round(42 * scale));
            ctx.font = `900 ${title2Size}px 'Luckiest Guy', cursive`;
            ctx.lineWidth = Math.max(4, 8 * scale);
            ctx.strokeStyle = '#1e272e';
            const rankText = `${this.bossName ? this.bossName + ' • ' : 'BOSS INCOMING! • '}${this.rankName}`;
            ctx.strokeText(rankText, halfW, halfH + 34 * scale, bannerW - 28 * scale);
            const rUp = (this.rankName || '').toUpperCase();
            ctx.fillStyle = rUp.includes('INSANE') ? '#ff4757'
                : (rUp.includes('VERY HARD') ? '#e67e22'
                    : (rUp.includes('HARD') ? '#e056fd'
                        : (rUp.includes('EASY') ? '#2ed573' : '#54a0ff')));
            ctx.fillText(rankText, halfW, halfH + 34 * scale, bannerW - 28 * scale);

            ctx.restore();
        } finally {
            ctx.restore();
        }
    }

    drawHazardStripes(ctx, x, y, w, h, pulse) {
        ctx.save();
        try {
            ctx.beginPath();
            ctx.rect(x, y, w, h);
            ctx.clip();

            ctx.fillStyle = '#1e272e';
            ctx.fillRect(x, y, w, h);

            ctx.fillStyle = `rgba(255, 71, 87, ${0.75 + 0.25 * pulse})`;
            const stripeW = 28;
            const total = Math.ceil(w / stripeW) + 4;
            for (let i = -2; i < total; i++) {
                const sx = i * stripeW + this.stripeOffset;
                ctx.beginPath();
                ctx.moveTo(sx, y);
                ctx.lineTo(sx + 14, y);
                ctx.lineTo(sx + 14 - 10, y + h);
                ctx.lineTo(sx - 10, y + h);
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
