/**
 * Lesa.io - Clan Guild Hall Live Chat View (V1.1.0)
 * Native warm-parchment & thick #1e272e comic outline chat inside #clans-modal.
 */

class ClanChatView {
    static esc(str) {
        return typeof ClanCardRenderer !== 'undefined'
            ? ClanCardRenderer.esc(str)
            : String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    static ico(name, fallback = '') {
        return (typeof UiIcons !== 'undefined') ? UiIcons.i(name, 'ui-icon-sm') : fallback;
    }

    static render(container, clan, chatService, modal) {
        if (!container || !clan) return;
        const memCount = Object.keys(clan.members || {}).length || clan.memberCount || 1;
        const motto = clan.motto || 'Forged in Lesa.io • No Leeches Allowed';

        container.innerHTML = `
            <div class="clan-chat-wrap" data-clan-chat-id="${this.esc(clan.id)}">
                <div class="clan-chat-pinned">
                    <div class="clan-chat-pinned-left">
                        ${this.ico('megaphone')}
                        <span><b>[${this.esc(clan.tag)}] GUILD CHAT:</b> ${this.esc(motto)}</span>
                    </div>
                    <span class="clan-chat-count-pill">${this.ico('people')} ${memCount}</span>
                </div>
                <div id="clan-chat-messages" class="clan-chat-stream"></div>
                <div id="clan-chat-error" class="clan-chat-error hidden"></div>
                <form id="clan-chat-form" class="clan-chat-composer" autocomplete="off">
                    <input id="clan-chat-input" class="clan-input clan-chat-input" type="text" maxlength="240" placeholder="Send a message to [${this.esc(clan.tag)}] Guildmates..." autocomplete="off">
                    <button type="submit" id="clan-chat-send-btn" class="clan-btn-blue clan-chat-send-btn">${this.ico('send')} SEND</button>
                </form>
            </div>
        `;

        this.paintMessages(chatService, true);

        const form = document.getElementById('clan-chat-form');
        const input = document.getElementById('clan-chat-input');
        const sendBtn = document.getElementById('clan-chat-send-btn');
        if (form && input) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!chatService) return;
                const txt = input.value;
                if (!txt || !txt.trim()) return;
                if (sendBtn) sendBtn.disabled = true;
                const res = await chatService.sendClanMessage(txt);
                if (sendBtn) sendBtn.disabled = false;
                if (!res.ok) {
                    if (modal) modal.setFeedback(res.error, true);
                    else this.showError(res.error);
                    return;
                }
                this.showError('');
                if (modal) modal.clearFeedback();
                input.value = '';
                if (window.soundEngine) window.soundEngine.playSelect();
                this.paintMessages(chatService, true);
                input.focus();
            });
            setTimeout(() => input.focus(), 35);
        }
    }

    static showError(msg) {
        const el = document.getElementById('clan-chat-error');
        if (!el) return;
        el.textContent = msg || '';
        el.classList.toggle('hidden', !msg);
    }

    static paintMessages(chatService, forceScroll = false) {
        const listEl = document.getElementById('clan-chat-messages');
        if (!listEl || !chatService) return;
        const wasNearBottom = forceScroll || (listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight < 72);
        const myUid = chatService._getMe().uid;
        const msgs = chatService.clanMessages || [];

        if (chatService.lastClanError) this.showError(chatService.lastClanError);

        if (!msgs.length) {
            listEl.innerHTML = `
                <div class="clan-chat-empty">
                    <div>${this.ico('chat')}</div>
                    <div><b>Guild Hall is quiet!</b></div>
                    <div style="font-size:12px;color:#64748b;">Rally Clanmates for Co-op Bounties or celebrate a new Weapon drop.</div>
                </div>
            `;
            return;
        }

        listEl.innerHTML = msgs.map((m) => {
            const isMe = m.senderUid === myUid;
            const roleMeta = (typeof ClanConfigHelper !== 'undefined')
                ? ClanConfigHelper.getRoleMeta(m.senderRole)
                : { label: 'MEMBER', icon: '⚔️', color: '#64748b', text: '#ffffff' };
            const roleIcon = (typeof UiIcons !== 'undefined') ? UiIcons.toHtml(roleMeta.icon, 'ui-icon-xs') : '';
            const av = (typeof ClanCardRenderer !== 'undefined')
                ? ClanCardRenderer.getAvatar(m.senderHero)
                : 'assets/HeroesIcons/PsanasAvatar.png';
            const clock = chatService.formatClock(m.createdAt);

            return `
                <div class="clan-chat-row ${isMe ? 'is-me' : ''}">
                    ${!isMe ? `<img class="clan-chat-avatar" src="${av}" alt="">` : ''}
                    <div class="clan-chat-bubble">
                        <div class="clan-chat-meta">
                            <span class="clan-role-badge" style="background:${roleMeta.color};color:${roleMeta.text};">${roleIcon} ${this.esc(roleMeta.label)}</span>
                            <span class="clan-chat-sender">${isMe ? 'You' : this.esc(m.senderName)}</span>
                            <span class="clan-chat-lvl">Lv.${Number(m.senderLevel || 1)}</span>
                            <span class="clan-chat-time">${this.esc(clock)}</span>
                        </div>
                        <div class="clan-chat-text">${this.esc(m.text)}</div>
                    </div>
                </div>
            `;
        }).join('');

        if (wasNearBottom) listEl.scrollTop = listEl.scrollHeight;
    }
}

if (typeof window !== 'undefined') window.ClanChatView = ClanChatView;
if (typeof module !== 'undefined' && module.exports) module.exports = { ClanChatView };
