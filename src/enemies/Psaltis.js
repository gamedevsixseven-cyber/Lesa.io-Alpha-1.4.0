/**
 * Lesa.io - Enemy: "Psaltis"
 * Playstyle: The Hype Man — Support Singer & Force Multiplier
 * (Not church-based; Psaltis is just his name — think street festival bouzouki-adjacent crooner)
 *
 * Unique Features:
 * 1. 🎵 Anthem Aura: Periodically sings for ~5s; all non-boss allies within 220px gain
 *    +22% move speed & +25% damage while the song lasts (gold pulse ring + note markers).
 * 2. 🤧 Drenched Counterplay: A Nerobalonaki water balloon makes him cough mid-song ("ΓΚΑΓΚΟΥΖΑ!")
 *    and instantly ends the anthem — the classic support-killer answer.
 * 3. 🪘 Tambourine Poke: Lobs a single ringing tambourine soundwave from mid range when not singing.
 * 4. 🎶 High Note Panic Blast: If cornered (< 110px), unleashes a sonic scream that knocks the player back.
 * 5. 📉 Kill-Priority Pressure: Low HP and weak solo damage — ignore him and the whole wave gets meaner.
 */

const PSALTIS_SING_SPLASHES = [
    '♪ OPA OPA! ♪',
    'ΨΑΛΤΕ ΡΕ ΠΑΙΔΙΑ! ♪',
    'ΑΝΤΕ ΓΕΡΑ! 🎵'
];

class Psaltis extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0) {
        super(x, y, 'psaltis', waveMultiplier);
        this.name = 'Psaltis';
        this.radius = 25;
        this.maxHp = Math.round(110 * Math.max(1.0, waveMultiplier));
        this.hp = this.maxHp;
        this.speed = 3.1;
        this.damage = 16;
        this.color = '#fdcb6e';
        this.xpDrop = 55;

        // Anthem state
        this.isSinging = false;
        this.singTimer = 0;
        this.singCooldown = 160 + Math.random() * 60; // First song ~3s in
        this.pulseTimer = 0;
        this.cheered = new Map(); // ally -> true (currently buffed by THIS Psaltis)

        // Tambourine poke & panic note
        this.pokeCooldown = 200 + Math.random() * 80;
        this.panicCooldown = 240;

        // Movement
        this.strafeAngle = (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 0.4);
        this.walkCycle = Math.random() * 10;
    }

    static get CHEER_RADIUS() { return 220; }
    static get SING_TIME() { return 300; } // ~5 seconds of anthem

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        if (this.hitFlash > 0) this.hitFlash -= dt;

        if (!player || player.hp <= 0) {
            this.isSinging = false;
            this.removeAllCheer(enemies);
            return;
        }

        const pdx = player.x - this.x;
        const pdy = player.y - this.y;
        const dist = Math.sqrt(pdx * pdx + pdy * pdy) || 1;
        const dir = Math.atan2(pdy, pdx);

        this.angle = dir;

        // Cooldown decrements
        if (this.singCooldown > 0) this.singCooldown -= dt;
        if (this.pokeCooldown > 0) this.pokeCooldown -= dt;
        if (this.panicCooldown > 0) this.panicCooldown -= dt;

        // Anthem lifecycle
        if (this.isSinging) {
            this.singTimer -= dt;
            if (this.singTimer <= 0) {
                this.isSinging = false;
                this.singCooldown = 340 + Math.random() * 90;
                this.removeAllCheer(enemies);
                if (effects) {
                    effects.addPopup(this.x, this.y - 42, 'BRAVO! 👏', '#fdcb6e', 20, false);
                }
            } else {
                this.updateAnthem(dt, enemies, effects);
            }
        } else {
            this.removeAllCheer(enemies);
            // Start a new song only with an audience nearby and a working throat
            if (this.singCooldown <= 0 && this.canSing() && this.hasAudience(enemies)) {
                this.startSinging(effects);
            }
        }

        // Panic High Note when cornered
        if (dist < 110 && this.panicCooldown <= 0) {
            this.highNote(player, dist, effects);
        }

        // Tambourine poke (needs both hands free, so never mid-song)
        if (!this.isSinging && this.pokeCooldown <= 0 && dist > 140 && dist < 520) {
            this.throwTambourine(player, bullets, effects);
        }

        // Movement: keep the squad inside the aura, stay out of player melee range
        this.updateDebuffs(dt);
        let curSpeed = this.getEffectiveSpeed();
        if (this.isSinging) curSpeed *= 0.45; // Plants his feet while singing (gentle sway)
        let moveAngle;
        if (dist < 270) {
            moveAngle = dir + Math.PI + this.strafeAngle * 0.35;
        } else if (dist > 480) {
            moveAngle = dir + this.strafeAngle * 0.4;
        } else {
            moveAngle = dir + (Math.PI / 2) * this.strafeAngle + Math.sin(this.age * 0.05) * 0.2;
        }
        this.vx = Math.cos(moveAngle) * curSpeed;
        this.vy = Math.sin(moveAngle) * curSpeed;

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        this.applySeparation(enemies);
        this.applyArenaBounds(arena);

        if (Math.abs(this.vx) > 0.3 || Math.abs(this.vy) > 0.3) {
            this.walkCycle += 0.22 * dt;
        }
    }

    canSing() {
        return this.waterDrenchedTimer <= 0 && this.stunTimer <= 0 && this.bubbleTrappedTimer <= 0;
    }

    hasAudience(enemies) {
        let found = false;
        const visit = (e) => {
            if (!e || e === this || e.dead || e.isBoss || e.isMiniBoss) return;
            const edx = e.x - this.x, edy = e.y - this.y;
            if (edx * edx + edy * edy < 340 * 340) { found = true; return false; }
        };
        if (typeof SpatialHashGrid !== 'undefined') SpatialHashGrid.forEachEnemyNear(this.x, this.y, 356, enemies, visit);
        else for (let i = 0; i < enemies.length && !found; i++) visit(enemies[i]);
        return found;
    }

    startSinging(effects) {
        this.isSinging = true;
        this.singTimer = Psaltis.SING_TIME;
        this.pulseTimer = 0;
        if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
            window.soundEngine.playSelect();
        }
        if (effects) {
            const line = PSALTIS_SING_SPLASHES[Math.floor(Math.random() * PSALTIS_SING_SPLASHES.length)];
            effects.addComicSplash(this.x, this.y - 40, line, '#fdcb6e', 22, true);
        }
    }

    updateAnthem(dt, enemies, effects) {
        // Water balloon counterplay: one drench and the song dissolves into coughing
        if (this.waterDrenchedTimer > 0) {
            this.isSinging = false;
            this.singCooldown = 300 + Math.random() * 60;
            this.removeAllCheer(enemies);
            if (effects) {
                effects.addComicSplash(this.x, this.y - 35, 'ΓΚΑΓΚΟΥΖΑ! 🤧', '#74b9ff', 24, true);
            }
            return;
        }

        // Stunned or bubble-trapped Psaltis can't hold the tune
        if (this.stunTimer > 0 || this.bubbleTrappedTimer > 0) {
            this.removeAllCheer(enemies);
            return;
        }

        // Golden pulse ring + floating note
        this.pulseTimer -= dt;
        if (this.pulseTimer <= 0) {
            this.pulseTimer = 55;
            if (effects) {
                effects.addShockwave(this.x, this.y, Psaltis.CHEER_RADIUS, 'rgba(241, 196, 15, 0.5)');
                effects.addPopup(this.x + (Math.random() * 30 - 15), this.y - 44, '♪', '#f1c40f', 20, false);
            }
        }

        // Revoke cheer from allies that died or left the aura, then buff nearby allies
        const cheerSq = Psaltis.CHEER_RADIUS * Psaltis.CHEER_RADIUS;
        if (this.cheered.size > 0) {
            for (const e of this.cheered.keys()) {
                if (!e || e.dead || ((e.x - this.x) ** 2 + (e.y - this.y) ** 2) > cheerSq) this.removeCheer(e);
            }
        }
        const visitCheer = (e) => {
            if (!e || e === this || e.dead || e.isBoss || e.isMiniBoss) return;
            const edx = e.x - this.x, edy = e.y - this.y;
            if (edx * edx + edy * edy <= cheerSq) this.applyCheer(e);
        };
        if (typeof SpatialHashGrid !== 'undefined') SpatialHashGrid.forEachEnemyNear(this.x, this.y, Psaltis.CHEER_RADIUS + 16, enemies, visitCheer);
        else for (let i = 0; i < enemies.length; i++) visitCheer(enemies[i]);
    }

    applyCheer(e) {
        if (!e._psaltisCheer) {
            e._psaltisCheer = true;
            e._cheerBaseSpeed = e.speed;
            e._cheerBaseDamage = e.damage;
            e.speed = e.speed * 1.22;
            e.damage = Math.round(e.damage * 1.25);
        }
        this.cheered.set(e, true);
    }

    removeCheer(e) {
        if (e && e._psaltisCheer) {
            e.speed = e._cheerBaseSpeed;
            e.damage = e._cheerBaseDamage;
            e._psaltisCheer = false;
            e._cheerBaseSpeed = null;
            e._cheerBaseDamage = null;
        }
        this.cheered.delete(e);
    }

    removeAllCheer(enemies) {
        if (this.cheered && this.cheered.size > 0) {
            for (const e of Array.from(this.cheered.keys())) {
                this.removeCheer(e);
            }
        }
    }

    highNote(player, dist, effects) {
        this.panicCooldown = 300 + Math.random() * 60;

        player.takeDamage(this.damage * 1.2, effects);

        // Knock the player away from Psaltis
        const kdx = (player.x - this.x) / dist;
        const kdy = (player.y - this.y) / dist;
        player.x += kdx * 170;
        player.y += kdy * 170;

        if (effects) {
            effects.addComicSplash(this.x, this.y - 40, 'ΛΑΛΑΛΑΛΑ! 🎵', '#ff4757', 24, true);
            effects.addShockwave(this.x, this.y, 110, 'rgba(253, 203, 110, 0.9)');
            effects.addSparks(player.x, player.y - 10, '#fdcb6e', 6);
        }

        if (window.soundEngine && typeof window.soundEngine.playHit === 'function') {
            window.soundEngine.playHit(true, true);
        }
    }

    throwTambourine(player, bullets, effects) {
        this.pokeCooldown = 260 + Math.random() * 70;

        const muzzleX = this.x + Math.cos(this.angle) * (this.radius + 10);
        const muzzleY = this.y + Math.sin(this.angle) * (this.radius + 10);

        const b = new Bullet({
            x: muzzleX,
            y: muzzleY,
            vx: Math.cos(this.angle) * 7.2,
            vy: Math.sin(this.angle) * 7.2,
            damage: this.damage,
            speed: 7.2,
            radius: 9,
            type: 'soundwave',
            isEnemy: true,
            range: 620,
            shooter: this
        });

        if (bullets) bullets.push(b);
        else if (window.gameInstance) window.gameInstance.bullets.push(b);

        if (window.soundEngine && typeof window.soundEngine.playShoot === 'function') {
            window.soundEngine.playShoot('normal');
        }
        if (effects && Math.random() < 0.4) {
            effects.addComicSplash(this.x, this.y - 28, 'NTING! 🪘', '#fdcb6e', 18, false);
        }
    }

    takeDamage(amount, effects = null, fromCrit = null, playSound = true) {
        const wasAlive = !this.dead;
        const killed = super.takeDamage(amount, effects, fromCrit, playSound);

        // Sad trombone on death; make sure no ally keeps his buff
        if (wasAlive && this.dead) {
            this.isSinging = false;
            this.removeAllCheer(window.gameInstance ? (window.gameInstance.enemies || []) : []);
            if (effects) {
                effects.addComicSplash(this.x, this.y - 36, 'WAH WAH WAAH 🎺', '#b2bec3', 24, true);
            }
        }

        return killed;
    }

    draw(ctx) {
        // Aura ring while singing (drawn under everything else)
        if (this.isSinging) {
            ctx.save();
            ctx.strokeStyle = 'rgba(241, 196, 15, 0.28)';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([10, 8]);
            ctx.lineDashOffset = -this.age * 0.8;
            ctx.beginPath();
            ctx.arc(this.x, this.y, Psaltis.CHEER_RADIUS, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }

        ctx.save();
        const shadowBob = Math.sin(this.walkCycle) * 2.4;

        // Ground Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.26)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + this.radius * 0.78, this.radius * 0.92, this.radius * 0.36, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.translate(this.x, this.y + shadowBob);

        const facingLeft = Math.cos(this.angle) < 0;
        const flash = this.hitFlash > 0;
        if (typeof SpriteAtlasCache !== 'undefined') {
            const r = this.radius || 22;
            const rKey = Math.round(r * 2);
            const singing = !!this.isSinging;
            const singBin = singing ? SpriteAtlasCache.quantizePhase(this.age * 0.35, 8) : -1;
            const bodyKey = `psaltis_b:${rKey}:${singing ? 's' + singBin : 'idle'}:${flash ? 1 : 0}`;
            const bw = Math.ceil(r * 4.4);
            const bh = Math.ceil(r * 5.6);
            SpriteAtlasCache.drawCached(ctx, bodyKey, bw, bh, bw * 0.5, bh * 0.62, (bctx) => {
                const origAge = this.age;
                if (singing) {
                    this.age = SpriteAtlasCache.binAngle(singBin, 8) / 0.35;
                }
                try {
                    this.drawPsaltisBody(bctx, flash);
                } finally {
                    this.age = origAge;
                }
            }, { flipX: facingLeft });
        } else {
            if (facingLeft) ctx.scale(-1, 1);
            this.drawPsaltisBody(ctx, flash);
        }

        ctx.restore();

        // Music-note markers above currently buffed allies
        this.drawBuffedAllyNotes(ctx);

        // Overhead HUD
        this.drawOverheadHUD(ctx);
    }

    drawPsaltisBody(ctx, flash) {
        const r = this.radius;
        const singing = this.isSinging;
        ctx.lineWidth = 2.6;
        ctx.strokeStyle = '#1e272e';

        // A. Body — cream festival shirt with open dark vest
        ctx.fillStyle = flash ? '#ffffff' : '#f7f1e3';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Vest panels (left & right of the chest)
        ctx.fillStyle = flash ? '#ffffff' : '#3d2314';
        ctx.beginPath();
        ctx.ellipse(-r * 0.42, 0, r * 0.3, r * 0.62, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(r * 0.42, 0, r * 0.3, r * 0.62, -0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Gold sash belt
        ctx.fillStyle = flash ? '#ffffff' : '#f1c40f';
        ctx.fillRect(-r * 0.85, r * 0.42, r * 1.7, r * 0.22);
        ctx.strokeRect(-r * 0.85, r * 0.42, r * 1.7, r * 0.22);

        // B. Head
        ctx.fillStyle = flash ? '#ffffff' : '#e5b184';
        ctx.beginPath();
        ctx.arc(r * 0.12, -r * 0.62, r * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // C. Flat cap (kasket) — tilted forward
        ctx.fillStyle = flash ? '#ffffff' : '#2f3542';
        ctx.beginPath();
        ctx.arc(r * 0.1, -r * 0.92, r * 0.48, Math.PI, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(r * 0.52, -r * 0.9, r * 0.22, r * 0.09, 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // D. Face
        if (!flash) {
            const eyeX = r * 0.4;
            const eyeY = -r * 0.66;

            // Eyes: closed blissful arcs while singing, sly otherwise
            ctx.strokeStyle = '#1e272e';
            ctx.lineWidth = 2;
            if (singing) {
                ctx.beginPath();
                ctx.arc(eyeX, eyeY + 1, 3, Math.PI * 1.15, Math.PI * 1.85);
                ctx.stroke();
            } else {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(eyeX, eyeY, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#2c1810';
                ctx.beginPath();
                ctx.arc(eyeX + 1.4, eyeY, 1.8, 0, Math.PI * 2);
                ctx.fill();
            }

            // Bushy eyebrow
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.moveTo(eyeX - 4, eyeY - 7);
            ctx.lineTo(eyeX + 5, eyeY - 5);
            ctx.stroke();

            // THE Mustache (his pride and joy)
            ctx.fillStyle = '#2f3542';
            ctx.beginPath();
            ctx.ellipse(r * 0.42, -r * 0.42, r * 0.34, r * 0.14, 0.12, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Mouth: wide open while singing, smug smirk otherwise
            ctx.lineWidth = 2;
            if (singing) {
                ctx.fillStyle = '#6b2d1f';
                ctx.beginPath();
                ctx.ellipse(r * 0.34, -r * 0.24, r * 0.16, r * 0.2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.arc(r * 0.3, -r * 0.28, r * 0.14, -0.3, 0.7);
                ctx.stroke();
            }
        }

        // E. Tambourine in the leading hand
        ctx.save();
        ctx.translate(r * 0.95, -r * 0.15);
        ctx.rotate(singing ? Math.sin(this.age * 0.35) * 0.5 : 0.25);
        ctx.fillStyle = flash ? '#ffffff' : '#d9b380';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.34, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = flash ? '#ffffff' : '#8b4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.34, 0, Math.PI * 2);
        ctx.stroke();
        // Jingle pairs around the rim
        ctx.fillStyle = '#f1c40f';
        ctx.lineWidth = 1.5;
        for (let j = 0; j < 4; j++) {
            const ja = (j / 4) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(Math.cos(ja) * r * 0.34, Math.sin(ja) * r * 0.34, 2.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();

        // F. Floating notes while singing
        if (singing) {
            const noteLbl = EnemyBase.getLabelSprite('♪', '900 18px "Fredoka", sans-serif', '#f1c40f', '#1e272e', 1.4, 0, 'bottom');
            const prevAlpha = ctx.globalAlpha;
            for (let n = 0; n < 2; n++) {
                const notePhase = (this.age * 0.06 + n * 1.7) % 2;
                const noteY = -r * 1.5 - notePhase * 26;
                const noteX = r * 0.7 + Math.sin(this.age * 0.1 + n * 2.1) * 10;
                ctx.globalAlpha = prevAlpha * Math.max(0, 1 - notePhase / 2);
                EnemyBase.drawLabel(ctx, noteLbl, noteX, noteY);
            }
            ctx.globalAlpha = prevAlpha;
        }
    }

    drawBuffedAllyNotes(ctx) {
        if (!this.cheered || this.cheered.size === 0) return;
        const noteLbl = EnemyBase.getLabelSprite('♪', '900 17px "Fredoka", sans-serif', '#f1c40f', '#1e272e', 3, 0, 'bottom');
        let idx = 0;
        for (const e of this.cheered.keys()) {
            idx++;
            if (!e || e.dead || !e._psaltisCheer || e === this) continue;
            const noteY = e.y - e.radius - 30 + Math.sin(this.age * 0.12 + idx) * 3;
            EnemyBase.drawLabel(ctx, noteLbl, e.x, noteY);
        }
    }
}

if (typeof window !== 'undefined') {
    window.Psaltis = Psaltis;
}
