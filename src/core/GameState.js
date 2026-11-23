/**
 * Lesa.io - Canonical Game State (Single Source of Truth)
 * Centralizes all authoritative player data, career stats, settings, and session state
 */

class GameState {
    static _safeJson(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw || raw === 'undefined' || raw === 'null') return fallback;
            const parsed = JSON.parse(raw);
            return parsed !== null && parsed !== undefined ? parsed : fallback;
        } catch (_) {
            return fallback;
        }
    }

    static _safeInt(key, fallback, min = null) {
        try {
            const raw = localStorage.getItem(key);
            if (raw === null || raw === '') return fallback;
            const n = parseInt(raw, 10);
            if (!Number.isFinite(n)) return fallback;
            return min !== null ? Math.max(min, n) : n;
        } catch (_) {
            return fallback;
        }
    }

    constructor() {
        const sj = GameState._safeJson;
        const si = GameState._safeInt;
        // Player Profile & Identity
        this.player = {
            name: localStorage.getItem('lesaio_player_name') || 'Psanas',
            accountLevel: si('lesaio_account_level', 1, 1),
            accountXp: si('lesaio_account_xp', 0, 0),
            coins: si('lesaio_coins', 1500, 0),
            gems: si('lesaio_gems', 50, 0),
            selectedHero: localStorage.getItem('lesaio_selected_hero') || 'psanas',
            heroStyles: { psgiannhs: localStorage.getItem('lesaio_hero_style_psgiannhs') || 'jacket' },
            unlockedHeroes: sj('lesaio_unlocked_heroes', ['psanas']),
            selectedSkill: localStorage.getItem('lesaio_selected_skill') || 'blade_rush',
            unlockedSkills: sj('lesaio_unlocked_skills', ['blade_rush', 'nerobalonaki']),
            skillLevels: sj('lesaio_skill_levels', { blade_rush: 1, nerobalonaki: 1 }),
            selectedWeapon: localStorage.getItem('lesaio_selected_weapon') || 'pea',
            unlockedWeapons: sj('lesaio_unlocked_weapons', ['pea']),
            upgrades: sj('lesaio_upgrades', { critChance: 0, critDamage: 0, maxHealth: 0, goldBonus: 0 }),
            unlockedPerks: sj('lesaio_unlocked_perks', []),
            equippedPerks: sj('lesaio_equipped_perks', [null, null, null]),
            gearLevels: sj('lesaio_gear_levels', {}),
            evolvedGear: sj('lesaio_evolved_gear', []),
            evolvedWeapons: sj('lesaio_evolved_weapons', []),
            evolutionStones: si('lesaio_evolution_stones', 0, 0),
            perkRanks: (() => {
                const unlocked = sj('lesaio_unlocked_perks', []);
                const raw = sj('lesaio_perk_ranks', {});
                return (typeof PerkProgression !== 'undefined')
                    ? PerkProgression.normalizePerkRanks(raw, unlocked)
                    : raw;
            })(),
            combatFeats: (typeof PerkProgression !== 'undefined')
                ? PerkProgression.loadFeats()
                : { storyMaxWave: 1, endlessMaxWave: 0, olympusMaxFloor: 0, defeatedBosses: {}, endlessMiniBossKills: 0 },
            cosmetics: (typeof CosmeticManager !== 'undefined')
                ? CosmeticManager.getState()
                : {
                    equippedBanner: localStorage.getItem('lesaio_equipped_banner') || 'banner_recruit',
                    equippedFrame: localStorage.getItem('lesaio_equipped_frame') || 'frame_rookie',
                    displayedCoins: sj('lesaio_displayed_coins', []),
                    unlockedBanners: sj('lesaio_unlocked_banners', ['banner_recruit']),
                    unlockedFrames: sj('lesaio_unlocked_frames', ['frame_rookie']),
                    unlockedCoins: sj('lesaio_unlocked_coins', [])
                },
            materials: (() => {
                const invRaw = sj('lesaio_inventory', {});
                return (typeof MaterialRegistry !== 'undefined') ? MaterialRegistry.normalizeMap(invRaw.materials) : (invRaw.materials || {});
            })(),
            stats: {
                totalKills: si('lesaio_total_kills', 0, 0),
                maxWave: si('lesaio_max_wave', 1, 1),
                highScore: si('lesaio_highscore', 0, 0),
                totalFatmirs: si('lesaio_total_fatmirs', 0, 0),
                totalCasillas: si('lesaio_total_casillas', 0, 0),
                totalSkarmogyftos: si('lesaio_total_skarmogyftos', 0, 0),
                matchesPlayed: si('lesaio_matches_played', 0, 0),
                totalTimeSeconds: si('lesaio_total_time_seconds', 0, 0),
                heroPlays: sj('lesaio_hero_plays', { psanas: 0, psogas: 0, petros: 0 })
            }
        };

        // Free Level 5 Reward: Hot Foot is granted freely once Account Level reaches 5
        if (!Array.isArray(this.player.unlockedPerks)) {
            this.player.unlockedPerks = [];
        }
        if (this.player.accountLevel < 5) {
            // Lock Hot Foot if player is below Level 5
            this.player.unlockedPerks = this.player.unlockedPerks.filter(id => id !== 'hot_foot');
            this.player.equippedPerks = this.player.equippedPerks.map(id => id === 'hot_foot' ? null : id);
            localStorage.setItem('lesaio_unlocked_perks', JSON.stringify(this.player.unlockedPerks));
            localStorage.setItem('lesaio_equipped_perks', JSON.stringify(this.player.equippedPerks));
        } else if (!this.player.unlockedPerks.includes('hot_foot')) {
            // Grant Hot Foot freely if Level 5+
            this.player.unlockedPerks.push('hot_foot');
            if (!this.player.perkRanks || !this.player.perkRanks.hot_foot) {
                this.player.perkRanks = { ...(this.player.perkRanks || {}), hot_foot: 1 };
                localStorage.setItem('lesaio_perk_ranks', JSON.stringify(this.player.perkRanks));
            }
            localStorage.setItem('lesaio_unlocked_perks', JSON.stringify(this.player.unlockedPerks));
        }

        // Alpha Exclusive Weapon Gate: Bubble Gun is only unlocked once claimed from the Alpha Founder Mail
        const isBubbleClaimed = localStorage.getItem('lesaio_alpha_bubble_mail_claimed') === 'true' || localStorage.getItem('lesaio_weapon_bubble_unlocked') === 'true';
        if (!isBubbleClaimed) {
            this.player.unlockedWeapons = this.player.unlockedWeapons.filter(w => w !== 'bubble');
            if (this.player.selectedWeapon === 'bubble') {
                this.player.selectedWeapon = 'pea';
                localStorage.setItem('lesaio_selected_weapon', 'pea');
            }
            localStorage.setItem('lesaio_unlocked_weapons', JSON.stringify(this.player.unlockedWeapons));
        } else if (!this.player.unlockedWeapons.includes('bubble')) {
            this.player.unlockedWeapons.push('bubble');
            localStorage.setItem('lesaio_unlocked_weapons', JSON.stringify(this.player.unlockedWeapons));
        }

        // User Settings & Preferences
        this.settings = {
            musicVolume: parseFloat(localStorage.getItem('lesaio_music_volume') || '0.7'),
            sfxVolume: parseFloat(localStorage.getItem('lesaio_sfx_volume') || '0.8'),
            showPopups: localStorage.getItem('lesaio_popups') !== 'false',
            showDamage: localStorage.getItem('lesaio_damage_numbers') !== 'false',
            screenShake: localStorage.getItem('lesaio_screenshake') !== 'false',
            privateLoadout: localStorage.getItem('lesaio_private_loadout') === 'true'
        };

        // Active Session Transient State
        this.session = {
            status: 'MENU', // 'MENU', 'PLAYING', 'PAUSED', 'GAMEOVER'
            wave: 1,
            score: 0,
            fatmirsKilled: 0,
            casillasKilled: 0,
            timeElapsed: 0
        };
    }

    _touchMutation() {
        if (typeof SaveMigration !== 'undefined') SaveMigration.recordLocalMutation();
        if (typeof window !== 'undefined' && window.cloudSave && typeof window.cloudSave.markLocalMutationDirty === 'function') {
            window.cloudSave.markLocalMutationDirty();
        }
    }

    save() {
        if (typeof window !== 'undefined' && window.SaveManager && typeof window.SaveManager.requestSave === 'function') {
            window.SaveManager.requestSave();
        }
    }

    /**
     * Update player currency with validation and emit event
     */
    addCurrency(coinsDelta = 0, gemsDelta = 0) {
        const oldCoins = this.player.coins;
        const oldGems = this.player.gems;

        this.player.coins = Math.max(0, this.player.coins + coinsDelta);
        this.player.gems = Math.max(0, this.player.gems + gemsDelta);

        localStorage.setItem('lesaio_coins', this.player.coins.toString());
        localStorage.setItem('lesaio_gems', this.player.gems.toString());
        this._touchMutation();

        if (window.EventBus) {
            window.EventBus.emit('currencyChanged', {
                coins: this.player.coins,
                gems: this.player.gems,
                coinsDelta,
                gemsDelta,
                oldCoins,
                oldGems
            });
        }
    }

    /**
     * Directly set player currency (used by cloud sync / live updates)
     */
    setCurrency(coins, gems) {
        const oldCoins = this.player.coins;
        const oldGems = this.player.gems;

        if (typeof coins === 'number' && !isNaN(coins)) this.player.coins = Math.max(0, coins);
        if (typeof gems === 'number' && !isNaN(gems)) this.player.gems = Math.max(0, gems);

        localStorage.setItem('lesaio_coins', this.player.coins.toString());
        localStorage.setItem('lesaio_gems', this.player.gems.toString());
        this._touchMutation();

        if (window.EventBus) {
            window.EventBus.emit('currencyChanged', {
                coins: this.player.coins,
                gems: this.player.gems,
                coinsDelta: this.player.coins - oldCoins,
                gemsDelta: this.player.gems - oldGems,
                oldCoins,
                oldGems
            });
        }
    }

    /**
     * Spend coins if sufficient balance exists
     */
    spendCoins(amount) {
        if (this.player.coins < amount) return false;
        this.addCurrency(-amount, 0);
        return true;
    }

    /**
     * Spend gems if sufficient balance exists
     */
    spendGems(amount) {
        if (this.player.gems < amount) return false;
        this.addCurrency(0, -amount);
        return true;
    }

    /**
     * Select active hero
     */
    setSelectedHero(heroId) {
        if (!this.player.unlockedHeroes.includes(heroId)) return false;
        this.player.selectedHero = heroId;
        localStorage.setItem('lesaio_selected_hero', heroId);

        if (window.EventBus) {
            window.EventBus.emit('heroSelected', { heroId });
        }
        return true;
    }

    /**
     * Unlock a new hero
     */
    unlockHero(heroId, cost = 0) {
        if (this.player.unlockedHeroes.includes(heroId)) return true;
        if (cost > 0 && !this.spendCoins(cost)) return false;

        this.player.unlockedHeroes.push(heroId);
        localStorage.setItem('lesaio_unlocked_heroes', JSON.stringify(this.player.unlockedHeroes));
        this._touchMutation();

        if (window.EventBus) {
            window.EventBus.emit('heroUnlocked', { heroId });
        }
        return true;
    }

    /**
     * Check if perk is equipped in any loadout slot
     */
    hasPerk(perkId) {
        return Array.isArray(this.player.equippedPerks) && this.player.equippedPerks.includes(perkId);
    }

    /**
     * Get unlocked perk rank (0 if locked, 1..maxRank if unlocked)
     */
    getPerkRank(perkId) {
        if (typeof PerkProgression !== 'undefined') {
            return PerkProgression.getPerkRank(this, perkId);
        }
        return (Array.isArray(this.player.unlockedPerks) && this.player.unlockedPerks.includes(perkId)) ? 1 : 0;
    }

    /**
     * Get active rank stats object for a perk (defaults cleanly to Rank 1 stats)
     */
    getPerkRankStats(perkId) {
        if (typeof PerkProgression === 'undefined') return null;
        const rank = Math.max(1, this.getPerkRank(perkId));
        const rankData = PerkProgression.getPerkRankData(perkId, rank);
        return (rankData && rankData.stats) || null;
    }

    /**
     * Unlock/forge a perk with detailed result { success, reason }
     */
    unlockPerkWithResult(perkId, costOverride = null) {
        if (typeof PerkProgression !== 'undefined') {
            return PerkProgression.unlockPerk(this, perkId, costOverride);
        }
        if (!Array.isArray(this.player.unlockedPerks)) this.player.unlockedPerks = [];
        if (this.player.unlockedPerks.includes(perkId)) return { success: true };
        const cost = typeof costOverride === 'number' ? costOverride : 0;
        if (cost > 0 && !this.spendCoins(cost)) return { success: false, reason: 'Not enough Coins!' };
        this.player.unlockedPerks.push(perkId);
        localStorage.setItem('lesaio_unlocked_perks', JSON.stringify(this.player.unlockedPerks));
        if (window.EventBus) window.EventBus.emit('perkUnlocked', { perkId });
        return { success: true };
    }

    /**
     * Unlock a perk (boolean return preserved for backward compatibility)
     */
    unlockPerk(perkId, cost = null) {
        return !!this.unlockPerkWithResult(perkId, cost).success;
    }

    /**
     * Ascend/upgrade an unlocked perk to its next rank (Lv.1 -> Lv.3)
     */
    upgradePerk(perkId) {
        if (typeof PerkProgression === 'undefined') {
            return { success: false, reason: 'Perk progression unavailable' };
        }
        return PerkProgression.upgradePerk(this, perkId);
    }

    /**
     * Record a defeated boss for lifetime feat gates
     */
    recordBossDefeat(bossId) {
        if (typeof PerkProgression === 'undefined') return false;
        return PerkProgression.recordBossDefeat(this, bossId);
    }

    /**
     * Record highest wave / floor reached per mode for feat gates
     */
    recordWaveProgress(mode, waveNum) {
        if (typeof PerkProgression === 'undefined') return false;
        return PerkProgression.recordWaveProgress(this, mode, waveNum);
    }

    /**
     * Equip perk into a specific loadout slot (0, 1, or 2)
     */
    equipPerk(perkId, targetSlot = 0) {
        if (!Array.isArray(this.player.unlockedPerks) || !this.player.unlockedPerks.includes(perkId)) return false;
        if (!Array.isArray(this.player.equippedPerks)) this.player.equippedPerks = [null, null, null];

        // Ensure 3 slots
        while (this.player.equippedPerks.length < 3) this.player.equippedPerks.push(null);
        if (this.player.equippedPerks.length > 3) this.player.equippedPerks = this.player.equippedPerks.slice(0, 3);

        // Remove from existing slot if already equipped elsewhere (freeform swapping)
        for (let i = 0; i < 3; i++) {
            if (this.player.equippedPerks[i] === perkId) {
                this.player.equippedPerks[i] = null;
            }
        }

        // Check Tag/Group Exclusivity (e.g. max 1 'dash' or 'capstone' perk at a time)
        const getGroup = (id) => {
            if (typeof PerkProgression !== 'undefined') return PerkProgression.getExclusiveGroup(id);
            const def = (typeof PERKS_DATA !== 'undefined') ? PERKS_DATA[id] : null;
            const exclusiveTags = (typeof EXCLUSIVE_PERK_TAGS !== 'undefined') ? EXCLUSIVE_PERK_TAGS : ['dash'];
            return (def && def.tag && exclusiveTags.includes(def.tag)) ? def.tag : null;
        };

        const exclusiveGroup = getGroup(perkId);
        let swappedOldPerk = null;

        if (exclusiveGroup) {
            for (let i = 0; i < 3; i++) {
                const existingId = this.player.equippedPerks[i];
                if (existingId && existingId !== perkId && getGroup(existingId) === exclusiveGroup) {
                    const existingDef = (typeof PERKS_DATA !== 'undefined') ? PERKS_DATA[existingId] : null;
                    this.player.equippedPerks[i] = null;
                    swappedOldPerk = existingDef;
                }
            }
        }

        const slot = Math.max(0, Math.min(2, targetSlot));
        this.player.equippedPerks[slot] = perkId;
        localStorage.setItem('lesaio_equipped_perks', JSON.stringify(this.player.equippedPerks));

        if (window.EventBus) {
            window.EventBus.emit('perkEquipped', { perkId, slot, swappedOldPerk, exclusiveGroup });
        }
        return true;
    }

    /**
     * Unequip perk from loadout slot
     */
    unequipPerk(slotIndex) {
        if (!Array.isArray(this.player.equippedPerks)) return;
        const slot = Math.max(0, Math.min(2, slotIndex));
        const perkId = this.player.equippedPerks[slot];
        this.player.equippedPerks[slot] = null;
        localStorage.setItem('lesaio_equipped_perks', JSON.stringify(this.player.equippedPerks));

        if (window.EventBus) {
            window.EventBus.emit('perkUnequipped', { perkId, slot });
        }
    }

    /**
     * Add Account Level XP
     */
    addAccountXP(amount) {
        this.player.accountXp += amount;
        let leveledUp = false;
        let xpNeeded = 100 * this.player.accountLevel;

        while (this.player.accountXp >= xpNeeded) {
            this.player.accountXp -= xpNeeded;
            this.player.accountLevel += 1;
            xpNeeded = 100 * this.player.accountLevel;
            leveledUp = true;
        }

        localStorage.setItem('lesaio_account_level', this.player.accountLevel.toString());
        localStorage.setItem('lesaio_account_xp', this.player.accountXp.toString());
        this._touchMutation();

        // Check if player just reached Level 5 to unlock Hot Foot for free!
        if (leveledUp && this.player.accountLevel >= 5 && !this.player.unlockedPerks.includes('hot_foot')) {
            this.player.unlockedPerks.push('hot_foot');
            this.player.perkRanks = { ...(this.player.perkRanks || {}), hot_foot: 1 };
            localStorage.setItem('lesaio_unlocked_perks', JSON.stringify(this.player.unlockedPerks));
            localStorage.setItem('lesaio_perk_ranks', JSON.stringify(this.player.perkRanks));
            if (window.EventBus) {
                window.EventBus.emit('perkUnlocked', { perkId: 'hot_foot' });
            }
            if (window.modalManager && typeof window.modalManager.showQuickToast === 'function') {
                window.modalManager.showQuickToast('🔥 Hot Foot Unlocked! (Level 5 Reward)');
            }
        }

        if (window.EventBus) {
            window.EventBus.emit('accountXpChanged', {
                level: this.player.accountLevel,
                xp: this.player.accountXp,
                xpNeeded,
                leveledUp
            });
        }
    }

    /**
     * Directly set Account Level & XP (used by cloud sync / live updates)
     */
    setAccountLevel(level, xp) {
        let changed = false;
        if (typeof level === 'number' && !isNaN(level) && level >= 1) {
            this.player.accountLevel = Math.floor(level);
            localStorage.setItem('lesaio_account_level', this.player.accountLevel.toString());
            changed = true;
        }

        if (typeof xp === 'number' && !isNaN(xp) && xp >= 0) {
            this.player.accountXp = Math.floor(xp);
            localStorage.setItem('lesaio_account_xp', this.player.accountXp.toString());
            changed = true;
        }

        if (changed && window.EventBus) {
            const xpNeeded = 100 * this.player.accountLevel;
            window.EventBus.emit('accountXpChanged', {
                level: this.player.accountLevel,
                xp: this.player.accountXp,
                xpNeeded,
                leveledUp: false
            });
        }
    }

    /**
     * Directly set Skill Levels map (used by cloud sync / live updates)
     */
    setSkillLevels(levels) {
        if (!levels || typeof levels !== 'object') return;
        this.player.skillLevels = { ...(this.player.skillLevels || {}), ...levels };
        localStorage.setItem('lesaio_skill_levels', JSON.stringify(this.player.skillLevels));

        if (window.EventBus) {
            window.EventBus.emit('skillLevelsChanged', this.player.skillLevels);
        }
    }

    beginMatchSession(heroId = 'psanas', gameMode = 'story') {
        if (typeof StatsManager !== 'undefined') StatsManager.beginMatchSession(this, heroId, gameMode);
    }

    syncLiveGame(game, finalize = false, forceNow = false) {
        if (typeof StatsManager !== 'undefined') StatsManager.syncLiveGame(this, game, finalize, forceNow);
    }

    recordMatch(score, wave, timeSeconds, fatmirs, casillas, heroId, skarmogyftos = 0, totalMatchKills = null, gameMode = null, isLiveTick = false) {
        if (typeof StatsManager !== 'undefined') {
            StatsManager.recordMatchProgress(this, score, wave, timeSeconds, fatmirs, casillas, heroId, skarmogyftos, totalMatchKills, gameMode, isLiveTick);
        }
    }

    getUpgradeLevel(key) {
        if (!this.player.upgrades) {
            this.player.upgrades = { critChance: 0, critDamage: 0, maxHealth: 0, goldBonus: 0 };
        }
        return this.player.upgrades[key] || 0;
    }

    setUpgradeLevel(key, level) {
        if (!this.player.upgrades) {
            this.player.upgrades = { critChance: 0, critDamage: 0, maxHealth: 0, goldBonus: 0 };
        }
        this.player.upgrades[key] = Math.max(0, Math.min(5, level));
        localStorage.setItem('lesaio_upgrades', JSON.stringify(this.player.upgrades));
        if (window.EventBus) {
            window.EventBus.emit('upgradesUpdated', { upgrades: this.player.upgrades });
        }
    }
}

// Global Canonical State Instance
const globalGameState = new GameState();

if (typeof window !== 'undefined') {
    window.GameState = globalGameState;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameState, globalGameState };
}
