/**
 * Lesa.io - Developer Mail & News Manager
 * Handles Mail Modal, System Announcements, Alpha Patch Notes, and Dynamic Developer Cloud Mail
 * Automatically purges custom developer messages & gifts after 24 hours
 */

const MAIL_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 Hours

class MailManager {
    constructor(uiController) {
        this.ui = uiController;

        this.bubbleMailClaimed = localStorage.getItem('lesaio_alpha_bubble_mail_claimed') === 'true';
        this.mail13Claimed = localStorage.getItem('lesaio_alpha13_mail_claimed') === 'true';
        this.mail12Claimed = localStorage.getItem('lesaio_alpha12_mail_claimed') === 'true';
        this.mail11Claimed = localStorage.getItem('lesaio_alpha11_mail_claimed') === 'true';
        this.mail10Claimed = localStorage.getItem('lesaio_alpha_mail_claimed') === 'true';
        this.mailModal = document.getElementById('mail-modal');
        this.mailBadge = document.getElementById('mail-badge');
        this.mailListContainer = document.querySelector('#mail-modal .mail-list');

        // Dynamic Firebase Custom Developer Mails (Only explicit developer dispatches)
        this.customMails = JSON.parse(localStorage.getItem('lesaio_custom_mails') || '[]');
        this.customMails = this.customMails.filter(m => m && m.gems !== 1000 && m.title !== '👑 Special Developer Gift');
        localStorage.removeItem('lesaio_last_dev_mail');
        localStorage.setItem('lesaio_custom_mails', JSON.stringify(this.customMails));
        this.purgeExpiredMails();

        this.initEvents();
        this.renderCustomMails();
        this.updateMailUI();
    }

    /**
     * Purge Developer Mails older than 24 Hours
     */
    purgeExpiredMails() {
        const now = Date.now();
        const initialCount = this.customMails.length;

        this.customMails = this.customMails.filter((mail) => {
            const mailTime = mail.timestamp || now;
            const age = now - mailTime;
            const isExpired = age > MAIL_EXPIRATION_MS;

            if (isExpired) {
                localStorage.removeItem(`lesaio_mail_claimed_${mail.id}`);
            }
            return !isExpired;
        });

        if (this.customMails.length !== initialCount) {
            localStorage.setItem('lesaio_custom_mails', JSON.stringify(this.customMails));
        }
    }

    initEvents() {
        const mailBtn = document.getElementById('btn-mail');
        if (mailBtn) {
            mailBtn.addEventListener('click', () => {
                window.soundEngine.playSelect();
                this.showMailModal();
            });
        }

        const closeMailBtn = document.getElementById('close-mail-btn');
        if (closeMailBtn) {
            closeMailBtn.addEventListener('click', () => {
                window.soundEngine.playGoBack();
                this.hideMailModal();
            });
        }

        // Alpha Founder Exclusive Bubble Gun Weapon Claim
        const claimBubbleBtn = document.getElementById('claim-alpha-bubble-btn');
        if (claimBubbleBtn) {
            claimBubbleBtn.addEventListener('click', () => {
                if (this.bubbleMailClaimed) return;
                this.bubbleMailClaimed = true;
                localStorage.setItem('lesaio_alpha_bubble_mail_claimed', 'true');
                localStorage.setItem('lesaio_weapon_bubble_unlocked', 'true');

                if (window.GameState && window.GameState.player) {
                    if (!window.GameState.player.unlockedWeapons) {
                        window.GameState.player.unlockedWeapons = ['pea'];
                    }
                    if (!window.GameState.player.unlockedWeapons.includes('bubble')) {
                        window.GameState.player.unlockedWeapons.push('bubble');
                    }
                    localStorage.setItem('lesaio_unlocked_weapons', JSON.stringify(window.GameState.player.unlockedWeapons));
                }

                this.updateMailUI();
                if (window.soundEngine) window.soundEngine.playPickup('star');
                if (window.uiController && window.uiController.modalManager) {
                    window.uiController.modalManager.updateWeaponsModal();
                }
                if (window.cloudSave) {
                    window.cloudSave.saveToCloud({
                        unlockedWeapons: (window.GameState && window.GameState.player.unlockedWeapons) || ['pea', 'bubble']
                    });
                }
            });
        }

        // Alpha 1.3 Biggest Update Gift Claim (+1,500 Coins & +75 Gems)
        const claim13Btn = document.getElementById('claim-alpha13-gift-btn');
        if (claim13Btn) {
            claim13Btn.addEventListener('click', () => {
                if (this.mail13Claimed) return;
                this.mail13Claimed = true;
                localStorage.setItem('lesaio_alpha13_mail_claimed', 'true');

                if (this.ui.setCoins) this.ui.setCoins(this.ui.coins + 1500, true);
                if (this.ui.setGems) this.ui.setGems(this.ui.gems + 75, true);

                this.updateMailUI();
                window.soundEngine.playPickup('star');
                if (window.cloudSave) window.cloudSave.saveToCloud({ coins: this.ui.coins, gems: this.ui.gems });
            });
        }

        // Alpha 1.2 Big Update Gift Claim (+1,000 Coins & +50 Gems)
        const claim12Btn = document.getElementById('claim-alpha12-gift-btn');
        if (claim12Btn) {
            claim12Btn.addEventListener('click', () => {
                if (this.mail12Claimed) return;
                this.mail12Claimed = true;
                localStorage.setItem('lesaio_alpha12_mail_claimed', 'true');

                if (this.ui.setCoins) this.ui.setCoins(this.ui.coins + 1000, true);
                if (this.ui.setGems) this.ui.setGems(this.ui.gems + 50, true);

                this.updateMailUI();
                window.soundEngine.playPickup('star');
                if (window.cloudSave) window.cloudSave.saveToCloud({ coins: this.ui.coins, gems: this.ui.gems });
            });
        }

        // Alpha 1.1 Gift Claim (+600 Coins & +30 Gems)
        const claim11Btn = document.getElementById('claim-alpha11-gift-btn');
        if (claim11Btn) {
            claim11Btn.addEventListener('click', () => {
                if (this.mail11Claimed) return;
                this.mail11Claimed = true;
                localStorage.setItem('lesaio_alpha11_mail_claimed', 'true');

                if (this.ui.setCoins) this.ui.setCoins(this.ui.coins + 600, true);
                if (this.ui.setGems) this.ui.setGems(this.ui.gems + 30, true);

                this.updateMailUI();
                window.soundEngine.playPickup('star');
                if (window.cloudSave) window.cloudSave.saveToCloud({ coins: this.ui.coins, gems: this.ui.gems });
            });
        }

        // Alpha 1.0 Gift Claim (+500 Coins & +25 Gems)
        const claim10Btn = document.getElementById('claim-alpha-gift-btn');
        if (claim10Btn) {
            claim10Btn.addEventListener('click', () => {
                if (this.mail10Claimed) return;
                this.mail10Claimed = true;
                localStorage.setItem('lesaio_alpha_mail_claimed', 'true');

                if (this.ui.setCoins) this.ui.setCoins(this.ui.coins + 500, true);
                if (this.ui.setGems) this.ui.setGems(this.ui.gems + 25, true);

                this.updateMailUI();
                window.soundEngine.playPickup('star');
                if (window.cloudSave) window.cloudSave.saveToCloud({ coins: this.ui.coins, gems: this.ui.gems });
            });
        }
    }

    /**
     * Add or sync a custom Developer Mail item received from Firebase Cloud
     */
    addOrUpdateFirebaseMail(mailData, silent = false) {
        if (!mailData) return;

        let mailObj = null;
        if (typeof mailData === 'string') {
            if (mailData.includes('|')) {
                const parts = mailData.split('|');
                mailObj = {
                    body: parts[0].trim(),
                    gems: parseInt(parts[1].trim(), 10) || 0,
                    title: '👑 Special Developer Gift'
                };
            } else {
                mailObj = {
                    body: mailData.trim(),
                    title: '📢 Message from Developer'
                };
            }
        } else {
            mailObj = mailData;
        }

        const mailId = mailObj.id || `dev_mail_${mailObj.title ? mailObj.title.replace(/\s+/g, '_') : 'notice'}`;
        const isClaimed = mailObj.claimed !== undefined ? !!mailObj.claimed : (localStorage.getItem(`lesaio_mail_${mailId}_claimed`) === 'true');

        const gemsVal = parseInt(mailObj.gems !== undefined ? mailObj.gems : (mailObj.giftGems || 0), 10);
        const coinsVal = parseInt(mailObj.coins !== undefined ? mailObj.coins : (mailObj.giftCoins || 0), 10);

        const customMail = {
            id: mailId,
            title: mailObj.title || 'Developer Update',
            badge: mailObj.badge || 'DEV NOTICE',
            badgeClass: mailObj.badgeClass || 'badge-alpha11',
            desc: mailObj.desc || mailObj.body || mailObj.message || 'New news from the development team!',
            gems: gemsVal,
            coins: coinsVal,
            date: mailObj.date || 'Just Now',
            timestamp: mailObj.timestamp || Date.now(),
            claimed: isClaimed
        };

        // Check if exists
        const existingIdx = this.customMails.findIndex(m => m.id === mailId);
        if (existingIdx >= 0) {
            this.customMails[existingIdx] = { ...this.customMails[existingIdx], ...customMail };
        } else {
            this.customMails.unshift(customMail);
            // Play notification chime only for newly arrived live mail during active gameplay
            if (!silent && window.soundEngine && !customMail.claimed) {
                window.soundEngine.playPickup('star');
            }
        }

        // Sort: Unclaimed mails first, then newest timestamp first
        this.customMails.sort((a, b) => {
            if (a.claimed !== b.claimed) return a.claimed ? 1 : -1;
            return (b.timestamp || 0) - (a.timestamp || 0);
        });

        localStorage.setItem('lesaio_custom_mails', JSON.stringify(this.customMails));
        this.renderCustomMails();
        this.updateMailUI();
    }

    renderCustomMails() {
        if (!this.mailListContainer) return;

        // Purge any mail older than 24 hours
        this.purgeExpiredMails();

        // Remove previous dynamic cards to avoid duplicates
        const oldDynamicCards = this.mailListContainer.querySelectorAll('.mail-custom-dynamic');
        oldDynamicCards.forEach(el => el.remove());

        // Sort copy: Unclaimed first, newest first
        const sortedMails = [...this.customMails].sort((a, b) => {
            if (a.claimed !== b.claimed) return a.claimed ? 1 : -1;
            return (b.timestamp || 0) - (a.timestamp || 0);
        });

        const now = Date.now();

        // Insert in reverse order so highest priority ends up at top of list
        for (let i = sortedMails.length - 1; i >= 0; i--) {
            const mail = sortedMails[i];
            const card = document.createElement('div');
            card.className = 'mail-card mail-featured mail-custom-dynamic';
            card.style.borderColor = '#f39c12';
            card.style.background = '#fff8e7';

            // Calculate remaining time before 24h deletion
            const ageMs = now - (mail.timestamp || now);
            const remainingHours = Math.max(1, Math.ceil((MAIL_EXPIRATION_MS - ageMs) / (1000 * 60 * 60)));

            const rewardsHTML = (mail.gems > 0 || mail.coins > 0) ? `
                <div class="mail-attachment-box">
                    <div class="attachment-rewards">
                        <span class="att-title">Attached Gift:</span>
                        ${mail.gems > 0 ? `<span class="att-item" style="color: #2980b9;">💎 +${mail.gems.toLocaleString()} Gems</span>` : ''}
                        ${mail.coins > 0 ? `<span class="att-item" style="color: #d35400;">🪙 +${mail.coins.toLocaleString()} Coins</span>` : ''}
                    </div>
                    <button id="claim-${mail.id}-btn" class="comic-btn comic-btn-sm ${mail.claimed ? 'quest-btn-claimed' : 'comic-btn-primary'}" ${mail.claimed ? 'disabled' : ''}>
                        ${mail.claimed ? 'CLAIMED ✅' : 'CLAIM GIFT 🎁'}
                    </button>
                </div>
            ` : '';

            card.innerHTML = `
                <div class="mail-header-row">
                    <div class="mail-title-group">
                        <span class="mail-badge-tag" style="background: #e67e22;">${mail.badge}</span>
                        <h3 class="mail-subject">${mail.title}</h3>
                    </div>
                    <span class="mail-date" title="Auto-deletes after 24 hours">⏳ ${remainingHours}h left</span>
                </div>
                <div class="mail-sender">From: <strong>${mail.sender}</strong></div>
                <div class="mail-body-text" style="line-height: 1.6; font-size: 1.05rem;">
                    ${mail.body}
                </div>
                ${rewardsHTML}
            `;

            // Insert dynamic card at the top of the mailbox
            this.mailListContainer.insertBefore(card, this.mailListContainer.firstChild);

            // Hook claim button event
            if (mail.gems > 0 || mail.coins > 0) {
                const claimBtn = card.querySelector(`#claim-${mail.id}-btn`);
                if (claimBtn && !mail.claimed) {
                    claimBtn.addEventListener('click', () => {
                        mail.claimed = true;
                        localStorage.setItem(`lesaio_mail_claimed_${mail.id}`, 'true');
                        localStorage.setItem('lesaio_custom_mails', JSON.stringify(this.customMails));

                        // Smoothly roll up gems & coins
                        if (mail.gems > 0 && this.ui.setGems) {
                            this.ui.setGems(this.ui.gems + mail.gems, true);
                        }
                        if (mail.coins > 0 && this.ui.setCoins) {
                            this.ui.setCoins(this.ui.coins + mail.coins, true);
                        }

                        window.soundEngine.playPickup('star');
                        claimBtn.textContent = 'CLAIMED ✅';
                        claimBtn.className = 'comic-btn comic-btn-sm quest-btn-claimed';
                        claimBtn.disabled = true;

                        this.updateMailUI();
                        if (window.cloudSave) {
                            window.cloudSave.saveToCloud({ coins: this.ui.coins, gems: this.ui.gems });
                        }
                    });
                }
            }
        }
    }

    isCardClaimed(card) {
        if (!card) return true;
        if (card.querySelector('#claim-alpha-bubble-btn')) return this.bubbleMailClaimed;
        if (card.querySelector('#claim-alpha13-gift-btn')) return this.mail13Claimed;
        if (card.querySelector('#claim-alpha12-gift-btn')) return this.mail12Claimed;
        if (card.querySelector('#claim-alpha11-gift-btn')) return this.mail11Claimed;
        if (card.querySelector('#claim-alpha-gift-btn')) return this.mail10Claimed;

        const btn = card.querySelector('button[id^="claim-"]');
        if (btn) {
            return btn.disabled || btn.classList.contains('quest-btn-claimed');
        }
        return false;
    }

    sortMailsByReadStatus() {
        if (!this.mailListContainer) return;
        const cards = Array.from(this.mailListContainer.querySelectorAll('.mail-card'));
        if (cards.length <= 1) return;

        // Unread / unclaimed cards go to the top, claimed / read cards go to the bottom
        cards.sort((a, b) => {
            const aClaimed = this.isCardClaimed(a);
            const bClaimed = this.isCardClaimed(b);
            if (aClaimed !== bClaimed) {
                return aClaimed ? 1 : -1;
            }
            return 0;
        });

        cards.forEach(card => this.mailListContainer.appendChild(card));
    }

    showMailModal() {
        this.renderCustomMails();
        this.updateMailUI();
        this.sortMailsByReadStatus();
        if (this.mailModal) this.mailModal.classList.remove('hidden');
    }

    hideMailModal() {
        if (this.mailModal) this.mailModal.classList.add('hidden');
    }

    updateMailUI() {
        const claimBubbleBtn = document.getElementById('claim-alpha-bubble-btn');
        if (claimBubbleBtn) {
            if (this.bubbleMailClaimed) {
                claimBubbleBtn.textContent = 'CLAIMED ✅';
                claimBubbleBtn.className = 'comic-btn comic-btn-sm quest-btn-claimed';
                claimBubbleBtn.disabled = true;
            } else {
                claimBubbleBtn.textContent = 'CLAIM WEAPON 🎁';
                claimBubbleBtn.className = 'comic-btn comic-btn-sm comic-btn-primary';
                claimBubbleBtn.disabled = false;
            }
        }

        const claim13Btn = document.getElementById('claim-alpha13-gift-btn');
        if (claim13Btn) {
            if (this.mail13Claimed) {
                claim13Btn.textContent = 'CLAIMED ✅';
                claim13Btn.className = 'comic-btn comic-btn-sm quest-btn-claimed';
                claim13Btn.disabled = true;
            } else {
                claim13Btn.textContent = 'CLAIM GIFT 🎁';
                claim13Btn.className = 'comic-btn comic-btn-sm comic-btn-primary';
                claim13Btn.disabled = false;
            }
        }

        const claim12Btn = document.getElementById('claim-alpha12-gift-btn');
        if (claim12Btn) {
            if (this.mail12Claimed) {
                claim12Btn.textContent = 'CLAIMED ✅';
                claim12Btn.className = 'comic-btn comic-btn-sm quest-btn-claimed';
                claim12Btn.disabled = true;
            } else {
                claim12Btn.textContent = 'CLAIM GIFT 🎁';
                claim12Btn.className = 'comic-btn comic-btn-sm comic-btn-primary';
                claim12Btn.disabled = false;
            }
        }

        const claim11Btn = document.getElementById('claim-alpha11-gift-btn');
        if (claim11Btn) {
            if (this.mail11Claimed) {
                claim11Btn.textContent = 'CLAIMED ✅';
                claim11Btn.className = 'comic-btn comic-btn-sm quest-btn-claimed';
                claim11Btn.disabled = true;
            } else {
                claim11Btn.textContent = 'CLAIM GIFT 🎁';
                claim11Btn.className = 'comic-btn comic-btn-sm comic-btn-primary';
                claim11Btn.disabled = false;
            }
        }

        const claim10Btn = document.getElementById('claim-alpha-gift-btn');
        if (claim10Btn) {
            if (this.mail10Claimed) {
                claim10Btn.textContent = 'CLAIMED ✅';
                claim10Btn.className = 'comic-btn comic-btn-sm quest-btn-claimed';
                claim10Btn.disabled = true;
            } else {
                claim10Btn.textContent = 'CLAIM GIFT 🎁';
                claim10Btn.className = 'comic-btn comic-btn-sm comic-btn-primary';
                claim10Btn.disabled = false;
            }
        }

        if (this.mailBadge) {
            const hasUnclaimedCustom = this.customMails.some(m => !m.claimed && (m.gems > 0 || m.coins > 0));
            const hasUnclaimed = !this.bubbleMailClaimed || !this.mail13Claimed || !this.mail12Claimed || !this.mail11Claimed || !this.mail10Claimed || hasUnclaimedCustom;
            if (hasUnclaimed) {
                this.mailBadge.classList.remove('hidden');
            } else {
                this.mailBadge.classList.add('hidden');
            }
        }

        this.sortMailsByReadStatus();
    }
}
