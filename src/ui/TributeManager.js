/**
 * Lesa.io - Giorgos Mazonakis Memorial Tribute Manager
 * Active: September 9, 2026 – September 13, 2026 (23:59:59)
 * 1-Time Only Player Reward:
 * - Exclusive Armor: Sakaki ths Nuxtas (+80 Max HP, +3% Move Speed, +8% Damage Reduction)
 * - 1,000 Gold Coins
 * - 50 Diamonds
 */

class TributeManager {
    static STORAGE_KEY = 'lesaio_mazonakis_tribute_claimed';
    static UPDATE_101_KEY = 'lesaio_update_1_0_1_seen';
    static UPDATE_110_KEY = 'lesaio_update_1_1_0_seen';
    static UPDATE_111_KEY = 'lesaio_update_1_1_1_seen';
    static UPDATE_120_KEY = 'lesaio_update_1_2_0_seen';
    static UPDATE_LOCK_MS = 3000;
    static _updateUnlockAt = 0;
    static _updateTimer = null;
    static EXPIRY_DATE = new Date('2026-09-13T23:59:59');

    static isEligible() {
        try {
            const alreadyClaimed = localStorage.getItem(this.STORAGE_KEY) === 'true';
            if (alreadyClaimed) return false;

            const now = new Date();
            return now <= this.EXPIRY_DATE;
        } catch (e) {
            console.warn('[TributeManager] Notice:', e);
            return false;
        }
    }

    static checkAndShow() {
        if (this.isEligible()) {
            setTimeout(() => {
                this.showModal();
            }, 320);
            return;
        }
        this.checkAndShowUpdateNotice();
    }

    static checkAndShowUpdateNotice() {
        try {
            if (typeof document === 'undefined') return;
            if (localStorage.getItem(this.UPDATE_120_KEY) === 'true') return;
            const firstNameModal = document.getElementById('first-time-name-modal');
            if (firstNameModal && !firstNameModal.classList.contains('hidden')) return;
            setTimeout(() => {
                this.showUpdateNoticeModal();
            }, 320);
        } catch (e) {
            console.warn('[TributeManager] Update notice check failed:', e);
        }
    }

    static showUpdateNoticeModal() {
        if (typeof document === 'undefined') return;
        try {
            if (localStorage.getItem(this.UPDATE_120_KEY) === 'true') return;
        } catch (_) {}

        let modal = document.getElementById('update-120-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'update-120-modal';
            modal.className = 'modal-overlay hidden';
            const layer = document.querySelector('.ui-layer') || document.body;
            layer.appendChild(modal);
        }

        const ico = (k) => (typeof UiIcons !== 'undefined') ? UiIcons.i(k, 'ui-icon-sm') : '';
        modal.innerHTML = `
            <div class="modal-panel tribute-modal-panel update-120-panel">
                <div class="update-120-pill">🚀 WHAT'S NEW • MAJOR EXPANSION</div>
                <div class="tribute-header-banner">
                    <div class="tribute-dove-badge update-120-hero-ic"><img src="assets/ui-icons/crown.svg" class="ui-icon ui-icon-box" alt=""></div>
                    <h2 class="tribute-title update-120-title">BIG UPDATE 1.2.0</h2>
                    <div class="tribute-years update-120-sub">NEW SERVER • APEX ENDGAME • CELESTIAL TREES</div>
                </div>
                <div class="tribute-quote-box update-120-grid">
                    <div class="u120-card u120-server">
                        <div class="u120-card-hdr"><span class="u120-ic">${ico('bolt')}</span> NEW SERVER! <span class="u120-live-tag">4G / 5G BOOST</span></div>
                        <p>Brand-new high-capacity Co-op Relay Server for smoother online multiplayer, lower 4G/5G mobile ping &amp; automatic reconnects!</p>
                    </div>
                    <div class="u120-card u120-apex">
                        <div class="u120-card-hdr"><span class="u120-ic">${ico('crown')}</span> APEX RARITY &amp; BOSSES</div>
                        <p>W30 Aethelgard (1.2M HP) drops Cord &amp; Gauntlets; W60 Erebus (4.5M HP) drops Armor, Helmet &amp; Boots with Lv.6 Diamond Bonus &amp; glowing UI tabs!</p>
                    </div>
                    <div class="u120-card u120-celestial">
                        <div class="u120-card-hdr"><span class="u120-ic">${ico('sparkle')}</span> CELESTIAL SKILL TREES</div>
                        <p>Hyperion Glaive &amp; Aurelion Scepter unlock 2-path Celestial Trees with capstone traits, chest reveal FX &amp; crate/TNT breaking!</p>
                    </div>
                    <div class="u120-card u120-mythic">
                        <div class="u120-card-hdr"><span class="u120-ic">${ico('swords')}</span> CHEST GEAR &amp; ARSENAL</div>
                        <p>10 new Mythic chest armor pieces with Evos, Stormcaller Longbow &amp; Vortex Void Mortar — plus upgraded icons &amp; armor models!</p>
                    </div>
                    <div class="u120-card u120-chronos">
                        <div class="u120-card-hdr"><span class="u120-ic">${ico('hourglass')}</span> CHRONOS+ &amp; BALANCE</div>
                        <p>Chronos Hourglass gains Lv.6 Overclock (2s self-heal + zone co-op revive), Apex bosses respect range &amp; are immune to perma-stun!</p>
                    </div>
                </div>
                <div class="u120-lock-track" id="u120-lock-track"><div class="u120-lock-fill" id="u120-lock-fill"></div></div>
                <div class="modal-actions update-120-actions">
                    <button type="button" id="dismiss-update-120-btn" class="comic-btn tribute-claim-btn update-120-btn is-locked" disabled>⏳ PLEASE WAIT (3s)...</button>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
        this._unlockAt = performance.now() + this.UPDATE_LOCK_MS;
        this._updateUnlockAt = this._unlockAt;

        if (!this._escBlockerBound) {
            this._escBlockerBound = true;
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    const m = document.getElementById('update-120-modal');
                    if (m && !m.classList.contains('hidden') && performance.now() < this._updateUnlockAt) {
                        e.stopImmediatePropagation();
                        e.preventDefault();
                    }
                }
            }, true);
        }

        if (window.soundEngine && typeof window.soundEngine.playPickup === 'function') {
            window.soundEngine.playPickup('star');
        }

        if (this._updateTimer) clearInterval(this._updateTimer);
        const dismissBtn = modal.querySelector('#dismiss-update-120-btn');
        const lockFill = modal.querySelector('#u120-lock-fill');
        const lockTrack = modal.querySelector('#u120-lock-track');
        const syncCountdown = () => {
            if (!dismissBtn) return;
            const remMs = Math.max(0, this._updateUnlockAt - performance.now());
            const pct = Math.min(100, Math.round(((this.UPDATE_LOCK_MS - remMs) / this.UPDATE_LOCK_MS) * 100));
            if (lockFill) lockFill.style.width = `${pct}%`;
            if (remMs > 0) {
                const secs = Math.ceil(remMs / 1000);
                dismissBtn.disabled = true;
                dismissBtn.classList.add('is-locked');
                dismissBtn.classList.remove('is-ready');
                dismissBtn.textContent = `⏳ PLEASE WAIT (${secs}s)...`;
            } else {
                dismissBtn.disabled = false;
                dismissBtn.classList.remove('is-locked');
                dismissBtn.classList.add('is-ready');
                dismissBtn.innerHTML = `${ico('rocket')} ENTER UPDATE 1.2.0!`;
                if (lockTrack) lockTrack.classList.add('is-done');
                if (this._updateTimer) { clearInterval(this._updateTimer); this._updateTimer = null; }
            }
        };
        syncCountdown();
        this._updateTimer = setInterval(syncCountdown, 120);

        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => this.hideUpdateNoticeModal());
        }
    }

    static hideUpdateNoticeModal() {
        if (performance.now() < this._updateUnlockAt) return false;
        if (this._updateTimer) { clearInterval(this._updateTimer); this._updateTimer = null; }
        try {
            localStorage.setItem(this.UPDATE_120_KEY, 'true');
        } catch (_) {}
        const modal = typeof document !== 'undefined' ? document.getElementById('update-120-modal') : null;
        if (modal) modal.classList.add('hidden');
        if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
            window.soundEngine.playSelect();
        }
        if (typeof BossRewardModalUI !== 'undefined') {
            BossRewardModalUI.checkAndShowPending();
        }
        return true;
    }

    static showModal() {
        const modal = document.getElementById('mazonakis-tribute-modal');
        if (!modal) return;

        modal.classList.remove('hidden');

        if (window.soundEngine && typeof window.soundEngine.playPickup === 'function') {
            window.soundEngine.playPickup('star');
        }

        const claimBtn = document.getElementById('claim-tribute-btn');
        if (claimBtn && !claimBtn.dataset.bound) {
            claimBtn.dataset.bound = 'true';
            claimBtn.addEventListener('click', () => {
                this.claimReward();
            });
        }
    }

    static hideModal() {
        const modal = document.getElementById('mazonakis-tribute-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        if (typeof BossRewardModalUI !== 'undefined') {
            BossRewardModalUI.checkAndShowPending();
        }
    }

    static claimReward() {
        try {
            // 1. Mark as permanently claimed
            localStorage.setItem(this.STORAGE_KEY, 'true');

            // 2. Grant Currency (+1,000 Coins & +50 Diamonds)
            if (window.GameState && typeof window.GameState.addCurrency === 'function') {
                window.GameState.addCurrency(1000, 50);
            } else if (window.GameState && window.GameState.player) {
                window.GameState.player.coins = (window.GameState.player.coins || 0) + 1000;
                window.GameState.player.gems = (window.GameState.player.gems || 0) + 50;
            }

            // 3. Unlock Commemorative Armor Gear: gucci_blazer
            if (typeof GearManager !== 'undefined') {
                const list = GearManager.getUnlockedList();
                if (!list.includes('gucci_blazer')) {
                    list.push('gucci_blazer');
                    if (window.GameState && window.GameState.player) {
                        window.GameState.player.unlockedGear = list;
                    }
                    localStorage.setItem('lesaio_unlocked_gear', JSON.stringify(list));
                }

                // If player has no armor equipped, auto-equip the commemorative blazer
                const equipped = GearManager.getEquippedMap();
                if (!equipped.armor) {
                    GearManager.equip('gucci_blazer');
                } else {
                    GearManager.save();
                    GearManager.syncPlayerStats();
                }
            }

            // 4. Update UI
            if (window.uiController && typeof window.uiController.updateCurrencyUI === 'function') {
                window.uiController.updateCurrencyUI(true);
            }
            if (window.uiController && window.uiController.modalManager && typeof window.uiController.modalManager.updateGearScreen === 'function') {
                window.uiController.modalManager.updateGearScreen();
            }

            // 5. Save cloud progress
            if (window.cloudSave && typeof window.cloudSave.saveToCloud === 'function') {
                window.cloudSave.saveToCloud();
            }

            // 6. Sound & Visual Feedback
            if (window.soundEngine && typeof window.soundEngine.playLevelUp === 'function') {
                window.soundEngine.playLevelUp();
            } else if (window.soundEngine) {
                window.soundEngine.playPickup('heart');
            }

            if (window.gameInstance && window.gameInstance.effects && window.gameInstance.player) {
                window.gameInstance.effects.addConfetti(window.gameInstance.player.x, window.gameInstance.player.y, 40);
            }
        } catch (e) {
            console.error('[TributeManager] Error claiming tribute reward:', e);
        } finally {
            this.hideModal();
        }
    }
}

if (typeof window !== 'undefined') {
    window.TributeManager = TributeManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TributeManager };
}
