// ==================== OLYMPUS SANCTUARY ALTAR UI ====================
// Comic-styled Olympian Blessing selection screen matching Lesa.io's
// Luckiest Guy / Fredoka visual identity, thick ink outlines, and
// custom cel-shaded SVG god crests + native game icons.

const ALTAR_CREST_SVGS = {
    zeus_spark: `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path d="M16 40c-5.5 0-10-4-10-9.2 0-4.8 3.6-8.7 8.4-9.2 2-6.2 7.8-10.6 14.6-10.6 7 0 13 4.8 14.8 11.4 4.7.8 8.2 4.6 8.2 9.4 0 5.2-4.4 9.2-10 9.2H16z" fill="#70a1ff" stroke="#1e272e" stroke-width="3.6" stroke-linejoin="round"/>
        <path d="M35 8L19 34h12l-5 22 21-28H35l5-20z" fill="#fed330" stroke="#1e272e" stroke-width="3.8" stroke-linejoin="round"/>
        <path d="M34 14l-9 17h7l-2 12 10-14h-7l1-15z" fill="#fff7b8"/>
    </svg>`,
    hermes_wings: `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path d="M12 42c11-1 22-8 31-20 4-5 10-8 14-8-1 6-4 10-8 13 4-1 7-1 10-2-2 5-6 9-12 10 3 1 5 1 8 1-4 5-10 8-17 9 3 1 5 2 7 3-6 4-15 6-24 4-6-1-9-5-9-10z" fill="#e0f2fe" stroke="#1e272e" stroke-width="3.6" stroke-linejoin="round"/>
        <path d="M14 48c9 0 19-4 28-11l5 7c-9 8-20 12-31 12-4 0-7-3-7-6 0-1.3 2.2-2 5-2z" fill="#fed330" stroke="#1e272e" stroke-width="3.6" stroke-linejoin="round"/>
        <path d="M7 28h14M5 36h10" stroke="#38bdf8" stroke-width="3.6" stroke-linecap="round"/>
    </svg>`,
    athena_aegis: `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path d="M32 7L53 15v16c0 13.5-9.2 22.8-21 26.5C20.2 53.8 11 44.5 11 31V15L32 7z" fill="#a78bfa" stroke="#1e272e" stroke-width="3.8" stroke-linejoin="round"/>
        <path d="M32 14l14 5.5V31c0 9.5-6.1 16.2-14 19.3-7.9-3.1-14-9.8-14-19.3V19.5L32 14z" fill="#fed330" stroke="#1e272e" stroke-width="3.2" stroke-linejoin="round"/>
        <path d="M32 21l3.6 7.4 8.2 1.1-6 5.7 1.5 8.1-7.3-3.9-7.3 3.9 1.5-8.1-6-5.7 8.2-1.1L32 21z" fill="#fff9e6" stroke="#1e272e" stroke-width="2.6" stroke-linejoin="round"/>
    </svg>`,
    apollo_sunfire: `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path d="M32 5l4.8 9.2 10.2-2.6-2 10.3 9.2 4.7-7.8 6.9 4.2 9.5-10.3-.5-3.3 9.9-6-8.4-6 8.4-3.3-9.9-10.3.5 4.2-9.5-7.8-6.9 9.2-4.7-2-10.3 10.2 2.6L32 5z" fill="#ff7f32" stroke="#1e272e" stroke-width="3.6" stroke-linejoin="round"/>
        <circle cx="32" cy="32" r="14.5" fill="#fed330" stroke="#1e272e" stroke-width="3.6"/>
        <circle cx="28" cy="27" r="4.5" fill="#fff9d6"/>
    </svg>`,
    hestia_hearth: `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path d="M32 8c5 7.5 14 13.5 14 24.2 0 7.7-6.3 13.8-14 13.8s-14-6.1-14-13.8c0-5 2.4-9.4 5.5-13.2 0 4 2.4 6.2 4.6 7-1-6.5 1.1-12.7 3.9-18z" fill="#ff4757" stroke="#1e272e" stroke-width="3.6" stroke-linejoin="round"/>
        <path d="M32 21c3.5 4.5 7 8 7 13.5 0 4.2-3.1 7.5-7 7.5s-7-3.3-7-7.5c0-3.2 1.7-5.8 3.6-8.3.4 2.2 1.6 3.5 3.1 4-.5-3.4.3-6.5.3-9.2z" fill="#fed330" stroke="#1e272e" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M13 45h38l-5 11H18l-5-11z" fill="#d97706" stroke="#1e272e" stroke-width="3.6" stroke-linejoin="round"/>
    </svg>`,
    artemis_hunt: `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path d="M39 10c-13.5 1.8-23 12.2-23 24.5 0 11 8.2 19.8 19.6 21.5-7.4-4.2-11.2-11.3-11.2-19.6 0-10.2 5.9-18.8 14.6-23.4V10z" fill="#2ed573" stroke="#1e272e" stroke-width="3.6" stroke-linejoin="round"/>
        <path d="M14 48L50 14" stroke="#1e272e" stroke-width="8" stroke-linecap="round"/>
        <path d="M14 48L50 14" stroke="#fed330" stroke-width="4" stroke-linecap="round"/>
        <path d="M37 14h13v13l-5-4-4-4-4-5z" fill="#ffffff" stroke="#1e272e" stroke-width="3.2" stroke-linejoin="round"/>
        <circle cx="46" cy="43" r="4.5" fill="#fef08a" stroke="#1e272e" stroke-width="2.8"/>
    </svg>`
};

const ALTAR_BLESSING_META = {
    zeus_spark: {
        domain: 'Sky Father · Storm',
        bannerTop: '#ffe047',
        bannerBot: '#f59f00',
        glow: 'rgba(250, 204, 21, 0.45)',
        tint: '#fff9dc',
        statChips: [
            { icon: 'assets/GearUIIcons/ATK.png', label: '+22% ATK' },
            { icon: 'assets/ui-icons/target.svg', label: '+10% CRIT' }
        ]
    },
    hermes_wings: {
        domain: 'Fleet Messenger',
        bannerTop: '#67e8f9',
        bannerBot: '#0ea5e9',
        glow: 'rgba(56, 189, 248, 0.42)',
        tint: '#ebf8ff',
        statChips: [
            { icon: 'assets/ui-icons/boot.svg', label: '+18% SPD' },
            { icon: 'assets/ui-icons/wind.svg', label: '-25% DASH CD' }
        ]
    },
    athena_aegis: {
        domain: 'Goddess of Strategy',
        bannerTop: '#d8cbff',
        bannerBot: '#9f7aea',
        glow: 'rgba(167, 139, 250, 0.42)',
        tint: '#f4f0ff',
        statChips: [
            { icon: 'assets/GearUIIcons/HP.png', label: '+45 MAX HP' },
            { icon: 'assets/GearUIIcons/DEF.png', label: '+12% ARMOR' },
            { icon: 'assets/ui-icons/sparkle.svg', label: '+SHIELD' }
        ]
    },
    apollo_sunfire: {
        domain: 'Lord of Solar Light',
        bannerTop: '#ffc470',
        bannerBot: '#f97316',
        glow: 'rgba(251, 146, 60, 0.45)',
        tint: '#fff3e6',
        statChips: [
            { icon: 'assets/ui-icons/flame.svg', label: '+24% FIRE RATE' },
            { icon: 'assets/ui-icons/rocket.svg', label: '+15% SHOT SPD' }
        ]
    },
    hestia_hearth: {
        domain: 'Keeper of the Hearth',
        bannerTop: '#ff9ca6',
        bannerBot: '#f05252',
        glow: 'rgba(248, 113, 113, 0.45)',
        tint: '#fff0f2',
        statChips: [
            { icon: 'assets/ui-icons/plus.svg', label: '+65% HEAL' },
            { icon: 'assets/ui-icons/flame.svg', label: '+2.5 HP/S' }
        ]
    },
    artemis_hunt: {
        domain: 'Silver Huntress',
        bannerTop: '#6ee7b7',
        bannerBot: '#059669',
        glow: 'rgba(52, 211, 153, 0.42)',
        tint: '#ecfdf5',
        statChips: [
            { icon: 'assets/ui-icons/star.svg', label: '+35% CRIT DMG' },
            { icon: 'assets/GearUIIcons/ATK.png', label: '+14% ATK' }
        ]
    }
};

function _escapeAltarText(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

class OlympusAltarUI {
    /**
     * Build and attach the comic-styled Olympus Sanctuary Altar blessing screen.
     * @param {Object} opts
     * @param {Array} opts.choices - Up to 3 OLYMPUS_BLESSINGS entries
     * @param {Array} opts.activeBlessings - Already claimed blessings in this ascent
     * @param {number} opts.currentFloor - Cleared floor number (1..4)
     * @param {number} opts.nextFloor - Upcoming floor number (2..5)
     * @param {Object|null} opts.player - Player instance for HP pill context
     * @param {Function} opts.onSelect - Callback invoked with (index)
     * @returns {{ rootEl: HTMLElement, setActivePress: Function }}
     */
    static render({ choices = [], activeBlessings = [], currentFloor = 1, nextFloor = 2, player = null, onSelect }) {
        const wrap = document.createElement('div');
        wrap.id = 'olympus-blessing-modal';
        wrap.setAttribute('role', 'dialog');
        wrap.setAttribute('aria-modal', 'true');
        wrap.setAttribute('aria-label', 'Olympus Sanctuary Altar - Choose a Blessing');

        const curCfg = (typeof OlympusLayouts !== 'undefined' && OlympusLayouts.getFloorConfig)
            ? OlympusLayouts.getFloorConfig(currentFloor)
            : { name: `Floor ${currentFloor}`, elevationM: currentFloor * 400 };
        const nxtCfg = (typeof OlympusLayouts !== 'undefined' && OlympusLayouts.getFloorConfig)
            ? OlympusLayouts.getFloorConfig(nextFloor)
            : { name: `Floor ${nextFloor}`, elevationM: nextFloor * 500 };

        const hpNow = player ? Math.max(0, Math.round(player.hp || 0)) : null;
        const hpMax = player ? Math.max(1, Math.round(player.maxHp || 100)) : null;

        const panel = document.createElement('div');
        panel.className = 'altar-temple-panel';
        panel.innerHTML = `<div class="altar-meander-frieze top" aria-hidden="true"></div>`;

        const body = document.createElement('div');
        body.className = 'altar-scroll-body';

        // Header stage with flanking sanctuary braziers
        const header = document.createElement('div');
        header.className = 'altar-header-stage';
        header.innerHTML = `
            <div class="altar-brazier-pedestal" aria-hidden="true">
                <span class="altar-brazier-glow"></span>
                <img class="altar-brazier-img" src="assets/Olympus/olympus_brazier.png" alt="">
            </div>
            <div class="altar-header-center">
                <div class="altar-eyebrow-pill">
                    <img src="assets/ui-icons/temple.svg" alt="">
                    <span>OLYMPUS SANCTUARY ALTAR</span>
                </div>
                <h2 class="altar-main-title">CLAIM AN OLYMPIAN BOON</h2>
                <p class="altar-subtitle">Pick one divine blessing to carry upward into the next trial</p>
            </div>
            <div class="altar-brazier-pedestal" aria-hidden="true">
                <span class="altar-brazier-glow"></span>
                <img class="altar-brazier-img" src="assets/Olympus/olympus_brazier.png" alt="">
            </div>
        `;
        body.appendChild(header);

        // Climb context & active blessings strip
        const strip = document.createElement('div');
        strip.className = 'altar-ascent-strip';
        const elevGain = Math.max(0, (nxtCfg.elevationM || 0) - (curCfg.elevationM || 0));
        let stripHtml = `
            <span class="altar-strip-pill route">
                <img src="assets/ui-icons/crown.svg" alt="">
                <span>${_escapeAltarText(curCfg.name)}</span>
                <span class="altar-arrow">➜</span>
                <span>${_escapeAltarText(nxtCfg.name)}</span>
            </span>
            <span class="altar-strip-pill elev">
                <span>▲ ${(nxtCfg.elevationM || 0).toLocaleString()}m (+${elevGain}m)</span>
            </span>
        `;
        if (hpNow !== null) {
            stripHtml += `
                <span class="altar-strip-pill hp">
                    <img src="assets/GearUIIcons/HP.png" alt="">
                    <span>${hpNow} / ${hpMax} HP</span>
                </span>
            `;
        }
        if (activeBlessings.length > 0) {
            const dots = activeBlessings.map((b) => {
                const svg = ALTAR_CREST_SVGS[b.id] || ALTAR_CREST_SVGS.zeus_spark;
                return `<span class="altar-boon-mini-dot" style="background:${_escapeAltarText(b.color || '#fed330')}" title="${_escapeAltarText(b.title)}">${svg}</span>`;
            }).join('');
            stripHtml += `<span class="altar-active-boons"><span>Boons:</span>${dots}</span>`;
        }
        strip.innerHTML = stripHtml;
        body.appendChild(strip);

        // 3 Blessing Cards Grid
        const grid = document.createElement('div');
        grid.className = 'altar-cards-grid';
        const cardButtons = [];

        choices.forEach((b, idx) => {
            const meta = ALTAR_BLESSING_META[b.id] || {
                domain: 'Olympian Favor',
                bannerTop: b.color || '#fed330',
                bannerBot: '#e67e22',
                glow: 'rgba(254, 211, 48, 0.4)',
                tint: '#fff9e6',
                statChips: []
            };
            const crestSvg = ALTAR_CREST_SVGS[b.id] || ALTAR_CREST_SVGS.zeus_spark;
            const chipsHtml = meta.statChips.map((chip) => `
                <span class="altar-stat-chip">
                    <img src="${_escapeAltarText(chip.icon)}" alt="">
                    <span>${_escapeAltarText(chip.label)}</span>
                </span>
            `).join('');

            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'altar-card';
            card.dataset.blessingIndex = String(idx);
            card.dataset.blessingId = String(b.id || '');
            card.style.setProperty('--god-color', b.color || '#fed330');
            card.style.setProperty('--god-banner-top', meta.bannerTop);
            card.style.setProperty('--god-banner-bot', meta.bannerBot);
            card.style.setProperty('--god-glow', meta.glow);
            card.style.setProperty('--god-tint', meta.tint);

            card.innerHTML = `
                <div class="altar-card-ribbon">
                    <div class="altar-god-tag">
                        <span class="altar-god-name">${_escapeAltarText(b.god)}</span>
                        <span class="altar-god-domain">${_escapeAltarText(meta.domain)}</span>
                    </div>
                    <span class="altar-hotkey-cap" title="Press ${idx + 1}">${idx + 1}</span>
                </div>
                <div class="altar-card-body">
                    <div class="altar-medallion-wrap" aria-hidden="true">
                        <div class="altar-sunburst"></div>
                        <div class="altar-medallion">${crestSvg}</div>
                    </div>
                    <div class="altar-text-stack">
                        <h3 class="altar-boon-title">${_escapeAltarText(b.title)}</h3>
                        <div class="altar-stat-chips">${chipsHtml}</div>
                        <p class="altar-boon-desc">${_escapeAltarText(b.desc)}</p>
                    </div>
                </div>
                <div class="altar-card-cta">CLAIM BOON ▲</div>
            `;

            card.addEventListener('click', () => {
                if (typeof onSelect === 'function') onSelect(idx);
            });
            cardButtons.push(card);
            grid.appendChild(card);
        });

        body.appendChild(grid);

        const hint = document.createElement('div');
        hint.className = 'altar-footer-hint';
        hint.textContent = 'Click any card or press [1]  [2]  [3] to claim your blessing & ascend';
        body.appendChild(hint);

        panel.appendChild(body);
        const bottomFrieze = document.createElement('div');
        bottomFrieze.className = 'altar-meander-frieze bottom';
        bottomFrieze.setAttribute('aria-hidden', 'true');
        panel.appendChild(bottomFrieze);

        wrap.appendChild(panel);
        document.body.appendChild(wrap);

        return {
            rootEl: wrap,
            setActivePress(idx) {
                const btn = cardButtons[idx];
                if (btn) btn.classList.add('is-pressed');
            }
        };
    }
}

if (typeof window !== 'undefined') {
    window.OlympusAltarUI = OlympusAltarUI;
    window.ALTAR_CREST_SVGS = ALTAR_CREST_SVGS;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OlympusAltarUI, ALTAR_CREST_SVGS, ALTAR_BLESSING_META };
}
