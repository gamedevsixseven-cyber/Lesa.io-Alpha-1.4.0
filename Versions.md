# 📜 Lesa.io - Version Line Count & State History

This file tracks the total lines of code and game architecture state across every version release of **Lesa.io**.

---

## 📊 Current Version Summary

| Metric | Current Value |
|---|---|
| **Active Version** | **Version 1.2.1 — Crypton X, Endless Optimization & Polish Update 🏍️** |
| **Milestone Banner** | 🔥 **OVER 103,700 LINES OF EXECUTABLE & WEB CODE (`105,200+` WITH DOCS)!** |
| **Total Code Lines (`JS+CSS+HTML+PS1+CS`)** | **102,996 lines** across **280 files** (`102,288 lines` core web app `JS+CSS+HTML`) |
| **Total Project Lines (incl. `.md`)** | **104,488 lines** across **287 files** *(plus `81` `.svg` icons / `587` lines & `manifest.json` / `21` lines)* |
| **Max Lines Per Source File** | **`235 / 236` `.js` & `37 / 37` `.css` files `< 600 lines`** *(exception: `src/heroes/FiftyBalosHero.js` at `1,119` lines)* |
| **Last Calculated** | November 23, 2026 *(excluding `_backups/`, `scratch/`, `.git/`, `node_modules/`, `android/`)* |

---

## 📂 Lines by File Extension

| File Type | Description | File Count | Total Lines | Share (of Primary 6) |
|---|---|---|---|---|
| **`.js`** | JavaScript Game Logic & Subsystems (`src/` + `sw.js`) | 236 | 85,461 | 81.8% |
| **`.css`** | UI, HUD, Armory, Events, Friends, Olympus & Modal Styles | 37 | 13,376 | 12.8% |
| **`.html`** | Main Application & Canvas Shell (`index.html`) | 1 | 3,451 | 3.3% |
| **`.md`** | Design, Gear, Roadmap, Bugfix & Version Specs | 7 | 1,492 | 1.4% |
| **`.ps1`** | Local Web Server & Automation Scripts | 5 | 438 | 0.4% |
| **`.cs`** | Desktop C# Game Launcher (`Launcher.cs`) | 1 | 270 | 0.3% |
| **Total (Primary 6)** | **All Code, Markup, Scripts & Documentation** | **287** | **104,488** | **100.0%** |

> Also tracked in live project assets: **81 `.svg` UI icons** (`587` lines in `assets/ui-icons/`) and **1 `.json` manifest** (`21` lines in `manifest.json`), bringing all tracked text assets to **369 files** and **105,096 lines**.

---

## 🧩 JavaScript Architecture Breakdown (`src/` — 235 files, 85,410 lines; + root `sw.js` 51 lines = 85,461 lines)

| Module Directory | Role | Files | Lines |
|---|---|---|---|
| `src/Bosses/` | Story, Endless Main/Mini-Bosses, Kolossos Troops, Lil Xas & FX | 31 | 12,243 |
| `src/ui/` | Modals, HUD, Battle Pass, Friends, Roster, Inventory, Chests & Icons | 30 | 11,166 |
| `src/engine/` | Game Loop, Arena, Endless Director, Perks, Collisions & Touch Input | 23 | 9,963 |
| `src/entities/` | Player, Weapons, Bullets, Drops, Obstacles & Combat Juice FX | 15 | 6,354 |
| `src/dungeons/` | Mount Olympus Ascent, Zeus Sky Phase, Ice Enemies & Shrine UI | 16 | 6,241 |
| `src/data/` | Heroes, Weapons, Rarities, Gear, Endgame Gear, Materials & Cosmetics | 19 | 5,610 |
| `src/heroes/` | Playable Hero Renderers, Skins & Visible Common/Endgame Armor | 13 | 5,221 |
| `src/enemies/` | Wave & Endless Enemy Archetypes (`BioAlchemist`, `Psaltis`, etc.) | 14 | 4,926 |
| `src/weapons/` | Modular Weapons, Boss Weapons, Battle Pass & Apex Arsenals | 18 | 4,200 |
| `src/network/` | P2P WebRTC Co-op Networking, Host/Guest Sync, Drops & FX | 10 | 3,684 |
| `src/progression/` | Battle Pass, Live Events, Quests, Materials, Boss Rewards & Cosmetics | 8 | 3,239 |
| `src/skills/` | 12 Active Hero Skills, Ultimates & Combat Modifiers | 12 | 2,865 |
| `src/save/` | Cloud Account Sync, `SaveSerializer` & Player Identity (`#TAG`) | 5 | 2,023 |
| `src/admin/` | Admin Panel, Auth & Debug Cheats | 4 | 1,784 |
| `src/` (root) | `main.js`, `firebase.js`, `audio.js` | 3 | 1,729 |
| `src/core/` | Canonical `GameState`, `MobilePerf`, `AutoUpdater`, `EventBus` & Touch Helpers | 7 | 1,638 |
| `src/gear/` | Equipment Manager, Set Synergies & Passive Bonus Engine | 3 | 1,304 |
| `src/social/`, `src/chests/`, `src/profile/`, `src/libs/` | Friends Service, 4-Slot Chests, Stats & Vendor PeerJS Lib | 4 | 1,209 |

---

## 📈 Version Progression Log

### **Version 1.2.1 — White Crypton X Ultimate, VF185 Buff, Endless Hard Optimization & Stability Update**
- **Release Date:** November 28, 2026
- **Key Additions & Changes:**
  - **50Balos `"CRYPTON X"` Q Ultimate & Petros VF185 Damage Buff (`HeroUltimates.js`, `CryptonExhaustFire.js`, `CryptonXModel.js`, `UltCryptonXSkill.svg`, `CollisionSystem.js`, `HeroRenderer.js`, `Effects.js`, `CoopSkillFx.js`):** 50Balos now rides his White Crypton X on Ulti (Q), dealing heavy drive-through damage (`145` base) and dropping blazing road exhaust fire pools that ignite enemies with burn DoT. Petros's SYM VF185 drive-through ram damage was buffed (`98` -> `185` base, `1.5x` bosses).
  - **Endless Hard Performance Overhaul (`EndlessHardHazards.js`, `EndlessHardMap.js`, `EnemyBatchRenderer.js`, endgame enemy renderers):** Optimized crowd rendering, spatial lookups, and AI throttling when large hordes pack Endless Hard waves.
  - **Mobile Crash/White-Screen Fix & Crisp High Graphics (`MobileAssetGuard.js`, `MobileCanvasGuard.js`, `MobilePerf.js`, `EndlessHardMap.js`):** Hardened mobile memory/canvas safety to eliminate unexpected white-screen restarts while preserving sharper High graphics resolution on phones.
  - **Wave/Boss Banners & Co-op Joiner Audio (`WaveManager.js`, `BossWarningOverlay.js`, `BgmController.js`, `ApexW60Audio.js`, `audio.js`, `CoopGuestSession.js`):** Polished Wave Cleared and Boss Incoming overlays on PC and mobile (removing distracting boxy borders) and fixed mobile Co-op joiner playback so all players hear BGM and boss voice lines.
  - **Chronos+ Overclock, Skill Upgrades & Hard Endless Leaderboard Save Fix (`SkillManager.js`, `LeaderboardModal.js`, `PerkProgression.js`, `FriendService.js`, `ProfileManager.js`, `SaveManager.js`, `SaveSerializer.js`, `SaveMigration.js`, `firebase.js`, `AccountSyncManager.js`, `cloudflare/worker.js`):** Fixed Chronos Overclock, skill upgrades, and Hard Endless max wave records resetting across reloads or cloud sync via monotonic merging, `lbEndlessHardWave` indexing/queries, and immediate cloud flushes.
  - **Version 1.2.1 Pop-up (`TributeManager.js`, `tribute.css`, `index.html`, `sw.js`, `DevGiftManager.js`):** Added one-time `#update-121-modal` announcement highlighting all Update 1.2.1 changes and updated main menu badge & PWA cache to `1.2.1`.

### **Version 1.0.1 (Patch & Optimization Update) - Mobile Staged Preloader, Gear Icon Fix, Update Pop-up, Exclusive VF 185 Kolones & Chrono Emerald Rift Banners**
- **Release Date:** November 23, 2026
- **Key Additions & Changes:**
  - **One-Time Version 1.0.1 Update Pop-up (`TributeManager.js`, `index.html`):** Added a one-time `#update-101-modal` announcement shown the first time players enter Version 1.0.1 (*"Bug fixes, performance improvements, leaderboard UI bug fixed."*).
  - **Mobile Staged Preloader & Missing Gear Icon Fix (`LoadingScreen.js`, `MobileAssetGuard.js`, `GearModalUI.js`, `gearEndgame.js`):** Fixed 11 case-sensitive GitHub Pages `iconImg` paths in `gearEndgame.js` (`assets/Helmets/`, `assets/Armors/`, `assets/Belts/`, `assets/Gloves/`) that showed `?` on mobile Safari, added `MobileAssetGuard.normalizeAssetPath()`, and implemented a 4-worker staged mobile preloader with `img.decode()` and extended mobile loading budget.
  - **Exclusive `SYM VF 185 Kolones` & `Chrono Emerald Rift` Animated Banners (`profile_cosmetics_ext.js`, `CosmeticEffectsEngine.js`, `CosmeticManager.js`, `ProfileCosmeticsUI.js`, `cosmetics-advanced.css`):** Added Dev-gift-only `EXCLUSIVE` banner `banner_vf185_apex` (*SYM VF 185 Kolones*, hidden unless owned) and replaced `VF185 Street Turbo` with `Chrono Emerald Rift` (`chrono_rift`).
  - **Primary Dev Gifting, Friend Last-Online & Leaderboard Sync Fixes (`DevGiftManager.js`, `FriendsCardRenderer.js`, `PublicProfileModal.js`, `LeaderboardModal.js`, `ProfileManager.js`, `firebase.js`):** Added Primary Dev gift sending & interactive `#dev-gift-claim-modal` with free-open gifted chests, friend-only *"Last online"* timestamps, rename propagation across `players`/`leaderboards`/`friendships`, and separate-UID leaderboard rendering so phone and PC accounts both appear on leaderboards.

### **Version 1.0.0 (Launch Release) - Live Events Hub, Co-op Rework, Lil Xas VIP Banner & Launch Polish**
- **Release Date:** November 22 – November 23, 2026 *(GitHub: `d098e9b`)*
- **Total Lines / Files:** **104,488 lines** (`102,996` code lines across `280` files; `85,461` `.js` lines across `236` files)
- **Key Additions & Changes:**
  - **Live Events Hub & Automatic Dec 1 Launch Week (`EventManager.js`, `events.css`, `materials.js`):** Replaced the placeholder Events button with a 3-tab comic Events Hub (`LAUNCH EVENT`, `BOOST BREAKDOWN`, `CALENDAR`) featuring a live 4-box countdown clock and `#events-badge` indicator. Scheduled **Launch Event** automatically for **Dec 1 – Dec 7, 2026** granting **`1.5x` Account & Battle Pass XP**, **`2.0x` Match & Pouch Gold**, and **`+35%` Material Drop Boost** across Story, Endless, Mt. Olympus, and Co-op.
  - **Lil Xas VIP Banner & Stage Animations (`LilXasEvent.js`, `profile_cosmetics_ext.js`, `CosmeticEffectsEngine.js`, `cosmetics-advanced.css`):** Added boss defeat unlock (`banner_lil_xas`) with Lil Xas portrait art (`LilXasBannerFace.png`), spinning gold/obsidian vinyl record, neon 8-bar equalizer, crossing stage spotlights, sweeping laser, paparazzi camera flashes, and floating music notes.
  - **Co-op Squad UI Rework & Mobile Stability (`coop.css`, `CoopLobbyModal.js`, `mobile-modals.css`, `AutoUpdater.js`):** Reworked the Game Mode Co-op button and Co-op Squad lobby modal to match Lesa.io's warm cream/gold palette, tightened Co-op mobile scaling & mutual pause flow, hardened cloud/local saves & Firestore rules, and stopped `AutoUpdater` from reloading unexpectedly when returning to menu.
  - **Settings Icon & Clans Placeholder (`assets/ui-icons/gear_cog.svg`, `MenuController.js`):** Replaced `gear_cog.svg` with a symmetrical steel-and-gold comic gear icon and updated `#btn-clans` to `"Coming soon!"`.

### **Alpha 1.6.9 - 1.6.13 - Battle Pass & Friends Overhaul, Unique Names & Endless Swarm Scaling (Dev Build)**
- **Date:** November 22, 2026
- **Total Lines / Files:** **96,952 lines** (`95,469` code lines across `263` files; `78,724` `.js` lines across `220` files)
- **Key Additions & Changes:**
  - **Season 1 Battle Pass UI Redesign (`BattlePassModalUI.js`, `battlepass.css`):** Horizontal 30-tier dual-track rail (`Free` + `VIP`), live Reward Spotlight Inspector with weapon stats & skin swatches, quick-jumps, XP guide drawer, and 1-click skin/weapon equipping.
  - **Friends & Squad UI Overhaul (`FriendsModal.js`, `FriendsCardRenderer.js`, `friends.css`):** Equipped My Player Card banner/coins showcase, online/room filters, instant roster filter, expandable 4-stat career drawer, sectioned Requests (`ACCEPT ALL`), and avatar-equipped Co-op invite toast.
  - **Online Name Uniqueness (`NameValidator.js`, `ProfileManager.js`):** Enforced case-insensitive `"Name taken"` verification across Firestore `usernames` and `players` collections during initial name setup and paid renames.
  - **Endless 120 Enemy Cap, W35+ Troops & Endgame Healer (`EndlessWaveDirector.js`, `BioAlchemist.js`, `BioAlchemistRenderer.js`, `KolossosTrooper.js`, `KolossosDrone.js`):** Raised Endless cap from `72` to `120` enemies, added `KolossosTrooper` & `KolossosDrone` to Wave `35+` pools with standalone hover/separation AI, and introduced Wave `32+` endgame healer `Bio-Alchemist` (Vital Healing Tether, Cleanse Pulse, `bio_acid` 3-vial volley, Smoke-Dash escape).

### **Alpha 1.6.4 - 1.6.8 - Visible Armor, 30-Tier Battle Pass & Co-op Wave 18 Stability**
- **Release Date:** November 2026
- **Key Additions & Changes:**
  - **Visible Armor & Ascension (`HeroArmorCommon.js`, `HeroArmorEndgame.js`):** Rendered equipped gear/armor directly on heroes, added Olympian Star-Stone Mythic Ascension (`1.80x` gear stats), expanded Season 1 Battle Pass to 30 tiers, and added 6 new active hero skills.
  - **Co-op Multiplayer Hardening (`NetworkManager.js`, `CoopHostSession.js`, `CoopGuestSession.js`, `CoopDropSync.js`, `CoopCombatFx.js`, `Game.js`):** Synced partner armor, weapon evolutions, muzzle flashes, beams, shared drops, and fixed the Wave 18 Guest freeze via PeerJS binary chunking, DataChannel backpressure, drop prioritization, and isolated `update`/`render` loop error handling.

### **Alpha 1.6.0 - 1.6.3 - Endless Mode Expansion, Psgiannhs Hero, Chest Weapons & Mobile Optimization**
- **Release Date:** November 15 – November 21, 2026
- **Key Additions & Changes:**
  - **Endless Mode Evolution & Bosses (`EndlessMapEvolution.js`, `EndlessWaveDirector.js`, `EndlessMainBosses.js`, `EndlessMiniBosses.js`):** Added 4 escalating map atmosphere stages, 8 Endless Mini-Bosses & Main Bosses up to `MechaKolossos` (W40) + infinite Apex cycles, `BouzoukiSniper`, `KafeneioTank`, `OuzoBomber`, and `DimotikiEnforcer`.
  - **Playable Hero `Psgiannhs`, Ultimates & Weapons:** Added `PsgiannhsHero`, Hero Ultimates (`VF185`), `SymbioteLauncher`, `HeliosOmegaCannon`, chest-drop weapons (`M4Carbine`, `Spas12`, `BoomerangSawblade`, `ChronoRifle`), Battle Pass weapons (`BattlePassWeapons.js`), Holo Profile Cosmetics, and `MobilePerf` graphics presets.

### **Alpha 1.5.15 - Boss Arsenal Weapons & Hero Psanas Model Rework**
- **Release Date:** November 15, 2026
- **Total Lines / Files:** **55,344 lines** (`53,880` code lines across `164` files; `41,591` `.js` lines across `131` files)
- **Key Additions & Changes:**
  - **Boss-Unlockable Weapons (`src/weapons/BossWeapons/`):** Added `KiloumpasCarbine.js` (`carbine`) and `RoufDialToneBlaster.js` (`dialtone`) with distinct models, stats, and boss-defeat unlock progression.
  - **Hero Psanas Visual Rework (`src/heroes/PsanasHero.js`, `src/heroes/HeroSkinRenderer.js`):** Rebuilt Psanas's playable 2.5D model silhouette, outfit details, hair/glasses, and directional rendering fidelity.

### **Alpha 1.5.12 - 1.5.14 - Mount Olympus Ascent & Combat Polish**
- **Release Date:** November 14, 2026
- **Key Additions & Changes:**
  - **Mount Olympus Ascent (5-Floor Endgame Dungeon):** Built full mountain climb flow (`OlympusAscentSystem.js`, `OlympusClimbTransition.js`) ascending from Floor 1 (`300m Trail`) through Floor 5 (`2,918m Summit`), featuring multi-layered parallax climb transitions, bosses `CasillasSentinel`, `RavineChieftain`, `FrostTitanBoreas`, `KiloumpasBerserker`, and `ZeusBoss`, plus `OlympusAltarUI.js` god blessings between floors.
  - **Olympus Ascent Crests & Progression Quality-of-Life:** Added `AscentCrestManager.js` (`2` daily crests, cap `3`, `+1` on defeating Wave 20 Rouf), saved overflow chests to Inventory instead of discarding, and preserved the active game mode on Play Again.
  - **Combat Feel & FX:** Added `CombatRenderFX.js`, `CombatJuiceFX.js`, updated `Camera.js`, and mode card artwork (`card_dungeons.png`).

### **Alpha 1.5.0 - 1.5.11 - Cloud Accounts, Friends, Endgame Gear, Chests & SVG UI**
- **Release Date:** September 11 – November 14, 2026
- **Key Additions & Changes:**
  - **Friends, Player Tags & Cloud Sync (`Alpha 1.5.3 - 1.5.6`):** Added shareable `#ABCDEF` tags, Firestore friendships & live Co-op invites (`FriendService.js`, `FriendsModal.js`), `AccountSyncManager.js`, `PlayerIdentity.js`, modularized Co-op host/guest sessions, and server, security & performance fixes documented in `BUGS_FIXED.md`.
  - **4-Slot Chests & Epic/Legendary Endgame Gear (`Alpha 1.5.8 - 1.5.10`):** Added `ChestManager.js` (4-slot countdown timers & gem speed-ups), 20 chest-only Epic/Legendary gear items in `gearEndgame.js` across 5 slots, passive combat bonuses (`GearPassives.js`), and quests/upgrades/perks polish.
  - **Vector SVG Icon Library & Olympus Environment (`Alpha 1.5.1 - 1.5.11`):** Built `UiIcons.js` backed by `75` `.svg` icons in `assets/ui-icons/`, added `TouchInput.js` and `CinematicCutsceneOverlay.js`, and authored custom Mount Olympus terrain, ice, foliage, obstacle, and structure renderers (`OlympusAssets.js`, `OlympusLayouts.js`, `OlympusIceRenderer.js`).

### **Alpha 1.4.1 - 1.4.9 - Post-Chapter 2 Refinements & Enemy/Co-op Polish**
- **Release Date:** September – November 2026
- **Key Additions & Changes:**
  - Updated credits data (`creditsData.js`), Co-op lobby styles (`coop.css`), remote player synchronization (`RemotePlayer.js`), `Psaltis.js`, and `BossWarningOverlay.js`.

### **Alpha 1.4.0 - Story Expansion & Boss Chapter 2 (Official Release)**
- **Release Date:** September 10, 2026
- **Total Source Files:** **133 files**
- **Key Additions & Highlights:**
  - 🚨 **Story Mode Chapter 2 & Wave 20 Final Boss: Rouf**:
    - Complete 20-wave narrative campaign reaching the village center.
    - 55-year-old neighborhood informant with comb-over, glasses, and knit cardigan vest.
    - Intro cutscene reporting player to police on 90s brick phone; dial-tone soundwaves and phone smash melee.
    - Ability summons Greek Police Officers (`Astynomos`); Phase 2 Enrage summons MAT Riot Police with protective riot shields.
    - Narrative ending cutscene: Greek Police Car (`Peripoliko`) arrives with sirens to arrest Rouf for 47 nuisance calls.
    - Gold-trimmed **Story Mode Cleared** victory screen with bonus +2,500 Coins & +100 Diamonds.
  - 👴 **Wave 15 Mini-Boss: Kiloumpas & The Carbine**:
    - Bare-chested angry villager with interactive 2.35:1 widescreen cutscene (*"Thes na parw thn karampina?" ➔ "Ferthn!"*).
    - Heavy hunting carbine rifle volleys + brutal 2-handed close-quarters grab and throw launching players 500+ px.
  - 🤝 **2-Player Co-op Multiplayer Playtest (P2P WebRTC)**:
    - Zero-server-latency WebRTC DataChannels with instant 4-digit room code sharing.
    - Play Story Mode or Endless Mode cooperatively with Last Stand ghost state, wave revives, and off-screen teammate radar.
  - 🪖 **2 New Playable Heroes: Kitsos & Billias**:
    - **Billias ("The Burger Slugger")**: Burger Toss weapon + Movement Hunger passive (+20 HP burger eating).
    - **Kitsos ("The Electric Speedster")**: Highest base movement speed, Lightning Strike weapon + 10% 4-enemy Chain Lightning.
  - 🎮 **Game Mode Selection Screen**: Dedicated comic modal for Story Mode, Endless Mode, and Dungeons teaser.
  - 🎁 **Boss Equipment Drops & Polish**: Bosses drop glowing gear crates; Bubble Gun secondary shot; rename to Skatmir; mobile orientation lock.
  - ✉️ **Developer Mailbox Update & Celebration Gift**:
    - Comprehensive Alpha 1.4.0 patch notes in the Developer Inbox with claimable +2,000 Coins & +100 Gems.
  - 📐 **Modular Architecture & Quality Assurance**:
    - All 133 source files strictly `< 600 lines`.

### **Alpha 1.3.9 - Kitsos & Billias Heroes, Mobile Fullscreen & Game Mode UI Optimization**
- **Release Date:** September 9, 2026
- **Total Source Files:** **133 files**
- **Key Additions & Highlights:**
  - 🪖 **2 New Playable Heroes: Kitsos & Billias**:
    - High-definition 256x256 cropped square avatar headshots: `BilliasAvatar.png` & `KitsosAvatar.png`.
    - **Billias ("The Burger Slugger")**:
      - 2.5D rigged model matching photo (rounded cheeks, dark neat crop, black oversized script tee, cargo sweatpants).
      - Burger Toss weapon (`weaponType: 'burger'`): spinning stacked cheeseburger with lettuce, tomato, cheese, patty, sesame seed bun, and impact splat.
      - Movement Hunger Passive: moving builds hunger; eats 1 burger every 60 seconds of activity to restore **+20 HP** with `🍔 CHOMP! +20 HP` comic effect and heal crunch audio.
    - **Kitsos ("The Electric Speedster")**:
      - 2.5D rigged model matching photo (textured curly hair fade on sides with top ringlets, athletic slim build, black speckled Nike swoosh tee, burgundy shorts).
      - **Fastest hero in the game by +0.2** (base speed `5.8` vs Psogas `5.6`; in `heroes.js` `5.4` vs `5.2`).
      - Lightning Strike weapon (`weaponType: 'lightning'`): drops high-voltage electric thunderbolts.
      - **10% 4-Enemy Chain Lightning**: 10% chance on hit to arc electric beams sequentially across up to 4 enemies max with shock damage, jagged beam FX, and `⚡ CHAIN ZAP!`.
    - Full integration into Hero Roster (unlocked with coins), Menu and HUD avatars, Profile manager, and GameState.
  - 📱 **Mobile Game Mode Selection & Co-op UI Optimization**:
    - Responsive compact frame sizing for the Game Mode modal (`#game-mode-modal`).
    - Positioned the Co-op Playtest trigger button safely below the frame on mobile so it is **100% visible, centered, and easily tappable** on all mobile devices.
    - Scaled down the Co-op Playtest lobby screen (`#coop-modal`) on mobile with compact room code box, mode picker, tabs, and launch buttons.
  - 📱 **Mobile Fullscreen, Dialogue Bugfix & Asset Reliability**:
    - Added automatic fullscreen and horizontal orientation locking for touch devices.
    - Added iOS PWA standalone Web App Manifest (`manifest.json`) and comic device rotation prompt.
    - Fixed mobile cutscene dialogue skipping bug where touching once skipped multiple lines.
    - Fixed Skatmir and Kleanthis overhead health bars and name tag positioning.
  - 🕊️ **Giorgos Mazonakis Memorial Tribute Hotfix (Sept 9 – Sept 13, 2026)**:
    - Dedicated full-screen memorial tribute modal (`#mazonakis-tribute-modal`) with Greek tribute message and gold-trimmed styling.
    - 1-time only claimable reward on join: Exclusive Armor **Sakaki ths Nuxtas** (`+80 Max HP, +3% Move Speed, +8% Damage Reduction`), **+1,000 Coins**, and **+50 Diamonds**.
    - Automatic expiry guard ensuring the modal only displays until September 13, 2026 23:59:59.
  - 📐 **Modular Architecture & Quality Assurance**:
    - All 133 source files strictly `< 600 lines`.

### **Alpha 1.4.4 - 2-Player Co-op Playtest (Story & Endless Modes)**
- **Release Date:** September 6, 2026
- **Total Lines:** **32,150 LOC** (131 source files)
- **Key Additions & Highlights:**
  - 🤝 **Peer-to-Peer (P2P) WebRTC Networking**:
    - Powered by PeerJS with zero external server dependencies, running over direct UDP DataChannels.
    - Automatic 4-digit room code generation (e.g. `7429`) with 1-click clipboard copy for sharing with friends on Discord/WhatsApp.
  - 🎮 **Co-op Support for Both Story Mode & Endless Mode**:
    - Host chooses between Story Mode (waves with narrative progression and boss encounters) or Endless Mode (infinite enemy hordes).
    - Host authoritative simulation: Player 1 controls enemy spawning and drops, while Player 2 has instant, zero-latency local controls and weapon firing.
  - 💀 **Co-op Last Stand & Wave Revive Mechanic**:
    - If a player drops to 0 HP, they enter a Downed Ghost state with overhead warning tags.
    - Match only ends if **both** players are defeated simultaneously.
    - Surviving player clearing the wave automatically revives their partner back to 50% HP.
  - 🧭 **Dynamic Enemy Aggro & Off-Screen Teammate Radar**:
    - Enemies intelligently split and hunt whichever player is physically closer or still standing.
    - Screen-edge directional radar arrow dynamically points to off-screen teammate with live distance in meters.
  - 🔒 **Zero Singleplayer Disruption**:
    - Singleplayer Story Mode, Endless Mode, and save progression remain 100% untouched. All multiplayer modules are isolated in `src/network/` and `src/entities/RemotePlayer.js`.
  - 📐 **Modular Architecture & Quality Assurance**:
    - All 131 source files strictly `< 600 lines`.

### **Alpha 1.4.3 - Game Mode Selection & Skatmir Rename**
- **Release Date:** September 5, 2026
- **Total Lines:** **30,984 LOC** (125 source files)
- **Key Additions & Highlights:**
  - 🎮 **Game Mode Selection Screen**:
    - Clicking "PLAY NOW" (`#start-btn`) now opens a dedicated comic modal (`#game-mode-modal`) instead of immediately starting the game.
    - Features the exact high-res artwork screen (`assets/GameModeIcons/modal_full_frame.png`):
      - **Story Mode**: The classic 20-wave narrative campaign featuring the Parthenon temple, blue ribbon banner, and "⚔️ PLAY STORY" button.
      - **Endless Mode**: Infinite scaling waves featuring the golden Spartan helmet with purple plumage & laurels, purple ribbon, and "🛡️ PLAY ENDLESS" button.
      - **Dungeons (Locked)**: Atmospheric stone arch portal with wall torches and padlock banner, triggering interactive feedback toasts upon click.
    - Pixel-perfect responsive frame with 3D card hover-lift animations, glowing aura effects, red circular close button, and full mobile scaling (`styles/gamemode.css`).
  - 🚫 **Endless Mode Decoupled from Story Bosses & Cutscenes**:
    - Removed story bosses (Kleanthis, Kiloumpas, Rouf) and story cutscenes from Endless Mode.
    - Waves 10, 15, 20, and beyond spawn regular enemy hordes (Skatmir, Casillas, Skarmogyftos) with progressive difficulty scaling.
    - Added defensive guard in `CinematicCutsceneOverlay` preventing cutscene triggers or letterbox freezes during Endless runs.
    - Wave 20 in Endless seamlessly advances to Wave 21 without freezing player controls or showing credits.
  - 💥 **Enemy Rename: "Fatmir" ➔ "Skatmir"**:
    - Renamed all player-facing strings, killfeed notifications, quest objectives, loading tips, leaderboard entries, credits rolls, and dialogs from "Fatmir" to "Skatmir".
    - Maintained 100% backward compatibility with existing save profiles (`totalFatmirs`) and sprite asset paths (`Fatmirfront.png`).
  - 🪖 **Hero Roster: Psgiannhs Teaser Card**:
    - Added "Psgiannhs" as a mystery teaser card (`⏳ COMING SOON`) in the Hero Roster with classified stats, training perks, and interactive dialogue modal.
  - 📐 **Modular Architecture & Quality Assurance**:
    - All 125 source files strictly `< 600 lines`.

### **Alpha 1.4.0 - Wave 20 Final Boss Rouf & The Authorities**
- **Release Date:** September 5, 2026
- **Total Lines:** **33,546 LOC** (+1,609 lines from Alpha 1.3.1)
- **Key Additions & Highlights:**
  - 🚨 **Wave 20 Boss: Rouf (The Snitch)**:
    - 55-year-old neighborhood informant aesthetic with balding grey comb-over, reading glasses, bushy mustache, cardigan vest, trousers, and leather moccasins (`RoufRenderer.js`).
    - Cleaned overhead HUD title to `"🚨 ROUF 🚨"` (removed "Final Boss").
    - Introductory 2.35:1 widescreen cutscene: complaining the player is being loud on the street and summoning the police with exact Greek dialogue lines.
    - **Option A Weapon: 90s Heavy Brick Mobile Phone & Telescopic Antenna**:
      - 3-round burst & 5-way spread dial-tone soundwave ring pulses (`"BEEP BEEP BEEP! 📡"`).
      - Melee punish: heavy phone swat dealing 45 damage with 140px knockback and hasty retreat sprint.
    - **Ability 1: "100! Send the Patrol!"**:
      - Channels emergency call with police sirens and arena-wide warning sweeps.
      - Dispatches squads of Greek Police Officers (`Astynomos.js`) with peaked caps and batons.
    - **Phase 2 Enrage (<= 50% HP)**:
      - Screams *"STEILTE TA MAT! KINTOYNEVW!"* into his phone.
      - Calls armored MAT Riot Police with riot shields (50% frontal deflection).
      - Antenna overclocks into 8-directional radial soundwave bursts and +32% panicked movement speed.
  - 🚔 **Story Mode Climax & Ending Cutscene**:
    - Defeating Rouf drops him to his knees as his brick phone cracks and smokes on the asphalt.
    - Greek Police Car (`Peripoliko`) screeches into the scene with flashing red and blue rooftop siren strobes.
    - 6-frame narrative resolution in Greek where the authorities arrest Rouf for making 47 nuisance calls to 100.
    - Story Mode officially concludes at Wave 20 (does not loop to Wave 21).
    - Grand gold-trimmed **Story Mode Cleared** victory screen with stats, +2,500 coins and +100 diamonds bonus, and return to village menu button.
  - 📐 **Modular Architecture & Quality Assurance**:
    - All 121 source files strictly `< 600 lines`. Delimiter and syntax tests 100% verified.

---

### **Alpha 1.3.1 - Wave 15 Mini-Boss Kiloumpas & Combat Immersion**
- **Release Date:** September 5, 2026
- **Total Lines:** **31,937 LOC** (+6,139 lines from Alpha 1.3.0)
- **Key Additions & Highlights:**
  - 👴 **Wave 15 Mini-Boss: Kiloumpas**:
    - Shirtless, big-stomached, fat angry Greek villager mini-boss (`Kiloumpas.js` & `KiloumpasRenderer.js`).
    - Narrative 2.35:1 widescreen cinematic cutscene at Wave 15 start (*"Thes na parw thn karampina?"* ➔ *"Ferthn!"*).
    - Smooth HUD and mobile controls fade out/in during cutscene.
    - Click-to-continue dialogue cards with debounced input pacing.
    - Long-range Hunting Carbine (Karampina) rifle volleys with spread and muzzle flash.
    - **0.7s Close-Quarters Grab & Far Airborne Throw**:
      - Outstretched bare muscular arms hoist and clamp onto the player with strain jitter and roaring expression.
      - Player kicks and struggles in mid-air (`airZ` rises to 38px) with elevated overhead health bar.
      - Violent 2-handed forward heave throwing the player ~520px across the arena with high vertical parabolic arc ($v_z = 17.5$).
      - Mid-air somersault tumbling (`airRotation`), mid-air wind streak trails, dynamic ground shadow, and ground slam landing shockwave, dust, screen shake, and `"YEET! 💥"` comic popup.
  - 🫧 **Bubble Gun Evolution & Boss Immunity**:
    - Charged Big Bubble right-click secondary mechanic.
    - Bosses (Kleanthis & Kiloumpas) are completely immune to entering or getting trapped inside bubbles; bubble deals full charged damage and immediately pops with cyan/blue bubble sparks, shockwave rings, and `"🫧 POP!"` sound.
  - 🎬 **Cinematic Cutscene Overlay Subsystem**:
    - `src/ui/CinematicCutsceneOverlay.js`: dedicated widescreen letterboxing, canvas resolution independence, responsive typography, and input advance coordination.
  - 📐 **Modular Architecture & Quality Assurance**:
    - All 118 source files strictly `< 600 lines`.

---

### **Alpha 1.3.0 - The Armory Awakens & Combat Evolution (OUR BIGGEST UPDATE YET!)**
- **Release Date:** September 4, 2026
- **Total Lines:** **~25,800 LOC** (+6,600 lines from Alpha 1.2.1)
- **Key Additions & Highlights:**
  - 🛡️ **Phase 1: The Core Armory System**:
    - **5 Dedicated Equipment Slots**: 🪖 **Helmet**, 🦺 **Armor**, 🥋 **Belt**, 🥊 **Gloves**, and 🩴 **Boots**.
    - **40 Balanced Equipment Items**: 8 items per slot (3 Common, 3 Uncommon, 2 select Rare pieces).
    - **Clean Tier Progression**: Common (⚪) and Uncommon (🟢) feature single readable primary stats; Rare (🔵) adds 1 utility secondary stat (e.g. *Grillmaster Leather Apron* with +55 Max HP & +6% Damage Reduction).
    - **Survivor Loadout Display**: Left and right 3-slot columns framing the hero preview with real-time ATK, HP, and DEF calculations.
    - **Interactive Armory Backpack**: Fast sub-tab filtering (`[WEAPONS]`, `[HELMETS]`, `[ARMOR]`, `[BELTS]`, `[GLOVES]`, `[BOOTS]`), rarity borders, and click-to-equip/unlock mechanics.
    - **Anti-Godmode Engine Caps**: Hard-capped at 40% Damage Reduction and 45% Crit Chance to safeguard combat challenge.
  - 🎖️ **Battle Perks Loadout System**:
    - Call of Duty-style 3-slot loadout with freeform perk builds (Hot Foot, Counter-Blast, Second Wind, Headhunter, Golden Touch).
    - Tiered coin progression and physical Gold Pouch loot drops from elite brutes.
  - ⚡ **Expanded 5-Skill Arsenal & Rarity Tiers**:
    - 5 unique active skills: Nerobalonaki (Common), Blade Rush (Uncommon), Seismic Quake (Rare), Yaya Scream (Epic), Frappés (Legendary).
    - Level 5 "Pagakia" Mastery for Frappés+: permanent -3.0s cooldown, Sub-Zero Ice Aura, and kill frenzy extensions.
  - 💥 **Arena Real-Time Ground Fissure Engine**:
    - Radiating ground cracks, bedrock rubble decals, and tremor glows dynamically rendered under entities.
  - 🪑 **Destructible Pagakia (Arena Benches)**:
    - Interactive park benches for bullet cover, projectile ricochets, and splinter explosions.
  - 💰 **Hero Roster & Weapon Expansion**:
    - Playable cash-blaster hero 50balos and signature Money Gun with piercing 50€ banknotes.
  - 💾 **Universal Cloud & Local Save Persistence**:
    - Complete `SaveSerializer` schema storing gear loadouts, unlocked equipment, perks, and permanent power upgrades.
  - 📱 **Mobile & Tactile UI Polish**:
    - Fully responsive modal layouts, touch controls, and developer mailbox gifts (+1,500 Coins & +75 Gems).
  - 📐 **Modular Architecture**: All 106 source files strictly remain `< 600 lines`.

---

### **Alpha 1.2.6 - Skill Rarities, Dynamic Tiers & Frappes Pagakia Mastery**
- **Release Date:** September 4, 2026
- **Key Additions & Changes:**
  - **Skill Rarities & Tier System**:
    - **Common (⚪): Nerobalonaki** (First skill, least expensive, 3 upgrades / maxLevel: 3). Drenches arena floor, slowing enemy walk speed and amplifying incoming damage.
    - **Uncommon (🟢): Blade Rush** (3 upgrades / maxLevel: 3). High-speed knife slash dash with invulnerability frames and cleave reach.
    - **Rare (🔵): Seismic Quake** (4 upgrades / maxLevel: 4, unlock 🪙 1,400). Titan ground stomp releasing 360° seismic shockwaves that deal heavy crushing damage, stun enemies, and interrupt brute charges. Spawns radiating jagged ground cracks and bedrock fissures with tremor glow and stone rubble particles.
    - **Epic (🟣): Yaya Scream** (5 upgrades / maxLevel: 5, unlock 🪙 2,800). Greek auntie megaphone 180° frontal cone deflecting bullets, dealing sonic damage, and inflicting Fear.
    - **Legendary (🟠): Frappes** (5 upgrades / maxLevel: 5, unlock 🪙 5,000) with **Mastery Capstone: "Pagakia" (🧊 Ice Cubes / Frappes+)**:
      - Level 5 Mastery requires dual currencies: 🪙 15,000 Gold Coins + 💎 120 Diamonds.
      - Unlocks "Frappes+": permanent -3.0s cooldown reduction (9.0s vs 12.0s), Sub-Zero Ice Aura that slows enemies by 50% on contact and bullet hit, and kills extend frenzy duration by +0.8s.
      - **Precise Frenzy Duration & Cooldown Lifecycle**: Skill bar actively drains down during frenzy and refills upwards with kills (+0.8s / +48f).

---

### **Alpha 1.2.5 - Battle Perks System & Tiered Coin Unlocks**
- **Release Date:** September 4, 2026
- **Key Additions & Changes:**
  - **Battle Perks System**: 5 equippable perks in a Call of Duty-style 3-slot loadout modal (`#talents-modal`).
  - **Option A Freeform Equipping**: Players can equip any 3 perks across the 3 loadout slots without slot-type restrictions.
  - **Tiered Coin Pricing**: Unlockable with Gold Coins (Hot Foot, Counter-Blast, Golden Touch, Second Wind, Headhunter).
  - **Combat Mechanics**: Dash flame trails, radial knockback blasts, emergency speed rescues, execute damage, and physical gold pouches.

---

### **Alpha 1.2.1 - The Rebetiko, Active Skills & Stealth Admin Update**
- **Release Date:** September 2, 2026
- **Total Lines:** **19,201 LOC** (+10,000 lines from Alpha 1.1)
- **Key Additions & Changes:**
  - **Active Hero Skills Introduced**: Added active combat skills (Blade Rush & Nerobalonaki) with upgrade trees up to Level 3, water puddles, and slicing combos.
  - **Kleanthis Boss Encounter**: Wave 10 multi-form boss with wine drinking, drunk mode, karate kick leap slam with 3s stun, crimson rage mode, and wine bottle volleys.
  - **Firebase Stealth Admin Panel**: Secret `F1` / `~` access verified strictly against Firebase Firestore `admins/{email}`.
  - **Comic Popups GPU Cache**: Pre-rendered offscreen bitmaps (`ComicPopupCache.js`) saving ~20x rendering cost; dynamic multi-kill combos.
  - **Developer Mailbox**: Studio-style Alpha 1.2 patch notes with unread sorting priority.

---

### **Alpha 1.1 - New Rogue Enemy & Audio/Performance Boost**
- **Release Date:** August 2026
- **Total Lines:** **~9,200 LOC**
- **Key Additions:**
  - **New Enemy: Skarmogyftos (Wave 6+)**: Rogue enemy with curved smoke volleys, sleep/slow clouds, and smoke-vanish abilities.
  - **Performance Boost**: Initial spatial collision checks and rendering optimizations for 60 FPS gameplay.
  - **Audio & SFX Enhancements**: Added dash sound effects and in-game volume slider controls.
  - **Starter Pack Checkout**: Added bundle modal with countdown timer.

---

### **Alpha 1.0 - Foundation & Arena Prototype**
- **Release Date:** Initial Release
- **Total Lines:** **~5,400 LOC**
- **Key Additions:**
  - Core arena shooter gameplay featuring Psanas, Petros, and Psogas.
  - Fatmir and Casillas enemies.
  - Basic shooting physics, loot drops (XP cookies, hearts, stars), and local save state.

---

*(UPDATE THIS FILE EVERY TIME DONT FORGET!)*