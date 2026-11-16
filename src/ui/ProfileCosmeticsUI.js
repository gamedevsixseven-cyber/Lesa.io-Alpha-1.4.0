/**
 * Lesa.io - Profile Customization UI (Banners, Avatar Frames & Milestone Coins)
 * Renders sub-tabs and showcase controls inside #player-profile-modal.
 */

class ProfileCosmeticsUI {
    static activeTab = 'stats';
    static _bound = false;

    static HERO_AVATARS = {
        psanas: 'assets/HeroesIcons/PsanasAvatar.png',
        psogas: 'assets/HeroesIcons/PsogasAvatar.png',
        petros: 'assets/HeroesIcons/PetrosAvatar.png',
        '50balos': 'assets/HeroesIcons/50balosCrop.png',
        billias: 'assets/HeroesIcons/BilliasAvatar.png',
        kitsos: 'assets/HeroesIcons/KitsosAvatar.png'
    };

    static init() {
        if (this._bound || typeof document === 'undefined') return;
        this._bound = true;

        document.querySelectorAll('#prof-tabs-bar .prof-tab-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                this.switchTab(btn.dataset.profTab || 'stats');
            });
        });

        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.on('cosmeticsUpdated', () => {
                this.refreshHeaderPreview();
                const modal = document.getElementById('player-profile-modal');
                if (modal && !modal.classList.contains('hidden')) {
                    this.renderActiveTab();
                }
            });
        }
    }

    static switchTab(tab = 'stats') {
        this.activeTab = tab;
        document.querySelectorAll('#prof-tabs-bar .prof-tab-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.profTab === tab);
        });
        const statsSection = document.getElementById('prof-stats-section');
        const cosSection = document.getElementById('prof-cosmetics-section');
        if (statsSection) statsSection.classList.toggle('hidden', tab !== 'stats');
        if (cosSection) cosSection.classList.toggle('hidden', tab === 'stats');
        this.renderActiveTab();
    }

    static getHeroAvatar(heroId) {
        return this.HERO_AVATARS[heroId] || this.HERO_AVATARS.psanas;
    }

    static refreshHeaderPreview() {
        if (typeof CosmeticManager === 'undefined') return;
        const st = CosmeticManager.getState();

        // Top-left menu profile card
        const menuProfile = document.getElementById('menu-player-profile');
        const menuAvatarFrame = document.querySelector('#menu-player-profile .player-avatar-frame-menu');
        const menuCoinsEl = document.getElementById('menu-profile-coins');
        CosmeticManager.applyBannerClass(menuProfile, st.equippedBanner);
        CosmeticManager.applyFrameClass(menuAvatarFrame, st.equippedFrame);
        if (menuCoinsEl) {
            menuCoinsEl.innerHTML = CosmeticManager.renderPinnedCoinsHtml(st.displayedCoins, 'xs');
            menuCoinsEl.classList.toggle('hidden', st.displayedCoins.length === 0);
        }

        // Profile modal header card
        const profCard = document.querySelector('#player-profile-modal .profile-header-card');
        const profAvatarWrap = document.querySelector('#player-profile-modal .prof-avatar-wrap');
        CosmeticManager.applyBannerClass(profCard, st.equippedBanner);
        CosmeticManager.applyFrameClass(profAvatarWrap, st.equippedFrame);
        this.renderShowcaseTray(st);
    }

    static renderShowcaseTray(st = null) {
        const tray = document.getElementById('prof-showcase-coins');
        if (!tray || typeof CosmeticManager === 'undefined') return;
        const state = st || CosmeticManager.getState();
        const slotsHtml = [];
        for (let i = 0; i < CosmeticManager.MAX_DISPLAY_COINS; i++) {
            const coinId = state.displayedCoins[i];
            if (coinId) {
                const def = CosmeticManager.getCoinDef(coinId);
                slotsHtml.push(`
                    <button type="button" class="prof-showcase-slot filled rarity-${def ? def.rarity : 'common'}" data-unpin-coin="${coinId}" title="Click to unpin ${def ? def.name : ''}">
                        ${CosmeticManager.renderCoinMedallionHtml(coinId, 'sm', false)}
                        <span class="prof-showcase-lbl">${def ? def.shortTag : coinId}</span>
                    </button>
                `);
            } else {
                slotsHtml.push(`
                    <button type="button" class="prof-showcase-slot empty" data-open-coins-tab="1" title="Pin a Milestone Coin">
                        <span class="prof-showcase-plus">+</span>
                        <span class="prof-showcase-lbl">EMPTY SLOT</span>
                    </button>
                `);
            }
        }
        tray.innerHTML = slotsHtml.join('');
        tray.querySelectorAll('[data-unpin-coin]').forEach((b) => {
            b.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                CosmeticManager.toggleDisplayCoin(b.dataset.unpinCoin);
            });
        });
        tray.querySelectorAll('[data-open-coins-tab]').forEach((b) => {
            b.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                this.switchTab('coins');
            });
        });
    }

    static renderActiveTab() {
        if (typeof CosmeticManager === 'undefined') return;
        this.refreshHeaderPreview();
        const container = document.getElementById('prof-cosmetics-section');
        if (!container || this.activeTab === 'stats') return;

        const st = CosmeticManager.getState();
        const snap = CosmeticManager.getProgressSnapshot();

        if (this.activeTab === 'banners') {
            this._renderBannersGrid(container, st, snap);
        } else if (this.activeTab === 'frames') {
            this._renderFramesGrid(container, st, snap);
        } else if (this.activeTab === 'coins') {
            this._renderCoinsGrid(container, st, snap);
        }
    }

    static _progressBarHtml(item, snap, unlocked) {
        if (unlocked) return '<div class="cos-prog-done">✓ UNLOCKED</div>';
        const target = Math.max(1, item.targetVal ? item.targetVal(snap) : 1);
        const cur = Math.min(target, item.currentVal ? item.currentVal(snap) : 0);
        const pct = Math.min(100, Math.round((cur / target) * 100));
        return `
            <div class="cos-prog-wrap">
                <div class="cos-prog-bar"><div class="cos-prog-fill" style="width:${pct}%"></div></div>
                <span class="cos-prog-text">${cur.toLocaleString()} / ${target.toLocaleString()}</span>
            </div>
        `;
    }

    static _renderBannersGrid(container, st, snap) {
        const list = typeof PROFILE_BANNERS !== 'undefined' ? PROFILE_BANNERS : [];
        const header = `<div class="cos-sub-note">Unlocked: <strong>${st.unlockedBanners.length} / ${list.length}</strong> Banners • Displayed at Top-Left Lobby, Friends & Global Leaderboards</div>`;
        const cards = list.map((b) => {
            const unlocked = st.unlockedBanners.includes(b.id);
            const equipped = st.equippedBanner === b.id;
            const rar = CosmeticManager.getRarityMeta(b.rarity);
            return `
                <div class="cos-card ${unlocked ? '' : 'is-locked'} ${equipped ? 'is-equipped' : ''} rarity-${b.rarity}">
                    <div class="cos-banner-preview ${b.cssClass}">
                        <span class="cos-rarity-pill rarity-${b.rarity}">${rar.label}</span>
                        <span class="cos-preview-name">${b.name}</span>
                    </div>
                    <div class="cos-card-body">
                        <div class="cos-card-desc">${b.desc}</div>
                        <div class="cos-unlock-hint">${b.unlockHint}</div>
                        ${this._progressBarHtml(b, snap, unlocked)}
                        <button type="button" class="cos-action-btn ${equipped ? 'is-equipped' : (unlocked ? '' : 'disabled')}" data-equip-banner="${b.id}" ${unlocked ? '' : 'disabled'}>
                            ${equipped ? '✓ EQUIPPED' : (unlocked ? 'EQUIP BANNER' : '🔒 LOCKED')}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        container.innerHTML = `${header}<div class="cos-grid cos-grid-2">${cards}</div>`;
        container.querySelectorAll('[data-equip-banner]').forEach((btn) => {
            btn.addEventListener('click', () => {
                if (CosmeticManager.equipBanner(btn.dataset.equipBanner)) {
                    if (window.soundEngine) window.soundEngine.playSelect();
                    if (window.modalManager) window.modalManager.showQuickToast('✓ Profile Banner equipped!', 1400);
                }
            });
        });
    }

    static _renderFramesGrid(container, st, snap) {
        const list = typeof PROFILE_FRAMES !== 'undefined' ? PROFILE_FRAMES : [];
        const hero = (window.GameState && window.GameState.player && window.GameState.player.selectedHero) || 'psanas';
        const avatarSrc = this.getHeroAvatar(hero);
        const header = `<div class="cos-sub-note">Unlocked: <strong>${st.unlockedFrames.length} / ${list.length}</strong> Avatar Frames • Wraps your avatar across Menu, Friends & Leaderboards</div>`;
        const cards = list.map((f) => {
            const unlocked = st.unlockedFrames.includes(f.id);
            const equipped = st.equippedFrame === f.id;
            const rar = CosmeticManager.getRarityMeta(f.rarity);
            return `
                <div class="cos-card ${unlocked ? '' : 'is-locked'} ${equipped ? 'is-equipped' : ''} rarity-${f.rarity}">
                    <div class="cos-frame-stage">
                        <span class="cos-rarity-pill rarity-${f.rarity}">${rar.label}</span>
                        <div class="cos-frame-demo ${f.cssClass}">
                            <img src="${avatarSrc}" alt="Avatar">
                        </div>
                        <div class="cos-frame-title">${f.name}</div>
                    </div>
                    <div class="cos-card-body">
                        <div class="cos-card-desc">${f.desc}</div>
                        <div class="cos-unlock-hint">${f.unlockHint}</div>
                        ${this._progressBarHtml(f, snap, unlocked)}
                        <button type="button" class="cos-action-btn ${equipped ? 'is-equipped' : (unlocked ? '' : 'disabled')}" data-equip-frame="${f.id}" ${unlocked ? '' : 'disabled'}>
                            ${equipped ? '✓ EQUIPPED' : (unlocked ? 'EQUIP FRAME' : '🔒 LOCKED')}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        container.innerHTML = `${header}<div class="cos-grid cos-grid-2">${cards}</div>`;
        container.querySelectorAll('[data-equip-frame]').forEach((btn) => {
            btn.addEventListener('click', () => {
                if (CosmeticManager.equipFrame(btn.dataset.equipFrame)) {
                    if (window.soundEngine) window.soundEngine.playSelect();
                    if (window.modalManager) window.modalManager.showQuickToast('✓ Avatar Frame equipped!', 1400);
                }
            });
        });
    }

    static _renderCoinsGrid(container, st, snap) {
        const list = typeof MILESTONE_COINS !== 'undefined' ? MILESTONE_COINS : [];
        const header = `<div class="cos-sub-note">Collected: <strong>${st.unlockedCoins.length} / ${list.length}</strong> Milestone Coins • Pin up to <strong>3</strong> in your top Showcase Bar</div>`;
        const cards = list.map((c) => {
            const unlocked = st.unlockedCoins.includes(c.id);
            const pinned = st.displayedCoins.includes(c.id);
            const rar = CosmeticManager.getRarityMeta(c.rarity);
            return `
                <div class="cos-card cos-coin-card ${unlocked ? '' : 'is-locked'} ${pinned ? 'is-equipped' : ''} rarity-${c.rarity}">
                    <div class="cos-coin-top">
                        ${CosmeticManager.renderCoinMedallionHtml(c, 'lg', !unlocked)}
                        <div class="cos-coin-meta">
                            <span class="cos-rarity-pill rarity-${c.rarity}">${rar.label}</span>
                            <div class="cos-coin-name">${c.name}</div>
                            <span class="cos-coin-tag">${c.shortTag}</span>
                        </div>
                    </div>
                    <div class="cos-card-body">
                        <div class="cos-card-desc">${c.desc}</div>
                        <div class="cos-unlock-hint">${c.unlockHint}</div>
                        ${this._progressBarHtml(c, snap, unlocked)}
                        <button type="button" class="cos-action-btn ${pinned ? 'is-equipped' : (unlocked ? '' : 'disabled')}" data-pin-coin="${c.id}" ${unlocked ? '' : 'disabled'}>
                            ${pinned ? '✓ SHOWCASED (UNPIN)' : (unlocked ? '📌 DISPLAY ON PROFILE' : '🔒 LOCKED')}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        container.innerHTML = `${header}<div class="cos-grid cos-grid-2">${cards}</div>`;
        container.querySelectorAll('[data-pin-coin]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const res = CosmeticManager.toggleDisplayCoin(btn.dataset.pinCoin);
                if (res && res.ok) {
                    if (window.soundEngine) window.soundEngine.playSelect();
                } else if (res && res.reason) {
                    if (window.soundEngine && typeof window.soundEngine.playGoBack === 'function') window.soundEngine.playGoBack();
                    if (window.modalManager) window.modalManager.showQuickToast(res.reason, 2200);
                }
            });
        });
    }

    static decorateSocialCard(cardEl, profile) {
        if (!cardEl || !profile || typeof CosmeticManager === 'undefined') return;
        const cos = CosmeticManager.extractPublicCosmetics({ cosmetics: profile.cosmetics || profile });
        CosmeticManager.applyBannerClass(cardEl, cos.banner);

        const avatarWrap = cardEl.querySelector('.friend-avatar-wrap');
        CosmeticManager.applyFrameClass(avatarWrap, cos.frame);

        const infoEl = cardEl.querySelector('.friend-info');
        if (infoEl && cos.coins.length > 0 && !infoEl.querySelector('.friend-coins-strip')) {
            const strip = document.createElement('div');
            strip.className = 'friend-coins-strip';
            strip.innerHTML = CosmeticManager.renderPinnedCoinsHtml(cos.coins, 'xs');
            infoEl.appendChild(strip);
        }

        const leftEl = cardEl.querySelector('.friend-left');
        if (leftEl && typeof PublicProfileModal !== 'undefined') {
            leftEl.classList.add('is-inspectable');
            leftEl.title = `View ${profile.name || 'Player'}'s Profile & Milestone Coins`;
            leftEl.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                PublicProfileModal.open(profile);
            });
        }
    }
}

if (typeof window !== 'undefined') {
    window.ProfileCosmeticsUI = ProfileCosmeticsUI;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProfileCosmeticsUI };
}
