/**
 * Lesa.io - Outside-Arena Perimeter Village Roads & Story Mode Easter Eggs
 * Renders a 2.5D Greek village ring road wrapping all 4 edges outside the arena walls:
 *   - Concrete sidewalks with slab joints, streetlamps, crosswalks, cones, signs, & village details
 *   - Story Mode Easter Eggs:
 *       1) Petros occasionally cruising & popping random wheelies on his SYM VF185 (when hero !== 'petros')
 *       2) Occasional Greek Police Cruiser ("ΕΛ.ΑΣ. 100") slow perimeter patrol
 *       3) Reactive sleeping sidewalk cat & roadside spectator nook near the edges
 */

class OutsidePerimeterRoads {
    static activeVehicles = [];
    static spawnTimer = 180; // First drive-by ~3s into gameplay, then crisp random intervals
    static age = 0;
    static _lastScenario = null;
    static _catMeowTimer = 0;
    static _catCooldown = 0;
    static _specWaveTimer = 0;
    static _specGreetCooldown = 0;
    static _roadDecorSeeded = false;
    static _lamps = [];
    static _crosswalks = [];

    static reset() {
        this.activeVehicles = [];
        this.spawnTimer = 150 + Math.random() * 150;
        this.age = 0;
        this._lastScenario = null;
        this._catMeowTimer = 0;
        this._catCooldown = 0;
        this._specWaveTimer = 0;
        this._specGreetCooldown = 0;
    }

    static _ensureLayout(arena) {
        if (this._roadDecorSeeded && this._lastW === arena.width && this._lastH === arena.height) return;
        this._lastW = arena.width;
        this._lastH = arena.height;
        this._roadDecorSeeded = true;

        const hw = arena.halfWidth;
        const hh = arena.halfHeight;
        const lampStep = 440;
        const lamps = [];

        for (let x = -hw + 120; x <= hw - 120; x += lampStep) {
            lamps.push({ x, y: -hh - 34, side: 'N' });
            lamps.push({ x, y: hh + 34, side: 'S' });
        }
        for (let y = -hh + 140; y <= hh - 140; y += lampStep) {
            lamps.push({ x: -hw - 34, y, side: 'W' });
            lamps.push({ x: hw + 34, y, side: 'E' });
        }
        this._lamps = lamps;

        this._crosswalks = [
            { x: 0, y: -hh - 122, dir: 'h' },
            { x: 0, y: hh + 122, dir: 'h' },
            { x: -hw - 122, y: 0, dir: 'v' },
            { x: hw + 122, y: 0, dir: 'v' }
        ];
    }

    static update(dt = 1, game = null) {
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        if (!g || !g.arena || g.arena.dungeonFloor || g.arena.gameMode === 'dlc_cave') return;
        if (g.state !== 'PLAYING') return;

        this.age += dt;
        if (this._catMeowTimer > 0) this._catMeowTimer = Math.max(0, this._catMeowTimer - dt);
        if (this._catCooldown > 0) this._catCooldown = Math.max(0, this._catCooldown - dt);
        if (this._specWaveTimer > 0) this._specWaveTimer = Math.max(0, this._specWaveTimer - dt);
        if (this._specGreetCooldown > 0) this._specGreetCooldown = Math.max(0, this._specGreetCooldown - dt);

        // Active on Story Mode & Peaceful Village Endless Waves (< Wave 30)
        const waveNum = g.waveManager ? (g.waveManager.wave || 1) : 1;
        if (g.gameMode !== 'story' && !(g.gameMode === 'endless' && waveNum < 30)) {
            this.activeVehicles = [];
            return;
        }

        const hh = g.arena.halfHeight;
        if (g.player) {
            if (this._catCooldown <= 0 && Math.hypot(g.player.x + 520, g.player.y - (hh + 30)) < 380) {
                this._catMeowTimer = 140;
                this._catCooldown = 480;
            }
            if (this._specGreetCooldown <= 0 && Math.hypot(g.player.x - 320, g.player.y - (hh + 30)) < 380) {
                this._specWaveTimer = 140;
                this._specGreetCooldown = 480;
            }
        }
        if (g.player && g.waveState === 'WAVE_CLEARED' && this._specWaveTimer <= 0) {
            this._specWaveTimer = 150;
        }

        if (this.activeVehicles.length > 0) {
            for (let i = this.activeVehicles.length - 1; i >= 0; i--) {
                if (this._updateVehicle(this.activeVehicles[i], dt, g.arena, g.effects, g.player)) {
                    this.activeVehicles.splice(i, 1);
                }
            }
            if (this.activeVehicles.length === 0) {
                // Pause 4 to 8 seconds before the next perimeter Easter egg
                this.spawnTimer = 240 + Math.random() * 240;
            }
            return;
        }

        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this._spawnRandomTraffic(g);
        }
    }

    static _pickScenario(heroType) {
        const noPetros = heroType !== 'petros';
        const no50 = heroType !== '50balos';
        const pool = [];
        if (noPetros) pool.push({ id: 'petros_alone', w: 1.0 });
        if (noPetros) pool.push({ id: 'petros_wheelie', w: 1.35 });
        if (noPetros) pool.push({ id: 'petros_police_chase', w: 1.4 });
        if (noPetros && no50) pool.push({ id: 'petros_and_50balos', w: 1.45 });
        if (no50) pool.push({ id: '50balos_alone', w: 1.3 });
        if (!noPetros && no50) pool.push({ id: '50balos_police_chase', w: 1.4 });
        pool.push({ id: 'police_alone', w: 0.45 });

        const filtered = (pool.length > 1) ? pool.filter(s => s.id !== this._lastScenario) : pool;
        let total = 0;
        for (const s of filtered) total += s.w;
        let roll = Math.random() * total;
        for (const s of filtered) {
            roll -= s.w;
            if (roll <= 0) return s.id;
        }
        return filtered[0].id;
    }

    static _makeVehicleSpec(arena, kind, edgeIdx, dirSign, laneOffset, trailBack, speed, opts = {}) {
        const hw = arena.halfWidth;
        const hh = arena.halfHeight;
        const roadCenter = 122;
        const spanX = hw + roadCenter;
        const spanY = hh + roadCenter;
        const p = opts.player || null;
        let x = 0; let y = 0; let vx = 0; let vy = 0;

        if (edgeIdx === 0 || edgeIdx === 1) {
            const leadX = p ? Math.max(-spanX - 180, Math.min(spanX + 180, p.x - dirSign * 780)) : (dirSign > 0 ? -spanX - 160 : spanX + 160);
            x = leadX - dirSign * trailBack;
            y = (edgeIdx === 0 ? -hh - roadCenter : hh + roadCenter) + laneOffset;
            vx = dirSign * speed;
        } else {
            const leadY = p ? Math.max(-spanY - 180, Math.min(spanY + 180, p.y - dirSign * 580)) : (dirSign > 0 ? -spanY - 160 : spanY + 160);
            x = (edgeIdx === 2 ? -hw - roadCenter : hw + roadCenter) - laneOffset;
            y = leadY - dirSign * trailBack;
            vy = dirSign * speed;
        }

        return {
            kind,
            x,
            y,
            vx,
            vy,
            angle: Math.atan2(vy, vx),
            spin: 0,
            age: 0,
            enteredView: false,
            viewAge: 0,
            willWheelie: !!opts.willWheelie,
            wheelieDelay: opts.wheelieDelay !== undefined ? opts.wheelieDelay : 12 + Math.random() * 34,
            wheelieDur: opts.wheelieDur !== undefined ? opts.wheelieDur : 85 + Math.random() * 55,
            wheeliePitch: 0,
            keepFormation: !!opts.keepFormation,
            bubbleText: opts.bubbleText || null,
            bubbleColor: opts.bubbleColor || '#ff4785',
            bubbleOffsetY: opts.bubbleOffsetY || -48,
            bubbleShown: false,
            limitX: spanX + 340,
            limitY: spanY + 340
        };
    }

    static _spawnRandomTraffic(game) {
        const arena = game.arena;
        const p = game.player;
        const hw = arena.halfWidth;
        const hh = arena.halfHeight;

        let edgeIdx = Math.floor(Math.random() * 4);
        if (p) {
            const dN = Math.abs(p.y + hh), dS = Math.abs(hh - p.y);
            const dW = Math.abs(p.x + hw), dE = Math.abs(hw - p.x);
            const minD = Math.min(dN, dS, dW, dE);
            if (minD < 1100 && Math.random() < 0.92) {
                if (minD === dN) edgeIdx = 0;
                else if (minD === dS) edgeIdx = 1;
                else if (minD === dW) edgeIdx = 2;
                else edgeIdx = 3;
            }
        }

        const dirSign = Math.random() < 0.5 ? 1 : -1;
        const mainLane = dirSign * 26;
        const adjLane = -dirSign * 26;
        const scenario = this._pickScenario(p ? p.heroType : '');
        this._lastScenario = scenario;

        if (scenario === 'petros_alone') {
            this.activeVehicles = [
                this._makeVehicleSpec(arena, 'petros_vf185', edgeIdx, dirSign, mainLane, 0, 6.6, {
                    player: p, bubbleText: 'CHILL RIDE 🏍️', bubbleColor: '#ff4785'
                })
            ];
        } else if (scenario === 'petros_wheelie') {
            this.activeVehicles = [
                this._makeVehicleSpec(arena, 'petros_vf185', edgeIdx, dirSign, mainLane, 0, 7.0, {
                    player: p, willWheelie: true, wheelieDelay: 4 + Math.random() * 14, wheelieDur: 120 + Math.random() * 45,
                    bubbleText: 'SOUZA!! 🏍️🔥', bubbleColor: '#ff4785'
                })
            ];
        } else if (scenario === 'petros_police_chase') {
            this.activeVehicles = [
                this._makeVehicleSpec(arena, 'petros_vf185', edgeIdx, dirSign, mainLane, 0, 7.5, {
                    player: p, willWheelie: Math.random() < 0.70, wheelieDelay: 6, wheelieDur: 90, keepFormation: true,
                    bubbleText: 'DEN ME PIANEIS! 💨', bubbleColor: '#ff4785'
                }),
                this._makeVehicleSpec(arena, 'police_car', edgeIdx, dirSign, mainLane, 145, 7.45, {
                    player: p, keepFormation: true, bubbleText: 'ΣΤΑΜΑΤΑ ΡΕ!! 🚨', bubbleColor: '#38bdf8', bubbleOffsetY: -62
                })
            ];
        } else if (scenario === '50balos_police_chase') {
            this.activeVehicles = [
                this._makeVehicleSpec(arena, '50balos_cryptonx', edgeIdx, dirSign, mainLane, 0, 7.5, {
                    player: p, willWheelie: Math.random() < 0.65, wheelieDelay: 6, wheelieDur: 90, keepFormation: true,
                    bubbleText: 'DEN ME PIANEIS! 💶💨', bubbleColor: '#f8fafc'
                }),
                this._makeVehicleSpec(arena, 'police_car', edgeIdx, dirSign, mainLane, 145, 7.45, {
                    player: p, keepFormation: true, bubbleText: 'ΣΤΑΜΑΤΑ ΡΕ!! 🚨', bubbleColor: '#38bdf8', bubbleOffsetY: -62
                })
            ];
        } else if (scenario === 'petros_and_50balos') {
            this.activeVehicles = [
                this._makeVehicleSpec(arena, 'petros_vf185', edgeIdx, dirSign, mainLane, 0, 7.0, {
                    player: p, willWheelie: Math.random() < 0.55, keepFormation: true,
                    bubbleText: 'PAME VOLTA! 🏍️', bubbleColor: '#ff4785', bubbleOffsetY: -46
                }),
                this._makeVehicleSpec(arena, '50balos_cryptonx', edgeIdx, dirSign, adjLane, 36, 7.05, {
                    player: p, willWheelie: Math.random() < 0.45, keepFormation: true,
                    bubbleText: 'CRYPTON X!! 🤍💶', bubbleColor: '#f8fafc', bubbleOffsetY: -74
                })
            ];
        } else if (scenario === '50balos_alone') {
            const stunt = Math.random() < 0.55;
            this.activeVehicles = [
                this._makeVehicleSpec(arena, '50balos_cryptonx', edgeIdx, dirSign, mainLane, 0, 6.8, {
                    player: p, willWheelie: stunt, wheelieDelay: 6 + Math.random() * 16, wheelieDur: 100 + Math.random() * 45,
                    bubbleText: stunt ? 'CRYPTON SOUZA!! 💶🔥' : 'WHITE CRYPTON X 🤍', bubbleColor: '#f8fafc'
                })
            ];
        } else {
            this.activeVehicles = [
                this._makeVehicleSpec(arena, 'police_car', edgeIdx, dirSign, mainLane, 0, 5.6, { player: p })
            ];
        }
    }

    static _updateVehicle(v, dt, arena, effects, player = null) {
        v.age += dt;
        const horiz = Math.abs(v.vx) >= Math.abs(v.vy);
        const nearPlayer = player ? (Math.abs(v.x - player.x) < 760 && Math.abs(v.y - player.y) < 680) : true;
        const inArenaSpan = nearPlayer && (horiz ? (Math.abs(v.x) < arena.halfWidth * 0.94) : (Math.abs(v.y) < arena.halfHeight * 0.94));
        if (inArenaSpan) {
            if (!v.enteredView) v.enteredView = true;
            v.viewAge += dt;
        }

        const isMoto = (v.kind === 'petros_vf185' || v.kind === '50balos_cryptonx');
        const inWheelie = isMoto && v.willWheelie && v.enteredView && v.viewAge >= v.wheelieDelay && v.viewAge <= v.wheelieDelay + v.wheelieDur;
        const speedMult = (inWheelie && !v.keepFormation) ? 1.28 : 1.0;

        v.x += v.vx * speedMult * dt;
        v.y += v.vy * speedMult * dt;
        v.spin += (Math.hypot(v.vx, v.vy) * speedMult * 0.05 + 0.08) * dt;

        if (isMoto) {
            const targetPitch = inWheelie ? -0.46 : 0;
            v.wheeliePitch += (targetPitch - v.wheeliePitch) * Math.min(1, 0.22 * dt);

            if (effects && (inWheelie || Math.random() < 0.22 * dt)) {
                const bx = v.x - Math.cos(v.angle) * 26;
                const by = v.y - Math.sin(v.angle) * 14 + 8;
                effects.addDust(bx, by, 1, inWheelie ? 7 : 4);
                if (inWheelie && Math.random() < 0.58 * dt) {
                    const sparkCol = v.kind === '50balos_cryptonx' ? '#facc15' : (Math.random() < 0.5 ? '#ff4785' : '#fed330');
                    effects.addSparks(bx, by, sparkCol, 2);
                }
            }
        }

        if (!v.bubbleShown && v.enteredView && v.bubbleText) {
            v.bubbleShown = true;
            if (effects) effects.addComicSplash(v.x, v.y + v.bubbleOffsetY, v.bubbleText, v.bubbleColor, 15);
        }

        const exited = (v.vx > 0 && v.x > v.limitX) || (v.vx < 0 && v.x < -v.limitX)
            || (v.vy > 0 && v.y > v.limitY) || (v.vy < 0 && v.y < -v.limitY)
            || v.age > 1400;
        return exited;
    }

    static drawRoads(ctx, camera, arena) {
        if (!arena || arena.dungeonFloor || arena.gameMode === 'dlc_cave') return;
        this._ensureLayout(arena);

        const hw = arena.halfWidth;
        const hh = arena.halfHeight;
        const padIn = 48;
        const roadW = 148;
        const padOut = padIn + roadW;
        const swOut = padOut + 46;

        // Quick reject if camera is well inside the center arena away from all walls
        if (camera && camera.canvas) {
            const effZoom = Math.max(0.1, (camera.zoom || 1) * (camera.dpr || 1));
            const halfVW = (camera.canvas.width * 0.5) / effZoom + 80;
            const halfVH = (camera.canvas.height * 0.5) / effZoom + 80;
            if (Math.abs(camera.x) + halfVW < hw && Math.abs(camera.y) + halfVH < hh) return;
        }

        ctx.save();
        // 1. Concrete Outer Sidewalk Apron Frame (evenodd cutout keeps inner arena grass untouched)
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.rect(-hw - swOut, -hh - swOut, arena.width + swOut * 2, arena.height + swOut * 2);
        ctx.rect(-hw, -hh, arena.width, arena.height);
        ctx.fill('evenodd');

        // Sidewalk inner grass strip (already drawn inside arena by Arena) -> stroke curb edge around arena wall
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 4;
        ctx.strokeRect(-hw - swOut, -hh - swOut, arena.width + swOut * 2, arena.height + swOut * 2);

        // 2. Dark Charcoal Asphalt Perimeter Ring Road
        const rInW = arena.width + padIn * 2;
        const rInH = arena.height + padIn * 2;
        const rOutW = arena.width + padOut * 2;
        const rOutH = arena.height + padOut * 2;

        ctx.fillStyle = '#2f3542';
        ctx.beginPath();
        ctx.rect(-hw - padOut, -hh - padOut, rOutW, rOutH);
        ctx.rect(hw + padIn, -hh - padIn, -rInW, rInH); // Counter-clockwise cutout keeps inner meadow clear
        ctx.fill('evenodd');

        // Crisp concrete road curbs
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 3.5;
        ctx.strokeRect(-hw - padOut, -hh - padOut, rOutW, rOutH);
        ctx.strokeRect(-hw - padIn, -hh - padIn, rInW, rInH);

        // 3. White road shoulder lines + Yellow-Gold dashed centerline
        const midOff = (padIn + padOut) * 0.5;
        ctx.strokeStyle = 'rgba(241, 245, 249, 0.72)';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-hw - padIn - 10, -hh - padIn - 10, rInW + 20, rInH + 20);
        ctx.strokeRect(-hw - padOut + 10, -hh - padOut + 10, rOutW - 20, rOutH - 20);

        ctx.strokeStyle = '#fed330';
        ctx.lineWidth = 3.5;
        ctx.setLineDash([34, 28]);
        ctx.strokeRect(-hw - midOff, -hh - midOff, arena.width + midOff * 2, arena.height + midOff * 2);
        ctx.setLineDash([]);

        // 4. Zebra Crosswalks at Cardinal Centers
        ctx.fillStyle = '#f8fafc';
        for (let i = 0; i < this._crosswalks.length; i++) {
            const cw = this._crosswalks[i];
            if (camera && !camera.isVisible(cw.x, cw.y, 160)) continue;
            ctx.save();
            ctx.translate(cw.x, cw.y);
            if (cw.dir === 'v') ctx.rotate(Math.PI * 0.5);
            for (let s = -48; s <= 48; s += 24) {
                ctx.fillRect(s - 6, -42, 12, 84);
            }
            ctx.restore();
        }

        // 5. Outer Roadside Landmarks (Spectator Bench + Sleepy Cat + Streetlamps)
        this._drawRoadsideDetails(ctx, camera, hw, hh);
        ctx.restore();
    }

    static _drawRoadsideDetails(ctx, camera, hw, hh) {
        const isDusk = (typeof EndlessMapEvolution !== 'undefined' && EndlessMapEvolution.active && EndlessMapEvolution.duskLevel > 0.25);

        // Sidewalk Streetlamps
        for (let i = 0; i < this._lamps.length; i++) {
            const l = this._lamps[i];
            if (camera && !camera.isVisible(l.x, l.y, 90)) continue;
            ctx.save();
            ctx.translate(l.x, l.y);
            if (isDusk) {
                ctx.fillStyle = 'rgba(255, 211, 82, 0.25)';
                ctx.beginPath();
                ctx.arc(0, -10, 44, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
            ctx.beginPath(); ctx.ellipse(2, 6, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#334155';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2;
            ctx.fillRect(-3, -24, 6, 26);
            ctx.strokeRect(-3, -24, 6, 26);
            ctx.fillStyle = isDusk ? '#fff200' : '#fef08a';
            ctx.beginPath(); ctx.arc(0, -26, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.restore();
        }

        // Roadside Easter Egg Props: Sleepy Village Cat (-520, hh + 30) & Kafenio Spectators (320, hh + 30)
        const catX = -520, catY = hh + 30;
        if (!camera || camera.isVisible(catX, catY, 80)) {
            ctx.save();
            ctx.translate(catX, catY);
            ctx.fillStyle = '#e74c3c'; ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.ellipse(0, 3, 20, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.scale(1.28, 1.28);
            ctx.fillStyle = '#e67e22'; ctx.strokeStyle = '#18181b'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.ellipse(0, 0, 11, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.arc(9, -3, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(5, -7); ctx.lineTo(7, -13); ctx.lineTo(10, -8); ctx.moveTo(11, -8); ctx.lineTo(14, -13); ctx.lineTo(15, -7); ctx.fill(); ctx.stroke();
            ctx.strokeStyle = '#d35400'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(-10, 0); ctx.quadraticCurveTo(-18, -6, -14, -11); ctx.stroke();
            ctx.font = 'bold 12px Fredoka, sans-serif'; ctx.textAlign = 'center';
            ctx.fillStyle = this._catMeowTimer > 0 ? '#ff9f1a' : '#fef08a';
            ctx.strokeStyle = '#18181b'; ctx.lineWidth = 2.8;
            const txt = this._catMeowTimer > 0 ? 'MEOW! 🐾' : ((Math.floor(this.age / 45) % 2 === 0) ? 'zZ' : 'zZz');
            ctx.strokeText(txt, 0, -18 - Math.sin(this.age * 0.08) * 3);
            ctx.fillText(txt, 0, -18 - Math.sin(this.age * 0.08) * 3);
            ctx.restore();
        }

        // Roadside Spectator Kafenio Bench (South-East sidewalk)
        const spX = 320, spY = hh + 30;
        if (!camera || camera.isVisible(spX, spY, 100)) {
            ctx.save();
            ctx.translate(spX, spY);
            ctx.fillStyle = '#8d5524'; ctx.strokeStyle = '#18181b'; ctx.lineWidth = 2.4;
            ctx.beginPath(); ctx.roundRect(-28, -7, 56, 14, 3); ctx.fill(); ctx.stroke();
            for (const vx of [-12, 12]) {
                const hop = this._specWaveTimer > 0 ? Math.abs(Math.sin(this.age * 0.25 + vx)) * 4 : 0;
                ctx.fillStyle = vx < 0 ? '#1e90ff' : '#eb4d4b';
                ctx.beginPath(); ctx.arc(vx, -8 - hop, 7.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                ctx.fillStyle = '#f5cd79';
                ctx.beginPath(); ctx.arc(vx, -17 - hop, 5.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            }
            if (this._specWaveTimer > 0) {
                ctx.font = 'bold 12px Fredoka, sans-serif'; ctx.textAlign = 'center';
                ctx.fillStyle = '#fed330'; ctx.strokeStyle = '#18181b'; ctx.lineWidth = 2.8;
                ctx.strokeText('OPA! 👏', 0, -30);
                ctx.fillText('OPA! 👏', 0, -30);
            }
            ctx.restore();
        }
    }

    static drawTraffic(ctx, camera, arena) {
        if (!arena || arena.dungeonFloor || arena.gameMode === 'dlc_cave' || !this.activeVehicles.length) return;
        const list = (this.activeVehicles.length > 1)
            ? [...this.activeVehicles].sort((a, b) => a.y - b.y)
            : this.activeVehicles;

        for (let i = 0; i < list.length; i++) {
            const v = list[i];
            if (camera && !camera.isVisible(v.x, v.y, 160)) continue;

            ctx.save();
            ctx.translate(v.x, v.y);

            if (v.kind === 'petros_vf185' && typeof VF185Model !== 'undefined') {
                // Highlight dark obsidian VF185 sharply against dark road asphalt
                ctx.fillStyle = 'rgba(255, 71, 133, 0.30)';
                ctx.beginPath(); ctx.ellipse(0, 12, 46, 16, 0, 0, Math.PI * 2); ctx.fill();
                ctx.scale(1.14, 1.14);
                const ghostPetros = {
                    x: v.x, y: v.y, vx: v.vx, vy: v.vy,
                    angle: v.angle, vf185Angle: v.angle, _vfWheelSpin: v.spin,
                    radius: 26, isDashing: v.wheeliePitch < -0.15
                };
                VF185Model.drawMountedPetros(ghostPetros, ctx, false, v.wheeliePitch);
            } else if (v.kind === '50balos_cryptonx' && typeof CryptonXModel !== 'undefined') {
                ctx.fillStyle = 'rgba(254, 211, 48, 0.28)';
                ctx.beginPath(); ctx.ellipse(0, 12, 44, 15, 0, 0, Math.PI * 2); ctx.fill();
                ctx.scale(1.14, 1.14);
                const ghost50 = {
                    x: v.x, y: v.y, vx: v.vx, vy: v.vy,
                    angle: v.angle, _spin: v.spin,
                    radius: 24, wheeliePitch: v.wheeliePitch
                };
                CryptonXModel.drawMounted50Balos(ghost50, ctx, false, v.wheeliePitch);
            } else {
                this._drawPoliceCar(ctx, v);
            }

            ctx.restore();
        }
    }

    static _drawPoliceCar(ctx, v) {
        const horiz = Math.abs(v.vx) >= Math.abs(v.vy);
        ctx.save();
        if (!horiz) ctx.rotate(v.vy > 0 ? Math.PI * 0.5 : -Math.PI * 0.5);
        else if (v.vx < 0) ctx.scale(-1, 1);

        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
        ctx.beginPath(); ctx.ellipse(0, 12, 44, 15, 0, 0, Math.PI * 2); ctx.fill();

        // Tires
        ctx.fillStyle = '#141519';
        ctx.strokeStyle = '#090a0d';
        ctx.lineWidth = 2;
        for (const wx of [-25, 25]) {
            ctx.beginPath(); ctx.arc(wx, 10, 9.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#94a3b8';
            ctx.beginPath(); ctx.arc(wx, 10, 4.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#141519';
        }

        // White Police Sedan Body + Aegean Blue Door Panel ("100")
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(-42, 6); ctx.lineTo(-40, -10); ctx.lineTo(-18, -24);
        ctx.lineTo(14, -24); ctx.lineTo(30, -10); ctx.lineTo(44, -6);
        ctx.lineTo(44, 7); ctx.closePath();
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#0d5eaf';
        ctx.fillRect(-16, -9, 32, 14);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('100', 0, 1);

        // Windshield
        ctx.fillStyle = '#7dd3fc';
        ctx.beginPath(); ctx.moveTo(-14, -21); ctx.lineTo(11, -21); ctx.lineTo(23, -10); ctx.lineTo(-18, -10); ctx.closePath(); ctx.fill(); ctx.stroke();

        // Flashing Red / Blue Siren Bar
        const strobe = Math.floor(v.age / 7) % 2 === 0;
        ctx.fillStyle = strobe ? '#ff3838' : '#1e90ff';
        ctx.fillRect(-8, -29, 8, 5);
        ctx.fillStyle = strobe ? '#1e90ff' : '#ff3838';
        ctx.fillRect(0, -29, 8, 5);
        ctx.strokeRect(-8, -29, 16, 5);

        ctx.fillStyle = strobe ? 'rgba(255, 56, 56, 0.28)' : 'rgba(30, 144, 255, 0.28)';
        ctx.beginPath(); ctx.arc(0, -27, 26, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.OutsidePerimeterRoads = OutsidePerimeterRoads;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OutsidePerimeterRoads;
}
