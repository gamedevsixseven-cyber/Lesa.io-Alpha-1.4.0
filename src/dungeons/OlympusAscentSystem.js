// ==================== MOUNT OLYMPUS ASCENT & BLESSINGS ====================
// Handles the physical Northern Ascension Stairway, player climb trigger,
// altitude climb transition between floors, Mt. Olympus minimap tracker HUD,
// and between-floor Olympian Blessing choices.

const OLYMPUS_BLESSINGS = [
    {
        id: 'zeus_spark',
        god: 'ZEUS',
        title: "Zeus's Thunderbolt",
        desc: '+22% Attack Damage & storm crit power (+10% Crit)',
        icon: '⚡',
        color: '#facc15',
        apply(player) {
            player.baseDamageMultiplier = (player.baseDamageMultiplier || 1.0) + 0.22;
            player.baseCritChance = (player.baseCritChance || 0.1) + 0.10;
        }
    },
    {
        id: 'hermes_wings',
        god: 'HERMES',
        title: "Hermes' Winged Sandals",
        desc: '+18% Move Speed & -25% Dash Cooldown',
        icon: '🪽',
        color: '#38bdf8',
        apply(player) {
            player.archetypeSpeed = Math.min(7.4, (player.archetypeSpeed || 5.0) * 1.18);
            player.baseMaxDashCooldown = Math.max(70, Math.round((player.baseMaxDashCooldown || 180) * 0.75));
        }
    },
    {
        id: 'athena_aegis',
        god: 'ATHENA',
        title: "Athena's Aegis",
        desc: '+45 Max HP, +12% Armor & Divine Shield',
        icon: '🛡️',
        color: '#a78bfa',
        apply(player) {
            player.archetypeMaxHp = (player.archetypeMaxHp || 100) + 45;
            player.baseDamageReduction = (player.baseDamageReduction || 0) + 0.12;
            if (typeof player.addShield === 'function') player.addShield();
        }
    },
    {
        id: 'apollo_sunfire',
        god: 'APOLLO',
        title: "Apollo's Sunfire",
        desc: '+24% Fire Rate & +15% Bullet Velocity',
        icon: '☀️',
        color: '#fb923c',
        apply(player) {
            player.baseFireRateMultiplier = (player.baseFireRateMultiplier || 1.0) + 0.24;
            player.baseBulletSpeed = (player.baseBulletSpeed || 14) * 1.15;
        }
    },
    {
        id: 'hestia_hearth',
        god: 'HESTIA',
        title: "Hestia's Eternal Hearth",
        desc: 'Restore 65% HP now & +2.5 HP/sec mountain warmth regen',
        icon: '🔥',
        color: '#f87171',
        apply(player) {
            if (typeof player.heal === 'function') {
                player.heal(Math.round((player.maxHp || 100) * 0.65));
            }
            player._hestiaRegen = (player._hestiaRegen || 0) + 2.5;
        }
    },
    {
        id: 'artemis_hunt',
        god: 'ARTEMIS',
        title: "Artemis' Moonbow",
        desc: '+35% Crit Damage & +14% Attack Damage',
        icon: '🌙',
        color: '#34d399',
        apply(player) {
            player.baseCritMultiplier = (player.baseCritMultiplier || 2.0) + 0.35;
            player.baseDamageMultiplier = (player.baseDamageMultiplier || 1.0) + 0.14;
        }
    }
];

class OlympusAscentSystem {
    constructor(dungeonManager) {
        this.dm = dungeonManager;
        this.stairwayUnlocked = false;
        this.stairwayAnchor = { x: 0, y: -1060 };
        this.climbing = false;
        this.climbAnimTimer = 0; // frames remaining during climb transition
        this.climbAnimMax = 120;
        this.fromElevation = 300;
        this.toElevation = 1100;
        this.nextFloorPending = 2;

        this.awaitingBlessingPick = false;
        this.blessingChoices = [];
        this.activeBlessings = [];
        this._appliedStatSnapshot = false;
        this._regenAccum = 0;
        this._domEl = null;
        this._keyHandler = null;
    }

    resetForRun() {
        this.stairwayUnlocked = false;
        this.climbing = false;
        this.climbAnimTimer = 0;
        this.awaitingBlessingPick = false;
        this.blessingChoices = [];
        this.activeBlessings = [];
        this._regenAccum = 0;
        this.destroyBlessingModal();
    }

    configureFloor(floorNum, arena) {
        const cfg = (typeof OlympusLayouts !== 'undefined')
            ? OlympusLayouts.getFloorConfig(floorNum)
            : { ascentAnchor: { x: 0, y: -1040 }, elevationM: floorNum * 500 };

        this.stairwayAnchor = { ...cfg.ascentAnchor };
        this.stairwayUnlocked = false;
        this.climbing = false;
        this.climbAnimTimer = 0;
        this.awaitingBlessingPick = false;
        this.destroyBlessingModal();
    }

    unlockStairway(floorNum, game) {
        if (floorNum >= 5) return; // Floor 5 is Summit Victory
        this.stairwayUnlocked = true;
        if (game && game.effects && game.effects.spawnExplosion) {
            game.effects.spawnExplosion(this.stairwayAnchor.x, this.stairwayAnchor.y, '#ffd166', 45);
        }
    }

    update(dt, game) {
        const player = game && game.player;
        if (!player || player.dead) return;

        // Apply gentle Hestia regen if blessed
        if (player._hestiaRegen && player._hestiaRegen > 0 && player.hp < player.maxHp) {
            this._regenAccum += (player._hestiaRegen / 60) * dt;
            if (this._regenAccum >= 1) {
                const whole = Math.floor(this._regenAccum);
                this._regenAccum -= whole;
                player.hp = Math.min(player.maxHp, player.hp + whole);
            }
        }

        // Ongoing climb cloud animation between floors
        if (this.climbing) {
            this.climbAnimTimer -= dt;
            if (this.climbAnimTimer <= 0) {
                this.climbing = false;
                this.climbAnimTimer = 0;
                this.dm.startFloor(this.nextFloorPending, player, game.enemies, game.effects);
                if (game.waveManager) {
                    game.waveManager.wave = this.nextFloorPending;
                    game.waveManager.waveState = 'SPAWNING';
                }
            }
            return;
        }

        // Check if player walked onto the unlocked Northern Ascension Stairway
        if (this.stairwayUnlocked && !this.awaitingBlessingPick && this.dm.floor < 5) {
            const dx = player.x - this.stairwayAnchor.x;
            const dy = player.y - this.stairwayAnchor.y;
            if (dx * dx + dy * dy <= 95 * 95) {
                this.openBlessingSelection(game);
            }
        }
    }

    openBlessingSelection(game) {
        if (this.awaitingBlessingPick || this.climbing) return;
        if (game && game.bullets) game.bullets.length = 0;

        const pickedIds = new Set(this.activeBlessings.map(b => b.id));
        let pool = OLYMPUS_BLESSINGS.filter(b => !pickedIds.has(b.id));
        if (pool.length < 3) pool = OLYMPUS_BLESSINGS.slice();

        // Deterministic-feeling shuffle without mutating catalog
        const shuffled = pool.slice().sort(() => Math.random() - 0.5);
        this.blessingChoices = shuffled.slice(0, 3);
        this.awaitingBlessingPick = true;
        this._gameRef = game;
        this._renderBlessingModal();
    }

    chooseBlessing(index) {
        if (!this.awaitingBlessingPick) return;
        const choice = this.blessingChoices[index];
        const game = this._gameRef || (typeof window !== 'undefined' ? window.gameInstance : null);
        this.awaitingBlessingPick = false;
        this.destroyBlessingModal();

        if (choice && typeof window !== 'undefined' && window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
            window.soundEngine.playSelect();
        }
        if (choice && game && game.player) {
            this.activeBlessings.push(choice);
            choice.apply(game.player);
            if (typeof game.player.applyEquipmentStats === 'function') {
                game.player.applyEquipmentStats();
            }
            if (game.effects && game.effects.spawnDamageText) {
                game.effects.spawnDamageText(game.player.x, game.player.y - 48, `${choice.icon} ${choice.god}'S BLESSING`, choice.color);
            }
        }

        this.beginClimbTransition(this.dm.floor + 1);
    }

    beginClimbTransition(nextFloor) {
        const curCfg = (typeof OlympusLayouts !== 'undefined') ? OlympusLayouts.getFloorConfig(this.dm.floor) : { elevationM: 300 };
        const nxtCfg = (typeof OlympusLayouts !== 'undefined') ? OlympusLayouts.getFloorConfig(nextFloor) : { elevationM: 1100 };
        this.fromElevation = curCfg.elevationM;
        this.toElevation = nxtCfg.elevationM;
        this.nextFloorPending = nextFloor;
        this.stairwayUnlocked = false;
        this.climbing = true;
        this.climbAnimTimer = this.climbAnimMax;
    }

    /**
     * Draw physical Northern Ascension Stairway monument + directional beacon in world space.
     */
    drawStairwayWorld(ctx, camera) {
        const ax = this.stairwayAnchor.x;
        const ay = this.stairwayAnchor.y;
        if (camera && !camera.isVisible(ax, ay, 220)) return;

        const now = Date.now() * 0.001;
        ctx.save();

        // Glowing heavenly threshold aura when unlocked
        if (this.stairwayUnlocked) {
            const pulse = 0.72 + Math.sin(now * 4.5) * 0.25;
            const rad = 115 + Math.sin(now * 3.5) * 10;
            const g = ctx.createRadialGradient(ax, ay, 18, ax, ay, rad);
            g.addColorStop(0, `rgba(125, 211, 252, ${0.62 * pulse})`);
            g.addColorStop(0.55, `rgba(255, 215, 100, ${0.38 * pulse})`);
            g.addColorStop(1, 'rgba(255, 215, 100, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(ax, ay, rad, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw custom Grand Stairway sprite (or vector marble arch fallback)
        const drawn = (typeof OlympusAssets !== 'undefined') && OlympusAssets.drawCenteredSprite(
            ctx, 'ascent_stairway', ax, ay, 196, 178,
            { anchorY: 0.56, shadow: true, shadowScaleX: 0.44, shadowScaleY: 0.14 }
        );
        if (!drawn) {
            ctx.fillStyle = '#e2dcd0';
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 4;
            ctx.fillRect(ax - 75, ay - 65, 150, 130);
            ctx.strokeRect(ax - 75, ay - 65, 150, 130);
            for (let s = 0; s < 5; s++) {
                ctx.fillStyle = s % 2 === 0 ? '#cbd5e1' : '#f8fafc';
                ctx.fillRect(ax - 62, ay + 40 - s * 18, 124, 15);
            }
            ctx.fillStyle = this.stairwayUnlocked ? '#fde047' : '#64748b';
            ctx.fillRect(ax - 44, ay - 56, 88, 36);
        }

        // Lock seal or Ascend prompt directly over monument
        ctx.font = 'bold 14px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        if (this.stairwayUnlocked) {
            const bob = Math.sin(now * 5) * 5;
            ctx.fillStyle = '#18181b';
            ctx.fillText(`▲ ASCEND TO FLOOR ${this.dm.floor + 1}`, ax + 1, ay - 96 + bob + 1);
            ctx.fillStyle = '#fde047';
            ctx.fillText(`▲ ASCEND TO FLOOR ${this.dm.floor + 1}`, ax, ay - 96 + bob);
        } else if (this.dm.floor < 5) {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(ax - 76, ay - 22, 152, 26, 8) : ctx.fillRect(ax - 76, ay - 22, 152, 26);
            ctx.fill();
            ctx.fillStyle = '#cbd5e1';
            ctx.font = 'bold 11px "Outfit", sans-serif';
            ctx.fillText('🔒 SEALED STONE GATE', ax, ay - 5);
        }
        ctx.restore();
    }

    /**
     * Draw screen-space Altitude Climber Progress Tracker + Offscreen Stairway Compass + Ascent Clouds.
     */
    renderScreenOverlay(ctx, width, height, game) {
        if (!game) return;
        const floorNum = this.dm.floor || 1;

        // 1. Offscreen directional pointer when Stairway unlocks
        if (this.stairwayUnlocked && !this.climbing && !this.awaitingBlessingPick && game.camera) {
            const sp = game.camera.worldToScreen(this.stairwayAnchor.x, this.stairwayAnchor.y);
            const margin = 56;
            const onScreen = sp.x >= margin && sp.x <= width - margin && sp.y >= margin && sp.y <= height - margin;
            if (!onScreen) {
                const ang = Math.atan2(sp.y - height / 2, sp.x - width / 2);
                const ix = Math.max(margin, Math.min(width - margin, width / 2 + Math.cos(ang) * (width * 0.42)));
                const iy = Math.max(margin + 40, Math.min(height - margin, height / 2 + Math.sin(ang) * (height * 0.38)));
                const pulse = 1 + Math.sin(Date.now() * 0.008) * 0.12;

                ctx.save();
                ctx.translate(ix, iy);
                ctx.scale(pulse, pulse);
                ctx.rotate(ang);
                ctx.fillStyle = '#fbbf24';
                ctx.strokeStyle = '#18181b';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(18, 0); ctx.lineTo(-10, -12); ctx.lineTo(-5, 0); ctx.lineTo(-10, 12);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();

                ctx.save();
                ctx.font = 'bold 12px "Outfit", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#fef08a';
                if (!(typeof MobilePerf !== 'undefined' && MobilePerf.isMobile)) {
                    ctx.shadowColor = '#000';
                    ctx.shadowBlur = 4;
                }
                ctx.fillText('CLIMB ▲', ix, iy + 26);
                ctx.restore();
            }
        }

        // 2. Mount Olympus Altitude Climber Strip (compact top-right under score/minimap margin)
        this._drawAltitudeTracker(ctx, width, height, floorNum);

        // 3. Mountain Climb Cloud Sweep Overlay during floor transition
        if (this.climbing) {
            this._drawClimbTransition(ctx, width, height);
        }
    }

    _drawAltitudeTracker(ctx, width, height, currentFloor) {
        if (width < 480) return; // Skip extra strip on tiny portrait viewports to preserve space
        const boxW = 148;
        const boxH = 142;
        const x = width - boxW - 14;
        const y = 112;

        ctx.save();
        ctx.fillStyle = 'rgba(12, 18, 30, 0.78)';
        ctx.strokeStyle = 'rgba(255, 215, 100, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, boxW, boxH, 10);
        else ctx.rect(x, y, boxW, boxH);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 10px "Outfit", sans-serif';
        ctx.fillStyle = '#fde68a';
        ctx.textAlign = 'left';
        ctx.fillText('⛰️ MT. OLYMPUS ASCENT', x + 10, y + 16);

        const cfgCur = (typeof OlympusLayouts !== 'undefined') ? OlympusLayouts.getFloorConfig(currentFloor) : { elevationM: currentFloor * 500 };
        ctx.font = 'bold 11px "Outfit", sans-serif';
        ctx.fillStyle = '#7dd3fc';
        ctx.textAlign = 'right';
        ctx.fillText(`${cfgCur.elevationM.toLocaleString()}m`, x + boxW - 10, y + 16);

        // Vertical spine connecting Floors 5 -> 1
        const spineX = x + 22;
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(spineX, y + 32);
        ctx.lineTo(spineX, y + 112);
        ctx.stroke();

        const labels = ['F5 Summit', 'F4 Clouds', 'F3 Prionia', 'F2 Ravine', 'F1 Trail'];
        for (let idx = 0; idx < 5; idx++) {
            const fNum = 5 - idx;
            const ny = y + 32 + idx * 20;
            const done = fNum < currentFloor;
            const curr = fNum === currentFloor;

            ctx.fillStyle = curr ? '#fbbf24' : (done ? '#34d399' : '#475569');
            ctx.beginPath();
            ctx.arc(spineX, ny, curr ? 5.5 : 4, 0, Math.PI * 2);
            ctx.fill();
            if (curr) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            ctx.font = curr ? 'bold 11px "Outfit", sans-serif' : '500 10px "Outfit", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillStyle = curr ? '#ffffff' : (done ? '#a7f3d0' : '#94a3b8');
            ctx.fillText(labels[idx], spineX + 12, ny + 3.5);
        }

        // Blessing badges row at bottom
        if (this.activeBlessings.length > 0) {
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'left';
            const badges = this.activeBlessings.map(b => b.icon).join(' ');
            ctx.fillStyle = '#fde68a';
            ctx.fillText(`Boons: ${badges}`, x + 10, y + 133);
        } else {
            ctx.font = '500 9px "Outfit", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('Climb North to Ascend ▲', x + 10, y + 133);
        }
        ctx.restore();
    }

    _drawClimbTransition(ctx, width, height) {
        if (typeof OlympusClimbTransition !== 'undefined' && typeof OlympusClimbTransition.draw === 'function') {
            OlympusClimbTransition.draw(ctx, width, height, this);
            return;
        }
        const t = 1 - Math.max(0, this.climbAnimTimer / this.climbAnimMax);
        const alpha = Math.sin(t * Math.PI);
        const curMeters = Math.round(this.fromElevation + (this.toElevation - this.fromElevation) * t);

        ctx.save();
        ctx.fillStyle = `rgba(14, 24, 44, ${Math.min(0.88, alpha * 1.15)})`;
        ctx.fillRect(0, 0, width, height);
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(254, 240, 138, ${alpha})`;
        ctx.font = 'bold 16px "Outfit", sans-serif';
        ctx.fillText('ASCENDING MOUNT OLYMPUS ▲', width / 2, height * 0.42);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.font = '900 52px "Outfit", sans-serif';
        ctx.fillText(`${curMeters.toLocaleString()}m`, width / 2, height * 0.52);
        ctx.restore();
    }

    _renderBlessingModal() {
        this.destroyBlessingModal();
        if (typeof document === 'undefined') return;

        const game = this._gameRef || (typeof window !== 'undefined' ? window.gameInstance : null);
        const currentFloor = (this.dm && this.dm.floor) ? this.dm.floor : 1;

        if (typeof OlympusAltarUI !== 'undefined' && OlympusAltarUI.render) {
            const view = OlympusAltarUI.render({
                choices: this.blessingChoices,
                activeBlessings: this.activeBlessings,
                currentFloor,
                nextFloor: Math.min(5, currentFloor + 1),
                player: game ? game.player : null,
                onSelect: (idx) => this.chooseBlessing(idx)
            });
            this._domEl = view ? view.rootEl : document.getElementById('olympus-blessing-modal');
        } else {
            const wrap = document.createElement('div');
            wrap.id = 'olympus-blessing-modal';
            this.blessingChoices.forEach((b, idx) => {
                const card = document.createElement('button');
                card.type = 'button';
                card.textContent = `[${idx + 1}] ${b.god}: ${b.title} — ${b.desc}`;
                card.onclick = () => this.chooseBlessing(idx);
                wrap.appendChild(card);
            });
            document.body.appendChild(wrap);
            this._domEl = wrap;
        }

        this._keyHandler = (e) => {
            if (!this.awaitingBlessingPick || e.repeat) return;
            if (e.key === '1' || e.key === '2' || e.key === '3') {
                e.preventDefault();
                this.chooseBlessing(parseInt(e.key, 10) - 1);
            }
        };
        window.addEventListener('keydown', this._keyHandler);
    }

    destroyBlessingModal() {
        if (this._keyHandler && typeof window !== 'undefined') {
            window.removeEventListener('keydown', this._keyHandler);
            this._keyHandler = null;
        }
        if (this._domEl && this._domEl.parentNode) {
            this._domEl.parentNode.removeChild(this._domEl);
        }
        this._domEl = null;
    }
}

if (typeof window !== 'undefined') {
    window.OlympusAscentSystem = OlympusAscentSystem;
    window.OLYMPUS_BLESSINGS = OLYMPUS_BLESSINGS;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OlympusAscentSystem, OLYMPUS_BLESSINGS };
}
