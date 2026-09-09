/**
 * Lesa.io - UI Component: CinematicCutsceneOverlay
 * Cinematic letterbox aspect ratio and dialogue presenter for in-game cutscenes:
 * - Widescreen black letterbox bars sliding in top & bottom
 * - Professional dialogue card with speaker badge, avatar, and subtitle text
 * - Blocks player shooting, movement, and abilities until cutscene completes
 */

class CinematicCutsceneOverlay {
    constructor() {
        this.active = false;
        this.barProgress = 0; // 0.0 (hidden) to 1.0 (fully active)
        this.targetProgress = 0;
        this.barHeightRatio = 0.135; // ~13.5% top & bottom -> cinematic 2.35:1 widescreen aspect ratio

        this.speaker = '';
        this.dialogueText = '';
        this.speakerColor = '#fed330';
        this.avatarIcon = '💬';
        this.subText = '';
        this.pulsePhase = 0;

        // Click-to-Advance Narrative Flow
        this.promptAdvance = false;
        this.onAdvance = null;
        this.onRequestAdvance = null;
        this.lastAdvanceTime = 0;
        this.dialogueStartTime = 0;

        // Multi-player Readiness State
        this.readyCount = 0;
        this.totalPlayers = 1;
        this.isLocalReady = false;

        // Global input listeners to advance dialogue when prompt is active
        if (typeof window !== 'undefined') {
            window.addEventListener('pointerdown', (e) => {
                if (e && e.isPrimary === false) return; // Prevent multi-touch double skips
                // Ignore clicks on game menu / pause modals
                if (e.target && e.target.closest && (e.target.closest('.modal-overlay') || e.target.closest('#menu-screen'))) {
                    return;
                }
                if (this.active && this.promptAdvance) {
                    this.advance();
                }
            });

            window.addEventListener('keydown', (e) => {
                if (this.active && this.promptAdvance) {
                    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
                        this.advance();
                    }
                }
            });
        }
    }

    startCutscene(subText = 'WAVE 15 • MINI-BOSS ENCOUNTER') {
        if (typeof window !== 'undefined' && window.gameInstance && window.gameInstance.gameMode === 'endless') {
            return;
        }
        this.active = true;
        this.targetProgress = 1.0;
        this.subText = subText;
        this.speaker = '';
        this.dialogueText = '';
        this.promptAdvance = false;
        this.readyCount = 0;
        this.isLocalReady = false;
        this.lastAdvanceTime = 0;
        this.dialogueStartTime = performance.now();

        // Smoothly fade and hide in-game HUD and mobile touch controls
        if (typeof document !== 'undefined') {
            const hud = document.getElementById('game-hud');
            if (hud) hud.classList.add('cutscene-hidden');
            const mobileControls = document.getElementById('mobile-controls-container');
            if (mobileControls) mobileControls.classList.add('cutscene-hidden');
        }
    }

    setReadyState(readyCount, totalPlayers, isLocalReady = false) {
        this.readyCount = Math.max(0, readyCount || 0);
        if (typeof totalPlayers === 'number' && totalPlayers > 0) {
            this.totalPlayers = totalPlayers;
        }
        this.isLocalReady = !!isLocalReady;
    }

    setDialogue(speaker, text, speakerColor = '#fed330', avatarIcon = '💬', promptAdvance = false) {
        this.speaker = speaker;
        this.dialogueText = text;
        this.speakerColor = speakerColor;
        this.avatarIcon = avatarIcon;
        this.promptAdvance = promptAdvance;
        this.readyCount = 0;
        this.isLocalReady = false;
        this.dialogueStartTime = performance.now();
    }

    forceAdvance() {
        if (!this.active) return false;
        this.readyCount = 0;
        this.isLocalReady = false;
        if (typeof this.onAdvance === 'function') {
            this.onAdvance();
            return true;
        }
        return false;
    }

    advance() {
        if (!this.active || !this.promptAdvance) return false;
        const now = performance.now();
        // Strict Debounce: ignore touches within 320ms of last advance OR 250ms of new dialogue appearing
        if (this.lastAdvanceTime > 0 && (now - this.lastAdvanceTime) < 320) return false;
        if (this.dialogueStartTime > 0 && (now - this.dialogueStartTime) < 250) return false;
        this.lastAdvanceTime = now;

        // Cooperative multi-player advance coordination
        if (this.totalPlayers > 1 && typeof this.onRequestAdvance === 'function') {
            this.onRequestAdvance();
            return true;
        }

        // Singleplayer: advance immediately
        return this.forceAdvance();
    }

    clearDialogue() {
        this.speaker = '';
        this.dialogueText = '';
        this.promptAdvance = false;
        this.readyCount = 0;
        this.isLocalReady = false;
    }

    endCutscene() {
        this.active = false;
        this.targetProgress = 0.0;
        this.barProgress = 0.0;
        this.clearDialogue();
        this.subText = '';
        this.promptAdvance = false;
        this.onAdvance = null;
        this.readyCount = 0;
        this.isLocalReady = false;

        // Smoothly restore in-game HUD and mobile touch controls
        if (typeof document !== 'undefined') {
            const hud = document.getElementById('game-hud');
            if (hud) hud.classList.remove('cutscene-hidden');
            const mobileControls = document.getElementById('mobile-controls-container');
            if (mobileControls) mobileControls.classList.remove('cutscene-hidden');
        }
    }

    update(dt = 1) {
        // Smoothly animate letterbox bars
        if (this.barProgress < this.targetProgress) {
            this.barProgress = Math.min(this.targetProgress, this.barProgress + 0.08 * dt);
        } else if (this.barProgress > this.targetProgress) {
            this.barProgress = Math.max(this.targetProgress, this.barProgress - 0.09 * dt);
        }

        this.pulsePhase += 0.12 * dt;
    }

    draw(ctx, width, height) {
        if (this.barProgress <= 0.001) return;

        const dpr = (window.gameInstance && window.gameInstance.dpr) || (window.devicePixelRatio || 1);
        const cssW = width / dpr;
        const cssH = height / dpr;
        const isMobile = (cssW < 720) || (cssH < 480);
        const mobileScale = isMobile ? Math.min(1.0, Math.max(0.72, Math.min(cssW / 540, cssH / 400))) : 1.0;
        const effDpr = dpr * mobileScale;

        ctx.save();
        const effectiveRatio = (cssH < 400) ? 0.11 : this.barHeightRatio;
        const barH = Math.round(height * effectiveRatio) * this.barProgress;

        // 1. TOP CINEMATIC BAR (Letterbox)
        ctx.fillStyle = '#05070a';
        ctx.fillRect(0, 0, width, barH);
        ctx.fillStyle = '#fed330';
        ctx.fillRect(0, barH - Math.max(2, Math.round(3 * effDpr)), width, Math.max(2, Math.round(3 * effDpr)));

        // Top Subtitle / Context tag
        if (this.subText && this.barProgress > 0.6) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const subFontSize = Math.round(Math.min(14 * effDpr, width / 26));
            ctx.font = `900 ${subFontSize}px 'Luckiest Guy', cursive, sans-serif`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
            ctx.fillText(this.subText, width / 2, barH / 2);
        }

        // 2. BOTTOM CINEMATIC BAR (Letterbox)
        const bottomY = height - barH;
        ctx.fillStyle = '#05070a';
        ctx.fillRect(0, bottomY, width, barH);
        ctx.fillStyle = '#fed330';
        ctx.fillRect(0, bottomY, width, Math.max(2, Math.round(3 * effDpr)));

        // 3. DIALOGUE BOX (Presents dialogue prominently above the bottom bar)
        if (this.dialogueText && this.barProgress > 0.4) {
            this.drawDialogueBox(ctx, width, height, barH, dpr, effDpr, isMobile);
        }

        ctx.restore();
    }

    getWrappedLines(ctx, text, maxW) {
        if (!text) return [];
        if (ctx.measureText(text).width <= maxW) return [text];

        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine ? (currentLine + ' ' + word) : word;
            if (ctx.measureText(testLine).width <= maxW) {
                currentLine = testLine;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    lines.push(word);
                    currentLine = '';
                }
            }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
    }

    drawDialogueBox(ctx, width, height, barH, dpr = 1, effDpr = dpr, isMobile = false) {
        const boxW = Math.min(840 * effDpr, width - Math.round(16 * dpr));
        const boxX = (width - boxW) / 2;
        const cornerR = Math.round(14 * effDpr);

        const avatarSize = Math.round(isMobile ? 48 * effDpr : 64 * dpr);
        const avatarPad = Math.round(12 * effDpr);
        const avatarX = boxX + avatarPad;
        const textX = avatarX + avatarSize + Math.round(14 * effDpr);
        const maxTextW = (boxX + boxW) - textX - Math.round(14 * effDpr);

        // 1. Dynamic Font-Size Scaling & Word Wrapping
        let fontSize = Math.round(isMobile ? 15 * effDpr : 18 * dpr);
        let lineHeight = Math.round(isMobile ? 20 * effDpr : 23 * dpr);
        ctx.font = `900 ${fontSize}px 'Luckiest Guy', cursive, sans-serif`;
        let lines = this.getWrappedLines(ctx, this.dialogueText, maxTextW);

        if (lines.length > 2) {
            fontSize = Math.round(isMobile ? 13.5 * effDpr : 15 * dpr);
            lineHeight = Math.round(isMobile ? 17.5 * effDpr : 20 * dpr);
            ctx.font = `900 ${fontSize}px 'Luckiest Guy', cursive, sans-serif`;
            lines = this.getWrappedLines(ctx, this.dialogueText, maxTextW);
        }
        if (lines.length > 3) {
            fontSize = Math.round(isMobile ? 12 * effDpr : 13.5 * dpr);
            lineHeight = Math.round(isMobile ? 15.5 * effDpr : 18 * dpr);
            ctx.font = `900 ${fontSize}px 'Luckiest Guy', cursive, sans-serif`;
            lines = this.getWrappedLines(ctx, this.dialogueText, maxTextW);
        }

        // 2. Dynamic Height Calculation: Box expands UPWARD so text NEVER spills off screen
        const speakerH = this.speaker ? Math.round(isMobile ? 18 * effDpr : 24 * dpr) : 0;
        const promptPad = this.promptAdvance ? Math.round(isMobile ? 24 * effDpr : 22 * dpr) : 0;
        const contentH = Math.round(12 * effDpr) + speakerH + (lines.length * lineHeight) + promptPad + Math.round(10 * effDpr);
        const minBoxH = avatarSize + Math.round(20 * effDpr);
        const boxH = Math.max(minBoxH, contentH);

        // Anchored safely above the bottom cinematic bar
        const boxY = Math.max(barH + Math.round(6 * effDpr), height - barH - boxH - Math.round(10 * effDpr));

        ctx.save();

        // Dialogue Box Backdrop (Dark sleek comic card)
        ctx.fillStyle = 'rgba(13, 17, 23, 0.96)';
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, cornerR);
        ctx.fill();

        // Outer Dark Comic Border
        ctx.lineWidth = Math.round(3 * effDpr);
        ctx.strokeStyle = '#1e272e';
        ctx.stroke();

        // Inner Accent Border
        ctx.lineWidth = Math.max(1, Math.round(1.6 * effDpr));
        ctx.strokeStyle = this.speakerColor || '#fed330';
        ctx.beginPath();
        ctx.roundRect(boxX + (2.5 * effDpr), boxY + (2.5 * effDpr), boxW - (5 * effDpr), boxH - (5 * effDpr), Math.max(4, cornerR - (2.5 * effDpr)));
        ctx.stroke();

        // Clip everything inside dialogue card bounds for 100% spill-proof protection
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, cornerR);
        ctx.clip();

        // Avatar Frame Box
        const avatarY = boxY + avatarPad;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, Math.round(10 * effDpr));
        ctx.fill();
        ctx.lineWidth = Math.max(1, Math.round(1.8 * effDpr));
        ctx.strokeStyle = this.speakerColor || '#fed330';
        ctx.stroke();

        // Avatar Icon
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const iconFontSize = Math.round(isMobile ? 26 * effDpr : 34 * dpr);
        ctx.font = `${iconFontSize}px sans-serif`;
        ctx.fillText(this.avatarIcon || '💬', avatarX + avatarSize / 2, avatarY + avatarSize / 2 + (1.5 * effDpr));

        // Speaker Name Badge
        if (this.speaker) {
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.font = `900 ${Math.round(isMobile ? 13 * effDpr : 15 * dpr)}px 'Luckiest Guy', cursive`;
            ctx.lineWidth = Math.round(2.8 * effDpr);
            ctx.strokeStyle = '#000000';
            ctx.strokeText(this.speaker, textX, boxY + Math.round(10 * effDpr));
            ctx.fillStyle = this.speakerColor || '#fed330';
            ctx.fillText(this.speaker, textX, boxY + Math.round(10 * effDpr));
        }

        // Dialogue Line(s)
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.font = `900 ${fontSize}px 'Luckiest Guy', cursive, sans-serif`;

        const startLineY = this.speaker
            ? (boxY + Math.round(10 * effDpr) + speakerH + Math.round(4 * effDpr))
            : (boxY + Math.round(14 * effDpr) + Math.max(0, (boxH - promptPad - (lines.length * lineHeight)) / 3));

        ctx.lineWidth = Math.round(3 * effDpr);
        ctx.strokeStyle = '#000000';
        for (let i = 0; i < lines.length; i++) {
            const ly = startLineY + (i * lineHeight);
            ctx.strokeText(lines[i], textX, ly);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(lines[i], textX, ly);
        }

        // Animated Advance Prompt Pill (Bottom-right of dialogue box)
        if (this.promptAdvance) {
            const pulse = 0.5 + Math.sin(this.pulsePhase * 2.0) * 0.5;
            const isTouch = (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
            const promptMsg = (this.totalPlayers > 1)
                ? (this.isLocalReady
                    ? `READY! (${this.readyCount}/${this.totalPlayers} PLAYERS)`
                    : `${isTouch ? 'TAP' : 'CLICK'} TO CONTINUE (${this.readyCount}/${this.totalPlayers} PLAYERS)`)
                : (isTouch ? 'TAP TO CONTINUE ▶' : 'CLICK TO CONTINUE ▶');

            ctx.font = `900 ${Math.round(isMobile ? 10 * effDpr : 11.5 * dpr)}px 'Luckiest Guy', cursive, sans-serif`;
            const textW = ctx.measureText(promptMsg).width;
            const pillW = Math.round(textW + (20 * effDpr));
            const pillH = Math.round(isMobile ? 22 * effDpr : 24 * dpr);
            const pillX = Math.max(textX, boxX + boxW - pillW - Math.round(10 * effDpr));
            const pillY = boxY + boxH - pillH - Math.round(7 * effDpr);

            if (this.isLocalReady) {
                // Vibrant green readiness badge
                ctx.fillStyle = `rgba(46, 213, 115, ${0.16 + 0.16 * pulse})`;
                ctx.beginPath();
                ctx.roundRect(pillX, pillY, pillW, pillH, Math.round(6 * effDpr));
                ctx.fill();

                ctx.lineWidth = Math.max(1, Math.round(1.5 * effDpr));
                ctx.strokeStyle = `rgba(46, 213, 115, ${0.6 + 0.4 * pulse})`;
                ctx.stroke();

                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = `rgba(46, 213, 115, ${0.9 + 0.1 * pulse})`;
                ctx.fillText(promptMsg, pillX + pillW / 2, pillY + pillH / 2);
            } else {
                // Comic golden tap prompt
                ctx.fillStyle = `rgba(254, 211, 48, ${0.12 + 0.16 * pulse})`;
                ctx.beginPath();
                ctx.roundRect(pillX, pillY, pillW, pillH, Math.round(6 * effDpr));
                ctx.fill();

                ctx.lineWidth = Math.max(1, Math.round(1.5 * effDpr));
                ctx.strokeStyle = `rgba(254, 211, 48, ${0.5 + 0.5 * pulse})`;
                ctx.stroke();

                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = `rgba(254, 211, 48, ${0.85 + 0.15 * pulse})`;
                ctx.fillText(promptMsg, pillX + pillW / 2, pillY + pillH / 2);
            }
        } else {
            // Subtle pulse dot indicator
            const pulse = 0.5 + Math.sin(this.pulsePhase) * 0.5;
            ctx.fillStyle = `rgba(254, 211, 48, ${0.4 + 0.6 * pulse})`;
            ctx.beginPath();
            ctx.arc(boxX + boxW - Math.round(18 * effDpr), boxY + boxH - Math.round(18 * effDpr), Math.round(4 * effDpr), 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore(); // Restore clip
        ctx.restore(); // Restore outer dialogue box
    }

    /**
     * Computes shoulder-to-shoulder formation positions for all co-op players.
     * Line formation is oriented perpendicular to the direction of the incoming boss,
     * so all players stand side-by-side facing directly toward the boss.
     * Supports 2, 3, 4, or more players seamlessly.
     */
    static computeSquadPositions(anchorX, anchorY, bossX, bossY, totalPlayers = 2) {
        const count = Math.max(1, Math.round(totalPlayers));
        if (count === 1) {
            const angle = (Number.isFinite(bossX) && Number.isFinite(bossY))
                ? Math.atan2(bossY - anchorY, bossX - anchorX)
                : -Math.PI / 2;
            return [{ x: Math.round(anchorX), y: Math.round(anchorY), angle: Number(angle.toFixed(2)) }];
        }

        let angleToBoss;
        if (Number.isFinite(bossX) && Number.isFinite(bossY)) {
            const dx = bossX - anchorX;
            const dy = bossY - anchorY;
            angleToBoss = (Math.hypot(dx, dy) > 1) ? Math.atan2(dy, dx) : -Math.PI / 2;
        } else {
            angleToBoss = -Math.PI / 2;
        }

        const perpAngle = angleToBoss + Math.PI / 2;
        const spacing = 52;
        const positions = [];

        for (let i = 0; i < count; i++) {
            const offset = (i - (count - 1) / 2) * spacing;
            const px = Math.round(anchorX + Math.cos(perpAngle) * offset);
            const py = Math.round(anchorY + Math.sin(perpAngle) * offset);
            positions.push({
                x: px,
                y: py,
                angle: Number(angleToBoss.toFixed(2))
            });
        }
        return positions;
    }

    /**
     * Gathers all players on the Host and aligns them shoulder-to-shoulder facing the boss.
     */
    static positionCoopSquad(game, hostSession) {
        if (!game || !game.player) return [];
        const arenaW = (game.arena && game.arena.width) || 2000;
        const arenaH = (game.arena && game.arena.height) || 2000;
        const anchorX = Math.max(140, Math.min(arenaW - 140, game.player.x));
        const anchorY = Math.max(140, Math.min(arenaH - 140, game.player.y));

        const players = [game.player];
        if (hostSession) {
            if (Array.isArray(hostSession.remotePlayers) && hostSession.remotePlayers.length > 0) {
                players.push(...hostSession.remotePlayers.filter(p => p && p !== game.player));
            } else if (hostSession.remotePlayer) {
                players.push(hostSession.remotePlayer);
            }
        }

        let bossX = null;
        let bossY = null;
        if (Array.isArray(game.enemies)) {
            const boss = game.enemies.find(e => e && !e.dead && (e.isBoss || e.type === 'kiloumpas' || e.type === 'rouf' || e.name === 'Kiloumpas' || e.name === 'Rouf'));
            if (boss) {
                bossX = boss.x;
                bossY = boss.y;
                if (boss.policeCar && Number.isFinite(boss.policeCar.x)) {
                    bossX = boss.policeCar.x;
                    bossY = boss.policeCar.y;
                }
            }
        }

        const positions = CinematicCutsceneOverlay.computeSquadPositions(anchorX, anchorY, bossX, bossY, players.length);
        for (let i = 0; i < players.length; i++) {
            const p = players[i];
            const pos = positions[i];
            if (p && pos) {
                p.x = pos.x;
                p.y = pos.y;
                p.vx = 0;
                p.vy = 0;
                p.isMoving = false;
                p.angle = pos.angle;
                if (game.effects && typeof game.effects.addDust === 'function') {
                    game.effects.addDust(pos.x, pos.y, 6, 8);
                }
            }
        }

        if (game.camera) {
            game.camera.x = game.player.x;
            game.camera.y = game.player.y;
        }
        return positions;
    }

    /**
     * Applies the synchronized squad formation on the Guest client.
     */
    static applyGuestSquadPositions(game, guestSession, positions) {
        if (!game || !Array.isArray(positions) || positions.length < 2) return;
        const hostPos = positions[0];
        const guestPos = positions[1];

        if (guestSession && guestSession.remotePlayer && hostPos) {
            guestSession.remotePlayer.x = hostPos.x;
            guestSession.remotePlayer.y = hostPos.y;
            guestSession.remotePlayer.vx = 0;
            guestSession.remotePlayer.vy = 0;
            guestSession.remotePlayer.isMoving = false;
            guestSession.remotePlayer.angle = hostPos.angle;
            if (game.effects && typeof game.effects.addDust === 'function') {
                game.effects.addDust(hostPos.x, hostPos.y, 6, 8);
            }
        }

        if (game.player && guestPos) {
            game.player.x = guestPos.x;
            game.player.y = guestPos.y;
            game.player.vx = 0;
            game.player.vy = 0;
            game.player.isMoving = false;
            game.player.angle = guestPos.angle;
            if (game.effects && typeof game.effects.addDust === 'function') {
                game.effects.addDust(guestPos.x, guestPos.y, 6, 8);
            }
        }

        if (game.camera && guestPos) {
            game.camera.x = guestPos.x;
            game.camera.y = guestPos.y;
        }
    }
}

if (typeof window !== 'undefined') {
    window.CinematicCutsceneOverlay = CinematicCutsceneOverlay;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CinematicCutsceneOverlay };
}
