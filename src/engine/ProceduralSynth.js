/**
 * Lesa.io - Procedural Web Audio Synthesizer
 * Generates real-time cartoon audio waveforms (sine, triangle, sawtooth, noise)
 * for weapon shots, bounces, level-ups, explosions, and arena background chiptunes
 */

class ProceduralSynth {
    static playShoot(ctx, masterVolume, type = 'normal') {
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'watermelon') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.22);
            gain.gain.setValueAtTime(masterVolume * 1.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
            osc.start(now);
            osc.stop(now + 0.23);
        } else if (type === 'bubble') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(450, now);
            osc.frequency.exponentialRampToValueAtTime(900, now + 0.08);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
            gain.gain.setValueAtTime(masterVolume * 0.7, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.16);
        } else if (type === 'pepper') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);
            gain.gain.setValueAtTime(masterVolume * 0.6, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.13);
        } else if (type === 'money_gun' || type === 'money') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1100, now);
            osc.frequency.exponentialRampToValueAtTime(450, now + 0.08);
            gain.gain.setValueAtTime(masterVolume * 0.75, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.09);
        } else {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600 + Math.random() * 80, now);
            osc.frequency.exponentialRampToValueAtTime(140, now + 0.1);
            gain.gain.setValueAtTime(masterVolume * 0.8, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.11);
        }
    }

    static playTick(ctx, masterVolume) {
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880 + Math.random() * 80, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.04);
        gain.gain.setValueAtTime(masterVolume * 0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
    }

    static playHit(ctx, masterVolume, isEnemy = true, isCrit = false) {
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        if (isCrit) {
            osc.type = 'square';
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.exponentialRampToValueAtTime(110, now + 0.14);
            gain.gain.setValueAtTime(masterVolume * 0.65, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
        } else if (isEnemy) {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(280 + Math.random() * 40, now);
            osc.frequency.exponentialRampToValueAtTime(90, now + 0.09);
            gain.gain.setValueAtTime(masterVolume * 0.45, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
        } else {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(350, now);
            osc.frequency.exponentialRampToValueAtTime(120, now + 0.2);
            gain.gain.setValueAtTime(masterVolume * 0.85, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        }

        osc.start(now);
        osc.stop(now + 0.21);
    }

    static playFatmirSlam(ctx, masterVolume) {
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);
        gain.gain.setValueAtTime(masterVolume * 1.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.36);

        ProceduralSynth.playNoiseCrack(ctx, masterVolume, now, 0.2, 0.5);
    }

    static playCasillasDash(ctx, masterVolume) {
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.22);
        gain.gain.setValueAtTime(masterVolume * 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.23);
    }

    static playProceduralDash(ctx, masterVolume) {
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.15);
        gain.gain.setValueAtTime(masterVolume * 0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
    }

    static playMushroomBounce(ctx, masterVolume) {
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(720, now + 0.18);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.35);

        gain.gain.setValueAtTime(masterVolume * 0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.36);
    }

    static playCrateBreak(ctx, masterVolume) {
        if (!ctx) return;
        ProceduralSynth.playNoiseCrack(ctx, masterVolume, ctx.currentTime, 0.15, 0.6);
    }

    static playPickup(ctx, masterVolume, type = 'xp') {
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        if (type === 'heart') {
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.setValueAtTime(659.25, now + 0.06);
            osc.frequency.setValueAtTime(783.99, now + 0.12);
        } else if (type === 'star') {
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(1400, now + 0.18);
        } else {
            const pitch = 580 + (Math.random() * 200);
            osc.frequency.setValueAtTime(pitch, now);
            osc.frequency.exponentialRampToValueAtTime(pitch * 1.5, now + 0.08);
        }

        gain.gain.setValueAtTime(masterVolume * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.19);
    }

    static playLevelUp(ctx, masterVolume) {
        if (!ctx) return;
        const notes = [440, 554.37, 659.25, 880];
        const now = ctx.currentTime;

        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);

            gain.gain.setValueAtTime(0, now + idx * 0.08);
            gain.gain.linearRampToValueAtTime(masterVolume * 0.8, now + idx * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.28);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.3);
        });
    }

    static playGameOver(ctx, masterVolume) {
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(120, now + 0.8);

        gain.gain.setValueAtTime(masterVolume * 0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.85);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.9);
    }

    static getSharedNoiseBuffer(ctx) {
        if (ProceduralSynth._sharedNoise && ProceduralSynth._sharedNoise.sampleRate === ctx.sampleRate) {
            return ProceduralSynth._sharedNoise;
        }
        const sampleRate = ctx.sampleRate || 44100;
        const length = sampleRate; // 1 full second of cached white noise
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        ProceduralSynth._sharedNoise = buffer;
        return buffer;
    }

    static playNoiseCrack(ctx, masterVolume, time, duration, vol) {
        if (!ctx) return;
        const noise = ctx.createBufferSource();
        noise.buffer = ProceduralSynth.getSharedNoiseBuffer(ctx);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, time);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(masterVolume * vol, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(time);
        noise.stop(time + duration);
    }

    static playBladeSwish(ctx, masterVolume) {
        if (!ctx) return;
        const now = ctx.currentTime;
        const duration = 0.22;

        // 1. Airy Wind Whoosh (Reusing shared noise buffer - zero allocations!)
        const noise = ctx.createBufferSource();
        noise.buffer = ProceduralSynth.getSharedNoiseBuffer(ctx);

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.setValueAtTime(2.5, now);
        filter.frequency.setValueAtTime(2200, now);
        filter.frequency.exponentialRampToValueAtTime(450, now + duration);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.001, now);
        noiseGain.gain.linearRampToValueAtTime(masterVolume * 0.75, now + 0.04);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + duration);

        // 2. High-Pitched Metallic Blade Shimmer / Ring
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(650, now + duration);

        oscGain.gain.setValueAtTime(0.001, now);
        oscGain.gain.linearRampToValueAtTime(masterVolume * 0.4, now + 0.03);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
    }
}

if (typeof window !== 'undefined') {
    window.ProceduralSynth = ProceduralSynth;
}
