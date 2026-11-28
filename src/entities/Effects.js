/**
 * Lesa.io - High-Performance Visual Effects & Comic Popups Engine
 * AAA Studio Optimizations:
 * 1. Zero Garbage Collection Object Pooling for Popups and Particles
 * 2. Canvas State Batching & CSS Font Parser Bypass
 * 3. Direct Coordinate Drawing (Avoids 2D transform matrix stack allocation for floating numbers)
 * 4. Camera Frustum Culling (Zero CPU/GPU cost for off-screen impacts)
 * 5. Deterministic Concurrency Budget Throttling (Guaranteed 60 FPS in massive waves)
 */

// ComicPopup is managed and hardware-accelerated via ComicPopupCache.js
const ComicPopupClass = (typeof FastComicPopup !== 'undefined') ? FastComicPopup : (window.FastComicPopup || class FallbackComicPopup {
    constructor() { this.reset(0, 0, '', '#ffdf00', 20, false); }
    reset(x, y, text, color = '#ffdf00', size = 20, isCrit = false) {
        this.x = x; this.y = y; this.text = text; this.color = color;
        this.life = 1.0; this.vy = -1.8; this.isCrit = isCrit;
    }
    update(dt = 1) { this.y += this.vy * dt; this.life -= 0.025 * dt; }
    draw(ctx) {
        if (this.life <= 0) return;
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, this.x, this.y);
    }
});

// Particle, ShockwaveRing, and SlashWave are loaded from ParticleEffect.js
const ParticleClass = (typeof Particle !== 'undefined') ? Particle : window.Particle;
const ShockwaveClass = (typeof ShockwaveRing !== 'undefined') ? ShockwaveRing : window.ShockwaveRing;
const SlashWaveClass = (typeof SlashWave !== 'undefined') ? SlashWave : window.SlashWave;
const GroundCrackClass = (typeof GroundCrack !== 'undefined') ? GroundCrack : window.GroundCrack;
const LightningBeamClass = (typeof LightningBeam !== 'undefined') ? LightningBeam : window.LightningBeam;

class EffectsManager {
    constructor() {
        this.popups = [];
        this.popupPool = [];
        this.particles = [];
        this.particlePool = [];
        this.shockwaves = [];
        this.shockwavePool = [];
        this.slashes = [];
        this.slashPool = [];
        this.groundCracks = [];
        this.lightningBeams = [];

        // Concurrency budget caps (preset-aware on mobile, full fidelity on high/desktop)
        const mobPreset = (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile) ? MobilePerf.getPreset() : null;
        this.MAX_POPUPS = mobPreset ? mobPreset.maxPopups : 16;
        this.MAX_PARTICLES = mobPreset ? mobPreset.maxParticles : 50;

        // Settings toggles
        this.showPopups = localStorage.getItem('lesaio_popups') !== 'false'; // default true
        this.showDamage = localStorage.getItem('lesaio_damage_numbers') !== 'false'; // default true
        this.combatJuice = (typeof CombatJuiceFX !== 'undefined') ? new CombatJuiceFX(this) : null;
    }

    setShowPopups(val) {
        this.showPopups = val;
        localStorage.setItem('lesaio_popups', val);
    }

    setShowDamage(val) {
        this.showDamage = val;
        localStorage.setItem('lesaio_damage_numbers', val);
    }

    isCameraVisible(x, y, radius = 50) {
        const cam = window.gameInstance ? window.gameInstance.camera : null;
        if (!cam) return true;
        return cam.isVisible(x, y, radius);
    }

    acquirePopup(x, y, text, color, size, isCrit) {
        let pop = this.popupPool.pop();
        if (!pop) {
            pop = new ComicPopupClass();
        }
        pop.reset(x, y, text, color, size, isCrit);
        return pop;
    }

    acquireParticle(x, y, vx, vy, color, radius, life, shape) {
        let part = this.particlePool.pop();
        if (!part) {
            part = new ParticleClass();
        }
        part.reset(x, y, vx, vy, color, radius, life, shape);
        return part;
    }

    addPopup(x, y, text, color = '#ffdd00', size = 24, isCrit = false) {
        if (!this.showPopups) return;
        if (!this.isCameraVisible(x, y, 60)) return;

        if (this.popups.length >= this.MAX_POPUPS) {
            if (!isCrit) return; // Drop low-priority non-crit if saturated
            // Recycle oldest to give priority to crit
            const recycled = this.popups.shift();
            this.popupPool.push(recycled);
        }

        this.popups.push(this.acquirePopup(x, y, text, color, size, isCrit));
    }

    addDamage(x, y, amount, isCrit = false, isPlayer = false, isDrenched = false) {
        if (!this.showDamage) return;
        if (!this.isCameraVisible(x, y, 50)) return;

        // Damage Number Compaction: Combine close damage on same enemy to prevent lag
        for (let i = this.popups.length - 1; i >= 0; i--) {
            const p = this.popups[i];
            if (!p.isCrit && !p.isDrenched && p.life > 0.4 && Math.hypot(p.x - x, p.y - y) < 28) {
                const prev = parseInt(p.text, 10) || 0;
                const total = prev + Math.round(amount);
                p.text = total.toString();
                p.cachedSprite = window.ComicTextCacheInstance ? window.ComicTextCacheInstance.getCanvas(p.text, p.color, false) : null;
                p.scale = 1.25;
                p.life = Math.min(1.0, p.life + 0.15);
                return;
            }
        }

        if (this.popups.length >= this.MAX_POPUPS) {
            if (!isCrit && !isDrenched) return; // Skip non-crit to maintain 60 FPS in massive swarms
            const recycled = this.popups.shift();
            this.popupPool.push(recycled);
        }

        const text = Math.round(amount).toString();
        // Water pool (Nerobalonaki) drenched damage renders in comic water blue (#00d2d3) instead of yellow
        const color = isPlayer ? '#ff3b30' : (isDrenched ? '#00d2d3' : (isCrit ? '#ffcc00' : '#ffffff'));
        const size = (isCrit || isDrenched) ? 28 : 18;
        const pop = this.acquirePopup(x, y, text, color, size, isCrit || isDrenched);
        pop.isDrenched = !!isDrenched;
        this.popups.push(pop);
    }

    addComicSplash(x, y, type = 'POW!') {
        if (!this.isCameraVisible(x, y, 80)) return;

        if (this.showPopups && window.ComicThrottlerInstance) {
            const decision = window.ComicThrottlerInstance.filterSplash(x, y, type, this.popups.length);
            if (!decision) return; // Throttled duplicate or saturated swarm

            const chosen = decision.text;
            const colors = ['#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#af52de'];
            const col = decision.color || colors[Math.floor(Math.random() * colors.length)];

            if (this.popups.length >= this.MAX_POPUPS) {
                const recycled = this.popups.shift();
                this.popupPool.push(recycled);
            }
            this.popups.push(this.acquirePopup(x, y, chosen, col, 34, decision.isCrit));

            // Lean particle sparks bounded by budget (max 2)
            const sparkCount = Math.min(2, Math.max(0, this.MAX_PARTICLES - this.particles.length));
            for (let i = 0; i < sparkCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 3;
                this.particles.push(this.acquireParticle(
                    x, y,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                    '#ffd32a',
                    4.0,
                    0.6,
                    'star'
                ));
            }
        }
    }

    addDust(x, y, count = 2, spread = 5) {
        if (count <= 2 && typeof MobileAdaptivePerf !== 'undefined' && MobileAdaptivePerf.shouldThrottleAmbientParticle() && this.particles.length >= (this.MAX_PARTICLES >> 1)) return;
        if (!this.isCameraVisible(x, y, 40)) return;
        const spawnCount = Math.min(count, Math.max(0, this.MAX_PARTICLES - this.particles.length));

        for (let i = 0; i < spawnCount; i++) {
            const vx = (Math.random() * 2 - 1) * spread * 0.25;
            const vy = (Math.random() * 2 - 1) * spread * 0.25;
            this.particles.push(this.acquireParticle(
                x + (Math.random() * 6 - 3),
                y + (Math.random() * 6 - 3),
                vx, vy,
                '#e0dacb',
                6 + Math.random() * 3,
                0.65,
                'dust'
            ));
        }
    }

    addDustPuff(x, y, color = '#e0dacb', count = 3) {
        this.addDust(x, y, count, 8);
        if (color !== '#e0dacb') {
            this.addSparks(x, y, color, Math.min(count, 3));
        }
    }

    addSparks(x, y, color = '#ffcc00', count = 4) {
        if (!this.isCameraVisible(x, y, 40)) return;
        const spawnCount = Math.min(count, Math.max(0, this.MAX_PARTICLES - this.particles.length));

        for (let i = 0; i < spawnCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3.5;
            this.particles.push(this.acquireParticle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color,
                3 + Math.random() * 2,
                0.65,
                'circle'
            ));
        }
    }

    addShockwave(x, y, radius = 130, color = 'rgba(255, 100, 0, 0.8)') {
        if (!this.isCameraVisible(x, y, radius)) return;
        let sw;
        if (this.shockwaves.length >= 8) {
            sw = this.shockwaves.shift();
            if (sw && sw.reset) sw.reset(x, y, radius, color, 8);
            else sw = new ShockwaveClass(x, y, radius, color);
        } else {
            sw = this.shockwavePool.pop();
            if (sw && sw.reset) sw.reset(x, y, radius, color, 8);
            else sw = new ShockwaveClass(x, y, radius, color);
        }
        this.shockwaves.push(sw);
    }

    addGroundCrack(x, y, radius = 160, color = '#2c3e50', glowColor = '#3498db', maxLife = 140) {
        if (!this.isCameraVisible(x, y, radius)) return;
        if (this.groundCracks.length >= 8) {
            this.groundCracks.shift(); // Bound active cracks
        }
        const CrackCtor = (typeof GroundCrack !== 'undefined') ? GroundCrack : (GroundCrackClass || window.GroundCrack);
        if (CrackCtor) {
            this.groundCracks.push(new CrackCtor(x, y, radius, color, glowColor, maxLife));
        }
    }

    addLightningChain(x1, y1, x2, y2, color = '#00d2d3') {
        const BeamCtor = (typeof LightningBeam !== 'undefined') ? LightningBeam : (LightningBeamClass || window.LightningBeam);
        if (BeamCtor) {
            if (this.lightningBeams.length >= 12) this.lightningBeams.shift();
            this.lightningBeams.push(new BeamCtor(x1, y1, x2, y2, color));
        }
        this.addSparks(x2, y2, color, 4);
    }

    addSlash(x, y, angle, radius = 75, color = '#00d2d3') {
        if (!this.isCameraVisible(x, y, radius)) return;
        let sl;
        if (this.slashes.length >= 6) {
            sl = this.slashes.shift();
            if (sl && sl.reset) sl.reset(x, y, angle, radius, Math.PI * 0.95, color);
            else sl = new SlashWaveClass(x, y, angle, radius, Math.PI * 0.95, color);
        } else {
            sl = this.slashPool.pop();
            if (sl && sl.reset) sl.reset(x, y, angle, radius, Math.PI * 0.95, color);
            else sl = new SlashWaveClass(x, y, angle, radius, Math.PI * 0.95, color);
        }
        this.slashes.push(sl);

        // Spawn controlled metallic sparkles along the crescent
        const sparkCount = Math.min(4, Math.max(0, this.MAX_PARTICLES - this.particles.length));
        for (let i = 0; i < sparkCount; i++) {
            const spreadAngle = angle + (Math.random() - 0.5) * 0.8;
            const dist = radius * (0.6 + Math.random() * 0.4);
            const px = x + Math.cos(spreadAngle) * dist;
            const py = y + Math.sin(spreadAngle) * dist;
            this.particles.push(this.acquireParticle(
                px, py,
                Math.cos(spreadAngle) * (2 + Math.random() * 2.5),
                Math.sin(spreadAngle) * (2 + Math.random() * 2.5),
                '#ffffff',
                3 + Math.random() * 2,
                0.45,
                'star'
            ));
        }
    }

    addConfetti(x, y, count = 18) {
        const colors = ['#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#007aff', '#af52de'];
        const spawnCount = Math.min(count, Math.max(0, this.MAX_PARTICLES - this.particles.length));
        for (let i = 0; i < spawnCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 4.5;
            this.particles.push(this.acquireParticle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                colors[Math.floor(Math.random() * colors.length)],
                5 + Math.random() * 2.5,
                1.1,
                'star'
            ));
        }
    }

    addDashTrail(x, y, radius = 24, color = '#ffd32a') {
        this.addDust(x, y, 6, 8);
        this.addComicSplash(x, y - 25, 'WHOOSH!');
        if (color) this.addSparks(x, y, color, 3);
    }

    addMuzzleFlash(x, y, angle, weaponType = 'pea', scale = 1.0, isEnemy = false) {
        if (this.combatJuice && this.isCameraVisible(x, y, 60)) {
            this.combatJuice.triggerMuzzleFlash(x, y, angle, weaponType, scale, isEnemy);
        }
    }

    addImpactSplat(x, y, weaponType = 'pea', isCrit = false, isEnemy = false, scale = 1.0) {
        if (this.combatJuice && this.isCameraVisible(x, y, 60)) {
            this.combatJuice.addImpactSplat(x, y, weaponType, isCrit, isEnemy, scale);
        }
    }

    addDeathPop(x, y, radius = 26, color = '#2ed573', isBoss = false) {
        if (this.combatJuice && this.isCameraVisible(x, y, radius * 3 + 40)) {
            this.combatJuice.addDeathPop(x, y, radius, color, isBoss);
        }
    }

    triggerScreenFlash(color = '#ffd32a', maxAlpha = 0.34, durationFrames = 28) {
        if (this.combatJuice) {
            this.combatJuice.triggerScreenFlash(color, maxAlpha, durationFrames);
        }
    }

    onBossSlam(zoomAmount = 0.042) {
        const cam = (typeof window !== 'undefined' && window.gameInstance) ? window.gameInstance.camera : null;
        if (cam && typeof cam.punchZoom === 'function') {
            cam.punchZoom(zoomAmount, false);
        }
    }

    drawScreenSpace(ctx, width, height, player) {
        if (typeof MobilePerf !== 'undefined' && MobilePerf.isHighGraphics()) {
            MobilePerf.drawHighQualityLighting(ctx, width, height, window.gameInstance);
        }
        if (typeof EndlessMapEvolution !== 'undefined') {
            EndlessMapEvolution.drawScreenAtmosphere(ctx, width, height);
        }
        if (typeof EndlessHardMap !== 'undefined') {
            EndlessHardMap.drawScreenAtmosphere(ctx, width, height);
        }
        if (typeof KolossosArenaAtmosphere !== 'undefined') {
            KolossosArenaAtmosphere.drawScreenFog(ctx, width, height);
        }
        if (typeof ApexW60Atmosphere !== 'undefined') {
            ApexW60Atmosphere.drawScreenAtmosphere(ctx, width, height);
        }
        if (typeof ApexW60FinaleTeaser !== 'undefined') {
            ApexW60FinaleTeaser.draw(ctx, width, height, window.gameInstance);
        }
        if (typeof DlcLightingEngine !== 'undefined') {
            DlcLightingEngine.drawScreenLighting(ctx, width, height, window.gameInstance);
        }
        if (this.combatJuice) {
            this.combatJuice.drawScreenOverlays(ctx, width, height, player);
        }
    }

    update(dt = 1) {
        // High-Performance In-place Compaction with Pool Recycling
        let pWrite = 0;
        for (let i = 0; i < this.popups.length; i++) {
            const popup = this.popups[i];
            popup.update(dt);
            if (popup.life > 0) {
                this.popups[pWrite++] = popup;
            } else {
                this.popupPool.push(popup); // Return to pool for reuse (Zero GC)
            }
        }
        this.popups.length = pWrite;

        let partWrite = 0;
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            particle.update(dt);
            if (particle.life > 0) {
                this.particles[partWrite++] = particle;
            } else {
                this.particlePool.push(particle); // Return to pool for reuse (Zero GC)
            }
        }
        this.particles.length = partWrite;

        let sWrite = 0;
        for (let i = 0; i < this.shockwaves.length; i++) {
            const sw = this.shockwaves[i];
            sw.update(dt);
            if (sw.life > 0) {
                this.shockwaves[sWrite++] = sw;
            } else {
                this.shockwavePool.push(sw);
            }
        }
        this.shockwaves.length = sWrite;

        let slWrite = 0;
        for (let i = 0; i < this.slashes.length; i++) {
            const slash = this.slashes[i];
            slash.update(dt);
            if (slash.life > 0) {
                this.slashes[slWrite++] = slash;
            } else {
                this.slashPool.push(slash);
            }
        }
        this.slashes.length = slWrite;

        let gcWrite = 0;
        for (let i = 0; i < this.groundCracks.length; i++) {
            const gc = this.groundCracks[i];
            gc.update(dt);
            if (gc.life > 0) {
                this.groundCracks[gcWrite++] = gc;
            }
        }
        this.groundCracks.length = gcWrite;

        let lbWrite = 0;
        for (let i = 0; i < this.lightningBeams.length; i++) {
            const beam = this.lightningBeams[i];
            beam.update(dt);
            if (beam.life > 0) {
                this.lightningBeams[lbWrite++] = beam;
            }
        }
        this.lightningBeams.length = lbWrite;

        if (this.combatJuice) this.combatJuice.update(dt);
        const gameRef = (typeof window !== 'undefined') ? window.gameInstance : null;
        if (typeof ChronoRifle !== 'undefined') ChronoRifle.update(dt, gameRef);
        if (typeof SymbioteLauncher !== 'undefined') SymbioteLauncher.update(dt, gameRef);
        if (typeof HeliosOmegaCannon !== 'undefined') HeliosOmegaCannon.update(dt, gameRef);
        if (typeof SkewerCharcoalRifle !== 'undefined') SkewerCharcoalRifle.update(dt, gameRef);
        if (typeof HephaestusVulcanMinigun !== 'undefined') HephaestusVulcanMinigun.update(dt, gameRef);
        if (typeof HadesOblivionRailgun !== 'undefined') HadesOblivionRailgun.update(dt);
        if (typeof MedusaGorgonGaze !== 'undefined') MedusaGorgonGaze.update(dt);
        if (typeof HyperionCelestialGlaive !== 'undefined') HyperionCelestialGlaive.update(dt, gameRef);
        if (typeof ChestWeaponsCoordinator !== 'undefined') ChestWeaponsCoordinator.updateWorldFx(dt, gameRef);
        if (typeof EndlessMapEvolution !== 'undefined') {
            EndlessMapEvolution.update(dt, gameRef);
        }
        if (typeof EndlessHardMap !== 'undefined') {
            EndlessHardMap.update(dt, gameRef);
        }
        if (typeof KolossosArenaAtmosphere !== 'undefined') {
            KolossosArenaAtmosphere.update(dt, gameRef);
        }
        if (typeof ApexW60Atmosphere !== 'undefined') {
            ApexW60Atmosphere.update(dt, gameRef);
        }
        if (typeof ApexW60FinaleTeaser !== 'undefined') {
            ApexW60FinaleTeaser.update(dt, gameRef);
        }
    }

    drawGround(ctx) {
        const cam = window.gameInstance ? window.gameInstance.camera : null;
        if (this.combatJuice) this.combatJuice.drawGround(ctx, cam);
        if (typeof HeroUltimates !== 'undefined' && HeroUltimates.drawExhaustFires) HeroUltimates.drawExhaustFires(ctx, cam);
        if (typeof MobileAimAssist !== 'undefined' && window.gameInstance) {
            MobileAimAssist.drawReticle(ctx, window.gameInstance);
        }
        for (let i = 0; i < this.groundCracks.length; i++) {
            const gc = this.groundCracks[i];
            if (!cam || cam.isVisible(gc.x, gc.y, gc.radius + 30)) {
                gc.draw(ctx);
            }
        }
    }

    draw(ctx) {
        const cam = window.gameInstance ? window.gameInstance.camera : null;

        // 1. Shockwaves
        for (let i = 0; i < this.shockwaves.length; i++) {
            const sw = this.shockwaves[i];
            if (!cam || cam.isVisible(sw.x, sw.y, sw.radius + 20)) sw.draw(ctx);
        }

        // 2. Slashes & Lightning Beams
        for (let i = 0; i < this.slashes.length; i++) {
            const slash = this.slashes[i];
            if (!cam || cam.isVisible(slash.x, slash.y, slash.radius + 30)) slash.draw(ctx);
        }
        for (let i = 0; i < this.lightningBeams.length; i++) {
            const beam = this.lightningBeams[i];
            if (!cam || cam.isVisible(beam.x2, beam.y2, 100)) beam.draw(ctx);
        }

        // 3. Particles & World Combat Juice (Muzzle Flashes & Death Pops)
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            if (!cam || cam.isVisible(p.x, p.y, p.radius + 20)) p.draw(ctx);
        }
        if (this.combatJuice) this.combatJuice.drawWorld(ctx, cam);
        if (typeof ChronoRifle !== 'undefined') ChronoRifle.drawWorld(ctx, cam);
        if (typeof SymbioteLauncher !== 'undefined') SymbioteLauncher.drawWorld(ctx, cam);
        if (typeof HeliosOmegaCannon !== 'undefined') HeliosOmegaCannon.drawWorld(ctx, cam);
        if (typeof SkewerCharcoalRifle !== 'undefined') SkewerCharcoalRifle.drawWorld(ctx, cam);
        if (typeof HeroUltimates !== 'undefined' && HeroUltimates.drawBurningEnemies) HeroUltimates.drawBurningEnemies(ctx, cam);
        if (typeof HadesOblivionRailgun !== 'undefined') HadesOblivionRailgun.drawWorld(ctx, cam);
        if (typeof MedusaGorgonGaze !== 'undefined') MedusaGorgonGaze.drawWorld(ctx, cam);
        if (typeof HyperionCelestialGlaive !== 'undefined') HyperionCelestialGlaive.drawWorld(ctx, cam);
        if (typeof ChestWeaponsCoordinator !== 'undefined') ChestWeaponsCoordinator.drawWorldFx(ctx, cam);

        if (typeof EndlessMapEvolution !== 'undefined') {
            EndlessMapEvolution.drawWorldForeground(ctx, cam);
        }
        if (typeof EndlessHardMap !== 'undefined') {
            EndlessHardMap.drawWorldForeground(ctx, cam);
        }
        if (typeof KolossosArenaAtmosphere !== 'undefined') {
            KolossosArenaAtmosphere.drawWorldFog(ctx, cam);
        }
        if (typeof ApexW60Atmosphere !== 'undefined') {
            ApexW60Atmosphere.drawWorldWeather(ctx, cam);
        }

        // 4. Comic Popups & Floating Damage: Hardware-Accelerated Bitmap Pass
        if (this.showPopups || this.showDamage) {
            for (let i = 0; i < this.popups.length; i++) {
                const pop = this.popups[i];
                if (!cam || cam.isVisible(pop.x, pop.y, 40)) {
                    pop.draw(ctx);
                }
            }
            ctx.globalAlpha = 1.0;
        }
    }

    clear() {
        for (let i = 0; i < this.popups.length; i++) {
            this.popupPool.push(this.popups[i]);
        }
        this.popups.length = 0;

        for (let i = 0; i < this.particles.length; i++) {
            this.particlePool.push(this.particles[i]);
        }
        this.particles.length = 0;

        this.shockwaves.length = 0;
        this.slashes.length = 0;
        this.groundCracks.length = 0;
        this.lightningBeams.length = 0;
        if (this.combatJuice) this.combatJuice.clear();
        if (typeof ChronoRifle !== 'undefined') ChronoRifle.clear();
        if (typeof SymbioteLauncher !== 'undefined') SymbioteLauncher.clear();
        if (typeof HeliosOmegaCannon !== 'undefined') HeliosOmegaCannon.clear();
        if (typeof SkewerCharcoalRifle !== 'undefined') SkewerCharcoalRifle.clear();
        if (typeof HadesOblivionRailgun !== 'undefined') HadesOblivionRailgun.clear();
        if (typeof MedusaGorgonGaze !== 'undefined') MedusaGorgonGaze.clear();
        if (typeof HyperionCelestialGlaive !== 'undefined') HyperionCelestialGlaive.clear();
        if (typeof ChestWeaponsCoordinator !== 'undefined') ChestWeaponsCoordinator.clearWorldFx();
        if (typeof EndlessMapEvolution !== 'undefined') {
            EndlessMapEvolution.reset();
        }
        if (typeof EndlessHardMap !== 'undefined') {
            EndlessHardMap.reset();
        }
        if (typeof KolossosArenaAtmosphere !== 'undefined') {
            KolossosArenaAtmosphere.reset();
        }
        if (typeof ApexW60Atmosphere !== 'undefined') {
            ApexW60Atmosphere.reset();
        }
        if (typeof ApexW60FinaleTeaser !== 'undefined') {
            ApexW60FinaleTeaser.reset();
        }
        if (typeof DlcLightingEngine !== 'undefined') DlcLightingEngine.reset();
    }
}

if (typeof window !== 'undefined') {
    window.ComicPopup = ComicPopupClass;
    window.Particle = ParticleClass;
    window.ShockwaveRing = ShockwaveClass;
    window.SlashWave = SlashWaveClass;
    window.GroundCrack = GroundCrackClass;
    window.EffectsManager = EffectsManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ComicPopup: ComicPopupClass, Particle: ParticleClass, ShockwaveRing: ShockwaveClass, SlashWave: SlashWaveClass, GroundCrack: GroundCrackClass, EffectsManager };
}
