/**
 * Lesa.io - Endless Hard Mode Main Boss Entrance Cutscenes & Encounter Helper
 * Provides cinematic summoning rituals, camera panning, boss invulnerability
 * during entrances, and W5-W20 Hard Boss encounter config/spawning.
 */

class HardBossEntranceFX {
    static getHardEncounterConfig(waveNum) {
        if (waveNum === 5) return { ctorName: 'CrimsonExecutioner', title: 'MALKOR THE EXECUTIONER', rankName: 'HARD MINI-BOSS', crateId: 'boss_crate_hard', rankColor: '#ff4757', isMini: true };
        if (waveNum === 10) return { ctorName: 'PlagueSovereign', title: 'MALAKOR, LORD OF BLIGHT', rankName: 'HARD MAIN BOSS', crateId: 'boss_crate_very_hard', rankColor: '#2ed573', isMini: false };
        if (waveNum === 15) return { ctorName: 'ChronoWarden', title: 'KAELOS, WARDEN OF STASIS', rankName: 'HARD MINI-BOSS', crateId: 'boss_crate_very_hard', rankColor: '#38bdf8', isMini: true };
        if (waveNum === 20) return { ctorName: 'AbyssalSeraph', title: 'VAELOR, BLOOD ECLIPSE SERAPH', rankName: 'HARD MAIN BOSS', crateId: 'boss_crate_very_hard', rankColor: '#fed330', isMini: false };
        if (waveNum === 25) return { ctorName: 'VoidDreadnought', title: 'XYLAR, OBSIDIAN SIEGEBREAKER', rankName: 'HARD MINI-BOSS', crateId: 'boss_crate_very_hard', rankColor: '#ff6b35', isMini: true };
        if (waveNum === 30) return { ctorName: 'OblivionEngine', title: 'AETHELGARD, SOVEREIGN OF RUIN', rankName: 'APEX BOSS', crateId: 'boss_crate_insane', rankColor: '#ff2e4c', isMini: false, isApexBoss: true, bossRank: 'apex' };
        if (waveNum === 35) return { ctorName: 'InfernoHydra', title: 'IGNIS, TWIN-CORE WARDEN', rankName: 'HARD MINI-BOSS', crateId: 'boss_crate_insane', rankColor: '#ffa502', isMini: true };
        if (waveNum === 40) return { ctorName: 'CelestialEclipseArchon', title: 'NYXOR, HERALD OF ECLIPSE', rankName: 'HARD MAIN BOSS', crateId: 'boss_crate_insane', rankColor: '#a855f7', isMini: false };
        if (waveNum === 45) return { ctorName: 'StormforgeAutomaton', title: 'VOLTAIRE, MAGNETAR FORGEMASTER', rankName: 'HARD MINI-BOSS', crateId: 'boss_crate_insane', rankColor: '#38bdf8', isMini: true };
        if (waveNum === 50) return { ctorName: 'AstralChronoReaver', title: 'KRONARCH, WEAVER OF TIME', rankName: 'HARD MAIN BOSS', crateId: 'boss_crate_insane', rankColor: '#2ed573', isMini: false };
        if (waveNum === 55) return { ctorName: 'AbyssalLeviathan', title: 'NAUTILOR, ABYSSAL LEVIATHAN', rankName: 'HARD MINI-BOSS', crateId: 'boss_crate_insane', rankColor: '#00d2d3', isMini: true };
        if (waveNum === 60) return { ctorName: 'OmegaApocalypse', title: 'EREBUS, SOVEREIGN OF THE END', rankName: 'FINAL APEX BOSS', crateId: 'boss_crate_insane', rankColor: '#ff2e4c', isMini: false, isApexBoss: true, bossRank: 'apex' };
        return null;
    }

    static getCameraTarget(enemies) {
        if (!Array.isArray(enemies)) return null;
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (e && !e.dead && (e.isHardMainBoss || e.isApexBoss) && e.cutsceneState && e.cutsceneState !== 'COMBAT') {
                return { x: e.x, y: e.y };
            }
        }
        return null;
    }

    static spawnHardEncounter(waveManager, waveNum, player, enemies, effects) {
        const cfg = this.getHardEncounterConfig(waveNum);
        const Ctor = (cfg && typeof window !== 'undefined') ? window[cfg.ctorName] : null;
        if (!cfg || typeof Ctor !== 'function') return false;

        const waveMult = 1.15 + (waveNum - 1) * 0.23;
        const ang = Math.random() * Math.PI * 2;
        const dist = cfg.isMini ? 450 : 380;
        const bx = player.x + Math.cos(ang) * dist;
        const by = player.y + Math.sin(ang) * dist;
        const boss = new Ctor(bx, by, waveMult, cfg);
        this.applyHardScaling(boss);
        enemies.push(boss);
        waveManager.waveTotalEnemies = 1;

        const game = (typeof window !== 'undefined') ? window.gameInstance : null;
        if (cfg.isMini && game && game.bossWarningOverlay) {
            game.bossWarningOverlay.trigger(cfg.title, cfg.rankName);
            if (effects) effects.addComicSplash(bx, by - 55, `⚠️ ${cfg.title}! ⚠️`, cfg.rankColor);
        }
        return true;
    }

    /**
     * Applies tiered Hard Endless stat buffs (Hard Endless ONLY, strictly idempotent):
     *   - Apex Bosses (W30 / W60): fixedHardHp (1.5M / 5M), unchanged Damage (1.0x)
     *   - Regular Hard Main Bosses (W10, W20, W40, W50): Buffed HP (3.35x), Buffed Damage (1.92x)
     *   - Hard Mini-Bosses (W5, W15, W25, W35, W45, W55): HP (2.65x), Damage (1.72x)
     *   - Regular Hard Enemies: MedToHigh+ HP (1.75x), LowToMed+ Damage (1.42x)
     */
    static applyHardScaling(entity) {
        if (!entity || entity._hardScaled || entity.isApexPillar) return entity;
        entity._hardScaled = true;

        let hpMult = 1.75;
        let dmgMult = 1.42;
        if (entity.isApexBoss) {
            hpMult = 3.50;
            dmgMult = 1.00;
        } else if (!entity.isMiniBoss && (entity.isHardMainBoss || entity.isBoss || entity.isEndlessBoss)) {
            hpMult = 3.35;
            dmgMult = 1.92;
        } else if (entity.isEndlessBoss || entity.isBoss || entity.isMiniBoss) {
            hpMult = 2.65;
            dmgMult = 1.72;
        }

        if (entity.isApexBoss && typeof entity.fixedHardHp === 'number' && entity.fixedHardHp > 0) {
            entity.maxHp = entity.fixedHardHp;
            entity.hp = entity.fixedHardHp;
        } else if (hpMult !== 1.0 && typeof entity.maxHp === 'number') {
            entity.maxHp = Math.max(1, Math.round(entity.maxHp * hpMult));
            entity.hp = Math.max(1, Math.round((entity.hp || entity.maxHp) * hpMult));
        }
        if (dmgMult !== 1.0 && typeof entity.damage === 'number') {
            entity.damage = Math.max(1, Math.round(entity.damage * dmgMult));
        }
        return entity;
    }

    /**
     * Drives the 4-stage detailed Main Boss arrival ritual:
     * ARRIVAL (portal summon + glow beams) -> DIALOGUE_1 -> SURGE -> DIALOGUE_2 -> COMBAT
     */
    static updateMainBossCutscene(boss, dt, player, effects, opts = {}) {
        const game = (typeof window !== 'undefined') ? window.gameInstance : null;
        const overlay = game ? game.cutsceneOverlay : null;
        if (overlay && !overlay.active && boss.cutsceneState !== 'COMBAT') {
            overlay.startCutscene(opts.subText || 'HARD ENDLESS • MAIN BOSS', { allowEndless: true });
        }
        const dx = player.x - boss.x, dy = player.y - boss.y;
        boss.angle = Math.atan2(dy, dx);
        boss.vx = 0; boss.vy = 0;
        boss.entranceAge = (boss.entranceAge || 0) + dt;

        if (boss.cutsceneState === 'ARRIVAL') {
            boss.cutsceneTimer -= dt;
            if (effects && Math.floor(boss.entranceAge) % 8 === 0) {
                effects.addSparks(boss.x + (Math.random() - 0.5) * 90, boss.y + (Math.random() - 0.5) * 60, opts.color || '#2ed573', 4);
            }
            if (boss.cutsceneTimer <= 0) {
                boss.cutsceneState = 'DIALOGUE_1';
                if (effects) effects.addShockwave(boss.x, boss.y, 180, opts.shockColor || 'rgba(46, 213, 115, 0.92)');
                if (game && game.camera) game.camera.addShake(7);
                if (overlay) {
                    overlay.setDialogue(opts.speaker || boss.name.toUpperCase(), opts.line1 || 'YOU CANNOT ESCAPE!', opts.color || '#2ed573', opts.avatar || '💀', true);
                    overlay.onAdvance = () => {
                        boss.cutsceneState = 'SURGE';
                        boss.cutsceneTimer = 52;
                        overlay.setDialogue(opts.speaker || boss.name.toUpperCase(), opts.surgeSub || 'CHANNELING ABYSSAL WRATH...', opts.color || '#fed330', opts.avatar || '💀', false);
                        if (effects && typeof effects.onBossSlam === 'function') effects.onBossSlam(0.06);
                    };
                } else {
                    boss.cutsceneState = 'COMBAT';
                }
            }
            return;
        }

        if (boss.cutsceneState === 'SURGE') {
            boss.cutsceneTimer -= dt;
            if (effects && Math.floor(boss.entranceAge) % 12 === 0) {
                effects.addShockwave(boss.x, boss.y, 145, opts.shockColor || 'rgba(255, 46, 76, 0.92)');
            }
            if (boss.cutsceneTimer <= 0) {
                boss.cutsceneState = 'DIALOGUE_2';
                if (effects && typeof effects.triggerScreenFlash === 'function') {
                    effects.triggerScreenFlash(opts.color || '#ff2e4c', 0.28, 22);
                }
                if (overlay) {
                    overlay.setDialogue(opts.speaker || boss.name.toUpperCase(), opts.line2 || 'WITNESS TRUE TERROR!', opts.color || '#fed330', opts.avatar || '🔥', true);
                    overlay.onAdvance = () => {
                        overlay.endCutscene();
                        boss.cutsceneState = 'COMBAT';
                        if (game && game.bossWarningOverlay) {
                            game.bossWarningOverlay.trigger(boss.name.toUpperCase(), 'HARD MAIN BOSS');
                        }
                        if (effects) effects.addComicSplash(boss.x, boss.y - 60, '⚔️ ENGAGE! ⚔️', opts.color || '#fed330');
                    };
                } else {
                    boss.cutsceneState = 'COMBAT';
                }
            }
        }
    }

    static drawEntrancePortal(ctx, b, colA = '#2ed573', colB = '#fed330') {
        if (!b.cutsceneState || b.cutsceneState === 'COMBAT') return;
        const t = (b.entranceAge || 0) * 0.05;
        ctx.save();
        ctx.translate(b.x, b.y);
        // Outer summoning ritual ring + rotating inner seal + rising vertical energy pillars
        ctx.rotate(t);
        ctx.strokeStyle = colA; ctx.lineWidth = 4; ctx.setLineDash([22, 12]);
        ctx.beginPath(); ctx.arc(0, 0, b.radius * 2.35, 0, Math.PI * 2); ctx.stroke();
        ctx.rotate(-t * 2.2);
        ctx.strokeStyle = colB; ctx.lineWidth = 2.6; ctx.setLineDash([12, 10]);
        ctx.beginPath(); ctx.arc(0, 0, b.radius * 1.65, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        // Converging vertical beam pillar
        const beamG = ctx.createLinearGradient(0, -240, 0, 20);
        beamG.addColorStop(0, 'rgba(255,255,255,0)');
        beamG.addColorStop(1, b.cutsceneState === 'SURGE' ? 'rgba(254, 211, 48, 0.42)' : 'rgba(255, 255, 255, 0.16)');
        ctx.fillStyle = beamG;
        ctx.fillRect(-b.radius * 0.9, -240, b.radius * 1.8, 260);
        ctx.restore();
    }

    /**
     * Unique 5-stage Reality-Shatter Apex Boss Entrance (W30 / W60):
     * RIFT_OPEN -> DESCENT -> DIALOGUE_1 -> AWAKENING -> DIALOGUE_2 -> COMBAT
     */
    static updateApexBossCutscene(boss, dt, player, effects, opts = {}) {
        const game = (typeof window !== 'undefined') ? window.gameInstance : null;
        const overlay = game ? game.cutsceneOverlay : null;
        if (overlay && !overlay.active && boss.cutsceneState !== 'COMBAT') {
            overlay.startCutscene(opts.subText || 'APEX BOSS PROTOCOL • THREAT LEVEL OMEGA', { allowEndless: true });
        }
        const dx = player.x - boss.x, dy = player.y - boss.y;
        boss.angle = Math.atan2(dy, dx);
        boss.vx = 0; boss.vy = 0;
        boss.entranceAge = (boss.entranceAge || 0) + dt;

        if (boss.cutsceneState === 'RIFT_OPEN') {
            boss.cutsceneTimer -= dt;
            boss.entranceDropY = 260;
            if (effects && Math.floor(boss.entranceAge) % 8 === 0) {
                const a = Math.random() * Math.PI * 2;
                effects.addSparks(boss.x + Math.cos(a) * 115, boss.y + Math.sin(a) * 115, '#ff2e4c', 5);
                if (game && game.camera) game.camera.addShake(3);
            }
            if (boss.cutsceneTimer <= 0) {
                boss.cutsceneState = 'DESCENT';
                boss.cutsceneTimer = 54;
                if (effects) effects.addShockwave(boss.x, boss.y, 210, 'rgba(255, 46, 76, 0.95)');
            }
            return;
        }

        if (boss.cutsceneState === 'DESCENT') {
            boss.cutsceneTimer -= dt;
            const prog = Math.max(0, Math.min(1, 1 - boss.cutsceneTimer / 54));
            boss.entranceDropY = Math.round(260 * (1 - prog * prog));
            if (effects && Math.floor(boss.entranceAge) % 10 === 0) {
                effects.addLightningChain(boss.x, boss.y - boss.entranceDropY, boss.x + (Math.random() - 0.5) * 140, boss.y + (Math.random() - 0.5) * 90, '#fed330');
            }
            if (boss.cutsceneTimer <= 0) {
                boss.entranceDropY = 0;
                boss.cutsceneState = 'DIALOGUE_1';
                if (game && game.camera) game.camera.addShake(10);
                if (effects) {
                    effects.addShockwave(boss.x, boss.y, 240, 'rgba(254, 211, 48, 0.96)');
                    if (typeof effects.onBossSlam === 'function') effects.onBossSlam(0.08);
                }
                if (overlay) {
                    overlay.setDialogue(opts.speaker || boss.name.toUpperCase(), opts.line1 || 'ALL SEALS SHATTERED!', '#ff2e4c', opts.avatar || '👑', true);
                    overlay.onAdvance = () => {
                        boss.cutsceneState = 'AWAKENING';
                        boss.cutsceneTimer = 64;
                        overlay.setDialogue(opts.speaker || boss.name.toUpperCase(), opts.awakenSub || 'APEX PYLONS IGNITING...', '#fed330', opts.avatar || '👑', false);
                    };
                } else {
                    boss.cutsceneState = 'COMBAT';
                }
            }
            return;
        }

        if (boss.cutsceneState === 'AWAKENING') {
            boss.cutsceneTimer -= dt;
            if (effects && Math.floor(boss.entranceAge) % 9 === 0) {
                const a = (boss.entranceAge * 0.25);
                effects.addLightningChain(boss.x, boss.y, boss.x + Math.cos(a) * 140, boss.y + Math.sin(a) * 140, '#ff2e4c');
                effects.addShockwave(boss.x, boss.y, 170, 'rgba(255, 46, 76, 0.92)');
            }
            if (boss.cutsceneTimer <= 0) {
                boss.cutsceneState = 'DIALOGUE_2';
                if (effects && typeof effects.triggerScreenFlash === 'function') effects.triggerScreenFlash('#ff2e4c', 0.34, 24);
                if (overlay) {
                    overlay.setDialogue(opts.speaker || boss.name.toUpperCase(), opts.line2 || 'WITNESS APEX RUIN!', '#fed330', opts.avatar || '🔥', true);
                    overlay.onAdvance = () => {
                        overlay.endCutscene();
                        boss.cutsceneState = 'COMBAT';
                        if (game && game.bossWarningOverlay) game.bossWarningOverlay.trigger(boss.name.toUpperCase(), 'APEX BOSS');
                        if (effects) effects.addComicSplash(boss.x, boss.y - 68, '👑 APEX ENGAGED! 👑', '#ff2e4c');
                    };
                } else {
                    boss.cutsceneState = 'COMBAT';
                }
            }
        }
    }

    static drawApexEntranceFX(ctx, b) {
        if (!b.cutsceneState || b.cutsceneState === 'COMBAT') return;
        const t = (b.entranceAge || 0) * 0.055;
        ctx.save();
        ctx.translate(b.x, b.y);
        // Fractured crimson-gold hexagonal rift vortex
        ctx.fillStyle = 'rgba(127, 29, 29, 0.34)';
        ctx.beginPath(); ctx.arc(0, 0, b.radius * 2.75, 0, Math.PI * 2); ctx.fill();
        ctx.rotate(t);
        ctx.strokeStyle = '#ff2e4c'; ctx.lineWidth = 4.5; ctx.setLineDash([28, 12]);
        ctx.beginPath(); ctx.arc(0, 0, b.radius * 2.75, 0, Math.PI * 2); ctx.stroke();
        ctx.rotate(-t * 2.1);
        ctx.strokeStyle = '#fed330'; ctx.lineWidth = 3; ctx.setLineDash([14, 10]);
        ctx.beginPath(); ctx.arc(0, 0, b.radius * 1.95, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        // 6 Slamming Runic Obelisk Pillars & radial tether arcs
        const revealed = b.cutsceneState === 'RIFT_OPEN' ? Math.min(6, Math.floor((b.entranceAge || 0) / 8) + 1) : 6;
        for (let i = 0; i < revealed; i++) {
            const pa = (i / 6) * Math.PI * 2 + t * 0.4;
            const px = Math.cos(pa) * b.radius * 2.45, py = Math.sin(pa) * b.radius * 2.45;
            ctx.strokeStyle = b.cutsceneState === 'AWAKENING' ? '#fef08a' : 'rgba(255, 46, 76, 0.72)';
            ctx.lineWidth = 2.4;
            ctx.beginPath(); ctx.moveTo(0, -(b.entranceDropY || 0)); ctx.lineTo(px, py); ctx.stroke();
            ctx.fillStyle = '#09090b'; ctx.strokeStyle = '#fed330'; ctx.lineWidth = 2.6;
            ctx.fillRect(px - 8, py - 24, 16, 36); ctx.strokeRect(px - 8, py - 24, 16, 36);
            ctx.fillStyle = '#ff2e4c'; ctx.fillRect(px - 4, py - 18, 8, 22);
        }
        ctx.restore();
    }
}

if (typeof window !== 'undefined') window.HardBossEntranceFX = HardBossEntranceFX;
if (typeof module !== 'undefined' && module.exports) module.exports = { HardBossEntranceFX };
