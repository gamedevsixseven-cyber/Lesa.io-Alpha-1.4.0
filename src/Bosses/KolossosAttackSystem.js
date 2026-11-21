/**
 * Lesa.io - Kolossos MK-IV Unique Attacks & Randomized Action Pacing System
 * Coordinates weighted random ability selection with breathing windows between attacks,
 * Omega Beam, Singularity Wells, Laser Cross-Grids, Saw-Rings, Spiral Helix, and
 * the Phase-3 (<= 25% HP) Solar Reactor Nova ultimate.
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

    /**
     * Rhythmic weighted-random attack chooser ensuring clear recovery breathers
     * and anti-repeat variety instead of chaining stacked cooldowns back-to-back.
     */
    static updateBossActions(boss, dt, player, bullets, effects, arena) {
        if (!boss || !player || boss.omegaBeam || boss.solarNova || boss.jumpAttack) return;
        if (boss.actionCooldown > 0) return;

        const isCrit = !!boss.criticalTriggered;
        const isEnr = !!boss.isEnraged;
        const last = boss._lastAttack || '';

        const pool = [];
        const addOpt = (id, weight) => {
            if (weight <= 0) return;
            pool.push({ id, w: id === last ? weight * 0.25 : weight });
        };

        if (isCrit && boss.novaCooldown <= 0) addOpt('solar_nova', 5);
        if (boss.jumpCooldown <= 0 && typeof KolossosJumpAttack !== 'undefined') addOpt('jump_slam', 4);
        if (boss.beamCooldown <= 0) addOpt('omega_beam', 3);
        if (boss.gridCooldown <= 0) addOpt('laser_grid', 3);
        if (boss.wellCooldown <= 0) addOpt('gravity_well', 3);
        if (boss.orbitalCooldown <= 0) addOpt('orbital_nuke', 3);
        if (boss.sawCooldown <= 0) addOpt('saw_fan', 3);
        if (boss.sweepCooldown <= 0) addOpt('plasma_sweep', 4);

        if (pool.length === 0) return;
        const totalW = pool.reduce((s, o) => s + o.w, 0);
        let roll = Math.random() * totalW;
        let chosen = pool[pool.length - 1].id;
        for (let i = 0; i < pool.length; i++) {
            roll -= pool[i].w;
            if (roll <= 0) {
                chosen = pool[i].id;
                break;
            }
        }
        boss._lastAttack = chosen;

        // Breathing delay factor scales smoothly without turning into spam
        const randRange = (min, max) => min + Math.random() * (max - min);
        if (chosen === 'solar_nova') {
            boss.novaCooldown = 420;
            this.startSolarNova(boss, effects);
            boss.actionCooldown = 140;
        } else if (chosen === 'jump_slam') {
            boss.jumpCooldown = isCrit ? 220 : (isEnr ? 260 : 310);
            KolossosJumpAttack.startJumpAttack(boss, player, effects, arena);
            boss.actionCooldown = isCrit ? randRange(78, 102) : (isEnr ? randRange(88, 114) : randRange(98, 126));
        } else if (chosen === 'omega_beam') {
            boss.beamCooldown = isCrit ? 320 : (isEnr ? 360 : 410);
            this.startOmegaBeam(boss, player, effects);
            boss.actionCooldown = isCrit ? randRange(82, 108) : (isEnr ? randRange(95, 124) : randRange(110, 140));
        } else if (chosen === 'laser_grid') {
            boss.gridCooldown = isCrit ? 225 : (isEnr ? 260 : 300);
            this.spawnLaserCrossGrid(boss, player, effects, arena);
            boss.actionCooldown = isCrit ? randRange(75, 100) : (isEnr ? randRange(88, 114) : randRange(102, 130));
        } else if (chosen === 'gravity_well') {
            boss.wellCooldown = isCrit ? 255 : (isEnr ? 290 : 335);
            this.spawnSingularityWell(boss, player, effects, arena);
            boss.actionCooldown = isCrit ? randRange(78, 104) : (isEnr ? randRange(92, 118) : randRange(106, 135));
        } else if (chosen === 'orbital_nuke') {
            boss.orbitalCooldown = isCrit ? 210 : (isEnr ? 245 : 290);
            this.spawnOrbitalBombardment(boss, player, effects);
            boss.actionCooldown = isCrit ? randRange(76, 102) : (isEnr ? randRange(88, 116) : randRange(104, 132));
        } else if (chosen === 'saw_fan') {
            boss.sawCooldown = isCrit ? 165 : (isEnr ? 190 : 225);
            this.fireBoomerangSawFan(boss, bullets, effects);
            boss.actionCooldown = isCrit ? randRange(66, 88) : (isEnr ? randRange(76, 98) : randRange(90, 116));
        } else {
            boss.sweepCooldown = isCrit ? 82 : (isEnr ? 95 : 112);
            const twin = isEnr ? [-0.32, -0.14, 0, 0.14, 0.32] : [-0.24, -0.07, 0.07, 0.24];
            boss.fireFan(bullets, boss.angle, twin, 11.8, Math.round(boss.damage * 0.78), 11, 'kolossos_plasma');
            if (effects) effects.addSparks(boss.x, boss.y, '#ff6348', 6);
            boss.actionCooldown = isCrit ? randRange(58, 76) : (isEnr ? randRange(68, 88) : randRange(78, 100));
        }
    }

    static spawnOrbitalBombardment(boss, player, effects) {
        if (!boss || !player) return;
        const ringCount = boss.isEnraged ? 5 : 4;
        for (let i = 0; i < ringCount; i++) {
            const a = (i / ringCount) * Math.PI * 2 + Math.random() * 0.4;
            const r = i === 0 ? 14 : (78 + Math.random() * 145);
            boss.addTelegraph(
                player.x + Math.cos(a) * r,
                player.y + Math.sin(a) * r,
                78, 60, Math.round(boss.damage * 1.08), '☢️', 'rgba(255, 46, 76, 0.95)', 'orbital_nuke', '#ff4757'
            );
        }
        if (effects) {
            effects.addComicSplash(boss.x, boss.y - 56, '🎯 ORBITAL STRIKE!');
            effects.addSparks(boss.x, boss.y, '#ff9f43', 8);
        }
    }

    /**
     * Phase-3 Unique Attack (<= 25% HP): Solar Reactor Nova
     * Plants core for 1.3s warning with 8 radial solar lance lanes & inner dome,
     * detonates massively, then enters a 2.2s Reactor Vent opening.
     */
    static startSolarNova(boss, effects) {
        if (!boss || boss.solarNova) return;
        const seed = Math.random() * (Math.PI / 4);
        const rayAngles = [];
        for (let k = 0; k < 8; k++) {
            rayAngles.push(seed + (k * Math.PI * 2) / 8);
        }
        boss.solarNova = {
            phase: 'windup',
            x: boss.x,
            y: boss.y,
            timer: 78,
            maxTimer: 78,
            innerRadius: 215,
            rayLength: 780,
            rayHalfWidth: 23,
            rayAngles,
            damage: Math.round(boss.damage * 1.42)
        };
        if (effects) {
            effects.addComicSplash(boss.x, boss.y - 72, '☢️ SOLAR REACTOR NOVA!');
            effects.addShockwave(boss.x, boss.y, 130, 'rgba(255, 165, 2, 0.85)');
            effects.addSparks(boss.x, boss.y, '#fed330', 12);
        }
    }

    static updateSolarNova(boss, dt, player, bullets, effects) {
        const sn = boss.solarNova;
        if (!sn) return;
        sn.timer -= dt;

        if (sn.phase === 'windup') {
            sn.x = boss.x;
            sn.y = boss.y;
            if (effects && Math.floor(boss.age) % 5 === 0) {
                const a = Math.random() * Math.PI * 2;
                effects.addSparks(sn.x + Math.cos(a) * 140, sn.y + Math.sin(a) * 140, '#ff2e4c', 3);
            }
            if (sn.timer <= 0) {
                sn.phase = 'flash';
                sn.maxTimer = 26;
                sn.timer = 26;
                boss.solarVentTimer = 78;
                boss.actionCooldown = Math.max(boss.actionCooldown || 0, 132);

                if (effects) {
                    effects.addShockwave(sn.x, sn.y, 320, 'rgba(255, 46, 76, 0.96)');
                    effects.addShockwave(sn.x, sn.y, 220, 'rgba(254, 211, 48, 0.94)');
                    if (typeof effects.addGroundCrack === 'function') {
                        effects.addGroundCrack(sn.x, sn.y, sn.innerRadius * 0.85, '#1e272e', '#ff2e4c', 160);
                    }
                    effects.addSparks(sn.x, sn.y, '#ffa502', 14);
                    if (typeof effects.triggerScreenFlash === 'function') effects.triggerScreenFlash('#ff4757', 0.36, 20);
                    if (typeof effects.onBossSlam === 'function') effects.onBossSlam(0.08);
                }

                // Launch 8 Starlight Reactor Bolts outward along the 8 solar lanes
                if (typeof Bullet !== 'undefined' && Array.isArray(bullets)) {
                    for (let i = 0; i < sn.rayAngles.length; i++) {
                        const ang = sn.rayAngles[i];
                        bullets.push(new Bullet({
                            x: sn.x + Math.cos(ang) * 40,
                            y: sn.y + Math.sin(ang) * 40,
                            vx: Math.cos(ang) * 11.4,
                            vy: Math.sin(ang) * 11.4,
                            damage: Math.round(boss.damage * 0.92),
                            speed: 11.4,
                            radius: 11,
                            type: i % 2 === 0 ? 'kolossos_laser_bolt' : 'kolossos_orb',
                            isEnemy: true,
                            range: 820
                        }));
                    }
                }

                // Damage check on detonation frame
                if (player && player.hp > 0) {
                    const pr = (player.radius || 25) * 0.72;
                    let hit = Math.hypot(player.x - sn.x, player.y - sn.y) <= sn.innerRadius + pr;
                    if (!hit) {
                        for (let i = 0; i < sn.rayAngles.length; i++) {
                            const ang = sn.rayAngles[i];
                            const ex = sn.x + Math.cos(ang) * sn.rayLength;
                            const ey = sn.y + Math.sin(ang) * sn.rayLength;
                            if (this._pointToSegmentDist(player.x, player.y, sn.x, sn.y, ex, ey) <= sn.rayHalfWidth + pr) {
                                hit = true;
                                break;
                            }
                        }
                    }
                    if (hit) player.takeDamage(sn.damage, effects);
                }
            }
            return;
        }

        if (sn.timer <= 0) {
            boss.solarNova = null;
        }
    }

    static startOmegaBeam(boss, player, effects) {
        if (!boss || !player || boss.omegaBeam) return;
        const base = Math.atan2(player.y - boss.y, player.x - boss.x);
        const dir = Math.random() < 0.5 ? 1 : -1;
        const halfSweep = 1.15;
        boss.omegaBeam = {
            phase: 'windup',
            timer: boss.isEnraged ? 46 : 54,
            maxTimer: boss.isEnraged ? 46 : 54,
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

        if (b.timer <= 0) boss.omegaBeam = null;
    }

    static spawnLaserCrossGrid(boss, player, effects, arena) {
        if (!boss || !player) return;
        const bnd = arena && arena.dungeonBounds ? arena.dungeonBounds : { minX: -1450, maxX: 1450, minY: -1450, maxY: 1450 };
        const cx = Math.max(bnd.minX + 120, Math.min(bnd.maxX - 120, player.x));
        const cy = Math.max(bnd.minY + 120, Math.min(bnd.maxY - 120, player.y));
        const isCritical = boss.hp <= boss.maxHp * 0.25;
        boss._gridFlip = !boss._gridFlip;
        const baseAngle = (boss._gridFlip ? Math.PI * 0.25 : 0) + (Math.random() - 0.5) * 0.3;
        const angles = isCritical
            ? [baseAngle, baseAngle + Math.PI / 3, baseAngle + (2 * Math.PI) / 3]
            : [baseAngle, baseAngle + Math.PI * 0.5];

        const warnTimer = boss.isEnraged ? 54 : 64;
        boss.laserGrids.push({
            cx, cy, angles,
            span: 1320,
            halfWidth: 30,
            timer: warnTimer,
            maxTimer: warnTimer,
            damage: Math.round(boss.damage * 1.18)
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
                        const d = this._pointToSegmentDist(player.x, player.y, g.cx - dx, g.cy - dy, g.cx + dx, g.cy + dy);
                        if (d <= g.halfWidth + (player.radius || 25) * 0.72) hit = true;
                    }
                }
                if (boss.laserFlashes) {
                    boss.laserFlashes.push({ cx: g.cx, cy: g.cy, angles: g.angles, span: g.span, halfWidth: g.halfWidth, timer: 16, maxTimer: 16 });
                }
                if (hit && player && player.hp > 0) player.takeDamage(g.damage, effects);
                if (effects && typeof effects.onBossSlam === 'function') effects.onBossSlam(0.055);
                list.splice(i, 1);
            }
        }
        const flashes = boss.laserFlashes;
        if (flashes) {
            for (let i = flashes.length - 1; i >= 0; i--) {
                flashes[i].timer -= dt;
                if (flashes[i].timer <= 0) flashes.splice(i, 1);
            }
        }
    }

    static spawnSingularityWell(boss, player, effects, arena) {
        if (!boss || !player) return;
        const count = boss.isEnraged ? 2 : 1;
        const bnd = arena && arena.dungeonBounds ? arena.dungeonBounds : { minX: -1350, maxX: 1350, minY: -1350, maxY: 1350 };
        for (let i = 0; i < count; i++) {
            const ang = Math.random() * Math.PI * 2 + i * Math.PI;
            const dist = 205 + Math.random() * 90;
            const wx = Math.max(bnd.minX + 120, Math.min(bnd.maxX - 120, player.x + Math.cos(ang) * dist));
            const wy = Math.max(bnd.minY + 120, Math.min(bnd.maxY - 120, player.y + Math.sin(ang) * dist));
            boss.gravityWells.push({
                x: wx, y: wy, phase: 'windup',
                timer: 34, maxTimer: 34, pullRadius: 195, blastRadius: 112,
                damage: Math.round(boss.damage * 1.15)
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
                const dx = w.x - player.x, dy = w.y - player.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 14 && dist <= w.pullRadius) {
                    const pull = (1.50 + 1.15 * (1 - dist / w.pullRadius)) * dt;
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
                    if (typeof effects.addGroundCrack === 'function') effects.addGroundCrack(w.x, w.y, w.blastRadius, '#1e272e', '#ff2e4c', 120);
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
                            x: w.x, y: w.y, vx: Math.cos(sa) * 9.8, vy: Math.sin(sa) * 9.8,
                            damage: Math.round(boss.damage * 0.78), speed: 9.8, radius: 10, type: 'kolossos_orb', isEnemy: true, range: 640
                        }));
                    }
                }
                list.splice(i, 1);
            }
        }
    }

    static fireBoomerangSawFan(boss, bullets, effects) {
        if (typeof Bullet === 'undefined' || !boss) return;
        const offsets = boss.hp <= boss.maxHp * 0.30 ? [-0.52, -0.26, 0, 0.26, 0.52] : [-0.38, 0, 0.38];
        for (const off of offsets) {
            const a = boss.angle + off;
            const b = new Bullet({
                x: boss.x + Math.cos(a) * (boss.radius + 10),
                y: boss.y + Math.sin(a) * (boss.radius + 10),
                vx: Math.cos(a) * 11.5, vy: Math.sin(a) * 11.5,
                damage: Math.round(boss.damage * 0.90), speed: 11.5, radius: 16,
                type: 'kolossos_saw', isEnemy: true, range: 2600, shooter: boss
            });
            b.isBoomerang = true; b.boomerangTime = 0; b.originX = boss.x; b.originY = boss.y;
            bullets.push(b);
        }
        if (effects) effects.addComicSplash(boss.x, boss.y - 54, '⚙️ HYPER SAW-RINGS!');
    }

    static updateSpiralHelix(boss, dt, bullets, effects) {
        if (!boss.helixShotsLeft || boss.helixShotsLeft <= 0 || typeof Bullet === 'undefined') return;
        boss.helixTick = (boss.helixTick || 0) - dt;
        if (boss.helixTick > 0) return;

        boss.helixTick = 2.6;
        boss.helixShotsLeft -= 1;
        boss.helixAngle = (boss.helixAngle || boss.angle) + 0.36;
        for (const arm of [0, Math.PI]) {
            const a = boss.helixAngle + arm;
            bullets.push(new Bullet({
                x: boss.x + Math.cos(a) * (boss.radius + 8),
                y: boss.y + Math.sin(a) * (boss.radius + 8),
                vx: Math.cos(a) * 10.4, vy: Math.sin(a) * 10.4,
                damage: Math.round(boss.damage * 0.72), speed: 10.4, radius: 10,
                type: boss.helixShotsLeft % 2 === 0 ? 'kolossos_orb' : 'kolossos_laser_bolt', isEnemy: true, range: 900
            }));
        }
        if (effects && boss.helixShotsLeft % 4 === 0) effects.addSparks(boss.x, boss.y, '#ff2e4c', 4);
    }

    static spawnDrones(boss, enemies, effects, count = 2) {
        if (!boss || !Array.isArray(enemies)) return 0;
        let active = 0;
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (e && !e.dead && e.type === 'kolossos_drone' && e.ownedByBoss === boss) active++;
        }
        const remainingBudget = Math.max(0, 4 - (boss.totalDronesSpawned || 0));
        const toSpawn = Math.min(count, Math.max(0, 2 - active), remainingBudget);
        for (let i = 0; i < toSpawn; i++) {
            const idx = (boss.totalDronesSpawned || 0);
            const ang = idx * Math.PI;
            const d = new KolossosDrone(boss.x + Math.cos(ang) * 150, boss.y + Math.sin(ang) * 150, boss.waveMultiplier, boss, idx);
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
        if (typeof KolossosHazardVFX !== 'undefined') KolossosHazardVFX.drawWorldHazards(ctx, boss);
    }

    static drawOmegaBeam(ctx, boss) {
        if (typeof KolossosHazardVFX !== 'undefined') KolossosHazardVFX.drawOmegaBeam(ctx, boss);
    }
}

if (typeof window !== 'undefined') {
    window.KolossosAttackSystem = KolossosAttackSystem;
}
