/**
 * Lesa.io - Batch Chest / Crate Loot Aggregation & Summary Modal UI
 * Displays consolidated coins, gems, newly unlocked weapons, stacked gear,
 * duplicate shard salvage, and materials when opening multiple chests of a rarity.
 */

class BatchChestModalUI {
    static createAccumulator(count = 1) {
        return {
            openedCount: Math.max(1, Number(count) || 1),
            coins: 0,
            gems: 0,
            gear: [],
            weapons: [],
            materials: {},
            duplicateShards: 0
        };
    }

    static mergeLoot(acc, loot) {
        if (!acc || !loot) return acc;
        acc.coins += Math.max(0, Math.floor(Number(loot.coins) || 0));
        acc.gems += Math.max(0, Math.floor(Number(loot.gems) || 0));
        acc.duplicateShards += Math.max(0, Math.floor(Number(loot.duplicateShards) || 0));
        if (Array.isArray(loot.gear)) {
            for (const g of loot.gear) acc.gear.push(g);
        }
        if (loot.weapon && !acc.weapons.some(w => w.id === loot.weapon.id)) {
            acc.weapons.push(loot.weapon);
        }
        if (loot.materials && typeof loot.materials === 'object') {
            for (const [k, v] of Object.entries(loot.materials)) {
                const qty = Math.max(0, Math.floor(Number(v) || 0));
                if (qty > 0) acc.materials[k] = (acc.materials[k] || 0) + qty;
            }
        }
        return acc;
    }

    static _consolidateGear(gearList) {
        const rarityRank = { apex: 6, mythic: 5, legendary: 4, epic: 3, rare: 2, uncommon: 1, common: 0 };
        const map = new Map();
        for (const item of (gearList || [])) {
            if (!item || !item.id) continue;
            const prev = map.get(item.id);
            if (!prev) {
                map.set(item.id, { item, count: 1, hasNewUnlock: !item.isDuplicate, totalShards: item.shardBonus || 0 });
            } else {
                prev.count++;
                if (!item.isDuplicate) prev.hasNewUnlock = true;
                prev.totalShards += (item.shardBonus || 0);
            }
        }
        return Array.from(map.values()).sort((a, b) => {
            if (a.hasNewUnlock !== b.hasNewUnlock) return a.hasNewUnlock ? -1 : 1;
            const ra = rarityRank[String(a.item.rarity || 'common').toLowerCase()] || 0;
            const rb = rarityRank[String(b.item.rarity || 'common').toLowerCase()] || 0;
            if (ra !== rb) return rb - ra;
            return b.count - a.count;
        });
    }

    static openAllStoredChests(inv, chestType, options = {}) {
        if (!inv) return null;
        const totalOwned = inv.getStoredChestCount(chestType);
        const def = (typeof CHEST_TYPES !== 'undefined' && chestType) ? CHEST_TYPES[chestType] : null;
        if (totalOwned <= 0 || !def || !window.chestManager) return null;

        const freeOwned = inv.getFreeStoredChestCount(chestType);
        const openCount = (options.freeOnly && freeOwned > 0) ? freeOwned : totalOwned;
        const freeUsed = Math.min(openCount, freeOwned);
        const paidCount = Math.max(0, openCount - freeUsed);
        const totalGemCost = paidCount * Math.max(0, def.gemSpeedCost || 0);
        const playerGems = (window.GameState && window.GameState.player) ? (window.GameState.player.gems || 0) : 0;

        if (totalGemCost > 0) {
            if (playerGems < totalGemCost || !window.GameState || typeof window.GameState.addCurrency !== 'function') {
                if (window.soundEngine && typeof window.soundEngine.playGoBack === 'function') window.soundEngine.playGoBack();
                if (window.uiController && typeof window.uiController.addKillfeed === 'function') window.uiController.addKillfeed('Not enough gems!');
                return null;
            }
            window.GameState.addCurrency(0, -totalGemCost);
        }

        inv.chests[chestType] = Math.max(0, totalOwned - openCount);
        if (freeUsed > 0) inv.freeChests[chestType] = Math.max(0, (inv.freeChests[chestType] || 0) - freeUsed);
        inv.save();

        const acc = this.createAccumulator(openCount);
        for (let i = 0; i < openCount; i++) {
            this.mergeLoot(acc, window.chestManager.rollAndGrantLootForDef(def, false));
        }

        if (openCount === 1 && typeof ChestModalUI !== 'undefined') ChestModalUI.showLoot(def, { ...acc, weapon: acc.weapons[0] || null });
        else this.showBatchLoot(def, acc);

        inv._notifyInventoryUpdated({ chestType, batchSummary: acc, gemCost: totalGemCost });
        if (window.SaveManager && typeof window.SaveManager.saveNow === 'function') window.SaveManager.saveNow();
        return acc;
    }

    static openAllCrates(inv, crateId) {
        if (!inv) return null;
        const count = inv.crates[crateId] || 0;
        const def = (typeof BOSS_CRATES !== 'undefined' && crateId) ? BOSS_CRATES[crateId] : null;
        if (count <= 0 || !def) return null;
        if (count === 1) return inv.openCrate(crateId);

        inv.crates[crateId] = 0;
        inv.save();

        const acc = this.createAccumulator(count);
        for (let i = 0; i < count; i++) {
            this.mergeLoot(acc, inv._rollSingleCrateLoot(def, crateId, true));
        }

        this.showBatchLoot(def, acc);
        inv._notifyInventoryUpdated({ crateId, batchSummary: acc });
        if (window.SaveManager && typeof window.SaveManager.saveNow === 'function') window.SaveManager.saveNow();
        return acc;
    }

    static showBatchLoot(def, summary) {
        if (typeof ChestModalUI === 'undefined' || !def || !summary) return;
        const modal = ChestModalUI.getOrCreateModal();
        const titleEl = modal.querySelector('#chest-modal-title');
        const bodyEl = modal.querySelector('#chest-modal-body');

        const n = Math.max(1, summary.openedCount || 1);
        const heading = `🎉 OPENED ${n}× ${(def.name || 'CHEST').toUpperCase()}! 🎉`;
        if (typeof UiIcons !== 'undefined') UiIcons.setRichText(titleEl, heading, 'ui-icon-title');
        else titleEl.textContent = heading;
        titleEl.style.color = def.color || '#fed330';

        if (ChestModalUI.sequenceKeyHandler) {
            window.removeEventListener('keydown', ChestModalUI.sequenceKeyHandler);
        }
        ChestModalUI.sequence = { def, loot: summary, items: [], currentIndex: 0, isComplete: true };
        ChestModalUI.sequenceKeyHandler = (e) => {
            if ((e.code === 'Space' || e.code === 'Enter') && ChestModalUI.sequence) {
                e.preventDefault();
                ChestModalUI.hide();
            }
        };
        window.addEventListener('keydown', ChestModalUI.sequenceKeyHandler);

        const hasCelestialWeapon = (summary.weapons || []).some(w => (w.rarityKey || w.rarity || '').toLowerCase() === 'celestial');
        if (hasCelestialWeapon && typeof CelestialRevealFX !== 'undefined') {
            CelestialRevealFX.playCelestialFanfare();
        } else if (window.soundEngine && typeof window.soundEngine.playLevelUp === 'function') {
            window.soundEngine.playLevelUp();
        }

        const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

        const weaponsHtml = (summary.weapons || []).map((w) => {
            const rk = w.rarityKey || (w.rarity || 'rare').toLowerCase();
            const img = w.image ? `<img src="${esc(w.image)}" class="loot-card-icon" alt="${esc(w.name)}">` : `<span style="font-size:2rem;">${w.icon || '🔫'}</span>`;
            return `<div class="loot-card-item tier-${esc(rk)}"><span class="batch-loot-new-pill">NEW ${(w.rarity || 'GUN').toUpperCase()}!</span>${img}<div class="loot-card-name" title="${esc(w.name)}">${esc(w.name)}</div></div>`;
        }).join('');

        const gearEntries = this._consolidateGear(summary.gear);
        const gearHtml = gearEntries.map((entry, idx) => {
            const item = entry.item;
            const rClass = item.rarity || 'common';
            const icon = item.iconImg ? `<img src="${esc(item.iconImg)}" class="loot-card-icon" alt="${esc(item.name)}">` : `<span style="font-size:2rem;">${item.icon || '🛡️'}</span>`;
            const topTag = entry.hasNewUnlock
                ? `<span class="batch-loot-new-pill">NEW ${rClass.toUpperCase()}</span>`
                : `<span style="font-size:0.6rem;font-weight:900;text-transform:uppercase;color:#747d8c;">${esc(rClass)}</span>`;
            const qtyTag = entry.count > 1 ? `<span class="batch-loot-qty-pill">×${entry.count}</span>` : '';
            const shardTag = entry.totalShards > 0 ? `<div class="cr-dup-shard-mini">+${entry.totalShards.toLocaleString()} SHARDS</div>` : '';
            return `<div class="loot-card-item tier-${esc(rClass)}" style="animation-delay:${Math.min(idx, 12) * 0.04}s;">${qtyTag}${topTag}${icon}<div class="loot-card-name" title="${esc(item.name)}">${esc(item.name)}</div>${shardTag}</div>`;
        }).join('');

        const order = (typeof MATERIAL_ORDER !== 'undefined') ? MATERIAL_ORDER : Object.keys(summary.materials || {});
        const matEntries = order.map((id) => [id, (summary.materials || {})[id] || 0]).filter(([, q]) => q > 0);
        const matsHtml = matEntries.map(([matId, qty], idx) => {
            const m = (typeof MaterialRegistry !== 'undefined') ? MaterialRegistry.get(matId) : null;
            if (!m) return '';
            const mIcon = m.iconImg ? `<img src="${esc(m.iconImg)}" class="loot-card-icon" alt="${esc(m.name)}">` : `<span style="font-size:1.8rem;">${m.icon || '⚙️'}</span>`;
            return `<div class="loot-card-item" style="border-color:${m.color};animation-delay:${Math.min(idx, 8) * 0.04}s;"><span style="font-size:0.65rem;font-weight:900;color:${m.color};">+${qty.toLocaleString()}</span>${mIcon}<div class="loot-card-name" title="${esc(m.name)}">${esc(m.shortName || m.name)}</div></div>`;
        }).join('');

        bodyEl.innerHTML = `
            <img src="${esc(def.icon)}" class="chest-modal-preview" style="width:76px;height:70px;" alt="${esc(def.name)}">
            <div style="display:flex;justify-content:center;gap:20px;margin:8px 0;flex-wrap:wrap;">
                <div style="display:flex;align-items:center;gap:6px;font-size:1.3rem;font-family:'Luckiest Guy',sans-serif;color:#fed330;text-shadow:2px 2px 0 #000;">
                    <span>${typeof UiIcons !== 'undefined' ? UiIcons.i('coin', 'ui-icon-sm') : '🪙'}</span> +${summary.coins.toLocaleString()}
                </div>
                ${summary.gems > 0 ? `<div style="display:flex;align-items:center;gap:6px;font-size:1.3rem;font-family:'Luckiest Guy',sans-serif;color:#54a0ff;text-shadow:2px 2px 0 #000;"><span>${typeof UiIcons !== 'undefined' ? UiIcons.i('gem', 'ui-icon-sm') : '💎'}</span> +${summary.gems.toLocaleString()}</div>` : ''}
            </div>
            ${hasCelestialWeapon ? '<div class="cel-batch-banner">✦ CELESTIAL RELIC AWAKENED! ✦</div>' : ''}
            <div class="chest-loot-cards batch-chest-loot-grid">${weaponsHtml}${gearHtml}${matsHtml}</div>
            <button id="btn-collect-loot" class="comic-btn comic-btn-primary" style="width:100%;padding:14px;font-size:1.15rem;margin-top:10px;">
                <span>✓ COLLECT ALL</span>
            </button>
        `;

        modal.classList.remove('hidden');
        bodyEl.querySelector('#btn-collect-loot')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') window.soundEngine.playSelect();
            ChestModalUI.hide();
        });
    }
}

if (typeof window !== 'undefined') window.BatchChestModalUI = BatchChestModalUI;
if (typeof module !== 'undefined' && module.exports) module.exports = { BatchChestModalUI };
