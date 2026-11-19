/**
 * Lesa.io - Touch Input Subsystem
 * High-performance mobile touch controls:
 * - Floating dynamic movement joystick (left half)
 * - Ergonomic Dash & Skill action buttons (right half)
 * - Nearest-Enemy Auto-Aim assist for mobile
 * - Automatic Landscape Screen Orientation locking
 */

class TouchInput {
    constructor(game) {
        this.game = game;
        this.isTouchDevice = this.detectTouchDevice();

        // Movement Vector (-1 to 1)
        this.movement = { dx: 0, dy: 0 };
        this.isMoving = false;

        // Joystick Tracking
        this.joystickPointerId = null;
        this.joystickOrigin = { x: 0, y: 0 };
        this.joystickCurrent = { x: 0, y: 0 };
        this.maxRadius = 42;
        this.deadzone = 6;

        // Aim & Shoot Tracking (Right Half)
        this.aimPointerId = null;
        this.aimOrigin = { x: 0, y: 0 };
        this.isShooting = false;
        this.isBubbleChargeHeld = false;
        this.autoFireEnabled = localStorage.getItem('lesaio_autofire') === 'true';
        this.autoAimMaxDistance = 750;

        // DOM Elements
        this.container = null;
        this.joystickZone = null;
        this.joystickBase = null;
        this.joystickKnob = null;
        this.aimZone = null;
        this.aimBase = null;
        this.aimKnob = null;
        this.dashBtn = null;
        this.skillBtn = null;
        this.dashRing = null;
        this.skillRing = null;

        this.initDOM();
        this.bindEvents();
    }

    detectTouchDevice() {
        const isCoarse = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        const isFine = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: fine)').matches;
        const hasTouch = typeof window !== 'undefined' && (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));

        // Return true on mobile touch devices
        if (isCoarse || hasTouch) return true;
        return false;
    }

    initDOM() {
        this.container = document.getElementById('mobile-controls-container');
        if (!this.container) return;

        this.joystickZone = document.getElementById('mobile-joystick-zone');
        this.joystickBase = document.querySelector('.mobile-joystick-base');
        this.joystickKnob = document.querySelector('.mobile-joystick-knob');
        this.aimZone = document.getElementById('mobile-aim-zone');
        this.aimBase = document.querySelector('.mobile-aim-base');
        this.aimKnob = document.querySelector('.mobile-aim-knob');
        this.dashBtn = document.getElementById('mobile-dash-btn');
        this.skillBtn = document.getElementById('mobile-skill-btn');
        this.bubbleBtn = document.getElementById('mobile-bubble-charge-btn');
        this.dashRing = this.dashBtn ? this.dashBtn.querySelector('.dash-ring') : null;
        this.skillRing = this.skillBtn ? this.skillBtn.querySelector('.skill-ring') : null;
        this.bubbleRing = this.bubbleBtn ? this.bubbleBtn.querySelector('.bubble-charge-ring') : null;
        this._skillImgEl = this.skillBtn ? (this.skillBtn.querySelector('.btn-skill-img-icon') || this.skillBtn.querySelector('#mobile-skill-img')) : null;
        this._skillLabelEl = this.skillBtn ? this.skillBtn.querySelector('.btn-label') : null;
        this._uiCache = Object.create(null);

        this.updateAutoFireState();

        // STRICT: If on PC/desktop, permanently disable and hide the container
        if (!this.isTouchDevice) {
            this.hide();
            this.container.style.display = 'none';
        }
    }

    updateAutoFireState() {
        if (!this.container) return;
        if (this.autoFireEnabled) {
            this.container.classList.add('autofire-active');
        } else {
            this.container.classList.remove('autofire-active');
        }
    }

    bindEvents() {
        // Fullscreen Toggle Button in Menu
        const fsBtn = document.getElementById('menu-fullscreen-btn');
        if (fsBtn) {
            fsBtn.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }

        // Auto Fullscreen on Play / Mode selection for mobile
        ['start-btn', 'mode-select-story-btn', 'mode-select-endless-btn', 'mode-select-dungeons-btn', 'open-coop-btn'].forEach((id) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => {
                    if (this.isTouchDevice) this.requestFullscreen();
                });
            }
        });

        // Global trigger helper
        window.triggerGameFullscreen = () => {
            if (this.isTouchDevice) this.requestFullscreen();
        };

        // Auto-pause if phone is minimized or incoming call occurs
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && this.game && this.game.state === 'PLAYING') {
                this.game.pauseGame();
            }
        });

        // Attempt Screen Orientation Lock & viewport scroll on any touch / orientation change
        const tryLockLandscape = () => {
            if (this.isTouchDevice) this.lockLandscape();
        };
        window.addEventListener('touchstart', tryLockLandscape, { once: true, passive: true });
        window.addEventListener('pointerdown', tryLockLandscape, { once: true, passive: true });
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                window.scrollTo(0, 1);
                if (this.game && typeof this.game.resize === 'function') this.game.resize();
            }, 250);
        });

        if (!this.joystickZone) return;

        // 1. Floating Joystick Pointer Events (Left Half)
        this.joystickZone.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse' && !this.isTouchDevice) return;
            if (!this.isTouchDevice) return;
            if (this.joystickPointerId !== null) return;
            this.joystickPointerId = e.pointerId;
            try { this.joystickZone.setPointerCapture(e.pointerId); } catch {}

            this.joystickOrigin = { x: e.clientX, y: e.clientY };
            this.joystickCurrent = { x: e.clientX, y: e.clientY };

            // Position visual joystick base
            if (this.joystickBase) {
                this.joystickBase.style.left = `${e.clientX}px`;
                this.joystickBase.style.top = `${e.clientY}px`;
                this.joystickBase.classList.add('active');
            }
            if (this.joystickKnob) {
                this.joystickKnob.style.transform = `translate(0px, 0px)`;
            }

            this.updateJoystick(e.clientX, e.clientY);
        });

        this.joystickZone.addEventListener('pointermove', (e) => {
            if (e.pointerId !== this.joystickPointerId) return;
            this.updateJoystick(e.clientX, e.clientY);
        });

        const releaseJoystick = (e) => {
            if (e.pointerType && e.pointerType !== 'touch') return;
            if (e.pointerId !== this.joystickPointerId) return;
            this.joystickPointerId = null;
            this.movement = { dx: 0, dy: 0 };
            this.isMoving = false;

            if (this.joystickBase) {
                this.joystickBase.classList.remove('active');
            }
            if (this.joystickKnob) {
                this.joystickKnob.style.transform = `translate(0px, 0px)`;
            }
        };

        this.joystickZone.addEventListener('pointerup', releaseJoystick);
        this.joystickZone.addEventListener('pointercancel', releaseJoystick);

        // 2. Floating Aim & Shoot Joystick (Right Half)
        if (this.aimZone) {
            this.aimZone.addEventListener('pointerdown', (e) => {
                if (e.pointerType === 'mouse' && !this.isTouchDevice) return;
                if (!this.isTouchDevice) return;
                if (this.aimPointerId !== null) return;

                this.aimPointerId = e.pointerId;
                try { this.aimZone.setPointerCapture(e.pointerId); } catch {}
                this.aimOrigin = { x: e.clientX, y: e.clientY };

                if (this.aimBase) {
                    this.aimBase.style.left = `${e.clientX}px`;
                    this.aimBase.style.top = `${e.clientY}px`;
                    this.aimBase.classList.add('active');
                }
                if (this.aimKnob) {
                    this.aimKnob.style.transform = `translate(0px, 0px)`;
                }

                this.updateAim(e.clientX, e.clientY);
            });

            this.aimZone.addEventListener('pointermove', (e) => {
                if (e.pointerId !== this.aimPointerId) return;
                this.updateAim(e.clientX, e.clientY);
            });

            const releaseAim = (e) => {
                if (e.pointerId !== this.aimPointerId) return;
                this.aimPointerId = null;
                this.isShooting = false;

                if (this.aimBase) {
                    this.aimBase.classList.remove('active');
                }
                if (this.aimKnob) {
                    this.aimKnob.style.transform = `translate(0px, 0px)`;
                }

                // Stop firing weapon
                if (this.game && this.game.input) {
                    this.game.input.mouse.leftDown = false;
                }
            };

            this.aimZone.addEventListener('pointerup', releaseAim);
            this.aimZone.addEventListener('pointercancel', releaseAim);
        }

        // 3. Dash Button
        if (this.dashBtn) {
            this.dashBtn.addEventListener('pointerdown', (e) => {
                if (e.pointerType && e.pointerType !== 'touch') return;
                e.stopPropagation();
                if (navigator.vibrate) navigator.vibrate(18);
                this.dashBtn.classList.add('pressed');
                if (this.game && this.game.input && this.game.input.onDashCallback) {
                    this.game.input.onDashCallback();
                }
            });
            const releaseDash = () => this.dashBtn.classList.remove('pressed');
            this.dashBtn.addEventListener('pointerup', releaseDash);
            this.dashBtn.addEventListener('pointercancel', releaseDash);
        }

        // 4. Skill Button
        if (this.skillBtn) {
            this.skillBtn.addEventListener('pointerdown', (e) => {
                if (e.pointerType && e.pointerType !== 'touch') return;
                e.stopPropagation();
                if (navigator.vibrate) navigator.vibrate(25);
                this.skillBtn.classList.add('pressed');
                if (this.game && this.game.input && this.game.input.onSkillCallback) {
                    this.game.input.onSkillCallback();
                }
            });
            const releaseSkill = () => this.skillBtn.classList.remove('pressed');
            this.skillBtn.addEventListener('pointerup', releaseSkill);
            this.skillBtn.addEventListener('pointercancel', releaseSkill);
        }

        // 5. Big Bubble Charge Button (Mobile)
        if (this.bubbleBtn) {
            this.bubbleBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                if (e.pointerId && this.bubbleBtn.setPointerCapture) {
                    try { this.bubbleBtn.setPointerCapture(e.pointerId); } catch (_) {}
                }
                if (navigator.vibrate) navigator.vibrate(15);
                this.bubbleBtn.classList.add('pressed');
                this.isBubbleChargeHeld = true;
                const player = this.game ? this.game.player : null;
                if (player && player.weaponType === 'bubble') {
                    player.isChargingBubble = true;
                }
                if (this.game && this.game.input && this.game.input.mouse) {
                    this.game.input.mouse.leftDown = false;
                }
            });
            const releaseCharge = (e) => {
                if (e && e.pointerId && this.bubbleBtn.releasePointerCapture) {
                    try { this.bubbleBtn.releasePointerCapture(e.pointerId); } catch (_) {}
                }
                this.bubbleBtn.classList.remove('pressed');
                this.isBubbleChargeHeld = false;
            };
            this.bubbleBtn.addEventListener('pointerup', releaseCharge);
            this.bubbleBtn.addEventListener('pointercancel', releaseCharge);
            this.bubbleBtn.addEventListener('pointerleave', (e) => {
                if (this.isBubbleChargeHeld && !this.bubbleBtn.hasPointerCapture?.(e.pointerId)) {
                    releaseCharge(e);
                }
            });
        }
    }

    updateJoystick(clientX, clientY) {
        const deltaX = clientX - this.joystickOrigin.x;
        const deltaY = clientY - this.joystickOrigin.y;
        const distance = Math.hypot(deltaX, deltaY);

        if (distance < this.deadzone) {
            this.movement = { dx: 0, dy: 0 };
            this.isMoving = false;
            if (this.joystickKnob) this.joystickKnob.style.transform = `translate(0px, 0px)`;
            return;
        }

        const angle = Math.atan2(deltaY, deltaX);
        const clampedDist = Math.min(distance, this.maxRadius);
        const knobX = Math.cos(angle) * clampedDist;
        const knobY = Math.sin(angle) * clampedDist;

        if (this.joystickKnob) {
            this.joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;
        }

        // Normalized movement vector
        const intensity = clampedDist / this.maxRadius;
        this.movement = {
            dx: Math.cos(angle) * intensity,
            dy: Math.sin(angle) * intensity
        };
        this.isMoving = true;
    }

    updateAim(clientX, clientY) {
        const deltaX = clientX - this.aimOrigin.x;
        const deltaY = clientY - this.aimOrigin.y;
        const distance = Math.hypot(deltaX, deltaY);

        const clampedDist = Math.min(distance, this.maxRadius);
        let knobX = 0;
        let knobY = 0;

        let angle = (this.game && this.game.player) ? this.game.player.angle : 0;
        if (distance > 0) {
            angle = Math.atan2(deltaY, deltaX);
            knobX = Math.cos(angle) * clampedDist;
            knobY = Math.sin(angle) * clampedDist;
        }

        if (this.aimKnob) {
            this.aimKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;
        }

        this.aimAngle = angle;
        this.isShooting = true;

        if (this.game && this.game.player) {
            this.game.player.angle = angle;
        }
        if (this.game && this.game.input && this.game.input.mouse) {
            this.game.input.mouse.leftDown = !(this.game.player && (this.game.player.isChargingBubble || this.isBubbleChargeHeld));
        }
    }

    update(dt) {
        if (!this.game || this.game.state !== 'PLAYING') return;

        // Freeze touch controls and auto-fire when cutscene is active
        if (typeof this.game.isCutsceneActive === 'function' && this.game.isCutsceneActive()) {
            if (this.game.input) this.game.input.mouse.leftDown = false;
            this.isShooting = false;
            this.isMoving = false;
            this.isBubbleChargeHeld = false;
            if (this.bubbleBtn) this.bubbleBtn.classList.remove('pressed');
            return;
        }

        // Auto-Fire for Mobile: if enabled in settings and not currently aiming manually with right stick
        if (this.isTouchDevice && this.autoFireEnabled && !this.isShooting && this.game.player) {
            this.updateAutoFire();
        }

        this.updateCooldowns();
    }

    updateAutoFire() {
        if (this.game && typeof this.game.isCutsceneActive === 'function' && this.game.isCutsceneActive()) {
            if (this.game.input) this.game.input.mouse.leftDown = false;
            return;
        }
        const player = this.game.player;
        let nearestEnemy = null;
        let shortestDistSq = this.autoAimMaxDistance * this.autoAimMaxDistance;

        if (this.game.enemies && this.game.enemies.length > 0) {
            for (let i = 0; i < this.game.enemies.length; i++) {
                const enemy = this.game.enemies[i];
                if (!enemy || enemy.dead || enemy.hp <= 0) continue;

                const dx = enemy.x - player.x;
                const dy = enemy.y - player.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < shortestDistSq) {
                    shortestDistSq = distSq;
                    nearestEnemy = enemy;
                }
            }
        }

        if (nearestEnemy) {
            const angle = Math.atan2(nearestEnemy.y - player.y, nearestEnemy.x - player.x);
            player.angle = angle;
            this.aimAngle = angle;
            if (this.game && this.game.input && this.game.input.mouse) {
                this.game.input.mouse.leftDown = !(player.isChargingBubble || this.isBubbleChargeHeld);
            }
        } else {
            if (this.game && this.game.input && this.game.input.mouse && !this.isShooting) {
                this.game.input.mouse.leftDown = false;
            }
        }
    }

    updateCooldowns() {
        const player = this.game.player;
        if (!player) return;
        const c = this._uiCache || (this._uiCache = Object.create(null));

        // Dash Cooldown & Circular Ring (dirty-checked + quantized to avoid 60fps iOS SVG repaints)
        if (this.dashBtn) {
            const onCd = player.dashCooldown > 0;
            const dashOff = onCd ? Math.round(226.2 * Math.max(0, Math.min(1, player.dashCooldown / (player.maxDashCooldown || 1)))) : 0;
            if (this.dashRing && c.dashOff !== dashOff) {
                c.dashOff = dashOff;
                this.dashRing.style.strokeDashoffset = String(dashOff);
            }
            if (c.dashOnCd !== onCd) {
                c.dashOnCd = onCd;
                this.dashBtn.classList.toggle('on-cooldown', onCd);
                this.dashBtn.classList.toggle('is-ready', !onCd);
            }
        }

        // Skill Cooldown & Circular Ring
        if (this.skillBtn) {
            let state = 0; // 0=ready, 1=cd, 2=active
            let skillOff = 0;
            if (player.frappesFrenzyTimer > 0) {
                state = 2;
                const r = Math.max(0, Math.min(1, player.frappesFrenzyTimer / (player.frappesFrenzyMaxTimer || 300)));
                skillOff = Math.round(226.2 * (1 - r));
            } else if (player.skillCooldown > 0) {
                state = 1;
                skillOff = Math.round(226.2 * Math.max(0, Math.min(1, player.skillCooldown / (player.maxSkillCooldown || 1))));
            }
            if (this.skillRing && c.skillOff !== skillOff) {
                c.skillOff = skillOff;
                this.skillRing.style.strokeDashoffset = String(skillOff);
            }
            if (c.skillState !== state) {
                c.skillState = state;
                this.skillBtn.classList.toggle('is-active', state === 2);
                this.skillBtn.classList.toggle('on-cooldown', state === 1);
                this.skillBtn.classList.toggle('is-ready', state === 0);
            }

            const baseSkill = player.selectedSkill || player.equippedSkill || c.fallbackSkill || (c.fallbackSkill = localStorage.getItem('lesaio_selected_skill') || 'blade_rush');
            const isMasteredFrappes = baseSkill === 'frappes' && (player.hasPagakiaMastery || (typeof PlayerSkills !== 'undefined' && PlayerSkills.getSkillLevel('frappes') >= 5));
            const skillKey = isMasteredFrappes ? 'frappes_plus' : baseSkill;
            if (this.currentSkillKey !== skillKey) {
                this.currentSkillKey = skillKey;
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
                if (this._skillImgEl) this._skillImgEl.src = mcfg.img;
                if (this._skillLabelEl) this._skillLabelEl.textContent = mcfg.label;
                this.skillBtn.classList.toggle('skill-water', mcfg.isWater);
            }
        }

        // Big Bubble Button Visibility & Charge Ring (Bubble Gun Exclusive)
        if (this.bubbleBtn) {
            const showBubble = player.weaponType === 'bubble';
            if (c.showBubble !== showBubble) {
                c.showBubble = showBubble;
                this.bubbleBtn.classList.toggle('hidden', !showBubble);
            }
            if (showBubble) {
                const charge = player.bubbleCharge || 0;
                const bOff = Math.round(226.2 * (1 - charge));
                if (this.bubbleRing && c.bubbleOff !== bOff) {
                    c.bubbleOff = bOff;
                    this.bubbleRing.style.strokeDashoffset = String(bOff);
                }
                const bReady = charge >= 1.0;
                if (c.bubbleReady !== bReady) {
                    c.bubbleReady = bReady;
                    this.bubbleBtn.classList.toggle('is-ready', bReady);
                }
            }
        }
    }

    getMovementVector() {
        return this.movement;
    }

    lockLandscape() {
        try {
            if (screen.orientation && typeof screen.orientation.lock === 'function') {
                screen.orientation.lock('landscape').catch(() => {});
            } else if (screen.lockOrientation) {
                screen.lockOrientation('landscape');
            } else if (screen.webkitLockOrientation) {
                screen.webkitLockOrientation('landscape');
            } else if (screen.mozLockOrientation) {
                screen.mozLockOrientation('landscape');
            } else if (screen.msLockOrientation) {
                screen.msLockOrientation('landscape');
            }
        } catch {}
    }

    requestFullscreen() {
        try {
            const el = document.documentElement;
            const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.webkitRequestFullScreen || el.mozRequestFullScreen || el.msRequestFullscreen;
            if (rfs) {
                const res = rfs.call(el);
                if (res && typeof res.then === 'function') {
                    res.then(() => this.lockLandscape()).catch(() => {});
                }
            }
            this.lockLandscape();
            window.scrollTo(0, 1);
        } catch {}
    }

    toggleFullscreen() {
        const fsDoc = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
        if (!fsDoc) {
            this.requestFullscreen();
        } else {
            const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
            if (exit) exit.call(document).catch(() => {});
        }
    }

    show() {
        // STRICT: Never show on desktop PC!
        if (!this.isTouchDevice) {
            this.hide();
            return;
        }
        if (this.container) this.container.classList.remove('hidden');
    }

    hide() {
        if (this.container) this.container.classList.add('hidden');
        if (this.joystickBase) this.joystickBase.classList.remove('active');
        if (this.bubbleBtn) this.bubbleBtn.classList.remove('pressed');
        this.isBubbleChargeHeld = false;
        this.joystickPointerId = null;
        this.movement = { dx: 0, dy: 0 };
        this.isMoving = false;
    }
}

window.TouchInput = TouchInput;
