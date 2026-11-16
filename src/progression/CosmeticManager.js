/**
 * Lesa.io - Profile Cosmetics & Milestone Coins Manager
 * Evaluates milestone/feat unlocks, persists equipped banner/frame/pinned coins,
 * and provides shared rendering/serialization helpers across Menu, Profile, Friends & Leaderboards.
 */

class CosmeticManager {
    static STORAGE_KEYS = {
        equippedBanner: 'lesaio_equipped_banner',
        equippedFrame: 'lesaio_equipped_frame',
        displayedCoins: 'lesaio_displayed_coins',
        unlockedBanners: 'lesaio_unlocked_banners',
        unlockedFrames: 'lesaio_unlocked_frames',
        unlockedCoins: 'lesaio_unlocked_coins'
    };

    static MAX_DISPLAY_COINS = 3;
    static DEFAULT_BANNER = 'banner_recruit';
    static DEFAULT_FRAME = 'frame_rookie';

    static _bannerClasses() {
        return (typeof PROFILE_BANNERS !== 'undefined' ? PROFILE_BANNERS : []).map(b => b.cssClass);
    }

    static _frameClasses() {
        return (typeof PROFILE_FRAMES !== 'undefined' ? PROFILE_FRAMES : []).map(f => f.cssClass);
    }

    static getBannerDef(id) {
        const list = (typeof PROFILE_BANNERS !== 'undefined') ? PROFILE_BANNERS : [];
        return list.find(b => b.id === id) || list[0] || { id: this.DEFAULT_BANNER, name: 'Arena Rookie', rarity: 'common', cssClass: 'cos-banner-recruit' };
    }

    static getFrameDef(id) {
        const list = (typeof PROFILE_FRAMES !== 'undefined') ? PROFILE_FRAMES : [];
        return list.find(f => f.id === id) || list[0] || { id: this.DEFAULT_FRAME, name: 'Classic Ink', rarity: 'common', cssClass: 'cos-frame-rookie' };
    }

    static getCoinDef(id) {
        const list = (typeof MILESTONE_COINS !== 'undefined') ? MILESTONE_COINS : [];
        return list.find(c => c.id === id) || null;
    }

    static getRarityMeta(rarity) {
        const map = (typeof COSMETIC_RARITIES !== 'undefined') ? COSMETIC_RARITIES : {};
        return map[rarity] || map.common || { key: 'common', label: 'STARTER', rank: 1, color: '#94a3b8' };
    }

    static _readJson(key, fallback) {
        if (typeof localStorage === 'undefined') return fallback;
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (_) {
            return fallback;
        }
    }

    static _writeJson(key, val) {
        if (typeof localStorage === 'undefined') return;
        try { localStorage.setItem(key, JSON.stringify(val)); } catch (_) {}
    }

    static getState() {
        const gs = (typeof window !== 'undefined' && window.GameState && window.GameState.player) ? window.GameState.player : null;
        const c = (gs && gs.cosmetics) || {};
        const validBannerIds = new Set((typeof PROFILE_BANNERS !== 'undefined' ? PROFILE_BANNERS : []).map(b => b.id));
        const validFrameIds = new Set((typeof PROFILE_FRAMES !== 'undefined' ? PROFILE_FRAMES : []).map(f => f.id));
        const validCoinIds = new Set((typeof MILESTONE_COINS !== 'undefined' ? MILESTONE_COINS : []).map(x => x.id));

        const unlockedBanners = Array.from(new Set([
            this.DEFAULT_BANNER,
            ...(Array.isArray(c.unlockedBanners) ? c.unlockedBanners : this._readJson(this.STORAGE_KEYS.unlockedBanners, []))
        ])).filter(id => validBannerIds.has(id));

        const unlockedFrames = Array.from(new Set([
            this.DEFAULT_FRAME,
            ...(Array.isArray(c.unlockedFrames) ? c.unlockedFrames : this._readJson(this.STORAGE_KEYS.unlockedFrames, []))
        ])).filter(id => validFrameIds.has(id));

        const unlockedCoins = Array.from(new Set(
            Array.isArray(c.unlockedCoins) ? c.unlockedCoins : this._readJson(this.STORAGE_KEYS.unlockedCoins, [])
        )).filter(id => validCoinIds.has(id));

        let equippedBanner = c.equippedBanner || (typeof localStorage !== 'undefined' ? localStorage.getItem(this.STORAGE_KEYS.equippedBanner) : null) || this.DEFAULT_BANNER;
        if (!unlockedBanners.includes(equippedBanner)) equippedBanner = this.DEFAULT_BANNER;

        let equippedFrame = c.equippedFrame || (typeof localStorage !== 'undefined' ? localStorage.getItem(this.STORAGE_KEYS.equippedFrame) : null) || this.DEFAULT_FRAME;
        if (!unlockedFrames.includes(equippedFrame)) equippedFrame = this.DEFAULT_FRAME;

        const rawDisp = Array.isArray(c.displayedCoins) ? c.displayedCoins : this._readJson(this.STORAGE_KEYS.displayedCoins, []);
        const displayedCoins = Array.from(new Set(rawDisp))
            .filter(id => unlockedCoins.includes(id))
            .slice(0, this.MAX_DISPLAY_COINS);

        return { equippedBanner, equippedFrame, displayedCoins, unlockedBanners, unlockedFrames, unlockedCoins };
    }

    static saveState(nextState, syncRemote = false) {
        const clean = {
            equippedBanner: nextState.equippedBanner || this.DEFAULT_BANNER,
            equippedFrame: nextState.equippedFrame || this.DEFAULT_FRAME,
            displayedCoins: Array.isArray(nextState.displayedCoins) ? nextState.displayedCoins.slice(0, this.MAX_DISPLAY_COINS) : [],
            unlockedBanners: Array.from(new Set([this.DEFAULT_BANNER, ...(nextState.unlockedBanners || [])])),
            unlockedFrames: Array.from(new Set([this.DEFAULT_FRAME, ...(nextState.unlockedFrames || [])])),
            unlockedCoins: Array.from(new Set(nextState.unlockedCoins || []))
        };
        if (typeof window !== 'undefined' && window.GameState && window.GameState.player) {
            window.GameState.player.cosmetics = clean;
        }
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(this.STORAGE_KEYS.equippedBanner, clean.equippedBanner);
            localStorage.setItem(this.STORAGE_KEYS.equippedFrame, clean.equippedFrame);
        }
        this._writeJson(this.STORAGE_KEYS.displayedCoins, clean.displayedCoins);
        this._writeJson(this.STORAGE_KEYS.unlockedBanners, clean.unlockedBanners);
        this._writeJson(this.STORAGE_KEYS.unlockedFrames, clean.unlockedFrames);
        this._writeJson(this.STORAGE_KEYS.unlockedCoins, clean.unlockedCoins);

        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.emit('cosmeticsUpdated', { cosmetics: clean });
        }
        if (syncRemote) {
            if (typeof window !== 'undefined' && window.SaveManager && typeof window.SaveManager.save === 'function') {
                window.SaveManager.save();
            }
            if (typeof window !== 'undefined' && window.friendService && typeof window.friendService.syncMyProfile === 'function') {
                window.friendService.syncMyProfile(true);
            }
        }
        return clean;
    }

    static getProgressSnapshot(gameState = null) {
        const gs = gameState || (typeof window !== 'undefined' ? window.GameState : null);
        const p = (gs && gs.player) ? gs.player : {};
        const stats = p.stats || {};
        const featSnap = (typeof PerkProgression !== 'undefined' && typeof PerkProgression.getFeatSnapshot === 'function')
            ? PerkProgression.getFeatSnapshot(gs)
            : (p.combatFeats || {});

        return {
            storyMaxWave: Math.max(1, featSnap.storyMaxWave || 1),
            endlessMaxWave: Math.max(0, featSnap.endlessMaxWave || 0),
            olympusMaxFloor: Math.max(0, featSnap.olympusMaxFloor || 0),
            defeatedBosses: { ...(featSnap.defeatedBosses || {}) },
            endlessMiniBossKills: featSnap.endlessMiniBossKills || 0,
            maxWave: stats.maxWave || parseInt(typeof localStorage !== 'undefined' ? (localStorage.getItem('lesaio_max_wave') || '1') : '1', 10) || 1,
            totalKills: stats.totalKills || parseInt(typeof localStorage !== 'undefined' ? (localStorage.getItem('lesaio_total_kills') || '0') : '0', 10) || 0,
            highScore: stats.highScore || parseInt(typeof localStorage !== 'undefined' ? (localStorage.getItem('lesaio_highscore') || '0') : '0', 10) || 0,
            matchesPlayed: stats.matchesPlayed || featSnap.matchesPlayed || parseInt(typeof localStorage !== 'undefined' ? (localStorage.getItem('lesaio_matches_played') || '0') : '0', 10) || 0,
            accountLevel: p.accountLevel || parseInt(typeof localStorage !== 'undefined' ? (localStorage.getItem('lesaio_account_level') || '1') : '1', 10) || 1,
            olympianStarStones: p.olympianStarStones || parseInt(typeof localStorage !== 'undefined' ? (localStorage.getItem('lesaio_olympian_star_stones') || '0') : '0', 10) || 0,
            unlockedHeroesCount: Array.isArray(p.unlockedHeroes) ? p.unlockedHeroes.length : 1
        };
    }

    static syncUnlocks(options = {}) {
        const { silent = false, autoPin = true, syncRemote = false } = options;
        const snap = this.getProgressSnapshot();
        const cur = this.getState();

        const newlyUnlocked = [];
        const checkCatalog = (catalog, ownedList, kind) => {
            const set = new Set(ownedList);
            for (const item of catalog) {
                if (!set.has(item.id) && typeof item.isUnlocked === 'function' && item.isUnlocked(snap)) {
                    set.add(item.id);
                    newlyUnlocked.push({ kind, item });
                }
            }
            return Array.from(set);
        };

        const unlockedBanners = checkCatalog(typeof PROFILE_BANNERS !== 'undefined' ? PROFILE_BANNERS : [], cur.unlockedBanners, 'banner');
        const unlockedFrames = checkCatalog(typeof PROFILE_FRAMES !== 'undefined' ? PROFILE_FRAMES : [], cur.unlockedFrames, 'frame');
        const unlockedCoins = checkCatalog(typeof MILESTONE_COINS !== 'undefined' ? MILESTONE_COINS : [], cur.unlockedCoins, 'coin');

        const changed = unlockedBanners.length !== cur.unlockedBanners.length
            || unlockedFrames.length !== cur.unlockedFrames.length
            || unlockedCoins.length !== cur.unlockedCoins.length;

        const displayedCoins = [...cur.displayedCoins];
        if (autoPin && displayedCoins.length < this.MAX_DISPLAY_COINS && unlockedCoins.length > 0) {
            const rankOf = (cid) => this.getRarityMeta((this.getCoinDef(cid) || {}).rarity).rank || 0;
            const candidates = unlockedCoins
                .filter(id => !displayedCoins.includes(id))
                .sort((a, b) => rankOf(b) - rankOf(a));
            while (displayedCoins.length < this.MAX_DISPLAY_COINS && candidates.length > 0) {
                displayedCoins.push(candidates.shift());
            }
        }

        if (changed || displayedCoins.length !== cur.displayedCoins.length) {
            this.saveState({
                ...cur,
                unlockedBanners,
                unlockedFrames,
                unlockedCoins,
                displayedCoins
            }, syncRemote);

            if (!silent && newlyUnlocked.length > 0 && typeof window !== 'undefined' && window.modalManager && typeof window.modalManager.showQuickToast === 'function') {
                const top = newlyUnlocked.sort((a, b) => this.getRarityMeta(b.item.rarity).rank - this.getRarityMeta(a.item.rarity).rank)[0];
                const kindLabel = top.kind === 'banner' ? 'Banner' : (top.kind === 'frame' ? 'Frame' : 'Milestone Coin');
                const extra = newlyUnlocked.length > 1 ? ` (+${newlyUnlocked.length - 1} more)` : '';
                window.modalManager.showQuickToast(`🏅 Unlocked ${kindLabel}: ${top.item.name}!${extra}`, 2800);
            }
        }
        return { newlyUnlocked, state: this.getState(), snap };
    }

    static equipBanner(bannerId) {
        const st = this.getState();
        if (!st.unlockedBanners.includes(bannerId)) return false;
        this.saveState({ ...st, equippedBanner: bannerId }, true);
        return true;
    }

    static equipFrame(frameId) {
        const st = this.getState();
        if (!st.unlockedFrames.includes(frameId)) return false;
        this.saveState({ ...st, equippedFrame: frameId }, true);
        return true;
    }

    static toggleDisplayCoin(coinId) {
        const st = this.getState();
        if (!st.unlockedCoins.includes(coinId)) return { ok: false, reason: 'Locked coin' };
        let next = [...st.displayedCoins];
        if (next.includes(coinId)) {
            next = next.filter(id => id !== coinId);
        } else {
            if (next.length >= this.MAX_DISPLAY_COINS) {
                return { ok: false, reason: `Max ${this.MAX_DISPLAY_COINS} Milestone Coins can be showcased at once! Click a pinned coin to swap.` };
            }
            next.push(coinId);
        }
        this.saveState({ ...st, displayedCoins: next }, true);
        return { ok: true, displayedCoins: next };
    }

    static getPublicSummary() {
        const st = this.getState();
        const snap = this.getProgressSnapshot();
        return {
            banner: st.equippedBanner,
            frame: st.equippedFrame,
            coins: st.displayedCoins,
            unlockedCoins: st.unlockedCoins,
            unlockedBannersCount: st.unlockedBanners.length,
            unlockedFramesCount: st.unlockedFrames.length,
            unlockedCoinsCount: st.unlockedCoins.length,
            endlessMaxWave: snap.endlessMaxWave,
            olympusMaxFloor: snap.olympusMaxFloor,
            zeusKills: (snap.defeatedBosses && snap.defeatedBosses.zeus) || 0,
            olympianStarStones: snap.olympianStarStones || 0
        };
    }

    static extractPublicCosmetics(docData = {}) {
        const p = docData.player || {};
        const raw = docData.cosmetics || p.cosmetics || {};
        const coins = Array.isArray(raw.coins)
            ? raw.coins
            : (Array.isArray(raw.displayedCoins) ? raw.displayedCoins : []);
        const unlockedCoins = Array.isArray(raw.unlockedCoins) ? raw.unlockedCoins : coins;
        return {
            banner: raw.banner || raw.equippedBanner || this.DEFAULT_BANNER,
            frame: raw.frame || raw.equippedFrame || this.DEFAULT_FRAME,
            coins: coins.slice(0, this.MAX_DISPLAY_COINS),
            unlockedCoins,
            unlockedCoinsCount: typeof raw.unlockedCoinsCount === 'number' ? raw.unlockedCoinsCount : unlockedCoins.length
        };
    }

    static applyBannerClass(el, bannerId) {
        if (!el) return;
        for (const cls of this._bannerClasses()) el.classList.remove(cls);
        el.classList.add(this.getBannerDef(bannerId).cssClass);
    }

    static applyFrameClass(el, frameId) {
        if (!el) return;
        for (const cls of this._frameClasses()) el.classList.remove(cls);
        el.classList.add(this.getFrameDef(frameId).cssClass);
    }

    static _coinGlyphSvg(glyph) {
        const stroke = 'rgba(255,255,255,0.95)';
        const map = {
            sword: `<path d="M9 15l6-6m-1-3l3 3m-8 4l-2 2 2 2 2-2" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
            fist: `<path d="M8 12V9a1 1 0 012 0v2m0-2.5a1 1 0 012 0V11m0-2a1 1 0 012 0v2.5m0-1a1 1 0 012 0V14a4 4 0 01-4 4h-1a4 4 0 01-3-1.4L8 14z" stroke="${stroke}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
            crown: `<path d="M6 16h12l1-7-4 3-3-5-3 5-4-3z" fill="${stroke}"/>`,
            flame: `<path d="M12.5 5c1 3 4 4.2 4 8a4.5 4.5 0 11-9 0c0-2.2 1.2-3.9 2.4-5.1.3 1.4 1.3 2 2.1 2.2-.3-1.7.1-3.6.5-5.1z" fill="${stroke}"/>`,
            mecha: `<path d="M7 9l2-2h6l2 2v5l-2 3H9l-2-3zm2.5 2.5h2v2h-2zm3 0h2v2h-2z" fill="${stroke}"/>`,
            bolt: `<path d="M13 5L7.5 13H12l-1 6 5.5-8H12z" fill="${stroke}"/>`,
            skull: `<circle cx="12" cy="11" r="4.5" fill="${stroke}"/><circle cx="10.4" cy="11" r="1" fill="#111"/><circle cx="13.6" cy="11" r="1" fill="#111"/><path d="M10 15.2v2m2-2v2m2-2v2" stroke="${stroke}" stroke-width="1.5" stroke-linecap="round"/>`,
            shield: `<path d="M12 5l6 2.3v4.4c0 3.7-2.6 6.2-6 7.3-3.4-1.1-6-3.6-6-7.3V7.3z" fill="none" stroke="${stroke}" stroke-width="2"/>`,
            infinity: `<path d="M8.5 14.5c-1.7 0-2.8-1.1-2.8-2.5S6.8 9.5 8.5 9.5c2 0 5 5 7 5 1.7 0 2.8-1.1 2.8-2.5s-1.1-2.5-2.8-2.5c-2 0-5 5-7 5z" fill="none" stroke="${stroke}" stroke-width="2"/>`,
            trident: `<path d="M12 5v14m0-14l-2 2.5m2-2.5l2 2.5M8 7.5v3a4 4 0 008 0v-3" fill="none" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
            star: `<path d="M12 5l2.1 4.4 4.9.7-3.5 3.4.8 4.8L12 16l-4.3 2.3.8-4.8L5 10.1l4.9-.7z" fill="${stroke}"/>`
        };
        return map[glyph] || map.star;
    }

    static renderCoinMedallionHtml(coinOrId, sizeClass = 'sm', locked = false) {
        const coin = (typeof coinOrId === 'string') ? this.getCoinDef(coinOrId) : coinOrId;
        if (!coin) return '';
        const rar = this.getRarityMeta(coin.rarity);
        const title = `${coin.name} [${rar.label}] — ${coin.desc}`;
        return `
            <span class="cos-coin cos-coin-${sizeClass} rarity-${coin.rarity} ${locked ? 'is-locked' : ''}"
                  style="--coin-rim:${coin.rim}; --coin-core:${coin.core};"
                  title="${title.replace(/"/g, '&quot;')}">
                <svg viewBox="0 0 24 24" class="cos-coin-svg" aria-hidden="true">
                    <circle cx="12" cy="12" r="10.2" fill="${coin.core}" stroke="${coin.rim}" stroke-width="2.2"/>
                    <circle cx="12" cy="12" r="7.5" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="1" stroke-dasharray="2 1.5"/>
                    ${this._coinGlyphSvg(coin.glyph)}
                </svg>
            </span>
        `;
    }

    static renderPinnedCoinsHtml(coinIds = [], sizeClass = 'xs') {
        if (!Array.isArray(coinIds) || coinIds.length === 0) return '';
        return coinIds.slice(0, this.MAX_DISPLAY_COINS)
            .map(id => this.renderCoinMedallionHtml(id, sizeClass, false))
            .join('');
    }
}

if (typeof window !== 'undefined') {
    window.CosmeticManager = CosmeticManager;
    if (window.EventBus) {
        const resync = () => CosmeticManager.syncUnlocks({ silent: false, syncRemote: false });
        window.EventBus.on('combatFeatsUpdated', resync);
        window.EventBus.on('statsUpdated', resync);
        window.EventBus.on('accountXpChanged', resync);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CosmeticManager };
}
