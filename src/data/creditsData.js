/**
 * Lesa.io - Authoritative Credits Registry & Roll Data
 * Structured catalog of all 21 production departments for the theatrical ending sequence
 */

const CREDITS_DATA = [
    {
        dept: "EXECUTIVE CREATIVE LEADERSHIP",
        items: [
            { role: "Game Director & Original Creator", name: "Psanas", highlight: "psanas" },
            { role: "Lead Game Designer", name: "Psanas", highlight: "psanas" },
            { role: "Executive Producer & Visionary", name: "Psanas", highlight: "psanas" },
            { role: "Independent Studio Lead", name: "Psanas Games", highlight: "psanas" }
        ]
    },
    {
        dept: "GAME PROGRAMMING & ENGINE ARCHITECTURE",
        items: [
            { role: "Principal Engine Programmer", name: "Psanas", highlight: "psanas" },
            { role: "AI Engineering Partner & Pair Programmer", name: "Antigravity (Google DeepMind)", highlight: "ai" },
            { role: "Core Engine Loop & 60 FPS Delta Coordinator", name: "Psanas", highlight: "psanas" },
            { role: "Spatial Hash Grid & Broadphase Collision Detection", name: "Psanas & Antigravity" },
            { role: "Adaptive Viewport Camera & Dynamic Easing", name: "Psanas & Antigravity" },
            { role: "Event-Driven Architecture & EventBus Broker", name: "Psanas & Antigravity" },
            { role: "Entity Pooling & Memory Reclamation", name: "Psanas & Antigravity" },
            { role: "Anti-Desync State Management & Canonical Clock", name: "Psanas & Antigravity" }
        ]
    },
    {
        dept: "2.5D GRAPHICS & VISUAL EFFECTS",
        items: [
            { role: "High-DPI Retina Canvas Rendering Engine", name: "Psanas & Antigravity" },
            { role: "Particle Systems (Sparks, Smoke, Dust & Confetti)", name: "Psanas & Antigravity" },
            { role: "Dynamic Comic Onomatopoeia Splashes (POW, BAM, SKRRRT)", name: "Psanas", highlight: "psanas" },
            { role: "Animated Health Vignette & Damage Pulses", name: "Psanas & Antigravity" },
            { role: "Directional Character Shadows & Lighting Gradients", name: "Psanas & Antigravity" }
        ]
    },
    {
        dept: "HERO ROSTER & CHARACTER CRAFTING",
        items: [
            { role: "Hero Lore & Character Conception", name: "Psanas", highlight: "psanas" },
            { role: "Psanas — The Slingshot Master (Balanced All-Rounder)", name: "Psanas", highlight: "psanas" },
            { role: "Psogas — Fiery Chili Rebel (High-Speed Sprinter)", name: "Psanas", highlight: "psanas" },
            { role: "Petros — The Blue Hood Sentinel (Heavy Frontline Juggernaut)", name: "Psanas", highlight: "psanas" },
            { role: "50balos — The Cash Hustler (Piercing Wealth Marksman)", name: "Psanas", highlight: "psanas" },
            { role: "Procedural Canvas Hero Renderers & Bobbing Animations", name: "Psanas & Antigravity" },
            { role: "Hero Roster UI, Level Scaling & Upgrade Tiers", name: "Psanas & Antigravity" }
        ]
    },
    {
        dept: "COMBAT ARSENAL & WEAPONS BALLISTICS",
        items: [
            { role: "Weapons Conception & Combat Balancing", name: "Psanas", highlight: "psanas" },
            { role: "Pea Slingshot (Rapid Ballistics & Multi-Shot Arrays)", name: "Psanas", highlight: "psanas" },
            { role: "Melon Cannon (Heavy Explosives & Splash Shockwaves)", name: "Psanas", highlight: "psanas" },
            { role: "Chili Blaster (Incendiary Piercing Stream)", name: "Psanas", highlight: "psanas" },
            { role: "50€ Banknote Stream (Crisp Piercing Banknotes)", name: "Psanas", highlight: "psanas" },
            { role: "Charged Bubble Gun (Bouncing Obstacle Spheres)", name: "Psanas & Antigravity" },
            { role: "Dial-Tone Acoustic Soundwave Projectiles", name: "Psanas & Antigravity" },
            { role: "Ejection Physics, Tracers & Spent Brass Shells", name: "Psanas & Antigravity" }
        ]
    },
    {
        dept: "FOLK ABILITIES & THE GREEK SKILL TREE",
        items: [
            { role: "Skills Design & Multi-Tier Upgrade Systems", name: "Psanas", highlight: "psanas" },
            { role: "Nerobalonaki (Water Balloon Splash Hazard & Slippery Slow)", name: "Psanas", highlight: "psanas" },
            { role: "Blade Rush (High-Speed Dash Strike with Stagger Knockback)", name: "Psanas", highlight: "psanas" },
            { role: "Seismic Quake (Frappe Glass Ground Slam Shockwave)", name: "Psanas", highlight: "psanas" },
            { role: "Yaya Scream (Grandmother Sonic Stun Wave & Screaming Radius)", name: "Psanas", highlight: "psanas" },
            { role: "Frappes Boost (High-Octane Village Caffeine Overdrive)", name: "Psanas", highlight: "psanas" },
            { role: "Pagakia Skill Tree Mastery (Coin & Diamond Upgrades)", name: "Psanas", highlight: "psanas" }
        ]
    },
    {
        dept: "THE ARMORY & 5-SLOT EQUIPMENT",
        items: [
            { role: "Armory System Architecture & Slot Mechanics", name: "Psanas & Antigravity" },
            { role: "Helmets, Armor, Belts, Gloves & Boots Categories", name: "Psanas", highlight: "psanas" },
            { role: "40+ Equipment Items & Unique Descriptions", name: "Psanas", highlight: "psanas" },
            { role: "Straw Beach Hat, Souvlaki Paper Cap & Knitted Beanie", name: "Psanas", highlight: "psanas" },
            { role: "Greek Fisherman's Cap & Neon Sun Visor", name: "Psanas", highlight: "psanas" },
            { role: "Traditional Foustanella, Wool Vest & Kevlar Armor", name: "Psanas", highlight: "psanas" },
            { role: "Old Rope Belt, Leather Work Belt & Silk Sash", name: "Psanas", highlight: "psanas" },
            { role: "Rubber Dishwashing Gloves & Motorcyclist Leathers", name: "Psanas", highlight: "psanas" },
            { role: "Beach Flip-Flops, Traditional Tsarouchia & Leather Sandals", name: "Psanas", highlight: "psanas" },
            { role: "Stat Aggregation, Multipliers & Anti-Godmode Hardcaps", name: "Psanas & Antigravity" },
            { role: "6-Tier Rarity Pipeline (⚪ 🟢 🔵 🟣 🟠 🔴)", name: "Psanas", highlight: "psanas" }
        ]
    },
    {
        dept: "BATTLE PERKS & COMBAT LOADOUTS",
        items: [
            { role: "Perks System Design & In-Run Passive Modifiers", name: "Psanas", highlight: "psanas" },
            { role: "Hot Foot (Fire Trail Sprint Mobility)", name: "Psanas", highlight: "psanas" },
            { role: "Counter-Blast (Radial Revenge Shockwave)", name: "Psanas", highlight: "psanas" },
            { role: "Golden Touch (Brute Gold Pouch Multiplier)", name: "Psanas", highlight: "psanas" },
            { role: "Last Laugh (Mini-Dynamite Cluster Trap)", name: "Psanas", highlight: "psanas" },
            { role: "Second Wind (Emergency Adrenaline Revive)", name: "Psanas", highlight: "psanas" },
            { role: "Headhunter (Precision Comic Crit Multiplier)", name: "Psanas", highlight: "psanas" },
            { role: "Bulwark & Thick Skin (Defensive Armor Scaling)", name: "Psanas", highlight: "psanas" }
        ]
    },
    {
        dept: "THE ROGUES GALLERY & ENEMY AI",
        items: [
            { role: "Enemy Archetypes, Combat Roles & Personalities", name: "Psanas", highlight: "psanas" },
            { role: "Skatmir — The Heavy Charging Bruiser Tank", name: "Psanas", highlight: "psanas" },
            { role: "Casillas — Agile Striker, Soccer Curving Shots & Dive-Dodge", name: "Psanas", highlight: "psanas" },
            { role: "Skarmogyftos — Smoke Conjurer, Piñata Burst & Cookie Vacuum", name: "Psanas", highlight: "psanas" },
            { role: "Astynomos — Police Siren Sprint & Heavy Nightstick Strikes", name: "Psanas", highlight: "psanas" },
            { role: "Flocking Dynamics, Collision Avoidance & Swarm AI", name: "Psanas & Antigravity" },
            { role: "Stun States, Stagger Recovery & Comic Hit Reactions", name: "Psanas & Antigravity" }
        ]
    },
    {
        dept: "THE BOSS TRILOGY & SHOWDOWNS",
        items: [
            { role: "Boss Encounter Director & Phase Choreography", name: "Psanas", highlight: "psanas" },
            { role: "Wave 10 Epic Boss — Kleanthis The Rebetis", name: "Psanas", highlight: "psanas" },
            { role: "Bouzouki Swagger, Drunk Meter & Flying Karate Kick", name: "Psanas", highlight: "psanas" },
            { role: "Wave 15 Mini-Boss — Kiloumpas The Hunter", name: "Psanas", highlight: "psanas" },
            { role: "Hunting Karampina Volleys & 520px Aerial Yeet Throw", name: "Psanas & Antigravity" },
            { role: "Wave 20 Climax Boss — Rouf The Snitch", name: "Psanas", highlight: "psanas" },
            { role: "90s Brick Mobile Phone & Telescopic Antenna Attacks", name: "Psanas", highlight: "psanas" },
            { role: "Emergency 100 Call & Riot MAT Squad Deployments", name: "Psanas", highlight: "psanas" },
            { role: "Greek Police Car (Peripoliko) Skrrt Arrival & Strobes", name: "Psanas & Antigravity" },
            { role: "Rouf's Collapsed Knees Stance & Smashed Phone Particles", name: "Psanas & Antigravity" }
        ]
    },
    {
        dept: "ENVIRONMENT, ARENAS & OBSTACLES",
        items: [
            { role: "Greek Village Procedural World Generation", name: "Psanas", highlight: "psanas" },
            { role: "Traditional White Houses, Red Terracotta Tiles & Stone Fences", name: "Psanas", highlight: "psanas" },
            { role: "Olive Trees & Dynamic Transparent Canopy Peeking", name: "Psanas & Antigravity" },
            { role: "Greek Village Kafenio, Wooden Benches & Iron Lampposts", name: "Psanas", highlight: "psanas" },
            { role: "Destructible Wooden Crates & Red Explosive Barrels", name: "Psanas & Antigravity" },
            { role: "Water Puddle Physics & Slip Hazards", name: "Psanas & Antigravity" }
        ]
    },
    {
        dept: "NARRATIVE, CINEMATICS & SCREENPLAY",
        items: [
            { role: "Original Story, Concept & Screenplay", name: "Psanas", highlight: "psanas" },
            { role: "Authentic Greek Village Dialogue & Street Slang", name: "Psanas", highlight: "psanas" },
            { role: "Wave 15 Kiloumpas Confrontation Cutscene", name: "Psanas", highlight: "psanas" },
            { role: "Wave 20 Rouf & Greek Police 6-Frame Ending Cutscene", name: "Psanas", highlight: "psanas" },
            { role: "2.35:1 Anamorphic Cinematic Widescreen Engine", name: "Psanas & Antigravity" },
            { role: "Spill-Proof Upward-Expanding Subtitle Frame", name: "Psanas & Antigravity" },
            { role: "Responsive 3-Tier Font Scaler for Long Greek Dialogue", name: "Psanas & Antigravity" }
        ]
    },
    {
        dept: "AUDIO, COMPOSITION & SOUNDSCAPES",
        items: [
            { role: "Audio Director & Soundtrack Curator", name: "Psanas", highlight: "psanas" },
            { role: "Main Menu High-Energy Musical Theme", name: "Psanas", highlight: "psanas" },
            { role: "Battle Arena Combat Soundtrack", name: "Psanas", highlight: "psanas" },
            { role: "Theatrical Story Ending Credits Soundtrack", name: "Psanas", highlight: "psanas" },
            { role: "Procedural Web Audio API Sound Synthesizer", name: "Psanas & Antigravity" },
            { role: "Comic Slingshot Thwacks, Splatters & Explosions", name: "Psanas", highlight: "psanas" },
            { role: "Police Sirens, Dial-Tones & Level Up Chimes", name: "Psanas & Antigravity" }
        ]
    },
    {
        dept: "ECONOMY, PROGRESSION & CHESTS",
        items: [
            { role: "Game Economy Model (Coins & Diamonds Balance)", name: "Psanas", highlight: "psanas" },
            { role: "Persistent Chest Slots (Wooden, Iron, Gold, Ancient)", name: "Psanas & Antigravity" },
            { role: "Comic Chest Opening Animations & Loot Particle Bursts", name: "Psanas & Antigravity" },
            { role: "Daily Challenges & Automated Quest Generator", name: "Psanas & Antigravity" },
            { role: "Village Shop Rotation & Starter Pack Bundle", name: "Psanas", highlight: "psanas" },
            { role: "Season 1 Battle Pass Tier Progression", name: "Psanas", highlight: "psanas" }
        ]
    },
    {
        dept: "DATA PERSISTENCE & CLOUD ARCHITECTURE",
        items: [
            { role: "Local Storage Serializer & Auto-Save Daemon", name: "Psanas & Antigravity" },
            { role: "Firebase Firestore Cloud Save Synchronization", name: "Psanas & Antigravity" },
            { role: "Google Authentication & Anonymous Player Identity", name: "Psanas & Antigravity" },
            { role: "Anti-Corruption Checksums & Safe Data Migration", name: "Psanas & Antigravity" },
            { role: "Cross-Device Seamless Cloud Handshake", name: "Psanas & Antigravity" }
        ]
    },
    {
        dept: "MOBILE & ACCESSIBILITY CONTROLS",
        items: [
            { role: "Dual-Stick Virtual Touch Control System", name: "Psanas & Antigravity" },
            { role: "Adaptive Touch Deadzones & Elastic Joystick Bounds", name: "Psanas & Antigravity" },
            { role: "Dynamic UI Scaling for Phones, Tablets & Desktops", name: "Psanas & Antigravity" },
            { role: "Fullscreen Canvas Management & Window Resize Hook", name: "Psanas & Antigravity" }
        ]
    },
    {
        dept: "ADMINISTRATION & PLAYTESTING SUITE",
        items: [
            { role: "In-Game Admin Cheats Panel ('P' Shortcut)", name: "Psanas & Antigravity" },
            { role: "Godmode, Noclip, Instant Kill & Wave Selector", name: "Psanas & Antigravity" },
            { role: "Live Entity Inspector & On-Demand Boss Spawner", name: "Psanas & Antigravity" },
            { role: "Real-Time FPS Performance & Memory Monitor", name: "Psanas & Antigravity" }
        ]
    },
    {
        dept: "GREEK CULTURAL LORE & VILLAGE COMEDY",
        items: [
            { role: "Mediterranean Village Satire & Neighborhood Tropes", name: "Psanas", highlight: "psanas" },
            { role: "The Sacred Frappe & Village Square Kafenio Discussions", name: "Psanas", highlight: "psanas" },
            { role: "Traditional Tsarouchia & Foustanella War Gear", name: "Psanas", highlight: "psanas" },
            { role: "The Snitch Who Called 100 Forty-Seven Times", name: "Psanas", highlight: "psanas" }
        ]
    },
    {
        dept: "QUALITY ASSURANCE & PLAYTESTING",
        items: [
            { role: "Principal Game Tester & Balance Master", name: "Psanas", highlight: "psanas" },
            { role: "Wave 20 Story Survival Mode Clear Verification", name: "Psanas", highlight: "psanas" },
            { role: "Collision Edge-Case Hunting & Wall Glitch Fixes", name: "Psanas & Antigravity" },
            { role: "Cross-Browser Rendering & Smooth 60 FPS Profiling", name: "Psanas & Antigravity" }
        ]
    },
    {
        dept: "SPECIAL THANKS & DEDICATIONS",
        quote: "To every player who dodged the karampina, smashed the phone, and stood tall against the authorities.",
        items: [
            { role: "Community & Player Inspiration", name: "The Greek Gaming Community" },
            { role: "Early Alpha & Beta Survivalists", name: "All Lesa.io Village Defenders" },
            { role: "AI Collaboration & Pair Programming", name: "Google DeepMind • Antigravity", highlight: "ai" },
            { role: "And Above All Else...", name: "YOU, THE PLAYER!", highlight: "psanas" }
        ]
    }
];

if (typeof window !== 'undefined') {
    window.CREDITS_DATA = CREDITS_DATA;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CREDITS_DATA };
}
