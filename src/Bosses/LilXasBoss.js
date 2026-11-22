/**
 * Lesa.io - Lil Xas Secret Easter Egg Boss Entity
 * A kid rapper whose trash beats hurt everyone's ears: protected by a 65% Bass Shield & slow regen
 * while his 4 Concert Speakers live, unleashing Spotlight Lasers, Bass Vortex pulls,
 * Paparazzi Flashes, Freestyle Double-Helix Spirals, Autotune Fans, Bass Drops & VIP Mic Slams.
 */

class LilXasBoss extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0) {
        super(x, y, 'lil_xas', waveMultiplier);
        this.name = 'Lil Xas';
        this.isBoss = true;
        this.isMiniBoss = false;
        this.isEndlessBoss = true;
        this.isLilXas = true;
        this.radius = 34;
        this.color = '#a855f7';

        this.maxHp = Math.round(16500 * Math.max(1.0, waveMultiplier * 1.15));
        this.hp = this.maxHp;
        this.speed = 3.35;
        this.damage = Math.round(38 * Math.max(1.0, waveMultiplier * 0.55));
        this.xpDrop = 1600;
        this.scoreValue = 8000;
        this.goldBonus = 1800;
        this.xpBonus = 1200;
        this.crateId = 'boss_crate_insane';

        this.inCutscene = false;
        this.hasSpeakerShield = false;
        this.enraged = false;
        this.zones = [];

        this.noteCooldown = 68;
        this.bassCooldown = 165;
        this.dashCooldown = 120;
        this.dashTimer = 0;
        this.dashVx = 0;
        this.dashVy = 0;
        this.chatterTimer = 175;
        if (typeof LilXasAttacksFX !== 'undefined') LilXasAttacksFX.initBossState(this);
    }

    takeDamage(amount, effects = null, fromCrit = null, playSound = true) {
        if (this.inCutscene || this.dead || this.isAirborneImmune) return false;
        const scaled = this.hasSpeakerShield ? Math.max(1, Math.round(amount * 0.35)) : amount;
        if (this.hasSpeakerShield && effects && Math.random() < 0.2) {
            effects.addComicSplash(this.x, this.y - 52, '🔊 65% BASS SHIELD!');
        }
        const killed = super.takeDamage(scaled, effects, fromCrit, playSound);
        if ((this.hp <= 0 || this.dead) && typeof LilXasEvent !== 'undefined') {
            LilXasEvent.onBossDefeated(this, typeof window !== 'undefined' ? window.gameInstance : null);
        }
        return killed;
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        if (this.hitFlash > 0) this.hitFlash -= dt;
        this.updateDebuffs(dt);

        if (this.inCutscene || !player || player.hp <= 0) return;

        // Sync Bass Shield + concert regen while any speaker remains alive
        const activeSpeakers = Array.isArray(enemies)
            ? enemies.filter(e => e && !e.dead && e.isLilXasSpeaker).length
            : 0;
        const prevShield = this.hasSpeakerShield;
        this.hasSpeakerShield = activeSpeakers > 0;
        if (this.hasSpeakerShield && this.hp < this.maxHp) {
            this.hp = Math.min(this.maxHp, this.hp + activeSpeakers * 0.16 * dt);
        }
        if ((prevShield && !this.hasSpeakerShield) || (!this.enraged && this.hp <= this.maxHp * 0.55)) {
            this.enraged = true;
            this.speed = 4.05;
            if (effects) {
                effects.addShockwave(this.x, this.y, 180, 'rgba(0, 245, 255, 0.94)');
                effects.addComicSplash(this.x, this.y - 60, !this.hasSpeakerShield ? '😡 YOU BROKE MY SPEAKERS?!' : '🔥 SICKO MODE ACTIVATED!! 🎤');
            }
        }

        if (typeof LilXasAttacksFX !== 'undefined') {
            LilXasAttacksFX.update(this, dt, player, bullets, effects, arena);
            if (this.leapSlam) return;
        }

        // Active Telegraphed Bass-Drop Zones
        for (let i = this.zones.length - 1; i >= 0; i--) {
            const z = this.zones[i];
            z.timer -= dt;
            if (z.timer <= 0) {
                this._detonateBassDrop(z, player, effects);
                this.zones.splice(i, 1);
            }
        }

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);

        if (this.dashTimer > 0) {
            this.dashTimer -= dt;
            this.x += this.dashVx * dt;
            this.y += this.dashVy * dt;
            this.walkCycle += 0.38 * dt;
            if (effects && Math.random() < 0.65) effects.addSparks(this.x, this.y, '#e056fd', 2);
        } else if (!this.laserBeam) {
            const moveSpd = this.getEffectiveSpeed();
            let moveAngle = this.angle;
            if (dist < 170) moveAngle = this.angle + Math.PI * 0.72;
            else if (dist < 290) moveAngle = this.angle + Math.PI * 0.42;

            this.vx = Math.cos(moveAngle) * moveSpd;
            this.vy = Math.sin(moveAngle) * moveSpd;
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.walkCycle += 0.24 * dt;
        }
        this.applyArenaBounds(arena);

        this.chatterTimer -= dt;
        if (this.chatterTimer <= 0 && effects) {
            this.chatterTimer = 175 + Math.random() * 120;
            const lines = this.enraged
                ? ['MY MIXTAPE!! 🔥', 'CHECK MY FLOW!! 🎤', 'STOP HATING!! 😡', 'GOAT MODE!! 🐐']
                : ['LIL XAS IN THE HOUSE!! 🎤', 'FIRE BEATS!! 🔥', 'NO CAP!! 💯'];
            effects.addComicSplash(this.x, this.y - 54, lines[Math.floor(Math.random() * lines.length)], '#f472b6');
        }

        // Signature Special Attack Rotation
        this.specialCooldown -= dt;
        if (this.specialCooldown <= 0 && typeof LilXasAttacksFX !== 'undefined') {
            this.specialCooldown = this.enraged ? 120 : 158;
            const step = this.specialCycle % (this.enraged ? 5 : 4);
            this.specialCycle++;
            if (step === 0) LilXasAttacksFX.startSpotlightLaser(this, player, effects);
            else if (step === 1) LilXasAttacksFX.startBassVortex(this, player, effects);
            else if (step === 2) LilXasAttacksFX.startPaparazziNova(this, effects);
            else if (step === 3) {
                this.spiralShotsLeft = this.enraged ? 24 : 16;
                this.spiralAngle = this.angle;
                if (effects) effects.addComicSplash(this.x, this.y - 62, '🎤 FREESTYLE OVERDRIVE!! 🔥', '#00f5ff');
            } else {
                LilXasAttacksFX.startMicLeapSlam(this, player, effects);
            }
        }

        // Autotune Note Fan + Gold Vinyl Discs
        this.noteCooldown -= dt;
        if (this.noteCooldown <= 0 && !this.laserBeam && typeof Bullet !== 'undefined') {
            this.noteCooldown = this.enraged ? 46 : 68;
            const count = this.enraged ? 7 : 5;
            const spread = 0.21;
            const spd = this.enraged ? 9.2 : 7.8;
            const projDmg = Math.max(15, Math.round(this.damage * 0.78));
            for (let i = 0; i < count; i++) {
                const offset = (i - (count - 1) / 2) * spread;
                const a = this.angle + offset;
                const isVinyl = (i === Math.floor(count / 2));
                bullets.push(new Bullet({
                    x: this.x + Math.cos(a) * 28,
                    y: this.y + Math.sin(a) * 28,
                    vx: Math.cos(a) * spd,
                    vy: Math.sin(a) * spd,
                    damage: isVinyl ? Math.round(projDmg * 1.25) : projDmg,
                    speed: spd,
                    radius: isVinyl ? 13 : 11,
                    type: isVinyl ? 'lil_xas_vinyl' : 'lil_xas_note',
                    isEnemy: true,
                    shooter: this,
                    color: isVinyl ? '#facc15' : (i % 2 === 0 ? '#e056fd' : '#00f5ff'),
                    range: 920
                }));
            }
            if (effects) effects.addSparks(this.x + Math.cos(this.angle) * 24, this.y + Math.sin(this.angle) * 24, '#e056fd', 5);
        }

        // Multi-Zone Telegraphed Trash Bass Drop
        this.bassCooldown -= dt;
        if (this.bassCooldown <= 0) {
            this.bassCooldown = this.enraged ? 135 : 185;
            const drops = this.enraged ? 3 : 2;
            for (let d = 0; d < drops; d++) {
                const ang = (d / drops) * Math.PI * 2 + Math.random() * 0.8;
                const distOff = d === 0 ? 0 : 125;
                this.zones.push({
                    x: player.x + Math.cos(ang) * distOff,
                    y: player.y + Math.sin(ang) * distOff,
                    radius: 112,
                    timer: 58,
                    maxTimer: 58,
                    color: 'rgba(224, 86, 253, 0.92)',
                    fillColor: 'rgba(224, 86, 253, 0.24)',
                    icon: '🔊'
                });
            }
            if (effects) effects.addComicSplash(this.x, this.y - 48, 'BASS DROP!! 🔊');
        }

        // VIP Clout Slide Dash
        this.dashCooldown -= dt;
        if (this.dashCooldown <= 0 && !this.laserBeam && dist > 130) {
            this.dashCooldown = this.enraged ? 105 : 155;
            this.dashTimer = 24;
            const dSpd = this.enraged ? 10.6 : 8.8;
            this.dashVx = Math.cos(this.angle) * dSpd;
            this.dashVy = Math.sin(this.angle) * dSpd;
            if (effects) effects.addDust(this.x, this.y, 6, 10);
        }
    }

    _detonateBassDrop(z, player, effects) {
        if (effects) {
            effects.addShockwave(z.x, z.y, z.radius * 1.15, 'rgba(224, 86, 253, 0.92)');
            effects.addSparks(z.x, z.y, '#00f5ff', 10);
            effects.addComicSplash(z.x, z.y - 24, 'BOOM! 🎵');
        }
        const cam = (typeof window !== 'undefined' && window.gameInstance) ? window.gameInstance.camera : null;
        if (cam) cam.addShake(10);
        if (player && player.hp > 0 && Math.hypot(player.x - z.x, player.y - z.y) <= z.radius + player.radius * 0.4) {
            player.takeDamage(Math.round(this.damage * 1.15), effects, cam);
        }
    }

    draw(ctx) {
        if (typeof LilXasRenderer !== 'undefined') {
            LilXasRenderer.drawLilXas(ctx, this);
        }
    }
}

if (typeof window !== 'undefined') {
    window.LilXasBoss = LilXasBoss;
}
