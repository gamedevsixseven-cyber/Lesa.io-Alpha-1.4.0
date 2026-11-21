/**
 * Lesa.io - Boss Drop Edge Toast & Menu Claim/Equip Modal UI
 * Shows a compact non-centered banner during gameplay and an interactive Claim/Equip prompt in the menu.
 */

class BossRewardModalUI {
    static _toastTimer = null;
    static _modalEl = null;
    static _toastEl = null;

    static getOrCreateToast() {
        if (!this._toastEl) {
            let el = document.getElementById('boss-unlock-toast');
            if (!el) {
                el = document.createElement('div');
                el.id = 'boss-unlock-toast';
                el.className = 'boss-unlock-toast hidden';
                const layer = document.querySelector('.ui-layer') || document.body;
                layer.appendChild(el);
            }
            this._toastEl = el;
        }
        return this._toastEl;
    }

    static showInGameDrops(drops, bossName = '') {
        if (!Array.isArray(drops) || drops.length === 0 || typeof document === 'undefined') return;
        if (typeof BossRewardManager === 'undefined') return;

        const toast = this.getOrCreateToast();
        const metas = drops.map(d => BossRewardManager.getRewardMeta(d.category, d.id));
        const topRarity = metas.some(m => (m.rarity || '').toLowerCase() === 'apex')
            ? 'apex'
            : (metas.some(m => (m.rarity || '').toLowerCase() === 'mythic')
                ? 'mythic'
                : (metas[0].rarity || 'epic').toLowerCase());

        const rowsHtml = metas.map(m => `
            <div class="but-row">
                <div class="but-icon-box"><img src="${m.iconImg}" class="but-icon-img" alt="${m.name}"></div>
                <div class="but-text-col">
                    <span class="but-item-name">${m.name}</span>
                    <span class="but-item-cat">${m.rarity.toUpperCase()} ${m.categoryLabel}</span>
                </div>
            </div>
        `).join('');

        const title = metas.length > 1 ? 'OLYMPIAN DROPS UNLOCKED' : 'BOSS DROP UNLOCKED';
        toast.className = `boss-unlock-toast rarity-${topRarity}`;
        toast.innerHTML = `
            <div class="but-eyebrow">
                <span>${title}</span>
                <span class="but-subtag">CLAIM IN MENU</span>
            </div>
            <div class="but-rows">${rowsHtml}</div>
        `;

        toast.classList.remove('hidden', 'is-hiding');
        toast.classList.add('is-visible');

        if (this._toastTimer) clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            toast.classList.remove('is-visible');
            toast.classList.add('is-hiding');
            setTimeout(() => {
                if (toast.classList.contains('is-hiding')) {
                    toast.classList.remove('is-hiding');
                    toast.classList.add('hidden');
                }
            }, 240);
        }, 4400);
    }

    static hideInGameDrops() {
        if (this._toastTimer) {
            clearTimeout(this._toastTimer);
            this._toastTimer = null;
        }
        const el = this._toastEl || (typeof document !== 'undefined' && document.getElementById('boss-unlock-toast'));
        if (el) {
            el.classList.remove('is-visible');
            el.classList.add('hidden');
        }
    }

    static getOrCreateModal() {
        if (!this._modalEl && typeof document !== 'undefined') {
            let el = document.getElementById('boss-reward-claim-modal');
            if (!el) {
                el = document.createElement('div');
                el.id = 'boss-reward-claim-modal';
                el.className = 'modal-overlay hidden';
                const layer = document.querySelector('.ui-layer') || document.body;
                layer.appendChild(el);
            }
            this._modalEl = el;
        }
        return this._modalEl;
    }

    static _isMenuBlockedByHigherModal() {
        const menuEl = document.getElementById('menu-screen');
        if (!menuEl || menuEl.classList.contains('hidden')) return true;

        const blockers = ['first-time-name-modal', 'mazonakis-tribute-modal', 'loading-screen', 'dev-intro-overlay'];
        for (const id of blockers) {
            const el = document.getElementById(id);
            if (el && !el.classList.contains('hidden') && getComputedStyle(el).display !== 'none') {
                return true;
            }
        }
        if (window.creditsScreen && window.creditsScreen.active) return true;
        return false;
    }

    static checkAndShowPending() {
        if (typeof BossRewardManager === 'undefined' || !BossRewardManager.hasPending()) return false;
        if (typeof document === 'undefined' || this._isMenuBlockedByHigherModal()) return false;

        const pending = BossRewardManager.getPending();
        if (pending.length === 0) return false;

        // Group by first boss batch so separate boss runs claim cleanly in order
        const firstBoss = pending[0].bossId || 'boss';
        const batch = pending.filter(p => (p.bossId || 'boss') === firstBoss);
        this.showClaimModal(batch);
        return true;
    }

    static showClaimModal(items) {
        if (!Array.isArray(items) || items.length === 0 || typeof BossRewardManager === 'undefined') return;
        const modal = this.getOrCreateModal();
        if (!modal) return;

        const isMulti = items.length > 1;
        const metas = items.map(entry => ({
            entry,
            meta: BossRewardManager.getRewardMeta(entry.category, entry.id)
        }));

        const bossSubtitle = (items[0] && items[0].bossName) || 'Boss Victory Reward';
        const gridColsCls = items.length >= 3 ? 'cols-3' : (items.length === 2 ? 'cols-2' : '');

        const cardsHtml = metas.map(({ entry, meta }, idx) => {
            const rLower = (meta.rarity || 'epic').toLowerCase();
            const isEq = BossRewardManager.isEquipped(entry.category, entry.id);
            const statsHtml = (meta.stats || []).map(st => `
                <div class="br-stat-row">
                    <span>${st.label}</span>
                    <span>${st.val}</span>
                </div>
            `).join('');

            const perCardEquipHtml = isMulti
                ? `<button class="br-card-equip-btn ${isEq ? 'is-equipped' : ''}" data-br-idx="${idx}" ${isEq ? 'disabled' : ''}>${isEq ? '✓ EQUIPPED' : 'EQUIP'}</button>`
                : '';

            return `
                <div class="br-card rarity-${rLower} ${isEq ? 'is-card-equipped' : ''}" data-br-card="${idx}">
                    <div>
                        <div class="br-card-badges">
                            <span class="br-cat-pill">${meta.categoryLabel}</span>
                            <span class="weapon-badge badge-${rLower}">${meta.rarity.toUpperCase()}</span>
                        </div>
                        <div class="br-icon-stage">
                            <img src="${meta.iconImg}" class="br-card-img" alt="${meta.name}">
                        </div>
                        <h3 class="br-card-name">${meta.name}</h3>
                        <p class="br-card-desc">${meta.desc}</p>
                    </div>
                    <div>
                        <div class="br-card-stats">${statsHtml}</div>
                        ${perCardEquipHtml ? `<div style="margin-top:8px;">${perCardEquipHtml}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        const claimLabel = isMulti ? 'CLAIM ALL' : 'CLAIM';
        const equipLabel = isMulti ? 'EQUIP ALL' : 'EQUIP';
        const titleText = isMulti ? 'OLYMPIAN SPOILS!' : 'BOSS DROP EARNED!';

        modal.innerHTML = `
            <div class="modal-panel boss-reward-panel ${isMulti ? 'is-multi' : ''}">
                <div class="br-header">
                    <span class="br-eyebrow">${bossSubtitle.toUpperCase()}</span>
                    <h2 class="br-title">${titleText}</h2>
                    <p class="br-subtitle">Claim to add to your Gear &amp; Skills, or Equip immediately!</p>
                </div>
                <div class="br-cards-grid ${gridColsCls}">${cardsHtml}</div>
                <div class="br-actions">
                    <button id="br-claim-all-btn" class="comic-btn br-btn-claim">${claimLabel}</button>
                    <button id="br-equip-all-btn" class="comic-btn br-btn-equip">${equipLabel}</button>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');

        // Bind per-card Equip buttons in multi-item mode
        modal.querySelectorAll('.br-card-equip-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.getAttribute('data-br-idx'), 10);
                const target = metas[idx];
                if (!target) return;
                BossRewardManager.claimItem(target.entry.category, target.entry.id, { equip: true });
                if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
                    window.soundEngine.playSelect();
                }
                btn.textContent = '✓ EQUIPPED';
                btn.classList.add('is-equipped');
                btn.disabled = true;
                const cardEl = modal.querySelector(`.br-card[data-br-card="${idx}"]`);
                if (cardEl) cardEl.classList.add('is-card-equipped');
            });
        });

        const closeAndNext = (equipAll) => {
            BossRewardManager.claimBatch(items, { equipAll });
            this.hideClaimModal();
            if (window.modalManager && typeof window.modalManager.showQuickToast === 'function') {
                const verb = equipAll ? 'Claimed & Equipped' : 'Claimed';
                const label = metas.length === 1 ? metas[0].meta.name : `${metas.length} Olympian Rewards`;
                window.modalManager.showQuickToast(`✓ ${verb}: ${label}!`, 2000);
            }
            if (BossRewardManager.hasPending()) {
                setTimeout(() => this.checkAndShowPending(), 220);
            }
        };

        const claimBtn = modal.querySelector('#br-claim-all-btn');
        if (claimBtn) {
            claimBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeAndNext(false);
            });
        }

        const equipBtn = modal.querySelector('#br-equip-all-btn');
        if (equipBtn) {
            equipBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeAndNext(true);
            });
        }
    }

    static hideClaimModal() {
        const modal = this._modalEl || (typeof document !== 'undefined' && document.getElementById('boss-reward-claim-modal'));
        if (modal) modal.classList.add('hidden');
    }
}

if (typeof window !== 'undefined') {
    window.BossRewardModalUI = BossRewardModalUI;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BossRewardModalUI };
}
