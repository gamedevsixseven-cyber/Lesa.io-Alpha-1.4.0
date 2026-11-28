/**
 * Lesa.io - Endless Hard Mode Interactive Landmarks & Stage Hazards
 * Renders flickering Sanctuary Braziers, Frozen Storm Frost Rifts,
 * Sky Lightning Bolts, Volcanic Magma Geyser Vents, and Blood Eclipse Meteors.
 */

class EndlessHardHazards {
    static _braziers = [];
    static _frostRifts = [];
    static _vents = [];
    static _boltFlashes = [];
    static _rainSplashes = [];

    static reset() {
        const isMob = typeof MobilePerf !== 'undefined' && MobilePerf.isMobile;
        if (isMob) {
            for (const fr of this._frostRifts) {
                if (fr && fr._cache) MobilePerf.releaseCanvas(fr._cache);
            }
        }
        this._braziers = [];
        this._frostRifts = [];
        this._vents = [];
        this._boltFlashes = [];
        this._rainSplashes = [];
    }

    static seed(arena, rng = Math.random) {
        this.reset();
        // 8 Obsidian Sanctuary Braziers framing the rune ring & outer arena
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
            const dist = i % 2 === 0 ? 355 : 700;
            this._braziers.push({ x: Math.cos(a) * dist, y: Math.sin(a) * dist, phase: rng() * 6.28 });
        }
        // Stage II+ Frozen Storm Crystalline Rifts
        for (let i = 0; i < 7; i++) {
            const a = (i / 7) * Math.PI * 2 + rng() * 0.4;
            const r = 380 + rng() * 620;
            this._frostRifts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, rad: 82 + rng() * 28, rot: rng() * Math.PI });
        }
        // Stage III+ Magma Geyser Vents (cycle 0 -> windup -> erupt)
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + 0.25;
            const r = 420 + rng() * 540;
            this._vents.push({
                x: Math.cos(a) * r, y: Math.sin(a) * r,
                rad: 76, timer: 90 + Math.floor(rng() * 140), state: 'idle'
            });
        }
    }

    static spawnRainSplash(x, y) {
        if (this._rainSplashes.length >= 24) return;
        this._rainSplashes.push({ x, y, life: 16, maxLife: 16 });
    }

    static onStrikeDetonate(s) {
        if (s && s.kind === 'lightning') {
            this._boltFlashes.push({ x: s.x, y: s.y, life: 14, maxLife: 14, seed: Math.random() * 10 });
        }
    }

    static update(dt, game, stage) {
        for (let i = this._rainSplashes.length - 1; i >= 0; i--) {
            this._rainSplashes[i].life -= dt;
            if (this._rainSplashes[i].life <= 0) this._rainSplashes.splice(i, 1);
        }
        for (let i = this._boltFlashes.length - 1; i >= 0; i--) {
            this._boltFlashes[i].life -= dt;
            if (this._boltFlashes[i].life <= 0) this._boltFlashes.splice(i, 1);
        }
        const isGuest = !!(game && game.isCoopGuest);
        const p = game ? game.player : null;

        // Stage II: Frozen Storm Frost Rifts chill squad players briefly on contact
        const eachPl = (fn) => (typeof EndlessHardMap !== 'undefined' && EndlessHardMap.forEachAlivePlayer)
            ? EndlessHardMap.forEachAlivePlayer(game, fn)
            : (p && p.hp > 0 ? fn(p) : null);
        eachPl((pl) => {
            if (stage === 2 && !isGuest && pl.invulnerableTimer <= 0) {
                for (const fr of this._frostRifts) {
                    if (Math.hypot(pl.x - fr.x, pl.y - fr.y) < fr.rad * 0.82) {
                        if ((pl._frostRiftCd || 0) <= 0) {
                            pl._frostRiftCd = 36;
                            pl.speedDebuffTimer = Math.max(pl.speedDebuffTimer || 0, 34);
                            if (game.effects) game.effects.addSparks(pl.x, pl.y, '#7dd3fc', 3);
                        }
                        break;
                    }
                }
            }
            if (pl._frostRiftCd > 0) pl._frostRiftCd = Math.max(0, pl._frostRiftCd - dt);
        });

        // Stage III+: Magma Geyser Vents cycle eruption
        if (stage >= 3) {
            for (const v of this._vents) {
                v.timer -= dt;
                if (v.state === 'idle' && v.timer <= 0) {
                    v.state = 'windup';
                    v.timer = 48;
                } else if (v.state === 'windup' && v.timer <= 0) {
                    v.state = 'erupt';
                    v.timer = 26;
                    if (!isGuest && game) this._eruptVent(v, game);
                } else if (v.state === 'erupt' && v.timer <= 0) {
                    v.state = 'idle';
                    v.timer = 190 + Math.random() * 110;
                }
            }
        }
    }

    static _eruptVent(v, game) {
        if (game.effects) {
            game.effects.addShockwave(v.x, v.y, v.rad + 22, 'rgba(255, 107, 53, 0.92)');
            game.effects.addSparks(v.x, v.y, '#fed330', 10);
        }
        const hitPl = (pl) => {
            if (Math.hypot(pl.x - v.x, pl.y - v.y) <= v.rad && pl.invulnerableTimer <= 0) {
                pl.takeDamage(20, game.effects, game.camera);
            }
        };
        if (typeof EndlessHardMap !== 'undefined' && EndlessHardMap.forEachAlivePlayer) EndlessHardMap.forEachAlivePlayer(game, hitPl);
        else if (game.player) hitPl(game.player);
        if (Array.isArray(game.enemies)) {
            const rad = v.rad;
            const hitEnemy = (e) => {
                if (!e || e.dead || e.isDying || typeof e.takeDamage !== 'function') return;
                const hitR = rad + (e.radius || 20);
                const dx = e.x - v.x, dy = e.y - v.y;
                if (dx * dx + dy * dy <= hitR * hitR) {
                    e.takeDamage(110, game.effects, true, false);
                }
            };
            if (typeof SpatialHashGrid !== 'undefined' && SpatialHashGrid.forEachEnemyNear) {
                SpatialHashGrid.forEachEnemyNear(v.x, v.y, rad + 60, game.enemies, hitEnemy);
            } else {
                for (let i = 0; i < game.enemies.length; i++) hitEnemy(game.enemies[i]);
            }
        }
    }

    static drawGroundLayers(ctx, cam, stage, age) {
        const now = age * 0.05;
        this.drawStageEvolutionCircle(ctx, cam, stage, age);
        // 1. Raindrop ground ripples in Stage 0
        if (stage === 0) {
            for (const sp of this._rainSplashes) {
                if (cam && !cam.isVisible(sp.x, sp.y, 24)) continue;
                const prog = 1 - sp.life / sp.maxLife;
                ctx.strokeStyle = `rgba(165, 180, 252, ${0.42 * (1 - prog)})`;
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.ellipse(sp.x, sp.y, 4 + prog * 14, 2.5 + prog * 8, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // 2. Stage II: Layered Glacial Ice Puddles & Shattered Cryo Veins (cached per rift)
        if (stage === 2) {
            const cScale = (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile) ? 0.65 : 1.0;
            for (const fr of this._frostRifts) {
                if (cam && !cam.isVisible(fr.x, fr.y, fr.rad + 28)) continue;
                if (!fr._cache) {
                    const sz = Math.ceil(fr.rad * 2.28);
                    const c = document.createElement('canvas');
                    c.width = Math.max(16, Math.ceil(sz * cScale));
                    c.height = c.width;
                    const fctx = c.getContext('2d');
                    if (fctx) {
                        fctx.scale(cScale, cScale);
                        fctx.translate(sz * 0.5, sz * 0.5);
                        fctx.rotate(fr.rot);
                        fctx.fillStyle = 'rgba(186, 230, 253, 0.14)';
                        fctx.beginPath(); fctx.ellipse(0, 0, fr.rad * 1.06, fr.rad * 0.78, 0, 0, Math.PI * 2); fctx.fill();
                        const grad = fctx.createRadialGradient(0, 0, 8, 0, 0, fr.rad);
                        grad.addColorStop(0, 'rgba(224, 242, 254, 0.34)');
                        grad.addColorStop(0.65, 'rgba(56, 189, 248, 0.24)');
                        grad.addColorStop(1, 'rgba(12, 74, 110, 0.38)');
                        fctx.fillStyle = grad;
                        fctx.strokeStyle = '#7dd3fc';
                        fctx.lineWidth = 2.2;
                        fctx.beginPath();
                        for (let k = 0; k < 10; k++) {
                            const a = (k / 10) * Math.PI * 2;
                            const rr = fr.rad * (k % 2 === 0 ? 1.0 : 0.78);
                            const px = Math.cos(a) * rr, py = Math.sin(a) * rr * 0.74;
                            if (k === 0) fctx.moveTo(px, py); else fctx.lineTo(px, py);
                        }
                        fctx.closePath(); fctx.fill(); fctx.stroke();
                        fctx.strokeStyle = 'rgba(224, 242, 254, 0.65)'; fctx.lineWidth = 1.6;
                        for (let k = 0; k < 4; k++) {
                            const a = (k / 4) * Math.PI + 0.2;
                            fctx.beginPath();
                            fctx.moveTo(-Math.cos(a) * fr.rad * 0.65, -Math.sin(a) * fr.rad * 0.45);
                            fctx.lineTo(0, (k % 2 === 0 ? 8 : -7));
                            fctx.lineTo(Math.cos(a) * fr.rad * 0.65, Math.sin(a) * fr.rad * 0.45);
                            fctx.stroke();
                        }
                        fr._cache = c;
                        fr._sz = sz;
                    }
                }
                if (fr._cache) {
                    const hs = fr._sz * 0.5;
                    ctx.drawImage(fr._cache, fr.x - hs, fr.y - hs, fr._sz, fr._sz);
                }
            }
        }

        // 3. Stage III+: Magma Geyser Vents
        if (stage >= 3) {
            for (const v of this._vents) {
                if (cam && !cam.isVisible(v.x, v.y, v.rad + 25)) continue;
                ctx.save();
                ctx.translate(v.x, v.y);
                ctx.fillStyle = '#181014'; ctx.strokeStyle = v.state === 'windup' ? '#fed330' : '#ff6b35';
                ctx.lineWidth = v.state === 'windup' ? 3.2 : 2;
                ctx.beginPath(); ctx.ellipse(0, 0, 28, 18, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                ctx.fillStyle = v.state === 'erupt' ? '#fef08a' : (v.state === 'windup' ? '#ff9f43' : '#9a3412');
                ctx.beginPath(); ctx.ellipse(0, 0, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
                if (v.state === 'windup') {
                    const p = 1 - Math.max(0, v.timer / 48);
                    ctx.fillStyle = 'rgba(255, 107, 53, 0.16)';
                    ctx.strokeStyle = '#ff6b35'; ctx.lineWidth = 2.5;
                    ctx.beginPath(); ctx.arc(0, 0, v.rad, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                    ctx.beginPath(); ctx.arc(0, 0, v.rad * p, 0, Math.PI * 2); ctx.stroke();
                } else if (v.state === 'erupt') {
                    ctx.fillStyle = 'rgba(255, 159, 67, 0.48)';
                    ctx.beginPath(); ctx.arc(0, 0, v.rad * 0.85, 0, Math.PI * 2); ctx.fill();
                }
                ctx.restore();
            }
        }

        // 4. Flickering Sanctuary Braziers (All Stages — flame shifts by Stage)
        const flameCols = ['#818cf8', '#2ed573', '#38bdf8', '#ff6b35', '#ff2e4c'];
        const col = flameCols[stage] || '#ff2e4c';
        for (const b of this._braziers) {
            if (cam && !cam.isVisible(b.x, b.y, 70)) continue;
            const flick = 0.85 + Math.sin(now * 2.3 + b.phase) * 0.15;
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.fillStyle = col;
            ctx.globalAlpha = 0.15 * flick;
            ctx.beginPath(); ctx.arc(0, -6, 48 * flick, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#222738'; ctx.strokeStyle = '#0b0d14'; ctx.lineWidth = 2.6;
            ctx.beginPath(); ctx.ellipse(0, 0, 17, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            // Flame cone
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.moveTo(-9, -3);
            ctx.quadraticCurveTo(-5, -24 * flick, 0, -28 * flick);
            ctx.quadraticCurveTo(6, -24 * flick, 9, -3);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#fef08a';
            ctx.beginPath(); ctx.arc(0, -8, 4.5 * flick, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    }

    static drawStrikeVisuals(ctx, strikes) {
        // Descending meteor comets on meteor telegraphs + jagged sky lightning bolts on detonation
        for (const s of (strikes || [])) {
            if (s.kind !== 'meteor') continue;
            const prog = 1 - Math.max(0, s.timer / s.maxTimer);
            const fallY = s.y - (1 - prog) * 340;
            const fallX = s.x + (1 - prog) * 140;
            ctx.save();
            const grad = ctx.createLinearGradient(fallX + 55, fallY - 120, fallX, fallY);
            grad.addColorStop(0, 'rgba(255, 46, 76, 0)');
            grad.addColorStop(1, 'rgba(255, 107, 53, 0.92)');
            ctx.strokeStyle = grad; ctx.lineWidth = 10; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(fallX + 55, fallY - 120); ctx.lineTo(fallX, fallY); ctx.stroke();
            ctx.fillStyle = '#fed330'; ctx.strokeStyle = '#ff2e4c'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(fallX, fallY, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.restore();
        }
        for (const bf of this._boltFlashes) {
            const alpha = bf.life / bf.maxLife;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 6; ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(bf.x + 28, bf.y - 360);
            ctx.lineTo(bf.x - 16, bf.y - 240);
            ctx.lineTo(bf.x + 18, bf.y - 125);
            ctx.lineTo(bf.x, bf.y);
            ctx.stroke();
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.4; ctx.stroke();
            ctx.restore();
        }
    }

    static drawStageEvolutionCircle(ctx, cam, stage, age) {
        if (cam && !cam.isVisible(0, 0, 740)) return;
        const rot = age * 0.008;
        ctx.save();
        if (stage >= 1) {
            const runeCol = ['#818cf8', '#2ed573', '#38bdf8', '#ff6b35', '#ff2e4c'][stage] || '#ff2e4c';
            for (let k = 0; k < 12; k++) {
                const a = (k / 12) * Math.PI * 2 + (stage >= 2 ? rot * 0.5 : 0);
                ctx.fillStyle = runeCol;
                ctx.globalAlpha = 0.45 + Math.sin(age * 0.08 + k) * 0.25;
                ctx.beginPath(); ctx.arc(Math.cos(a) * 302, Math.sin(a) * 302, 5.5, 0, Math.PI * 2); ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
        if (stage === 2) {
            // Frozen Storm: pulsing cyan conduit beams linking the 4 inner braziers
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.22 + Math.sin(age * 0.14) * 0.14})`;
            ctx.lineWidth = 3; ctx.setLineDash([14, 10]);
            for (let i = 0; i < 4; i++) {
                const b1 = this._braziers[i * 2], b2 = this._braziers[((i + 1) % 4) * 2];
                if (b1 && b2) { ctx.beginPath(); ctx.moveTo(b1.x, b1.y); ctx.lineTo(b2.x, b2.y); ctx.stroke(); }
            }
            ctx.setLineDash([]);
        }
        if (stage >= 3) {
            ctx.save(); ctx.rotate(-rot);
            ctx.strokeStyle = stage === 4 ? 'rgba(255, 46, 76, 0.52)' : 'rgba(255, 107, 53, 0.42)';
            ctx.lineWidth = 3.2; ctx.setLineDash([22, 14]);
            ctx.beginPath(); ctx.arc(0, 0, 230, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
        }
        if (stage === 4) {
            // Blood Eclipse Orbiting Solar Crests around center sigil
            for (let i = 0; i < 4; i++) {
                const a = (i / 4) * Math.PI * 2 + rot * 1.4;
                const ex = Math.cos(a) * 320, ey = Math.sin(a) * 320;
                ctx.fillStyle = '#fed330'; ctx.strokeStyle = '#ff2e4c'; ctx.lineWidth = 2.4;
                ctx.beginPath(); ctx.arc(ex, ey, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            }
        }
        ctx.restore();
    }

    static drawPillarStageFX(ctx, stage, h, hw, age) {
        if (stage === 1) {
            // Emerald Blight glowing creeping veins & base spore slime
            ctx.fillStyle = 'rgba(46, 213, 115, 0.35)';
            ctx.beginPath(); ctx.ellipse(0, 2, hw + 10, 8, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#2ed573'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(-12, -10); ctx.lineTo(-4, -38); ctx.lineTo(-10, -68); ctx.stroke();
        } else if (stage === 2) {
            // Jagged Frozen Storm Ice Shards bursting from pillar sides
            ctx.fillStyle = '#38bdf8'; ctx.strokeStyle = '#0c4a6e'; ctx.lineWidth = 2;
            for (const s of [-1, 1]) {
                ctx.beginPath();
                ctx.moveTo(s * hw, -35); ctx.lineTo(s * (hw + 14), -52); ctx.lineTo(s * hw, -62);
                ctx.closePath(); ctx.fill(); ctx.stroke();
            }
        } else if (stage === 3) {
            // Superheated magma fissures climbing the stone
            ctx.strokeStyle = '#fed330'; ctx.lineWidth = 2.4;
            ctx.beginPath(); ctx.moveTo(-8, -14); ctx.lineTo(7, -48); ctx.lineTo(-6, -84); ctx.stroke();
        } else if (stage === 4) {
            // Floating rotating Blood-Eclipse crown halo above pillar cap
            const fy = -h - 18 + Math.sin(age * 0.08) * 3;
            ctx.strokeStyle = '#ff2e4c'; ctx.lineWidth = 2.6;
            ctx.beginPath(); ctx.ellipse(0, fy, 18, 6, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = '#fed330';
            ctx.beginPath(); ctx.arc(0, fy, 4, 0, Math.PI * 2); ctx.fill();
        }
    }

    static drawAcidPuddles(ctx, cam, pools, st, age) {
        const now = age * 0.04;
        const cScale = (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile) ? 0.65 : 1.0;
        const bubbleFill = st === 1 ? 'rgba(217, 249, 157, 0.72)' : 'rgba(224, 242, 254, 0.72)';
        for (const p of (pools || [])) {
            if (cam && !cam.isVisible(p.x, p.y, p.rx + 30)) continue;
            if (!p._cache || p._cacheStage !== st) {
                const sz = Math.ceil(Math.max(p.rx, p.ry) * 2.75);
                const c = p._cache || document.createElement('canvas');
                c.width = Math.max(16, Math.ceil(sz * cScale));
                c.height = c.width;
                const pctx = c.getContext('2d');
                if (pctx) {
                    pctx.setTransform(1, 0, 0, 1, 0, 0);
                    pctx.clearRect(0, 0, c.width, c.height);
                    pctx.scale(cScale, cScale);
                    pctx.translate(sz * 0.5, sz * 0.5);
                    pctx.rotate(p.rot);
                    pctx.fillStyle = 'rgba(4, 18, 12, 0.45)';
                    pctx.beginPath();
                    const ptsX = [], ptsY = [];
                    for (let i = 0; i < 14; i++) {
                        const a = (i / 14) * Math.PI * 2;
                        const wobble = 1 + Math.sin(a * 3 + p.phase) * 0.14 + Math.cos(a * 5 - p.phase) * 0.08;
                        const px = Math.cos(a) * p.rx * wobble, py = Math.sin(a) * p.ry * wobble;
                        ptsX.push(px); ptsY.push(py);
                        if (i === 0) pctx.moveTo(px * 1.07, py * 1.07); else pctx.lineTo(px * 1.07, py * 1.07);
                    }
                    pctx.closePath(); pctx.fill();
                    const grad = pctx.createRadialGradient(0, 0, 8, 0, 0, p.rx);
                    if (st === 1) {
                        grad.addColorStop(0, 'rgba(190, 242, 100, 0.52)');
                        grad.addColorStop(0.55, 'rgba(46, 213, 115, 0.38)');
                        grad.addColorStop(1, 'rgba(6, 78, 59, 0.45)');
                    } else {
                        grad.addColorStop(0, 'rgba(224, 242, 254, 0.48)');
                        grad.addColorStop(0.6, 'rgba(56, 189, 248, 0.34)');
                        grad.addColorStop(1, 'rgba(12, 74, 110, 0.44)');
                    }
                    pctx.fillStyle = grad;
                    pctx.strokeStyle = st === 1 ? '#2ed573' : '#7dd3fc';
                    pctx.lineWidth = 2.2;
                    pctx.beginPath();
                    for (let i = 0; i < 14; i++) {
                        if (i === 0) pctx.moveTo(ptsX[i], ptsY[i]); else pctx.lineTo(ptsX[i], ptsY[i]);
                    }
                    pctx.closePath(); pctx.fill(); pctx.stroke();
                    p._cache = c;
                    p._cacheStage = st;
                    p._sz = sz;
                }
                if (!p._bubbles) {
                    const cosR = Math.cos(p.rot), sinR = Math.sin(p.rot);
                    p._bubbles = [];
                    for (let b = 0; b < 3; b++) {
                        const lx = Math.cos(p.phase + b * 2.1) * p.rx * 0.42;
                        const ly = Math.sin(p.phase + b * 1.7) * p.ry * 0.42;
                        p._bubbles.push({
                            wx: cosR * lx - sinR * ly,
                            wy: sinR * lx + cosR * ly,
                            off: p.phase + b * 2.1
                        });
                    }
                }
            }
            if (p._cache) {
                const hs = p._sz * 0.5;
                ctx.drawImage(p._cache, p.x - hs, p.y - hs, p._sz, p._sz);
            }
            ctx.fillStyle = bubbleFill;
            for (let b = 0; b < p._bubbles.length; b++) {
                const bb = p._bubbles[b];
                const ph = (now * 0.55 + bb.off) % 3.2;
                ctx.globalAlpha = 1 - (ph / 3.2);
                ctx.beginPath(); ctx.arc(p.x + bb.wx, p.y + bb.wy, (ph / 3.2) * 8.5, 0, Math.PI * 2); ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
    }

    static drawMagmaPools(ctx, cam, fissures, st, age) {
        const pulse = 0.72 + Math.sin(age * 0.072) * 0.28;
        for (const f of (fissures || [])) {
            if (cam && !cam.isVisible(f.x, f.y, f.len + 25)) continue;
            ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot);
            // Charred obsidian scorch crust around fissure
            ctx.fillStyle = 'rgba(12, 8, 12, 0.62)';
            ctx.beginPath(); ctx.ellipse(0, 0, f.len * 0.58, 22, 0, 0, Math.PI * 2); ctx.fill();
            // Outer lava glow + hot molten core river + side vein fork
            ctx.strokeStyle = st === 4 ? `rgba(255, 46, 76, ${0.76 * pulse})` : `rgba(255, 107, 53, ${0.78 * pulse})`;
            ctx.lineWidth = 10; ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-f.len * 0.5, 0); ctx.lineTo(-f.len * 0.14, -12);
            ctx.lineTo(f.len * 0.2, 10); ctx.lineTo(f.len * 0.5, -2);
            ctx.moveTo(-f.len * 0.14, -12); ctx.lineTo(-f.len * 0.02, -26);
            ctx.stroke();
            ctx.strokeStyle = `rgba(254, 240, 138, ${0.84 * pulse})`; ctx.lineWidth = 3; ctx.stroke();
            ctx.restore();
        }
    }

    static drawHardProp(ctx, obs, stage, age) {
        if (!obs) return false;
        const flash = obs.hitFlash > 0;
        const accent = ['#818cf8', '#2ed573', '#38bdf8', '#ff6b35', '#ff2e4c'][stage] || '#ff2e4c';
        if (obs.type === 'crate') {
            // Bespoke Obsidian Runic Siege Coffer (replaces wooden crate)
            const s = obs.radius * 1.62, h = s / 2;
            ctx.lineWidth = 2.8; ctx.strokeStyle = '#0c0d14';
            ctx.fillStyle = flash ? '#ffffff' : '#1e2230';
            ctx.beginPath(); ctx.roundRect(-h, -h, s, s, 6); ctx.fill(); ctx.stroke();
            if (!flash) {
                ctx.fillStyle = '#2d3347'; ctx.fillRect(-h + 4, -h + 4, s - 8, s * 0.36);
                ctx.fillStyle = '#b45309';
                ctx.fillRect(-h, -4, s, 8); ctx.strokeRect(-h, -4, s, 8);
                for (const [cx, cy] of [[-h, -h], [h - 7, -h], [-h, h - 7], [h - 7, h - 7]]) ctx.fillRect(cx, cy, 7, 7);
                ctx.fillStyle = accent;
                ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(7, 0); ctx.lineTo(0, 8); ctx.lineTo(-7, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
            }
            return true;
        }
        if (obs.type === 'barrel') {
            // Bespoke Volatile Magma Plasma Reactor Urn (replaces TNT barrel)
            const r = obs.radius, w = r * 1.54, h = r * 1.84, hw = w / 2, hh = h / 2;
            ctx.lineWidth = 2.8; ctx.strokeStyle = '#0c0d14';
            ctx.fillStyle = flash ? '#ffffff' : '#222638';
            ctx.beginPath(); ctx.roundRect(-hw, -hh, w, h, 8); ctx.fill(); ctx.stroke();
            if (!flash) {
                const glow = 0.78 + Math.sin((age || 0) * 0.14 + obs.x) * 0.22;
                ctx.fillStyle = '#9f1239'; ctx.fillRect(-hw + 4, -hh + 8, w - 8, h - 16);
                ctx.fillStyle = `rgba(255, 46, 76, ${glow})`;
                ctx.beginPath(); ctx.arc(0, 0, r * 0.36, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#fed330';
                ctx.beginPath(); ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#d97706';
                ctx.fillRect(-hw + 1, -hh + 5, w - 2, 5);
                ctx.fillRect(-hw + 1, hh - 10, w - 2, 5);
                ctx.fillStyle = '#334155'; ctx.fillRect(-hw * 0.45, -hh - 4, w * 0.45, 6); ctx.strokeRect(-hw * 0.45, -hh - 4, w * 0.45, 6);
            }
            return true;
        }
        return false;
    }
}

if (typeof window !== 'undefined') window.EndlessHardHazards = EndlessHardHazards;
if (typeof module !== 'undefined' && module.exports) module.exports = { EndlessHardHazards };
