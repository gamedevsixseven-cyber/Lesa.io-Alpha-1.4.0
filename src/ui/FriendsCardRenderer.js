/**
 * Lesa.io - Friends & Squad Card View Renderer
 * Renders My Online Card cosmetics, Friend list cards, Requests/Co-op Invites,
 * and Player Discovery search cards cleanly while keeping FriendsModal focused on state & events.
 */

const FRIEND_HERO_AVATARS = {
    psanas: 'assets/HeroesIcons/PsanasAvatar.png',
    psogas: 'assets/HeroesIcons/PsogasAvatar.png',
    petros: 'assets/HeroesIcons/PetrosAvatar.png',
    '50balos': 'assets/HeroesIcons/50balosCrop.png',
    billias: 'assets/HeroesIcons/BilliasAvatar.png',
    kitsos: 'assets/HeroesIcons/KitsosAvatar.png',
    psgiannhs: 'assets/HeroesIcons/PsgiannhsAvatar.png'
};

class FriendsCardRenderer {
    static esc(str) {
        return String(str == null ? '' : str).replace(/[&<>"']/g, (ch) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[ch]));
    }

    static getHeroAvatar(heroId) {
        return FRIEND_HERO_AVATARS[heroId] || FRIEND_HERO_AVATARS.psanas;
    }

    static _ico(name, fallback) {
        return (typeof UiIcons !== 'undefined') ? UiIcons.i(name, 'ui-icon-sm') : fallback;
    }

    static buildModalMarkup() {
        const pplIcon = typeof UiIcons !== 'undefined' ? UiIcons.i('people', 'ui-icon-title') : '👥';
        const pplSm = typeof UiIcons !== 'undefined' ? UiIcons.i('people', 'ui-icon-sm') : '👥';
        const bellIcon = typeof UiIcons !== 'undefined' ? UiIcons.i('bell', 'ui-icon-sm') : '🔔';
        const plusIcon = typeof UiIcons !== 'undefined' ? UiIcons.i('plus', 'ui-icon-sm') : '➕';
        const copyIcon = typeof UiIcons !== 'undefined' ? UiIcons.i('copy', 'ui-icon-sm') : '📋';
        return `
            <div class="friends-panel">
                <div class="friends-header">
                    <div class="friends-title-cluster">
                        <h2 class="friends-title">${pplIcon} FRIENDS &amp; SQUAD</h2>
                        <span id="friends-online-pill" class="friends-online-pill">● 0 ONLINE</span>
                    </div>
                    <div class="friends-header-right">
                        <button type="button" id="friends-refresh-btn" class="friends-icon-btn" title="Refresh Online Status">🔄 SYNC</button>
                        <button type="button" id="friends-close-btn" class="modal-close-x-btn friends-close-x" title="Close (Esc)" aria-label="Close">✕</button>
                    </div>
                </div>
                <div id="friends-id-banner" class="friends-id-banner">
                    <div class="friends-id-meta">
                        <div id="friends-my-avatar-wrap" class="friend-avatar-wrap">
                            <img id="friends-my-avatar" class="friends-id-avatar" src="assets/HeroesIcons/PsanasAvatar.png" alt="My Hero">
                            <span class="friend-presence-dot online"></span>
                        </div>
                        <div class="friends-my-info">
                            <div class="friends-my-top">
                                <span id="friends-my-name" class="friends-id-name">Hero</span>
                                <span id="friends-my-tag" class="friends-id-code">#------</span>
                            </div>
                            <div id="friends-my-coins" class="friend-coins-strip hidden"></div>
                            <div class="friends-id-sub">Share your Name or #ID so friends can squad up</div>
                        </div>
                    </div>
                    <div class="friends-id-tag-row">
                        <button type="button" id="friends-my-profile-btn" class="friends-card-btn">👤 MY CARD</button>
                        <button type="button" id="friends-copy-tag-btn" class="friends-copy-btn">${copyIcon} COPY ID</button>
                    </div>
                </div>
                <div class="friends-tabs">
                    <button type="button" id="ftab-friends" class="friends-tab-btn active">${pplSm} FRIENDS (0)</button>
                    <button type="button" id="ftab-requests" class="friends-tab-btn">${bellIcon} REQUESTS (0)</button>
                    <button type="button" id="ftab-add" class="friends-tab-btn">${plusIcon} ADD FRIEND</button>
                </div>
                <div id="friends-feedback-bar" class="friends-feedback hidden"></div>
                <div id="friends-modal-body" class="friends-body"></div>
            </div>
        `;
    }

    static buildInviteToastHtml(invite) {
        const rocket = this._ico('rocket', '🚀');
        return `
            <img class="toast-inv-avatar" src="${this.getHeroAvatar(invite.fromHero)}" alt="Hero">
            <div class="toast-inv-copy">
                <div class="toast-inv-title">🤝 <b>${this.esc(invite.fromName)}</b> invited you!</div>
                <div class="toast-inv-sub">${this.esc((invite.gameMode || 'story').toUpperCase())} CO-OP · ROOM <b>${this.esc(invite.roomCode)}</b></div>
            </div>
            <button id="toast-join-coop-btn" class="friend-btn friend-btn-join">${rocket} JOIN</button>
            <button id="toast-dismiss-coop-btn" class="friend-btn friend-btn-muted">✕</button>
        `;
    }

    static buildFriendReqToastHtml(req) {
        const p = (req && req.profile) || {};
        const bell = this._ico('bell', '🔔');
        return `
            <img class="toast-inv-avatar" src="${this.getHeroAvatar(p.hero)}" alt="Hero">
            <div class="toast-inv-copy">
                <div class="toast-inv-title">${bell} <b>${this.esc(p.name || 'Hero')}</b> sent you a friend request!</div>
                <div class="toast-inv-sub">${this.esc(p.tag || '')} · LVL ${Number(p.level || 1)}</div>
            </div>
            <button id="toast-accept-req-btn" class="friend-btn friend-btn-accept">✓ ACCEPT</button>
            <button id="toast-view-req-btn" class="friend-btn friend-btn-primary">VIEW</button>
            <button id="toast-dismiss-req-btn" class="friend-btn friend-btn-muted">✕</button>
        `;
    }

    static decorateMyBanner(me, bannerEl, avatarWrapEl, coinsEl) {
        if (!me || !bannerEl || typeof CosmeticManager === 'undefined') return;
        const cos = CosmeticManager.extractPublicCosmetics({ cosmetics: me.cosmetics || {} });
        CosmeticManager.applyBannerClass(bannerEl, cos.banner);
        if (avatarWrapEl) CosmeticManager.applyFrameClass(avatarWrapEl, cos.frame);
        if (coinsEl) {
            if (cos.coins.length > 0) {
                coinsEl.innerHTML = CosmeticManager.renderPinnedCoinsHtml(cos.coins, 'xs');
                coinsEl.classList.remove('hidden');
            } else {
                coinsEl.innerHTML = '';
                coinsEl.classList.add('hidden');
            }
        }
        if (typeof CosmeticEffectsEngine !== 'undefined') {
            CosmeticEffectsEngine.syncElementDecorators(bannerEl);
            if (avatarWrapEl) CosmeticEffectsEngine.syncElementDecorators(avatarWrapEl);
        }
    }

    static applySocialCosmetics(rootEl) {
        if (!rootEl || typeof CosmeticEffectsEngine === 'undefined') return;
        CosmeticEffectsEngine.decorateContainer(rootEl);
    }

    static buildFriendCard(f, opts = {}) {
        const card = document.createElement('div');
        const stateCls = f.coopRoomCode ? 'is-in-room' : (f.isOnline ? 'is-online' : 'is-offline');
        card.className = `friend-card ${stateCls} ${opts.isExpanded ? 'is-expanded' : ''}`;

        const endlessBest = Math.max(Number(f.endlessMaxWave) || 0, Number(f.maxWave) || 0, 1);
        const statsHtml = opts.isExpanded ? `
            <div class="friend-stats-grid">
                <div class="friend-stat-pill"><span>${this._ico('trophy', '🏆')} Best Score</span><strong>${Number(f.highScore || 0).toLocaleString()}</strong></div>
                <div class="friend-stat-pill"><span>${this._ico('wave', '🌊')} Story Best</span><strong>Wave ${Number(f.maxWave || 1)}</strong></div>
                <div class="friend-stat-pill"><span>🔥 Endless Best</span><strong>Wave ${endlessBest}</strong></div>
                <div class="friend-stat-pill"><span>${this._ico('swords', '⚔️')} Kills</span><strong>${Number(f.totalKills || 0).toLocaleString()}</strong></div>
            </div>
        ` : '';

        const statusBadge = f.coopRoomCode
            ? `<span class="friend-room-pill">🎮 ROOM ${this.esc(f.coopRoomCode)}</span>`
            : `<span class="friend-status-text">${this._ico(f.isOnline ? 'orb_green' : 'orb_dark', f.isOnline ? '🟢' : '⚫')} ${this.esc(f.status)}</span>`;

        const joinOrInviteBtn = f.coopRoomCode
            ? `<button class="friend-btn friend-btn-join" data-action="join-room" data-code="${this.esc(f.coopRoomCode)}">${this._ico('rocket', '🚀')} JOIN</button>`
            : `<button class="friend-btn friend-btn-primary" data-action="invite" data-uid="${this.esc(f.uid)}" data-name="${this.esc(f.name)}" ${f.isOnline ? '' : 'disabled title="Friend is offline"'}>${this._ico('swords', '⚔️')} INVITE</button>`;

        const removeLabel = opts.confirmRemove ? 'CONFIRM ✕' : '✕';
        const removeCls = opts.confirmRemove ? 'friend-btn friend-btn-danger is-confirming' : 'friend-btn friend-btn-danger';

        card.innerHTML = `
            <div class="friend-card-main">
                <div class="friend-left">
                    <div class="friend-avatar-wrap">
                        <img class="friend-avatar" src="${this.getHeroAvatar(f.hero)}" alt="Hero">
                        <span class="friend-presence-dot ${f.isOnline ? 'online' : ''}"></span>
                    </div>
                    <div class="friend-info">
                        <div class="friend-name-line">
                            <span class="friend-name">${this.esc(f.name)}</span>
                            <span class="friend-tag-chip">${this.esc(f.tag)}</span>
                            <span class="friend-lvl-chip">LVL ${Number(f.level || 1)}</span>
                        </div>
                        <div class="friend-sub">${statusBadge}</div>
                    </div>
                </div>
                <div class="friend-actions">
                    ${joinOrInviteBtn}
                    <button class="friend-btn friend-btn-muted ${opts.isExpanded ? 'is-active' : ''}" data-action="stats" data-uid="${this.esc(f.uid)}" title="Toggle Career Stats">${this._ico('chart', '📊')}</button>
                    <button class="friend-btn friend-btn-muted" data-action="profile" data-uid="${this.esc(f.uid)}" title="Inspect Full Profile">👤</button>
                    <button class="${removeCls}" data-action="remove" data-rel="${this.esc(f.relId)}" data-uid="${this.esc(f.uid)}" title="Remove Friend">${removeLabel}</button>
                </div>
            </div>
            ${statsHtml}
        `;

        if (typeof ProfileCosmeticsUI !== 'undefined') ProfileCosmeticsUI.decorateSocialCard(card, f);
        return card;
    }

    static buildInviteCard(inv) {
        const card = document.createElement('div');
        card.className = 'friend-card invite-card is-in-room';
        card.innerHTML = `
            <div class="friend-card-main">
                <div class="friend-left">
                    <div class="friend-avatar-wrap">
                        <img class="friend-avatar" src="${this.getHeroAvatar(inv.fromHero)}" alt="Hero">
                        <span class="friend-presence-dot online"></span>
                    </div>
                    <div class="friend-info">
                        <div class="friend-name-line">
                            <span class="friend-name">${this._ico('handshake', '🤝')} ${this.esc(inv.fromName)}</span>
                            <span class="friend-tag-chip">${this.esc(inv.fromTag || '')}</span>
                            <span class="friend-mode-pill">${this.esc((inv.gameMode || 'story').toUpperCase())}</span>
                        </div>
                        <div class="friend-sub"><span class="friend-room-pill">🎮 ROOM ${this.esc(inv.roomCode)}</span></div>
                    </div>
                </div>
                <div class="friend-actions">
                    <button class="friend-btn friend-btn-join" data-join="${this.esc(inv.roomCode)}" data-inv="${this.esc(inv.id)}">${this._ico('rocket', '🚀')} JOIN</button>
                    <button class="friend-btn friend-btn-muted" data-dismiss="${this.esc(inv.id)}" title="Dismiss">✕</button>
                </div>
            </div>
        `;
        return card;
    }

    static buildIncomingReqCard(req) {
        const p = req.profile || {};
        const card = document.createElement('div');
        card.className = 'friend-card req-incoming-card';
        card.innerHTML = `
            <div class="friend-card-main">
                <div class="friend-left">
                    <div class="friend-avatar-wrap"><img class="friend-avatar" src="${this.getHeroAvatar(p.hero)}" alt="Hero"></div>
                    <div class="friend-info">
                        <div class="friend-name-line">
                            <span class="friend-name">${this.esc(p.name || 'Hero')}</span>
                            <span class="friend-tag-chip">${this.esc(p.tag || '')}</span>
                            <span class="friend-lvl-chip">LVL ${Number(p.level || 1)}</span>
                        </div>
                        <div class="friend-sub">Wants to join your Friends &amp; Co-op Squad</div>
                    </div>
                </div>
                <div class="friend-actions">
                    <button class="friend-btn friend-btn-accept" data-accept="${this.esc(req.id)}">✓ ACCEPT</button>
                    <button class="friend-btn friend-btn-danger" data-decline="${this.esc(req.id)}" title="Decline">✕</button>
                </div>
            </div>
        `;
        return card;
    }

    static buildOutgoingReqCard(req) {
        const p = req.profile || {};
        const card = document.createElement('div');
        card.className = 'friend-card req-outgoing-card';
        card.innerHTML = `
            <div class="friend-card-main">
                <div class="friend-left">
                    <div class="friend-avatar-wrap"><img class="friend-avatar" src="${this.getHeroAvatar(p.hero)}" alt="Hero"></div>
                    <div class="friend-info">
                        <div class="friend-name-line">
                            <span class="friend-name">${this.esc(p.name || 'Hero')}</span>
                            <span class="friend-tag-chip">${this.esc(p.tag || '')}</span>
                        </div>
                        <div class="friend-sub">${this._ico('hourglass', '⏳')} Request pending · awaiting reply</div>
                    </div>
                </div>
                <div class="friend-actions">
                    <button class="friend-btn friend-btn-muted" data-decline="${this.esc(req.id)}">CANCEL</button>
                </div>
            </div>
        `;
        return card;
    }

    static buildSearchResultCard(u, rel) {
        const card = document.createElement('div');
        card.className = `friend-card ${u.isOnline ? 'is-online' : 'is-offline'}`;

        let actionHtml = `<button class="friend-btn friend-btn-accept" data-add-uid="${this.esc(u.uid)}">+ ADD FRIEND</button>`;
        if (rel.state === 'accepted') actionHtml = `<button class="friend-btn friend-btn-muted" disabled>✓ FRIENDS</button>`;
        else if (rel.state === 'pending_outgoing') actionHtml = `<button class="friend-btn friend-btn-muted" disabled>${this._ico('hourglass', '⏳')} SENT</button>`;
        else if (rel.state === 'pending_incoming') actionHtml = `<button class="friend-btn friend-btn-accept" data-accept-id="${this.esc(rel.id)}">✓ ACCEPT</button>`;

        card.innerHTML = `
            <div class="friend-card-main">
                <div class="friend-left">
                    <div class="friend-avatar-wrap">
                        <img class="friend-avatar" src="${this.getHeroAvatar(u.hero)}" alt="Hero">
                        <span class="friend-presence-dot ${u.isOnline ? 'online' : ''}"></span>
                    </div>
                    <div class="friend-info">
                        <div class="friend-name-line">
                            <span class="friend-name">${this.esc(u.name)}</span>
                            <span class="friend-tag-chip">${this.esc(u.tag)}</span>
                            <span class="friend-lvl-chip">LVL ${Number(u.level || 1)}</span>
                        </div>
                        <div class="friend-sub">
                            ${this._ico(u.isOnline ? 'orb_green' : 'orb_dark', u.isOnline ? '🟢' : '⚫')} ${u.isOnline ? 'Online' : 'Offline'}
                            · 🏆 ${Number(u.highScore || 0).toLocaleString()}
                            · 🔥 W${Math.max(Number(u.endlessMaxWave) || 0, Number(u.maxWave) || 0, 1)}
                        </div>
                    </div>
                </div>
                <div class="friend-actions">${actionHtml}</div>
            </div>
        `;

        if (typeof ProfileCosmeticsUI !== 'undefined') ProfileCosmeticsUI.decorateSocialCard(card, u);
        return card;
    }
}

if (typeof window !== 'undefined') window.FriendsCardRenderer = FriendsCardRenderer;
if (typeof module !== 'undefined' && module.exports) module.exports = { FriendsCardRenderer };
