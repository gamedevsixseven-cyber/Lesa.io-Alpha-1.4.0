/**
 * Lesa.io - Endless Progressive Enemy 2.5D Renderer: OuzoBomber
 * Manic Greek street pyromaniac in a bright tangerine summer shirt,
 * leather bottle bandolier packed with frosted ouzo flasks, knotted crimson
 * bandana headband, sparking lighter off-hand, and a lit Molotov Ouzo bottle.
 */

class OuzoBomberRenderer {
    static draw(ctx, e) {
        OuzoBomberRenderer.drawFireZones(ctx, e.fireZones, e.age || 0);

        const r = e.radius || 25;
        const flash = e.hitFlash > 0;
        const age = e.age || 0;
        const aimAngle = e.angle || 0;
        const facingLeft = Math.cos(aimAngle) < 0;
        const isBack = Math.sin(aimAngle) < -0.68;
        const bob = Math.sin(e.walkCycle || age * 0.18) * 3;

        ctx.save();
        EndlessEnemyRenderer.drawShadow(ctx, e.x, e.y, r, 0.98, 0.38);
        ctx.translate(e.x, e.y + bob);

        if (typeof SpriteAtlasCache !== 'undefined') {
            const rKey = Math.round(r * 2);
            const walkBin = SpriteAtlasCache.quantizePhase(e.walkCycle || age * 0.18, 8);
            const qCycle = SpriteAtlasCache.binAngle(walkBin, 8);
            const bandBin = walkBin >> 1;
            const qBandAge = SpriteAtlasCache.binAngle(bandBin, 4) / 0.22;
            const bodyKey = `ouzo_b:${rKey}:${walkBin}:${isBack ? 1 : 0}:${flash ? 1 : 0}`;
            const bw = Math.ceil(r * 3.8);
            const bh = Math.ceil(r * 3.8);

            SpriteAtlasCache.drawCached(ctx, bodyKey, bw, bh, bw * 0.5, bh * 0.5, (bctx) => {
                bctx.lineWidth = 2.6;
                bctx.strokeStyle = '#141418';
                EndlessEnemyRenderer.drawLimbs(bctx, r, qCycle, '#222f3e', '#d63031', flash);
                OuzoBomberRenderer.drawBandolierJacket(bctx, r, isBack, flash);
                OuzoBomberRenderer.drawPyroHead(bctx, r, qBandAge, isBack, flash);
            }, { flipX: facingLeft });

            const flickBin = SpriteAtlasCache.quantizePhase(age * 0.35, 4);
            const qFlickAge = SpriteAtlasCache.binAngle(flickBin, 4) / 0.35;
            const lighterKey = `ouzo_l:${rKey}:${flickBin}:${flash ? 1 : 0}`;
            const lw = Math.ceil(r * 3.4);
            SpriteAtlasCache.drawCached(ctx, lighterKey, lw, lw, lw * 0.5, lw * 0.5, (lctx) => {
                lctx.lineWidth = 2.6;
                lctx.strokeStyle = '#141418';
                OuzoBomberRenderer.drawLighterOffHand(lctx, r, qFlickAge, flash);
            }, { flipX: facingLeft });

            const anchorX = facingLeft ? -r * 0.22 : r * 0.22;
            const lobSwing = Math.sin(age * 0.18) * 0.24;
            EndlessEnemyRenderer.drawAimedLayer(ctx, aimAngle + lobSwing, anchorX, r * 0.02, () => {
                const bottleKey = `ouzo_m:${rKey}:${flickBin}:${flash ? 1 : 0}`;
                const mw = Math.ceil(r * 3.2);
                const mh = Math.ceil(r * 3.2);
                SpriteAtlasCache.drawCached(ctx, bottleKey, mw, mh, mw * 0.5, mh * 0.5, (mctx) => {
                    mctx.lineWidth = 2.6;
                    mctx.strokeStyle = '#141418';
                    OuzoBomberRenderer.drawLitOuzoBottle(mctx, r, qFlickAge, flash);
                });
            });
        } else {
            ctx.lineWidth = 2.6;
            ctx.strokeStyle = '#141418';

            // Character Body Layer
            ctx.save();
            if (facingLeft) ctx.scale(-1, 1);

            EndlessEnemyRenderer.drawLimbs(ctx, r, e.walkCycle || age * 0.18, '#222f3e', '#d63031', flash);
            OuzoBomberRenderer.drawLighterOffHand(ctx, r, age, flash);
            OuzoBomberRenderer.drawBandolierJacket(ctx, r, isBack, flash);
            OuzoBomberRenderer.drawPyroHead(ctx, r, age, isBack, flash);
            ctx.restore();

            // Aimed Swinging Molotov Ouzo Bottle
            const anchorX = facingLeft ? -r * 0.22 : r * 0.22;
            const lobSwing = Math.sin(age * 0.18) * 0.24;
            EndlessEnemyRenderer.drawAimedLayer(ctx, aimAngle + lobSwing, anchorX, r * 0.02, () => {
                OuzoBomberRenderer.drawLitOuzoBottle(ctx, r, age, flash);
            });
        }

        ctx.restore();
        if (typeof e.drawOverheadHUD === 'function') e.drawOverheadHUD(ctx);
    }

    static drawFireZones(ctx, fireZones, age) {
        if (!Array.isArray(fireZones)) return;
        for (const z of fireZones) {
            ctx.save();
            const alpha = Math.min(1, z.life / 45);
            if (z.fuse > 0) {
                const p = Math.max(0, Math.min(1, 1 - (z.fuse / z.maxFuse)));
                ctx.strokeStyle = 'rgba(0, 245, 255, 0.90)';
                ctx.lineWidth = 2.6;
                ctx.setLineDash([8, 5]);
                ctx.beginPath();
                ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = 'rgba(255, 107, 107, 0.24)';
                ctx.beginPath();
                ctx.arc(z.x, z.y, z.radius * p, 0, Math.PI * 2);
                ctx.fill();
            } else {
                let fireDisc = OuzoBomberRenderer._fireDisc;
                if (!fireDisc) {
                    fireDisc = OuzoBomberRenderer._fireDisc = document.createElement('canvas');
                    fireDisc.width = 128;
                    fireDisc.height = 128;
                    const fctx = fireDisc.getContext('2d');
                    const g = fctx.createRadialGradient(64, 64, 4, 64, 64, 64);
                    g.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
                    g.addColorStop(0.45, 'rgba(0, 245, 255, 0.46)');
                    g.addColorStop(1, 'rgba(9, 132, 227, 0.10)');
                    fctx.fillStyle = g;
                    fctx.beginPath();
                    fctx.arc(64, 64, 64, 0, Math.PI * 2);
                    fctx.fill();
                }
                const prevAlpha = ctx.globalAlpha;
                ctx.globalAlpha = prevAlpha * alpha;
                ctx.drawImage(fireDisc, z.x - z.radius, z.y - z.radius, z.radius * 2, z.radius * 2);
                ctx.globalAlpha = prevAlpha;

                ctx.strokeStyle = `rgba(0, 210, 211, ${0.78 * alpha})`;
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
                ctx.stroke();

                // Animated flickering blue spirit flame tongues
                ctx.fillStyle = `rgba(129, 236, 236, ${0.72 * alpha})`;
                for (let i = 0; i < 4; i++) {
                    const a = age * 0.1 + (i * Math.PI * 0.5);
                    const fx = z.x + Math.cos(a) * z.radius * 0.52;
                    const fy = z.y + Math.sin(a) * z.radius * 0.52;
                    const fh = 8 + Math.sin(age * 0.4 + i) * 4;
                    ctx.beginPath();
                    ctx.moveTo(fx - 5, fy + 2);
                    ctx.lineTo(fx, fy - fh);
                    ctx.lineTo(fx + 5, fy + 2);
                    ctx.closePath();
                    ctx.fill();
                }
            }
            ctx.restore();
        }
    }

    static drawLighterOffHand(ctx, r, age, flash) {
        ctx.save();
        ctx.translate(-r * 0.62, r * 0.04);
        ctx.rotate(-0.25 + Math.sin(age * 0.22) * 0.14);

        ctx.fillStyle = flash ? '#ffffff' : '#f7d794';
        ctx.beginPath();
        ctx.roundRect(-r * 0.11, -r * 0.08, r * 0.22, r * 0.34, 5);
        ctx.fill();
        ctx.stroke();

        // Gold Brass Lighter & Flamelet Spark
        ctx.fillStyle = flash ? '#ffffff' : '#fed330';
        ctx.fillRect(-r * 0.10, -r * 0.24, r * 0.18, r * 0.20);
        ctx.strokeRect(-r * 0.10, -r * 0.24, r * 0.18, r * 0.20);

        if (!flash) {
            const flicker = 0.8 + Math.sin(age * 0.5) * 0.25;
            ctx.fillStyle = '#ff6b35';
            ctx.beginPath();
            ctx.ellipse(-r * 0.01, -r * 0.34, r * 0.09 * flicker, r * 0.13 * flicker, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff200';
            ctx.beginPath();
            ctx.arc(-r * 0.01, -r * 0.33, r * 0.045 * flicker, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    static drawBandolierJacket(ctx, r, isBack, flash) {
        // Vibrant Fiery Aegean Party Shirt
        ctx.fillStyle = flash ? '#ffffff' : '#ff6b35';
        ctx.beginPath();
        ctx.roundRect(-r * 0.54, -r * 0.38, r * 1.08, r * 0.78, 9);
        ctx.fill();
        ctx.stroke();

        if (flash) return;

        // Open Shirt Center Tank Undershirt (or back yoke)
        if (!isBack) {
            ctx.fillStyle = '#f5f6fa';
            ctx.fillRect(-r * 0.16, -r * 0.36, r * 0.32, r * 0.72);
        }

        // Diagonal Leather Molotov Strap packed with Ouzo Flasks
        ctx.strokeStyle = '#3d2415';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-r * 0.46, -r * 0.34);
        ctx.lineTo(r * 0.46, r * 0.34);
        ctx.stroke();

        ctx.strokeStyle = '#141418';
        ctx.lineWidth = 1.8;
        if (!isBack) {
            for (let i = 0; i < 3; i++) {
                const bx = -r * 0.26 + i * r * 0.24;
                const by = -r * 0.16 + i * r * 0.16;
                ctx.save();
                ctx.translate(bx, by);
                ctx.rotate(0.42);
                ctx.fillStyle = '#00f5ff';
                ctx.fillRect(-r * 0.065, -r * 0.12, r * 0.13, r * 0.24);
                ctx.strokeRect(-r * 0.065, -r * 0.12, r * 0.13, r * 0.24);
                ctx.fillStyle = '#f5f6fa';
                ctx.fillRect(-r * 0.045, -r * 0.17, r * 0.09, r * 0.06);
                ctx.restore();
            }
        }
        ctx.lineWidth = 2.6;
    }

    static drawPyroHead(ctx, r, age, isBack, flash) {
        ctx.save();
        ctx.translate(0, -r * 0.58);

        // Trailing Crimson Headband Tails fluttering behind
        if (!flash) {
            const wave = Math.sin(age * 0.32) * r * 0.10;
            ctx.fillStyle = '#ff4757';
            ctx.beginPath();
            ctx.moveTo(-r * 0.34, -r * 0.20);
            ctx.lineTo(-r * 0.62, -r * 0.16 + wave);
            ctx.lineTo(-r * 0.54, -r * 0.04 + wave);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        // Round Head
        ctx.fillStyle = flash ? '#ffffff' : '#f7d794';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.37, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Spiky Chaotic Dark Hair tufts above headband
        ctx.fillStyle = flash ? '#ffffff' : '#1e272e';
        ctx.beginPath();
        if (isBack) {
            ctx.arc(0, 0, r * 0.36, 0, Math.PI * 2);
        } else {
            ctx.moveTo(-r * 0.32, -r * 0.20);
            ctx.lineTo(-r * 0.22, -r * 0.50);
            ctx.lineTo(-r * 0.04, -r * 0.36);
            ctx.lineTo(r * 0.08, -r * 0.54);
            ctx.lineTo(r * 0.22, -r * 0.36);
            ctx.lineTo(r * 0.34, -r * 0.44);
            ctx.lineTo(r * 0.32, -r * 0.20);
            ctx.closePath();
        }
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            // Crimson Bandana Headband
            ctx.fillStyle = '#ff4757';
            ctx.fillRect(-r * 0.36, -r * 0.25, r * 0.72, r * 0.13);
            ctx.strokeRect(-r * 0.36, -r * 0.25, r * 0.72, r * 0.13);

            if (!isBack) {
                // Manic Wide Eyes reflecting Cyan Fire + Wild Tooth Grin
                for (const ex of [-r * 0.12, r * 0.14]) {
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(ex, -r * 0.02, r * 0.085, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();

                    ctx.fillStyle = '#00d2d3';
                    ctx.beginPath();
                    ctx.arc(ex + r * 0.015, -r * 0.02, r * 0.042, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Wide Unhinged Smile
                ctx.fillStyle = '#141418';
                ctx.beginPath();
                ctx.arc(0, r * 0.12, r * 0.18, 0, Math.PI);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-r * 0.12, r * 0.12, r * 0.24, r * 0.065);
            }
        }
        ctx.restore();
    }

    static drawLitOuzoBottle(ctx, r, age, flash) {
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = '#141418';

        // Sleek Forearm Grip holding Long-Neck Frosted Ouzo Bottle clear of jacket
        ctx.fillStyle = flash ? '#ffffff' : '#f7d794';
        ctx.beginPath();
        ctx.arc(r * 0.34, r * 0.04, r * 0.11, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Tilted Frosted Bottle Body & Long Bottleneck
        ctx.save();
        ctx.translate(r * 0.56, -r * 0.10);
        ctx.rotate(-0.34);

        ctx.fillStyle = flash ? '#ffffff' : '#dfe6e9';
        ctx.beginPath();
        ctx.roundRect(-r * 0.15, -r * 0.24, r * 0.30, r * 0.52, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#81ecec';
        ctx.beginPath();
        ctx.roundRect(-r * 0.07, -r * 0.48, r * 0.14, r * 0.28, 3);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            // Cyan Ouzo Liquid Level + Blue Traditional Label Band
            ctx.fillStyle = '#00d2d3';
            ctx.fillRect(-r * 0.13, r * 0.02, r * 0.26, r * 0.22);
            ctx.fillStyle = '#0984e3';
            ctx.fillRect(-r * 0.14, -r * 0.11, r * 0.28, r * 0.11);

            // Cloth Rag Wick & Layered Cyan-Orange Flame
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-r * 0.055, -r * 0.58, r * 0.11, r * 0.12);

            const fp = 0.90 + Math.sin(age * 0.55) * 0.26;
            ctx.fillStyle = '#ff6b35';
            ctx.beginPath();
            ctx.arc(0, -r * 0.68, r * 0.19 * fp, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#00f5ff';
            ctx.beginPath();
            ctx.arc(0, -r * 0.66, r * 0.11 * fp, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.OuzoBomberRenderer = OuzoBomberRenderer;
}
