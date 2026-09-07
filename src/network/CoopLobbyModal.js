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
        const weaponType = (gs && gs.player && gs.player.weaponType) || localStorage.getItem('lesaio_selected_weapon') || 'pea';
        return { name, heroType, weaponType };
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
                        <h2 class="coop-title">🤝 CO-OP PLAYTEST</h2>
                        <span class="coop-badge">1-Day Test</span>
                    </div>
                    <button id="coop-close-btn" class="coop-close-btn" title="Close">✕</button>
                </div>

                <div class="coop-tabs">
                    <button id="coop-tab-host" class="coop-tab-btn active">👑 HOST GAME</button>
                    <button id="coop-tab-join" class="coop-tab-btn">🚀 JOIN GAME</button>
                </div>

                <!-- Host Tab -->
                <div id="coop-content-host" class="coop-tab-content active">
                    <div class="coop-code-box">
                        <span class="coop-code-label">YOUR ROOM CODE (SHARE WITH FRIEND)</span>
                        <span id="coop-host-code" class="coop-code-digits">----</span>
                        <button id="coop-copy-code-btn" class="coop-copy-btn">📋 COPY CODE</button>
                    </div>

                    <div>
                        <span class="coop-code-label" style="display:block; margin-bottom: 6px;">SELECT GAME MODE:</span>
                        <div class="coop-mode-picker">
                            <button id="coop-mode-story" class="coop-mode-btn selected">📖 STORY MODE</button>
                            <button id="coop-mode-endless" class="coop-mode-btn">⚡ ENDLESS MODE</button>
                        </div>
                    </div>

                    <div class="coop-status-row">
                        <div id="coop-host-dot" class="coop-status-dot"></div>
                        <span id="coop-host-status">Waiting for partner to join...</span>
                    </div>

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
            closeBtn.addEventListener('click', () => this.hide());
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

        // Copy button
        const copyBtn = document.getElementById('coop-copy-code-btn');
        copyBtn.addEventListener('click', () => {
            if (this.roomCode) {
                navigator.clipboard.writeText(this.roomCode).then(() => {
                    copyBtn.textContent = '✅ COPIED!';
                    setTimeout(() => { copyBtn.textContent = '📋 COPY CODE'; }, 2000);
                });
            }
        });

        // Connect button (Guest)
        const connectBtn = document.getElementById('coop-connect-btn');
        const joinInput = document.getElementById('coop-join-code-input');
        connectBtn.addEventListener('click', () => {
            const code = (joinInput.value || '').trim();
            if (!code) return;

            const userData = this.getLocalUserData();
            const statusEl = document.getElementById('coop-join-status');
            statusEl.textContent = `Connecting to room ${code}...`;
            connectBtn.disabled = true;

            window.networkManager.join(code, userData);
        });

        // Start match button (Host)
        const startBtn = document.getElementById('coop-start-btn');
        startBtn.addEventListener('click', () => {
            this.launchMatchAsHost();
        });

        // Setup NetworkManager callbacks
        window.networkManager.onConnectedCallback = (isHost, peerInfo) => {
            this.handlePeerConnected(isHost, peerInfo);
        };

        window.networkManager.onDisconnectedCallback = (reason) => {
            this.handlePeerDisconnected(reason);
        };

        window.networkManager.onErrorCallback = (err) => {
            const statusEl = (this.activeTab === 'host') ? document.getElementById('coop-host-status') : document.getElementById('coop-join-status');
            if (statusEl) statusEl.textContent = `⚠️ Network notice: ${err}`;
            const connectBtn = document.getElementById('coop-connect-btn');
            if (connectBtn) connectBtn.disabled = false;
        };

        // Listen for Guest MATCH_START
        window.networkManager.onMessageCallback = (type, payload) => {
            if (type === 'MATCH_START' && !window.networkManager.isHost) {
                this.launchMatchAsGuest(payload);
            }
        };
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
    }

    handlePeerConnected(isHost, peerInfo) {
        this.peerData = peerInfo;
        const partnerName = (peerInfo && peerInfo.name) || 'Teammate';
        const partnerHero = (peerInfo && peerInfo.heroType) || 'petros';

        if (isHost) {
            const statusEl = document.getElementById('coop-host-status');
            const dotEl = document.getElementById('coop-host-dot');
            const startBtn = document.getElementById('coop-start-btn');

            if (statusEl) statusEl.textContent = `✅ Partner Connected: ${partnerName} (${partnerHero})!`;
            if (dotEl) dotEl.classList.add('connected');
            if (startBtn) startBtn.disabled = false;
        } else {
            const statusEl = document.getElementById('coop-join-status');
            const dotEl = document.getElementById('coop-join-dot');
            const connectBtn = document.getElementById('coop-connect-btn');

            if (statusEl) statusEl.textContent = `✅ Connected to Host! Waiting for match start...`;
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
        const statusEl = (this.activeTab === 'host') ? document.getElementById('coop-host-status') : document.getElementById('coop-join-status');
        if (statusEl) statusEl.textContent = 'Partner disconnected. Reconnecting...';
    }

    launchMatchAsHost() {
        const u = this.getLocalUserData();
        const mapSeed = Math.floor(100000 + Math.random() * 900000);
        window.networkManager.send('MATCH_START', {
            gameMode: this.selectedMode,
            hostName: u.name,
            hostHero: u.heroType,
            mapSeed: mapSeed
        });

        this.hide();

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

        if (window.menuController) window.menuController.hideGameModeModal();
        const menuScreen = document.getElementById('menu-screen');
        if (menuScreen) menuScreen.classList.add('hidden');

        const u = this.getLocalUserData();
        const gameMode = payload.gameMode || 'story';
        const mapSeed = payload.mapSeed || 123456;

        if (window.gameInstance) {
            window.gameInstance.isCoopGuest = true;
            window.gameInstance.startNewGame(u.heroType, gameMode);
            if (window.gameInstance.arena && typeof window.gameInstance.arena.reseed === 'function') {
                window.gameInstance.arena.reseed(mapSeed);
            }
            window.gameInstance.coopSession = new CoopGuestSession(window.gameInstance, window.networkManager, this.peerData, mapSeed);
            if (window.gameInstance.ui) {
                window.gameInstance.ui.addKillfeed(`🤝 CO-OP MATCH STARTED (${gameMode.toUpperCase()})`);
            }
        }
    }

    show() {
        this.ensureModalMarkup();
        if (this.modal) this.modal.classList.remove('hidden');
        if (this.activeTab === 'host') {
            this.setupHostRoom();
        }
    }

    hide() {
        if (this.modal) this.modal.classList.add('hidden');
    }
}

if (typeof window !== 'undefined') {
    window.CoopLobbyModal = CoopLobbyModal;
}
