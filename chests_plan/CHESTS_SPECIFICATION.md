# 📦 Lesa.io — 4-Slot Chest System & Economy Specification

> **Master Design Document**: Comprehensive specification for the Main Menu 4-Slot Chest System, Drop Rates, Acquisition Paths, and Opening Mechanics.

![Chests Menu UI Preview](chests_menu_mockup.png)

---

## 🧭 System Overview

The **4-Slot Chest System** acts as the primary progression and player retention engine for *Lesa.io*. It fills the lower-center section of the main menu, directly connecting wave survival combat to the **Armory & Gear progression loop**.

### Core Pillars
1. **4 Persistent Slots**: Players can hold up to **4 chests** at a time.
2. **Initial State**: All 4 slots start **EMPTY**. Chests must be earned through gameplay, completed quests, or acquired with gems.
3. **Timer Unlocks**: Only **one chest can be unlocking at a time** (free), creating a natural return loop throughout the day.
4. **Instant Gem Speed-Up**: Players can spend Gems 💎 to unlock chests instantly, giving Gems high-value utility.
5. **Direct Armory Synergies**: Chests deliver equippable gear (Helmets, Armors, Belts, Gloves, Boots), gold coins, and duplicate items needed for future 3-to-1 Gear Fusion.

---

## 🎨 Slot States & Visual Representation

Each of the 4 slots on the main menu can exist in one of **5 dynamic states**:

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   EMPTY SLOT    │  │   LOCKED CHEST  │  │ UNLOCKING CHEST │  │   READY TO OPEN │
│                 │  │   [Chest Art]   │  │   [Chest Art]   │  │   [Chest Art]   │
│   (Dashed Rim)  │  │                 │  │                 │  │ (Pulsing Glow)  │
│   WIN BATTLES   │  │   TAP TO UNLOCK │  │   ⏱️ 02:44:12    │  │  TAP TO OPEN!   │
│    TO EARN      │  │                 │  │ (💎 25 SPEED UP)│  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

1. **EMPTY**: Dashed comic outline with an empty crate silhouette. Displays: *"Empty Slot — Win Battles to Earn"*.
2. **LOCKED**: Shows the earned chest with its rarity banner and icon. Displays: *"TAP TO UNLOCK"*.
3. **UNLOCKING**: Active real-time countdown timer (`⏱️ 02:59:15`). Displays an instant-open button: *"OPEN NOW (💎 X)"*.
4. **READY / CLAIMABLE**: Shimmering golden border with a comic bounce animation. Displays: *"TAP TO OPEN!"*.
5. **OPENING**: Triggers the interactive fullscreen Loot Explosion Modal with card flip animations and sound effects.

---

## 🏆 Chest Tiers & Official Assets

Assets are located in [assets/Chests/](file:///c:/Lesa.io/assets/Chests/):

| Tier | Asset Filename | Visual Theme | Unlock Timer | Gem Speed-Up Cost |
| :--- | :--- | :--- | :---: | :---: |
| **🟢 Common** | `CommonChest.png` | Weathered oak wood with heavy iron bands and keyhole | **15 Minutes** | 5 Gems |
| **🟢 Uncommon** | `UncommonChest.png` | Pine green planks with polished silver frame and emerald studs | **30 Minutes** | 15 Gems |
| **🔵 Rare** | `RareChest.png` | Electric blue reinforced vault with sapphire crystal accents | **1,5 Hours** | 35 Gems |
| **🟣 Epic** | `EpicChest.png` | Royal purple lacquer with gold gilding and magenta diamonds | **5 Hours** | 80 Gems |
| **🟠 Legendary** | `LegendaryChest.png` | Molten red core with winged golden crown crest and ruby jewel | **12 Hours** | 200 Gems |
| **🔴 Mythic** | `MythicChest.png` | Cosmic void obsidian wrapped in divine gold armor plates | **24 hours** | Special |

---

## ⚡ Daily Free Skip & Unlock Mechanics

* **No Free Chest Per Day**: Players cannot claim a free chest each day.
* **1-Minute Daily Free Finish**:
  * **Eligible Chests**: **Common** or **Uncommon** chests ONLY.
  * **Threshold**: Timer must be down to **1 minute and lower** (`<= 60 seconds`).
  * **Frequency**: Exactly **once per calendar day** (`1/day`).
  * **Higher Tiers Excluded**: Rare, Epic, Legendary, and Mythic chests are never eligible for free skips.
* **Instant Gem Speed-Up**: Players can spend Gems anytime to speed up or instantly open any unlocking chest.

---

## 🎯 How Each Chest is Obtained

Chests are awarded through **3 primary gameplay channels**:

### 1. Match Milestones & Boss Victories
Chests are not given away for basic wave 1–4 runs. Instead, they are earned for major gameplay milestones when an empty chest slot is available:

| Match Milestone | Common | Uncommon | Rare | Epic | Legendary |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Defeat Boss (Wave 10 / Kleanthis)** | — | **60%** | **38%** | **2%** | — |
| **Wave 15 Mini-Boss (Alpha 1.4)** | — | — | **50%** | **40%** | **10%** |
| **Wave 20 Chapter Boss (Alpha 1.4)**| — | — | — | **65%** | **35%** |

*(If all 4 slots are full when a boss is defeated, the player still earns coins and XP, with a notification: "Chest slots full! Unlock a chest to make room.")*

### 2. Daily Challenges & Quests
* **Individual Daily Quests**: Chance to award a **Common** or **Uncommon Chest** alongside gold rewards.
* **Weekly Mastery (Complete all 5 Daily Quests 5 days in a row)**: Awards a guaranteed **Epic Chest**.

### 3. In-Game Currency Shop (Gems & Coins)
Players who want immediate gear progression can purchase chests directly:

* **Common Chest**: 100 Gems 💎 *(or 2,500 Coins 🪙)*
* **Rare Chest**: 250 Gems 💎
* **Epic Chest**: 500 Gems 💎
* **Legendary Chest**: 1000 Gems 💎

---

## 📊 Drop Tables & Probability Rates

Each chest contains **Gold Coins**, **Gems**, and a guaranteed number of **Equipment Pieces**:

### 🟢 1. Common Chest (15 Min Unlock)
* **Coins**: `250 – 500`
* **Gems**: `0 – 2` *(20% chance to drop 1–2 gems)*
* **Total Gear Cards**: `1 – 2 items`
* **Gear Rarity Probabilities**:
  * ⚪ Common Gear: **88%**
  * 🟢 Uncommon Gear: **12%**
  * 🔵 Rare Gear: **0%**

---

### 🟢 2. Uncommon Chest (30 Min Unlock)
* **Coins**: `600 – 1,200`
* **Gems**: `2 – 5` *(40% chance)*
* **Total Gear Cards**: `2 items`
* **Gear Rarity Probabilities**:
  * ⚪ Common Gear: **35%**
  * 🟢 Uncommon Gear: **60%**
  * 🔵 Rare Gear: **5%**

---

### 🔵 3. Rare Chest (1,5 Hours Unlock)
* **Coins**: `1,500 – 3,200`
* **Gems**: `5 – 12` *(100% Guaranteed)*
* **Total Gear Cards**: `3 items`
* **Gear Rarity Probabilities**:
  * ⚪ Common Gear: **15%**
  * 🟢 Uncommon Gear: **60%**
  * 🔵 Rare Gear: **25%** *(Guaranteed at least 1 Rare!)*
  * 🟣 Epic Gear: **0.5%** *(Lucky jackpot)*

---

### 🟣 4. Epic Chest (5 Hours Unlock)
* **Coins**: `4,500 – 9,000`
* **Gems**: `15 – 35` *(100% Guaranteed)*
* **Total Gear Cards**: `4 items`
* **Gear Rarity Probabilities**:
  * 🟢 Uncommon Gear: **30%**
  * 🔵 Rare Gear: **55%**
  * 🟣 Epic Gear: **15%** *(Guaranteed at least 1 Epic!)*
  * 🟠 Legendary Gear: **1.5%** *(Lucky jackpot)*

---

### 🟠 5. Legendary Chest (12 Hours Unlock)
* **Coins**: `12,000 – 28,000`
* **Gems**: `50 – 120` *(100% Guaranteed)*
* **Total Gear Cards**: `5 items`
* **Gear Rarity Probabilities**:
  * 🔵 Rare Gear: **40%**
  * 🟣 Epic Gear: **45%**
  * 🟠 Legendary Gear: **15%** *(Guaranteed at least 1 Legendary Relic!)*
  * 🔴 Mythic Star-Stone: **0.8%** *(Endgame awakening material)*

---

### 🔴 6. Mythic Chest (Endgame / Milestone Capstone)
* **Coins**: `35,000 – 75,000`
* **Gems**: `150 – 350` *(100% Guaranteed)*
* **Total Gear Cards**: `6 items`
* **Gear Rarity Probabilities**:
  * 🟣 Epic Gear: **40%**
  * 🟠 Legendary Gear: **50%**
  * 🔴 Mythic Awakened Relic: **10%** *(Guaranteed at least 1 Mythic or Star-Stone)*

---

## 🛠️ Implementation Architecture Plan

To adhere strictly to our **Developer Directives** (modular files `< 600 lines`, no bloated monoliths, backward compatible):

```
c:\Lesa.io\
├── assets/Chests/             # Existing PNG icons (Common, Uncommon, Rare, Epic, Legendary, Mythic)
├── chests_plan/               # Specification and visual mockups
│   ├── chests_menu_mockup.png # User reference UI mockup
│   └── CHESTS_SPECIFICATION.md# This design & economy specification
├── src/
│   ├── data/
│   │   └── chests.js          # Static definitions, drop tables, timers, gem costs (~120 lines)
│   ├── chests/
│   │   ├── ChestManager.js    # 4-slot state manager, timer engine, localStorage sync (~240 lines)
│   │   └── ChestModalUI.js    # Interactive loot opening sequence & card reveals (~280 lines)
├── styles/
│   └── chests.css             # 4-slot grid layout, comic borders, timer pills, modal styles (~220 lines)
```

### Key Technical Details:
1. **Timestamp Persistence**:
   * Timers calculate remaining duration using `Date.now() - unlockStartTime`.
   * If a player closes the browser and returns 3 hours later, the chest is immediately ready to claim!
2. **Empty Slot Defaults**:
   * Initial player state: `[null, null, null, null]`.
   * Rendering an empty slot shows an interactive state that informs the player how to earn chests.
3. **Clean Integration**:
   * Injected as `<div id="menu-chest-slots" class="menu-chest-slots"></div>` into `#menu-screen` in `index.html`.
   * Dispatches events via `window.EventBus` (`chestEarned`, `chestUnlocked`, `chestOpened`).
