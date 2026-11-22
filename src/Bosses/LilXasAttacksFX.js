/**
 * Lesa.io - Lil Xas Special Concert Attacks & High-Quality Neon VFX Engine
 * Coordinates:
 *   1. Speaker Synth Tethers (visible oscillating power waveforms linking live speakers -> Boss Shield)
 *   2. Spotlight Laser Sweep (telegraphed sightline -> sweeping cyan/magenta concert beam)
 *   3. Subwoofer Gravity Vortex Wells (spinning vinyl rings that tug the player before bass detonation)
 *   4. Freestyle Overdrive Double-Helix Spiral (alternating neon notes + gold platinum vinyl discs)
 *   5. Paparazzi Strobe Flash & VIP Diamond Mic Leap Slam (aerial lift + 3-ring shockwave + X-cross waves)
 */

class LilXasAttacksFX {
    static initBossState(boss) {
        boss.laserBeam = null;
        boss.vortexWells = [];
        boss.novaRings = [];
        boss.leapSlam = null;
        boss.liftY = 0;
        boss.spiralShotsLeft = 0;
        boss.spiralTick = 0;
        boss.spiralAngle = 0;
        boss.specialCycle = 0;
        boss.specialCooldown = 85;
    }

    static startSpotlightLaser(boss, player, effects) {
        const aim = Math.atan2(player.y - boss.y, player.x - boss.x);
        const dir = Math.random() < 0.5 ? 1 : -1;
        boss.laserBeam = {
            state: 'telegraph',
            timer: 48,
            maxTimer: 48,
            angle: aim - dir * 0.52,
            sweepDir: dir,
            sweepSpeed: (boss.enraged ? 0.024 : 0.019),
            length: 980,
            width: boss.enraged ? 42 : 34,
            hitTick: 0
        };
        if (effects) effects.addComicSplash(boss.x, boss.y - 62, '🔦 SPOTLIGHT LASER!! ⚡', '#00f5ff');
    }

    static startBassVortex(boss, player, effects) {
        const count = boss.enraged ? 3 : 2;
        for (let i = 0; i < count; i++) {
            const ang = (i / count) * Math.PI * 2 + Math.random() * 0.6;
            const dist = i === 0 ? 55 : (165 + Math.random() * 85);
            boss.vortexWells.push({
                x: player.x + (i === 0 ? 0 : Math.cos(ang) * dist),
                y: player.y + (i === 0 ? 0 : Math.sin(ang) * dist),
                radius: 130,
                timer: 132,
                maxTimer: 132,
                damage: Math.round(boss.damage * 1.15)
            });
        }
        if (effects) effects.addComicSplash(boss.x, boss.y - 62, '🌀 TURN UP THE SUBS!! 🔊', '#e056fd');
    }

    static startPaparazziNova(boss, effects) {
        if (effects && typeof effects.triggerScreenFlash === 'function') {
            effects.triggerScreenFlash('#ffffff', 0.28, 12);
        }
        boss.novaRings.push({
            x: boss.x,
            y: boss.y,
            timer: 42,
            maxTimer: 42,
            radius: 260,
            burstCount: boss.enraged ? 16 : 12
        });
        if (effects) effects.addComicSplash(boss.x, boss.y - 64, '📸 PAPARAZZI FLASH!! 💥', '#facc15');
    }

    static startMicLeapSlam(boss, player, effects) {
        boss.leapSlam = {
            state: 'rise',
            timer: 34,
            targetX: player.x,
            targetY: player.y,
            startX: boss.x,
            startY: boss.y
        };
        boss.isAirborneImmune = true;
        if (effects) effects.addComicSplash(boss.x, boss.y - 66, '🎤 VIP MIC DROP!! 🔥', '#ff4757');
    }

    static update(boss, dt, player, bullets, effects, arena) {
        // 1. Update Spotlight Sweep Laser
        if (boss.laserBeam) {
            const lb = boss.laserBeam;
            if (lb.state === 'telegraph') {
                lb.timer -= dt;
                if (lb.timer <= 0) {
                    lb.state = 'fire';
                    lb.timer = 54;
                    lb.maxTimer = 54;
                    const cam = (typeof window !== 'undefined' && window.gameInstance) ? window.gameInstance.camera : null;
                    if (cam) cam.addShake(11);
                }
            } else {
                lb.timer -= dt;
                lb.angle += lb.sweepDir * lb.sweepSpeed * dt;
                lb.hitTick -= dt;
                if (lb.hitTick <= 0 && player && player.hp > 0) {
                    const hit = this._pointHitsSegment(
                        player.x, player.y, player.radius + lb.width * 0.44,
                        boss.x, boss.y,
                        boss.x + Math.cos(lb.angle) * lb.length,
                        boss.y + Math.sin(lb.angle) * lb.length
                    );
                    if (hit) {
                        lb.hitTick = 12;
                        const cam = (typeof window !== 'undefined' && window.gameInstance) ? window.gameInstance.camera : null;
                        player.takeDamage(Math.max(14, Math.round(boss.damage * 0.65)), effects, cam);
                    }
                }
                if (effects && Math.random() < 0.45 * dt) {
                    const d = 120 + Math.random() * (lb.length * 0.65);
                    effects.addSparks(boss.x + Math.cos(lb.angle) * d, boss.y + Math.sin(lb.angle) * d, '#00f5ff', 2);
                }
                if (lb.timer <= 0) boss.laserBeam = null;
            }
        }

        // 2. Update Subwoofer Gravity Vortex Wells
        for (let i = boss.vortexWells.length - 1; i >= 0; i--) {
            const w = boss.vortexWells[i];
            w.timer -= dt;
            if (player && player.hp > 0 && !player.isDashing) {
                const dx = w.x - player.x;
                const dy = w.y - player.y;
                const dist = Math.hypot(dx, dy) || 1;
                if (dist < w.radius * 1.45 && dist > 12) {
                    const pull = 1.65 * dt * (1 - dist / (w.radius * 1.65));
                    player.x += (dx / dist) * pull;
                    player.y += (dy / dist) * pull;
                }
            }
            if (w.timer <= 0) {
                if (effects) {
                    effects.addShockwave(w.x, w.y, w.radius * 1.15, 'rgba(224, 86, 253, 0.94)');
                    effects.addSparks(w.x, w.y, '#00f5ff', 10);
                }
                if (player && player.hp > 0 && Math.hypot(player.x - w.x, player.y - w.y) <= w.radius + player.radius * 0.4) {
                    const cam = (typeof window !== 'undefined' && window.gameInstance) ? window.gameInstance.camera : null;
                    player.takeDamage(w.damage, effects, cam);
                }
                boss.vortexWells.splice(i, 1);
            }
        }

        // 3. Update Paparazzi Nova Rings -> Explode into Gold Vinyl Discs + Music Notes
        for (let i = boss.novaRings.length - 1; i >= 0; i--) {
            const nr = boss.novaRings[i];
            nr.timer -= dt;
            if (nr.timer <= 0) {
                if (effects) {
                    effects.addShockwave(boss.x, boss.y, nr.radius, 'rgba(250, 204, 21, 0.95)');
                    effects.addSparks(boss.x, boss.y, '#facc15', 14);
                }
                if (typeof Bullet !== 'undefined') {
                    for (let k = 0; k < nr.burstCount; k++) {
                        const a = (k / nr.burstCount) * Math.PI * 2;
                        const spd = boss.enraged ? 8.5 : 7.0;
                        bullets.push(new Bullet({
                            x: boss.x + Math.cos(a) * 26, y: boss.y + Math.sin(a) * 26,
                            vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
                            damage: Math.max(14, Math.round(boss.damage * 0.72)),
                            speed: spd, radius: k % 2 === 0 ? 13 : 11,
                            type: k % 2 === 0 ? 'lil_xas_vinyl' : 'lil_xas_note',
                            isEnemy: true, shooter: boss, color: k % 2 === 0 ? '#facc15' : '#e056fd', range: 980
                        }));
                    }
                }
                boss.novaRings.splice(i, 1);
            }
        }

        // 4. Update Freestyle Overdrive Double-Helix Spiral
        if (boss.spiralShotsLeft > 0) {
            boss.spiralTick -= dt;
            if (boss.spiralTick <= 0 && typeof Bullet !== 'undefined') {
                boss.spiralTick = boss.enraged ? 4.2 : 5.5;
                boss.spiralShotsLeft--;
                boss.spiralAngle += 0.38;
                for (let arm = 0; arm < 2; arm++) {
                    const a = boss.spiralAngle + arm * Math.PI;
                    const spd = boss.enraged ? 8.8 : 7.4;
                    bullets.push(new Bullet({
                        x: boss.x + Math.cos(a) * 26, y: boss.y + Math.sin(a) * 26,
                        vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
                        damage: Math.max(14, Math.round(boss.damage * 0.75)),
                        speed: spd, radius: 11,
                        type: arm === 0 ? 'lil_xas_note' : 'lil_xas_vinyl',
                        isEnemy: true, shooter: boss, color: arm === 0 ? '#00f5ff' : '#facc15', range: 940
                    }));
                }
            }
        }

        // 5. Update Aerial VIP Mic Drop Leap Slam
        if (boss.leapSlam) {
            const ls = boss.leapSlam;
            ls.timer -= dt;
            if (ls.state === 'rise') {
                const p = 1 - Math.max(0, ls.timer / 34);
                boss.liftY = Math.sin(p * Math.PI * 0.5) * 145;
                boss.x = ls.startX + (ls.targetX - ls.startX) * p * 0.45;
                boss.y = ls.startY + (ls.targetY - ls.startY) * p * 0.45;
                if (ls.timer <= 0) {
                    ls.state = 'slam';
                    ls.timer = 18;
                    ls.startX = boss.x; ls.startY = boss.y;
                }
            } else {
                const p = 1 - Math.max(0, ls.timer / 18);
                boss.liftY = (1 - p) * 145;
                boss.x = ls.startX + (ls.targetX - ls.startX) * p;
                boss.y = ls.startY + (ls.targetY - ls.startY) * p;
                if (ls.timer <= 0) {
                    boss.liftY = 0;
                    boss.isAirborneImmune = false;
                    boss.applyArenaBounds(arena);
                    this._detonateMicSlam(boss, player, bullets, effects);
                    boss.leapSlam = null;
                }
            }
        }
    }

    static _detonateMicSlam(boss, player, bullets, effects) {
        const cam = (typeof window !== 'undefined' && window.gameInstance) ? window.gameInstance.camera : null;
        if (cam) cam.addShake(18);
        if (effects) {
            effects.addShockwave(boss.x, boss.y, 195, 'rgba(255, 71, 87, 0.96)');
            effects.addShockwave(boss.x, boss.y, 130, 'rgba(250, 204, 21, 0.95)');
            effects.addSparks(boss.x, boss.y, '#facc15', 18);
            if (typeof effects.addGroundCrack === 'function') effects.addGroundCrack(boss.x, boss.y, 115, '#1e272e', '#facc15', 140);
            if (typeof effects.onBossSlam === 'function') effects.onBossSlam(0.08);
        }
        if (player && player.hp > 0 && Math.hypot(player.x - boss.x, player.y - boss.y) <= 185) {
            player.takeDamage(Math.round(boss.damage * 1.45), effects, cam);
        }
        if (typeof Bullet !== 'undefined') {
            for (let k = 0; k < 8; k++) {
                const a = (k / 8) * Math.PI * 2;
                const spd = 8.4;
                bullets.push(new Bullet({
                    x: boss.x, y: boss.y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
                    damage: Math.max(15, Math.round(boss.damage * 0.8)), speed: spd, radius: 13,
                    type: 'lil_xas_vinyl', isEnemy: true, shooter: boss, color: '#facc15', range: 960
                }));
            }
        }
    }

    static _pointHitsSegment(px, py, radius, x1, y1, x2, y2) {
        const vx = x2 - x1; const vy = y2 - y1;
        const lenSq = vx * vx + vy * vy || 1;
        const t = Math.max(0, Math.min(1, ((px - x1) * vx + (py - y1) * vy) / lenSq));
        return Math.hypot(px - (x1 + vx * t), py - (y1 + vy * t)) <= radius;
    }

    static drawSpeakerTether(ctx, speaker, boss) {
        if (!speaker || speaker.dead || !boss || boss.dead || boss.inCutscene) return;
        const pulse = 0.5 + 0.5 * Math.sin((speaker.age || 0) * 0.25 + (speaker.speakerIndex || 0));
        ctx.save();
        ctx.strokeStyle = `rgba(224, 86, 253, ${0.42 + pulse * 0.35})`;
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        const midX = (speaker.x + boss.x) * 0.5 + Math.sin((speaker.age || 0) * 0.2 + speaker.speakerIndex) * 18;
        const midY = (speaker.y - 18 + (boss.y - (boss.liftY || 0) - 8)) * 0.5;
        ctx.moveTo(speaker.x, speaker.y - 18);
        ctx.quadraticCurveTo(midX, midY, boss.x, boss.y - (boss.liftY || 0) - 8);
        ctx.stroke();

        ctx.strokeStyle = `rgba(56, 189, 248, ${0.65 + pulse * 0.3})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.restore();
    }

    static drawBossEffects(ctx, boss) {
        const age = boss.age || 0;
        // 1. Draw Subwoofer Gravity Vortex Wells
        if (Array.isArray(boss.vortexWells)) {
            for (const w of boss.vortexWells) {
                const prog = 1 - Math.max(0, w.timer / w.maxTimer);
                ctx.save();
                ctx.translate(w.x, w.y);
                ctx.rotate(age * 0.08);
                ctx.fillStyle = `rgba(139, 92, 246, ${0.14 + prog * 0.16})`;
                ctx.strokeStyle = prog > 0.72 ? '#ff4757' : '#e056fd';
                ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(0, 0, w.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                for (let g = 0.35; g <= 0.85; g += 0.25) {
                    ctx.beginPath();
                    ctx.arc(0, 0, w.radius * g, age * 0.04, age * 0.04 + Math.PI * 1.4);
                    ctx.strokeStyle = '#00f5ff'; ctx.lineWidth = 2; ctx.stroke();
                }
                ctx.fillStyle = '#09090b'; ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }
        }

        // 2. Draw Paparazzi Charge Rings
        if (Array.isArray(boss.novaRings)) {
            for (const nr of boss.novaRings) {
                const p = 1 - Math.max(0, nr.timer / nr.maxTimer);
                ctx.save();
                ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
                ctx.lineWidth = 4;
                ctx.setLineDash([12, 10]);
                ctx.beginPath(); ctx.arc(boss.x, boss.y, nr.radius * (1 - p * 0.7), 0, Math.PI * 2); ctx.stroke();
                ctx.restore();
            }
        }

        // 3. Draw Leap Slam Shadow & Target Ring
        if (boss.leapSlam) {
            const ls = boss.leapSlam;
            ctx.save();
            ctx.strokeStyle = '#ff4757';
            ctx.fillStyle = 'rgba(255, 71, 87, 0.22)';
            ctx.lineWidth = 3.5;
            ctx.beginPath(); ctx.arc(ls.targetX, ls.targetY, 170, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.font = '900 14px "Luckiest Guy", sans-serif';
            ctx.fillStyle = '#facc15'; ctx.textAlign = 'center';
            ctx.fillText('🎤 INCOMING MIC DROP!!', ls.targetX, ls.targetY);
            ctx.restore();
        }

        // 4. Draw Sweeping Spotlight Laser
        if (boss.laserBeam) {
            const lb = boss.laserBeam;
            ctx.save();
            ctx.translate(boss.x, boss.y - (boss.liftY || 0) - 8);
            ctx.rotate(lb.angle);
            if (lb.state === 'telegraph') {
                const p = 1 - Math.max(0, lb.timer / lb.maxTimer);
                ctx.strokeStyle = `rgba(0, 245, 255, ${0.35 + p * 0.55})`;
                ctx.lineWidth = 4 + p * 6;
                ctx.setLineDash([16, 12]);
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(lb.length, 0); ctx.stroke();
            } else {
                const pulse = 0.85 + 0.15 * Math.sin(age * 0.9);
                ctx.fillStyle = 'rgba(224, 86, 253, 0.32)';
                ctx.fillRect(0, -lb.width * 0.72 * pulse, lb.length, lb.width * 1.44 * pulse);
                ctx.fillStyle = 'rgba(0, 245, 255, 0.78)';
                ctx.fillRect(0, -lb.width * 0.42 * pulse, lb.length, lb.width * 0.84 * pulse);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, -lb.width * 0.16, lb.length, lb.width * 0.32);
                // Animated equalizer soundwave line inside the laser!
                ctx.strokeStyle = '#facc15';
                ctx.lineWidth = 2.4;
                ctx.beginPath();
                for (let x = 0; x <= lb.length; x += 26) {
                    const y = Math.sin(x * 0.08 + age * 0.85) * (lb.width * 0.36);
                    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            ctx.restore();
        }
    }
}

if (typeof window !== 'undefined') {
    window.LilXasAttacksFX = LilXasAttacksFX;
}
