/**
 * Lesa.io - Master UI Controller & Application Bootstrap
 * Coordinates sub-controllers: HUD, Quests, Profile, Roster, Mail, Settings, Modals, and Menu
 */

class UIController {
    constructor() {
        this.gameState = typeof window !== 'undefined' ? window.GameState : null;

        // Modals & Panels
        this.menuScreen = document.getElementById('menu-screen');
        this.pauseModal = document.getElementById('pause-modal');
        this.gameOverModal = document.getElementById('game-over-modal');
        this.dailyQuestsModal = document.getElementById('daily-quests-modal');
        this.storyVictoryModal = document.getElementById('story-victory-modal');

        // Sub-Controllers
        this.hud = new HUDController();
        this.modalManager = new ModalManager();
        this.currencyManager = new CurrencyManager(this.gameState);
        this.questManager = new QuestManager(this);
        this.profileManager = new ProfileManager(this);
        this.heroRoster = new HeroRoster(this);
        this.skillManager = new SkillManager(this);
        this.starterPackModal = new StarterPackModal(this);
        this.mailManager = new MailManager(this);
        this.settingsManager = new SettingsManager(this);
        this.menuController = new MenuController(this);

        if (typeof UpgradeManager !== 'undefined') {
            this.upgradeManager = new UpgradeManager(this);
            window.upgradeManager = this.upgradeManager;
        }

        if (typeof PerkManager !== 'undefined') {
            this.perkManager = new PerkManager(this);
            window.perkManager = this.perkManager;
        }

        if (typeof ChestManager !== 'undefined') {
            this.chestManager = new ChestManager();
            window.chestManager = this.chestManager;
            this.chestManager.init();
        }

        if (typeof CreditsScreen !== 'undefined') {
            this.creditsScreen = new CreditsScreen();
            window.creditsScreen = this.creditsScreen;
        }

        if (typeof InventoryManager !== 'undefined') {
            this.inventoryManager = new InventoryManager();
            window.inventoryManager = this.inventoryManager;
        }

        if (typeof InventoryModalUI !== 'undefined') {
            this.inventoryModalUI = new InventoryModalUI();
            window.inventoryModalUI = this.inventoryModalUI;
            this.inventoryModalUI.init();
        }

        window.questManager = this.questManager;
        window.skillManager = this.skillManager;
        window.uiController = this;

        this.initModals();
    }

    // Getters & Setters for full compatibility
    get coins() {
        return this.gameState ? this.gameState.player.coins : 1500;
    }

    set coins(val) {
        this.setCoins(val);
    }

    get gems() {
        return this.gameState ? this.gameState.player.gems : 50;
    }

    set gems(val) {
        this.setGems(val);
    }

    get selectedHero() {
        return this.gameState ? this.gameState.player.selectedHero : 'psanas';
    }

    set selectedHero(val) {
        if (this.gameState) {
            this.gameState.setSelectedHero(val);
        }
    }

    setCoins(val, animate = true) {
        if (this.gameState) {
            const diff = val - this.gameState.player.coins;
            this.gameState.addCurrency(diff, 0);
        }
    }

    setGems(val, animate = true) {
        if (this.gameState) {
            const diff = val - this.gameState.player.gems;
            this.gameState.addCurrency(0, diff);
        }
    }

    updateCurrencyUI(animate = true) {
        if (this.currencyManager) {
            this.currencyManager.updateUI(animate);
        }
    }

    showFeatureModal(title, desc, content) {
        this.modalManager.showFeatureModal(title, desc, content);
    }

    showDailyQuestsModal() {
        if (this.dailyQuestsModal) {
            this.questManager.renderModalQuests();
            this.dailyQuestsModal.classList.remove('hidden');
        }
    }

    hideDailyQuestsModal() {
        if (this.dailyQuestsModal) {
            this.dailyQuestsModal.classList.add('hidden');
        }
    }

    initModals() {
        // Pause Modal Actions
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            const handlePause = (e) => {
                if (e) {
                    e.stopPropagation();
                    if (e.cancelable) e.preventDefault();
                }
                if (window.soundEngine) window.soundEngine.playSelect();
                if (window.gameInstance) window.gameInstance.pauseGame();
            };
            pauseBtn.addEventListener('click', handlePause);
            pauseBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
        }

        const resumeBtn = document.getElementById('resume-btn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                if (window.gameInstance) window.gameInstance.resumeGame();
            });
        }

        const quitBtn = document.getElementById('pause-menu-btn');
        if (quitBtn) {
            quitBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                if (window.gameInstance && window.gameInstance.coopSession) {
                    if (window.gameInstance.coopSession.isHost && typeof window.gameInstance.coopSession.abortMatch === 'function') {
                        window.gameInstance.coopSession.abortMatch();
                    } else if (typeof window.gameInstance.coopSession.leaveMatch === 'function') {
                        window.gameInstance.coopSession.leaveMatch();
                    }
                    window.gameInstance.coopSession = null;
                }
                this.showMenuScreen();
            });
        }

        // Game Over Actions
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                if (window.soundEngine) {
                    if (typeof window.soundEngine.playStartGame === 'function') {
                        window.soundEngine.playStartGame();
                    } else if (typeof window.soundEngine.playSelect === 'function') {
                        window.soundEngine.playSelect();
                    }
                }
                this.hideGameOverModal();
                if (window.gameInstance) {
                    const hero = this.gameState ? this.gameState.player.selectedHero : 'psanas';
                    window.gameInstance.start(hero);
                }
            });
        }

        const gameOverMenuBtn = document.getElementById('game-over-menu-btn');
        if (gameOverMenuBtn) {
            gameOverMenuBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                this.showMenuScreen();
            });
        }

        // Story Mode Victory Action
        const victoryMenuBtn = document.getElementById('victory-menu-btn');
        if (victoryMenuBtn) {
            victoryMenuBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                this.hideStoryVictoryModal();
                this.showMenuScreen();
            });
        }

        const victoryCreditsBtn = document.getElementById('victory-credits-btn');
        if (victoryCreditsBtn) {
            victoryCreditsBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                this.hideStoryVictoryModal();
                if (this.creditsScreen) {
                    this.creditsScreen.start(() => {
                        this.showMenuScreen();
                    });
                }
            });
        }
    }

    showHUD() {
        if (this.hud) this.hud.show();
    }

    hideHUD() {
        if (this.hud) this.hud.hide();
    }

    updateHUD(player, wave, remainingEnemies = 0, totalEnemies = 0) {
        if (this.hud) this.hud.update(player, wave, remainingEnemies, totalEnemies);
    }

    addKillfeed(message) {
        if (this.hud && typeof this.hud.addKillfeed === 'function') {
            this.hud.addKillfeed(message);
        }
    }

    hideModals() {
        if (this.menuScreen) {
            this.menuScreen.classList.add('hidden');
            this.menuScreen.style.setProperty('display', 'none', 'important');
        }
        if (this.pauseModal) this.pauseModal.classList.add('hidden');
        if (this.gameOverModal) this.gameOverModal.classList.add('hidden');
        if (this.storyVictoryModal) this.storyVictoryModal.classList.add('hidden');
        const gameModeModal = document.getElementById('game-mode-modal');
        if (gameModeModal) gameModeModal.classList.add('hidden');
        if (this.dailyQuestsModal) this.dailyQuestsModal.classList.add('hidden');
        if (this.featureModal) this.featureModal.classList.add('hidden');
        if (this.modalManager && typeof this.modalManager.hideFeatureModal === 'function') {
            this.modalManager.hideFeatureModal();
        }
        if (this.heroRoster && typeof this.heroRoster.hideHeroesModal === 'function') {
            this.heroRoster.hideHeroesModal();
        }
        if (this.profileManager && typeof this.profileManager.hideProfileModal === 'function') {
            this.profileManager.hideProfileModal();
        }
        if (this.mailManager && typeof this.mailManager.hideMailModal === 'function') {
            this.mailManager.hideMailModal();
        }
        if (this.settingsManager && typeof this.settingsManager.hideSettingsModal === 'function') {
            this.settingsManager.hideSettingsModal();
        }
    }

    showPauseModal(pausedBy = null) {
        const pauseTipEl = document.getElementById('pause-tip-text');
        if (pauseTipEl && typeof window !== 'undefined' && window.TipsManager) {
            pauseTipEl.innerHTML = window.TipsManager.getRandomTip({ formatted: true });
        }
        const subtitleEl = document.querySelector('#pause-modal .modal-subtitle');
        if (subtitleEl) {
            subtitleEl.textContent = pausedBy ? `⏸ ${pausedBy.toUpperCase()} PAUSED THE GAME` : 'Catch your breath!';
        }
        if (this.pauseModal) this.pauseModal.classList.remove('hidden');
    }

    hidePauseModal() {
        if (this.pauseModal) this.pauseModal.classList.add('hidden');
    }

    showGameOverModal(score, highScore, wave, kills, timeStr, earnedCoins = 0, earnedXP = 0) {
        const finalScoreEl = document.getElementById('final-score');
        const highScoreEl = document.getElementById('high-score');
        const statWaveEl = document.getElementById('stat-wave');
        const statKillsEl = document.getElementById('stat-kills');
        const statTimeEl = document.getElementById('stat-time');
        const statCoinsEarnedEl = document.getElementById('stat-coins-earned');
        const statXpEarnedEl = document.getElementById('stat-xp-earned');
        const gameOverTipEl = document.getElementById('game-over-tip-text');

        if (finalScoreEl) finalScoreEl.textContent = score.toLocaleString();
        if (highScoreEl) highScoreEl.textContent = highScore.toLocaleString();
        if (statWaveEl) statWaveEl.textContent = `Wave ${wave}`;
        if (statKillsEl) statKillsEl.textContent = kills.toLocaleString();
        if (statTimeEl) statTimeEl.textContent = timeStr;
        if (statCoinsEarnedEl) statCoinsEarnedEl.textContent = `+${earnedCoins.toLocaleString()}`;
        if (statXpEarnedEl) statXpEarnedEl.textContent = `+${earnedXP.toLocaleString()} XP`;

        if (gameOverTipEl) {
            if (wave <= 1) {
                gameOverTipEl.textContent = 'TIP: To get past Wave 1 just shoot the enemies!';
            } else if (typeof window !== 'undefined' && window.TipsManager) {
                gameOverTipEl.innerHTML = window.TipsManager.getRandomTip({ formatted: true });
            }
        }

        if (this.gameOverModal) this.gameOverModal.classList.remove('hidden');
    }

    hideGameOverModal() {
        if (this.gameOverModal) this.gameOverModal.classList.add('hidden');
    }

    startCreditsSequence(player, wave = 20, gameTime = 0) {
        // Award Story Mode Completion Bonuses
        if (this.gameState && typeof this.gameState.addCurrency === 'function') {
            this.gameState.addCurrency(2500, 100);
        } else if (this.currencyManager && typeof this.currencyManager.addCoins === 'function') {
            this.currencyManager.addCoins(2500);
            this.currencyManager.addGems(100);
        }

        if (this.creditsScreen) {
            this.creditsScreen.start(() => {
                this.showMenuScreen();
            });
        } else {
            this.showMenuScreen();
        }
    }

    showStoryVictoryModal(player, wave = 20, gameTime = 0) {
        const score = player ? player.score : 0;
        const kills = player ? player.kills : 0;
        const minutes = Math.floor(gameTime / 3600);
        const seconds = Math.floor((gameTime % 3600) / 60);
        const timeStr = `${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s`;

        const scoreEl = document.getElementById('victory-score');
        const killsEl = document.getElementById('victory-kills');
        const timeEl = document.getElementById('victory-time');

        if (scoreEl) scoreEl.textContent = score.toLocaleString();
        if (killsEl) killsEl.textContent = kills.toLocaleString();
        if (timeEl) timeEl.textContent = timeStr;

        // Award Story Mode Completion Bonuses
        if (this.gameState && typeof this.gameState.addCurrency === 'function') {
            this.gameState.addCurrency(2500, 100);
        } else if (this.currencyManager && typeof this.currencyManager.addCoins === 'function') {
            this.currencyManager.addCoins(2500);
            this.currencyManager.addGems(100);
        }

        if (window.soundEngine) {
            window.soundEngine.playLevelUp();
        }

        if (this.storyVictoryModal) {
            this.storyVictoryModal.classList.remove('hidden');
        }
    }

    hideStoryVictoryModal() {
        if (this.storyVictoryModal) {
            this.storyVictoryModal.classList.add('hidden');
        }
    }

    showMenuScreen() {
        if (window.gameInstance) {
            window.gameInstance.state = 'MENU';
            window.gameInstance.enemies.length = 0;
            window.gameInstance.bullets.length = 0;
            window.gameInstance.drops.length = 0;
            if (window.gameInstance.effects) window.gameInstance.effects.clear();
        }
        if (window.soundEngine) {
            window.soundEngine.stopBGM();
            window.soundEngine.startMenuBGM();
        }

        if (this.menuScreen) {
            this.menuScreen.classList.remove('hidden');
            this.menuScreen.style.removeProperty('display');
        }
        if (this.hud) this.hud.hide();
        if (this.pauseModal) this.pauseModal.classList.add('hidden');
        if (this.gameOverModal) this.gameOverModal.classList.add('hidden');
        if (this.storyVictoryModal) this.storyVictoryModal.classList.add('hidden');
        if (this.creditsScreen && this.creditsScreen.active) this.creditsScreen.close();
        if (this.menuController && typeof this.menuController.hideGameModeModal === 'function') {
            this.menuController.hideGameModeModal();
        }
        if (this.dailyQuestsModal) this.dailyQuestsModal.classList.add('hidden');
        if (this.modalManager) this.modalManager.hideFeatureModal();
        if (this.settingsManager) this.settingsManager.hideSettingsModal();
        if (this.heroRoster) this.heroRoster.hideHeroesModal();
        if (this.chestManager) this.chestManager.render();
    }
}

// Bootstrap on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const ui = new UIController();
    const game = new Game(canvas, ui);

    window.gameInstance = game;
    window.uiController = ui;

    if (typeof CoopLobbyModal !== 'undefined') {
        window.coopLobbyModal = new CoopLobbyModal();
    }

    // Launch Rockstar-Style Dev Intro, then smoothly transition into Comic Loading Screen
    const startLoading = () => {
        const loadingEl = document.getElementById('loading-screen');
        if (loadingEl) {
            loadingEl.classList.remove('hidden');
        }
        if (typeof LoadingScreen !== 'undefined') {
            const loader = new LoadingScreen(() => {
                if (window.soundEngine && (!window.gameInstance || window.gameInstance.state === 'MENU')) {
                    window.soundEngine.startMenuBGM();
                }
                if (ui && ui.currencyManager) {
                    ui.currencyManager.updateUI(false);
                }
            });
            ui.loadingScreen = loader;
            window.loadingScreen = loader;
        }
    };

    if (typeof DevIntro !== 'undefined') {
        const intro = new DevIntro(startLoading);
        window.devIntro = intro;
    } else {
        startLoading();
    }
});
