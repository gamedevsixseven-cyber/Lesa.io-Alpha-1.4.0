/**
 * Lesa.io - Arena Obstacles & Interactive Props
 * Destructible Crates, Bouncy Mushrooms, and Stealth Bushes
 */

class Obstacle {
    constructor(x, y, type = 'crate') {
        this.x = x;
        this.y = y;
        this.type = type; // 'crate', 'barrel', 'mushroom', 'bush', 'tree'
        this.radius = type === 'tree' ? 36 : (type === 'crate' ? 26 : (type === 'barrel' ? 24 : (type === 'mushroom' ? 24 : 32)));
        this.maxHp = (type === 'tree' || type === 'mushroom' || type === 'bush') ? 99999 : (type === 'crate' ? 40 : 35);
        this.hp = this.maxHp;
        this.hitFlash = 0;
        this.dead = false;
        this.bounceScale = 1.0;
        this.bounceCooldown = 0;
    }

    takeDamage(amount, effects = null, game = null) {
        if (this.type !== 'crate' && this.type !== 'barrel') return false;

        this.hp -= amount;
        this.hitFlash = 6;
        if (effects) {
            effects.addSparks(this.x, this.y, this.type === 'barrel' ? '#ff4757' : '#d28c38', 4);
        }

        if (this.hp <= 0) {
            this.dead = true;

            if (this.type === 'barrel') {
                this.explode(effects, game);
                return true;
            }

            if (window.soundEngine) {
                window.soundEngine.playCrateBreak();
            }
            if (effects) {
                effects.addDust(this.x, this.y, 8, 14);
                effects.addSparks(this.x, this.y, '#e58e26', 8);
            }
            if (typeof window !== 'undefined' && window.perkSystem && typeof window.perkSystem.onCrateDestroyed === 'function') {
                window.perkSystem.onCrateDestroyed(this, game || window.gameInstance);
            }
            return true; // Destroyed!
        }
        return false;
    }

    explode(effects = null, game = null) {
        if (window.soundEngine) {
            if (typeof window.soundEngine.playTntExplosion === 'function') {
                window.soundEngine.playTntExplosion();
            } else if (typeof window.soundEngine.playFatmirSlam === 'function') {
                window.soundEngine.playFatmirSlam();
            } else if (typeof window.soundEngine.playHit === 'function') {
                window.soundEngine.playHit(false, true);
            }
        }

        if (effects) {
            effects.addShockwave(this.x, this.y, 160, 'rgba(255, 71, 87, 0.95)');
            effects.addComicSplash(this.x, this.y - 30, 'BOOM!');
            effects.addSparks(this.x, this.y, '#ff4757', 12);
            effects.addSparks(this.x, this.y, '#ffa502', 10);
            effects.addDust(this.x, this.y, 8, 16);
        }

        const activeGame = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        if (activeGame) {
            if (activeGame.camera) activeGame.camera.addShake(16);
            if (activeGame.isCoopGuest) return;

            const blastRadius = 175;
            const blastRadiusSq = blastRadius * blastRadius;

            // Damage nearby enemies for 250 AoE damage
            if (activeGame.enemies) {
                const visitBlast = (e) => {
                    if (!e || e.dead) return;
                    const dx = e.x - this.x;
                    const dy = e.y - this.y;
                    if (dx * dx + dy * dy <= blastRadiusSq) {
                        e.takeDamage(250, effects);
                        const dist = Math.hypot(dx, dy) || 1;
                        e.x += (dx / dist) * 35;
                        e.y += (dy / dist) * 35;
                    }
                };
                if (typeof SpatialHashGrid !== 'undefined') SpatialHashGrid.forEachEnemyNear(this.x, this.y, blastRadius, activeGame.enemies, visitBlast);
                else for (let i = 0; i < activeGame.enemies.length; i++) visitBlast(activeGame.enemies[i]);
            }

            // Damage player & co-op partner if standing too close
            if (activeGame.player && activeGame.player.hp > 0) {
                const pdx = activeGame.player.x - this.x;
                const pdy = activeGame.player.y - this.y;
                if (pdx * pdx + pdy * pdy <= 110 * 110) {
                    activeGame.player.takeDamage(25, effects, activeGame.camera);
                }
            }
            const rps = (activeGame.coopSession && (activeGame.coopSession.remotePlayers || (activeGame.coopSession.remotePlayer ? [activeGame.coopSession.remotePlayer] : []))) || [];
            for (let ri = 0; ri < rps.length; ri++) {
                const rp = rps[ri];
                if (rp && !rp.isDowned && !rp.isDownedDisconnected) {
                    const rdx = rp.x - this.x, rdy = rp.y - this.y;
                    if (rdx * rdx + rdy * rdy <= 110 * 110) rp.takeDamage(25, effects, activeGame.camera);
                }
            }

            // Chain reaction with adjacent barrels
            if (activeGame.arena && activeGame.arena.obstacles) {
                for (let oi = 0; oi < activeGame.arena.obstacles.length; oi++) {
                    const other = activeGame.arena.obstacles[oi];
                    if (other !== this && !other.dead && other.type === 'barrel') {
                        const odx = other.x - this.x;
                        const ody = other.y - this.y;
                        if (odx * odx + ody * ody <= 150 * 150) {
                            setTimeout(() => {
                                if (!other.dead) other.takeDamage(100, effects, activeGame);
                            }, 120);
                        }
                    }
                }
            }

            // Spawn reward drops from barrel
            if (activeGame.drops) {
                activeGame.drops.push(new Drop(this.x, this.y, 'xp', 35));
                activeGame.drops.push(new Drop(this.x + 15, this.y - 10, 'xp', 25));
                if (Math.random() < 0.4) activeGame.drops.push(new Drop(this.x - 15, this.y, 'heart', 30));
                if (Math.random() < 0.25) activeGame.drops.push(new Drop(this.x, this.y + 15, 'star', 1));
            }
        }
    }

    triggerMushroom(entity, effects = null) {
        if (this.type !== 'mushroom' || this.bounceCooldown > 0) return;

        this.bounceCooldown = 25;
        this.bounceScale = 1.5;
        if (window.soundEngine && typeof window.soundEngine.playMushroomBounce === 'function') {
            window.soundEngine.playMushroomBounce();
        }

        // Launch entity in current direction or random angle
        const angle = entity.angle !== undefined ? entity.angle : Math.random() * Math.PI * 2;
        entity.vx = Math.cos(angle) * 16;
        entity.vy = Math.sin(angle) * 16;

        if (effects) {
            effects.addComicSplash(this.x, this.y - 20, 'BOING!');
            effects.addShockwave(this.x, this.y, 70, 'rgba(255, 107, 129, 0.8)');
        }
    }

    update(dt = 1) {
        if (this.hitFlash > 0) this.hitFlash -= dt;
        if (this.bounceCooldown > 0) this.bounceCooldown -= dt;
        if (this.bounceScale > 1.0) {
            this.bounceScale -= 0.05 * dt;
            if (this.bounceScale < 1.0) this.bounceScale = 1.0;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Shadow (trees, bushes, and buildings draw their own tailored 2.5D ground shadow)
        if (!this.isOlympianPillar && !this.isObsidianPillar && this.type !== 'tree' && this.type !== 'bush' && this.type !== 'building') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
            ctx.beginPath();
            ctx.ellipse(0, this.radius * 0.75, this.radius * 0.9, this.radius * 0.35, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.olympusStyle && this.drawOlympusProp(ctx)) {
            ctx.restore();
            return;
        }

        if (this.isObsidianPillar && typeof EndlessHardMap !== 'undefined') {
            EndlessHardMap.drawPillar(ctx, this);
        } else if ((this.isCaveWall || this.isCaveProp) && typeof CaveZoneMap !== 'undefined') {
            CaveZoneMap.drawObstacle(ctx, this);
        } else if (this.isHardProp && typeof EndlessHardMap !== 'undefined' && EndlessHardMap.drawProp(ctx, this)) {
        } else if (this.isOlympianPillar) {
            this.drawOlympianPillar(ctx);
        } else if (this.type === 'building') {
            this.drawBuilding(ctx);
        } else if (this.type === 'crate') {
            this.drawCrate(ctx);
            if (this.isSnowy) this.drawSnowCap(ctx, this.radius * 1.6);
        } else if (this.type === 'barrel') {
            this.drawBarrel(ctx);
            if (this.isSnowy) this.drawSnowCap(ctx, this.radius * 1.5);
        } else if (this.type === 'mushroom') {
            this.drawMushroom(ctx);
        } else if (this.type === 'bush') {
            this.drawBush(ctx);
        } else if (this.type === 'tree') {
            this.drawTree(ctx);
        }

        ctx.restore();
    }

    drawOlympianPillar(ctx) {
        const w = 46;
        const h = 130;
        const halfW = w / 2;

        // Ground shadow
        ctx.fillStyle = 'rgba(15, 25, 35, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, 8, 38, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // White/Gold Marble Column Shaft
        ctx.fillStyle = '#f8f9fa';
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(-halfW, -h, w, h, 6);
        ctx.fill();
        ctx.stroke();

        // Column fluting vertical grooves
        ctx.strokeStyle = 'rgba(218, 165, 32, 0.45)';
        ctx.lineWidth = 2.5;
        for (let x = -halfW + 8; x <= halfW - 8; x += 10) {
            ctx.beginPath();
            ctx.moveTo(x, -h + 14);
            ctx.lineTo(x, -10);
            ctx.stroke();
        }

        // Capital & Base (Gold trim)
        ctx.fillStyle = '#f1c40f';
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 3;
        ctx.fillRect(-halfW - 6, -h - 6, w + 12, 14);
        ctx.strokeRect(-halfW - 6, -h - 6, w + 12, 14);

        ctx.fillRect(-halfW - 4, -8, w + 8, 12);
        ctx.strokeRect(-halfW - 4, -8, w + 8, 12);
    }

    drawOlympusProp(ctx) {
        if (typeof OlympusAssets === 'undefined') return false;
        const specs = {
            olive_tree: { key: 'olive_tree', w: 210, h: 210, anchorY: 0.72, sx: 0.36, sy: 0.12, syOff: 12 },
            snow_pine: { key: 'snow_pine', w: 205, h: 215, anchorY: 0.76, sx: 0.35, sy: 0.12, syOff: 10 },
            pillar: { key: 'olympus_pillar', w: 132, h: 176, anchorY: 0.80, sx: 0.32, sy: 0.11, syOff: 8 },
            boulder: { key: 'olympus_boulder', w: 126, h: 118, anchorY: 0.62, sx: 0.42, sy: 0.16, syOff: 12 },
            brazier: { key: 'olympus_brazier', w: 112, h: 128, anchorY: 0.72, sx: 0.34, sy: 0.12, syOff: 8 }
        };
        const s = specs[this.olympusStyle];
        if (!s) return false;

        if (this.olympusStyle === 'brazier') {
            let glow = Obstacle._brazierGlow;
            if (!glow) {
                const c = document.createElement('canvas');
                c.width = 128;
                c.height = 128;
                const gctx = c.getContext('2d');
                if (gctx) {
                    const g = gctx.createRadialGradient(64, 64, 6, 64, 64, 64);
                    g.addColorStop(0, 'rgba(255, 196, 64, 0.42)');
                    g.addColorStop(1, 'rgba(255, 140, 20, 0)');
                    gctx.fillStyle = g;
                    gctx.beginPath();
                    gctx.arc(64, 64, 64, 0, Math.PI * 2);
                    gctx.fill();
                    glow = Obstacle._brazierGlow = c;
                }
            }
            if (glow) {
                const pulse = 0.82 + Math.sin(Date.now() * 0.008 + this.x) * 0.18;
                const gr = 84 * pulse;
                ctx.drawImage(glow, -gr, -34 - gr, gr * 2, gr * 2);
            }
        }

        return OlympusAssets.drawCenteredSprite(ctx, s.key, 0, 0, s.w, s.h, {
            anchorY: s.anchorY,
            shadow: true,
            shadowScaleX: s.sx,
            shadowScaleY: s.sy,
            shadowOffsetY: s.syOff
        });
    }

    drawSnowCap(ctx, width) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -width * 0.45, width * 0.55, Math.PI, 0);
        ctx.quadraticCurveTo(width * 0.25, -width * 0.35, 0, -width * 0.4);
        ctx.quadraticCurveTo(-width * 0.25, -width * 0.35, -width * 0.55, -width * 0.45);
        ctx.fill();
    }

    drawCrate(ctx) {
        const size = this.radius * 1.6;
        const half = size / 2;

        ctx.lineWidth = 3;
        ctx.strokeStyle = '#1b1b1b';
        ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : '#cc8e35';

        // Outer wooden box
        ctx.fillRect(-half, -half, size, size);
        ctx.strokeRect(-half, -half, size, size);

        // Inner X planks
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#9c6615';
        ctx.beginPath();
        ctx.moveTo(-half + 4, -half + 4);
        ctx.lineTo(half - 4, half - 4);
        ctx.moveTo(half - 4, -half + 4);
        ctx.lineTo(-half + 4, half - 4);
        ctx.stroke();

        // Corner iron brackets
        ctx.fillStyle = '#57606f';
        ctx.fillRect(-half, -half, 6, 6);
        ctx.fillRect(half - 6, -half, 6, 6);
        ctx.fillRect(-half, half - 6, 6, 6);
        ctx.fillRect(half - 6, half - 6, 6, 6);
    }

    drawMushroom(ctx) {
        ctx.scale(this.bounceScale, 2 - this.bounceScale);
        const r = this.radius;

        // White Stem
        ctx.fillStyle = '#f1f2f6';
        ctx.strokeStyle = '#1b1b1b';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.rect(-r * 0.3, 0, r * 0.6, r * 0.8);
        ctx.fill();
        ctx.stroke();

        // Red Polka-dot Mushroom Cap
        ctx.fillStyle = '#ff4757';
        ctx.beginPath();
        ctx.arc(0, 0, r, Math.PI, 0, false);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // White Spots
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -r * 0.5, r * 0.22, 0, Math.PI * 2);
        ctx.arc(-r * 0.5, -r * 0.2, r * 0.16, 0, Math.PI * 2);
        ctx.arc(r * 0.5, -r * 0.2, r * 0.16, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBush(ctx) {
        if (typeof FoliageRenderer !== 'undefined') {
            FoliageRenderer.drawSmallTree(this, ctx, 1.0);
        }
    }

    drawBarrel(ctx) {
        const r = this.radius;
        const w = r * 1.5;
        const h = r * 1.8;
        const halfW = w / 2;
        const halfH = h / 2;

        ctx.lineWidth = 3;
        ctx.strokeStyle = '#1e272e';

        // Red explosive drum body
        ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : '#ff4757';
        ctx.beginPath();
        ctx.roundRect(-halfW, -halfH, w, h, 6);
        ctx.fill();
        ctx.stroke();

        // Dark metal reinforcement hoops
        ctx.fillStyle = '#2f3542';
        ctx.fillRect(-halfW + 1, -halfH + 6, w - 2, 5);
        ctx.fillRect(-halfW + 1, halfH - 11, w - 2, 5);

        // Yellow & Black Diagonal Hazard Stripes Center Band
        ctx.save();
        ctx.beginPath();
        ctx.rect(-halfW + 2, -6, w - 4, 12);
        ctx.clip();

        ctx.fillStyle = '#fed330';
        ctx.fillRect(-halfW + 2, -6, w - 4, 12);

        ctx.fillStyle = '#2f3542';
        for (let x = -halfW - 10; x < halfW + 15; x += 10) {
            ctx.beginPath();
            ctx.moveTo(x, -6);
            ctx.lineTo(x + 5, -6);
            ctx.lineTo(x, 6);
            ctx.lineTo(x - 5, 6);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        // White warning flame icon or exclamation
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 12px "Luckiest Guy", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TNT', 0, -halfH + 16);

        // Highlight sheen
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillRect(-halfW + 3, -halfH + 3, 3, h - 6);
    }

    static treeImage = null;
    static _scaledTreeCanvas = null;
    static _charredTreeCanvas = null;
    static getTreeImage() {
        const src = 'assets/GameWorldModels/UpdatedTreeLESAIO_transparent.png';
        const resetTreeCache = () => {
            Obstacle._scaledTreeCanvas = null;
            Obstacle._charredTreeCanvas = null;
        };
        if (!Obstacle.treeImage && typeof Image !== 'undefined') {
            const img = new Image();
            if (typeof MobileAssetGuard !== 'undefined') {
                MobileAssetGuard.attachImageRetry(img, src, resetTreeCache);
            }
            img.src = src;
            Obstacle.treeImage = img;
        } else if (Obstacle.treeImage && typeof MobileAssetGuard !== 'undefined') {
            MobileAssetGuard.ensureImageReady(Obstacle.treeImage, src, resetTreeCache);
        }
        return Obstacle.treeImage;
    }

    static getScaledTreeSprite() {
        const targetW = (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile) ? MobilePerf.getPreset().treeSize : 324;
        if (Obstacle._scaledTreeCanvas && Obstacle._scaledTreeCanvas.width === targetW) {
            return Obstacle._scaledTreeCanvas;
        }
        const img = Obstacle.getTreeImage();
        if (!img || !img.complete || img.naturalWidth <= 0) return null;
        // Pre-downsample 1254x1254 tree once at tier-appropriate resolution (High mobile uses crisp 460px)
        const c = document.createElement('canvas');
        c.width = targetW;
        c.height = Math.round(targetW * (316 / 324));
        const tctx = c.getContext('2d');
        if (!tctx) {
            if (typeof MobilePerf !== 'undefined') MobilePerf.releaseCanvas(c);
            return null;
        }
        tctx.imageSmoothingEnabled = true;
        tctx.imageSmoothingQuality = (typeof MobilePerf !== 'undefined' && MobilePerf.isHighGraphics()) ? 'high' : 'medium';
        tctx.drawImage(img, 0, 0, c.width, c.height);
        Obstacle._scaledTreeCanvas = c;
        return c;
    }

    static getCharredTreeSprite() {
        const base = Obstacle.getScaledTreeSprite();
        if (!base) return null;
        if (Obstacle._charredTreeCanvas && Obstacle._charredTreeCanvas.width === base.width) {
            return Obstacle._charredTreeCanvas;
        }
        const c = document.createElement('canvas');
        c.width = base.width;
        c.height = base.height;
        const tctx = c.getContext('2d');
        if (!tctx) {
            if (typeof MobilePerf !== 'undefined') MobilePerf.releaseCanvas(c);
            return null;
        }
        tctx.drawImage(base, 0, 0);
        tctx.globalCompositeOperation = 'source-atop';
        tctx.fillStyle = 'rgba(72, 22, 12, 0.72)';
        tctx.fillRect(0, 0, c.width, c.height);
        tctx.globalCompositeOperation = 'source-over';
        Obstacle._charredTreeCanvas = c;
        return c;
    }

    hitTestCircle(cx, cy, cr) {
        if (this.isCaveWall && typeof CaveZoneMap !== 'undefined') {
            return CaveZoneMap.intersectRectCircle(this, cx, cy, cr);
        }
        if (this.type === 'building' && typeof EndlessBuildingRenderer !== 'undefined') {
            return EndlessBuildingRenderer.intersectCircle(this, cx, cy, cr);
        }
        const odx = cx - this.x;
        const ody = cy - this.y;
        const radSum = cr + this.radius;
        if (odx * odx + ody * ody >= radSum * radSum) return null;
        const dist = Math.hypot(odx, ody) || 1;
        const nx = odx / dist;
        const ny = ody / dist;
        return { pushX: this.x + nx * radSum, pushY: this.y + ny * radSum, nx, ny };
    }

    isPlayerBehind(player) {
        if (this.type === 'building') {
            const hw = (this.halfW || 68) + 22;
            const rh = (this.roofHeight || 105) + 18;
            return Math.abs(player.x - this.x) < hw && player.y < this.y && player.y > this.y - rh;
        }
        const dx = player.x - this.x;
        const dy = player.y - (this.y - 70);
        return (dx * dx + dy * dy < 85 * 85);
    }

    drawBuilding(ctx) {
        if (typeof EndlessBuildingRenderer !== 'undefined') {
            EndlessBuildingRenderer.draw(this, ctx);
        }
    }

    drawTree(ctx) {
        const sprite = Obstacle.getScaledTreeSprite();
        // 2.5D Scale: 215px wide by 210px tall
        const w = 215;
        const h = 210;
        // Align bottom trunk center with this.x, this.y
        const drawX = -w * 0.5;
        const drawY = -h * 0.86;
        const burn = (typeof EndlessMapEvolution !== 'undefined' && !this.isOlympianPillar && !this.olympusStyle)
            ? EndlessMapEvolution.getTreeBurnRatio()
            : 0;
        const onFire = (typeof EndlessMapEvolution !== 'undefined' && EndlessMapEvolution.isTreeOnFire(this));

        // Soft natural ground shadow under trunk base (richer soft canopy penumbra in High mobile mode)
        if (typeof MobilePerf !== 'undefined' && MobilePerf.isHighGraphics()) {
            ctx.fillStyle = 'rgba(14, 36, 12, 0.16)';
            ctx.beginPath();
            ctx.ellipse(0, 8, 66, 22, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = burn > 0.3 ? 'rgba(26, 16, 14, 0.36)' : 'rgba(20, 45, 15, 0.30)';
        ctx.beginPath();
        ctx.ellipse(0, 4, 38, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        if (sprite) {
            ctx.drawImage(sprite, drawX, drawY, w, h);
            if (burn > 0.05) {
                const charred = Obstacle.getCharredTreeSprite();
                if (charred) {
                    ctx.save();
                    ctx.globalAlpha = Math.min(1, burn);
                    ctx.drawImage(charred, drawX, drawY, w, h);
                    ctx.restore();
                }
            }
        } else if (typeof FoliageRenderer !== 'undefined') {
            // Crisp procedural tree fallback while image finishes loading
            FoliageRenderer.drawSmallTree(this, ctx, 1.85);
        }

        if (onFire && typeof EndlessBuildingRenderer !== 'undefined') {
            const now = (typeof Date !== 'undefined' ? Date.now() : 0) * 0.001;
            const fireLvl = EndlessMapEvolution.fireLevel || 0.6;
            EndlessBuildingRenderer.drawComicFireCluster(ctx, -28, -96, 22 * (0.7 + fireLvl * 0.35), now + this.x * 0.02);
            EndlessBuildingRenderer.drawComicFireCluster(ctx, 22, -118, 20 * (0.7 + fireLvl * 0.35), now * 1.12 + this.y * 0.02);
        }
    }
}
