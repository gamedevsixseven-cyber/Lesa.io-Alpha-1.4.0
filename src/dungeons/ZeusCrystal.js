/**
 * Lesa.io - Zeus Storm Crystal & Aerial Siege Subsystem (Mount Olympus Floor 5)
 * Ender-Dragon-inspired destructible energy crystals summoned when Zeus ascends at <= 80% HP.
 * Crystals tether to airborne Zeus, sustaining his invulnerable storm barrier and summoning
 * Olympian defenders until every crystal on the summit is shattered.
 */

class ZeusCrystal extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0, crystalIndex = 0, totalCrystals = 4, ownerBoss = null) {
        super(x, y, 'zeus_crystal', waveMultiplier);
        this.name = `Storm Crystal ${crystalIndex + 1}`;
        this.isCrystal = true;
        this.isStationary = true;
        this.isBoss = false;
        this.isMiniBoss = false;
        this.crystalIndex = crystalIndex;
        this.totalCrystals = totalCrystals;
        this.ownerBoss = ownerBoss;

        this.radius = 28;
        this.hudOffsetY = 58;
        this.maxHp = Math.round(2800 * Math.max(1.0, waveMultiplier));
        this.hp = this.maxHp;
        this.baseSpeed = 0;
        this.speed = 0;
        this.damage = 0;
        this.xpDrop = 85;
        this.scoreValue = 180;
        this.color = '#00f5ff';
        this.emergeProgress = 0;
        this.shatteredNotified = false;
    }

    // Crystals are anchored sacred pylons — immune to displacement and crowd control
    applySeparation() {}
    applyStun() {}
    applyFear() {}
    applyIceSlow() {}
    applySonicSlow() {}
    trapInBubble() {}

    takeDamage(amount, effects = null, fromCrit = null, playSound = true) {
        if (this.dead) return false;
        const hit = super.takeDamage(amount, effects, fromCrit, playSound);
        this.hitFlash = Math.max(this.hitFlash, 6);
        if (effects && Math.random() < 0.45) {
            effects.addSparks(this.x, this.y - 16, '#00f5ff', 3);
        }
        if (this.hp <= 0 && !this.shatteredNotified) {
            this.onShatter(effects);
        }
        return hit;
    }

    onShatter(effects = null) {
        if (this.shatteredNotified) return;
        this.shatteredNotified = true;
        this.dead = true;
        if (effects) {
            effects.addShockwave(this.x, this.y, 130, 'rgba(0, 245, 255, 0.92)');
            effects.addSparks(this.x, this.y - 12, '#00f5ff', 14);
            effects.addSparks(this.x, this.y - 12, '#f1c40f', 10);
            effects.addComicSplash(this.x, this.y - 44, '💎 CRYSTAL SHATTERED!');
            if (typeof effects.onBossSlam === 'function') effects.onBossSlam(0.04);
        }
        const boss = this.resolveOwnerBoss();
        if (boss && typeof boss.onCrystalDestroyed === 'function') {
            boss.onCrystalDestroyed(this, effects);
        }
    }

    resolveOwnerBoss() {
        if (this.ownerBoss && !this.ownerBoss.dead) return this.ownerBoss;
        if (typeof window !== 'undefined' && window.gameInstance && Array.isArray(window.gameInstance.enemies)) {
            const found = window.gameInstance.enemies.find(e => e && e.type === 'zeus' && !e.dead);
            if (found) {
                this.ownerBoss = found;
                return found;
            }
        }
        return null;
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt);
        this.emergeProgress = Math.min(1, this.emergeProgress + dt * 0.06);

        if (this.hp <= 0 && !this.shatteredNotified) {
            this.onShatter(effects);
            return;
        }

        // Subtle rising energy sparks along tether while fueling Zeus
        const boss = this.resolveOwnerBoss();
        if (effects && boss && boss.isFlying && Math.random() < 0.06 * dt) {
            const bx = boss.x;
            const by = boss.y - (typeof boss.getVisualLiftY === 'function' ? boss.getVisualLiftY() : 120);
            const t = Math.random() * 0.5;
            effects.addSparks(
                this.x + (bx - this.x) * t,
                (this.y - 26) + (by - (this.y - 26)) * t,
                '#70f8ff',
                1
            );
        }
    }

    draw(ctx) {
        const boss = this.resolveOwnerBoss();
        if (boss && boss.isFlying && !boss.dead) {
            ZeusCrystal.drawTetherBeam(ctx, this, boss);
        }

        const emerge = Math.max(0.15, this.emergeProgress);
        const bobY = Math.sin(this.age * 0.09 + this.crystalIndex * 1.4) * 5;
        const pulse = 0.5 + 0.5 * Math.sin(this.age * 0.14 + this.crystalIndex);
        const flash = this.hitFlash > 0;
        const r = this.radius * emerge;

        ctx.save();
        ctx.translate(this.x, this.y);

        // 1. Ground Sanctuary Rune Pedestal
        ctx.fillStyle = 'rgba(0, 245, 255, 0.14)';
        ctx.beginPath();
        ctx.ellipse(0, 12, r * 1.45, r * 0.72, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#dfe6e9';
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.ellipse(0, 12, r * 1.05, r * 0.52, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.ellipse(0, 9, r * 0.72, r * 0.34, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 2. Orbiting Arcane Ring
        ctx.save();
        ctx.translate(0, -14 + bobY);
        ctx.strokeStyle = flash ? '#ffffff' : `rgba(241, 196, 15, ${0.55 + pulse * 0.35})`;
        ctx.lineWidth = 2.2;
        ctx.rotate(this.age * 0.04 * (this.crystalIndex % 2 === 0 ? 1 : -1));
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.15, r * 0.42, 0.35, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 3. Faceted Floating Olympian Storm Crystal (Octahedron)
        ctx.save();
        ctx.translate(0, -18 + bobY);

        // Outer electric aura glow
        ctx.fillStyle = `rgba(0, 245, 255, ${0.18 + pulse * 0.14})`;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.25, 0, Math.PI * 2);
        ctx.fill();

        const topY = -r * 1.22;
        const botY = r * 1.02;
        const sideX = r * 0.78;

        // Left facet
        ctx.fillStyle = flash ? '#ffffff' : '#00d2d3';
        ctx.strokeStyle = '#14141c';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(0, topY);
        ctx.lineTo(-sideX, 0);
        ctx.lineTo(0, botY);
        ctx.lineTo(-sideX * 0.14, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Right sunlit facet
        ctx.fillStyle = flash ? '#ffffff' : '#70f8ff';
        ctx.beginPath();
        ctx.moveTo(0, topY);
        ctx.lineTo(sideX, 0);
        ctx.lineTo(0, botY);
        ctx.lineTo(-sideX * 0.14, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner golden core diamond
        ctx.fillStyle = flash ? '#ffffff' : '#fed330';
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.48);
        ctx.lineTo(r * 0.28, 0);
        ctx.lineTo(0, r * 0.44);
        ctx.lineTo(-r * 0.28, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
        ctx.restore();

        // 4. Crystal HP Bar
        const hudY = this.y - this.hudOffsetY;
        const barW = 54;
        const barH = 6;
        const hpRatio = Math.max(0, Math.min(1, this.hp / Math.max(1, this.maxHp)));
        ctx.save();
        ctx.font = '900 11px "Luckiest Guy", "Fredoka", sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#14141c';
        ctx.strokeText(`💎 CRYSTAL ${this.crystalIndex + 1}`, this.x, hudY - 7);
        ctx.fillStyle = '#70f8ff';
        ctx.fillText(`💎 CRYSTAL ${this.crystalIndex + 1}`, this.x, hudY - 7);

        ctx.fillStyle = '#1e272e';
        ctx.fillRect(this.x - barW / 2, hudY, barW, barH);
        ctx.fillStyle = '#00f5ff';
        ctx.fillRect(this.x - barW / 2, hudY, barW * hpRatio, barH);
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 1.4;
        ctx.strokeRect(this.x - barW / 2, hudY, barW, barH);
        ctx.restore();
    }

    /**
     * Draws an animated Ender-Dragon-style energy tether from the crystal to airborne Zeus.
     */
    static drawTetherBeam(ctx, crystal, boss) {
        const startX = crystal.x;
        const startY = crystal.y - 26 + Math.sin(crystal.age * 0.09 + crystal.crystalIndex * 1.4) * 5;
        const bossLift = (typeof boss.getVisualLiftY === 'function') ? boss.getVisualLiftY() : 120;
        const endX = boss.x;
        const endY = boss.y - bossLift;

        ctx.save();
        const pulse = 0.5 + 0.5 * Math.sin(crystal.age * 0.22 + crystal.crystalIndex);
        ctx.lineCap = 'round';

        // Outer electric cyan beam glow
        ctx.strokeStyle = `rgba(0, 245, 255, ${0.28 + pulse * 0.16})`;
        ctx.lineWidth = 11;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Inner golden-white core beam
        ctx.strokeStyle = `rgba(255, 240, 175, ${0.72 + pulse * 0.22})`;
        ctx.lineWidth = 3.5;
        ctx.setLineDash([14, 10]);
        ctx.lineDashOffset = -(crystal.age * 4.2);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Animated energy orbs flowing UP from crystal into Zeus
        for (let k = 0; k < 3; k++) {
            const p = ((crystal.age * 0.024 + k / 3 + crystal.crystalIndex * 0.17) % 1);
            const px = startX + (endX - startX) * p;
            const py = startY + (endY - startY) * p;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(px, py, 4.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#00f5ff';
            ctx.lineWidth = 1.6;
            ctx.stroke();
        }
        ctx.restore();
    }

    /**
     * Spawns 4 Storm Crystals cleanly around Olympus Summit (clearing pillars & braziers).
     */
    static spawnSummitCrystals(zeus, enemies, arena, effects) {
        if (!zeus || !Array.isArray(enemies)) return [];
        const anchors = [
            [-540, -490],
            [540, -490],
            [-540, 440],
            [540, 440]
        ];
        const spawned = [];
        for (let i = 0; i < anchors.length; i++) {
            let cx = anchors[i][0];
            let cy = anchors[i][1];
            if (typeof OlympusLayouts !== 'undefined' && typeof OlympusLayouts.findSafePosition === 'function') {
                const safe = OlympusLayouts.findSafePosition(cx, cy, 40, arena);
                cx = safe.x;
                cy = safe.y;
            }
            const c = new ZeusCrystal(cx, cy, zeus.waveMultiplier || 1.0, i, anchors.length, zeus);
            enemies.push(c);
            spawned.push(c);

            if (effects) {
                effects.addLightningChain(zeus.x, zeus.y - 120, cx, cy, '#00f5ff');
                effects.addShockwave(cx, cy, 95, 'rgba(0, 245, 255, 0.85)');
                effects.addSparks(cx, cy, '#fed330', 10);
            }
        }
        zeus.crystals = spawned;
        zeus.crystalTotalCount = spawned.length;
        return spawned;
    }
}

if (typeof window !== 'undefined') {
    window.ZeusCrystal = ZeusCrystal;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ZeusCrystal };
}
