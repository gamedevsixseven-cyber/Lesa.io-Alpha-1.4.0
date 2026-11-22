/**
 * Lesa.io - Co-op Snapshot Bandwidth Optimizer & Smoothing Helper
 * Cuts cellular upload bandwidth via delta static-enemy metadata, monotonic sequence
 * guards for unordered DataChannels, backpressure-adaptive snapshot pacing,
 * and clamped dead-reckoning to prevent rubberbanding on lossy mobile links.
 */

class CoopSnapshotSync {
    static getAdaptiveInterval(session) {
        const net = session && session.net;
        const enemies = session && session.game && session.game.enemies ? session.game.enemies.length : 0;
        const drops = session && session.game && session.game.drops ? session.game.drops.length : 0;
        const load = enemies + drops;
        const latency = (net && Number.isFinite(net.latency)) ? net.latency : 25;
        const buffered = (typeof CoopNetTransport !== 'undefined') ? CoopNetTransport.getBufferedAmount(net) : 0;

        if (latency > 250 || buffered > 49152) return 5;
        if (latency > 165 || buffered > 24576) return 4;
        if (latency > 95 || load > 80) return 3;
        return session.snapshotInterval || 2;
    }

    static buildCompactEnemies(session, seq = 1) {
        const enemies = (session && session.game && session.game.enemies) || [];
        if (!session._sentEnemyMeta) session._sentEnemyMeta = new Set();
        if (!session._liveEnemyIds) session._liveEnemyIds = new Set();
        const sentMeta = session._sentEnemyMeta;
        const liveIds = session._liveEnemyIds;
        liveIds.clear();

        const isKeyframe = (seq <= 3) || ((seq % 15) === 0);
        const safeInt = (v, min = -2000000, max = 2000000, fallback = 0) => {
            if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
            const r = Math.round(v);
            return Math.max(min, Math.min(max, r));
        };
        const safeFloat = (v, decimals = 2, fallback = 0) => {
            if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
            return Number(v.toFixed(decimals));
        };

        const out = [];
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (!e || e.dead) continue;
            if (!e._netId) e._netId = session.netIdCounter++;
            const id = safeInt(e._netId, 1, 2000000000, 1);
            liveIds.add(id);

            const needMeta = isKeyframe || !sentMeta.has(id);
            const row = {
                id,
                x: safeInt(e.x),
                y: safeInt(e.y),
                hp: safeInt(e.hp, 0, 100000000, 1),
                a: safeFloat(e.angle, 2, 0)
            };
            const vx = safeFloat(e.vx, 2, 0);
            const vy = safeFloat(e.vy, 2, 0);
            if (vx) row.vx = vx;
            if (vy) row.vy = vy;
            if (e.hitFlash > 0) row.hf = 1;
            if (e.isFlying) row.fly = 1;
            if (needMeta) {
                row.t = (typeof e.type === 'string' && e.type) ? e.type : 'fatmir';
                if (e.subType) row.st = e.subType;
                row.mhp = safeInt(e.maxHp || e.hp, 1, 100000000, 100);
                row.r = safeInt(e.radius, 5, 500, 24);
                if (e.isBoss) row.b = 1;
                else if (e.isMiniBoss) row.b = 2;
                if (e.name) row.n = e.name;
                sentMeta.add(id);
            }
            if (e._lilXasFleeing) row.fl = 1;
            if ((e._earPainTimer || 0) > 0) row.ep = 1;
            if (e.isLilXasSpeaker) { row.si = e.speakerIndex || 0; row.mp = e.musicPlaying ? 1 : 0; }
            if (e.isLilXas && typeof LilXasAttacksFX !== 'undefined') { row.lx = LilXasAttacksFX.serializeBossNet(e); }
            out.push(row);
        }

        if (sentMeta.size > liveIds.size + 24) {
            for (const id of sentMeta) {
                if (!liveIds.has(id)) sentMeta.delete(id);
            }
        }
        return out;
    }

    static shouldAcceptSeq(holder, field, seq) {
        if (typeof seq !== 'number' || !Number.isFinite(seq)) return true;
        const prev = holder[field] || 0;
        if (seq < prev && (prev - seq) < 100000) return false;
        holder[field] = seq;
        return true;
    }

    static applyGuestEnemies(session, enemiesData) {
        if (!Array.isArray(enemiesData)) return;
        const game = session.game;
        if (!Array.isArray(game.enemies)) game.enemies = [];

        const incomingIds = session._rxEnemyIds || (session._rxEnemyIds = new Set());
        const existingMap = session._rxEnemyMap || (session._rxEnemyMap = new Map());
        incomingIds.clear();
        existingMap.clear();

        for (let i = 0; i < game.enemies.length; i++) {
            const e = game.enemies[i];
            if (e && e._netId) existingMap.set(e._netId, e);
        }

        const now = performance.now();
        for (let i = 0; i < enemiesData.length; i++) {
            const eNet = enemiesData[i];
            if (!eNet || typeof eNet.id !== 'number') continue;
            incomingIds.add(eNet.id);

            let enemy = existingMap.get(eNet.id);
            const netX = Number.isFinite(eNet.x) ? eNet.x : 0;
            const netY = Number.isFinite(eNet.y) ? eNet.y : 0;
            const netAngle = Number.isFinite(eNet.a) ? eNet.a : 0;
            const netVx = Number.isFinite(eNet.vx) ? eNet.vx : 0;
            const netVy = Number.isFinite(eNet.vy) ? eNet.vy : 0;

            if (!enemy) {
                enemy = session.spawnEnemyByType(eNet.t || 'fatmir', netX, netY);
                if (enemy) {
                    enemy._netId = eNet.id;
                    if (eNet.st) enemy.subType = eNet.st;
                    if (eNet.n) enemy.name = eNet.n;
                    if (Number.isFinite(eNet.mhp)) enemy.maxHp = eNet.mhp;
                    if (Number.isFinite(eNet.r)) enemy.radius = eNet.r;
                    enemy.x = netX;
                    enemy.y = netY;
                    enemy.angle = netAngle;
                    enemy.dead = false;
                    game.enemies.push(enemy);
                }
            }

            if (enemy) {
                enemy.targetX = netX;
                enemy.targetY = netY;
                enemy.vx = netVx;
                enemy.vy = netVy;
                enemy.targetAngle = netAngle;
                enemy._netLastRxMs = now;
                if (!Number.isFinite(enemy.x)) enemy.x = netX;
                if (!Number.isFinite(enemy.y)) enemy.y = netY;
                if (!Number.isFinite(enemy.angle)) enemy.angle = netAngle;
                enemy.hp = Number.isFinite(eNet.hp) ? eNet.hp : enemy.hp;
                if (Number.isFinite(eNet.mhp)) enemy.maxHp = eNet.mhp;
                if (eNet.n) enemy.name = eNet.n;
                if (eNet.st) enemy.subType = eNet.st;
                enemy.dead = false;
                if (eNet.r && Number.isFinite(eNet.r)) enemy.radius = eNet.r;
                if (eNet.fly !== undefined) {
                    enemy.isFlying = !!eNet.fly;
                    enemy.isAirborneImmune = !!eNet.fly;
                    enemy.flyHeight = eNet.fly ? 1 : 0;
                } else {
                    enemy.isFlying = false;
                    enemy.isAirborneImmune = false;
                    enemy.flyHeight = 0;
                }
                if (eNet.hf) enemy.hitFlash = 8;
                enemy._lilXasFleeing = !!eNet.fl;
                enemy._earPainTimer = eNet.ep ? 10 : 0;
                if (enemy._lilXasFleeing && typeof LilXasCutsceneFX !== 'undefined' && (!enemy._guestBloodNext || now > enemy._guestBloodNext)) {
                    enemy._guestBloodNext = now + 180;
                    LilXasCutsceneFX.spawnGroundBlood(enemy.x, enemy.y, enemy.radius || 24);
                }
                if (enemy.isLilXasSpeaker) {
                    enemy.speakerIndex = eNet.si || 0;
                    enemy.musicPlaying = !!eNet.mp;
                }
                if (eNet.lx && enemy.isLilXas && typeof LilXasAttacksFX !== 'undefined') {
                    LilXasAttacksFX.applyBossNet(enemy, eNet.lx);
                }
            }
        }

        for (let i = game.enemies.length - 1; i >= 0; i--) {
            const e = game.enemies[i];
            if (e && e._netId && !incomingIds.has(e._netId)) {
                e.dead = true;
                try {
                    if (!e._deathPopped && game.effects && typeof game.effects.addDeathPop === 'function' && Number.isFinite(e.x) && Number.isFinite(e.y)) {
                        e._deathPopped = true;
                        game.effects.addDeathPop(e.x, e.y, e.radius || 24, e.color, e.isBoss || e.isMiniBoss);
                    }
                    if (e._chronoStasisTimer > 0 && typeof ChronoRifle !== 'undefined' && typeof ChronoRifle._shatter === 'function') {
                        e._chronoStasisTimer = 0; ChronoRifle._shatter(e, game);
                    }
                    if ((e._symbioteHost || e._symbioteTimer > 0) && typeof SymbioteLauncher !== 'undefined') {
                        SymbioteLauncher.onEnemyDeath(e, game);
                    }
                } catch (fxErr) {
                    console.warn('[CoopSnapshotSync] Enemy death FX skipped:', fxErr);
                }
                game.enemies.splice(i, 1);
            }
        }
    }

    static stepGuestEnemies(game, dt) {
        const enemies = game && game.enemies;
        if (!enemies) return;
        const now = performance.now();
        const lerp = Math.min(1.0, 0.56 * dt);
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            if (Number.isFinite(enemy.targetX) && Number.isFinite(enemy.targetY)) {
                const ageMs = enemy._netLastRxMs ? (now - enemy._netLastRxMs) : 0;
                if (ageMs < 150 && (enemy.vx || enemy.vy)) {
                    const extrapScale = ageMs > 70 ? Math.max(0.15, 1 - (ageMs - 70) / 100) : 1.0;
                    enemy.targetX += enemy.vx * dt * extrapScale;
                    enemy.targetY += enemy.vy * dt * extrapScale;
                }
                const dx = enemy.targetX - enemy.x;
                const dy = enemy.targetY - enemy.y;
                if (dx * dx + dy * dy > 22500) {
                    enemy.x = enemy.targetX;
                    enemy.y = enemy.targetY;
                } else {
                    enemy.x += dx * lerp;
                    enemy.y += dy * lerp;
                }
                if (Number.isFinite(enemy.targetAngle)) {
                    let diff = enemy.targetAngle - (Number.isFinite(enemy.angle) ? enemy.angle : 0);
                    while (diff < -Math.PI) diff += Math.PI * 2;
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    enemy.angle = (Number.isFinite(enemy.angle) ? enemy.angle : 0) + diff * lerp;
                }
                enemy.walkCycle = (Number.isFinite(enemy.walkCycle) ? enemy.walkCycle : 0) + 0.22 * dt;
            }
            enemy.age = (enemy.age || 0) + dt;
            if (enemy._lilXasFleeing) enemy._earBleedAge = (enemy._earBleedAge || 0) + dt;
            enemy.dead = false;
            if (enemy.hitFlash > 0) enemy.hitFlash -= dt;
        }
    }
}

if (typeof window !== 'undefined') {
    window.CoopSnapshotSync = CoopSnapshotSync;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CoopSnapshotSync };
}
