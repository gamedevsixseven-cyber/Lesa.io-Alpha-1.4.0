/**
 * Lesa.io - Hero Skins Registry, Persistence & Visual Overlay Renderer
 * Supports Season 1 Battle Pass unlockable skins:
 *   - psanas  -> 'cyber_neon'     ("Cyber Neon", Tier 5)
 *   - psogas  -> 'inferno_flame'  ("Inferno Flame", Tier 10)
 *   - petros  -> 'biker_midnight' ("Biker Midnight", Tier 15)
 *   - 50balos -> 'gold_drip'      ("24K Gold Drip", Tier 20)
 */

class HeroSkinSystem {
    static STORAGE_UNLOCKED = 'lesaio_unlocked_hero_skins';
    static STORAGE_EQUIPPED = 'lesaio_hero_skins';

    static SKINS = {
        psanas: [
            { id: 'default', name: 'Classic', tier: 0, accent: '#af52de', badge: '#ff4757' },
            { id: 'cyber_neon', name: 'Cyber Neon', tier: 5, accent: '#00f5ff', trim: '#d946ef', badge: '#00f5ff' }
        ],
        psogas: [
            { id: 'default', name: 'Classic', tier: 0, accent: '#eb4d4b', badge: '#eb4d4b' },
            { id: 'inferno_flame', name: 'Inferno Flame', tier: 10, accent: '#ff6b1a', trim: '#fed330', badge: '#ff4757' }
        ],
        petros: [
            { id: 'default', name: 'Classic', tier: 0, accent: '#1e70d6', badge: '#1e70d6' },
            { id: 'biker_midnight', name: 'Biker Midnight', tier: 15, accent: '#ff4785', trim: '#14151a', badge: '#ff4785' }
        ],
        '50balos': [
            { id: 'default', name: 'Classic', tier: 0, accent: '#1162df', badge: '#162c50' },
            { id: 'gold_drip', name: '24K Gold Drip', tier: 20, accent: '#fed330', trim: '#111216', badge: '#f39c12' }
        ],
        psgiannhs: [
            { id: 'default', name: 'Classic', tier: 0, accent: '#3b82f6', badge: '#3b82f6' },
            { id: 'olympian_celestial', name: 'Celestial Titan', tier: 30, accent: '#00f5ff', trim: '#fed330', badge: '#00f5ff' }
        ]
    };

    static _unlocked = null;
    static _equipped = null;

    static _ensureLoaded() {
        if (this._unlocked && this._equipped) return;
        this._unlocked = [];
        this._equipped = {};
        try {
            const rawU = localStorage.getItem(this.STORAGE_UNLOCKED);
            if (rawU) {
                const parsed = JSON.parse(rawU);
                if (Array.isArray(parsed)) this._unlocked = parsed.filter(x => typeof x === 'string');
            }
        } catch (_) {}
        try {
            const rawE = localStorage.getItem(this.STORAGE_EQUIPPED);
            if (rawE) {
                const parsed = JSON.parse(rawE);
                if (parsed && typeof parsed === 'object') this._equipped = parsed;
            }
        } catch (_) {}
    }

    static getState() {
        this._ensureLoaded();
        return { unlocked: [...this._unlocked], equipped: { ...this._equipped } };
    }

    static applyState(state) {
        this._ensureLoaded();
        if (!state || typeof state !== 'object') return;
        if (Array.isArray(state.unlocked)) {
            this._unlocked = Array.from(new Set([...this._unlocked, ...state.unlocked]));
            try { localStorage.setItem(this.STORAGE_UNLOCKED, JSON.stringify(this._unlocked)); } catch (_) {}
        }
        if (state.equipped && typeof state.equipped === 'object') {
            for (const [heroId, skinId] of Object.entries(state.equipped)) {
                if (skinId === 'default' || this.isSkinUnlocked(heroId, skinId)) {
                    this._equipped[heroId] = skinId;
                }
            }
            try { localStorage.setItem(this.STORAGE_EQUIPPED, JSON.stringify(this._equipped)); } catch (_) {}
        }
        this._syncGameState();
    }

    static _syncGameState() {
        if (typeof window === 'undefined') return;
        if (window.GameState && window.GameState.player) {
            if (!window.GameState.player.heroStyles || typeof window.GameState.player.heroStyles !== 'object') {
                window.GameState.player.heroStyles = {};
            }
            Object.assign(window.GameState.player.heroStyles, this._equipped);
            window.GameState.player.unlockedHeroSkins = [...this._unlocked];
        }
        if (window.gameInstance && window.gameInstance.player) {
            const ht = window.gameInstance.player.heroType;
            if (this.SKINS[ht]) window.gameInstance.player.heroSkin = this.getActiveSkin(ht);
        }
    }

    static getSkinKey(heroId, skinId) {
        return `${heroId}:${skinId}`;
    }

    static getSkinMeta(heroId, skinId) {
        const list = this.SKINS[heroId];
        return list ? (list.find(s => s.id === skinId) || list[0]) : null;
    }

    static isSkinUnlocked(heroId, skinId) {
        if (!skinId || skinId === 'default') return true;
        this._ensureLoaded();
        return this._unlocked.includes(this.getSkinKey(heroId, skinId));
    }

    static unlockSkin(heroId, skinId) {
        this._ensureLoaded();
        const key = this.getSkinKey(heroId, skinId);
        const isNew = !this._unlocked.includes(key);
        if (isNew) {
            this._unlocked.push(key);
            try { localStorage.setItem(this.STORAGE_UNLOCKED, JSON.stringify(this._unlocked)); } catch (_) {}
        }
        // Automatically equip newly earned Battle Pass skin for immediate excitement
        this._equipped[heroId] = skinId;
        try { localStorage.setItem(this.STORAGE_EQUIPPED, JSON.stringify(this._equipped)); } catch (_) {}
        this._syncGameState();
        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.emit('heroSkinChanged', { heroId, skinId, unlocked: isNew });
        }
        return isNew;
    }

    static getActiveSkin(heroId, player = null) {
        if (player && player.heroSkin && this.isSkinUnlocked(heroId, player.heroSkin)) {
            return player.heroSkin;
        }
        this._ensureLoaded();
        const saved = this._equipped[heroId];
        if (saved && this.isSkinUnlocked(heroId, saved)) return saved;
        return 'default';
    }

    static setActiveSkin(heroId, skinId) {
        if (!this.isSkinUnlocked(heroId, skinId)) return false;
        this._ensureLoaded();
        this._equipped[heroId] = skinId;
        try { localStorage.setItem(this.STORAGE_EQUIPPED, JSON.stringify(this._equipped)); } catch (_) {}
        this._syncGameState();
        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.emit('heroSkinChanged', { heroId, skinId });
        }
        return true;
    }

    static getLegOverride(heroType, player, base) {
        if (!base) return base;
        const skin = this.getActiveSkin(heroType, player);
        if (skin === 'default') return base;
        const copy = { ...base };
        if (skin === 'cyber_neon') {
            copy.pantsAccent = '#00f5ff';
            copy.shoeAccent = '#00f5ff';
            copy.shoeSole = '#d946ef';
        } else if (skin === 'inferno_flame') {
            copy.pantsColor = '#1c1113';
            copy.pantsAccent = '#ff6b1a';
            copy.shoePrimary = '#7f1d1d';
            copy.shoeAccent = '#fed330';
        } else if (skin === 'biker_midnight') {
            copy.pantsColor = '#111216';
            copy.pantsAccent = '#ff4785';
            copy.shoePrimary = '#111216';
            copy.shoeAccent = '#ff4785';
        } else if (skin === 'gold_drip') {
            copy.pantsColor = '#111216';
            copy.pantsAccent = '#fed330';
            copy.shoeQuarter = '#facc15';
            copy.shoeAccent = '#fed330';
        } else if (skin === 'olympian_celestial') {
            copy.pantsColor = '#0c1633';
            copy.pantsAccent = '#00f5ff';
            copy.shoePrimary = '#0f224d';
            copy.shoeAccent = '#fed330';
            copy.midsoleColor = '#00f5ff';
        }
        return copy;
    }

    static getArmOverride(heroType, player, arm, flash) {
        if (!arm || flash) return arm;
        const skin = this.getActiveSkin(heroType, player);
        if (skin === 'default') return arm;
        if (skin === 'inferno_flame') {
            return { ...arm, sleeveColor: '#8c1d18', sleevePanelColor: '#ff6b1a', sleeveStripeColor: '#fed330', cuffColor: '#450a0a' };
        }
        if (skin === 'biker_midnight') {
            return { ...arm, sleeveColor: '#14151a', sleevePanelColor: '#ff4785', sleeveStripeColor: '#f8fafc', cuffColor: '#090a0d' };
        }
        if (skin === 'gold_drip') {
            return { ...arm, sleeveColor: '#111216', sleevePanelColor: '#eab308', sleeveStripeColor: '#fef08a', cuffColor: '#713f12' };
        }
        if (skin === 'olympian_celestial') {
            return { ...arm, sleeveColor: '#0e1b3d', sleevePanelColor: '#00f5ff', sleeveStripeColor: '#fed330', cuffColor: '#1e3a8a', cuffStripeColor: '#00f5ff' };
        }
        return arm;
    }

    /**
     * Renders bespoke Battle Pass skin torso graphics, trim, visors & aura effects on top of the rigged hero.
     */
    static drawSkinOverlay(player, ctx, r, flash, facingLeft, isBack, heroType) {
        const skin = this.getActiveSkin(heroType, player);
        if (skin === 'default' || flash) return;

        ctx.save();
        const t = Date.now() * 0.005;

        if (skin === 'cyber_neon') {
            // Neon cyan tank chest harness + cyber magenta trim + visor shades
            ctx.strokeStyle = '#00f5ff';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.roundRect(-r * 0.36, -r * 0.44, r * 0.72, r * 0.62, 5);
            ctx.stroke();
            ctx.fillStyle = 'rgba(0, 245, 255, 0.25)';
            ctx.fill();
            if (!isBack) {
                ctx.fillStyle = '#00f5ff';
                ctx.strokeStyle = '#0f172a';
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.roundRect(-r * 0.36, -r * 0.88, r * 0.72, 6.2, 2);
                ctx.fill();
                ctx.stroke();
            }
            ctx.strokeStyle = '#d946ef';
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.arc(0, -r * 1.05, r * 0.42, Math.PI, Math.PI * 2);
            ctx.stroke();
        } else if (skin === 'inferno_flame') {
            // Fiery crimson windbreaker overlay + golden magma stripes + amber flame crown
            ctx.fillStyle = 'rgba(235, 77, 75, 0.58)';
            ctx.strokeStyle = '#450a0a';
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.roundRect(-r * 0.52, -r * 0.44, r * 1.04, r * 0.84, 7);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#fed330';
            ctx.fillRect(-r * 0.50, -r * 0.22, r * 1.00, 5.5);
            ctx.fillStyle = '#ff6b1a';
            ctx.fillRect(-r * 0.50, -r * 0.09, r * 1.00, 5.0);

            if (!isBack) {
                ctx.fillStyle = '#fed330';
                ctx.beginPath();
                ctx.arc(-r * 0.16, -r * 0.82, 2.4, 0, Math.PI * 2);
                ctx.arc(r * 0.16, -r * 0.82, 2.4, 0, Math.PI * 2);
                ctx.fill();
            }
            // Orbiting ember spark
            ctx.fillStyle = Math.sin(t * 2) > 0 ? '#fed330' : '#ff6b1a';
            ctx.beginPath();
            ctx.arc(Math.cos(t) * r * 0.72, -r * 0.45 + Math.sin(t * 2) * 5, 3.0, 0, Math.PI * 2);
            ctx.fill();
        } else if (skin === 'biker_midnight') {
            // Stealth matte-black leather puffer jacket with hot-pink VF185 stripes & shades
            ctx.fillStyle = 'rgba(17, 18, 22, 0.78)';
            ctx.strokeStyle = '#ff4785';
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.roundRect(-r * 0.55, -r * 0.46, r * 1.10, r * 0.86, 8);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ff4785';
            ctx.fillRect(-r * 0.48, -r * 0.26, r * 0.96, 3.5);
            if (!isBack) {
                ctx.fillStyle = '#090a0d';
                ctx.strokeStyle = '#ff4785';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.roundRect(-r * 0.34, -r * 0.88, r * 0.68, 5.5, 2);
                ctx.fill();
                ctx.stroke();
            }
        } else if (skin === 'gold_drip') {
            // 24K Black & Gold Luxury Tracksuit overlay + gold zipper chain & shimmer aura
            ctx.fillStyle = 'rgba(15, 16, 20, 0.76)';
            ctx.strokeStyle = '#fed330';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.roundRect(-r * 0.54, -r * 0.46, r * 1.08, r * 0.82, 8);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#fed330';
            ctx.fillRect(-r * 0.52, -r * 0.42, 5.5, r * 0.74);
            ctx.fillRect(r * 0.52 - 5.5, -r * 0.42, 5.5, r * 0.74);
            if (!isBack) {
                ctx.fillStyle = '#fef08a';
                ctx.beginPath();
                ctx.arc(0, -r * 0.14, 4.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#111216';
                ctx.font = 'bold 6px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('€', 0, -r * 0.14 + 2.2);
            }
            ctx.fillStyle = '#fed330';
            for (let i = 0; i < 2; i++) {
                const ang = t + i * Math.PI;
                ctx.beginPath();
                ctx.arc(Math.cos(ang) * r * 0.78, -r * 0.5 + Math.sin(ang) * 4, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (skin === 'olympian_celestial') {
            // Tier 30 Finale: Cosmic Spectral Mantle Wings, Astral Trident Crest, Halo Crown & Orbiting Starlight
            const pulse = 0.72 + 0.28 * Math.sin(t * 2.1);
            for (const s of [-1, 1]) {
                ctx.fillStyle = `rgba(0, 245, 255, ${0.28 * pulse})`;
                ctx.strokeStyle = '#00f5ff';
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.moveTo(s * r * 0.42, -r * 0.38);
                ctx.quadraticCurveTo(s * r * 0.92, -r * 0.56, s * r * 0.86, r * 0.16);
                ctx.quadraticCurveTo(s * r * 0.62, r * 0.10, s * r * 0.46, r * 0.20);
                ctx.closePath(); ctx.fill(); ctx.stroke();
            }
            ctx.fillStyle = 'rgba(14, 27, 61, 0.82)';
            ctx.strokeStyle = '#00f5ff'; ctx.lineWidth = 2.0;
            ctx.beginPath(); ctx.roundRect(-r * 0.52, -r * 0.45, r * 1.04, r * 0.78, 8); ctx.fill(); ctx.stroke();

            if (!isBack) {
                // Golden Olympus Trident Emblem below chin + Astral Glowing Eyes
                ctx.strokeStyle = '#fed330'; ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.moveTo(0, r * 0.04); ctx.lineTo(0, -r * 0.22);
                ctx.moveTo(-r * 0.13, -r * 0.18); ctx.lineTo(-r * 0.13, -r * 0.10); ctx.lineTo(r * 0.13, -r * 0.10); ctx.lineTo(r * 0.13, -r * 0.18);
                ctx.stroke();

                const fx = facingLeft ? -1.1 : 1.1;
                const eyeY = -r * 0.98;
                ctx.fillStyle = '#00f5ff';
                for (const ex of [fx - 3.6, fx + 3.6]) {
                    ctx.beginPath(); ctx.arc(ex, eyeY, 1.9, 0, Math.PI * 2); ctx.fill();
                }
            }

            // Rotating Cosmic Halo Crown + 3 Orbiting Astral Orbs
            ctx.strokeStyle = '#fed330'; ctx.lineWidth = 2.0;
            ctx.beginPath(); ctx.ellipse(0, -r * 1.28, r * 0.44, r * 0.12, Math.sin(t) * 0.12, 0, Math.PI * 2); ctx.stroke();
            ctx.strokeStyle = '#00f5ff'; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.ellipse(0, -r * 1.28, r * 0.54, r * 0.16, -Math.sin(t) * 0.12, 0, Math.PI * 2); ctx.stroke();

            for (let i = 0; i < 3; i++) {
                const a = t * 1.1 + i * ((Math.PI * 2) / 3);
                ctx.fillStyle = i % 2 === 0 ? '#00f5ff' : '#fed330';
                ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.82, -r * 0.42 + Math.sin(a * 1.7) * r * 0.18, 2.4, 0, Math.PI * 2); ctx.fill();
            }
        }

        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.HeroSkinSystem = HeroSkinSystem;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeroSkinSystem;
}
