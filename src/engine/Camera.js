/**
 * Lesa.io - Camera System
 * Smooth tracking camera with screen-shake, zoom punch, and viewport culling
 */

class Camera {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.lerpSpeed = 0.12;
        
        this.shakeAmount = 0;
        this.shakeDecay = 0.9;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;

        this.zoom = this.computeAdaptiveZoom();
        this.targetZoom = this.zoom;
    }

    computeAdaptiveZoom() {
        const isCoarse = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        const dpr = this.dpr || 1;
        const h = (this.canvas ? this.canvas.height : (typeof window !== 'undefined' ? window.innerHeight : 720)) / dpr;
        if (!h || h <= 0) return 1.0;

        // ONLY scale zoom for touchscreen mobile devices with height < 600px
        if (isCoarse && h < 600) {
            const mobileZoom = h / 660;
            return Math.max(0.48, Math.min(0.85, mobileZoom));
        } else {
            // Desktop PC: Always exactly 1.0 zoom as it originally was
            return 1.0;
        }
    }

    follow(targetX, targetY) {
        this.targetX = targetX;
        this.targetY = targetY;
    }

    addShake(amount) {
        if (typeof localStorage !== 'undefined' && localStorage.getItem('lesaio_screenshake') === 'false') {
            return;
        }
        this.shakeAmount = Math.min(this.shakeAmount + amount, 28);
    }

    shake(amount, duration = 8) {
        this.addShake(amount);
    }

    update(dt = 1) {
        // Smooth target tracking
        this.x += (this.targetX - this.x) * this.lerpSpeed;
        this.y += (this.targetY - this.y) * this.lerpSpeed;

        // Smooth zoom
        this.zoom += (this.targetZoom - this.zoom) * 0.1;

        // Screen Shake calculation
        if (this.shakeAmount > 0.1) {
            this.shakeOffsetX = (Math.random() * 2 - 1) * this.shakeAmount;
            this.shakeOffsetY = (Math.random() * 2 - 1) * this.shakeAmount;
            this.shakeAmount *= Math.pow(this.shakeDecay, dt);
        } else {
            this.shakeAmount = 0;
            this.shakeOffsetX = 0;
            this.shakeOffsetY = 0;
        }
    }

    applyTransform(ctx) {
        ctx.save();
        const dpr = this.dpr || 1;
        const halfW = this.canvas.width / 2;
        const halfH = this.canvas.height / 2;

        ctx.translate(halfW + this.shakeOffsetX * dpr, halfH + this.shakeOffsetY * dpr);
        ctx.scale(this.zoom * dpr, this.zoom * dpr);
        ctx.translate(-this.x, -this.y);
    }

    restoreTransform(ctx) {
        ctx.restore();
    }

    screenToWorld(screenX, screenY) {
        const dpr = this.dpr || 1;
        const halfW = this.canvas.width / 2;
        const halfH = this.canvas.height / 2;
        const effectiveZoom = this.zoom * dpr;
        return {
            x: this.x + (screenX * dpr - halfW - this.shakeOffsetX * dpr) / effectiveZoom,
            y: this.y + (screenY * dpr - halfH - this.shakeOffsetY * dpr) / effectiveZoom
        };
    }

    worldToScreen(worldX, worldY) {
        const dpr = this.dpr || 1;
        const halfW = this.canvas.width / 2;
        const halfH = this.canvas.height / 2;
        const effectiveZoom = this.zoom * dpr;
        return {
            x: ((worldX - this.x) * effectiveZoom + halfW + this.shakeOffsetX * dpr) / dpr,
            y: ((worldY - this.y) * effectiveZoom + halfH + this.shakeOffsetY * dpr) / dpr
        };
    }

    isVisible(worldX, worldY, radius = 60) {
        const halfW = (this.canvas.width / 2) / this.zoom + radius;
        const halfH = (this.canvas.height / 2) / this.zoom + radius;
        return Math.abs(worldX - this.x) <= halfW && Math.abs(worldY - this.y) <= halfH;
    }
}
