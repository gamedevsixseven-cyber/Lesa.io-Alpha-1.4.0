/**
 * Lesa.io - Active Skill: Chronos Hourglass (Legendary + Lv.5 Gem Mastery: Eternity Shatter)
 * Conjures a spinning golden Time Sanctuary Dome that slows enemies and enemy projectiles,
 * grants speed + fire-rate haste to the player inside, and shatters for AoE damage when mastered.
 */

class ChronosHourglassHazard {
    constructor(x, y, cfg, isMastered, damageMult, game, opts = null) {
        this.x = x;
        this.y = y;
        this.radius = cfg.radius || 250;
        this.duration = cfg.duration || 240;
        this.maxDuration = this.duration;
        this.slowMultiplier = cfg.slowMultiplier || 0.30;
        this.bulletSlow = cfg.bulletSlow || 0.72;
        this.speedBuff = cfg.speedBuff || 1.25;
        this.fireHaste = cfg.fireHaste || 0.35;
        this.isMastered = !!isMastered;
        this.isBonus = !!(opts && opts.isBonus) || !!cfg.isBonusUpgraded;
        this.isRemoteCaster = !!(opts && opts.isRemoteCaster);
        this.casterPlayer = (opts && opts.casterPlayer) || null;
        this.healInterval = (cfg.healIntervalSec > 0) ? Math.round(cfg.healIntervalSec * 60) : (this.isBonus ? 120 : 0);
        this.healFlat = cfg.healFlat || (this.isBonus ? 22 : 0);
        this.healPct = cfg.healPct || (this.isBonus ? 0.06 : 0);
        this.reviveInZone = !!(cfg.reviveInZone || this.isBonus);
        this.reviveHpRatio = cfg.reviveHpRatio || 0.60;
        this.shatterDamage = (cfg.shatterDamage || 0) * (damageMult || 1);
        this.stunDuration = cfg.stunDuration || 1.5;
        this.game = game;
        this.age = 0;
        this.dead = false;
        this.absorbedHits = 0;
        this._healTimer = 0;
        this._healPulseTimer = 0;
        this._reviveUsed = false;

        this.sandGrains = [];
        for (let i = 0; i < 16; i++) {
            this.sandGrains.push({
                ang: Math.random() * Math.PI * 2,
                rad: 0.25 + Math.random() * 0.7,
                spd: 0.015 + Math.random() * 0.025,
                size: 2.5 + Math.random() * 2.5
            });
        }
    }

    _triggerEternityShatter(enemies, effects) {
        const cam = this.game ? this.game.camera : null;
        if (cam && typeof cam.addShake === 'function') cam.addShake(14);

        const bonusDmg = Math.min(180, this.absorbedHits * 18);
        const finalDmg = this.shatterDamage + bonusDmg;

        if (effects) {
            effects.addComicSplash(this.x, this.y - 44, 'ETERNITY SHATTER! ⏳', '#fed330', 30, true);
            effects.addShockwave(this.x, this.y, this.radius + 36, 'rgba(254, 211, 48, 0.95)');
            effects.addShockwave(this.x, this.y, this.radius * 0.85, 'rgba(0, 242, 254, 0.90)');
            effects.addSparks(this.x, this.y, '#fed330', 26);
            effects.addSparks(this.x, this.y, '#a55eea', 16);
        }
        if (window.soundEngine && typeof window.soundEngine.playHit === 'function') {
            window.soundEngine.playHit(true, true);
        }

        if (!Array.isArray(enemies)) return;
        for (const e of enemies) {
            if (!e || e.dead || e.isDying || e.isAirborneImmune) continue;
            const dx = e.x - this.x;
            const dy = e.y - this.y;
            const hitR = this.radius + (e.radius || 22);
            if (dx * dx + dy * dy <= hitR * hitR) {
                e.takeDamage(finalDmg, effects, false);
                if (!e.dead && e.hp > 0 && !e.isStationary) {
                    if (typeof e.applyStun === 'function') e.applyStun(this.stunDuration, effects);
                    else e.stunTimer = Math.max(e.stunTimer || 0, Math.round(this.stunDuration * 60));
                }
            }
        }
    }

    _reviveTeammate(target, isRemoteTarget, game, cs, effects) {
        this._reviveUsed = true;
        const reviveHp = Math.max(1, Math.round((target.maxHp || 100) * this.reviveHpRatio));
        target.hp = reviveHp;
        target.invulnerableTimer = Math.max(target.invulnerableTimer || 0, 90);
        target.happyTimer = 50;
        target.isGrabbed = false;
        target.isAirborne = false;
        target.airZ = 0;
        target.stunTimer = 0;
        target.speedDebuffTimer = 0;
        if ('dead' in target) target.dead = false;
        if (isRemoteTarget) target.isDowned = false;

        if (effects) {
            effects.addComicSplash(target.x, target.y - 42, '⏳ CHRONOS REVIVE!', '#2ed573', 28, true);
            effects.addShockwave(target.x, target.y, 150, 'rgba(46, 213, 115, 0.92)');
            effects.addSparks(target.x, target.y, '#fed330', 16);
            effects.addSparks(target.x, target.y, '#2ed573', 12);
        }
        if (window.soundEngine && typeof window.soundEngine.playLevelUp === 'function') {
            window.soundEngine.playLevelUp();
        }
        if (game && game.ui && typeof game.ui.addKillfeed === 'function') {
            game.ui.addKillfeed(isRemoteTarget ? `🤝 ${target.name || 'Partner'} CHRONOS REVIVED!` : '🤝 YOU WERE REVIVED BY CHRONOS!');
        }
        if (cs && cs.net && cs.net.connected) {
            cs.net.send('COOP_FX', {
                t: 'ring', x: Math.round(target.x), y: Math.round(target.y),
                r: 150, c: 'rgba(46, 213, 115, 0.92)', m: '⏳ CHRONOS REVIVE!',
                sc: '#fed330', sn: 14
            });
        }
        if (cs && typeof cs.broadcastSnapshot === 'function') {
            cs.broadcastSnapshot();
        }
    }

    _updateBonusPerks(dt, player, effects) {
        if (!this.isBonus) return;
        if (this._healPulseTimer > 0) this._healPulseTimer = Math.max(0, this._healPulseTimer - dt);

        if (this.healInterval > 0) {
            this._healTimer += dt;
            while (this._healTimer >= this.healInterval) {
                this._healTimer -= this.healInterval;
                this._healPulseTimer = 28;
                if (!this.isRemoteCaster && player && !player.dead && player.hp > 0) {
                    const rawHeal = Math.max(1, Math.round(this.healFlat + (player.maxHp || 100) * this.healPct));
                    const before = player.hp;
                    if (typeof player.heal === 'function') player.heal(rawHeal);
                    else player.hp = Math.min(player.maxHp || 100, player.hp + rawHeal);
                    const gained = Math.max(0, Math.round(player.hp - before));
                    if (effects) {
                        effects.addSparks(player.x, player.y, '#2ed573', 8);
                        if (gained > 0) effects.addPopup(player.x, player.y - 34, `+${gained} HP ⏳`, '#2ed573', 22);
                    }
                    if (gained > 0 && window.soundEngine && typeof window.soundEngine.playPickup === 'function') {
                        window.soundEngine.playPickup('heart');
                    }
                }
            }
        }

        if (this.reviveInZone && !this._reviveUsed) {
            const g = this.game || (typeof window !== 'undefined' ? window.gameInstance : null);
            const cs = (g && !g.isCoopGuest) ? g.coopSession : null;
            if (!cs) return;
            const candidates = [];
            if (player && player !== this.casterPlayer && player.hp <= 0) {
                candidates.push({ target: player, isRemote: false });
            }
            const rps = cs.remotePlayers || (cs.remotePlayer ? [cs.remotePlayer] : []);
            for (let ri = 0; ri < rps.length; ri++) {
                const rp = rps[ri];
                if (rp && rp !== this.casterPlayer && (rp.isDowned || rp.hp <= 0) && !rp.isDownedDisconnected) {
                    candidates.push({ target: rp, isRemote: true });
                }
            }
            for (let ci = 0; ci < candidates.length; ci++) {
                const { target, isRemote } = candidates[ci];
                const reach = this.radius + (target.radius || 24);
                const dx = target.x - this.x, dy = target.y - this.y;
                if (dx * dx + dy * dy <= reach * reach) {
                    this._reviveTeammate(target, isRemote, g, cs, effects);
                    break;
                }
            }
        }
    }

    update(dt = 1, enemies = [], player = null, effects = null) {
        if (this.dead) return;
        this.age += dt;
        this.duration -= dt;

        if (this.duration <= 0) {
            this.dead = true;
            if (this.isMastered && this.shatterDamage > 0) {
                this._triggerEternityShatter(enemies, effects);
            }
            return;
        }

        this._updateBonusPerks(dt, player, effects);

        for (const s of this.sandGrains) {
            s.ang += s.spd * dt;
        }

        // Slow Enemies Inside the Chronos Dome
        const rSq = this.radius * this.radius;
        if (Array.isArray(enemies)) {
            for (const e of enemies) {
                if (!e || e.dead || e.isDying) continue;
                const dx = e.x - this.x;
                const dy = e.y - this.y;
                const checkR = this.radius + (e.radius || 20);
                if (dx * dx + dy * dy <= checkR * checkR) {
                    if (typeof e.applyChronoSlow === 'function') {
                        e.applyChronoSlow(0.35, this.slowMultiplier);
                    }
                    if (!e._chronoCounted && this.absorbedHits < 15) {
                        e._chronoCounted = true;
                        this.absorbedHits++;
                    }
                    if (effects && Math.random() < 0.08 * dt) {
                        effects.addSparks(e.x, e.y, '#fed330', 1);
                    }
                }
            }
        }

        // Slow Enemy Projectiles Inside the Chronos Dome
        const g = this.game || (typeof window !== 'undefined' ? window.gameInstance : null);
        if (g && Array.isArray(g.bullets)) {
            for (const b of g.bullets) {
                if (!b || b.dead || !b.isEnemy) continue;
                const dx = b.x - this.x;
                const dy = b.y - this.y;
                if (dx * dx + dy * dy <= rSq) {
                    b.x -= (b.vx || 0) * this.bulletSlow * dt;
                    b.y -= (b.vy || 0) * this.bulletSlow * dt;
                    if (!b._chronoTagged && this.absorbedHits < 15) {
                        b._chronoTagged = true;
                        this.absorbedHits++;
                    }
                    if (effects && Math.random() < 0.14 * dt) {
                        effects.addSparks(b.x, b.y, '#00f2fe', 1);
                    }
                }
            }
        }

        // Accelerate Player Move Speed & Fire Rate While Standing Inside Dome
        if (player && !player.dead) {
            const pdx = player.x - this.x;
            const pdy = player.y - this.y;
            if (pdx * pdx + pdy * pdy <= rSq) {
                player.secondWindSpeedTimer = Math.max(player.secondWindSpeedTimer || 0, 12);
                player.secondWindSpeedMult = Math.max(player.secondWindSpeedMult || 1, this.speedBuff);
                if (player.fireCooldown > 0) {
                    player.fireCooldown = Math.max(0, player.fireCooldown - dt * this.fireHaste);
                }
            }
        }
    }

    draw(ctx) {
        if (this.dead) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        const lifeRatio = Math.max(0, this.duration / this.maxDuration);
        const fade = Math.min(1, this.age / 12) * Math.min(1, lifeRatio * 3.5);
        ctx.globalAlpha = fade;

        // Royal Violet & Gold Temporal Sanctuary Field (Emerald-Gold Overclock on Bonus Lv.6)
        const grad = ctx.createRadialGradient(0, 0, this.radius * 0.15, 0, 0, this.radius);
        if (this.isBonus) {
            grad.addColorStop(0, 'rgba(38, 128, 102, 0.32)');
            grad.addColorStop(0.7, 'rgba(46, 213, 115, 0.18)');
            grad.addColorStop(1, 'rgba(254, 211, 48, 0.36)');
        } else {
            grad.addColorStop(0, 'rgba(60, 42, 112, 0.30)');
            grad.addColorStop(0.7, 'rgba(165, 94, 234, 0.18)');
            grad.addColorStop(1, 'rgba(254, 211, 48, 0.32)');
        }
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();

        if (this.isBonus && this._healPulseTimer > 0) {
            const pRatio = 1 - (this._healPulseTimer / 28);
            ctx.strokeStyle = `rgba(46, 213, 115, ${0.75 * (1 - pRatio)})`;
            ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(0, 0, this.radius * (0.2 + pRatio * 0.8), 0, Math.PI * 2); ctx.stroke();
        }

        // Outer Dashed Gold Clock Ring & Sweeping Clock Hand
        ctx.strokeStyle = '#fed330';
        ctx.lineWidth = this.isBonus ? 4.8 : (this.isMastered ? 4.2 : 3.2);
        ctx.setLineDash([16, 8]);
        ctx.beginPath(); ctx.arc(0, 0, this.radius, this.age * 0.015, this.age * 0.015 + Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = this.isBonus ? 'rgba(46, 213, 115, 0.72)' : 'rgba(0, 242, 254, 0.55)';
        ctx.lineWidth = this.isBonus ? 2.6 : 2;
        ctx.beginPath(); ctx.arc(0, 0, this.radius * 0.72, -this.age * 0.02, -this.age * 0.02 + Math.PI * 2); ctx.stroke();

        // Clock Hands Sweeping Slowly
        const handAng = this.age * 0.03;
        ctx.strokeStyle = 'rgba(254, 211, 48, 0.45)';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(handAng) * this.radius * 0.85, Math.sin(handAng) * this.radius * 0.85); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(-handAng * 0.4) * this.radius * 0.55, Math.sin(-handAng * 0.4) * this.radius * 0.55); ctx.stroke();

        // Floating Golden Sand Grains
        ctx.fillStyle = '#00f2fe';
        for (const s of this.sandGrains) {
            const sx = Math.cos(s.ang) * this.radius * s.rad;
            const sy = Math.sin(s.ang) * this.radius * s.rad;
            ctx.beginPath(); ctx.arc(sx, sy, s.size, 0, Math.PI * 2); ctx.fill();
        }

        // Levitating Golden Hourglass Centerpiece
        const bob = Math.sin(this.age * 0.14) * 5;
        ctx.translate(0, bob - 8);
        ctx.strokeStyle = '#0f1419'; ctx.lineWidth = 2.4;
        ctx.fillStyle = '#fed330';
        ctx.fillRect(-13, -18, 26, 5);
        ctx.fillRect(-13, 13, 26, 5);
        ctx.strokeRect(-13, -18, 26, 5);
        ctx.strokeRect(-13, 13, 26, 5);

        ctx.fillStyle = 'rgba(0, 242, 254, 0.65)';
        ctx.beginPath();
        ctx.moveTo(-10, -13); ctx.lineTo(10, -13); ctx.lineTo(0, 0); ctx.closePath();
        ctx.moveTo(-10, 13); ctx.lineTo(10, 13); ctx.lineTo(0, 0); ctx.closePath();
        ctx.fill(); ctx.stroke();

        ctx.restore();
    }
}

class ChronosHourglassSkill {
    static execute(player, level, enemies = [], effects = null, camera = null, game = null) {
        const sd = (typeof SKILLS !== 'undefined' && SKILLS.chrono_hourglass) ? SKILLS.chrono_hourglass : null;
        const ld = (sd && sd.levels) ? (sd.levels[level] || sd.levels[1]) : { radius: 250, duration: 240, slowMultiplier: 0.30, bulletSlow: 0.72, speedBuff: 1.25, fireHaste: 0.35, shatterDamage: 0 };
        const isMastered = level >= 5;
        const isBonus = level >= 6 || !!(ld && ld.isBonusUpgraded);
        const cdSec = (ld && ld.cooldown) ? ld.cooldown : ((isMastered && sd && sd.masteryCooldown) ? sd.masteryCooldown : (sd ? sd.cooldown : 13.5));
        player.skillCooldown = Math.round(cdSec * 60);
        player.maxSkillCooldown = player.skillCooldown;

        const activeGame = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        if (effects) {
            const splash = isBonus ? 'CHRONOS+ OVERCLOCK! ⏳💫' : (isMastered ? 'ETERNITY DOME! ⏳' : 'TIME FREEZE! ⏳');
            effects.addComicSplash(player.x, player.y - 36, splash, isBonus ? '#2ed573' : '#fed330', 26, true);
            effects.addShockwave(player.x, player.y, (ld.radius || 250) * 0.9, isBonus ? 'rgba(46, 213, 115, 0.78)' : 'rgba(254, 211, 48, 0.75)');
            effects.addSparks(player.x, player.y, isBonus ? '#2ed573' : '#00f2fe', 14);
        }
        if (camera && typeof camera.addShake === 'function') camera.addShake(isBonus ? 9 : 7);
        if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') window.soundEngine.playSelect();

        if (activeGame) {
            if (!activeGame.hazards) activeGame.hazards = [];
            activeGame.hazards.push(new ChronosHourglassHazard(
                player.x, player.y, ld, isMastered, player.damageMultiplier || 1, activeGame,
                { isBonus, isRemoteCaster: !!(player && player._isRemoteCaster), casterPlayer: (player && player._casterPlayer) || (!(player && player._isRemoteCaster) ? player : null) }
            ));
        }
    }
}

if (typeof window !== 'undefined') window.ChronosHourglassSkill = ChronosHourglassSkill;
if (typeof module !== 'undefined' && module.exports) module.exports = { ChronosHourglassSkill, ChronosHourglassHazard };
