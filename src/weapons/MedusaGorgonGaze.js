/**
 * Lesa.io - Exotic Serpent-Crystal Weapon: Medusa's Gorgon Gaze (Dev Exclusive)
 * Animated living serpent bio-crystal rifle with hovering Gorgon Eye & rotating rune halo.
 * - Primary: Fires slithering Serpent-Eye Plasma Bolts that weave forward (+18% Crit, +4 Pierce).
 * - Stone Curse (1–3 stacks): Slows foes and turns targets into Petrified Stone Statues at 3 stacks.
 * - Exotic Special (Chain Petrify Nova): Shattering a petrified statue deals 1.35x burst + 175px Jade
 *   Chain Nova that spreads Stone Curse (+2 stacks / instant Petrify ★) to 3 nearby foes, spawns
 *   4 bouncing Jade Shards & 3 Spectral Serpents, and restores +2 HP!
 * - Awakened ★ Evolution: Every 4th shot unleashes a 130° Gorgon Stare Cone that petrifies in AoE!
 */

class MedusaGorgonGaze extends WeaponBase {
    static _tracked = new Set();
    static _cones = [];

    constructor() {
        super({
            id: 'medusa_gaze',
            name: "Medusa's Gorgon Gaze",
            type: 'medusa_gaze',
            rarity: 'Exotic',
            hero: null,
            baseDelay: 15,
            baseDamage: 44,
            radius: 10,
            extraPierce: 4,
            maxBounces: 0,
            speedMultiplier: 1.58,
            critChanceBonus: 0.18,
            range: 1040,
            stareEveryNShots: 4,
            color: '#00cec9',
            icon: 'assets/WeaponIcons/MedusasGorgonGaze.png',
            description: 'Exotic bio-crystal serpent rifle. Fires weaving viper bolts that petrify foes, shatter into homing snakes, and erupt in a Chain Petrify Nova.',
            stats: {
                damage: '44 Gorgon Plasma',
                fireRate: 'Fast (0.25s)',
                pierce: '+4 Pierces & +18% Crit',
                special: 'Exotic Chain Petrify Nova'
            }
        });
    }

    /**
     * Render Animated 2.5D Gilded Serpent Rifle + Slithering Vipers + Rotating Halo + Living Gorgon Eye (x: -14 .. +48)
     */
    static drawWeapon(ctx, flash, recoil = 0, isEvolved = false) {
        ctx.save();
        ctx.translate(5 - recoil * 0.3, 0);
        const ink = '#101815';
        const now = typeof performance !== 'undefined' ? performance.now() * 0.008 : 0;
        const eyePulse = 0.88 + Math.sin(now * 1.4) * 0.14;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // 1. Sculpted Emerald-Obsidian Stock & Gold Buttplate
        ctx.fillStyle = flash ? '#ffffff' : '#1b3b2b';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        ctx.moveTo(-14.5, -4.4);
        ctx.lineTo(-2.5, -4.0);
        ctx.lineTo(-2.5, 3.2);
        ctx.lineTo(-12.0, 6.8);
        ctx.lineTo(-15.5, 4.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Serpent Scale Grip
        ctx.fillStyle = flash ? '#ffffff' : '#0f291e';
        ctx.beginPath();
        ctx.moveTo(-1.0, 2.6);
        ctx.lineTo(4.0, 2.6);
        ctx.lineTo(1.8, 10.8);
        ctx.lineTo(-2.8, 9.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 2. Main Jade-Obsidian & Antique Gold Chassis
        const recGrad = ctx.createLinearGradient(0, -6.0, 0, 5.2);
        recGrad.addColorStop(0, flash ? '#ffffff' : '#2ed573');
        recGrad.addColorStop(0.45, flash ? '#f1f2f6' : '#14532d');
        recGrad.addColorStop(1, flash ? '#dfe4ea' : '#092316');
        ctx.fillStyle = recGrad;
        ctx.beginPath();
        ctx.roundRect(-3.8, -5.4, 26.5, 9.8, 2.2);
        ctx.fill();
        ctx.stroke();

        // Twin Gilded Serpent Fang Barrel Prongs framing the Hovering Gorgon Eye (x: 21..45)
        ctx.fillStyle = flash ? '#ffffff' : (isEvolved ? '#fef08a' : '#d4af37');
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.7;
        // Upper Fang Prong
        ctx.beginPath();
        ctx.moveTo(20.5, -5.8);
        ctx.lineTo(43.5, -4.8);
        ctx.lineTo(46.5, -1.8);
        ctx.lineTo(40.0, -2.0);
        ctx.lineTo(20.5, -2.4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Lower Fang Prong
        ctx.beginPath();
        ctx.moveTo(20.5, 5.4);
        ctx.lineTo(42.5, 4.5);
        ctx.lineTo(45.5, 1.8);
        ctx.lineTo(39.0, 1.9);
        ctx.lineTo(20.5, 2.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            // 3. Three Animated Slithering Golden-Jade Serpents Coiling Along Top & Side
            for (let s = 0; s < 3; s++) {
                const waveY = Math.sin(now * 1.5 + s * 2.1) * 1.8;
                const baseX = 2.0 + s * 6.5;
                ctx.strokeStyle = s % 2 === 0 ? '#fed330' : '#4ade80';
                ctx.lineWidth = 2.1;
                ctx.beginPath();
                ctx.moveTo(baseX - 4, 1.5);
                ctx.quadraticCurveTo(baseX, -7.2 + waveY, baseX + 5.5, -7.8 - waveY * 0.6);
                ctx.stroke();

                // Tiny Serpent Head Crest + Flickering Forked Tongue
                const hx = baseX + 6.2;
                const hy = -7.8 - waveY * 0.6;
                ctx.fillStyle = '#fed330';
                ctx.strokeStyle = ink;
                ctx.lineWidth = 1.1;
                ctx.beginPath();
                ctx.ellipse(hx, hy, 2.4, 1.4, -0.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.strokeStyle = '#ff4757';
                ctx.lineWidth = 0.9;
                ctx.beginPath();
                ctx.moveTo(hx + 2.2, hy);
                ctx.lineTo(hx + 4.4, hy + Math.sin(now * 3.0 + s) * 0.9);
                ctx.stroke();
            }

            // 4. Rotating Rune Halo + Floating Living Gorgon Eye Crystal (x: 33, y: 0)
            const ex = 33.5;
            ctx.save();
            ctx.translate(ex, 0);
            ctx.rotate(now * 0.7);
            ctx.strokeStyle = isEvolved ? '#fef08a' : '#2ed573';
            ctx.lineWidth = 1.35;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.arc(0, 0, 7.8 * eyePulse, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            // Outer Emerald Aura
            ctx.fillStyle = isEvolved ? 'rgba(254, 240, 138, 0.38)' : 'rgba(46, 213, 115, 0.34)';
            ctx.beginPath();
            ctx.arc(ex, 0, 7.2 * eyePulse, 0, Math.PI * 2);
            ctx.fill();

            // Glowing Gorgon Eye Sclera + Viper Vertical Slit Pupil
            const eGrad = ctx.createRadialGradient(ex - 0.8, -0.8, 0.4, ex, 0, 4.8);
            eGrad.addColorStop(0, '#ffffff');
            eGrad.addColorStop(0.5, isEvolved ? '#fed330' : '#4ade80');
            eGrad.addColorStop(1, '#047857');
            ctx.fillStyle = eGrad;
            ctx.strokeStyle = ink;
            ctx.lineWidth = 1.25;
            ctx.beginPath();
            ctx.arc(ex, 0, 4.4 * eyePulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Vertical Slit Pupil
            ctx.fillStyle = '#09150f';
            ctx.beginPath();
            ctx.ellipse(ex, 0, 1.05, 3.2 * eyePulse, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * Custom Weaving Serpent-Eye Flight & Homing Spectral Serpents
     */
    static updateBullet(b, dt, effects, arena) {
        if (b.type === 'medusa_gaze') {
            if (b._baseVx === undefined) {
                b._baseVx = b.vx;
                b._baseVy = b.vy;
                b._baseAng = Math.atan2(b.vy, b.vx);
                b._wavePhase = (b._wavePhase || 0);
            }
            const t = (b.age || 0) * 0.36 + b._wavePhase;
            const perpX = -Math.sin(b._baseAng);
            const perpY = Math.cos(b._baseAng);
            const waveVel = Math.cos(t) * 3.8;
            const stepX = (b._baseVx + perpX * waveVel) * dt;
            const stepY = (b._baseVy + perpY * waveVel) * dt;
            b.x += stepX;
            b.y += stepY;
            b.rotation = Math.atan2(b._baseVy + perpY * waveVel, b._baseVx + perpX * waveVel);
            b.distanceTraveled += Math.hypot(stepX, stepY);
            if (Math.random() < 0.35 && effects && typeof effects.addSparks === 'function') {
                effects.addSparks(b.x, b.y, b.isWeaponEvolved ? '#fed330' : '#4ade80', 1);
            }
            if (b.distanceTraveled >= b.maxRange) {
                b.explode(effects);
                b.dead = true;
            }
            return true;
        }

        if (b.type === 'medusa_serpent') {
            const g = (typeof window !== 'undefined') ? window.gameInstance : null;
            if (g && Array.isArray(g.enemies)) {
                let best = null;
                let bestDistSq = 360 * 360;
                const pickSerpent = (e) => {
                    if (!e || e.dead || e.isDying || (b.hitEntities && b.hitEntities.has(e))) return;
                    const dx = e.x - b.x, dy = e.y - b.y, d2 = dx * dx + dy * dy;
                    if (d2 < bestDistSq) { bestDistSq = d2; best = e; }
                };
                if (typeof SpatialHashGrid !== 'undefined' && g.enemies.length > 30) SpatialHashGrid.forEachEnemyNear(b.x, b.y, 360, g.enemies, pickSerpent);
                else for (let i = 0; i < g.enemies.length; i++) pickSerpent(g.enemies[i]);
                if (best) {
                    const desired = Math.atan2(best.y - b.y, best.x - b.x);
                    const cur = Math.atan2(b.vy, b.vx);
                    let diff = desired - cur;
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    while (diff < -Math.PI) diff += Math.PI * 2;
                    const nextAng = cur + Math.max(-0.14 * dt, Math.min(0.14 * dt, diff));
                    const spd = b.speed || 13;
                    b.vx = Math.cos(nextAng) * spd;
                    b.vy = Math.sin(nextAng) * spd;
                }
            }
            return false; // let Bullet advance x/y, trail, and arena bounds normally
        }

        return false;
    }

    /**
     * Render Weaving Viper-Eye Bolt, Spectral Homing Serpent, or Spinning Stone Shard
     */
    static drawBullet(ctx, b) {
        const ink = '#09150f';
        const now = typeof performance !== 'undefined' ? performance.now() * 0.015 : 0;
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        if (b.type === 'medusa_shard') {
            const r = b.radius || 7;
            ctx.rotate(now + (b.age || 0) * 0.35);
            ctx.fillStyle = '#6ee7b7';
            ctx.strokeStyle = ink;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(r * 1.1, 0);
            ctx.lineTo(-r * 0.4, -r * 0.72);
            ctx.lineTo(-r * 0.95, 0.25 * r);
            ctx.lineTo(0, r * 0.65);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (b.type === 'medusa_serpent') {
            const r = b.radius || 8;
            ctx.fillStyle = 'rgba(46, 213, 115, 0.35)';
            ctx.beginPath();
            ctx.ellipse(0, 0, r * 1.8, r * 0.72, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#4ade80';
            ctx.strokeStyle = ink;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(r * 1.45, 0);
            ctx.lineTo(r * 0.1, -r * 0.52);
            ctx.lineTo(-r * 1.35, -r * 0.2);
            ctx.lineTo(-r * 1.35, r * 0.2);
            ctx.lineTo(r * 0.1, r * 0.52);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#fed330';
            ctx.beginPath();
            ctx.arc(r * 0.45, -r * 0.16, 1.5, 0, Math.PI * 2);
            ctx.arc(r * 0.45, r * 0.16, 1.5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            const r = b.radius || 10;
            const isEvo = !!b.isWeaponEvolved;
            ctx.fillStyle = isEvo ? 'rgba(254, 211, 48, 0.35)' : 'rgba(46, 213, 115, 0.34)';
            ctx.beginPath();
            ctx.ellipse(0, 0, r * 1.85, r * 0.76, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = isEvo ? '#fed330' : '#2ed573';
            ctx.strokeStyle = ink;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(r * 1.55, 0);
            ctx.lineTo(r * 0.1, -r * 0.58);
            ctx.lineTo(-r * 1.3, -r * 0.28);
            ctx.lineTo(-r * 0.85, 0);
            ctx.lineTo(-r * 1.3, r * 0.28);
            ctx.lineTo(r * 0.1, r * 0.58);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Glowing Viper Eye Center
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(r * 0.2, 0, r * 0.28, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#09150f';
            ctx.fillRect(r * 0.16, -r * 0.22, r * 0.09, r * 0.44);
        }
        ctx.restore();
    }

    /**
     * Awakened ★ 4th-Shot 130° Gorgon Stare Cone Flash
     */
    static fireStareCone(player, aimAngle, baseDmg, effects, game) {
        if (!player) return;
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        const radius = 290;
        const halfSpread = 1.13; // ~130 deg total cone
        this._cones.push({
            x: player.x + Math.cos(aimAngle) * 38,
            y: (player.y - (player.radius || 25) * 0.32) + Math.sin(aimAngle) * 38,
            angle: aimAngle, radius, halfSpread, timer: 18, maxTimer: 18
        });
        if (this._cones.length > 5) this._cones.shift();

        if (effects) {
            effects.addShockwave(player.x, player.y, 105, 'rgba(46, 213, 115, 0.88)');
            effects.addComicSplash(player.x, player.y - 44, '🐍 GORGON STARE!', '#4ade80', 22, true);
        }

        const enemies = g && Array.isArray(g.enemies) ? g.enemies : null;
        if (!enemies || (g && g.isCoopGuest)) return;
        const dmg = Math.max(24, Math.round(baseDmg * 1.2));
        const visitStare = (e) => {
            if (!e || e.dead || e.isDying || e.isAirborneImmune) return;
            const dx = e.x - player.x, dy = e.y - player.y;
            if (Math.hypot(dx, dy) > radius + (e.radius || 22)) return;
            let diff = Math.atan2(dy, dx) - aimAngle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            if (Math.abs(diff) <= halfSpread) {
                if (typeof e.takeDamage === 'function') e.takeDamage(dmg, effects, true, true);
                this._applyPetrify(e, effects);
            }
        };
        if (typeof SpatialHashGrid !== 'undefined') SpatialHashGrid.forEachEnemyNear(player.x, player.y, radius, enemies, visitStare);
        else for (let i = 0; i < enemies.length; i++) visitStare(enemies[i]);
    }

    static _applyPetrify(e, effects) {
        if (!e || e.dead) return;
        e._medusaStacks = 0;
        e._medusaDecay = 0;
        if (e.isBoss || e.isMiniBoss || e.isStationary) return;
        const dur = 125;
        e._medusaPetrifiedTimer = dur;
        e._medusaPetrifiedMax = dur;
        e.stunTimer = Math.max(e.stunTimer || 0, dur);
        e.vx = 0;
        e.vy = 0;
        this._tracked.add(e);
        if (effects) {
            effects.addShockwave(e.x, e.y, (e.radius || 22) + 34, 'rgba(110, 231, 183, 0.85)');
            effects.addComicSplash(e.x, e.y - 24, '🪨 PETRIFIED!', '#6ee7b7', 22);
        }
    }

    static _triggerExoticChainNova(srcEnemy, baseDmg, isEvo, game, effects) {
        const enemies = game && Array.isArray(game.enemies) ? game.enemies : null;
        if (effects) effects.addShockwave(srcEnemy.x, srcEnemy.y, 175, 'rgba(0, 206, 201, 0.72)');
        if (!enemies || (game && game.isCoopGuest)) return;
        const rMax = 175, novaDmg = Math.max(18, Math.round(baseDmg * 0.65));
        let chained = 0;
        const hitNear = (other) => {
            if (chained >= 3 || !other || other === srcEnemy || other.dead || other.isDying || other.isAirborneImmune) return;
            if (Math.hypot(other.x - srcEnemy.x, other.y - srcEnemy.y) > rMax + (other.radius || 22)) return;
            chained++;
            if (typeof other.takeDamage === 'function') other.takeDamage(novaDmg, effects, true, true);
            this._tracked.add(other);
            other._medusaStacks = (other._medusaStacks || 0) + (isEvo ? 3 : 2);
            other._medusaDecay = 220;
            if (other._medusaStacks >= 3 && !(other._medusaPetrifiedTimer > 0)) this._applyPetrify(other, effects);
        };
        if (typeof SpatialHashGrid !== 'undefined') SpatialHashGrid.forEachEnemyNear(srcEnemy.x, srcEnemy.y, rMax, enemies, hitNear);
        else for (let i = 0; i < enemies.length; i++) hitNear(enemies[i]);
    }

    /**
     * Stack Stone Curse -> Petrify Statue -> Shatter + Exotic Chain Petrify Nova
     */
    static onHit(b, e, finalDmg, enemies, effects, game) {
        if (!b || !e) return;
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        const isGuest = !!(g && g.isCoopGuest);

        if (b.type === 'medusa_gaze' && e._medusaPetrifiedTimer > 0) {
            e._medusaPetrifiedTimer = 0;
            this._tracked.delete(e);
            const shatterDmg = Math.max(30, Math.round(finalDmg * 1.35));
            if (!isGuest && !e.dead && typeof e.takeDamage === 'function') {
                e.takeDamage(shatterDmg, effects, true, true);
            }
            if (!isGuest && b.shooter && b.shooter.hp > 0 && b.shooter.maxHp > 0 && b.shooter.hp < b.shooter.maxHp) {
                b.shooter.hp = Math.min(b.shooter.maxHp, b.shooter.hp + 2);
            }
            if (effects) {
                effects.addShockwave(e.x, e.y, (e.radius || 22) + 108, 'rgba(0, 206, 201, 0.92)');
                effects.addSparks(e.x, e.y, '#6ee7b7', 10);
                effects.addSparks(e.x, e.y, '#fed330', 6);
                effects.addComicSplash(e.x, e.y - 28, `🐍 EXOTIC SHATTER! ${shatterDmg}`, '#00cec9', 26, true);
            }
            this._triggerExoticChainNova(e, finalDmg, !!b.isWeaponEvolved, g, effects);
            if (!isGuest && typeof Bullet !== 'undefined' && g && Array.isArray(g.bullets)) {
                for (let k = 0; k < 4; k++) {
                    const ang = Math.random() * Math.PI * 2;
                    g.bullets.push(new Bullet({
                        x: e.x, y: e.y, vx: Math.cos(ang) * 14.5, vy: Math.sin(ang) * 14.5,
                        damage: Math.round(finalDmg * 0.60), speed: 14.5, radius: 7,
                        type: 'medusa_shard', isEnemy: false, pierce: 2, maxBounces: 2,
                        range: 360, shooter: b.shooter
                    }));
                }
                for (const offset of [-0.6, 0, 0.6]) {
                    const sang = (b.rotation || 0) + offset;
                    g.bullets.push(new Bullet({
                        x: e.x, y: e.y, vx: Math.cos(sang) * 13.5, vy: Math.sin(sang) * 13.5,
                        damage: Math.round(finalDmg * 0.78), speed: 13.5, radius: 8,
                        type: 'medusa_serpent', isEnemy: false, pierce: 2, maxBounces: 0,
                        range: 560, shooter: b.shooter
                    }));
                }
            }
            return;
        }

        if (b.type === 'medusa_gaze') {
            this._tracked.add(e);
            if (typeof e.applySonicSlow === 'function') e.applySonicSlow(1.8, 0.55, effects);
            e._medusaStacks = (e._medusaStacks || 0) + 1;
            e._medusaDecay = 220;
            if (e._medusaStacks >= 3) {
                this._applyPetrify(e, effects);
            } else if (effects) {
                effects.addSparks(e.x, e.y, '#4ade80', 4);
            }
        }
    }

    static update(dt = 1) {
        for (let i = this._cones.length - 1; i >= 0; i--) {
            this._cones[i].timer -= dt;
            if (this._cones[i].timer <= 0) this._cones.splice(i, 1);
        }
        if (this._tracked.size === 0) return;
        for (const e of this._tracked) {
            if (!e || e.dead) { this._tracked.delete(e); continue; }
            if (e._medusaPetrifiedTimer > 0) {
                if (e.isBoss || e.isMiniBoss || e.isStationary) {
                    e._medusaPetrifiedTimer = 0;
                    this._tracked.delete(e);
                    continue;
                }
                e._medusaPetrifiedTimer -= dt;
                e.vx = 0;
                e.vy = 0;
                if (e._medusaPetrifiedTimer <= 0) {
                    e._medusaPetrifiedTimer = 0;
                    this._tracked.delete(e);
                }
            } else if (e._medusaStacks > 0) {
                e._medusaDecay = (e._medusaDecay || 0) - dt;
                if (e._medusaDecay <= 0) {
                    e._medusaStacks = 0;
                    this._tracked.delete(e);
                }
            } else {
                this._tracked.delete(e);
            }
        }
    }

    static drawWorld(ctx, cam) {
        if (!ctx) return;
        for (let i = 0; i < this._cones.length; i++) {
            const c = this._cones[i];
            const t = Math.max(0, c.timer / c.maxTimer);
            ctx.save();
            ctx.globalAlpha = t * 0.42;
            ctx.fillStyle = '#4ade80';
            ctx.beginPath();
            ctx.moveTo(c.x, c.y);
            ctx.arc(c.x, c.y, c.radius * (1.05 - t * 0.15), c.angle - c.halfSpread, c.angle + c.halfSpread);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
        for (const e of this._tracked) {
            if (!e || e.dead) continue;
            const r = (e.radius || 22) + 5;
            if (cam && typeof cam.isVisible === 'function' && !cam.isVisible(e.x, e.y, r + 15)) continue;
            ctx.save();
            ctx.translate(e.x, e.y);
            if (e._medusaPetrifiedTimer > 0) {
                ctx.fillStyle = 'rgba(110, 231, 183, 0.36)';
                ctx.strokeStyle = '#065f46';
                ctx.lineWidth = 2.6;
                ctx.beginPath();
                for (let k = 0; k < 6; k++) {
                    const a = (k / 6) * Math.PI * 2;
                    const px = Math.cos(a) * r;
                    const py = Math.sin(a) * r;
                    if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else if (e._medusaStacks > 0) {
                for (let s = 0; s < e._medusaStacks; s++) {
                    const sa = -Math.PI * 0.5 + (s - 0.5) * 0.6;
                    ctx.fillStyle = '#4ade80';
                    ctx.strokeStyle = '#09150f';
                    ctx.lineWidth = 1.4;
                    ctx.beginPath();
                    ctx.arc(Math.cos(sa) * (r + 5), Math.sin(sa) * (r + 5), 3.2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }
            }
            ctx.restore();
        }
    }

    static clear() {
        this._tracked.clear();
        this._cones.length = 0;
    }
}

if (typeof window !== 'undefined') window.MedusaGorgonGaze = MedusaGorgonGaze;
if (typeof module !== 'undefined' && module.exports) module.exports = { MedusaGorgonGaze };
