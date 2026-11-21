/**
 * Lesa.io - Active Skill: Bouzouki Jukebox (Epic)
 * Drops a rich 2.5D Neon Tavern Bouzouki Jukebox that projects a rotating disco taunt ring,
 * lures nearby non-boss enemies to dance around its spotlight, and detonates in a megabass AoE blast.
 */

class BouzoukiDecoyHazard {
    constructor(x, y, cfg, damageMult, game) {
        this.x = x;
        this.y = y;
        this.lureRadius = cfg.lureRadius || 240;
        this.blastRadius = cfg.blastRadius || 210;
        this.radius = this.lureRadius; // Required for Game.js Camera.isVisible culling check!
        this.duration = cfg.duration || 240;
        this.maxDuration = this.duration;
        this.damage = (cfg.damage || 240) * (damageMult || 1);
        this.stunDuration = cfg.stunDuration || 1.0;
        this.pullSpeed = cfg.pullSpeed || 1.15;
        this.game = game;
        this.age = 0;
        this.pulseTimer = 0;
        this.dead = false;
        this.notes = [];
        for (let i = 0; i < 8; i++) {
            this.notes.push({
                ang: (i / 8) * Math.PI * 2,
                spd: 0.036 + (i % 3) * 0.012,
                bob: i * 0.85,
                rad: 48 + (i % 2) * 18,
                sym: i % 3 === 0 ? '♪' : (i % 3 === 1 ? '♫' : '★')
            });
        }
    }

    _rRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(x, y, w, h, r);
        } else {
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
        }
    }

    _detonate(enemies, effects) {
        this.dead = true;
        const cam = this.game ? this.game.camera : null;
        if (cam && typeof cam.addShake === 'function') cam.addShake(11);

        if (effects) {
            effects.addComicSplash(this.x, this.y - 46, 'OPA!! MEGA BASS! 🎶', '#ff6b81');
            effects.addShockwave(this.x, this.y, this.blastRadius + 24, 'rgba(255, 107, 129, 0.94)');
            effects.addShockwave(this.x, this.y, this.blastRadius * 0.72, 'rgba(0, 210, 211, 0.88)');
            effects.addSparks(this.x, this.y, '#ff9ff3', 22);
            effects.addSparks(this.x, this.y, '#00d2d3', 16);
            effects.addSparks(this.x, this.y, '#fed330', 12);
        }
        if (window.soundEngine && typeof window.soundEngine.playHit === 'function') {
            window.soundEngine.playHit(true, true);
        }

        if (!Array.isArray(enemies)) return;
        for (const e of enemies) {
            if (!e || e.dead || e.isDying || e.isAirborneImmune) continue;
            const dx = e.x - this.x;
            const dy = e.y - this.y;
            const hitR = this.blastRadius + (e.radius || 22);
            if (dx * dx + dy * dy <= hitR * hitR) {
                e.takeDamage(this.damage, effects, false);
                if (!e.dead && e.hp > 0 && !e.isStationary) {
                    const dist = Math.max(1, Math.hypot(dx, dy));
                    e.x += (dx / dist) * (e.isBoss ? 10 : 30);
                    e.y += (dy / dist) * (e.isBoss ? 10 : 30);
                    if (typeof e.applyStun === 'function') e.applyStun(this.stunDuration, effects);
                    else e.stunTimer = Math.max(e.stunTimer || 0, Math.round(this.stunDuration * 60));
                }
            }
        }
    }

    update(dt = 1, enemies = [], player = null, effects = null) {
        if (this.dead) return;
        this.age += dt;
        this.duration -= dt;

        if (this.duration <= 0) {
            this._detonate(enemies, effects);
            return;
        }

        this.pulseTimer += dt;
        const doBeat = this.pulseTimer >= 26;
        if (doBeat) {
            this.pulseTimer -= 26;
            if (effects) {
                effects.addShockwave(this.x, this.y, this.lureRadius * 0.86, 'rgba(255, 107, 129, 0.50)');
                effects.addSparks(this.x, this.y - 24, Math.random() < 0.5 ? '#ff9ff3' : '#00d2d3', 4);
            }
        }

        for (const n of this.notes) {
            n.ang += n.spd * dt;
            n.bob += 0.12 * dt;
        }

        // Lure & groove-slow nearby enemies into dancing around the jukebox spotlight (keeps center model clear!)
        if (!Array.isArray(enemies)) return;
        for (const e of enemies) {
            if (!e || e.dead || e.isDying || e.isAirborneImmune || e.isStationary) continue;
            const dx = this.x - e.x;
            const dy = this.y - e.y;
            const distSq = dx * dx + dy * dy;
            const maxR = this.lureRadius + (e.radius || 22);
            if (distSq <= maxR * maxR) {
                const dist = Math.hypot(dx, dy);
                const minStandOff = 54 + (e.radius || 18);
                if (!e.isBoss && dist > minStandOff) {
                    e.x += (dx / dist) * this.pullSpeed * dt;
                    e.y += (dy / dist) * this.pullSpeed * dt;
                }
                if (typeof e.applySonicSlow === 'function') {
                    e.applySonicSlow(0.35, 0.72, null);
                }
                if (doBeat && effects && Math.random() < 0.25) {
                    effects.addSparks(e.x, e.y, '#ff9ff3', 2);
                }
            }
        }
    }

    _drawDiscoFloor(ctx, beat, urgent) {
        const ringAlpha = 0.20 + (urgent ? 0.16 : 0.06) * Math.abs(beat);
        const floorGrad = ctx.createRadialGradient(0, 0, 28, 0, 0, this.lureRadius);
        floorGrad.addColorStop(0, 'rgba(254, 211, 48, 0.34)');
        floorGrad.addColorStop(0.28, `rgba(196, 69, 105, ${ringAlpha * 1.1})`);
        floorGrad.addColorStop(1, 'rgba(87, 75, 144, 0.06)');
        ctx.fillStyle = floorGrad;
        ctx.beginPath(); ctx.arc(0, 0, this.lureRadius, 0, Math.PI * 2); ctx.fill();

        // Sweeping Disco Spotlight Beams
        const beamColors = ['rgba(255, 159, 243, 0.16)', 'rgba(0, 210, 211, 0.14)', 'rgba(254, 211, 48, 0.14)'];
        for (let i = 0; i < 3; i++) {
            const a = this.age * 0.024 + (i * Math.PI * 2) / 3;
            ctx.fillStyle = beamColors[i];
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, this.lureRadius * 0.96, a - 0.22, a + 0.22);
            ctx.closePath();
            ctx.fill();
        }

        // Outer Dashed Neon Lure Perimeter
        ctx.strokeStyle = urgent ? '#ff4757' : '#ff9ff3';
        ctx.lineWidth = urgent ? 3.8 : 2.8;
        ctx.setLineDash([14, 9]);
        ctx.beginPath(); ctx.arc(0, 0, this.lureRadius, this.age * 0.02, this.age * 0.02 + Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);

        // Expanding Beat Echo Wave
        const echo = this.pulseTimer / 26;
        ctx.strokeStyle = `rgba(0, 210, 211, ${0.70 * (1 - echo)})`;
        ctx.lineWidth = 3.2;
        ctx.beginPath(); ctx.arc(0, 0, 34 + echo * (this.lureRadius - 34), 0, Math.PI * 2); ctx.stroke();

        // Bright Stage Podium Directly Under Jukebox
        ctx.fillStyle = urgent ? 'rgba(255, 71, 87, 0.28)' : 'rgba(254, 211, 48, 0.25)';
        ctx.beginPath(); ctx.ellipse(0, 12, 46, 26, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = urgent ? '#ffdd59' : '#fed330';
        ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.ellipse(0, 12, 46, 26, 0, 0, Math.PI * 2); ctx.stroke();
    }

    _drawJukeboxModel(ctx, beat, urgent) {
        const dropInT = Math.min(1, this.age / 10);
        const dropHeight = (1 - dropInT) * (1 - dropInT) * 70;
        const squashX = 1 + Math.max(0, beat) * 0.09 + (dropInT < 1 ? (1 - dropInT) * 0.15 : 0);
        const squashY = 2 - squashX;
        const jitterX = urgent ? Math.sin(this.age * 1.9) * 2.5 : 0;

        ctx.save();
        ctx.translate(jitterX, -dropHeight - Math.max(0, beat) * 6);

        // Ground Contact Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
        ctx.beginPath(); ctx.ellipse(0, 24 + dropHeight, 30 * dropInT, 10 * dropInT, 0, 0, Math.PI * 2); ctx.fill();

        ctx.scale(squashX, squashY);

        // Outer Glow Halo Behind Jukebox
        const glowGrad = ctx.createRadialGradient(0, -10, 8, 0, -10, 48);
        glowGrad.addColorStop(0, urgent ? 'rgba(255, 71, 87, 0.48)' : 'rgba(255, 107, 129, 0.36)');
        glowGrad.addColorStop(1, 'rgba(0, 210, 211, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath(); ctx.arc(0, -10, 48, 0, Math.PI * 2); ctx.fill();

        // Main 2.5D Arched Vintage Jukebox Cabinet
        ctx.strokeStyle = '#0f1419';
        ctx.lineWidth = 3.2;
        ctx.lineJoin = 'round';
        const cabGrad = ctx.createLinearGradient(-26, -42, 26, 26);
        cabGrad.addColorStop(0, urgent && Math.floor(this.age / 4) % 2 === 0 ? '#ff4757' : '#6c5ce7');
        cabGrad.addColorStop(0.5, '#3b2458');
        cabGrad.addColorStop(1, '#1e1635');
        ctx.fillStyle = cabGrad;
        ctx.beginPath();
        ctx.moveTo(-26, 22);
        ctx.lineTo(-26, -24);
        ctx.arc(0, -24, 26, Math.PI, 0, false);
        ctx.lineTo(26, 22);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Classic Chasing Neon Side Tubes (Left & Right Pillars)
        const tubeColors = ['#00f5ff', '#ff9ff3', '#fed330', '#ff6b81'];
        for (let row = 0; row < 4; row++) {
            const cIdx = (Math.floor(this.age / 5) + row) % tubeColors.length;
            ctx.fillStyle = tubeColors[cIdx];
            ctx.strokeStyle = '#0f1419';
            ctx.lineWidth = 1.6;
            this._rRect(ctx, -23, -18 + row * 9, 5, 7, 2); ctx.fill(); ctx.stroke();
            this._rRect(ctx, 18, -18 + row * 9, 5, 7, 2); ctx.fill(); ctx.stroke();
        }

        // Arch Neon Tube Rim + "OPA!" Lit Marquee Header
        ctx.strokeStyle = urgent ? '#ffdd59' : '#00f5ff';
        ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.arc(0, -24, 21, Math.PI + 0.15, -0.15, false); ctx.stroke();

        ctx.fillStyle = '#140f24';
        ctx.strokeStyle = '#fed330';
        ctx.lineWidth = 1.8;
        this._rRect(ctx, -15, -36, 30, 12, 4); ctx.fill(); ctx.stroke();
        ctx.font = 'bold 9px "Bangers", sans-serif';
        ctx.fillStyle = urgent ? '#ff6b81' : '#fed330';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(urgent ? 'BOOM!!' : 'OPA! ♪', 0, -29.5);

        // Live 5-Band Animated Equalizer Window
        ctx.fillStyle = '#0c1020';
        ctx.strokeStyle = '#0f1419';
        ctx.lineWidth = 2;
        this._rRect(ctx, -14, -20, 28, 12, 3); ctx.fill(); ctx.stroke();
        for (let bar = 0; bar < 5; bar++) {
            const bh = 3 + Math.abs(Math.sin(this.age * 0.35 + bar * 1.1)) * 7;
            ctx.fillStyle = bar % 2 === 0 ? '#00d2d3' : '#ff9ff3';
            ctx.fillRect(-11 + bar * 4.8, -10 - bh, 3.2, bh);
        }

        // Large Thumping Subwoofer Speaker + Crossed Golden Bouzouki Crest
        const coneR = 13 + Math.max(0, beat) * 2.5;
        ctx.fillStyle = '#1e272e';
        ctx.strokeStyle = '#0f1419';
        ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.arc(0, 7, coneR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#ff9ff3';
        ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.arc(0, 7, coneR * 0.65, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#fed330';
        ctx.beginPath(); ctx.arc(0, 7, 4.2, 0, Math.PI * 2); ctx.fill();

        // Crossed Golden Bouzouki Silhouettes Flanking the Speaker
        ctx.save();
        ctx.translate(0, 7);
        for (const dir of [-1, 1]) {
            ctx.save();
            ctx.rotate(dir * 0.58);
            ctx.strokeStyle = '#0f1419'; ctx.lineWidth = 2;
            ctx.fillStyle = '#e67e22';
            ctx.fillRect(-1.5, -18, 3, 18);
            ctx.fillStyle = '#fed330';
            ctx.beginPath(); ctx.ellipse(0, 4, 4.5, 6.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.restore();
        }
        ctx.restore();

        // Chrome Legs / Feet
        ctx.fillStyle = '#dfe6e9';
        ctx.strokeStyle = '#0f1419';
        ctx.lineWidth = 2.2;
        ctx.fillRect(-23, 21, 7, 5); ctx.strokeRect(-23, 21, 7, 5);
        ctx.fillRect(16, 21, 7, 5); ctx.strokeRect(16, 21, 7, 5);

        // Sleek Countdown Fuse Progress Bar Above Crown
        const lifeFrac = Math.max(0, this.duration / this.maxDuration);
        ctx.fillStyle = 'rgba(15, 20, 25, 0.85)';
        this._rRect(ctx, -20, -58, 40, 6, 3); ctx.fill();
        ctx.fillStyle = urgent ? '#ff4757' : (lifeFrac < 0.45 ? '#fed330' : '#00f5ff');
        this._rRect(ctx, -19, -57, 38 * lifeFrac, 4, 2); ctx.fill();

        ctx.restore();
    }

    draw(ctx) {
        if (this.dead) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        const urgent = this.duration < 48;
        const beat = Math.sin(this.age * (urgent ? 0.55 : 0.26));

        this._drawDiscoFloor(ctx, beat, urgent);
        this._drawJukeboxModel(ctx, beat, urgent);

        // Orbiting Glowing Music Notes & Equalizer Stars
        ctx.font = 'bold 18px "Bangers", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const n of this.notes) {
            const nx = Math.cos(n.ang) * n.rad;
            const ny = Math.sin(n.ang) * (n.rad * 0.52) - 24 + Math.sin(n.bob) * 8;
            ctx.fillStyle = n.sym === '♪' ? '#00f5ff' : (n.sym === '♫' ? '#ff9ff3' : '#fed330');
            ctx.strokeStyle = '#0f1419';
            ctx.lineWidth = 3.2;
            ctx.strokeText(n.sym, nx, ny);
            ctx.fillText(n.sym, nx, ny);
        }

        ctx.restore();
    }
}

class BouzoukiDecoySkill {
    static execute(player, level, enemies = [], effects = null, camera = null, game = null) {
        const sd = (typeof SKILLS !== 'undefined' && SKILLS.bouzouki_decoy) ? SKILLS.bouzouki_decoy : null;
        const ld = (sd && sd.levels) ? (sd.levels[level] || sd.levels[1]) : { lureRadius: 240, blastRadius: 210, duration: 240, damage: 240, stunDuration: 1.0, pullSpeed: 1.15 };
        const cdSec = sd ? sd.cooldown : 12.5;
        player.skillCooldown = Math.round(cdSec * 60);
        player.maxSkillCooldown = player.skillCooldown;

        const activeGame = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        const angle = Number.isFinite(player.angle) ? player.angle : 0;
        let tx = player.x + Math.cos(angle) * 145;
        let ty = player.y + Math.sin(angle) * 145;
        if (activeGame && activeGame.arena) {
            const hw = (activeGame.arena.halfWidth || (activeGame.arena.width ? activeGame.arena.width * 0.5 : 1400)) - 75;
            const hh = (activeGame.arena.halfHeight || (activeGame.arena.height ? activeGame.arena.height * 0.5 : 1400)) - 75;
            tx = Math.max(-hw, Math.min(hw, tx));
            ty = Math.max(-hh, Math.min(hh, ty));
        }

        if (effects) {
            effects.addComicSplash(player.x, player.y - 34, 'DROP THE BEAT! 🎶', '#ff9ff3');
            effects.addShockwave(tx, ty, 75, 'rgba(255, 159, 243, 0.85)');
            effects.addSparks(tx, ty, '#fed330', 10);
        }
        if (camera && typeof camera.addShake === 'function') camera.addShake(6);
        if (window.soundEngine && typeof window.soundEngine.playBladeSwish === 'function') window.soundEngine.playBladeSwish();

        if (activeGame) {
            if (!activeGame.hazards) activeGame.hazards = [];
            activeGame.hazards.push(new BouzoukiDecoyHazard(tx, ty, ld, player.damageMultiplier || 1, activeGame));
        }
    }
}

if (typeof window !== 'undefined') window.BouzoukiDecoySkill = BouzoukiDecoySkill;
if (typeof module !== 'undefined' && module.exports) module.exports = { BouzoukiDecoySkill, BouzoukiDecoyHazard };
