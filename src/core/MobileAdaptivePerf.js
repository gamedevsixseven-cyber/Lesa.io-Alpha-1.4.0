/**
 * Lesa.io - Mobile Adaptive Frame Pacing & Zero-Latency Touch DOM Scheduler
 * Keeps Desktop PC paths 100% untouched while eliminating mobile pointermove reflows,
 * throttling redundant target scans at 120Hz+, and smoothly easing heavy particle/DPR
 * pressure if a mobile phone drops frames under thermal load or Co-op waves.
 */

class MobileAdaptivePerf {
    static _pendingDom = new Map();
    static _rafScheduled = false;
    static _avgFrameMs = 16.7;
    static _reliefLevel = 0; // 0 = full preset, 1 = mild particle/minimap relief, 2 = strong DPR+FX relief
    static _lastResizeAdjustMs = 0;
    static _lowSamples = 0;
    static _goodSamples = 0;

    static isActive() {
        return typeof MobilePerf !== 'undefined' && !!MobilePerf.isMobile;
    }

    /**
     * Batch 120Hz/240Hz pointermove transform writes to once per vsync via translate3d.
     * Gameplay vectors/angles still update synchronously on pointer events for zero input lag.
     */
    static queueTransform3d(el, x, y) {
        if (!el) return;
        const rx = Math.round(x * 2) * 0.5;
        const ry = Math.round(y * 2) * 0.5;
        this._pendingDom.set(el, `translate3d(${rx}px, ${ry}px, 0)`);
        if (!this._rafScheduled && typeof requestAnimationFrame === 'function') {
            this._rafScheduled = true;
            requestAnimationFrame(() => this.flushDomQueue());
        }
    }

    static clearQueuedTransform(el) {
        if (!el) return;
        this._pendingDom.delete(el);
        el.style.transform = 'translate3d(0px, 0px, 0)';
    }

    static flushDomQueue() {
        this._rafScheduled = false;
        if (this._pendingDom.size === 0) return;
        for (const [el, tx] of this._pendingDom.entries()) {
            if (el && el.style) el.style.transform = tx;
        }
        this._pendingDom.clear();
    }

    /**
     * Avoid running full O(N) enemy scans on every 120Hz/240Hz pointermove sub-frame.
     */
    static getThrottledAimTarget(ti, player, maxDist) {
        if (!ti || !player || typeof MobileAimAssist === 'undefined') return null;
        const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
        const prev = ti.lockedTarget;
        if (prev && !prev.dead && prev.hp > 0 && !prev.isDying && !prev.isAirborneImmune && (now - (ti._lastTargetScanMs || 0)) < 24) {
            return prev;
        }
        ti._lastTargetScanMs = now;
        const target = MobileAimAssist.findTarget(ti.game, player, maxDist);
        ti.lockedTarget = target;
        return target;
    }

    static sampleFrame(game, rawDeltaMs) {
        if (!this.isActive() || !game || game.state !== 'PLAYING') return;
        if (!Number.isFinite(rawDeltaMs) || rawDeltaMs <= 0 || rawDeltaMs > 180) return;

        this._avgFrameMs = this._avgFrameMs * 0.90 + rawDeltaMs * 0.10;
        const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();

        if (this._avgFrameMs > 27) {
            this._lowSamples++;
            this._goodSamples = 0;
            const targetLevel = (this._avgFrameMs > 36) ? 2 : 1;
            if (this._lowSamples >= 24 && targetLevel > this._reliefLevel) {
                this._setReliefLevel(game, targetLevel, now);
                this._lowSamples = 0;
            }
        } else if (this._avgFrameMs < 19.5 && this._reliefLevel > 0) {
            this._goodSamples++;
            this._lowSamples = 0;
            if (this._goodSamples >= 90) {
                this._setReliefLevel(game, this._reliefLevel - 1, now);
                this._goodSamples = 0;
            }
        } else {
            this._lowSamples = Math.max(0, this._lowSamples - 1);
        }
    }

    static _setReliefLevel(game, level, now) {
        const clamped = Math.max(0, Math.min(2, level));
        if (clamped === this._reliefLevel) return;
        this._reliefLevel = clamped;

        if (typeof MobilePerf !== 'undefined') {
            MobilePerf.applyFxBudgets(game);
            if (game && game.effects && clamped >= 1) {
                game.effects.MAX_PARTICLES = Math.max(8, Math.round(game.effects.MAX_PARTICLES * (clamped === 2 ? 0.55 : 0.72)));
                game.effects.MAX_POPUPS = Math.max(5, Math.round(game.effects.MAX_POPUPS * (clamped === 2 ? 0.65 : 0.80)));
            }
        }

        // Avoid mid-combat game.resize(): reallocating canvas width/height under heavy Wave 10 load triggers iOS WebKit tears
    }

    static applyAdaptiveCanvasScale(game) {
        if (!this.isActive() || !game || !game.canvas || this._reliefLevel < 2) return;
        if (typeof MobilePerf === 'undefined' || MobilePerf.getGraphicsQuality() === 'low') return;
        const vl = (typeof VirtualLandscape !== 'undefined' && VirtualLandscape.active) ? VirtualLandscape.getViewportSize() : null;
        const vv = (!vl && typeof window !== 'undefined') ? window.visualViewport : null;
        const cssW = Math.max(1, Math.round((vl && vl.width) || (vv && vv.width) || window.innerWidth));
        const cssH = Math.max(1, Math.round((vl && vl.height) || (vv && vv.height) || window.innerHeight));
        const targetDpr = Math.max(0.82, Math.min(game.dpr || 1.2, (game.dpr || 1.2) * 0.78));
        if (Math.abs(targetDpr - (game.dpr || 1)) < 0.08) return;

        game.dpr = targetDpr;
        game.canvas.width = Math.max(1, Math.floor(cssW * targetDpr));
        game.canvas.height = Math.max(1, Math.floor(cssH * targetDpr));
        if (game.camera) {
            game.camera.dpr = targetDpr;
        }
        if (game.ctx) {
            game.ctx.imageSmoothingEnabled = true;
            game.ctx.imageSmoothingQuality = 'low';
        }
    }

    static shouldThrottleAmbientParticle() {
        return this.isActive() && this._reliefLevel >= 1;
    }

    static getMinimapInterval(baseMobile = 6) {
        if (!this.isActive()) return 2;
        if (this._reliefLevel >= 2) return 12;
        if (this._reliefLevel >= 1) return 9;
        return baseMobile;
    }

    static resetSession(game = null) {
        this._avgFrameMs = 16.7;
        this._lowSamples = 0;
        this._goodSamples = 0;
        if (this._reliefLevel !== 0) {
            this._reliefLevel = 0;
            if (game && typeof MobilePerf !== 'undefined') {
                MobilePerf.applyFxBudgets(game);
                if (typeof game.resize === 'function') game.resize();
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.MobileAdaptivePerf = MobileAdaptivePerf;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MobileAdaptivePerf };
}
