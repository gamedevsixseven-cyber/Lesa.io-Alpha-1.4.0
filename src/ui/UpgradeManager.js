/**
 * Lesa.io - Power Upgrades Modal Controller
 * Renders the 4 core upgrade cards, handles coin validation, purchasing, and pip progression.
 */

class UpgradeManager {
    constructor(uiController) {
        this.ui = uiController;
        this.gridEl = document.getElementById('upgrades-grid');
        this.modalEl = document.getElementById('upgrades-modal');

        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.on('currencyChanged', () => this.render());
            window.EventBus.on('upgradesUpdated', () => this.render());
        }

        this.render();
    }

    render() {
        if (!this.gridEl) {
            this.gridEl = document.getElementById('upgrades-grid');
            if (!this.gridEl) return;
        }

        const defs = window.UPGRADE_DEFINITIONS || [];
        const gs = window.GameState;
        const playerCoins = gs && gs.player ? gs.player.coins : (this.ui ? this.ui.coins : 0);

        this.gridEl.innerHTML = '';

        defs.forEach((def) => {
            const currentLvl = gs && typeof gs.getUpgradeLevel === 'function' ? gs.getUpgradeLevel(def.id) : 0;
            const isMax = currentLvl >= def.maxLevel;
            const cost = isMax ? 0 : def.costs[currentLvl];
            const canAfford = !isMax && playerCoins >= cost;

            // Generate 5 Pips HTML
            let pipsHTML = '';
            for (let i = 0; i < def.maxLevel; i++) {
                pipsHTML += `<span class="upgrade-pip ${i < currentLvl ? 'filled' : ''}"></span>`;
            }

            const card = document.createElement('div');
            card.className = 'upgrade-card';

            const currentBonusText = def.formatCurrent(currentLvl);
            const nextBonusText = isMax ? 'Maximum Level Reached' : def.formatNext(currentLvl);

            card.innerHTML = `
                <div class="upgrade-icon-wrap" style="background: ${def.iconBg}; color: #fff;">${def.icon}</div>
                <h3 class="upgrade-title">${def.title}</h3>
                <div class="upgrade-desc" style="font-size: 0.8rem; opacity: 0.85; margin-bottom: 4px;">${def.desc}</div>
                <div class="upgrade-current-stat">
                    <span class="stat-label">Current:</span>
                    <span class="stat-val ${currentLvl > 0 ? 'active' : ''}">${currentBonusText}</span>
                </div>
                <div class="upgrade-pips">
                    ${pipsHTML}
                </div>
                <button class="comic-btn comic-btn-sm upgrade-buy-btn" style="width: 100%; margin-top: 8px;" ${(!canAfford || isMax) ? 'disabled' : ''}>
                    ${isMax ? '⭐ MAX LEVEL (5/5)' : `UPGRADE (🪙 ${cost.toLocaleString()})`}
                </button>
            `;

            const buyBtn = card.querySelector('.upgrade-buy-btn');
            if (buyBtn && !isMax) {
                buyBtn.addEventListener('click', () => this.buyUpgrade(def.id));
            }

            this.gridEl.appendChild(card);
        });
    }

    buyUpgrade(upgradeId) {
        const gs = window.GameState;
        if (!gs) return;

        const defs = window.UPGRADE_DEFINITIONS || [];
        const def = defs.find(d => d.id === upgradeId);
        if (!def) return;

        const currentLvl = gs.getUpgradeLevel(upgradeId);
        if (currentLvl >= def.maxLevel) return;

        const cost = def.costs[currentLvl];
        const currentCoins = gs.player.coins;

        if (currentCoins < cost) {
            if (window.soundEngine) window.soundEngine.playGoBack();
            return;
        }

        // Deduct Coins
        if (this.ui && typeof this.ui.setCoins === 'function') {
            this.ui.setCoins(currentCoins - cost, true);
        } else {
            gs.addCurrency(-cost, 0);
        }

        // Increment Upgrade Level
        gs.setUpgradeLevel(upgradeId, currentLvl + 1);

        // Audio Feedback
        if (window.soundEngine) {
            window.soundEngine.playSelect();
        }

        // Re-render modal cards
        this.render();
    }
}

if (typeof window !== 'undefined') {
    window.UpgradeManager = UpgradeManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UpgradeManager };
}
