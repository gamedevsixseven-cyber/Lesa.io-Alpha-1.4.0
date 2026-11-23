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
            if (localStorage.getItem(this.UPDATE_110_KEY) === 'true') return;
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
            if (localStorage.getItem(this.UPDATE_110_KEY) === 'true') return;
            localStorage.setItem(this.UPDATE_110_KEY, 'true');
        } catch (_) {}

        let modal = document.getElementById('update-110-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'update-110-modal';
            modal.className = 'modal-overlay hidden';
            const layer = document.querySelector('.ui-layer') || document.body;
            layer.appendChild(modal);
        }

        const ico = (k) => (typeof UiIcons !== 'undefined') ? UiIcons.i(k, 'ui-icon-sm') : '';
        modal.innerHTML = `
            <div class="modal-panel tribute-modal-panel" style="max-width: 520px !important;">
                <div class="tribute-header-banner">
                    <div class="tribute-dove-badge"><img src="assets/GearUIIcons/DEF.png" class="ui-icon ui-icon-box" alt=""></div>
                    <h2 class="tribute-title">UPDATE 1.1.0</h2>
                    <div class="tribute-years">THE CLANS UPDATE</div>
                </div>
                <div class="tribute-quote-box" style="text-align: left; padding: 16px 20px;">
                    <p class="tribute-intro" style="text-align: center; font-style: normal; margin-bottom: 10px;">
                        Squad up with your Clan, wield 4 new weapons &amp; inspect rivals!
                    </p>
                    <p class="tribute-body" style="margin: 6px 0;">${ico('shield')} <strong>Clans System:</strong> Guild Hall perks, Tax Vault, Weekly Bounties, Honor Crest Shop, Role Promotions &amp; Live Clan Chat</p>
                    <p class="tribute-body" style="margin: 6px 0;">${ico('swords')} <strong>4 New Weapons:</strong> Skewer Charcoal Rifle, Hephaestus Vulcan Minigun, Hades Oblivion Railgun &amp; Medusa&apos;s Gorgon Gaze</p>
                    <p class="tribute-body" style="margin: 6px 0;">${ico('hero_card')} <strong>View Players&apos; Gear &amp; Weapons:</strong> Inspect Equipped Gear &amp; Weapon Collections (with Privacy toggles in Settings)</p>
                    <p class="tribute-body" style="margin: 6px 0;">${ico('chat')} <strong>QoL &amp; Social Polish:</strong> Direct Messages in Friends List, unread badges &amp; crisp SVG Friends UI overhaul</p>
                    <p class="tribute-body" style="margin: 6px 0;">${ico('bolt')} <strong>Performance &amp; Fixes:</strong> Spatial Hash Grid collision &amp; off-screen swarm optimization, mobile FPS boosts &amp; bug fixes</p>
                </div>
                <div class="modal-actions" style="margin-top: 14px;">
                    <button type="button" id="dismiss-update-110-btn" class="comic-btn tribute-claim-btn">LET&apos;S GO!</button>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
        if (window.soundEngine && typeof window.soundEngine.playPickup === 'function') {
            window.soundEngine.playPickup('star');
        }

        const dismissBtn = modal.querySelector('#dismiss-update-110-btn');
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => this.hideUpdateNoticeModal());
        }
    }

    static hideUpdateNoticeModal() {
        try {
            localStorage.setItem(this.UPDATE_110_KEY, 'true');
        } catch (_) {}
        const modal = typeof document !== 'undefined' ? document.getElementById('update-110-modal') : null;
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
