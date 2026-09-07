/**
 * Lesa.io - Currency & Balance Presentation Manager
 * Synchronizes Coins & Gems with GameState, animates number rolls, and updates top-bar HUD
 */

class CurrencyManager {
    constructor(gameState = null) {
        this.gameState = gameState || (typeof window !== 'undefined' ? window.GameState : null);

        // Top Bar Currency Elements
        this.menuCoinText = document.getElementById('menu-coin-text');
        this.menuGemText = document.getElementById('menu-gem-text');
        this.coinPill = document.querySelector('.coin-pill');
        this.gemPill = document.querySelector('.gem-pill');

        this.initEventListeners();
        this.updateUI(false);
    }

    initEventListeners() {
        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.on('currencyChanged', (data) => {
                this.handleCurrencyChanged(data);
            });
        }
    }

    handleCurrencyChanged(data) {
        if (data.coinsDelta !== 0 && this.menuCoinText) {
            this.animateNumber(this.menuCoinText, data.oldCoins, data.coins, 900, this.coinPill);
        } else if (this.menuCoinText) {
            this.menuCoinText.textContent = data.coins.toLocaleString();
        }

        if (data.gemsDelta !== 0 && this.menuGemText) {
            this.animateNumber(this.menuGemText, data.oldGems, data.gems, 900, this.gemPill);
        } else if (this.menuGemText) {
            this.menuGemText.textContent = data.gems.toLocaleString();
        }
    }

    /**
     * Animate a DOM counter smoothly from startVal to endVal
     */
    animateNumber(element, startVal, endVal, duration = 800, pill = null) {
        if (!element) return;
        if (element._animId) {
            cancelAnimationFrame(element._animId);
            element._animId = null;
        }

        if (startVal === endVal) {
            element.textContent = endVal.toLocaleString();
            return;
        }

        if (pill) {
            pill.style.animation = 'none';
            void pill.offsetWidth; // Trigger reflow
            pill.style.animation = 'pillCountPulse 0.4s ease-in-out';
        }

        const startTime = performance.now();

        const step = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(startVal + (endVal - startVal) * easeOut);

            element.textContent = current.toLocaleString();

            if (progress < 1) {
                element._animId = requestAnimationFrame(step);
            } else {
                element._animId = null;
                element.textContent = endVal.toLocaleString();
                if (pill) {
                    pill.style.animation = 'none';
                    void pill.offsetWidth;
                    pill.style.animation = 'pillDonePop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                }
            }
        };

        element._animId = requestAnimationFrame(step);
    }

    /**
     * Refresh currency UI display immediately
     */
    updateUI(animate = false) {
        if (!this.gameState) return;

        const coins = this.gameState.player.coins;
        const gems = this.gameState.player.gems;

        if (this.menuCoinText) {
            if (animate) {
                const current = parseInt(this.menuCoinText.textContent.replace(/,/g, '') || '0', 10);
                this.animateNumber(this.menuCoinText, current, coins, 800, this.coinPill);
            } else {
                this.menuCoinText.textContent = coins.toLocaleString();
            }
        }

        if (this.menuGemText) {
            if (animate) {
                const current = parseInt(this.menuGemText.textContent.replace(/,/g, '') || '0', 10);
                this.animateNumber(this.menuGemText, current, gems, 800, this.gemPill);
            } else {
                this.menuGemText.textContent = gems.toLocaleString();
            }
        }
    }

    addCoins(amount = 0) {
        if (this.gameState && typeof this.gameState.addCurrency === 'function') {
            this.gameState.addCurrency(amount, 0);
        }
    }

    addGems(amount = 0) {
        if (this.gameState && typeof this.gameState.addCurrency === 'function') {
            this.gameState.addCurrency(0, amount);
        }
    }
}

if (typeof window !== 'undefined') {
    window.CurrencyManager = CurrencyManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CurrencyManager };
}
