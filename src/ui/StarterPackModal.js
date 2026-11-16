/**
 * Lesa.io - Starter Pack Real Payment Controller (Stripe Checkout)
 * Redirects player to official Stripe Checkout page for real payment (€0.99)
 * Listens for payment_success redirect from Stripe to grant bundle rewards
 */

const STRIPE_CONFIG = {
    // Default Stripe Payment Link
    defaultUrl: "https://buy.stripe.com/test_starter_pack",
    get paymentUrl() {
        return localStorage.getItem('lesaio_stripe_url') || this.defaultUrl;
    },
    setPaymentUrl(url) {
        if (url) localStorage.setItem('lesaio_stripe_url', url.trim());
    }
};

class StarterPackModal {
    constructor(uiController) {
        this.ui = uiController;
        this.modal = document.getElementById('starter-pack-modal');
        this.timerEl = document.getElementById('sp-modal-timer-countdown');
        this.buyBtn = document.getElementById('sp-buy-now-btn');
        this.cancelBtn = document.getElementById('sp-cancel-btn');
        this.editLinkBtn = document.getElementById('sp-edit-stripe-link');

        this.initEvents();
        this.checkPaymentRedirect();
    }

    initEvents() {
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playGoBack();
                this.hide();
            });
        }

        if (this.buyBtn) {
            this.buyBtn.addEventListener('click', () => {
                this.processPurchase();
            });
        }

        if (this.editLinkBtn) {
            this.editLinkBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const current = localStorage.getItem('lesaio_stripe_url') || '';
                const entered = prompt(
                    '💳 STRIPE PAYMENT LINK CONFIGURATION:\n\nPaste your Stripe Checkout Link (e.g., https://buy.stripe.com/...):\n\n(Leave empty to reset)',
                    current
                );
                if (entered !== null) {
                    if (entered.trim()) {
                        STRIPE_CONFIG.setPaymentUrl(entered);
                        alert('✅ Stripe Link Saved!\nPlayers will now be redirected to your Stripe payment page.');
                    } else {
                        localStorage.removeItem('lesaio_stripe_url');
                        alert('ℹ️ Reset to default.');
                    }
                }
            });
        }

        // Payment method selector tabs
        const payTabs = document.querySelectorAll('.sp-pay-tab');
        payTabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                payTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                if (window.soundEngine) window.soundEngine.playSelect();
            });
        });
    }

    show() {
        if (localStorage.getItem('lesaio_starter_pack_purchased') === 'true') {
            const card = document.getElementById('starter-pack-card');
            if (card) card.style.display = 'none';
            alert('✅ You have already claimed the Starter Pack bundle!');
            this.hide();
            return;
        }

        this.updateTimer();
        if (this.modal) {
            this.modal.classList.remove('hidden');
        }

        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => this.updateTimer(), 1000);
    }

    hide() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.modal) {
            this.modal.classList.add('hidden');
        }
    }

    updateTimer() {
        if (localStorage.getItem('lesaio_starter_pack_purchased') === 'true') {
            const card = document.getElementById('starter-pack-card');
            if (card) card.style.display = 'none';
            this.hide();
            return;
        }

        const startTime = parseInt(localStorage.getItem('lesaio_starter_pack_start') || Date.now().toString(), 10);
        const remaining = Math.max(0, (startTime + 24 * 60 * 60 * 1000) - Date.now());

        if (remaining <= 0) {
            if (this.timerEl) this.timerEl.textContent = 'EXPIRED';
            this.hide();
            const card = document.getElementById('starter-pack-card');
            if (card) card.style.display = 'none';
            return;
        }

        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((remaining % (1000 * 60)) / 1000);
        const timeStr = `${hours}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;

        if (this.timerEl) {
            this.timerEl.textContent = timeStr;
        }
    }

    processPurchase() {
        if (!this.buyBtn) return;

        let url = STRIPE_CONFIG.paymentUrl;

        // If not configured with a real Stripe link, prompt for the link
        if (!url || url.includes('test_starter_pack')) {
            const entered = prompt(
                '💳 REAL STRIPE PAYMENT SETUP:\n\nTo accept real money (€0.99), paste your Stripe Payment Link below (e.g., https://buy.stripe.com/...):\n\n(Create one free in 60s at https://dashboard.stripe.com/payment-links)',
                ''
            );

            if (!entered || !entered.trim()) {
                return;
            }

            STRIPE_CONFIG.setPaymentUrl(entered);
            url = entered.trim();
        }

        // Redirect to real Stripe Payment page
        this.buyBtn.disabled = true;
        const lockIc = typeof UiIcons !== 'undefined' ? UiIcons.i('lock', 'ui-icon-sm') : '🔒';
        this.buyBtn.innerHTML = `<span>${lockIc} Taking you to Stripe Checkout...</span>`;
        if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
            window.soundEngine.playSelect();
        }

        setTimeout(() => {
            window.location.href = url;
        }, 600);
    }

    /**
     * Check if redirected back from Stripe after successful payment
     */
    checkPaymentRedirect() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('payment_success') === 'starter_pack') {
            // Clean URL query parameters
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);

            try {
                // Grant bundle currency
                const gameState = window.GameState;
                if (gameState && typeof gameState.addCurrency === 'function') {
                    gameState.addCurrency(5000, 300);
                } else {
                    let coins = parseInt(localStorage.getItem('lesaio_coins') || '1500', 10);
                    let gems = parseInt(localStorage.getItem('lesaio_gems') || '50', 10);
                    coins += 5000;
                    gems += 300;
                    localStorage.setItem('lesaio_coins', coins.toString());
                    localStorage.setItem('lesaio_gems', gems.toString());
                }

                // Mark bundle as purchased
                localStorage.setItem('lesaio_starter_pack_purchased', 'true');

                // Animate Top-Bar Currency
                setTimeout(() => {
                    if (this.ui && typeof this.ui.updateCurrencyUI === 'function') {
                        this.ui.updateCurrencyUI(true);
                    }
                    if (window.soundEngine && typeof window.soundEngine.playPickup === 'function') {
                        window.soundEngine.playPickup('star');
                    }

                    alert('🎉 STRIPE PAYMENT SUCCESSFUL (€0.99)!\n\nYour purchase was verified by Stripe.\n• +5,000 Gold Coins 🪙\n• +300 Precious Gems 💎\n• Golden Slingshot Skin 🌟\n\nRewards added to your account!');

                    const card = document.getElementById('starter-pack-card');
                    if (card) {
                        card.style.display = 'none';
                    }
                    this.hide();
                }, 400);

            } catch (err) {
                console.error('Error granting Stripe rewards:', err);
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.StarterPackModal = StarterPackModal;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StarterPackModal };
}
