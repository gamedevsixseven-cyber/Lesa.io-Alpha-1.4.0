/**
 * Lesa.io - Wave 60 Final Apex Boss Multi-Stage Delay-Reveal "Aura" Cutscene
 * Stages:
 *   1. OMEN_STORM     : Boss is HIDDEN; weather shifts, ash rain & storm bolts rage.
 *   2. MAP_FRACTURE   : Boss stays HIDDEN; map transforms, reality fissures rip open.
 *   3. AURA_RISE      : Chromatic Sovereign Aura & Eclipse Singularity erupt; Omega materializes!
 *   4. DIALOGUE_1     : Omega speaks from inside his blazing aura.
 *   5. OVERDRIVE_SURGE: Final crimson-gold aura explosion shaking the transformed arena.
 *   6. DIALOGUE_2 -> COMBAT
 */

class ApexW60Cutscene {
    static update(boss, dt, player, effects) {
        const game = (typeof window !== 'undefined') ? window.gameInstance : null;
        const overlay = game ? game.cutsceneOverlay : null;
        const doneState = boss.cutsceneState === 'COMBAT' || boss.cutsceneState === 'DEFEATED_DONE';
        if (overlay && !overlay.active && !doneState) {
            const hdr = boss.isDefeated ? 'HARD WAVE 60 • SOVEREIGN SHATTERED' : 'HARD WAVE 60 • OMEGA APOCALYPSE PROTOCOL';
            overlay.startCutscene(hdr, { allowEndless: true });
        }

        const dx = (player ? player.x : 0) - boss.x;
        const dy = (player ? player.y : 0) - boss.y;
        if (!boss.isDefeated) boss.angle = Math.atan2(dy, dx);
        boss.vx = 0; boss.vy = 0;
        boss.entranceAge = (boss.entranceAge || 0) + dt;

        // Ensure dynamic weather/map controller progresses smoothly even when cutscene pauses enemy loop
        if (typeof ApexW60Atmosphere !== 'undefined') ApexW60Atmosphere.update(dt, game);

        if (boss.isDefeated) {
            this._updateDefeatCutscene(boss, dt, game, overlay, effects);
            return;
        }

        if (boss.cutsceneState === 'OMEN_STORM') {
            boss.hideBossModel = true;
            boss.auraScale = 0;
            boss.cutsceneTimer -= dt;
            if (overlay && overlay.speaker !== '⚠️ ASTRAL SENSOR OVERLOAD') {
                overlay.setDialogue('⚠️ ASTRAL SENSOR OVERLOAD', 'WEATHER PATTERNS COLLAPSING — DIMENSIONAL SEAL BREACHED...', '#c084fc', '🌩️', false);
            }
            if (effects && Math.floor(boss.entranceAge) % 8 === 0) {
                const a = Math.random() * Math.PI * 2;
                effects.addSparks(boss.x + Math.cos(a) * 140, boss.y + Math.sin(a) * 140, '#c084fc', 5);
                if (game && game.camera) game.camera.addShake(4);
            }
            if (boss.cutsceneTimer <= 0) {
                boss.cutsceneState = 'MAP_FRACTURE';
                boss.cutsceneTimer = 58;
                if (effects) {
                    effects.addShockwave(boss.x, boss.y, 290, 'rgba(168, 85, 247, 0.96)');
                    if (typeof effects.triggerScreenFlash === 'function') effects.triggerScreenFlash('#a855f7', 0.34, 20);
                }
            }
            return;
        }

        if (boss.cutsceneState === 'MAP_FRACTURE') {
            boss.hideBossModel = true;
            boss.cutsceneTimer -= dt;
            if (overlay) {
                overlay.setDialogue('🌩️ REALITY COLLAPSE', 'THE CITADEL FLOOR SHATTERS — SOMETHING ANCIENT ASCENDS FROM THE RIFT!', '#ff2e4c', '🌑', false);
            }
            if (effects && Math.floor(boss.entranceAge) % 10 === 0) {
                const a = boss.entranceAge * 0.35;
                effects.addLightningChain(boss.x, boss.y, boss.x + Math.cos(a) * 210, boss.y + Math.sin(a) * 210, '#ff2e4c');
                if (typeof effects.addGroundCrack === 'function') {
                    effects.addGroundCrack(boss.x + (Math.random() - 0.5) * 180, boss.y + (Math.random() - 0.5) * 140, 75, '#09090b', '#ff2e4c', 120);
                }
                if (game && game.camera) game.camera.addShake(7);
            }
            if (boss.cutsceneTimer <= 0) {
                boss.cutsceneState = 'AURA_RISE';
                boss.cutsceneTimer = 56;
                boss.hideBossModel = false;
                boss.auraScale = 0.15;
                boss.entranceDropY = 180;
                if (effects) {
                    effects.addShockwave(boss.x, boss.y, 340, 'rgba(254, 211, 48, 0.98)');
                    if (typeof effects.onBossSlam === 'function') effects.onBossSlam(0.08);
                    if (typeof effects.triggerScreenFlash === 'function') effects.triggerScreenFlash('#fed330', 0.40, 22);
                }
            }
            return;
        }

        if (boss.cutsceneState === 'AURA_RISE') {
            boss.hideBossModel = false;
            boss.cutsceneTimer -= dt;
            const prog = Math.max(0, Math.min(1, 1 - boss.cutsceneTimer / 56));
            boss.auraScale = prog;
            boss.entranceDropY = Math.round(180 * (1 - prog * prog));
            if (effects && Math.floor(boss.entranceAge) % 7 === 0) {
                const a = Math.random() * Math.PI * 2;
                effects.addSparks(boss.x + Math.cos(a) * 90, boss.y + Math.sin(a) * 90, '#fed330', 6);
                effects.addLightningChain(boss.x, boss.y - boss.entranceDropY, boss.x + Math.cos(a) * 170, boss.y + Math.sin(a) * 170, '#fed330');
            }
            if (boss.cutsceneTimer <= 0) {
                boss.auraScale = 1.0;
                boss.entranceDropY = 0;
                boss.cutsceneState = 'DIALOGUE_1';
                if (game && game.camera) game.camera.addShake(11);
                if (effects) effects.addShockwave(boss.x, boss.y, 320, 'rgba(255, 46, 76, 0.98)');
                if (overlay) {
                    overlay.setDialogue('OMEGA, SOVEREIGN OF THE END', 'I HAVE BEEN WAITING FOR YOU... ALPHA WAS A MERCY. I AM THE SENTENCE. SIXTY WAVES OF BLOOD... JUST TO KNEEL AT THE END OF TIME.', '#ff2e4c', '👑', true);
                    if (typeof ApexW60Audio !== 'undefined') ApexW60Audio.playVoice('erebus_line1', 'w60_d1');
                    overlay.onAdvance = () => {
                        boss.cutsceneState = 'OVERDRIVE_SURGE';
                        boss.cutsceneTimer = 50;
                        overlay.setDialogue('OMEGA, SOVEREIGN OF THE END', 'WITNESS WHAT COMES AFTER THE SKY BREAKS... BEHOLD THE OMEGA APOCALYPSE!', '#fed330', '🔥', false);
                        if (typeof ApexW60Audio !== 'undefined') ApexW60Audio.playVoice('erebus_surge', 'w60_surge');
                    };
                } else {
                    boss.cutsceneState = 'COMBAT';
                }
            }
            return;
        }

        if (boss.cutsceneState === 'OVERDRIVE_SURGE') {
            boss.cutsceneTimer -= dt;
            boss.auraScale = 1.35 + Math.sin((boss.entranceAge || 0) * 0.4) * 0.15;
            if (effects && Math.floor(boss.entranceAge) % 9 === 0) {
                effects.addShockwave(boss.x, boss.y, 260, 'rgba(254, 211, 48, 0.95)');
                if (game && game.camera) game.camera.addShake(6);
            }
            if (boss.cutsceneTimer <= 0) {
                boss.auraScale = 1.0;
                boss.cutsceneState = 'SURGE_DIALOGUE';
                if (effects && typeof effects.triggerScreenFlash === 'function') effects.triggerScreenFlash('#fed330', 0.30, 20);
                if (overlay) {
                    overlay.promptAdvance = true;
                    overlay.dialogueStartTime = performance.now();
                    overlay.onAdvance = () => {
                        boss.cutsceneState = 'DIALOGUE_2';
                        if (effects && typeof effects.triggerScreenFlash === 'function') effects.triggerScreenFlash('#ff2e4c', 0.36, 24);
                        overlay.setDialogue('OMEGA, SOVEREIGN OF THE END', 'DRAW YOUR BLADE, LITTLE SPARK. LET US SEE HOW BRIGHT YOU BURN... BEFORE THE DARK SWALLOWS EVERYTHING.', '#fed330', '🔥', true);
                        if (typeof ApexW60Audio !== 'undefined') ApexW60Audio.playVoice('erebus_line2', 'w60_d2');
                        overlay.onAdvance = () => {
                            overlay.endCutscene();
                            boss.cutsceneState = 'COMBAT';
                            if (typeof ApexW60Audio !== 'undefined') ApexW60Audio.stopVoice();
                            if (game && game.bossWarningOverlay) game.bossWarningOverlay.trigger('OMEGA, SOVEREIGN OF THE END', 'FINAL APEX BOSS');
                            if (effects) effects.addComicSplash(boss.x, boss.y - 72, '🔥 FINAL APEX ENGAGED! 🔥', '#ff2e4c');
                        };
                    };
                } else {
                    boss.cutsceneState = 'COMBAT';
                }
            }
            return;
        }

        if (boss.cutsceneState === 'SURGE_DIALOGUE') {
            boss.auraScale = 1.12 + Math.sin((boss.entranceAge || 0) * 0.16) * 0.08;
            return;
        }
    }

    static _updateDefeatCutscene(boss, dt, game, overlay, effects) {
        boss.defeatAge = (boss.defeatAge || 0) + dt;
        const tick = Math.floor(boss.defeatAge);

        if (boss.cutsceneState === 'DEFEAT_KNEEL') {
            boss.cutsceneTimer -= dt;
            const prog = Math.max(0, Math.min(1, 1 - boss.cutsceneTimer / 68));
            boss.auraScale = Math.max(0.32, 0.72 - prog * 0.40);
            boss.entranceDropY = -Math.round(14 * prog);
            if (overlay && overlay.speaker !== '⚡ THE ECLIPSE BREAKS') {
                overlay.setDialogue('⚡ THE ECLIPSE BREAKS', 'THE SOVEREIGN’S ARMOR CRACKS — ASH AND STARLIGHT SPILL ACROSS THE SANCTUM...', '#fed330', '⚡', false);
            }
            if (effects && tick % 6 === 0) {
                const a = Math.random() * Math.PI * 2;
                effects.addSparks(boss.x + Math.cos(a) * 55, boss.y - 10 + Math.sin(a) * 45, '#fed330', 6);
                if (typeof effects.addDust === 'function') effects.addDust(boss.x + (Math.random() - 0.5) * 70, boss.y + 18, 2, 10);
                if (tick % 18 === 0) effects.addShockwave(boss.x, boss.y, 210, 'rgba(254, 211, 48, 0.75)');
            }
            if (boss.cutsceneTimer <= 0) {
                boss.cutsceneState = 'DEFEAT_DIALOGUE';
                if (effects && typeof effects.triggerScreenFlash === 'function') effects.triggerScreenFlash('#fed330', 0.28, 18);
                if (game && game.camera) game.camera.addShake(7);
                if (overlay) {
                    overlay.setDialogue(
                        'OMEGA, SOVEREIGN OF THE END',
                        'IMPOSSIBLE... YOU DID NOT MERELY SURVIVE THE END. YOU BROKE IT. WEAR THE CROWN OF ASHES WELL, SPARTAN... FOR EVEN OMEGA BOWS TO A MONSTER GREATER THAN HIMSELF.',
                        '#fed330', '👑', true
                    );
                    if (typeof ApexW60Audio !== 'undefined') ApexW60Audio.playVoice('erebus_defeat', 'w60_defeat');
                    overlay.onAdvance = () => {
                        if (typeof ApexW60Audio !== 'undefined') ApexW60Audio.stopVoice();
                        boss.cutsceneState = 'DEFEAT_SHATTER';
                        boss.cutsceneTimer = 72;
                        overlay.setDialogue('🔥 OMEGA EXTINGUISHED', 'THE FINAL SEAL COLLAPSES INTO GOLDEN STARLIGHT...', '#ff2e4c', '💀', false);
                    };
                } else {
                    boss.cutsceneState = 'DEFEAT_SHATTER';
                    boss.cutsceneTimer = 72;
                }
            }
            return;
        }

        if (boss.cutsceneState === 'DEFEAT_DIALOGUE') {
            boss.auraScale = 0.34 + Math.sin(boss.defeatAge * 0.12) * 0.04;
            if (effects && tick % 8 === 0) {
                const a = Math.random() * Math.PI * 2;
                effects.addSparks(boss.x + Math.cos(a) * 75, boss.y + Math.sin(a) * 55, Math.random() < 0.65 ? '#fed330' : '#ff2e4c', 3);
            }
            return;
        }

        if (boss.cutsceneState === 'DEFEAT_SHATTER') {
            boss.cutsceneTimer -= dt;
            const prog = Math.max(0, Math.min(1, 1 - boss.cutsceneTimer / 72));
            boss.auraScale = Math.max(0.06, 0.55 * (1 - prog * 0.85));
            boss._defeatFade = Math.max(0, 1 - Math.pow(prog, 1.55));
            boss.entranceDropY = Math.round(prog * 22);
            if (effects && tick % 5 === 0) {
                const a = Math.random() * Math.PI * 2;
                effects.addLightningChain(boss.x + Math.cos(a) * 165 * (1 - prog), boss.y + Math.sin(a) * 165 * (1 - prog), boss.x, boss.y, '#fed330');
                effects.addSparks(boss.x, boss.y, '#fef08a', 7);
                if (game && game.camera) game.camera.addShake(4 + Math.round(prog * 6));
            }
            if (boss.cutsceneTimer <= 0) {
                if (typeof ApexW60Audio !== 'undefined') ApexW60Audio.stop(false);
                if (overlay) overlay.endCutscene();
                if (effects) {
                    effects.addShockwave(boss.x, boss.y, 440, 'rgba(254, 211, 48, 0.98)');
                    effects.addShockwave(boss.x, boss.y, 310, 'rgba(255, 46, 76, 0.95)');
                    if (typeof effects.addConfetti === 'function') effects.addConfetti(boss.x, boss.y, 90);
                    effects.addSparks(boss.x, boss.y, '#fed330', 26);
                    if (typeof effects.onBossSlam === 'function') effects.onBossSlam(0.14);
                    if (typeof effects.triggerScreenFlash === 'function') effects.triggerScreenFlash('#fed330', 0.52, 28);
                    effects.addComicSplash(boss.x, boss.y - 76, '👑 OMEGA VANQUISHED! 👑', '#fed330', 30, true);
                }
                if (game && game.camera) game.camera.addShake(18);
                if (typeof window !== 'undefined' && window.soundEngine && typeof window.soundEngine.playKill === 'function') {
                    window.soundEngine.playKill();
                }
                boss.cutsceneState = 'DEFEATED_DONE';
                boss.dead = true;
            }
        }
    }

    static drawRiftEpicenter(ctx, b, t) {
        ctx.save();
        ctx.translate(b.x, b.y);
        const r = (b.radius || 62) * (b.cutsceneState === 'MAP_FRACTURE' ? 1.55 : 1.05);
        const pulse = 0.5 + 0.5 * Math.sin(t * 7);

        const g = ctx.createRadialGradient(0, 0, 8, 0, 0, r * 2.2);
        g.addColorStop(0, '#000000');
        g.addColorStop(0.35, 'rgba(126, 34, 206, 0.78)');
        g.addColorStop(0.7, 'rgba(255, 46, 76, 0.38)');
        g.addColorStop(1, 'rgba(255, 46, 76, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2); ctx.fill();

        ctx.save();
        ctx.rotate(t * 1.9);
        ctx.strokeStyle = '#ff2e4c'; ctx.lineWidth = 4; ctx.setLineDash([24, 12]);
        ctx.beginPath(); ctx.arc(0, 0, r * (1.7 + pulse * 0.2), 0, Math.PI * 2); ctx.stroke();
        ctx.rotate(-t * 3.4);
        ctx.strokeStyle = '#fed330'; ctx.lineWidth = 2.8; ctx.setLineDash([12, 10]);
        ctx.beginPath(); ctx.arc(0, 0, r * 1.15, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Swirling Void Singularity Void Core (no boss shown yet!)
        ctx.fillStyle = '#030108'; ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.arc(0, 0, r * (0.48 + pulse * 0.08), 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // Sky-tear beam rising smoothly out of the Singularity core during MAP_FRACTURE (no hard edge)
        if (b.cutsceneState === 'MAP_FRACTURE') {
            const beamG = ctx.createLinearGradient(0, -360, 0, 12);
            beamG.addColorStop(0, 'rgba(254, 211, 48, 0)');
            beamG.addColorStop(0.55, 'rgba(168, 85, 247, 0.42)');
            beamG.addColorStop(0.9, 'rgba(255, 46, 76, 0.85)');
            beamG.addColorStop(1, 'rgba(255, 46, 76, 0)');
            ctx.fillStyle = beamG;
            ctx.beginPath();
            ctx.moveTo(-r * 0.62, -360); ctx.lineTo(r * 0.62, -360);
            ctx.lineTo(r * 0.38, 0); ctx.quadraticCurveTo(0, r * 0.25, -r * 0.38, 0);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = 'rgba(254, 240, 138, 0.78)'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(t * 9) * 14, -180); ctx.lineTo(-Math.cos(t * 7) * 10, -340); ctx.stroke();
        }
        ctx.restore();
    }
}

if (typeof window !== 'undefined') window.ApexW60Cutscene = ApexW60Cutscene;
if (typeof module !== 'undefined' && module.exports) module.exports = { ApexW60Cutscene };
