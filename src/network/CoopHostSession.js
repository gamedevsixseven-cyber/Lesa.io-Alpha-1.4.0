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
        this.snapshotInterval = 3; // Every 3 frames (~20Hz at 60fps)

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
            this.game.bossWarningOverlay.trigger = (bossName) => {
                origBossTrigger(bossName);
                this.net.send('BOSS_TRIGGER', { bossName: bossName || 'KLEANTHIS THE REBETIS' });
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

        // Collect enemies (compact payload)
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
                hp: safeInt(e.hp, 0, 1000000, 1),
                mhp: safeInt(e.maxHp || e.hp, 1, 1000000, 100),
                r: safeInt(e.radius, 5, 500, 24),
                a: safeFloat(e.angle, 2, 0),
                hf: (e.hitFlash > 0) ? 1 : 0,
                b: e.isBoss ? 1 : (e.isMiniBoss ? 2 : 0),
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

        // Collect enemy bullets (soccer balls, police shots, boss projectiles)
        const enemyBulletsPayload = [];
        for (let i = 0; i < this.game.bullets.length; i++) {
            const b = this.game.bullets[i];
            if (!b || b.dead || !b.isEnemy) continue;
            enemyBulletsPayload.push({
                x: safeInt(b.x),
                y: safeInt(b.y),
                vx: safeFloat(b.vx, 1, 0),
                vy: safeFloat(b.vy, 1, 0),
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

    playRemoteSkill(remotePlayer, skillData = {}, isHostAuthoritative = false) {
        if (!remotePlayer) return;
        const skillId = skillData.skillId || 'blade_rush';
        const level = skillData.level || 1;
        const x = Number.isFinite(skillData.x) ? skillData.x : remotePlayer.x;
        const y = Number.isFinite(skillData.y) ? skillData.y : remotePlayer.y;
        const angle = Number.isFinite(skillData.angle) ? skillData.angle : (remotePlayer.angle || 0);
        const fx = this.game.effects;
        const cam = this.game.camera;
        const se = window.soundEngine;

        if (skillId === 'seismic_quake') {
            const radius = 160 + (level - 1) * 15;
            if (fx) {
                fx.addComicSplash(x, y - 35, level >= 4 ? 'TITAN QUAKE! 💥' : 'QUAKE! 🪨');
                if (typeof fx.addGroundCrack === 'function') fx.addGroundCrack(x, y, radius * 1.05, '#1e272e', level >= 4 ? '#f39c12' : '#3498db', 140);
                fx.addShockwave(x, y, radius, 'rgba(52, 152, 219, 0.85)');
                fx.addShockwave(x, y, radius * 0.65, 'rgba(41, 128, 185, 0.95)');
                fx.addDust(x, y, 14, 20);
                fx.addSparks(x, y, '#3498db', 16);
            }
            if (cam && typeof cam.addShake === 'function') cam.addShake(12);
            if (se) {
                if (typeof se.playNoiseCrack === 'function') se.playNoiseCrack(0, 0.2, 0.5);
                if (typeof se.playFatmirSlam === 'function') se.playFatmirSlam();
            }
            if (isHostAuthoritative && this.game.enemies) {
                const baseDamage = 140 + (level - 1) * 30;
                const stunSec = 2.0 + (level - 1) * 0.25;
                for (let i = 0; i < this.game.enemies.length; i++) {
                    const e = this.game.enemies[i];
                    if (e.dead) continue;
                    const dx = e.x - x, dy = e.y - y;
                    const maxR = radius + e.radius;
                    if (dx * dx + dy * dy <= maxR * maxR) {
                        const dist = Math.max(1, Math.hypot(dx, dy));
                        e.x += (dx / dist) * 18;
                        e.y += (dy / dist) * 18;
                        e.takeDamage(baseDamage, fx, true);
                        if (typeof e.applyStun === 'function') e.applyStun(stunSec, fx);
                        else e.stunTimer = Math.round(stunSec * 60);
                        if (e.isCharging) { e.isCharging = false; e.chargeWindup = 0; }
                    }
                }
            }
        } else if (skillId === 'yaya_scream') {
            const range = 240 + (level - 1) * 20;
            const shouts = ['ΕΛΑ ΕΔΩΩΩ! 📢', 'ΑΜΑΝ! 📢', 'ΣΤΑΜΑΤΑ! 📢', 'ΠΑΝΑΓΙΑ ΜΟΥ! 📢', 'ΞΥΛΟ ΠΟΥ ΘΑ ΦΑΣ! 📢'];
            const shout = shouts[Math.floor(Math.random() * shouts.length)];
            if (fx) {
                fx.addComicSplash(x + Math.cos(angle) * 50, y + Math.sin(angle) * 50 - 25, shout);
                fx.addSlash(x, y, angle, range * 0.8, '#9b59b6');
                fx.addShockwave(x + Math.cos(angle) * (range * 0.45), y + Math.sin(angle) * (range * 0.45), range * 0.55, 'rgba(155, 89, 182, 0.85)');
                fx.addSparks(x, y, '#9b59b6', 12);
            }
            if (cam && typeof cam.addShake === 'function') cam.addShake(9);
            if (se && typeof se.playBossWarning === 'function') se.playBossWarning();
            if (isHostAuthoritative) {
                if (this.game.bullets) {
                    for (let b = 0; b < this.game.bullets.length; b++) {
                        const bullet = this.game.bullets[b];
                        if (!bullet || bullet.dead || !bullet.isEnemy) continue;
                        const bdx = bullet.x - x, bdy = bullet.y - y;
                        if (Math.hypot(bdx, bdy) <= range) {
                            let diff = Math.abs(Math.atan2(bdy, bdx) - angle);
                            while (diff > Math.PI) diff -= Math.PI * 2;
                            if (Math.abs(diff) <= Math.PI * 0.55) {
                                bullet.dead = true;
                                if (fx) { fx.addSparks(bullet.x, bullet.y, '#9b59b6', 5); fx.addComicSplash(bullet.x, bullet.y - 15, 'CLANG!'); }
                            }
                        }
                    }
                }
                if (this.game.enemies) {
                    const fearSec = 3.0 + (level - 1) * 0.3;
                    const baseDamage = 110 + (level - 1) * 25;
                    for (let i = 0; i < this.game.enemies.length; i++) {
                        const e = this.game.enemies[i];
                        if (e.dead) continue;
                        const edx = e.x - x, edy = e.y - y;
                        if (Math.hypot(edx, edy) <= range + e.radius) {
                            let diff = Math.abs(Math.atan2(edy, edx) - angle);
                            while (diff > Math.PI) diff -= Math.PI * 2;
                            if (Math.abs(diff) <= Math.PI * 0.55) {
                                e.takeDamage(baseDamage, fx);
                                if (typeof e.applyFear === 'function') e.applyFear(fearSec, remotePlayer, fx);
                                else e.fearTimer = Math.round(fearSec * 60);
                            }
                        }
                    }
                }
            }
        } else if (skillId === 'frappes') {
            const hasPagakia = level >= 5;
            remotePlayer.frenzyTimer = hasPagakia ? 480 : 300;
            remotePlayer.hasPagakiaMastery = hasPagakia;
            if (fx) {
                fx.addComicSplash(x, y - 35, hasPagakia ? 'FRAPPES+! 🧊' : 'FRAPPES FRENZY! 🥤');
                fx.addShockwave(x, y, 120, hasPagakia ? 'rgba(0, 206, 201, 0.85)' : 'rgba(243, 156, 18, 0.85)');
                fx.addSparks(x, y, hasPagakia ? '#00cec9' : '#f39c12', 18);
            }
            if (se && typeof se.playPowerup === 'function') se.playPowerup();
        } else if (skillId === 'nerobalonaki') {
            const radius = 105 + (level - 1) * 12;
            const duration = 360 + (level - 1) * 40;
            const dropX = x + Math.cos(angle) * 45;
            const dropY = y + Math.sin(angle) * 45;
            if (fx) {
                fx.addComicSplash(dropX, dropY - 28, 'SPLASH! 💦');
                fx.addShockwave(dropX, dropY, radius + 10, 'rgba(0, 210, 211, 0.85)');
                fx.addSparks(dropX, dropY, '#00d2d3', 14);
            }
            if (cam && typeof cam.shake === 'function') cam.shake(5, 7);
            if (se && typeof se.playWaterSplash === 'function') se.playWaterSplash();
            if (typeof WaterPuddle !== 'undefined' && this.game) {
                if (!this.game.hazards) this.game.hazards = [];
                this.game.hazards.push(new WaterPuddle(dropX, dropY, radius, duration, 0.55, 1.30));
            }
        } else {
            // Blade Rush (default)
            const reach = 75 + (level - 1) * 8;
            const slashX = x + Math.cos(angle) * 36;
            const slashY = y + Math.sin(angle) * 36;
            if (fx) {
                fx.addSlash(slashX, slashY, angle, reach + 5, '#00d2d3');
                fx.addDust(x, y, 6, 8);
                fx.addComicSplash(slashX, slashY - 26, level >= 3 ? 'CLEAVE!' : 'SWISH!');
            }
            if (cam && typeof cam.shake === 'function') cam.shake(6, 8);
            if (se && typeof se.playBladeSwish === 'function') se.playBladeSwish();
            if (isHostAuthoritative && this.game.enemies) {
                const baseDamage = 90 + (level - 1) * 20;
                const x2 = x + Math.cos(angle) * 210, y2 = y + Math.sin(angle) * 210;
                const dx = x2 - x, dy = y2 - y, l2 = dx * dx + dy * dy;
                for (let i = 0; i < this.game.enemies.length; i++) {
                    const e = this.game.enemies[i];
                    if (e.dead) continue;
                    let t = l2 > 0 ? ((e.x - x) * dx + (e.y - y) * dy) / l2 : 0;
                    t = Math.max(0, Math.min(1, t));
                    if (Math.hypot(e.x - (x + t * dx), e.y - (y + t * dy)) <= reach + e.radius) {
                        e.takeDamage(baseDamage, fx);
                        e.x += Math.cos(angle) * 18;
                        e.y += Math.sin(angle) * 18;
                        if (fx) { fx.addSlash(e.x, e.y, angle, reach - 10, '#00d2d3'); fx.addSparks(e.x, e.y, '#00d2d3', 6); }
                    }
                }
            }
        }
    }

    sendPause(playerName) { this.net.send('NET_PAUSE', { by: playerName }); }
    sendResume() { this.net.send('NET_RESUME', {}); }
    abortMatch() { this.net.send('HOST_QUIT_MATCH', {}); if (this.net && typeof this.net.disconnect === 'function') this.net.disconnect(); }

    render(ctx, camera) {
        this.remotePlayer.draw(ctx);
        this.remotePlayer.drawRadarIndicator(ctx, this.game.player, camera);
    }
}

if (typeof window !== 'undefined') {
    window.CoopHostSession = CoopHostSession;
}
