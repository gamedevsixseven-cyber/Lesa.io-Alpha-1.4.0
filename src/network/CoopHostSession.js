/**
 * Lesa.io - Co-op Host Session Coordinator
 * Coordinates authoritative enemy AI, snapshot broadcasting, guest bullet integration, and co-op revives
 */

class CoopHostSession {
    constructor(game, networkManager, guestInfo, mapSeed = 123456) {
        this.game = game;
        this.net = networkManager;
        this.isHost = true;
        this.mapSeed = mapSeed;

        guestInfo = guestInfo || (networkManager && networkManager.peerUserData) || null;
        CoopPeerRoster.initHostRoster(this, game, networkManager, guestInfo);

        this.netIdCounter = 1;
        this.snapshotTimer = 0;
        this.snapshotInterval = 2; // Every 2 frames (~30Hz at 60fps) for crisp responsiveness
        this._guestShootBurst = [];
        this._lastGuestSkillTime = 0;
        this.pauseReadyPlayers = new Set();
        this.pausedByName = '';
        this._pauseResuming = false;
        this._resumeTimer = null;
        this._peerLeftNotified = false;

        this.setupNetworkHandlers();
        this.hookHostInput();
    }

    hookHostInput() {
        const origShoot = this.game.player.shoot.bind(this.game.player);
        this.game.player.shoot = (effects) => {
            if (this.game.player.hp <= 0) return null;
            const bullets = origShoot(effects);
            if (bullets && bullets.length > 0 && typeof CoopCombatFx !== 'undefined') {
                CoopCombatFx.emitBullets(this.net, 'HOST_SHOOT', bullets);
            }
            return bullets;
        };

        const origDash = this.game.player.dash.bind(this.game.player);
        this.game.player.dash = (effects) => {
            const ok = origDash(effects);
            if (ok) this.net.send('HOST_DASH', {});
            return ok;
        };

        const origSkill = this.game.player.useSkill.bind(this.game.player);
        this.game.player.useSkill = (enemies, effects, camera, game) => {
            const p = this.game.player;
            const skillId = p.selectedSkill || 'blade_rush';
            const level = (typeof PlayerSkills !== 'undefined') ? PlayerSkills.getSkillLevel(skillId) : 1;
            const ok = origSkill(enemies, effects, camera, game);
            if (ok) {
                this.net.send('HOST_SKILL', {
                    skillId: skillId,
                    level: level,
                    x: Math.round(p.x),
                    y: Math.round(p.y),
                    angle: Number((p.angle || 0).toFixed(2))
                });
            }
            return ok;
        };

        const origUlt = this.game.player.useUlt.bind(this.game.player);
        this.game.player.useUlt = (enemies, effects, camera, game) => {
            const p = this.game.player;
            const wasActive = !!p.ultActive;
            const res = origUlt(enemies, effects, camera, game);
            if (!wasActive && p.ultActive && p.ultId) {
                this.net.send('HOST_ULT', {
                    ultId: p.ultId, heroType: p.heroType,
                    x: Math.round(p.x), y: Math.round(p.y),
                    angle: Number((p.angle || 0).toFixed(2))
                });
            }
            return res;
        };

        if (this.game.bossWarningOverlay) {
            const origBossTrigger = this.game.bossWarningOverlay.trigger.bind(this.game.bossWarningOverlay);
            this.game.bossWarningOverlay.trigger = (bossName, rankName = '') => {
                origBossTrigger(bossName, rankName);
                this.net.send('BOSS_TRIGGER', {
                    bossName: bossName || 'KLEANTHIS THE REBETIS',
                    rankName: rankName || ''
                });
            };
        }

        if (this.game.cutsceneOverlay) {
            const co = this.game.cutsceneOverlay;
            this.cutsceneReadyPlayers = new Set();
            co.totalPlayers = this.getTotalPlayers();
            co.onRequestAdvance = () => this.handleCutsceneAdvance('host');

            const origCutscene = co.startCutscene.bind(co);
            co.startCutscene = (cutsceneId, opts = {}) => {
                this.cutsceneReadyPlayers.clear();
                origCutscene(cutsceneId, opts);
                const positions = (!opts || !opts.skipSquadPosition) && typeof CinematicCutsceneOverlay !== 'undefined' && typeof CinematicCutsceneOverlay.positionCoopSquad === 'function'
                    ? CinematicCutsceneOverlay.positionCoopSquad(this.game, this)
                    : [];
                this.net.send('CUTSCENE_TRIGGER', { cutsceneId, opts: opts || {}, positions });
            };

            const origDialogue = co.setDialogue.bind(co);
            co.setDialogue = (speaker, text, speakerColor, avatarIcon, promptAdvance) => {
                this.cutsceneReadyPlayers.clear();
                const total = this.getTotalPlayers();
                co.setReadyState(0, total, false);
                origDialogue(speaker, text, speakerColor, avatarIcon, promptAdvance);
                this.net.send('CUTSCENE_DIALOGUE', { speaker, text, speakerColor, avatarIcon, promptAdvance, readyCount: 0, totalPlayers: total });
            };

            const origEnd = co.endCutscene.bind(co);
            co.endCutscene = () => {
                this.cutsceneReadyPlayers.clear();
                origEnd();
                this.net.send('CUTSCENE_END', {});
            };
        }
    }

    get remotePlayer() { return CoopPeerRoster.getRemotePlayer(this); }
    getRemotePlayer(peerId = null) { return CoopPeerRoster.getRemotePlayer(this, peerId); }
    getTotalPlayers() { return CoopPeerRoster.getTotalPlayers(this); }

    handleCutsceneAdvance(playerId) {
        const co = this.game.cutsceneOverlay;
        if (!co || !co.active || !co.promptAdvance) return;
        if (!this.cutsceneReadyPlayers) this.cutsceneReadyPlayers = new Set();
        if (this.cutsceneReadyPlayers.has(playerId)) return;

        this.cutsceneReadyPlayers.add(playerId);
        const total = this.getTotalPlayers();
        const readyCount = this.cutsceneReadyPlayers.size;

        if (readyCount >= total) {
            this.cutsceneReadyPlayers.clear();
            co.forceAdvance();
        } else {
            co.setReadyState(readyCount, total, this.cutsceneReadyPlayers.has('host'));
            this.net.send('CUTSCENE_READY_UPDATE', { readyCount, totalPlayers: total });
        }
    }

    setupNetworkHandlers() {
        this.net.onMessageCallback = (type, payload, senderId = null) => {
            const rp = this.getRemotePlayer(senderId);
            if (type === 'GUEST_STATE') {
                if (!rp) return;
                if (this.game.cutsceneOverlay && this.game.cutsceneOverlay.active && payload) {
                    const locked = { ...payload, isMoving: false };
                    delete locked.x; delete locked.y; delete locked.vx; delete locked.vy;
                    rp.setTargetState(locked);
                } else {
                    rp.setTargetState(payload);
                }
            } else if (type === 'NET_PAUSE') {
                this.onNetworkPause(payload);
            } else if (type === 'NET_RESUME_READY' || type === 'NET_RESUME') {
                this.onNetworkResumeReady(payload, senderId);
            } else if (type === 'GUEST_QUIT_MATCH') {
                this._handleGuestLeft(senderId, payload && payload.name);
            } else if (type === 'GUEST_SHOOT') {
                this.handleGuestShoot(payload, senderId);
                if (senderId && this.net.getPeerCount() > 1 && payload) {
                    this.net.broadcastExcept(senderId, 'HOST_SHOOT', { ...payload, fromId: senderId }, { droppable: true, maxBufferedBytes: 196608 });
                }
            } else if (type === 'GUEST_DASH') {
                if (rp && !rp.isDowned && !rp.isDownedDisconnected && this.game.effects) {
                    if (typeof this.game.effects.addDashTrail === 'function') {
                        this.game.effects.addDashTrail(rp.x, rp.y, rp.radius, rp.heroColor);
                    } else if (typeof this.game.effects.addDust === 'function') {
                        this.game.effects.addDust(rp.x, rp.y, 6, 8);
                    }
                }
                if (senderId && this.net.getPeerCount() > 1) {
                    this.net.broadcastExcept(senderId, 'HOST_DASH', { fromId: senderId });
                }
            } else if (type === 'GUEST_SKILL') {
                if (rp && !rp.isDowned && !rp.isDownedDisconnected && this.game.state === 'PLAYING') {
                    const ok = this.playRemoteSkill(rp, payload, true);
                    if (ok && senderId && this.net.getPeerCount() > 1 && payload) {
                        this.net.broadcastExcept(senderId, 'HOST_SKILL', { ...payload, fromId: senderId });
                    }
                }
            } else if (type === 'GUEST_ULT') {
                if (rp && !rp.isDowned && !rp.isDownedDisconnected && this.game.state === 'PLAYING' && typeof CoopSkillFx !== 'undefined') {
                    CoopSkillFx.playRemoteUlt(this.game, rp, payload, true);
                    if (senderId && this.net.getPeerCount() > 1 && payload) {
                        this.net.broadcastExcept(senderId, 'HOST_ULT', { ...payload, fromId: senderId });
                    }
                }
            } else if (type === 'GUEST_COLLECT_DROP') {
                this.handleGuestCollectDrop(payload, senderId);
            } else if (type === 'GUEST_CUTSCENE_ADVANCE' || type === 'GUEST_CUTSCENE_READY') {
                this.handleCutsceneAdvance(senderId || 'guest');
            } else if (type === 'HELIOS_BEAM' && typeof CoopCombatFx !== 'undefined') {
                CoopCombatFx.handleRemoteBeam(this, payload, true, senderId);
                if (senderId && this.net.getPeerCount() > 1 && payload) {
                    this.net.broadcastExcept(senderId, 'HELIOS_BEAM', { ...payload, fromId: senderId }, { droppable: true });
                }
            } else if (type === 'COOP_FX' && typeof CoopCombatFx !== 'undefined') {
                CoopCombatFx.handleRemoteFx(this, payload, senderId);
                if (senderId && this.net.getPeerCount() > 1 && payload) {
                    this.net.broadcastExcept(senderId, 'COOP_FX', { ...payload, fromId: senderId }, { droppable: true });
                }
            } else if (type === 'COOP_CHAT' && payload && this.game && this.game.ui && this.game.ui.hud) {
                const senderName = (rp && rp.name) || payload.name || 'Partner';
                this.game.ui.hud.receiveChatMessage(senderName, payload.text, rp, false);
                if (senderId && this.net.getPeerCount() > 1) {
                    this.net.broadcastExcept(senderId, 'COOP_CHAT', { ...payload, name: senderName, fromId: senderId });
                }
            } else if (type === 'DEV_COOP_CMD' && payload && typeof window !== 'undefined' && window.AdminCheats) {
                window.AdminCheats.handleRemoteCoopCmd(this.game, payload);
            } else if (type === 'GUEST_HEAL' && payload && rp) {
                const amt = Number(payload.amount);
                if (rp.hp > 0 && !rp.isDowned && !rp.isDownedDisconnected && Number.isFinite(amt) && amt > 0) {
                    const now = performance.now();
                    if (!rp._healWinStart || now - rp._healWinStart > 1000) { rp._healWinStart = now; rp._healWinAcc = 0; }
                    const room = Math.max(0, 120 - rp._healWinAcc);
                    const safeAmt = Math.min(amt, room, Math.max(10, (rp.maxHp || 100) * 0.5));
                    if (safeAmt > 0) { rp._healWinAcc += safeAmt; rp.hp = Math.min(rp.maxHp || 100, rp.hp + safeAmt); }
                }
            }
        };

        this.net.onDisconnectedCallback = (reason, peerId, leftUserData) => {
            this._handleGuestLeft(peerId, leftUserData && leftUserData.name);
        };
    }

    _handleGuestLeft(peerId = null, explicitName = null) {
        if (typeof CoopPauseSync !== 'undefined') CoopPauseSync.hostHandleGuestLeft(this, peerId, explicitName);
    }

    _awardSquadDrop(drop, collectorOrFlag = false, collectorPeerId = null) {
        if (typeof CoopDropSync !== 'undefined') CoopDropSync.awardSquadDrop(this, drop, collectorOrFlag, collectorPeerId);
    }

    handleGuestCollectDrop(payload, senderId = null) {
        if (typeof CoopDropSync !== 'undefined') CoopDropSync.handleGuestCollectDrop(this, payload, senderId);
    }

    handleGuestShoot(bData, senderId = null) {
        if (typeof CoopCombatFx !== 'undefined') CoopCombatFx.spawnRemoteBullet(this, bData, true, senderId);
    }

    update(dt) {
        const p1 = this.game.player;
        const rps = this.remotePlayers;

        // 1. Update all remote squadmates & active remote Ult FX/ticks
        for (let i = 0; i < rps.length; i++) {
            const rp = rps[i];
            if (!rp) continue;
            rp.update(dt);
            if (typeof CoopSkillFx !== 'undefined' && typeof CoopSkillFx.updateRemoteUlt === 'function') {
                CoopSkillFx.updateRemoteUlt(this.game, rp, dt, true, this.net);
            }
        }

        // 2. Intelligent Enemy Target Distribution across all alive squad members
        for (let i = 0; i < this.game.enemies.length; i++) {
            const enemy = this.game.enemies[i];
            if (!enemy || enemy.dead) continue;
            if (!enemy._netId) enemy._netId = this.netIdCounter++;
            enemy.coopTarget = CoopPeerRoster.pickClosestAliveTarget(this, enemy, p1);
        }

        // 3. Check Co-op Revive on Wave Clear & Squad KO
        CoopPeerRoster.handleWaveClearRevives(this);

        if (CoopPeerRoster.areAllPlayersDowned(this) && this.game.state === 'PLAYING') {
            this.broadcastSnapshot();
            if (this.net && this.net.connected) {
                this.net.send('COOP_GAME_OVER', { wave: this.game.waveManager ? this.game.waveManager.wave : 1 });
            }
            this.game.gameOver();
            return;
        }

        // 5. Broadcast State Snapshot to Guest (adaptively throttle under heavy wave/drop/cellular load)
        const effInterval = (typeof CoopSnapshotSync !== 'undefined')
            ? CoopSnapshotSync.getAdaptiveInterval(this)
            : (((this.game.enemies ? this.game.enemies.length : 0) + (this.game.drops ? this.game.drops.length : 0) > 80 || (this.net && this.net.latency > 110)) ? 3 : this.snapshotInterval);
        this.snapshotTimer++;
        if (this.snapshotTimer >= effInterval) {
            this.snapshotTimer = 0;
            this.broadcastSnapshot();
        }
    }

    broadcastSnapshot() {
        const p = this.game.player;
        const wm = this.game.waveManager;
        this._snapshotSeq = (this._snapshotSeq || 0) + 1;

        const safeInt = (v, min = -2000000, max = 2000000, fallback = 0) => {
            if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
            const rounded = Math.round(v);
            return Math.max(min, Math.min(max, rounded));
        };
        const safeFloat = (v, decimals = 2, fallback = 0) => {
            if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
            return Number(v.toFixed(decimals));
        };

        // Collect enemies (compact delta-metadata payload with predictive velocities)
        const enemiesPayload = (typeof CoopSnapshotSync !== 'undefined')
            ? CoopSnapshotSync.buildCompactEnemies(this, this._snapshotSeq)
            : (() => {
                const list = [];
                for (let i = 0; i < this.game.enemies.length; i++) {
                    const e = this.game.enemies[i];
                    if (!e || e.dead) continue;
                    if (!e._netId) e._netId = this.netIdCounter++;
                    list.push({
                        id: safeInt(e._netId, 1, 2000000000, 1),
                        t: (typeof e.type === 'string' && e.type) ? e.type : 'fatmir',
                        st: e.subType || '', x: safeInt(e.x), y: safeInt(e.y),
                        vx: safeFloat(e.vx, 2, 0), vy: safeFloat(e.vy, 2, 0),
                        hp: safeInt(e.hp, 0, 100000000, 1), mhp: safeInt(e.maxHp || e.hp, 1, 100000000, 100),
                        r: safeInt(e.radius, 5, 500, 24), a: safeFloat(e.angle, 2, 0),
                        hf: (e.hitFlash > 0) ? 1 : 0, b: e.isBoss ? 1 : (e.isMiniBoss ? 2 : 0),
                        fly: e.isFlying ? 1 : 0, n: e.name || ''
                    });
                }
                return list;
            })();

        // Collect drops (prioritize special pickups/magnetized gems & cap to keep packets lightweight on late waves)
        const dropsPayload = [];
        const xpDrops = [];
        for (let i = 0; i < this.game.drops.length; i++) {
            const d = this.game.drops[i];
            if (!d || d.dead) continue;
            if (!d._netId) d._netId = this.netIdCounter++;
            const entry = {
                id: safeInt(d._netId, 1, 2000000000, 1),
                t: (typeof d.type === 'string' && d.type) ? d.type : 'xp',
                x: safeInt(d.x),
                y: safeInt(d.y),
                v: safeInt(d.value, 1, 1000, 1),
                m: (d._magTarget === 'host') ? 1 : (d._magTarget ? 2 : 0)
            };
            if (entry.t !== 'xp' || entry.m > 0) {
                if (dropsPayload.length < 90) dropsPayload.push(entry);
            } else {
                let minSq = (d.x - p.x) ** 2 + (d.y - p.y) ** 2;
                for (let j = 0; j < this.remotePlayers.length; j++) {
                    const rp = this.remotePlayers[j];
                    if (rp) minSq = Math.min(minSq, (d.x - rp.x) ** 2 + (d.y - rp.y) ** 2);
                }
                entry._dSq = minSq;
                xpDrops.push(entry);
            }
        }
        const xpSlots = Math.max(0, 90 - dropsPayload.length);
        if (xpDrops.length > xpSlots) xpDrops.sort((a, b) => a._dSq - b._dSq);
        for (let i = 0; i < Math.min(xpSlots, xpDrops.length); i++) {
            delete xpDrops[i]._dSq;
            dropsPayload.push(xpDrops[i]);
        }

        // Collect enemy bullets (soccer balls, police shots, boss projectiles) with stable IDs & velocities
        const enemyBulletsPayload = [];
        for (let i = 0; i < this.game.bullets.length && enemyBulletsPayload.length < 80; i++) {
            const b = this.game.bullets[i];
            if (!b || b.dead || !b.isEnemy) continue;
            if (!b._netId) b._netId = this.netIdCounter++;
            enemyBulletsPayload.push({
                id: safeInt(b._netId, 1, 2000000000, 1),
                x: safeInt(b.x),
                y: safeInt(b.y),
                vx: safeFloat(b.vx, 2, 0),
                vy: safeFloat(b.vy, 2, 0),
                r: safeInt(b.radius, 2, 100, 10),
                t: (typeof b.type === 'string' && b.type) ? b.type : 'soccer'
            });
        }

        const obsSet = this.game.arena && this.game.arena.destroyedObsIds;
        this._obsSyncTick = ((this._obsSyncTick || 0) + 1) % 20;
        const deadObsArray = (obsSet && (obsSet.size !== (this._lastObsCount || 0) || this._obsSyncTick === 0))
            ? (this._lastObsCount = obsSet.size, Array.from(obsSet))
            : null;

        const snapshot = {
            seq: this._snapshotSeq,
            mapSeed: safeInt(this.mapSeed, 1, 2000000000, 123456),
            deadObs: deadObsArray,
            bWarn: (this.game.bossWarningOverlay && this.game.bossWarningOverlay.active) ? (this.game.bossWarningOverlay.bossName || 'KLEANTHIS THE REBETIS') : '',
            bWarnRank: (this.game.bossWarningOverlay && this.game.bossWarningOverlay.active) ? (this.game.bossWarningOverlay.rankName || '') : '',
            cutscene: (this.game.cutsceneOverlay && this.game.cutsceneOverlay.active) ? {
                sub: this.game.cutsceneOverlay.subText || '',
                spk: this.game.cutsceneOverlay.speaker || '',
                txt: this.game.cutsceneOverlay.dialogueText || '',
                col: this.game.cutsceneOverlay.speakerColor || '#fed330',
                ico: this.game.cutsceneOverlay.avatarIcon || '💬',
                adv: !!this.game.cutsceneOverlay.promptAdvance,
                ae: !!this.game.cutsceneOverlay.allowEndless,
                rc: this.cutsceneReadyPlayers ? this.cutsceneReadyPlayers.size : 0,
                tp: this.getTotalPlayers()
            } : null,
            lx: (typeof LilXasEvent !== 'undefined' && typeof LilXasEvent.getCoopSnapshot === 'function') ? LilXasEvent.getCoopSnapshot() : null,
            wave: safeInt(wm ? wm.wave : 1, 1, 999, 1),
            wState: (wm && wm.waveState) ? wm.waveState : 'IN_PROGRESS',
            wTotal: safeInt(wm ? wm.waveTotalEnemies : 0, 0, 999, 0),
            wKilled: safeInt(wm ? wm.waveEnemiesKilled : 0, 0, 999, 0),
            ...(this.game && this.game.isEndlessHard && typeof EndlessHardMap !== 'undefined' ? { ehS: EndlessHardMap.getNetStrikes() } : {}),
            host: {
                name: (this.net && this.net.localUserData && this.net.localUserData.name) || p.name,
                x: safeInt(p.x),
                y: safeInt(p.y),
                vx: safeFloat(p.vx, 2, 0),
                vy: safeFloat(p.vy, 2, 0),
                angle: safeFloat(p.angle, 2, 0),
                hp: safeInt(p.hp, 0, 100000, 0),
                maxHp: safeInt(p.maxHp, 1, 100000, 100),
                isMoving: !!p.isMoving,
                shieldActive: !!p.shieldActive,
                isDashing: !!p.isDashing,
                isGrabbed: !!p.isGrabbed,
                isAirborne: !!p.isAirborne,
                airZ: safeInt(p.airZ || 0, 0, 400, 0),
                airRot: safeFloat(p.airRotation || 0, 2, 0),
                heroType: p.heroType,
                weaponType: p.weaponType,
                equippedArmorId: p.equippedArmorId || null,
                armorEvolved: !!p.armorEvolved,
                weaponEvolved: !!p.weaponEvolved,
                heroSkin: p.heroSkin || 'default',
                starBlessed: !!p._starBlessed,
                ultId: p.ultActive ? (p.ultId || '') : '',
                vfAng: p.vf185Active ? safeFloat(p.vf185Angle || p.angle || 0, 2, 0) : undefined,
                bubbleCharge: p.isChargingBubble ? Number((p.bubbleCharge || 0).toFixed(2)) : 0
            },
            guestHp: this.remotePlayer ? safeInt(this.remotePlayer.hp, 0, 100000, 0) : 0,
            guestMaxHp: this.remotePlayer ? safeInt(this.remotePlayer.maxHp, 25, 100000, 100) : 100,
            peers: CoopPeerRoster.buildHostPeersPayload(this, safeInt, safeFloat),
            sq: {
                sc: safeInt(p.score, 0, 200000000, 0),
                kl: safeInt(p.kills, 0, 1000000, 0),
                fk: safeInt(p.fatmirKills, 0, 1000000, 0),
                ck: safeInt(p.casillasKills, 0, 1000000, 0),
                sk: safeInt(p.skarmogyftosKills, 0, 1000000, 0),
                kln: safeInt(p.kleanthisKills, 0, 1000, 0),
                kil: safeInt(p.kiloumpasKills, 0, 1000, 0),
                rf: safeInt(p.roufKills, 0, 1000, 0),
                eb: safeInt(p.endlessBossGoldBonus, 0, 1000000, 0),
                ex: safeInt(p.endlessBossXpBonus, 0, 1000000, 0)
            },
            enemies: enemiesPayload,
            drops: dropsPayload,
            enemyBullets: enemyBulletsPayload
        };

        this.net.send('HOST_SNAPSHOT', snapshot, { droppable: true, fast: true });
    }

    playRemoteSkill(remotePlayer, skillData = {}, isHostAuthoritative = true) {
        if (isHostAuthoritative && remotePlayer) {
            const sid = typeof skillData.skillId === 'string' ? skillData.skillId : 'blade_rush';
            const lvl = Math.max(1, Math.min(5, Math.round(Number(skillData.level) || 1)));
            const cdSec = (typeof PlayerSkills !== 'undefined') ? PlayerSkills.getEffectiveCooldown(sid, lvl) : 7.0;
            const minGapMs = Math.max(2500, cdSec * 720);
            const now = performance.now();
            if (now - (remotePlayer._lastSkillTime || 0) < minGapMs) return false;
            remotePlayer._lastSkillTime = now;
        }
        if (typeof CoopSkillFx !== 'undefined') {
            CoopSkillFx.playRemoteSkill(this.game, remotePlayer, skillData, isHostAuthoritative);
        }
        return true;
    }

    syncKiloumpasEvent(action, boss, targetPlayer, extra = {}) {
        if (!this.net || !this.net.connected) return;
        const isHostTarget = (targetPlayer === this.game.player);
        const targetId = isHostTarget ? 'host' : (targetPlayer && targetPlayer.peerId);
        if (!targetId) return;
        this.net.send('KILOUMPAS_GRAB', {
            action,
            target: targetId,
            x: Number.isFinite(extra.x) ? extra.x : Math.round(targetPlayer.x),
            y: Number.isFinite(extra.y) ? extra.y : Math.round(targetPlayer.y),
            airZ: Number.isFinite(extra.airZ) ? extra.airZ : 0,
            vx: extra.vx || 0,
            vy: extra.vy || 0,
            vz: extra.vz || 17.5,
            bx: Number.isFinite(extra.bx) ? extra.bx : undefined,
            by: Number.isFinite(extra.by) ? extra.by : undefined
        });
    }

    syncBossCrate(crateId, bossName) {
        if (crateId && this.net) this.net.send('BOSS_CRATE_REWARD', { crateId, bossName });
    }

    syncStoryVictory(crestAwarded = false) {
        if (this.net) {
            this.net.send('STORY_VICTORY', {
                crestAwarded: !!crestAwarded,
                wave: (this.game.waveManager && this.game.waveManager.wave) || 20,
                gameTime: this.game.gameTime || 0
            });
        }
    }

    getPauseUIState(fallbackBy = null) {
        const total = this.getTotalPlayers();
        return {
            by: this.pausedByName || fallbackBy || 'Hero',
            readyCount: this.pauseReadyPlayers.size,
            totalPlayers: total,
            localReady: this.pauseReadyPlayers.has('host'),
            resuming: this._pauseResuming
        };
    }

    sendPause(playerName) { if (typeof CoopPauseSync !== 'undefined') CoopPauseSync.hostSendPause(this, playerName); }
    onNetworkPause(payload) { if (typeof CoopPauseSync !== 'undefined') CoopPauseSync.hostOnNetworkPause(this, payload); }

    requestToggleResumeReady() {
        if (this.game.state !== 'PAUSED' || this._pauseResuming) return;
        if (this.pauseReadyPlayers.has('host')) this.pauseReadyPlayers.delete('host');
        else this.pauseReadyPlayers.add('host');
        if (typeof CoopPauseSync !== 'undefined') CoopPauseSync.hostEvaluatePause(this);
    }

    onNetworkResumeReady(payload, senderId = null) {
        if (this.game.state !== 'PAUSED' || this._pauseResuming) return;
        const pid = senderId || 'guest';
        if (payload && payload.ready === false) this.pauseReadyPlayers.delete(pid);
        else this.pauseReadyPlayers.add(pid);
        if (typeof CoopPauseSync !== 'undefined') CoopPauseSync.hostEvaluatePause(this);
    }

    sendResume() { this.requestToggleResumeReady(); }

    abortMatch() {
        this._peerLeftNotified = true;
        if (this._resumeTimer) { clearTimeout(this._resumeTimer); this._resumeTimer = null; }
        const hostName = (this.game && this.game.player && this.game.player.name) || 'Host';
        if (this.net && typeof this.net.disconnectGracefully === 'function') {
            this.net.disconnectGracefully('Host left the match', null, 'HOST_QUIT_MATCH', { reason: 'host_left', name: hostName });
        } else if (this.net) {
            try { this.net.send('HOST_QUIT_MATCH', { reason: 'host_left', name: hostName }); } catch (e) { }
            setTimeout(() => { if (this.net) this.net.disconnect(); }, 100);
        }
    }

    updateDrops(dt) {
        if (typeof CoopDropSync !== 'undefined') CoopDropSync.updateHostDrops(this, dt);
    }

    render(ctx, camera) {
        for (let i = 0; i < this.remotePlayers.length; i++) {
            const rp = this.remotePlayers[i];
            if (!rp || rp.isDownedDisconnected) continue;
            rp.draw(ctx);
            rp.drawRadarIndicator(ctx, this.game.player, camera);
        }
        RemotePlayer.drawLocalDownedBanner(ctx, this.game.player);
    }
}

if (typeof window !== 'undefined') {
    window.CoopHostSession = CoopHostSession;
}
