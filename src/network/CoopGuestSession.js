/**
 * Lesa.io - Co-op Guest Session Coordinator
 * Synchronizes client-side world state with authoritative host snapshots and relays guest inputs
 */

class CoopGuestSession {
    constructor(game, networkManager, hostInfo, mapSeed = 123456) {
        this.game = game;
        this.net = networkManager;
        this.isHost = false;
        this.appliedMapSeed = mapSeed;

        const name = (hostInfo && hostInfo.name) || 'Host';
        const heroType = (hostInfo && hostInfo.heroType) || 'psanas';
        this.remotePlayer = new RemotePlayer(game.player.x - 60, game.player.y, heroType, name);
        this.remotePlayer.applyHeroStats(heroType, hostInfo);
        this.remotePlayer.isHost = true;

        this.inputSyncTimer = 0;
        this.lastSnapshotTime = performance.now();
        this.collectedDropIds = new Set();
        this._pendingHealUntil = 0;
        this._preHealHp = 0;
        this._trackedHp = (game && game.player && Number.isFinite(game.player.hp)) ? game.player.hp : 100;

        if (this.game.cutsceneOverlay) {
            this.game.cutsceneOverlay.totalPlayers = 2;
            this.game.cutsceneOverlay.onRequestAdvance = () => this.handleGuestCutsceneAdvance();
        }

        this.setupNetworkHandlers();
        this.hookGuestInput();
    }

    handleGuestCutsceneAdvance() {
        const co = this.game.cutsceneOverlay;
        if (!co || !co.active || !co.promptAdvance || co.isLocalReady) return;
        co.isLocalReady = true;
        const nextReady = Math.min(co.readyCount + 1, co.totalPlayers);
        co.setReadyState(nextReady, co.totalPlayers, true);
        this.net.send('GUEST_CUTSCENE_READY', {});
    }

    setupNetworkHandlers() {
        this.net.onMessageCallback = (type, payload) => {
            if (type === 'HOST_SNAPSHOT') {
                this.applyHostSnapshot(payload);
            } else if (type === 'HOST_SHOOT') {
                this.handleHostShoot(payload);
            } else if (type === 'HOST_DASH') {
                if (this.game.effects) {
                    if (typeof this.game.effects.addDashTrail === 'function') {
                        this.game.effects.addDashTrail(this.remotePlayer.x, this.remotePlayer.y, this.remotePlayer.radius, this.remotePlayer.heroColor);
                    } else if (typeof this.game.effects.addDust === 'function') {
                        this.game.effects.addDust(this.remotePlayer.x, this.remotePlayer.y, 6, 8);
                    }
                }
            } else if (type === 'HOST_SKILL') {
                this.playRemoteSkill(this.remotePlayer, payload);
            } else if (type === 'HOST_QUIT_MATCH') {
                this.handleHostQuit();
            } else if (type === 'NET_PAUSE') {
                this.game.pauseGame(payload.by, true);
            } else if (type === 'NET_RESUME') {
                this.game.resumeGame(true);
            } else if (type === 'CUTSCENE_TRIGGER') {
                if (this.game.cutsceneOverlay && typeof this.game.cutsceneOverlay.startCutscene === 'function') {
                    this.game.cutsceneOverlay.startCutscene(payload.cutsceneId, payload.opts || {});
                    if ((!payload.opts || !payload.opts.skipSquadPosition) && typeof CinematicCutsceneOverlay !== 'undefined' && typeof CinematicCutsceneOverlay.applyGuestSquadPositions === 'function') {
                        CinematicCutsceneOverlay.applyGuestSquadPositions(this.game, this, payload.positions);
                    }
                }
            } else if (type === 'CUTSCENE_DIALOGUE') {
                if (this.game.cutsceneOverlay && typeof this.game.cutsceneOverlay.setDialogue === 'function') {
                    if (!this.game.cutsceneOverlay.active && typeof this.game.cutsceneOverlay.startCutscene === 'function') {
                        this.game.cutsceneOverlay.startCutscene('', { allowEndless: this.game.gameMode === 'endless' });
                    }
                    this.game.cutsceneOverlay.setDialogue(payload.speaker, payload.text, payload.speakerColor, payload.avatarIcon, payload.promptAdvance);
                    this.game.cutsceneOverlay.setReadyState(payload.readyCount || 0, payload.totalPlayers || 2, false);
                }
            } else if (type === 'LIL_XAS_EVENT' && typeof LilXasEvent !== 'undefined' && payload) {
                LilXasEvent.handleCoopEvent(payload.kind, payload, this.game);
            } else if (type === 'CUTSCENE_READY_UPDATE') {
                if (this.game.cutsceneOverlay && typeof this.game.cutsceneOverlay.setReadyState === 'function') {
                    this.game.cutsceneOverlay.setReadyState(payload.readyCount, payload.totalPlayers, this.game.cutsceneOverlay.isLocalReady);
                }
            } else if (type === 'CUTSCENE_END') {
                if (this.game.cutsceneOverlay && typeof this.game.cutsceneOverlay.endCutscene === 'function') {
                    this.game.cutsceneOverlay.endCutscene();
                    this.game.cutsceneOverlay.setReadyState(0, 1, false);
                }
            } else if (type === 'BOSS_TRIGGER') {
                if (this.game.bossWarningOverlay && typeof this.game.bossWarningOverlay.trigger === 'function') {
                    this.game.bossWarningOverlay.trigger(payload.bossName, payload.rankName || '');
                }
            } else if (type === 'BOSS_CRATE_REWARD') {
                if (payload && payload.crateId && typeof window !== 'undefined' && window.inventoryManager) {
                    window.inventoryManager.addCrate(payload.crateId, 1);
                    if (this.game.ui && typeof this.game.ui.addKillfeed === 'function') {
                        const cDef = (typeof getBossCrate === 'function') ? getBossCrate(payload.crateId) : null;
                        this.game.ui.addKillfeed(`📦 Co-op Victory vs ${payload.bossName || 'Boss'}: Earned ${cDef ? cDef.name : payload.crateId}!`);
                    }
                }
            } else if (type === 'MATERIAL_REWARD') {
                if (payload && payload.materials && typeof window !== 'undefined' && window.inventoryManager) {
                    window.inventoryManager.awardBattleMaterials(payload.materials, {
                        game: this.game,
                        source: 'coop_sync',
                        sourceName: payload.sourceName || 'Co-op Spoils',
                        syncCoop: false
                    });
                }
            } else if (type === 'XP_SHARE') {
                if (payload && payload.val > 0 && this.game.player) this.game.player.addXP(Math.min(200, Math.round(payload.val)));
            } else if (type === 'COIN_SHARE') {
                if (payload && payload.coins > 0) {
                    const c = Math.min(250, Math.round(payload.coins));
                    if (typeof window !== 'undefined' && window.GameState) window.GameState.addCurrency(c, 0);
                    this.game.coinsEarnedThisRun = (this.game.coinsEarnedThisRun || 0) + c;
                    if (this.game.effects && this.game.player) this.game.effects.addPopup(this.game.player.x, this.game.player.y - 24, `+${c} 🪙`, '#ffd32a', 22);
                }
            } else if (type === 'STORY_VICTORY') {
                if (payload && payload.crestAwarded && typeof window !== 'undefined' && window.ascentCrestManager) window.ascentCrestManager.awardStoryBossCrest();
                if (this.game.waveManager) this.game.waveManager.waveState = 'STORY_COMPLETED';
                if (this.game.ui && typeof this.game.ui.startCreditsSequence === 'function') this.game.ui.startCreditsSequence(this.game.player, payload.wave || 20, payload.gameTime || this.game.gameTime);
                else if (this.game.ui && typeof this.game.ui.showStoryVictoryModal === 'function') this.game.ui.showStoryVictoryModal(this.game.player, payload.wave || 20, payload.gameTime || this.game.gameTime);
            } else if (type === 'ZEUS_REWARD_UNLOCK') {
                if (typeof ZeusSkyPhase !== 'undefined' && typeof ZeusSkyPhase.grantZeusFirstKillRewards === 'function') {
                    ZeusSkyPhase.grantZeusFirstKillRewards(null, this.game);
                }
            } else if (type === 'BOSS_REWARD_UNLOCK' && payload && payload.bossId && typeof BossRewardManager !== 'undefined') {
                BossRewardManager.queueBossDrops(payload.bossId, { effects: this.game && this.game.effects, syncCoop: false, bossName: payload.bossName });
            } else if (type === 'GUEST_DROP_EFFECT' && payload) {
                this.handleDropEffect(payload);
            } else if (type === 'HELIOS_BEAM' && typeof CoopCombatFx !== 'undefined') {
                CoopCombatFx.handleRemoteBeam(this, payload, false);
            } else if (type === 'COOP_FX' && typeof CoopCombatFx !== 'undefined') {
                CoopCombatFx.handleRemoteFx(this, payload);
            }
        };

        this.net.onDisconnectedCallback = (reason) => {
            this.handleHostQuit();
        };
    }

    handleDropEffect(payload) {
        if (typeof CoopDropSync !== 'undefined') CoopDropSync.handleGuestDropEffect(this, payload);
    }

    handleHostShoot(bData) {
        if (typeof CoopCombatFx !== 'undefined') CoopCombatFx.spawnRemoteBullet(this, bData, false);
    }

    handleHostQuit(reason = 'Host left the game') {
        this.game.state = 'MENU';
        this.game.isCoopGuest = false;
        this.game.coopSession = null;
        if (typeof LilXasEvent !== 'undefined') LilXasEvent.reset();

        if (this.game.cutsceneOverlay) {
            this.game.cutsceneOverlay.totalPlayers = 1;
            this.game.cutsceneOverlay.setReadyState(0, 1, false);
            this.game.cutsceneOverlay.onRequestAdvance = null;
            if (typeof this.game.cutsceneOverlay.endCutscene === 'function') {
                this.game.cutsceneOverlay.endCutscene();
            }
        }

        if (this.net && typeof this.net.disconnect === 'function') {
            this.net.disconnect();
        }

        if (this.game.ui) {
            this.game.ui.showMenuScreen();
            this.game.ui.hideModals();
            this.game.ui.addKillfeed('⚠️ Host left the match. Returned to Main Screen.');
        }

        if (window.soundEngine) {
            window.soundEngine.stopBGM();
            window.soundEngine.startMenuBGM();
        }
    }

    sendPause(playerName) { this.net.send('NET_PAUSE', { by: playerName }); }
    sendResume() { this.net.send('NET_RESUME', {}); }

    leaveMatch() {
        if (this.game.cutsceneOverlay) {
            this.game.cutsceneOverlay.totalPlayers = 1;
            this.game.cutsceneOverlay.setReadyState(0, 1, false);
            this.game.cutsceneOverlay.onRequestAdvance = null;
        }
        if (this.net && typeof this.net.disconnect === 'function') {
            this.net.disconnect();
        }
    }

    hookGuestInput() {
        // Intercept player shooting to transmit bullet payload to host
        const origShoot = this.game.player.shoot.bind(this.game.player);
        this.game.player.shoot = (effects) => {
            if (this.game.player.hp <= 0 || (this.game.isCutsceneActive && this.game.isCutsceneActive())) return null;
            const bullets = origShoot(effects);
            if (bullets && bullets.length > 0 && typeof CoopCombatFx !== 'undefined') {
                CoopCombatFx.emitBullets(this.net, 'GUEST_SHOOT', bullets);
            }
            return bullets;
        };

        // Intercept Dash & Skill (only transmit when actually activated & alive)
        const origDash = this.game.player.dash.bind(this.game.player);
        this.game.player.dash = (effects) => {
            const ok = origDash(effects);
            if (ok) this.net.send('GUEST_DASH', {});
            return ok;
        };
        const origSkill = this.game.player.useSkill.bind(this.game.player);
        this.game.player.useSkill = (enemies, effects, camera, game) => {
            const p = this.game.player;
            const skillId = p.selectedSkill || 'blade_rush';
            const level = (typeof PlayerSkills !== 'undefined') ? PlayerSkills.getSkillLevel(skillId) : 1;
            const ok = origSkill(enemies, effects, camera, game);
            if (ok) this.net.send('GUEST_SKILL', { skillId, level, x: Math.round(p.x), y: Math.round(p.y), angle: Number((p.angle || 0).toFixed(2)) });
            return ok;
        };
    }

    applyHostSnapshot(data) {
        if (!data) return;

        // 0. Seeded Arena Map Sync
        if (data.mapSeed && this.appliedMapSeed !== data.mapSeed) {
            this.appliedMapSeed = data.mapSeed;
            if (this.game.arena && typeof this.game.arena.reseed === 'function') {
                this.game.arena.reseed(data.mapSeed);
            }
        }

        // 0.5. Synchronize Destroyed Obstacles (TNT Barrels & Crates)
        if (Array.isArray(data.deadObs) && this.game.arena) {
            if (!this.game.arena.destroyedObsIds) this.game.arena.destroyedObsIds = new Set();
            for (let d = 0; d < data.deadObs.length; d++) {
                const deadId = data.deadObs[d];
                if (this.game.arena.destroyedObsIds.has(deadId)) continue;
                this.game.arena.destroyedObsIds.add(deadId);

                for (let i = 0; i < this.game.arena.obstacles.length; i++) {
                    const obs = this.game.arena.obstacles[i];
                    if (obs && obs.id === deadId) {
                        obs.dead = true;
                        if (obs.type === 'barrel') {
                            obs.explode(this.game.effects, this.game);
                        } else if (obs.type === 'crate') {
                            if (window.soundEngine && typeof window.soundEngine.playCrateBreak === 'function') window.soundEngine.playCrateBreak();
                            if (this.game.effects) { this.game.effects.addDust(obs.x, obs.y, 8, 14); this.game.effects.addSparks(obs.x, obs.y, '#e58e26', 8); }
                        }
                        break;
                    }
                }
            }
        }

        // 1. Sync Host Remote Player State
        if (data.host) {
            this.remotePlayer.setTargetState(data.host);
        }

        // 2. Sync Local Guest Health from Host Authority
        if (typeof data.guestMaxHp === 'number' && Number.isFinite(data.guestMaxHp) && data.guestMaxHp >= 25) this.game.player.maxHp = data.guestMaxHp;
        if (typeof data.guestHp === 'number' && Number.isFinite(data.guestHp)) {
            this._syncLocalHeal();
            const p = this.game.player, wasDowned = p.hp <= 0;
            const pendingHeal = performance.now() < (this._pendingHealUntil || 0);
            if (data.guestHp > (this._preHealHp || 0)) this._pendingHealUntil = 0;
            if (!(pendingHeal && data.guestHp >= (this._preHealHp || 0) && data.guestHp < p.hp)) {
                if (data.guestHp < p.hp - 0.5) {
                    p.hitFlash = 12;
                    if (this.game.effects) {
                        this.game.effects.addDamage(p.x, p.y, Math.max(1, Math.round(p.hp - data.guestHp)), false, false);
                        this.game.effects.addSparks(p.x, p.y, '#ff4757', 6);
                    }
                    if (window.soundEngine && typeof window.soundEngine.playHit === 'function') window.soundEngine.playHit(false, true);
                    if (this.game.camera && typeof this.game.camera.addShake === 'function') this.game.camera.addShake(8);
                }
                p.hp = data.guestHp;
                this._trackedHp = p.hp;
                if (wasDowned && data.guestHp > 0 && this.game.ui) this.game.ui.addKillfeed('🤝 YOU WERE REVIVED!');
            }
        }

        // 3. Sync Wave Info, Squad Stats & HUD
        if (this.game.waveManager) {
            if (Number.isFinite(data.wave)) this.game.waveManager.wave = data.wave;
            if (typeof data.wState === 'string') this.game.waveManager.waveState = data.wState;
            if (Number.isFinite(data.wTotal)) this.game.waveManager.waveTotalEnemies = data.wTotal;
            if (Number.isFinite(data.wKilled)) this.game.waveManager.waveEnemiesKilled = data.wKilled;
        }
        if (data.sq && this.game.player) {
            const p = this.game.player, sq = data.sq;
            p.score = Math.max(p.score || 0, sq.sc || 0); p.kills = Math.max(p.kills || 0, sq.kl || 0);
            p.fatmirKills = Math.max(p.fatmirKills || 0, sq.fk || 0); p.casillasKills = Math.max(p.casillasKills || 0, sq.ck || 0);
            p.skarmogyftosKills = Math.max(p.skarmogyftosKills || 0, sq.sk || 0); p.kleanthisKills = Math.max(p.kleanthisKills || 0, sq.kln || 0);
            p.kiloumpasKills = Math.max(p.kiloumpasKills || 0, sq.kil || 0); p.roufKills = Math.max(p.roufKills || 0, sq.rf || 0);
            p.endlessBossGoldBonus = Math.max(p.endlessBossGoldBonus || 0, sq.eb || 0); p.endlessBossXpBonus = Math.max(p.endlessBossXpBonus || 0, sq.ex || 0);
        }

        // 3.5. Sync Boss Warning Overlay from Snapshot Authority
        if (data.bWarn) {
            if (this.game.bossWarningOverlay && !this.game.bossWarningOverlay.active) {
                this.game.bossWarningOverlay.trigger(data.bWarn, data.bWarnRank || '');
            }
        }

        // 3.6. Sync Cutscene Overlay from Snapshot Authority
        if (data.cutscene && this.game.cutsceneOverlay) {
            if (!this.game.cutsceneOverlay.active) {
                this.game.cutsceneOverlay.startCutscene(data.cutscene.sub, { allowEndless: !!data.cutscene.ae, skipSquadPosition: true });
            }
            if (data.cutscene.tp) {
                this.game.cutsceneOverlay.totalPlayers = data.cutscene.tp;
            }
            if (data.cutscene.txt && this.game.cutsceneOverlay.dialogueText !== data.cutscene.txt) {
                this.game.cutsceneOverlay.setDialogue(data.cutscene.spk, data.cutscene.txt, data.cutscene.col, data.cutscene.ico, data.cutscene.adv);
                this.game.cutsceneOverlay.setReadyState(data.cutscene.rc || 0, data.cutscene.tp || 2, false);
            }
        } else if (!data.cutscene && this.game.cutsceneOverlay && this.game.cutsceneOverlay.active) {
            this.game.cutsceneOverlay.endCutscene();
            this.game.cutsceneOverlay.setReadyState(0, 1, false);
        }

        // 3.7. Sync Lil Xas Concert Easter Egg State (Limo, Stage, Camera Target, Music, Combat Overlay)
        if (typeof LilXasEvent !== 'undefined' && typeof LilXasEvent.applyCoopSnapshot === 'function') {
            LilXasEvent.applyCoopSnapshot(data.lx || null, this.game);
        }

        // 4. Synchronize Enemies with per-frame target lerp coordinates
        if (Array.isArray(data.enemies)) {
            if (!Array.isArray(this.game.enemies)) this.game.enemies = [];
            const incomingIds = new Set();
            const existingMap = new Map();
            for (let i = 0; i < this.game.enemies.length; i++) {
                const e = this.game.enemies[i];
                if (e && e._netId) existingMap.set(e._netId, e);
            }

            for (let i = 0; i < data.enemies.length; i++) {
                const eNet = data.enemies[i];
                if (!eNet || typeof eNet.id !== 'number') continue;
                incomingIds.add(eNet.id);

                let enemy = existingMap.get(eNet.id);
                const netX = Number.isFinite(eNet.x) ? eNet.x : 0;
                const netY = Number.isFinite(eNet.y) ? eNet.y : 0;
                const netAngle = Number.isFinite(eNet.a) ? eNet.a : 0;

                if (!enemy) {
                    // Spawn mirrored enemy locally
                    enemy = this.spawnEnemyByType(eNet.t, netX, netY);
                    if (enemy) {
                        enemy._netId = eNet.id;
                        if (eNet.st) enemy.subType = eNet.st;
                        if (eNet.n) enemy.name = eNet.n;
                        enemy.targetX = netX;
                        enemy.targetY = netY;
                        enemy.vx = Number.isFinite(eNet.vx) ? eNet.vx : 0;
                        enemy.vy = Number.isFinite(eNet.vy) ? eNet.vy : 0;
                        enemy.targetAngle = netAngle;
                        enemy.x = netX;
                        enemy.y = netY;
                        enemy.angle = netAngle;
                        enemy.dead = false;
                        this.game.enemies.push(enemy);
                    }
                }

                if (enemy) {
                    enemy.targetX = netX;
                    enemy.targetY = netY;
                    enemy.vx = Number.isFinite(eNet.vx) ? eNet.vx : 0;
                    enemy.vy = Number.isFinite(eNet.vy) ? eNet.vy : 0;
                    enemy.targetAngle = netAngle;
                    if (!Number.isFinite(enemy.x)) enemy.x = netX;
                    if (!Number.isFinite(enemy.y)) enemy.y = netY;
                    if (!Number.isFinite(enemy.angle)) enemy.angle = netAngle;
                    enemy.hp = Number.isFinite(eNet.hp) ? eNet.hp : enemy.hp;
                    enemy.maxHp = Number.isFinite(eNet.mhp) ? eNet.mhp : enemy.maxHp;
                    enemy.dead = false; // CRITICAL: alive on host means alive on guest!
                    if (eNet.r && Number.isFinite(eNet.r)) enemy.radius = eNet.r;
                    if (eNet.fly !== undefined) {
                        enemy.isFlying = !!eNet.fly;
                        enemy.isAirborneImmune = !!eNet.fly;
                        enemy.flyHeight = eNet.fly ? 1 : 0;
                    }
                    if (eNet.hf) enemy.hitFlash = 8;
                    enemy._lilXasFleeing = !!eNet.fl;
                    enemy._earPainTimer = eNet.ep ? 10 : 0;
                    if (enemy._lilXasFleeing && typeof LilXasCutsceneFX !== 'undefined' && (!enemy._guestBloodNext || performance.now() > enemy._guestBloodNext)) {
                        enemy._guestBloodNext = performance.now() + 180;
                        LilXasCutsceneFX.spawnGroundBlood(enemy.x, enemy.y, enemy.radius || 24);
                    }
                    if (enemy.isLilXasSpeaker) {
                        enemy.speakerIndex = eNet.si || 0;
                        enemy.musicPlaying = !!eNet.mp;
                    }
                    if (eNet.lx && enemy.isLilXas && typeof LilXasAttacksFX !== 'undefined') {
                        LilXasAttacksFX.applyBossNet(enemy, eNet.lx);
                    }
                }
            }

            // Remove enemies no longer present on host (triggering death pop & weapon death FX)
            for (let i = this.game.enemies.length - 1; i >= 0; i--) {
                const e = this.game.enemies[i];
                if (e && e._netId && !incomingIds.has(e._netId)) {
                    e.dead = true;
                    try {
                        if (!e._deathPopped && this.game.effects && typeof this.game.effects.addDeathPop === 'function' && Number.isFinite(e.x) && Number.isFinite(e.y)) {
                            e._deathPopped = true;
                            this.game.effects.addDeathPop(e.x, e.y, e.radius || 24, e.color, e.isBoss || e.isMiniBoss);
                        }
                        if (e._chronoStasisTimer > 0 && typeof ChronoRifle !== 'undefined' && typeof ChronoRifle._shatter === 'function') {
                            e._chronoStasisTimer = 0; ChronoRifle._shatter(e, this.game);
                        }
                        if ((e._symbioteHost || e._symbioteTimer > 0) && typeof SymbioteLauncher !== 'undefined') {
                            SymbioteLauncher.onEnemyDeath(e, this.game);
                        }
                    } catch (fxErr) {
                        console.warn('[CoopGuestSession] Enemy death FX skipped:', fxErr);
                    }
                    this.game.enemies.splice(i, 1);
                }
            }
        }

        // 4.5. Synchronize Enemy Projectiles smoothly without wiping player bullets or teleporting
        if (Array.isArray(data.enemyBullets)) {
            const incomingBulletIds = new Set();
            const existingBulletMap = new Map();

            for (let i = 0; i < this.game.bullets.length; i++) {
                const b = this.game.bullets[i];
                if (b && b.isEnemy && b._netId) {
                    existingBulletMap.set(b._netId, b);
                }
            }

            for (let i = 0; i < data.enemyBullets.length; i++) {
                const eb = data.enemyBullets[i];
                if (!eb) continue;
                const netId = eb.id || (i + 1);
                incomingBulletIds.add(netId);

                let b = existingBulletMap.get(netId);
                const netX = Number.isFinite(eb.x) ? eb.x : 0;
                const netY = Number.isFinite(eb.y) ? eb.y : 0;
                const netVx = Number.isFinite(eb.vx) ? eb.vx : 0;
                const netVy = Number.isFinite(eb.vy) ? eb.vy : 0;

                if (!b && typeof Bullet !== 'undefined') {
                    b = new Bullet({ x: netX, y: netY, vx: netVx, vy: netVy, radius: Number.isFinite(eb.r) ? eb.r : 10, type: eb.t || 'soccer', isEnemy: true, damage: 15 });
                    b._netId = netId;
                    this.game.bullets.push(b);
                } else if (b) {
                    b.vx = netVx; b.vy = netVy;
                    const driftSq = (netX - b.x) ** 2 + (netY - b.y) ** 2;
                    if (driftSq > 3600) { b.x = netX; b.y = netY; }
                    else { b.x += (netX - b.x) * 0.35; b.y += (netY - b.y) * 0.35; }
                }
            }

            // Despawn enemy bullets no longer on host
            for (let i = 0; i < this.game.bullets.length; i++) {
                const b = this.game.bullets[i];
                if (b && b.isEnemy && b._netId && !incomingBulletIds.has(b._netId)) b.dead = true;
            }
        }

        // 4.6. Synchronize Drops (XP, Hearts, Stars, Magnets)
        if (Array.isArray(data.drops) && typeof CoopDropSync !== 'undefined') {
            CoopDropSync.applyGuestDrops(this, data.drops);
        }

        // 5. Double KO check
        if (this.game.player.hp <= 0 && this.remotePlayer.isDowned && this.game.state === 'PLAYING') this.game.gameOver();
    }

    _syncLocalHeal() {
        const p = this.game && this.game.player;
        if (!p || !Number.isFinite(p.hp)) return;
        if (this._trackedHp > 0 && p.hp > this._trackedHp + 0.05) {
            const delta = Math.min(p.hp - this._trackedHp, p.maxHp || 100);
            this._preHealHp = this._trackedHp;
            this._pendingHealUntil = performance.now() + 450;
            this.net.send('GUEST_HEAL', { amount: Number(delta.toFixed(2)) });
        }
        this._trackedHp = p.hp;
    }

    update(dt) {
        this.remotePlayer.update(dt);
        this._syncLocalHeal();
        this.inputSyncTimer++;
        if (this.inputSyncTimer >= 2) {
            this.inputSyncTimer = 0;
            const p = this.game.player;
            this.net.send('GUEST_STATE', {
                x: Math.round(p.x), y: Math.round(p.y),
                vx: Number((p.vx || 0).toFixed(2)), vy: Number((p.vy || 0).toFixed(2)),
                angle: Number((p.angle || 0).toFixed(2)),
                isMoving: !!p.isMoving, shieldActive: !!p.shieldActive, isDashing: !!p.isDashing, heroType: p.heroType,
                weaponType: p.weaponType, equippedArmorId: p.equippedArmorId || null,
                armorEvolved: !!p.armorEvolved, weaponEvolved: !!p.weaponEvolved,
                heroSkin: p.heroSkin || 'default', starBlessed: !!p._starBlessed,
                bubbleCharge: p.isChargingBubble ? Number((p.bubbleCharge || 0).toFixed(2)) : 0
            }, { droppable: true });
        }
    }

    render(ctx, camera) {
        // Render host remote partner
        this.remotePlayer.draw(ctx);
        this.remotePlayer.drawRadarIndicator(ctx, this.game.player, camera);
        RemotePlayer.drawLocalDownedBanner(ctx, this.game.player);
    }

    spawnEnemyByType(type, x, y) {
        const t = (type || '').toLowerCase();
        if ((t === 'fatmir' || t === 'skatmir') && typeof Fatmir !== 'undefined') return new Fatmir(x, y);
        if (t === 'astynomos' && typeof Astynomos !== 'undefined') return new Astynomos(x, y, 1.0, false);
        if (t === 'mat_officer' && typeof Astynomos !== 'undefined') return new Astynomos(x, y, 1.0, true);
        const ctors = {
            casillas: typeof Casillas !== 'undefined' ? Casillas : null, skarmogyftos: typeof Skarmogyftos !== 'undefined' ? Skarmogyftos : null,
            psaltis: typeof Psaltis !== 'undefined' ? Psaltis : null, kleanthis: typeof Kleanthis !== 'undefined' ? Kleanthis : null,
            kiloumpas: typeof Kiloumpas !== 'undefined' ? Kiloumpas : null, rouf: typeof Rouf !== 'undefined' ? Rouf : null,
            frost_wolf: typeof FrostWolf !== 'undefined' ? FrostWolf : null, ice_golem: typeof IceGolem !== 'undefined' ? IceGolem : null,
            casillas_sentinel: typeof CasillasSentinel !== 'undefined' ? CasillasSentinel : null, ravine_chieftain: typeof RavineChieftain !== 'undefined' ? RavineChieftain : null,
            frost_titan: typeof FrostTitan !== 'undefined' ? FrostTitan : null, kiloumpas_berserker: typeof KiloumpasBerserker !== 'undefined' ? KiloumpasBerserker : null,
            zeus: typeof ZeusBoss !== 'undefined' ? ZeusBoss : null, zeus_crystal: typeof ZeusCrystal !== 'undefined' ? ZeusCrystal : null
        };
        if (ctors[t]) return new ctors[t](x, y);
        if (typeof EndlessWaveDirector !== 'undefined') { const e = EndlessWaveDirector.spawnByType(t, x, y, 1.0); if (e) return e; }
        return typeof Fatmir !== 'undefined' ? new Fatmir(x, y) : null;
    }

    playRemoteSkill(remotePlayer, skillData = {}) {
        if (typeof CoopSkillFx !== 'undefined') {
            CoopSkillFx.playRemoteSkill(this.game, remotePlayer, skillData, false);
        }
    }
}

if (typeof window !== 'undefined') {
    window.CoopGuestSession = CoopGuestSession;
}
