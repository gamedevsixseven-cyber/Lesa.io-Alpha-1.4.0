/**
 * Lesa.io - Boss Reward Queue & Claim/Equip Progression Manager
 * Persists first-time boss drops until claimed/equipped in the main menu.
 */

class BossRewardManager {
    static STORAGE_KEY = 'lesaio_pending_boss_rewards';

    static BOSS_DROP_BUNDLES = {
        kiloumpas: {
            bossName: 'Wave 15 Mini-Boss: Kiloumpas',
            items: [{ category: 'weapon', id: 'carbine' }]
        },
        rouf: {
            bossName: 'Wave 20 Boss: Rouf',
            items: [{ category: 'weapon', id: 'dialtone' }]
        },
        zeus: {
            bossName: 'Mount Olympus Floor 5: Zeus',
            items: [
                { category: 'weapon', id: 'zeus_thunderbolt' },
                { category: 'gear', id: 'zeus_aegis_cuirass' },
                { category: 'skill', id: 'wrath_of_olympus' }
            ]
        },
        mecha_kolossos: {
            bossName: 'Endless Wave 40: Kolossos MK-IV',
            items: [{ category: 'weapon', id: 'helios_cannon' }]
        }
    };

    static getPending() {
        if (typeof localStorage === 'undefined') return [];
        try {
            const parsed = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
            return [];
        }
    }

    static savePending(list) {
        const clean = Array.isArray(list) ? list : [];
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(clean));
        }
        if (typeof window !== 'undefined' && window.cloudSave && window.cloudSave.currentUser && typeof window.cloudSave.saveToCloud === 'function') {
            window.cloudSave.saveToCloud({ pendingBossRewards: clean });
        }
    }

    static hasPending() {
        return this.getPending().length > 0;
    }

    static isPending(category, id) {
        return this.getPending().some(entry => entry && entry.category === category && entry.id === id);
    }

    static isOwned(category, id) {
        if (category === 'weapon') {
            return typeof WeaponSystem !== 'undefined' && WeaponSystem.isWeaponUnlocked(id);
        }
        if (category === 'gear') {
            return typeof GearManager !== 'undefined' && GearManager.isUnlocked(id);
        }
        if (category === 'skill') {
            return typeof SkillManager !== 'undefined' && typeof SkillManager.isSkillUnlocked === 'function' && SkillManager.isSkillUnlocked(id);
        }
        return false;
    }

    static isOwnedOrPending(category, id) {
        return this.isOwned(category, id) || this.isPending(category, id);
    }

    static isEquipped(category, id) {
        if (category === 'weapon') {
            const cur = (typeof window !== 'undefined' && window.GameState && window.GameState.player && (window.GameState.player.selectedWeapon || window.GameState.player.weaponType))
                || (typeof localStorage !== 'undefined' && localStorage.getItem('lesaio_selected_weapon'));
            return cur === id;
        }
        if (category === 'gear') {
            if (typeof GearManager === 'undefined') return false;
            const item = GearManager.getGearData(id);
            const eq = item ? GearManager.getEquipped(item.slot) : null;
            return !!(eq && eq.id === id);
        }
        if (category === 'skill') {
            const cur = (typeof window !== 'undefined' && window.GameState && window.GameState.player && window.GameState.player.selectedSkill)
                || (typeof localStorage !== 'undefined' && localStorage.getItem('lesaio_selected_skill'));
            return cur === id;
        }
        return false;
    }

    /**
     * Queue first-time boss drops and trigger compact in-game edge notification.
     */
    static queueBossDrops(bossId, ctxOptions = {}) {
        const bundle = this.BOSS_DROP_BUNDLES[bossId];
        if (!bundle || !Array.isArray(bundle.items)) return { queued: [] };

        const current = this.getPending();
        const newlyQueued = [];
        const now = Date.now();

        for (const item of bundle.items) {
            if (!this.isOwnedOrPending(item.category, item.id)) {
                const entry = {
                    category: item.category,
                    id: item.id,
                    bossId,
                    bossName: ctxOptions.bossName || bundle.bossName,
                    earnedAt: now
                };
                current.push(entry);
                newlyQueued.push(entry);
            }
        }

        const activeGame = ctxOptions.game || (typeof window !== 'undefined' ? window.gameInstance : null);
        if (ctxOptions.syncCoop !== false && activeGame && activeGame.coopSession && !activeGame.isCoopGuest && activeGame.coopSession.net && activeGame.coopSession.net.connected) {
            const eventName = bossId === 'zeus' ? 'ZEUS_REWARD_UNLOCK' : 'BOSS_REWARD_UNLOCK';
            activeGame.coopSession.net.send(eventName, { bossId, bossName: ctxOptions.bossName || bundle.bossName });
        }

        if (newlyQueued.length === 0) return { queued: [] };

        this.savePending(current);

        if (ctxOptions.effects) {
            const sx = Number.isFinite(ctxOptions.x) ? ctxOptions.x : 0;
            const sy = Number.isFinite(ctxOptions.y) ? ctxOptions.y : 0;
            ctxOptions.effects.addComicSplash(sx, sy - 58, newlyQueued.length > 1 ? 'BOSS SPOILS!' : 'BOSS DROP!', '#fed330', 18, true);
            if (typeof ctxOptions.effects.addConfetti === 'function') {
                ctxOptions.effects.addConfetti(sx, sy, 36);
            }
        }
        if (typeof window !== 'undefined' && window.soundEngine && typeof window.soundEngine.playPickup === 'function') {
            window.soundEngine.playPickup('star');
        }
        if (typeof window !== 'undefined' && window.BossRewardModalUI && typeof window.BossRewardModalUI.showInGameDrops === 'function') {
            window.BossRewardModalUI.showInGameDrops(newlyQueued, ctxOptions.bossName || bundle.bossName);
        }

        return { queued: newlyQueued };
    }

    static getRewardMeta(category, id) {
        if (category === 'weapon') {
            const w = (typeof WEAPONS !== 'undefined' && WEAPONS[id]) || (typeof window !== 'undefined' && window.WEAPONS && window.WEAPONS[id]) || {};
            const lines = [
                { label: 'Damage', val: `${w.baseDamage || 0}` },
                { label: 'Fire Delay', val: `${((w.baseDelay || 15) / 60).toFixed(2)}s` }
            ];
            if (id === 'carbine') lines.push({ label: 'Perk', val: '+15% Crit • Pierces 2' });
            else if (id === 'dialtone') lines.push({ label: 'Perk', val: '4th 3-Way • -30% Slow' });
            else if (id === 'zeus_thunderbolt') lines.push({ label: 'Perk', val: 'Forked Arc • 5th Sky-Bolt' });
            else if (id === 'helios_cannon') lines.push({ label: 'Perk', val: '4th Singularity • 8th Omega Beam' });
            return {
                category,
                id,
                categoryLabel: 'WEAPON',
                name: w.name || id,
                rarity: w.rarity || 'Epic',
                iconImg: w.image || 'assets/WeaponIcons/ZeusThunderbolt.png',
                desc: w.unlockLabel ? `Boss Trophy (${w.unlockLabel})` : 'Boss Weapon Trophy',
                stats: lines
            };
        }

        if (category === 'gear') {
            const g = (typeof GearManager !== 'undefined' && GearManager.getGearData(id)) || {};
            const lines = [];
            if (g.stats) {
                if (g.stats.maxHp) lines.push({ label: 'Max HP', val: `+${g.stats.maxHp}` });
                if (g.stats.damageReduction) lines.push({ label: 'DEF', val: `+${g.stats.damageReduction}%` });
                if (g.stats.bulletDamage) lines.push({ label: 'Bullet DMG', val: `+${g.stats.bulletDamage}%` });
                if (g.stats.speed) lines.push({ label: 'Move Speed', val: `+${g.stats.speed}%` });
            }
            return {
                category,
                id,
                categoryLabel: (g.slot || 'ARMOR').toUpperCase(),
                name: g.name || id,
                rarity: g.rarity ? (g.rarity.charAt(0).toUpperCase() + g.rarity.slice(1)) : 'Mythic',
                iconImg: g.iconImg || 'assets/GearUIIcons/ARMOR.png',
                desc: g.passive ? `${g.passive.name}: ${g.passive.desc}` : (g.desc || 'Mythic Boss Gear'),
                stats: lines
            };
        }

        const s = (typeof SKILLS !== 'undefined' && SKILLS[id]) || (typeof window !== 'undefined' && window.SKILLS && window.SKILLS[id]) || {};
        const lvl1 = s.levels && s.levels[1];
        const sLines = lvl1 && Array.isArray(lvl1.stats)
            ? lvl1.stats.slice(0, 3).map(st => ({ label: st.label, val: st.value }))
            : [{ label: 'Cooldown', val: `${s.cooldown || 9.5}s` }];
        return {
            category,
            id,
            categoryLabel: 'ACTIVE SKILL',
            name: s.name || id,
            rarity: s.rarity || 'Mythic',
            iconImg: s.iconImg || 'assets/SkillsIcons/WrathOfOlympusSkill.svg',
            desc: s.desc || 'Mythic Olympian Active Skill',
            stats: sLines
        };
    }

    static claimItem(category, id, { equip = false, syncUI = true } = {}) {
        if (category === 'weapon') {
            if (typeof WeaponSystem !== 'undefined' && typeof WeaponSystem.unlockWeapon === 'function') {
                WeaponSystem.unlockWeapon(id, { silent: true });
            }
            if (equip && typeof window !== 'undefined') {
                if (window.GameState && window.GameState.player) {
                    window.GameState.player.weaponType = id;
                    window.GameState.player.selectedWeapon = id;
                }
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('lesaio_selected_weapon', id);
                }
            }
        } else if (category === 'gear') {
            if (typeof GearManager !== 'undefined') {
                GearManager.unlock(id, { free: true, source: 'boss_zeus' });
                if (equip) GearManager.equip(id);
            }
        } else if (category === 'skill') {
            if (typeof SkillManager !== 'undefined' && typeof SkillManager.unlockBossSkill === 'function') {
                SkillManager.unlockBossSkill(id, { silent: true });
            }
            if (equip && typeof window !== 'undefined') {
                const sm = window.uiController && window.uiController.skillManager;
                if (sm && typeof sm.selectSkill === 'function') {
                    sm.selectSkill(id);
                } else {
                    if (window.GameState && window.GameState.player) {
                        window.GameState.player.selectedSkill = id;
                    }
                    if (typeof localStorage !== 'undefined') {
                        localStorage.setItem('lesaio_selected_skill', id);
                    }
                }
            }
        }

        const nextPending = this.getPending().filter(e => !(e.category === category && e.id === id));
        this.savePending(nextPending);

        if (syncUI) this.syncAllUISurfaces();
    }

    static claimBatch(items, { equipAll = false } = {}) {
        if (!Array.isArray(items) || items.length === 0) return;
        for (const item of items) {
            this.claimItem(item.category, item.id, { equip: equipAll, syncUI: false });
        }
        this.syncAllUISurfaces();
        if (typeof window !== 'undefined' && window.soundEngine) {
            if (typeof window.soundEngine.playLevelUp === 'function') window.soundEngine.playLevelUp();
            else if (typeof window.soundEngine.playSelect === 'function') window.soundEngine.playSelect();
        }
    }

    static syncAllUISurfaces() {
        if (typeof window === 'undefined') return;
        if (window.modalManager && typeof window.modalManager.updateGearScreen === 'function') {
            window.modalManager.updateGearScreen();
        }
        if (typeof GearModalUI !== 'undefined' && typeof GearModalUI.renderAll === 'function') {
            GearModalUI.renderAll();
        }
        const sm = window.uiController && window.uiController.skillManager;
        if (sm) {
            if (typeof sm._syncState === 'function') sm._syncState();
            if (typeof sm.renderSkillCards === 'function') sm.renderSkillCards();
            if (typeof sm.updateHUDIcon === 'function') sm.updateHUDIcon();
        }
    }
}

if (typeof window !== 'undefined') {
    window.BossRewardManager = BossRewardManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BossRewardManager };
}
