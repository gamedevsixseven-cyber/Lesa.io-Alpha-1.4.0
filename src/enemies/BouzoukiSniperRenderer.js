/**
 * Lesa.io - Endless Progressive Enemy 2.5D Renderer: BouzoukiSniper
 * Rebetiko sniper assassin in a deep plum velvet vest, crimson silk ascot,
 * pocket chain, fedora with gold band, targeting laser lens, and a striped
 * pear-shaped Greek bouzouki converted into a scoped long-barrel sniper rifle.
 */

class BouzoukiSniperRenderer {
    static draw(ctx, e) {
        const r = e.radius || 23;
        const flash = e.hitFlash > 0;
        const age = e.age || 0;
        const aimAngle = e.angle || 0;
        const facingLeft = Math.cos(aimAngle) < 0;
        const isBack = Math.sin(aimAngle) < -0.68;
        const isAiming = (e.aimTimer || 0) > 0 && (e.aimMax || 0) > 0;
        const bob = isAiming ? 0 : Math.sin(e.walkCycle || age * 0.16) * 2.4;

        if (isAiming) {
            BouzoukiSniperRenderer.drawLaserTelegraph(ctx, e);
        }

        ctx.save();
        EndlessEnemyRenderer.drawShadow(ctx, e.x, e.y, r, 0.96, 0.38);
        ctx.translate(e.x, e.y + bob);

        if (!isAiming && typeof SpriteAtlasCache !== 'undefined') {
            const rKey = Math.round(r * 2);
            const walkBin = SpriteAtlasCache.quantizePhase(e.walkCycle || age * 0.16, 8);
            const qCycle = SpriteAtlasCache.binAngle(walkBin, 8);
            const bodyKey = `sniper_b:${rKey}:${walkBin}:${isBack ? 1 : 0}:${flash ? 1 : 0}`;
            const bw = Math.ceil(r * 4.0);
            const bh = Math.ceil(r * 4.2);

            SpriteAtlasCache.drawCached(ctx, bodyKey, bw, bh, bw * 0.5, bh * 0.5, (bctx) => {
                bctx.lineWidth = 2.6;
                bctx.strokeStyle = '#141418';
                EndlessEnemyRenderer.drawLimbs(bctx, r, qCycle, '#2f3640', '#141418', flash);
                BouzoukiSniperRenderer.drawMarksmanVest(bctx, r, isBack, false, flash);
                BouzoukiSniperRenderer.drawMarksmanHead(bctx, r, 0, isBack, false, flash);
            }, { flipX: facingLeft });

            const anchorX = facingLeft ? -r * 0.14 : r * 0.14;
            EndlessEnemyRenderer.drawAimedLayer(ctx, aimAngle, anchorX, r * 0.04, () => {
                const gunKey = `sniper_g:${rKey}:${flash ? 1 : 0}`;
                const gw = Math.ceil(r * 5.2);
                const gh = Math.ceil(r * 2.8);
                SpriteAtlasCache.drawCached(ctx, gunKey, gw, gh, Math.ceil(r * 1.4), gh * 0.5, (gctx) => {
                    gctx.lineWidth = 2.6;
                    gctx.strokeStyle = '#141418';
                    BouzoukiSniperRenderer.drawBouzoukiRifle(gctx, r, 0, false, flash);
                });
            });
        } else {
            ctx.lineWidth = 2.6;
            ctx.strokeStyle = '#141418';

            // Character Body Layer
            ctx.save();
            if (facingLeft) ctx.scale(-1, 1);

            EndlessEnemyRenderer.drawLimbs(ctx, r, e.walkCycle || age * 0.16, '#2f3640', '#141418', flash);
            BouzoukiSniperRenderer.drawMarksmanVest(ctx, r, isBack, isAiming, flash);
            BouzoukiSniperRenderer.drawMarksmanHead(ctx, r, age, isBack, isAiming, flash);
            ctx.restore();

            // Aimed Scoped Bouzouki Rifle
            const anchorX = facingLeft ? -r * 0.14 : r * 0.14;
            EndlessEnemyRenderer.drawAimedLayer(ctx, aimAngle, anchorX, r * 0.04, () => {
                BouzoukiSniperRenderer.drawBouzoukiRifle(ctx, r, age, isAiming, flash);
            });
        }

        ctx.restore();
        if (typeof e.drawOverheadHUD === 'function') e.drawOverheadHUD(ctx);
    }

    static drawLaserTelegraph(ctx, e) {
        const prog = Math.max(0, Math.min(1, 1 - (e.aimTimer / e.aimMax)));
        const len = 460;
        const tx = e.x + Math.cos(e.aimAngle) * len;
        const ty = e.y + Math.sin(e.aimAngle) * len;
        const locked = prog > 0.72;

        ctx.save();
        // Faint red cone wash
        ctx.strokeStyle = locked ? 'rgba(255, 71, 87, 0.35)' : 'rgba(255, 71, 87, 0.16)';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        // Crisp beam core
        ctx.strokeStyle = locked ? '#ffffff' : `rgba(255, 71, 87, ${0.52 + prog * 0.48})`;
        ctx.lineWidth = 1.6 + prog * 2.4;
        ctx.setLineDash(locked ? [] : [9, 6]);
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.setLineDash([]);

        // Pulsing lock dot along tip
        ctx.fillStyle = locked ? '#ffffff' : '#ff4757';
        ctx.beginPath();
        ctx.arc(tx, ty, 3 + prog * 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    static drawMarksmanVest(ctx, r, isBack, isAiming, flash) {
        // Off-hand dark sleeve stabilizer arm
        ctx.fillStyle = flash ? '#ffffff' : '#341f97';
        ctx.beginPath();
        ctx.roundRect(r * 0.16, -r * 0.16, r * 0.48, r * 0.22, 5);
        ctx.fill();
        ctx.stroke();

        // Slim Rebetiko Suit Coat + Royal Plum Velvet Vest
        ctx.fillStyle = flash ? '#ffffff' : '#2f3640';
        ctx.beginPath();
        ctx.roundRect(-r * 0.52, -r * 0.38, r * 1.04, r * 0.80, 9);
        ctx.fill();
        ctx.stroke();

        if (flash) return;

        ctx.fillStyle = '#5f27cd';
        ctx.beginPath();
        ctx.roundRect(-r * 0.44, -r * 0.36, r * 0.88, r * 0.72, 7);
        ctx.fill();
        ctx.stroke();

        if (!isBack) {
            // Crisp White Open Collar & Crimson Ascot
            ctx.fillStyle = '#f5f6fa';
            ctx.beginPath();
            ctx.moveTo(-r * 0.22, -r * 0.36);
            ctx.lineTo(0, r * 0.12);
            ctx.lineTo(r * 0.22, -r * 0.36);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ff4757';
            ctx.beginPath();
            ctx.moveTo(-r * 0.10, -r * 0.34);
            ctx.lineTo(r * 0.10, -r * 0.34);
            ctx.lineTo(0, r * 0.04);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Silver Pocket Watch Chain & Vest Buttons
            ctx.strokeStyle = '#dfe6e9';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(-r * 0.14, r * 0.12, r * 0.20, 0.2, Math.PI - 0.3);
            ctx.stroke();

            ctx.fillStyle = '#fed330';
            ctx.fillRect(-r * 0.04, r * 0.14, r * 0.08, r * 0.08);
            ctx.fillRect(-r * 0.04, r * 0.26, r * 0.08, r * 0.08);
        } else {
            // Back V-cinch belt & crossed rifle strap
            ctx.fillStyle = '#2d3436';
            ctx.fillRect(-r * 0.40, r * 0.06, r * 0.80, r * 0.12);
            ctx.strokeStyle = '#8e5a2b';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-r * 0.36, -r * 0.34);
            ctx.lineTo(r * 0.34, r * 0.34);
            ctx.stroke();
        }
        ctx.strokeStyle = '#141418';
        ctx.lineWidth = 2.6;
    }

    static drawMarksmanHead(ctx, r, age, isBack, isAiming, flash) {
        ctx.save();
        ctx.translate(0, -r * 0.58);

        // Ears + Sleek Head
        ctx.fillStyle = flash ? '#ffffff' : '#f5cd79';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Dark Slicked Hair (covers back if facing north)
        ctx.fillStyle = flash ? '#ffffff' : '#1e272e';
        ctx.beginPath();
        if (isBack) {
            ctx.arc(0, 0, r * 0.37, 0, Math.PI * 2);
        } else {
            ctx.arc(0, -r * 0.10, r * 0.37, Math.PI * 0.94, Math.PI * 2.06);
        }
        ctx.fill();
        ctx.stroke();

        if (!flash && !isBack) {
            // Polarized Shades + Glowing Crimson Laser Scope Eye
            ctx.fillStyle = '#141418';
            ctx.beginPath();
            ctx.roundRect(-r * 0.28, -r * 0.12, r * 0.26, r * 0.16, 4);
            ctx.roundRect(r * 0.04, -r * 0.12, r * 0.26, r * 0.16, 4);
            ctx.fill();
            ctx.fillRect(-r * 0.04, -r * 0.08, r * 0.10, r * 0.05);

            // Cyber Sniper Lens on aiming eye
            const pulse = isAiming ? (0.85 + Math.sin(age * 0.55) * 0.25) : 0.85;
            ctx.fillStyle = '#ff4757';
            ctx.beginPath();
            ctx.arc(r * 0.17, -r * 0.04, r * 0.085 * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(r * 0.19, -r * 0.06, r * 0.028, 0, Math.PI * 2);
            ctx.fill();

            // Thin Rebetis Pencil Mustache & Pointed Goatee
            ctx.strokeStyle = '#1e272e';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(-r * 0.14, r * 0.12);
            ctx.quadraticCurveTo(r * 0.04, r * 0.06, r * 0.22, r * 0.12);
            ctx.stroke();

            ctx.fillStyle = '#1e272e';
            ctx.fillRect(r * 0.01, r * 0.21, r * 0.09, r * 0.09);
        }

        // Sharp Rebetiko Fedora with Plum & Gold Satin Band
        ctx.strokeStyle = '#141418';
        ctx.lineWidth = 2.4;
        ctx.fillStyle = flash ? '#ffffff' : '#2f3640';
        ctx.beginPath();
        ctx.roundRect(-r * 0.30, -r * 0.46, r * 0.60, r * 0.28, 6);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(0, -r * 0.22, r * 0.52, r * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            ctx.fillStyle = '#5f27cd';
            ctx.fillRect(-r * 0.29, -r * 0.29, r * 0.58, r * 0.08);
            ctx.fillStyle = '#fed330';
            ctx.fillRect(r * 0.12, -r * 0.34, r * 0.12, r * 0.10);
        }
        ctx.restore();
    }

    static drawBouzoukiRifle(ctx, r, age, isAiming, flash) {
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = '#141418';

        // Pear-Shaped Striped Greek Bouzouki Soundbox
        ctx.fillStyle = flash ? '#ffffff' : '#8e5a2b';
        ctx.beginPath();
        ctx.ellipse(r * 0.28, 0, r * 0.44, r * 0.31, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            // Alternating Stave Ribs + Tortoiseshell Pickguard + Soundhole
            ctx.strokeStyle = '#5c3317';
            ctx.lineWidth = 1.8;
            for (const sy of [-r * 0.15, 0, r * 0.15]) {
                ctx.beginPath();
                ctx.moveTo(-r * 0.06, sy);
                ctx.lineTo(r * 0.62, sy);
                ctx.stroke();
            }

            ctx.fillStyle = '#1e272e';
            ctx.beginPath();
            ctx.ellipse(r * 0.38, r * 0.12, r * 0.14, r * 0.10, -0.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffd32a';
            ctx.strokeStyle = '#141418';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(r * 0.38, 0, r * 0.135, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#141418';
            ctx.beginPath();
            ctx.arc(r * 0.38, 0, r * 0.085, 0, Math.PI * 2);
            ctx.fill();
        }

        // Extended Fretted Sniper Neck + Tuning Headstock + Suppressor Tip
        ctx.strokeStyle = '#141418';
        ctx.lineWidth = 2.2;
        ctx.fillStyle = flash ? '#ffffff' : '#4a2b13';
        ctx.beginPath();
        ctx.roundRect(r * 0.64, -r * 0.08, r * 0.96, r * 0.16, 3);
        ctx.fill();
        ctx.stroke();

        // Mounted Sniper Optical Scope on top of neck bridge
        ctx.fillStyle = flash ? '#ffffff' : '#2f3640';
        ctx.beginPath();
        ctx.roundRect(r * 0.40, -r * 0.34, r * 0.50, r * 0.14, 4);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            ctx.fillStyle = isAiming ? '#ff4757' : '#00d2d3';
            ctx.fillRect(r * 0.84, -r * 0.32, r * 0.06, r * 0.10);

            // Nickel Frets along neck
            ctx.fillStyle = '#dfe6e9';
            for (let fx = r * 0.78; fx < r * 1.44; fx += r * 0.18) {
                ctx.fillRect(fx, -r * 0.07, r * 0.035, r * 0.14);
            }

            // Gold Muzzle Compensator & Laser Dot
            ctx.fillStyle = '#fed330';
            ctx.fillRect(r * 1.50, -r * 0.11, r * 0.15, r * 0.22);
            ctx.strokeRect(r * 1.50, -r * 0.11, r * 0.15, r * 0.22);

            if (isAiming) {
                ctx.fillStyle = '#ff4757';
                ctx.beginPath();
                ctx.arc(r * 1.68, 0, r * 0.07, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Gloved Trigger Pluck Hand on Bouzouki Body
        ctx.fillStyle = flash ? '#ffffff' : '#f5cd79';
        ctx.beginPath();
        ctx.arc(r * 0.16, r * 0.14, r * 0.10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}

if (typeof window !== 'undefined') {
    window.BouzoukiSniperRenderer = BouzoukiSniperRenderer;
}
