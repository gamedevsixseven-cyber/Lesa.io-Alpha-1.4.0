/**
 * Lesa.io - Arena Engine
 * Cartoon meadow map with cached offscreen ground rendering for 60+ FPS performance
 */

function createArenaRng(seed) {
    let s = (seed >>> 0) || 123456789;
    return function() {
        s = (s + 0x6D2B79F5) >>> 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

class Arena {
    constructor(width = 2800, height = 2800, seed = null) {
        this.width = width;
        this.height = height;
        this.halfWidth = width / 2;
        this.halfHeight = height / 2;
        this.seed = seed;
        this.gameMode = 'story';

        this.tileSize = 100;
        this.props = [];
        this.obstacles = [];
        this.destroyedObsIds = new Set();

        // Cached Offscreen Canvas for high performance ground rendering
        this.cachedGroundCanvas = null;
        this.groundCacheScale = 1.0;

        // Auto re-render ground cache once textures finish loading
        const isMobile = (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile);
        const tex1 = Arena.getFloorTexture1();
        if (tex1) {
            const onTex1Ready = () => this.renderGroundCache();
            if (!tex1.complete || tex1.naturalWidth === 0) {
                tex1.addEventListener('load', onTex1Ready);
                if (isMobile) {
                    tex1.addEventListener('error', () => {
                        const fb = Arena.getFloorTextureGrass2();
                        if (fb && !fb.complete) fb.addEventListener('load', onTex1Ready);
                        else this.renderGroundCache();
                    }, { once: true });
                }
            }
            if (isMobile && typeof tex1.decode === 'function') {
                tex1.decode().then(onTex1Ready).catch(() => {});
            }
        }
        if (!isMobile) {
            const tex2 = Arena.getFloorTextureGrass2();
            if (tex2 && !tex2.complete) {
                tex2.addEventListener('load', () => this.renderGroundCache());
            }
        }

        const rng = (seed !== null && seed !== undefined) ? createArenaRng(seed) : Math.random;
        this.generateDecorations(rng);
        this.generateObstacles(rng);
        this.renderGroundCache();
    }

    reseed(seed) {
        if (seed === null || seed === undefined) return;
        this.seed = seed;
        this.destroyedObsIds = new Set();
        const rng = createArenaRng(seed);
        this.generateDecorations(rng);
        this.generateObstacles(rng);
        this.renderGroundCache();
    }

    setDungeonTheme(floorNum) {
        this.dungeonFloor = floorNum;
        if (typeof DungeonMapTheme !== 'undefined') {
            DungeonMapTheme.applyTheme(this, floorNum);
        }
    }

    resetNormalTheme() {
        if (typeof document !== 'undefined') {
            const m = document.getElementById('olympus-blessing-modal');
            if (m && m.parentNode) m.parentNode.removeChild(m);
        }
        if (!this.dungeonFloor) return;
        this.dungeonFloor = null;
        this.dungeonBounds = null;
        if (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile && this.cachedGroundCanvas) {
            MobilePerf.releaseCanvas(this.cachedGroundCanvas);
            this.cachedGroundCanvas = null;
            this.groundCacheScale = 1.0;
        }
        this.generateDecorations();
        this.generateObstacles();
        this.renderGroundCache();
    }

    setGameMode(gameMode) {
        if (gameMode !== 'dungeons' && this.dungeonFloor) {
            this.resetNormalTheme();
        }
        if (gameMode === 'dungeons') {
            this.gameMode = 'dungeons';
            return;
        }
        const nextMode = (gameMode === 'endless') ? 'endless' : 'story';
        if (this.gameMode !== nextMode) {
            this.gameMode = nextMode;
            this.destroyedObsIds = new Set();
            const rng = (this.seed !== null && this.seed !== undefined) ? createArenaRng(this.seed) : Math.random;
            this.generateObstacles(rng);
        }
    }

    static getFloorTexture1() {
        if (!Arena.floorTexture1 && typeof Image !== 'undefined') {
            Arena.floorTexture1 = new Image();
            Arena.floorTexture1.src = 'assets/GameWorldModels/FloorTexture1LesaIO.png';
        }
        return Arena.floorTexture1;
    }

    static getFloorTextureGrass2() {
        if (!Arena.floorTextureGrass2 && typeof Image !== 'undefined') {
            Arena.floorTextureGrass2 = new Image();
            Arena.floorTextureGrass2.src = 'assets/GameWorldModels/FloorTextureGrass2.png';
        }
        return Arena.floorTextureGrass2;
    }

    generateDecorations(rng = Math.random) {
        this.props = [];
        const count = 320;
        for (let i = 0; i < count; i++) {
            const x = (rng() * 2 - 1) * (this.halfWidth - 80);
            const y = (rng() * 2 - 1) * (this.halfHeight - 80);
            const rand = rng();

            if (rand < 0.45) {
                this.props.push({ type: 'grass', x, y, scale: 0.7 + rng() * 0.6 });
            } else if (rand < 0.8) {
                const colors = ['#ffd32a', '#ff5e57', '#0be881', '#ffc048', '#ffffff'];
                this.props.push({
                    type: 'flower',
                    x, y,
                    color: colors[Math.floor(rng() * colors.length)],
                    scale: 0.8 + rng() * 0.5
                });
            } else {
                this.props.push({ type: 'pebble', x, y, scale: 0.6 + rng() * 0.5 });
            }
        }
    }

    renderGroundCache() {
        if (this.dungeonFloor) {
            if (typeof DungeonMapTheme !== 'undefined') {
                DungeonMapTheme.applyTheme(this, this.dungeonFloor);
            }
            return;
        }
        if (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile) {
            MobilePerf.buildMobileGroundTile(this);
            return;
        }

        // Build an offscreen canvas rendering all static grass, flowers, grid lines
        if (!this.cachedGroundCanvas) {
            this.cachedGroundCanvas = document.createElement('canvas');
            this.cachedGroundCanvas.width = this.width;
            this.cachedGroundCanvas.height = this.height;
        }
        const gCtx = this.cachedGroundCanvas.getContext('2d');

        const tex1 = Arena.getFloorTexture1();
        const tex2 = Arena.getFloorTextureGrass2();

        // 1. High-Resolution Floor Texture (Wildflowers, Pebbles, Grass Tufts)
        if (tex1 && tex1.complete && tex1.naturalWidth > 0) {
            const pattern = gCtx.createPattern(tex1, 'repeat');
            gCtx.fillStyle = pattern;
            gCtx.fillRect(0, 0, this.width, this.height);
        } else if (tex2 && tex2.complete && tex2.naturalWidth > 0) {
            const pattern = gCtx.createPattern(tex2, 'repeat');
            gCtx.fillStyle = pattern;
            gCtx.fillRect(0, 0, this.width, this.height);
        } else {
            // Immediate fallback color while loading
            gCtx.fillStyle = '#78e08f';
            gCtx.fillRect(0, 0, this.width, this.height);
        }

        // 2. Subtle Tactical Grid Lines (matching WorldPreview style)
        gCtx.strokeStyle = 'rgba(40, 140, 50, 0.24)';
        gCtx.lineWidth = 2.0;

        gCtx.beginPath();
        for (let x = 0; x <= this.width; x += this.tileSize) {
            gCtx.moveTo(x, 0);
            gCtx.lineTo(x, this.height);
        }
        for (let y = 0; y <= this.height; y += this.tileSize) {
            gCtx.moveTo(0, y);
            gCtx.lineTo(this.width, y);
        }
        gCtx.stroke();

        // 3. Fallback procedural vector props (only if texture image is unavailable)
        if (!tex1 || !tex1.complete || tex1.naturalWidth === 0) {
            for (let i = 0; i < this.props.length; i++) {
                const p = this.props[i];
                const px = p.x + this.halfWidth;
                const py = p.y + this.halfHeight;

                gCtx.save();
                gCtx.translate(px, py);
                gCtx.scale(p.scale, p.scale);

                if (p.type === 'grass') {
                    gCtx.fillStyle = '#38ada9';
                    gCtx.beginPath();
                    gCtx.moveTo(-6, 0);
                    gCtx.quadraticCurveTo(-10, -14, -14, -18);
                    gCtx.quadraticCurveTo(-6, -10, -2, 0);
                    gCtx.quadraticCurveTo(0, -18, 2, -22);
                    gCtx.quadraticCurveTo(4, -10, 6, 0);
                    gCtx.quadraticCurveTo(10, -12, 14, -16);
                    gCtx.quadraticCurveTo(8, -8, 8, 0);
                    gCtx.closePath();
                    gCtx.fill();
                } else if (p.type === 'flower') {
                    gCtx.fillStyle = p.color;
                    for (let a = 0; a < Math.PI * 2; a += Math.PI / 2.5) {
                        gCtx.beginPath();
                        gCtx.arc(Math.cos(a) * 6, Math.sin(a) * 6, 4, 0, Math.PI * 2);
                        gCtx.fill();
                    }
                    gCtx.fillStyle = '#f6b93b';
                    gCtx.beginPath();
                    gCtx.arc(0, 0, 3.5, 0, Math.PI * 2);
                    gCtx.fill();
                } else if (p.type === 'pebble') {
                    gCtx.fillStyle = '#6a89cc';
                    gCtx.beginPath();
                    gCtx.ellipse(0, 0, 7, 4.5, 0.4, 0, Math.PI * 2);
                    gCtx.fill();
                }
                gCtx.restore();
            }
        }
    }

    _hitsBuilding(x, y, pad = 90) {
        for (let i = 0; i < this.obstacles.length; i++) {
            const o = this.obstacles[i];
            if (o.type === 'building' && Math.abs(x - o.x) < (o.halfW || 70) + pad && Math.abs(y - o.y) < (o.halfH || 48) + pad) {
                return true;
            }
        }
        return false;
    }

    generateObstacles(rng = Math.random) {
        this.obstacles = [];
        let obsId = 1;

        // 0. Endless Mode: Place 6 Landmark Greek Village Buildings around the outer ring
        if (this.gameMode === 'endless' && typeof EndlessBuildingRenderer !== 'undefined') {
            const placements = [
                { arch: 'chapel', x: 0, y: -900 },
                { arch: 'kafenio', x: -780, y: -640 },
                { arch: 'periptero', x: 780, y: -640 },
                { arch: 'bakery', x: -780, y: 620 },
                { arch: 'outpost', x: 780, y: 620 },
                { arch: 'windmill', x: 0, y: 910 }
            ];
            for (const p of placements) {
                const spec = EndlessBuildingRenderer.SPECS[p.arch] || EndlessBuildingRenderer.SPECS.kafenio;
                const bx = p.x + (rng() - 0.5) * 80;
                const by = p.y + (rng() - 0.5) * 70;
                const bld = new Obstacle(bx, by, 'building');
                bld.id = obsId++;
                bld.arch = p.arch;
                bld.halfW = spec.halfW;
                bld.halfH = spec.halfH;
                bld.roofHeight = spec.roofH;
                bld.cullRadius = spec.cullR;
                bld.radius = Math.ceil(Math.hypot(spec.halfW, spec.halfH));
                bld.isTall25D = true;
                bld.maxHp = 99999;
                bld.hp = 99999;
                this.obstacles.push(bld);
            }
        }
        if (typeof EndlessMapEvolution !== 'undefined') {
            EndlessMapEvolution.seedHotspots(this, rng);
        }

        // 1. Place 2.5D Lush Trees FIRST so props can position cleanly around them
        const trees = [];
        const minTreeDistSq = 340 * 340;
        let treeAttempts = 0;
        while (trees.length < 18 && treeAttempts < 350) {
            treeAttempts++;
            const x = (rng() * 2 - 1) * (this.halfWidth - 320);
            const y = (rng() * 2 - 1) * (this.halfHeight - 320);

            if (x * x + y * y <= 260 * 260) continue; // Safe from player spawn
            if (this._hitsBuilding(x, y, 135)) continue;

            let tooClose = false;
            for (let t = 0; t < trees.length; t++) {
                const dx = x - trees[t].x;
                const dy = y - trees[t].y;
                if (dx * dx + dy * dy < minTreeDistSq) {
                    tooClose = true;
                    break;
                }
            }

            if (!tooClose) {
                const tree = new Obstacle(x, y, 'tree');
                tree.id = obsId++;
                trees.push(tree);
                this.obstacles.push(tree);
            }
        }

        // Helper to find non-overlapping positions away from trees, player spawn & existing props
        const findClearSpot = (minDistTree = 110, minDistProps = 68, boundInset = 250) => {
            const minTreeSq = minDistTree * minDistTree;
            const minPropSq = minDistProps * minDistProps;
            for (let a = 0; a < 45; a++) {
                const x = (rng() * 2 - 1) * (this.halfWidth - boundInset);
                const y = (rng() * 2 - 1) * (this.halfHeight - boundInset);
                if (x * x + y * y <= 220 * 220) continue; // Spawn clearance
                if (this._hitsBuilding(x, y, 78)) continue;

                let blocked = false;
                for (let j = 0; j < this.obstacles.length; j++) {
                    const other = this.obstacles[j];
                    if (other.type === 'building') continue;
                    const distSq = (x - other.x) * (x - other.x) + (y - other.y) * (y - other.y);
                    const reqDistSq = other.type === 'tree' ? minTreeSq : minPropSq;
                    if (distSq < reqDistSq) {
                        blocked = true;
                        break;
                    }
                }
                if (!blocked) return { x, y };
            }
            return null;
        };

        // 2. Bouncy Mushrooms
        for (let i = 0; i < 14; i++) {
            const pt = findClearSpot(110, 75, 260);
            if (pt) {
                const obs = new Obstacle(pt.x, pt.y, 'mushroom');
                obs.id = obsId++;
                this.obstacles.push(obs);
            }
        }

        // 3. Explosive Red Barrels (TNT)
        for (let i = 0; i < 12; i++) {
            const pt = findClearSpot(115, 75, 270);
            if (pt) {
                const obs = new Obstacle(pt.x, pt.y, 'barrel');
                obs.id = obsId++;
                this.obstacles.push(obs);
            }
        }

        // 4. Destructible Crates
        for (let i = 0; i < 28; i++) {
            const pt = findClearSpot(110, 68, 250);
            if (pt) {
                const obs = new Obstacle(pt.x, pt.y, 'crate');
                obs.id = obsId++;
                this.obstacles.push(obs);
            }
        }

        // 5. Bushes
        for (let i = 0; i < 20; i++) {
            const pt = findClearSpot(100, 64, 250);
            if (pt) {
                const obs = new Obstacle(pt.x, pt.y, 'bush');
                obs.id = obsId++;
                this.obstacles.push(obs);
            }
        }
    }

    findRespawnCoord() {
        const p = (typeof window !== 'undefined' && window.gameInstance) ? window.gameInstance.player : null;
        const b = this.dungeonBounds;
        const minX = b ? b.minX + 120 : -(this.halfWidth - 300);
        const maxX = b ? b.maxX - 120 : (this.halfWidth - 300);
        const minY = b ? b.minY + 140 : -(this.halfHeight - 300);
        const maxY = b ? b.maxY - 120 : (this.halfHeight - 300);
        for (let a = 0; a < 30; a++) {
            const x = minX + Math.random() * (maxX - minX);
            const y = minY + Math.random() * (maxY - minY);
            if (p && ((x - p.x) * (x - p.x) + (y - p.y) * (y - p.y) < 280 * 280)) continue;
            if (this._hitsBuilding(x, y, 75)) continue;

            let blocked = false;
            for (let i = 0; i < this.obstacles.length; i++) {
                const o = this.obstacles[i];
                if (o.type === 'building') continue;
                const dSq = (x - o.x) * (x - o.x) + (y - o.y) * (y - o.y);
                const req = o.type === 'tree' ? 110 * 110 : 70 * 70;
                if (dSq < req) {
                    blocked = true;
                    break;
                }
            }
            if (!blocked) return { x, y };
        }
        return {
            x: minX + Math.random() * (maxX - minX),
            y: minY + Math.random() * (maxY - minY)
        };
    }

    respawnCrate() {
        const pt = this.findRespawnCoord();
        this.obstacles.push(new Obstacle(pt.x, pt.y, 'crate'));
    }

    respawnBarrel() {
        const pt = this.findRespawnCoord();
        this.obstacles.push(new Obstacle(pt.x, pt.y, 'barrel'));
    }

    update(dt = 1) {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.update(dt);
            if (obs.dead) {
                if (obs.id && this.destroyedObsIds) {
                    this.destroyedObsIds.add(obs.id);
                }
                const isBarrel = (obs.type === 'barrel');
                this.obstacles.splice(i, 1);
                const isCoop = typeof window !== 'undefined' && window.gameInstance && !!window.gameInstance.coopSession;
                if (!isCoop) {
                    setTimeout(() => {
                        if (isBarrel) {
                            this.respawnBarrel();
                        } else {
                            this.respawnCrate();
                        }
                    }, 8000 + Math.random() * 5000);
                }
            }
        }
    }

    drawGround(ctx, camera) {
        if (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile) {
            if (this.dungeonFloor) {
                if (MobilePerf.drawScaledCachedGround(ctx, camera, this)) return;
            } else {
                MobilePerf.drawMobileArenaGround(ctx, camera, this);
                return;
            }
        }
        // High-Performance Integer-Aligned Viewport Slicing for arena ground
        if (this.cachedGroundCanvas && camera) {
            const halfVW = (camera.canvas.width / 2) / camera.zoom + 80;
            const halfVH = (camera.canvas.height / 2) / camera.zoom + 80;

            const rawSx = Math.max(0, Math.min(this.width - halfVW * 2, camera.x + this.halfWidth - halfVW));
            const rawSy = Math.max(0, Math.min(this.height - halfVH * 2, camera.y + this.halfHeight - halfVH));
            const rawSw = Math.min(this.width - rawSx, halfVW * 2);
            const rawSh = Math.min(this.height - rawSy, halfVH * 2);

            // Integer pixel alignment allows direct hardware GPU texture copy without software bilinear interpolation
            const sx = Math.floor(rawSx);
            const sy = Math.floor(rawSy);
            const sw = Math.floor(rawSw);
            const sh = Math.floor(rawSh);
            const dx = Math.floor(sx - this.halfWidth);
            const dy = Math.floor(sy - this.halfHeight);

            if (sw > 0 && sh > 0) {
                ctx.drawImage(this.cachedGroundCanvas, sx, sy, sw, sh, dx, dy, sw, sh);
            }
        } else if (this.cachedGroundCanvas) {
            ctx.drawImage(this.cachedGroundCanvas, -this.halfWidth, -this.halfHeight);
        } else {
            ctx.fillStyle = '#78e08f';
            ctx.fillRect(-this.halfWidth, -this.halfHeight, this.width, this.height);
        }
    }

    drawBoundaries(ctx) {
        if (this.dungeonFloor && typeof DungeonMapTheme !== 'undefined' && DungeonMapTheme.drawBoundaries) {
            DungeonMapTheme.drawBoundaries(ctx, this);
            return;
        }
        if (typeof EndlessMapEvolution !== 'undefined' && EndlessMapEvolution.drawBoundaries(ctx, this)) {
            return;
        }
        ctx.save();
        ctx.lineWidth = 14;
        ctx.strokeStyle = '#b71540';
        ctx.strokeRect(-this.halfWidth, -this.halfHeight, this.width, this.height);

        ctx.lineWidth = 6;
        ctx.strokeStyle = '#fad390';
        ctx.setLineDash([20, 20]);
        ctx.strokeRect(-this.halfWidth + 8, -this.halfHeight + 8, this.width - 16, this.height - 16);
        ctx.restore();
    }

    draw(ctx, camera) {
        this.drawGround(ctx, camera);
        if (typeof window !== 'undefined' && window.gameInstance && window.gameInstance.waveManager && window.gameInstance.waveManager.dungeonManager) {
            window.gameInstance.waveManager.dungeonManager.drawGroundOverlay(ctx, camera, this);
        }
        if (typeof OutsidePerimeterRoads !== 'undefined') {
            OutsidePerimeterRoads.drawRoads(ctx, camera, this);
        }
        if (typeof EndlessMapEvolution !== 'undefined') {
            EndlessMapEvolution.drawWorldGround(ctx, camera, this);
        }
        this.drawBoundaries(ctx);
        if (typeof OutsidePerimeterRoads !== 'undefined') {
            OutsidePerimeterRoads.drawTraffic(ctx, camera, this);
        }
        if (typeof KolossosArenaAtmosphere !== 'undefined') {
            KolossosArenaAtmosphere.drawWorldGround(ctx, camera, this);
        }
    }

    drawObstacles(ctx) {
        for (let i = 0; i < this.obstacles.length; i++) {
            this.obstacles[i].draw(ctx);
        }
    }
}
