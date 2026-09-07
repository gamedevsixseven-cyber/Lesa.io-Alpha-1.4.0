/**
 * Lesa.io - Hero Entity
 * Supports multiple heroes: "Psanas", "Psogas", and "Petros"
 * Dynamic eye tracking, weapon recoil, facial expressions, and custom hero skins
 */

class Player {
    constructor(x = 0, y = 0, heroType = 'psanas') {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.heroType = heroType; // 'psanas', 'psogas', 'petros'
        this.damageReduction = 0;

        // Apply hero archetype stats
        this.applyHeroArchetype(heroType);

        // Apply equipped weapon from Gear Inventory (if unlocked)
        const equippedWeapon = (typeof window !== 'undefined' && window.GameState && window.GameState.player && window.GameState.player.weaponType) || (typeof localStorage !== 'undefined' && localStorage.getItem('lesaio_selected_weapon'));
        if (equippedWeapon === 'bubble') {
            const isBubbleUnlocked = (typeof window !== 'undefined' && window.GameState && window.GameState.player && window.GameState.player.unlockedWeapons && window.GameState.player.unlockedWeapons.includes('bubble')) || (typeof localStorage !== 'undefined' && localStorage.getItem('lesaio_weapon_bubble_unlocked') === 'true');
            if (isBubbleUnlocked) {
                this.weaponType = 'bubble';
            }
        }

        this.hp = this.maxHp;
        this.level = 1; this.xp = 0; this.xpNeeded = 40; this.score = 0; this.kills = 0;
        this.fatmirKills = 0; this.casillasKills = 0; this.skarmogyftosKills = 0; this.kleanthisKills = 0;

        // Weapon & Shooting Stats
        this.damageMultiplier = 1.0; this.fireRateMultiplier = 1.0; this.fireCooldown = 0;
        this.multiShot = 1; this.spreadAngle = 0.15; this.pierce = 1; this.maxBounces = 0;
        this.bulletSpeed = 14; this.critChance = 0.1; this.critMultiplier = 2.0;

        // Permanent Upgrades (Crit Chance, Crit Damage)
        const upgrades = (typeof window !== 'undefined' && window.GameState && window.GameState.player && window.GameState.player.upgrades) || {};
        this.critChance += (upgrades.critChance || 0) * 0.01;
        this.critMultiplier += (upgrades.critDamage || 0) * 0.05;

        // Bubble Gun Secondary Charge State
        this.bubbleCharge = 0; this.isChargingBubble = false;

        // Dash & Abilities
        this.dashCooldown = 0; this.maxDashCooldown = 180; this.dashTimer = 0;
        this.isDashing = false; this.dashDuration = 14; this.dashSpeed = 16; this.invulnerableTimer = 0;

        // Active Skill State (Blade Rush / Nerobalonaki / etc.)
        this.selectedSkill = (typeof window !== 'undefined' && window.GameState && window.GameState.player && window.GameState.player.selectedSkill) || localStorage.getItem('lesaio_selected_skill') || 'blade_rush';
        this.skillName = this.selectedSkill === 'nerobalonaki' ? 'Nerobalonaki' : 'Blade Rush';
        this.skillCooldown = 0;
        this.maxSkillCooldown = this.selectedSkill === 'nerobalonaki' ? 360 : 480;
        this.isBladeRushing = false; this.bladeRushTimer = 0; this.bladeTimer = 0;

        // Upgrades & Physics Buffs
        this.magnetRadius = 140; this.shieldActive = false; this.frenzyTimer = 0;
        this.speedDebuffTimer = 0; this.secondWindSpeedTimer = 0; this.stunTimer = 0;
        this.knockbackVx = 0; this.knockbackVy = 0; this.knockbackTimer = 0;
        this.isGrabbed = false; this.isAirborne = false; this.airZ = 0; this.airVz = 0;
        this.airRotation = 0; this.landingDamage = 0; this.landingSquashTimer = 0;

        // Animation & Visual State
        this.angle = 0; this.walkCycle = 0; this.isMoving = false;
        this.hitFlash = 0; this.dizzyTimer = 0; this.happyTimer = 0;
        this.recoilOffset = 0; this.blinkTimer = 180; this.isBlinking = false;
        this.scarfWave = 0; this.ghostTrails = [];
    }

    applyHeroArchetype(type) {
        this.heroType = type;
        const heroData = (typeof HEROES !== 'undefined' && HEROES[type]) ? HEROES[type] : null;
        if (heroData) {
            this.name = heroData.name;
            this.radius = heroData.radius || 25;
            this.baseSpeed = (heroData.speed || 5.0) * 1.05;
            this.maxHp = heroData.hp || 100;
            this.weaponType = heroData.weaponType || 'pea';
            this.heroColor = heroData.heroColor || '#ff4757';
        } else {
            const defaults = {
                psogas: { name: 'Psogas', radius: 25, speed: 5.6, hp: 90, weapon: 'pepper', color: '#fa8231' },
                petros: { name: 'Petros', radius: 26, speed: 4.6, hp: 140, weapon: 'watermelon', color: '#1e70d6' },
                psanas: { name: 'Psanas', radius: 24, speed: 5.2, hp: 100, weapon: 'pea', color: '#ff4757' }
            };
            const d = defaults[type] || defaults.psanas;
            this.name = d.name; this.radius = d.radius; this.baseSpeed = d.speed;
            this.maxHp = d.hp; this.weaponType = d.weapon; this.heroColor = d.color;
        }

        // Apply Permanent Power Upgrades (Max Health)
        const upgrades = (typeof window !== 'undefined' && window.GameState && window.GameState.player && window.GameState.player.upgrades) || {};
        const maxHealthLvl = upgrades.maxHealth || 0;
        this.maxHp += maxHealthLvl * 6;

        this.applyEquipmentStats();

        this.hp = this.maxHp;
        this.speed = this.baseSpeed;
    }

    applyEquipmentStats() {
        if (typeof GearManager === 'undefined') return;
        const s = GearManager.getEquippedTotalStats();
        if (s.maxHp) this.maxHp += s.maxHp;
        if (s.speed) this.baseSpeed = Math.min(7.5, this.baseSpeed * (1 + s.speed / 100));
        if (s.critChance) this.critChance = Math.min(0.45, this.critChance + s.critChance / 100);
        if (s.critDamage) this.critMultiplier += s.critDamage / 100;
        if (s.damageReduction) this.damageReduction = Math.min(0.40, (this.damageReduction || 0) + s.damageReduction / 100);
        if (s.fireRate) this.fireRateMultiplier *= (1 + s.fireRate / 100);
        if (s.bulletDamage) this.damageMultiplier *= (1 + s.bulletDamage / 100);
        if (s.bulletSpeed) this.bulletSpeed *= (1 + s.bulletSpeed / 100);
        if (s.dashCooldown) this.maxDashCooldown = Math.max(72, Math.round(this.maxDashCooldown * (1 - s.dashCooldown / 100)));
        if (s.magnetRadius) this.magnetRadius += s.magnetRadius;
        this.hp = this.maxHp;
        this.speed = this.baseSpeed;
    }

    update(dt = 1, input = null, camera = null, effects = null, arena = null) {
        // Cooldowns
        if (this.fireCooldown > 0) this.fireCooldown -= dt;
        if (this.dashCooldown > 0) this.dashCooldown -= dt;
        if (this.skillCooldown > 0 && !(this.frappesFrenzyTimer > 0)) this.skillCooldown -= dt;
        if (this.hitFlash > 0) this.hitFlash -= dt;
        if (this.dizzyTimer > 0) this.dizzyTimer -= dt;
        if (this.happyTimer > 0) this.happyTimer -= dt;
        if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
        if (this.recoilOffset > 0) this.recoilOffset *= 0.85;
        if (this.bladeTimer > 0) this.bladeTimer -= dt;

        // Frenzy Buff
        if (this.frenzyTimer > 0) {
            this.frenzyTimer -= dt;
            if (Math.random() < 0.3 && effects) {
                effects.addSparks(this.x, this.y, '#ff4757', 2);
            }
        }

        // Bubble Gun Right-Click Charge Mechanic
        if (this.weaponType === 'bubble' && input) {
            const isRightHeld = input.mouse && input.mouse.rightDown;
            if (isRightHeld) {
                this.isChargingBubble = true;
                const prev = this.bubbleCharge || 0;
                this.bubbleCharge = Math.min(1.0, prev + (dt / 45)); // ~0.75s to reach max charge

                // Audio / particle trigger on reaching 100% full charge
                if (prev < 1.0 && this.bubbleCharge >= 1.0) {
                    if (window.soundEngine) window.soundEngine.playShoot('bubble');
                    if (effects) {
                        const muzzleX = this.x + Math.cos(this.angle) * (this.radius + 24);
                        const muzzleY = this.y + Math.sin(this.angle) * (this.radius + 24);
                        effects.addSparks(muzzleX, muzzleY, '#00d2d3', 6);
                        effects.addComicSplash(muzzleX, muzzleY - 22, 'CHARGED!');
                    }
                }

                // Ambient charging froth at nozzle
                if (effects && Math.random() < 0.25) {
                    const muzzleX = this.x + Math.cos(this.angle) * (this.radius + 20);
                    const muzzleY = this.y + Math.sin(this.angle) * (this.radius + 20);
                    effects.addDust(muzzleX, muzzleY, 1, 3);
                }
            } else if (this.isChargingBubble) {
                // Released right click! Fire Big Bubble if charged enough
                if ((this.bubbleCharge || 0) >= 0.35) {
                    this.fireChargedBubble(effects);
                }
                this.bubbleCharge = 0;
                this.isChargingBubble = false;
            }
        } else {
            this.bubbleCharge = 0;
            this.isChargingBubble = false;
        }

        // Blinking
        this.blinkTimer -= dt;
        if (this.blinkTimer <= 0) {
            this.isBlinking = true;
            if (this.blinkTimer <= -8) {
                this.isBlinking = false;
                this.blinkTimer = 140 + Math.random() * 100;
            }
        }

        // Dash & Blade Rush Handling
        if (this.isBladeRushing) {
            this.bladeRushTimer -= dt;
            this.trailSpawnTimer = (this.trailSpawnTimer || 0) + dt;
            if (this.trailSpawnTimer >= 1.8) {
                this.trailSpawnTimer = 0;
                this.ghostTrails.push({ x: this.x, y: this.y, angle: this.angle, alpha: 0.85, isBlade: true });
            }
            if (this.bladeRushTimer <= 0) {
                this.isBladeRushing = false;
                this.trailSpawnTimer = 0;
            }
        } else if (this.isDashing) {
            this.dashTimer -= dt;
            this.trailSpawnTimer = (this.trailSpawnTimer || 0) + dt;
            if (this.trailSpawnTimer >= 2.0) {
                this.trailSpawnTimer = 0;
                this.ghostTrails.push({ x: this.x, y: this.y, angle: this.angle, alpha: 0.6, isBlade: false });
            }
            if (this.dashTimer <= 0) {
                this.isDashing = false;
                this.trailSpawnTimer = 0;
            }
        } else if (this.stunTimer > 0) {
            // Cannot move while stunned (Karate Kick stun)
            this.vx = 0;
            this.vy = 0;
            this.isMoving = false;
            this.dizzyTimer = 10;
            if (effects && Math.random() < 0.12 * dt) {
                effects.addComicSplash(this.x, this.y - 30, '💫 STUNNED!');
                effects.addSparks(this.x, this.y - 15, '#fed330', 2);
            }
        } else if (this.isGrabbed) {
            this.vx = 0;
            this.vy = 0;
            this.isMoving = false;
        } else if (window.gameInstance && window.gameInstance.isCutsceneActive && window.gameInstance.isCutsceneActive()) {
            this.vx = 0;
            this.vy = 0;
            this.isMoving = false;
            const boss = window.gameInstance.enemies ? window.gameInstance.enemies.find(e => e && !e.dead && (e.isBoss || e.type === 'kiloumpas' || e.type === 'rouf' || e.name === 'Kiloumpas' || e.name === 'Rouf')) : null;
            if (boss && !boss.hidden) {
                this.angle = Math.atan2(boss.y - this.y, boss.x - this.x);
            }
        } else if (input && !this.isAirborne) {
            // Normal Movement
            if (this.speedDebuffTimer > 0) this.speedDebuffTimer -= dt;

            const { dx, dy } = input.getMovementVector();
            let currentSpeed = (this.frappesFrenzyTimer > 0 ? this.speed * (this.frappesSpeedBuff || 1.65) : (this.frenzyTimer > 0 ? this.speed * 1.35 : this.speed));
            if (this.secondWindSpeedTimer > 0) {
                currentSpeed *= 1.25; // Second Wind +25% Speed Boost
            }
            if (this.speedDebuffTimer > 0) {
                currentSpeed *= 0.68; // Drowsy Smoke 32% Slow
            }
            
            this.vx = dx * currentSpeed;
            this.vy = dy * currentSpeed;

            this.isMoving = (dx !== 0 || dy !== 0);
            if (this.isMoving) {
                this.walkCycle += 0.25 * dt;
                this.scarfWave += 0.35 * dt;
                if (Math.random() < 0.2 && effects) {
                    effects.addDust(this.x, this.y + this.radius * 0.8, 1, 4);
                }
            } else {
                this.walkCycle *= 0.8;
                this.scarfWave += 0.1 * dt;
            }

            // Aiming angle: check touch aiming on mobile devices
            const touch = window.gameInstance && window.gameInstance.touchInput;
            if (touch && touch.isTouchDevice) {
                if (touch.isShooting && typeof touch.aimAngle === 'number') {
                    this.angle = touch.aimAngle;
                } else if (this.isMoving) {
                    this.angle = Math.atan2(dy, dx);
                }
            } else {
                this.angle = Math.atan2(input.mouse.worldY - this.y, input.mouse.worldX - this.x);
            }
        }

        if (this.landingSquashTimer > 0) this.landingSquashTimer -= dt;

        // Apply Position & Airborne Parabolic Throw Physics
        if (this.isAirborne) {
            this.isMoving = false;
            this.airZ += this.airVz * dt;
            this.airVz -= 0.58 * dt; // Gravity
            this.airRotation += 0.24 * dt; // Rapid cartoon tumbling in mid-air
            this.x += this.knockbackVx * dt;
            this.y += this.knockbackVy * dt;
            this.knockbackVx *= Math.pow(0.972, dt);
            this.knockbackVy *= Math.pow(0.972, dt);

            if (this.ghostTrails && Math.random() < 0.45 * dt) {
                this.ghostTrails.push({ x: this.x, y: this.y - this.airZ, alpha: 0.6, isAirborne: true });
            }

            if (this.airZ <= 0 && this.airVz < 0) {
                this.airZ = 0;
                this.airVz = 0;
                this.isAirborne = false;
                this.airRotation = 0;
                this.knockbackVx = 0;
                this.knockbackVy = 0;
                this.landingSquashTimer = 14;

                if (this.landingDamage > 0) {
                    this.takeDamage(this.landingDamage, effects);
                    this.landingDamage = 0;
                }

                if (effects) {
                    effects.addComicSplash(this.x, this.y - 40, 'YEET! 💥');
                    effects.addShockwave(this.x, this.y, 160, 'rgba(235, 77, 75, 0.95)');
                    effects.addDust(this.x, this.y, 24, 22);
                    effects.addSparks(this.x, this.y, '#fed330', 12);
                }
                const cam = (typeof window !== 'undefined' && window.gameInstance && window.gameInstance.camera) ? window.gameInstance.camera : null;
                if (cam && typeof cam.shake === 'function') cam.shake(14, 22);
                if (window.soundEngine && typeof window.soundEngine.playHit === 'function') {
                    window.soundEngine.playHit(true, true);
                }
            }
        } else if (this.knockbackTimer > 0) {
            this.knockbackTimer -= dt;
            this.x += this.knockbackVx * dt;
            this.y += this.knockbackVy * dt;
            this.knockbackVx *= Math.pow(0.88, dt);
            this.knockbackVy *= Math.pow(0.88, dt);
            if (effects && Math.random() < 0.45 * dt) effects.addDust(this.x, this.y, 2, 6);
        } else if (!this.isGrabbed) {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
        }

        // Apply Map Border Collision
        this.applyArenaBounds(arena);

        // Ghost trails
        for (let i = this.ghostTrails.length - 1; i >= 0; i--) {
            this.ghostTrails[i].alpha -= 0.08 * dt;
            if (this.ghostTrails[i].alpha <= 0) {
                this.ghostTrails.splice(i, 1);
            }
        }
    }

    applyArenaBounds(arena = null) {
        const ar = arena || (typeof window !== 'undefined' && window.gameInstance ? window.gameInstance.arena : null);
        if (!ar) return;
        const minX = -ar.halfWidth + this.radius, maxX = ar.halfWidth - this.radius;
        const minY = -ar.halfHeight + this.radius, maxY = ar.halfHeight - this.radius;
        if (this.x < minX) { this.x = minX; if (this.vx < 0) this.vx = 0; if (this.knockbackVx < 0) this.knockbackVx = 0; this.isBladeRushing = false; this.isDashing = false; }
        else if (this.x > maxX) { this.x = maxX; if (this.vx > 0) this.vx = 0; if (this.knockbackVx > 0) this.knockbackVx = 0; this.isBladeRushing = false; this.isDashing = false; }
        if (this.y < minY) { this.y = minY; if (this.vy < 0) this.vy = 0; if (this.knockbackVy < 0) this.knockbackVy = 0; this.isBladeRushing = false; this.isDashing = false; }
        else if (this.y > maxY) { this.y = maxY; if (this.vy > 0) this.vy = 0; if (this.knockbackVy > 0) this.knockbackVy = 0; this.isBladeRushing = false; this.isDashing = false; }
    }

    dash(effects = null) {
        if (this.dashCooldown > 0 || this.isDashing || this.stunTimer > 0 || this.isGrabbed || this.isAirborne) return;
        if (window.gameInstance && window.gameInstance.isCutsceneActive && window.gameInstance.isCutsceneActive()) return;

        this.isDashing = true;
        this.dashTimer = this.dashDuration;
        this.dashCooldown = this.maxDashCooldown;
        this.invulnerableTimer = this.dashDuration + 4;

        if (this.vx !== 0 || this.vy !== 0) {
            const moveLen = Math.hypot(this.vx, this.vy);
            this.vx = (this.vx / moveLen) * this.dashSpeed;
            this.vy = (this.vy / moveLen) * this.dashSpeed;
        } else {
            this.vx = Math.cos(this.angle) * this.dashSpeed;
            this.vy = Math.sin(this.angle) * this.dashSpeed;
        }

        if (window.soundEngine) {
            window.soundEngine.playPlayerDash();
        }
        if (effects) {
            effects.addDust(this.x, this.y, 8, 12);
            effects.addComicSplash(this.x, this.y - 30, 'WHOOSH!');
        }
    }

    applyKnockback(vx, vy, duration = 24) {
        this.knockbackVx = vx;
        this.knockbackVy = vy;
        this.knockbackTimer = duration;
    }

    launchAirborne(vx, vy, vz = 17.5, damage = 38) {
        this.isGrabbed = false;
        this.isAirborne = true;
        this.knockbackVx = vx;
        this.knockbackVy = vy;
        this.airVz = vz;
        this.airZ = 24;
        this.airRotation = 0.2;
        this.landingDamage = damage;
    }

    setSkill(skillId) {
        this.selectedSkill = skillId || 'blade_rush';
        const skillData = (typeof SKILLS !== 'undefined' && SKILLS[this.selectedSkill]) ? SKILLS[this.selectedSkill] : null;
        const level = (typeof PlayerSkills !== 'undefined') ? PlayerSkills.getSkillLevel(this.selectedSkill) : 1;
        const isMasteredFrappes = (this.selectedSkill === 'frappes' && level >= 5);
        this.hasPagakiaMastery = isMasteredFrappes;
        this.skillName = isMasteredFrappes ? 'Frappes+' : (skillData ? skillData.name : 'Blade Rush');
        const cdSec = (typeof PlayerSkills !== 'undefined') ? PlayerSkills.getEffectiveCooldown(this.selectedSkill, level) : (skillData ? skillData.cooldown : 8.0);
        this.maxSkillCooldown = Math.round(cdSec * 60);
        this.skillCooldown = 0;
    }

    useSkill(enemies = [], effects = null, camera = null, game = null) {
        if (this.stunTimer > 0 || this.isGrabbed || this.isAirborne) return;
        if (window.gameInstance && window.gameInstance.isCutsceneActive && window.gameInstance.isCutsceneActive()) return;
        if (typeof PlayerSkills !== 'undefined') {
            PlayerSkills.execute(this, enemies, effects, camera, game);
        }
    }

    shoot(effects = null) {
        if (this.stunTimer > 0 || this.isGrabbed || this.isAirborne) return null;
        if (window.gameInstance && window.gameInstance.isCutsceneActive && window.gameInstance.isCutsceneActive()) return null;
        if (typeof WeaponSystem !== 'undefined') {
            const bullets = WeaponSystem.fire(this, effects);
            if (bullets && this.frappesFrenzyTimer > 0 && this.hasPagakiaMastery) {
                for (let i = 0; i < bullets.length; i++) {
                    bullets[i].isPagakiaChilling = true;
                }
            }
            return bullets;
        }
        return null;
    }

    takeDamage(amount, effects = null, camera = null) {
        if (window.AdminCheats && window.AdminCheats.godMode) return false;
        if (this.invulnerableTimer > 0 || this.hp <= 0) return false;

        if (this.shieldActive) {
            this.shieldActive = false;
            this.invulnerableTimer = 30;
            window.soundEngine.playHit(false, true);
            if (effects) {
                effects.addComicSplash(this.x, this.y, 'BLOCKED!');
                effects.addShockwave(this.x, this.y, 80, 'rgba(112, 161, 255, 0.9)');
            }
            return false;
        }

        let actualDamage = amount;
        if (this.damageReduction && this.damageReduction > 0) {
            actualDamage = Math.max(1, Math.round(amount * (1 - this.damageReduction)));
        }

        this.hp = Math.max(0, this.hp - actualDamage);
        this.hitFlash = 12;
        this.dizzyTimer = 25;
        this.invulnerableTimer = 20;

        window.soundEngine.playHit(false);

        if (camera) camera.addShake(10);
        if (effects) {
            effects.addDamage(this.x, this.y, actualDamage, false, true);
            effects.addSparks(this.x, this.y, '#ff3b30', 8);
        }

        // Battle Perks On-Damage Hook (Second Wind & Counter-Blast)
        if (typeof window !== 'undefined' && window.perkSystem) {
            window.perkSystem.onPlayerDamage(this, actualDamage, effects, camera, window.gameInstance);
        }

        if (this.hp <= 0) {
            window.soundEngine.playGameOver();
            if (effects) {
                effects.addComicSplash(this.x, this.y, 'K.O!');
                effects.addShockwave(this.x, this.y, 140, 'rgba(255, 59, 48, 0.9)');
            }
        }

        return true;
    }

    heal(amount) { this.hp = Math.min(this.maxHp, this.hp + amount); this.happyTimer = 40; }
    addShield() { this.shieldActive = true; }
    activatePepperFrenzy(durationMs = 7000) { this.frenzyTimer = durationMs / 16.6; }

    addXP(amount) {
        this.xp += amount;
        this.score += amount * 10;
        this.happyTimer = 20;
        if (this.xp >= this.xpNeeded) {
            this.levelUp();
            return true;
        }
        return false;
    }

    levelUp() {
        this.level++;
        this.xp -= this.xpNeeded;
        this.xpNeeded = Math.round(this.xpNeeded * 1.35 + 25);
        this.hp = Math.min(this.maxHp, this.hp + 30);

        window.soundEngine.playLevelUp();
        if (window.EventBus) {
            window.EventBus.emit('levelUp', { level: this.level });
        }
        if (window.effectsManager) {
            window.effectsManager.addConfetti(this.x, this.y, 35);
            window.effectsManager.addComicSplash(this.x, this.y - 40, 'LEVEL UP!');
        }
    }

    fireChargedBubble(effects = null) {
        if (!window.gameInstance) return;
        const chargeRatio = Math.min(1.0, Math.max(0.35, this.bubbleCharge || 1.0));
        const shotAngle = this.angle;
        const muzzleX = this.x + Math.cos(shotAngle) * (this.radius + 24);
        const muzzleY = this.y + Math.sin(shotAngle) * (this.radius + 24);
        const dmg = Math.round(75 + chargeRatio * 35) * this.damageMultiplier;

        const b = new Bullet({
            x: muzzleX, y: muzzleY, vx: Math.cos(shotAngle) * 11, vy: Math.sin(shotAngle) * 11,
            damage: dmg, speed: 11, radius: 26, type: 'bubble', isEnemy: false, pierce: 1, maxBounces: 2, shooter: this
        });
        b.isChargedBubble = true;
        window.gameInstance.bullets.push(b);
        this.recoilOffset = 16;
        this.fireCooldown = 15;

        if (window.soundEngine) {
            if (typeof window.soundEngine.playChargedBubble === 'function') window.soundEngine.playChargedBubble();
            else window.soundEngine.playShoot('charged_bubble');
        }
        if (effects) {
            effects.addShockwave(muzzleX, muzzleY, 55, 'rgba(0, 206, 201, 0.85)');
            effects.addComicSplash(muzzleX, muzzleY - 26, '🫧 BIG BUBBLE!');
        }
    }

    draw(ctx) {
        if (typeof HeroRenderer !== 'undefined') {
            HeroRenderer.draw(this, ctx);
        }
    }
}

if (typeof window !== 'undefined') {
    window.Player = Player;
}

