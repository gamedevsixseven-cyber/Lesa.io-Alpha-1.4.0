/**
 * Lesa.io - Lil Xas Cutscene VFX & Ear-Bleed Fleeing Visuals
 * Renders:
 *   1. Concert Blast Sonic Shockwaves expanding across the arena
 *   2. Inflamed crimson ears + animated dripping/falling blood teardrops on both ears of every fleeing enemy
 *   3. Crimson ear-blood droplet splatters along the grass behind panicking enemies
 */

class LilXasCutsceneFX {
    static sonicWaves = [];
    static bloodDrops = [];
    static _fleeCamPos = null;
    static _screamLines = [
        'MY EARS ARE BLEEDING!! 😭🩸', 'THIS SONG IS TRASH!! 🙉🩸', 'TURN IT OFF!! 😱🩸',
        'I CANNOT TAKE THIS!! 🏃', 'BRO WHO LET HIM COOK?! 💀', 'MY EARDRUMS!! 🔥🙉'
    ];

    static reset() {
        this.sonicWaves.length = 0;
        this.bloodDrops.length = 0;
        this._fleeCamPos = null;
    }

    static tagFleeingEnemies(enemies, stage) {
        if (!Array.isArray(enemies) || !stage) return;
        for (const e of enemies) {
            if (!e || e.dead || e.isLilXas || e.isLilXasSpeaker) continue;
            e._lilXasFleeing = true;
            e._fleeWaitForCamera = true;
            e._earBleedAge = 0;
            e._earPainTimer = 46;
            e._earSeed = Math.random() * 12;
            e._screamCd = 20 + Math.random() * 25;
            e._bloodTick = Math.random() * 8;
            e.fearTimer = 0;
            const baseAng = Math.atan2(e.y - stage.y, e.x - stage.x);
            e._fleeAngle = baseAng + (Math.random() - 0.5) * 0.72;
        }
    }

    static releaseFleeingPanic(g, overlay) {
        for (const e of g.enemies) {
            if (!e || !e._lilXasFleeing) continue;
            e._fleeWaitForCamera = false;
            this.spawnGroundBlood(e.x, e.y, e.radius || 24);
            if (g.effects) {
                const msg = this._screamLines[Math.floor(Math.random() * this._screamLines.length)];
                g.effects.addComicSplash(e.x, e.y - 42, msg, '#ff4757');
            }
        }
        this.triggerEnemyImpactWaves(g.enemies, g.effects);
        if (overlay) {
            overlay.setDialogue('EVERY ENEMY', 'AAAAHHH MY EARS ARE BLEEDING!! THIS SONG IS TRASH!! RUN FOR YOUR LIVES!! 😭🙉🩸', '#ff4757', '🙉', false);
        }
        if (g.camera) g.camera.addShake(9);
    }

    static countFleeingEnemies(g) {
        let count = 0;
        for (const e of g.enemies) {
            if (e && e._lilXasFleeing) count++;
        }
        return count;
    }

    static computeFleeCameraTarget(g) {
        const arena = g.arena;
        const maxX = arena ? arena.halfWidth + 80 : 1480;
        const maxY = arena ? arena.halfHeight + 80 : 1480;
        let sumX = 0, sumY = 0, n = 0;
        for (const e of g.enemies) {
            if (!e || !e._lilXasFleeing) continue;
            if (Math.abs(e.x) > maxX || Math.abs(e.y) > maxY) continue;
            sumX += e.x;
            sumY += e.y;
            n++;
        }
        if (n > 0) {
            const tx = sumX / n;
            const ty = sumY / n;
            if (!this._fleeCamPos) this._fleeCamPos = { x: tx, y: ty };
            else {
                this._fleeCamPos.x += (tx - this._fleeCamPos.x) * 0.25;
                this._fleeCamPos.y += (ty - this._fleeCamPos.y) * 0.25;
            }
            return { x: this._fleeCamPos.x, y: this._fleeCamPos.y };
        }
        return this._fleeCamPos || { x: g.player.x, y: g.player.y };
    }

    static updateFleeingEnemies(dt, g, stage, allowSpawns) {
        const arena = g.arena;
        for (let i = g.enemies.length - 1; i >= 0; i--) {
            const e = g.enemies[i];
            if (!e || !e._lilXasFleeing) continue;
            e._earBleedAge = (e._earBleedAge || 0) + dt;
            if (e._fleeWaitForCamera) continue;

            // Drip crimson ear-blood onto the grass as they clutch ears & sprint away
            e._bloodTick = (e._bloodTick || 0) - dt;
            if (e._bloodTick <= 0) {
                e._bloodTick = (e._earPainTimer || 0) > 0 ? 7 : 10;
                this.spawnGroundBlood(e.x, e.y, e.radius || 24);
            }

            if ((e._earPainTimer || 0) > 0) {
                e._earPainTimer -= dt;
                e.vx = 0;
                e.vy = 0;
                continue;
            }

            const fallbackAng = stage ? Math.atan2(e.y - stage.y, e.x - stage.x) : 0;
            const fleeAng = Number.isFinite(e._fleeAngle) ? e._fleeAngle : fallbackAng;
            const spd = 9.8 * dt;
            e.vx = Math.cos(fleeAng) * 9.8;
            e.vy = Math.sin(fleeAng) * 9.8;
            e.x += Math.cos(fleeAng) * spd;
            e.y += Math.sin(fleeAng) * spd;
            e.angle = fleeAng;
            e.walkCycle += 0.44 * dt;
            e._screamCd = (e._screamCd || 0) - dt;
            if (allowSpawns && e._screamCd <= 0 && g.effects) {
                e._screamCd = 32 + Math.random() * 24;
                const msg = Math.random() < 0.5 ? '🙉 MY EARS BLEED!!' : '🩸 RUN AWAY!!';
                g.effects.addComicSplash(e.x, e.y - 36, msg, '#ff4757');
            }
            // Let enemies visibly run over the arena border before despawning off-screen
            if (arena && (Math.abs(e.x) > arena.halfWidth + 145 || Math.abs(e.y) > arena.halfHeight + 145)) {
                if (g.effects) g.effects.addDust(e.x, e.y, 4, 8);
                g.enemies.splice(i, 1);
            }
        }
    }

    static triggerStageBlast(stage, effects) {
        if (!stage) return;
        const specs = [
            { radius: 24, maxRadius: 1150, speed: 13.5, width: 8, color: '#e056fd', label: '♫' },
            { radius: 10, maxRadius: 1250, speed: 10.5, width: 6, color: '#00f5ff', label: '♪' },
            { radius: 6, maxRadius: 960, speed: 16.5, width: 7, color: '#ff4757', label: '🔊' }
        ];
        for (const s of specs) {
            if (this.sonicWaves.length >= 18) this.sonicWaves.shift();
            this.sonicWaves.push({ x: stage.x, y: stage.y, ...s, alpha: 0.95 });
        }
        if (effects) {
            effects.addShockwave(stage.x, stage.y, 260, 'rgba(224, 86, 253, 0.88)');
            effects.addShockwave(stage.x, stage.y, 190, 'rgba(0, 245, 255, 0.85)');
        }
    }

    static triggerEnemyImpactWaves(enemies, effects) {
        if (!Array.isArray(enemies)) return;
        let count = 0;
        for (let i = 0; i < enemies.length && count < 4; i++) {
            const e = enemies[i];
            if (!e || e.dead || e.isLilXas || e.isLilXasSpeaker) continue;
            if (this.sonicWaves.length >= 18) this.sonicWaves.shift();
            this.sonicWaves.push({
                x: e.x,
                y: e.y - (e.radius || 24) * 0.5,
                radius: 10,
                maxRadius: 170,
                speed: 7.2,
                width: 4.5,
                color: count % 2 === 0 ? '#e056fd' : '#ff4757',
                label: '♫',
                alpha: 0.9
            });
            if (effects) effects.addSparks(e.x, e.y - 20, '#ef4444', 5);
            count++;
        }
    }

    static spawnGroundBlood(x, y, enemyRadius = 24) {
        if (this.bloodDrops.length >= 160) this.bloodDrops.shift();
        const ox = (Math.random() - 0.5) * enemyRadius * 0.9;
        const oy = enemyRadius * (0.45 + Math.random() * 0.4);
        this.bloodDrops.push({
            x: x + ox,
            y: y + oy,
            rx: 2.6 + Math.random() * 3.4,
            ry: 1.7 + Math.random() * 2.1,
            rot: (Math.random() - 0.5) * 0.9,
            life: 240,
            maxLife: 240
        });
    }

    static update(dt = 1) {
        for (let i = this.sonicWaves.length - 1; i >= 0; i--) {
            const w = this.sonicWaves[i];
            w.radius += w.speed * dt;
            w.alpha = Math.max(0, 1 - w.radius / w.maxRadius);
            if (w.radius >= w.maxRadius || w.alpha <= 0.02) {
                this.sonicWaves.splice(i, 1);
            }
        }
        for (let i = this.bloodDrops.length - 1; i >= 0; i--) {
            const d = this.bloodDrops[i];
            d.life -= dt;
            if (d.life <= 0) this.bloodDrops.splice(i, 1);
        }
    }

    static drawGroundBlood(ctx, camera) {
        if (this.bloodDrops.length === 0) return;
        ctx.save();
        for (let i = 0; i < this.bloodDrops.length; i++) {
            const d = this.bloodDrops[i];
            if (camera && !camera.isVisible(d.x, d.y, 18)) continue;
            const alpha = Math.min(0.88, (d.life / d.maxLife) * 1.45);
            ctx.globalAlpha = alpha;
            ctx.save();
            ctx.translate(d.x, d.y);
            ctx.rotate(d.rot);
            ctx.fillStyle = '#991b1b';
            ctx.beginPath();
            ctx.ellipse(0, 0, d.rx * 1.15, d.ry * 1.15, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.ellipse(-d.rx * 0.15, -d.ry * 0.12, d.rx * 0.78, d.ry * 0.72, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();
    }

    static drawSonicWaves(ctx, camera) {
        if (this.sonicWaves.length === 0) return;
        ctx.save();
        for (let i = 0; i < this.sonicWaves.length; i++) {
            const w = this.sonicWaves[i];
            if (camera && !camera.isVisible(w.x, w.y, w.radius + 30)) continue;
            ctx.globalAlpha = w.alpha;
            ctx.strokeStyle = w.color;
            ctx.lineWidth = w.width * Math.max(0.35, w.alpha);
            ctx.beginPath();
            ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
            ctx.stroke();

            // Orbiting note glyph along the blast ring
            if (w.radius > 45 && w.radius < 700) {
                ctx.fillStyle = '#fef08a';
                ctx.font = '900 18px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                for (let k = 0; k < 4; k++) {
                    const a = k * Math.PI * 0.5 + w.radius * 0.008;
                    ctx.fillText(w.label, w.x + Math.cos(a) * w.radius, w.y + Math.sin(a) * w.radius);
                }
            }
        }
        ctx.restore();
    }

    static _getEarAnchors(enemy) {
        const r = enemy.radius || 24;
        const bob = Math.sin(enemy.walkCycle || 0) * 2.5;
        if (enemy.type === 'skarmogyftos') {
            const ang = enemy.angle || 0;
            const hx = enemy.x + Math.cos(ang) * 3;
            const hy = enemy.y + Math.sin(ang) * 3 + bob;
            const px = -Math.sin(ang) * (r * 0.72);
            const py = Math.cos(ang) * (r * 0.72);
            return { lx: hx - px, ly: hy - py, rx: hx + px, ry: hy + py, floorY: enemy.y + r * 0.72 };
        }
        const usesFatmirPng = enemy.type === 'fatmir' && typeof window !== 'undefined' &&
            window.CharacterSprites && enemy.frontSpriteSrc && window.CharacterSprites.isReady(enemy.frontSpriteSrc);
        const headY = usesFatmirPng ? (enemy.y - 52 + bob) : (enemy.y - r * 0.60 + bob);
        const earSpread = usesFatmirPng ? 15 : (r * 0.49);
        return {
            lx: enemy.x - earSpread,
            ly: headY,
            rx: enemy.x + earSpread,
            ry: headY,
            floorY: enemy.y + r * 0.75
        };
    }

    static _drawTeardrop(ctx, x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y - size * 1.45);
        ctx.bezierCurveTo(x + size * 0.95, y - size * 0.2, x + size, y + size * 0.85, x, y + size);
        ctx.bezierCurveTo(x - size, y + size * 0.85, x - size * 0.95, y - size * 0.2, x, y - size * 1.45);
        ctx.closePath();
        ctx.fillStyle = '#dc2626';
        ctx.fill();
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = '#450a0a';
        ctx.stroke();

        // Glossy specular shine dot
        ctx.fillStyle = '#fca5a5';
        ctx.beginPath();
        ctx.arc(x - size * 0.26, y + size * 0.15, Math.max(0.9, size * 0.26), 0, Math.PI * 2);
        ctx.fill();
    }

    static drawFleeingEnemyOverlay(ctx, enemy) {
        if (!enemy || !enemy._lilXasFleeing) return;
        const r = enemy.radius || 24;
        const age = enemy._earBleedAge || 0;
        const seed = enemy._earSeed || 0;
        const inPain = (enemy._earPainTimer || 0) > 0;
        const shakeX = inPain ? Math.sin(age * 1.55 + seed) * 3.2 : Math.sin(age * 0.7 + seed) * 1.0;
        const anchors = this._getEarAnchors(enemy);
        const earThrob = 1 + 0.16 * Math.sin(age * 0.55 + seed);

        ctx.save();

        // 1. Sprinting Dust / Panic Speed Streaks behind moving enemy
        if (!inPain && (Math.abs(enemy.vx || 0) > 1 || Math.abs(enemy.vy || 0) > 1)) {
            const ang = Math.atan2(enemy.vy || 0, enemy.vx || 1);
            const nx = -Math.cos(ang);
            const ny = -Math.sin(ang);
            const px = -ny;
            const py = nx;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
            ctx.lineWidth = 2.2;
            ctx.lineCap = 'round';
            for (let s = -1; s <= 1; s++) {
                const bx = enemy.x + nx * (r * 0.9) + px * s * 9;
                const by = enemy.y + ny * (r * 0.5) + py * s * 9;
                ctx.beginPath();
                ctx.moveTo(bx, by);
                ctx.lineTo(bx + nx * 18, by + ny * 18);
                ctx.stroke();
            }
        }

        // 2. Both Left & Right Swollen Ears + Dripping Crimson Blood Streams + Falling Drops
        for (const [exRaw, eyRaw, side] of [[anchors.lx, anchors.ly, -1], [anchors.rx, anchors.ry, 1]]) {
            const ex = exRaw + shakeX;
            const ey = eyRaw;
            const earRx = Math.max(4.5, r * 0.21) * earThrob;
            const earRy = Math.max(6.2, r * 0.28) * earThrob;

            // Jagged purple/cyan sound shock arc hitting ear
            const wavePhase = ((age * 0.12 + (side < 0 ? 0 : 0.5)) % 1);
            ctx.strokeStyle = side < 0 ? `rgba(224, 86, 253, ${0.9 - wavePhase * 0.6})` : `rgba(0, 245, 255, ${0.9 - wavePhase * 0.6})`;
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            const arcR = earRy + 4 + wavePhase * 11;
            const baseA = side < 0 ? Math.PI : 0;
            ctx.arc(ex + side * 3, ey, arcR, baseA - 0.85, baseA + 0.85);
            ctx.stroke();

            // Swollen bright-red comic outer ear + deep crimson inner canal
            ctx.fillStyle = '#ff4757';
            ctx.strokeStyle = '#18181b';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.ellipse(ex + side * 2.5, ey, earRx, earRy, side * 0.22, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#7f1d1d';
            ctx.beginPath();
            ctx.ellipse(ex + side * 2.8, ey + 0.5, earRx * 0.52, earRy * 0.58, side * 0.22, 0, Math.PI * 2);
            ctx.fill();

            // Persistent dripping blood ribbon running from ear lobe downward
            const streamX = ex + side * (earRx * 0.45);
            const streamTop = ey + earRy * 0.35;
            const streamLen = 10 + Math.sin(age * 0.35 + seed + side) * 2.5;
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 3.2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(streamX, streamTop);
            ctx.quadraticCurveTo(streamX + side * 2.5, streamTop + streamLen * 0.55, streamX + side * 0.5, streamTop + streamLen);
            ctx.stroke();

            // Heavy hanging crimson droplet bulb right under ear lobe
            this._drawTeardrop(ctx, streamX + side * 0.5, streamTop + streamLen + 2.5, 3.1);

            // 3 staggered falling blood droplets plummeting to the grass
            const fallSpan = Math.max(20, anchors.floorY - (streamTop + 6));
            for (let d = 0; d < 3; d++) {
                const prog = (age * 0.052 + d * 0.33 + (side < 0 ? 0 : 0.16) + seed * 0.1) % 1;
                const dy = streamTop + 6 + prog * prog * fallSpan;
                const dx = streamX + side * (1.2 + Math.sin(d + seed) * 2.5);
                if (prog < 0.88) {
                    this._drawTeardrop(ctx, dx, dy, 2.7 - prog * 0.6);
                } else {
                    // Splash ring on the grass when ear blood hits the floor!
                    const sp = (prog - 0.88) / 0.12;
                    ctx.strokeStyle = `rgba(220, 38, 38, ${1 - sp})`;
                    ctx.lineWidth = 1.6;
                    ctx.beginPath();
                    ctx.ellipse(dx, anchors.floorY, 2 + sp * 6, 1 + sp * 3, 0, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }

        // 3. Panic Sweat Bead & Horror Starburst above head
        if (inPain || Math.sin(age * 0.4 + seed) > 0.1) {
            const sweatY = Math.min(anchors.ly, anchors.ry) - r * 0.38 - Math.abs(Math.sin(age * 0.25)) * 4;
            ctx.fillStyle = '#38bdf8';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(enemy.x + r * 0.36 + shakeX, sweatY, 3.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.LilXasCutsceneFX = LilXasCutsceneFX;
}
