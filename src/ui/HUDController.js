/**
 * Lesa.io - In-Game HUD & Mini-map Controller
 * Handles HUD bars (HP, XP), Dash cooldown, score, wave status, killfeed, leaderboards, and mini-map radar
 */

class HUDController {
    constructor() {
        this.hud = document.getElementById('game-hud');

        // HUD Elements
        this.hpFill = document.getElementById('hp-fill');
        this.hpText = document.getElementById('hp-text');
        this.xpFill = document.getElementById('xp-fill');
        this.levelText = document.getElementById('level-badge-text');
        this.scoreText = document.getElementById('score-text');
        this.waveText = document.getElementById('wave-text');
        this.waveEnemyCountText = document.getElementById('wave-enemy-count');
        this.dashFill = document.getElementById('dash-cooldown-fill');
        this.dashBadge = document.getElementById('dash-badge');
        this.skillFill = document.getElementById('skill-cooldown-fill');
        this.skillBadge = document.getElementById('skill-badge');
        this.ultFill = document.getElementById('ult-cooldown-fill');
        this.ultBadge = document.getElementById('ult-badge');
        this.chronoBadge = document.getElementById('chrono-skip-badge');
        this.weaponIcon = document.getElementById('weapon-icon');
        this.weaponName = document.getElementById('weapon-name');
        this.hudAvatarImg = document.getElementById('hud-avatar-img');
        this.mobileFpsPill = document.getElementById('mobile-fps-pill');

        // Clickable HUD badges
        if (this.dashBadge) {
            this.dashBadge.addEventListener('click', () => {
                if (window.gameInstance && window.gameInstance.input && window.gameInstance.input.onDashCallback) {
                    window.gameInstance.input.onDashCallback();
                }
            });
        }
        if (this.skillBadge) {
            this.skillBadge.addEventListener('click', () => {
                if (window.gameInstance && window.gameInstance.input && window.gameInstance.input.onSkillCallback) {
                    window.gameInstance.input.onSkillCallback();
                }
            });
        }
        if (this.ultBadge) {
            this.ultBadge.addEventListener('click', () => {
                if (window.gameInstance && window.gameInstance.input && window.gameInstance.input.onUltCallback) {
                    window.gameInstance.input.onUltCallback();
                }
            });
        }
        if (this.chronoBadge) {
            this.chronoBadge.addEventListener('click', () => {
                if (window.gameInstance && window.gameInstance.waveSkipper) {
                    window.gameInstance.waveSkipper.tryActivate(window.gameInstance);
                }
            });
        }

        // Mini-map Canvas
        this.minimapCanvas = document.getElementById('minimap-canvas');
        if (this.minimapCanvas) {
            this.minimapCtx = this.minimapCanvas.getContext('2d');
        }
        this._hudCache = Object.create(null);
        this._skillSpan = this.skillBadge ? this.skillBadge.querySelector('span') : null;
        this._chronoSpan = this.chronoBadge ? this.chronoBadge.querySelector('span') : null;
        this._cachedFallbackSkill = null;
        this._hudFrame = 0;
        this._initInGameChat();
    }

    show() {
        if (this.hud) this.hud.classList.remove('hidden');
        if (window.uiController && window.uiController.skillManager) {
            window.uiController.skillManager.updateHUDIcon();
        }
    }

    hide() {
        this.closeChatInput();
        if (this.hud) this.hud.classList.add('hidden');
    }

    update(player, wave, remainingEnemies = 0, totalEnemies = 0) {
        if (!player) return;
        const c = this._hudCache || (this._hudCache = Object.create(null));
        this._hudFrame = (this._hudFrame + 1) | 0;

        if (this.hpFill) {
            const hpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
            if (c.hpPct !== hpPct) {
                c.hpPct = hpPct;
                this.hpFill.style.width = `${hpPct}%`;
            }
        }
        if (this.hpText) {
            const ceilHp = Math.ceil(player.hp);
            if (c.ceilHp !== ceilHp || c.maxHp !== player.maxHp) {
                c.ceilHp = ceilHp;
                c.maxHp = player.maxHp;
                this.hpText.textContent = `${ceilHp} / ${player.maxHp}`;
            }
        }

        if (this.xpFill) {
            const xpPct = Math.min(100, (player.xp / player.xpNeeded) * 100);
            if (c.xpPct !== xpPct) {
                c.xpPct = xpPct;
                this.xpFill.style.width = `${xpPct}%`;
            }
        }
        if (this.levelText && c.level !== player.level) {
            c.level = player.level;
            this.levelText.textContent = `LVL ${player.level}`;
        }

        if (this.scoreText && c.score !== player.score) {
            c.score = player.score;
            this.scoreText.textContent = player.score.toLocaleString();
        }
        if (this.waveText) {
            const isEndless = (window.gameInstance && window.gameInstance.gameMode === 'endless');
            const isDungeon = (window.gameInstance && window.gameInstance.gameMode === 'dungeons');
            if (isDungeon) {
                const floorName = (window.gameInstance.waveManager && window.gameInstance.waveManager.dungeonManager) ? window.gameInstance.waveManager.dungeonManager.getCurrentFloorName() : 'OLYMPUS';
                const waveKey = `d:${wave}:${floorName}`;
                if (c.waveKey !== waveKey) {
                    c.waveKey = waveKey;
                    const txt = `🏛️ F${wave}/5: ${floorName.toUpperCase()}`;
                    if (typeof UiIcons !== 'undefined') UiIcons.setRichText(this.waveText, txt, 'ui-icon-sm');
                    else this.waveText.textContent = txt;
                }
            } else {
                const waveKey = isEndless ? `e:${wave}` : `w:${wave}`;
                if (c.waveKey !== waveKey) {
                    c.waveKey = waveKey;
                    const waveTxt = isEndless ? `⚡ ENDLESS ${wave}` : `WAVE ${wave}`;
                    if (typeof UiIcons !== 'undefined') UiIcons.setRichText(this.waveText, waveTxt, 'ui-icon-sm');
                    else this.waveText.textContent = waveTxt;
                }
            }
        }

        if (this.waveEnemyCountText) {
            const isDungeon = (window.gameInstance && window.gameInstance.gameMode === 'dungeons');
            const dm = window.gameInstance && window.gameInstance.waveManager && window.gameInstance.waveManager.dungeonManager;
            if (window.gameInstance && window.gameInstance.waveState === 'WAVE_CLEARED') {
                const climbText = (dm && dm.ascentSystem && dm.ascentSystem.stairwayUnlocked)
                    ? 'FLOOR CLEARED! Walk to North Stairs ▲'
                    : 'FLOOR CLEARED! Ascending...';
                const nextTxt = isDungeon ? climbText : 'CLEARED! Next wave incoming...';
                if (c.enemyTxt !== nextTxt) {
                    c.enemyTxt = nextTxt;
                    this.waveEnemyCountText.textContent = nextTxt;
                }
                if (c.enemyColor !== '#2ed573') {
                    c.enemyColor = '#2ed573';
                    this.waveEnemyCountText.style.color = '#2ed573';
                }
            } else {
                const nextTxt = `Enemies: ${remainingEnemies} / ${totalEnemies}`;
                if (c.enemyTxt !== nextTxt) {
                    c.enemyTxt = nextTxt;
                    this.waveEnemyCountText.textContent = nextTxt;
                }
                if (c.enemyColor !== '#ff4757') {
                    c.enemyColor = '#ff4757';
                    this.waveEnemyCountText.style.color = '#ff4757';
                }
            }
        }

        if (this.dashFill && this.dashBadge) {
            if (player.dashCooldown > 0) {
                const dashPct = 100 - (player.dashCooldown / player.maxDashCooldown) * 100;
                if (c.dashPct !== dashPct) {
                    c.dashPct = dashPct;
                    this.dashFill.style.width = `${dashPct}%`;
                }
                if (c.dashOnCd !== true) {
                    c.dashOnCd = true;
                    this.dashBadge.classList.add('on-cooldown');
                }
            } else {
                if (c.dashPct !== 100) {
                    c.dashPct = 100;
                    this.dashFill.style.width = '100%';
                }
                if (c.dashOnCd !== false) {
                    c.dashOnCd = false;
                    this.dashBadge.classList.remove('on-cooldown');
                }
            }
        }

        if (this.skillFill && this.skillBadge) {
            if (player.frappesFrenzyTimer > 0) {
                // Active Frenzy Duration: bar depletes with duration and increases with kills
                const maxFrenzy = player.frappesFrenzyMaxTimer || 300;
                const durationPct = Math.max(0, Math.min(100, (player.frappesFrenzyTimer / maxFrenzy) * 100));
                if (c.skillPct !== durationPct) {
                    c.skillPct = durationPct;
                    this.skillFill.style.width = `${durationPct}%`;
                }
                if (c.skillActive !== true) {
                    c.skillActive = true;
                    this.skillBadge.classList.add('is-active');
                }
                if (c.skillOnCd !== false) {
                    c.skillOnCd = false;
                    this.skillBadge.classList.remove('on-cooldown');
                }
            } else if (player.skillCooldown > 0) {
                // The moment effect ends, cooldown drops and the skill bar fills up
                if (c.skillActive !== false) {
                    c.skillActive = false;
                    this.skillBadge.classList.remove('is-active');
                }
                const skillPct = Math.max(0, Math.min(100, 100 - (player.skillCooldown / player.maxSkillCooldown) * 100));
                if (c.skillPct !== skillPct) {
                    c.skillPct = skillPct;
                    this.skillFill.style.width = `${skillPct}%`;
                }
                if (c.skillOnCd !== true) {
                    c.skillOnCd = true;
                    this.skillBadge.classList.add('on-cooldown');
                }
            } else {
                if (c.skillActive !== false) {
                    c.skillActive = false;
                    this.skillBadge.classList.remove('is-active');
                }
                if (c.skillPct !== 100) {
                    c.skillPct = 100;
                    this.skillFill.style.width = '100%';
                }
                if (c.skillOnCd !== false) {
                    c.skillOnCd = false;
                    this.skillBadge.classList.remove('on-cooldown');
                }
            }

            const skillSpan = this._skillSpan || (this._skillSpan = this.skillBadge.querySelector('span'));
            let baseSkill = player.selectedSkill || player.equippedSkill;
            if (!baseSkill) {
                if (this._cachedFallbackSkill === null || (this._hudFrame & 31) === 0) {
                    this._cachedFallbackSkill = localStorage.getItem('lesaio_selected_skill') || 'blade_rush';
                }
                baseSkill = this._cachedFallbackSkill;
            }
            const isMasteredFrappes = baseSkill === 'frappes' &&
                (player.hasPagakiaMastery || (typeof PlayerSkills !== 'undefined' && PlayerSkills.getSkillLevel('frappes') >= 5));
            const skillKey = isMasteredFrappes ? 'frappes_plus' : baseSkill;

            if (skillSpan && this.currentSkillKey !== skillKey) {
                this.currentSkillKey = skillKey;
                const skillConfigs = {
                    'nerobalonaki': { img: 'assets/SkillsIcons/NerobalonakiSkill.png', name: 'NEROBALONAKI' },
                    'blade_rush': { img: 'assets/SkillsIcons/BladeRushSkill.png', name: 'BLADE RUSH' },
                    'seismic_quake': { img: 'assets/SkillsIcons/SeismicQuakeSkill.png', name: 'SEISMIC QUAKE' },
                    'chair_throw': { img: 'assets/SkillsIcons/ChairThrowSkill.svg', name: 'CHAIR THROW' },
                    'komboloi_vortex': { img: 'assets/SkillsIcons/KomboloiVortexSkill.svg', name: 'KOMBOLOI VORTEX' },
                    'ouzo_flambe': { img: 'assets/SkillsIcons/OuzoFlambeSkill.svg', name: 'OUZO FLAMBÉ' },
                    'donkey_stampede': { img: 'assets/SkillsIcons/DonkeyStampedeSkill.svg', name: 'GAIDAROS' },
                    'bouzouki_decoy': { img: 'assets/SkillsIcons/BouzoukiDecoySkill.svg', name: 'JUKEBOX' },
                    'yaya_scream': { img: 'assets/SkillsIcons/YayaScreamSkill.png', name: 'YAYA SCREAM' },
                    'frappes': { img: 'assets/SkillsIcons/FrappesSkill.png', name: 'FRAPPES' },
                    'frappes_plus': { img: 'assets/SkillsIcons/FrappesSkill.png', name: 'FRAPPES+' },
                    'chrono_hourglass': { img: 'assets/SkillsIcons/ChronoHourglassSkill.svg', name: 'CHRONOS' },
                    'wrath_of_olympus': { img: 'assets/SkillsIcons/WrathOfOlympusSkill.svg', name: 'WRATH OF OLYMPUS' }
                };
                const cfg = skillConfigs[skillKey] || skillConfigs['blade_rush'];
                skillSpan.innerHTML = `<img src="${cfg.img}" class="dash-badge-img" alt="${cfg.name}"> ${cfg.name} (E)`;
                this.skillBadge.title = `Press E to use ${cfg.name}`;
            }
        }

        if (this.ultBadge && this.ultFill) {
            const uState = (typeof HeroUltimates !== 'undefined') ? HeroUltimates.getHUDState(player) : null;
            if (c.ultVisible !== !!uState) {
                c.ultVisible = !!uState;
                this.ultBadge.classList.toggle('hidden', !uState);
            }
            if (uState) {
                if (c.ultPct !== uState.pct) {
                    c.ultPct = uState.pct;
                    this.ultFill.style.width = `${uState.pct}%`;
                }
                const uMode = uState.active ? 2 : (uState.ready ? 0 : 1);
                if (c.ultMode !== uMode) {
                    c.ultMode = uMode;
                    this.ultBadge.classList.toggle('is-active', uMode === 2);
                    this.ultBadge.classList.toggle('is-ready', uMode === 0);
                    this.ultBadge.classList.toggle('on-cooldown', uMode === 1);
                }
                const ultSpan = this._ultSpan || (this._ultSpan = this.ultBadge.querySelector('span'));
                const uKey = `${uState.cfg.id}:${uState.active ? 'ACT' : (uState.ready ? 'RDY' : uState.pct)}`;
                if (ultSpan && c.ultKey !== uKey) {
                    c.ultKey = uKey;
                    const suffix = uState.active ? 'ACTIVE!' : (uState.ready ? 'READY (Q)' : `${uState.pct}%`);
                    ultSpan.innerHTML = `<img src="${uState.cfg.icon}" class="dash-badge-img" alt="${uState.cfg.name}"> ${uState.cfg.name} • ${suffix}`;
                    this.ultBadge.title = `Press Q to activate ${uState.cfg.name}`;
                }
            }
        }

        const weaponNames = {
            pea: 'Pea Slingshot', watermelon: 'Melon Cannon', bubble: 'Bubble Gun', pepper: 'Chili Blaster',
            money_gun: 'Money Gun', burger: 'Burger Toss', lightning: 'Lightning Strike', greek_flag: 'Greek Flag',
            m4_carbine: 'M4 Carbine', spas12: 'SPAS-12', rusty_smg: 'Street Uzi', nail_gun: 'Village Nailgun',
            plasma_pistol: 'Neon Arc Pistol', sawnoff_shotgun: 'Sawn-Off DB', frost_cannon: 'Cryo Vortex',
            boomerang_saw: 'Boomerang Sawblade', chrono_rifle: 'Chrono Stutter Rifle', symbiote: 'Symbiote Launcher',
            carbine: "Kiloumpas's Carbine", dialtone: 'Dial-Tone Blaster', zeus_thunderbolt: "Zeus's Thunderbolt", helios_cannon: 'Helios Omega Cannon'
        };
        const weaponKeys = {
            pea: 'weapon_pea', watermelon: 'weapon_watermelon', bubble: 'weapon_bubble', pepper: 'weapon_pepper',
            money_gun: 'weapon_money_gun', burger: 'weapon_burger', lightning: 'weapon_lightning', greek_flag: 'weapon_greek_flag',
            m4_carbine: 'weapon_m4_carbine', spas12: 'weapon_spas12', rusty_smg: 'weapon_rusty_smg', nail_gun: 'weapon_nail_gun',
            plasma_pistol: 'weapon_plasma_pistol', sawnoff_shotgun: 'weapon_sawnoff_shotgun', frost_cannon: 'weapon_frost_cannon',
            boomerang_saw: 'weapon_boomerang_saw', chrono_rifle: 'weapon_chrono_rifle', symbiote: 'weapon_symbiote',
            carbine: 'weapon_carbine', dialtone: 'weapon_dialtone', zeus_thunderbolt: 'weapon_zeus_thunderbolt', helios_cannon: 'weapon_helios_cannon'
        };
        const weaponIcons = {
            pea: '🌱', watermelon: '🍉', bubble: '🫧', pepper: '🌶️', money_gun: '💵', burger: '🍔', lightning: '⚡', greek_flag: '🇬🇷',
            m4_carbine: '🔫', spas12: '🔫', rusty_smg: '🔫', nail_gun: '🔨', plasma_pistol: '⚡', sawnoff_shotgun: '💥',
            frost_cannon: '❄️', boomerang_saw: '🪚', chrono_rifle: '⏳', symbiote: '🦠', carbine: '🔫', dialtone: '📱', zeus_thunderbolt: '⚡', helios_cannon: '☀️'
        };
        if (this.weaponIcon) {
            const wKey = weaponKeys[player.weaponType] || 'weapon_pea';
            if (c.weaponKey !== wKey) {
                c.weaponKey = wKey;
                if (typeof UiIcons !== 'undefined') this.weaponIcon.innerHTML = UiIcons.i(wKey, 'ui-icon-sm');
                else this.weaponIcon.textContent = weaponIcons[player.weaponType] || '🌱';
            }
        }
        if (this.weaponName) {
            const baseWName = weaponNames[player.weaponType] || 'Pea Slingshot';
            const isWepEvo = typeof WeaponEvolutionManager !== 'undefined' && WeaponEvolutionManager.isEvolved(player.weaponType);
            const wName = isWepEvo ? `${baseWName} ★` : baseWName;
            if (c.weaponName !== wName) {
                c.weaponName = wName;
                this.weaponName.textContent = wName;
            }
        }

        if (this.chronoBadge && window.gameInstance) {
            const isEndless = window.gameInstance.gameMode === 'endless';
            if (c.chronoHidden !== !isEndless) {
                c.chronoHidden = !isEndless;
                this.chronoBadge.classList.toggle('hidden', !isEndless);
            }
            if (isEndless) {
                const cores = player.chronoCores || 0;
                const skipper = window.gameInstance.waveSkipper;
                const skipsUsed = skipper ? (skipper.skipsUsed || 0) : 0;
                const fallbackCost = (typeof WaveSkipperMachine !== 'undefined') ? WaveSkipperMachine.getRequiredCost(skipsUsed) : 3;
                const info = (typeof WaveSkipperMachine !== 'undefined' && window.gameInstance.waveManager)
                    ? WaveSkipperMachine.getSkipInfo(wave, window.gameInstance.waveState, 'endless', cores, skipsUsed)
                    : { canSkip: false, targetWave: null, cost: fallbackCost };
                const reqCost = info.cost || fallbackCost;
                const span = this._chronoSpan || (this._chronoSpan = this.chronoBadge.querySelector('span'));
                if (span) {
                    const nextChrono = info.canSkip
                        ? `⚡ SKIP → W${info.targetWave} (${cores}/${reqCost})`
                        : `⏳ CORES: ${cores}/${reqCost}`;
                    if (c.chronoTxt !== nextChrono) {
                        c.chronoTxt = nextChrono;
                        span.textContent = nextChrono;
                    }
                }
                const ready = !!info.canSkip;
                if (c.chronoReady !== ready) {
                    c.chronoReady = ready;
                    this.chronoBadge.classList.toggle('is-ready', ready);
                }
                const readyNear = !!(info.canSkip && skipper && skipper.playerInRange);
                if (c.chronoReadyNear !== readyNear) {
                    c.chronoReadyNear = readyNear;
                    this.chronoBadge.classList.toggle('is-ready-near', readyNear);
                }
            }
        }

        this.minimapFrameCount = (this.minimapFrameCount || 0) + 1;
        const minimapEvery = (typeof MobileAdaptivePerf !== 'undefined') ? MobileAdaptivePerf.getMinimapInterval(6) : ((typeof MobilePerf !== 'undefined' && MobilePerf.isMobile) ? 6 : 2);
        if (this.minimapFrameCount % minimapEvery === 0 && window.gameInstance) {
            this.drawMinimap(player, window.gameInstance.enemies, window.gameInstance.arena);
        }
        if (this.mobileFpsPill && typeof MobilePerf !== 'undefined' && MobilePerf.isMobile) {
            MobilePerf.tickFpsHUD(this.mobileFpsPill);
        }
    }

    addKillfeed(message) {
        // Disabled for offline cartoon arena focus
    }

    _initInGameChat() {
        if (!this.hud || typeof document === 'undefined' || document.getElementById('ingame-chat-wrap')) return;
        const wrap = document.createElement('div');
        wrap.id = 'ingame-chat-wrap';
        wrap.className = 'ingame-chat-wrap';
        wrap.innerHTML = `
            <div id="ingame-chat-log" class="ingame-chat-log"></div>
            <div id="ingame-chat-form" class="ingame-chat-form hidden">
                <input id="ingame-chat-input" class="ingame-chat-input" type="text" maxlength="90" placeholder="Type message & press Enter..." autocomplete="off" spellcheck="false">
            </div>
            <div id="ingame-chat-hint" class="ingame-chat-hint">Press [ENTER] to chat</div>
        `;
        this.hud.appendChild(wrap);
        this.chatLogEl = wrap.querySelector('#ingame-chat-log');
        this.chatFormEl = wrap.querySelector('#ingame-chat-form');
        this.chatInputEl = wrap.querySelector('#ingame-chat-input');
        this.chatHintEl = wrap.querySelector('#ingame-chat-hint');
        if (this.chatInputEl) {
            this.chatInputEl.addEventListener('blur', () => {
                setTimeout(() => {
                    if (document.activeElement !== this.chatInputEl) this.closeChatInput(false);
                }, 80);
            });
        }
    }

    handleEnterKey() {
        const isMobile = (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile) || (window.gameInstance && window.gameInstance.touchInput && window.gameInstance.touchInput.isTouchDevice);
        if (isMobile) return;
        if (!this.chatFormEl || !this.chatInputEl) this._initInGameChat();
        if (!this.chatFormEl || !this.chatInputEl) return;
        const isOpen = !this.chatFormEl.classList.contains('hidden');
        if (!isOpen) {
            this.chatFormEl.classList.remove('hidden');
            if (this.chatHintEl) this.chatHintEl.classList.add('hidden');
            this.chatInputEl.value = '';
            this.chatInputEl.focus();
        } else {
            const text = (this.chatInputEl.value || '').trim();
            if (text) this.sendChatMessage(text);
            this.closeChatInput(true);
        }
    }

    closeChatInput(clear = true) {
        if (!this.chatFormEl || !this.chatInputEl) return;
        if (clear) this.chatInputEl.value = '';
        this.chatInputEl.blur();
        this.chatFormEl.classList.add('hidden');
        if (this.chatHintEl) this.chatHintEl.classList.remove('hidden');
    }

    sendChatMessage(rawText) {
        const text = String(rawText || '').trim().slice(0, 90);
        if (!text) return;
        const g = typeof window !== 'undefined' ? window.gameInstance : null;
        const myName = (g && g.player && g.player.name) || (window.GameState && window.GameState.player && window.GameState.player.name) || 'Hero';
        this.receiveChatMessage(myName, text, g ? g.player : null, true);
        if (g && g.coopSession && g.coopSession.net && g.coopSession.net.connected) {
            g.coopSession.net.send('COOP_CHAT', { name: myName, text });
        }
    }

    receiveChatMessage(senderName, rawText, entity = null, isSelf = false) {
        const text = String(rawText || '').trim().slice(0, 90);
        if (!text) return;
        if (!this.chatLogEl) this._initInGameChat();
        const name = String(senderName || 'Hero').trim().slice(0, 18);
        if (entity) entity._chatBubble = { text, expiresAt: Date.now() + 5500 };
        if (this.chatLogEl) {
            const row = document.createElement('div');
            row.className = `ingame-chat-msg ${isSelf ? 'is-self' : 'is-peer'}`;
            const nameSpan = document.createElement('span');
            nameSpan.className = 'ingame-chat-author';
            nameSpan.textContent = `${name}: `;
            const txtSpan = document.createElement('span');
            txtSpan.className = 'ingame-chat-text';
            txtSpan.textContent = text;
            row.appendChild(nameSpan);
            row.appendChild(txtSpan);
            this.chatLogEl.appendChild(row);
            while (this.chatLogEl.children.length > 5) {
                this.chatLogEl.removeChild(this.chatLogEl.firstChild);
            }
            setTimeout(() => { row.classList.add('is-fading'); }, 7500);
            setTimeout(() => { if (row.parentNode) row.remove(); }, 8500);
        }
        if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
            window.soundEngine.playSelect();
        }
    }

    drawMinimap(player, enemies = [], arena = null) {
        if (!this.minimapCtx || !arena) return;
        const ctx = this.minimapCtx;
        const w = this.minimapCanvas.width;
        const h = this.minimapCanvas.height;

        ctx.clearRect(0, 0, w, h);

        ctx.fillStyle = '#55efc4';
        ctx.fillRect(0, 0, w, h);

        const scaleX = w / arena.width;
        const scaleY = h / arena.height;

        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (e.dead) continue;
            const mx = (arena.halfWidth ? (e.x + arena.halfWidth) : e.x) * scaleX;
            const my = (arena.halfHeight ? (e.y + arena.halfHeight) : e.y) * scaleY;
            if (e.isBoss) {
                ctx.fillStyle = '#e84118';
            } else if (e.isCrystal) {
                ctx.fillStyle = '#00f5ff';
            } else if (e.type === 'fatmir') {
                ctx.fillStyle = '#eb4d4b'; // Red for heavy Skatmir
            } else if (e.type === 'skarmogyftos') {
                ctx.fillStyle = '#9b59b6'; // Purple for sneaky Skarmogyftos
            } else if (e.type === 'psaltis') {
                ctx.fillStyle = '#fdcb6e'; // Gold for the singing Psaltis
            } else {
                ctx.fillStyle = '#00b894'; // Green for agile Casillas
            }
            ctx.beginPath();
            ctx.arc(mx, my, e.isBoss ? 4.5 : (e.isCrystal ? 4.2 : (e.type === 'fatmir' ? 3.5 : 2.5)), 0, Math.PI * 2);
            ctx.fill();
        }

        if (window.gameInstance && window.gameInstance.coopSession && window.gameInstance.coopSession.remotePlayer) {
            const rp = window.gameInstance.coopSession.remotePlayer;
            if (!rp.isDownedDisconnected) {
                const rpx = (arena.halfWidth ? (rp.x + arena.halfWidth) : rp.x) * scaleX;
                const rpy = (arena.halfHeight ? (rp.y + arena.halfHeight) : rp.y) * scaleY;
                ctx.fillStyle = rp.isDowned ? '#ff4757' : '#00cec9';
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(rpx, rpy, 4.0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        }

        const px = (arena.halfWidth ? (player.x + arena.halfWidth) : player.x) * scaleX;
        const py = (arena.halfHeight ? (player.y + arena.halfHeight) : player.y) * scaleY;
        if (window.gameInstance && window.gameInstance.waveSkipper) {
            window.gameInstance.waveSkipper.drawMinimapMarker(ctx, arena, w, h);
        }
        ctx.fillStyle = '#0984e3';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}
