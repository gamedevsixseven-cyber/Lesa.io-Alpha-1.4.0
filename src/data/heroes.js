/**
 * Lesa.io - Authoritative Hero Data Definitions
 * Single source of truth for hero stats, perks, unlock costs, avatars, and base properties
 */

const HEROES = {
    psanas: {
        id: 'psanas',
        name: 'PSANAS',
        title: 'The Slingshot Master',
        avatar: 'assets/HeroesIcons/PsanasAvatar.png',
        cost: 0,
        hp: 100,
        speed: 4.8,
        radius: 25,
        heroColor: '#ff4757',
        weaponType: 'pea',
        perks: 'Balanced combatant with standard Slingshot'
    },
    psogas: {
        id: 'psogas',
        name: 'PSOGAS',
        title: 'Fiery Chili Rebel',
        avatar: 'assets/HeroesIcons/PsogasAvatar.png',
        cost: 2500,
        hp: 85,
        speed: 5.2,
        radius: 23,
        heroColor: '#eb4d4b',
        weaponType: 'pepper',
        perks: 'Fast sprinter with piercing Chili Blaster'
    },
    petros: {
        id: 'petros',
        name: 'PETROS',
        title: 'The Blue Hood Sentinel',
        avatar: 'assets/HeroesIcons/PetrosAvatar.png',
        cost: 3500,
        hp: 125,
        speed: 4.4,
        radius: 26,
        heroColor: '#1e70d6',
        weaponType: 'watermelon',
        perks: 'High HP tank with heavy Melon Cannon'
    },
    '50balos': {
        id: '50balos',
        name: '50BALOS',
        title: 'The Cash Hustler',
        avatar: 'assets/HeroesIcons/50balosCrop.png',
        cost: 4500,
        hp: 110,
        speed: 5.0,
        radius: 24,
        heroColor: '#162c50',
        weaponType: 'money_gun',
        perks: 'Rapid cash shooter with piercing 50€ banknotes'
    }
};

if (typeof window !== 'undefined') {
    window.HEROES = HEROES;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HEROES };
}
