# 🛡️ Lesa.io — Version 1.1.0 Development Checklist & Remaining Tasks

This README tracks what has already been built for **V1.1.0** and every remaining step left to finish the full update before pushing to GitHub.

---

## ✅ Completed So Far in V1.1.0 (Local / Unpushed)

### 1. New Weapons for V1.1.0 (4 Added)
- [x] **Skewer Charcoal Rifle** (`skewer_rifle`, Rare • Chest Drop) — Glowing firebox rifle + 3-prong skewer bayonet, Charcoal Burn DoT (4 ticks), `+15%` Skewered bonus vs burning foes, Ember Char Pop on kill.
- [x] **Hephaestus Vulcan Minigun** (`vulcan_minigun`, Mythic • Evolvable ★ • Chest Drop) — Spinning 6-barrel cluster driven by Spin-Up Heat (`+45%` / `+55%` fire rate), `8th`/`6th` Molten Buster Slug + Forge Shards.
- [x] **Hades Oblivion Railgun** (`hades_railgun`, Apex • Evolvable ★ • Mythic Chest Drop) — Stygian twin-rail launcher, Rift Streaks, `15%` (`20%`) non-boss Execute, `6`-kill HP Siphon (`+3` / `+5` HP), Evolved 3rd-shot Twin Phantom Lances.
- [x] **Medusa's Gorgon Gaze** (`medusa_gaze`, Mythic • Evolvable ★ • Chest Drop) — Animated slithering-serpent barrel + hovering living Gorgon Eye crystal & rotating rune halo; fires weaving Serpent-Eye bolts stacking **Stone Curse** (`3 hits -> Petrify Statue`), Shatter explodes statues into bouncing Jade Shards & homing Spectral Serpents, and Evolved ★ fires a 4th-shot **130° Gorgon Stare Cone**!

### 2. Clans System — Full Comic Overhaul, Promotions & Phase 2 Complete
- [x] Redesigned `#clans-modal` in native Lesa.io warm-parchment & thick `#1e272e` ink comic arcade styling (`styles/clans.css`, `ClanCardRenderer.js`, `ClansModal.js`).
- [x] Clan Founding cost set to **1,000,000 Coins + 1,000 Gems** with live Heraldry/Tag/Emblem/Color customizer.
- [x] **Role Hierarchy & Promotions (`Leader`, `Co-Leader`, `Officer`, `Member`)**: Promote/Demote buttons, 2-step Leadership Transfer, Join Request approval, Kick, and Motto editor (`ClanService.js`).
- [x] **Daily Contribution Caps + Tax Vault**: Donate Coins (`250k/day`), Armory Shards (`40/day`), Mati Crystals (`15/day`), and Olympian Bronze (`10/day`) cleanly via `GameState` & `InventoryManager`.
- [x] **Shared Weekly Clan Bounties**: Real-time tracked shared goals (*1,500 Endless Waves*, *15 Zeus Defeats*, *50,000 Co-op Kills*, *2,000 Vault Pts*) with Honor Crest rewards + anti-leech guards.
- [x] **Phase 2 Buffs, Honor Crest Shop, Sunday War Chest & Rankings (`ClanBuffs.js`)**:
  - Live `War Banner` (`+2%..+15%` DMG), `Golden Tithe` (`+5%..+25%` Gold/XP), `Salvage Mastery` (`+4%..+20%` Chest Coins & Material Drop Bonus), `Stamina Reserve` (`+3%..+15%` Max HP), and **+5% Co-op Clanmate Synergy**.
  - 8-item Honor Crest Shop (Chests, Materials, Evolution Stone, + 2 Clan-Exclusive Banners `banner_clan_spartan` & `banner_clan_obsidian`).
  - Sunday Weekly Clan War Chest, Top Clans Rankings tab, and `[TAG]` badges across Friends, Leaderboards & Public Profiles.

### 3. Direct Messages, Clan Guild Chat & Friends UI Polish
- [x] **Real-Time Friend Direct Messaging (`ChatService.js`, `DirectMessageView.js`):** Message any friend directly inside the Menu Friends list (`CHAT` button per friend card), live Firestore `friendships/{relId}/messages` listener, unread counter badges on `#friends-badge`, `FRIENDS` tab & friend cards, and smart draft-preserving scroll updates.
- [x] **Real-Time Clan Guild Hall Chat (`ClanChatView.js`):** Dedicated `CHAT` tab inside `#clans-modal` in native comic parchment styling with Role badges, Hero avatars, timestamps, live Firestore `clans/{clanId}/messages` stream, and unread pill on `#clans-badge`.
- [x] **Friends UI SVG Overhaul (`UiIcons.js`, `FriendsCardRenderer.js`, `FriendsModal.js`, `styles/friends.css`):** Replaced raw emoji labels/buttons across the Friends hub with crisp custom vector SVG comic icons (`chat.svg`, `hero_card.svg`, `send.svg`, `sync`, `orb_green`/`orb_dark`, `gamepad`, `flame`, `handshake`, `hourglass`, `tip_bulb`) and 3D tactile arcade buttons while preserving the dark-slate/cyan/gold theme.

---

## 📋 Remaining V1.1.0 Pre-Release Checklist

### A. Firebase Console Deployment Check
- [ ] Publish the updated Firestore Security Rules (including Section 6 `match /clans/{clanId}` plus `friendships/{relId}/messages/{msgId}` and `clans/{clanId}/messages/{msgId}` chat subcollections) in **Firebase Console → Firestore Database → Rules**.

### B. Optional Weapon Additions (2 Remaining Slots from 6-Weapon Plan)
- [ ] Add any remaining V1.1.0 weapons requested before release, then run final push to GitHub when approved.

---

## 🚀 Moved to Version 1.2.0 Roadmap

### Tartarus Rift Mode ("Underworld Descent") + Exotic Material ("Stygian Adamant")
- [ ] New Progressive Endgame Mode in Game Mode Selector (`Solo` + `Co-op`).
- [ ] **5 Dynamic Transforming Stages:** *Ashen Suburbs* ➔ *The Obsidian Foundry* ➔ *River Styx Crossing* ➔ *Arena of Chains* ➔ *Heart of Tartarus*.
- [ ] **Hades Pact Risk/Reward Shrines** between stages.
- [ ] **3 Unique, Non-Copy-Paste Bosses:** `Pyroklast the Forge-Warden`, `Charon, Warden of the Styx`, and `Nyx-Archon Oblivion`.
- [ ] **Exotic Rare Material (`stygian_adamant`)** above Legendary `ambrosia_spark` for **Mythic → Exotic ★ Gear Ascension** and **Clan Altar Lv.6–10**.
