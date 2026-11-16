/**
 * Lesa.io - Mount Olympus Summit Final Boss: Zeus the God of Thunder
 * Floor 5 Sovereign of the Gods:
 * - Divine Lightning Javelin (single/triple high-velocity bolts)
 * - Heavenly Thunderstorm (ground telegraphs with massive skyward lightning pillars)
 * - Olympian Wrath (Phase 2 at <= 50% HP with divine aura, speed boost & summon)
 * - Divine Repulse (anti-melee electric shockwave)
 * - Custom death sequence with divine ascension & thunder collapse
 */

class ZeusBoss extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0) {
        super(x, y, 'zeus', waveMultiplier);
        this.name = 'Zeus the God of Thunder';
        this.isBoss = true;
        this.bossRank = 'olympian';
        this.radius = 48;

        this.maxHp = Math.round(22000 * Math.max(1.0, waveMultiplier));
        this.hp = this.maxHp;
        this.baseSpeed = 2.75;
        this.speed = this.baseSpeed;
        this.damage = Math.round(56 * Math.max(1.0, waveMultiplier * 0.7));
        this.xpDrop = 1500;
        this.scoreValue = 6000;

        // Attack Cooldowns
        this.javelinTimer = 95;
        this.thunderstormTimer = 260;
        this.repulseCooldown = 175;
        this.minionSummoned = false;
        this.totalMinionsSpawned = 0;
        this.maxTotalMinionsSpawned = 10;

        // 80% HP Aerial Crystal Siege State (Ender-Dragon-style Sky Phase)
        this.aerialThresholdRatio = 0.80;
        this.aerialTriggered = false;
        this.isFlying = false;
        this.isAirborneImmune = false;
        this.flyHeight = 0; // 0 = ground hover, 1 = high storm-cloud altitude
        this.crystals = [];
        this.crystalTotalCount = 4;
        this.crystalsSpawned = false;
        this.aerialStrikeTimer = 55;
        this.aerialSpawnTimer = 270;
        this.descentRecoverTimer = 0;
        this._immuneFeedbackCooldown = 0;

        // Enrage State (Olympian Wrath at <= 50% HP)
        this.isEnraged = false;
        this.wrathFlashTimer = 0;

        // Heavenly Thunderstorm Telegraphs
        this.lightningStrikes = []; // { x, y, radius, timer, maxTimer, struck, fromSky }

        // Death Sequence
        this.isDying = false;
        this.deathTimer = 0;
        this.maxDeathTimer = 110;
    }

    getVisualLiftY() {
        return (this.flyHeight || 0) * 135 - Math.sin(this.age * 0.08) * 5;
    }

    applyStun(durationSeconds = 2.0, effects = null) {
        if (this.isFlying || this.isAirborneImmune) return;
        super.applyStun(durationSeconds, effects);
    }

    applyFear(durationSeconds = 3.0, effects = null) {
        if (this.isFlying || this.isAirborneImmune) return;
        super.applyFear(durationSeconds, effects);
    }

    takeDamage(amount, effects = null, fromCrit = null, playSound = true) {
        if (typeof ZeusSkyPhase !== 'undefined') {
            return ZeusSkyPhase.handleDamageGate(
                this, amount, effects, fromCrit, playSound,
                (a, fx, c, s) => super.takeDamage(a, fx, c, s)
            );
        }
        return super.takeDamage(amount, effects, fromCrit, playSound);
    }

    beginAerialAscent(effects = null) {
        if (typeof ZeusSkyPhase !== 'undefined') ZeusSkyPhase.enter(this, effects);
    }

    onCrystalDestroyed(crystal, effects = null) {
        if (!Array.isArray(this.crystals)) return;
        const alive = this.crystals.filter(c => c && !c.dead && c.hp > 0);
        if (this.isFlying && this.crystalsSpawned && alive.length === 0) this.descendFromSky(effects);
    }

    descendFromSky(effects = null) {
        if (typeof ZeusSkyPhase !== 'undefined') ZeusSkyPhase.exit(this, effects);
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        if (this.hitFlash > 0) this.hitFlash -= dt;
        if (this._immuneFeedbackCooldown > 0) this._immuneFeedbackCooldown = Math.max(0, this._immuneFeedbackCooldown - dt);

        // Smooth altitude animation between ground hover (0) and storm clouds (1)
        const targetFly = this.isFlying ? 1 : 0;
        if (this.flyHeight < targetFly) {
            this.flyHeight = Math.min(1, this.flyHeight + dt * 0.035);
        } else if (this.flyHeight > targetFly) {
            this.flyHeight = Math.max(0, this.flyHeight - dt * 0.045);
        }

        // 0. Death Sequence
        if (this.isDying) {
            this.deathTimer += dt;
            if (effects && Math.floor(this.deathTimer) % 6 === 0) {
                const rx = this.x + (Math.random() * 120 - 60);
                const ry = this.y + (Math.random() * 120 - 60);
                effects.addSparks(rx, ry, '#f1c40f', 8);
                effects.addSparks(rx, ry, '#00d2d3', 6);
                effects.addShockwave(rx, ry, 50 + Math.random() * 40, 'rgba(255, 215, 0, 0.8)');
            }
            if (this.deathTimer >= this.maxDeathTimer) {
                this.dead = true;
                if (typeof ZeusSkyPhase !== 'undefined') ZeusSkyPhase.banishSummonedForces(enemies, effects);
                if (effects) {
                    effects.addShockwave(this.x, this.y, 200, 'rgba(255, 255, 255, 0.95)');
                    effects.addConfetti(this.x, this.y, 160);
                    effects.addComicSplash(this.x, this.y - 60, '⚡ ZEUS VANQUISHED! ⚡');
                }
            }
            return;
        }

        // Trigger Death sequence at 0 HP
        if (this.hp <= 0 && !this.isDying) {
            this.isDying = true;
            this.isFlying = false;
            this.isAirborneImmune = false;
            this.deathTimer = 0;
            if (effects) {
                effects.addShockwave(this.x, this.y, 160, 'rgba(255, 215, 0, 0.95)');
                effects.addComicSplash(this.x, this.y - 50, '⚡ DIVINE ASCENSION! ⚡');
            }
            return;
        }

        if (!player || player.hp <= 0) return;

        if (!this.aerialTriggered && this.hp <= Math.ceil(this.maxHp * this.aerialThresholdRatio)) {
            this.hp = Math.ceil(this.maxHp * this.aerialThresholdRatio);
            this.beginAerialAscent(effects);
        }

        this.updateThunderstormStrikes(dt, player, effects);

        // Aerial Phase (Zeus flies invulnerable above while crystals remain)
        if (this.isFlying && typeof ZeusSkyPhase !== 'undefined') {
            if (ZeusSkyPhase.update(this, dt, player, enemies, bullets, effects, arena)) return;
        }

        if (this.descentRecoverTimer > 0) {
            this.descentRecoverTimer = Math.max(0, this.descentRecoverTimer - dt);
            return;
        }

        if (this.updateStun(dt, effects)) return;

        // Phase 2: Olympian Wrath Trigger (<= 50% HP once back on the ground)
        if (!this.isEnraged && this.hp <= this.maxHp * 0.5) {
            this.isEnraged = true;
            this.speed = this.baseSpeed * 1.35;
            this.wrathFlashTimer = 60;
            if (effects) {
                effects.addShockwave(this.x, this.y, 160, 'rgba(255, 215, 0, 0.95)');
                effects.addComicSplash(this.x, this.y - 50, '⚡ OLYMPIAN WRATH! ⚡');
            }
            // Summon guardian escorts (respecting Zeus total minion spawn cap)
            if (!this.minionSummoned && typeof IceGolem !== 'undefined' && typeof FrostWolf !== 'undefined') {
                this.minionSummoned = true;
                const remaining = Math.max(0, (this.maxTotalMinionsSpawned ?? 10) - (this.totalMinionsSpawned || 0));
                const escorts = [
                    new IceGolem(this.x - 90, this.y + 40, this.waveMultiplier),
                    new FrostWolf(this.x + 90, this.y - 40, this.waveMultiplier)
                ];
                for (let i = 0; i < Math.min(remaining, escorts.length); i++) {
                    escorts[i].spawnedByZeus = true;
                    enemies.push(escorts[i]);
                    this.totalMinionsSpawned = (this.totalMinionsSpawned || 0) + 1;
                }
            }
        }

        if (this.wrathFlashTimer > 0) this.wrathFlashTimer -= dt;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);

        // Movement: Hover smoothly towards player, keeping divine vantage
        const idealDist = this.isEnraged ? 220 : 280;
        if (dist > idealDist + 30) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        } else if (dist < idealDist - 40) {
            this.x -= (dx / dist) * this.speed * dt;
            this.y -= (dy / dist) * this.speed * dt;
        }
        this.applyArenaBounds(arena);

        // Ability 1: Lightning Bolt Javelin
        this.javelinTimer -= dt;
        if (this.javelinTimer <= 0) {
            this.javelinTimer = (this.isEnraged ? 60 : 90) + Math.random() * 25;
            this.fireLightningJavelins(bullets, effects);
        }

        // Ability 2: Heavenly Thunderstorm
        this.thunderstormTimer -= dt;
        if (this.thunderstormTimer <= 0) {
            this.thunderstormTimer = (this.isEnraged ? 195 : 270) + Math.random() * 40;
            this.summonThunderstorm(player, effects);
        }

        // Ability 3: Divine Repulse (anti-rush melee barrier)
        this.repulseCooldown -= dt;
        if (this.repulseCooldown <= 0 && dist < 140) {
            this.repulseCooldown = 215;
            this.executeDivineRepulse(player, effects);
        }
    }

    fireLightningJavelins(bullets, effects) {
        if (typeof Bullet === 'undefined') return;
        const spreadAngles = (this.isEnraged || this.isFlying) ? [-0.36, -0.18, 0, 0.18, 0.36] : [-0.14, 0, 0.14];
        const spawnY = this.y - (this.flyHeight || 0) * 60;

        for (let sa of spreadAngles) {
            const a = this.angle + sa;
            const b = new Bullet(this.x, spawnY, Math.cos(a) * 11.5, Math.sin(a) * 11.5, Math.round(this.damage * 0.95), 11.5, 11, 'lightning', true);
            b.color = '#f1c40f';
            bullets.push(b);
        }

        if (effects) {
            effects.addSparks(this.x, spawnY, '#f1c40f', 8);
            effects.addSparks(this.x, spawnY, '#00cec9', 6);
        }
    }

    summonAerialLightningBarrage(player, effects, arena = null) {
        if (typeof ZeusSkyPhase !== 'undefined') ZeusSkyPhase.summonLightningBarrage(this, player, effects, arena);
    }

    summonThunderstorm(player, effects) {
        if (effects) {
            effects.addComicSplash(this.x, this.y - 45, '⚡ THUNDERSTORM! ⚡');
            effects.addShockwave(this.x, this.y, 100, 'rgba(0, 206, 201, 0.8)');
        }
        const strikeCount = this.isEnraged ? 7 : 5;
        for (let i = 0; i < strikeCount; i++) {
            const angle = (i / strikeCount) * Math.PI * 2 + (Math.random() * 0.5);
            const r = 50 + Math.random() * 220;
            this.lightningStrikes.push({
                x: player.x + Math.cos(angle) * r,
                y: player.y + Math.sin(angle) * r,
                radius: 65,
                timer: 55,
                maxTimer: 55,
                struck: false,
                fromSky: false
            });
        }
    }

    updateThunderstormStrikes(dt, player, effects) {
        for (let i = this.lightningStrikes.length - 1; i >= 0; i--) {
            const strike = this.lightningStrikes[i];
            strike.timer -= dt;
            if (strike.timer <= 0 && !strike.struck) {
                strike.struck = true;
                if (effects) {
                    if (typeof effects.addLightningChain === 'function') {
                        const topX = strike.fromSky ? strike.x + (Math.random() - 0.5) * 38 : this.x;
                        const topY = strike.fromSky ? strike.y - 330 : this.y - this.getVisualLiftY();
                        effects.addLightningChain(topX, topY, strike.x, strike.y, strike.fromSky ? '#00f5ff' : '#fed330');
                    }
                    effects.addShockwave(strike.x, strike.y, strike.radius * 1.3, 'rgba(255, 215, 0, 0.95)');
                    effects.addSparks(strike.x, strike.y, '#00d2d3', 12);
                    effects.addSparks(strike.x, strike.y, '#ffffff', 8);
                }
                const distToPlayer = Math.hypot(player.x - strike.x, player.y - strike.y);
                if (distToPlayer <= strike.radius + player.radius) {
                    player.takeDamage(this.damage * 0.85, effects);
                }
                this.lightningStrikes.splice(i, 1);
            }
        }
    }

    executeDivineRepulse(player, effects) {
        if (effects) {
            effects.addShockwave(this.x, this.y, 140, 'rgba(255, 215, 0, 0.9)');
            effects.addComicSplash(this.x, this.y - 35, '⚡ BEGONE MORTAL!');
            if (typeof effects.onBossSlam === 'function') effects.onBossSlam(0.05);
        }
        player.takeDamage(this.damage * 0.6, effects);
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        player.x += (dx / dist) * 90;
        player.y += (dy / dist) * 90;
    }

    draw(ctx) {
        // 1. Draw Active Thunderstorm Warning Rings in World Space
        if (typeof BossTelegraphFX !== 'undefined') {
            BossTelegraphFX.drawZones(ctx, this.lightningStrikes, 'zeus_storm');
        } else {
            for (let strike of this.lightningStrikes) {
                ctx.save();
                const progress = 1 - (strike.timer / strike.maxTimer);
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.85)';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(strike.x, strike.y, strike.radius, 0, Math.PI * 2);
                ctx.stroke();

                // Expanding inner danger circle
                ctx.fillStyle = 'rgba(235, 77, 75, 0.28)';
                ctx.beginPath();
                ctx.arc(strike.x, strike.y, strike.radius * progress, 0, Math.PI * 2);
                ctx.fill();

                ctx.font = '800 12px "Luckiest Guy", cursive';
                ctx.fillStyle = '#f1c40f';
                ctx.textAlign = 'center';
                ctx.fillText('⚡', strike.x, strike.y + 4);
                ctx.restore();
            }
        }

        // 2. Draw Zeus 2.5D King of Olympus Model
        const r = this.radius || 48;
        const flash = this.hitFlash > 0;
        const facingLeft = Math.cos(this.angle || 0) < 0;
        const liftY = (this.flyHeight || 0) * 135;
        const hoverY = Math.sin(this.age * 0.08) * 5 - liftY;
        const wrathPulse = Math.sin(this.age * 0.16);
        const skyScale = 1 + (this.flyHeight || 0) * 0.12;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Swirling Storm Cloud Shadow underneath hovering feet (remains anchored on summit marble)
        ctx.fillStyle = this.isEnraged ? 'rgba(241, 196, 15, 0.25)' : 'rgba(15, 25, 45, 0.36)';
        ctx.beginPath();
        ctx.ellipse(0, r * 0.92, r * 1.15, r * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
        for (let c = -2; c <= 2; c++) {
            ctx.fillStyle = this.isEnraged ? 'rgba(255, 215, 0, 0.28)' : 'rgba(200, 225, 255, 0.25)';
            ctx.beginPath();
            ctx.arc(c * 14 + Math.sin(this.age * 0.07 + c) * 4, r * 0.85, 11, 0, Math.PI * 2);
            ctx.fill();
        }
        if (typeof ZeusSkyPhase !== 'undefined') ZeusSkyPhase.drawZeusSkyEffects(ctx, this, hoverY, r);

        // Divine Aura Ring
        ctx.fillStyle = this.isEnraged ? 'rgba(255, 215, 0, 0.28)' : 'rgba(0, 206, 201, 0.16)';
        ctx.beginPath();
        ctx.arc(0, hoverY, (r + 14) * skyScale + wrathPulse * 4, 0, Math.PI * 2);
        ctx.fill();

        if (this.isDying) {
            ctx.globalAlpha = Math.max(0.25, 1 - (this.deathTimer / this.maxDeathTimer) * 0.75);
            ctx.translate((Math.random() - 0.5) * 6, -this.deathTimer * 0.35);
        }

        ctx.translate(0, hoverY);
        if (skyScale !== 1) ctx.scale(skyScale, skyScale);
        if (facingLeft) ctx.scale(-1, 1);

        ctx.lineWidth = 2.8;
        ctx.strokeStyle = '#14141c';

        // Flowing Royal Olympian Mantle Cape
        ctx.fillStyle = flash ? '#ffffff' : (this.isEnraged ? '#c0392b' : '#2c3e8c');
        ctx.beginPath();
        ctx.moveTo(-r * 0.42, -r * 0.36);
        ctx.lineTo(-r * 1.02, r * 0.46 + wrathPulse * 3);
        ctx.lineTo(-r * 0.15, r * 0.74);
        ctx.lineTo(r * 0.45, r * 0.48);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Ivory Pleated Greek Toga Skirt & Sandals
        ctx.fillStyle = flash ? '#ffffff' : '#f5f6fa';
        ctx.beginPath();
        ctx.moveTo(-r * 0.46, r * 0.15);
        ctx.lineTo(r * 0.46, r * 0.15);
        ctx.lineTo(r * 0.54, r * 0.72);
        ctx.lineTo(-r * 0.54, r * 0.72);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Golden Bronze Breastplate & Toga Sash
        ctx.fillStyle = flash ? '#ffffff' : '#f1c40f';
        ctx.beginPath();
        ctx.roundRect(-r * 0.54, -r * 0.4, r * 1.08, r * 0.68, [10, 10, 5, 5]);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-r * 0.5, -r * 0.38);
        ctx.lineTo(-r * 0.18, -r * 0.42);
        ctx.lineTo(r * 0.52, r * 0.24);
        ctx.lineTo(r * 0.22, r * 0.28);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Sculpted Head, Silver Hair Crown, Clear Eyes & Majestic Beard
        ctx.save();
        ctx.translate(0, -r * 0.74);
        ctx.fillStyle = flash ? '#ffffff' : '#e6b08a';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.36, r * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Silver-White Top Hair Crest above Forehead
        ctx.fillStyle = flash ? '#ffffff' : '#f1f2f6';
        ctx.beginPath();
        ctx.arc(0, -r * 0.22, r * 0.35, Math.PI * 0.96, Math.PI * 2.04);
        ctx.quadraticCurveTo(r * 0.16, -r * 0.12, 0, -r * 0.18);
        ctx.quadraticCurveTo(-r * 0.16, -r * 0.12, -r * 0.35, -r * 0.22);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Golden Laurel Wreath Crown along Browline
        ctx.strokeStyle = flash ? '#ffffff' : '#f39c12';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.arc(0, -r * 0.20, r * 0.37, Math.PI * 1.10, Math.PI * 1.90);
        ctx.stroke();

        if (!flash) {
            // Stern silver eyebrows & bright lightning eyes
            ctx.strokeStyle = '#dfe6e9';
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.moveTo(-10, -6);
            ctx.lineTo(-2, -4);
            ctx.moveTo(4, -4);
            ctx.lineTo(12, -6);
            ctx.stroke();

            ctx.fillStyle = this.isEnraged ? '#fff200' : '#00f5ff';
            ctx.shadowColor = this.isEnraged ? '#f1c40f' : '#00d2d3';
            ctx.shadowBlur = 9;
            ctx.beginPath();
            ctx.arc(-5, -2, 3.1, 0, Math.PI * 2);
            ctx.arc(7, -2, 3.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Flowing Silver Mustache & Sculpted Olympian Beard (starts cleanly below eyes)
        ctx.fillStyle = flash ? '#ffffff' : '#f1f2f6';
        ctx.strokeStyle = '#14141c';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(-r * 0.32, 4);
        ctx.quadraticCurveTo(0, 1, r * 0.32, 4);
        ctx.lineTo(r * 0.22, 24);
        ctx.lineTo(0, 32);
        ctx.lineTo(-r * 0.22, 24);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Crackling Golden Master Thunderbolt Spear in Hand
        ctx.save();
        ctx.translate(r * 0.66, -r * 0.08);
        ctx.rotate(0.28 + Math.sin(this.age * 0.14) * 0.08);
        ctx.fillStyle = flash ? '#ffffff' : '#e6b08a';
        ctx.strokeStyle = '#14141c';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(0, 8, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#ffeaa7';
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#f1c40f';
        ctx.shadowBlur = this.isEnraged ? 14 : 7;
        ctx.beginPath();
        ctx.moveTo(0, 26);
        ctx.lineTo(-6, 8);
        ctx.lineTo(4, 5);
        ctx.lineTo(-5, -18);
        ctx.lineTo(8, -22);
        ctx.lineTo(0, -44);
        ctx.lineTo(13, -18);
        ctx.lineTo(1, -15);
        ctx.lineTo(11, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();

        ctx.restore();

        // Overhead Boss Status Bar
        this.drawZeusHUD(ctx);
    }

    drawZeusHUD(ctx) {
        const liftY = (this.flyHeight || 0) * 135;
        const hudY = this.y - liftY - (this.radius + 36);
        const w = 104;
        const h = 9;
        const hpR = Math.max(0, Math.min(1, this.hp / Math.max(1, this.maxHp)));

        ctx.save();
        ctx.textAlign = 'center';
        if (this.isAirborneImmune) {
            const alive = Array.isArray(this.crystals) ? this.crystals.filter(c => c && !c.dead && c.hp > 0).length : 0;
            ctx.font = '900 12px "Lilita One", cursive, sans-serif';
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = '#101014';
            const badge = `🛡️ SKY SHIELD (CRYSTALS: ${alive}/${this.crystalTotalCount || 4})`;
            ctx.strokeText(badge, this.x, hudY - 24);
            ctx.fillStyle = '#70f8ff';
            ctx.fillText(badge, this.x, hudY - 24);
        }

        ctx.font = '900 14px "Lilita One", cursive, sans-serif';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#101014';
        ctx.strokeText(this.name, this.x, hudY - 5);
        ctx.fillStyle = this.isAirborneImmune ? '#70f8ff' : '#f1c40f';
        ctx.fillText(this.name, this.x, hudY - 5);

        ctx.fillStyle = '#1e272e';
        ctx.fillRect(this.x - w / 2, hudY, w, h);
        ctx.fillStyle = this.isAirborneImmune ? '#00f5ff' : (this.isEnraged ? '#e74c3c' : '#f1c40f');
        ctx.fillRect(this.x - w / 2, hudY, w * hpR, h);

        // 80% Sky Gate Marker while waiting to ascend
        if (!this.aerialTriggered) {
            const gateX = this.x - w / 2 + w * (this.aerialThresholdRatio || 0.8);
            ctx.fillStyle = '#00f5ff';
            ctx.fillRect(gateX - 1, hudY - 1, 2, h + 2);
        }

        ctx.strokeStyle = this.isAirborneImmune ? '#70f8ff' : '#f39c12';
        ctx.lineWidth = 1.6;
        ctx.strokeRect(this.x - w / 2, hudY, w, h);
        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.ZeusBoss = ZeusBoss;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ZeusBoss };
}
