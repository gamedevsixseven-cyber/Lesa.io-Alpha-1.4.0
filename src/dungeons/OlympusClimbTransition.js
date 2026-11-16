/**
 * Lesa.io - Mount Olympus Floor-to-Floor Climb Transition Renderer
 * Renders an atmospheric multi-layered mountain ascent screen between floors
 * featuring parallax peaks, a distant sunlit Parthenon silhouette, volumetric clouds,
 * an animated altitude odometer, an elevation spine track, and guardian/chest briefings.
 */

const CLIMB_FLOOR_PALETTES = {
    2: {
        skyTop: '#071726', skyMid: '#123347', skyBot: '#1f5361',
        accent: '#38bdf8', badgeBg: '#0c4a6e',
        ridges: ['#0c2233', '#13344a', '#1b4861']
    },
    3: {
        skyTop: '#071124', skyMid: '#122c54', skyBot: '#24548a',
        accent: '#67e8f9', badgeBg: '#164e63',
        ridges: ['#0b1e3b', '#14335e', '#1f4980']
    },
    4: {
        skyTop: '#100a26', skyMid: '#261b54', skyBot: '#4a2e70',
        accent: '#f59e0b', badgeBg: '#4c1d95',
        ridges: ['#19123d', '#2b1f5c', '#3e2d78']
    },
    5: {
        skyTop: '#120821', skyMid: '#2a1654', skyBot: '#693d1c',
        accent: '#fde047', badgeBg: '#78350f',
        ridges: ['#1d103b', '#331d5c', '#4d3069']
    }
};

const CLIMB_MILESTONES = [
    { floor: 5, label: 'F5 Summit', meters: '2,918m', frac: 1.0 },
    { floor: 4, label: 'F4 Clouds', meters: '2,600m', frac: 0.85 },
    { floor: 3, label: 'F3 Prionia', meters: '2,100m', frac: 0.65 },
    { floor: 2, label: 'F2 Ravine', meters: '1,100m', frac: 0.34 },
    { floor: 1, label: 'F1 Trail', meters: '300m', frac: 0.08 }
];

class OlympusClimbTransition {
    static draw(ctx, width, height, system) {
        if (!system) return;
        const rawT = 1 - Math.max(0, Math.min(1, system.climbAnimTimer / (system.climbAnimMax || 120)));
        const fadeIn = Math.min(1, rawT / 0.14);
        const fadeOut = Math.min(1, (1 - rawT) / 0.14);
        const alpha = Math.max(0, Math.min(1, Math.min(fadeIn, fadeOut)));
        if (alpha <= 0.01) return;

        const easedT = rawT * rawT * (3 - 2 * rawT);
        const nextFloor = Math.max(2, Math.min(5, system.nextFloorPending || 2));
        const prevFloor = Math.max(1, nextFloor - 1);
        const pal = CLIMB_FLOOR_PALETTES[nextFloor] || CLIMB_FLOOR_PALETTES[2];

        const curMeters = Math.round(system.fromElevation + (system.toElevation - system.fromElevation) * easedT);
        const gainedMeters = Math.max(0, Math.round(system.toElevation - system.fromElevation));

        const layoutCfg = (typeof OlympusLayouts !== 'undefined')
            ? OlympusLayouts.getFloorConfig(nextFloor)
            : { name: `Floor ${nextFloor}`, subtitle: '' };
        const floorData = (typeof OLYMPUS_FLOORS !== 'undefined' && Array.isArray(OLYMPUS_FLOORS))
            ? (OLYMPUS_FLOORS[nextFloor - 1] || {})
            : {};

        ctx.save();
        ctx.globalAlpha = alpha;

        this._drawSkyAndParthenon(ctx, width, height, rawT, easedT, pal, nextFloor);
        this._drawParallaxMountainRidges(ctx, width, height, rawT, pal, nextFloor);
        this._drawSpeedStreaksAndClouds(ctx, width, height, rawT, pal, nextFloor);

        // Centered, resolution-independent stage for Monument Plaque + Elevation Rail
        const scale = Math.min(1, (width - 32) / 760, (height - 32) / 480);
        ctx.save();
        ctx.translate(width / 2, height / 2 + (1 - fadeIn) * 26);
        ctx.scale(scale, scale);

        this._drawMonumentCard(ctx, {
            prevFloor, nextFloor, curMeters, gainedMeters, easedT,
            pal, layoutCfg, floorData,
            boonCount: Array.isArray(system.activeBlessings) ? system.activeBlessings.length : 0
        });
        this._drawElevationSpine(ctx, prevFloor, nextFloor, easedT, pal);

        ctx.restore();
        ctx.restore();
    }

    static _drawSkyAndParthenon(ctx, width, height, rawT, easedT, pal, nextFloor) {
        const sky = ctx.createLinearGradient(0, 0, 0, height);
        sky.addColorStop(0, pal.skyTop);
        sky.addColorStop(0.55, pal.skyMid);
        sky.addColorStop(1, pal.skyBot);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, width, height);

        // Radiant divine summit halo behind plaque
        const halo = ctx.createRadialGradient(width * 0.5, height * 0.38, 24, width * 0.5, height * 0.38, Math.max(width, height) * 0.62);
        halo.addColorStop(0, nextFloor === 5 ? 'rgba(253, 224, 71, 0.28)' : 'rgba(125, 211, 252, 0.22)');
        halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = halo;
        ctx.fillRect(0, 0, width, height);

        // Twinkling celestial stars and rising embers
        for (let i = 0; i < 34; i++) {
            const sx = ((i * 197 + 53) % 1000) / 1000 * width;
            const sy = (((i * 263 + 17) % 1000) / 1000 * height * 0.72 + rawT * 90) % (height * 0.78);
            const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(rawT * Math.PI * 5 + i * 1.3));
            const r = (i % 5 === 0) ? 2.4 : 1.4;
            ctx.fillStyle = (i % 4 === 0 && nextFloor >= 4)
                ? `rgba(253, 224, 71, ${twinkle * 0.75})`
                : `rgba(241, 245, 249, ${twinkle * 0.75})`;
            ctx.beginPath();
            ctx.arc(sx, sy, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Distant Olympus Spire Peak + Parthenon silhouette visible clearly to upper-left of plaque
        const templeX = width * 0.13;
        const templeY = height * 0.44 + easedT * 26;
        ctx.save();
        ctx.translate(templeX, templeY);
        // Spire crag supporting the summit sanctuary
        ctx.fillStyle = pal.ridges[1];
        ctx.beginPath();
        ctx.moveTo(-140, 260);
        ctx.lineTo(-82, 22);
        ctx.lineTo(82, 22);
        ctx.lineTo(155, 260);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = nextFloor === 5 ? 'rgba(253, 224, 71, 0.30)' : 'rgba(226, 232, 240, 0.20)';
        // Stepped marble platform
        ctx.fillRect(-76, 20, 152, 7);
        ctx.fillRect(-68, 14, 136, 6);
        // 5 Doric columns
        for (let c = -2; c <= 2; c++) {
            ctx.fillRect(c * 26 - 5, -16, 10, 30);
        }
        // Architrave + triangular pediment
        ctx.fillRect(-72, -23, 144, 7);
        ctx.beginPath();
        ctx.moveTo(-80, -23);
        ctx.lineTo(0, -48);
        ctx.lineTo(80, -23);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    static _drawParallaxMountainRidges(ctx, width, height, rawT, pal, nextFloor) {
        const layerSpeeds = [35, 70, 120];
        const baseFracs = [0.64, 0.74, 0.86];

        for (let layer = 0; layer < 3; layer++) {
            const scrollY = rawT * layerSpeeds[layer];
            const baseY = height * baseFracs[layer] + scrollY;
            ctx.fillStyle = pal.ridges[layer];
            ctx.beginPath();
            ctx.moveTo(0, height + 60);

            const segments = 8;
            for (let s = 0; s <= segments; s++) {
                const px = (s / segments) * width;
                const peak = Math.sin(s * 1.45 + layer * 2.1) * (42 + layer * 16)
                    + Math.cos(s * 2.6 + layer) * 18;
                ctx.lineTo(px, baseY - Math.abs(peak));
            }
            ctx.lineTo(width, height + 60);
            ctx.closePath();
            ctx.fill();

            if (nextFloor >= 3 && layer > 0) {
                ctx.strokeStyle = nextFloor === 5 ? 'rgba(253, 224, 71, 0.22)' : 'rgba(224, 242, 254, 0.22)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
    }

    static _drawSpeedStreaksAndClouds(ctx, width, height, rawT, pal, nextFloor) {
        // Vertical rushing wind streaks conveying fast upward ascent
        ctx.save();
        for (let i = 0; i < 20; i++) {
            const x = ((i * 173 + 31) % 1000) / 1000 * width;
            const len = 55 + (i % 4) * 32;
            const y = ((i * 199 + rawT * height * 3.1) % (height + 160)) - 80;
            const g = ctx.createLinearGradient(x, y - len, x, y);
            g.addColorStop(0, 'rgba(255, 255, 255, 0)');
            g.addColorStop(1, nextFloor >= 4 ? 'rgba(253, 224, 71, 0.24)' : 'rgba(186, 230, 253, 0.24)');
            ctx.strokeStyle = g;
            ctx.lineWidth = (i % 3 === 0) ? 2.5 : 1.5;
            ctx.beginPath();
            ctx.moveTo(x, y - len);
            ctx.lineTo(x, y);
            ctx.stroke();
        }

        // Branching sky lightning on Floor 4 & 5 ascents
        if (nextFloor >= 4 && Math.sin(rawT * Math.PI * 6) > 0.72) {
            ctx.strokeStyle = nextFloor === 5 ? 'rgba(254, 240, 138, 0.65)' : 'rgba(196, 181, 253, 0.55)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(width * 0.16, 0);
            ctx.lineTo(width * 0.19, height * 0.14);
            ctx.lineTo(width * 0.14, height * 0.25);
            ctx.lineTo(width * 0.18, height * 0.40);
            ctx.stroke();
        }

        // Soft drifting Olympus cloud puffs sweeping downward
        for (let i = 0; i < 11; i++) {
            const cx = ((i * 233 + 60) % (width + 120)) - 60;
            const cy = ((i * 167 + rawT * height * 2.15) % (height + 240)) - 120;
            const rx = 86 + (i % 3) * 30;
            ctx.fillStyle = i % 2 === 0 ? 'rgba(241, 245, 249, 0.16)' : 'rgba(203, 213, 225, 0.11)';
            ctx.beginPath();
            ctx.arc(cx, cy, rx, 0, Math.PI * 2);
            ctx.arc(cx + rx * 0.65, cy + 12, rx * 0.72, 0, Math.PI * 2);
            ctx.arc(cx - rx * 0.58, cy + 14, rx * 0.64, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    static _drawMonumentCard(ctx, data) {
        const {
            prevFloor, nextFloor, curMeters, gainedMeters, easedT,
            pal, layoutCfg, floorData, boonCount
        } = data;

        const cardX = -355;
        const cardY = -204;
        const cardW = 556;
        const cardH = 408;

        ctx.save();

        // Bold comic shadow behind plaque
        ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
        this._roundRectPath(ctx, cardX + 7, cardY + 10, cardW, cardH, 24);
        ctx.fill();

        // Marble cosmic plaque surface
        const bg = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
        bg.addColorStop(0, '#162442');
        bg.addColorStop(0.55, '#0e172c');
        bg.addColorStop(1, '#09101f');
        ctx.fillStyle = bg;
        this._roundRectPath(ctx, cardX, cardY, cardW, cardH, 24);
        ctx.fill();

        ctx.lineWidth = 4;
        ctx.strokeStyle = '#070b14';
        ctx.stroke();

        // Double antique gold inner bevel frame
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.68)';
        this._roundRectPath(ctx, cardX + 9, cardY + 9, cardW - 18, cardH - 18, 17);
        ctx.stroke();

        // Top Eyebrow Ribbon ("ASCENDING MOUNT OLYMPUS")
        const centerX = cardX + cardW / 2;
        const ribW = 356;
        const ribH = 38;
        const ribX = centerX - ribW / 2;
        const ribY = cardY - 19;

        const ribGrad = ctx.createLinearGradient(ribX, ribY, ribX, ribY + ribH);
        ribGrad.addColorStop(0, '#fde047');
        ribGrad.addColorStop(1, '#f59e0b');
        ctx.fillStyle = ribGrad;
        this._roundRectPath(ctx, ribX, ribY, ribW, ribH, 19);
        ctx.fill();
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#070b14';
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = '800 17px "Luckiest Guy", "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('▲  ASCENDING MOUNT OLYMPUS  ▲', centerX, ribY + ribH / 2 + 1);

        // Floor step pill ("CLIMBING STAGE X -> FLOOR Y/5")
        ctx.fillStyle = pal.badgeBg;
        this._roundRectPath(ctx, centerX - 126, cardY + 34, 252, 26, 13);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = pal.accent;
        ctx.stroke();

        ctx.fillStyle = '#e0f2fe';
        ctx.font = '800 12px "Outfit", sans-serif';
        ctx.fillText(`CLIMBING STAGE  ${prevFloor}  ➔  FLOOR ${nextFloor}/5`, centerX, cardY + 47);

        // Animated Elevation Odometer Readout
        ctx.font = '900 62px "Luckiest Guy", "Outfit", sans-serif';
        ctx.lineWidth = 7;
        ctx.strokeStyle = '#070b14';
        const meterText = `${curMeters.toLocaleString()}m`;
        ctx.strokeText(meterText, centerX, cardY + 104);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(meterText, centerX, cardY + 104);

        // Gain badge ("+800m ASCENDED")
        ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
        this._roundRectPath(ctx, centerX - 84, cardY + 142, 168, 24, 12);
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#34d399';
        ctx.stroke();
        ctx.fillStyle = '#6ee7b7';
        ctx.font = '800 12px "Outfit", sans-serif';
        ctx.fillText(`▲ +${gainedMeters.toLocaleString()}m ELEVATION`, centerX, cardY + 154);

        // Animated ascent bar track
        const barW = cardW - 96;
        const barX = centerX - barW / 2;
        const barY = cardY + 178;
        ctx.fillStyle = '#060a14';
        this._roundRectPath(ctx, barX, barY, barW, 10, 5);
        ctx.fill();
        const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        barGrad.addColorStop(0, '#38bdf8');
        barGrad.addColorStop(0.65, pal.accent);
        barGrad.addColorStop(1, '#fde047');
        ctx.fillStyle = barGrad;
        this._roundRectPath(ctx, barX + 1, barY + 1, Math.max(10, (barW - 2) * easedT), 8, 4);
        ctx.fill();

        // Destination Name + Subtitle
        ctx.fillStyle = floorData.titleColor || pal.accent;
        ctx.font = '900 26px "Luckiest Guy", "Outfit", sans-serif';
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#070b14';
        const destTitle = (layoutCfg.name || `FLOOR ${nextFloor}`).toUpperCase();
        ctx.strokeText(destTitle, centerX, cardY + 218);
        ctx.fillText(destTitle, centerX, cardY + 218);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '600 14px "Outfit", sans-serif';
        const sub = layoutCfg.subtitle || floorData.subtitle || '';
        ctx.fillText(sub, centerX, cardY + 245);

        // Bottom Briefing Cards: Left = Floor Guardian, Right = Bounty & Boons
        const subCardY = cardY + 272;
        const subCardW = 240;
        const subCardH = 112;

        // Left: Guardian Ahead
        const leftX = centerX - subCardW - 10;
        ctx.fillStyle = 'rgba(255, 71, 87, 0.13)';
        this._roundRectPath(ctx, leftX, subCardY, subCardW, subCardH, 14);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 107, 107, 0.72)';
        ctx.stroke();

        ctx.fillStyle = '#fda4af';
        ctx.font = '800 11px "Outfit", sans-serif';
        ctx.fillText('NEXT FLOOR GUARDIAN', leftX + subCardW / 2, subCardY + 22);

        ctx.fillStyle = '#ffffff';
        ctx.font = '800 15px "Luckiest Guy", "Outfit", sans-serif';
        ctx.fillText(floorData.bossName || 'FLOOR GUARDIAN', leftX + subCardW / 2, subCardY + 54, subCardW - 20);

        ctx.fillStyle = '#fecdd3';
        ctx.font = '700 12px "Outfit", sans-serif';
        ctx.fillText(floorData.bossRank || `FLOOR ${nextFloor} BOSS`, leftX + subCardW / 2, subCardY + 84, subCardW - 20);

        // Right: Ascent Bounty & Active Blessings
        const rightX = centerX + 10;
        ctx.fillStyle = 'rgba(250, 204, 21, 0.12)';
        this._roundRectPath(ctx, rightX, subCardY, subCardW, subCardH, 14);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.72)';
        ctx.stroke();

        ctx.fillStyle = '#fde68a';
        ctx.font = '800 11px "Outfit", sans-serif';
        ctx.fillText('CLEAR REWARD & BOONS', rightX + subCardW / 2, subCardY + 22);

        ctx.fillStyle = '#fde047';
        ctx.font = '800 16px "Luckiest Guy", "Outfit", sans-serif';
        ctx.fillText((floorData.chestName || 'ASCENT CHEST').toUpperCase(), rightX + subCardW / 2, subCardY + 54, subCardW - 20);

        ctx.fillStyle = boonCount > 0 ? '#7dd3fc' : '#94a3b8';
        ctx.font = '700 12px "Outfit", sans-serif';
        const boonLabel = boonCount > 0 ? `${boonCount} Divine Blessing${boonCount > 1 ? 's' : ''} Active` : 'Sanctuary Boons Active';
        ctx.fillText(boonLabel, rightX + subCardW / 2, subCardY + 84, subCardW - 20);

        ctx.restore();
    }

    static _drawElevationSpine(ctx, prevFloor, nextFloor, easedT, pal) {
        const panelX = 225;
        const panelY = -194;
        const panelW = 148;
        const panelH = 388;

        ctx.save();
        ctx.fillStyle = 'rgba(11, 18, 34, 0.90)';
        this._roundRectPath(ctx, panelX, panelY, panelW, panelH, 20);
        ctx.fill();
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#070b14';
        ctx.stroke();
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.52)';
        this._roundRectPath(ctx, panelX + 6, panelY + 6, panelW - 12, panelH - 12, 15);
        ctx.stroke();

        ctx.fillStyle = '#fde047';
        ctx.font = '800 11px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PEAK PROGRESS', panelX + panelW / 2, panelY + 26);

        const railX = panelX + 28;
        const topY = panelY + 60;
        const botY = panelY + panelH - 36;
        const span = botY - topY;

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(railX, topY);
        ctx.lineTo(railX, botY);
        ctx.stroke();

        const interpFloor = prevFloor + (nextFloor - prevFloor) * easedT;
        const curY = botY - ((interpFloor - 1) / 4) * span;

        const progGrad = ctx.createLinearGradient(0, botY, 0, curY);
        progGrad.addColorStop(0, '#10b981');
        progGrad.addColorStop(1, '#fde047');
        ctx.strokeStyle = progGrad;
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.moveTo(railX, botY);
        ctx.lineTo(railX, curY);
        ctx.stroke();

        for (const m of CLIMB_MILESTONES) {
            const ny = botY - ((m.floor - 1) / 4) * span;
            const passed = m.floor < nextFloor;
            const isTarget = m.floor === nextFloor;

            ctx.fillStyle = passed ? '#10b981' : (isTarget ? pal.accent : '#334155');
            ctx.beginPath();
            ctx.arc(railX, ny, isTarget ? 8 : 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#070b14';
            ctx.stroke();

            ctx.textAlign = 'left';
            ctx.fillStyle = isTarget ? '#ffffff' : (passed ? '#6ee7b7' : '#94a3b8');
            ctx.font = isTarget ? '800 12px "Outfit", sans-serif' : '700 11px "Outfit", sans-serif';
            ctx.fillText(m.label, railX + 16, ny - 6);
            ctx.fillStyle = isTarget ? '#fde047' : '#64748b';
            ctx.font = '700 10px "Outfit", sans-serif';
            ctx.fillText(m.meters, railX + 16, ny + 8);
        }

        // Animated Climber Beacon Marker moving smoothly up the spine
        ctx.fillStyle = '#fde047';
        ctx.strokeStyle = '#070b14';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(railX, curY - 9);
        ctx.lineTo(railX + 8, curY + 5);
        ctx.lineTo(railX - 8, curY + 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    static _roundRectPath(ctx, x, y, w, h, r) {
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y, w, h, r);
        } else {
            ctx.rect(x, y, w, h);
        }
    }
}

if (typeof window !== 'undefined') {
    window.OlympusClimbTransition = OlympusClimbTransition;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OlympusClimbTransition };
}
