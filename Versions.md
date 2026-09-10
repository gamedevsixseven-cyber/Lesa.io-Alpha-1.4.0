# 📜 Lesa.io - Version Line Count & State History

This file tracks the total lines of code and game architecture state across every version release of **Lesa.io**.

---

## 📊 Current Version Summary

| Metric | Current Value |
|---|---|
| **Active Version** | **Alpha 1.4.0 (Story Expansion, Bosses Kiloumpas & Rouf, Co-op Playtest & New Heroes)** |
| **Milestone Banner** | 🔥 **OVER 33,000 LINES OF MODULAR CODE!** |
| **Total Source Files** | **133 files** |
| **Max Lines Per File** | Strictly `< 600 lines` across all modules |
| **Last Calculated** | September 10, 2026 |

---

## 📂 Lines by File Extension

| File Type | Description | File Count | Total Lines | Share |
|---|---|---|---|---|
| **`.js`** | JavaScript Game Logic & Subsystems | 99 | 26,450 | 72.5% |
| **`.css`** | UI, HUD, Armory, Co-op & Theatrical Styles | 20 | 6,580 | 18.0% |
| **`.html`** | Main Application & Canvas Shell | 1 | 1,843 | 5.0% |
| **`.md`** | Game Design, Gear, Roadmap & Version Specs | 8 | 1,510 | 4.1% |
| **`.ps1`** | Local Web Server & Automation | 5 | 390 | 1.1% |
| **`.cs`** | Desktop C# Game Launcher | 1 | 270 | 0.7% |

---

## 📈 Version Progression Log

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