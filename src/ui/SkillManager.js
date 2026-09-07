/**
 * Lesa.io - Active Skills & Abilities UI Controller
 * Manages Skills Modal, skill equipping, dynamic multi-tier upgrades (3, 4, 5, 5+Mastery),
 * dual-currency Pagakia Mastery (Gold + Diamonds), and HUD synchronization.
 */

class SkillManager {
    constructor(uiController) {
        this.ui = uiController;
        this.gameState = typeof window !== 'undefined' ? window.GameState : null;

        // Default unlocked: Nerobalonaki (Common) and Blade Rush (Uncommon)
        this.unlockedSkills = JSON.parse(localStorage.getItem('lesaio_unlocked_skills') || '["nerobalonaki", "blade_rush"]');
        this.selectedSkill = localStorage.getItem('lesaio_selected_skill') || 'nerobalonaki';
        this.skillLevels = JSON.parse(localStorage.getItem('lesaio_skill_levels') || '{"nerobalonaki": 1, "blade_rush": 1}');

        this.skillsModal = document.getElementById('skills-modal');
        this.skillsGrid = document.getElementById('skills-modal-grid');

        this.initEvents();
        this.renderSkillCards();
        this.updateHUDIcon();
    }

    initEvents() {
        const skillsBtn = document.getElementById('menu-skills-btn');
        if (skillsBtn) {
            skillsBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playSelect();
                this.showSkillsModal();
            });
        }

        const closeSkillsBtn = document.getElementById('close-skills-btn');
        if (closeSkillsBtn) {
            closeSkillsBtn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playGoBack();
                this.hideSkillsModal();
            });
        }

        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.on('skillLevelsChanged', (levels) => {
                this.skillLevels = { ...this.skillLevels, ...levels };
                this.renderSkillCards();
                this.updateHUDIcon();
            });
            window.EventBus.on('currencyUpdated', () => {
                this.renderSkillCards();
            });
        }
    }

    showSkillsModal() {
        this.renderSkillCards();
        if (this.skillsModal) {
            this.skillsModal.classList.remove('hidden');
        }
    }

    hideSkillsModal() {
        if (this.skillsModal) {
            this.skillsModal.classList.add('hidden');
        }
    }

    getSkillLevel(skillId) {
        return this.skillLevels[skillId] || 1;
    }

    unlockSkill(skillId) {
        if (typeof SKILLS === 'undefined' || !SKILLS[skillId]) return;
        const skill = SKILLS[skillId];
        const cost = skill.unlockCost || 0;
        const currentCoins = window.GameState ? window.GameState.player.coins : 0;

        if (currentCoins < cost) {
            if (window.soundEngine) window.soundEngine.playGoBack();
            alert(`⚠️ Not enough Gold Coins! You need 🪙 ${cost.toLocaleString()} Coins to unlock ${skill.name}.`);
            return;
        }

        if (window.GameState) {
            window.GameState.spendCoins(cost);
        }

        if (!this.unlockedSkills.includes(skillId)) {
            this.unlockedSkills.push(skillId);
            localStorage.setItem('lesaio_unlocked_skills', JSON.stringify(this.unlockedSkills));
            if (this.gameState && this.gameState.player) {
                this.gameState.player.unlockedSkills = this.unlockedSkills;
            }
        }

        if (!this.skillLevels[skillId]) {
            this.skillLevels[skillId] = 1;
            localStorage.setItem('lesaio_skill_levels', JSON.stringify(this.skillLevels));
            if (this.gameState && this.gameState.player) {
                this.gameState.player.skillLevels = this.skillLevels;
            }
        }

        if (window.soundEngine) {
            window.soundEngine.playLevelUp();
        }

        this.selectSkill(skillId);
    }

    upgradeSkill(skillId) {
        if (typeof SKILLS === 'undefined' || !SKILLS[skillId]) return;
        const skill = SKILLS[skillId];
        const currentLevel = this.getSkillLevel(skillId);
        const maxLevel = skill.maxLevel || 3;

        if (currentLevel >= maxLevel) return; // MAX LEVEL reached

        const currentLevelData = skill.levels ? skill.levels[currentLevel] : null;
        if (!currentLevelData) return;

        const cost = currentLevelData.upgradeCost || 0;
        const gemCost = currentLevelData.gemCost || 0;
        const currentCoins = window.GameState ? window.GameState.player.coins : 0;
        const currentGems = window.GameState ? window.GameState.player.gems : 0;

        // Dual-currency verification
        if (currentCoins < cost || currentGems < gemCost) {
            if (window.soundEngine) window.soundEngine.playGoBack();
            if (gemCost > 0) {
                alert(`⚠️ Not enough currency! You need 🪙 ${cost.toLocaleString()} Coins and 💎 ${gemCost} Diamonds for the Pagakia Mastery.`);
            } else {
                alert(`⚠️ Not enough Gold Coins! You need 🪙 ${cost.toLocaleString()} Coins to upgrade to Level ${currentLevel + 1}.`);
            }
            return;
        }

        // Deduct currencies & level up
        if (window.GameState) {
            window.GameState.spendCoins(cost);
            if (gemCost > 0) {
                window.GameState.spendGems(gemCost);
            }
        }

        this.skillLevels[skillId] = currentLevel + 1;
        localStorage.setItem('lesaio_skill_levels', JSON.stringify(this.skillLevels));

        if (window.GameState && window.GameState.player) {
            window.GameState.player.skillLevels = this.skillLevels;
        }

        if (window.gameInstance && window.gameInstance.player && this.selectedSkill === skillId) {
            window.gameInstance.player.setSkill(skillId);
        }

        if (window.soundEngine) {
            window.soundEngine.playLevelUp();
        }

        this.renderSkillCards();
        this.updateHUDIcon();
    }

    renderSkillCards() {
        if (!this.skillsGrid || typeof SKILLS === 'undefined') return;

        this.skillsGrid.innerHTML = '';

        const skillsList = Object.values(SKILLS);

        skillsList.forEach((skill) => {
            const isUnlocked = this.unlockedSkills.includes(skill.id) || skill.unlockedDefault;
            const isEquipped = this.selectedSkill === skill.id;
            const currentLevel = isUnlocked ? this.getSkillLevel(skill.id) : 1;
            const maxLevel = skill.maxLevel || 3;
            const isMaxLevel = currentLevel >= maxLevel;
            const isMastered = (skill.id === 'frappes' && isMaxLevel);

            const rarityData = (typeof RarityRegistry !== 'undefined') ? RarityRegistry.get(skill.rarity) : { color: '#f39c12', badgeClass: 'badge-legendary' };

            const card = document.createElement('div');
            card.className = `skill-card ${isEquipped ? 'equipped' : ''} ${!isUnlocked ? 'locked' : ''} ${skill.id} rarity-${(skill.rarity || 'common').toLowerCase()} ${isMastered ? 'mastered-card' : ''}`;
            card.setAttribute('data-skill', skill.id);

            // Level Badge (Top Left)
            let levelBadgeHtml = '';
            let pipsHtml = '';
            if (isUnlocked && skill.levels) {
                if (isMastered) {
                    levelBadgeHtml = `<div class="skill-level-badge mastery-level-badge">⭐ PAGAKIA 🧊</div>`;
                } else if (isMaxLevel) {
                    levelBadgeHtml = `<div class="skill-level-badge max-level">LVL ${currentLevel}/${maxLevel} ⭐ MAX</div>`;
                } else {
                    levelBadgeHtml = `<div class="skill-level-badge">LVL ${currentLevel}/${maxLevel}</div>`;
                }

                // Dynamic Pips (3, 4, or 5 pips matching rarity tier)
                pipsHtml = '<div class="skill-level-pips">';
                for (let l = 1; l <= maxLevel; l++) {
                    let pipClass = '';
                    if (currentLevel >= l) {
                        if (isMastered && l === maxLevel) pipClass = 'mastery';
                        else if (isMaxLevel) pipClass = 'max';
                        else pipClass = 'filled';
                    }
                    pipsHtml += `<span class="skill-pip ${pipClass}" title="Level ${l}"></span>`;
                }
                pipsHtml += '</div>';
            }

            // Rarity Badge (Top Right)
            const rarityBadgeHtml = `<div class="skill-rarity-badge ${rarityData.badgeClass || ''}">${(skill.rarity || 'Common').toUpperCase()}</div>`;

            // Lock Ribbon if locked
            let lockBadgeHtml = '';
            if (!isUnlocked) {
                lockBadgeHtml = `<div class="skill-lock-badge">🔒 🪙 ${skill.unlockCost ? skill.unlockCost.toLocaleString() : 0}</div>`;
            }

            // Tag
            let tagClass = 'skill-tag-slash';
            if (skill.id === 'nerobalonaki') tagClass = 'skill-tag-water';
            else if (skill.id === 'seismic_quake') tagClass = 'skill-tag-quake';
            else if (skill.id === 'yaya_scream') tagClass = 'skill-tag-yaya';
            else if (skill.id === 'frappes') tagClass = 'skill-tag-frappes';
            else if (!isUnlocked) tagClass = 'skill-tag-locked';

            const tagText = skill.badge || 'SKILL';

            // Title & Icon Display
            let displayName = skill.name;
            if (isMastered) {
                displayName = `Frappes+ <span class="mastery-sub">Pagakia 🧊</span>`;
            }

            let iconHtml = '';
            if (skill.iconImg) {
                iconHtml = `<img src="${skill.iconImg}" class="skill-icon-img" alt="${skill.name}">`;
            } else {
                iconHtml = `<span class="skill-icon-fallback">${skill.icon || '✨'}</span>`;
            }

            const displayDesc = isMastered
                ? '⭐ MASTERED FRAPPES+ WITH PAGAKIA: Permanent -3.0s CDR, Sub-Zero Ice Aura that slows enemies by 50%, and kills extend frenzy duration!'
                : (skill.desc || 'Battle ability');

            // Dynamic Stats for current level
            let statsHtml = '<div class="skill-stats-grid">';
            const levelData = (isUnlocked && skill.levels && skill.levels[currentLevel]) ? skill.levels[currentLevel] : (skill.levels ? skill.levels[1] : null);
            const statsList = levelData ? levelData.stats : (skill.stats || []);

            if (statsList.length > 0) {
                statsList.forEach((st) => {
                    const isHighlight = st.label.includes('Slow') || st.label.includes('Amp') || st.label.includes('Special') || st.label.includes('Mastery') || st.label.includes('Bonus');
                    statsHtml += `
                        <div class="skill-stat-pill">
                            <span class="skill-stat-label">${st.label}</span>
                            <span class="skill-stat-value ${isHighlight ? 'skill-stat-highlight' : ''}">${st.value}</span>
                        </div>
                    `;
                });
            }
            statsHtml += '</div>';

            // Action Buttons: Equip / Unlock / Upgrade
            let actionsHtml = '<div class="skill-actions-group">';

            if (isEquipped) {
                actionsHtml += `<button class="comic-btn comic-btn-sm skill-btn comic-btn-primary" disabled>EQUIPPED ✅</button>`;
            } else if (isUnlocked) {
                actionsHtml += `<button class="comic-btn comic-btn-sm skill-btn equip-action-btn">EQUIP SKILL</button>`;
            } else {
                const unlockPrice = skill.unlockCost || 0;
                actionsHtml += `<button class="comic-btn comic-btn-sm skill-btn unlock-action-btn">UNLOCK (🪙 ${unlockPrice.toLocaleString()})</button>`;
            }

            if (isUnlocked && skill.levels) {
                if (isMastered) {
                    actionsHtml += `<button class="comic-btn comic-btn-sm skill-upgrade-btn mastery-btn" disabled>⭐ MASTERED: PAGAKIA 🧊</button>`;
                } else if (isMaxLevel) {
                    actionsHtml += `<button class="comic-btn comic-btn-sm skill-upgrade-btn max-btn" disabled>MAX LEVEL ${maxLevel} ⭐</button>`;
                } else {
                    const nextCost = levelData ? levelData.upgradeCost : 500;
                    const nextGems = levelData ? (levelData.gemCost || 0) : 0;
                    if (nextGems > 0) {
                        actionsHtml += `<button class="comic-btn comic-btn-sm skill-upgrade-btn mastery-unlock-btn upgrade-action-btn">⭐ MASTER: PAGAKIA (🪙 ${nextCost.toLocaleString()} + 💎 ${nextGems})</button>`;
                    } else {
                        actionsHtml += `<button class="comic-btn comic-btn-sm skill-upgrade-btn upgrade-action-btn">⭐ UPGRADE (🪙 ${nextCost.toLocaleString()})</button>`;
                    }
                }
            }

            actionsHtml += '</div>';

            card.innerHTML = `
                ${levelBadgeHtml}
                ${rarityBadgeHtml}
                ${lockBadgeHtml}
                <div class="skill-icon-circle">${iconHtml}</div>
                <div class="skill-tag ${tagClass}">${tagText}</div>
                <h3 class="skill-name">${displayName}</h3>
                ${pipsHtml}
                <div class="skill-desc">${displayDesc}</div>
                ${statsHtml}
                ${actionsHtml}
            `;

            // Event Listeners
            const equipBtn = card.querySelector('.equip-action-btn');
            if (equipBtn) {
                equipBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectSkill(skill.id);
                });
            }

            const unlockBtn = card.querySelector('.unlock-action-btn');
            if (unlockBtn) {
                unlockBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.unlockSkill(skill.id);
                });
            }

            const upgradeBtn = card.querySelector('.upgrade-action-btn');
            if (upgradeBtn) {
                upgradeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.upgradeSkill(skill.id);
                });
            }

            // Click entire card to equip if unlocked
            card.addEventListener('click', (e) => {
                if (e.target.closest('.skill-upgrade-btn') || e.target.closest('.unlock-action-btn')) return;
                if (isUnlocked && !isEquipped) {
                    this.selectSkill(skill.id);
                }
            });

            this.skillsGrid.appendChild(card);
        });
    }

    selectSkill(skillId) {
        this.selectedSkill = skillId;
        localStorage.setItem('lesaio_selected_skill', skillId);

        if (this.gameState && this.gameState.player) {
            this.gameState.player.selectedSkill = skillId;
        }

        if (window.gameInstance && window.gameInstance.player) {
            window.gameInstance.player.setSkill(skillId);
        }

        if (window.soundEngine) {
            window.soundEngine.playSelect();
        }

        this.renderSkillCards();
        this.updateHUDIcon();
    }

    updateHUDIcon() {
        const skillBadge = document.getElementById('skill-badge');
        if (!skillBadge) return;

        const skillId = this.selectedSkill;
        const skill = (typeof SKILLS !== 'undefined' && SKILLS[skillId]) ? SKILLS[skillId] : null;
        if (!skill) return;

        const currentLvl = this.getSkillLevel(skillId);
        const maxLvl = skill.maxLevel || 3;
        const isMax = currentLvl >= maxLvl;
        const isMastered = (skillId === 'frappes' && isMax);
        const lvlSuffix = isMastered ? '' : (isMax ? ' [MAX ⭐]' : ` [LVL ${currentLvl}]`);
        const displayName = isMastered ? 'FRAPPES+' : skill.name.toUpperCase();
        const iconSrc = skill.iconImg || 'assets/SkillsIcons/BladeRushSkill.png';

        skillBadge.title = isMastered ? 'Frappes+ (Press E to activate)' : `${skill.name}${lvlSuffix} (Press E to activate)`;
        const textSpan = skillBadge.querySelector('span');
        if (textSpan) {
            textSpan.innerHTML = `<img src="${iconSrc}" class="hud-skill-thumb" alt="${displayName}"> ${displayName}${lvlSuffix ? ' ' + lvlSuffix : ''} (E)`;
        }
    }
}

if (typeof window !== 'undefined') {
    window.SkillManager = SkillManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SkillManager };
}
