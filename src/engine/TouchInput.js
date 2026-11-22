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
        this.lockedTarget = null;
        this.autoFireEnabled = localStorage.getItem('lesaio_autofire') === 'true';
        this.autoAimMaxDistance = (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile) ? MobilePerf.getAutoAimRange() : 750;

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

    _mapClientPoint(e) {
        return { x: e.clientX, y: e.clientY };
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
        this.ultBtn = document.getElementById('mobile-ult-btn');
        this.warpBtn = document.getElementById('mobile-warp-btn');
        this.bubbleBtn = document.getElementById('mobile-bubble-charge-btn');
        this.dashRing = this.dashBtn ? this.dashBtn.querySelector('.dash-ring') : null;
        this.skillRing = this.skillBtn ? this.skillBtn.querySelector('.skill-ring') : null;
        this.ultRing = this.ultBtn ? this.ultBtn.querySelector('.ult-ring') : null;
        this.warpRing = this.warpBtn ? this.warpBtn.querySelector('.warp-ring') : null;
        this.bubbleRing = this.bubbleBtn ? this.bubbleBtn.querySelector('.bubble-charge-ring') : null;
        this._skillImgEl = this.skillBtn ? (this.skillBtn.querySelector('.btn-skill-img-icon') || this.skillBtn.querySelector('#mobile-skill-img')) : null;
        this._skillLabelEl = this.skillBtn ? this.skillBtn.querySelector('.btn-label') : null;
        this._ultImgEl = this.ultBtn ? (this.ultBtn.querySelector('.btn-ult-img-icon') || this.ultBtn.querySelector('#mobile-ult-img')) : null;
        this._ultLabelEl = this.ultBtn ? this.ultBtn.querySelector('.btn-label') : null;
        this._warpLabelEl = this.warpBtn ? this.warpBtn.querySelector('.btn-label') : null;
        this._uiCache = Object.create(null);

        this.updateAutoFireState();
        this.applyPreferences();

        // STRICT: If on PC/desktop, permanently disable and hide the container
        if (!this.isTouchDevice) {
            this.hide();
            this.container.style.display = 'none';
        }
    }

    vibrate(ms = 18) {
        if (typeof MobilePerf !== 'undefined' && !MobilePerf.isHapticsEnabled()) return;
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try { navigator.vibrate(ms); } catch (_) {}
        }
    }

    applyPreferences() {
        if (!this.isTouchDevice) return;
        this.autoAimMaxDistance = (typeof MobilePerf !== 'undefined') ? MobilePerf.getAutoAimRange() : 750;
        const opacity = (typeof MobilePerf !== 'undefined') ? MobilePerf.getTouchOpacity() : 1.0;
        if (this.container) {
            this.container.style.setProperty('--mobile-controls-opacity', String(opacity));
        }
    }

    updateAutoFireState() {
        if (this.container) {
            this.container.classList.toggle('autofire-active', !!this.autoFireEnabled);
        }
        if (!this.autoFireEnabled && !this.isShooting) {
            this.lockedTarget = null;
            if (this.game && this.game.input && this.game.input.mouse) {
                this.game.input.mouse.leftDown = false;
            }
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

        // Auto-pause and clear stuck touch state if phone is minimized / loses focus
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.resetActiveTouches();
                const autoPause = (typeof MobilePerf === 'undefined') || MobilePerf.shouldAutoPauseOnBlur();
                if (this.game && this.game.state === 'PLAYING' && autoPause && typeof this.game.pauseGame === 'function') this.game.pauseGame();
            }
        });
        window.addEventListener('blur', () => this.resetActiveTouches());

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

            const pt = this._mapClientPoint(e);
            this.joystickOrigin = { x: pt.x, y: pt.y };
            this.joystickCurrent = { x: pt.x, y: pt.y };

            // Position visual joystick base
            if (this.joystickBase) {
                this.joystickBase.style.left = `${pt.x}px`;
                this.joystickBase.style.top = `${pt.y}px`;
                this.joystickBase.classList.add('active');
            }
            if (this.joystickKnob) {
                this.joystickKnob.style.transform = `translate(0px, 0px)`;
            }

            this.updateJoystick(pt.x, pt.y);
        });

        this.joystickZone.addEventListener('pointermove', (e) => {
            if (e.pointerId !== this.joystickPointerId) return;
            const pt = this._mapClientPoint(e);
            this.updateJoystick(pt.x, pt.y);
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
                const pt = this._mapClientPoint(e);
                this.aimOrigin = { x: pt.x, y: pt.y };

                if (this.aimBase) {
                    this.aimBase.style.left = `${pt.x}px`;
                    this.aimBase.style.top = `${pt.y}px`;
                    this.aimBase.classList.add('active');
                }
                if (this.aimKnob) {
                    this.aimKnob.style.transform = `translate(0px, 0px)`;
                }

                this.updateAim(pt.x, pt.y);
            });

            this.aimZone.addEventListener('pointermove', (e) => {
                if (e.pointerId !== this.aimPointerId) return;
                const pt = this._mapClientPoint(e);
                this.updateAim(pt.x, pt.y);
            });

            const releaseAim = (e) => {
                if (e.pointerId !== this.aimPointerId) return;
                this.aimPointerId = null;
                this.isShooting = false;
                if (!this.autoFireEnabled) this.lockedTarget = null;

                if (this.aimBase) {
                    this.aimBase.classList.remove('active');
                }
                if (this.aimKnob) {
                    this.aimKnob.style.transform = `translate(0px, 0px)`;
                }

                // Stop firing weapon
                if (this.game && this.game.input && !this.autoFireEnabled) {
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
                this.vibrate(18);
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
                this.vibrate(25);
                this.skillBtn.classList.add('pressed');
                if (this.game && this.game.input && this.game.input.onSkillCallback) {
                    this.game.input.onSkillCallback();
                }
            });
            const releaseSkill = () => this.skillBtn.classList.remove('pressed');
            this.skillBtn.addEventListener('pointerup', releaseSkill);
            this.skillBtn.addEventListener('pointercancel', releaseSkill);
        }

        // 4.5. Ultimate Button (Q)
        if (this.ultBtn) {
            this.ultBtn.addEventListener('pointerdown', (e) => {
                if (e.pointerType && e.pointerType !== 'touch') return;
                e.stopPropagation();
                this.vibrate(35);
                this.ultBtn.classList.add('pressed');
                if (this.game && this.game.input && this.game.input.onUltCallback) {
                    this.game.input.onUltCallback();
                }
            });
            const releaseUlt = () => this.ultBtn.classList.remove('pressed');
            this.ultBtn.addEventListener('pointerup', releaseUlt);
            this.ultBtn.addEventListener('pointercancel', releaseUlt);
        }

        // 4.6. Endless Wave Skipper Button (Mobile)
        if (this.warpBtn) {
            this.warpBtn.addEventListener('pointerdown', (e) => {
                if (e.pointerType === 'mouse' && !this.isTouchDevice) return;
                e.stopPropagation();
                this.vibrate(25);
                this.warpBtn.classList.add('pressed');
                if (this.game && this.game.input && this.game.input.onInteractCallback) {
                    this.game.input.onInteractCallback();
                }
            });
            const releaseWarp = () => this.warpBtn.classList.remove('pressed');
            this.warpBtn.addEventListener('pointerup', releaseWarp);
            this.warpBtn.addEventListener('pointercancel', releaseWarp);
        }

        // 5. Big Bubble Charge Button (Mobile)
        if (this.bubbleBtn) {
            this.bubbleBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                if (e.pointerId && this.bubbleBtn.setPointerCapture) {
                    try { this.bubbleBtn.setPointerCapture(e.pointerId); } catch (_) {}
                }
                this.vibrate(15);
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

        const player = this.game ? this.game.player : null;
        let angle = player ? player.angle : 0;
        if (distance >= 8) {
            angle = Math.atan2(deltaY, deltaX);
            knobX = Math.cos(angle) * clampedDist;
            knobY = Math.sin(angle) * clampedDist;
            this.lockedTarget = null;
        } else if (player && typeof MobileAimAssist !== 'undefined') {
            const target = MobileAimAssist.findTarget(this.game, player, this.autoAimMaxDistance);
            this.lockedTarget = target;
            if (target) angle = Math.atan2(target.y - player.y, target.x - player.x);
        }

        if (this.aimKnob) {
            this.aimKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;
        }

        this.aimAngle = angle;
        this.isShooting = true;

        if (player) player.angle = angle;
        if (this.game && this.game.input && this.game.input.mouse) {
            this.game.input.mouse.leftDown = !(player && (player.isChargingBubble || this.isBubbleChargeHeld));
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
            this.lockedTarget = null;
            return;
        }
        const player = this.game.player;
        const bestTarget = (typeof MobileAimAssist !== 'undefined')
            ? MobileAimAssist.findTarget(this.game, player, this.autoAimMaxDistance)
            : null;
        this.lockedTarget = bestTarget;

        if (bestTarget) {
            const angle = Math.atan2(bestTarget.y - player.y, bestTarget.x - player.x);
            player.angle = angle;
            this.aimAngle = angle;
            if (this.game && this.game.input && this.game.input.mouse) {
                this.game.input.mouse.leftDown = !(player.isChargingBubble || this.isBubbleChargeHeld);
            }
        } else if (this.game && this.game.input && this.game.input.mouse && !this.isShooting) {
            this.game.input.mouse.leftDown = false;
        }
    }

    updateCooldowns() {
        if (typeof MobileAimAssist !== 'undefined') MobileAimAssist.updateTouchCooldowns(this);
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

    resetActiveTouches() {
        if (this.joystickBase) this.joystickBase.classList.remove('active');
        if (this.aimBase) this.aimBase.classList.remove('active');
        if (this.joystickKnob) this.joystickKnob.style.transform = 'translate(0px, 0px)';
        if (this.aimKnob) this.aimKnob.style.transform = 'translate(0px, 0px)';
        if (this.bubbleBtn) this.bubbleBtn.classList.remove('pressed');
        if (this.dashBtn) this.dashBtn.classList.remove('pressed');
        if (this.skillBtn) this.skillBtn.classList.remove('pressed');
        if (this.ultBtn) this.ultBtn.classList.remove('pressed');
        if (this.warpBtn) this.warpBtn.classList.remove('pressed');
        this.joystickPointerId = null;
        this.aimPointerId = null;
        this.isBubbleChargeHeld = false;
        this.isMoving = false;
        this.isShooting = false;
        this.lockedTarget = null;
        this.movement = { dx: 0, dy: 0 };
        if (this.game && this.game.input && this.game.input.mouse) {
            this.game.input.mouse.leftDown = false;
        }
    }

    hide() {
        if (this.container) this.container.classList.add('hidden');
        this.resetActiveTouches();
    }
}

window.TouchInput = TouchInput;
