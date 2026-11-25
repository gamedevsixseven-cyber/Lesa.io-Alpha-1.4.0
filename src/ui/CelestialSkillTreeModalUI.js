/**
 * Lesa.io - Celestial Weapon Skill Tree Interactive Modal UI
 * Renders branching 2-path tree diagram with irreversible path lock confirmation,
 * cost chips, live affordability checks, and Capstone +1 Special Trait highlight.
 */

class CelestialSkillTreeModalUI {
    static _modalEl = null;
    static _activeWeaponId = null;
    static _pendingConfirmNodeId = null;

    static getOrCreateModal() {
        if (!this._modalEl && typeof document !== 'undefined') {
            let el = document.getElementById('celestial-tree-modal');
            if (!el) {
                el = document.createElement('div');
                el.id = 'celestial-tree-modal';
                el.className = 'modal-overlay hidden';
                const layer = document.querySelector('.ui-layer') || document.body;
                layer.appendChild(el);
                el.addEventListener('click', (e) => {
                    if (e.target === el) this.hide();
                });
            }
            this._modalEl = el;
        }
        return this._modalEl;
    }

    static open(weaponId) {
        if (typeof CelestialSkillTreeManager === 'undefined' || !CelestialSkillTreeManager.isTreeEligible(weaponId)) return;
        this._activeWeaponId = weaponId;
        this._pendingConfirmNodeId = null;
        this.render();
        const modal = this.getOrCreateModal();
        if (modal) modal.classList.remove('hidden');
    }

    static hide() {
        this._pendingConfirmNodeId = null;
        const modal = this._modalEl || (typeof document !== 'undefined' && document.getElementById('celestial-tree-modal'));
        if (modal) modal.classList.add('hidden');
    }

    static _formatCostHtml(cost) {
        if (!cost) return '';
        const chips = [];
        const coins = typeof WeaponEvolutionManager !== 'undefined' ? WeaponEvolutionManager._getCoins() : 0;
        const stones = typeof WeaponEvolutionManager !== 'undefined' ? WeaponEvolutionManager._getStones() : 0;
        const coinIc = typeof UiIcons !== 'undefined' ? UiIcons.i('coin', 'ui-icon-sm') : '🪙';
        const stoneIc = typeof UiIcons !== 'undefined' ? UiIcons.i('evolution_stone', 'ui-icon-sm') : '💎';

        if (cost.coins) {
            chips.push(`<span class="gear-cost-chip ${coins < cost.coins ? 'is-short' : ''}">${coinIc} ${cost.coins.toLocaleString()}</span>`);
        }
        if (cost.evolutionStones) {
            chips.push(`<span class="gear-cost-chip ${stones < cost.evolutionStones ? 'is-short' : ''}">${stoneIc} ${cost.evolutionStones} Evo Stone</span>`);
        }
        if (cost.materials && typeof MaterialRegistry !== 'undefined') {
            const im = (typeof window !== 'undefined' && window.inventoryManager) ? window.inventoryManager : null;
            const heldMap = im && typeof im.getMaterials === 'function' ? im.getMaterials() : {};
            for (const [matId, qty] of Object.entries(cost.materials)) {
                const m = MaterialRegistry.get(matId);
                if (!m || !qty) continue;
                const have = heldMap[matId] || 0;
                const ic = m.iconImg ? `<img src="${m.iconImg}" class="ui-icon ui-icon-sm" alt="">` : (m.icon || '⚙️');
                chips.push(`<span class="gear-cost-chip ${have < qty ? 'is-short' : ''}">${ic} ${qty} ${m.shortName || m.name}</span>`);
            }
        }
        return chips.join('');
    }

    static render() {
        const modal = this.getOrCreateModal();
        const weaponId = this._activeWeaponId;
        if (!modal || !weaponId || typeof CelestialSkillTreeManager === 'undefined') return;

        const def = CelestialSkillTreeManager.getTreeDef(weaponId);
        const wMeta = (typeof WEAPONS !== 'undefined' && WEAPONS[weaponId]) || {};
        const st = CelestialSkillTreeManager.getWeaponState(weaponId);
        const mods = CelestialSkillTreeManager.getModifiers(weaponId);
        const isAwakened = CelestialSkillTreeManager.isAwakened(weaponId);

        const summaryChips = [];
        if (!isAwakened) {
            summaryChips.push('<span class="cel-tree-chip" style="border-color:#f97316;color:#fed7aa;">⚠ Requires ★ Awakening First</span>');
        } else if (st.chosenPath) {
            summaryChips.push(`<span class="cel-tree-chip">LOCKED PATH: ${mods.chosenPathName.toUpperCase()} (${mods.unlockedCount}/3)</span>`);
        } else {
            summaryChips.push('<span class="cel-tree-chip">PICK 1 PATH — CHOICE IS PERMANENT</span>');
        }
        if (mods.baseDamage) summaryChips.push(`<span class="cel-tree-chip">+${mods.baseDamage} DMG</span>`);
        if (mods.baseDelayDelta) summaryChips.push(`<span class="cel-tree-chip">${mods.baseDelayDelta}F Delay</span>`);
        if (mods.critChanceBonus) summaryChips.push(`<span class="cel-tree-chip">+${Math.round(mods.critChanceBonus * 100)}% Crit</span>`);
        if (mods.specialTrait) summaryChips.push(`<span class="cel-tree-chip is-trait">✦ TRAIT: ${mods.specialTrait.name}</span>`);

        const branchesHtml = def.paths.map((pathObj) => {
            const isChosen = st.chosenPath === pathObj.id;
            const isSealed = !!(st.chosenPath && st.chosenPath !== pathObj.id);
            const badgeCls = isChosen ? 'is-chosen' : (isSealed ? 'is-sealed' : 'is-open');
            const badgeTxt = isChosen ? 'CHOSEN PATH' : (isSealed ? '🔒 SEALED' : 'SELECTABLE');

            const nodesHtml = pathObj.nodes.map((node) => {
                const status = CelestialSkillTreeManager.getNodeStatus(weaponId, pathObj.id, node.id);
                const isCapstone = !!node.specialTrait;
                const canBuy = status === 'available' && CelestialSkillTreeManager.canAfford(node.cost);
                const isConfirming = this._pendingConfirmNodeId === node.id && !st.chosenPath && status === 'available';

                let btnCls = 'cel-node-btn';
                let btnLabel = 'UPGRADE NODE';
                let disabled = false;
                if (status === 'unlocked') {
                    btnCls += ' is-unlocked';
                    btnLabel = '✓ UNLOCKED';
                    disabled = true;
                } else if (status === 'locked_unawakened') {
                    btnCls += ' is-disabled';
                    btnLabel = '🔒 AWAKEN WEAPON FIRST';
                    disabled = true;
                } else if (status === 'locked_path') {
                    btnCls += ' is-disabled';
                    btnLabel = '🔒 PATH SEALED FOREVER';
                    disabled = true;
                } else if (status === 'locked_tier') {
                    btnCls += ' is-disabled';
                    btnLabel = `REQUIRES TIER ${node.tier - 1}`;
                    disabled = true;
                } else if (!canBuy) {
                    btnCls += ' is-disabled';
                    btnLabel = st.chosenPath ? 'NEED RESOURCES' : 'LOCK PATH (NEED RESOURCES)';
                } else if (isConfirming) {
                    btnCls += ' is-confirm';
                    btnLabel = `⚠ CONFIRM LOCK: ${pathObj.name.toUpperCase()}!`;
                } else if (!st.chosenPath) {
                    btnLabel = `CHOOSE & LOCK PATH (${pathObj.name.toUpperCase()})`;
                }

                const traitHtml = node.specialTrait
                    ? `<div class="cel-trait-callout"><strong>✦ ${node.specialTrait.name}:</strong> ${node.specialTrait.desc}</div>`
                    : '';

                return `
                    <div class="cel-node-card ${status === 'unlocked' ? 'is-unlocked' : ''} ${status === 'available' ? 'is-available' : ''} ${isCapstone ? 'is-capstone' : ''}">
                        <div class="cel-node-top">
                            <span class="cel-node-title">${node.name}</span>
                            <span class="cel-node-tier">${isCapstone ? '★ FINALE TIER 3' : `TIER ${node.tier}`}</span>
                        </div>
                        <div class="cel-node-stats">${node.statSummary}</div>
                        ${traitHtml}
                        ${status !== 'unlocked' ? `<div class="cel-node-costs">${this._formatCostHtml(node.cost)}</div>` : ''}
                        <button type="button" class="${btnCls}" data-cel-path="${pathObj.id}" data-cel-node="${node.id}" ${disabled ? 'disabled' : ''}>${btnLabel}</button>
                    </div>
                `;
            }).join('');

            return `
                <div class="cel-path-col ${isChosen ? 'is-chosen' : ''} ${isSealed ? 'is-sealed' : ''}">
                    <div class="cel-path-head">
                        <div>
                            <h3 class="cel-path-name" style="color:${pathObj.accent};">${pathObj.name}</h3>
                            <p class="cel-path-tag">${pathObj.tagline}</p>
                        </div>
                        <span class="cel-path-status-badge ${badgeCls}">${badgeTxt}</span>
                    </div>
                    ${nodesHtml}
                </div>
            `;
        }).join('');

        modal.innerHTML = `
            <div class="modal-panel cel-tree-panel">
                <button class="modal-close-x-btn" id="cel-tree-close-x" title="Close">✕</button>
                <div class="cel-tree-header">
                    <div class="cel-tree-icon-wrap">
                        <img src="${wMeta.image || 'assets/WeaponIcons/HyperionCelestialGlaive.png'}" alt="${wMeta.name || ''}">
                    </div>
                    <div>
                        <h2 class="cel-tree-title">✦ ${def.title}</h2>
                        <p class="cel-tree-sub">${def.subtitle}</p>
                    </div>
                </div>
                <div class="cel-tree-summary-bar">${summaryChips.join('')}</div>
                <div class="cel-tree-root">★ AWAKENED ${(wMeta.name || 'CELESTIAL RELIC').toUpperCase()} CORE ★</div>
                <div class="cel-tree-branches">${branchesHtml}</div>
                <div style="margin-top:14px;display:flex;justify-content:center;">
                    <button type="button" id="cel-tree-done-btn" class="gear-done-btn">CLOSE SKILL TREE</button>
                </div>
            </div>
        `;

        modal.querySelector('#cel-tree-close-x')?.addEventListener('click', () => this.hide());
        modal.querySelector('#cel-tree-done-btn')?.addEventListener('click', () => this.hide());

        modal.querySelectorAll('.cel-node-btn[data-cel-node]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const pathId = btn.getAttribute('data-cel-path');
                const nodeId = btn.getAttribute('data-cel-node');
                const curState = CelestialSkillTreeManager.getWeaponState(weaponId);

                if (!curState.chosenPath && this._pendingConfirmNodeId !== nodeId) {
                    const status = CelestialSkillTreeManager.getNodeStatus(weaponId, pathId, nodeId);
                    if (status === 'available' && CelestialSkillTreeManager.canAfford(
                        def.paths.find(p => p.id === pathId)?.nodes.find(n => n.id === nodeId)?.cost
                    )) {
                        this._pendingConfirmNodeId = nodeId;
                        this.render();
                        return;
                    }
                }

                const res = CelestialSkillTreeManager.unlockNode(weaponId, pathId, nodeId);
                if (!res.success) {
                    if (typeof ModalManager !== 'undefined' && ModalManager.notifyInsufficient && res.reason) {
                        ModalManager.notifyInsufficient(`⚠️ ${res.reason}`, modal.querySelector('.cel-tree-panel'));
                    }
                    if (window.soundEngine && typeof window.soundEngine.playBuzzer === 'function') window.soundEngine.playBuzzer();
                    return;
                }
                this._pendingConfirmNodeId = null;
                this.render();
            });
        });
    }
}

if (typeof window !== 'undefined') window.CelestialSkillTreeModalUI = CelestialSkillTreeModalUI;
if (typeof module !== 'undefined' && module.exports) module.exports = { CelestialSkillTreeModalUI };
