/**
 * Lesa.io - Clans & Guild Hall Modal Controller (V1.1.0 Phase 2)
 * Handles Role Promotions/Demotions/Leadership Transfers, Honor Crest Shop,
 * Weekly Clan War Chest claims, Vault donations, Shared Bounties, and Browse/Create.
 */

class ClansModal {
    constructor(clanService) {
        this.service = clanService;
        this.activeTab = null;
        this.browseQuery = '';
        this.feedback = { msg: '', isError: false };
        this.confirmLeave = false;
        this.confirmTransferUid = null;
        this.draft = { name: '', tag: '', motto: '', emblemId: 'spartan_shield', colorId: 'crimson', joinMode: 'open' };
        this._lastRenderedTab = null;
        this.modal = null;

        if (typeof ChatService !== 'undefined') ChatService.boot();
        this.ensureMarkup();
        this.bindStaticEvents();
        this.updateBadge();
    }

    ensureMarkup() {
        let el = document.getElementById('clans-modal');
        if (!el) {
            el = document.createElement('div');
            el.id = 'clans-modal';
            el.className = 'modal-overlay hidden';
            el.innerHTML = (typeof ClanCardRenderer !== 'undefined') ? ClanCardRenderer.buildModalMarkup() : '';
            document.body.appendChild(el);
        }
        this.modal = el;
    }

    bindStaticEvents() {
        document.getElementById('clans-close-btn')?.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playGoBack();
            this.hide();
        });
        this.modal?.addEventListener('click', (e) => { if (e.target === this.modal) this.hide(); });

        const syncBtn = document.getElementById('clans-sync-btn');
        if (syncBtn && this.service) {
            syncBtn.addEventListener('click', async () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                const syncIco = typeof ClanCardRenderer !== 'undefined' ? ClanCardRenderer.ico('sync') : '↻';
                syncBtn.innerHTML = `${syncIco} ...`;
                await this.service.flushPendingBounties();
                if (typeof this.service.refreshActiveClan === 'function') await this.service.refreshActiveClan();
                await this.service.fetchBrowseClans();
                syncBtn.innerHTML = `${syncIco} SYNC`;
                this.render();
            });
        }

        document.getElementById('clans-tabs-slot')?.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-clan-tab]');
            if (!btn) return;
            if (window.soundEngine) window.soundEngine.playSelect();
            this.activeTab = btn.dataset.clanTab;
            this.confirmLeave = false;
            this.confirmTransferUid = null;
            this.clearFeedback();
            this._syncChatOpenState();
            this.render();
            if ((this.activeTab === 'browse' || this.activeTab === 'top_clans') && this.service) this.service.fetchBrowseClans();
        });

        const body = document.getElementById('clans-body');
        if (body) {
            body.addEventListener('input', (e) => this._handleBodyInput(e));
            body.addEventListener('click', (e) => this._handleBodyClick(e));
        }

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal && !this.modal.classList.contains('hidden')) this.hide();
        });

        if (typeof window !== 'undefined' && window.EventBus) {
            const refreshIfOpen = () => {
                this.updateBadge();
                if (!this.modal || this.modal.classList.contains('hidden')) return;
                if (this.activeTab === 'chat' && document.getElementById('clan-chat-messages')) {
                    const tabsSlot = document.getElementById('clans-tabs-slot');
                    if (tabsSlot && typeof ClanCardRenderer !== 'undefined') tabsSlot.innerHTML = ClanCardRenderer.renderTabs(this.service.currentClan, this.activeTab);
                    if (typeof ClanChatView !== 'undefined' && window.chatService) ClanChatView.paintMessages(window.chatService);
                    return;
                }
                this.render();
            };
            window.EventBus.on('clansUpdated', refreshIfOpen);
            window.EventBus.on('socialChatUpdated', refreshIfOpen);
            window.EventBus.on('currencyChanged', refreshIfOpen);
            window.EventBus.on('materialsUpdated', refreshIfOpen);
        }
    }

    updateBadge() {
        const badge = document.getElementById('clans-badge');
        const btn = document.getElementById('btn-clans');
        if (!badge) return;
        const unread = (typeof window !== 'undefined' && window.chatService) ? window.chatService.getClanUnread() : 0;
        badge.textContent = unread > 9 ? '9+' : String(unread);
        badge.classList.toggle('hidden', unread <= 0);
        if (btn) btn.classList.toggle('has-notif', unread > 0);
    }

    _syncChatOpenState() {
        if (typeof window === 'undefined' || !window.chatService) return;
        const open = !!(this.modal && !this.modal.classList.contains('hidden') && this.activeTab === 'chat' && this.service && this.service.currentClan);
        window.chatService.setClanChatOpen(open);
    }

    setFeedback(msg, isError = false) {
        this.feedback = { msg: String(msg || ''), isError: !!isError };
        const bar = document.getElementById('clans-feedback');
        if (!bar) return;
        bar.textContent = this.feedback.msg;
        bar.classList.toggle('hidden', !this.feedback.msg);
        bar.classList.toggle('is-error', this.feedback.isError);
    }

    clearFeedback() { this.setFeedback('', false); }

    async show() {
        this.ensureMarkup();
        this.confirmLeave = false;
        this.confirmTransferUid = null;
        this.clearFeedback();
        if (this.service) {
            await this.service.syncMyClanMembership();
            if (this.service.clanId && !this.service.currentClan && typeof this.service.refreshActiveClan === 'function') {
                await this.service.refreshActiveClan();
            }
            this.service.bindClanListener();
            this.service.flushPendingBounties();
            if (!this.service.currentClan) this.service.fetchBrowseClans();
        }
        const clan = this.service ? this.service.currentClan : null;
        this.activeTab = clan ? 'overview' : 'browse';
        this.modal.classList.remove('hidden');
        this._syncChatOpenState();
        this.render();
        if (this._clanPoll) clearInterval(this._clanPoll);
        this._clanPoll = setInterval(() => {
            if (this.modal && !this.modal.classList.contains('hidden') && this.service && this.service.clanId && typeof this.service.refreshActiveClan === 'function') {
                this.service.refreshActiveClan();
            }
        }, 15000);
    }

    hide() {
        if (this._clanPoll) { clearInterval(this._clanPoll); this._clanPoll = null; }
        if (this.modal) this.modal.classList.add('hidden');
        this.confirmLeave = false;
        this.confirmTransferUid = null;
        this._syncChatOpenState();
    }

    render() {
        if (!this.modal || !this.service || typeof ClanCardRenderer === 'undefined') return;
        const clan = this.service.currentClan;
        const validMemberTabs = ['overview', 'chat', 'vault', 'bounties', 'shop', 'roster', 'top_clans'];
        const validGuestTabs = ['browse', 'create', 'top_clans', 'bounties_preview'];
        if (clan && !validMemberTabs.includes(this.activeTab)) this.activeTab = 'overview';
        if (!clan && !validGuestTabs.includes(this.activeTab)) this.activeTab = 'browse';

        const crestsEl = document.getElementById('clans-crests-pill');
        if (crestsEl) crestsEl.innerHTML = `${ClanCardRenderer.ico('crest', '🏅')} ${(this.service.honorCrests || 0).toLocaleString()} CRESTS`;

        const bannerSlot = document.getElementById('clans-hero-banner-slot');
        if (bannerSlot) bannerSlot.innerHTML = ClanCardRenderer.renderTopBanner(clan, this.service);

        const tabsSlot = document.getElementById('clans-tabs-slot');
        if (tabsSlot) tabsSlot.innerHTML = ClanCardRenderer.renderTabs(clan, this.activeTab);

        const body = document.getElementById('clans-body');
        if (!body) return;
        const tabChanged = this._lastRenderedTab !== this.activeTab;
        this._lastRenderedTab = this.activeTab;
        const prevScroll = tabChanged ? 0 : body.scrollTop;
        const isChatTab = Boolean(clan && this.activeTab === 'chat' && typeof ClanChatView !== 'undefined');
        body.classList.toggle('is-chat-tab', isChatTab);

        if (!clan) {
            if (this.activeTab === 'create') body.innerHTML = ClanCardRenderer.renderCreateTab(this.draft);
            else if (this.activeTab === 'bounties_preview') body.innerHTML = ClanCardRenderer.renderBountiesTab(null, this.service, true);
            else body.innerHTML = ClanCardRenderer.renderBrowseTab(this.service.browseList, this.browseQuery, false, this.activeTab === 'top_clans');
        } else {
            if (isChatTab) { ClanChatView.render(body, clan, window.chatService, this); return; }
            if (this.activeTab === 'vault') body.innerHTML = ClanCardRenderer.renderVaultTab(clan, this.service);
            else if (this.activeTab === 'bounties') body.innerHTML = ClanCardRenderer.renderBountiesTab(clan, this.service, false);
            else if (this.activeTab === 'shop') body.innerHTML = ClanCardRenderer.renderShopTab(this.service);
            else if (this.activeTab === 'roster') body.innerHTML = ClanCardRenderer.renderRosterTab(clan, this.service, this.confirmLeave, this.confirmTransferUid);
            else if (this.activeTab === 'top_clans') body.innerHTML = ClanCardRenderer.renderBrowseTab(this.service.browseList, this.browseQuery, true, true);
            else body.innerHTML = ClanCardRenderer.renderOverviewTab(clan, this.service);
        }
        body.scrollTop = prevScroll;
    }

    _handleBodyInput(e) {
        const id = e.target && e.target.id;
        if (!id) return;
        if (id === 'clan-input-name') { this.draft.name = e.target.value; }
        else if (id === 'clan-input-tag') {
            this.draft.tag = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
            e.target.value = this.draft.tag;
        } else if (id === 'clan-input-motto') { this.draft.motto = e.target.value; }
        else if (id === 'clan-browse-search') {
            this.browseQuery = e.target.value;
            const listEl = document.getElementById('clan-browse-list');
            if (listEl && this.service) listEl.innerHTML = ClanCardRenderer.renderBrowseCards(this.service.browseList, this.browseQuery, !!this.service.currentClan, this.activeTab === 'top_clans');
        }
        if (id === 'clan-input-name' || id === 'clan-input-tag' || id === 'clan-input-motto') {
            const pSlot = document.getElementById('clan-create-preview-slot');
            if (pSlot) pSlot.innerHTML = ClanCardRenderer.renderCreatePreviewBanner(this.draft);
        }
    }

    async _handleBodyClick(e) {
        const t = e.target;
        const emblemBtn = t.closest('[data-pick-emblem]');
        if (emblemBtn) { this.draft.emblemId = emblemBtn.dataset.pickEmblem; this.render(); return; }
        const colorBtn = t.closest('[data-pick-color]');
        if (colorBtn) { this.draft.colorId = colorBtn.dataset.pickColor; this.render(); return; }
        const joinModeBtn = t.closest('[data-pick-join]');
        if (joinModeBtn) { this.draft.joinMode = joinModeBtn.dataset.pickJoin; this.render(); return; }

        if (t.closest('#clan-submit-create-btn')) {
            const res = await this.service.createClan(this.draft);
            if (!res.ok) return this.setFeedback(res.error, true);
            if (window.soundEngine) window.soundEngine.playLevelUp();
            this.setFeedback(`Clan [${res.clan.tag}] ${res.clan.name} founded!`, false);
            this.activeTab = 'overview'; this.render(); return;
        }
        if (t.closest('#clan-browse-refresh-btn')) { await this.service.fetchBrowseClans(); this.render(); return; }

        const joinBtn = t.closest('[data-join-clan]');
        if (joinBtn) {
            const res = await this.service.joinClan(joinBtn.dataset.joinClan);
            if (!res.ok) return this.setFeedback(res.error, true);
            if (res.outcome === 'requested') return this.setFeedback('Join request sent to the Clan Leaders!', false);
            if (window.soundEngine) window.soundEngine.playLevelUp();
            this.setFeedback('Welcome to your new Clan!', false);
            this.activeTab = 'overview'; this.render(); return;
        }

        const boostBtn = t.closest('[data-activate-booster]');
        if (boostBtn && !boostBtn.disabled) {
            const res = await this.service.activateVaultBooster(boostBtn.dataset.activateBooster);
            if (!res.ok) return this.setFeedback(res.error, true);
            if (window.soundEngine) window.soundEngine.playLevelUp();
            this.setFeedback(`⚡ Activated ${res.booster.name} (${res.booster.summary}) for all Clan members!`, false);
            this.render(); return;
        }

        const donateBtn = t.closest('[data-donate-res]');
        if (donateBtn && !donateBtn.disabled) {
            const resId = donateBtn.dataset.donateRes;
            const qty = parseInt(donateBtn.dataset.donateQty || '0', 10);
            const res = await this.service.donateToVault(resId, qty);
            if (!res.ok) return this.setFeedback(res.error, true);
            if (window.soundEngine) window.soundEngine.playPickup('coin');
            this.setFeedback(`Vaulted +${qty.toLocaleString()}! (+${res.xpGain} XP, +${res.contribGain} Contrib Pts)`, false);
            this.render(); return;
        }

        const claimBtn = t.closest('[data-claim-bounty]');
        if (claimBtn) {
            const res = await this.service.claimWeeklyBounty(claimBtn.dataset.claimBounty);
            if (!res.ok) return this.setFeedback(res.error, true);
            if (window.soundEngine) window.soundEngine.playLevelUp();
            this.setFeedback(`Claimed +${res.crests} Honor Crests & +${res.xp} Clan XP!`, false);
            this.render(); return;
        }

        if (t.closest('#clan-claim-weekly-chest-btn') && typeof ClanBuffs !== 'undefined') {
            const res = ClanBuffs.claimWeeklyChest(this.service);
            if (!res.ok) return this.setFeedback(res.error, true);
            if (window.soundEngine) window.soundEngine.playLevelUp();
            this.setFeedback(`Claimed ${res.tier.name} (+${res.tier.gemsBonus} Gems, +${res.tier.crestsBonus} Crests)!`, false);
            this.render(); return;
        }

        const shopBtn = t.closest('[data-buy-shop]');
        if (shopBtn && !shopBtn.disabled && typeof ClanBuffs !== 'undefined') {
            const res = ClanBuffs.buyShopItem(this.service, shopBtn.dataset.buyShop);
            if (!res.ok) return this.setFeedback(res.error, true);
            if (window.soundEngine) window.soundEngine.playLevelUp();
            this.setFeedback(`Purchased ${res.item.name}!`, false);
            this.render(); return;
        }

        const promBtn = t.closest('[data-promote-uid]');
        if (promBtn) {
            const r = await this.service.changeMemberRole(promBtn.dataset.promoteUid, 1);
            this.setFeedback(r.ok ? `Promoted ${r.name} to ${ClanConfigHelper.getRoleMeta(r.role).label}!` : r.error, !r.ok);
            return;
        }
        const demBtn = t.closest('[data-demote-uid]');
        if (demBtn) {
            const r = await this.service.changeMemberRole(demBtn.dataset.demoteUid, -1);
            this.setFeedback(r.ok ? `Demoted ${r.name} to ${ClanConfigHelper.getRoleMeta(r.role).label}.` : r.error, !r.ok);
            return;
        }
        const trBtn = t.closest('[data-transfer-uid]');
        if (trBtn) {
            const uid = trBtn.dataset.transferUid;
            if (this.confirmTransferUid !== uid) { this.confirmTransferUid = uid; this.render(); return; }
            this.confirmTransferUid = null;
            const r = await this.service.transferLeadership(uid);
            this.setFeedback(r.ok ? `Transferred Clan Leadership to ${r.name}!` : r.error, !r.ok);
            return;
        }

        const reqAcc = t.closest('[data-req-accept]');
        if (reqAcc) { const r = await this.service.respondJoinRequest(reqAcc.dataset.reqAccept, true); if (!r.ok) this.setFeedback(r.error, true); return; }
        const reqDec = t.closest('[data-req-decline]');
        if (reqDec) { const r = await this.service.respondJoinRequest(reqDec.dataset.reqDecline, false); if (!r.ok) this.setFeedback(r.error, true); return; }
        const kickBtn = t.closest('[data-kick-uid]');
        if (kickBtn) { const r = await this.service.kickMember(kickBtn.dataset.kickUid); if (!r.ok) this.setFeedback(r.error, true); return; }

        if (t.closest('#clan-save-motto-btn')) {
            const inp = document.getElementById('clan-motto-edit');
            const r = await this.service.updateMotto(inp ? inp.value : '');
            this.setFeedback(r.ok ? 'Clan Motto updated!' : r.error, !r.ok); return;
        }
        if (t.closest('#clan-leave-btn')) {
            if (!this.confirmLeave) { this.confirmLeave = true; this.render(); return; }
            const r = await this.service.leaveClan();
            this.confirmLeave = false;
            if (!r.ok) return this.setFeedback(r.error, true);
            this.setFeedback('You left the Clan.', false);
            this.activeTab = 'browse'; this.render();
        }
    }
}

if (typeof window !== 'undefined') window.ClansModal = ClansModal;
