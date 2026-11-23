/**
 * Lesa.io - Admin & Playtesting Panel Controller
 * Handles UI interactions, tab switching, temporary testing launcher pill,
 * live telemetry updates, and hotkeys (F1 / ~ / Esc).
 */

class AdminPanelController {
    constructor() {
        this.modal = null;
        this.launchBtn = null;
        this.activeTab = 'cheats';
        this.telemetryInterval = null;
        this.toastTimer = null;
        this.fpsHistory = [];
        this.lastFrameTime = performance.now();
        this.currentFps = 60;

        this.initDOM();
        this.initTestingLauncher();
        this.initHotkeys();
    }

    initDOM() {
        this.modal = document.getElementById('admin-modal');
        if (!this.modal) return;

        // Close buttons & backdrop click
        this.modal.querySelectorAll('.modal-close-x-btn, #close-admin-btn').forEach(btn => {
            btn.addEventListener('click', () => this.close());
        });
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        // Tabs
        this.modal.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.currentTarget.getAttribute('data-tab'));
            });
        });

        this.bindCheatControls();
        this.bindWaveControls();
        this.bindSpawnerControls();
        this.bindEconomyControls();
        this.bindAdminManagement();
        this.bindDevAccountControls();
    }

    /**
     * Dynamically injects a launcher pill ONLY while AdminAuth.TESTING_OPEN_ACCESS is true.
     * Setting TESTING_OPEN_ACCESS = false hides/removes both access and this pill automatically.
     */
    initTestingLauncher() {
        const enabled = !!(window.AdminAuth && typeof window.AdminAuth.isTestingOverrideEnabled === 'function' && window.AdminAuth.isTestingOverrideEnabled());
        if (!enabled || document.getElementById('temp-admin-launch-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'temp-admin-launch-btn';
        btn.type = 'button';
        btn.className = 'temp-admin-launch-btn';
        btn.title = 'Open Dev Cheats Console (F1 / ~)';
        btn.innerHTML = '<img src="assets/ui-icons/wrench.svg" class="ui-icon ui-icon-sm" alt=""> DEV CHEATS';
        btn.addEventListener('click', () => this.toggle());
        document.body.appendChild(btn);
        this.launchBtn = btn;
    }

    initHotkeys() {
        window.addEventListener('keydown', async (e) => {
            const isOpen = this.modal && !this.modal.classList.contains('hidden');
            if (e.key === 'Escape' && isOpen) {
                e.preventDefault();
                this.close();
                return;
            }
            if (e.key === 'F1' || e.key === '`' || e.key === '~') {
                if (isOpen) {
                    e.preventDefault();
                    this.close();
                    return;
                }
                const authResult = await window.AdminAuth.verifyAdminAccess();
                if (!authResult || !authResult.authorized) return;

                e.preventDefault();
                await this.open();
            }
        });
    }

    showToast(msg, variant = 'ok') {
        const el = document.getElementById('admin-status-toast');
        if (!el) return;
        el.textContent = msg;
        el.className = 'admin-status-toast' + (variant === 'warn' ? ' is-warn' : variant === 'error' ? ' is-error' : '');
        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => el.classList.add('hidden'), 3200);
    }

    async toggle() {
        if (!this.modal) this.modal = document.getElementById('admin-modal');
        if (this.modal && !this.modal.classList.contains('hidden')) this.close();
        else await this.open();
    }

    async open() {
        if (!this.modal) this.modal = document.getElementById('admin-modal');
        if (!this.modal) return;

        const authResult = await window.AdminAuth.verifyAdminAccess();
        if (!authResult || !authResult.authorized) return;

        this.modal.classList.remove('hidden');
        if (window.soundEngine) window.soundEngine.playSelect();

        const isPrimaryDev = !!(window.AdminAuth && typeof window.AdminAuth.isPrimaryDevUser === 'function' && window.AdminAuth.isPrimaryDevUser());
        const adminEmailTag = document.getElementById('admin-current-user-email');
        if (adminEmailTag && authResult.user) {
            const badge = authResult.isTestingOverride ? 'Testing Access (Temp)' : (isPrimaryDev ? 'Primary Dev' : 'Verified Admin');
            adminEmailTag.textContent = `${authResult.user.email || authResult.user.uid} (${badge})`;
        }

        const devSection = document.getElementById('admin-dev-account-section');
        if (devSection) {
            devSection.classList.toggle('hidden', !isPrimaryDev);
        }

        this.startTelemetry();
        this.syncUIStates();
    }

    close() {
        if (this.modal) this.modal.classList.add('hidden');
        if (window.soundEngine) window.soundEngine.playGoBack();
        if (window.DevGiftManager) window.DevGiftManager.closeComposer();
        this.stopTelemetry();
    }

    switchTab(tabName) {
        this.activeTab = tabName;
        this.modal.querySelectorAll('.admin-tab-content').forEach(t => t.classList.add('hidden'));
        const targetTab = this.modal.querySelector(`#admin-tab-${tabName}`);
        if (targetTab) targetTab.classList.remove('hidden');

        this.modal.querySelectorAll('.admin-tab-btn').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-tab') === tabName);
        });
        if (window.soundEngine) window.soundEngine.playSelect();
    }

    _bindToggle(id, prop, labelOn, labelOff) {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('click', () => {
            window.AdminCheats[prop] = !window.AdminCheats[prop];
            const val = window.AdminCheats[prop];
            const g = window.gameInstance;
            if (g && g.coopSession && !g.coopSession.isHost && g.coopSession.net && g.coopSession.net.connected) {
                if (prop === 'squadGodMode') g.coopSession.net.send('DEV_COOP_CMD', { cmd: 'squad_god', enabled: val });
                else if (prop === 'godMode') g.coopSession.net.send('DEV_COOP_CMD', { cmd: 'guest_god', enabled: val });
            }
            this.updateToggleButton(btn, val, labelOn, labelOff);
            this.showToast(`${labelOn.replace(': ON', '')}: ${val ? 'ENABLED' : 'DISABLED'}`);
        });
    }

    bindCheatControls() {
        this._bindToggle('admin-toggle-godmode', 'godMode', 'GOD MODE: ON', 'GOD MODE: OFF');
        this._bindToggle('admin-toggle-squad-god', 'squadGodMode', 'SQUAD GOD: ON', 'SQUAD GOD: OFF');
        this._bindToggle('admin-toggle-inf-dash', 'infiniteDash', 'INF DASH: ON', 'INF DASH: OFF');
        this._bindToggle('admin-toggle-inf-skill', 'noSkillCooldown', '0s SKILL CD: ON', '0s SKILL CD: OFF');
        this._bindToggle('admin-toggle-inf-ult', 'infiniteUlt', 'INF ULTIMATE: ON', 'INF ULTIMATE: OFF');
        this._bindToggle('admin-toggle-super-speed', 'superSpeed', '2x SPEED: ON', '2x SPEED: OFF');
        this._bindToggle('admin-toggle-dmg-boost', 'damageBoost', '10x DMG + CRIT: ON', '10x DMG + CRIT: OFF');
        this._bindToggle('admin-toggle-instakill', 'instaKillEnemies', '1-HIT AURA: ON', '1-HIT AURA: OFF');

        const bindBtn = (id, fn) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', fn);
        };

        bindBtn('admin-btn-full-heal', () => {
            const ok = window.AdminCheats.fullHeal(window.gameInstance);
            this.showToast(ok ? 'Hero restored to full HP & cooldowns cleared.' : 'Start a run first.', ok ? 'ok' : 'warn');
        });
        bindBtn('admin-btn-revive-squad', () => {
            const ok = window.AdminCheats.reviveAndHealSquad(window.gameInstance);
            this.showToast(ok ? '🤝 Both Squad Heroes revived & healed to 100%!' : 'Start a run first.', ok ? 'ok' : 'warn');
        });
        bindBtn('admin-btn-fill-ult', () => {
            const ok = window.AdminCheats.fillUltimate(window.gameInstance);
            this.showToast(ok ? '⚡ Ultimate charged to 100% READY!' : 'Start a run first.', ok ? 'ok' : 'warn');
        });
        bindBtn('admin-btn-skip-wave', () => {
            const ok = window.AdminCheats.clearCurrentWave(window.gameInstance);
            this.showToast(ok ? '⏭️ Cleared wave & advanced to next wave!' : 'Start a run first.', ok ? 'ok' : 'warn');
        });
        bindBtn('admin-btn-squad-coins', () => {
            const ok = window.AdminCheats.giftSquadMatchCoins(window.gameInstance, 500, 200);
            this.showToast(ok ? '🎁 Awarded +500 Gold Coins & +200 XP to Squad!' : 'Start a run first.', ok ? 'ok' : 'warn');
        });
        bindBtn('admin-btn-level-up', () => {
            const lvl = window.AdminCheats.levelUpPlayer(window.gameInstance, 1);
            this.showToast(lvl ? `Hero leveled up to Level ${lvl}!` : 'Start a run first.', lvl ? 'ok' : 'warn');
        });
        bindBtn('admin-btn-nuke', () => {
            const killed = window.AdminCheats.nukeArena(window.gameInstance);
            this.showToast(`Nuke detonated! Hit ${killed} active enemies.`);
        });
        bindBtn('admin-btn-magnet', () => {
            const count = window.AdminCheats.magnetizeDrops(window.gameInstance);
            this.showToast(`Pulled ${count} drops straight to hero.`);
        });
        bindBtn('admin-btn-clear-drops', () => {
            const count = window.AdminCheats.clearDrops(window.gameInstance);
            this.showToast(`Cleared ${count} arena drops.`);
        });

        const speedBtns = this.modal.querySelectorAll('.admin-speed-btn');
        speedBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const spd = parseFloat(e.currentTarget.getAttribute('data-speed')) || 1.0;
                window.AdminCheats.gameSpeed = spd;
                speedBtns.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.showToast(`Simulation speed set to ${spd}x.`);
            });
        });
    }

    bindWaveControls() {
        const waveInput = document.getElementById('admin-input-wave');
        const warp = (mode, target) => {
            if (!window.gameInstance) return;
            window.AdminCheats.warpMode(window.gameInstance, mode, target);
            this.close();
        };

        const warpBtn = document.getElementById('admin-btn-warp-wave');
        if (warpBtn && waveInput) {
            warpBtn.addEventListener('click', () => {
                const w = parseInt(waveInput.value, 10) || 1;
                const mode = (window.gameInstance && window.gameInstance.state === 'PLAYING' && window.gameInstance.gameMode !== 'dungeons')
                    ? window.gameInstance.gameMode : 'story';
                warp(mode, w);
            });
        }
        const warpEndlessBtn = document.getElementById('admin-btn-warp-endless');
        if (warpEndlessBtn && waveInput) {
            warpEndlessBtn.addEventListener('click', () => warp('endless', parseInt(waveInput.value, 10) || 1));
        }
        const bossJumpBtn = document.getElementById('admin-btn-jump-wave10');
        if (bossJumpBtn) {
            bossJumpBtn.addEventListener('click', () => warp('story', 10));
        }

        this.modal.querySelectorAll('.admin-warp-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.getAttribute('data-mode') || 'story';
                const target = parseInt(e.currentTarget.getAttribute('data-target'), 10) || 1;
                warp(mode, target);
            });
        });

        this.modal.querySelectorAll('.admin-boss-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                const ok = window.AdminCheats.forceBossAction(window.gameInstance, action);
                this.showToast(
                    ok ? `Triggered boss action: ${action}` : 'Requires matching active boss in arena!',
                    ok ? 'ok' : 'warn'
                );
            });
        });
    }

    bindSpawnerControls() {
        this.modal.querySelectorAll('.admin-spawn-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.getAttribute('data-type');
                const count = parseInt(e.currentTarget.getAttribute('data-count'), 10) || 1;
                const spawned = window.AdminCheats.spawnEntity(window.gameInstance, type, count);
                this.showToast(spawned ? `Spawned ${spawned}x ${type}!` : `Could not spawn ${type}.`, spawned ? 'ok' : 'warn');
            });
        });

        const lilXasBtn = document.getElementById('admin-btn-spawn-lilxas');
        if (lilXasBtn) {
            lilXasBtn.addEventListener('click', () => {
                const ok = window.AdminCheats.spawnLilXasEasterEgg(window.gameInstance);
                this.showToast(ok ? '🎤 Triggered Lil Xas Concert Easter Egg!' : 'Could not trigger Lil Xas event.', ok ? 'ok' : 'warn');
                if (ok) this.close();
            });
        }

        this.modal.querySelectorAll('.admin-drop-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dropType = e.currentTarget.getAttribute('data-drop');
                const qty = window.AdminCheats.spawnDrop(window.gameInstance, dropType, 5);
                this.showToast(qty ? `Spawned ${qty}x ${dropType} drops.` : 'Start a run first.', qty ? 'ok' : 'warn');
            });
        });
    }

    bindEconomyControls() {
        this.modal.querySelectorAll('.admin-add-coins-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const amt = parseInt(e.currentTarget.getAttribute('data-amount'), 10) || 1000;
                window.AdminCheats.addCurrency('coins', amt);
                this.showToast(`Added +${amt.toLocaleString()} Coins.`);
            });
        });
        this.modal.querySelectorAll('.admin-add-gems-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const amt = parseInt(e.currentTarget.getAttribute('data-amount'), 10) || 100;
                window.AdminCheats.addCurrency('gems', amt);
                this.showToast(`Added +${amt.toLocaleString()} Gems.`);
            });
        });
        this.modal.querySelectorAll('.admin-add-mat-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mat = e.currentTarget.getAttribute('data-mat');
                const qty = parseInt(e.currentTarget.getAttribute('data-qty'), 10) || 10;
                const ok = window.AdminCheats.addMaterial(mat, qty);
                this.showToast(ok ? `Added +${qty} ${mat}.` : 'Inventory manager not ready.', ok ? 'ok' : 'warn');
            });
        });

        const simpleActions = [
            ['admin-btn-add-crests', () => this.showToast(`Ascent Crests set to ${window.AdminCheats.addAscentCrests(3)}.`)],
            ['admin-btn-add-stones', () => this.showToast(`Olympian Star Stones: ${window.AdminCheats.addStarStones(5)}.`)],
            ['admin-btn-add-evo-stones', () => this.showToast(`Evolution Stones: ${window.AdminCheats.addEvolutionStones(5)}.`)],
            ['admin-btn-add-xp', () => { window.AdminCheats.addAccountXP(1000); this.showToast('Added +1,000 Account XP.'); }],
            ['admin-btn-unlock-heroes', () => this.showToast(`Unlocked all ${window.AdminCheats.unlockAllHeroes()} heroes!`)],
            ['admin-btn-unlock-weapons', () => this.showToast(`Unlocked all ${window.AdminCheats.unlockAllWeapons()} weapons!`)],
            ['admin-btn-max-skills', () => this.showToast(`Unlocked & maxed all ${window.AdminCheats.maxAllSkills()} skills!`)],
            ['admin-btn-unlock-gear', () => this.showToast(`Unlocked ${window.AdminCheats.unlockAllGear()} armory gear items!`)],
            ['admin-btn-unlock-perks', () => this.showToast(`Unlocked & maxed all ${window.AdminCheats.unlockAllPerksAndFeats(true)} perks + boss feats!`)]
        ];
        for (const [id, fn] of simpleActions) {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', fn);
        }

        const resetAccBtn = document.getElementById('admin-btn-reset-account');
        if (resetAccBtn) {
            resetAccBtn.addEventListener('click', async () => {
                const ok = await window.AdminCheats.resetAccount();
                if (ok) this.showToast('Account reset to Level 1! Reloading...', 'warn');
            });
        }
    }

    bindAdminManagement() {
        const addAdminBtn = document.getElementById('admin-btn-add-admin');
        const addAdminInput = document.getElementById('admin-input-new-admin');
        if (!addAdminBtn || !addAdminInput) return;

        addAdminBtn.addEventListener('click', async () => {
            const target = addAdminInput.value.trim();
            if (!target) {
                this.showToast('Enter a target Google Email or UID first.', 'warn');
                return;
            }
            try {
                addAdminBtn.disabled = true;
                addAdminBtn.textContent = 'SAVING...';
                await window.AdminAuth.grantAdminPrivilege(target);
                addAdminInput.value = '';
                this.showToast(`Granted Firebase Admin access to ${target}.`);
            } catch (err) {
                this.showToast(`Grant failed: ${err.message}`, 'error');
            } finally {
                addAdminBtn.disabled = false;
                addAdminBtn.textContent = 'GRANT ADMIN ACCESS';
            }
        });
    }

    _escHtml(str) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return String(str || '').replace(/[&<>'"]/g, ch => map[ch]);
    }

    bindDevAccountControls() {
        const searchBtn = document.getElementById('admin-btn-lookup-account');
        const queryInput = document.getElementById('admin-dev-account-query');
        const resultsEl = document.getElementById('admin-dev-account-results');
        if (!searchBtn || !queryInput || !resultsEl) return;

        const runLookup = async () => {
            const q = queryInput.value.trim();
            if (!q) {
                this.showToast('Enter a player Name, #Tag, Email, or UID to search.', 'warn');
                return;
            }
            try {
                searchBtn.disabled = true;
                searchBtn.textContent = 'SEARCHING...';
                const matches = await window.DevAccountManager.lookupAccounts(q);
                if (window.DevGiftManager) window.DevGiftManager.closeComposer();
                this._renderDevAccountResults(matches, resultsEl);
            } catch (err) {
                resultsEl.innerHTML = `<div class="admin-dev-empty">${this._escHtml(err.message)}</div>`;
                this.showToast(err.message, 'error');
            } finally {
                searchBtn.disabled = false;
                searchBtn.textContent = 'FIND ACCOUNT';
            }
        };

        searchBtn.addEventListener('click', runLookup);
        queryInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                runLookup();
            }
        });
    }

    _renderDevAccountResults(accounts, container) {
        if (!Array.isArray(accounts) || accounts.length === 0) {
            container.innerHTML = '<div class="admin-dev-empty">No matching accounts found in Firestore.</div>';
            return;
        }
        container.innerHTML = accounts.map((acc, idx) => `
            <div class="admin-dev-acc-card">
                <div class="admin-dev-acc-meta">
                    <div class="admin-dev-acc-title">${this._escHtml(acc.name)} <span style="color:#fed330;">${this._escHtml(acc.tag)}</span> ${acc.hasVipPass ? '<span style="color:#fed330;font-size:0.74rem;">[👑 VIP]</span> ' : ''}${acc.isAdmin ? '<span style="color:#2ed573;font-size:0.74rem;">[ADMIN]</span>' : ''}</div>
                    <div class="admin-dev-acc-sub">UID: ${this._escHtml(acc.uid)}${acc.email ? ` | Email: ${this._escHtml(acc.email)}` : ''}${acc.pendingDevGiftsCount > 0 ? ` | 🎁 Queued Gifts: ${acc.pendingDevGiftsCount}` : ''}</div>
                    <div class="admin-dev-acc-sub">Lv.${acc.level} | 🪙 ${acc.coins.toLocaleString()} | 💎 ${acc.gems.toLocaleString()} | 🏆 Score: ${acc.highScore.toLocaleString()} | 🔥 W${acc.endlessWave} | ⚔️ ${acc.totalKills.toLocaleString()}</div>
                </div>
                <div class="admin-dev-acc-actions">
                    <button type="button" class="admin-control-btn btn-success admin-dev-gift-btn" data-idx="${idx}">🎁 GIFT</button>
                    <button type="button" class="admin-control-btn btn-warning admin-dev-wipe-btn" data-idx="${idx}">WIPE LV.1</button>
                    <button type="button" class="admin-control-btn btn-danger admin-dev-delete-btn" data-idx="${idx}">DELETE EVERYWHERE</button>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.admin-dev-gift-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const acc = accounts[parseInt(btn.getAttribute('data-idx'), 10)];
                if (acc && window.DevGiftManager) window.DevGiftManager.openComposer(acc, this);
            });
        });

        container.querySelectorAll('.admin-dev-wipe-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const acc = accounts[parseInt(btn.getAttribute('data-idx'), 10)];
                if (!acc) return;
                if (!confirm(`⚠️ WIPE ACCOUNT TO LV.1?\n\nPlayer: ${acc.name} (${acc.tag})\nUID: ${acc.uid}\n\nResets cloud progression, coins, gems, heroes, gear, skins & leaderboard scores to Lv.1 starter state.`)) return;
                try {
                    btn.disabled = true;
                    btn.textContent = 'WIPING...';
                    await window.DevAccountManager.wipeAccount(acc);
                    this.showToast(`Wiped ${acc.name} (${acc.tag}) to Lv.1 & cleared leaderboard stats.`, 'warn');
                    document.getElementById('admin-btn-lookup-account')?.click();
                } catch (err) {
                    btn.disabled = false;
                    btn.textContent = 'WIPE LV.1';
                    this.showToast(`Wipe failed: ${err.message}`, 'error');
                }
            });
        });

        container.querySelectorAll('.admin-dev-delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const acc = accounts[parseInt(btn.getAttribute('data-idx'), 10)];
                if (!acc) return;
                const typed = prompt(`🚨 PERMANENTLY DELETE ACCOUNT EVERYWHERE?\n\nPlayer: ${acc.name} (${acc.tag})\nUID: ${acc.uid}\n\nDeletes from Firestore saves, Leaderboards, Usernames, Friendships & Invites.\nType DELETE to confirm:`);
                if (typed !== 'DELETE') return;
                try {
                    btn.disabled = true;
                    btn.textContent = 'DELETING...';
                    const res = await window.DevAccountManager.deleteAccountEverywhere(acc);
                    const c = res.counts || {};
                    this.showToast(`Deleted ${acc.name} everywhere (players:${c.players || 0}, usernames:${c.usernames || 0}, friends:${c.friendships || 0}, invites:${c.invites || 0}).`);
                    if (!res.selfDeleted) document.getElementById('admin-btn-lookup-account')?.click();
                } catch (err) {
                    btn.disabled = false;
                    btn.textContent = 'DELETE EVERYWHERE';
                    const msg = String(err && err.code === 'permission-denied'
                        ? 'Firestore permission denied — publish updated firestore.rules in Firebase Console!'
                        : (err.message || 'Delete failed'));
                    this.showToast(msg, 'error');
                }
            });
        });
    }

    updateToggleButton(btn, isOn, textOn, textOff) {
        btn.textContent = isOn ? textOn : textOff;
        btn.classList.toggle('is-on', !!isOn);
    }

    syncUIStates() {
        const ac = window.AdminCheats;
        const map = [
            ['admin-toggle-godmode', ac.godMode, 'GOD MODE: ON', 'GOD MODE: OFF'],
            ['admin-toggle-squad-god', ac.squadGodMode, 'SQUAD GOD: ON', 'SQUAD GOD: OFF'],
            ['admin-toggle-inf-dash', ac.infiniteDash, 'INF DASH: ON', 'INF DASH: OFF'],
            ['admin-toggle-inf-skill', ac.noSkillCooldown, '0s SKILL CD: ON', '0s SKILL CD: OFF'],
            ['admin-toggle-inf-ult', ac.infiniteUlt, 'INF ULTIMATE: ON', 'INF ULTIMATE: OFF'],
            ['admin-toggle-super-speed', ac.superSpeed, '2x SPEED: ON', '2x SPEED: OFF'],
            ['admin-toggle-dmg-boost', ac.damageBoost, '10x DMG + CRIT: ON', '10x DMG + CRIT: OFF'],
            ['admin-toggle-instakill', ac.instaKillEnemies, '1-HIT AURA: ON', '1-HIT AURA: OFF']
        ];
        for (const [id, state, onTxt, offTxt] of map) {
            const el = document.getElementById(id);
            if (el) this.updateToggleButton(el, state, onTxt, offTxt);
        }
    }

    startTelemetry() {
        this.stopTelemetry();
        this.updateTelemetry();
        this.telemetryInterval = setInterval(() => this.updateTelemetry(), 200);
    }

    stopTelemetry() {
        if (this.telemetryInterval) {
            clearInterval(this.telemetryInterval);
            this.telemetryInterval = null;
        }
    }

    updateTelemetry() {
        const g = window.gameInstance;
        if (!g) return;

        const now = performance.now();
        const delta = now - this.lastFrameTime;
        this.lastFrameTime = now;
        const instantFps = Math.round(1000 / Math.max(1, delta));
        this.fpsHistory.push(instantFps);
        if (this.fpsHistory.length > 10) this.fpsHistory.shift();
        this.currentFps = Math.round(this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length);

        const setTxt = (id, txt) => {
            const el = document.getElementById(id);
            if (el) el.textContent = txt;
        };
        setTxt('telem-fps', `${this.currentFps} FPS`);
        setTxt('telem-enemies', `${g.enemies ? g.enemies.length : 0}`);
        setTxt('telem-bullets', `${g.bullets ? g.bullets.length : 0}`);
        setTxt('telem-drops', `${g.drops ? g.drops.length : 0}`);

        const mode = g.gameMode || 'story';
        const dm = g.waveManager && g.waveManager.dungeonManager;
        if (mode === 'dungeons' && dm) {
            setTxt('telem-wave', `Olympus Floor ${dm.floor}/5 (${g.state})`);
        } else if (g.waveManager) {
            setTxt('telem-wave', `${mode.toUpperCase()} Wave ${g.waveManager.wave} (${g.waveManager.waveState})`);
        }

        if (g.player) {
            const lvl = g.player.level || 1;
            const dmgMult = (g.player.damageMultiplier || 1).toFixed(2);
            setTxt('telem-player', `HP ${Math.round(g.player.hp)}/${g.player.maxHp} | Lv.${lvl} | DMG x${dmgMult}`);
        }

        const zeus = (typeof ZeusBoss !== 'undefined' && Array.isArray(g.enemies))
            ? g.enemies.find(e => e && !e.dead && e instanceof ZeusBoss) : null;
        const boss = zeus || (Array.isArray(g.enemies) ? g.enemies.find(e => e && !e.dead && e.isBoss) : null);
        if (zeus) {
            const crystalsAlive = Array.isArray(zeus.crystals) ? zeus.crystals.filter(c => c && !c.dead && c.hp > 0).length : 0;
            setTxt('telem-boss', `Zeus HP ${Math.round(zeus.hp)}/${zeus.maxHp} | SkyShield:${zeus.isFlying ? 'ON' : 'OFF'} (Crystals:${crystalsAlive}) | Minions:${zeus.totalMinionsSpawned}/${zeus.maxTotalMinionsSpawned}`);
        } else if (boss) {
            setTxt('telem-boss', `${boss.name || 'Boss'} HP ${Math.round(boss.hp)}/${boss.maxHp}`);
        } else {
            setTxt('telem-boss', 'None Active');
        }
    }
}

window.AdminPanel = new AdminPanelController();
