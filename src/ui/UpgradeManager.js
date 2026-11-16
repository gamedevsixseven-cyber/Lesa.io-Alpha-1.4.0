/**
 * Lesa.io - Power Upgrades Modal Controller
 * Renders the 4 core upgrade cards, handles coin validation, purchasing, and pip progression.
 */

class UpgradeManager {
    constructor(uiController) {
        this.ui = uiController;
        this.gridEl = document.getElementById('upgrades-grid');
        this.modalEl = document.getElementById('upgrades-modal');
        this.summaryBar = document.getElementById('upgrades-summary-bar');

        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.on('currencyChanged', () => this.render());
            window.EventBus.on('currencyUpdated', () => this.render());
            window.EventBus.on('upgradesUpdated', () => this.render());
        }

        this.render();
    }

    render() {
        if (!this.gridEl) {
            this.gridEl = document.getElementById('upgrades-grid');
            if (!this.gridEl) return;
        }
        if (!this.summaryBar) {
            this.summaryBar = document.getElementById('upgrades-summary-bar');
        }

        const defs = window.UPGRADE_DEFINITIONS || [];
        const gs = window.GameState;
        const playerCoins = gs && gs.player ? gs.player.coins : (this.ui ? this.ui.coins : 0);

        let totalLvl = 0;
        let maxTotalLvl = 0;
        let maxedCount = 0;

        this.gridEl.innerHTML = '';

        defs.forEach((def) => {
            const currentLvl = gs && typeof gs.getUpgradeLevel === 'function' ? gs.getUpgradeLevel(def.id) : 0;
            const isMax = currentLvl >= def.maxLevel;
            const cost = isMax ? 0 : def.costs[currentLvl];
            const canAfford = !isMax && playerCoins >= cost;

            totalLvl += currentLvl;
            maxTotalLvl += def.maxLevel;
            if (isMax) maxedCount++;

            // Generate 5 Pips HTML
            let pipsHTML = '';
            for (let i = 0; i < def.maxLevel; i++) {
                pipsHTML += `<span class="upgrade-pip ${i < currentLvl ? 'filled' : ''}"></span>`;
            }

            const card = document.createElement('div');
            card.className = `upgrade-card ${isMax ? 'is-maxed' : ''}`;

            const currentBonusText = def.formatCurrent(currentLvl);
            const nextBonusText = isMax ? 'Maximum Level Reached' : def.formatNext(currentLvl);

            card.innerHTML = `
                <span class="upgrade-lvl-badge">${isMax ? `MAX ${typeof UiIcons !== 'undefined' ? UiIcons.i('star', 'ui-icon-sm') : '⭐'}` : `LVL ${currentLvl}/${def.maxLevel}`}</span>
                <div class="upgrade-icon-wrap" style="background: ${def.iconBg}; color: #fff;">${typeof UiIcons !== 'undefined' ? UiIcons.renderDefIcon(def, 'ui-icon-box') : def.icon}</div>
                <h3 class="upgrade-title">${def.title}</h3>
                <div class="upgrade-desc">${def.desc}</div>
                <div class="upgrade-current-stat">
                    <div class="upgrade-stat-line">
                        <span class="stat-label">Current:</span>
                        <span class="stat-val ${currentLvl > 0 ? 'active' : ''}">${currentBonusText}</span>
                    </div>
                    ${isMax ? '' : `<div class="upgrade-next-val">Next: ${nextBonusText}</div>`}
                </div>
                <div class="upgrade-pips">
                    ${pipsHTML}
                </div>
                <button class="comic-btn comic-btn-sm upgrade-buy-btn ${isMax ? 'comic-btn-primary' : (canAfford ? 'is-can-afford-unlock' : 'is-insufficient')}" style="width: 100%; margin-top: auto;" ${isMax ? 'disabled' : ''}>
                    ${isMax ? `${typeof UiIcons !== 'undefined' ? UiIcons.i('star') : '⭐'} MAX LEVEL (5/5)` : `UPGRADE (${typeof UiIcons !== 'undefined' ? UiIcons.i('coin') : '🪙'} ${cost.toLocaleString()})`}
                </button>
            `;

            const buyBtn = card.querySelector('.upgrade-buy-btn');
            if (buyBtn && !isMax) {
                buyBtn.addEventListener('click', () => this.buyUpgrade(def.id, card));
            }

            this.gridEl.appendChild(card);
        });

        if (this.summaryBar && typeof ModalManager !== 'undefined' && ModalManager.renderTabSummaryBar) {
            ModalManager.renderTabSummaryBar(this.summaryBar, [
                { icon: '🪙', label: 'COINS', val: playerCoins.toLocaleString(), cls: 'tab-pill-gold' },
                { icon: '⚡', label: 'TOTAL POWER', val: `${totalLvl} / ${maxTotalLvl || 20}`, cls: 'tab-pill-green' },
                { icon: '⭐', label: 'MAXED', val: `${maxedCount} / ${defs.length || 4}` }
            ]);
        }
    }

    buyUpgrade(upgradeId, cardEl = null) {
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
            const needed = cost - currentCoins;
            const msg = `⚠️ Need 🪙 ${needed.toLocaleString()} more Coins for ${def.title}!`;
            if (typeof ModalManager !== 'undefined' && ModalManager.notifyInsufficient) {
                ModalManager.notifyInsufficient(msg, cardEl);
            } else if (window.soundEngine) {
                window.soundEngine.playGoBack();
            }
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
