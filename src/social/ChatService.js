/**
 * Lesa.io - Real-Time Friend Direct Messages & Clan Guild Chat Service (V1.1.0)
 * Streams Firestore subcollections `friendships/{relId}/messages` and `clans/{clanId}/messages`,
 * tracks local read cursors for unread badges, and enforces client sanitization + anti-spam limits.
 */

class ChatService {
    static MAX_MSG_LEN = 240;
    static SEND_COOLDOWN_MS = 700;
    static DM_LIMIT = 40;
    static CLAN_LIMIT = 50;
    static MAX_DM_WATCHERS = 25;

    static boot() {
        if (typeof window !== 'undefined' && window.chatService) {
            window.chatService.syncSubscriptions();
            return window.chatService;
        }
        const svc = new ChatService();
        if (typeof window !== 'undefined') window.chatService = svc;
        svc.start();
        return svc;
    }

    constructor() {
        this.readKey = 'lesaio_chat_read_v1';
        this.readCursors = this._loadReadCursors();
        this.dmThreads = {};       // { [relId]: Message[] }
        this.dmMeta = {};          // { [relId]: { unread, lastText, lastAt } }
        this.dmErrors = {};        // { [relId]: string }
        this._dmUnsubs = {};       // { [relId]: fn }
        this._dmPollTimer = null;
        this._lastDmBgPoll = 0;
        this.clanMessages = [];
        this.clanUnread = 0;
        this._watchedClanId = null;
        this._unsubClanChat = null;
        this._clanPollTimer = null;
        this._activeDmRelId = null;
        this._isClanChatOpen = false;
        this._lastSendAt = 0;
        this._bootTimer = null;
        this.lastDmError = '';
        this.lastClanError = '';
    }

    _edge() {
        return (typeof window !== 'undefined' && window.edgeApi && window.edgeApi.isEnabled()) ? window.edgeApi : null;
    }

    _loadReadCursors() {
        try {
            const raw = localStorage.getItem(this.readKey);
            if (raw) {
                const p = JSON.parse(raw);
                return { dm: (p && p.dm) || {}, clan: (p && p.clan) || {} };
            }
        } catch (_) {}
        return { dm: {}, clan: {} };
    }

    _saveReadCursors() {
        try { localStorage.setItem(this.readKey, JSON.stringify(this.readCursors)); } catch (_) {}
    }

    _ts(val) {
        if (typeof val === 'number' && Number.isFinite(val)) return val;
        if (val && typeof val.toMillis === 'function') return val.toMillis();
        if (val && typeof val.seconds === 'number') return val.seconds * 1000;
        return 0;
    }

    _cleanText(raw) {
        return String(raw || '').replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, ChatService.MAX_MSG_LEN);
    }

    _getDb() {
        if (typeof window !== 'undefined' && window.cloudSave && window.cloudSave.isInitialized) {
            return window.cloudSave.db;
        }
        return null;
    }

    _getMe() {
        const fs = (typeof window !== 'undefined') ? window.friendService : null;
        if (fs && typeof fs.getMySummary === 'function') {
            const s = fs.getMySummary();
            return {
                uid: s.uid || fs.getMyUid(),
                name: s.name || 'Hero',
                tag: s.tag || '',
                hero: s.selectedHero || 'psanas',
                level: Math.max(1, Number(s.level) || 1)
            };
        }
        const cs = (typeof window !== 'undefined') ? window.clanService : null;
        if (cs && typeof cs.getMyPlayerMeta === 'function') return cs.getMyPlayerMeta();
        return { uid: localStorage.getItem('lesaio_player_uid') || '', name: localStorage.getItem('lesaio_player_name') || 'Hero', tag: '', hero: 'psanas', level: 1 };
    }

    _describeErr(err) {
        const code = err && err.code ? String(err.code) : '';
        if (code === 'permission-denied') return 'Firestore permission denied — update Firestore Rules to allow chat messages.';
        if (code === 'unavailable') return 'Cloud offline — check your internet connection.';
        return (err && err.message) ? err.message : 'Message failed to send.';
    }

    start() {
        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.on('friendsUpdated', () => this.syncSubscriptions());
            window.EventBus.on('clansUpdated', () => this.syncSubscriptions());
            window.EventBus.on('cloudSaveReady', () => this.syncSubscriptions());
        }
        this.syncSubscriptions();
        if (!this._bootTimer) {
            let tries = 0;
            this._bootTimer = setInterval(() => {
                tries += 1;
                this.syncSubscriptions();
                if (((this._getDb() || this._edge()) && tries >= 3) || tries >= 12) {
                    clearInterval(this._bootTimer);
                    this._bootTimer = null;
                }
            }, 1500);
        }
    }

    syncSubscriptions() {
        const db = this._getDb(), edge = this._edge();
        if (!db && !edge) return;
        this._syncDmListeners(db, edge);
        this._syncClanListener(db);
    }

    _applyDmMessages(relId, list) {
        delete this.dmErrors[relId];
        this.lastDmError = '';
        this.dmThreads[relId] = list;
        if (this._activeDmRelId === relId && list.length) {
            const latestTs = Math.max(Date.now(), list[list.length - 1].createdAt);
            this.readCursors.dm[relId] = Math.max(Number(this.readCursors.dm[relId]) || 0, latestTs);
            this._saveReadCursors();
        }
        this._recomputeDmMeta(relId);
        this._emit();
    }

    async _fetchEdgeDm(relId, limit = ChatService.DM_LIMIT) {
        const edge = this._edge();
        if (!edge || !relId) return 'fallback';
        const er = await edge.get(`/messages/${encodeURIComponent(`dm:${relId}`)}?limit=${limit}`).catch(() => null);
        if (er && !er.fallback && er.ok && Array.isArray(er.messages)) {
            const list = er.messages.map(d => ({
                id: String(d.id || `edge_${d.createdAt}`),
                senderUid: d.senderUid || '',
                senderName: d.senderName || 'Hero',
                senderHero: d.senderHero || 'psanas',
                text: String(d.text || ''),
                createdAt: this._ts(d.createdAt)
            }));
            this._applyDmMessages(relId, list);
            return 'ok';
        }
        if (er && er.fallback) return 'fallback';
        this.dmErrors[relId] = (er && er.error) || 'Could not load messages.';
        if (this._activeDmRelId === relId) this.lastDmError = this.dmErrors[relId];
        return 'err';
    }

    async pollDmThreads(force = false) {
        const edge = this._edge();
        if (!edge) return;
        if (this._activeDmRelId) {
            const st = await this._fetchEdgeDm(this._activeDmRelId);
            if (st === 'fallback') {
                const db = this._getDb();
                if (db) this._bindAllFirestoreDms(db);
                return;
            }
        }
        const now = Date.now();
        if (!force && this._lastDmBgPoll && now - this._lastDmBgPoll < 22000) return;
        this._lastDmBgPoll = now;
        const fs = (typeof window !== 'undefined') ? window.friendService : null;
        const friends = (fs && Array.isArray(fs.friends)) ? fs.friends.slice(0, 12) : [];
        await Promise.all(friends.filter(f => f && f.id && f.id !== this._activeDmRelId).map(f => this._fetchEdgeDm(f.id, 10)));
    }

    _bindFirestoreDm(db, relId) {
        if (!db || !relId || this._dmUnsubs[relId]) return;
        this._dmUnsubs[relId] = db.collection('friendships').doc(relId).collection('messages')
            .orderBy('createdAt', 'desc').limit(ChatService.DM_LIMIT)
            .onSnapshot((snap) => {
                const list = snap.docs.map(doc => {
                    const d = doc.data() || {};
                    return { id: doc.id, senderUid: d.senderUid || '', senderName: d.senderName || 'Hero', senderHero: d.senderHero || 'psanas', text: String(d.text || ''), createdAt: this._ts(d.createdAt) };
                }).reverse();
                this._applyDmMessages(relId, list);
            }, (err) => {
                this.dmErrors[relId] = this._describeErr(err);
                if (this._activeDmRelId === relId) this.lastDmError = this.dmErrors[relId];
            });
    }

    _bindAllFirestoreDms(db) {
        if (this._dmPollTimer) { clearInterval(this._dmPollTimer); this._dmPollTimer = null; }
        const fs = (typeof window !== 'undefined') ? window.friendService : null;
        const friends = (fs && Array.isArray(fs.friends)) ? fs.friends.slice(0, ChatService.MAX_DM_WATCHERS) : [];
        const wanted = new Set(friends.map(f => f.id).filter(Boolean));
        if (this._activeDmRelId) wanted.add(this._activeDmRelId);
        wanted.forEach((relId) => this._bindFirestoreDm(db, relId));
    }

    _syncDmListeners(db, edge = this._edge()) {
        const fs = (typeof window !== 'undefined') ? window.friendService : null;
        const friends = (fs && Array.isArray(fs.friends)) ? fs.friends.slice(0, ChatService.MAX_DM_WATCHERS) : [];
        const wanted = new Set(friends.map(f => f.id).filter(Boolean));
        if (this._activeDmRelId) wanted.add(this._activeDmRelId);

        Object.keys(this._dmUnsubs).forEach((relId) => {
            if (!wanted.has(relId) || edge) {
                try { this._dmUnsubs[relId](); } catch (_) {}
                delete this._dmUnsubs[relId];
            }
        });
        Object.keys(this.dmThreads).forEach((relId) => {
            if (!wanted.has(relId)) {
                delete this.dmThreads[relId]; delete this.dmMeta[relId]; delete this.dmErrors[relId];
            }
        });

        if (edge) {
            if (!this._dmPollTimer && wanted.size > 0) {
                this.pollDmThreads(false);
                this._dmPollTimer = setInterval(() => {
                    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
                    if (this._activeDmRelId || !this._lastDmBgPoll || Date.now() - this._lastDmBgPoll >= 25000) {
                        this.pollDmThreads(false);
                    }
                }, 2500);
            } else if (wanted.size === 0 && this._dmPollTimer) {
                clearInterval(this._dmPollTimer); this._dmPollTimer = null;
            }
            return;
        }
        if (this._dmPollTimer) { clearInterval(this._dmPollTimer); this._dmPollTimer = null; }
        wanted.forEach((relId) => this._bindFirestoreDm(db, relId));
    }

    _recomputeDmMeta(relId) {
        const myUid = this._getMe().uid;
        const list = this.dmThreads[relId] || [];
        const cursor = Number(this.readCursors.dm[relId]) || 0;
        let unread = 0;
        if (this._activeDmRelId !== relId) {
            for (let i = 0; i < list.length; i++) {
                const m = list[i];
                if (m.senderUid && m.senderUid !== myUid && m.createdAt > cursor) unread++;
            }
        }
        const last = list.length ? list[list.length - 1] : null;
        this.dmMeta[relId] = {
            unread,
            lastText: last ? last.text : '',
            lastAt: last ? last.createdAt : 0
        };
    }

    _syncClanListener(db) {
        const cs = (typeof window !== 'undefined') ? window.clanService : null;
        const clanId = (cs && cs.currentClan && cs.currentClan.id) ? cs.currentClan.id : (cs && cs.clanId ? cs.clanId : null);
        const edge = (typeof window !== 'undefined' && window.edgeApi && window.edgeApi.isEnabled()) ? window.edgeApi : null;
        if (clanId === this._watchedClanId && (this._unsubClanChat || this._clanPollTimer)) return;

        if (this._unsubClanChat) { try { this._unsubClanChat(); } catch (_) {} this._unsubClanChat = null; }
        if (this._clanPollTimer) { clearInterval(this._clanPollTimer); this._clanPollTimer = null; }
        this._watchedClanId = clanId;
        this.clanMessages = [];
        this.clanUnread = 0;
        if (!clanId) { this._emit(); return; }

        const applyMsgs = (list) => {
            this.lastClanError = '';
            this.clanMessages = list;
            if (this._isClanChatOpen && list.length) {
                const latestTs = Math.max(Date.now(), list[list.length - 1].createdAt);
                this.readCursors.clan[clanId] = Math.max(Number(this.readCursors.clan[clanId]) || 0, latestTs);
                this._saveReadCursors();
            }
            this._recomputeClanUnread();
            this._emit();
        };
        const bindFirestore = () => {
            if (!db || this._unsubClanChat) return;
            this._unsubClanChat = db.collection('clans').doc(clanId).collection('messages')
                .orderBy('createdAt', 'desc').limit(ChatService.CLAN_LIMIT)
                .onSnapshot((snap) => {
                    const list = snap.docs.map(doc => {
                        const d = doc.data() || {};
                        return { id: doc.id, senderUid: d.senderUid || '', senderName: d.senderName || 'Hero', senderHero: d.senderHero || 'psanas', senderRole: d.senderRole || 'member', senderLevel: Math.max(1, Number(d.senderLevel) || 1), text: String(d.text || ''), createdAt: this._ts(d.createdAt) };
                    }).reverse();
                    applyMsgs(list);
                }, (err) => { this.lastClanError = this._describeErr(err); });
        };

        if (edge) {
            const pollEdge = async () => {
                if (this._watchedClanId !== clanId) return;
                const er = await edge.get(`/messages/${encodeURIComponent(`clan:${clanId}`)}?limit=${ChatService.CLAN_LIMIT}`).catch(() => null);
                if (er && !er.fallback && er.ok && Array.isArray(er.messages)) { applyMsgs(er.messages); return; }
                if (er && er.fallback) { if (this._clanPollTimer) { clearInterval(this._clanPollTimer); this._clanPollTimer = null; } bindFirestore(); }
            };
            pollEdge();
            this._clanPollTimer = setInterval(() => {
                if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
                if (this._isClanChatOpen || !this._lastClanBgPoll || Date.now() - this._lastClanBgPoll > 25000) {
                    this._lastClanBgPoll = Date.now();
                    pollEdge();
                }
            }, 5000);
            return;
        }
        bindFirestore();
    }

    _recomputeClanUnread() {
        const clanId = this._watchedClanId;
        if (!clanId || this._isClanChatOpen) { this.clanUnread = 0; return; }
        const myUid = this._getMe().uid;
        const cursor = Number(this.readCursors.clan[clanId]) || 0;
        let unread = 0;
        for (let i = 0; i < this.clanMessages.length; i++) {
            const m = this.clanMessages[i];
            if (m.senderUid && m.senderUid !== myUid && m.createdAt > cursor) unread++;
        }
        this.clanUnread = unread;
    }

    setActiveDm(relId) {
        this._activeDmRelId = relId || null;
        this.lastDmError = relId ? (this.dmErrors[relId] || '') : '';
        if (relId) {
            this.markDmRead(relId);
            this.syncSubscriptions();
            if (this._edge()) this._fetchEdgeDm(relId);
        }
        this._emit();
    }

    markDmRead(relId) {
        if (!relId) return;
        const list = this.dmThreads[relId] || [];
        const latest = list.length ? Math.max(Date.now(), list[list.length - 1].createdAt) : Date.now();
        this.readCursors.dm[relId] = Math.max(Number(this.readCursors.dm[relId]) || 0, latest);
        this._saveReadCursors();
        this._recomputeDmMeta(relId);
    }

    setClanChatOpen(isOpen) {
        this._isClanChatOpen = !!isOpen;
        if (isOpen) this.syncSubscriptions();
        if (isOpen && this._watchedClanId) {
            const list = this.clanMessages;
            const latest = list.length ? Math.max(Date.now(), list[list.length - 1].createdAt) : Date.now();
            this.readCursors.clan[this._watchedClanId] = Math.max(Number(this.readCursors.clan[this._watchedClanId]) || 0, latest);
            this._saveReadCursors();
        }
        this._recomputeClanUnread();
        this._emit();
    }

    getDmMessages(relId) { return this.dmThreads[relId] || []; }
    getDmError(relId) { return (relId && this.dmErrors[relId]) || ''; }
    getDmUnread(relId) { return (this.dmMeta[relId] && this.dmMeta[relId].unread) || 0; }
    getTotalDmUnread() {
        return Object.keys(this.dmMeta).reduce((sum, id) => sum + ((this.dmMeta[id] && this.dmMeta[id].unread) || 0), 0);
    }
    getClanUnread() { return this.clanUnread || 0; }

    async sendDirectMessage(relId, text) {
        const db = this._getDb(), edge = this._edge(), me = this._getMe(), clean = this._cleanText(text);
        if (!edge && !db) return { ok: false, error: 'Cloud service offline.' };
        if (!relId || !me.uid) return { ok: false, error: 'Invalid friend channel.' };
        if (!clean) return { ok: false, error: 'Enter a message first.' };
        const now = Date.now();
        if (now - this._lastSendAt < ChatService.SEND_COOLDOWN_MS) return { ok: false, error: 'Slow down a tiny bit!' };
        this._lastSendAt = now;
        const msgBody = {
            senderUid: me.uid,
            senderName: String(me.name || 'Hero').slice(0, 32),
            senderHero: String(me.hero || 'psanas').slice(0, 32),
            text: clean,
            createdAt: now
        };
        try {
            let sentEdge = false;
            if (edge) {
                const er = await edge.post(`/messages/${encodeURIComponent(`dm:${relId}`)}`, msgBody).catch(() => null);
                if (er && !er.fallback) {
                    if (!er.ok) return { ok: false, error: er.error || 'Message failed to send.' };
                    sentEdge = true;
                }
            }
            if (!sentEdge) {
                if (!db) return { ok: false, error: 'Cloud service offline.' };
                await db.collection('friendships').doc(relId).collection('messages').add(msgBody);
            }
            const cur = this.dmThreads[relId] || [];
            if (!cur.some(m => m.senderUid === me.uid && m.createdAt === now && m.text === clean)) {
                this.dmThreads[relId] = [...cur, { id: `${sentEdge ? 'edge' : 'local'}_${now}`, ...msgBody }].slice(-ChatService.DM_LIMIT);
            }
            delete this.dmErrors[relId]; this.lastDmError = '';
            this.readCursors.dm[relId] = Math.max(Number(this.readCursors.dm[relId]) || 0, now);
            this._saveReadCursors();
            this._recomputeDmMeta(relId);
            this._emit();
            return { ok: true };
        } catch (err) {
            return { ok: false, error: this._describeErr(err) };
        }
    }

    async sendClanMessage(text) {
        const db = this._getDb();
        const me = this._getMe();
        const cs = (typeof window !== 'undefined') ? window.clanService : null;
        const clan = cs && cs.currentClan ? cs.currentClan : null;
        const clean = this._cleanText(text);
        if (!db) return { ok: false, error: 'Cloud service offline.' };
        if (!clan || !clan.id || !me.uid) return { ok: false, error: 'Join a Clan to use Clan Chat.' };
        const myMem = (clan.members && clan.members[me.uid]) || null;
        if (!myMem) return { ok: false, error: 'You must be an active Clan member.' };
        if (!clean) return { ok: false, error: 'Enter a message first.' };
        const now = Date.now();
        if (now - this._lastSendAt < ChatService.SEND_COOLDOWN_MS) return { ok: false, error: 'Slow down a tiny bit!' };
        this._lastSendAt = now;
        try {
            const msgBody = {
                senderUid: me.uid,
                senderName: String(me.name || 'Hero').slice(0, 32),
                senderHero: String(me.hero || 'psanas').slice(0, 32),
                senderRole: String(myMem.role || 'member'),
                senderLevel: Math.max(1, Number(me.level) || 1),
                text: clean,
                createdAt: now
            };
            const edge = (typeof window !== 'undefined' && window.edgeApi && window.edgeApi.isEnabled()) ? window.edgeApi : null;
            let sentEdge = false;
            if (edge) {
                const er = await edge.post(`/messages/${encodeURIComponent(`clan:${clan.id}`)}`, msgBody).catch(() => null);
                if (er && !er.fallback) {
                    if (!er.ok) return { ok: false, error: er.error || 'Message failed.' };
                    this.clanMessages = [...this.clanMessages, { id: `edge_${now}`, ...msgBody }].slice(-ChatService.CLAN_LIMIT);
                    sentEdge = true;
                }
            }
            if (!sentEdge) await db.collection('clans').doc(clan.id).collection('messages').add(msgBody);
            this.readCursors.clan[clan.id] = Math.max(Number(this.readCursors.clan[clan.id]) || 0, now);
            this._saveReadCursors();
            this._emit();
            return { ok: true };
        } catch (err) {
            return { ok: false, error: this._describeErr(err) };
        }
    }

    formatClock(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        const diffDays = Math.floor((Date.now() - ts) / 86400000);
        if (diffDays <= 0) return `${hh}:${mm}`;
        if (diffDays === 1) return `Yesterday ${hh}:${mm}`;
        return `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`;
    }

    _emit() {
        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.emit('socialChatUpdated', {
                totalDmUnread: this.getTotalDmUnread(),
                clanUnread: this.getClanUnread()
            });
        }
    }
}

if (typeof window !== 'undefined') window.ChatService = ChatService;
if (typeof module !== 'undefined' && module.exports) module.exports = { ChatService };
