/**
 * Lesa.io - Co-op Multiplayer Lobby Controller
 * Handles room creation, friend code sharing, mode selection, and match kickoff
 */

class CoopLobbyModal {
    constructor() {
        this.modal = null;
        this.selectedMode = 'story';
        this.activeTab = 'host';
        this.roomCode = '';
        this.peerData = null;

        this.init();
    }

    init() {
        this.ensureModalMarkup();
        this.bindEvents();
    }

    getLocalUserData() {
        const gs = (typeof window !== 'undefined') ? window.GameState : null;
        const name = (gs && gs.player && gs.player.name) || localStorage.getItem('lesaio_player_name') || 'Hero';
        const heroType = (gs && gs.player && gs.player.selectedHero) || 'psanas';
        const weaponType = (typeof WeaponSystem !== 'undefined')
            ? WeaponSystem.resolveEquippedWeapon((typeof HEROES !== 'undefined' && HEROES[heroType]) ? HEROES[heroType].weaponType : 'pea')
            : ((gs && gs.player && (gs.player.selectedWeapon || gs.player.weaponType)) || localStorage.getItem('lesaio_selected_weapon') || 'pea');
        const heroSkin = (typeof HeroSkinSystem !== 'undefined') ? HeroSkinSystem.getActiveSkin(heroType) : 'default';
        const heroStyle = (heroType === 'psgiannhs' && typeof PsgiannhsHero !== 'undefined') ? PsgiannhsHero.getActiveStyle() : null;
        const starBlessed = (typeof HeroStarBlessing !== 'undefined' && HeroStarBlessing.isBlessed) ? !!HeroStarBlessing.isBlessed(heroType) : false;

        let maxHp = (typeof HEROES !== 'undefined' && HEROES[heroType] && HEROES[heroType].hp) || 100;
        const upgrades = (gs && gs.player && gs.player.upgrades) || {};
        maxHp += (upgrades.maxHealth || 0) * 6;
        let damageReduction = (typeof HEROES !== 'undefined' && HEROES[heroType] && HEROES[heroType].damageReduction) || 0;
        if (typeof GearManager !== 'undefined') {
            const eq = GearManager.getEquippedTotalStats();
            maxHp += (eq.maxHp || 0);
            damageReduction = Math.min(0.55, damageReduction + (eq.damageReduction || 0) / 100);
        }
        if (starBlessed) maxHp = Math.round(maxHp * 1.10);
        return { name, heroType, weaponType, heroSkin, heroStyle, starBlessed, maxHp: Math.min(1200, Math.round(maxHp)), damageReduction };
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
                        <h2 class="coop-title">${typeof UiIcons !== 'undefined' ? UiIcons.i('handshake', 'ui-icon-title') : '🤝'} CO-OP PLAYTEST</h2>
                        <span class="coop-badge">1-Day Test</span>
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
                        <span class="coop-code-label">YOUR ROOM CODE (SHARE WITH FRIEND)</span>
                        <span id="coop-host-code" class="coop-code-digits">----</span>
                        <button id="coop-copy-code-btn" class="coop-copy-btn">${typeof UiIcons !== 'undefined' ? UiIcons.i('copy', 'ui-icon-sm') : '📋'} COPY CODE</button>
                    </div>

                    <div>
                        <span class="coop-code-label" style="display:block; margin-bottom: 6px;">SELECT GAME MODE:</span>
                        <div class="coop-mode-picker">
                            <button id="coop-mode-story" class="coop-mode-btn selected">${typeof UiIcons !== 'undefined' ? UiIcons.i('book', 'ui-icon-sm') : '📖'} STORY MODE</button>
                            <button id="coop-mode-endless" class="coop-mode-btn">${typeof UiIcons !== 'undefined' ? UiIcons.i('bolt', 'ui-icon-sm') : '⚡'} ENDLESS MODE</button>
                        </div>
                    </div>

                    <div class="coop-status-row">
                        <div id="coop-host-dot" class="coop-status-dot"></div>
                        <span id="coop-host-status">Waiting for partner to join...</span>
                    </div>

                    <div id="coop-friend-quicklist" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;"></div>

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
            tabHost.classList.add('active');
            tabJoin.classList.remove('active');
            contentHost.classList.add('active');
            contentJoin.classList.remove('active');
            this.setupHostRoom();
        });

        tabJoin.addEventListener('click', () => {
            this.activeTab = 'join';
            tabJoin.classList.add('active');
            tabHost.classList.remove('active');
            contentJoin.classList.add('active');
            contentHost.classList.remove('active');
            if (window.friendService) window.friendService.setPresenceStatus('In Lobby', null);
            this.resetJoinUI();
        });

        // Mode selectors
        const btnStory = document.getElementById('coop-mode-story');
        const btnEndless = document.getElementById('coop-mode-endless');

        btnStory.addEventListener('click', () => {
            this.selectedMode = 'story';
            btnStory.classList.add('selected');
            btnEndless.classList.remove('selected');
        });

        btnEndless.addEventListener('click', () => {
            this.selectedMode = 'endless';
            btnEndless.classList.add('selected');
            btnStory.classList.remove('selected');
        });

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

        // Start match button (Host)
        const startBtn = document.getElementById('coop-start-btn');
        startBtn.addEventListener('click', () => {
            this.launchMatchAsHost();
        });

        this.bindNetworkCallbacks();

        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.on('friendsUpdated', () => {
                if (this.modal && !this.modal.classList.contains('hidden') && this.activeTab === 'host') {
                    this.renderFriendQuickInvite();
                }
            });
        }
    }

    bindNetworkCallbacks() {
        if (!window.networkManager) return;

        window.networkManager.onConnectedCallback = (isHost, peerInfo) => {
            this.handlePeerConnected(isHost, peerInfo);
        };

        window.networkManager.onDisconnectedCallback = (reason) => {
            this.handlePeerDisconnected(reason);
        };

        window.networkManager.onErrorCallback = (err) => {
            const statusEl = (this.activeTab === 'host') ? document.getElementById('coop-host-status') : document.getElementById('coop-join-status');
            if (statusEl) { if (typeof UiIcons !== 'undefined') UiIcons.setRichText(statusEl, `⚠️ Network notice: ${err}`, 'ui-icon-sm'); else statusEl.textContent = `⚠️ Network notice: ${err}`; }
            const connectBtn = document.getElementById('coop-connect-btn');
            if (connectBtn) {
                connectBtn.textContent = 'CONNECT TO HOST';
                connectBtn.disabled = false;
            }
        };

        // Listen for Guest MATCH_START
        window.networkManager.onMessageCallback = (type, payload) => {
            if (type === 'MATCH_START' && !window.networkManager.isHost) {
                this.launchMatchAsGuest(payload);
            }
        };
    }

    resetJoinUI() {
        const statusEl = document.getElementById('coop-join-status');
        const dotEl = document.getElementById('coop-join-dot');
        const connectBtn = document.getElementById('coop-connect-btn');
        if (statusEl) statusEl.textContent = 'Enter code and click Connect';
        if (dotEl) dotEl.classList.remove('connected');
        if (connectBtn) {
            connectBtn.textContent = 'CONNECT TO HOST';
            connectBtn.disabled = false;
        }
    }

    setupHostRoom() {
        const userData = this.getLocalUserData();
        this.roomCode = window.networkManager.host(null, userData);

        const codeDisplay = document.getElementById('coop-host-code');
        if (codeDisplay) codeDisplay.textContent = this.roomCode;

        const statusEl = document.getElementById('coop-host-status');
        const dotEl = document.getElementById('coop-host-dot');
        const startBtn = document.getElementById('coop-start-btn');

        if (statusEl) statusEl.textContent = 'Waiting for partner to join...';
        if (dotEl) dotEl.classList.remove('connected');
        if (startBtn) startBtn.disabled = true;

        if (window.friendService) {
            window.friendService.setPresenceStatus('Hosting Co-op', this.roomCode);
        }
        this.renderFriendQuickInvite();
    }

    renderFriendQuickInvite() {
        const container = document.getElementById('coop-friend-quicklist');
        if (!container || !window.friendService) return;
        const fs = window.friendService;
        const onlineFriends = fs.friends
            .map(f => ({ uid: f.otherUid, ...(fs.friendProfiles[f.otherUid] || f.profile) }))
            .filter(f => f.isOnline);
        if (!onlineFriends.length) {
            container.innerHTML = '';
            return;
        }
        container.innerHTML = `<span style="font-size:11px;color:#94a3b8;width:100%;">INVITE ONLINE FRIENDS:</span>`;
        onlineFriends.slice(0, 4).forEach((f) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'friend-btn friend-btn-primary';
            if (typeof UiIcons !== 'undefined') UiIcons.setRichText(btn, `📨 ${f.name}`, 'ui-icon-sm'); else btn.textContent = `📨 ${f.name}`;
            btn.onclick = async () => {
                btn.disabled = true;
                await fs.sendCoopInvite(f.uid, this.roomCode, this.selectedMode || 'story');
                btn.textContent = `✓ Sent to ${f.name}`;
            };
            container.appendChild(btn);
        });
    }

    handlePeerConnected(isHost, peerInfo) {
        this.peerData = peerInfo;
        const partnerName = (peerInfo && peerInfo.name) || 'Teammate';
        const partnerHero = (peerInfo && peerInfo.heroType) || 'petros';

        if (isHost) {
            const statusEl = document.getElementById('coop-host-status');
            const dotEl = document.getElementById('coop-host-dot');
            const startBtn = document.getElementById('coop-start-btn');

            if (statusEl) { if (typeof UiIcons !== 'undefined') UiIcons.setRichText(statusEl, `✅ Partner Connected: ${partnerName} (${partnerHero})!`, 'ui-icon-sm'); else statusEl.textContent = `✅ Partner Connected: ${partnerName} (${partnerHero})!`; }
            if (dotEl) dotEl.classList.add('connected');
            if (startBtn) startBtn.disabled = false;
        } else {
            const statusEl = document.getElementById('coop-join-status');
            const dotEl = document.getElementById('coop-join-dot');
            const connectBtn = document.getElementById('coop-connect-btn');

            if (statusEl) { if (typeof UiIcons !== 'undefined') UiIcons.setRichText(statusEl, '✅ Connected to Host! Waiting for match start...', 'ui-icon-sm'); else statusEl.textContent = `✅ Connected to Host! Waiting for match start...`; }
            if (dotEl) dotEl.classList.add('connected');
            if (connectBtn) {
                connectBtn.textContent = 'READY & WAITING...';
                connectBtn.disabled = true;
            }
        }
    }

    handlePeerDisconnected(reason) {
        if (window.gameInstance && window.gameInstance.ui) {
            window.gameInstance.ui.addKillfeed('⚠️ Co-op partner disconnected');
        }
        if (this.activeTab === 'host') {
            const statusEl = document.getElementById('coop-host-status');
            const dotEl = document.getElementById('coop-host-dot');
            const startBtn = document.getElementById('coop-start-btn');
            if (statusEl) statusEl.textContent = 'Partner disconnected. Waiting for friend...';
            if (dotEl) dotEl.classList.remove('connected');
            if (startBtn) startBtn.disabled = true;
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
        }
    }

    launchMatchAsHost() {
        const u = this.getLocalUserData();
        const mapSeed = Math.floor(100000 + Math.random() * 900000);
        window.networkManager.send('MATCH_START', {
            gameMode: this.selectedMode,
            hostName: u.name,
            hostHero: u.heroType,
            hostInfo: u,
            mapSeed: mapSeed
        });

        this.hide();
        if (window.friendService) window.friendService.setPresenceStatus('Playing Co-op', null);

        if (window.menuController) window.menuController.hideGameModeModal();
        const menuScreen = document.getElementById('menu-screen');
        if (menuScreen) menuScreen.classList.add('hidden');

        if (window.gameInstance) {
            window.gameInstance.isCoopGuest = false;
            window.gameInstance.startNewGame(u.heroType, this.selectedMode);
            if (window.gameInstance.arena && typeof window.gameInstance.arena.reseed === 'function') {
                window.gameInstance.arena.reseed(mapSeed);
            }
            window.gameInstance.coopSession = new CoopHostSession(window.gameInstance, window.networkManager, this.peerData, mapSeed);
            if (window.gameInstance.ui) {
                window.gameInstance.ui.addKillfeed(`🤝 CO-OP MATCH STARTED (${this.selectedMode.toUpperCase()})`);
            }
        }
    }

    launchMatchAsGuest(payload) {
        this.hide();
        if (window.friendService) window.friendService.setPresenceStatus('Playing Co-op', null);

        if (window.menuController) window.menuController.hideGameModeModal();
        const menuScreen = document.getElementById('menu-screen');
        if (menuScreen) menuScreen.classList.add('hidden');

        const u = this.getLocalUserData();
        const gameMode = payload.gameMode || 'story';
        const mapSeed = payload.mapSeed || 123456;
        const hostData = payload.hostInfo || this.peerData || { name: payload.hostName || 'Host', heroType: payload.hostHero || 'psanas' };

        if (window.gameInstance) {
            window.gameInstance.isCoopGuest = true;
            window.gameInstance.startNewGame(u.heroType, gameMode);
            if (window.gameInstance.arena && typeof window.gameInstance.arena.reseed === 'function') {
                window.gameInstance.arena.reseed(mapSeed);
            }
            window.gameInstance.coopSession = new CoopGuestSession(window.gameInstance, window.networkManager, hostData, mapSeed);
            if (window.gameInstance.ui) {
                window.gameInstance.ui.addKillfeed(`🤝 CO-OP MATCH STARTED (${gameMode.toUpperCase()})`);
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

    hide() {
        if (this.modal) this.modal.classList.add('hidden');
        if (window.friendService && (!window.gameInstance || window.gameInstance.state !== 'PLAYING')) {
            window.friendService.setPresenceStatus('In Lobby', null);
        }
    }
}

if (typeof window !== 'undefined') {
    window.CoopLobbyModal = CoopLobbyModal;
}
