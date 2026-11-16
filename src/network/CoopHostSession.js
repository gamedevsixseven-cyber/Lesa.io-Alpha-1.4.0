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

        const name = (guestInfo && guestInfo.name) || 'Player 2';
        const heroType = (guestInfo && guestInfo.heroType) || 'petros';
        this.remotePlayer = new RemotePlayer(game.player.x + 60, game.player.y, heroType, name);
        this.remotePlayer.isHost = false;

        this.netIdCounter = 1;
        this.snapshotTimer = 0;
        this.snapshotInterval = 2; // Every 2 frames (~30Hz at 60fps) for crisp responsiveness

        this.setupNetworkHandlers();
        this.hookHostInput();
    }

    hookHostInput() {
        const origShoot = this.game.player.shoot.bind(this.game.player);
        this.game.player.shoot = (effects) => {
            if (this.game.player.hp <= 0) return null;
            const bullets = origShoot(effects);
            if (bullets && bullets.length > 0) {
                for (let i = 0; i < bullets.length; i++) {
                    const b = bullets[i];
                    this.net.send('HOST_SHOOT', {
                        x: Math.round(b.x),
                        y: Math.round(b.y),
                        vx: Number((b.vx || 0).toFixed(2)),
                        vy: Number((b.vy || 0).toFixed(2)),
                        damage: b.damage || 25,
                        speed: b.speed || 14,
                        radius: b.radius || 7,
                        type: b.type || 'pea',
                        pierce: b.pierce || 1,
                        maxBounces: b.maxBounces || 0,
                        isChargedBubble: !!b.isChargedBubble
                    });
                }
            }
            return bullets;
        };

        const origDash = this.game.player.dash.bind(this.game.player);
        this.game.player.dash = (effects) => {
            origDash(effects);
            this.net.send('HOST_DASH', {});
        };

        const origSkill = this.game.player.useSkill.bind(this.game.player);
        this.game.player.useSkill = (enemies, effects, camera, game) => {
            const p = this.game.player;
            const skillId = p.selectedSkill || 'blade_rush';
            const level = (typeof PlayerSkills !== 'undefined') ? PlayerSkills.getSkillLevel(skillId) : 1;
            origSkill(enemies, effects, camera, game);
            this.net.send('HOST_SKILL', {
                skillId: skillId,
                level: level,
                x: Math.round(p.x),
                y: Math.round(p.y),
                angle: Number((p.angle || 0).toFixed(2))
            });
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
            co.startCutscene = (cutsceneId) => {
                this.cutsceneReadyPlayers.clear();
                origCutscene(cutsceneId);
                const positions = (typeof CinematicCutsceneOverlay !== 'undefined' && typeof CinematicCutsceneOverlay.positionCoopSquad === 'function')
                    ? CinematicCutsceneOverlay.positionCoopSquad(this.game, this)
                    : [];
                this.net.send('CUTSCENE_TRIGGER', { cutsceneId, positions });
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

    getTotalPlayers() {
        return (this.net && this.remotePlayer && !this.remotePlayer.isDownedDisconnected) ? 2 : 1;
    }

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
        this.net.onMessageCallback = (type, payload) => {
            if (type === 'GUEST_STATE') {
                this.remotePlayer.setTargetState(payload);
            } else if (type === 'NET_PAUSE') {
                this.game.pauseGame(payload.by, true);
            } else if (type === 'NET_RESUME') {
                this.game.resumeGame(true);
            } else if (type === 'GUEST_SHOOT') {
                this.handleGuestShoot(payload);
            } else if (type === 'GUEST_DASH') {
                if (this.game.effects) {
                    if (typeof this.game.effects.addDashTrail === 'function') {
                        this.game.effects.addDashTrail(this.remotePlayer.x, this.remotePlayer.y, this.remotePlayer.radius, this.remotePlayer.heroColor);
                    } else if (typeof this.game.effects.addDust === 'function') {
                        this.game.effects.addDust(this.remotePlayer.x, this.remotePlayer.y, 6, 8);
                    }
                }
            } else if (type === 'GUEST_SKILL') {
                this.playRemoteSkill(this.remotePlayer, payload, true);
            } else if (type === 'GUEST_COLLECT_DROP') {
                this.handleGuestCollectDrop(payload);
            } else if (type === 'GUEST_CUTSCENE_ADVANCE' || type === 'GUEST_CUTSCENE_READY') {
                this.handleCutsceneAdvance('guest');
            }
        };

        this.net.onDisconnectedCallback = (reason) => {
            if (this.game.ui) {
                this.game.ui.addKillfeed(`⚠️ ${this.remotePlayer.name} left the match. Continuing solo...`);
            }
            this.remotePlayer.hp = 0;
            this.remotePlayer.isDowned = true;
            this.remotePlayer.isDownedDisconnected = true;
            if (this.game.cutsceneOverlay) {
                this.game.cutsceneOverlay.totalPlayers = 1;
                this.game.cutsceneOverlay.setReadyState(0, 1, false);
                if (this.cutsceneReadyPlayers && this.cutsceneReadyPlayers.has('host')) {
                    this.game.cutsceneOverlay.forceAdvance();
                }
            }
            this.game.coopSession = null;
        };
    }

    handleGuestCollectDrop(payload) {
        if (!payload || typeof payload.id !== 'number') return;
        for (let i = 0; i < this.game.drops.length; i++) {
            const d = this.game.drops[i];
            if (d && d._netId === payload.id) {
                d.dead = true;
                if (payload.type === 'magnet' && typeof this.game.vacuumAllXP === 'function') {
                    this.game.vacuumAllXP();
                } else if (payload.type === 'chrono_core' && this.game.player) {
                    if (typeof WaveSkipperMachine !== 'undefined' && typeof WaveSkipperMachine.grantChronoCore === 'function') {
                        WaveSkipperMachine.grantChronoCore(this.game.player, d.value || 1, this.game.effects, d.x, d.y, this.game);
                    } else {
                        this.game.player.chronoCores = (this.game.player.chronoCores || 0) + (d.value || 1);
                    }
                }
                break;
            }
        }
    }

    handleGuestShoot(bData) {
        if (!bData || this.remotePlayer.isDowned || (this.game && this.game.isCutsceneActive && this.game.isCutsceneActive())) return;
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

        // Latency compensation: advance bullet by one-way network flight time
        const latencyMs = (this.net && this.net.latency) ? this.net.latency : 25;
        const lagFrames = Math.min(6, Math.max(1, Math.round(latencyMs / 16.666)));
        bullet.x += bullet.vx * lagFrames;
        bullet.y += bullet.vy * lagFrames;

        this.game.bullets.push(bullet);

        if (window.soundEngine && typeof window.soundEngine.playShoot === 'function') {
            window.soundEngine.playShoot(bData.type || 'pea');
        }
    }

    update(dt) {
        const p1 = this.game.player;
        const p2 = this.remotePlayer;

        // 1. Update remote partner interpolation
        p2.update(dt);

        // 1.5. Check drops collected by remote guest player on host
        if (p2 && !p2.isDowned) {
            for (let i = 0; i < this.game.drops.length; i++) {
                const drop = this.game.drops[i];
                if (!drop || drop.dead) continue;
                const dist = Math.hypot(p2.x - drop.x, p2.y - drop.y);
                if (dist < p2.radius + drop.radius) {
                    drop.dead = true;
                    if (drop.type === 'heart') {
                        p2.hp = Math.min(p2.maxHp, p2.hp + (drop.value || 30));
                        if (this.game.effects) {
                            this.game.effects.addComicSplash(p2.x, p2.y - 25, '+30 HP 💚');
                        }
                    } else if (drop.type === 'magnet' && typeof this.game.vacuumAllXP === 'function') {
                        this.game.vacuumAllXP();
                    } else if (drop.type === 'chrono_core' && p1) {
                        if (typeof WaveSkipperMachine !== 'undefined' && typeof WaveSkipperMachine.grantChronoCore === 'function') {
                            WaveSkipperMachine.grantChronoCore(p1, drop.value || 1, this.game.effects, drop.x, drop.y, this.game);
                        } else {
                            p1.chronoCores = (p1.chronoCores || 0) + (drop.value || 1);
                        }
                    } else if (typeof Drop !== 'undefined' && Drop.MATERIAL_DROP_MAP && Drop.MATERIAL_DROP_MAP[drop.type]) {
                        const matId = Drop.MATERIAL_DROP_MAP[drop.type];
                        const gain = Math.max(1, Math.floor(drop.value || 1));
                        if (typeof window !== 'undefined' && window.inventoryManager && typeof window.inventoryManager.awardBattleMaterials === 'function') {
                            window.inventoryManager.awardBattleMaterials({ [matId]: gain }, {
                                game: this.game,
                                x: drop.x,
                                y: drop.y,
                                source: 'arena_drop'
                            });
                        }
                    }
                }
            }
        }

        // 2. Intelligent Enemy Target Distribution
        // Assign each enemy's target to the closer of (local host player vs remote guest player)
        for (let i = 0; i < this.game.enemies.length; i++) {
            const enemy = this.game.enemies[i];
            if (!enemy || enemy.dead) continue;

            // Ensure enemy has a unique network ID
            if (!enemy._netId) {
                enemy._netId = this.netIdCounter++;
            }

            // If partner is downed, target host; if host is downed, target partner
            let targetPlayer = p1;
            if (p1.hp <= 0) {
                targetPlayer = p2;
            } else if (p2.isDowned) {
                targetPlayer = p1;
            } else {
                const dist1 = (enemy.x - p1.x) ** 2 + (enemy.y - p1.y) ** 2;
                const dist2 = (enemy.x - p2.x) ** 2 + (enemy.y - p2.y) ** 2;
                targetPlayer = (dist1 <= dist2) ? p1 : p2;
            }
            enemy.coopTarget = targetPlayer;
        }

        // 3. Check Co-op Revive on Wave Clear
        if (this.game.waveState === 'WAVE_CLEARED') {
            if (this.remotePlayer.isDowned) {
                this.remotePlayer.hp = Math.round(this.remotePlayer.maxHp * 0.5);
                this.remotePlayer.isDowned = false;
                if (this.game.ui) this.game.ui.addKillfeed(`🤝 ${this.remotePlayer.name} REVIVED!`);
            }
            if (p1.hp <= 0 && !this.remotePlayer.isDowned) {
                p1.hp = Math.round(p1.maxHp * 0.5);
                if (this.game.ui) this.game.ui.addKillfeed(`🤝 YOU WERE REVIVED!`);
            }
        }

        // 4. Check Double KO (Only triggers game over when BOTH players fall)
        if (p1.hp <= 0 && this.remotePlayer.isDowned && this.game.state === 'PLAYING') {
            this.game.gameOver();
            return;
        }

        // 5. Broadcast State Snapshot to Guest
        this.snapshotTimer++;
        if (this.snapshotTimer >= this.snapshotInterval) {
            this.snapshotTimer = 0;
            this.broadcastSnapshot();
        }
    }

    broadcastSnapshot() {
        const p = this.game.player;
        const wm = this.game.waveManager;

        const safeInt = (v, min = -2000000, max = 2000000, fallback = 0) => {
            if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
            const rounded = Math.round(v);
            return Math.max(min, Math.min(max, rounded));
        };
        const safeFloat = (v, decimals = 2, fallback = 0) => {
            if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
            return Number(v.toFixed(decimals));
        };

        // Collect enemies (compact payload with predictive velocities)
        const enemiesPayload = [];
        for (let i = 0; i < this.game.enemies.length; i++) {
            const e = this.game.enemies[i];
            if (!e || e.dead) continue;
            if (!e._netId) e._netId = this.netIdCounter++;
            enemiesPayload.push({
                id: safeInt(e._netId, 1, 2000000000, 1),
                t: (typeof e.type === 'string' && e.type) ? e.type : 'fatmir',
                st: e.subType || '',
                x: safeInt(e.x),
                y: safeInt(e.y),
                vx: safeFloat(e.vx, 2, 0),
                vy: safeFloat(e.vy, 2, 0),
                hp: safeInt(e.hp, 0, 1000000, 1),
                mhp: safeInt(e.maxHp || e.hp, 1, 1000000, 100),
                r: safeInt(e.radius, 5, 500, 24),
                a: safeFloat(e.angle, 2, 0),
                hf: (e.hitFlash > 0) ? 1 : 0,
                b: e.isBoss ? 1 : (e.isMiniBoss ? 2 : 0),
                fly: e.isFlying ? 1 : 0,
                n: e.name || ''
            });
        }

        // Collect drops
        const dropsPayload = [];
        for (let i = 0; i < this.game.drops.length; i++) {
            const d = this.game.drops[i];
            if (!d || d.dead) continue;
            if (!d._netId) d._netId = this.netIdCounter++;
            dropsPayload.push({
                id: safeInt(d._netId, 1, 2000000000, 1),
                t: (typeof d.type === 'string' && d.type) ? d.type : 'xp',
                x: safeInt(d.x),
                y: safeInt(d.y),
                v: safeInt(d.value, 1, 1000, 1)
            });
        }

        // Collect enemy bullets (soccer balls, police shots, boss projectiles) with stable IDs & velocities
        const enemyBulletsPayload = [];
        for (let i = 0; i < this.game.bullets.length; i++) {
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

        const deadObsArray = (this.game.arena && this.game.arena.destroyedObsIds)
            ? Array.from(this.game.arena.destroyedObsIds)
            : [];

        const snapshot = {
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
                rc: this.cutsceneReadyPlayers ? this.cutsceneReadyPlayers.size : 0,
                tp: this.getTotalPlayers()
            } : null,
            wave: safeInt(wm ? wm.wave : 1, 1, 999, 1),
            wState: (wm && wm.waveState) ? wm.waveState : 'IN_PROGRESS',
            wTotal: safeInt(wm ? wm.waveTotalEnemies : 0, 0, 999, 0),
            wKilled: safeInt(wm ? wm.waveEnemiesKilled : 0, 0, 999, 0),
            host: {
                x: safeInt(p.x),
                y: safeInt(p.y),
                vx: safeFloat(p.vx, 2, 0),
                vy: safeFloat(p.vy, 2, 0),
                angle: safeFloat(p.angle, 2, 0),
                hp: safeInt(p.hp, 0, 100000, 0),
                maxHp: safeInt(p.maxHp, 1, 100000, 100),
                isMoving: !!p.isMoving,
                shieldActive: !!p.shieldActive,
                isDashing: !!p.isDashing
            },
            guestHp: safeInt(this.remotePlayer.hp, 0, 100000, 0),
            enemies: enemiesPayload,
            drops: dropsPayload,
            enemyBullets: enemyBulletsPayload
        };

        this.net.send('HOST_SNAPSHOT', snapshot);
    }

    playRemoteSkill(remotePlayer, skillData = {}, isHostAuthoritative = true) {
        if (typeof CoopSkillFx !== 'undefined') {
            CoopSkillFx.playRemoteSkill(this.game, remotePlayer, skillData, isHostAuthoritative);
        }
    }

    sendPause(playerName) { this.net.send('NET_PAUSE', { by: playerName }); }
    sendResume() { this.net.send('NET_RESUME', {}); }
    abortMatch() {
        if (this.net && typeof this.net.disconnectGracefully === 'function') {
            this.net.disconnectGracefully('Host left the match');
        } else if (this.net) {
            try { this.net.send('HOST_QUIT_MATCH', { reason: 'host_left' }); } catch (e) {}
            setTimeout(() => { if (this.net) this.net.disconnect(); }, 100);
        }
    }

    render(ctx, camera) {
        this.remotePlayer.draw(ctx);
        this.remotePlayer.drawRadarIndicator(ctx, this.game.player, camera);
    }
}

if (typeof window !== 'undefined') {
    window.CoopHostSession = CoopHostSession;
}
