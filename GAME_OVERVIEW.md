# 🎮 Lesa.io - Game Overview & Design Document

> **Lesa.io** is a fast-paced, vibrant cartoon arena shooter built with HTML5 Canvas and Vanilla JavaScript. Inspired by arcade survival classics and modern comic aesthetics, players battle eccentric enemies across relentless waves, unlock unique Greek-themed cartoon heroes, master active skills, and conquer multi-stage boss encounters.

---

## 🎯 1. Core Concept & Gameplay Loop

### The Core Loop:
1. **Survive & Eliminate Waves**: Enter the arena and dodge swarming enemy waves with dynamic pathfinding and aggressive behaviors.
2. **Collect & Level Up**: Defeat enemies and smash crates to collect **XP Cookies** (for run score & level-ups), **Hearts** (vitality), and **Stars / Gems**.
3. **Master Active Combat**:
   - **Shooting**: Precision aiming with mouse cursor and left-click fire.
   - **Combat Dash (`SPACE` / Right-Click)**: High-speed repositioning with invulnerability frames (`i-frames`) to escape swarms and dodge projectiles.
   - **Active Skill (`E`)**: Unleash your currently equipped tactical hero skill (Blade Rush or Nerobalonaki).
4. **Boss Climax (Wave 10)**: Face off against the legendary tavern boss **Kleanthis the Rebetis** through three escalating combat phases.
5. **Meta Progression**: Earn **Gold Coins** and **Precious Gems** to unlock new heroes from the roster, level up character masteries, and upgrade skills to Level 3.

---

## 👥 2. Playable Heroes (The Roster)

Every hero has unique base stats, distinct weapon characteristics, and specialized playstyles:

### 🎯 Psanas (The Balanced Gunslinger)
- **Role**: All-Around / Starter Hero
- **Weapon**: Dual Slingshot (Balanced Fire Rate & Spread)
- **Playstyle**: Reliable and versatile at mid-range. Perfect for learning enemy patterns, kiting swarms, and executing smooth dashes.
- **Base Stats**: 100 HP | High Mobility | Fast Reload

### 🛡️ Petros (The Heavy Brawler)
- **Role**: Tank / Close-Quarters Bruiser
- **Weapon**: Heavy Spread Shotgun (Wide Cone Blast)
- **Playstyle**: High-health juggernaut who thrives in close combat. Blasts dense groups of enemies with devastating shotgun spreads and high knockback.
- **Base Stats**: 150 HP | Slower Speed | Heavy Knockback

### 🍉 Psogas (The Precision Sniper)
- **Role**: High-Damage Sniper / Crowd Controller
- **Weapon**: Piercing Melon Launcher (Heavy Projectiles)
- **Playstyle**: High risk, high reward. Fires heavy-caliber piercing shots that tear straight through entire enemy lines with maximum damage per hit.
- **Base Stats**: 85 HP | Moderate Speed | Piercing High Damage

---

## ⚡ 3. Active Hero Skills

Players choose and equip **one Active Skill** into their loadout from the Skill Manager, activated in-game with the **`E` Key**:

1. **Blade Rush (Equipped `E` Active Skill)**:
   - The hero unsheathes a glowing energy blade and dashes forward with lightning speed, slicing through all enemies in their path.
   - **Upgrade Trees**: Level 1 (Base slice) ➔ Level 2 (+Damage & speed) ➔ Level 3 (Cleaving Shockwave & cooldown reduction).
2. **Nerobalonaki / Water Balloon (Equipped `E` Active Skill)**:
   - Launches a water balloon that bursts upon impact, drenching enemies, creating slippery water puddles that slow enemy movement by 45%, and amplifying incoming damage.
   - **Upgrade Trees**: Level 1 (Base splash) ➔ Level 2 (Larger puddle radius) ➔ Level 3 (Damage vulnerability amplifier).

---

## 👾 4. The Rogues' Gallery (Enemies)

### 🥊 Fatmir (The Melee Bruiser)
- **Behavior**: Relentless chaser who locks onto the player and charges at close proximity.
- **Special Attack**: Heavy ground slam that generates orange shockwaves and comic dust.

### ⚽ Casillas (The Athletic Striker)
- **Behavior**: Agile goalkeeper who circles the player with nimble strafing runs.
- **Special Attack**: Soccer kick volley launching bouncing balls that ricochet off walls and obstacles.

### 💨 Skarmogyftos (The Tricky Rogue - Spawns Wave 6+)
- **Behavior**: Sly rogue who keeps his distance with evasive elliptical orbits.
- **Special Attack**: Launches curved smoke projectile volleys, leaves drowsy sleep clouds that slow heroes, and uses smoke-vanish when cornered.

---

## 👑 5. The Ultimate Boss: Kleanthis the Rebetis (Wave 10)

The pinnacle combat challenge of the arena, featuring custom battle cries (`"ELA NA SOU PW RE!"`) and 3 dynamic forms:

- **Form 1 (The Tavern Rebetis)**:
  - Wields a bottle of wine and takes periodic sips every 8 seconds, filling his **Drunk Meter**.
  - Summons minion packs (Fatmir, Casillas, Skarmogyftos) every 10 seconds.
- **Form 2 (Drunk Mode - 100% Meter)**:
  - Gains +30% health boost, erratic zig-zag movement, and unlocks the **Flying Karate Kick** (aerial leap slam that deals heavy damage and stuns the hero for 3 seconds).
- **Form 3 (Crimson Rage Mode - Under 50% HP)**:
  - Engulfed in crimson fire with increased move speed and damage.
  - Fires dense 16-shard **Red Shatter Volleys** across the arena.

---

## 🎨 6. Comic Visuals & Audio Aesthetics

- **Comic Popups**: Pre-rendered GPU-cached comic splashes (`"POW!"`, `"BONK!"`, `"DOUBLE K.O! 💀"`, `"MEGA K.O! 💥"`).
- **Destructible Arena**: Dynamic obstacles including wooden crates with hidden loot, bouncy mushrooms, and explosive barrels.
- **Soundtrack & Synthesis**: Real-time Web Audio synthesizer providing punchy hits, level-up fanfares, and dynamic soundtrack with independent volume sliders.

---

## ☁️ 7. Cloud Persistence & Security

- **Google Cloud Save**: Seamless progress syncing (coins, gems, level, high scores) powered by Firebase Firestore (`players/{uid}`).
- **Stealth Admin Console**: Invisible playtesting panel accessible exclusively to authorized Firebase accounts via silent `F1` / `~` hotkeys.
