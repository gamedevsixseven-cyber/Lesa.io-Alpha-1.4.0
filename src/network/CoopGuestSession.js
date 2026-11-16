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
        this.remotePlayer.isHost = true;

        this.inputSyncTimer = 0;
        this.lastSnapshotTime = performance.now();
        this.collectedDropIds = new Set();

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
                    this.game.cutsceneOverlay.startCutscene(payload.cutsceneId);
                    if (typeof CinematicCutsceneOverlay !== 'undefined' && typeof CinematicCutsceneOverlay.applyGuestSquadPositions === 'function') {
                        CinematicCutsceneOverlay.applyGuestSquadPositions(this.game, this, payload.positions);
                    }
                }
            } else if (type === 'CUTSCENE_DIALOGUE') {
                if (this.game.cutsceneOverlay && typeof this.game.cutsceneOverlay.setDialogue === 'function') {
                    if (!this.game.cutsceneOverlay.active && typeof this.game.cutsceneOverlay.startCutscene === 'function') {
                        this.game.cutsceneOverlay.startCutscene();
                    }
                    this.game.cutsceneOverlay.setDialogue(payload.speaker, payload.text, payload.speakerColor, payload.avatarIcon, payload.promptAdvance);
                    this.game.cutsceneOverlay.setReadyState(payload.readyCount || 0, payload.totalPlayers || 2, false);
                }
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
            } else if (type === 'ZEUS_REWARD_UNLOCK') {
                if (typeof ZeusSkyPhase !== 'undefined' && typeof ZeusSkyPhase.grantZeusFirstKillRewards === 'function') {
                    ZeusSkyPhase.grantZeusFirstKillRewards(null, this.game);
                }
            } else if (type === 'BOSS_REWARD_UNLOCK' && payload && payload.bossId && typeof BossRewardManager !== 'undefined') {
                BossRewardManager.queueBossDrops(payload.bossId, { effects: this.game && this.game.effects, syncCoop: false, bossName: payload.bossName });
            }
        };

        this.net.onDisconnectedCallback = (reason) => {
            this.handleHostQuit();
        };
    }

    handleHostShoot(bData) {
        if (!bData || this.remotePlayer.isDowned) return;
        if (typeof Bullet === 'undefined') return;

        const bullet = new Bullet({
            x: bData.x,
            y: bData.y,
            vx: bData.vx,
            vy: bData.vy,
            damage: bData.damage || 25,
            speed: bData.speed || 14,
            radius: bData.radius || 7,
            type: bData.type || 'pea',
            isEnemy: false,
            pierce: bData.pierce || 1,
            maxBounces: bData.maxBounces || 0,
            shooter: this.remotePlayer
        });

        if (bData.isChargedBubble) bullet.isChargedBubble = true;
        this.game.bullets.push(bullet);

        if (window.soundEngine && typeof window.soundEngine.playShoot === 'function') {
            window.soundEngine.playShoot(bData.type || 'pea');
        }
    }

    handleHostQuit(reason = 'Host left the game') {
        this.game.state = 'MENU';
        this.game.isCoopGuest = false;
        this.game.coopSession = null;

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
            if (bullets && bullets.length > 0) {
                for (let i = 0; i < bullets.length; i++) {
                    const b = bullets[i];
                    this.net.send('GUEST_SHOOT', {
                        x: Math.round(b.x),
                        y: Math.round(b.y),
                        vx: Number(b.vx.toFixed(2)),
                        vy: Number(b.vy.toFixed(2)),
                        damage: b.damage,
                        speed: b.speed,
                        radius: b.radius,
                        type: b.type,
                        pierce: b.pierce,
                        maxBounces: b.maxBounces,
                        isChargedBubble: !!b.isChargedBubble
                    });
                }
            }
            return bullets;
        };

        // Intercept Dash
        const origDash = this.game.player.dash.bind(this.game.player);
        this.game.player.dash = (effects) => {
            origDash(effects);
            this.net.send('GUEST_DASH', {});
        };

        // Intercept Skill
        const origSkill = this.game.player.useSkill.bind(this.game.player);
        this.game.player.useSkill = (enemies, effects, camera, game) => {
            const p = this.game.player;
            const skillId = p.selectedSkill || 'blade_rush';
            const level = (typeof PlayerSkills !== 'undefined') ? PlayerSkills.getSkillLevel(skillId) : 1;
            origSkill(enemies, effects, camera, game);
            this.net.send('GUEST_SKILL', {
                skillId: skillId,
                level: level,
                x: Math.round(p.x),
                y: Math.round(p.y),
                angle: Number((p.angle || 0).toFixed(2))
            });
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
                            if (window.soundEngine && typeof window.soundEngine.playCrateBreak === 'function') {
                                window.soundEngine.playCrateBreak();
                            }
                            if (this.game.effects) {
                                this.game.effects.addDust(obs.x, obs.y, 8, 14);
                                this.game.effects.addSparks(obs.x, obs.y, '#e58e26', 8);
                            }
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
        if (typeof data.guestHp === 'number') {
            const wasDowned = this.game.player.hp <= 0;
            if (data.guestHp < this.game.player.hp) {
                this.game.player.hitFlash = 12;
                if (this.game.effects) {
                    const dmg = this.game.player.hp - data.guestHp;
                    this.game.effects.addDamage(this.game.player.x, this.game.player.y, dmg, false, false);
                    this.game.effects.addSparks(this.game.player.x, this.game.player.y, '#ff4757', 6);
                }
                if (window.soundEngine && typeof window.soundEngine.playHit === 'function') {
                    window.soundEngine.playHit(false, true);
                }
                if (this.game.camera && typeof this.game.camera.addShake === 'function') {
                    this.game.camera.addShake(8);
                }
            }
            this.game.player.hp = data.guestHp;
            if (wasDowned && data.guestHp > 0) {
                if (this.game.ui) this.game.ui.addKillfeed('🤝 YOU WERE REVIVED!');
            }
        }

        // 3. Sync Wave Info & HUD
        if (this.game.waveManager) {
            this.game.waveManager.wave = data.wave;
            this.game.waveManager.waveState = data.wState;
            this.game.waveManager.waveTotalEnemies = data.wTotal;
            this.game.waveManager.waveEnemiesKilled = data.wKilled;
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
                this.game.cutsceneOverlay.startCutscene(data.cutscene.sub);
            }
            if (data.cutscene.tp) {
                this.game.cutsceneOverlay.totalPlayers = data.cutscene.tp;
            }
            if (data.cutscene.txt && this.game.cutsceneOverlay.dialogueText !== data.cutscene.txt) {
                this.game.cutsceneOverlay.setDialogue(data.cutscene.spk, data.cutscene.txt, data.cutscene.col, data.cutscene.ico, data.cutscene.adv);
                this.game.cutsceneOverlay.setReadyState(data.cutscene.rc || 0, data.cutscene.tp || 2, false);
            }
        }

        // 4. Synchronize Enemies with per-frame target lerp coordinates
        if (Array.isArray(data.enemies)) {
            if (!Array.isArray(this.game.enemies)) this.game.enemies = [];
            const incomingIds = new Set();
            const existingMap = new Map();
            for (let i = 0; i < this.game.enemies.length; i++) {
                const e = this.game.enemies[i];
                if (e._netId) existingMap.set(e._netId, e);
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
                }
            }

            // Remove enemies no longer present on host
            for (let i = this.game.enemies.length - 1; i >= 0; i--) {
                const e = this.game.enemies[i];
                if (e._netId && !incomingIds.has(e._netId)) {
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
                    b = new Bullet({
                        x: netX,
                        y: netY,
                        vx: netVx,
                        vy: netVy,
                        radius: Number.isFinite(eb.r) ? eb.r : 10,
                        type: eb.t || 'soccer',
                        isEnemy: true,
                        damage: 15
                    });
                    b._netId = netId;
                    this.game.bullets.push(b);
                } else if (b) {
                    b.vx = netVx;
                    b.vy = netVy;
                    const driftSq = (netX - b.x) ** 2 + (netY - b.y) ** 2;
                    if (driftSq > 3600) {
                        b.x = netX;
                        b.y = netY;
                    } else {
                        b.x += (netX - b.x) * 0.35;
                        b.y += (netY - b.y) * 0.35;
                    }
                }
            }

            // Despawn enemy bullets no longer on host
            for (let i = 0; i < this.game.bullets.length; i++) {
                const b = this.game.bullets[i];
                if (b && b.isEnemy && b._netId && !incomingBulletIds.has(b._netId)) {
                    b.dead = true;
                }
            }
        }

        // 4.6. Synchronize Drops (XP, Hearts, Stars, Magnets)
        if (Array.isArray(data.drops)) {
            if (!Array.isArray(this.game.drops)) this.game.drops = [];
            const incomingDropIds = new Set();
            const existingDropMap = new Map();
            for (let i = 0; i < this.game.drops.length; i++) {
                const d = this.game.drops[i];
                if (d._netId) existingDropMap.set(d._netId, d);
            }

            for (let i = 0; i < data.drops.length; i++) {
                const dNet = data.drops[i];
                if (!dNet || typeof dNet.id !== 'number') continue;
                incomingDropIds.add(dNet.id);

                // If this drop was already collected by local guest, never re-spawn it!
                if (this.collectedDropIds.has(dNet.id)) continue;

                let drop = existingDropMap.get(dNet.id);
                if (!drop && typeof Drop !== 'undefined') {
                    drop = new Drop(dNet.x, dNet.y, dNet.t || 'xp', dNet.v || 1);
                    drop._netId = dNet.id;
                    const origCollect = drop.onCollect.bind(drop);
                    drop.onCollect = (player, effects) => {
                        origCollect(player, effects);
                        this.collectedDropIds.add(dNet.id);
                        this.net.send('GUEST_COLLECT_DROP', { id: dNet.id, type: dNet.t || 'xp' });
                    };
                    this.game.drops.push(drop);
                } else if (drop && drop.magnetized) {
                    // Update magnetized lerping from host
                    drop.x += (dNet.x - drop.x) * 0.35;
                    drop.y += (dNet.y - drop.y) * 0.35;
                }
            }

            for (let i = this.game.drops.length - 1; i >= 0; i--) {
                const d = this.game.drops[i];
                if (d._netId && (!incomingDropIds.has(d._netId) || this.collectedDropIds.has(d._netId))) {
                    this.game.drops.splice(i, 1);
                }
            }

            // Cleanup collected IDs once host confirms drop is gone from snapshot
            for (const id of this.collectedDropIds) {
                if (!incomingDropIds.has(id)) {
                    this.collectedDropIds.delete(id);
                }
            }
        }

        // 5. Double KO check
        if (this.game.player.hp <= 0 && this.remotePlayer.isDowned && this.game.state === 'PLAYING') {
            this.game.gameOver();
        }
    }

    update(dt) {
        // Update host remote player interpolation
        this.remotePlayer.update(dt);

        // Send local guest state to Host at ~30Hz
        this.inputSyncTimer++;
        if (this.inputSyncTimer >= 2) {
            this.inputSyncTimer = 0;
            const p = this.game.player;
            this.net.send('GUEST_STATE', {
                x: Math.round(p.x),
                y: Math.round(p.y),
                vx: Number((p.vx || 0).toFixed(2)),
                vy: Number((p.vy || 0).toFixed(2)),
                angle: Number((p.angle || 0).toFixed(2)),
                isMoving: !!p.isMoving,
                shieldActive: !!p.shieldActive,
                isDashing: !!p.isDashing,
                heroType: p.heroType
            });
        }
    }

    render(ctx, camera) {
        // Render host remote partner
        this.remotePlayer.draw(ctx);
        this.remotePlayer.drawRadarIndicator(ctx, this.game.player, camera);
    }

    spawnEnemyByType(type, x, y) {
        const t = (type || '').toLowerCase();
        if ((t === 'fatmir' || t === 'skatmir') && typeof Fatmir !== 'undefined') return new Fatmir(x, y);
        if (t === 'casillas' && typeof Casillas !== 'undefined') return new Casillas(x, y);
        if (t === 'skarmogyftos' && typeof Skarmogyftos !== 'undefined') return new Skarmogyftos(x, y);
        if (t === 'psaltis' && typeof Psaltis !== 'undefined') return new Psaltis(x, y);
        if (t === 'astynomos' && typeof Astynomos !== 'undefined') return new Astynomos(x, y, 1.0, false);
        if (t === 'mat_officer' && typeof Astynomos !== 'undefined') return new Astynomos(x, y, 1.0, true);
        if (t === 'kleanthis' && typeof Kleanthis !== 'undefined') return new Kleanthis(x, y);
        if (t === 'kiloumpas' && typeof Kiloumpas !== 'undefined') return new Kiloumpas(x, y);
        if (t === 'rouf' && typeof Rouf !== 'undefined') return new Rouf(x, y);
        if (t === 'frost_wolf' && typeof FrostWolf !== 'undefined') return new FrostWolf(x, y);
        if (t === 'ice_golem' && typeof IceGolem !== 'undefined') return new IceGolem(x, y);
        if (t === 'casillas_sentinel' && typeof CasillasSentinel !== 'undefined') return new CasillasSentinel(x, y);
        if (t === 'ravine_chieftain' && typeof RavineChieftain !== 'undefined') return new RavineChieftain(x, y);
        if (t === 'frost_titan' && typeof FrostTitan !== 'undefined') return new FrostTitan(x, y);
        if (t === 'kiloumpas_berserker' && typeof KiloumpasBerserker !== 'undefined') return new KiloumpasBerserker(x, y);
        if (t === 'zeus' && typeof ZeusBoss !== 'undefined') return new ZeusBoss(x, y);
        if (t === 'zeus_crystal' && typeof ZeusCrystal !== 'undefined') return new ZeusCrystal(x, y);
        if (typeof EndlessWaveDirector !== 'undefined') {
            const endlessEnemy = EndlessWaveDirector.spawnByType(t, x, y, 1.0);
            if (endlessEnemy) return endlessEnemy;
        }
        if (typeof Fatmir !== 'undefined') return new Fatmir(x, y);
        return null;
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
