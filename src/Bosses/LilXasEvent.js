/**
 * Lesa.io - Lil Xas Concert Easter Egg Director
 * Triggers at 1% chance per Endless wave:
 *   1. Enemies approach -> freeze as Limo pulls up on the perimeter road (camera shifts!)
 *   2. Lil Xas exits Limo onto Concert Stage & starts blasting his trash song MP3
 *   3. Every enemy screams and sprints off the map in horror
 *   4. Boss fight against Lil Xas + 4 Destructible Speakers (ear-bleed damage + slow while music plays)
 */

class LilXasEvent {
    static TRIGGER_CHANCE = 0.01;
    static TRACKS = [
        'Audio/LilXasEasterEgg/Lil Xas - Re Malaka Poly Brizeis (Official Audio Release).mp3',
        'Audio/LilXasEasterEgg/Lil Xas - Tromokratia (Official Audio Release).mp3'
    ];

    static active = false;
    static phase = 'IDLE'; // 'ENEMIES_APPROACH' | 'LIMO_ARRIVE' | 'ENTER_STAGE' | 'BLAST_SONG' | 'COMBAT'
    static timer = 0;
    static waveMult = 1.0;
    static limo = null;
    static stage = null;
    static boss = null;
    static speakers = [];
    static audio = null;
    static activeTrackIdx = 0;
    static earBleedTickTimer = 0;
    static cameraTarget = null;
    static _panToFleeShown = false;
    static _eventSeq = 0;
    static _defeatedSeq = 0;

    static reset(clearSeq = true) {
        this.stopMusic();
        if (typeof LilXasCutsceneFX !== 'undefined') LilXasCutsceneFX.reset();
        this.active = false;
        this.phase = 'IDLE';
        this.timer = 0;
        this.limo = null;
        this.stage = null;
        this.boss = null;
        this.speakers = [];
        this.earBleedTickTimer = 0;
        this.cameraTarget = null;
        this._panToFleeShown = false;
        if (clearSeq) { this._eventSeq = 0; this._defeatedSeq = 0; }
        const g = (typeof window !== 'undefined') ? window.gameInstance : null;
        if (g && g.player) g.player.earBleedSlowMult = 1.0;
    }

    static getCameraTarget() {
        return (this.active && this.phase !== 'IDLE' && this.phase !== 'COMBAT') ? this.cameraTarget : null;
    }

    static shouldFreezeEnemy(enemy) {
        return !!(this.active && enemy && !enemy.isLilXas && !enemy.isLilXasSpeaker && (this.phase === 'LIMO_ARRIVE' || this.phase === 'ENTER_STAGE'));
    }

    static _clearForStage(arena, targetX, targetY) {
        if (!arena) return { x: targetX, y: targetY };
        let x = Math.max(-arena.halfWidth + 240, Math.min(arena.halfWidth - 240, targetX));
        let y = Math.max(-arena.halfHeight + 210, Math.min(arena.halfHeight - 210, targetY));
        for (let step = 0; step < 10; step++) {
            if (!arena._hitsBuilding || !arena._hitsBuilding(x, y, 165)) return { x, y };
            x += (step % 2 === 0 ? 1 : -1) * (160 + step * 50);
            x = Math.max(-arena.halfWidth + 240, Math.min(arena.halfWidth - 240, x));
        }
        return { x, y };
    }

    static tryStartOnEndlessWave(waveManager, waveNum, player, enemies, effects) {
        if (this.active || !waveManager || waveNum < 1) return false;
        if (Math.random() >= this.TRIGGER_CHANCE) return false;
        return this.startEvent(waveManager, waveNum, player, enemies, effects);
    }

    static startEvent(waveManager, waveNum, player, enemies, effects) {
        const g = (typeof window !== 'undefined') ? window.gameInstance : null;
        const arena = g ? g.arena : null;
        if (!player || !arena || !enemies) return false;

        this.reset(false);
        this._eventSeq = (this._eventSeq || 0) + 1;
        this.active = true;
        this.phase = 'ENEMIES_APPROACH';
        this.timer = 68;
        this.waveMult = 1.0 + (waveNum - 1) * 0.18;

        waveManager.wave = waveNum;
        waveManager.waveState = 'IN_PROGRESS';
        waveManager.waveEnemiesKilled = 0;

        // Spawn visible regular enemies coming straight at the player before the cutscene interrupts
        const count = Math.min(14, 7 + Math.floor(waveNum * 0.4));
        waveManager.waveTotalEnemies = count;
        for (let i = 0; i < count; i++) {
            const ang = (i / count) * Math.PI * 2 + Math.random() * 0.35;
            const dist = 230 + Math.random() * 110;
            const ex = Math.max(-arena.halfWidth + 80, Math.min(arena.halfWidth - 80, player.x + Math.cos(ang) * dist));
            const ey = Math.max(-arena.halfHeight + 80, Math.min(arena.halfHeight - 80, player.y + Math.sin(ang) * dist));
            const picked = (typeof EndlessWaveDirector !== 'undefined' && EndlessWaveDirector.pickEndlessEnemy)
                ? EndlessWaveDirector.pickEndlessEnemy(waveNum, ex, ey, this.waveMult)
                : (typeof Fatmir !== 'undefined' ? new Fatmir(ex, ey, this.waveMult) : null);
            if (picked) enemies.push(picked);
        }

        // Compute nearest North or South perimeter road & open Concert Stage area inside map
        const useSouth = player.y > 0;
        const roadY = useSouth ? (arena.halfHeight + 122) : (-arena.halfHeight - 122);
        const rawStageY = useSouth ? (arena.halfHeight - 210) : (-arena.halfHeight + 210);
        const spot = this._clearForStage(arena, player.x, rawStageY);
        const limoDir = spot.x <= 0 ? 1 : -1;

        this.limo = {
            x: spot.x - limoDir * 680,
            y: roadY,
            targetX: spot.x,
            dir: limoDir,
            angle: 0,
            doorSide: useSouth ? 'top' : 'bottom',
            doorOpen: 0,
            age: 0
        };
        this.stage = {
            x: spot.x,
            y: spot.y,
            limoSide: useSouth ? 'south' : 'north',
            musicPlaying: false,
            age: 0
        };

        waveManager.showWaveAnnouncement(`ENDLESS ${waveNum}`, '#fed330', 90);
        if (effects) effects.addComicSplash(player.x, player.y - 52, `ENDLESS ${waveNum}!`);
        return true;
    }

    static forceTrigger(game = null) {
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        if (!g || !g.waveManager || !g.player) return false;
        g.enemies.length = 0;
        return this.startEvent(g.waveManager, Math.max(1, g.waveManager.wave || 1), g.player, g.enemies, g.effects);
    }

    static update(dt = 1, game = null) {
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        if (!this.active || !g || !g.player) return;

        if (this.limo) this.limo.age += dt;
        if (this.stage) this.stage.age += dt;
        if (g.isCoopGuest) {
            if (typeof LilXasCutsceneFX !== 'undefined') LilXasCutsceneFX.update(dt);
            return;
        }
        const overlay = g.cutsceneOverlay;

        if (this.phase === 'ENEMIES_APPROACH') {
            this.timer -= dt;
            if (this.timer <= 0) {
                this._enterLimoArrive(g, overlay);
            }
            return;
        }

        if (this.phase === 'LIMO_ARRIVE') {
            this.timer -= dt;
            const limo = this.limo;
            const dx = limo.targetX - limo.x;
            if (Math.abs(dx) > 6) {
                limo.x += dx * Math.min(1, 0.065 * dt);
                if (g.effects && Math.abs(dx) > 45 && Math.random() < 0.45 * dt) {
                    g.effects.addDust(limo.x - limo.dir * 85, limo.y + 12, 2, 6);
                }
            } else {
                limo.x = limo.targetX;
                limo.doorOpen = Math.min(1, limo.doorOpen + 0.08 * dt);
            }
            this.cameraTarget = { x: limo.x, y: limo.y + (this.stage.limoSide === 'south' ? -70 : 70) };
            if (this.timer <= 0) {
                this._enterStageWalk(g, overlay);
            }
            return;
        }

        if (this.phase === 'ENTER_STAGE') {
            this.timer -= dt;
            if (this.limo) this.limo.doorOpen = Math.min(1, this.limo.doorOpen + 0.1 * dt);
            if (this.boss) {
                const dx = this.stage.x - this.boss.x;
                const dy = this.stage.y - this.boss.y;
                const dist = Math.hypot(dx, dy) || 1;
                if (dist > 6) {
                    const step = Math.min(dist, 3.6 * dt);
                    this.boss.x += (dx / dist) * step;
                    this.boss.y += (dy / dist) * step;
                    this.boss.walkCycle += 0.22 * dt;
                    this.boss.age += dt;
                    this.boss.angle = Math.atan2(dy, dx);
                }
                this.cameraTarget = { x: this.boss.x, y: this.boss.y };
            }
            if (this.timer <= 0) {
                this._enterBlastSong(g, overlay);
            }
            return;
        }

        if (this.phase === 'BLAST_SONG') {
            this.timer -= dt;
            const hasCutFX = (typeof LilXasCutsceneFX !== 'undefined');
            if (hasCutFX) LilXasCutsceneFX.update(dt);

            if (!this._panToFleeShown && this.timer <= 215) {
                this._panToFleeShown = true;
                if (hasCutFX) LilXasCutsceneFX.releaseFleeingPanic(g, overlay);
                this._emitCoop('flee_panic');
            }
            if (this._panToFleeShown && hasCutFX) {
                LilXasCutsceneFX.updateFleeingEnemies(dt, g, this.stage, true);
                if (LilXasCutsceneFX.countFleeingEnemies(g) === 0 && this.timer > 28) {
                    this.timer = 28;
                }
                this.cameraTarget = (this.timer <= 28)
                    ? { x: g.player.x, y: g.player.y }
                    : LilXasCutsceneFX.computeFleeCameraTarget(g);
            }
            if (g.effects && Math.random() < 0.28 * dt) {
                const sp = this.speakers[Math.floor(Math.random() * this.speakers.length)];
                if (sp) g.effects.addShockwave(sp.x, sp.y, 90, 'rgba(224, 86, 253, 0.72)');
            }
            if (this.timer <= 0) {
                this._startCombat(g, overlay);
            }
            return;
        }

        if (this.phase === 'COMBAT') {
            if (typeof LilXasCutsceneFX !== 'undefined') {
                LilXasCutsceneFX.update(dt);
                LilXasCutsceneFX.updateFleeingEnemies(dt, g, this.stage, false);
            }
            this._updateCombatAura(dt, g);
        }
    }

    static _enterLimoArrive(g, overlay) {
        this.phase = 'LIMO_ARRIVE';
        this.timer = 150;
        this.cameraTarget = { x: this.limo.x, y: this.limo.y };

        if (overlay) {
            overlay.startCutscene('🎤 RARE EASTER EGG • WAIT... WHO IS PULLING UP?! 🚗', { allowEndless: true, skipSquadPosition: true });
            overlay.setDialogue('SKATMIR & SQUAD', 'Hold on... why do we hear cheap autotune in the street?! 🤨', '#fed330', '❓', false);
        }
        if (g.effects) {
            for (const e of g.enemies) {
                if (!e || e.dead) continue;
                g.effects.addComicSplash(e.x, e.y - 36, '❓ HUH?!');
            }
        }
        if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
            window.soundEngine.playSelect();
        }
    }

    static _enterStageWalk(g, overlay) {
        this.phase = 'ENTER_STAGE';
        this.timer = 130;
        if (typeof LilXasBoss !== 'undefined') {
            const exitY = this.limo.y + (this.stage.limoSide === 'south' ? -46 : 46);
            this.boss = new LilXasBoss(this.limo.x, exitY, this.waveMult);
            this.boss.inCutscene = true;
            g.enemies.push(this.boss);
        }

        // Spawn 4 Concert Speakers at the corners of the Concert Area
        const offsets = [[-132, -74], [132, -74], [-132, 74], [132, 74]];
        this.speakers = [];
        if (typeof LilXasSpeaker !== 'undefined') {
            offsets.forEach(([ox, oy], idx) => {
                const sp = new LilXasSpeaker(this.stage.x + ox, this.stage.y + oy, this.waveMult, idx);
                sp.musicPlaying = false;
                this.speakers.push(sp);
                g.enemies.push(sp);
            });
        }
        if (overlay) {
            overlay.setDialogue('LIL XAS', 'YO WHAT IS UP CHAT!! IT IS LIL XAS!! DROP MY NEW SINGLE AT MAX VOLUME!! 😎🎤🔥', '#e056fd', '😎', false);
        }
        if (g.effects) g.effects.addComicSplash(this.stage.x, this.stage.y - 80, '✨ CONCERT STAGE DEPLOYED!');
    }

    static _enterBlastSong(g, overlay) {
        this.phase = 'BLAST_SONG';
        this.timer = 280;
        this._panToFleeShown = false;
        if (this.stage) this.stage.musicPlaying = true;
        if (this.boss) this.boss.hasSpeakerShield = true;
        for (const sp of this.speakers) sp.musicPlaying = true;
        this.playRandomSong();
        if (typeof LilXasCutsceneFX !== 'undefined') {
            LilXasCutsceneFX.triggerStageBlast(this.stage, g.effects);
            LilXasCutsceneFX.tagFleeingEnemies(g.enemies, this.stage);
        }
        this._emitCoop('stage_blast', { ti: this.activeTrackIdx });
        if (overlay) {
            overlay.setDialogue('LIL XAS', 'MAX VOLUME!! NOBODY CAN SURVIVE THIS BANGER!! 🔊🎤🔥', '#e056fd', '🎤', false);
        }
        if (g.camera) g.camera.addShake(12);
    }

    static _startCombat(g, overlay) {
        this.phase = 'COMBAT';
        this.cameraTarget = null;
        this.earBleedTickTimer = 60;
        if (this.boss) this.boss.inCutscene = false;
        if (overlay) overlay.endCutscene();
        if (g.waveManager) {
            g.waveManager.waveTotalEnemies = Math.max(1, g.enemies.filter(e => e && (e.isLilXas || e.isLilXasSpeaker)).length);
        }
        if (g.ui && typeof g.ui.addKillfeed === 'function') {
            g.ui.addKillfeed('🎤 EASTER EGG BOSS: LIL XAS! Smash all 4 Speakers to stop Ear Bleed!');
        }
        if (g.effects) {
            g.effects.addComicSplash(g.player.x, g.player.y - 54, '🔊 DESTROY THE SPEAKERS!', '#e056fd');
        }
    }

    static _updateCombatAura(dt, g) {
        const p = g.player;
        const aliveSpeakers = this.speakers.filter(s => s && !s.dead && s.hp > 0).length;
        if (this.stage) this.stage.musicPlaying = aliveSpeakers > 0;

        if (aliveSpeakers > 0) {
            const se = (typeof window !== 'undefined') ? window.soundEngine : null;
            if (se && (se.muted || se.bgmMuted)) this.stopMusic();
            else if (!this.audio) this.playRandomSong();
            p.earBleedSlowMult = Math.max(0.66, 1.0 - 0.08 * aliveSpeakers);
            this.earBleedTickTimer -= dt;
            if (this.earBleedTickTimer <= 0) {
                this.earBleedTickTimer = 75;
                const dmg = 6 + 3 * aliveSpeakers;
                if (!(window.AdminCheats && window.AdminCheats.godMode) && p.hp > 0) {
                    p.hp = Math.max(0, p.hp - dmg);
                    if (g.effects) {
                        g.effects.addDamage(p.x, p.y - 12, dmg, false, true);
                        g.effects.addComicSplash(p.x, p.y - 38, '🙉 EAR BLEED -' + dmg, '#f472b6');
                    }
                    if (p.hp <= 0 && typeof HeroStarBlessing !== 'undefined') HeroStarBlessing.tryStarRevive(p, g.effects);
                    if (p.hp <= 0 && window.soundEngine) window.soundEngine.playGameOver();
                }
                const p2 = g.coopSession && g.coopSession.isHost ? g.coopSession.remotePlayer : null;
                if (p2 && p2.hp > 0 && !p2.isDowned && !p2.isDownedDisconnected) {
                    p2.hp = Math.max(0, p2.hp - dmg);
                    if (p2.hp <= 0) p2.isDowned = true;
                    if (g.effects) g.effects.addDamage(p2.x, p2.y - 12, dmg, false, true);
                }
            }
        } else {
            p.earBleedSlowMult = 1.0;
        }
    }

    static onSpeakerDestroyed(speaker, effects) {
        const remaining = this.speakers.filter(s => s && !s.dead && s.hp > 0).length;
        if (remaining === 0) {
            if (this.stage) this.stage.musicPlaying = false;
            this.stopMusic();
            this._playRecordScratch();
            this._emitCoop('speakers_stopped');
            const g = (typeof window !== 'undefined') ? window.gameInstance : null;
            if (g && g.player) g.player.earBleedSlowMult = 1.0;
            if (effects && this.boss) {
                effects.addComicSplash(this.boss.x, this.boss.y - 68, '🔇 TRASH MUSIC STOPPED!!', '#00f5ff');
            }
        }
    }

    static onBossDefeated(boss, game) {
        if (!this.active) return;
        this.stopMusic();
        this._emitCoop('boss_defeated', { x: Math.round(boss.x), y: Math.round(boss.y) });
        for (const sp of this.speakers) {
            if (sp && !sp.dead) sp.onShatter(game ? game.effects : null);
        }
        if (game && game.player) {
            game.player.earBleedSlowMult = 1.0;
        }
        if (game && game.effects) {
            game.effects.addConfetti(boss.x, boss.y, 70);
            game.effects.addComicSplash(boss.x, boss.y - 60, '🔇 CONCERT CANCELED! 🏆');
        }
        if (game && game.ui && typeof game.ui.addKillfeed === 'function') {
            game.ui.addKillfeed('🔇 Silenced LIL XAS & Smashed the Speakers! (+8,000 pts & Insane Boss Crate!)');
        }
        if (boss) boss._featRecorded = true;
        if (typeof window !== 'undefined' && window.GameState && typeof window.GameState.recordBossDefeat === 'function') {
            window.GameState.recordBossDefeat('lil_xas');
        }
        this.active = false;
        this.phase = 'IDLE';
    }

    static playRandomSong(forcedIdx = null) {
        this.stopMusic();
        const se = (typeof window !== 'undefined') ? window.soundEngine : null;
        if (se && (se.muted || se.bgmMuted)) return;
        if (typeof Audio === 'undefined') return;
        try {
            const idx = (typeof forcedIdx === 'number' && forcedIdx >= 0 && forcedIdx < this.TRACKS.length)
                ? forcedIdx : Math.floor(Math.random() * this.TRACKS.length);
            this.activeTrackIdx = idx;
            const trackUrl = encodeURI(this.TRACKS[idx]);
            const audio = new Audio(trackUrl);
            audio.loop = true;
            this.audio = audio;
            if (se && se.bgmCtrl && se.bgmCtrl.playTrack('lilXas', trackUrl, { loop: true, scale: 0.9, reset: true, fallbackAudio: audio })) return;
            if (se && typeof se.registerBgmElement === 'function') se.registerBgmElement(audio, 0.9);
            else audio.volume = se ? Math.max(0, Math.min(1, se.bgmVolume * 0.9)) : 0.6;
            const p = audio.play();
            if (p && p.catch) p.catch(() => {});
        } catch (_) {}
    }

    static _emitCoop(kind, extra = {}) {
        const g = (typeof window !== 'undefined') ? window.gameInstance : null;
        const net = g && g.coopSession && g.coopSession.isHost ? g.coopSession.net : null;
        if (net) net.send('LIL_XAS_EVENT', { kind, seq: this._eventSeq || 1, ...extra });
    }

    static getCoopSnapshot() {
        if (!this.active) return null;
        return {
            seq: this._eventSeq || 1, ph: this.phase, ti: this.activeTrackIdx || 0,
            l: this.limo ? { x: Math.round(this.limo.x), y: Math.round(this.limo.y), dir: this.limo.dir, ds: this.limo.doorSide, do: Number((this.limo.doorOpen || 0).toFixed(2)) } : null,
            s: this.stage ? { x: Math.round(this.stage.x), y: Math.round(this.stage.y), ls: this.stage.limoSide, mp: this.stage.musicPlaying ? 1 : 0 } : null,
            ct: this.cameraTarget ? { x: Math.round(this.cameraTarget.x), y: Math.round(this.cameraTarget.y) } : null,
            eb: this.phase === 'COMBAT' ? this.speakers.filter(s => s && !s.dead && s.hp > 0).length : 0
        };
    }

    static applyCoopSnapshot(lx, g) {
        if (!lx) { if (this.active) this.reset(); return; }
        if (this._defeatedSeq && (lx.seq || 1) <= this._defeatedSeq) return;
        this._eventSeq = lx.seq || 1;
        this.active = true;
        this.phase = lx.ph || 'ENEMIES_APPROACH';
        this.activeTrackIdx = lx.ti || 0;
        if (lx.l) this.limo = { ...(this.limo || { angle: 0, age: 0 }), x: lx.l.x, y: lx.l.y, dir: lx.l.dir, doorSide: lx.l.ds, doorOpen: lx.l.do };
        if (lx.s) this.stage = { ...(this.stage || { age: 0 }), x: lx.s.x, y: lx.s.y, limoSide: lx.s.ls, musicPlaying: !!lx.s.mp };
        this.cameraTarget = lx.ct ? { x: lx.ct.x, y: lx.ct.y } : null;
        if (g && Array.isArray(g.enemies)) {
            this.boss = g.enemies.find(e => e && e.isLilXas && !e.dead) || null;
            this.speakers = g.enemies.filter(e => e && e.isLilXasSpeaker && !e.dead);
        }
        const shouldPlay = (this.phase === 'BLAST_SONG' || (this.stage && this.stage.musicPlaying));
        const se = (typeof window !== 'undefined') ? window.soundEngine : null;
        if (!shouldPlay || (se && (se.muted || se.bgmMuted))) { if (this.audio) this.stopMusic(); }
        else if (!this.audio) { this.playRandomSong(this.activeTrackIdx); }
        if (g && g.player) {
            g.player.earBleedSlowMult = (this.phase === 'COMBAT' && lx.eb > 0) ? Math.max(0.66, 1.0 - 0.08 * lx.eb) : 1.0;
        }
    }

    static handleCoopEvent(kind, payload, g) {
        if (!g) return;
        if (kind === 'stage_blast') {
            this.active = true; this.phase = 'BLAST_SONG';
            if (typeof LilXasCutsceneFX !== 'undefined') LilXasCutsceneFX.triggerStageBlast(this.stage, g.effects);
            this.playRandomSong(payload.ti);
            if (g.camera) g.camera.addShake(12);
        } else if (kind === 'flee_panic') {
            if (typeof LilXasCutsceneFX !== 'undefined') LilXasCutsceneFX.releaseFleeingPanic(g, null);
        } else if (kind === 'speakers_stopped') {
            if (this.stage) this.stage.musicPlaying = false;
            this.stopMusic(); this._playRecordScratch();
            if (g.player) g.player.earBleedSlowMult = 1.0;
            if (g.effects && this.boss) g.effects.addComicSplash(this.boss.x, this.boss.y - 68, '🔇 TRASH MUSIC STOPPED!!', '#00f5ff');
        } else if (kind === 'boss_defeated') {
            this._defeatedSeq = Math.max(this._defeatedSeq || 0, payload.seq || (this._eventSeq || 1));
            this.stopMusic();
            if (g.player) g.player.earBleedSlowMult = 1.0;
            if (g.effects) {
                g.effects.addConfetti(payload.x || 0, payload.y || 0, 70);
                g.effects.addComicSplash(payload.x || 0, (payload.y || 0) - 60, '🔇 CONCERT CANCELED! 🏆');
            }
            if (g.ui && typeof g.ui.addKillfeed === 'function') g.ui.addKillfeed('🔇 Silenced LIL XAS & Smashed the Speakers! (+8,000 pts & Insane Boss Crate!)');
            if (typeof window !== 'undefined' && window.GameState && typeof window.GameState.recordBossDefeat === 'function') {
                window.GameState.recordBossDefeat('lil_xas');
            }
            this.active = false; this.phase = 'IDLE'; this.cameraTarget = null;
        }
    }

    static setPaused(paused) {
        const se = (typeof window !== 'undefined') ? window.soundEngine : null;
        if (paused) {
            if (se && se.bgmCtrl) se.bgmCtrl.stopTrack('lilXas', false);
            if (this.audio) try { this.audio.pause(); } catch (_) {}
            return;
        }
        if (this.active && (this.phase === 'BLAST_SONG' || (this.stage && this.stage.musicPlaying))) {
            if (se && (se.muted || se.bgmMuted || se.bgmVolume <= 0)) return;
            const url = encodeURI(this.TRACKS[this.activeTrackIdx || 0] || this.TRACKS[0]);
            if (se && se.bgmCtrl && se.bgmCtrl.playTrack('lilXas', url, { loop: true, scale: 0.9, fallbackAudio: this.audio })) return;
            if (this.audio) try { this.audio.play().catch(() => {}); } catch (_) {}
        }
    }

    static stopMusic() {
        const se = (typeof window !== 'undefined') ? window.soundEngine : null;
        if (se && se.bgmCtrl) se.bgmCtrl.stopTrack('lilXas', true);
        if (!this.audio) return;
        if (se && typeof se.unregisterBgmElement === 'function') se.unregisterBgmElement(this.audio);
        try {
            this.audio.pause();
            this.audio.currentTime = 0;
        } catch (_) {}
        this.audio = null;
    }

    static _playRecordScratch() {
        const se = (typeof window !== 'undefined') ? window.soundEngine : null;
        if (!se || se.muted || !se.ctx) return;
        try {
            const ctx = se.ctx;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(620, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(75, ctx.currentTime + 0.28);
            gain.gain.setValueAtTime(Math.min(0.45, (se.masterVolume || 0.5) * 0.5), ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.29);
        } catch (_) {}
    }

    static drawWorld(ctx, camera, arena) {
        if (!this.active || typeof LilXasRenderer === 'undefined') return;
        if (typeof LilXasCutsceneFX !== 'undefined') {
            LilXasCutsceneFX.drawGroundBlood(ctx, camera);
        }
        if (this.stage && (!camera || camera.isVisible(this.stage.x, this.stage.y, 260))) {
            LilXasRenderer.drawStage(ctx, this.stage);
        }
        if (this.limo && (!camera || camera.isVisible(this.limo.x, this.limo.y, 220))) {
            LilXasRenderer.drawLimo(ctx, this.limo);
        }
        if (typeof LilXasCutsceneFX !== 'undefined') {
            LilXasCutsceneFX.drawSonicWaves(ctx, camera);
        }
    }

    static drawScreenOverlay(ctx, width, height) {
        if (!this.active || this.phase !== 'COMBAT') return;
        const alive = this.speakers.filter(s => s && !s.dead && s.hp > 0).length;
        if (alive <= 0) return;
        const slowPct = Math.round(alive * 8);
        const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.008);

        ctx.save();
        // Subtle pulsing ear-bleed border glow while speakers are blasting
        ctx.strokeStyle = `rgba(224, 86, 253, ${0.22 + pulse * 0.18})`;
        ctx.lineWidth = 10;
        ctx.strokeRect(5, 5, width - 10, height - 10);

        const bannerW = Math.min(540, width - 32);
        const bx = (width - bannerW) / 2;
        const by = 82;
        ctx.fillStyle = 'rgba(17, 12, 28, 0.88)';
        ctx.strokeStyle = '#e056fd';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(bx, by, bannerW, 34, 10);
        ctx.fill();
        ctx.stroke();

        ctx.font = '900 13px "Luckiest Guy", "Fredoka", sans-serif';
        ctx.fillStyle = '#fef08a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`🔊 LIL XAS CONCERT: DESTROY SPEAKERS (${alive}/4 LEFT) • EAR BLEED & -${slowPct}% SPEED`, width / 2, by + 17);
        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.LilXasEvent = LilXasEvent;
}
