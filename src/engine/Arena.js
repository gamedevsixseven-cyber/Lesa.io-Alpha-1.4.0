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

        this.tileSize = 100;
        this.props = [];
        this.obstacles = [];
        this.destroyedObsIds = new Set();

        // Cached Offscreen Canvas for high performance ground rendering
        this.cachedGroundCanvas = null;

        // Auto re-render ground cache once textures finish loading
        const tex1 = Arena.getFloorTexture1();
        const tex2 = Arena.getFloorTextureGrass2();
        if (tex1 && !tex1.complete) {
            tex1.addEventListener('load', () => this.renderGroundCache());
        }
        if (tex2 && !tex2.complete) {
            tex2.addEventListener('load', () => this.renderGroundCache());
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

    generateObstacles(rng = Math.random) {
        this.obstacles = [];
        let obsId = 1;

        // Bouncy Mushrooms
        for (let i = 0; i < 14; i++) {
            const x = (rng() * 2 - 1) * (this.halfWidth - 250);
            const y = (rng() * 2 - 1) * (this.halfHeight - 250);
            if (x * x + y * y > 200 * 200) {
                const obs = new Obstacle(x, y, 'mushroom');
                obs.id = obsId++;
                this.obstacles.push(obs);
            }
        }

        // Destructible Crates
        for (let i = 0; i < 28; i++) {
            const x = (rng() * 2 - 1) * (this.halfWidth - 250);
            const y = (rng() * 2 - 1) * (this.halfHeight - 250);
            if (x * x + y * y > 220 * 220) {
                const obs = new Obstacle(x, y, 'crate');
                obs.id = obsId++;
                this.obstacles.push(obs);
            }
        }

        // Explosive Red Barrels (TNT)
        for (let i = 0; i < 12; i++) {
            const x = (rng() * 2 - 1) * (this.halfWidth - 260);
            const y = (rng() * 2 - 1) * (this.halfHeight - 260);
            if (x * x + y * y > 240 * 240) {
                const obs = new Obstacle(x, y, 'barrel');
                obs.id = obsId++;
                this.obstacles.push(obs);
            }
        }

        // Bushes
        for (let i = 0; i < 20; i++) {
            const x = (rng() * 2 - 1) * (this.halfWidth - 250);
            const y = (rng() * 2 - 1) * (this.halfHeight - 250);
            if (x * x + y * y > 200 * 200) {
                const obs = new Obstacle(x, y, 'bush');
                obs.id = obsId++;
                this.obstacles.push(obs);
            }
        }

        // 2.5D Lush Trees - Well-spaced across arena (no overlapping trees)
        const trees = [];
        const minTreeDistSq = 350 * 350; // Keep trees well spaced
        let treeAttempts = 0;
        while (trees.length < 18 && treeAttempts < 300) {
            treeAttempts++;
            const x = (rng() * 2 - 1) * (this.halfWidth - 320);
            const y = (rng() * 2 - 1) * (this.halfHeight - 320);

            // Safe from center player spawn
            if (x * x + y * y <= 280 * 280) continue;

            // Enforce minimum distance to all existing trees
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
    }

    respawnCrate() {
        const x = (Math.random() * 2 - 1) * (this.halfWidth - 300);
        const y = (Math.random() * 2 - 1) * (this.halfHeight - 300);
        this.obstacles.push(new Obstacle(x, y, 'crate'));
    }

    respawnBarrel() {
        const x = (Math.random() * 2 - 1) * (this.halfWidth - 300);
        const y = (Math.random() * 2 - 1) * (this.halfHeight - 300);
        this.obstacles.push(new Obstacle(x, y, 'barrel'));
    }

    update(dt = 1) {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.update(dt);
            if (obs.dead) {
                if (obs.id && this.destroyedObsIds) {
                    this.destroyedObsIds.add(obs.id);
                }
                this.obstacles.splice(i, 1);
                const isCoop = typeof window !== 'undefined' && window.gameInstance && !!window.gameInstance.coopSession;
                if (!isCoop) {
                    setTimeout(() => {
                        this.respawnCrate();
                    }, 8000 + Math.random() * 5000);
                }
            }
        }
    }

    drawGround(ctx, camera) {
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
        this.drawBoundaries(ctx);
    }

    drawObstacles(ctx) {
        for (let i = 0; i < this.obstacles.length; i++) {
            this.obstacles[i].draw(ctx);
        }
    }
}
