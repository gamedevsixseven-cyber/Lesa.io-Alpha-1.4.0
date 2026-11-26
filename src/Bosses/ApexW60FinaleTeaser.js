/**
 * Lesa.io - Wave 60 Hard Mode Finale & Lit Cavern DLC Teaser ("Chapter III: The Sunless Depths")
 * Concludes Hard Endless after Wave 60 with a 5-stage visual transition:
 *   COLLAPSE -> FALL -> AWAKEN_DARK -> CAVE_REVEAL -> TO_BE_CONTINUED -> Hard Victory Modal
 */

class ApexW60FinaleTeaser {
    static active = false;
    static phase = 'IDLE';
    static timer = 0;
    static elapsed = 0;
    static promptReady = false;
    static _promptUnlockMs = 0;
    static _listenersBound = false;

    static _lightCanvas = null;
    static _lightCtx = null;
    static _slabs = null;
    static _debris = null;
    static _spores = null;
    static _crystals = null;
    static _stones = null;
    static _fissures = null;
    static _mossClusters = null;

    static start(game = null) {
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        if (this.active) return;

        this.active = true;
        this.phase = 'COLLAPSE';
        this.timer = 132;
        this.elapsed = 0;
        this.promptReady = false;
        this._promptUnlockMs = 0;
        this._bindInputs();
        this._initGeometry();

        if (g && g.cutsceneOverlay && g.cutsceneOverlay.active) g.cutsceneOverlay.endCutscene();
        if (typeof document !== 'undefined') {
            document.getElementById('game-hud')?.classList.add('cutscene-hidden');
            document.getElementById('mobile-controls-container')?.classList.add('cutscene-hidden');
        }
        if (g && g.camera && typeof g.camera.addShake === 'function') g.camera.addShake(11);
        if (typeof window !== 'undefined' && window.soundEngine && typeof window.soundEngine.playNoiseCrack === 'function') {
            window.soundEngine.playNoiseCrack(0, 0.35, 0.55);
        }
        if (g && g.coopSession && g.coopSession.isHost && g.coopSession.net) {
            g.coopSession.net.send('HARD_W60_FINALE', { kind: 'start' });
        }
    }

    static reset() {
        this.active = false;
        this.phase = 'IDLE';
        this.timer = 0;
        this.elapsed = 0;
        this.promptReady = false;
        this._promptUnlockMs = 0;
        if (typeof document !== 'undefined') {
            document.getElementById('game-hud')?.classList.remove('cutscene-hidden');
            document.getElementById('mobile-controls-container')?.classList.remove('cutscene-hidden');
            this._restoreGameOverModal();
        }
    }

    static _bindInputs() {
        if (this._listenersBound || typeof window === 'undefined') return;
        this._listenersBound = true;
        const tryAdvance = () => {
            if (!this.active || this.phase !== 'TO_BE_CONTINUED' || !this.promptReady) return;
            if (performance.now() < this._promptUnlockMs) return;
            this.completeToVictory(window.gameInstance, false);
        };
        window.addEventListener('pointerdown', (e) => { if (!e || e.isPrimary !== false) tryAdvance(); });
        window.addEventListener('keydown', (e) => {
            if (e && !e.repeat && (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE')) tryAdvance();
        });
    }

    static _initGeometry() {
        this._slabs = Array.from({ length: 16 }, (_, i) => ({
            ang: (i / 16) * Math.PI * 2 + (i % 2) * 0.14,
            dist: 0.12 + (i % 3) * 0.10, sz: 0.052 + (i % 4) * 0.014, spd: 0.7 + (i % 3) * 0.35, rot: i * 0.45
        }));
        this._debris = Array.from({ length: 48 }, (_, i) => ({
            nx: 0.09 + ((i * 73) % 82) / 100, ny: ((i * 37) % 100) / 100,
            sz: 2.4 + (i % 5) * 1.35, spd: 0.017 + (i % 4) * 0.008, hot: i % 4 === 0
        }));
        this._spores = Array.from({ length: 78 }, (_, i) => ({
            nx: ((i * 53 + 11) % 100) / 100, ny: ((i * 29 + 7) % 100) / 100,
            r: 1.4 + (i % 4) * 0.85, ph: i * 0.7, vx: (((i % 7) - 3) * 0.00024), vy: -(0.0005 + (i % 4) * 0.00022),
            color: i % 4 === 0 ? '#38bdf8' : (i % 4 === 1 ? '#fed330' : (i % 4 === 2 ? '#c084fc' : '#22d3ee'))
        }));
        this._stones = Array.from({ length: 38 }, (_, i) => ({
            nx: 0.14 + ((i * 37 + 9) % 72) / 100, ny: 0.26 + ((i * 23 + 5) % 40) / 100,
            rx: 0.014 + (i % 4) * 0.0055, ry: 0.008 + (i % 3) * 0.0038, rot: ((i * 19) % 10) * 0.25 - 1.1,
            tone: i % 3 === 0 ? 'rgba(38,52,74,0.62)' : (i % 3 === 1 ? 'rgba(15,23,42,0.78)' : 'rgba(51,65,85,0.38)')
        }));
        this._fissures = [
            [[0.23, 0.38], [0.27, 0.40], [0.30, 0.43], [0.28, 0.47], [0.25, 0.50]],
            [[0.61, 0.36], [0.65, 0.39], [0.68, 0.41], [0.66, 0.45]],
            [[0.36, 0.58], [0.32, 0.60], [0.27, 0.59], [0.22, 0.62]],
            [[0.59, 0.57], [0.63, 0.60], [0.67, 0.61], [0.72, 0.64]]
        ];
        this._mossClusters = [
            [0.24, 0.50, 0.045], [0.27, 0.52, 0.032], [0.38, 0.58, 0.042], [0.40, 0.60, 0.028],
            [0.60, 0.44, 0.040], [0.63, 0.46, 0.030], [0.77, 0.56, 0.044], [0.74, 0.58, 0.032]
        ];
        this._crystals = [
            { nx: 0.16, ny: 0.54, sc: 1.30, hue: '#22d3ee', dark: '#0e7490', glow: 'rgba(34, 211, 238, 0.34)' },
            { nx: 0.26, ny: 0.33, sc: 1.00, hue: '#c084fc', dark: '#6b21a8', glow: 'rgba(192, 132, 252, 0.32)' },
            { nx: 0.75, ny: 0.33, sc: 1.12, hue: '#38bdf8', dark: '#0369a1', glow: 'rgba(56, 189, 248, 0.34)' },
            { nx: 0.84, ny: 0.54, sc: 1.32, hue: '#a855f7', dark: '#581c87', glow: 'rgba(168, 85, 247, 0.36)' },
            { nx: 0.33, ny: 0.59, sc: 0.86, hue: '#22d3ee', dark: '#155e75', glow: 'rgba(34, 211, 238, 0.28)' }
        ];
    }

    static update(dt = 1, game = null) {
        if (!this.active) return;
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        this.elapsed += dt;

        for (let i = 0; i < (this._spores ? this._spores.length : 0); i++) {
            const s = this._spores[i];
            s.nx = (s.nx + s.vx * dt + 1) % 1;
            s.ny = (s.ny + s.vy * dt + 1) % 1;
        }
        if (this.phase === 'COLLAPSE') {
            this.timer -= dt;
            if (g && g.camera && typeof g.camera.addShake === 'function' && Math.floor(this.elapsed) % 6 === 0) {
                g.camera.addShake(Math.min(12, 3 + (1 - Math.max(0, this.timer) / 132) * 8));
            }
            if (this.timer <= 0) {
                this.phase = 'FALL'; this.timer = 144;
                if (typeof window !== 'undefined' && window.soundEngine && typeof window.soundEngine.playNoiseCrack === 'function') {
                    window.soundEngine.playNoiseCrack(0, 0.45, 0.6);
                }
            }
        } else if (this.phase === 'FALL') {
            this.timer -= dt;
            for (let i = 0; i < (this._debris ? this._debris.length : 0); i++) {
                this._debris[i].ny = (this._debris[i].ny - this._debris[i].spd * dt + 1) % 1;
            }
            if (this.timer <= 0) { this.phase = 'AWAKEN_DARK'; this.timer = 78; }
        } else if (this.phase === 'AWAKEN_DARK') {
            this.timer -= dt;
            if (this.timer <= 0) { this.phase = 'CAVE_REVEAL'; this.timer = 240; }
        } else if (this.phase === 'CAVE_REVEAL') {
            this.timer -= dt;
            if (this.timer <= 0) {
                this.phase = 'TO_BE_CONTINUED';
                this.promptReady = true;
                this._promptUnlockMs = performance.now() + 700;
            }
        }
    }

    static completeToVictory(game = null, fromCoop = false) {
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        if (!this.active) return;
        if (!fromCoop && g && g.coopSession && g.coopSession.isHost && g.coopSession.net) {
            g.coopSession.net.send('HARD_W60_FINALE', { kind: 'victory' });
        }
        this.reset();
        if (!g || typeof g.gameOver !== 'function') return;
        g._hardEndlessVictory = true;
        g.gameOver();
        g._hardEndlessVictory = false;
        this._applyVictoryModalOverride();
    }

    static _applyVictoryModalOverride() {
        if (typeof document === 'undefined') return;
        const modal = document.getElementById('game-over-modal');
        if (!modal) return;
        modal.dataset.hardVictory = '1';
        const title = modal.querySelector('.modal-title'), sub = modal.querySelector('.modal-subtitle'), wave = document.getElementById('stat-wave');
        if (title) { title.textContent = '👑 HARD MODE CONQUERED!'; title.style.color = '#fed330'; }
        if (sub) sub.textContent = 'Omega shattered — you fell into the Sunless Cavern... To Be Continued!';
        if (wave) wave.textContent = 'Wave 60 (Omega Vanquished!)';
    }

    static _restoreGameOverModal() {
        if (typeof document === 'undefined') return;
        const modal = document.getElementById('game-over-modal');
        if (!modal || !modal.dataset.hardVictory) return;
        delete modal.dataset.hardVictory;
        const title = modal.querySelector('.modal-title'), sub = modal.querySelector('.modal-subtitle');
        if (title) { title.textContent = 'K.O.! GAME OVER'; title.style.color = 'var(--comic-red)'; }
        if (sub) sub.textContent = 'Skatmir and Casillas got you this time!';
    }

    static draw(ctx, w, h, game) {
        if (!this.active || !ctx || w <= 0 || h <= 0) return;
        ctx.save();
        if (this.phase === 'COLLAPSE') this._drawCollapse(ctx, w, h, game);
        else if (this.phase === 'FALL') this._drawAbyssalFall(ctx, w, h, game);
        else this._drawCavernScene(ctx, w, h, game);

        if (this.phase === 'COLLAPSE' || this.phase === 'FALL') {
            this._drawLetterbox(ctx, w, h, 'HARD WAVE 60 • FINAL SEAL BROKEN',
                this.phase === 'COLLAPSE' ? 'THE SANCTUM FLOOR COLLAPSES BENEATH YOU...' : 'PLUNGING INTO THE SUNLESS ABYSS...');
        } else if (this.phase === 'CAVE_REVEAL') {
            this._drawLetterbox(ctx, w, h, 'UNKNOWN DEPTHS • BENEATH THE CITADEL', 'A FORGOTTEN CAVERN STIRS FAR BELOW THE RUINS...');
        }
        ctx.restore();
    }

    static _drawCollapse(ctx, w, h, game) {
        const p = Math.max(0, Math.min(1, 1 - this.timer / 132)), cx = w * 0.5, cy = h * 0.52;
        const pitR = Math.max(w, h) * (0.04 + Math.pow(p, 1.35) * 0.44);
        const g = ctx.createRadialGradient(cx, cy, pitR * 0.15, cx, cy, pitR * 1.45);
        g.addColorStop(0, 'rgba(3, 2, 10, 0.98)'); g.addColorStop(0.68, 'rgba(18, 6, 28, 0.88)');
        g.addColorStop(0.84, 'rgba(255, 46, 76, 0.52)'); g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, pitR * 1.45, 0, Math.PI * 2); ctx.fill();

        for (const s of this._slabs) {
            const r = pitR * (0.55 + s.dist * (1 - p * 0.65)), sx = cx + Math.cos(s.ang + p * 0.12) * r, sy = cy + Math.sin(s.ang + p * 0.12) * r * 0.72 + p * 26;
            const bw = Math.min(w, h) * s.sz * (1 - p * 0.4);
            ctx.save(); ctx.translate(sx, sy); ctx.rotate(s.rot + p * s.spd);
            ctx.fillStyle = '#18181b'; ctx.strokeStyle = p > 0.45 ? '#fed330' : '#ff2e4c'; ctx.lineWidth = 2;
            ctx.fillRect(-bw * 0.5, -bw * 0.35, bw, bw * 0.7); ctx.strokeRect(-bw * 0.5, -bw * 0.35, bw, bw * 0.7);
            ctx.restore();
        }
        if (p > 0.50) {
            const drop = (p - 0.50) / 0.50;
            this._drawCutsceneHero(ctx, cx, cy + drop * 28, Math.min(w, h) * 0.048 * (1 - drop * 0.25),
                drop * 0.45, 1, game, { airborne: true, moving: true, walkCycle: this.elapsed * 0.35, angle: 0.4 + drop });
        }
    }

    static _drawAbyssalFall(ctx, w, h, game) {
        const p = Math.max(0, Math.min(1, 1 - this.timer / 144)), cx = w * 0.5, skyY = h * (0.31 - p * 0.15), minD = Math.min(w, h);
        const sky = ctx.createRadialGradient(cx, skyY, 8, cx, skyY, Math.max(w, h) * 0.8);
        sky.addColorStop(0, `rgba(140, 29, 74, ${0.48 * (1 - p * 0.6)})`);
        sky.addColorStop(0.42, '#0b0817'); sky.addColorStop(1, '#020309');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

        // Soft volumetric breach sky portal & jagged shatter rays high above
        const holeR = Math.max(18, minD * 0.34 * Math.pow(1 - p * 0.86, 1.4));
        const portal = ctx.createRadialGradient(cx, skyY, holeR * 0.08, cx, skyY, holeR * 1.45);
        portal.addColorStop(0, `rgba(254, 240, 138, ${0.72 * (1 - p * 0.55)})`);
        portal.addColorStop(0.40, `rgba(249, 115, 22, ${0.46 * (1 - p * 0.65)})`);
        portal.addColorStop(0.75, `rgba(190, 24, 93, ${0.26 * (1 - p * 0.72)})`);
        portal.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = portal; ctx.beginPath(); ctx.arc(cx, skyY, holeR * 1.45, 0, Math.PI * 2); ctx.fill();

        // Dark vertical chasm cliff ledges & rim strata rushing upward
        const shaftScroll = (this.elapsed * 18) % (h * 0.25);
        for (const side of [-1, 1]) {
            ctx.beginPath();
            const edgeX = side < 0 ? 0 : w;
            ctx.moveTo(edgeX, 0);
            for (let k = 0; k <= 6; k++) {
                const ry = k * h * 0.25 - shaftScroll, ledge = w * (0.115 + Math.sin(k * 2.1 + side) * 0.032);
                ctx.lineTo(side < 0 ? ledge : w - ledge, ry);
            }
            ctx.lineTo(edgeX, h); ctx.closePath();
            ctx.fillStyle = '#040710'; ctx.fill();
            ctx.strokeStyle = 'rgba(51, 65, 85, 0.38)'; ctx.lineWidth = 2; ctx.stroke();
        }

        ctx.lineCap = 'round';
        for (const d of this._debris) {
            const x = d.nx * w, y = d.ny * h, tail = 38 + d.sz * 9;
            ctx.strokeStyle = d.hot ? `rgba(254, 211, 48, ${0.48 * (1 - p * 0.5)})` : `rgba(148, 163, 184, ${0.32 * (1 - p * 0.6)})`;
            ctx.lineWidth = d.sz * 0.45; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - tail); ctx.stroke();
        }

        // Actual equipped player hero tumbling through the chasm with upward motion afterimage
        const heroY = h * (0.47 + p * 0.14), heroR = minD * (0.068 - p * 0.040), heroRot = Math.sin(p * Math.PI * 3) * 0.40 + p * 2.6;
        this._drawCutsceneHero(ctx, cx, heroY - heroR * 1.05, heroR * 0.96, heroRot - 0.14, 0.24 * (1 - p * 0.5),
            game, { airborne: true, moving: true, walkCycle: this.elapsed * 0.42 - 0.5, angle: p * 1.4 });
        this._drawCutsceneHero(ctx, cx, heroY, heroR, heroRot, 1 - p * 0.45,
            game, { airborne: true, moving: true, walkCycle: this.elapsed * 0.42, angle: p * 1.4 });

        if (p > 0.64) { ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, (p - 0.64) / 0.32)})`; ctx.fillRect(0, 0, w, h); }
    }

    static _drawCavernScene(ctx, w, h, game) {
        const t = this.elapsed * 0.04, minD = Math.min(w, h);
        let darkMask = 0;
        if (this.phase === 'AWAKEN_DARK') darkMask = 1.0 - Math.pow(Math.max(0, (1 - this.timer / 78) - 0.35) / 0.65, 1.4) * 0.45;
        else if (this.phase === 'CAVE_REVEAL') darkMask = Math.max(0, 0.55 * (1 - Math.min(1, (1 - this.timer / 240) * 1.45)));

        // 1. Subterranean Basalt Slate Floor, Stones, Irregular Cracks & Clustered Moss
        const bg = ctx.createRadialGradient(w * 0.5, h * 0.46, 30, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
        bg.addColorStop(0, '#243247'); bg.addColorStop(0.52, '#111a2c'); bg.addColorStop(1, '#040710');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

        for (const st of (this._stones || [])) {
            ctx.save(); ctx.translate(w * st.nx, h * st.ny); ctx.rotate(st.rot); ctx.fillStyle = st.tone;
            ctx.beginPath(); ctx.ellipse(0, 0, minD * st.rx, minD * st.ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }
        ctx.strokeStyle = 'rgba(2, 6, 23, 0.46)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (const pts of (this._fissures || [])) {
            ctx.beginPath(); pts.forEach(([fx, fy], idx) => idx ? ctx.lineTo(w * fx, h * fy) : ctx.moveTo(w * fx, h * fy)); ctx.stroke();
        }
        for (const [mx, my, mr] of (this._mossClusters || [])) {
            ctx.fillStyle = 'rgba(21, 128, 61, 0.24)';
            ctx.beginPath(); ctx.ellipse(w * mx, h * my, minD * mr, minD * mr * 0.55, 0.2, 0, Math.PI * 2); ctx.fill();
        }

        // 2. Reflective Underground Whisper Pool (cleanly positioned clear of walls & crystals)
        const px = w * 0.69, py = h * 0.51, prx = w * 0.095, pry = h * 0.048;
        const poolG = ctx.createRadialGradient(px, py, 5, px, py, prx);
        poolG.addColorStop(0, 'rgba(34, 211, 238, 0.42)'); poolG.addColorStop(0.62, 'rgba(14, 116, 144, 0.34)'); poolG.addColorStop(1, 'rgba(2, 6, 23, 0)');
        ctx.fillStyle = poolG; ctx.beginPath(); ctx.ellipse(px, py, prx, pry, -0.06, 0, Math.PI * 2); ctx.fill();
        for (let rk = 0; rk < 2; rk++) {
            const rw = ((t * 0.32 + rk * 0.5) % 1);
            ctx.strokeStyle = `rgba(125, 211, 252, ${0.40 * (1 - rw)})`; ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.ellipse(px, py, prx * (0.24 + rw * 0.58), pry * (0.24 + rw * 0.58), -0.06, 0, Math.PI * 2); ctx.stroke();
        }

        // 3. Enclosed Multi-Tier 2.5D Cliff Massifs, Stalactites, Perspective Steps & Fog Gate
        this._drawCavernArchitecture(ctx, w, h, t);
        this._drawCrystalsAndTorches(ctx, w, h, t);

        // 4. Fall Impact Crater & Real Equipped Hero Standing Inside Skylight
        const cx = w * 0.5, cy = h * 0.55;
        const crG = ctx.createRadialGradient(cx, cy, minD * 0.015, cx, cy, minD * 0.11);
        crG.addColorStop(0, 'rgba(30, 41, 59, 0.85)'); crG.addColorStop(0.55, 'rgba(56, 189, 248, 0.16)'); crG.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = crG; ctx.beginPath(); ctx.ellipse(cx, cy, minD * 0.11, minD * 0.052, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.36)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(cx, cy, minD * 0.088, minD * 0.040, 0, 0, Math.PI * 2); ctx.stroke();
        for (let ca = 0; ca < 6; ca++) {
            const ang = ca * 1.05 + 0.3;
            ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * minD * 0.045, cy + Math.sin(ang) * minD * 0.02);
            ctx.lineTo(cx + Math.cos(ang) * minD * 0.098, cy + Math.sin(ang) * minD * 0.046); ctx.stroke();
        }

        const revealP = this.phase === 'CAVE_REVEAL' ? Math.max(0, Math.min(1, 1 - this.timer / 240)) : (this.phase === 'TO_BE_CONTINUED' ? 1 : 0);
        const heroY = h * 0.535 - (this.phase === 'AWAKEN_DARK' ? 16 : (1 - Math.min(1, revealP * 3.2)) * 14);
        this._drawCutsceneHero(ctx, cx, heroY, minD * 0.048, 0, Math.min(1, 0.45 + revealP * 0.55),
            game, { airborne: false, moving: false, walkCycle: 0, angle: -0.22 });

        this._drawDynamicLightmap(ctx, w, h, heroY, t);
        this._drawGodRaysAndSpores(ctx, w, h, t);
        this._drawForegroundFraming(ctx, w, h);

        if (darkMask > 0.005) { ctx.fillStyle = `rgba(0, 0, 0, ${darkMask})`; ctx.fillRect(0, 0, w, h); }
        if (this.phase === 'TO_BE_CONTINUED') this._drawToBeContinued(ctx, w, h, t);
    }

    static _drawCavernArchitecture(ctx, w, h, t) {
        const minD = Math.min(w, h);
        const fillPoly = (pts, fill, stroke, lw = 2) => {
            ctx.fillStyle = fill; ctx.beginPath();
            pts.forEach(([x, y], idx) => idx ? ctx.lineTo(w * x, h * y) : ctx.moveTo(w * x, h * y));
            ctx.closePath(); ctx.fill();
            if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
        };
        // Enclosed 2.5D Left & Right Cliff Massifs (no open void edges)
        fillPoly([[0, 0], [0.22, 0], [0.16, 0.24], [0.10, 0.44], [0.13, 0.62], [0.19, 0.80], [0, 0.86]], '#070b14', '#1e293b', 2.2);
        fillPoly([[0, 0], [0.18, 0], [0.13, 0.21], [0.07, 0.41], [0.09, 0.58], [0.13, 0.72], [0, 0.76]], '#121b2d', '#334155', 1.6);
        fillPoly([[1, 0], [0.78, 0], [0.84, 0.24], [0.90, 0.44], [0.87, 0.62], [0.81, 0.80], [1, 0.86]], '#070b14', '#1e293b', 2.2);
        fillPoly([[1, 0], [0.82, 0], [0.87, 0.21], [0.93, 0.41], [0.91, 0.58], [0.87, 0.72], [1, 0.76]], '#121b2d', '#334155', 1.6);

        // Vaulted Upper Ceiling Canopy + Integrated Organic Hanging Stalactite Formations
        fillPoly([[0, 0], [0.43, 0], [0.44, 0.08], [0.38, 0.16], [0.34, 0.15], [0.31, 0.22], [0.28, 0.16], [0.23, 0.24], [0.19, 0.18], [0.14, 0.23], [0.08, 0.18], [0, 0.22]], '#050811');
        fillPoly([[1, 0], [0.57, 0], [0.56, 0.08], [0.62, 0.16], [0.66, 0.15], [0.69, 0.22], [0.72, 0.16], [0.77, 0.24], [0.81, 0.18], [0.86, 0.23], [0.92, 0.18], [1, 0.22]], '#050811');

        // Perspective Trapezoid Stone Steps leading to Sanctum Arch
        for (let st = 0; st < 5; st++) {
            const sy = h * (0.44 - st * 0.026), tw = minD * (0.16 - st * 0.012), bw = tw * 1.10, sh = Math.max(7, h * 0.022);
            fillPoly([[0.5 - tw * 0.5 / w, sy / h], [0.5 + tw * 0.5 / w, sy / h], [0.5 + bw * 0.5 / w, (sy + sh) / h], [0.5 - bw * 0.5 / w, (sy + sh) / h]],
                st % 2 === 0 ? '#1b263b' : '#243249', 'rgba(148, 163, 184, 0.24)', 1.2);
        }

        // Abyssal Fog Gate Arch & Carved Obsidian Pillars
        const ax = w * 0.5, ay = h * 0.25, aw = minD * 0.155, ah = minD * 0.16;
        const archG = ctx.createRadialGradient(ax, ay, aw * 0.08, ax, ay, aw * 0.85);
        archG.addColorStop(0, `rgba(224, 242, 254, ${0.44 + 0.18 * Math.sin(t * 1.9)})`);
        archG.addColorStop(0.45, `rgba(168, 85, 247, ${0.58 + 0.18 * Math.sin(t * 1.9)})`);
        archG.addColorStop(1, 'rgba(15, 23, 42, 0.92)');
        ctx.fillStyle = archG;
        ctx.beginPath(); ctx.arc(ax, ay, aw * 0.62, Math.PI, 0); ctx.lineTo(ax + aw * 0.62, ay + ah * 0.42);
        ctx.lineTo(ax - aw * 0.62, ay + ah * 0.42); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#334155'; ctx.lineWidth = Math.max(8, aw * 0.15); ctx.stroke();
        ctx.strokeStyle = `rgba(192, 132, 252, ${0.65 + 0.22 * Math.sin(t * 1.8)})`;
        ctx.lineWidth = 2.4; ctx.setLineDash([8, 9]); ctx.stroke(); ctx.setLineDash([]);
        for (const pxOff of [-0.66, 0.54]) {
            ctx.fillStyle = '#0f172a'; ctx.strokeStyle = '#475569'; ctx.lineWidth = 2;
            ctx.fillRect(ax + aw * pxOff, ay - ah * 0.15, aw * 0.12, ah * 0.60);
            ctx.strokeRect(ax + aw * pxOff, ay - ah * 0.15, aw * 0.12, ah * 0.60);
        }
    }

    static _drawCrystalsAndTorches(ctx, w, h, t) {
        const minD = Math.min(w, h);
        for (const c of (this._crystals || [])) {
            const x = c.nx * w, y = c.ny * h, s = minD * 0.036 * c.sc;
            ctx.save(); ctx.translate(x, y);
            ctx.fillStyle = 'rgba(0,0,0,0.62)'; ctx.beginPath(); ctx.ellipse(0, s * 0.28, s, s * 0.35, 0, 0, Math.PI * 2); ctx.fill();
            for (const [hy, rot] of [[0.78, -0.34], [1.28, 0.03], [0.74, 0.36]]) {
                ctx.save(); ctx.rotate(rot);
                ctx.fillStyle = c.dark; ctx.beginPath(); ctx.moveTo(-s * 0.26, 0); ctx.lineTo(0, -s * hy); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
                ctx.fillStyle = c.hue; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -s * hy); ctx.lineTo(s * 0.26, 0); ctx.closePath(); ctx.fill();
                ctx.strokeStyle = '#f0f9ff'; ctx.lineWidth = 1.4;
                ctx.beginPath(); ctx.moveTo(-s * 0.26, 0); ctx.lineTo(0, -s * hy); ctx.lineTo(s * 0.26, 0); ctx.closePath(); ctx.stroke();
                ctx.restore();
            }
            ctx.restore();
        }
        for (const [bx, by] of [[0.38, 0.35], [0.62, 0.35], [0.21, 0.42], [0.79, 0.42]]) {
            const tx = w * bx, ty = h * by, flk = 1 + Math.sin(t * 7 + bx * 14) * 0.16;
            ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(tx, ty + 11, 11, 5, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
            ctx.fillRect(tx - 6, ty - 4, 12, 15); ctx.strokeRect(tx - 6, ty - 4, 12, 15);
            ctx.fillStyle = '#fb923c'; ctx.beginPath(); ctx.arc(tx, ty - 9, 8.5 * flk, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(tx, ty - 10, 4.4 * flk, 0, Math.PI * 2); ctx.fill();
        }
    }

    static _drawDynamicLightmap(ctx, w, h, heroY, t) {
        if (typeof document === 'undefined') return;
        const lw = Math.max(160, Math.round(w * 0.35)), lh = Math.max(90, Math.round(h * 0.35));
        if (!this._lightCanvas) {
            this._lightCanvas = document.createElement('canvas'); this._lightCtx = this._lightCanvas.getContext('2d');
        }
        if (this._lightCanvas.width !== lw || this._lightCanvas.height !== lh) {
            this._lightCanvas.width = lw; this._lightCanvas.height = lh;
        }
        const lctx = this._lightCtx, sx = lw / w, sy = lh / h, rBase = Math.min(w, h);
        lctx.globalCompositeOperation = 'source-over'; lctx.fillStyle = 'rgba(2, 4, 12, 0.80)'; lctx.fillRect(0, 0, lw, lh);

        lctx.globalCompositeOperation = 'destination-out';
        const punch = (x, y, rad, str) => {
            const g = lctx.createRadialGradient(x * sx, y * sy, 2, x * sx, y * sy, rad * sx);
            g.addColorStop(0, `rgba(0,0,0,${str})`); g.addColorStop(0.55, `rgba(0,0,0,${str * 0.5})`); g.addColorStop(1, 'rgba(0,0,0,0)');
            lctx.fillStyle = g; lctx.beginPath(); lctx.arc(x * sx, y * sy, rad * sx, 0, Math.PI * 2); lctx.fill();
        };
        punch(w * 0.5, heroY, rBase * 0.46, 0.98);
        punch(w * 0.5, h * 0.25, rBase * 0.36, 0.88);
        punch(w * 0.69, h * 0.51, rBase * 0.28, 0.78);
        for (const [bx, by] of [[0.38, 0.35], [0.62, 0.35], [0.21, 0.42], [0.79, 0.42]]) punch(w * bx, h * by, rBase * (0.26 + 0.025 * Math.sin(t * 7 + bx * 14)), 0.92);
        for (const c of (this._crystals || [])) punch(c.nx * w, c.ny * h, rBase * 0.26 * c.sc, 0.86);
        ctx.drawImage(this._lightCanvas, 0, 0, w, h);

        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const addGlow = (x, y, rad, col) => {
            const g = ctx.createRadialGradient(x, y, 2, x, y, rad);
            g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
        };
        for (const [bx, by] of [[0.38, 0.35], [0.62, 0.35], [0.21, 0.42], [0.79, 0.42]]) addGlow(w * bx, h * by, rBase * 0.22, 'rgba(251, 146, 60, 0.34)');
        addGlow(w * 0.5, heroY, rBase * 0.28, 'rgba(56, 189, 248, 0.22)');
        addGlow(w * 0.5, h * 0.25, rBase * 0.24, 'rgba(168, 85, 247, 0.28)');
        for (const c of (this._crystals || [])) addGlow(c.nx * w, c.ny * h, rBase * 0.22 * c.sc, c.glow);
        ctx.restore();
    }

    static _drawGodRaysAndSpores(ctx, w, h, t) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const holeG = ctx.createRadialGradient(w * 0.5, 0, 4, w * 0.5, 0, Math.min(w, h) * 0.22);
        holeG.addColorStop(0, 'rgba(224, 242, 254, 0.48)'); holeG.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = holeG; ctx.beginPath(); ctx.arc(w * 0.5, 0, Math.min(w, h) * 0.22, 0, Math.PI); ctx.fill();

        for (const offset of [-0.07, 0.01, 0.09]) {
            const topX = w * (0.50 + offset * 0.4), botX = w * (0.50 + offset * 1.45), beamW = Math.min(w, h) * 0.14;
            const g = ctx.createLinearGradient(topX, 0, botX, h * 0.64);
            g.addColorStop(0, 'rgba(224, 242, 254, 0.28)'); g.addColorStop(0.55, 'rgba(56, 189, 248, 0.12)'); g.addColorStop(1, 'rgba(56, 189, 248, 0)');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.moveTo(topX - beamW * 0.34, 0); ctx.lineTo(topX + beamW * 0.34, 0);
            ctx.lineTo(botX + beamW, h * 0.64); ctx.lineTo(botX - beamW, h * 0.64); ctx.closePath(); ctx.fill();
        }
        ctx.restore();

        for (const s of (this._spores || [])) {
            ctx.globalAlpha = Math.max(0.15, 0.4 + 0.45 * Math.sin(t * 2.2 + s.ph));
            ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(s.nx * w, s.ny * h, s.r, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    static _drawForegroundFraming(ctx, w, h) {
        ctx.save(); ctx.fillStyle = '#020308';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w * 0.40, 0); ctx.lineTo(w * 0.34, h * 0.11); ctx.lineTo(w * 0.24, h * 0.06); ctx.lineTo(w * 0.13, h * 0.17); ctx.lineTo(0, h * 0.26); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(w, 0); ctx.lineTo(w * 0.60, 0); ctx.lineTo(w * 0.66, h * 0.10); ctx.lineTo(w * 0.77, h * 0.05); ctx.lineTo(w * 0.88, h * 0.16); ctx.lineTo(w, h * 0.25); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, h * 0.72); ctx.lineTo(w * 0.14, h * 0.88); ctx.lineTo(w * 0.24, h); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(w, h); ctx.lineTo(w, h * 0.74); ctx.lineTo(w * 0.86, h * 0.89); ctx.lineTo(w * 0.76, h); ctx.closePath(); ctx.fill();
        ctx.restore();
    }

    static _drawCutsceneHero(ctx, x, y, r, rot, alpha, game, opts = {}) {
        const sc = Math.max(0.45, r / 25);
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.translate(x, y);
        if (!opts.airborne) {
            ctx.fillStyle = 'rgba(0,0,0,0.52)';
            ctx.beginPath(); ctx.ellipse(0, r * 0.85, r * 1.05, r * 0.40, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.rotate(rot); ctx.scale(sc, sc);
        if (typeof HeroSkinRenderer !== 'undefined' && typeof HeroSkinRenderer.drawModel === 'function') {
            const src = (game && game.player) ? game.player : null;
            const overrides = {
                x: 0, y: 0, vx: 0, vy: 0, recoilOffset: 0, bladeTimer: 0, radius: 25,
                angle: opts.angle !== undefined ? opts.angle : 0.45,
                isMoving: !!opts.moving, hitFlash: 0, shieldActive: false, age: Math.round(this.elapsed)
            };
            const actor = src
                ? Object.assign(Object.create(Object.getPrototypeOf(src)), src, overrides)
                : Object.assign({ heroType: 'psanas', weaponType: 'pea', color: '#fed330', facing: 1 }, overrides);
            HeroSkinRenderer.drawModel(actor, ctx, opts.walkCycle || 0, false, !!opts.moving);
        } else {
            ctx.fillStyle = (game && game.player && game.player.color) || '#fed330';
            ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
        ctx.restore();
    }

    static _drawLetterbox(ctx, w, h, topLabel, subText) {
        const barH = Math.round(h * 0.11);
        ctx.fillStyle = '#05070a'; ctx.fillRect(0, 0, w, barH); ctx.fillRect(0, h - barH, w, barH);
        ctx.fillStyle = '#fed330'; ctx.fillRect(0, barH - 2, w, 2); ctx.fillRect(0, h - barH, w, 2);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `900 ${Math.round(Math.min(15, h * 0.024))}px "Luckiest Guy", cursive, sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.88)'; ctx.fillText(topLabel, w * 0.5, barH * 0.5);
        ctx.font = `900 ${Math.round(Math.min(18, h * 0.028))}px "Luckiest Guy", cursive, sans-serif`;
        ctx.fillStyle = '#fed330'; ctx.fillText(subText, w * 0.5, h - barH * 0.5);
    }

    static _drawToBeContinued(ctx, w, h, t) {
        const band = ctx.createLinearGradient(0, h * 0.62, 0, h);
        band.addColorStop(0, 'rgba(3, 5, 12, 0)'); band.addColorStop(0.32, 'rgba(3, 5, 12, 0.78)'); band.addColorStop(1, 'rgba(2, 4, 10, 0.96)');
        ctx.fillStyle = band; ctx.fillRect(0, h * 0.62, w, h * 0.38);

        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `900 ${Math.round(Math.min(15, w * 0.017))}px "Luckiest Guy", cursive, sans-serif`;
        ctx.fillStyle = '#38bdf8'; ctx.fillText('HARD ENDLESS CHAPTER CLEARED • BENEATH THE SANCTUM', w * 0.5, h * 0.715);

        const titleSz = Math.round(Math.min(54, w * 0.058));
        ctx.font = `900 ${titleSz}px "Luckiest Guy", cursive, sans-serif`;
        ctx.lineWidth = Math.max(5, titleSz * 0.11); ctx.strokeStyle = '#05070a';
        ctx.strokeText('TO BE CONTINUED...', w * 0.5, h * 0.795);
        ctx.fillStyle = '#fed330'; ctx.fillText('TO BE CONTINUED...', w * 0.5, h * 0.795);

        ctx.font = `900 ${Math.round(Math.min(19, w * 0.022))}px "Luckiest Guy", cursive, sans-serif`;
        ctx.fillStyle = 'rgba(226, 232, 240, 0.92)'; ctx.fillText('DLC COMING SOON — THE SUNLESS DEPTHS', w * 0.5, h * 0.865);

        const pulse = 0.65 + 0.35 * Math.sin(t * 2.5);
        ctx.fillStyle = `rgba(254, 211, 48, ${pulse})`;
        ctx.font = `900 ${Math.round(Math.min(15, w * 0.017))}px "Luckiest Guy", cursive, sans-serif`;
        ctx.fillText('CLICK OR PRESS SPACE TO CLAIM HARD VICTORY ▶', w * 0.5, h * 0.935);
    }
}

if (typeof window !== 'undefined') window.ApexW60FinaleTeaser = ApexW60FinaleTeaser;
if (typeof module !== 'undefined' && module.exports) module.exports = { ApexW60FinaleTeaser };
