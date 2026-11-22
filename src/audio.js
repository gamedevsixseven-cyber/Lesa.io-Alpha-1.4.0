/**
 * Lesa.io - Cartoon Audio Engine & Sound Clips Manager
 * Data-Driven Sound Registry: Preloading, volumes, cloning, Web Audio boosts, and procedural SFX/BGM
 */

const SOUND_REGISTRY = {
    select: { src: 'Audio/SelectMenuSound.mp3', vol: 1.0, fallback: 'star' },
    goBack: { src: 'Audio/GoBackMenuSound.mp3', vol: 1.0, fallback: 'xp' },
    hitmarker: { src: 'Audio/Hitmarker.mp3', vol: 0.42 },
    crit: { src: 'Audio/CritSoundEffect.mp3?v=3', vol: 1.0 },
    kill: { src: 'Audio/KillSoundEffect.mp3?v=2', vol: 1.15 },
    bubbleCharged: { src: 'Audio/BubbleGunCharginSHOT.mp3', vol: 1.0, fallback: 'bubble' },
    moneyGun: { src: 'Audio/MoneyGunShootingLesaIO.mp3', vol: 1.0, fallback: 'money_gun' },
    waterSplash: { src: 'Audio/WaterBalloonSplashSound.mp3', vol: 1.0, fallback: 'bubble' },
    tnt: { src: 'Audio/TntSoundEffectExplosion.mp3?v=1', vol: 1.0, fallback: 'slam' }
};

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.muted = localStorage.getItem('lesaio_muted') === 'true';
        this.bgmMuted = localStorage.getItem('lesaio_bgm_muted') === 'true';
        
        // Volume states (0.0 to 1.0)
        const savedMaster = localStorage.getItem('lesaio_master_volume');
        const savedBgm = localStorage.getItem('lesaio_bgm_volume');
        
        this.masterVolume = savedMaster !== null ? parseFloat(savedMaster) : 0.5;
        this.bgmVolume = savedBgm !== null ? parseFloat(savedBgm) : 0.25;
        this.bgmPlaying = false;
        this.bgmTimer = null;
        this.step = 0;

        // Menu Soundtrack
        this.menuMusic = new Audio('Audio/MenuSoundtrack1Default.mp3');
        this.menuMusic.loop = true;
        this.menuMusic.autoplay = false;
        this.menuMusic.preload = 'auto';
        this.menuMusic.volume = this.bgmMuted ? 0 : this.bgmVolume;

        // Credits Soundtrack
        this.creditsMusic = new Audio('Audio/Lesa.io (Credits).mp3');
        this.creditsMusic.loop = false;
        this.creditsMusic.autoplay = false;
        this.creditsMusic.preload = 'auto';
        this.creditsMusic.volume = this.bgmMuted ? 0 : this.bgmVolume;

        // Data-Driven Sound Registry Initialization
        this.sounds = {};
        for (const [key, def] of Object.entries(SOUND_REGISTRY)) {
            const snd = new Audio(def.src);
            snd.preload = 'auto';
            snd.volume = this.muted ? 0 : this.masterVolume * (def.vol || 1.0);
            this.sounds[key] = { audio: snd, def };
        }

        // Dash Audio Variants
        this.dashSounds = [
            new Audio('Audio/DashSound1.mp3?v=2'),
            new Audio('Audio/DashSound2.mp3?v=2')
        ];
        this.dashSounds.forEach(s => {
            s.preload = 'auto';
            s.volume = this.muted ? 0 : this.masterVolume;
        });

        // 100% Backwards-Compatible Property References
        this.selectSound = this.sounds.select.audio;
        this.goBackSound = this.sounds.goBack.audio;
        this.hitmarkerSound = this.sounds.hitmarker.audio;
        this.critSound = this.sounds.crit.audio;
        this.killSound = this.sounds.kill.audio;
        this.bubbleChargedSound = this.sounds.bubbleCharged.audio;
        this.moneyGunSound = this.sounds.moneyGun.audio;
        this.waterSplashSound = this.sounds.waterSplash.audio;
        this.tntExplosionSound = this.sounds.tnt.audio;

        this.critAudioBuffer = null;
        this.critBufferLoading = false;

        // Burst cooldowns prevent cloning dozens of <audio> elements / oscillators in a single AoE frame
        this._lastKillMs = 0;
        this._lastSynthHitMs = 0;
        this._lastPickupMs = 0;
        this._lastShootMs = 0;
        this._lastKeyMs = {};
        this._creditsActive = false;
        this._creditsFadeToken = 0;
        this._creditsGain = 1.0;
        this.bgmCtrl = (typeof BgmController !== 'undefined') ? new BgmController(this) : null;

        // Unlock Web Audio Context on user interaction (browser policy)
        const events = ['click', 'pointerdown', 'mousedown', 'keydown', 'touchstart'];
        const unlockAudio = () => {
            this.init();
            const menuEl = document.getElementById('menu-screen');
            const isMenuVisible = menuEl && !menuEl.classList.contains('hidden');
            if (window.loadingScreen && window.loadingScreen.isDone && isMenuVisible) {
                if (this.menuMusic.paused && (!window.gameInstance || window.gameInstance.state === 'MENU')) {
                    this.startMenuBGM();
                }
            }
            if (this.ctx && this.ctx.state === 'running') {
                events.forEach(evt => window.removeEventListener(evt, unlockAudio));
            }
        };
        events.forEach(evt => window.addEventListener(evt, unlockAudio, { passive: true }));
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) this.ctx = new AudioContext();
        }
        if (this.ctx && this.ctx.state !== 'running') {
            this.ctx.resume().catch(() => {});
        }
        if (this.ctx && !this.critAudioBuffer && !this.critBufferLoading) {
            this.loadCritBuffer();
        }
    }

    registerBgmElement(audioEl, scale = 1.0) {
        if (this.bgmCtrl) this.bgmCtrl.register(audioEl, scale);
    }

    unregisterBgmElement(audioEl) {
        if (this.bgmCtrl) this.bgmCtrl.unregister(audioEl);
    }

    _syncAllBgmOutputs() {
        if (this.bgmCtrl) { this.bgmCtrl.syncAll(); return; }
        const v = (this.muted || this.bgmMuted) ? 0 : this.bgmVolume;
        if (this.menuMusic) { this.menuMusic.muted = v <= 0.001; this.menuMusic.volume = v; }
        if (this.creditsMusic) { this.creditsMusic.muted = v <= 0.001; this.creditsMusic.volume = v * this._creditsGain; }
    }

    loadCritBuffer() {
        if (!this.ctx || this.critBufferLoading || (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:')) return;
        this.critBufferLoading = true;
        fetch('Audio/CritSoundEffect.mp3?v=3')
            .then(res => res.arrayBuffer())
            .then(buf => this.ctx.decodeAudioData(buf))
            .then(decoded => { this.critAudioBuffer = decoded; })
            .catch(() => { this.critBufferLoading = false; });
    }

    // --- VOLUME & MUTE CONTROLS ---

    setMasterVolume(val) {
        this.masterVolume = Math.max(0, Math.min(1, val));
        localStorage.setItem('lesaio_master_volume', this.masterVolume.toString());
        localStorage.setItem('lesaio_sfx_volume', this.masterVolume.toString());
        if (window.GameState && window.GameState.settings) {
            window.GameState.settings.sfxVolume = this.masterVolume;
        }
        this.updateSfxVolumes();
    }

    updateSfxVolumes() {
        const v = this.muted ? 0 : this.masterVolume;
        for (const item of Object.values(this.sounds)) {
            if (item && item.audio) {
                item.audio.volume = Math.max(0, Math.min(1, v * (item.def.vol || 1.0)));
            }
        }
        if (this.dashSounds) {
            this.dashSounds.forEach(s => { s.volume = v; });
        }
    }

    setBgmVolume(val) {
        this.bgmVolume = Math.max(0, Math.min(1, val));
        localStorage.setItem('lesaio_bgm_volume', this.bgmVolume.toString());
        localStorage.setItem('lesaio_music_volume', this.bgmVolume.toString());
        if (window.GameState && window.GameState.settings) window.GameState.settings.musicVolume = this.bgmVolume;
        this.init();
        this._syncAllBgmOutputs();
        const menuInactive = this.bgmCtrl ? !this.bgmCtrl.isSlotActive('menu') : (this.menuMusic && this.menuMusic.paused);
        if (!this.muted && !this.bgmMuted && this.bgmVolume > 0 && menuInactive) {
            const menuEl = document.getElementById('menu-screen');
            if (menuEl && !menuEl.classList.contains('hidden') && (!window.gameInstance || window.gameInstance.state === 'MENU')) this.startMenuBGM();
        }
    }

    setMuted(muted) {
        this.muted = !!muted;
        localStorage.setItem('lesaio_muted', String(this.muted));
        this.updateSfxVolumes();
        this._syncAllBgmOutputs();
        if (this.muted) { this.stopBGM(); this.stopMenuBGM(); this.stopCreditsBGM(); }
        else if (!this.bgmMuted) {
            if (window.gameInstance && window.gameInstance.state === 'PLAYING') this.startBGM();
            else this.startMenuBGM();
        }
    }

    setBgmMuted(bgmMuted) {
        this.bgmMuted = !!bgmMuted;
        localStorage.setItem('lesaio_bgm_muted', String(this.bgmMuted));
        this._syncAllBgmOutputs();
        if (this.bgmMuted) { this.stopBGM(); this.stopMenuBGM(); this.stopCreditsBGM(); }
        else if (!this.muted) {
            if (window.gameInstance && window.gameInstance.state === 'PLAYING') this.startBGM();
            else this.startMenuBGM();
        }
    }

    // --- MENU AUDIO METHODS ---

    startMenuBGM() {
        if (this.muted || this.bgmMuted || this.bgmVolume <= 0) return;
        const menuScreen = document.getElementById('menu-screen');
        if (!menuScreen || menuScreen.classList.contains('hidden') || menuScreen.style.display === 'none') return;
        if (typeof document !== 'undefined' && (document.hidden || document.visibilityState === 'hidden')) return;
        this.init();
        if (this.bgmCtrl && this.bgmCtrl.playTrack('menu', 'Audio/MenuSoundtrack1Default.mp3', { loop: true, scale: 1.0, fallbackAudio: this.menuMusic })) {
            this._syncAllBgmOutputs();
            return;
        }
        this._syncAllBgmOutputs();
        try {
            this.menuMusic.currentTime = this.menuMusic.currentTime || 0;
            const p = this.menuMusic.play();
            if (p && p.catch) p.catch(() => {});
        } catch (_) {}
    }

    stopMenuBGM() {
        if (this.bgmCtrl) this.bgmCtrl.stopTrack('menu', false);
        try { this.menuMusic.pause(); } catch (_) {}
    }

    startCreditsBGM(fadeInDuration = 2.5) {
        if (this.muted || this.bgmMuted || this.bgmVolume <= 0) return;
        this.init();
        const fadeToken = ++this._creditsFadeToken;
        this._creditsActive = true;
        try {
            this.stopBGM();
            this.stopMenuBGM();
            this._creditsGain = fadeInDuration > 0 ? 0 : 1.0;
            const syncCred = () => this.bgmCtrl ? this.bgmCtrl.syncAll() : this._syncAllBgmOutputs();
            const beginFade = () => {
                if (!this._creditsActive || this._creditsFadeToken !== fadeToken) return;
                if (fadeInDuration <= 0) { this._creditsGain = 1.0; syncCred(); return; }
                let fadeStart = null;
                const fade = (now) => {
                    if (!this._creditsActive || this._creditsFadeToken !== fadeToken) return;
                    const mobSlot = this.bgmCtrl && this.bgmCtrl._slots && this.bgmCtrl._slots.credits;
                    const playingBuf = mobSlot && mobSlot.wantPlaying;
                    if (!playingBuf && this.creditsMusic && this.creditsMusic.paused) { requestAnimationFrame(fade); return; }
                    if (fadeStart === null) fadeStart = now;
                    this._creditsGain = Math.max(0, Math.min((now - fadeStart) / (fadeInDuration * 1000), 1.0));
                    syncCred();
                    if (this._creditsGain < 1.0) requestAnimationFrame(fade);
                };
                requestAnimationFrame(fade);
            };
            if (this.bgmCtrl && this.bgmCtrl.playTrack('credits', encodeURI('Audio/Lesa.io (Credits).mp3'), { loop: false, scale: this._creditsGain, reset: true, fallbackAudio: this.creditsMusic })) {
                syncCred();
                beginFade();
                return;
            }
            const track = this.creditsMusic;
            if (!track) return;
            track.currentTime = 0;
            syncCred();
            const p = track.play();
            if (p !== undefined) {
                p.then(beginFade).catch(() => {
                    if (!this._creditsActive || this._creditsFadeToken !== fadeToken) return;
                    const retry = () => {
                        window.removeEventListener('pointerdown', retry);
                        window.removeEventListener('keydown', retry);
                        if (!this._creditsActive || this._creditsFadeToken !== fadeToken) return;
                        const rp = track.play();
                        if (rp && rp.then) rp.then(beginFade).catch(() => {});
                    };
                    window.addEventListener('pointerdown', retry, { once: true, passive: true });
                    window.addEventListener('keydown', retry, { once: true, passive: true });
                });
            } else { beginFade(); }
        } catch (_) {}
    }

    stopCreditsBGM() {
        this._creditsActive = false;
        this._creditsFadeToken++;
        this._creditsGain = 1.0;
        if (this.bgmCtrl) this.bgmCtrl.stopTrack('credits', true);
        try { if (this.creditsMusic) { this.creditsMusic.pause(); this.creditsMusic.currentTime = 0; } } catch (_) {}
    }

    playStartGame() {
        this.playSelect();
        this.stopMenuBGM();
        this.startBGM();
    }

    // --- UNIFIED CLONED AUDIO PLAYBACK ---

    playClonedAudio(audioEl, volumeMult = 1, onError = null) {
        if (!audioEl) return false;
        if (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile) {
            return MobilePerf.playMobileAudio(this, audioEl, volumeMult, onError);
        }
        try {
            const snd = audioEl.cloneNode ? audioEl.cloneNode() : audioEl;
            snd.volume = Math.max(0, Math.min(1, this.masterVolume * volumeMult));
            const p = snd.play();
            if (p !== undefined) {
                p.catch(() => { if (onError) onError(); });
            }
            return true;
        } catch (e) {
            if (onError) onError();
            return false;
        }
    }

    playSfx(key, volumeMult = 1.0, minIntervalMs = 0) {
        if (this.muted || this.masterVolume <= 0) return false;
        this.init();
        const effInterval = (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile && key !== 'select' && key !== 'goBack')
            ? Math.max(minIntervalMs, 55)
            : minIntervalMs;
        if (effInterval > 0) {
            const now = performance.now();
            if (now - (this._lastKeyMs[key] || 0) < effInterval) return false;
            this._lastKeyMs[key] = now;
        }
        const item = this.sounds[key];
        if (!item) return false;

        const fallbackFn = () => {
            if (typeof ProceduralSynth === 'undefined') return;
            if (item.def.fallback === 'star') ProceduralSynth.playPickup(this.ctx, this.masterVolume, 'star');
            else if (item.def.fallback === 'xp') ProceduralSynth.playPickup(this.ctx, this.masterVolume, 'xp');
            else if (item.def.fallback === 'slam') ProceduralSynth.playFatmirSlam(this.ctx, this.masterVolume);
            else if (item.def.fallback === 'bubble') ProceduralSynth.playShoot(this.ctx, this.masterVolume, 'bubble');
            else if (item.def.fallback === 'money_gun') ProceduralSynth.playShoot(this.ctx, this.masterVolume, 'money_gun');
        };

        const played = this.playClonedAudio(item.audio, (item.def.vol || 1.0) * volumeMult, fallbackFn);
        if (!played) fallbackFn();
        return true;
    }

    // --- BACKWARD-COMPATIBLE SOUND METHODS ---

    playSelect() { return this.playSfx('select'); }
    playGoBack() { return this.playSfx('goBack'); }
    playKill() { return this.playSfx('kill', 1.0, 55); }
    playTntExplosion() { return this.playSfx('tnt', 1.0, 40); }
    playWaterSplash() { return this.playSfx('waterSplash', 1.0, 45); }
    playWaterBalloonSplash() { return this.playWaterSplash(); }
    playChargedBubble() { return this.playSfx('bubbleCharged', 1.0, 45); }
    playMoneyShoot() { return this.playSfx('moneyGun', 1.0, 35); }

    playHitmarker(isCrit = false) {
        if (this.muted || this.masterVolume <= 0) return;
        if (isCrit) return this.playCrit();
        this.init();
        const now = performance.now();
        if (this.lastHitmarkerTime && now - this.lastHitmarkerTime < 35) return;
        this.lastHitmarkerTime = now;
        this.playSfx('hitmarker');
    }

    playCrit() {
        if (this.muted || this.masterVolume <= 0) return false;
        this.init();
        const now = performance.now();
        if (this.lastCritTime && now - this.lastCritTime < 35) return true;
        this.lastCritTime = now;

        // Boosted Web Audio buffer playback: 3.8x gain amplifies low-recording MP3 to punchy loudness
        if (this.ctx && this.critAudioBuffer) {
            try {
                const src = this.ctx.createBufferSource();
                src.buffer = this.critAudioBuffer;
                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(this.masterVolume * 3.8, this.ctx.currentTime);
                src.connect(gain);
                gain.connect(this.ctx.destination);
                src.start();
                return true;
            } catch (e) {}
        }
        return this.playClonedAudio(this.critSound, 1.0, () => this.playHitmarker(false));
    }

    playPlayerDash() {
        if (this.muted || this.masterVolume <= 0) return;
        this.init();
        if (this.dashSounds && this.dashSounds.length > 0) {
            const idx = Math.floor(Math.random() * this.dashSounds.length);
            const played = this.playClonedAudio(this.dashSounds[idx], 1.0, () => this.playProceduralDash());
            if (played) return;
        }
        this.playProceduralDash();
    }

    playDash() {
        this.playPlayerDash();
    }

    // --- PROCEDURAL SYNTH WRAPPERS ---

    playShoot(type = 'normal') {
        if (this.muted || this.masterVolume <= 0) return;
        this.init();
        if (type === 'money_gun' || type === 'money') {
            this.playMoneyShoot();
            return;
        }
        if (type === 'charged_bubble' || type === 'bubble_charged') {
            this.playChargedBubble();
            return;
        }
        if (typeof ProceduralSynth !== 'undefined') {
            ProceduralSynth.playShoot(this.ctx, this.masterVolume, type);
        }
    }

    playBladeSwish() {
        if (this.muted || this.masterVolume <= 0) return;
        this.init();
        if (typeof ProceduralSynth !== 'undefined') {
            ProceduralSynth.playBladeSwish(this.ctx, this.masterVolume);
        }
    }

    playHeroUlt(ultId) {
        if (this.muted || this.masterVolume <= 0) return;
        this.init();
        if (typeof ProceduralSynth !== 'undefined' && typeof ProceduralSynth.playHeroUlt === 'function') {
            ProceduralSynth.playHeroUlt(this.ctx, this.masterVolume, ultId);
        }
    }

    playTick() {
        if (this.muted || this.masterVolume <= 0) return;
        this.init();
        if (typeof ProceduralSynth !== 'undefined') {
            ProceduralSynth.playTick(this.ctx, this.masterVolume);
        }
    }

    playHit(isEnemy = true, isCrit = false) {
        if (this.muted || this.masterVolume <= 0) return;
        this.init();
        if (isEnemy) {
            if (isCrit) {
                const played = this.playCrit();
                if (played) return;
            } else {
                this.playHitmarker(false);
            }
        }
        const now = performance.now();
        if (now - this._lastSynthHitMs < 32) return;
        this._lastSynthHitMs = now;
        if (typeof ProceduralSynth !== 'undefined') {
            ProceduralSynth.playHit(this.ctx, this.masterVolume, isEnemy, isCrit);
        }
    }

    playFatmirSlam() {
        if (this.muted || this.masterVolume <= 0) return;
        this.init();
        if (typeof ProceduralSynth !== 'undefined') {
            ProceduralSynth.playFatmirSlam(this.ctx, this.masterVolume);
        }
    }

    playCasillasDash() {
        if (this.muted || this.masterVolume <= 0) return;
        this.init();
        if (typeof ProceduralSynth !== 'undefined') {
            ProceduralSynth.playCasillasDash(this.ctx, this.masterVolume);
        }
    }

    playProceduralDash() {
        if (this.muted || this.masterVolume <= 0) return;
        this.init();
        if (typeof ProceduralSynth !== 'undefined') {
            ProceduralSynth.playProceduralDash(this.ctx, this.masterVolume);
        }
    }

    playMushroomBounce() {
        if (this.muted || this.masterVolume <= 0) return;
        this.init();
        if (typeof ProceduralSynth !== 'undefined') {
            ProceduralSynth.playMushroomBounce(this.ctx, this.masterVolume);
        }
    }

    playCrateBreak() {
        if (this.muted || this.masterVolume <= 0) return;
        this.init();
        if (typeof ProceduralSynth !== 'undefined') {
            ProceduralSynth.playCrateBreak(this.ctx, this.masterVolume);
        }
    }

    playPickup(type = 'xp') {
        if (this.muted || this.masterVolume <= 0) return;
        this.init();
        const now = performance.now();
        if (now - this._lastPickupMs < 28) return;
        this._lastPickupMs = now;
        if (typeof ProceduralSynth !== 'undefined') {
            ProceduralSynth.playPickup(this.ctx, this.masterVolume, type);
        }
    }

    playLevelUp() {
        if (this.muted || this.masterVolume <= 0) return;
        this.init();
        if (typeof ProceduralSynth !== 'undefined') {
            ProceduralSynth.playLevelUp(this.ctx, this.masterVolume);
        }
    }

    playGameOver() {
        if (this.muted || this.masterVolume <= 0) return;
        this.init();
        if (typeof ProceduralSynth !== 'undefined') {
            ProceduralSynth.playGameOver(this.ctx, this.masterVolume);
        }
    }

    playNoiseCrack(time, duration, vol) {
        if (typeof ProceduralSynth !== 'undefined') {
            ProceduralSynth.playNoiseCrack(this.ctx, this.masterVolume, time, duration, vol);
        }
    }

    // --- IN-GAME BACKGROUND AUDIO ---

    startBGM() {
        this.stopMenuBGM();
        this.stopBGM();
    }

    stopBGM() {
        this.bgmPlaying = false;
        if (this.bgmTimer) { clearTimeout(this.bgmTimer); this.bgmTimer = null; }
    }
}

// Global Sound Instance
window.soundEngine = new SoundEngine();
