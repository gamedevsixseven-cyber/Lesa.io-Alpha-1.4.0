/**
 * Lesa.io - Mount Olympus Ascension Victory Modal Controller
 * Displays dedicated victory screen when the player defeats Zeus on Floor 5
 * and ascends Mount Olympus (instead of showing K.O. Game Over).
 */

class OlympusVictoryModal {
    static _bound = false;

    static isOlympusVictoryRun() {
        const g = (typeof window !== 'undefined') ? window.gameInstance : null;
        if (!g || g.gameMode !== 'dungeons') return false;
        const dm = g.waveManager && g.waveManager.dungeonManager;
        if (!dm) return false;
        return dm.floorState === 'DUNGEON_COMPLETED' && (dm.floor || 0) >= (dm.maxFloors || 5);
    }

    static tryShowFromGameOver(score, highScore, wave, kills, timeStr, earnedCoins = 0, earnedXP = 0) {
        if (!this.isOlympusVictoryRun()) return false;
        this.show({ score, highScore, wave, kills, timeStr, earnedCoins, earnedXP });
        return true;
    }

    static bindEvents() {
        if (this._bound || typeof document === 'undefined') return;
        const restartBtn = document.getElementById('olympus-victory-restart-btn');
        const menuBtn = document.getElementById('olympus-victory-menu-btn');
        if (!restartBtn && !menuBtn) return;

        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                if (window.soundEngine) {
                    if (typeof window.soundEngine.playStartGame === 'function') {
                        window.soundEngine.playStartGame();
                    } else if (typeof window.soundEngine.playSelect === 'function') {
                        window.soundEngine.playSelect();
                    }
                }
                const g = window.gameInstance;
                const ui = window.uiController;
                if (g && g.coopSession) {
                    if (g.coopSession.isHost && typeof g.coopSession.abortMatch === 'function') {
                        g.coopSession.abortMatch();
                    } else if (typeof g.coopSession.leaveMatch === 'function') {
                        g.coopSession.leaveMatch();
                    }
                    g.coopSession = null;
                    g.isCoopGuest = false;
                }
                if (window.ascentCrestManager && !window.ascentCrestManager.consumeCrest()) {
                    if (window.soundEngine && typeof window.soundEngine.playGoBack === 'function') {
                        window.soundEngine.playGoBack();
                    }
                    this.hide();
                    if (ui) {
                        ui.showMenuScreen();
                        if (ui.menuController) {
                            ui.menuController.showGameModeModal();
                            ui.menuController.showCrestShortageNotice();
                        }
                    }
                    return;
                }
                this.hide();
                const hero = (window.GameState && window.GameState.player) ? window.GameState.player.selectedHero : 'psanas';
                if (g && typeof g.start === 'function') {
                    g.start(hero, 'dungeons');
                }
            });
        }

        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
                    window.soundEngine.playSelect();
                }
                this.hide();
                if (window.uiController && typeof window.uiController.showMenuScreen === 'function') {
                    window.uiController.showMenuScreen();
                }
            });
        }

        this._bound = true;
    }

    static show({ score = 0, highScore = 0, kills = 0, timeStr = '0m 00s', earnedCoins = 0, earnedXP = 0 } = {}) {
        if (typeof document === 'undefined') return;
        const modal = document.getElementById('olympus-victory-modal');
        if (!modal) return;
        this.bindEvents();

        const setTxt = (id, txt) => {
            const el = document.getElementById(id);
            if (el) el.textContent = txt;
        };

        const isNewBest = score > 0 && score >= highScore;
        const scoreEl = document.getElementById('olympus-victory-score');
        if (scoreEl) {
            scoreEl.innerHTML = isNewBest
                ? `${score.toLocaleString()} <span class="olympus-new-best-pill">NEW BEST</span>`
                : score.toLocaleString();
        }
        setTxt('olympus-victory-high-score', highScore.toLocaleString());
        setTxt('olympus-victory-kills', kills.toLocaleString());
        setTxt('olympus-victory-time', timeStr);
        setTxt('olympus-victory-coins', `+${earnedCoins.toLocaleString()}`);
        setTxt('olympus-victory-xp', `+${earnedXP.toLocaleString()} XP`);

        this._renderSpoilsAndBossBanner();
        this._updateRestartButtonLabel();
        if (typeof EventManager !== 'undefined') EventManager.syncEndScreenBadges();

        if (window.soundEngine && typeof window.soundEngine.playLevelUp === 'function') {
            window.soundEngine.playLevelUp();
        }
        modal.classList.remove('hidden');
    }

    static _renderSpoilsAndBossBanner() {
        const spoilsEl = document.getElementById('olympus-victory-spoils');
        const g = (typeof window !== 'undefined') ? window.gameInstance : null;
        if (spoilsEl) {
            const mats = (g && g.materialsEarnedThisRun) ? Object.entries(g.materialsEarnedThisRun).filter(([, q]) => q > 0) : [];
            const dm = g.waveManager && g.waveManager.dungeonManager;
            const starAwarded = !!(dm && dm.starStoneAwarded);
            const starChip = starAwarded
                ? `<span class="olympus-spoil-chip" style="border-color:#ff4757; color:#ffd32a;">${typeof UiIcons !== 'undefined' ? UiIcons.i('olympian_star_stone', 'ui-icon-sm') : '🌟'} +1 OLYMPIAN STAR-STONE!</span>`
                : '';
            if (mats.length > 0 || starAwarded) {
                const matChips = mats.map(([matId, qty]) => {
                    const def = (typeof MaterialRegistry !== 'undefined') ? MaterialRegistry.get(matId) : null;
                    const ic = def && def.iconKey && typeof UiIcons !== 'undefined'
                        ? UiIcons.i(def.iconKey, 'ui-icon-sm')
                        : (def ? def.icon : '');
                    const label = def ? def.name : matId;
                    return `<span class="olympus-spoil-chip">${ic} +${qty} ${label}</span>`;
                }).join('');
                spoilsEl.innerHTML = starChip + matChips;
            } else {
                const chestIc = typeof UiIcons !== 'undefined' ? UiIcons.i('crate', 'ui-icon-sm') : '';
                spoilsEl.innerHTML = `<span class="olympus-spoil-chip">${chestIc} All 5 Olympus Floor Chests &amp; Summit Spoils Claimed!</span>`;
            }
        }

        const bannerEl = document.getElementById('olympus-victory-boss-banner');
        if (bannerEl) {
            const hasZeusPending = typeof BossRewardManager !== 'undefined' &&
                BossRewardManager.getPending().some((entry) => entry && entry.bossId === 'zeus');
            bannerEl.classList.toggle('hidden', !hasZeusPending);
        }
    }

    static _updateRestartButtonLabel() {
        const restartBtn = document.getElementById('olympus-victory-restart-btn');
        if (!restartBtn) return;
        const crestMgr = (typeof window !== 'undefined') ? window.ascentCrestManager : null;
        if (crestMgr) {
            if (typeof crestMgr.ensureDailyRefill === 'function') crestMgr.ensureDailyRefill();
            const crests = crestMgr.getCount();
            const cap = crestMgr.getCap();
            restartBtn.innerHTML = crests > 0
                ? '<img src="assets/ui-icons/sync.svg" class="ui-icon ui-icon-sm" alt=""> ASCEND AGAIN (1 CREST)'
                : `<img src="assets/ui-icons/crest.svg" class="ui-icon ui-icon-sm" alt=""> NEED CREST (0/${cap})`;
        } else {
            restartBtn.innerHTML = '<img src="assets/ui-icons/sync.svg" class="ui-icon ui-icon-sm" alt=""> ASCEND AGAIN';
        }
    }

    static hide() {
        if (typeof document === 'undefined') return;
        const modal = document.getElementById('olympus-victory-modal');
        if (modal) modal.classList.add('hidden');
    }
}

if (typeof window !== 'undefined') {
    window.OlympusVictoryModal = OlympusVictoryModal;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OlympusVictoryModal };
}
