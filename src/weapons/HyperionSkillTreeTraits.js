/**
 * Lesa.io - Hyperion Celestial Glaive Skill Tree Capstone Traits Handler
 * Keeps HyperionCelestialGlaive.js under 600 lines while executing both Path Capstones:
 *   - solar_echo: Delayed secondary 290px Solar Collapse detonation + stun from Celestial Rifts
 *   - astral_flock: Twin seeking Prism Shards on every swing + +2 orbiting Star-Blades (5 total)
 */

class HyperionSkillTreeTraits {
    static _solarEchoes = [];
    static _shards = [];

    static onSwing(originX, originY, aim, baseDmg, critChance, critMult, config, player, g) {
        const trait = config && config.celestialTraitId;
        if (trait === 'astral_flock' && g && !g.isCoopGuest) {
            for (const off of [-0.42, 0.42]) {
                const ang = aim + off;
                this._shards.push({
                    x: originX + Math.cos(ang) * 20,
                    y: originY + Math.sin(ang) * 20,
                    vx: Math.cos(ang) * 14,
                    vy: Math.sin(ang) * 14,
                    damage: Math.max(20, Math.round(baseDmg * 0.48)),
                    critChance, critMult,
                    life: 44, maxLife: 44,
                    hitSet: new Set()
                });
            }
        }
    }

    static onRiftDetonate(rift, g, effects) {
        if (!rift || rift.celestialTraitId !== 'solar_echo' || (g && g.isCoopGuest)) return;
        this._solarEchoes.push({
            x: rift.x,
            y: rift.y,
            radius: 290,
            damage: Math.round((rift.damage || 120) * 0.85),
            timer: 18,
            maxTimer: 18
        });
        if (effects) effects.addComicSplash(rift.x, rift.y - 44, '☀️ SOLAR ECHO!', '#fbbf24', 20, true);
    }

    static hitObstacle(obs, damage, effects, game) {
        if (!obs || obs.dead || (obs.type !== 'crate' && obs.type !== 'barrel')) return false;
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        const destroyed = !(g && g.isCoopGuest) ? obs.takeDamage(damage, effects, g) : false;
        if (destroyed && obs.type === 'crate' && g && Array.isArray(g.drops) && typeof Drop !== 'undefined') {
            g.drops.push(new Drop(obs.x, obs.y, 'xp', 20));
            if (Math.random() < 0.35) g.drops.push(new Drop(obs.x, obs.y, 'heart', 25));
        }
        return destroyed;
    }

    static damageObstaclesInCircle(cx, cy, radius, damage, game, effects, hitSet = null) {
        const obsList = game && game.arena && Array.isArray(game.arena.obstacles) ? game.arena.obstacles : null;
        if (!obsList || (game && game.isCoopGuest)) return;
        for (let i = 0; i < obsList.length; i++) {
            const obs = obsList[i];
            if (!obs || obs.dead || (obs.type !== 'crate' && obs.type !== 'barrel')) continue;
            if (hitSet && hitSet.has(obs)) continue;
            if (Math.hypot(obs.x - cx, obs.y - cy) <= radius + (obs.radius || 24)) {
                if (hitSet) hitSet.add(obs);
                this.hitObstacle(obs, damage, effects, game);
            }
        }
    }

    static damageObstaclesInArc(ox, oy, aim, radius, halfConeRad, damage, game, effects) {
        const obsList = game && game.arena && Array.isArray(game.arena.obstacles) ? game.arena.obstacles : null;
        if (!obsList || (game && game.isCoopGuest)) return;
        for (let i = 0; i < obsList.length; i++) {
            const obs = obsList[i];
            if (!obs || obs.dead || (obs.type !== 'crate' && obs.type !== 'barrel')) continue;
            const dx = obs.x - ox, dy = obs.y - oy, dist = Math.hypot(dx, dy);
            if (dist > radius + (obs.radius || 24)) continue;
            let diff = Math.atan2(dy, dx) - aim;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            if (dist <= 36 || Math.abs(diff) <= halfConeRad) {
                this.hitObstacle(obs, damage, effects, game);
            }
        }
    }

    static damageOrbitObstacles(bx, by, maxDist, damage, game, effects, tethers = null, tetherCol = '#38bdf8') {
        const obsList = game && game.arena && Array.isArray(game.arena.obstacles) ? game.arena.obstacles : null;
        if (!obsList || (game && game.isCoopGuest)) return;
        let best = null, bestD = maxDist;
        for (let i = 0; i < obsList.length; i++) {
            const obs = obsList[i];
            if (!obs || obs.dead || (obs.type !== 'crate' && obs.type !== 'barrel')) continue;
            const d = Math.hypot(obs.x - bx, obs.y - by);
            if (d <= 28 + (obs.radius || 24)) this.hitObstacle(obs, damage, effects, game);
            else if (tethers && d < bestD) { bestD = d; best = obs; }
        }
        if (best && tethers) {
            this.hitObstacle(best, damage, effects, game);
            tethers.push({ x1: bx, y1: by, x2: best.x, y2: best.y, timer: 8, maxTimer: 8, color: tetherCol });
        }
    }

    static update(dt, game) {
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        const enemies = g && Array.isArray(g.enemies) ? g.enemies : null;
        const effects = g ? g.effects : null;
        const isGuest = !!(g && g.isCoopGuest);

        for (let i = this._shards.length - 1; i >= 0; i--) {
            const s = this._shards[i];
            s.life -= dt;
            if (!isGuest && enemies && enemies.length > 0) {
                let best = null, bestSq = 280 * 280;
                for (let k = 0; k < enemies.length; k++) {
                    const e = enemies[k];
                    if (!e || e.dead || e.isDying || e.isAirborneImmune || s.hitSet.has(e)) continue;
                    const dSq = (e.x - s.x) ** 2 + (e.y - s.y) ** 2;
                    if (dSq < bestSq) { bestSq = dSq; best = e; }
                }
                if (best) {
                    const a = Math.atan2(best.y - s.y, best.x - s.x);
                    s.vx = Math.cos(a) * 14; s.vy = Math.sin(a) * 14;
                }
                for (let k = 0; k < enemies.length; k++) {
                    const e = enemies[k];
                    if (!e || e.dead || e.isDying || e.isAirborneImmune || s.hitSet.has(e)) continue;
                    if (Math.hypot(e.x - s.x, e.y - s.y) <= 18 + (e.radius || 20)) {
                        s.hitSet.add(e);
                        const isCrit = Math.random() < (s.critChance || 0.3);
                        const dmg = Math.round(s.damage * (isCrit ? (s.critMult || 2) : 1));
                        if (typeof e.takeDamage === 'function') e.takeDamage(dmg, effects, isCrit, false);
                        if (effects) effects.addSparks(e.x, e.y, '#7dd3fc', 4);
                        s.life = 0;
                        break;
                    }
                }
                const obsList = s.life > 0 && g && g.arena && Array.isArray(g.arena.obstacles) ? g.arena.obstacles : null;
                if (obsList) {
                    for (let k = 0; k < obsList.length; k++) {
                        const obs = obsList[k];
                        if (!obs || obs.dead || (obs.type !== 'crate' && obs.type !== 'barrel') || s.hitSet.has(obs)) continue;
                        if (Math.hypot(obs.x - s.x, obs.y - s.y) <= 18 + (obs.radius || 24)) {
                            s.hitSet.add(obs);
                            this.hitObstacle(obs, s.damage, effects, g);
                            if (effects) effects.addSparks(obs.x, obs.y, '#7dd3fc', 4);
                            s.life = 0;
                            break;
                        }
                    }
                }
            }
            s.x += s.vx * dt; s.y += s.vy * dt;
            if (s.life <= 0) this._shards.splice(i, 1);
        }

        for (let i = this._solarEchoes.length - 1; i >= 0; i--) {
            const se = this._solarEchoes[i];
            se.timer -= dt;
            if (se.timer <= 0) {
                if (!isGuest && enemies) {
                    for (let k = 0; k < enemies.length; k++) {
                        const e = enemies[k];
                        if (!e || e.dead || e.isDying || e.isAirborneImmune) continue;
                        if (Math.hypot(e.x - se.x, e.y - se.y) <= se.radius + (e.radius || 20)) {
                            if (typeof e.takeDamage === 'function') e.takeDamage(se.damage, effects, true, false);
                            if (!e.isStationary && !(e.isBoss || e.isMiniBoss)) e.stunTimer = Math.max(e.stunTimer || 0, 54);
                        }
                    }
                }
                if (!isGuest) this.damageObstaclesInCircle(se.x, se.y, se.radius, se.damage, g, effects);
                if (effects) {
                    effects.addShockwave(se.x, se.y, se.radius, 'rgba(251, 191, 36, 0.95)');
                    effects.addSparks(se.x, se.y, '#fbbf24', 14);
                }
                this._solarEchoes.splice(i, 1);
            }
        }
    }

    static drawWorld(ctx) {
        if (!ctx) return;
        for (const s of this._shards) {
            const ang = Math.atan2(s.vy, s.vx);
            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate(ang);
            ctx.fillStyle = '#38bdf8';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.4;
            ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-6, -4.5); ctx.lineTo(-3, 0); ctx.lineTo(-6, 4.5); ctx.closePath();
            ctx.fill(); ctx.stroke();
            ctx.restore();
        }
        for (const se of this._solarEchoes) {
            const p = 1 - Math.max(0, se.timer / se.maxTimer);
            ctx.save();
            ctx.translate(se.x, se.y);
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 6]);
            ctx.beginPath(); ctx.arc(0, 0, se.radius * (0.28 + p * 0.72), 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
        }
    }

    static clear() {
        this._solarEchoes.length = 0;
        this._shards.length = 0;
    }
}

if (typeof window !== 'undefined') window.HyperionSkillTreeTraits = HyperionSkillTreeTraits;
if (typeof module !== 'undefined' && module.exports) module.exports = { HyperionSkillTreeTraits };
