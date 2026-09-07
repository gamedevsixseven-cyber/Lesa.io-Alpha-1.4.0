/**
 * Lesa.io - Chest Inspection & Loot Reveal Modal UI
 * Handles interactive inspection popup and the comic-book loot opening sequence.
 */

class ChestModalUI {
    static modalEl = null;

    static getOrCreateModal() {
        if (this.modalEl && document.body.contains(this.modalEl)) return this.modalEl;

        let el = document.getElementById('chest-action-modal');
        if (!el) {
            el = document.createElement('div');
            el.id = 'chest-action-modal';
            el.className = 'modal-overlay hidden';
            el.style.zIndex = '500';
            el.innerHTML = `
                <div class="modal-panel" style="max-width: 500px; width: 92%; text-align: center;">
                    <button id="chest-modal-close" class="modal-close-x-btn" title="Close (Esc)" aria-label="Close">✕</button>
                    <h2 id="chest-modal-title" class="modal-title">CHEST</h2>
                    <div class="modal-body" id="chest-modal-body" style="padding: 10px 4px;">
                        <!-- Injected dynamically -->
                    </div>
                </div>
            `;
            document.body.appendChild(el);
        }

        const closeBtn = el.querySelector('#chest-modal-close');
        if (closeBtn && !closeBtn._hasBound) {
            closeBtn._hasBound = true;
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.soundEngine && typeof window.soundEngine.playGoBack === 'function') {
                    window.soundEngine.playGoBack();
                }
                this.hide();
            });
        }

        if (!el._hasClickBound) {
            el._hasClickBound = true;
            el.addEventListener('click', (e) => {
                // If clicking close button, close handler handles it
                if (e.target && e.target.closest('#chest-modal-close')) {
                    return;
                }
                // If on summary screen and clicking collect button, button handler handles it
                if (e.target && e.target.closest('#btn-collect-loot')) {
                    return;
                }

                if (this.sequence) {
                    if (!this.sequence.isComplete) {
                        // In unboxing sequence: tap anywhere on screen/modal to advance!
                        this.advanceSequence();
                    } else if (e.target === el) {
                        // Summary screen: backdrop click dismisses
                        this.hide();
                    }
                } else if (e.target === el) {
                    // Standard inspect screen: backdrop click dismisses
                    this.hide();
                }
            });
        }

        this.modalEl = el;
        return el;
    }

    static hide() {
        if (this.sequenceKeyHandler) {
            window.removeEventListener('keydown', this.sequenceKeyHandler);
            this.sequenceKeyHandler = null;
        }
        this.sequence = null;
        if (this.modalEl) {
            this.modalEl.classList.add('hidden');
        }
    }

    /**
     * Inspect a clicked slot (Locked, Unlocking, or Ready)
     */
    static inspect(slotIndex, slot, manager) {
        if (!slot) return;
        const modal = this.getOrCreateModal();
        const def = (typeof CHEST_TYPES !== 'undefined') ? CHEST_TYPES[slot.type] : null;
        if (!def) return;

        const titleEl = modal.querySelector('#chest-modal-title');
        const bodyEl = modal.querySelector('#chest-modal-body');

        titleEl.textContent = def.name.toUpperCase();
        titleEl.style.color = def.color || '#fed330';

        const speedCost = manager.getSpeedUpGemCost(slot);

        let actionBtnHtml = '';
        if (slot.state === 'LOCKED') {
            const unlockDurationStr = (typeof manager.formatDuration === 'function') 
                ? manager.formatDuration(def.unlockTimeSec) 
                : manager.formatTime(def.unlockTimeSec);

            actionBtnHtml = `
                <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 14px;">
                    <button id="btn-start-unlock" class="comic-btn comic-btn-primary" style="width: 100%; padding: 12px;">
                        <span>⏱️ START UNLOCK (${unlockDurationStr})</span>
                    </button>
                    <button id="btn-gem-open" class="comic-btn" style="width: 100%; padding: 10px; background: #9b59b6; color: #fff; border-color: #1e272e;">
                        <span>💎 OPEN NOW (${speedCost} GEMS)</span>
                    </button>
                </div>
            `;
        } else if (slot.state === 'UNLOCKING') {
            const rem = manager.getRemainingSeconds(slot);
            const canFreeSkip = manager.canUseDailyFreeSkip(slot);

            const freeSkipHtml = canFreeSkip ? `
                <button id="btn-free-skip" class="comic-btn btn-daily-free-skip" style="width: 100%; padding: 12px; font-size: 1rem;">
                    <span>⚡ FREE FINISH (≤ 1 MIN LEFT — 1/DAY)</span>
                </button>
            ` : '';

            actionBtnHtml = `
                <div style="margin: 10px 0; font-weight: 800; color: #0984e3; font-size: 1.1rem;">
                    ⏱️ Unlocking: ${manager.formatTime(rem)}
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
                    ${freeSkipHtml}
                    <button id="btn-gem-open" class="comic-btn" style="width: 100%; padding: 12px; background: #9b59b6; color: #fff; border-color: #1e272e;">
                        <span>💎 SPEED UP (${speedCost} GEMS)</span>
                    </button>
                </div>
            `;
        } else if (slot.state === 'READY') {
            actionBtnHtml = `
                <div style="margin-top: 14px;">
                    <button id="btn-claim-open" class="comic-btn comic-btn-primary status-ready" style="width: 100%; padding: 14px; font-size: 1.2rem;">
                        <span>✨ TAP TO OPEN! ✨</span>
                    </button>
                </div>
            `;
        }

        bodyEl.innerHTML = `
            <img src="${def.icon}" class="chest-modal-preview" alt="${def.name}">
            <div class="chest-contents-summary">
                <div class="chest-summary-item">
                    <span class="chest-summary-icon">🪙</span>
                    <span class="chest-summary-text">${def.minCoins.toLocaleString()} - ${def.maxCoins.toLocaleString()}</span>
                </div>
                <div class="chest-summary-item">
                    <span class="chest-summary-icon">💎</span>
                    <span class="chest-summary-text">${def.gemDropChance > 0 ? `${def.minGems}-${def.maxGems}` : '0'} Gems</span>
                </div>
                <div class="chest-summary-item">
                    <span class="chest-summary-icon">🛡️</span>
                    <span class="chest-summary-text">${def.gearCount} Gear Cards</span>
                </div>
            </div>
            ${actionBtnHtml}
        `;

        modal.classList.remove('hidden');

        // Bind Action Buttons
        const startBtn = bodyEl.querySelector('#btn-start-unlock');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                manager.startUnlock(slotIndex);
                this.hide();
            });
        }

        const freeBtn = bodyEl.querySelector('#btn-free-skip');
        if (freeBtn) {
            freeBtn.addEventListener('click', () => {
                const ok = manager.useDailyFreeSkip(slotIndex);
                if (ok) {
                    this.inspect(slotIndex, slot, manager);
                }
            });
        }

        const gemBtn = bodyEl.querySelector('#btn-gem-open');
        if (gemBtn) {
            gemBtn.addEventListener('click', () => {
                const ok = manager.speedUpWithGems(slotIndex);
                if (ok) {
                    this.inspect(slotIndex, slot, manager);
                }
            });
        }

        const claimBtn = bodyEl.querySelector('#btn-claim-open');
        if (claimBtn) {
            claimBtn.addEventListener('click', () => {
                manager.openChest(slotIndex);
            });
        }
    }

    /**
     * Show animated loot sequence when a chest is opened
     */
    static sequence = null;
    static sequenceKeyHandler = null;

    /**
     * Show Clash Royale style tap-to-reveal animated loot sequence
     */
    static showLoot(def, loot) {
        const items = [];

        // 1. Coins
        if (loot.coins && loot.coins > 0) {
            items.push({
                type: 'coins',
                title: 'GOLD COINS',
                amount: loot.coins,
                icon: '🪙',
                color: '#fed330',
                sound: 'star'
            });
        }

        // 2. Gems
        if (loot.gems && loot.gems > 0) {
            items.push({
                type: 'gems',
                title: 'PREMIUM GEMS',
                amount: loot.gems,
                icon: '💎',
                color: '#54a0ff',
                sound: 'diamond'
            });
        }

        // 3. Gear cards
        if (Array.isArray(loot.gear)) {
            for (const item of loot.gear) {
                items.push({
                    type: 'gear',
                    title: item.name,
                    gear: item,
                    rarity: item.rarity || 'common',
                    sound: (item.rarity === 'legendary' || item.rarity === 'mythic') ? 'levelup' : 'star'
                });
            }
        }

        this.sequence = {
            def,
            loot,
            items,
            currentIndex: -1, // Start with Chest Intro
            lastTapTime: 0,
            isComplete: false
        };

        // Attach global key listener for Space / Enter to advance
        if (this.sequenceKeyHandler) {
            window.removeEventListener('keydown', this.sequenceKeyHandler);
        }
        this.sequenceKeyHandler = (e) => {
            if ((e.code === 'Space' || e.code === 'Enter') && this.sequence) {
                e.preventDefault();
                if (this.sequence.isComplete) {
                    this.hide();
                } else {
                    this.advanceSequence();
                }
            }
        };
        window.addEventListener('keydown', this.sequenceKeyHandler);

        this.renderSequenceStep();
    }

    static advanceSequence() {
        if (!this.sequence || this.sequence.isComplete) return;
        const now = Date.now();
        if (now - this.sequence.lastTapTime < 140) return; // Prevent accidental double-tap
        this.sequence.lastTapTime = now;

        if (this.sequence.currentIndex === -1) {
            // Popping open the chest!
            if (window.soundEngine) {
                if (typeof window.soundEngine.playLevelUp === 'function') {
                    window.soundEngine.playLevelUp();
                } else if (typeof window.soundEngine.playSelect === 'function') {
                    window.soundEngine.playSelect();
                }
            }
        }

        this.sequence.currentIndex++;
        if (this.sequence.currentIndex >= this.sequence.items.length) {
            this.sequence.isComplete = true;
        }
        this.renderSequenceStep();
    }

    static renderSequenceStep() {
        if (!this.sequence) return;
        const modal = this.getOrCreateModal();
        const titleEl = modal.querySelector('#chest-modal-title');
        const bodyEl = modal.querySelector('#chest-modal-body');

        const { def, items, currentIndex } = this.sequence;

        // 1. CHEST INTRO STAGE (Tap chest to pop open)
        if (currentIndex === -1) {
            titleEl.textContent = def.name.toUpperCase();
            titleEl.style.color = def.color || '#fed330';

            bodyEl.innerHTML = `
                <div class="cr-remaining-badge">⚡ ${items.length} REWARDS INSIDE</div>

                <div class="cr-loot-stage" id="cr-stage-clickarea">
                    <div class="cr-sunburst"></div>
                    <div class="cr-card-slam">
                        <img src="${def.icon}" class="cr-chest-intro-img" alt="${def.name}">
                    </div>
                    <div class="cr-tap-hint">✨ TAP CHEST TO OPEN! ✨</div>
                </div>
            `;

            modal.classList.remove('hidden');

            const stage = bodyEl.querySelector('#cr-stage-clickarea');
            if (stage) {
                stage.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.advanceSequence();
                });
            }
            return;
        }

        // 2. REWARD SUMMARY SCREEN
        if (currentIndex >= items.length) {
            this.renderSummaryScreen();
            return;
        }

        const item = items[currentIndex];
        const remainingCount = items.length - 1 - currentIndex;

        titleEl.textContent = def.name.toUpperCase();
        titleEl.style.color = def.color || '#fed330';

        // Play SFX
        if (window.soundEngine) {
            if (item.sound === 'diamond' && typeof window.soundEngine.playPickup === 'function') {
                window.soundEngine.playPickup('diamond');
            } else if (item.sound === 'levelup' && typeof window.soundEngine.playLevelUp === 'function') {
                window.soundEngine.playLevelUp();
            } else if (typeof window.soundEngine.playPickup === 'function') {
                window.soundEngine.playPickup('star');
            }
        }

        let itemCardHtml = '';
        if (item.type === 'coins') {
            itemCardHtml = `
                <div class="cr-card-slam">
                    <div class="cr-item-card tier-rare">
                        <div class="cr-card-rarity-ribbon" style="background: #fed330; color: #1e272e;">CURRENCY</div>
                        <div class="cr-item-emoji">🪙</div>
                        <div class="cr-item-name">GOLD COINS</div>
                        <div class="cr-item-qty">+${item.amount.toLocaleString()}</div>
                    </div>
                </div>
            `;
        } else if (item.type === 'gems') {
            itemCardHtml = `
                <div class="cr-card-slam">
                    <div class="cr-item-card tier-epic">
                        <div class="cr-card-rarity-ribbon" style="background: #54a0ff; color: #ffffff;">VAULT GEMS</div>
                        <div class="cr-item-emoji">💎</div>
                        <div class="cr-item-name">PREMIUM GEMS</div>
                        <div class="cr-item-qty" style="color: #54a0ff;">+${item.amount.toLocaleString()}</div>
                    </div>
                </div>
            `;
        } else if (item.type === 'gear') {
            const g = item.gear;
            const rClass = item.rarity || 'common';
            const iconHtml = g.iconImg 
                ? `<img src="${g.iconImg}" class="cr-item-img" alt="${g.name}">` 
                : `<div class="cr-item-emoji">${g.icon || '🛡️'}</div>`;

            itemCardHtml = `
                <div class="cr-card-slam">
                    <div class="cr-item-card tier-${rClass}">
                        <div class="cr-card-rarity-ribbon">${rClass.toUpperCase()}</div>
                        ${iconHtml}
                        <div class="cr-item-name" title="${g.name}">${g.name}</div>
                        <div class="cr-item-qty" style="color: #57606f; font-size: 0.72rem;">${(g.slot || 'GEAR').toUpperCase()}</div>
                    </div>
                </div>
            `;
        }

        const remainingText = remainingCount > 0 
            ? `<div class="cr-remaining-badge">⚡ ${remainingCount} ${remainingCount === 1 ? 'REWARD' : 'REWARDS'} LEFT</div>` 
            : `<div class="cr-remaining-badge" style="background: #2ed573; color: #ffffff;">✨ LAST REWARD! ✨</div>`;

        bodyEl.innerHTML = `
            ${remainingText}

            <div class="cr-loot-stage" id="cr-stage-clickarea">
                <div class="cr-sunburst"></div>
                ${itemCardHtml}
                <div class="cr-tap-hint">👆 TAP ANYWHERE TO REVEAL NEXT</div>
            </div>
        `;

        modal.classList.remove('hidden');

        // Tap on stage or anywhere on modal to advance
        const stage = bodyEl.querySelector('#cr-stage-clickarea');
        if (stage) {
            stage.addEventListener('click', (e) => {
                e.stopPropagation();
                this.advanceSequence();
            });
        }
    }

    static renderSummaryScreen() {
        const modal = this.getOrCreateModal();
        const titleEl = modal.querySelector('#chest-modal-title');
        const bodyEl = modal.querySelector('#chest-modal-body');
        const { def, loot } = this.sequence;

        titleEl.textContent = '🎉 ALL REWARDS CLAIMED! 🎉';
        titleEl.style.color = '#fed330';

        if (window.soundEngine && typeof window.soundEngine.playLevelUp === 'function') {
            window.soundEngine.playLevelUp();
        }

        let gearCardsHtml = '';
        if (loot.gear && loot.gear.length > 0) {
            gearCardsHtml = loot.gear.map((item, idx) => {
                const icon = item.iconImg ? `<img src="${item.iconImg}" class="loot-card-icon" alt="${item.name}">` : `<span style="font-size: 2rem;">${item.icon || '🛡️'}</span>`;
                const rClass = item.rarity || 'common';
                return `
                    <div class="loot-card-item tier-${rClass}" style="animation-delay: ${idx * 0.08}s;">
                        <span style="font-size: 0.6rem; font-weight: 900; text-transform: uppercase; color: #747d8c;">${rClass}</span>
                        ${icon}
                        <div class="loot-card-name" title="${item.name}">${item.name}</div>
                    </div>
                `;
            }).join('');
        }

        bodyEl.innerHTML = `
            <img src="${def.icon}" class="chest-modal-preview" style="width: 80px; height: 75px;" alt="${def.name}">
            
            <div style="display: flex; justify-content: center; gap: 20px; margin: 8px 0;">
                <div style="display: flex; align-items: center; gap: 6px; font-size: 1.3rem; font-family: 'Luckiest Guy', sans-serif; color: #fed330; text-shadow: 2px 2px 0 #000;">
                    <span>🪙</span> +${loot.coins.toLocaleString()}
                </div>
                ${loot.gems > 0 ? `
                    <div style="display: flex; align-items: center; gap: 6px; font-size: 1.3rem; font-family: 'Luckiest Guy', sans-serif; color: #54a0ff; text-shadow: 2px 2px 0 #000;">
                        <span>💎</span> +${loot.gems.toLocaleString()}
                    </div>
                ` : ''}
            </div>

            <div class="chest-loot-cards">
                ${gearCardsHtml}
            </div>

            <button id="btn-collect-loot" class="comic-btn comic-btn-primary" style="width: 100%; padding: 14px; font-size: 1.15rem; margin-top: 10px;">
                <span>✓ COLLECT ALL</span>
            </button>
        `;

        const collectBtn = bodyEl.querySelector('#btn-collect-loot');
        if (collectBtn) {
            collectBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
                    window.soundEngine.playSelect();
                }
                this.hide();
            });
        }
    }
}

if (typeof window !== 'undefined') {
    window.ChestModalUI = ChestModalUI;
}
