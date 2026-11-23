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
            if (localStorage.getItem(this.UPDATE_101_KEY) === 'true') return;
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
            if (localStorage.getItem(this.UPDATE_101_KEY) === 'true') return;
            localStorage.setItem(this.UPDATE_101_KEY, 'true');
        } catch (_) {}

        let modal = document.getElementById('update-101-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'update-101-modal';
            modal.className = 'modal-overlay hidden';
            const layer = document.querySelector('.ui-layer') || document.body;
            layer.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-panel tribute-modal-panel" style="max-width: 470px !important;">
                <div class="tribute-header-banner">
                    <div class="tribute-dove-badge"><img src="assets/ui-icons/gear_cog.svg" class="ui-icon ui-icon-box" alt=""></div>
                    <h2 class="tribute-title">UPDATE 1.0.1</h2>
                    <div class="tribute-years">WHAT'S NEW IN LESA.IO</div>
                </div>
                <div class="tribute-quote-box" style="text-align: left; padding: 18px 22px;">
                    <p class="tribute-intro" style="text-align: center; font-style: normal; margin-bottom: 12px;">
                        Bug fixes, performance improvements, leaderboard UI bug fixed.
                    </p>
                    <p class="tribute-body" style="margin: 6px 0;">• <strong>Bug fixes</strong></p>
                    <p class="tribute-body" style="margin: 6px 0;">• <strong>Performance improvements</strong></p>
                    <p class="tribute-body" style="margin: 6px 0;">• <strong>Leaderboard UI bug fixed</strong></p>
                </div>
                <div class="modal-actions" style="margin-top: 16px;">
                    <button type="button" id="dismiss-update-101-btn" class="comic-btn tribute-claim-btn">GOT IT!</button>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
        if (window.soundEngine && typeof window.soundEngine.playPickup === 'function') {
            window.soundEngine.playPickup('star');
        }

        const dismissBtn = modal.querySelector('#dismiss-update-101-btn');
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => this.hideUpdateNoticeModal());
        }
    }

    static hideUpdateNoticeModal() {
        try {
            localStorage.setItem(this.UPDATE_101_KEY, 'true');
        } catch (_) {}
        const modal = typeof document !== 'undefined' ? document.getElementById('update-101-modal') : null;
        if (modal) modal.classList.add('hidden');
        if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
            window.soundEngine.playSelect();
        }
        if (typeof BossRewardModalUI !== 'undefined') {
            BossRewardModalUI.checkAndShowPending();
        }
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
