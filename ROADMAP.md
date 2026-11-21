# 🗺️ Lesa.io — Master Development Roadmap (Alpha 1.3 ➔ Beta 1.0)

> **Vision Statement**: Evolution from a single-player Greek village arcade survival shooter into a vibrant, real-time cooperative & competitive **Multiplayer Battle Arena**.
> 
> **Core Philosophy**: Build deep, balanced foundations at every stage. Polish single-player mechanics, weapon feel, and gear progression before introducing network synchronization and multiplayer lobbies.

---

## 🧭 Master Staged Progression Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🎯 PHASE 1 — ALPHA 1.3 (ACTIVE): The Core Armory Foundation                 │
│ ├─ 5 Equipment Slots: Helmet, Armor, Belt, Gloves, Boots                    │
│ ├─ Common (⚪), Uncommon (🟢), and select Rare (🔵) gear balancing          │
│ ├─ Single-stat progression & Interactive Armory Modal                       │
│ └─ Integration with Player stats, Damage Reduction, and SaveSerializer      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚔️ PHASE 2 — ALPHA 1.4 (COMPLETED ✅): Story Expansion & Boss Chapter 2      │
│ ├─ Story Mode Waves 11–20 with escalating neighborhood threats              │
│ ├─ Mid-wave Mini-Boss: Kiloumpas (Wave 15) with Karampina cutscene          │
│ ├─ Story Boss Chapter 2: Rouf (Wave 20) with authorities ending cutscene    │
│ ├─ In-game equipment drops from boss crates                                 │
│ ├─ New Playable Heroes: Kitsos & Billias                                    │
│ ├─ Dedicated Game Mode Selection (Story, Endless, Dungeons preview)         │
│ └─ 2-Player Co-op Playtest Mode (P2P WebRTC)                                │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 💎 PHASE 3 — ALPHA 1.5 (COMPLETED ✅): Endgame Gear, Battle Pass & Evolution │
│ ├─ Epic (🟣), Legendary (🟠), & Mythic (🔴) Gear + Signature Passives        │
│ ├─ 5-Floor Mount Olympus Ascent, Crests & 30-Tier Free/Paid Battle Pass     │
│ ├─ Materials Backpack Tab, Evolution Stones & Visible Equipped Armor        │
│ ├─ 🌟 "Evolution Stone" System (Hard-to-get craftable evolution catalyst)   │
│ │   ├─ Evolves Hero stats permanently                                       │
│ │   └─ Unlocks Hero Signature Special Ability ("Q" on PC / Mobile button)   │
│ │       └─ Psanas: "Rage" (2x HP, 2x DMG, 2x SPD, Boss Stun Immunity, 6.7s) │
│ ├─ Dynamic environmental arena obstacles (water wells, cafe tables, hazards)│
│ └─ Thematic Set Synergies (Tourist Set, Yaya Set, Psistis Set)              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔴 PHASE 4 — ALPHA 1.6 (ACTIVE 🚀): Mythic Awakening & Olympian Star-Stone  │
│ ├─ 🌟 Olympian Star-Stone Drops: Zeus Summit (0.8%) & W40 Boss (1.5%)       │
│ ├─ ✨ Hero Star-Blessing (+10% All Stats, 1x Match Revive & Halo Aura)      │
│ └─ ✦ Legendary (🟠 Lv.4) ➔ Mythic (🔴 1.80x Stats) Gear Ascension          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔥 PHASE 5 — ALPHA 1.7: Arsenal Expansion & Signature Hero Ultimates        │
│ ├─ 3 New Thematic Weapons:                                                  │
│ │   ├─ Souvlaki Skewer Javelin (High-velocity piercing impaler)             │
│ │   ├─ Ouzo Molotov Launcher (Area-denial fire spread)                      │
│ │   └─ Tavli Dice Scattergun (Bouncing RNG crit shotgun)                    │
│ ├─ Meter-Charged Hero Ultimates (Scooter Charge, Super Bazooka, etc.)       │
│ └─ Hero Specialization Talent Nodes (Level 10 / 20 perks)                   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🏟️ PHASE 6 — ALPHA 1.8: Game Modes & Village Map Arenas                     │
│ ├─ 5-Floor Dungeon Mode ("The Village Vaults" - Risk/Reward Chest Grinder)   │
│ ├─ Endless Survival Mode ("Taverna Defense") with wave modifiers            │
│ ├─ Boss Rush Challenge Mode (Timed gauntlet with medal rewards)             │
│ ├─ New Battle Arena: The Village Square ("Platia")                          │
│ └─ Match Modifiers (Speed Run, Hardcore One-Hit, Mega Swarm)                │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🌐 PHASE 7 — ALPHA 1.9: Pre-Multiplayer Network Infrastructure              │
│ ├─ Room Lobby & Matchmaking UI (Host / Join via 6-character room codes)     │
│ ├─ Low-latency WebSocket / WebRTC netcode engine architecture               │
│ ├─ Client-side prediction & entity interpolation system                     │
│ ├─ Co-op gameplay mechanics (Friend revives, shared drops, team aura buffs) │
│ └─ Stress testing & network bandwidth optimization                          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🚀 PHASE 8 — BETA 1.0: THE MULTIPLAYER ERA ARRIVES!                         │
│ ├─ 👥 Real-Time 2–4 Player Co-op Village Survival                           │
│ ├─ ⚔️ 1v1 & 2v2 PvP Village Arena Deathmatch                                │
│ ├─ 🏆 Global Cross-Platform Leaderboards & Seasonal Ranking                 │
│ ├─ 🏘️ Village Crews (Guilds / Neighborhood Clans with shared challenges)     │
│ └─ 🔗 1-Click Instant Join Links (Play with friends anywhere in the world)  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Detailed Phase Specifications

### ⚔️ Alpha 1.4: Story Expansion & Boss Chapter 2
* **Waves 11 to 20**: Expands beyond the village outskirts into the inner town alleys.
* **Mid-Wave Mini-Boss (Wave 15) — "Kiloumpas"**:
  * **Visual & Character**: An intensely angry, fat, big-bellied old villager who initially approaches with bare hands.
  * **Interactive Intro Cutscene**:
    1. Kiloumpas slowly walks towards the player completely empty-handed.
    2. Comic dialogue bubble: Kiloumpas asks *"Thes na parw thn karampina?"* ("Want me to get the carbine?").
    3. Player automatically responds: *"Ferthn!"* ("Bring it!").
    4. Kiloumpas turns around and walks off-screen.
    5. After 3 seconds, he re-emerges brandishing his hunting Carbine (Karampina) in his hands, and the battle begins!
  * **Combat Behavior & Mechanics**:
    * **Ranged Hunt**: Relentlessly pursues the player while firing heavy, high-velocity rifle blasts from his Hunting Carbine.
    * **Close-Range Grab & Throw**: If you let him get too close, he grabs you with his bare hands, hurls you far across the arena, dealing heavy impact damage. Forces the player to kite and manage spacing carefully!
* **Story Boss Chapter 2 (Wave 20) — "Rouf" (COMPLETED ✅)**:
  * **Visual & Character**: 55-year-old neighborhood snitch/informant with balding grey comb-over, reading glasses, bushy grey mustache, knit cardigan vest, trousers, and leather moccasins.
  * **Interactive Intro Cutscene**:
    1. Rouf whispers into phone: *"Nai, astynomia? Ton vrhka! Einai edw ston dromo kai kanei fasaria!"*
    2. Player responds: *"Poios einai autos re? O Roufianos tou xwriou?!"*
    3. Rouf points antenna: *"Sas eida! Den glytwneis twra, to 100 erxetai!"*
  * **Combat & Weapons (The Hardest Boss in Chapter 2)**:
    * **90s Heavy Brick Mobile Phone & Telescopic Antenna**: Fires rapid 3-round bursts and 5-way spread dial-tone soundwaves (`"BEEP BEEP BEEP! 📡"`).
    * **Melee Punish (Phone Smash)**: Violently swats with heavy phone if cornered (<75px), dealing 45 damage and 140px knockback.
    * **Ability 1 ("100! Send the Patrol!")**: Channels emergency calls with police sirens, summoning squads of Greek Police Officers (`Astynomos`).
    * **Phase 2 Enrage (<= 50% HP)**: Screams *"STEILTE TA MAT! KINTOYNEVW!"*, summons armored MAT Riot Police with shields (50% frontal block), and unleashes 8-way radial soundwave bursts with overclocked speed.
* **In-Game Equipment Drops**: Bosses drop glowing equipment crates with randomized gear rolls.
* **Environmental Hazards & Dynamic Obstacles**: Moved to Alpha 1.5.0 (exploding olive oil jugs, slippery spilled frappé puddles, and destructible cafe tables).

---

### 💎 Alpha 1.5: Epic & Legendary Gear, Fusion & Hero Evolution
* **Epic (🟣) & Legendary (🟠) Tiers**: Introducing powerful passive procs (e.g. *Chance on hit to trigger a shockwave*, *50% movement speed after taking a hit*).
* **3-to-1 Armory Fusion Forge**:
  * Combine 3 identical Common pieces ➔ 1 Uncommon piece.
  * Combine 3 identical Uncommon pieces ➔ 1 Rare piece.
  * Combine 3 identical Rare pieces ➔ 1 Epic piece.
  * Combine 3 identical Epic pieces ➔ 1 Legendary piece.
* **🎒 Materials & Keys Backpack Tab**:
  * Dedicated 6th tab in the Armory for stackable collectibles: Dungeon Keys, Fusion Shards, Crafting Minerals, and Evolution Stones.
* **🌟 "Evolution Stone" & Hero Evolution System**:
  * Hard-to-get catalyst crafted from rare materials found through high-wave survival, boss defeats, and dungeon grinding.
  * Consumed to **Evolve** the player hero: grants a permanent base stat boost and permanently unlocks the hero's **Signature Special Ability**.
* **⚡ Psanas Signature Special Ability — "Rage"**:
  * **Controls**: Triggered with **"Q"** on PC keyboard; dedicated comic touch button on Mobile UI.
  * **Duration**: Exactly **6.7 seconds**.
  * **Combat Buffs**:
    * **x2 Health** (Doubles current and max HP pool).
    * **x2 Damage** (Doubles damage output on all weapons).
    * **x2 Speed** (Rapid sprint across the arena).
    * **Boss Stun Immunity**: Completely unfazed and immune to Boss Kleanthis' stun kick!
  * **Visual & Audio FX**:
    * Radiant **Red Rage Aura** swirling around Psanas.
    * Comic speech pop-up with bold lettering: **"ARGHH!"**.
* **Thematic Set Synergies**:
  * **Tourist Set (2pc/4pc)**: Extra coin drops + sprint speed boost.
  * **Yaya's Warmth Set (2pc/4pc)**: Health regeneration + defensive barrier when low on HP.
  * **Grillmaster (Psistis) Set (2pc/4pc)**: Burn damage amplification + explosive knockback.

---

### 🔴 Alpha 1.6 (ACTIVE 🚀): Mythic Awakening & The Olympian Star-Stone
* **Olympian Star-Stone**: Ultra-rare drop from Zeus Summit (`0.8%`) and Wave 40 Endless Boss (`1.5%`).
* **Hero Star-Blessing**: Infuse `1x Olympian Star-Stone` into any unlocked hero for `+10% Max HP / Damage / Speed`, `1x` automatic match revival shield, and a celestial constellation halo.
* **Legendary ➔ Mythic Ascension**: Upgrade maxed `Lv.4 Legendary` gear into `Ascended Mythic` (`1.80x` base stats & Mythic evolution eligibility) with `1x Olympian Star-Stone` + `30,000 Coins`.

---

### 🔥 Alpha 1.7: Arsenal Expansion & Signature Hero Ultimates
* **3 Brand-New Weapons**:
  1. **Souvlaki Skewer Javelin**: High-velocity armor-piercing projectile that impales multiple enemies in a straight line and pins them to walls.
  2. **Ouzo Molotov Launcher**: Arcing bottle that shatters into an expansive sea of cartoon blue flames, creating area-denial zones.
  3. **Tavli Dice Scattergun**: Fires bouncing dice that deal randomized damage with huge critical roll multipliers (rolling double sixes triggers a screen-wide crit explosion).
* **Meter-Charged Hero Ultimates**:
  * Charged by dealing damage and collecting special adrenaline stars.
  * **50balos — "Super Bazooka"**: Fires a colossal explosive missile that detonates with a screen-clearing shockwave.
  * **Psanas — "Cypriot Drift Fury"**: Hops onto a roaring cafe racer scooter, blazing through mobs invulnerably while leaving flaming tire tracks.
  * **Petros — "Watermelon Meteor Shower"**: Calls down a torrential mortar barrage of exploding giant watermelons.
  * **Psogas — "Spicy Inferno Storm"**: Spins in a 360-degree whirlwind with dual chilli blasters, creating a fiery vortex.

---

### 🏟️ Alpha 1.8: Game Modes & Village Map Arenas
* **5-Floor Dungeon Mode ("The Village Vaults & Wine Cellars")**:
  * Dedicated chest & gear grinding gauntlet with 5 escalating floors (1 ➔ 2 ➔ 3 ➔ 4 ➔ 5).
  * High-stakes push-your-luck mechanic: at the end of each floor, choose to **Cash Out & Leave** with collected chests, or push deeper for rarer loot (Epic/Legendary).
  * High-risk stakes: dying mid-dungeon forfeits all unclaimed chests and consumes your Dungeon Key!
* **Endless Survival Mode ("Taverna Defense")**:
  * Defend the central Taverna courtyard against infinite escalating waves.
  * Pick between 3 random comic perk cards at the end of each wave milestone.
* **Boss Rush Gauntlet**:
  * Face Fatmir, Casillas, Kleanthis the Rebetis, and Chapter 2 bosses sequentially with no break.
  * Earn Bronze, Silver, and Gold speedrun medals.
* **New Battle Arena**:
  * **The Village Square ("Platia")**: Wide open plaza with a central working fountain, park benches, and pigeon mobs.

---

### 🌐 Alpha 1.9: Pre-Multiplayer Network Infrastructure
* **Lobby & Matchmaking System**:
  * Clean UI to create a room, set privacy (Public / Private), and share a 6-character room code.
  * Hero & Loadout selection screen where players see teammates' characters and gear.
* **Netcode Core**:
  * Lightweight WebSocket / WebRTC state-sync protocol running at 30-60 updates/sec.
  * Client-side prediction for local player movement and shooting to guarantee zero input lag.
  * Snapshot interpolation for smooth rendering of other players and synced enemies.
* **Co-op Team Mechanics**:
  * **Down-But-Not-Out (DBNO)**: Teammates can revive fallen friends within 10 seconds.
  * **Team Frappé Toast**: Clinking frappé glasses grants team-wide temporary buffs.
  * **Shared Boss Crates**: Everyone in the room earns loot when a boss falls.

---

### 🚀 Beta 1.0: THE MULTIPLAYER ERA
* **2 to 4 Player Online Co-op**: Hop into the village together and survive hordes with combined firepower and synergized gear builds.
* **PvP Village Arenas (1v1 & 2v2)**:
  * Fast-paced competitive shootouts with powerups, cover obstacles, and tournament brackets.
* **Village Crews (Guilds)**:
  * Form a neighborhood crew, customize a clan crest, and compete for weekly territory control and leaderboard rewards.
* **Instant Browser Join**:
  * Send a friend a simple link (`lesa.io/join?room=XYZ123`); clicking it immediately launches the game and drops them into your lobby!

---

## 🎨 Art & UI Polish — Custom Icons In the Works

> Deferred until image-generation quota resets, plus full audit of existing tab emojis queued for custom cartoon PNG replacement.

### 1. Pending Epic & Legendary Gear Icons (6 Remaining of 20)
Already wired: `14/20` PNG icons in `src/data/gearEndgame.js` (`assets/helmets/`, `assets/armors/`, `assets/belts/`, `assets/gloves/`, `assets/boots/`). Remaining `6` items currently using emoji fallbacks:
* **Helmet**: `bouzouki_fedora` (`🎩`) → `assets/helmets/GoldenBouzoukiFedora.png`
* **Armor**: `mat_riot_vest` (`🛡️`) → `assets/armors/MatRiotVest.png`
* **Armor**: `aegis_jacket` (`🧥`) → `assets/armors/AegisKafenioJacket.png`
* **Armor**: `grandmaster_cuirass` (`🔥`) → `assets/armors/GrandmasterButcherCuirass.png`
* **Belt**: `tyche_belt` (`🎲`) → `assets/belts/GoldenTavliBeltTyche.png`
* **Boots**: `titan_greaves` (`🥾`) → `assets/boots/TitanGreavesOlympus.png`

### 2. Other Modal Tabs & Shared UI Emojis to Replace with Custom PNGs
* **Shared Tab & Economy Chrome** (`index.html`, `ModalManager.js`, manager toasts/pills):
  * Currency & status pills across tabs: Coins (`🪙`), Gems/Diamonds (`💎`), Lock (`🔒`), Unlocked (`🔓`), Equipped/Check (`✅`), Warning (`⚠️`), Star/Level/Max (`⭐`), Clocks/Timers (`⏱️`, `⏳`).
* **Upgrades Tab** (`#upgrades-modal`, `src/data/upgrades.js`, `src/ui/UpgradeManager.js`):
  * Modal title (`⚡`), summary bar (`🪙`, `⚡`, `⭐`), button icons (`🪙`, `⭐`), and all 4 Upgrade Cards: `Critical Chance` (`🎯`), `Critical Damage` (`💥`), `Max Health` (`❤️`), `Gold Bonus` (`🪙`).
* **Perks Loadout Tab** (`#talents-modal`, `src/data/perks.js`, `src/ui/PerkManager.js`):
  * Modal title (`🎖️`), summary bar (`🪙`, `🎖️`, `📦`), empty slot (`➕`), search (`🔍`), vault header (`📦`), category chips (`🔥`, `🎯`, `💥`, `💣`, `⚡`, `🪙`), and all 6 Perk Cards: `Hot Foot` (`🔥`), `Counter-Blast` (`💥`), `Golden Touch` (`🪙`), `Last Laugh` (`💣`), `Second Wind` (`⚡`), `Headhunter` (`🎯`).
* **Daily Challenges / Quests Tab** (`#daily-quests-modal`, `src/data/quests.js`, `src/progression/QuestManager.js`):
  * Modal title (`📜`), menu timer (`⏱`), claim toast/rewards (`🎉`, `🪙`, `💎`), and all 5 Quests: `Enemy Sweeper` (`⚔️`), `Skatmir Crusher` (`🥊`), `Casillas Dodger` (`🎯`), `Wave Survivor` (`🌊`), `Cookie Monster` (`🍪`).
* **Hero Roster Tab** (`#heroes-modal`, `src/ui/HeroRoster.js`):
  * Modal title (`🪖`), filter chips (`✅`, `🔒`, `⏳`), summary pills (`🪙`, `🪖`, `⭐`), mystery/coming-soon slots (`❓`, `⏳`), lock/buy/selected markers (`🔒`, `🪙`, `✅`). *(Hero portraits already use `assets/HeroesIcons/*.png`.)*
* **Skills Tab** (`#skills-modal`, `src/data/skills.js`, `src/ui/SkillManager.js`):
  * Modal title (`🗡️`), filter chips (`✅`, `🔒`, `⭐`), summary bar (`🪙`, `💎`, `🔓`, `🗡️`), Pagakia mastery ice icons (`🧊`, `⭐`), fallback/button icons. *(All 5 active skills already use `assets/SkillsIcons/*.png`; `FrappesLesaIO.png` also exists unused.)*
* **Gear & Weapons Tab Chrome** (`#weapons-modal`, `src/ui/GearModalUI.js`, `src/data/weapons.js`):
  * `🎒` inventory header & `⚔️ Weapons` subtab (note `assets/GearUIIcons/GearInventoryUI.png` & `assets/icons/icon_weapons.png` already exist unused), passive sparkle (`✨`), chest-only/fallback badges (`📦`, `🔒`, `🛡️`, `⚠️`), and all 10 `STAT_LABELS` (`❤️`, `👟`, `🛡️`, `🎯`, `💥`, `⚡`, `⚔️`, `💨`, `🌀`, `🧲`; note `ATK.png`, `DEF.png`, `HP.png` exist in `assets/GearUIIcons/`). *(Note: `HUDController.js` weapon indicator & `weapons.js` also keep emoji fallbacks alongside `assets/WeaponIcons/*.png`.)*
* **Inventory & Chests Tab** (`#inventory-modal`, `src/ui/InventoryModalUI.js`, `src/data/bossRanks.js`, `src/ui/ChestModalUI.js`):
  * Modal title (`🎒`), summary pills (`📦`, `🪙`, `💎`), section headers (`👑`, `🛡️`), Arsenal & Stats cards (`🛡️`, `🏆`, `⚡`), Boss Rank dots (`🟢`, `🔵`, `🟣`, `🟠`, `🔴`), and Chest reveal cards/prompts (`🪙`, `💎`, `🛡️`, `✨`, `⏱️`, `⚡`, `👆`, `🎉`).
* **Profile, Mail, Friends, Settings & Menu Bottom Row** (`index.html`, `ProfileManager.js`, `MailManager.js`, `FriendsModal.js`, `SettingsManager.js`, `MenuController.js`):
  * **Profile**: Header (`👑`), buttons (`✏️`, `📋`), Career Stats icons (`📊`, `⚔️`, `🌊`, `🏆`, `🥊`, `⚽`, `🎮`, `⏱️`, `🪖`).
  * **Mail**: Header (`✉️`), mail/gift badges & patch bullets (`👑`, `📢`, `✨`, `🚨`, `🎁`, `⏳`, `🪙`, `💎`, `✅`).
  * **Friends**: Header & tabs (`👥`, `🔔`, `➕`), status/actions (`📋`, `✅`, `🚀`, `🤝`, `📊`, `📨`, `🟢`, `⚫`, `⏳`, `🏆`, `🌊`).
  * **Settings**: Gear icon (`⚙️`), audio/toggles (`🎵`, `🔊`, `🎯`, `✅`, `❌`), cloud (`☁️`, `🔄`, `⏳`).
  * **Menu Bottom Row & Cards**: Leaderboard (`🏆`), Friends (`👥`), Clans (`🛡️`), Mail (`✉️`), Events (`📅`), Battle Pass (`ℹ️`, `🎁`, `👑`), Fullscreen (`⛶`).
* **Shared Modal Headers Opportunity**: Existing menu button PNGs (`icon_heroes.png`, `icon_gear.png`, `icon_skills.png`, `icon_upgrades.png`, `icon_inventory.png`, `icon_talents.png` in `assets/icons/`) can also replace emoji prefixes in modal `<h2 class="modal-title">` headers (`index.html`) when refactoring tab UIs.

---

## 🛠️ Architecture & Line-Count Principles

1. **Strict File Size Limits**: Every source file must remain strictly `< 600 lines` (soft target ~400 lines).
2. **Modular Architecture**:
   * Weapons, enemies, skills, and UI modals remain decoupled in self-contained classes.
   * Netcode and lobby managers will live in dedicated `/src/network/` and `/src/multiplayer/` directories.
3. **Single-Player Preservation**:
   * Offline single-player mode will always remain 100% playable without an internet connection.
   * Network code will wrap existing player and entity APIs cleanly without breaking offline systems.
