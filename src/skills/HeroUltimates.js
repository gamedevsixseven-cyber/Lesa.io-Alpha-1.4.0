/**
 * Lesa.io - Hero Ultimates Subsystem ("Q" Key on PC / ULT Button on Mobile)
 * Signature meter-charged Hero Ultimates:
 *   - Psanas: "RAGE" (6.7s — 2x MaxHP & Heal, 2x DMG, 2x Speed, Boss Stun Immunity)
 *   - Psogas: "SPICY INFERNO STORM" (5.5s — 360° Blazing Chili Vortex + 8-Way Chili Spiral Volleys + 1.35x Speed)
 *   - Petros: "SYM VF185" (6.5s — Mounts 2.5D Jet-Black/Magenta SYM VF185 at 2.15x Speed, running over enemies & crates!)
 *   - 50balos: "CRYPTON X" (6.5s — Mounts 2.5D Pearl-White Crypton X 135 at 2.22x Speed, ramming foes & scorching with exhaust fire!)
 */

const HERO_ULTIMATES = {
    psanas: {
        id: 'rage',
        name: 'RAGE',
        mobileLabel: 'RAGE',
        icon: 'assets/SkillsIcons/UltRageSkill.svg',
        duration: 402, // 6.7s at 60 FPS
        accent: '#ff3838',
        barColor: '#ff4757'
    },
    psogas: {
        id: 'inferno_storm',
        name: 'INFERNO STORM',
        mobileLabel: 'INFERNO',
        icon: 'assets/SkillsIcons/UltInfernoSkill.svg',
        duration: 330, // 5.5s at 60 FPS
        accent: '#ff9f1a',
        barColor: '#ffa502'
    },
    petros: {
        id: 'vf185',
        name: 'SYM VF185',
        mobileLabel: 'VF185',
        icon: 'assets/SkillsIcons/UltVF185Skill.svg',
        duration: 390, // 6.5s at 60 FPS
        accent: '#ff4785',
        barColor: '#ff4785'
    },
    '50balos': {
        id: 'crypton_x',
        name: 'CRYPTON X',
        mobileLabel: 'CRYPTON',
        icon: 'assets/SkillsIcons/UltCryptonXSkill.svg',
        duration: 390, // 6.5s at 60 FPS
        accent: '#ff6b35',
        barColor: '#f8fafc'
    }
};

class HeroUltimates {
    static MAX_CHARGE = 100;
    static _fires = []; // unused legacy ref kept empty for compat; active pools live in CryptonExhaustFire

    static getConfig(heroType) {
        return HERO_ULTIMATES[heroType] || null;
    }

    static hasUltimate(heroType) {
        return !!this.getConfig(heroType);
    }

    static initPlayer(player) {
        if (!player) return;
        player.ultCharge = this.hasUltimate(player.heroType) ? this.MAX_CHARGE : 0;
        player.ultActive = false;
        player.ultId = null;
        player.ultTimer = 0;
        player.ultMaxTimer = 1;
        player.rageUltActive = false;
        player.infernoUltActive = false;
        player.vf185Active = false;
        player.cryptonXActive = false;
        player.cryptonXAngle = 0;
        player._ultBaseMaxHp = null;
        player._ultDmgBonus = 1.0;
        player._ultTick = 0;
        player._vfSkids = [];
        player._cxSkids = [];
        player._cxFireSpawn = 0;
        if (typeof CryptonExhaustFire !== 'undefined' && (typeof window === 'undefined' || !window.gameInstance || window.gameInstance.player === player)) {
            CryptonExhaustFire.clear();
        }
    }

    static onDamageDealt(player, amount = 0) {
        if (!player || player.ultActive || !this.hasUltimate(player.heroType)) return;
        const gain = Math.min(4.2, Math.max(0.25, (amount || 0) * 0.032));
        player.ultCharge = Math.min(this.MAX_CHARGE, (player.ultCharge || 0) + gain);
    }

    static onEnemyKilled(player, enemy = null) {
        if (!player || player.ultActive || !this.hasUltimate(player.heroType)) return;
        const bonus = (enemy && (enemy.isBoss || enemy.isMiniBoss)) ? 24 : 8.5;
        player.ultCharge = Math.min(this.MAX_CHARGE, (player.ultCharge || 0) + bonus);
    }

    static canActivate(player) {
        if (!player || player.hp <= 0 || player.ultActive) return false;
        const cfg = this.getConfig(player.heroType);
        if (!cfg) return false;
        if ((player.ultCharge || 0) < this.MAX_CHARGE) return false;
        if (player.isGrabbed || player.isAirborne) return false;
        // Psanas Rage explicitly breaks stuns; other ultimates wait out hard stun
        if (player.stunTimer > 0 && player.heroType !== 'psanas') return false;
        return true;
    }

    static execute(player, enemies = [], effects = null, camera = null, game = null) {
        if (!this.canActivate(player)) return false;
        const cfg = this.getConfig(player.heroType);
        if (!cfg) return false;

        player.ultCharge = 0;
        player.ultActive = true;
        player.ultId = cfg.id;
        player.ultTimer = cfg.duration;
        player.ultMaxTimer = cfg.duration;
        player._ultTick = 0;

        if (cfg.id === 'rage') {
            this._startPsanasRage(player, effects, camera);
        } else if (cfg.id === 'inferno_storm') {
            this._startPsogasInferno(player, effects, camera);
        } else if (cfg.id === 'vf185' || cfg.id === 'crypton_x') {
            this._startBikeUlt(player, effects, camera, cfg.id === 'crypton_x');
        }

        if (window.soundEngine && typeof window.soundEngine.playHeroUlt === 'function') {
            window.soundEngine.playHeroUlt(cfg.id);
        } else if (window.soundEngine) {
            window.soundEngine.playLevelUp();
        }
        return true;
    }

    static _startPsanasRage(player, effects, camera) {
        player.rageUltActive = true;
        player.stunTimer = 0;
        player.dizzyTimer = 0;
        player.speedDebuffTimer = 0;
        player._ultBaseMaxHp = player.maxHp;
        player._ultDmgBonus = 2.0;
        player.applyEquipmentStats();
        player.hp = Math.min(player.maxHp, Math.round(player.hp * 2));

        if (camera) camera.shake(10, 14);
        if (effects) {
            effects.addComicSplash(player.x, player.y - 46, 'ARGHH!! 🔥', '#ff3838', 24, true);
            effects.addShockwave(player.x, player.y, 175, 'rgba(255, 56, 56, 0.92)');
            effects.addSparks(player.x, player.y, '#ff3838', 18);
            effects.addSparks(player.x, player.y, '#ffd32a', 12);
            if (typeof effects.triggerScreenFlash === 'function') {
                effects.triggerScreenFlash('#ff3838', 0.34, 18);
            }
        }
    }

    static _startPsogasInferno(player, effects, camera) {
        player.infernoUltActive = true;
        if (camera) camera.shake(8, 12);
        if (effects) {
            effects.addComicSplash(player.x, player.y - 46, '🌶️ INFERNO STORM!', '#ff9f1a', 22, true);
            effects.addShockwave(player.x, player.y, 230, 'rgba(255, 159, 26, 0.92)');
            effects.addSparks(player.x, player.y, '#ff4757', 16);
            effects.addSparks(player.x, player.y, '#fff200', 14);
            if (typeof effects.triggerScreenFlash === 'function') {
                effects.triggerScreenFlash('#ff9f1a', 0.30, 16);
            }
        }
    }

    static _startBikeUlt(player, effects, camera, isCrypton = false) {
        player.stunTimer = 0;
        player.speedDebuffTimer = 0;
        if (isCrypton) {
            player.cryptonXActive = true;
            player.cryptonXAngle = player.angle || 0;
            player._cxWheelSpin = 0;
            player._cxFireSpawn = 3.5;
        } else {
            player.vf185Active = true;
            player.vf185Angle = player.angle || 0;
            player._vfWheelSpin = 0;
        }
        if (typeof player.applyEquipmentStats === 'function') player.applyEquipmentStats();
        if (camera) camera.shake(9, 12);
        if (effects) {
            const label = isCrypton ? '🏍️ CRYPTON X!! 🔥' : '🏍️ SYM VF185!!';
            const color = isCrypton ? '#f8fafc' : '#ff4785';
            const ring = isCrypton ? 'rgba(255, 107, 53, 0.92)' : 'rgba(255, 71, 133, 0.92)';
            effects.addComicSplash(player.x, player.y - 48, label, color, 22, true);
            effects.addShockwave(player.x, player.y, 165, ring);
            effects.addDust(player.x, player.y + 12, 12, 16);
            effects.addSparks(player.x, player.y + 10, isCrypton ? '#ff6b35' : '#eccc3b', 12);
            if (typeof effects.triggerScreenFlash === 'function') {
                effects.triggerScreenFlash(isCrypton ? '#ff6b35' : '#ff4785', 0.28, 16);
            }
        }
    }

    static reapplyActiveBuffs(player) {
        if (!player || !player.ultActive) return;
        if (player.rageUltActive) {
            player._ultBaseMaxHp = player.maxHp;
            player.maxHp = Math.round(player.maxHp * 2);
            player.damageMultiplier = (player.damageMultiplier || 1) * 2.0;
        }
        if (player.vf185Active || player.cryptonXActive) {
            player.damageReduction = Math.min(0.65, (player.damageReduction || 0) + 0.25);
        }
    }

    static getSpeedMultiplier(player) {
        if (!player || !player.ultActive) return 1.0;
        if (player.rageUltActive) return 2.0;
        if (player.vf185Active) return 2.15;
        if (player.cryptonXActive) return 2.22;
        if (player.infernoUltActive) return 1.35;
        return 1.0;
    }

    static update(player, dt = 1, enemies = [], bullets = [], effects = null, game = null) {
        if (Array.isArray(enemies)) {
            for (let i = 0; i < enemies.length; i++) {
                const e = enemies[i];
                if (e && e._vf185RamCd > 0) e._vf185RamCd = Math.max(0, e._vf185RamCd - dt);
            }
        }
        // Always step lingering Crypton exhaust fire pools & enemy burns even after ult ends
        this._updateFiresAndBurns(dt, enemies, effects, game);

        if (!player || !this.hasUltimate(player.heroType)) return;

        if (!player.ultActive) {
            if (player.hp > 0 && (player.ultCharge || 0) < this.MAX_CHARGE) {
                player.ultCharge = Math.min(this.MAX_CHARGE, (player.ultCharge || 0) + 0.075 * dt);
            }
            return;
        }

        player.ultTimer -= dt;
        player._ultTick += dt;

        if (player.rageUltActive) {
            player.stunTimer = 0;
            player.speedDebuffTimer = 0;
            if (effects && Math.random() < 0.45 * dt) {
                effects.addSparks(player.x + (Math.random() - 0.5) * 28, player.y + (Math.random() - 0.5) * 24, Math.random() < 0.5 ? '#ff3838' : '#ffd32a', 2);
            }
        } else if (player.infernoUltActive) {
            this._updatePsogasInferno(player, dt, enemies, bullets, effects);
        } else if (player.vf185Active) {
            player.stunTimer = 0;
            player.speedDebuffTimer = 0;
            if (typeof VF185Model !== 'undefined') VF185Model.recordStep(player, dt, effects);
        } else if (player.cryptonXActive) {
            player.stunTimer = 0;
            player.speedDebuffTimer = 0;
            if (typeof CryptonXModel !== 'undefined') CryptonXModel.recordStep(player, dt, effects);
            this.stepCryptonExhaust(player, dt, effects, !(game && game.isCoopGuest));
        }

        if (player.ultTimer <= 0) {
            this._endUltimate(player, effects);
        }
    }

    static stepBikeChassis(player, dt, effects, angKey, spinKey, skidKey, sparkCol) {
        if (!player[skidKey]) player[skidKey] = [];
        const skids = player[skidKey];
        const speed = Math.hypot(player.vx || 0, player.vy || 0);
        player[spinKey] = (player[spinKey] || 0) + (0.14 + speed * 0.045) * dt;
        const targetAng = speed > 0.4 ? Math.atan2(player.vy, player.vx) : (player.angle || 0);
        if (!Number.isFinite(player[angKey])) player[angKey] = targetAng;
        let diff = targetAng - player[angKey];
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        player[angKey] += diff * Math.min(1, 0.30 * dt);

        if (speed > 0.8) {
            if ((Math.abs(diff) > 0.12 || player.isDashing || Math.random() < 0.38 * dt) && skids.length < 36) {
                skids.push({ x: player.x - Math.cos(player[angKey]) * 14, y: player.y + 12 - Math.sin(player[angKey]) * 6, ang: player[angKey], alpha: player.isDashing ? 0.62 : 0.35 });
            }
            if (effects && Math.random() < (player.isDashing ? 0.9 : 0.5) * dt) {
                effects.addSparks(player.x - Math.cos(player[angKey]) * 29, player.y + 4 - Math.sin(player[angKey]) * 14, Math.random() < 0.55 ? sparkCol : '#fed330', player.isDashing ? 3 : 2);
            }
        }
        for (let i = skids.length - 1; i >= 0; i--) {
            skids[i].alpha -= 0.016 * dt;
            if (skids[i].alpha <= 0) skids.splice(i, 1);
        }
    }

    static drawBikeSkids(player, ctx, skidKey) {
        const skids = player[skidKey];
        if (!skids || skids.length === 0) return;
        ctx.save();
        for (let i = 0; i < skids.length; i++) {
            const s = skids[i];
            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate(s.ang);
            ctx.fillStyle = `rgba(25, 22, 20, ${s.alpha})`;
            ctx.fillRect(-10, -4, 18, 4);
            ctx.fillRect(-10, 2, 18, 4);
            ctx.restore();
        }
        ctx.restore();
    }

    static stepCryptonExhaust(rider, dt = 1, effects = null, canDamage = true) {
        if (typeof CryptonExhaustFire !== 'undefined') CryptonExhaustFire.stepExhaust(rider, dt, effects, canDamage);
    }

    static igniteEnemy(e, attacker = null, effects = null) {
        if (typeof CryptonExhaustFire !== 'undefined') CryptonExhaustFire.igniteEnemy(e, attacker, effects);
    }

    static _updateFiresAndBurns(dt, enemies, effects, game) {
        if (typeof CryptonExhaustFire !== 'undefined') CryptonExhaustFire.update(dt, enemies, effects, game);
    }

    static drawExhaustFires(ctx, cam = null) {
        if (typeof CryptonExhaustFire !== 'undefined') CryptonExhaustFire.drawFires(ctx, cam);
    }

    static drawBurningEnemies(ctx, cam = null) {
        if (typeof CryptonExhaustFire !== 'undefined') CryptonExhaustFire.drawBurningEnemies(ctx, cam);
    }

    static _updatePsogasInferno(player, dt, enemies, bullets, effects) {
        if (!player._infernoStep) player._infernoStep = 0;
        const prevTick = Math.floor((player._ultTick - dt) / 14);
        const curTick = Math.floor(player._ultTick / 14);
        if (curTick <= prevTick) return;

        player._infernoStep++;
        const radius = 235;
        const radiusSq = radius * radius;
        const dmg = Math.round(30 * (player.damageMultiplier || 1));

        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (!e || e.dead || e.isDying || e.isAirborneImmune) continue;
            const dx = e.x - player.x;
            const dy = e.y - player.y;
            if (dx * dx + dy * dy <= radiusSq) {
                e.takeDamage(dmg, effects, false);
                if (effects && Math.random() < 0.55) {
                    effects.addSparks(e.x, e.y, '#ff9f1a', 3);
                }
            }
        }

        // Every ~0.46s (every 2nd tick), spiral out 8 piercing chili fireballs
        if (player._infernoStep % 2 === 0 && typeof Bullet !== 'undefined' && Array.isArray(bullets)) {
            const offset = player._infernoStep * 0.35;
            const boltDmg = Math.round(38 * (player.damageMultiplier || 1));
            const spawned = [];
            for (let k = 0; k < 8; k++) {
                const ang = offset + (k / 8) * Math.PI * 2;
                const mx = player.x + Math.cos(ang) * 26;
                const my = player.y + Math.sin(ang) * 26;
                const b = new Bullet({
                    x: mx,
                    y: my,
                    vx: Math.cos(ang) * 14,
                    vy: Math.sin(ang) * 14,
                    damage: boltDmg,
                    speed: 14,
                    radius: 10,
                    type: 'pepper',
                    isEnemy: false,
                    pierce: 2,
                    maxBounces: 0,
                    range: 460,
                    shooter: player,
                    isCrit: false
                });
                b.color = '#ff6b35';
                bullets.push(b);
                spawned.push(b);
            }
            if (typeof window !== 'undefined' && window.gameInstance && window.gameInstance.coopSession && window.gameInstance.coopSession.isHost && player === window.gameInstance.player && typeof CoopCombatFx !== 'undefined') {
                CoopCombatFx.emitBullets(window.gameInstance.coopSession.net, 'HOST_SHOOT', spawned);
            }
            if (effects) effects.addShockwave(player.x, player.y, radius * 0.9, 'rgba(255, 130, 30, 0.55)');
        }
    }

    static onBikeRamEnemy(player, e, effects, game) {
        if (!player || (!player.vf185Active && !player.cryptonXActive) || !e || e.dead) return;
        if (e._vf185RamCd > 0) return;

        e._vf185RamCd = 16;
        const isCrypton = !!player.cryptonXActive;
        const isBoss = !!(e.isBoss || e.isMiniBoss);
        const baseDmg = isCrypton ? 145 : 185;
        const dmg = Math.round(baseDmg * (player.damageMultiplier || 1) * (isBoss ? (isCrypton ? 1.45 : 1.5) : 1.0));
        const isGuest = !!(game && game.isCoopGuest);
        e.takeDamage(dmg, effects, true);
        if (isGuest && e.dead) e.dead = false;
        if (isCrypton && !isGuest) this.igniteEnemy(e, player, effects);

        if (!e.isStationary && !e.isBoss) {
            const ang = Math.atan2(e.y - player.y, e.x - player.x);
            const kb = isCrypton ? 34 : 42;
            e.x += Math.cos(ang) * kb;
            e.y += Math.sin(ang) * kb;
        }
        if (effects) {
            effects.addSparks(e.x, e.y, isCrypton ? '#ff6b35' : '#ff4785', 9);
            effects.addSparks(e.x, e.y, isCrypton ? '#ffffff' : '#fed330', 6);
            effects.addComicSplash(e.x, e.y - 24, isCrypton ? 'CRYPTON X!! 🔥' : (isBoss ? 'VF185 SMASH! 💥' : 'ROADKILL! 🏍️'));
        }
        const cam = game ? game.camera : null;
        if (cam && typeof cam.shake === 'function') cam.shake(5, 7);
        if (window.soundEngine) window.soundEngine.playHit(true, true);
    }

    static onVF185RamEnemy(player, e, effects, game) {
        return this.onBikeRamEnemy(player, e, effects, game);
    }

    static _endUltimate(player, effects) {
        const wasRage = player.rageUltActive;
        const wasBike = player.vf185Active || player.cryptonXActive;
        player.ultActive = false;
        player.ultId = null;
        player.ultTimer = 0;
        player.rageUltActive = false;
        player.infernoUltActive = false;
        player.vf185Active = false;
        player.cryptonXActive = false;
        player._ultDmgBonus = 1.0;

        if (wasRage || wasBike) {
            const wasAlive = player.hp > 0;
            player.applyEquipmentStats();
            if (wasAlive) {
                player.hp = Math.max(1, Math.min(player.maxHp, player.hp));
            }
        }
        if (effects) {
            effects.addDust(player.x, player.y, 6, 10);
        }
    }

    static drawUnderPlayer(player, ctx) {
        if (!player || !player.ultActive) return;
        const t = Date.now() * 0.005;

        if (player.vf185Active && typeof VF185Model !== 'undefined') {
            VF185Model.drawTireSkids(player, ctx);
            return;
        }
        if (player.cryptonXActive && typeof CryptonXModel !== 'undefined') {
            CryptonXModel.drawTireSkids(player, ctx);
            return;
        }

        ctx.save();
        ctx.translate(player.x, player.y);

        if (player.rageUltActive) {
            const pulse = 1 + Math.sin(t * 2.4) * 0.1;
            const g = ctx.createRadialGradient(0, 4, 8, 0, 4, 52 * pulse);
            g.addColorStop(0, 'rgba(255, 45, 55, 0.56)');
            g.addColorStop(0.6, 'rgba(220, 20, 40, 0.25)');
            g.addColorStop(1, 'rgba(200, 0, 20, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.ellipse(0, 8, 52 * pulse, 34 * pulse, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 211, 42, 0.72)';
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.ellipse(0, 8, 38 * pulse, 22 * pulse, 0, t, t + Math.PI * 1.3);
            ctx.stroke();
        } else if (player.infernoUltActive) {
            const r = 225;
            const fg = ctx.createRadialGradient(0, 0, 24, 0, 0, r);
            fg.addColorStop(0, 'rgba(255, 165, 2, 0.16)');
            fg.addColorStop(0.75, 'rgba(255, 71, 87, 0.14)');
            fg.addColorStop(1, 'rgba(255, 60, 20, 0)');
            ctx.fillStyle = fg;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();

            // Rotating cyclone fire arcs
            ctx.rotate(t * 1.8);
            for (let k = 0; k < 4; k++) {
                ctx.rotate(Math.PI * 0.5);
                ctx.strokeStyle = k % 2 === 0 ? 'rgba(255, 159, 26, 0.72)' : 'rgba(255, 56, 56, 0.68)';
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.arc(0, 0, r - 28 - (k % 2) * 26, 0.1, 1.25);
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    static drawOverPlayer(player, ctx) {
        if (!player || !player.ultActive) return;
        const t = Date.now() * 0.008;
        ctx.save();
        ctx.translate(player.x, player.y - (player.airZ || 0));

        if (player.rageUltActive) {
            // Fiery Crimson Rage Aura flames licking up around Psanas
            ctx.strokeStyle = 'rgba(255, 56, 56, 0.85)';
            ctx.lineWidth = 3;
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2 + t * 0.6;
                const fx = Math.cos(a) * 28;
                const fy = Math.sin(a) * 18 - 10;
                ctx.fillStyle = i % 2 === 0 ? '#ff3838' : '#ffa502';
                ctx.beginPath();
                ctx.moveTo(fx - 4, fy + 6);
                ctx.quadraticCurveTo(fx, fy - 14 - Math.sin(t + i) * 6, fx + 4, fy + 6);
                ctx.closePath();
                ctx.fill();
            }
        } else if (player.infernoUltActive) {
            ctx.rotate(t * 1.4);
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                ctx.fillStyle = i % 2 === 0 ? '#ff4757' : '#fff200';
                ctx.beginPath();
                ctx.arc(Math.cos(a) * 38, Math.sin(a) * 32 - 8, 4.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    static getHUDState(player) {
        if (!player) return null;
        const cfg = this.getConfig(player.heroType);
        if (!cfg) return null;
        const ratio = player.ultActive
            ? Math.max(0, Math.min(1, (player.ultTimer || 0) / (player.ultMaxTimer || 1)))
            : Math.max(0, Math.min(1, (player.ultCharge || 0) / this.MAX_CHARGE));
        return {
            cfg,
            active: !!player.ultActive,
            ready: !player.ultActive && (player.ultCharge || 0) >= this.MAX_CHARGE,
            pct: Math.round(ratio * 100)
        };
    }
}

if (typeof window !== 'undefined') {
    window.HeroUltimates = HeroUltimates;
    window.HERO_ULTIMATES = HERO_ULTIMATES;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HeroUltimates, HERO_ULTIMATES };
}
