/**
 * Lesa.io - Public Loadout, Gear & Weapon Collection Extractor
 * Extracts worn gear, equipped weapon, and weapon collection for social inspection
 * while enforcing the player's Private Gear & Weapons setting.
 */

class PlayerLoadoutExtractor {
    static SLOTS = ['helmet', 'armor', 'belt', 'gloves', 'boots'];
    static PRIVACY_STORAGE_KEY = 'lesaio_private_loadout';

    static HERO_DEFAULT_WEAPONS = {
        psanas: 'pea',
        psogas: 'pepper',
        petros: 'watermelon',
        '50balos': 'money_gun',
        billias: 'burger',
        kitsos: 'lightning',
        psgiannhs: 'greek_flag'
    };

    static isLocalPrivate() {
        const gs = (typeof window !== 'undefined') ? window.GameState : null;
        if (gs && gs.settings && typeof gs.settings.privateLoadout === 'boolean') {
            return gs.settings.privateLoadout;
        }
        return typeof localStorage !== 'undefined' && localStorage.getItem(this.PRIVACY_STORAGE_KEY) === 'true';
    }

    static setLocalPrivate(isPrivate, syncRemote = true) {
        const next = Boolean(isPrivate);
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(this.PRIVACY_STORAGE_KEY, next ? 'true' : 'false');
        }
        if (typeof window !== 'undefined' && window.GameState && window.GameState.settings) {
            window.GameState.settings.privateLoadout = next;
        }
        if (syncRemote && typeof window !== 'undefined') {
            if (window.SaveManager && typeof window.SaveManager.requestSave === 'function') {
                window.SaveManager.requestSave(150);
            }
            if (window.friendService && typeof window.friendService.syncMyProfile === 'function') {
                window.friendService.syncMyProfile(true);
            }
        }
        return next;
    }

    static getHeroWeaponMap() {
        const out = { ...this.HERO_DEFAULT_WEAPONS };
        const reg = (typeof HEROES !== 'undefined' && HEROES) || (typeof window !== 'undefined' && window.HEROES) || null;
        if (reg) {
            for (const [hid, h] of Object.entries(reg)) {
                if (h && h.weaponType) out[hid] = h.weaponType;
            }
        }
        return out;
    }

    static resolveOwnedWeapons(unlockedHeroes = [], unlockedWeapons = []) {
        const heroMap = this.getHeroWeaponMap();
        const weaponReg = (typeof WEAPONS !== 'undefined' && WEAPONS) || (typeof window !== 'undefined' && window.WEAPONS) || {};
        const owned = new Set(['pea']);

        if (Array.isArray(unlockedHeroes)) {
            for (const hid of unlockedHeroes) {
                const sig = heroMap[hid];
                if (sig && (!Object.keys(weaponReg).length || weaponReg[sig])) owned.add(sig);
            }
        }
        if (Array.isArray(unlockedWeapons)) {
            for (const wid of unlockedWeapons) {
                if (typeof wid === 'string' && wid && (!Object.keys(weaponReg).length || weaponReg[wid])) {
                    owned.add(wid);
                }
            }
        }
        return Array.from(owned);
    }

    static getCatalogWeapons() {
        const reg = (typeof WEAPONS !== 'undefined' && WEAPONS) || (typeof window !== 'undefined' && window.WEAPONS) || {};
        const heroOwner = {};
        for (const [hid, wid] of Object.entries(this.getHeroWeaponMap())) heroOwner[wid] = hid;

        return Object.values(reg).filter(w => w && w.id).map((w) => {
            const ownerHero = heroOwner[w.id];
            let sourceText = w.unlockLabel || '';
            if (!sourceText && ownerHero) {
                sourceText = ownerHero === 'psanas' ? 'STARTER' : `${ownerHero.toUpperCase()} HERO`;
            }
            return { ...w, rarityKey: String(w.rarity || 'Common').toLowerCase(), sourceText: sourceText || 'ARSENAL' };
        });
    }

    static _normalizeGearEntry(itemId, levelsMap = {}, ascendedSet = new Set(), evolvedSet = new Set()) {
        if (!itemId || typeof itemId !== 'string') return null;
        const rawLvl = parseInt(levelsMap[itemId], 10);
        return {
            id: itemId,
            level: Number.isFinite(rawLvl) && rawLvl >= 1 ? Math.min(4, rawLvl) : 1,
            ascended: ascendedSet.has(itemId),
            evolved: evolvedSet.has(itemId)
        };
    }

    static _extractGearMap(equippedRaw = {}, levelsMap = {}, ascendedList = [], evolvedList = []) {
        const ascSet = new Set(Array.isArray(ascendedList) ? ascendedList : []);
        const evoSet = new Set(Array.isArray(evolvedList) ? evolvedList : []);
        const gear = {};
        for (const slot of this.SLOTS) {
            const rawVal = equippedRaw ? equippedRaw[slot] : null;
            if (rawVal && typeof rawVal === 'object' && rawVal.id) {
                gear[slot] = {
                    id: String(rawVal.id),
                    level: Math.max(1, Math.min(4, parseInt(rawVal.level, 10) || 1)),
                    ascended: Boolean(rawVal.ascended),
                    evolved: Boolean(rawVal.evolved)
                };
            } else {
                gear[slot] = this._normalizeGearEntry(rawVal, levelsMap, ascSet, evoSet);
            }
        }
        return gear;
    }

    static getLocalSummary() {
        const gs = (typeof window !== 'undefined' && window.GameState) ? window.GameState : null;
        const p = (gs && gs.player) ? gs.player : {};
        const ls = typeof localStorage !== 'undefined' ? localStorage : null;
        const sj = (k, fb) => {
            if (!ls) return fb;
            try { const v = JSON.parse(ls.getItem(k) || 'null'); return v !== null ? v : fb; } catch (_) { return fb; }
        };

        const hero = p.selectedHero || (ls && ls.getItem('lesaio_selected_hero')) || 'psanas';
        const heroMap = this.getHeroWeaponMap();
        const heroDefWep = heroMap[hero] || 'pea';
        const weapon = (typeof WeaponSystem !== 'undefined' && typeof WeaponSystem.resolveEquippedWeapon === 'function')
            ? WeaponSystem.resolveEquippedWeapon(heroDefWep)
            : (p.selectedWeapon || (ls && ls.getItem('lesaio_selected_weapon')) || heroDefWep);
        const evolvedWeapons = (typeof WeaponEvolutionManager !== 'undefined' && typeof WeaponEvolutionManager.getEvolvedList === 'function')
            ? WeaponEvolutionManager.getEvolvedList()
            : sj('lesaio_evolved_weapons', []);
        const equippedRaw = (typeof GearManager !== 'undefined' && typeof GearManager.getEquippedMap === 'function')
            ? GearManager.getEquippedMap()
            : (p.equippedGear || sj('lesaio_equipped_gear', {}));
        const levelsMap = (typeof GearUpgradeManager !== 'undefined' && typeof GearUpgradeManager.getAllLevels === 'function')
            ? GearUpgradeManager.getAllLevels()
            : (p.gearLevels || sj('lesaio_gear_levels', {}));
        const ascended = (typeof GearUpgradeManager !== 'undefined' && typeof GearUpgradeManager.getAscendedList === 'function')
            ? GearUpgradeManager.getAscendedList()
            : (p.ascendedGear || sj('lesaio_ascended_gear', []));
        const evolvedGear = (typeof GearUpgradeManager !== 'undefined' && typeof GearUpgradeManager.getEvolvedList === 'function')
            ? GearUpgradeManager.getEvolvedList()
            : (p.evolvedGear || sj('lesaio_evolved_gear', []));
        const unlockedHeroes = Array.isArray(p.unlockedHeroes) ? p.unlockedHeroes : sj('lesaio_unlocked_heroes', ['psanas']);
        const unlockedRaw = Array.isArray(p.unlockedWeapons) ? p.unlockedWeapons : sj('lesaio_unlocked_weapons', ['pea']);
        const unlockedWeapons = this.resolveOwnedWeapons(unlockedHeroes, unlockedRaw);
        if (weapon && !unlockedWeapons.includes(weapon)) unlockedWeapons.push(weapon);
        const starBlessed = (typeof HeroStarBlessing !== 'undefined' && typeof HeroStarBlessing.isBlessed === 'function')
            ? Boolean(HeroStarBlessing.isBlessed(hero))
            : (Array.isArray(p.starBlessedHeroes) && p.starBlessedHeroes.includes(hero));

        return {
            isPrivate: this.isLocalPrivate(),
            hero,
            starBlessed,
            weapon,
            weaponEvolved: evolvedWeapons.includes(weapon),
            gear: this._extractGearMap(equippedRaw, levelsMap, ascended, evolvedGear),
            unlockedWeapons,
            evolvedWeapons
        };
    }

    static serializeForPublicCloud() {
        const local = this.getLocalSummary();
        if (local.isPrivate) {
            return { private: true, updatedAt: Date.now() };
        }
        return {
            private: false,
            hero: local.hero,
            starBlessed: local.starBlessed,
            weapon: local.weapon,
            weaponEvolved: local.weaponEvolved,
            gear: local.gear,
            unlockedWeapons: local.unlockedWeapons,
            evolvedWeapons: local.evolvedWeapons,
            updatedAt: Date.now()
        };
    }

    static extractFromDoc(docData = {}, opts = {}) {
        const isSelf = Boolean(opts && opts.isSelf);
        const data = (docData && typeof docData === 'object') ? docData : {};
        const p = (data.player && typeof data.player === 'object') ? data.player : {};
        const pub = (data.publicLoadout && typeof data.publicLoadout === 'object') ? data.publicLoadout : null;
        const settingsPriv = Boolean((data.settings && data.settings.privateLoadout) || data.privateLoadout);
        const isPrivate = Boolean((pub && pub.private) || settingsPriv);

        if (isPrivate && !isSelf) {
            return { isPrivate: true, hero: data.selectedHero || p.selectedHero || 'psanas', starBlessed: false, weapon: null, weaponEvolved: false, gear: {}, unlockedWeapons: [], evolvedWeapons: [] };
        }
        if (pub && !pub.private && (pub.weapon || pub.gear)) {
            const evoWeps = Array.isArray(pub.evolvedWeapons) ? pub.evolvedWeapons : [];
            const owned = Array.isArray(pub.unlockedWeapons) && pub.unlockedWeapons.length ? [...pub.unlockedWeapons] : ['pea'];
            if (pub.weapon && !owned.includes(pub.weapon)) owned.push(pub.weapon);
            return {
                isPrivate,
                hero: pub.hero || data.selectedHero || p.selectedHero || 'psanas',
                starBlessed: Boolean(pub.starBlessed),
                weapon: pub.weapon || 'pea',
                weaponEvolved: Boolean(pub.weaponEvolved || evoWeps.includes(pub.weapon)),
                gear: this._extractGearMap(pub.gear || {}),
                unlockedWeapons: owned,
                evolvedWeapons: evoWeps
            };
        }

        const hero = data.selectedHero || p.selectedHero || 'psanas';
        const heroMap = this.getHeroWeaponMap();
        const unlockedHeroes = Array.isArray(p.unlockedHeroes) ? p.unlockedHeroes : (Array.isArray(data.unlockedHeroes) ? data.unlockedHeroes : [hero]);
        const unlockedWeapons = this.resolveOwnedWeapons(unlockedHeroes, Array.isArray(p.unlockedWeapons) ? p.unlockedWeapons : data.unlockedWeapons);
        const evolvedWeapons = Array.isArray(p.evolvedWeapons) ? p.evolvedWeapons : [];
        const rawWep = p.selectedWeapon || p.weaponType || data.selectedWeapon || heroMap[hero] || 'pea';
        const reg = (typeof WEAPONS !== 'undefined' && WEAPONS) || (typeof window !== 'undefined' && window.WEAPONS) || {};
        const weapon = (unlockedWeapons.includes(rawWep) || !!reg[rawWep]) ? rawWep : (heroMap[hero] || 'pea');
        if (weapon && !unlockedWeapons.includes(weapon)) unlockedWeapons.push(weapon);
        const starBlessed = Array.isArray(p.starBlessedHeroes) && p.starBlessedHeroes.includes(hero);

        return {
            isPrivate,
            hero,
            starBlessed,
            weapon,
            weaponEvolved: evolvedWeapons.includes(weapon),
            gear: this._extractGearMap(p.equippedGear || {}, p.gearLevels || {}, p.ascendedGear || [], p.evolvedGear || []),
            unlockedWeapons,
            evolvedWeapons
        };
    }

    static getSlotItemStats(slotInfo) {
        if (!slotInfo || !slotInfo.id) return { item: null, stats: {}, effRarity: 'common' };
        const item = (typeof GEAR_DATA !== 'undefined' && GEAR_DATA[slotInfo.id]) ? GEAR_DATA[slotInfo.id] : null;
        if (!item) return { item: null, stats: {}, effRarity: 'common' };
        const baseRarity = String(item.rarity || 'common').toLowerCase();
        const effRarity = (baseRarity === 'legendary' && slotInfo.ascended) ? 'mythic' : baseRarity;
        const stats = (typeof GearUpgradeManager !== 'undefined' && typeof GearUpgradeManager.getEffectiveStats === 'function')
            ? GearUpgradeManager.getEffectiveStats(item, slotInfo.level || 1, !!slotInfo.evolved, !!slotInfo.ascended)
            : { ...(item.stats || {}) };
        return { item, stats, effRarity };
    }

    static getLoadoutTotals(loadout) {
        const totals = { maxHp: 0, damageReduction: 0, critChance: 0, bulletDamage: 0, fireRate: 0, speed: 0 };
        if (!loadout || !loadout.gear) return totals;
        for (const slot of this.SLOTS) {
            const { stats } = this.getSlotItemStats(loadout.gear[slot]);
            for (const key of Object.keys(totals)) {
                if (typeof stats[key] === 'number') totals[key] += stats[key];
            }
        }
        totals.damageReduction = Math.min(40, totals.damageReduction);
        totals.critChance = Math.min(45, totals.critChance);
        return totals;
    }
}

if (typeof window !== 'undefined') window.PlayerLoadoutExtractor = PlayerLoadoutExtractor;
if (typeof module !== 'undefined' && module.exports) module.exports = { PlayerLoadoutExtractor };
