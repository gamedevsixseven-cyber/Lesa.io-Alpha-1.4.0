/**
 * Lesa.io - Mount Olympus Dungeon Mode Manager
 * Controls the 5-floor progressive ascent to Mount Olympus, escalating chest rewards
 * (Uncommon ➔ Rare ➔ Epic ➔ Legendary ➔ Mythic), progressive snow/weather simulation,
 * and the ultra-rare 0.8% Olympian Star-Stone drop at the summit.
 */

const OLYMPUS_FLOORS = [
    {
        floor: 1, name: 'Olympus Foothills', subtitle: 'Litochoro Trailhead & Olive Groves (300m)',
        chestType: 'uncommon', chestName: 'Uncommon Chest', enemyCount: 10, waveMult: 1.35,
        hasBoss: 'casillas_sentinel', bossName: 'CASILLAS SENTINEL', bossRank: 'FLOOR 1 GUARDIAN',
        snowDensity: 0, ambientColor: 'rgba(46, 213, 115, 0.03)', titleColor: '#10ac84'
    },
    {
        floor: 2, name: 'Enipeas Ravine', subtitle: 'Twin Stone Bridges & Gorge (1,100m)',
        chestType: 'rare', chestName: 'Rare Chest', enemyCount: 14, waveMult: 1.75,
        hasBoss: 'ravine_chieftain', bossName: 'RAVINE CHIEFTAIN', bossRank: 'FLOOR 2 WARLORD',
        snowDensity: 28, ambientColor: 'rgba(16, 172, 132, 0.05)', titleColor: '#1e90ff'
    },
    {
        floor: 3, name: 'Prionia Plateau', subtitle: 'Alpine Timberline & Ice Pools (2,100m)',
        chestType: 'epic', chestName: 'Epic Chest', enemyCount: 16, waveMult: 2.20,
        hasBoss: 'frost_titan', bossName: 'BOREAS THE FROST TITAN', bossRank: 'FLOOR 3 COLOSSUS',
        snowDensity: 80, ambientColor: 'rgba(30, 144, 255, 0.07)', titleColor: '#9b59b6'
    },
    {
        floor: 4, name: 'The Cloudline', subtitle: 'Sky-Bridge Above the Clouds (2,600m)',
        chestType: 'legendary', chestName: 'Legendary Chest', enemyCount: 16, waveMult: 2.80,
        hasBoss: 'kiloumpas_berserker', bossName: 'KILOUMPAS BERSERKER', bossRank: 'FLOOR 4 GLACIAL BOSS',
        snowDensity: 160, ambientColor: 'rgba(155, 89, 182, 0.09)', titleColor: '#f39c12'
    },
    {
        floor: 5, name: 'Olympus Summit', subtitle: 'Mytikas Peak — Parthenon of Zeus (2,918m)',
        chestType: 'mythic', chestName: 'Mythic Chest', enemyCount: 1, waveMult: 3.50,
        hasBoss: 'zeus', bossName: 'ZEUS THE GOD OF THUNDER', bossRank: 'OLYMPUS FINAL BOSS',
        starStoneChance: 0.008, snowDensity: 250, ambientColor: 'rgba(243, 156, 18, 0.13)', titleColor: '#e056fd'
    }
];

class DungeonManager {
    constructor(waveManager) {
        this.waveManager = waveManager;
        this.floor = 1;
        this.maxFloors = 5;
        this.floorState = 'IN_PROGRESS'; // 'IN_PROGRESS' | 'FLOOR_CLEARED' | 'DUNGEON_COMPLETED'
        this.betweenFloorTimer = 0;
        this.starStoneAwarded = false;
        this.announcementText = '';
        this.announcementColor = '#fed330';
        this.announcementTimer = 0;

        // Dynamic Weather & Snow Particles
        this.snowflakes = [];
        this.snowWindOffset = 0;
        this.summitFlashTimer = 0;

        // Mount Olympus Ascent & Blessing Progression
        this.ascentSystem = (typeof OlympusAscentSystem !== 'undefined') ? new OlympusAscentSystem(this) : null;
    }

    static getOlympianStarStones() {
        const gs = (typeof window !== 'undefined' && window.GameState) ? window.GameState.player : null;
        if (gs) {
            if (typeof gs.olympianStarStones !== 'number') {
                const saved = parseInt(localStorage.getItem('lesaio_olympian_star_stones') || '0', 10);
                gs.olympianStarStones = isNaN(saved) ? 0 : saved;
            }
            return gs.olympianStarStones;
        }
        return (typeof localStorage !== 'undefined' && parseInt(localStorage.getItem('lesaio_olympian_star_stones') || '0', 10)) || 0;
    }

    static setOlympianStarStones(val = 0) {
        const clean = Math.max(0, Math.floor(Number(val) || 0));
        if (typeof window !== 'undefined' && window.GameState && window.GameState.player) window.GameState.player.olympianStarStones = clean;
        if (typeof localStorage !== 'undefined') localStorage.setItem('lesaio_olympian_star_stones', clean.toString());
        if (typeof window !== 'undefined' && window.EventBus) window.EventBus.emit('starStonesUpdated', { count: clean });
        if (typeof window !== 'undefined' && window.SaveManager && typeof window.SaveManager.saveNow === 'function') window.SaveManager.saveNow();
        return clean;
    }

    static addOlympianStarStone(qty = 1) { return DungeonManager.setOlympianStarStones(DungeonManager.getOlympianStarStones() + (Number(qty) || 0)); }

    static spendOlympianStarStone(qty = 1) {
        const cur = DungeonManager.getOlympianStarStones(), need = Math.max(1, Math.floor(Number(qty) || 1));
        if (cur < need) return false;
        DungeonManager.setOlympianStarStones(cur - need);
        return true;
    }

    getCurrentFloorData() {
        const idx = Math.min(Math.max(1, this.floor), this.maxFloors) - 1;
        return OLYMPUS_FLOORS[idx] || OLYMPUS_FLOORS[0];
    }

    getCurrentFloorName() {
        return this.getCurrentFloorData().name;
    }

    startFloor(floorNum, player, enemies, effects) {
        this.floor = Math.min(Math.max(1, floorNum), this.maxFloors);
        this.floorState = 'IN_PROGRESS';
        this.waveManager.wave = this.floor;
        this.waveManager.waveState = 'IN_PROGRESS';
        this.waveManager.waveEnemiesKilled = 0;

        const floorData = this.getCurrentFloorData();
        const waveMult = floorData.waveMult;

        // Reset snow particles count to match floor density
        this.initSnowParticles(floorData.snowDensity);

        // Apply custom Mount Olympus floor map terrain & obstacles
        const game = (typeof window !== 'undefined') ? window.gameInstance : null;
        const arena = game ? game.arena : null;
        if (arena) {
            arena.setDungeonTheme(this.floor);
        }
        if (this.ascentSystem) {
            this.ascentSystem.configureFloor(this.floor, arena);
        }

        // Position hero at southern trailhead looking north up Mount Olympus
        const layoutCfg = (typeof OlympusLayouts !== 'undefined') ? OlympusLayouts.getFloorConfig(this.floor) : null;
        if (player) {
            player.olympusZoneMult = 1.0;
            if (layoutCfg && typeof OlympusLayouts !== 'undefined') {
                const safeHero = OlympusLayouts.findSafePosition(layoutCfg.spawn.x, layoutCfg.spawn.y, player.radius || 28, arena);
                player.x = safeHero.x;
                player.y = safeHero.y;
                player.vx = 0;
                player.vy = 0;
                if (game && game.camera) {
                    game.camera.x = player.x;
                    game.camera.y = player.y;
                }
            }
        }

        // Clear existing enemies safely
        enemies.length = 0;

        // Boss announcement overlay
        if (floorData.bossName && game && game.bossWarningOverlay) {
            game.bossWarningOverlay.trigger(floorData.bossName, floorData.bossRank);
        }

        // Spawn Floor Boss safely north of hero (clear of pillars/cliffs)
        let bx = layoutCfg ? layoutCfg.bossSpawn.x : (player ? player.x : 0);
        let by = layoutCfg ? layoutCfg.bossSpawn.y : ((player ? player.y : 0) - 440);
        if (typeof OlympusLayouts !== 'undefined') {
            const safeBoss = OlympusLayouts.findSafePosition(bx, by, 58, arena);
            bx = safeBoss.x;
            by = safeBoss.y;
        }

        if (floorData.hasBoss === 'zeus') {
            // Summit Final Boss: Zeus the God of Thunder
            this.waveManager.waveTotalEnemies = 1;
            if (typeof ZeusBoss !== 'undefined') {
                enemies.push(new ZeusBoss(bx, by, waveMult));
            }
        } else {
            // Floors 1-4: Floor Guardian Boss + Escort Mob
            this.waveManager.waveTotalEnemies = floorData.enemyCount + 1;
            if (floorData.hasBoss === 'casillas_sentinel' && typeof CasillasSentinel !== 'undefined') {
                enemies.push(new CasillasSentinel(bx, by, waveMult));
            } else if (floorData.hasBoss === 'ravine_chieftain' && typeof RavineChieftain !== 'undefined') {
                enemies.push(new RavineChieftain(bx, by, waveMult));
            } else if (floorData.hasBoss === 'frost_titan' && typeof FrostTitanBoreas !== 'undefined') {
                enemies.push(new FrostTitanBoreas(bx, by, waveMult));
            } else if (floorData.hasBoss === 'kiloumpas_berserker' && typeof KiloumpasBerserker !== 'undefined') {
                enemies.push(new KiloumpasBerserker(bx, by, waveMult));
            }
            this.spawnEscortEnemies(player, enemies, floorData.enemyCount, waveMult);
        }

        // Floor entrance announcement
        const introMsg = `FLOOR ${this.floor}/5: ${floorData.name.toUpperCase()}`;
        this.showAnnouncement(introMsg, floorData.titleColor, 190);
        if (effects) {
            effects.addComicSplash(player.x, player.y - 50, `🏛️ ${floorData.subtitle}`);
        }
        if (window.soundEngine && typeof window.soundEngine.playWaveStart === 'function') {
            window.soundEngine.playWaveStart();
        }
    }

    initSnowParticles(targetCount) {
        this.snowflakes = [];
        const snowCap = (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile) ? MobilePerf.getPreset().snowCap : targetCount;
        const count = Math.min(targetCount, snowCap);
        const w = (typeof window !== 'undefined') ? window.innerWidth : 1920;
        const h = (typeof window !== 'undefined') ? window.innerHeight : 1080;

        for (let i = 0; i < count; i++) {
            this.snowflakes.push({
                x: Math.random() * w,
                y: Math.random() * h,
                radius: 1.2 + Math.random() * 2.6,
                speedY: 1.0 + Math.random() * 2.4,
                speedX: -0.6 + Math.random() * 1.2,
                alpha: 0.35 + Math.random() * 0.55,
                wobbleOffset: Math.random() * Math.PI * 2
            });
        }
    }

    spawnEscortEnemies(player, enemies, count, waveMult) {
        const hasPsaltis = (this.floor >= 3);
        const psaltisCount = hasPsaltis ? (this.floor >= 4 ? 2 : 1) : 0;

        const game = (typeof window !== 'undefined') ? window.gameInstance : null;
        const arena = game ? game.arena : null;
        for (let i = 0; i < count; i++) {
            const angle = -Math.PI * 0.85 + (i / Math.max(1, count)) * Math.PI * 0.7 + (Math.random() * 0.35);
            const dist = 420 + Math.random() * 420;
            let x = player.x + Math.cos(angle) * dist;
            let y = player.y + Math.sin(angle) * dist;
            if (typeof OlympusLayouts !== 'undefined' && arena) {
                const safe = OlympusLayouts.findSafePosition(x, y, 32, arena);
                x = safe.x;
                y = safe.y;
            }

            if (hasPsaltis && i < psaltisCount && typeof Psaltis !== 'undefined') {
                enemies.push(new Psaltis(x, y, waveMult));
                continue;
            }

            // Floor 3, 4, 5: Ice Enemies (FrostWolf & IceGolem) spawn!
            if (this.floor >= 4) {
                const mod = i % 4;
                if (mod === 0 && typeof IceGolem !== 'undefined') {
                    enemies.push(new IceGolem(x, y, waveMult));
                } else if (mod === 1 && typeof FrostWolf !== 'undefined') {
                    enemies.push(new FrostWolf(x, y, waveMult));
                } else if (mod === 2 && typeof Skarmogyftos !== 'undefined') {
                    enemies.push(new Skarmogyftos(x, y, waveMult));
                } else if (typeof Fatmir !== 'undefined') {
                    enemies.push(new Fatmir(x, y, waveMult));
                }
            } else if (this.floor === 3) {
                const mod = i % 4;
                if (mod === 0 && typeof FrostWolf !== 'undefined') {
                    enemies.push(new FrostWolf(x, y, waveMult));
                } else if (mod === 1 && typeof IceGolem !== 'undefined') {
                    enemies.push(new IceGolem(x, y, waveMult));
                } else if (mod === 2 && typeof Casillas !== 'undefined') {
                    enemies.push(new Casillas(x, y, waveMult));
                } else if (typeof Skarmogyftos !== 'undefined') {
                    enemies.push(new Skarmogyftos(x, y, waveMult));
                }
            } else if (this.floor === 2) {
                const isSkarm = (i % 3 === 0);
                if (isSkarm && typeof Skarmogyftos !== 'undefined') {
                    enemies.push(new Skarmogyftos(x, y, waveMult));
                } else if (i % 2 === 0 && typeof Fatmir !== 'undefined') {
                    enemies.push(new Fatmir(x, y, waveMult));
                } else if (typeof Casillas !== 'undefined') {
                    enemies.push(new Casillas(x, y, waveMult));
                }
            } else {
                if (i % 2 === 0 && typeof Fatmir !== 'undefined') {
                    enemies.push(new Fatmir(x, y, waveMult));
                } else if (typeof Casillas !== 'undefined') {
                    enemies.push(new Casillas(x, y, waveMult));
                }
            }
        }
    }

    onFloorCleared(game) {
        this.floorState = 'FLOOR_CLEARED';
        this.waveManager.waveState = 'WAVE_CLEARED';
        this.betweenFloorTimer = 210; // ~3.5 seconds

        const floorData = this.getCurrentFloorData();
        const isSummit = (this.floor >= this.maxFloors);

        // 1. Award Guaranteed Floor Chest (Uncommon ➔ Rare ➔ Epic ➔ Legendary ➔ Mythic)
        this.awardFloorChest(floorData, game);

        // 1.5. Award Mount Olympus Floor Materials (Bronze / Mati / Summit Ambrosia Spark)
        if (!game.isCoopGuest && typeof MaterialRegistry !== 'undefined' && typeof window !== 'undefined' && window.inventoryManager) {
            const floorMats = MaterialRegistry.getOlympusFloorRewards(this.floor);
            if (floorMats) {
                window.inventoryManager.awardBattleMaterials(floorMats, {
                    game,
                    x: game.player ? game.player.x : 0,
                    y: game.player ? game.player.y : 0,
                    source: 'olympus_floor',
                    sourceName: `Olympus F${this.floor}`
                });
            }
        }
        if (typeof WaveManager !== 'undefined' && typeof WaveManager.vacuumMaterialDrops === 'function') {
            WaveManager.vacuumMaterialDrops(game.drops);
        }

        // 2. Floor 5 Summit Check: 0.8% Olympian Star-Stone + 8% Evolution Stone Drop
        if (isSummit) {
            DungeonManager.rollOlympianStarStone(game, 0.008, 'Zeus Summit');
            this.starStoneAwarded = DungeonManager.starStoneAwarded || this.starStoneAwarded;
            if (typeof GearUpgradeManager !== 'undefined') GearUpgradeManager.tryOlympusSummitEvolutionStoneDrop(game);
        }

        // 3. Announcements & Fanfare
        if (isSummit) {
            this.showAnnouncement('👑 MOUNT OLYMPUS CONQUERED! 👑', '#f39c12', 300);
            if (game.effects) {
                game.effects.addConfetti(game.player.x, game.player.y, 140);
                game.effects.addComicSplash(game.player.x, game.player.y - 65, 'OLYMPUS CONQUERED! 🏆');
            }
            if (window.soundEngine && typeof window.soundEngine.playLevelUp === 'function') {
                window.soundEngine.playLevelUp();
            }
        } else {
            if (this.ascentSystem) {
                this.ascentSystem.unlockStairway(this.floor, game);
            }
            this.showAnnouncement(`🏛️ FLOOR ${this.floor} CLEARED! WALK TO NORTH STAIRS ▲`, floorData.titleColor, 220);
            if (game.effects) {
                game.effects.addConfetti(game.player.x, game.player.y, 60);
                game.effects.addComicSplash(game.player.x, game.player.y - 50, `📦 ${floorData.chestName.toUpperCase()}!`);
            }
        }

        // 4. Celebratory loot drops
        const dropCount = isSummit ? 16 : 8;
        for (let i = 0; i < dropCount; i++) {
            const rx = game.player.x + (Math.random() * 220 - 110);
            const ry = game.player.y + (Math.random() * 220 - 110);
            if (typeof Drop !== 'undefined') {
                game.drops.push(new Drop(rx, ry, 'xp', isSummit ? 60 : 35));
            }
        }
        if (typeof Drop !== 'undefined') {
            game.drops.push(new Drop(game.player.x + 30, game.player.y + 20, 'heart', 60));
            game.drops.push(new Drop(game.player.x - 30, game.player.y + 20, 'star', isSummit ? 10 : 3));
        }

        if (typeof window !== 'undefined' && window.GameState) {
            if (typeof window.GameState.recordWaveProgress === 'function') window.GameState.recordWaveProgress('dungeons', this.floor);
            if (floorData && floorData.hasBoss && typeof window.GameState.recordBossDefeat === 'function') window.GameState.recordBossDefeat(floorData.hasBoss);
        }
        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.emit('waveCompleted', { wave: this.floor, isDungeon: true });
        }
    }

    awardFloorChest(floorData, game) {
        if (typeof window !== 'undefined' && window.chestManager) {
            const awarded = window.chestManager.addChest(floorData.chestType);
            if (awarded === 'inventory') {
                if (game && game.ui && typeof game.ui.addKillfeed === 'function') {
                    game.ui.addKillfeed(`🏛️ Floor ${floorData.floor}: Slots full — ${floorData.chestName} saved to Inventory!`);
                }
            } else if (awarded) {
                if (game && game.ui && typeof game.ui.addKillfeed === 'function') {
                    game.ui.addKillfeed(`🏛️ Floor ${floorData.floor}: Claimed ${floorData.chestName}!`);
                }
            } else {
                // Fallback if both slots and inventory storage are unavailable
                const coinsBonus = floorData.floor * 1500;
                const gemsBonus = floorData.floor * 4;
                if (window.GameState && typeof window.GameState.addCurrency === 'function') {
                    window.GameState.addCurrency(coinsBonus, gemsBonus);
                } else if (game && game.player) {
                    game.player.coins = (game.player.coins || 0) + coinsBonus;
                }
                if (game && game.ui && typeof game.ui.addKillfeed === 'function') {
                    game.ui.addKillfeed(`Slots full! Converted to +${coinsBonus} Coins +${gemsBonus} Gems!`);
                }
            }
        }
    }

    static rollOlympianStarStone(game, dropChance = 0.008, sourceLabel = 'Mount Olympus Summit') {
        if (Math.random() >= dropChance) return false;
        this.starStoneAwarded = true;
        DungeonManager.addOlympianStarStone(1);
        const pct = (dropChance * 100).toFixed(1).replace(/\.0$/, '');
        if (game && game.effects && game.player) {
            game.effects.addConfetti(game.player.x, game.player.y, 200);
            game.effects.addShockwave(game.player.x, game.player.y, 140, 'rgba(255, 215, 0, 0.95)');
            game.effects.addComicSplash(game.player.x, game.player.y - 85, '🌟 OLYMPIAN STAR-STONE ACQUIRED! 🌟');
        }
        if (game && game.ui && typeof game.ui.addKillfeed === 'function') {
            game.ui.addKillfeed(`🌟 JACKPOT! ${sourceLabel} dropped OLYMPIAN STAR-STONE (${pct}%)! 🌟`);
        }
        if (typeof window !== 'undefined' && window.soundEngine && typeof window.soundEngine.playLevelUp === 'function') window.soundEngine.playLevelUp();
        return true;
    }

    update(dt, game) {
        if (this.announcementTimer > 0) {
            this.announcementTimer -= dt;
        }

        // Update Snowfall Physics
        if (this.snowflakes.length > 0) {
            const w = (typeof window !== 'undefined') ? window.innerWidth : 1920;
            const h = (typeof window !== 'undefined') ? window.innerHeight : 1080;
            this.snowWindOffset += dt * 0.03;
            const windFactor = (this.floor >= 4) ? 2.5 : 1.0;

            for (let i = 0; i < this.snowflakes.length; i++) {
                const flake = this.snowflakes[i];
                flake.y += flake.speedY * dt * (1 + (this.floor - 1) * 0.15);
                flake.x += (flake.speedX + Math.sin(this.snowWindOffset + flake.wobbleOffset) * windFactor) * dt;

                if (flake.y > h + 10) {
                    flake.y = -10;
                    flake.x = Math.random() * w;
                }
                if (flake.x > w + 10) flake.x = -10;
                else if (flake.x < -10) flake.x = w + 10;
            }
        }

        // Summit ambient golden flash
        if (this.floor === 5) {
            if (this.summitFlashTimer > 0) this.summitFlashTimer -= dt;
            else if (Math.random() < 0.005) this.summitFlashTimer = 18;
        }

        // Floor terrain zone speed & feedback (Enipeas river wading, Prionia ice glide)
        if (game.player && typeof OlympusLayouts !== 'undefined') {
            if (this.ascentSystem && (this.ascentSystem.awaitingBlessingPick || this.ascentSystem.climbing)) {
                game.player.olympusZoneMult = 0;
            } else {
                const z = OlympusLayouts.getZoneEffects(game.player.x, game.player.y, this.floor);
                game.player.olympusZoneMult = z.inRiver ? 0.85 : (z.onIce ? 1.18 : 1.0);
                if (game.player.isMoving && game.effects && Math.random() < 0.25) {
                    if (z.inRiver) game.effects.addSparks(game.player.x, game.player.y + 14, '#7dd3fc', 2);
                    else if (z.onIce) game.effects.addSparks(game.player.x, game.player.y + 14, '#e0f2fe', 2);
                }
            }
        }

        if (this.floorState === 'IN_PROGRESS') {
            if (game.enemies.length === 0) {
                this.onFloorCleared(game);
            }
        } else if (this.floorState === 'FLOOR_CLEARED') {
            if (this.floor >= this.maxFloors || !this.ascentSystem) {
                this.betweenFloorTimer -= dt;
                if (this.betweenFloorTimer <= 0) {
                    if (this.floor >= this.maxFloors) {
                        this.floorState = 'DUNGEON_COMPLETED';
                        this.concludeDungeonRun(game);
                    } else {
                        this.startFloor(this.floor + 1, game.player, game.enemies, game.effects);
                    }
                }
            }
        }

        if (this.ascentSystem) {
            this.ascentSystem.update(dt, game);
        }
    }

    concludeDungeonRun(game) {
        if (!game) return;
        if (game.ui && game.ui.addKillfeed) {
            game.ui.addKillfeed('🏆 Mount Olympus Conquered! All 5 Chests Claimed!');
        }
        if (typeof game.gameOver === 'function') {
            game.gameOver();
        }
    }

    showAnnouncement(text, color = '#fed330', duration = 180) {
        this.announcementText = text;
        this.announcementColor = color;
        this.announcementTimer = duration;
    }

    /**
     * Renders progressive snow layer onto the arena terrain in world coordinates
     */
    drawGroundOverlay(ctx, camera, arena) {
        if (this.ascentSystem && this.floor < this.maxFloors) {
            this.ascentSystem.drawStairwayWorld(ctx, camera);
        }
        if (this.floor === 5) {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 215, 0, 0.06)';
            ctx.beginPath();
            ctx.arc(0, -100, 680, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    /**
     * Renders falling snowflakes, screen ambient tint, and banners in screen space
     */
    render(ctx, width, height) {
        const floorData = this.getCurrentFloorData();

        // 1. Ambient Olympus Altitude Tint
        if (floorData && floorData.ambientColor) {
            ctx.save();
            ctx.fillStyle = floorData.ambientColor;
            ctx.fillRect(0, 0, width, height);

            // Summit Lightning / Divine radiance flash
            if (this.floor === 5 && this.summitFlashTimer > 0) {
                const flashAlpha = Math.min(0.22, (this.summitFlashTimer / 18) * 0.22);
                ctx.fillStyle = `rgba(255, 230, 150, ${flashAlpha})`;
                ctx.fillRect(0, 0, width, height);
            }
            ctx.restore();
        }

        // 2. Falling Snowflakes (Screen Space — batched by alpha bucket on mobile low/medium)
        if (this.snowflakes.length > 0) {
            ctx.save();
            if (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile && !MobilePerf.isHighGraphics()) {
                for (let b = 0; b < 2; b++) {
                    ctx.fillStyle = b === 0 ? 'rgba(255, 255, 255, 0.48)' : 'rgba(255, 255, 255, 0.82)';
                    ctx.beginPath();
                    for (let i = 0; i < this.snowflakes.length; i++) {
                        const fl = this.snowflakes[i];
                        if ((fl.alpha > 0.62 ? 1 : 0) !== b) continue;
                        ctx.moveTo(fl.x + fl.radius, fl.y);
                        ctx.arc(fl.x, fl.y, fl.radius, 0, Math.PI * 2);
                    }
                    ctx.fill();
                }
            } else {
                for (let i = 0; i < this.snowflakes.length; i++) {
                    const flake = this.snowflakes[i];
                    ctx.fillStyle = `rgba(255, 255, 255, ${flake.alpha})`;
                    ctx.beginPath();
                    ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.restore();
        }

        // 3. Floor Announcement Banner
        if (this.announcementTimer > 0 && this.announcementText) {
            ctx.save();
            const alpha = Math.min(1.0, this.announcementTimer / 25);
            ctx.globalAlpha = alpha;

            const cx = width / 2;
            const cy = height * 0.28;

            ctx.font = "900 26px 'Lilita One', 'Montserrat', cursive, sans-serif";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const metrics = ctx.measureText(this.announcementText);
            const pw = metrics.width + 48;
            const ph = 46;

            ctx.fillStyle = 'rgba(10, 15, 25, 0.78)';
            ctx.beginPath();
            ctx.roundRect(cx - pw / 2, cy - ph / 2, pw, ph, 14);
            ctx.fill();

            ctx.lineWidth = 3;
            ctx.strokeStyle = this.announcementColor;
            ctx.stroke();

            ctx.lineWidth = 5;
            ctx.strokeStyle = '#141416';
            ctx.strokeText(this.announcementText, cx, cy);

            ctx.fillStyle = this.announcementColor;
            ctx.fillText(this.announcementText, cx, cy);

            ctx.restore();
        }

        if (this.ascentSystem) {
            const game = (typeof window !== 'undefined') ? window.gameInstance : null;
            this.ascentSystem.renderScreenOverlay(ctx, width, height, game);
        }
        if (this.floor === 5 && typeof ZeusSkyPhase !== 'undefined') {
            ZeusSkyPhase.drawCrystalCounterHUD(ctx, width, height, (typeof window !== 'undefined') ? window.gameInstance : null);
        }
    }
}

if (typeof window !== 'undefined') window.DungeonManager = DungeonManager;
if (typeof module !== 'undefined' && module.exports) module.exports = { DungeonManager, OLYMPUS_FLOORS };
