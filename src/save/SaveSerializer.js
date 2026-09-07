/**
 * Lesa.io - Save State Serializer & Schema Validator
 * Pure functions to serialize GameState into portable JSON and deserialize with defaults
 */

class SaveSerializer {
    /**
     * Serialize GameState into a persistent save payload
     * @param {GameState} state 
     * @returns {Object}
     */
    static serialize(state) {
        if (!state || !state.player) return null;

        return {
            version: 2,
            timestamp: Date.now(),
            player: {
                name: state.player.name || 'Psanas',
                accountLevel: state.player.accountLevel || 1,
                accountXp: state.player.accountXp || 0,
                coins: state.player.coins || 0,
                gold: state.player.coins || 0,
                gems: state.player.gems || 0,
                diamonds: state.player.gems || 0,
                selectedHero: state.player.selectedHero || 'psanas',
                unlockedHeroes: Array.from(state.player.unlockedHeroes || ['psanas']),
                selectedSkill: state.player.selectedSkill || 'blade_rush',
                unlockedSkills: Array.from(state.player.unlockedSkills || ['blade_rush', 'nerobalonaki']),
                skillLevels: { ...(state.player.skillLevels || { blade_rush: 1, nerobalonaki: 1 }) },
                upgrades: { ...(state.player.upgrades || { critChance: 0, critDamage: 0, maxHealth: 0, goldBonus: 0 }) },
                unlockedPerks: Array.from(state.player.unlockedPerks || []),
                equippedPerks: Array.from(state.player.equippedPerks || [null, null, null]),
                equippedGear: (typeof GearManager !== 'undefined') ? GearManager.getEquippedMap() : (state.player.equippedGear || { helmet: null, armor: null, belt: null, gloves: null, boots: null }),
                unlockedGear: (typeof GearManager !== 'undefined') ? Array.from(GearManager.getUnlockedList() || []) : Array.from(state.player.unlockedGear || []),
                stats: {
                    totalKills: state.player.stats.totalKills || 0,
                    maxWave: state.player.stats.maxWave || 1,
                    highScore: state.player.stats.highScore || 0,
                    totalFatmirs: state.player.stats.totalFatmirs || 0,
                    totalCasillas: state.player.stats.totalCasillas || 0,
                    totalSkarmogyftos: state.player.stats.totalSkarmogyftos || 0,
                    matchesPlayed: state.player.stats.matchesPlayed || 0,
                    totalTimeSeconds: state.player.stats.totalTimeSeconds || 0,
                    heroPlays: { ...(state.player.stats.heroPlays || { psanas: 0, psogas: 0, petros: 0 }) }
                }
            },
            settings: {
                musicVolume: state.settings.musicVolume ?? 0.7,
                sfxVolume: state.settings.sfxVolume ?? 0.8,
                showPopups: state.settings.showPopups ?? true,
                showDamage: state.settings.showDamage ?? true,
                screenShake: state.settings.screenShake ?? true
            }
        };
    }

    /**
     * Deserialize portable JSON data into GameState
     * @param {Object} data 
     * @param {GameState} state 
     */
    static deserialize(data, state) {
        if (!data || !data.player || !state) return false;

        try {
            const p = data.player;
            state.player.name = p.name || state.player.name;
            state.player.accountLevel = p.accountLevel || state.player.accountLevel;
            state.player.accountXp = p.accountXp || state.player.accountXp;
            state.player.coins = typeof p.coins === 'number' ? p.coins : (typeof p.gold === 'number' ? p.gold : state.player.coins);
            state.player.gems = typeof p.diamonds === 'number' ? p.diamonds : (typeof p.gems === 'number' ? p.gems : state.player.gems);
            state.player.selectedHero = p.selectedHero || state.player.selectedHero;
            state.player.selectedSkill = p.selectedSkill || state.player.selectedSkill || 'blade_rush';

            if (Array.isArray(p.unlockedHeroes)) {
                state.player.unlockedHeroes = Array.from(new Set([...state.player.unlockedHeroes, ...p.unlockedHeroes]));
            }

            if (Array.isArray(p.unlockedSkills)) {
                state.player.unlockedSkills = Array.from(new Set([...state.player.unlockedSkills, ...p.unlockedSkills]));
            }

            if (p.skillLevels && typeof p.skillLevels === 'object') {
                state.player.skillLevels = { ...(state.player.skillLevels || { blade_rush: 1, nerobalonaki: 1 }), ...p.skillLevels };
            }

            if (p.upgrades && typeof p.upgrades === 'object') {
                state.player.upgrades = { ...(state.player.upgrades || { critChance: 0, critDamage: 0, maxHealth: 0, goldBonus: 0 }), ...p.upgrades };
                localStorage.setItem('lesaio_upgrades', JSON.stringify(state.player.upgrades));
            }

            if (Array.isArray(p.unlockedPerks)) {
                state.player.unlockedPerks = Array.from(new Set([...(state.player.unlockedPerks || []), ...p.unlockedPerks]));
                if (state.player.accountLevel < 5) {
                    state.player.unlockedPerks = state.player.unlockedPerks.filter(id => id !== 'hot_foot');
                } else if (!state.player.unlockedPerks.includes('hot_foot')) {
                    state.player.unlockedPerks.push('hot_foot');
                }
                localStorage.setItem('lesaio_unlocked_perks', JSON.stringify(state.player.unlockedPerks));
            }

            if (Array.isArray(p.equippedPerks)) {
                state.player.equippedPerks = p.equippedPerks.slice(0, 3);
                while (state.player.equippedPerks.length < 3) state.player.equippedPerks.push(null);
                localStorage.setItem('lesaio_equipped_perks', JSON.stringify(state.player.equippedPerks));
            }

            if (p.equippedGear && typeof p.equippedGear === 'object') {
                state.player.equippedGear = { helmet: null, armor: null, belt: null, gloves: null, boots: null, ...p.equippedGear };
                localStorage.setItem('lesaio_equipped_gear', JSON.stringify(state.player.equippedGear));
            }

            if (Array.isArray(p.unlockedGear)) {
                state.player.unlockedGear = Array.from(new Set([...(state.player.unlockedGear || []), ...p.unlockedGear]));
                localStorage.setItem('lesaio_unlocked_gear', JSON.stringify(state.player.unlockedGear));
            }

            if (p.stats) {
                const s = p.stats;
                const cur = state.player.stats;
                cur.totalKills = Math.max(cur.totalKills, s.totalKills || 0);
                cur.maxWave = Math.max(cur.maxWave, s.maxWave || 1);
                cur.highScore = Math.max(cur.highScore, s.highScore || 0);
                cur.totalFatmirs = Math.max(cur.totalFatmirs, s.totalFatmirs || 0);
                cur.totalCasillas = Math.max(cur.totalCasillas, s.totalCasillas || 0);
                cur.totalSkarmogyftos = Math.max(cur.totalSkarmogyftos || 0, s.totalSkarmogyftos || 0);
                cur.matchesPlayed = Math.max(cur.matchesPlayed, s.matchesPlayed || 0);
                cur.totalTimeSeconds = Math.max(cur.totalTimeSeconds, s.totalTimeSeconds || 0);

                if (s.heroPlays) {
                    for (const [hero, count] of Object.entries(s.heroPlays)) {
                        cur.heroPlays[hero] = Math.max(cur.heroPlays[hero] || 0, count);
                    }
                }
            }

            if (data.settings) {
                state.settings.musicVolume = data.settings.musicVolume ?? state.settings.musicVolume;
                state.settings.sfxVolume = data.settings.sfxVolume ?? state.settings.sfxVolume;
                state.settings.showPopups = data.settings.showPopups ?? state.settings.showPopups;
                state.settings.showDamage = data.settings.showDamage ?? state.settings.showDamage;
                state.settings.screenShake = data.settings.screenShake ?? state.settings.screenShake;
            }

            return true;
        } catch (err) {
            console.error('[SaveSerializer] Failed to deserialize save data:', err);
            return false;
        }
    }
}

if (typeof window !== 'undefined') {
    window.SaveSerializer = SaveSerializer;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SaveSerializer };
}
