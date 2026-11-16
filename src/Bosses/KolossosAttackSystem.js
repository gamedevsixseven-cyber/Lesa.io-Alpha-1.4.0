/**
 * Lesa.io - Kolossos MK-IV Unique Attacks & Hazard System
 * Implements never-before-seen mechanics for the W40 Final Endless Boss:
 *   1. Omega Thermal Laser Beam: telegraphed sweep sector -> rotating 920px scorching beam
 *   2. Magnetic Singularity Well: gravity vortex pull -> Crimson EMP Collapse blast
 *   3. Seismic Laser Cross-Grid: rotating '+' / '×' linear hazard corridor bombardments
 *   4. Boomerang Saw-Ring Fan & Counter-Rotating Spiral Helix
 */

class KolossosAttackSystem {
    static _pointToSegmentDist(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;
        if (lenSq <= 0.0001) return Math.hypot(px - x1, py - y1);
        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
        return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
    }

    static startOmegaBeam(boss, player, effects) {
        if (!boss || !player || boss.omegaBeam) return;
        const base = Math.atan2(player.y - boss.y, player.x - boss.x);
        const dir = Math.random() < 0.5 ? 1 : -1;
        const halfSweep = 1.15; // ~132 degree total sweep arc
        boss.omegaBeam = {
            phase: 'windup',
            timer: boss.isEnraged ? 38 : 46,
            maxTimer: boss.isEnraged ? 38 : 46,
            startAngle: base - dir * halfSweep,
            endAngle: base + dir * halfSweep,
            currentAngle: base - dir * halfSweep,
            dir,
            length: 920,
            halfWidth: 20,
            hitCooldown: 0
        };
        if (effects) {
            effects.addComicSplash(boss.x, boss.y - 68, '☢️ OMEGA BEAM CHARGING!');
            effects.addSparks(boss.x, boss.y, '#ff2e4c', 12);
        }
    }

    static updateOmegaBeam(boss, dt, player, effects) {
        const b = boss.omegaBeam;
        if (!b) return;
        if (b.hitCooldown > 0) b.hitCooldown -= dt;

        if (b.phase === 'windup') {
            b.timer -= dt;
            boss.angle = b.startAngle;
            if (b.timer <= 0) {
                b.phase = 'fire';
                b.maxTimer = boss.isEnraged ? 66 : 62;
                b.timer = b.maxTimer;
                if (effects) {
                    effects.addShockwave(boss.x, boss.y, 130, 'rgba(255, 46, 76, 0.92)');
                    if (typeof effects.onBossSlam === 'function') effects.onBossSlam(0.04);
                }
            }
            return;
        }

        b.timer -= dt;
        const progress = Math.max(0, Math.min(1, 1 - (b.timer / b.maxTimer)));
        b.currentAngle = b.startAngle + (b.endAngle - b.startAngle) * progress;
        boss.angle = b.currentAngle;

        const ex = boss.x + Math.cos(b.currentAngle) * b.length;
        const ey = boss.y + Math.sin(b.currentAngle) * b.length;

        if (effects && Math.floor(boss.age) % 3 === 0) {
            const midR = b.length * (0.25 + Math.random() * 0.65);
            effects.addSparks(boss.x + Math.cos(b.currentAngle) * midR, boss.y + Math.sin(b.currentAngle) * midR, '#ffa502', 3);
        }

        if (player && player.hp > 0 && b.hitCooldown <= 0) {
            const dist = this._pointToSegmentDist(player.x, player.y, boss.x, boss.y, ex, ey);
            if (dist <= b.halfWidth + (player.radius || 25)) {
                b.hitCooldown = 14;
                player.takeDamage(Math.round(boss.damage * 0.95), effects);
                if (effects) effects.addSparks(player.x, player.y, '#ff2e4c', 8);
            }
        }

        if (b.timer <= 0) {
            boss.omegaBeam = null;
        }
    }

    static spawnLaserCrossGrid(boss, player, effects, arena) {
        if (!boss || !player) return;
        const bnd = arena && arena.dungeonBounds ? arena.dungeonBounds : { minX: -1450, maxX: 1450, minY: -1450, maxY: 1450 };
        const cx = Math.max(bnd.minX + 120, Math.min(bnd.maxX - 120, player.x));
        const cy = Math.max(bnd.minY + 120, Math.min(bnd.maxY - 120, player.y));
        const isCritical = boss.hp <= boss.maxHp * 0.25;
        boss._gridFlip = !boss._gridFlip;
        const baseAngle = boss._gridFlip ? Math.PI * 0.25 : 0;
        const angles = isCritical
            ? [baseAngle, baseAngle + Math.PI / 3, baseAngle + (2 * Math.PI) / 3]
            : [baseAngle, baseAngle + Math.PI * 0.5];

        const warnTimer = boss.isEnraged ? 46 : 56;
        boss.laserGrids.push({
            cx, cy, angles,
            span: 1320,
            halfWidth: 30,
            timer: warnTimer,
            maxTimer: warnTimer,
            damage: Math.round(boss.damage * 1.22)
        });
        if (effects) effects.addComicSplash(boss.x, boss.y - 60, '⚡ LASER CROSS-GRID!');
    }

    static updateLaserGrids(boss, dt, player, effects) {
        const list = boss.laserGrids;
        for (let i = list.length - 1; i >= 0; i--) {
            const g = list[i];
            g.timer -= dt;
            if (g.timer <= 0) {
                let hit = false;
                for (let a = 0; a < g.angles.length; a++) {
                    const ang = g.angles[a];
                    const dx = Math.cos(ang) * (g.span * 0.5);
                    const dy = Math.sin(ang) * (g.span * 0.5);
                    const x1 = g.cx - dx, y1 = g.cy - dy;
                    const x2 = g.cx + dx, y2 = g.cy + dy;

                    if (effects) {
                        for (const k of [-0.36, 0, 0.36]) {
                            const ex = g.cx + Math.cos(ang) * (g.span * k);
                            const ey = g.cy + Math.sin(ang) * (g.span * k);
                            effects.addShockwave(ex, ey, 95, 'rgba(255, 46, 76, 0.92)');
                            if (typeof effects.addGroundCrack === 'function') {
                                effects.addGroundCrack(ex, ey, 68, '#1e272e', '#ff2e4c', 100);
                            }
                            effects.addSparks(ex, ey, '#ffa502', 6);
                        }
                    }
                    if (!hit && player && player.hp > 0) {
                        const d = this._pointToSegmentDist(player.x, player.y, x1, y1, x2, y2);
                        if (d <= g.halfWidth + (player.radius || 25) * 0.72) {
                            hit = true;
                        }
                    }
                }
                if (hit && player && player.hp > 0) {
                    player.takeDamage(g.damage, effects);
                }
                if (effects && typeof effects.onBossSlam === 'function') effects.onBossSlam(0.055);
                list.splice(i, 1);
            }
        }
    }

    static spawnSingularityWell(boss, player, effects, arena) {
        if (!boss || !player) return;
        const count = boss.isEnraged ? 2 : 1;
        const bnd = arena && arena.dungeonBounds ? arena.dungeonBounds : { minX: -1350, maxX: 1350, minY: -1350, maxY: 1350 };
        for (let i = 0; i < count; i++) {
            const ang = Math.random() * Math.PI * 2 + i * Math.PI;
            const dist = 200 + Math.random() * 90;
            const wx = Math.max(bnd.minX + 120, Math.min(bnd.maxX - 120, player.x + Math.cos(ang) * dist));
            const wy = Math.max(bnd.minY + 120, Math.min(bnd.maxY - 120, player.y + Math.sin(ang) * dist));
            boss.gravityWells.push({
                x: wx,
                y: wy,
                phase: 'windup',
                timer: 28,
                maxTimer: 28,
                pullRadius: 195,
                blastRadius: 112,
                damage: Math.round(boss.damage * 1.18)
            });
        }
        if (effects) effects.addComicSplash(boss.x, boss.y - 62, '🌀 MAGNETIC SINGULARITY!');
    }

    static updateGravityWells(boss, dt, player, bullets, effects) {
        const list = boss.gravityWells;
        for (let i = list.length - 1; i >= 0; i--) {
            const w = list[i];
            w.timer -= dt;

            if (w.phase === 'windup') {
                if (w.timer <= 0) {
                    w.phase = 'pull';
                    w.maxTimer = 78;
                    w.timer = 78;
                    if (effects) effects.addShockwave(w.x, w.y, 120, 'rgba(255, 71, 87, 0.85)');
                }
                continue;
            }

            if (player && player.hp > 0 && !player.isDashing && !player.isBladeRushing) {
                const dx = w.x - player.x;
                const dy = w.y - player.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 14 && dist <= w.pullRadius) {
                    const pull = (1.55 + 1.25 * (1 - dist / w.pullRadius)) * dt;
                    player.x += (dx / dist) * pull;
                    player.y += (dy / dist) * pull;
                }
            }

            if (effects && Math.floor(boss.age) % 6 === 0) {
                const pa = Math.random() * Math.PI * 2;
                const pr = w.pullRadius * (0.45 + Math.random() * 0.45);
                effects.addSparks(w.x + Math.cos(pa) * pr, w.y + Math.sin(pa) * pr, '#ff4757', 2);
            }

            if (w.timer <= 0) {
                if (effects) {
                    effects.addShockwave(w.x, w.y, w.blastRadius * 1.5, 'rgba(255, 46, 76, 0.95)');
                    if (typeof effects.addGroundCrack === 'function') {
                        effects.addGroundCrack(w.x, w.y, w.blastRadius, '#1e272e', '#ff2e4c', 120);
                    }
                    effects.addSparks(w.x, w.y, '#fed330', 10);
                    if (typeof effects.onBossSlam === 'function') effects.onBossSlam(0.055);
                }
                if (player && player.hp > 0 && Math.hypot(player.x - w.x, player.y - w.y) <= w.blastRadius + (player.radius || 25) * 0.8) {
                    player.takeDamage(w.damage, effects);
                }
                if (typeof Bullet !== 'undefined') {
                    for (let s = 0; s < 8; s++) {
                        const sa = (s / 8) * Math.PI * 2;
                        bullets.push(new Bullet({
                            x: w.x, y: w.y,
                            vx: Math.cos(sa) * 9.8, vy: Math.sin(sa) * 9.8,
                            damage: Math.round(boss.damage * 0.78),
                            speed: 9.8, radius: 10, type: 'kolossos_orb', isEnemy: true, range: 640
                        }));
                    }
                }
                list.splice(i, 1);
            }
        }
    }

    static fireBoomerangSawFan(boss, bullets, effects) {
        if (typeof Bullet === 'undefined' || !boss) return;
        const offsets = boss.hp <= boss.maxHp * 0.30
            ? [-0.52, -0.26, 0, 0.26, 0.52]
            : [-0.38, 0, 0.38];
        for (const off of offsets) {
            const a = boss.angle + off;
            const b = new Bullet({
                x: boss.x + Math.cos(a) * (boss.radius + 10),
                y: boss.y + Math.sin(a) * (boss.radius + 10),
                vx: Math.cos(a) * 11.8,
                vy: Math.sin(a) * 11.8,
                damage: Math.round(boss.damage * 0.92),
                speed: 11.8,
                radius: 16,
                type: 'kolossos_saw',
                isEnemy: true,
                range: 2600,
                shooter: boss
            });
            b.isBoomerang = true;
            b.boomerangTime = 0;
            b.originX = boss.x;
            b.originY = boss.y;
            bullets.push(b);
        }
        if (effects) effects.addComicSplash(boss.x, boss.y - 54, '⚙️ HYPER SAW-RINGS!');
    }

    static updateSpiralHelix(boss, dt, bullets, effects) {
        if (!boss.helixShotsLeft || boss.helixShotsLeft <= 0 || typeof Bullet === 'undefined') return;
        boss.helixTick = (boss.helixTick || 0) - dt;
        if (boss.helixTick > 0) return;

        boss.helixTick = 2.4;
        boss.helixShotsLeft -= 1;
        boss.helixAngle = (boss.helixAngle || boss.angle) + 0.36;
        for (const arm of [0, Math.PI]) {
            const a = boss.helixAngle + arm;
            bullets.push(new Bullet({
                x: boss.x + Math.cos(a) * (boss.radius + 8),
                y: boss.y + Math.sin(a) * (boss.radius + 8),
                vx: Math.cos(a) * 10.6,
                vy: Math.sin(a) * 10.6,
                damage: Math.round(boss.damage * 0.75),
                speed: 10.6,
                radius: 10,
                type: boss.helixShotsLeft % 2 === 0 ? 'kolossos_orb' : 'kolossos_laser_bolt',
                isEnemy: true,
                range: 900
            }));
        }
        if (effects && boss.helixShotsLeft % 4 === 0) {
            effects.addSparks(boss.x, boss.y, '#ff2e4c', 4);
        }
    }

    static spawnDrones(boss, enemies, effects, count = 2) {
        if (!boss || !Array.isArray(enemies)) return 0;
        const maxActive = 2;
        const maxTotal = 4;
        let active = 0;
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (e && !e.dead && e.type === 'kolossos_drone' && e.ownedByBoss === boss) active++;
        }
        const remainingBudget = Math.max(0, maxTotal - (boss.totalDronesSpawned || 0));
        const toSpawn = Math.min(count, Math.max(0, maxActive - active), remainingBudget);
        for (let i = 0; i < toSpawn; i++) {
            const idx = (boss.totalDronesSpawned || 0);
            const ang = idx * Math.PI;
            const d = new KolossosDrone(
                boss.x + Math.cos(ang) * 150,
                boss.y + Math.sin(ang) * 150,
                boss.waveMultiplier,
                boss,
                idx
            );
            enemies.push(d);
            boss.totalDronesSpawned = idx + 1;
            if (effects) {
                effects.addLightningChain(boss.x, boss.y, d.x, d.y, '#ff2e4c');
                effects.addShockwave(d.x, d.y, 65, 'rgba(255, 46, 76, 0.88)');
            }
        }
        return toSpawn;
    }

    static drawWorldHazards(ctx, boss) {
        const now = boss.age || 0;

        // 1. Seismic Laser Cross-Grid Telegraphs
        for (let i = 0; i < (boss.laserGrids ? boss.laserGrids.length : 0); i++) {
            const g = boss.laserGrids[i];
            const p = Math.max(0, Math.min(1, 1 - g.timer / g.maxTimer));
            ctx.save();
            ctx.translate(g.cx, g.cy);
            for (let a = 0; a < g.angles.length; a++) {
                ctx.save();
                ctx.rotate(g.angles[a]);
                ctx.fillStyle = `rgba(255, 46, 76, ${0.14 + p * 0.24})`;
                ctx.fillRect(-g.span * 0.5, -g.halfWidth, g.span, g.halfWidth * 2);

                // Inner charge beam growing toward edges
                const fillH = g.halfWidth * 2 * p;
                ctx.fillStyle = p > 0.78 ? 'rgba(255, 211, 42, 0.55)' : 'rgba(255, 71, 87, 0.42)';
                ctx.fillRect(-g.span * 0.5, -fillH * 0.5, g.span, fillH);

                ctx.strokeStyle = p > 0.80 ? '#ffffff' : '#ff2e4c';
                ctx.lineWidth = 2.6;
                ctx.strokeRect(-g.span * 0.5, -g.halfWidth, g.span, g.halfWidth * 2);
                ctx.restore();
            }
            ctx.fillStyle = p > 0.78 ? '#ffffff' : '#fed330';
            ctx.beginPath();
            ctx.arc(0, 0, 10 + p * 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // 2. Magnetic Singularity Gravity Wells
        for (let i = 0; i < (boss.gravityWells ? boss.gravityWells.length : 0); i++) {
            const w = boss.gravityWells[i];
            const p = Math.max(0, Math.min(1, 1 - w.timer / w.maxTimer));
            ctx.save();
            ctx.translate(w.x, w.y);

            if (w.phase === 'windup') {
                ctx.fillStyle = `rgba(180, 20, 48, ${0.16 + p * 0.22})`;
                ctx.beginPath();
                ctx.arc(0, 0, w.blastRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ff2e4c';
                ctx.lineWidth = 3;
                ctx.setLineDash([8, 6]);
                ctx.beginPath();
                ctx.arc(0, 0, w.pullRadius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            } else {
                const grad = ctx.createRadialGradient(0, 0, 8, 0, 0, w.pullRadius);
                grad.addColorStop(0, 'rgba(18, 4, 10, 0.88)');
                grad.addColorStop(0.55, 'rgba(255, 46, 76, 0.26)');
                grad.addColorStop(1, 'rgba(255, 46, 76, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(0, 0, w.pullRadius, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#ff4757';
                ctx.lineWidth = 2.6;
                ctx.beginPath();
                ctx.arc(0, 0, w.blastRadius, 0, Math.PI * 2);
                ctx.stroke();

                ctx.save();
                ctx.rotate(-now * 0.08);
                ctx.strokeStyle = p > 0.75 ? '#ffffff' : '#ffa502';
                ctx.lineWidth = 3;
                for (let k = 0; k < 3; k++) {
                    const sa = (k / 3) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.arc(0, 0, w.blastRadius * (1 - p * 0.55), sa, sa + 1.25);
                    ctx.stroke();
                }
                ctx.restore();

                ctx.fillStyle = '#141418';
                ctx.strokeStyle = '#ff2e4c';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, 18 + Math.sin(now * 0.35) * 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    static drawOmegaBeam(ctx, boss) {
        const b = boss.omegaBeam;
        if (!b) return;
        ctx.save();
        ctx.translate(boss.x, boss.y);

        if (b.phase === 'windup') {
            const p = Math.max(0, Math.min(1, 1 - b.timer / b.maxTimer));
            const sA = Math.min(b.startAngle, b.endAngle);
            const eA = Math.max(b.startAngle, b.endAngle);

            // Sweeping danger cone sector preview
            ctx.fillStyle = `rgba(255, 46, 76, ${0.10 + p * 0.16})`;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, b.length, sA, eA);
            ctx.closePath();
            ctx.fill();

            // Aimed laser sightline at startAngle
            ctx.save();
            ctx.rotate(b.startAngle);
            ctx.strokeStyle = p > 0.72 ? '#ffffff' : '#ff2e4c';
            ctx.lineWidth = 3 + p * 4;
            ctx.setLineDash([16, 10]);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(b.length, 0);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        } else {
            ctx.rotate(b.currentAngle);
            const pulse = 1 + Math.sin((boss.age || 0) * 0.7) * 0.12;
            ctx.lineCap = 'round';

            ctx.strokeStyle = 'rgba(255, 46, 76, 0.38)';
            ctx.lineWidth = 44 * pulse;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(b.length, 0); ctx.stroke();

            ctx.strokeStyle = '#ff2e4c';
            ctx.lineWidth = 24 * pulse;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(b.length, 0); ctx.stroke();

            ctx.strokeStyle = '#ffa502';
            ctx.lineWidth = 12 * pulse;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(b.length, 0); ctx.stroke();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 5;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(b.length, 0); ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, 22 * pulse, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.KolossosAttackSystem = KolossosAttackSystem;
}
