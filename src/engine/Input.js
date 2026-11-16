/**
 * Lesa.io - Input Manager
 * Handles WASD movement, mouse aiming, LMB shooting, Space/RMB dashing
 */

class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            worldX: 0,
            worldY: 0,
            leftDown: false,
            rightDown: false
        };

        this.onShootCallback = null;
        this.onDashCallback = null;
        this.onSkillCallback = null;
        this.onInteractCallback = null;
        this.onPauseCallback = null;

        this.init();
    }

    init() {
        // Keyboard Listeners
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.keys[e.key.toLowerCase()] = true;

            if (e.code === 'KeyP' || e.code === 'Escape') {
                if (this.onPauseCallback) this.onPauseCallback();
            }

            if (e.code === 'Space') {
                if (this.onDashCallback) this.onDashCallback();
            }

            if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') {
                if (this.onSkillCallback) this.onSkillCallback();
            }

            if ((e.code === 'KeyF' || e.key === 'f' || e.key === 'F') && !e.repeat) {
                if (this.onInteractCallback) this.onInteractCallback();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.keys[e.key.toLowerCase()] = false;
        });

        // Mouse Listeners (bound to window so aiming and shooting are never blocked)
        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        window.addEventListener('mousedown', (e) => {
            if (window.soundEngine && typeof window.soundEngine.init === 'function') {
                window.soundEngine.init();
            }

            // Do not fire game shooting if user clicks UI buttons or open modals
            if (e.target && e.target.closest && (e.target.closest('button') || e.target.closest('.modal-overlay') || e.target.closest('#menu-screen'))) {
                return;
            }

            if (e.button === 0) {
                this.mouse.leftDown = true;
                if (this.onShootCallback) this.onShootCallback();
            } else if (e.button === 2) {
                this.mouse.rightDown = true;
                const player = (window.gameInstance && window.gameInstance.player) || (window.GameState && window.GameState.player);
                if (player && player.weaponType === 'bubble') {
                    // Right-click is dedicated to charging the Bubble Gun
                } else {
                    if (this.onDashCallback) this.onDashCallback();
                }
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouse.leftDown = false;
            } else if (e.button === 2) {
                this.mouse.rightDown = false;
            }
        });

        // Prevent context menu on RMB globally for smooth gaming
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        }, true);
        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        }, true);

        // Blur reset
        window.addEventListener('blur', () => {
            this.keys = {};
            this.mouse.leftDown = false;
            this.mouse.rightDown = false;
        });
    }

    getMovementVector() {
        // 1. Mobile Virtual Joystick ONLY if on actual touch device and actively moving
        if (this.touchInput && this.touchInput.isTouchDevice && this.touchInput.isMoving) {
            return this.touchInput.getMovementVector();
        }

        // 2. Keyboard WASD / Arrow Keys (Desktop fallback)
        let dx = 0;
        let dy = 0;

        if (this.keys['KeyW'] || this.keys['w'] || this.keys['ArrowUp']) dy -= 1;
        if (this.keys['KeyS'] || this.keys['s'] || this.keys['ArrowDown']) dy += 1;
        if (this.keys['KeyA'] || this.keys['a'] || this.keys['ArrowLeft']) dx -= 1;
        if (this.keys['KeyD'] || this.keys['d'] || this.keys['ArrowRight']) dx += 1;

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            const invLen = 1 / Math.sqrt(dx * dx + dy * dy);
            dx *= invLen;
            dy *= invLen;
        }

        return { dx, dy };
    }

    updateWorldMouse(camera) {
        const worldPos = camera.screenToWorld(this.mouse.x, this.mouse.y);
        this.mouse.worldX = worldPos.x;
        this.mouse.worldY = worldPos.y;
    }
}
