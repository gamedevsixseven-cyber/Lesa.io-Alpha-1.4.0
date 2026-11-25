/**
 * Lesa.io - Celestial Weapon Skill Tree Persistence & Upgrade Manager
 * Enforces one irreversible branch lock per Celestial weapon after ★ Awakening.
 */

class CelestialSkillTreeManager {
    static STORAGE_KEY = 'lesaio_celestial_trees';

    static getTreeDef(weaponId) {
        if (!weaponId || typeof CELESTIAL_SKILL_TREES === 'undefined') return null;
        return CELESTIAL_SKILL_TREES[weaponId] || null;
    }

    static isTreeEligible(weaponId) {
        return !!this.getTreeDef(weaponId);
    }

    static _sanitizeEntry(weaponId, rawEntry) {
        const def = this.getTreeDef(weaponId);
        if (!def || !rawEntry || typeof rawEntry !== 'object') return null;
        const chosenPath = typeof rawEntry.chosenPath === 'string'
            ? rawEntry.chosenPath
            : null;
        const pathObj = chosenPath ? def.paths.find(p => p.id === chosenPath) : null;
        if (!pathObj) return null;

        const validNodeIds = new Set(pathObj.nodes.map(n => n.id));
        const unlockedNodes = Array.isArray(rawEntry.unlockedNodes)
            ? Array.from(new Set(rawEntry.unlockedNodes.filter(id => validNodeIds.has(id))))
            : [];
        if (unlockedNodes.length === 0) return null;
        return { chosenPath: pathObj.id, unlockedNodes };
    }

    static _sanitizeMap(raw) {
        const out = {};
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
        for (const [wid, entry] of Object.entries(raw)) {
            const clean = this._sanitizeEntry(wid, entry);
            if (clean) out[wid] = clean;
        }
        return out;
    }

    static getState() {
        const gsMap = (typeof window !== 'undefined' && window.GameState && window.GameState.player)
            ? window.GameState.player.celestialTrees
            : null;
        let raw = gsMap;
        if (!raw && typeof localStorage !== 'undefined') {
            try { raw = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}'); } catch (_) { raw = {}; }
        }
        return this._sanitizeMap(raw);
    }

    static setState(rawMap) {
        const clean = this._sanitizeMap(rawMap);
        if (typeof window !== 'undefined' && window.GameState && window.GameState.player) {
            window.GameState.player.celestialTrees = clean;
        }
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(clean));
        }
        return clean;
    }

    static mergeMaps(mapA, mapB) {
        const cleanA = this._sanitizeMap(mapA);
        const cleanB = this._sanitizeMap(mapB);
        const merged = { ...cleanA };
        for (const [wid, bEntry] of Object.entries(cleanB)) {
            const aEntry = merged[wid];
            if (!aEntry) {
                merged[wid] = bEntry;
            } else if (aEntry.chosenPath === bEntry.chosenPath) {
                merged[wid] = {
                    chosenPath: aEntry.chosenPath,
                    unlockedNodes: Array.from(new Set([...aEntry.unlockedNodes, ...bEntry.unlockedNodes]))
                };
            } else if (bEntry.unlockedNodes.length > aEntry.unlockedNodes.length) {
                merged[wid] = bEntry;
            }
        }
        return merged;
    }

    static getWeaponState(weaponId, overrideTree = undefined) {
        if (overrideTree !== undefined) {
            return (overrideTree && this._sanitizeEntry(weaponId, overrideTree)) || { chosenPath: null, unlockedNodes: [] };
        }
        const map = this.getState();
        return map[weaponId] || { chosenPath: null, unlockedNodes: [] };
    }

    static isAwakened(weaponId) {
        return typeof WeaponEvolutionManager !== 'undefined' && WeaponEvolutionManager.isEvolved(weaponId);
    }

    static getNodeStatus(weaponId, pathId, nodeId) {
        const def = this.getTreeDef(weaponId);
        if (!def) return 'invalid';
        const pathObj = def.paths.find(p => p.id === pathId);
        if (!pathObj) return 'invalid';
        const node = pathObj.nodes.find(n => n.id === nodeId);
        if (!node) return 'invalid';

        const st = this.getWeaponState(weaponId);
        if (st.unlockedNodes.includes(nodeId)) return 'unlocked';
        if (!this.isAwakened(weaponId)) return 'locked_unawakened';
        if (st.chosenPath && st.chosenPath !== pathId) return 'locked_path';

        const prevTier = pathObj.nodes.find(n => n.tier === node.tier - 1);
        if (prevTier && !st.unlockedNodes.includes(prevTier.id)) return 'locked_tier';
        return 'available';
    }

    static canAfford(cost) {
        if (!cost) return true;
        const coins = typeof WeaponEvolutionManager !== 'undefined' ? WeaponEvolutionManager._getCoins() : 0;
        if (coins < (cost.coins || 0)) return false;
        const stones = typeof WeaponEvolutionManager !== 'undefined' ? WeaponEvolutionManager._getStones() : 0;
        if (stones < (cost.evolutionStones || 0)) return false;
        if (cost.materials && typeof window !== 'undefined' && window.inventoryManager && typeof window.inventoryManager.hasMaterials === 'function') {
            if (!window.inventoryManager.hasMaterials(cost.materials)) return false;
        }
        return true;
    }

    static unlockNode(weaponId, pathId, nodeId) {
        const status = this.getNodeStatus(weaponId, pathId, nodeId);
        if (status === 'unlocked') return { success: false, reason: 'Already unlocked.' };
        if (status === 'locked_unawakened') return { success: false, reason: 'Awaken this Celestial weapon with an Evolution Stone first.' };
        if (status === 'locked_path') return { success: false, reason: 'Path permanently locked! You already committed to the other branch.' };
        if (status === 'locked_tier') return { success: false, reason: 'Unlock the previous tier node first.' };
        if (status !== 'available') return { success: false, reason: 'Invalid skill node.' };

        const def = this.getTreeDef(weaponId);
        const pathObj = def.paths.find(p => p.id === pathId);
        const node = pathObj.nodes.find(n => n.id === nodeId);
        const cost = node.cost || {};

        if (!this.canAfford(cost)) {
            return { success: false, reason: 'Insufficient Coins, Materials, or Evolution Stones.' };
        }
        if (cost.coins > 0 && typeof WeaponEvolutionManager !== 'undefined' && !WeaponEvolutionManager._spendCoins(cost.coins)) {
            return { success: false, reason: 'Not enough Coins.' };
        }
        if (cost.evolutionStones > 0 && typeof GearUpgradeManager !== 'undefined' && typeof GearUpgradeManager.addEvolutionStones === 'function') {
            GearUpgradeManager.addEvolutionStones(-cost.evolutionStones);
        }
        if (cost.materials && typeof window !== 'undefined' && window.inventoryManager && typeof window.inventoryManager.consumeMaterials === 'function') {
            window.inventoryManager.consumeMaterials(cost.materials);
        }

        const all = this.getState();
        const cur = all[weaponId] || { chosenPath: pathId, unlockedNodes: [] };
        cur.chosenPath = pathId; // Permanently commits this branch
        if (!cur.unlockedNodes.includes(nodeId)) cur.unlockedNodes.push(nodeId);
        all[weaponId] = cur;
        const saved = this.setState(all);

        if (typeof window !== 'undefined') {
            if (window.cloudSave && window.cloudSave.currentUser && typeof window.cloudSave.saveToCloud === 'function') {
                window.cloudSave.saveToCloud({ celestialTrees: saved });
            }
            if (window.soundEngine && typeof window.soundEngine.playLevelUp === 'function') window.soundEngine.playLevelUp();
            if (window.EventBus && typeof window.EventBus.emit === 'function') {
                window.EventBus.emit('celestialTreeUpdated', { weaponId, nodeId, pathId, celestialTrees: saved });
            }
            if (window.uiController && window.uiController.modalManager && typeof window.uiController.modalManager.updateGearScreen === 'function') {
                window.uiController.modalManager.updateGearScreen();
            }
            if (window.uiController && typeof window.uiController.updateCoinsDisplay === 'function') {
                window.uiController.updateCoinsDisplay();
            }
        }
        return { success: true, weaponId, pathId, node, state: saved[weaponId] };
    }

    static getModifiers(weaponId, overrideTree = undefined) {
        const def = this.getTreeDef(weaponId);
        const st = this.getWeaponState(weaponId, overrideTree);
        const mods = {
            baseDamage: 0, baseDelayDelta: 0, critChanceBonus: 0, extraPierce: 0,
            range: 0, speedMultiplierBonus: 0, cleaveRadiusBonus: 0,
            orbitBladesBonus: 0, orbitDamageMultBonus: 0,
            unlockedCount: st.unlockedNodes.length,
            chosenPath: st.chosenPath,
            chosenPathName: null,
            specialTrait: null
        };
        if (!def || !st.chosenPath) return mods;
        const pathObj = def.paths.find(p => p.id === st.chosenPath);
        if (!pathObj) return mods;
        mods.chosenPathName = pathObj.name;

        for (const node of pathObj.nodes) {
            if (!st.unlockedNodes.includes(node.id)) continue;
            const s = node.stats || {};
            if (s.baseDamage) mods.baseDamage += s.baseDamage;
            if (s.baseDelayDelta) mods.baseDelayDelta += s.baseDelayDelta;
            if (s.critChanceBonus) mods.critChanceBonus += s.critChanceBonus;
            if (s.extraPierce) mods.extraPierce += s.extraPierce;
            if (s.range) mods.range += s.range;
            if (s.speedMultiplierBonus) mods.speedMultiplierBonus += s.speedMultiplierBonus;
            if (s.cleaveRadiusBonus) mods.cleaveRadiusBonus += s.cleaveRadiusBonus;
            if (s.orbitBladesBonus) mods.orbitBladesBonus += s.orbitBladesBonus;
            if (s.orbitDamageMultBonus) mods.orbitDamageMultBonus += s.orbitDamageMultBonus;
            if (node.specialTrait) mods.specialTrait = node.specialTrait;
        }
        return mods;
    }

    static applyToConfig(weaponId, cfg, overrideTree = undefined) {
        if (!cfg || !this.isTreeEligible(weaponId)) return cfg;
        const mods = this.getModifiers(weaponId, overrideTree);
        if (mods.unlockedCount <= 0) return cfg;
        const out = { ...cfg };
        out.baseDamage = (out.baseDamage || 60) + mods.baseDamage;
        out.baseDelay = Math.max(5, (out.baseDelay || 15) + mods.baseDelayDelta);
        out.critChanceBonus = (out.critChanceBonus || 0) + mods.critChanceBonus;
        out.extraPierce = (out.extraPierce || 0) + mods.extraPierce;
        out.range = (out.range || 360) + mods.range;
        if (mods.speedMultiplierBonus) out.speedMultiplier = (out.speedMultiplier || 1.0) + mods.speedMultiplierBonus;
        out.celestialMods = mods;
        out.celestialTraitId = mods.specialTrait ? mods.specialTrait.id : null;
        return out;
    }
}

if (typeof window !== 'undefined') window.CelestialSkillTreeManager = CelestialSkillTreeManager;
if (typeof module !== 'undefined' && module.exports) module.exports = { CelestialSkillTreeManager };
