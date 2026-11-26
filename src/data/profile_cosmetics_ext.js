/**
 * Lesa.io - Extended Animated Profile Banners, Kinetic Frames & Minted Coins
 * Appends 8 high-craft animated banners, 8 orbital frames, and 8 multi-tier
 * minted Milestone Coins into the global registries cleanly.
 */

(function registerExtendedCosmetics() {
    const banners = (typeof PROFILE_BANNERS !== 'undefined') ? PROFILE_BANNERS : null;
    const frames = (typeof PROFILE_FRAMES !== 'undefined') ? PROFILE_FRAMES : null;
    const coins = (typeof MILESTONE_COINS !== 'undefined') ? MILESTONE_COINS : null;

    const EXTRA_BANNERS = [
        {
            id: 'banner_kafenio_dusk',
            name: 'Kafenio Golden Dusk',
            rarity: 'rare',
            cssClass: 'cos-banner-kafenio-dusk',
            fxTheme: 'embers_warm',
            desc: 'Warm Aegean dusk light drifting with glowing cafe lantern motes.',
            unlockHint: 'Reach Wave 5 in Story Mode',
            targetVal: () => 5,
            currentVal: (s) => Math.min(5, Math.max(s.storyMaxWave, s.endlessMaxWave)),
            isUnlocked: (s) => Math.max(s.storyMaxWave, s.endlessMaxWave) >= 5
        },
        {
            id: 'banner_kiloumpas_yeet',
            name: 'Yeet Impact Burst',
            rarity: 'rare',
            cssClass: 'cos-banner-kiloumpas-yeet',
            fxTheme: 'chevrons',
            desc: 'High-energy comic speedlines surging with golden impact flares.',
            unlockHint: 'Reach 2,500 Total Kills',
            targetVal: () => 2500,
            currentVal: (s) => Math.min(2500, s.totalKills),
            isUnlocked: (s) => s.totalKills >= 2500
        },
        {
            id: 'banner_village_blaze',
            name: 'W37 Village Inferno',
            rarity: 'epic',
            cssClass: 'cos-banner-village-blaze',
            fxTheme: 'firestorm',
            desc: 'Live rising embers and crimson horizon waves from the burning village.',
            unlockHint: 'Reach Wave 37 in Endless Mode',
            targetVal: () => 37,
            currentVal: (s) => Math.min(37, s.endlessMaxWave),
            isUnlocked: (s) => s.endlessMaxWave >= 37
        },
        {
            id: 'banner_vf185_turbo',
            name: 'Chrono Emerald Rift',
            rarity: 'legendary',
            cssClass: 'cos-banner-chrono-rift',
            fxTheme: 'chrono_rift',
            desc: 'Counter-rotating emerald time-portal rings, pulsing bio-plasma waves & floating quantum shards.',
            unlockHint: 'Complete 40 Matches or Defeat 5 Endless Mini-Bosses',
            targetVal: () => 40,
            currentVal: (s) => (s.endlessMiniBossKills >= 5) ? 40 : Math.min(40, s.matchesPlayed),
            isUnlocked: (s) => s.matchesPlayed >= 40 || s.endlessMiniBossKills >= 5
        },
        {
            id: 'banner_vf185_apex',
            name: 'SYM VF 185 Kolones',
            rarity: 'exclusive',
            cssClass: 'cos-banner-vf185-apex',
            fxTheme: 'vf185_overdrive',
            hiddenUntilUnlocked: true,
            devGiftOnly: true,
            desc: 'EXCLUSIVE: Live 12,000 RPM Kolones redline tachometer, spinning 17" rims, exhaust flames & LED headlight overdrive.',
            unlockHint: 'Exclusive Developer Gift Only',
            targetVal: () => 1,
            currentVal: () => 0,
            isUnlocked: () => false
        },
        {
            id: 'banner_olympus_lightning',
            name: 'Parthenon Storm',
            rarity: 'legendary',
            cssClass: 'cos-banner-olympus-lightning',
            fxTheme: 'lightning',
            desc: 'Summit marble swept by crackling cerulean-gold thunderbolts.',
            unlockHint: 'Reach Mount Olympus Floor 5',
            targetVal: () => 5,
            currentVal: (s) => Math.min(5, s.olympusMaxFloor),
            isUnlocked: (s) => s.olympusMaxFloor >= 5
        },
        {
            id: 'banner_helios_core',
            name: 'Helios Omega Reactor',
            rarity: 'mythic',
            cssClass: 'cos-banner-helios-core',
            fxTheme: 'firestorm',
            desc: 'Crimson-gold solar singularity beam arcing over molten reactor alloy.',
            unlockHint: 'Defeat Kolossos MK-IV (Endless Wave 40)',
            targetVal: () => 41,
            currentVal: (s) => ((s.defeatedBosses.mecha_kolossos || 0) > 0 || s.endlessMaxWave >= 41) ? 41 : Math.min(40, s.endlessMaxWave),
            isUnlocked: (s) => (s.defeatedBosses.mecha_kolossos || 0) > 0 || s.endlessMaxWave >= 41
        },
        {
            id: 'banner_lil_xas',
            name: 'Lil Xas VIP',
            rarity: 'mythic',
            cssClass: 'cos-banner-lil-xas',
            fxTheme: 'lil_xas',
            desc: 'Limited VIP concert banner featuring Lil Xas himself in neon autotune overdrive.',
            unlockHint: 'Defeat the Secret Easter Egg Boss: Lil Xas',
            targetVal: () => 1,
            currentVal: (s) => ((s.defeatedBosses && s.defeatedBosses.lil_xas) || 0) > 0 ? 1 : 0,
            isUnlocked: (s) => ((s.defeatedBosses && s.defeatedBosses.lil_xas) || 0) > 0
        },
        {
            id: 'banner_holo_prisma',
            name: 'Holographic Foil',
            rarity: 'celestial',
            cssClass: 'cos-banner-holo-prisma',
            fxTheme: 'cosmic',
            desc: 'ULTRA RARE: Cursor-reactive prismatic foil & sparkling starfield aurora.',
            unlockHint: 'Reach 1,000,000 High Score',
            targetVal: () => 1000000,
            currentVal: (s) => Math.min(1000000, s.highScore),
            isUnlocked: (s) => s.highScore >= 1000000
        },
        {
            id: 'banner_apex_transcendent',
            name: 'APEX Overdrive',
            rarity: 'celestial',
            cssClass: 'cos-banner-apex-transcendent',
            fxTheme: 'apex_nova',
            desc: 'ULTRA RARE: Obsidian-crimson chromatic prism radiating supernova lasers.',
            unlockHint: 'Reach Endless Wave 60 OR 75,000 Total Kills',
            targetVal: () => 60,
            currentVal: (s) => (s.totalKills >= 75000) ? 60 : Math.min(60, s.endlessMaxWave),
            isUnlocked: (s) => s.endlessMaxWave >= 60 || s.totalKills >= 75000
        },
        {
            id: 'banner_clan_spartan',
            name: 'Spartan Phalanx',
            rarity: 'epic',
            cssClass: 'cos-banner-clan-spartan',
            fxTheme: 'embers_warm',
            clanShopOnly: true,
            desc: 'CLAN SHOP: Crimson & gold Spartan shieldwall banner swept by ember sparks.',
            unlockHint: 'Buy in Clan Shop (260 Honor Crests)',
            targetVal: () => 1,
            currentVal: () => (typeof ClanBuffs !== 'undefined' && ClanBuffs.hasBanner('banner_clan_spartan')) ? 1 : 0,
            isUnlocked: () => typeof ClanBuffs !== 'undefined' && ClanBuffs.hasBanner('banner_clan_spartan')
        },
        {
            id: 'banner_clan_obsidian',
            name: 'Obsidian Citadel',
            rarity: 'mythic',
            cssClass: 'cos-banner-clan-obsidian',
            fxTheme: 'lightning',
            clanShopOnly: true,
            desc: 'CLAN SHOP: Sovereign royal purple & gilded obsidian Citadel banner.',
            unlockHint: 'Buy in Clan Shop (450 Honor Crests)',
            targetVal: () => 1,
            currentVal: () => (typeof ClanBuffs !== 'undefined' && ClanBuffs.hasBanner('banner_clan_obsidian')) ? 1 : 0,
            isUnlocked: () => typeof ClanBuffs !== 'undefined' && ClanBuffs.hasBanner('banner_clan_obsidian')
        },
        {
            id: 'banner_hard_caustic',
            name: 'Caustic Fissure',
            rarity: 'epic',
            cssClass: 'cos-banner-hard-caustic',
            fxTheme: 'hard_caustic',
            desc: 'Endless Hard Hazard: Jagged lava cracks leaking glowing neon bio-acid bubbles.',
            unlockHint: 'Reach Wave 15 in Endless Hard',
            targetVal: () => 15,
            currentVal: (s) => Math.min(15, s.endlessHardMaxWave || 0),
            isUnlocked: (s) => (s.endlessHardMaxWave || 0) >= 15
        },
        {
            id: 'banner_hard_sovereign',
            name: 'Alpha’s Pylon',
            rarity: 'mythic',
            cssClass: 'cos-banner-hard-pylon',
            fxTheme: 'hard_pylon',
            desc: 'Levitating crimson Ruin Pylons locking orbital laser tethers across fractured obsidian.',
            unlockHint: 'Reach Endless Hard Wave 30 OR Defeat Alpha',
            targetVal: () => 30,
            currentVal: (s) => ((s.defeatedBosses.apex_sovereign_w30 || 0) > 0 || (s.endlessHardMaxWave || 0) >= 30) ? 30 : Math.min(29, s.endlessHardMaxWave || 0),
            isUnlocked: (s) => (s.defeatedBosses.apex_sovereign_w30 || 0) > 0 || (s.endlessHardMaxWave || 0) >= 30
        },
        {
            id: 'banner_hard_void_archon',
            name: 'Void Archon',
            rarity: 'mythic',
            cssClass: 'cos-banner-hard-void',
            fxTheme: 'hard_void',
            desc: 'Watchful Abyssal Eye tearing open glitching gravity rifts and spiraling void shards.',
            unlockHint: 'Reach Wave 45 in Endless Hard',
            targetVal: () => 45,
            currentVal: (s) => Math.min(45, s.endlessHardMaxWave || 0),
            isUnlocked: (s) => (s.endlessHardMaxWave || 0) >= 45
        },
        {
            id: 'banner_hard_omega',
            name: 'Omega Oblivion',
            rarity: 'celestial',
            cssClass: 'cos-banner-hard-omega',
            fxTheme: 'hard_omega',
            desc: 'HARD ENDLESS APEX: Spinning eclipse crown rings, sweeping devastation lasers & supernova flares.',
            unlockHint: 'Reach Endless Hard Wave 60 OR Defeat Apex Omega',
            targetVal: () => 60,
            currentVal: (s) => ((s.defeatedBosses.apex_omega_w60 || 0) > 0 || (s.endlessHardMaxWave || 0) >= 60) ? 60 : Math.min(59, s.endlessHardMaxWave || 0),
            isUnlocked: (s) => (s.defeatedBosses.apex_omega_w60 || 0) > 0 || (s.endlessHardMaxWave || 0) >= 60
        }
    ];

    const EXTRA_FRAMES = [
        {
            id: 'frame_flame_crown',
            name: 'Ember Wraith',
            rarity: 'rare',
            cssClass: 'cos-frame-flame',
            accent: '#fb923c',
            fxRing: 'embers',
            desc: 'Counter-rotating molten amber halo with ember rim glow.',
            unlockHint: 'Reach 3,000 Total Kills',
            targetVal: () => 3000,
            currentVal: (s) => Math.min(3000, s.totalKills),
            isUnlocked: (s) => s.totalKills >= 3000
        },
        {
            id: 'frame_vf185_mag',
            name: 'VF185 Carbon Mag',
            rarity: 'epic',
            cssClass: 'cos-frame-vf185',
            accent: '#ff4785',
            fxRing: 'cyber',
            desc: 'Carbon fiber bezel accented by rotating VF185 magenta-gold caliper arcs.',
            unlockHint: 'Complete 30 Matches',
            targetVal: () => 30,
            currentVal: (s) => Math.min(30, s.matchesPlayed),
            isUnlocked: (s) => s.matchesPlayed >= 30
        },
        {
            id: 'frame_olympus_marble',
            name: 'Alpine Marble Trim',
            rarity: 'epic',
            cssClass: 'cos-frame-marble',
            accent: '#7dd3fc',
            fxRing: 'laurel',
            desc: 'Crisp marble gold bezel forged high along Mount Olympus.',
            unlockHint: 'Reach Mount Olympus Floor 4',
            targetVal: () => 4,
            currentVal: (s) => Math.min(4, s.olympusMaxFloor),
            isUnlocked: (s) => s.olympusMaxFloor >= 4
        },
        {
            id: 'frame_sakura_cyber',
            name: 'Neon Katana',
            rarity: 'legendary',
            cssClass: 'cos-frame-sakura',
            accent: '#f472b6',
            fxRing: 'cyber',
            desc: 'Dual-phase neon pink & electric cyan rotating blade arcs.',
            unlockHint: 'Unlock 6 Arsenal Weapons OR 750,000 Score',
            targetVal: () => 6,
            currentVal: (s) => (s.highScore >= 750000) ? 6 : Math.min(6, s.unlockedWeaponsCount || 1),
            isUnlocked: (s) => (s.unlockedWeaponsCount || 1) >= 6 || s.highScore >= 750000
        },
        {
            id: 'frame_titan_reactor',
            name: 'Hazard Turbine',
            rarity: 'mythic',
            cssClass: 'cos-frame-reactor',
            accent: '#facc15',
            fxRing: 'reticle',
            desc: 'Segmented caution-gold & crimson industrial turbine overlay.',
            unlockHint: 'Defeat 15 Endless Mini-Bosses',
            targetVal: () => 15,
            currentVal: (s) => Math.min(15, s.endlessMiniBossKills),
            isUnlocked: (s) => s.endlessMiniBossKills >= 15
        },
        {
            id: 'frame_helios_omega',
            name: 'Helios Singularity',
            rarity: 'mythic',
            cssClass: 'cos-frame-helios',
            accent: '#ff3838',
            fxRing: 'orbital',
            desc: 'Blazing crimson-gold solar core ring looted from conquering Wave 40.',
            unlockHint: 'Defeat Kolossos MK-IV (Endless Wave 40)',
            targetVal: () => 41,
            currentVal: (s) => ((s.defeatedBosses.mecha_kolossos || 0) > 0 || s.endlessMaxWave >= 41) ? 41 : Math.min(40, s.endlessMaxWave),
            isUnlocked: (s) => (s.defeatedBosses.mecha_kolossos || 0) > 0 || s.endlessMaxWave >= 41
        },
        {
            id: 'frame_cosmic_vortex',
            name: 'Galactic Supernova',
            rarity: 'celestial',
            cssClass: 'cos-frame-cosmic',
            accent: '#a78bfa',
            fxRing: 'orbital',
            desc: 'ULTRA RARE: Deep nebula prism orbiting with live starlight flares.',
            unlockHint: 'Reach Account Level 25 OR Play 75 Matches',
            targetVal: () => 25,
            currentVal: (s) => (s.matchesPlayed >= 75) ? 25 : Math.min(25, s.accountLevel),
            isUnlocked: (s) => s.accountLevel >= 25 || s.matchesPlayed >= 75
        },
        {
            id: 'frame_apex_deity',
            name: 'APEX Sovereign',
            rarity: 'celestial',
            cssClass: 'cos-frame-apex',
            accent: '#ff2e4c',
            fxRing: 'apex',
            desc: 'ULTRA RARE: Chromatic crimson-gold apex crown with twin rotating orbital lasers.',
            unlockHint: 'Reach Endless Wave 60 OR Defeat Zeus 10 Times',
            targetVal: () => 60,
            currentVal: (s) => ((s.defeatedBosses.zeus || 0) >= 10) ? 60 : Math.min(60, s.endlessMaxWave),
            isUnlocked: (s) => s.endlessMaxWave >= 60 || (s.defeatedBosses.zeus || 0) >= 10
        },
        {
            id: 'frame_hard_caustic',
            name: 'Caustic Hazard',
            rarity: 'epic',
            cssClass: 'cos-frame-hard-caustic',
            accent: '#a3e635',
            fxRing: 'hard_caustic',
            desc: 'Orbiting toxic acid droplets & hazard chevrons over dark magma alloy.',
            unlockHint: 'Reach Wave 15 in Endless Hard',
            targetVal: () => 15,
            currentVal: (s) => Math.min(15, s.endlessHardMaxWave || 0),
            isUnlocked: (s) => (s.endlessHardMaxWave || 0) >= 15
        },
        {
            id: 'frame_hard_pylon',
            name: 'Sovereign Crown',
            rarity: 'mythic',
            cssClass: 'cos-frame-hard-pylon',
            accent: '#ff4757',
            fxRing: 'hard_pylon',
            desc: 'Spinning Ruin Pylon diamonds locked by crimson orbital laser ticks.',
            unlockHint: 'Reach Endless Hard Wave 30 OR Defeat Alpha',
            targetVal: () => 30,
            currentVal: (s) => ((s.defeatedBosses.apex_sovereign_w30 || 0) > 0 || (s.endlessHardMaxWave || 0) >= 30) ? 30 : Math.min(29, s.endlessHardMaxWave || 0),
            isUnlocked: (s) => (s.defeatedBosses.apex_sovereign_w30 || 0) > 0 || (s.endlessHardMaxWave || 0) >= 30
        },
        {
            id: 'frame_hard_void',
            name: 'Abyssal Watcher',
            rarity: 'mythic',
            cssClass: 'cos-frame-hard-void',
            accent: '#d946ef',
            fxRing: 'hard_void',
            desc: 'Ultraviolet Void Archon rift ring with orbiting obsidian monolith shards.',
            unlockHint: 'Reach Wave 45 in Endless Hard',
            targetVal: () => 45,
            currentVal: (s) => Math.min(45, s.endlessHardMaxWave || 0),
            isUnlocked: (s) => (s.endlessHardMaxWave || 0) >= 45
        },
        {
            id: 'frame_hard_omega',
            name: 'Oblivion Apex',
            rarity: 'celestial',
            cssClass: 'cos-frame-hard-omega',
            accent: '#fde047',
            fxRing: 'hard_omega',
            desc: 'HARD ENDLESS APEX: Twin counter-spinning Omega rings crowned with solar-crimson flares.',
            unlockHint: 'Reach Endless Hard Wave 60 OR Defeat Apex Omega',
            targetVal: () => 60,
            currentVal: (s) => ((s.defeatedBosses.apex_omega_w60 || 0) > 0 || (s.endlessHardMaxWave || 0) >= 60) ? 60 : Math.min(59, s.endlessHardMaxWave || 0),
            isUnlocked: (s) => (s.defeatedBosses.apex_omega_w60 || 0) > 0 || (s.endlessHardMaxWave || 0) >= 60
        }
    ];

    const EXTRA_COINS = [
        {
            id: 'coin_survivor_5k',
            name: '5K Marauder Coin',
            shortTag: '5K KILLS',
            rarity: 'rare',
            rim: '#38bdf8',
            core: '#0f172a',
            glyph: 'swords',
            desc: 'Double-struck steel coin minted at 5,000 career eliminations.',
            unlockHint: 'Reach 5,000 Total Kills',
            targetVal: () => 5000,
            currentVal: (s) => Math.min(5000, s.totalKills),
            isUnlocked: (s) => s.totalKills >= 5000
        },
        {
            id: 'coin_kafenio_regular',
            name: 'Arena Regular Seal',
            shortTag: '35 GAMES',
            rarity: 'rare',
            rim: '#fb923c',
            core: '#431407',
            glyph: 'flame',
            desc: 'Bronze cafe token earned after 35 fierce arena battles.',
            unlockHint: 'Play 35 Matches',
            targetVal: () => 35,
            currentVal: (s) => Math.min(35, s.matchesPlayed),
            isUnlocked: (s) => s.matchesPlayed >= 35
        },
        {
            id: 'coin_olympus_climber',
            name: 'Alpine Frost Coin',
            shortTag: 'OLYMPUS F3',
            rarity: 'epic',
            rim: '#67e8f9',
            core: '#083344',
            glyph: 'trident',
            desc: 'Glacial silver medallion forged atop Olympus Floor 3.',
            unlockHint: 'Reach Mount Olympus Floor 3',
            targetVal: () => 3,
            currentVal: (s) => Math.min(3, s.olympusMaxFloor),
            isUnlocked: (s) => s.olympusMaxFloor >= 3
        },
        {
            id: 'coin_boss_hunter',
            name: 'Bounty Hunter Coin',
            shortTag: '10 MINIBOSS',
            rarity: 'epic',
            rim: '#c084fc',
            core: '#3b0764',
            glyph: 'skull',
            desc: 'Violet trophy crest awarded for dismantling 10 Endless Mini-Bosses.',
            unlockHint: 'Defeat 10 Endless Mini-Bosses',
            targetVal: () => 10,
            currentVal: (s) => Math.min(10, s.endlessMiniBossKills),
            isUnlocked: (s) => s.endlessMiniBossKills >= 10
        },
        {
            id: 'coin_arsenal_master',
            name: 'Armory Collector Coin',
            shortTag: '6 WEAPONS',
            rarity: 'legendary',
            rim: '#facc15',
            core: '#1e1b4b',
            glyph: 'vf185',
            desc: 'Golden street-tuner crest honoring collectors of 6+ weapons.',
            unlockHint: 'Unlock 6 Weapons in the Armory',
            targetVal: () => 6,
            currentVal: (s) => Math.min(6, s.unlockedWeaponsCount || 1),
            isUnlocked: (s) => (s.unlockedWeaponsCount || 1) >= 6
        },
        {
            id: 'coin_inferno_w37',
            name: 'W37 Firestorm Seal',
            shortTag: 'ENDLESS W37',
            rarity: 'legendary',
            rim: '#f97316',
            core: '#450a0a',
            glyph: 'flame',
            desc: 'Scorched obsidian medallion tempered in the burning village.',
            unlockHint: 'Reach Wave 37 in Endless Mode',
            targetVal: () => 37,
            currentVal: (s) => Math.min(37, s.endlessMaxWave),
            isUnlocked: (s) => s.endlessMaxWave >= 37
        },
        {
            id: 'coin_helios_apex',
            name: 'Helios Reactor Coin',
            shortTag: 'KOLOSSOS',
            rarity: 'mythic',
            rim: '#ff4757',
            core: '#141418',
            glyph: 'helios',
            desc: 'Blazing Crimson-Gold Omega Seal struck after toppling Kolossos MK-IV.',
            unlockHint: 'Defeat Kolossos MK-IV (Endless Wave 40)',
            targetVal: () => 41,
            currentVal: (s) => ((s.defeatedBosses.mecha_kolossos || 0) > 0 || s.endlessMaxWave >= 41) ? 41 : Math.min(40, s.endlessMaxWave),
            isUnlocked: (s) => (s.defeatedBosses.mecha_kolossos || 0) > 0 || s.endlessMaxWave >= 41
        },
        {
            id: 'coin_grand_apex',
            name: 'APEX Sovereign Seal',
            shortTag: 'ENDLESS W60',
            rarity: 'celestial',
            rim: '#fde047',
            core: '#18041c',
            glyph: 'omega',
            desc: 'ULTRA RARE: Living holo-prismatic crown minted at Endless Wave 60.',
            unlockHint: 'Reach Wave 60 in Endless Mode',
            targetVal: () => 60,
            currentVal: (s) => Math.min(60, s.endlessMaxWave),
            isUnlocked: (s) => s.endlessMaxWave >= 60
        },
        {
            id: 'coin_hard_15',
            name: 'Caustic Survivor Seal',
            shortTag: 'HARD W15',
            rarity: 'epic',
            rim: '#a3e635',
            core: '#1a2e05',
            glyph: 'caustic',
            desc: 'Toxic neon crest tempered through Endless Hard Wave 15 fissures.',
            unlockHint: 'Reach Wave 15 in Endless Hard',
            targetVal: () => 15,
            currentVal: (s) => Math.min(15, s.endlessHardMaxWave || 0),
            isUnlocked: (s) => (s.endlessHardMaxWave || 0) >= 15
        },
        {
            id: 'coin_hard_30',
            name: 'Alpha Slayer Coin',
            shortTag: 'HARD W30',
            rarity: 'mythic',
            rim: '#ff4757',
            core: '#450a0a',
            glyph: 'pylon',
            desc: 'Forged from the shattered Ruin Pylons of Endless Hard Wave 30.',
            unlockHint: 'Reach Endless Hard Wave 30 OR Defeat Alpha',
            targetVal: () => 30,
            currentVal: (s) => ((s.defeatedBosses.apex_sovereign_w30 || 0) > 0 || (s.endlessHardMaxWave || 0) >= 30) ? 30 : Math.min(29, s.endlessHardMaxWave || 0),
            isUnlocked: (s) => (s.defeatedBosses.apex_sovereign_w30 || 0) > 0 || (s.endlessHardMaxWave || 0) >= 30
        },
        {
            id: 'coin_hard_45',
            name: 'Archon Bane Coin',
            shortTag: 'HARD W45',
            rarity: 'mythic',
            rim: '#d946ef',
            core: '#2e1065',
            glyph: 'void_eye',
            desc: 'Ultraviolet Abyssal Eye sigil earned at Endless Hard Wave 45.',
            unlockHint: 'Reach Wave 45 in Endless Hard',
            targetVal: () => 45,
            currentVal: (s) => Math.min(45, s.endlessHardMaxWave || 0),
            isUnlocked: (s) => (s.endlessHardMaxWave || 0) >= 45
        },
        {
            id: 'coin_hard_60',
            name: 'Oblivion Crown Coin',
            shortTag: 'HARD W60',
            rarity: 'celestial',
            rim: '#fde047',
            core: '#140418',
            glyph: 'abyss_omega',
            desc: 'HARD ENDLESS APEX: Living crimson-gold Oblivion Omega coin from conquering Wave 60.',
            unlockHint: 'Reach Endless Hard Wave 60 OR Defeat Apex Omega',
            targetVal: () => 60,
            currentVal: (s) => ((s.defeatedBosses.apex_omega_w60 || 0) > 0 || (s.endlessHardMaxWave || 0) >= 60) ? 60 : Math.min(59, s.endlessHardMaxWave || 0),
            isUnlocked: (s) => (s.defeatedBosses.apex_omega_w60 || 0) > 0 || (s.endlessHardMaxWave || 0) >= 60
        }
    ];

    if (Array.isArray(banners)) {
        for (const b of EXTRA_BANNERS) {
            if (!banners.some(x => x.id === b.id)) banners.push(b);
        }
    }
    if (Array.isArray(frames)) {
        for (const f of EXTRA_FRAMES) {
            if (!frames.some(x => x.id === f.id)) frames.push(f);
        }
    }
    if (Array.isArray(coins)) {
        for (const c of EXTRA_COINS) {
            if (!coins.some(x => x.id === c.id)) coins.push(c);
        }
    }
})();
