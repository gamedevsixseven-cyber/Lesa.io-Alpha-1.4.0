/**
 * Lesa.io - Clans & Guild Hall Comic-Arcade View Renderer (V1.1.0 Phase 2)
 * Native warm cream parchment UI matching Events, Chests, and Armory styling.
 */

class ClanCardRenderer {
    static esc(str) {
        return String(str == null ? '' : str).replace(/[&<>"']/g, (ch) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[ch]));
    }

    static ico(name, fallback = '') {
        return (typeof UiIcons !== 'undefined') ? UiIcons.i(name, 'ui-icon-sm') : fallback;
    }

    static getAvatar(heroId) {
        if (typeof FRIEND_HERO_AVATARS !== 'undefined' && FRIEND_HERO_AVATARS[heroId]) {
            return FRIEND_HERO_AVATARS[heroId];
        }
        return 'assets/HeroesIcons/PsanasAvatar.png';
    }

    static buildModalMarkup() {
        const shieldLg = (typeof UiIcons !== 'undefined') ? UiIcons.i('shield', 'ui-icon-title') : '🛡️';
        const crestSm = this.ico('crest', '🏅');
        return `
            <div class="clans-panel">
                <div class="clans-header">
                    <div class="clans-title-row">
                        <h2 class="clans-title">${shieldLg} CLANS &amp; GUILD HALL</h2>
                        <span id="clans-crests-pill" class="clans-crest-pill">${crestSm} 0 CRESTS</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <button type="button" id="clans-sync-btn" class="clans-sync-btn">${this.ico('sync')} SYNC</button>
                        <button type="button" id="clans-close-btn" class="modal-close-x-btn" title="Close (Esc)" aria-label="Close">${this.ico('cross', '✕')}</button>
                    </div>
                </div>
                <div id="clans-hero-banner-slot"></div>
                <div id="clans-tabs-slot" class="clans-tabs"></div>
                <div id="clans-feedback" class="clans-feedback hidden"></div>
                <div id="clans-body" class="clans-body"></div>
            </div>
        `;
    }

    static renderTopBanner(clan, service) {
        if (!clan) {
            const gs = (typeof window !== 'undefined' && window.GameState && window.GameState.player) ? window.GameState.player : {};
            const coins = Math.floor(gs.coins || 0);
            const gems = Math.floor(gs.gems || 0);
            const cost = (typeof CLAN_CREATE_COST !== 'undefined') ? CLAN_CREATE_COST : { coins: 1000000, gems: 1000 };
            return `
                <div class="clan-hero-banner" style="background: linear-gradient(135deg, #2b3a55 0%, #1e272e 100%);">
                    <div class="clan-hero-left">
                        <div class="clan-emblem-badge" style="background: linear-gradient(180deg, #fed330, #e67e22);">
                            ${this.ico('shield', '🛡️')}
                        </div>
                        <div class="clan-hero-meta">
                            <div class="clan-name-line"><span class="clan-hero-name">NO CLAN JOINED YET</span></div>
                            <div class="clan-motto-line">Join an active squad or pay 1,000,000 Coins + 1,000 Gems to found your Clan!</div>
                        </div>
                    </div>
                    <div class="clan-hero-stats">
                        <div class="clan-cost-chip ${coins >= cost.coins ? 'ok' : 'short'}">${this.ico('coin', '🪙')} ${coins.toLocaleString()} / ${cost.coins.toLocaleString()}</div>
                        <div class="clan-cost-chip ${gems >= cost.gems ? 'ok' : 'short'}">${this.ico('gem', '💎')} ${gems.toLocaleString()} / ${cost.gems.toLocaleString()}</div>
                    </div>
                </div>
            `;
        }

        const emblem = ClanConfigHelper.getEmblem(clan.emblemId);
        const theme = ClanConfigHelper.getColorTheme(clan.colorId);
        const lvlInfo = ClanConfigHelper.getLevelFromXp(clan.xp || 0);
        const maxMem = ClanConfigHelper.getMaxMembersForLevel(lvlInfo.level);
        const memCount = Object.keys(clan.members || {}).length || clan.memberCount || 1;
        const me = service ? service.getMyPlayerMeta() : { uid: '' };
        const myMem = (clan.members || {})[me.uid] || {};
        const xpLine = lvlInfo.nextReq
            ? `${lvlInfo.xp.toLocaleString()} / ${lvlInfo.nextReq.toLocaleString()} XP to Lv.${lvlInfo.level + 1} (${lvlInfo.pct}%)`
            : `${lvlInfo.xp.toLocaleString()} XP • MAX CLAN LEVEL`;

        return `
            <div class="clan-hero-banner" style="background: linear-gradient(135deg, ${theme.secondary} 0%, ${theme.primary} 160%);">
                <div class="clan-hero-left">
                    <div class="clan-emblem-badge" style="background: linear-gradient(180deg, ${theme.primary}, ${theme.secondary});">
                        ${this.ico(emblem.iconKey, emblem.fallback)}
                    </div>
                    <div class="clan-hero-meta">
                        <div class="clan-name-line">
                            <span class="clan-tag-badge">[${this.esc(clan.tag)}]</span>
                            <span class="clan-hero-name">${this.esc(clan.name)}</span>
                            <span class="clan-lvl-pill">LV.${lvlInfo.level}</span>
                        </div>
                        <div class="clan-motto-line">"${this.esc(clan.motto || 'Forged in Lesa.io')}"</div>
                        <div class="clan-xp-wrap">
                            <div class="clan-xp-bar-bg"><div class="clan-xp-bar-fill" style="width:${lvlInfo.pct}%"></div></div>
                            <div class="clan-xp-text">${xpLine}</div>
                        </div>
                    </div>
                </div>
                <div class="clan-hero-stats">
                    <div class="clan-mini-stat"><small>MEMBERS</small><strong>${memCount}/${maxMem}</strong></div>
                    <div class="clan-mini-stat"><small>MY WEEK</small><strong>${(myMem.weeklyContrib || 0).toLocaleString()}</strong></div>
                    <div class="clan-mini-stat"><small>TOTAL PTS</small><strong>${(myMem.contributedPoints || 0).toLocaleString()}</strong></div>
                </div>
            </div>
        `;
    }

    static renderTabs(clan, activeTab) {
        const clanUnread = (typeof window !== 'undefined' && window.chatService) ? window.chatService.getClanUnread() : 0;
        const tabs = clan
            ? [
                ['overview', 'temple', 'OVERVIEW'],
                ['chat', 'chat', 'CHAT', clanUnread],
                ['vault', 'crate', 'VAULT'],
                ['bounties', 'swords', 'BOUNTIES'],
                ['shop', 'cart', 'SHOP'],
                ['roster', 'people', 'ROSTER'],
                ['top_clans', 'trophy', 'RANKINGS']
            ]
            : [
                ['browse', 'search', 'BROWSE'],
                ['create', 'plus', 'CREATE'],
                ['top_clans', 'trophy', 'RANKINGS'],
                ['bounties_preview', 'swords', 'BOUNTIES']
            ];
        return tabs.map(([id, icon, label, badgeCount]) => `
            <button type="button" class="clan-tab-btn ${activeTab === id ? 'active' : ''}" data-clan-tab="${id}">
                ${this.ico(icon, '')} ${label}${badgeCount > 0 ? `<span class="clan-tab-badge">${badgeCount > 9 ? '9+' : badgeCount}</span>` : ''}
            </button>
        `).join('');
    }

    static renderCreatePreviewBanner(draft) {
        const emblem = ClanConfigHelper.getEmblem(draft.emblemId);
        const theme = ClanConfigHelper.getColorTheme(draft.colorId);
        const tagText = (draft.tag || 'TAG').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'TAG';
        const nameText = (draft.name || '').trim() || 'Your New Clan';
        return `
            <div class="clan-hero-banner" style="background: linear-gradient(135deg, ${theme.secondary} 0%, ${theme.primary} 160%); margin-bottom:10px;">
                <div class="clan-hero-left">
                    <div class="clan-emblem-badge" style="background: linear-gradient(180deg, ${theme.primary}, ${theme.secondary});">
                        ${this.ico(emblem.iconKey, emblem.fallback)}
                    </div>
                    <div class="clan-hero-meta">
                        <div class="clan-name-line">
                            <span class="clan-tag-badge">[${this.esc(tagText)}]</span>
                            <span class="clan-hero-name">${this.esc(nameText)}</span>
                            <span class="clan-lvl-pill">LV.1</span>
                        </div>
                        <div class="clan-motto-line">"${this.esc((draft.motto || '').trim() || 'Forged in Lesa.io • No Leeches Allowed')}"</div>
                    </div>
                </div>
            </div>
        `;
    }

    static renderCreateTab(draft) {
        const gs = (typeof window !== 'undefined' && window.GameState && window.GameState.player) ? window.GameState.player : {};
        const coins = Math.floor(gs.coins || 0);
        const gems = Math.floor(gs.gems || 0);
        const cost = CLAN_CREATE_COST;
        const canAfford = coins >= cost.coins && gems >= cost.gems;
        const emblemBtns = CLAN_EMBLEMS.map(e => `
            <button type="button" class="clan-emblem-opt ${draft.emblemId === e.id ? 'active' : ''}" data-pick-emblem="${e.id}" title="${this.esc(e.name)}">${this.ico(e.iconKey, e.fallback)}</button>
        `).join('');
        const colorBtns = CLAN_COLOR_THEMES.map(c => `
            <button type="button" class="clan-color-opt ${draft.colorId === c.id ? 'active' : ''}" data-pick-color="${c.id}" title="${this.esc(c.name)}" style="background:${c.primary};"></button>
        `).join('');

        return `
            <div id="clan-create-preview-slot">${this.renderCreatePreviewBanner(draft)}</div>
            <div class="clan-create-grid">
                <div class="clan-card">
                    <label class="clan-field-label" for="clan-input-name">Clan Name (3–20 chars)</label>
                    <input id="clan-input-name" class="clan-input" maxlength="20" placeholder="e.g. Spartan Souvlaki" value="${this.esc(draft.name)}">
                    <label class="clan-field-label" for="clan-input-tag">Clan Tag (3–4 Letters/Digits)</label>
                    <input id="clan-input-tag" class="clan-input" maxlength="4" style="text-transform:uppercase;" placeholder="e.g. SPQR" value="${this.esc(draft.tag)}">
                    <label class="clan-field-label" for="clan-input-motto">Clan Motto</label>
                    <input id="clan-input-motto" class="clan-input" maxlength="72" placeholder="Forged in Lesa.io • No Leeches Allowed" value="${this.esc(draft.motto)}">
                    <label class="clan-field-label">Recruitment Mode</label>
                    <div class="clan-picker-row">
                        <button type="button" class="clan-tab-btn ${draft.joinMode === 'open' ? 'active' : ''}" data-pick-join="open">${this.ico('unlock')} OPEN</button>
                        <button type="button" class="clan-tab-btn ${draft.joinMode === 'request' ? 'active' : ''}" data-pick-join="request">${this.ico('mail')} REQUEST</button>
                    </div>
                </div>
                <div class="clan-card" style="display:flex;flex-direction:column;justify-content:space-between;">
                    <div>
                        <label class="clan-field-label">Clan Emblem</label>
                        <div class="clan-picker-row">${emblemBtns}</div>
                        <label class="clan-field-label" style="margin-top:9px;">Banner Color</label>
                        <div class="clan-picker-row">${colorBtns}</div>
                        <label class="clan-field-label" style="margin-top:10px;">Founding Charter Cost</label>
                        <div class="clan-cost-row">
                            <span class="clan-cost-chip ${coins >= cost.coins ? 'ok' : 'short'}">${this.ico('coin', '🪙')} 1,000,000 Coins</span>
                            <span class="clan-cost-chip ${gems >= cost.gems ? 'ok' : 'short'}">${this.ico('gem', '💎')} 1,000 Gems</span>
                        </div>
                    </div>
                    <button type="button" id="clan-submit-create-btn" class="clan-btn-green" ${canAfford ? '' : 'disabled'}>⚒️ FOUND CLAN NOW</button>
                </div>
            </div>
        `;
    }

    static renderBrowseCards(clans, query, inClan, showRanks = false) {
        const q = (query || '').trim().toLowerCase();
        const filtered = (clans || []).filter(c => !q || (c.name || '').toLowerCase().includes(q) || (c.tag || '').toLowerCase().includes(q));
        if (filtered.length === 0) {
            return `<div class="clan-card" style="text-align:center;padding:24px;"><strong>NO CLANS MATCHED</strong><div style="font-size:12px;color:#64748b;margin-top:4px;">Found your own Clan or clear your search filter!</div></div>`;
        }
        return filtered.map((c, idx) => {
            const em = ClanConfigHelper.getEmblem(c.emblemId);
            const th = ClanConfigHelper.getColorTheme(c.colorId);
            const lv = ClanConfigHelper.getLevelFromXp(c.xp || 0);
            const maxM = ClanConfigHelper.getMaxMembersForLevel(lv.level);
            const cnt = c.memberCount || Object.keys(c.members || {}).length || 1;
            const full = cnt >= maxM;
            const rankChip = showRanks ? `<span class="clan-tag-badge" style="background:#1e272e;color:#fed330;">#${idx + 1}</span>` : '';
            const actionBtn = inClan
                ? `<span class="clan-lvl-pill">LV.${lv.level}</span>`
                : `<button type="button" class="clan-btn-gold" style="padding:5px 11px;font-size:0.78rem;" data-join-clan="${this.esc(c.id)}" ${full ? 'disabled' : ''}>${full ? 'FULL' : (c.joinMode === 'request' ? 'APPLY' : 'JOIN')}</button>`;
            return `
                <div class="clan-member-row">
                    <div class="clan-member-left">
                        ${rankChip}
                        <div class="clan-emblem-badge" style="width:42px;height:42px;background:linear-gradient(180deg,${th.primary},${th.secondary});">
                            ${this.ico(em.iconKey, em.fallback)}
                        </div>
                        <div>
                            <div class="clan-name-line">
                                <span class="clan-tag-badge" style="font-size:0.78rem;">[${this.esc(c.tag)}]</span>
                                <strong style="color:#1e272e;">${this.esc(c.name)}</strong>
                                <span class="clan-lvl-pill">LV.${lv.level}</span>
                            </div>
                            <div style="font-size:11px;color:#475569;font-weight:700;">${cnt}/${maxM} Members • ${(c.xp || 0).toLocaleString()} XP</div>
                        </div>
                    </div>
                    <div>${actionBtn}</div>
                </div>
            `;
        }).join('');
    }

    static renderBrowseTab(clans, query, inClan, showRanks = false) {
        const cards = this.renderBrowseCards(clans, query, inClan, showRanks);
        return `
            <div style="display:flex;gap:8px;margin-bottom:10px;">
                <input id="clan-browse-search" class="clan-input" placeholder="Search Clan Name or [TAG]..." value="${this.esc(query || '')}">
                <button type="button" id="clan-browse-refresh-btn" class="clan-btn-blue">SEARCH</button>
            </div>
            <div id="clan-browse-list">${cards}</div>
        `;
    }

    static renderOverviewTab(clan, service) {
        const lv = ClanConfigHelper.getLevelFromXp(clan.xp || 0).level;
        const me = service.getMyPlayerMeta();
        const isLeader = clan.leaderUid === me.uid;
        const coopSynergy = typeof ClanBuffs !== 'undefined' && ClanBuffs.isCoopClanmate();
        const perksHtml = CLAN_LEVEL_PERKS.map(p => {
            const curVal = p.values[Math.min(p.values.length - 1, lv - 1)];
            const maxVal = p.values[p.values.length - 1];
            const bonusTxt = (coopSynergy && (p.key === 'war_banner' || p.key === 'stamina_reserve')) ? ' (+5% CO-OP)' : '';
            return `
                <div class="clan-card">
                    <div class="donate-top">
                        <div class="donate-name">${this.ico(p.iconKey, '⚔️')} ${this.esc(p.name)}</div>
                        <span class="clan-buff-pill ${bonusTxt ? 'coop' : ''}">+${curVal}${p.unit}${bonusTxt}</span>
                    </div>
                    <div style="font-size:11.5px;color:#475569;font-weight:700;margin-top:4px;">${this.esc(p.desc)} (Max +${maxVal}${p.unit})</div>
                </div>
            `;
        }).join('');

        const wc = typeof ClanBuffs !== 'undefined' ? ClanBuffs.getWeeklyChestState(service) : null;
        const wcBtn = wc ? (wc.alreadyClaimed ? `<span class="clan-buff-pill">✅ CLAIMED THIS WEEK</span>`
            : `<button type="button" id="clan-claim-weekly-chest-btn" class="clan-btn-gold" ${wc.canClaim ? '' : 'disabled'}>${wc.isSundayUtc ? '🎁 CLAIM WEEKLY CHEST' : 'SUNDAY UTC ONLY'}</button>`) : '';
        const wcHtml = wc ? `
            <div class="bounty-card is-complete" style="margin-bottom:10px;">
                <div class="bounty-head">
                    <div class="bounty-title">${this.ico('crate', '📦')} SUNDAY CLAN WAR CHEST: ${this.esc(wc.tier.name)}</div>
                    ${wcBtn}
                </div>
                <div class="bounty-foot">
                    <span>Weekly Bounties Done: ${wc.completedCount}/4 • Reward: ${wc.tier.chestType.toUpperCase()} Chest + ${wc.tier.gemsBonus} Gems + ${wc.tier.crestsBonus} Crests</span>
                    <span>Req: ${wc.myPts}/${wc.tier.minWeeklyPts} Weekly Pts</span>
                </div>
            </div>
        ` : '';

        const logs = (clan.activityLog || []).slice(0, 6).map(line => `<div style="padding:4px 0;border-bottom:1px solid #e2e8f0;font-size:12px;color:#334155;font-weight:700;">• ${this.esc(line)}</div>`).join('');

        return `
            ${wcHtml}
            <div class="clan-section-head"><span>ACTIVE CLAN BUFFS (LIVE IN COMBAT)</span><span class="clan-section-sub">${coopSynergy ? '🤝 CLANMATE CO-OP +5% ACTIVE!' : 'Squad with a Clanmate in Co-op for +5%!'}</span></div>
            <div class="clan-grid-2" style="margin-bottom:10px;">${perksHtml}</div>
            ${isLeader ? `
                <div class="clan-card" style="margin-bottom:10px;">
                    <div class="clan-field-label" style="margin-top:0;">Leader Motto &amp; Noticeboard</div>
                    <div style="display:flex;gap:8px;">
                        <input id="clan-motto-edit" class="clan-input" maxlength="72" value="${this.esc(clan.motto || '')}">
                        <button type="button" id="clan-save-motto-btn" class="clan-btn-green">SAVE</button>
                    </div>
                </div>
            ` : ''}
            <div class="clan-card"><div class="clan-section-head" style="margin-top:0;">RECENT CLAN LOG</div>${logs || '<div style="font-size:12px;color:#64748b;">No recent activity yet.</div>'}</div>
        `;
    }

    static renderVaultTab(clan, service) {
        const vault = clan.vault || {};
        const resetIn = ClanConfigHelper.formatTimeUntilNextUtcDay();
        const gs = (typeof window !== 'undefined' && window.GameState && window.GameState.player) ? window.GameState.player : {};
        const inv = (typeof window !== 'undefined' && window.inventoryManager) ? window.inventoryManager : null;
        const poolTiles = CLAN_VAULT_RESOURCES.map(r => `<div class="vault-pool-tile"><div>${this.ico(r.iconKey, '')}</div><strong>${(vault[r.id] || 0).toLocaleString()}</strong><span>${this.esc(r.shortName)} Vaulted</span></div>`).join('');
        const cards = CLAN_VAULT_RESOURCES.map(r => {
            const donated = service.getDonatedToday(r.id);
            const rem = Math.max(0, r.dailyCap - donated);
            const pct = Math.min(100, Math.round((donated / r.dailyCap) * 100));
            const owned = r.kind === 'currency' ? Math.floor(gs.coins || 0) : (inv ? inv.getMaterialCount(r.id) : 0);
            const maxUsable = Math.min(rem, Math.floor(owned / r.unitAmount) * r.unitAmount);
            return `
                <div class="donate-card">
                    <div class="donate-top"><div class="donate-name">${this.ico(r.iconKey, '')} ${this.esc(r.name)}</div><div class="donate-wallet">Own: ${owned.toLocaleString()}</div></div>
                    <div style="display:flex;justify-content:space-between;font-size:11.5px;font-weight:800;color:#475569;"><span>Daily Cap: ${donated.toLocaleString()} / ${r.dailyCap.toLocaleString()}</span><span style="color:${r.color};">+${r.xpPerUnit} XP / ${r.unitAmount.toLocaleString()}</span></div>
                    <div class="donate-cap-bar"><div class="donate-cap-fill" style="width:${pct}%;background:${r.color};"></div></div>
                    <div class="donate-actions">
                        <button type="button" class="clan-btn-gold" data-donate-res="${r.id}" data-donate-qty="${r.stepSmall}" ${(owned < r.stepSmall || rem < r.stepSmall) ? 'disabled' : ''}>+${r.stepSmall.toLocaleString()}</button>
                        <button type="button" class="clan-btn-gold" data-donate-res="${r.id}" data-donate-qty="${r.stepLarge}" ${(owned < r.stepLarge || rem < r.stepLarge) ? 'disabled' : ''}>+${r.stepLarge.toLocaleString()}</button>
                        <button type="button" class="clan-btn-blue" data-donate-res="${r.id}" data-donate-qty="${maxUsable}" ${maxUsable < r.unitAmount ? 'disabled' : ''}>MAX</button>
                    </div>
                </div>
            `;
        }).join('');
        return `<div class="clan-section-head"><span>CLAN TAX VAULT TREASURY</span><span class="clan-section-sub">Daily Reset: ${resetIn}</span></div><div class="vault-pool-bar">${poolTiles}</div><div class="clan-section-head"><span>DAILY CONTRIBUTION CAPS</span><span class="clan-section-sub">Anti-Whale Limits</span></div><div class="clan-grid-2">${cards}</div>`;
    }

    static renderBountiesTab(clan, service, isPreview = false) {
        const weekKey = ClanConfigHelper.getIsoWeekKey();
        const resetIn = ClanConfigHelper.formatTimeUntilNextMonday();
        const weekProg = (clan && clan.bounties && clan.bounties[weekKey]) ? clan.bounties[weekKey] : {};
        const claimed = (service && service.claimedBounties && service.claimedBounties[weekKey]) || [];
        const me = service ? service.getMyPlayerMeta() : { uid: '' };
        const myWeeklyPts = (clan && clan.members && clan.members[me.uid] && clan.members[me.uid].weeklyContrib) || 0;
        const cards = CLAN_WEEKLY_BOUNTIES.map(b => {
            const cur = Math.min(b.target, Math.floor(weekProg[b.id] || 0));
            const pct = Math.min(100, Math.round((cur / b.target) * 100));
            const done = cur >= b.target;
            const isClaimed = claimed.includes(b.id);
            const eligible = myWeeklyPts >= b.minContribToClaim;
            let actionHtml = isPreview ? `Join a Clan to track progress`
                : isClaimed ? `<span style="color:#15803d;font-weight:900;">✅ CLAIMED</span>`
                : !done ? `${cur.toLocaleString()} / ${b.target.toLocaleString()} (${pct}%)`
                : eligible ? `<button type="button" class="clan-btn-green" style="padding:4px 12px;font-size:0.78rem;" data-claim-bounty="${b.id}">🎁 CLAIM</button>`
                : `<span style="color:#b91c1c;">Need ${b.minContribToClaim} Weekly Pts (${myWeeklyPts}/${b.minContribToClaim})</span>`;
            return `
                <div class="bounty-card ${done ? 'is-complete' : ''}">
                    <div class="bounty-head"><div class="bounty-title">${this.ico(b.iconKey, '⚔️')} ${this.esc(b.title)}</div><div class="bounty-reward-pill">+${b.rewardXp.toLocaleString()} XP • +${b.rewardCrests} Crests</div></div>
                    <div style="font-size:12px;color:#475569;font-weight:700;">${this.esc(b.desc)}</div>
                    <div class="bounty-prog-bar"><div class="bounty-prog-fill" style="width:${pct}%;background:${b.color};"></div></div>
                    <div class="bounty-foot"><span>Min Weekly Pts: ${b.minContribToClaim}</span><span>${actionHtml}</span></div>
                </div>
            `;
        }).join('');
        return `<div class="clan-section-head"><span>SHARED WEEKLY BOUNTIES (${weekKey})</span><span class="clan-section-sub">Monday Reset: ${resetIn}</span></div>${cards}`;
    }

    static renderShopTab(service) {
        const crests = service ? (service.honorCrests || 0) : 0;
        const cards = CLAN_SHOP_ITEMS.map(it => {
            const ownedBanner = it.kind === 'banner' && typeof ClanBuffs !== 'undefined' && ClanBuffs.hasBanner(it.bannerId);
            const btnHtml = ownedBanner
                ? `<span class="clan-buff-pill">OWNED</span>`
                : `<button type="button" class="clan-btn-gold" data-buy-shop="${it.id}" ${crests < it.cost ? 'disabled' : ''}>${this.ico('crest', '🏅')} ${it.cost}</button>`;
            const previewHtml = it.kind === 'banner'
                ? `<div class="cos-banner-preview ${this.esc(it.cssClass || '')}" style="width:58px;height:40px;border-radius:10px;border:2.5px solid #1e272e;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${this.ico(it.bannerId === 'banner_clan_obsidian' ? 'crown' : 'shield', '🛡️')}</div>`
                : `<img src="${this.esc(it.iconImg)}" class="clan-shop-img" alt="">`;
            return `
                <div class="clan-shop-card">
                    <div class="clan-shop-left">
                        ${previewHtml}
                        <div>
                            <div style="font-weight:900;color:#1e272e;font-size:13.5px;">${this.esc(it.name)}</div>
                            <div style="font-size:11px;color:#475569;font-weight:700;">${this.esc(it.desc)}</div>
                        </div>
                    </div>
                    <div style="flex-shrink:0;">${btnHtml}</div>
                </div>
            `;
        }).join('');
        return `<div class="clan-section-head"><span>CLAN HONOR CREST SHOP</span><span class="clan-section-sub">Earn Crests via Weekly Bounties &amp; Sunday Chest</span></div><div class="clan-grid-2">${cards}</div>`;
    }

    static renderRosterTab(clan, service, confirmLeave, confirmTransferUid) {
        const me = service.getMyPlayerMeta();
        const myMem = (clan.members && clan.members[me.uid]) || { role: 'member' };
        const myRank = ClanConfigHelper.getRoleRank(myMem.role);
        const canReview = myRank >= 2;
        const list = Object.values(clan.members || {}).sort((a, b) => (ClanConfigHelper.getRoleRank(b.role) - ClanConfigHelper.getRoleRank(a.role)) || ((b.contributedPoints || 0) - (a.contributedPoints || 0)));
        const reqs = Object.values(clan.joinRequests || {});

        const reqHtml = (canReview && reqs.length > 0) ? `
            <div class="clan-section-head"><span>PENDING JOIN REQUESTS (${reqs.length})</span></div>
            ${reqs.map(r => `
                <div class="clan-member-row" style="background:#fef9c3;">
                    <div class="clan-member-left"><img class="clan-mem-avatar" src="${this.getAvatar(r.hero)}" alt=""><div><strong>${this.esc(r.name)}</strong> <span class="clan-lvl-pill">Lv.${r.level || 1}</span></div></div>
                    <div class="clan-mem-actions">
                        <button type="button" class="clan-btn-green" data-req-accept="${this.esc(r.uid)}">ACCEPT</button>
                        <button type="button" class="clan-btn-red" data-req-decline="${this.esc(r.uid)}">✕</button>
                    </div>
                </div>
            `).join('')}
        ` : '';

        const memHtml = list.map(m => {
            const rMeta = ClanConfigHelper.getRoleMeta(m.role);
            const tRank = rMeta.rank;
            const isSelf = m.uid === me.uid;
            let btns = '';
            if (!isSelf && myRank >= 3 && myRank > tRank) {
                if (tRank + 1 < myRank) btns += `<button type="button" class="clan-btn-green" data-promote-uid="${this.esc(m.uid)}" title="Promote Role">⬆ PROMOTE</button>`;
                if (tRank > 1) btns += `<button type="button" class="clan-btn-gold" data-demote-uid="${this.esc(m.uid)}" title="Demote Role">⬇ DEMOTE</button>`;
                if (myRank === 4) btns += `<button type="button" class="clan-btn-blue" data-transfer-uid="${this.esc(m.uid)}" title="Pass Clan Leadership">${confirmTransferUid === m.uid ? 'CONFIRM 👑' : '👑 LEADER'}</button>`;
                btns += `<button type="button" class="clan-btn-red" data-kick-uid="${this.esc(m.uid)}">KICK</button>`;
            }
            return `
                <div class="clan-member-row">
                    <div class="clan-member-left">
                        <img class="clan-mem-avatar" src="${this.getAvatar(m.hero)}" alt="">
                        <div>
                            <div class="clan-name-line">
                                <strong style="color:#1e272e;">${this.esc(m.name)}${isSelf ? ' (YOU)' : ''}</strong>
                                <span class="clan-role-badge" style="background:${rMeta.color};color:${rMeta.text};">${rMeta.icon} ${rMeta.label}</span>
                                <span style="font-size:11px;font-weight:800;color:#475569;">Lv.${m.level || 1}</span>
                            </div>
                            <div style="font-size:11px;color:#64748b;font-weight:700;">Week: ${(m.weeklyContrib || 0).toLocaleString()} pts • Total: ${(m.contributedPoints || 0).toLocaleString()} pts</div>
                        </div>
                    </div>
                    <div class="clan-mem-actions">${btns}</div>
                </div>
            `;
        }).join('');

        return `${reqHtml}<div class="clan-section-head"><span>CLAN ROSTER (${list.length})</span><button type="button" id="clan-leave-btn" class="clan-btn-red">${confirmLeave ? '⚠️ CONFIRM LEAVE (24H)' : 'LEAVE CLAN'}</button></div>${memHtml}`;
    }
}

if (typeof window !== 'undefined') window.ClanCardRenderer = ClanCardRenderer;
