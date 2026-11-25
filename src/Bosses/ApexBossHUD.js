/**
 * Lesa.io - Exclusive Screen-Top Apex Boss Health Bar HUD
 * Renders ONLY when an Apex Boss (W30 / W60 Hard Mode) is active in combat.
 * Positioned centered beneath the top Wave/Score pill with delayed damage trail,
 * phase threshold notches, animated ember sheen, and live HP/phase telemetry.
 */

class ApexBossHUD {
    static _trailRatio = 1.0;
    static _lastBossId = null;

    static getActiveApexBoss(game) {
        if (!game || !Array.isArray(game.enemies)) return null;
        for (let i = 0; i < game.enemies.length; i++) {
            const e = game.enemies[i];
            if (e && !e.dead && e.isApexBoss) return e;
        }
        return null;
    }

    static draw(ctx, width, height, game) {
        if (!ctx || !game || game.state !== 'PLAYING') return;
        if (game.cutsceneOverlay && game.cutsceneOverlay.active) return;
        const boss = this.getActiveApexBoss(game);
        if (!boss) { this._lastBossId = null; this._trailRatio = 1.0; return; }
        if (boss.cutsceneState && boss.cutsceneState !== 'COMBAT') return;

        const dpr = game.dpr || (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
        const cssW = width / dpr;
        const cssH = height / dpr;
        const isCompact = cssW < 780 || cssH < 520;
        const s = isCompact ? Math.max(0.74, Math.min(cssW / 680, cssH / 480)) * dpr : dpr;

        const hpRatio = Math.max(0, Math.min(1, (Number(boss.hp) || 0) / Math.max(1, Number(boss.maxHp) || 1)));
        if (this._lastBossId !== boss) {
            this._lastBossId = boss;
            this._trailRatio = hpRatio;
        } else {
            this._trailRatio += (hpRatio - this._trailRatio) * (hpRatio < this._trailRatio ? 0.08 : 0.25);
        }

        const barW = Math.min(width * (isCompact ? 0.62 : 0.44), 560 * s);
        const barH = Math.round(18 * s);
        const topAnchor = isCompact ? Math.round(126 * s) : Math.round(170 * s);
        const cx = width * 0.5;
        const x0 = cx - barW * 0.5;
        const phase = boss.phase || (hpRatio <= 0.30 ? 3 : (hpRatio <= 0.65 ? 2 : 1));
        const isShielded = !!boss.shieldActive;
        const rankTag = isShielded ? '🛡️ AEGIS SHIELD • IMMUNE' : (boss.apexBadgeText || (phase >= 3 ? '⚡ APEX OVERDRIVE ⚡' : '👑 APEX BOSS'));
        const accent = isShielded ? '#fbbf24' : (boss.rankColor || '#ff2e4c');
        const now = (boss.age || 0) * 0.06;

        ctx.save();
        // Title & Phase nameplate cleanly above the Apex bar
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const titleSize = Math.round(14.5 * s);
        ctx.font = `900 ${titleSize}px "Luckiest Guy", cursive, sans-serif`;
        const fullTitle = `${rankTag} • ${(boss.apexTitle || boss.name || 'APEX SOVEREIGN').toUpperCase()}`;
        ctx.lineWidth = Math.max(3, 4 * s);
        ctx.strokeStyle = '#07090f';
        ctx.strokeText(fullTitle, cx, topAnchor - 6 * s);
        ctx.fillStyle = isShielded ? '#fef08a' : (phase >= 3 ? '#ff9f43' : '#fed330');
        ctx.fillText(fullTitle, cx, topAnchor - 6 * s);

        // Obsidian outer bevel frame (pulsing golden barrier glow while shielded)
        const pad = Math.round(4 * s);
        if (isShielded) {
            ctx.strokeStyle = `rgba(254, 211, 48, ${0.42 + 0.28 * Math.sin(now * 6)})`;
            ctx.lineWidth = Math.max(5, 7 * s);
            ctx.beginPath();
            ctx.roundRect(x0 - pad - 2 * s, topAnchor - pad - 2 * s, barW + (pad + 2 * s) * 2, barH + (pad + 2 * s) * 2, 9 * s);
            ctx.stroke();
        }
        ctx.fillStyle = '#090b12';
        ctx.beginPath();
        ctx.roundRect(x0 - pad, topAnchor - pad, barW + pad * 2, barH + pad * 2, 7 * s);
        ctx.fill();

        // Dark track interior
        ctx.fillStyle = '#191d2b';
        ctx.fillRect(x0, topAnchor, barW, barH);

        // Delayed white-gold impact trail
        if (this._trailRatio > hpRatio) {
            ctx.fillStyle = 'rgba(254, 211, 48, 0.72)';
            ctx.fillRect(x0, topAnchor, barW * this._trailRatio, barH);
        }

        // Main Apex molten crimson-amber-violet fill
        if (hpRatio > 0) {
            const fillW = barW * hpRatio;
            const grd = ctx.createLinearGradient(x0, topAnchor, x0 + barW, topAnchor);
            if (isShielded) {
                grd.addColorStop(0, '#78350f');
                grd.addColorStop(0.45, '#f59e0b');
                grd.addColorStop(0.85, '#fed330');
                grd.addColorStop(1, '#fef08a');
            } else if (phase >= 3) {
                grd.addColorStop(0, '#7f1d1d');
                grd.addColorStop(0.45, '#ff2e4c');
                grd.addColorStop(0.82, '#fb923c');
                grd.addColorStop(1, '#fef08a');
            } else {
                grd.addColorStop(0, '#991b1b');
                grd.addColorStop(0.55, accent);
                grd.addColorStop(1, '#fed330');
            }
            ctx.fillStyle = grd;
            ctx.fillRect(x0, topAnchor, fillW, barH);

            // Animated crystalline barrier diagonal stripes while invulnerable
            if (isShielded) {
                ctx.save();
                ctx.beginPath();
                ctx.rect(x0, topAnchor, barW, barH);
                ctx.clip();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
                ctx.lineWidth = Math.max(3, 5 * s);
                const step = 18 * s;
                const offset = (now * 38 * s) % step;
                for (let sx = x0 - barH - step + offset; sx < x0 + barW + barH; sx += step) {
                    ctx.beginPath();
                    ctx.moveTo(sx, topAnchor + barH);
                    ctx.lineTo(sx + barH * 0.9, topAnchor);
                    ctx.stroke();
                }
                ctx.restore();
            }

            // Top specular strip + moving energy pulse
            ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
            ctx.fillRect(x0, topAnchor + 1 * s, fillW, Math.max(2, barH * 0.26));
            const pulseX = x0 + ((now * 90 * s) % Math.max(24 * s, fillW));
            const sheenW = Math.min(36 * s, x0 + fillW - pulseX);
            if (sheenW > 2) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
                ctx.fillRect(pulseX, topAnchor, sheenW, barH);
            }
        }

        // Phase threshold divider notches (65%, 50% & 30% for W30, or custom thresholds)
        const notches = Array.isArray(boss.phaseNotches) ? boss.phaseNotches : [0.65, 0.50, 0.30];
        ctx.strokeStyle = 'rgba(254, 211, 48, 0.85)';
        ctx.lineWidth = Math.max(1.5, 2 * s);
        for (const n of notches) {
            const nx = x0 + barW * n;
            ctx.beginPath();
            ctx.moveTo(nx, topAnchor);
            ctx.lineTo(nx, topAnchor + barH);
            ctx.stroke();
        }

        // Crisp crimson-gold frame stroke (brighter icy-gold border when shield-locked)
        ctx.strokeStyle = isShielded ? '#fef08a' : '#fed330';
        ctx.lineWidth = Math.max(2, (isShielded ? 3.2 : 2.5) * s);
        ctx.beginPath();
        ctx.roundRect(x0 - pad, topAnchor - pad, barW + pad * 2, barH + pad * 2, 7 * s);
        ctx.stroke();

        // Corner diamond crests
        const cr = 7 * s;
        for (const dx of [x0 - pad, x0 + barW + pad]) {
            ctx.save();
            ctx.translate(dx, topAnchor + barH * 0.5);
            ctx.rotate(Math.PI / 4);
            ctx.fillStyle = isShielded ? '#fef08a' : '#ff2e4c';
            ctx.strokeStyle = isShielded ? '#ff2e4c' : '#fed330';
            ctx.lineWidth = 2 * s;
            ctx.fillRect(-cr * 0.65, -cr * 0.65, cr * 1.3, cr * 1.3);
            ctx.strokeRect(-cr * 0.65, -cr * 0.65, cr * 1.3, cr * 1.3);
            ctx.restore();
        }

        // Centered numeric HP & Shield Status inside bar
        const baseHpStr = `${Math.max(0, Math.ceil(boss.hp)).toLocaleString()} / ${Math.ceil(boss.maxHp).toLocaleString()} (${Math.round(hpRatio * 100)}%)`;
        const hpStr = isShielded ? `🛡️ IMMUNE • ${baseHpStr}` : baseHpStr;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `900 ${Math.round(11 * s)}px "Nunito", sans-serif`;
        ctx.lineWidth = Math.max(2.5, 3 * s);
        ctx.strokeStyle = '#07090f';
        ctx.strokeText(hpStr, cx, topAnchor + barH * 0.52);
        ctx.fillStyle = isShielded ? '#fef08a' : '#ffffff';
        ctx.fillText(hpStr, cx, topAnchor + barH * 0.52);

        // Live 4-pillar containment pips while Aegis Shield is active
        let subLabelY = topAnchor + barH + 7 * s;
        if (isShielded && Array.isArray(boss.shieldPillars) && boss.shieldPillars.length > 0) {
            const pCount = boss.shieldPillars.length;
            const gap = 22 * s;
            const startPx = cx - ((pCount - 1) * gap) * 0.5;
            const py = topAnchor + barH + 15 * s;
            for (let i = 0; i < pCount; i++) {
                const p = boss.shieldPillars[i];
                const alive = !!(p && !p.dead && p.hp > 0);
                const px = startPx + i * gap;
                const pr = 6.2 * s;
                ctx.save();
                ctx.translate(px, py);
                ctx.rotate(Math.PI / 4);
                ctx.fillStyle = alive ? '#ff2e4c' : '#1e293b';
                ctx.strokeStyle = alive ? '#fed330' : '#475569';
                ctx.lineWidth = Math.max(1.5, 2 * s);
                ctx.fillRect(-pr, -pr, pr * 2, pr * 2);
                ctx.strokeRect(-pr, -pr, pr * 2, pr * 2);
                if (!alive) {
                    ctx.strokeStyle = '#94a3b8';
                    ctx.beginPath(); ctx.moveTo(-pr * 0.8, -pr * 0.8); ctx.lineTo(pr * 0.8, pr * 0.8); ctx.stroke();
                }
                ctx.restore();
            }
            subLabelY = topAnchor + barH + 28 * s;
        }

        if (boss.phaseLabel) {
            ctx.textBaseline = 'top';
            ctx.font = `900 ${Math.round(10.5 * s)}px "Nunito", sans-serif`;
            ctx.strokeText(boss.phaseLabel, cx, subLabelY);
            ctx.fillStyle = isShielded ? '#fef08a' : '#fca5a5';
            ctx.fillText(boss.phaseLabel, cx, subLabelY);
        }
        ctx.restore();
    }
}

if (typeof window !== 'undefined') window.ApexBossHUD = ApexBossHUD;
if (typeof module !== 'undefined' && module.exports) module.exports = { ApexBossHUD };
