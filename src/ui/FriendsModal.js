/**
 * Lesa.io - Friends, Player Tag & Squad Invite Modal UI
 * Displays your equipped Player Card & Online ID (#XXXXXX), live Friends filtering,
 * grouped Online / In-Room / Offline cards, Requests & Co-op Invites, and Player Search.
 */

class FriendsModal {
    constructor(friendService) {
        this.service = friendService;
        this.activeTab = 'friends'; // 'friends' | 'requests' | 'add'
        this.friendFilter = 'ALL'; // 'ALL' | 'ONLINE' | 'ROOM'
        this.friendSearchQuery = '';
        this.searchResults = [];
        this.hasSearched = false;
        this.lastQuery = '';
        this.feedbackText = '';
        this.expandedStatsUid = null;
        this.confirmRemoveUid = null;
        this.activeDmRelId = null;
        this._refreshInterval = null;
        this.modal = null;
        this.toastEl = null;
        this.reqToastEl = null;
        this._deferredFriendReq = null;

        if (typeof ChatService !== 'undefined') ChatService.boot();
        this.ensureMarkup();
        this.bindEvents();
        this.updateBadge();
    }

    ico(key, fb = '') { return typeof FriendsCardRenderer !== 'undefined' ? FriendsCardRenderer._ico(key, fb) : fb; }
    esc(str) { return typeof FriendsCardRenderer !== 'undefined' ? FriendsCardRenderer.esc(str) : String(str || ''); }
    getHeroAvatar(heroId) { return typeof FriendsCardRenderer !== 'undefined' ? FriendsCardRenderer.getHeroAvatar(heroId) : 'assets/HeroesIcons/PsanasAvatar.png'; }

    _ensureEl(id, cls, html = '') {
        let el = document.getElementById(id);
        if (!el) { el = document.createElement('div'); el.id = id; el.className = cls; if (html) el.innerHTML = html; document.body.appendChild(el); }
        return el;
    }

    ensureMarkup() {
        const html = typeof FriendsCardRenderer !== 'undefined' ? FriendsCardRenderer.buildModalMarkup() : '';
        this.modal = this._ensureEl('friends-modal', 'modal-overlay hidden', html);
        this.toastEl = this._ensureEl('coop-invite-toast', 'hidden');
        this.reqToastEl = this._ensureEl('friend-req-toast', 'hidden');
    }

    bindEvents() {
        const closeBtn = document.getElementById('friends-close-btn');
        if (closeBtn) closeBtn.addEventListener('click', () => { if (window.soundEngine) window.soundEngine.playGoBack(); this.hide(); });
        if (this.modal) this.modal.addEventListener('click', (e) => { if (e.target === this.modal) this.hide(); });

        const copyBtn = document.getElementById('friends-copy-tag-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const tag = this.service ? this.service.getMyTag() : '';
                if (!tag) return;
                if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(tag).catch(() => {});
                if (window.soundEngine) window.soundEngine.playSelect();
                if (typeof UiIcons !== 'undefined') UiIcons.setRichText(copyBtn, '✅ COPIED!', 'ui-icon-sm'); else copyBtn.textContent = '✅ COPIED!';
                setTimeout(() => { if (typeof UiIcons !== 'undefined') UiIcons.setRichText(copyBtn, '📋 COPY ID', 'ui-icon-sm'); else copyBtn.textContent = '📋 COPY ID'; }, 1800);
            });
        }

        const refreshBtn = document.getElementById('friends-refresh-btn');
        if (refreshBtn && this.service) {
            refreshBtn.addEventListener('click', async () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                refreshBtn.classList.add('is-spinning');
                await Promise.all([this.service.syncMyProfile(true), this.service.pollFriendships(), this.service.refreshFriendStatuses()]);
                setTimeout(() => refreshBtn.classList.remove('is-spinning'), 450);
                this.render();
            });
        }

        const myProfileBtn = document.getElementById('friends-my-profile-btn');
        if (myProfileBtn) {
            myProfileBtn.addEventListener('click', () => {
                if (!this.service || typeof PublicProfileModal === 'undefined') return;
                if (window.soundEngine) window.soundEngine.playSelect();
                PublicProfileModal.open(this.service.getMySummary());
            });
        }

        [['ftab-friends', 'friends'], ['ftab-requests', 'requests'], ['ftab-add', 'add']].forEach(([id, tabName]) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                this.activeTab = tabName;
                this.closeDm(false);
                this.feedbackText = '';
                this.render();
            });
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal && !this.modal.classList.contains('hidden')) this.hide();
        });

        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.on('friendsUpdated', () => {
                this.updateBadge();
                if (this.modal && !this.modal.classList.contains('hidden')) {
                    if (this.activeTab === 'add') {
                        this._syncTabLabels();
                        const rc = document.getElementById('friends-search-results');
                        if (rc) this._paintSearchResults(rc);
                    } else this.render();
                }
            });
            window.EventBus.on('coopInviteReceived', (invite) => this.showInviteToast(invite));
            window.EventBus.on('friendRequestReceived', (req) => this.showFriendRequestToast(req));
            window.EventBus.on('cosmeticsUpdated', () => {
                if (this.modal && !this.modal.classList.contains('hidden')) this.render();
            });
            window.EventBus.on('socialChatUpdated', () => {
                this.updateBadge();
                if (!this.modal || this.modal.classList.contains('hidden')) return;
                this._syncTabLabels();
                if (this.activeTab === 'friends' && this.activeDmRelId && typeof DirectMessageView !== 'undefined' && window.chatService) {
                    DirectMessageView.paintMessages(this.activeDmRelId, window.chatService);
                } else if (this.activeTab === 'friends' && !this.activeDmRelId) {
                    this.render();
                }
            });
        }
    }

    show(initialTab = null) {
        const pendingTotal = this.service ? this.service.getTotalNotificationCount() : 0;
        this.activeTab = initialTab || (pendingTotal > 0 ? 'requests' : 'friends');
        this.feedbackText = '';
        this.confirmRemoveUid = null;
        this.closeDm(false);
        if (this.activeTab === 'requests' && this.reqToastEl) this.reqToastEl.classList.add('hidden');
        if (this.service) {
            this.service.syncMyProfile(false);
            if (!this._lastFriendsSyncAt || Date.now() - this._lastFriendsSyncAt > 120000) {
                this._lastFriendsSyncAt = Date.now();
                this.service.pollFriendships();
                this.service.refreshFriendStatuses();
            } else if (typeof window !== 'undefined' && window.presenceService) {
                window.presenceService.fetchOnce(this.service.friends.map(f => f.otherUid)).then(() => this.render());
            }
        }
        if (window.chatService) { window.chatService.syncSubscriptions(); if (typeof window.chatService.pollDmThreads === 'function') window.chatService.pollDmThreads(true); }
        this.render();
        if (this.modal) this.modal.classList.remove('hidden');
        if (this._refreshInterval) clearInterval(this._refreshInterval);
        this._refreshInterval = setInterval(() => {
            if (!this.service || !this.modal || this.modal.classList.contains('hidden')) return;
            const now = Date.now();
            if (this.service._friendshipsErrored || !this.service._unsubFriendships) this.service.pollFriendships();
            if (!this._lastFriendsSyncAt || now - this._lastFriendsSyncAt >= 120000) { this._lastFriendsSyncAt = now; this.service.refreshFriendStatuses(); }
            else this.render();
        }, 60000);
    }
    hide() {
        this.closeDm(false);
        if (this.modal) this.modal.classList.add('hidden');
        if (this._refreshInterval) { clearInterval(this._refreshInterval); this._refreshInterval = null; }
    }

    openDm(friend) {
        if (!friend || !friend.relId) return;
        this.activeDmRelId = friend.relId;
        if (window.chatService) window.chatService.setActiveDm(friend.relId);
        this.render();
    }

    closeDm(rerender = true) {
        this.activeDmRelId = null;
        if (window.chatService) window.chatService.setActiveDm(null);
        if (rerender) this.render();
    }

    setFeedback(msg) {
        this.feedbackText = msg || '';
        const bar = document.getElementById('friends-feedback-bar');
        if (!bar) return;
        bar.textContent = this.feedbackText;
        bar.classList.toggle('hidden', !this.feedbackText);
    }

    updateBadge() {
        const badge = document.getElementById('friends-badge');
        const btn = document.getElementById('btn-friends');
        if (!badge || !this.service) return;
        const dmUnread = (typeof window !== 'undefined' && window.chatService) ? window.chatService.getTotalDmUnread() : 0;
        const count = this.service.getTotalNotificationCount() + dmUnread;
        badge.textContent = count > 9 ? '9+' : String(count);
        badge.classList.toggle('hidden', count <= 0);
        if (btn) btn.classList.toggle('has-notif', count > 0);
    }

    syncPendingNotification() {
        this.updateBadge();
        if (this._deferredFriendReq) {
            const req = this._deferredFriendReq;
            this._deferredFriendReq = null;
            this.showFriendRequestToast(req);
        }
    }

    _syncTabLabels() {
        if (!this.service) return;
        const reqTotal = this.service.incomingRequests.length + this.service.incomingInvites.length;
        const dmUnread = (typeof window !== 'undefined' && window.chatService) ? window.chatService.getTotalDmUnread() : 0;
        const fBtn = document.getElementById('ftab-friends'), rBtn = document.getElementById('ftab-requests'), aBtn = document.getElementById('ftab-add');
        if (fBtn) {
            const pill = dmUnread > 0 ? ` <span class="friends-tab-badge">${dmUnread > 9 ? '9+' : dmUnread}</span>` : '';
            fBtn.innerHTML = `${this.ico('people')} FRIENDS (${this.service.friends.length})${pill}`;
            fBtn.classList.toggle('active', this.activeTab === 'friends');
        }
        if (rBtn) {
            rBtn.innerHTML = `${this.ico('bell')} REQUESTS (${reqTotal})`;
            rBtn.classList.toggle('active', this.activeTab === 'requests');
            rBtn.classList.toggle('has-pending', reqTotal > 0);
        }
        if (aBtn) aBtn.classList.toggle('active', this.activeTab === 'add');
    }

    _getEnrichedFriends() {
        return this.service.friends.map((f) => {
            const live = this.service.friendProfiles[f.otherUid] || {};
            return {
                relId: f.id, uid: f.otherUid,
                name: live.name || f.profile.name, tag: live.tag || f.profile.tag,
                hero: live.hero || f.profile.hero, level: live.level || f.profile.level,
                isOnline: Boolean(live.isOnline), status: live.currentStatus || (live.isOnline ? 'In Lobby' : 'Offline'),
                lastSeenAt: Number(live.lastSeenAt || (f.profile && f.profile.lastSeenAt) || 0),
                coopRoomCode: live.coopRoomCode || null,
                highScore: live.highScore || 0, maxWave: live.maxWave || 1, totalKills: live.totalKills || 0,
                endlessMaxWave: live.endlessMaxWave || 0, olympusMaxFloor: live.olympusMaxFloor || 0,
                cosmetics: live.cosmetics || f.profile.cosmetics || {},
                loadout: live.loadout || null
            };
        }).sort((a, b) => {
            const aScore = (a.coopRoomCode ? 2 : (a.isOnline ? 1 : 0));
            const bScore = (b.coopRoomCode ? 2 : (b.isOnline ? 1 : 0));
            if (aScore !== bScore) return bScore - aScore;
            return (a.name || '').localeCompare(b.name || '');
        });
    }

    render() {
        if (!this.service) return;
        const me = this.service.getMySummary();
        const enriched = this._getEnrichedFriends();
        const onlineCount = enriched.filter(f => f.isOnline || f.coopRoomCode).length;

        const avatarEl = document.getElementById('friends-my-avatar');
        const nameEl = document.getElementById('friends-my-name');
        const tagEl = document.getElementById('friends-my-tag');
        const onlinePill = document.getElementById('friends-online-pill');
        if (avatarEl) avatarEl.src = this.getHeroAvatar(me.selectedHero);
        if (nameEl) nameEl.textContent = `${me.name} · LVL ${me.level}`;
        if (tagEl) tagEl.textContent = me.tag;
        if (onlinePill) {
            onlinePill.innerHTML = `${this.ico(onlineCount > 0 ? 'orb_green' : 'orb_dark')} ${onlineCount} ONLINE`;
            onlinePill.classList.toggle('is-active', onlineCount > 0);
        }

        if (typeof FriendsCardRenderer !== 'undefined') {
            FriendsCardRenderer.decorateMyBanner(
                me,
                document.getElementById('friends-id-banner'),
                document.getElementById('friends-my-avatar-wrap'),
                document.getElementById('friends-my-coins')
            );
        }

        this._syncTabLabels();
        this.setFeedback(this.feedbackText || this.service.lastError || '');

        const body = document.getElementById('friends-modal-body');
        if (!body) return;
        const keepScroll = (this._lastRenderedTab === this.activeTab) ? body.scrollTop : 0;
        this._lastRenderedTab = this.activeTab;
        if (this.activeTab === 'friends') this._renderFriendsTab(body, enriched);
        else if (this.activeTab === 'requests') this._renderRequestsTab(body);
        else this._renderAddTab(body);
        if (keepScroll > 0) body.scrollTop = keepScroll;
    }

    _buildPendingBannerHtml() {
        const n = this.service ? this.service.incomingRequests.length : 0;
        if (n <= 0) return '';
        return `<div class="friends-pending-banner"><span>${this.ico('bell')} You have <b>${n}</b> pending friend request${n > 1 ? 's' : ''}!</span><button type="button" id="friends-banner-view-req" class="friend-btn friend-btn-accept">VIEW REQUESTS</button></div>`;
    }

    _wirePendingBanner() {
        const btn = document.getElementById('friends-banner-view-req');
        if (btn) btn.addEventListener('click', () => { if (window.soundEngine) window.soundEngine.playSelect(); this.activeTab = 'requests'; this.render(); });
    }

    _renderFriendsTab(body, enriched) {
        if (this.activeDmRelId && typeof DirectMessageView !== 'undefined') {
            const dmFriend = enriched.find(f => f.relId === this.activeDmRelId);
            if (dmFriend) { DirectMessageView.render(body, dmFriend, window.chatService, this); return; }
            this.closeDm(false);
        }
        const bannerHtml = this._buildPendingBannerHtml();
        if (!enriched.length) {
            body.innerHTML = `${bannerHtml}<div class="friends-empty"><div class="friends-empty-title">Your Squad Roster is Empty!</div><p>Search by Hero Name or <b>#OnlineID</b> to add friends and launch Co-op together.</p><button type="button" id="friends-empty-add-btn" class="friends-search-btn friends-empty-cta">${this.ico('plus', '+')} FIND FRIENDS</button></div>`;
            this._wirePendingBanner();
            document.getElementById('friends-empty-add-btn')?.addEventListener('click', () => { this.activeTab = 'add'; this.render(); });
            return;
        }
        const onlineTotal = enriched.filter(f => f.isOnline).length;
        const roomTotal = enriched.filter(f => f.coopRoomCode).length;
        const q = (this.friendSearchQuery || '').trim().toLowerCase();
        const visible = enriched.filter((f) => {
            if (this.friendFilter === 'ONLINE' && !f.isOnline && !f.coopRoomCode) return false;
            if (this.friendFilter === 'ROOM' && !f.coopRoomCode) return false;
            return !q || (f.name || '').toLowerCase().includes(q) || (f.tag || '').toLowerCase().includes(q);
        });
        body.innerHTML = `${bannerHtml}
            <div class="friends-toolbar">
                <div class="friends-filter-chips">
                    <button type="button" class="tab-filter-chip ${this.friendFilter === 'ALL' ? 'active' : ''}" data-ffilter="ALL">ALL (${enriched.length})</button>
                    <button type="button" class="tab-filter-chip ${this.friendFilter === 'ONLINE' ? 'active' : ''}" data-ffilter="ONLINE">${this.ico('orb_green')} ONLINE (${onlineTotal})</button>
                    <button type="button" class="tab-filter-chip ${this.friendFilter === 'ROOM' ? 'active' : ''}" data-ffilter="ROOM">${this.ico('gamepad')} IN ROOM (${roomTotal})</button>
                </div>
                <input id="friends-roster-filter" class="friends-quick-input" type="text" maxlength="20" value="${this.esc(this.friendSearchQuery)}" placeholder="Filter roster..." autocomplete="off">
            </div>
            <div id="friends-roster-list" class="friends-list"></div>`;
        this._wirePendingBanner();
        const listEl = document.getElementById('friends-roster-list');
        if (!visible.length) {
            listEl.innerHTML = `<div class="friends-empty">No friends match your filter right now.</div>`;
        } else {
            const appendSection = (label, items) => {
                if (!items.length) return;
                if (visible.length > 1) {
                    const hdr = document.createElement('div');
                    hdr.className = 'friends-section-label';
                    hdr.innerHTML = `${label} (${items.length})`;
                    listEl.appendChild(hdr);
                }
                items.forEach((f) => listEl.appendChild(FriendsCardRenderer.buildFriendCard(f, {
                    isExpanded: this.expandedStatsUid === f.uid,
                    confirmRemove: this.confirmRemoveUid === f.uid,
                    dmUnread: window.chatService ? window.chatService.getDmUnread(f.relId) : 0
                })));
            };
            appendSection(`${this.ico('gamepad')} ACTIVE CO-OP ROOMS`, visible.filter(f => f.coopRoomCode));
            appendSection(`${this.ico('orb_green')} ONLINE`, visible.filter(f => f.isOnline && !f.coopRoomCode));
            appendSection(`${this.ico('orb_dark')} OFFLINE`, visible.filter(f => !f.isOnline && !f.coopRoomCode));
            FriendsCardRenderer.applySocialCosmetics(listEl);
        }

        body.querySelectorAll('[data-ffilter]').forEach((chip) => {
            chip.addEventListener('click', () => {
                this.friendFilter = chip.getAttribute('data-ffilter') || 'ALL';
                if (window.soundEngine) window.soundEngine.playSelect();
                this._renderFriendsTab(body, enriched);
            });
        });

        const quickInput = document.getElementById('friends-roster-filter');
        if (quickInput) {
            quickInput.addEventListener('input', () => {
                this.friendSearchQuery = quickInput.value || '';
                const pos = quickInput.selectionStart;
                this._renderFriendsTab(body, enriched);
                const nextInput = document.getElementById('friends-roster-filter');
                if (nextInput) { nextInput.focus(); nextInput.setSelectionRange(pos, pos); }
            });
        }

        listEl.querySelectorAll('button[data-action]').forEach((btn) => {
            btn.addEventListener('click', (e) => { e.stopPropagation(); this._handleFriendCardAction(btn, enriched); });
        });
    }

    async _handleFriendCardAction(btn, enriched = []) {
        const action = btn.dataset.action;
        const uid = btn.dataset.uid;
        if (action === 'dm') {
            const target = enriched.find(f => f.uid === uid);
            if (target) { if (window.soundEngine) window.soundEngine.playSelect(); this.openDm(target); }
        } else if (action === 'stats') {
            this.expandedStatsUid = (this.expandedStatsUid === uid) ? null : uid;
            if (window.soundEngine) window.soundEngine.playSelect();
            this.render();
        } else if (action === 'profile') {
            const target = enriched.find(f => f.uid === uid);
            if (target && typeof PublicProfileModal !== 'undefined') {
                if (window.soundEngine) window.soundEngine.playSelect();
                PublicProfileModal.open(target);
            }
        } else if (action === 'remove') {
            if (this.confirmRemoveUid !== uid) { this.confirmRemoveUid = uid; this.render(); return; }
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

        if (invites.length) {
            const h = document.createElement('div');
            h.className = 'friends-section-label is-gold';
            h.innerHTML = `${this.ico('gamepad')} LIVE CO-OP INVITES (${invites.length})`;
            wrap.appendChild(h);
            invites.forEach(inv => wrap.appendChild(FriendsCardRenderer.buildInviteCard(inv)));
        }

        if (inc.length) {
            const row = document.createElement('div');
            row.className = 'friends-section-row';
            row.innerHTML = `<span class="friends-section-label">${this.ico('mail')} INCOMING FRIEND REQUESTS (${inc.length})</span>${inc.length > 1 ? `<button type="button" id="friends-accept-all-btn" class="friend-btn friend-btn-accept">${this.ico('check')} ACCEPT ALL</button>` : ''}`;
            wrap.appendChild(row);
            inc.forEach(req => wrap.appendChild(FriendsCardRenderer.buildIncomingReqCard(req)));
        }

        if (out.length) {
            const h = document.createElement('div');
            h.className = 'friends-section-label';
            h.innerHTML = `${this.ico('send')} SENT REQUESTS (${out.length})`;
            wrap.appendChild(h);
            out.forEach(req => wrap.appendChild(FriendsCardRenderer.buildOutgoingReqCard(req)));
        }

        body.innerHTML = '';
        body.appendChild(wrap);

        const acceptAll = document.getElementById('friends-accept-all-btn');
        if (acceptAll) {
            acceptAll.addEventListener('click', async () => {
                acceptAll.disabled = true;
                for (const req of inc) await this.service.acceptFriendRequest(req.id);
                this.setFeedback(`Accepted ${inc.length} friend requests!`);
            });
        }
        wrap.querySelectorAll('[data-accept]').forEach(b => b.addEventListener('click', () => this.service.acceptFriendRequest(b.dataset.accept)));
        wrap.querySelectorAll('[data-decline]').forEach(b => b.addEventListener('click', () => this.service.removeOrDeclineFriendship(b.dataset.decline)));
        wrap.querySelectorAll('[data-dismiss]').forEach(b => b.addEventListener('click', () => this.service.dismissInvite(b.dataset.dismiss)));
        wrap.querySelectorAll('[data-join]').forEach(b => b.addEventListener('click', () => {
            this.joinRoomCode(b.dataset.join, b.dataset.inv);
        }));
    }

    _renderAddTab(body) {
        const searchIco = this.ico('search', '🔍');
        body.innerHTML = `
            <div class="friends-search-bar">
                <input id="friends-search-input" class="friends-search-input" type="text" maxlength="24" value="${this.esc(this.lastQuery)}" placeholder="Search Hero Name or #OnlineID (e.g. #K8M4P2)..." autocomplete="off">
                <button id="friends-search-btn" class="friends-search-btn">${searchIco} FIND</button>
            </div>
            <div class="friends-discover-hint">${this.ico('tip_bulb')} Tip: Tap any player card to inspect their Profile, Equipped Gear &amp; Weapons!</div>
            <div id="friends-search-results" class="friends-list"></div>
        `;

        const input = document.getElementById('friends-search-input');
        const btn = document.getElementById('friends-search-btn');
        const resultsEl = document.getElementById('friends-search-results');

        const runSearch = async () => {
            const q = (input.value || '').trim();
            this.lastQuery = q;
            this.hasSearched = Boolean(q);
            resultsEl.innerHTML = `<div class="friends-empty">Searching players...</div>`;
            const res = q ? await this.service.searchPlayers(q) : await this.service.fetchDiscoverablePlayers();
            if (!res.ok) { resultsEl.innerHTML = `<div class="friends-empty" style="color:#fca5a5;">${this.esc(res.error)}</div>`; return; }
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
                ? `<div class="friends-empty">No players found matching "<b>${this.esc(this.lastQuery)}</b>".<br>Check their exact Name or <b>#OnlineID</b>!</div>`
                : `<div class="friends-empty">No recent active players right now.<br>Search by your friend's exact <b>#OnlineID</b> or <b>Hero Name</b>!</div>`;
            return;
        }
        container.innerHTML = `<div class="friends-section-label">${this.hasSearched ? `${this.ico('search')} SEARCH RESULTS` : `${this.ico('people')} RECENT ACTIVE PLAYERS`} (${this.searchResults.length})</div>`;
        this.searchResults.forEach((u) => {
            container.appendChild(FriendsCardRenderer.buildSearchResultCard(u, this.service.getRelationState(u.uid)));
        });
        FriendsCardRenderer.applySocialCosmetics(container);

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
        if (!window.coopLobbyModal && typeof CoopLobbyModal !== 'undefined') window.coopLobbyModal = new CoopLobbyModal();
        const modal = window.coopLobbyModal;
        if (!modal) return;
        modal.activeTab = 'host'; modal.show();
        const statusEl = document.getElementById('coop-host-status');
        const setStat = (t) => { if (statusEl) { if (typeof UiIcons !== 'undefined') UiIcons.setRichText(statusEl, t, 'ui-icon-sm'); else statusEl.textContent = t; } };
        setStat(`⏳ Opening room before inviting ${friendName}...`);
        const ready = await window.networkManager.waitUntilReady(6500);
        if (ready && modal.roomCode && window.networkManager.isHost) {
            await this.service.sendCoopInvite(friendUid, modal.roomCode, modal.selectedMode || 'story');
            if (statusEl && !window.networkManager.connected) setStat(`📨 Invite sent to ${friendName}! Waiting to connect...`);
        } else { setStat('⚠️ Could not register room on signaling server — please try again.'); }
    }

    joinRoomCode(roomCode, inviteId = null) {
        if (!roomCode) return;
        this.hide();
        if (this.toastEl) this.toastEl.classList.add('hidden');
        if (this.service && typeof this.service.setPendingInvite === 'function') this.service.setPendingInvite(inviteId);
        if (!window.coopLobbyModal && typeof CoopLobbyModal !== 'undefined') window.coopLobbyModal = new CoopLobbyModal();
        const modal = window.coopLobbyModal;
        if (!modal) return;
        if (typeof modal.joinRoomWithCode === 'function') { modal.joinRoomWithCode(roomCode, inviteId); return; }
        modal.activeTab = 'join'; modal.show();
        document.getElementById('coop-tab-join')?.click();
        const inp = document.getElementById('coop-join-code-input'); if (inp) inp.value = roomCode;
        document.getElementById('coop-connect-btn')?.click();
    }

    showInviteToast(invite) {
        if (!this.toastEl || !invite || (window.gameInstance && window.gameInstance.state === 'PLAYING')) return;
        this.toastEl.innerHTML = typeof FriendsCardRenderer !== 'undefined' ? FriendsCardRenderer.buildInviteToastHtml(invite) : '';
        this.toastEl.classList.remove('hidden');
        document.getElementById('toast-join-coop-btn').onclick = () => this.joinRoomCode(invite.roomCode, invite.id);
        document.getElementById('toast-dismiss-coop-btn').onclick = () => { this.service.dismissInvite(invite.id); this.toastEl.classList.add('hidden'); };
    }

    showFriendRequestToast(req) {
        if (!this.reqToastEl || !req) return;
        if (window.gameInstance && window.gameInstance.state === 'PLAYING') { this._deferredFriendReq = req; return; }
        if (this.modal && !this.modal.classList.contains('hidden') && this.activeTab === 'requests') return;
        this.reqToastEl.innerHTML = typeof FriendsCardRenderer !== 'undefined' ? FriendsCardRenderer.buildFriendReqToastHtml(req) : '';
        this.reqToastEl.classList.remove('hidden');
        if (window.soundEngine) window.soundEngine.playSelect();
        document.getElementById('toast-accept-req-btn').onclick = async () => {
            if (window.soundEngine) window.soundEngine.playSelect();
            this.reqToastEl.classList.add('hidden');
            await this.service.acceptFriendRequest(req.id);
            if (this.modal && !this.modal.classList.contains('hidden')) this.render();
        };
        document.getElementById('toast-view-req-btn').onclick = () => { if (window.soundEngine) window.soundEngine.playSelect(); this.reqToastEl.classList.add('hidden'); this.show('requests'); };
        document.getElementById('toast-dismiss-req-btn').onclick = () => this.reqToastEl.classList.add('hidden');
    }
}

if (typeof window !== 'undefined') window.FriendsModal = FriendsModal;
if (typeof module !== 'undefined' && module.exports) module.exports = { FriendsModal };
