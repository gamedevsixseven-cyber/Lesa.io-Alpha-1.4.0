/**
 * Lesa.io - Global Leaderboards Modal
 * Displays High Score, Endless Wave & Total Kills rankings with player Banners,
 * Avatar Frames, and pinned Milestone Coins. Clicking any player inspects their public profile.
 */

class LeaderboardModal {
    constructor() {
        this._modal = null;
        this._activeTab = 'score';
        this._rows = [];
        this._cachedRows = null;
        this._cacheAt = 0;
        this._loading = false;
        this._error = '';
        this._fetchSeq = 0;
        this._showHiddenDev = false;
    }

    _esc(str) {
        return String(str || '').replace(/[&<>"']/g, (ch) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[ch]));
    }

    _getHeroAvatar(heroId) {
        if (typeof PublicProfileModal !== 'undefined') {
            return PublicProfileModal.getHeroAvatar(heroId);
        }
        return 'assets/HeroesIcons/PsanasAvatar.png';
    }

    _ensureMarkup() {
        if (this._modal && document.body.contains(this._modal)) return this._modal;
        let el = document.getElementById('leaderboard-modal');
        if (!el) {
            el = document.createElement('div');
            el.id = 'leaderboard-modal';
            el.className = 'modal-overlay hidden';
            el.innerHTML = `
                <div class="modal-panel lb-modal-panel">
                    <button type="button" id="lb-close-x" class="modal-close-x-btn" title="Close (Esc)" aria-label="Close">✕</button>
                    <h2 class="lb-modal-title">🏆 GLOBAL LEADERBOARDS</h2>
                    <p class="lb-modal-sub">Tap any champion row to inspect their Banner, Frame &amp; Milestone Coins</p>
                    <div class="lb-tabs-row" id="lb-tabs-row">
                        <button type="button" class="lb-tab-btn active" data-lb-tab="score">🏆 HIGH SCORE</button>
                        <button type="button" class="lb-tab-btn" data-lb-tab="endless">🔥 ENDLESS WAVE</button>
                        <button type="button" class="lb-tab-btn" data-lb-tab="kills">⚔️ TOTAL KILLS</button>
                    </div>
                    <div class="leaderboard-list-box" id="lb-list-box"></div>
                    <div class="modal-actions lb-actions-row">
                        <button type="button" id="lb-refresh-btn" class="comic-btn">↻ REFRESH</button>
                        <button type="button" id="lb-close-btn" class="comic-btn comic-btn-primary">CLOSE</button>
                    </div>
                </div>
            `;
            document.body.appendChild(el);
            this._bindEvents(el);
        }
        this._modal = el;
        return el;
    }

    _bindEvents(el) {
        el.addEventListener('click', (e) => {
            if (e.target === el) this.hide();
        });
        el.querySelector('#lb-close-x')?.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playGoBack();
            this.hide();
        });
        el.querySelector('#lb-close-btn')?.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playGoBack();
            this.hide();
        });
        el.querySelector('#lb-refresh-btn')?.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playSelect();
            this.refresh(true);
        });
        el.querySelectorAll('[data-lb-tab]').forEach((btn) => {
            btn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                this._activeTab = btn.dataset.lbTab || 'score';
                el.querySelectorAll('[data-lb-tab]').forEach((b) => {
                    b.classList.toggle('active', b.dataset.lbTab === this._activeTab);
                });
                this.render();
            });
        });
    }

    show() {
        const el = this._ensureMarkup();
        if (typeof CosmeticManager !== 'undefined') {
            CosmeticManager.syncUnlocks({ silent: true, syncRemote: false });
        }
        el.classList.remove('hidden');
        this.refresh(false);
    }

    hide() {
        if (this._modal) {
            this._modal.classList.add('hidden');
        }
    }

    _buildLocalEntry() {
        const fs = window.friendService;
        const gs = window.GameState;
        const p = (gs && gs.player) || {};
        const stats = p.stats || {};
        const me = (fs && typeof fs.getMySummary === 'function') ? fs.getMySummary() : null;
        const snap = (typeof CosmeticManager !== 'undefined') ? CosmeticManager.getProgressSnapshot(gs) : {};
        const cos = (typeof CosmeticManager !== 'undefined') ? CosmeticManager.getPublicSummary() : {};

        const cl = (typeof window !== 'undefined' && window.clanService && window.clanService.currentClan) || null;
        return {
            uid: (me && me.uid) || (typeof PlayerIdentity !== 'undefined' ? PlayerIdentity.getOrCreateProfileId() : 'local_player'),
            name: (me && me.name) || p.name || localStorage.getItem('lesaio_player_name') || 'Hero',
            tag: (me && me.tag) || (typeof PlayerIdentity !== 'undefined' ? PlayerIdentity.getOnlineTag() : '#HERO00'),
            clanTag: (me && me.clanTag) || (cl ? cl.tag : null), clanName: (me && me.clanName) || (cl ? cl.name : null),
            level: (me && me.level) || p.accountLevel || 1,
            hero: (me && me.selectedHero) || p.selectedHero || 'psanas',
            isOnline: true,
            currentStatus: 'In Lobby',
            highScore: Math.max((me && me.highScore) || 0, stats.highScore || 0),
            maxWave: Math.max((me && me.maxWave) || 1, stats.maxWave || 1),
            endlessMaxWave: Math.max((me && me.endlessMaxWave) || 0, snap.endlessMaxWave || 0),
            olympusMaxFloor: Math.max((me && me.olympusMaxFloor) || 0, snap.olympusMaxFloor || 0),
            totalKills: Math.max((me && me.totalKills) || 0, stats.totalKills || 0),
            cosmetics: cos,
            loadout: (typeof PlayerLoadoutExtractor !== 'undefined') ? PlayerLoadoutExtractor.getLocalSummary() : null,
            isSelf: true,
            isLocalStub: !(fs && typeof fs.getDb === 'function' && fs.getDb())
        };
    }

    async refresh(force = false) {
        const seq = ++this._fetchSeq;
        const ps = (typeof window !== 'undefined') ? window.presenceService : null;
        const selfEntry = this._buildLocalEntry();
        if (!force && this._cachedRows && (Date.now() - this._cacheAt < 300000)) {
            this._loading = false;
            this._error = '';
            if (ps) await ps.fetchOnce(this._cachedRows.map(r => r.uid).filter(Boolean)).catch(() => { });
            if (seq !== this._fetchSeq) return;
            this._rows = this._cachedRows.map((r) => {
                if (r.isSelf) return { ...r, ...selfEntry, isSelf: true, isLocalStub: false };
                if (ps && typeof PresenceService !== 'undefined') {
                    const p = PresenceService.resolve(r.uid, r, ps.cache);
                    return { ...r, isOnline: p.isOnline, lastSeenAt: Math.max(Number(r.lastSeenAt) || 0, p.lastSeenAt || 0), currentStatus: p.currentStatus };
                }
                return r;
            });
            this.render();
            return;
        }
        this._loading = true;
        this._error = '';
        this.render();

        const fs = window.friendService;
        const db = (fs && typeof fs.getDb === 'function') ? fs.getDb() : null;
        if (db && fs && typeof fs.syncMyProfile === 'function') {
            await Promise.race([
                fs.syncMyProfile(false).catch(() => false),
                new Promise((resolve) => setTimeout(resolve, 900))
            ]);
            if (seq !== this._fetchSeq) return;
        }

        const byUid = new Map();
        const isPrimaryDev = !!(window.AdminAuth && typeof window.AdminAuth.isPrimaryDevUser === 'function' && window.AdminAuth.isPrimaryDevUser());
        byUid.set(selfEntry.uid, selfEntry);
        const edge = (typeof window !== 'undefined' && window.edgeApi && window.edgeApi.isEnabled()) ? window.edgeApi : null;
        const edgeUids = new Set();
        const mergeEntry = (raw) => {
            const f = fs._formatPlayerDoc(raw.uid || raw.id, raw);
            const isSelf = (f.uid === selfEntry.uid);
            const cur = byUid.get(f.uid);
            byUid.set(f.uid, {
                ...(cur || {}), ...f, ...(isSelf ? selfEntry : {}),
                level: Math.max(Number(f.level) || 1, Number(cur && cur.level) || 1),
                highScore: Math.max(Number(f.highScore) || 0, Number(cur && cur.highScore) || 0),
                maxWave: Math.max(Number(f.maxWave) || 1, Number(cur && cur.maxWave) || 1),
                endlessMaxWave: Math.max(Number(f.endlessMaxWave) || 0, Number(cur && cur.endlessMaxWave) || 0),
                olympusMaxFloor: Math.max(Number(f.olympusMaxFloor) || 0, Number(cur && cur.olympusMaxFloor) || 0),
                totalKills: Math.max(Number(f.totalKills) || 0, Number(cur && cur.totalKills) || 0),
                ...(isSelf ? { isSelf: true, isLocalStub: false } : {})
            });
        };
        let edgeFull = false;
        if (edge && fs) {
            const er = await edge.get('/leaderboard').catch(() => null);
            if (er && !er.fallback && er.ok && Array.isArray(er.players)) {
                er.players.forEach((raw) => {
                    const pid = raw.uid || raw.id;
                    if (pid) edgeUids.add(pid);
                    mergeEntry(raw);
                });
                if (er.players.length >= 25) edgeFull = true;
            }
        }

        if (!edgeFull && db && fs) {
            try {
                const queries = [
                    db.collection('players').orderBy('lbHighScore', 'desc').limit(35).get().catch(() => null),
                    db.collection('players').orderBy('lbEndlessWave', 'desc').limit(35).get().catch(() => null),
                    db.collection('players').orderBy('lbTotalKills', 'desc').limit(35).get().catch(() => null),
                    db.collection('players').orderBy('lastSeenAt', 'desc').limit(40).get().catch(() => null)
                ];
                const snaps = await Promise.all(queries);
                if (seq !== this._fetchSeq) return;
                snaps.forEach((snap) => {
                    if (!snap || typeof snap.forEach !== 'function') return;
                    snap.forEach((doc) => {
                        const raw = doc.data() || {};
                        const isGuestDoc = /^(phone|player|user|playtest)_/.test(doc.id);

                        // Auto-heal guest device documents that were locked by a legacy 'email' field in Firestore
                        if (isPrimaryDev && isGuestDoc && ('email' in raw || (doc.id === 'phone_aabwjk_mwrtealt' && raw.playerName === 'Popo'))) {
                            const fixPayload = {};
                            if ('email' in raw && typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) {
                                fixPayload.email = firebase.firestore.FieldValue.delete();
                            }
                            if (doc.id === 'phone_aabwjk_mwrtealt' && (!raw.playerName || raw.playerName === 'Popo')) {
                                fixPayload.playerName = 'PsanasIphone';
                                fixPayload.playerNameLower = 'psanasiphone';
                                fixPayload['player.name'] = 'PsanasIphone';
                                raw.playerName = 'PsanasIphone';
                                if (raw.player && typeof raw.player === 'object') raw.player.name = 'PsanasIphone';
                            }
                            if (Object.keys(fixPayload).length > 0) {
                                doc.ref.update(fixPayload).catch(() => { });
                            }
                        }

                        const formatted = fs._formatPlayerDoc(raw.uid || doc.id, raw);
                        const isSelfDoc = (doc.id === selfEntry.uid) || (formatted.uid === selfEntry.uid);
                        if (edge && !edgeUids.has(formatted.uid) && (formatted.highScore > 0 || formatted.level > 1)) {
                            edgeUids.add(formatted.uid);
                            edge.post(`/player/${encodeURIComponent(formatted.uid)}`, { ...raw, uid: formatted.uid }).catch(() => { });
                        }
                        if ((isSelfDoc || (isPrimaryDev && isGuestDoc)) && typeof raw.lbEndlessWave === 'number' && raw.lbEndlessWave !== formatted.endlessMaxWave) {
                            doc.ref.update({ lbEndlessWave: formatted.endlessMaxWave, 'socialStats.endlessMaxWave': formatted.endlessMaxWave }).catch(() => { });
                        }

                        if (isSelfDoc) {
                            const curSelf = byUid.get(selfEntry.uid) || selfEntry;
                            byUid.set(selfEntry.uid, {
                                ...formatted,
                                ...curSelf,
                                uid: selfEntry.uid,
                                name: selfEntry.name,
                                tag: selfEntry.tag,
                                level: Math.max(Number(formatted.level) || 1, Number(curSelf.level) || 1),
                                highScore: Math.max(Number(formatted.highScore) || 0, Number(curSelf.highScore) || 0),
                                maxWave: Math.max(Number(formatted.maxWave) || 1, Number(curSelf.maxWave) || 1),
                                endlessMaxWave: Math.max(Number(formatted.endlessMaxWave) || 0, Number(curSelf.endlessMaxWave) || 0),
                                olympusMaxFloor: Math.max(Number(formatted.olympusMaxFloor) || 0, Number(curSelf.olympusMaxFloor) || 0),
                                totalKills: Math.max(Number(formatted.totalKills) || 0, Number(curSelf.totalKills) || 0),
                                isSelf: true,
                                isLocalStub: false
                            });
                        } else {
                            const existing = byUid.get(formatted.uid);
                            if (existing) {
                                const newer = (Number(formatted.lastSeenAt) || 0) >= (Number(existing.lastSeenAt) || 0);
                                const base = newer ? existing : formatted;
                                const top = newer ? formatted : existing;
                                byUid.set(formatted.uid, {
                                    ...base,
                                    ...top,
                                    name: (!formatted._isUnnamedGhost && (newer || existing._isUnnamedGhost)) ? formatted.name : existing.name,
                                    hero: (raw.selectedHero || (raw.player && raw.player.selectedHero)) ? (newer ? formatted.hero : existing.hero) : existing.hero,
                                    cosmetics: (raw.cosmetics || (raw.player && raw.player.cosmetics)) ? (newer ? formatted.cosmetics : existing.cosmetics) : existing.cosmetics,
                                    loadout: (raw.publicLoadout || (raw.player && raw.player.selectedWeapon)) ? (newer ? formatted.loadout : existing.loadout) : existing.loadout,
                                    level: Math.max(Number(formatted.level) || 1, Number(existing.level) || 1),
                                    highScore: Math.max(Number(formatted.highScore) || 0, Number(existing.highScore) || 0),
                                    maxWave: Math.max(Number(formatted.maxWave) || 1, Number(existing.maxWave) || 1),
                                    endlessMaxWave: Math.max(Number(formatted.endlessMaxWave) || 0, Number(existing.endlessMaxWave) || 0),
                                    olympusMaxFloor: Math.max(Number(formatted.olympusMaxFloor) || 0, Number(existing.olympusMaxFloor) || 0),
                                    totalKills: Math.max(Number(formatted.totalKills) || 0, Number(existing.totalKills) || 0)
                                });
                            } else {
                                byUid.set(formatted.uid, formatted);
                            }
                        }
                    });
                });
            } catch (e) {
                this._error = e && e.message ? e.message : 'Unable to fetch global rankings.';
            }
        }

        if (seq !== this._fetchSeq) return;
        const rows = Array.from(byUid.values()).filter((r) => (
            r && (r.isSelf || !r._isUnnamedGhost || r.highScore > 0 || r.totalKills > 0 || r.endlessMaxWave > 0 || r.level > 1)
        ));
        if (ps && typeof PresenceService !== 'undefined') {
            await ps.fetchOnce(rows.map(r => r.uid).filter(Boolean)).catch(() => { });
            if (seq !== this._fetchSeq) return;
            rows.forEach((r) => {
                if (r.isSelf) return;
                const p = PresenceService.resolve(r.uid, r, ps.cache);
                r.isOnline = p.isOnline;
                r.lastSeenAt = Math.max(Number(r.lastSeenAt) || 0, p.lastSeenAt || 0);
                r.currentStatus = p.currentStatus;
            });
        }
        this._rows = rows;
        this._cachedRows = rows;
        this._cacheAt = Date.now();
        this._loading = false;
        this.render();
    }

    _getMetricValue(entry) {
        if (!entry) return 0;
        if (this._activeTab === 'endless') {
            return Math.max(0, Number(entry.endlessMaxWave) || 0);
        }
        if (this._activeTab === 'kills') {
            return Number(entry.totalKills) || 0;
        }
        return Number(entry.highScore) || 0;
    }

    _formatMetricLabel(entry) {
        const val = this._getMetricValue(entry);
        if (this._activeTab === 'endless') return `Wave ${val}`;
        if (this._activeTab === 'kills') return `${val.toLocaleString()} Kills`;
        return val.toLocaleString();
    }

    render() {
        const el = this._ensureMarkup();
        const box = el.querySelector('#lb-list-box');
        const refreshBtn = el.querySelector('#lb-refresh-btn');
        if (refreshBtn) {
            refreshBtn.disabled = !!this._loading;
            refreshBtn.textContent = this._loading ? '↻ SYNCING...' : '↻ REFRESH';
        }
        if (!box) return;

        if (this._loading && this._rows.length === 0) {
            box.innerHTML = `<div class="lb-empty-state">⏳ Loading global champions...</div>`;
            return;
        }

        const isPrimaryDev = !!(typeof window !== 'undefined' && window.AdminAuth && typeof window.AdminAuth.isPrimaryDevUser === 'function' && window.AdminAuth.isPrimaryDevUser());
        const hiddenCount = this._rows.filter(r => r && r.leaderboardHidden).length;
        if (hiddenCount === 0) this._showHiddenDev = false;
        const devBarHtml = isPrimaryDev && (hiddenCount > 0 || this._showHiddenDev) ? `
            <div class="lb-dev-filter-bar">
                <span>🛡️ Dev Filter: ${this._showHiddenDev ? `Hidden Accounts (${hiddenCount})` : `Live Rankings (${hiddenCount} hidden)`}</span>
                <button type="button" id="lb-dev-toggle-hidden" class="lb-dev-hide-btn ${this._showHiddenDev ? 'is-restore' : ''}">${this._showHiddenDev ? '◀ LIVE LB' : `👁️ SHOW HIDDEN (${hiddenCount})`}</button>
            </div>` : '';

        const sorted = this._rows
            .filter(r => r && (this._showHiddenDev ? !!r.leaderboardHidden : !r.leaderboardHidden))
            .sort((a, b) => (
                (this._getMetricValue(b) - this._getMetricValue(a))
                || ((Number(b.highScore) || 0) - (Number(a.highScore) || 0))
                || ((Number(b.totalKills) || 0) - (Number(a.totalKills) || 0))
            ))
            .slice(0, 25);

        if (sorted.length === 0) {
            box.innerHTML = devBarHtml + `<div class="lb-empty-state">${this._showHiddenDev ? 'No hidden accounts.' : 'No ranked champions recorded yet.'}</div>`;
            box.querySelector('#lb-dev-toggle-hidden')?.addEventListener('click', () => { this._showHiddenDev = !this._showHiddenDev; this.render(); });
            return;
        }

        const noteHtml = this._error
            ? `<div class="lb-warn-banner">Showing local profile (${this._esc(this._error)})</div>`
            : '';

        const rowsHtml = sorted.map((entry, idx) => {
            const rank = idx + 1;
            const rankClass = rank <= 3 ? `rank-top-${rank}` : '';
            const cos = (typeof CosmeticManager !== 'undefined')
                ? CosmeticManager.extractPublicCosmetics({ cosmetics: entry.cosmetics || entry })
                : { banner: 'banner_recruit', frame: 'frame_rookie', coins: [] };
            const bannerDef = (typeof CosmeticManager !== 'undefined')
                ? CosmeticManager.getBannerDef(cos.banner)
                : { cssClass: 'cos-banner-recruit', rarity: 'common' };
            const frameDef = (typeof CosmeticManager !== 'undefined')
                ? CosmeticManager.getFrameDef(cos.frame)
                : { cssClass: 'cos-frame-rookie' };
            const coinsHtml = (typeof CosmeticManager !== 'undefined' && cos.coins.length > 0)
                ? `<div class="lb-coins-strip">${CosmeticManager.renderPinnedCoinsHtml(cos.coins, 'xs')}</div>`
                : '';

            return `
                <button type="button" class="lb-item cos-banner-surface ${bannerDef.cssClass} ${entry.isSelf ? 'is-self' : ''}" data-lb-idx="${idx}" title="Inspect ${this._esc(entry.name)}'s Profile">
                    <div class="lb-rank-badge ${rankClass}">#${rank}</div>
                    <div class="lb-avatar-wrap ${frameDef.cssClass}">
                        <img src="${this._getHeroAvatar(entry.hero)}" alt="Hero" loading="lazy" decoding="async">
                        ${entry.isOnline ? '<span class="lb-online-dot"></span>' : ''}
                    </div>
                    <div class="lb-main-info">
                        <div class="lb-name-row">
                            ${entry.clanTag ? `<span class="clan-inline-tag">[${this._esc(entry.clanTag)}]</span>` : ''}
                            <span class="lb-player-name">${this._esc(entry.name)}</span>
                            ${entry.isSelf ? '<span class="lb-you-pill">YOU</span>' : ''}
                            <span class="lb-tag-chip">${this._esc(entry.tag || '#HERO00')}</span>
                            <span class="lb-lvl-chip">LVL ${Number(entry.level || 1)}</span>
                        </div>
                        ${coinsHtml}
                    </div>
                    <div class="lb-score-col">
                        <span class="lb-score-val">${this._formatMetricLabel(entry)}</span>
                        <span class="lb-inspect-hint">VIEW ▸</span>
                    </div>
                    ${isPrimaryDev ? `<button type="button" class="lb-dev-hide-btn ${entry.leaderboardHidden ? 'is-restore' : ''}" data-lb-dev-idx="${idx}" title="${entry.leaderboardHidden ? 'Restore to Leaderboard' : 'Remove from Leaderboard'}">${entry.leaderboardHidden ? '👁️ SHOW' : '✕'}</button>` : ''}
                </button>
            `;
        }).join('');

        box.innerHTML = noteHtml + devBarHtml + rowsHtml;
        if (typeof CosmeticEffectsEngine !== 'undefined') {
            CosmeticEffectsEngine.decorateContainer(box);
            CosmeticEffectsEngine.bindHoloCards(box);
        }
        box.querySelector('#lb-dev-toggle-hidden')?.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playSelect();
            this._showHiddenDev = !this._showHiddenDev;
            this.render();
        });
        box.querySelectorAll('[data-lb-dev-idx]').forEach((devBtn) => {
            devBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const entry = sorted[parseInt(devBtn.dataset.lbDevIdx || '-1', 10)];
                if (!entry || !window.DevAccountManager) return;
                const nextHidden = !entry.leaderboardHidden;
                if (nextHidden && !confirm(`Remove "${entry.name}" (${entry.tag}) from Global Leaderboards?\n(Their account save stays intact.)`)) return;
                devBtn.disabled = true;
                try {
                    await window.DevAccountManager.setLeaderboardVisibility(entry, nextHidden);
                } catch (err) {
                    devBtn.disabled = false;
                    alert(err.message || 'Failed to update leaderboard visibility.');
                }
            });
        });
        box.querySelectorAll('[data-lb-idx]').forEach((rowBtn) => {
            rowBtn.addEventListener('click', () => {
                const idx = parseInt(rowBtn.dataset.lbIdx || '-1', 10);
                const entry = sorted[idx];
                if (entry && typeof PublicProfileModal !== 'undefined') {
                    if (window.soundEngine) window.soundEngine.playSelect();
                    PublicProfileModal.open(entry);
                }
            });
        });
    }
}

if (typeof window !== 'undefined') {
    window.LeaderboardModal = LeaderboardModal;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LeaderboardModal };
}
