/**
 * Lesa.io - Direct Message Conversation View for Friends Modal (V1.1.0)
 * Renders a live 1-on-1 DM thread inside #friends-modal without losing draft focus.
 */

class DirectMessageView {
    static esc(str) {
        return typeof FriendsCardRenderer !== 'undefined'
            ? FriendsCardRenderer.esc(str)
            : String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    static ico(name, fallback = '') {
        return (typeof UiIcons !== 'undefined') ? UiIcons.i(name, 'ui-icon-sm') : fallback;
    }

    static getAvatar(heroId) {
        return typeof FriendsCardRenderer !== 'undefined'
            ? FriendsCardRenderer.getHeroAvatar(heroId)
            : 'assets/HeroesIcons/PsanasAvatar.png';
    }

    static render(container, friend, chatService, modal) {
        if (!container || !friend) return;
        const avatar = this.getAvatar(friend.hero);
        const roomAction = friend.coopRoomCode
            ? `<button type="button" class="friend-btn friend-btn-join" data-dm-act="join" data-code="${this.esc(friend.coopRoomCode)}">${this.ico('rocket')} JOIN ROOM</button>`
            : `<button type="button" class="friend-btn friend-btn-primary" data-dm-act="invite" ${friend.isOnline ? '' : 'disabled title="Friend is offline"'}>${this.ico('swords')} INVITE</button>`;
        const statusHtml = friend.coopRoomCode
            ? `<span class="friend-room-pill">${this.ico('gamepad')} ROOM ${this.esc(friend.coopRoomCode)}</span>`
            : `<span class="dm-sub-status">${this.ico(friend.isOnline ? 'orb_green' : 'orb_dark')} ${this.esc(friend.status || (friend.isOnline ? 'In Lobby' : 'Offline'))}</span>`;

        container.innerHTML = `
            <div class="dm-view" data-dm-rel="${this.esc(friend.relId)}">
                <div class="dm-topbar">
                    <button type="button" id="dm-back-btn" class="friend-btn friend-btn-muted">${this.ico('play', '&lsaquo;')} BACK</button>
                    <div class="dm-peer">
                        <div class="friend-avatar-wrap">
                            <img class="dm-peer-avatar" src="${avatar}" alt="Hero">
                            <span class="friend-presence-dot ${friend.isOnline ? 'online' : ''}"></span>
                        </div>
                        <div class="dm-peer-meta">
                            <div class="friend-name-line">
                                ${friend.clanTag ? `<span class="clan-inline-tag">[${this.esc(friend.clanTag)}]</span>` : ''}
                                <span class="dm-peer-name">${this.esc(friend.name)}</span>
                                <span class="friend-tag-chip">${this.esc(friend.tag || '')}</span>
                            </div>
                            <div>${statusHtml}</div>
                        </div>
                    </div>
                    <div class="dm-topbar-actions">
                        <button type="button" class="friend-btn friend-btn-muted" data-dm-act="profile" title="Inspect Gear &amp; Profile">${this.ico('hero_card')} CARD</button>
                        ${roomAction}
                    </div>
                </div>
                <div id="dm-chat-messages" class="dm-messages"></div>
                <div id="dm-chat-error" class="dm-inline-error hidden"></div>
                <form id="dm-chat-form" class="dm-composer" autocomplete="off">
                    <input id="dm-chat-input" class="dm-chat-input" type="text" maxlength="240" placeholder="Message ${this.esc(friend.name)}..." autocomplete="off">
                    <button type="submit" id="dm-chat-send-btn" class="friend-btn friend-btn-primary dm-send-btn">${this.ico('send')} SEND</button>
                </form>
            </div>
        `;

        this.paintMessages(friend.relId, chatService);

        const backBtn = document.getElementById('dm-back-btn');
        if (backBtn) backBtn.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playGoBack();
            modal.closeDm();
        });

        container.querySelectorAll('[data-dm-act]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const act = btn.dataset.dmAct;
                if (act === 'profile' && typeof PublicProfileModal !== 'undefined') {
                    if (window.soundEngine) window.soundEngine.playSelect();
                    PublicProfileModal.open(friend);
                } else if (act === 'invite') {
                    modal.inviteFriendToCoop(friend.uid, friend.name);
                } else if (act === 'join') {
                    modal.joinRoomCode(btn.dataset.code);
                }
            });
        });

        const form = document.getElementById('dm-chat-form');
        const input = document.getElementById('dm-chat-input');
        const sendBtn = document.getElementById('dm-chat-send-btn');
        if (form && input) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!chatService) return;
                const txt = input.value;
                if (!txt || !txt.trim()) return;
                if (sendBtn) sendBtn.disabled = true;
                const res = await chatService.sendDirectMessage(friend.relId, txt);
                if (sendBtn) sendBtn.disabled = false;
                if (!res.ok) {
                    this.showError(res.error);
                    return;
                }
                this.showError('');
                input.value = '';
                if (window.soundEngine) window.soundEngine.playSelect();
                this.paintMessages(friend.relId, chatService, true);
                input.focus();
            });
            setTimeout(() => input.focus(), 35);
        }
    }

    static showError(msg) {
        const el = document.getElementById('dm-chat-error');
        if (!el) return;
        el.textContent = msg || '';
        el.classList.toggle('hidden', !msg);
    }

    static paintMessages(relId, chatService, forceScroll = false) {
        const listEl = document.getElementById('dm-chat-messages');
        if (!listEl || !chatService) return;
        const wrap = listEl.closest('.dm-view');
        if (wrap && wrap.dataset.dmRel !== relId) return;

        const wasNearBottom = forceScroll || (listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight < 64);
        const myUid = chatService._getMe().uid;
        const msgs = chatService.getDmMessages(relId);

        if (chatService.lastDmError) this.showError(chatService.lastDmError);

        if (!msgs.length) {
            listEl.innerHTML = `
                <div class="dm-empty-thread">
                    <div class="dm-empty-ico">${this.ico('chat')}</div>
                    <div>No messages yet — say hey or coordinate your next Co-op run!</div>
                </div>
            `;
            return;
        }

        listEl.innerHTML = msgs.map((m) => {
            const isMe = m.senderUid === myUid;
            const timeTxt = chatService.formatClock(m.createdAt);
            const av = this.getAvatar(m.senderHero);
            return `
                <div class="dm-msg-row ${isMe ? 'is-me' : 'is-them'}">
                    ${!isMe ? `<img class="dm-msg-avatar" src="${av}" alt="">` : ''}
                    <div class="dm-msg-bubble">
                        <div class="dm-msg-meta">
                            <span class="dm-msg-sender">${isMe ? 'You' : this.esc(m.senderName)}</span>
                            <span class="dm-msg-time">${this.esc(timeTxt)}</span>
                        </div>
                        <div class="dm-msg-text">${this.esc(m.text)}</div>
                    </div>
                </div>
            `;
        }).join('');

        if (wasNearBottom) listEl.scrollTop = listEl.scrollHeight;
    }
}

if (typeof window !== 'undefined') window.DirectMessageView = DirectMessageView;
if (typeof module !== 'undefined' && module.exports) module.exports = { DirectMessageView };
