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
        this.summaryBar = document.getElementById('skills-summary-bar');
        this.filterChips = document.querySelectorAll('#skills-filter-bar .tab-filter-chip');
        this.activeFilter = 'ALL';

        this.initEvents();
        this.renderSkillCards();
        this.updateHUDIcon();
    }

    _syncState() {
        if (typeof window !== 'undefined' && window.GameState && window.GameState.player) {
            const p = window.GameState.player;
            if (Array.isArray(p.unlockedSkills) && p.unlockedSkills.length > 0) {
                this.unlockedSkills = p.unlockedSkills;
            }
            if (p.selectedSkill) {
                this.selectedSkill = p.selectedSkill;
            }
            if (p.skillLevels && typeof p.skillLevels === 'object') {
                this.skillLevels = { ...this.skillLevels, ...p.skillLevels };
            }
        }
    }

    _notifyInsufficient(skillId, msg) {
        const cardEl = this.skillsGrid ? this.skillsGrid.querySelector(`[data-skill="${skillId}"]`) : null;
        if (typeof ModalManager !== 'undefined' && ModalManager.notifyInsufficient) {
            ModalManager.notifyInsufficient(msg, cardEl);
        } else {
            if (window.soundEngine) window.soundEngine.playGoBack();
            if (window.modalManager && window.modalManager.showQuickToast) {
                window.modalManager.showQuickToast(msg, 1900);
            }
        }
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

        if (this.filterChips && this.filterChips.length > 0) {
            this.filterChips.forEach((chip) => {
                chip.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.activeFilter = chip.getAttribute('data-filter') || 'ALL';
                    this.filterChips.forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    if (window.soundEngine) window.soundEngine.playSelect();
                    this.renderSkillCards();
                });
            });
        }

        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.on('skillLevelsChanged', (levels) => {
                this.skillLevels = { ...this.skillLevels, ...levels };
                this.renderSkillCards();
                this.updateHUDIcon();
            });
            const refreshCoins = () => this.renderSkillCards();
            window.EventBus.on('currencyUpdated', refreshCoins);
            window.EventBus.on('currencyChanged', refreshCoins);
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
        if (skill.bossUnlock) {
            this._notifyInsufficient(skillId, `⚡ Defeat Zeus on Mount Olympus Floor 5 to unlock ${skill.name}!`);
            return;
        }
        const cost = skill.unlockCost || 0;
        const currentCoins = window.GameState ? window.GameState.player.coins : 0;

        if (currentCoins < cost) {
            const needed = cost - currentCoins;
            this._notifyInsufficient(skillId, `⚠️ Need 🪙 ${needed.toLocaleString()} more Coins to unlock ${skill.name}!`);
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
        if (window.modalManager && window.modalManager.showQuickToast) {
            window.modalManager.showQuickToast(`🗡️ Unlocked ${skill.name}!`);
        }
    }

    static isSkillUnlocked(skillId) {
        if (!skillId) return false;
        const map = (typeof SKILLS !== 'undefined' && SKILLS) || (typeof window !== 'undefined' && window.SKILLS);
        if (map && map[skillId] && map[skillId].unlockedDefault) return true;
        const gsList = typeof window !== 'undefined' && window.GameState && window.GameState.player && window.GameState.player.unlockedSkills;
        if (Array.isArray(gsList)) return gsList.includes(skillId);
        try { return JSON.parse(localStorage.getItem('lesaio_unlocked_skills') || '[]').includes(skillId); } catch (e) { return false; }
    }

    /**
     * Permanently unlock a Boss-exclusive Active Skill (e.g., Wrath of Olympus on Zeus defeat).
     */
    static unlockBossSkill(skillId, ctxOptions = {}) {
        const skillsMap = (typeof SKILLS !== 'undefined' && SKILLS) || (typeof window !== 'undefined' && window.SKILLS) || null;
        const skillMeta = skillsMap && skillsMap[skillId] ? skillsMap[skillId] : null;
        if (!skillId || !skillMeta) return { unlockedNow: false, skill: null };

        let unlocked = ['blade_rush', 'nerobalonaki'];
        if (typeof window !== 'undefined' && window.GameState && window.GameState.player && Array.isArray(window.GameState.player.unlockedSkills)) {
            unlocked = window.GameState.player.unlockedSkills;
        } else if (typeof localStorage !== 'undefined') {
            try {
                const parsed = JSON.parse(localStorage.getItem('lesaio_unlocked_skills') || '["blade_rush","nerobalonaki"]');
                if (Array.isArray(parsed)) unlocked = parsed;
            } catch (err) {}
        }

        const alreadyOwned = unlocked.includes(skillId);
        if (!alreadyOwned) {
            unlocked.push(skillId);
        }
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('lesaio_unlocked_skills', JSON.stringify(unlocked));
            let levels = {};
            try { levels = JSON.parse(localStorage.getItem('lesaio_skill_levels') || '{}'); } catch (err) { levels = {}; }
            if (!levels[skillId]) {
                levels[skillId] = 1;
                localStorage.setItem('lesaio_skill_levels', JSON.stringify(levels));
            }
            if (typeof window !== 'undefined' && window.GameState && window.GameState.player) {
                window.GameState.player.unlockedSkills = unlocked;
                window.GameState.player.skillLevels = levels;
            }
        }

        if (!alreadyOwned && typeof window !== 'undefined') {
            if (window.cloudSave && window.cloudSave.currentUser && typeof window.cloudSave.saveToCloud === 'function') {
                window.cloudSave.saveToCloud({ unlockedSkills: unlocked });
            }
            const sm = window.uiController && window.uiController.skillManager;
            if (sm && typeof sm._syncState === 'function') {
                sm._syncState();
                sm.renderSkillCards();
                sm.updateHUDIcon();
            }
            if (!ctxOptions.silent && ctxOptions.effects) {
                const sx = Number.isFinite(ctxOptions.x) ? ctxOptions.x : 0;
                const sy = Number.isFinite(ctxOptions.y) ? ctxOptions.y : 0;
                ctxOptions.effects.addComicSplash(sx, sy - 96, `UNLOCKED: ${skillMeta.name.toUpperCase()}!`, '#fed330', 22, true);
            }
        }
        return { unlockedNow: !alreadyOwned, skill: skillMeta };
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
            if (gemCost > 0) {
                const mLabel = skill.masteryLabel || 'Pagakia Mastery';
                this._notifyInsufficient(skillId, `⚠️ Need 🪙 ${cost.toLocaleString()} Coins & 💎 ${gemCost} Diamonds for ${mLabel}!`);
            } else {
                const needed = Math.max(0, cost - currentCoins);
                this._notifyInsufficient(skillId, `⚠️ Need 🪙 ${needed.toLocaleString()} more Coins for ${skill.name} Lv.${currentLevel + 1}!`);
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
        this._syncState();

        this.skillsGrid.innerHTML = '';

        const skillsList = Object.values(SKILLS);
        const currentCoins = window.GameState && window.GameState.player ? (window.GameState.player.coins || 0) : 0;
        const currentGems = window.GameState && window.GameState.player ? (window.GameState.player.gems || 0) : 0;

        const discoverableSkills = skillsList.filter(s => this.unlockedSkills.includes(s.id) || s.unlockedDefault || !s.hideWhenLocked);
        let unlockedCount = 0;
        let visibleCount = 0;

        discoverableSkills.forEach((skill) => {
            const isUnlocked = this.unlockedSkills.includes(skill.id) || skill.unlockedDefault;
            if (isUnlocked) unlockedCount++;

            const isEquipped = this.selectedSkill === skill.id;
            const currentLevel = isUnlocked ? this.getSkillLevel(skill.id) : 1;
            const maxLevel = skill.maxLevel || 3;
            const isMaxLevel = currentLevel >= maxLevel;
            const isMastered = !!(skill.masteryBadgeText || skill.id === 'frappes' || skill.id === 'wrath_of_olympus') && isMaxLevel;

            const matchesFilter =
                this.activeFilter === 'ALL' ||
                (this.activeFilter === 'UNLOCKED' && isUnlocked) ||
                (this.activeFilter === 'LOCKED' && !isUnlocked) ||
                (this.activeFilter === 'UPGRADEABLE' && isUnlocked && !isMaxLevel);

            if (!matchesFilter) return;
            visibleCount++;

            const rarityData = (typeof RarityRegistry !== 'undefined') ? RarityRegistry.get(skill.rarity) : { color: '#f39c12', badgeClass: 'badge-legendary' };

            const card = document.createElement('div');
            card.className = `skill-card ${isEquipped ? 'equipped' : ''} ${!isUnlocked ? 'locked' : ''} ${skill.id} rarity-${(skill.rarity || 'common').toLowerCase()} ${isMastered ? 'mastered-card' : ''}`;
            card.setAttribute('data-skill', skill.id);

            // Level Badge (Top Left)
            let levelBadgeHtml = '';
            let pipsHtml = '';
            const starIc = typeof UiIcons !== 'undefined' ? UiIcons.i('star', 'ui-icon-sm') : '⭐';
            const iceIc = typeof UiIcons !== 'undefined' ? UiIcons.i('snowflake', 'ui-icon-sm') : '🧊';
            const lockIc = typeof UiIcons !== 'undefined' ? UiIcons.i('lock', 'ui-icon-sm') : '🔒';
            const coinIc = typeof UiIcons !== 'undefined' ? UiIcons.i('coin', 'ui-icon-sm') : '🪙';
            const gemIc = typeof UiIcons !== 'undefined' ? UiIcons.i('gem', 'ui-icon-sm') : '💎';
            const checkIc = typeof UiIcons !== 'undefined' ? UiIcons.i('check', 'ui-icon-sm') : '✅';
            if (isUnlocked && skill.levels) {
                if (isMastered) {
                    const mBadge = skill.masteryBadgeText || 'PAGAKIA';
                    const mBadgeIc = skill.masteryIcon || (skill.id === 'wrath_of_olympus' ? '⚡' : iceIc);
                    levelBadgeHtml = `<div class="skill-level-badge mastery-level-badge">${starIc} ${mBadge} ${mBadgeIc}</div>`;
                } else if (isMaxLevel) {
                    levelBadgeHtml = `<div class="skill-level-badge max-level">LVL ${currentLevel}/${maxLevel} ${starIc} MAX</div>`;
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

            // Lock Ribbon (Top Left when locked so top-right rarity stays clean)
            let lockBadgeHtml = '';
            if (!isUnlocked) {
                if (skill.bossUnlock) {
                    lockBadgeHtml = `<div class="skill-lock-badge">${lockIc} ${skill.unlockLabel || 'DEFEAT ZEUS'}</div>`;
                } else {
                    lockBadgeHtml = `<div class="skill-lock-badge">${lockIc} ${coinIc} ${skill.unlockCost ? skill.unlockCost.toLocaleString() : 0}</div>`;
                }
            }

            // Tag
            const tagMap = {
                nerobalonaki: 'skill-tag-water', chair_throw: 'skill-tag-chair', seismic_quake: 'skill-tag-quake',
                komboloi_vortex: 'skill-tag-komboloi', ouzo_flambe: 'skill-tag-ouzo',
                donkey_stampede: 'skill-tag-donkey', bouzouki_decoy: 'skill-tag-bouzouki',
                yaya_scream: 'skill-tag-yaya', frappes: 'skill-tag-frappes',
                chrono_hourglass: 'skill-tag-chrono', wrath_of_olympus: 'skill-tag-olympus'
            };
            const tagClass = !isUnlocked ? 'skill-tag-locked' : (tagMap[skill.id] || 'skill-tag-slash');

            const tagText = skill.badge || 'SKILL';

            // Title & Icon Display
            let displayName = skill.name;
            if (isMastered) {
                if (skill.masteryTitleHtml) {
                    displayName = skill.masteryTitleHtml;
                } else if (skill.id === 'wrath_of_olympus') {
                    displayName = `${skill.name} <span class="mastery-sub olympus-mastery">Olympian ⚡</span>`;
                } else {
                    displayName = `Frappes+ <span class="mastery-sub">Pagakia ${iceIc}</span>`;
                }
            }

            let iconHtml = '';
            if (skill.iconImg) {
                iconHtml = `<img src="${skill.iconImg}" class="skill-icon-img" alt="${skill.name}">`;
            } else {
                iconHtml = `<span class="skill-icon-fallback">${typeof UiIcons !== 'undefined' ? UiIcons.renderDefIcon(skill, '') : (skill.icon || '✨')}</span>`;
            }

            const displayDesc = isMastered
                ? (skill.masteryDesc || `${starIc} MASTERED FRAPPES+ WITH PAGAKIA: Permanent -3.0s CDR, Sub-Zero Ice Aura that slows enemies by 50%, and kills extend frenzy duration!`)
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
                actionsHtml += `<button class="comic-btn comic-btn-sm skill-btn comic-btn-primary" disabled>EQUIPPED ${checkIc}</button>`;
            } else if (isUnlocked) {
                actionsHtml += `<button class="comic-btn comic-btn-sm skill-btn equip-action-btn">EQUIP SKILL</button>`;
            } else if (skill.bossUnlock) {
                actionsHtml += `<button class="comic-btn comic-btn-sm skill-btn boss-unlock-btn">${lockIc} ${skill.unlockLabel || 'DEFEAT ZEUS'}</button>`;
            } else {
                const unlockPrice = skill.unlockCost || 0;
                const canAffordUnlock = currentCoins >= unlockPrice;
                actionsHtml += `<button class="comic-btn comic-btn-sm skill-btn unlock-action-btn ${canAffordUnlock ? 'is-can-afford-unlock' : 'is-insufficient'}">UNLOCK (${coinIc} ${unlockPrice.toLocaleString()})</button>`;
            }

            if (isUnlocked && skill.levels) {
                if (isMastered) {
                    const mDoneLbl = skill.masteryDoneLabel || (skill.id === 'wrath_of_olympus' ? `${starIc} OLYMPIAN MASTERED ⚡` : `${starIc} MASTERED: PAGAKIA ${iceIc}`);
                    actionsHtml += `<button class="comic-btn comic-btn-sm skill-upgrade-btn mastery-btn" disabled>${mDoneLbl}</button>`;
                } else if (isMaxLevel) {
                    actionsHtml += `<button class="comic-btn comic-btn-sm skill-upgrade-btn max-btn" disabled>MAX LEVEL ${maxLevel} ${starIc}</button>`;
                } else {
                    const nextCost = levelData ? levelData.upgradeCost : 500;
                    const nextGems = levelData ? (levelData.gemCost || 0) : 0;
                    const canAffordUpgrade = currentCoins >= nextCost && currentGems >= nextGems;
                    const affordCls = canAffordUpgrade ? '' : 'is-insufficient';
                    if (nextGems > 0) {
                        const mBtnLbl = skill.masteryButtonLabel || 'MASTER: PAGAKIA';
                        actionsHtml += `<button class="comic-btn comic-btn-sm skill-upgrade-btn mastery-unlock-btn upgrade-action-btn ${affordCls}">${starIc} ${mBtnLbl} (${coinIc} ${nextCost.toLocaleString()} + ${gemIc} ${nextGems})</button>`;
                    } else {
                        actionsHtml += `<button class="comic-btn comic-btn-sm skill-upgrade-btn upgrade-action-btn ${affordCls}">${starIc} UPGRADE (${coinIc} ${nextCost.toLocaleString()})</button>`;
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

            const bossUnlockBtn = card.querySelector('.boss-unlock-btn');
            if (bossUnlockBtn) {
                bossUnlockBtn.addEventListener('click', (e) => {
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

        if (visibleCount === 0) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'tab-empty-filter-state';
            const emptyText = this.activeFilter === 'LOCKED'
                ? '🎉 You have unlocked every active skill!'
                : '⭐ No skills need upgrading right now.';
            if (typeof UiIcons !== 'undefined') UiIcons.setRichText(emptyEl, emptyText, 'ui-icon-sm');
            else emptyEl.textContent = emptyText;
            this.skillsGrid.appendChild(emptyEl);
        }

        if (!this.summaryBar) this.summaryBar = document.getElementById('skills-summary-bar');
        if (this.summaryBar && typeof ModalManager !== 'undefined' && ModalManager.renderTabSummaryBar) {
            const eqSkill = SKILLS[this.selectedSkill];
            const eqMax = eqSkill && this.getSkillLevel(this.selectedSkill) >= (eqSkill.maxLevel || 3);
            const eqName = (this.selectedSkill === 'frappes' && eqMax) ? 'Frappes+' : ((eqSkill && eqSkill.name) || 'Skill');
            ModalManager.renderTabSummaryBar(this.summaryBar, [
                { icon: '🪙', label: 'COINS', val: currentCoins.toLocaleString(), cls: 'tab-pill-gold' },
                { icon: '💎', label: 'GEMS', val: currentGems.toLocaleString(), cls: 'tab-pill-gems' },
                { icon: '🔓', label: 'UNLOCKED', val: `${unlockedCount} / ${discoverableSkills.length}`, cls: 'tab-pill-green' },
                { icon: '🗡️', label: 'EQUIPPED', val: eqName.toUpperCase() }
            ]);
        }
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
        const lvlSuffix = isMastered ? '' : (isMax ? ' [MAX]' : ` [LVL ${currentLvl}]`);
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
