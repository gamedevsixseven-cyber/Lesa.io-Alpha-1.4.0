/**
 * Lesa.io - Extended Developer Power Tools & Global Live Broadcast Service
 * Adds:
 *  1) Real-time Global Admin Broadcast to all active players (with selectable [DEV] tag, Alert, Event, or Plain Text mode)
 *  2) Expanded Combat Cheats (Hyper Fire 5x, Multi-Shot Frenzy, Auto-Magnet Aura, Freeze Enemies, Mid-Run Weapon/Hero Switcher, Loot Rain, Over-Shield)
 *  3) Expanded Progression/Loot Grants (Chests, +500 All Materials, ★ Evolve All Weapons, Max/Ascend/★ Evolve All Gear, Unlock All Cosmetics, VIP Pass Max, Clan Vault + Honor Crests, 1-Click God Account)
 */

class DevPowerToolsService {
    static BROADCAST_CHANNEL = 'global_admin_broadcast';
    static LAST_SEEN_KEY = 'lesaio_last_admin_bcast_id';
    static MAX_AGE_MS = 180000; // 3 minutes window for live players

    constructor() {
        this.hyperFire = false;
        this.multiShotFrenzy = false;
        this.autoMagnet = false;
        this.freezeEnemies = false;
        this._pollTimer = null;
        this._bannerTimer = null;
        this._bc = null;
        this._lastSeenId = this._loadLastSeenId();
    }

    _loadLastSeenId() {
        try { return (typeof localStorage !== 'undefined' && localStorage.getItem(DevPowerToolsService.LAST_SEEN_KEY)) || ''; }
        catch (_) { return ''; }
    }

    _saveLastSeenId(id) {
        this._lastSeenId = String(id || '');
        try { if (typeof localStorage !== 'undefined') localStorage.setItem(DevPowerToolsService.LAST_SEEN_KEY, this._lastSeenId); }
        catch (_) { }
    }

    /**
     * Start listening for live Global Admin Broadcasts across all active players.
     */
    initLiveBroadcastListener() {
        if (typeof window === 'undefined') return;
        if (typeof BroadcastChannel !== 'undefined' && !this._bc) {
            try {
                this._bc = new BroadcastChannel('lesaio_admin_bcast');
                this._bc.onmessage = (ev) => {
                    if (ev && ev.data && ev.data.text) this.displayBroadcastBanner(ev.data, true);
                };
            } catch (_) { }
        }
        if (this._pollTimer) clearInterval(this._pollTimer);
        setTimeout(() => this.pollLatestBroadcast(true), 2200);
        this._pollTimer = setInterval(() => {
            if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
            this.pollLatestBroadcast(false);
        }, 7000);
    }

    async pollLatestBroadcast(isInitialBoot = false) {
        const edge = (typeof window !== 'undefined' && window.edgeApi) ? window.edgeApi : null;
        if (!edge || typeof edge.get !== 'function') return;
        try {
            const res = await edge.get(`/messages/${DevPowerToolsService.BROADCAST_CHANNEL}?limit=1`);
            const list = (res && res.ok && Array.isArray(res.messages)) ? res.messages : [];
            if (list.length === 0) return;
            const msg = list[list.length - 1];
            if (!msg || !msg.text) return;
            const msgUid = `${msg.id || ''}_${msg.createdAt || 0}`;
            const age = Date.now() - (Number(msg.createdAt) || 0);
            if (isInitialBoot && !this._lastSeenId) {
                if (age > 45000) {
                    this._saveLastSeenId(msgUid);
                    return;
                }
            }
            if (msgUid === this._lastSeenId || age > DevPowerToolsService.MAX_AGE_MS) return;
            this._saveLastSeenId(msgUid);
            const parsed = this._decodeWireMessage(msg);
            this.displayBroadcastBanner(parsed, false);
        } catch (_) { }
    }

    _decodeWireMessage(msg) {
        const rawRole = String(msg.senderRole || 'dev').toLowerCase();
        const theme = String(msg.senderHero || 'gold').toLowerCase();
        return {
            id: `${msg.id || ''}_${msg.createdAt || Date.now()}`,
            text: String(msg.text || ''),
            tagMode: rawRole,
            theme: ['gold', 'crimson', 'celestial', 'emerald'].includes(theme) ? theme : 'gold',
            senderName: String(msg.senderName || 'DEV'),
            createdAt: Number(msg.createdAt) || Date.now()
        };
    }

    async sendGlobalBroadcast(opts = {}) {
        const text = String(opts.text || '').trim().slice(0, 180);
        if (!text) return { ok: false, error: 'Enter a broadcast message first.' };
        const tagMode = ['dev', 'plain', 'alert', 'event'].includes(opts.tagMode) ? opts.tagMode : 'dev';
        const theme = ['gold', 'crimson', 'celestial', 'emerald'].includes(opts.theme) ? opts.theme : 'gold';
        const customBadge = String(opts.customBadge || '').trim().slice(0, 28);
        const senderName = tagMode === 'plain' ? '' : (customBadge || (tagMode === 'alert' ? '⚠️ SERVER ALERT' : (tagMode === 'event' ? '🎉 LIVE EVENT' : '👑 DEV')));
        const payload = { id: `local_${Date.now()}`, text, tagMode, theme, senderName, createdAt: Date.now() };

        let sentOnline = false;
        const edge = (typeof window !== 'undefined' && window.edgeApi) ? window.edgeApi : null;
        const uid = (window.cloudSave && typeof window.cloudSave.getEffectivePlayerUid === 'function' && window.cloudSave.getEffectivePlayerUid())
            || (typeof localStorage !== 'undefined' && localStorage.getItem('lesaio_player_uid')) || 'dev_admin_uid';
        if (edge && typeof edge.post === 'function') {
            try {
                const res = await edge.post(`/messages/${DevPowerToolsService.BROADCAST_CHANNEL}`, {
                    senderUid: uid, senderName: senderName || 'SYSTEM', senderHero: theme, senderRole: tagMode, senderLevel: 99, text
                });
                if (res && res.ok) sentOnline = true;
            } catch (_) { }
        }
        if (this._bc) { try { this._bc.postMessage(payload); } catch (_) { } }
        this.displayBroadcastBanner(payload, true);
        return { ok: true, sentOnline, payload };
    }

    displayBroadcastBanner(bcast) {
        if (typeof document === 'undefined' || !bcast || !bcast.text) return;
        let el = document.getElementById('lesaio-admin-broadcast-banner');
        if (!el) {
            el = document.createElement('div');
            el.id = 'lesaio-admin-broadcast-banner';
            document.body.appendChild(el);
        }
        const tagMode = bcast.tagMode || 'dev', theme = bcast.theme || 'gold', showTag = tagMode !== 'plain';
        const badgeLabel = (bcast.senderName && bcast.senderName !== 'SYSTEM')
            ? bcast.senderName
            : (tagMode === 'alert' ? '⚠️ SERVER ALERT' : (tagMode === 'event' ? '🎉 LIVE EVENT' : '👑 DEV BROADCAST'));
        const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

        el.className = `admin-global-bcast-banner theme-${esc(theme)} ${showTag ? 'has-tag' : 'is-plain'}`;
        el.innerHTML = `<div class="agb-glow-bar"></div><div class="agb-inner">${showTag ? `<span class="agb-badge">${esc(badgeLabel)}</span>` : ''}<span class="agb-text">${esc(bcast.text)}</span><button type="button" class="agb-close-btn" title="Dismiss" aria-label="Dismiss">✕</button></div>`;
        el.querySelector('.agb-close-btn')?.addEventListener('click', () => el.classList.remove('is-visible'));
        void el.offsetWidth;
        el.classList.add('is-visible');

        if (window.soundEngine) {
            if (typeof window.soundEngine.playLevelUp === 'function') window.soundEngine.playLevelUp();
            else if (typeof window.soundEngine.playPickup === 'function') window.soundEngine.playPickup('star');
        }
        const g = window.gameInstance;
        if (g && g.state === 'PLAYING' && g.player && g.effects && typeof g.effects.addComicSplash === 'function') {
            g.effects.addComicSplash(g.player.x, g.player.y - 68, `${showTag ? `${badgeLabel}: ` : ''}${bcast.text}`.slice(0, 48), '#fed330', 22, true);
        }
        if (this._bannerTimer) clearTimeout(this._bannerTimer);
        this._bannerTimer = setTimeout(() => { if (el) el.classList.remove('is-visible'); }, 10500);
    }

    /**
     * Per-frame extended combat cheats hook (called from AdminCheats.applyToUpdate).
     */
    applyToUpdate(game, dt) {
        if (!game || !game.player) return;
        const p = game.player;

        // 1. Hyper Fire (5x Fire Rate)
        if (this.hyperFire && p.fireCooldown > 2.2) {
            p.fireCooldown = Math.max(1.2, p.fireCooldown * 0.22);
        }

        // 2. Multi-Shot Frenzy (+6 Projectiles)
        if (this.multiShotFrenzy) {
            if (!p._baseMultiBeforeCheat) p._baseMultiBeforeCheat = p.multiShot || 1;
            p.multiShot = Math.max(7, p._baseMultiBeforeCheat + 6);
        } else if (p._baseMultiBeforeCheat) {
            p.multiShot = p._baseMultiBeforeCheat;
            p._baseMultiBeforeCheat = 0;
        }

        // 3. Auto-Magnet Aura (pulls all drops across the arena)
        if (this.autoMagnet && Array.isArray(game.drops)) {
            for (let i = 0; i < game.drops.length; i++) {
                const d = game.drops[i];
                if (!d || d.collected) continue;
                d.magnetized = true;
                const dx = p.x - d.x, dy = p.y - d.y;
                const dist = Math.hypot(dx, dy) || 1;
                if (dist > 18) {
                    d.x += (dx / dist) * Math.min(dist, 26 * dt);
                    d.y += (dy / dist) * Math.min(dist, 26 * dt);
                }
            }
        }

        // 4. Freeze All Enemies
        if (this.freezeEnemies && Array.isArray(game.enemies)) {
            for (let i = 0; i < game.enemies.length; i++) {
                const e = game.enemies[i];
                if (!e || e.dead) continue;
                e.vx = 0;
                e.vy = 0;
                e.stunTimer = Math.max(e.stunTimer || 0, 12);
            }
        }
    }

    /**
     * Instant mid-run or menu weapon equip (unlocks + equips any weapon including Exotic/Celestial).
     */
    equipWeaponInstant(weaponId, forceEvolved = null) {
        if (!weaponId) return false;
        if (typeof WeaponSystem !== 'undefined' && typeof WeaponSystem.unlockWeapon === 'function') {
            WeaponSystem.unlockWeapon(weaponId, { silent: true });
        }
        if (forceEvolved !== null && typeof WeaponEvolutionManager !== 'undefined' && WeaponEvolutionManager.isEvolvableWeapon(weaponId)) {
            const list = WeaponEvolutionManager.getEvolvedList();
            if (forceEvolved && !list.includes(weaponId)) list.push(weaponId);
            else if (!forceEvolved && list.includes(weaponId)) list.splice(list.indexOf(weaponId), 1);
            WeaponEvolutionManager.setEvolvedList(list);
        }
        const isEvo = typeof WeaponEvolutionManager !== 'undefined' && WeaponEvolutionManager.isEvolved(weaponId);
        if (window.GameState && window.GameState.player) {
            window.GameState.player.weaponType = weaponId;
            window.GameState.player.selectedWeapon = weaponId;
        }
        if (typeof localStorage !== 'undefined') localStorage.setItem('lesaio_selected_weapon', weaponId);
        const g = window.gameInstance;
        if (g && g.player) {
            g.player.weaponType = weaponId;
            g.player.weaponEvolved = isEvo;
            g.player.fireCooldown = 0;
            if (g.effects) g.effects.addComicSplash(g.player.x, g.player.y - 45, `🔫 ${weaponId.toUpperCase()}${isEvo ? ' ★' : ''}!`, '#38bdf8', 20, true);
        }
        if (window.uiController && window.uiController.modalManager) {
            window.uiController.modalManager.updateGearScreen();
        }
        return true;
    }

    /**
     * Instant mid-run or menu hero morph.
     */
    switchHeroInstant(heroId) {
        if (!heroId) return false;
        if (window.GameState) {
            if (typeof window.GameState.unlockHero === 'function') window.GameState.unlockHero(heroId, 0);
            if (window.GameState.player) window.GameState.player.selectedHero = heroId;
        }
        if (typeof localStorage !== 'undefined') localStorage.setItem('lesaio_selected_hero', heroId);
        const g = window.gameInstance;
        if (g && g.player) {
            g.player.heroType = heroId;
            if (g.effects) {
                g.effects.addShockwave(g.player.x, g.player.y, 95, 'rgba(254, 211, 48, 0.9)');
                g.effects.addComicSplash(g.player.x, g.player.y - 48, `🦸 HERO: ${heroId.toUpperCase()}!`, '#fed330', 22, true);
            }
        }
        return true;
    }

    grantOverShield(game = window.gameInstance) {
        if (!game || !game.player) return false;
        const p = game.player;
        p.maxHp = (p.maxHp || 100) + 5000;
        p.hp = p.maxHp;
        p.shieldActive = true;
        if (game.effects) {
            game.effects.addShockwave(p.x, p.y, 110, 'rgba(56, 189, 248, 0.92)');
            game.effects.addComicSplash(p.x, p.y - 45, '🛡️ +5,000 OVER-SHIELD!', '#38bdf8', 22, true);
        }
        return true;
    }

    spawnLootRain(game = window.gameInstance) {
        if (!game || !window.AdminCheats) return 0;
        const types = ['xp', 'coin_pouch', 'heart', 'star', 'chrono_core', 'mat_armory_shards', 'mat_mati_crystal'];
        let total = 0;
        for (const t of types) {
            total += window.AdminCheats.spawnDrop(game, t, 4) || 0;
        }
        return total;
    }

    /**
     * Grant instant ready-to-open chests to the local player.
     */
    grantChests(chestMap = { mythic: 5 }) {
        if (typeof DevGiftManager !== 'undefined' && typeof DevGiftManager._grantChests === 'function') {
            DevGiftManager._grantChests(chestMap);
        }
        if (window.chestManager && typeof window.chestManager.render === 'function') window.chestManager.render();
        if (window.inventoryModalUI && typeof window.inventoryModalUI.render === 'function') window.inventoryModalUI.render();
        if (window.soundEngine) window.soundEngine.playLevelUp();
        return Object.values(chestMap).reduce((a, b) => a + b, 0);
    }

    /**
     * Grant +500 of all crafting materials + 25 Evolution Stones + 25 Star Stones.
     */
    grantAllMaterialsPack(qty = 500) {
        const mats = ['armory_shards', 'mati_crystal', 'olympian_bronze', 'ambrosia_spark'];
        if (window.AdminCheats) {
            for (const m of mats) window.AdminCheats.addMaterial(m, qty);
            window.AdminCheats.addEvolutionStones(25);
            window.AdminCheats.addStarStones(25);
            window.AdminCheats.addAscentCrests(3);
        }
        return mats.length;
    }

    /**
     * Unlock all 27 weapons AND awaken/evolve all Evolvable (Mythic/Apex/Celestial) weapons.
     */
    evolveAllWeapons() {
        if (window.AdminCheats) window.AdminCheats.unlockAllWeapons();
        if (typeof WeaponEvolutionManager === 'undefined') return 0;
        const wMap = (typeof WEAPONS !== 'undefined' && WEAPONS) || (window.WEAPONS) || {};
        const evoIds = Object.keys(wMap).filter(id => WeaponEvolutionManager.isEvolvableWeapon(id));
        WeaponEvolutionManager.setEvolvedList(evoIds);
        WeaponEvolutionManager.renderWeaponCardsUI();
        if (window.uiController && window.uiController.modalManager) window.uiController.modalManager.updateGearScreen();
        if (window.soundEngine) window.soundEngine.playLevelUp();
        return evoIds.length;
    }

    /**
     * Unlock all Gear items, level every piece to its max level (Lv.4), ascend Legendaries, and ★ Evolve all Mythics.
     */
    maxAndEvolveAllGear() {
        if (window.AdminCheats) window.AdminCheats.unlockAllGear();
        const gearMap = (typeof GEAR_DATA !== 'undefined' && GEAR_DATA) || window.GEAR_DATA || {};
        const levels = {}, ascended = [], evolved = [];
        for (const [id, item] of Object.entries(gearMap)) {
            if (!item) continue;
            const r = String(item.rarity || 'common').toLowerCase();
            const maxL = (typeof GearUpgradeManager !== 'undefined' && GearUpgradeManager.MAX_LEVEL_BY_RARITY[r]) || 1;
            levels[id] = maxL;
            if (r === 'legendary') ascended.push(id);
            if (r === 'mythic' || r === 'legendary') evolved.push(id);
        }
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('lesaio_gear_levels', JSON.stringify(levels));
            localStorage.setItem('lesaio_ascended_gear', JSON.stringify(ascended));
            localStorage.setItem('lesaio_evolved_gear', JSON.stringify(evolved));
        }
        if (window.GameState && window.GameState.player) {
            window.GameState.player.gearLevels = levels;
            window.GameState.player.ascendedGear = ascended;
            window.GameState.player.evolvedGear = evolved;
        }
        if (window.uiController && window.uiController.modalManager) window.uiController.modalManager.updateGearScreen();
        if (window.soundEngine) window.soundEngine.playLevelUp();
        return Object.keys(gearMap).length;
    }

    /**
     * Unlock all Profile Banners (including Dev/Exclusive), Avatar Frames, and Milestone Coins.
     */
    unlockAllCosmetics() {
        const banners = (typeof PROFILE_BANNERS !== 'undefined' ? PROFILE_BANNERS : []).map(b => b.id);
        const frames = (typeof PROFILE_FRAMES !== 'undefined' ? PROFILE_FRAMES : []).map(f => f.id);
        const coins = (typeof MILESTONE_COINS !== 'undefined' ? MILESTONE_COINS : []).map(c => c.id);
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('lesaio_unlocked_banners', JSON.stringify(banners));
            localStorage.setItem('lesaio_dev_gifted_banners', JSON.stringify(banners));
            localStorage.setItem('lesaio_unlocked_frames', JSON.stringify(frames));
            localStorage.setItem('lesaio_unlocked_coins', JSON.stringify(coins));
        }
        if (window.GameState && window.GameState.player) {
            window.GameState.player.cosmetics = {
                ...(window.GameState.player.cosmetics || {}),
                unlockedBanners: banners,
                devGiftedBanners: banners,
                unlockedFrames: frames,
                unlockedCoins: coins
            };
        }
        if (typeof ProfileCosmeticsUI !== 'undefined' && typeof ProfileCosmeticsUI.refreshHeaderPreview === 'function') {
            ProfileCosmeticsUI.refreshHeaderPreview();
        }
        if (window.soundEngine) window.soundEngine.playLevelUp();
        return banners.length + frames.length + coins.length;
    }

    /**
     * Unlock Battle Pass VIP + max Season XP (Tier 30).
     */
    unlockAndMaxBattlePass() {
        if (typeof DevGiftManager !== 'undefined' && typeof DevGiftManager._grantBattlePassVip === 'function') {
            DevGiftManager._grantBattlePassVip();
        }
        const bp = window.battlePassManager;
        if (bp) {
            bp.hasPremium = true;
            if (typeof bp.addXP === 'function') bp.addXP(100000);
            else { bp.xp = 100000; bp.tier = 30; bp.save?.(); }
        }
        if (window.battlePassModalUI && typeof window.battlePassModalUI.render === 'function') window.battlePassModalUI.render();
        if (window.soundEngine) window.soundEngine.playLevelUp();
        return true;
    }

    /**
     * Fill active Clan Vault (+50,000 all resources, +5,000 Clan XP) & grant +2,500 personal Honor Crests.
     */
    async boostClanAndCrests() {
        const cs = window.clanService;
        if (!cs) return { ok: false, error: 'ClanService unavailable.' };
        cs.honorCrests = (cs.honorCrests || 0) + 2500;
        if (cs.currentClan) {
            const v = { ...(cs.currentClan.vault || {}) };
            v.coins = (v.coins || 0) + 250000;
            v.armory_shards = (v.armory_shards || 0) + 5000;
            v.mati_crystal = (v.mati_crystal || 0) + 2000;
            v.olympian_bronze = (v.olympian_bronze || 0) + 2000;
            cs.currentClan.vault = v;
            cs.currentClan.xp = (cs.currentClan.xp || 0) + 5000;
            if (typeof ClanConfigHelper !== 'undefined') {
                cs.currentClan.level = ClanConfigHelper.getLevelFromXp(cs.currentClan.xp).level;
            }
            if (typeof cs.getEdge === 'function' && cs.getEdge() && cs.clanId) {
                try { await cs.getEdge().post('/clans/migrate', { clan: cs.currentClan }); } catch (_) { }
            }
        }
        cs.saveLocal?.();
        cs._emitUpdate?.();
        if (window.soundEngine) window.soundEngine.playLevelUp();
        return { ok: true, crests: cs.honorCrests, hasClan: !!cs.currentClan };
    }

    /**
     * 1-Click 100% Max God Account (everything unlocked, maxed, evolved & funded).
     */
    async unlockEverythingGodAccount() {
        const ac = window.AdminCheats;
        if (ac) {
            ac.addCurrency('coins', 1000000);
            ac.addCurrency('gems', 100000);
            ac.addAccountXP(25000);
            ac.unlockAllHeroes();
            ac.maxAllSkills();
            ac.unlockAllPerksAndFeats(true);
        }
        this.grantAllMaterialsPack(500);
        this.evolveAllWeapons();
        this.maxAndEvolveAllGear();
        this.unlockAllCosmetics();
        this.unlockAndMaxBattlePass();
        this.grantChests({ mythic: 5, legendary: 5, epic: 5 });
        await this.boostClanAndCrests();
        if (window.SaveManager && typeof window.SaveManager.requestSave === 'function') window.SaveManager.requestSave(200);
        return true;
    }

    /**
     * Bind all extended Dev Power Tools & Live Broadcast controls inside #admin-modal.
     */
    bindAdminPanelControls(panel) {
        if (typeof document === 'undefined' || !panel) return;

        // 1. Extended Combat Toggles
        const toggles = [
            ['admin-toggle-hyperfire', 'hyperFire', 'HYPER FIRE 5x'],
            ['admin-toggle-multishot', 'multiShotFrenzy', '+6 MULTI-SHOT'],
            ['admin-toggle-automagnet', 'autoMagnet', 'AUTO MAGNET'],
            ['admin-toggle-freeze', 'freezeEnemies', 'FREEZE MOBS']
        ];
        for (const [id, prop, label] of toggles) {
            const btn = document.getElementById(id);
            if (!btn) continue;
            btn.addEventListener('click', () => {
                this[prop] = !this[prop];
                btn.textContent = `${label}: ${this[prop] ? 'ON' : 'OFF'}`;
                btn.classList.toggle('is-active', this[prop]);
                panel.showToast(`${label} ${this[prop] ? 'ENABLED' : 'DISABLED'}.`);
            });
        }

        // 2. Populate Instant Weapon & Hero Switchers
        const wepSelect = document.getElementById('admin-select-instant-weapon');
        if (wepSelect && wepSelect.options.length <= 1) {
            const wMap = (typeof WEAPONS !== 'undefined' && WEAPONS) || window.WEAPONS || {};
            wepSelect.innerHTML = Object.values(wMap).filter(w => w && w.id).map(w =>
                `<option value="${w.id}">[${(w.rarity || 'STD').toUpperCase()}] ${w.name || w.id}</option>`
            ).join('');
            const curW = (window.GameState && window.GameState.player && window.GameState.player.weaponType) || 'hyperion_glaive';
            if (wMap[curW]) wepSelect.value = curW;
        }

        document.getElementById('admin-btn-equip-weapon-now')?.addEventListener('click', () => {
            const wid = wepSelect ? wepSelect.value : 'hyperion_glaive';
            this.equipWeaponInstant(wid, null);
            panel.showToast(`Equipped ${wid} immediately!`);
        });
        document.getElementById('admin-btn-evolve-weapon-now')?.addEventListener('click', () => {
            const wid = wepSelect ? wepSelect.value : 'hyperion_glaive';
            this.equipWeaponInstant(wid, true);
            panel.showToast(`Unlocked, Awakened ★ & Equipped ${wid}!`);
        });
        document.getElementById('admin-btn-switch-hero-now')?.addEventListener('click', () => {
            const hid = document.getElementById('admin-select-instant-hero')?.value || 'psanas';
            this.switchHeroInstant(hid);
            panel.showToast(`Morphed into ${hid.toUpperCase()}!`);
        });

        // 3. Instant Arena Extras & Economy Unlocks
        const actions = [
            ['admin-btn-overshield', () => {
                const ok = this.grantOverShield();
                panel.showToast(ok ? 'Granted +5,000 Over-Shield HP!' : 'Start a run first.', ok ? 'ok' : 'warn');
            }],
            ['admin-btn-loot-rain', () => {
                const n = this.spawnLootRain();
                panel.showToast(n ? `Rained ${n}x mixed loot drops around hero!` : 'Start a run first.', n ? 'ok' : 'warn');
            }],
            ['admin-btn-grant-mythic-chests', () => panel.showToast(`Granted +${this.grantChests({ mythic: 5 })} Ready Mythic Chests!`)],
            ['admin-btn-grant-all-chests', () => panel.showToast(`Granted +${this.grantChests({ common: 5, uncommon: 5, rare: 5, epic: 5, legendary: 5, mythic: 5 })} Chests across all tiers!`)],
            ['admin-btn-grant-all-mats', () => { this.grantAllMaterialsPack(500); panel.showToast('Added +500 All Materials, +25 Evo Stones & +25 Star Stones!'); }],
            ['admin-btn-evolve-all-weapons', () => panel.showToast(`Unlocked all weapons & Awakened ★ ${this.evolveAllWeapons()} weapons!`)],
            ['admin-btn-max-all-gear', () => panel.showToast(`Unlocked, Lv.4 Maxed, Ascended & ★ Evolved all ${this.maxAndEvolveAllGear()} gear items!`)],
            ['admin-btn-unlock-cosmetics', () => panel.showToast(`Unlocked all ${this.unlockAllCosmetics()} Banners, Frames & Milestone Coins!`)],
            ['admin-btn-max-battlepass', () => { this.unlockAndMaxBattlePass(); panel.showToast('Unlocked VIP Battle Pass & maxed to Tier 30!'); }],
            ['admin-btn-boost-clan', async () => {
                const r = await this.boostClanAndCrests();
                panel.showToast(r.hasClan ? `Clan Vault +50K resources, +5,000 Clan XP & ${r.crests} Honor Crests!` : `+2,500 Honor Crests (Total: ${r.crests})!`);
            }],
            ['admin-btn-god-account', async () => {
                await this.unlockEverythingGodAccount();
                panel.showToast('⚡ 100% MAX GOD ACCOUNT ACTIVATED!');
            }]
        ];
        for (const [id, fn] of actions) {
            document.getElementById(id)?.addEventListener('click', fn);
        }

        // 4. Global Admin Broadcast Controls
        const textInput = document.getElementById('admin-bcast-text');
        const tagSelect = document.getElementById('admin-bcast-tag-mode');
        const themeSelect = document.getElementById('admin-bcast-theme');

        document.querySelectorAll('.admin-bcast-preset').forEach(chip => {
            chip.addEventListener('click', () => {
                if (textInput) textInput.value = chip.getAttribute('data-msg') || '';
            });
        });

        const getBcastOpts = () => ({
            text: textInput ? textInput.value : '',
            tagMode: tagSelect ? tagSelect.value : 'dev',
            theme: themeSelect ? themeSelect.value : 'gold'
        });

        document.getElementById('admin-btn-preview-bcast')?.addEventListener('click', () => {
            const opts = getBcastOpts();
            if (!opts.text.trim()) { panel.showToast('Type a message to preview first.', 'warn'); return; }
            this.displayBroadcastBanner({
                id: `preview_${Date.now()}`,
                text: opts.text.trim(),
                tagMode: opts.tagMode,
                theme: opts.theme,
                senderName: opts.tagMode === 'plain' ? '' : (opts.tagMode === 'alert' ? '⚠️ SERVER ALERT' : (opts.tagMode === 'event' ? '🎉 LIVE EVENT' : '👑 DEV BROADCAST'))
            }, true);
            panel.showToast('Showing local broadcast banner preview.');
        });

        const sendBtn = document.getElementById('admin-btn-send-bcast');
        sendBtn?.addEventListener('click', async () => {
            const opts = getBcastOpts();
            if (!opts.text.trim()) { panel.showToast('Type a broadcast message first.', 'warn'); return; }
            sendBtn.disabled = true;
            const origText = sendBtn.textContent;
            sendBtn.textContent = 'SENDING...';
            try {
                const res = await this.sendGlobalBroadcast(opts);
                if (res.ok) {
                    if (textInput) textInput.value = '';
                    panel.showToast(res.sentOnline ? '📢 Broadcast sent live to all online players!' : '📢 Broadcast displayed locally (offline mode).');
                } else {
                    panel.showToast(res.error || 'Broadcast failed.', 'warn');
                }
            } finally {
                sendBtn.disabled = false;
                sendBtn.textContent = origText;
            }
        });
    }
}

if (typeof window !== 'undefined') {
    window.DevPowerTools = new DevPowerToolsService();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.DevPowerTools.initLiveBroadcastListener());
    } else {
        window.DevPowerTools.initLiveBroadcastListener();
    }
}
