/**
 * Lesa.io - Public Player Profile Inspector Modal
 * Lets any player inspect another champion's equipped Banner, Avatar Frame,
 * showcased Milestone Coins, full Milestone Coin Vault, and Career Stats.
 */

class PublicProfileModal {
    static _modalEl = null;
    static _currentProfile = null;

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
            kitsos: 'assets/HeroesIcons/KitsosAvatar.png'
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
        let merged = { ...profileSummary };
        this._currentProfile = merged;
        this._render(merged);
        modal.classList.remove('hidden');

        // Refresh full Firestore record if available so friends & leaderboard rows show the latest cosmetics/coins
        const fs = (typeof window !== 'undefined') ? window.friendService : null;
        const db = fs && typeof fs.getDb === 'function' ? fs.getDb() : null;
        if (db && merged.uid && !merged.isLocalStub) {
            try {
                const snap = await db.collection('players').doc(merged.uid).get();
                if (snap && snap.exists && this._currentProfile && this._currentProfile.uid === merged.uid) {
                    const formatted = fs._formatPlayerDoc(snap.id, snap.data() || {});
                    merged = { ...merged, ...formatted };
                    this._currentProfile = merged;
                    this._render(merged);
                }
            } catch (_) {}
        }
    }

    static hide() {
        if (this._modalEl) {
            this._modalEl.classList.add('hidden');
        }
    }

    static _render(p) {
        const modal = this.ensureMarkup();
        const cos = (typeof CosmeticManager !== 'undefined')
            ? CosmeticManager.extractPublicCosmetics({ cosmetics: p.cosmetics || p })
            : { banner: 'banner_recruit', frame: 'frame_rookie', coins: [], unlockedCoins: [] };

        const bannerDef = (typeof CosmeticManager !== 'undefined') ? CosmeticManager.getBannerDef(cos.banner) : { name: 'Arena Rookie', cssClass: 'cos-banner-recruit', rarity: 'common' };
        const frameDef = (typeof CosmeticManager !== 'undefined') ? CosmeticManager.getFrameDef(cos.frame) : { name: 'Classic Ink', cssClass: 'cos-frame-rookie', rarity: 'common' };

        const showcaseHtml = [0, 1, 2].map((idx) => {
            const cid = cos.coins[idx];
            if (!cid || typeof CosmeticManager === 'undefined') {
                return `<div class="pub-coin-slot empty"><span>—</span></div>`;
            }
            const def = CosmeticManager.getCoinDef(cid);
            return `
                <div class="pub-coin-slot filled rarity-${def ? def.rarity : 'common'}" title="${this._esc(def ? `${def.name}: ${def.desc}` : cid)}">
                    ${CosmeticManager.renderCoinMedallionHtml(cid, 'md', false)}
                    <span class="pub-coin-tag">${this._esc(def ? def.shortTag : cid)}</span>
                </div>
            `;
        }).join('');

        const allUnlockedCoins = Array.isArray(cos.unlockedCoins) ? cos.unlockedCoins : [];
        const vaultHtml = (allUnlockedCoins.length > 0 && typeof CosmeticManager !== 'undefined')
            ? allUnlockedCoins.map(id => CosmeticManager.renderCoinMedallionHtml(id, 'sm', false)).join('')
            : '<span class="pub-empty-note">No Milestone Coins showcased yet</span>';

        const fs = (typeof window !== 'undefined') ? window.friendService : null;
        const rel = (fs && p.uid && !p.isLocalStub) ? fs.getRelationState(p.uid) : { state: 'self' };
        let socialBtnHtml = '';
        if (rel.state === 'none') {
            socialBtnHtml = `<button type="button" id="pub-prof-add-friend" class="comic-btn comic-btn-primary pub-social-btn">+ ADD FRIEND</button>`;
        } else if (rel.state === 'pending_outgoing') {
            socialBtnHtml = `<button type="button" class="comic-btn pub-social-btn" disabled>⏳ REQUEST SENT</button>`;
        } else if (rel.state === 'pending_incoming') {
            socialBtnHtml = `<button type="button" id="pub-prof-accept-friend" class="comic-btn comic-btn-primary pub-social-btn">✓ ACCEPT FRIEND</button>`;
        } else if (rel.state === 'accepted' && fs) {
            socialBtnHtml = p.coopRoomCode
                ? `<button type="button" id="pub-prof-join-coop" class="comic-btn comic-btn-primary pub-social-btn">🚀 JOIN CO-OP</button>`
                : (p.isOnline ? `<button type="button" id="pub-prof-invite-coop" class="comic-btn comic-btn-primary pub-social-btn">⚔️ INVITE CO-OP</button>` : '');
        }

        modal.innerHTML = `
            <div class="modal-panel pub-profile-panel">
                <button type="button" id="pub-profile-x" class="modal-close-x-btn" title="Close (Esc)" aria-label="Close">✕</button>
                <div class="pub-banner-hero ${bannerDef.cssClass}">
                    <div class="pub-avatar-wrap ${frameDef.cssClass}">
                        <img src="${this.getHeroAvatar(p.hero || p.selectedHero)}" alt="Avatar">
                    </div>
                    <div class="pub-ident-col">
                        <div class="pub-name-row">
                            <span class="pub-name">${this._esc(p.name || 'Hero')}</span>
                            <span class="player-level-badge">LVL ${Number(p.level || 1)}</span>
                        </div>
                        <div class="pub-meta-row">
                            <span class="pub-tag-chip">${this._esc(p.tag || '#HERO00')}</span>
                            <span class="pub-status-chip ${p.isOnline ? 'online' : ''}">${p.isOnline ? '● ' + this._esc(p.currentStatus || 'Online') : '● Offline'}</span>
                        </div>
                        <div class="pub-cosmetic-tags">
                            <span>🏴 ${this._esc(bannerDef.name)}</span>
                            <span>🖼️ ${this._esc(frameDef.name)}</span>
                        </div>
                    </div>
                </div>

                <div class="pub-section-label">🪙 SHOWCASED MILESTONE COINS</div>
                <div class="pub-showcase-row">${showcaseHtml}</div>

                <div class="pub-stats-grid">
                    <div class="pub-stat-pill"><span>🏆 High Score</span><strong>${Number(p.highScore || 0).toLocaleString()}</strong></div>
                    <div class="pub-stat-pill"><span>🔥 Endless Best</span><strong>Wave ${Number(p.endlessMaxWave || p.maxWave || 1)}</strong></div>
                    <div class="pub-stat-pill"><span>⚔️ Total Kills</span><strong>${Number(p.totalKills || 0).toLocaleString()}</strong></div>
                    <div class="pub-stat-pill"><span>⚡ Olympus Peak</span><strong>Floor ${Number(p.olympusMaxFloor || 0)}/5</strong></div>
                </div>

                <div class="pub-section-label">🏅 MILESTONE COIN COLLECTION (${allUnlockedCoins.length})</div>
                <div class="pub-coin-vault">${vaultHtml}</div>

                <div class="modal-actions pub-actions-row">
                    ${socialBtnHtml}
                    <button type="button" id="pub-profile-close" class="comic-btn">CLOSE</button>
                </div>
            </div>
        `;

        modal.querySelector('#pub-profile-x')?.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playGoBack();
            this.hide();
        });
        modal.querySelector('#pub-profile-close')?.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playGoBack();
            this.hide();
        });
        modal.querySelector('#pub-prof-add-friend')?.addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            btn.disabled = true;
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
    }
}

if (typeof window !== 'undefined') {
    window.PublicProfileModal = PublicProfileModal;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PublicProfileModal };
}
