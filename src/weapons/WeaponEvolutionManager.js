/**
 * Lesa.io - Mythic Weapon Evolution System
 * Rules:
 *   - ONLY Mythic weapons can be evolved (Common / Uncommon / Rare / Epic / Legendary / Exclusive cannot).
 *   - NO level upgrades on weapons — strictly ONE single Evolution awakening per Mythic weapon.
 */

class WeaponEvolutionManager {
    static STORAGE_KEY = 'lesaio_evolved_weapons';

    static EVOLVE_COST = {
        coins: 20000,
        evolutionStones: 1
    };

    static _resolveWeapon(weaponOrId) {
        if (!weaponOrId) return null;
        if (typeof weaponOrId === 'object') return weaponOrId;
        if (typeof WEAPONS !== 'undefined' && WEAPONS[weaponOrId]) return WEAPONS[weaponOrId];
        if (typeof window !== 'undefined' && window.WEAPONS && window.WEAPONS[weaponOrId]) {
            return window.WEAPONS[weaponOrId];
        }
        return null;
    }

    static _resolveId(weaponOrId) {
        if (!weaponOrId) return '';
        return typeof weaponOrId === 'object' ? (weaponOrId.id || '') : String(weaponOrId);
    }

    static normalizeRarity(rarity) {
        return String(rarity || 'common').toLowerCase().trim();
    }

    static isEvolvableWeapon(weaponOrId) {
        const w = this._resolveWeapon(weaponOrId);
        const r = w ? this.normalizeRarity(w.rarity) : '';
        return r === 'mythic' || r === 'apex' || r === 'celestial';
    }

    static _sanitizeList(raw) {
        let candidates = [];
        if (Array.isArray(raw)) {
            candidates = raw;
        } else if (raw && typeof raw === 'object') {
            candidates = Object.keys(raw).filter((k) => !!raw[k]);
        }
        const out = [];
        for (const id of candidates) {
            if (typeof id === 'string' && id && !out.includes(id) && this.isEvolvableWeapon(id)) {
                out.push(id);
            }
        }
        return out;
    }

    static getEvolvedList() {
        const gsList = (typeof window !== 'undefined' && window.GameState && window.GameState.player)
            ? window.GameState.player.evolvedWeapons
            : null;
        let raw = gsList;
        if (!raw && typeof localStorage !== 'undefined') {
            try {
                raw = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
            } catch (e) {
                raw = [];
            }
        }
        return this._sanitizeList(raw);
    }

    static setEvolvedList(rawList) {
        const clean = this._sanitizeList(rawList);
        if (typeof window !== 'undefined' && window.GameState && window.GameState.player) {
            window.GameState.player.evolvedWeapons = clean;
        }
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(clean));
        }
        return clean;
    }

    static isEvolved(weaponOrId) {
        const id = this._resolveId(weaponOrId);
        if (!id || !this.isEvolvableWeapon(weaponOrId)) return false;
        return this.getEvolvedList().includes(id);
    }

    static _isUnlocked(weaponId) {
        if (!weaponId) return false;
        if (typeof WeaponSystem !== 'undefined' && typeof WeaponSystem.isWeaponUnlocked === 'function') {
            if (WeaponSystem.SHARED_UNLOCKABLE_IDS && WeaponSystem.SHARED_UNLOCKABLE_IDS.includes(weaponId)) {
                return WeaponSystem.isWeaponUnlocked(weaponId);
            }
            return true;
        }
        return true;
    }

    static canEvolve(weaponOrId) {
        const w = this._resolveWeapon(weaponOrId);
        if (!w || !this.isEvolvableWeapon(w)) return false;
        if (!this._isUnlocked(w.id)) return false;
        return !this.isEvolved(w);
    }

    static getEvolveCost(weaponOrId) {
        if (!this.isEvolvableWeapon(weaponOrId)) return null;
        return {
            coins: this.EVOLVE_COST.coins,
            evolutionStones: this.EVOLVE_COST.evolutionStones
        };
    }

    static _getCoins() {
        if (typeof GearUpgradeManager !== 'undefined' && typeof GearUpgradeManager._getCoins === 'function') {
            return GearUpgradeManager._getCoins();
        }
        if (typeof window !== 'undefined' && window.GameState && window.GameState.player) {
            return Math.max(0, Number(window.GameState.player.coins) || 0);
        }
        return 0;
    }

    static _spendCoins(amount) {
        if (typeof GearUpgradeManager !== 'undefined' && typeof GearUpgradeManager._spendCoins === 'function') {
            return GearUpgradeManager._spendCoins(amount);
        }
        if (typeof window !== 'undefined' && window.GameState && typeof window.GameState.spendCoins === 'function') {
            return window.GameState.spendCoins(amount);
        }
        return false;
    }

    static _getStones() {
        if (typeof GearUpgradeManager !== 'undefined' && typeof GearUpgradeManager.getEvolutionStones === 'function') {
            return GearUpgradeManager.getEvolutionStones();
        }
        return 0;
    }

    static hasEvolveResources(weaponOrId) {
        const cost = this.getEvolveCost(weaponOrId);
        if (!cost) return false;
        return this._getCoins() >= cost.coins && this._getStones() >= cost.evolutionStones;
    }

    static getEffectiveConfig(weaponId, baseConfig = null, overrideEvolved = null) {
        const meta = this._resolveWeapon(weaponId);
        const cfg = baseConfig || meta || {};
        if (!this.isEvolvableWeapon(weaponId)) return cfg;

        const evolved = overrideEvolved !== null ? !!overrideEvolved : this.isEvolved(weaponId);
        if (!evolved) return cfg;

        if (meta && meta.evolved) {
            return { ...cfg, ...meta.evolved };
        }
        return {
            ...cfg,
            baseDamage: Math.round((cfg.baseDamage || 30) * 1.35),
            baseDelay: Math.max(4, Math.round((cfg.baseDelay || 15) * 0.85)),
            extraPierce: (cfg.extraPierce || 0) + 1,
            critChanceBonus: (cfg.critChanceBonus || 0) + 0.06
        };
    }

    static evolveWeapon(weaponOrId) {
        const w = this._resolveWeapon(weaponOrId);
        if (!w) return { success: false, reason: 'Weapon not found.' };
        if (!this.isEvolvableWeapon(w)) {
            return { success: false, reason: 'Only Mythic weapons can be evolved.' };
        }
        if (typeof WeaponSystem !== 'undefined' && !WeaponSystem.isWeaponUnlocked(w.id)) {
            return { success: false, reason: 'Unlock this Mythic weapon first.' };
        }
        if (this.isEvolved(w)) {
            return { success: false, reason: 'Weapon is already Evolved.' };
        }

        const cost = this.getEvolveCost(w);
        if (this._getCoins() < cost.coins) {
            return { success: false, reason: 'Not enough Coins.' };
        }
        if (this._getStones() < cost.evolutionStones) {
            return { success: false, reason: 'Requires an Evolution Stone.' };
        }
        if (!this._spendCoins(cost.coins)) {
            return { success: false, reason: 'Not enough Coins.' };
        }
        if (typeof GearUpgradeManager !== 'undefined' && typeof GearUpgradeManager.addEvolutionStones === 'function') {
            GearUpgradeManager.addEvolutionStones(-cost.evolutionStones);
        }

        const list = this.getEvolvedList();
        list.push(w.id);
        const saved = this.setEvolvedList(list);

        if (typeof window !== 'undefined') {
            if (window.cloudSave && window.cloudSave.currentUser && typeof window.cloudSave.saveToCloud === 'function') {
                window.cloudSave.saveToCloud({ evolvedWeapons: saved });
            }
            if (window.soundEngine && typeof window.soundEngine.playLevelUp === 'function') {
                window.soundEngine.playLevelUp();
            }
            if (window.EventBus && typeof window.EventBus.emit === 'function') {
                window.EventBus.emit('weaponEvolved', { weaponId: w.id, evolvedWeapons: saved });
            }
            if (window.uiController && window.uiController.modalManager && typeof window.uiController.modalManager.updateGearScreen === 'function') {
                window.uiController.modalManager.updateGearScreen();
            }
            if (window.uiController && typeof window.uiController.updateCoinsDisplay === 'function') {
                window.uiController.updateCoinsDisplay();
            }
            if (window.inventoryModalUI && typeof window.inventoryModalUI.render === 'function') {
                window.inventoryModalUI.render();
            }
        }
        return { success: true, weapon: w, evolved: true, config: this.getEffectiveConfig(w.id) };
    }

    static updateWeaponSlotUI(weaponType, baseName) {
        const nameEl = document.getElementById('gear-equipped-weapon-name');
        const slotEl = document.getElementById('gear-slot-weapon');
        const isEvo = this.isEvolved(weaponType);

        if (nameEl && baseName) {
            nameEl.textContent = isEvo ? `${baseName} ★` : baseName;
        }
        if (slotEl) {
            slotEl.classList.toggle('is-evolved-card', isEvo);
            const oldBadge = slotEl.querySelector('.gear-slot-lvl-badge');
            if (oldBadge) oldBadge.remove();
            if (isEvo) {
                const badge = document.createElement('span');
                badge.className = 'gear-slot-lvl-badge is-evolved';
                badge.textContent = '★ EVO';
                slotEl.appendChild(badge);
            }
        }
    }

    static renderWeaponCardsUI() {
        if (typeof document === 'undefined') return;
        const cards = document.querySelectorAll('#weapons-modal .weapon-card');
        const coins = this._getCoins();
        const stones = this._getStones();
        const coinIc = typeof UiIcons !== 'undefined' ? UiIcons.i('coin', 'ui-icon-sm') : '🪙';
        const stoneIc = typeof UiIcons !== 'undefined' ? UiIcons.i('evolution_stone', 'ui-icon-sm') : '💎';

        cards.forEach((card) => {
            const wt = card.getAttribute('data-weapon');
            const oldRow = card.querySelector('.weapon-evo-row');
            const oldBox = card.querySelector('.weapon-evo-box');
            if (oldRow) oldRow.remove();
            if (oldBox) oldBox.remove();

            if (!wt || !this.isEvolvableWeapon(wt)) {
                card.classList.remove('is-evolved-card');
                return;
            }

            const unlocked = typeof WeaponSystem === 'undefined' || WeaponSystem.isWeaponUnlocked(wt);
            const wMeta = this._resolveWeapon(wt);
            const isEvolved = this.isEvolved(wt);
            card.classList.toggle('is-evolved-card', isEvolved);

            const nameEl = card.querySelector('.weapon-name');
            if (nameEl && wMeta && wMeta.name) {
                nameEl.textContent = isEvolved
                    ? `${wMeta.name.toUpperCase()} ★`
                    : wMeta.name.toUpperCase();
            }

            this._updateMythicCardStats(card, wMeta, isEvolved);
            if (!unlocked) return;

            const rKey = this.normalizeRarity(wMeta && wMeta.rarity);
            const isApex = rKey === 'apex';
            const isCelestial = rKey === 'celestial';
            const evoRow = document.createElement('div');
            evoRow.className = 'weapon-evo-row';
            evoRow.innerHTML = isEvolved
                ? `<span class="gear-lvl-pill is-evolved">${isCelestial ? '★ CELESTIAL AWAKENED' : (isApex ? '★ APEX AWAKENED' : '★ EVOLVED AWAKENED')}</span>`
                : `<span class="gear-lvl-pill is-max">${isCelestial ? 'CELESTIAL EVO (1x ★)' : (isApex ? 'APEX EVOLUTION (1x ★)' : 'MYTHIC EVOLUTION (1x ★)')}</span>`;

            const evoBox = document.createElement('div');
            evoBox.className = 'gear-upgrade-box weapon-evo-box';
            if (isEvolved) {
                evoBox.innerHTML = `<div class="gear-upgrade-cost-line" style="color:${isCelestial ? '#fef08a' : '#b45309'};">${isCelestial ? '★ AWAKENED CELESTIAL RELIC ★' : '★ AWAKENED MYTHIC WEAPON ★'}</div>`;
            } else {
                const cost = this.getEvolveCost(wt);
                const coinShort = coins < cost.coins;
                const stoneShort = stones < cost.evolutionStones;
                const canAfford = !coinShort && !stoneShort;
                evoBox.innerHTML = `
                    <div class="gear-upgrade-cost-line">
                        <span class="gear-cost-chip ${stoneShort ? 'is-short' : ''}">${stoneIc} ${cost.evolutionStones} Evo Stone</span>
                        <span class="gear-cost-chip ${coinShort ? 'is-short' : ''}">${coinIc} ${cost.coins.toLocaleString()}</span>
                    </div>
                    <button type="button" class="gear-btn gear-btn-evolve weapon-evolve-btn ${canAfford ? '' : 'disabled'}" data-weapon-evolve="${wt}">
                        ★ EVOLVE WITH STONE
                    </button>
                `;
                const btn = evoBox.querySelector('[data-weapon-evolve]');
                if (btn) {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const res = this.evolveWeapon(wt);
                        if (!res.success) {
                            if (typeof ModalManager !== 'undefined' && ModalManager.notifyInsufficient && res.reason) {
                                ModalManager.notifyInsufficient(`⚠️ ${res.reason}`, card);
                            }
                            if (window.soundEngine && typeof window.soundEngine.playBuzzer === 'function') {
                                window.soundEngine.playBuzzer();
                            }
                        }
                    });
                }
            }

            const statsList = card.querySelector('.weapon-stats-list');
            if (statsList && statsList.parentNode) {
                statsList.parentNode.insertBefore(evoRow, statsList);
                card.appendChild(evoBox);
            } else {
                card.appendChild(evoRow);
                card.appendChild(evoBox);
            }
        });
    }

    static _updateMythicCardStats(card, wMeta, isEvolved) {
        if (!card || !wMeta) return;
        const rows = card.querySelectorAll('.weapon-stat-row .stat-val');
        if (rows.length < 3) return;
        if (!card.dataset.origDmgText) {
            card.dataset.origDmgText = rows[0].textContent.trim();
            card.dataset.origDelayText = rows[1].textContent.trim();
            card.dataset.origTraitText = rows[2].textContent.trim();
        }
        const evo = wMeta.evolved || {};
        if (isEvolved && evo.uiStats) {
            rows[0].textContent = evo.uiStats.damage || `${evo.baseDamage || wMeta.baseDamage}`;
            rows[1].textContent = evo.uiStats.fireDelay || 'Awakened';
            rows[2].textContent = evo.uiStats.trait || card.dataset.origTraitText;
        } else if (isEvolved) {
            const evoDmg = Math.round((wMeta.baseDamage || 30) * 1.35);
            rows[0].textContent = `${evoDmg} Awakened`;
            rows[1].textContent = `${card.dataset.origDelayText} ★`;
            rows[2].textContent = card.dataset.origTraitText;
        } else {
            const baseDmg = wMeta.baseDamage || 46;
            const evoDmg = evo.baseDamage || Math.round(baseDmg * 1.35);
            const delta = Math.max(0, evoDmg - baseDmg);
            const baseLabel = card.dataset.origDmgText;
            rows[0].innerHTML = delta > 0
                ? `${baseLabel} <span class="gear-stat-delta">(→ ${evoDmg})</span>`
                : baseLabel;
            rows[1].textContent = card.dataset.origDelayText;
            rows[2].textContent = card.dataset.origTraitText;
        }
    }
}

if (typeof window !== 'undefined') {
    window.WeaponEvolutionManager = WeaponEvolutionManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WeaponEvolutionManager };
}
