/**
 * Lesa.io - Gear Upgrade Cost Tables, Diamond Bonus Tier & Stat Scaling Configuration
 * Rules by Rarity (Base Lv.1):
 *   - Common / Uncommon / Exclusive: Max Lv.1
 *   - Rare: 1 Upgrade -> Max Lv.2
 *   - Epic: 2 Upgrades -> Max Lv.3
 *   - Legendary: 3 Upgrades -> Max Lv.4 + Ascension -> Mythic -> ★ Evolution
 *   - Mythic: 4 Upgrades -> Max Lv.5 + ★ Evolution
 *   - Apex: 4 Upgrades -> Lv.5 + 1 Expensive Diamond Bonus Upgrade -> Max Lv.6 + ★ Evolution
 */

class GearUpgradeConfig {
    static MAX_LEVEL_BY_RARITY = {
        common: 1,
        uncommon: 1,
        rare: 2,
        epic: 3,
        legendary: 4,
        mythic: 5,
        apex: 6,
        exclusive: 1
    };

    static LEVEL_STAT_MULTIPLIERS = {
        1: 1.00,
        2: 1.18,
        3: 1.38,
        4: 1.60,
        5: 1.82,
        6: 2.08
    };

    static ASCENDED_STAT_MULTIPLIER = 1.80;
    static EVOLVED_STAT_MULTIPLIER = 2.05;
    static APEX_EVOLVED_STAT_MULTIPLIER = 2.38;
    static ASCEND_COST = { coins: 30000, starStones: 1 };

    static UPGRADE_COSTS = {
        rare: {
            1: { coins: 2500, materials: { armory_shards: 15, mati_crystal: 2 } }
        },
        epic: {
            1: { coins: 4500, materials: { armory_shards: 25, mati_crystal: 5 } },
            2: { coins: 7500, materials: { armory_shards: 40, mati_crystal: 8, olympian_bronze: 3 } }
        },
        legendary: {
            1: { coins: 8000, materials: { armory_shards: 35, mati_crystal: 8, olympian_bronze: 4 } },
            2: { coins: 14000, materials: { armory_shards: 55, mati_crystal: 12, olympian_bronze: 8 } },
            3: { coins: 22000, materials: { armory_shards: 80, mati_crystal: 18, olympian_bronze: 14, ambrosia_spark: 1 } }
        },
        mythic: {
            1: { coins: 15000, materials: { armory_shards: 60, mati_crystal: 14, olympian_bronze: 10, ambrosia_spark: 1 } },
            2: { coins: 25000, materials: { armory_shards: 90, mati_crystal: 22, olympian_bronze: 16, ambrosia_spark: 2 } },
            3: { coins: 40000, materials: { armory_shards: 130, mati_crystal: 30, olympian_bronze: 24, ambrosia_spark: 3 } },
            4: { coins: 60000, materials: { armory_shards: 175, mati_crystal: 40, olympian_bronze: 32, ambrosia_spark: 4 } }
        },
        apex: {
            1: { coins: 22000, materials: { armory_shards: 80, mati_crystal: 18, olympian_bronze: 14, ambrosia_spark: 1 } },
            2: { coins: 35000, materials: { armory_shards: 115, mati_crystal: 26, olympian_bronze: 20, ambrosia_spark: 2 } },
            3: { coins: 50000, materials: { armory_shards: 155, mati_crystal: 36, olympian_bronze: 28, ambrosia_spark: 3 } },
            4: { coins: 70000, materials: { armory_shards: 200, mati_crystal: 45, olympian_bronze: 36, ambrosia_spark: 4 } },
            5: { coins: 0, gems: 750, materials: {}, isDiamondBonus: true }
        }
    };

    static EVOLVE_COSTS = {
        mythic: { coins: 20000, evolutionStones: 1 },
        apex: { coins: 45000, evolutionStones: 1 }
    };

    static getGems() {
        if (typeof window !== 'undefined' && window.GameState && window.GameState.player) {
            return Math.max(0, Math.floor(Number(window.GameState.player.gems) || 0));
        }
        if (typeof localStorage !== 'undefined') {
            return Math.max(0, parseInt(localStorage.getItem('lesaio_gems') || '0', 10) || 0);
        }
        return 0;
    }

    static spendGems(amount) {
        const cost = Math.max(0, Math.floor(Number(amount) || 0));
        if (cost <= 0) return true;
        if (this.getGems() < cost) return false;
        if (typeof window !== 'undefined' && window.GameState && typeof window.GameState.spendGems === 'function') {
            return window.GameState.spendGems(cost);
        }
        if (typeof window !== 'undefined' && window.GameState && typeof window.GameState.addCurrency === 'function') {
            window.GameState.addCurrency(0, -cost);
            return true;
        }
        return false;
    }

    static buildCostChipsHtml(cost, playerCoins, inv) {
        if (!cost) return '';
        const chips = [];
        const coinIcon = typeof UiIcons !== 'undefined' ? UiIcons.i('coin', 'ui-icon-sm') : '🪙';
        const gemIcon = typeof UiIcons !== 'undefined' ? UiIcons.i('gem', 'ui-icon-sm') : '💎';
        if (cost.coins > 0) {
            chips.push(`<span class="gear-cost-chip ${playerCoins < cost.coins ? 'is-short' : ''}">${coinIcon} ${cost.coins.toLocaleString()}</span>`);
        }
        if (cost.gems > 0) {
            const haveGems = this.getGems();
            chips.push(`<span class="gear-cost-chip is-diamond-cost ${haveGems < cost.gems ? 'is-short' : ''}">${gemIcon} ${cost.gems.toLocaleString()} Diamonds</span>`);
        }
        for (const [matId, need] of Object.entries(cost.materials || {})) {
            const def = (typeof MaterialRegistry !== 'undefined') ? MaterialRegistry.get(matId) : null;
            const have = inv && typeof inv.getMaterialCount === 'function' ? inv.getMaterialCount(matId) : 0;
            const ic = def && def.iconKey && typeof UiIcons !== 'undefined' ? UiIcons.i(def.iconKey, 'ui-icon-sm') : (def ? def.icon : matId);
            chips.push(`<span class="gear-cost-chip ${have < need ? 'is-short' : ''}" title="${def ? def.name : matId}: ${have}/${need}">${ic} ${need}</span>`);
        }
        return chips.join('');
    }
}

if (typeof window !== 'undefined') window.GearUpgradeConfig = GearUpgradeConfig;
if (typeof module !== 'undefined' && module.exports) module.exports = { GearUpgradeConfig };
