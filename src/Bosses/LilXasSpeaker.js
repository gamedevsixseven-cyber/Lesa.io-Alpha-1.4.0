/**
 * Lesa.io - Lil Xas Destructible Concert Speaker Entity
 * Blasts trash beats that slow the player and inflict ear-bleed damage until shattered.
 */

class LilXasSpeaker extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0, speakerIndex = 0) {
        super(x, y, 'lil_xas_speaker', waveMultiplier);
        this.name = `Concert Speaker ${speakerIndex + 1}`;
        this.speakerIndex = speakerIndex;
        this.isStationary = true;
        this.isLilXasSpeaker = true;
        this.isBoss = false;
        this.isMiniBoss = false;
        this.radius = 30;
        this.hudOffsetY = 56;
        this.color = '#e056fd';

        this.maxHp = Math.round(3400 * Math.max(1.0, waveMultiplier * 1.1));
        this.hp = this.maxHp;
        this.baseSpeed = 0;
        this.speed = 0;
        this.damage = Math.round(14 * Math.max(1.0, waveMultiplier * 0.35));
        this.xpDrop = 220;
        this.scoreValue = 650;

        this.musicPlaying = true;
        this.shatterHandled = false;
        this.pulseCooldown = 120 + speakerIndex * 45;
    }

    // Anchored stage equipment — immune to crowd control and displacement
    applySeparation() {}
    applyStun() {}
    applyFear() {}
    applyIceSlow() {}
    applySonicSlow() {}
    trapInBubble() {}

    takeDamage(amount, effects = null, fromCrit = null, playSound = true) {
        if (this.dead) return false;
        const killed = super.takeDamage(amount, effects, fromCrit, playSound);
        this.hitFlash = Math.max(this.hitFlash, 6);
        if (effects && Math.random() < 0.45) {
            effects.addSparks(this.x, this.y - 12, '#e056fd', 4);
        }
        if ((this.hp <= 0 || this.dead) && !this.shatterHandled) {
            this.onShatter(effects);
        }
        return killed;
    }

    onShatter(effects = null) {
        if (this.shatterHandled) return;
        this.shatterHandled = true;
        this.musicPlaying = false;
        this.dead = true;
        if (effects) {
            effects.addShockwave(this.x, this.y, 125, 'rgba(224, 86, 253, 0.9)');
            effects.addSparks(this.x, this.y - 10, '#e056fd', 14);
            effects.addSparks(this.x, this.y - 10, '#00f5ff', 10);
            effects.addComicSplash(this.x, this.y - 36, '🔇 SPEAKER SMASHED!');
        }
        if (typeof LilXasEvent !== 'undefined' && typeof LilXasEvent.onSpeakerDestroyed === 'function') {
            LilXasEvent.onSpeakerDestroyed(this, effects);
        }
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null) {
        this.age += dt;
        if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt);
        if (this.hp <= 0 && !this.shatterHandled) {
            this.onShatter(effects);
            return;
        }
        if (this.musicPlaying && player && player.hp > 0 && (typeof LilXasEvent === 'undefined' || LilXasEvent.phase === 'COMBAT')) {
            this.pulseCooldown -= dt;
            if (this.pulseCooldown <= 0 && typeof Bullet !== 'undefined') {
                this.pulseCooldown = 195;
                const aim = Math.atan2(player.y - this.y, player.x - this.x);
                for (const off of [-0.22, 0.22]) {
                    const a = aim + off;
                    bullets.push(new Bullet({
                        x: this.x + Math.cos(a) * 24, y: this.y + Math.sin(a) * 24,
                        vx: Math.cos(a) * 6.2, vy: Math.sin(a) * 6.2,
                        damage: this.damage || 14, speed: 6.2, radius: 10,
                        type: 'lil_xas_note', isEnemy: true, shooter: this, color: '#00f5ff', range: 780
                    }));
                }
                if (effects) effects.addShockwave(this.x, this.y, 75, 'rgba(0, 245, 255, 0.55)');
            }
        }
    }

    draw(ctx) {
        if (typeof LilXasAttacksFX !== 'undefined' && typeof LilXasEvent !== 'undefined' && LilXasEvent.boss) {
            LilXasAttacksFX.drawSpeakerTether(ctx, this, LilXasEvent.boss);
        }
        if (typeof LilXasRenderer !== 'undefined') {
            LilXasRenderer.drawSpeaker(ctx, this);
        }
    }
}

if (typeof window !== 'undefined') {
    window.LilXasSpeaker = LilXasSpeaker;
}
