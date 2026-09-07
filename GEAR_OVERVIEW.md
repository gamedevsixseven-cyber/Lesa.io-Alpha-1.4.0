# ⚔️ Lesa.io — Gear System Compendium & Staged Roadmap

> **Master Design & Progression Plan**: Comprehensive reference for Lesa.io's equippable Gear System.
> **Design Philosophy**: Move slowly and carefully. Establish a rock-solid, balanced foundation with **Common, Uncommon, and select Rare gear first** before introducing higher-tier progression, story bosses, and endgame awakening.

---

## 🗺️ Master Staged Roadmap

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🎯 PHASE 1 — ALPHA 1.3 (OUR BIGGEST UPDATE YET!): The Core Armory           │
│ ├─ 5 Equipment Slots: Helmet, Armor, Belt, Gloves, Boots                    │
│ ├─ Simple Common (⚪), Uncommon (🟢), and balanced Rare (🔵) gear only       │
│ ├─ Single-stat early progression (clean, zero clutter)                      │
│ ├─ Interactive Armory modal (Sub-Tabs, Equip, Unequip, Live Stats)          │
│ └─ Integration with Player stats, Damage Reduction, and SaveSerializer      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚔️ PHASE 2 — ALPHA 1.4: Story Expansion, Endless Mode & Boss Chapter 2      │
│ ├─ Story Mode Expansion (Waves 11–20) or New Endless Mode                   │
│ ├─ New enemy types & elite brutes                                           │
│ ├─ Mid-wave Mini-Boss (Wave 15)                                             │
│ ├─ New Story Boss Encounter (Wave 20) following Kleanthis the Rebetis       │
│ └─ In-game equipment drops from boss crates                                 │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 💎 PHASE 3 — ALPHA 1.5: Epic & Legendary Gear + Fusion System               │
│ ├─ Epic (🟣) gear pieces with Signature Passives                            │
│ ├─ Legendary (🟠) S-Tier relics with Capstone Abilities                     │
│ ├─ 3-to-1 Duplicate Merging / Fusion in the Armory                          │
│ └─ Thematic 2-Piece & 4-Piece Set Synergies (Tourist, Yaya, Psistis)        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔴 PHASE 4 — ALPHA 1.6: Mythic Awakening & The Olympian Star-Stone          │
│ ├─ 🔴 Mythic (Awakened) Tier with radiant animations & level cap 40        │
│ ├─ The Olympian Star-Stone ultra-rare drop (0.8%)                           │
│ ├─ Awakened Mythic Capstones (Phantom Phalanx, Levitation, Geysers)         │
│ └─ "Frappé Bean Infusion" Socketing System (1–2 bean sockets)               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧭 Phase 1 Core Design Rules

### A. The 2-Pillar Combat Split
- **Offense Slots (Left)**: 🪖 **Helmets** (Crit) + 🥊 **Gloves** (Fire Rate & Bullet Damage)
- **Defense & Utility Slots (Right)**: 🦺 **Armor** (HP & Damage Reduction) + 🥋 **Belts** (Dash Mobility & Ammo) + 🩴 **Boots** (Speed)

### B. Clean Progression Rule (No Early Clutter)
- ⚪ **Common & 🟢 Uncommon**: Strictly **ONE primary stat**. Simple, readable, zero confusion.
- 🔵 **Rare**: Adds **ONE secondary utility stat** (e.g. Crit Damage, Dash Distance, Max HP).
- 🟣 **Epic & Above**: Reserved for Phases 3 & 4.

### C. Engine Stat Caps (Anti-Godmode Protection)
- **Damage Reduction**: Hard-capped at `40%`.
- **Movement Speed**: Soft-capped at `7.5` (base: `5.0 – 5.6`).
- **Crit Chance**: Hard-capped at `45%`.
- **Dash Cooldown**: Cannot drop below `1.2s` (72 frames; base: `3.0s` / 180 frames).

---

## 🪖 1. Helmets (Headgear)

| Phase | Rarity | Item Name | Primary Stat | Secondary Stat (Rare+) |
| :--- | :--- | :--- | :--- | :--- |
| **P1** | ⚪ **Common** | **Straw Beach Hat** | +3% Crit Chance | — |
| **P1** | ⚪ **Common** | **Souvlaki Paper Cap** | +4% Crit Chance | — |
| **P1** | ⚪ **Common** | **Knitted Winter Beanie** | +15 Max HP | — |
| **P1** | 🟢 **Uncommon** | **Greek Fisherman's Cap** | +5% Crit Chance | — |
| **P1** | 🟢 **Uncommon** | **Neon Sun Visor** | +6% Crit Chance | — |
| **P1** | 🟢 **Uncommon** | **Scooter Delivery Helmet** | +5% Crit Chance | — |
| **P1** | 🔵 **Rare** | **Diver’s Snorkel Mask** | +7% Crit Chance | +12% Crit Damage |
| **P1** | 🔵 **Rare** | **Bedrock Hardhat** | +6% Crit Chance | +25 Max HP |
| **P1** | 🔵 **Rare** | **Tactical Gaming Headset** | +8% Crit Chance | -6% Skill Cooldown |
| *P3* | 🟣 **Epic** | **Yaya’s Blessed Kerchief** | +10% Crit Chance | +18% Crit Damage *(Passive: Evil Eye Ward)* |
| *P3* | 🟣 **Epic** | **Byzantine Laurel Wreath** | +11% Crit Chance | -9% Skill Cooldown *(Passive: Imperial CDR)* |
| *P3* | 🟠 **Legendary** | **Ancient Spartan Helm** | +15% Crit Chance | +28% Crit Damage *(Tremor shockwave)* |
| *P4* | 🔴 **Mythic** | **Spartan Helm of Leonidas (Awakened)** | +20% Crit Chance | +38% Crit Damage *(Summons Spartan spearmen)* |

---

## 🦺 2. Armor (Torso / Chest)

| Phase | Rarity | Item Name | Primary Stat | Secondary Stat (Rare+) |
| :--- | :--- | :--- | :--- | :--- |
| **P1** | ⚪ **Common** | **White Ribbed Tank Top** | +18 Max HP | — |
| **P1** | ⚪ **Common** | **Tourist "I ❤️ Greece" Tee** | +15 Max HP | — |
| **P1** | ⚪ **Common** | **Faded Denim Vest** | +20 Max HP | — |
| **P1** | 🟢 **Uncommon** | **Lifeguard Foam Vest** | +35 Max HP | — |
| **P1** | 🟢 **Uncommon** | **Sailor Striped Longsleeve** | +30 Max HP | — |
| **P1** | 🟢 **Uncommon** | **Retro Tracksuit Top** | +28 Max HP | — |
| **P1** | 🔵 **Rare** | **Grillmaster Leather Apron** | +55 Max HP | +6% Damage Reduction (Fire immune) |
| **P1** | 🔵 **Rare** | **Biker Kevlar Jacket** | +65 Max HP | +5% Damage Reduction (+8% Knockback res) |
| **P1** | 🔵 **Rare** | **Greek Football Jersey #10** | +50 Max HP | +5% Move Speed (-4% Dash Cooldown) |
| *P3* | 🟣 **Epic** | **Yaya’s Heavy Wool Sweater** | +90 Max HP | +10% Damage Reduction *(Reflects melee & coins)* |
| *P3* | 🟣 **Epic** | **Traditional Evzone Vest** | +80 Max HP | +8% Damage Reduction *(Low HP defense boost)* |
| *P3* | 🟠 **Legendary** | **Nemean Lion Hide** | +145 Max HP | +15% Damage Reduction *(Beast Roar stun)* |
| *P4* | 🔴 **Mythic** | **Nemean Lion Hide of Heracles (Awakened)** | +195 Max HP | +20% Damage Reduction *(2.5s Golden Invincibility)* |

---

## 🥋 3. Belts (Waist / Bags)

| Phase | Rarity | Item Name | Primary Stat | Secondary Stat (Rare+) |
| :--- | :--- | :--- | :--- | :--- |
| **P1** | ⚪ **Common** | **Tied Twine Rope** | -4% Dash Cooldown | — |
| **P1** | ⚪ **Common** | **Elastic Tracksuit Cord** | -4% Dash Cooldown | — |
| **P1** | ⚪ **Common** | **Cheap Canvas Webbing** | +15 Magnet Radius | — |
| **P1** | 🟢 **Uncommon** | **Dad’s Heavy Buckle Belt** | -6% Dash Cooldown | — |
| **P1** | 🟢 **Uncommon** | **Tourist Neck Pouch** | +25 Magnet Radius | — |
| **P1** | 🟢 **Uncommon** | **Plumber’s Tool Belt** | +12% Ammo Capacity | — |
| **P1** | 🔵 **Rare** | **Streetwear Fanny Pack** | -9% Dash Cooldown | +25 Magnet Radius |
| **P1** | 🔵 **Rare** | **Gym Weightlifting Belt** | -8% Dash Cooldown | +20 Max HP (+7% Knockback) |
| **P1** | 🔵 **Rare** | **Fisherman’s Tackle Belt** | -10% Dash Cooldown | +18 Magnet Radius |
| *P3* | 🟣 **Epic** | **Souvlaki Master Holster Belt** | -12% Dash Cooldown | +20% Ammo *(Grease Glide slow slick)* |
| *P3* | 🟣 **Epic** | **Greek Shepherd’s Strap** | -14% Dash Cooldown | +35 Max HP *(Flock Stampede knockback)* |
| *P3* | 🟠 **Legendary** | **Olympic Olive Girdle** | -18% Dash Cooldown | +35 Magnet *(Hermes trail & +1 Dash Charge)* |
| *P4* | 🔴 **Mythic** | **Sacred Girdle of Olympus (Awakened)** | -24% Dash Cooldown | +50 Magnet *(Chrono Warp & 3 Dashes total)* |

---

## 🥊 4. Gloves (Hands)

| Phase | Rarity | Item Name | Primary Stat | Secondary Stat (Rare+) |
| :--- | :--- | :--- | :--- | :--- |
| **P1** | ⚪ **Common** | **Oven Mitts** | +3% Fire Rate | — |
| **P1** | ⚪ **Common** | **Blue Latex Gloves** | +5% Bullet Speed | — |
| **P1** | ⚪ **Common** | **Cotton Garden Gloves** | +3% Bullet Damage | — |
| **P1** | 🟢 **Uncommon** | **Biker Fingerless Gloves** | +6% Fire Rate | — |
| **P1** | 🟢 **Uncommon** | **Yellow Rubber Gloves** | +10 Max HP | — |
| **P1** | 🟢 **Uncommon** | **Weight Gym Straps** | +5% Bullet Damage | — |
| **P1** | 🔵 **Rare** | **Spiky Gardening Gloves** | +8% Fire Rate | +7% Bullet Damage (+6% Bullet Speed) |
| **P1** | 🔵 **Rare** | **Goalkeeper Grips** | +7% Fire Rate | +10% Knockback (-10% Weapon Recoil) |
| **P1** | 🔵 **Rare** | **Heavy Welder Gauntlets** | +9% Fire Rate | +9% Bullet Damage |
| *P3* | 🟣 **Epic** | **Pro Boxing Wraps** | +14% Fire Rate | +12% Bullet Damage *(Every 5th shot pierces)* |
| *P3* | 🟣 **Epic** | **Greek Fisherman’s Netting Grips** | +12% Fire Rate | +10% Bullet Damage *(Salt-Water slow snare)* |
| *P3* | 🟠 **Legendary** | **Golden Barista Grips** | +20% Fire Rate | +16% Bullet Damage *(Over-Caffeinated trigger)* |
| *P4* | 🔴 **Mythic** | **Frappé Grips of the Gods (Awakened)** | +28% Fire Rate | +22% Bullet Damage *(Boiling Frappé Whirlpool)* |

---

## 🩴 5. Boots (Footwear)

| Phase | Rarity | Item Name | Primary Stat | Secondary Stat (Rare+) |
| :--- | :--- | :--- | :--- | :--- |
| **P1** | ⚪ **Common** | **Rubber Flip-Flops** | +4% Move Speed | — |
| **P1** | ⚪ **Common** | **Beach Foam Clogs** | +8 Max HP | — |
| **P1** | ⚪ **Common** | **Worn Canvas Espadrilles** | +4% Move Speed | — |
| **P1** | 🟢 **Uncommon** | **Yellow Fisherman Boots** | +7% Move Speed | Immune to water puddle slow |
| **P1** | 🟢 **Uncommon** | **Classic High-Top Sneakers** | +7% Move Speed | — |
| **P1** | 🟢 **Uncommon** | **Soccer Cleats** | +6% Move Speed | Immune to ice surface slip |
| **P1** | 🔵 **Rare** | **Turbo Retro Air Sneakers** | +10% Move Speed | +12% Dash Distance |
| **P1** | 🔵 **Rare** | **Steel-Toe Work Boots** | +6% Move Speed | +25 Max HP (Spike hazard immune) |
| **P1** | 🔵 **Rare** | **Mountain Hiking Boots** | +8% Move Speed | +10% Knockback Resist |
| *P3* | 🟣 **Epic** | **The Flying Pantofla** | +12% Move Speed | +16% Dash Distance *(Slipper Slap attack)* |
| *P3* | 🟣 **Epic** | **Evzone Tsarouchia with Pompom** | +11% Move Speed | +20 Max HP *(Dash Stomp shockwave)* |
| *P3* | 🟠 **Legendary** | **Winged Sandals of Hermes** | +18% Move Speed | +22% Dash Distance *(Dodge chance)* |
| *P4* | 🔴 **Mythic** | **Talon Sandals of Hermes (Awakened)** | +24% Move Speed | +30% Dash Distance *(True Levitation over all hazards)* |

---

## 🛠️ Phase 1 Technical Specification (To Build First)

1. **Equipping Schema**:
   - `window.GameState.player.equipment = { helmet: null, armor: null, belt: null, gloves: null, boots: null }`
   - Equipped gear persists through `SaveSerializer.js`.
2. **Stat Application**:
   - Primary and secondary stats apply directly to `Player.js` during player initialization and gear swaps.
3. **Armory Modal UI**:
   - A dedicated, compact **"Armory"** tab in the main menu modal navigation.
   - 5 visual gear slots around the player character portrait.
   - Click an item to equip/unequip with live stat breakdown preview.
4. **Acquisition (Phase 1 Starter)**:
   - Starter items unlockable via Gold Coins 🪙 in the Armory shop.
