/**
 * Lesa.io - Background Music Gain Mixer & Mobile Lifecycle Controller
 * Uses Web Audio API AudioBufferSourceNode + GainNode on mobile (where HTMLAudioElement.volume
 * is hardware-locked/read-only on iOS), and pauses/resumes all music when backgrounded on mobile.
 */

class BgmController {
    constructor(soundEngine) {
        this.engine = soundEngine;
        this._bgmGain = null;
        this._rawBytes = new Map();
        this._rawLoading = new Set();
        this._buffers = new Map();
        this._slots = Object.create(null);
        this._extraAudios = new Set();
        this._bgPausedSlots = null;

        this._bindMobileLifecycle();
        this._configureAudioSession();
        if (this.canUseWebAudio()) {
            this._prefetchBytes('Audio/MenuSoundtrack1Default.mp3');
        }
    }

    isMobile() {
        return typeof MobilePerf !== 'undefined' && MobilePerf.isMobile;
    }

    canUseWebAudio() {
        return typeof fetch === 'function' &&
            typeof window !== 'undefined' &&
            !!(window.AudioContext || window.webkitAudioContext) &&
            (!window.location || window.location.protocol !== 'file:');
    }

    _configureAudioSession() {
        if (typeof navigator !== 'undefined' && navigator.audioSession && navigator.audioSession.type !== 'ambient') {
            try { navigator.audioSession.type = 'ambient'; } catch (_) {}
        }
    }

    _ensureGain() {
        const se = this.engine;
        if (!se || !se.ctx) return null;
        if (!this._bgmGain || this._bgmGain.context !== se.ctx) {
            this._bgmGain = se.ctx.createGain();
            this._bgmGain.gain.value = this.getEffectiveVol();
            this._bgmGain.connect(se.ctx.destination);
        }
        return this._bgmGain;
    }

    getEffectiveVol() {
        const se = this.engine;
        return (!se || se.muted || se.bgmMuted) ? 0 : Math.max(0, Math.min(1, se.bgmVolume));
    }

    _prefetchBytes(src) {
        if (!src || this._rawBytes.has(src) || this._rawLoading.has(src)) return Promise.resolve(this._rawBytes.get(src) || null);
        if (typeof fetch !== 'function' || (typeof location !== 'undefined' && location.protocol === 'file:')) return Promise.resolve(null);
        this._rawLoading.add(src);
        return fetch(src)
            .then(r => (r.ok ? r.arrayBuffer() : null))
            .then(buf => { if (buf) this._rawBytes.set(src, buf); return buf; })
            .catch(() => null)
            .finally(() => this._rawLoading.delete(src));
    }

    _getOrLoadBuffer(src) {
        if (this._buffers.has(src)) return Promise.resolve(this._buffers.get(src));
        const se = this.engine;
        if (!se || !se.ctx) return Promise.resolve(null);
        const existing = this._rawBytes.get(src);
        const pBytes = existing ? Promise.resolve(existing.slice(0)) : this._prefetchBytes(src).then(b => (b ? b.slice(0) : null));
        return pBytes.then((ab) => {
            if (!ab || !se.ctx) return null;
            return new Promise((resolve) => {
                try {
                    const res = se.ctx.decodeAudioData(ab, (decoded) => {
                        this._buffers.set(src, decoded);
                        if (this.isMobile()) this._rawBytes.delete(src);
                        resolve(decoded);
                    }, () => resolve(null));
                    if (res && typeof res.then === 'function') res.then((d) => {
                        if (d) {
                            this._buffers.set(src, d);
                            if (this.isMobile()) this._rawBytes.delete(src);
                        }
                        resolve(d || null);
                    }).catch(() => resolve(null));
                } catch (_) { resolve(null); }
            });
        });
    }

    _getSlot(key) {
        return this._slots[key] || (this._slots[key] = { key, wantPlaying: false, src: '', loop: true, scale: 1, offset: 0, startedAt: 0, node: null, gainNode: null, fallbackAudio: null, token: 0 });
    }

    _stopSlotNode(slot, saveOffset = false) {
        const ctx = this.engine ? this.engine.ctx : null;
        if (saveOffset && slot.node && ctx && slot.buffer) {
            const elapsed = Math.max(0, ctx.currentTime - slot.startedAt);
            slot.offset = slot.loop ? (elapsed % slot.buffer.duration) : Math.min(elapsed, slot.buffer.duration);
        }
        if (slot.node) {
            try { slot.node.onended = null; slot.node.stop(); slot.node.disconnect(); } catch (_) {}
            slot.node = null;
        }
        if (slot.gainNode) { try { slot.gainNode.disconnect(); } catch (_) {} slot.gainNode = null; }
    }

    _startSlotBuffer(slot, buf) {
        const se = this.engine;
        if (!slot.wantPlaying || !buf || !se || !se.ctx || se.muted || se.bgmMuted || se.bgmVolume <= 0) return;
        const masterGain = this._ensureGain();
        if (!masterGain) return;
        if (slot.fallbackAudio) { try { slot.fallbackAudio.pause(); } catch (_) {} }
        this._stopSlotNode(slot, false);
        slot.buffer = buf;

        if (se.ctx.state !== 'running') {
            const retry = () => {
                if (slot.wantPlaying && !slot.node && slot.buffer === buf) this._startSlotBuffer(slot, buf);
            };
            if (typeof se.onAudioUnlock === 'function') se.onAudioUnlock(retry);
            se.ctx.resume().then(retry).catch(() => {});
            return;
        }

        const node = se.ctx.createBufferSource();
        node.buffer = buf;
        node.loop = !!slot.loop;
        const g = se.ctx.createGain();
        const effScale = (slot.key === 'credits') ? se._creditsGain : slot.scale;
        g.gain.value = Math.max(0, Math.min(1, effScale));
        node.connect(g);
        g.connect(masterGain);

        const startOff = Math.max(0, Math.min(buf.duration - 0.05, slot.offset || 0));
        slot.node = node;
        slot.gainNode = g;
        slot.startedAt = se.ctx.currentTime - startOff;
        node.onended = () => { if (!slot.loop && slot.node === node) { slot.node = null; slot.wantPlaying = false; } };
        node.start(0, startOff);
    }

    _startFallback(slot, src) {
        const se = this.engine;
        if (!slot || !slot.wantPlaying || !se || se.muted || se.bgmMuted || se.bgmVolume <= 0) return false;
        let audio = slot.fallbackAudio;
        if (!audio && typeof Audio !== 'undefined') {
            audio = new Audio(src);
            slot.fallbackAudio = audio;
        }
        if (!audio) return false;
        audio.loop = !!slot.loop;
        this.register(audio, slot.scale);
        try { if (slot.offset > 0 && Number.isFinite(slot.offset)) audio.currentTime = slot.offset; } catch (_) {}
        const p = audio.play();
        if (p && typeof p.catch === 'function') {
            p.catch(() => {
                if (typeof se.onAudioUnlock === 'function') {
                    se.onAudioUnlock(() => {
                        if (slot.wantPlaying && slot.fallbackAudio === audio && audio.paused && !se.muted && !se.bgmMuted) {
                            this.syncFallback(audio, slot.scale);
                            audio.play().catch(() => {});
                        }
                    });
                }
            });
        }
        return true;
    }

    isSlotActive(key) {
        return !!(this._slots[key] && this._slots[key].wantPlaying);
    }

    playTrack(key, src, opts = {}) {
        const se = this.engine;
        if (!se || !src) return false;
        const slot = this._getSlot(key);
        const token = ++slot.token;
        slot.src = src;
        slot.loop = opts.loop !== false;
        slot.scale = typeof opts.scale === 'number' ? opts.scale : 1.0;
        if (opts.reset) slot.offset = 0;
        if (opts.fallbackAudio) slot.fallbackAudio = opts.fallbackAudio;
        slot.wantPlaying = true;

        if (this.canUseWebAudio()) {
            this._configureAudioSession();
            se.init();
            if (!opts.reset && slot.node && slot.buffer) return true;
            this._getOrLoadBuffer(src).then((buf) => {
                if (!slot.wantPlaying || slot.token !== token) return;
                if (buf) this._startSlotBuffer(slot, buf);
                else this._startFallback(slot, src);
            });
            return true;
        }
        return false;
    }

    stopTrack(key, resetOffset = true) {
        const slot = this._slots[key];
        if (!slot) return;
        slot.wantPlaying = false;
        slot.token++;
        this._stopSlotNode(slot, !resetOffset);
        if (slot.fallbackAudio) {
            try { slot.fallbackAudio.pause(); if (resetOffset) slot.fallbackAudio.currentTime = 0; } catch (_) {}
        }
        if (resetOffset) {
            slot.offset = 0;
            slot.buffer = null;
            if ((this.isMobile() || key !== 'menu') && slot.src) {
                this._buffers.delete(slot.src);
                this._rawBytes.delete(slot.src);
            }
        }
    }

    purgeInactiveBuffers() {
        const activeSrcs = new Set();
        for (const k of Object.keys(this._slots)) {
            const s = this._slots[k];
            if (!s) continue;
            if (s.wantPlaying && s.src) activeSrcs.add(s.src);
            else if (!s.wantPlaying) s.buffer = null;
        }
        for (const src of Array.from(this._buffers.keys())) {
            if (!activeSrcs.has(src)) this._buffers.delete(src);
        }
        for (const src of Array.from(this._rawBytes.keys())) {
            if (!activeSrcs.has(src)) this._rawBytes.delete(src);
        }
    }

    setTrackScale(key, scale) {
        const slot = this._slots[key];
        if (!slot) return;
        slot.scale = Math.max(0, Math.min(1, scale));
        if (slot.gainNode && this.engine && this.engine.ctx) {
            try { slot.gainNode.gain.setTargetAtTime(slot.scale, this.engine.ctx.currentTime, 0.015); }
            catch (_) { slot.gainNode.gain.value = slot.scale; }
        }
        if (slot.fallbackAudio) this.syncFallback(slot.fallbackAudio, slot.scale);
    }

    register(audioEl, scale = 1.0) {
        if (!audioEl) return;
        audioEl._bgmScale = scale;
        this._extraAudios.add(audioEl);
        this.syncFallback(audioEl, scale);
    }

    unregister(audioEl) {
        if (audioEl) this._extraAudios.delete(audioEl);
    }

    syncFallback(audioEl, customScale = null) {
        const se = this.engine;
        if (!audioEl || !se) return;
        const scale = customScale !== null ? customScale : (audioEl === se.creditsMusic ? se._creditsGain : (audioEl._bgmScale ?? 1.0));
        const eff = Math.max(0, Math.min(1, this.getEffectiveVol() * scale));
        audioEl.muted = (eff <= 0.001);
        audioEl.volume = eff;
    }

    syncAll() {
        const se = this.engine;
        if (!se) return;
        const masterBgm = this.getEffectiveVol();
        if (this._bgmGain && se.ctx) {
            try { this._bgmGain.gain.setTargetAtTime(masterBgm, se.ctx.currentTime, 0.015); }
            catch (_) { this._bgmGain.gain.value = masterBgm; }
        }
        if (this._slots.credits) this.setTrackScale('credits', se._creditsGain);
        this.syncFallback(se.menuMusic);
        this.syncFallback(se.creditsMusic);
        this._extraAudios.forEach(a => this.syncFallback(a));
    }

    pauseForBackground() {
        if (!this.isMobile()) return;
        const se = this.engine;
        if (!se) return;
        const slotMenu = this._slots.menu && this._slots.menu.wantPlaying;
        const slotCred = this._slots.credits && this._slots.credits.wantPlaying;
        const slotLil = this._slots.lilXas && this._slots.lilXas.wantPlaying;
        const slotApex = this._slots.apexW60 && this._slots.apexW60.wantPlaying;
        this._bgPausedSlots = {
            menu: !!(slotMenu || (se.menuMusic && !se.menuMusic.paused)),
            credits: !!(slotCred || (se.creditsMusic && !se.creditsMusic.paused && se._creditsActive)),
            lilXas: !!(slotLil || (typeof LilXasEvent !== 'undefined' && LilXasEvent.audio && !LilXasEvent.audio.paused)),
            apexW60: !!(slotApex || (typeof ApexW60Audio !== 'undefined' && ApexW60Audio._playing && !ApexW60Audio._paused))
        };
        if (this._slots.menu) this.stopTrack('menu', false);
        if (this._slots.credits) this.stopTrack('credits', false);
        if (this._slots.lilXas) this.stopTrack('lilXas', false);
        try { if (se.menuMusic && !se.menuMusic.paused) se.menuMusic.pause(); } catch (_) {}
        try { if (se.creditsMusic && !se.creditsMusic.paused) se.creditsMusic.pause(); } catch (_) {}
        if (typeof LilXasEvent !== 'undefined' && typeof LilXasEvent.setPaused === 'function') LilXasEvent.setPaused(true);
        if (typeof ApexW60Audio !== 'undefined' && typeof ApexW60Audio.setPaused === 'function') ApexW60Audio.setPaused(true);
        if (se.ctx && se.ctx.state === 'running') se.ctx.suspend().catch(() => {});
    }

    resumeFromBackground() {
        if (!this.isMobile()) return;
        const se = this.engine;
        const st = this._bgPausedSlots;
        this._bgPausedSlots = null;
        if (!se) return;
        this._configureAudioSession();

        const restore = () => {
            if (!st || se.muted || se.bgmMuted || se.bgmVolume <= 0) return;
            if (st.menu && (!window.gameInstance || window.gameInstance.state === 'MENU')) se.startMenuBGM();
            if (st.credits && se._creditsActive) this.playTrack('credits', encodeURI('Audio/Lesa.io (Credits).mp3'), { loop: false, scale: se._creditsGain, fallbackAudio: se.creditsMusic });
            if (st.lilXas && window.gameInstance && window.gameInstance.state === 'PLAYING' && typeof LilXasEvent !== 'undefined') LilXasEvent.setPaused(false);
            if (st.apexW60 && window.gameInstance && window.gameInstance.state === 'PLAYING' && typeof ApexW60Audio !== 'undefined') ApexW60Audio.setPaused(false);
        };
        if (se.ctx && se.ctx.state !== 'running') se.ctx.resume().then(restore).catch(restore);
        else restore();
    }

    _bindMobileLifecycle() {
        if (typeof document === 'undefined' || typeof window === 'undefined') return;
        document.addEventListener('visibilitychange', () => {
            if (document.hidden || document.visibilityState !== 'visible') this.pauseForBackground();
            else this.resumeFromBackground();
        });
        window.addEventListener('pagehide', () => this.pauseForBackground());
        document.addEventListener('freeze', () => this.pauseForBackground());
        window.addEventListener('pageshow', () => {
            if (!document.hidden && (!document.visibilityState || document.visibilityState === 'visible')) this.resumeFromBackground();
        });
    }
}

if (typeof window !== 'undefined') window.BgmController = BgmController;
