/**
 * Lesa.io - Endless Hard Mode Progressive Map & Environmental Hazards
 * Distinct 5-stage evolution over Dark Basalt & Ruined Sanctuary flagstones:
 *   Stage 0 (W1-9)   : Twilight Ruined Courtyard (rain streaks, lantern braziers, cracked basalt tiles)
 *   Stage 1 (W10-19) : Alchemist Blight (glowing bubbling emerald acid pools + toxic spore mist)
 *   Stage 2 (W20-29) : Frozen Storm Rift (crystal frost veins + sky lightning telegraph strikes)
 *   Stage 3 (W30-39) : Obsidian Magma Siege (pulsing molten lava fissures + rising fire embers)
 *   Stage 4 (W40+)   : Blood Eclipse Citadel (rotating crimson-gold arcane sigil + eclipse meteors)
 */

class EndlessHardMap {
    static active = false;
    static wave = 1;
    static age = 0;
    static _stage = 0;
    static _announcedStage = -1;
    static _acidPools = [];
    static _fissures = [];
    static _strikes = [];
    static _motes = null;
    static _strikeCd = 190;
    static _dmgCd = 0;
    static _strikeIdSeq = 1;

    static forEachAlivePlayer(g, fn) {
        if (!g || typeof fn !== 'function') return;
        if (g.player && g.player.hp > 0) fn(g.player);
        const rps = g.coopSession && Array.isArray(g.coopSession.remotePlayers) ? g.coopSession.remotePlayers : null;
        if (!rps) return;
        for (let i = 0; i < rps.length; i++) {
            const rp = rps[i];
            if (rp && !rp.isDowned && !rp.isDownedDisconnected && rp.hp > 0) fn(rp);
        }
    }

    static getNetStrikes() {
        return this._strikes.map(s => ({
            id: s._netId || 0, x: Math.round(s.x), y: Math.round(s.y),
            r: Math.round(s.radius), t: Math.round(s.timer), mt: Math.round(s.maxTimer),
            k: s.kind === 'meteor' ? 'm' : 'l'
        }));
    }

    static applyNetStrikes(arr, g) {
        if (!Array.isArray(arr)) return;
        const incomingIds = new Set(arr.map(s => s && s.id).filter(Boolean));
        for (let i = 0; i < this._strikes.length; i++) {
            const prev = this._strikes[i];
            if (prev && prev._netId && !incomingIds.has(prev._netId)) {
                if (typeof EndlessHardHazards !== 'undefined') EndlessHardHazards.onStrikeDetonate(prev);
                if (g && g.effects) {
                    const col = prev.kind === 'meteor' ? 'rgba(255, 46, 76, 0.92)' : 'rgba(56, 189, 248, 0.92)';
                    g.effects.addShockwave(prev.x, prev.y, prev.radius + 25, col);
                    g.effects.addSparks(prev.x, prev.y, prev.kind === 'meteor' ? '#ff2e4c' : '#38bdf8', 10);
                }
            }
        }
        this._strikes = arr.map(s => ({
            _netId: s.id || 0, x: s.x || 0, y: s.y || 0,
            radius: s.r || 88, timer: Math.max(1, s.t || 1), maxTimer: Math.max(1, s.mt || 56),
            kind: s.k === 'm' ? 'meteor' : 'lightning'
        }));
    }

    static reset() {
        this.active = false;
        this.wave = 1;
        this.age = 0;
        this._stage = 0;
        this._announcedStage = -1;
        if (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile && Array.isArray(this._acidPools)) {
            for (const pool of this._acidPools) {
                if (pool && pool._cache) MobilePerf.releaseCanvas(pool._cache);
            }
        }
        this._acidPools = [];
        this._fissures = [];
        this._strikes = [];
        this._motes = null;
        this._strikeCd = 190;
        this._dmgCd = 0;
        if (typeof EndlessHardHazards !== 'undefined') EndlessHardHazards.reset();
    }

    static getStageForWave(waveNum) {
        const w = Math.max(1, Number(waveNum) || 1);
        if (w >= 40) return 4;
        if (w >= 30) return 3;
        if (w >= 20) return 2;
        if (w >= 10) return 1;
        return 0;
    }

    static getStageMeta(stage) {
        const list = [
            { name: 'STAGE I: TWILIGHT RUINED COURTYARD', color: '#818cf8', accent: '#6366f1', wash: 'rgba(30, 27, 75, 0.14)' },
            { name: 'STAGE II: ALCHEMIST BLIGHT', color: '#2ed573', accent: '#10ac84', wash: 'rgba(6, 78, 59, 0.16)' },
            { name: 'STAGE III: FROZEN STORM RIFT', color: '#38bdf8', accent: '#0ea5e9', wash: 'rgba(12, 74, 110, 0.16)' },
            { name: 'STAGE IV: OBSIDIAN MAGMA SIEGE', color: '#ff6b35', accent: '#ef4444', wash: 'rgba(124, 45, 18, 0.18)' },
            { name: 'STAGE V: BLOOD ECLIPSE CITADEL', color: '#ff2e4c', accent: '#f43f5e', wash: 'rgba(136, 19, 55, 0.22)' }
        ];
        return list[Math.max(0, Math.min(4, stage || 0))];
    }

    /**
     * Bake completely distinct Dark Basalt & Ruined Sanctuary stone tilemap for Hard Mode.
     */
    static renderGroundCache(arena) {
        if (!arena) return;
        const scale = (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile)
            ? Math.min(0.42, Math.max(0.28, MobilePerf.getGroundCacheScale() * 0.65))
            : 1.0;
        arena.groundCacheScale = scale;
        const tw = Math.max(512, Math.round(arena.width * scale));
        const th = Math.max(512, Math.round(arena.height * scale));
        if (!arena.cachedGroundCanvas) arena.cachedGroundCanvas = document.createElement('canvas');
        arena.cachedGroundCanvas.width = tw;
        arena.cachedGroundCanvas.height = th;
        const ctx = arena.cachedGroundCanvas.getContext('2d');
        if (!ctx) return;

        ctx.save();
        ctx.setTransform(scale, 0, 0, scale, 0, 0);

        // 1. Deep Basalt Stone Base
        const bgGrad = ctx.createRadialGradient(arena.halfWidth, arena.halfHeight, 120, arena.halfWidth, arena.halfHeight, arena.width * 0.72);
        bgGrad.addColorStop(0, '#1e2230');
        bgGrad.addColorStop(0.55, '#171923');
        bgGrad.addColorStop(1, '#0e1018');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, arena.width, arena.height);

        // 2. Hand-cut Dark Flagstone Tiles with subtle worn color variation
        const ts = 112;
        let seed = 918273;
        const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

        for (let y = 0; y < arena.height; y += ts) {
            for (let x = 0; x < arena.width; x += ts) {
                const n = rnd();
                ctx.fillStyle = n < 0.3 ? '#23283a' : (n < 0.65 ? '#1b1f2e' : '#161926');
                ctx.fillRect(x + 2, y + 2, ts - 4, ts - 4);
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 2, y + 2, ts - 4, ts - 4);

                // Subtle cracked slate scratches & scattered courtyard basalt pebbles
                if (rnd() < 0.35) {
                    ctx.strokeStyle = 'rgba(148, 163, 184, 0.09)';
                    ctx.lineWidth = 1.6;
                    ctx.beginPath();
                    ctx.moveTo(x + 14 + rnd() * 30, y + 16 + rnd() * 20);
                    ctx.lineTo(x + 48 + rnd() * 40, y + 52 + rnd() * 40);
                    ctx.stroke();
                }
                if (rnd() < 0.22) {
                    ctx.fillStyle = rnd() < 0.5 ? '#2b3146' : '#0b0d14';
                    ctx.beginPath();
                    ctx.ellipse(x + 20 + rnd() * 72, y + 20 + rnd() * 72, 4 + rnd() * 5, 2.5 + rnd() * 3, rnd() * 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // 3. Carved Central Sanctuary Rune Ring
        const cx = arena.halfWidth, cy = arena.halfHeight;
        ctx.strokeStyle = 'rgba(255, 46, 76, 0.22)';
        ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(cx, cy, 320, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(254, 211, 48, 0.16)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(cx, cy, 285, 0, Math.PI * 2); ctx.stroke();
        for (let k = 0; k < 12; k++) {
            const a = (k / 12) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * 285, cy + Math.sin(a) * 285);
            ctx.lineTo(cx + Math.cos(a) * 320, cy + Math.sin(a) * 320);
            ctx.stroke();
        }

        // 4. Outer Abyssal Rim Vignette
        ctx.strokeStyle = 'rgba(255, 46, 76, 0.28)';
        ctx.lineWidth = 42;
        ctx.strokeRect(21, 21, arena.width - 42, arena.height - 42);
        ctx.restore();
    }

    static generateObstacles(arena, rng = Math.random) {
        arena.obstacles = [];
        let obsId = 1;

        // 1. Concentric Obsidian Ruin Pillars (10 solid cover pillars)
        const pillarPts = [
            { x: -460, y: -420 }, { x: 460, y: -420 },
            { x: -460, y: 420 }, { x: 460, y: 420 },
            { x: 0, y: -640 }, { x: 0, y: 640 },
            { x: -820, y: 0 }, { x: 820, y: 0 },
            { x: -920, y: -760 }, { x: 920, y: 760 }
        ];
        for (const pt of pillarPts) {
            const p = new Obstacle(pt.x, pt.y, 'tree');
            p.id = obsId++;
            p.radius = 34;
            p.maxHp = 99999; p.hp = 99999;
            p.isObsidianPillar = true;
            arena.obstacles.push(p);
        }

        // 2. Shootable Explosive Crimson Barrels + Supply Crates
        let placed = 0, tries = 0;
        while (placed < 26 && tries < 250) {
            tries++;
            const x = (rng() * 2 - 1) * (arena.halfWidth - 220);
            const y = (rng() * 2 - 1) * (arena.halfHeight - 220);
            if (x * x + y * y < 240 * 240) continue;
            let clear = true;
            for (const o of arena.obstacles) {
                if (Math.hypot(x - o.x, y - o.y) < 115) { clear = false; break; }
            }
            if (!clear) continue;
            const kind = (placed % 2 === 0) ? 'barrel' : 'crate';
            const obs = new Obstacle(x, y, kind);
            obs.id = obsId++;
            obs.isHardProp = true;
            arena.obstacles.push(obs);
            placed++;
        }

        this._seedStageZones(arena, rng);
    }

    static _seedStageZones(arena, rng = Math.random) {
        this._acidPools = [];
        this._fissures = [];
        if (typeof EndlessHardHazards !== 'undefined') EndlessHardHazards.seed(arena, rng);
        for (let i = 0; i < 10; i++) {
            const a = (i / 10) * Math.PI * 2 + rng() * 0.4;
            const r = 340 + rng() * 680;
            this._acidPools.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, rx: 85 + rng() * 45, ry: 60 + rng() * 32, rot: rng() * Math.PI, phase: rng() * 6 });
        }
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2 + rng() * 0.35;
            const r = 280 + rng() * 760;
            this._fissures.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, len: 135 + rng() * 90, rot: rng() * Math.PI, phase: rng() * 6 });
        }
    }

    static update(dt = 1, game = null) {
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        if (!g || g.gameMode !== 'endless' || !g.isEndlessHard || g.state !== 'PLAYING') {
            this.active = false;
            return;
        }
        this.active = true;
        this.age += dt;
        const w = (g.waveManager && g.waveManager.wave) ? g.waveManager.wave : 1;
        this.wave = w;
        const st = this.getStageForWave(w);

        if (st !== this._stage || this._announcedStage === -1) {
            this._stage = st;
            if (st > 0 && this._announcedStage !== st) {
                this._announcedStage = st;
                const meta = this.getStageMeta(st);
                if (g.ui && typeof g.ui.addKillfeed === 'function') g.ui.addKillfeed(`🔥 HARD ENDLESS ➔ ${meta.name}`);
                if (g.effects && g.player) {
                    g.effects.addShockwave(g.player.x, g.player.y, 290, meta.accent);
                    g.effects.addComicSplash(g.player.x, g.player.y - 68, meta.name, meta.color, 26, true);
                }
            } else if (this._announcedStage === -1) {
                this._announcedStage = st;
            }
        }

        // Update atmospheric particles & interactive hazards
        this._updateMotes(dt, g, st);
        if (typeof EndlessHardHazards !== 'undefined') EndlessHardHazards.update(dt, g, st);

        // Environmental stage hazard effects (Acid Stage 1+, Lightning Stage 2+, Eclipse Meteors Stage 4)
        const isGuest = !!g.isCoopGuest;
        this._dmgCd = Math.max(0, this._dmgCd - dt);
        if (!isGuest && st >= 1 && this._dmgCd <= 0 && g.player) {
            this._dmgCd = 28;
            if (st === 1) this._tickAcidPools(g);
        }

        if (!isGuest && st >= 2 && g.player) {
            this._strikeCd -= dt;
            if (this._strikeCd <= 0) {
                this._strikeCd = st >= 4 ? 115 : (st >= 3 ? 150 : 185);
                const targets = [];
                this.forEachAlivePlayer(g, pl => targets.push(pl));
                const tgt = targets.length ? targets[Math.floor(Math.random() * targets.length)] : g.player;
                const ang = Math.random() * Math.PI * 2;
                const rad = 90 + Math.random() * 260;
                const sx = Math.max(-g.arena.halfWidth + 100, Math.min(g.arena.halfWidth - 100, tgt.x + Math.cos(ang) * rad));
                const sy = Math.max(-g.arena.halfHeight + 100, Math.min(g.arena.halfHeight - 100, tgt.y + Math.sin(ang) * rad));
                this._strikes.push({ _netId: this._strikeIdSeq++, x: sx, y: sy, radius: st >= 4 ? 105 : 88, timer: 56, maxTimer: 56, kind: st >= 4 ? 'meteor' : 'lightning' });
            }
        }

        for (let i = this._strikes.length - 1; i >= 0; i--) {
            const s = this._strikes[i];
            if (!isGuest) {
                s.timer -= dt;
                if (s.timer <= 0) {
                    this._detonateStrike(s, g);
                    this._strikes.splice(i, 1);
                }
            }
        }
    }

    static _tickAcidPools(g) {
        const hasGrid = Array.isArray(g.enemies) && typeof SpatialHashGrid !== 'undefined' && SpatialHashGrid.forEachEnemyNear;
        for (const pool of this._acidPools) {
            const pHitR = Math.max(pool.rx, pool.ry) * 0.78;
            this.forEachAlivePlayer(g, (p) => {
                if (p.invulnerableTimer <= 0 && Math.hypot(p.x - pool.x, p.y - pool.y) < pHitR) {
                    p.takeDamage(6, g.effects, g.camera);
                }
            });
            if (Array.isArray(g.enemies)) {
                const eHitR = pool.rx * 0.78;
                const eHitSq = eHitR * eHitR;
                const hurtEnemy = (e) => {
                    if (!e || e.dead || e.isDying || typeof e.takeDamage !== 'function') return;
                    const dx = e.x - pool.x, dy = e.y - pool.y;
                    if (dx * dx + dy * dy < eHitSq) {
                        e.takeDamage(14, g.effects, false, false);
                    }
                };
                if (hasGrid) SpatialHashGrid.forEachEnemyNear(pool.x, pool.y, eHitR + 40, g.enemies, hurtEnemy);
                else for (let i = 0; i < g.enemies.length; i++) hurtEnemy(g.enemies[i]);
            }
        }
    }

    static _detonateStrike(s, g) {
        if (typeof EndlessHardHazards !== 'undefined') EndlessHardHazards.onStrikeDetonate(s);
        if (g.effects) {
            const col = s.kind === 'meteor' ? 'rgba(255, 46, 76, 0.92)' : 'rgba(56, 189, 248, 0.92)';
            g.effects.addShockwave(s.x, s.y, s.radius + 25, col);
            g.effects.addSparks(s.x, s.y, s.kind === 'meteor' ? '#ff2e4c' : '#38bdf8', 10);
        }
        this.forEachAlivePlayer(g, (p) => {
            if (Math.hypot(p.x - s.x, p.y - s.y) <= s.radius) {
                p.takeDamage(s.kind === 'meteor' ? 24 : 18, g.effects, g.camera);
            }
        });
        if (Array.isArray(g.enemies)) {
            const dmg = s.kind === 'meteor' ? 160 : 125;
            const hitEnemy = (e) => {
                if (!e || e.dead || e.isDying || typeof e.takeDamage !== 'function') return;
                const hitR = s.radius + (e.radius || 20);
                const dx = e.x - s.x, dy = e.y - s.y;
                if (dx * dx + dy * dy <= hitR * hitR) {
                    e.takeDamage(dmg, g.effects, true, false);
                }
            };
            if (typeof SpatialHashGrid !== 'undefined' && SpatialHashGrid.forEachEnemyNear) {
                SpatialHashGrid.forEachEnemyNear(s.x, s.y, s.radius + 60, g.enemies, hitEnemy);
            } else {
                for (let i = 0; i < g.enemies.length; i++) hitEnemy(g.enemies[i]);
            }
        }
    }

    static _updateMotes(dt, g, st) {
        const cap = (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile) ? 26 : 56;
        if (!this._motes) this._motes = [];
        const px = g.player ? g.player.x : 0, py = g.player ? g.player.y : 0;
        for (let i = this._motes.length - 1; i >= 0; i--) {
            const m = this._motes[i];
            m.x += m.vx * dt; m.y += m.vy * dt; m.life -= dt;
            if (m.life <= 0) {
                if (st === 0 && typeof EndlessHardHazards !== 'undefined') EndlessHardHazards.spawnRainSplash(m.x, m.y);
                this._motes.splice(i, 1);
            }
        }
        while (this._motes.length < cap) {
            this._motes.push({
                x: px + (Math.random() - 0.5) * 1400,
                y: py + (Math.random() - 0.5) * 900,
                vx: st === 0 ? -1.4 : (Math.random() - 0.5) * 0.9,
                vy: st === 0 ? 5.2 : (st >= 3 ? -1.5 - Math.random() : 1.1 + Math.random()),
                size: st === 0 ? 9 : (2 + Math.random() * 2.5),
                life: 55 + Math.random() * 65
            });
        }
    }

    static drawPillar(ctx, obs) {
        const st = this._stage;
        const glowCol = ['#818cf8', '#2ed573', '#38bdf8', '#ff6b35', '#ff2e4c'][st] || '#ff2e4c';
        const w = 48, h = 112, hw = w / 2;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
        ctx.beginPath(); ctx.ellipse(0, 8, 36, 13, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#222738'; ctx.strokeStyle = '#0d0f17'; ctx.lineWidth = 3.2;
        ctx.beginPath(); ctx.roundRect(-hw, -h, w, h, 5); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = glowCol; ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-10, -h + 18); ctx.lineTo(0, -h + 32); ctx.lineTo(10, -h + 18);
        ctx.moveTo(0, -h + 32); ctx.lineTo(0, -18);
        ctx.stroke();
        ctx.fillStyle = '#31364c'; ctx.strokeStyle = '#0d0f17';
        ctx.fillRect(-hw - 5, -h - 6, w + 10, 12); ctx.strokeRect(-hw - 5, -h - 6, w + 10, 12);
        ctx.fillRect(-hw - 4, -8, w + 8, 11); ctx.strokeRect(-hw - 4, -8, w + 8, 11);
        if (typeof EndlessHardHazards !== 'undefined' && EndlessHardHazards.drawPillarStageFX) {
            EndlessHardHazards.drawPillarStageFX(ctx, st, h, hw, this.age);
        }
    }

    static drawProp(ctx, obs) {
        if (typeof EndlessHardHazards !== 'undefined' && typeof EndlessHardHazards.drawHardProp === 'function') {
            return EndlessHardHazards.drawHardProp(ctx, obs, this._stage, this.age);
        }
        return false;
    }

    static drawWorldGround(ctx, cam, arena) {
        if (!this.active || !ctx) return;
        const st = this._stage;
        ctx.save();

        if (typeof EndlessHardHazards !== 'undefined') {
            if (st >= 1 && st <= 2 && typeof EndlessHardHazards.drawAcidPuddles === 'function') {
                EndlessHardHazards.drawAcidPuddles(ctx, cam, this._acidPools, st, this.age);
            }
            if (st >= 3 && typeof EndlessHardHazards.drawMagmaPools === 'function') {
                EndlessHardHazards.drawMagmaPools(ctx, cam, this._fissures, st, this.age);
            }
        }

        // Stage 4: Rotating Blood Eclipse Center Sigil
        if (st === 4) {
            ctx.save();
            ctx.rotate(this.age * 0.006);
            ctx.strokeStyle = 'rgba(255, 46, 76, 0.55)'; ctx.lineWidth = 4;
            ctx.setLineDash([28, 16]);
            ctx.beginPath(); ctx.arc(0, 0, 320, 0, Math.PI * 2); ctx.stroke();
            ctx.strokeStyle = 'rgba(254, 211, 48, 0.45)'; ctx.lineWidth = 2.5;
            ctx.strokeRect(-215, -215, 430, 430);
            ctx.restore();
        }

        if (typeof EndlessHardHazards !== 'undefined') EndlessHardHazards.drawGroundLayers(ctx, cam, st, this.age);

        // Strike Telegraphs (Lightning / Meteor rings)
        for (const s of this._strikes) {
            const prog = 1 - Math.max(0, s.timer / s.maxTimer);
            const col = s.kind === 'meteor' ? '#ff2e4c' : '#38bdf8';
            ctx.save();
            ctx.fillStyle = s.kind === 'meteor' ? 'rgba(255, 46, 76, 0.18)' : 'rgba(56, 189, 248, 0.16)';
            ctx.strokeStyle = col; ctx.lineWidth = 2.8;
            ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.arc(s.x, s.y, s.radius * prog, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
    }

    static drawWorldForeground(ctx, cam) {
        if (!this.active) return;
        if (typeof EndlessHardHazards !== 'undefined') EndlessHardHazards.drawStrikeVisuals(ctx, this._strikes);
        if (!this._motes) return;
        const st = this._stage;
        ctx.save();
        for (let i = 0; i < this._motes.length; i++) {
            const m = this._motes[i];
            if (cam && !cam.isVisible(m.x, m.y, 24)) continue;
            const fade = Math.min(1, m.life / 28);
            if (st === 0) {
                ctx.strokeStyle = `rgba(165, 180, 252, ${0.35 * fade})`;
                ctx.lineWidth = 1.6;
                ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - 4, m.y + 12); ctx.stroke();
            } else {
                const cols = ['#818cf8', '#2ed573', '#bae6fd', '#ff9f43', '#ff2e4c'];
                ctx.globalAlpha = fade * 0.72;
                ctx.fillStyle = (st >= 3 && i % 2 === 0) ? '#fed330' : (cols[st] || '#ff2e4c');
                ctx.beginPath(); ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2); ctx.fill();
            }
        }
        ctx.restore();
    }

    static drawGround(ctx, camera, arena) {
        if (!arena || !arena.cachedGroundCanvas) return false;
        if (camera) {
            const scale = arena.groundCacheScale || 1.0;
            const halfVW = (camera.canvas.width / 2) / camera.zoom + 80;
            const halfVH = (camera.canvas.height / 2) / camera.zoom + 80;
            const rawSx = Math.max(0, Math.min(arena.width - halfVW * 2, camera.x + arena.halfWidth - halfVW));
            const rawSy = Math.max(0, Math.min(arena.height - halfVH * 2, camera.y + arena.halfHeight - halfVH));
            const rawSw = Math.min(arena.width - rawSx, halfVW * 2);
            const rawSh = Math.min(arena.height - rawSy, halfVH * 2);
            if (rawSw > 0 && rawSh > 0) {
                ctx.drawImage(arena.cachedGroundCanvas, rawSx * scale, rawSy * scale, rawSw * scale, rawSh * scale, rawSx - arena.halfWidth, rawSy - arena.halfHeight, rawSw, rawSh);
            }
        } else {
            ctx.drawImage(arena.cachedGroundCanvas, -arena.halfWidth, -arena.halfHeight, arena.width, arena.height);
        }
        return true;
    }

    static drawBoundaries(ctx, arena) {
        if (!this.active || !arena) return false;
        const meta = this.getStageMeta(this._stage);
        ctx.save();
        ctx.lineWidth = 16; ctx.strokeStyle = meta.accent;
        ctx.strokeRect(-arena.halfWidth, -arena.halfHeight, arena.width, arena.height);
        ctx.lineWidth = 4; ctx.strokeStyle = '#fed330'; ctx.setLineDash([22, 18]);
        ctx.strokeRect(-arena.halfWidth + 9, -arena.halfHeight + 9, arena.width - 18, arena.height - 18);
        ctx.restore();
        return true;
    }

    static drawScreenAtmosphere(ctx, width, height) {
        if (!this.active || !ctx) return;
        const meta = this.getStageMeta(this._stage);
        ctx.save();
        ctx.fillStyle = meta.wash;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    }
}

if (typeof window !== 'undefined') window.EndlessHardMap = EndlessHardMap;
if (typeof module !== 'undefined' && module.exports) module.exports = { EndlessHardMap };
