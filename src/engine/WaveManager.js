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
        this.waveAnnouncementTimer = 0;
    }

    reset(gameMode = 'story') {
        this.gameMode = gameMode;
        this.wave = 1;
        this.waveTotalEnemies = 0;
        this.waveEnemiesKilled = 0;
        this.waveState = 'IN_PROGRESS';
        this.betweenWaveTimer = 0;
        this.waveAnnouncementText = '';
        this.waveAnnouncementTimer = 0;
    }

    isBossWave(waveNum = this.wave) {
        return this.gameMode === 'story' && waveNum === 10;
    }

    isMiniBossWave(waveNum = this.wave) {
        return this.gameMode === 'story' && waveNum === 15;
    }

    isRoufBossWave(waveNum = this.wave) {
        return this.gameMode === 'story' && waveNum === 20;
    }

    startWave(waveNum, player, enemies, effects) {
        this.wave = waveNum;
        this.waveState = 'IN_PROGRESS';
        this.waveEnemiesKilled = 0;

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

            // Spawn Boss at arena distance
            const spawnDist = 480;
            const spawnAngle = Math.random() * Math.PI * 2;
            const bx = player.x + Math.cos(spawnAngle) * spawnDist;
            const by = player.y + Math.sin(spawnAngle) * spawnDist;

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
            // Spawn Kiloumpas at arena distance (he approaches with cutscene)
            const spawnDist = 420;
            const spawnAngle = Math.random() * Math.PI * 2;
            const kx = player.x + Math.cos(spawnAngle) * spawnDist;
            const ky = player.y + Math.sin(spawnAngle) * spawnDist;

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

            const spawnDist = 440;
            const spawnAngle = Math.random() * Math.PI * 2;
            const rx = player.x + Math.cos(spawnAngle) * spawnDist;
            const ry = player.y + Math.sin(spawnAngle) * spawnDist;

            if (typeof Rouf !== 'undefined') {
                enemies.push(new Rouf(rx, ry, waveMult));
            }
            return;
        }

        for (let i = 0; i < enemyCount; i++) {
            const angle = (i / enemyCount) * Math.PI * 2 + (Math.random() * 0.4);
            const dist = 550 + Math.random() * 300;
            const x = player.x + Math.cos(angle) * dist;
            const y = player.y + Math.sin(angle) * dist;

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

        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.emit('waveCompleted', { wave: this.wave });
        }

        // Spawn bonus celebration drops (Extra lavish rewards for Boss/Mini-Boss/Rouf)
        const dropCount = isRoufWave ? 14 : (isBossWave ? 10 : (isMiniBoss ? 8 : 4));
        for (let i = 0; i < dropCount; i++) {
            const rx = game.player.x + (Math.random() * 200 - 100);
            const ry = game.player.y + (Math.random() * 200 - 100);
            game.drops.push(new Drop(rx, ry, 'xp', isSpecialWave ? 50 : 30));
        }
        if (isSpecialWave || Math.random() < 0.7) {
            game.drops.push(new Drop(game.player.x + 25, game.player.y + 25, 'heart', 50));
            if (isRoufWave) {
                game.drops.push(new Drop(game.player.x - 30, game.player.y + 25, 'heart', 50));
            }
        }
        if (isSpecialWave || Math.random() < 0.4) {
            game.drops.push(new Drop(game.player.x - 25, game.player.y - 25, 'star', isRoufWave ? 8 : (isBossWave ? 5 : (isMiniBoss ? 3 : 1))));
        }
    }

    update(dt, game) {
        if (this.waveAnnouncementTimer > 0) {
            this.waveAnnouncementTimer -= dt;
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
                    if (game && game.ui && typeof game.ui.startCreditsSequence === 'function') {
                        game.ui.startCreditsSequence(game.player, this.wave, game.gameTime);
                    } else if (game && game.ui && typeof game.ui.showStoryVictoryModal === 'function') {
                        game.ui.showStoryVictoryModal(game.player, this.wave, game.gameTime);
                    }
                } else {
                    // Endless Mode (or Story Mode waves 1-19): advance to next wave!
                    this.startWave(this.wave + 1, game.player, game.enemies, game.effects);
                }
            }
        }
    }

    showWaveAnnouncement(text, color = '#fed330', duration = 150) {
        this.waveAnnouncementText = text;
        this.waveAnnouncementTimer = duration;
    }

    renderAnnouncement(ctx, width, height) {
        if (this.waveAnnouncementTimer <= 0 || !this.waveAnnouncementText) return;

        // Suppress if the big boss warning screen is active so no duplicate popup appears behind it
        if (typeof window !== 'undefined' && window.gameInstance && window.gameInstance.bossWarningOverlay && window.gameInstance.bossWarningOverlay.active) {
            return;
        }

        ctx.save();
        const halfW = width / 2;
        const halfH = height / 2;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = "900 48px 'Luckiest Guy', cursive";

        ctx.fillStyle = '#1e272e';
        ctx.fillRect(halfW - 280, halfH - 120, 560, 74);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#fed330';
        ctx.strokeRect(halfW - 280, halfH - 120, 560, 74);

        ctx.lineWidth = 8;
        ctx.strokeStyle = '#1e272e';
        ctx.fillStyle = '#fed330';
        ctx.strokeText(this.waveAnnouncementText, halfW, halfH - 82);
        ctx.fillText(this.waveAnnouncementText, halfW, halfH - 82);

        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.WaveManager = WaveManager;
}
