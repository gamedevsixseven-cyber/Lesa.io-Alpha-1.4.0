/**
 * Lesa.io - Base Enemy Class
 * Shared enemy functionality, overhead HUD, health, and hit flash
 */

class EnemyBase {
    constructor(x, y, type, waveMultiplier = 1.0) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.type = type;
        this.waveMultiplier = waveMultiplier;

        this.hp = 100;
        this.maxHp = 100;
        this.speed = 3;
        this.damage = 20;
        this.radius = 26;
        this.name = 'Enemy';
        this.color = '#ff4757';
        this.xpDrop = 25;

        this.angle = 0;
        this.hitFlash = 0;
        this.dead = false;
        this.age = Math.random() * 100;
        this.walkCycle = 0;

        // Water Balloon (Nerobalonaki) Debuff State
        this.waterDrenchedTimer = 0;
        this.waterSlowMultiplier = 1.0;
        this.damageVulnerabilityMultiplier = 1.0;

        // Bubble Gun Stasis / Trap State (Right-Click Big Bubble)
        this.bubbleTrappedTimer = 0; // In frames (120 = 2 seconds)
        this.bubbleTrapPopDamage = 25;
        this.bubbleTrapAge = 0;

        // Stun State (Seismic Quake)
        this.stunTimer = 0;

        // Fear State (Yaya Scream)
        this.fearTimer = 0;

        // Ice Slow State (Frappes+ Pagakia)
        this.iceSlowTimer = 0;
        this.iceSlowMultiplier = 1.0;
    }

    takeDamage(amount, effects = null, fromCrit = null, playSound = true) {
        let finalAmount = amount;
        const isDrenched = this.waterDrenchedTimer > 0;
        if (isDrenched) {
            // Take +30% amplified damage when drenched by Nerobalonaki!
            finalAmount = Math.round(amount * (this.damageVulnerabilityMultiplier || 1.30));
        }

        this.hp -= finalAmount;
        this.hitFlash = 8;

        const isCrit = (fromCrit !== null && fromCrit !== undefined) ? fromCrit : (Math.random() < 0.25);
        if (playSound && window.soundEngine) {
            window.soundEngine.playHit(true, isCrit);
        }

        if (effects) {
            effects.addDamage(this.x, this.y, finalAmount, isCrit, false, isDrenched);
            effects.addSparks(this.x, this.y, this.type === 'fatmir' ? '#eb4d4b' : '#2ed573', 5);
            if (isDrenched) {
                effects.addSparks(this.x, this.y - 12, '#00d2d3', 3);
            }
        }

        if (this.hp <= 0) {
            this.dead = true;
            if (window.soundEngine) {
                window.soundEngine.playKill();
            }
            if (typeof window !== 'undefined' && window.EventBus) {
                window.EventBus.emit('enemyKilled', {
                    enemyType: this.type,
                    x: this.x,
                    y: this.y,
                    scoreValue: this.scoreValue
                });
            }
            if (effects) {
                effects.addComicSplash(this.x, this.y, 'K.O!');
                effects.addDust(this.x, this.y, 8, 14);
            }
            return true; // Killed
        }
        return false;
    }

    applySeparation(enemies) {
        // High-Performance Separation with Push Budget (Prevents O(N^2) CPU spikes in massive swarms)
        const myX = this.x;
        const myY = this.y;
        const myRad = this.radius;
        let appliedPushes = 0;

        for (let i = 0; i < enemies.length; i++) {
            const other = enemies[i];
            if (other === this || other.dead) continue;

            const minDist = myRad + other.radius;
            const edx = myX - other.x;
            if (Math.abs(edx) >= minDist) continue;

            const edy = myY - other.y;
            if (Math.abs(edy) >= minDist) continue;

            const distSq = edx * edx + edy * edy;
            if (distSq > 0 && distSq < minDist * minDist) {
                const edist = Math.sqrt(distSq);
                const push = (minDist - edist) * 0.08;
                this.x += (edx / edist) * push;
                this.y += (edy / edist) * push;
                appliedPushes++;
                if (appliedPushes >= 5) break; // Maximum push saturation reached
            }
        }
    }

    applyArenaBounds(arena) {
        if (!arena) return;
        if (this.x - this.radius < -arena.halfWidth) this.x = -arena.halfWidth + this.radius;
        if (this.x + this.radius > arena.halfWidth) this.x = arena.halfWidth - this.radius;
        if (this.y - this.radius < -arena.halfHeight) this.y = -arena.halfHeight + this.radius;
        if (this.y + this.radius > arena.halfHeight) this.y = arena.halfHeight - this.radius;
    }

    updateDebuffs(dt = 1) {
        if (this.waterDrenchedTimer > 0) {
            this.waterDrenchedTimer -= dt;
            if (this.waterDrenchedTimer <= 0) {
                this.waterSlowMultiplier = 1.0;
                this.damageVulnerabilityMultiplier = 1.0;
            }
        }
        if (this.iceSlowTimer > 0) {
            this.iceSlowTimer -= dt;
            if (this.iceSlowTimer <= 0) {
                this.iceSlowMultiplier = 1.0;
            }
        }
    }

    getEffectiveSpeed() {
        let mult = 1.0;
        if (this.waterDrenchedTimer > 0) mult *= (this.waterSlowMultiplier || 0.55);
        if (this.iceSlowTimer > 0) mult *= (this.iceSlowMultiplier || 0.50);
        return this.speed * mult;
    }

    applyStun(durationSeconds = 2.0, effects = null) {
        this.stunTimer = Math.max(this.stunTimer, Math.round(durationSeconds * 60));
        this.vx = 0;
        this.vy = 0;
        if (this.isCharging !== undefined) {
            this.isCharging = false;
            this.chargeWindup = 0;
        }
        if (effects) {
            effects.addComicSplash(this.x, this.y - 25, 'STUNNED! 💫');
            effects.addSparks(this.x, this.y, '#f1c40f', 6);
        }
    }

    applyFear(durationSeconds = 3.0, effects = null) {
        const duration = this.isBoss ? durationSeconds * 0.5 : durationSeconds;
        this.fearTimer = Math.max(this.fearTimer, Math.round(duration * 60));
        if (effects) {
            effects.addComicSplash(this.x, this.y - 25, '😱 FLEE!');
            effects.addSparks(this.x, this.y, '#74b9ff', 6);
        }
    }

    applyIceSlow(durationSeconds = 3.0, slowMultiplier = 0.50, effects = null) {
        this.iceSlowTimer = Math.max(this.iceSlowTimer, Math.round(durationSeconds * 60));
        this.iceSlowMultiplier = Math.min(this.iceSlowMultiplier, slowMultiplier);
        if (effects && Math.random() < 0.35) {
            effects.addSparks(this.x, this.y, '#00cec9', 4);
        }
    }

    updateStun(dt = 1, effects = null) {
        if (this.stunTimer <= 0) return false;
        this.stunTimer -= dt;
        this.vx = 0;
        this.vy = 0;
        if (effects && Math.floor(this.age) % 15 === 0) {
            effects.addSparks(this.x, this.y - this.radius, '#f1c40f', 2);
        }
        return true;
    }

    updateFear(dt = 1, player = null, effects = null) {
        if (this.fearTimer <= 0) return false;
        this.fearTimer -= dt;
        if (player) {
            const fdir = Math.atan2(this.y - player.y, this.x - player.x);
            const fleeSpeed = this.getEffectiveSpeed() * 1.25;
            this.vx = Math.cos(fdir) * fleeSpeed;
            this.vy = Math.sin(fdir) * fleeSpeed;
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.angle = fdir;
        }
        if (effects && Math.floor(this.age) % 12 === 0) {
            effects.addSparks(this.x, this.y - this.radius, '#74b9ff', 2);
        }
        return true;
    }

    drawOverheadHUD(ctx) {
        const hudY = this.y - this.radius - 14;

        // Name tag & Status Indicator
        ctx.save();
        ctx.font = '800 12px "Luckiest Guy", "Fredoka", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#1e272e';

        let displayName = this.name;
        if (this.stunTimer > 0) {
            displayName = `💫 ${(this.stunTimer / 60).toFixed(1)}s`;
            ctx.fillStyle = '#f1c40f';
        } else if (this.fearTimer > 0) {
            displayName = `😱 FLEEING (${(this.fearTimer / 60).toFixed(1)}s)`;
            ctx.fillStyle = '#74b9ff';
        } else if (this.iceSlowTimer > 0) {
            displayName = `${this.name} 🧊 -50%`;
            ctx.fillStyle = '#00cec9';
        } else if (this.waterDrenchedTimer > 0) {
            displayName = `${this.name} 💧 -45%`;
            ctx.fillStyle = this.type === 'fatmir' ? '#ff6b6b' : '#2ed573';
        } else {
            ctx.fillStyle = this.type === 'fatmir' ? '#ff6b6b' : '#2ed573';
        }

        ctx.strokeText(displayName, this.x, hudY - 3);
        ctx.fillText(displayName, this.x, hudY - 3);

        // Health Bar
        const barW = this.type === 'fatmir' ? 46 : 36;
        const barH = 5;
        const hpRatio = Math.max(0, this.hp / this.maxHp);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#1e272e';
        ctx.fillStyle = '#2f3542';
        ctx.fillRect(this.x - barW / 2, hudY, barW, barH);
        ctx.strokeRect(this.x - barW / 2, hudY, barW, barH);

        ctx.fillStyle = this.type === 'fatmir' ? '#eb4d4b' : '#20bf6b';
        ctx.fillRect(this.x - barW / 2, hudY, barW * hpRatio, barH);

        // Trapped in Bubble Indicator Tag
        if (this.bubbleTrappedTimer > 0) {
            const timeLeftSec = (this.bubbleTrappedTimer / 60).toFixed(1);
            ctx.fillStyle = '#00d2d3';
            ctx.font = '800 11px "Luckiest Guy", cursive';
            ctx.strokeText(`🫧 TRAPPED (${timeLeftSec}s)`, this.x, hudY - 14);
            ctx.fillText(`🫧 TRAPPED (${timeLeftSec}s)`, this.x, hudY - 14);
        }

        ctx.restore();
    }

    trapInBubble(durationSeconds = 2.0, popDamage = 25) {
        if (this.isBoss || this.isMiniBoss) return; // Bosses cannot go in the bubble
        this.bubbleTrappedTimer = Math.round(durationSeconds * 60); // 120 frames at 60fps = 2 seconds
        this.bubbleTrapPopDamage = popDamage;
        this.bubbleTrapAge = 0;
        this.vx = 0;
        this.vy = 0;
    }

    updateBubbleTrap(dt = 1, effects = null) {
        if (this.bubbleTrappedTimer <= 0) return false;

        this.bubbleTrappedTimer -= dt;
        this.bubbleTrapAge += dt;
        this.vx = 0;
        this.vy = 0;

        // Bob gently up and down while floating in stasis
        this.y += Math.sin(this.bubbleTrapAge * 0.15) * 0.45;

        // When the 2 seconds expire, POP!
        if (this.bubbleTrappedTimer <= 0) {
            this.bubbleTrappedTimer = 0;
            if (window.soundEngine) {
                window.soundEngine.playShoot('bubble');
            }
            if (effects) {
                effects.addComicSplash(this.x, this.y - 25, '🫧 POP!');
                effects.addSparks(this.x, this.y, '#70a1ff', 8);
                effects.addSparks(this.x, this.y, '#00d2d3', 6);
            }
            this.takeDamage(this.bubbleTrapPopDamage, effects);
        }

        return true; // Enemy is immobilized
    }

    drawBubbleTrap(ctx) {
        if (this.bubbleTrappedTimer <= 0) return;

        ctx.save();
        const r = this.radius * 1.45;
        const wobble = Math.sin(this.bubbleTrapAge * 0.2) * (r * 0.05);

        // Translucent iridescent bubble enclosing the trapped enemy
        const bubbleGrad = ctx.createRadialGradient(this.x - r * 0.3, this.y - r * 0.3, r * 0.1, this.x, this.y, r);
        bubbleGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        bubbleGrad.addColorStop(0.35, 'rgba(112, 161, 255, 0.45)');
        bubbleGrad.addColorStop(0.7, 'rgba(0, 206, 201, 0.5)');
        bubbleGrad.addColorStop(0.95, 'rgba(224, 86, 253, 0.6)');
        bubbleGrad.addColorStop(1, 'rgba(112, 161, 255, 0.75)');

        ctx.fillStyle = bubbleGrad;
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 2.4;

        ctx.beginPath();
        ctx.arc(this.x, this.y, r + wobble, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Rainbow soap film ring
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(this.x, this.y, (r + wobble) * 0.88, 0, Math.PI * 2);
        ctx.stroke();

        // Gloss highlights
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(this.x - r * 0.45, this.y - r * 0.45, r * 0.35, r * 0.18, -0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x + r * 0.45, this.y + r * 0.45, r * 0.14, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
