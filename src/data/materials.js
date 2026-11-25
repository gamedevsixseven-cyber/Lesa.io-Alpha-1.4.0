/**
 * Lesa.io - Crafting Materials Registry & Drop Tables (Alpha 1.5)
 * Single source of truth for stackable crafting materials, duplicate gear
 * salvage values, chest/crate material tables, and display metadata.
 */

const MATERIALS_DATA = {
    armory_shards: {
        id: 'armory_shards',
        name: 'Armory Shards',
        shortName: 'Shards',
        rarity: 'uncommon',
        rarityLabel: 'UTILITY',
        color: '#0ea5e9',
        badgeBg: '#0284c7',
        glowColor: 'rgba(14, 165, 233, 0.45)',
        icon: '⚙️',
        iconKey: 'mat_armory_shards',
        iconImg: 'assets/ui-icons/mat_armory_shards.svg',
        dropType: 'mat_armory_shards',
        desc: 'Tempered village steel & brass gear fragments salvaged from duplicate equipment.',
        usedFor: 'Armory Forge, Chest Crafting & Evolution Stones',
        sources: ['Duplicate Gear Pulls', 'Chests & Boss Crates', 'Daily Quests', 'Village Elites']
    },
    mati_crystal: {
        id: 'mati_crystal',
        name: 'Mati Crystal',
        shortName: 'Mati Crystal',
        rarity: 'rare',
        rarityLabel: 'RARE',
        color: '#2563eb',
        badgeBg: '#1d4ed8',
        glowColor: 'rgba(37, 99, 235, 0.48)',
        icon: '🧿',
        iconKey: 'mat_mati_crystal',
        iconImg: 'assets/ui-icons/mat_mati_crystal.svg',
        dropType: 'mat_mati_crystal',
        desc: 'Faceted cobalt Evil-Eye charm charged with folklore energy to stabilize fusion and evolution.',
        usedFor: 'Evolution Stones, Ascent Crests & Pity Forge',
        sources: ['Story & Endless Bosses', 'Daily Quests', 'Rare+ Chests & Crates']
    },
    olympian_bronze: {
        id: 'olympian_bronze',
        name: 'Olympian Bronze',
        shortName: 'Olym. Bronze',
        rarity: 'epic',
        rarityLabel: 'EPIC',
        color: '#9b59b6',
        badgeBg: '#8e44ad',
        glowColor: 'rgba(155, 89, 182, 0.48)',
        icon: '🏛️',
        iconKey: 'mat_olympian_bronze',
        iconImg: 'assets/ui-icons/mat_olympian_bronze.svg',
        dropType: 'mat_olympian_bronze',
        desc: 'Ancient laurel-stamped celestial bronze forged high along the snowy ridges of Mount Olympus.',
        usedFor: 'Evolution Stones & Epic+ Forge Recipes',
        sources: ['Mt. Olympus Floors 2–5', 'Endless Wave 20+ Bosses', 'Epic+ Chests & Hard+ Crates']
    },
    ambrosia_spark: {
        id: 'ambrosia_spark',
        name: 'Ambrosia Spark',
        shortName: 'Ambrosia',
        rarity: 'legendary',
        rarityLabel: 'LEGENDARY',
        color: '#f39c12',
        badgeBg: '#d97706',
        glowColor: 'rgba(243, 156, 18, 0.55)',
        icon: '⚡',
        iconKey: 'mat_ambrosia_spark',
        iconImg: 'assets/ui-icons/mat_ambrosia_spark.svg',
        dropType: 'mat_ambrosia_spark',
        desc: 'Bottled nectar struck by Zeus’s mountain thunder atop Mount Olympus Floor 5. Required for Evolution Stones & Masterwork Perks.',
        usedFor: 'Evolution Stones & Epic/Legendary Masterwork Perks',
        sources: ['Mount Olympus Floor 5 (Zeus Only)']
    }
};

const MATERIAL_ORDER = ['armory_shards', 'mati_crystal', 'olympian_bronze', 'ambrosia_spark'];

// Duplicate gear pulled from Chests / Boss Crates converts cleanly into Armory Shards
const DUPLICATE_GEAR_SHARD_VALUES = {
    common: 1,
    uncommon: 1,
    rare: 2,
    epic: 5,
    legendary: 10,
    mythic: 15
};

// Uniform chest & boss-crate material drop tables (Ambrosia Spark excluded — Zeus Floor 5 only!)
const CONTAINER_MATERIAL_DROPS = {
    common: [
        { matId: 'armory_shards', min: 1, max: 1, chance: 0.25 }
    ],
    uncommon: [
        { matId: 'armory_shards', min: 1, max: 1, chance: 0.55 },
        { matId: 'mati_crystal', min: 1, max: 1, chance: 0.08 }
    ],
    rare: [
        { matId: 'armory_shards', min: 1, max: 2, chance: 0.85 },
        { matId: 'mati_crystal', min: 1, max: 1, chance: 0.35 }
    ],
    epic: [
        { matId: 'armory_shards', min: 2, max: 4, chance: 1.00 },
        { matId: 'mati_crystal', min: 1, max: 2, chance: 0.65 },
        { matId: 'olympian_bronze', min: 1, max: 1, chance: 0.30 }
    ],
    legendary: [
        { matId: 'armory_shards', min: 4, max: 7, chance: 1.00 },
        { matId: 'mati_crystal', min: 1, max: 2, chance: 1.00 },
        { matId: 'olympian_bronze', min: 1, max: 2, chance: 0.65 }
    ],
    mythic: [
        { matId: 'armory_shards', min: 7, max: 12, chance: 1.00 },
        { matId: 'mati_crystal', min: 2, max: 3, chance: 1.00 },
        { matId: 'olympian_bronze', min: 2, max: 3, chance: 1.00 }
    ],
    apex: [
        { matId: 'armory_shards', min: 14, max: 22, chance: 1.00 },
        { matId: 'mati_crystal', min: 4, max: 6, chance: 1.00 },
        { matId: 'olympian_bronze', min: 3, max: 5, chance: 1.00 },
        { matId: 'ambrosia_spark', min: 1, max: 1, chance: 0.35 }
    ],
    boss_crate_easy: [
        { matId: 'armory_shards', min: 1, max: 1, chance: 0.70 },
        { matId: 'mati_crystal', min: 1, max: 1, chance: 0.12 }
    ],
    boss_crate_normal: [
        { matId: 'armory_shards', min: 1, max: 2, chance: 0.90 },
        { matId: 'mati_crystal', min: 1, max: 1, chance: 0.35 }
    ],
    boss_crate_hard: [
        { matId: 'armory_shards', min: 2, max: 4, chance: 1.00 },
        { matId: 'mati_crystal', min: 1, max: 1, chance: 0.65 },
        { matId: 'olympian_bronze', min: 1, max: 1, chance: 0.25 }
    ],
    boss_crate_very_hard: [
        { matId: 'armory_shards', min: 4, max: 7, chance: 1.00 },
        { matId: 'mati_crystal', min: 1, max: 2, chance: 0.85 },
        { matId: 'olympian_bronze', min: 1, max: 2, chance: 0.55 }
    ],
    boss_crate_insane: [
        { matId: 'armory_shards', min: 6, max: 10, chance: 1.00 },
        { matId: 'mati_crystal', min: 2, max: 3, chance: 1.00 },
        { matId: 'olympian_bronze', min: 1, max: 3, chance: 0.85 }
    ]
};

class MaterialRegistry {
    static get(id) {
        return MATERIALS_DATA[id] || null;
    }

    static getAll() {
        return MATERIAL_ORDER.map((id) => MATERIALS_DATA[id]).filter(Boolean);
    }

    static createEmptyMap() {
        const out = {};
        for (const id of MATERIAL_ORDER) {
            out[id] = 0;
        }
        return out;
    }

    static normalizeMap(raw) {
        const clean = this.createEmptyMap();
        if (!raw || typeof raw !== 'object') return clean;
        for (const id of MATERIAL_ORDER) {
            const val = Number(raw[id]);
            if (Number.isFinite(val) && val > 0) {
                clean[id] = Math.floor(val);
            }
        }
        return clean;
    }

    static getDuplicateShardValue(rarity = 'common') {
        const key = String(rarity || 'common').toLowerCase();
        return DUPLICATE_GEAR_SHARD_VALUES[key] || DUPLICATE_GEAR_SHARD_VALUES.common;
    }

    static rollForContainer(containerIdOrDef) {
        const id = (containerIdOrDef && typeof containerIdOrDef === 'object')
            ? containerIdOrDef.id
            : containerIdOrDef;
        const rules = CONTAINER_MATERIAL_DROPS[id];
        const rolled = {};
        if (!Array.isArray(rules)) return rolled;

        for (const entry of rules) {
            if (!MATERIALS_DATA[entry.matId]) continue;
            if (Math.random() <= (entry.chance ?? 1)) {
                const min = Math.max(1, Math.floor(entry.min || 1));
                const max = Math.max(min, Math.floor(entry.max || min));
                const qty = Math.floor(Math.random() * (max - min + 1)) + min;
                rolled[entry.matId] = (rolled[entry.matId] || 0) + qty;
            }
        }
        return rolled;
    }

    static getStoryBossRewards(enemyType) {
        if (enemyType === 'kleanthis') return { armory_shards: 1 };
        if (enemyType === 'kiloumpas') return { armory_shards: 2, mati_crystal: 1 };
        if (enemyType === 'rouf') return { armory_shards: 3, mati_crystal: 2 };
        return null;
    }

    static getEndlessBossRewards(waveNum = 5, isMiniBoss = true) {
        const w = Math.max(1, Math.floor(waveNum || 5));
        if (isMiniBoss) {
            if (w >= 35) return { armory_shards: 2, mati_crystal: 1, olympian_bronze: 1 };
            if (w >= 20) return { armory_shards: 2, mati_crystal: 1 };
            return { armory_shards: 1 };
        }
        if (w >= 45) return { armory_shards: 4, mati_crystal: 2, olympian_bronze: 2 };
        if (w >= 30) return { armory_shards: 3, mati_crystal: 1, olympian_bronze: 1 };
        if (w >= 20) return { armory_shards: 2, mati_crystal: 1, olympian_bronze: 1 };
        return { armory_shards: 2, mati_crystal: 1 };
    }

    static getOlympusFloorRewards(floorNum = 1) {
        const f = Math.max(1, Math.min(5, Math.floor(floorNum || 1)));
        if (f === 1) return { armory_shards: 1 };
        if (f === 2) return { armory_shards: 1, olympian_bronze: 1 };
        if (f === 3) return { armory_shards: 2, mati_crystal: 1, olympian_bronze: 1 };
        if (f === 4) return { armory_shards: 2, mati_crystal: 1, olympian_bronze: 1 };
        // Ambrosia Spark is exclusively forged upon defeating Zeus atop Floor 5
        return {
            armory_shards: 4,
            mati_crystal: 2,
            olympian_bronze: 2,
            ambrosia_spark: 1
        };
    }

    static applyDropLuckBonus(rewardMap, options = {}) {
        if (!rewardMap || typeof rewardMap !== 'object') return rewardMap;
        const perkLuck = (typeof window !== 'undefined' && window.perkSystem && typeof window.perkSystem.getMaterialDropLuckBonus === 'function')
            ? Math.max(0, window.perkSystem.getMaterialDropLuckBonus())
            : 0;
        const eventLuck = ((typeof EventManager !== 'undefined' && typeof EventManager.getMaterialLuckBonus === 'function')
            ? Math.max(0, EventManager.getMaterialLuckBonus()) : 0)
            + ((typeof ClanBuffs !== 'undefined' && typeof ClanBuffs.getMaterialLuckBonus === 'function') ? Math.max(0, ClanBuffs.getMaterialLuckBonus()) : 0);
        const luck = perkLuck + eventLuck;
        if (luck <= 0) return rewardMap;
        const isZeusSummit = options.source === 'olympus_floor' && options.sourceName === 'Olympus F5';
        const eligibleKeys = Object.keys(rewardMap).filter((k) => rewardMap[k] > 0 && (k !== 'ambrosia_spark' || isZeusSummit));
        if (eligibleKeys.length === 0 || Math.random() >= luck) return rewardMap;
        const pick = eligibleKeys[Math.floor(Math.random() * eligibleKeys.length)];
        return { ...rewardMap, [pick]: rewardMap[pick] + 1 };
    }

    /**
     * Capped physical floor material drop roll for regular / elite non-boss enemies.
     * Heavily tuned down so materials remain scarce and deliberate (mildly boosted during Events).
     */
    static maybeDropForEnemy(game, enemy) {
        if (!game || game.isCoopGuest || !enemy || enemy._matDropChecked || typeof Drop === 'undefined') return;
        if (enemy.isBoss || enemy.isMiniBoss || enemy.isEndlessBoss) return;
        enemy._matDropChecked = true;

        const wm = game.waveManager;
        const mode = game.gameMode || 'story';
        if (!wm || mode === 'dungeons') return;

        const eventLuck = ((typeof EventManager !== 'undefined' && typeof EventManager.getMaterialLuckBonus === 'function')
            ? Math.max(0, EventManager.getMaterialLuckBonus()) : 0)
            + ((typeof ClanBuffs !== 'undefined' && typeof ClanBuffs.getMaterialLuckBonus === 'function') ? Math.max(0, ClanBuffs.getMaterialLuckBonus()) : 0);
        const hasMatBoost = eventLuck > 0;
        const wave = Math.max(1, wm.wave || 1);
        const maxPerWave = mode === 'endless'
            ? (hasMatBoost ? (wave >= 16 ? 2 : (wave >= 8 ? 1 : 0)) : (wave >= 12 ? 1 : 0))
            : (hasMatBoost ? (wave >= 6 && wave % 2 === 0 ? 1 : 0) : (wave >= 10 && wave % 2 === 0 ? 1 : 0));
        if (maxPerWave <= 0 || (wm.waveMatDrops || 0) >= maxPerWave) return;

        const eliteTypes = new Set(['kafeneio_tank', 'dimotiki_enforcer', 'psaltis', 'skarmogyftos']);
        const total = Math.max(8, wm.waveTotalEnemies || 12);
        const baseChance = Math.min(0.018, 0.18 / total);
        const perkLuck = (typeof window !== 'undefined' && window.perkSystem && typeof window.perkSystem.getMaterialDropLuckBonus === 'function')
            ? Math.max(0, window.perkSystem.getMaterialDropLuckBonus())
            : 0;
        const luckMult = 1 + perkLuck + eventLuck;
        const chance = (eliteTypes.has(enemy.type) ? Math.min(0.04, baseChance * 1.8) : baseChance) * luckMult;

        if (Math.random() < chance) {
            wm.waveMatDrops = (wm.waveMatDrops || 0) + 1;
            const dropCrystal = (mode === 'endless' && wave >= 22 && eliteTypes.has(enemy.type) && Math.random() < 0.12);
            const dropType = dropCrystal ? 'mat_mati_crystal' : 'mat_armory_shards';
            game.drops.push(new Drop(enemy.x, enemy.y - 6, dropType, 1));
        }
    }
}

if (typeof window !== 'undefined') {
    window.MATERIALS_DATA = MATERIALS_DATA;
    window.MATERIAL_ORDER = MATERIAL_ORDER;
    window.DUPLICATE_GEAR_SHARD_VALUES = DUPLICATE_GEAR_SHARD_VALUES;
    window.CONTAINER_MATERIAL_DROPS = CONTAINER_MATERIAL_DROPS;
    window.MaterialRegistry = MaterialRegistry;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MATERIALS_DATA,
        MATERIAL_ORDER,
        DUPLICATE_GEAR_SHARD_VALUES,
        CONTAINER_MATERIAL_DROPS,
        MaterialRegistry
    };
}
