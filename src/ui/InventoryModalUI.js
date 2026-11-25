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
            window.EventBus.on('materialsUpdated', () => {
                if (this.isOpen()) this.render();
            });
            window.EventBus.on('currencyChanged', () => {
                if (this.isOpen()) this.render();
            });
            window.EventBus.on('crestsUpdated', () => {
                if (this.isOpen()) this.render();
            });
            window.EventBus.on('starStonesUpdated', () => {
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
        const storedChests = manager && typeof manager.getStoredChests === 'function' ? manager.getStoredChests() : {};
        const totalStoredChests = manager && typeof manager.getTotalStoredChestsCount === 'function' ? manager.getTotalStoredChestsCount() : 0;
        const materials = manager && typeof manager.getMaterials === 'function' ? manager.getMaterials() : {};
        const totalMaterials = manager && typeof manager.getTotalMaterialsCount === 'function' ? manager.getTotalMaterialsCount() : 0;
        const starStones = (typeof DungeonManager !== 'undefined' && typeof DungeonManager.getOlympianStarStones === 'function')
            ? DungeonManager.getOlympianStarStones()
            : 0;
        const hasEmptySlot = (typeof window !== 'undefined' && window.chestManager && typeof window.chestManager.getFirstEmptySlot === 'function')
            ? (window.chestManager.getFirstEmptySlot() !== -1)
            : false;

        const coins = (window.GameState && window.GameState.player) ? (window.GameState.player.coins || 0) : ((window.uiController && window.uiController.coins) || 0);
        const gems = (window.GameState && window.GameState.player) ? (window.GameState.player.gems || 0) : ((window.uiController && window.uiController.gems) || 0);
        const unlockedGearCount = (typeof GearManager !== 'undefined' && typeof GearManager.getUnlockedList === 'function')
            ? GearManager.getUnlockedList().length
            : ((window.GameState && window.GameState.player && window.GameState.player.unlockedGear) ? window.GameState.player.unlockedGear.length : 0);

        // Header and Summary Bar
        let html = `
            <div class="inv-summary-bar">
                <div class="inv-summary-pill inv-chests-pill">
                    <span class="inv-pill-icon">${typeof UiIcons !== 'undefined' ? UiIcons.i('crate', 'ui-icon-sm') : '📦'}</span>
                    <span class="inv-pill-label">SAVED CHESTS:</span>
                    <span class="inv-pill-val ${totalStoredChests > 0 ? 'highlight-pulse' : ''}">${totalStoredChests}</span>
                </div>
                <div class="inv-summary-pill inv-crates-pill">
                    <span class="inv-pill-icon">${typeof UiIcons !== 'undefined' ? UiIcons.i('crown', 'ui-icon-sm') : '👑'}</span>
                    <span class="inv-pill-label">UNOPENED CRATES:</span>
                    <span class="inv-pill-val ${totalCrates > 0 ? 'highlight-pulse' : ''}">${totalCrates}</span>
                </div>
                <div class="inv-summary-pill inv-materials-pill">
                    <span class="inv-pill-icon">${typeof UiIcons !== 'undefined' ? UiIcons.i('mat_armory_shards', 'ui-icon-sm') : '⚙️'}</span>
                    <span class="inv-pill-label">MATERIALS:</span>
                    <span class="inv-pill-val">${totalMaterials.toLocaleString()}</span>
                </div>
                <div class="inv-summary-pill inv-coin-pill">
                    <span class="inv-pill-icon">${typeof UiIcons !== 'undefined' ? UiIcons.i('coin', 'ui-icon-sm') : '🪙'}</span>
                    <span class="inv-pill-label">COINS:</span>
                    <span class="inv-pill-val">${coins.toLocaleString()}</span>
                </div>
                <div class="inv-summary-pill inv-gem-pill">
                    <span class="inv-pill-icon">${typeof UiIcons !== 'undefined' ? UiIcons.i('gem', 'ui-icon-sm') : '💎'}</span>
                    <span class="inv-pill-label">GEMS:</span>
                    <span class="inv-pill-val">${gems.toLocaleString()}</span>
                </div>
            </div>

            <!-- SECTION 0: OVERFLOW CHESTS VAULT -->
            <div class="inv-section-header">
                <div class="inv-section-title">
                    <span class="inv-sec-icon">${typeof UiIcons !== 'undefined' ? UiIcons.i('crate', 'ui-icon-sm') : '📦'}</span> SAVED CHESTS VAULT
                </div>
                <div class="inv-section-subtitle">
                    Chests earned while all 4 main-menu slots are full are safely stored here so none are ever lost.
                </div>
            </div>
        `;

        const chestOrder = ['apex', 'mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
        const chestDefinitions = (typeof CHEST_TYPES !== 'undefined') ? CHEST_TYPES : {};
        const ownedChestKeys = chestOrder.filter(k => (storedChests[k] || 0) > 0 && chestDefinitions[k]);

        if (ownedChestKeys.length > 0) {
            html += `<div class="inv-crates-grid inv-overflow-grid">`;
            for (const chestType of ownedChestKeys) {
                const def = chestDefinitions[chestType];
                const count = storedChests[chestType] || 0;
                const freeCount = (manager && typeof manager.getFreeStoredChestCount === 'function') ? manager.getFreeStoredChestCount(chestType) : 0;
                const isFreeOpen = freeCount > 0;
                const borderCol = def.color || '#fed330';
                const gemCost = isFreeOpen ? 0 : Math.max(0, def.gemSpeedCost || 0);
                const canAffordGems = isFreeOpen || gems >= gemCost;
                const openLabel = isFreeOpen
                    ? `🎁 OPEN FREE${freeCount > 1 ? ` (${freeCount})` : ''}`
                    : `${typeof UiIcons !== 'undefined' ? UiIcons.i('gem', 'ui-icon-sm') : ''} OPEN (${gemCost})`;

                const paidCount = Math.max(0, count - freeCount);
                const allGemCost = paidCount * gemCost;
                const openAllFreeOnly = (freeCount >= 2 && gems < allGemCost);
                const openAllCount = openAllFreeOnly ? freeCount : count;
                const openAllCost = openAllFreeOnly ? 0 : allGemCost;
                const canOpenAll = openAllCost === 0 || gems >= openAllCost;
                const openAllLabel = openAllCost === 0
                    ? `🎁 OPEN ALL FREE (x${openAllCount})`
                    : `${typeof UiIcons !== 'undefined' ? UiIcons.i('gem', 'ui-icon-sm') : ''} OPEN ALL x${openAllCount} (${openAllCost})`;
                const openAllBtnHtml = count >= 2 ? `<button class="comic-btn inv-open-btn inv-chest-btn ${canOpenAll ? 'btn-open-all-active btn-open-all-chests' : 'btn-open-disabled'}" data-chest-type="${chestType}" data-free-only="${openAllFreeOnly ? '1' : '0'}" ${canOpenAll ? '' : 'disabled'}><span>${openAllLabel}</span></button>` : '';

                html += `
                    <div class="inv-crate-card crate-available tier-${def.rarity}" style="--crate-color: ${borderCol};">
                        <div class="inv-crate-badge" style="background: ${borderCol};">
                            ${(def.rarity || chestType).toUpperCase()} CHEST
                        </div>

                        <div class="inv-crate-img-wrap">
                            <img src="${def.icon}" class="inv-crate-img inv-img-bounce" alt="${def.name}">
                            <div class="inv-crate-glow" style="background: ${borderCol};"></div>
                        </div>

                        <div class="inv-crate-name">${def.name}</div>
                        <div class="inv-crate-boss-source">${def.minCoins.toLocaleString()}-${def.maxCoins.toLocaleString()} Coins • ${def.gearCount} Gear</div>

                        <div class="inv-crate-footer">
                            <div class="inv-crate-qty qty-positive">x${count} IN INVENTORY</div>
                            <div class="inv-chest-actions">
                                <button class="comic-btn inv-open-btn inv-chest-btn ${hasEmptySlot ? 'btn-slot-active btn-move-chest-active' : 'btn-open-disabled'}"
                                        data-chest-type="${chestType}" ${hasEmptySlot ? '' : 'disabled'}>
                                    <span>${hasEmptySlot ? 'CLAIM TO SLOT' : '4/4 SLOTS FULL'}</span>
                                </button>
                                <button class="comic-btn inv-open-btn inv-chest-btn ${canAffordGems ? 'btn-gem-active btn-open-chest-gem' : 'btn-open-disabled'}"
                                        data-chest-type="${chestType}" ${canAffordGems ? '' : 'disabled'}>
                                    <span>${openLabel}</span>
                                </button>
                                ${openAllBtnHtml}
                            </div>
                        </div>
                    </div>
                `;
            }
            html += `</div>`;
        } else {
            html += `
                <div class="inv-empty-chests-banner">
                    <span class="inv-empty-icon">${typeof UiIcons !== 'undefined' ? UiIcons.i('crate', 'ui-icon-sm') : '📦'}</span>
                    <span>No overflow chests stored right now. Fill all 4 slots and any extra chest earned goes straight here!</span>
                </div>
            `;
        }

        html += `
            <!-- SECTION 1: BOSS CRATES VAULT -->
            <div class="inv-section-header" style="margin-top: 16px;">
                <div class="inv-section-title">
                    <span class="inv-sec-icon">${typeof UiIcons !== 'undefined' ? UiIcons.i('crown', 'ui-icon-sm') : '👑'}</span> BOSS CRATES VAULT
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
                        ${typeof UiIcons !== 'undefined' ? UiIcons.toHtml(rankDef.badgeText || def.name.toUpperCase(), 'ui-icon-sm') : (rankDef.badgeText || def.name.toUpperCase())}
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
                            <span>${hasCrate ? (typeof UiIcons !== 'undefined' ? `${UiIcons.i('sparkle', 'ui-icon-sm')} OPEN` : '✨ OPEN') : 'LOCKED'}</span>
                        </button>
                        ${count >= 2 ? `<button class="comic-btn inv-open-btn inv-chest-btn btn-open-all-active btn-open-all-crates" data-crate-id="${key}"><span>⚡ OPEN ALL (x${count})</span></button>` : ''}
                    </div>
                </div>
            `;
        }

        html += `
            </div>

            ${this._renderMaterialsSection(materials, starStones)}

            <!-- SECTION 3: SPOILS & REPUTATION -->
            <div class="inv-section-header" style="margin-top: 18px;">
                <div class="inv-section-title">
                    <span class="inv-sec-icon">${typeof UiIcons !== 'undefined' ? UiIcons.i('shield', 'ui-icon-sm') : '🛡️'}</span> ARENA ARSENAL & STATS
                </div>
            </div>

            <div class="inv-resources-grid">
                <div class="inv-resource-slot">
                    <div class="res-slot-icon">${typeof UiIcons !== 'undefined' ? UiIcons.i('shield') : '🛡️'}</div>
                    <div class="res-slot-info">
                        <div class="res-slot-name">Unlocked Gear</div>
                        <div class="res-slot-desc">${unlockedGearCount} Equipment Cards</div>
                    </div>
                </div>
                <div class="inv-resource-slot">
                    <div class="res-slot-icon">${typeof UiIcons !== 'undefined' ? UiIcons.i('trophy') : '🏆'}</div>
                    <div class="res-slot-info">
                        <div class="res-slot-name">Boss Conquests</div>
                        <div class="res-slot-desc">Normal (Kleanthis) & Hard (Rouf)</div>
                    </div>
                </div>
                <div class="inv-resource-slot">
                    <div class="res-slot-icon">${typeof UiIcons !== 'undefined' ? UiIcons.i('crest') : '🏛️'}</div>
                    <div class="res-slot-info">
                        <div class="res-slot-name">Ascent Crests: ${(typeof window !== 'undefined' && window.ascentCrestManager) ? `${window.ascentCrestManager.getCount()}/${window.ascentCrestManager.getCap()}` : '0/3'}</div>
                        <div class="res-slot-desc">+2 Daily (Max 3) • +1 Story Boss Rouf</div>
                    </div>
                </div>
                <div class="inv-resource-slot">
                    <div class="res-slot-icon">${typeof UiIcons !== 'undefined' ? UiIcons.i('bolt') : '⚡'}</div>
                    <div class="res-slot-info">
                        <div class="res-slot-name">Inventory Status</div>
                        <div class="res-slot-desc">No Capacity Limit • Open anytime</div>
                    </div>
                </div>
            </div>
        `;

        mount.innerHTML = html;

        // Bind Move-To-Slot & Instant Gem Open buttons for overflow chests
        mount.querySelectorAll('.btn-move-chest-active').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const chestType = btn.getAttribute('data-chest-type');
                if (chestType && window.inventoryManager && typeof window.inventoryManager.moveStoredChestToSlot === 'function') {
                    window.inventoryManager.moveStoredChestToSlot(chestType);
                }
            });
        });

        mount.querySelectorAll('.btn-open-chest-gem').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const chestType = btn.getAttribute('data-chest-type');
                if (chestType && window.inventoryManager && typeof window.inventoryManager.openStoredChestWithGems === 'function') {
                    window.inventoryManager.openStoredChestWithGems(chestType);
                }
            });
        });

        mount.querySelectorAll('.btn-open-all-chests').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const chestType = btn.getAttribute('data-chest-type');
                const freeOnly = btn.getAttribute('data-free-only') === '1';
                if (chestType && window.inventoryManager && typeof window.inventoryManager.openAllStoredChests === 'function') {
                    window.inventoryManager.openAllStoredChests(chestType, { freeOnly });
                }
            });
        });

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

        mount.querySelectorAll('.btn-open-all-crates').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const crateId = btn.getAttribute('data-crate-id');
                if (crateId && window.inventoryManager && typeof window.inventoryManager.openAllCrates === 'function') {
                    window.inventoryManager.openAllCrates(crateId);
                }
            });
        });

        const craftEvoBtn = mount.querySelector('#inv-craft-evo-stone-btn');
        if (craftEvoBtn) {
            craftEvoBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof GearUpgradeManager === 'undefined') return;
                const res = GearUpgradeManager.craftEvolutionStone();
                if (!res.success && window.soundEngine && typeof window.soundEngine.playBuzzer === 'function') {
                    window.soundEngine.playBuzzer();
                }
                if (typeof ModalManager !== 'undefined' && typeof ModalManager.notifyInsufficient === 'function' && !res.success && res.reason) {
                    ModalManager.notifyInsufficient(res.reason, craftEvoBtn.closest('.inv-mat-card'));
                }
            });
        }
    }

    _renderMaterialsSection(materials, starStones) {
        const list = (typeof MaterialRegistry !== 'undefined') ? MaterialRegistry.getAll() : [];
        let cardsHtml = list.map((mat) => {
            const count = Math.max(0, Math.floor((materials && materials[mat.id]) || 0));
            const hasMat = count > 0;
            const iconHtml = mat.iconImg
                ? `<img src="${mat.iconImg}" class="inv-mat-img ${hasMat ? 'inv-img-bounce' : ''}" alt="${mat.name}">`
                : `<span class="inv-mat-emoji">${mat.icon}</span>`;
            const sourcesHtml = Array.isArray(mat.sources)
                ? mat.sources.slice(0, 3).map((s) => `<span class="inv-mat-src-chip">${s}</span>`).join('')
                : '';

            return `
                <div class="inv-mat-card ${hasMat ? 'mat-owned' : 'mat-empty'}" style="--mat-color: ${mat.color};">
                    <div class="inv-mat-top">
                        <span class="inv-mat-badge" style="background: ${mat.badgeBg || mat.color};">${mat.rarityLabel}</span>
                        <span class="inv-mat-qty ${hasMat ? 'qty-positive' : 'qty-zero'}">x${count.toLocaleString()}</span>
                    </div>
                    <div class="inv-mat-icon-wrap">
                        ${iconHtml}
                        ${hasMat ? `<div class="inv-mat-glow" style="background: ${mat.color};"></div>` : ''}
                    </div>
                    <div class="inv-mat-name">${mat.name}</div>
                    <div class="inv-mat-desc">${mat.desc}</div>
                    <div class="inv-mat-used"><strong>Used For:</strong> ${mat.usedFor}</div>
                    <div class="inv-mat-sources">${sourcesHtml}</div>
                </div>
            `;
        }).join('');

        // Also include Evolution Stone forge card + ultra-rare Olympian Star-Stone relic card
        const starOwned = starStones > 0;
        const evoStones = (typeof GearUpgradeManager !== 'undefined' && typeof GearUpgradeManager.getEvolutionStones === 'function')
            ? GearUpgradeManager.getEvolutionStones()
            : 0;
        cardsHtml += this._renderEvolutionStoneCard(evoStones, materials);
        const starIcon = (typeof UiIcons !== 'undefined') ? UiIcons.i('olympian_star_stone', 'inv-mat-img') : '🌟';
        cardsHtml += `
            <div class="inv-mat-card inv-mat-relic ${starOwned ? 'mat-owned' : 'mat-empty'}" style="--mat-color: #ff4757;">
                <div class="inv-mat-top">
                    <span class="inv-mat-badge" style="background: linear-gradient(135deg, #e11d48, #f59e0b);">α1.6 MYTHIC RELIC</span>
                    <span class="inv-mat-qty ${starOwned ? 'qty-positive' : 'qty-zero'}">x${starStones.toLocaleString()}</span>
                </div>
                <div class="inv-mat-icon-wrap" style="border-color: #ff4757;">
                    ${starIcon}
                    ${starOwned ? `<div class="inv-mat-glow" style="background: #ff4757;"></div>` : ''}
                </div>
                <div class="inv-mat-name">Olympian Star-Stone</div>
                <div class="inv-mat-desc">Ultra-rare celestial summit crystal radiating pure Olympian thunder energy.</div>
                <div class="inv-mat-used"><strong>Used For:</strong> Hero Star-Blessing &amp; Legendary → Mythic Ascension</div>
                <div class="inv-mat-sources">
                    <span class="inv-mat-src-chip">Zeus Summit (0.8%)</span>
                    <span class="inv-mat-src-chip">W40 Boss (1.5%)</span>
                </div>
            </div>
        `;

        return `
            <div class="inv-section-header" style="margin-top: 18px;">
                <div class="inv-section-title">
                    <span class="inv-sec-icon">${typeof UiIcons !== 'undefined' ? UiIcons.i('mat_armory_shards', 'ui-icon-sm') : '⚒️'}</span> CRAFTING MATERIALS &amp; EVOLUTION FORGE
                </div>
                <div class="inv-section-subtitle">
                    Collect materials from duplicate gear, quests, bosses, chests &amp; Mount Olympus to upgrade gear and craft Evolution Stones.
                </div>
            </div>
            <div class="inv-materials-grid">
                ${cardsHtml}
            </div>
        `;
    }

    _renderEvolutionStoneCard(evoStones, materials) {
        const owned = evoStones > 0;
        const recipe = (typeof GearUpgradeManager !== 'undefined') ? GearUpgradeManager.STONE_CRAFT_RECIPE : {
            coins: 25000,
            materials: { armory_shards: 120, mati_crystal: 25, olympian_bronze: 18, ambrosia_spark: 3 }
        };
        const playerCoins = (typeof window !== 'undefined' && window.GameState && window.GameState.player) ? (window.GameState.player.coins || 0) : 0;
        const canCraft = (typeof GearUpgradeManager !== 'undefined') ? GearUpgradeManager.canCraftEvolutionStone() : false;
        const evoIcon = (typeof UiIcons !== 'undefined') ? UiIcons.i('evolution_stone', 'inv-mat-img') : '💎';
        const coinIcon = (typeof UiIcons !== 'undefined') ? UiIcons.i('coin', 'ui-icon-sm') : '🪙';

        const matChips = Object.entries(recipe.materials || {}).map(([matId, need]) => {
            const def = (typeof MaterialRegistry !== 'undefined') ? MaterialRegistry.get(matId) : null;
            const have = (materials && materials[matId]) ? materials[matId] : 0;
            const short = have < need;
            const ic = def && def.iconKey && typeof UiIcons !== 'undefined' ? UiIcons.i(def.iconKey, 'ui-icon-sm') : (def ? def.icon : matId);
            return `<span class="inv-craft-chip ${short ? 'is-short' : ''}" title="${def ? def.name : matId}: ${have}/${need}">${ic} ${need}</span>`;
        }).join('');
        const coinShort = playerCoins < (recipe.coins || 0);

        return `
            <div class="inv-mat-card inv-mat-evo ${owned ? 'mat-owned' : 'mat-empty'}" style="--mat-color: #f59e0b;">
                <div class="inv-mat-top">
                    <span class="inv-mat-badge" style="background: linear-gradient(135deg, #e11d48, #f59e0b);">EVOLUTION</span>
                    <span class="inv-mat-qty ${owned ? 'qty-positive' : 'qty-zero'}">x${evoStones.toLocaleString()}</span>
                </div>
                <div class="inv-mat-icon-wrap" style="border-color: #e11d48;">
                    ${evoIcon}
                    ${owned ? `<div class="inv-mat-glow" style="background: #f59e0b;"></div>` : ''}
                </div>
                <div class="inv-mat-name">Evolution Stone</div>
                <div class="inv-mat-desc">Awakens maxed Lv.4 Mythic gear &amp; Mythic weapons into Evolved ★ tier with amplified power.</div>
                <div class="inv-craft-recipe">
                    ${matChips}
                    <span class="inv-craft-chip ${coinShort ? 'is-short' : ''}">${coinIcon} ${(recipe.coins || 0).toLocaleString()}</span>
                </div>
                <div class="inv-mat-sources" style="margin-bottom: 8px;">
                    <span class="inv-mat-src-chip">Forge Craft</span>
                    <span class="inv-mat-src-chip">Zeus Summit (8%)</span>
                </div>
                <button type="button" id="inv-craft-evo-stone-btn" class="inv-craft-evo-btn" ${canCraft ? '' : 'title="Need more Coins or Materials"'}>
                    CRAFT EVOLUTION STONE
                </button>
            </div>
        `;
    }
}

if (typeof window !== 'undefined') {
    window.InventoryModalUI = InventoryModalUI;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { InventoryModalUI };
}
