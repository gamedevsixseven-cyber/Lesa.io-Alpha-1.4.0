/**
 * Lesa.io - Daily Challenges System
 * Tracks 5 Daily Challenges with daily midnight refresh, live countdown, and claimable rewards
 */

class QuestManager {
    constructor(uiController) {
        this.ui = uiController;
        this.quests = [];
        this.timerInterval = null;
        this._syncTimer = null;

        this.initQuests();
        this.startTimer();
        this.initEventListeners();
    }

    initEventListeners() {
        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.on('enemyKilled', (data) => {
                this.recordProgress('defeat_enemies', 1);
                if (data && data.enemyType === 'fatmir') {
                    this.recordProgress('bonk_fatmir', 1);
                } else if (data && data.enemyType === 'casillas') {
                    this.recordProgress('outplay_casillas', 1);
                }
            });

            window.EventBus.on('waveCompleted', (data) => {
                if (data && data.wave) {
                    this.recordProgress('reach_wave', data.wave, true);
                }
            });

            window.EventBus.on('dropCollected', (data) => {
                if (data && data.type === 'xp') {
                    this.recordProgress('collect_xp', 1);
                }
            });
        }
    }

    getTodayKey() {
        const d = new Date();
        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    }

    getTimeUntilMidnight() {
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const diff = tomorrow.getTime() - now.getTime();

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const pad = (n) => (n < 10 ? '0' + n : n);
        return {
            formatted: `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`,
            hours,
            minutes,
            seconds,
            diff
        };
    }

    initQuests() {
        const savedDate = localStorage.getItem('lesaio_quests_date');
        const todayKey = this.getTodayKey();

        if (savedDate === todayKey) {
            try {
                const raw = localStorage.getItem('lesaio_quests_data');
                if (raw) {
                    this.quests = JSON.parse(raw);
                }
            } catch (e) {
                console.warn('Failed to parse cached quests, resetting.');
            }
        }

        if (!this.quests || this.quests.length === 0) {
            const defaults = typeof DEFAULT_QUESTS !== 'undefined' ? DEFAULT_QUESTS : [];
            this.quests = JSON.parse(JSON.stringify(defaults));
            localStorage.setItem('lesaio_quests_date', todayKey);
            this.saveQuests();
        } else if (typeof DEFAULT_QUESTS !== 'undefined') {
            // Keep existing player progress but synchronize rewards with updated reward definitions
            this.quests.forEach(q => {
                const tpl = DEFAULT_QUESTS.find(d => d.id === q.id);
                if (tpl) {
                    q.rewardCoins = tpl.rewardCoins;
                    q.rewardGems = tpl.rewardGems;
                    q.rewardMaterials = tpl.rewardMaterials ? { ...tpl.rewardMaterials } : null;
                    if (tpl.iconImg) q.iconImg = tpl.iconImg;
                }
            });
            this.saveQuests();
        }

        this.renderSideCardQuests();
        this.renderModalQuests();
        this.updateBadge();
    }

    saveQuests() {
        localStorage.setItem('lesaio_quests_data', JSON.stringify(this.quests));
    }

    resetDailyChallenges() {
        const defaults = typeof DEFAULT_QUESTS !== 'undefined' ? DEFAULT_QUESTS : [];
        this.quests = JSON.parse(JSON.stringify(defaults));
        localStorage.setItem('lesaio_quests_date', this.getTodayKey());
        this.saveQuests();
        this.renderSideCardQuests();
        this.renderModalQuests();
        this.updateBadge();
        console.log("✅ [QuestManager] Daily challenges reset to defaults!");
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);

        const updateTick = () => {
            const time = this.getTimeUntilMidnight();
            const cardTimer = document.getElementById('menu-quests-timer');
            const modalTimer = document.getElementById('modal-quests-timer');

            if (cardTimer) {
                const timerTextEl = cardTimer.querySelector('#menu-quests-timer-val');
                if (timerTextEl) {
                    timerTextEl.textContent = time.formatted;
                } else {
                    const timerIco = typeof UiIcons !== 'undefined' ? UiIcons.i('timer', 'ui-icon-sm') : '⏱';
                    cardTimer.innerHTML = `${timerIco} <span id="menu-quests-timer-val">${time.formatted}</span>`;
                }
            }
            if (modalTimer) modalTimer.textContent = time.formatted;

            if (time.diff <= 1000) {
                this.initQuests();
            }
        };

        updateTick();
        this.timerInterval = setInterval(updateTick, 1000);
    }

    addProgress(questId, amount = 1, isAbsolute = false) {
        this.recordProgress(questId, amount, isAbsolute);
    }

    recordProgress(questId, amount = 1, isAbsolute = false) {
        let changed = false;
        for (const q of this.quests) {
            if (q.id === questId && !q.claimed) {
                const oldProg = q.progress;
                if (isAbsolute) {
                    q.progress = Math.max(q.progress, amount);
                } else {
                    q.progress = Math.min(q.target, q.progress + amount);
                }
                if (q.progress !== oldProg) {
                    changed = true;
                }
            }
        }

        if (changed) {
            this.scheduleProgressSync();
        }
    }

    scheduleProgressSync() {
        if (this._syncTimer) return;
        this._syncTimer = setTimeout(() => {
            this._syncTimer = null;
            this.flushProgressSync();
        }, 250);
    }

    flushProgressSync() {
        this.saveQuests();
        const menuEl = typeof document !== 'undefined' ? document.getElementById('main-menu') : null;
        const modalEl = typeof document !== 'undefined' ? document.getElementById('daily-quests-modal') : null;
        if (!menuEl || !menuEl.classList.contains('hidden')) {
            this.renderSideCardQuests();
            this.updateBadge();
        }
        if (modalEl && !modalEl.classList.contains('hidden')) {
            this.renderModalQuests();
        }
    }

    claimReward(questId) {
        const quest = this.quests.find((q) => q.id === questId);
        if (!quest || quest.claimed || quest.progress < quest.target) return;

        quest.claimed = true;
        this.saveQuests();

        if (window.soundEngine) {
            window.soundEngine.playLevelUp();
        }

        // Add Coins, Gems & Crafting Materials
        if (window.GameState) {
            window.GameState.addCurrency(quest.rewardCoins, quest.rewardGems);
        } else if (this.ui) {
            this.ui.setCoins(this.ui.coins + quest.rewardCoins);
            this.ui.setGems(this.ui.gems + quest.rewardGems);
        }

        if (quest.rewardMaterials && typeof window !== 'undefined' && window.inventoryManager && typeof window.inventoryManager.addMaterials === 'function') {
            window.inventoryManager.addMaterials(quest.rewardMaterials, { source: 'quest', questId: quest.id });
        }

        if (this.ui && this.ui.currencyManager) {
            this.ui.currencyManager.updateUI(true);
        }

        this.showClaimNotification(quest);
        this.renderSideCardQuests();
        this.renderModalQuests();
        this.updateBadge();
    }

    showClaimNotification(quest) {
        const modal = document.getElementById('daily-quests-modal');
        if (!modal) return;

        let toast = document.getElementById('quest-claim-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'quest-claim-toast';
            toast.className = 'quest-claim-toast';
            const panel = modal.querySelector('.modal-panel');
            if (panel) panel.prepend(toast);
        }

        const icoCelebrate = typeof UiIcons !== 'undefined' ? UiIcons.i('celebrate') : '🎉';
        const icoCoin = typeof UiIcons !== 'undefined' ? UiIcons.i('coin', 'ui-icon-sm') : '🪙';
        const icoGem = typeof UiIcons !== 'undefined' ? UiIcons.i('gem', 'ui-icon-sm') : '💎';
        const matToastHtml = this._formatMaterialBadges(quest.rewardMaterials);
        toast.innerHTML = `${icoCelebrate} <strong>${quest.title}</strong> Claimed! &nbsp; <span style="color:#fed330;">+${quest.rewardCoins} ${icoCoin}</span> &nbsp; <span style="color:#00d2d3;">+${quest.rewardGems} ${icoGem}</span>${matToastHtml ? ` &nbsp; ${matToastHtml}` : ''}`;
        toast.style.display = 'block';

        clearTimeout(this._toastTimeout);
        this._toastTimeout = setTimeout(() => {
            if (toast) toast.style.display = 'none';
        }, 3500);
    }

    renderSideCardQuests() {
        const container = document.getElementById('menu-quest-list');
        if (!container) return;

        container.innerHTML = '';
        const previewQuests = this.quests.slice(0, 2);

        previewQuests.forEach((q) => {
            const pct = Math.min(100, Math.round((q.progress / q.target) * 100));
            const item = document.createElement('div');
            item.className = 'quest-item';
            const qIconHtml = typeof UiIcons !== 'undefined' ? UiIcons.renderDefIcon(q, 'ui-icon-sm') : q.icon;
            const qCoinHtml = typeof UiIcons !== 'undefined' ? UiIcons.i('coin', 'ui-icon-sm') : '🪙';
            item.innerHTML = `
                <div class="quest-info-row">
                    <span>${qIconHtml} ${q.title}</span>
                    <span>${q.progress}/${q.target}</span>
                </div>
                <div class="quest-bar-row">
                    <div class="quest-bar">
                        <div class="quest-fill" style="width: ${pct}%"></div>
                    </div>
                    <span class="quest-reward">+${q.rewardCoins} ${qCoinHtml}</span>
                </div>
            `;
            container.appendChild(item);
        });
    }

    renderModalQuests() {
        const container = document.getElementById('modal-quests-list');
        if (!container) return;

        container.innerHTML = '';

        this.quests.forEach((q) => {
            const isReady = q.progress >= q.target && !q.claimed;
            const isClaimed = q.claimed;
            const pct = Math.min(100, Math.round((q.progress / q.target) * 100));

            const card = document.createElement('div');
            card.className = `challenge-card ${isReady ? 'challenge-ready' : ''} ${isClaimed ? 'challenge-claimed' : ''}`;

            let buttonHtml = '';
            if (isClaimed) {
                buttonHtml = `<button class="comic-btn quest-btn-claimed" disabled>CLAIMED ✓</button>`;
            } else if (isReady) {
                buttonHtml = `<button class="comic-btn comic-btn-primary quest-btn-claim" data-quest="${q.id}">CLAIM REWARD</button>`;
            } else {
                buttonHtml = `<button class="comic-btn quest-btn-progress" disabled>${q.progress} / ${q.target}</button>`;
            }

            const qIconCol = typeof UiIcons !== 'undefined' ? UiIcons.renderDefIcon(q, 'ui-icon-box') : q.icon;
            const qCoin = typeof UiIcons !== 'undefined' ? UiIcons.i('coin', 'ui-icon-sm') : '🪙';
            const qGem = typeof UiIcons !== 'undefined' ? UiIcons.i('gem', 'ui-icon-sm') : '💎';
            const qMatHtml = this._formatMaterialBadges(q.rewardMaterials);
            card.innerHTML = `
                <div class="challenge-icon-col">${qIconCol}</div>
                <div class="challenge-info-col">
                    <div class="challenge-title-row">
                        <span class="challenge-title">${q.title}</span>
                        <span class="challenge-progress-num">${pct}%</span>
                    </div>
                    <p class="challenge-desc">${q.desc}</p>
                    <div class="challenge-bar-container">
                        <div class="challenge-bar-fill" style="width: ${pct}%"></div>
                    </div>
                </div>
                <div class="challenge-reward-col">
                    <div class="challenge-rewards-badge">
                        <span>+${q.rewardCoins} ${qCoin}</span>
                        <span>+${q.rewardGems} ${qGem}</span>
                        ${qMatHtml}
                    </div>
                    ${buttonHtml}
                </div>
            `;

            container.appendChild(card);
        });

        container.querySelectorAll('.quest-btn-claim').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-quest');
                this.claimReward(id);
            });
        });
    }

    _formatMaterialBadges(matMap) {
        if (!matMap || typeof matMap !== 'object') return '';
        return Object.entries(matMap).map(([matId, qty]) => {
            if (!qty || qty <= 0) return '';
            const def = (typeof MaterialRegistry !== 'undefined') ? MaterialRegistry.get(matId) : null;
            const iconHtml = (def && typeof UiIcons !== 'undefined')
                ? UiIcons.i(def.iconKey, 'ui-icon-sm', def.name)
                : (def ? def.icon : '⚙️');
            const col = def ? def.color : '#38bdf8';
            return `<span style="color:${col};" title="${def ? def.name : matId}">+${qty} ${iconHtml}</span>`;
        }).join('');
    }

    updateBadge() {
        const badge = document.getElementById('quests-claim-badge');
        if (!badge) return;

        const claimableCount = this.quests.filter((q) => q.progress >= q.target && !q.claimed).length;

        if (claimableCount > 0) {
            badge.textContent = claimableCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

if (typeof window !== 'undefined') {
    window.QuestManager = QuestManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QuestManager };
}
