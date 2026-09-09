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

        this.initButtons();
        this.updateHeroAvatarUI();
        this.startStarterPackTimer();

        // Listen for hero changes
        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.on('heroSelected', () => this.updateHeroAvatarUI());
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
            if (window.soundEngine && typeof window.soundEngine.playStartGame === 'function') {
                window.soundEngine.playStartGame();
            } else if (window.soundEngine) {
                window.soundEngine.playSelect();
            }
            this.startGame('endless');
        };

        const handleDungeons = () => {
            if (window.soundEngine) window.soundEngine.playHit();
            if (this.ui && typeof this.ui.addKillfeed === 'function') {
                this.ui.addKillfeed('🏰 Dungeons opening in Chapter 3!');
            }
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
                this.ui.modalManager.showFeatureModal(
                    '🏆 GLOBAL LEADERBOARDS',
                    'Top .io Champions',
                    'Check world rankings for most Skatmirs bonked and Casillases outplayed!'
                );
            });
        }

        const friendsBtn = document.getElementById('btn-friends');
        if (friendsBtn) {
            friendsBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                this.ui.modalManager.showFeatureModal(
                    '👥 FRIENDS',
                    'Social & Co-op Arena',
                    'Connect with cartoon battle companions and send daily cookie gifts!'
                );
            });
        }

        const clansBtn = document.getElementById('btn-clans');
        if (clansBtn) {
            clansBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                this.ui.modalManager.showFeatureModal(
                    '🛡️ CLANS & GUILDS',
                    'Team battle arena',
                    'Join forces with other heroes to tackle giant Boss Skatmirs together.'
                );
            });
        }

        const eventsBtn = document.getElementById('btn-events');
        if (eventsBtn) {
            eventsBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                this.ui.modalManager.showFeatureModal(
                    '📅 WEEKEND EVENTS',
                    'Special game modes',
                    'Event: Double XP Meadow Mayhem starting soon!'
                );
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

        const bpBtn = document.getElementById('view-battle-pass-btn');
        if (bpBtn) {
            bpBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                this.ui.modalManager.showFeatureModal(
                    '👑 SEASON 1 BATTLE PASS',
                    'Tier Progression Rewards',
                    'Tier 1 / 30: Reach tier 5 to unlock exclusive Psogas fiery skins!'
                );
            });
        }

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
        if (this.gameModeModal) this.gameModeModal.classList.remove('hidden');
    }

    hideGameModeModal() {
        if (!this.gameModeModal) this.gameModeModal = document.getElementById('game-mode-modal');
        if (this.gameModeModal) this.gameModeModal.classList.add('hidden');
    }

    startGame(gameMode = 'story') {
        this.hideGameModeModal();
        if (typeof window.triggerGameFullscreen === 'function') {
            window.triggerGameFullscreen();
        }
        if (this.menuScreen) {
            this.menuScreen.classList.add('hidden');
            this.menuScreen.style.setProperty('display', 'none', 'important');
        }
        this.ui.hud.show();

        if (window.gameInstance) {
            const hero = this.gameState ? this.gameState.player.selectedHero : 'psanas';
            if (typeof window.gameInstance.startNewGame === 'function') {
                window.gameInstance.startNewGame(hero, gameMode);
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
            kitsos: 'assets/HeroesIcons/KitsosAvatar.png'
        };

        const path = avatarMap[hero] || avatarMap.psanas;
        if (this.menuAvatarImg) this.menuAvatarImg.src = path;
        if (this.hudAvatarImg) this.hudAvatarImg.src = path;
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
