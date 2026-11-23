/**
 * Lesa.io - Gear & Armory UI Controller (Phase 1)
 * Coordinates sub-tab switching, equipment slot rendering, card generation, and equip/unlock actions.
 */

class GearModalUI {
    static currentTab = 'weapon';
    static initialized = false;

    static SLOT_DEFAULT_ICONS = {
        helmet: 'assets/GearUIIcons/HELMET.png',
        armor: 'assets/GearUIIcons/ARMOR.png',
        belt: 'assets/GearUIIcons/Belt.png',
        gloves: 'assets/GearUIIcons/Gloves.png',
        boots: 'assets/GearUIIcons/BOOTS.png'
    };

    static STAT_LABELS = {
        maxHp: { label: 'Max HP', unit: '', isPercent: false, icon: '❤️', iconKey: 'heart' },
        speed: { label: 'Move Speed', unit: '%', isPercent: true, icon: '👟', iconKey: 'boot' },
        damageReduction: { label: 'DEF / Dmg Red.', unit: '%', isPercent: true, icon: '🛡️', iconKey: 'shield' },
        critChance: { label: 'Crit Chance', unit: '%', isPercent: true, icon: '🎯', iconKey: 'target' },
        critDamage: { label: 'Crit Damage', unit: '%', isPercent: true, icon: '💥', iconKey: 'boom' },
        fireRate: { label: 'Fire Rate', unit: '%', isPercent: true, icon: '⚡', iconKey: 'bolt' },
        bulletDamage: { label: 'Bullet Damage', unit: '%', isPercent: true, icon: '⚔️', iconKey: 'sword' },
        bulletSpeed: { label: 'Bullet Velocity', unit: '%', isPercent: true, icon: '💨', iconKey: 'wind' },
        dashCooldown: { label: 'Dash Recovery', unit: '%', isPercent: true, icon: '🌀', iconKey: 'swirl' },
        magnetRadius: { label: 'Pickup Radius', unit: '', isPercent: false, icon: '🧲', iconKey: 'magnet' }
    };

    static init() {
        if (this.initialized) return;
        this.initialized = true;

        // Sub-tab buttons
        const tabBtns = document.querySelectorAll('.gear-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const tab = btn.getAttribute('data-tab');
                if (tab) {
                    if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
                        window.soundEngine.playSelect();
                    }
                    this.switchTab(tab);
                }
            });
        });

        // Click on Equipment Slots in the Top Hero Display
        const slots = ['helmet', 'armor', 'belt', 'gloves', 'boots'];
        slots.forEach(slot => {
            const el = document.getElementById(`gear-slot-${slot}`);
            if (el) {
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const equipped = (typeof GearManager !== 'undefined') ? GearManager.getEquipped(slot) : null;
                    if (equipped && this.currentTab === slot) {
                        // If already on this tab and clicking the slot, unequip
                        GearManager.unequip(slot);
                        if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
                            window.soundEngine.playSelect();
                        }
                    } else {
                        // Switch to this slot's tab
                        if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
                            window.soundEngine.playSelect();
                        }
                        this.switchTab(slot);
                    }
                });
            }
        });

        // Weapon Slot Card click
        const weaponSlot = document.getElementById('gear-slot-weapon');
        if (weaponSlot) {
            weaponSlot.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
                    window.soundEngine.playSelect();
                }
                this.switchTab('weapon');
            });
        }
    }

    static switchTab(tab) {
        this.currentTab = tab;

        // Update active tab buttons
        document.querySelectorAll('.gear-tab-btn').forEach(btn => {
            if (btn.getAttribute('data-tab') === tab) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        this.renderGrid();
        const scrollBody = document.querySelector('#weapons-modal .tab-scroll-body');
        if (scrollBody) scrollBody.scrollTop = 0;
    }

    static renderAll() {
        this.renderSlots();
        this.renderGrid();
    }

    static renderSlots() {
        const slots = ['helmet', 'armor', 'belt', 'gloves', 'boots'];
        slots.forEach(slot => {
            const el = document.getElementById(`gear-slot-${slot}`);
            if (!el) return;

            const equipped = (typeof GearManager !== 'undefined') ? GearManager.getEquipped(slot) : null;
            const nameEl = el.querySelector('.gear-slot-name');
            const centerContent = el.querySelector('.gear-slot-center-content');

            // Reset class list
            el.className = 'gear-slot-card';
            const oldBadge = el.querySelector('.gear-slot-lvl-badge');
            if (oldBadge) oldBadge.remove();

            if (equipped) {
                const hasUpgradeSys = typeof GearUpgradeManager !== 'undefined';
                const effRarity = hasUpgradeSys && typeof GearUpgradeManager.getEffectiveRarity === 'function' ? GearUpgradeManager.getEffectiveRarity(equipped) : (equipped.rarity || 'common');
                el.classList.add(`gear-slot-${effRarity}`);
                const maxLvl = hasUpgradeSys ? GearUpgradeManager.getMaxLevel(equipped) : 1;
                const lvl = hasUpgradeSys ? GearUpgradeManager.getLevel(equipped) : 1;
                const evolved = hasUpgradeSys ? GearUpgradeManager.isEvolved(equipped) : false;
                const ascended = hasUpgradeSys && typeof GearUpgradeManager.isAscended === 'function' ? GearUpgradeManager.isAscended(equipped) : false;
                if (evolved) el.classList.add('is-evolved-card');

                if (maxLvl > 1 || evolved || ascended) {
                    const lvlBadge = document.createElement('span');
                    lvlBadge.className = `gear-slot-lvl-badge ${evolved ? 'is-evolved' : (ascended ? 'is-ascended' : '')}`;
                    lvlBadge.textContent = evolved ? '★ EVO' : (ascended ? '✦ MYTHIC' : `LV ${lvl}`);
                    el.appendChild(lvlBadge);
                }

                if (nameEl) nameEl.textContent = equipped.name;

                if (centerContent) {
                    if (equipped.iconImg) {
                        centerContent.innerHTML = `<img src="${equipped.iconImg}" class="gear-slot-icon-img" alt="${equipped.name}">`;
                    } else {
                        centerContent.innerHTML = `<span class="gear-slot-emoji">${equipped.icon || '🛡️'}</span>`;
                    }
                }

                const effStats = (typeof GearManager !== 'undefined' && typeof GearManager.getEffectiveStats === 'function')
                    ? GearManager.getEffectiveStats(equipped)
                    : (equipped.stats || {});
                const statSummaries = [];
                for (const [k, v] of Object.entries(effStats)) {
                    const def = this.STAT_LABELS[k];
                    if (def) statSummaries.push(`+${v}${def.unit} ${def.label}`);
                }
                const lvlTag = evolved ? ' [★ EVOLVED AWAKENED]' : (maxLvl > 1 ? ` [LV ${lvl}/${maxLvl}]` : '');
                const passiveText = (evolved && equipped.passive && equipped.passive.id === 'stormborn_aegis')
                    ? '\n✨ Stormborn Aegis ★ (Awakened): 75 HP Thunder Barrier every 8s + 105 DMG lightning shockwave (0.8s stun) when hit.'
                    : (equipped.passive ? `\n✨ ${equipped.passive.name}: ${equipped.passive.desc}` : '');
                el.title = `${equipped.name} (${(equipped.rarity || 'common').toUpperCase()})${lvlTag}\n${statSummaries.join(' | ')}${passiveText}\nClick to unequip or switch tab`;
            } else {
                el.classList.add('gear-slot-empty');
                const defaultName = slot.charAt(0).toUpperCase() + slot.slice(1);
                if (nameEl) nameEl.textContent = `No ${defaultName}`;

                const defaultIcon = this.SLOT_DEFAULT_ICONS[slot] || 'assets/GearUIIcons/ARMOR.png';
                if (centerContent) {
                    centerContent.innerHTML = `<img src="${defaultIcon}" class="gear-slot-icon-img" alt="${slot}">`;
                }
                el.title = `${defaultName} Slot (Click to view ${slot}s)`;
            }
        });
    }

    static renderGrid() {
        const weaponsGrid = document.querySelector('#weapons-modal .weapons-grid');
        const gearGrid = document.getElementById('gear-inventory-grid');
        const sectionTitle = document.getElementById('gear-inv-section-title');
        const badgeCount = document.getElementById('gear-inv-badge-count');
        const coinsValEl = document.getElementById('gear-coins-val');
        const playerCoins = (typeof window !== 'undefined' && window.GameState && window.GameState.player) ? (window.GameState.player.coins || 0) : 0;
        if (coinsValEl) {
            coinsValEl.textContent = playerCoins.toLocaleString();
        }

        if (this.currentTab === 'weapon') {
            if (weaponsGrid) weaponsGrid.style.display = 'grid';
            if (gearGrid) {
                gearGrid.style.display = 'none';
                this._renderUpgradeToolbar(gearGrid, 'weapon');
            }
            if (sectionTitle) sectionTitle.textContent = 'GEAR INVENTORY (WEAPONS)';
            if (badgeCount && weaponsGrid) {
                const visibleCards = Array.from(weaponsGrid.querySelectorAll('.weapon-card')).filter(c => c.style.display !== 'none' && !c.classList.contains('weapon-locked'));
                badgeCount.textContent = `${visibleCards.length} WEAPON${visibleCards.length === 1 ? '' : 'S'} AVAILABLE`;
            }
            return;
        }

        // Equipment slot tab (helmet, armor, belt, gloves, boots)
        if (weaponsGrid) weaponsGrid.style.display = 'none';
        if (!gearGrid) return;
        const slot = this.currentTab;
        gearGrid.style.display = 'grid';
        this._renderUpgradeToolbar(gearGrid, slot);
        const slotTitle = slot.charAt(0).toUpperCase() + slot.slice(1);
        if (sectionTitle) sectionTitle.textContent = `GEAR INVENTORY (${slotTitle.toUpperCase()})`;

        const items = (typeof GEAR_ITEMS !== 'undefined' && GEAR_ITEMS[slot]) ? GEAR_ITEMS[slot] : [];
        const visibleItems = items.filter(item => !item.hideWhenLocked || (typeof GearManager !== 'undefined' && GearManager.isUnlocked(item.id)));
        const currentEquipped = (typeof GearManager !== 'undefined') ? GearManager.getEquipped(slot) : null;

        if (badgeCount) {
            const label = slotTitle.toLowerCase().endsWith('s') ? slotTitle.toUpperCase() : `${slotTitle.toUpperCase()}S`;
            badgeCount.textContent = `${visibleItems.length} ${label} AVAILABLE`;
        }

        gearGrid.innerHTML = '';

        visibleItems.forEach(item => {
            const isEquipped = currentEquipped && currentEquipped.id === item.id;
            const isUnlocked = (typeof GearManager !== 'undefined') ? GearManager.isUnlocked(item.id) : false;
            const baseRarity = item.rarity || 'common';
            const isBossOnly = !!(item.bossUnlock || baseRarity === 'mythic');
            const isChestOnly = !!(item.chestOnly || baseRarity === 'epic' || baseRarity === 'legendary');
            const isExclusive = baseRarity === 'exclusive';
            const canAfford = !isBossOnly && !isChestOnly && !isExclusive && playerCoins >= (item.cost || 0);
            const hasUpMgr = typeof GearUpgradeManager !== 'undefined';
            const rClass = hasUpMgr && typeof GearUpgradeManager.getEffectiveRarity === 'function' ? GearUpgradeManager.getEffectiveRarity(item) : baseRarity;
            const maxLevel = hasUpMgr ? GearUpgradeManager.getMaxLevel(item) : 1;
            const level = hasUpMgr ? GearUpgradeManager.getLevel(item) : 1;
            const isUpgradable = maxLevel > 1;
            const isAscended = hasUpMgr && typeof GearUpgradeManager.isAscended === 'function' ? GearUpgradeManager.isAscended(item) : false;
            const isEvolved = hasUpMgr ? GearUpgradeManager.isEvolved(item) : false;
            const canUpgradeNext = isUnlocked && isUpgradable && level < maxLevel;
            const canAscendNow = isUnlocked && hasUpMgr && typeof GearUpgradeManager.canAscendToMythic === 'function' && GearUpgradeManager.canAscendToMythic(item);
            const canEvolveNow = isUnlocked && hasUpMgr && GearUpgradeManager.canEvolve(item);
            const effStats = (typeof GearManager !== 'undefined' && typeof GearManager.getEffectiveStats === 'function')
                ? GearManager.getEffectiveStats(item) : (item.stats || {});
            const nextStats = canUpgradeNext ? GearUpgradeManager.getEffectiveStats(item, level + 1, false, isAscended)
                : (canAscendNow ? GearUpgradeManager.getEffectiveStats(item, maxLevel, false, true)
                : (canEvolveNow ? GearUpgradeManager.getEffectiveStats(item, maxLevel, true, isAscended) : null));

            const card = document.createElement('div');
            card.className = `gear-card rarity-${rClass} ${isEquipped ? 'is-equipped' : ''} ${!isUnlocked ? 'is-locked' : ''} ${isEvolved ? 'is-evolved-card' : ''}`;

            // Build Stats HTML
            let statsHtml = '';
            const statEntries = Object.entries(effStats);
            statEntries.forEach(([k, v], idx) => {
                const def = this.STAT_LABELS[k] || { label: k, unit: '', icon: '✨', iconKey: 'sparkle' };
                const statIc = def.iconKey && typeof UiIcons !== 'undefined' ? UiIcons.i(def.iconKey, 'ui-icon-sm') : def.icon;
                const isPrimary = idx === 0;
                const nextVal = nextStats && typeof nextStats[k] === 'number' ? nextStats[k] : v;
                const delta = nextVal - v;
                const deltaHtml = delta > 0 ? `<span class="gear-stat-delta">(+${delta}${def.unit})</span>` : '';
                statsHtml += `
                    <div class="gear-stat-badge-row ${isPrimary ? 'primary-stat' : 'secondary-stat'}">
                        <span class="gear-stat-badge-label">${statIc} ${def.label}</span>
                        <span class="gear-stat-badge-val">+${v}${def.unit}${deltaHtml}</span>
                    </div>
                `;
            });

            let passiveHtml = '';
            if (item.passive) {
                const isAwakenedStorm = isEvolved && item.passive.id === 'stormborn_aegis';
                const pName = isAwakenedStorm ? 'Stormborn Aegis ★ (Awakened)' : item.passive.name;
                const pDesc = isAwakenedStorm
                    ? 'Grants a 75 HP Thunder Barrier every 8s and unleashes a 105 DMG lightning shockwave (0.8s stun) when hit.'
                    : item.passive.desc;
                const pClass = `${rClass === 'legendary' ? 'is-legendary' : (rClass === 'mythic' ? 'is-mythic' : '')} ${isAwakenedStorm ? 'gear-evolved-passive-pill' : ''}`;
                passiveHtml = `<div class="gear-passive-pill ${pClass}" title="${pDesc}">${typeof UiIcons !== 'undefined' ? UiIcons.i('sparkle', 'ui-icon-sm') : '✨'} <strong>${pName}:</strong> ${pDesc}</div>`;
            }

            // Build Action Button & Upgrade/Evolve Controls
            let buttonHtml = '';
            if (isEquipped) {
                buttonHtml = `<button class="gear-btn gear-btn-equipped gear-btn-unequip-hover" data-action="unequip" data-item="${item.id}" title="Click to Unequip">✓ EQUIPPED</button>`;
            } else if (isUnlocked) {
                buttonHtml = `<button class="gear-btn gear-btn-equip" data-action="equip" data-item="${item.id}">EQUIP</button>`;
            } else if (isBossOnly) {
                const bossLbl = item.unlockLabel || 'DEFEAT ZEUS';
                buttonHtml = `<button class="gear-btn gear-btn-chest-only is-mythic" data-action="boss-hint" data-item="${item.id}">${typeof UiIcons !== 'undefined' ? UiIcons.i('lock', 'ui-icon-sm') : '🔒'} ${bossLbl}</button>`;
            } else if (isExclusive) {
                buttonHtml = `<button class="gear-btn gear-btn-chest-only" data-action="exclusive-hint" data-item="${item.id}">${typeof UiIcons !== 'undefined' ? UiIcons.i('lock', 'ui-icon-sm') : '🔒'} EVENT EXCLUSIVE</button>`;
            } else if (isChestOnly) {
                buttonHtml = `<button class="gear-btn gear-btn-chest-only ${rClass === 'legendary' ? 'is-legendary' : ''}" data-action="chest-hint" data-item="${item.id}">${typeof UiIcons !== 'undefined' ? UiIcons.i('crate', 'ui-icon-sm') : '📦'} CHESTS ONLY</button>`;
            } else {
                buttonHtml = `<button class="gear-btn gear-btn-unlock ${canAfford ? '' : 'disabled'}" data-action="unlock" data-item="${item.id}">${typeof UiIcons !== 'undefined' ? UiIcons.i('coin', 'ui-icon-sm') : '🪙'} ${item.cost ? item.cost.toLocaleString() : 0} UNLOCK</button>`;
            }

            const iconContent = item.iconImg
                ? `<img src="${item.iconImg}" class="gear-card-img" alt="${item.name}">`
                : `<span class="gear-card-emoji">${item.icon || '🛡️'}</span>`;

            const levelRowHtml = isUpgradable ? this._buildLevelHeaderHtml(level, maxLevel, isEvolved, isAscended) : '';
            const upgradeBoxHtml = (isUnlocked && isUpgradable) ? this._buildUpgradeBoxHtml(item, level, maxLevel, isEvolved, playerCoins, isAscended) : '';

            card.innerHTML = `
                <div class="gear-card-header">
                    <div class="gear-card-icon-wrap rarity-${rClass}">${iconContent}</div>
                    <div class="gear-card-meta">
                        <h4 class="gear-card-name">${item.name}</h4>
                        <span class="gear-card-subname">${item.desc || item.description || ''}</span>
                    </div>
                    <span class="gear-card-badge badge-${rClass}">${isAscended ? 'MYTHIC ✦' : rClass.toUpperCase()}</span>
                </div>
                ${levelRowHtml}
                <div class="gear-card-stats">
                    ${statsHtml}
                </div>
                ${passiveHtml}
                <div class="gear-card-action">
                    ${buttonHtml}
                </div>
                ${upgradeBoxHtml}
            `;

            // Click Handlers for Card and Action Buttons
            const btn = card.querySelector('.gear-btn[data-action]');
            const handleAction = (e) => {
                if (e.target && e.target.closest('[data-gear-upgrade], [data-gear-evolve], [data-gear-ascend]')) return;
                e.stopPropagation();
                if (isEquipped) {
                    GearManager.unequip(slot);
                    if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
                        window.soundEngine.playSelect();
                    }
                } else if (isUnlocked) {
                    GearManager.equip(item.id);
                    if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
                        window.soundEngine.playSelect();
                    }
                } else if (isBossOnly || isChestOnly || isExclusive) {
                    const msg = isBossOnly
                        ? `⚡ ${item.name} unlocks on your first victory over Zeus (Mount Olympus Floor 5)!`
                        : (isExclusive
                            ? `🔒 ${item.name} is a special event exclusive item!`
                            : `📦 ${item.name} unlocks only from chests (Rare+, Epic, Legendary & Boss Crates — 0% in Common/Uncommon)!`);
                    if (typeof ModalManager !== 'undefined' && ModalManager.notifyInsufficient) {
                        ModalManager.notifyInsufficient(msg, card);
                    }
                    if (window.soundEngine && typeof window.soundEngine.playBuzzer === 'function') {
                        window.soundEngine.playBuzzer();
                    }
                } else {
                    // Unlock
                    const res = GearManager.unlock(item.id);
                    if (res && res.success) {
                        if (window.soundEngine && typeof window.soundEngine.playCoinPickup === 'function') {
                            window.soundEngine.playCoinPickup();
                        } else if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
                            window.soundEngine.playSelect();
                        }
                        // Automatically equip newly unlocked gear for slick user experience
                        GearManager.equip(item.id);
                    } else {
                        const needed = Math.max(0, (item.cost || 0) - playerCoins);
                        const msg = `⚠️ Need 🪙 ${needed.toLocaleString()} more Coins to unlock ${item.name}!`;
                        if (typeof ModalManager !== 'undefined' && ModalManager.notifyInsufficient) {
                            ModalManager.notifyInsufficient(msg, card);
                        }
                        if (window.soundEngine && typeof window.soundEngine.playBuzzer === 'function') {
                            window.soundEngine.playBuzzer();
                        }
                    }
                }
            };

            if (btn) btn.addEventListener('click', handleAction);
            card.addEventListener('click', handleAction);

            const upgradeBtn = card.querySelector('[data-gear-upgrade]');
            if (upgradeBtn) {
                upgradeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (typeof GearUpgradeManager === 'undefined') return;
                    const res = GearUpgradeManager.upgradeGear(item.id);
                    if (!res.success) {
                        if (typeof ModalManager !== 'undefined' && ModalManager.notifyInsufficient && res.reason) {
                            ModalManager.notifyInsufficient(`⚠️ ${res.reason}`, card);
                        }
                        if (window.soundEngine && typeof window.soundEngine.playBuzzer === 'function') {
                            window.soundEngine.playBuzzer();
                        }
                    }
                });
            }

            const evolveBtn = card.querySelector('[data-gear-evolve]');
            if (evolveBtn) {
                evolveBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (typeof GearUpgradeManager === 'undefined') return;
                    const res = GearUpgradeManager.evolveGear(item.id);
                    if (!res.success) {
                        if (typeof ModalManager !== 'undefined' && ModalManager.notifyInsufficient && res.reason) ModalManager.notifyInsufficient(`⚠️ ${res.reason}`, card);
                        if (window.soundEngine && typeof window.soundEngine.playBuzzer === 'function') window.soundEngine.playBuzzer();
                    }
                });
            }
            const ascendBtn = card.querySelector('[data-gear-ascend]');
            if (ascendBtn) {
                ascendBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const res = GearUpgradeManager.ascendToMythic(item.id);
                    if (!res.success) {
                        if (typeof ModalManager !== 'undefined' && ModalManager.notifyInsufficient && res.reason) ModalManager.notifyInsufficient(`⚠️ ${res.reason}`, card);
                        if (window.soundEngine && typeof window.soundEngine.playBuzzer === 'function') window.soundEngine.playBuzzer();
                    }
                });
            }

            gearGrid.appendChild(card);
        });
        if (typeof MobileAssetGuard !== 'undefined' && MobileAssetGuard.isEnabled()) {
            MobileAssetGuard.queueSweep(gearGrid, 40);
        }
    }

    static _renderUpgradeToolbar(gearGrid, tabName = '') {
        if (!gearGrid || !gearGrid.parentNode || typeof GearUpgradeManager === 'undefined') return;
        let toolbar = document.getElementById('gear-upgrade-toolbar');
        if (!toolbar) {
            toolbar = document.createElement('div');
            toolbar.id = 'gear-upgrade-toolbar';
            toolbar.className = 'gear-upgrade-toolbar';
            gearGrid.parentNode.insertBefore(toolbar, gearGrid);
        }
        toolbar.style.display = 'flex';
        const stones = GearUpgradeManager.getEvolutionStones();
        const starStones = (typeof DungeonManager !== 'undefined' && typeof DungeonManager.getOlympianStarStones === 'function') ? DungeonManager.getOlympianStarStones() : 0;
        const stoneIcon = typeof UiIcons !== 'undefined' ? UiIcons.i('evolution_stone', 'ui-icon-sm') : '💎';
        const starIc = typeof UiIcons !== 'undefined' ? UiIcons.i('olympian_star_stone', 'ui-icon-sm') : '🌟';
        const hintText = tabName === 'weapon' ? '• Mythic Weapons: Single ★ Evolve' : '• Lv.4 Legendary + Star-Stone → Mythic';
        toolbar.innerHTML = `
            <div class="gear-evo-stone-pill">
                ${stoneIcon} <span>Evo Stones: <strong id="gear-evolution-stone-count">${stones.toLocaleString()}</strong></span>
                <span style="opacity:0.4;">|</span>
                ${starIc} <span>Star-Stones: <strong>${starStones.toLocaleString()}</strong></span>
                <span style="opacity:0.82;font-weight:700;font-size:0.74rem;">${hintText}</span>
            </div>
            <button type="button" id="gear-open-forge-btn" class="gear-evo-craft-link">⚒️ FORGE STONES</button>
        `;
        const forgeBtn = toolbar.querySelector('#gear-open-forge-btn');
        if (forgeBtn) {
            forgeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
                    window.soundEngine.playSelect();
                }
                const gearModal = document.getElementById('weapons-modal');
                if (gearModal) gearModal.classList.add('hidden');
                if (window.uiController && window.uiController.modalManager && typeof window.uiController.modalManager.showInventoryModal === 'function') {
                    window.uiController.modalManager.showInventoryModal();
                } else {
                    const invBtn = document.getElementById('menu-inventory-btn');
                    if (invBtn) invBtn.click();
                }
                setTimeout(() => {
                    const evoCard = document.querySelector('#inventory-modal .inv-mat-evo');
                    if (evoCard && typeof evoCard.scrollIntoView === 'function') {
                        evoCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 60);
            });
        }
    }

    static _buildLevelHeaderHtml(level, maxLevel, isEvolved, isAscended = false) {
        const isMax = level >= maxLevel;
        const pillCls = isEvolved ? 'is-evolved' : (isAscended ? 'is-ascended' : (isMax ? 'is-max' : ''));
        const label = isEvolved ? '★ EVOLVED AWAKENED' : (isAscended ? '✦ ASCENDED MYTHIC' : (isMax ? `LV ${level}/${maxLevel} MAX` : `LV ${level}/${maxLevel}`));
        let pips = '';
        for (let i = 1; i <= maxLevel; i++) {
            const cls = isEvolved ? 'is-evolved' : (i <= level ? 'is-filled' : '');
            pips += `<span class="gear-lvl-pip ${cls}"></span>`;
        }
        return `<div class="gear-card-lvl-row"><span class="gear-lvl-pill ${pillCls}">${label}</span><span class="gear-lvl-pips" aria-label="Level ${level} of ${maxLevel}">${pips}</span></div>`;
    }

    static _buildUpgradeBoxHtml(item, level, maxLevel, isEvolved, playerCoins, isAscended = false) {
        if (typeof GearUpgradeManager === 'undefined') return '';
        if (isEvolved) {
            return `
                <div class="gear-upgrade-box">
                    <div class="gear-upgrade-cost-line" style="color:#b45309;">★ AWAKENED MYTHIC POWER MAXED ★</div>
                </div>
            `;
        }

        const coinIcon = typeof UiIcons !== 'undefined' ? UiIcons.i('coin', 'ui-icon-sm') : '🪙';

        if (level < maxLevel) {
            const cost = GearUpgradeManager.getUpgradeCost(item);
            if (!cost) return '';
            const inv = (typeof window !== 'undefined') ? window.inventoryManager : null;
            const canAfford = GearUpgradeManager.hasUpgradeResources(item);
            const coinShort = playerCoins < cost.coins;
            const matChips = Object.entries(cost.materials || {}).map(([matId, need]) => {
                const def = (typeof MaterialRegistry !== 'undefined') ? MaterialRegistry.get(matId) : null;
                const have = inv && typeof inv.getMaterialCount === 'function' ? inv.getMaterialCount(matId) : 0;
                const ic = def && def.iconKey && typeof UiIcons !== 'undefined' ? UiIcons.i(def.iconKey, 'ui-icon-sm') : (def ? def.icon : matId);
                return `<span class="gear-cost-chip ${have < need ? 'is-short' : ''}" title="${def ? def.name : matId}: ${have}/${need}">${ic} ${need}</span>`;
            }).join('');

            return `
                <div class="gear-upgrade-box">
                    <div class="gear-upgrade-cost-line">
                        <span class="gear-cost-chip ${coinShort ? 'is-short' : ''}">${coinIcon} ${cost.coins.toLocaleString()}</span>
                        ${matChips}
                    </div>
                    <button type="button" class="gear-btn gear-btn-upgrade ${canAfford ? '' : 'disabled'}" data-gear-upgrade="${item.id}">
                        UPGRADE → LV ${level + 1}
                    </button>
                </div>
            `;
        }

        if (typeof GearUpgradeManager.canAscendToMythic === 'function' && GearUpgradeManager.canAscendToMythic(item)) {
            const cost = GearUpgradeManager.getAscendCost(item);
            const haveStars = (typeof DungeonManager !== 'undefined') ? DungeonManager.getOlympianStarStones() : 0;
            const coinShort = playerCoins < cost.coins, starShort = haveStars < cost.starStones;
            const starIc = typeof UiIcons !== 'undefined' ? UiIcons.i('olympian_star_stone', 'ui-icon-sm') : '🌟';
            return `<div class="gear-upgrade-box"><div class="gear-upgrade-cost-line"><span class="gear-cost-chip ${starShort ? 'is-short' : ''}">${starIc} ${cost.starStones} Star-Stone</span><span class="gear-cost-chip ${coinShort ? 'is-short' : ''}">${coinIcon} ${cost.coins.toLocaleString()}</span></div><button type="button" class="gear-btn gear-btn-ascend ${(!coinShort && !starShort) ? '' : 'disabled'}" data-gear-ascend="${item.id}">✦ ASCEND → MYTHIC</button></div>`;
        }
        if (GearUpgradeManager.isEvolvableRarity(item)) {
            const cost = GearUpgradeManager.getEvolveCost(item);
            const haveStones = GearUpgradeManager.getEvolutionStones();
            const coinShort = playerCoins < cost.coins;
            const stoneShort = haveStones < cost.evolutionStones;
            const canEvolve = !coinShort && !stoneShort;
            const stoneIc = typeof UiIcons !== 'undefined' ? UiIcons.i('evolution_stone', 'ui-icon-sm') : '💎';
            return `
                <div class="gear-upgrade-box">
                    <div class="gear-upgrade-cost-line">
                        <span class="gear-cost-chip ${stoneShort ? 'is-short' : ''}">${stoneIc} ${cost.evolutionStones} Evo Stone</span>
                        <span class="gear-cost-chip ${coinShort ? 'is-short' : ''}">${coinIcon} ${cost.coins.toLocaleString()}</span>
                    </div>
                    <button type="button" class="gear-btn gear-btn-evolve ${canEvolve ? '' : 'disabled'}" data-gear-evolve="${item.id}">
                        ★ EVOLVE WITH STONE
                    </button>
                </div>
            `;
        }

        return `
            <div class="gear-upgrade-box">
                <div class="gear-upgrade-cost-line" style="color:#0369a1;">✓ MAX UPGRADE LEVEL REACHED</div>
            </div>
        `;
    }
}

if (typeof window !== 'undefined') {
    window.GearModalUI = GearModalUI;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GearModalUI };
}
