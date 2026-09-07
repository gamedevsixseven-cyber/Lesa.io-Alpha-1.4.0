/**
 * Lesa.io - Boss Subsystem: Rouf (Wave 20 Final Climax Boss)
 * The neighborhood informant / snitch who calls the police.
 * - Narrative 2.35:1 widescreen cutscene at Wave 20 start
 * - Kiting summoner boss archetype (the hardest boss in Chapter 2)
 * - Attacks:
 *   1. 3-round burst & 5-way fan dial-tone antenna soundwave projectiles
 *   2. Close-quarters heavy brick phone smash (knockback + damage)
 *   3. Ability 1: "100! Emergency Call" (Dispatches Greek Police / Astynomoi)
 *   4. Phase 2 Enrage (<= 50% HP): Calls MAT Riot Squad, 8-way radial soundwaves, overclocked speed
 */

const ROUF_INTRO_DIALOGUES = [
    { speaker: 'ROUF', text: 'Nai, astynomia? Ton vrhka! Einai edw ston dromo kai kanei fasaria!', color: '#fed330', icon: '📱' },
    { speaker: 'HERO', text: 'Poios einai autos re? O Roufianos tou xwriou?!', color: '#3498db', icon: '😎' },
    { speaker: 'ROUF', text: 'Sas eida! Den glytwneis twra, to 100 erxetai!', color: '#e74c3c', icon: '🚨' }
];

const ROUF_ENDING_DIALOGUES = [
    { speaker: 'ROUF', text: 'Astinomike! Epitelous hrthate! Piaste ton! Autos kanei fasaria sto xwrio!', color: '#fed330', icon: '📱' },
    { speaker: 'ASTYNOMOS', text: 'Ti fasaria mas les re mparmpa?! Mas kaleses 47 fores mesa se 5 lepta gia enan typo pou apla kanei th volta tou?!', color: '#3498db', icon: '👮' },
    { speaker: 'HERO', text: 'Kai espase kai to kinito tou...', color: '#2ecc71', icon: '😎' },
    { speaker: 'ASTYNOMOS', text: 'Peraste sto peripoliko gia askopo thlefwnima sto 100 kai diataraksh koinhs hsuxias!', color: '#3498db', icon: '🚨' },
    { speaker: 'ROUF', text: 'POIOS, EGW?! KSERW TON DIMARXO RE! THA SAS KSETRYPWSO OLOUS!', color: '#e74c3c', icon: '😱' },
    { speaker: 'HERO', text: 'Epitelous... hsuxia sto xwrio.', color: '#f1c40f', icon: '🏆' }
];

class Rouf extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0) {
        super(x, y, 'rouf', waveMultiplier);
        this.name = 'Rouf';
        this.isBoss = true;
        this.bossRank = 'hard';
        this.crateAwarded = false;
        this.isChapterBoss = true;
        this.radius = 36;

        // Health Scaling (Final Boss: 6,000 base HP scaled by wave multiplier)
        this.baseMaxHp = Math.round(6000 * Math.max(1.0, waveMultiplier));
        this.maxHp = this.baseMaxHp;
        this.hp = this.maxHp;

        this.baseSpeed = 2.5;
        this.speed = this.baseSpeed;
        this.baseDamage = 35;
        this.damage = this.baseDamage;
        this.xpDrop = 800;

        // --- CUTSCENE STATE MACHINE ---
        // 'WALK_IN' -> 'DIALOGUE_1' -> 'DIALOGUE_2' -> 'DIALOGUE_3' -> 'COMBAT'
        this.cutsceneState = 'WALK_IN';
        this.cutsceneTimer = 0;

        // --- COMBAT & ABILITIES STATE ---
        this.isPhase2 = false;
        this.phase2Triggered = false;

        // Antenna Ranged Attacks
        this.burstCooldown = 75;
        this.burstShotsRemaining = 0;
        this.burstIntervalTimer = 0;
        this.fanCooldown = 190;

        // Close-Quarters Phone Smash
        this.smashCooldown = 60;
        this.smashAnimTimer = 0;

        // Ability 1: Calling the Police
        this.callCooldown = 500; // First call ~8s into fight
        this.isCalling = false;
        this.callTimer = 0;
        this.sirenFlashTimer = 0;

        // Phase 2 Radial Blast Cooldown
        this.radialCooldown = 220;

        // Movement & Animations
        this.walkCycle = 0;
        this.sprintBurstTimer = 0;
        this.shoutTimer = 340;

        // Ending Cutscene State
        this.isDefeated = false;
        this.policeCar = null;
        this.introIndex = 0;
        this.endingIndex = 0;
    }

    takeDamage(amount, effects = null, fromCrit = null, playSound = true) {
        // Invulnerable during introductory or ending cutscene
        if (this.cutsceneState !== 'COMBAT' || this.isDefeated) return;

        this.hp -= amount;
        this.hitFlash = 8;

        if (playSound && window.soundEngine && typeof window.soundEngine.playHit === 'function') {
            window.soundEngine.playHit(false, fromCrit);
        }

        // Check Phase 2 Enrage trigger at <= 50% HP
        if (!this.phase2Triggered && this.hp <= this.maxHp * 0.5) {
            this.triggerPhase2(effects);
        }

        // Ending Cutscene Trigger on Defeat
        if (this.hp <= 0) {
            this.hp = 0;
            this.triggerEndingSequence(effects);
            return false;
        }

        return false;
    }

    triggerEndingSequence(effects) {
        if (this.isDefeated) return;
        this.isDefeated = true;
        this.vx = 0;
        this.vy = 0;
        this.cutsceneState = 'ENDING_CAR_ARRIVE';

        // Clear other active enemies (minion police officers vanish in smoke puffs)
        if (typeof window !== 'undefined' && window.gameInstance) {
            const game = window.gameInstance;
            if (game.enemies) {
                for (let i = 0; i < game.enemies.length; i++) {
                    const e = game.enemies[i];
                    if (e !== this && !e.dead) {
                        e.dead = true;
                        if (effects) {
                            effects.addDust(e.x, e.y, 8, 12);
                        }
                    }
                }
            }
            if (game.bullets) {
                game.bullets = game.bullets.filter(b => !b.isEnemy);
            }
        }

        // Spawn Greek Police Car from off-screen
        this.policeCar = {
            x: this.x - 380,
            y: this.y + 35,
            targetX: this.x - 85,
            targetY: this.y + 20,
            angle: 0,
            arrived: false,
            sirenPhase: 0,
            speed: 5.5
        };

        if (effects) {
            effects.addComicSplash(this.x, this.y - 45, 'CRACK! 📱💥', '#ff4757', 24);
            effects.addDust(this.x, this.y, 14, 16);
            effects.addSparks(this.x + 20, this.y + 10, '#f1c40f', 6);
        }

        if (window.soundEngine && typeof window.soundEngine.playBossWarning === 'function') {
            window.soundEngine.playBossWarning();
        }
    }

    // Boss Immunity: Immune to bubble stasis (pops bubble immediately for burst damage)
    trapInBubble(duration, popDamage) {
        this.takeDamage(popDamage);
        return false;
    }

    triggerPhase2(effects) {
        this.phase2Triggered = true;
        this.isPhase2 = true;
        this.speed = this.baseSpeed * 1.32; // +32% movement speed in desperate panic
        this.callCooldown = 180; // Calls reinforcements much faster

        if (effects) {
            effects.addComicSplash(this.x, this.y - 50, 'STEILTE TA MAT! KINTOYNEVW! 🚨', '#ff4757', 26, true);
            effects.addShockwave(this.x, this.y, 160, 'rgba(235, 77, 75, 0.9)');
            effects.addDust(this.x, this.y, 16, 18);
        }

        if (window.soundEngine && typeof window.soundEngine.playBossWarning === 'function') {
            window.soundEngine.playBossWarning();
        }
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        if (this.hitFlash > 0) this.hitFlash -= dt;

        if (!player || player.hp <= 0) return;

        // Handle Cutscene State
        if (this.cutsceneState !== 'COMBAT') {
            this.updateCutscene(dt, player, effects);
            return;
        }

        // Active Combat
        this.updateCombat(dt, player, enemies, bullets, effects, arena);
    }

    updateCutscene(dt, player, effects) {
        if (!player || player.hp <= 0) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;

        const overlay = (typeof window !== 'undefined' && window.gameInstance && window.gameInstance.cutsceneOverlay)
            ? window.gameInstance.cutsceneOverlay
            : null;

        if (overlay && !overlay.active && this.cutsceneState !== 'COMBAT') {
            overlay.startCutscene('WAVE 20 • BOSS ENCOUNTER');
        }

        // Handle Ending Police Car Arrival
        if (this.cutsceneState === 'ENDING_CAR_ARRIVE') {
            if (this.policeCar) {
                const car = this.policeCar;
                car.sirenPhase += dt * 0.4;
                const cdx = car.targetX - car.x;
                const cdy = car.targetY - car.y;
                const cdist = Math.hypot(cdx, cdy) || 1;
                car.angle = Math.atan2(cdy, cdx);

                if (cdist > 10) {
                    const move = Math.min(car.speed * dt, cdist);
                    car.x += (cdx / cdist) * move;
                    car.y += (cdy / cdist) * move;
                    if (effects && Math.random() < 0.4) {
                        effects.addDust(car.x - 40, car.y, 3, 6);
                    }
                } else {
                    car.x = car.targetX;
                    car.y = car.targetY;
                    car.arrived = true;
                    this.cutsceneState = 'ENDING_DIALOGUE';
                    this.endingIndex = 0;

                    if (effects) {
                        effects.addComicSplash(car.x, car.y - 30, 'SKRRRT! 🚔💨', '#3498db', 22);
                    }

                    if (overlay) {
                        overlay.startCutscene('STORY FINALE • THE POLICE ARRIVE');
                        this.showDialogue(ROUF_ENDING_DIALOGUES[0], player, overlay);
                        overlay.onAdvance = () => this.advanceEndingDialogue(player, effects);
                    }
                }
            }
            return;
        }

        // Wait in dialogue states for player click/space input
        if (this.cutsceneState === 'INTRO_DIALOGUE' || this.cutsceneState === 'ENDING_DIALOGUE') {
            this.vx = 0;
            this.vy = 0;
            this.angle = Math.atan2(dy, dx);
            if (this.policeCar) this.policeCar.sirenPhase += dt * 0.4;
            return;
        }

        if (this.cutsceneState === 'WALK_IN') {
            // Walk slowly towards player with phone against ear
            this.angle = Math.atan2(dy, dx);
            this.vx = (dx / dist) * 2.0;
            this.vy = (dy / dist) * 2.0;
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.walkCycle += 0.15 * dt;

            // Stop at speaking distance (~190px)
            if (dist <= 190) {
                this.cutsceneState = 'INTRO_DIALOGUE';
                this.vx = 0;
                this.vy = 0;
                this.introIndex = 0;

                if (overlay) {
                    this.showDialogue(ROUF_INTRO_DIALOGUES[0], player, overlay);
                    overlay.onAdvance = () => this.advanceCutsceneDialogue(player);
                }
            }
        }
    }

    showDialogue(frame, player, overlay) {
        if (!overlay || !frame) return;
        if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
            window.soundEngine.playSelect();
        }
        const speaker = frame.speaker === 'HERO' ? ((player && player.name) ? player.name.toUpperCase() : 'HERO') : frame.speaker;
        overlay.setDialogue(speaker, frame.text, frame.color, frame.icon, true);
    }

    advanceCutsceneDialogue(player) {
        this.introIndex++;
        const overlay = (typeof window !== 'undefined' && window.gameInstance) ? window.gameInstance.cutsceneOverlay : null;
        if (this.introIndex < ROUF_INTRO_DIALOGUES.length) {
            this.showDialogue(ROUF_INTRO_DIALOGUES[this.introIndex], player, overlay);
        } else {
            this.cutsceneState = 'COMBAT';
            if (overlay) overlay.endCutscene();
            if (window.soundEngine && typeof window.soundEngine.playBossWarning === 'function') {
                window.soundEngine.playBossWarning();
            }
        }
    }

    advanceEndingDialogue(player, effects) {
        this.endingIndex++;
        const overlay = (typeof window !== 'undefined' && window.gameInstance) ? window.gameInstance.cutsceneOverlay : null;
        if (this.endingIndex < ROUF_ENDING_DIALOGUES.length) {
            this.showDialogue(ROUF_ENDING_DIALOGUES[this.endingIndex], player, overlay);
        } else {
            this.cutsceneState = 'DEFEATED_DONE';
            if (overlay) overlay.endCutscene();
            if (effects) effects.addConfetti(this.x, this.y, 50);
            if (!this.crateAwarded) {
                this.crateAwarded = true;
                if (typeof window !== 'undefined' && window.inventoryManager) {
                    window.inventoryManager.addCrate('boss_crate_hard', 1);
                }
            }
            this.dead = true;
        }
    }

    updateCombat(dt, player, enemies, bullets, effects, arena) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;

        // Face player
        this.angle = Math.atan2(dy, dx);

        // Cooldown decrements
        if (this.burstCooldown > 0) this.burstCooldown -= dt;
        if (this.fanCooldown > 0) this.fanCooldown -= dt;
        if (this.smashCooldown > 0) this.smashCooldown -= dt;
        if (this.callCooldown > 0) this.callCooldown -= dt;
        if (this.radialCooldown > 0) this.radialCooldown -= dt;
        if (this.smashAnimTimer > 0) this.smashAnimTimer -= dt;
        if (this.sprintBurstTimer > 0) this.sprintBurstTimer -= dt;

        // 1. Check Melee Punish: Phone Smash (< 75px)
        if (dist <= 75 && this.smashCooldown <= 0 && this.smashAnimTimer <= 0) {
            this.executePhoneSmash(player, dx, dy, dist, effects);
        }

        // 2. Ability 1: Calling the Authorities ("100!")
        if (this.callCooldown <= 0 && !this.isCalling) {
            this.startPoliceCall(effects);
        }

        if (this.isCalling) {
            this.updatePoliceCall(dt, player, enemies, effects);
        }

        // 3. Ranged Attacks: Burst & Fan
        this.updateRangedAttacks(dt, player, bullets, effects, dx, dy, dist);

        // 4. Movement: Cowardly Tactical Kiting
        this.updateKitingMovement(dt, player, dx, dy, dist, arena, enemies);
    }

    executePhoneSmash(player, dx, dy, dist, effects) {
        this.smashCooldown = 90;
        this.smashAnimTimer = 25;
        this.sprintBurstTimer = 75; // Sprint away after swatting

        // Deal heavy melee damage
        player.takeDamage(this.damage * 1.35, effects);

        // Heavy Knockback to player
        const kx = (dx / dist) * 140;
        const ky = (dy / dist) * 140;
        player.x += kx;
        player.y += ky;

        if (effects) {
            effects.addComicSplash(this.x, this.y - 40, 'MH ME AGGIZETE! 📱💥', '#ff4757', 22);
            effects.addShockwave(this.x, this.y, 90, 'rgba(254, 211, 48, 0.9)');
            effects.addDust(this.x, this.y, 10, 14);
        }

        if (window.soundEngine && typeof window.soundEngine.playHit === 'function') {
            window.soundEngine.playHit(true, true);
        }
    }

    startPoliceCall(effects) {
        this.isCalling = true;
        this.callTimer = 65; // ~1.1 seconds channeling
        this.callCooldown = this.isPhase2 ? 420 : 680; // Periodic calls

        if (effects) {
            effects.addComicSplash(this.x, this.y - 45, '📞 100? EDO EINAI! 🚨', '#fed330', 22);
            effects.addShockwave(this.x, this.y, 120, 'rgba(52, 152, 219, 0.8)');
        }

        if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
            window.soundEngine.playSelect();
        }
    }

    updatePoliceCall(dt, player, enemies, effects) {
        this.callTimer -= dt;

        if (this.callTimer <= 0) {
            this.isCalling = false;
            // Dispatch 2-3 Police Officers
            const count = this.isPhase2 ? 3 : 2;
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const spawnDist = 380 + Math.random() * 100;
                const sx = this.x + Math.cos(angle) * spawnDist;
                const sy = this.y + Math.sin(angle) * spawnDist;

                const isMAT = this.isPhase2 && (i === 0 || Math.random() < 0.6);
                if (typeof Astynomos !== 'undefined') {
                    enemies.push(new Astynomos(sx, sy, this.waveMultiplier, isMAT));
                }
            }

            if (effects) {
                effects.addComicSplash(this.x, this.y - 45, this.isPhase2 ? 'MAT INCOMING! 🛡️' : 'PERIPOLIKO! 🚨', '#3498db', 22);
            }
        }
    }

    updateRangedAttacks(dt, player, bullets, effects, dx, dy, dist) {
        // A. 3-round burst execution
        if (this.burstShotsRemaining > 0) {
            this.burstIntervalTimer -= dt;
            if (this.burstIntervalTimer <= 0) {
                this.burstIntervalTimer = 10;
                this.burstShotsRemaining--;
                this.fireSoundwave(player, bullets, effects, 0);
            }
            return;
        }

        // B. Start new 3-round burst
        if (this.burstCooldown <= 0 && dist <= 750) {
            this.burstCooldown = this.isPhase2 ? 50 : 85;
            this.burstShotsRemaining = 3;
            this.burstIntervalTimer = 0;
            return;
        }

        // C. 5-way spread fan
        if (this.fanCooldown <= 0 && dist <= 700) {
            this.fanCooldown = this.isPhase2 ? 140 : 210;
            const angles = [-0.36, -0.18, 0, 0.18, 0.36];
            for (const a of angles) {
                this.fireSoundwave(player, bullets, effects, a);
            }
            if (effects) {
                effects.addComicSplash(this.x, this.y - 40, 'BEEP BEEP BEEP! 📡', '#fed330', 18);
            }
            return;
        }

        // D. Phase 2 Overclocked 8-Way Radial Soundwaves
        if (this.isPhase2 && this.radialCooldown <= 0) {
            this.radialCooldown = 190;
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const vx = Math.cos(angle) * 8.5;
                const vy = Math.sin(angle) * 8.5;
                bullets.push(new Bullet({
                    x: this.x,
                    y: this.y,
                    vx: vx,
                    vy: vy,
                    damage: 22,
                    speed: 8.5,
                    radius: 10,
                    type: 'soundwave',
                    isEnemy: true,
                    range: 650,
                    shooter: this
                }));
            }
            if (effects) {
                effects.addShockwave(this.x, this.y, 110, 'rgba(254, 211, 48, 0.85)');
            }
        }
    }

    fireSoundwave(player, bullets, effects, angleOffset = 0) {
        const baseAngle = Math.atan2(player.y - this.y, player.x - this.x) + angleOffset;
        const speed = 9.5;
        const vx = Math.cos(baseAngle) * speed;
        const vy = Math.sin(baseAngle) * speed;

        bullets.push(new Bullet({
            x: this.x,
            y: this.y,
            vx: vx,
            vy: vy,
            damage: 26,
            speed: speed,
            radius: 9,
            type: 'soundwave',
            isEnemy: true,
            range: 750,
            shooter: this
        }));

        if (effects && Math.random() < 0.4) {
            effects.addSparks(this.x, this.y - 20, '#fed330', 3);
        }
    }

    updateKitingMovement(dt, player, dx, dy, dist, arena, enemies) {
        // While channeling call or performing melee swat, slow down
        if (this.isCalling || this.smashAnimTimer > 0) {
            this.vx *= 0.5;
            this.vy *= 0.5;
            return;
        }

        let moveSpeed = this.speed;
        if (this.sprintBurstTimer > 0) moveSpeed *= 1.5;

        // Desired distance from player: ~240px to 330px
        if (dist < 230) {
            // Player too close: retreat in opposite direction
            this.vx = (-dx / dist) * moveSpeed;
            this.vy = (-dy / dist) * moveSpeed;
        } else if (dist > 350) {
            // Player too far: advance to maintain combat pressure
            this.vx = (dx / dist) * (moveSpeed * 0.9);
            this.vy = (dy / dist) * (moveSpeed * 0.9);
        } else {
            // Strafe laterally around player
            const perpAngle = Math.atan2(dy, dx) + Math.PI / 2;
            this.vx = Math.cos(perpAngle) * (moveSpeed * 0.85);
            this.vy = Math.sin(perpAngle) * (moveSpeed * 0.85);
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.walkCycle += 0.2 * dt;

        this.applySeparation(enemies);
        this.applyArenaBounds(arena);
    }

    draw(ctx) {
        if (typeof RoufRenderer !== 'undefined') {
            RoufRenderer.draw(this, ctx);
        } else {
            super.draw(ctx);
        }
    }
}

if (typeof window !== 'undefined') {
    window.Rouf = Rouf;
}
