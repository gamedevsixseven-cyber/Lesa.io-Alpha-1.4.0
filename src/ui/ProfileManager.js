/**
 * Lesa.io - Player Profile & Lifetime Career Stats UI Controller
 * Handles Profile Modal, Avatar Showcase, First-Time Name Setup, and 100 💎 Renaming
 */

class ProfileManager {
    constructor(uiController) {
        this.ui = uiController;
        this.gameState = typeof window !== 'undefined' ? window.GameState : null;
        this.statsManager = new StatsManager(this.gameState);

        // Modals
        this.playerProfileModal = document.getElementById('player-profile-modal');
        this.firstTimeNameModal = document.getElementById('first-time-name-modal');
        this.renameModal = document.getElementById('rename-modal');

        // Top-Left Menu Elements
        this.menuPlayerProfilePill = document.getElementById('menu-player-profile');
        this.playerProfileName = document.getElementById('player-profile-name');
        this.playerProfileLevel = document.getElementById('player-profile-level');
        this.playerProfileXpFill = document.getElementById('player-profile-xp-fill');
        this.playerProfileXpText = document.getElementById('player-profile-xp-text');

        this.initEvents();
        this.updateProfileUI();

        if (this.isFirstTimePlayer()) {
            this.showFirstTimeNameModal();
        }
    }

    isFirstTimePlayer() {
        return !localStorage.getItem('lesaio_player_name_chosen');
    }

    initEvents() {
        if (this.menuPlayerProfilePill) {
            this.menuPlayerProfilePill.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                this.showProfileModal();
            });
        }

        const closeProfileBtn = document.getElementById('close-profile-btn');
        if (closeProfileBtn) {
            closeProfileBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playGoBack();
                this.hideProfileModal();
            });
        }

        const editNameBtn = document.getElementById('open-rename-btn');
        if (editNameBtn) {
            editNameBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                this.showRenameModal();
            });
        }

        const copyIdBtn = document.getElementById('prof-copy-id-btn');
        if (copyIdBtn) {
            copyIdBtn.addEventListener('click', () => {
                const tag = (window.friendService && window.friendService.getMyTag()) || '';
                if (tag && navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(tag).catch(() => {});
                }
                if (typeof UiIcons !== 'undefined') UiIcons.setRichText(copyIdBtn, '✅ COPIED!', 'ui-icon-sm');
                else copyIdBtn.textContent = '✅ COPIED!';
                setTimeout(() => {
                    if (typeof UiIcons !== 'undefined') UiIcons.setRichText(copyIdBtn, '📋 Copy ID', 'ui-icon-sm');
                    else copyIdBtn.textContent = '📋 Copy ID';
                }, 1800);
            });
        }

        const cancelRenameBtn = document.getElementById('cancel-rename-btn');
        if (cancelRenameBtn) {
            cancelRenameBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playGoBack();
                this.hideRenameModal();
            });
        }

        const confirmRenameBtn = document.getElementById('confirm-rename-btn');
        if (confirmRenameBtn) {
            confirmRenameBtn.addEventListener('click', () => {
                this.handleRenameSubmit();
            });
        }

        const saveFirstTimeBtn = document.getElementById('submit-initial-name-btn');
        if (saveFirstTimeBtn) {
            saveFirstTimeBtn.addEventListener('click', () => {
                this.handleFirstTimeNameSubmit();
            });
        }

        const firstTimeInput = document.getElementById('initial-name-input');
        if (firstTimeInput) {
            firstTimeInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.handleFirstTimeNameSubmit();
                }
            });
        }

        // Listen for state changes
        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.on('accountXpChanged', () => this.updateProfileUI());
            window.EventBus.on('statsUpdated', () => this.updateProfileUI());
            window.EventBus.on('heroSelected', () => this.updateProfileUI());
        }
        if (typeof ProfileCosmeticsUI !== 'undefined') {
            ProfileCosmeticsUI.init();
        }
    }

    showProfileModal() {
        if (typeof CosmeticManager !== 'undefined') {
            CosmeticManager.syncUnlocks({ silent: true, syncRemote: false });
        }
        this.updateProfileUI();
        if (typeof ProfileCosmeticsUI !== 'undefined') {
            ProfileCosmeticsUI.renderActiveTab();
        }
        if (this.playerProfileModal) {
            this.playerProfileModal.classList.remove('hidden');
        }
    }

    hideProfileModal() {
        if (this.playerProfileModal) {
            this.playerProfileModal.classList.add('hidden');
        }
    }

    showRenameModal() {
        const input = document.getElementById('rename-input');
        const balance = document.getElementById('rename-current-gems');
        const err = document.getElementById('rename-error-text');

        if (input && this.gameState) input.value = this.gameState.player.name;
        if (balance && this.gameState) {
            const gemText = `Your Gems: 💎 ${this.gameState.player.gems}`;
            if (typeof UiIcons !== 'undefined') UiIcons.setRichText(balance, gemText, 'ui-icon-sm');
            else balance.textContent = gemText;
        }
        if (err) err.classList.add('hidden');

        if (this.renameModal) this.renameModal.classList.remove('hidden');
    }

    hideRenameModal() {
        if (this.renameModal) this.renameModal.classList.add('hidden');
    }

    showFirstTimeNameModal() {
        if (this.firstTimeNameModal) {
            this.firstTimeNameModal.classList.remove('hidden');
            const input = document.getElementById('initial-name-input');
            if (input) {
                setTimeout(() => input.focus(), 50);
            }
        }
    }

    hideFirstTimeNameModal() {
        if (this.firstTimeNameModal) {
            this.firstTimeNameModal.classList.add('hidden');
        }
    }

    validatePlayerName(val) {
        if (typeof NameValidator !== 'undefined' && typeof NameValidator.validate === 'function') {
            return NameValidator.validate(val);
        }
        if (typeof window !== 'undefined' && window.nameValidator && typeof window.nameValidator.validateFormat === 'function') {
            const fmt = window.nameValidator.validateFormat(val);
            if (!fmt.isValid) {
                return { valid: false, error: fmt.reason };
            }
            const app = window.nameValidator.checkAppropriate(val);
            return { valid: app.isValid, error: app.reason };
        }
        return { valid: val.length >= 2 && val.length <= 14, error: 'Name must be 2-14 characters!' };
    }

    handleFirstTimeNameSubmit() {
        const input = document.getElementById('initial-name-input');
        const errorEl = document.getElementById('initial-name-error-text');
        if (!input) return;

        const val = input.value.trim();
        const check = this.validatePlayerName(val);

        if (!check.valid) {
            if (errorEl) {
                errorEl.textContent = check.error || 'Name must be 2-14 characters!';
                errorEl.classList.remove('hidden');
            }
            return;
        }

        if (this.gameState) {
            this.gameState.player.name = val;
            localStorage.setItem('lesaio_player_name', val);
        }
        localStorage.setItem('lesaio_player_name_chosen', 'true');

        if (window.soundEngine) window.soundEngine.playLevelUp();
        this.hideFirstTimeNameModal();
        this.updateProfileUI();
        if (window.friendService) window.friendService.syncMyProfile(true);
        if (typeof TributeManager !== 'undefined') {
            TributeManager.checkAndShow();
        }
    }

    handleRenameSubmit() {
        const input = document.getElementById('rename-input');
        const err = document.getElementById('rename-error-text');
        if (!input || !this.gameState) return;

        const val = input.value.trim();
        const check = this.validatePlayerName(val);

        if (!check.valid) {
            if (err) {
                err.textContent = check.error || 'Invalid name!';
                err.classList.remove('hidden');
            }
            return;
        }

        if (this.gameState.player.gems < 100) {
            if (err) {
                const errText = 'Not enough Gems! (Requires 100 💎)';
                if (typeof UiIcons !== 'undefined') UiIcons.setRichText(err, errText, 'ui-icon-sm');
                else err.textContent = errText;
                err.classList.remove('hidden');
            }
            return;
        }

        this.gameState.spendGems(100);
        this.gameState.player.name = val;
        localStorage.setItem('lesaio_player_name', val);

        if (window.soundEngine) window.soundEngine.playLevelUp();
        this.hideRenameModal();
        this.updateProfileUI();
        if (window.friendService) window.friendService.syncMyProfile(true);
    }

    updateProfileUI() {
        if (!this.gameState) return;

        const p = this.gameState.player;
        const s = p.stats;
        const xpNeeded = 100 * p.accountLevel;
        const xpPct = Math.min(100, Math.round((p.accountXp / xpNeeded) * 100));

        // Menu Pill
        if (this.playerProfileName) this.playerProfileName.textContent = p.name;
        if (this.playerProfileLevel) this.playerProfileLevel.textContent = p.accountLevel;
        if (this.playerProfileXpFill) this.playerProfileXpFill.style.width = `${xpPct}%`;
        if (this.playerProfileXpText) this.playerProfileXpText.textContent = `${p.accountXp} / ${xpNeeded}`;

        // Profile Modal Header
        const modalName = document.getElementById('prof-modal-name');
        const modalLevel = document.getElementById('prof-modal-level-badge');
        const modalXpFill = document.getElementById('prof-modal-xp-fill');
        const modalXpText = document.getElementById('prof-modal-xp-text');
        const modalAvatar = document.getElementById('prof-modal-avatar');

        if (modalName) modalName.textContent = p.name;
        if (modalLevel) modalLevel.textContent = `LVL ${p.accountLevel}`;
        if (modalXpFill) modalXpFill.style.width = `${xpPct}%`;
        if (modalXpText) modalXpText.textContent = `${p.accountXp} / ${xpNeeded} XP`;

        const modalTag = document.getElementById('prof-modal-tag');
        if (modalTag) {
            const myTag = (window.friendService && window.friendService.getMyTag())
                || (typeof PlayerIdentity !== 'undefined' && window.cloudSave ? PlayerIdentity.getOnlineTag(window.cloudSave.getEffectivePlayerUid()) : '#HERO00');
            modalTag.textContent = `ID: ${myTag}`;
        }

        const avatars = {
            psanas: 'assets/HeroesIcons/PsanasAvatar.png',
            psogas: 'assets/HeroesIcons/PsogasAvatar.png',
            petros: 'assets/HeroesIcons/PetrosAvatar.png',
            '50balos': 'assets/HeroesIcons/50balosCrop.png',
            billias: 'assets/HeroesIcons/BilliasAvatar.png',
            kitsos: 'assets/HeroesIcons/KitsosAvatar.png',
            psgiannhs: (typeof PsgiannhsHero !== 'undefined') ? PsgiannhsHero.getAvatarForStyle() : 'assets/HeroesIcons/PsgiannhsAvatar.png'
        };
        if (modalAvatar) modalAvatar.src = avatars[p.selectedHero] || avatars.psanas;

        if (typeof CosmeticManager !== 'undefined') {
            CosmeticManager.syncUnlocks({ silent: true, syncRemote: false });
        }
        if (typeof ProfileCosmeticsUI !== 'undefined') {
            ProfileCosmeticsUI.refreshHeaderPreview();
        }

        // Favorite Hero
        const fav = this.statsManager.getFavoriteHero();
        const favEl = document.getElementById('prof-fav-hero');
        if (favEl) {
            if (typeof UiIcons !== 'undefined' && fav.iconKey) {
                favEl.innerHTML = `${UiIcons.i(fav.iconKey, 'ui-icon-sm')} ${UiIcons.esc(fav.name)}`;
            } else if (typeof UiIcons !== 'undefined') {
                UiIcons.setRichText(favEl, `${fav.emoji} ${fav.name}`, 'ui-icon-sm');
            } else {
                favEl.textContent = `${fav.emoji} ${fav.name}`;
            }
        }

        // Career Stats
        const statKills = document.getElementById('prof-total-kills');
        const statWave = document.getElementById('prof-max-wave');
        const statHigh = document.getElementById('prof-high-score');
        const statFatmirs = document.getElementById('prof-fatmirs');
        const statCasillas = document.getElementById('prof-casillas');
        const statMatches = document.getElementById('prof-matches');
        const statTime = document.getElementById('prof-time');

        if (statKills) statKills.textContent = s.totalKills.toLocaleString();
        if (statWave) statWave.textContent = `Wave ${s.maxWave}`;
        if (statHigh) statHigh.textContent = s.highScore.toLocaleString();
        if (statFatmirs) statFatmirs.textContent = s.totalFatmirs.toLocaleString();
        if (statCasillas) statCasillas.textContent = s.totalCasillas.toLocaleString();
        if (statMatches) statMatches.textContent = s.matchesPlayed.toLocaleString();
        if (statTime) statTime.textContent = this.statsManager.formatTime(s.totalTimeSeconds);
    }
}

if (typeof window !== 'undefined') {
    window.ProfileManager = ProfileManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProfileManager };
}
