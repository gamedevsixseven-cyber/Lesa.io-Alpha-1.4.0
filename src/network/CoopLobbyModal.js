/**
 * Lesa.io - Co-op Multiplayer Lobby Controller
 * Handles room creation, friend code sharing, mode selection, and match kickoff
 */

class CoopLobbyModal {
    constructor() {
        this.modal = null;
        this.selectedMode = 'story';
        this.selectedEndlessHard = false;
        this.activeTab = 'host';
        this.roomCode = '';
        this.peerData = null;
        this.connectedPeers = [];
        this.hostInfo = null;

        this.init();
    }

    init() {
        this.ensureModalMarkup();
        this.bindEvents();
    }

    getLocalUserData() {
        return (typeof CoopPeerRoster !== 'undefined' && CoopPeerRoster.buildLocalUserData)
            ? CoopPeerRoster.buildLocalUserData()
            : { name: 'Hero', heroType: 'psanas', weaponType: 'pea', maxHp: 100, damageReduction: 0, magnetRadius: 140 };
    }

    ensureModalMarkup() {
        if (document.getElementById('coop-modal')) {
            this.modal = document.getElementById('coop-modal');
            return;
        }

        const div = document.createElement('div');
        div.id = 'coop-modal';
        div.className = 'modal-overlay hidden';
        div.innerHTML = `
            <div class="coop-panel">
                <div class="coop-header">
                    <div class="coop-title-wrap">
                        <h2 class="coop-title">${typeof UiIcons !== 'undefined' ? UiIcons.i('handshake', 'ui-icon-title') : '🤝'} CO-OP SQUAD</h2>
                        <span class="coop-badge">4P ONLINE</span>
                    </div>
                    <button id="coop-close-btn" class="coop-close-btn" title="Close">✕</button>
                </div>

                <div class="coop-tabs">
                    <button id="coop-tab-host" class="coop-tab-btn active">${typeof UiIcons !== 'undefined' ? UiIcons.i('crown', 'ui-icon-sm') : '👑'} HOST GAME</button>
                    <button id="coop-tab-join" class="coop-tab-btn">${typeof UiIcons !== 'undefined' ? UiIcons.i('rocket', 'ui-icon-sm') : '🚀'} JOIN GAME</button>
                </div>

                <!-- Host Tab -->
                <div id="coop-content-host" class="coop-tab-content active">
                    <div class="coop-code-box">
                        <span class="coop-code-label">YOUR ROOM CODE (UP TO 4 PLAYERS)</span>
                        <span id="coop-host-code" class="coop-code-digits">----</span>
                        <button id="coop-copy-code-btn" class="coop-copy-btn">${typeof UiIcons !== 'undefined' ? UiIcons.i('copy', 'ui-icon-sm') : '📋'} COPY CODE</button>
                    </div>

                    <div>
                        <span class="coop-code-label" style="display:block; margin-bottom: 6px;">SELECT GAME MODE:</span>
                        <div class="coop-mode-picker">
                            <button id="coop-mode-story" class="coop-mode-btn selected">${typeof UiIcons !== 'undefined' ? UiIcons.i('book', 'ui-icon-sm') : '📖'} STORY</button>
                            <button id="coop-mode-endless" class="coop-mode-btn">${typeof UiIcons !== 'undefined' ? UiIcons.i('bolt', 'ui-icon-sm') : '⚡'} ENDLESS</button>
                            <button id="coop-mode-endless-hard" class="coop-mode-btn is-hard">🔥 ENDLESS HARD</button>
                        </div>
                    </div>

                    <div class="coop-status-row">
                        <div id="coop-host-dot" class="coop-status-dot"></div>
                        <span id="coop-host-status">Waiting for squadmates (1/4)...</span>
                    </div>

                    <div id="coop-host-roster" class="coop-squad-roster"></div>

                    <div id="coop-friend-quicklist" class="coop-friend-quicklist"></div>

                    <button id="coop-start-btn" class="coop-launch-btn" disabled>START CO-OP BATTLE</button>
                </div>

                <!-- Join Tab -->
                <div id="coop-content-join" class="coop-tab-content">
                    <div class="coop-input-wrap">
                        <span class="coop-code-label">ENTER 4-DIGIT ROOM CODE:</span>
                        <input id="coop-join-code-input" class="coop-code-input" type="text" maxlength="6" placeholder="e.g. 7429" autocomplete="off">
                    </div>

                    <div class="coop-status-row">
                        <div id="coop-join-dot" class="coop-status-dot"></div>
                        <span id="coop-join-status">Enter code and click Connect</span>
                    </div>

                    <div id="coop-join-roster" class="coop-squad-roster"></div>

                    <button id="coop-connect-btn" class="coop-launch-btn">CONNECT TO HOST</button>
                </div>
            </div>
        `;
        document.body.appendChild(div);
        this.modal = div;
    }

    bindEvents() {
        const closeBtn = document.getElementById('coop-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hide();
                if (window.networkManager && (!window.gameInstance || !window.gameInstance.coopSession)) {
                    window.networkManager.disconnect();
                }
            });
        }

        const tabHost = document.getElementById('coop-tab-host');
        const tabJoin = document.getElementById('coop-tab-join');
        const contentHost = document.getElementById('coop-content-host');
        const contentJoin = document.getElementById('coop-content-join');

        tabHost.addEventListener('click', () => {
            this.activeTab = 'host';
            tabHost.classList.add('active'); tabJoin.classList.remove('active');
            contentHost.classList.add('active'); contentJoin.classList.remove('active');
            this.setupHostRoom();
        });

        tabJoin.addEventListener('click', () => {
            this.activeTab = 'join';
            tabJoin.classList.add('active'); tabHost.classList.remove('active');
            contentJoin.classList.add('active'); contentHost.classList.remove('active');
            if (window.friendService) window.friendService.setPresenceStatus('In Lobby', null);
            this.resetJoinUI();
        });

        // Mode selectors
        const btnStory = document.getElementById('coop-mode-story');
        const btnEndless = document.getElementById('coop-mode-endless');
        const btnHard = document.getElementById('coop-mode-endless-hard');
        btnStory.addEventListener('click', () => { this.selectedMode = 'story'; this.selectedEndlessHard = false; this._syncModePickerUI(); this._syncHostPresence(); });
        btnEndless.addEventListener('click', () => { this.selectedMode = 'endless'; this.selectedEndlessHard = false; this._syncModePickerUI(); this._syncHostPresence(); });
        btnHard?.addEventListener('click', () => {
            const mc = window.menuController || (window.gameInstance && window.gameInstance.ui && window.gameInstance.ui.menuController);
            const unlocked = !mc || typeof mc.isEndlessHardUnlocked !== 'function' || mc.isEndlessHardUnlocked();
            if (!unlocked) {
                if (window.soundEngine) (window.soundEngine.playGoBack || window.soundEngine.playSelect).call(window.soundEngine);
                const statusEl = document.getElementById('coop-host-status');
                if (statusEl) statusEl.textContent = '🔒 Reach Wave 30 in Endless Mode to unlock Co-op Endless Hard!';
                btnHard.classList.remove('crest-shake'); void btnHard.offsetWidth; btnHard.classList.add('crest-shake');
                return;
            }
            if (window.soundEngine) window.soundEngine.playSelect();
            this.selectedMode = 'endless'; this.selectedEndlessHard = true; this._syncModePickerUI(); this._syncHostPresence();
        });
        this._syncModePickerUI();

        // Copy button (with fallback when Clipboard API unavailable on HTTP LAN)
        const copyBtn = document.getElementById('coop-copy-code-btn');
        copyBtn.addEventListener('click', () => {
            if (!this.roomCode) return;
            const markCopied = () => {
                if (typeof UiIcons !== 'undefined') UiIcons.setRichText(copyBtn, '✅ COPIED!', 'ui-icon-sm'); else copyBtn.textContent = '✅ COPIED!';
                setTimeout(() => { if (typeof UiIcons !== 'undefined') UiIcons.setRichText(copyBtn, '📋 COPY CODE', 'ui-icon-sm'); else copyBtn.textContent = '📋 COPY CODE'; }, 2000);
            };
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(this.roomCode).then(markCopied).catch(() => {});
            } else {
                const ta = document.createElement('textarea');
                ta.value = this.roomCode; document.body.appendChild(ta); ta.select();
                try { document.execCommand('copy'); markCopied(); } catch (e) {}
                document.body.removeChild(ta);
            }
        });

        // Connect button (Guest)
        const connectBtn = document.getElementById('coop-connect-btn');
        const joinInput = document.getElementById('coop-join-code-input');
        connectBtn.addEventListener('click', () => {
            const code = (joinInput.value || '').trim();
            if (!code) return;

            this.bindNetworkCallbacks();
            const userData = this.getLocalUserData();
            const statusEl = document.getElementById('coop-join-status');
            statusEl.textContent = `Connecting to room ${code}...`;
            connectBtn.disabled = true;

            window.networkManager.join(code, userData);
        });

        if (joinInput) {
            joinInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !connectBtn.disabled) {
                    connectBtn.click();
                }
            });
        }

        const startBtn = document.getElementById('coop-start-btn');
        startBtn.addEventListener('click', () => this.launchMatchAsHost());
        this.bindNetworkCallbacks();
        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.on('friendsUpdated', () => {
                if (this.modal && !this.modal.classList.contains('hidden') && this.activeTab === 'host') this.renderFriendQuickInvite();
            });
        }
    }

    bindNetworkCallbacks() {
        if (!window.networkManager) return;
        window.networkManager.onConnectedCallback = (isHost, peerInfo, peerId, roster) => this.handlePeerConnected(isHost, peerInfo, peerId, roster);
        window.networkManager.onRosterCallback = (roster, hostInfo) => {
            this.connectedPeers = Array.isArray(roster) ? roster : [];
            if (hostInfo) this.hostInfo = hostInfo;
            this.renderSquadRoster(false);
        };
        window.networkManager.onDisconnectedCallback = (reason, peerId, leftInfo, remaining) => this.handlePeerDisconnected(reason, peerId, leftInfo, remaining);
        window.networkManager.onErrorCallback = (err) => {
            const statusEl = document.getElementById(this.activeTab === 'host' ? 'coop-host-status' : 'coop-join-status');
            if (statusEl) { if (typeof UiIcons !== 'undefined') UiIcons.setRichText(statusEl, `⚠️ Network notice: ${err}`, 'ui-icon-sm'); else statusEl.textContent = `⚠️ Network notice: ${err}`; }
            const connectBtn = document.getElementById('coop-connect-btn');
            if (connectBtn) { connectBtn.textContent = 'CONNECT TO HOST'; connectBtn.disabled = false; }
        };
        window.networkManager.onStatusCallback = (msg) => {
            const statusEl = document.getElementById(this.activeTab === 'host' ? 'coop-host-status' : 'coop-join-status');
            if (statusEl && msg && !window.networkManager.connected) statusEl.textContent = msg;
        };
        // Listen for Guest MATCH_START
        window.networkManager.onMessageCallback = (type, payload) => {
            if (type === 'MATCH_START' && !window.networkManager.isHost) this.launchMatchAsGuest(payload);
        };
    }

    resetJoinUI() {
        const statusEl = document.getElementById('coop-join-status'), dotEl = document.getElementById('coop-join-dot'), connectBtn = document.getElementById('coop-connect-btn'), jr = document.getElementById('coop-join-roster');
        if (statusEl) statusEl.textContent = 'Enter code and click Connect';
        if (dotEl) dotEl.classList.remove('connected');
        if (connectBtn) { connectBtn.textContent = 'CONNECT TO HOST'; connectBtn.disabled = false; }
        if (jr) jr.textContent = '';
    }

    setupHostRoom() {
        this.connectedPeers = [];
        const userData = this.getLocalUserData();
        this.roomCode = window.networkManager.host(null, userData);

        const codeDisplay = document.getElementById('coop-host-code');
        if (codeDisplay) codeDisplay.textContent = this.roomCode;

        const statusEl = document.getElementById('coop-host-status');
        const dotEl = document.getElementById('coop-host-dot');
        const startBtn = document.getElementById('coop-start-btn');

        if (statusEl) statusEl.textContent = '⏳ Opening room on server...';
        if (dotEl) dotEl.classList.remove('connected');
        if (startBtn) { startBtn.disabled = true; startBtn.textContent = 'START CO-OP BATTLE'; }
        this.renderSquadRoster(true);

        window.networkManager.waitUntilReady(6500).then((ready) => {
            if (!window.networkManager || !window.networkManager.isHost || window.networkManager.connected) return;
            const liveStatus = document.getElementById('coop-host-status');
            if (liveStatus && ready) liveStatus.textContent = 'Waiting for partner to join...';
        });

        if (window.friendService) {
            this._syncHostPresence();
            if (!window.friendService.friends.length && typeof window.friendService.pollFriendships === 'function') window.friendService.pollFriendships();
            else if (typeof window.friendService.refreshFriendStatuses === 'function') window.friendService.refreshFriendStatuses();
        }
        this._syncModePickerUI();
        this.renderFriendQuickInvite();
    }

    _getPresenceLabel(verb = 'Hosting', gameMode = this.selectedMode, isHard = this.selectedEndlessHard) {
        const modeName = gameMode === 'endless' ? (isHard ? 'Endless Hard' : 'Normal Endless') : (gameMode === 'dungeons' ? 'Mt. Olympus' : 'Story');
        return `${verb} Co-op (${modeName})`;
    }

    _syncHostPresence() {
        if (!window.friendService || this.activeTab !== 'host' || !this.roomCode) return;
        if (window.gameInstance && window.gameInstance.coopSession && window.gameInstance.state === 'PLAYING') return;
        const isHard = !!(this.selectedMode === 'endless' && this.selectedEndlessHard);
        window.friendService.setPresenceStatus(this._getPresenceLabel('Hosting', this.selectedMode, isHard), this.roomCode);
    }

    _syncModePickerUI() {
        const mc = window.menuController || (window.gameInstance && window.gameInstance.ui && window.gameInstance.ui.menuController);
        const unlocked = !mc || typeof mc.isEndlessHardUnlocked !== 'function' || mc.isEndlessHardUnlocked();
        if (!unlocked) this.selectedEndlessHard = false;
        const btnStory = document.getElementById('coop-mode-story');
        const btnEndless = document.getElementById('coop-mode-endless');
        const btnHard = document.getElementById('coop-mode-endless-hard');
        if (btnStory) btnStory.classList.toggle('selected', this.selectedMode !== 'endless');
        if (btnEndless) btnEndless.classList.toggle('selected', this.selectedMode === 'endless' && !this.selectedEndlessHard);
        if (btnHard) {
            btnHard.classList.toggle('is-locked', !unlocked);
            btnHard.classList.toggle('selected', this.selectedMode === 'endless' && !!this.selectedEndlessHard);
            btnHard.textContent = unlocked ? '🔥 ENDLESS HARD' : '🔒 HARD (W30)';
        }
    }

    renderFriendQuickInvite() {
        const container = document.getElementById('coop-friend-quicklist'), fs = window.friendService;
        if (!container || !fs) return;
        const onlineFriends = typeof fs.getOnlineFriends === 'function' ? fs.getOnlineFriends()
            : fs.friends.map(f => ({ uid: f.otherUid, ...(fs.friendProfiles[f.otherUid] || f.profile) })).filter(f => f.isOnline);
        container.innerHTML = '';
        const hdr = document.createElement('div');
        hdr.className = 'coop-friends-hdr';
        const lbl = document.createElement('span');
        lbl.className = 'coop-friends-label';
        lbl.textContent = `INVITE ONLINE FRIENDS (${onlineFriends.length}):`;
        const syncBtn = document.createElement('button');
        syncBtn.type = 'button'; syncBtn.className = 'coop-friends-refresh-btn'; syncBtn.title = 'Refresh Online Friends'; syncBtn.textContent = '↻';
        syncBtn.onclick = async () => { syncBtn.disabled = true; if (fs.pollFriendships) await fs.pollFriendships(); if (fs.refreshFriendStatuses) await fs.refreshFriendStatuses(); syncBtn.disabled = false; this.renderFriendQuickInvite(); };
        hdr.append(lbl, syncBtn);
        container.appendChild(hdr);
        if (!onlineFriends.length) {
            const empty = document.createElement('span');
            empty.className = 'coop-friends-empty';
            empty.textContent = 'No friends online right now — share your code or tap ↻ to check.';
            container.appendChild(empty);
            return;
        }
        onlineFriends.slice(0, 8).forEach((f) => {
            const btn = document.createElement('button');
            btn.type = 'button'; btn.className = 'coop-friend-chip-btn';
            const setLbl = (txt) => { if (typeof UiIcons !== 'undefined') UiIcons.setRichText(btn, txt, 'ui-icon-sm'); else btn.textContent = txt; };
            setLbl(`📨 ${f.name}`);
            btn.onclick = async () => {
                btn.disabled = true; btn.textContent = '⏳ Opening...';
                const ready = window.networkManager ? await window.networkManager.waitUntilReady(6500) : true;
                if (!ready) { btn.disabled = false; setLbl(`Retry ${f.name}`); return; }
                const invMode = (this.selectedMode === 'endless' && this.selectedEndlessHard) ? 'endless_hard' : (this.selectedMode || 'story');
                const ok = await fs.sendCoopInvite(f.uid, this.roomCode, invMode);
                if (ok) {
                    setLbl(`✓ Sent to ${f.name}`);
                    setTimeout(() => { if (btn.isConnected && btn.disabled) { btn.disabled = false; setLbl(`📨 ${f.name}`); } }, 8000);
                } else { btn.disabled = false; setLbl(`⚠️ Retry ${f.name}`); }
            };
            container.appendChild(btn);
        });
    }

    joinRoomWithCode(roomCode, inviteId = null) {
        if (!roomCode) return;
        if (window.friendService && typeof window.friendService.setPendingInvite === 'function') {
            window.friendService.setPendingInvite(inviteId);
        }
        this.activeTab = 'join';
        this.show();
        const input = document.getElementById('coop-join-code-input');
        const btn = document.getElementById('coop-connect-btn');
        if (input) input.value = String(roomCode).trim().toUpperCase();
        if (btn) btn.click();
    }

    renderSquadRoster(isHostView) {
        const container = document.getElementById(isHostView ? 'coop-host-roster' : 'coop-join-roster');
        if (!container) return;
        container.textContent = '';
        const localUser = this.getLocalUserData();
        const hostData = isHostView ? localUser : (this.hostInfo || this.peerData || { name: 'Host', heroType: 'psanas' });
        const guests = isHostView && window.networkManager && typeof window.networkManager.getConnectedPeers === 'function'
            ? window.networkManager.getConnectedPeers()
            : (Array.isArray(this.connectedPeers) ? this.connectedPeers : []);

        const makeSlot = (tag, label, extraCls = '') => {
            const cell = document.createElement('div');
            cell.className = `coop-squad-slot ${extraCls}`.trim();
            const tagEl = document.createElement('span'); tagEl.className = 'coop-slot-tag'; tagEl.textContent = tag;
            const nameEl = document.createElement('span'); nameEl.className = 'coop-slot-name'; nameEl.textContent = label;
            cell.append(tagEl, nameEl); container.appendChild(cell);
        };
        makeSlot('P1 HOST', `${hostData.name || 'Host'} (${hostData.heroType || 'psanas'})`, 'filled is-host');
        for (let i = 0; i < 3; i++) {
            const g = guests[i];
            if (g) makeSlot(`P${i + 2}`, `${g.name || 'Teammate'} (${g.heroType || 'petros'})`, 'filled');
            else makeSlot(`P${i + 2}`, 'Open Slot...', '');
        }
    }

    handlePeerConnected(isHost, peerInfo, peerId = null, roster = null) {
        this.peerData = peerInfo;
        const guests = Array.isArray(roster) ? roster : (window.networkManager && typeof window.networkManager.getConnectedPeers === 'function' ? window.networkManager.getConnectedPeers() : (peerInfo ? [{ id: peerId || 'p2', ...peerInfo }] : []));
        this.connectedPeers = guests;
        if (!isHost) this.hostInfo = peerInfo;
        const partnerName = (peerInfo && peerInfo.name) || 'Teammate';
        const partnerHero = (peerInfo && peerInfo.heroType) || 'petros';
        if (!isHost && window.friendService && typeof window.friendService.dismissPendingInvite === 'function') {
            window.friendService.dismissPendingInvite();
        }

        if (isHost) {
            const statusEl = document.getElementById('coop-host-status');
            const dotEl = document.getElementById('coop-host-dot');
            const startBtn = document.getElementById('coop-start-btn');
            const count = Math.min(4, 1 + guests.length);
            if (statusEl) {
                const msg = guests.length > 1
                    ? `✅ ${count}/4 Squad Ready! Latest: ${partnerName} (${partnerHero})`
                    : `✅ ${count}/4 Squad Ready! ${partnerName} (${partnerHero}) joined!`;
                if (typeof UiIcons !== 'undefined') UiIcons.setRichText(statusEl, msg, 'ui-icon-sm');
                else statusEl.textContent = msg;
            }
            if (dotEl) dotEl.classList.add('connected');
            if (startBtn) {
                startBtn.disabled = guests.length === 0;
                startBtn.textContent = guests.length > 0 ? `START CO-OP (${count}/4)` : 'START CO-OP BATTLE';
            }
            this.renderSquadRoster(true);
        } else {
            const statusEl = document.getElementById('coop-join-status');
            const dotEl = document.getElementById('coop-join-dot');
            const connectBtn = document.getElementById('coop-connect-btn');
            const count = Math.min(4, 1 + Math.max(1, guests.length));
            if (statusEl) {
                const msg = `✅ Connected (${count}/4 in squad)! Waiting for Host...`;
                if (typeof UiIcons !== 'undefined') UiIcons.setRichText(statusEl, msg, 'ui-icon-sm');
                else statusEl.textContent = msg;
            }
            if (dotEl) dotEl.classList.add('connected');
            if (connectBtn) {
                connectBtn.textContent = 'READY & WAITING...';
                connectBtn.disabled = true;
            }
            this.renderSquadRoster(false);
        }
    }

    handlePeerDisconnected(reason, peerId = null, leftInfo = null, remaining = 0) {
        const leftName = (leftInfo && leftInfo.name) || 'Squadmate';
        if (window.gameInstance && window.gameInstance.ui) {
            window.gameInstance.ui.addKillfeed(`⚠️ ${leftName} left Co-op`);
        }
        if (this.activeTab === 'host') {
            const guests = window.networkManager && typeof window.networkManager.getConnectedPeers === 'function'
                ? window.networkManager.getConnectedPeers() : [];
            this.connectedPeers = guests;
            const statusEl = document.getElementById('coop-host-status');
            const dotEl = document.getElementById('coop-host-dot');
            const startBtn = document.getElementById('coop-start-btn');
            const count = 1 + guests.length;
            if (guests.length > 0) {
                if (statusEl) statusEl.textContent = `${leftName} left. ${count}/4 Squad Ready!`;
                if (dotEl) dotEl.classList.add('connected');
                if (startBtn) { startBtn.disabled = false; startBtn.textContent = `START CO-OP (${count}/4)`; }
            } else {
                if (statusEl) statusEl.textContent = 'Squadmates disconnected. Waiting (1/4)...';
                if (dotEl) dotEl.classList.remove('connected');
                if (startBtn) { startBtn.disabled = true; startBtn.textContent = 'START CO-OP BATTLE'; }
            }
            this.renderSquadRoster(true);
        } else {
            const statusEl = document.getElementById('coop-join-status');
            const dotEl = document.getElementById('coop-join-dot');
            const connectBtn = document.getElementById('coop-connect-btn');
            if (statusEl) { if (typeof UiIcons !== 'undefined') UiIcons.setRichText(statusEl, '⚠️ Host disconnected or room closed.', 'ui-icon-sm'); else statusEl.textContent = '⚠️ Host disconnected or room closed.'; }
            if (dotEl) dotEl.classList.remove('connected');
            if (connectBtn) {
                connectBtn.textContent = 'CONNECT TO HOST';
                connectBtn.disabled = false;
            }
            this.connectedPeers = [];
            this.renderSquadRoster(false);
        }
    }

    launchMatchAsHost() {
        const u = this.getLocalUserData();
        const mapSeed = Math.floor(100000 + Math.random() * 900000);
        const roster = (window.networkManager && typeof window.networkManager.getConnectedPeers === 'function')
            ? window.networkManager.getConnectedPeers() : (Array.isArray(this.connectedPeers) ? this.connectedPeers : []);
        const initPeers = roster.length > 0 ? roster : (this.peerData ? [{ id: 'p2', ...this.peerData }] : []);

        const isHard = !!(this.selectedMode === 'endless' && this.selectedEndlessHard);
        window.networkManager.send('MATCH_START', {
            gameMode: this.selectedMode,
            isEndlessHard: isHard,
            hostName: u.name,
            hostHero: u.heroType,
            hostInfo: u,
            peers: initPeers,
            mapSeed: mapSeed
        });

        this.hide(true);
        if (window.friendService) {
            window.friendService.setPresenceStatus(this._getPresenceLabel('Playing', this.selectedMode, isHard), null);
        }

        if (window.menuController) window.menuController.hideGameModeModal();
        const menuScreen = document.getElementById('menu-screen');
        if (menuScreen) menuScreen.classList.add('hidden');

        if (window.gameInstance) {
            window.gameInstance.isCoopGuest = false;
            window.gameInstance.startNewGame(u.heroType, this.selectedMode, { isCoop: true, isEndlessHard: isHard });
            if (window.gameInstance.arena && typeof window.gameInstance.arena.reseed === 'function') {
                window.gameInstance.arena.reseed(mapSeed);
            }
            window.gameInstance.coopSession = new CoopHostSession(window.gameInstance, window.networkManager, initPeers, mapSeed);
            if (window.gameInstance.ui) {
                const modeLabel = isHard ? 'ENDLESS HARD' : this.selectedMode.toUpperCase();
                window.gameInstance.ui.addKillfeed(`🤝 ${1 + initPeers.length}P CO-OP MATCH STARTED (${modeLabel})`);
            }
        }
    }

    launchMatchAsGuest(payload) {
        this.hide(true);
        if (window.menuController) window.menuController.hideGameModeModal();
        const menuScreen = document.getElementById('menu-screen');
        if (menuScreen) menuScreen.classList.add('hidden');

        const u = this.getLocalUserData();
        const gameMode = payload.gameMode || 'story';
        const isHard = !!(gameMode === 'endless' && payload.isEndlessHard);
        if (window.friendService) {
            window.friendService.setPresenceStatus(this._getPresenceLabel('Playing', gameMode, isHard), null);
        }
        const mapSeed = payload.mapSeed || 123456;
        const hostData = payload.hostInfo || this.hostInfo || this.peerData || { name: payload.hostName || 'Host', heroType: payload.hostHero || 'psanas' };
        const initPeers = Array.isArray(payload.peers) ? payload.peers : (Array.isArray(this.connectedPeers) ? this.connectedPeers : []);

        if (window.gameInstance) {
            window.gameInstance.isCoopGuest = true;
            window.gameInstance.startNewGame(u.heroType, gameMode, { isCoop: true, isEndlessHard: isHard });
            if (window.gameInstance.arena && typeof window.gameInstance.arena.reseed === 'function') {
                window.gameInstance.arena.reseed(mapSeed);
            }
            window.gameInstance.coopSession = new CoopGuestSession(window.gameInstance, window.networkManager, hostData, mapSeed, {
                peers: initPeers,
                myPeerId: (window.networkManager && window.networkManager.assignedPeerId) || null
            });
            if (window.gameInstance.ui) {
                const modeLabel = isHard ? 'ENDLESS HARD' : gameMode.toUpperCase();
                window.gameInstance.ui.addKillfeed(`🤝 ${Math.max(2, 1 + initPeers.length)}P CO-OP MATCH STARTED (${modeLabel})`);
            }
        }
    }

    show() {
        this.ensureModalMarkup();
        if (!window.gameInstance || !window.gameInstance.coopSession) {
            this.bindNetworkCallbacks();
        }
        const tabHost = document.getElementById('coop-tab-host');
        const tabJoin = document.getElementById('coop-tab-join');
        const contentHost = document.getElementById('coop-content-host');
        const contentJoin = document.getElementById('coop-content-join');
        const isHost = (this.activeTab === 'host');
        if (tabHost) tabHost.classList.toggle('active', isHost);
        if (tabJoin) tabJoin.classList.toggle('active', !isHost);
        if (contentHost) contentHost.classList.toggle('active', isHost);
        if (contentJoin) contentJoin.classList.toggle('active', !isHost);
        this.resetJoinUI();
        if (this.modal) this.modal.classList.remove('hidden');
        if (isHost) {
            this.setupHostRoom();
        }
    }

    hide(preservePresence = false) {
        if (this.modal) this.modal.classList.add('hidden');
        if (!preservePresence && window.friendService && (!window.gameInstance || window.gameInstance.state !== 'PLAYING')) {
            window.friendService.setPresenceStatus('In Lobby', null);
        }
    }
}

if (typeof window !== 'undefined') {
    window.CoopLobbyModal = CoopLobbyModal;
}
