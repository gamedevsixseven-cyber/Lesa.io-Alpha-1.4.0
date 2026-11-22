/**
 * Lesa.io - Endless Mode Progressive Map Evolution System
 * Gradually transforms the peaceful Greek meadow across Endless Mode waves:
 *   W1-19  : Peaceful Village Meadow
 *   W20-29 : Golden Dusk (amber warmth, warm lights, floating dust motes)
 *   W30-36 : City Under Siege (copper haze, ground blast craters, cracks, ash)
 *   W37-39 : Pre-Kolossos Inferno (crimson wash, glowing magma fissures, blazing fires, spotlights)
 *   W40+   : Seamless handoff into Kolossos MK-IV Crimson Stadium while keeping ruins ablaze
 */

class EndlessMapEvolution {
    static active = false;
    static wave = 1;
    static duskLevel = 0;
    static siegeLevel = 0;
    static fireLevel = 0;
    static redLevel = 0;
    static age = 0;
    static _announcedKey = '';
    static _hotspots = [];
    static _scorchSprite = null;
    static _fireGlowSprite = null;
    static _vignetteSprite = null;
    static _motes = null;

    static reset() {
        this.active = false;
        this.wave = 1;
        this.duskLevel = 0;
        this.siegeLevel = 0;
        this.fireLevel = 0;
        this.redLevel = 0;
        this.age = 0;
        this._announcedKey = '';
    }

    static getTargetsForWave(waveNum) {
        const w = Math.max(1, waveNum || 1);
        if (w < 20) return { dusk: 0, siege: 0, fire: 0, red: 0, stage: 0 };
        if (w < 30) {
            const p = (w - 20) / 9;
            return { dusk: 0.45 + p * 0.45, siege: 0, fire: 0, red: 0, stage: 1 };
        }
        if (w < 37) {
            const p = (w - 30) / 6;
            return { dusk: 0.95, siege: 0.45 + p * 0.55, fire: 0, red: 0.08 + p * 0.14, stage: 2 };
        }
        if (w === 37) return { dusk: 1, siege: 1, fire: 0.48, red: 0.44, stage: 3 };
        if (w === 38) return { dusk: 1, siege: 1, fire: 0.74, red: 0.68, stage: 3 };
        if (w === 39) return { dusk: 1, siege: 1, fire: 1.0, red: 0.88, stage: 3 };
        return { dusk: 1, siege: 1, fire: 1.0, red: 1.0, stage: 4 };
    }

    static getBuildingStage(game = null) {
        if (!this.active) {
            const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
            if (!g || g.gameMode !== 'endless' || !g.waveManager) return 0;
            return this.getTargetsForWave(g.waveManager.wave).stage;
        }
        if (this.wave >= 37) return 3;
        if (this.wave >= 30) return 2;
        if (this.wave >= 20) return 1;
        return 0;
    }

    static getTreeBurnRatio() {
        if (!this.active) return 0;
        if (this.wave < 30) return 0;
        if (this.wave < 37) return Math.min(0.85, 0.25 + ((this.wave - 30) / 6) * 0.6);
        return 1.0;
    }

    static isTreeOnFire(obs) {
        if (!this.active || this.wave < 37 || !obs || obs.isOlympianPillar || obs.olympusStyle) return false;
        const mod = Math.abs(obs.id || 0) % 5;
        if (this.wave === 37) return mod === 0;
        if (this.wave === 38) return mod === 0 || mod === 2;
        return mod === 0 || mod === 2 || mod === 4;
    }

    static seedHotspots(arena, rng = Math.random) {
        this._hotspots = [];
        if (!arena || arena.gameMode !== 'endless') return;

        const kinds = ['wreckage', 'fissure', 'crater', 'barricade'];
        const buildings = (arena.obstacles || []).filter((o) => o && o.type === 'building');
        let attempts = 0;

        while (this._hotspots.length < 20 && attempts < 260) {
            attempts++;
            const x = (rng() * 2 - 1) * (arena.halfWidth - 200);
            const y = (rng() * 2 - 1) * (arena.halfHeight - 200);
            const distCenter = Math.hypot(x, y);
            if (distCenter < 290 || distCenter > arena.halfWidth * 1.18) continue;

            let clear = true;
            for (let b = 0; b < buildings.length; b++) {
                const bld = buildings[b];
                if (Math.abs(x - bld.x) < (bld.halfW || 70) + 88 && Math.abs(y - bld.y) < (bld.halfH || 48) + 82) {
                    clear = false;
                    break;
                }
            }
            if (!clear) continue;

            for (let h = 0; h < this._hotspots.length; h++) {
                const other = this._hotspots[h];
                if (Math.hypot(x - other.x, y - other.y) < 270) {
                    clear = false;
                    break;
                }
            }
            if (!clear) continue;

            const idx = this._hotspots.length;
            this._hotspots.push({
                id: idx,
                kind: kinds[idx % kinds.length],
                x,
                y,
                rot: (rng() - 0.5) * 1.4,
                scale: 0.85 + rng() * 0.45,
                phase: rng() * Math.PI * 2,
                arms: 3 + Math.floor(rng() * 3)
            });
        }
    }

    static update(dt = 1, game = null) {
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        const isEndless = !!(g && g.gameMode === 'endless' && (g.state === 'PLAYING' || g.state === 'PAUSED'));
        this.active = isEndless;
        if (!isEndless) {
            this.duskLevel = 0;
            this.siegeLevel = 0;
            this.fireLevel = 0;
            this.redLevel = 0;
            return;
        }

        const w = (g.waveManager && g.waveManager.wave) ? g.waveManager.wave : 1;
        this.wave = w;
        const t = this.getTargetsForWave(w);
        const lerpRate = Math.min(1, 0.03 * dt);
        this.duskLevel += (t.dusk - this.duskLevel) * lerpRate;
        this.siegeLevel += (t.siege - this.siegeLevel) * lerpRate;
        this.fireLevel += (t.fire - this.fireLevel) * lerpRate;
        this.redLevel += (t.red - this.redLevel) * lerpRate;
        this.age += dt;

        this._maybeNotifyMilestone(w, g);
        this._updateMotes(dt, g);
    }

    static _maybeNotifyMilestone(wave, game) {
        const key = wave >= 40 ? '40' : (wave >= 37 ? String(wave) : (wave >= 30 ? '30' : (wave >= 20 ? '20' : '')));
        if (!key || key === this._announcedKey) return;
        this._announcedKey = key;

        const msgs = {
            '20': '🌆 Dusk settles over the village — lantern lights flicker on.',
            '30': '💨 Siege smoke & tremors crack the village earth!',
            '37': '🔥 Buildings catch fire as crimson clouds gather overhead!',
            '38': '🌋 Molten fissures split the arena — flames spread through the ruins!',
            '39': '🚨 CRIMSON DOOMSDAY! Something colossal approaches for Wave 40...'
        };
        if (msgs[key] && game.ui && typeof game.ui.addKillfeed === 'function') {
            game.ui.addKillfeed(msgs[key]);
        }
    }

    static _updateMotes(dt, game) {
        const activeTarget = this.duskLevel > 0.1 || this.siegeLevel > 0.1 || this.fireLevel > 0.05;
        if (!activeTarget) return;

        const preset = (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile) ? MobilePerf.getPreset() : null;
        const cap = preset ? Math.min(28, preset.emberCap + 6) : 34;
        if (!this._motes || this._motes.length !== cap) {
            this._motes = Array.from({ length: cap }, () => ({
                x: (Math.random() - 0.5) * 1600,
                y: (Math.random() - 0.5) * 1000,
                vx: (Math.random() - 0.5) * 0.55,
                vy: -(0.35 + Math.random() * 0.85),
                size: 1.8 + Math.random() * 2.6,
                life: 30 + Math.random() * 110,
                seed: Math.random() * 6.28
            }));
        }

        const speed = 1 + this.fireLevel * 0.55;
        const cam = game ? game.camera : null;
        const cx = cam ? cam.x : 0;
        const cy = cam ? cam.y : 0;
        for (let i = 0; i < this._motes.length; i++) {
            const m = this._motes[i];
            m.x += (m.vx + Math.sin(this.age * 0.05 + m.seed) * 0.35) * speed * dt;
            m.y += m.vy * speed * dt;
            m.life -= dt;
            if (m.life <= 0) {
                m.x = cx + (Math.random() - 0.5) * 1650;
                m.y = cy + (Math.random() - 0.5) * 1000;
                m.vy = -(0.45 + Math.random() * 0.95);
                m.vx = (Math.random() - 0.5) * 0.65;
                m.life = 65 + Math.random() * 100;
            }
        }
    }

    static _getScorchSprite() {
        if (this._scorchSprite || typeof document === 'undefined') return this._scorchSprite;
        const c = document.createElement('canvas');
        c.width = 128;
        c.height = 128;
        const sctx = c.getContext('2d');
        if (!sctx) return null;
        const g = sctx.createRadialGradient(64, 64, 8, 64, 64, 64);
        g.addColorStop(0, 'rgba(18, 12, 12, 0.84)');
        g.addColorStop(0.55, 'rgba(42, 24, 18, 0.52)');
        g.addColorStop(1, 'rgba(40, 20, 14, 0)');
        sctx.fillStyle = g;
        sctx.fillRect(0, 0, 128, 128);
        this._scorchSprite = c;
        return c;
    }

    static _getFireGlowSprite() {
        if (this._fireGlowSprite || typeof document === 'undefined') return this._fireGlowSprite;
        const c = document.createElement('canvas');
        c.width = 128;
        c.height = 128;
        const fctx = c.getContext('2d');
        if (!fctx) return null;
        const g = fctx.createRadialGradient(64, 64, 4, 64, 64, 64);
        g.addColorStop(0, 'rgba(255, 165, 38, 0.65)');
        g.addColorStop(0.5, 'rgba(255, 62, 24, 0.30)');
        g.addColorStop(1, 'rgba(180, 12, 10, 0)');
        fctx.fillStyle = g;
        fctx.fillRect(0, 0, 128, 128);
        this._fireGlowSprite = c;
        return c;
    }

    static _getVignetteSprite() {
        if (this._vignetteSprite || typeof document === 'undefined') return this._vignetteSprite;
        const size = 256;
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const vctx = c.getContext('2d');
        if (!vctx) return null;
        vctx.translate(size * 0.5, size * 0.5);
        vctx.scale(size / 2.05, size / 2.05);
        const vig = vctx.createRadialGradient(0, 0, 0.48, 0, 0, 1.06);
        vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vig.addColorStop(0.65, 'rgba(190, 28, 22, 0.34)');
        vig.addColorStop(1, 'rgba(110, 6, 16, 0.88)');
        vctx.fillStyle = vig;
        vctx.fillRect(-1.05, -1.05, 2.1, 2.1);
        this._vignetteSprite = c;
        return c;
    }

    static _getActiveCounts() {
        if (!this.active || this.wave < 30) return { scars: 0, fires: 0 };
        if (this.wave < 35) return { scars: 6, fires: 0 };
        if (this.wave < 37) return { scars: 11, fires: 2 };
        if (this.wave === 37) return { scars: 16, fires: 8 };
        if (this.wave === 38) return { scars: 19, fires: 14 };
        return { scars: 20, fires: 20 };
    }

    static drawWorldGround(ctx, camera, arena) {
        if (!this.active || !arena || arena.dungeonFloor) return;
        const kolAlpha = (typeof KolossosArenaAtmosphere !== 'undefined') ? (KolossosArenaAtmosphere.intensity || 0) : 0;
        const fadeForKol = Math.max(0, 1 - kolAlpha);

        ctx.save();
        // 1. Progressive Ground Color Grading (cross-fades cleanly into Kolossos W40)
        if (this.duskLevel > 0.01 && fadeForKol > 0.01) {
            const duskA = Math.max(0, this.duskLevel - this.siegeLevel * 0.55) * 0.20 * fadeForKol;
            if (duskA > 0.005) {
                ctx.fillStyle = `rgba(218, 118, 32, ${duskA})`;
                ctx.fillRect(-arena.halfWidth, -arena.halfHeight, arena.width, arena.height);
            }
        }
        if (this.siegeLevel > 0.01 && fadeForKol > 0.01) {
            const siegeA = this.siegeLevel * (1 - this.redLevel * 0.5) * 0.22 * fadeForKol;
            if (siegeA > 0.005) {
                ctx.fillStyle = `rgba(54, 34, 46, ${siegeA})`;
                ctx.fillRect(-arena.halfWidth, -arena.halfHeight, arena.width, arena.height);
            }
        }
        if (this.redLevel > 0.01 && fadeForKol > 0.01) {
            const redWash = this.redLevel * 0.34 * fadeForKol;
            ctx.fillStyle = `rgba(148, 16, 26, ${redWash})`;
            ctx.fillRect(-arena.halfWidth, -arena.halfHeight, arena.width, arena.height);
            ctx.fillStyle = `rgba(48, 6, 12, ${this.redLevel * 0.45 * fadeForKol})`;
            ctx.fillRect(-arena.halfWidth - 1500, -arena.halfHeight - 1500, arena.width + 3000, 1500);
            ctx.fillRect(-arena.halfWidth - 1500, arena.halfHeight, arena.width + 3000, 1500);
            ctx.fillRect(-arena.halfWidth - 1500, -arena.halfHeight, 1500, arena.height);
            ctx.fillRect(arena.halfWidth, -arena.halfHeight, 1500, arena.height);
        }

        // 2. Ground Battle Scars, Molten Fissures & Fire-Pool Bases (Always visible W30-W40+)
        const { scars, fires } = this._getActiveCounts();
        const scorch = this._getScorchSprite();
        const glow = this._getFireGlowSprite();
        const now = (typeof Date !== 'undefined' ? Date.now() : 0) * 0.001;

        for (let i = 0; i < scars && i < this._hotspots.length; i++) {
            const h = this._hotspots[i];
            if (camera && !camera.isVisible(h.x, h.y, 130)) continue;
            const onFire = i < fires;
            const s = h.scale;
            ctx.save();
            ctx.translate(h.x, h.y);
            ctx.rotate(h.rot);

            if (scorch) {
                const sr = (onFire ? 72 : 56) * s;
                ctx.globalAlpha = onFire ? 0.85 : 0.62;
                ctx.drawImage(scorch, -sr, -sr * 0.72, sr * 2, sr * 1.44);
            }

            if (h.kind === 'fissure' || onFire) {
                const pulse = 0.7 + Math.sin(now * 5 + h.phase) * 0.3;
                ctx.globalAlpha = onFire ? 0.92 : (0.35 + this.siegeLevel * 0.4);
                ctx.strokeStyle = '#1a1110';
                ctx.lineWidth = 6 * s;
                for (let a = 0; a < h.arms; a++) {
                    const ang = (a / h.arms) * Math.PI * 2 + 0.4;
                    const len = (36 + (a % 2) * 14) * s;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(ang) * len * 0.55, Math.sin(ang) * len * 0.45);
                    ctx.lineTo(Math.cos(ang + 0.2) * len, Math.sin(ang + 0.2) * len * 0.75);
                    ctx.stroke();
                }
                ctx.strokeStyle = onFire ? `rgba(255, 88, 28, ${pulse})` : 'rgba(210, 68, 24, 0.55)';
                ctx.lineWidth = 2.6 * s;
                for (let a = 0; a < h.arms; a++) {
                    const ang = (a / h.arms) * Math.PI * 2 + 0.4;
                    const len = (35 + (a % 2) * 13) * s;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(ang) * len * 0.55, Math.sin(ang) * len * 0.45);
                    ctx.lineTo(Math.cos(ang + 0.2) * len, Math.sin(ang + 0.2) * len * 0.75);
                    ctx.stroke();
                }
            }

            if (onFire && glow) {
                const flick = 0.88 + Math.sin(now * 10 + h.phase) * 0.12;
                const gr = 68 * s * flick;
                ctx.globalAlpha = 0.68 * (0.65 + this.fireLevel * 0.35);
                ctx.drawImage(glow, -gr, -gr * 0.75, gr * 2, gr * 1.5);
            }
            ctx.restore();
        }

        // 3. Wave 37-39 Pre-Boss Crimson Corner Spotlights & Wave 39 Center Reactor Tease
        if (this.wave >= 37 && this.wave < 40 && fadeForKol > 0.05) {
            const spAlpha = (this.wave === 37 ? 0.05 : (this.wave === 38 ? 0.09 : 0.13)) * fadeForKol;
            const sweep = this.age * 0.013;
            const corners = [
                [-arena.halfWidth + 40, -arena.halfHeight + 40, 0.78],
                [arena.halfWidth - 40, -arena.halfHeight + 40, 2.35],
                [arena.halfWidth - 40, arena.halfHeight - 40, -2.35],
                [-arena.halfWidth + 40, arena.halfHeight - 40, -0.78]
            ];
            ctx.fillStyle = `rgba(255, 58, 72, ${spAlpha})`;
            for (let i = 0; i < corners.length; i++) {
                const [cx, cy, baseAng] = corners[i];
                const ang = baseAng + Math.sin(sweep + i * 1.4) * 0.38;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, 1320, ang - 0.16, ang + 0.16);
                ctx.closePath();
                ctx.fill();
            }

            if (this.wave === 39) {
                const pulse = 0.55 + Math.sin(this.age * 0.08) * 0.45;
                ctx.strokeStyle = `rgba(255, 56, 82, ${0.18 * pulse * fadeForKol})`;
                ctx.lineWidth = 4;
                ctx.setLineDash([18, 16]);
                ctx.beginPath();
                ctx.arc(0, 0, 280, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
        ctx.restore();
    }

    static drawBoundaries(ctx, arena) {
        if (!this.active || !arena || arena.dungeonFloor || this.wave < 20) return false;
        const kolAlpha = (typeof KolossosArenaAtmosphere !== 'undefined') ? (KolossosArenaAtmosphere.intensity || 0) : 0;
        if (kolAlpha >= 0.85) return false;

        ctx.save();
        if (this.wave >= 37) {
            const pulse = 0.72 + Math.sin(this.age * 0.09) * 0.28;
            ctx.lineWidth = 14;
            ctx.strokeStyle = `rgba(195, 22, 42, ${0.75 + this.fireLevel * 0.2})`;
            ctx.strokeRect(-arena.halfWidth, -arena.halfHeight, arena.width, arena.height);
            ctx.lineWidth = 5;
            ctx.strokeStyle = `rgba(255, 138, 30, ${0.85 * pulse})`;
            ctx.setLineDash([24, 18]);
            ctx.lineDashOffset = -this.age * 1.1;
            ctx.strokeRect(-arena.halfWidth + 8, -arena.halfHeight + 8, arena.width - 16, arena.height - 16);
            ctx.setLineDash([]);
        } else {
            ctx.lineWidth = 14;
            ctx.strokeStyle = this.wave >= 30 ? '#8c2424' : '#9c3623';
            ctx.strokeRect(-arena.halfWidth, -arena.halfHeight, arena.width, arena.height);
            ctx.lineWidth = 5;
            ctx.strokeStyle = this.wave >= 30 ? '#e67e22' : '#f6b93b';
            ctx.setLineDash([20, 20]);
            ctx.strokeRect(-arena.halfWidth + 8, -arena.halfHeight + 8, arena.width - 16, arena.height - 16);
            ctx.setLineDash([]);
        }
        ctx.restore();
        return true;
    }

    static drawWorldForeground(ctx, camera) {
        if (!this.active) return;
        const { fires } = this._getActiveCounts();
        const now = (typeof Date !== 'undefined' ? Date.now() : 0) * 0.001;

        ctx.save();
        // 1. Blazing Ground Fire Pockets, Charred Debris & Smoke (W35-W40+)
        for (let i = 0; i < fires && i < this._hotspots.length; i++) {
            const h = this._hotspots[i];
            if (camera && !camera.isVisible(h.x, h.y, 110)) continue;
            const s = h.scale;
            ctx.save();
            ctx.translate(h.x, h.y);

            // Charred timber / wreckage scraps
            ctx.fillStyle = '#2d2320';
            ctx.strokeStyle = '#18181b';
            ctx.lineWidth = 2;
            ctx.save();
            ctx.rotate(h.rot);
            ctx.fillRect(-20 * s, -4 * s, 40 * s, 7 * s);
            ctx.strokeRect(-20 * s, -4 * s, 40 * s, 7 * s);
            ctx.rotate(0.75);
            ctx.fillRect(-16 * s, -3 * s, 32 * s, 6 * s);
            ctx.strokeRect(-16 * s, -3 * s, 32 * s, 6 * s);
            ctx.restore();

            if (typeof EndlessBuildingRenderer !== 'undefined') {
                EndlessBuildingRenderer.drawComicFireCluster(ctx, -6 * s, 2, 18 * s, now + h.phase);
                EndlessBuildingRenderer.drawComicFireCluster(ctx, 9 * s, 4, 14 * s, now * 1.15 + h.phase);
            }

            // Rising grey-black smoke puff
            const t = (now * 0.5 + h.phase) % 1;
            ctx.fillStyle = `rgba(34, 26, 26, ${(1 - t) * 0.36})`;
            ctx.beginPath();
            ctx.arc(Math.sin(now * 2 + h.phase) * 9, -22 - t * 48, (8 + t * 14) * s, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // 2. Atmospheric Dusk Motes / Siege Ash / Inferno Cinders
        if (this._motes) {
            for (let i = 0; i < this._motes.length; i++) {
                const m = this._motes[i];
                if (camera && !camera.isVisible(m.x, m.y, 24)) continue;
                const fade = Math.min(1, m.life / 35);
                if (this.fireLevel > 0.1) {
                    ctx.globalAlpha = fade * (0.45 + this.fireLevel * 0.45);
                    ctx.fillStyle = (i % 3 === 0) ? '#ffd32a' : ((i % 2 === 0) ? '#ff7f50' : '#ff4757');
                } else if (this.siegeLevel > 0.1) {
                    ctx.globalAlpha = fade * (0.28 + this.siegeLevel * 0.35);
                    ctx.fillStyle = (i % 4 === 0) ? '#ffa502' : '#d2dae2';
                } else {
                    ctx.globalAlpha = fade * 0.45 * this.duskLevel;
                    ctx.fillStyle = '#ffeaa7';
                }
                ctx.beginPath();
                ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    static drawScreenAtmosphere(ctx, width, height) {
        if (!this.active || !ctx || width <= 0 || height <= 0) return;
        const kolAlpha = (typeof KolossosArenaAtmosphere !== 'undefined') ? (KolossosArenaAtmosphere.intensity || 0) : 0;
        const fadeForKol = Math.max(0, 1 - kolAlpha);
        if (fadeForKol <= 0.02) return;

        ctx.save();
        // Subtle warm sunset edge glow (W20-29) -> Siege haze (W30-36) -> Crimson mist (W37-39)
        if (this.redLevel > 0.04) {
            const vig = this._getVignetteSprite();
            if (vig) {
                const pulse = 0.88 + Math.sin(this.age * 0.05) * 0.12;
                ctx.globalAlpha = Math.min(0.68, this.redLevel * 0.62 * pulse) * fadeForKol;
                ctx.drawImage(vig, -width * 0.03, -height * 0.03, width * 1.06, height * 1.06);
            }
            ctx.globalAlpha = this.redLevel * 0.075 * fadeForKol;
            ctx.fillStyle = '#c81e28';
            ctx.fillRect(0, 0, width, height);
        } else if (this.duskLevel > 0.04) {
            ctx.globalAlpha = this.duskLevel * 0.055 * fadeForKol;
            ctx.fillStyle = '#e67e22';
            ctx.fillRect(0, 0, width, height);
        }
        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.EndlessMapEvolution = EndlessMapEvolution;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EndlessMapEvolution;
}
