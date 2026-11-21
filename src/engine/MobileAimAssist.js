/**
 * Lesa.io - Mobile Auto-Aim Assist & Target Lock Reticle
 * Strictly used on touch devices via TouchInput.
 * Prioritizes non-airborne enemies strictly closer than the nearest Zeus Storm Crystal,
 * otherwise locks onto the nearest active Storm Crystal across the summit.
 */

class MobileAimAssist {
    /**
     * Find best mobile auto-aim target:
     * - Skips dead, dying, and invulnerable airborne enemies (e.g., flying Zeus).
     * - When Storm Crystals exist, shoots nearest Crystal unless an active enemy is closer.
     */
    static findTarget(game, player, maxDist = 750) {
        if (!game || !player || !Array.isArray(game.enemies) || game.enemies.length === 0) {
            return null;
        }
        const maxDistSq = maxDist * maxDist;
        const crystalMaxDistSq = Math.max(maxDistSq, 1600 * 1600);
        let nearestEnemy = null;
        let nearestEnemyDistSq = maxDistSq;
        let nearestCrystal = null;
        let nearestCrystalDistSq = crystalMaxDistSq;

        const enemies = game.enemies;
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (!e || e.dead || e.hp <= 0 || e.isDying || e.isAirborneImmune) continue;

            const dx = e.x - player.x;
            const dy = e.y - player.y;
            const distSq = dx * dx + dy * dy;

            if (e.isCrystal) {
                if (distSq < nearestCrystalDistSq) {
                    nearestCrystalDistSq = distSq;
                    nearestCrystal = e;
                }
            } else if (distSq < nearestEnemyDistSq) {
                nearestEnemyDistSq = distSq;
                nearestEnemy = e;
            }
        }

        if (nearestCrystal) {
            if (nearestEnemy && nearestEnemyDistSq < nearestCrystalDistSq) {
                return nearestEnemy;
            }
            return nearestCrystal;
        }
        return nearestEnemy;
    }

    /**
     * Draw crisp mobile-only lock-on reticle beneath active auto-aim target.
     */
    static drawReticle(ctx, game) {
        if (!ctx || !game || game.state !== 'PLAYING') return;
        const ti = game.touchInput;
        if (!ti || !ti.isTouchDevice) return;
        if (typeof MobilePerf !== 'undefined' && !MobilePerf.shouldShowAimReticle()) return;
        const t = ti.lockedTarget;
        if (!t || t.dead || t.hp <= 0 || t.isDying || t.isAirborneImmune) return;

        const r = (t.radius || 26) + 10;
        const pulse = 1 + Math.sin((typeof performance !== 'undefined' ? performance.now() : 0) * 0.01) * 0.08;
        const rr = r * pulse;
        const col = t.isCrystal ? '#00f5ff' : '#ff4757';

        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.strokeStyle = col;
        ctx.lineWidth = 2.4;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const a = (i * Math.PI) / 2 + 0.35;
            ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
            ctx.arc(0, 0, rr, a, a + 0.85);
        }
        ctx.stroke();
        ctx.restore();
    }

    /**
     * Sync circular SVG cooldown rings, skill icons, and bubble charge state on TouchInput controls.
     */
    static updateTouchCooldowns(ti) {
        const player = ti && ti.game ? ti.game.player : null;
        if (!player) return;
        const c = ti._uiCache || (ti._uiCache = Object.create(null));

        if (ti.dashBtn) {
            const onCd = player.dashCooldown > 0;
            const dashOff = onCd ? Math.round(226.2 * Math.max(0, Math.min(1, player.dashCooldown / (player.maxDashCooldown || 1)))) : 0;
            if (ti.dashRing && c.dashOff !== dashOff) {
                c.dashOff = dashOff;
                ti.dashRing.style.strokeDashoffset = String(dashOff);
            }
            if (c.dashOnCd !== onCd) {
                c.dashOnCd = onCd;
                ti.dashBtn.classList.toggle('on-cooldown', onCd);
                ti.dashBtn.classList.toggle('is-ready', !onCd);
            }
        }

        if (ti.skillBtn) {
            let state = 0;
            let skillOff = 0;
            if (player.frappesFrenzyTimer > 0) {
                state = 2;
                const r = Math.max(0, Math.min(1, player.frappesFrenzyTimer / (player.frappesFrenzyMaxTimer || 300)));
                skillOff = Math.round(226.2 * (1 - r));
            } else if (player.skillCooldown > 0) {
                state = 1;
                skillOff = Math.round(226.2 * Math.max(0, Math.min(1, player.skillCooldown / (player.maxSkillCooldown || 1))));
            }
            if (ti.skillRing && c.skillOff !== skillOff) {
                c.skillOff = skillOff;
                ti.skillRing.style.strokeDashoffset = String(skillOff);
            }
            if (c.skillState !== state) {
                c.skillState = state;
                ti.skillBtn.classList.toggle('is-active', state === 2);
                ti.skillBtn.classList.toggle('on-cooldown', state === 1);
                ti.skillBtn.classList.toggle('is-ready', state === 0);
            }

            const baseSkill = player.selectedSkill || player.equippedSkill || c.fallbackSkill || (c.fallbackSkill = localStorage.getItem('lesaio_selected_skill') || 'blade_rush');
            const isMasteredFrappes = baseSkill === 'frappes' && (player.hasPagakiaMastery || (typeof PlayerSkills !== 'undefined' && PlayerSkills.getSkillLevel('frappes') >= 5));
            const skillKey = isMasteredFrappes ? 'frappes_plus' : baseSkill;
            if (ti.currentSkillKey !== skillKey) {
                ti.currentSkillKey = skillKey;
                const mobileSkills = {
                    nerobalonaki: { img: 'assets/SkillsIcons/NerobalonakiSkill.png', label: 'WATER', isWater: true },
                    blade_rush: { img: 'assets/SkillsIcons/BladeRushSkill.png', label: 'BLADE', isWater: false },
                    seismic_quake: { img: 'assets/SkillsIcons/SeismicQuakeSkill.png', label: 'QUAKE', isWater: false },
                    yaya_scream: { img: 'assets/SkillsIcons/YayaScreamSkill.png', label: 'SCREAM', isWater: false },
                    frappes: { img: 'assets/SkillsIcons/FrappesSkill.png', label: 'FRAPPES', isWater: false },
                    frappes_plus: { img: 'assets/SkillsIcons/FrappesSkill.png', label: 'FRAPPES+', isWater: false },
                    wrath_of_olympus: { img: 'assets/SkillsIcons/WrathOfOlympusSkill.svg', label: 'ZEUS', isWater: false }
                };
                const mcfg = mobileSkills[skillKey] || mobileSkills.blade_rush;
                if (ti._skillImgEl) ti._skillImgEl.src = mcfg.img;
                if (ti._skillLabelEl) ti._skillLabelEl.textContent = mcfg.label;
                ti.skillBtn.classList.toggle('skill-water', mcfg.isWater);
            }
        }

        if (ti.ultBtn) {
            const ultState = (typeof HeroUltimates !== 'undefined') ? HeroUltimates.getHUDState(player) : null;
            const showUlt = !!ultState;
            if (c.showUlt !== showUlt) {
                c.showUlt = showUlt;
                ti.ultBtn.classList.toggle('hidden', !showUlt);
            }
            if (ultState) {
                const uOff = Math.round(226.2 * (1 - ultState.pct / 100));
                if (ti.ultRing && c.ultOff !== uOff) {
                    c.ultOff = uOff;
                    ti.ultRing.style.strokeDashoffset = String(uOff);
                }
                const uMode = ultState.active ? 2 : (ultState.ready ? 0 : 1);
                if (c.ultMode !== uMode) {
                    c.ultMode = uMode;
                    ti.ultBtn.classList.toggle('is-active', uMode === 2);
                    ti.ultBtn.classList.toggle('is-ready', uMode === 0);
                    ti.ultBtn.classList.toggle('on-cooldown', uMode === 1);
                }
                if (c.ultHero !== ultState.cfg.id) {
                    c.ultHero = ultState.cfg.id;
                    if (ti._ultImgEl) ti._ultImgEl.src = ultState.cfg.icon;
                    if (ti._ultLabelEl) ti._ultLabelEl.textContent = ultState.cfg.mobileLabel;
                    ti.ultBtn.classList.toggle('ult-vf185', ultState.cfg.id === 'vf185');
                }
            }
        }

        if (ti.bubbleBtn) {
            const showBubble = player.weaponType === 'bubble';
            if (c.showBubble !== showBubble) {
                c.showBubble = showBubble;
                ti.bubbleBtn.classList.toggle('hidden', !showBubble);
            }
            if (showBubble) {
                const charge = player.bubbleCharge || 0;
                const bOff = Math.round(226.2 * (1 - charge));
                if (ti.bubbleRing && c.bubbleOff !== bOff) {
                    c.bubbleOff = bOff;
                    ti.bubbleRing.style.strokeDashoffset = String(bOff);
                }
                const bReady = charge >= 1.0;
                if (c.bubbleReady !== bReady) {
                    c.bubbleReady = bReady;
                    ti.bubbleBtn.classList.toggle('is-ready', bReady);
                }
            }
        }
    }
}

if (typeof window !== 'undefined') window.MobileAimAssist = MobileAimAssist;
if (typeof module !== 'undefined' && module.exports) module.exports = { MobileAimAssist };
