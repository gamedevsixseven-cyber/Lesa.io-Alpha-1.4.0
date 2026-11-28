/**
 * Lesa.io - Wave Progression & Enemy Spawner Manager
 * Controls wave pacing, enemy difficulty scaling, wave banners, and interstitial timers
 */

class WaveManager {
    constructor() {
        this.gameMode = 'story'; // 'story' | 'endless'
        this.wave = 1;
        this.waveTotalEnemies = 0;
        this.waveEnemiesKilled = 0;
        this.waveState = 'IN_PROGRESS'; // 'IN_PROGRESS' | 'WAVE_CLEARED'
        this.betweenWaveTimer = 0;
        this.waveAnnouncementText = '';
        this.waveAnnouncementColor = '#fed330';
        this.waveAnnouncementTimer = 0;
        this.waveAnnouncementMaxTimer = 150;
        this.waveAnnouncementSubtext = '';
        this.dungeonManager = null;
    }

    reset(gameMode = 'story', options = {}) {
        if (gameMode === 'dlc_cave' && (typeof DlcManager === 'undefined' || !DlcManager.isPrimaryDev())) gameMode = 'story';
        this.gameMode = gameMode;
        this.isEndlessHard = (gameMode === 'endless') && !!(options && options.isEndlessHard);
        this.wave = 1;
        this.waveTotalEnemies = 0;
        this.waveEnemiesKilled = 0;
        this.waveState = 'IN_PROGRESS';
        this.betweenWaveTimer = 0;
        this.waveAnnouncementText = '';
        this.waveAnnouncementColor = '#fed330';
        this.waveAnnouncementTimer = 0;
        this.waveAnnouncementMaxTimer = 150;
        this.waveAnnouncementSubtext = '';
        this.roufCrestAwarded = false;
        if (gameMode === 'dungeons' && typeof DungeonManager !== 'undefined') {
            this.dungeonManager = new DungeonManager(this);
        } else {
            this.dungeonManager = null;
        }
        this.dlcManager = (gameMode === 'dlc_cave' && typeof DlcManager !== 'undefined') ? new DlcManager(this) : null;
    }

    isBossWave(waveNum = this.wave) {
        if (this.gameMode === 'endless' && typeof EndlessWaveDirector !== 'undefined') {
            return EndlessWaveDirector.isBossWave(waveNum);
        }
        return this.gameMode === 'story' && waveNum === 10;
    }

    isMiniBossWave(waveNum = this.wave) {
        if (this.gameMode === 'endless' && typeof EndlessWaveDirector !== 'undefined') {
            return EndlessWaveDirector.isMiniBossWave(waveNum);
        }
        return this.gameMode === 'story' && waveNum === 15;
    }

    isRoufBossWave(waveNum = this.wave) {
        return this.gameMode === 'story' && waveNum === 20;
    }

    _findSafeBossSpawn(player, desiredDist = 420, margin = 95) {
        const arena = (typeof window !== 'undefined' && window.gameInstance) ? window.gameInstance.arena : null;
        const b = arena && arena.dungeonBounds;
        const minX = (b ? b.minX : -(arena ? arena.halfWidth : 1500)) + margin;
        const maxX = (b ? b.maxX : (arena ? arena.halfWidth : 1500)) - margin;
        const minY = (b ? b.minY : -(arena ? arena.halfHeight : 1500)) + margin;
        const maxY = (b ? b.maxY : (arena ? arena.halfHeight : 1500)) - margin;

        const inwardAngle = (Math.abs(player.x) > 120 || Math.abs(player.y) > 120)
            ? Math.atan2(-player.y, -player.x) + (Math.random() - 0.5) * 0.9
            : Math.random() * Math.PI * 2;

        const offsets = [0, 0.55, -0.55, 1.1, -1.1, Math.PI * 0.5, -Math.PI * 0.5, Math.PI];
        for (let i = 0; i < offsets.length; i++) {
            const ang = inwardAngle + offsets[i];
            const tx = player.x + Math.cos(ang) * desiredDist;
            const ty = player.y + Math.sin(ang) * desiredDist;
            if (tx >= minX && tx <= maxX && ty >= minY && ty <= maxY) {
                if (!arena || !arena._hitsBuilding || !arena._hitsBuilding(tx, ty, 52)) {
                    return { x: tx, y: ty };
                }
            }
        }

        let cx = Math.max(minX, Math.min(maxX, player.x + Math.cos(inwardAngle) * desiredDist));
        let cy = Math.max(minY, Math.min(maxY, player.y + Math.sin(inwardAngle) * desiredDist));
        if (Math.hypot(cx - player.x, cy - player.y) < 220) {
            const dirC = Math.atan2(-player.y, -player.x);
            cx = Math.max(minX, Math.min(maxX, player.x + Math.cos(dirC) * 280));
            cy = Math.max(minY, Math.min(maxY, player.y + Math.sin(dirC) * 280));
        }
        return { x: cx, y: cy };
    }

    startWave(waveNum, player, enemies, effects) {
        if (this.gameMode === 'dlc_cave' && this.dlcManager) {
            this.dlcManager.startZone(waveNum, player, enemies, effects);
            return;
        }
        if (this.gameMode === 'dungeons' && this.dungeonManager) {
            this.dungeonManager.startFloor(waveNum, player, enemies, effects);
            return;
        }
        if (this.gameMode === 'endless' && typeof EndlessWaveDirector !== 'undefined') {
            EndlessWaveDirector.startEndlessWave(this, waveNum, player, enemies, effects);
            return;
        }

        this.wave = waveNum;
        this.waveState = 'IN_PROGRESS';
        this.waveEnemiesKilled = 0;
        this.waveMatDrops = 0;
        if (typeof window !== 'undefined' && window.GameState && typeof window.GameState.recordWaveProgress === 'function') {
            window.GameState.recordWaveProgress('story', waveNum);
        }

        const enemyCount = 4 + Math.floor(waveNum * 2.5);
        this.waveTotalEnemies = enemyCount;
        const waveMult = 1.0 + (waveNum - 1) * 0.18;

        // ==========================================
        // 👑 WAVE 10: EPIC BOSS ENCOUNTER - KLEANTHIS
        // ==========================================
        if (this.isBossWave(waveNum)) {
            this.waveTotalEnemies = 1;
            this.waveAnnouncementText = '';
            this.waveAnnouncementTimer = 0;

            // Trigger Red Fullscreen Warning Screen (Single prominent boss popup)
            if (typeof window !== 'undefined' && window.gameInstance && window.gameInstance.bossWarningOverlay) {
                window.gameInstance.bossWarningOverlay.trigger('KLEANTHIS THE REBETIS', 'NORMAL BOSS');
            }

            // Spawn Boss strictly inside arena bounds even if player stands at an edge
            const { x: bx, y: by } = this._findSafeBossSpawn(player, 460);

            if (typeof Kleanthis !== 'undefined') {
                enemies.push(new Kleanthis(bx, by, waveMult));
            }

            if (effects) {
                effects.addComicSplash(bx, by - 60, 'ELA NA SOU PW RE! 🍷');
            }
            return;
        }

        // ==========================================
        // 💥 WAVE 15: MINI-BOSS ENCOUNTER - KILOUMPAS
        // ==========================================
        if (this.isMiniBossWave(waveNum)) {
            this.waveTotalEnemies = 1;
            this.waveAnnouncementText = '';
            this.waveAnnouncementTimer = 0;
            // Spawn Kiloumpas cleanly inside arena bounds (never outside in the perimeter road)
            const { x: kx, y: ky } = this._findSafeBossSpawn(player, 400);

            if (typeof Kiloumpas !== 'undefined') {
                enemies.push(new Kiloumpas(kx, ky, waveMult));
            }
            return;
        }

        // ==========================================
        // 🚨 WAVE 20: FINAL CHAPTER BOSS - ROUF
        // ==========================================
        if (this.isRoufBossWave(waveNum)) {
            this.waveTotalEnemies = 1;
            this.waveAnnouncementText = '';
            this.waveAnnouncementTimer = 0;

            if (typeof window !== 'undefined' && window.gameInstance && window.gameInstance.bossWarningOverlay) {
                window.gameInstance.bossWarningOverlay.trigger('ROUF THE INFORMANT', 'HARD BOSS');
            }

            const { x: rx, y: ry } = this._findSafeBossSpawn(player, 420);

            if (typeof Rouf !== 'undefined') {
                enemies.push(new Rouf(rx, ry, waveMult));
            }
            return;
        }

        // Waves 11+ (after the first boss falls): Psaltis the Hype Man joins the squad
        // 1 singer on waves 11-13, 2 on 14-17, 3 on 18+ — ramping kill-priority pressure
        const psaltisCount = waveNum >= 11 ? (waveNum <= 13 ? 1 : (waveNum <= 17 ? 2 : 3)) : 0;

        for (let i = 0; i < enemyCount; i++) {
            const angle = (i / enemyCount) * Math.PI * 2 + (Math.random() * 0.4);
            const dist = 550 + Math.random() * 300;
            const x = player.x + Math.cos(angle) * dist;
            const y = player.y + Math.sin(angle) * dist;

            if (waveNum >= 11 && i < psaltisCount && typeof Psaltis !== 'undefined') {
                enemies.push(new Psaltis(x, y, waveMult));
                continue;
            }

            if (waveNum >= 6) {
                // Wave 6+: 3 Enemies (Fatmir, Casillas, Skarmogyftos)
                const typeMod = i % 3;
                if (typeMod === 0) {
                    enemies.push(new Fatmir(x, y, waveMult));
                } else if (typeMod === 1) {
                    enemies.push(new Casillas(x, y, waveMult));
                } else {
                    enemies.push(new Skarmogyftos(x, y, waveMult));
                }
            } else {
                // Waves 1 to 5: Fatmir & Casillas
                const isFatmir = (i % 2 === 0);
                if (isFatmir) {
                    enemies.push(new Fatmir(x, y, waveMult));
                } else {
                    enemies.push(new Casillas(x, y, waveMult));
                }
            }
        }

        const announcementPrefix = (this.gameMode === 'endless') ? 'ENDLESS ' : 'WAVE ';
        this.showWaveAnnouncement(`${announcementPrefix}${waveNum}`, '#fed330', 160);
        if (effects) {
            effects.addComicSplash(player.x, player.y - 50, `${announcementPrefix}${waveNum}!`);
        }
    }

    onWaveCleared(game) {
        this.waveState = 'WAVE_CLEARED';
        this.betweenWaveTimer = 180;

        if (window.soundEngine) {
            window.soundEngine.playLevelUp();
        }

        if (game.effects) {
            game.effects.addConfetti(game.player.x, game.player.y, 35);
        }
        WaveManager.vacuumMaterialDrops(game.drops);

        if (this.gameMode === 'endless' && typeof EndlessWaveDirector !== 'undefined') {
            EndlessWaveDirector.onEndlessWaveCleared(this, game);
            if (game.isEndlessHard && this.wave >= 60) {
                this.betweenWaveTimer = 135;
                if (typeof game.vacuumAllXP === 'function') game.vacuumAllXP();
            }
            if (typeof window !== 'undefined' && window.EventBus) {
                window.EventBus.emit('waveCompleted', { wave: this.wave });
            }
            if (typeof GearPassives !== 'undefined') {
                GearPassives.onWaveCleared(game);
            }
            return;
        }

        const isBossWave = this.isBossWave();
        const isMiniBoss = this.isMiniBossWave();
        const isRoufWave = this.isRoufBossWave();
        const announcementPrefix = (this.gameMode === 'endless') ? 'ENDLESS ' : 'WAVE ';

        let clearMsg = `${announcementPrefix}${this.wave} CLEARED!`;
        if (isBossWave) {
            clearMsg = '👑 BOSS KLEANTHIS DEFEATED! 👑';
        } else if (isMiniBoss) {
            clearMsg = '💥 MINI-BOSS KILOUMPAS DEFEATED! 💥';
        } else if (isRoufWave) {
            clearMsg = '🚨 CHAPTER 2 BOSS ROUF DEFEATED! 🚨';
        }

        const isSpecialWave = isBossWave || isMiniBoss || isRoufWave;
        this.showWaveAnnouncement(clearMsg, isSpecialWave ? '#fed330' : '#2ed573', isSpecialWave ? 260 : 170);

        if (isSpecialWave && game.effects) {
            game.effects.addConfetti(game.player.x, game.player.y, isRoufWave ? 100 : 75);
            game.effects.addComicSplash(game.player.x, game.player.y - 60, isRoufWave ? 'CHAPTER 2 COMPLETE! 🏆' : (isBossWave ? 'BOSS DEFEATED! 🏆' : 'MINI-BOSS DEFEATED! 💥'));
        }

        // Story Final Boss (Rouf, Wave 20): +1 Olympus Ascent Crest (capped at 3)
        if (this.gameMode === 'story' && isRoufWave && !this.roufCrestAwarded) {
            this.roufCrestAwarded = true;
            if (typeof window !== 'undefined' && window.ascentCrestManager) {
                const res = window.ascentCrestManager.awardStoryBossCrest();
                const msg = res.added > 0
                    ? `+${res.added} OLYMPUS CREST! (${res.count}/${res.max})`
                    : `OLYMPUS CRESTS FULL (${res.count}/${res.max})`;
                if (game.ui && typeof game.ui.addKillfeed === 'function') {
                    game.ui.addKillfeed(`Rouf Defeated — ${msg}`);
                }
                if (game.effects && typeof game.effects.spawnDamageText === 'function') {
                    game.effects.spawnDamageText(game.player.x, game.player.y - 95, msg, '#fde047');
                }
            }
        }

        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.emit('waveCompleted', { wave: this.wave });
        }
        if (typeof GearPassives !== 'undefined') {
            GearPassives.onWaveCleared(game);
        }

        // Spawn bonus celebration drops (Extra lavish rewards for Boss/Mini-Boss/Rouf)
        const dropCount = isRoufWave ? 14 : (isBossWave ? 10 : (isMiniBoss ? 8 : 4));
        const heartOff = game.coopSession ? 95 : 25;
        for (let i = 0; i < dropCount; i++) {
            const rx = game.player.x + (Math.random() * 220 - 110);
            const ry = game.player.y + (Math.random() * 220 - 110);
            game.drops.push(new Drop(rx, ry, 'xp', isSpecialWave ? 50 : 30));
        }
        if (isSpecialWave || Math.random() < 0.7) {
            game.drops.push(new Drop(game.player.x + heartOff, game.player.y + 45, 'heart', 50));
            if (isRoufWave || game.coopSession) {
                game.drops.push(new Drop(game.player.x - heartOff, game.player.y + 45, 'heart', 50));
            }
        }
        if (isSpecialWave || Math.random() < 0.4) {
            game.drops.push(new Drop(game.player.x - heartOff, game.player.y - 45, 'star', isRoufWave ? 8 : (isBossWave ? 5 : (isMiniBoss ? 3 : 1))));
        }
    }

    update(dt, game) {
        if (this.waveAnnouncementTimer > 0) {
            this.waveAnnouncementTimer -= dt;
        }

        if (this.gameMode === 'dlc_cave' && this.dlcManager) {
            this.dlcManager.update(dt, game);
            return;
        }
        if (this.gameMode === 'dungeons' && this.dungeonManager) {
            this.dungeonManager.update(dt, game);
            return;
        }

        if (this.waveState === 'IN_PROGRESS') {
            if (game.enemies.length === 0) {
                this.onWaveCleared(game);
            }
        } else if (this.waveState === 'WAVE_CLEARED') {
            this.betweenWaveTimer -= dt;
            if (this.betweenWaveTimer <= 0) {
                if (this.gameMode === 'story' && this.isRoufBossWave()) {
                    // Story mode officially concludes at Wave 20!
                    this.waveState = 'STORY_COMPLETED';
                    if (game && game.coopSession && !game.isCoopGuest && typeof game.coopSession.syncStoryVictory === 'function') {
                        game.coopSession.syncStoryVictory(this.roufCrestAwarded);
                    }
                    if (game && game.ui && typeof game.ui.startCreditsSequence === 'function') {
                        game.ui.startCreditsSequence(game.player, this.wave, game.gameTime);
                    } else if (game && game.ui && typeof game.ui.showStoryVictoryModal === 'function') {
                        game.ui.showStoryVictoryModal(game.player, this.wave, game.gameTime);
                    }
                } else if (this.gameMode === 'endless' && game && game.isEndlessHard && this.wave >= 60 && typeof ApexW60FinaleTeaser !== 'undefined') {
                    // Hard Endless concludes at Wave 60 -> triggers DLC Cavern Teaser Finale!
                    this.waveState = 'HARD_FINALE';
                    ApexW60FinaleTeaser.start(game);
                } else {
                    // Endless Mode (or Story Mode waves 1-19): advance to next wave!
                    this.startWave(this.wave + 1, game.player, game.enemies, game.effects);
                }
            }
        }
    }

    showWaveAnnouncement(text, color = '#fed330', duration = 150, subtext = '') {
        this.waveAnnouncementText = text;
        this.waveAnnouncementColor = color || '#fed330';
        this.waveAnnouncementTimer = duration;
        this.waveAnnouncementMaxTimer = Math.max(1, duration || 150);
        this.waveAnnouncementSubtext = subtext || '';
        this._waveHudBottomCss = (typeof BossWarningOverlay !== 'undefined' && BossWarningOverlay._measureHudBottomCss)
            ? BossWarningOverlay._measureHudBottomCss()
            : 0;
    }

    _parseColorRgb(color) {
        if (typeof color === 'string') {
            const hex = color.trim();
            const m6 = /^#([0-9a-f]{6})$/i.exec(hex);
            if (m6) {
                const n = parseInt(m6[1], 16);
                return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
            }
            const m3 = /^#([0-9a-f]{3})$/i.exec(hex);
            if (m3) {
                const h = m3[1];
                return `${parseInt(h[0] + h[0], 16)}, ${parseInt(h[1] + h[1], 16)}, ${parseInt(h[2] + h[2], 16)}`;
            }
        }
        return '254, 211, 48';
    }

    renderAnnouncement(ctx, width, height) {
        if (this.gameMode === 'dungeons' && this.dungeonManager) {
            this.dungeonManager.render(ctx, width, height);
            return;
        }

        if (this.waveAnnouncementTimer <= 0 || !this.waveAnnouncementText) return;

        // Suppress if the big boss warning screen is active so no duplicate popup appears behind it
        const game = (typeof window !== 'undefined') ? window.gameInstance : null;
        if (game && game.bossWarningOverlay && game.bossWarningOverlay.active) {
            return;
        }

        const dpr = (game && Number.isFinite(game.dpr) && game.dpr > 0) ? game.dpr : 1;
        const cssW = width / dpr;
        const cssH = height / dpr;
        const isCompact = cssW < 780 || cssH < 520;
        const uiScale = isCompact
            ? Math.max(0.80, Math.min(1.0, cssW / 760))
            : Math.max(0.90, Math.min(1.12, cssW / 1280));
        const s = dpr * uiScale;

        const maxT = Math.max(1, this.waveAnnouncementMaxTimer || 150);
        const timer = this.waveAnnouncementTimer;
        const elapsed = Math.max(0, maxT - timer);
        const inT = Math.min(1, elapsed / 14);
        const outT = Math.min(1, timer / 22);
        const easeIn = 1 - Math.pow(1 - inT, 3);
        const alpha = Math.max(0, Math.min(1, Math.min(inT, outT)));
        if (alpha <= 0.01) return;

        const slideY = ((1 - easeIn) * -10 - (timer < 22 ? (1 - outT) * 7 : 0)) * s;
        const animScale = 0.93 + 0.07 * easeIn;

        const text = String(this.waveAnnouncementText);
        const upper = text.toUpperCase();
        const isClear = upper.includes('CLEARED') || upper.includes('VANQUISHED') || upper.includes('DEFEATED') || upper.includes('CRUSHED');
        const isBossKill = upper.includes('VANQUISHED') || upper.includes('DEFEATED') || upper.includes('CRUSHED');
        const isHard = !!(this.isEndlessHard || upper.includes('HARD '));

        const subtext = this.waveAnnouncementSubtext
            || (isClear ? (isBossKill ? 'BOSS BOUNTY CLAIMED • NEXT WAVE INCOMING' : 'NEXT WAVE INCOMING') : '');
        const hasSub = subtext.length > 0;

        const accentHex = this.waveAnnouncementColor || (isClear ? '#2ed573' : '#fed330');
        const accentRgb = this._parseColorRgb(accentHex);
        // Hard endless clears pair crimson edge energy with molten victory gold
        const secondaryRgb = (isHard && isClear) ? '255, 46, 76' : accentRgb;

        const bandW = Math.min(cssW * (isCompact ? 0.80 : 0.56), isCompact ? 500 : 620) * dpr;
        const bandHCss = (hasSub ? (isCompact ? 44 : 54) : (isCompact ? 34 : 42)) * uiScale;
        const bandH = bandHCss * dpr;
        const halfBandW = bandW / 2;
        const halfBandH = bandH / 2;

        // Upper-band placement clears both the top HUD (including score number) and center hero
        const centerX = width / 2;
        const cssAnchorY = (typeof BossWarningOverlay !== 'undefined' && BossWarningOverlay.getSafeBannerAnchorY)
            ? BossWarningOverlay.getSafeBannerAnchorY(cssH, bandHCss * 0.5, isCompact, this._waveHudBottomCss || 0)
            : (isCompact ? Math.max(106, cssH * 0.275) : Math.max(146, cssH * 0.22));
        const centerY = cssAnchorY * dpr + slideY;

        ctx.save();
        try {
            ctx.globalAlpha *= alpha;
            ctx.translate(centerX, centerY);
            ctx.scale(animScale, animScale);

            // Feathered translucent atmospheric ribbon (fades to 0 at edges — no boxy border)
            const bgGrad = ctx.createLinearGradient(-halfBandW, 0, halfBandW, 0);
            bgGrad.addColorStop(0, 'rgba(10, 14, 24, 0)');
            bgGrad.addColorStop(0.18, 'rgba(12, 16, 28, 0.56)');
            bgGrad.addColorStop(0.5, 'rgba(12, 16, 28, 0.78)');
            bgGrad.addColorStop(0.82, 'rgba(12, 16, 28, 0.56)');
            bgGrad.addColorStop(1, 'rgba(10, 14, 24, 0)');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(-halfBandW, -halfBandH, bandW, bandH);

            const tintGrad = ctx.createLinearGradient(-halfBandW, 0, halfBandW, 0);
            tintGrad.addColorStop(0, `rgba(${secondaryRgb}, 0)`);
            tintGrad.addColorStop(0.28, `rgba(${secondaryRgb}, 0.11)`);
            tintGrad.addColorStop(0.5, `rgba(${accentRgb}, ${isClear ? 0.20 : 0.14})`);
            tintGrad.addColorStop(0.72, `rgba(${secondaryRgb}, 0.11)`);
            tintGrad.addColorStop(1, `rgba(${secondaryRgb}, 0)`);
            ctx.fillStyle = tintGrad;
            ctx.fillRect(-halfBandW, -halfBandH, bandW, bandH);

            if (elapsed < 34) {
                const sheenProgress = elapsed / 34;
                const sheenHalfW = bandW * 0.16;
                const travel = bandW * 0.58;
                const sx = -travel * 0.5 + travel * sheenProgress;
                const sheenAlpha = Math.sin(sheenProgress * Math.PI) * (isClear ? 0.22 : 0.14);
                const sheenGrad = ctx.createLinearGradient(sx - sheenHalfW, 0, sx + sheenHalfW, 0);
                sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
                sheenGrad.addColorStop(0.5, `rgba(255, 255, 255, ${sheenAlpha.toFixed(3)})`);
                sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = sheenGrad;
                ctx.fillRect(sx - sheenHalfW, -halfBandH, sheenHalfW * 2, bandH);
            }

            // Tapered horizontal glow hairlines (no left/right side borders)
            const lineH = Math.max(1.25, 1.7 * s);
            const lineGrad = ctx.createLinearGradient(-halfBandW, 0, halfBandW, 0);
            lineGrad.addColorStop(0, `rgba(${secondaryRgb}, 0)`);
            lineGrad.addColorStop(0.2, `rgba(${secondaryRgb}, 0.68)`);
            lineGrad.addColorStop(0.5, `rgba(${accentRgb}, 0.96)`);
            lineGrad.addColorStop(0.8, `rgba(${secondaryRgb}, 0.68)`);
            lineGrad.addColorStop(1, `rgba(${secondaryRgb}, 0)`);
            ctx.fillStyle = lineGrad;
            ctx.fillRect(-halfBandW, -halfBandH, bandW, lineH);
            ctx.fillRect(-halfBandW, halfBandH - lineH, bandW, lineH);

            if (isClear || isHard) {
                const gemR = 3.2 * s;
                ctx.fillStyle = accentHex;
                ctx.beginPath();
                ctx.moveTo(0, -halfBandH - gemR * 0.65);
                ctx.lineTo(gemR * 1.35, -halfBandH + lineH * 0.5);
                ctx.lineTo(0, -halfBandH + lineH + gemR * 0.65);
                ctx.lineTo(-gemR * 1.35, -halfBandH + lineH * 0.5);
                ctx.closePath();
                ctx.fill();
            }

            // Crisp native vector text (zero atlas downscaling blur on High-DPR mobile)
            const headlinePx = Math.round((hasSub ? (isCompact ? 18.5 : 24.5) : (isCompact ? 21 : 27)) * s);
            const maxLabelW = Math.round(bandW * 0.86);
            const headlineY = hasSub ? (-7.5 * s) : (1 * s);
            const headlineColor = (isHard && isClear) ? '#ffe58f' : ((isClear && !isHard && accentHex === '#2ed573') ? '#5cff9d' : accentHex);
            const outlineColor = (isHard && !isClear) ? '#1a070d' : '#090e1a';

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.lineJoin = 'round';
            ctx.font = `900 ${headlinePx}px 'Luckiest Guy', cursive`;
            ctx.lineWidth = Math.max(2.5, 4.2 * s);
            ctx.strokeStyle = outlineColor;
            ctx.fillStyle = headlineColor;
            ctx.strokeText(text, 0, headlineY, maxLabelW);
            ctx.fillText(text, 0, headlineY, maxLabelW);

            if (hasSub) {
                const subPx = Math.round((isCompact ? 9.5 : 11.5) * s);
                const subY = 12 * s;
                ctx.font = `800 ${subPx}px 'Fredoka', sans-serif`;
                ctx.lineWidth = Math.max(1.5, 2.4 * s);
                ctx.strokeStyle = '#090e1a';
                ctx.fillStyle = (isHard && isClear) ? '#ffd6dc' : '#e2e8f0';
                ctx.strokeText(subtext, 0, subY, maxLabelW);
                ctx.fillText(subtext, 0, subY, maxLabelW);
            }
        } finally {
            ctx.restore();
        }
    }

    static vacuumMaterialDrops(drops) {
        if (!Array.isArray(drops) || typeof Drop === 'undefined' || !Drop.MATERIAL_DROP_MAP) return;
        for (let i = 0; i < drops.length; i++) {
            const d = drops[i];
            if (d && !d.dead && Drop.MATERIAL_DROP_MAP[d.type]) {
                d.magnetized = true;
                d.life = Math.max(d.life || 0, 240);
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.WaveManager = WaveManager;
}
