/**
 * Lesa.io - Endless Hard Mode W40 Main Boss: "Nyxor, Herald of the Void Eclipse"
 * Main Boss (with 4-stage Main Boss cutscene, NOT W60 Final Apex Boss).
 */

class CelestialEclipseArchon extends EndlessBossBase {
    constructor(x, y, waveMultiplier = 1.0, extra = {}) {
        super(x, y, 'void_eclipse_archon', waveMultiplier, {
            name: 'Nyxor, Eclipse Archon',
            hudLabel: extra.hudLabel || '🌑 NYXOR, ECLIPSE ARCHON [HARD BOSS] 🌑',
            isMiniBoss: false,
            bossRank: 'insane',
            rankColor: extra.rankColor || '#a855f7',
            crateId: extra.crateId || 'boss_crate_insane',
            radius: 52,
            baseHp: 9600,
            speed: 2.8,
            baseDmg: 52,
            xpDrop: 1680,
            scoreValue: 5200,
            goldBonus: 1350,
            xpBonus: 1050
        });
        this.isHardMainBoss = true;
        this.cutsceneState = 'ARRIVAL';
        this.cutsceneTimer = 66;
        this.prisonCooldown = 160;
        this.beamCooldown = 135;
        this.starburstCooldown = 84;
        this._beams = [];
        this.summoned = false;
    }

    takeDamage(amount, effects = null, fromCrit = null, playSound = true) {
        if (this.cutsceneState !== 'COMBAT') {
            if (effects && Math.random() < 0.35) effects.addSparks(this.x, this.y, '#c084fc', 3);
            return false;
        }
        return super.takeDamage(amount, effects, fromCrit, playSound);
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        if (this.cutsceneState !== 'COMBAT' && typeof HardBossEntranceFX !== 'undefined') {
            HardBossEntranceFX.updateMainBossCutscene(this, dt, player, effects, {
                subText: 'HARD WAVE 40 • VOID ECLIPSE CITADEL',
                speaker: 'NYXOR, HERALD OF THE VOID ECLIPSE',
                avatar: '🌑',
                color: '#c084fc',
                shockColor: 'rgba(168, 85, 247, 0.94)',
                line1: 'YOU SURVIVED ALPHA... YET THE TRUE CITADEL AWAKENS AT WAVE 60!',
                surgeSub: 'VOID MONOLITHS ALIGNING AN ASTRAL ECLIPSE...',
                line2: 'NONE PASS THE OUTER GATE ALIVE!'
            });
            return;
        }

        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        this.updateTelegraphs(dt, player, effects);
        this._tickBeams(dt, player, effects);
        if (!player || player.hp <= 0) return;

        // Phase 2 <= 50% HP: Eclipse Rupture + Summons BlightNecromancer & CryoSniper
        if (this.checkEnrage(0.50, effects, '🌑 VOID ECLIPSE RUPTURE! 🌑', 1.32, 'rgba(168, 85, 247, 0.96)') && !this.summoned) {
            this.summoned = true;
            if (typeof BlightNecromancer === 'function') enemies.push(new BlightNecromancer(this.x - 115, this.y + 40, this.waveMultiplier * 0.85));
            if (typeof CryoSniper === 'function') enemies.push(new CryoSniper(this.x + 115, this.y - 40, this.waveMultiplier * 0.85));
            for (let k = 0; k < 12; k++) this.fireFan(bullets, (k / 12) * Math.PI * 2, [0], 10.5, Math.round(this.damage * 0.85), 11, 'void_orb');
        }

        const dx = player.x - this.x, dy = player.y - this.y, dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);
        if (this.prisonCooldown > 0) this.prisonCooldown -= dt;
        if (this.beamCooldown > 0) this.beamCooldown -= dt;
        if (this.starburstCooldown > 0) this.starburstCooldown -= dt;

        // 1. Void Prison Containment Ring (6 zones with 1 directional escape gap)
        if (this.prisonCooldown <= 0) {
            this.prisonCooldown = this.isEnraged ? 135 : 175;
            const gapIdx = Math.floor(Math.random() * 6);
            for (let i = 0; i < 6; i++) {
                if (i === gapIdx) continue;
                const a = (i / 6) * Math.PI * 2;
                this.addTelegraph(player.x + Math.cos(a) * 105, player.y + Math.sin(a) * 105, 76, 48, Math.round(this.damage * 1.15), '🌑', 'rgba(168, 85, 247, 0.94)', 'cryo_vortex', '#38bdf8');
            }
        }

        // 2. Eclipse Beams
        if (this.beamCooldown <= 0) {
            this.beamCooldown = this.isEnraged ? 105 : 145;
            const base = this.angle;
            this._beams.push({ x: this.x, y: this.y, ang: base, timer: 36, activeTimer: 0 });
            this._beams.push({ x: this.x, y: this.y, ang: base + (this.isEnraged ? Math.PI / 3 : Math.PI / 2), timer: 36, activeTimer: 0 });
            if (this.isEnraged) this._beams.push({ x: this.x, y: this.y, ang: base - Math.PI / 3, timer: 36, activeTimer: 0 });
        }

        // 3. Double-Spiraled Astral Starbursts
        if (this.starburstCooldown <= 0) {
            this.starburstCooldown = this.isEnraged ? 52 : 76;
            const fan = this.isEnraged ? [-0.4, -0.2, 0, 0.2, 0.4] : [-0.25, 0, 0.25];
            this.fireFan(bullets, this.angle, fan, 11.8, Math.round(this.damage * 0.85), 11, 'void_orb');
            this.fireFan(bullets, this.angle + 0.14, [-0.15, 0.15], 12.8, Math.round(this.damage * 0.78), 10, 'tempest_bolt');
        }

        this.moveTowards(dt, dx, dy, dist, 245, arena);
    }

    _tickBeams(dt, player, effects) {
        for (let i = this._beams.length - 1; i >= 0; i--) {
            const bm = this._beams[i];
            if (bm.timer > 0) {
                bm.timer -= dt;
                if (bm.timer <= 0) {
                    bm.activeTimer = 18;
                    if (effects) effects.addShockwave(bm.x, bm.y, 95, 'rgba(168, 85, 247, 0.9)');
                }
            } else {
                bm.activeTimer -= dt;
                if (player && player.invulnerableTimer <= 0) {
                    const d = Math.abs((player.x - bm.x) * -Math.sin(bm.ang) + (player.y - bm.y) * Math.cos(bm.ang));
                    if (d <= 28) player.takeDamage(Math.round(this.damage * 1.15), effects);
                }
                if (bm.activeTimer <= 0) this._beams.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        if (typeof VoidArchonW40Renderer !== 'undefined') VoidArchonW40Renderer.draw(ctx, this);
    }
}

if (typeof window !== 'undefined') window.CelestialEclipseArchon = CelestialEclipseArchon;
if (typeof module !== 'undefined' && module.exports) module.exports = { CelestialEclipseArchon };
