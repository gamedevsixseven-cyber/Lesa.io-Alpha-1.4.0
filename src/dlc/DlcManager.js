/**
 * Lesa.io - DLC Mode & Cavern Exploration Manager ("Chapter III: The Sunless Depths")
 * Manages free-roaming zone exploration (no wave timers), Rest Shrine warmth healing,
 * sealed Fog Gate inspection, and clean cavern ground/lighting integration.
 */

class DlcManager {
    constructor(waveManager = null) {
        this.waveManager = waveManager;
        this.currentZoneName = 'Breach Hollow';
        this.shrineHealTick = 0;
        this.fogGateCooldown = 0;
    }

    static isPrimaryDev() {
        return !!(typeof window !== 'undefined' && window.AdminAuth && typeof window.AdminAuth.isPrimaryDevUser === 'function' && window.AdminAuth.isPrimaryDevUser());
    }

    static syncMenuEntry(menuController) {
        if (typeof document === 'undefined') return false;
        const wrap = document.getElementById('mode-coop-btn-wrap');
        const existing = document.getElementById('open-dlc-cave-btn');
        if (!this.isPrimaryDev()) {
            if (existing) existing.remove();
            return false;
        }
        if (!wrap) return false;
        if (!existing) {
            const btn = document.createElement('button');
            btn.id = 'open-dlc-cave-btn';
            btn.className = 'mode-dlc-trigger-btn';
            btn.type = 'button';
            btn.title = 'Dev Build: Preview DLC Chapter III (The Sunless Cavern)';
            btn.innerHTML = '<span>🗺️</span><span class="mode-coop-label">DLC: SUNLESS CAVERN</span><span class="mode-dlc-pill">DEV ONLY</span>';
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!this.isPrimaryDev()) { btn.remove(); return; }
                if (window.soundEngine && typeof window.soundEngine.playStartGame === 'function') window.soundEngine.playStartGame();
                else if (window.soundEngine) window.soundEngine.playSelect();
                if (menuController && typeof menuController.startGame === 'function') menuController.startGame('dlc_cave');
            });
            wrap.appendChild(btn);
        }
        return true;
    }

    static applyArenaTheme(arena) {
        if (typeof CaveZoneMap !== 'undefined') {
            CaveZoneMap.applyTheme(arena);
        }
    }

    static drawGroundOverlay(ctx, camera, arena) {
        if (typeof CaveZoneMap !== 'undefined') {
            CaveZoneMap.drawGroundOverlay(ctx, camera, arena);
        }
    }

    startZone(zoneNum = 1, player = null, enemies = [], effects = null) {
        if (this.waveManager) {
            this.waveManager.wave = zoneNum;
            this.waveManager.waveState = 'EXPLORING';
            this.waveManager.waveTotalEnemies = 0;
            this.waveManager.waveEnemiesKilled = 0;
        }

        const g = (typeof window !== 'undefined') ? window.gameInstance : null;
        if (g && g.arena) {
            DlcManager.applyArenaTheme(g.arena);
        }

        if (player && typeof CaveZoneMap !== 'undefined') {
            player.x = CaveZoneMap.SPAWN.x;
            player.y = CaveZoneMap.SPAWN.y;
            player.vx = 0;
            player.vy = 0;
            if (g && g.camera) {
                g.camera.x = player.x;
                g.camera.y = player.y;
            }
        }

        this.currentZoneName = 'Breach Hollow';
        if (typeof DlcLightingEngine !== 'undefined') DlcLightingEngine.reset();
        if (this.waveManager && typeof this.waveManager.showWaveAnnouncement === 'function') {
            this.waveManager.showWaveAnnouncement('🗺️ CHAPTER III • THE SUNLESS CAVERN', '#38bdf8', 210);
        }
        if (effects && player) {
            effects.addComicSplash(player.x, player.y - 54, '🗺️ SUNLESS CAVERN', '#38bdf8', 24, true);
        }
    }

    update(dt = 1, game = null) {
        if (!game || !game.player) return;
        const p = game.player;

        if (typeof CaveZoneMap !== 'undefined') {
            const nextZone = CaveZoneMap.getZoneName(p.x, p.y);
            if (nextZone !== this.currentZoneName) {
                this.currentZoneName = nextZone;
                if (this.waveManager && typeof this.waveManager.showWaveAnnouncement === 'function') {
                    this.waveManager.showWaveAnnouncement(`📍 ${nextZone.toUpperCase()}`, '#38bdf8', 110);
                }
            }

            // Northern Rest Shrine gentle warmth heal when damaged
            const sh = CaveZoneMap.SHRINE;
            if (Math.hypot(p.x - sh.x, p.y - sh.y) <= sh.radius) {
                this.shrineHealTick += dt;
                if (this.shrineHealTick >= 35) {
                    this.shrineHealTick = 0;
                    if (p.hp > 0 && p.hp < p.maxHp) {
                        const healAmt = Math.max(4, Math.round(p.maxHp * 0.03));
                        p.hp = Math.min(p.maxHp, p.hp + healAmt);
                        if (game.effects) {
                            game.effects.addPopup(p.x, p.y - 24, `+${healAmt} ✨`, '#fed330', 18);
                            game.effects.addSparks(p.x, p.y, '#fed330', 4);
                        }
                    }
                }
            } else {
                this.shrineHealTick = 0;
            }

            // Sealed Northern Fog Gate inspect feedback
            if (this.fogGateCooldown > 0) this.fogGateCooldown -= dt;
            const fg = CaveZoneMap.FOG_GATE;
            if (this.fogGateCooldown <= 0 && Math.abs(p.x - fg.x) <= fg.width * 0.5 && p.y <= fg.y + 95) {
                this.fogGateCooldown = 190;
                if (game.effects) {
                    game.effects.addComicSplash(fg.x, fg.y + 42, '🌫️ SEALED FOG GATE • COMING NEXT STEP', '#c084fc', 22, true);
                }
            }
        }
    }
}

if (typeof window !== 'undefined') window.DlcManager = DlcManager;
if (typeof module !== 'undefined' && module.exports) module.exports = { DlcManager };
