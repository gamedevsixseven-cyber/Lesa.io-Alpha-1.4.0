/**
 * Lesa.io - Boss Subsystem: Kleanthis Boss Entity
 * Wave 10 Epic Boss with 3 Forms:
 * 1. Normal: Walks, holds wine bottle, drinks every 10s to fill Drunk Meter
 * 2. Drunk (100% Bar): +30% HP boost & heal, stat buffs, Flying Karate Kick (heavy dmg + 3s Stun)
 * 3. Rage (<= 50% HP): Blazing red aura, +40% speed, +35% damage, Wine Bottle Shatter Volley
 */

class Kleanthis extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0) {
        super(x, y, 'kleanthis', waveMultiplier);
        this.name = 'Kleanthis';
        this.isBoss = true;
        this.bossRank = 'normal';
        this.crateAwarded = false;
        this.radius = 44; // Epic boss scale

        // Health Scaling (Buffed to massive boss HP pool: 3,500 base)
        this.baseMaxHp = Math.round(3500 * Math.max(1.0, waveMultiplier));
        this.maxHp = this.baseMaxHp;
        this.hp = this.maxHp;

        this.baseSpeed = 2.4;
        this.speed = this.baseSpeed;
        this.baseDamage = 32;
        this.damage = this.baseDamage;
        this.xpDrop = 500;

        // Front/Back high-res character textures
        this.frontSpriteSrc = 'assets/HeroesIcons/KleanthisFront.png';
        this.backSpriteSrc = 'assets/HeroesIcons/KleanthisBack.png';

        if (typeof window !== 'undefined' && window.CharacterSprites) {
            window.CharacterSprites.get(this.frontSpriteSrc);
            window.CharacterSprites.get(this.backSpriteSrc);
        }

        // --- 3 FORMS STATE MACHINE ---
        // 'NORMAL' -> 'DRUNK' (at 100% Drunk Meter) -> 'RAGE' (at <= 50% HP)
        this.isDrunk = false;
        this.isRageMode = false;
        this.rageTriggered = false;

        // Death Sequence State
        this.isDying = false;
        this.deathTimer = 0;
        this.maxDeathTimer = 100;

        // --- DRINKING MECHANIC & DRUNK METER ---
        this.drunkMeter = 0; // 0 to 100
        this.drinkCooldown = 480; // Reduced from 10s to 8.0 seconds (480 frames @ 60fps)
        this.drinkTimer = 0;
        this.isDrinking = false;

        // --- MINION SUMMONING (Every 10 seconds close to him) ---
        this.summonTimer = 600; // 10 seconds

        // --- ABILITY 1: FLYING KARATE KICK (Unlocked in Drunk Mode) ---
        this.karateKickTimer = 220; // Starts countdown after becoming Drunk
        this.kickState = 'IDLE'; // 'IDLE' | 'WINDUP' | 'LEAP' | 'LAND'
        this.kickWindupTimer = 0;
        this.jumpHeight = 0;
        this.jumpVelocity = 0;
        this.targetX = 0;
        this.targetY = 0;

        // --- ABILITY 2: WINE BOTTLE SHATTER VOLLEY (Buffed red projectiles) ---
        this.shatterVolleyTimer = 180;
        this.spawnShouted = false;
        this.shoutTimer = 350; // Periodic shout timer
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        if (this.hitFlash > 0) this.hitFlash -= dt;

        // 0. Handle Death Sequence
        if (this.isDying) {
            this.updateDeathSequence(dt, enemies, effects);
            return;
        }

        if (!player || player.hp <= 0) return;

        // 1. Check Half-Health Rage Mode Trigger
        if (!this.rageTriggered && this.hp <= this.maxHp * 0.5) {
            this.triggerRageMode(effects);
        }

        // Spawn Shout & Battle Cry
        if (!this.spawnShouted) {
            this.spawnShouted = true;
            if (effects) {
                effects.addComicSplash(this.x, this.y - 50, 'ELA NA SOU PW RE! 🍷');
            }
        }

        this.shoutTimer -= dt;
        if (this.shoutTimer <= 0) {
            this.shoutTimer = 620; // Periodic shout every ~10s
            if (effects) {
                effects.addComicSplash(this.x, this.y - 50, 'ELA NA SOU PW RE! 💢');
            }
        }

        // 2. Active Action Handling (Drinking / Karate Kick Leap)
        if (this.isDrinking) {
            this.updateDrinking(dt, effects);
            return;
        }

        if (this.kickState !== 'IDLE') {
            this.updateKarateKick(dt, player, effects);
            return;
        }

        // 3. Normal State Movement & Cooldowns
        const pdx = player.x - this.x;
        const pdy = player.y - this.y;
        this.angle = Math.atan2(pdy, pdx);
        const dist = Math.hypot(pdx, pdy);

        // Movement with Drunken Sway
        this.updateDebuffs(dt);
        const curSpeed = this.getEffectiveSpeed();
        if (dist > 65) {
            let moveAngle = this.angle;
            if (this.isDrunk) {
                // Drunken stagger deviation
                moveAngle += Math.sin(this.age * 0.08) * 0.45;
            }
            this.vx = Math.cos(moveAngle) * curSpeed;
            this.vy = Math.sin(moveAngle) * curSpeed;
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.walkCycle += 0.22 * dt;
        } else {
            this.vx = 0;
            this.vy = 0;
        }

        // 4. Drinking Interval (Every 8.0 Seconds until Drunk)
        if (!this.isDrunk) {
            this.drinkCooldown -= dt;
            if (this.drinkCooldown <= 0) {
                this.startDrinking(effects);
            }
        }

        // 4.5. Minion Summoning (Every 10 Seconds Close to Him)
        this.summonTimer -= dt;
        if (this.summonTimer <= 0) {
            this.summonMinions(enemies, effects);
        }

        // 5. Drunk Ability: Flying Karate Kick Cooldown
        if (this.isDrunk) {
            this.karateKickTimer -= dt;
            if (this.karateKickTimer <= 0) {
                this.startKarateKick(player, effects);
            }
        }

        // 6. Red Shatter Volley Cooldown (Active in Drunk & Rage modes)
        if (this.isDrunk || this.isRageMode) {
            this.shatterVolleyTimer -= dt;
            if (this.shatterVolleyTimer <= 0) {
                this.executeShatterVolley(player, bullets, effects);
            }
        }

        this.applyArenaBounds(arena);
        this.applySeparation(enemies);
    }

    startDrinking(effects) {
        this.isDrinking = true;
        this.drinkTimer = 85; // ~1.4 seconds drinking
        this.vx = 0;
        this.vy = 0;

        if (effects) {
            effects.addComicSplash(this.x, this.y - 45, 'GLUG GLUG! 🍷');
            effects.addDust(this.x, this.y, 4, 6);
        }
        if (window.soundEngine && typeof window.soundEngine.playPickup === 'function') {
            window.soundEngine.playPickup('cookie');
        }
    }

    updateDrinking(dt, effects) {
        this.drinkTimer -= dt;

        // Sparkle / Bubble FX while drinking
        if (effects && Math.random() < 0.25 * dt) {
            effects.addSparks(this.x, this.y - 30, '#be2edd', 2);
            effects.addSparks(this.x, this.y - 30, '#ff4757', 2);
        }

        if (this.drinkTimer <= 0) {
            this.isDrinking = false;
            this.drinkCooldown = 480; // Reset 8.0s timer (reduced from 10s)
            this.drunkMeter = Math.min(100, this.drunkMeter + 34); // Fills in 3 drinks

            if (effects) {
                effects.addComicSplash(this.x, this.y - 40, `AHHH! 🍷 (${Math.round(this.drunkMeter)}%)`);
            }

            // Check if bar is full -> Trigger Drunk Mode!
            if (this.drunkMeter >= 100 && !this.isDrunk) {
                this.triggerDrunkMode(effects);
            }
        }
    }

    triggerDrunkMode(effects) {
        this.isDrunk = true;

        // +30% Max Health Expansion & Immediate Heal!
        const hpBoost = Math.round(this.baseMaxHp * 0.30);
        this.maxHp += hpBoost;
        this.hp = Math.min(this.maxHp, this.hp + hpBoost);

        // Stat Boosts (+25% Speed & Damage)
        this.speed = this.baseSpeed * 1.25;
        this.damage = this.baseDamage * 1.25;

        if (effects) {
            effects.addComicSplash(this.x, this.y - 50, 'DRUNK MODE! 🍷💫');
            effects.addShockwave(this.x, this.y, 130, 'rgba(190, 46, 221, 0.85)');
            effects.addConfetti(this.x, this.y, 30);
        }
        if (window.soundEngine) {
            window.soundEngine.playLevelUp();
        }
    }

    triggerRageMode(effects) {
        this.rageTriggered = true;
        this.isRageMode = true;

        // Rage Stat Boost: Walks faster (+40%) and does more damage (+35%)
        this.speed = this.baseSpeed * 1.45;
        this.damage = this.baseDamage * 1.35;

        if (effects) {
            effects.addComicSplash(this.x, this.y - 50, 'RAGE MODE! 💢🍷');
            effects.addShockwave(this.x, this.y, 150, 'rgba(255, 71, 87, 0.9)');
            effects.addSparks(this.x, this.y, '#ff4757', 15);
        }
        if (window.soundEngine) {
            window.soundEngine.playSelect();
        }
    }

    startKarateKick(player, effects) {
        this.kickState = 'WINDUP';
        this.kickWindupTimer = 28; // ~0.45s windup crouch
        this.targetX = player.x;
        this.targetY = player.y;

        if (effects) {
            effects.addComicSplash(this.x, this.y - 45, 'ELA NA SOU PW RE! 🥋💥');
            effects.addDust(this.x, this.y, 8, 10);
        }
    }

    updateKarateKick(dt, player, effects) {
        if (this.kickState === 'WINDUP') {
            this.kickWindupTimer -= dt;
            if (this.kickWindupTimer <= 0) {
                this.kickState = 'LEAP';
                this.jumpHeight = 0;
                this.jumpVelocity = 16;

                // Set trajectory towards aimed spot
                const dx = this.targetX - this.x;
                const dy = this.targetY - this.y;
                const dist = Math.hypot(dx, dy) || 1;
                const leapSpeed = 13;
                this.vx = (dx / dist) * leapSpeed;
                this.vy = (dy / dist) * leapSpeed;
            }
            return;
        }

        if (this.kickState === 'LEAP') {
            this.jumpHeight += this.jumpVelocity * dt;
            this.jumpVelocity -= 0.85 * dt; // Gravity

            this.x += this.vx * dt;
            this.y += this.vy * dt;

            // Ground impact
            if (this.jumpHeight <= 0 && this.jumpVelocity < 0) {
                this.jumpHeight = 0;
                this.kickState = 'IDLE';
                this.karateKickTimer = this.isRageMode ? 190 : 270; // Cooldown

                // Landing Slam & 3s Stun Check!
                this.executeKarateLanding(player, effects);
            }
        }
    }

    executeKarateLanding(player, effects) {
        const impactRadius = 80;

        if (effects) {
            effects.addShockwave(this.x, this.y, 140, 'rgba(254, 211, 48, 0.9)');
            effects.addDust(this.x, this.y, 14, 16);
            effects.addComicSplash(this.x, this.y - 35, 'KARATE SLAM! 🥋💥');
            if (typeof effects.onBossSlam === 'function') effects.onBossSlam(0.045);
        }

        if (window.soundEngine) {
            window.soundEngine.playHit(true, true);
        }

        const activeGame = (typeof window !== 'undefined') ? window.gameInstance : null;
        const targets = [player];
        if (activeGame && activeGame.coopSession) {
            const rps = activeGame.coopSession.remotePlayers || (activeGame.coopSession.remotePlayer ? [activeGame.coopSession.remotePlayer] : []);
            for (let ri = 0; ri < rps.length; ri++) {
                const rp = rps[ri];
                if (rp && !rp.isDowned && !rp.isDownedDisconnected && !targets.includes(rp)) targets.push(rp);
            }
        }
        if (activeGame && activeGame.player && !targets.includes(activeGame.player)) {
            targets.push(activeGame.player);
        }

        const slamDmg = Math.round(48 * (this.damage / this.baseDamage));
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            if (!target || target.hp <= 0) continue;
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.hypot(dx, dy);

            // Within impact slam range: heavy damage and 3-second stun (bypassed by Psanas Rage)!
            if (dist <= impactRadius + target.radius) {
                target.takeDamage(slamDmg, effects);
                if (!target.rageUltActive) {
                    target.stunTimer = 180;
                    if (effects) effects.addComicSplash(target.x, target.y - 35, 'STUNNED! 💫 (3s)');
                } else if (effects) {
                    effects.addComicSplash(target.x, target.y - 35, 'UNSTOPPABLE! 🔥');
                }
            }
        }
    }

    summonMinions(enemies, effects) {
        this.summonTimer = 600; // Every 10 seconds

        if (effects) {
            effects.addComicSplash(this.x, this.y - 50, 'REBETES, TO ME! 🪕');
            effects.addShockwave(this.x, this.y, 140, 'rgba(255, 71, 87, 0.85)');
            effects.addDust(this.x, this.y, 12, 14);
        }

        if (window.soundEngine) {
            window.soundEngine.playSelect();
        }

        // Spawn 2-3 enemies close to Kleanthis (around 80-130px distance)
        const count = this.isRageMode ? 3 : 2;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + (Math.random() * 0.4);
            const dist = 85 + Math.random() * 45;
            const mx = this.x + Math.cos(angle) * dist;
            const my = this.y + Math.sin(angle) * dist;

            const roll = (Math.floor(this.age) + i) % 3;
            if (roll === 0 && typeof Fatmir !== 'undefined') {
                enemies.push(new Fatmir(mx, my, this.waveMultiplier));
            } else if (roll === 1 && typeof Casillas !== 'undefined') {
                enemies.push(new Casillas(mx, my, this.waveMultiplier));
            } else if (typeof Skarmogyftos !== 'undefined') {
                enemies.push(new Skarmogyftos(mx, my, this.waveMultiplier));
            }
        }
    }

    executeShatterVolley(player, bullets, effects) {
        this.shatterVolleyTimer = this.isRageMode ? 160 : 220; // Faster cooldowns

        if (effects) {
            effects.addComicSplash(this.x, this.y - 45, 'RED SHATTER! 🍷💥');
            effects.addSparks(this.x, this.y, '#ff4757', 16);
            effects.addShockwave(this.x, this.y, 110, 'rgba(255, 71, 87, 0.7)');
        }

        if (window.soundEngine) {
            window.soundEngine.playShoot('melon');
        }

        // Dense 16-shard (Rage) or 10-shard (Drunk) red projectile burst!
        const numShards = this.isRageMode ? 16 : 10;
        for (let i = 0; i < numShards; i++) {
            const angle = (i / numShards) * Math.PI * 2 + (Math.random() * 0.12);
            const shardSpeed = this.isRageMode ? 8.2 : 7.2;
            const bvx = Math.cos(angle) * shardSpeed;
            const bvy = Math.sin(angle) * shardSpeed;

            if (typeof Bullet !== 'undefined' && bullets) {
                const bullet = new Bullet({
                    x: this.x, y: this.y, vx: bvx, vy: bvy,
                    damage: 24, speed: shardSpeed, radius: 10,
                    type: 'kleanthis_wine_shard', isEnemy: true, range: 650, shooter: this
                });
                bullets.push(bullet);
            }
        }
    }

    takeDamage(amount, effects = null, fromCrit = null, playSound = true) {
        if (this.dead || this.isDying) return false;

        let finalAmount = amount;
        const isDrenched = this.waterDrenchedTimer > 0;
        if (isDrenched) {
            // Take +30% amplified damage when drenched by Nerobalonaki!
            finalAmount = Math.round(amount * (this.damageVulnerabilityMultiplier || 1.30));
        }

        this.hp -= finalAmount;
        this.hitFlash = 10;

        const isCrit = (fromCrit !== null && fromCrit !== undefined) ? fromCrit : (Math.random() < 0.25);
        if (playSound && window.soundEngine) {
            window.soundEngine.playHit(true, isCrit);
        }

        // Damage Number Indicator & Hit Sparks
        const fx = effects || (typeof window !== 'undefined' && window.effectsManager);
        if (fx) {
            fx.addDamage(this.x, this.y, finalAmount, isCrit, false, isDrenched);
            fx.addSparks(this.x, this.y, '#ff4757', 5);
            if (isDrenched) {
                fx.addSparks(this.x, this.y - 12, '#00d2d3', 3);
            }
        }

        if (this.hp <= 0) {
            this.hp = 0;
            this.isDying = true;
            this.deathTimer = this.maxDeathTimer;
            this.vx = 0;
            this.vy = 0;
            this.isDrinking = false;
            this.kickState = 'IDLE';

            if (fx) {
                fx.addComicSplash(this.x, this.y - 60, 'NOOOO! 💥');
                fx.addShockwave(this.x, this.y, 160, 'rgba(255, 71, 87, 0.9)');
                fx.addDust(this.x, this.y, 12, 14);
            }
            if (window.soundEngine) {
                window.soundEngine.playHit(true, true);
            }
            return false; // Still performing death animation
        }

        return false;
    }

    updateDeathSequence(dt, enemies = [], effects = null) {
        this.deathTimer -= dt;
        this.vx = 0;
        this.vy = 0;
        this.jumpHeight = 0;

        // Periodic explosions and sparks erupting from the boss
        if (Math.floor(this.deathTimer) % 10 === 0 && effects) {
            const ox = this.x + (Math.random() * 80 - 40);
            const oy = this.y + (Math.random() * 80 - 40);
            effects.addSparks(ox, oy, Math.random() < 0.5 ? '#fed330' : '#ff4757', 10);
            effects.addShockwave(ox, oy, 60 + Math.random() * 40, 'rgba(255, 234, 167, 0.8)');
            effects.addDust(ox, oy, 8, 12);
            if (Math.random() < 0.5) {
                effects.addComicSplash(ox, oy - 20, Math.random() < 0.5 ? 'CRACK!' : 'BOOM!');
            }
            if (window.soundEngine) {
                window.soundEngine.playHit(false, true);
            }
        }

        // Final Death Climax
        if (this.deathTimer <= 0) {
            this.dead = true;

            if (effects) {
                effects.addShockwave(this.x, this.y, 240, 'rgba(254, 211, 48, 1)');
                effects.addComicSplash(this.x, this.y - 70, 'K.O.! 👑💥');
                effects.addConfetti(this.x, this.y, 80);
                effects.addDust(this.x, this.y, 20, 24);
            }

            if (window.soundEngine) {
                window.soundEngine.playKill();
                window.soundEngine.playLevelUp();
            }

            // Wipe out remaining enemies ONLY on official Boss waves (e.g. Wave 10)
            const activeGame = typeof window !== 'undefined' ? window.gameInstance : null;
            if (activeGame && activeGame.player) {
                activeGame.player.kleanthisKills = (activeGame.player.kleanthisKills || 0) + 1;
            }

            if (!this.crateAwarded) {
                this.crateAwarded = true;
                if (typeof window !== 'undefined' && window.inventoryManager) {
                    window.inventoryManager.addCrate('boss_crate_normal', 1);
                }
            }
            const isBossWave = activeGame && activeGame.waveManager ? 
                (typeof activeGame.waveManager.isBossWave === 'function' ? activeGame.waveManager.isBossWave() : activeGame.waveManager.wave === 10) 
                : false;

            if (isBossWave && enemies && enemies.length > 0) {
                for (let i = 0; i < enemies.length; i++) {
                    const other = enemies[i];
                    if (other && other !== this && !other.dead) {
                        other.dead = true;
                        if (effects) {
                            effects.addComicSplash(other.x, other.y - 30, 'POW! 💥');
                            effects.addDust(other.x, other.y, 8, 10);
                            effects.addSparks(other.x, other.y, '#fed330', 8);
                        }
                    }
                }
            }
        }
    }

    draw(ctx) {
        if (typeof KleanthisRenderer !== 'undefined') {
            KleanthisRenderer.draw(this, ctx);
        }
    }
}

if (typeof window !== 'undefined') {
    window.Kleanthis = Kleanthis;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Kleanthis };
}
