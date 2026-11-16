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
            kitsos: { name: 'Kitsos', emoji: '⚡', iconKey: 'bolt' }
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
}

if (typeof window !== 'undefined') {
    window.StatsManager = StatsManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StatsManager };
}
