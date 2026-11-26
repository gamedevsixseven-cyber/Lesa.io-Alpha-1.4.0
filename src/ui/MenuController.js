/**
 * Lesa.io - Main Menu & Lobby Screen Controller
 * Handles main menu button clicks, hero showcase cards, audio autoplay, and session start
 */

class MenuController {
    constructor(uiController) {
        this.ui = uiController;
        this.gameState = typeof window !== 'undefined' ? window.GameState : null;

        this.menuScreen = document.getElementById('menu-screen');
        this.menuAvatarImg = document.getElementById('menu-avatar-img');
        this.hudAvatarImg = document.getElementById('hud-avatar-img');
        this.gameModeModal = document.getElementById('game-mode-modal');
        this.endlessHardSelected = false;
        if (typeof window !== 'undefined') window.menuController = this;

        this.initButtons();
        this.updateHeroAvatarUI();
        this.updateAscentCrestBadge();
        this.updateEndlessHardUnlockUI();
        this.startStarterPackTimer();

        // Listen for hero, crest, and feat/unlock changes
        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.on('heroSelected', () => this.updateHeroAvatarUI());
            window.EventBus.on('heroSkinChanged', () => this.updateHeroAvatarUI());
            window.EventBus.on('crestsUpdated', () => this.updateAscentCrestBadge());
            window.EventBus.on('combatFeatsUpdated', () => this.updateEndlessHardUnlockUI());
            window.EventBus.on('statsUpdated', () => this.updateEndlessHardUnlockUI());
        }
    }

    initButtons() {
        // Play Button -> Opens Game Mode Selection
        const playBtn = document.getElementById('start-btn');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
                    window.soundEngine.playSelect();
                }
                if (typeof window.triggerGameFullscreen === 'function') {
                    window.triggerGameFullscreen();
                }
                this.showGameModeModal();
            });
        }

        // Game Mode Modal Controls
        const modeCloseBtn = document.getElementById('game-mode-close-btn');
        if (modeCloseBtn) {
            modeCloseBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                this.hideGameModeModal();
            });
        }

        const handleStory = () => {
            if (window.soundEngine && typeof window.soundEngine.playStartGame === 'function') {
                window.soundEngine.playStartGame();
            } else if (window.soundEngine) {
                window.soundEngine.playSelect();
            }
            this.startGame('story');
        };

        const handleEndless = () => {
            if (window.soundEngine) window.soundEngine.playSelect();
            if (typeof EndlessDifficultyModal !== 'undefined') {
                EndlessDifficultyModal.open(this);
            } else {
                const useHard = !!(this.endlessHardSelected && this.isEndlessHardUnlocked());
                this.startGame('endless', { isEndlessHard: useHard });
            }
        };

        const handleDungeons = () => {
            const crestMgr = window.ascentCrestManager;
            if (crestMgr && !crestMgr.canEnterAscent()) {
                if (window.soundEngine && typeof window.soundEngine.playGoBack === 'function') {
                    window.soundEngine.playGoBack();
                } else if (window.soundEngine) {
                    window.soundEngine.playSelect();
                }
                this.showCrestShortageNotice();
                return;
            }
            if (window.soundEngine && typeof window.soundEngine.playStartGame === 'function') {
                window.soundEngine.playStartGame();
            } else if (window.soundEngine) {
                window.soundEngine.playSelect();
            }
            this.startGame('dungeons');
        };

        const modeStoryBtn = document.getElementById('mode-select-story-btn');
        if (modeStoryBtn) modeStoryBtn.addEventListener('click', handleStory);
        const modeStorySlot = document.querySelector('.mode-slot-story');
        if (modeStorySlot) modeStorySlot.addEventListener('click', (e) => {
            if (e.target !== modeStoryBtn) handleStory();
        });

        const modeEndlessBtn = document.getElementById('mode-select-endless-btn');
        if (modeEndlessBtn) modeEndlessBtn.addEventListener('click', handleEndless);
        const modeEndlessSlot = document.querySelector('.mode-slot-endless');
        if (modeEndlessSlot) modeEndlessSlot.addEventListener('click', (e) => {
            if (e.target !== modeEndlessBtn) handleEndless();
        });

        const modeDungeonsBtn = document.getElementById('mode-select-dungeons-btn');
        if (modeDungeonsBtn) modeDungeonsBtn.addEventListener('click', handleDungeons);
        const modeDungeonsSlot = document.querySelector('.mode-slot-dungeons');
        if (modeDungeonsSlot) modeDungeonsSlot.addEventListener('click', (e) => {
            if (e.target !== modeDungeonsBtn) handleDungeons();
        });

        const modeModal = document.getElementById('game-mode-modal');
        if (modeModal) {
            modeModal.addEventListener('click', (e) => {
                if (e.target === modeModal) {
                    this.hideGameModeModal();
                }
            });
        }

        const openCoopBtn = document.getElementById('open-coop-btn');
        if (openCoopBtn) {
            openCoopBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hideGameModeModal();
                if (window.soundEngine) window.soundEngine.playSelect();
                if (window.coopLobbyModal) {
                    window.coopLobbyModal.show();
                } else if (typeof CoopLobbyModal !== 'undefined') {
                    window.coopLobbyModal = new CoopLobbyModal();
                    window.coopLobbyModal.show();
                }
            });
        }

        // Left Menu Buttons
        const weaponsBtn = document.getElementById('menu-weapons-btn');
        if (weaponsBtn) {
            weaponsBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                if (this.ui.modalManager) {
                    this.ui.modalManager.showWeaponsModal();
                }
            });
        }

        const skillsBtn = document.getElementById('menu-skills-btn');
        if (skillsBtn) {
            skillsBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                if (this.ui.skillManager) {
                    this.ui.skillManager.showSkillsModal();
                }
            });
        }

        const upgradesBtn = document.getElementById('menu-upgrades-btn');
        if (upgradesBtn) {
            upgradesBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                if (this.ui.modalManager) {
                    this.ui.modalManager.showUpgradesModal();
                }
            });
        }

        const inventoryBtn = document.getElementById('menu-inventory-btn');
        if (inventoryBtn) {
            inventoryBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                if (this.ui.modalManager) {
                    this.ui.modalManager.showInventoryModal();
                }
            });
        }

        const talentBtn = document.getElementById('menu-talents-btn');
        if (talentBtn) {
            talentBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                if (this.ui.modalManager) {
                    this.ui.modalManager.showTalentsModal();
                }
            });
        }

        // Bottom Row Buttons
        const leaderboardBtn = document.getElementById('btn-leaderboard');
        if (leaderboardBtn) {
            leaderboardBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                if (window.leaderboardModal && typeof window.leaderboardModal.show === 'function') {
                    window.leaderboardModal.show();
                } else {
                    this.ui.modalManager.showFeatureModal(
                        '🏆 GLOBAL LEADERBOARDS',
                        'Top .io Champions',
                        'Check world rankings for most Skatmirs bonked and Casillases outplayed!'
                    );
                }
            });
        }

        const friendsBtn = document.getElementById('btn-friends');
        if (friendsBtn) {
            friendsBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                if (window.friendsModal) {
                    window.friendsModal.show();
                } else {
                    this.ui.modalManager.showFeatureModal(
                        '👥 FRIENDS',
                        'Social & Co-op Arena',
                        'Connect with friends by Name or Online ID!'
                    );
                }
            });
        }

        const clansBtn = document.getElementById('btn-clans');
        if (clansBtn) {
            clansBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                if (window.clansModal && typeof window.clansModal.show === 'function') {
                    window.clansModal.show();
                } else {
                    this.ui.modalManager.showFeatureModal(
                        '🛡️ CLANS & GUILDS',
                        'Guild Hall Loading...',
                        'Clans are initializing — try again in a moment!'
                    );
                }
            });
        }

        const eventsBtn = document.getElementById('btn-events');
        if (eventsBtn) {
            eventsBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                if (typeof EventManager !== 'undefined' && typeof EventManager.showModal === 'function') {
                    EventManager.showModal();
                } else {
                    this.ui.modalManager.showFeatureModal(
                        '📅 LIVE EVENTS',
                        'Special scheduled events',
                        'Launch Event (Dec 1 – Dec 7): 1.5x XP & 2.0x Gold!'
                    );
                }
            });
        }

        // Right Cards Buttons
        const questsBtn = document.getElementById('view-quests-btn');
        if (questsBtn) {
            questsBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                this.ui.showDailyQuestsModal();
            });
        }

        const closeQuestsBtn = document.getElementById('close-quests-btn');
        if (closeQuestsBtn) {
            closeQuestsBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playGoBack();
                this.ui.hideDailyQuestsModal();
            });
        }

        const openBattlePass = () => {
            if (window.soundEngine) window.soundEngine.playSelect();
            if (this.ui && this.ui.battlePassModalUI) {
                this.ui.battlePassModalUI.show();
            }
        };
        const bpBtn = document.getElementById('view-battle-pass-btn');
        if (bpBtn) bpBtn.addEventListener('click', openBattlePass);

        const spBtn = document.getElementById('starter-pack-card');
        if (spBtn) {
            if (localStorage.getItem('lesaio_starter_pack_purchased') === 'true') {
                spBtn.style.display = 'none';
            }
            spBtn.addEventListener('click', () => {
                if (localStorage.getItem('lesaio_starter_pack_purchased') === 'true') {
                    spBtn.style.display = 'none';
                    return;
                }
                if (window.soundEngine) window.soundEngine.playSelect();
                if (this.ui.starterPackModal) {
                    this.ui.starterPackModal.show();
                }
            });
        }
    }

    startStarterPackTimer() {
        if (this.spTimerInterval) clearInterval(this.spTimerInterval);

        const cardEl = document.getElementById('starter-pack-card');

        // If player has already purchased the Starter Pack, completely remove it from the menu
        if (localStorage.getItem('lesaio_starter_pack_purchased') === 'true') {
            if (cardEl) cardEl.style.display = 'none';
            return;
        }

        // First login / account creation timestamp
        let startTime = parseInt(localStorage.getItem('lesaio_starter_pack_start') || '0', 10);
        if (!startTime) {
            startTime = Date.now();
            localStorage.setItem('lesaio_starter_pack_start', startTime.toString());
        }

        const durationMs = 24 * 60 * 60 * 1000; // 24 hours

        const updateTick = () => {
            if (localStorage.getItem('lesaio_starter_pack_purchased') === 'true') {
                if (cardEl) cardEl.style.display = 'none';
                if (this.spTimerInterval) clearInterval(this.spTimerInterval);
                return;
            }

            const now = Date.now();
            const remaining = (startTime + durationMs) - now;
            const timerEl = document.getElementById('starter-pack-timer');

            if (remaining <= 0) {
                if (timerEl) timerEl.textContent = 'EXPIRED';
                if (cardEl) cardEl.style.display = 'none';
                if (this.spTimerInterval) clearInterval(this.spTimerInterval);
                return;
            }

            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((remaining % (1000 * 60)) / 1000);
            const timeStr = `${hours}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;

            if (timerEl) {
                timerEl.textContent = timeStr;
            }
        };

        updateTick();
        this.spTimerInterval = setInterval(updateTick, 1000);
    }

    showGameModeModal() {
        if (!this.gameModeModal) this.gameModeModal = document.getElementById('game-mode-modal');
        this.updateAscentCrestBadge();
        this.updateEndlessHardUnlockUI();
        if (typeof DlcManager !== 'undefined') DlcManager.syncMenuEntry(this);
        const noticeEl = document.getElementById('mode-crest-notice');
        if (noticeEl) noticeEl.classList.add('hidden');
        if (this._crestNoticeTimer) {
            clearTimeout(this._crestNoticeTimer);
            this._crestNoticeTimer = null;
        }
        if (this.gameModeModal) this.gameModeModal.classList.remove('hidden');
    }

    hideGameModeModal() {
        if (!this.gameModeModal) this.gameModeModal = document.getElementById('game-mode-modal');
        if (this.gameModeModal) this.gameModeModal.classList.add('hidden');
    }

    updateAscentCrestBadge() {
        const crestMgr = window.ascentCrestManager;
        if (!crestMgr) return;
        if (typeof crestMgr.ensureDailyRefill === 'function') {
            crestMgr.ensureDailyRefill();
        }
        const count = crestMgr.getCount();
        const cap = crestMgr.getCap();

        const textEl = document.getElementById('mode-crest-text');
        if (textEl) textEl.textContent = `${count} / ${cap}`;

        const pipsEl = document.getElementById('mode-crest-pips');
        if (pipsEl) {
            const pips = pipsEl.querySelectorAll('.crest-pip');
            pips.forEach((pip, idx) => {
                pip.classList.toggle('filled', idx < count);
            });
        }

        const slotEl = document.querySelector('.mode-slot-dungeons');
        if (slotEl) {
            slotEl.classList.toggle('is-crest-empty', count <= 0);
        }
    }

    showCrestShortageNotice() {
        this.updateAscentCrestBadge();
        const noticeEl = document.getElementById('mode-crest-notice');
        if (noticeEl) {
            noticeEl.textContent = 'No Crests left (0/3)! Beat Story Final Boss Rouf (Wave 20) for +1 Crest, or get +2 Daily.';
            noticeEl.classList.remove('hidden');
            if (this._crestNoticeTimer) clearTimeout(this._crestNoticeTimer);
            this._crestNoticeTimer = setTimeout(() => {
                noticeEl.classList.add('hidden');
                this._crestNoticeTimer = null;
            }, 3800);
        }

        const slotEl = document.querySelector('.mode-slot-dungeons');
        if (slotEl) {
            slotEl.classList.remove('crest-shake');
            void slotEl.offsetWidth;
            slotEl.classList.add('crest-shake');
            if (this._crestShakeTimer) clearTimeout(this._crestShakeTimer);
            this._crestShakeTimer = setTimeout(() => {
                slotEl.classList.remove('crest-shake');
                this._crestShakeTimer = null;
            }, 450);
        }
    }

    isEndlessHardUnlocked() {
        if (typeof window !== 'undefined' && window.AdminAuth && typeof window.AdminAuth.isTestingOverrideEnabled === 'function' && window.AdminAuth.isTestingOverrideEnabled()) {
            return true;
        }
        if (typeof localStorage !== 'undefined' && localStorage.getItem('lesaio_hard_endless_unlocked') === 'true') {
            return true;
        }
        const gs = this.gameState || (typeof window !== 'undefined' ? window.GameState : null);
        const cf = (gs && gs.player && gs.player.combatFeats) || {};
        const statsMax = Math.max(
            (gs && gs.player && gs.player.stats && Number(gs.player.stats.maxWave)) || 0,
            typeof localStorage !== 'undefined' ? (parseInt(localStorage.getItem('lesaio_max_wave') || '0', 10) || 0) : 0
        );
        const storedFeats = (typeof PerkProgression !== 'undefined' && typeof PerkProgression.loadFeats === 'function') ? PerkProgression.loadFeats() : {};
        const snap = (typeof PerkProgression !== 'undefined' && typeof PerkProgression.getPlayerProgress === 'function' && gs)
            ? PerkProgression.getPlayerProgress(gs) : {};
        const bestEndless = Math.max(cf.endlessMaxWave || 0, storedFeats.endlessMaxWave || 0, snap.endlessMaxWave || 0, statsMax > 20 ? statsMax : 0);
        const hardPlayed = Math.max(cf.endlessHardMaxWave || 0, storedFeats.endlessHardMaxWave || 0, snap.endlessHardMaxWave || 0);
        const unlocked = !!(cf.hardEndlessUnlocked || storedFeats.hardEndlessUnlocked || snap.hardEndlessUnlocked || bestEndless >= 30 || hardPlayed >= 1);
        if (unlocked && typeof localStorage !== 'undefined') {
            try { localStorage.setItem('lesaio_hard_endless_unlocked', 'true'); } catch (_) {}
        }
        return unlocked;
    }

    updateEndlessHardUnlockUI() {
        const unlocked = this.isEndlessHardUnlocked();
        if (!unlocked) this.endlessHardSelected = false;
        if (typeof EndlessDifficultyModal !== 'undefined') EndlessDifficultyModal.refreshState(this);
    }

    showEndlessHardLockedNotice() {
        if (typeof EndlessDifficultyModal !== 'undefined') EndlessDifficultyModal._showLockedFeedback();
    }

    startGame(gameMode = 'story', options = {}) {
        if (gameMode === 'dlc_cave' && (typeof DlcManager === 'undefined' || !DlcManager.isPrimaryDev())) {
            return;
        }
        if (gameMode === 'dungeons' && window.ascentCrestManager) {
            if (!window.ascentCrestManager.consumeCrest()) {
                this.showCrestShortageNotice();
                return;
            }
        }
        this.hideGameModeModal();
        if (typeof EndlessDifficultyModal !== 'undefined') EndlessDifficultyModal.hide();
        if (typeof window.triggerGameFullscreen === 'function') {
            window.triggerGameFullscreen();
        }
        if (this.menuScreen) {
            this.menuScreen.classList.add('hidden');
            this.menuScreen.style.setProperty('display', 'none', 'important');
        }
        this.ui.hud.show();
        if (window.friendService) {
            const label = gameMode === 'dungeons' ? 'Climbing Mt. Olympus' : (gameMode === 'endless' ? (options.isEndlessHard ? 'Playing Endless Hard' : 'Playing Normal Endless') : 'Playing Story');
            window.friendService.setPresenceStatus(label, null);
        }

        if (window.gameInstance) {
            const hero = this.gameState ? this.gameState.player.selectedHero : 'psanas';
            if (typeof window.gameInstance.startNewGame === 'function') {
                window.gameInstance.startNewGame(hero, gameMode, options);
            } else if (typeof window.gameInstance.start === 'function') {
                window.gameInstance.start(hero, gameMode);
            }
        }
    }

    updateHeroAvatarUI() {
        const hero = this.gameState ? this.gameState.player.selectedHero : 'psanas';
        const avatarMap = {
            psanas: 'assets/HeroesIcons/PsanasAvatar.png',
            psogas: 'assets/HeroesIcons/PsogasAvatar.png',
            petros: 'assets/HeroesIcons/PetrosAvatar.png',
            '50balos': 'assets/HeroesIcons/50balosCrop.png',
            billias: 'assets/HeroesIcons/BilliasAvatar.png',
            kitsos: 'assets/HeroesIcons/KitsosAvatar.png',
            psgiannhs: (typeof PsgiannhsHero !== 'undefined') ? PsgiannhsHero.getAvatarForStyle() : 'assets/HeroesIcons/PsgiannhsAvatar.png'
        };

        const path = avatarMap[hero] || avatarMap.psanas;
        if (this.menuAvatarImg) this.menuAvatarImg.src = path;
        if (this.hudAvatarImg) this.hudAvatarImg.src = path;
        const menuFrame = document.querySelector('.player-avatar-frame-menu');
        if (menuFrame && typeof HeroSkinSystem !== 'undefined') {
            const sk = HeroSkinSystem.getActiveSkin(hero);
            const meta = HeroSkinSystem.getSkinMeta(hero, sk);
            menuFrame.style.borderColor = (sk !== 'default' && meta && meta.accent) ? meta.accent : '';
        }
    }

    initAudioAutoplay() {
        // Audio playback is managed by LoadingScreen onComplete once the menu is shown
    }
}

if (typeof window !== 'undefined') {
    window.MenuController = MenuController;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MenuController };
}
