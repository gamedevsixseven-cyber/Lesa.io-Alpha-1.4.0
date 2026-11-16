// ==================== MOUNT OLYMPUS FLOOR LAYOUTS ====================
// Handcrafted per-floor mountain geometry, bounds, terrain features, river/ice zones,
// cliffs/cloud precipices, and landmark obstacle layouts for Floors 1 to 5.

const OLYMPUS_FLOOR_CONFIGS = {
    1: {
        floor: 1,
        name: 'Olympus Foothills',
        subtitle: 'Trailhead & Olive Groves',
        elevationM: 300,
        tileKey: 'tile_foothills',
        tileTint: 'rgba(20, 35, 10, 0.06)',
        abyssColor: '#1d2d18',
        cliffOuterColor: '#4b453b',
        cliffInnerColor: '#776d5c',
        parapetColor: '#a89f8d',
        bounds: { minX: -1240, maxX: 1240, minY: -1240, maxY: 1240 },
        spawn: { x: 0, y: 740 },
        bossSpawn: { x: 0, y: -380 },
        ascentAnchor: { x: 0, y: -1060 },
        hasCloudsBelow: false
    },
    2: {
        floor: 2,
        name: 'Enipeas Ravine',
        subtitle: 'Twin Stone Bridges & Gorge',
        elevationM: 1100,
        tileKey: 'tile_foothills',
        tileTint: 'rgba(24, 38, 62, 0.24)',
        abyssColor: '#101824',
        cliffOuterColor: '#2d3748',
        cliffInnerColor: '#526075',
        parapetColor: '#8d99ae',
        bounds: { minX: -980, maxX: 980, minY: -1260, maxY: 1260 },
        spawn: { x: 0, y: 840 },
        bossSpawn: { x: 0, y: -440 },
        ascentAnchor: { x: 0, y: -1080 },
        riverYMin: -85,
        riverYMax: 85,
        bridgesX: [-450, 450],
        bridgeHalfW: 115,
        hasCloudsBelow: false
    },
    3: {
        floor: 3,
        name: 'Prionia Alpine Plateau',
        subtitle: 'Frost Timberline & Frozen Pools',
        elevationM: 2100,
        tileKey: 'tile_alpine_snow',
        tileTint: 'rgba(210, 232, 255, 0.08)',
        abyssColor: '#162436',
        cliffOuterColor: '#3a4b63',
        cliffInnerColor: '#667f9e',
        parapetColor: '#dce8f5',
        bounds: { minX: -1160, maxX: 1160, minY: -1160, maxY: 1160 },
        spawn: { x: 0, y: 760 },
        bossSpawn: { x: 0, y: -360 },
        ascentAnchor: { x: 0, y: -980 },
        icePonds: [
            { x: -520, y: 120, rx: 210, ry: 135 },
            { x: 520, y: -120, rx: 210, ry: 135 },
            { x: 0, y: -540, rx: 240, ry: 120 }
        ],
        hasCloudsBelow: true
    },
    4: {
        floor: 4,
        name: 'The Cloudline Citadel',
        subtitle: 'Sky-Bridge Above the Clouds',
        elevationM: 2600,
        tileKey: 'tile_alpine_snow',
        tileTint: 'rgba(235, 244, 255, 0.14)',
        abyssColor: '#294c78',
        cliffOuterColor: '#768ca8',
        cliffInnerColor: '#b7c8dd',
        parapetColor: '#f1f5f9',
        bounds: { minX: -1040, maxX: 1040, minY: -1200, maxY: 1200 },
        spawn: { x: 0, y: 800 },
        bossSpawn: { x: 0, y: -380 },
        ascentAnchor: { x: 0, y: -1020 },
        hasCloudsBelow: true
    },
    5: {
        floor: 5,
        name: 'Olympus Summit',
        subtitle: 'Mytikas Peak · Throne of Zeus (2,918m)',
        elevationM: 2918,
        tileKey: 'tile_summit_marble',
        tileTint: 'rgba(255, 245, 210, 0.05)',
        abyssColor: '#1f3b66',
        cliffOuterColor: '#9c834d',
        cliffInnerColor: '#e2d7bd',
        parapetColor: '#ffd166',
        bounds: { minX: -1240, maxX: 1240, minY: -1240, maxY: 1240 },
        spawn: { x: 0, y: 840 },
        bossSpawn: { x: 0, y: -340 },
        ascentAnchor: { x: 0, y: -1000 },
        hasCloudsBelow: true
    }
};

class OlympusLayouts {
    static getFloorConfig(floorNum) {
        const f = Math.max(1, Math.min(5, Math.round(floorNum || 1)));
        return OLYMPUS_FLOOR_CONFIGS[f];
    }

    static getZoneEffects(x, y, floorNum) {
        const cfg = this.getFloorConfig(floorNum);
        const res = { inRiver: false, onBridge: false, onIce: false };

        if (floorNum === 2 && cfg.riverYMin !== undefined) {
            if (y >= cfg.riverYMin && y <= cfg.riverYMax) {
                let bridged = false;
                for (const bx of cfg.bridgesX) {
                    if (Math.abs(x - bx) <= cfg.bridgeHalfW) {
                        bridged = true;
                        break;
                    }
                }
                if (bridged) res.onBridge = true;
                else res.inRiver = true;
            }
        }

        if (cfg.icePonds) {
            for (const p of cfg.icePonds) {
                const nx = (x - p.x) / p.rx;
                const ny = (y - p.y) / p.ry;
                if (nx * nx + ny * ny <= 1) {
                    res.onIce = true;
                    break;
                }
            }
        }
        return res;
    }

    static isPositionClear(x, y, radius, arena) {
        const b = (arena && arena.dungeonBounds) || this.getFloorConfig(arena && arena.dungeonFloor).bounds;
        if (x - radius < b.minX + 16 || x + radius > b.maxX - 16) return false;
        if (y - radius < b.minY + 16 || y + radius > b.maxY - 16) return false;

        if (arena && arena.obstacles) {
            for (let i = 0; i < arena.obstacles.length; i++) {
                const o = arena.obstacles[i];
                if (!o || o.dead) continue;
                const solid = (o.isSolid || o.type === 'tree' || o.type === 'crate' || o.type === 'barrel' || o.type === 'mushroom');
                if (!solid) continue;
                const dx = x - o.x;
                const dy = y - o.y;
                const minDist = radius + (o.radius || 32) + 14;
                if (dx * dx + dy * dy < minDist * minDist) return false;
            }
        }
        return true;
    }

    static findSafePosition(targetX, targetY, radius, arena) {
        if (this.isPositionClear(targetX, targetY, radius, arena)) {
            return { x: targetX, y: targetY };
        }
        const b = (arena && arena.dungeonBounds) || this.getFloorConfig(arena && arena.dungeonFloor).bounds;
        for (let ring = 45; ring <= 450; ring += 45) {
            const steps = 12;
            for (let s = 0; s < steps; s++) {
                const ang = (s / steps) * Math.PI * 2;
                const cx = Math.max(b.minX + radius + 24, Math.min(b.maxX - radius - 24, targetX + Math.cos(ang) * ring));
                const cy = Math.max(b.minY + radius + 24, Math.min(b.maxY - radius - 24, targetY + Math.sin(ang) * ring));
                if (this.isPositionClear(cx, cy, radius, arena)) {
                    return { x: cx, y: cy };
                }
            }
        }
        return { x: targetX, y: targetY };
    }

    /**
     * Render cliff precipice backdrop + terrain base + sacred roads/rivers/terraces
     * into arena.cachedGroundCanvas.
     */
    static renderGroundCanvas(gCtx, arena, floorNum) {
        const cfg = this.getFloorConfig(floorNum);
        const w = arena.width;
        const h = arena.height;
        const hw = arena.halfWidth;
        const hh = arena.halfHeight;
        const b = cfg.bounds;

        // 1. Deep gorge / sky void outside walkable bounds
        gCtx.fillStyle = cfg.abyssColor;
        gCtx.fillRect(0, 0, w, h);

        // Draw textured abyss/sky gradient for depth
        const abyssGrad = gCtx.createLinearGradient(0, 0, 0, h);
        abyssGrad.addColorStop(0, floorNum >= 4 ? '#3f6ca3' : cfg.abyssColor);
        abyssGrad.addColorStop(0.5, cfg.abyssColor);
        abyssGrad.addColorStop(1, '#0c111a');
        gCtx.fillStyle = abyssGrad;
        gCtx.fillRect(0, 0, w, h);

        // Clip inside walkable mountain plateau + draw 2.5D cliff skirt below south edge
        const bx = b.minX + hw;
        const by = b.minY + hh;
        const bw = b.maxX - b.minX;
        const bh = b.maxY - b.minY;

        // Outer 2.5D cliff drop skirt (gives height & mountain ledge silhouette)
        gCtx.fillStyle = cfg.cliffOuterColor;
        this._roundRect(gCtx, bx - 22, by - 18, bw + 44, bh + 95, 34);
        gCtx.fill();
        gCtx.fillStyle = cfg.cliffInnerColor;
        this._roundRect(gCtx, bx - 10, by - 8, bw + 20, bh + 52, 26);
        gCtx.fill();

        // Main plateau surface clipped to walkable shape
        gCtx.save();
        this._roundRect(gCtx, bx, by, bw, bh, 22);
        gCtx.clip();

        let usedTex = false;
        if (typeof OlympusAssets !== 'undefined') {
            usedTex = OlympusAssets.fillTiledGround(gCtx, cfg.tileKey, w, h, 0.65, cfg.tileTint);
        }
        if (!usedTex) {
            gCtx.fillStyle = floorNum === 5 ? '#ded8c8' : (floorNum >= 3 ? '#7c92ac' : '#4a5d3b');
            gCtx.fillRect(bx, by, bw, bh);
        }

        // Grid subtlety for distance sense
        gCtx.strokeStyle = floorNum === 5 ? 'rgba(195, 165, 95, 0.14)' : 'rgba(15, 22, 34, 0.08)';
        gCtx.lineWidth = 1.5;
        for (let gx = bx; gx <= bx + bw; gx += 140) {
            gCtx.beginPath(); gCtx.moveTo(gx, by); gCtx.lineTo(gx, by + bh); gCtx.stroke();
        }
        for (let gy = by; gy <= by + bh; gy += 140) {
            gCtx.beginPath(); gCtx.moveTo(bx, gy); gCtx.lineTo(bx + bw, gy); gCtx.stroke();
        }

        // Floor-specific architectural landmarks on ground
        gCtx.translate(hw, hh);
        this._drawFloorLandmarks(gCtx, cfg, floorNum);
        gCtx.restore();

        // Crisp carved rim / stone wall outline around plateau
        gCtx.save();
        gCtx.strokeStyle = '#181c26';
        gCtx.lineWidth = 7;
        this._roundRect(gCtx, bx, by, bw, bh, 22);
        gCtx.stroke();
        gCtx.strokeStyle = cfg.parapetColor;
        gCtx.lineWidth = 3;
        this._roundRect(gCtx, bx + 5, by + 5, bw - 10, bh - 10, 19);
        gCtx.stroke();
        gCtx.restore();
    }

    static _drawFloorLandmarks(ctx, cfg, floorNum) {
        const b = cfg.bounds;

        // Sacred north-south pilgrimage stone avenue (common motif connecting your upward climb!)
        const roadW = floorNum === 5 ? 250 : 170;
        const grad = ctx.createLinearGradient(-roadW / 2, 0, roadW / 2, 0);
        if (floorNum >= 4) {
            grad.addColorStop(0, 'rgba(220, 195, 130, 0)');
            grad.addColorStop(0.15, 'rgba(248, 240, 222, 0.86)');
            grad.addColorStop(0.85, 'rgba(248, 240, 222, 0.86)');
            grad.addColorStop(1, 'rgba(220, 195, 130, 0)');
        } else {
            grad.addColorStop(0, 'rgba(110, 100, 86, 0)');
            grad.addColorStop(0.18, 'rgba(182, 174, 158, 0.72)');
            grad.addColorStop(0.82, 'rgba(182, 174, 158, 0.72)');
            grad.addColorStop(1, 'rgba(110, 100, 86, 0)');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(-roadW / 2, b.minY + 40, roadW, b.maxY - b.minY - 80);

        // Carved flagstone joints + ascending chevrons along the mountain road
        ctx.strokeStyle = floorNum >= 4 ? 'rgba(212, 168, 67, 0.55)' : 'rgba(60, 56, 48, 0.25)';
        ctx.lineWidth = 2.5;
        for (let y = b.maxY - 120; y >= b.minY + 120; y -= 120) {
            ctx.beginPath();
            ctx.moveTo(-roadW * 0.36, y);
            ctx.lineTo(0, y - 24);
            ctx.lineTo(roadW * 0.36, y);
            ctx.stroke();
        }

        // Northern Ascent Terrace platform (where the stairway waits at the top of each floor)
        const ay = cfg.ascentAnchor.y;
        ctx.save();
        ctx.fillStyle = floorNum >= 4 ? 'rgba(255, 247, 220, 0.92)' : 'rgba(205, 198, 182, 0.85)';
        ctx.strokeStyle = floorNum === 5 ? '#d4af37' : '#2c3442';
        ctx.lineWidth = 4;
        this._roundRect(ctx, -230, ay - 95, 460, 185, 24);
        ctx.fill();
        ctx.stroke();
        // Stepped marble stair stripes leading onto the terrace from South
        for (let s = 0; s < 3; s++) {
            ctx.fillStyle = s % 2 === 0 ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.12)';
            ctx.fillRect(-160 + s * 10, ay + 65 + s * 14, 320 - s * 20, 12);
        }
        ctx.restore();

        // Floor 2: Sacred Enipeas River & Twin Arched Stone Bridges
        if (floorNum === 2 && cfg.riverYMin !== undefined) {
            const ry = cfg.riverYMin;
            const rh = cfg.riverYMax - cfg.riverYMin;
            const riverGrad = ctx.createLinearGradient(0, ry, 0, ry + rh);
            riverGrad.addColorStop(0, '#164e63');
            riverGrad.addColorStop(0.25, '#0284c7');
            riverGrad.addColorStop(0.5, '#38bdf8');
            riverGrad.addColorStop(0.75, '#0284c7');
            riverGrad.addColorStop(1, '#164e63');
            ctx.fillStyle = riverGrad;
            ctx.fillRect(b.minX, ry, b.maxX - b.minX, rh);

            // Foam shoreline banks
            ctx.strokeStyle = 'rgba(224, 242, 254, 0.72)';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(b.minX, ry + 5); ctx.lineTo(b.maxX, ry + 5);
            ctx.moveTo(b.minX, ry + rh - 5); ctx.lineTo(b.maxX, ry + rh - 5);
            ctx.stroke();

            // Draw twin sturdy stone bridges over the river
            for (const bx of cfg.bridgesX) {
                const bw = cfg.bridgeHalfW * 2;
                ctx.fillStyle = '#3e4859';
                ctx.fillRect(bx - cfg.bridgeHalfW - 10, ry - 18, bw + 20, rh + 36);
                ctx.fillStyle = '#cbd5e1';
                ctx.fillRect(bx - cfg.bridgeHalfW, ry - 14, bw, rh + 28);
                ctx.strokeStyle = '#1e293b';
                ctx.lineWidth = 4;
                ctx.strokeRect(bx - cfg.bridgeHalfW, ry - 14, bw, rh + 28);
                // Bridge parapet rails
                ctx.fillStyle = '#94a3b8';
                ctx.fillRect(bx - cfg.bridgeHalfW, ry - 14, 16, rh + 28);
                ctx.fillRect(bx + cfg.bridgeHalfW - 16, ry - 14, 16, rh + 28);
            }
        }

        // Floor 3: Frozen Alpine Ice Ponds
        if (cfg.icePonds) {
            for (const p of cfg.icePonds) {
                ctx.save();
                const iGrad = ctx.createRadialGradient(p.x - p.rx * 0.2, p.y - p.ry * 0.2, 10, p.x, p.y, Math.max(p.rx, p.ry));
                iGrad.addColorStop(0, 'rgba(224, 247, 255, 0.88)');
                iGrad.addColorStop(0.65, 'rgba(125, 211, 252, 0.78)');
                iGrad.addColorStop(1, 'rgba(56, 189, 248, 0.45)');
                ctx.fillStyle = iGrad;
                ctx.beginPath();
                ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(240, 249, 255, 0.9)';
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.restore();
            }
        }

        // Floor 5: Grand Golden Sunburst & Parthenon Throne Mosaic
        if (floorNum === 5) {
            ctx.save();
            const gGrad = ctx.createRadialGradient(0, -100, 40, 0, -100, 520);
            gGrad.addColorStop(0, 'rgba(255, 224, 110, 0.34)');
            gGrad.addColorStop(0.65, 'rgba(212, 175, 55, 0.14)');
            gGrad.addColorStop(1, 'rgba(212, 175, 55, 0)');
            ctx.fillStyle = gGrad;
            ctx.beginPath();
            ctx.arc(0, -100, 520, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(212, 175, 55, 0.65)';
            ctx.lineWidth = 5;
            ctx.beginPath(); ctx.arc(0, -100, 320, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, -100, 170, 0, Math.PI * 2); ctx.stroke();

            // Carved Zeus thunderbolt floor emblem
            ctx.fillStyle = 'rgba(255, 215, 0, 0.28)';
            ctx.beginPath();
            ctx.moveTo(15, -180); ctx.lineTo(-42, -98); ctx.lineTo(4, -98);
            ctx.lineTo(-22, -20); ctx.lineTo(46, -108); ctx.lineTo(-4, -108);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    /**
     * Live-animated perimeter & sky/cloud layers drawn around the Olympus plateau.
     */
    static drawBoundaries(ctx, arena) {
        const floorNum = arena.dungeonFloor || 1;
        const cfg = this.getFloorConfig(floorNum);
        const b = arena.dungeonBounds || cfg.bounds;
        const now = (typeof Date !== 'undefined' ? Date.now() : 0) * 0.001;

        ctx.save();
        // Outside sky/cloud glow bands on high floors (3, 4, 5)
        if (cfg.hasCloudsBelow) {
            const cloudCount = floorNum === 4 ? 18 : 12;
            for (let i = 0; i < cloudCount; i++) {
                const side = i % 4;
                const drift = Math.sin(now * 0.35 + i * 1.7) * 55;
                let cx = 0; let cy = 0;
                if (side === 0) { cx = b.minX - 150 + drift * 0.4; cy = b.minY + (i * 290) % (b.maxY - b.minY); }
                else if (side === 1) { cx = b.maxX + 150 + drift * 0.4; cy = b.minY + (i * 310) % (b.maxY - b.minY); }
                else if (side === 2) { cx = b.minX + (i * 340) % (b.maxX - b.minX); cy = b.minY - 140 + drift * 0.3; }
                else { cx = b.minX + (i * 370) % (b.maxX - b.minX); cy = b.maxY + 155 + drift * 0.3; }

                ctx.fillStyle = floorNum === 5 ? 'rgba(255, 245, 224, 0.36)' : 'rgba(241, 248, 255, 0.35)';
                ctx.beginPath();
                ctx.arc(cx, cy, 130, 0, Math.PI * 2);
                ctx.arc(cx + 90, cy + 25, 100, 0, Math.PI * 2);
                ctx.arc(cx - 85, cy + 20, 95, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Animated water shimmer lines inside Enipeas river (Floor 2)
        if (floorNum === 2 && cfg.riverYMin !== undefined) {
            ctx.strokeStyle = 'rgba(224, 247, 255, 0.48)';
            ctx.lineWidth = 3;
            for (let x = b.minX + 60; x < b.maxX - 60; x += 180) {
                const off = ((now * 75 + x) % 140) - 70;
                const wy = (x % 360 === 0) ? -28 : 28;
                ctx.beginPath();
                ctx.moveTo(x + off, wy);
                ctx.lineTo(x + off + 44, wy);
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    /**
     * Build cohesive per-floor obstacles (olive groves, pine crags, pillars, braziers, boulders).
     */
    static populateFloorObstacles(arena, floorNum) {
        if (typeof Obstacle === 'undefined') return;
        const cfg = this.getFloorConfig(floorNum);
        arena.dungeonBounds = { ...cfg.bounds };
        arena.obstacles = [];

        const b = arena.dungeonBounds;
        const addObs = (x, y, type, style = {}) => {
            // Keep player spawn, boss spawn, and north ascent terrace wide open
            const keepClear = [
                { x: cfg.spawn.x, y: cfg.spawn.y, r: 170 },
                { x: cfg.bossSpawn.x, y: cfg.bossSpawn.y, r: 210 },
                { x: cfg.ascentAnchor.x, y: cfg.ascentAnchor.y, r: 175 }
            ];
            for (const c of keepClear) {
                if (Math.hypot(x - c.x, y - c.y) < c.r) return null;
            }
            // Keep bridges & road core unobstructed on Floor 2+
            if (floorNum === 2 && y > cfg.riverYMin - 45 && y < cfg.riverYMax + 45) return null;

            const obs = new Obstacle(x, y, type);
            Object.assign(obs, style);
            arena.obstacles.push(obs);
            return obs;
        };

        // Always frame the Northern Ascent Gate with Twin Ceremonial Braziers & Columns
        const ay = cfg.ascentAnchor.y;
        addObs(-150, ay + 25, 'tree', { olympusStyle: 'brazier', isSolid: true, isTall25D: true, radius: 28 });
        addObs(150, ay + 25, 'tree', { olympusStyle: 'brazier', isSolid: true, isTall25D: true, radius: 28 });
        addObs(-245, ay - 20, 'tree', { olympusStyle: 'pillar', isOlympianPillar: true, isSolid: true, isTall25D: true, radius: 34 });
        addObs(245, ay - 20, 'tree', { olympusStyle: 'pillar', isOlympianPillar: true, isSolid: true, isTall25D: true, radius: 34 });

        if (floorNum === 1) {
            // Floor 1: Olive groves & weathered ruins along the pilgrimage road
            const treeSpots = [
                [-880, -760], [880, -760], [-960, -260], [960, -260],
                [-880, 260], [880, 260], [-860, 740], [860, 740],
                [-520, -640], [520, -640], [-520, 420], [520, 420]
            ];
            for (const [tx, ty] of treeSpots) {
                addObs(tx, ty, 'tree', { olympusStyle: 'olive_tree', isSolid: true, isTall25D: true, radius: 36 });
            }
            const roadPillars = [[-230, 360], [230, 360], [-230, -140], [230, -140]];
            for (const [px, py] of roadPillars) {
                addObs(px, py, 'tree', { olympusStyle: 'pillar', isOlympianPillar: true, isSolid: true, isTall25D: true, radius: 34 });
            }
            const boulders = [[-660, -100], [660, -100], [-650, 880], [650, 880], [-360, -820], [360, -820]];
            for (const [rx, ry] of boulders) {
                addObs(rx, ry, 'tree', { olympusStyle: 'boulder', isSolid: true, isTall25D: false, radius: 34 });
            }
        } else if (floorNum === 2) {
            // Floor 2: Enipeas Ravine canyon rocks, bridge guard pillars, alpine transition pines
            const guardPillars = [[-580, 175], [-320, 175], [320, 175], [580, 175], [-580, -175], [580, -175]];
            for (const [px, py] of guardPillars) {
                addObs(px, py, 'tree', { olympusStyle: 'pillar', isOlympianPillar: true, isSolid: true, isTall25D: true, radius: 34 });
            }
            const gorgeRocks = [[-740, -620], [740, -620], [-740, 560], [740, 560], [-220, -520], [220, 520]];
            for (const [rx, ry] of gorgeRocks) {
                addObs(rx, ry, 'tree', { olympusStyle: 'boulder', isSolid: true, isTall25D: false, radius: 36 });
            }
            const ravineTrees = [[-780, -900], [780, -900], [-760, 880], [760, 880]];
            for (const [tx, ty] of ravineTrees) {
                addObs(tx, ty, 'tree', { olympusStyle: 'olive_tree', isSolid: true, isTall25D: true, radius: 36 });
            }
        } else if (floorNum === 3) {
            // Floor 3: Snowy pine forest perimeter & glacial granite outcrops
            const snowPines = [
                [-860, -760], [860, -760], [-880, -200], [880, -200],
                [-860, 420], [860, 420], [-820, 820], [820, 820],
                [-420, -660], [420, -660], [-360, 520], [360, 520]
            ];
            for (const [tx, ty] of snowPines) {
                addObs(tx, ty, 'tree', { olympusStyle: 'snow_pine', isSnowy: true, isSolid: true, isTall25D: true, radius: 36 });
            }
            const iceBoulders = [[-540, -220], [540, 220], [-260, 140], [260, -140]];
            for (const [rx, ry] of iceBoulders) {
                addObs(rx, ry, 'tree', { olympusStyle: 'boulder', isSnowy: true, isSolid: true, isTall25D: false, radius: 36 });
            }
            addObs(-280, -10, 'tree', { olympusStyle: 'brazier', isSolid: true, isTall25D: true, radius: 28 });
            addObs(280, -10, 'tree', { olympusStyle: 'brazier', isSolid: true, isTall25D: true, radius: 28 });
        } else if (floorNum === 4) {
            // Floor 4: Cloudline sky-citadel dual marble colonnades & golden fire braziers
            for (let rowY = -680; rowY <= 620; rowY += 325) {
                addObs(-560, rowY, 'tree', { olympusStyle: 'pillar', isOlympianPillar: true, isSolid: true, isTall25D: true, radius: 34 });
                addObs(560, rowY, 'tree', { olympusStyle: 'pillar', isOlympianPillar: true, isSolid: true, isTall25D: true, radius: 34 });
            }
            addObs(-800, -450, 'tree', { olympusStyle: 'snow_pine', isSnowy: true, isSolid: true, isTall25D: true, radius: 36 });
            addObs(800, -450, 'tree', { olympusStyle: 'snow_pine', isSnowy: true, isSolid: true, isTall25D: true, radius: 36 });
            addObs(-240, 260, 'tree', { olympusStyle: 'brazier', isSolid: true, isTall25D: true, radius: 28 });
            addObs(240, 260, 'tree', { olympusStyle: 'brazier', isSolid: true, isTall25D: true, radius: 28 });
        } else {
            // Floor 5: Parthenon Summit — 10 monumental Doric columns around Zeus's arena + ceremonial braziers
            for (let i = 0; i < 10; i++) {
                const ang = (i / 10) * Math.PI * 2;
                const px = Math.cos(ang) * 740;
                const py = Math.sin(ang) * 700 - 40;
                addObs(px, py, 'tree', { olympusStyle: 'pillar', isOlympianPillar: true, isSolid: true, isTall25D: true, radius: 35 });
            }
            const cornerBraziers = [[-380, 280], [380, 280], [-420, -420], [420, -420]];
            for (const [bx, by] of cornerBraziers) {
                addObs(bx, by, 'tree', { olympusStyle: 'brazier', isSolid: true, isTall25D: true, radius: 28 });
            }
        }

        // Tactile supply crates/barrels safely placed clear of solid obstacles
        const crateCount = floorNum === 5 ? 6 : 10;
        for (let i = 0; i < crateCount; i++) {
            const ang = (i / crateCount) * Math.PI * 2 + floorNum * 0.7;
            const dist = 340 + (i % 3) * 210;
            const cx = Math.max(b.minX + 120, Math.min(b.maxX - 120, Math.cos(ang) * dist));
            const cy = Math.max(b.minY + 140, Math.min(b.maxY - 140, Math.sin(ang) * dist));
            const safe = this.findSafePosition(cx, cy, 34, arena);
            addObs(safe.x, safe.y, i % 2 === 0 ? 'crate' : 'barrel', { isSnowy: floorNum >= 3 });
        }
    }

    static _roundRect(ctx, x, y, w, h, r) {
        const rr = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.lineTo(x + w - rr, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
        ctx.lineTo(x + w, y + h - rr);
        ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
        ctx.lineTo(x + rr, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
        ctx.lineTo(x, y + rr);
        ctx.quadraticCurveTo(x, y, x + rr, y);
        ctx.closePath();
    }
}

if (typeof window !== 'undefined') {
    window.OlympusLayouts = OlympusLayouts;
    window.OLYMPUS_FLOOR_CONFIGS = OLYMPUS_FLOOR_CONFIGS;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OlympusLayouts, OLYMPUS_FLOOR_CONFIGS };
}
