/**
 * Lesa.io - UI Component: CreditsScreen
 * Theatrical End Credits Sequence for Story Mode Completion:
 * - Fades in "Game made by Psanas" spotlight title card
 * - Plays ending soundtrack ("Audio/Lesa.io (Credits).mp3")
 * - Smooth vertical crawl highlighting Psanas (Director/Lead Dev) & Antigravity (AI Partner)
 * - Interactive controls: Skip button [ESC], fast-forward toggle [SPACE / ⏩]
 */

class CreditsScreen {
    constructor() {
        this.active = false;
        this.onComplete = null;
        this.scrollAnimId = null;
        this.scrollY = 0;
        this.speed = 0.36; // Stately theatrical crawl speed (~21.6px/s for relaxed reading)
        this.speedMultiplier = 1.0;
        this.isFastForward = false;
        this.introTimeout = null;
        this.fadeToBlackTimeout = null;
        this.showIntroTimeout = null;
        this.outroTimeout = null;
        this.outroHoldTimeout = null;

        this.screenEl = document.getElementById('credits-screen');
        this.crawlEl = document.getElementById('credits-crawl-content');
        this.crawlViewportEl = document.querySelector('.credits-crawl-viewport');
        this.introEl = document.getElementById('credits-intro-card');
        this.outroEl = document.getElementById('credits-outro-card');
        this.skipBtn = document.getElementById('credits-skip-btn');
        this.fastBtn = document.getElementById('credits-speed-btn');

        this.bindEvents();
    }

    bindEvents() {
        if (this.skipBtn) {
            this.skipBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.close();
            });
        }

        if (this.fastBtn) {
            this.fastBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFastForward();
            });
        }

        window.addEventListener('keydown', (e) => {
            if (!this.active) return;
            if (e.code === 'Escape') {
                e.preventDefault();
                this.close();
            } else if (e.code === 'Space') {
                e.preventDefault();
                this.speedMultiplier = 3.5;
                this.updateSpeedUI(true);
            }
        });

        window.addEventListener('keyup', (e) => {
            if (!this.active) return;
            if (e.code === 'Space' && !this.isFastForward) {
                this.speedMultiplier = 1.0;
                this.updateSpeedUI(false);
            }
        });
    }

    toggleFastForward() {
        this.isFastForward = !this.isFastForward;
        this.speedMultiplier = this.isFastForward ? 3.5 : 1.0;
        this.updateSpeedUI(this.isFastForward);
    }

    updateSpeedUI(isFast) {
        if (!this.fastBtn) return;
        this.fastBtn.textContent = isFast ? '⏩ 3x FAST' : '▶ 1x SPEED';
        this.fastBtn.classList.toggle('active', isFast);
    }

    start(onComplete = null) {
        if (this.active) return;
        this.active = true;
        this.onComplete = onComplete;
        this.speedMultiplier = 1.0;
        this.isFastForward = false;
        this.updateSpeedUI(false);

        if (!this.screenEl) {
            this.screenEl = document.getElementById('credits-screen');
            this.crawlEl = document.getElementById('credits-crawl-content');
            this.crawlViewportEl = document.querySelector('.credits-crawl-viewport');
            this.introEl = document.getElementById('credits-intro-card');
            this.outroEl = document.getElementById('credits-outro-card');
            this.skipBtn = document.getElementById('credits-skip-btn');
            this.fastBtn = document.getElementById('credits-speed-btn');
            this.bindEvents();
        } else {
            if (!this.outroEl) this.outroEl = document.getElementById('credits-outro-card');
            if (!this.crawlViewportEl) this.crawlViewportEl = document.querySelector('.credits-crawl-viewport');
        }

        if (!this.screenEl) {
            if (typeof this.onComplete === 'function') this.onComplete();
            return;
        }

        // Build crawl DOM if not yet populated
        this.buildCrawlDOM();

        // 1. Reset crawl, intro card, and outro card states
        if (this.introEl) {
            this.introEl.classList.remove('hidden', 'fade-in', 'fade-out');
        }

        if (this.outroEl) {
            this.outroEl.classList.remove('hidden', 'fade-in', 'fade-out');
        }

        if (this.crawlViewportEl) {
            this.crawlViewportEl.classList.remove('fade-out');
        }

        if (this.crawlEl) {
            this.crawlEl.classList.remove('active');
            this.crawlEl.style.transform = 'translateY(0px)';
        }

        // 2. Unhide container from display:none at opacity:0
        this.screenEl.classList.remove('hidden', 'fade-out', 'visible');
        // Force synchronous layout reflow so browser commits display:flex & opacity:0
        // BEFORE the visible class transition is triggered
        void this.screenEl.offsetWidth;

        // 3. Fade in the soundtrack the moment before the black screen fades in
        if (window.soundEngine && typeof window.soundEngine.startCreditsBGM === 'function') {
            window.soundEngine.startCreditsBGM(2.8); // 2.8s gentle volume ramp
        }

        // 4. Musical lead-in (~450ms): slowly fade screen to pure black
        if (this.fadeToBlackTimeout) clearTimeout(this.fadeToBlackTimeout);
        this.fadeToBlackTimeout = setTimeout(() => {
            if (!this.active) return;
            this.screenEl.classList.add('visible');

            // 5. AND THEN (after screen has slowly faded to pure black, ~2.2s), smoothly show "Game Made By Psanas"
            if (this.showIntroTimeout) clearTimeout(this.showIntroTimeout);
            this.showIntroTimeout = setTimeout(() => {
                if (!this.active) return;
                if (this.introEl) {
                    this.introEl.classList.remove('hidden', 'fade-out');
                    this.introEl.classList.add('fade-in');
                }

                // 6. Hold "Game Made By Psanas" for 7.5s, then fade out and roll credits crawl
                if (this.introTimeout) clearTimeout(this.introTimeout);
                this.introTimeout = setTimeout(() => {
                    if (!this.active) return;
                    if (this.introEl) {
                        this.introEl.classList.add('fade-out');
                    }
                    setTimeout(() => {
                        if (!this.active) return;
                        if (this.introEl) this.introEl.classList.remove('fade-in');
                        this.startCrawl();
                    }, 1800);
                }, 7500);
            }, 2200);
        }, 450);
    }

    startCrawl() {
        if (!this.active || !this.crawlEl) return;

        // Position crawl starting just below the viewport
        const screenH = window.innerHeight || 800;
        this.scrollY = screenH * 0.95;
        this.crawlEl.style.transform = `translateY(${this.scrollY}px)`;
        this.crawlEl.classList.add('active');

        let lastTime = performance.now();

        const loop = (now) => {
            if (!this.active) return;
            const dt = Math.min((now - lastTime) / 16.666, 2.5);
            lastTime = now;

            this.scrollY -= this.speed * this.speedMultiplier * dt;
            this.crawlEl.style.transform = `translateY(${Math.round(this.scrollY)}px)`;

            const contentH = this.crawlEl.offsetHeight || 3000;
            // Finish when the tail of the credits clears well past the top (-contentH - 120)
            if (this.scrollY < -(contentH + 160)) {
                this.showOutroSequence();
                return;
            }

            this.scrollAnimId = requestAnimationFrame(loop);
        };

        this.scrollAnimId = requestAnimationFrame(loop);
    }

    showOutroSequence() {
        if (!this.active) return;
        if (this.scrollAnimId) {
            cancelAnimationFrame(this.scrollAnimId);
            this.scrollAnimId = null;
        }

        // 1. Fade the crawl viewport to black over 1.2s
        if (this.crawlViewportEl) {
            this.crawlViewportEl.classList.add('fade-out');
        }

        // 2. Once the screen is purely black, reveal "Thanks for playing!"
        if (this.outroTimeout) clearTimeout(this.outroTimeout);
        this.outroTimeout = setTimeout(() => {
            if (!this.active) return;
            if (this.outroEl) {
                this.outroEl.classList.remove('hidden', 'fade-out');
                this.outroEl.classList.add('fade-in');
            }

            // 3. Hold "Thanks for playing!" for 4.5s
            if (this.outroHoldTimeout) clearTimeout(this.outroHoldTimeout);
            this.outroHoldTimeout = setTimeout(() => {
                if (!this.active) return;
                // 4. Fade out "Thanks for playing!" over 1.8s
                if (this.outroEl) {
                    this.outroEl.classList.add('fade-out');
                }

                setTimeout(() => {
                    if (!this.active) return;
                    if (this.outroEl) this.outroEl.classList.remove('fade-in');
                    // 5. Close credits screen and transition smoothly to menu
                    this.close();
                }, 1800);
            }, 4500);
        }, 1200);
    }

    buildCrawlDOM() {
        if (!this.crawlEl) return;
        // If content is already injected and populated, do not re-render
        if (this.crawlEl.querySelector('.credit-section')) return;

        const data = (typeof window !== 'undefined' && window.CREDITS_DATA) ? window.CREDITS_DATA : [];
        if (!data || data.length === 0) return;

        let html = `
            <img src="assets/Lesa.ioGAMELOGOICON.png" alt="Lesa.io" class="credits-logo">
            <h1 class="credits-main-title">LESA.IO</h1>
            <div class="credits-subtitle">THE GREEK VILLAGE SURVIVOR • STORY COMPLETE</div>
        `;

        for (const section of data) {
            html += `<div class="credit-section">`;
            if (section.dept) {
                html += `<div class="credit-dept">${section.dept}</div>`;
            }
            if (section.quote) {
                html += `<p class="credit-quote">"${section.quote}"</p>`;
            }
            if (section.items) {
                for (const item of section.items) {
                    const hlClass = item.highlight ? ` highlight-${item.highlight}` : '';
                    html += `
                        <div class="credit-item">
                            <div class="credit-role">${item.role}</div>
                            <div class="credit-name${hlClass}">${item.name}</div>
                        </div>
                    `;
                }
            }
            html += `</div>`;
        }

        html += `
            <div class="credits-final-note">
                <h2>THE END</h2>
                <p>Lesa.io • Directed & Created by Psanas • 2026</p>
                <p style="margin-top: 10px; color: #fed330; font-size: 14px; letter-spacing: 1px;">PEACE HAS BEEN RESTORED TO THE VILLAGE... FOR NOW!</p>
            </div>
        `;

        this.crawlEl.innerHTML = html;
    }

    close() {
        if (!this.active) return;
        this.active = false;

        if (this.fadeToBlackTimeout) {
            clearTimeout(this.fadeToBlackTimeout);
            this.fadeToBlackTimeout = null;
        }

        if (this.showIntroTimeout) {
            clearTimeout(this.showIntroTimeout);
            this.showIntroTimeout = null;
        }

        if (this.introTimeout) {
            clearTimeout(this.introTimeout);
            this.introTimeout = null;
        }

        if (this.outroTimeout) {
            clearTimeout(this.outroTimeout);
            this.outroTimeout = null;
        }

        if (this.outroHoldTimeout) {
            clearTimeout(this.outroHoldTimeout);
            this.outroHoldTimeout = null;
        }

        if (this.introEl) {
            this.introEl.classList.remove('fade-in', 'fade-out');
        }

        if (this.outroEl) {
            this.outroEl.classList.remove('fade-in', 'fade-out');
        }

        if (this.scrollAnimId) {
            cancelAnimationFrame(this.scrollAnimId);
            this.scrollAnimId = null;
        }

        // Fade soundtrack smoothly
        if (window.soundEngine && typeof window.soundEngine.stopCreditsBGM === 'function') {
            window.soundEngine.stopCreditsBGM();
        }

        if (this.screenEl) {
            this.screenEl.classList.add('fade-out');
            setTimeout(() => {
                this.screenEl.classList.remove('visible', 'fade-out');
                this.screenEl.classList.add('hidden');
                if (this.crawlViewportEl) {
                    this.crawlViewportEl.classList.remove('fade-out');
                }
                if (this.crawlEl) {
                    this.crawlEl.classList.remove('active');
                    this.crawlEl.style.transform = 'translateY(0px)';
                }
                if (typeof this.onComplete === 'function') {
                    const cb = this.onComplete;
                    this.onComplete = null;
                    cb();
                }
            }, 900);
        } else if (typeof this.onComplete === 'function') {
            const cb = this.onComplete;
            this.onComplete = null;
            cb();
        }
    }
}

if (typeof window !== 'undefined') {
    window.CreditsScreen = CreditsScreen;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CreditsScreen };
}
