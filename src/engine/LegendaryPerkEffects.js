/**
 * Lesa.io - Legendary Perk Runtime Effects Engine (Alpha 1.5)
 * Handles combat state, physics, and canvas rendering for all 5 Legendary perks:
 * - Boreas Permafrost (Glacial shard shots, 3-stack/dash Freeze + Shatter AoE)
 * - Raki Overdrive (Missing-HP Fire Rate & Crit Damage + Elite/Boss CD trim)
 * - Olympian Phalanx (High-HP DR stacking into empowered Dash Slam stun cone)
 * - Spartan Blink (Invulnerable Lightning Warp + path burst + crackling tether)
 * - Agora Alchemist (Permanent Magnet, Boss/Elite material luck, full-HP Heart Alchemy)
 */

class LegendaryPerkEffects {
    constructor() {
        this.reset();
    }

    reset() {
        this.permafrostShotCount = 0;
        this.activeDashShatter = null;
        this.phalanxStacks = 0;
        this.phalanxCones = [];
        this.activeBlink = null;
        this.blinkTethers = [];
        this.rakiTrimCd = 0;
    }

    _has(id) {
        return typeof PerkSystem !== 'undefined' && PerkSystem.hasPerk(id);
    }

    _stats(id) {
        return typeof PerkSystem !== 'undefined' ? PerkSystem.getRankStats(id) : {};
    }

    _distToSegmentSq(px, py, x1, y1, x2, y2) {
        const vx = x2 - x1;
        const vy = y2 - y1;
        const lenSq = vx * vx + vy * vy;
        if (lenSq <= 0.0001) return (px - x1) ** 2 + (py - y1) ** 2;
        const t = Math.max(0, Math.min(1, ((px - x1) * vx + (py - y1) * vy) / lenSq));
        const cx = x1 + t * vx;
        const cy = y1 + t * vy;
        return (px - cx) ** 2 + (py - cy) ** 2;
    }

    _damageEnemy(enemy, amount, effects, game, isCrit = false) {
        if (!enemy || enemy.dead || enemy.isDying || enemy.isAirborneImmune) return false;
        if (typeof enemy.takeDamage !== 'function') return false;
        const killed = enemy.takeDamage(Math.max(1, Math.round(amount)), effects, isCrit);
        if (game && game.isCoopGuest) enemy.dead = false;
        return killed;
    }

    // --- Weapon & Multiplier Queries ---

    onWeaponFire() {
        if (!this._has('boreas_permafrost')) return null;
        const st = this._stats('boreas_permafrost');
        const interval = Math.max(2, st.everyNShots || 6);
        this.permafrostShotCount = (this.permafrostShotCount + 1) % interval;
        if (this.permafrostShotCount === 0) {
            return { isPermafrostShard: true, shardDmgMult: st.shardDmgMult || 1.45 };
        }
        return null;
    }

    _overdriveIntensity(player, st) {
        if (!player) return 0;
        const hpRatio = Math.max(0, Math.min(1, (player.hp || 0) / Math.max(1, player.maxHp || 100)));
        if (hpRatio >= 1) return 0;
        const cap = Math.min(0.85, Math.max(0.1, st.lowHpCap ?? 0.35));
        return Math.max(0, Math.min(1, (1 - hpRatio) / (1 - cap)));
    }

    getFireRateMultiplier(player) {
        if (!player || !this._has('raki_overdrive')) return 1.0;
        const st = this._stats('raki_overdrive');
        return 1 + this._overdriveIntensity(player, st) * (st.maxFireRateBonus || 0.28);
    }

    getCritDamageBonus(player) {
        if (!player || !this._has('raki_overdrive')) return 0;
        const st = this._stats('raki_overdrive');
        return this._overdriveIntensity(player, st) * (st.maxCritDmgBonus || 0.15);
    }

    getDamageMultiplier(targetEnemy) {
        if (!targetEnemy || targetEnemy.dead) return 1.0;
        if (this._has('boreas_permafrost') && targetEnemy._permafrostVulnTimer > 0) {
            return 1 + (targetEnemy._permafrostVulnBonus || 0.20);
        }
        return 1.0;
    }

    getDashSpeedMultiplier() {
        if (!this._has('spartan_blink')) return 1.0;
        const st = this._stats('spartan_blink');
        return 1 + (st.speedBonus || 0.25);
    }

    getMagnetMultiplier() {
        if (!this._has('agora_alchemist')) return 1.0;
        const st = this._stats('agora_alchemist');
        return 1 + (st.magnetBonus || 0.80);
    }

    getMaterialDropLuckBonus() {
        if (!this._has('agora_alchemist')) return 0;
        const st = this._stats('agora_alchemist');
        return st.matLuckBonus || 0.15;
    }

    getFullHpHeartCoinValue(player) {
        if (!player || player.hp < player.maxHp || !this._has('agora_alchemist')) return 0;
        const st = this._stats('agora_alchemist');
        return st.heartCoinValue || 10;
    }

    // --- Combat Events ---

    interceptPlayerDamage(player, amount, effects, game) {
        if (!player || amount <= 0 || !this._has('olympian_phalanx')) {
            return { blocked: false, remainingDamage: amount };
        }
        const st = this._stats('olympian_phalanx');
        const hpRatio = (player.hp || 0) / Math.max(1, player.maxHp || 100);
        if (hpRatio < (st.hpMinRatio || 0.50)) {
            return { blocked: false, remainingDamage: amount };
        }
        const reduced = Math.max(1, Math.round(amount * (1 - (st.dmgReduction || 0.18))));
        const maxStacks = st.maxStacks || 5;
        if (this.phalanxStacks < maxStacks) {
            this.phalanxStacks += 1;
            if (effects) {
                const msg = this.phalanxStacks >= maxStacks ? '🛡️ PHALANX READY!' : `🛡️ ${this.phalanxStacks}/${maxStacks}`;
                effects.addPopup(player.x, player.y - 34, msg, '#f59e0b', 18);
            }
        }
        return { blocked: false, remainingDamage: reduced };
    }

    onDash(player, effects, game) {
        if (!player) return;
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);

        // 1. Olympian Phalanx Empowered Slam Cone (at max stacks)
        if (this._has('olympian_phalanx')) {
            const st = this._stats('olympian_phalanx');
            if (this.phalanxStacks >= (st.maxStacks || 5)) {
                this.phalanxStacks = 0;
                const dir = (player.vx || player.vy) ? Math.atan2(player.vy, player.vx) : (player.angle || 0);
                const range = st.slamRange || 210;
                const dmg = (st.slamDamage || 120) * (player.damageMultiplier || 1);
                const stunSec = st.stunSec || 1.0;

                if (g && Array.isArray(g.enemies)) {
                    for (let i = 0; i < g.enemies.length; i++) {
                        const e = g.enemies[i];
                        if (!e || e.dead || e.isDying || e.isAirborneImmune) continue;
                        const dx = e.x - player.x;
                        const dy = e.y - player.y;
                        const dist = Math.hypot(dx, dy);
                        if (dist > range + (e.radius || 20)) continue;
                        let angleDiff = Math.abs(Math.atan2(dy, dx) - dir);
                        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
                        if (dist <= 75 || angleDiff <= 1.2) {
                            this._damageEnemy(e, dmg, effects, g, true);
                            if (!e.dead && typeof e.applyStun === 'function') e.applyStun(stunSec, effects);
                        }
                    }
                }
                this.phalanxCones.push({ x: player.x, y: player.y, angle: dir, range, timer: 18, maxTimer: 18 });
                if (effects) {
                    effects.addShockwave(player.x, player.y, range * 0.72, 'rgba(245, 158, 11, 0.92)');
                    effects.addComicSplash(player.x, player.y - 46, '🛡️ PHALANX SLAM!');
                    effects.addSparks(player.x, player.y, '#ffd32a', 14);
                }
            }
        }

        // 2. Boreas Permafrost Dash-Shatter sweep
        if (this._has('boreas_permafrost')) {
            this.activeDashShatter = { stats: this._stats('boreas_permafrost'), hitSet: new Set() };
        }

        // 3. Spartan Blink Lightning Warp
        if (this._has('spartan_blink')) {
            const st = this._stats('spartan_blink');
            player.invulnerableTimer = Math.max(player.invulnerableTimer || 0, (player.dashDuration || 12) + 8);
            this.activeBlink = { startX: player.x, startY: player.y, stats: st, hitSet: new Set() };
            if (effects) {
                effects.addSparks(player.x, player.y, '#00f5ff', 12);
                effects.addComicSplash(player.x, player.y - 34, '⚡ BLINK!');
            }
        }
    }

    onBulletHit(bullet, targetEnemy, damageDealt, enemies, effects, game) {
        if (!targetEnemy || targetEnemy.dead) return;
        if (!this._has('boreas_permafrost') || !bullet || !bullet.isPermafrostShard) return;

        const st = this._stats('boreas_permafrost');
        if (typeof targetEnemy.applyIceSlow === 'function') {
            targetEnemy.applyIceSlow(st.slowSec || 2.5, 1 - (st.slowRatio || 0.40), effects);
        }
        targetEnemy._chillStacks = (targetEnemy._chillStacks || 0) + 1;

        if (effects) {
            effects.addSparks(targetEnemy.x, targetEnemy.y, '#74b9ff', 7);
        }

        if (targetEnemy._chillStacks >= 3) {
            this._triggerFreezeShatter(targetEnemy, st, enemies, effects, game, damageDealt);
        } else if (effects) {
            effects.addPopup(targetEnemy.x, targetEnemy.y - 26, `❄️ ${targetEnemy._chillStacks}/3`, '#74b9ff', 16);
        }
    }

    _triggerFreezeShatter(centerEnemy, st, enemies, effects, game, refDmg = 60) {
        if (!centerEnemy || centerEnemy.dead) return;
        centerEnemy._chillStacks = 0;

        const baseFreeze = st.freezeSec || 1.2;
        const freezeSec = centerEnemy.isBoss ? baseFreeze * 0.55 : baseFreeze;
        if (typeof centerEnemy.applyStun === 'function') {
            centerEnemy.applyStun(freezeSec, null);
        }
        centerEnemy._permafrostFreezeTimer = Math.round(freezeSec * 60);
        centerEnemy._permafrostVulnTimer = Math.round((freezeSec + 2.0) * 60);
        centerEnemy._permafrostVulnBonus = st.vulnBonus || 0.20;

        const shatterRadius = st.shatterRadius || 150;
        const shatterDmg = Math.max(35, Math.round(refDmg * (0.40 + (st.vulnBonus || 0.20))));
        if (Array.isArray(enemies)) {
            const radSq = shatterRadius * shatterRadius;
            for (let i = 0; i < enemies.length; i++) {
                const e = enemies[i];
                if (!e || e.dead || e.isDying || e.isAirborneImmune) continue;
                const dSq = (e.x - centerEnemy.x) ** 2 + (e.y - centerEnemy.y) ** 2;
                if (dSq <= radSq + (e.radius || 20) ** 2) {
                    e._permafrostVulnTimer = Math.max(e._permafrostVulnTimer || 0, Math.round((freezeSec + 1.5) * 60));
                    e._permafrostVulnBonus = Math.max(e._permafrostVulnBonus || 0, st.vulnBonus || 0.20);
                    this._damageEnemy(e, shatterDmg, effects, game, true);
                }
            }
        }
        if (effects) {
            effects.addShockwave(centerEnemy.x, centerEnemy.y, shatterRadius, 'rgba(116, 185, 255, 0.90)');
            effects.addComicSplash(centerEnemy.x, centerEnemy.y - 36, '❄️ SHATTER!');
            effects.addSparks(centerEnemy.x, centerEnemy.y, '#dff9fb', 14);
        }
    }

    onEnemyKilled(enemy, game) {
        if (!enemy || !game || !game.player) return;
        if (!this._has('raki_overdrive') || this.rakiTrimCd > 0) return;

        // Only true Mini-Bosses & Bosses trigger Raki CD trim (prevents crowd-kill skill spam)
        const isPriority = !!(enemy.isMiniBoss || enemy.isEndlessBoss || enemy.isBoss);
        if (!isPriority) return;

        const st = this._stats('raki_overdrive');
        const keep = Math.max(0, 1 - (st.cdTrimRatio || 0.15));
        const player = game.player;
        if (player.dashCooldown > 0) player.dashCooldown = Math.round(player.dashCooldown * keep);
        if (player.skillCooldown > 0) player.skillCooldown = Math.round(player.skillCooldown * keep);
        this.rakiTrimCd = Math.round((st.trimCdSec || 6.0) * 60);
        if (game.effects) {
            game.effects.addPopup(player.x, player.y - 40, '🔥 RAKI TRIM!', '#fdcb6e', 18);
        }
    }

    // --- Per-Frame Update & Rendering ---

    update(dt = 1, game) {
        if (!game) return;
        if (this.rakiTrimCd > 0) this.rakiTrimCd = Math.max(0, this.rakiTrimCd - dt);
        const player = game.player;
        const enemies = Array.isArray(game.enemies) ? game.enemies : [];
        const effects = game.effects;

        // Tick Boreas enemy frost timers
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (!e) continue;
            if (e._permafrostFreezeTimer > 0) e._permafrostFreezeTimer = Math.max(0, e._permafrostFreezeTimer - dt);
            if (e._permafrostVulnTimer > 0) e._permafrostVulnTimer = Math.max(0, e._permafrostVulnTimer - dt);
        }

        // Dash-Shatter sweep while dashing with Boreas Permafrost
        if (this.activeDashShatter && player) {
            if (player.isDashing) {
                const st = this.activeDashShatter.stats;
                const reach = ((st.shatterRadius || 150) * 0.65) + (player.radius || 22);
                const refDmg = 75 * (player.damageMultiplier || 1);
                for (let i = 0; i < enemies.length; i++) {
                    const e = enemies[i];
                    if (!e || e.dead || e.isDying || this.activeDashShatter.hitSet.has(e)) continue;
                    if (!(e._chillStacks > 0 || e.iceSlowTimer > 0)) continue;
                    if (Math.hypot(e.x - player.x, e.y - player.y) <= reach + (e.radius || 20)) {
                        this.activeDashShatter.hitSet.add(e);
                        this._triggerFreezeShatter(e, st, enemies, effects, game, refDmg);
                    }
                }
            } else {
                this.activeDashShatter = null;
            }
        }

        // Spartan Blink warp sweep + static tether spawn
        if (this.activeBlink && player) {
            const bk = this.activeBlink;
            const st = bk.stats;
            const pathDmg = (st.pathDamage || 75) * (player.damageMultiplier || 1);
            const hitWidth = st.tetherWidth || 34;

            for (let i = 0; i < enemies.length; i++) {
                const e = enemies[i];
                if (!e || e.dead || e.isDying || bk.hitSet.has(e)) continue;
                const r = (e.radius || 20) + hitWidth;
                if (this._distToSegmentSq(e.x, e.y, bk.startX, bk.startY, player.x, player.y) <= r * r) {
                    bk.hitSet.add(e);
                    this._damageEnemy(e, pathDmg, effects, game, true);
                    if (effects) effects.addSparks(e.x, e.y, '#00f5ff', 6);
                }
            }

            if (!player.isDashing) {
                const dur = Math.round((st.tetherDurationSec || 1.5) * 60);
                if (Math.hypot(player.x - bk.startX, player.y - bk.startY) >= 10) {
                    this.blinkTethers.push({
                        x1: bk.startX, y1: bk.startY, x2: player.x, y2: player.y,
                        timer: dur, maxTimer: dur, tickCd: 8,
                        dps: (st.tetherDps || 35) * (player.damageMultiplier || 1),
                        width: hitWidth
                    });
                }
                if (effects) effects.addShockwave(player.x, player.y, 70, 'rgba(0, 245, 255, 0.8)');
                this.activeBlink = null;
            }
        }

        // Tick Spartan Blink crackling static tethers (4 Hz zap)
        for (let i = this.blinkTethers.length - 1; i >= 0; i--) {
            const t = this.blinkTethers[i];
            t.timer -= dt;
            t.tickCd -= dt;
            if (t.tickCd <= 0) {
                t.tickCd = 15;
                const zapDmg = Math.max(8, Math.round(t.dps * 0.25));
                for (let ei = 0; ei < enemies.length; ei++) {
                    const e = enemies[ei];
                    if (!e || e.dead || e.isDying || e.isAirborneImmune) continue;
                    const r = (e.radius || 20) + t.width;
                    if (this._distToSegmentSq(e.x, e.y, t.x1, t.y1, t.x2, t.y2) <= r * r) {
                        this._damageEnemy(e, zapDmg, effects, game, false);
                        if (effects && Math.random() < 0.45) effects.addSparks(e.x, e.y, '#74b9ff', 4);
                    }
                }
            }
            if (t.timer <= 0) this.blinkTethers.splice(i, 1);
        }

        // Tick Phalanx cone visuals
        for (let i = this.phalanxCones.length - 1; i >= 0; i--) {
            this.phalanxCones[i].timer -= dt;
            if (this.phalanxCones[i].timer <= 0) this.phalanxCones.splice(i, 1);
        }
    }

    draw(ctx, game) {
        if (!ctx || !game || !game.player) return;
        const player = game.player;
        const enemies = Array.isArray(game.enemies) ? game.enemies : [];
        const now = performance.now() * 0.005;

        // 1. Spartan Blink crackling static tethers
        for (let i = 0; i < this.blinkTethers.length; i++) {
            const t = this.blinkTethers[i];
            const alpha = Math.max(0.15, t.timer / Math.max(1, t.maxTimer));
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = '#00f5ff';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(t.x1, t.y1);
            for (let s = 1; s < 5; s++) {
                const frac = s / 5;
                const jx = (Math.sin(now * 6 + s * 2.1 + i) * 11);
                const jy = (Math.cos(now * 5 + s * 1.7 + i) * 11);
                ctx.lineTo(t.x1 + (t.x2 - t.x1) * frac + jx, t.y1 + (t.y2 - t.y1) * frac + jy);
            }
            ctx.lineTo(t.x2, t.y2);
            ctx.stroke();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }

        // 2. Olympian Phalanx slam cone FX + orbiting shield pips
        for (let i = 0; i < this.phalanxCones.length; i++) {
            const c = this.phalanxCones[i];
            const alpha = Math.max(0.08, (c.timer / c.maxTimer) * 0.45);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#f59e0b';
            ctx.strokeStyle = '#fef3c7';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(c.x, c.y);
            ctx.arc(c.x, c.y, c.range, c.angle - 1.15, c.angle + 1.15);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        if (this._has('olympian_phalanx') && this.phalanxStacks > 0 && player.hp > 0) {
            const st = this._stats('olympian_phalanx');
            const isReady = this.phalanxStacks >= (st.maxStacks || 5);
            ctx.save();
            if (isReady) {
                ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(player.x, player.y, (player.radius || 22) + 12, 0, Math.PI * 2);
                ctx.stroke();
            }
            for (let p = 0; p < this.phalanxStacks; p++) {
                const a = now * 0.8 + (p * Math.PI * 2) / Math.max(1, this.phalanxStacks);
                const px = player.x + Math.cos(a) * 34;
                const py = player.y + Math.sin(a) * 34;
                ctx.fillStyle = isReady ? '#ffd32a' : '#f59e0b';
                ctx.strokeStyle = '#1e272e';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(px, py, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
            ctx.restore();
        }

        // 3. Raki Overdrive missing-HP heat aura
        if (this._has('raki_overdrive') && player.hp > 0) {
            const intensity = this._overdriveIntensity(player, this._stats('raki_overdrive'));
            if (intensity > 0.12) {
                ctx.save();
                ctx.globalAlpha = 0.25 + intensity * 0.45;
                ctx.strokeStyle = intensity > 0.7 ? '#ff4757' : '#ffa502';
                ctx.lineWidth = 2 + intensity * 2.5;
                ctx.setLineDash([7, 5]);
                ctx.beginPath();
                ctx.arc(player.x, player.y, (player.radius || 22) + 8 + Math.sin(now * 2) * 2.5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        }

        // 4. Boreas Permafrost enemy chill stack pips & freeze ring
        if (this._has('boreas_permafrost')) {
            for (let i = 0; i < enemies.length; i++) {
                const e = enemies[i];
                if (!e || e.dead || (!e._chillStacks && !(e._permafrostFreezeTimer > 0))) continue;
                ctx.save();
                if (e._permafrostFreezeTimer > 0) {
                    ctx.strokeStyle = '#dff9fb';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(e.x, e.y, (e.radius || 22) + 6, 0, Math.PI * 2);
                    ctx.stroke();
                } else {
                    for (let c = 0; c < e._chillStacks; c++) {
                        ctx.fillStyle = '#74b9ff';
                        ctx.strokeStyle = '#0984e3';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.arc(e.x + (c - 1) * 9, e.y - (e.radius || 22) - 10, 3.5, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                    }
                }
                ctx.restore();
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.LegendaryPerkEffects = LegendaryPerkEffects;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LegendaryPerkEffects };
}
