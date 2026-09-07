/**
 * Lesa.io - Canonical Game State (Single Source of Truth)
 * Centralizes all authoritative player data, career stats, settings, and session state
 */

class GameState {
    constructor() {
        // Player Profile & Identity
        this.player = {
            name: localStorage.getItem('lesaio_player_name') || 'Psanas',
            accountLevel: parseInt(localStorage.getItem('lesaio_account_level') || '1', 10),
            accountXp: parseInt(localStorage.getItem('lesaio_account_xp') || '0', 10),
            coins: parseInt(localStorage.getItem('lesaio_coins') || '1500', 10),
            gems: parseInt(localStorage.getItem('lesaio_gems') || '50', 10),
            selectedHero: localStorage.getItem('lesaio_selected_hero') || 'psanas',
            unlockedHeroes: JSON.parse(localStorage.getItem('lesaio_unlocked_heroes') || '["psanas"]'),
            selectedSkill: localStorage.getItem('lesaio_selected_skill') || 'blade_rush',
            unlockedSkills: JSON.parse(localStorage.getItem('lesaio_unlocked_skills') || '["blade_rush", "nerobalonaki"]'),
            skillLevels: JSON.parse(localStorage.getItem('lesaio_skill_levels') || '{"blade_rush": 1, "nerobalonaki": 1}'),
            selectedWeapon: localStorage.getItem('lesaio_selected_weapon') || 'pea',
            unlockedWeapons: JSON.parse(localStorage.getItem('lesaio_unlocked_weapons') || '["pea"]'),
            upgrades: JSON.parse(localStorage.getItem('lesaio_upgrades') || '{"critChance": 0, "critDamage": 0, "maxHealth": 0, "goldBonus": 0}'),
            unlockedPerks: JSON.parse(localStorage.getItem('lesaio_unlocked_perks') || '[]'),
            equippedPerks: JSON.parse(localStorage.getItem('lesaio_equipped_perks') || '[null, null, null]'),
            stats: {
                totalKills: parseInt(localStorage.getItem('lesaio_total_kills') || '0', 10),
                maxWave: parseInt(localStorage.getItem('lesaio_max_wave') || '1', 10),
                highScore: parseInt(localStorage.getItem('lesaio_highscore') || '0', 10),
                totalFatmirs: parseInt(localStorage.getItem('lesaio_total_fatmirs') || '0', 10),
                totalCasillas: parseInt(localStorage.getItem('lesaio_total_casillas') || '0', 10),
                totalSkarmogyftos: parseInt(localStorage.getItem('lesaio_total_skarmogyftos') || '0', 10),
                matchesPlayed: parseInt(localStorage.getItem('lesaio_matches_played') || '0', 10),
                totalTimeSeconds: parseInt(localStorage.getItem('lesaio_total_time_seconds') || '0', 10),
                heroPlays: JSON.parse(localStorage.getItem('lesaio_hero_plays') || '{"psanas": 0, "psogas": 0, "petros": 0}')
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
            screenShake: localStorage.getItem('lesaio_screenshake') !== 'false'
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
     * Unlock a perk with gold coins
     */
    unlockPerk(perkId, cost = 0) {
        if (!Array.isArray(this.player.unlockedPerks)) this.player.unlockedPerks = [];
        if (this.player.unlockedPerks.includes(perkId)) return true;
        if (cost > 0 && !this.spendCoins(cost)) return false;

        this.player.unlockedPerks.push(perkId);
        localStorage.setItem('lesaio_unlocked_perks', JSON.stringify(this.player.unlockedPerks));

        if (window.EventBus) {
            window.EventBus.emit('perkUnlocked', { perkId });
        }
        return true;
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

        // Check Tag Exclusivity (e.g. only 1 perk with exclusive tag like 'dash' can be equipped at a time)
        const newPerkDef = (typeof PERKS_DATA !== 'undefined') ? PERKS_DATA[perkId] : null;
        const exclusiveTags = (typeof EXCLUSIVE_PERK_TAGS !== 'undefined') ? EXCLUSIVE_PERK_TAGS : ['dash'];
        let swappedOldPerk = null;

        if (newPerkDef && newPerkDef.tag && exclusiveTags.includes(newPerkDef.tag)) {
            for (let i = 0; i < 3; i++) {
                const existingId = this.player.equippedPerks[i];
                if (existingId && existingId !== perkId) {
                    const existingDef = (typeof PERKS_DATA !== 'undefined') ? PERKS_DATA[existingId] : null;
                    if (existingDef && existingDef.tag === newPerkDef.tag) {
                        this.player.equippedPerks[i] = null;
                        swappedOldPerk = existingDef;
                    }
                }
            }
        }

        const slot = Math.max(0, Math.min(2, targetSlot));
        this.player.equippedPerks[slot] = perkId;
        localStorage.setItem('lesaio_equipped_perks', JSON.stringify(this.player.equippedPerks));

        if (window.EventBus) {
            window.EventBus.emit('perkEquipped', { perkId, slot, swappedOldPerk });
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

        // Check if player just reached Level 5 to unlock Hot Foot for free!
        if (leveledUp && this.player.accountLevel >= 5 && !this.player.unlockedPerks.includes('hot_foot')) {
            this.player.unlockedPerks.push('hot_foot');
            localStorage.setItem('lesaio_unlocked_perks', JSON.stringify(this.player.unlockedPerks));
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

    /**
     * Record match completion and merge lifetime career stats
     */
    recordMatch(score, wave, timeSeconds, fatmirs, casillas, heroId, skarmogyftos = 0) {
        const stats = this.player.stats;
        stats.matchesPlayed += 1;
        stats.totalTimeSeconds += Math.floor(timeSeconds);
        stats.totalFatmirs += fatmirs;
        stats.totalCasillas += casillas;
        stats.totalSkarmogyftos = (stats.totalSkarmogyftos || 0) + skarmogyftos;
        stats.totalKills += (fatmirs + casillas + skarmogyftos);

        if (score > stats.highScore) {
            stats.highScore = score;
            localStorage.setItem('lesaio_highscore', score.toString());
        }

        if (wave > stats.maxWave) {
            stats.maxWave = wave;
            localStorage.setItem('lesaio_max_wave', wave.toString());
        }

        if (heroId) {
            stats.heroPlays[heroId] = (stats.heroPlays[heroId] || 0) + 1;
            localStorage.setItem('lesaio_hero_plays', JSON.stringify(stats.heroPlays));
        }

        localStorage.setItem('lesaio_total_kills', stats.totalKills.toString());
        localStorage.setItem('lesaio_total_fatmirs', stats.totalFatmirs.toString());
        localStorage.setItem('lesaio_total_casillas', stats.totalCasillas.toString());
        localStorage.setItem('lesaio_total_skarmogyftos', stats.totalSkarmogyftos.toString());
        localStorage.setItem('lesaio_matches_played', stats.matchesPlayed.toString());
        localStorage.setItem('lesaio_total_time_seconds', stats.totalTimeSeconds.toString());

        if (window.EventBus) {
            window.EventBus.emit('statsUpdated', { stats });
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
