/**
 * Lesa.io - Admin & Playtesting Panel Controller
 * Handles UI interactions, tab switching, live telemetry updates,
 * and hotkey activations (F1 / ~).
 */

class AdminPanelController {
    constructor() {
        this.modal = null;
        this.activeTab = 'cheats';
        this.telemetryInterval = null;
        this.fpsHistory = [];
        this.lastFrameTime = performance.now();
        this.currentFps = 60;

        this.initDOM();
        this.initHotkeys();
    }

    initDOM() {
        this.modal = document.getElementById('admin-modal');
        if (!this.modal) return;

        // Close button
        const closeBtn = this.modal.querySelector('.modal-close-x-btn') || this.modal.querySelector('#close-admin-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Tab buttons
        const tabBtns = this.modal.querySelectorAll('.admin-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget.getAttribute('data-tab');
                this.switchTab(target);
            });
        });

        this.bindCheatControls();
        this.bindWaveControls();
        this.bindSpawnerControls();
        this.bindEconomyControls();
        this.bindAdminManagement();
    }

    initHotkeys() {
        window.addEventListener('keydown', async (e) => {
            // F1 or Tilde (~) secretly opens/closes Admin Panel ONLY for verified Firebase Admins
            if (e.key === 'F1' || e.key === '`' || e.key === '~') {
                // If panel is already open, allow pressing F1/~ to close it
                if (this.modal && !this.modal.classList.contains('hidden')) {
                    e.preventDefault();
                    this.close();
                    return;
                }

                // Check Firebase authorization completely silently
                const authResult = await window.AdminAuth.verifyAdminAccess();
                if (!authResult || !authResult.authorized) {
                    // 100% SILENT: Do absolutely nothing! No sound, no alert, no clue that admin exists.
                    return;
                }

                e.preventDefault();
                await this.open();
            }
        });
    }

    async toggle() {
        if (!this.modal) this.modal = document.getElementById('admin-modal');
        if (this.modal && !this.modal.classList.contains('hidden')) {
            this.close();
        } else {
            await this.open();
        }
    }

    async open() {
        if (!this.modal) this.modal = document.getElementById('admin-modal');
        if (!this.modal) return;

        // Strict Firebase Authorization Check (100% Silent for Non-Admins)
        const authResult = await window.AdminAuth.verifyAdminAccess();

        if (!authResult || !authResult.authorized) {
            // 100% SILENT: Return immediately without any alerts or sounds
            return;
        }

        // 2. Authorized -> Open Panel & Show user identity
        this.modal.classList.remove('hidden');
        if (window.soundEngine) window.soundEngine.playSelect();

        const adminEmailTag = document.getElementById('admin-current-user-email');
        if (adminEmailTag && authResult.user) {
            adminEmailTag.textContent = `Logged in as: ${authResult.user.email || authResult.user.uid} (Verified Admin 🛡️)`;
        }

        this.startTelemetry();
        this.syncUIStates();
    }

    close() {
        if (this.modal) this.modal.classList.add('hidden');
        if (window.soundEngine) window.soundEngine.playGoBack();
        this.stopTelemetry();
    }

    switchTab(tabName) {
        this.activeTab = tabName;
        const tabs = this.modal.querySelectorAll('.admin-tab-content');
        tabs.forEach(t => t.classList.add('hidden'));

        const targetTab = this.modal.querySelector(`#admin-tab-${tabName}`);
        if (targetTab) targetTab.classList.remove('hidden');

        const tabBtns = this.modal.querySelectorAll('.admin-tab-btn');
        tabBtns.forEach(b => {
            if (b.getAttribute('data-tab') === tabName) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });

        if (window.soundEngine) window.soundEngine.playSelect();
    }

    bindCheatControls() {
        // God Mode
        const godBtn = document.getElementById('admin-toggle-godmode');
        if (godBtn) {
            godBtn.addEventListener('click', () => {
                window.AdminCheats.godMode = !window.AdminCheats.godMode;
                this.updateToggleButton(godBtn, window.AdminCheats.godMode, 'GOD MODE: ON 🛡️', 'GOD MODE: OFF');
            });
        }

        // Infinite Dash
        const dashBtn = document.getElementById('admin-toggle-inf-dash');
        if (dashBtn) {
            dashBtn.addEventListener('click', () => {
                window.AdminCheats.infiniteDash = !window.AdminCheats.infiniteDash;
                this.updateToggleButton(dashBtn, window.AdminCheats.infiniteDash, 'INF DASH: ON ⚡', 'INF DASH: OFF');
            });
        }

        // 0s Skill Cooldown
        const skillBtn = document.getElementById('admin-toggle-inf-skill');
        if (skillBtn) {
            skillBtn.addEventListener('click', () => {
                window.AdminCheats.noSkillCooldown = !window.AdminCheats.noSkillCooldown;
                this.updateToggleButton(skillBtn, window.AdminCheats.noSkillCooldown, '0s SKILL CD: ON ⏱️', '0s SKILL CD: OFF');
            });
        }

        // Nuke Arena
        const nukeBtn = document.getElementById('admin-btn-nuke');
        if (nukeBtn) {
            nukeBtn.addEventListener('click', () => {
                if (window.gameInstance) {
                    const killed = window.AdminCheats.nukeArena(window.gameInstance);
                    alert(`💥 Nuke detonated! Obliterated ${killed} enemies.`);
                }
            });
        }

        // Magnetize Drops
        const magnetBtn = document.getElementById('admin-btn-magnet');
        if (magnetBtn) {
            magnetBtn.addEventListener('click', () => {
                if (window.gameInstance) {
                    const count = window.AdminCheats.magnetizeDrops(window.gameInstance);
                    alert(`🧲 Pulled ${count} drops to hero.`);
                }
            });
        }

        // Speed Multipliers
        const speedBtns = this.modal.querySelectorAll('.admin-speed-btn');
        speedBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const spd = parseFloat(e.currentTarget.getAttribute('data-speed')) || 1.0;
                window.AdminCheats.gameSpeed = spd;
                speedBtns.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
    }

    bindWaveControls() {
        // Warp to Wave
        const warpBtn = document.getElementById('admin-btn-warp-wave');
        const waveInput = document.getElementById('admin-input-wave');
        if (warpBtn && waveInput) {
            warpBtn.addEventListener('click', () => {
                if (window.gameInstance) {
                    const w = parseInt(waveInput.value, 10) || 1;
                    window.AdminCheats.jumpToWave(window.gameInstance, w);
                    this.close();
                }
            });
        }

        // Jump directly to Wave 10 (Boss Kleanthis)
        const bossJumpBtn = document.getElementById('admin-btn-jump-wave10');
        if (bossJumpBtn) {
            bossJumpBtn.addEventListener('click', () => {
                if (window.gameInstance) {
                    window.AdminCheats.jumpToWave(window.gameInstance, 10);
                    this.close();
                }
            });
        }

        // Boss Actions
        const bossActionBtns = this.modal.querySelectorAll('.admin-boss-action-btn');
        bossActionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                if (window.gameInstance) {
                    const success = window.AdminCheats.forceBossAction(window.gameInstance, action);
                    if (!success) {
                        alert('⚠️ Boss Kleanthis is not currently active in the arena! Spawn him first or jump to Wave 10.');
                    }
                }
            });
        });
    }

    bindSpawnerControls() {
        const spawnBtns = this.modal.querySelectorAll('.admin-spawn-btn');
        spawnBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.getAttribute('data-type');
                const count = parseInt(e.currentTarget.getAttribute('data-count'), 10) || 1;
                if (window.gameInstance) {
                    window.AdminCheats.spawnEntity(window.gameInstance, type, count);
                }
            });
        });

        const dropBtns = this.modal.querySelectorAll('.admin-drop-btn');
        dropBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dropType = e.currentTarget.getAttribute('data-drop');
                if (window.gameInstance && window.gameInstance.player && typeof Drop !== 'undefined') {
                    const p = window.gameInstance.player;
                    for (let i = 0; i < 5; i++) {
                        const rx = p.x + (Math.random() * 80 - 40);
                        const ry = p.y + (Math.random() * 80 - 40);
                        window.gameInstance.drops.push(new Drop(rx, ry, dropType, 30));
                    }
                    if (window.soundEngine) window.soundEngine.playPickup('star');
                }
            });
        });
    }

    bindEconomyControls() {
        const coinBtns = this.modal.querySelectorAll('.admin-add-coins-btn');
        coinBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const amt = parseInt(e.currentTarget.getAttribute('data-amount'), 10) || 1000;
                window.AdminCheats.addCurrency('coins', amt);
            });
        });

        const gemBtns = this.modal.querySelectorAll('.admin-add-gems-btn');
        gemBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const amt = parseInt(e.currentTarget.getAttribute('data-amount'), 10) || 100;
                window.AdminCheats.addCurrency('gems', amt);
            });
        });

        const maxSkillsBtn = document.getElementById('admin-btn-max-skills');
        if (maxSkillsBtn) {
            maxSkillsBtn.addEventListener('click', () => {
                window.AdminCheats.maxAllSkills();
                alert('⭐ All skills upgraded to MAX Level 3!');
            });
        }

        const unlockHeroesBtn = document.getElementById('admin-btn-unlock-heroes');
        if (unlockHeroesBtn) {
            unlockHeroesBtn.addEventListener('click', () => {
                window.AdminCheats.unlockAllHeroes();
                alert('👑 All heroes (Psanas, Petros, Psogas) unlocked!');
            });
        }
    }

    bindAdminManagement() {
        const addAdminBtn = document.getElementById('admin-btn-add-admin');
        const addAdminInput = document.getElementById('admin-input-new-admin');

        if (addAdminBtn && addAdminInput) {
            addAdminBtn.addEventListener('click', async () => {
                const target = addAdminInput.value.trim();
                if (!target) return alert('Please enter an email or UID.');

                try {
                    addAdminBtn.disabled = true;
                    addAdminBtn.textContent = 'SAVING TO FIREBASE...';
                    await window.AdminAuth.grantAdminPrivilege(target);
                    alert(`✅ Successfully granted Admin access in Firebase Firestore to:\n${target}`);
                    addAdminInput.value = '';
                } catch (err) {
                    alert(`❌ Failed to grant admin: ${err.message}`);
                } finally {
                    addAdminBtn.disabled = false;
                    addAdminBtn.textContent = 'GRANT ADMIN ACCESS 🛡️';
                }
            });
        }
    }

    updateToggleButton(btn, isOn, textOn, textOff) {
        if (isOn) {
            btn.textContent = textOn;
            btn.style.background = '#2ed573';
            btn.style.color = '#ffffff';
        } else {
            btn.textContent = textOff;
            btn.style.background = '#dfe4ea';
            btn.style.color = '#2f3542';
        }
    }

    syncUIStates() {
        const godBtn = document.getElementById('admin-toggle-godmode');
        if (godBtn) this.updateToggleButton(godBtn, window.AdminCheats.godMode, 'GOD MODE: ON 🛡️', 'GOD MODE: OFF');

        const dashBtn = document.getElementById('admin-toggle-inf-dash');
        if (dashBtn) this.updateToggleButton(dashBtn, window.AdminCheats.infiniteDash, 'INF DASH: ON ⚡', 'INF DASH: OFF');

        const skillBtn = document.getElementById('admin-toggle-inf-skill');
        if (skillBtn) this.updateToggleButton(skillBtn, window.AdminCheats.noSkillCooldown, '0s SKILL CD: ON ⏱️', '0s SKILL CD: OFF');
    }

    startTelemetry() {
        this.stopTelemetry();
        this.telemetryInterval = setInterval(() => {
            this.updateTelemetry();
        }, 200);
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
        const instantFps = Math.round(1000 / (delta || 16.6));
        this.fpsHistory.push(instantFps);
        if (this.fpsHistory.length > 10) this.fpsHistory.shift();
        this.currentFps = Math.round(this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length);

        const elFps = document.getElementById('telem-fps');
        if (elFps) elFps.textContent = `${this.currentFps} FPS`;

        const elEnemies = document.getElementById('telem-enemies');
        if (elEnemies) elEnemies.textContent = `${g.enemies ? g.enemies.length : 0}`;

        const elBullets = document.getElementById('telem-bullets');
        if (elBullets) elBullets.textContent = `${g.bullets ? g.bullets.length : 0}`;

        const elDrops = document.getElementById('telem-drops');
        if (elDrops) elDrops.textContent = `${g.drops ? g.drops.length : 0}`;

        const elWave = document.getElementById('telem-wave');
        if (elWave && g.waveManager) elWave.textContent = `Wave ${g.waveManager.wave} (${g.waveManager.waveState})`;

        const elPlayer = document.getElementById('telem-player');
        if (elPlayer && g.player) {
            elPlayer.textContent = `HP: ${Math.round(g.player.hp)}/${g.player.maxHp} | Pos: (${Math.round(g.player.x)}, ${Math.round(g.player.y)})`;
        }
    }
}

// Global Singleton
window.AdminPanel = new AdminPanelController();
