/**
 * Lesa.io - Co-op Mutual Pause Ready UI, State Synchronization & Player Leave Popups
 * Coordinates 0/2 -> 1/2 -> 2/2 unpause readiness between Host and Guest and displays leave popups.
 */

class CoopPauseSync {
    static _leftTimer = null;

    static _escapeHtml(str) {
        return String(str || '').replace(/[&<>"']/g, (m) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[m]));
    }

    static _ensureReadyPill() {
        if (typeof document === 'undefined') return null;
        let pill = document.getElementById('pause-coop-ready-pill');
        if (pill) return pill;
        const actions = document.querySelector('#pause-modal .modal-actions');
        if (!actions || !actions.parentNode) return null;
        pill = document.createElement('div');
        pill.id = 'pause-coop-ready-pill';
        pill.className = 'pause-coop-status-pill hidden';
        actions.parentNode.insertBefore(pill, actions);
        return pill;
    }

    static updatePauseModalUI(pauseState = null) {
        if (typeof document === 'undefined') return;
        const resumeBtn = document.getElementById('resume-btn');
        const subtitleEl = document.querySelector('#pause-modal .modal-subtitle');
        const pill = this._ensureReadyPill();

        if (!pauseState) {
            if (pill) pill.classList.add('hidden');
            if (resumeBtn) {
                resumeBtn.disabled = false;
                resumeBtn.classList.remove('is-coop-waiting', 'is-coop-all-ready');
                resumeBtn.innerHTML = '<img src="assets/ui-icons/play.svg" class="ui-icon ui-icon-sm" alt=""> RESUME';
            }
            if (subtitleEl && subtitleEl.dataset && subtitleEl.dataset.soloRestore) {
                subtitleEl.textContent = subtitleEl.dataset.soloRestore;
                delete subtitleEl.dataset.soloRestore;
            }
            return;
        }

        const total = Math.max(1, Number(pauseState.totalPlayers) || 2);
        const readyCount = Math.max(0, Math.min(total, Number(pauseState.readyCount) || 0));
        const localReady = !!pauseState.localReady;
        const resuming = !!pauseState.resuming;
        const by = pauseState.by || 'Player';

        if (subtitleEl) {
            if (subtitleEl.dataset) subtitleEl.dataset.soloRestore = 'Catch your breath!';
            subtitleEl.textContent = `⏸ ${String(by).toUpperCase()} PAUSED THE GAME`;
        }

        if (pill) {
            pill.classList.remove('hidden', 'is-one-ready', 'is-all-ready');
            if (resuming || readyCount >= total) {
                pill.classList.add('is-all-ready');
                pill.textContent = `✅ UNPAUSING (${readyCount}/${total}) — ALL PLAYERS READY!`;
            } else if (readyCount > 0) {
                pill.classList.add('is-one-ready');
                pill.textContent = `⏳ CO-OP UNPAUSE READY: ${readyCount}/${total} (${localReady ? 'Waiting for squadmates' : 'Click Unpause when ready'})`;
            } else {
                pill.textContent = `⏸ CO-OP UNPAUSE READY: 0/${total} (All players must unpause)`;
            }
        }

        if (resumeBtn) {
            resumeBtn.classList.remove('is-coop-waiting', 'is-coop-all-ready');
            if (resuming || readyCount >= total) {
                resumeBtn.disabled = true;
                resumeBtn.classList.add('is-coop-all-ready');
                resumeBtn.textContent = `✅ RESUMING (${total}/${total})`;
            } else if (localReady) {
                resumeBtn.disabled = false;
                resumeBtn.classList.add('is-coop-waiting');
                resumeBtn.textContent = `⏳ READY (${readyCount}/${total}) • CANCEL`;
            } else {
                resumeBtn.disabled = false;
                resumeBtn.textContent = `▶ UNPAUSE (${readyCount}/${total})`;
            }
        }
    }

    static syncPauseModal(pausedBy = null) {
        const g = (typeof window !== 'undefined') ? window.gameInstance : null;
        const cs = g && g.coopSession;
        if (!cs) {
            this.updatePauseModalUI(null);
            return;
        }
        this.updatePauseModalUI(typeof cs.getPauseUIState === 'function'
            ? cs.getPauseUIState(pausedBy)
            : { by: pausedBy || 'Partner', readyCount: 0, totalPlayers: 2, localReady: false });
    }

    static showPlayerLeftPopup(playerName = 'Partner') {
        if (typeof document === 'undefined' || !document.body) return;
        const cleanName = String(playerName || 'Partner').trim() || 'Partner';
        let pop = document.getElementById('coop-left-popup');
        if (!pop) {
            pop = document.createElement('div');
            pop.id = 'coop-left-popup';
            pop.className = 'coop-left-popup hidden';
            document.body.appendChild(pop);
        }
        const rawMsg = `⚠️ ${cleanName} left the game`;
        if (typeof UiIcons !== 'undefined' && typeof UiIcons.setRichText === 'function') {
            UiIcons.setRichText(pop, rawMsg, 'ui-icon-sm');
        } else {
            pop.innerHTML = `⚠️ ${this._escapeHtml(cleanName)} left the game`;
        }
        pop.classList.remove('hidden', 'is-fading');
        void pop.offsetWidth;
        pop.classList.add('is-visible');
        if (window.soundEngine && typeof window.soundEngine.playGoBack === 'function') {
            try { window.soundEngine.playGoBack(); } catch (_) {}
        }
        if (this._leftTimer) clearTimeout(this._leftTimer);
        this._leftTimer = setTimeout(() => {
            pop.classList.remove('is-visible');
            pop.classList.add('is-fading');
            setTimeout(() => pop.classList.add('hidden'), 300);
        }, 3600);
    }

    // ---- Host Pause State Helpers ----
    static hostPausePayload(s) {
        return {
            by: s.pausedByName || 'Hero',
            readyCount: s.pauseReadyPlayers.size,
            totalPlayers: s.getTotalPlayers(),
            readyIds: Array.from(s.pauseReadyPlayers),
            resuming: s._pauseResuming
        };
    }

    static hostSendPause(s, playerName) {
        if (s._resumeTimer) { clearTimeout(s._resumeTimer); s._resumeTimer = null; }
        s._pauseResuming = false;
        s.pauseReadyPlayers.clear();
        s.pausedByName = playerName || (s.game.player && s.game.player.name) || 'Host';
        s.net.send('NET_PAUSE', this.hostPausePayload(s));
    }

    static hostOnNetworkPause(s, payload) {
        if (s.game.state === 'PLAYING') {
            if (s._resumeTimer) { clearTimeout(s._resumeTimer); s._resumeTimer = null; }
            s._pauseResuming = false;
            s.pauseReadyPlayers.clear();
            s.pausedByName = (payload && payload.by) || (s.remotePlayer && s.remotePlayer.name) || 'Partner';
            s.game.pauseGame(s.pausedByName, true);
        }
        s.net.send('NET_PAUSE_STATE', this.hostPausePayload(s));
    }

    static hostEvaluatePause(s) {
        const total = s.getTotalPlayers();
        if (s.pauseReadyPlayers.size >= total) {
            s._pauseResuming = true;
            this.updatePauseModalUI(s.getPauseUIState());
            s.net.send('NET_RESUME', { readyCount: total, totalPlayers: total });
            if (s._resumeTimer) clearTimeout(s._resumeTimer);
            s._resumeTimer = setTimeout(() => {
                s._resumeTimer = null;
                s._pauseResuming = false;
                s.pauseReadyPlayers.clear();
                if (s.game.state === 'PAUSED') s.game.resumeGame(true);
            }, 200);
        } else {
            this.updatePauseModalUI(s.getPauseUIState());
            s.net.send('NET_PAUSE_STATE', this.hostPausePayload(s));
        }
    }

    static hostHandleGuestLeft(s, peerId = null, explicitName = null) {
        if (s._peerLeftNotified) return;
        const rp = (peerId && s.remotePlayersMap && s.remotePlayersMap.get(peerId)) || s.remotePlayer;
        if (!rp || rp.isDownedDisconnected) return;
        const leftName = explicitName || rp.name || 'Squadmate';
        rp.hp = 0;
        rp.isDowned = true;
        rp.isDownedDisconnected = true;
        if (peerId) s.pauseReadyPlayers.delete(peerId);
        if (peerId && s.cutsceneReadyPlayers) s.cutsceneReadyPlayers.delete(peerId);

        const activeRemotes = (typeof CoopPeerRoster !== 'undefined') ? CoopPeerRoster.getActiveRemoteCount(s) : 0;
        if (activeRemotes <= 0) {
            s._peerLeftNotified = true;
            if (s._resumeTimer) { clearTimeout(s._resumeTimer); s._resumeTimer = null; }
            s._pauseResuming = false;
            s.pauseReadyPlayers.clear();
            if (s.game.cutsceneOverlay) {
                s.game.cutsceneOverlay.totalPlayers = 1;
                s.game.cutsceneOverlay.setReadyState(0, 1, false);
                if (s.cutsceneReadyPlayers && s.cutsceneReadyPlayers.has('host')) s.game.cutsceneOverlay.forceAdvance();
            }
            s.game.coopSession = null;
            if (s.game.state === 'PAUSED') this.updatePauseModalUI(null);
        } else {
            const newTotal = 1 + activeRemotes;
            if (s.game.cutsceneOverlay) {
                s.game.cutsceneOverlay.totalPlayers = newTotal;
                const readyCount = s.cutsceneReadyPlayers ? s.cutsceneReadyPlayers.size : 0;
                if (readyCount >= newTotal && s.game.cutsceneOverlay.promptAdvance) {
                    s.cutsceneReadyPlayers.clear();
                    s.game.cutsceneOverlay.forceAdvance();
                } else {
                    s.game.cutsceneOverlay.setReadyState(readyCount, newTotal, !!(s.cutsceneReadyPlayers && s.cutsceneReadyPlayers.has('host')));
                    s.net.send('CUTSCENE_READY_UPDATE', { readyCount, totalPlayers: newTotal });
                }
            }
            if (s.game.state === 'PAUSED') this.hostEvaluatePause(s);
        }
        this.showPlayerLeftPopup(leftName);
    }

    // ---- Guest Pause & Leave State Helpers ----
    static guestApplyPauseState(s, payload = {}) {
        if (s._resumeTimer) { clearTimeout(s._resumeTimer); s._resumeTimer = null; }
        const readyIds = Array.isArray(payload.readyIds) ? payload.readyIds : [];
        const myId = s.myPeerId || 'guest';
        s.pauseReadyState = {
            by: payload.by || s.pauseReadyState.by || (s.remotePlayer && s.remotePlayer.name) || 'Host',
            readyCount: Number.isFinite(payload.readyCount) ? payload.readyCount : readyIds.length,
            totalPlayers: Number.isFinite(payload.totalPlayers) ? payload.totalPlayers : (typeof s.getTotalPlayers === 'function' ? s.getTotalPlayers() : 2),
            localReady: readyIds.includes(myId),
            resuming: !!payload.resuming
        };
        if (s.game.state === 'PLAYING') s.game.pauseGame(s.pauseReadyState.by, true);
        else this.updatePauseModalUI(s.pauseReadyState);
    }

    static guestToggleReady(s) {
        if (s.game.state !== 'PAUSED' || s.pauseReadyState.resuming) return;
        const nextReady = !s.pauseReadyState.localReady;
        s.pauseReadyState.localReady = nextReady;
        s.pauseReadyState.readyCount = Math.max(0, Math.min(s.pauseReadyState.totalPlayers || 2, (s.pauseReadyState.readyCount || 0) + (nextReady ? 1 : -1)));
        this.updatePauseModalUI(s.pauseReadyState);
        s.net.send('NET_RESUME_READY', { ready: nextReady });
    }

    static guestTriggerResume(s, payload = {}) {
        const total = Number.isFinite(payload.totalPlayers) ? payload.totalPlayers : 2;
        s.pauseReadyState = { ...s.pauseReadyState, readyCount: total, totalPlayers: total, localReady: true, resuming: true };
        this.updatePauseModalUI(s.pauseReadyState);
        if (s._resumeTimer) clearTimeout(s._resumeTimer);
        s._resumeTimer = setTimeout(() => {
            s._resumeTimer = null;
            s.pauseReadyState = { by: '', readyCount: 0, totalPlayers: total, localReady: false, resuming: false };
            if (s.game.state === 'PAUSED' && s.game.coopSession === s) s.game.resumeGame(true);
        }, 180);
    }

    static guestHandleHostLeft(s, explicitName = null) {
        if (s._hostLeftNotified) return;
        s._hostLeftNotified = true;
        if (s._resumeTimer) { clearTimeout(s._resumeTimer); s._resumeTimer = null; }
        const leftName = explicitName || (s.remotePlayer && s.remotePlayer.name) || 'Host';
        s.game.state = 'MENU';
        s.game.isCoopGuest = false;
        s.game.coopSession = null;
        if (typeof LilXasEvent !== 'undefined') LilXasEvent.reset();
        if (s.game.cutsceneOverlay) {
            s.game.cutsceneOverlay.totalPlayers = 1;
            s.game.cutsceneOverlay.setReadyState(0, 1, false);
            s.game.cutsceneOverlay.onRequestAdvance = null;
            if (typeof s.game.cutsceneOverlay.endCutscene === 'function') s.game.cutsceneOverlay.endCutscene();
        }
        if (s.net && typeof s.net.disconnect === 'function') s.net.disconnect();
        if (s.game.ui) {
            s.game.ui.hideModals();
            s.game.ui.showMenuScreen();
        }
        this.updatePauseModalUI(null);
        this.showPlayerLeftPopup(leftName);
        if (window.soundEngine) {
            window.soundEngine.stopBGM();
            window.soundEngine.startMenuBGM();
        }
    }
}

if (typeof window !== 'undefined') {
    window.CoopPauseSync = CoopPauseSync;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CoopPauseSync };
}
