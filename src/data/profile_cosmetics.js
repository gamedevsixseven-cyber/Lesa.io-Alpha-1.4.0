/**
 * Lesa.io - Profile Banners, Avatar Frames & Milestone Coins Catalog
 * All cosmetics are earned via Gameplay Milestones & Feats, including ultra-rare Celestial relics.
 */

const COSMETIC_RARITIES = {
    common:    { key: 'common',    label: 'STARTER',    rank: 1, color: '#94a3b8', bg: '#334155', glow: 'rgba(148,163,184,0.28)' },
    rare:      { key: 'rare',      label: 'RARE',       rank: 2, color: '#38bdf8', bg: '#0c4a6e', glow: 'rgba(56,189,248,0.38)' },
    epic:      { key: 'epic',      label: 'EPIC',       rank: 3, color: '#c084fc', bg: '#4c1d95', glow: 'rgba(192,132,252,0.45)' },
    legendary: { key: 'legendary', label: 'LEGENDARY',  rank: 4, color: '#fbbf24', bg: '#78350f', glow: 'rgba(251,191,36,0.52)' },
    mythic:    { key: 'mythic',    label: 'MYTHIC',     rank: 5, color: '#fb7185', bg: '#881337', glow: 'rgba(244,63,94,0.58)' },
    celestial: { key: 'celestial', label: 'ULTRA RARE', rank: 6, color: '#fde047', bg: '#311042', glow: 'rgba(56,189,248,0.75)' }
};

const PROFILE_BANNERS = [
    {
        id: 'banner_recruit',
        name: 'Arena Rookie',
        rarity: 'common',
        cssClass: 'cos-banner-recruit',
        desc: 'Standard issue Lesa.io contender banner.',
        unlockHint: 'Unlocked by default',
        targetVal: () => 1,
        currentVal: () => 1,
        isUnlocked: () => true
    },
    {
        id: 'banner_wave_breaker',
        name: 'Stormfront Slate',
        rarity: 'rare',
        cssClass: 'cos-banner-stormfront',
        desc: 'Charged cobalt chevrons for rising brawlers.',
        unlockHint: 'Reach Wave 10 in Story or Endless',
        targetVal: () => 10,
        currentVal: (s) => Math.min(10, Math.max(s.storyMaxWave, s.endlessMaxWave, s.maxWave)),
        isUnlocked: (s) => Math.max(s.storyMaxWave, s.endlessMaxWave, s.maxWave) >= 10
    },
    {
        id: 'banner_story_champion',
        name: 'Rouf’s Silence',
        rarity: 'epic',
        cssClass: 'cos-banner-rouf',
        desc: 'Twilight neon waves forged after conquering Story Mode.',
        unlockHint: 'Defeat Rouf (Story Wave 20)',
        targetVal: () => 20,
        currentVal: (s) => ((s.defeatedBosses.rouf || 0) > 0 || s.storyMaxWave >= 20) ? 20 : Math.min(19, s.storyMaxWave),
        isUnlocked: (s) => (s.defeatedBosses.rouf || 0) > 0 || s.storyMaxWave >= 20
    },
    {
        id: 'banner_endless_titan',
        name: 'Solar Vanguard',
        rarity: 'legendary',
        cssClass: 'cos-banner-titan',
        desc: 'Blazing amber armor plate for Endless endurance fighters.',
        unlockHint: 'Reach Wave 25 in Endless Mode',
        targetVal: () => 25,
        currentVal: (s) => Math.min(25, s.endlessMaxWave),
        isUnlocked: (s) => s.endlessMaxWave >= 25
    },
    {
        id: 'banner_immortal_slayer',
        name: 'Jade Tempest',
        rarity: 'legendary',
        cssClass: 'cos-banner-slayer',
        desc: 'Emerald warbanner stained with 10,000 vanquished foes.',
        unlockHint: 'Reach 10,000 Total Kills',
        targetVal: () => 10000,
        currentVal: (s) => Math.min(10000, s.totalKills),
        isUnlocked: (s) => s.totalKills >= 10000
    },
    {
        id: 'banner_mecha_w40',
        name: 'Crimson Kolossos',
        rarity: 'mythic',
        cssClass: 'cos-banner-mecha-w40',
        desc: 'Blood-red fog and hazard Reactor glow of the Wave 40 overlord.',
        unlockHint: 'Reach Wave 40 in Endless Mode',
        targetVal: () => 40,
        currentVal: (s) => Math.min(40, s.endlessMaxWave),
        isUnlocked: (s) => s.endlessMaxWave >= 40
    },
    {
        id: 'banner_olympus_ascended',
        name: 'Divine Aegis',
        rarity: 'mythic',
        cssClass: 'cos-banner-olympus',
        desc: 'Golden marble sky crest worn only by vanquishers of Zeus.',
        unlockHint: 'Defeat Zeus (Mount Olympus Floor 5)',
        targetVal: () => 1,
        currentVal: (s) => ((s.defeatedBosses.zeus || 0) > 0) ? 1 : 0,
        isUnlocked: (s) => (s.defeatedBosses.zeus || 0) > 0
    },
    {
        id: 'banner_starforged_relic',
        name: 'Astral Star-Stone',
        rarity: 'celestial',
        cssClass: 'cos-banner-astral',
        desc: 'ULTRA RARE: Prismatic starfield pulsing with the 0.8% Olympian Relic.',
        unlockHint: 'Acquire an Olympian Star-Stone OR Defeat Zeus 5 times',
        targetVal: () => 1,
        currentVal: (s) => (s.olympianStarStones > 0 || (s.defeatedBosses.zeus || 0) >= 5) ? 1 : 0,
        isUnlocked: (s) => s.olympianStarStones > 0 || (s.defeatedBosses.zeus || 0) >= 5
    },
    {
        id: 'banner_endless_god',
        name: 'W50 Singularity',
        rarity: 'celestial',
        cssClass: 'cos-banner-w50',
        desc: 'ULTRA RARE: Supernova aurora awarded beyond Endless Wave 50.',
        unlockHint: 'Reach Wave 50 in Endless Mode',
        targetVal: () => 50,
        currentVal: (s) => Math.min(50, s.endlessMaxWave),
        isUnlocked: (s) => s.endlessMaxWave >= 50
    },
    {
        id: 'banner_warlord_50k',
        name: 'Obsidian Monarch',
        rarity: 'celestial',
        cssClass: 'cos-banner-monarch',
        desc: 'ULTRA RARE: Gilded lightning silk reserved for true lifetime grinders.',
        unlockHint: 'Reach 50,000 Total Kills & Account Level 25',
        targetVal: () => 50000,
        currentVal: (s) => (s.totalKills >= 50000 && s.accountLevel >= 25) ? 50000 : Math.min(49999, s.totalKills),
        isUnlocked: (s) => s.totalKills >= 50000 && s.accountLevel >= 25
    },
    {
        id: 'banner_sunset_arcade', name: 'Arcade Sunset', rarity: 'rare', cssClass: 'cos-banner-sunset',
        desc: 'Animated synthwave horizon stripes rolling across retro dusk gradients.',
        unlockHint: 'Play 10 Matches',
        targetVal: () => 10, currentVal: (s) => Math.min(10, s.matchesPlayed), isUnlocked: (s) => s.matchesPlayed >= 10
    },
    {
        id: 'banner_frost_citadel', name: 'Boreas Glacier', rarity: 'epic', cssClass: 'cos-banner-frost',
        desc: 'Sweeping crystalline ice glints across frozen Mount Olympus ridges.',
        unlockHint: 'Clear Olympus Floor 3 or defeat Frost Titan',
        targetVal: () => 3, currentVal: (s) => (s.olympusMaxFloor >= 3 || (s.defeatedBosses.frost_titan || 0) > 0) ? 3 : Math.min(2, s.olympusMaxFloor),
        isUnlocked: (s) => s.olympusMaxFloor >= 3 || (s.defeatedBosses.frost_titan || 0) > 0
    },
    {
        id: 'banner_cyber_matrix', name: 'Kiloumpas Grid', rarity: 'epic', cssClass: 'cos-banner-cyber',
        desc: 'Live cybernetic neon scan beam sweeping over dark syndicate circuitry.',
        unlockHint: 'Defeat Kiloumpas (Story Wave 15)',
        targetVal: () => 15, currentVal: (s) => ((s.defeatedBosses.kiloumpas || 0) > 0 || s.storyMaxWave >= 15) ? 15 : Math.min(14, s.storyMaxWave),
        isUnlocked: (s) => (s.defeatedBosses.kiloumpas || 0) > 0 || s.storyMaxWave >= 15
    },
    {
        id: 'banner_vulcan_forge', name: 'Vulcan Reactor', rarity: 'legendary', cssClass: 'cos-banner-inferno',
        desc: 'Surging magma waves and blazing amber heat-shimmer for boss hunters.',
        unlockHint: 'Defeat 10 Endless Mini-Bosses',
        targetVal: () => 10, currentVal: (s) => Math.min(10, s.endlessMiniBossKills), isUnlocked: (s) => s.endlessMiniBossKills >= 10
    },
    {
        id: 'banner_squad_collector', name: 'Squad Collector', rarity: 'legendary', cssClass: 'cos-banner-squad',
        desc: 'Polished championship gold sheen flashing over comic-ink halftone.',
        unlockHint: 'Unlock 4 Heroes in the Roster',
        targetVal: () => 4, currentVal: (s) => Math.min(4, s.unlockedHeroesCount || 1), isUnlocked: (s) => (s.unlockedHeroesCount || 1) >= 4
    },
    {
        id: 'banner_eternal_nexus', name: 'Eternal Nexus', rarity: 'celestial', cssClass: 'cos-banner-nexus',
        desc: 'ULTRA RARE: Shifting holographic plasma waves and twin prismatic lightbeams.',
        unlockHint: 'Reach 2,000,000 High Score in a single run',
        targetVal: () => 2000000, currentVal: (s) => Math.min(2000000, s.highScore), isUnlocked: (s) => s.highScore >= 2000000
    }
];

const PROFILE_FRAMES = [
    {
        id: 'frame_rookie',
        name: 'Classic Ink',
        rarity: 'common',
        cssClass: 'cos-frame-rookie',
        accent: '#1e272e',
        desc: 'Bold cartoon outline frame.',
        unlockHint: 'Unlocked by default',
        targetVal: () => 1,
        currentVal: () => 1,
        isUnlocked: () => true
    },
    {
        id: 'frame_bronze_laurel',
        name: 'Arena Veteran',
        rarity: 'rare',
        cssClass: 'cos-frame-bronze',
        accent: '#38bdf8',
        desc: 'Tempered steel halo for dedicated arena fighters.',
        unlockHint: 'Reach Account Level 5 or 1,000 Total Kills',
        targetVal: () => 5,
        currentVal: (s) => (s.accountLevel >= 5 || s.totalKills >= 1000) ? 5 : Math.min(4, s.accountLevel),
        isUnlocked: (s) => s.accountLevel >= 5 || s.totalKills >= 1000
    },
    {
        id: 'frame_kiloumpas_neon',
        name: 'Syndicate Neon',
        rarity: 'epic',
        cssClass: 'cos-frame-neon',
        accent: '#c084fc',
        desc: 'Electric violet ring from defeating Kiloumpas in Story or Olympus.',
        unlockHint: 'Defeat Kiloumpas (Story W15) or clear Olympus Floor 3',
        targetVal: () => 1,
        currentVal: (s) => ((s.defeatedBosses.kiloumpas || 0) > 0 || s.storyMaxWave >= 15 || s.olympusMaxFloor >= 3) ? 1 : 0,
        isUnlocked: (s) => (s.defeatedBosses.kiloumpas || 0) > 0 || s.storyMaxWave >= 15 || s.olympusMaxFloor >= 3
    },
    {
        id: 'frame_grand_veteran',
        name: 'Champion Laurel',
        rarity: 'legendary',
        cssClass: 'cos-frame-laurel',
        accent: '#fbbf24',
        desc: 'Golden laurel crest for seasoned veterans.',
        unlockHint: 'Reach Account Level 15 or complete 25 Matches',
        targetVal: () => 25,
        currentVal: (s) => (s.accountLevel >= 15 || s.matchesPlayed >= 25) ? 25 : Math.min(24, s.matchesPlayed),
        isUnlocked: (s) => s.accountLevel >= 15 || s.matchesPlayed >= 25
    },
    {
        id: 'frame_olympian_crown',
        name: 'Zeus Nimbus',
        rarity: 'legendary',
        cssClass: 'cos-frame-zeus',
        accent: '#38bdf8',
        desc: 'Crackling sky-gold thunder ring bestowed upon Zeus slayers.',
        unlockHint: 'Defeat Zeus atop Mount Olympus (Floor 5)',
        targetVal: () => 1,
        currentVal: (s) => (s.defeatedBosses.zeus || 0) > 0 ? 1 : 0,
        isUnlocked: (s) => (s.defeatedBosses.zeus || 0) > 0
    },
    {
        id: 'frame_mecha_crimson',
        name: 'Kolossos Core',
        rarity: 'mythic',
        cssClass: 'cos-frame-mecha',
        accent: '#f43f5e',
        desc: 'Spinning red-ember targeting bezel of the Wave 40 Endless Boss.',
        unlockHint: 'Reach Wave 40 in Endless Mode',
        targetVal: () => 40,
        currentVal: (s) => Math.min(40, s.endlessMaxWave),
        isUnlocked: (s) => s.endlessMaxWave >= 40
    },
    {
        id: 'frame_star_halo',
        name: 'Star-Stone Halo',
        rarity: 'celestial',
        cssClass: 'cos-frame-star',
        accent: '#fde047',
        desc: 'ULTRA RARE: Orbiting golden star aura of the Olympian Star-Stone.',
        unlockHint: 'Acquire an Olympian Star-Stone (0.8% Olympus F5 drop)',
        targetVal: () => 1,
        currentVal: (s) => s.olympianStarStones > 0 ? 1 : 0,
        isUnlocked: (s) => s.olympianStarStones > 0
    },
    {
        id: 'frame_w50_omega',
        name: 'Omega Prismatic',
        rarity: 'celestial',
        cssClass: 'cos-frame-omega',
        accent: '#22d3ee',
        desc: 'ULTRA RARE: Living prismatic overdrive crown for true apex legends.',
        unlockHint: 'Reach Endless Wave 50 & 25,000 Total Kills',
        targetVal: () => 50,
        currentVal: (s) => (s.endlessMaxWave >= 50 && s.totalKills >= 25000) ? 50 : Math.min(49, s.endlessMaxWave),
        isUnlocked: (s) => s.endlessMaxWave >= 50 && s.totalKills >= 25000
    },
    {
        id: 'frame_frost_shard', name: 'Glacier Shard', rarity: 'rare', cssClass: 'cos-frame-frost', accent: '#67e8f9',
        desc: 'Rotating sapphire-frost energy bezel forged at Story Wave 10.',
        unlockHint: 'Reach Story Wave 10 or defeat Kleanthis',
        targetVal: () => 10, currentVal: (s) => ((s.defeatedBosses.kleanthis || 0) > 0 || s.storyMaxWave >= 10) ? 10 : Math.min(9, s.storyMaxWave),
        isUnlocked: (s) => (s.defeatedBosses.kleanthis || 0) > 0 || s.storyMaxWave >= 10
    },
    {
        id: 'frame_blaze_ring', name: 'Inferno Core', rarity: 'epic', cssClass: 'cos-frame-ember', accent: '#fb923c',
        desc: 'Spinning solar-flare ember ring for Endless endurance fighters.',
        unlockHint: 'Reach Wave 25 in Endless Mode',
        targetVal: () => 25, currentVal: (s) => Math.min(25, s.endlessMaxWave), isUnlocked: (s) => s.endlessMaxWave >= 25
    },
    {
        id: 'frame_cyber_radar', name: 'Cyber Telemetry', rarity: 'epic', cssClass: 'cos-frame-radar', accent: '#34d399',
        desc: 'High-speed rotating tactical radar sweep around your avatar.',
        unlockHint: 'Reach 500,000 High Score',
        targetVal: () => 500000, currentVal: (s) => Math.min(500000, s.highScore), isUnlocked: (s) => s.highScore >= 500000
    },
    {
        id: 'frame_toxic_alchemist', name: 'Venom Overload', rarity: 'legendary', cssClass: 'cos-frame-venom', accent: '#a3e635',
        desc: 'Swirling radioactive acid-emerald plasma circuit.',
        unlockHint: 'Reach 15,000 Total Kills',
        targetVal: () => 15000, currentVal: (s) => Math.min(15000, s.totalKills), isUnlocked: (s) => s.totalKills >= 15000
    },
    {
        id: 'frame_phantom_eclipse', name: 'Void Eclipse', rarity: 'mythic', cssClass: 'cos-frame-eclipse', accent: '#d946ef',
        desc: 'Orbiting obsidian & ultraviolet eclipse corona.',
        unlockHint: 'Defeat 25 Endless Mini-Bosses',
        targetVal: () => 25, currentVal: (s) => Math.min(25, s.endlessMiniBossKills), isUnlocked: (s) => s.endlessMiniBossKills >= 25
    },
    {
        id: 'frame_chrono_overdrive', name: 'Chrono Overdrive', rarity: 'celestial', cssClass: 'cos-frame-chrono', accent: '#facc15',
        desc: 'ULTRA RARE: Twin-spectrum orbiting chrono prism & supernova flare.',
        unlockHint: 'Reach 2,500,000 High Score OR Account Level 30',
        targetVal: () => 2500000, currentVal: (s) => s.accountLevel >= 30 ? 2500000 : Math.min(2500000, s.highScore),
        isUnlocked: (s) => s.highScore >= 2500000 || s.accountLevel >= 30
    }
];

const MILESTONE_COINS = [
    {
        id: 'coin_first_blood',
        name: 'First Blood Coin',
        shortTag: '100 KILLS',
        rarity: 'common',
        rim: '#94a3b8',
        core: '#334155',
        glyph: 'sword',
        desc: 'Minted after your first real brawl in the arena.',
        unlockHint: 'Reach 100 Total Kills',
        targetVal: () => 100,
        currentVal: (s) => Math.min(100, s.totalKills),
        isUnlocked: (s) => s.totalKills >= 100
    },
    {
        id: 'coin_kleanthis',
        name: 'Skatmir Brute Coin',
        shortTag: 'STORY W10',
        rarity: 'rare',
        rim: '#38bdf8',
        core: '#0c4a6e',
        glyph: 'fist',
        desc: 'Commemorates toppling Kleanthis at Wave 10.',
        unlockHint: 'Defeat Kleanthis (Story Wave 10)',
        targetVal: () => 10,
        currentVal: (s) => ((s.defeatedBosses.kleanthis || 0) > 0 || s.storyMaxWave >= 10) ? 10 : Math.min(9, s.storyMaxWave),
        isUnlocked: (s) => (s.defeatedBosses.kleanthis || 0) > 0 || s.storyMaxWave >= 10
    },
    {
        id: 'coin_story_clear',
        name: 'Rouf Vanquisher',
        shortTag: 'STORY W20',
        rarity: 'epic',
        rim: '#c084fc',
        core: '#4c1d95',
        glyph: 'crown',
        desc: 'Awarded for conquering all 20 waves of Story Mode.',
        unlockHint: 'Defeat Rouf (Story Wave 20)',
        targetVal: () => 20,
        currentVal: (s) => ((s.defeatedBosses.rouf || 0) > 0 || s.storyMaxWave >= 20) ? 20 : Math.min(19, s.storyMaxWave),
        isUnlocked: (s) => (s.defeatedBosses.rouf || 0) > 0 || s.storyMaxWave >= 20
    },
    {
        id: 'coin_endless_20',
        name: 'Endless Survivor',
        shortTag: 'ENDLESS W20',
        rarity: 'rare',
        rim: '#f59e0b',
        core: '#78350f',
        glyph: 'flame',
        desc: 'Proof you survived 20 escalating waves of Endless chaos.',
        unlockHint: 'Reach Wave 20 in Endless Mode',
        targetVal: () => 20,
        currentVal: (s) => Math.min(20, s.endlessMaxWave),
        isUnlocked: (s) => s.endlessMaxWave >= 20
    },
    {
        id: 'coin_endless_40',
        name: 'W40 Mecha Medallion',
        shortTag: 'ENDLESS W40',
        rarity: 'mythic',
        rim: '#fb7185',
        core: '#881337',
        glyph: 'mecha',
        desc: 'Forged in crimson mist for reaching Endless Wave 40.',
        unlockHint: 'Reach Wave 40 in Endless Mode',
        targetVal: () => 40,
        currentVal: (s) => Math.min(40, s.endlessMaxWave),
        isUnlocked: (s) => s.endlessMaxWave >= 40
    },
    {
        id: 'coin_zeus_ascend',
        name: 'Olympus Ascended',
        shortTag: 'ZEUS SLAIN',
        rarity: 'mythic',
        rim: '#fde047',
        core: '#075985',
        glyph: 'bolt',
        desc: 'Struck from golden thunder atop Mount Olympus Floor 5.',
        unlockHint: 'Defeat Zeus (Mount Olympus Floor 5)',
        targetVal: () => 1,
        currentVal: (s) => (s.defeatedBosses.zeus || 0) > 0 ? 1 : 0,
        isUnlocked: (s) => (s.defeatedBosses.zeus || 0) > 0
    },
    {
        id: 'coin_slayer_10k',
        name: '10K Reaper Seal',
        shortTag: '10K KILLS',
        rarity: 'legendary',
        rim: '#34d399',
        core: '#064e3b',
        glyph: 'skull',
        desc: 'Awarded to relentless slayers with 10,000 career kills.',
        unlockHint: 'Reach 10,000 Total Kills',
        targetVal: () => 10000,
        currentVal: (s) => Math.min(10000, s.totalKills),
        isUnlocked: (s) => s.totalKills >= 10000
    },
    {
        id: 'coin_god_level',
        name: 'Veteran Lv.20 Seal',
        shortTag: 'LVL 20',
        rarity: 'legendary',
        rim: '#fbbf24',
        core: '#451a03',
        glyph: 'shield',
        desc: 'Golden crest of an Account Level 20 veteran.',
        unlockHint: 'Reach Account Level 20',
        targetVal: () => 20,
        currentVal: (s) => Math.min(20, s.accountLevel),
        isUnlocked: (s) => s.accountLevel >= 20
    },
    {
        id: 'coin_endless_50',
        name: 'W50 Abyssal Coin',
        shortTag: 'ENDLESS W50',
        rarity: 'celestial',
        rim: '#22d3ee',
        core: '#1e1b4b',
        glyph: 'infinity',
        desc: 'ULTRA RARE: Proof you defied extinction past Endless Wave 50.',
        unlockHint: 'Reach Wave 50 in Endless Mode',
        targetVal: () => 50,
        currentVal: (s) => Math.min(50, s.endlessMaxWave),
        isUnlocked: (s) => s.endlessMaxWave >= 50
    },
    {
        id: 'coin_zeus_master',
        name: 'Olympian Conqueror',
        shortTag: '3X ZEUS',
        rarity: 'celestial',
        rim: '#f472b6',
        core: '#3b0764',
        glyph: 'trident',
        desc: 'ULTRA RARE: Dethroned Zeus atop Mount Olympus three times.',
        unlockHint: 'Defeat Zeus 3 times',
        targetVal: () => 3,
        currentVal: (s) => Math.min(3, s.defeatedBosses.zeus || 0),
        isUnlocked: (s) => (s.defeatedBosses.zeus || 0) >= 3
    },
    {
        id: 'coin_star_stone',
        name: 'Star-Stone Relic',
        shortTag: 'STAR 0.8%',
        rarity: 'celestial',
        rim: '#fde047',
        core: '#0f172a',
        glyph: 'star',
        desc: 'ULTRA RARE: Pulled the 0.8% Olympian Star-Stone jackpot.',
        unlockHint: 'Acquire an Olympian Star-Stone',
        targetVal: () => 1,
        currentVal: (s) => s.olympianStarStones > 0 ? 1 : 0,
        isUnlocked: (s) => s.olympianStarStones > 0
    },
    {
        id: 'coin_slayer_50k',
        name: '50K Immortal Coin',
        shortTag: '50K KILLS',
        rarity: 'celestial',
        rim: '#fbbf24',
        core: '#09090b',
        glyph: 'crown',
        desc: 'ULTRA RARE: Inscribed with 50,000 lifetime enemy eliminations.',
        unlockHint: 'Reach 50,000 Total Kills',
        targetVal: () => 50000,
        currentVal: (s) => Math.min(50000, s.totalKills),
        isUnlocked: (s) => s.totalKills >= 50000
    }
];

if (typeof window !== 'undefined') {
    window.COSMETIC_RARITIES = COSMETIC_RARITIES;
    window.PROFILE_BANNERS = PROFILE_BANNERS;
    window.PROFILE_FRAMES = PROFILE_FRAMES;
    window.MILESTONE_COINS = MILESTONE_COINS;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { COSMETIC_RARITIES, PROFILE_BANNERS, PROFILE_FRAMES, MILESTONE_COINS };
}
