/**
 * Lesa.io - Hero Star-Blessing System (Alpha 1.6)
 * Permanently infuses unlocked heroes with an Olympian Star-Stone:
 *   - +10% Max HP, +10% Damage, +10% Move Speed
 *   - 1x Automatic Star-Shield Revival per match (restores 50% HP + Aegis Shield)
 *   - Radiant Golden Constellation Halo in gameplay & Star-Blessed Roster badge
 */

class HeroStarBlessing {
    static STORAGE_KEY = 'lesaio_star_blessed_heroes';
    static STAT_BONUS = 1.10; // +10% Max HP, Damage & Speed

    static _sanitizeList(raw) {
        if (!Array.isArray(raw)) return [];
        const out = [];
        for (const id of raw) {
            if (typeof id === 'string' && id && !out.includes(id)) out.push(id);
        }
        return out;
    }

    static getBlessedList() {
        const gs = (typeof window !== 'undefined' && window.GameState && window.GameState.player) ? window.GameState.player : null;
        if (gs && Array.isArray(gs.starBlessedHeroes)) return this._sanitizeList(gs.starBlessedHeroes);
        if (typeof localStorage !== 'undefined') {
            try { return this._sanitizeList(JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]')); } catch (_) {}
        }
        return [];
    }

    static setBlessedList(rawList) {
        const clean = this._sanitizeList(rawList);
        if (typeof window !== 'undefined' && window.GameState && window.GameState.player) {
            window.GameState.player.starBlessedHeroes = clean;
        }
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(clean));
        }
        return clean;
    }

    static isBlessed(heroId) {
        return !!heroId && this.getBlessedList().includes(heroId);
    }

    static canBlessHero(heroId) {
        if (!heroId || this.isBlessed(heroId)) return false;
        const unlocked = (typeof window !== 'undefined' && window.GameState && window.GameState.player && Array.isArray(window.GameState.player.unlockedHeroes))
            ? window.GameState.player.unlockedHeroes
            : ['psanas'];
        return unlocked.includes(heroId);
    }

    static blessHero(heroId) {
        if (!heroId) return { success: false, reason: 'Invalid hero.' };
        if (this.isBlessed(heroId)) return { success: false, reason: 'Hero is already Star-Blessed!' };
        if (!this.canBlessHero(heroId)) return { success: false, reason: 'Unlock this hero first!' };
        const stones = (typeof DungeonManager !== 'undefined') ? DungeonManager.getOlympianStarStones() : 0;
        if (stones < 1) return { success: false, reason: 'Requires 1x Olympian Star-Stone (Zeus 0.8% / W40 Boss 1.5%)!' };
        if (!DungeonManager.spendOlympianStarStone(1)) return { success: false, reason: 'Requires 1x Olympian Star-Stone!' };

        const next = this.getBlessedList();
        next.push(heroId);
        const saved = this.setBlessedList(next);

        if (typeof GearManager !== 'undefined' && typeof GearManager.syncPlayerStats === 'function') {
            GearManager.syncPlayerStats();
        }
        if (typeof window !== 'undefined') {
            if (window.soundEngine && typeof window.soundEngine.playLevelUp === 'function') window.soundEngine.playLevelUp();
            if (window.EventBus) window.EventBus.emit('starBlessingUpdated', { heroId, starBlessedHeroes: saved });
            if (window.SaveManager && typeof window.SaveManager.saveNow === 'function') window.SaveManager.saveNow();
            if (window.modalManager && typeof window.modalManager.showQuickToast === 'function') {
                window.modalManager.showQuickToast(`🌟 ${heroId.toUpperCase()} STAR-BLESSED! (+10% Stats & 1x Match Revive)`, 2600);
            }
        }
        return { success: true, starBlessedHeroes: saved };
    }

    static applyPlayerBlessing(player) {
        if (!player || !this.isBlessed(player.heroType)) return false;
        player._starBlessed = true;
        const prevMax = Math.max(1, player.maxHp || 100);
        const wasFull = player.hp === undefined || player.hp >= prevMax;
        player.maxHp = Math.round(prevMax * this.STAT_BONUS);
        player.hp = wasFull ? player.maxHp : Math.min(player.maxHp, Math.round((player.hp / prevMax) * player.maxHp));
        player.baseSpeed = Math.min(7.5, Number(((player.baseSpeed || 5.0) * this.STAT_BONUS).toFixed(3)));
        player.speed = player.baseSpeed;
        player.damageMultiplier = Number(((player.damageMultiplier || 1.0) * this.STAT_BONUS).toFixed(4));
        return true;
    }

    static tryStarRevive(player, effects = null) {
        if (!player || player.hp > 0 || player._starReviveUsed || !this.isBlessed(player.heroType)) return false;
        player._starReviveUsed = true;
        player.hp = Math.max(1, Math.round((player.maxHp || 100) * 0.50));
        player.shieldActive = true;
        player.invulnerableTimer = Math.max(player.invulnerableTimer || 0, 120);
        player.hitFlash = 14;

        if (typeof window !== 'undefined' && window.soundEngine && typeof window.soundEngine.playLevelUp === 'function') {
            window.soundEngine.playLevelUp();
        }
        if (effects) {
            if (typeof effects.addShockwave === 'function') effects.addShockwave(player.x, player.y, 135, 'rgba(255, 211, 42, 0.92)');
            if (typeof effects.addConfetti === 'function') effects.addConfetti(player.x, player.y, 70);
            if (typeof effects.addComicSplash === 'function') effects.addComicSplash(player.x, player.y - 36, '★ STAR REVIVE!', '#ffd32a', 26, true);
        }
        return true;
    }

    static drawBlessingAura(player, ctx, r, flash) {
        if (!player || flash) return;
        const blessed = (typeof RemotePlayer !== 'undefined' && player instanceof RemotePlayer)
            ? !!player.isStarBlessed
            : this.isBlessed(player.heroType);
        if (!blessed) return;

        const t = Date.now() * 0.004;
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 211, 42, 0.72)';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.ellipse(0, r * 0.35, r * 0.84, r * 0.30, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        for (let i = 0; i < 2; i++) {
            const a = t + i * Math.PI;
            const sx = Math.cos(a) * r * 0.82;
            const sy = -r * 0.34 + Math.sin(a * 1.6) * r * 0.24;
            ctx.fillStyle = i === 0 ? '#ffd32a' : '#fff3a1';
            ctx.strokeStyle = '#14151a';
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.arc(sx, sy, 2.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }
}

if (typeof window !== 'undefined') window.HeroStarBlessing = HeroStarBlessing;
if (typeof module !== 'undefined' && module.exports) module.exports = { HeroStarBlessing };
