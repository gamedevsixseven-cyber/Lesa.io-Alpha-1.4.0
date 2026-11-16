/**
 * Lesa.io - Endless Mode Wave Skipper Machine
 * Chronotech reactor pedestal that spawns in Endless Mode starting Wave 3.
 * Consumes Chrono Core enemy drops (starting at 3, scaling +1 per warp up to 5;
 * core capacity capped at current warp cost) to warp up to +5 waves ahead —
 * always stopping at any upcoming Boss or Mini-Boss wave (every 5 waves)
 * and granting zero XP, drops, buffs, or power-ups for skipped waves.
 */

class WaveSkipperMachine {
    constructor() {
        this.reset();
    }

    reset(game = null) {
        this.active = false;
        this.x = 0;
        this.y = -220;
        this.radius = WaveSkipperMachine.RADIUS;
        this.age = 0;
        this.warpBurstTimer = 0;
        this.activationCooldown = 0;
        this.playerInRange = false;
        this.skipsUsed = 0;
        if (game && game.player) {
            game.player.chronoCores = 0;
        }
    }

    static getRequiredCost(skipsUsed = 0) {
        const extra = Math.max(0, Math.floor(skipsUsed || 0));
        return Math.min(WaveSkipperMachine.MAX_COST, WaveSkipperMachine.COST + extra);
    }

    static getMaxCores(skipsUsed = 0) {
        return WaveSkipperMachine.getRequiredCost(skipsUsed);
    }

    getCurrentCost() {
        return WaveSkipperMachine.getRequiredCost(this.skipsUsed);
    }

    static grantChronoCore(player, amount = 1, effects = null, x = null, y = null, game = null) {
        if (!player) return { added: 0, overflow: 0, maxCores: WaveSkipperMachine.COST };
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        const skipsUsed = (g && g.waveSkipper) ? (g.waveSkipper.skipsUsed || 0) : 0;
        const maxCores = WaveSkipperMachine.getMaxCores(skipsUsed);
        const gain = Math.max(1, Math.floor(amount || 1));
        const current = Math.max(0, player.chronoCores || 0);
        const room = Math.max(0, maxCores - current);
        const added = Math.min(gain, room);
        const overflow = gain - added;

        player.chronoCores = current + added;
        const px = (x !== null) ? x : player.x;
        const py = (y !== null) ? y : player.y;

        if (added > 0) {
            if (window.soundEngine) window.soundEngine.playPickup('star');
            if (effects) {
                const capTag = player.chronoCores >= maxCores ? ' (MAX)' : '';
                effects.addPopup(px, py, `+${added} CHRONO CORE${capTag}`, '#00f5ff', 24);
                effects.addSparks(px, py, '#00f5ff', 10);
            }
        }

        if (overflow > 0) {
            const bonusXp = 45 * overflow;
            const bonusScore = 120 * overflow;
            if (typeof player.addXP === 'function') player.addXP(bonusXp);
            player.score = (player.score || 0) + bonusScore;
            if (window.soundEngine && added === 0) window.soundEngine.playPickup('xp');
            if (effects && added === 0) {
                effects.addPopup(px, py, `CORES FULL! +${bonusXp} XP`, '#ffd32a', 22);
                effects.addSparks(px, py, '#ffd32a', 8);
            }
        }

        return { added, overflow, maxCores };
    }

    static getSkipInfo(currentWave, waveState, gameMode, cores = 0, skipsUsed = 0) {
        const cost = WaveSkipperMachine.getRequiredCost(skipsUsed);
        if (gameMode !== 'endless') {
            return { active: false, canSkip: false, targetWave: null, isBossTarget: false, cost, maxCores: cost, skipsUsed, reason: '' };
        }
        if (currentWave < WaveSkipperMachine.APPEAR_WAVE) {
            return { active: false, canSkip: false, targetWave: null, isBossTarget: false, cost, maxCores: cost, skipsUsed, reason: `WARPS IN WAVE ${WaveSkipperMachine.APPEAR_WAVE}` };
        }

        const isBossWaveFn = (w) => (typeof EndlessWaveDirector !== 'undefined')
            ? (EndlessWaveDirector.isBossWave(w) || EndlessWaveDirector.isMiniBossWave(w))
            : (w > 0 && w % 5 === 0);

        // Cannot flee or bypass an active Boss or Mini-Boss encounter
        if (waveState === 'IN_PROGRESS' && isBossWaveFn(currentWave)) {
            return { active: true, canSkip: false, targetWave: null, isBossTarget: false, cost, maxCores: cost, skipsUsed, reason: 'DEFEAT BOSS FIRST!' };
        }

        // Jump up to +5 waves, stopping at the earliest Boss / Mini-Boss milestone ahead
        let targetWave = currentWave + WaveSkipperMachine.MAX_SKIP;
        let isBossTarget = false;
        for (let w = currentWave + 1; w <= currentWave + WaveSkipperMachine.MAX_SKIP; w++) {
            if (isBossWaveFn(w)) {
                targetWave = w;
                isBossTarget = true;
                break;
            }
        }

        // Prevent burning cores during WAVE_CLEARED when the very next natural wave is already that target
        if (waveState === 'WAVE_CLEARED' && targetWave <= currentWave + 1) {
            return { active: true, canSkip: false, targetWave, isBossTarget, cost, maxCores: cost, skipsUsed, reason: 'BOSS INCOMING NEXT!' };
        }

        if (cores < cost) {
            return {
                active: true,
                canSkip: false,
                targetWave,
                isBossTarget,
                cost,
                maxCores: cost,
                skipsUsed,
                reason: `NEED CORES (${cores}/${cost})`
            };
        }

        return { active: true, canSkip: true, targetWave, isBossTarget, cost, maxCores: cost, skipsUsed, reason: '' };
    }

    ensureSpawned(game) {
        if (this.active || !game || game.gameMode !== 'endless' || !game.waveManager) return;
        if (game.waveManager.wave < WaveSkipperMachine.APPEAR_WAVE) return;

        const pos = this.findSafeSpot(game.arena);
        this.x = pos.x;
        this.y = pos.y;
        this.active = true;
        this.warpBurstTimer = 40;

        if (game.effects) {
            game.effects.addShockwave(this.x, this.y, 140, 'rgba(0, 245, 255, 0.88)');
            game.effects.addSparks(this.x, this.y, '#00f5ff', 14);
            game.effects.addComicSplash(this.x, this.y - 54, '⏳ WAVE SKIPPER ONLINE!');
        }
        if (game.ui && typeof game.ui.addKillfeed === 'function') {
            game.ui.addKillfeed(`⏳ Wave Skipper Machine deployed! Collect ${this.getCurrentCost()} Chrono Cores to warp ahead.`);
        }
    }

    findSafeSpot(arena) {
        const candidates = [
            { x: 0, y: -220 }, { x: 220, y: -160 }, { x: -220, y: -160 },
            { x: 0, y: 240 }, { x: 240, y: 140 }, { x: -240, y: 140 }
        ];
        const obstacles = (arena && Array.isArray(arena.obstacles)) ? arena.obstacles : [];
        for (const pt of candidates) {
            let blocked = false;
            for (let i = 0; i < obstacles.length; i++) {
                const o = obstacles[i];
                if (!o || o.dead) continue;
                const minDist = (o.radius || 30) + this.radius + 26;
                if (Math.hypot(pt.x - o.x, pt.y - o.y) < minDist) {
                    blocked = true;
                    break;
                }
            }
            if (!blocked) return pt;
        }
        return { x: 0, y: -220 };
    }

    update(dt, game) {
        if (!game || game.gameMode !== 'endless') return;
        this.ensureSpawned(game);
        if (!this.active) return;

        this.age += dt;
        if (this.warpBurstTimer > 0) this.warpBurstTimer = Math.max(0, this.warpBurstTimer - dt);
        if (this.activationCooldown > 0) this.activationCooldown = Math.max(0, this.activationCooldown - dt);

        this.resolveCollisions(game);

        if (game.player) {
            const dist = Math.hypot(game.player.x - this.x, game.player.y - this.y);
            this.playerInRange = dist <= WaveSkipperMachine.INTERACT_RANGE;
        } else {
            this.playerInRange = false;
        }
    }

    resolveCollisions(game) {
        const pushOut = (ent) => {
            if (!ent || ent.dead || ent.isAirborne) return;
            const dx = ent.x - this.x;
            const dy = ent.y - this.y;
            const radSum = (ent.radius || 20) + this.radius;
            const distSq = dx * dx + dy * dy;
            if (distSq < radSum * radSum) {
                const dist = Math.sqrt(distSq) || 0.001;
                const nx = dx / dist;
                const ny = dy / dist;
                ent.x = this.x + nx * radSum;
                ent.y = this.y + ny * radSum;
            }
        };

        pushOut(game.player);
        if (Array.isArray(game.enemies)) {
            for (let i = 0; i < game.enemies.length; i++) {
                pushOut(game.enemies[i]);
            }
        }
    }

    tryActivate(game) {
        if (!game || game.gameMode !== 'endless' || !this.active || game.isCoopGuest) return false;
        if (this.activationCooldown > 0 || !game.player || game.player.hp <= 0) return false;
        if (game.isCutsceneActive && game.isCutsceneActive()) return false;
        if (game.bossWarningOverlay && game.bossWarningOverlay.active) return false;

        const dist = Math.hypot(game.player.x - this.x, game.player.y - this.y);
        if (dist > WaveSkipperMachine.INTERACT_RANGE) {
            if (game.effects) game.effects.addComicSplash(game.player.x, game.player.y - 42, 'WALK TO MACHINE!');
            if (window.soundEngine) window.soundEngine.playGoBack();
            return false;
        }

        const wm = game.waveManager;
        const cores = game.player.chronoCores || 0;
        const info = WaveSkipperMachine.getSkipInfo(wm.wave, wm.waveState, game.gameMode, cores, this.skipsUsed);
        if (!info.canSkip || !info.targetWave) {
            if (game.effects && info.reason) {
                game.effects.addComicSplash(this.x, this.y - 62, info.reason, '#ff6b6b');
            }
            if (window.soundEngine) window.soundEngine.playGoBack();
            return false;
        }

        // Consume Chrono Cores, step up next warp cost, and warp cleanly with ZERO skipped-wave XP, drops, crates, or power-ups
        game.player.chronoCores = Math.max(0, cores - info.cost);
        this.skipsUsed += 1;
        this.activationCooldown = 45;
        this.warpBurstTimer = 45;

        game.enemies.length = 0;
        game.bullets.length = 0;
        if (game.hazards) game.hazards.length = 0;

        if (game.camera) game.camera.addShake(9);
        if (game.effects) {
            game.effects.addShockwave(this.x, this.y, 175, 'rgba(0, 245, 255, 0.94)');
            game.effects.addSparks(this.x, this.y, '#00f5ff', 18);
            game.effects.addSparks(game.player.x, game.player.y, '#fed330', 12);
            if (typeof game.effects.triggerScreenFlash === 'function') {
                game.effects.triggerScreenFlash('#00f5ff', 0.35, 22);
            }
            game.effects.addComicSplash(this.x, this.y - 64, `⚡ WARP → WAVE ${info.targetWave}!`);
        }
        if (window.soundEngine) {
            window.soundEngine.playSelect();
        }
        if (game.ui && typeof game.ui.addKillfeed === 'function') {
            game.ui.addKillfeed(`⏳ Time Warp activated → Endless Wave ${info.targetWave}!`);
        }

        wm.startWave(info.targetWave, game.player, game.enemies, game.effects);
        return true;
    }

    draw(ctx, camera = null) {
        if (!this.active) return;
        if (camera && !camera.isVisible(this.x, this.y, 150)) return;

        const g = (typeof window !== 'undefined') ? window.gameInstance : null;
        const wm = g ? g.waveManager : null;
        const cores = (g && g.player) ? (g.player.chronoCores || 0) : 0;
        const costNow = this.getCurrentCost();
        const info = wm
            ? WaveSkipperMachine.getSkipInfo(wm.wave, wm.waveState, g.gameMode, cores, this.skipsUsed)
            : { active: true, canSkip: false, targetWave: null, isBossTarget: false, cost: costNow, reason: `NEED CORES (0/${costNow})` };

        const r = this.radius;
        const pulse = 0.72 + Math.sin(this.age * 0.12) * 0.28;
        const readyGlow = info.canSkip;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Ground shadow & pulsing Chrono Ring
        ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
        ctx.beginPath();
        ctx.ellipse(0, r * 0.82, r * 1.32, r * 0.50, 0, 0, Math.PI * 2);
        ctx.fill();

        if (readyGlow || this.warpBurstTimer > 0) {
            ctx.strokeStyle = `rgba(0, 245, 255, ${0.85 * pulse})`;
            ctx.lineWidth = 3.5;
            ctx.setLineDash([12, 8]);
            ctx.lineDashOffset = -this.age * 1.4;
            ctx.beginPath();
            ctx.ellipse(0, r * 0.72, WaveSkipperMachine.INTERACT_RANGE * 0.56, WaveSkipperMachine.INTERACT_RANGE * 0.24, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        this._drawPedestalAndCoils(ctx, r, cores, readyGlow, info.cost || costNow);
        this._drawHologramHUD(ctx, r, cores, info);

        ctx.restore();
    }

    _drawPedestalAndCoils(ctx, r, cores, readyGlow, cost = WaveSkipperMachine.COST) {
        const hover = Math.sin(this.age * 0.09) * 3.5;
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#141418';

        // Heavy Steel & Brass Base Platform
        ctx.fillStyle = '#2f3640';
        ctx.beginPath();
        ctx.roundRect(-r * 1.04, r * 0.14, r * 2.08, r * 0.68, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#57606f';
        ctx.beginPath();
        ctx.roundRect(-r * 0.88, -r * 0.42, r * 1.76, r * 0.74, 10);
        ctx.fill();
        ctx.stroke();

        // Flanking Brass Tesla Stabilizer Coils
        for (const side of [-1, 1]) {
            ctx.fillStyle = '#e67e22';
            ctx.beginPath();
            ctx.roundRect(side * r * 0.84 - r * 0.18, -r * 0.68, r * 0.36, r * 0.78, 6);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = readyGlow ? '#00f5ff' : '#74b9ff';
            ctx.beginPath();
            ctx.arc(side * r * 0.84, -r * 0.74, r * 0.19, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        // Electric Arc Connecting Coils when fully powered
        if (readyGlow) {
            ctx.strokeStyle = '#00f5ff';
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.moveTo(-r * 0.82, -r * 0.74);
            ctx.lineTo(-r * 0.28, -r * 0.88 + Math.sin(this.age * 0.9) * 5);
            ctx.lineTo(r * 0.28, -r * 0.68 + Math.cos(this.age * 0.9) * 5);
            ctx.lineTo(r * 0.82, -r * 0.74);
            ctx.stroke();
        }

        // Rotating Top Chrono Cogwheel & Glass Chamber
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#141418';
        ctx.fillStyle = 'rgba(116, 185, 255, 0.34)';
        ctx.beginPath();
        ctx.roundRect(-r * 0.48, -r * 0.86, r * 0.96, r * 0.76, 10);
        ctx.fill();
        ctx.stroke();

        // Levitating Chrono Core Prism inside Chamber
        ctx.save();
        ctx.translate(0, -r * 0.48 + hover);
        ctx.fillStyle = readyGlow ? '#00f5ff' : '#fed330';
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.28);
        ctx.lineTo(r * 0.22, 0);
        ctx.lineTo(0, r * 0.28);
        ctx.lineTo(-r * 0.22, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Dynamic Front Chrono Core Charge Tubes (light up cyan-gold per Core owned)
        const tubeCount = Math.max(1, cost || WaveSkipperMachine.COST);
        const span = r * 1.24;
        const tubeW = Math.min(r * 0.24, (span / tubeCount) * 0.78);
        const step = (tubeCount > 1) ? (span / (tubeCount - 1)) : 0;
        for (let i = 0; i < tubeCount; i++) {
            const lit = cores > i;
            const bx = (tubeCount > 1) ? (-span * 0.5 + i * step) : 0;
            ctx.fillStyle = lit ? '#00f5ff' : '#1e272e';
            ctx.beginPath();
            ctx.roundRect(bx - tubeW * 0.5, r * 0.10, tubeW, r * 0.40, Math.min(4, tubeW * 0.35));
            ctx.fill();
            ctx.stroke();
        }
    }

    _drawHologramHUD(ctx, r, cores, info) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const cost = info.cost || WaveSkipperMachine.COST;
        let label = info.reason || `CORES: ${cores}/${cost}`;
        let col = '#70a1ff';
        if (info.canSkip) {
            const bossIcon = info.isBossTarget ? ' 👑' : '';
            label = `SKIP → W${info.targetWave}${bossIcon}`;
            col = '#00f5ff';
        } else if (info.reason === 'DEFEAT BOSS FIRST!') {
            col = '#ff4757';
        } else if (info.reason === 'BOSS INCOMING NEXT!') {
            col = '#fed330';
        }

        const pillY = -r * 1.24;
        ctx.font = '900 12px "Fredoka", Arial, sans-serif';
        const pillW = Math.max(122, ctx.measureText(label).width + 24);
        ctx.fillStyle = 'rgba(20, 20, 24, 0.88)';
        ctx.strokeStyle = col;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.roundRect(-pillW / 2, pillY - 12, pillW, 24, 9);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = col;
        ctx.fillText(label, 0, pillY);

        if (this.playerInRange && info.canSkip) {
            const promptY = pillY - 26 + Math.sin(this.age * 0.2) * 3;
            const promptText = `[F] WARP (-${cost} CORES)`;
            const pw = Math.max(136, ctx.measureText(promptText).width + 24);
            ctx.fillStyle = '#fed330';
            ctx.strokeStyle = '#141418';
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.roundRect(-pw / 2, promptY - 12, pw, 24, 9);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#141418';
            ctx.fillText(promptText, 0, promptY);
        }
    }

    drawMinimapMarker(ctx, arena, w, h) {
        if (!this.active || !arena || !ctx) return;
        const scaleX = w / arena.width;
        const scaleY = h / arena.height;
        const mx = (arena.halfWidth ? (this.x + arena.halfWidth) : this.x) * scaleX;
        const my = (arena.halfHeight ? (this.y + arena.halfHeight) : this.y) * scaleY;

        ctx.save();
        ctx.translate(mx, my);
        ctx.fillStyle = '#00f5ff';
        ctx.strokeStyle = '#141418';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(5, 0);
        ctx.lineTo(0, 5);
        ctx.lineTo(-5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    renderScreenOverlay(ctx, width, height, game) {
        if (!this.active || !game || game.gameMode !== 'endless' || !game.camera || !game.player) return;
        const cores = game.player.chronoCores || 0;
        const info = WaveSkipperMachine.getSkipInfo(game.waveManager.wave, game.waveManager.waveState, game.gameMode, cores, this.skipsUsed);
        if (!info.canSkip) return;

        const sp = game.camera.worldToScreen(this.x, this.y);
        const margin = 58;
        const onScreen = sp.x >= margin && sp.x <= width - margin && sp.y >= margin && sp.y <= height - margin;
        if (onScreen) return;

        const ang = Math.atan2(sp.y - height / 2, sp.x - width / 2);
        const ix = Math.max(margin, Math.min(width - margin, width / 2 + Math.cos(ang) * (width * 0.42)));
        const iy = Math.max(margin + 40, Math.min(height - margin, height / 2 + Math.sin(ang) * (height * 0.38)));

        ctx.save();
        ctx.translate(ix, iy);
        ctx.rotate(ang);
        ctx.fillStyle = '#00f5ff';
        ctx.strokeStyle = '#141418';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(-9, -10);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-9, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.font = '900 11px "Fredoka", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#141418';
        ctx.lineWidth = 3;
        const tag = `SKIP W${info.targetWave}`;
        ctx.strokeText(tag, ix, iy + 22);
        ctx.fillStyle = '#00f5ff';
        ctx.fillText(tag, ix, iy + 22);
        ctx.restore();
    }
}

WaveSkipperMachine.APPEAR_WAVE = 3;
WaveSkipperMachine.COST = 3;
WaveSkipperMachine.MAX_COST = 5;
WaveSkipperMachine.MAX_SKIP = 5;
WaveSkipperMachine.RADIUS = 36;
WaveSkipperMachine.INTERACT_RANGE = 112;

if (typeof window !== 'undefined') {
    window.WaveSkipperMachine = WaveSkipperMachine;
}
