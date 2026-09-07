/**
 * Lesa.io - Boss Subsystem: Kiloumpas Mini-Boss Entity
 * Wave 15 Mini-Boss:
 * - Shirtless, fat, big-stomached angry old Greek villager
 * - Interactive Cutscene at Wave 15 Start:
 *   1. Approaches empty-handed: "Thes na parw thn karampina?"
 *   2. Player responds automatically: "Ferthn!"
 *   3. Leaves, returns in 3 seconds with the Hunting Carbine (Karampina)
 * - Combat Mechanics:
 *   1. Relentlessly hunts player, firing high-damage Carbine rifle rounds
 *   2. Close-range Grab & Throw: If player gets too close, grabs and hurls player far across the arena for heavy damage
 */

class Kiloumpas extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0) {
        super(x, y, 'kiloumpas', waveMultiplier);
        this.name = 'Kiloumpas';
        this.isBoss = true;
        this.isMiniBoss = true;
        this.radius = 38;

        // Health Scaling (Mini-boss pool: 2,500 base)
        this.baseMaxHp = Math.round(2500 * Math.max(1.0, waveMultiplier));
        this.maxHp = this.baseMaxHp;
        this.hp = this.maxHp;

        this.baseSpeed = 2.4;
        this.speed = this.baseSpeed;
        this.baseDamage = 28;
        this.damage = this.baseDamage;
        this.xpDrop = 400;

        // Appearance
        this.isShirtless = true;
        this.hasCarbine = false; // Starts empty-handed during cutscene
        this.hidden = false;

        // --- CUTSCENE STATE MACHINE ---
        // 'WALK_IN' -> 'DIALOGUE_1' -> 'DIALOGUE_2' -> 'WALK_OUT' -> 'WAIT_3S' -> 'COMBAT'
        this.cutsceneState = 'WALK_IN';
        this.cutsceneTimer = 0;
        this.wait3sTimer = 180; // 3.0 seconds at 60fps
        this.retreatAngle = 0;

        // --- COMBAT STATE ---
        this.shootTimer = 70;
        this.isAiming = false;
        this.aimDuration = 0;
        this.isGrabbing = false;
        this.grabHoldTimer = 0;
        this.throwAnimTimer = 0;
        this.grabCooldown = 40;
        this.shoutTimer = 280;
    }

    takeDamage(amount, effects = null, fromCrit = null, playSound = true) {
        // Invulnerable during introductory cutscene
        if (this.cutsceneState !== 'COMBAT') return;
        super.takeDamage(amount, effects, fromCrit, playSound);
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        if (this.hitFlash > 0) this.hitFlash -= dt;

        if (!player || player.hp <= 0) return;

        // Handle Cutscene Sequence
        if (this.cutsceneState !== 'COMBAT') {
            this.updateCutscene(dt, player, effects);
            return;
        }

        // Handle Active Combat
        this.updateCombat(dt, player, enemies, bullets, effects, arena);
    }

    updateCutscene(dt, player, effects) {
        const overlay = (typeof window !== 'undefined' && window.gameInstance && window.gameInstance.cutsceneOverlay)
            ? window.gameInstance.cutsceneOverlay
            : null;

        if (overlay && !overlay.active && this.cutsceneState !== 'COMBAT') {
            overlay.startCutscene('WAVE 15 • MINI-BOSS ENCOUNTER');
        }

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;

        if (this.cutsceneState === 'WALK_IN') {
            // Walk slowly towards player with bare hands
            this.angle = Math.atan2(dy, dx);
            this.vx = (dx / dist) * 2.2;
            this.vy = (dy / dist) * 2.2;
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.walkCycle += 0.16 * dt;

            // Stop at speaking distance (~190px)
            if (dist <= 190) {
                this.cutsceneState = 'DIALOGUE_1';
                this.vx = 0;
                this.vy = 0;

                if (overlay) {
                    overlay.setDialogue('KILOUMPAS', 'Thes na parw thn karampina?', '#ff4757', '👴', true);
                    overlay.onAdvance = () => this.advanceDialogue(player);
                }
                if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
                    window.soundEngine.playSelect();
                }
            }
            return;
        }

        // Wait indefinitely in DIALOGUE_1 or DIALOGUE_2 until player clicks
        if (this.cutsceneState === 'DIALOGUE_1' || this.cutsceneState === 'DIALOGUE_2') {
            this.vx = 0;
            this.vy = 0;
            this.angle = Math.atan2(dy, dx);
            return;
        }

        if (this.cutsceneState === 'WALK_OUT') {
            this.cutsceneTimer -= dt;
            this.angle = this.retreatAngle;
            this.vx = Math.cos(this.retreatAngle) * 3.8;
            this.vy = Math.sin(this.retreatAngle) * 3.8;
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.walkCycle += 0.22 * dt;

            if (this.cutsceneTimer <= 0) {
                // Vanish off-screen for 3 seconds
                this.cutsceneState = 'WAIT_3S';
                this.wait3sTimer = 180; // exactly 3.0 seconds at 60fps
                this.hidden = true;

                if (overlay) {
                    overlay.setDialogue('', '⏱️ 3 SECONDS LATER...', '#fed330', '⏳');
                }
            }
            return;
        }

        if (this.cutsceneState === 'WAIT_3S') {
            this.wait3sTimer -= dt;

            if (this.wait3sTimer <= 0) {
                // After 3 seconds, re-emerge with the Hunting Carbine in hands!
                const spawnAngle = Math.random() * Math.PI * 2;
                this.x = player.x + Math.cos(spawnAngle) * 280;
                this.y = player.y + Math.sin(spawnAngle) * 280;
                this.hidden = false;
                this.hasCarbine = true;
                this.cutsceneState = 'COMBAT';
                this.shootTimer = 45;
                this.grabCooldown = 0;

                // THEN the cutscene ends and the fight starts!
                if (overlay) {
                    overlay.endCutscene();
                }

                if (effects) {
                    effects.addShockwave(this.x, this.y, 140, 'rgba(254, 211, 48, 0.9)');
                    effects.addDust(this.x, this.y, 12, 14);
                }
                if (window.soundEngine && typeof window.soundEngine.playHit === 'function') {
                    window.soundEngine.playHit(true, true);
                }
            }
        }
    }

    advanceDialogue(player) {
        const overlay = (typeof window !== 'undefined' && window.gameInstance && window.gameInstance.cutsceneOverlay)
            ? window.gameInstance.cutsceneOverlay
            : null;

        if (this.cutsceneState === 'DIALOGUE_1') {
            if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
                window.soundEngine.playSelect();
            }
            this.cutsceneState = 'DIALOGUE_2';
            const heroName = (player && player.name) ? player.name.toUpperCase() : 'HERO';
            if (overlay) {
                overlay.setDialogue(heroName, 'Ferthn', '#fed330', '😎', true);
            }
            return;
        }

        if (this.cutsceneState === 'DIALOGUE_2') {
            if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
                window.soundEngine.playSelect();
            }
            this.cutsceneState = 'WALK_OUT';
            this.cutsceneTimer = 95;
            this.retreatAngle = Math.atan2(this.y - player.y, this.x - player.x);
            if (overlay) {
                overlay.clearDialogue();
            }
            return;
        }
    }

    updateCombat(dt, player, enemies, bullets, effects, arena) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;

        this.angle = Math.atan2(dy, dx);
        if (this.grabCooldown > 0) this.grabCooldown -= dt;
        if (this.throwAnimTimer > 0) this.throwAnimTimer -= dt;

        // 0. Handle Active 0.7s Grab Hold
        if (this.isGrabbing) {
            this.updateGrabHold(dt, player, effects);
            return;
        }

        // Periodic Greek Angry Shout
        this.shoutTimer -= dt;
        if (this.shoutTimer <= 0) {
            this.shoutTimer = 480 + Math.random() * 120;
            if (effects) {
                effects.addComicSplash(this.x, this.y - 50, 'POU PAS RE! 💢');
            }
        }

        // ==========================================
        // 🥋 CLOSE-RANGE 0.7s GRAB & AIRBORNE THROW
        // ==========================================
        const grabRange = this.radius + player.radius + 18;
        if (dist <= grabRange && this.grabCooldown <= 0 && !player.isAirborne) {
            this.startGrabHold(player, effects);
            return;
        }

        // ==========================================
        // 🎯 RANGED HUNTING CARBINE SHOT
        // ==========================================
        if (this.isAiming) {
            this.aimDuration -= dt;
            this.vx = 0;
            this.vy = 0;

            if (this.aimDuration <= 0) {
                this.fireCarbine(player, bullets, effects);
            }
            return;
        }

        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && dist >= 90) {
            this.isAiming = true;
            this.aimDuration = 18; // Brief 0.3s aiming windup
            this.vx = 0;
            this.vy = 0;
            return;
        }

        // Relentless pursuit towards player
        this.updateDebuffs(dt);
        const curSpeed = this.getEffectiveSpeed();
        this.vx = (dx / dist) * curSpeed;
        this.vy = (dy / dist) * curSpeed;

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Separation & Bounds
        this.applySeparation(enemies);
        this.applyArenaBounds(arena);

        // Walk animation cycle
        if (Math.abs(this.vx) > 0.2 || Math.abs(this.vy) > 0.2) {
            this.walkCycle += 0.2 * dt;
        }
    }

    startGrabHold(player, effects) {
        this.isGrabbing = true;
        this.grabHoldTimer = 42; // Exactly 0.70 seconds at 60fps
        this.throwAnimTimer = 0;
        this.isAiming = false;
        this.vx = 0;
        this.vy = 0;

        player.isGrabbed = true;
        player.isAirborne = false;
        player.vx = 0;
        player.vy = 0;

        if (effects) {
            effects.addComicSplash(this.x, this.y - 52, 'SE EPIASA! 💢');
            effects.addDust(player.x, player.y, 8, 10);
        }
        if (window.soundEngine && typeof window.soundEngine.playHit === 'function') {
            window.soundEngine.playHit(false, true);
        }
    }

    updateGrabHold(dt, player, effects) {
        this.grabHoldTimer -= dt;
        this.vx = 0;
        this.vy = 0;

        // Face player firmly
        const holdDist = this.radius + (player.radius || 25) - 4;
        const holdX = this.x + Math.cos(this.angle) * holdDist;
        const holdY = this.y + Math.sin(this.angle) * holdDist;

        // Lock player position to Kiloumpas's grip with angry struggle jitter
        const jitter = (Math.random() - 0.5) * 3.5;
        player.x = holdX + jitter;
        player.y = holdY + jitter;
        player.vx = 0;
        player.vy = 0;
        player.isGrabbed = true;

        // Lift player up during the 0.7 second hold (airZ rises from 16px to 38px)
        const liftProgress = Math.min(1.0, Math.max(0, 1.0 - (this.grabHoldTimer / 42)));
        player.airZ = 16 + liftProgress * 22 + Math.sin(this.age * 0.6) * 3;

        if (effects && Math.random() < 0.25 * dt) {
            effects.addDust(player.x, player.y, 1, 3);
        }

        // When 0.7 seconds is up: LAUNCH/THROW THE PLAYER FAR OUT IN THE AIR!
        if (this.grabHoldTimer <= 0) {
            this.isGrabbing = false;
            this.throwAnimTimer = 18;
            this.grabCooldown = 220; // Cooldown before next grab
            this.throwPlayerAirborne(player, effects);
        }
    }

    throwPlayerAirborne(player, effects) {
        player.isGrabbed = false;

        // Calculate throw angle (violently hurling player away)
        let throwAngle = Math.atan2(player.y - this.y, player.x - this.x);
        if (Math.abs(player.x - this.x) < 2 && Math.abs(player.y - this.y) < 2) {
            throwAngle = this.angle;
        }

        // Airborne Parabolic Launch (high in the air and far out, ~520px displacement)
        const launchSpeed = 20.0;
        const verticalLift = 17.5;

        player.launchAirborne(
            Math.cos(throwAngle) * launchSpeed,
            Math.sin(throwAngle) * launchSpeed,
            verticalLift,
            38 // Damage dealt on landing impact
        );

        if (effects) {
            effects.addShockwave(this.x, this.y, 130, 'rgba(255, 71, 87, 0.95)');
            effects.addDust(this.x, this.y, 18, 20);
            effects.addComicSplash(this.x, this.y - 50, 'FYGE RE! 💨');
        }

        if (window.soundEngine && typeof window.soundEngine.playHit === 'function') {
            window.soundEngine.playHit(true, true);
        }
    }

    fireCarbine(player, bullets, effects) {
        this.isAiming = false;
        this.shootTimer = 110 + Math.random() * 30; // ~2.0s attack rate

        // Muzzle position in front of weapon
        const mx = this.x + Math.cos(this.angle) * (this.radius + 26);
        const my = this.y + Math.sin(this.angle) * (this.radius + 26);

        // Bullet velocity with slight spread
        const spread = (Math.random() - 0.5) * 0.08;
        const fireAngle = this.angle + spread;
        const bSpeed = 15;
        const vx = Math.cos(fireAngle) * bSpeed;
        const vy = Math.sin(fireAngle) * bSpeed;

        const BulletClass = (typeof Bullet !== 'undefined') ? Bullet : window.Bullet;
        if (BulletClass) {
            const bullet = new BulletClass({
                x: mx,
                y: my,
                vx: vx,
                vy: vy,
                damage: 30,
                speed: bSpeed,
                radius: 8,
                type: 'carbine',
                isEnemy: true,
                range: 1100,
                shooter: this
            });
            bullets.push(bullet);
        }

        if (effects) {
            effects.addDust(mx, my, 8, 10);
            effects.addSparks(mx, my, '#fed330', 8);
            effects.addComicSplash(this.x, this.y - 45, 'BANG! 💥');
        }

        if (window.soundEngine && typeof window.soundEngine.playShoot === 'function') {
            window.soundEngine.playShoot('watermelon');
        }
    }

    draw(ctx) {
        if (typeof KiloumpasRenderer !== 'undefined') {
            KiloumpasRenderer.draw(this, ctx);
        }
    }
}

if (typeof window !== 'undefined') {
    window.Kiloumpas = Kiloumpas;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Kiloumpas };
}
