/**
 * Lesa.io - Mount Olympus Ice Enemies 2.5D Vector Renderer
 * Remakes FrostWolf and IceGolem with layered limbs, crystal facets,
 * attack windup animations, and crisp comic shading.
 */

class OlympusIceRenderer {
    static drawCrystal(ctx, pts, fill, stroke, flash) {
        ctx.fillStyle = flash ? '#ffffff' : fill;
        ctx.strokeStyle = stroke || '#0d2b45';
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    static drawFrostWolf(wolf, ctx) {
        const r = wolf.radius || 24;
        const flash = wolf.hitFlash > 0;
        const facingLeft = Math.cos(wolf.angle || 0) < 0;
        const stride = Math.sin(wolf.walkCycle || 0);
        const bob = wolf.isLunging ? -4 : Math.abs(stride) * -2.2;

        // Ground shadow
        if (typeof EnemyBatchRenderer === 'undefined' || !EnemyBatchRenderer.active) {
            ctx.fillStyle = 'rgba(10, 22, 38, 0.36)';
            ctx.beginPath();
            ctx.ellipse(wolf.x, wolf.y + r * 0.72, r * 1.08, r * 0.36, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        if (!wolf.isLunging && typeof SpriteAtlasCache !== 'undefined') {
            const bins = SpriteAtlasCache.getWalkBins(8);
            const rKey = Math.round(r * 2);
            const walkBin = SpriteAtlasCache.quantizePhase(wolf.walkCycle || 0, bins);
            const qStride = Math.sin(SpriteAtlasCache.binAngle(walkBin, bins));
            const qAge = SpriteAtlasCache.binAngle(walkBin, bins) / 0.14;
            const key = `frost_wolf_b:${rKey}:${walkBin}:${flash ? 1 : 0}`;
            const bw = Math.ceil(r * 4.2);
            const bh = Math.ceil(r * 3.6);
            SpriteAtlasCache.drawCachedAt(ctx, wolf.x, wolf.y + bob, key, bw, bh, bw * 0.5, bh * 0.5, (bctx) => {
                this._drawFrostWolfModel(bctx, r, qStride, qAge, flash);
            }, { flipX: facingLeft });
            return;
        }

        ctx.save();
        ctx.translate(wolf.x, wolf.y);

        // Lunge speed blur trail
        if (wolf.isLunging) {
            ctx.strokeStyle = 'rgba(116, 185, 255, 0.65)';
            ctx.lineWidth = 2.6;
            for (let s = -1; s <= 1; s++) {
                ctx.beginPath();
                ctx.moveTo(facingLeft ? 14 : -14, s * 7 - 2);
                ctx.lineTo(facingLeft ? 34 : -34, s * 7 - 2);
                ctx.stroke();
            }
        }

        ctx.translate(0, bob);
        if (facingLeft) ctx.scale(-1, 1);
        if (wolf.isLunging) ctx.rotate(0.14);
        this._drawFrostWolfModel(ctx, r, stride, wolf.age || 0, flash);
        ctx.restore();
    }

    static _drawFrostWolfModel(ctx, r, stride, ageVal, flash) {

        const coat = flash ? '#ffffff' : '#dfe6e9';
        const coatDark = flash ? '#ffffff' : '#8da2b5';
        const frost = flash ? '#ffffff' : '#74b9ff';
        const iceTip = flash ? '#ffffff' : '#00d2d3';
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = '#141e28';

        // 1. Far legs
        const drawPawLeg = (lx, ly, rot, color) => {
            ctx.save();
            ctx.translate(lx, ly);
            ctx.rotate(rot);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(-3.5, 0, 7, r * 0.56, 3);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = flash ? '#ffffff' : '#2d3436';
            ctx.beginPath();
            ctx.ellipse(2, r * 0.54, 4.5, 2.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        };
        drawPawLeg(-r * 0.48, r * 0.12, -stride * 0.45, coatDark);
        drawPawLeg(r * 0.25, r * 0.1, stride * 0.45, coatDark);

        // 2. Bushy frost-tipped wolf tail
        ctx.save();
        ctx.translate(-r * 0.72, -r * 0.08);
        ctx.rotate(-0.35 + Math.sin(ageVal * 0.14) * 0.2);
        this.drawCrystal(ctx, [[0, 0], [-14, -10], [-22, -4], [-13, 5]], coat, '#141e28', flash);
        this.drawCrystal(ctx, [[-14, -7], [-24, -5], [-16, 2]], frost, '#0d2b45', flash);
        ctx.restore();

        // 3. Muscular wolf body + pale belly
        ctx.fillStyle = coat;
        ctx.beginPath();
        ctx.ellipse(-r * 0.08, 0, r * 0.76, r * 0.44, -0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            ctx.fillStyle = '#f5f9fc';
            ctx.beginPath();
            ctx.ellipse(-r * 0.04, r * 0.18, r * 0.52, r * 0.18, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // 4. Dorsal ice-shard ridge & spiky neck ruff
        this.drawCrystal(ctx, [[-12, -9], [-7, -20], [0, -10]], frost, '#141e28', flash);
        this.drawCrystal(ctx, [[-2, -11], [5, -22], [10, -10]], iceTip, '#141e28', flash);
        this.drawCrystal(ctx, [[6, -12], [16, -18], [18, -3], [6, 4]], coat, '#141e28', flash);

        // 5. Near legs
        drawPawLeg(-r * 0.34, r * 0.14, stride * 0.45, coat);
        drawPawLeg(r * 0.38, r * 0.12, -stride * 0.45, coat);

        // 6. Snarling wolf head, ears & fangs
        ctx.save();
        ctx.translate(r * 0.54, -r * 0.28);

        // Far & near pointed ears
        this.drawCrystal(ctx, [[-4, -6], [-9, -18], [1, -9]], coatDark, '#141e28', flash);
        this.drawCrystal(ctx, [[0, -6], [-2, -20], [7, -9]], coat, '#141e28', flash);
        if (!flash) {
            this.drawCrystal(ctx, [[0, -8], [-1, -16], [4, -10]], '#74b9ff', '#0d2b45', false);
        }

        // Skull & snarling snout
        ctx.fillStyle = coat;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 8.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = coatDark;
        ctx.beginPath();
        ctx.roundRect(4, -3.5, 13, 7.5, 3);
        ctx.fill();
        ctx.stroke();

        // Fangs & black nose tip
        if (!flash) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(9, 4); ctx.lineTo(11, 7.5); ctx.lineTo(13, 4);
            ctx.moveTo(13, 4); ctx.lineTo(15, 7); ctx.lineTo(16.5, 4);
            ctx.fill();

            ctx.fillStyle = '#11161d';
            ctx.beginPath();
            ctx.arc(16.5, -1, 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Glowing predator eye + fierce brow
            ctx.fillStyle = '#00f5ff';
            if (typeof MobilePerf === 'undefined' || MobilePerf.shouldUseGlows()) {
                ctx.shadowColor = '#00d2d3';
                ctx.shadowBlur = 6;
            }
            ctx.beginPath();
            ctx.ellipse(4, -2.5, 2.6, 1.8, -0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.strokeStyle = '#141e28';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -5.5);
            ctx.lineTo(7, -3.5);
            ctx.stroke();
        }
        ctx.restore();
    }

    static drawIceGolem(golem, ctx) {
        const r = golem.radius || 34;
        const flash = golem.hitFlash > 0;
        const facingLeft = Math.cos(golem.angle || 0) < 0;
        const stride = Math.sin(golem.walkCycle || 0);
        const slamRatio = golem.isSlamming ? Math.max(0, Math.min(1, 1 - (golem.slamTimer / 35))) : 0;
        const bob = golem.isSlamming ? -Math.sin(slamRatio * Math.PI) * 6 : Math.abs(stride) * -2.5;

        // Ground shadow
        if (typeof EnemyBatchRenderer === 'undefined' || !EnemyBatchRenderer.active) {
            ctx.fillStyle = 'rgba(8, 20, 36, 0.42)';
            ctx.beginPath();
            ctx.ellipse(golem.x, golem.y + r * 0.92, r * 1.15, r * 0.42, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        if (!golem.isSlamming && typeof SpriteAtlasCache !== 'undefined') {
            const bins = SpriteAtlasCache.getWalkBins(8);
            const rKey = Math.round(r * 2);
            const walkBin = SpriteAtlasCache.quantizePhase(golem.walkCycle || 0, bins);
            const qStride = Math.sin(SpriteAtlasCache.binAngle(walkBin, bins));
            const qAge = SpriteAtlasCache.binAngle(walkBin, bins) / 0.04;
            const key = `ice_golem_b:${rKey}:${walkBin}:${flash ? 1 : 0}`;
            const bw = Math.ceil(r * 3.8);
            const bh = Math.ceil(r * 3.8);
            SpriteAtlasCache.drawCachedAt(ctx, golem.x, golem.y + bob, key, bw, bh, bw * 0.5, bh * 0.52, (bctx) => {
                this._drawIceGolemModel(bctx, r, qStride, false, 0, qAge, flash);
            }, { flipX: facingLeft });
            return;
        }

        ctx.save();
        ctx.translate(golem.x, golem.y);

        // Slam windup cryo telegraph ring
        if (golem.isSlamming) {
            ctx.save();
            ctx.strokeStyle = 'rgba(0, 236, 236, 0.85)';
            ctx.fillStyle = 'rgba(0, 206, 201, 0.18)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(0, r * 0.72, (r + 18) * (0.65 + slamRatio * 0.4), (r + 18) * 0.42, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        ctx.translate(0, bob);
        if (facingLeft) ctx.scale(-1, 1);
        this._drawIceGolemModel(ctx, r, stride, golem.isSlamming, slamRatio, golem.age || 0, flash);
        ctx.restore();
    }

    static _drawIceGolemModel(ctx, r, stride, isSlamming, slamRatio, ageVal, flash) {

        const rock = flash ? '#ffffff' : '#4a607a';
        const rockDark = flash ? '#ffffff' : '#2d3c4e';
        const ice = flash ? '#ffffff' : '#00cec9';
        const iceBright = flash ? '#ffffff' : '#81ecec';
        ctx.lineWidth = 2.8;
        ctx.strokeStyle = '#111a24';

        // 1. Heavy Pillar Legs
        const drawPillarLeg = (lx, swingRot, col) => {
            ctx.save();
            ctx.translate(lx, r * 0.34);
            ctx.rotate(swingRot);
            this.drawCrystal(ctx, [[-8, -2], [8, -2], [10, r * 0.56], [-10, r * 0.56]], col, '#111a24', flash);
            this.drawCrystal(ctx, [[-11, r * 0.42], [11, r * 0.42], [12, r * 0.6], [-12, r * 0.6]], ice, '#0d3b4c', flash);
            ctx.restore();
        };
        drawPillarLeg(-r * 0.36, -stride * 0.25, rockDark);
        drawPillarLeg(r * 0.32, stride * 0.25, rock);

        // 2. Jagged Ice Spires behind shoulders
        this.drawCrystal(ctx, [[-r * 0.72, -r * 0.15], [-r * 0.92, -r * 0.98], [-r * 0.35, -r * 0.55]], ice, '#0d3b4c', flash);
        this.drawCrystal(ctx, [[r * 0.42, -r * 0.55], [r * 0.88, -r * 0.95], [r * 0.72, -r * 0.15]], iceBright, '#0d3b4c', flash);

        // 3. Far Craggy Arm (lifts during slam windup)
        const armRaise = isSlamming ? (-1.2 * Math.sin(slamRatio * Math.PI * 0.65)) : (-stride * 0.25);
        ctx.save();
        ctx.translate(-r * 0.72, -r * 0.26);
        ctx.rotate(armRaise);
        this.drawCrystal(ctx, [[-7, -4], [7, -4], [10, r * 0.72], [-9, r * 0.72]], rockDark, '#111a24', flash);
        this.drawCrystal(ctx, [[-11, r * 0.58], [11, r * 0.58], [8, r * 0.86], [-8, r * 0.86]], ice, '#0d3b4c', flash);
        ctx.restore();

        // 4. Broad Faceted Glacier Torso
        this.drawCrystal(ctx, [
            [-r * 0.84, -r * 0.44],
            [0, -r * 0.62],
            [r * 0.84, -r * 0.44],
            [r * 0.62, r * 0.44],
            [0, r * 0.54],
            [-r * 0.62, r * 0.44]
        ], rock, '#111a24', flash);

        if (!flash) {
            // Facet shadow plate & frost fissures
            this.drawCrystal(ctx, [[-r * 0.74, -r * 0.38], [0, -r * 0.5], [0, r * 0.44], [-r * 0.54, r * 0.36]], rockDark, 'rgba(0,0,0,0.2)', false);
            ctx.strokeStyle = '#00f5ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -r * 0.08); ctx.lineTo(-r * 0.42, -r * 0.32);
            ctx.moveTo(0, -r * 0.08); ctx.lineTo(r * 0.45, -r * 0.28);
            ctx.moveTo(0, -r * 0.08); ctx.lineTo(-r * 0.26, r * 0.34);
            ctx.stroke();

            // Rotating Glowing Cryo Core in chest
            ctx.save();
            ctx.translate(0, -r * 0.08);
            ctx.rotate(ageVal * 0.04);
            if (typeof MobilePerf === 'undefined' || MobilePerf.shouldUseGlows()) {
                ctx.shadowColor = '#00f5ff';
                ctx.shadowBlur = 10;
            }
            this.drawCrystal(ctx, [[0, -10], [9, 0], [0, 10], [-9, 0]], '#81ecec', '#00a8ff', false);
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // 5. Crystal Head & Glowing Visor Eyes
        ctx.save();
        ctx.translate(0, -r * 0.68);
        this.drawCrystal(ctx, [[-14, 4], [-16, -12], [-5, -20], [5, -20], [16, -12], [14, 4], [0, 10]], rock, '#111a24', flash);
        this.drawCrystal(ctx, [[-7, -17], [0, -29], [7, -17]], iceBright, '#0d3b4c', flash);
        if (!flash) {
            ctx.fillStyle = '#0c1824';
            ctx.fillRect(-10, -8, 22, 6);
            ctx.fillStyle = '#00f5ff';
            if (typeof MobilePerf === 'undefined' || MobilePerf.shouldUseGlows()) {
                ctx.shadowColor = '#00f5ff';
                ctx.shadowBlur = 7;
            }
            ctx.beginPath();
            ctx.arc(-3, -5, 2.8, 0, Math.PI * 2);
            ctx.arc(7, -5, 2.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        ctx.restore();

        // 6. Near Massive Gauntlet Fist (raises overhead during slam!)
        ctx.save();
        ctx.translate(r * 0.74, -r * 0.24);
        ctx.rotate(isSlamming ? (-1.35 * Math.sin(slamRatio * Math.PI * 0.65)) : (stride * 0.28));
        this.drawCrystal(ctx, [[-8, -4], [9, -4], [12, r * 0.74], [-9, r * 0.74]], rock, '#111a24', flash);
        this.drawCrystal(ctx, [[-12, r * 0.56], [13, r * 0.56], [10, r * 0.9], [-10, r * 0.9]], iceBright, '#0d3b4c', flash);
        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.OlympusIceRenderer = OlympusIceRenderer;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OlympusIceRenderer };
}
