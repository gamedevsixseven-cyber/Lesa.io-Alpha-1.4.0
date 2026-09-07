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
        maxHp: { label: 'Max HP', unit: '', isPercent: false, icon: '❤️' },
        speed: { label: 'Move Speed', unit: '%', isPercent: true, icon: '👟' },
        damageReduction: { label: 'DEF / Dmg Red.', unit: '%', isPercent: true, icon: '🛡️' },
        critChance: { label: 'Crit Chance', unit: '%', isPercent: true, icon: '🎯' },
        critDamage: { label: 'Crit Damage', unit: '%', isPercent: true, icon: '💥' },
        fireRate: { label: 'Fire Rate', unit: '%', isPercent: true, icon: '⚡' },
        bulletDamage: { label: 'Bullet Damage', unit: '%', isPercent: true, icon: '⚔️' },
        bulletSpeed: { label: 'Bullet Velocity', unit: '%', isPercent: true, icon: '💨' },
        dashCooldown: { label: 'Dash Recovery', unit: '%', isPercent: true, icon: '🌀' },
        magnetRadius: { label: 'Pickup Radius', unit: '', isPercent: false, icon: '🧲' }
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

            if (equipped) {
                el.classList.add(`gear-slot-${equipped.rarity || 'common'}`);
                if (nameEl) nameEl.textContent = equipped.name;

                if (centerContent) {
                    if (equipped.iconImg) {
                        centerContent.innerHTML = `<img src="${equipped.iconImg}" class="gear-slot-icon-img" alt="${equipped.name}">`;
                    } else {
                        centerContent.innerHTML = `<span class="gear-slot-emoji">${equipped.icon || '🛡️'}</span>`;
                    }
                }

                const statSummaries = [];
                if (equipped.stats) {
                    for (const [k, v] of Object.entries(equipped.stats)) {
                        const def = this.STAT_LABELS[k];
                        if (def) statSummaries.push(`+${v}${def.unit} ${def.label}`);
                    }
                }
                el.title = `${equipped.name} (${(equipped.rarity || 'common').toUpperCase()})\n${statSummaries.join(' | ')}\nClick to unequip or switch tab`;
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

        if (this.currentTab === 'weapon') {
            if (weaponsGrid) weaponsGrid.style.display = 'grid';
            if (gearGrid) gearGrid.style.display = 'none';
            if (sectionTitle) sectionTitle.textContent = 'GEAR INVENTORY (WEAPONS)';
            if (badgeCount && weaponsGrid) {
                const visibleCards = Array.from(weaponsGrid.querySelectorAll('.weapon-card')).filter(c => c.style.display !== 'none');
                badgeCount.textContent = `${visibleCards.length} WEAPON${visibleCards.length === 1 ? '' : 'S'} AVAILABLE`;
            }
            return;
        }

        // Equipment slot tab (helmet, armor, belt, gloves, boots)
        if (weaponsGrid) weaponsGrid.style.display = 'none';
        if (!gearGrid) return;
        gearGrid.style.display = 'grid';

        const slot = this.currentTab;
        const slotTitle = slot.charAt(0).toUpperCase() + slot.slice(1);
        if (sectionTitle) sectionTitle.textContent = `GEAR INVENTORY (${slotTitle.toUpperCase()})`;

        const items = (typeof GEAR_ITEMS !== 'undefined' && GEAR_ITEMS[slot]) ? GEAR_ITEMS[slot] : [];
        const currentEquipped = (typeof GearManager !== 'undefined') ? GearManager.getEquipped(slot) : null;
        const playerCoins = (typeof window !== 'undefined' && window.GameState && window.GameState.player) ? (window.GameState.player.coins || 0) : 0;

        if (badgeCount) {
            const label = slotTitle.toLowerCase().endsWith('s') ? slotTitle.toUpperCase() : `${slotTitle.toUpperCase()}S`;
            badgeCount.textContent = `${items.length} ${label} AVAILABLE`;
        }

        gearGrid.innerHTML = '';

        items.forEach(item => {
            const isEquipped = currentEquipped && currentEquipped.id === item.id;
            const isUnlocked = (typeof GearManager !== 'undefined') ? GearManager.isUnlocked(item.id) : false;
            const canAfford = playerCoins >= (item.cost || 0);

            const card = document.createElement('div');
            card.className = `gear-card ${isEquipped ? 'is-equipped' : ''} ${!isUnlocked ? 'is-locked' : ''}`;

            // Build Stats HTML
            let statsHtml = '';
            if (item.stats) {
                const entries = Object.entries(item.stats);
                entries.forEach(([k, v], idx) => {
                    const def = this.STAT_LABELS[k] || { label: k, unit: '', icon: '✨' };
                    const isPrimary = idx === 0;
                    statsHtml += `
                        <div class="gear-stat-badge-row ${isPrimary ? 'primary-stat' : 'secondary-stat'}">
                            <span class="gear-stat-badge-label">${def.icon} ${def.label}</span>
                            <span class="gear-stat-badge-val">+${v}${def.unit}</span>
                        </div>
                    `;
                });
            }

            // Build Action Button
            let buttonHtml = '';
            if (isEquipped) {
                buttonHtml = `<button class="gear-btn gear-btn-equipped gear-btn-unequip-hover" data-action="unequip" data-item="${item.id}" title="Click to Unequip">✓ EQUIPPED</button>`;
            } else if (isUnlocked) {
                buttonHtml = `<button class="gear-btn gear-btn-equip" data-action="equip" data-item="${item.id}">EQUIP</button>`;
            } else {
                buttonHtml = `<button class="gear-btn gear-btn-unlock ${canAfford ? '' : 'disabled'}" data-action="unlock" data-item="${item.id}">🪙 ${item.cost ? item.cost.toLocaleString() : 0} UNLOCK</button>`;
            }

            const iconContent = item.iconImg
                ? `<img src="${item.iconImg}" class="gear-card-img" alt="${item.name}">`
                : `<span class="gear-card-emoji">${item.icon || '🛡️'}</span>`;

            card.innerHTML = `
                <div class="gear-card-header">
                    <div class="gear-card-icon-wrap rarity-${item.rarity || 'common'}">
                        ${iconContent}
                    </div>
                    <div class="gear-card-meta">
                        <h4 class="gear-card-name">${item.name}</h4>
                        <span class="gear-card-subname">${item.desc || item.description || ''}</span>
                    </div>
                    <span class="gear-card-badge badge-${item.rarity || 'common'}">${(item.rarity || 'common').toUpperCase()}</span>
                </div>
                <div class="gear-card-stats">
                    ${statsHtml}
                </div>
                <div class="gear-card-action">
                    ${buttonHtml}
                </div>
            `;

            // Click Handlers for Card and Action Buttons
            const btn = card.querySelector('.gear-btn');
            const handleAction = (e) => {
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
                        if (window.soundEngine && typeof window.soundEngine.playBuzzer === 'function') {
                            window.soundEngine.playBuzzer();
                        }
                    }
                }
            };

            if (btn) btn.addEventListener('click', handleAction);
            card.addEventListener('click', handleAction);

            gearGrid.appendChild(card);
        });
    }
}

if (typeof window !== 'undefined') {
    window.GearModalUI = GearModalUI;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GearModalUI };
}
