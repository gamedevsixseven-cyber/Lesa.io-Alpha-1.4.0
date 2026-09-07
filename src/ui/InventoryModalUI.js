/**
 * Lesa.io - Player Inventory Modal UI Controller
 * Renders the Boss Crates Vault, interactive unboxing buttons,
 * and live resource tracking in the main menu Inventory tab.
 */

class InventoryModalUI {
    constructor() {
        this.modalEl = null;
        this.contentMountEl = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        this.modalEl = document.getElementById('inventory-modal');
        if (!this.modalEl) return;

        this.contentMountEl = this.modalEl.querySelector('#inventory-content-mount') || this.modalEl.querySelector('.inventory-grid');
        this.initialized = true;

        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.on('inventoryUpdated', () => {
                if (this.isOpen()) this.render();
            });
            window.EventBus.on('currencyChanged', () => {
                if (this.isOpen()) this.render();
            });
        }
    }

    isOpen() {
        return this.modalEl && !this.modalEl.classList.contains('hidden');
    }

    render() {
        this.init();
        if (!this.modalEl) return;

        const mount = document.getElementById('inventory-content-mount');
        if (!mount) return;

        const manager = window.inventoryManager;
        const crates = manager ? manager.getCrates() : {};
        const totalCrates = manager ? manager.getTotalCratesCount() : 0;

        const coins = (window.GameState && window.GameState.player) ? (window.GameState.player.coins || 0) : ((window.uiController && window.uiController.coins) || 0);
        const gems = (window.GameState && window.GameState.player) ? (window.GameState.player.gems || 0) : ((window.uiController && window.uiController.gems) || 0);
        const unlockedGearCount = (typeof GearManager !== 'undefined' && typeof GearManager.getUnlockedList === 'function') 
            ? GearManager.getUnlockedList().length 
            : ((window.GameState && window.GameState.player && window.GameState.player.unlockedGear) ? window.GameState.player.unlockedGear.length : 0);

        // Header and Summary Bar
        let html = `
            <div class="inv-summary-bar">
                <div class="inv-summary-pill inv-crates-pill">
                    <span class="inv-pill-icon">📦</span>
                    <span class="inv-pill-label">UNOPENED CRATES:</span>
                    <span class="inv-pill-val ${totalCrates > 0 ? 'highlight-pulse' : ''}">${totalCrates}</span>
                </div>
                <div class="inv-summary-pill inv-coin-pill">
                    <span class="inv-pill-icon">🪙</span>
                    <span class="inv-pill-label">COINS:</span>
                    <span class="inv-pill-val">${coins.toLocaleString()}</span>
                </div>
                <div class="inv-summary-pill inv-gem-pill">
                    <span class="inv-pill-icon">💎</span>
                    <span class="inv-pill-label">GEMS:</span>
                    <span class="inv-pill-val">${gems.toLocaleString()}</span>
                </div>
            </div>

            <!-- SECTION 1: BOSS CRATES VAULT -->
            <div class="inv-section-header">
                <div class="inv-section-title">
                    <span class="inv-sec-icon">👑</span> BOSS CRATES VAULT
                </div>
                <div class="inv-section-subtitle">
                    Boss crates go straight to your inventory. Open them on demand to claim bounties!
                </div>
            </div>

            <div class="inv-crates-grid">
        `;

        const crateKeys = ['boss_crate_easy', 'boss_crate_normal', 'boss_crate_hard', 'boss_crate_very_hard', 'boss_crate_insane'];
        const rankDefinitions = (typeof BOSS_RANKS !== 'undefined') ? BOSS_RANKS : {};
        const crateDefinitions = (typeof BOSS_CRATES !== 'undefined') ? BOSS_CRATES : {};

        for (const key of crateKeys) {
            const def = crateDefinitions[key];
            if (!def) continue;

            const rankDef = rankDefinitions[def.rank] || {};
            const count = crates[key] || 0;
            const hasCrate = count > 0;
            const borderCol = def.color || '#fed330';

            html += `
                <div class="inv-crate-card ${hasCrate ? 'crate-available' : 'crate-empty'} tier-${def.rank}" style="--crate-color: ${borderCol};">
                    <div class="inv-crate-badge" style="background: ${borderCol};">
                        ${rankDef.badgeText || def.name.toUpperCase()}
                    </div>

                    <div class="inv-crate-img-wrap">
                        <img src="${def.icon}" class="inv-crate-img ${hasCrate ? 'inv-img-bounce' : ''}" alt="${def.name}">
                        ${hasCrate ? `<div class="inv-crate-glow" style="background: ${borderCol};"></div>` : ''}
                    </div>

                    <div class="inv-crate-name">${def.name}</div>
                    <div class="inv-crate-boss-source">${def.bossNote}</div>

                    <div class="inv-crate-footer">
                        <div class="inv-crate-qty ${hasCrate ? 'qty-positive' : 'qty-zero'}">
                            ${hasCrate ? `x${count} IN INVENTORY` : '0 OWNED'}
                        </div>
                        <button class="comic-btn inv-open-btn ${hasCrate ? 'btn-open-active' : 'btn-open-disabled'}" 
                                data-crate-id="${key}" ${hasCrate ? '' : 'disabled'}>
                            <span>${hasCrate ? '✨ OPEN' : 'LOCKED'}</span>
                        </button>
                    </div>
                </div>
            `;
        }

        html += `
            </div>

            <!-- SECTION 2: SPOILS & REPUTATION -->
            <div class="inv-section-header" style="margin-top: 18px;">
                <div class="inv-section-title">
                    <span class="inv-sec-icon">🛡️</span> ARENA ARSENAL & STATS
                </div>
            </div>

            <div class="inv-resources-grid">
                <div class="inv-resource-slot">
                    <div class="res-slot-icon">🛡️</div>
                    <div class="res-slot-info">
                        <div class="res-slot-name">Unlocked Gear</div>
                        <div class="res-slot-desc">${unlockedGearCount} Equipment Cards</div>
                    </div>
                </div>
                <div class="inv-resource-slot">
                    <div class="res-slot-icon">🏆</div>
                    <div class="res-slot-info">
                        <div class="res-slot-name">Boss Conquests</div>
                        <div class="res-slot-desc">Normal (Kleanthis) & Hard (Rouf)</div>
                    </div>
                </div>
                <div class="inv-resource-slot">
                    <div class="res-slot-icon">⚡</div>
                    <div class="res-slot-info">
                        <div class="res-slot-name">Inventory Status</div>
                        <div class="res-slot-desc">No Capacity Limit • Open anytime</div>
                    </div>
                </div>
            </div>
        `;

        mount.innerHTML = html;

        // Bind Open Crate Buttons
        mount.querySelectorAll('.btn-open-active').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const crateId = btn.getAttribute('data-crate-id');
                if (crateId && window.inventoryManager) {
                    window.inventoryManager.openCrate(crateId);
                }
            });
        });
    }
}

if (typeof window !== 'undefined') {
    window.InventoryModalUI = InventoryModalUI;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { InventoryModalUI };
}
