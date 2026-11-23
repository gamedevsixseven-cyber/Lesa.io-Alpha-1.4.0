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
        this._loading = false;
        this._error = '';
        this._fetchSeq = 0;
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
            this.refresh();
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
        this.refresh();
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

        return {
            uid: (me && me.uid) || (typeof PlayerIdentity !== 'undefined' ? PlayerIdentity.getOrCreateProfileId() : 'local_player'),
            name: (me && me.name) || p.name || localStorage.getItem('lesaio_player_name') || 'Hero',
            tag: (me && me.tag) || (typeof PlayerIdentity !== 'undefined' ? PlayerIdentity.getOnlineTag() : '#HERO00'),
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
            isSelf: true,
            isLocalStub: !(fs && typeof fs.getDb === 'function' && fs.getDb())
        };
    }

    async refresh() {
        const seq = ++this._fetchSeq;
        this._loading = true;
        this._error = '';
        this.render();

        const fs = window.friendService;
        const db = (fs && typeof fs.getDb === 'function') ? fs.getDb() : null;
        if (db && fs && typeof fs.syncMyProfile === 'function') {
            await Promise.race([
                fs.syncMyProfile(true).catch(() => false),
                new Promise((resolve) => setTimeout(resolve, 900))
            ]);
            if (seq !== this._fetchSeq) return;
        }

        const byUid = new Map();
        const selfEntry = this._buildLocalEntry();
        byUid.set(selfEntry.uid, selfEntry);

        if (db) {
            try {
                const queries = [
                    db.collection('players').orderBy('lbHighScore', 'desc').limit(30).get().catch(() => null),
                    db.collection('players').orderBy('lbEndlessWave', 'desc').limit(30).get().catch(() => null),
                    db.collection('players').orderBy('lbTotalKills', 'desc').limit(30).get().catch(() => null),
                    db.collection('players').orderBy('lastSeenAt', 'desc').limit(35).get().catch(() => null)
                ];
                const snaps = await Promise.all(queries);
                if (seq !== this._fetchSeq) return;
                snaps.forEach((snap) => {
                    if (!snap || typeof snap.forEach !== 'function') return;
                    snap.forEach((doc) => {
                        const formatted = fs._formatPlayerDoc(doc.id, doc.data() || {});
                        if (formatted.uid === selfEntry.uid) {
                            byUid.set(formatted.uid, {
                                ...formatted,
                                ...selfEntry,
                                level: Math.max(Number(formatted.level) || 1, Number(selfEntry.level) || 1),
                                highScore: Math.max(Number(formatted.highScore) || 0, Number(selfEntry.highScore) || 0),
                                maxWave: Math.max(Number(formatted.maxWave) || 1, Number(selfEntry.maxWave) || 1),
                                endlessMaxWave: Math.max(Number(formatted.endlessMaxWave) || 0, Number(selfEntry.endlessMaxWave) || 0, Number(formatted.maxWave) || 1, Number(selfEntry.maxWave) || 1),
                                olympusMaxFloor: Math.max(Number(formatted.olympusMaxFloor) || 0, Number(selfEntry.olympusMaxFloor) || 0),
                                totalKills: Math.max(Number(formatted.totalKills) || 0, Number(selfEntry.totalKills) || 0),
                                isLocalStub: false
                            });
                        } else {
                            byUid.set(formatted.uid, formatted);
                        }
                    });
                });
            } catch (e) {
                this._error = e && e.message ? e.message : 'Unable to fetch global rankings.';
            }
        }

        if (seq !== this._fetchSeq) return;
        this._rows = Array.from(byUid.values());
        this._loading = false;
        this.render();
    }

    _getMetricValue(entry) {
        if (!entry) return 0;
        if (this._activeTab === 'endless') {
            return Math.max(Number(entry.endlessMaxWave) || 0, Number(entry.maxWave) || 0, 1);
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

        const sorted = [...this._rows]
            .sort((a, b) => (
                (this._getMetricValue(b) - this._getMetricValue(a))
                || ((Number(b.highScore) || 0) - (Number(a.highScore) || 0))
                || ((Number(b.totalKills) || 0) - (Number(a.totalKills) || 0))
            ))
            .slice(0, 25);

        if (sorted.length === 0) {
            box.innerHTML = `<div class="lb-empty-state">No ranked champions recorded yet.</div>`;
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
                </button>
            `;
        }).join('');

        box.innerHTML = noteHtml + rowsHtml;
        if (typeof CosmeticEffectsEngine !== 'undefined') {
            CosmeticEffectsEngine.decorateContainer(box);
            CosmeticEffectsEngine.bindHoloCards(box);
        }
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
