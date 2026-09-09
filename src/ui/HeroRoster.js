/**
 * Lesa.io - Hero Roster & Champion Selection Controller
 * Handles Hero Roster modal, hero unlocking with coins, active champion equipping, and avatar updating
 */

class HeroRoster {
    constructor(uiController) {
        this.ui = uiController;

        this.unlockedHeroes = JSON.parse(localStorage.getItem('lesaio_unlocked_heroes') || '["psanas"]');
        this.heroesModal = document.getElementById('heroes-modal');

        this.unlockCosts = {
            'psogas': 2500,
            'petros': 3500,
            'billias': 4000,
            'kitsos': 4500,
            '50balos': 6000
        };

        this.initEvents();
        this.updateHeroCardSelection();
    }

    initEvents() {
        const heroesBtn = document.getElementById('menu-heroes-btn');
        if (heroesBtn) {
            heroesBtn.addEventListener('click', () => {
                window.soundEngine.playSelect();
                this.showHeroesModal();
            });
        }

        const closeHeroesBtn = document.getElementById('close-heroes-btn');
        if (closeHeroesBtn) {
            closeHeroesBtn.addEventListener('click', () => {
                window.soundEngine.playGoBack();
                this.hideHeroesModal();
            });
        }

        const cards = document.querySelectorAll('.hero-select-card');
        cards.forEach((card) => {
            const hero = card.getAttribute('data-hero');
            const equipBtn = card.querySelector('.hero-equip-btn');

            equipBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleHeroButtonClick(hero);
            });

            card.addEventListener('click', () => {
                this.handleHeroButtonClick(hero);
            });
        });
    }

    handleHeroButtonClick(hero) {
        const comingSoonHeroes = {
            'psgiannhs': { name: 'Psgiannhs', desc: 'Psgiannhs is currently preparing his battle gear and special weapon. He will be available in an upcoming update!' },
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

        const isUnlocked = this.unlockedHeroes.includes(hero);

        if (isUnlocked) {
            window.soundEngine.playSelect();
            this.selectHero(hero);
        } else {
            const heroData = typeof HEROES !== 'undefined' ? HEROES[hero] : null;
            const cost = heroData ? heroData.cost : (this.unlockCosts[hero] || 2500);
            const coins = window.GameState ? window.GameState.player.coins : this.ui.coins;

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
                window.soundEngine.playPickup('star');
            } else {
                window.soundEngine.playGoBack();
                this.ui.showFeatureModal(
                    '🔒 HERO LOCKED',
                    `Unlock ${hero.toUpperCase()}`,
                    `You need 🪙 ${cost.toLocaleString()} Coins to unlock this hero! (You currently have 🪙 ${coins.toLocaleString()})`
                );
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

    updateHeroCardSelection() {
        const cards = document.querySelectorAll('.hero-select-card');

        cards.forEach((card) => {
            const hero = card.getAttribute('data-hero');
            if (card.classList.contains('hero-card-coming-soon') || hero === 'psgiannhs' || hero === 'mortigen') {
                card.classList.add('hero-locked');
                return;
            }

            const equipBtn = card.querySelector('.hero-equip-btn');
            const lockBadge = card.querySelector('.hero-lock-badge');
            const isUnlocked = this.unlockedHeroes.includes(hero);

            if (!isUnlocked) {
                card.classList.add('hero-locked');
                card.classList.remove('active');
                if (lockBadge) lockBadge.style.display = 'block';
                const cost = this.unlockCosts[hero] || 2500;
                equipBtn.textContent = `UNLOCK (🪙 ${cost.toLocaleString()})`;
                equipBtn.className = 'comic-btn comic-btn-sm hero-equip-btn hero-unlock-btn';
            } else {
                card.classList.remove('hero-locked');
                if (lockBadge) lockBadge.style.display = 'none';

                if (hero === this.ui.selectedHero) {
                    card.classList.add('active');
                    equipBtn.textContent = 'SELECTED ✅';
                    equipBtn.className = 'comic-btn comic-btn-sm hero-equip-btn comic-btn-primary';
                } else {
                    card.classList.remove('active');
                    equipBtn.textContent = 'EQUIP';
                    equipBtn.className = 'comic-btn comic-btn-sm hero-equip-btn';
                }
            }
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
