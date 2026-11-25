/**
 * Lesa.io - Wave 60 Final Apex Boss Dynamic Map Transformation & Weather Engine
 * Progressively shifts the arena into the Fractured Omega Eclipse Sanctum during
 * the W60 entrance cutscene and sustains storm rain, ash embers, ground fissures,
 * and ambient thunder flashes throughout the final encounter.
 */

class ApexW60Atmosphere {
    static intensity = 0;
    static mapShift = 0;
    static age = 0;
    static _isCritical = false;
    static _rain = null;
    static _fissures = null;
    static _bolts = [];
    static _screenFogSprite = null;

    static reset() {
        this.intensity = 0;
        this.mapShift = 0;
        this.age = 0;
        this._isCritical = false;
        this._bolts = [];
        this._fissures = null;
    }

    static getActiveBoss(game) {
        if (!game || (game.state !== 'PLAYING' && game.state !== 'PAUSED')) return null;
        const enemies = Array.isArray(game.enemies) ? game.enemies : [];
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (e && !e.dead && !e.isDying && e.type === 'apex_omega_w60') return e;
        }
        return null;
    }

    static update(dt = 1, game = null) {
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        const boss = this.getActiveBoss(g);
        const active = !!boss || Boolean(g && g.gameMode === 'endless' && g.isEndlessHard && g.waveManager && g.waveManager.wave === 60 && g.waveManager.waveState === 'IN_PROGRESS');

        if (!active) {
            this.intensity = Math.max(0, this.intensity - 0.03 * dt);
            this.mapShift = Math.max(0, this.mapShift - 0.03 * dt);
            return;
        }

        this.age += dt;
        const st = boss ? (boss.cutsceneState || 'COMBAT') : 'COMBAT';
        const targetWeather = st === 'OMEN_STORM' ? 0.72 : 1.0;
        const targetMap = st === 'OMEN_STORM' ? 0.28 : (st === 'MAP_FRACTURE' ? 0.85 : 1.0);
        this.intensity += (targetWeather - this.intensity) * Math.min(1, 0.06 * dt);
        this.mapShift += (targetMap - this.mapShift) * Math.min(1, 0.055 * dt);
        this._isCritical = !!(boss && (boss.phase >= 4 || boss.shieldActive));

        this._initFX(boss);
        this._updateWeather(dt, g, st);
    }

    static _initFX(boss) {
        const count = (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile) ? 38 : 85;
        if (!this._rain || this._rain.length !== count) {
            this._rain = Array.from({ length: count }, () => ({
                x: (Math.random() - 0.5) * 1800,
                y: (Math.random() - 0.5) * 1100,
                len: 16 + Math.random() * 18,
                spd: 12 + Math.random() * 8,
                hot: Math.random() < 0.28
            }));
        }
        if (!this._fissures) {
            const ox = boss ? boss.x : 0, oy = boss ? boss.y : 0;
            this._fissures = [];
            for (let i = 0; i < 14; i++) {
                const a = (i / 14) * Math.PI * 2 + (i % 2) * 0.14;
                const pts = [{ x: ox + Math.cos(a) * 45, y: oy + Math.sin(a) * 45 }];
                let cx = pts[0].x, cy = pts[0].y;
                for (let s = 1; s <= 5; s++) {
                    const jitter = (Math.sin(i * 3.7 + s * 2.1) * 0.42);
                    cx += Math.cos(a + jitter) * (95 + s * 35);
                    cy += Math.sin(a + jitter) * (95 + s * 35);
                    pts.push({ x: cx, y: cy });
                }
                this._fissures.push({ pts, delay: i * 0.04 });
            }
        }
    }

    static _updateWeather(dt, g, st) {
        const cam = g ? g.camera : null;
        const px = cam ? cam.x : 0, py = cam ? cam.y : 0;
        const speedBoost = this._isCritical ? 1.32 : 1.0;

        for (let i = 0; i < this._rain.length; i++) {
            const r = this._rain[i];
            r.x -= r.spd * 0.42 * speedBoost * dt;
            r.y += r.spd * speedBoost * dt;
            if (r.y > py + 560 || r.x < px - 920) {
                r.x = px + (Math.random() - 0.35) * 2000;
                r.y = py - 560 - Math.random() * 120;
            }
        }

        // Occasional storm sky lightning bolts in world space during buildup & critical phase
        const boltChance = (st === 'OMEN_STORM' || st === 'MAP_FRACTURE' || this._isCritical) ? 0.045 : 0.014;
        if (Math.random() < boltChance * dt && this._bolts.length < 4) {
            const bx = px + (Math.random() - 0.5) * 900;
            const by = py + (Math.random() - 0.5) * 520;
            this._bolts.push({ x: bx, y: by, life: 16, maxLife: 16, seed: Math.random() * 99 });
        }
        for (let i = this._bolts.length - 1; i >= 0; i--) {
            this._bolts[i].life -= dt;
            if (this._bolts[i].life <= 0) this._bolts.splice(i, 1);
        }
    }

    static drawWorldGround(ctx, camera, arena) {
        if (this.mapShift <= 0.01 || !arena || !ctx) return;
        const m = this.mapShift;
        const pulse = 0.5 + 0.5 * Math.sin(this.age * 0.07);

        ctx.save();
        // 1. Darkened Crimson-Obsidian Sanctum Floor Override (transforms entire battlefield look)
        ctx.fillStyle = `rgba(14, 5, 24, ${0.58 * m})`;
        ctx.fillRect(-arena.halfWidth - 900, -arena.halfHeight - 900, arena.width + 1800, arena.height + 1800);

        // 2. Corrupted Geometric Floor Lattice & Glowing Omega Circuit Grid
        ctx.strokeStyle = `rgba(168, 85, 247, ${0.22 * m})`;
        ctx.lineWidth = 2;
        const step = 224;
        for (let x = -arena.halfWidth; x <= arena.halfWidth; x += step) {
            if (camera && Math.abs(x - camera.x) > 1050) continue;
            ctx.beginPath(); ctx.moveTo(x, -arena.halfHeight); ctx.lineTo(x, arena.halfHeight); ctx.stroke();
        }
        for (let y = -arena.halfHeight; y <= arena.halfHeight; y += step) {
            if (camera && Math.abs(y - camera.y) > 750) continue;
            ctx.beginPath(); ctx.moveTo(-arena.halfWidth, y); ctx.lineTo(arena.halfWidth, y); ctx.stroke();
        }

        // 3. Radiating Reality-Fracture Magma/Void Fissures across transformed arena floor
        if (this._fissures) {
            for (const f of this._fissures) {
                const prog = Math.max(0, Math.min(1, (m - f.delay) * 1.4));
                if (prog <= 0) continue;
                const drawCount = Math.max(2, Math.floor(f.pts.length * prog));
                ctx.lineCap = 'round';
                ctx.strokeStyle = `rgba(255, 46, 76, ${(0.35 + pulse * 0.25) * m})`;
                ctx.lineWidth = 9;
                ctx.beginPath();
                ctx.moveTo(f.pts[0].x, f.pts[0].y);
                for (let k = 1; k < drawCount; k++) ctx.lineTo(f.pts[k].x, f.pts[k].y);
                ctx.stroke();
                ctx.strokeStyle = `rgba(254, 211, 48, ${0.72 * m})`;
                ctx.lineWidth = 2.6;
                ctx.stroke();
            }
        }

        // 4. Transformed Arena Perimeter Seal (Violet-Gold-Crimson Omega Trim)
        ctx.lineWidth = 14;
        ctx.strokeStyle = `rgba(255, 46, 76, ${0.92 * m})`;
        ctx.strokeRect(-arena.halfWidth, -arena.halfHeight, arena.width, arena.height);
        ctx.lineWidth = 4;
        ctx.strokeStyle = `rgba(254, 211, 48, ${(0.75 + pulse * 0.25) * m})`;
        ctx.setLineDash([34, 16]); ctx.lineDashOffset = -this.age * 2.2;
        ctx.strokeRect(-arena.halfWidth + 12, -arena.halfHeight + 12, arena.width - 24, arena.height - 24);
        ctx.setLineDash([]);
        ctx.restore();
    }

    static drawWorldWeather(ctx, camera) {
        if (this.intensity <= 0.01 || !ctx) return;
        const a = this.intensity;

        ctx.save();
        // 1. Diagonal Storm Void-Rain & Rising Crimson Cinders
        if (this._rain) {
            ctx.lineCap = 'round';
            for (let i = 0; i < this._rain.length; i++) {
                const r = this._rain[i];
                if (camera && !camera.isVisible(r.x, r.y, 40)) continue;
                if (r.hot) {
                    ctx.fillStyle = `rgba(254, 211, 48, ${0.78 * a})`;
                    ctx.beginPath(); ctx.arc(r.x, r.y, 2.8, 0, Math.PI * 2); ctx.fill();
                } else {
                    ctx.strokeStyle = `rgba(192, 132, 252, ${0.42 * a})`;
                    ctx.lineWidth = 1.8;
                    ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - r.len * 0.42, r.y + r.len); ctx.stroke();
                }
            }
        }

        // 2. Forked Sky-to-Ground Storm Lightning Bolts
        for (const b of this._bolts) {
            const p = b.life / b.maxLife;
            ctx.strokeStyle = `rgba(255, 46, 76, ${0.55 * p * a})`; ctx.lineWidth = 9;
            ctx.beginPath(); ctx.moveTo(b.x - 45, b.y - 360);
            ctx.lineTo(b.x + Math.sin(b.seed) * 35, b.y - 210);
            ctx.lineTo(b.x - Math.cos(b.seed) * 30, b.y - 90);
            ctx.lineTo(b.x, b.y); ctx.stroke();
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.95 * p * a})`; ctx.lineWidth = 2.8;
            ctx.stroke();
            ctx.fillStyle = `rgba(254, 211, 48, ${0.45 * p * a})`;
            ctx.beginPath(); ctx.arc(b.x, b.y, 28 * (1.2 - p * 0.4), 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }

    static drawScreenAtmosphere(ctx, width, height) {
        if (this.intensity <= 0.01 || !ctx || width <= 0 || height <= 0) return;
        const a = this.intensity;
        const critBoost = this._isCritical ? 0.14 : 0;
        const lightningFlash = this._bolts.length > 0 ? Math.min(0.18, this._bolts[0].life / 60) : 0;

        ctx.save();
        // Deep stormy Eclipse sky vignette around screen borders
        const grad = ctx.createRadialGradient(width * 0.5, height * 0.5, Math.min(width, height) * 0.25, width * 0.5, height * 0.5, Math.max(width, height) * 0.72);
        grad.addColorStop(0, `rgba(46, 16, 101, ${(0.08 + critBoost * 0.4) * a})`);
        grad.addColorStop(0.7, `rgba(88, 28, 135, ${(0.24 + critBoost) * a})`);
        grad.addColorStop(1, `rgba(15, 5, 25, ${Math.min(0.78, 0.58 * a + critBoost)})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        if (lightningFlash > 0) {
            ctx.fillStyle = `rgba(255, 230, 240, ${lightningFlash})`;
            ctx.fillRect(0, 0, width, height);
        }
        ctx.restore();
    }
}

if (typeof window !== 'undefined') window.ApexW60Atmosphere = ApexW60Atmosphere;
if (typeof module !== 'undefined' && module.exports) module.exports = { ApexW60Atmosphere };
