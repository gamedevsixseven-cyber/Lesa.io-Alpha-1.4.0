/**
 * Lesa.io - Battle Perks Loadout & Vault Forge UI Manager
 * Handles Call of Duty style 3-slot loadout equipping, exclusive group auto-swapping,
 * Combat Feat gates, Coin+Material Vault Forging, and Rank Lv.1 -> Lv.3 Ascension.
 */

class PerkManager {
    constructor() {
        this.modal = document.getElementById('talents-modal');
        this.slotsContainer = document.querySelector('#talents-modal .perks-loadout-slots');
        this.vaultSection = document.querySelector('#talents-modal .perks-vault-section');
        this.selectedSlot = 0; // 0, 1, or 2

        this.searchQuery = '';
        this.filterCategory = 'ALL';
        this.searchInput = document.getElementById('perks-search-input');
        this.clearSearchBtn = document.getElementById('perks-search-clear-btn');
        this.filterChips = document.querySelectorAll('#talents-modal .perk-filter-chip');

        this.initEvents();
    }

    initEvents() {
        const renderIfOpen = () => {
            if (!this.modal || !this.modal.classList.contains('hidden')) {
                this.render();
            }
        };

        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.on('perkUnlocked', () => this.render());
            window.EventBus.on('perkUpgraded', () => this.render());
            window.EventBus.on('perkEquipped', (data) => {
                if (data && data.swappedOldPerk) {
                    const meta = (typeof PerkProgression !== 'undefined' && data.exclusiveGroup)
                        ? PerkProgression.getExclusiveTagMeta(data.exclusiveGroup)
                        : null;
                    const limitText = (meta && meta.swapLabel) ? `Max 1 ${meta.swapLabel}` : 'Max 1 Exclusive Perk';
                    const msg = `Swapped ${data.swappedOldPerk.name}! (${limitText})`;
                    if (window.modalManager && typeof window.modalManager.showQuickToast === 'function') {
                        window.modalManager.showQuickToast(msg);
                    }
                }
                this.render();
            });
            window.EventBus.on('perkUnequipped', () => this.render());
            window.EventBus.on('currencyChanged', renderIfOpen);
            window.EventBus.on('materialsUpdated', renderIfOpen);
            window.EventBus.on('combatFeatsUpdated', renderIfOpen);
            window.EventBus.on('accountXpChanged', renderIfOpen);
        }

        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => {
                this.searchQuery = (this.searchInput.value || '').trim().toLowerCase();
                if (this.clearSearchBtn) {
                    this.clearSearchBtn.classList.toggle('hidden', this.searchQuery.length === 0);
                }
                this.renderVaultGrid();
            });
        }

        if (this.clearSearchBtn) {
            this.clearSearchBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.searchInput) this.searchInput.value = '';
                this.searchQuery = '';
                this.clearSearchBtn.classList.add('hidden');
                this.renderVaultGrid();
            });
        }

        if (this.filterChips && this.filterChips.length > 0) {
            this.filterChips.forEach((chip) => {
                chip.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.filterCategory = chip.getAttribute('data-filter') || 'ALL';
                    this.filterChips.forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
                        window.soundEngine.playSelect();
                    }
                    this.renderVaultGrid();
                });
            });
        }
    }

    getEquippedPerks() {
        const p = (window.GameState && window.GameState.player) || {};
        let eq = p.equippedPerks;
        if (!Array.isArray(eq)) eq = [null, null, null];
        while (eq.length < 3) eq.push(null);
        return eq.slice(0, 3);
    }

    getUnlockedPerks() {
        const p = (window.GameState && window.GameState.player) || {};
        return Array.isArray(p.unlockedPerks) ? p.unlockedPerks : [];
    }

    render() {
        if (!this.slotsContainer || !this.vaultSection) return;

        const equipped = this.getEquippedPerks();
        const unlocked = this.getUnlockedPerks();
        const gs = (typeof window !== 'undefined') ? window.GameState : null;
        const playerCoins = (gs && gs.player && gs.player.coins) || 0;
        const equippedCount = equipped.filter(Boolean).length;
        const perkEntries = (typeof PERKS_DATA !== 'undefined') ? Object.entries(PERKS_DATA) : [];

        let totalRanks = 0;
        let maxTotalRanks = 0;
        for (const [id, pDef] of perkEntries) {
            const maxR = (typeof PerkProgression !== 'undefined') ? PerkProgression.getPerkMaxRank(pDef) : 1;
            const curR = (typeof PerkProgression !== 'undefined') ? PerkProgression.getPerkRank(gs, id) : (unlocked.includes(id) ? 1 : 0);
            totalRanks += curR;
            maxTotalRanks += maxR;
        }

        const summaryBar = document.getElementById('perks-summary-bar');
        if (summaryBar && typeof ModalManager !== 'undefined' && ModalManager.renderTabSummaryBar) {
            ModalManager.renderTabSummaryBar(summaryBar, [
                { icon: '🪙', label: 'COINS', val: playerCoins.toLocaleString(), cls: 'tab-pill-gold' },
                { icon: '🎖️', label: 'LOADOUT', val: `${equippedCount} / 3`, cls: 'tab-pill-green' },
                { icon: '📦', label: 'UNLOCKED', val: `${unlocked.length} / ${perkEntries.length}` },
                { icon: '⭐', label: 'RANKS', val: `${totalRanks} / ${maxTotalRanks}` }
            ]);
        }

        if (equipped[this.selectedSlot] !== null) {
            const firstEmpty = equipped.findIndex(p => p === null);
            if (firstEmpty !== -1) this.selectedSlot = firstEmpty;
        }

        this.slotsContainer.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const perkId = equipped[i];
            const perk = (perkId && typeof PERKS_DATA !== 'undefined') ? PERKS_DATA[perkId] : null;
            const isSelected = (this.selectedSlot === i);

            const card = document.createElement('div');
            card.className = `perk-slot-card perk-slot-${i + 1} ${isSelected ? 'active-slot-focus' : ''} ${perk ? 'filled-slot' : 'empty-slot'}`;
            card.style.cursor = 'pointer';

            if (perk) {
                const perkIconHtml = typeof UiIcons !== 'undefined' ? UiIcons.renderDefIcon(perk, 'ui-icon-box') : perk.icon;
                const curRank = (typeof PerkProgression !== 'undefined') ? PerkProgression.getPerkRank(gs, perkId) : 1;
                const maxRank = (typeof PerkProgression !== 'undefined') ? PerkProgression.getPerkMaxRank(perk) : 1;
                const rankLabel = curRank >= maxRank && maxRank > 1 ? 'MAX' : `LV.${curRank}`;
                const group = (typeof PerkProgression !== 'undefined') ? PerkProgression.getExclusiveGroup(perk) : null;
                const groupBadge = group ? `<span class="perk-slot-rank-badge is-cap">${group === 'capstone' ? 'CAPSTONE' : 'DASH'}</span>` : '';

                card.innerHTML = `
                    <div class="perk-slot-badge" style="background:${perk.color};">SLOT ${i + 1} • ${perk.badge}</div>
                    <div class="perk-icon-frame" style="border-color:${perk.color}; background:${perk.color}22;">
                        <span class="perk-active-icon">${perkIconHtml}</span>
                    </div>
                    <h3 class="perk-slot-title" style="color:${perk.color};">${perk.name.toUpperCase()}</h3>
                    <div class="perk-slot-meta-row">
                        <span class="perk-slot-rank-badge">${rankLabel}</span>
                        ${groupBadge}
                    </div>
                    <button class="perk-slot-unequip-btn" data-slot="${i}" title="Unequip perk">UNEQUIP ✕</button>
                `;

                const unequipBtn = card.querySelector('.perk-slot-unequip-btn');
                if (unequipBtn) {
                    unequipBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (window.soundEngine && typeof window.soundEngine.playGoBack === 'function') window.soundEngine.playGoBack();
                        if (window.GameState) window.GameState.unequipPerk(i);
                        this.selectedSlot = i;
                        this.render();
                    });
                }
            } else {
                const plusHtml = typeof UiIcons !== 'undefined' ? UiIcons.i('plus') : '➕';
                card.innerHTML = `
                    <div class="perk-slot-badge">SLOT ${i + 1}</div>
                    <div class="perk-empty-frame"><span class="perk-empty-icon">${plusHtml}</span></div>
                    <h3 class="perk-slot-title">SLOT ${i + 1}</h3>
                    <span class="perk-slot-status">${isSelected ? 'SELECTING...' : 'EMPTY'}</span>
                `;
            }

            card.addEventListener('click', () => {
                this.selectedSlot = i;
                if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') window.soundEngine.playSelect();
                this.render();
            });
            this.slotsContainer.appendChild(card);
        }

        this.renderVaultGrid();
    }

    _renderMaterialIcon(matId) {
        const def = (typeof MaterialRegistry !== 'undefined') ? MaterialRegistry.get(matId) : null;
        if (def && def.iconImg) {
            return `<img src="${def.iconImg}" class="ui-icon perk-mat-icon" alt="${def.name}">`;
        }
        return (typeof UiIcons !== 'undefined' && def) ? UiIcons.toHtml(def.icon, 'perk-mat-icon') : (def ? def.icon : '🪨');
    }

    _renderCostPills(cost, playerCoins, matsSnapshot) {
        if (!cost) return '';
        const pills = [];
        const icoCoin = typeof UiIcons !== 'undefined' ? UiIcons.i('coin', 'perk-mat-icon') : '🪙';

        if (cost.coins > 0) {
            const ok = playerCoins >= cost.coins;
            pills.push(`<span class="perk-cost-pill ${ok ? 'is-affordable' : 'is-short'}">${icoCoin} ${cost.coins.toLocaleString()}</span>`);
        }

        for (const [matId, qty] of Object.entries(cost.materials || {})) {
            const need = Math.floor(Number(qty) || 0);
            if (need <= 0) continue;
            const have = matsSnapshot[matId] || 0;
            const ok = have >= need;
            const def = (typeof MaterialRegistry !== 'undefined') ? MaterialRegistry.get(matId) : null;
            const title = def ? `${def.name}: ${have}/${need}` : `${have}/${need}`;
            pills.push(`<span class="perk-cost-pill ${ok ? 'is-affordable' : 'is-short'}" title="${title}">${this._renderMaterialIcon(matId)} x${need}</span>`);
        }
        return pills.join('');
    }

    _renderMaterialStashStrip(matsSnapshot) {
        const list = (typeof MaterialRegistry !== 'undefined') ? MaterialRegistry.getAll() : [];
        if (list.length === 0) return '';
        const chips = list.map((mat) => {
            const count = Math.max(0, Math.floor(matsSnapshot[mat.id] || 0));
            return `<span class="perk-stash-chip" title="${mat.name}: ${count} owned">${this._renderMaterialIcon(mat.id)} <span>${mat.shortName || mat.name}:</span> <strong>${count.toLocaleString()}</strong></span>`;
        }).join('');
        return `<div class="perks-material-stash">${chips}</div>`;
    }

    renderVaultGrid() {
        if (!this.vaultSection || typeof PERKS_DATA === 'undefined') return;

        const gs = (typeof window !== 'undefined') ? window.GameState : null;
        const equipped = this.getEquippedPerks();
        const unlocked = this.getUnlockedPerks();
        const playerCoins = (gs && gs.player && gs.player.coins) || 0;
        const matsSnapshot = (typeof PerkProgression !== 'undefined') ? PerkProgression.getMaterialsSnapshot(gs) : {};
        const totalPerks = Object.keys(PERKS_DATA).length;

        const icoCrate = typeof UiIcons !== 'undefined' ? UiIcons.i('crate') : '📦';
        const icoCoin = typeof UiIcons !== 'undefined' ? UiIcons.i('coin') : '🪙';
        const icoLock = typeof UiIcons !== 'undefined' ? UiIcons.i('lock') : '🔒';
        const icoSearch = typeof UiIcons !== 'undefined' ? UiIcons.i('search') : '🔍';
        const icoWrench = typeof UiIcons !== 'undefined' ? UiIcons.i('wrench') : '🛠️';

        let vaultHtml = `
            <div class="perks-vault-header">
                <span>${icoCrate} PERK VAULT (${unlocked.length}/${totalPerks} UNLOCKED)</span>
                <span class="perks-vault-wallet">${icoCoin} ${playerCoins.toLocaleString()} COINS</span>
            </div>
            ${this._renderMaterialStashStrip(matsSnapshot)}
            <div class="perks-vault-grid">
        `;

        let matchCount = 0;

        for (const [id, perk] of Object.entries(PERKS_DATA)) {
            if (this.filterCategory !== 'ALL' && perk.badge !== this.filterCategory) continue;

            const reqEval = (typeof PerkProgression !== 'undefined')
                ? PerkProgression.evaluateUnlockRequirements(perk, gs)
                : { allMet: true, items: [] };

            if (this.searchQuery) {
                const reqText = reqEval.items.map((r) => r.label).join(' ');
                const targetText = `${perk.name} ${perk.desc} ${perk.badge} ${perk.rarity || ''} ${perk.tagLabel || ''} ${perk.tag || ''} ${perk.exclusiveGroup || ''} ${perk.drawback || ''} ${reqText}`.toLowerCase();
                if (!targetText.includes(this.searchQuery)) continue;
            }

            matchCount++;
            const isUnlocked = unlocked.includes(id);
            const equippedSlot = equipped.indexOf(id);
            const isEquipped = (equippedSlot !== -1);

            const curRank = (typeof PerkProgression !== 'undefined') ? PerkProgression.getPerkRank(gs, id) : (isUnlocked ? 1 : 0);
            const maxRank = (typeof PerkProgression !== 'undefined') ? PerkProgression.getPerkMaxRank(perk) : 1;
            const activeRankData = (typeof PerkProgression !== 'undefined') ? PerkProgression.getPerkRankData(perk, Math.max(1, curRank)) : null;
            const nextUpgrade = (isUnlocked && typeof PerkProgression !== 'undefined') ? PerkProgression.getNextUpgradeCost(id, curRank) : null;

            const unlockCost = (typeof PerkProgression !== 'undefined') ? PerkProgression.getUnlockCost(perk) : { coins: perk.cost || 0, materials: {} };
            const unlockAfford = (typeof PerkProgression !== 'undefined') ? PerkProgression._canAfford(unlockCost, gs) : { affordable: playerCoins >= (perk.cost || 0) };
            const hasForgeMaterials = Object.keys(unlockCost.materials || {}).length > 0;

            const group = (typeof PerkProgression !== 'undefined') ? PerkProgression.getExclusiveGroup(perk) : null;
            const groupMeta = group && typeof PerkProgression !== 'undefined' ? PerkProgression.getExclusiveTagMeta(group) : null;
            const rarityCfg = (typeof PERK_RARITIES !== 'undefined' && PERK_RARITIES[perk.rarity || 'rare']) || { label: 'RARE', color: '#0984e3' };
            const perkIconHtml = typeof UiIcons !== 'undefined' ? UiIcons.renderDefIcon(perk, 'ui-icon-box') : perk.icon;

            const reqChipsHtml = (!isUnlocked && reqEval.items.length > 0)
                ? `<div class="perk-req-strip">${reqEval.items.map((item) =>
                    `<span class="perk-req-chip ${item.met ? 'is-met' : 'is-unmet'}">${item.met ? '✓' : icoLock} ${item.label} (${item.currentText})</span>`
                ).join('')}</div>`
                : '';

            const costStripHtml = (!isUnlocked && (unlockCost.coins > 0 || hasForgeMaterials))
                ? `<div class="perk-cost-strip"><span class="perk-strip-label">${hasForgeMaterials ? 'FORGE:' : 'UNLOCK:'}</span>${this._renderCostPills(unlockCost, playerCoins, matsSnapshot)}</div>`
                : '';

            const rankDescHtml = (isUnlocked && curRank > 1 && activeRankData && activeRankData.summary)
                ? `<div class="perk-active-rank-line">Active Rank ${curRank}: ${activeRankData.summary}</div>`
                : '';

            const drawbackHtml = perk.drawback
                ? `<div class="perk-drawback-line">⚠️ Drawback: ${perk.drawback}</div>`
                : '';

            const nextUpgradeHtml = (isUnlocked && nextUpgrade)
                ? `<div class="perk-next-rank-strip"><span class="perk-strip-label">NEXT LV.${nextUpgrade.nextRank}:</span><span class="perk-next-summary">${nextUpgrade.summary}</span><div class="perk-next-costs">${this._renderCostPills(nextUpgrade, playerCoins, matsSnapshot)}</div></div>`
                : '';

            vaultHtml += `
                <div class="perk-vault-item ${isUnlocked ? 'unlocked' : 'locked'} ${isEquipped ? 'is-equipped' : ''} rarity-${perk.rarity || 'rare'}" data-perk="${id}" style="--perk-color:${perk.color};">
                    <div class="perk-vault-icon-col">
                        <div class="perk-vault-icon" style="background:${perk.color}22; border-color:${perk.color};">${perkIconHtml}</div>
                    </div>
                    <div class="perk-vault-info-col">
                        <div class="perk-vault-title-row">
                            <h4 class="perk-vault-name">${perk.name}</h4>
                            <span class="perk-vault-category" style="background:${perk.color};">${perk.badge}</span>
                            <span class="perk-rarity-pill" style="background:${rarityCfg.color};">${rarityCfg.label}</span>
                            <span class="perk-vault-tag ${group ? 'tag-exclusive' : ''}">${perk.tagLabel || perk.tag}</span>
                            ${group === 'capstone' ? `<span class="perk-vault-tag tag-capstone">${groupMeta ? groupMeta.badgeText : 'CAPSTONE'}</span>` : ''}
                            ${(isUnlocked && maxRank > 1) ? `<span class="perk-rank-pill ${curRank >= maxRank ? 'is-max' : ''}">${curRank >= maxRank ? `★ MAX LV.${maxRank}` : `LV.${curRank}/${maxRank}`}</span>` : ''}
                            ${perk.drawback ? `<span class="perk-vault-tag tag-tradeoff">TRADE-OFF</span>` : ''}
                        </div>
                        <p class="perk-vault-desc">${perk.desc}</p>
                        ${rankDescHtml}
                        ${drawbackHtml}
                        ${reqChipsHtml}
                        ${costStripHtml}
                        ${nextUpgradeHtml}
                    </div>
                    <div class="perk-vault-action-col">
            `;

            if (!isUnlocked) {
                if (!reqEval.allMet) {
                    vaultHtml += `<button class="comic-btn perk-buy-btn cannot-buy is-feat-locked" data-buy="${id}">${icoLock} LOCKED</button>`;
                } else {
                    const btnLabel = hasForgeMaterials
                        ? `${icoWrench} FORGE`
                        : (unlockCost.coins === 0 ? 'CLAIM FREE' : `${icoCoin} ${unlockCost.coins.toLocaleString()}`);
                    vaultHtml += `<button class="comic-btn perk-buy-btn ${unlockAfford.affordable ? 'can-buy' : 'cannot-buy'}" data-buy="${id}">${btnLabel}</button>`;
                }
            } else {
                vaultHtml += isEquipped
                    ? `<button class="comic-btn perk-equipped-tag" data-unequip-slot="${equippedSlot}">SLOT ${equippedSlot + 1} ✕</button>`
                    : `<button class="comic-btn perk-equip-action-btn" data-equip="${id}">EQUIP [S${this.selectedSlot + 1}]</button>`;

                if (nextUpgrade) {
                    const upAfford = (typeof PerkProgression !== 'undefined') ? PerkProgression._canAfford(nextUpgrade, gs) : { affordable: false };
                    vaultHtml += `<button class="comic-btn perk-upgrade-btn ${upAfford.affordable ? 'can-buy' : 'cannot-buy'}" data-upgrade="${id}">⬆ LV.${nextUpgrade.nextRank}</button>`;
                } else if (maxRank > 1) {
                    vaultHtml += `<button class="comic-btn perk-upgrade-btn is-maxed" disabled>★ MAXED</button>`;
                }
            }

            vaultHtml += `</div></div>`;
        }

        if (matchCount === 0) {
            vaultHtml += `
                <div class="perks-vault-empty-search">
                    <span class="perks-vault-empty-search-icon">${icoSearch}</span>
                    <div>No battle perks found matching <strong>"${this.searchQuery || this.filterCategory}"</strong>.</div>
                </div>
            `;
        }

        vaultHtml += `</div>`;
        this.vaultSection.innerHTML = vaultHtml;
        this.bindVaultEvents();
    }

    _notifyCardError(msg, btn) {
        const card = btn ? btn.closest('.perk-vault-item') : null;
        if (typeof ModalManager !== 'undefined' && typeof ModalManager.notifyInsufficient === 'function') {
            ModalManager.notifyInsufficient(msg, card);
        } else if (window.soundEngine && typeof window.soundEngine.playBuzzer === 'function') {
            window.soundEngine.playBuzzer();
        }
    }

    bindVaultEvents() {
        this.vaultSection.querySelectorAll('.perk-buy-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const perkId = btn.getAttribute('data-buy');
                if (!window.GameState) return;

                const res = (typeof window.GameState.unlockPerkWithResult === 'function')
                    ? window.GameState.unlockPerkWithResult(perkId)
                    : { success: window.GameState.unlockPerk(perkId) };

                if (res && res.success) {
                    if (window.soundEngine && typeof window.soundEngine.playPickup === 'function') window.soundEngine.playPickup('star');
                    const equipped = this.getEquippedPerks();
                    if (equipped[this.selectedSlot] === null) window.GameState.equipPerk(perkId, this.selectedSlot);
                    if (window.uiController && typeof window.uiController.updateCoinsDisplay === 'function') window.uiController.updateCoinsDisplay();
                    this.render();
                } else {
                    this._notifyCardError((res && res.reason) || 'Cannot unlock perk yet!', btn);
                }
            });
        });

        this.vaultSection.querySelectorAll('.perk-upgrade-btn[data-upgrade]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const perkId = btn.getAttribute('data-upgrade');
                if (!window.GameState || typeof window.GameState.upgradePerk !== 'function') return;

                const res = window.GameState.upgradePerk(perkId);
                if (res && res.success) {
                    if (window.soundEngine && typeof window.soundEngine.playLevelUp === 'function') {
                        window.soundEngine.playLevelUp();
                    } else if (window.soundEngine && typeof window.soundEngine.playPickup === 'function') {
                        window.soundEngine.playPickup('star');
                    }
                    const perk = (typeof PERKS_DATA !== 'undefined') ? PERKS_DATA[perkId] : null;
                    if (window.modalManager && typeof window.modalManager.showQuickToast === 'function' && perk) {
                        window.modalManager.showQuickToast(`⭐ ${perk.name} ascended to Rank ${res.rank}!`);
                    }
                    if (window.uiController && typeof window.uiController.updateCoinsDisplay === 'function') window.uiController.updateCoinsDisplay();
                    this.render();
                } else {
                    this._notifyCardError((res && res.reason) || 'Cannot upgrade perk yet!', btn);
                }
            });
        });

        this.vaultSection.querySelectorAll('.perk-equip-action-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const perkId = btn.getAttribute('data-equip');
                if (window.GameState) {
                    window.GameState.equipPerk(perkId, this.selectedSlot);
                    if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') window.soundEngine.playSelect();
                    const equipped = this.getEquippedPerks();
                    const nextEmpty = equipped.findIndex(p => p === null);
                    if (nextEmpty !== -1) this.selectedSlot = nextEmpty;
                    this.render();
                }
            });
        });

        this.vaultSection.querySelectorAll('.perk-equipped-tag').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const slotIdx = parseInt(btn.getAttribute('data-unequip-slot'), 10);
                if (window.GameState && !isNaN(slotIdx)) {
                    window.GameState.unequipPerk(slotIdx);
                    if (window.soundEngine && typeof window.soundEngine.playGoBack === 'function') window.soundEngine.playGoBack();
                    this.selectedSlot = slotIdx;
                    this.render();
                }
            });
        });
    }
}

if (typeof window !== 'undefined') {
    window.PerkManager = PerkManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PerkManager };
}
