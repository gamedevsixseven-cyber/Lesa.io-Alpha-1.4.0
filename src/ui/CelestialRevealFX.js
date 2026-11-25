/**
 * Lesa.io - Celestial Weapon Chest Reveal Animation Helper
 * Renders a cosmic supernova reveal stage & Web Audio astral chime when pulling
 * a Celestial weapon from chests, keeping ChestModalUI lightweight (<600 lines).
 */

class CelestialRevealFX {
    static isCelestialWeaponItem(item) {
        if (!item || item.type !== 'weapon') return false;
        const raw = item.rarity || (item.weapon && (item.weapon.rarityKey || item.weapon.rarity)) || '';
        return String(raw).toLowerCase().trim() === 'celestial';
    }

    static playCelestialFanfare() {
        if (typeof window === 'undefined' || !window.soundEngine) return;
        const se = window.soundEngine;
        if (typeof se.playLevelUp === 'function') se.playLevelUp();

        const ctx = se.ctx;
        if (!ctx || se.muted || ctx.state !== 'running') return;
        try {
            const notes = [659.25, 830.61, 987.77, 1318.51, 1661.22]; // E5 -> G#6 cosmic shimmer
            const baseVol = Math.max(0.03, Math.min(0.14, (se.masterVolume || 0.5) * 0.16));
            const now = ctx.currentTime;
            notes.forEach((freq, idx) => {
                const start = now + idx * 0.085;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = idx === notes.length - 1 ? 'sine' : 'triangle';
                osc.frequency.setValueAtTime(freq, start);
                gain.gain.setValueAtTime(0.0001, start);
                gain.gain.exponentialRampToValueAtTime(baseVol, start + 0.025);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.52);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(start);
                osc.stop(start + 0.55);
            });
        } catch (err) {
            // Optional WebAudio accent never blocks UI reveal
        }
    }

    static _buildStarfieldHtml() {
        const stars = [
            ['12%', '16%', '0.0s'], ['84%', '14%', '0.4s'], ['18%', '78%', '0.8s'],
            ['88%', '74%', '0.2s'], ['28%', '24%', '1.1s'], ['74%', '28%', '0.6s'],
            ['10%', '48%', '0.9s'], ['90%', '46%', '0.3s'], ['38%', '84%', '1.3s'],
            ['66%', '86%', '0.5s'], ['52%', '12%', '0.7s'], ['24%', '58%', '1.0s']
        ];
        const twinkles = stars.map(([left, top, delay]) =>
            `<span class="cel-twinkle" style="left:${left};top:${top};animation-delay:${delay};"></span>`
        ).join('');

        const meteors = [
            ['6%', '18%', '0.1s'], ['58%', '10%', '0.75s'], ['18%', '56%', '1.35s']
        ];
        const streaks = meteors.map(([left, top, delay]) =>
            `<span class="cel-shooting-star" style="left:${left};top:${top};animation-delay:${delay};"></span>`
        ).join('');

        return `${twinkles}${streaks}`;
    }

    static renderWeaponStage(bodyEl, titleEl, def, item, remainingText) {
        if (!bodyEl || !item || !item.weapon) return;
        const w = item.weapon;
        if (titleEl) {
            titleEl.textContent = '✦ CELESTIAL ASCENSION ✦';
            titleEl.style.color = '#f0abfc';
        }
        this.playCelestialFanfare();

        const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        const wImg = w.image
            ? `<img src="${esc(w.image)}" class="cr-item-img" alt="${esc(w.name)}">`
            : `<div class="cr-item-emoji">${w.icon || '🌙'}</div>`;

        bodyEl.innerHTML = `
            ${remainingText}
            <div class="cr-loot-stage cel-loot-stage" id="cr-stage-clickarea">
                <div class="cel-backdrop-nebula"></div>
                <div class="cel-rays-outer"></div>
                <div class="cel-rays-inner"></div>
                <div class="cel-orbit-ring cel-orbit-ring-1"></div>
                <div class="cel-orbit-ring cel-orbit-ring-2"></div>
                <div class="cel-shock-ring"></div>
                <div class="cel-shock-ring delay-2"></div>
                <div class="cel-nova-flash"></div>
                ${this._buildStarfieldHtml()}
                <div class="cel-card-emerge">
                    <div class="cr-item-card tier-celestial cel-hero-card">
                        <div class="cr-card-rarity-ribbon">✦ CELESTIAL RELIC ✦</div>
                        ${wImg}
                        <div class="cr-item-name" title="${esc(w.name)}">${esc(w.name)}</div>
                        <div class="cel-unlock-tag">COSMIC NEW UNLOCK!</div>
                    </div>
                </div>
                <div class="cr-tap-hint">${typeof UiIcons !== 'undefined' ? UiIcons.i('sparkle', 'ui-icon-sm') : '✦'} TAP ANYWHERE TO CONTINUE</div>
            </div>
        `;
    }
}

if (typeof window !== 'undefined') window.CelestialRevealFX = CelestialRevealFX;
if (typeof module !== 'undefined' && module.exports) module.exports = { CelestialRevealFX };
