/**
 * Lesa.io - Free Browser / PWA Virtual Auto-Landscape Helper (iPhone & Portrait Mobile)
 * When an iPhone (or portrait-locked mobile touch device) opens the game upright:
 *   - iOS Safari blocks screen.orientation.lock('landscape') and manifest orientation.
 *   - This helper marks html.vl-active, swaps logical viewport dimensions (H x W),
 *     and provides exact inverse coordinate mapping for 90deg CSS-rotated touch/pointer inputs.
 * Zero-cost on Desktop PC and already-horizontal Landscape mobile screens.
 */

class VirtualLandscape {
    static active = false;
    static logicalW = 0;
    static logicalH = 0;
    static physW = 0;
    static physH = 0;
    static _listenersBound = false;

    static _isMobileViewport() {
        if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
        if (typeof MobilePerf !== 'undefined') return !!MobilePerf.isMobile;
        const ua = navigator.userAgent || '';
        const isMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
        const isIPadOS = (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);
        const isCoarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
        const minDim = Math.min(window.innerWidth || 9999, window.innerHeight || 9999);
        return isMobileUA || isIPadOS || (isCoarse && minDim <= 1024);
    }

    static getViewportSize() {
        if (typeof window === 'undefined') {
            return { width: 1280, height: 720, physW: 1280, physH: 720, active: false };
        }
        const vv = window.visualViewport;
        const physW = Math.max(1, Math.round((vv && vv.width) ? vv.width : window.innerWidth));
        const physH = Math.max(1, Math.round((vv && vv.height) ? vv.height : window.innerHeight));
        const active = this._isMobileViewport() && physH > physW;
        return {
            width: active ? physH : physW,
            height: active ? physW : physH,
            physW,
            physH,
            active
        };
    }

    static sync() {
        const vp = this.getViewportSize();
        this.active = vp.active;
        this.logicalW = vp.width;
        this.logicalH = vp.height;
        this.physW = vp.physW;
        this.physH = vp.physH;

        if (typeof document !== 'undefined' && document.documentElement) {
            const root = document.documentElement;
            if (vp.active) {
                root.style.setProperty('--vl-w', vp.width + 'px');
                root.style.setProperty('--vl-h', vp.height + 'px');
                root.classList.add('vl-active');
            } else {
                root.classList.remove('vl-active');
                root.style.removeProperty('--vl-w');
                root.style.removeProperty('--vl-h');
            }
        }
        return vp;
    }

    static isActive() {
        return !!this.active;
    }

    /**
     * Converts physical viewport (clientX, clientY) into local landscape container coords (u, v)
     * matching transform-origin: top left; transform: rotate(90deg) translateY(-100%).
     */
    static toLocalPoint(clientX, clientY) {
        if (!this.active) return { x: clientX, y: clientY };
        const container = (typeof document !== 'undefined') ? document.getElementById('game-container') : null;
        if (container) {
            const rect = container.getBoundingClientRect();
            if (rect && rect.width > 0) {
                return {
                    x: clientY - rect.top,
                    y: rect.right - clientX
                };
            }
        }
        const pw = this.physW || (typeof window !== 'undefined' ? window.innerWidth : 390);
        return { x: clientY, y: pw - clientX };
    }

    static init() {
        this.sync();
        if (this._listenersBound || typeof window === 'undefined') return;
        this._listenersBound = true;

        let timer = null;
        const onChange = () => {
            const prevActive = this.active;
            const prevW = this.logicalW;
            const prevH = this.logicalH;
            this.sync();
            clearTimeout(timer);
            timer = setTimeout(() => {
                const vp = this.sync();
                const g = window.gameInstance;
                if (!g || typeof g.resize !== 'function') return;
                if (g.state === 'PLAYING' && prevActive === vp.active && Math.abs(vp.width - prevW) < 24 && Math.abs(vp.height - prevH) < 24) return;
                g.resize();
            }, 90);
        };
        window.addEventListener('DOMContentLoaded', onChange, { once: true });
        window.addEventListener('resize', onChange, { passive: true });
        window.addEventListener('orientationchange', onChange, { passive: true });
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', onChange, { passive: true });
        }
    }
}

VirtualLandscape.init();

if (typeof window !== 'undefined') {
    window.VirtualLandscape = VirtualLandscape;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VirtualLandscape;
}
