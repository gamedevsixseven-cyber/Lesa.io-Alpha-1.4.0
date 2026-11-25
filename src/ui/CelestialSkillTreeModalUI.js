/**
 * Lesa.io - Celestial Weapon Skill Tree Interactive Constellation Modal UI
 * Renders a cosmic branching 2-path constellation tree (Awakened Core -> Tier I -> Tier II -> Tier III Finale)
 * for Hyperion Celestial Glaive & Aurelion Astral Scepter with conduit lines, stat pills,
 * permanent branch lock confirmation, and Capstone +1 Special Trait showcase.
 */

const CELESTIAL_NODE_GLYPHS = {
    hg_sup_1: '☀️',
    hg_sup_2: '🔭',
    hg_sup_3: '💥',
    hg_tmp_1: '⚡',
    hg_tmp_2: '💠',
    hg_tmp_3: '🌀',
    au_stf_1: '🌟',
    au_stf_2: '🚀',
    au_stf_3: '☄️',
    au_prm_1: '🔮',
    au_prm_2: '🌈',
    au_prm_3: '✨'
};

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
                const layer = document.getElementById('game-container') || document.querySelector('.ui-layer') || document.body;
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

    static _esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    static _formatCostHtml(cost) {
        if (!cost) return '';
        const chips = [];
        const coins = typeof WeaponEvolutionManager !== 'undefined' ? WeaponEvolutionManager._getCoins() : 0;
        const stones = typeof WeaponEvolutionManager !== 'undefined' ? WeaponEvolutionManager._getStones() : 0;
        const coinIc = typeof UiIcons !== 'undefined' ? UiIcons.i('coin', 'ui-icon-sm') : '🪙';
        const stoneIc = typeof UiIcons !== 'undefined' ? UiIcons.i('evolution_stone', 'ui-icon-sm') : '💎';

        if (cost.coins) {
            const ok = coins >= cost.coins;
            chips.push(`<span class="cel-cost-pill ${ok ? 'is-ok' : 'is-short'}">${coinIc} ${cost.coins.toLocaleString()}</span>`);
        }
        if (cost.evolutionStones) {
            const ok = stones >= cost.evolutionStones;
            chips.push(`<span class="cel-cost-pill ${ok ? 'is-ok' : 'is-short'}">${stoneIc} ${cost.evolutionStones} Evo Stone</span>`);
        }
        if (cost.materials && typeof MaterialRegistry !== 'undefined') {
            const im = (typeof window !== 'undefined' && window.inventoryManager) ? window.inventoryManager : null;
            const heldMap = im && typeof im.getMaterials === 'function' ? im.getMaterials() : {};
            for (const [matId, qty] of Object.entries(cost.materials)) {
                const m = MaterialRegistry.get(matId);
                if (!m || !qty) continue;
                const have = heldMap[matId] || 0;
                const ic = m.iconImg ? `<img src="${m.iconImg}" class="ui-icon ui-icon-sm" alt="">` : (m.icon || '⚙️');
                chips.push(`<span class="cel-cost-pill ${have >= qty ? 'is-ok' : 'is-short'}">${ic} ${have}/${qty} ${this._esc(m.shortName || m.name)}</span>`);
            }
        }
        return chips.join('');
    }

    static _buildStatPills(statSummary) {
        return String(statSummary || '')
            .split('•')
            .map(s => s.trim())
            .filter(Boolean)
            .map(part => {
                const isTrait = /special trait/i.test(part);
                return `<span class="cel-stat-pill ${isTrait ? 'is-trait' : ''}">${this._esc(part)}</span>`;
            })
            .join('');
    }

    static _buildSummaryChips(mods, st, isAwakened) {
        const chips = [];
        if (!isAwakened) {
            chips.push('<span class="cel-tree-chip is-warn">⚠ REQUIRES ★ AWAKENING FIRST</span>');
        } else if (st.chosenPath) {
            chips.push(`<span class="cel-tree-chip is-active-path">✦ ${this._esc((mods.chosenPathName || '').toUpperCase())} (${mods.unlockedCount}/3)</span>`);
        } else {
            chips.push('<span class="cel-tree-chip is-choose">CHOOSE 1 CONSTELLATION BRANCH (PERMANENT)</span>');
        }
        if (mods.baseDamage) chips.push(`<span class="cel-tree-chip">+${mods.baseDamage} DMG</span>`);
        if (mods.baseDelayDelta) chips.push(`<span class="cel-tree-chip">${mods.baseDelayDelta}F Delay</span>`);
        if (mods.critChanceBonus) chips.push(`<span class="cel-tree-chip">+${Math.round(mods.critChanceBonus * 100)}% Crit</span>`);
        if (mods.range) chips.push(`<span class="cel-tree-chip">+${mods.range} Range</span>`);
        if (mods.extraPierce) chips.push(`<span class="cel-tree-chip">+${mods.extraPierce} Pierce</span>`);
        if (mods.orbitBladesBonus) chips.push(`<span class="cel-tree-chip">+${mods.orbitBladesBonus} Blades</span>`);
        if (mods.specialTrait) chips.push(`<span class="cel-tree-chip is-trait">★ ${this._esc(mods.specialTrait.name)}</span>`);
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
        const themeCls = weaponId === 'aurelion_scepter' ? 'is-aurelion' : 'is-hyperion';
        const romanTiers = { 1: 'I', 2: 'II', 3: 'III' };

        const leftPath = def.paths[0];
        const rightPath = def.paths[1];
        const leftActive = st.chosenPath === leftPath?.id;
        const rightActive = st.chosenPath === rightPath?.id;
        const leftColor = leftPath?.accent || '#fbbf24';
        const rightColor = rightPath?.accent || '#38bdf8';

        const corePipsHtml = [1, 2, 3].map((t) =>
            `<span class="cel-core-pip ${mods.unlockedCount >= t ? 'is-lit' : ''}" title="Tier ${t}"></span>`
        ).join('');

        const forkSvgHtml = `
            <div class="cel-fork-bridge" aria-hidden="true">
                <svg viewBox="0 0 600 48" preserveAspectRatio="none">
                    <path d="M 300 0 C 300 24, 150 18, 150 48" class="cel-fork-line ${leftActive ? 'is-lit' : (st.chosenPath ? 'is-dead' : 'is-idle')}" style="--fork-accent:${leftColor};" />
                    <path d="M 300 0 C 300 24, 450 18, 450 48" class="cel-fork-line ${rightActive ? 'is-lit' : (st.chosenPath ? 'is-dead' : 'is-idle')}" style="--fork-accent:${rightColor};" />
                    <circle cx="300" cy="4" r="4.5" class="cel-fork-hub" />
                </svg>
            </div>
        `;

        const branchesHtml = def.paths.map((pathObj, pIdx) => {
            const isChosen = st.chosenPath === pathObj.id;
            const isSealed = !!(st.chosenPath && st.chosenPath !== pathObj.id);
            const badgeCls = isChosen ? 'is-chosen' : (isSealed ? 'is-sealed' : 'is-open');
            const badgeTxt = isChosen ? '✦ ACTIVE PATH' : (isSealed ? '🔒 SEALED' : 'AVAILABLE');
            const branchGlyph = pIdx === 0 ? (weaponId === 'aurelion_scepter' ? '☄️' : '🔥') : (weaponId === 'aurelion_scepter' ? '🌈' : '🌀');

            const nodesHtml = pathObj.nodes.map((node, nIdx) => {
                const status = CelestialSkillTreeManager.getNodeStatus(weaponId, pathObj.id, node.id);
                const isCapstone = !!node.specialTrait;
                const canBuy = status === 'available' && CelestialSkillTreeManager.canAfford(node.cost);
                const isConfirming = this._pendingConfirmNodeId === node.id && !st.chosenPath && status === 'available';
                const glyph = CELESTIAL_NODE_GLYPHS[node.id] || (isCapstone ? '★' : '✦');

                let btnCls = 'cel-node-btn';
                let btnLabel = 'AWAKEN NODE';
                let disabled = false;
                if (status === 'unlocked') {
                    btnCls += ' is-unlocked'; btnLabel = '✓ NODE MASTERED'; disabled = true;
                } else if (status === 'locked_unawakened') {
                    btnCls += ' is-disabled'; btnLabel = '🔒 AWAKEN WEAPON FIRST'; disabled = true;
                } else if (status === 'locked_path') {
                    btnCls += ' is-disabled'; btnLabel = '🔒 BRANCH SEALED'; disabled = true;
                } else if (status === 'locked_tier') {
                    btnCls += ' is-disabled'; btnLabel = `UNLOCK TIER ${romanTiers[node.tier - 1] || (node.tier - 1)} FIRST`; disabled = true;
                } else if (!canBuy) {
                    btnCls += ' is-disabled'; btnLabel = st.chosenPath ? 'INSUFFICIENT MATERIALS' : 'NEED RESOURCES TO LOCK';
                } else if (isConfirming) {
                    btnCls += ' is-confirm'; btnLabel = `⚠ CONFIRM PERMANENT LOCK: ${pathObj.name.toUpperCase()}!`;
                } else if (!st.chosenPath) {
                    btnLabel = `CHOOSE & LOCK (${pathObj.name.toUpperCase()})`;
                }

                const prevUnlocked = nIdx > 0 && st.unlockedNodes.includes(pathObj.nodes[nIdx - 1].id);
                const conduitHtml = nIdx > 0
                    ? `<div class="cel-node-link ${status === 'unlocked' || (prevUnlocked && !isSealed) ? 'is-lit' : ''} ${status === 'unlocked' ? 'is-charged' : ''}"><span class="cel-link-spark"></span></div>`
                    : '';

                const traitHtml = node.specialTrait
                    ? `<div class="cel-trait-callout"><div class="cel-trait-head">★ FINALE ABILITY · ${this._esc(node.specialTrait.name)}</div><div class="cel-trait-desc">${this._esc(node.specialTrait.desc)}</div></div>`
                    : '';

                const statusCls = status === 'unlocked' ? 'is-unlocked' : (status === 'available' ? 'is-available' : (isSealed ? 'is-sealed' : 'is-locked'));

                return `
                    ${conduitHtml}
                    <div class="cel-node-card ${statusCls} ${isCapstone ? 'is-capstone' : ''} ${canBuy ? 'can-afford' : ''}">
                        <div class="cel-node-row">
                            <div class="cel-node-orb ${statusCls} ${isCapstone ? 'is-capstone' : ''}">
                                <span class="cel-orb-glyph">${glyph}</span>
                                <span class="cel-orb-tier">${romanTiers[node.tier] || node.tier}</span>
                            </div>
                            <div class="cel-node-main">
                                <div class="cel-node-top">
                                    <span class="cel-node-title">${this._esc(node.name)}</span>
                                    <span class="cel-node-tier">${isCapstone ? '★ FINALE III' : `TIER ${romanTiers[node.tier] || node.tier}`}</span>
                                </div>
                                <div class="cel-stat-pills">${this._buildStatPills(node.statSummary)}</div>
                            </div>
                        </div>
                        ${traitHtml}
                        ${status !== 'unlocked' ? `<div class="cel-node-costs">${this._formatCostHtml(node.cost)}</div>` : ''}
                        <button type="button" class="${btnCls}" data-cel-path="${pathObj.id}" data-cel-node="${node.id}" ${disabled ? 'disabled' : ''}>${btnLabel}</button>
                    </div>
                `;
            }).join('');

            return `
                <div class="cel-path-col ${isChosen ? 'is-chosen' : ''} ${isSealed ? 'is-sealed' : ''}" style="--path-accent:${pathObj.accent};">
                    <div class="cel-path-head">
                        <div class="cel-path-title-row">
                            <span class="cel-path-emblem">${branchGlyph}</span>
                            <div>
                                <h3 class="cel-path-name">${this._esc(pathObj.name)}</h3>
                                <p class="cel-path-tag">${this._esc(pathObj.tagline)}</p>
                            </div>
                        </div>
                        <span class="cel-path-status-badge ${badgeCls}">${badgeTxt}</span>
                    </div>
                    <div class="cel-path-nodes">${nodesHtml}</div>
                </div>
            `;
        }).join('');

        modal.innerHTML = `
            <div class="modal-panel cel-tree-panel ${themeCls}">
                <div class="cel-cosmos-bg" aria-hidden="true"></div>
                <button class="modal-close-x-btn cel-close-x" id="cel-tree-close-x" title="Close">✕</button>
                <div class="cel-tree-header">
                    <div class="cel-tree-icon-wrap">
                        <div class="cel-core-halo"></div>
                        <img src="${wMeta.image || 'assets/WeaponIcons/HyperionCelestialGlaive.png'}" alt="${this._esc(wMeta.name || '')}">
                    </div>
                    <div class="cel-header-copy">
                        <h2 class="cel-tree-title">✦ ${this._esc(def.title)}</h2>
                        <p class="cel-tree-sub">${this._esc(def.subtitle)}</p>
                    </div>
                    <div class="cel-mastery-box">
                        <span class="cel-mastery-lbl">CONSTELLATION</span>
                        <div class="cel-core-pips">${corePipsHtml}</div>
                        <span class="cel-mastery-count">${mods.unlockedCount} / 3</span>
                    </div>
                </div>
                <div class="cel-tree-summary-bar">${this._buildSummaryChips(mods, st, isAwakened)}</div>
                <div class="cel-tree-stage">
                    <div class="cel-tree-root ${isAwakened ? 'is-awakened' : 'is-unawakened'}">
                        <span class="cel-root-star">✦</span>
                        <span>${isAwakened ? `AWAKENED ${this._esc((wMeta.name || 'CELESTIAL RELIC').toUpperCase())} CORE` : `UNAWAKENED CORE (EVOLVE ★ FIRST)`}</span>
                        <span class="cel-root-star">✦</span>
                    </div>
                    ${forkSvgHtml}
                    <div class="cel-tree-branches">${branchesHtml}</div>
                </div>
                <div class="cel-footer-actions">
                    <button type="button" id="cel-tree-done-btn" class="gear-done-btn cel-done-btn">CLOSE CONSTELLATION</button>
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
                    const cost = def.paths.find(p => p.id === pathId)?.nodes.find(n => n.id === nodeId)?.cost;
                    if (status === 'available' && CelestialSkillTreeManager.canAfford(cost)) {
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
