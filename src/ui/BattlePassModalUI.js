/**
 * Lesa.io - Season 1 Battle Pass Dual-Track Modal UI
 * Displays Free Version rewards alongside Paid Pass rewards across 20 tiers,
 * with one-time Gem Premium Pass purchase, +1 Tier skip, and Claim All.
 */

class BattlePassModalUI {
    constructor(manager) {
        this.manager = manager;
        this.modal = document.getElementById('battle-pass-modal');
        this.trackEl = document.getElementById('bp-track-list');
        this.tierBadgeEl = document.getElementById('bp-modal-tier');
        this.xpLabelEl = document.getElementById('bp-modal-xp-label');
        this.xpFillEl = document.getElementById('bp-modal-xp-fill');
        this.statusPillEl = document.getElementById('bp-pass-status-pill');
        this.buyPassBtn = document.getElementById('bp-buy-pass-btn');
        this.claimAllBtn = document.getElementById('bp-claim-all-btn');
        this.skipBtn = document.getElementById('bp-skip-tier-btn');
        this.filter = 'ALL';

        this.bindEvents();
    }

    bindEvents() {
        const closeBtn = document.getElementById('close-bp-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playGoBack();
                this.hide();
            });
        }
        if (this.buyPassBtn) {
            this.buyPassBtn.addEventListener('click', () => {
                if (!this.manager) return;
                const res = this.manager.buyPremiumPassWithGems();
                if (!res.success) {
                    if (typeof ModalManager !== 'undefined') ModalManager.notifyInsufficient(res.reason, this.buyPassBtn);
                } else {
                    this.render();
                }
            });
        }
        if (this.claimAllBtn) {
            this.claimAllBtn.addEventListener('click', () => {
                if (!this.manager) return;
                this.manager.claimAllAvailable();
                this.render();
            });
        }
        if (this.skipBtn) {
            this.skipBtn.addEventListener('click', () => {
                if (!this.manager) return;
                const res = this.manager.buyNextTierWithGems();
                if (!res.success) {
                    if (typeof ModalManager !== 'undefined') ModalManager.notifyInsufficient(res.reason, this.skipBtn);
                } else {
                    if (window.soundEngine) window.soundEngine.playLevelUp();
                    if (window.modalManager) window.modalManager.showQuickToast(`⚡ Unlocked Battle Pass Tier ${res.newTier}!`, 1800);
                    this.render();
                }
            });
        }
        document.querySelectorAll('#bp-filter-bar .tab-filter-chip').forEach((chip) => {
            chip.addEventListener('click', () => {
                this.filter = chip.getAttribute('data-bp-filter') || 'ALL';
                document.querySelectorAll('#bp-filter-bar .tab-filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                if (window.soundEngine) window.soundEngine.playSelect();
                this.render();
            });
        });

        if (typeof window !== 'undefined' && window.EventBus) {
            const syncOpen = () => {
                if (this.modal && !this.modal.classList.contains('hidden')) this.render();
            };
            window.EventBus.on('battlePassUpdated', syncOpen);
            window.EventBus.on('currencyChanged', syncOpen);
        }
    }

    show() {
        if (!this.modal) this.modal = document.getElementById('battle-pass-modal');
        if (!this.modal) return;
        this.render();
        this.modal.classList.remove('hidden');
    }

    hide() {
        if (this.modal) this.modal.classList.add('hidden');
    }

    _renderSlot(entry, reward, track, currentTier) {
        const isPaid = track === 'paid';
        const claimedArr = isPaid ? this.manager.claimedPremium : this.manager.claimedFree;
        const isClaimed = claimedArr.includes(entry.tier);
        const tierReached = entry.tier <= currentTier;
        const unlockedTrack = !isPaid || this.manager.hasPremium;
        const isReady = !isClaimed && tierReached && unlockedTrack;

        let slotState = '';
        if (isClaimed) slotState = 'bp-claimed';
        else if (isReady) slotState = 'bp-ready';
        else if (isPaid && !this.manager.hasPremium) slotState = 'bp-paid-locked';

        const rarCls = `bp-r-${reward.rarity || 'common'}`;
        const kindTag = reward.type === 'skin' ? 'SKIN' : (reward.type === 'weapon' ? reward.rarity : reward.type);
        const trackBadge = isPaid ? '<span class="bp-track-tag paid">👑 PAID</span>' : '<span class="bp-track-tag free">FREE</span>';

        let btnHtml;
        if (isClaimed) {
            btnHtml = `<button class="comic-btn bp-claim-btn" disabled>CLAIMED ✓</button>`;
        } else if (isReady) {
            btnHtml = `<button class="comic-btn ${isPaid ? 'bp-claim-vip-btn' : 'comic-btn-primary'} bp-claim-btn" data-bp-claim="${entry.tier}" data-bp-track="${track}">CLAIM!</button>`;
        } else if (isPaid && !this.manager.hasPremium) {
            btnHtml = `<button class="comic-btn bp-claim-btn bp-need-pass-btn" data-bp-need-pass="1">🔒 BUY PASS</button>`;
        } else {
            const xpNeeded = Math.max(0, (entry.tier - 1) * BattlePassManager.XP_PER_TIER - this.manager.xp);
            btnHtml = `<button class="comic-btn bp-claim-btn" disabled>🔒 ${xpNeeded} XP</button>`;
        }

        return `
            <div class="bp-slot ${isPaid ? 'bp-slot-paid' : 'bp-slot-free'} ${slotState}">
                <div class="bp-slot-top">
                    ${trackBadge}
                    <span class="bp-rarity-tag ${rarCls}">${kindTag}</span>
                </div>
                <div class="bp-icon-box"><img src="${reward.icon}" alt="${reward.label}"></div>
                <div class="bp-reward-name">${reward.label}</div>
                <div class="bp-reward-sub">${reward.sub}</div>
                ${btnHtml}
            </div>
        `;
    }

    render() {
        if (!this.manager) return;
        const prog = this.manager.getTierProgress();
        const ready = this.manager.getClaimableRewards();
        const hasPremium = this.manager.hasPremium;

        if (this.tierBadgeEl) this.tierBadgeEl.textContent = `TIER ${prog.tier} / ${BattlePassManager.MAX_TIER}`;
        if (this.xpFillEl) this.xpFillEl.style.width = `${prog.pct}%`;
        if (this.xpLabelEl) {
            this.xpLabelEl.textContent = prog.tier >= BattlePassManager.MAX_TIER
                ? `SEASON MAXED (${this.manager.xp.toLocaleString()} XP)`
                : `${prog.intoTier} / ${prog.needed} XP to Tier ${prog.tier + 1}`;
        }
        if (this.statusPillEl) {
            this.statusPillEl.textContent = hasPremium ? '👑 FULL PASS ACTIVE' : 'FREE VERSION';
            this.statusPillEl.className = `bp-status-pill ${hasPremium ? 'paid' : 'free'}`;
        }
        if (this.buyPassBtn) {
            this.buyPassBtn.disabled = hasPremium;
            this.buyPassBtn.textContent = hasPremium
                ? '👑 PASS OWNED ✓'
                : `👑 BUY PASS (💎 ${BattlePassManager.PASS_GEM_COST})`;
        }
        if (this.claimAllBtn) {
            this.claimAllBtn.disabled = ready.total === 0;
            this.claimAllBtn.textContent = ready.total > 0 ? `CLAIM ALL (${ready.total})` : 'NOTHING READY';
        }
        if (this.skipBtn) {
            this.skipBtn.disabled = prog.tier >= BattlePassManager.MAX_TIER;
            this.skipBtn.textContent = prog.tier >= BattlePassManager.MAX_TIER
                ? 'MAX TIER'
                : `+1 TIER (💎 ${BattlePassManager.SKIP_TIER_GEM_COST})`;
        }

        if (!this.trackEl) this.trackEl = document.getElementById('bp-track-list');
        if (!this.trackEl) return;

        const filtered = BattlePassManager.TIERS.filter((entry) => {
            if (this.filter === 'READY') {
                return entry.tier <= prog.tier && (
                    !this.manager.claimedFree.includes(entry.tier) ||
                    (hasPremium && !this.manager.claimedPremium.includes(entry.tier))
                );
            }
            if (this.filter === 'FREE') return true;
            if (this.filter === 'LOOT') {
                const fLoot = entry.free.type === 'skin' || entry.free.type === 'weapon';
                const pLoot = entry.paid.type === 'skin' || entry.paid.type === 'weapon';
                return fLoot || pLoot;
            }
            return true;
        });

        if (filtered.length === 0) {
            this.trackEl.innerHTML = `<div class="tab-empty-filter-state" style="grid-column: 1 / -1;">No tiers match this filter — play waves or complete Daily Quests to earn BP XP!</div>`;
            return;
        }

        this.trackEl.innerHTML = filtered.map((entry) => {
            const reached = entry.tier <= prog.tier;
            return `
                <div class="bp-tier-column ${reached ? 'bp-tier-reached' : ''}">
                    <div class="bp-tier-col-head">
                        <span class="bp-tier-num-pill">TIER ${entry.tier}</span>
                        <span class="bp-tier-state-dot">${reached ? '✓ UNLOCKED' : '🔒 LOCKED'}</span>
                    </div>
                    ${this._renderSlot(entry, entry.free, 'free', prog.tier)}
                    ${this.filter === 'FREE' ? '' : this._renderSlot(entry, entry.paid, 'paid', prog.tier)}
                </div>
            `;
        }).join('');

        this.trackEl.querySelectorAll('[data-bp-claim]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const t = parseInt(btn.getAttribute('data-bp-claim'), 10);
                const tr = btn.getAttribute('data-bp-track') || 'free';
                if (t) {
                    this.manager.claimReward(t, tr);
                    this.render();
                }
            });
        });

        this.trackEl.querySelectorAll('[data-bp-need-pass]').forEach((btn) => {
            btn.addEventListener('click', () => {
                if (this.buyPassBtn) {
                    this.buyPassBtn.classList.remove('bp-btn-pulse');
                    void this.buyPassBtn.offsetWidth;
                    this.buyPassBtn.classList.add('bp-btn-pulse');
                }
                if (window.soundEngine) window.soundEngine.playSelect();
                if (window.modalManager && typeof window.modalManager.showQuickToast === 'function') {
                    window.modalManager.showQuickToast(`💎 Unlock the full Battle Pass above for ${BattlePassManager.PASS_GEM_COST} Gems to claim Paid rewards!`, 2300);
                }
            });
        });
    }
}

if (typeof window !== 'undefined') {
    window.BattlePassModalUI = BattlePassModalUI;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BattlePassModalUI;
}
