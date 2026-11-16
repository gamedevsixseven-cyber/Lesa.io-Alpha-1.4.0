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
            this.musicSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value, 10);
                window.soundEngine.setBgmVolume(val / 100);
                if (this.musicValText) this.musicValText.textContent = `${val}%`;
            });
        }

        if (this.sfxSlider) {
            this.sfxSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value, 10);
                window.soundEngine.setMasterVolume(val / 100);
                if (this.sfxValText) this.sfxValText.textContent = `${val}%`;
            });
            this.sfxSlider.addEventListener('change', () => {
                window.soundEngine.playSelect();
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

        if (this.togglePopupsBtn) {
            const on = window.effectsManager ? window.effectsManager.showPopups : true;
            if (typeof UiIcons !== 'undefined') UiIcons.setRichText(this.togglePopupsBtn, on ? 'ON ✅' : 'OFF ❌', 'ui-icon-sm');
            else this.togglePopupsBtn.textContent = on ? 'ON ✅' : 'OFF ❌';
            this.togglePopupsBtn.className = on ? 'comic-btn comic-btn-sm toggle-on' : 'comic-btn comic-btn-sm toggle-off';
        }
        if (this.toggleDamageBtn) {
            const on = window.effectsManager ? window.effectsManager.showDamage : true;
            if (typeof UiIcons !== 'undefined') UiIcons.setRichText(this.toggleDamageBtn, on ? 'ON ✅' : 'OFF ❌', 'ui-icon-sm');
            else this.toggleDamageBtn.textContent = on ? 'ON ✅' : 'OFF ❌';
            this.toggleDamageBtn.className = on ? 'comic-btn comic-btn-sm toggle-on' : 'comic-btn comic-btn-sm toggle-off';
        }
        if (this.toggleShakeBtn) {
            const on = localStorage.getItem('lesaio_screenshake') !== 'false';
            if (typeof UiIcons !== 'undefined') UiIcons.setRichText(this.toggleShakeBtn, on ? 'ON ✅' : 'OFF ❌', 'ui-icon-sm');
            else this.toggleShakeBtn.textContent = on ? 'ON ✅' : 'OFF ❌';
            this.toggleShakeBtn.className = on ? 'comic-btn comic-btn-sm toggle-on' : 'comic-btn comic-btn-sm toggle-off';
        }
        if (this.toggleAutofireBtn) {
            const on = localStorage.getItem('lesaio_autofire') === 'true';
            if (typeof UiIcons !== 'undefined') UiIcons.setRichText(this.toggleAutofireBtn, on ? 'ON ✅' : 'OFF ❌', 'ui-icon-sm');
            else this.toggleAutofireBtn.textContent = on ? 'ON ✅' : 'OFF ❌';
            this.toggleAutofireBtn.className = on ? 'comic-btn comic-btn-sm toggle-on' : 'comic-btn comic-btn-sm toggle-off';
        }

        this.updateCloudUI();
    }

    showSettingsModal() {
        this.updateSettingsUI();
        if (this.settingsModal) this.settingsModal.classList.remove('hidden');
    }

    hideSettingsModal() {
        if (this.settingsModal) this.settingsModal.classList.add('hidden');
    }
}
