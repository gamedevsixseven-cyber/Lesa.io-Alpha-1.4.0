/**
 * Lesa.io - Friends, Player Tag & Squad Invite Modal UI
 * Displays the player's Online ID (#XXXXXX), search by Name or Online ID,
 * live Friends list, incoming Requests, and 1-click Co-op Invites / Join.
 */

const HERO_AVATAR_MAP = {
    psanas: 'assets/HeroesIcons/PsanasAvatar.png',
    psogas: 'assets/HeroesIcons/PsogasAvatar.png',
    petros: 'assets/HeroesIcons/PetrosAvatar.png',
    '50balos': 'assets/HeroesIcons/50balosCrop.png',
    billias: 'assets/HeroesIcons/BilliasAvatar.png',
    kitsos: 'assets/HeroesIcons/KitsosAvatar.png'
};

class FriendsModal {
    constructor(friendService) {
        this.service = friendService;
        this.activeTab = 'friends'; // 'friends' | 'requests' | 'add'
        this.searchResults = [];
        this.hasSearched = false;
        this.lastQuery = '';
        this.feedbackText = '';
        this.expandedStatsUid = null;
        this.confirmRemoveUid = null;
        this._refreshInterval = null;
        this.modal = null;
        this.toastEl = null;

        this.ensureMarkup();
        this.bindEvents();
        this.updateBadge();
    }

    esc(str) {
        return String(str || '').replace(/[&<>"']/g, (ch) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[ch]));
    }

    getHeroAvatar(heroId) {
        return HERO_AVATAR_MAP[heroId] || HERO_AVATAR_MAP.psanas;
    }

    ensureMarkup() {
        if (!document.getElementById('friends-modal')) {
            const overlay = document.createElement('div');
            overlay.id = 'friends-modal';
            overlay.className = 'modal-overlay hidden';
            overlay.innerHTML = `
                <div class="friends-panel">
                    <div class="friends-header">
                        <h2 class="friends-title">${typeof UiIcons !== 'undefined' ? UiIcons.i('people', 'ui-icon-title') : '👥'} FRIENDS & SQUAD</h2>
                        <button id="friends-close-btn" class="coop-close-btn" title="Close (Esc)">✕</button>
                    </div>

                    <div class="friends-id-banner">
                        <div class="friends-id-meta">
                            <img id="friends-my-avatar" class="friends-id-avatar" src="assets/HeroesIcons/PsanasAvatar.png" alt="My Hero">
                            <div>
                                <div id="friends-my-name" class="friends-id-name">Hero</div>
                                <div style="font-size:11px;color:#94a3b8;">Share your Name or Online ID to add friends</div>
                            </div>
                        </div>
                        <div class="friends-id-tag-row">
                            <span id="friends-my-tag" class="friends-id-code">#------</span>
                            <button id="friends-copy-tag-btn" class="friends-copy-btn">${typeof UiIcons !== 'undefined' ? UiIcons.i('copy', 'ui-icon-sm') : '📋'} COPY ID</button>
                        </div>
                    </div>

                    <div class="friends-tabs">
                        <button id="ftab-friends" class="friends-tab-btn active">${typeof UiIcons !== 'undefined' ? UiIcons.i('people', 'ui-icon-sm') : '👥'} FRIENDS (0)</button>
                        <button id="ftab-requests" class="friends-tab-btn">${typeof UiIcons !== 'undefined' ? UiIcons.i('bell', 'ui-icon-sm') : '🔔'} REQUESTS (0)</button>
                        <button id="ftab-add" class="friends-tab-btn">${typeof UiIcons !== 'undefined' ? UiIcons.i('plus', 'ui-icon-sm') : '➕'} ADD FRIEND</button>
                    </div>

                    <div id="friends-feedback-bar" class="friends-feedback hidden"></div>
                    <div id="friends-modal-body" class="friends-body"></div>
                </div>
            `;
            document.body.appendChild(overlay);
        }
        this.modal = document.getElementById('friends-modal');

        if (!document.getElementById('coop-invite-toast')) {
            const toast = document.createElement('div');
            toast.id = 'coop-invite-toast';
            toast.className = 'hidden';
            document.body.appendChild(toast);
        }
        this.toastEl = document.getElementById('coop-invite-toast');
    }

    bindEvents() {
        const closeBtn = document.getElementById('friends-close-btn');
        if (closeBtn) closeBtn.addEventListener('click', () => this.hide());

        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.hide();
            });
        }

        const copyBtn = document.getElementById('friends-copy-tag-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const tag = this.service ? this.service.getMyTag() : '';
                if (!tag) return;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(tag).catch(() => {});
                }
                if (typeof UiIcons !== 'undefined') UiIcons.setRichText(copyBtn, '✅ COPIED!', 'ui-icon-sm'); else copyBtn.textContent = '✅ COPIED!';
                setTimeout(() => { if (typeof UiIcons !== 'undefined') UiIcons.setRichText(copyBtn, '📋 COPY ID', 'ui-icon-sm'); else copyBtn.textContent = '📋 COPY ID'; }, 1800);
            });
        }

        const tabMap = [
            ['ftab-friends', 'friends'],
            ['ftab-requests', 'requests'],
            ['ftab-add', 'add']
        ];
        tabMap.forEach(([id, tabName]) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('click', () => {
                    if (window.soundEngine) window.soundEngine.playSelect();
                    this.activeTab = tabName;
                    this.feedbackText = '';
                    this.render();
                });
            }
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal && !this.modal.classList.contains('hidden')) {
                this.hide();
            }
        });

        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.on('friendsUpdated', () => {
                this.updateBadge();
                if (this.modal && !this.modal.classList.contains('hidden')) {
                    if (this.activeTab === 'add') {
                        const rBtn = document.getElementById('ftab-requests');
                        const fBtn = document.getElementById('ftab-friends');
                        if (fBtn) { if (typeof UiIcons !== 'undefined') UiIcons.setRichText(fBtn, `👥 FRIENDS (${this.service.friends.length})`, 'ui-icon-sm'); else fBtn.textContent = `👥 FRIENDS (${this.service.friends.length})`; }
                        if (rBtn) { if (typeof UiIcons !== 'undefined') UiIcons.setRichText(rBtn, `🔔 REQUESTS (${this.service.incomingRequests.length + this.service.incomingInvites.length})`, 'ui-icon-sm'); else rBtn.textContent = `🔔 REQUESTS (${this.service.incomingRequests.length + this.service.incomingInvites.length})`; }
                        const rc = document.getElementById('friends-search-results');
                        if (rc) this._paintSearchResults(rc);
                    } else this.render();
                }
            });
            window.EventBus.on('coopInviteReceived', (invite) => {
                this.showInviteToast(invite);
            });
        }
    }

    show(initialTab = null) {
        if (initialTab) this.activeTab = initialTab;
        this.feedbackText = '';
        this.confirmRemoveUid = null;
        if (this.service) {
            this.service.syncMyProfile(true);
            this.service.refreshFriendStatuses();
        }
        this.render();
        if (this.modal) this.modal.classList.remove('hidden');

        if (this._refreshInterval) clearInterval(this._refreshInterval);
        this._refreshInterval = setInterval(() => {
            if (this.service && this.modal && !this.modal.classList.contains('hidden')) {
                this.service.refreshFriendStatuses();
            }
        }, 20000);
    }

    hide() {
        if (this.modal) this.modal.classList.add('hidden');
        if (this._refreshInterval) {
            clearInterval(this._refreshInterval);
            this._refreshInterval = null;
        }
    }

    setFeedback(msg) {
        this.feedbackText = msg || '';
        const bar = document.getElementById('friends-feedback-bar');
        if (!bar) return;
        if (!this.feedbackText) {
            bar.classList.add('hidden');
            bar.textContent = '';
        } else {
            bar.textContent = this.feedbackText;
            bar.classList.remove('hidden');
        }
    }

    updateBadge() {
        const badge = document.getElementById('friends-badge');
        if (!badge || !this.service) return;
        const count = this.service.getTotalNotificationCount();
        if (count > 0) {
            badge.textContent = count > 9 ? '9+' : String(count);
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    render() {
        if (!this.service) return;
        const me = this.service.getMySummary();

        const avatarEl = document.getElementById('friends-my-avatar');
        const nameEl = document.getElementById('friends-my-name');
        const tagEl = document.getElementById('friends-my-tag');
        if (avatarEl) avatarEl.src = this.getHeroAvatar(me.selectedHero);
        if (nameEl) nameEl.textContent = `${me.name} · LVL ${me.level}`;
        if (tagEl) tagEl.textContent = me.tag;

        const reqTotal = this.service.incomingRequests.length + this.service.incomingInvites.length;
        const fBtn = document.getElementById('ftab-friends');
        const rBtn = document.getElementById('ftab-requests');
        const aBtn = document.getElementById('ftab-add');
        if (fBtn) {
            if (typeof UiIcons !== 'undefined') UiIcons.setRichText(fBtn, `👥 FRIENDS (${this.service.friends.length})`, 'ui-icon-sm'); else fBtn.textContent = `👥 FRIENDS (${this.service.friends.length})`;
            fBtn.classList.toggle('active', this.activeTab === 'friends');
        }
        if (rBtn) {
            if (typeof UiIcons !== 'undefined') UiIcons.setRichText(rBtn, `🔔 REQUESTS (${reqTotal})`, 'ui-icon-sm'); else rBtn.textContent = `🔔 REQUESTS (${reqTotal})`;
            rBtn.classList.toggle('active', this.activeTab === 'requests');
        }
        if (aBtn) {
            aBtn.classList.toggle('active', this.activeTab === 'add');
        }

        this.setFeedback(this.feedbackText || this.service.lastError || '');

        const body = document.getElementById('friends-modal-body');
        if (!body) return;

        if (this.activeTab === 'friends') this._renderFriendsTab(body);
        else if (this.activeTab === 'requests') this._renderRequestsTab(body);
        else this._renderAddTab(body);
    }

    _renderFriendsTab(body) {
        const rawFriends = this.service.friends.slice();
        if (!rawFriends.length) {
            body.innerHTML = `<div class="friends-empty">No friends added yet!<br>Switch to <b>${typeof UiIcons !== 'undefined' ? UiIcons.i('plus', 'ui-icon-sm') : '➕'} ADD FRIEND</b> and search by player <b>Name</b> or <b>#OnlineID</b>.</div>`;
            return;
        }

        const enriched = rawFriends.map((f) => {
            const live = this.service.friendProfiles[f.otherUid] || {};
            return {
                relId: f.id,
                uid: f.otherUid,
                name: live.name || f.profile.name,
                tag: live.tag || f.profile.tag,
                hero: live.hero || f.profile.hero,
                level: live.level || f.profile.level,
                isOnline: Boolean(live.isOnline),
                status: live.currentStatus || (live.isOnline ? 'In Lobby' : 'Offline'),
                coopRoomCode: live.coopRoomCode || null,
                highScore: live.highScore || 0, maxWave: live.maxWave || 1, totalKills: live.totalKills || 0,
                endlessMaxWave: live.endlessMaxWave || 0, olympusMaxFloor: live.olympusMaxFloor || 0,
                cosmetics: live.cosmetics || f.profile.cosmetics || {}
            };
        }).sort((a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0));

        const listEl = document.createElement('div');
        listEl.className = 'friends-list';

        enriched.forEach((f) => {
            const card = document.createElement('div');
            card.className = 'friend-card';

            const statsHtml = (this.expandedStatsUid === f.uid)
                ? `<div class="friend-sub" style="color:#fde68a;">${typeof UiIcons !== 'undefined' ? UiIcons.i('trophy', 'ui-icon-sm') : '🏆'} High Score: ${f.highScore.toLocaleString()} · ${typeof UiIcons !== 'undefined' ? UiIcons.i('wave', 'ui-icon-sm') : '🌊'} Max Wave: ${f.maxWave} · ${typeof UiIcons !== 'undefined' ? UiIcons.i('swords', 'ui-icon-sm') : '⚔️'} Kills: ${f.totalKills.toLocaleString()}</div>`
                : '';

            const joinOrInviteBtn = f.coopRoomCode
                ? `<button class="friend-btn friend-btn-join" data-action="join-room" data-code="${this.esc(f.coopRoomCode)}">${typeof UiIcons !== 'undefined' ? UiIcons.i('rocket', 'ui-icon-sm') : '🚀'} JOIN</button>`
                : `<button class="friend-btn friend-btn-primary" data-action="invite" data-uid="${this.esc(f.uid)}" data-name="${this.esc(f.name)}" ${f.isOnline ? '' : 'disabled title="Friend is offline"'}>${typeof UiIcons !== 'undefined' ? UiIcons.i('swords', 'ui-icon-sm') : '⚔️'} INVITE</button>`;

            const removeLabel = (this.confirmRemoveUid === f.uid) ? 'CONFIRM ✕' : '✕';

            card.innerHTML = `
                <div class="friend-left">
                    <div class="friend-avatar-wrap">
                        <img class="friend-avatar" src="${this.getHeroAvatar(f.hero)}" alt="Hero">
                        <span class="friend-presence-dot ${f.isOnline ? 'online' : ''}"></span>
                    </div>
                    <div class="friend-info">
                        <div class="friend-name-line"><span class="friend-name">${this.esc(f.name)}</span><span class="friend-tag-chip">${this.esc(f.tag)}</span><span class="friend-lvl-chip">LVL ${f.level}</span></div>
                        <div class="friend-sub">${typeof UiIcons !== 'undefined' ? UiIcons.i(f.isOnline ? 'orb_green' : 'orb_dark', 'ui-icon-sm') : (f.isOnline ? '🟢' : '⚫')} ${this.esc(f.status)}</div>
                        ${statsHtml}
                    </div>
                </div>
                <div class="friend-actions">
                    ${joinOrInviteBtn}
                    <button class="friend-btn friend-btn-muted" data-action="stats" data-uid="${this.esc(f.uid)}" title="Stats">${typeof UiIcons !== 'undefined' ? UiIcons.i('chart', 'ui-icon-sm') : '📊'}</button>
                    <button class="friend-btn friend-btn-danger" data-action="remove" data-rel="${this.esc(f.relId)}" data-uid="${this.esc(f.uid)}" title="Remove Friend">${removeLabel}</button>
                </div>
            `;
            if (typeof ProfileCosmeticsUI !== 'undefined') ProfileCosmeticsUI.decorateSocialCard(card, f);
            listEl.appendChild(card);
        });

        body.innerHTML = '';
        body.appendChild(listEl);

        listEl.querySelectorAll('button[data-action]').forEach((btn) => {
            btn.addEventListener('click', () => this._handleFriendCardAction(btn));
        });
    }

    async _handleFriendCardAction(btn) {
        const action = btn.dataset.action;
        const uid = btn.dataset.uid;
        if (action === 'stats') {
            this.expandedStatsUid = (this.expandedStatsUid === uid) ? null : uid;
            this.render();
        } else if (action === 'remove') {
            if (this.confirmRemoveUid !== uid) {
                this.confirmRemoveUid = uid;
                this.render();
                return;
            }
            this.confirmRemoveUid = null;
            await this.service.removeOrDeclineFriendship(btn.dataset.rel);
            this.setFeedback('Friend removed.');
        } else if (action === 'join-room') {
            this.joinRoomCode(btn.dataset.code);
        } else if (action === 'invite') {
            await this.inviteFriendToCoop(uid, btn.dataset.name);
        }
    }

    _renderRequestsTab(body) {
        const invites = this.service.incomingInvites;
        const inc = this.service.incomingRequests;
        const out = this.service.outgoingRequests;

        if (!invites.length && !inc.length && !out.length) {
            body.innerHTML = `<div class="friends-empty">No pending friend requests or Co-op invites right now.</div>`;
            return;
        }

        const wrap = document.createElement('div');
        wrap.className = 'friends-list';

        invites.forEach((inv) => {
            const card = document.createElement('div');
            card.className = 'friend-card invite-card';
            card.innerHTML = `
                <div class="friend-left">
                    <div class="friend-avatar-wrap"><img class="friend-avatar" src="${this.getHeroAvatar(inv.fromHero)}"></div>
                    <div class="friend-info">
                        <div class="friend-name-line">
                            <span class="friend-name">${typeof UiIcons !== 'undefined' ? UiIcons.i('handshake', 'ui-icon-sm') : '🤝'} ${this.esc(inv.fromName)}</span>
                            <span class="friend-tag-chip">${this.esc(inv.fromTag || '')}</span>
                        </div>
                        <div class="friend-sub" style="color:#fde047;">Co-op Invite · Mode: ${this.esc((inv.gameMode || 'story').toUpperCase())} · Room ${this.esc(inv.roomCode)}</div>
                    </div>
                </div>
                <div class="friend-actions">
                    <button class="friend-btn friend-btn-join" data-join="${this.esc(inv.roomCode)}" data-inv="${this.esc(inv.id)}">${typeof UiIcons !== 'undefined' ? UiIcons.i('rocket', 'ui-icon-sm') : '🚀'} JOIN</button>
                    <button class="friend-btn friend-btn-muted" data-dismiss="${this.esc(inv.id)}">✕</button>
                </div>
            `;
            wrap.appendChild(card);
        });

        inc.forEach((req) => {
            const card = document.createElement('div');
            card.className = 'friend-card';
            card.innerHTML = `
                <div class="friend-left">
                    <div class="friend-avatar-wrap"><img class="friend-avatar" src="${this.getHeroAvatar(req.profile.hero)}"></div>
                    <div class="friend-info">
                        <div class="friend-name-line">
                            <span class="friend-name">${this.esc(req.profile.name)}</span>
                            <span class="friend-tag-chip">${this.esc(req.profile.tag)}</span>
                            <span class="friend-lvl-chip">LVL ${req.profile.level}</span>
                        </div>
                        <div class="friend-sub">Wants to add you as a friend</div>
                    </div>
                </div>
                <div class="friend-actions">
                    <button class="friend-btn friend-btn-accept" data-accept="${this.esc(req.id)}">✓ ACCEPT</button>
                    <button class="friend-btn friend-btn-danger" data-decline="${this.esc(req.id)}">✕</button>
                </div>
            `;
            wrap.appendChild(card);
        });

        out.forEach((req) => {
            const card = document.createElement('div');
            card.className = 'friend-card';
            card.innerHTML = `
                <div class="friend-left">
                    <div class="friend-avatar-wrap"><img class="friend-avatar" src="${this.getHeroAvatar(req.profile.hero)}"></div>
                    <div class="friend-info">
                        <div class="friend-name-line">
                            <span class="friend-name">${this.esc(req.profile.name)}</span>
                            <span class="friend-tag-chip">${this.esc(req.profile.tag)}</span>
                        </div>
                        <div class="friend-sub">${typeof UiIcons !== 'undefined' ? UiIcons.i('hourglass', 'ui-icon-sm') : '⏳'} Request sent · waiting reply</div>
                    </div>
                </div>
                <div class="friend-actions">
                    <button class="friend-btn friend-btn-muted" data-decline="${this.esc(req.id)}">CANCEL</button>
                </div>
            `;
            wrap.appendChild(card);
        });

        body.innerHTML = '';
        body.appendChild(wrap);

        wrap.querySelectorAll('[data-accept]').forEach(b => b.addEventListener('click', () => this.service.acceptFriendRequest(b.dataset.accept)));
        wrap.querySelectorAll('[data-decline]').forEach(b => b.addEventListener('click', () => this.service.removeOrDeclineFriendship(b.dataset.decline)));
        wrap.querySelectorAll('[data-dismiss]').forEach(b => b.addEventListener('click', () => this.service.dismissInvite(b.dataset.dismiss)));
        wrap.querySelectorAll('[data-join]').forEach(b => b.addEventListener('click', () => {
            this.service.dismissInvite(b.dataset.inv);
            this.joinRoomCode(b.dataset.join);
        }));
    }

    _renderAddTab(body) {
        body.innerHTML = `<div class="friends-search-bar"><input id="friends-search-input" class="friends-search-input" type="text" maxlength="24" value="${this.esc(this.lastQuery)}" placeholder="Enter Player Name or #OnlineID (e.g. #K8M4P2)..." autocomplete="off"><button id="friends-search-btn" class="friends-search-btn">${typeof UiIcons !== 'undefined' ? UiIcons.i('search', 'ui-icon-sm') : '🔍'} FIND</button></div><div id="friends-search-results" class="friends-list"></div>`;

        const input = document.getElementById('friends-search-input');
        const btn = document.getElementById('friends-search-btn');
        const resultsEl = document.getElementById('friends-search-results');

        const runSearch = async () => {
            const q = (input.value || '').trim();
            this.lastQuery = q;
            this.hasSearched = Boolean(q);
            resultsEl.innerHTML = `<div class="friends-empty">Searching players...</div>`;
            const res = q ? await this.service.searchPlayers(q) : await this.service.fetchDiscoverablePlayers();
            if (!res.ok) {
                resultsEl.innerHTML = `<div class="friends-empty" style="color:#fca5a5;">${this.esc(res.error)}</div>`;
                return;
            }
            this.searchResults = res.results;
            this._paintSearchResults(resultsEl);
        };

        btn.addEventListener('click', runSearch);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') runSearch(); });
        if (!this.hasSearched && !this.searchResults.length) {
            resultsEl.innerHTML = `<div class="friends-empty">Loading active players...</div>`;
            this.service.fetchDiscoverablePlayers().then((res) => {
                if (this.activeTab !== 'add') return;
                if (!res.ok) resultsEl.innerHTML = `<div class="friends-empty" style="color:#fca5a5;">${this.esc(res.error)}</div>`;
                else { this.searchResults = res.results; this._paintSearchResults(resultsEl); }
            });
        } else {
            this._paintSearchResults(resultsEl);
        }
        setTimeout(() => input.focus(), 40);
    }

    _paintSearchResults(container) {
        if (!this.searchResults.length) {
            container.innerHTML = this.hasSearched
                ? `<div class="friends-empty">No players found matching "<b>${this.esc(this.lastQuery)}</b>".<br>Make sure they logged in online and check their exact Name or <b>#OnlineID</b>!</div>`
                : `<div class="friends-empty">No other active players found yet.<br>Search by your friend's exact <b>#OnlineID</b> or <b>Hero Name</b>!</div>`;
            return;
        }
        container.innerHTML = '';
        this.searchResults.forEach((u) => {
            const rel = this.service.getRelationState(u.uid);
            const card = document.createElement('div');
            card.className = 'friend-card';

            let actionHtml = `<button class="friend-btn friend-btn-accept" data-add-uid="${this.esc(u.uid)}">+ ADD FRIEND</button>`;
            if (rel.state === 'accepted') actionHtml = `<button class="friend-btn friend-btn-muted" disabled>✓ FRIENDS</button>`;
            else if (rel.state === 'pending_outgoing') actionHtml = `<button class="friend-btn friend-btn-muted" disabled>${typeof UiIcons !== 'undefined' ? UiIcons.i('hourglass', 'ui-icon-sm') : '⏳'} SENT</button>`;
            else if (rel.state === 'pending_incoming') actionHtml = `<button class="friend-btn friend-btn-accept" data-accept-id="${this.esc(rel.id)}">✓ ACCEPT</button>`;

            card.innerHTML = `
                <div class="friend-left">
                    <div class="friend-avatar-wrap">
                        <img class="friend-avatar" src="${this.getHeroAvatar(u.hero)}" alt="Hero">
                        <span class="friend-presence-dot ${u.isOnline ? 'online' : ''}"></span>
                    </div>
                    <div class="friend-info">
                        <div class="friend-name-line"><span class="friend-name">${this.esc(u.name)}</span><span class="friend-tag-chip">${this.esc(u.tag)}</span><span class="friend-lvl-chip">LVL ${u.level}</span></div>
                        <div class="friend-sub">${typeof UiIcons !== 'undefined' ? UiIcons.i(u.isOnline ? 'orb_green' : 'orb_dark', 'ui-icon-sm') + (u.isOnline ? ' Online' : ' Offline') : (u.isOnline ? '🟢 Online' : '⚫ Offline')} · High Score ${u.highScore.toLocaleString()}</div>
                    </div>
                </div>
                <div class="friend-actions">${actionHtml}</div>
            `;
            if (typeof ProfileCosmeticsUI !== 'undefined') ProfileCosmeticsUI.decorateSocialCard(card, u);
            container.appendChild(card);
        });

        container.querySelectorAll('[data-add-uid]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const profile = this.searchResults.find(r => r.uid === btn.dataset.addUid);
                btn.disabled = true;
                const resp = await this.service.sendFriendRequest(profile);
                this.setFeedback(resp.message);
                this._paintSearchResults(container);
            });
        });

        container.querySelectorAll('[data-accept-id]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                btn.disabled = true;
                await this.service.acceptFriendRequest(btn.dataset.acceptId);
                this.setFeedback('Friend added!');
                this._paintSearchResults(container);
            });
        });
    }

    async inviteFriendToCoop(friendUid, friendName) {
        if (!window.networkManager) return;
        this.hide();
        if (!window.coopLobbyModal && typeof CoopLobbyModal !== 'undefined') {
            window.coopLobbyModal = new CoopLobbyModal();
        }
        if (window.coopLobbyModal) {
            window.coopLobbyModal.activeTab = 'host';
            window.coopLobbyModal.show();
            const code = window.coopLobbyModal.roomCode;
            const mode = window.coopLobbyModal.selectedMode || 'story';
            if (code) {
                await this.service.sendCoopInvite(friendUid, code, mode);
                const statusEl = document.getElementById('coop-host-status');
                if (statusEl) { if (typeof UiIcons !== 'undefined') UiIcons.setRichText(statusEl, `📨 Invite sent to ${friendName}! Waiting to connect...`, 'ui-icon-sm'); else statusEl.textContent = `📨 Invite sent to ${friendName}! Waiting to connect...`; }
            }
        }
    }

    joinRoomCode(roomCode) {
        if (!roomCode) return;
        this.hide();
        if (this.toastEl) this.toastEl.classList.add('hidden');
        if (!window.coopLobbyModal && typeof CoopLobbyModal !== 'undefined') {
            window.coopLobbyModal = new CoopLobbyModal();
        }
        if (window.coopLobbyModal) {
            window.coopLobbyModal.activeTab = 'join';
            window.coopLobbyModal.show();
            const tabJoin = document.getElementById('coop-tab-join');
            if (tabJoin) tabJoin.click();
            const input = document.getElementById('coop-join-code-input');
            const btn = document.getElementById('coop-connect-btn');
            if (input) input.value = roomCode;
            if (btn) btn.click();
        }
    }

    showInviteToast(invite) {
        if (!this.toastEl || !invite) return;
        if (window.gameInstance && window.gameInstance.state === 'PLAYING') return; // Wait quietly until back at menu/requests badge
        this.toastEl.innerHTML = `
            <span style="font-size:14px;font-weight:700;">${typeof UiIcons !== 'undefined' ? UiIcons.i('handshake', 'ui-icon-sm') : '🤝'} <b>${this.esc(invite.fromName)}</b> invited you to <b>${this.esc((invite.gameMode || 'story').toUpperCase())}</b> Co-op!</span>
            <button id="toast-join-coop-btn" class="friend-btn friend-btn-join">${typeof UiIcons !== 'undefined' ? UiIcons.i('rocket', 'ui-icon-sm') : '🚀'} JOIN</button>
            <button id="toast-dismiss-coop-btn" class="friend-btn friend-btn-muted">✕</button>
        `;
        this.toastEl.classList.remove('hidden');

        document.getElementById('toast-join-coop-btn').onclick = () => {
            this.service.dismissInvite(invite.id);
            this.joinRoomCode(invite.roomCode);
        };
        document.getElementById('toast-dismiss-coop-btn').onclick = () => {
            this.service.dismissInvite(invite.id);
            this.toastEl.classList.add('hidden');
        };
    }
}

if (typeof window !== 'undefined') {
    window.FriendsModal = FriendsModal;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FriendsModal };
}

