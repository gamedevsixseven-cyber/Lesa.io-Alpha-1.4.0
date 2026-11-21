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

        if (typeof window !== 'undefined') {
            window.modalManager = this;
        }

        this.initEvents();
        if (typeof GearModalUI !== 'undefined') {
            GearModalUI.init();
        }
        if (typeof window !== 'undefined' && window.EventBus) {
            const refreshGearIfOpen = () => {
                if (this.weaponsModal && !this.weaponsModal.classList.contains('hidden')) {
                    this.updateGearScreen();
                }
            };
            window.EventBus.on('currencyChanged', refreshGearIfOpen);
            window.EventBus.on('currencyUpdated', refreshGearIfOpen);
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

        // Weapon Cards Click to Unlock / Equip
        document.querySelectorAll('#weapons-modal .weapon-card').forEach((card) => {
            card.addEventListener('click', (e) => {
                if (e.target && e.target.closest('[data-weapon-evolve]')) return;
                const wt = card.getAttribute('data-weapon');
                if (wt && typeof WeaponSystem !== 'undefined' && WeaponSystem.handleWeaponCardClick) {
                    WeaponSystem.handleWeaponCardClick(wt, this, card);
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
        if (window.soundEngine.creditsMusic) {
            window.soundEngine.creditsMusic.volume = newMuted ? 0 : window.soundEngine.bgmVolume;
        }

        this.showQuickToast(newMuted ? '🔇 Audio Muted [M]' : '🔊 Audio Enabled [M]');
    }

    /**
     * Render unified dark summary pills (Coins, Gems, progress counters) into a tab modal bar
     */
    static renderTabSummaryBar(containerEl, pills = []) {
        if (!containerEl) return;
        containerEl.innerHTML = pills.map((pill) => {
            const iconHtml = pill.iconKey && typeof UiIcons !== 'undefined'
                ? UiIcons.i(pill.iconKey)
                : (typeof UiIcons !== 'undefined' ? UiIcons.toHtml(pill.icon || '') : (pill.icon || ''));
            return `
            <div class="tab-summary-pill ${pill.cls || ''}">
                <span class="tab-pill-icon">${iconHtml}</span>
                <span class="tab-pill-label">${pill.label}:</span>
                <span class="tab-pill-val">${pill.val}</span>
            </div>
        `;
        }).join('');
    }

    /**
     * Play soft warning tone, show floating toast, and gently shake the target card
     */
    static notifyInsufficient(message, cardEl = null) {
        if (window.soundEngine && typeof window.soundEngine.playGoBack === 'function') {
            window.soundEngine.playGoBack();
        }
        if (window.modalManager && typeof window.modalManager.showQuickToast === 'function') {
            window.modalManager.showQuickToast(message, 1900);
        }
        if (cardEl && cardEl.classList) {
            cardEl.classList.remove('tab-card-shake');
            void cardEl.offsetWidth;
            cardEl.classList.add('tab-card-shake');
        }
    }

    /**
     * QoL Quick Floating Toast
     */
    showQuickToast(message, durationMs = 1400) {
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

        if (typeof UiIcons !== 'undefined') {
            UiIcons.setRichText(toast, message);
        } else {
            toast.textContent = message;
        }
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';

        if (this._toastTimer) clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(10px)';
        }, durationMs);
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
        const gearCoinsEl = document.getElementById('gear-coins-val');
        if (gearCoinsEl) {
            const coins = (window.GameState && window.GameState.player && window.GameState.player.coins) || 0;
            gearCoinsEl.textContent = coins.toLocaleString();
        }

        const resolvedAvatar = (heroKey === 'psgiannhs' && typeof PsgiannhsHero !== 'undefined')
            ? PsgiannhsHero.getAvatarForStyle()
            : (heroData.avatar || 'assets/HeroesIcons/PsanasAvatar.png');
        if (heroAvatar) heroAvatar.src = resolvedAvatar;
        if (heroName) heroName.textContent = (heroData.name || heroKey).toUpperCase();

        // Default weapons mapping per hero
        const HERO_DEFAULT_WEAPONS = {
            psanas: 'pea',
            psogas: 'pepper',
            petros: 'watermelon',
            '50balos': 'money_gun',
            billias: 'burger',
            kitsos: 'lightning',
            psgiannhs: 'greek_flag'
        };

        const currentHeroWeapon = HERO_DEFAULT_WEAPONS[heroKey] || heroData.weaponType || 'pea';
        const otherHeroWeapons = Object.entries(HERO_DEFAULT_WEAPONS)
            .filter(([k]) => k !== heroKey)
            .map(([_, w]) => w);

        let weaponType = (typeof window !== 'undefined' && window.GameState && window.GameState.player && (window.GameState.player.selectedWeapon || window.GameState.player.weaponType)) || localStorage.getItem('lesaio_selected_weapon') || currentHeroWeapon;

        // If equipped weapon belongs to another hero or is a locked shared weapon, reset to current hero's weapon
        const isLockedShared = typeof WeaponSystem !== 'undefined' && WeaponSystem.SHARED_UNLOCKABLE_IDS.includes(weaponType) && !WeaponSystem.isWeaponUnlocked(weaponType);
        if (otherHeroWeapons.includes(weaponType) || isLockedShared) {
            weaponType = currentHeroWeapon;
            if (window.GameState && window.GameState.player) {
                window.GameState.player.weaponType = weaponType;
                window.GameState.player.selectedWeapon = weaponType;
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

        const rawWeaponData = (typeof WEAPONS !== 'undefined' && WEAPONS[weaponType]) || (window.WEAPONS && window.WEAPONS[weaponType]) || {};
        const weaponData = (typeof WeaponEvolutionManager !== 'undefined')
            ? WeaponEvolutionManager.getEffectiveConfig(weaponType, rawWeaponData)
            : rawWeaponData;
        const baseWeaponAtk = typeof weaponData.baseDamage === 'number' ? weaponData.baseDamage : ((heroData.stats && heroData.stats.atk) || 25);
        const bonusAtk = Math.round(baseWeaponAtk * ((gearStats.bulletDamage || 0) / 100));
        const calculatedAtk = baseWeaponAtk + bonusAtk;

        const calculatedDef = (heroData.def || (heroData.stats && heroData.stats.def) || 0) + (gearStats.damageReduction || 0);

        if (totalAtk) totalAtk.textContent = calculatedAtk;
        if (totalHp) totalHp.textContent = calculatedHp;
        if (totalDef) totalDef.textContent = `${calculatedDef}%`;

        const weaponNames = {
            pea: 'Pea Slingshot',
            watermelon: 'Melon Cannon',
            pepper: 'Chili Blaster',
            bubble: 'Bubble Gun',
            money_gun: 'Money Gun',
            burger: 'Burger Toss',
            lightning: 'Lightning Strike',
            greek_flag: 'Greek Flag',
            m4_carbine: 'M4 Carbine',
            spas12: 'SPAS-12',
            boomerang_saw: 'Boomerang Sawblade',
            chrono_rifle: 'Chrono Stutter Rifle',
            symbiote: 'Symbiote Launcher',
            carbine: "Kiloumpas's Carbine",
            dialtone: "Rouf's Dial-Tone Blaster",
            zeus_thunderbolt: "Zeus's Master Thunderbolt",
            helios_cannon: 'Helios Omega Cannon'
        };
        const weaponImages = {
            pea: 'assets/WeaponIcons/PeaSlingshot.png',
            watermelon: 'assets/WeaponIcons/MelonCannon.png',
            pepper: 'assets/WeaponIcons/ChilliBlaster.png',
            bubble: 'assets/WeaponIcons/BubbleGun.png',
            money_gun: 'assets/WeaponIcons/MoneyGun.png',
            burger: 'assets/WeaponIcons/BurgerToss.png',
            lightning: 'assets/WeaponIcons/LightningStrike.png',
            greek_flag: 'assets/WeaponIcons/GreekFlag.png',
            m4_carbine: 'assets/WeaponIcons/M4Carbine.png',
            spas12: 'assets/WeaponIcons/Spas12.png',
            boomerang_saw: 'assets/WeaponIcons/BoomerangSawblade.png',
            chrono_rifle: 'assets/WeaponIcons/ChronoRifle.png',
            symbiote: 'assets/WeaponIcons/SymbioteLauncher.png',
            carbine: 'assets/WeaponIcons/KiloumpasCarbine.png',
            dialtone: 'assets/WeaponIcons/RoufBlaster.png',
            zeus_thunderbolt: 'assets/WeaponIcons/ZeusThunderbolt.png',
            helios_cannon: 'assets/WeaponIcons/HeliosOmegaCannon.png'
        };

        const weaponNameEl = document.getElementById('gear-equipped-weapon-name');
        const weaponImgEl = document.getElementById('gear-slot-weapon-img');
        const weaponEmojiEl = document.getElementById('gear-slot-weapon-emoji');
        const resolvedWepName = weaponNames[weaponType] || 'Pea Slingshot';
        if (typeof WeaponEvolutionManager !== 'undefined') {
            WeaponEvolutionManager.updateWeaponSlotUI(weaponType, resolvedWepName);
        } else if (weaponNameEl) {
            weaponNameEl.textContent = resolvedWepName;
        }
        if (weaponImgEl) weaponImgEl.src = weaponImages[weaponType] || 'assets/WeaponIcons/PeaSlingshot.png';
        if (weaponEmojiEl) weaponEmojiEl.textContent = '';

        // Filter cards so other heroes' default weapons are hidden
        let visibleCount = 0;
        const cards = document.querySelectorAll('#weapons-modal .weapon-card');
        cards.forEach((card) => {
            const wt = card.getAttribute('data-weapon');
            if (otherHeroWeapons.includes(wt)) {
                card.style.display = 'none';
                card.classList.remove('active-weapon', 'weapon-locked');
                return;
            }

            const wData = (typeof WEAPONS !== 'undefined' && WEAPONS[wt]) || (window.WEAPONS && window.WEAPONS[wt]) || {};
            const isShared = typeof WeaponSystem !== 'undefined' && WeaponSystem.SHARED_UNLOCKABLE_IDS.includes(wt);
            const unlocked = !isShared || WeaponSystem.isWeaponUnlocked(wt);

            if (!unlocked && wData.hideWhenLocked !== false) {
                card.style.display = 'none';
                card.classList.remove('active-weapon', 'weapon-locked');
                return;
            }

            card.style.display = '';
            card.classList.toggle('weapon-locked', !unlocked);
            card.classList.toggle('rarity-apex', (wData.rarity || '').toLowerCase() === 'apex');
            if (unlocked) visibleCount++;

            const badge = card.querySelector('.weapon-badge');
            const isWepEvolved = unlocked && typeof WeaponEvolutionManager !== 'undefined' && WeaponEvolutionManager.isEvolved(wt);

            if (!unlocked) {
                card.classList.remove('active-weapon');
                if (badge) {
                    badge.textContent = `🔒 ${wData.unlockLabel || 'LOCKED'}`;
                    badge.className = 'weapon-badge badge-locked';
                }
            } else if (wt === weaponType) {
                card.classList.add('active-weapon');
                if (badge) {
                    badge.textContent = isWepEvolved ? 'EQUIPPED ★' : 'EQUIPPED';
                    badge.className = 'weapon-badge badge-equipped';
                }
            } else {
                card.classList.remove('active-weapon');
                if (badge) {
                    if (wt === 'pea') { badge.textContent = 'PSANAS GEAR'; badge.className = 'weapon-badge badge-psanas'; }
                    else if (wt === 'watermelon') { badge.textContent = 'PETROS GEAR'; badge.className = 'weapon-badge badge-petros'; }
                    else if (wt === 'pepper') { badge.textContent = 'PSOGAS GEAR'; badge.className = 'weapon-badge badge-psogas'; }
                    else if (wt === 'money_gun') { badge.textContent = '50BALOS GEAR'; badge.className = 'weapon-badge badge-50balos'; }
                    else if (wt === 'burger') { badge.textContent = 'BILLIAS GEAR'; badge.className = 'weapon-badge badge-billias'; }
                    else if (wt === 'lightning') { badge.textContent = 'KITSOS GEAR'; badge.className = 'weapon-badge badge-kitsos'; }
                    else if (wt === 'greek_flag') { badge.textContent = 'PSGIANNHS GEAR'; badge.className = 'weapon-badge badge-psgiannhs'; }
                    else {
                        const rName = wData.rarity || 'Exclusive';
                        badge.textContent = isWepEvolved ? `${rName.toUpperCase()} ★` : rName.toUpperCase();
                        badge.className = `weapon-badge badge-${rName.toLowerCase()}`;
                    }
                }
            }
        });

        if (typeof WeaponEvolutionManager !== 'undefined') {
            WeaponEvolutionManager.renderWeaponCardsUI();
        }

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
        if (this.featureTitle) {
            if (typeof UiIcons !== 'undefined') UiIcons.setRichText(this.featureTitle, title, 'ui-icon-title');
            else this.featureTitle.textContent = title;
        }
        if (this.featureDesc) this.featureDesc.textContent = desc;
        if (this.featureContent) {
            if (typeof UiIcons !== 'undefined') UiIcons.setRichText(this.featureContent, content);
            else this.featureContent.textContent = content;
        }
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
        const bossRewardModal = document.getElementById('boss-reward-claim-modal');
        if (bossRewardModal && !bossRewardModal.classList.contains('hidden')) {
            return; // Must claim or equip boss drops first
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

        const pubProf = document.getElementById('public-profile-modal');
        if (pubProf && !pubProf.classList.contains('hidden')) {
            if (typeof PublicProfileModal !== 'undefined') PublicProfileModal.hide();
            else pubProf.classList.add('hidden');
            return;
        }
        const lbModal = document.getElementById('leaderboard-modal');
        if (lbModal && !lbModal.classList.contains('hidden')) {
            if (window.leaderboardModal) window.leaderboardModal.hide();
            else lbModal.classList.add('hidden');
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
        } else if (ui.coopLobbyModal && ui.coopLobbyModal.modal && !ui.coopLobbyModal.modal.classList.contains('hidden')) {
            ui.coopLobbyModal.hide();
            if (window.networkManager && (!window.gameInstance || !window.gameInstance.coopSession)) {
                window.networkManager.disconnect();
            }
        } else if (ui.menuController && ui.menuController.dungeonsModal && !ui.menuController.dungeonsModal.classList.contains('hidden')) {
            ui.menuController.hideDungeonsModal();
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
