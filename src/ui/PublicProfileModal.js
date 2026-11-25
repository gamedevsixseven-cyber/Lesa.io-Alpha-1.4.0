/**
 * Lesa.io - Public Player Profile Inspector Modal
 * Inspects a player's Banner, Frame, Coins, Career Stats, Equipped Gear Loadout,
 * and Weapon Collection while respecting their Private Gear & Weapons setting.
 */

class PublicProfileModal {
    static _modalEl = null;
    static _currentProfile = null;
    static _activeTab = 'overview';
    static _selectedSlot = 'weapon';
    static _selectedWeaponId = null;
    static _weaponFilter = 'all';

    static _esc(str) {
        return String(str || '').replace(/[&<>"']/g, (ch) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[ch]));
    }

    static getHeroAvatar(heroId) {
        const map = {
            psanas: 'assets/HeroesIcons/PsanasAvatar.png',
            psogas: 'assets/HeroesIcons/PsogasAvatar.png',
            petros: 'assets/HeroesIcons/PetrosAvatar.png',
            '50balos': 'assets/HeroesIcons/50balosCrop.png',
            billias: 'assets/HeroesIcons/BilliasAvatar.png',
            kitsos: 'assets/HeroesIcons/KitsosAvatar.png',
            psgiannhs: 'assets/HeroesIcons/PsgiannhsAvatar.png'
        };
        return map[heroId] || map.psanas;
    }

    static ensureMarkup() {
        if (this._modalEl && document.body.contains(this._modalEl)) return this._modalEl;
        let el = document.getElementById('public-profile-modal');
        if (!el) {
            el = document.createElement('div');
            el.id = 'public-profile-modal';
            el.className = 'modal-overlay hidden';
            document.body.appendChild(el);
            el.addEventListener('click', (e) => {
                if (e.target === el) this.hide();
            });
        }
        this._modalEl = el;
        return el;
    }

    static async open(profileSummary) {
        if (!profileSummary) return;
        const modal = this.ensureMarkup();
        const isSameTarget = this._currentProfile && profileSummary.uid && this._currentProfile.uid === profileSummary.uid;
        if (!isSameTarget) {
            this._activeTab = 'overview';
            this._selectedSlot = 'weapon';
            this._selectedWeaponId = null;
            this._weaponFilter = 'all';
        }
        let merged = { ...profileSummary };
        this._currentProfile = merged;
        this._render(merged);
        modal.classList.remove('hidden');

        const fs = (typeof window !== 'undefined') ? window.friendService : null;
        const db = fs && typeof fs.getDb === 'function' ? fs.getDb() : null;
        const ps = (typeof window !== 'undefined') ? window.presenceService : null;
        if (db && merged.uid && !merged.isLocalStub) {
            try {
                const [snap] = await Promise.all([
                    db.collection('players').doc(merged.uid).get(),
                    ps ? ps.fetchOnce([merged.uid]).catch(() => {}) : Promise.resolve()
                ]);
                if (snap && snap.exists && this._currentProfile && this._currentProfile.uid === merged.uid) {
                    const formatted = fs._formatPlayerDoc(snap.id, snap.data() || {});
                    merged = {
                        ...merged,
                        ...formatted,
                        level: Math.max(Number(merged.level) || 1, Number(formatted.level) || 1),
                        highScore: Math.max(Number(merged.highScore) || 0, Number(formatted.highScore) || 0),
                        maxWave: Math.max(Number(merged.maxWave) || 1, Number(formatted.maxWave) || 1),
                        endlessMaxWave: Math.max(Number(merged.endlessMaxWave) || 0, Number(formatted.endlessMaxWave) || 0),
                        olympusMaxFloor: Math.max(Number(merged.olympusMaxFloor) || 0, Number(formatted.olympusMaxFloor) || 0),
                        totalKills: Math.max(Number(merged.totalKills) || 0, Number(formatted.totalKills) || 0),
                        loadout: formatted.loadout || merged.loadout || null
                    };
                    this._currentProfile = merged;
                    this._render(merged);
                }
            } catch (_) {}
        }
    }

    static hide() {
        if (this._modalEl) this._modalEl.classList.add('hidden');
    }

    static _resolveLoadout(p, isSelf) {
        if (typeof PlayerLoadoutExtractor !== 'undefined') {
            if (isSelf && typeof PlayerLoadoutExtractor.getLocalSummary === 'function' && (!p.uid || p.isSelf || (window.friendService && p.uid === window.friendService.getMyUid()))) {
                return PlayerLoadoutExtractor.getLocalSummary();
            }
            if (p.loadout && typeof p.loadout === 'object') {
                if (p.loadout.isPrivate && !isSelf) {
                    return { isPrivate: true, hero: p.hero || 'psanas', starBlessed: false, weapon: null, weaponEvolved: false, gear: {}, unlockedWeapons: [], evolvedWeapons: [] };
                }
                return p.loadout;
            }
            return PlayerLoadoutExtractor.extractFromDoc(p, { isSelf });
        }
        return { isPrivate: false, hero: p.hero || 'psanas', starBlessed: false, weapon: 'pea', weaponEvolved: false, gear: {}, unlockedWeapons: ['pea'], evolvedWeapons: [] };
    }

    static _renderOverviewTab(p, cos, loadout, lockedForViewer) {
        const showcaseHtml = [0, 1, 2].map((idx) => {
            const cid = cos.coins[idx];
            if (!cid || typeof CosmeticManager === 'undefined') return `<div class="pub-coin-slot empty"><span>—</span></div>`;
            const def = CosmeticManager.getCoinDef(cid);
            return `<div class="pub-coin-slot filled rarity-${def ? def.rarity : 'common'}" title="${this._esc(def ? `${def.name}: ${def.desc}` : cid)}">${CosmeticManager.renderCoinMedallionHtml(cid, 'md', false)}<span class="pub-coin-tag">${this._esc(def ? def.shortTag : cid)}</span></div>`;
        }).join('');

        const allUnlockedCoins = Array.isArray(cos.unlockedCoins) ? cos.unlockedCoins : [];
        const vaultHtml = (allUnlockedCoins.length > 0 && typeof CosmeticManager !== 'undefined')
            ? allUnlockedCoins.map(id => CosmeticManager.renderCoinMedallionHtml(id, 'sm', false)).join('')
            : '<span class="pub-empty-note">No Milestone Coins showcased yet</span>';

        let kitText = '🔒 Gear & Weapons Private';
        if (!lockedForViewer) {
            const wReg = (typeof WEAPONS !== 'undefined' && WEAPONS) ? WEAPONS : {};
            const wName = (wReg[loadout.weapon] && wReg[loadout.weapon].name) || 'Pea Slingshot';
            const gearCount = ['helmet', 'armor', 'belt', 'gloves', 'boots'].filter(s => loadout.gear && loadout.gear[s] && loadout.gear[s].id).length;
            const wepCount = Array.isArray(loadout.unlockedWeapons) ? loadout.unlockedWeapons.length : 1;
            kitText = `🔫 ${this._esc(wName)}${loadout.weaponEvolved ? ' ★' : ''} · 🛡️ ${gearCount}/5 Gear · ${wepCount} Weapons`;
        }

        return `
            <div class="pub-section-label">🪙 SHOWCASED MILESTONE COINS</div>
            <div class="pub-showcase-row">${showcaseHtml}</div>
            <div class="pub-stats-grid">
                <div class="pub-stat-pill"><span>🏆 High Score</span><strong>${Number(p.highScore || 0).toLocaleString()}</strong></div>
                <div class="pub-stat-pill"><span>🔥 Endless Best</span><strong>Wave ${Math.max(0, Number(p.endlessMaxWave) || 0)}</strong></div>
                <div class="pub-stat-pill"><span>⚔️ Total Kills</span><strong>${Number(p.totalKills || 0).toLocaleString()}</strong></div>
                <div class="pub-stat-pill"><span>⚡ Olympus Peak</span><strong>Floor ${Number(p.olympusMaxFloor || 0)}/5</strong></div>
            </div>
            <button type="button" class="pub-quick-loadout-btn" data-pub-jump="gear">
                <span>${kitText}</span>
                <strong>INSPECT ▸</strong>
            </button>
            <div class="pub-section-label">🏅 MILESTONE COIN COLLECTION (${allUnlockedCoins.length})</div>
            <div class="pub-coin-vault">${vaultHtml}</div>
        `;
    }

    static _renderGearTab(loadout, isSelf, lockedForViewer) {
        if (lockedForViewer) {
            return `<div class="pub-private-box"><div class="pub-private-icon">🔒</div><div class="pub-private-title">PRIVATE GEAR LOADOUT</div><div class="pub-private-desc">This champion has set their equipped gear and weapon collection to private in Settings.</div></div>`;
        }
        const privBanner = (loadout.isPrivate && isSelf)
            ? `<div class="pub-self-privacy-note">🔒 Privacy Mode ON — Only you can view your equipped gear and weapon collection.</div>`
            : '';
        const heroesReg = (typeof HEROES !== 'undefined' && HEROES) ? HEROES : {};
        const heroDef = heroesReg[loadout.hero] || { name: (loadout.hero || 'PSANAS').toUpperCase() };
        const totals = (typeof PlayerLoadoutExtractor !== 'undefined') ? PlayerLoadoutExtractor.getLoadoutTotals(loadout) : {};
        const powerChips = [];
        if (totals.maxHp) powerChips.push(`+${totals.maxHp} HP`);
        if (totals.damageReduction) powerChips.push(`+${totals.damageReduction}% DEF`);
        if (totals.bulletDamage) powerChips.push(`+${totals.bulletDamage}% DMG`);
        if (totals.critChance) powerChips.push(`+${totals.critChance}% CRIT`);
        if (totals.speed) powerChips.push(`+${totals.speed}% SPD`);
        const powerHtml = powerChips.length
            ? powerChips.map(c => `<span class="pub-power-chip">${c}</span>`).join('')
            : `<span class="pub-power-chip">No Gear Equipped</span>`;

        const wReg = (typeof WEAPONS !== 'undefined' && WEAPONS) ? WEAPONS : {};
        const rawWep = wReg[loadout.weapon] || wReg.pea || { id: 'pea', name: 'Pea Slingshot', rarity: 'Common', image: 'assets/WeaponIcons/PeaSlingshot.png', baseDamage: 25, baseDelay: 16 };
        const effWep = (typeof WeaponEvolutionManager !== 'undefined')
            ? WeaponEvolutionManager.getEffectiveConfig(rawWep.id, rawWep, !!loadout.weaponEvolved, {})
            : rawWep;
        const wepRar = String(rawWep.rarity || 'Common').toLowerCase();
        const defIcons = (typeof GearModalUI !== 'undefined' && GearModalUI.SLOT_DEFAULT_ICONS) || {
            helmet: 'assets/GearUIIcons/HELMET.png', armor: 'assets/GearUIIcons/ARMOR.png',
            belt: 'assets/GearUIIcons/Belt.png', gloves: 'assets/GearUIIcons/Gloves.png', boots: 'assets/GearUIIcons/BOOTS.png'
        };

        const slots = ['weapon', 'helmet', 'armor', 'belt', 'gloves', 'boots'];
        const cardsHtml = slots.map((slot) => {
            const sel = this._selectedSlot === slot ? 'is-selected' : '';
            if (slot === 'weapon') {
                const evoBadge = loadout.weaponEvolved ? `<span class="pub-lvl-tag is-evolved">★ EVO</span>` : `<span class="pub-lvl-tag">${this._esc((rawWep.rarity || 'STD').toUpperCase())}</span>`;
                return `
                    <button type="button" class="pub-gear-card rarity-${this._esc(wepRar)} ${sel}" data-pub-slot="weapon">
                        <div class="pub-slot-top"><span class="pub-slot-tag">WEAPON</span>${evoBadge}</div>
                        <img src="${this._esc(rawWep.image || 'assets/WeaponIcons/PeaSlingshot.png')}" class="pub-gear-img" alt="${this._esc(rawWep.name)}">
                        <span class="pub-gear-name">${this._esc(rawWep.name)}</span>
                    </button>
                `;
            }
            const info = (loadout.gear && loadout.gear[slot]) || null;
            const resolved = (typeof PlayerLoadoutExtractor !== 'undefined') ? PlayerLoadoutExtractor.getSlotItemStats(info) : { item: null, stats: {}, effRarity: 'common' };
            if (!info || !resolved.item) {
                return `
                    <button type="button" class="pub-gear-card is-empty ${sel}" data-pub-slot="${slot}">
                        <div class="pub-slot-top"><span class="pub-slot-tag">${slot.toUpperCase()}</span></div>
                        <img src="${this._esc(defIcons[slot])}" class="pub-gear-img" alt="${slot}">
                        <span class="pub-gear-name">Empty ${slot}</span>
                    </button>
                `;
            }
            const item = resolved.item;
            const badgeHtml = info.evolved
                ? `<span class="pub-lvl-tag is-evolved">★ EVO</span>`
                : (info.ascended ? `<span class="pub-lvl-tag is-ascended">✦ MYTHIC</span>`
                    : (info.level > 1 ? `<span class="pub-lvl-tag">LV ${info.level}</span>` : `<span class="pub-lvl-tag">${this._esc((item.rarity || 'COM').slice(0, 4).toUpperCase())}</span>`));
            return `
                <button type="button" class="pub-gear-card rarity-${this._esc(resolved.effRarity)} ${sel}" data-pub-slot="${slot}">
                    <div class="pub-slot-top"><span class="pub-slot-tag">${slot.toUpperCase()}</span>${badgeHtml}</div>
                    <img src="${this._esc(item.iconImg || defIcons[slot])}" class="pub-gear-img" alt="${this._esc(item.name)}">
                    <span class="pub-gear-name">${this._esc(item.name)}</span>
                </button>
            `;
        }).join('');

        return `
            ${privBanner}
            <div class="pub-loadout-hero-bar">
                <div class="pub-loadout-hero-left">
                    <img src="${this._esc(this.getHeroAvatar(loadout.hero))}" alt="Hero">
                    <span>${this._esc((heroDef.name || loadout.hero || 'PSANAS').toUpperCase())}</span>
                    ${loadout.starBlessed ? '<span class="pub-star-bless-pill">★ BLESSED</span>' : ''}
                </div>
                <div class="pub-power-pills">${powerHtml}</div>
            </div>
            <div class="pub-gear-grid">${cardsHtml}</div>
            ${this._renderGearSlotInspector(loadout, rawWep, effWep)}
        `;
    }

    static _renderGearSlotInspector(loadout, rawWep, effWep) {
        const slot = this._selectedSlot || 'weapon';
        const statLabels = (typeof GearModalUI !== 'undefined' && GearModalUI.STAT_LABELS) || {
            maxHp: { label: 'Max HP', unit: '' }, speed: { label: 'Move Speed', unit: '%' },
            damageReduction: { label: 'DEF', unit: '%' }, critChance: { label: 'Crit Chance', unit: '%' },
            critDamage: { label: 'Crit DMG', unit: '%' }, fireRate: { label: 'Fire Rate', unit: '%' },
            bulletDamage: { label: 'Bullet DMG', unit: '%' }, bulletSpeed: { label: 'Velocity', unit: '%' },
            dashCooldown: { label: 'Dash CDR', unit: '%' }, magnetRadius: { label: 'Magnet', unit: '' }
        };

        if (slot === 'weapon') {
            const delaySec = ((effWep.baseDelay || 16) / 60).toFixed(2);
            const pills = [
                `<span class="pub-insp-stat">⚔️ DMG: ${effWep.baseDamage || 25}</span>`,
                `<span class="pub-insp-stat">⚡ Delay: ${delaySec}s</span>`
            ];
            if (effWep.extraPierce) pills.push(`<span class="pub-insp-stat">🎯 +${effWep.extraPierce} Pierce</span>`);
            if (effWep.maxBounces) pills.push(`<span class="pub-insp-stat">🫧 ${effWep.maxBounces} Bounces</span>`);
            if (effWep.critChanceBonus) pills.push(`<span class="pub-insp-stat">💥 +${Math.round(effWep.critChanceBonus * 100)}% Crit</span>`);
            const trait = (effWep.uiStats && effWep.uiStats.trait) ? `<div class="pub-insp-passive">✨ ${this._esc(effWep.uiStats.trait)}</div>` : '';
            return `
                <div class="pub-item-inspector">
                    <div class="pub-insp-head">
                        <span class="pub-insp-name">🔫 ${this._esc(rawWep.name)}${loadout.weaponEvolved ? ' ★ (Awakened)' : ''}</span>
                        <span class="pub-insp-rarity">${this._esc(rawWep.rarity || 'Standard')}</span>
                    </div>
                    <div class="pub-insp-stats">${pills.join('')}</div>
                    ${trait}
                </div>
            `;
        }

        const info = (loadout.gear && loadout.gear[slot]) || null;
        const resolved = (typeof PlayerLoadoutExtractor !== 'undefined') ? PlayerLoadoutExtractor.getSlotItemStats(info) : { item: null, stats: {}, effRarity: 'common' };
        if (!info || !resolved.item) {
            return `<div class="pub-item-inspector"><div class="pub-insp-head"><span class="pub-insp-name">${slot.toUpperCase()} SLOT</span><span class="pub-insp-rarity">EMPTY</span></div><div style="color:#cbd5e1;font-size:0.72rem;">No ${slot} currently equipped.</div></div>`;
        }
        const item = resolved.item;
        const pills = Object.entries(resolved.stats || {}).map(([k, v]) => {
            const def = statLabels[k];
            return `<span class="pub-insp-stat">+${v}${def ? def.unit : ''} ${this._esc(def ? def.label : k)}</span>`;
        });
        const lvlNote = info.evolved ? '★ EVOLVED' : (info.ascended ? '✦ MYTHIC ASCENDED' : `LV ${info.level || 1}`);
        const passive = item.passive ? `<div class="pub-insp-passive">✨ <b>${this._esc(item.passive.name)}:</b> ${this._esc(item.passive.desc)}</div>` : '';
        return `
            <div class="pub-item-inspector">
                <div class="pub-insp-head">
                    <span class="pub-insp-name">${this._esc(item.name)}</span>
                    <span class="pub-insp-rarity">${this._esc(resolved.effRarity)} · ${lvlNote}</span>
                </div>
                <div class="pub-insp-stats">${pills.join('')}</div>
                ${passive}
            </div>
        `;
    }

    static _renderWeaponsTab(loadout, isSelf, lockedForViewer) {
        if (lockedForViewer) {
            return `<div class="pub-private-box"><div class="pub-private-icon">🔒</div><div class="pub-private-title">PRIVATE WEAPON COLLECTION</div><div class="pub-private-desc">This champion has hidden their weapon collection in Settings.</div></div>`;
        }
        const privBanner = (loadout.isPrivate && isSelf)
            ? `<div class="pub-self-privacy-note">🔒 Privacy Mode ON — Only you can view your equipped gear and weapon collection.</div>`
            : '';

        const ownedSet = new Set(Array.isArray(loadout.unlockedWeapons) ? loadout.unlockedWeapons : ['pea']);
        const catalog = (typeof PlayerLoadoutExtractor !== 'undefined')
            ? PlayerLoadoutExtractor.getCatalogWeapons().filter(w => !w.devOnly || ownedSet.has(w.id))
            : [];
        const evolvedSet = new Set(Array.isArray(loadout.evolvedWeapons) ? loadout.evolvedWeapons : []);
        const totalCount = catalog.length;
        const ownedCount = catalog.filter(w => ownedSet.has(w.id)).length;
        const lockedCount = Math.max(0, totalCount - ownedCount);
        const pct = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0;

        const sorted = [...catalog].sort((a, b) => {
            const aEq = a.id === loadout.weapon ? 1 : 0, bEq = b.id === loadout.weapon ? 1 : 0;
            if (aEq !== bEq) return bEq - aEq;
            const aOwn = ownedSet.has(a.id) ? 1 : 0, bOwn = ownedSet.has(b.id) ? 1 : 0;
            return bOwn - aOwn;
        }).filter((w) => {
            if (this._weaponFilter === 'owned') return ownedSet.has(w.id);
            if (this._weaponFilter === 'locked') return !ownedSet.has(w.id);
            return true;
        });

        const selectedId = this._selectedWeaponId && catalog.some(w => w.id === this._selectedWeaponId)
            ? this._selectedWeaponId
            : (loadout.weapon || (sorted[0] && sorted[0].id) || 'pea');
        this._selectedWeaponId = selectedId;

        const cardsHtml = sorted.length ? sorted.map((w) => {
            const owned = ownedSet.has(w.id);
            const equipped = w.id === loadout.weapon;
            const evolved = owned && evolvedSet.has(w.id);
            const sel = w.id === selectedId ? 'is-selected' : '';
            const badge = equipped ? 'EQUIPPED' : (owned ? (w.rarity || 'STD').toUpperCase() : `🔒 ${w.sourceText}`);
            return `
                <button type="button" class="pub-wep-card rarity-${this._esc(w.rarityKey)} ${owned ? '' : 'is-locked'} ${equipped ? 'is-equipped' : ''} ${sel}" data-pub-wep="${this._esc(w.id)}">
                    ${evolved ? '<span class="pub-wep-evo">★</span>' : ''}
                    <img src="${this._esc(w.image || 'assets/WeaponIcons/PeaSlingshot.png')}" class="pub-wep-img" alt="${this._esc(w.name)}">
                    <span class="pub-wep-name">${this._esc(w.name)}</span>
                    <span class="pub-wep-badge">${this._esc(badge)}</span>
                </button>
            `;
        }).join('') : `<div class="pub-empty-note" style="grid-column:1 / -1;padding:10px;text-align:center;">No weapons match this filter.</div>`;

        const inspWep = catalog.find(w => w.id === selectedId) || catalog[0] || null;
        let inspHtml = '';
        if (inspWep) {
            const isOwn = ownedSet.has(inspWep.id), isEvo = isOwn && evolvedSet.has(inspWep.id);
            const cfg = (typeof WeaponEvolutionManager !== 'undefined') ? WeaponEvolutionManager.getEffectiveConfig(inspWep.id, inspWep, isEvo, {}) : inspWep;
            const delaySec = ((cfg.baseDelay || 16) / 60).toFixed(2);
            inspHtml = `
                <div class="pub-item-inspector">
                    <div class="pub-insp-head">
                        <span class="pub-insp-name">${isOwn ? '✅' : '🔒'} ${this._esc(inspWep.name)}${isEvo ? ' ★ (Awakened)' : ''}</span>
                        <span class="pub-insp-rarity">${this._esc(inspWep.rarity || 'Standard')} · ${this._esc(inspWep.sourceText)}</span>
                    </div>
                    <div class="pub-insp-stats">
                        <span class="pub-insp-stat">⚔️ DMG: ${cfg.baseDamage || 25}</span>
                        <span class="pub-insp-stat">⚡ Delay: ${delaySec}s</span>
                        ${cfg.extraPierce ? `<span class="pub-insp-stat">🎯 +${cfg.extraPierce} Pierce</span>` : ''}
                        ${cfg.maxBounces ? `<span class="pub-insp-stat">🫧 ${cfg.maxBounces} Bounces</span>` : ''}
                        ${cfg.critChanceBonus ? `<span class="pub-insp-stat">💥 +${Math.round(cfg.critChanceBonus * 100)}% Crit</span>` : ''}
                    </div>
                    ${cfg.uiStats && cfg.uiStats.trait ? `<div class="pub-insp-passive">✨ ${this._esc(cfg.uiStats.trait)}</div>` : ''}
                </div>
            `;
        }

        return `
            ${privBanner}
            <div class="pub-wep-toolbar">
                <span class="pub-wep-count">🔫 COLLECTION: ${ownedCount} / ${totalCount} (${pct}%)</span>
                <div class="pub-wep-filters">
                    <button type="button" class="pub-wep-fbtn ${this._weaponFilter === 'all' ? 'active' : ''}" data-wep-filter="all">ALL (${totalCount})</button>
                    <button type="button" class="pub-wep-fbtn ${this._weaponFilter === 'owned' ? 'active' : ''}" data-wep-filter="owned">OWNED (${ownedCount})</button>
                    <button type="button" class="pub-wep-fbtn ${this._weaponFilter === 'locked' ? 'active' : ''}" data-wep-filter="locked">LOCKED (${lockedCount})</button>
                </div>
            </div>
            <div class="pub-wep-prog"><div class="pub-wep-prog-fill" style="width:${pct}%"></div></div>
            <div class="pub-wep-grid">${cardsHtml}</div>
            ${inspHtml}
        `;
    }

    static _render(p) {
        const modal = this.ensureMarkup();
        const cos = (typeof CosmeticManager !== 'undefined')
            ? CosmeticManager.extractPublicCosmetics({ cosmetics: p.cosmetics || p, battlePass: p.battlePass, player: p.player, hasVipPass: p.hasVipPass })
            : { banner: 'banner_recruit', frame: 'frame_rookie', coins: [], unlockedCoins: [], hasVipPass: false };

        const bannerDef = (typeof CosmeticManager !== 'undefined') ? CosmeticManager.getBannerDef(cos.banner) : { name: 'Arena Rookie', cssClass: 'cos-banner-recruit', rarity: 'common' };
        const frameDef = (typeof CosmeticManager !== 'undefined') ? CosmeticManager.getFrameDef(cos.frame) : { name: 'Classic Ink', cssClass: 'cos-frame-rookie', rarity: 'common' };

        const fs = (typeof window !== 'undefined') ? window.friendService : null;
        const isSelf = !fs || !p.uid || p.isLocalStub || p.uid === fs.getMyUid();
        const loadout = this._resolveLoadout(p, isSelf);
        const lockedForViewer = Boolean(loadout.isPrivate && !isSelf);
        const ownedSetHead = new Set(Array.isArray(loadout.unlockedWeapons) ? loadout.unlockedWeapons : ['pea']);
        const ownedWepCount = ownedSetHead.size;
        const totalWepCount = (typeof PlayerLoadoutExtractor !== 'undefined')
            ? PlayerLoadoutExtractor.getCatalogWeapons().filter(w => !w.devOnly || ownedSetHead.has(w.id)).length
            : 26;

        const hasVipPass = Boolean(cos.hasVipPass || (isSelf && typeof CosmeticManager !== 'undefined' && CosmeticManager.hasLocalVipPass()));
        const vipTagHtml = hasVipPass ? `<div class="pub-cosmetic-tags"><span class="pub-vip-pass-tag">👑 VIP PASS</span></div>` : '';
        const rel = (fs && p.uid && !p.isLocalStub) ? fs.getRelationState(p.uid) : { state: 'self' };
        const friendLastOnline = (!p.isOnline && rel.state === 'accepted' && typeof FriendsCardRenderer !== 'undefined' && typeof FriendsCardRenderer.formatLastOnline === 'function')
            ? FriendsCardRenderer.formatLastOnline(p.lastSeenAt) : '';
        const statusChipText = p.isOnline ? `● ${this._esc(p.currentStatus || 'Online')}` : (friendLastOnline ? `● Offline · ${this._esc(friendLastOnline)}` : '● Offline');

        let socialBtnHtml = '';
        if (rel.state === 'none') socialBtnHtml = `<button type="button" id="pub-prof-add-friend" class="comic-btn comic-btn-primary pub-social-btn">+ ADD FRIEND</button>`;
        else if (rel.state === 'pending_outgoing') socialBtnHtml = `<button type="button" class="comic-btn pub-social-btn" disabled>⏳ REQUEST SENT</button>`;
        else if (rel.state === 'pending_incoming') socialBtnHtml = `<button type="button" id="pub-prof-accept-friend" class="comic-btn comic-btn-primary pub-social-btn">✓ ACCEPT FRIEND</button>`;
        else if (rel.state === 'accepted' && fs) {
            socialBtnHtml = p.coopRoomCode
                ? `<button type="button" id="pub-prof-join-coop" class="comic-btn comic-btn-primary pub-social-btn">🚀 JOIN CO-OP</button>`
                : (p.isOnline ? `<button type="button" id="pub-prof-invite-coop" class="comic-btn comic-btn-primary pub-social-btn">⚔️ INVITE CO-OP</button>` : '');
        }

        let bodyHtml = '';
        if (this._activeTab === 'gear') bodyHtml = this._renderGearTab(loadout, isSelf, lockedForViewer);
        else if (this._activeTab === 'weapons') bodyHtml = this._renderWeaponsTab(loadout, isSelf, lockedForViewer);
        else bodyHtml = this._renderOverviewTab(p, cos, loadout, lockedForViewer);

        modal.innerHTML = `
            <div class="modal-panel pub-profile-panel">
                <button type="button" id="pub-profile-x" class="modal-close-x-btn" title="Close (Esc)" aria-label="Close">✕</button>
                <div class="pub-banner-hero ${bannerDef.cssClass}">
                    <div class="pub-avatar-wrap ${frameDef.cssClass}">
                        <img src="${this.getHeroAvatar(p.hero || p.selectedHero)}" alt="Avatar">
                    </div>
                    <div class="pub-ident-col">
                        <div class="pub-name-row">
                            ${p.clanTag ? `<span class="clan-inline-tag">[${this._esc(p.clanTag)}]</span>` : ''}
                            <span class="pub-name">${this._esc(p.name || 'Hero')}</span>
                            <span class="player-level-badge">LVL ${Number(p.level || 1)}</span>
                        </div>
                        <div class="pub-meta-row">
                            <span class="pub-tag-chip">${this._esc(p.tag || '#HERO00')}</span>
                            <span class="pub-status-chip ${p.isOnline ? 'online' : ''}">${statusChipText}</span>
                        </div>
                        ${vipTagHtml}
                    </div>
                </div>

                <div class="pub-tabs-bar">
                    <button type="button" class="pub-tab-btn ${this._activeTab === 'overview' ? 'active' : ''}" data-pub-tab="overview">📊 PROFILE</button>
                    <button type="button" class="pub-tab-btn ${this._activeTab === 'gear' ? 'active' : ''}" data-pub-tab="gear">🛡️ GEAR${lockedForViewer ? ' 🔒' : ''}</button>
                    <button type="button" class="pub-tab-btn ${this._activeTab === 'weapons' ? 'active' : ''}" data-pub-tab="weapons">🔫 WEAPONS${lockedForViewer ? ' 🔒' : ` (${ownedWepCount}/${totalWepCount})`}</button>
                </div>

                <div id="pub-tab-body">${bodyHtml}</div>

                <div class="modal-actions pub-actions-row">
                    ${socialBtnHtml}
                    <button type="button" id="pub-profile-close" class="comic-btn">CLOSE</button>
                </div>
            </div>
        `;

        modal.querySelector('#pub-profile-x')?.addEventListener('click', () => { if (window.soundEngine) window.soundEngine.playGoBack(); this.hide(); });
        modal.querySelector('#pub-profile-close')?.addEventListener('click', () => { if (window.soundEngine) window.soundEngine.playGoBack(); this.hide(); });
        modal.querySelectorAll('[data-pub-tab]').forEach(btn => btn.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playSelect();
            this._activeTab = btn.dataset.pubTab || 'overview';
            this._render(this._currentProfile);
        }));
        modal.querySelectorAll('[data-pub-jump]').forEach(btn => btn.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playSelect();
            this._activeTab = btn.dataset.pubJump || 'gear';
            this._render(this._currentProfile);
        }));
        modal.querySelectorAll('[data-pub-slot]').forEach(btn => btn.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playSelect();
            this._selectedSlot = btn.dataset.pubSlot || 'weapon';
            this._render(this._currentProfile);
        }));
        modal.querySelectorAll('[data-pub-wep]').forEach(btn => btn.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playSelect();
            this._selectedWeaponId = btn.dataset.pubWep;
            this._render(this._currentProfile);
        }));
        modal.querySelectorAll('[data-wep-filter]').forEach(btn => btn.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playSelect();
            this._weaponFilter = btn.dataset.wepFilter || 'all';
            this._render(this._currentProfile);
        }));
        modal.querySelector('#pub-prof-add-friend')?.addEventListener('click', async (e) => {
            e.currentTarget.disabled = true;
            const resp = await fs.sendFriendRequest(p);
            if (window.modalManager && resp && resp.message) window.modalManager.showQuickToast(resp.message, 1800);
            this._render(this._currentProfile);
        });
        modal.querySelector('#pub-prof-accept-friend')?.addEventListener('click', async (e) => {
            e.currentTarget.disabled = true;
            await fs.acceptFriendRequest(rel.id);
            this._render(this._currentProfile);
        });
        modal.querySelector('#pub-prof-join-coop')?.addEventListener('click', () => {
            this.hide();
            if (window.friendsModal) window.friendsModal.joinRoomCode(p.coopRoomCode);
        });
        modal.querySelector('#pub-prof-invite-coop')?.addEventListener('click', () => {
            this.hide();
            if (window.friendsModal) window.friendsModal.inviteFriendToCoop(p.uid, p.name);
        });
        if (typeof CosmeticEffectsEngine !== 'undefined') {
            CosmeticEffectsEngine.decorateContainer(modal);
            CosmeticEffectsEngine.bindHoloCards(modal);
        }
    }
}

if (typeof window !== 'undefined') window.PublicProfileModal = PublicProfileModal;
if (typeof module !== 'undefined' && module.exports) module.exports = { PublicProfileModal };
