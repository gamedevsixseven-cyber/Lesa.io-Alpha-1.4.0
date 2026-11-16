/**
 * Lesa.io - Endless Progressive Enemies 2.5D Vector Renderer
 * Renders BouzoukiSniper, KafeneioTank, OuzoBomber, DimotikiEnforcer,
 * plus sniper laser telegraphs and burning ouzo puddle hazards.
 */

class EndlessEnemyRenderer {
    static drawShadow(ctx, x, y, r, scaleX = 1.0, scaleY = 0.38) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.88, r * scaleX, r * scaleY, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    static drawLimbs(ctx, r, phase, pantsColor, shoeColor, flash) {
        const swing = Math.sin(phase) * 0.25;
        const drawLeg = (lx, rot) => {
            ctx.save();
            ctx.translate(lx, r * 0.30);
            ctx.rotate(rot);
            ctx.fillStyle = flash ? '#ffffff' : pantsColor;
            ctx.beginPath();
            ctx.roundRect(-r * 0.14, 0, r * 0.28, r * 0.42, 4);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = flash ? '#ffffff' : shoeColor;
            ctx.beginPath();
            ctx.roundRect(-r * 0.16, r * 0.34, r * 0.36, r * 0.20, 4);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        };
        drawLeg(-r * 0.24, -swing);
        drawLeg(r * 0.24, swing);
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

    static drawUnmirroredText(ctx, facingLeft, text, x, y, font, fill, stroke = null, maxWidth = 60) {
        ctx.save();
        ctx.translate(x, y);
        if (facingLeft) ctx.scale(-1, 1);
        if (typeof EnemyBase !== 'undefined' && EnemyBase.getLabelSprite) {
            const lbl = EnemyBase.getLabelSprite(text, font, fill, stroke || '', stroke ? 2.4 : 0, maxWidth, 'middle');
            EnemyBase.drawLabel(ctx, lbl, 0, 0);
        } else {
            ctx.font = font;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            if (stroke) {
                ctx.lineWidth = 2.4;
                ctx.strokeStyle = stroke;
                ctx.strokeText(text, 0, 0, maxWidth);
            }
            ctx.fillStyle = fill;
            ctx.fillText(text, 0, 0, maxWidth);
        }
        ctx.restore();
    }

    static drawSniper(ctx, e) {
        if (typeof BouzoukiSniperRenderer !== 'undefined') {
            BouzoukiSniperRenderer.draw(ctx, e);
        }
    }

    static drawTank(ctx, e) {
        if (typeof KafeneioTankRenderer !== 'undefined') {
            KafeneioTankRenderer.draw(ctx, e);
        }
    }

    static drawBomber(ctx, e) {
        if (typeof OuzoBomberRenderer !== 'undefined') {
            OuzoBomberRenderer.draw(ctx, e);
        }
    }

    static drawEnforcer(ctx, e) {
        if (typeof DimotikiEnforcerRenderer !== 'undefined') {
            DimotikiEnforcerRenderer.draw(ctx, e);
        }
    }
}

if (typeof window !== 'undefined') {
    window.EndlessEnemyRenderer = EndlessEnemyRenderer;
}
