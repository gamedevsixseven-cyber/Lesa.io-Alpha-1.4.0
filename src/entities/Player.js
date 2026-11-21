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
        this.heroType = heroType; // 'psanas', 'psogas', 'petros', etc.

        // Apply hero archetype stats
        this.applyHeroArchetype(heroType);

        // Apply equipped shared unlockable weapon (if unlocked)
        if (typeof WeaponSystem !== 'undefined') {
            this.weaponType = WeaponSystem.resolveEquippedWeapon(this.weaponType);
        }

        this.level = 1; this.xp = 0; this.xpNeeded = 40; this.score = 0; this.kills = 0;
        this.fatmirKills = 0; this.casillasKills = 0; this.skarmogyftosKills = 0; this.kleanthisKills = 0; this.kiloumpasKills = 0; this.roufKills = 0;
        this.endlessMiniBossKills = 0; this.endlessBossKills = 0; this.endlessBossGoldBonus = 0; this.endlessBossXpBonus = 0;

        // Permanent Upgrades (Crit Chance, Crit Damage)
        const upgrades = (typeof window !== 'undefined' && window.GameState && window.GameState.player && window.GameState.player.upgrades) || {};

        // Base shooting & utility stats before equipment modifiers
        this.baseDamageMultiplier = 1.0;
        this.baseFireRateMultiplier = 1.0;
        this.baseBulletSpeed = 14;
        this.baseCritChance = 0.1 + (upgrades.critChance || 0) * 0.01;
        this.baseCritMultiplier = 2.0 + (upgrades.critDamage || 0) * 0.05;
        this.baseDamageReduction = this.archetypeDamageReduction || 0; this.damageReduction = this.baseDamageReduction;
        this.baseMaxDashCooldown = 180;
        this.baseMagnetRadius = 140;

        this.fireCooldown = 0;
        this.multiShot = 1; this.spreadAngle = 0.15; this.pierce = 1; this.maxBounces = 0;

        // Bubble Gun Secondary Charge State
        this.bubbleCharge = 0; this.isChargingBubble = false;

        // Dash & Abilities
        this.dashCooldown = 0; this.dashTimer = 0;
        this.isDashing = false; this.dashDuration = 14; this.dashSpeed = 16; this.invulnerableTimer = 0;

        // Active Skill State (Blade Rush / Nerobalonaki / etc.)
        this.selectedSkill = (typeof window !== 'undefined' && window.GameState && window.GameState.player && window.GameState.player.selectedSkill) || localStorage.getItem('lesaio_selected_skill') || 'blade_rush';
        this.skillCooldown = 0;
        this.isBladeRushing = false; this.bladeRushTimer = 0; this.bladeTimer = 0;
        this.setSkill(this.selectedSkill);

        // Upgrades & Physics Buffs
        this.shieldActive = false; this.frenzyTimer = 0;
        this.speedDebuffTimer = 0; this.secondWindSpeedTimer = 0; this.stunTimer = 0;
        this.knockbackVx = 0; this.knockbackVy = 0; this.knockbackTimer = 0;
        this.isGrabbed = false; this.isAirborne = false; this.airZ = 0; this.airVz = 0;
        this.airRotation = 0; this.landingDamage = 0; this.landingSquashTimer = 0;

        // Animation & Visual State
        this.angle = 0; this.walkCycle = 0; this.isMoving = false;
        this.hitFlash = 0; this.dizzyTimer = 0; this.happyTimer = 0;
        this.recoilOffset = 0; this.blinkTimer = 180; this.isBlinking = false;
        this.scarfWave = 0; this.ghostTrails = [];

        // Apply Gear & Equipment Stats cleanly onto baselines
        this.applyEquipmentStats();
        this.hp = this.maxHp;
        this.speed = this.baseSpeed;
    }

    applyHeroArchetype(type) {
        this.heroType = type;
        const heroData = (typeof HEROES !== 'undefined' && HEROES[type]) ? HEROES[type] : null;
        if (heroData) {
            this.name = heroData.name;
            this.radius = heroData.radius || 25;
            this.archetypeSpeed = (heroData.speed || 5.0) * 1.05;
            this.archetypeMaxHp = heroData.hp || 100;
            this.weaponType = heroData.weaponType || 'pea';
            this.heroColor = heroData.heroColor || '#ff4757';
        } else {
            const defaults = {
                psogas: { name: 'Psogas', radius: 25, speed: 5.6, hp: 90, weapon: 'pepper', color: '#fa8231' },
                petros: { name: 'Petros', radius: 26, speed: 4.6, hp: 150, weapon: 'watermelon', color: '#1e70d6' },
                '50balos': { name: '50balos', radius: 24, speed: 5.0, hp: 110, weapon: 'money_gun', color: '#162c50' },
                billias: { name: 'Billias', radius: 25, speed: 4.6, hp: 120, weapon: 'burger', color: '#e67e22' },
                kitsos: { name: 'Kitsos', radius: 24, speed: 5.8, hp: 95, weapon: 'lightning', color: '#00d2d3' },
                psgiannhs: { name: 'Psgiannhs', radius: 24, speed: 5.1, hp: 115, weapon: 'greek_flag', color: '#22242a' },
                psanas: { name: 'Psanas', radius: 24, speed: 5.2, hp: 100, weapon: 'pea', color: '#ff4757' }
            };
            const d = defaults[type] || defaults.psanas;
            this.name = d.name; this.radius = d.radius; this.archetypeSpeed = d.speed;
            this.archetypeMaxHp = d.hp; this.weaponType = d.weapon; this.heroColor = d.color;
        }
        this.heroStyle = (type === 'psgiannhs' && typeof PsgiannhsHero !== 'undefined') ? PsgiannhsHero.getActiveStyle() : null; this.archetypeDamageReduction = (heroData && heroData.damageReduction) || (type === 'petros' ? 0.08 : 0);
        this.baseDamageReduction = this.archetypeDamageReduction; this.damageReduction = this.baseDamageReduction;

        if (type === 'kitsos') {
            this.archetypeSpeed = 5.8; // Guaranteed fastest hero in the game by +0.2
        } else if (type === 'billias') {
            this.archetypeSpeed = 4.6; // Slightly slow as requested
        }

        // Apply Permanent Power Upgrades (Max Health)
        const upgrades = (typeof window !== 'undefined' && window.GameState && window.GameState.player && window.GameState.player.upgrades) || {};
        const maxHealthLvl = upgrades.maxHealth || 0;
        this.archetypeMaxHp += maxHealthLvl * 6;

        this.baseSpeed = this.archetypeSpeed;
        this.speed = this.baseSpeed;
        this.maxHp = this.archetypeMaxHp;
        this.hp = this.maxHp;
    }

    applyEquipmentStats() {
        if (typeof GearManager === 'undefined') return;
        const s = GearManager.getEquippedTotalStats();

        const oldMaxHp = this.maxHp || this.archetypeMaxHp || 100;
        this.maxHp = (this.archetypeMaxHp || 100) + (s.maxHp || 0);
        if (this.hp === undefined || this.hp >= oldMaxHp) {
            this.hp = this.maxHp;
        } else {
            this.hp = Math.min(this.hp, this.maxHp);
        }

        this.baseSpeed = Math.min(7.5, (this.archetypeSpeed || 5.0) * (1 + (s.speed || 0) / 100));
        this.speed = this.baseSpeed;

        this.damageMultiplier = (this.baseDamageMultiplier !== undefined ? this.baseDamageMultiplier : 1.0) * (1 + (s.bulletDamage || 0) / 100);
        this.fireRateMultiplier = (this.baseFireRateMultiplier !== undefined ? this.baseFireRateMultiplier : 1.0) * (1 + (s.fireRate || 0) / 100);
        this.bulletSpeed = (this.baseBulletSpeed !== undefined ? this.baseBulletSpeed : 14) * (1 + (s.bulletSpeed || 0) / 100);
        this.critChance = Math.min(0.45, (this.baseCritChance !== undefined ? this.baseCritChance : 0.1) + (s.critChance || 0) / 100);
        this.critMultiplier = (this.baseCritMultiplier !== undefined ? this.baseCritMultiplier : 2.0) + (s.critDamage || 0) / 100;
        this.damageReduction = Math.min(0.40, (this.baseDamageReduction || 0) + (s.damageReduction || 0) / 100);
        this.maxDashCooldown = Math.max(72, Math.round((this.baseMaxDashCooldown || 180) * (1 - (s.dashCooldown || 0) / 100)));
        this.magnetRadius = (this.baseMagnetRadius || 140) + (s.magnetRadius || 0);
        if (typeof window !== 'undefined' && window.perkSystem && typeof window.perkSystem.applyPlayerStatModifiers === 'function') window.perkSystem.applyPlayerStatModifiers(this, true);
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
        if (this.espressoHasteTimer > 0) this.espressoHasteTimer = Math.max(0, this.espressoHasteTimer - dt);
        if (typeof GearPassives !== 'undefined') GearPassives.update(dt, this, window.gameInstance);
        // Frenzy Buff
        if (this.frenzyTimer > 0) {
            this.frenzyTimer -= dt;
            if (Math.random() < 0.3 && effects) {
                effects.addSparks(this.x, this.y, '#ff4757', 2);
            }
        }

        // Billias Movement Hunger Eating Mechanic (+20 HP every 1 min)
        if (this.heroType === 'billias' && typeof BilliasHero !== 'undefined') {
            BilliasHero.updateHunger(this, dt, effects);
        }

        // Bubble Gun Charge Mechanic (PC Right-Click & Mobile Charge Button)
        if (this.weaponType === 'bubble' && input) {
            const touch = (window.gameInstance && window.gameInstance.touchInput) || (input && input.touchInput);
            const isTouchCharging = touch && touch.isBubbleChargeHeld;
            const isRightHeld = input.mouse && input.mouse.rightDown;
            const isChargeHeld = isRightHeld || !!isTouchCharging || !!this.bubbleChargeHeld;

            if (isChargeHeld) {
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
                // Released charge! Fire Big Bubble if charged enough
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
            if (typeof CombatRenderFX !== 'undefined') CombatRenderFX.recordDashGhost(this, dt);
            if (this.bladeRushTimer <= 0) {
                this.isBladeRushing = false;
                this.trailSpawnTimer = 0;
            }
        } else if (this.isDashing) {
            this.dashTimer -= dt;
            if (typeof CombatRenderFX !== 'undefined') CombatRenderFX.recordDashGhost(this, dt);
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
            const slowImmune = typeof GearPassives !== 'undefined' && GearPassives.isSlowImmune();
            if (this.secondWindSpeedTimer > 0) currentSpeed *= (this.secondWindSpeedMult || 1.25);
            if (this.speedDebuffTimer > 0 && !slowImmune) currentSpeed *= 0.68;
            if (this.olympusZoneMult !== undefined) currentSpeed *= (slowImmune && this.olympusZoneMult < 1 ? 1.0 : this.olympusZoneMult);
            if (typeof GearPassives !== 'undefined') currentSpeed *= GearPassives.getSpeedMultiplier(this);
            
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

        if (!this.isDashing && !this.isBladeRushing && typeof CombatRenderFX !== 'undefined') {
            CombatRenderFX.recordDashGhost(this, dt);
        }
        // Apply Map Border Collision
        this.applyArenaBounds(arena);

        // Ghost trails
        for (let i = this.ghostTrails.length - 1; i >= 0; i--) {
            this.ghostTrails[i].alpha -= 0.062 * dt;
            if (this.ghostTrails[i].alpha <= 0) {
                this.ghostTrails.splice(i, 1);
            }
        }
    }

    applyArenaBounds(arena = null) {
        const ar = arena || (typeof window !== 'undefined' && window.gameInstance ? window.gameInstance.arena : null);
        if (!ar) return;
        const b = ar.dungeonBounds;
        const minX = (b ? b.minX : -ar.halfWidth) + this.radius, maxX = (b ? b.maxX : ar.halfWidth) - this.radius;
        const minY = (b ? b.minY : -ar.halfHeight) + this.radius, maxY = (b ? b.maxY : ar.halfHeight) - this.radius;
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
        if (typeof GearPassives !== 'undefined') GearPassives.onDash(this, effects);
        if (typeof window !== 'undefined' && window.perkSystem && typeof window.perkSystem.onDash === 'function') window.perkSystem.onDash(this, effects);

        const dashSpeed = this.dashSpeed * ((typeof window !== 'undefined' && window.perkSystem && typeof window.perkSystem.getDashSpeedMultiplier === 'function') ? window.perkSystem.getDashSpeedMultiplier() : 1.0);
        if (this.vx !== 0 || this.vy !== 0) {
            const moveLen = Math.hypot(this.vx, this.vy);
            this.vx = (this.vx / moveLen) * dashSpeed;
            this.vy = (this.vy / moveLen) * dashSpeed;
        } else {
            this.vx = Math.cos(this.angle) * dashSpeed;
            this.vy = Math.sin(this.angle) * dashSpeed;
        }

        if (window.soundEngine) window.soundEngine.playPlayerDash();
        if (typeof CombatRenderFX !== 'undefined') CombatRenderFX.onDashStart(this, effects);
        else if (effects) { effects.addDust(this.x, this.y, 8, 12); effects.addComicSplash(this.x, this.y - 30, 'WHOOSH!'); }
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
        if (this.isChargingBubble) return null;
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
        if (typeof GearPassives !== 'undefined' && GearPassives.tryAvoidHit(this, effects)) return false;

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
        if (typeof window !== 'undefined' && window.perkSystem && typeof window.perkSystem.interceptPlayerDamage === 'function') {
            const wardRes = window.perkSystem.interceptPlayerDamage(this, actualDamage, effects, window.gameInstance);
            if (wardRes && wardRes.blocked) return false;
            if (wardRes && typeof wardRes.remainingDamage === 'number') actualDamage = wardRes.remainingDamage;
        }
        if (typeof GearPassives !== 'undefined') actualDamage = GearPassives.absorbBarrier(this, actualDamage, effects);

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
        if (typeof GearPassives !== 'undefined') { GearPassives.onPlayerDamaged(this, actualDamage, effects, window.gameInstance); GearPassives.tryPreventFatalHit(this, effects); }

        if (this.hp <= 0) {
            window.soundEngine.playGameOver();
            if (effects) {
                effects.addComicSplash(this.x, this.y, 'K.O!');
                effects.addShockwave(this.x, this.y, 140, 'rgba(255, 59, 48, 0.9)');
            }
        }

        return true;
    }

    heal(amount) {
        const mult = (typeof window !== 'undefined' && window.perkSystem && typeof window.perkSystem.getHealMultiplier === 'function') ? window.perkSystem.getHealMultiplier(this) : 1.0;
        this.hp = Math.min(this.maxHp, this.hp + Math.round(amount * mult));
        this.happyTimer = 40;
    }
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
            if (typeof window.effectsManager.triggerScreenFlash === 'function') window.effectsManager.triggerScreenFlash('#ffd32a', 0.40, 30);
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
        if (window.gameInstance.coopSession && window.networkManager && window.networkManager.connected) {
            window.networkManager.send(window.gameInstance.isCoopGuest ? 'GUEST_SHOOT' : 'HOST_SHOOT', {
                x: Math.round(b.x), y: Math.round(b.y), vx: Number(b.vx.toFixed(2)), vy: Number(b.vy.toFixed(2)),
                damage: b.damage, speed: b.speed, radius: b.radius, type: b.type,
                pierce: b.pierce, maxBounces: b.maxBounces, isChargedBubble: true
            });
        }
        this.recoilOffset = 16;
        this.fireCooldown = 15;

        if (window.soundEngine) {
            if (typeof window.soundEngine.playChargedBubble === 'function') window.soundEngine.playChargedBubble();
            else window.soundEngine.playShoot('charged_bubble');
        }
        if (effects) {
            if (typeof effects.addMuzzleFlash === 'function') effects.addMuzzleFlash(muzzleX, muzzleY, shotAngle, 'charged_bubble', 1.3, false);
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

