/**
 * Lesa.io - Celestial Weapon: Hyperion Celestial Glaive
 * Ultra-rare Mythic Chest Relic (0.4% Celestial tier, Evolvable ★).
 * Pure non-projectile astral glaive combat:
 *   1) Wide alternating 155° Prismatic Crescent Cleaves (physically swings held weapon)
 *   2) Expanding curved Astral Crescent Wave-Arcs slicing across lanes
 *   3) 2 (3 Evolved ★) Orbiting Prism Star-Blades that auto-tether nearby enemies
 *   4) Every 4th (3rd Evolved ★) Swing anchors a Celestial Rift chaining prism beams & detonating
 */

class HyperionCelestialGlaive extends WeaponBase {
    static _slashes = [];
    static _waves = [];
    static _rifts = [];
    static _tethers = [];
    static _orbitOwner = null;
    static _orbitTimer = 0;
    static _orbitTick = 0;
    static _orbitPhase = 0;
    static _orbitEvolved = false;
    static _orbitDamage = 26;

    constructor() {
        super({
            id: 'hyperion_glaive',
            name: 'Hyperion Celestial Glaive',
            type: 'hyperion_glaive',
            rarity: 'Celestial',
            hero: null,
            baseDelay: 19,
            baseDamage: 80,
            radius: 26,
            extraPierce: 0,
            maxBounces: 0,
            speedMultiplier: 1.0,
            critChanceBonus: 0.22,
            range: 360,
            color: '#c084fc',
            icon: 'assets/WeaponIcons/HyperionCelestialGlaive.png',
            description: 'Ultra-rare Celestial astral polearm. Carves wide 155° prismatic crescent waves, summons orbiting star-blades, and chains 4th-swing supernova rifts.',
            stats: {
                damage: '80 Astral Cleave',
                fireRate: 'Swift (0.32s)',
                pierce: '∞ Crescent Cleave',
                special: 'Orbiting Blades • 4th Chain Rift'
            }
        });
    }

    /**
     * Render 2.5D animated Hyperion Celestial Glaive in hero's hands (swings in a sweeping arc when firing).
     */
    static drawWeapon(ctx, flash, recoil = 0, isEvolved = false, player = null) {
        ctx.save();
        const swingTimer = player && player._glaiveSwingTimer > 0 ? player._glaiveSwingTimer : 0;
        const swingDir = (player && player._glaiveSwingDir) ? player._glaiveSwingDir : 1;
        const now = typeof performance !== 'undefined' ? performance.now() * 0.005 : 0;
        const ink = '#141418';

        // Dynamic sweeping melee arc rotation when attacking, poised diagonal stance at rest
        let sweepAngle = -0.34;
        if (swingTimer > 0) {
            const prog = 1 - Math.max(0, Math.min(1, swingTimer / 14));
            sweepAngle = swingDir * (-1.95 + prog * 3.9);
            ctx.rotate(sweepAngle);
            if (!flash) {
                ctx.save();
                ctx.globalAlpha = (1 - prog) * 0.55;
                ctx.strokeStyle = isEvolved ? '#fef08a' : '#38bdf8';
                ctx.lineWidth = 7 * (1 - prog * 0.5);
                ctx.beginPath();
                ctx.arc(4, 0, 42, -swingDir * 0.9, 0, swingDir < 0);
                ctx.stroke();
                ctx.restore();
            }
        } else {
            ctx.rotate(sweepAngle + Math.sin(now * 0.7) * 0.04);
        }

        ctx.translate(4, 0);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // 1. Counterweight Crescent Pommel
        ctx.fillStyle = flash ? '#ffffff' : '#fbbf24';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        ctx.moveTo(-22, -4.5);
        ctx.quadraticCurveTo(-15, 0, -22, 4.5);
        ctx.quadraticCurveTo(-18, 0, -22, -4.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 2. Obsidian & Gold-Inlaid Astral Shaft
        const shaftGrad = ctx.createLinearGradient(-18, -3, 24, 3);
        shaftGrad.addColorStop(0, flash ? '#ffffff' : '#1e1b4b');
        shaftGrad.addColorStop(0.55, flash ? '#ffffff' : '#312e81');
        shaftGrad.addColorStop(1, flash ? '#ffffff' : '#f59e0b');
        ctx.fillStyle = shaftGrad;
        ctx.beginPath();
        ctx.roundRect(-18, -2.5, 42, 5, 2.5);
        ctx.fill();
        ctx.stroke();

        // Gold Collar Ribbons
        if (!flash) {
            ctx.fillStyle = '#fcd34d';
            ctx.fillRect(-4, -3.2, 4, 6.4);
            ctx.fillRect(15, -3.6, 5, 7.2);
            ctx.strokeRect(15, -3.6, 5, 7.2);
        }

        // 3. Spinning Gyroscope Halo + Floating Prism Star Core at Collar (x=22)
        ctx.save();
        ctx.translate(22, 0);
        if (!flash) {
            ctx.save();
            ctx.rotate(now * 1.4);
            ctx.strokeStyle = isEvolved ? '#fef08a' : '#f0abfc';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.ellipse(0, 0, 8.5, 4.2, 0.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.rotate(-now * 2.4);
            ctx.strokeStyle = '#38bdf8';
            ctx.beginPath();
            ctx.ellipse(0, 0, 8.5, 4.2, -0.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        ctx.fillStyle = flash ? '#ffffff' : '#e0f2fe';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -5.2);
        ctx.lineTo(4.8, 0);
        ctx.lineTo(0, 5.2);
        ctx.lineTo(-4.8, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // 4. Sweeping Double-Crescent Celestial Crystal Blade (x: 20 .. 52)
        const bladeGrad = ctx.createLinearGradient(20, -18, 52, 16);
        bladeGrad.addColorStop(0, flash ? '#ffffff' : '#38bdf8');
        bladeGrad.addColorStop(0.45, flash ? '#ffffff' : '#c084fc');
        bladeGrad.addColorStop(0.85, flash ? '#ffffff' : '#fef08a');
        bladeGrad.addColorStop(1, '#ffffff');
        ctx.fillStyle = bladeGrad;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.1;
        ctx.beginPath();
        ctx.moveTo(21, -4);
        ctx.quadraticCurveTo(30, -21, 51, -13);
        ctx.quadraticCurveTo(42, -3, 52, 0);
        ctx.quadraticCurveTo(41, 4, 46, 15);
        ctx.quadraticCurveTo(28, 18, 21, 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner White-Gold Cutting Edge Highlight & Evolved Star Fin
        if (!flash) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(27, -11);
            ctx.quadraticCurveTo(38, -15, 49, -12);
            ctx.stroke();

            if (isEvolved) {
                ctx.fillStyle = '#fef08a';
                ctx.strokeStyle = ink;
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.moveTo(19, -7);
                ctx.lineTo(13, -15);
                ctx.lineTo(24, -10);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    /**
     * Execute a full non-projectile Celestial Glaive swing (cleave + wave-arc + orbiting blades + 4th-swing rift).
     */
    static fireSwing(player, config, critChance, critMult, isEvolved, effects = null, game = null) {
        if (!player) return [];
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        const isGuest = !!(g && g.isCoopGuest);

        player._glaiveSwingDir = player._glaiveSwingDir === 1 ? -1 : 1;
        player._glaiveSwingTimer = 14;
        player._glaiveSwingCount = (player._glaiveSwingCount || 0) + 1;

        const riftEvery = config.riftEveryNSwings || (isEvolved ? 3 : 4);
        const isRiftSwing = (player._glaiveSwingCount % riftEvery) === 0;
        const aim = player.angle || 0;
        const dmgMult = player.damageMultiplier || 1;
        const baseDmg = (config.baseDamage || 80) * dmgMult;
        const tMods = config.celestialMods || null;
        const waveRange = (config.range || (isEvolved ? 410 : 360));
        const cleaveRadius = Math.round((isEvolved ? 235 : 205) * (1 + (tMods ? tMods.cleaveRadiusBonus : 0)));
        const pr = player.radius || 25;
        const originX = player.x + Math.cos(aim) * 18;
        const originY = (player.y - pr * 0.25) + Math.sin(aim) * 18;

        // 1. Visual Sweeping Slash Arc anchored at hero
        this._slashes.push({
            x: player.x,
            y: player.y - pr * 0.25,
            angle: aim,
            dir: player._glaiveSwingDir,
            radius: cleaveRadius,
            isEvolved,
            isRiftSwing,
            timer: 14,
            maxTimer: 14
        });

        // 2. Immediate 155° Front Crescent Cleave Damage
        if (!isGuest && g && Array.isArray(g.enemies)) {
            this._damageArcEnemies(originX, originY, aim, cleaveRadius, 1.35, baseDmg, critChance, critMult, 9.5, g, effects);
        }

        // 3. Expanding Astral Crescent Wave-Arc gliding forward through lanes (not a round bullet)
        const waveSpeed = isEvolved ? 15.5 : 13.5;
        this._waves.push({
            x: originX + Math.cos(aim) * 32,
            y: originY + Math.sin(aim) * 32,
            vx: Math.cos(aim) * waveSpeed,
            vy: Math.sin(aim) * waveSpeed,
            angle: aim,
            halfWidth: isEvolved ? 84 : 70,
            traveled: 0,
            maxRange: waveRange,
            damage: Math.round(baseDmg * 0.85),
            critChance,
            critMult,
            isEvolved,
            shooter: player,
            hitSet: new Set()
        });

        // 4. Refresh Orbiting Celestial Star-Blades (2 base, 3 evolved, up to 5 with Astral Flock)
        this._orbitOwner = player;
        this._orbitTimer = 270;
        this._orbitEvolved = !!isEvolved;
        this._orbitBonusCount = tMods ? (tMods.orbitBladesBonus || 0) : 0;
        this._orbitDamage = Math.max(18, Math.round(baseDmg * 0.38 * (1 + (tMods ? tMods.orbitDamageMultBonus : 0))));

        if (typeof HyperionSkillTreeTraits !== 'undefined') {
            HyperionSkillTreeTraits.onSwing(originX, originY, aim, baseDmg, critChance, critMult, config, player, g);
        }

        // 5. Every Nth Swing: Celestial Supernova Rift Anchor that pulls + chain-tethers nearby enemies
        if (isRiftSwing) {
            const rx = originX + Math.cos(aim) * (isEvolved ? 225 : 195);
            const ry = originY + Math.sin(aim) * (isEvolved ? 225 : 195);
            this._rifts.push({
                x: rx,
                y: ry,
                radius: Math.round((isEvolved ? 275 : 235) * (1 + (tMods ? tMods.cleaveRadiusBonus : 0))),
                damage: Math.round(baseDmg * (isEvolved ? 1.75 : 1.45)),
                maxChains: isEvolved ? 9 : 6,
                isEvolved,
                celestialTraitId: config.celestialTraitId || null,
                timer: 16,
                maxTimer: 16,
                chained: false,
                shooter: player
            });
            if (effects) {
                effects.addShockwave(rx, ry, isEvolved ? 175 : 145, 'rgba(192, 132, 252, 0.90)');
                effects.addComicSplash(rx, ry - 32, isEvolved ? '✦ SUPERNOVA RIFT!' : '✦ CELESTIAL RIFT!', '#f0abfc', 24, true);
            }
        }

        if (effects) {
            effects.addSparks(originX + Math.cos(aim) * 38, originY + Math.sin(aim) * 38, '#38bdf8', 5);
            effects.addSparks(originX + Math.cos(aim) * 38, originY + Math.sin(aim) * 38, '#fef08a', 4);
        }

        // Relay co-op swing combat & visuals when active
        if (g && g.coopSession && g.coopSession.net && typeof CoopCombatFx !== 'undefined' && typeof CoopCombatFx.relayGlaiveSwing === 'function') {
            CoopCombatFx.relayGlaiveSwing(g.coopSession.net, player, aim, isEvolved, isRiftSwing, {
                baseDmg, critChance, critMult, cleaveRadius, waveRange, traitId: config.celestialTraitId || null
            });
        }

        return [];
    }

    static spawnRemoteSwing(player, aim, isEvolved, isRiftSwing, effects = null, game = null, isHostAuth = false, netData = null) {
        if (typeof HyperionSkillTreeTraits !== 'undefined' && typeof HyperionSkillTreeTraits.handleRemoteSwing === 'function') {
            HyperionSkillTreeTraits.handleRemoteSwing(this, player, aim, isEvolved, isRiftSwing, effects, game, isHostAuth, netData);
            return;
        }
        if (!player) return;
        player._glaiveSwingDir = player._glaiveSwingDir === 1 ? -1 : 1; player._glaiveSwingTimer = 14;
        const pr = player.radius || 25, ox = player.x + Math.cos(aim) * 18, oy = (player.y - pr * 0.25) + Math.sin(aim) * 18;
        this._slashes.push({ x: player.x, y: player.y - pr * 0.25, angle: aim, dir: player._glaiveSwingDir, radius: isEvolved ? 235 : 205, isEvolved, isRiftSwing, timer: 14, maxTimer: 14 });
        this._waves.push({ x: ox + Math.cos(aim) * 32, y: oy + Math.sin(aim) * 32, vx: Math.cos(aim) * (isEvolved ? 15.5 : 13.5), vy: Math.sin(aim) * (isEvolved ? 15.5 : 13.5), angle: aim, halfWidth: isEvolved ? 84 : 70, traveled: 0, maxRange: isEvolved ? 410 : 360, damage: 0, critChance: 0, critMult: 1, isEvolved, shooter: player, visualOnly: true, hitSet: new Set() });
    }

    static _normAngle(a) {
        let res = a;
        while (res > Math.PI) res -= Math.PI * 2;
        while (res < -Math.PI) res += Math.PI * 2;
        return res;
    }

    static _forEachEnemy(ox, oy, radius, enemies, fn) {
        if (!enemies) return;
        const wrap = (e) => {
            if (!e || e.dead || e.isDying || e.hp <= 0 || e.isAirborneImmune) return;
            fn(e);
        };
        if (typeof SpatialHashGrid !== 'undefined') SpatialHashGrid.forEachEnemyNear(ox, oy, radius, enemies, wrap);
        else for (let i = 0; i < enemies.length; i++) wrap(enemies[i]);
    }

    static _damageArcEnemies(ox, oy, aim, radius, halfConeRad, baseDmg, critChance, critMult, pushForce, g, effects) {
        this._forEachEnemy(ox, oy, radius + 30, g.enemies, (e) => {
            const dx = e.x - ox, dy = e.y - oy, dist = Math.hypot(dx, dy);
            if (dist > radius + (e.radius || 20)) return;
            if (dist > 36 && Math.abs(this._normAngle(Math.atan2(dy, dx) - aim)) > halfConeRad) return;
            const isCrit = Math.random() < critChance;
            const dmg = Math.round(baseDmg * (isCrit ? critMult : 1));
            if (typeof e.takeDamage === 'function') e.takeDamage(dmg, effects, isCrit, false);
            if (dist > 1 && !(e.isBoss || e.isMiniBoss)) {
                e.x += (dx / dist) * pushForce; e.y += (dy / dist) * pushForce;
                if (typeof e.applyArenaBounds === 'function' && g.arena) e.applyArenaBounds(g.arena);
            }
            if (effects) effects.addSparks(e.x, e.y, isCrit ? '#fef08a' : '#f0abfc', isCrit ? 6 : 3);
        });
        if (typeof HyperionSkillTreeTraits !== 'undefined') HyperionSkillTreeTraits.damageObstaclesInArc(ox, oy, aim, radius, halfConeRad, baseDmg, g, effects);
    }

    static update(dt = 1, game = null) {
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        const enemies = (g && Array.isArray(g.enemies)) ? g.enemies : null;
        const effects = g ? g.effects : null;
        const isGuest = !!(g && g.isCoopGuest);

        if (g && g.player && g.player._glaiveSwingTimer > 0) g.player._glaiveSwingTimer = Math.max(0, g.player._glaiveSwingTimer - dt);
        const rps = (g && g.coopSession && (g.coopSession.remotePlayers || (g.coopSession.remotePlayer ? [g.coopSession.remotePlayer] : []))) || [];
        for (let ri = 0; ri < rps.length; ri++) { if (rps[ri] && rps[ri]._glaiveSwingTimer > 0) rps[ri]._glaiveSwingTimer = Math.max(0, rps[ri]._glaiveSwingTimer - dt); }

        for (let i = this._slashes.length - 1; i >= 0; i--) {
            this._slashes[i].timer -= dt;
            if (this._slashes[i].timer <= 0) this._slashes.splice(i, 1);
        }

        // Gliding Crescent Waves
        for (let i = this._waves.length - 1; i >= 0; i--) {
            const w = this._waves[i];
            w.x += w.vx * dt; w.y += w.vy * dt;
            w.traveled += Math.hypot(w.vx, w.vy) * dt;
            const curHalf = w.halfWidth * (0.75 + Math.min(1, w.traveled / (w.maxRange || 360)) * 0.55);
            if (!isGuest && !w.visualOnly && enemies) {
                this._forEachEnemy(w.x, w.y, curHalf + 24, enemies, (e) => {
                    if (w.hitSet.has(e) || Math.hypot(e.x - w.x, e.y - w.y) > curHalf + (e.radius || 20)) return;
                    w.hitSet.add(e);
                    const isCrit = Math.random() < (w.critChance || 0.22);
                    const dmg = Math.round(w.damage * (isCrit ? (w.critMult || 1.7) : 1));
                    if (typeof e.takeDamage === 'function') e.takeDamage(dmg, effects, isCrit, false);
                    if (effects) effects.addSparks(e.x, e.y, '#38bdf8', 4);
                });
                if (typeof HyperionSkillTreeTraits !== 'undefined') HyperionSkillTreeTraits.damageObstaclesInCircle(w.x, w.y, curHalf, w.damage, g, effects, w.hitSet);
            }
            if (w.traveled >= w.maxRange) this._waves.splice(i, 1);
        }

        // Orbiting Star-Blades + Auto-Tether Zaps
        if (this._orbitTimer > 0 && this._orbitOwner && !this._orbitOwner.dead && this._orbitOwner.weaponType === 'hyperion_glaive') {
            this._orbitTimer -= dt; this._orbitPhase += 0.085 * dt; this._orbitTick += dt;
            if (this._orbitTick >= 20) {
                this._orbitTick -= 20;
                if (!isGuest && enemies) {
                    const count = (this._orbitEvolved ? 3 : 2) + (this._orbitBonusCount || 0);
                    const px = this._orbitOwner.x, py = this._orbitOwner.y - (this._orbitOwner.radius || 25) * 0.2;
                    for (let k = 0; k < count; k++) {
                        const a = this._orbitPhase + (k * Math.PI * 2) / count;
                        const bx = px + Math.cos(a) * 90, by = py + Math.sin(a) * 90;
                        let best = null, bestD = 185;
                        this._forEachEnemy(bx, by, 185, enemies, (e) => {
                            const d = Math.hypot(e.x - bx, e.y - by);
                            if (d < bestD) { bestD = d; best = e; }
                        });
                        if (best && typeof best.takeDamage === 'function') {
                            best.takeDamage(this._orbitDamage, effects, false, false);
                            this._tethers.push({ x1: bx, y1: by, x2: best.x, y2: best.y, timer: 8, maxTimer: 8, color: k % 2 === 0 ? '#38bdf8' : '#f0abfc' });
                        } else if (typeof HyperionSkillTreeTraits !== 'undefined') {
                            HyperionSkillTreeTraits.damageOrbitObstacles(bx, by, 165, this._orbitDamage, g, effects, this._tethers, k % 2 === 0 ? '#38bdf8' : '#f0abfc');
                        }
                        if (best && typeof HyperionSkillTreeTraits !== 'undefined') {
                            HyperionSkillTreeTraits.damageOrbitObstacles(bx, by, 34, this._orbitDamage, g, effects, null);
                        }
                    }
                }
            }
        } else {
            this._orbitTimer = 0;
        }

        // Celestial Rifts (Pull + Chain Tethers + Supernova Detonation)
        for (let i = this._rifts.length - 1; i >= 0; i--) {
            const rf = this._rifts[i];
            rf.timer -= dt;
            if (!isGuest && !rf.chained && rf.timer <= rf.maxTimer * 0.72 && enemies) {
                rf.chained = true;
                const pulled = [];
                this._forEachEnemy(rf.x, rf.y, rf.radius, enemies, (e) => {
                    const d = Math.hypot(e.x - rf.x, e.y - rf.y);
                    if (d <= rf.radius) pulled.push({ e, d });
                });
                pulled.sort((a, b) => a.d - b.d);
                for (let k = 0; k < Math.min(rf.maxChains, pulled.length); k++) {
                    const e = pulled[k].e;
                    if (!(e.isBoss || e.isMiniBoss)) {
                        e.x += (rf.x - e.x) * 0.36; e.y += (rf.y - e.y) * 0.36;
                        if (typeof e.applyArenaBounds === 'function' && g.arena) e.applyArenaBounds(g.arena);
                    }
                    this._tethers.push({ x1: rf.x, y1: rf.y, x2: e.x, y2: e.y, timer: 14, maxTimer: 14, color: rf.isEvolved ? '#fef08a' : '#c084fc' });
                }
            }
            if (rf.timer <= 0) {
                if (!isGuest && enemies) {
                    const hitDist = rf.radius * 0.85;
                    this._forEachEnemy(rf.x, rf.y, hitDist + 24, enemies, (e) => {
                        if (Math.hypot(e.x - rf.x, e.y - rf.y) <= hitDist + (e.radius || 20) && typeof e.takeDamage === 'function') {
                            e.takeDamage(rf.damage, effects, true, false);
                        }
                    });
                    if (typeof HyperionSkillTreeTraits !== 'undefined') HyperionSkillTreeTraits.damageObstaclesInCircle(rf.x, rf.y, hitDist, rf.damage, g, effects);
                }
                if (effects) {
                    effects.addShockwave(rf.x, rf.y, rf.radius * 0.85, 'rgba(56, 189, 248, 0.92)');
                    effects.addSparks(rf.x, rf.y, '#fef08a', 12);
                    effects.addSparks(rf.x, rf.y, '#c084fc', 10);
                }
                if (typeof HyperionSkillTreeTraits !== 'undefined') HyperionSkillTreeTraits.onRiftDetonate(rf, g, effects);
                this._rifts.splice(i, 1);
            }
        }

        for (let i = this._tethers.length - 1; i >= 0; i--) {
            this._tethers[i].timer -= dt;
            if (this._tethers[i].timer <= 0) this._tethers.splice(i, 1);
        }
        if (typeof HyperionSkillTreeTraits !== 'undefined') HyperionSkillTreeTraits.update(dt, g);
    }

    static drawWorld(ctx, cam) {
        if (!ctx) return;
        const now = typeof performance !== 'undefined' ? performance.now() * 0.006 : 0;

        // 1. Prismatic Tether Beams
        for (let i = 0; i < this._tethers.length; i++) {
            const t = this._tethers[i];
            const alpha = Math.max(0, t.timer / t.maxTimer);
            ctx.save();
            ctx.globalAlpha = alpha * 0.85;
            ctx.strokeStyle = t.color;
            ctx.lineWidth = 4.5 * alpha;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(t.x1, t.y1);
            ctx.lineTo(t.x2, t.y2);
            ctx.stroke();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.6 * alpha;
            ctx.stroke();
            ctx.restore();
        }

        // 2. Wide Crescent Cleave Slashes
        for (let i = 0; i < this._slashes.length; i++) {
            const s = this._slashes[i];
            const t = Math.max(0, s.timer / s.maxTimer);
            if (cam && typeof cam.isVisible === 'function' && !cam.isVisible(s.x, s.y, s.radius + 40)) continue;
            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate(s.angle);
            ctx.globalAlpha = t * 0.85;
            const r = s.radius * (0.92 + (1 - t) * 0.14);
            const grad = ctx.createRadialGradient(0, 0, r * 0.42, 0, 0, r);
            grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
            grad.addColorStop(0.55, s.isEvolved ? 'rgba(240, 171, 252, 0.55)' : 'rgba(192, 132, 252, 0.48)');
            grad.addColorStop(0.88, s.isRiftSwing ? 'rgba(254, 240, 138, 0.92)' : 'rgba(56, 189, 248, 0.85)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, r, -1.32, 1.32);
            ctx.arc(0, 0, r * 0.46, 1.32, -1.32, true);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        // 3. Gliding Crescent Energy Wave-Arcs
        for (let i = 0; i < this._waves.length; i++) {
            const w = this._waves[i];
            if (cam && typeof cam.isVisible === 'function' && !cam.isVisible(w.x, w.y, w.halfWidth + 40)) continue;
            const prog = Math.min(1, w.traveled / (w.maxRange || 360));
            const curHalf = w.halfWidth * (0.75 + prog * 0.55);
            ctx.save();
            ctx.translate(w.x, w.y);
            ctx.rotate(w.angle);
            ctx.globalAlpha = Math.max(0.15, 1 - prog * 0.72);
            ctx.fillStyle = w.isEvolved ? '#f0abfc' : '#38bdf8';
            ctx.strokeStyle = '#141418';
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(-10, -curHalf);
            ctx.quadraticCurveTo(32, 0, -10, curHalf);
            ctx.quadraticCurveTo(14, 0, -10, -curHalf);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(-4, -curHalf * 0.78);
            ctx.quadraticCurveTo(22, 0, -4, curHalf * 0.78);
            ctx.stroke();
            ctx.restore();
        }

        // 4. Orbiting Celestial Star-Blades
        if (this._orbitTimer > 0 && this._orbitOwner && !this._orbitOwner.dead && this._orbitOwner.weaponType === 'hyperion_glaive') {
            const px = this._orbitOwner.x, py = this._orbitOwner.y - (this._orbitOwner.radius || 25) * 0.2;
            const count = (this._orbitEvolved ? 3 : 2) + (this._orbitBonusCount || 0);
            for (let k = 0; k < count; k++) {
                const a = this._orbitPhase + (k * Math.PI * 2) / count;
                const bx = px + Math.cos(a) * 90, by = py + Math.sin(a) * 90;
                ctx.save();
                ctx.translate(bx, by);
                ctx.rotate(a + now * 2.2);
                ctx.fillStyle = k % 2 === 0 ? '#38bdf8' : '#f0abfc';
                ctx.strokeStyle = '#141418';
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                for (let p = 0; p < 8; p++) {
                    const rad = p % 2 === 0 ? 13 : 5;
                    const sa = (p / 8) * Math.PI * 2;
                    if (p === 0) ctx.moveTo(Math.cos(sa) * rad, Math.sin(sa) * rad);
                    else ctx.lineTo(Math.cos(sa) * rad, Math.sin(sa) * rad);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
        }

        // 5. Celestial Rift Anchors
        for (let i = 0; i < this._rifts.length; i++) {
            const rf = this._rifts[i];
            const t = Math.max(0, rf.timer / rf.maxTimer);
            ctx.save();
            ctx.translate(rf.x, rf.y);
            ctx.rotate(now * 2.5);
            ctx.fillStyle = 'rgba(192, 132, 252, 0.35)';
            ctx.strokeStyle = rf.isEvolved ? '#fef08a' : '#38bdf8';
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.arc(0, 0, 26 + (1 - t) * 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
        if (typeof HyperionSkillTreeTraits !== 'undefined') HyperionSkillTreeTraits.drawWorld(ctx);
    }

    static clear() {
        this._slashes.length = 0;
        this._waves.length = 0;
        this._rifts.length = 0;
        this._tethers.length = 0;
        this._orbitOwner = null;
        this._orbitTimer = 0;
        if (typeof HyperionSkillTreeTraits !== 'undefined') HyperionSkillTreeTraits.clear();
    }
}

if (typeof window !== 'undefined') window.HyperionCelestialGlaive = HyperionCelestialGlaive;
if (typeof module !== 'undefined' && module.exports) module.exports = { HyperionCelestialGlaive };
