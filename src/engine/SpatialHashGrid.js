/**
 * Lesa.io - Zero-Allocation Spatial Hash Grid & Off-Screen Separation Throttler
 * Accelerates crowded-wave bullet hits, obstacle physics, chain lightning, and enemy separation
 * from O(N^2) down to local neighbor cell lookups with zero visual or hitbox changes.
 */

class SpatialHashGrid {
    constructor(cellSize = 144, bucketCount = 4096) {
        this.cellSize = cellSize;
        this.invCellSize = 1 / cellSize;
        this.bucketCount = bucketCount;
        this.bucketMask = bucketCount - 1;
        this.heads = new Int32Array(bucketCount);
        this.heads.fill(-1);

        this.capacity = 256;
        this.next = new Int32Array(this.capacity);
        this.cellX = new Int16Array(this.capacity);
        this.cellY = new Int16Array(this.capacity);
        this.count = 0;
        this.maxRadius = 48;
        this.source = null;
    }

    _ensureCapacity(needed) {
        if (needed <= this.capacity) return;
        let nextCap = this.capacity;
        while (nextCap < needed) nextCap *= 2;
        this.capacity = nextCap;
        this.next = new Int32Array(nextCap);
        this.cellX = new Int16Array(nextCap);
        this.cellY = new Int16Array(nextCap);
    }

    _insertAt(obj, idx) {
        let r = obj.radius || 26;
        if (obj.halfW || obj.halfH) {
            r = Math.max(r, obj.halfW || 0, obj.halfH || 0);
        }
        if (r > this.maxRadius) this.maxRadius = r;

        const cx = Math.floor(obj.x * this.invCellSize);
        const cy = Math.floor(obj.y * this.invCellSize);
        const b = ((Math.imul(cx, 73856093) ^ Math.imul(cy, 19349663)) & this.bucketMask);

        this.cellX[idx] = cx;
        this.cellY[idx] = cy;
        this.next[idx] = this.heads[b];
        this.heads[b] = idx;
    }

    rebuild(list, minMaxRadius = 24) {
        this.source = list || null;
        this.heads.fill(-1);
        this.count = 0;
        this.maxRadius = minMaxRadius;
        if (!list || !list.length) return;

        const len = list.length;
        this._ensureCapacity(len);
        for (let i = 0; i < len; i++) {
            const obj = list[i];
            if (!obj || obj.dead) continue;
            this._insertAt(obj, i);
        }
        this.count = len;
    }

    syncTail(list) {
        if (!list || list !== this.source || list.length <= this.count) return;
        this._ensureCapacity(list.length);
        for (let i = this.count; i < list.length; i++) {
            const obj = list[i];
            if (obj && !obj.dead) this._insertAt(obj, i);
        }
        this.count = list.length;
    }

    queryIndices(x, y, radius, out) {
        out.length = 0;
        if (!this.count) return 0;

        const inv = this.invCellSize;
        const minCx = Math.floor((x - radius) * inv);
        const maxCx = Math.floor((x + radius) * inv);
        const minCy = Math.floor((y - radius) * inv);
        const maxCy = Math.floor((y + radius) * inv);
        const mask = this.bucketMask;
        const heads = this.heads;
        const next = this.next;
        const cellX = this.cellX;
        const cellY = this.cellY;

        for (let cy = minCy; cy <= maxCy; cy++) {
            for (let cx = minCx; cx <= maxCx; cx++) {
                const b = ((Math.imul(cx, 73856093) ^ Math.imul(cy, 19349663)) & mask);
                let idx = heads[b];
                while (idx !== -1) {
                    if (cellX[idx] === cx && cellY[idx] === cy) {
                        out.push(idx);
                    }
                    idx = next[idx];
                }
            }
        }
        return out.length;
    }

    forEachInBox(minX, minY, maxX, maxY, list, fn) {
        if (!this.count) return;
        const inv = this.invCellSize;
        const minCx = Math.floor(minX * inv);
        const maxCx = Math.floor(maxX * inv);
        const minCy = Math.floor(minY * inv);
        const maxCy = Math.floor(maxY * inv);
        const mask = this.bucketMask;
        const heads = this.heads;
        const next = this.next;
        const cellX = this.cellX;
        const cellY = this.cellY;

        for (let cy = minCy; cy <= maxCy; cy++) {
            for (let cx = minCx; cx <= maxCx; cx++) {
                const b = ((Math.imul(cx, 73856093) ^ Math.imul(cy, 19349663)) & mask);
                let idx = heads[b];
                while (idx !== -1) {
                    if (cellX[idx] === cx && cellY[idx] === cy) {
                        const obj = list[idx];
                        if (obj && fn(obj, idx) === false) return;
                    }
                    idx = next[idx];
                }
            }
        }
    }

    static forEachEnemyNear(x, y, radius, enemies, fn) {
        if (!Array.isArray(enemies) || !enemies.length) return;
        const grid = this.enemyGrid;
        if (grid.source === enemies) {
            grid.syncTail(enemies);
            const r = radius + grid.maxRadius + 2;
            grid.forEachInBox(x - r, y - r, x + r, y + r, enemies, fn);
            return;
        }
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (e && fn(e, i) === false) return;
        }
    }

    static forEachEnemyInBox(minX, minY, maxX, maxY, pad, enemies, fn) {
        if (!Array.isArray(enemies) || !enemies.length) return;
        const grid = this.enemyGrid;
        if (grid.source === enemies) {
            grid.syncTail(enemies);
            const p = pad + grid.maxRadius + 2;
            grid.forEachInBox(minX - p, minY - p, maxX + p, maxY + p, enemies, fn);
            return;
        }
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (e && fn(e, i) === false) return;
        }
    }

    static enemyGrid = new SpatialHashGrid(144, 4096);
    static obstacleGrid = new SpatialHashGrid(144, 2048);
    static frameCount = 0;
    static _sepSeq = 0;

    // Isolated per-caller scratch buffers avoid reallocations and re-entrancy conflicts
    static _sepBuf = [];
    static _bulletEnemyBuf = [];
    static _bulletObsBuf = [];
    static _playerEnemyBuf = [];
    static _partnerEnemyBuf = [];
    static _playerObsBuf = [];
    static _obsEnemyBuf = [];
    static _chainBuf = [];

    static beginEnemyPass(game) {
        this.frameCount = (this.frameCount + 1) & 0x7fffffff;
        if (game && game.enemies) {
            this.enemyGrid.rebuild(game.enemies, 26);
        }
    }

    static beginCollisionPass(game) {
        if (!game) return;
        this.enemyGrid.rebuild(game.enemies, 26);
        const obstacles = game.arena ? game.arena.obstacles : null;
        this.obstacleGrid.rebuild(obstacles, 36);
    }

    static separateEnemy(enemy, enemies) {
        if (!enemy || !enemies || enemies.length <= 1) return;

        if (enemy._sepPhase === undefined) {
            this._sepSeq = (this._sepSeq + 1) & 1023;
            enemy._sepPhase = this._sepSeq;
        }

        // Off-screen separation throttling (keeps bosses & everyone near/on-screen at full 60Hz)
        let pushMult = 1.0;
        if (!enemy.isBoss && !enemy.isMiniBoss) {
            const g = (typeof window !== 'undefined') ? window.gameInstance : null;
            const cam = g && g.camera;
            if (cam && typeof cam.isVisible === 'function') {
                const r = enemy.radius || 26;
                if (!cam.isVisible(enemy.x, enemy.y, r + 110)) {
                    const far = enemies.length >= 60 || !cam.isVisible(enemy.x, enemy.y, r + 360);
                    const stride = far ? 3 : 2;
                    if (((this.frameCount + enemy._sepPhase) % stride) !== 0) return;
                    pushMult = Math.min(stride, 2.25);
                }
            }
        }

        const grid = this.enemyGrid;
        const useGrid = grid.source === enemies;
        if (useGrid) grid.syncTail(enemies);

        const myX = enemy.x;
        const myY = enemy.y;
        const myRad = enemy.radius;
        const buf = this._sepBuf;
        const len = useGrid
            ? grid.queryIndices(myX, myY, myRad + grid.maxRadius + 14, buf)
            : enemies.length;

        let appliedPushes = 0;
        for (let i = 0; i < len; i++) {
            const other = useGrid ? enemies[buf[i]] : enemies[i];
            if (!other || other === enemy || other.dead) continue;

            const minDist = myRad + other.radius;
            const edx = myX - other.x;
            if (Math.abs(edx) >= minDist) continue;

            const edy = myY - other.y;
            if (Math.abs(edy) >= minDist) continue;

            const distSq = edx * edx + edy * edy;
            if (distSq > 0 && distSq < minDist * minDist) {
                const edist = Math.sqrt(distSq);
                const push = (minDist - edist) * 0.08 * pushMult;
                enemy.x += (edx / edist) * push;
                enemy.y += (edy / edist) * push;
                appliedPushes++;
                if (appliedPushes >= 5) break;
            }
        }
    }
}

if (typeof window !== 'undefined') window.SpatialHashGrid = SpatialHashGrid;
if (typeof module !== 'undefined' && module.exports) module.exports = { SpatialHashGrid };
