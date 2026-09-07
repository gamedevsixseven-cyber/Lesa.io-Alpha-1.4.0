/**
 * Lesa.io - Battle Perks Loadout & Vault UI Manager
 * Handles Call of Duty style 3-slot loadout equipping, un-equipping, and Perk Vault coin unlocking.
 * Features advanced live keyword search, category filter chips, and exclusive tag badges & auto-swapping.
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
        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.on('perkUnlocked', () => this.render());
            window.EventBus.on('perkEquipped', (data) => {
                if (data && data.swappedOldPerk) {
                    const msg = `Swapped ${data.swappedOldPerk.name}! (Max 1 Dash Perk)`;
                    if (window.modalManager && typeof window.modalManager.showQuickToast === 'function') {
                        window.modalManager.showQuickToast(msg);
                    }
                }
                this.render();
            });
            window.EventBus.on('perkUnequipped', () => this.render());
            window.EventBus.on('currencyChanged', () => this.render());
        }

        // Live Search Input Listener
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => {
                this.searchQuery = (this.searchInput.value || '').trim().toLowerCase();
                if (this.clearSearchBtn) {
                    if (this.searchQuery.length > 0) {
                        this.clearSearchBtn.classList.remove('hidden');
                    } else {
                        this.clearSearchBtn.classList.add('hidden');
                    }
                }
                this.renderVaultGrid();
            });
        }

        // Clear Search Button
        if (this.clearSearchBtn) {
            this.clearSearchBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.searchInput) {
                    this.searchInput.value = '';
                }
                this.searchQuery = '';
                this.clearSearchBtn.classList.add('hidden');
                this.renderVaultGrid();
            });
        }

        // Filter Chips Listener
        if (this.filterChips && this.filterChips.length > 0) {
            this.filterChips.forEach((chip) => {
                chip.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const category = chip.getAttribute('data-filter') || 'ALL';
                    this.filterCategory = category;

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

    /**
     * Get player's equipped perks sanitized as a 3-element array
     */
    getEquippedPerks() {
        const p = (window.GameState && window.GameState.player) || {};
        let eq = p.equippedPerks;
        if (!Array.isArray(eq)) eq = [null, null, null];
        while (eq.length < 3) eq.push(null);
        return eq.slice(0, 3);
    }

    /**
     * Get player's unlocked perks array
     */
    getUnlockedPerks() {
        const p = (window.GameState && window.GameState.player) || {};
        return Array.isArray(p.unlockedPerks) ? p.unlockedPerks : [];
    }

    /**
     * Master render routine for `#talents-modal`
     */
    render() {
        if (!this.slotsContainer || !this.vaultSection) return;

        const equipped = this.getEquippedPerks();

        // Auto-select first empty slot if current selectedSlot is already occupied
        if (equipped[this.selectedSlot] !== null) {
            const firstEmpty = equipped.findIndex(p => p === null);
            if (firstEmpty !== -1) {
                this.selectedSlot = firstEmpty;
            }
        }

        // --- 1. RENDER 3 LOADOUT SLOTS ---
        this.slotsContainer.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const perkId = equipped[i];
            const perk = perkId ? PERKS_DATA[perkId] : null;
            const isSelected = (this.selectedSlot === i);

            const card = document.createElement('div');
            card.className = `perk-slot-card perk-slot-${i + 1} ${isSelected ? 'active-slot-focus' : ''} ${perk ? 'filled-slot' : 'empty-slot'}`;
            card.style.cursor = 'pointer';

            if (perk) {
                card.innerHTML = `
                    <div class="perk-slot-badge" style="background:${perk.color};">SLOT ${i + 1} • ${perk.badge}</div>
                    <div class="perk-icon-frame" style="border-color:${perk.color}; background:${perk.color}22;">
                        <span class="perk-active-icon">${perk.icon}</span>
                    </div>
                    <h3 class="perk-slot-title" style="color:${perk.color};">${perk.name.toUpperCase()}</h3>
                    <button class="perk-slot-unequip-btn" data-slot="${i}" title="Unequip perk">UNEQUIP ✕</button>
                `;

                // Unequip button click
                const unequipBtn = card.querySelector('.perk-slot-unequip-btn');
                if (unequipBtn) {
                    unequipBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (window.soundEngine && typeof window.soundEngine.playGoBack === 'function') {
                            window.soundEngine.playGoBack();
                        }
                        if (window.GameState) {
                            window.GameState.unequipPerk(i);
                        }
                        this.selectedSlot = i;
                        this.render();
                    });
                }
            } else {
                card.innerHTML = `
                    <div class="perk-slot-badge">SLOT ${i + 1}</div>
                    <div class="perk-empty-frame">
                        <span class="perk-empty-icon">➕</span>
                    </div>
                    <h3 class="perk-slot-title">SLOT ${i + 1}</h3>
                    <span class="perk-slot-status">${isSelected ? 'SELECTING...' : 'EMPTY'}</span>
                `;
            }

            // Clicking slot card selects it as the active destination
            card.addEventListener('click', () => {
                this.selectedSlot = i;
                if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
                    window.soundEngine.playSelect();
                }
                this.render();
            });

            this.slotsContainer.appendChild(card);
        }

        // --- 2. RENDER PERK VAULT GRID ---
        this.renderVaultGrid();
    }

    /**
     * Render Perk Vault Grid with active search & category filtering
     */
    renderVaultGrid() {
        if (!this.vaultSection || typeof PERKS_DATA === 'undefined') return;

        const equipped = this.getEquippedPerks();
        const unlocked = this.getUnlockedPerks();
        const playerCoins = (window.GameState && window.GameState.player && window.GameState.player.coins) || 0;
        const exclusiveTags = (typeof EXCLUSIVE_PERK_TAGS !== 'undefined') ? EXCLUSIVE_PERK_TAGS : ['dash'];

        const totalPerks = Object.keys(PERKS_DATA).length;
        const unlockedCount = unlocked.length;
        const playerLevel = (window.GameState && window.GameState.player && window.GameState.player.accountLevel) || 1;

        let vaultHtml = `
            <div class="perks-vault-header">
                <span>📦 PERK VAULT (${unlockedCount}/${totalPerks} UNLOCKED)</span>
                <span class="perks-vault-wallet">🪙 ${playerCoins.toLocaleString()} COINS</span>
            </div>
            <div class="perks-vault-grid">
        `;

        let matchCount = 0;

        for (const [id, perk] of Object.entries(PERKS_DATA)) {
            // Category Filter Check
            if (this.filterCategory !== 'ALL' && perk.badge !== this.filterCategory) {
                continue;
            }

            // Search Query Filter Check (matches name, description, badge, tagLabel)
            if (this.searchQuery) {
                const targetText = `${perk.name} ${perk.desc} ${perk.badge} ${perk.tagLabel || ''} ${perk.tag || ''}`.toLowerCase();
                if (!targetText.includes(this.searchQuery)) {
                    continue;
                }
            }

            matchCount++;
            const isUnlocked = unlocked.includes(id);
            const isLevelLocked = !isUnlocked && perk.unlockLevel && (playerLevel < perk.unlockLevel);
            const equippedSlot = equipped.indexOf(id);
            const isEquipped = (equippedSlot !== -1);
            const canAfford = playerCoins >= perk.cost;
            const isExclusive = exclusiveTags.includes(perk.tag);

            vaultHtml += `
                <div class="perk-vault-item ${isUnlocked ? 'unlocked' : 'locked'} ${isEquipped ? 'is-equipped' : ''}" data-perk="${id}" style="--perk-color:${perk.color};">
                    <div class="perk-vault-icon-col">
                        <div class="perk-vault-icon" style="background:${perk.color}22; border-color:${perk.color};">
                            <span>${perk.icon}</span>
                        </div>
                    </div>
                    <div class="perk-vault-info-col">
                        <div class="perk-vault-title-row">
                            <h4 class="perk-vault-name">${perk.name}</h4>
                            <span class="perk-vault-category" style="background:${perk.color};">${perk.badge}</span>
                            <span class="perk-vault-tag ${isExclusive ? 'tag-exclusive' : ''}">${perk.tagLabel || perk.tag}</span>
                            ${perk.unlockLevel ? `<span class="perk-vault-tag ${isLevelLocked ? 'tag-exclusive' : 'tag-starter'}">${isLevelLocked ? `🔒 LVL ${perk.unlockLevel}` : `LVL ${perk.unlockLevel} REWARD`}</span>` : ''}
                        </div>
                        <p class="perk-vault-desc">${perk.desc}</p>
                    </div>
                    <div class="perk-vault-action-col">
            `;

            if (!isUnlocked) {
                if (isLevelLocked) {
                    vaultHtml += `
                        <button class="comic-btn perk-buy-btn cannot-buy" disabled title="Reach Account Level ${perk.unlockLevel} to unlock this perk for free!">
                            🔒 LVL ${perk.unlockLevel}
                        </button>
                    `;
                } else {
                    vaultHtml += `
                        <button class="comic-btn perk-buy-btn ${canAfford ? 'can-buy' : 'cannot-buy'}" data-buy="${id}">
                            ${perk.cost === 0 ? 'CLAIM FREE' : `🪙 ${perk.cost.toLocaleString()}`}
                        </button>
                    `;
                }
            } else if (isEquipped) {
                vaultHtml += `
                    <button class="comic-btn perk-equipped-tag" data-unequip-slot="${equippedSlot}">
                        SLOT ${equippedSlot + 1} ✕
                    </button>
                `;
            } else {
                vaultHtml += `
                    <button class="comic-btn perk-equip-action-btn" data-equip="${id}">
                        EQUIP [S${this.selectedSlot + 1}]
                    </button>
                `;
            }

            vaultHtml += `
                    </div>
                </div>
            `;
        }

        // Empty Search Results State
        if (matchCount === 0) {
            vaultHtml += `
                <div class="perks-vault-empty-search">
                    <span class="perks-vault-empty-search-icon">🔍</span>
                    <div>No battle perks found matching <strong>"${this.searchQuery || this.filterCategory}"</strong>.</div>
                </div>
            `;
        }

        vaultHtml += `</div>`;
        this.vaultSection.innerHTML = vaultHtml;

        // Bind Vault Action Buttons
        this.bindVaultEvents();
    }

    bindVaultEvents() {
        // Buy / Claim Buttons
        this.vaultSection.querySelectorAll('.perk-buy-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const perkId = btn.getAttribute('data-buy');
                const perk = PERKS_DATA[perkId];
                if (!perk) return;

                const playerCoins = (window.GameState && window.GameState.player && window.GameState.player.coins) || 0;
                if (perk.cost > 0 && playerCoins < perk.cost) {
                    if (window.soundEngine && typeof window.soundEngine.playBuzzer === 'function') {
                        window.soundEngine.playBuzzer();
                    }
                    return;
                }

                if (window.GameState) {
                    const success = window.GameState.unlockPerk(perkId, perk.cost);
                    if (success) {
                        if (window.soundEngine && typeof window.soundEngine.playPickup === 'function') {
                            window.soundEngine.playPickup('star');
                        }
                        // Auto-equip into current selected slot if empty
                        const equipped = this.getEquippedPerks();
                        if (equipped[this.selectedSlot] === null) {
                            window.GameState.equipPerk(perkId, this.selectedSlot);
                        }
                        // Sync UI header coins if available
                        if (window.uiController && typeof window.uiController.updateCoinsDisplay === 'function') {
                            window.uiController.updateCoinsDisplay();
                        }
                        this.render();
                    }
                }
            });
        });

        // Equip Buttons
        this.vaultSection.querySelectorAll('.perk-equip-action-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const perkId = btn.getAttribute('data-equip');
                if (window.GameState) {
                    window.GameState.equipPerk(perkId, this.selectedSlot);
                    if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
                        window.soundEngine.playSelect();
                    }
                    // Auto-advance to next empty slot
                    const equipped = this.getEquippedPerks();
                    const nextEmpty = equipped.findIndex(p => p === null);
                    if (nextEmpty !== -1) {
                        this.selectedSlot = nextEmpty;
                    }
                    this.render();
                }
            });
        });

        // Unequip from Vault
        this.vaultSection.querySelectorAll('.perk-equipped-tag').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const slotIdx = parseInt(btn.getAttribute('data-unequip-slot'), 10);
                if (window.GameState && !isNaN(slotIdx)) {
                    window.GameState.unequipPerk(slotIdx);
                    if (window.soundEngine && typeof window.soundEngine.playGoBack === 'function') {
                        window.soundEngine.playGoBack();
                    }
                    this.selectedSlot = slotIdx;
                    this.render();
                }
            });
        });
    }
}

// Global Singleton Instance
if (typeof window !== 'undefined') {
    window.PerkManager = PerkManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PerkManager };
}
