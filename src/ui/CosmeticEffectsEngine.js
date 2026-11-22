/**
 * Lesa.io - Advanced Cosmetic Effects, Orbital Frame SVGs & Minted 3D Coin Engine
 * Upgrades Banners, Avatar Frames, and Milestone Coins with:
 *   - Multi-stop metallic beveled SVG medallions + diagonal foil gleam sweeps + orbital celestial halos
 *   - Live GPU-composited SVG particle/scanline/lightning decorators injected cleanly on banners & frames
 *   - Smooth rAF-throttled holographic pointer tracking (--cos-mx / --cos-my / 3D card tilt)
 */

class CosmeticEffectsEngine {
    static _uidSeq = 1;
    static _holoBound = new WeakSet();

    static _bannerThemeFor(el) {
        if (!el) return null;
        if (typeof PROFILE_BANNERS !== 'undefined') {
            for (const b of PROFILE_BANNERS) {
                if (el.classList.contains(b.cssClass)) {
                    if (b.fxTheme) return b.fxTheme;
                    if (b.rarity === 'celestial') return 'cosmic';
                    if (b.rarity === 'mythic') return b.id.includes('olympus') ? 'lightning' : 'firestorm';
                    if (b.rarity === 'legendary') return b.id.includes('slayer') ? 'chevrons' : 'embers_warm';
                    if (b.cssClass.includes('cyber') || b.cssClass.includes('stormfront')) return 'cyber_speed';
                    if (b.cssClass.includes('frost')) return 'ice';
                }
            }
        }
        return null;
    }

    static _frameThemeFor(el) {
        if (!el) return null;
        if (typeof PROFILE_FRAMES !== 'undefined') {
            for (const f of PROFILE_FRAMES) {
                if (el.classList.contains(f.cssClass)) {
                    if (f.fxRing) return f.fxRing;
                    if (f.rarity === 'celestial') return 'orbital';
                    if (f.rarity === 'mythic') return 'reticle';
                    if (f.rarity === 'legendary') return 'laurel';
                    if (f.rarity === 'epic') return 'cyber';
                    if (f.rarity === 'rare') return 'embers';
                }
            }
        }
        return null;
    }

    static _bannerOverlaySvg(theme) {
        if (!theme) return '';
        if (theme === 'firestorm' || theme === 'embers_warm') {
            const c = theme === 'firestorm' ? '#fb7185' : '#fbbf24';
            return `<svg viewBox="0 0 300 90" preserveAspectRatio="none" class="cos-fx-svg">
                <circle class="cos-ember p1" cx="42" cy="76" r="2.6" fill="#fde047"/>
                <circle class="cos-ember p2" cx="112" cy="82" r="2.2" fill="${c}"/>
                <circle class="cos-ember p3" cx="186" cy="74" r="3.0" fill="#fb923c"/>
                <circle class="cos-ember p4" cx="254" cy="80" r="2.4" fill="#fef08a"/>
                <path class="cos-streak" d="M-30 68 L90 12 M70 86 L210 10" stroke="${c}" stroke-width="1.5" opacity="0.45"/>
            </svg>`;
        }
        if (theme === 'cyber_speed' || theme === 'chevrons') {
            return `<svg viewBox="0 0 300 90" preserveAspectRatio="none" class="cos-fx-svg">
                <path class="cos-cyber-beam" d="M-40 22 L340 22 M-40 66 L340 66" stroke="#22d3ee" stroke-width="1.3" stroke-dasharray="18 22" opacity="0.55"/>
                <polygon class="cos-chev c1" points="32,45 48,26 56,26 40,45 56,64 48,64" fill="#ff4785" opacity="0.4"/>
                <polygon class="cos-chev c2" points="228,45 244,26 252,26 236,45 252,64 244,64" fill="#38bdf8" opacity="0.4"/>
            </svg>`;
        }
        if (theme === 'lightning' || theme === 'ice') {
            const col = theme === 'lightning' ? '#fef08a' : '#e0f2fe';
            return `<svg viewBox="0 0 300 90" preserveAspectRatio="none" class="cos-fx-svg">
                <polyline class="cos-bolt" points="28,4 42,32 32,38 52,78" fill="none" stroke="${col}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline class="cos-bolt b2" points="262,8 244,36 256,42 232,84" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
        }
        if (theme === 'lil_xas') {
            return `<svg viewBox="0 0 300 90" preserveAspectRatio="none" class="cos-fx-svg cos-lilxas-svg">
                <g class="cos-lx-beam b1"><polygon points="56,90 12,-10 74,-10" fill="rgba(0, 245, 255, 0.22)"/></g>
                <g class="cos-lx-beam b2"><polygon points="210,90 155,-10 232,-10" fill="rgba(224, 86, 253, 0.24)"/></g>
                <line class="cos-lx-laser" x1="-20" y1="45" x2="320" y2="45" stroke="#00f5ff" stroke-width="1.5" opacity="0.6"/>
                <path class="cos-star cos-lx-flash f1" d="M46 22l2.5 7 7 2.5-7 2.5-2.5 7-2.5-7-7-2.5 7-2.5z" fill="#ffffff"/>
                <path class="cos-star cos-lx-flash f2" d="M188 18l2.2 6 6 2.2-6 2.2-2.2 6-2.2-6-6-2.2 6-2.2z" fill="#fde047"/>
                <text class="cos-lx-note n1" x="88" y="68" fill="#00f5ff" font-size="13" font-weight="900">♪</text>
                <text class="cos-lx-note n2" x="148" y="72" fill="#f472b6" font-size="14" font-weight="900">♫</text>
                <text class="cos-lx-note n3" x="202" y="64" fill="#fde047" font-size="12" font-weight="900">♪</text>
            </svg>
            <div class="cos-lx-eq" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
            <div class="cos-lx-vinyl" aria-hidden="true"></div>
            <img class="cos-lilxas-face" src="assets/Cosmetics/LilXasBannerFace.png" alt="Lil Xas" draggable="false">`;
        }
        if (theme === 'cosmic' || theme === 'apex_nova') {
            const isApex = theme === 'apex_nova';
            return `<svg viewBox="0 0 300 90" preserveAspectRatio="none" class="cos-fx-svg">
                <path class="cos-star s1" d="M38 20l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="${isApex ? '#ff2e4c' : '#fde047'}"/>
                <path class="cos-star s2" d="M158 14l2.4 7 7 2.4-7 2.4-2.4 7-2.4-7-7-2.4 7-2.4z" fill="#38bdf8"/>
                <path class="cos-star s3" d="M256 54l2 5.5 5.5 2-5.5 2-2 5.5-2-5.5-5.5-2 5.5-2z" fill="${isApex ? '#fde047' : '#f472b6'}"/>
                <line class="cos-scan-laser" x1="0" y1="45" x2="300" y2="45" stroke="${isApex ? '#ff2e4c' : '#22d3ee'}" stroke-width="1.4" opacity="0.5"/>
            </svg>`;
        }
        return '';
    }

    static _frameRingSvg(theme) {
        if (!theme) return '';
        if (theme === 'orbital' || theme === 'apex') {
            const c1 = theme === 'apex' ? '#ff2e4c' : '#fde047';
            const c2 = theme === 'apex' ? '#fed330' : '#38bdf8';
            return `<svg viewBox="0 0 100 100" class="cos-frame-fx-svg">
                <circle cx="50" cy="50" r="46" fill="none" stroke="${c1}" stroke-width="2" stroke-dasharray="14 10 4 10" stroke-linecap="round"/>
                <circle cx="50" cy="4" r="3.4" fill="${c2}"/>
                <circle cx="50" cy="96" r="3.4" fill="${c1}"/>
                <polygon points="96,50 90,46 90,54" fill="${c2}"/>
                <polygon points="4,50 10,46 10,54" fill="${c1}"/>
            </svg>`;
        }
        if (theme === 'reticle' || theme === 'cyber') {
            const col = theme === 'reticle' ? '#fb7185' : '#22d3ee';
            return `<svg viewBox="0 0 100 100" class="cos-frame-fx-svg">
                <circle cx="50" cy="50" r="46" fill="none" stroke="${col}" stroke-width="2.2" stroke-dasharray="22 28" stroke-linecap="round"/>
                <path d="M50 2 L50 10 M50 90 L50 98 M2 50 L10 50 M90 50 L98 50" stroke="#fde047" stroke-width="2.4" stroke-linecap="round"/>
            </svg>`;
        }
        if (theme === 'laurel') {
            return `<svg viewBox="0 0 100 100" class="cos-frame-fx-svg cos-frame-fx-slow">
                <circle cx="50" cy="50" r="46" fill="none" stroke="#fbbf24" stroke-width="2" stroke-dasharray="6 7" stroke-linecap="round"/>
                <circle cx="18" cy="18" r="2.5" fill="#fef08a"/>
                <circle cx="82" cy="82" r="2.5" fill="#fef08a"/>
            </svg>`;
        }
        return `<svg viewBox="0 0 100 100" class="cos-frame-fx-svg cos-frame-fx-slow">
            <circle cx="50" cy="50" r="46" fill="none" stroke="#fb923c" stroke-width="1.6" stroke-dasharray="10 14" opacity="0.8"/>
        </svg>`;
    }

    static syncElementDecorators(el) {
        if (!el || typeof document === 'undefined') return;
        const bTheme = this._bannerThemeFor(el);
        const fTheme = this._frameThemeFor(el);

        let bLayer = el.querySelector(':scope > .cos-banner-fx-layer');
        if (bTheme) {
            if (!bLayer) {
                bLayer = document.createElement('span');
                bLayer.className = 'cos-banner-fx-layer';
                bLayer.setAttribute('aria-hidden', 'true');
                el.insertBefore(bLayer, el.firstChild);
            }
            if (bLayer.dataset.theme !== bTheme) {
                bLayer.dataset.theme = bTheme;
                bLayer.innerHTML = this._bannerOverlaySvg(bTheme);
            }
        } else if (bLayer) {
            bLayer.remove();
        }

        let fLayer = el.querySelector(':scope > .cos-frame-fx-ring');
        if (fTheme) {
            if (!fLayer) {
                fLayer = document.createElement('span');
                fLayer.className = 'cos-frame-fx-ring';
                fLayer.setAttribute('aria-hidden', 'true');
                el.appendChild(fLayer);
            }
            if (fLayer.dataset.theme !== fTheme) {
                fLayer.dataset.theme = fTheme;
                fLayer.innerHTML = this._frameRingSvg(fTheme);
            }
        } else if (fLayer) {
            fLayer.remove();
        }
    }

    static decorateContainer(root) {
        if (!root || typeof root.querySelectorAll !== 'function') return;
        const targets = root.querySelectorAll(
            '.cos-banner-preview, .cos-frame-demo, .profile-header-card, .prof-avatar-wrap, .pub-banner-hero, .pub-avatar-wrap, .friend-card, .lb-item'
        );
        targets.forEach((el) => this.syncElementDecorators(el));
    }

    static bindHoloCards(root) {
        if (!root || typeof window === 'undefined') return;
        if (window.matchMedia && (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
            return;
        }
        const cards = root.querySelectorAll('.cos-card, .cos-banner-preview, .profile-header-card, .pub-banner-hero');
        cards.forEach((el) => {
            if (this._holoBound.has(el)) return;
            this._holoBound.add(el);
            let rafId = 0;
            let lastEvt = null;
            el.addEventListener('pointermove', (e) => {
                lastEvt = e;
                if (rafId) return;
                rafId = requestAnimationFrame(() => {
                    rafId = 0;
                    if (!lastEvt) return;
                    const rect = el.getBoundingClientRect();
                    if (rect.width <= 0 || rect.height <= 0) return;
                    const px = Math.max(0, Math.min(1, (lastEvt.clientX - rect.left) / rect.width));
                    const py = Math.max(0, Math.min(1, (lastEvt.clientY - rect.top) / rect.height));
                    el.style.setProperty('--cos-mx', `${Math.round(px * 100)}%`);
                    el.style.setProperty('--cos-my', `${Math.round(py * 100)}%`);
                    el.style.setProperty('--cos-rx', `${((0.5 - py) * 7).toFixed(2)}deg`);
                    el.style.setProperty('--cos-ry', `${((px - 0.5) * 9).toFixed(2)}deg`);
                });
            });
            el.addEventListener('pointerleave', () => {
                el.style.removeProperty('--cos-rx');
                el.style.removeProperty('--cos-ry');
            });
        });
    }

    static _extendedGlyphSvg(glyph, stroke = 'rgba(255,255,255,0.96)') {
        const extra = {
            swords: `<path d="M7 17l10-10M14 7h3v3M17 17L7 7M7 10V7h3" stroke="${stroke}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
            vf185: `<circle cx="7.5" cy="15.5" r="2.3" fill="none" stroke="${stroke}" stroke-width="1.6"/><circle cx="16.5" cy="15.5" r="2.3" fill="none" stroke="${stroke}" stroke-width="1.6"/><path d="M7.5 15.5L11 10h3.8l2.2 5.5M12.5 8l3-1.2" stroke="${stroke}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
            helios: `<circle cx="12" cy="12" r="3.4" fill="${stroke}"/><path d="M12 4.5v2.2M12 17.3v2.2M4.5 12h2.2M17.3 12h2.2M6.7 6.7l1.6 1.6M15.7 15.7l1.6 1.6M17.3 6.7l-1.6 1.6M8.3 15.7l-1.6 1.6" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round"/>`,
            omega: `<path d="M7.2 17h3v-2c-1.5-.9-2.4-2.3-2.4-4a4.2 4.2 0 118.4 0c0 1.7-.9 3.1-2.4 4v2h3" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
        };
        return extra[glyph] || null;
    }

    static buildCoinHtml(coin, sizeClass = 'sm', locked = false, glyphFallbackFn = null) {
        if (!coin) return '';
        const rar = (typeof CosmeticManager !== 'undefined') ? CosmeticManager.getRarityMeta(coin.rarity) : { label: coin.rarity };
        const uid = `cc${this._uidSeq++}`;
        const title = `${coin.name} [${rar.label}] — ${coin.desc}`;
        const ext = this._extendedGlyphSvg(coin.glyph);
        const glyphMarkup = ext || (typeof glyphFallbackFn === 'function' ? glyphFallbackFn(coin.glyph) : '');
        const isHigh = (coin.rarity === 'mythic' || coin.rarity === 'celestial' || coin.rarity === 'legendary');

        return `
            <span class="cos-coin cos-coin-${sizeClass} rarity-${coin.rarity} ${locked ? 'is-locked' : 'cos-coin-minted'}"
                  style="--coin-rim:${coin.rim}; --coin-core:${coin.core};"
                  title="${title.replace(/"/g, '&quot;')}">
                ${isHigh && !locked ? '<span class="cos-coin-orbit" aria-hidden="true"></span>' : ''}
                <svg viewBox="0 0 28 28" class="cos-coin-svg" aria-hidden="true">
                    <defs>
                        <radialGradient id="${uid}c" cx="35%" cy="30%" r="70%">
                            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.34"/>
                            <stop offset="45%" stop-color="${coin.core}"/>
                            <stop offset="100%" stop-color="#05070d"/>
                        </radialGradient>
                        <linearGradient id="${uid}r" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#ffffff"/>
                            <stop offset="35%" stop-color="${coin.rim}"/>
                            <stop offset="75%" stop-color="#0f172a"/>
                            <stop offset="100%" stop-color="${coin.rim}"/>
                        </linearGradient>
                    </defs>
                    <circle cx="14" cy="14" r="12.2" fill="url(#${uid}r)" stroke="#090d16" stroke-width="1.3"/>
                    <circle cx="14" cy="14" r="10.1" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="0.9" stroke-dasharray="1.4 1.4"/>
                    <circle cx="14" cy="14" r="9.4" fill="url(#${uid}c)" stroke="${coin.rim}" stroke-width="0.8"/>
                    <g transform="translate(2, 2)">${glyphMarkup}</g>
                    <ellipse cx="10.5" cy="8.5" rx="4.2" ry="1.8" transform="rotate(-24 10.5 8.5)" fill="rgba(255,255,255,0.32)"/>
                </svg>
                ${!locked ? '<span class="cos-coin-gleam" aria-hidden="true"></span>' : ''}
            </span>
        `;
    }
}

if (typeof window !== 'undefined') {
    window.CosmeticEffectsEngine = CosmeticEffectsEngine;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CosmeticEffectsEngine };
}
