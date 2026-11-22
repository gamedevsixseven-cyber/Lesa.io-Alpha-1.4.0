/**
 * Lesa.io - Settings & Preferences Manager
 * Handles Settings Modal, Live Audio Volume Sliders, Visual/Screen-shake toggles,
 * and Google Account Cloud Save & Account Binding
 */

class SettingsManager {
    constructor(uiController) {
        this.ui = uiController;

        this.settingsModal = document.getElementById('settings-modal');

        this.musicSlider = document.getElementById('music-volume-slider');
        this.musicValText = document.getElementById('music-volume-text');
        this.sfxSlider = document.getElementById('sfx-volume-slider');
        this.sfxValText = document.getElementById('sfx-volume-text');

        this.togglePopupsBtn = document.getElementById('toggle-popups-btn');
        this.toggleDamageBtn = document.getElementById('toggle-damage-btn');
        this.toggleShakeBtn = document.getElementById('toggle-shake-btn');
        this.toggleAutofireBtn = document.getElementById('toggle-autofire-btn');

        // Mobile-Only Tabbed Settings & Extra Controls
        this.mobTabBtns = document.querySelectorAll('#mobile-settings-tabs .mob-stab-btn');
        this.mobGfxBtns = document.querySelectorAll('.mob-seg-btn[data-quality]');
        this.toggleFpsBtn = document.getElementById('toggle-fps-btn');
        this.toggleMuteBtn = document.getElementById('toggle-mute-btn');
        this.toggleHapticsBtn = document.getElementById('toggle-haptics-btn');
        this.toggleAimReticleBtn = document.getElementById('toggle-aim-reticle-btn');
        this.cycleAimRangeBtn = document.getElementById('cycle-aim-range-btn');
        this.cycleTouchOpacityBtn = document.getElementById('cycle-touch-opacity-btn');
        this.toggleAutopauseBtn = document.getElementById('toggle-autopause-btn');
        this.activeMobileTab = this._loadInitialMobileTab();

        // Cloud & Save Elements
        this.bindGoogleBtn = document.getElementById('bind-google-btn');
        this.syncCloudBtn = document.getElementById('sync-cloud-btn');
        this.unlinkGoogleBtn = document.getElementById('unlink-google-btn');
        this.cloudStatusBadge = document.getElementById('cloud-status-badge');
        this.cloudStatusText = document.getElementById('cloud-status-text');
        this.cloudLastSync = document.getElementById('cloud-last-sync');
        this.cloudUserInfo = document.getElementById('cloud-user-info');
        this.cloudUserName = document.getElementById('cloud-user-name');
        this.cloudUserEmail = document.getElementById('cloud-user-email');

        this.initEvents();
        this.updateSettingsUI();
        this.updateCloudUI();
    }

    initEvents() {
        if (this.settingsModal) {
            if (this.settingsModal.dataset.eventsBound === '1') return;
            this.settingsModal.dataset.eventsBound = '1';
        }
        const menuSettingsBtn = document.getElementById('menu-settings-btn');
        if (menuSettingsBtn) {
            menuSettingsBtn.addEventListener('click', () => {
                window.soundEngine.playSelect();
                this.showSettingsModal();
            });
        }

        const pauseSettingsBtn = document.getElementById('pause-settings-btn');
        if (pauseSettingsBtn) {
            pauseSettingsBtn.addEventListener('click', () => {
                window.soundEngine.playSelect();
                this.showSettingsModal();
            });
        }

        const closeSettingsBtn = document.getElementById('close-settings-btn');
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => {
                window.soundEngine.playGoBack();
                this.hideSettingsModal();
            });
        }



        if (this.musicSlider) {
            const onMusicChange = (e) => {
                const val = parseInt(e.target.value, 10);
                if (window.soundEngine) {
                    if (typeof window.soundEngine.init === 'function') window.soundEngine.init();
                    window.soundEngine.setBgmVolume(val / 100);
                }
                if (this.musicValText) this.musicValText.textContent = `${val}%`;
            };
            this.musicSlider.addEventListener('input', onMusicChange);
            this.musicSlider.addEventListener('change', onMusicChange);
        }

        if (this.sfxSlider) {
            const onSfxInput = (e) => {
                const val = parseInt(e.target.value, 10);
                if (window.soundEngine) window.soundEngine.setMasterVolume(val / 100);
                if (this.sfxValText) this.sfxValText.textContent = `${val}%`;
            };
            this.sfxSlider.addEventListener('input', onSfxInput);
            this.sfxSlider.addEventListener('change', (e) => {
                onSfxInput(e);
                if (window.soundEngine) window.soundEngine.playSelect();
            });
        }

        if (this.togglePopupsBtn) {
            this.togglePopupsBtn.addEventListener('click', () => {
                window.soundEngine.playSelect();
                const current = window.effectsManager ? window.effectsManager.showPopups : true;
                if (window.effectsManager) window.effectsManager.setShowPopups(!current);
                this.updateSettingsUI();
            });
        }

        if (this.toggleDamageBtn) {
            this.toggleDamageBtn.addEventListener('click', () => {
                window.soundEngine.playSelect();
                const current = window.effectsManager ? window.effectsManager.showDamage : true;
                if (window.effectsManager) window.effectsManager.setShowDamage(!current);
                this.updateSettingsUI();
            });
        }

        if (this.toggleShakeBtn) {
            this.toggleShakeBtn.addEventListener('click', () => {
                window.soundEngine.playSelect();
                const current = localStorage.getItem('lesaio_screenshake') !== 'false';
                localStorage.setItem('lesaio_screenshake', (!current).toString());
                this.updateSettingsUI();
            });
        }

        if (this.toggleAutofireBtn) {
            this.toggleAutofireBtn.addEventListener('click', () => {
                window.soundEngine.playSelect();
                const current = localStorage.getItem('lesaio_autofire') === 'true';
                localStorage.setItem('lesaio_autofire', (!current).toString());
                if (window.gameInstance && window.gameInstance.touchInput) {
                    window.gameInstance.touchInput.autoFireEnabled = !current;
                    if (typeof window.gameInstance.touchInput.updateAutoFireState === 'function') {
                        window.gameInstance.touchInput.updateAutoFireState();
                    }
                }
                this.updateSettingsUI();
            });
        }

        // ================= MOBILE-ONLY TABS & EXTRA SETTINGS =================
        this.mobTabBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                this.setMobileTab(btn.getAttribute('data-mob-tab-btn'));
            });
        });

        this.mobGfxBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                const q = btn.getAttribute('data-quality');
                if (typeof MobilePerf !== 'undefined') {
                    MobilePerf.setGraphicsQuality(q, window.gameInstance);
                    MobilePerf.tickFpsHUD(document.getElementById('mobile-fps-pill'));
                }
                this.updateSettingsUI();
            });
        });

        this._bindLocalToggle(this.toggleFpsBtn, 'lesaio_show_fps', false, () => {
            if (typeof MobilePerf !== 'undefined') {
                MobilePerf.tickFpsHUD(document.getElementById('mobile-fps-pill'));
            }
        });
        this._bindLocalToggle(this.toggleHapticsBtn, 'lesaio_haptics', true, (next) => {
            if (next && window.gameInstance && window.gameInstance.touchInput) {
                window.gameInstance.touchInput.vibrate(20);
            }
        });
        this._bindLocalToggle(this.toggleAimReticleBtn, 'lesaio_aim_reticle', true);
        this._bindLocalToggle(this.toggleAutopauseBtn, 'lesaio_mobile_autopause', true);

        if (this.toggleMuteBtn) {
            this.toggleMuteBtn.addEventListener('click', () => {
                const nextMuted = !(window.soundEngine && window.soundEngine.muted);
                if (window.soundEngine && typeof window.soundEngine.setMuted === 'function') {
                    window.soundEngine.setMuted(nextMuted);
                    if (!nextMuted) window.soundEngine.playSelect();
                }
                this.updateSettingsUI();
            });
        }

        if (this.cycleAimRangeBtn) {
            this.cycleAimRangeBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                const steps = [520, 750, 980];
                const cur = (typeof MobilePerf !== 'undefined') ? MobilePerf.getAutoAimRange() : 750;
                const idx = steps.indexOf(cur);
                const next = steps[(idx + 1) % steps.length];
                localStorage.setItem('lesaio_autoaim_range', String(next));
                if (window.gameInstance && window.gameInstance.touchInput) {
                    window.gameInstance.touchInput.applyPreferences();
                }
                this.updateSettingsUI();
            });
        }

        if (this.cycleTouchOpacityBtn) {
            this.cycleTouchOpacityBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                const steps = [1.0, 0.75, 0.5];
                const cur = (typeof MobilePerf !== 'undefined') ? MobilePerf.getTouchOpacity() : 1.0;
                const idx = steps.findIndex((s) => Math.abs(s - cur) < 0.05);
                const next = steps[(idx + 1) % steps.length];
                localStorage.setItem('lesaio_touch_opacity', String(next));
                if (window.gameInstance && window.gameInstance.touchInput) {
                    window.gameInstance.touchInput.applyPreferences();
                }
                this.updateSettingsUI();
            });
        }

        // ================= GOOGLE ACCOUNT BINDING EVENTS =================
        if (this.bindGoogleBtn) {
            this.bindGoogleBtn.addEventListener('click', () => {
                window.soundEngine.playSelect();
                this.handleGoogleSignIn();
            });
        }

        if (this.syncCloudBtn) {
            this.syncCloudBtn.addEventListener('click', () => {
                window.soundEngine.playSelect();
                this.syncCloudSave();
            });
        }

        if (this.unlinkGoogleBtn) {
            this.unlinkGoogleBtn.addEventListener('click', () => {
                window.soundEngine.playGoBack();
                this.unlinkGoogleAccount();
            });
        }
    }

    async handleGoogleSignIn() {
        if (window.cloudSave && window.cloudSave.isInitialized) {
            const res = await window.cloudSave.signInWithGoogle();
            if (res && res.success) {
                window.soundEngine.playPickup('star');
                const userDisplayName = res.user.displayName || res.user.email?.split('@')[0] || 'Player';

                if (res.syncResult && res.syncResult.hasCloudData) {
                    const d = res.syncResult.details;
                    alert(`🎉 Cloud Account Connected!\n\nWelcome back, ${d.name || userDisplayName}!\n• Level: ${d.accountLevel}\n• Coins: 🪙 ${d.coins.toLocaleString()}\n• Gems: 💎 ${d.gems.toLocaleString()}\n• Heroes: ${d.heroesCount} unlocked\n• Gear: ${d.gearCount} items\n\nReloading game with your cloud save...`);
                } else {
                    alert(`🎉 Google Account Linked!\n\nWelcome, ${userDisplayName}!\nYour current progress has been secured to your Google Account.\n\nReloading session...`);
                }

                window.location.reload();
                return;
            } else if (res && !res.fallback) {
                return;
            }
        }

        // Fallback Quick-Link mode if Firebase API key hasn't been pasted yet
        const playerName = localStorage.getItem('lesaio_player_name') || 'Hero';
        const defaultEmail = `${playerName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`;

        const enteredEmail = prompt('Enter your Google Account email to bind your game progress:', defaultEmail);
        if (!enteredEmail || !enteredEmail.includes('@')) {
            if (enteredEmail !== null) alert('Please enter a valid email address.');
            return;
        }

        const userName = enteredEmail.split('@')[0];
        const formattedName = userName.charAt(0).toUpperCase() + userName.slice(1);

        localStorage.setItem('lesaio_google_linked', 'true');
        localStorage.setItem('lesaio_google_email', enteredEmail);
        localStorage.setItem('lesaio_google_name', formattedName);

        this.syncCloudSave(true);
        window.soundEngine.playPickup('star');
        alert(`🎉 Google Account linked successfully!\n\nEmail: ${enteredEmail}\nYour progress is now secured to the cloud.`);
        this.updateCloudUI();
    }

    async syncCloudSave(silent = false) {
        const isLinked = localStorage.getItem('lesaio_google_linked') === 'true';
        if (!isLinked) return;

        if (this.syncCloudBtn && !silent) {
            this.syncCloudBtn.innerHTML = `<span>${typeof UiIcons !== 'undefined' ? UiIcons.i('hourglass', 'ui-icon-sm') : '⏳'} SYNCING...</span>`;
            this.syncCloudBtn.disabled = true;
        }

        // Package all current player data using canonical keys
        const gs = window.GameState;
        const p = gs ? gs.player : null;
        const s = p ? p.stats : null;

        const serialized = (typeof SaveSerializer !== 'undefined' && gs) ? SaveSerializer.serialize(gs) : null;
        const savePayload = {
            ...(serialized || {}),
            coins: this.ui.coins,
            gems: this.ui.gems,
            playerName: (p && p.name) || localStorage.getItem('lesaio_player_name') || 'Psanas',
            level: (p && p.accountLevel) || parseInt(localStorage.getItem('lesaio_account_level') || '1', 10),
            xp: (p && p.accountXp) || parseInt(localStorage.getItem('lesaio_account_xp') || '0', 10),
            unlockedHeroes: (p && p.unlockedHeroes) || JSON.parse(localStorage.getItem('lesaio_unlocked_heroes') || '["psanas"]'),
            selectedHero: (p && p.selectedHero) || localStorage.getItem('lesaio_selected_hero') || 'psanas',
            highScore: (s && s.highScore) || parseInt(localStorage.getItem('lesaio_highscore') || '0', 10),
            maxWave: (s && s.maxWave) || parseInt(localStorage.getItem('lesaio_max_wave') || '1', 10),
            fatmirsKilled: (s && s.totalFatmirs) || parseInt(localStorage.getItem('lesaio_total_fatmirs') || '0', 10),
            casillasKilled: (s && s.totalCasillas) || parseInt(localStorage.getItem('lesaio_total_casillas') || '0', 10),
            skarmogyftosKilled: (s && s.totalSkarmogyftos) || parseInt(localStorage.getItem('lesaio_total_skarmogyftos') || '0', 10),
            timestamp: new Date().toISOString()
        };

        // Sync to remote Firestore
        let cloudSuccess = false;
        if (window.cloudSave && window.cloudSave.isInitialized) {
            cloudSuccess = await window.cloudSave.saveToCloud(savePayload);
        }

        // Save local snapshot
        localStorage.setItem('lesaio_cloud_payload', JSON.stringify(savePayload));
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        localStorage.setItem('lesaio_last_cloud_sync', `Today at ${timeStr}`);

        this.updateCloudUI();

        if (!silent) {
            window.soundEngine.playPickup('star');
            if (this.syncCloudBtn) {
                this.syncCloudBtn.disabled = false;
                const okIc = typeof UiIcons !== 'undefined' ? UiIcons.i('check', 'ui-icon-sm') : '✅';
                this.syncCloudBtn.innerHTML = cloudSuccess ? `<span>${okIc} CLOUD SYNCED!</span>` : `<span>${okIc} SAVED!</span>`;
                setTimeout(() => {
                    if (this.syncCloudBtn) this.syncCloudBtn.innerHTML = `<span>${typeof UiIcons !== 'undefined' ? UiIcons.i('sync', 'ui-icon-sm') : '🔄'} SYNC NOW</span>`;
                }, 2000);
            }
        }
    }

    async unlinkGoogleAccount() {
        const confirmDisconnect = confirm(
            '⚠️ Disconnect Google Account?\n\n' +
            '• Your cloud progress will remain safely saved in Google Cloud.\n' +
            '• This device will reload and reset to a fresh Guest account.\n\n' +
            'Do you want to continue?'
        );
        if (!confirmDisconnect) return;

        if (window.cloudSave) {
            await window.cloudSave.signOut();
        }

        if (typeof AccountSyncManager !== 'undefined') {
            AccountSyncManager.resetToGuestAccount();
        } else {
            localStorage.removeItem('lesaio_save_v2');
            localStorage.removeItem('lesaio_player_uid');
            localStorage.removeItem('lesaio_google_linked');
            localStorage.removeItem('lesaio_google_uid');
            localStorage.removeItem('lesaio_google_email');
            localStorage.removeItem('lesaio_google_name');
            localStorage.removeItem('lesaio_last_cloud_sync');
        }

        window.location.reload();
    }

    updateCloudUI() {
        const isLinked = localStorage.getItem('lesaio_google_linked') === 'true';
        const email = localStorage.getItem('lesaio_google_email') || '';
        const name = localStorage.getItem('lesaio_google_name') || 'Google User';
        const lastSync = localStorage.getItem('lesaio_last_cloud_sync') || 'Not Synced';

        if (isLinked) {
            if (this.cloudStatusBadge) {
                this.cloudStatusBadge.className = 'cloud-status-badge status-linked';
                if (this.cloudStatusText) {
                    if (typeof UiIcons !== 'undefined') UiIcons.setRichText(this.cloudStatusText, '☁️ Synced to Google Cloud', 'ui-icon-sm');
                    else this.cloudStatusText.textContent = '☁️ Synced to Google Cloud';
                }
            }
            if (this.cloudLastSync) this.cloudLastSync.textContent = `Last Sync: ${lastSync}`;

            if (this.cloudUserInfo) {
                this.cloudUserInfo.classList.remove('hidden');
                if (this.cloudUserName) this.cloudUserName.textContent = name;
                if (this.cloudUserEmail) this.cloudUserEmail.textContent = email;
            }

            if (this.bindGoogleBtn) this.bindGoogleBtn.classList.add('hidden');
            if (this.syncCloudBtn) this.syncCloudBtn.classList.remove('hidden');
            if (this.unlinkGoogleBtn) this.unlinkGoogleBtn.classList.remove('hidden');
        } else {
            if (this.cloudStatusBadge) {
                this.cloudStatusBadge.className = 'cloud-status-badge';
                if (this.cloudStatusText) this.cloudStatusText.textContent = 'Guest Account (Local Only)';
            }
            if (this.cloudLastSync) this.cloudLastSync.textContent = 'Not Synced';

            if (this.cloudUserInfo) this.cloudUserInfo.classList.add('hidden');

            if (this.bindGoogleBtn) this.bindGoogleBtn.classList.remove('hidden');
            if (this.syncCloudBtn) this.syncCloudBtn.classList.add('hidden');
            if (this.unlinkGoogleBtn) this.unlinkGoogleBtn.classList.add('hidden');
        }
    }

    updateSettingsUI() {
        if (this.musicSlider && window.soundEngine) {
            const bgmVal = Math.round(window.soundEngine.bgmVolume * 100);
            this.musicSlider.value = bgmVal;
            if (this.musicValText) this.musicValText.textContent = `${bgmVal}%`;
        }

        if (this.sfxSlider && window.soundEngine) {
            const sfxVal = Math.round(window.soundEngine.masterVolume * 100);
            this.sfxSlider.value = sfxVal;
            if (this.sfxValText) this.sfxValText.textContent = `${sfxVal}%`;
        }

        this._renderToggleBtn(this.togglePopupsBtn, window.effectsManager ? window.effectsManager.showPopups : true);
        this._renderToggleBtn(this.toggleDamageBtn, window.effectsManager ? window.effectsManager.showDamage : true);
        this._renderToggleBtn(this.toggleShakeBtn, localStorage.getItem('lesaio_screenshake') !== 'false');
        this._renderToggleBtn(this.toggleAutofireBtn, localStorage.getItem('lesaio_autofire') === 'true');
        this._updateMobileSettingsUI();

        this.updateCloudUI();
    }

    _loadInitialMobileTab() {
        const saved = localStorage.getItem('lesaio_mob_settings_tab');
        return (saved === 'graphics' || saved === 'audio' || saved === 'gameplay') ? saved : 'graphics';
    }

    _bindLocalToggle(btn, storageKey, defaultVal, afterFn = null) {
        if (!btn) return;
        btn.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playSelect();
            const raw = localStorage.getItem(storageKey);
            const cur = raw === null ? defaultVal : (raw === 'true');
            const next = !cur;
            localStorage.setItem(storageKey, String(next));
            if (afterFn) afterFn(next);
            this.updateSettingsUI();
        });
    }

    _renderToggleBtn(btn, isOn) {
        if (!btn) return;
        if (typeof UiIcons !== 'undefined') UiIcons.setRichText(btn, isOn ? 'ON ✅' : 'OFF ❌', 'ui-icon-sm');
        else btn.textContent = isOn ? 'ON ✅' : 'OFF ❌';
        btn.className = isOn ? 'comic-btn comic-btn-sm toggle-on' : 'comic-btn comic-btn-sm toggle-off';
    }

    setMobileTab(tab) {
        const valid = (tab === 'graphics' || tab === 'audio' || tab === 'gameplay') ? tab : 'graphics';
        this.activeMobileTab = valid;
        localStorage.setItem('lesaio_mob_settings_tab', valid);
        this._syncMobileTabDOM();
    }

    _syncMobileTabDOM() {
        const isMob = (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile);
        if (this.settingsModal) {
            this.settingsModal.classList.toggle('mob-tabs-active', !!isMob);
            if (isMob) this.settingsModal.setAttribute('data-active-tab', this.activeMobileTab);
            else this.settingsModal.removeAttribute('data-active-tab');
        }
        this.mobTabBtns.forEach((btn) => {
            const active = btn.getAttribute('data-mob-tab-btn') === this.activeMobileTab;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-selected', active ? 'true' : 'false');
        });
    }

    _updateMobileSettingsUI() {
        this._syncMobileTabDOM();
        if (typeof MobilePerf === 'undefined' || !MobilePerf.isMobile) return;

        const quality = MobilePerf.getGraphicsQuality();
        this.mobGfxBtns.forEach((btn) => {
            btn.classList.toggle('active', btn.getAttribute('data-quality') === quality);
        });

        this._renderToggleBtn(this.toggleFpsBtn, MobilePerf.shouldShowFps());
        this._renderToggleBtn(this.toggleMuteBtn, !!(window.soundEngine && window.soundEngine.muted));
        this._renderToggleBtn(this.toggleHapticsBtn, MobilePerf.isHapticsEnabled());
        this._renderToggleBtn(this.toggleAimReticleBtn, MobilePerf.shouldShowAimReticle());
        this._renderToggleBtn(this.toggleAutopauseBtn, MobilePerf.shouldAutoPauseOnBlur());

        if (this.cycleAimRangeBtn) {
            const range = MobilePerf.getAutoAimRange();
            this.cycleAimRangeBtn.textContent = range <= 550 ? 'SHORT' : (range >= 900 ? 'FAR' : 'NORMAL');
        }
        if (this.cycleTouchOpacityBtn) {
            const pct = Math.round(MobilePerf.getTouchOpacity() * 100);
            this.cycleTouchOpacityBtn.textContent = `${pct}%`;
        }
    }

    showSettingsModal() {
        this.updateSettingsUI();
        if (this.settingsModal) this.settingsModal.classList.remove('hidden');
    }

    hideSettingsModal() {
        if (this.settingsModal) this.settingsModal.classList.add('hidden');
    }
}
