/**
 * Lesa.io - Master Game Orchestrator & State Coordinator
 * Coordinates Arena, Camera, Input, Player, WaveManager, CollisionSystem, Effects, and HUD
 */

class Game {
    constructor(canvas, ui) {
        this.canvas = canvas;
        this.ctx = (typeof MobilePerf !== 'undefined' && typeof MobilePerf.createContext === 'function') ? MobilePerf.createContext(canvas) : canvas.getContext('2d');
        this.ui = ui;

        // Core Subsystems
        this.input = new InputManager(canvas);
        this.camera = new Camera(canvas);
        this.arena = new Arena(3000, 3000);
        this.effects = new EffectsManager();
        this.waveManager = new WaveManager();
        this.waveSkipper = (typeof WaveSkipperMachine !== 'undefined') ? new WaveSkipperMachine() : null;

        window.effectsManager = this.effects;
        window.gameInstance = this;

        // Entities
        this.player = new Player(0, 0, 'psanas');
        this.enemies = [];
        this.bullets = [];
        this.drops = [];
        this.hazards = [];
        this.bossWarningOverlay = (typeof BossWarningOverlay !== 'undefined') ? new BossWarningOverlay() : null;
        this.cutsceneOverlay = (typeof CinematicCutsceneOverlay !== 'undefined') ? new CinematicCutsceneOverlay() : null;

        // State & Timing
        this.state = 'MENU';
        this.lastTime = performance.now();
        this.gameTime = 0;
        this.highScore = parseInt(localStorage.getItem('lesaio_highscore') || '0', 10);

        // Leaderboard
        this.leaderboard = [];
        this.initLeaderboard();

        // Bind Input Hooks
        this.input.onShootCallback = () => {
            if (this.state === 'PLAYING' && !this.isCutsceneActive()) {
                const newBullets = this.player.shoot(this.effects);
                if (newBullets) this.bullets.push(...newBullets);
            }
        };
        this.input.onDashCallback = () => (this.state === 'PLAYING' && !this.isCutsceneActive()) && this.player.dash(this.effects);
        this.input.onSkillCallback = () => (this.state === 'PLAYING' && !this.isCutsceneActive()) && this.player.useSkill(this.enemies, this.effects, this.camera, this);
        this.input.onUltCallback = () => (this.state === 'PLAYING' && !this.isCutsceneActive()) && this.player.useUlt(this.enemies, this.effects, this.camera, this);
        this.input.onInteractCallback = () => (this.state === 'PLAYING' && !this.isCutsceneActive() && this.waveSkipper) && this.waveSkipper.tryActivate(this);

        this.input.onPauseCallback = () => {
            if (this.state === 'PLAYING') {
                this.pauseGame();
            } else if (this.state === 'PAUSED') {
                this.resumeGame();
            }
        };

        if (typeof window !== 'undefined' && window.TouchInput) {
            this.touchInput = new window.TouchInput(this);
            this.input.touchInput = this.touchInput;
        }

        this.resize();
        window.addEventListener('resize', () => this.resize());
        requestAnimationFrame((t) => this.loop(t));
    }

    get wave() {
        return this.waveManager ? this.waveManager.wave : 1;
    }

    get waveState() {
        return this.waveManager ? this.waveManager.waveState : 'IN_PROGRESS';
    }

    isCutsceneActive() { return !!(this.cutsceneOverlay && this.cutsceneOverlay.active); }
    advanceCutscene() { return this.cutsceneOverlay ? this.cutsceneOverlay.advance() : false; }

    initLeaderboard() {
        const heroName = this.player ? this.player.name : 'Hero';
        this.leaderboard = [
            { name: `${heroName} (You)`, score: 0, isPlayer: true },
            { name: 'Skatmir_Brute', score: 1800, isPlayer: false },
            { name: 'Casillas_GK', score: 1450, isPlayer: false },
            { name: 'CartoonNinja', score: 950, isPlayer: false },
            { name: 'PeaShooter99', score: 620, isPlayer: false },
            { name: 'BouncyGamer', score: 380, isPlayer: false }
        ];
    }

    resize() {
        if (typeof MobilePerf !== 'undefined') {
            MobilePerf.applyCanvasSettings(this);
            return;
        }
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.dpr = dpr;
        this.canvas.width = Math.floor(window.innerWidth * dpr);
        this.canvas.height = Math.floor(window.innerHeight * dpr);
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
        if (this.ctx) { this.ctx.imageSmoothingEnabled = true; this.ctx.imageSmoothingQuality = 'high'; }
        if (this.camera) {
            this.camera.dpr = dpr; this.camera.zoomPunch = 0;
            this.camera.targetZoom = this.camera.computeAdaptiveZoom();
            this.camera.zoom = this.camera.targetZoom;
        }
    }

    start(heroType = 'psanas', gameMode = 'story') {
        this.startNewGame(heroType, gameMode);
    }

    startNewGame(heroType = 'psanas', gameMode = 'story') {
        this.gameMode = gameMode;
        this.player = new Player(0, 0, heroType);
        this.coinsEarnedThisRun = 0;
        if (typeof WeaponSystem !== 'undefined') {
            this.player.weaponType = WeaponSystem.resolveEquippedWeapon(this.player.weaponType);
        }
        this.enemies.length = 0;
        this.bullets.length = 0;
        this.drops.length = 0;
        if (this.hazards) this.hazards.length = 0;
        this.effects.clear();
        if (typeof window !== 'undefined' && window.perkSystem) {
            window.perkSystem.init(this);
        }
        if (typeof GearPassives !== 'undefined') {
            GearPassives.initPlayer(this.player);
        }

        this.gameTime = 0;
        if (typeof EndlessMapEvolution !== 'undefined') EndlessMapEvolution.reset();
        if (typeof OutsidePerimeterRoads !== 'undefined') OutsidePerimeterRoads.reset();
        if (typeof LilXasEvent !== 'undefined') LilXasEvent.reset();
        if (this.arena && typeof this.arena.setGameMode === 'function') {
            this.arena.setGameMode(gameMode);
        } else if (gameMode !== 'dungeons' && this.arena && this.arena.dungeonFloor) {
            this.arena.resetNormalTheme();
        }
        this.waveManager.reset(gameMode);
        if (this.waveSkipper) this.waveSkipper.reset(this);
        if (this.cutsceneOverlay) this.cutsceneOverlay.endCutscene();
        this.initLeaderboard();

        this.state = 'PLAYING';
        this.ui.showHUD();
        this.ui.hideModals();
        window.soundEngine.startBGM();

        this.coopSession = null;
        if (!this.isCoopGuest) {
            this.waveManager.startWave(1, this.player, this.enemies, this.effects);
        }
        if (this.touchInput) this.touchInput.show();
    }

    pauseGame(pausedByName = null, isRemote = false) {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            const name = pausedByName || (this.player ? this.player.name : 'Hero');
            this.ui.showPauseModal(name);
            if (this.touchInput) this.touchInput.hide();
            if (typeof LilXasEvent !== 'undefined') LilXasEvent.setPaused(true);
            if (this.coopSession && !isRemote && typeof this.coopSession.sendPause === 'function') {
                this.coopSession.sendPause(name);
            }
        }
    }

    resumeGame(isRemote = false) {
        if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            this.ui.hideModals();
            this.lastTime = performance.now();
            if (this.touchInput) this.touchInput.show();
            if (typeof LilXasEvent !== 'undefined') LilXasEvent.setPaused(false);
            if (this.coopSession && !isRemote && typeof this.coopSession.sendResume === 'function') {
                this.coopSession.sendResume();
            }
        }
    }

    gameOver() {
        this.state = 'GAME_OVER';
        if (typeof LilXasEvent !== 'undefined') LilXasEvent.reset();
        if (typeof document !== 'undefined') document.getElementById('olympus-blessing-modal')?.remove();
        if (this.touchInput) this.touchInput.hide();
        const timeElapsedSec = this.gameTime / 60;
        const timeStr = `${Math.floor(timeElapsedSec / 60)}m ${Math.floor(timeElapsedSec % 60)}s`;

        const fatmirsBonked = (this.player && this.player.fatmirKills) || 0;
        const casillasOutplayed = (this.player && this.player.casillasKills) || 0;
        const skarmogyftosOutsmarted = (this.player && this.player.skarmogyftosKills) || 0;
        const kleanthisDefeated = (this.player && this.player.kleanthisKills) || 0;
        const kiloumpasDefeated = (this.player && this.player.kiloumpasKills) || 0;
        const roufDefeated = (this.player && this.player.roufKills) || 0;
        const totalKills = Math.max((this.player && this.player.kills) || 0, fatmirsBonked + casillasOutplayed + skarmogyftosOutsmarted + kleanthisDefeated + kiloumpasDefeated + roufDefeated);

        // Record lifetime stats in GameState
        if (typeof window !== 'undefined' && window.GameState) {
            window.GameState.recordMatch(
                this.player.score, this.waveManager.wave, timeElapsedSec,
                fatmirsBonked, casillasOutplayed, this.player.heroType, skarmogyftosOutsmarted, totalKills, this.gameMode
            );
            this.highScore = window.GameState.player.stats.highScore;
        } else if (this.player.score > this.highScore) {
            this.highScore = this.player.score;
            localStorage.setItem('lesaio_highscore', this.highScore.toString());
        }

        // Calculate Match Gold Coins (Buffed: 20 per wave, 1 per 5 kills, bosses bonus)
        const wavesCleared = Math.max(0, (this.waveManager ? this.waveManager.wave - 1 : 0));
        const wavesGold = wavesCleared * 20;
        const killsGold = Math.floor(totalKills / 5);
        const bossGold = (kleanthisDefeated * 350) + (kiloumpasDefeated * 200) + (roufDefeated * 500) + ((this.player && this.player.endlessBossGoldBonus) || 0);
        const baseGold = wavesGold + killsGold + bossGold;

        const upgrades = (typeof window !== 'undefined' && window.GameState && window.GameState.player && window.GameState.player.upgrades) || {};
        const goldBonusLvl = upgrades.goldBonus || 0;
        const goldMultiplier = (1 + (goldBonusLvl * 0.03)) * (typeof GearPassives !== 'undefined' ? GearPassives.getGoldMultiplier() : 1.0) * ((typeof window !== 'undefined' && window.perkSystem && window.perkSystem.getCoinMultiplier) ? window.perkSystem.getCoinMultiplier() : 1.0);
        const earnedCoins = Math.round(baseGold * goldMultiplier);
        const displayedCoins = earnedCoins + (this.coinsEarnedThisRun || 0);

        // Credit earned coins to player's persistent wallet
        if (this.ui && typeof this.ui.setCoins === 'function') {
            this.ui.setCoins(this.ui.coins + earnedCoins, true);
        } else if (typeof window !== 'undefined' && window.GameState) {
            window.GameState.addCurrency(earnedCoins, 0);
        }

        // Calculate Match Account XP (waves, kills, and bosses)
        const wavesXP = wavesCleared * 35;
        const killsXP = totalKills * 2;
        const bossXP = (kleanthisDefeated * 250) + (kiloumpasDefeated * 150) + (roufDefeated * 350) + ((this.player && this.player.endlessBossXpBonus) || 0);
        const earnedXP = Math.round((wavesXP + killsXP + bossXP) * ((typeof window !== 'undefined' && window.perkSystem && window.perkSystem.getXpMultiplier) ? window.perkSystem.getXpMultiplier() : 1.0));

        // Credit earned XP to player's persistent Account Level
        if (typeof window !== 'undefined' && window.GameState && earnedXP > 0) {
            window.GameState.addAccountXP(earnedXP);
        }

        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.emit('gameOver', {
                score: this.player.score,
                highScore: this.highScore,
                wave: this.waveManager.wave,
                fatmirsBonked,
                casillasOutplayed,
                skarmogyftosOutsmarted,
                timeStr,
                earnedCoins,
                earnedXP
            });
        }

        if (this.cutsceneOverlay) this.cutsceneOverlay.endCutscene();
        const currentWave = this.waveManager ? this.waveManager.wave : 1;

        // Award match victory chest on boss victory if an empty slot is available
        if (typeof window !== 'undefined' && window.chestManager && (kleanthisDefeated > 0 || currentWave > 10)) {
            const rewardRates = (typeof CHEST_DROP_RATES !== 'undefined') ? CHEST_DROP_RATES : [];
            const tierDef = rewardRates.find(r => currentWave >= r.minWave && currentWave <= r.maxWave);
            if (tierDef && tierDef.rates) {
                const totalWeight = tierDef.rates.reduce((sum, item) => sum + item.weight, 0);
                let rand = Math.random() * totalWeight;
                let wonType = 'common';
                for (const r of tierDef.rates) {
                    if (rand <= r.weight) {
                        wonType = r.id;
                        break;
                    }
                    rand -= r.weight;
                }
                const awarded = window.chestManager.addChest(wonType);
                if (awarded === 'inventory' && this.ui) {
                    this.ui.addKillfeed(`Slots full — ${wonType.toUpperCase()} CHEST saved to Inventory!`);
                } else if (awarded && this.ui) {
                    this.ui.addKillfeed(`Earned ${wonType.toUpperCase()} CHEST!`);
                }
            }
        }
        this.ui.showGameOverModal(
            this.player.score,
            this.highScore,
            currentWave,
            totalKills,
            timeStr,
            displayedCoins,
            earnedXP
        );
    }

    vacuumAllXP() {
        for (let i = 0; i < this.drops.length; i++) {
            if (this.drops[i].type === 'xp') {
                this.drops[i].magnetized = true;
            }
        }
    }

    update(dt) {
        if (this.state !== 'PLAYING') return;

        this.gameTime += dt;
        if (!this.isCoopGuest) {
            this.waveManager.update(dt, this);
        }

        // Input & Aiming
        this.input.updateWorldMouse(this.camera);
        if (this.input.mouse.leftDown && !this.isCutsceneActive()) {
            const newBullets = this.player.shoot(this.effects);
            if (newBullets) this.bullets.push(...newBullets);
        }
        if (this.cutsceneOverlay) {
            this.cutsceneOverlay.update(dt);
        }

        // Entities & Camera
        this.player.update(dt, this.input, this.camera, this.effects, this.arena);
        if (typeof PlayerSkills !== 'undefined') PlayerSkills.update(this.player, dt, this.effects, this.enemies);
        if (typeof HeroUltimates !== 'undefined') HeroUltimates.update(this.player, dt, this.enemies, this.bullets, this.effects, this);
        if (typeof LilXasEvent !== 'undefined') LilXasEvent.update(dt, this);
        const camTgt = (typeof LilXasEvent !== 'undefined' && LilXasEvent.getCameraTarget()) || this.player;
        this.camera.follow(camTgt.x, camTgt.y);
        this.camera.update(dt);
        this.arena.update(dt);
        if (typeof OutsidePerimeterRoads !== 'undefined') OutsidePerimeterRoads.update(dt, this);
        if (this.waveSkipper) this.waveSkipper.update(dt, this);

        // Bullets Compaction
        let bWrite = 0;
        for (let i = 0; i < this.bullets.length; i++) {
            const b = this.bullets[i];
            b.update(dt, this.arena, this.effects);
            if (!b.dead) this.bullets[bWrite++] = b;
        }
        this.bullets.length = bWrite;

        // Enemies Compaction
        if (this.isCoopGuest) {
            for (let i = 0; i < this.enemies.length; i++) {
                const enemy = this.enemies[i];
                if (Number.isFinite(enemy.targetX) && Number.isFinite(enemy.targetY)) {
                    if (enemy.vx || enemy.vy) { enemy.targetX += enemy.vx * dt; enemy.targetY += enemy.vy * dt; }
                    const lerp = Math.min(1.0, 0.55 * dt);
                    enemy.x += (enemy.targetX - enemy.x) * lerp;
                    enemy.y += (enemy.targetY - enemy.y) * lerp;
                    if (Number.isFinite(enemy.targetAngle)) {
                        let diff = enemy.targetAngle - (Number.isFinite(enemy.angle) ? enemy.angle : 0);
                        while (diff < -Math.PI) diff += Math.PI * 2;
                        while (diff > Math.PI) diff -= Math.PI * 2;
                        enemy.angle = (Number.isFinite(enemy.angle) ? enemy.angle : 0) + diff * lerp;
                    }
                    enemy.walkCycle = (Number.isFinite(enemy.walkCycle) ? enemy.walkCycle : 0) + 0.22 * dt;
                }
                enemy.dead = false;
                if (enemy.hitFlash > 0) enemy.hitFlash -= dt;
            }
        } else {
            let eWrite = 0;
            for (let i = 0; i < this.enemies.length; i++) {
                const enemy = this.enemies[i];
                if (enemy.updateBubbleTrap && enemy.updateBubbleTrap(dt, this.effects)) {
                    if (enemy.hitFlash > 0) enemy.hitFlash -= dt;
                    if (enemy.dead) {
                        CollisionSystem.handleDeath(this, enemy);
                    } else {
                        this.enemies[eWrite++] = enemy;
                    }
                    continue;
                }
                if (enemy.updateStun && enemy.updateStun(dt, this.effects)) {
                    if (enemy.hitFlash > 0) enemy.hitFlash -= dt;
                    if (enemy.dead) {
                        CollisionSystem.handleDeath(this, enemy);
                    } else {
                        this.enemies[eWrite++] = enemy;
                    }
                    continue;
                }
                const baseTarget = (this.coopSession && enemy.coopTarget) ? enemy.coopTarget : this.player;
                const targetEntity = (typeof window !== 'undefined' && window.perkSystem && window.perkSystem.getTargetOverride) ? window.perkSystem.getTargetOverride(enemy, baseTarget) : baseTarget;
                if (enemy.updateFear && enemy.updateFear(dt, targetEntity, this.effects)) {
                    if (enemy.hitFlash > 0) enemy.hitFlash -= dt;
                    enemy.applyArenaBounds(this.arena);
                    if (enemy.dead) {
                        CollisionSystem.handleDeath(this, enemy);
                    } else {
                        this.enemies[eWrite++] = enemy;
                    }
                    continue;
                }
                if (typeof LilXasEvent !== 'undefined' && (LilXasEvent.shouldFreezeEnemy(enemy) || enemy._lilXasFleeing)) {
                    if (enemy.hitFlash > 0) enemy.hitFlash -= dt;
                    this.enemies[eWrite++] = enemy; continue;
                }
                enemy.update(dt, targetEntity, this.enemies, this.bullets, this.effects, this.arena);
                if (enemy.dead) {
                    CollisionSystem.handleDeath(this, enemy);
                } else {
                    this.enemies[eWrite++] = enemy;
                }
            }
            this.enemies.length = eWrite;
        }

        // Drops Compaction
        if (this.coopSession && this.coopSession.isHost && typeof this.coopSession.updateDrops === 'function') {
            this.coopSession.updateDrops(dt);
        } else {
            let dWrite = 0;
            const canPickDrops = !(this.coopSession && this.player && this.player.hp <= 0);
            for (let i = 0; i < this.drops.length; i++) {
                const drop = this.drops[i];
                drop.update(dt, canPickDrops ? this.player : null, this.effects);
                if (!drop.dead) this.drops[dWrite++] = drop;
            }
            this.drops.length = dWrite;
        }

        // Hazards Compaction (Water Puddles from Nerobalonaki, etc.)
        if (this.hazards) {
            let hWrite = 0;
            for (let i = 0; i < this.hazards.length; i++) {
                const hazard = this.hazards[i];
                hazard.update(dt, this.enemies, this.player, this.effects);
                if (this.isCoopGuest && this.enemies) { for (let k = 0; k < this.enemies.length; k++) if (this.enemies[k]) this.enemies[k].dead = false; }
                if (!hazard.dead) this.hazards[hWrite++] = hazard;
            }
            this.hazards.length = hWrite;
        }

        this.effects.update(dt);
        if (typeof window !== 'undefined' && window.perkSystem) {
            window.perkSystem.update(dt, this);
        }
        if (this.bossWarningOverlay) {
            this.bossWarningOverlay.update(dt, this.camera);
        }
        if (this.touchInput) {
            this.touchInput.update(dt);
        }

        // Apply Active Admin Playtesting Cheats
        if (window.AdminCheats) {
            window.AdminCheats.applyToUpdate(this, dt);
        }

        // Spatial Physics & Hit Detection Pass
        CollisionSystem.check(this);

        // HUD Update
        this.ui.updateHUD(this.player, this.waveManager.wave, this.enemies.length, this.waveManager.waveTotalEnemies);

        if (this.player.hp <= 0 && this.state === 'PLAYING' && !this.coopSession) {
            this.gameOver();
        }

        if (this.coopSession) {
            this.coopSession.update(dt);
        }
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.camera.applyTransform(ctx);

        // 1. Arena Floor & Boundaries (Internally viewport-culled)
        this.arena.draw(ctx, this.camera);

        // 1.5. Ground Hazards (Water Puddles - Viewport Culled)
        if (this.hazards) {
            for (let i = 0; i < this.hazards.length; i++) {
                const h = this.hazards[i];
                if (this.camera.isVisible(h.x, h.y, h.radius + 30)) h.draw(ctx);
            }
        }

        // 1.55. Ground Cracks & Seismic Fissures (Viewport Culled)
        if (this.effects && typeof this.effects.drawGround === 'function') this.effects.drawGround(ctx);

        // 1.6. Battle Perks Visuals (Hot Foot Flame Pools & Counter-Blast Projectiles)
        if (typeof window !== 'undefined' && window.perkSystem) window.perkSystem.draw(ctx, this.camera);

        // 2. Drops (XP Cookies, Hearts, Diamonds - Viewport Culled)
        for (let i = 0; i < this.drops.length; i++) {
            const drop = this.drops[i];
            if (this.camera.isVisible(drop.x, drop.y, drop.radius + 20)) drop.draw(ctx);
        }

        // 3. Obstacles (Mushrooms, Crates, Barrels, Bushes, Trees & Buildings behind player)
        for (let i = 0; i < this.arena.obstacles.length; i++) {
            const obs = this.arena.obstacles[i];
            if (obs.dead) continue;
            if ((obs.type === 'tree' || obs.type === 'building') && obs.isTall25D !== false && obs.y > this.player.y) continue;
            if (this.camera.isVisible(obs.x, obs.y, (obs.cullRadius || obs.radius) + 120)) obs.draw(ctx);
        }

        // 3.5. Endless Wave Skipper, Lil Xas Stage/Limo & 4. Enemies (Viewport Culled)
        if (typeof LilXasEvent !== 'undefined') LilXasEvent.drawWorld(ctx, this.camera, this.arena);
        if (this.waveSkipper) this.waveSkipper.draw(ctx, this.camera);
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            if (enemy.dead) continue;
            if (this.camera.isVisible(enemy.x, enemy.y, enemy.radius + 50)) {
                const hitSquashed = (typeof CombatRenderFX !== 'undefined') && CombatRenderFX.beginEnemyTransform(ctx, enemy);
                enemy.draw(ctx);
                if (hitSquashed) CombatRenderFX.endEnemyTransform(ctx, hitSquashed);
                if (enemy._lilXasFleeing && typeof LilXasCutsceneFX !== 'undefined') {
                    LilXasCutsceneFX.drawFleeingEnemyOverlay(ctx, enemy);
                }
                if (enemy.drawBubbleTrap) enemy.drawBubbleTrap(ctx);
            }
        }

        // 5. Bullets (Viewport Culled)
        for (let i = 0; i < this.bullets.length; i++) {
            const b = this.bullets[i];
            if (this.camera.isVisible(b.x, b.y, b.radius + 25)) {
                b.draw(ctx);
            }
        }

        // 6. Player & Co-op Partner
        if (this.state === 'PLAYING' || this.state === 'PAUSED') {
            this.player.draw(ctx);
            if (this.coopSession) {
                this.coopSession.render(ctx, this.camera);
            }
        }

        // 6.5. Foreground 2.5D Trees, Columns & Buildings (Peek-through transparency)
        for (let i = 0; i < this.arena.obstacles.length; i++) {
            const obs = this.arena.obstacles[i];
            if (obs.dead || (obs.type !== 'tree' && obs.type !== 'building') || obs.isTall25D === false || obs.y <= this.player.y) continue;
            if (this.camera.isVisible(obs.x, obs.y, (obs.cullRadius || obs.radius) + 120)) {
                const behind = obs.isPlayerBehind ? obs.isPlayerBehind(this.player) : false;
                if (behind) { ctx.save(); ctx.globalAlpha = 0.72; obs.draw(ctx); ctx.restore(); }
                else obs.draw(ctx);
            }
        }

        // 7. Visual Effects & Comic Splashes
        this.effects.draw(ctx);

        this.camera.restoreTransform(ctx);

        // 8. Screen Space Overlays, Combat Feedback & Wave Banners
        if (this.state === 'PLAYING') {
            if (this.effects && typeof this.effects.drawScreenSpace === 'function') {
                this.effects.drawScreenSpace(ctx, this.canvas.width, this.canvas.height, this.player);
            }
            this.waveManager.renderAnnouncement(ctx, this.canvas.width, this.canvas.height);
            if (this.waveSkipper) this.waveSkipper.renderScreenOverlay(ctx, this.canvas.width, this.canvas.height, this);
            if (this.bossWarningOverlay) this.bossWarningOverlay.draw(ctx, this.canvas.width, this.canvas.height);
            if (this.cutsceneOverlay) this.cutsceneOverlay.draw(ctx, this.canvas.width, this.canvas.height);
            if (typeof LilXasEvent !== 'undefined') LilXasEvent.drawScreenOverlay(ctx, this.canvas.width, this.canvas.height);
        }
    }

    loop(currentTime) {
        const speedMult = (window.AdminCheats ? window.AdminCheats.gameSpeed : 1.0);
        const dt = Math.max(0, Math.min((currentTime - this.lastTime) / 16.666, 2.5)) * speedMult;
        this.lastTime = currentTime;
        try { this.update(dt); } catch (err) { console.error("Game update error caught:", err); }
        try {
            if (typeof MobilePerf === 'undefined' || !MobilePerf.shouldSkipRender(this)) this.render();
        } catch (err) {
            console.error("Game render error caught:", err);
            if (this.ctx) { this.ctx.globalAlpha = 1; this.ctx.shadowBlur = 0; this.ctx.restore(); }
        } finally {
            requestAnimationFrame((t) => this.loop(t));
        }
    }
}
