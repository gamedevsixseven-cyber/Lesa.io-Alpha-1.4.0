/**
 * Lesa.io - Collectibles & Drops Engine
 * XP Cookies, Milk Bottles / Health Hearts, Magnet Candies, Powerup Stars
 */

class Drop {
    constructor(x, y, type = 'xp', value = 10) {
        this.x = x;
        this.y = y;
        this.type = type; // 'xp', 'heart', 'magnet', 'star', 'shield', 'coin_pouch', 'chrono_core', 'mat_*'
        this.value = value;
        const isMaterial = !!(Drop.MATERIAL_DROP_MAP && Drop.MATERIAL_DROP_MAP[type]);
        this.radius = type === 'xp' ? 12 : (isMaterial ? 15 : 16);
        this.magnetized = false;
        this.pickupDelay = 12;
        this.vx = (Math.random() * 2 - 1) * 3;
        this.vy = (Math.random() * 2 - 1) * 3;
        this.age = Math.random() * 100;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.dead = false;
        this.life = (type === 'chrono_core' || isMaterial) ? 1800 : 1200; // Chrono Cores & Materials persist 30s; standard drops 20s
    }

    update(dt = 1, player = null, effects = null) {
        this.age += dt;
        if (!this._isNetSynced) {
            this.life -= dt;
            if (this.life <= 0) { this.dead = true; return; }
            this.x += this.vx * dt; this.y += this.vy * dt;
            this.vx *= 0.88; this.vy *= 0.88;
        }
        if (this.pickupDelay > 0) { this.pickupDelay -= dt; if (!this.magnetized) return; }

        if (player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distSq = dx * dx + dy * dy;
            const perkMagMult = (typeof window !== 'undefined' && window.perkSystem && typeof window.perkSystem.getMagnetMultiplier === 'function') ? window.perkSystem.getMagnetMultiplier() : 1.0;
            const magDist = (player.magnetRadius + (this.type === 'xp' ? 0 : 30)) * perkMagMult;

            if (distSq < magDist * magDist || this.magnetized) {
                this.magnetized = true;
                const dist = Math.sqrt(distSq);
                const pullSpeed = Math.min(20, 4 + (magDist - dist) * 0.12 + 6);
                if (dist > 0.0001) {
                    const step = (pullSpeed * dt) / dist;
                    this.x += dx * step;
                    this.y += dy * step;
                }

                // Picked up!
                const pickR = player.radius + this.radius;
                if (distSq < pickR * pickR) {
                    this.onCollect(player, effects);
                    this.dead = true;
                }
            }
        }
    }

    onCollect(player, effects) {
        if (this.type === 'xp') {
            player.addXP(this.value);
            const g = window.gameInstance;
            if (g && !g.isCoopGuest && g.coopSession && g.coopSession.net) g.coopSession.net.send('XP_SHARE', { val: this.value });
            if (window.soundEngine) window.soundEngine.playPickup('xp');
            if (effects) effects.addSparks(this.x, this.y, '#ffd32a', 4);
        } else if (this.type === 'heart') {
            const g = (typeof window !== 'undefined') ? window.gameInstance : null;
            const rp = (g && !g.isCoopGuest && g.coopSession && g.coopSession.remotePlayer && !g.coopSession.remotePlayer.isDowned && !g.coopSession.remotePlayer.isDownedDisconnected) ? g.coopSession.remotePlayer : null;
            const heartCoins = (player.hp >= player.maxHp && typeof window !== 'undefined' && window.perkSystem && typeof window.perkSystem.getFullHpHeartCoinValue === 'function')
                ? window.perkSystem.getFullHpHeartCoinValue(player) : 0;
            if (heartCoins > 0) {
                player.coins = (player.coins || 0) + heartCoins;
                if (window.soundEngine) window.soundEngine.playPickup('coin');
                if (effects) { effects.addPopup(this.x, this.y, `+${heartCoins} 🪙 ALCHEMIST`, '#f39c12', 22); effects.addSparks(this.x, this.y, '#f39c12', 8); }
            } else if (player.hp >= player.maxHp && rp && rp.hp < rp.maxHp) {
                const healAmt = this.value || 30;
                rp.hp = Math.min(rp.maxHp, rp.hp + healAmt);
                if (window.soundEngine) window.soundEngine.playPickup('heart');
                if (effects) { effects.addPopup(rp.x, rp.y, `+${healAmt} HP`, '#2ed573', 24); effects.addSparks(rp.x, rp.y, '#2ed573', 8); }
                if (g.coopSession && g.coopSession.net) g.coopSession.net.send('GUEST_DROP_EFFECT', { type: 'heart', amt: healAmt, hp: Math.round(rp.hp), maxHp: Math.round(rp.maxHp) });
            } else {
                player.heal(this.value || 30);
                if (window.soundEngine) window.soundEngine.playPickup('heart');
                if (effects) { effects.addPopup(this.x, this.y, `+${this.value || 30} HP`, '#2ed573', 24); effects.addSparks(this.x, this.y, '#2ed573', 8); }
            }
        } else if (this.type === 'magnet') {
            if (window.soundEngine) window.soundEngine.playPickup('star');
            if (effects) effects.addComicSplash(this.x, this.y, 'MAGNET!');
            if (window.gameInstance) window.gameInstance.vacuumAllXP();
        } else if (this.type === 'star') {
            player.activatePepperFrenzy(7000);
            if (window.soundEngine) window.soundEngine.playPickup('star');
            if (effects) effects.addComicSplash(this.x, this.y, 'FRENZY!');
        } else if (this.type === 'shield') {
            player.addShield();
            if (window.soundEngine) window.soundEngine.playPickup('star');
            if (effects) effects.addComicSplash(this.x, this.y, 'SHIELD!');
        } else if (this.type === 'coin_pouch') {
            const gearGoldMult = (typeof GearPassives !== 'undefined') ? GearPassives.getGoldMultiplier() : 1.0;
            const perkGoldMult = (typeof window !== 'undefined' && window.perkSystem && typeof window.perkSystem.getCoinMultiplier === 'function') ? window.perkSystem.getCoinMultiplier() : 1.0;
            const eventGoldMult = ((typeof EventManager !== 'undefined') ? EventManager.getGoldMultiplier() : 1.0) * ((typeof ClanBuffs !== 'undefined') ? ClanBuffs.getGoldMultiplier() : 1.0);
            const coins = Math.round((this.value || 20) * gearGoldMult * perkGoldMult * eventGoldMult);
            if (window.GameState) window.GameState.addCurrency(coins, 0);
            const g = window.gameInstance;
            if (g) {
                g.coinsEarnedThisRun = (g.coinsEarnedThisRun || 0) + coins;
                if (!g.isCoopGuest && g.coopSession && g.coopSession.net) g.coopSession.net.send('COIN_SHARE', { coins });
            }
            if (window.soundEngine && typeof window.soundEngine.playPickup === 'function') window.soundEngine.playPickup('xp');
            if (effects) {
                effects.addPopup(this.x, this.y, `+${coins} 🪙`, '#ffd32a', 26);
                effects.addSparks(this.x, this.y, '#ffd32a', 8);
                effects.addComicSplash(this.x, this.y - 20, 'GOLD!');
            }
        } else if (this.type === 'chrono_core') {
            const gain = this.value || 1;
            if (typeof WaveSkipperMachine !== 'undefined' && typeof WaveSkipperMachine.grantChronoCore === 'function') {
                WaveSkipperMachine.grantChronoCore(player, gain, effects, this.x, this.y);
            } else {
                player.chronoCores = (player.chronoCores || 0) + gain;
                if (window.soundEngine) window.soundEngine.playPickup('star');
                if (effects) {
                    effects.addPopup(this.x, this.y, `+${gain} CHRONO CORE`, '#00f5ff', 24);
                    effects.addSparks(this.x, this.y, '#00f5ff', 10);
                }
            }
        } else if (Drop.MATERIAL_DROP_MAP && Drop.MATERIAL_DROP_MAP[this.type]) {
            const matId = Drop.MATERIAL_DROP_MAP[this.type];
            const gain = Math.max(1, Math.floor(this.value || 1));
            const matDef = (typeof MaterialRegistry !== 'undefined') ? MaterialRegistry.get(matId) : null;
            if (typeof window !== 'undefined' && window.inventoryManager && typeof window.inventoryManager.addMaterial === 'function') {
                window.inventoryManager.addMaterial(matId, gain, { source: 'arena_drop' });
            }
            if (typeof window !== 'undefined' && window.gameInstance) {
                if (!window.gameInstance.materialsEarnedThisRun) window.gameInstance.materialsEarnedThisRun = {};
                window.gameInstance.materialsEarnedThisRun[matId] = (window.gameInstance.materialsEarnedThisRun[matId] || 0) + gain;
            }
            if (window.soundEngine && typeof window.soundEngine.playPickup === 'function') {
                window.soundEngine.playPickup(matId === 'ambrosia_spark' || matId === 'olympian_bronze' ? 'diamond' : 'star');
            }
            if (effects) {
                const col = matDef ? matDef.color : '#38bdf8';
                const label = matDef ? `+${gain} ${matDef.icon} ${matDef.shortName.toUpperCase()}` : `+${gain} MATERIAL`;
                effects.addPopup(this.x, this.y, label, col, 24);
                effects.addSparks(this.x, this.y, col, 9);
            }
        }

        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.emit('dropCollected', { type: this.type, value: this.value });
        }
    }

    draw(ctx) {
        const bob = Math.sin((this.age * 0.08) + this.bobOffset) * 4;
        const currentY = this.y + bob;
        const blinking = (this.life < 180 && ((this.age / 5) | 0) % 2 === 0);
        const prevAlpha = ctx.globalAlpha;
        if (blinking) ctx.globalAlpha = prevAlpha * 0.4;

        // Cached Drop Shadow
        const shadow = Drop._getShadowSprite(this.radius);
        if (shadow && shadow.canvas) ctx.drawImage(shadow.canvas, this.x - shadow.halfW, this.y + this.radius * 0.8 - shadow.halfH, shadow.w, shadow.h);

        if (this.type === 'chrono_core') {
            ctx.save();
            ctx.translate(this.x, currentY);
            this.drawChronoCore(ctx);
            ctx.restore();
        } else {
            const sprite = Drop._getStaticSprite(this.type, this.radius, this);
            if (sprite) {
                ctx.drawImage(sprite.canvas, this.x - sprite.halfW, currentY - sprite.halfH, sprite.w, sprite.h);
            }
        }

        if (blinking) ctx.globalAlpha = prevAlpha;
    }

    static _getShadowSprite(radius) {
        let cache = Drop._shadowCache;
        if (!cache) cache = Drop._shadowCache = new Map();
        const hit = cache.get(radius);
        if (hit) return hit;

        const dpr = (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile) ? 1.25 : 2;
        const rx = radius * 0.8;
        const ry = radius * 0.35;
        const w = Math.ceil(rx * 2 + 4);
        const h = Math.ceil(ry * 2 + 4);
        const c = document.createElement('canvas');
        c.width = w * dpr;
        c.height = h * dpr;
        const sctx = c.getContext('2d');
        if (!sctx) return null;
        sctx.scale(dpr, dpr);
        sctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        sctx.beginPath();
        sctx.ellipse(w / 2, h / 2, rx, ry, 0, 0, Math.PI * 2);
        sctx.fill();

        const entry = { canvas: c, w, h, halfW: w / 2, halfH: h / 2 };
        cache.set(radius, entry);
        return entry;
    }

    static _getStaticSprite(type, radius, instance) {
        let cache = Drop._spriteCache;
        if (!cache) cache = Drop._spriteCache = new Map();
        const key = `${type}|${radius}`;
        const hit = cache.get(key);
        if (hit) return hit;

        const dpr = (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile) ? 1.25 : 2;
        const logicalSize = Math.ceil(radius * 3.4) + 12;
        const half = logicalSize / 2;
        const c = document.createElement('canvas');
        c.width = logicalSize * dpr;
        c.height = logicalSize * dpr;
        const sctx = c.getContext('2d');
        if (!sctx) return null;
        sctx.scale(dpr, dpr);
        sctx.translate(half, half);

        if (type === 'xp') instance.drawXpCookie(sctx);
        else if (type === 'heart') instance.drawHeart(sctx);
        else if (type === 'magnet') instance.drawMagnet(sctx);
        else if (type === 'star') instance.drawStar(sctx);
        else if (type === 'shield') instance.drawShield(sctx);
        else if (type === 'coin_pouch') instance.drawCoinPouch(sctx);
        else if (Drop.MATERIAL_DROP_MAP && Drop.MATERIAL_DROP_MAP[type]) instance.drawMaterial(sctx, Drop.MATERIAL_DROP_MAP[type]);
        else return null;

        const entry = { canvas: c, w: logicalSize, h: logicalSize, halfW: half, halfH: half };
        cache.set(key, entry);
        return entry;
    }

    drawXpCookie(ctx) {
        const r = this.radius;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#1b1b1b';

        // Chocolate chip cookie
        ctx.fillStyle = '#e58e26';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Choco chips
        ctx.fillStyle = '#4b2a0c';
        const chips = [
            { x: -r * 0.35, y: -r * 0.3, s: 2.5 },
            { x: r * 0.3, y: -r * 0.2, s: 3 },
            { x: 0, y: r * 0.35, s: 2.5 },
            { x: -r * 0.3, y: r * 0.25, s: 2 }
        ];
        for (const c of chips) {
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.s, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawHeart(ctx) {
        const r = this.radius * 1.1;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#1b1b1b';
        ctx.fillStyle = '#ff4757';

        ctx.beginPath();
        const topCurveHeight = r * 0.3;
        ctx.moveTo(0, topCurveHeight);
        ctx.bezierCurveTo(0, 0, -r, 0, -r, topCurveHeight);
        ctx.bezierCurveTo(-r, (r + topCurveHeight) / 1.5, 0, (r + topCurveHeight) * 1.1, 0, r * 1.3);
        ctx.bezierCurveTo(0, (r + topCurveHeight) * 1.1, r, (r + topCurveHeight) / 1.5, r, topCurveHeight);
        ctx.bezierCurveTo(r, 0, 0, 0, 0, topCurveHeight);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // White shine
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-r * 0.4, topCurveHeight * 0.7, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawMagnet(ctx) {
        const r = this.radius;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#1b1b1b';

        // Horseshoe magnet
        ctx.fillStyle = '#eb4d4b';
        ctx.beginPath();
        ctx.arc(0, 0, r, Math.PI, 0, false);
        ctx.lineTo(r, r * 0.6);
        ctx.lineTo(r * 0.5, r * 0.6);
        ctx.lineTo(r * 0.5, 0);
        ctx.arc(0, 0, r * 0.5, 0, Math.PI, true);
        ctx.lineTo(-r * 0.5, r * 0.6);
        ctx.lineTo(-r, r * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Silver tips
        ctx.fillStyle = '#dfe4ea';
        ctx.fillRect(-r, r * 0.2, r * 0.5, r * 0.4);
        ctx.strokeRect(-r, r * 0.2, r * 0.5, r * 0.4);
        ctx.fillRect(r * 0.5, r * 0.2, r * 0.5, r * 0.4);
        ctx.strokeRect(r * 0.5, r * 0.2, r * 0.5, r * 0.4);
    }

    drawStar(ctx) {
        const r = this.radius * 1.2;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#1b1b1b';
        ctx.fillStyle = '#ffa502';

        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * r, -Math.sin((18 + i * 72) * Math.PI / 180) * r);
            ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * (r * 0.45), -Math.sin((54 + i * 72) * Math.PI / 180) * (r * 0.45));
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Comic face on star
        ctx.fillStyle = '#1b1b1b';
        ctx.beginPath();
        ctx.arc(-3, -2, 1.5, 0, Math.PI * 2);
        ctx.arc(3, -2, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#1b1b1b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 1, 3, 0.2, Math.PI - 0.2);
        ctx.stroke();
    }

    drawShield(ctx) {
        const r = this.radius * 1.2;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#1b1b1b';

        // Cartoon Blue Shield
        ctx.fillStyle = '#70a1ff';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-r * 0.35, -r * 0.35, r * 0.25, 0, Math.PI * 2);
        ctx.fill();
    }

    drawCoinPouch(ctx) {
        const r = this.radius * 1.15;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#1b1b1b';

        // Pouch sack body (golden fabric)
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.ellipse(0, 3, r, r * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Pouch neck / gathered ruffled top
        ctx.fillStyle = '#e67e22';
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.7, r * 0.6, r * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Red tied ribbon string
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-r * 0.45, -r * 0.45);
        ctx.lineTo(r * 0.45, -r * 0.45);
        ctx.stroke();

        // Shiny Golden Coin on center
        ctx.fillStyle = '#f1c40f';
        ctx.strokeStyle = '#1b1b1b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 3, r * 0.48, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Coin shine highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-r * 0.16, -r * 0.1, r * 0.12, 0, Math.PI * 2);
        ctx.fill();

        // Inner coin ring
        ctx.strokeStyle = '#d68910';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 3, r * 0.35, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawChronoCore(ctx) {
        const r = this.radius * 1.15;
        const spin = this.age * 0.055;
        const pulse = 0.78 + Math.sin(this.age * 0.14) * 0.22;

        // Soft glowing time-warp halo
        ctx.fillStyle = `rgba(0, 245, 255, ${0.26 * pulse})`;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.38, 0, Math.PI * 2);
        ctx.fill();

        // Rotating bronze/gold chrono cog rim
        ctx.save();
        ctx.rotate(spin);
        ctx.fillStyle = '#fed330';
        ctx.strokeStyle = '#1b1b1b';
        ctx.lineWidth = 2.2;
        for (let i = 0; i < 4; i++) {
            const a = i * (Math.PI / 2);
            ctx.beginPath();
            ctx.arc(Math.cos(a) * r * 0.88, Math.sin(a) * r * 0.88, 3.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        ctx.strokeStyle = '#0984e3';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Central faceted Chrono Crystal Core
        ctx.strokeStyle = '#1b1b1b';
        ctx.lineWidth = 2.5;
        ctx.fillStyle = '#00d2d3';
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.82);
        ctx.lineTo(r * 0.62, 0);
        ctx.lineTo(0, r * 0.82);
        ctx.lineTo(-r * 0.62, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Hourglass highlight glint inside crystal
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-r * 0.24, -r * 0.28);
        ctx.lineTo(r * 0.24, -r * 0.28);
        ctx.lineTo(0, 0);
        ctx.lineTo(r * 0.20, r * 0.26);
        ctx.lineTo(-r * 0.20, r * 0.26);
        ctx.closePath();
        ctx.fill();
    }

    drawMaterial(ctx, matId) {
        const r = this.radius * 1.1;
        const matDef = (typeof MaterialRegistry !== 'undefined') ? MaterialRegistry.get(matId) : null;
        const col = matDef ? matDef.color : '#38bdf8';

        // Soft glowing rarity backing ring (baked once in sprite cache)
        ctx.fillStyle = matDef ? matDef.glowColor : 'rgba(56, 189, 248, 0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.32, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#1a1d2b';
        ctx.lineWidth = 2.4;

        if (matId === 'armory_shards') {
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.moveTo(-r * 0.9, r * 0.2);
            ctx.lineTo(-r * 0.3, -r * 0.9);
            ctx.lineTo(r * 0.2, -r * 0.3);
            ctx.lineTo(-r * 0.2, r * 0.7);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#0ea5e9';
            ctx.beginPath();
            ctx.moveTo(-r * 0.1, r * 0.85);
            ctx.lineTo(r * 0.25, -r * 0.5);
            ctx.lineTo(r * 0.85, -r * 0.1);
            ctx.lineTo(r * 0.55, r * 0.85);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(r * 0.45, -r * 0.45, 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (matId === 'mati_crystal') {
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#1d4ed8';
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.46, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2);
            ctx.fill();
        } else if (matId === 'olympian_bronze') {
            ctx.fillStyle = '#d97706';
            ctx.beginPath();
            ctx.moveTo(-r * 0.85, r * 0.55);
            ctx.lineTo(-r * 0.65, -r * 0.55);
            ctx.lineTo(r * 0.65, -r * 0.55);
            ctx.lineTo(r * 0.85, r * 0.55);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.moveTo(-r * 0.6, -r * 0.55);
            ctx.lineTo(r * 0.6, -r * 0.55);
            ctx.lineTo(r * 0.45, -r * 0.12);
            ctx.lineTo(-r * 0.45, -r * 0.12);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#a855f7';
            ctx.beginPath();
            ctx.moveTo(0, -r * 0.05);
            ctx.lineTo(r * 0.22, r * 0.22);
            ctx.lineTo(0, r * 0.48);
            ctx.lineTo(-r * 0.22, r * 0.22);
            ctx.closePath();
            ctx.fill();
        } else {
            // Ambrosia Spark crystal vial
            ctx.fillStyle = '#fdf4ff';
            ctx.beginPath();
            ctx.moveTo(-r * 0.35, -r * 0.65);
            ctx.lineTo(r * 0.35, -r * 0.65);
            ctx.lineTo(r * 0.72, r * 0.15);
            ctx.lineTo(r * 0.48, r * 0.85);
            ctx.lineTo(-r * 0.48, r * 0.85);
            ctx.lineTo(-r * 0.72, r * 0.15);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = col;
            ctx.fillRect(-r * 0.42, r * 0.05, r * 0.84, r * 0.65);
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(0, -r * 0.72, r * 0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
    }
}

Drop.MATERIAL_DROP_MAP = {
    mat_armory_shards: 'armory_shards',
    mat_mati_crystal: 'mati_crystal',
    mat_olympian_bronze: 'olympian_bronze',
    mat_ambrosia_spark: 'ambrosia_spark'
};
