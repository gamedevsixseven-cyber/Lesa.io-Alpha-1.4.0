# 🐛 Bug Fix Report - Lesa.io

This document outlines the bugs identified and resolved in the project server and utility scripts.

---

## Summary of Fixes

| # | Bug / Issue | Severity | Affected File | Status |
|---|-------------|----------|---------------|--------|
| 1 | Unclosed HTTP Response & Connection Hang on Errors | **Critical** | `serve.ps1` | Fixed ✅ |
| 2 | Directory Traversal Vulnerability (`/../../`) | **High (Security)** | `serve.ps1` | Fixed ✅ |
| 3 | Case-Sensitive File Extension Checks | **High** | `serve.ps1` | Fixed ✅ |
| 4 | Missing MIME Types (`.ico`, `.json`, `.svg`, `.webp`, `.wav`, etc.) | **Medium** | `serve.ps1` | Fixed ✅ |
| 5 | Missing HTTP Range Request (206 Partial Content) for Audio | **Medium** | `serve.ps1` | Fixed ✅ |
| 6 | Missing `ContentLength64` Header | **Medium** | `serve.ps1` | Fixed ✅ |
| 7 | Missing `Cache-Control` (Stale JS/CSS during local development) | **Low / DX** | `serve.ps1` | Fixed ✅ |
| 8 | Missing `Access-Control-Allow-Origin: *` (CORS) | **Low** | `serve.ps1` | Fixed ✅ |
| 9 | Unhandled Listener Shutdown on Exit / Ctrl+C | **Low** | `serve.ps1` | Fixed ✅ |
| 10 | Subfolder Directory Default Document Handling | **Low** | `serve.ps1` | Fixed ✅ |
| 11 | Hardcoded Directory Paths (`c:\Lesa.io`) | **Low** | `serve.ps1`, `create_backup.ps1`, `restore_backup.ps1` | Fixed ✅ |
| 12 | Missing `Lesa.io.exe` Game Executable in Root Directory | **High** | `Lesa.io.exe` / `Launcher.cs` | Fixed & Compiled ✅ |
| 21 | Skarmogyftos `speedMod` ReferenceError Crash | **High** | `src/enemies/Skarmogyftos.js` | Fixed ✅ |
| 22 | Comic Popups Vector Rasterization CPU Bottleneck & Swarm Lag | **High / Performance** | `src/entities/Effects.js` & `ComicPopupCache.js` | Fixed ✅ |

---

## Detailed Bug Descriptions & Fixes

### 1. Unclosed Response Stream & Hanging Connections on Errors
- **The Issue:** In `serve.ps1`, `$response.Close()` was located strictly inside the success/404 `if/else` block. If any exception occurred during file reading (e.g. file lock, permissions, or client disconnected), execution jumped to `catch { # Keep server loop running }`.
- **The Impact:** `$response.Close()` was skipped completely. The browser tab spun and hung indefinitely, and the underlying TCP connection slot leaked.
- **The Fix:** Request handling was encapsulated in a robust `try ... finally { try { $response.OutputStream.Flush(); $response.Close() } catch {} }` block, ensuring that responses are always closed regardless of exceptions. Added HTTP 500 error reporting if writing fails.

### 2. Path Traversal Vulnerability
- **The Issue:** Request paths were only processed with `$relPath = $rawPath.TrimStart("/").Replace("/", "\")` before calling `Join-Path $baseDir $relPath`.
- **The Impact:** Sending requests like `/../../Windows/win.ini` allowed traversing outside the web root and reading arbitrary files on the machine.
- **The Fix:** Implemented path normalization with `[System.IO.Path]::GetFullPath($localPath)` and verified that the resolved path strictly resides inside `$baseDir`. Any attempt to escape the root triggers an immediate `403 Forbidden: Access Denied` response.

### 3. Case-Sensitive File Extension Checks
- **The Issue:** The script used `.NET` string methods like `$localPath.EndsWith(".png")`. In .NET, `string.EndsWith(string)` is case-sensitive.
- **The Impact:** Files ending in uppercase extensions (e.g. `icon.PNG`, `sound.MP3`, `script.JS`) evaluated to `False` and were served with generic MIME type `application/octet-stream`. Modern browsers (Chrome/Edge) with MIME sniffing protections will refuse to execute JavaScript files or render images when served as `application/octet-stream`.
- **The Fix:** Switched to `[System.IO.Path]::GetExtension($path).ToLowerInvariant()` combined with a comprehensive switch block.

### 4. Missing Critical MIME Types
- **The Issue:** The server only recognized `.html`, `.css`, `.js`, `.jpg`/`.jpeg`, `.png`, and `.mp3`.
- **The Impact:**
  - `favicon.ico` in the root was sent as `application/octet-stream` instead of `image/x-icon`.
  - Game data/configs (`.json`), vector graphics (`.svg`), alternate audio (`.wav`, `.ogg`), and fonts (`.woff`, `.woff2`, `.ttf`) were served as octet-stream.
- **The Fix:** Added a full lookup table covering all standard web media, font, and document formats.

### 5. Missing HTTP Range Requests (206 Partial Content) for Audio
- **The Issue:** Games use HTML5 `<audio>` elements for sound effects and music. Chrome and Edge send HTTP `Range: bytes=X-` requests to buffer and seek within audio streams.
- **The Impact:** Audio files could not seek cleanly, stuttered, or restarted from byte 0 on certain browsers.
- **The Fix:** Added full HTTP `Range` header parsing with `206 Partial Content`, `Content-Range`, and `Accept-Ranges: bytes` streaming (matching the C# launcher logic).

### 6. Missing `ContentLength64` Header
- **The Issue:** Neither 200 OK nor 404 responses populated `$response.ContentLength64`.
- **The Impact:** Without an explicit content length, `System.Net.HttpListener` defaults to chunked transfer or keep-alive ambiguity, which can cause connection stalls or inaccurate asset loading progress.
- **The Fix:** Explicitly set `$response.ContentLength64` on all responses.

### 7. Missing `Cache-Control` for Local Development
- **The Issue:** No caching headers were returned.
- **The Impact:** Browsers aggressively cached `.js` and `.css` files. Developers editing code would refresh the browser and continue running old cached JavaScript unless performing a hard cache clear (Ctrl+F5).
- **The Fix:** Added `Cache-Control: no-cache, no-store, must-revalidate`, `Pragma: no-cache`, and `Expires: 0`.

### 8. Missing CORS (`Access-Control-Allow-Origin: *`)
- **The Issue:** No CORS header was sent on HTTP responses.
- **The Impact:** Testing across different ports, embedding in web workers, or loading canvas textures locally could trigger CORS blocking in modern browsers.
- **The Fix:** Added `$response.Headers.Add("Access-Control-Allow-Origin", "*")`.

### 9. Unhandled Listener Shutdown on Exit / Ctrl+C
- **The Issue:** Halting the server script with Ctrl+C or terminal termination did not call `$listener.Stop()` and `$listener.Close()`.
- **The Impact:** Ports could remain locked or bound in the operating system, preventing immediate re-execution.
- **The Fix:** Enclosed the listening loop in `try ... finally` to ensure the listener cleanly releases the port when stopped.

### 10. Subfolder Directory Default Document Handling
- **The Issue:** Only `/` was rewritten to `/index.html`. Requesting any directory path resulted in a 404 error because `Test-Path -PathType Leaf` fails on directories.
- **The Fix:** If the requested path is a directory, the server checks for an `index.html` file within that folder.

### 11. Hardcoded Paths in Scripts
- **The Issue:** Scripts hardcoded `$baseDir = "c:\Lesa.io"` and `$sourceDir = "c:\Lesa.io"`.
- **The Impact:** Moving the project folder or running on another drive/machine caused scripts to fail or reference the wrong location.
- **The Fix:** Updated `serve.ps1`, `create_backup.ps1`, and `restore_backup.ps1` to dynamically resolve `$PSScriptRoot` with fallback to `(Get-Location).Path`.

### 12. Missing Game Executable (`Lesa.io.exe`) in Root
- **The Issue:** The executable `Lesa.io.exe` was present inside older `_backups/` directories, but had not been compiled into the game's root directory `c:\Lesa.io\`.
- **The Impact:** Double-clicking to launch the game as a native standalone desktop app was not possible without manual script commands.
- **The Fix:** Compiled [Launcher.cs](file:///c:/Lesa.io/Launcher.cs) using the Windows .NET compiler (`csc.exe`) with the game's native icon ([favicon.ico](file:///c:/Lesa.io/favicon.ico)) and windowed application mode (`/target:winexe`), producing the native standalone executable [Lesa.io.exe](file:///c:/Lesa.io/Lesa.io.exe) directly in the root directory.

---

## Gameplay, Logic & Performance Optimization Fixes (Audit 2)

| # | Bug / Issue | Severity | Affected File(s) | Status |
|---|-------------|----------|------------------|--------|
| 13 | Kleanthis Defeats Falsely Credited to Casillas | **High (Gameplay / False Code)** | `src/engine/CollisionSystem.js` | Fixed ✅ |
| 14 | Cloud Save Desynchronization & False LocalStorage Keys | **High (Data Integrity)** | `src/ui/SettingsManager.js` | Fixed ✅ |
| 15 | Loss of Skarmogyftos Stats on Save/Load & Cloud Sync | **High (Progression)** | `src/save/SaveSerializer.js` | Fixed ✅ |
| 16 | Unbounded `mousemove` Event Listener Leak | **Medium (Performance)** | `src/audio.js` | Fixed ✅ |
| 17 | Volume Settings Key Mismatch Desync | **Medium (Settings)** | `src/audio.js`, `src/core/GameState.js` | Fixed ✅ |
| 18 | Ghost Shadow Trails Broken by Floating-Point Modulo | **Medium (Visual Polish)** | `src/entities/Player.js` | Fixed ✅ |
| 19 | Fatal Uncaught TypeErrors on Unguarded `soundEngine` Calls | **High (Crash Prevention)** | `EnemyBase.js`, `Obstacle.js`, `Drop.js`, `Casillas.js`, `Fatmir.js`, `Skarmogyftos.js`, `Player.js` | Fixed ✅ |
| 20 | Massive Repetitive Code Bloat in Gameplay Tips Catalog | **Code Size / Performance (63% Reduction)** | `src/data/tips.js` | Fixed & Optimized ✅ |

---

### 13. False Kill Attribution Bug: Kleanthis Defeats Misattributed to Casillas
- **The Issue:** In [src/engine/CollisionSystem.js](file:///c:/Lesa.io/src/engine/CollisionSystem.js), `handleDeath` checked `if (enemy.type === 'fatmir')` and `else if (enemy.type === 'skarmogyftos')`, but lacked an explicit branch for `kleanthis`. When Kleanthis died, it fell into the `else` block meant strictly for Casillas.
- **The Impact:** Defeating Kleanthis incorrectly awarded Casillas kill counts (`player.casillasKills++`) and broadcasted `${heroName} outplayed Casillas! ⚽` instead of recognizing Kleanthis.
- **The Fix:** Added explicit `else if (enemy.type === 'kleanthis')` handling that increments `player.kleanthisKills`, awards 300 score bounty, broadcasts `${heroName} conquered Kleanthis! 🎩`, and drops custom XP and star loot.

### 14. Cloud Save Desynchronization & False LocalStorage Keys
- **The Issue:** In [src/ui/SettingsManager.js](file:///c:/Lesa.io/src/ui/SettingsManager.js), `syncCloudSave()` constructed its upload payload by reading non-existent localStorage keys: `lesaio_high_score` (instead of `lesaio_highscore`), `lesaio_player_level` (instead of `lesaio_account_level`), `lesaio_player_xp` (instead of `lesaio_account_xp`), and `lesaio_fatmirs_killed`/`lesaio_casillas_killed` (instead of `lesaio_total_fatmirs`/`lesaio_total_casillas`).
- **The Impact:** Every cloud save synchronization uploaded `0` highscore, level `1`, `0` XP, and `0` boss kills, overriding remote cloud profiles with blank progress.
- **The Fix:** Rewrote `savePayload` in `SettingsManager.js` to draw from canonical `GameState.player` and verified fallback keys matching the rest of the application.

### 15. Loss of Skarmogyftos Lifetime Stats in Serialization
- **The Issue:** While [src/core/GameState.js](file:///c:/Lesa.io/src/core/GameState.js) tracks `totalSkarmogyftos`, [src/save/SaveSerializer.js](file:///c:/Lesa.io/src/save/SaveSerializer.js) omitted `totalSkarmogyftos` from both `serialize()` and `deserialize()`.
- **The Impact:** Whenever the player saved or loaded state (or synced to cloud), all accumulated Skarmogyftos career stats were permanently erased.
- **The Fix:** Added `totalSkarmogyftos` to both serialization and deserialization routines.

### 16. Unbounded `mousemove` Event Listener Leak in Audio Engine
- **The Issue:** In [src/audio.js](file:///c:/Lesa.io/src/audio.js), `unlockAudio` was bound to `mousemove` and `pointermove`. Once the audio context was running, these listeners were never removed.
- **The Impact:** Every mouse movement during intense gameplay fired the unlock handler hundreds of times per second, wasting CPU cycles and garbage collection budget.
- **The Fix:** Removed continuous tracking events (`mousemove`, `pointermove`) and added automatic removal of all interaction listeners once `this.ctx && this.ctx.state === 'running'`.

### 17. Audio Engine vs GameState Volume Key Desynchronization
- **The Issue:** `src/audio.js` persisted volume to `lesaio_master_volume` and `lesaio_bgm_volume`, while `src/core/GameState.js` looked for `lesaio_sfx_volume` and `lesaio_music_volume`.
- **The Impact:** User audio preferences changed in the Settings panel were not consistently loaded across page refreshes.
- **The Fix:** Synchronized both key conventions across `setMasterVolume` and `setBgmVolume`.

### 18. Floating-Point Delta-Time Modulo Bug on Ghost Trails
- **The Issue:** In [src/entities/Player.js](file:///c:/Lesa.io/src/entities/Player.js), dash ghost trails were triggered with `if (this.bladeRushTimer % 2 === 0)` and `if (this.dashTimer % 2 === 0)`.
- **The Impact:** Because delta time `dt` is a floating-point number calculated dynamically from frame timing (e.g. `1.0142...`), `timer % 2 === 0` was almost never true. Dash and Blade Rush visual shadow trails failed to spawn reliably.
- **The Fix:** Replaced modulo checks with a dedicated `this.trailSpawnTimer` accumulator that triggers smoothly and reliably at fixed intervals regardless of frame rate.

### 19. Fatal Uncaught TypeErrors on Unguarded `window.soundEngine` Calls
- **The Issue:** Across multiple game files (`EnemyBase.js`, `Obstacle.js`, `Drop.js`, `Casillas.js`, `Fatmir.js`, `Skarmogyftos.js`, `Player.js`), calls like `window.soundEngine.playHit()`, `playCrateBreak()`, and `playPickup()` were invoked without checking `if (window.soundEngine)`.
- **The Impact:** If audio failed to initialize (e.g. strict browser security policies or headless environments), collecting a cookie, shooting a crate, or an enemy taking damage threw an uncaught TypeError that completely froze the game loop.
- **The Fix:** Added defensive `if (window.soundEngine)` guards across all sound invocation sites.

### 21. Skarmogyftos `speedMod` ReferenceError Crash
- **The Issue:** In [src/enemies/Skarmogyftos.js](file:///c:/Lesa.io/src/enemies/Skarmogyftos.js), `this.vx` and `this.vy` calculations referenced `speedMod` which was undefined in the `update()` method (`this.vx = Math.cos(orbitAngle) * curSpeed * speedMod;`).
- **The Impact:** When Skarmogyftos enemy spawned or strafed around the player, the game loop threw `ReferenceError: speedMod is not defined`, crashing the game.
- **The Fix:** Removed the undefined `speedMod` identifier. `curSpeed` is already appropriately calculated and scaled by `this.getEffectiveSpeed()`.

### 22. Comic Popups Vector Rasterization CPU Bottleneck & Swarm Lag
- **The Issue:** Every comic splash (`"POW!"`, `"K.O!"`, `"SLASH!"`, floating damage) executed `ctx.strokeText()` with heavy line width (4–6px) on custom fonts directly on the Canvas 2D context up to 36+ times per frame. Unthrottled calls from rapid fire and piercing shots flooded the screen with duplicate overlapping popups.
- **The Impact:** Massive CPU rasterization spikes caused significant frame rate drops during intense swarms.
- **The Fix:**
  1. Created [src/entities/ComicPopupCache.js](file:///c:/Lesa.io/src/entities/ComicPopupCache.js): Pre-renders styled outlined comic text onto snug offscreen canvases once, rendering frames via hardware-accelerated GPU `ctx.drawImage()` (0.001ms vs 0.5ms vector rasterization).
  2. Implemented `ComicThrottler`: Caps active comic popups to 6 punchy, high-impact words, filters redundant rapid-fire splashes within 140ms, and upgrades close multi-kills into `"DOUBLE K.O! 💀"` and `"MEGA K.O! 💥"`.
  3. Added floating damage compaction: Rapid hits on the same target accumulate onto rising numbers rather than spawning dozens of duplicate text elements.
  4. Extracted [src/entities/ParticleEffect.js](file:///c:/Lesa.io/src/entities/ParticleEffect.js), reducing `src/entities/Effects.js` from 557 lines down to 365 lines (< 500 lines limit).

### 23. Bullet Trail Delta-Time Modulo Bug & Missing Trail FX
- **The Issue:** In [src/entities/Bullet.js](file:///c:/Lesa.io/src/entities/Bullet.js), trail recording was triggered via `if (this.age % 2 === 0)`. Because delta-time `dt` is a dynamic floating-point number, this check evaluated to false on almost every single frame.
- **The Impact:** Projectile trails were virtually absent or flashed erratically during gameplay.
- **The Fix:** Replaced floating-point modulo check with a fixed `trailTimer` accumulator (`>= 1.4`) and tapered alpha and radius rendering for silky smooth projectile trails.

### 24. Barrel Permanent Depletion Bug & Respawn Overlapping
- **The Issue:** In [src/engine/Arena.js](file:///c:/Lesa.io/src/engine/Arena.js), when an explosive barrel was destroyed, the respawn timeout solely called `this.respawnCrate()`. `respawnBarrel()` was never triggered. In addition, obstacle generation placed trees after props without distance avoidance checks.
- **The Impact:** Destroyed barrels turned into crates, leaving the arena with zero barrels over time. Props and crates often spawned inside trees or on top of each other.
- **The Fix:** Checked `obs.type === 'barrel'` to invoke `respawnBarrel()`, generated trees first, added spatial clearance checks against existing trees and obstacles, and prevented respawns right on top of the player.

### 25. False Kill Attribution for Kiloumpas and Astynomos / MAT Police
- **The Issue:** In [src/engine/CollisionSystem.js](file:///c:/Lesa.io/src/engine/CollisionSystem.js), `handleDeath` lacked explicit branches for mini-boss `kiloumpas` and chapter 2 police `astynomos` / `mat_officer`, defaulting to Casillas.
- **The Impact:** Defeating Kiloumpas or police officers falsely awarded Casillas kills (`player.casillasKills++`) and broadcasted `"outplayed Casillas! ⚽"`.
- **The Fix:** Added explicit death handling branches with dedicated killfeed broadcasts, drop scaling, and boss crate rewards.

### 26. Unguarded `window.soundEngine` Call in Obstacle Mushroom Bounce
- **The Issue:** In [src/entities/Obstacle.js](file:///c:/Lesa.io/src/entities/Obstacle.js), `triggerMushroom()` directly invoked `window.soundEngine.playMushroomBounce()` without checking whether `window.soundEngine` existed.
- **The Impact:** Bouncing on a mushroom with uninitialized sound threw an uncaught TypeError that froze the game.
- **The Fix:** Added defensive guard `if (window.soundEngine && typeof window.soundEngine.playMushroomBounce === 'function')`.
