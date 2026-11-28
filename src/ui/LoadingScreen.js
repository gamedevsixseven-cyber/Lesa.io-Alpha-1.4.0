/**
 * Lesa.io - Comic Loading Screen & Asset Preloader
 * Orchestrates preloading of images, GPU texture warmup, audio buffers,
 * fonts, and cloud state, displaying a live 0% to 100% animated progress bar.
 */

class LoadingScreen {
    constructor(onComplete = null) {
        this.onComplete = onComplete;
        this.isDone = false;
        this.currentProgress = 0;
        this.targetProgress = 4;
        this.startTime = performance.now();

        this.screen = document.getElementById('loading-screen');
        this.barFill = document.getElementById('loading-bar-fill');
        this.percentageText = document.getElementById('loading-percentage');
        this.statusText = document.getElementById('loading-status');
        this.tipText = document.getElementById('loading-tip');

        this.lastTipText = '';
        this.hardwareProfile = this.detectHardware();
        this.initTips();
        this.startLoop();
        this.startPreloading();
    }

    detectHardware() {
        const cores = navigator.hardwareConcurrency || 4;
        const memory = navigator.deviceMemory || 4;
        return {
            cores,
            memory,
            isHighEnd: cores >= 6 && memory >= 6
        };
    }

    getNextTip() {
        if (typeof window !== 'undefined' && window.TipsManager && typeof window.TipsManager.getRandomTip === 'function') {
            return window.TipsManager.getRandomTip({ formatted: true });
        }

        // Fallback if TipsManager data script has not loaded yet
        const fallbackTips = (typeof window !== 'undefined' && window.GAMEPLAY_TIPS) ? 
            window.GAMEPLAY_TIPS.map(t => t.text) : [
                'TIP: <span class="loading-tip-highlight">Psanas</span> is the ultimate balanced all-rounder—dependable in any scenario!',
                'TIP: Press <span class="loading-tip-highlight">[E]</span> for <span class="loading-tip-highlight">Blade Rush</span> to dash forward and slash for 85 damage!',
                'TIP: Press <span class="loading-tip-highlight">[SPACE] or Right-Click</span> to Dash with invulnerability frames!',
                'TIP: When <span class="loading-tip-highlight">Skatmir</span> winds up his charge, dash sideways to avoid fatal knockback!',
                'TIP: <span class="loading-tip-highlight">Casillas</span> stumbles briefly after diving—strike while he is recovering!',
                'TIP: Avoid <span class="loading-tip-highlight">Skarmogyftos’ purple smoke</span>! It slows your hero down by 30%!',
                'TIP: Shoot red barrels to trigger a <span class="loading-tip-highlight">250 area damage</span> explosion against hordes!',
                'TIP: Stacking <span class="loading-tip-highlight">Multi-Shot upgrades</span> turns any gun into a room-clearing fan of doom!'
            ];

        let nextTip = fallbackTips[Math.floor(Math.random() * fallbackTips.length)];
        if (nextTip === this.lastTipText && fallbackTips.length > 1) {
            nextTip = fallbackTips[(fallbackTips.indexOf(nextTip) + 1) % fallbackTips.length];
        }
        this.lastTipText = nextTip;
        return nextTip;
    }

    initTips() {
        if (!this.tipText) return;

        // Immediately show a random formatted tip
        this.tipText.innerHTML = this.getNextTip();

        // Smoothly rotate tips during loading with CSS fade transitions
        this.tipInterval = setInterval(() => {
            if (this.isDone) return;

            if (this.tipText) {
                this.tipText.style.opacity = '0';
                setTimeout(() => {
                    if (this.tipText && !this.isDone) {
                        this.tipText.innerHTML = this.getNextTip();
                        this.tipText.style.opacity = '1';
                    }
                }, 200);
            }
        }, 2200);
    }

    startLoop() {
        const step = () => {
            if (this.isDone && this.currentProgress >= 100) return;

            // Smoothly interpolate current towards target with natural easing
            if (this.currentProgress < this.targetProgress) {
                const diff = this.targetProgress - this.currentProgress;
                const speed = Math.max(0.35, diff * 0.09);
                this.currentProgress = Math.min(this.targetProgress, this.currentProgress + speed);
            }

            const rounded = Math.min(100, Math.round(this.currentProgress));

            if (this.barFill) {
                this.barFill.style.width = `${rounded}%`;
            }
            if (this.percentageText) {
                this.percentageText.textContent = `${rounded}%`;
            }

            // Update live status text milestones
            if (this.statusText) {
                if (rounded < 20) {
                    this.statusText.textContent = 'Initializing GPU & audio engine...';
                } else if (rounded < 45) {
                    this.statusText.textContent = 'Warming up hero & boss textures in VRAM...';
                } else if (rounded < 70) {
                    this.statusText.textContent = 'Pre-caching sound effects & music...';
                } else if (rounded < 88) {
                    this.statusText.textContent = 'Synchronizing cloud profile & quests...';
                } else if (rounded < 100) {
                    this.statusText.textContent = 'Optimizing arena performance...';
                } else {
                    this.statusText.textContent = 'READY!';
                }
            }

            if (rounded >= 100 && !this.isDone) {
                this.finish();
                return;
            }

            this.animFrame = requestAnimationFrame(step);
        };

        this.animFrame = requestAnimationFrame(step);
    }

    /**
     * Pre-render images onto an offscreen canvas to force GPU VRAM upload
     */
    warmupGPU(images) {
        try {
            const offscreen = document.createElement('canvas');
            offscreen.width = 128;
            offscreen.height = 128;
            const ctx = offscreen.getContext('2d');
            if (ctx) {
                for (const img of images) {
                    if (img && img.complete && img.naturalWidth > 0) {
                        ctx.clearRect(0, 0, 128, 128);
                        ctx.drawImage(img, 0, 0, 128, 128);
                    }
                }
            }
            if (typeof MobilePerf !== 'undefined') MobilePerf.releaseCanvas(offscreen);
        } catch (e) {
            // Silently continue if canvas is unavailable
        }
    }

    async startPreloading() {
        const imageAssets = [
            'assets/HeroesIcons/PsanasFront.png',
            'assets/HeroesIcons/PsanasBack.png',
            'assets/HeroesIcons/PsanasAvatar.png',
            'assets/HeroesIcons/PsogasFront.png',
            'assets/HeroesIcons/PsogasBack.png',
            'assets/HeroesIcons/PsogasAvatar.png',
            'assets/HeroesIcons/PetrosFront.png',
            'assets/HeroesIcons/PetrosBack.png',
            'assets/HeroesIcons/PetrosAvatar.png',
            'assets/HeroesIcons/Fatmirfront.png',
            'assets/HeroesIcons/FatmirBack.png',
            'assets/HeroesIcons/FatmirAvatar.png',
            'assets/HeroesIcons/KleanthisFront.png',
            'assets/HeroesIcons/KleanthisBack.png',
            'assets/HeroesIcons/KleanthisAvatar.png',
            'assets/SkillsIcons/BladeRushSkill.png',
            'assets/SkillsIcons/NerobalonakiSkill.png',
            'assets/icons/StarterPackBannerIcon.png',
            'assets/icons/StarterPackChestIcon.png',
            'assets/GearUIIcons/Gear&EquipmentIcon.png',
            'assets/casillas.jpg',
            'assets/skarmogyftos.jpg',
            'assets/SelectScreenLesaio.png',
            'assets/LeftMenuScreenLogos.png',
            'assets/UpdatedLoadingLesa.io.png',
            'assets/GameWorldModels/FloorTexture1LesaIO.png',
            'assets/GameWorldModels/UpdatedTreeLESAIO_transparent.png'
        ];

        const audioAssets = [
            'Audio/select.mp3',
            'Audio/goback.mp3',
            'Audio/pop.mp3',
            'Audio/psanas_start.mp3',
            'Audio/fatmir_charge.mp3',
            'Audio/levelup.mp3',
            'Audio/gameover.mp3'
        ];

        const isMobile = typeof MobilePerf !== 'undefined' && MobilePerf.isMobile;
        // Minimum cinematic pacing floor for rock-solid stability
        const minLoadingDurationMs = isMobile ? 3600 : 2100;

        // Safety fallback timer: gives mobile extra time to complete staged asset preloading
        const maxSafetyTimer = setTimeout(() => {
            this.targetProgress = 100;
        }, isMobile ? 8500 : 3200);

        try {
            // Stage 1: Warm up SoundEngine AudioContext
            if (window.soundEngine && typeof window.soundEngine.init === 'function') {
                window.soundEngine.init();
            }

            // Stage 2: Fonts readiness check
            if (document.fonts && document.fonts.ready) {
                await Promise.race([
                    document.fonts.ready,
                    new Promise((r) => setTimeout(r, isMobile ? 600 : 300))
                ]);
            }
            this.targetProgress = Math.max(this.targetProgress, 18);

            // Stage 3: Preload Image Textures into shared caches & Warm up GPU VRAM
            let loadedImageObjects = [];
            let loadedCount = 0;
            const loadSharedImg = (rawSrc) => {
                const src = (isMobile && typeof MobileAssetGuard !== 'undefined' && MobileAssetGuard.normalizeAssetPath)
                    ? MobileAssetGuard.normalizeAssetPath(rawSrc)
                    : rawSrc;
                if (src.includes('FloorTexture1LesaIO.png') && typeof Arena !== 'undefined') return Arena.getFloorTexture1();
                if (src.includes('UpdatedTreeLESAIO_transparent.png') && typeof Obstacle !== 'undefined') return Obstacle.getTreeImage();
                if (typeof CharacterSprites !== 'undefined') return CharacterSprites.get(src);
                const el = new Image();
                el.src = src;
                return el;
            };

            if (isMobile) {
                // MOBILE-ONLY LIGHTWEIGHT STAGED PRELOADER:
                // Preloads only the active hero + visible menu + first-wave terrain/enemy sprites
                // so iOS Safari / Android WebViews do not pin ~200MB of idle modal/gear bitmaps at boot.
                const selHero = (window.GameState && window.GameState.player && window.GameState.player.selectedHero)
                    || localStorage.getItem('lesaio_selected_hero') || 'psanas';
                const heroSpriteMap = {
                    psanas: ['assets/HeroesIcons/PsanasFront.png', 'assets/HeroesIcons/PsanasBack.png', 'assets/HeroesIcons/PsanasAvatar.png'],
                    psogas: ['assets/HeroesIcons/PsogasFront.png', 'assets/HeroesIcons/PsogasBack.png', 'assets/HeroesIcons/PsogasAvatar.png'],
                    petros: ['assets/HeroesIcons/PetrosFront.png', 'assets/HeroesIcons/PetrosBack.png', 'assets/HeroesIcons/PetrosAvatar.png'],
                    fatmir: ['assets/HeroesIcons/Fatmirfront.png', 'assets/HeroesIcons/FatmirBack.png', 'assets/HeroesIcons/FatmirAvatar.png'],
                    billias: ['assets/HeroesIcons/Billias.png', 'assets/HeroesIcons/BilliasAvatar.png'],
                    kitsos: ['assets/HeroesIcons/Kitsos.png', 'assets/HeroesIcons/KitsosAvatar.png'],
                    psgiannhs: ['assets/HeroesIcons/Psgiannhs.png', 'assets/HeroesIcons/PsgiannhsAvatar.png'],
                    '50balos': ['assets/HeroesIcons/50balos.png', 'assets/HeroesIcons/50balosCrop.png']
                };
                const coreMobileQueue = [
                    ...(heroSpriteMap[selHero] || heroSpriteMap.psanas),
                    'assets/HeroesIcons/Fatmirfront.png',
                    'assets/HeroesIcons/FatmirBack.png',
                    'assets/SkillsIcons/BladeRushSkill.png',
                    'assets/SkillsIcons/NerobalonakiSkill.png',
                    'assets/GearUIIcons/Gear&EquipmentIcon.png',
                    'assets/skarmogyftos.jpg',
                    'assets/SelectScreenLesaio.png',
                    'assets/LeftMenuScreenLogos.png',
                    'assets/UpdatedLoadingLesa.io.png',
                    'assets/GameWorldModels/FloorTexture1LesaIO.png',
                    'assets/GameWorldModels/UpdatedTreeLESAIO_transparent.png'
                ];
                const fullMobileQueue = Array.from(new Set(coreMobileQueue.filter(Boolean)));
                let qIdx = 0;
                const totalMobile = Math.max(1, fullMobileQueue.length);

                const loadOneMobile = (src) => new Promise((resolve) => {
                    const img = loadSharedImg(src);
                    let settled = false;
                    const finishOne = () => {
                        if (settled) return;
                        settled = true;
                        loadedCount++;
                        if (img) loadedImageObjects.push(img);
                        const pct = 18 + Math.round((loadedCount / totalMobile) * 66);
                        this.targetProgress = Math.max(this.targetProgress, Math.min(84, pct));
                        resolve();
                    };
                    if (!img || (img.complete && img.naturalWidth > 0)) {
                        finishOne();
                        return;
                    }
                    img.addEventListener('load', finishOne, { once: true });
                    img.addEventListener('error', finishOne, { once: true });
                    setTimeout(finishOne, 3000);
                });

                const mobileWorker = async () => {
                    while (qIdx < fullMobileQueue.length) {
                        const nextSrc = fullMobileQueue[qIdx++];
                        await loadOneMobile(nextSrc);
                    }
                };
                await Promise.race([
                    Promise.all([mobileWorker(), mobileWorker(), mobileWorker()]),
                    new Promise((r) => setTimeout(r, 4500))
                ]);

                if (typeof MobileAssetGuard !== 'undefined') {
                    MobileAssetGuard.dehydrateHiddenModals();
                    MobileAssetGuard.sweepBrokenImages(document);
                }
                this.warmupGPU(loadedImageObjects.slice(0, 8));
                loadedImageObjects.length = 0;
                this.targetProgress = Math.max(this.targetProgress, 86);
            } else {
                const imgPromises = imageAssets.map((src) => {
                    return new Promise((resolve) => {
                        const img = loadSharedImg(src);
                        let done = false;
                        const finishOne = () => {
                            if (done) return;
                            done = true;
                            loadedCount++;
                            loadedImageObjects.push(img);
                            const imgPct = 20 + Math.round((loadedCount / imageAssets.length) * 32);
                            this.targetProgress = Math.max(this.targetProgress, imgPct);
                            resolve();
                        };
                        if (!img || (img.complete && img.naturalWidth > 0)) {
                            finishOne();
                            return;
                        }
                        img.addEventListener('load', finishOne, { once: true });
                        img.addEventListener('error', finishOne, { once: true });
                        setTimeout(finishOne, 1200);
                    });
                });

                await Promise.race([
                    Promise.all(imgPromises),
                    new Promise((r) => setTimeout(r, 1200))
                ]);

                // Force GPU texture compilation into VRAM
                this.warmupGPU(loadedImageObjects);
                this.targetProgress = Math.max(this.targetProgress, 56);

                // Stage 4: Preload Audio Sound Effects
                let loadedAudioCount = 0;
                const audioPromises = audioAssets.map((src) => {
                    return new Promise((resolve) => {
                        const audio = new Audio();
                        audio.preload = 'auto';
                        audio.oncanplaythrough = audio.onerror = () => {
                            loadedAudioCount++;
                            const audPct = 56 + Math.round((loadedAudioCount / audioAssets.length) * 26);
                            this.targetProgress = Math.max(this.targetProgress, audPct);
                            resolve();
                        };
                        audio.src = src;
                        audio.load();
                    });
                });

                await Promise.race([
                    Promise.all(audioPromises),
                    new Promise((r) => setTimeout(r, 800))
                ]);

                this.targetProgress = Math.max(this.targetProgress, 84);
            }

            // Stage 5: Cloud profile & quests synchronization window
            await new Promise((r) => setTimeout(r, 350));
            this.targetProgress = 96;

            // Ensure minimum cinematic duration is respected for silky smooth presentation
            const elapsed = performance.now() - this.startTime;
            if (elapsed < minLoadingDurationMs) {
                await new Promise((r) => setTimeout(r, minLoadingDurationMs - elapsed));
            }

            this.targetProgress = 100;
        } catch (e) {
            console.warn('[LoadingScreen] Preloading notice:', e);
            this.targetProgress = 100;
        } finally {
            clearTimeout(maxSafetyTimer);
        }
    }

    finish() {
        if (this.isDone) return;
        this.isDone = true;

        if (this.tipInterval) clearInterval(this.tipInterval);
        if (this.animFrame) cancelAnimationFrame(this.animFrame);

        // Ensure 100% displayed cleanly
        if (this.barFill) this.barFill.style.width = '100%';
        if (this.percentageText) this.percentageText.textContent = '100%';
        if (this.statusText) this.statusText.textContent = 'READY!';

        setTimeout(() => {
            if (this.screen) {
                this.screen.classList.add('fade-out');

                // Reveal menu screen seamlessly as loading screen begins fading out
                const menu = document.getElementById('menu-screen');
                if (menu) {
                    menu.classList.remove('hidden');
                    menu.style.removeProperty('display');
                }
                if (typeof VirtualLandscape !== 'undefined' && VirtualLandscape.active) {
                    VirtualLandscape.sync();
                }
                if (typeof MobileAssetGuard !== 'undefined') {
                    MobileAssetGuard.sweepBrokenImages(document);
                }

                setTimeout(() => {
                    this.screen.classList.add('hidden');
                    if (typeof MobileAssetGuard !== 'undefined') {
                        MobileAssetGuard.dehydrateContainer(this.screen);
                    }
                    if (typeof this.onComplete === 'function') {
                        this.onComplete();
                    }
                }, 520);
            } else {
                const menu = document.getElementById('menu-screen');
                if (menu) {
                    menu.classList.remove('hidden');
                    menu.style.removeProperty('display');
                }
                if (typeof VirtualLandscape !== 'undefined' && VirtualLandscape.active) {
                    VirtualLandscape.sync();
                }
                if (typeof MobileAssetGuard !== 'undefined') {
                    MobileAssetGuard.sweepBrokenImages(document);
                }
                if (typeof this.onComplete === 'function') {
                    this.onComplete();
                }
            }
        }, 220);
    }
}

if (typeof window !== 'undefined') {
    window.LoadingScreen = LoadingScreen;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LoadingScreen };
}
