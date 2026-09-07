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
        this.weaponIcon = document.getElementById('weapon-icon');
        this.weaponName = document.getElementById('weapon-name');
        this.hudAvatarImg = document.getElementById('hud-avatar-img');

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

        // Mini-map Canvas
        this.minimapCanvas = document.getElementById('minimap-canvas');
        if (this.minimapCanvas) {
            this.minimapCtx = this.minimapCanvas.getContext('2d');
        }
    }

    show() {
        if (this.hud) this.hud.classList.remove('hidden');
        if (window.uiController && window.uiController.skillManager) {
            window.uiController.skillManager.updateHUDIcon();
        }
    }

    hide() {
        if (this.hud) this.hud.classList.add('hidden');
    }

    update(player, wave, remainingEnemies = 0, totalEnemies = 0) {
        if (!player) return;

        const hpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
        if (this.hpFill) this.hpFill.style.width = `${hpPct}%`;
        if (this.hpText) this.hpText.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;

        const xpPct = Math.min(100, (player.xp / player.xpNeeded) * 100);
        if (this.xpFill) this.xpFill.style.width = `${xpPct}%`;
        if (this.levelText) this.levelText.textContent = `LVL ${player.level}`;

        if (this.scoreText) this.scoreText.textContent = player.score.toLocaleString();
        if (this.waveText) {
            const isEndless = (window.gameInstance && window.gameInstance.gameMode === 'endless');
            this.waveText.textContent = isEndless ? `⚡ ENDLESS ${wave}` : `WAVE ${wave}`;
        }

        if (this.waveEnemyCountText) {
            if (window.gameInstance && window.gameInstance.waveState === 'WAVE_CLEARED') {
                this.waveEnemyCountText.textContent = 'CLEARED! Next wave incoming...';
                this.waveEnemyCountText.style.color = '#2ed573';
            } else {
                this.waveEnemyCountText.textContent = `Enemies: ${remainingEnemies} / ${totalEnemies}`;
                this.waveEnemyCountText.style.color = '#ff4757';
            }
        }

        if (this.dashFill && this.dashBadge) {
            if (player.dashCooldown > 0) {
                const dashPct = 100 - (player.dashCooldown / player.maxDashCooldown) * 100;
                this.dashFill.style.width = `${dashPct}%`;
                this.dashBadge.classList.add('on-cooldown');
            } else {
                this.dashFill.style.width = '100%';
                this.dashBadge.classList.remove('on-cooldown');
            }
        }

        if (this.skillFill && this.skillBadge) {
            if (player.frappesFrenzyTimer > 0) {
                // Active Frenzy Duration: bar depletes with duration and increases with kills
                const maxFrenzy = player.frappesFrenzyMaxTimer || 300;
                const durationPct = Math.max(0, Math.min(100, (player.frappesFrenzyTimer / maxFrenzy) * 100));
                this.skillFill.style.width = `${durationPct}%`;
                this.skillBadge.classList.add('is-active');
                this.skillBadge.classList.remove('on-cooldown');
            } else if (player.skillCooldown > 0) {
                // The moment effect ends, cooldown drops and the skill bar fills up
                this.skillBadge.classList.remove('is-active');
                const skillPct = 100 - (player.skillCooldown / player.maxSkillCooldown) * 100;
                this.skillFill.style.width = `${Math.max(0, Math.min(100, skillPct))}%`;
                this.skillBadge.classList.add('on-cooldown');
            } else {
                this.skillBadge.classList.remove('is-active');
                this.skillFill.style.width = '100%';
                this.skillBadge.classList.remove('on-cooldown');
            }

            const skillSpan = this.skillBadge.querySelector('span');
            const baseSkill = player.selectedSkill || player.equippedSkill || localStorage.getItem('lesaio_selected_skill') || 'blade_rush';
            const isMasteredFrappes = baseSkill === 'frappes' &&
                (player.hasPagakiaMastery || (typeof PlayerSkills !== 'undefined' && PlayerSkills.getSkillLevel('frappes') >= 5));
            const skillKey = isMasteredFrappes ? 'frappes_plus' : baseSkill;

            if (skillSpan && this.currentSkillKey !== skillKey) {
                this.currentSkillKey = skillKey;
                const skillConfigs = {
                    'nerobalonaki': { img: 'assets/SkillsIcons/NerobalonakiSkill.png', name: 'NEROBALONAKI' },
                    'blade_rush': { img: 'assets/SkillsIcons/BladeRushSkill.png', name: 'BLADE RUSH' },
                    'seismic_quake': { img: 'assets/SkillsIcons/SeismicQuakeSkill.png', name: 'SEISMIC QUAKE' },
                    'yaya_scream': { img: 'assets/SkillsIcons/YayaScreamSkill.png', name: 'YAYA SCREAM' },
                    'frappes': { img: 'assets/SkillsIcons/FrappesSkill.png', name: 'FRAPPES' },
                    'frappes_plus': { img: 'assets/SkillsIcons/FrappesSkill.png', name: 'FRAPPES+' }
                };
                const cfg = skillConfigs[skillKey] || skillConfigs['blade_rush'];
                skillSpan.innerHTML = `<img src="${cfg.img}" class="dash-badge-img" alt="${cfg.name}"> ${cfg.name} (E)`;
                this.skillBadge.title = `Press E to use ${cfg.name}`;
            }
        }

        const weaponNames = {
            'pea': 'Pea Slingshot',
            'watermelon': 'Melon Cannon',
            'bubble': 'Bubble Gun',
            'pepper': 'Chili Blaster'
        };
        const weaponIcons = {
            'pea': '🌱',
            'watermelon': '🍉',
            'bubble': '🫧',
            'pepper': '🌶️'
        };
        if (this.weaponIcon) this.weaponIcon.textContent = weaponIcons[player.weaponType] || '🌱';
        if (this.weaponName) this.weaponName.textContent = weaponNames[player.weaponType] || 'Pea Slingshot';

        this.minimapFrameCount = (this.minimapFrameCount || 0) + 1;
        if (this.minimapFrameCount % 2 === 0 && window.gameInstance) {
            this.drawMinimap(player, window.gameInstance.enemies, window.gameInstance.arena);
        }
    }

    addKillfeed(message) {
        // Disabled for offline cartoon arena focus
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
            const mx = (e.x + arena.halfWidth) * scaleX;
            const my = (e.y + arena.halfHeight) * scaleY;
            if (e.type === 'fatmir') {
                ctx.fillStyle = '#eb4d4b'; // Red for heavy Skatmir
            } else if (e.type === 'skarmogyftos') {
                ctx.fillStyle = '#9b59b6'; // Purple for sneaky Skarmogyftos
            } else {
                ctx.fillStyle = '#00b894'; // Green for agile Casillas
            }
            ctx.beginPath();
            ctx.arc(mx, my, e.type === 'fatmir' ? 3.5 : 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        const px = (player.x + arena.halfWidth) * scaleX;
        const py = (player.y + arena.halfHeight) * scaleY;
        ctx.fillStyle = '#0984e3';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}
