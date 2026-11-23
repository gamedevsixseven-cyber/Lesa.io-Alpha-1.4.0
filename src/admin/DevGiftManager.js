/**
 * Lesa.io - Primary Developer Player Gifting Engine & UI Composer
 * Restricted exclusively to the signed-in Primary Developer Firebase account.
 * Allows gifting Diamonds (Gems), Gold (Coins), Chests (all tiers), and Season VIP Battle Pass
 * to any searched player account via Firestore `devGifts`, claimed reliably on live sync or login.
 */

class DevGiftManager {
    static CLAIMED_STORAGE_KEY = 'lesaio_claimed_dev_gifts';
    static MAX_CLAIMED_HISTORY = 120;
    static CHEST_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
    static CHEST_LABELS = {
        common: 'Common Chest',
        uncommon: 'Uncommon Chest',
        rare: 'Rare Chest',
        epic: 'Epic Chest',
        legendary: 'Legendary Chest',
        mythic: 'Mythic Chest'
    };
    static CHEST_ICONS = {
        common: 'assets/Chests/CommonChest.png',
        uncommon: 'assets/Chests/UncommonChest.png',
        rare: 'assets/Chests/RareChest.png',
        epic: 'assets/Chests/EpicChest.png',
        legendary: 'assets/Chests/LegendaryChest.png',
        mythic: 'assets/Chests/MythicChest.png'
    };

    static _retryTimer = null;
    static _bootWaitTimer = null;
    static _activeTarget = null;
    static _pendingPopupGifts = [];
    static _activePopupSignature = '';
    static _lastCloudSave = null;

    static async _requireDev() {
        if (typeof window === 'undefined' || !window.AdminAuth || typeof window.AdminAuth.verifyPrimaryDevAccess !== 'function') {
            throw new Error('AdminAuth unavailable.');
        }
        return window.AdminAuth.verifyPrimaryDevAccess(true);
    }

    static _getDb() {
        if (typeof firebase !== 'undefined' && firebase.firestore) return firebase.firestore();
        if (typeof window !== 'undefined' && window.cloudSave && window.cloudSave.db) return window.cloudSave.db;
        return null;
    }

    static _escHtml(str) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return String(str || '').replace(/[&<>'"]/g, ch => map[ch]);
    }

    static getChestOptions() {
        const reg = (typeof CHEST_TYPES !== 'undefined' && CHEST_TYPES)
            ? CHEST_TYPES
            : (typeof window !== 'undefined' && window.CHEST_TYPES ? window.CHEST_TYPES : null);
        return this.CHEST_ORDER.map(id => ({
            id,
            name: (reg && reg[id] && reg[id].name) ? reg[id].name : (this.CHEST_LABELS[id] || id)
        }));
    }

    static sanitizeGiftSpec(raw = {}) {
        const gems = Math.min(100000000, Math.max(0, Math.floor(Number(raw.gems) || 0)));
        const coins = Math.min(1000000000, Math.max(0, Math.floor(Number(raw.coins) || 0)));
        const battlePass = Boolean(raw.battlePass);
        const note = String(raw.note || '').trim().slice(0, 120);

        const chests = {};
        if (raw.chests && typeof raw.chests === 'object') {
            for (const [k, v] of Object.entries(raw.chests)) {
                const key = String(k || '').toLowerCase();
                const qty = Math.min(99, Math.max(0, Math.floor(Number(v) || 0)));
                if (this.CHEST_ORDER.includes(key) && qty > 0) chests[key] = (chests[key] || 0) + qty;
            }
        }
        if (raw.chestType && raw.chestCount !== undefined) {
            const key = String(raw.chestType || '').toLowerCase();
            const qty = Math.min(99, Math.max(0, Math.floor(Number(raw.chestCount) || 0)));
            if (this.CHEST_ORDER.includes(key) && qty > 0) chests[key] = Math.min(99, (chests[key] || 0) + qty);
        }

        const hasChests = Object.keys(chests).length > 0;
        const isEmpty = gems <= 0 && coins <= 0 && !hasChests && !battlePass;
        return { gems, coins, chests, battlePass, note, isEmpty };
    }

    static formatGiftSummary(spec) {
        const parts = [];
        if (spec.gems > 0) parts.push(`+${spec.gems.toLocaleString()} 💎`);
        if (spec.coins > 0) parts.push(`+${spec.coins.toLocaleString()} 🪙`);
        if (spec.chests) {
            for (const [type, qty] of Object.entries(spec.chests)) {
                if (qty > 0) parts.push(`${qty}x ${this.CHEST_LABELS[type] || type}`);
            }
        }
        if (spec.battlePass) parts.push('👑 Battle Pass VIP');
        return parts.join(' • ');
    }

    static async sendGiftToPlayer(targetInfo, rawSpec) {
        const check = await this._requireDev();
        if (!check.authorized) throw new Error(check.message || 'Primary Dev authorization required.');
        const db = this._getDb();
        if (!db || !targetInfo || !targetInfo.uid) throw new Error('Invalid target account.');

        const clean = this.sanitizeGiftSpec(rawSpec);
        if (clean.isEmpty) {
            throw new Error('Select at least one gift (Diamonds, Gold, Chests, or Battle Pass VIP).');
        }

        const candidateDocIds = Array.from(new Set([
            targetInfo.uid,
            ...(Array.isArray(targetInfo.altDocIds) ? targetInfo.altDocIds : [])
        ].filter(Boolean)));

        let targetRef = null;
        for (const docId of candidateDocIds) {
            const ref = db.collection('players').doc(docId);
            const snap = await ref.get().catch(() => null);
            if (snap && snap.exists) {
                targetRef = ref;
                break;
            }
        }
        if (!targetRef) throw new Error('Target player document not found in Firestore.');

        const giftEntry = {
            id: `dg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            gems: clean.gems,
            coins: clean.coins,
            chests: clean.chests,
            battlePass: clean.battlePass,
            note: clean.note,
            sentAt: Date.now()
        };

        await targetRef.update({
            devGifts: firebase.firestore.FieldValue.arrayUnion(giftEntry),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });

        return { ok: true, docId: targetRef.id, gift: giftEntry, summary: this.formatGiftSummary(clean) };
    }

    static closeComposer() {
        this._activeTarget = null;
        const container = typeof document !== 'undefined' ? document.getElementById('admin-dev-gift-composer') : null;
        if (container) {
            container.innerHTML = '';
            container.classList.add('hidden');
        }
    }

    static openComposer(targetInfo, adminPanel = null) {
        if (typeof document === 'undefined' || !targetInfo) return;
        const isPrimaryDev = !!(window.AdminAuth && typeof window.AdminAuth.isPrimaryDevUser === 'function' && window.AdminAuth.isPrimaryDevUser());
        if (!isPrimaryDev) {
            if (adminPanel) adminPanel.showToast('Primary Dev authorization required.', 'error');
            return;
        }

        const container = document.getElementById('admin-dev-gift-composer');
        if (!container) return;
        this._activeTarget = targetInfo;
        container.classList.remove('hidden');

        const chestRowsHtml = this.getChestOptions().map(c => {
            const shortName = c.name.replace(/\s*Chest$/i, '');
            const icon = this.CHEST_ICONS[c.id] || 'assets/Chests/CommonChest.png';
            const inputId = `admin-gift-chest-${this._escHtml(c.id)}`;
            return `<div class="admin-dev-chest-item"><img src="${this._escHtml(icon)}" class="admin-dev-chest-mini-icon" alt=""><span>${this._escHtml(shortName)}</span><input type="number" id="${inputId}" data-chest-type="${this._escHtml(c.id)}" class="admin-text-input admin-dev-qty-input" min="0" max="99" value="0"><button type="button" class="admin-gift-chip" data-target="${inputId}" data-add="1">+1</button><button type="button" class="admin-gift-chip is-clear" data-target="${inputId}" data-clear="1">0</button></div>`;
        }).join('');
        const vipStatus = targetInfo.hasVipPass
            ? '<span style="color:#fed330;font-weight:800;">👑 Already VIP</span>'
            : '<span style="color:#a4b0be;">Free Pass</span>';

        container.innerHTML = `
            <div class="admin-dev-gift-header">
                <div>
                    <div class="admin-dev-acc-title">🎁 Send Dev Gift to ${this._escHtml(targetInfo.name)} <span style="color:#fed330;">${this._escHtml(targetInfo.tag)}</span></div>
                    <div class="admin-dev-acc-sub">UID: ${this._escHtml(targetInfo.uid)} | Status: ${vipStatus}</div>
                </div>
                <button type="button" id="admin-gift-close-btn" class="admin-control-btn btn-danger">CANCEL</button>
            </div>
            <div class="admin-dev-gift-grid">
                <div class="admin-dev-gift-field">
                    <label for="admin-gift-gems-input">💎 Diamonds (Gems)</label>
                    <input type="number" id="admin-gift-gems-input" class="admin-text-input" min="0" max="100000000" value="0" step="50">
                    <div class="admin-dev-gift-presets">
                        <button type="button" class="admin-gift-chip" data-target="admin-gift-gems-input" data-add="100">+100</button>
                        <button type="button" class="admin-gift-chip" data-target="admin-gift-gems-input" data-add="500">+500</button>
                        <button type="button" class="admin-gift-chip" data-target="admin-gift-gems-input" data-add="2500">+2.5K</button>
                        <button type="button" class="admin-gift-chip" data-target="admin-gift-gems-input" data-add="10000">+10K</button>
                        <button type="button" class="admin-gift-chip is-clear" data-target="admin-gift-gems-input" data-clear="1">0</button>
                    </div>
                </div>
                <div class="admin-dev-gift-field">
                    <label for="admin-gift-coins-input">🪙 Gold (Coins)</label>
                    <input type="number" id="admin-gift-coins-input" class="admin-text-input" min="0" max="1000000000" value="0" step="1000">
                    <div class="admin-dev-gift-presets">
                        <button type="button" class="admin-gift-chip" data-target="admin-gift-coins-input" data-add="5000">+5K</button>
                        <button type="button" class="admin-gift-chip" data-target="admin-gift-coins-input" data-add="25000">+25K</button>
                        <button type="button" class="admin-gift-chip" data-target="admin-gift-coins-input" data-add="100000">+100K</button>
                        <button type="button" class="admin-gift-chip" data-target="admin-gift-coins-input" data-add="500000">+500K</button>
                        <button type="button" class="admin-gift-chip is-clear" data-target="admin-gift-coins-input" data-clear="1">0</button>
                    </div>
                </div>
                <div class="admin-dev-gift-field">
                    <label for="admin-gift-note-input">👑 Battle Pass VIP &amp; Note</label>
                    <label class="admin-dev-vip-toggle">
                        <input type="checkbox" id="admin-gift-bp-check">
                        <span>Gift Season Battle Pass (VIP)</span>
                    </label>
                    <input type="text" id="admin-gift-note-input" class="admin-text-input" maxlength="120" placeholder="Optional message shown to player...">
                </div>
            </div>
            <div class="admin-dev-gift-field" style="margin-top:10px;">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                    <label>📦 Chests (Mix &amp; Match Any Tiers)</label>
                    <button type="button" id="admin-gift-clear-chests-btn" class="admin-gift-chip is-clear">Clear All Chests</button>
                </div>
                <div class="admin-dev-multi-chest-grid">${chestRowsHtml}</div>
            </div>
            <div class="admin-dev-gift-footer">
                <button type="button" id="admin-gift-send-btn" class="admin-control-btn btn-success">SEND DEV GIFT 🎁</button>
            </div>
        `;

        container.querySelector('#admin-gift-close-btn')?.addEventListener('click', () => this.closeComposer());
        container.querySelector('#admin-gift-clear-chests-btn')?.addEventListener('click', () => {
            container.querySelectorAll('input[data-chest-type]').forEach(inp => { inp.value = '0'; });
        });
        container.querySelectorAll('.admin-gift-chip[data-target]').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = document.getElementById(btn.getAttribute('data-target'));
                if (!input) return;
                if (btn.getAttribute('data-clear')) {
                    input.value = '0';
                } else {
                    const add = parseInt(btn.getAttribute('data-add') || '0', 10);
                    const cur = Math.max(0, parseInt(input.value || '0', 10) || 0);
                    const max = parseInt(input.max || '999999999', 10);
                    input.value = String(Math.min(max, cur + add));
                }
            });
        });

        const sendBtn = container.querySelector('#admin-gift-send-btn');
        sendBtn?.addEventListener('click', async () => {
            const chests = {};
            container.querySelectorAll('input[data-chest-type]').forEach(inp => {
                const cType = inp.getAttribute('data-chest-type');
                const qty = parseInt(inp.value || '0', 10) || 0;
                if (cType && qty > 0) chests[cType] = qty;
            });
            const spec = {
                gems: document.getElementById('admin-gift-gems-input')?.value,
                coins: document.getElementById('admin-gift-coins-input')?.value,
                chests,
                battlePass: Boolean(document.getElementById('admin-gift-bp-check')?.checked),
                note: document.getElementById('admin-gift-note-input')?.value
            };
            const clean = this.sanitizeGiftSpec(spec);
            if (clean.isEmpty) {
                if (adminPanel) adminPanel.showToast('Pick at least Diamonds, Gold, Chests, or Battle Pass VIP.', 'warn');
                return;
            }
            const summaryText = this.formatGiftSummary(clean);
            if (!confirm(`Send Dev Gift to ${targetInfo.name} (${targetInfo.tag})?\n\n${summaryText}`)) return;

            try {
                sendBtn.disabled = true;
                sendBtn.textContent = 'SENDING...';
                const res = await this.sendGiftToPlayer(targetInfo, clean);
                if (adminPanel) adminPanel.showToast(`Sent to ${targetInfo.name}: ${res.summary}`);
                this.closeComposer();
                document.getElementById('admin-btn-lookup-account')?.click();
            } catch (err) {
                sendBtn.disabled = false;
                sendBtn.textContent = 'SEND DEV GIFT 🎁';
                if (adminPanel) adminPanel.showToast(`Gift failed: ${err.message}`, 'error');
            }
        });

        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    static _getClaimedSet() {
        if (typeof localStorage === 'undefined') return new Set();
        try {
            const raw = localStorage.getItem(this.CLAIMED_STORAGE_KEY);
            const arr = raw ? JSON.parse(raw) : [];
            return Array.isArray(arr) ? new Set(arr.filter(Boolean)) : new Set();
        } catch (_) {
            return new Set();
        }
    }

    static _markClaimedIds(ids) {
        if (typeof localStorage === 'undefined' || !Array.isArray(ids) || ids.length === 0) return;
        const arr = Array.from(this._getClaimedSet());
        for (const id of ids) {
            if (id && !arr.includes(id)) arr.push(id);
        }
        const trimmed = arr.slice(-this.MAX_CLAIMED_HISTORY);
        try { localStorage.setItem(this.CLAIMED_STORAGE_KEY, JSON.stringify(trimmed)); } catch (_) {}
    }

    static scheduleClaimRetry(cloudData, cloudSave) {
        if (this._retryTimer) clearTimeout(this._retryTimer);
        this._retryTimer = setTimeout(() => {
            this._retryTimer = null;
            this.claimPendingGifts(cloudData, cloudSave);
        }, 1200);
    }

    static _grantCurrencies(totalCoins, totalGems, cloudSave) {
        if (totalCoins <= 0 && totalGems <= 0) return;
        const ui = typeof window !== 'undefined' ? window.uiController : null;
        const gs = typeof window !== 'undefined' ? window.GameState : null;
        if (ui && typeof ui.setCoins === 'function' && typeof ui.setGems === 'function') {
            if (totalCoins > 0) ui.setCoins((ui.coins || 0) + totalCoins, true);
            if (totalGems > 0) ui.setGems((ui.gems || 0) + totalGems, true);
        } else if (gs && typeof gs.addCurrency === 'function') {
            gs.addCurrency(totalCoins, totalGems);
        } else if (typeof localStorage !== 'undefined') {
            if (totalCoins > 0) {
                const nextC = (parseInt(localStorage.getItem('lesaio_coins') || '0', 10) || 0) + totalCoins;
                localStorage.setItem('lesaio_coins', String(nextC));
            }
            if (totalGems > 0) {
                const nextG = (parseInt(localStorage.getItem('lesaio_gems') || '0', 10) || 0) + totalGems;
                localStorage.setItem('lesaio_gems', String(nextG));
            }
        }
        if (cloudSave && gs && gs.player) {
            cloudSave.lastSeenCoins = cloudSave.lastSavedCoins = gs.player.coins;
            cloudSave.lastSeenGold = gs.player.coins;
            cloudSave.lastSeenGems = cloudSave.lastSavedGems = gs.player.gems;
            cloudSave.lastSeenDiamonds = gs.player.gems;
        }
    }

    static _grantChests(chestTotals) {
        const entries = Object.entries(chestTotals).filter(([id, qty]) => this.CHEST_ORDER.includes(id) && qty > 0);
        if (entries.length === 0) return;
        const cm = typeof window !== 'undefined' ? window.chestManager : null;
        const im = typeof window !== 'undefined' ? window.inventoryManager : null;

        for (const [type, qty] of entries) {
            if (cm && typeof cm.addChest === 'function') {
                for (let i = 0; i < qty; i++) cm.addChest(type, { ready: true });
            } else if (im && typeof im.addChestToInventory === 'function') {
                im.addChestToInventory(type, qty, { freeOpen: true });
            } else if (typeof localStorage !== 'undefined') {
                try {
                    const inv = JSON.parse(localStorage.getItem('lesaio_inventory') || '{}') || {};
                    if (!inv.chests || typeof inv.chests !== 'object') inv.chests = {};
                    if (!inv.freeChests || typeof inv.freeChests !== 'object') inv.freeChests = {};
                    inv.chests[type] = (inv.chests[type] || 0) + qty;
                    inv.freeChests[type] = (inv.freeChests[type] || 0) + qty;
                    localStorage.setItem('lesaio_inventory', JSON.stringify(inv));
                } catch (_) {}
            }
        }
    }

    static _grantBattlePassVip() {
        const bp = typeof window !== 'undefined' ? window.battlePassManager : null;
        if (bp) {
            if (!bp.hasPremium) {
                bp.hasPremium = true;
                bp.save();
            }
        } else if (typeof localStorage !== 'undefined') {
            try {
                const cur = JSON.parse(localStorage.getItem('lesaio_battle_pass_s1') || '{}') || {};
                cur.season = cur.season || 'season_1';
                cur.hasPremium = true;
                localStorage.setItem('lesaio_battle_pass_s1', JSON.stringify(cur));
                if (typeof window !== 'undefined' && window.GameState && window.GameState.player) {
                    window.GameState.player.battlePass = cur;
                }
            } catch (_) {}
        }
        if (typeof window !== 'undefined') {
            if (window.battlePassModalUI && typeof window.battlePassModalUI.render === 'function') {
                window.battlePassModalUI.render();
            }
            if (window.friendService && typeof window.friendService.syncMyProfile === 'function') {
                window.friendService.syncMyProfile(true);
            }
            if (typeof ProfileCosmeticsUI !== 'undefined' && typeof ProfileCosmeticsUI.refreshHeaderPreview === 'function') {
                ProfileCosmeticsUI.refreshHeaderPreview();
            }
        }
    }

    static _isBootOverlayActive() {
        if (typeof document === 'undefined') return false;
        const blockers = ['loading-screen', 'dev-intro-overlay', 'first-time-name-modal', 'mazonakis-tribute-modal'];
        for (const id of blockers) {
            const el = document.getElementById(id);
            if (el && !el.classList.contains('hidden') && el.style.display !== 'none') return true;
        }
        return false;
    }

    static _aggregateGifts(gifts) {
        let totalCoins = 0;
        let totalGems = 0;
        const chestTotals = {};
        let grantVip = false;
        const notes = [];
        for (const gift of gifts) {
            totalCoins += Math.max(0, Math.floor(Number(gift.coins) || 0));
            totalGems += Math.max(0, Math.floor(Number(gift.gems) || 0));
            if (gift.battlePass) grantVip = true;
            if (gift.chests && typeof gift.chests === 'object') {
                for (const [k, v] of Object.entries(gift.chests)) {
                    const qty = Math.min(99, Math.max(0, Math.floor(Number(v) || 0)));
                    if (this.CHEST_ORDER.includes(k) && qty > 0) chestTotals[k] = (chestTotals[k] || 0) + qty;
                }
            }
            if (gift.note && String(gift.note).trim()) notes.push(String(gift.note).trim());
        }
        return { totalCoins, totalGems, chestTotals, grantVip, notes };
    }

    static claimPendingGifts(cloudData, cloudSave) {
        if (!cloudData || !Array.isArray(cloudData.devGifts) || cloudData.devGifts.length === 0) return false;

        const claimedSet = this._getClaimedSet();
        const pending = cloudData.devGifts.filter(g => g && typeof g === 'object' && g.id && !claimedSet.has(g.id));
        if (pending.length === 0) return false;

        this._pendingPopupGifts = pending;
        if (cloudSave) this._lastCloudSave = cloudSave;

        if (typeof document === 'undefined') {
            return this.confirmClaimPendingGifts(pending, cloudSave);
        }

        if (this._isBootOverlayActive()) {
            if (!this._bootWaitTimer) {
                this._bootWaitTimer = setTimeout(() => {
                    this._bootWaitTimer = null;
                    if (this._pendingPopupGifts.length > 0) {
                        this.showGiftClaimModal(this._pendingPopupGifts, this._lastCloudSave);
                    }
                }, 700);
            }
            return true;
        }

        this.showGiftClaimModal(pending, cloudSave);
        return true;
    }

    static showGiftClaimModal(pendingGifts = this._pendingPopupGifts, cloudSave = this._lastCloudSave) {
        if (typeof document === 'undefined' || !Array.isArray(pendingGifts) || pendingGifts.length === 0) return;
        if (this._isBootOverlayActive()) {
            this.claimPendingGifts({ devGifts: pendingGifts }, cloudSave);
            return;
        }

        const sig = pendingGifts.map(g => g.id).join('|');
        let modal = document.getElementById('dev-gift-claim-modal');
        if (modal && !modal.classList.contains('hidden') && this._activePopupSignature === sig) return;
        this._activePopupSignature = sig;

        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'dev-gift-claim-modal';
            modal.className = 'modal-overlay dev-gift-modal-overlay hidden';
            const layer = document.querySelector('.ui-layer') || document.body;
            layer.appendChild(modal);
        }

        const { totalCoins, totalGems, chestTotals, grantVip, notes } = this._aggregateGifts(pendingGifts);
        const cards = [];

        if (totalGems > 0) {
            cards.push(`<div class="dev-gift-reward-card is-gems"><img src="assets/ui-icons/gem.svg" class="dev-gift-reward-icon" alt="Diamonds"><div class="dev-gift-reward-amount">+${totalGems.toLocaleString()}</div><div class="dev-gift-reward-label">DIAMONDS</div></div>`);
        }
        if (totalCoins > 0) {
            cards.push(`<div class="dev-gift-reward-card is-coins"><img src="assets/ui-icons/coin.svg" class="dev-gift-reward-icon" alt="Gold"><div class="dev-gift-reward-amount">+${totalCoins.toLocaleString()}</div><div class="dev-gift-reward-label">GOLD COINS</div></div>`);
        }
        for (const [type, qty] of Object.entries(chestTotals)) {
            if (qty <= 0) continue;
            const reg = (typeof CHEST_TYPES !== 'undefined' && CHEST_TYPES && CHEST_TYPES[type]) ? CHEST_TYPES[type] : null;
            const icon = (reg && reg.icon) ? reg.icon : (this.CHEST_ICONS[type] || 'assets/Chests/CommonChest.png');
            const label = (reg && reg.name) ? reg.name : (this.CHEST_LABELS[type] || type);
            cards.push(`<div class="dev-gift-reward-card is-chest rarity-${this._escHtml(type)}"><img src="${this._escHtml(icon)}" class="dev-gift-reward-icon is-chest-img" alt="${this._escHtml(label)}"><div class="dev-gift-reward-amount">&times;${qty}</div><div class="dev-gift-reward-label">${this._escHtml(label.toUpperCase())}</div></div>`);
        }
        if (grantVip) {
            cards.push(`<div class="dev-gift-reward-card is-vip"><div class="dev-gift-vip-crown">👑</div><div class="dev-gift-reward-amount">VIP PASS</div><div class="dev-gift-reward-label">SEASON BATTLE PASS</div></div>`);
        }

        const noteHtml = notes.length > 0
            ? `<div class="dev-gift-message-box"><div class="dev-gift-message-tag">💬 MESSAGE FROM DEVELOPER</div><div class="dev-gift-message-text">${notes.map(n => `&ldquo;${this._escHtml(n)}&rdquo;`).join('<br>')}</div></div>`
            : '';

        modal.innerHTML = `
            <div class="modal-panel dev-gift-popup-panel">
                <div class="dev-gift-eyebrow">👑 OFFICIAL DEVELOPER GIFT</div>
                <h2 class="modal-title dev-gift-popup-title">🎁 GIFT FOR YOU!</h2>
                <p class="dev-gift-popup-sub">The developer sent special rewards to your account!</p>
                ${noteHtml}
                <div class="dev-gift-rewards-grid">${cards.join('')}</div>
                <div class="dev-gift-popup-actions">
                    <button type="button" id="dev-gift-claim-btn" class="comic-btn comic-btn-primary dev-gift-claim-btn">CLAIM GIFT 🎁</button>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
        if (typeof window !== 'undefined' && window.soundEngine && typeof window.soundEngine.playPickup === 'function') {
            window.soundEngine.playPickup('star');
        }

        modal.querySelector('#dev-gift-claim-btn')?.addEventListener('click', () => {
            this.confirmClaimPendingGifts(pendingGifts, cloudSave);
        });
    }

    static hideGiftClaimModal() {
        this._activePopupSignature = '';
        const modal = typeof document !== 'undefined' ? document.getElementById('dev-gift-claim-modal') : null;
        if (modal) modal.classList.add('hidden');
    }

    static confirmClaimPendingGifts(giftsToClaim = this._pendingPopupGifts, cloudSave = this._lastCloudSave) {
        const claimedSet = this._getClaimedSet();
        const pending = (Array.isArray(giftsToClaim) ? giftsToClaim : []).filter(g => g && g.id && !claimedSet.has(g.id));
        this._pendingPopupGifts = [];
        this.hideGiftClaimModal();
        if (pending.length === 0) return false;

        this._markClaimedIds(pending.map(g => g.id));
        const { totalCoins, totalGems, chestTotals, grantVip } = this._aggregateGifts(pending);

        this._grantCurrencies(totalCoins, totalGems, cloudSave);
        this._grantChests(chestTotals);
        if (grantVip) this._grantBattlePassVip();

        const summary = this.formatGiftSummary({
            gems: totalGems,
            coins: totalCoins,
            chests: chestTotals,
            battlePass: grantVip
        });

        if (typeof window !== 'undefined') {
            if (window.soundEngine) {
                if (typeof window.soundEngine.playLevelUp === 'function') window.soundEngine.playLevelUp();
                else if (typeof window.soundEngine.playPickup === 'function') window.soundEngine.playPickup('star');
            }
            if (summary && window.modalManager && typeof window.modalManager.showQuickToast === 'function') {
                window.modalManager.showQuickToast(`🎁 Claimed: ${summary}!`, 3200);
            }
            if (window.SaveManager && typeof window.SaveManager.saveLocalOnly === 'function') {
                window.SaveManager.saveLocalOnly();
            }
            if (cloudSave && cloudSave.db) {
                const uid = cloudSave.getEffectivePlayerUid();
                if (uid && typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) {
                    cloudSave.db.collection('players').doc(uid).update({
                        devGifts: firebase.firestore.FieldValue.arrayRemove(...pending)
                    }).catch(() => {});
                }
                setTimeout(() => {
                    if (window.SaveSerializer && window.GameState) {
                        const payload = window.SaveSerializer.serialize(window.GameState);
                        if (payload) cloudSave.saveToCloud(payload);
                    }
                }, 200);
            }
        }

        return true;
    }
}

if (typeof window !== 'undefined') {
    window.DevGiftManager = DevGiftManager;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DevGiftManager };
}
