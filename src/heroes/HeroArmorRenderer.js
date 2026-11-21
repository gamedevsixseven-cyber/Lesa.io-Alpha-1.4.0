/**
 * Lesa.io - Hero Armor Visual Coordinator
 * Resolves equipped `armor` item live for local players and replicated partners,
 * updates arm/sleeve styling, and dispatches torso rendering cleanly across all rarities.
 */

class HeroArmorRenderer {
    static ARMOR_SLEEVES = {
        tank_top: { sleeveColor: null, sleevePanelColor: null, sleeveStripeColor: null, cuffColor: null, cuffStripeColor: null },
        tourist_tee: { sleeveColor: '#f8fafc', sleevePanelColor: null, sleeveStripeColor: null, cuffColor: '#0984e3', cuffStripeColor: '#ffffff' },
        striped_shirt: { sleeveColor: '#f8fafc', sleevePanelColor: '#1e40af', sleeveStripeColor: '#ffffff', cuffColor: '#ffffff', cuffStripeColor: '#1e40af' },
        tracksuit_top: { sleeveColor: '#f4ecd8', sleevePanelColor: '#0f295c', sleeveStripeColor: '#e11d48', cuffColor: '#0f295c', cuffStripeColor: '#f8fafc' },
        biker_jacket: { sleeveColor: '#1b1d24', sleevePanelColor: '#94a3b8', sleeveStripeColor: '#ef4444', cuffColor: '#0f1014', cuffStripeColor: '#e2e8f0' },
        gucci_blazer: { sleeveColor: '#141720', sleevePanelColor: '#222736', sleeveStripeColor: '#f6c945', cuffColor: '#ffd32a', cuffStripeColor: '#141720' },
        psistis_coat: { sleeveColor: '#252831', sleevePanelColor: '#5c3626', sleeveStripeColor: null, cuffColor: '#7f1d28', cuffStripeColor: '#f59e0b' },
        mat_riot_vest: { preserveSleeve: true, cuffColor: '#0f172a', cuffStripeColor: '#00f5ff' },
        aegis_jacket: { sleeveColor: '#163876', sleevePanelColor: '#facc15', sleeveStripeColor: '#fef08a', cuffColor: '#d97706', cuffStripeColor: '#fef08a' },
        grandmaster_cuirass: { sleeveColor: '#30323b', sleevePanelColor: '#4c4f5c', sleeveStripeColor: '#facc15', cuffColor: '#ca8a04', cuffStripeColor: '#ff6b1a' },
        zeus_aegis_cuirass: { sleeveColor: '#1e3a8a', sleevePanelColor: '#fbbf24', sleeveStripeColor: '#7dd3fc', cuffColor: '#f59e0b', cuffStripeColor: '#00f5ff' }
    };

    static getEquippedArmorId(player) {
        if (!player) {
            if (typeof GearManager !== 'undefined' && typeof GearManager.getEquipped === 'function') {
                const eq = GearManager.getEquipped('armor');
                return eq ? eq.id : null;
            }
            return null;
        }
        if (typeof RemotePlayer !== 'undefined' && player instanceof RemotePlayer) {
            return player.equippedArmorId || null;
        }
        if (player.equippedArmorId !== undefined) return player.equippedArmorId || null;
        if (typeof GearManager !== 'undefined' && typeof GearManager.getEquipped === 'function') {
            const eq = GearManager.getEquipped('armor');
            return eq ? eq.id : null;
        }
        return null;
    }

    static isEvolved(armorId) {
        return !!(armorId && typeof GearUpgradeManager !== 'undefined' &&
            ((typeof GearUpgradeManager.isEvolved === 'function' && GearUpgradeManager.isEvolved(armorId)) ||
             (typeof GearUpgradeManager.isAscended === 'function' && GearUpgradeManager.isAscended(armorId))));
    }

    static getArmOverride(player, arm, flash) {
        if (!arm) return arm;
        const id = this.getEquippedArmorId(player);
        const cfg = id ? this.ARMOR_SLEEVES[id] : null;
        if (!cfg) return arm;

        const f = !!flash;
        if (cfg.preserveSleeve) {
            return { ...arm, cuffColor: f ? '#ffffff' : cfg.cuffColor, cuffStripeColor: f ? null : cfg.cuffStripeColor };
        }
        return {
            ...arm,
            sleeveColor: cfg.sleeveColor === null ? null : (f ? '#ffffff' : cfg.sleeveColor),
            sleevePanelColor: f ? null : cfg.sleevePanelColor,
            sleeveStripeColor: f ? null : cfg.sleeveStripeColor,
            cuffColor: cfg.cuffColor,
            cuffStripeColor: f ? null : cfg.cuffStripeColor
        };
    }

    static drawCustomArmOverlay(ctx, r, flash, player) {
        const id = this.getEquippedArmorId(player);
        if (!id || !this.ARMOR_SLEEVES[id]) return;
        const arm = this.getArmOverride(player, { sleeveColor: '#0f244d', cuffColor: '#091632' }, flash);
        if (!arm || arm.sleeveColor === null) return;

        ctx.save();
        for (const [cx, cy, ang] of [[17.6, 6.9, -0.18], [10.2, 0.9, -0.30]]) {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(ang);
            ctx.fillStyle = flash ? '#ffffff' : (arm.cuffColor || arm.sleeveColor);
            ctx.strokeStyle = '#0b0c10';
            ctx.lineWidth = 1.3;
            ctx.fillRect(-3.0, -3.0, 6.0, 6.0);
            ctx.strokeRect(-3.0, -3.0, 6.0, 6.0);
            if (!flash && arm.sleeveStripeColor) {
                ctx.fillStyle = arm.sleeveStripeColor;
                ctx.fillRect(-2.6, -1.0, 5.2, 1.8);
            }
            ctx.restore();
        }
        ctx.restore();
    }

    static drawTorso(player, ctx, r, flash, facingLeft, isBack, heroType) {
        const id = this.getEquippedArmorId(player);
        if (!id) return;

        ctx.save();
        const evolved = this.isEvolved(id);
        if (typeof HeroArmorEndgame !== 'undefined' && HeroArmorEndgame.drawArmor(id, ctx, r, flash, isBack, evolved)) {
            ctx.restore();
            return;
        }
        if (typeof HeroArmorCommon !== 'undefined') {
            HeroArmorCommon.drawArmor(id, ctx, r, flash, isBack, evolved);
        }
        ctx.restore();
    }
}

if (typeof window !== 'undefined') window.HeroArmorRenderer = HeroArmorRenderer;
if (typeof module !== 'undefined') module.exports = HeroArmorRenderer;
