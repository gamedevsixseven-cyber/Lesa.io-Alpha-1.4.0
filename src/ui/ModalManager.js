/**
 * Lesa.io - Master Modal & Dialog Stack Manager
 * Handles modal stack navigation, red "X" close buttons, backdrop click-to-dismiss, and QoL shortcuts
 */

class ModalManager {
    constructor() {
        this.featureModal = document.getElementById('generic-feature-modal');
        this.featureTitle = document.getElementById('feature-modal-title');
        this.featureDesc = document.getElementById('feature-modal-desc');
        this.featureContent = document.getElementById('feature-modal-content');

        this.weaponsModal = document.getElementById('weapons-modal');
        this.upgradesModal = document.getElementById('upgrades-modal');
        this.inventoryModal = document.getElementById('inventory-modal');
        this.talentsModal = document.getElementById('talents-modal');

        this.initEvents();
        if (typeof GearModalUI !== 'undefined') {
            GearModalUI.init();
        }
    }

    initEvents() {
        // Red "X" close buttons
        document.querySelectorAll('.modal-close-x-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.soundEngine && typeof window.soundEngine.playGoBack === 'function') {
                    window.soundEngine.playGoBack();
                }
                this.closeTopmostModal();
            });
        });

        // QoL: Backdrop Click to Close (clicking dark area outside the dialog)
        document.querySelectorAll('.modal-overlay').forEach((overlay) => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    if (window.soundEngine && typeof window.soundEngine.playGoBack === 'function') {
                        window.soundEngine.playGoBack();
                    }
                    this.closeTopmostModal();
                }
            });
        });

        // Bottom "Done" and "OK" buttons
        const closeBtn = document.getElementById('close-feature-modal-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playGoBack();
                this.hideFeatureModal();
            });
        }

        const closeWeaponsBtn = document.getElementById('close-weapons-btn');
        if (closeWeaponsBtn) {
            closeWeaponsBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playGoBack();
                this.hideWeaponsModal();
            });
        }

        // Weapon Cards Click to Equip
        document.querySelectorAll('#weapons-modal .weapon-card').forEach((card) => {
            card.addEventListener('click', () => {
                const wt = card.getAttribute('data-weapon');
                if (wt) {
                    if (wt === 'bubble') {
                        const isBubbleUnlocked = (window.GameState && window.GameState.player && window.GameState.player.unlockedWeapons && window.GameState.player.unlockedWeapons.includes('bubble')) || localStorage.getItem('lesaio_weapon_bubble_unlocked') === 'true';
                        if (!isBubbleUnlocked) {
                            if (window.soundEngine && typeof window.soundEngine.playBuzzer === 'function') {
                                window.soundEngine.playBuzzer();
                            }
                            return;
                        }
                    }

                    if (window.GameState && window.GameState.player) {
                        window.GameState.player.weaponType = wt;
                    }
                    localStorage.setItem('lesaio_selected_weapon', wt);
                    this.updateGearScreen();
                    if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
                        window.soundEngine.playSelect();
                    }
                }
            });
        });

        const closeUpgradesBtn = document.getElementById('close-upgrades-btn');
        if (closeUpgradesBtn) {
            closeUpgradesBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playGoBack();
                this.hideUpgradesModal();
            });
        }

        const closeInventoryBtn = document.getElementById('close-inventory-btn');
        if (closeInventoryBtn) {
            closeInventoryBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playGoBack();
                this.hideInventoryModal();
            });
        }

        const closeTalentsBtn = document.getElementById('close-talents-btn');
        if (closeTalentsBtn) {
            closeTalentsBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playGoBack();
                this.hideTalentsModal();
            });
        }

        // Global Escape Key Listener & [M] Audio Mute Shortcut
        window.addEventListener('keydown', (e) => {
            // Ignore shortcut keys if user is typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'Escape') {
                this.closeTopmostModal();
            } else if (e.key === 'm' || e.key === 'M') {
                this.toggleAudioMute();
            }
        });

        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.on('upgradesUpdated', () => this.updateGearScreen());
            window.EventBus.on('heroSelected', () => this.updateGearScreen());
        }
    }

    /**
     * QoL: Toggle Audio Mute with [M] key
     */
    toggleAudioMute() {
        if (!window.soundEngine) return;

        const currentMuted = window.soundEngine.muted;
        const newMuted = !currentMuted;

        window.soundEngine.muted = newMuted;
        window.soundEngine.bgmMuted = newMuted;
        localStorage.setItem('lesaio_muted', newMuted.toString());
        localStorage.setItem('lesaio_bgm_muted', newMuted.toString());

        if (window.soundEngine.menuMusic) {
            window.soundEngine.menuMusic.volume = newMuted ? 0 : window.soundEngine.bgmVolume;
        }

        this.showQuickToast(newMuted ? '🔇 Audio Muted [M]' : '🔊 Audio Enabled [M]');
    }

    /**
     * QoL Quick Floating Toast
     */
    showQuickToast(message) {
        let toast = document.getElementById('qol-floating-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'qol-floating-toast';
            toast.style.position = 'fixed';
            toast.style.bottom = '24px';
            toast.style.left = '50%';
            toast.style.transform = 'translateX(-50%)';
            toast.style.background = '#2f3542';
            toast.style.color = '#fed330';
            toast.style.border = '3px solid var(--dark-outline)';
            toast.style.borderRadius = '16px';
            toast.style.padding = '8px 20px';
            toast.style.fontFamily = "'Luckiest Guy', cursive";
            toast.style.fontSize = '1.05rem';
            toast.style.boxShadow = '3px 3px 0 var(--dark-outline)';
            toast.style.zIndex = '9999';
            toast.style.pointerEvents = 'none';
            toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';

        if (this._toastTimer) clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(10px)';
        }, 1400);
    }

    // Gear & Equipment Modal (Survivor.io Style)
    showWeaponsModal() {
        this.updateGearScreen();
        if (this.weaponsModal) this.weaponsModal.classList.remove('hidden');
    }
    showGearModal() {
        this.showWeaponsModal();
    }
    hideWeaponsModal() {
        if (this.weaponsModal) this.weaponsModal.classList.add('hidden');
    }
    hideGearModal() {
        this.hideWeaponsModal();
    }

    updateWeaponsModal() {
        this.updateGearScreen();
    }

    updateGearScreen() {
        const heroKey = (typeof window !== 'undefined' && window.GameState && window.GameState.player && window.GameState.player.selectedHero) || localStorage.getItem('lesaio_selected_hero') || 'psanas';
        const heroData = (typeof HEROES !== 'undefined' && HEROES[heroKey]) || {
            name: 'Psanas',
            avatar: 'assets/HeroesIcons/PsanasAvatar.png',
            stats: { atk: 25, hp: 100, def: 0 },
            weaponType: 'pea'
        };

        const heroAvatar = document.getElementById('gear-hero-avatar');
        const heroName = document.getElementById('gear-hero-name');
        const totalAtk = document.getElementById('gear-total-atk');
        const totalHp = document.getElementById('gear-total-hp');
        const totalDef = document.getElementById('gear-total-def');

        if (heroAvatar) heroAvatar.src = heroData.avatar || 'assets/HeroesIcons/PsanasAvatar.png';
        if (heroName) heroName.textContent = (heroData.name || heroKey).toUpperCase();

        // Default weapons mapping per hero
        const HERO_DEFAULT_WEAPONS = {
            psanas: 'pea',
            psogas: 'pepper',
            petros: 'watermelon',
            '50balos': 'money_gun'
        };

        const currentHeroWeapon = HERO_DEFAULT_WEAPONS[heroKey] || heroData.weaponType || 'pea';
        const otherHeroWeapons = Object.entries(HERO_DEFAULT_WEAPONS)
            .filter(([k]) => k !== heroKey)
            .map(([_, w]) => w);

        let weaponType = (typeof window !== 'undefined' && window.GameState && window.GameState.player && window.GameState.player.weaponType) || localStorage.getItem('lesaio_selected_weapon') || currentHeroWeapon;

        // If equipped weapon belongs to another hero or is locked bubble gun, reset to current hero's weapon
        const isBubbleUnlocked = (window.GameState && window.GameState.player && window.GameState.player.unlockedWeapons && window.GameState.player.unlockedWeapons.includes('bubble')) || localStorage.getItem('lesaio_weapon_bubble_unlocked') === 'true';
        if (otherHeroWeapons.includes(weaponType) || (weaponType === 'bubble' && !isBubbleUnlocked)) {
            weaponType = currentHeroWeapon;
            if (window.GameState && window.GameState.player) {
                window.GameState.player.weaponType = weaponType;
            }
            localStorage.setItem('lesaio_selected_weapon', weaponType);
        }

        // Calculate authentic hero & gear stats (ATK = weapon damage + gear bonus, HP = hero HP + upgrades + gear HP)
        const upgrades = (typeof window !== 'undefined' && window.GameState && window.GameState.player && window.GameState.player.upgrades) || {};
        const maxHealthBonus = (upgrades.maxHealth || 0) * 6;
        const gearStats = (typeof GearManager !== 'undefined') ? GearManager.getEquippedTotalStats() : {};
        const armorHp = (typeof window !== 'undefined' && window.GameState && window.GameState.player && window.GameState.player.armorHp) || gearStats.maxHp || 0;
        const baseHeroHp = typeof heroData.hp === 'number' ? heroData.hp : ((heroData.stats && heroData.stats.hp) || 100);
        const calculatedHp = baseHeroHp + maxHealthBonus + armorHp;

        const weaponData = (typeof WEAPONS !== 'undefined' && WEAPONS[weaponType]) || (window.WEAPONS && window.WEAPONS[weaponType]) || {};
        const baseWeaponAtk = typeof weaponData.baseDamage === 'number' ? weaponData.baseDamage : ((heroData.stats && heroData.stats.atk) || 25);
        const bonusAtk = Math.round(baseWeaponAtk * ((gearStats.bulletDamage || 0) / 100));
        const calculatedAtk = baseWeaponAtk + bonusAtk;

        const calculatedDef = (heroData.def || (heroData.stats && heroData.stats.def) || 0) + (gearStats.damageReduction || 0);

        if (totalAtk) totalAtk.textContent = calculatedAtk;
        if (totalHp) totalHp.textContent = calculatedHp;
        if (totalDef) totalDef.textContent = `${calculatedDef}%`;

        const weaponNames = { pea: 'Pea Slingshot', watermelon: 'Melon Cannon', pepper: 'Chili Blaster', bubble: 'Bubble Gun', money_gun: 'Money Gun' };
        const weaponImages = {
            pea: 'assets/WeaponIcons/PeaSlingshot.png',
            watermelon: 'assets/WeaponIcons/MelonCannon.png',
            pepper: 'assets/WeaponIcons/ChilliBlaster.png',
            bubble: 'assets/WeaponIcons/BubbleGun.png',
            money_gun: 'assets/WeaponIcons/MoneyGun.png'
        };

        const weaponNameEl = document.getElementById('gear-equipped-weapon-name');
        const weaponImgEl = document.getElementById('gear-slot-weapon-img');
        const weaponEmojiEl = document.getElementById('gear-slot-weapon-emoji');
        if (weaponNameEl) weaponNameEl.textContent = weaponNames[weaponType] || 'Pea Slingshot';
        if (weaponImgEl) weaponImgEl.src = weaponImages[weaponType] || 'assets/WeaponIcons/PeaSlingshot.png';
        if (weaponEmojiEl) weaponEmojiEl.textContent = '';

        // Filter cards so other heroes' default weapons are hidden
        let visibleCount = 0;
        const cards = document.querySelectorAll('#weapons-modal .weapon-card');
        cards.forEach((card) => {
            const wt = card.getAttribute('data-weapon');
            if (otherHeroWeapons.includes(wt)) {
                card.style.display = 'none';
                card.classList.remove('active-weapon');
                return;
            }

            // If player doesn't own this weapon, remove it and don't show it in the Gear Inventory
            if (wt === 'bubble' && !isBubbleUnlocked) {
                card.style.display = 'none';
                card.classList.remove('active-weapon');
                return;
            }

            card.style.display = '';
            visibleCount++;

            const badge = card.querySelector('.weapon-badge');

            if (wt === weaponType) {
                card.classList.add('active-weapon');
                if (badge) {
                    badge.textContent = 'EQUIPPED';
                    badge.className = 'weapon-badge badge-equipped';
                }
            } else {
                card.classList.remove('active-weapon');
                if (badge) {
                    if (wt === 'pea') { badge.textContent = 'PSANAS GEAR'; badge.className = 'weapon-badge badge-psanas'; }
                    else if (wt === 'watermelon') { badge.textContent = 'PETROS GEAR'; badge.className = 'weapon-badge badge-petros'; }
                    else if (wt === 'pepper') { badge.textContent = 'PSOGAS GEAR'; badge.className = 'weapon-badge badge-psogas'; }
                    else if (wt === 'money_gun') { badge.textContent = '50BALOS GEAR'; badge.className = 'weapon-badge badge-50balos'; }
                    else {
                        const wData = (window.WEAPONS && window.WEAPONS[wt]) || {};
                        const rName = wData.rarity || 'Exclusive';
                        badge.textContent = rName.toUpperCase();
                        badge.className = `weapon-badge badge-${rName.toLowerCase()}`;
                    }
                }
            }
        });

        const invBadge = document.getElementById('gear-inv-badge-count') || document.querySelector('.gear-inv-badge');
        if (invBadge && (typeof GearModalUI === 'undefined' || GearModalUI.currentTab === 'weapon')) {
            invBadge.textContent = `${visibleCount} WEAPON${visibleCount === 1 ? '' : 'S'} AVAILABLE`;
        }

        if (typeof GearModalUI !== 'undefined') {
            GearModalUI.renderAll();
        }
    }

    // Power Upgrades Modal
    showUpgradesModal() {
        if (window.upgradeManager && typeof window.upgradeManager.render === 'function') {
            window.upgradeManager.render();
        }
        if (this.upgradesModal) this.upgradesModal.classList.remove('hidden');
    }
    hideUpgradesModal() {
        if (this.upgradesModal) this.upgradesModal.classList.add('hidden');
    }

    // Player Inventory Modal
    showInventoryModal() {
        if (this.inventoryModal) this.inventoryModal.classList.remove('hidden');
        if (typeof window !== 'undefined' && window.inventoryModalUI && typeof window.inventoryModalUI.render === 'function') {
            window.inventoryModalUI.render();
        }
    }
    hideInventoryModal() {
        if (this.inventoryModal) this.inventoryModal.classList.add('hidden');
    }

    // Perks Loadout Modal (Call of Duty Style 3 Slots)
    showPerksModal() {
        this.showTalentsModal();
    }
    hidePerksModal() {
        this.hideTalentsModal();
    }
    showTalentsModal() {
        if (this.talentsModal) this.talentsModal.classList.remove('hidden');
        if (window.perkManager) {
            window.perkManager.render();
        } else if (window.uiController && window.uiController.perkManager) {
            window.uiController.perkManager.render();
        }
    }
    hideTalentsModal() {
        if (this.talentsModal) this.talentsModal.classList.add('hidden');
    }

    /**
     * Show Feature Announcement or Preview Modal
     */
    showFeatureModal(title, desc, content) {
        if (this.featureTitle) this.featureTitle.textContent = title;
        if (this.featureDesc) this.featureDesc.textContent = desc;
        if (this.featureContent) this.featureContent.textContent = content;
        if (this.featureModal) this.featureModal.classList.remove('hidden');
    }

    hideFeatureModal() {
        if (this.featureModal) this.featureModal.classList.add('hidden');
    }

    /**
     * Close whichever modal is currently active on top
     */
    closeTopmostModal() {
        const ui = window.uiController;
        if (!ui) return;

        if (ui.profileManager && ui.profileManager.firstTimeNameModal && !ui.profileManager.firstTimeNameModal.classList.contains('hidden')) {
            return; // Must submit name first time
        }

        const chestModal = document.getElementById('chest-action-modal');
        if (chestModal && !chestModal.classList.contains('hidden')) {
            if (typeof ChestModalUI !== 'undefined' && typeof ChestModalUI.hide === 'function') {
                ChestModalUI.hide();
            } else {
                chestModal.classList.add('hidden');
            }
            return;
        }

        if (ui.starterPackModal && ui.starterPackModal.modal && !ui.starterPackModal.modal.classList.contains('hidden')) {
            ui.starterPackModal.hide();
        } else if (this.weaponsModal && !this.weaponsModal.classList.contains('hidden')) {
            this.hideWeaponsModal();
        } else if (this.upgradesModal && !this.upgradesModal.classList.contains('hidden')) {
            this.hideUpgradesModal();
        } else if (this.inventoryModal && !this.inventoryModal.classList.contains('hidden')) {
            this.hideInventoryModal();
        } else if (this.talentsModal && !this.talentsModal.classList.contains('hidden')) {
            this.hideTalentsModal();
        } else if (ui.skillManager && ui.skillManager.skillsModal && !ui.skillManager.skillsModal.classList.contains('hidden')) {
            ui.skillManager.hideSkillsModal();
        } else if (ui.heroRoster && ui.heroRoster.heroesModal && !ui.heroRoster.heroesModal.classList.contains('hidden')) {
            ui.heroRoster.hideHeroesModal();
        } else if (ui.profileManager && ui.profileManager.renameModal && !ui.profileManager.renameModal.classList.contains('hidden')) {
            ui.profileManager.hideRenameModal();
        } else if (ui.profileManager && ui.profileManager.playerProfileModal && !ui.profileManager.playerProfileModal.classList.contains('hidden')) {
            ui.profileManager.hideProfileModal();
        } else if (ui.mailManager && ui.mailManager.mailModal && !ui.mailManager.mailModal.classList.contains('hidden')) {
            ui.mailManager.hideMailModal();
        } else if (ui.dailyQuestsModal && !ui.dailyQuestsModal.classList.contains('hidden')) {
            ui.hideDailyQuestsModal();
        } else if (ui.settingsManager && ui.settingsManager.settingsModal && !ui.settingsManager.settingsModal.classList.contains('hidden')) {
            ui.settingsManager.hideSettingsModal();
        } else if (this.featureModal && !this.featureModal.classList.contains('hidden')) {
            if (window.soundEngine) window.soundEngine.playGoBack();
            this.hideFeatureModal();
        }
    }
}

if (typeof window !== 'undefined') {
    window.ModalManager = ModalManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ModalManager };
}
