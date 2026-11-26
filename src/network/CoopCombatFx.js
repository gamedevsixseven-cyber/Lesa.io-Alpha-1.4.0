/**
 * Lesa.io - Co-op Weapon, Armor & Gameplay Combat FX Coordinator
 * Replicates remote player gun projectiles (crit/evolved/sky-bolt/singularity/cryo/breach/mitts),
 * muzzle flashes, recoil, Helios Omega Beams, chain lightning, and gear/perk shockwave rings.
 */
class CoopCombatFx {
    static _lastBeamRelayMs = 0;
    static _fxWindowStart = 0;
    static _fxWindowCount = 0;

    static emitBullets(net, msgType, bullets) {
        if (!net || !net.connected || !Array.isArray(bullets) || bullets.length === 0) return;
        const packBullet = (b, idx) => ({
            x: Math.round(b.x), y: Math.round(b.y),
            vx: Number((b.vx || 0).toFixed(2)), vy: Number((b.vy || 0).toFixed(2)),
            damage: Math.round(b.damage || 25), speed: Number((b.speed || 14).toFixed(2)),
            radius: Math.round(b.radius || 7), type: b.type || 'pea',
            pierce: b.pierce || 1, maxBounces: b.maxBounces || 0,
            range: Math.round(b.maxRange || 900),
            isChargedBubble: !!b.isChargedBubble, isCrit: !!b.isCrit,
            isWeaponEvolved: !!b.isWeaponEvolved, isSkyBolt: !!b.isSkyBolt,
            isSingularityCore: !!b.isSingularityCore, isSpasBreach: !!b._spasBreach,
            isPermafrostShard: !!b.isPermafrostShard, isCryoShard: !!b.isCryoShard,
            isExplosiveMitts: !!b.isExplosiveMitts,
            isMoltenBuster: !!b.isMoltenBuster, isPhantomRail: !!b.isPhantomRail,
            isStareShot: !!b.isStareShot, isStarfallShot: !!b.isStarfallShot,
            celestialTrait: b.celestialTrait || null, wavePhase: b._wavePhase || 0,
            muzzle: (b.type !== 'spas12' && b.type !== 'sawnoff_shotgun') || idx === 0
        });
        const sendOpts = { droppable: true, maxBufferedBytes: 196608 };
        if (bullets.length === 1) {
            if (bullets[0]) net.send(msgType, packBullet(bullets[0], 0), sendOpts);
            return;
        }
        const batch = [];
        for (let i = 0; i < bullets.length; i++) {
            if (bullets[i]) batch.push(packBullet(bullets[i], i));
        }
        if (batch.length > 0) net.send(msgType, { batch }, sendOpts);
    }

    static spawnRemoteBullet(session, bData, isHostAuthoritative = false, fromId = null) {
        const effFrom = (bData && bData.fromId) || fromId || null;
        if (bData && Array.isArray(bData.batch)) {
            for (let i = 0; i < bData.batch.length; i++) {
                this.spawnRemoteBullet(session, bData.batch[i], isHostAuthoritative, effFrom);
            }
            return;
        }
        const game = session && session.game;
        const rp = (session && typeof session.getRemotePlayer === 'function')
            ? session.getRemotePlayer(effFrom) : (session && session.remotePlayer);
        if (!game || !bData || !rp || rp.isDowned || rp.isDownedDisconnected) return;
        if (game.state !== 'PLAYING' || (game.isCutsceneActive && game.isCutsceneActive())) return;
        if (typeof Bullet === 'undefined') return;

        let bx = Number.isFinite(bData.x) ? bData.x : rp.x;
        let by = Number.isFinite(bData.y) ? bData.y : rp.y;
        let vx = Number.isFinite(bData.vx) ? bData.vx : 12;
        let vy = Number.isFinite(bData.vy) ? bData.vy : 0;
        let dmg = Number(bData.damage) || 25;
        let speed = Number(bData.speed) || 14;
        let radius = Number(bData.radius) || 7;
        let pierce = Number(bData.pierce) || 1;
        let bounces = Number(bData.maxBounces) || 0;
        let range = Number(bData.range) || 900;

        if (isHostAuthoritative) {
            const now = performance.now();
            rp._shootBurst = (rp._shootBurst || []).filter(t => (now - t) < 200);
            if (rp._shootBurst.length >= 44) return;
            rp._shootBurst.push(now);
            if (Math.hypot(bx - rp.x, by - rp.y) > 280) { bx = rp.x; by = rp.y; }
            const mag = Math.hypot(vx, vy);
            if (mag > 42) { vx = (vx / mag) * 42; vy = (vy / mag) * 42; }
            dmg = Math.max(1, Math.min(15000, dmg));
            speed = Math.max(1, Math.min(42, speed));
            radius = Math.max(3, Math.min(40, radius));
            pierce = Math.max(1, Math.min(16, Math.round(pierce)));
            bounces = Math.max(0, Math.min(5, Math.round(bounces)));
            range = Math.max(120, Math.min(1600, range));
        }

        const bType = typeof bData.type === 'string' ? bData.type : 'pea';
        const bullet = new Bullet({
            x: bx, y: by, vx, vy, damage: dmg, speed, radius, type: bType,
            isEnemy: false, pierce, maxBounces: bounces, range, shooter: rp, isCrit: !!bData.isCrit
        });
        bullet.isWeaponEvolved = !!bData.isWeaponEvolved;
        if (bData.isChargedBubble) bullet.isChargedBubble = true;
        if (bData.isSkyBolt) bullet.isSkyBolt = true;
        if (bData.isSingularityCore) bullet.isSingularityCore = true;
        if (bData.isSpasBreach) bullet._spasBreach = true;
        if (bData.isPermafrostShard) bullet.isPermafrostShard = true;
        if (bData.isCryoShard) bullet.isCryoShard = true;
        if (bData.isExplosiveMitts) bullet.isExplosiveMitts = true;
        if (bData.isMoltenBuster) bullet.isMoltenBuster = true;
        if (bData.isPhantomRail) bullet.isPhantomRail = true;
        if (bData.isStarfallShot) bullet.isStarfallShot = true;
        if (typeof bData.celestialTrait === 'string' && bData.celestialTrait) bullet.celestialTrait = bData.celestialTrait;
        if (bData.wavePhase) bullet._wavePhase = Number(bData.wavePhase) || 0;
        if (bType === 'vulcan_minigun') {
            rp._vulcanHeat = Math.min(1.0, (rp._vulcanHeat || 0) + 0.11);
            rp._vulcanLastShotAt = performance.now();
        } else if (bType === 'hades_railgun' && bData.muzzle !== false && typeof HadesOblivionRailgun !== 'undefined') {
            HadesOblivionRailgun.addShotRift(bx, by, Math.atan2(vy, vx), !!bData.isWeaponEvolved);
        } else if (bType === 'medusa_gaze' && bData.isStareShot && typeof MedusaGorgonGaze !== 'undefined') {
            MedusaGorgonGaze.fireStareCone(rp, Math.atan2(vy, vx), dmg, game.effects, game);
        }

        if (isHostAuthoritative) {
            bullet.prevX = bx;
            bullet.prevY = by;
            bullet._preserveSpawnPrev = true;
            const latencyMs = (session.net && session.net.latency) ? session.net.latency : 25;
            const lagFrames = Math.min(3, Math.max(0, Math.round(latencyMs / 16.666) - 1));
            const enemies = Array.isArray(game.enemies) ? game.enemies : null;
            for (let s = 0; s < lagFrames; s++) {
                let blockedClose = false;
                if (enemies) {
                    for (let ei = 0; ei < enemies.length; ei++) {
                        const e = enemies[ei];
                        if (!e || e.dead || e.isDying || e.isAirborneImmune) continue;
                        const rr = bullet.radius + (e.radius || 24) + 6;
                        if ((bullet.x - e.x) ** 2 + (bullet.y - e.y) ** 2 <= rr * rr) { blockedClose = true; break; }
                    }
                }
                if (blockedClose) break;
                bullet.x += bullet.vx;
                bullet.y += bullet.vy;
            }
        }
        game.bullets.push(bullet);

        rp.recoilOffset = bData.isChargedBubble ? 14 : 8;
        const fx = game.effects;
        if (fx && bData.muzzle !== false) {
            const aim = Math.atan2(vy, vx);
            const scale = bData._spasBreach || bData.isSpasBreach ? 1.25 : (bData.isChargedBubble ? 1.3 : 1.0);
            if (typeof fx.addMuzzleFlash === 'function') fx.addMuzzleFlash(bx, by, aim, bData.isChargedBubble ? 'charged_bubble' : bType, scale, false);
            fx.addDust(bx, by, 1, 3);
            if (bData.isChargedBubble) {
                fx.addShockwave(bx, by, 55, 'rgba(0, 206, 201, 0.85)');
                fx.addComicSplash(bx, by - 26, '🫧 BIG BUBBLE!');
            }
        }
        if (window.soundEngine) {
            if (bData.isChargedBubble && typeof window.soundEngine.playChargedBubble === 'function') window.soundEngine.playChargedBubble();
            else if (typeof window.soundEngine.playShoot === 'function') window.soundEngine.playShoot(bType);
        }
    }

    static relayBeam(net, player, angle, damage, isEvolved) {
        if (!net || !net.connected || !player) return;
        net.send('HELIOS_BEAM', {
            x: Math.round(player.x), y: Math.round(player.y),
            angle: Number((angle || 0).toFixed(3)),
            damage: Math.round(damage || 60),
            isEvolved: !!isEvolved
        }, { droppable: true });
    }

    static handleRemoteBeam(session, data, isHostAuthoritative = false, fromId = null) {
        const game = session && session.game;
        const effFrom = (data && data.fromId) || fromId || null;
        const rp = (session && typeof session.getRemotePlayer === 'function')
            ? session.getRemotePlayer(effFrom) : (session && session.remotePlayer);
        if (!game || !data || !rp || rp.isDowned || rp.isDownedDisconnected || typeof HeliosOmegaCannon === 'undefined') return;
        const now = performance.now();
        if (isHostAuthoritative && now - (rp._lastBeamMs || 0) < 400) return;
        rp._lastBeamMs = now;
        const angle = Number.isFinite(data.angle) ? data.angle : rp.angle;
        const dmg = isHostAuthoritative ? Math.max(10, Math.min(15000, Number(data.damage) || 60)) : (Number(data.damage) || 60);
        rp._isRemoteBeam = true;
        try {
            HeliosOmegaCannon.fireBeam(rp, angle, dmg, !!data.isEvolved, game.effects, game);
        } finally {
            rp._isRemoteBeam = false;
        }
    }

    static _canSendFx() {
        const now = performance.now();
        if (now - this._fxWindowStart > 1000) { this._fxWindowStart = now; this._fxWindowCount = 0; }
        return ++this._fxWindowCount <= 20;
    }

    static relayChain(player, x1, y1, x2, y2, col = '#00d2d3') {
        const g = (typeof window !== 'undefined') ? window.gameInstance : null;
        if (!g || !g.coopSession || !g.coopSession.net || !g.coopSession.net.connected) return;
        if (player && player !== g.player) return;
        if (!this._canSendFx()) return;
        g.coopSession.net.send('COOP_FX', {
            t: 'chain', x1: Math.round(x1), y1: Math.round(y1), x2: Math.round(x2), y2: Math.round(y2), c: col
        }, { droppable: true });
    }

    static relayRing(player, r, col, msg = '', spkCol = '', spkCount = 0) {
        const g = (typeof window !== 'undefined') ? window.gameInstance : null;
        if (!g || !g.coopSession || !g.coopSession.net || !g.coopSession.net.connected) return;
        if (player && player !== g.player) return;
        if (!this._canSendFx()) return;
        g.coopSession.net.send('COOP_FX', {
            t: 'ring', x: Math.round(player.x), y: Math.round(player.y),
            r: Math.round(r || 90), c: col || 'rgba(255,255,255,0.8)',
            m: msg || '', sc: spkCol || '', sn: spkCount || 0
        }, { droppable: true });
    }

    static relayGlaiveSwing(net, player, aim, isEvolved, isRiftSwing, spec = null) {
        if (!net || !net.connected || !player || !this._canSendFx()) return;
        const s = spec || {};
        net.send('COOP_FX', {
            t: 'glaive', a: Number((aim || 0).toFixed(3)), e: !!isEvolved, r: !!isRiftSwing,
            dmg: Math.round(s.baseDmg || 80), cc: Number((s.critChance || 0.15).toFixed(3)),
            cm: Number((s.critMult || 2.0).toFixed(2)), cr: Math.round(s.cleaveRadius || 205),
            wr: Math.round(s.waveRange || 360), tr: s.traitId || null
        }, { droppable: true });
    }

    static handleRemoteFx(session, data, fromId = null) {
        const fx = session && session.game && session.game.effects;
        if (!fx || !data) return;
        const effFrom = data.fromId || fromId || null;
        const rp = (session && typeof session.getRemotePlayer === 'function')
            ? session.getRemotePlayer(effFrom) : (session && session.remotePlayer);
        if (data.t === 'glaive' && rp && typeof HyperionCelestialGlaive !== 'undefined') {
            HyperionCelestialGlaive.spawnRemoteSwing(rp, Number(data.a) || 0, !!data.e, !!data.r, fx, session.game, !!session.isHost, data);
        } else if (data.t === 'chain' && typeof fx.addLightningChain === 'function') {
            fx.addLightningChain(data.x1, data.y1, data.x2, data.y2, data.c || '#00d2d3');
        } else if (data.t === 'ring') {
            fx.addShockwave(data.x, data.y, Math.min(350, Number(data.r) || 90), data.c || 'rgba(255,255,255,0.8)');
            if (data.m && typeof data.m === 'string') fx.addComicSplash(data.x, data.y - 34, data.m.slice(0, 40));
            if (data.sc && data.sn > 0) fx.addSparks(data.x, data.y, data.sc, Math.min(16, Number(data.sn)));
        }
    }

    /**
     * Hook EffectsManager.addDamage idempotently on Co-op Host/Guest so Guest receives
     * all authoritative enemy damage numbers (Glaive, Starfall, Mortar, Skills, Host hits)
     * without duplicating locally predicted projectile hits.
     */
    static hookDamageSync(game) {
        const fx = game && game.effects;
        if (!fx || typeof fx.addDamage !== 'function' || fx._coopOrigAddDamage) return;
        const origAdd = fx.addDamage.bind(fx);
        fx._coopOrigAddDamage = origAdd;
        fx.addDamage = (x, y, amount, isCrit = false, isPlayer = false, isDrenched = false) => {
            const g = (typeof window !== 'undefined') ? window.gameInstance : game;
            const sess = g && g.coopSession;
            if (sess && !isPlayer && Number.isFinite(amount) && amount > 0) {
                if (g.isCoopGuest) {
                    const log = sess._localPredDmgs || (sess._localPredDmgs = []);
                    const now = performance.now();
                    while (log.length > 40) log.shift();
                    log.push({ x, y, a: Math.round(amount), t: now });
                } else if (sess.isHost && sess.net && sess.net.connected) {
                    CoopCombatFx.queueHostDamageNum(sess, x, y, amount, isCrit, isDrenched);
                }
            }
            origAdd(x, y, amount, isCrit, isPlayer, isDrenched);
        };
    }

    static queueHostDamageNum(session, x, y, amount, isCrit = false, isDrenched = false) {
        if (!session || !Number.isFinite(x) || !Number.isFinite(y)) return;
        const amt = Math.max(1, Math.round(amount));
        const rx = Math.round(x), ry = Math.round(y);
        const flags = (isCrit ? 1 : 0) | (isDrenched ? 2 : 0);
        const q = session._pendingDmgNums || (session._pendingDmgNums = []);
        if (flags === 0) {
            for (let i = q.length - 1; i >= Math.max(0, q.length - 8); i--) {
                const prev = q[i];
                if (prev[3] === 0 && Math.abs(prev[0] - rx) <= 24 && Math.abs(prev[1] - ry) <= 24) {
                    prev[2] += amt;
                    return;
                }
            }
        }
        if (q.length >= 40) {
            if (!(flags & 1)) return;
            q.shift();
        }
        q.push([rx, ry, amt, flags]);
    }

    static flushHostDamageNums(session) {
        const q = session && session._pendingDmgNums;
        if (!q || q.length === 0) return {};
        session._pendingDmgNums = [];
        return { dmgs: q };
    }

    static applyGuestDamageNums(session, dmgs) {
        const fx = session && session.game && session.game.effects;
        if (!fx || !Array.isArray(dmgs) || dmgs.length === 0) return;
        const addFn = fx._coopOrigAddDamage || fx.addDamage.bind(fx);
        const log = session._localPredDmgs;
        const now = performance.now();
        if (log && log.length > 0) {
            let w = 0;
            for (let i = 0; i < log.length; i++) {
                if (now - log[i].t <= 650) log[w++] = log[i];
            }
            log.length = w;
        }
        for (let i = 0; i < dmgs.length; i++) {
            const d = dmgs[i];
            if (!Array.isArray(d) || d.length < 3) continue;
            const x = Number(d[0]), y = Number(d[1]), amt = Number(d[2]), flags = Number(d[3]) || 0;
            if (!Number.isFinite(x) || !Number.isFinite(y) || !(amt > 0)) continue;
            let matched = false;
            if (log && log.length > 0) {
                const tol = Math.max(10, amt * 0.48);
                for (let j = log.length - 1; j >= 0; j--) {
                    const entry = log[j];
                    if (Math.abs(entry.a - amt) <= tol && Math.hypot(entry.x - x, entry.y - y) <= 95) {
                        log.splice(j, 1);
                        matched = true;
                        break;
                    }
                }
            }
            if (!matched) {
                addFn(x, y, amt, !!(flags & 1), false, !!(flags & 2));
            }
        }
    }
}

if (typeof window !== 'undefined') window.CoopCombatFx = CoopCombatFx;
