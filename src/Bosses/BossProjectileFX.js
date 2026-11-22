/**
 * Lesa.io - Boss-Unique Projectile, Trail & Impact FX Registry
 * Ensures every Story, Olympus, and Endless boss owns distinct projectile sprites,
 * motion trails, explosion particles, shockwaves, and impact splats.
 */

const BOSS_PROJECTILE_SPECS = {
    souvlaki_skewer: { mode: 'spin', spin: 0.24, trail: 'ember', trailCol: '#ff9f43', sparkA: '#ff9f43', sparkB: '#ff4757', splat: ['#ff9f43', '#2f3542'] },
    frappe_ice_cube: { mode: 'spin', spin: 0.19, trail: 'cryo', trailCol: '#00d2d3', sparkA: '#dff9fb', sparkB: '#c49a6c', shock: 'rgba(0, 210, 211, 0.72)', splat: ['rgba(0, 210, 211, 0.72)', '#c49a6c'] },
    traffic_ticket: { mode: 'flutter', trail: 'siren', trailCol: '#ff4757', sparkA: '#ff4757', sparkB: '#3742fa', shock: 'rgba(55, 66, 250, 0.58)', splat: ['#ff9ff3', '#fed330'] },
    dozer_asphalt_chunk: { mode: 'spin', spin: 0.16, trail: 'gravel', trailCol: '#f1c40f', sparkA: '#f1c40f', sparkB: '#636e72', shock: 'rgba(241, 196, 15, 0.72)', dust: true, crack: true, splat: ['#636e72', '#f1c40f'] },
    butcher_cleaver: { mode: 'spin', spin: 0.32, trail: 'slash', trailCol: '#dfe6e9', sparkA: '#dfe6e9', sparkB: '#eb4d4b', shock: 'rgba(235, 77, 75, 0.68)', splat: ['#eb4d4b', '#dfe6e9'] },
    butcher_hook: { mode: 'spin', spin: 0.26, trail: 'slash', trailCol: '#eb4d4b', sparkA: '#95a5a6', sparkB: '#eb4d4b', shock: 'rgba(214, 48, 49, 0.72)', splat: ['#b33939', '#7f8c8d'] },
    tax_decree: { mode: 'spin', spin: 0.18, trail: 'gold', trailCol: '#fed330', sparkA: '#fed330', sparkB: '#eb4d4b', shock: 'rgba(254, 211, 48, 0.75)', splat: ['#f5cd79', '#eb4d4b'] },
    syndicate_chip: { mode: 'spin', spin: 0.28, trail: 'ruby', trailCol: '#ff4757', sparkA: '#fed330', sparkB: '#ff4757', shock: 'rgba(255, 71, 87, 0.75)', splat: ['#2f3542', '#ff4757'] },
    syndicate_slug: { mode: 'beam', trail: 'laser', trailCol: '#ff4757', sparkA: '#ff4757', sparkB: '#dfe6e9', splat: ['#ff4757', '#dfe6e9'] },
    kolossos_plasma: { mode: 'beam', trail: 'plasma', trailCol: '#ff6348', sparkA: '#ff6348', sparkB: '#ffd32a', shock: 'rgba(255, 99, 72, 0.78)', splat: ['#ff4757', '#ffa502'] },
    kolossos_orb: { mode: 'spin', spin: 0.25, trail: 'reactor', trailCol: '#ffa502', sparkA: '#ff4757', sparkB: '#ffa502', shock: 'rgba(255, 71, 87, 0.85)', crack: true, splat: ['#d63031', '#f39c12'] },
    kolossos_saw: { mode: 'spin', spin: 0.44, trail: 'reactor', trailCol: '#ff2e4c', sparkA: '#ff2e4c', sparkB: '#ffd32a', shock: 'rgba(255, 46, 76, 0.9)', crack: true, splat: ['#b33939', '#fed330'] },
    kolossos_laser_bolt: { mode: 'beam', trail: 'laser', trailCol: '#ff2e4c', sparkA: '#ff2e4c', sparkB: '#ffffff', shock: 'rgba(255, 46, 76, 0.72)', splat: ['#ff2e4c', '#fed330'] },
    kleanthis_wine_shard: { mode: 'spin', spin: 0.24, trail: 'wine', trailCol: '#b33939', sparkA: '#b33939', sparkB: '#ffffff', splat: ['#b33939', '#ff6b6b'] },
    sentinel_golden_ball: { mode: 'spin', spin: 0.20, trail: 'gold', trailCol: '#ffd32a', sparkA: '#ffd32a', sparkB: '#ffffff', shock: 'rgba(255, 211, 42, 0.72)', splat: ['#ffd32a', '#ffffff'] },
    sentinel_match_ball: { mode: 'spin', spin: 0.18, trail: 'crimson', trailCol: '#eb4d4b', sparkA: '#eb4d4b', sparkB: '#1e3799', splat: ['#eb4d4b', '#dfe6e9'] },
    chieftain_venom_dagger: { mode: 'spin', spin: 0.29, trail: 'venom', trailCol: '#be2edd', sparkA: '#be2edd', sparkB: '#2ecc71', shock: 'rgba(190, 46, 221, 0.68)', splat: ['#9b59b6', '#2ecc71'] },
    boreas_frost_lance: { mode: 'beam', trail: 'cryo', trailCol: '#00f5ff', sparkA: '#00f5ff', sparkB: '#ffffff', shock: 'rgba(129, 236, 236, 0.72)', splat: ['rgba(129, 236, 236, 0.78)', '#0984e3'] },
    boreas_icicle_shard: { mode: 'spin', spin: 0.26, trail: 'cryo', trailCol: '#81ecec', sparkA: '#81ecec', sparkB: '#ffffff', splat: ['#81ecec', '#ffffff'] },
    berserker_alpine_boulder: { mode: 'spin', spin: 0.14, trail: 'gravel', trailCol: '#74b9ff', sparkA: '#95a5a6', sparkB: '#dff9fb', shock: 'rgba(116, 185, 255, 0.75)', dust: true, crack: true, splat: ['#636e72', '#dff9fb'] },
    berserker_frost_round: { mode: 'beam', trail: 'frost_tracer', trailCol: '#74b9ff', sparkA: '#74b9ff', sparkB: '#dfe6e9', splat: ['#636e72', '#74b9ff'] },
    bio_acid: { mode: 'spin', spin: 0.28, trail: 'venom', trailCol: '#2ed573', sparkA: '#2ed573', sparkB: '#bef264', shock: 'rgba(46, 213, 115, 0.78)', splat: ['#10ac84', '#bef264'] },
    lil_xas_note: { mode: 'spin', spin: 0.14, trail: 'siren', trailCol: '#e056fd', sparkA: '#e056fd', sparkB: '#00f5ff', shock: 'rgba(224, 86, 253, 0.78)', splat: ['#e056fd', '#00f5ff'] },
    lil_xas_vinyl: { mode: 'spin', spin: 0.34, trail: 'gold', trailCol: '#facc15', sparkA: '#facc15', sparkB: '#e056fd', shock: 'rgba(250, 204, 21, 0.84)', splat: ['#facc15', '#18181b'] }
};

class BossProjectileFX {
    static getSpec(type) {
        return BOSS_PROJECTILE_SPECS[type] || null;
    }

    static updateBullet(b, dt = 1) {
        const spec = this.getSpec(b.type);
        if (!spec) return false;
        if (b.isBoomerang) {
            b.boomerangTime = (b.boomerangTime || 0) + dt;
            if (b.boomerangTime < 32) {
                b.boomerangState = 'out';
                const drag = Math.pow(0.955, dt);
                b.vx *= drag;
                b.vy *= drag;
            } else if (b.boomerangTime < 44) {
                b.boomerangState = 'hover';
                const hover = Math.pow(0.84, dt);
                b.vx *= hover;
                b.vy *= hover;
            } else {
                b.boomerangState = 'return';
                b.boomerangReturned = true;
                const tx = (b.shooter && !b.shooter.dead) ? b.shooter.x : (b.originX || 0);
                const ty = (b.shooter && !b.shooter.dead) ? b.shooter.y : (b.originY || 0);
                const dx = tx - b.x;
                const dy = ty - b.y;
                const dist = Math.hypot(dx, dy) || 1;
                if (dist < 44 && b.boomerangTime > 58) {
                    b.dead = true;
                } else {
                    const steer = Math.min(1, 0.095 * dt);
                    const retSpd = 13.2;
                    b.vx += ((dx / dist) * retSpd - b.vx) * steer;
                    b.vy += ((dy / dist) * retSpd - b.vy) * steer;
                }
            }
            b.rotation += (spec.spin || 0.42) * dt;
            return true;
        }
        if (spec.mode === 'spin') {
            b.rotation += (spec.spin || 0.2) * dt;
        } else if (spec.mode === 'flutter') {
            b.rotation += Math.sin(b.age * 0.45) * 0.13 * dt;
            b.scaleX = 1 + Math.sin(b.age * 0.4) * 0.14;
            b.scaleY = 1 + Math.cos(b.age * 0.4) * 0.14;
        } else if (spec.mode === 'beam') {
            b.rotation = Math.atan2(b.vy, b.vx);
            b.scaleX = 1.08 + Math.sin(b.age * 0.65) * 0.1;
            b.scaleY = 0.94 + Math.cos(b.age * 0.65) * 0.08;
        }
        return true;
    }

    static explodeBullet(b, effects) {
        const spec = this.getSpec(b.type);
        if (!spec || !effects) return false;
        if (spec.shock) effects.addShockwave(b.x, b.y, Math.max(46, b.radius * 5.2), spec.shock);
        if (spec.dust) effects.addDust(b.x, b.y, 5, 10);
        if (spec.crack && typeof effects.addGroundCrack === 'function') {
            effects.addGroundCrack(b.x, b.y, Math.max(36, b.radius * 3), '#2f3542', spec.sparkA, 60);
        }
        effects.addSparks(b.x, b.y, spec.sparkA, 7);
        if (spec.sparkB) effects.addSparks(b.x, b.y, spec.sparkB, 5);
        return true;
    }

    static getTrailColor(b) {
        const spec = this.getSpec(b.type);
        return spec ? spec.trailCol : null;
    }

    static getSplatPalette(type) {
        const spec = this.getSpec(type);
        return spec ? spec.splat : null;
    }

    static drawTrail(ctx, b) {
        const spec = this.getSpec(b.type);
        if (!spec || !b.trail || b.trail.length === 0) return false;

        const len = b.trail.length;
        const dir = Math.atan2(b.vy, b.vx);
        ctx.save();
        for (let i = 0; i < len; i++) {
            const pt = b.trail[i];
            const ratio = 1 - (i + 1) / (len + 1);
            ctx.globalAlpha = Math.max(0.08, ratio * 0.58);
            const t = spec.trail;

            if (t === 'siren') {
                ctx.fillStyle = (Math.floor(b.age * 0.35) + i) % 2 === 0 ? '#ff4757' : '#3742fa';
                ctx.beginPath(); ctx.arc(pt.x, pt.y, Math.max(2, b.radius * ratio * 0.65), 0, Math.PI * 2); ctx.fill();
            } else if (t === 'slash') {
                ctx.strokeStyle = i % 2 === 0 ? '#dfe6e9' : '#eb4d4b';
                ctx.lineWidth = Math.max(1.5, 3 * ratio);
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, Math.max(3, b.radius * 0.85 * ratio), b.rotation + i, b.rotation + i + 1.8);
                ctx.stroke();
            } else if (t === 'laser' || t === 'plasma' || t === 'frost_tracer') {
                ctx.save();
                ctx.translate(pt.x, pt.y);
                ctx.rotate(dir);
                ctx.fillStyle = i % 2 === 0 ? spec.sparkA : spec.sparkB;
                const w = Math.max(5, 16 * ratio);
                ctx.fillRect(-w * 0.5, -1.8 * ratio, w, 3.6 * ratio);
                ctx.restore();
            } else if (t === 'cryo') {
                ctx.save();
                ctx.translate(pt.x, pt.y);
                ctx.rotate(b.age * 0.12 + i);
                ctx.fillStyle = i % 2 === 0 ? spec.sparkA : spec.sparkB;
                const s = Math.max(2, 5.5 * ratio);
                ctx.fillRect(-s * 0.5, -s * 0.5, s, s);
                ctx.restore();
            } else if (t === 'reactor') {
                ctx.strokeStyle = i % 2 === 0 ? '#ff4757' : '#ffa502';
                ctx.lineWidth = Math.max(1.4, 2.6 * ratio);
                ctx.beginPath(); ctx.arc(pt.x, pt.y, Math.max(2.5, b.radius * 0.72 * ratio), 0, Math.PI * 2); ctx.stroke();
            } else {
                ctx.fillStyle = i % 2 === 0 ? spec.sparkA : spec.sparkB;
                ctx.beginPath(); ctx.arc(pt.x, pt.y, Math.max(2, b.radius * ratio * 0.72), 0, Math.PI * 2); ctx.fill();
            }
        }
        ctx.restore();
        return true;
    }

    static drawPoly(ctx, pts, fill, stroke = '#1e272e', lw = 2.2) {
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
            if (i === 0) ctx.moveTo(pts[i][0], pts[i][1]);
            else ctx.lineTo(pts[i][0], pts[i][1]);
        }
        ctx.closePath();
        if (fill) { ctx.fillStyle = fill; ctx.fill(); }
        if (stroke && lw > 0) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
    }

    static drawBullet(ctx, b) {
        const r = b.radius || 9;
        switch (b.type) {
            case 'souvlaki_skewer': return this.drawSkewer(ctx, r);
            case 'frappe_ice_cube': return this.drawFrappeCube(ctx, r);
            case 'traffic_ticket': return this.drawTicket(ctx, r);
            case 'dozer_asphalt_chunk': return this.drawAsphaltChunk(ctx, r);
            case 'butcher_cleaver': return this.drawCleaver(ctx, r);
            case 'butcher_hook': return this.drawHook(ctx, r);
            case 'tax_decree': return this.drawTaxDecree(ctx, r);
            case 'syndicate_chip': return this.drawSyndicateChip(ctx, r);
            case 'syndicate_slug': return this.drawSyndicateSlug(ctx, r);
            case 'kolossos_plasma': return this.drawKolossosPlasma(ctx, r);
            case 'kolossos_orb': return this.drawKolossosOrb(ctx, r);
            case 'kolossos_saw': return this.drawKolossosSaw(ctx, r);
            case 'kolossos_laser_bolt': return this.drawKolossosLaserBolt(ctx, r);
            case 'kleanthis_wine_shard': return this.drawWineShard(ctx, r);
            case 'sentinel_golden_ball': return this.drawSentinelBall(ctx, r, true);
            case 'sentinel_match_ball': return this.drawSentinelBall(ctx, r, false);
            case 'chieftain_venom_dagger': return this.drawVenomDagger(ctx, r);
            case 'boreas_frost_lance': return this.drawFrostLance(ctx, r);
            case 'boreas_icicle_shard': return this.drawIcicleShard(ctx, r);
            case 'berserker_alpine_boulder': return this.drawAlpineBoulder(ctx, r);
            case 'berserker_frost_round': return this.drawFrostRound(ctx, r);
            case 'bio_acid': return this.drawBioAcid(ctx, r);
            case 'lil_xas_note': return this.drawLilXasNote(ctx, b, r);
            case 'lil_xas_vinyl': return this.drawLilXasVinyl(ctx, r);
            default: return false;
        }
    }

    static drawLilXasVinyl(ctx, r) {
        ctx.fillStyle = '#09090b'; ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.arc(0, 0, r * 1.12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#e056fd'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(0, 0, r * 0.72, 0, Math.PI * 1.3); ctx.stroke();
        ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#09090b'; ctx.beginPath(); ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2); ctx.fill();
        return true;
    }

    static drawLilXasNote(ctx, b, r) {
        ctx.fillStyle = 'rgba(224, 86, 253, 0.32)';
        ctx.beginPath(); ctx.arc(0, 0, r * 1.45, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = b.color || '#e056fd'; ctx.strokeStyle = '#141418'; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.arc(0, 0, r * 0.96, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.font = `900 ${Math.round(r * 1.35)}px sans-serif`;
        ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('♫', 0, 1);
        return true;
    }

    static drawBioAcid(ctx, r) {
        ctx.fillStyle = 'rgba(46, 213, 115, 0.30)';
        ctx.beginPath(); ctx.arc(0, 0, r * 1.38, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#10ac84'; ctx.strokeStyle = '#141418'; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.arc(0, 0, r * 0.94, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#bef264';
        ctx.beginPath(); ctx.arc(-r * 0.24, -r * 0.24, r * 0.34, 0, Math.PI * 2); ctx.fill();
        return true;
    }

    static drawSkewer(ctx, r) {
        ctx.strokeStyle = '#1e272e'; ctx.lineWidth = 4.2;
        ctx.beginPath(); ctx.moveTo(-r * 1.35, 0); ctx.lineTo(r * 1.35, 0); ctx.stroke();
        ctx.strokeStyle = '#d4a373'; ctx.lineWidth = 2; ctx.stroke();
        for (const [ox, col] of [[-r * 0.55, '#b86b35'], [0, '#e55039'], [r * 0.55, '#c2763e']]) {
            ctx.fillStyle = col; ctx.strokeStyle = '#1e272e'; ctx.lineWidth = 1.8;
            ctx.beginPath(); ctx.roundRect(ox - 3.2, -4, 6.4, 8, 2); ctx.fill(); ctx.stroke();
        }
        ctx.fillStyle = '#ffa502';
        ctx.beginPath(); ctx.arc(r * 1.15, 0, 2.6, 0, Math.PI * 2); ctx.fill();
        return true;
    }

    static drawFrappeCube(ctx, r) {
        ctx.fillStyle = 'rgba(0, 210, 211, 0.86)'; ctx.strokeStyle = '#1e272e'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.roundRect(-r * 0.92, -r * 0.92, r * 1.84, r * 1.84, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#6f4e37';
        ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#c49a6c'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, r * 0.42, 0, Math.PI * 1.4); ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.roundRect(-r * 0.65, -r * 0.65, r * 0.4, r * 0.35, 1.5); ctx.fill();
        return true;
    }

    static drawTicket(ctx, r) {
        ctx.fillStyle = '#ff9ff3'; ctx.strokeStyle = '#1e272e'; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.roundRect(-r * 1.05, -r * 0.72, r * 2.1, r * 1.44, 2.5); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#feca57';
        ctx.fillRect(-r * 0.85, -r * 0.45, r * 1.7, r * 0.32);
        ctx.strokeStyle = '#eb4d4b'; ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-4, -2); ctx.lineTo(4, 5); ctx.moveTo(4, -2); ctx.lineTo(-4, 5);
        ctx.stroke();
        return true;
    }

    static drawAsphaltChunk(ctx, r) {
        ctx.strokeStyle = '#7f8c8d'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(-r * 1.2, -2); ctx.lineTo(r * 1.25, 3); ctx.stroke();
        this.drawPoly(ctx, [
            [-r * 0.95, -r * 0.4], [-r * 0.3, -r * 0.98], [r * 0.72, -r * 0.75],
            [r * 0.98, r * 0.25], [r * 0.2, r * 0.96], [-r * 0.8, r * 0.62]
        ], '#485460', '#1e272e', 2.4);
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(-r * 0.48, -2.5, r * 0.96, 5);
        ctx.fillStyle = '#1e272e';
        ctx.fillRect(-r * 0.2, -2.5, r * 0.25, 5);
        return true;
    }

    static drawCleaver(ctx, r) {
        ctx.fillStyle = '#6c4a32'; ctx.strokeStyle = '#1e272e'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(-r * 1.35, -3, r * 0.75, 6, 2); ctx.fill(); ctx.stroke();
        this.drawPoly(ctx, [[-r * 0.6, -r * 0.72], [r * 1.05, -r * 0.65], [r * 1.05, r * 0.72], [-r * 0.6, r * 0.58]], '#dfe6e9', '#1e272e', 2.3);
        ctx.fillStyle = '#eb4d4b';
        ctx.fillRect(-r * 0.3, r * 0.42, r * 1.2, 3);
        ctx.fillStyle = '#1e272e';
        ctx.beginPath(); ctx.arc(r * 0.75, -r * 0.35, 2, 0, Math.PI * 2); ctx.fill();
        return true;
    }

    static drawHook(ctx, r) {
        ctx.strokeStyle = '#1e272e'; ctx.lineWidth = 6.5; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-r * 0.85, -r * 0.4); ctx.lineTo(0, -r * 0.4);
        ctx.arc(0, r * 0.15, r * 0.55, -Math.PI * 0.5, Math.PI * 0.9, false);
        ctx.stroke();
        ctx.strokeStyle = '#b2bec3'; ctx.lineWidth = 3.2; ctx.stroke();
        ctx.fillStyle = '#eb4d4b';
        ctx.beginPath(); ctx.arc(-r * 0.45, r * 0.45, 3, 0, Math.PI * 2); ctx.fill();
        return true;
    }

    static drawTaxDecree(ctx, r) {
        ctx.fillStyle = '#f5cd79'; ctx.strokeStyle = '#1e272e'; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.roundRect(-r * 1.05, -r * 0.58, r * 2.1, r * 1.16, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#eb4d4b';
        ctx.fillRect(-3.5, -r * 0.58, 7, r * 1.16);
        ctx.fillStyle = '#ffd32a'; ctx.strokeStyle = '#b33939'; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        return true;
    }

    static drawSyndicateChip(ctx, r) {
        ctx.fillStyle = '#2f3542'; ctx.strokeStyle = '#1e272e'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.arc(0, 0, r * 0.98, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#ff4757'; ctx.lineWidth = 3; ctx.setLineDash([4, 3.5]);
        ctx.beginPath(); ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        this.drawPoly(ctx, [[0, -r * 0.42], [r * 0.36, 0], [0, r * 0.42], [-r * 0.36, 0]], '#fed330', '#1e272e', 1.5);
        return true;
    }

    static drawSyndicateSlug(ctx, r) {
        ctx.fillStyle = '#ff4757';
        ctx.beginPath(); ctx.moveTo(-r * 1.4, -3); ctx.lineTo(-r * 0.4, -4.5); ctx.lineTo(-r * 0.4, 4.5); ctx.lineTo(-r * 1.4, 3); ctx.closePath(); ctx.fill();
        this.drawPoly(ctx, [[-r * 0.65, -r * 0.48], [r * 0.55, -r * 0.45], [r * 1.25, 0], [r * 0.55, r * 0.45], [-r * 0.65, r * 0.48]], '#dfe6e9', '#1e272e', 2.2);
        return true;
    }

    static drawKolossosPlasma(ctx, r) {
        ctx.fillStyle = 'rgba(255, 71, 87, 0.30)';
        ctx.beginPath(); ctx.ellipse(0, 0, r * 1.65, r * 0.85, 0, 0, Math.PI * 2); ctx.fill();
        this.drawPoly(ctx, [[-r * 1.35, -r * 0.68], [r * 0.25, -r * 0.42], [r * 1.4, 0], [r * 0.25, r * 0.42], [-r * 1.35, r * 0.68], [-r * 0.8, 0]], '#cd6133', '#1e272e', 2.3);
        this.drawPoly(ctx, [[-r * 0.65, -r * 0.28], [r * 0.95, 0], [-r * 0.65, r * 0.28]], '#ff6348', null, 0);
        ctx.fillStyle = '#fff3b0';
        ctx.beginPath(); ctx.ellipse(r * 0.2, 0, r * 0.42, r * 0.18, 0, 0, Math.PI * 2); ctx.fill();
        return true;
    }

    static drawKolossosOrb(ctx, r) {
        ctx.fillStyle = 'rgba(255, 46, 76, 0.26)';
        ctx.beginPath(); ctx.arc(0, 0, r * 1.35, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2f3542'; ctx.strokeStyle = '#1e272e'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.arc(0, 0, r * 0.98, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ff4757';
        for (let i = 0; i < 3; i++) {
            const a = (i / 3) * Math.PI * 2;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r * 0.78, a, a + 0.65); ctx.closePath(); ctx.fill();
        }
        ctx.fillStyle = '#fed330';
        ctx.beginPath(); ctx.arc(0, 0, r * 0.40, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(-r * 0.12, -r * 0.12, r * 0.16, 0, Math.PI * 2); ctx.fill();
        return true;
    }

    static drawKolossosSaw(ctx, r) {
        const teeth = 10;
        const pts = [];
        for (let i = 0; i < teeth * 2; i++) {
            const a = (i / (teeth * 2)) * Math.PI * 2;
            const rr = i % 2 === 0 ? r * 1.18 : r * 0.72;
            pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
        }
        this.drawPoly(ctx, pts, '#ff2e4c', '#141418', 2.4);
        ctx.fillStyle = '#2f3542';
        ctx.strokeStyle = '#fed330';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.48, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.20, 0, Math.PI * 2);
        ctx.fill();
        return true;
    }

    static drawKolossosLaserBolt(ctx, r) {
        ctx.fillStyle = 'rgba(255, 46, 76, 0.36)';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.8, r * 0.78, 0, 0, Math.PI * 2);
        ctx.fill();
        this.drawPoly(ctx, [
            [-r * 1.5, -r * 0.36], [r * 1.45, -r * 0.22], [r * 1.85, 0],
            [r * 1.45, r * 0.22], [-r * 1.5, r * 0.36]
        ], '#ff2e4c', '#141418', 1.8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-r * 0.8, -r * 0.14, r * 2.0, r * 0.28);
        return true;
    }

    static drawWineShard(ctx, r) {
        this.drawPoly(ctx, [[-r * 1.05, -r * 0.4], [r * 0.2, -r * 0.95], [r * 1.1, 0.2], [-r * 0.35, r * 0.85]], '#b33939', '#1e272e', 2.2);
        this.drawPoly(ctx, [[-r * 0.4, -r * 0.25], [r * 0.4, -r * 0.45], [r * 0.6, 0.1]], '#ff7979', null, 0);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(r * 0.25, -r * 0.25, 2, 0, Math.PI * 2); ctx.fill();
        return true;
    }

    static drawSentinelBall(ctx, r, isGold) {
        ctx.fillStyle = isGold ? '#ffd32a' : '#eb4d4b';
        ctx.strokeStyle = '#1e272e'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.arc(0, 0, r * 0.96, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = isGold ? '#ffffff' : '#1e3799';
        ctx.beginPath(); ctx.arc(0, 0, r * 0.46, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = isGold ? '#b7791f' : '#ffffff'; ctx.lineWidth = 1.8;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2;
            ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9);
        }
        ctx.stroke();
        return true;
    }

    static drawVenomDagger(ctx, r) {
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(-r * 1.05, -2.5, r * 0.55, 5);
        this.drawPoly(ctx, [[-r * 0.5, -r * 0.38], [r * 0.55, -r * 0.46], [r * 1.28, 0.15], [r * 0.35, r * 0.36], [-r * 0.5, r * 0.3]], '#30336b', '#1e272e', 2.1);
        ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(-r * 0.1, -r * 0.32); ctx.lineTo(r * 1.1, 0.08); ctx.stroke();
        return true;
    }

    static drawFrostLance(ctx, r) {
        this.drawPoly(ctx, [[-r * 1.2, 0], [-r * 0.25, -r * 0.62], [r * 1.35, 0], [-r * 0.25, r * 0.62]], '#00cec9', '#1e272e', 2.2);
        this.drawPoly(ctx, [[-r * 0.6, 0], [0, -r * 0.28], [r * 1.05, 0], [0, r * 0.28]], '#dff9fb', null, 0);
        return true;
    }

    static drawIcicleShard(ctx, r) {
        const pts = [];
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            const rr = i % 2 === 0 ? r * 1.15 : r * 0.46;
            pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
        }
        this.drawPoly(ctx, pts, '#81ecec', '#0984e3', 2.0);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2); ctx.fill();
        return true;
    }

    static drawAlpineBoulder(ctx, r) {
        this.drawPoly(ctx, [
            [-r * 0.95, -r * 0.3], [-r * 0.42, -r * 0.96], [r * 0.52, -r * 0.85],
            [r * 0.98, -r * 0.15], [r * 0.72, r * 0.82], [-r * 0.2, r * 0.96], [-r * 0.88, r * 0.55]
        ], '#636e72', '#1e272e', 2.5);
        this.drawPoly(ctx, [[-r * 0.68, -r * 0.25], [-r * 0.35, -r * 0.82], [r * 0.42, -r * 0.72], [r * 0.68, -r * 0.2], [0, -r * 0.05]], '#dff9fb', '#74b9ff', 1.4);
        return true;
    }

    static drawFrostRound(ctx, r) {
        ctx.fillStyle = '#74b9ff';
        ctx.beginPath(); ctx.arc(-r * 0.65, 0, 3.5, 0, Math.PI * 2); ctx.fill();
        this.drawPoly(ctx, [[-r * 0.65, -r * 0.46], [r * 0.45, -r * 0.44], [r * 1.22, 0], [r * 0.45, r * 0.44], [-r * 0.65, r * 0.46]], '#636e72', '#1e272e', 2.1);
        ctx.fillStyle = '#00f5ff';
        ctx.beginPath(); ctx.moveTo(r * 0.45, -r * 0.36); ctx.lineTo(r * 1.15, 0); ctx.lineTo(r * 0.45, r * 0.36); ctx.closePath(); ctx.fill();
        return true;
    }
}

if (typeof window !== 'undefined') {
    window.BossProjectileFX = BossProjectileFX;
}
