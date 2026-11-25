/**
 * Lesa.io - Destructible Apex Shield Pillar Subsystem (W30 / W60 Apex Bosses)
 * Summoned at <= 50% HP around an Apex Boss, anchoring an invulnerable hexagonal
 * containment shield via streaming tether conduits until all pillars are shattered.
 */

class ApexShieldPillar extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0, pillarIndex = 0, totalPillars = 4, ownerBoss = null) {
        super(x, y, 'apex_shield_pillar', waveMultiplier);
        this.name = `Aegis Pillar ${pillarIndex + 1}`;
        this.isApexPillar = true;
        this.isStationary = true;
        this.isBoss = false;
        this.isMiniBoss = false;
        this._chronoDropChecked = true;
        this.pillarIndex = pillarIndex;
        this.totalPillars = totalPillars;
        this.ownerBoss = ownerBoss;

        this.radius = 30;
        this.hudOffsetY = 74;
        this.maxHp = Math.round(2400 * Math.max(1.0, waveMultiplier));
        this.hp = this.maxHp;
        this.baseSpeed = 0;
        this.speed = 0;
        this.damage = 0;
        this.xpDrop = 160;
        this.scoreValue = 350;
        this.color = '#ff2e4c';
        this.emergeProgress = 0;
        this.pulseCooldown = 140 + pillarIndex * 35;
        this.shattered = false;
    }

    // Anchored stone obelisks ignore crowd control and displacement
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
        if (effects && Math.random() < 0.5) effects.addSparks(this.x, this.y - 22, '#fed330', 3);
        if (this.hp <= 0 && !this.shattered) this.onShatter(effects);
        return hit;
    }

    onShatter(effects = null) {
        if (this.shattered) return;
        this.shattered = true;
        this.dead = true;
        if (effects) {
            effects.addShockwave(this.x, this.y, 145, 'rgba(254, 211, 48, 0.95)');
            effects.addSparks(this.x, this.y - 18, '#ff2e4c', 16);
            effects.addSparks(this.x, this.y - 18, '#fed330', 12);
            if (typeof effects.addGroundCrack === 'function') effects.addGroundCrack(this.x, this.y, 58, '#09090b', '#ff2e4c', 90);
            effects.addComicSplash(this.x, this.y - 52, '💥 PILLAR SHATTERED! 💥', '#fed330');
            if (typeof effects.onBossSlam === 'function') effects.onBossSlam(0.05);
        }
        const boss = this.resolveOwnerBoss();
        if (boss && typeof boss.onShieldPillarDestroyed === 'function') boss.onShieldPillarDestroyed(this, effects);
    }

    resolveOwnerBoss() {
        if (this.ownerBoss && !this.ownerBoss.dead) return this.ownerBoss;
        if (typeof window !== 'undefined' && window.gameInstance && Array.isArray(window.gameInstance.enemies)) {
            const b = window.gameInstance.enemies.find(e => e && !e.dead && e.isApexBoss);
            if (b) { this.ownerBoss = b; return b; }
        }
        return null;
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null) {
        this.age += dt;
        if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt);
        this.emergeProgress = Math.min(1, this.emergeProgress + dt * 0.08);
        if (this.hp <= 0 && !this.shattered) { this.onShatter(effects); return; }

        const boss = this.resolveOwnerBoss();
        if (boss && boss.shieldActive && effects && Math.random() < 0.08 * dt) {
            const t = Math.random();
            effects.addSparks(this.x + (boss.x - this.x) * t, (this.y - 36) + (boss.y - (this.y - 36)) * t, '#fed330', 1);
        }
        // Subtle radial warning pulse from surviving pillar every few seconds
        this.pulseCooldown -= dt;
        if (this.pulseCooldown <= 0 && boss && boss.shieldActive) {
            this.pulseCooldown = 195;
            if (typeof Bullet !== 'undefined' && player && player.hp > 0) {
                const a = Math.atan2(player.y - this.y, player.x - this.x);
                for (const off of [-0.22, 0.22]) {
                    bullets.push(new Bullet({
                        x: this.x, y: this.y - 20, vx: Math.cos(a + off) * 7.8, vy: Math.sin(a + off) * 7.8,
                        damage: Math.max(14, Math.round((boss.damage || 40) * 0.45)),
                        speed: 7.8, radius: 9, type: 'magma_shard', isEnemy: true, range: 520
                    }));
                }
            }
        }
    }

    draw(ctx) {
        const boss = this.resolveOwnerBoss();
        if (boss && boss.shieldActive && !boss.dead) ApexShieldPillar.drawTetherBeam(ctx, this, boss);

        const em = Math.max(0.15, this.emergeProgress);
        const bob = Math.sin(this.age * 0.1 + this.pillarIndex * 1.5) * 4;
        const fl = this.hitFlash > 0;
        const r = this.radius * em;
        const hpR = Math.max(0, Math.min(1, this.hp / Math.max(1, this.maxHp)));

        ctx.save();
        ctx.translate(this.x, this.y);

        // 1. Anchored Crimson-Gold Ritual Circle on Ground
        ctx.save();
        ctx.scale(1, 0.56);
        ctx.fillStyle = 'rgba(255, 46, 76, 0.22)';
        ctx.beginPath(); ctx.arc(0, 22, r * 1.7, 0, Math.PI * 2); ctx.fill();
        ctx.rotate(this.age * 0.03 * (this.pillarIndex % 2 === 0 ? 1 : -1));
        ctx.strokeStyle = '#ff2e4c'; ctx.lineWidth = 2.6; ctx.setLineDash([12, 8]);
        ctx.beginPath(); ctx.arc(0, 22, r * 1.55, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // 2. Stepped Octagonal Obsidian Stone Plinth
        ctx.fillStyle = '#09090b'; ctx.strokeStyle = '#fed330'; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.ellipse(0, 14, r * 1.15, r * 0.54, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#1f2937'; ctx.strokeStyle = '#09090b'; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.ellipse(0, 8, r * 0.88, r * 0.40, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // 3. Multi-Faceted Basalt Obelisk Shaft with Magma Cracks
        ctx.fillStyle = fl ? '#ffffff' : '#111827';
        ctx.strokeStyle = '#09090b'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-r * 0.62, 10); ctx.lineTo(-r * 0.44, -r * 1.32);
        ctx.lineTo(0, -r * 1.52); ctx.lineTo(r * 0.44, -r * 1.32); ctx.lineTo(r * 0.62, 10);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        // Right lit bevel face
        ctx.fillStyle = fl ? '#ffffff' : '#334155';
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.52); ctx.lineTo(r * 0.44, -r * 1.32); ctx.lineTo(r * 0.62, 10); ctx.lineTo(0, 12);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        // Gold corner brackets & pulsing magma fracture veins
        ctx.strokeStyle = '#fed330'; ctx.lineWidth = 2.2;
        ctx.strokeRect(-r * 0.50, -r * 0.35, r * 1.0, r * 0.22);
        ctx.strokeStyle = hpR < 0.65 ? '#fef08a' : '#ff2e4c'; ctx.lineWidth = hpR < 0.4 ? 3 : 2;
        ctx.beginPath();
        ctx.moveTo(0, 4); ctx.lineTo(-7, -14); ctx.lineTo(5, -26); ctx.lineTo(-3, -r * 1.15);
        ctx.stroke();

        // 4. Counter-Rotating Crown Ring + Floating Conduit Crystal
        ctx.save();
        ctx.translate(0, -r * 1.72 + bob);
        ctx.strokeStyle = '#fed330'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.ellipse(0, 0, r * 0.85, r * 0.28, this.age * 0.05, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = fl ? '#ffffff' : '#ff2e4c';
        ctx.strokeStyle = '#09090b'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(9, 0); ctx.lineTo(0, 14); ctx.lineTo(-9, 0); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(4, 0); ctx.lineTo(0, 6); ctx.lineTo(-4, 0); ctx.closePath(); ctx.fill();
        ctx.restore();
        ctx.restore();

        // 5. Pillar Label + HP Bar
        const hudY = this.y - this.hudOffsetY;
        const bw = 62, bh = 7;
        ctx.save();
        ctx.textAlign = 'center'; ctx.font = '900 11px "Luckiest Guy", cursive, sans-serif';
        ctx.lineWidth = 3; ctx.strokeStyle = '#07090f';
        ctx.strokeText(`⚡ PILLAR ${this.pillarIndex + 1}`, this.x, hudY - 6);
        ctx.fillStyle = '#fed330';
        ctx.fillText(`⚡ PILLAR ${this.pillarIndex + 1}`, this.x, hudY - 6);
        ctx.fillStyle = '#111827'; ctx.fillRect(this.x - bw / 2, hudY, bw, bh);
        ctx.fillStyle = hpR < 0.35 ? '#ffa502' : '#ff2e4c';
        ctx.fillRect(this.x - bw / 2, hudY, bw * hpR, bh);
        ctx.strokeStyle = '#fed330'; ctx.lineWidth = 1.6;
        ctx.strokeRect(this.x - bw / 2, hudY, bw, bh);
        ctx.restore();
    }

    static drawTetherBeam(ctx, pillar, boss) {
        const sx = pillar.x, sy = pillar.y - 52 + Math.sin(pillar.age * 0.1 + pillar.pillarIndex * 1.5) * 4;
        const ex = boss.x, ey = boss.y - (boss.radius * 0.08);
        const pulse = 0.5 + 0.5 * Math.sin(pillar.age * 0.25 + pillar.pillarIndex);
        ctx.save();
        ctx.lineCap = 'round';
        ctx.strokeStyle = `rgba(255, 46, 76, ${0.30 + pulse * 0.18})`; ctx.lineWidth = 13;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.strokeStyle = `rgba(254, 211, 48, ${0.78 + pulse * 0.20})`; ctx.lineWidth = 4;
        ctx.setLineDash([14, 10]); ctx.lineDashOffset = -(pillar.age * 4.5);
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.setLineDash([]);
        for (let k = 0; k < 3; k++) {
            const p = ((pillar.age * 0.028 + k / 3 + pillar.pillarIndex * 0.2) % 1);
            const px = sx + (ex - sx) * p, py = sy + (ey - sy) * p;
            ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#ff2e4c'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(px, py, 4.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
        ctx.restore();
    }

    static spawnForBoss(boss, enemies, arena, effects) {
        if (!boss || !Array.isArray(enemies)) return [];
        const b = arena && arena.dungeonBounds;
        const minX = (b ? b.minX : -(arena ? arena.halfWidth : 1500)) + 90;
        const maxX = (b ? b.maxX : (arena ? arena.halfWidth : 1500)) - 90;
        const minY = (b ? b.minY : -(arena ? arena.halfHeight : 1500)) + 90;
        const maxY = (b ? b.maxY : (arena ? arena.halfHeight : 1500)) - 90;
        const offsets = [[-250, -180], [250, -180], [-250, 180], [250, 180]];
        const out = [];
        for (let i = 0; i < offsets.length; i++) {
            const px = Math.max(minX, Math.min(maxX, boss.x + offsets[i][0]));
            const py = Math.max(minY, Math.min(maxY, boss.y + offsets[i][1]));
            const pil = new ApexShieldPillar(px, py, boss.waveMultiplier || 1.0, i, offsets.length, boss);
            enemies.push(pil);
            out.push(pil);
            if (effects) {
                effects.addLightningChain(boss.x, boss.y, px, py, '#fed330');
                effects.addShockwave(px, py, 110, 'rgba(255, 46, 76, 0.92)');
                effects.addSparks(px, py, '#fed330', 10);
            }
        }
        boss.shieldPillars = out;
        boss.shieldTotalCount = out.length;
        return out;
    }
}

if (typeof window !== 'undefined') window.ApexShieldPillar = ApexShieldPillar;
if (typeof module !== 'undefined' && module.exports) module.exports = { ApexShieldPillar };
