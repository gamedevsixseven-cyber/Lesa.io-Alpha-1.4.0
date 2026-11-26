/**
 * Lesa.io - Lifetime Career Statistics Manager
 * Formats career statistics, calculates favorite hero, and synchronizes with GameState
 */

class StatsManager {
    constructor(gameState = null) {
        this.gameState = gameState || (typeof window !== 'undefined' ? window.GameState : null);
    }

    get stats() {
        return this.gameState ? this.gameState.player.stats : {
            totalKills: 0,
            maxWave: 1,
            highScore: 0,
            totalFatmirs: 0,
            totalCasillas: 0,
            matchesPlayed: 0,
            totalTimeSeconds: 0,
            heroPlays: { psanas: 0, psogas: 0, petros: 0 }
        };
    }

    /**
     * Compute most played hero name & icon
     */
    getFavoriteHero() {
        const plays = this.stats.heroPlays || { psanas: 0, psogas: 0, petros: 0 };
        let fav = 'psanas';
        let max = -1;

        for (const [hero, count] of Object.entries(plays)) {
            if (count > max) {
                max = count;
                fav = hero;
            }
        }

        const map = {
            psanas: { name: 'Psanas', emoji: '🏹', iconKey: 'target' },
            psogas: { name: 'Psogas', emoji: '🔥', iconKey: 'flame' },
            petros: { name: 'Petros', emoji: '🛡️', iconKey: 'shield' },
            '50balos': { name: '50balos', emoji: '💰', iconKey: 'bag_gold' },
            billias: { name: 'Billias', emoji: '🍔', iconKey: 'weapon_burger' },
            kitsos: { name: 'Kitsos', emoji: '⚡', iconKey: 'bolt' },
            psgiannhs: { name: 'Psgiannhs', emoji: '🥊', iconKey: 'boxing_glove' }
        };

        return map[fav] || { name: 'Psanas', emoji: '🏹', iconKey: 'target' };
    }

    /**
     * Format seconds into readable string (e.g. "12m 45s" or "2h 15m")
     */
    formatTime(totalSeconds) {
        const sec = Math.floor(totalSeconds % 60);
        const min = Math.floor((totalSeconds / 60) % 60);
        const hrs = Math.floor(totalSeconds / 3600);

        if (hrs > 0) {
            return `${hrs}h ${min}m`;
        }
        return `${min}m ${sec < 10 ? '0' : ''}${sec}s`;
    }

    /**
     * Calculate usage percentage for a hero
     */
    getHeroUsagePct(heroId) {
        const total = this.stats.matchesPlayed || 0;
        if (total === 0) return 0;
        const count = (this.stats.heroPlays && this.stats.heroPlays[heroId]) || 0;
        return Math.min(100, Math.round((count / total) * 100));
    }

    static beginMatchSession(gs, heroId = 'psanas', gameMode = 'story') {
        if (!gs) return;
        gs._liveMatch = {
            active: true, countedMatch: false, heroId, gameMode,
            syncedKills: 0, syncedFatmirs: 0, syncedCasillas: 0, syncedSkarmogyftos: 0,
            syncedTimeSec: 0, lastFrameTime: 0, lastCloudMs: 0
        };
    }

    static syncLiveGame(gs, game, finalize = false, forceNow = false) {
        if (!gs || !game || !game.player) return;
        if (!finalize && !forceNow && Math.abs((game.gameTime || 0) - ((gs._liveMatch && gs._liveMatch.lastFrameTime) || 0)) < 120) return;
        const modeKey = (game.gameMode === 'endless' && game.isEndlessHard) ? 'endless_hard' : (game.gameMode || 'story');
        if (!gs._liveMatch || !gs._liveMatch.active) {
            if (game.state !== 'PLAYING' && game.state !== 'PAUSED' && game.state !== 'CREDITS') return;
            this.beginMatchSession(gs, game.player.heroType || 'psanas', modeKey);
        }
        gs._liveMatch.lastFrameTime = game.gameTime || 0;
        const p = game.player;
        const fatmirs = p.fatmirKills || 0, casillas = p.casillasKills || 0, skarmo = p.skarmogyftosKills || 0;
        const bosses = (p.kleanthisKills || 0) + (p.kiloumpasKills || 0) + (p.roufKills || 0);
        const totalKills = Math.max(p.kills || 0, fatmirs + casillas + skarmo + bosses);
        const wave = (game.waveManager && game.waveManager.wave) || 1;
        const timeSec = (game.gameTime || 0) / 60;
        gs.recordMatch(p.score || 0, wave, timeSec, fatmirs, casillas, p.heroType, skarmo, totalKills, modeKey, !finalize);
        game.highScore = gs.player.stats.highScore;
        if (typeof window !== 'undefined') {
            if (window.uiController && window.uiController.profileManager && typeof window.uiController.profileManager.updateProfileUI === 'function') {
                window.uiController.profileManager.updateProfileUI();
            }
            const now = Date.now();
            if (finalize || forceNow) {
                if (window.SaveManager && typeof window.SaveManager.saveNow === 'function') window.SaveManager.saveNow();
            } else if (gs._liveMatch && now - (gs._liveMatch.lastCloudMs || 0) > 15000) {
                gs._liveMatch.lastCloudMs = now;
                if (window.SaveManager && typeof window.SaveManager.requestSave === 'function') window.SaveManager.requestSave('live-stats');
            }
        }
    }

    static recordMatchProgress(gs, score, wave, timeSeconds, fatmirs, casillas, heroId, skarmogyftos = 0, totalMatchKills = null, gameMode = null, isLiveTick = false) {
        if (!gs || !gs.player || !gs.player.stats) return;
        const stats = gs.player.stats;
        const matchKills = typeof totalMatchKills === 'number' ? totalMatchKills : (fatmirs + casillas + skarmogyftos);
        const floorTime = Math.floor(timeSeconds || 0);
        const lm = (gs._liveMatch && gs._liveMatch.active) ? gs._liveMatch : null;

        if (lm) {
            if (!lm.countedMatch) {
                lm.countedMatch = true;
                stats.matchesPlayed += 1;
                const hId = heroId || lm.heroId;
                if (hId) {
                    stats.heroPlays[hId] = (stats.heroPlays[hId] || 0) + 1;
                    localStorage.setItem('lesaio_hero_plays', JSON.stringify(stats.heroPlays));
                }
            }
            const dTime = Math.max(0, floorTime - lm.syncedTimeSec);
            const dFat = Math.max(0, (fatmirs || 0) - lm.syncedFatmirs);
            const dCas = Math.max(0, (casillas || 0) - lm.syncedCasillas);
            const dSkar = Math.max(0, (skarmogyftos || 0) - lm.syncedSkarmogyftos);
            const dKills = Math.max(0, (matchKills || 0) - lm.syncedKills);
            stats.totalTimeSeconds += dTime;
            stats.totalFatmirs += dFat;
            stats.totalCasillas += dCas;
            stats.totalSkarmogyftos = (stats.totalSkarmogyftos || 0) + dSkar;
            stats.totalKills += dKills;
            lm.syncedTimeSec += dTime;
            lm.syncedFatmirs += dFat;
            lm.syncedCasillas += dCas;
            lm.syncedSkarmogyftos += dSkar;
            lm.syncedKills += dKills;
            if (!isLiveTick) lm.active = false;
        } else {
            stats.matchesPlayed += 1;
            stats.totalTimeSeconds += floorTime;
            stats.totalFatmirs += fatmirs;
            stats.totalCasillas += casillas;
            stats.totalSkarmogyftos = (stats.totalSkarmogyftos || 0) + skarmogyftos;
            stats.totalKills += matchKills;
            if (heroId) {
                stats.heroPlays[heroId] = (stats.heroPlays[heroId] || 0) + 1;
                localStorage.setItem('lesaio_hero_plays', JSON.stringify(stats.heroPlays));
            }
        }

        if (score > stats.highScore) {
            stats.highScore = score;
            localStorage.setItem('lesaio_highscore', score.toString());
        }
        if (wave > stats.maxWave) {
            stats.maxWave = wave;
            localStorage.setItem('lesaio_max_wave', wave.toString());
        }
        if (gameMode && typeof PerkProgression !== 'undefined') {
            PerkProgression.recordWaveProgress(gs, gameMode, wave);
        }

        localStorage.setItem('lesaio_total_kills', stats.totalKills.toString());
        localStorage.setItem('lesaio_total_fatmirs', stats.totalFatmirs.toString());
        localStorage.setItem('lesaio_total_casillas', stats.totalCasillas.toString());
        localStorage.setItem('lesaio_total_skarmogyftos', stats.totalSkarmogyftos.toString());
        localStorage.setItem('lesaio_matches_played', stats.matchesPlayed.toString());
        localStorage.setItem('lesaio_total_time_seconds', stats.totalTimeSeconds.toString());
        if (typeof gs._touchMutation === 'function') gs._touchMutation();

        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.emit('statsUpdated', { stats });
        }
    }
}

if (typeof window !== 'undefined') {
    window.StatsManager = StatsManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StatsManager };
}
