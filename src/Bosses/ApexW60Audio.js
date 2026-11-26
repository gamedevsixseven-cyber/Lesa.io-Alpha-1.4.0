/**
 * Lesa.io - Wave 60 Final Apex Boss ("Omega, Sovereign of the End") Audio Controller
 * Manages:
 *   1. Bossfight soundtrack playback (`Audio/BossVoices/OmegaBossfight.mp3`) with pause/resume,
 *      BgmController mobile WebAudio support, settings volume sync, and clean session teardown.
 *   2. Pre-rendered voice lines for Omega with automatic soundtrack ducking & Co-op deduplication.
 */

class ApexW60Audio {
    static TRACK_URL = 'Audio/BossVoices/OmegaBossfight.mp3';
    static TRACK_SLOT = 'apexW60';

    static VOICES = {
        erebus_line1: 'assets/HeroesIcons/dialogue_1_W60BOSS.mp3',
        erebus_surge: 'assets/HeroesIcons/dialogue2_W60BOSS.mp3',
        erebus_line2: 'assets/HeroesIcons/dialogue_3_W60BOSS.mp3',
        erebus_aegis: 'assets/HeroesIcons/dialogue_4_W60BOSS.mp3',
        erebus_defeat: 'assets/HeroesIcons/dialogue_5_W60BOSS.mp3'
    };

    static _raw = new Map();
    static _loading = new Set();
    static _buffers = new Map();
    static _prefetched = false;

    static _bgmAudio = null;
    static _playing = false;
    static _paused = false;
    static _lastPlayAttemptMs = 0;

    static _voiceNode = null;
    static _voiceAudio = null;
    static _duckFactor = 1.0;
    static _duckTimer = null;
    static _playedTags = new Set();

    static _se() {
        return (typeof window !== 'undefined' && window.soundEngine) ? window.soundEngine : null;
    }

    static prefetch() {
        if (this._prefetched) return;
        this._prefetched = true;
        if (typeof fetch !== 'function' || (typeof location !== 'undefined' && location.protocol === 'file:')) return;
        const se = this._se();
        if (se && se.bgmCtrl && typeof se.bgmCtrl._prefetchBytes === 'function') {
            se.bgmCtrl._prefetchBytes(this.TRACK_URL);
        }
        for (const src of new Set(Object.values(this.VOICES))) {
            if (this._raw.has(src) || this._loading.has(src)) continue;
            this._loading.add(src);
            fetch(src).then(r => (r.ok ? r.arrayBuffer() : null)).then(ab => {
                if (ab) this._raw.set(src, ab);
            }).catch(() => {}).finally(() => this._loading.delete(src));
        }
    }

    static _decodeVoice(src) {
        if (this._buffers.has(src)) return Promise.resolve(this._buffers.get(src));
        const se = this._se();
        if (!se || !se.ctx) return Promise.resolve(null);
        const cached = this._raw.get(src);
        const pBytes = cached
            ? Promise.resolve(cached.slice(0))
            : ((typeof fetch === 'function' && (!location || location.protocol !== 'file:'))
                ? fetch(src).then(r => (r.ok ? r.arrayBuffer() : null)).then(ab => { if (ab) this._raw.set(src, ab); return ab ? ab.slice(0) : null; }).catch(() => null)
                : Promise.resolve(null));
        return pBytes.then(ab => {
            if (!ab || !se.ctx) return null;
            return new Promise((res) => {
                try {
                    const p = se.ctx.decodeAudioData(ab, (buf) => { this._buffers.set(src, buf); res(buf); }, () => res(null));
                    if (p && typeof p.then === 'function') p.then(buf => { if (buf) this._buffers.set(src, buf); res(buf || null); }).catch(() => res(null));
                } catch (_) { res(null); }
            });
        });
    }

    static playVoice(key, onceTag = null) {
        if (onceTag && this._playedTags.has(onceTag)) return;
        if (onceTag) this._playedTags.add(onceTag);
        const src = this.VOICES[key];
        const se = this._se();
        if (!src || !se || se.muted || se.masterVolume <= 0) return;
        if (!se.ctx && typeof se.init === 'function') se.init();

        this.stopVoice();
        this._setDuck(0.30, 6800);

        const vol = Math.max(0.05, Math.min(1.0, se.masterVolume * 1.15));
        const startFallback = () => {
            try {
                const a = new Audio(src);
                a.volume = vol;
                a.onended = () => { if (this._voiceAudio === a) { this._voiceAudio = null; this._setDuck(1.0); } };
                a.play().catch(() => { this._setDuck(1.0); });
                this._voiceAudio = a;
            } catch (_) { this._setDuck(1.0); }
        };

        if (se.ctx && (!location || location.protocol !== 'file:')) {
            this._decodeVoice(src).then((buf) => {
                if (!buf || se.muted || se.masterVolume <= 0) { if (!buf) startFallback(); return; }
                const node = se.ctx.createBufferSource();
                node.buffer = buf;
                const g = se.ctx.createGain();
                g.gain.value = vol;
                node.connect(g);
                g.connect(se.ctx.destination);
                this._voiceNode = node;
                this._setDuck(0.30, Math.ceil(buf.duration * 1000) + 150);
                node.onended = () => {
                    if (this._voiceNode === node) { this._voiceNode = null; this._setDuck(1.0); }
                };
                node.start(0);
            });
        } else {
            startFallback();
        }
    }

    static stopVoice() {
        if (this._voiceNode) {
            try { this._voiceNode.onended = null; this._voiceNode.stop(); this._voiceNode.disconnect(); } catch (_) {}
            this._voiceNode = null;
        }
        if (this._voiceAudio) {
            try { this._voiceAudio.onended = null; this._voiceAudio.pause(); } catch (_) {}
            this._voiceAudio = null;
        }
        this._setDuck(1.0);
    }

    static _setDuck(factor, restoreAfterMs = 0) {
        if (this._duckTimer) { clearTimeout(this._duckTimer); this._duckTimer = null; }
        this._duckFactor = factor;
        this._applyMusicGain();
        if (factor < 1.0 && restoreAfterMs > 0) {
            this._duckTimer = setTimeout(() => {
                this._duckFactor = 1.0;
                this._applyMusicGain();
            }, restoreAfterMs);
        }
    }

    static _applyMusicGain() {
        const se = this._se();
        if (!se) return;
        const scale = (this._playing && !this._paused) ? this._duckFactor : 0;
        if (se.bgmCtrl) {
            if (se.bgmCtrl.isSlotActive(this.TRACK_SLOT)) {
                se.bgmCtrl.setTrackScale(this.TRACK_SLOT, scale);
            }
            if (this._bgmAudio) {
                this._bgmAudio._bgmScale = scale;
                se.bgmCtrl.syncFallback(this._bgmAudio, scale);
            }
        } else if (this._bgmAudio) {
            const eff = (!se.muted && !se.bgmMuted) ? Math.max(0, Math.min(1, se.bgmVolume * scale)) : 0;
            this._bgmAudio.muted = (eff <= 0.001);
            this._bgmAudio.volume = eff;
        }
    }

    static _ensureAudioEl() {
        if (this._bgmAudio) return this._bgmAudio;
        if (typeof Audio === 'undefined') return null;
        const audio = new Audio(this.TRACK_URL);
        audio.loop = true;
        audio.preload = 'auto';
        const se = this._se();
        if (se && typeof se.registerBgmElement === 'function') {
            se.registerBgmElement(audio, this._duckFactor);
        }
        this._bgmAudio = audio;
        return audio;
    }

    static _startOrResumeMusic() {
        const se = this._se();
        if (!se || se.muted || se.bgmMuted || se.bgmVolume <= 0) return;
        const audio = this._ensureAudioEl();
        if (!audio) return;

        const wasPlaying = this._playing && !this._paused;
        this._playing = true;
        this._paused = false;

        if (se.bgmCtrl && se.bgmCtrl.isMobile && se.bgmCtrl.isMobile()) {
            if (!se.bgmCtrl.isSlotActive(this.TRACK_SLOT)) {
                se.bgmCtrl.playTrack(this.TRACK_SLOT, this.TRACK_URL, {
                    loop: true,
                    scale: this._duckFactor,
                    reset: !wasPlaying && (audio.currentTime || 0) === 0,
                    fallbackAudio: audio
                });
            }
            this._applyMusicGain();
            return;
        }

        if (se.bgmCtrl && !se.bgmCtrl.isSlotActive(this.TRACK_SLOT)) {
            se.bgmCtrl.playTrack(this.TRACK_SLOT, this.TRACK_URL, {
                loop: true,
                scale: this._duckFactor,
                reset: !wasPlaying && (audio.currentTime || 0) === 0,
                fallbackAudio: audio
            });
        }
        this._applyMusicGain();
        if (audio.paused) {
            const now = Date.now();
            if (now - (this._lastPlayAttemptMs || 0) >= 400) {
                this._lastPlayAttemptMs = now;
                try {
                    const p = audio.play();
                    if (p && typeof p.catch === 'function') p.catch(() => {});
                } catch (_) {}
            }
        }
    }

    static _pauseMusic() {
        if (!this._playing && !this._bgmAudio) return;
        this._paused = true;
        const se = this._se();
        if (se && se.bgmCtrl) se.bgmCtrl.stopTrack(this.TRACK_SLOT, false);
        if (this._bgmAudio && !this._bgmAudio.paused) {
            try { this._bgmAudio.pause(); } catch (_) {}
        }
    }

    static sync(game, boss, active) {
        if (!active || !game || (game.state !== 'PLAYING' && game.state !== 'PAUSED')) {
            if (this._playing || this._bgmAudio) this.stop(false);
            return;
        }
        this.prefetch();

        const se = this._se();
        const hidden = (typeof document !== 'undefined') && (document.hidden || document.visibilityState === 'hidden');
        const silenced = !se || se.muted || se.bgmMuted || se.bgmVolume <= 0;

        if (game.state === 'PAUSED' || hidden || silenced) {
            this._pauseMusic();
            this._applyMusicGain();
            return;
        }

        this._startOrResumeMusic();
    }

    static stop(immediate = false) {
        this._playing = false;
        this._paused = false;
        if (immediate) {
            this.stopVoice();
            this._playedTags.clear();
        }
        const se = this._se();
        if (se && se.bgmCtrl) se.bgmCtrl.stopTrack(this.TRACK_SLOT, true);
        if (this._bgmAudio) {
            if (se && typeof se.unregisterBgmElement === 'function') {
                se.unregisterBgmElement(this._bgmAudio);
            }
            try {
                this._bgmAudio.pause();
                this._bgmAudio.currentTime = 0;
            } catch (_) {}
            this._bgmAudio = null;
        }
    }

    static setPaused(paused) {
        if (paused) {
            this._pauseMusic();
            this._applyMusicGain();
            return;
        }
        if (this._playing && this._paused) {
            const g = (typeof window !== 'undefined') ? window.gameInstance : null;
            if (g && g.state === 'PLAYING') this._startOrResumeMusic();
        }
    }

    static resetSession() {
        this.stop(true);
    }
}

if (typeof window !== 'undefined') window.ApexW60Audio = ApexW60Audio;
if (typeof module !== 'undefined' && module.exports) module.exports = { ApexW60Audio };
