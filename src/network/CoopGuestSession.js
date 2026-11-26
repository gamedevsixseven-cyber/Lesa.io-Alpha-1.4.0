/**
 * Lesa.io - Co-op Guest Session Coordinator
 * Synchronizes client-side world state with authoritative host snapshots and relays guest inputs
 */

class CoopGuestSession {
    constructor(game, networkManager, hostInfo, mapSeed = 123456, matchMeta = null) {
        this.game = game;
        this.net = networkManager;
        this.isHost = false;
        this.appliedMapSeed = mapSeed;

        CoopPeerRoster.initGuestRoster(this, game, networkManager, hostInfo, matchMeta);
        this._syncedTotalPlayers = CoopPeerRoster.getActiveRemoteCount(this) + 1;

        this.inputSyncTimer = 0;
        this.lastSnapshotTime = performance.now();
        this.collectedDropIds = new Set();
        this._pendingHealUntil = 0;
        this._preHealHp = 0;
        this._trackedHp = (game && game.player && Number.isFinite(game.player.hp)) ? game.player.hp : 100;
        this.pauseReadyState = { by: '', readyCount: 0, totalPlayers: this._syncedTotalPlayers, localReady: false, resuming: false };
        this._resumeTimer = null;
        this._hostLeftNotified = false;

        if (this.game.cutsceneOverlay) {
            this.game.cutsceneOverlay.totalPlayers = this._syncedTotalPlayers;
            this.game.cutsceneOverlay.onRequestAdvance = () => this.handleGuestCutsceneAdvance();
        }

        this.setupNetworkHandlers();
        this.hookGuestInput();
        if (typeof CoopCombatFx !== 'undefined' && typeof CoopCombatFx.hookDamageSync === 'function') CoopCombatFx.hookDamageSync(this.game);
    }

    get remotePlayer() { return CoopPeerRoster.getRemotePlayer(this, 'host'); }
    getRemotePlayer(peerId = null) { return CoopPeerRoster.getRemotePlayer(this, peerId || 'host'); }
    getTotalPlayers() { return CoopPeerRoster.getTotalPlayers(this); }

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
                const actor = this.getRemotePlayer((payload && payload.fromId) || 'host');
                if (actor && this.game.effects) {
                    if (typeof this.game.effects.addDashTrail === 'function') {
                        this.game.effects.addDashTrail(actor.x, actor.y, actor.radius, actor.heroColor);
                    } else if (typeof this.game.effects.addDust === 'function') {
                        this.game.effects.addDust(actor.x, actor.y, 6, 8);
                    }
                }
            } else if (type === 'HOST_SKILL') {
                const actor = this.getRemotePlayer((payload && payload.fromId) || 'host');
                if (actor) this.playRemoteSkill(actor, payload);
            } else if (type === 'HOST_ULT') {
                const actor = this.getRemotePlayer((payload && payload.fromId) || 'host');
                if (actor && typeof CoopSkillFx !== 'undefined') CoopSkillFx.playRemoteUlt(this.game, actor, payload, false);
            } else if (type === 'KILOUMPAS_GRAB') {
                this._handleKiloumpasGrab(payload);
            } else if (type === 'HOST_QUIT_MATCH') {
                this.handleHostQuit(payload && payload.name);
            } else if (type === 'NET_PAUSE' || type === 'NET_PAUSE_STATE') {
                this._applyPauseState(payload || {});
            } else if (type === 'NET_RESUME') {
                this._triggerSynchronizedResume(payload || {});
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
                    const sameTxt = (this.game.cutsceneOverlay.dialogueText === payload.text);
                    if (!sameTxt) {
                        this.game.cutsceneOverlay.setDialogue(payload.speaker, payload.text, payload.speakerColor, payload.avatarIcon, payload.promptAdvance);
                    }
                    this.game.cutsceneOverlay.setReadyState(payload.readyCount || 0, payload.totalPlayers || 2, sameTxt ? this.game.cutsceneOverlay.isLocalReady : false);
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
                    const c = Math.min(500, Math.round(payload.coins));
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
                const p = this.game && this.game.player;
                BossRewardManager.queueBossDrops(payload.bossId, { effects: this.game && this.game.effects, x: p ? p.x : 0, y: p ? p.y : 0, game: this.game, syncCoop: false, bossName: payload.bossName });
                if (typeof window !== 'undefined' && window.SaveManager && typeof window.SaveManager.saveNow === 'function') window.SaveManager.saveNow();
            } else if (type === 'BOSS_FEAT_DEFEAT' && payload && payload.bossId && typeof PerkProgression !== 'undefined') {
                PerkProgression.recordBossDefeat(typeof window !== 'undefined' ? window.GameState : null, payload.bossId, false);
                if (typeof window !== 'undefined' && window.SaveManager && typeof window.SaveManager.saveNow === 'function') window.SaveManager.saveNow();
            } else if (type === 'STAR_STONE_REWARD' && typeof DungeonManager !== 'undefined') {
                DungeonManager.addOlympianStarStone(1);
                if (this.game && this.game.effects && this.game.player) {
                    this.game.effects.addConfetti(this.game.player.x, this.game.player.y, 160);
                    this.game.effects.addComicSplash(this.game.player.x, this.game.player.y - 80, '🌟 OLYMPIAN STAR-STONE ACQUIRED! 🌟');
                }
                if (typeof window !== 'undefined' && window.soundEngine && typeof window.soundEngine.playLevelUp === 'function') window.soundEngine.playLevelUp();
            } else if (type === 'HARD_W60_FINALE' && typeof ApexW60FinaleTeaser !== 'undefined') {
                if (payload && payload.kind === 'start') {
                    if (this.game && this.game.waveManager) this.game.waveManager.waveState = 'HARD_FINALE';
                    ApexW60FinaleTeaser.start(this.game);
                } else if (payload && payload.kind === 'victory') {
                    ApexW60FinaleTeaser.completeToVictory(this.game, true);
                }
            } else if (type === 'COOP_GAME_OVER') {
                if (payload && Number.isFinite(payload.wave) && this.game.waveManager) this.game.waveManager.wave = Math.max(this.game.waveManager.wave || 1, payload.wave);
                if (this.game && (this.game.state === 'PLAYING' || this.game.state === 'PAUSED')) this.game.gameOver();
            } else if (type === 'COOP_CHAT' && payload && this.game && this.game.ui && this.game.ui.hud) {
                const speaker = this.getRemotePlayer((payload && payload.fromId) || 'host');
                this.game.ui.hud.receiveChatMessage(payload.name || (speaker && speaker.name) || 'Partner', payload.text, speaker, false);
            } else if (type === 'DEV_COOP_SYNC' && payload && payload.kind === 'warp' && this.game) {
                if (payload.mode && this.game.gameMode !== payload.mode) {
                    this.game.gameMode = payload.mode;
                    if (this.game.waveManager) this.game.waveManager.gameMode = payload.mode;
                    if (this.game.arena && typeof this.game.arena.setGameMode === 'function') this.game.arena.setGameMode(payload.mode);
                }
                if (payload.num && this.game.waveManager) this.game.waveManager.wave = payload.num;
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
        const fromId = (bData && bData.fromId) || 'host';
        if (typeof CoopCombatFx !== 'undefined') CoopCombatFx.spawnRemoteBullet(this, bData, false, fromId);
    }

    handleHostQuit(explicitName = null) {
        if (typeof CoopPauseSync !== 'undefined') CoopPauseSync.guestHandleHostLeft(this, explicitName);
    }

    getPauseUIState(fallbackBy = null) {
        return { ...this.pauseReadyState, by: this.pauseReadyState.by || fallbackBy || 'Partner' };
    }

    sendPause(playerName) {
        if (this._resumeTimer) { clearTimeout(this._resumeTimer); this._resumeTimer = null; }
        this.pauseReadyState = { by: playerName || 'Partner', readyCount: 0, totalPlayers: 2, localReady: false, resuming: false };
        this.net.send('NET_PAUSE', { by: playerName });
    }

    _applyPauseState(payload) { if (typeof CoopPauseSync !== 'undefined') CoopPauseSync.guestApplyPauseState(this, payload); }
    requestToggleResumeReady() { if (typeof CoopPauseSync !== 'undefined') CoopPauseSync.guestToggleReady(this); }
    _triggerSynchronizedResume(payload) { if (typeof CoopPauseSync !== 'undefined') CoopPauseSync.guestTriggerResume(this, payload); }
    sendResume() { this.requestToggleResumeReady(); }

    leaveMatch() {
        this._hostLeftNotified = true;
        if (this._resumeTimer) { clearTimeout(this._resumeTimer); this._resumeTimer = null; }
        const guestName = (this.game && this.game.player && this.game.player.name) || 'Player 2';
        if (this.game.cutsceneOverlay) {
            this.game.cutsceneOverlay.totalPlayers = 1;
            this.game.cutsceneOverlay.setReadyState(0, 1, false);
            this.game.cutsceneOverlay.onRequestAdvance = null;
        }
        if (this.net && typeof this.net.disconnectGracefully === 'function') {
            this.net.disconnectGracefully('guest_left', null, 'GUEST_QUIT_MATCH', { reason: 'guest_left', name: guestName });
        } else if (this.net && typeof this.net.disconnect === 'function') {
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
        const origUlt = this.game.player.useUlt.bind(this.game.player);
        this.game.player.useUlt = (enemies, effects, camera, game) => {
            const p = this.game.player;
            const wasActive = !!p.ultActive;
            const res = origUlt(enemies, effects, camera, game);
            if (!wasActive && p.ultActive && p.ultId) {
                this.net.send('GUEST_ULT', {
                    ultId: p.ultId, heroType: p.heroType,
                    x: Math.round(p.x), y: Math.round(p.y),
                    angle: Number((p.angle || 0).toFixed(2))
                });
            }
            return res;
        };
    }

    _handleKiloumpasGrab(data) {
        if (!data) return;
        const isLocalTarget = (this.myPeerId && data.target === this.myPeerId) || (!this.myPeerId && data.target === 'guest');
        const tgt = isLocalTarget ? (this.game && this.game.player) : this.getRemotePlayer(data.target || 'host');
        const isHostTarget = !isLocalTarget;
        const fx = this.game && this.game.effects;
        if (!tgt) return;
        const bx = Number.isFinite(data.bx) ? data.bx : tgt.x, by = Number.isFinite(data.by) ? data.by : tgt.y;
        if (data.action === 'grab') {
            const wasGrabbed = tgt.isGrabbed;
            tgt.isGrabbed = true; tgt.isAirborne = false; tgt.isDashing = false; tgt.isBladeRushing = false; tgt.stunTimer = 0; tgt.knockbackTimer = 0;
            tgt.vx = 0; tgt.vy = 0;
            if (!isHostTarget) { tgt._grabFrames = 0; if (Number.isFinite(data.x)) tgt.x = data.x; if (Number.isFinite(data.y)) tgt.y = data.y; if (Number.isFinite(data.airZ)) tgt.airZ = data.airZ; }
            if (!wasGrabbed) {
                if (fx) { fx.addComicSplash(bx, by - 52, 'SE EPIASA! 💢'); fx.addDust(tgt.x, tgt.y, 8, 10); }
                if (window.soundEngine && typeof window.soundEngine.playHit === 'function') window.soundEngine.playHit(false, true);
            }
        } else if (data.action === 'throw') {
            tgt.isGrabbed = false; tgt.isDashing = false; tgt.isBladeRushing = false; tgt.stunTimer = 0; tgt.knockbackTimer = 0;
            if (!isHostTarget) {
                tgt._grabFrames = 0;
                if (Number.isFinite(data.x)) tgt.x = data.x; if (Number.isFinite(data.y)) tgt.y = data.y;
                tgt.launchAirborne(data.vx || 0, data.vy || 0, data.vz || 17.5, 0);
                if (this.game && this.game.camera && typeof this.game.camera.shake === 'function') this.game.camera.shake(12, 18);
            }
            if (fx) {
                fx.addShockwave(bx, by, 130, 'rgba(255, 71, 87, 0.95)');
                fx.addDust(bx, by, 18, 20);
                fx.addComicSplash(bx, by - 50, 'FYGE RE! 💨');
            }
            if (window.soundEngine && typeof window.soundEngine.playHit === 'function') window.soundEngine.playHit(true, true);
        } else if (data.action === 'release') {
            tgt.isGrabbed = false;
            if (!isHostTarget) tgt._grabFrames = 0;
            if (!tgt.isAirborne) tgt.airZ = 0;
        }
    }

    applyHostSnapshot(data) {
        if (!data) return;
        if (typeof CoopSnapshotSync !== 'undefined' && !CoopSnapshotSync.shouldAcceptSeq(this, '_lastRxSnapSeq', data.seq)) {
            return;
        }

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

        // 1. Sync Host & Fellow Guest Remote Player States
        if (data.host) {
            this.remotePlayer.setTargetState(data.host);
        }
        const myEntry = CoopPeerRoster.applyGuestPeersSnapshot(this, data);
        if (Array.isArray(data.peers)) {
            let liveRemotes = 1;
            for (let i = 0; i < data.peers.length; i++) {
                if (data.peers[i] && !data.peers[i].disc) liveRemotes++;
            }
            this._syncedTotalPlayers = liveRemotes;
            if (this.game.cutsceneOverlay) this.game.cutsceneOverlay.totalPlayers = liveRemotes;
        }

        // 2. Sync Local Guest Health from Host Authority (per-peer entry with 2P fallback)
        const authMaxHp = myEntry && typeof myEntry.maxHp === 'number' ? myEntry.maxHp : data.guestMaxHp;
        const authHp = myEntry && typeof myEntry.hp === 'number' ? myEntry.hp : data.guestHp;
        if (typeof authMaxHp === 'number' && Number.isFinite(authMaxHp) && authMaxHp >= 25) this.game.player.maxHp = authMaxHp;
        if (typeof authHp === 'number' && Number.isFinite(authHp)) {
            this._syncLocalHeal();
            const p = this.game.player, wasDowned = p.hp <= 0;
            const pendingHeal = performance.now() < (this._pendingHealUntil || 0);
            if (authHp > (this._preHealHp || 0)) this._pendingHealUntil = 0;
            if (!(pendingHeal && authHp >= (this._preHealHp || 0) && authHp < p.hp)) {
                if (authHp < p.hp - 0.5) {
                    p.hitFlash = 12;
                    if (this.game.effects) {
                        this.game.effects.addDamage(p.x, p.y, Math.max(1, Math.round(p.hp - authHp)), false, true);
                        this.game.effects.addSparks(p.x, p.y, '#ff4757', 6);
                    }
                    if (window.soundEngine && typeof window.soundEngine.playHit === 'function') window.soundEngine.playHit(false, true);
                    if (this.game.camera && typeof this.game.camera.addShake === 'function') this.game.camera.addShake(8);
                }
                p.hp = authHp;
                this._trackedHp = p.hp;
                if (wasDowned && authHp > 0 && this.game.ui) this.game.ui.addKillfeed('🤝 YOU WERE REVIVED!');
            }
        }

        // 3. Sync Wave Info, Hard Endless Strikes/Progression & Squad Stats
        if (this.game.waveManager) {
            const prevW = this.game.waveManager.wave || 0;
            if (Number.isFinite(data.wave)) this.game.waveManager.wave = data.wave;
            if (typeof data.wState === 'string') this.game.waveManager.waveState = data.wState;
            if (Number.isFinite(data.wTotal)) this.game.waveManager.waveTotalEnemies = data.wTotal;
            if (Number.isFinite(data.wKilled)) this.game.waveManager.waveEnemiesKilled = data.wKilled;
            if (typeof CoopSnapshotSync !== 'undefined') CoopSnapshotSync.syncGuestEndlessWave(this, data, prevW);
        }
        if (Array.isArray(data.ehS) && typeof EndlessHardMap !== 'undefined') {
            EndlessHardMap.applyNetStrikes(data.ehS, this.game);
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
        if (typeof CoopSnapshotSync !== 'undefined' && typeof CoopSnapshotSync.applyGuestCutscene === 'function') {
            CoopSnapshotSync.applyGuestCutscene(this, data.cutscene || null);
        }

        // 3.7. Sync Lil Xas Concert Easter Egg State (Limo, Stage, Camera Target, Music, Combat Overlay)
        if (typeof LilXasEvent !== 'undefined' && typeof LilXasEvent.applyCoopSnapshot === 'function') {
            LilXasEvent.applyCoopSnapshot(data.lx || null, this.game);
        }

        // 4. Synchronize Enemies with zero-GC delta reconstruction & interpolation
        if (Array.isArray(data.enemies) && typeof CoopSnapshotSync !== 'undefined') {
            CoopSnapshotSync.applyGuestEnemies(this, data.enemies);
        }
        if (Array.isArray(data.dmgs) && typeof CoopCombatFx !== 'undefined' && typeof CoopCombatFx.applyGuestDamageNums === 'function') {
            CoopCombatFx.applyGuestDamageNums(this, data.dmgs);
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

        // 5. Squad KO check
        if (CoopPeerRoster.areAllPlayersDowned(this) && this.game.state === 'PLAYING') this.game.gameOver();
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
        for (let i = 0; i < this.remotePlayers.length; i++) {
            const rp = this.remotePlayers[i];
            if (!rp) continue;
            rp.update(dt);
            if (typeof CoopSkillFx !== 'undefined' && typeof CoopSkillFx.updateRemoteUlt === 'function') {
                CoopSkillFx.updateRemoteUlt(this.game, rp, dt, false, null);
            }
        }
        this._syncLocalHeal();
        this.inputSyncTimer++;
        const stateEvery = (this.net && this.net.latency > 180) ? 3 : 2;
        if (this.inputSyncTimer >= stateEvery) {
            this.inputSyncTimer = 0;
            this._guestSeq = (this._guestSeq || 0) + 1;
            const p = this.game.player;
            this.net.send('GUEST_STATE', {
                seq: this._guestSeq,
                name: (this.net && this.net.localUserData && this.net.localUserData.name) || p.name,
                x: Math.round(p.x), y: Math.round(p.y),
                vx: Number((p.vx || 0).toFixed(2)), vy: Number((p.vy || 0).toFixed(2)),
                angle: Number((p.angle || 0).toFixed(2)),
                isMoving: !!p.isMoving, shieldActive: !!p.shieldActive, isDashing: !!p.isDashing, heroType: p.heroType,
                weaponType: p.weaponType, equippedArmorId: p.equippedArmorId || null,
                armorEvolved: !!p.armorEvolved, weaponEvolved: !!p.weaponEvolved,
                heroSkin: p.heroSkin || 'default', starBlessed: !!p._starBlessed,
                ultId: p.ultActive ? (p.ultId || '') : '',
                vfAng: p.vf185Active ? Number((p.vf185Angle || p.angle || 0).toFixed(2)) : undefined,
                bubbleCharge: p.isChargingBubble ? Number((p.bubbleCharge || 0).toFixed(2)) : 0
            }, { droppable: true, fast: true });
        }
    }

    render(ctx, camera) {
        // Render all remote squadmates (Host + fellow Guests)
        for (let i = 0; i < this.remotePlayers.length; i++) {
            const rp = this.remotePlayers[i];
            if (!rp || rp.isDownedDisconnected) continue;
            rp.draw(ctx);
            rp.drawRadarIndicator(ctx, this.game.player, camera);
        }
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
