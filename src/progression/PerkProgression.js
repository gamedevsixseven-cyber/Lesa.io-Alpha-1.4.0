/**
 * Lesa.io - Battle Perks Progression, Vault Forge & Rank Ascension Manager
 * Handles combat feat gates (Bosses / Story / Endless / Olympus), coin+material forging,
 * Rank Lv.1 -> Lv.3 upgrades, exclusive slot tag resolution, and legacy save backfills.
 */

class PerkProgression {
    static FEATS_STORAGE_KEY = 'lesaio_combat_feats';
    static RANKS_STORAGE_KEY = 'lesaio_perk_ranks';

    static BOSS_FEAT_LABELS = {
        kleanthis: 'Kleanthis (Story W10)',
        kiloumpas: 'Kiloumpas (Story W15)',
        rouf: 'Rouf (Story W20)',
        casillas_sentinel: 'Casillas Sentinel (Olympus F1)',
        ravine_chieftain: 'Ravine Chieftain (Olympus F2)',
        frost_titan: 'Boreas the Frost Titan (Olympus F3)',
        kiloumpas_berserker: 'Kiloumpas Berserker (Olympus F4)',
        zeus: 'Zeus (Olympus Floor 5)',
        lil_xas: 'Lil Xas (Rare Easter Egg)',
        endless_mini_boss: 'Endless Mini-Boss',
        endless_boss: 'Endless Main Boss'
    };

    static getDefaultFeats() {
        return {
            storyMaxWave: 1,
            endlessMaxWave: 0,
            endlessHardMaxWave: 0,
            hardEndlessUnlocked: false,
            olympusMaxFloor: 0,
            defeatedBosses: {},
            endlessMiniBossKills: 0
        };
    }

    static normalizeFeats(raw = {}) {
        const base = this.getDefaultFeats();
        if (!raw || typeof raw !== 'object') return base;

        const cleanInt = (v, min = 0) => {
            const n = parseInt(v, 10);
            return Number.isFinite(n) ? Math.max(min, n) : min;
        };

        base.storyMaxWave = cleanInt(raw.storyMaxWave, 1);
        base.endlessMaxWave = cleanInt(raw.endlessMaxWave, 0);
        base.endlessHardMaxWave = cleanInt(raw.endlessHardMaxWave, 0);
        const lsHardFlag = (typeof localStorage !== 'undefined' && localStorage.getItem('lesaio_hard_endless_unlocked') === 'true');
        base.hardEndlessUnlocked = !!(raw.hardEndlessUnlocked || lsHardFlag || base.endlessMaxWave >= 30 || base.endlessHardMaxWave >= 1);
        base.olympusMaxFloor = Math.min(5, cleanInt(raw.olympusMaxFloor, 0));
        base.endlessMiniBossKills = cleanInt(raw.endlessMiniBossKills, 0);

        if (raw.defeatedBosses && typeof raw.defeatedBosses === 'object') {
            for (const [bossId, cnt] of Object.entries(raw.defeatedBosses)) {
                const safeCnt = cleanInt(cnt, 0);
                if (bossId && safeCnt > 0) base.defeatedBosses[bossId] = safeCnt;
            }
        }
        return base;
    }

    static mergeFeats(a = {}, b = {}) {
        const fa = this.normalizeFeats(a);
        const fb = this.normalizeFeats(b);
        const merged = {
            storyMaxWave: Math.max(fa.storyMaxWave, fb.storyMaxWave),
            endlessMaxWave: Math.max(fa.endlessMaxWave, fb.endlessMaxWave),
            endlessHardMaxWave: Math.max(fa.endlessHardMaxWave, fb.endlessHardMaxWave),
            hardEndlessUnlocked: !!(fa.hardEndlessUnlocked || fb.hardEndlessUnlocked || Math.max(fa.endlessMaxWave, fb.endlessMaxWave) >= 30 || Math.max(fa.endlessHardMaxWave, fb.endlessHardMaxWave) >= 1),
            olympusMaxFloor: Math.max(fa.olympusMaxFloor, fb.olympusMaxFloor),
            endlessMiniBossKills: Math.max(fa.endlessMiniBossKills, fb.endlessMiniBossKills),
            defeatedBosses: { ...fa.defeatedBosses }
        };
        for (const [bossId, cnt] of Object.entries(fb.defeatedBosses)) {
            merged.defeatedBosses[bossId] = Math.max(merged.defeatedBosses[bossId] || 0, cnt);
        }
        return merged;
    }

    static loadFeats() {
        if (typeof localStorage === 'undefined') return this.getDefaultFeats();
        try {
            const parsed = JSON.parse(localStorage.getItem(this.FEATS_STORAGE_KEY) || '{}');
            return this.normalizeFeats(parsed);
        } catch (err) {
            return this.getDefaultFeats();
        }
    }

    static saveFeats(feats) {
        const clean = this.normalizeFeats(feats);
        if (typeof localStorage !== 'undefined') {
            try { localStorage.setItem(this.FEATS_STORAGE_KEY, JSON.stringify(clean)); } catch (e) { }
        }
        return clean;
    }

    static loadPerkRanks() {
        if (typeof localStorage === 'undefined') return {};
        try {
            const parsed = JSON.parse(localStorage.getItem(this.RANKS_STORAGE_KEY) || '{}');
            return (parsed && typeof parsed === 'object') ? parsed : {};
        } catch (err) {
            return {};
        }
    }

    static savePerkRanks(ranks) {
        if (typeof localStorage !== 'undefined') {
            try { localStorage.setItem(this.RANKS_STORAGE_KEY, JSON.stringify(ranks || {})); } catch (e) { }
        }
    }

    static normalizePerkRanks(rawRanks = {}, unlockedList = []) {
        const out = {};
        if (rawRanks && typeof rawRanks === 'object') {
            for (const [id, r] of Object.entries(rawRanks)) {
                const maxRank = this.getPerkMaxRank(id);
                const parsed = parseInt(r, 10);
                if (Number.isFinite(parsed) && parsed >= 1) {
                    out[id] = Math.min(maxRank, parsed);
                }
            }
        }
        for (const id of (Array.isArray(unlockedList) ? unlockedList : [])) {
            if (!out[id] || out[id] < 1) out[id] = 1;
        }
        return out;
    }

    static mergePerkRanks(a = {}, b = {}, unlockedList = []) {
        const merged = { ...(a || {}) };
        for (const [id, r] of Object.entries(b || {})) {
            const maxRank = this.getPerkMaxRank(id);
            const cur = parseInt(merged[id] || 0, 10) || 0;
            const inc = parseInt(r || 0, 10) || 0;
            const best = Math.min(maxRank, Math.max(cur, inc));
            if (best >= 1) merged[id] = best;
        }
        return this.normalizePerkRanks(merged, unlockedList);
    }

    static getPerkDef(perkOrId) {
        if (!perkOrId) return null;
        if (typeof perkOrId === 'object') return perkOrId;
        const registry = (typeof PERKS_DATA !== 'undefined') ? PERKS_DATA : (typeof window !== 'undefined' ? window.PERKS_DATA : null);
        return (registry && registry[perkOrId]) || null;
    }

    static getExclusiveGroup(perkOrId) {
        const perk = this.getPerkDef(perkOrId);
        if (!perk) return null;
        const group = perk.exclusiveGroup || perk.tag;
        const tags = (typeof EXCLUSIVE_PERK_TAGS !== 'undefined')
            ? EXCLUSIVE_PERK_TAGS
            : (typeof window !== 'undefined' && Array.isArray(window.EXCLUSIVE_PERK_TAGS) ? window.EXCLUSIVE_PERK_TAGS : ['dash']);
        return (group && tags.includes(group)) ? group : null;
    }

    static getExclusiveTagMeta(group) {
        if (!group) return null;
        const metaMap = (typeof EXCLUSIVE_TAG_META !== 'undefined')
            ? EXCLUSIVE_TAG_META
            : (typeof window !== 'undefined' ? window.EXCLUSIVE_TAG_META : null);
        return (metaMap && metaMap[group]) || {
            label: group.toUpperCase(),
            max: 1,
            swapLabel: `${group.charAt(0).toUpperCase() + group.slice(1)} Perk`,
            badgeText: `MAX 1 ${group.toUpperCase()}`
        };
    }

    /**
     * Read lifetime feats combined with verified legacy unlocks (weapons/gear/skills/stats).
     */
    static getFeatSnapshot(state = null) {
        const gs = state || (typeof window !== 'undefined' ? window.GameState : null);
        const p = (gs && gs.player) || {};
        const feats = this.normalizeFeats(p.combatFeats || this.loadFeats());
        const unlockedWeapons = Array.isArray(p.unlockedWeapons) ? p.unlockedWeapons : [];
        const unlockedSkills = Array.isArray(p.unlockedSkills) ? p.unlockedSkills : [];
        const unlockedGear = Array.isArray(p.unlockedGear) ? p.unlockedGear : [];
        const stats = p.stats || {};

        if (unlockedWeapons.includes('carbine')) {
            feats.defeatedBosses.kiloumpas = Math.max(feats.defeatedBosses.kiloumpas || 0, 1);
            feats.storyMaxWave = Math.max(feats.storyMaxWave, 15);
        }
        if (unlockedWeapons.includes('dialtone')) {
            feats.defeatedBosses.rouf = Math.max(feats.defeatedBosses.rouf || 0, 1);
            feats.storyMaxWave = Math.max(feats.storyMaxWave, 20);
        }
        if (unlockedWeapons.includes('zeus_thunderbolt') || unlockedSkills.includes('wrath_of_olympus') || unlockedGear.includes('zeus_aegis_cuirass')) {
            feats.defeatedBosses.zeus = Math.max(feats.defeatedBosses.zeus || 0, 1);
            feats.olympusMaxFloor = Math.max(feats.olympusMaxFloor, 5);
        }
        if ((stats.maxWave || 1) > 20) {
            feats.endlessMaxWave = Math.max(feats.endlessMaxWave, stats.maxWave);
        }

        const bruteKills = (stats.totalFatmirs || 0) + (stats.totalCasillas || 0) + (stats.totalSkarmogyftos || 0);
        return {
            ...feats,
            accountLevel: p.accountLevel || 1,
            bruteKills,
            matchesPlayed: stats.matchesPlayed || 0
        };
    }

    static recordWaveProgress(state, mode, waveNum) {
        const gs = state || (typeof window !== 'undefined' ? window.GameState : null);
        const wave = Math.max(1, parseInt(waveNum, 10) || 1);
        if (!gs || !gs.player) return false;

        const feats = this.normalizeFeats(gs.player.combatFeats || this.loadFeats());
        let changed = false;

        if (mode === 'story' && wave > feats.storyMaxWave) {
            feats.storyMaxWave = wave;
            changed = true;
        } else if (mode === 'endless' && wave > feats.endlessMaxWave) {
            feats.endlessMaxWave = wave;
            if (wave >= 30) feats.hardEndlessUnlocked = true;
            changed = true;
        } else if (mode === 'endless_hard') {
            if (wave > feats.endlessHardMaxWave) { feats.endlessHardMaxWave = wave; changed = true; }
            if (!feats.hardEndlessUnlocked) { feats.hardEndlessUnlocked = true; changed = true; }
        } else if (mode === 'dungeons') {
            const floor = Math.min(5, wave);
            if (floor > feats.olympusMaxFloor) {
                feats.olympusMaxFloor = floor;
                changed = true;
            }
        }
        if (feats.hardEndlessUnlocked && typeof localStorage !== 'undefined') {
            try { localStorage.setItem('lesaio_hard_endless_unlocked', 'true'); } catch (_) {}
        }

        if (changed) {
            gs.player.combatFeats = this.saveFeats(feats);
            if (typeof window !== 'undefined' && window.EventBus) {
                window.EventBus.emit('combatFeatsUpdated', { combatFeats: gs.player.combatFeats });
            }
        }
        return changed;
    }

    static recordBossDefeat(state, bossId, syncCoop = true) {
        if (!bossId) return false;
        const gs = state || (typeof window !== 'undefined' ? window.GameState : null);
        if (!gs || !gs.player) return false;

        const feats = this.normalizeFeats(gs.player.combatFeats || this.loadFeats());
        if (bossId === 'endless_mini_boss') {
            feats.endlessMiniBossKills += 1;
        } else {
            feats.defeatedBosses[bossId] = (feats.defeatedBosses[bossId] || 0) + 1;
        }

        if (bossId === 'kleanthis') feats.storyMaxWave = Math.max(feats.storyMaxWave, 10);
        if (bossId === 'kiloumpas') feats.storyMaxWave = Math.max(feats.storyMaxWave, 15);
        if (bossId === 'rouf') feats.storyMaxWave = Math.max(feats.storyMaxWave, 20);
        if (bossId === 'casillas_sentinel') feats.olympusMaxFloor = Math.max(feats.olympusMaxFloor, 1);
        if (bossId === 'ravine_chieftain') feats.olympusMaxFloor = Math.max(feats.olympusMaxFloor, 2);
        if (bossId === 'frost_titan') feats.olympusMaxFloor = Math.max(feats.olympusMaxFloor, 3);
        if (bossId === 'kiloumpas_berserker') feats.olympusMaxFloor = Math.max(feats.olympusMaxFloor, 4);
        if (bossId === 'zeus') feats.olympusMaxFloor = 5;

        gs.player.combatFeats = this.saveFeats(feats);
        if (typeof window !== 'undefined') {
            if (window.EventBus) window.EventBus.emit('combatFeatsUpdated', { bossId, combatFeats: gs.player.combatFeats });
            if (typeof CosmeticManager !== 'undefined') CosmeticManager.syncUnlocks({ silent: false, syncRemote: false });
            const g = window.gameInstance;
            if (syncCoop !== false && g && g.coopSession && !g.isCoopGuest && g.coopSession.net && g.coopSession.net.connected) {
                g.coopSession.net.send('BOSS_FEAT_DEFEAT', { bossId });
            }
        }
        return true;
    }

    static getPerkMaxRank(perkOrId) {
        const perk = this.getPerkDef(perkOrId);
        if (!perk) return 1;
        if (typeof perk.maxRank === 'number' && perk.maxRank >= 1) return Math.floor(perk.maxRank);
        if (Array.isArray(perk.ranks) && perk.ranks.length > 0) return perk.ranks.length;
        return 1;
    }

    static getPerkRank(state, perkId) {
        const gs = state || (typeof window !== 'undefined' ? window.GameState : null);
        const unlocked = (gs && gs.player && Array.isArray(gs.player.unlockedPerks)) ? gs.player.unlockedPerks : [];
        if (!unlocked.includes(perkId)) return 0;

        const maxRank = this.getPerkMaxRank(perkId);
        const saved = (gs && gs.player && gs.player.perkRanks && gs.player.perkRanks[perkId]) || 1;
        return Math.max(1, Math.min(maxRank, parseInt(saved, 10) || 1));
    }

    static getPerkRankData(perkOrId, rank = 1) {
        const perk = this.getPerkDef(perkOrId);
        if (!perk || !Array.isArray(perk.ranks) || perk.ranks.length === 0) return null;
        const idx = Math.max(0, Math.min(perk.ranks.length - 1, (parseInt(rank, 10) || 1) - 1));
        return perk.ranks[idx] || null;
    }

    static getMaterialsSnapshot(state = null) {
        if (typeof window !== 'undefined' && window.inventoryManager && typeof window.inventoryManager.getMaterials === 'function') {
            return window.inventoryManager.getMaterials();
        }
        const gs = state || (typeof window !== 'undefined' ? window.GameState : null);
        return (gs && gs.player && gs.player.materials) ? { ...gs.player.materials } : {};
    }

    static hasMaterials(costMap, state = null) {
        if (!costMap || typeof costMap !== 'object') return true;
        if (typeof window !== 'undefined' && window.inventoryManager && typeof window.inventoryManager.hasMaterials === 'function') {
            return window.inventoryManager.hasMaterials(costMap);
        }
        const mats = this.getMaterialsSnapshot(state);
        for (const [matId, rawNeed] of Object.entries(costMap)) {
            const need = Math.floor(Number(rawNeed) || 0);
            if (need > 0 && (mats[matId] || 0) < need) return false;
        }
        return true;
    }

    static consumeMaterials(costMap, state = null, meta = {}) {
        const entries = Object.entries(costMap || {}).filter(([, v]) => Math.floor(Number(v) || 0) > 0);
        if (entries.length === 0) return { success: true };

        if (typeof window !== 'undefined' && window.inventoryManager && typeof window.inventoryManager.consumeMaterials === 'function') {
            return window.inventoryManager.consumeMaterials(costMap, meta);
        }

        const gs = state || (typeof window !== 'undefined' ? window.GameState : null);
        if (!gs || !gs.player) return { success: false, reason: 'No active player state' };
        if (!this.hasMaterials(costMap, gs)) return { success: false, reason: 'Not enough crafting materials!' };

        if (!gs.player.materials) gs.player.materials = {};
        for (const [matId, rawNeed] of entries) {
            const need = Math.floor(Number(rawNeed) || 0);
            gs.player.materials[matId] = Math.max(0, (gs.player.materials[matId] || 0) - need);
        }
        if (typeof localStorage !== 'undefined') {
            try {
                const inv = JSON.parse(localStorage.getItem('lesaio_inventory') || '{}');
                inv.materials = { ...gs.player.materials };
                localStorage.setItem('lesaio_inventory', JSON.stringify(inv));
            } catch (e) { }
        }
        return { success: true };
    }

    static evaluateUnlockRequirements(perkOrId, state = null) {
        const perk = this.getPerkDef(perkOrId);
        if (!perk) return { allMet: false, items: [] };

        const req = { ...(perk.unlockRequirements || {}) };
        if (perk.unlockLevel && !req.level) req.level = perk.unlockLevel;

        const snap = this.getFeatSnapshot(state);
        const items = [];

        const evalSingle = (clause) => {
            if (clause.level) {
                return {
                    key: 'level',
                    label: `Account Lv.${clause.level}`,
                    currentText: `${snap.accountLevel}/${clause.level}`,
                    met: snap.accountLevel >= clause.level
                };
            }
            if (clause.bossId) {
                const need = clause.bossCount || 1;
                const cur = snap.defeatedBosses[clause.bossId] || 0;
                const name = this.BOSS_FEAT_LABELS[clause.bossId] || clause.bossId;
                return {
                    key: `boss_${clause.bossId}`,
                    label: `Defeat ${name}`,
                    currentText: `${Math.min(cur, need)}/${need}`,
                    met: cur >= need
                };
            }
            if (clause.olympusFloor) {
                return {
                    key: 'olympusFloor',
                    label: `Clear Olympus Floor ${clause.olympusFloor}`,
                    currentText: `F${snap.olympusMaxFloor}/F${clause.olympusFloor}`,
                    met: snap.olympusMaxFloor >= clause.olympusFloor
                };
            }
            if (clause.storyWave) {
                return {
                    key: 'storyWave',
                    label: `Story Wave ${clause.storyWave}`,
                    currentText: `W${snap.storyMaxWave}/W${clause.storyWave}`,
                    met: snap.storyMaxWave >= clause.storyWave
                };
            }
            if (clause.endlessWave) {
                return {
                    key: 'endlessWave',
                    label: `Endless Wave ${clause.endlessWave}`,
                    currentText: `W${snap.endlessMaxWave}/W${clause.endlessWave}`,
                    met: snap.endlessMaxWave >= clause.endlessWave
                };
            }
            if (clause.bruteKills) {
                return {
                    key: 'bruteKills',
                    label: `${clause.bruteKills} Brutes Defeated`,
                    currentText: `${Math.min(snap.bruteKills, clause.bruteKills)}/${clause.bruteKills}`,
                    met: snap.bruteKills >= clause.bruteKills
                };
            }
            if (clause.endlessMiniBossKills) {
                const cur = snap.endlessMiniBossKills || 0;
                return {
                    key: 'endlessMiniBossKills',
                    label: `${clause.endlessMiniBossKills} Endless Mini-Bosses`,
                    currentText: `${Math.min(cur, clause.endlessMiniBossKills)}/${clause.endlessMiniBossKills}`,
                    met: cur >= clause.endlessMiniBossKills
                };
            }
            return null;
        };

        for (const key of ['level', 'bossId', 'olympusFloor', 'storyWave', 'endlessWave', 'endlessMiniBossKills', 'bruteKills']) {
            if (req[key]) {
                const entry = evalSingle({ [key]: req[key], bossCount: req.bossCount });
                if (entry) items.push(entry);
            }
        }
        if (Array.isArray(req.anyOf) && req.anyOf.length > 0) {
            const subs = req.anyOf.map((c) => evalSingle(c)).filter(Boolean);
            if (subs.length > 0) {
                items.push({
                    key: 'anyOf',
                    label: subs.map((s) => s.label).join(' OR '),
                    currentText: subs.map((s) => s.currentText).join(' | '),
                    met: subs.some((s) => s.met)
                });
            }
        }

        return {
            allMet: items.every((item) => item.met),
            items
        };
    }

    static getUnlockCost(perkOrId, legacyCostOverride = null) {
        const perk = this.getPerkDef(perkOrId);
        const coins = (typeof legacyCostOverride === 'number')
            ? Math.max(0, legacyCostOverride)
            : Math.max(0, (perk && perk.cost) || 0);
        const materials = (perk && perk.materials && typeof perk.materials === 'object') ? { ...perk.materials } : {};
        return { coins, materials };
    }

    static getNextUpgradeCost(perkOrId, currentRank = 1) {
        const perk = this.getPerkDef(perkOrId);
        const maxRank = this.getPerkMaxRank(perk);
        if (!perk || currentRank >= maxRank) return null;
        const nextRankDef = this.getPerkRankData(perk, currentRank + 1);
        const raw = (nextRankDef && nextRankDef.upgradeCost) || {};
        return {
            nextRank: currentRank + 1,
            summary: (nextRankDef && nextRankDef.summary) || '',
            coins: Math.max(0, raw.coins || 0),
            materials: (raw.materials && typeof raw.materials === 'object') ? { ...raw.materials } : {}
        };
    }

    static _canAfford(cost, state) {
        const gs = state || (typeof window !== 'undefined' ? window.GameState : null);
        const coins = (gs && gs.player && gs.player.coins) || 0;
        const coinsNeeded = (cost && cost.coins) || 0;
        const matsOk = this.hasMaterials((cost && cost.materials) || {}, gs);
        return {
            coinsOk: coins >= coinsNeeded,
            matsOk,
            affordable: (coins >= coinsNeeded) && matsOk
        };
    }

    static unlockPerk(state, perkId, legacyCostOverride = null) {
        const gs = state || (typeof window !== 'undefined' ? window.GameState : null);
        if (!gs || !gs.player) return { success: false, reason: 'Missing GameState' };
        if (!Array.isArray(gs.player.unlockedPerks)) gs.player.unlockedPerks = [];
        if (gs.player.unlockedPerks.includes(perkId)) return { success: true, alreadyUnlocked: true };

        const perk = this.getPerkDef(perkId);
        if (perk) {
            const reqEval = this.evaluateUnlockRequirements(perk, gs);
            if (!reqEval.allMet) {
                const firstMissing = reqEval.items.find((i) => !i.met);
                return {
                    success: false,
                    reason: firstMissing ? `Requires ${firstMissing.label} (${firstMissing.currentText})` : 'Combat feat requirements not met!'
                };
            }
        }

        const cost = this.getUnlockCost(perk || { cost: 0 }, legacyCostOverride);
        const afford = this._canAfford(cost, gs);
        if (!afford.coinsOk) return { success: false, reason: 'Not enough Coins!' };
        if (!afford.matsOk) return { success: false, reason: 'Not enough crafting materials!' };

        if (cost.coins > 0 && !gs.spendCoins(cost.coins)) {
            return { success: false, reason: 'Not enough Coins!' };
        }
        const matRes = this.consumeMaterials(cost.materials, gs, { source: 'perk_forge', perkId });
        if (!matRes.success) {
            if (cost.coins > 0) gs.addCurrency(cost.coins, 0);
            return matRes;
        }

        gs.player.unlockedPerks.push(perkId);
        gs.player.perkRanks = { ...(gs.player.perkRanks || {}), [perkId]: Math.max(1, (gs.player.perkRanks && gs.player.perkRanks[perkId]) || 1) };
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('lesaio_unlocked_perks', JSON.stringify(gs.player.unlockedPerks));
            this.savePerkRanks(gs.player.perkRanks);
        }

        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.emit('perkUnlocked', { perkId });
        }
        return { success: true };
    }

    static upgradePerk(state, perkId) {
        const gs = state || (typeof window !== 'undefined' ? window.GameState : null);
        if (!gs || !gs.player) return { success: false, reason: 'Missing GameState' };
        if (!Array.isArray(gs.player.unlockedPerks) || !gs.player.unlockedPerks.includes(perkId)) {
            return { success: false, reason: 'Unlock this perk first!' };
        }

        const curRank = this.getPerkRank(gs, perkId);
        const maxRank = this.getPerkMaxRank(perkId);
        if (curRank >= maxRank) return { success: false, reason: 'Already at MAX Rank!' };

        const cost = this.getNextUpgradeCost(perkId, curRank);
        if (!cost) return { success: false, reason: 'No higher rank available!' };

        const afford = this._canAfford(cost, gs);
        if (!afford.coinsOk) return { success: false, reason: 'Not enough Coins!' };
        if (!afford.matsOk) return { success: false, reason: 'Not enough crafting materials!' };

        if (cost.coins > 0 && !gs.spendCoins(cost.coins)) {
            return { success: false, reason: 'Not enough Coins!' };
        }
        const matRes = this.consumeMaterials(cost.materials, gs, { source: 'perk_upgrade', perkId, rank: cost.nextRank });
        if (!matRes.success) {
            if (cost.coins > 0) gs.addCurrency(cost.coins, 0);
            return matRes;
        }

        gs.player.perkRanks = { ...(gs.player.perkRanks || {}), [perkId]: cost.nextRank };
        this.savePerkRanks(gs.player.perkRanks);

        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.emit('perkUpgraded', { perkId, rank: cost.nextRank });
        }
        return { success: true, rank: cost.nextRank };
    }

    static formatCostText(cost, state = null) {
        if (!cost) return '';
        const parts = [];
        if (cost.coins > 0) parts.push(`🪙 ${cost.coins.toLocaleString()}`);
        const mats = cost.materials || {};
        for (const [matId, qty] of Object.entries(mats)) {
            if (!qty || qty <= 0) continue;
            const def = (typeof MaterialRegistry !== 'undefined') ? MaterialRegistry.get(matId) : null;
            parts.push(`${def ? def.name : matId} x${qty}`);
        }
        return parts.join(' + ');
    }
}

if (typeof window !== 'undefined') {
    window.PerkProgression = PerkProgression;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PerkProgression };
}
