/**
 * Lesa.io - Daily Challenges & Quests Data Definitions
 * Master configuration for daily quest templates and rewards
 * Nerfed Rewards: Gold 100 min - 350 max, Gems 5 min - 15 max
 */

const DEFAULT_QUESTS = [
    {
        id: 'defeat_enemies',
        title: 'Enemy Sweeper',
        desc: 'Defeat 120 cartoon enemies in the arena',
        target: 120,
        progress: 0,
        rewardCoins: 150,
        rewardGems: 8,
        rewardBP: 100,
        rewardMaterials: { armory_shards: 1 },
        claimed: false,
        icon: '⚔️',
        iconImg: 'assets/ui-icons/swords.svg'
    },
    {
        id: 'bonk_fatmir',
        title: 'Skatmir Crusher',
        desc: 'Bonk 3 heavy Skatmir brutes',
        target: 3,
        progress: 0,
        rewardCoins: 220,
        rewardGems: 10,
        rewardBP: 120,
        rewardMaterials: { armory_shards: 2 },
        claimed: false,
        icon: '🥊',
        iconImg: 'assets/ui-icons/boxing_glove.svg'
    },
    {
        id: 'outplay_casillas',
        title: 'Casillas Dodger',
        desc: 'Take down 2 tricky Casillas snipers',
        target: 2,
        progress: 0,
        rewardCoins: 260,
        rewardGems: 12,
        rewardBP: 140,
        rewardMaterials: { mati_crystal: 1 },
        claimed: false,
        icon: '🎯',
        iconImg: 'assets/ui-icons/target.svg'
    },
    {
        id: 'reach_wave',
        title: 'Wave Survivor',
        desc: 'Survive and reach Wave 4 in any run',
        target: 4,
        progress: 0,
        rewardCoins: 350,
        rewardGems: 15,
        rewardBP: 180,
        rewardMaterials: { armory_shards: 2, mati_crystal: 1 },
        claimed: false,
        icon: '🌊',
        iconImg: 'assets/ui-icons/wave.svg'
    },
    {
        id: 'collect_xp',
        title: 'Cookie Monster',
        desc: 'Collect 80 delicious XP cookies',
        target: 80,
        progress: 0,
        rewardCoins: 100,
        rewardGems: 5,
        rewardBP: 80,
        rewardMaterials: { armory_shards: 1 },
        claimed: false,
        icon: '🍪',
        iconImg: 'assets/ui-icons/cookie.svg'
    }
];

if (typeof window !== 'undefined') {
    window.DEFAULT_QUESTS = DEFAULT_QUESTS;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DEFAULT_QUESTS };
}
