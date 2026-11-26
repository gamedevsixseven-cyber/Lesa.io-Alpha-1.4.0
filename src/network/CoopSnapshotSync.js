/**
 * Lesa.io - Co-op Snapshot Bandwidth Optimizer & Smoothing Helper
 * Cuts cellular upload bandwidth via delta static-enemy metadata, monotonic sequence
 * guards for unordered DataChannels, backpressure-adaptive snapshot pacing,
 * and clamped dead-reckoning to prevent rubberbanding on lossy mobile links.
 */

class CoopSnapshotSync {
    static HARD_ENTITY_CTORS = {
        void_acolyte: () => (typeof VoidAcolyte !== 'undefined' ? VoidAcolyte : null),
        obsidian_golem: () => (typeof ObsidianGolem !== 'undefined' ? ObsidianGolem : null),
        crimson_wraith: () => (typeof CrimsonWraith !== 'undefined' ? CrimsonWraith : null),
        storm_tempest: () => (typeof StormTempest !== 'undefined' ? StormTempest : null),
        eclipse_harbinger: () => (typeof EclipseHarbinger !== 'undefined' ? EclipseHarbinger : null),
        blight_necromancer: () => (typeof BlightNecromancer !== 'undefined' ? BlightNecromancer : null),
        cryo_sniper: () => (typeof CryoSniper !== 'undefined' ? CryoSniper : null),
        inferno_artillery: () => (typeof InfernoArtillery !== 'undefined' ? InfernoArtillery : null),
        crimson_executioner: () => (typeof CrimsonExecutioner !== 'undefined' ? CrimsonExecutioner : null),
        plague_sovereign: () => (typeof PlagueSovereign !== 'undefined' ? PlagueSovereign : null),
        chrono_warden: () => (typeof ChronoWarden !== 'undefined' ? ChronoWarden : null),
        abyssal_seraph: () => (typeof AbyssalSeraph !== 'undefined' ? AbyssalSeraph : null),
        void_dreadnought: () => (typeof VoidDreadnought !== 'undefined' ? VoidDreadnought : null),
        apex_sovereign_w30: () => (typeof OblivionEngine !== 'undefined' ? OblivionEngine : null),
        inferno_hydra: () => (typeof InfernoHydra !== 'undefined' ? InfernoHydra : null),
        void_eclipse_archon: () => (typeof CelestialEclipseArchon !== 'undefined' ? CelestialEclipseArchon : null),
        magnetar_forgemaster: () => (typeof StormforgeAutomaton !== 'undefined' ? StormforgeAutomaton : null),
        chrono_reaver: () => (typeof AstralChronoReaver !== 'undefined' ? AstralChronoReaver : null),
        abyssal_leviathan: () => (typeof AbyssalLeviathan !== 'undefined' ? AbyssalLeviathan : null),
        apex_omega_w60: () => (typeof OmegaApocalypse !== 'undefined' ? OmegaApocalypse : null),
        apex_shield_pillar: () => (typeof ApexShieldPillar !== 'undefined' ? ApexShieldPillar : null)
    };

    static spawnHardEntityByType(type, x, y, waveMult = 1.0, eNet = null) {
        const key = String(type || '').toLowerCase();
        if (key === 'fatmir' && eNet && eNet.cr && typeof Fatmir !== 'undefined') {
            return new Fatmir(x, y, waveMult, { isCrimson: true });
        }
        const getter = this.HARD_ENTITY_CTORS[key];
        const Ctor = getter ? getter() : null;
        if (!Ctor) return null;
        const ent = new Ctor(x, y, waveMult, {});
        if ('cutsceneState' in ent && !eNet?.hb) ent.cutsceneState = 'COMBAT';
        if ('hideBossModel' in ent && !eNet?.hb) { ent.hideBossModel = false; ent.auraScale = 1; ent.entranceDropY = 0; }
        if (ent.isApexPillar) ent.emergeProgress = 1;
        return ent;
    }

    static syncGuestEndlessWave(session, data, prevWave) {
        const g = session && session.game;
        if (!g || !data || !Number.isFinite(data.wave)) return;
        const nextWave = data.wave;
        if (g.gameMode === 'endless' && nextWave > (prevWave || 0)) {
            const modeKey = g.isEndlessHard ? 'endless_hard' : 'endless';
            if (typeof window !== 'undefined' && window.GameState && typeof window.GameState.recordWaveProgress === 'function') {
                window.GameState.recordWaveProgress(modeKey, nextWave);
            }
        }
    }

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
            if (e.isCrimson) row.cr = 1;
            if (e.isHardMainBoss || e.isApexBoss || e.isApexPillar || (e.isEndlessBoss && e.cutsceneState !== undefined)) {
                row.hb = {
                    cs: e.cutsceneState || 'COMBAT', sh: e.shieldActive ? 1 : 0,
                    hm: e.hideBossModel ? 1 : 0, as: safeFloat(e.auraScale ?? 1, 2, 1),
                    dy: safeInt(e.entranceDropY || 0, -100, 500, 0), ph: e.phase || 1,
                    pl: e.phaseLabel || '', ab: e.apexBadgeText || '',
                    df: e.isDefeated ? 1 : 0, fd: safeFloat(e._defeatFade ?? 1, 2, 1)
                };
            }
            if (e.type === 'kiloumpas') {
                row.kl = {
                    cs: e.cutsceneState || 'COMBAT', hc: e.hasCarbine ? 1 : 0, hd: e.hidden ? 1 : 0,
                    gr: e.isGrabbing ? 1 : 0, ght: safeFloat(e.grabHoldTimer, 1, 0),
                    ta: safeFloat(e.throwAnimTimer, 1, 0), im: e.isAiming ? 1 : 0
                };
            } else if (e.type === 'rouf') {
                row.rf = {
                    cs: e.cutsceneState || 'COMBAT', p2: e.isPhase2 ? 1 : 0, cl: e.isCalling ? 1 : 0,
                    df: e.isDefeated ? 1 : 0, sp: safeFloat(e.sirenPhase, 2, 0), dc: e.defeatedDone ? 1 : 0,
                    sa: safeFloat(e.smashAnimTimer, 1, 0),
                    pc: e.policeCar ? {
                        x: safeInt(e.policeCar.x), y: safeInt(e.policeCar.y),
                        a: safeFloat(e.policeCar.angle, 2, 0), sp: safeFloat(e.policeCar.sirenPhase, 2, 0),
                        ar: e.policeCar.arrived ? 1 : 0
                    } : null
                };
            }
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
                enemy = CoopSnapshotSync.spawnHardEntityByType(eNet.t, netX, netY, 1.0, eNet)
                    || session.spawnEnemyByType(eNet.t || 'fatmir', netX, netY);
                if (enemy) {
                    enemy._netId = eNet.id;
                    if (eNet.cr && enemy.type === 'fatmir') { enemy.isCrimson = true; enemy.name = 'Fatmir'; enemy.color = '#ff2e4c'; }
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
                CoopSnapshotSync.applyBossNetState(enemy, eNet, game);
            }
        }

        for (let i = game.enemies.length - 1; i >= 0; i--) {
            const e = game.enemies[i];
            if (e && e._netId && !incomingIds.has(e._netId)) {
                e.dead = true;
                try {
                    const skipPop = (e.type === 'rouf' && (e.isDefeated || e.defeatedDone));
                    if (!skipPop && !e._deathPopped && game.effects && typeof game.effects.addDeathPop === 'function' && Number.isFinite(e.x) && Number.isFinite(e.y)) {
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
            if (enemy.throwAnimTimer > 0) enemy.throwAnimTimer = Math.max(0, enemy.throwAnimTimer - dt);
            if (enemy.grabHoldTimer > 0) enemy.grabHoldTimer = Math.max(0, enemy.grabHoldTimer - dt);
            if (enemy.smashAnimTimer > 0) enemy.smashAnimTimer = Math.max(0, enemy.smashAnimTimer - dt);
            if (enemy.type === 'rouf' && (enemy.isCalling || enemy.isDefeated || enemy.policeCar)) {
                enemy.sirenPhase = (enemy.sirenPhase || 0) + 0.25 * dt;
            }
            if (enemy.policeCar) {
                const c = enemy.policeCar;
                c.sirenPhase = (c.sirenPhase || 0) + 0.4 * dt;
                if (Number.isFinite(c._netX) && Number.isFinite(c._netY)) {
                    const clerp = Math.min(1.0, 0.48 * dt);
                    c.x += (c._netX - c.x) * clerp;
                    c.y += (c._netY - c.y) * clerp;
                }
            }
        }
    }

    static applyBossNetState(enemy, eNet, game) {
        if (!enemy || !eNet) return;
        const fx = game && game.effects;
        if (eNet.kl && enemy.type === 'kiloumpas') {
            const kl = eNet.kl;
            enemy.cutsceneState = kl.cs || 'COMBAT';
            enemy.hasCarbine = !!kl.hc;
            enemy.hidden = !!kl.hd;
            enemy.isGrabbing = !!kl.gr;
            if (Number.isFinite(kl.ght)) enemy.grabHoldTimer = kl.ght;
            if (Number.isFinite(kl.ta)) enemy.throwAnimTimer = Math.max(enemy.throwAnimTimer || 0, kl.ta);
            enemy.isAiming = !!kl.im;
        }
        if (eNet.rf && enemy.type === 'rouf') {
            const rf = eNet.rf;
            const wasP2 = !!enemy.isPhase2, wasDef = !!enemy.isDefeated, wasDone = !!enemy.defeatedDone;
            enemy.cutsceneState = rf.cs || 'COMBAT';
            enemy.isPhase2 = !!rf.p2;
            enemy.isCalling = !!rf.cl;
            enemy.isDefeated = !!rf.df;
            enemy.defeatedDone = !!rf.dc;
            if (Number.isFinite(rf.sp)) enemy.sirenPhase = rf.sp;
            if (Number.isFinite(rf.sa)) enemy.smashAnimTimer = Math.max(enemy.smashAnimTimer || 0, rf.sa);
            if (!wasP2 && enemy.isPhase2) {
                if (fx) {
                    fx.addComicSplash(enemy.x, enemy.y - 50, 'STEILTE TA MAT! KINTOYNEVW! 🚨', '#ff4757', 26, true);
                    fx.addShockwave(enemy.x, enemy.y, 160, 'rgba(235, 77, 75, 0.9)');
                    fx.addDust(enemy.x, enemy.y, 16, 18);
                }
                if (window.soundEngine && typeof window.soundEngine.playBossWarning === 'function') window.soundEngine.playBossWarning();
            }
            if (!wasDef && enemy.isDefeated) {
                if (fx) {
                    fx.addComicSplash(enemy.x, enemy.y - 45, 'CRACK! 📱💥', '#ff4757', 24);
                    fx.addDust(enemy.x, enemy.y, 14, 16);
                    fx.addSparks(enemy.x + 20, enemy.y + 10, '#f1c40f', 6);
                }
                if (window.soundEngine && typeof window.soundEngine.playBossWarning === 'function') window.soundEngine.playBossWarning();
            }
            if (!wasDone && enemy.defeatedDone && fx) fx.addConfetti(enemy.x, enemy.y, 50);
            if (rf.pc) {
                const wasArrived = !!(enemy.policeCar && enemy.policeCar.arrived);
                if (!enemy.policeCar) {
                    enemy.policeCar = { x: rf.pc.x, y: rf.pc.y, _netX: rf.pc.x, _netY: rf.pc.y, angle: rf.pc.a || 0, sirenPhase: rf.pc.sp || 0, arrived: !!rf.pc.ar };
                } else {
                    enemy.policeCar._netX = rf.pc.x; enemy.policeCar._netY = rf.pc.y;
                    enemy.policeCar.angle = rf.pc.a || 0;
                    if (Number.isFinite(rf.pc.sp)) enemy.policeCar.sirenPhase = rf.pc.sp;
                    enemy.policeCar.arrived = !!rf.pc.ar;
                }
                if (!wasArrived && enemy.policeCar.arrived && fx) fx.addComicSplash(enemy.policeCar.x, enemy.policeCar.y - 30, 'SKRRRT! 🚔💨', '#3498db', 22);
            } else {
                enemy.policeCar = null;
            }
        }
        if (eNet.hb) {
            const hb = eNet.hb;
            const wasShield = !!enemy.shieldActive;
            if (typeof hb.cs === 'string') enemy.cutsceneState = hb.cs;
            if (hb.sh !== undefined) enemy.shieldActive = !!hb.sh;
            if (hb.hm !== undefined) enemy.hideBossModel = !!hb.hm;
            if (Number.isFinite(hb.as)) enemy.auraScale = hb.as;
            if (Number.isFinite(hb.dy)) enemy.entranceDropY = hb.dy;
            if (Number.isFinite(hb.ph)) enemy.phase = hb.ph;
            if (typeof hb.pl === 'string') enemy.phaseLabel = hb.pl;
            if (typeof hb.ab === 'string' && hb.ab) enemy.apexBadgeText = hb.ab;
            if (hb.df !== undefined) { enemy.isDefeated = !!hb.df; enemy.isDying = !!hb.df; }
            if (Number.isFinite(hb.fd)) enemy._defeatFade = hb.fd;
            if (enemy.type === 'apex_omega_w60' && typeof ApexW60Audio !== 'undefined') {
                if (!wasShield && enemy.shieldActive) ApexW60Audio.playVoice('erebus_aegis', 'w60_aegis');
            }
        }
    }

    static applyGuestCutscene(session, csData) {
        const game = session && session.game;
        const co = game && game.cutsceneOverlay;
        if (!co) return;
        if (csData) {
            if (!co.active) co.startCutscene(csData.sub, { allowEndless: !!csData.ae, skipSquadPosition: true });
            else if (typeof csData.sub === 'string' && csData.sub && co.subText !== csData.sub) co.subText = csData.sub;
            if (csData.tp) co.totalPlayers = csData.tp;
            if (csData.txt) {
                if (co.dialogueText !== csData.txt) {
                    co.setDialogue(csData.spk, csData.txt, csData.col, csData.ico, csData.adv);
                    co.setReadyState(csData.rc || 0, csData.tp || 2, false);
                    if (typeof ApexW60Audio !== 'undefined') {
                        if (csData.txt.includes('WAITING FOR YOU') || csData.txt.includes('ALPHA WAS A MERCY')) ApexW60Audio.playVoice('erebus_line1', 'w60_d1');
                        else if (csData.txt.includes('OMEGA APOCALYPSE')) ApexW60Audio.playVoice('erebus_surge', 'w60_surge');
                        else if (csData.txt.includes('LITTLE SPARK')) ApexW60Audio.playVoice('erebus_line2', 'w60_d2');
                        else if (csData.txt.includes('CROWN OF ASHES')) ApexW60Audio.playVoice('erebus_defeat', 'w60_defeat');
                    }
                } else {
                    co.promptAdvance = !!csData.adv;
                    co.setReadyState(csData.rc || 0, csData.tp || 2, co.isLocalReady);
                }
            } else if (co.dialogueText) {
                co.clearDialogue();
            }
        } else if (co.active) {
            co.endCutscene();
            co.setReadyState(0, 1, false);
        }
    }
}

if (typeof window !== 'undefined') {
    window.CoopSnapshotSync = CoopSnapshotSync;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CoopSnapshotSync };
}
