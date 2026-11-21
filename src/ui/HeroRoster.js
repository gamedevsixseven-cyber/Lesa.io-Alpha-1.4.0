/**
 * Lesa.io - Hero Roster & Champion Selection Controller
 * Handles Hero Roster modal, hero unlocking with coins, active champion equipping,
 * live wallet/progress summary pills, status filter chips, and non-blocking feedback.
 */

class HeroRoster {
    constructor(uiController) {
        this.ui = uiController;

        this.unlockedHeroes = JSON.parse(localStorage.getItem('lesaio_unlocked_heroes') || '["psanas"]');
        this.heroesModal = document.getElementById('heroes-modal');
        this.summaryBar = document.getElementById('heroes-summary-bar');
        this.filterChips = document.querySelectorAll('#heroes-filter-bar .tab-filter-chip');
        this.activeFilter = 'ALL';

        this.unlockCosts = {
            'psogas': 2500,
            'petros': 3500,
            'billias': 4000,
            'kitsos': 4500,
            'psgiannhs': 5000,
            '50balos': 6000
        };

        this.initEvents();
        this.updateHeroCardSelection();
    }

    _syncState() {
        if (typeof window !== 'undefined' && window.GameState && window.GameState.player) {
            const p = window.GameState.player;
            if (Array.isArray(p.unlockedHeroes) && p.unlockedHeroes.length > 0) {
                this.unlockedHeroes = p.unlockedHeroes;
            }
            if (p.selectedHero && this.ui) {
                this.ui.selectedHero = p.selectedHero;
            }
        }
    }

    _getCoins() {
        if (typeof window !== 'undefined' && window.GameState && window.GameState.player) {
            return window.GameState.player.coins || 0;
        }
        return (this.ui && this.ui.coins) || 0;
    }

    initEvents() {
        const heroesBtn = document.getElementById('menu-heroes-btn');
        if (heroesBtn) {
            heroesBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                this.showHeroesModal();
            });
        }

        const closeHeroesBtn = document.getElementById('close-heroes-btn');
        if (closeHeroesBtn) {
            closeHeroesBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playGoBack();
                this.hideHeroesModal();
            });
        }

        if (this.filterChips && this.filterChips.length > 0) {
            this.filterChips.forEach((chip) => {
                chip.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.activeFilter = chip.getAttribute('data-filter') || 'ALL';
                    this.filterChips.forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    if (window.soundEngine) window.soundEngine.playSelect();
                    this.updateHeroCardSelection();
                });
            });
        }

        const cards = document.querySelectorAll('.hero-select-card');
        cards.forEach((card) => {
            const hero = card.getAttribute('data-hero');
            const equipBtn = card.querySelector('.hero-equip-btn');

            if (equipBtn) {
                equipBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.handleHeroButtonClick(hero, card);
                });
            }

            card.querySelectorAll('.hero-style-btn').forEach((styleBtn) => {
                styleBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const styleId = styleBtn.getAttribute('data-style');
                    if (hero === 'psgiannhs' && typeof PsgiannhsHero !== 'undefined' && styleId) {
                        PsgiannhsHero.setActiveStyle(styleId);
                        if (window.soundEngine) window.soundEngine.playSelect();
                        this.updateHeroStyleButtons();
                        if (this.ui && this.ui.menuController) this.ui.menuController.updateHeroAvatarUI();
                        if (this.ui && this.ui.profileManager) this.ui.profileManager.updateProfileUI();
                        if (this.ui && this.ui.modalManager && typeof this.ui.modalManager.updateGearScreen === 'function') {
                            this.ui.modalManager.updateGearScreen();
                        }
                    }
                });
            });

            card.addEventListener('click', () => {
                this.handleHeroButtonClick(hero, card);
            });
        });

        if (typeof window !== 'undefined' && window.EventBus) {
            const refresh = () => this.updateHeroCardSelection();
            window.EventBus.on('currencyChanged', refresh);
            window.EventBus.on('currencyUpdated', refresh);
        }
    }

    handleHeroButtonClick(hero, cardEl = null) {
        const comingSoonHeroes = {
            'mortigen': { name: 'Mortigen', desc: 'Mortigen is currently preparing his dark abilities and weapon. He will be available in an upcoming update!' }
        };

        if (comingSoonHeroes[hero]) {
            if (window.soundEngine) window.soundEngine.playHit();
            const info = comingSoonHeroes[hero];
            if (this.ui && typeof this.ui.showFeatureModal === 'function') {
                this.ui.showFeatureModal(
                    '⏳ HERO IN TRAINING',
                    `${info.name} is Coming Soon!`,
                    info.desc
                );
            }
            return;
        }

        this._syncState();
        const isUnlocked = this.unlockedHeroes.includes(hero);

        if (isUnlocked) {
            if (window.soundEngine) window.soundEngine.playSelect();
            this.selectHero(hero);
        } else {
            const heroData = typeof HEROES !== 'undefined' ? HEROES[hero] : null;
            const cost = heroData ? heroData.cost : (this.unlockCosts[hero] || 2500);
            const coins = this._getCoins();

            if (coins >= cost) {
                if (window.GameState) {
                    window.GameState.unlockHero(hero, cost);
                    this.unlockedHeroes = window.GameState.player.unlockedHeroes;
                } else {
                    this.ui.coins -= cost;
                    this.unlockedHeroes.push(hero);
                    localStorage.setItem('lesaio_coins', this.ui.coins.toString());
                    localStorage.setItem('lesaio_unlocked_heroes', JSON.stringify(this.unlockedHeroes));
                    this.ui.updateCurrencyUI();
                }
                this.selectHero(hero);
                if (window.soundEngine) window.soundEngine.playPickup('star');
                const mgr = window.modalManager || (this.ui && this.ui.modalManager);
                if (mgr && typeof mgr.showQuickToast === 'function') {
                    mgr.showQuickToast(`🪖 Unlocked ${(heroData && heroData.name) || hero.toUpperCase()}!`);
                }
            } else {
                const needed = Math.max(0, cost - coins);
                const msg = `⚠️ Need 🪙 ${needed.toLocaleString()} more Coins to unlock ${hero.toUpperCase()}!`;
                if (typeof ModalManager !== 'undefined' && typeof ModalManager.notifyInsufficient === 'function') {
                    ModalManager.notifyInsufficient(msg, cardEl);
                } else if (this.ui && typeof this.ui.showFeatureModal === 'function') {
                    if (window.soundEngine) window.soundEngine.playGoBack();
                    this.ui.showFeatureModal('🔒 HERO LOCKED', `Unlock ${hero.toUpperCase()}`, msg);
                }
            }
        }
    }

    selectHero(heroType) {
        if (window.GameState) {
            window.GameState.setSelectedHero(heroType);
        }
        this.ui.selectedHero = heroType;
        localStorage.setItem('lesaio_selected_hero', heroType);
        this.updateHeroCardSelection();
        if (this.ui.menuController) {
            this.ui.menuController.updateHeroAvatarUI();
        }
        if (this.ui.profileManager) {
            this.ui.profileManager.updateProfileUI();
        }
        if (this.ui.modalManager && typeof this.ui.modalManager.updateGearScreen === 'function') {
            this.ui.modalManager.updateGearScreen();
        }
    }

    _updateSummaryBar(playableCount, ownedCount) {
        if (!this.summaryBar) {
            this.summaryBar = document.getElementById('heroes-summary-bar');
        }
        if (!this.summaryBar || typeof ModalManager === 'undefined' || !ModalManager.renderTabSummaryBar) return;

        const coins = this._getCoins();
        const activeName = ((this.ui && this.ui.selectedHero) || 'psanas').toUpperCase();
        ModalManager.renderTabSummaryBar(this.summaryBar, [
            { icon: '🪙', label: 'COINS', val: coins.toLocaleString(), cls: 'tab-pill-gold' },
            { icon: '🪖', label: 'UNLOCKED', val: `${ownedCount} / ${playableCount}`, cls: 'tab-pill-green' },
            { icon: '⭐', label: 'ACTIVE', val: activeName }
        ]);
    }

    updateHeroCardSelection() {
        this._syncState();
        const cards = document.querySelectorAll('.hero-select-card');
        const grid = document.querySelector('#heroes-modal .heroes-grid');
        const coins = this._getCoins();

        let playableCount = 0;
        let ownedCount = 0;
        let visibleCount = 0;

        cards.forEach((card) => {
            const hero = card.getAttribute('data-hero');
            const isSoon = card.classList.contains('hero-card-coming-soon') || hero === 'mortigen';
            if (isSoon) {
                card.classList.add('hero-locked');
                const matches = (this.activeFilter === 'ALL' || this.activeFilter === 'SOON');
                card.style.display = matches ? '' : 'none';
                if (matches) visibleCount++;
                return;
            }

            playableCount++;
            const equipBtn = card.querySelector('.hero-equip-btn');
            const lockBadge = card.querySelector('.hero-lock-badge');
            const isUnlocked = this.unlockedHeroes.includes(hero);
            if (isUnlocked) ownedCount++;

            if (!isUnlocked) {
                const heroData = typeof HEROES !== 'undefined' ? HEROES[hero] : null;
                const cost = (heroData && heroData.cost) || this.unlockCosts[hero] || 2500;
                const canAfford = coins >= cost;

                card.classList.add('hero-locked');
                card.classList.remove('active');
                if (lockBadge) {
                    lockBadge.style.display = 'block';
                    lockBadge.innerHTML = canAfford
                        ? `${typeof UiIcons !== 'undefined' ? UiIcons.i('coin', 'ui-icon-sm') : '🪙'} CAN BUY!`
                        : `${typeof UiIcons !== 'undefined' ? UiIcons.i('lock', 'ui-icon-sm') : '🔒'} LOCKED`;
                    lockBadge.className = `hero-lock-badge ${canAfford ? 'hero-badge-afford' : ''}`;
                }
                if (equipBtn) {
                    equipBtn.disabled = false;
                    equipBtn.innerHTML = `UNLOCK (${typeof UiIcons !== 'undefined' ? UiIcons.i('coin', 'ui-icon-sm') : '🪙'} ${cost.toLocaleString()})`;
                    equipBtn.className = `comic-btn comic-btn-sm hero-equip-btn hero-unlock-btn ${canAfford ? 'is-can-afford-unlock' : 'is-insufficient'}`;
                }
            } else {
                card.classList.remove('hero-locked');
                if (lockBadge) lockBadge.style.display = 'none';

                if (hero === this.ui.selectedHero) {
                    card.classList.add('active');
                    if (equipBtn) {
                        equipBtn.disabled = true;
                        equipBtn.innerHTML = `SELECTED ${typeof UiIcons !== 'undefined' ? UiIcons.i('check', 'ui-icon-sm') : '✅'}`;
                        equipBtn.className = 'comic-btn comic-btn-sm hero-equip-btn comic-btn-primary';
                    }
                } else {
                    card.classList.remove('active');
                    if (equipBtn) {
                        equipBtn.disabled = false;
                        equipBtn.textContent = 'EQUIP';
                        equipBtn.className = 'comic-btn comic-btn-sm hero-equip-btn';
                    }
                }
            }

            const matchesFilter =
                this.activeFilter === 'ALL' ||
                (this.activeFilter === 'OWNED' && isUnlocked) ||
                (this.activeFilter === 'LOCKED' && !isUnlocked);
            card.style.display = matchesFilter ? '' : 'none';
            if (matchesFilter) visibleCount++;
        });

        this.updateHeroStyleButtons();
        this._updateSummaryBar(playableCount || 7, ownedCount);

        if (grid) {
            let emptyEl = grid.querySelector('.tab-empty-filter-state');
            if (visibleCount === 0) {
                if (!emptyEl) {
                    emptyEl = document.createElement('div');
                    emptyEl.className = 'tab-empty-filter-state';
                    grid.appendChild(emptyEl);
                }
                emptyEl.innerHTML = this.activeFilter === 'LOCKED'
                    ? `${typeof UiIcons !== 'undefined' ? UiIcons.i('celebrate') : '🎉'} You have unlocked every currently playable champion!`
                    : 'No heroes match this filter.';
            } else if (emptyEl) {
                emptyEl.remove();
            }
        }
    }

    updateHeroStyleButtons() {
        const psgCard = document.querySelector('.hero-select-card[data-hero="psgiannhs"]');
        if (!psgCard || typeof PsgiannhsHero === 'undefined') return;
        const activeStyle = PsgiannhsHero.getActiveStyle();
        const img = psgCard.querySelector('.hero-select-avatar img');
        if (img) img.src = PsgiannhsHero.getAvatarForStyle(activeStyle);
        psgCard.querySelectorAll('.hero-style-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.getAttribute('data-style') === activeStyle);
        });
    }

    showHeroesModal() {
        this.updateHeroCardSelection();
        if (this.heroesModal) this.heroesModal.classList.remove('hidden');
    }

    hideHeroesModal() {
        if (this.heroesModal) this.heroesModal.classList.add('hidden');
    }
}

if (typeof window !== 'undefined') {
    window.HeroRoster = HeroRoster;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HeroRoster };
}
