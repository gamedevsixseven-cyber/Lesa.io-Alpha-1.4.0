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

        const welcomeLoginBtn = document.getElementById('welcome-login-btn');
        if (welcomeLoginBtn) {
            welcomeLoginBtn.addEventListener('click', () => this.handleWelcomeLoginClick());
        }

        const firstTimeInput = document.getElementById('initial-name-input');
        const firstErr = document.getElementById('initial-name-error-text');
        if (firstTimeInput) {
            firstTimeInput.addEventListener('input', () => firstErr && firstErr.classList.add('hidden'));
            firstTimeInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.handleFirstTimeNameSubmit();
            });
        }

        const renameInput = document.getElementById('rename-input');
        const renameErr = document.getElementById('rename-error-text');
        if (renameInput) {
            renameInput.addEventListener('input', () => renameErr && renameErr.classList.add('hidden'));
            renameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.handleRenameSubmit();
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
            const loginWrap = document.getElementById('welcome-login-wrap');
            const sub = document.getElementById('welcome-name-subtitle');
            const isLinked = localStorage.getItem('lesaio_google_linked') === 'true';
            if (loginWrap) loginWrap.classList.toggle('hidden', isLinked);
            if (sub && isLinked) {
                const email = localStorage.getItem('lesaio_google_email') || 'your account';
                sub.textContent = `Signed in (${email}). Choose your champion name to begin:`;
            }
            this.firstTimeNameModal.classList.remove('hidden');
            const input = document.getElementById('initial-name-input');
            if (input) {
                setTimeout(() => input.focus(), 50);
            }
        }
    }

    async handleWelcomeLoginClick() {
        if (this._submittingName) return;
        const btn = document.getElementById('welcome-login-btn');
        const label = btn ? btn.querySelector('span') : null;
        const origText = label ? label.textContent : '';
        this._submittingName = true;
        if (btn) btn.disabled = true;
        if (label) label.textContent = 'SIGNING IN...';
        try {
            if (window.soundEngine) window.soundEngine.playSelect();
            if (this.ui && this.ui.settingsManager && typeof this.ui.settingsManager.handleGoogleSignIn === 'function') {
                await this.ui.settingsManager.handleGoogleSignIn();
            }
        } finally {
            this._submittingName = false;
            if (btn) btn.disabled = false;
            if (label) label.textContent = origText;
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

    _showNameError(errEl, msg) {
        if (errEl) {
            if (typeof UiIcons !== 'undefined') UiIcons.setRichText(errEl, msg, 'ui-icon-sm');
            else errEl.textContent = msg;
            errEl.classList.remove('hidden');
        }
        if (window.soundEngine && typeof window.soundEngine.playGoBack === 'function') window.soundEngine.playGoBack();
    }

    async _verifyAndClaimName(btn, errEl, val, prevName = null, beforeClaimFn = null) {
        this._submittingName = true;
        const origHtml = btn ? btn.innerHTML : '';
        if (btn) { btn.disabled = true; btn.textContent = 'CHECKING...'; }
        try {
            const nv = (typeof window !== 'undefined') ? window.nameValidator : null;
            const needUniqueCheck = nv && typeof nv.checkUniqueName === 'function'
                && (!prevName || val.toLowerCase() !== prevName.toLowerCase());
            if (needUniqueCheck) {
                let timer = null;
                const uniqueRes = await Promise.race([
                    nv.checkUniqueName(val),
                    new Promise((resolve) => { timer = setTimeout(() => resolve({ isValid: true }), 2600); })
                ]).finally(() => { if (timer) clearTimeout(timer); });
                if (uniqueRes && !uniqueRes.isValid) {
                    this._showNameError(errEl, uniqueRes.reason || 'Name taken!');
                    return false;
                }
            }
            if (beforeClaimFn && !beforeClaimFn()) return false;
            if (nv && typeof nv.claimName === 'function') {
                nv.claimName(val, prevName).catch(() => {});
            }
            return true;
        } catch (_) {
            return true;
        } finally {
            this._submittingName = false;
            if (btn) { btn.disabled = false; btn.innerHTML = origHtml; }
        }
    }

    async handleFirstTimeNameSubmit() {
        if (this._submittingName) return;
        const input = document.getElementById('initial-name-input');
        const btn = document.getElementById('submit-initial-name-btn');
        const errorEl = document.getElementById('initial-name-error-text');
        if (!input) return;

        const val = input.value.trim();
        const check = this.validatePlayerName(val);
        if (!check.valid) {
            this._showNameError(errorEl, check.error || 'Name must be 2-14 characters!');
            return;
        }

        const ok = await this._verifyAndClaimName(btn, errorEl, val, null, () => {
            if (this.gameState) this.gameState.player.name = val;
            localStorage.setItem('lesaio_player_name', val);
            localStorage.setItem('lesaio_player_name_chosen', 'true');
            if (typeof PlayerIdentity !== 'undefined') {
                PlayerIdentity.getEffectiveUid(window.cloudSave && window.cloudSave.auth, window.cloudSave && window.cloudSave.currentUser);
            }
            return true;
        });
        if (!ok) return;

        if (this.gameState) this.gameState.player.name = val;
        localStorage.setItem('lesaio_player_name', val);
        localStorage.setItem('lesaio_player_name_chosen', 'true');

        if (typeof window !== 'undefined' && window.cloudSave && window.cloudSave.isInitialized) {
            const uid = window.cloudSave.getEffectivePlayerUid();
            if (uid && !window.cloudSave.currentUser) window.cloudSave.seedNewPlayerDoc(uid);
            if (uid) window.cloudSave.startRealtimeListener({ uid, email: window.cloudSave.getEffectivePlayerEmail() });
        }
        if (typeof window !== 'undefined' && window.friendService) window.friendService.onAuthChanged();

        if (window.soundEngine) window.soundEngine.playLevelUp();
        this.hideFirstTimeNameModal();
        this.updateProfileUI();
        this._syncRenameAndStatsEverywhere(val, '');
        if (typeof TributeManager !== 'undefined') TributeManager.checkAndShow();
    }

    async handleRenameSubmit() {
        if (this._submittingName) return;
        const input = document.getElementById('rename-input');
        const btn = document.getElementById('confirm-rename-btn');
        const err = document.getElementById('rename-error-text');
        if (!input || !this.gameState) return;

        const val = input.value.trim();
        const prevName = String(this.gameState.player.name || '').trim();
        if (val === prevName) {
            this._showNameError(err, 'You already have this name!');
            return;
        }

        const check = this.validatePlayerName(val);
        if (!check.valid) {
            this._showNameError(err, check.error || 'Invalid name!');
            return;
        }

        const ok = await this._verifyAndClaimName(btn, err, val, prevName, () => {
            if (this.gameState.player.gems < 100) {
                this._showNameError(err, 'Not enough Gems! (Requires 100 💎)');
                return false;
            }
            return true;
        });
        if (!ok) return;

        this.gameState.player.name = val;
        localStorage.setItem('lesaio_player_name', val);
        localStorage.setItem('lesaio_player_name_chosen', 'true');
        this.gameState.spendGems(100);

        if (window.soundEngine) window.soundEngine.playLevelUp();
        this.hideRenameModal();
        this.updateProfileUI();
        this._syncRenameAndStatsEverywhere(val, prevName);
    }

    async _syncRenameAndStatsEverywhere(newName, prevName = '') {
        const cleanName = String(newName || '').trim();
        if (!cleanName) return;
        const lowerName = cleanName.toLowerCase();

        const cs = (typeof window !== 'undefined') ? window.cloudSave : null;
        if (cs && cs.lastCloudData && typeof cs.lastCloudData === 'object') {
            cs.lastCloudData.playerName = cleanName;
            cs.lastCloudData.playerNameLower = lowerName;
            if (cs.lastCloudData.player && typeof cs.lastCloudData.player === 'object') {
                cs.lastCloudData.player.name = cleanName;
            }
        }

        let serialized = null;
        if (typeof window !== 'undefined' && window.SaveManager && typeof window.SaveManager.saveLocalOnly === 'function') {
            if (window.SaveManager.saveDebounceTimer) {
                clearTimeout(window.SaveManager.saveDebounceTimer);
                window.SaveManager.saveDebounceTimer = null;
            }
            serialized = window.SaveManager.saveLocalOnly();
        }
        if (cs && typeof cs.saveToCloud === 'function') {
            await cs.saveToCloud({
                ...(serialized || {}),
                name: cleanName,
                playerName: cleanName,
                playerNameLower: lowerName
            }).catch(() => false);
        }

        const fs = (typeof window !== 'undefined') ? window.friendService : null;
        if (fs && typeof fs.syncMyProfile === 'function') {
            await fs.syncMyProfile(true).catch(() => false);
        }

        // Propagate new name & latest leaderboard stats to any sibling/legacy player docs and friendships
        const db = (fs && typeof fs.getDb === 'function' && fs.getDb()) || (cs && cs.db) || null;
        if (db) {
            const me = (fs && typeof fs.getMySummary === 'function') ? fs.getMySummary() : null;
            const myUid = (me && me.uid) || (cs && typeof cs.getEffectivePlayerUid === 'function' ? cs.getEffectivePlayerUid() : '');
            const selfIds = new Set([
                myUid,
                typeof localStorage !== 'undefined' ? localStorage.getItem('lesaio_player_uid') : '',
                typeof localStorage !== 'undefined' ? localStorage.getItem('lesaio_google_uid') : '',
                (cs && cs.currentUser && cs.currentUser.uid) ? cs.currentUser.uid : ''
            ].filter(Boolean));

            const syncFields = {
                playerName: cleanName,
                playerNameLower: lowerName,
                'player.name': cleanName
            };
            if (me) {
                Object.assign(syncFields, {
                    accountLevel: me.level,
                    level: me.level,
                    selectedHero: me.selectedHero,
                    socialStats: {
                        highScore: me.highScore,
                        maxWave: me.maxWave,
                        totalKills: me.totalKills,
                        endlessMaxWave: me.endlessMaxWave,
                        endlessHardMaxWave: Math.max(0, Number(me.endlessHardMaxWave) || 0),
                        olympusMaxFloor: me.olympusMaxFloor
                    },
                    lbHighScore: me.highScore,
                    lbEndlessWave: Math.max(0, Number(me.endlessMaxWave) || 0),
                    lbEndlessHardWave: Math.max(0, Number(me.endlessHardMaxWave) || 0),
                    lbTotalKills: me.totalKills
                });
            }

            for (const sid of selfIds) {
                db.collection('players').doc(sid).update(syncFields).catch(() => {});
            }

            if (myUid && me && me.tagClean) {
                Promise.all([
                    db.collection('players').where('uid', '==', myUid).limit(5).get().catch(() => null),
                    db.collection('players').where('friendTagClean', '==', me.tagClean).limit(5).get().catch(() => null)
                ]).then((snaps) => {
                    snaps.forEach((s) => {
                        if (!s || typeof s.forEach !== 'function') return;
                        s.forEach((d) => {
                            if (d && d.exists) d.ref.update(syncFields).catch(() => {});
                        });
                    });
                }).catch(() => {});
            }

            if (myUid && me) {
                db.collection('friendships').where('users', 'array-contains', myUid).get().then((snap) => {
                    if (!snap) return;
                    snap.forEach((doc) => {
                        doc.ref.update({
                            [`profiles.${myUid}.name`]: cleanName,
                            [`profiles.${myUid}.level`]: me.level,
                            [`profiles.${myUid}.hero`]: me.selectedHero,
                            [`profiles.${myUid}.tag`]: me.tag
                        }).catch(() => {});
                    });
                }).catch(() => {});
            }
        }

        if (typeof window !== 'undefined' && window.leaderboardModal) {
            const lb = window.leaderboardModal;
            if (Array.isArray(lb._rows)) {
                lb._rows.forEach((r) => {
                    if (r && (r.isSelf || ( prevName && r.name === prevName ))) r.name = cleanName;
                });
            }
            const lbEl = document.getElementById('leaderboard-modal');
            if (lbEl && !lbEl.classList.contains('hidden') && typeof lb.refresh === 'function') {
                lb.refresh();
            }
        }
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
