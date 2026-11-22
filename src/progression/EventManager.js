/**
 * Lesa.io - Live Events Schedule, Reward Multipliers & Interactive Events Hub
 * Evaluates scheduled events, exposes XP / Gold / Material multipliers, and renders the Events Hub.
 */

class EventManager {
    static EVENTS = [
        {
            id: 'launch_week_2026',
            title: 'LAUNCH EVENT',
            subtitle: 'Official Launch Week • Dec 1 – Dec 7, 2026',
            desc: 'Celebrate Lesa.io launching on December 1st! Jump into Story, Endless, Mt. Olympus, or Co-op to earn boosted Account & Battle Pass XP, double Match & Pouch Gold, and +35% bonus Crafting Material drops all week long.',
            badge: 'LAUNCH WEEK',
            iconKey: 'rocket',
            // Dec 1, 2026 00:00:00 through Dec 7, 2026 23:59:59 (local time, 7 full days)
            startAt: new Date(2026, 11, 1, 0, 0, 0, 0).getTime(),
            endAt: new Date(2026, 11, 8, 0, 0, 0, 0).getTime(),
            xpMultiplier: 1.5,
            goldMultiplier: 2.0,
            materialLuckBonus: 0.35
        }
    ];

    static _uiBound = false;
    static _activeTab = 'featured';
    static _modalTimerId = null;
    static _menuTimerId = null;
    static _lastRenderedStatus = null;

    static getNow(nowOverride = null) {
        return (typeof nowOverride === 'number' && !Number.isNaN(nowOverride)) ? nowOverride : Date.now();
    }

    static getEvents() {
        return this.EVENTS;
    }

    static getEventStatus(ev, now = this.getNow()) {
        if (!ev) return 'ended';
        if (now < ev.startAt) return 'upcoming';
        if (now < ev.endAt) return 'live';
        return 'ended';
    }

    static getActiveEvents(now = this.getNow()) {
        return this.EVENTS.filter((ev) => this.getEventStatus(ev, now) === 'live');
    }

    static getUpcomingEvents(now = this.getNow()) {
        return this.EVENTS.filter((ev) => this.getEventStatus(ev, now) === 'upcoming');
    }

    static getPrimaryEvent(now = this.getNow()) {
        return this.getActiveEvents(now)[0] || this.getUpcomingEvents(now)[0] || this.EVENTS[0] || null;
    }

    static getXpMultiplier(now = this.getNow()) {
        let mult = 1.0;
        const active = this.getActiveEvents(now);
        for (let i = 0; i < active.length; i++) {
            const val = Number(active[i].xpMultiplier);
            if (val > 0) mult *= val;
        }
        return mult;
    }

    static getGoldMultiplier(now = this.getNow()) {
        let mult = 1.0;
        const active = this.getActiveEvents(now);
        for (let i = 0; i < active.length; i++) {
            const val = Number(active[i].goldMultiplier);
            if (val > 0) mult *= val;
        }
        return mult;
    }

    static getMaterialLuckBonus(now = this.getNow()) {
        let bonus = 0;
        const active = this.getActiveEvents(now);
        for (let i = 0; i < active.length; i++) {
            const val = Number(active[i].materialLuckBonus);
            if (val > 0) bonus += val;
        }
        return bonus;
    }

    static formatMultiplier(mult) {
        const n = Number(mult) || 1;
        return `${n.toFixed(1)}x`;
    }

    static formatPercentBonus(bonus) {
        return `+${Math.round((Number(bonus) || 0) * 100)}%`;
    }

    static getCountdownParts(ms) {
        const totalSecs = Math.max(0, Math.floor(ms / 1000));
        return {
            days: Math.floor(totalSecs / 86400),
            hours: Math.floor((totalSecs % 86400) / 3600),
            mins: Math.floor((totalSecs % 3600) / 60),
            secs: totalSecs % 60
        };
    }

    static formatDateRange(ev) {
        if (!ev) return '';
        const startStr = new Date(ev.startAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endInclusive = new Date(Math.max(ev.startAt, ev.endAt - 1)).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
        return `${startStr} – ${endInclusive}`;
    }

    static _ico(key, cls = 'ui-icon ui-icon-sm') {
        return (typeof UiIcons !== 'undefined' && typeof UiIcons.i === 'function') ? UiIcons.i(key, cls) : '';
    }

    static initUI() {
        if (typeof document === 'undefined' || this._uiBound) return;
        this._uiBound = true;

        const closeBtn = document.getElementById('close-events-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (window.soundEngine && typeof window.soundEngine.playGoBack === 'function') window.soundEngine.playGoBack();
                this.hideModal();
            });
        }

        const playBtn = document.getElementById('events-play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') window.soundEngine.playSelect();
                this.hideModal();
                const mc = window.uiController && window.uiController.menuController;
                if (mc && typeof mc.showGameModeModal === 'function') mc.showGameModeModal();
            });
        }

        const tabBar = document.getElementById('events-tabs-bar');
        if (tabBar) {
            tabBar.querySelectorAll('[data-events-tab]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const nextTab = btn.getAttribute('data-events-tab');
                    if (!nextTab || nextTab === this._activeTab) return;
                    if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') window.soundEngine.playSelect();
                    this._activeTab = nextTab;
                    this.renderModal();
                });
            });
        }

        if (window.EventBus) {
            window.EventBus.on('gameOver', () => this.syncEndScreenBadges());
        }

        this.updateMenuButtonBadge();
        this.syncEndScreenBadges();

        if (!this._menuTimerId) {
            this._menuTimerId = setInterval(() => this.updateMenuButtonBadge(), 30000);
        }
    }

    static showModal(tab = null) {
        if (typeof document === 'undefined') return;
        this.initUI();
        if (tab) this._activeTab = tab;
        const modal = document.getElementById('events-modal');
        if (!modal) return;
        this.renderModal();
        modal.classList.remove('hidden');

        if (this._modalTimerId) clearInterval(this._modalTimerId);
        this._modalTimerId = setInterval(() => {
            if (modal.classList.contains('hidden')) {
                clearInterval(this._modalTimerId);
                this._modalTimerId = null;
                return;
            }
            const now = this.getNow();
            const primary = this.getPrimaryEvent(now);
            const curStatus = primary ? this.getEventStatus(primary, now) : 'ended';
            if (curStatus !== this._lastRenderedStatus) {
                this.renderModal(now);
            } else {
                this._updateClockDom(now);
            }
            this.updateMenuButtonBadge(now);
        }, 1000);
    }

    static hideModal() {
        if (typeof document === 'undefined') return;
        const modal = document.getElementById('events-modal');
        if (modal) modal.classList.add('hidden');
        if (this._modalTimerId) {
            clearInterval(this._modalTimerId);
            this._modalTimerId = null;
        }
    }

    static updateMenuButtonBadge(now = this.getNow()) {
        if (typeof document === 'undefined') return;
        const btn = document.getElementById('btn-events');
        const badge = document.getElementById('events-badge');
        if (!btn || !badge) return;

        const active = this.getActiveEvents(now);
        const upcoming = this.getUpcomingEvents(now);

        btn.classList.toggle('has-live-event', active.length > 0);
        btn.classList.toggle('has-upcoming-event', active.length === 0 && upcoming.length > 0);
        badge.classList.remove('is-live', 'is-upcoming');

        if (active.length > 0) {
            badge.textContent = 'LIVE';
            badge.classList.add('is-live');
            badge.classList.remove('hidden');
        } else if (upcoming.length > 0) {
            const firstStart = new Date(upcoming[0].startAt);
            const mon = firstStart.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
            badge.textContent = `${mon} ${firstStart.getDate()}`;
            badge.classList.add('is-upcoming');
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    static syncEndScreenBadges(now = this.getNow()) {
        if (typeof document === 'undefined') return;
        const goldMult = this.getGoldMultiplier(now);
        const xpMult = this.getXpMultiplier(now);

        const applyPill = (id, mult) => {
            const el = document.getElementById(id);
            if (!el) return;
            if (mult > 1.0) {
                el.textContent = `${this.formatMultiplier(mult)} EVENT`;
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        };

        applyPill('stat-coins-event-pill', goldMult);
        applyPill('stat-xp-event-pill', xpMult);
        applyPill('olympus-coins-event-pill', goldMult);
        applyPill('olympus-xp-event-pill', xpMult);
    }

    static _updateClockDom(now = this.getNow()) {
        const ev = this.getPrimaryEvent(now);
        if (!ev) return;
        const status = this.getEventStatus(ev, now);
        const targetMs = status === 'upcoming' ? (ev.startAt - now) : (status === 'live' ? (ev.endAt - now) : 0);
        const p = this.getCountdownParts(targetMs);
        const setVal = (attr, val) => {
            const el = document.querySelector(`[data-events-clock="${attr}"]`);
            if (el) el.textContent = String(val).padStart(2, '0');
        };
        setVal('days', p.days);
        setVal('hours', p.hours);
        setVal('mins', p.mins);
        setVal('secs', p.secs);
    }

    static renderModal(now = this.getNow()) {
        if (typeof document === 'undefined') return;
        const bodyEl = document.getElementById('events-modal-list');
        const subEl = document.getElementById('events-header-sub');
        const playBtn = document.getElementById('events-play-btn');
        const clockWrap = document.getElementById('events-header-clock');
        const tabBar = document.getElementById('events-tabs-bar');
        if (!bodyEl) return;

        const primary = this.getPrimaryEvent(now);
        const status = primary ? this.getEventStatus(primary, now) : 'ended';
        this._lastRenderedStatus = status;

        if (tabBar) {
            tabBar.querySelectorAll('[data-events-tab]').forEach((btn) => {
                btn.classList.toggle('active', btn.getAttribute('data-events-tab') === this._activeTab);
            });
        }

        if (subEl && primary) {
            const matTxt = this.formatPercentBonus(primary.materialLuckBonus);
            if (status === 'live') {
                subEl.textContent = `LIVE NOW • ${this.formatMultiplier(primary.xpMultiplier)} XP • ${this.formatMultiplier(primary.goldMultiplier)} GOLD • ${matTxt} MAT DROPS`;
            } else if (status === 'upcoming') {
                subEl.textContent = `LAUNCHES ${this.formatDateRange(primary).toUpperCase()} • AUTO-ACTIVATES AT MIDNIGHT`;
            } else {
                subEl.textContent = 'Check back soon for the next scheduled village event!';
            }
        }

        if (clockWrap && primary) {
            const clockTitle = status === 'live' ? 'ENDS IN' : (status === 'upcoming' ? 'STARTS IN' : 'STATUS');
            clockWrap.className = `events-clock-box is-${status}`;
            clockWrap.innerHTML = status === 'ended'
                ? '<span class="events-clock-label">EVENT ENDED</span>'
                : `<span class="events-clock-label">${clockTitle}</span>
                   <div class="events-clock-digits">
                       <span class="ev-cd-unit"><strong data-events-clock="days">00</strong><small>D</small></span>
                       <span class="ev-cd-unit"><strong data-events-clock="hours">00</strong><small>H</small></span>
                       <span class="ev-cd-unit"><strong data-events-clock="mins">00</strong><small>M</small></span>
                       <span class="ev-cd-unit"><strong data-events-clock="secs">00</strong><small>S</small></span>
                   </div>`;
        }

        if (playBtn) {
            playBtn.textContent = status === 'live' ? 'PLAY WITH BOOSTS!' : 'CHOOSE MODE';
        }

        if (this._activeTab === 'breakdown') {
            bodyEl.innerHTML = this._renderBreakdownTab(primary, status);
        } else if (this._activeTab === 'schedule') {
            bodyEl.innerHTML = this._renderScheduleTab(primary, status);
        } else {
            bodyEl.innerHTML = this._renderFeaturedTab(primary, status);
        }

        this._updateClockDom(now);
    }

    static _renderFeaturedTab(ev, status) {
        if (!ev) return '';
        const isLive = status === 'live';
        const isUpcoming = status === 'upcoming';
        const statusBadge = isLive
            ? `${this._ico('flame')} LIVE NOW`
            : (isUpcoming ? `${this._ico('hourglass')} UPCOMING` : `${this._ico('check')} ENDED`);

        const mats = (typeof MaterialRegistry !== 'undefined') ? MaterialRegistry.getAll() : [];
        const matChips = mats.map((m) => `
            <span class="ev-mat-pill" style="border-color: ${m.color};">
                <img src="${m.iconImg}" alt="${m.name}" class="ev-mat-ico">
                <span>${m.shortName}</span>
            </span>
        `).join('');

        return `
            <article class="event-card is-${status}">
                <div class="event-card-top">
                    <div class="event-card-title-row">
                        <span class="event-card-emblem">${this._ico(ev.iconKey || 'rocket', 'ui-icon event-card-icon-img')}</span>
                        <div class="event-card-headings">
                            <span class="event-type-tag">${ev.badge || 'EVENT'} • ${this.formatDateRange(ev)}</span>
                            <h3 class="event-card-title">${ev.title}</h3>
                        </div>
                    </div>
                    <span class="event-status-pill is-${status}">${statusBadge}</span>
                </div>

                <p class="event-card-desc">${ev.desc}</p>

                <div class="event-multipliers-grid">
                    <div class="event-mult-chip is-xp">
                        ${this._ico('bolt', 'ui-icon ev-chip-icon')}
                        <div class="ev-chip-body">
                            <span class="event-mult-val">${this.formatMultiplier(ev.xpMultiplier)} XP</span>
                            <span class="event-mult-scope">Account &amp; Battle Pass XP</span>
                        </div>
                    </div>
                    <div class="event-mult-chip is-gold">
                        ${this._ico('coin', 'ui-icon ev-chip-icon')}
                        <div class="ev-chip-body">
                            <span class="event-mult-val">${this.formatMultiplier(ev.goldMultiplier)} GOLD</span>
                            <span class="event-mult-scope">Match Clear &amp; Coin Pouches</span>
                        </div>
                    </div>
                    <div class="event-mult-chip is-mats">
                        ${this._ico('mat_armory_shards', 'ui-icon ev-chip-icon')}
                        <div class="ev-chip-body">
                            <span class="event-mult-val">${this.formatPercentBonus(ev.materialLuckBonus)} MATS</span>
                            <span class="event-mult-scope">Boss, Floor &amp; Wave Drops</span>
                        </div>
                    </div>
                </div>

                <div class="ev-mats-strip">
                    <span class="ev-mats-label">${this._ico('sparkle')} BOOSTED MATERIALS:</span>
                    <div class="ev-mats-list">${matChips}</div>
                </div>

                <div class="event-card-footer">
                    <span class="event-mode-tag">${this._ico('gamepad')} Active in Story, Endless, Olympus &amp; Co-op</span>
                    <span class="event-auto-tag">${this._ico('check')} Auto-Starts Dec 1 (00:00)</span>
                </div>
            </article>
        `;
    }

    static _renderBreakdownTab(ev, status) {
        const xpLbl = this.formatMultiplier(ev ? ev.xpMultiplier : 1.5);
        const goldLbl = this.formatMultiplier(ev ? ev.goldMultiplier : 2.0);
        const matLbl = this.formatPercentBonus(ev ? ev.materialLuckBonus : 0.35);
        const stateTag = status === 'live' ? 'ACTIVE' : (status === 'upcoming' ? 'STARTS DEC 1' : 'STANDARD');

        const rows = [
            { icon: 'coin', cls: 'is-gold', title: 'Match End Gold', normal: 'Waves + Kills + Bosses', boosted: `${goldLbl} Gold (Stacks w/ Perks &amp; Gear)` },
            { icon: 'bag_gold', cls: 'is-gold', title: 'Arena Coin Pouches', normal: '20 Coins base pouch', boosted: '40 Coins base pouch (Co-op &amp; Solo)' },
            { icon: 'bolt', cls: 'is-xp', title: 'Account Level XP', normal: 'Waves, Kills &amp; Boss XP', boosted: `${xpLbl} Account XP (150% rate)` },
            { icon: 'crown', cls: 'is-xp', title: 'Battle Pass Match XP', normal: '+2 Kill / +35 Wave XP', boosted: '+3 Kill / +38 Mini-Boss / +68 Boss / +53 Wave' },
            { icon: 'mat_armory_shards', cls: 'is-mats', title: 'Boss &amp; Floor Materials', normal: 'Perk Luck (+0–15%)', boosted: `${matLbl} Bonus Drop Chance (50% w/ Alchemist!)` },
            { icon: 'mat_mati_crystal', cls: 'is-mats', title: 'Wave Enemy Material Drops', normal: 'Story W10+ / Endless W12+', boosted: 'Unlocks earlier (Story W6+ / Endless W8+) + 1.35x rate' }
        ];

        return `
            <div class="ev-breakdown-header">
                <span>HOW LAUNCH EVENT MULTIPLIERS APPLY</span>
                <span class="ev-state-chip is-${status}">${stateTag}</span>
            </div>
            <div class="ev-breakdown-list">
                ${rows.map((r) => `
                    <div class="ev-break-row ${r.cls}">
                        <span class="ev-break-ico">${this._ico(r.icon, 'ui-icon ui-icon-sm')}</span>
                        <div class="ev-break-main">
                            <div class="ev-break-title">${r.title}</div>
                            <div class="ev-break-sub">Normal: <span>${r.normal}</span> → Event: <strong>${r.boosted}</strong></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    static _renderScheduleTab(ev, status) {
        const phases = [
            {
                key: status === 'upcoming' ? 'active' : 'done',
                tag: 'NOW – NOV 30, 2026',
                title: 'Pre-Launch Prep Window',
                desc: 'Level up your heroes, unlock Battle Perks, and save Ascent Crests ahead of Release Day.'
            },
            {
                key: status === 'live' ? 'active' : (status === 'ended' ? 'done' : 'next'),
                tag: 'DEC 1 – DEC 7, 2026',
                title: 'Launch Week Celebration (7 Days)',
                desc: 'Automatic 1.5x XP, 2.0x Gold, and +35% Material Drops across Story, Endless, Mt. Olympus &amp; Co-op.'
            },
            {
                key: status === 'ended' ? 'active' : 'next',
                tag: 'DEC 8, 2026+',
                title: 'Post-Launch Standard Season',
                desc: 'Event multipliers return to 1.0x while all earned Gold, XP, Gear, and Materials remain permanently saved.'
            }
        ];

        return `
            <div class="ev-schedule-list">
                ${phases.map((p) => `
                    <div class="ev-phase-card is-${p.key}">
                        <div class="ev-phase-top">
                            <span class="ev-phase-tag">${p.tag}</span>
                            <span class="ev-phase-badge">${p.key === 'active' ? 'CURRENT' : (p.key === 'done' ? 'COMPLETE' : 'SCHEDULED')}</span>
                        </div>
                        <h4 class="ev-phase-title">${p.title}</h4>
                        <p class="ev-phase-desc">${p.desc}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => EventManager.initUI());
    } else {
        EventManager.initUI();
    }
}

if (typeof window !== 'undefined') {
    window.EventManager = EventManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EventManager };
}
