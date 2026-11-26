/**
 * Lesa.io - DLC Zone 1: "The Sunless Cavern"
 * Handcrafted 3600x2800 subterranean cavern with 5 interconnected chambers:
 *   - Breach Hollow (South Spawn & Skylight Crater)
 *   - Crystal Atrium (Central Bioluminescent Crossroads)
 *   - Sunken Whisper Pool (West Reflective Underground Lake & Rune Alcove)
 *   - Torchlit Catacomb (East Ruined Masonry Causeway & Chamber)
 *   - Sealed Fog Gate Sanctum (North Rest Shrine Brazier & Abyssal Fog Gate)
 */

class CaveZoneMap {
    static WORLD_W = 3600;
    static WORLD_H = 2800;
    static BOUNDS = { minX: -1580, maxX: 1580, minY: -1200, maxY: 1180 };
    static SPAWN = { x: 0, y: 920 };
    static SHRINE = { x: 0, y: -760, radius: 135 };
    static FOG_GATE = { x: 0, y: -1150, width: 280 };

    static ZONES = [
        { id: 'breach', name: 'Breach Hollow', minX: -480, maxX: 480, minY: 500, maxY: 1340 },
        { id: 'whisper_pool', name: 'Sunken Whisper Pool', minX: -1750, maxX: -520, minY: -500, maxY: 560 },
        { id: 'catacomb', name: 'Torchlit Catacomb', minX: 520, maxX: 1750, minY: -500, maxY: 560 },
        { id: 'sanctum', name: 'Sealed Fog Gate Sanctum', minX: -580, maxX: 580, minY: -1340, maxY: -360 },
        { id: 'atrium', name: 'Crystal Atrium', minX: -520, maxX: 520, minY: -360, maxY: 500 }
    ];

    // Solid cliff rock walls sculpting natural enclosed chambers & sealed cave perimeter
    static WALL_RECTS = [
        // Four corner bedrock massifs
        { x: -1140, y: 950, hw: 660, hh: 450 },
        { x: 1140, y: 950, hw: 660, hh: 450 },
        { x: -1180, y: -930, hw: 620, hh: 470 },
        { x: 1180, y: -930, hw: 620, hh: 470 },
        // Continuous perimeter cliff seals on South, North, West, and East edges (fully enclosed cave!)
        { x: 0, y: 1310, hw: 560, hh: 120 },
        { x: 0, y: -1320, hw: 600, hh: 110 },
        { x: -1710, y: 30, hw: 130, hh: 520 },
        { x: 1710, y: 30, hw: 130, hh: 520 },
        // Bottleneck rock jaws flanking North corridor from Breach Hollow -> Crystal Atrium
        { x: -370, y: 520, hw: 185, hh: 120 },
        { x: 370, y: 520, hw: 185, hh: 120 },
        // Rock buttresses framing West corridor into Whisper Pool
        { x: -560, y: -275, hw: 115, hh: 125 },
        { x: -560, y: 295, hw: 115, hh: 125 },
        // Rock buttresses framing East corridor into Torchlit Catacomb
        { x: 560, y: -275, hw: 115, hh: 125 },
        { x: 560, y: 295, hw: 115, hh: 125 },
        // Twin monolithic gate pillars flanking the North Fog Gate climb
        { x: -340, y: -380, hw: 145, hh: 105 },
        { x: 340, y: -380, hw: 145, hh: 105 },
        // Interior tactical cover rocks & ruined pillars
        { x: -1220, y: -60, hw: 95, hh: 85 },
        { x: 1040, y: -155, hw: 110, hh: 72 },
        { x: 1040, y: 185, hw: 110, hh: 72 }
    ];

    static LIGHTS = [
        // Breach Hollow skylight shaft + entry braziers
        { x: 0, y: 930, radius: 440, str: 0.96, glow: 'rgba(186, 230, 253, 0.24)', ray: true },
        { x: -175, y: 690, radius: 270, str: 0.90, flicker: true, seed: 1.1, glow: 'rgba(251, 146, 60, 0.32)' },
        { x: 175, y: 690, radius: 270, str: 0.90, flicker: true, seed: 2.7, glow: 'rgba(251, 146, 60, 0.32)' },
        // Crystal Atrium bioluminescence
        { x: -250, y: 240, radius: 290, str: 0.88, seed: 0.4, glow: 'rgba(34, 211, 238, 0.30)' },
        { x: 255, y: 225, radius: 290, str: 0.88, seed: 1.9, glow: 'rgba(192, 132, 252, 0.30)' },
        { x: -245, y: -165, radius: 280, str: 0.86, seed: 3.1, glow: 'rgba(56, 189, 248, 0.28)' },
        { x: 245, y: -165, radius: 280, str: 0.86, seed: 4.5, glow: 'rgba(168, 85, 247, 0.28)' },
        // Sunken Whisper Pool (west lake skylight + aqua crystal shelf)
        { x: -1020, y: 60, radius: 420, str: 0.92, ray: true, glow: 'rgba(34, 211, 238, 0.26)' },
        { x: -1460, y: 80, radius: 270, str: 0.90, seed: 5.2, glow: 'rgba(56, 189, 248, 0.34)' },
        // Torchlit Catacomb braziers
        { x: 760, y: 0, radius: 265, str: 0.90, flicker: true, seed: 3.3, glow: 'rgba(251, 146, 60, 0.34)' },
        { x: 1220, y: -25, radius: 285, str: 0.92, flicker: true, seed: 6.1, glow: 'rgba(251, 146, 60, 0.36)' },
        { x: 1470, y: 120, radius: 265, str: 0.88, flicker: true, seed: 7.4, glow: 'rgba(245, 158, 11, 0.32)' },
        // Northern Rest Shrine & Fog Gate
        { x: 0, y: -760, radius: 340, str: 0.96, flicker: true, seed: 8.8, glow: 'rgba(254, 211, 48, 0.34)' },
        { x: 0, y: -1160, radius: 380, str: 0.92, seed: 9.5, glow: 'rgba(168, 85, 247, 0.30)' }
    ];

    static CRYSTALS = [
        { x: -250, y: 240, sc: 1.25, hue: '#22d3ee' },
        { x: 255, y: 225, sc: 1.20, hue: '#c084fc' },
        { x: -245, y: -165, sc: 1.15, hue: '#38bdf8' },
        { x: 245, y: -165, sc: 1.18, hue: '#a855f7' },
        { x: -1460, y: 80, sc: 1.35, hue: '#22d3ee' },
        { x: -910, y: 280, sc: 1.0, hue: '#38bdf8' }
    ];

    static BRAZIERS = [
        { x: -175, y: 690 }, { x: 175, y: 690 },
        { x: 760, y: -140 }, { x: 760, y: 140 },
        { x: 1220, y: -155 }, { x: 1220, y: 155 },
        { x: 1470, y: 120 }, { x: -190, y: -1020 }, { x: 190, y: -1020 }
    ];

    static getZoneName(x, y) {
        for (let i = 0; i < this.ZONES.length; i++) {
            const z = this.ZONES[i];
            if (x >= z.minX && x <= z.maxX && y >= z.minY && y <= z.maxY) return z.name;
        }
        return 'The Sunless Cavern';
    }

    static applyTheme(arena) {
        if (!arena) return;
        arena.gameMode = 'dlc_cave';
        arena.width = this.WORLD_W;
        arena.height = this.WORLD_H;
        arena.halfWidth = this.WORLD_W / 2;
        arena.halfHeight = this.WORLD_H / 2;
        arena.dungeonBounds = { ...this.BOUNDS };
        arena.props = [];

        this.rebuildGroundCanvas(arena);
        this.populateObstacles(arena);
    }

    static rebuildGroundCanvas(arena) {
        if (typeof document === 'undefined' || !arena) return;
        const isMob = (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile);
        const cacheScale = isMob ? MobilePerf.getGroundCacheScale() : 1.0;
        const targetW = Math.max(512, Math.round(arena.width * cacheScale));
        const targetH = Math.max(400, Math.round(arena.height * cacheScale));
        arena.groundCacheScale = cacheScale;

        if (!arena.cachedGroundCanvas) arena.cachedGroundCanvas = document.createElement('canvas');
        arena.cachedGroundCanvas.width = targetW;
        arena.cachedGroundCanvas.height = targetH;
        const ctx = arena.cachedGroundCanvas.getContext('2d');
        if (!ctx) return;

        ctx.save();
        ctx.setTransform(cacheScale, 0, 0, cacheScale, 0, 0);
        this.renderGroundCanvas(ctx, arena);
        ctx.restore();
    }

    static renderGroundCanvas(ctx, arena) {
        const hw = arena.halfWidth, hh = arena.halfHeight;
        // 1. Subterranean Basalt Slate Base
        ctx.fillStyle = '#0c1322';
        ctx.fillRect(0, 0, arena.width, arena.height);

        ctx.save();
        ctx.translate(hw, hh);

        // Chamber floor ambient coloration washes
        const washes = [
            { x: 0, y: 920, r: 520, c1: '#1e293b', c0: 'rgba(30,41,59,0)' },
            { x: 0, y: 60, r: 620, c1: '#17253b', c0: 'rgba(23,37,59,0)' },
            { x: -1080, y: 60, r: 580, c1: '#0e2938', c0: 'rgba(14,41,56,0)' },
            { x: 1080, y: 40, r: 560, c1: '#231720', c0: 'rgba(35,23,32,0)' },
            { x: 0, y: -840, r: 560, c1: '#1c1830', c0: 'rgba(28,24,48,0)' }
        ];
        for (const w of washes) {
            const g = ctx.createRadialGradient(w.x, w.y, 40, w.x, w.y, w.r);
            g.addColorStop(0, w.c1); g.addColorStop(1, w.c0);
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2); ctx.fill();
        }

        // 2. Natural Cobblestone Floor Grains & Cracks (subtle shaded stones, zero outlines)
        for (let i = 0; i < 480; i++) {
            const rx = (((i * 197 + 43) % 3360) - 1680);
            const ry = (((i * 293 + 89) % 2560) - 1280);
            const sw = 24 + (i % 5) * 12, sh = 16 + (i % 4) * 7, ang = ((i % 9) - 4) * 0.22;
            ctx.save(); ctx.translate(rx, ry); ctx.rotate(ang);
            ctx.fillStyle = i % 4 === 0 ? 'rgba(51, 65, 85, 0.22)' : (i % 3 === 0 ? 'rgba(15, 23, 42, 0.42)' : 'rgba(30, 41, 59, 0.26)');
            ctx.beginPath(); ctx.ellipse(0, 0, sw * 0.55, sh * 0.5, 0, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
        // Subtle meandering fissure cracks etched into the cavern floor
        ctx.strokeStyle = 'rgba(2, 6, 23, 0.55)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
        for (let i = 0; i < 28; i++) {
            const cx = (((i * 419 + 113) % 3100) - 1550);
            const cy = (((i * 277 + 57) % 2300) - 1150);
            const a = (i % 6) * 0.52;
            ctx.beginPath(); ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(a) * 34, cy + Math.sin(a) * 28);
            ctx.lineTo(cx + Math.cos(a + 0.4) * 68, cy + Math.sin(a - 0.3) * 52);
            ctx.stroke();
        }

        // 3. Mossy Underground Overgrowth Patches
        for (let i = 0; i < 65; i++) {
            const mx = (((i * 313 + 71) % 3100) - 1550);
            const my = (((i * 211 + 31) % 2300) - 1150);
            const mr = 28 + (i % 5) * 12;
            ctx.fillStyle = i % 2 === 0 ? 'rgba(21, 128, 61, 0.22)' : 'rgba(16, 185, 129, 0.12)';
            ctx.beginPath(); ctx.ellipse(mx, my, mr, mr * 0.62, (i % 7) * 0.4, 0, Math.PI * 2); ctx.fill();
        }

        // 4. Scattered Cavern Stepping Slabs & Northern Sanctum Steps (no road tracks)
        this._drawStonePathway(ctx, 0, 740, 0, 320, 125);
        this._drawStonePathway(ctx, 320, 0, 1420, 0, 115);
        this._drawNorthernStepsAndDais(ctx);

        // 5. Breach Hollow Fall Impact Crater
        const crG = ctx.createRadialGradient(0, 950, 14, 0, 950, 145);
        crG.addColorStop(0, 'rgba(30, 41, 59, 0.92)'); crG.addColorStop(0.6, 'rgba(56, 189, 248, 0.14)'); crG.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = crG; ctx.beginPath(); ctx.arc(0, 950, 145, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.34)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(0, 950, 108, 76, 0, 0, Math.PI * 2); ctx.stroke();

        // 6. Western Reflective Lake Basin (under dynamic water ripples)
        ctx.fillStyle = '#06202e';
        ctx.beginPath(); ctx.ellipse(-1020, 60, 290, 185, -0.1, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#1e3a4c'; ctx.lineWidth = 10; ctx.stroke();

        // 7. Soft elliptical Ambient Occlusion Shadows around all Cliff Walls
        for (const w of this.WALL_RECTS) {
            ctx.fillStyle = 'rgba(2, 4, 10, 0.56)';
            ctx.beginPath(); ctx.ellipse(w.x, w.y + 10, w.hw + 22, w.hh + 24, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }

    static _drawStonePathway(ctx, x1, y1, x2, y2, width) {
        const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
        const ux = dx / len, uy = dy / len, px = -uy, py = ux;
        ctx.save();
        // Scattered organic stepping boulders across cavern dirt (no continuous road stripe)
        const step = 56;
        for (let d = 24, idx = 0; d < len - 16; d += step, idx++) {
            const bx = x1 + ux * d, by = y1 + uy * d;
            for (const row of [-0.22, 0.20]) {
                const jx = bx + px * (width * row + Math.sin(idx * 2.7 + row) * 14);
                const jy = by + py * (width * row + Math.cos(idx * 2.1 + row) * 14);
                const sw = 22 + ((idx + (row > 0 ? 2 : 0)) % 3) * 8, sh = 15 + (idx % 3) * 4;
                ctx.save(); ctx.translate(jx, jy); ctx.rotate(Math.atan2(dy, dx) + Math.sin(idx * 1.4 + row * 5) * 0.42);
                ctx.fillStyle = (idx % 2 === 0) ? 'rgba(39, 53, 73, 0.72)' : 'rgba(30, 41, 59, 0.76)';
                ctx.strokeStyle = 'rgba(2, 6, 23, 0.65)'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.ellipse(0, 0, sw * 0.55, sh * 0.52, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                ctx.restore();
            }
        }
        ctx.restore();
    }

    static _drawNorthernStepsAndDais(ctx) {
        // Carved stepped climb from Crystal Atrium to Northern Fog Gate Sanctum
        for (let i = 0; i < 8; i++) {
            const sy = -360 - i * 38;
            ctx.fillStyle = i % 2 === 0 ? '#1e293b' : '#263348';
            ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 3;
            ctx.fillRect(-155, sy - 18, 310, 34); ctx.strokeRect(-155, sy - 18, 310, 34);
        }
        // Circular Shrine Dais around (0, -760)
        ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#fed330'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, -760, 128, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)'; ctx.lineWidth = 2; ctx.setLineDash([12, 10]);
        ctx.beginPath(); ctx.arc(0, -760, 96, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    }

    static populateObstacles(arena) {
        arena.obstacles = [];
        let obsId = 1;
        // 1. Solid 2.5D Beveled Cliff Walls
        for (const w of this.WALL_RECTS) {
            const wall = new Obstacle(w.x, w.y, 'building');
            wall.id = obsId++;
            wall.isCaveWall = true;
            wall.isTall25D = true;
            wall.halfW = w.hw;
            wall.halfH = w.hh;
            wall.radius = Math.max(w.hw, w.hh);
            wall.cullRadius = Math.hypot(w.hw, w.hh) + 90;
            wall.roofHeight = 46;
            wall.maxHp = 999999; wall.hp = 999999;
            arena.obstacles.push(wall);
        }
        // 2. Luminous Crystal Spires (solid obstacle pillars)
        for (const c of this.CRYSTALS) {
            const cr = new Obstacle(c.x, c.y, 'building');
            cr.id = obsId++;
            cr.isCaveProp = true;
            cr.caveKind = 'crystal';
            cr.hue = c.hue;
            cr.sc = c.sc;
            cr.isTall25D = false;
            cr.halfW = 28 * c.sc; cr.halfH = 22 * c.sc;
            cr.radius = 30 * c.sc; cr.cullRadius = 70;
            cr.maxHp = 999999; cr.hp = 999999;
            arena.obstacles.push(cr);
        }
        // 3. Destructible Ancient Cave Urns & Volatile Crystal Kegs
        const urns = [[-220, 860], [225, 875], [-890, 210], [-1340, -140], [880, 95], [1340, -90], [-190, -560], [190, -560]];
        for (const [ux, uy] of urns) {
            const u = new Obstacle(ux, uy, 'crate');
            u.id = obsId++; u.isCaveProp = true; u.caveKind = 'urn';
            arena.obstacles.push(u);
        }
        const kegs = [[980, 0], [1380, 140], [-740, -60], [-125, 220]];
        for (const [kx, ky] of kegs) {
            const k = new Obstacle(kx, ky, 'barrel');
            k.id = obsId++; k.isCaveProp = true; k.caveKind = 'volatile_crystal';
            arena.obstacles.push(k);
        }
    }

    static intersectRectCircle(obs, cx, cy, cr) {
        const hw = obs.halfW || obs.radius, hh = obs.halfH || obs.radius;
        const minX = obs.x - hw, maxX = obs.x + hw, minY = obs.y - hh, maxY = obs.y + hh;
        const nearX = Math.max(minX, Math.min(maxX, cx)), nearY = Math.max(minY, Math.min(maxY, cy));
        const dx = cx - nearX, dy = cy - nearY, dSq = dx * dx + dy * dy;
        if (dSq >= cr * cr) return null;

        if (dSq > 0.0001) {
            const d = Math.sqrt(dSq), nx = dx / d, ny = dy / d;
            return { pushX: nearX + nx * cr, pushY: nearY + ny * cr, nx, ny };
        }
        const penL = (cx - minX) + cr, penR = (maxX - cx) + cr, penT = (cy - minY) + cr, penB = (maxY - cy) + cr;
        const m = Math.min(penL, penR, penT, penB);
        if (m === penL) return { pushX: minX - cr, pushY: cy, nx: -1, ny: 0 };
        if (m === penR) return { pushX: maxX + cr, pushY: cy, nx: 1, ny: 0 };
        if (m === penT) return { pushX: cx, pushY: minY - cr, nx: 0, ny: -1 };
        return { pushX: cx, pushY: maxY + cr, nx: 0, ny: 1 };
    }

    static drawGroundOverlay(ctx, camera, arena) {
        const t = Date.now() * 0.003;
        ctx.save();
        // 0. Solid dark subterranean bedrock skirt beyond map edges (never shows empty grass/road void)
        const hw = arena ? arena.halfWidth : 1800, hh = arena ? arena.halfHeight : 1400;
        ctx.fillStyle = '#03050c';
        ctx.fillRect(-hw - 1600, -hh - 1200, hw * 2 + 3200, 1200);
        ctx.fillRect(-hw - 1600, hh, hw * 2 + 3200, 1200);
        ctx.fillRect(-hw - 1600, -hh, 1600, hh * 2);
        ctx.fillRect(hw, -hh, 1600, hh * 2);
        // 1. Animated Whisper Pool Water Caustics & Shimmer
        if (!camera || camera.isVisible(-1020, 60, 340)) {
            const p = 0.5 + 0.5 * Math.sin(t);
            const wg = ctx.createRadialGradient(-1020, 60, 12, -1020, 60, 275);
            wg.addColorStop(0, `rgba(34, 211, 238, ${0.26 + p * 0.12})`);
            wg.addColorStop(0.65, 'rgba(14, 116, 144, 0.22)');
            wg.addColorStop(1, 'rgba(2, 6, 23, 0)');
            ctx.fillStyle = wg;
            ctx.beginPath(); ctx.ellipse(-1020, 60, 275, 172, -0.1, 0, Math.PI * 2); ctx.fill();
            for (let k = 0; k < 3; k++) {
                const wave = ((t * 0.35 + k * 0.33) % 1);
                ctx.strokeStyle = `rgba(125, 211, 252, ${0.42 * (1 - wave)})`;
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.ellipse(-1020, 60, 40 + wave * 210, 26 + wave * 130, -0.1, 0, Math.PI * 2); ctx.stroke();
            }
        }
        // 2. Flickering Ancient Braziers
        for (let i = 0; i < this.BRAZIERS.length; i++) {
            const b = this.BRAZIERS[i];
            if (camera && !camera.isVisible(b.x, b.y, 80)) continue;
            const flk = 1 + Math.sin(t * 4.5 + i * 1.9) * 0.18;
            ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(b.x, b.y + 8, 16, 8, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2.4;
            ctx.beginPath(); ctx.arc(b.x, b.y, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#fb923c'; ctx.beginPath(); ctx.arc(b.x, b.y - 3, 9 * flk, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(b.x, b.y - 4, 4.5 * flk, 0, Math.PI * 2); ctx.fill();
        }
        // 3. Rest Shrine Brazier (Northern Sanctum Grace Light)
        if (!camera || camera.isVisible(0, -760, 180)) {
            const sp = 0.5 + 0.5 * Math.sin(t * 2.4);
            ctx.strokeStyle = `rgba(254, 211, 48, ${0.32 + sp * 0.25})`; ctx.lineWidth = 2.8;
            ctx.beginPath(); ctx.arc(0, -760, 126, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = '#18181b'; ctx.strokeStyle = '#fed330'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(0, -760, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(0, -764, 10 + sp * 3, 0, Math.PI * 2); ctx.fill();
        }
        // 4. Shimmering 2.5D Arched Northern Abyssal Fog Gate
        if (!camera || camera.isVisible(0, -1180, 240)) {
            const fp = 0.5 + 0.5 * Math.sin(t * 1.9);
            const fg = ctx.createRadialGradient(0, -1165, 16, 0, -1185, 140);
            fg.addColorStop(0, `rgba(224, 242, 254, ${0.42 + fp * 0.22})`);
            fg.addColorStop(0.45, `rgba(168, 85, 247, ${0.62 + fp * 0.20})`);
            fg.addColorStop(1, 'rgba(15, 23, 42, 0.88)');
            ctx.fillStyle = fg;
            ctx.beginPath(); ctx.arc(0, -1155, 118, Math.PI, 0); ctx.lineTo(118, -1120); ctx.lineTo(-118, -1120); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#334155'; ctx.lineWidth = 14; ctx.stroke();
            ctx.strokeStyle = `rgba(192, 132, 252, ${0.65 + fp * 0.25})`; ctx.lineWidth = 3; ctx.setLineDash([12, 10]); ctx.stroke(); ctx.setLineDash([]);
            // Twin obsidian gate pillars
            for (const sx of [-126, 106]) {
                ctx.fillStyle = '#0f172a'; ctx.strokeStyle = '#475569'; ctx.lineWidth = 2.6;
                ctx.fillRect(sx, -1210, 22, 95); ctx.strokeRect(sx, -1210, 22, 95);
            }
        }
        ctx.restore();
    }

    static drawObstacle(ctx, obs) {
        if (obs.isCaveWall) {
            const hw = obs.halfW || obs.radius, hh = obs.halfH || obs.radius, rh = obs.roofHeight || 42;
            const jag = (pts, yOff, scaleX = 1, scaleY = 1) => {
                ctx.beginPath();
                for (let i = 0; i < pts.length; i++) {
                    const [px, py] = pts[i];
                    const vx = px * hw * scaleX, vy = py * hh * scaleY + yOff;
                    if (i === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
                }
                ctx.closePath();
            };
            // Deterministic faceted cliff outline around box perimeter
            const seed = (obs.id || 1) * 1.73;
            const ring = [];
            const segs = 14;
            for (let i = 0; i < segs; i++) {
                const a = (i / segs) * Math.PI * 2;
                const notch = 0.94 + Math.sin(seed + i * 2.4) * 0.08 + Math.cos(seed * 1.3 + i * 3.1) * 0.05;
                // Map angle smoothly onto rounded-rock rectangle boundary
                const ca = Math.cos(a), sa = Math.sin(a);
                const m = Math.max(Math.abs(ca), Math.abs(sa)) || 1;
                ring.push([(ca / m) * notch, (sa / m) * notch]);
            }
            // Ground AO lip + rugged vertical rock face
            jag(ring, 8, 1.04, 1.04); ctx.fillStyle = 'rgba(2, 4, 10, 0.58)'; ctx.fill();
            jag(ring, 0, 1, 1); ctx.fillStyle = '#090e1a'; ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 3; ctx.fill(); ctx.stroke();
            // Chiseled upper cliff plateau beveled upward
            jag(ring, -rh, 0.95, 0.94); ctx.fillStyle = '#162033'; ctx.strokeStyle = '#334155'; ctx.lineWidth = 2.6; ctx.fill(); ctx.stroke();
            // Top mineral highlight & moss accent
            jag(ring, -rh - 4, 0.68, 0.65); ctx.fillStyle = '#1e293b'; ctx.fill();
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)'; ctx.lineWidth = 1.8; ctx.stroke();
            return;
        }
        if (obs.caveKind === 'crystal') {
            const s = (obs.sc || 1) * 26, hue = obs.hue || '#22d3ee';
            ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(0, 12, s * 1.1, s * 0.42, 0, 0, Math.PI * 2); ctx.fill();
            for (const [ang, hMul] of [[-0.36, 1.1], [0.02, 1.65], [0.38, 1.0]]) {
                ctx.save(); ctx.rotate(ang);
                ctx.fillStyle = hue; ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(-s * 0.32, 8); ctx.lineTo(0, -s * hMul); ctx.lineTo(s * 0.32, 8); ctx.closePath();
                ctx.fill(); ctx.stroke(); ctx.restore();
            }
            return;
        }
        if (obs.caveKind === 'urn') {
            const fl = obs.hitFlash > 0;
            ctx.fillStyle = fl ? '#ffffff' : '#334155'; ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2.8;
            ctx.beginPath(); ctx.ellipse(0, 0, 18, 22, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#fed330'; ctx.fillRect(-10, -14, 20, 4);
            return;
        }
        if (obs.caveKind === 'volatile_crystal') {
            const fl = obs.hitFlash > 0;
            ctx.fillStyle = 'rgba(0,0,0,0.42)'; ctx.beginPath(); ctx.ellipse(0, 12, 22, 10, 0, 0, Math.PI * 2); ctx.fill();
            for (const [ang, h] of [[-0.45, 22], [0.02, 28], [0.46, 20]]) {
                ctx.save(); ctx.rotate(ang);
                ctx.fillStyle = fl ? '#ffffff' : '#e11d48'; ctx.strokeStyle = '#fda4af'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(-8, 6); ctx.lineTo(0, -h); ctx.lineTo(8, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
                ctx.restore();
            }
        }
    }
}

if (typeof window !== 'undefined') window.CaveZoneMap = CaveZoneMap;
if (typeof module !== 'undefined' && module.exports) module.exports = { CaveZoneMap };
