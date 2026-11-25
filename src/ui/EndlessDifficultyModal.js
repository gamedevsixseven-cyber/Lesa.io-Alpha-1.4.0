/**
 * Lesa.io - Endless Difficulty Selection Screen
 * Opens when clicking Endless Mode so players cleanly choose Normal Endless or Endless Hard.
 */

class EndlessDifficultyModal {
    static _modalEl = null;
    static _noticeTimer = null;

    static ensureMarkup() {
        if (this._modalEl && document.body.contains(this._modalEl)) return this._modalEl;
        const el = document.createElement('div');
        el.id = 'endless-diff-modal';
        el.className = 'modal-overlay hidden';
        el.innerHTML = `
            <div class="ediff-panel" role="dialog" aria-modal="true" aria-labelledby="ediff-title">
                <div class="ediff-header">
                    <button id="ediff-back-btn" class="ediff-back-btn" type="button" title="Back to Game Modes">← BACK</button>
                    <h2 id="ediff-title" class="ediff-title">⚡ SELECT ENDLESS DIFFICULTY</h2>
                    <button id="ediff-close-btn" class="modal-close-x-btn ediff-close-x" type="button" title="Close (Esc)" aria-label="Close">✕</button>
                </div>
                <p class="ediff-subtitle">Choose your infinite survival intensity. Higher risk brings greater glory!</p>
                <div id="ediff-notice" class="ediff-notice hidden" role="alert"></div>
                <div class="ediff-grid">
                    <div id="ediff-card-normal" class="ediff-card is-normal" role="button" tabindex="0">
                        <div class="ediff-card-ribbon">CLASSIC INFINITE</div>
                        <div class="ediff-card-icon">⚡</div>
                        <h3 class="ediff-card-title">NORMAL ENDLESS</h3>
                        <p class="ediff-card-desc">Endless Arena Waves &amp; Evolving Biomes</p>
                        <ul class="ediff-perks">
                            <li>🌿 Progressive Map &amp; Weather Phases</li>
                            <li>⚔️ Balanced Scaling Enemy Hordes</li>
                            <li>🏆 Reach Wave 30 to Unlock Hard Mode</li>
                        </ul>
                        <div id="ediff-norm-best" class="ediff-record-chip">BEST WAVE: 0</div>
                        <button id="ediff-play-normal" class="ediff-play-btn is-normal" type="button">PLAY NORMAL</button>
                    </div>
                    <div id="ediff-card-hard" class="ediff-card is-hard" role="button" tabindex="0">
                        <div class="ediff-card-ribbon is-hard">🔥 2× REWARDS</div>
                        <div class="ediff-card-icon is-hard">💀</div>
                        <h3 class="ediff-card-title is-hard">ENDLESS HARD</h3>
                        <p class="ediff-card-desc">Hellish Hazards &amp; Apex Sovereign Bosses</p>
                        <ul class="ediff-perks">
                            <li>🌋 Acid Pools, Magma Fissures &amp; Strikes</li>
                            <li>👑 Brutal Wave 30 &amp; 60 Apex Bosses</li>
                            <li>📦 2× Gold &amp; Mythic / Apex Chests</li>
                        </ul>
                        <div id="ediff-hard-meta" class="ediff-record-chip is-hard">BEST HARD WAVE: 0</div>
                        <div id="ediff-hard-progress" class="ediff-lock-progress hidden">
                            <div class="ediff-lock-bar-bg"><div id="ediff-hard-bar" class="ediff-lock-bar-fill"></div></div>
                            <span id="ediff-hard-lock-label">0 / 30 Waves</span>
                        </div>
                        <button id="ediff-play-hard" class="ediff-play-btn is-hard" type="button">ENTER HARD MODE</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(el);
        this._bindEvents(el);
        this._modalEl = el;
        return el;
    }

    static _getMenuCtrl(explicit = null) {
        if (explicit) return explicit;
        if (typeof window === 'undefined') return null;
        return window.menuController || (window.gameInstance && window.gameInstance.ui && window.gameInstance.ui.menuController) || null;
    }

    static _bindEvents(el) {
        const closeToModes = (backToModes = true) => {
            if (window.soundEngine) window.soundEngine.playSelect();
            this.hide();
            const mc = this._getMenuCtrl();
            if (backToModes && mc && typeof mc.showGameModeModal === 'function') {
                mc.showGameModeModal();
            }
        };
        el.addEventListener('click', (e) => { if (e.target === el) this.hide(); });
        el.querySelector('#ediff-back-btn')?.addEventListener('click', () => closeToModes(true));
        el.querySelector('#ediff-close-btn')?.addEventListener('click', () => closeToModes(false));

        const launchNormal = () => {
            if (window.soundEngine) (window.soundEngine.playStartGame || window.soundEngine.playSelect).call(window.soundEngine);
            this.hide();
            const mc = this._getMenuCtrl();
            if (mc) {
                mc.endlessHardSelected = false;
                mc.startGame('endless', { isEndlessHard: false });
            }
        };
        const launchHard = () => {
            const mc = this._getMenuCtrl();
            const unlocked = mc && typeof mc.isEndlessHardUnlocked === 'function' ? mc.isEndlessHardUnlocked() : false;
            if (!unlocked) {
                if (window.soundEngine) (window.soundEngine.playGoBack || window.soundEngine.playSelect).call(window.soundEngine);
                this._showLockedFeedback();
                return;
            }
            if (window.soundEngine) (window.soundEngine.playStartGame || window.soundEngine.playSelect).call(window.soundEngine);
            this.hide();
            mc.endlessHardSelected = true;
            mc.startGame('endless', { isEndlessHard: true });
        };

        el.querySelector('#ediff-card-normal')?.addEventListener('click', launchNormal);
        el.querySelector('#ediff-card-hard')?.addEventListener('click', launchHard);
    }

    static _showLockedFeedback() {
        const notice = document.getElementById('ediff-notice');
        if (notice) {
            notice.textContent = '🔒 Reach Wave 30 in Normal Endless to unlock Endless Hard!';
            notice.classList.remove('hidden');
            if (this._noticeTimer) clearTimeout(this._noticeTimer);
            this._noticeTimer = setTimeout(() => { notice.classList.add('hidden'); this._noticeTimer = null; }, 3500);
        }
        const hardCard = document.getElementById('ediff-card-hard');
        if (hardCard) {
            hardCard.classList.remove('crest-shake');
            void hardCard.offsetWidth;
            hardCard.classList.add('crest-shake');
            setTimeout(() => hardCard.classList.remove('crest-shake'), 450);
        }
    }

    static refreshState(menuCtrl = null) {
        const mc = menuCtrl || (typeof window !== 'undefined' ? window.menuController : null);
        const unlocked = mc && typeof mc.isEndlessHardUnlocked === 'function' ? mc.isEndlessHardUnlocked() : false;
        const gs = (typeof window !== 'undefined') ? window.GameState : null;
        const cf = (gs && gs.player && gs.player.combatFeats) || {};
        const storedFeats = (typeof PerkProgression !== 'undefined' && typeof PerkProgression.loadFeats === 'function') ? PerkProgression.loadFeats() : {};
        const bestNormal = Math.max(cf.endlessMaxWave || 0, storedFeats.endlessMaxWave || 0);
        const bestHard = Math.max(cf.endlessHardMaxWave || 0, storedFeats.endlessHardMaxWave || 0);

        const normBest = document.getElementById('ediff-norm-best');
        if (normBest) normBest.textContent = `BEST NORMAL WAVE: ${bestNormal}`;

        const hardCard = document.getElementById('ediff-card-hard');
        const hardMeta = document.getElementById('ediff-hard-meta');
        const hardProg = document.getElementById('ediff-hard-progress');
        const hardBar = document.getElementById('ediff-hard-bar');
        const hardLabel = document.getElementById('ediff-hard-lock-label');
        const hardBtn = document.getElementById('ediff-play-hard');

        if (hardCard) hardCard.classList.toggle('is-locked', !unlocked);
        if (hardMeta) {
            hardMeta.classList.toggle('hidden', !unlocked);
            hardMeta.textContent = `BEST HARD WAVE: ${bestHard}`;
        }
        if (hardProg) hardProg.classList.toggle('hidden', unlocked);
        if (!unlocked) {
            const prog = Math.min(30, bestNormal);
            if (hardBar) hardBar.style.width = `${Math.round((prog / 30) * 100)}%`;
            if (hardLabel) hardLabel.textContent = `🔒 UNLOCKS AT WAVE 30 (${prog} / 30)`;
        }
        if (hardBtn) {
            hardBtn.classList.toggle('is-locked', !unlocked);
            hardBtn.textContent = unlocked ? '🔥 ENTER HARD MODE' : '🔒 LOCKED (WAVE 30)';
        }
    }

    static open(menuCtrl = null) {
        const modal = this.ensureMarkup();
        const notice = document.getElementById('ediff-notice');
        if (notice) notice.classList.add('hidden');
        this.refreshState(menuCtrl);
        if (menuCtrl && typeof menuCtrl.hideGameModeModal === 'function') {
            menuCtrl.hideGameModeModal();
        }
        modal.classList.remove('hidden');
    }

    static hide() {
        if (this._noticeTimer) { clearTimeout(this._noticeTimer); this._noticeTimer = null; }
        if (this._modalEl) this._modalEl.classList.add('hidden');
    }
}

if (typeof window !== 'undefined') window.EndlessDifficultyModal = EndlessDifficultyModal;
if (typeof module !== 'undefined' && module.exports) module.exports = { EndlessDifficultyModal };
