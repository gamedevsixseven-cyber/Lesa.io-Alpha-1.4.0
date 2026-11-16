/**
 * Lesa.io - Mythic Boss Weapon: Zeus's Master Thunderbolt
 * First-kill reward from defeating Zeus on Mount Olympus Floor 5.
 * Hurled high-velocity thunderbolts with Forked Arc chaining (25% hit / 100% crit)
 * and a devastating vertical Sky-Bolt Spear every 5th shot.
 */

class ZeusThunderbolt extends WeaponBase {
    constructor() {
        super({
            id: 'zeus_thunderbolt',
            name: "Zeus's Master Thunderbolt",
            type: 'zeus_thunderbolt',
            rarity: 'Mythic',
            hero: null,
            baseDelay: 15,
            baseDamage: 46,
            radius: 12,
            extraPierce: 2,
            maxBounces: 0,
            color: '#fed330',
            icon: 'assets/WeaponIcons/ZeusThunderbolt.png',
            description: "Mythic Olympus Relic • Hurled lightning spears with Forked Arc (25% / 100% Crit chains 2 foes) and every 5th shot calls down a 110px Sky-Bolt.",
            stats: {
                damage: '46 Lightning',
                fireRate: 'Fast (0.25s)',
                pierce: '+2 Pierces & +12% Crit',
                special: 'Forked Arc & 5th-Shot Sky-Bolt'
            }
        });
    }

    /**
     * Render 2.5D olympian jagged golden thunderbolt spear gripped at center shaft.
     */
    static drawWeapon(ctx, flash, recoil = 0, isEvolved = false) {
        ctx.save();
        ctx.translate(10 - recoil * 0.45, 0);
        const outline = '#141416';
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Subtle electric corona around tip when active (amplified gold-crimson when evolved)
        if (!flash) {
            ctx.fillStyle = isEvolved ? 'rgba(239, 68, 68, 0.34)' : 'rgba(0, 245, 255, 0.25)';
            ctx.beginPath();
            ctx.ellipse(22, 0, isEvolved ? 17 : 14, isEvolved ? 9 : 7, 0, 0, Math.PI * 2);
            ctx.fill();
            if (isEvolved) {
                ctx.fillStyle = 'rgba(254, 211, 48, 0.32)';
                ctx.beginPath();
                ctx.ellipse(22, 0, 13, 6, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Rear pommel cap & bronze grip shaft
        ctx.fillStyle = flash ? '#ffffff' : '#8c6239';
        ctx.strokeStyle = outline;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.roundRect(-8, -2.5, 16, 5, 2.2);
        ctx.fill();
        ctx.stroke();

        // Winged Olympian bronze crossguard fins (x: 4..10)
        ctx.fillStyle = flash ? '#ffffff' : '#d4af37';
        ctx.beginPath();
        ctx.moveTo(4, -3);
        ctx.lineTo(1, -9);
        ctx.lineTo(9, -4.5);
        ctx.lineTo(9, 4.5);
        ctx.lineTo(1, 9);
        ctx.lineTo(4, 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Glowing azure energy core node at guard center
        if (!flash) {
            ctx.fillStyle = '#00f5ff';
            ctx.beginPath();
            ctx.arc(6.5, 0, 2.3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Main sculpted jagged golden thunderbolt blade (pointed +X)
        const boltGrad = ctx.createLinearGradient(8, -7, 34, 7);
        if (flash) {
            boltGrad.addColorStop(0, '#ffffff');
            boltGrad.addColorStop(1, '#ffffff');
        } else {
            boltGrad.addColorStop(0, '#fff7b0');
            boltGrad.addColorStop(0.45, '#fed330');
            boltGrad.addColorStop(1, '#f39c12');
        }
        ctx.fillStyle = boltGrad;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(8, -2.2);
        ctx.lineTo(17, -6.8);
        ctx.lineTo(15, -1.6);
        ctx.lineTo(25, -5.2);
        ctx.lineTo(22.5, -1.0);
        ctx.lineTo(35, 0);
        ctx.lineTo(22.5, 1.0);
        ctx.lineTo(25, 5.2);
        ctx.lineTo(15, 1.6);
        ctx.lineTo(17, 6.8);
        ctx.lineTo(8, 2.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Razor cyan-white plasma vein down center spine
        if (!flash) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(16, -2.0);
            ctx.lineTo(18.5, 1.4);
            ctx.lineTo(24.5, -1.2);
            ctx.lineTo(31.5, 0);
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * Render hurled Zeus Thunderbolt projectile (scaled & winged on every 5th Sky-Bolt shot).
     */
    static drawBullet(ctx, bullet) {
        const isEvo = !!bullet.isWeaponEvolved;
        const scale = (bullet.isSkyBolt ? 1.42 : 1.05) * (isEvo ? 1.12 : 1.0);
        const r = Math.max(10, (bullet.radius || 12)) * scale;

        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Electric plasma halo
        ctx.fillStyle = isEvo
            ? 'rgba(239, 68, 68, 0.34)'
            : (bullet.isSkyBolt ? 'rgba(254, 211, 48, 0.34)' : 'rgba(0, 245, 255, 0.28)');
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.45, r * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();

        if (bullet.isSkyBolt || isEvo) {
            // Crackling Sky-Bolt / Awakened aura arcs
            ctx.strokeStyle = isEvo ? '#fed330' : '#00f5ff';
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.arc(-r * 0.15, 0, r * 0.85, -Math.PI * 0.6, Math.PI * 0.6);
            ctx.stroke();
        }

        // Bold jagged lightning spear silhouette
        ctx.fillStyle = bullet.isSkyBolt ? '#fff59d' : '#fed330';
        ctx.strokeStyle = '#141416';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-r * 1.25, -r * 0.16);
        ctx.lineTo(-r * 0.25, -r * 0.56);
        ctx.lineTo(-r * 0.42, -r * 0.12);
        ctx.lineTo(r * 0.50, -r * 0.44);
        ctx.lineTo(r * 0.28, -r * 0.08);
        ctx.lineTo(r * 1.38, 0);
        ctx.lineTo(r * 0.28, r * 0.08);
        ctx.lineTo(r * 0.50, r * 0.44);
        ctx.lineTo(-r * 0.42, r * 0.12);
        ctx.lineTo(-r * 0.25, r * 0.56);
        ctx.lineTo(-r * 1.25, r * 0.16);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Pure white-cyan core filament
        ctx.strokeStyle = bullet.isSkyBolt ? '#ffffff' : '#00f5ff';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-r * 0.85, 0);
        ctx.lineTo(-r * 0.15, -r * 0.18);
        ctx.lineTo(r * 0.3, r * 0.14);
        ctx.lineTo(r * 1.05, 0);
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Trigger Forked Arc (25% / 100% Crit -> 2 targets within 190px @ 55% dmg)
     * and Every 5th Shot Sky-Bolt Spear (110px AoE @ 60% splash on first enemy hit).
     */
    static onHit(bullet, target, finalDmg, enemies, effects, game) {
        if (!bullet || !target || !Array.isArray(enemies)) return;
        const isEvo = !!bullet.isWeaponEvolved;

        // 1. Sky-Bolt Spear drop on the first enemy hit (every 5th shot, or 4th when Evolved ★)
        if (bullet.isSkyBolt && !bullet._skyBoltDetonated) {
            bullet._skyBoltDetonated = true;
            const aoeRadius = isEvo ? 135 : 110;
            const splashDmg = finalDmg * (isEvo ? 0.75 : 0.60);

            if (effects) {
                if (typeof effects.addLightningChain === 'function') {
                    effects.addLightningChain(target.x + (Math.random() - 0.5) * 20, target.y - 310, target.x, target.y, '#fed330');
                    effects.addLightningChain(target.x + 8, target.y - 290, target.x, target.y, isEvo ? '#ff6b6b' : '#00f5ff');
                }
                if (typeof effects.addGroundCrack === 'function') {
                    effects.addGroundCrack(target.x, target.y, 48, '#2b2109', 'rgba(0, 245, 255, 0.45)', 70);
                }
                effects.addShockwave(target.x, target.y, aoeRadius, isEvo ? 'rgba(239, 68, 68, 0.92)' : 'rgba(254, 211, 48, 0.92)');
                effects.addSparks(target.x, target.y, '#00f5ff', 10);
                effects.addSparks(target.x, target.y, '#ffffff', 6);
                effects.addComicSplash(target.x, target.y - 36, isEvo ? '★ AWAKENED SKY-BOLT!' : '⚡ SKY BOLT!', '#fed330', 18);
            }
            if (window.soundEngine && typeof window.soundEngine.playCrit === 'function') {
                window.soundEngine.playCrit();
            }

            for (let i = 0; i < enemies.length; i++) {
                const cand = enemies[i];
                if (!cand || cand === target || cand.dead || cand.isDying || cand.isAirborneImmune) continue;
                const d = Math.hypot(cand.x - target.x, cand.y - target.y);
                if (d <= aoeRadius + (cand.radius || 0)) {
                    cand.takeDamage(splashDmg, effects, false);
                    if (game && game.isCoopGuest) cand.dead = false;
                }
            }
        }

        // 2. Forked Arc: 25% / 100% Crit -> 2 targets within 190px @ 55% dmg (Evolved ★: 40% / 100% Crit -> 3 targets within 220px @ 65% dmg)
        const shouldFork = bullet.isCrit || Math.random() < (isEvo ? 0.40 : 0.25);
        if (!shouldFork) return;

        const maxArcRange = isEvo ? 220 : 190;
        const maxArcRangeSq = maxArcRange * maxArcRange;
        const arcDmg = finalDmg * (isEvo ? 0.65 : 0.55);
        const candidates = [];

        for (let i = 0; i < enemies.length; i++) {
            const cand = enemies[i];
            if (!cand || cand === target || cand.dead || cand.isDying || cand.isAirborneImmune) continue;
            const dx = cand.x - target.x;
            const dy = cand.y - target.y;
            const distSq = dx * dx + dy * dy;
            if (distSq <= maxArcRangeSq) {
                candidates.push({ enemy: cand, distSq });
            }
        }

        if (candidates.length === 0) return;
        candidates.sort((a, b) => a.distSq - b.distSq);

        const maxTargets = Math.min(isEvo ? 3 : 2, candidates.length);
        for (let i = 0; i < maxTargets; i++) {
            const arcEnemy = candidates[i].enemy;
            arcEnemy.takeDamage(arcDmg, effects, false);
            if (game && game.isCoopGuest) arcEnemy.dead = false;
            if (effects && typeof effects.addLightningChain === 'function') {
                effects.addLightningChain(target.x, target.y, arcEnemy.x, arcEnemy.y, isEvo ? '#fed330' : '#00f5ff');
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.ZeusThunderbolt = ZeusThunderbolt;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ZeusThunderbolt };
}
