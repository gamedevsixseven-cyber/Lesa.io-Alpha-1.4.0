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

    static formatLastOnline(ts) {
        const ms = Number(ts) || 0;
        if (ms <= 0) return '';
        const diffSec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
        if (diffSec < 60) return 'Last online just now';
        if (diffSec < 3600) return `Last online ${Math.floor(diffSec / 60)}m ago`;
        if (diffSec < 86400) return `Last online ${Math.floor(diffSec / 3600)}h ago`;
        if (diffSec < 2592000) return `Last online ${Math.floor(diffSec / 86400)}d ago`;
        try {
            return `Last online ${new Date(ms).toLocaleDateString()}`;
        } catch (_) {
            return '';
        }
    }

    static buildModalMarkup() {
        const pplIcon = this._ico('people', '👥', 'ui-icon-title');
        const pplSm = this._ico('people', '');
        const bellIcon = this._ico('bell', '');
        const plusIcon = this._ico('plus', '+');
        const copyIcon = this._ico('copy', '');
        const syncIcon = this._ico('sync', '');
        const orbOff = this._ico('orb_dark', '');
        const cardIcon = this._ico('hero_card', '');
        const crossIcon = this._ico('cross', '✕');
        return `
            <div class="friends-panel">
                <div class="friends-header">
                    <div class="friends-title-cluster">
                        <h2 class="friends-title">${pplIcon} FRIENDS &amp; SQUAD</h2>
                        <span id="friends-online-pill" class="friends-online-pill">${orbOff} 0 ONLINE</span>
                    </div>
                    <div class="friends-header-right">
                        <button type="button" id="friends-refresh-btn" class="friends-icon-btn" title="Refresh Online Status">${syncIcon} SYNC</button>
                        <button type="button" id="friends-close-btn" class="modal-close-x-btn friends-close-x" title="Close (Esc)" aria-label="Close">${crossIcon}</button>
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
                        <button type="button" id="friends-my-profile-btn" class="friends-card-btn">${cardIcon} MY CARD</button>
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

    static _formatInviteMode(gameMode) {
        const m = String(gameMode || 'story').toLowerCase();
        if (m === 'endless') return 'NORMAL ENDLESS';
        return m.replace(/_/g, ' ').toUpperCase();
    }

    static buildInviteToastHtml(invite) {
        return `
            <img class="toast-inv-avatar" src="${this.getHeroAvatar(invite.fromHero)}" alt="Hero">
            <div class="toast-inv-copy">
                <div class="toast-inv-title">${this._ico('handshake')} <b>${this.esc(invite.fromName)}</b> invited you!</div>
                <div class="toast-inv-sub">${this.esc(this._formatInviteMode(invite.gameMode))} CO-OP · ROOM <b>${this.esc(invite.roomCode)}</b></div>
            </div>
            <button id="toast-join-coop-btn" class="friend-btn friend-btn-join">${this._ico('rocket')} JOIN</button>
            <button id="toast-dismiss-coop-btn" class="friend-btn friend-btn-muted">${this._ico('cross', '✕')}</button>
        `;
    }

    static buildFriendReqToastHtml(req) {
        const p = (req && req.profile) || {};
        return `
            <img class="toast-inv-avatar" src="${this.getHeroAvatar(p.hero)}" alt="Hero">
            <div class="toast-inv-copy">
                <div class="toast-inv-title">${this._ico('bell')} <b>${this.esc(p.name || 'Hero')}</b> sent you a friend request!</div>
                <div class="toast-inv-sub">${this.esc(p.tag || '')} · LVL ${Number(p.level || 1)}</div>
            </div>
            <button id="toast-accept-req-btn" class="friend-btn friend-btn-accept">${this._ico('check')} ACCEPT</button>
            <button id="toast-view-req-btn" class="friend-btn friend-btn-primary">VIEW</button>
            <button id="toast-dismiss-req-btn" class="friend-btn friend-btn-muted">${this._ico('cross', '✕')}</button>
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

        const endlessBest = Math.max(0, Number(f.endlessMaxWave) || 0);
        const hardBest = Math.max(0, Number(f.endlessHardMaxWave) || 0);
        const statsHtml = opts.isExpanded ? `
            <div class="friend-stats-grid">
                <div class="friend-stat-pill"><span>${this._ico('trophy')} Best Score</span><strong>${Number(f.highScore || 0).toLocaleString()}</strong></div>
                <div class="friend-stat-pill"><span>${this._ico('wave')} Endless Best</span><strong>Wave ${endlessBest}</strong></div>
                <div class="friend-stat-pill"><span>${this._ico('flame')} Hard Endless</span><strong>Wave ${hardBest}</strong></div>
                <div class="friend-stat-pill"><span>${this._ico('swords')} Kills</span><strong>${Number(f.totalKills || 0).toLocaleString()}</strong></div>
            </div>
        ` : '';

        const lastOnlineTxt = (!f.isOnline && !f.coopRoomCode) ? this.formatLastOnline(f.lastSeenAt) : '';
        const offlineLabel = lastOnlineTxt ? `${this.esc(f.status)} · ${this.esc(lastOnlineTxt)}` : this.esc(f.status);
        const isHardStatus = f.isOnline && /endless hard/i.test(String(f.status || ''));
        const roomPillHtml = f.coopRoomCode ? `<span class="friend-room-pill">${this._ico('gamepad')} ROOM ${this.esc(f.coopRoomCode)}</span> ` : '';
        const statusBadge = `${roomPillHtml}<span class="friend-status-text ${isHardStatus ? 'is-hard-status' : ''}">${this._ico(f.isOnline ? 'orb_green' : 'orb_dark')} ${f.isOnline ? this.esc(f.status) : offlineLabel}</span>`;

        const joinOrInviteBtn = f.coopRoomCode
            ? `<button class="friend-btn friend-btn-join" data-action="join-room" data-code="${this.esc(f.coopRoomCode)}">${this._ico('rocket')} JOIN</button>`
            : `<button class="friend-btn friend-btn-primary" data-action="invite" data-uid="${this.esc(f.uid)}" data-name="${this.esc(f.name)}" ${f.isOnline ? '' : 'disabled title="Friend is offline"'}>${this._ico('swords')} INVITE</button>`;

        const dmUnread = Math.max(0, Number(opts.dmUnread) || 0);
        const dmBadgeHtml = dmUnread > 0 ? `<span class="friend-dm-badge">${dmUnread > 9 ? '9+' : dmUnread}</span>` : '';
        const removeLabel = opts.confirmRemove ? `CONFIRM ${this._ico('cross', '✕')}` : this._ico('cross', '✕');
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
                            ${f.clanTag ? `<span class="clan-inline-tag">[${this.esc(f.clanTag)}]</span>` : ''}
                            <span class="friend-name">${this.esc(f.name)}</span>
                            <span class="friend-tag-chip">${this.esc(f.tag)}</span>
                            <span class="friend-lvl-chip">LVL ${Number(f.level || 1)}</span>
                        </div>
                        <div class="friend-sub">${statusBadge}</div>
                    </div>
                </div>
                <div class="friend-actions">
                    ${joinOrInviteBtn}
                    <button class="friend-btn friend-btn-chat ${dmUnread > 0 ? 'has-unread' : ''}" data-action="dm" data-uid="${this.esc(f.uid)}" data-rel="${this.esc(f.relId)}" title="Direct Message">${this._ico('chat')}${dmBadgeHtml}</button>
                    <button class="friend-btn friend-btn-muted ${opts.isExpanded ? 'is-active' : ''}" data-action="stats" data-uid="${this.esc(f.uid)}" title="Toggle Career Stats">${this._ico('chart')}</button>
                    <button class="friend-btn friend-btn-muted" data-action="profile" data-uid="${this.esc(f.uid)}" title="Inspect Full Profile">${this._ico('hero_card')}</button>
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
                            <span class="friend-name">${this._ico('handshake')} ${this.esc(inv.fromName)}</span>
                            <span class="friend-tag-chip">${this.esc(inv.fromTag || '')}</span>
                            <span class="friend-mode-pill">${this.esc(this._formatInviteMode(inv.gameMode))}</span>
                        </div>
                        <div class="friend-sub"><span class="friend-room-pill">${this._ico('gamepad')} ROOM ${this.esc(inv.roomCode)}</span></div>
                    </div>
                </div>
                <div class="friend-actions">
                    <button class="friend-btn friend-btn-join" data-join="${this.esc(inv.roomCode)}" data-inv="${this.esc(inv.id)}">${this._ico('rocket')} JOIN</button>
                    <button class="friend-btn friend-btn-muted" data-dismiss="${this.esc(inv.id)}" title="Dismiss">${this._ico('cross', '✕')}</button>
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
                    <button class="friend-btn friend-btn-accept" data-accept="${this.esc(req.id)}">${this._ico('check')} ACCEPT</button>
                    <button class="friend-btn friend-btn-danger" data-decline="${this.esc(req.id)}" title="Decline">${this._ico('cross', '✕')}</button>
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
                        <div class="friend-sub">${this._ico('hourglass')} Request pending · awaiting reply</div>
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

        let actionHtml = `<button class="friend-btn friend-btn-accept" data-add-uid="${this.esc(u.uid)}">${this._ico('plus', '+')} ADD FRIEND</button>`;
        if (rel.state === 'accepted') actionHtml = `<button class="friend-btn friend-btn-muted" disabled>${this._ico('check')} FRIENDS</button>`;
        else if (rel.state === 'pending_outgoing') actionHtml = `<button class="friend-btn friend-btn-muted" disabled>${this._ico('hourglass')} SENT</button>`;
        else if (rel.state === 'pending_incoming') actionHtml = `<button class="friend-btn friend-btn-accept" data-accept-id="${this.esc(rel.id)}">${this._ico('check')} ACCEPT</button>`;

        card.innerHTML = `
            <div class="friend-card-main">
                <div class="friend-left">
                    <div class="friend-avatar-wrap">
                        <img class="friend-avatar" src="${this.getHeroAvatar(u.hero)}" alt="Hero">
                        <span class="friend-presence-dot ${u.isOnline ? 'online' : ''}"></span>
                    </div>
                    <div class="friend-info">
                        <div class="friend-name-line">
                            ${u.clanTag ? `<span class="clan-inline-tag">[${this.esc(u.clanTag)}]</span>` : ''}
                            <span class="friend-name">${this.esc(u.name)}</span>
                            <span class="friend-tag-chip">${this.esc(u.tag)}</span>
                            <span class="friend-lvl-chip">LVL ${Number(u.level || 1)}</span>
                        </div>
                        <div class="friend-sub">
                            <span class="friend-status-text ${u.isOnline && /endless hard/i.test(String(u.currentStatus || '')) ? 'is-hard-status' : ''}">${this._ico(u.isOnline ? 'orb_green' : 'orb_dark')} ${u.isOnline ? this.esc(u.currentStatus || 'Online') : 'Offline'}</span>
                            · ${this._ico('trophy')} ${Number(u.highScore || 0).toLocaleString()}
                            · ${this._ico('flame')} W${Math.max(0, Number(u.endlessMaxWave) || 0)}
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
