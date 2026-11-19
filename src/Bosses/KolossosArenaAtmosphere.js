/**
 * Lesa.io - Wave 40 Endless Boss ("Kolossos MK-IV") Red Stadium & Fog Atmosphere
 * Activates a sinister crimson floodlit stadium overlay, perimeter red neon hazard borders,
 * drifting multi-layer world-space red fog banks, rising embers, and screen-edge crimson mist
 * whenever Wave 40 Endless or an active MechaKolossos boss is present.
 * Uses pre-rendered radial canvases for steady 60+ FPS performance.
 */

class KolossosArenaAtmosphere {
    static intensity = 0;
    static age = 0;
    static _fogClouds = null;
    static _embers = null;
    static _fogSprite = null;
    static _screenFogSprite = null;
    static _isBossEnraged = false;

    static reset() {
        this.intensity = 0;
        this.age = 0;
        this._isBossEnraged = false;
    }

    static shouldActivate(game) {
        if (!game || (game.state !== 'PLAYING' && game.state !== 'PAUSED')) return null;

        const enemies = Array.isArray(game.enemies) ? game.enemies : [];
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (!e || e.dead || e.isDying) continue;
            if (e.type === 'mecha_kolossos' || (typeof MechaKolossos !== 'undefined' && e instanceof MechaKolossos)) {
                return e;
            }
        }

        if (game.gameMode === 'endless' && game.waveManager && game.waveManager.wave === 40 && game.waveManager.waveState === 'IN_PROGRESS') {
            return { isEnraged: false };
        }
        return null;
    }

    static update(dt = 1, game = null) {
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        const activeBoss = this.shouldActivate(g);
        const target = activeBoss ? 1.0 : 0.0;
        this._isBossEnraged = !!(activeBoss && activeBoss.isEnraged);

        if (this.intensity < target) {
            this.intensity = Math.min(target, this.intensity + 0.025 * dt);
        } else if (this.intensity > target) {
            this.intensity = Math.max(target, this.intensity - 0.03 * dt);
        }

        if (this.intensity <= 0.005) return;
        this.age += dt;
        this._initParticles();

        const halfW = (g && g.arena) ? g.arena.halfWidth : 1500;
        const halfH = (g && g.arena) ? g.arena.halfHeight : 1500;
        const speedMult = this._isBossEnraged ? 1.35 : 1.0;

        for (let i = 0; i < this._fogClouds.length; i++) {
            const c = this._fogClouds[i];
            c.x += c.vx * speedMult * dt;
            c.y += c.vy * speedMult * dt;
            c.pulse += 0.025 * dt;
            if (c.x < -halfW - 260) c.x = halfW + 240;
            else if (c.x > halfW + 260) c.x = -halfW - 240;
            if (c.y < -halfH - 260) c.y = halfH + 240;
            else if (c.y > halfH + 260) c.y = -halfH - 240;
        }

        for (let i = 0; i < this._embers.length; i++) {
            const m = this._embers[i];
            m.x += (m.vx + Math.sin(this.age * 0.06 + i) * 0.35) * speedMult * dt;
            m.y += m.vy * speedMult * dt;
            m.life -= dt;
            if (m.life <= 0) {
                const cam = g ? g.camera : null;
                const cx = cam ? cam.x : 0;
                const cy = cam ? cam.y : 0;
                m.x = cx + (Math.random() - 0.5) * 1650;
                m.y = cy + (Math.random() - 0.5) * 1050;
                m.vy = -(0.65 + Math.random() * 1.15);
                m.vx = (Math.random() - 0.5) * 0.65;
                m.life = 70 + Math.random() * 110;
            }
        }
    }

    static _initParticles() {
        const isMob = (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile);
        if (!this._fogClouds) {
            this._fogClouds = Array.from({ length: isMob ? 10 : 24 }, (_, i) => ({
                x: ((i % 6) - 2.5) * 480 + (Math.random() - 0.5) * 160,
                y: (Math.floor(i / 6) - 1.5) * 680 + (Math.random() - 0.5) * 180,
                r: 260 + Math.random() * 170,
                vx: (i % 2 === 0 ? 1 : -1) * (0.55 + Math.random() * 0.55),
                vy: (Math.random() - 0.5) * 0.42,
                alpha: 0.30 + Math.random() * 0.16,
                pulse: Math.random() * Math.PI * 2
            }));
        }
        if (!this._embers) {
            this._embers = Array.from({ length: isMob ? 12 : 30 }, () => ({
                x: (Math.random() - 0.5) * 1800,
                y: (Math.random() - 0.5) * 1400,
                vx: (Math.random() - 0.5) * 0.65,
                vy: -(0.7 + Math.random() * 1.1),
                size: 2.0 + Math.random() * 2.8,
                hot: Math.random() < 0.4,
                life: 40 + Math.random() * 120
            }));
        }
    }

    static _getFogSprite() {
        if (this._fogSprite || typeof document === 'undefined') return this._fogSprite;
        const size = 128;
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const gctx = c.getContext('2d');
        const g = gctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.05, size * 0.5, size * 0.5, size * 0.5);
        g.addColorStop(0, 'rgba(235, 24, 52, 0.64)');
        g.addColorStop(0.55, 'rgba(170, 12, 32, 0.32)');
        g.addColorStop(1, 'rgba(110, 0, 18, 0)');
        gctx.fillStyle = g;
        gctx.fillRect(0, 0, size, size);
        this._fogSprite = c;
        return c;
    }

    static _getScreenFogSprite() {
        if (this._screenFogSprite || typeof document === 'undefined') return this._screenFogSprite;
        const size = 256;
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const gctx = c.getContext('2d');
        gctx.translate(size * 0.5, size * 0.5);
        gctx.scale(size / 2.05, size / 2.05);
        const vig = gctx.createRadialGradient(0, 0, 0.44, 0, 0, 1.06);
        vig.addColorStop(0, 'rgba(170, 10, 28, 0)');
        vig.addColorStop(0.62, 'rgba(165, 12, 30, 0.36)');
        vig.addColorStop(1, 'rgba(110, 4, 18, 0.88)');
        gctx.fillStyle = vig;
        gctx.fillRect(-1.05, -1.05, 2.1, 2.1);
        this._screenFogSprite = c;
        return c;
    }

    /**
     * World ground layer: crimson stadium wash, glowing tactical grid accents,
     * sweeping red stadium floodlights, and pulsing red arena boundaries.
     */
    static drawWorldGround(ctx, camera, arena) {
        if (this.intensity <= 0.005 || !arena) return;
        const a = this.intensity;
        const pulse = 0.72 + Math.sin(this.age * 0.06) * 0.28;

        ctx.save();
        // 1. Deep blood-crimson stadium ground & darkened out-of-bounds apron
        ctx.fillStyle = `rgba(62, 6, 16, ${0.72 * a})`;
        ctx.fillRect(-arena.halfWidth - 1600, -arena.halfHeight - 1600, arena.width + 3200, arena.height + 3200);

        ctx.fillStyle = `rgba(148, 14, 30, ${(this._isBossEnraged ? 0.50 : 0.42) * a})`;
        ctx.fillRect(-arena.halfWidth, -arena.halfHeight, arena.width, arena.height);

        // 1b. Glowing crimson colosseum pitch lines & center reactor emblem
        ctx.strokeStyle = `rgba(255, 56, 82, ${0.24 * a * pulse})`;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, 280, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 560, 0, Math.PI * 2);
        ctx.stroke();

        // 2. Crimson stadium tactical corner searchlight cones
        const sweep = this.age * 0.016;
        const corners = [
            [-arena.halfWidth + 40, -arena.halfHeight + 40, 0.78],
            [arena.halfWidth - 40, -arena.halfHeight + 40, 2.35],
            [arena.halfWidth - 40, arena.halfHeight - 40, -2.35],
            [-arena.halfWidth + 40, arena.halfHeight - 40, -0.78]
        ];
        ctx.fillStyle = `rgba(255, 50, 78, ${0.15 * a * pulse})`;
        for (let i = 0; i < corners.length; i++) {
            const [cx, cy, baseAng] = corners[i];
            const ang = baseAng + Math.sin(sweep + i * 1.4) * 0.42;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, 1480, ang - 0.18, ang + 0.18);
            ctx.closePath();
            ctx.fill();
        }

        // 3. Crimson glowing stadium border trim
        ctx.lineWidth = 14;
        ctx.strokeStyle = `rgba(220, 20, 48, ${0.9 * a})`;
        ctx.strokeRect(-arena.halfWidth, -arena.halfHeight, arena.width, arena.height);

        ctx.lineWidth = 5;
        ctx.strokeStyle = `rgba(255, 165, 2, ${0.82 * a * pulse})`;
        ctx.setLineDash([28, 18]);
        ctx.lineDashOffset = -this.age * 1.5;
        ctx.strokeRect(-arena.halfWidth + 10, -arena.halfHeight + 10, arena.width - 20, arena.height - 20);
        ctx.setLineDash([]);
        ctx.restore();
    }

    /**
     * World foreground mist & glowing embers hovering over entities.
     */
    static drawWorldFog(ctx, camera) {
        if (this.intensity <= 0.005 || !this._fogClouds) return;
        const a = this.intensity;
        const sprite = this._getFogSprite();

        ctx.save();
        if (sprite) {
            for (let i = 0; i < this._fogClouds.length; i++) {
                const c = this._fogClouds[i];
                if (camera && !camera.isVisible(c.x, c.y, c.r + 40)) continue;
                const waveAlpha = c.alpha * (0.82 + Math.sin(c.pulse) * 0.18) * a;
                ctx.globalAlpha = waveAlpha;
                ctx.drawImage(sprite, c.x - c.r, c.y - c.r, c.r * 2, c.r * 2);
            }
        }

        // Rising incandescent cinder embers
        for (let i = 0; i < this._embers.length; i++) {
            const m = this._embers[i];
            if (camera && !camera.isVisible(m.x, m.y, 24)) continue;
            ctx.globalAlpha = Math.min(0.85, (m.life / 45) * 0.72) * a;
            ctx.fillStyle = m.hot ? '#ffa502' : '#ff4757';
            ctx.beginPath();
            ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    /**
     * Screen-space billowing crimson edge fog overlay.
     */
    static drawScreenFog(ctx, width, height) {
        if (this.intensity <= 0.005 || !ctx || width <= 0 || height <= 0) return;
        const sprite = this._getScreenFogSprite();
        const breathe = 0.44 + Math.sin(this.age * 0.045) * 0.08 + (this._isBossEnraged ? 0.12 : 0);
        const alpha = Math.min(0.76, breathe * this.intensity);

        ctx.save();
        if (sprite) {
            ctx.globalAlpha = alpha;
            ctx.drawImage(sprite, -width * 0.03, -height * 0.03, width * 1.06, height * 1.06);
        } else {
            ctx.fillStyle = `rgba(140, 12, 28, ${alpha * 0.38})`;
            ctx.fillRect(0, 0, width, height);
        }

        // Atmospheric crimson ambient fog haze across battlefield
        ctx.globalAlpha = (this._isBossEnraged ? 0.16 : 0.11) * this.intensity;
        ctx.fillStyle = '#c81428';
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.KolossosArenaAtmosphere = KolossosArenaAtmosphere;
}
