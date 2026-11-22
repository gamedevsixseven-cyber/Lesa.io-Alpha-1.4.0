/**
 * Lesa.io - Season 1 Battle Pass Dual-Track Rail & Spotlight Inspector UI
 * Displays horizontal 30-tier Free + Paid progression tracks, live XP/wallet status,
 * milestone quick-jumps, reward inspection, and direct 1-click skin/weapon equipping.
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
        this.spotlightEl = document.getElementById('bp-spotlight-panel');
        this.filter = 'ALL';
        this.selectedSlot = null; // { tier, track }

        this.bindEvents();
    }

    _esc(val) {
        return String(val == null ? '' : val).replace(/[&<>"']/g, (ch) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[ch]));
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
            this.buyPassBtn.addEventListener('click', () => this._handleBuyPassClick(this.buyPassBtn));
        }
        if (this.claimAllBtn) {
            this.claimAllBtn.addEventListener('click', () => {
                if (!this.manager) return;
                this.manager.claimAllAvailable();
                this.render({ preserveScroll: true });
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
                    this.selectedSlot = { tier: res.newTier, track: this.manager.hasPremium ? 'paid' : 'free' };
                    this.render({ scrollToTier: res.newTier });
                }
            });
        }

        const xpHelpBtn = document.getElementById('bp-xp-help-btn');
        const xpSourcesBar = document.getElementById('bp-xp-sources-bar');
        if (xpHelpBtn && xpSourcesBar) {
            xpHelpBtn.addEventListener('click', () => {
                const open = xpSourcesBar.classList.toggle('hidden');
                xpHelpBtn.classList.toggle('active', !open);
                if (window.soundEngine) window.soundEngine.playSelect();
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

        document.querySelectorAll('#bp-jump-bar [data-bp-jump]').forEach((btn) => {
            btn.addEventListener('click', () => {
                if (!this.manager) return;
                const raw = btn.getAttribute('data-bp-jump');
                const targetTier = raw === 'current' ? this.manager.getCurrentTier() : parseInt(raw, 10);
                if (!Number.isFinite(targetTier)) return;
                if (this.filter !== 'ALL') {
                    this.filter = 'ALL';
                    document.querySelectorAll('#bp-filter-bar .tab-filter-chip').forEach((c) => {
                        c.classList.toggle('active', c.getAttribute('data-bp-filter') === 'ALL');
                    });
                }
                const entry = BattlePassManager.TIERS.find(t => t.tier === targetTier);
                if (entry) this.selectedSlot = { tier: targetTier, track: 'paid' };
                if (window.soundEngine) window.soundEngine.playSelect();
                this.render({ scrollToTier: targetTier });
            });
        });

        const leftArrow = document.getElementById('bp-scroll-left');
        const rightArrow = document.getElementById('bp-scroll-right');
        if (leftArrow) leftArrow.addEventListener('click', () => this.trackEl && this.trackEl.scrollBy({ left: -300, behavior: 'smooth' }));
        if (rightArrow) rightArrow.addEventListener('click', () => this.trackEl && this.trackEl.scrollBy({ left: 300, behavior: 'smooth' }));

        if (this.trackEl) {
            this.trackEl.addEventListener('wheel', (e) => {
                if (this.trackEl.scrollWidth > this.trackEl.clientWidth && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                    this.trackEl.scrollLeft += e.deltaY * 1.2;
                    e.preventDefault();
                }
            }, { passive: false });
        }

        if (typeof window !== 'undefined' && window.EventBus) {
            const syncOpen = () => {
                if (this.modal && !this.modal.classList.contains('hidden')) this.render({ preserveScroll: true });
            };
            window.EventBus.on('battlePassUpdated', syncOpen);
            window.EventBus.on('currencyChanged', syncOpen);
            window.EventBus.on('heroSkinChanged', syncOpen);
        }
    }

    _handleBuyPassClick(anchorBtn) {
        if (!this.manager) return;
        const res = this.manager.buyPremiumPassWithGems();
        if (!res.success) {
            if (typeof ModalManager !== 'undefined') ModalManager.notifyInsufficient(res.reason, anchorBtn);
        } else {
            this.render({ preserveScroll: true });
        }
    }

    show() {
        if (!this.modal) this.modal = document.getElementById('battle-pass-modal');
        if (!this.modal) return;
        const focusTier = this._pickDefaultFocus();
        this.modal.classList.remove('hidden');
        this.render({ scrollToTier: focusTier, instantScroll: true });
    }

    hide() {
        if (this.modal) this.modal.classList.add('hidden');
    }

    _pickDefaultFocus() {
        if (!this.manager) return 1;
        const curTier = this.manager.getCurrentTier();
        const ready = this.manager.getClaimableRewards();
        if (ready.free.length > 0) {
            this.selectedSlot = { tier: ready.free[0], track: 'free' };
            return ready.free[0];
        }
        if (ready.paid.length > 0) {
            this.selectedSlot = { tier: ready.paid[0], track: 'paid' };
            return ready.paid[0];
        }
        const nextMilestone = BattlePassManager.TIERS.find(t =>
            t.tier >= curTier && (t.paid.type === 'skin' || t.paid.type === 'weapon')
        ) || BattlePassManager.TIERS[BattlePassManager.TIERS.length - 1];
        this.selectedSlot = { tier: nextMilestone.tier, track: 'paid' };
        return curTier;
    }

    _resolveNextMilestone(curTier) {
        const next = BattlePassManager.TIERS.find(t =>
            t.tier > curTier && (t.paid.type === 'skin' || t.paid.type === 'weapon')
        );
        if (!next) return 'ALL MILESTONES REACHED';
        const kind = next.paid.type === 'skin' ? 'SKIN' : 'GUN';
        return `NEXT: T${next.tier} ${kind}`;
    }

    _updateHeader(prog, ready) {
        const hasPremium = this.manager.hasPremium;
        const coins = (typeof window !== 'undefined' && window.GameState && window.GameState.player) ? (window.GameState.player.coins || 0) : 0;
        const gems = (typeof window !== 'undefined' && window.GameState && window.GameState.player) ? (window.GameState.player.gems || 0) : 0;
        const totalClaimed = this.manager.claimedFree.length + this.manager.claimedPremium.length;
        const totalPossible = BattlePassManager.TIERS.length * 2;

        const coinsEl = document.getElementById('bp-coins-val');
        const gemsEl = document.getElementById('bp-gems-val');
        const collEl = document.getElementById('bp-collected-val');
        const nextEl = document.getElementById('bp-next-milestone-pill');
        const readyCntEl = document.getElementById('bp-ready-count');

        if (coinsEl) coinsEl.textContent = coins.toLocaleString();
        if (gemsEl) gemsEl.textContent = gems.toLocaleString();
        if (collEl) collEl.textContent = `${totalClaimed} / ${totalPossible}`;
        if (nextEl) nextEl.textContent = this._resolveNextMilestone(prog.tier);
        if (readyCntEl) readyCntEl.textContent = ready.total > 0 ? `(${ready.total})` : '';

        if (this.tierBadgeEl) this.tierBadgeEl.textContent = `${prog.tier} / ${BattlePassManager.MAX_TIER}`;
        if (this.xpFillEl) this.xpFillEl.style.width = `${prog.pct}%`;
        if (this.xpLabelEl) {
            this.xpLabelEl.textContent = prog.tier >= BattlePassManager.MAX_TIER
                ? `SEASON MAXED (${this.manager.xp.toLocaleString()} XP)`
                : `${prog.intoTier} / ${prog.needed} XP to Tier ${prog.tier + 1}`;
        }
        if (this.statusPillEl) {
            this.statusPillEl.textContent = hasPremium ? '👑 VIP PASS ACTIVE' : 'FREE PASS';
            this.statusPillEl.className = `bp-status-pill ${hasPremium ? 'paid' : 'free'}`;
        }
        if (this.buyPassBtn) {
            this.buyPassBtn.disabled = hasPremium;
            const lockedReadyPaid = !hasPremium ? BattlePassManager.TIERS.filter(e => e.tier <= prog.tier && !this.manager.claimedPremium.includes(e.tier)).length : 0;
            this.buyPassBtn.textContent = hasPremium
                ? '👑 VIP OWNED ✓'
                : (lockedReadyPaid > 0 ? `👑 BUY VIP (+${lockedReadyPaid} READY • 💎 ${BattlePassManager.PASS_GEM_COST})` : `👑 BUY VIP (💎 ${BattlePassManager.PASS_GEM_COST})`);
            this.buyPassBtn.classList.toggle('is-insufficient', !hasPremium && gems < BattlePassManager.PASS_GEM_COST);
        }
        if (this.claimAllBtn) {
            this.claimAllBtn.disabled = ready.total === 0;
            this.claimAllBtn.textContent = ready.total > 0 ? `CLAIM ALL (${ready.total})` : 'NOTHING READY';
            this.claimAllBtn.classList.toggle('is-ready-pulse', ready.total > 0);
        }
        if (this.skipBtn) {
            const maxed = prog.tier >= BattlePassManager.MAX_TIER;
            this.skipBtn.disabled = maxed;
            this.skipBtn.textContent = maxed ? 'MAX TIER' : `+1 TIER (💎 ${BattlePassManager.SKIP_TIER_GEM_COST})`;
            this.skipBtn.classList.toggle('is-insufficient', !maxed && gems < BattlePassManager.SKIP_TIER_GEM_COST);
        }
    }

    _renderSlot(entry, reward, track, currentTier) {
        const isPaid = track === 'paid';
        const claimedArr = isPaid ? this.manager.claimedPremium : this.manager.claimedFree;
        const isClaimed = claimedArr.includes(entry.tier);
        const tierReached = entry.tier <= currentTier;
        const isReady = !isClaimed && tierReached && (!isPaid || this.manager.hasPremium);
        const isSelected = this.selectedSlot && this.selectedSlot.tier === entry.tier && this.selectedSlot.track === track;

        let slotState = isClaimed ? 'bp-claimed' : (isReady ? 'bp-ready' : ((isPaid && !this.manager.hasPremium) ? 'bp-paid-locked' : ''));
        if (isSelected) slotState += ' bp-selected';

        const rar = reward.rarity || 'common';
        const kindTag = reward.type === 'skin' ? 'SKIN' : (reward.type === 'weapon' ? rar : reward.type);
        const trackBadge = isPaid ? '<span class="bp-track-tag paid">👑 VIP</span>' : '<span class="bp-track-tag free">FREE</span>';

        let skinDot = '';
        if (reward.type === 'skin' && typeof HeroSkinSystem !== 'undefined') {
            const meta = HeroSkinSystem.getSkinMeta(reward.heroId, reward.skinId);
            if (meta && meta.accent) {
                skinDot = `<span class="bp-skin-swatch-dot" style="background:${meta.accent};"></span>`;
            }
        }

        let btnHtml;
        if (isClaimed) {
            btnHtml = `<button class="comic-btn bp-claim-btn" disabled>CLAIMED ✓</button>`;
        } else if (isReady) {
            btnHtml = `<button class="comic-btn ${isPaid ? 'bp-claim-vip-btn' : 'comic-btn-primary'} bp-claim-btn" data-bp-claim="${entry.tier}" data-bp-track="${track}">CLAIM!</button>`;
        } else if (isPaid && !this.manager.hasPremium) {
            btnHtml = `<button class="comic-btn bp-claim-btn bp-need-pass-btn" data-bp-need-pass="1">🔒 VIP PASS</button>`;
        } else {
            const xpNeeded = Math.max(0, (entry.tier - 1) * BattlePassManager.XP_PER_TIER - this.manager.xp);
            btnHtml = `<button class="comic-btn bp-claim-btn" disabled>🔒 ${xpNeeded} XP</button>`;
        }

        return `
            <div class="bp-slot ${isPaid ? 'bp-slot-paid' : 'bp-slot-free'} ${slotState}" data-bp-select-tier="${entry.tier}" data-bp-select-track="${track}">
                <div class="bp-slot-top">
                    ${trackBadge}
                    <span class="bp-rarity-tag bp-r-${rar}">${this._esc(kindTag)}</span>
                </div>
                <div class="bp-icon-box bp-glow-${rar}"><img src="${this._esc(reward.icon)}" alt="${this._esc(reward.label)}">${skinDot}</div>
                <div class="bp-reward-name">${this._esc(reward.label)}</div>
                <div class="bp-reward-sub">${this._esc(reward.sub)}</div>
                ${btnHtml}
            </div>
        `;
    }

    _equipRewardFromSpotlight(reward) {
        if (reward.type === 'skin' && typeof HeroSkinSystem !== 'undefined') {
            if (HeroSkinSystem.setActiveSkin(reward.heroId, reward.skinId)) {
                if (window.GameState && window.GameState.player && window.GameState.player.unlockedHeroes && window.GameState.player.unlockedHeroes.includes(reward.heroId)) {
                    window.GameState.setSelectedHero(reward.heroId);
                }
                if (window.soundEngine) window.soundEngine.playSelect();
                if (window.modalManager) window.modalManager.showQuickToast(`🎨 Equipped ${reward.label}!`, 1700);
                this.render({ preserveScroll: true });
            }
        } else if (reward.type === 'weapon' && typeof WeaponSystem !== 'undefined' && WeaponSystem.isWeaponUnlocked(reward.weaponId)) {
            if (window.GameState && window.GameState.player) {
                window.GameState.player.selectedWeapon = reward.weaponId;
                window.GameState.player.weaponType = reward.weaponId;
            }
            if (typeof localStorage !== 'undefined') localStorage.setItem('lesaio_selected_weapon', reward.weaponId);
            if (window.uiController && window.uiController.modalManager) window.uiController.modalManager.updateWeaponsModal();
            if (window.soundEngine) window.soundEngine.playSelect();
            if (window.modalManager) window.modalManager.showQuickToast(`🔫 Equipped ${reward.label}!`, 1700);
            this.render({ preserveScroll: true });
        }
    }

    _renderSpotlight(curTier) {
        if (!this.spotlightEl || !this.manager) return;
        const sel = this.selectedSlot || { tier: curTier, track: 'paid' };
        const entry = BattlePassManager.TIERS.find(t => t.tier === sel.tier) || BattlePassManager.TIERS[0];
        const isPaid = sel.track === 'paid';
        const reward = isPaid ? entry.paid : entry.free;
        const rar = reward.rarity || 'common';
        const claimed = (isPaid ? this.manager.claimedPremium : this.manager.claimedFree).includes(entry.tier);
        const reached = entry.tier <= curTier;
        const ready = !claimed && reached && (!isPaid || this.manager.hasPremium);

        let extraHtml = '';
        if (reward.type === 'weapon') {
            const w = (typeof WEAPONS !== 'undefined' && WEAPONS[reward.weaponId]) || {};
            const fireRate = w.baseDelay ? `${(60 / w.baseDelay).toFixed(1)}/s` : '—';
            const crit = w.critChanceBonus ? `+${Math.round(w.critChanceBonus * 100)}%` : 'Base';
            extraHtml = `
                <div class="bp-spot-stats">
                    <div class="bp-spot-stat-box"><span class="bp-spot-stat-k">DAMAGE</span><span class="bp-spot-stat-v">${w.baseDamage || '—'}</span></div>
                    <div class="bp-spot-stat-box"><span class="bp-spot-stat-k">FIRE RATE</span><span class="bp-spot-stat-v">${fireRate}</span></div>
                    <div class="bp-spot-stat-box"><span class="bp-spot-stat-k">PIERCE / BOUNCE</span><span class="bp-spot-stat-v">+${w.extraPierce || 0} / ${w.maxBounces || 0}</span></div>
                    <div class="bp-spot-stat-box"><span class="bp-spot-stat-k">RANGE • CRIT</span><span class="bp-spot-stat-v">${w.range || '—'} • ${crit}</span></div>
                </div>
            `;
        } else if (reward.type === 'skin' && typeof HeroSkinSystem !== 'undefined') {
            const meta = HeroSkinSystem.getSkinMeta(reward.heroId, reward.skinId);
            extraHtml = `
                <div class="bp-spot-stats">
                    <div class="bp-spot-stat-box"><span class="bp-spot-stat-k">HERO</span><span class="bp-spot-stat-v">${this._esc((reward.heroId || '').toUpperCase())}</span></div>
                    <div class="bp-spot-stat-box"><span class="bp-spot-stat-k">BONUS</span><span class="bp-spot-stat-v">${reward.bonusChest ? '+ LEGENDARY CHEST' : 'INSTANT EQUIP'}</span></div>
                </div>
                ${meta ? `<div class="bp-spot-palette"><span>SKIN PALETTE</span><div class="bp-spot-swatches"><span class="bp-swatch" style="background:${meta.accent};"></span><span class="bp-swatch" style="background:${meta.trim || meta.badge};"></span><span class="bp-swatch" style="background:${meta.badge};"></span></div></div>` : ''}
            `;
        } else {
            const valText = reward.type === 'gold' ? `+${(reward.amount || 0).toLocaleString()} Coins` : (reward.type === 'gems' ? `+${reward.amount || 0} Gems` : `${(reward.chestType || 'rare').toUpperCase()} Tier Crate`);
            extraHtml = `
                <div class="bp-spot-stats">
                    <div class="bp-spot-stat-box"><span class="bp-spot-stat-k">REWARD VALUE</span><span class="bp-spot-stat-v">${this._esc(valText)}</span></div>
                    <div class="bp-spot-stat-box"><span class="bp-spot-stat-k">UNLOCK TIER</span><span class="bp-spot-stat-v">TIER ${entry.tier} (${(entry.tier - 1) * BattlePassManager.XP_PER_TIER} XP)</span></div>
                </div>
            `;
        }

        let actionHtml = '';
        if (ready) {
            actionHtml = `<button type="button" class="comic-btn ${isPaid ? 'bp-claim-vip-btn' : 'comic-btn-primary'} bp-spot-action-btn" id="bp-spot-claim-btn">🎁 CLAIM REWARD</button>`;
        } else if (claimed) {
            if (reward.type === 'skin' && typeof HeroSkinSystem !== 'undefined' && HeroSkinSystem.isSkinUnlocked(reward.heroId, reward.skinId)) {
                const equipped = HeroSkinSystem.getActiveSkin(reward.heroId) === reward.skinId;
                actionHtml = `<button type="button" class="comic-btn ${equipped ? '' : 'comic-btn-primary'} bp-spot-action-btn" id="bp-spot-equip-btn" ${equipped ? 'disabled' : ''}>${equipped ? '✓ SKIN EQUIPPED' : '🎨 EQUIP SKIN'}</button>`;
            } else if (reward.type === 'weapon' && typeof WeaponSystem !== 'undefined' && WeaponSystem.isWeaponUnlocked(reward.weaponId)) {
                const curWep = (window.GameState && window.GameState.player && (window.GameState.player.selectedWeapon || window.GameState.player.weaponType)) || localStorage.getItem('lesaio_selected_weapon');
                const equipped = curWep === reward.weaponId;
                actionHtml = `<button type="button" class="comic-btn ${equipped ? '' : 'comic-btn-primary'} bp-spot-action-btn" id="bp-spot-equip-btn" ${equipped ? 'disabled' : ''}>${equipped ? '✓ WEAPON EQUIPPED' : '🔫 EQUIP WEAPON'}</button>`;
            } else {
                actionHtml = `<button type="button" class="comic-btn bp-spot-action-btn" disabled>CLAIMED ✓</button>`;
            }
        } else if (isPaid && !this.manager.hasPremium) {
            actionHtml = `<button type="button" class="comic-btn bp-buy-pass-btn bp-spot-action-btn" id="bp-spot-buy-btn">👑 UNLOCK VIP (💎 ${BattlePassManager.PASS_GEM_COST})</button>`;
        } else {
            const need = Math.max(0, (entry.tier - 1) * BattlePassManager.XP_PER_TIER - this.manager.xp);
            actionHtml = `<button type="button" class="comic-btn bp-spot-action-btn" disabled>🔒 NEED ${need} MORE XP</button>`;
        }

        const vipPitch = !this.manager.hasPremium
            ? `<div class="bp-spot-vip-pitch">👑 VIP Pass unlocks 5 Exclusive Skins, 5 Battle Pass Guns, 2 Legendary Chests &amp; 460 VIP Gems across 30 tiers.</div>`
            : '';

        this.spotlightEl.innerHTML = `
            <div class="bp-spot-top">
                <span class="bp-spot-kicker">REWARD INSPECTOR • TIER ${entry.tier}</span>
                <span class="bp-rarity-tag bp-r-${rar}">${this._esc(rar)}</span>
            </div>
            <div class="bp-spot-stage rar-${rar}">
                <img class="bp-spot-icon" src="${this._esc(reward.icon)}" alt="${this._esc(reward.label)}">
                <div>
                    <div class="bp-spot-title">${this._esc(reward.label)}</div>
                    <div class="bp-spot-sub">${this._esc(reward.sub)}</div>
                </div>
            </div>
            ${extraHtml}
            ${vipPitch}
            <div class="bp-spot-actions">${actionHtml}</div>
        `;

        const spotClaim = document.getElementById('bp-spot-claim-btn');
        if (spotClaim) spotClaim.addEventListener('click', () => { this.manager.claimReward(entry.tier, sel.track); this.render({ preserveScroll: true }); });
        const spotEquip = document.getElementById('bp-spot-equip-btn');
        if (spotEquip) spotEquip.addEventListener('click', () => this._equipRewardFromSpotlight(reward));
        const spotBuy = document.getElementById('bp-spot-buy-btn');
        if (spotBuy) spotBuy.addEventListener('click', () => this._handleBuyPassClick(spotBuy));
    }

    render(options = {}) {
        if (!this.manager) return;
        const prog = this.manager.getTierProgress();
        const ready = this.manager.getClaimableRewards();
        const hasPremium = this.manager.hasPremium;

        this._updateHeader(prog, ready);
        if (!this.trackEl) this.trackEl = document.getElementById('bp-track-list');
        if (!this.trackEl) return;

        const prevScroll = options.preserveScroll ? this.trackEl.scrollLeft : 0;
        const filtered = BattlePassManager.TIERS.filter((entry) => {
            if (this.filter === 'READY') {
                return entry.tier <= prog.tier && (!this.manager.claimedFree.includes(entry.tier) || (hasPremium && !this.manager.claimedPremium.includes(entry.tier)));
            }
            if (this.filter === 'LOOT') {
                return entry.free.type === 'skin' || entry.free.type === 'weapon' || entry.paid.type === 'skin' || entry.paid.type === 'weapon';
            }
            return true;
        });

        if (filtered.length === 0) {
            this.trackEl.innerHTML = `<div class="tab-empty-filter-state" style="width:100%; margin:auto;">No claimable rewards right now — clear Waves or finish Daily Quests for Battle Pass XP!</div>`;
            this._renderSpotlight(prog.tier);
            return;
        }

        const legendEl = document.querySelector('.bp-track-legend .bp-legend-paid');
        if (legendEl) legendEl.style.display = this.filter === 'FREE' ? 'none' : '';

        this.trackEl.innerHTML = filtered.map((entry) => {
            const reached = entry.tier <= prog.tier;
            const isCurrent = entry.tier === prog.tier;
            const isMilestone = entry.paid.type === 'skin' || entry.paid.type === 'weapon';
            const cls = [
                'bp-tier-column',
                reached ? 'bp-tier-reached' : '',
                isCurrent ? 'bp-tier-current' : '',
                isMilestone ? 'bp-tier-milestone' : ''
            ].filter(Boolean).join(' ');
            const nodeText = isMilestone ? (entry.tier === 30 ? '👑 30' : `★ ${entry.tier}`) : `${entry.tier}`;
            return `
                <div class="${cls}" data-bp-col-tier="${entry.tier}">
                    <div class="bp-spine-cell"><span class="bp-tier-node">${nodeText}</span></div>
                    ${this._renderSlot(entry, entry.free, 'free', prog.tier)}
                    ${this.filter === 'FREE' ? '' : this._renderSlot(entry, entry.paid, 'paid', prog.tier)}
                </div>
            `;
        }).join('');

        this.trackEl.querySelectorAll('[data-bp-select-tier]').forEach((slotEl) => {
            slotEl.addEventListener('click', () => {
                const tier = parseInt(slotEl.getAttribute('data-bp-select-tier'), 10);
                const track = slotEl.getAttribute('data-bp-select-track') || 'paid';
                if (!tier) return;
                this.selectedSlot = { tier, track };
                if (window.soundEngine) window.soundEngine.playSelect();
                this.render({ preserveScroll: true });
            });
        });

        this.trackEl.querySelectorAll('[data-bp-claim]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const t = parseInt(btn.getAttribute('data-bp-claim'), 10);
                const tr = btn.getAttribute('data-bp-track') || 'free';
                if (t) {
                    this.selectedSlot = { tier: t, track: tr };
                    this.manager.claimReward(t, tr);
                    this.render({ preserveScroll: true });
                }
            });
        });

        this.trackEl.querySelectorAll('[data-bp-need-pass]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.buyPassBtn) {
                    this.buyPassBtn.classList.remove('bp-btn-pulse');
                    void this.buyPassBtn.offsetWidth;
                    this.buyPassBtn.classList.add('bp-btn-pulse');
                }
                if (window.soundEngine) window.soundEngine.playSelect();
                if (window.modalManager && typeof window.modalManager.showQuickToast === 'function') {
                    window.modalManager.showQuickToast(`💎 Unlock VIP Pass above for ${BattlePassManager.PASS_GEM_COST} Gems to claim Paid rewards!`, 2300);
                }
            });
        });

        this._renderSpotlight(prog.tier);

        if (options.scrollToTier) {
            const targetCol = this.trackEl.querySelector(`[data-bp-col-tier="${options.scrollToTier}"]`);
            if (targetCol) {
                const offset = targetCol.offsetLeft - (this.trackEl.clientWidth / 2) + (targetCol.clientWidth / 2);
                const left = Math.max(0, offset);
                if (options.instantScroll) this.trackEl.scrollLeft = left;
                else this.trackEl.scrollTo({ left, behavior: 'smooth' });
            }
        } else if (options.preserveScroll) {
            this.trackEl.scrollLeft = prevScroll;
        }
    }
}

if (typeof window !== 'undefined') window.BattlePassModalUI = BattlePassModalUI;
if (typeof module !== 'undefined' && module.exports) module.exports = BattlePassModalUI;
