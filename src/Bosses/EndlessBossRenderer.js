/**
 * Lesa.io - Endless Mini-Bosses & Main Bosses 2.5D Vector Renderer
 * Shared comic HUD, telegraph circles, and distinctive silhouettes for all 8 Endless bosses.
 */

class EndlessBossRenderer {
    static drawShadow(ctx, x, y, r, enraged = false, apex = false) {
        ctx.fillStyle = enraged ? 'rgba(255, 71, 87, 0.34)' : 'rgba(0, 0, 0, 0.36)';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.90, r * 1.15, r * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
        if (enraged || apex) {
            ctx.strokeStyle = apex ? '#ff4757' : '#f1c40f';
            ctx.lineWidth = 2.5;
            ctx.stroke();
        }
    }

    static drawTelegraphs(ctx, zones) {
        if (!Array.isArray(zones) || zones.length === 0) return;
        if (typeof BossTelegraphFX !== 'undefined') {
            BossTelegraphFX.drawZones(ctx, zones);
            return;
        }
        for (const z of zones) {
            const p = Math.max(0, Math.min(1, 1 - (z.timer / z.maxTimer)));
            ctx.save();
            ctx.strokeStyle = z.color || 'rgba(255, 71, 87, 0.92)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = z.fillColor || 'rgba(255, 71, 87, 0.24)';
            ctx.beginPath();
            ctx.arc(z.x, z.y, z.radius * p, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = '800 13px "Luckiest Guy", cursive';
            ctx.fillStyle = '#fed330';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(z.icon || '⚠️', z.x, z.y);
            ctx.restore();
        }
    }

    static drawBossHUD(ctx, b) {
        const defaultTop = ({
            frappe_baron: 22,
            traffic_warden: 12,
            dozer_foreman: 8,
            butcher_goliath: 14,
            dimarchos_boss: 26,
            syndicate_capo: 24,
            mecha_kolossos: 40
        })[b.type] || 0;
        const extraTop = b.hudTopOffset || defaultTop;
        const hudY = b.y - (b.radius + 32 + extraTop);
        const barW = b.isMiniBoss ? 76 : 98;
        const barH = b.isMiniBoss ? 7 : 9;
        const col = b.rankColor || '#fed330';
        const hpR = Math.max(0, Math.min(1, b.hp / b.maxHp));
        const label = b.hudLabel || b.name.toUpperCase();

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.font = `900 ${b.isMiniBoss ? 12 : 14}px "Luckiest Guy", cursive, sans-serif`;
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#101014';
        ctx.strokeText(label, b.x, hudY - 4);
        ctx.fillStyle = col;
        ctx.fillText(label, b.x, hudY - 4);

        ctx.fillStyle = '#1e272e';
        ctx.fillRect(b.x - barW / 2, hudY, barW, barH);
        ctx.fillStyle = col;
        ctx.fillRect(b.x - barW / 2, hudY, barW * hpR, barH);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(b.x - barW / 2, hudY, barW, barH);
        ctx.restore();
    }

    static drawLegs(ctx, r, phase, pants, boots, flash) {
        const s = Math.sin(phase) * 0.24;
        for (const [lx, rot] of [[-r * 0.28, -s], [r * 0.28, s]]) {
            ctx.save();
            ctx.translate(lx, r * 0.34);
            ctx.rotate(rot);
            ctx.fillStyle = flash ? '#ffffff' : pants;
            ctx.beginPath();
            ctx.roundRect(-r * 0.16, 0, r * 0.32, r * 0.42, 5);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = flash ? '#ffffff' : boots;
            ctx.beginPath();
            ctx.roundRect(-r * 0.19, r * 0.34, r * 0.40, r * 0.22, 4);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
    }

    static beginBody(ctx, b) {
        const r = b.radius;
        const bob = Math.sin(b.walkCycle || b.age * 0.12) * 3;
        EndlessBossRenderer.drawTelegraphs(ctx, b.telegraphs);
        ctx.save();
        EndlessBossRenderer.drawShadow(ctx, b.x, b.y, r, b.isEnraged, b.isApex);
        ctx.translate(b.x, b.y + bob);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#1e272e';
        return { r, flash: b.hitFlash > 0 };
    }

    static endBody(ctx, b) {
        ctx.restore();
        EndlessBossRenderer.drawBossHUD(ctx, b);
    }

    static drawAimedLayer(ctx, angle, anchorX, anchorY, drawFn) {
        const a = angle || 0;
        const flipY = Math.cos(a) < 0;
        ctx.save();
        ctx.translate(anchorX, anchorY);
        ctx.rotate(a);
        if (flipY) ctx.scale(1, -1);
        drawFn(ctx);
        ctx.restore();
    }

    static drawUnmirroredText(ctx, facingLeft, text, x, y, font, fill, stroke = null, maxWidth = 80) {
        ctx.save();
        ctx.translate(x, y);
        if (facingLeft) ctx.scale(-1, 1);
        ctx.font = font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (stroke) {
            ctx.lineWidth = 2.6;
            ctx.strokeStyle = stroke;
            ctx.strokeText(text, 0, 0, maxWidth);
        }
        ctx.fillStyle = fill;
        ctx.fillText(text, 0, 0, maxWidth);
        ctx.restore();
    }

    // 1. W5 MINI-BOSS: SouvlakiBrawler (Easy)
    static drawSouvlakiBrawler(ctx, b) {
        if (typeof SouvlakiBrawlerRenderer !== 'undefined') {
            SouvlakiBrawlerRenderer.draw(ctx, b);
        }
    }

    // 2. W15 MINI-BOSS: TrafficWarden (Normal)
    static drawTrafficWarden(ctx, b) {
        if (typeof TrafficWardenRenderer !== 'undefined') {
            TrafficWardenRenderer.draw(ctx, b);
        }
    }

    // 3. W25 MINI-BOSS: ButcherGoliath (Very Hard)
    static drawButcherGoliath(ctx, b) {
        if (typeof ButcherGoliathRenderer !== 'undefined') {
            ButcherGoliathRenderer.draw(ctx, b);
        }
    }

    // 4. W35+ MINI-BOSS: SyndicateCapo (Insane)
    static drawSyndicateCapo(ctx, b) {
        if (typeof SyndicateCapoRenderer !== 'undefined') {
            SyndicateCapoRenderer.draw(ctx, b);
        }
    }

    // 5. W10 MAIN BOSS: FrappeBaron (Normal)
    static drawFrappeBaron(ctx, b) {
        if (typeof FrappeBaronRenderer !== 'undefined') {
            FrappeBaronRenderer.draw(ctx, b);
        }
    }

    // 6. W20 MAIN BOSS: DozerForeman (Hard)
    static drawDozerForeman(ctx, b) {
        if (typeof DozerForemanRenderer !== 'undefined') {
            DozerForemanRenderer.draw(ctx, b);
        }
    }

    // 7. W30 MAIN BOSS: DimarchosBoss (Very Hard)
    static drawDimarchosBoss(ctx, b) {
        if (typeof DimarchosBossRenderer !== 'undefined') {
            DimarchosBossRenderer.draw(ctx, b);
        }
    }

    // 8. W40+ MAIN BOSS: MechaKolossos (Insane)
    static drawMechaKolossos(ctx, b) {
        if (typeof MechaKolossosRenderer !== 'undefined') {
            MechaKolossosRenderer.draw(ctx, b);
        }
    }
}

if (typeof window !== 'undefined') {
    window.EndlessBossRenderer = EndlessBossRenderer;
}
