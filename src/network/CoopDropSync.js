/**
 * Lesa.io - Co-op Drops Synchronization & Shared Pickup Authority
 * Keeps ground drops (XP, hearts, stars, shields, pouches) identical on Host and Guest,
 * awards Guest pickups authoritatively, and prevents full-HP hosts from starving hurt teammates.
 */
class CoopDropSync {
    static awardSquadDrop(session, drop, collectorIsGuest = false) {
        const game = session && session.game;
        const p1 = game && game.player;
        const p2 = session && session.remotePlayer;
        if (!drop || !game) return;

        if (drop.type === 'xp') {
            const val = Math.max(1, Math.min(200, Math.round(drop.value || 15)));
            if (p1 && p1.hp > 0) p1.addXP(val);
            if (session.net) session.net.send('XP_SHARE', { val });
        } else if (drop.type === 'coin_pouch') {
            const coins = Math.max(1, Math.min(250, Math.round(drop.value || 20)));
            if (typeof window !== 'undefined' && window.GameState) window.GameState.addCurrency(coins, 0);
            game.coinsEarnedThisRun = (game.coinsEarnedThisRun || 0) + coins;
            if (session.net) session.net.send('COIN_SHARE', { coins });
        } else if (drop.type === 'heart') {
            const target = collectorIsGuest ? p2 : p1;
            const alive = collectorIsGuest ? (target && !target.isDowned && !target.isDownedDisconnected) : (target && target.hp > 0);
            if (alive) {
                const gain = drop.value || 30;
                target.hp = Math.min(target.maxHp, target.hp + gain);
                if (game.effects) game.effects.addComicSplash(target.x, target.y - 25, `+${gain} HP 💚`);
                if (collectorIsGuest && session.net) {
                    session.net.send('GUEST_DROP_EFFECT', { type: 'heart', amt: gain, hp: Math.round(target.hp), maxHp: Math.round(target.maxHp) });
                }
            }
        } else if (drop.type === 'star') {
            if (collectorIsGuest && session.net) session.net.send('GUEST_DROP_EFFECT', { type: 'star', val: drop.value || 1 });
        } else if (drop.type === 'shield') {
            if (collectorIsGuest && p2 && !p2.isDowned) {
                p2.shieldActive = true;
                p2._shieldBrokenUntil = 0;
                if (session.net) session.net.send('GUEST_DROP_EFFECT', { type: 'shield' });
            }
        } else if (drop.type === 'magnet' && typeof game.vacuumAllXP === 'function') {
            game.vacuumAllXP();
            if (collectorIsGuest && session.net) session.net.send('GUEST_DROP_EFFECT', { type: 'magnet' });
        } else if (drop.type === 'chrono_core' && p1) {
            if (typeof WaveSkipperMachine !== 'undefined' && typeof WaveSkipperMachine.grantChronoCore === 'function') {
                WaveSkipperMachine.grantChronoCore(p1, drop.value || 1, game.effects, drop.x, drop.y, game);
            } else {
                p1.chronoCores = (p1.chronoCores || 0) + (drop.value || 1);
            }
            if (collectorIsGuest && session.net) {
                session.net.send('GUEST_DROP_EFFECT', { type: 'chrono_core', val: drop.value || 1, total: p1.chronoCores || 0 });
            }
        } else if (typeof Drop !== 'undefined' && Drop.MATERIAL_DROP_MAP && Drop.MATERIAL_DROP_MAP[drop.type]) {
            const matId = Drop.MATERIAL_DROP_MAP[drop.type];
            const gain = Math.max(1, Math.min(10, Math.floor(drop.value || 1)));
            if (typeof window !== 'undefined' && window.inventoryManager && typeof window.inventoryManager.awardBattleMaterials === 'function') {
                window.inventoryManager.awardBattleMaterials({ [matId]: gain }, { game, x: drop.x, y: drop.y, source: 'arena_drop' });
            }
        }
    }

    static handleGuestCollectDrop(session, payload) {
        const p2 = session && session.remotePlayer;
        if (!payload || typeof payload.id !== 'number' || !p2 || p2.isDowned || p2.isDownedDisconnected) return;
        const drops = session.game && session.game.drops;
        if (!Array.isArray(drops)) return;
        for (let i = 0; i < drops.length; i++) {
            const d = drops[i];
            if (d && !d.dead && d._netId === payload.id) {
                if (Math.hypot(p2.x - d.x, p2.y - d.y) > 750 && !d.magnetized && d._magTarget !== 'guest') return;
                d.dead = true;
                this.awardSquadDrop(session, d, true);
                if (d.type === 'heart' && typeof session.broadcastSnapshot === 'function') session.broadcastSnapshot();
                break;
            }
        }
    }

    static updateHostDrops(session, dt) {
        const game = session && session.game;
        if (!game || !Array.isArray(game.drops)) return;
        const p1 = game.player, p2 = session.remotePlayer;
        const p1Alive = !!(p1 && p1.hp > 0);
        const p2Alive = !!(p2 && !p2.isDowned && !p2.isDownedDisconnected);
        const anyAlive = p1Alive || p2Alive;
        const perkMagMult = (typeof window !== 'undefined' && window.perkSystem && typeof window.perkSystem.getMagnetMultiplier === 'function') ? window.perkSystem.getMagnetMultiplier() : 1.0;
        let dWrite = 0;

        for (let i = 0; i < game.drops.length; i++) {
            const drop = game.drops[i];
            if (!drop || drop.dead) continue;
            drop.age += dt;
            if (anyAlive) {
                drop.life -= dt;
                if (drop.life <= 0) { drop.dead = true; continue; }
            }
            drop.x += drop.vx * dt; drop.y += drop.vy * dt;
            drop.vx *= 0.88; drop.vy *= 0.88;
            if (drop.pickupDelay > 0) drop.pickupDelay -= dt;

            if (anyAlive && (drop.pickupDelay <= 0 || drop.magnetized)) {
                if (drop._magTarget === 'host' && !p1Alive) { drop._magTarget = null; drop.magnetized = false; }
                if (drop._magTarget === 'guest' && !p2Alive) { drop._magTarget = null; drop.magnetized = false; }

                const extraR = (drop.type === 'xp' ? 0 : 30);
                const mag1 = p1Alive ? ((p1.magnetRadius || 140) + extraR) * perkMagMult : 0;
                const mag2 = p2Alive ? ((p2.magnetRadius || 140) + extraR) : 0;
                const dSq1 = p1Alive ? ((p1.x - drop.x) ** 2 + (p1.y - drop.y) ** 2) : Infinity;
                const dSq2 = p2Alive ? ((p2.x - drop.x) ** 2 + (p2.y - drop.y) ** 2) : Infinity;

                let target = null, magDist = 140;
                if (drop._magTarget === 'host') { target = p1; magDist = mag1; }
                else if (drop._magTarget === 'guest') { target = p2; magDist = mag2; }
                else {
                    const in1 = p1Alive && (dSq1 < mag1 * mag1 || drop.magnetized);
                    const in2 = p2Alive && (dSq2 < mag2 * mag2 || drop.magnetized);
                    if (in1 && in2) {
                        if (drop.type === 'heart' && p1.hp >= p1.maxHp && p2.hp < p2.maxHp) { target = p2; magDist = mag2; }
                        else if (drop.type === 'heart' && p2.hp >= p2.maxHp && p1.hp < p1.maxHp) { target = p1; magDist = mag1; }
                        else if (dSq2 < dSq1) { target = p2; magDist = mag2; }
                        else { target = p1; magDist = mag1; }
                    } else if (in1) { target = p1; magDist = mag1; }
                    else if (in2) { target = p2; magDist = mag2; }
                }

                if (target) {
                    drop.magnetized = true;
                    drop._magTarget = (target === p2) ? 'guest' : 'host';
                    const dx = target.x - drop.x, dy = target.y - drop.y;
                    const dist = Math.hypot(dx, dy);
                    const pullSpeed = Math.min(20, 4 + Math.max(0, magDist - dist) * 0.12 + 6);
                    if (dist > 0.0001) {
                        const step = (pullSpeed * dt) / dist;
                        drop.x += dx * step; drop.y += dy * step;
                    }
                    if (dist < (target.radius || 24) + (drop.radius || 14)) {
                        drop.dead = true;
                        if (target === p1) drop.onCollect(p1, game.effects);
                        else this.awardSquadDrop(session, drop, true);
                        continue;
                    }
                }
            }
            if (!drop.dead) game.drops[dWrite++] = drop;
        }
        game.drops.length = dWrite;
    }

    static handleGuestDropEffect(session, payload) {
        const p = session && session.game && session.game.player;
        const fx = session && session.game && session.game.effects;
        if (!payload || !p) return;
        const localFxAt = (session._localFxAt && session._localFxAt[payload.type]) || 0;
        const alreadyPlayedLocal = localFxAt > 0 && (performance.now() - localFxAt) < 1200;
        if (alreadyPlayedLocal) session._localFxAt[payload.type] = 0;

        if (payload.type === 'heart') {
            session._pendingHealUntil = 0;
            if (typeof payload.maxHp === 'number' && payload.maxHp >= 25) p.maxHp = payload.maxHp;
            if (typeof payload.hp === 'number') p.hp = Math.max(p.hp, Math.min(p.maxHp, payload.hp));
            session._trackedHp = p.hp;
            if (!alreadyPlayedLocal) {
                if (window.soundEngine) window.soundEngine.playPickup('heart');
                if (fx) { fx.addPopup(p.x, p.y, `+${payload.amt || 30} HP`, '#2ed573', 24); fx.addSparks(p.x, p.y, '#2ed573', 8); }
                p.happyTimer = 40;
            }
        } else if (payload.type === 'star') {
            if (!alreadyPlayedLocal) {
                p.activatePepperFrenzy(7000);
                if (window.soundEngine) window.soundEngine.playPickup('star');
                if (fx) fx.addComicSplash(p.x, p.y, 'FRENZY!');
            }
        } else if (payload.type === 'shield') {
            if (!alreadyPlayedLocal) {
                p.addShield();
                if (window.soundEngine) window.soundEngine.playPickup('star');
                if (fx) fx.addComicSplash(p.x, p.y, 'SHIELD!');
            }
        } else if (payload.type === 'chrono_core') {
            if (typeof payload.total === 'number') p.chronoCores = Math.max(p.chronoCores || 0, payload.total);
            if (window.soundEngine) window.soundEngine.playPickup('star');
            if (fx) fx.addComicSplash(p.x, p.y, `+${payload.val || 1} CHRONO CORE!`);
        } else if (payload.type === 'shield_break' && p.shieldActive) {
            p.shieldActive = false; p.invulnerableTimer = 30;
            if (window.soundEngine) window.soundEngine.playHit(false, true);
            if (fx) { fx.addComicSplash(p.x, p.y, 'BLOCKED!'); fx.addShockwave(p.x, p.y, 80, 'rgba(112, 161, 255, 0.9)'); }
        } else if (payload.type === 'magnet') {
            if (window.soundEngine) window.soundEngine.playPickup('star');
            if (fx) fx.addComicSplash(p.x, p.y, 'MAGNET!');
        }
    }

    static applyGuestDrops(session, dropsList) {
        if (!session || !session.game || !Array.isArray(dropsList)) return;
        const game = session.game;
        if (!Array.isArray(game.drops)) game.drops = [];
        const incomingIds = new Set();
        const existingMap = new Map();
        for (let i = 0; i < game.drops.length; i++) {
            const d = game.drops[i];
            if (d && d._netId) existingMap.set(d._netId, d);
        }

        for (let i = 0; i < dropsList.length; i++) {
            const dNet = dropsList[i];
            if (!dNet || typeof dNet.id !== 'number') continue;
            incomingIds.add(dNet.id);
            if (session.collectedDropIds.has(dNet.id)) continue;

            let drop = existingMap.get(dNet.id);
            if (!drop && typeof Drop !== 'undefined') {
                drop = new Drop(dNet.x, dNet.y, dNet.t || 'xp', dNet.v || 1);
                drop._netId = dNet.id; drop.vx = 0; drop.vy = 0; drop.pickupDelay = 0; drop._isNetSynced = true; drop.life = 999999;
                const origCollect = drop.onCollect.bind(drop);
                drop.onCollect = (player, effects) => {
                    if (player && player.hp <= 0) return;
                    const dtType = dNet.t || 'xp';
                    if (dtType === 'heart') {
                        session._preHealHp = player ? player.hp : 0; session._pendingHealUntil = performance.now() + 450;
                        if (!session._localFxAt) session._localFxAt = {};
                        session._localFxAt.heart = performance.now();
                        origCollect(player, effects);
                        if (player) session._trackedHp = player.hp;
                    } else if (dtType === 'star' || dtType === 'shield') {
                        if (!session._localFxAt) session._localFxAt = {};
                        session._localFxAt[dtType] = performance.now();
                        origCollect(player, effects);
                    } else if (dtType !== 'magnet' && dtType !== 'chrono_core' && window.soundEngine) {
                        window.soundEngine.playPickup(dtType === 'coin_pouch' ? 'coin' : 'xp');
                    }
                    drop.dead = true; session.collectedDropIds.add(dNet.id);
                    session.net.send('GUEST_COLLECT_DROP', { id: dNet.id });
                };
                game.drops.push(drop);
            } else if (drop) {
                if (dNet.m === 1) { drop._claimedByHost = true; drop.magnetized = false; }
                else if (dNet.m === 2 && !drop.magnetized) { drop.magnetized = true; }
                if (!drop.magnetized || dNet.m === 1) {
                    const dx = dNet.x - drop.x, dy = dNet.y - drop.y;
                    if (dx * dx + dy * dy > 16000) { drop.x = dNet.x; drop.y = dNet.y; }
                    else { drop.x += dx * 0.48; drop.y += dy * 0.48; }
                }
            }
        }

        for (let i = game.drops.length - 1; i >= 0; i--) {
            const d = game.drops[i];
            if (d && d._netId && (!incomingIds.has(d._netId) || session.collectedDropIds.has(d._netId))) {
                game.drops.splice(i, 1);
            }
        }
        for (const id of session.collectedDropIds) { if (!incomingIds.has(id)) session.collectedDropIds.delete(id); }
    }
}

if (typeof window !== 'undefined') window.CoopDropSync = CoopDropSync;
