/**
 * Lesa.io - Firebase Cloud Save & Google Authentication Engine
 * Handles Google OAuth Sign-In and Cloud Firestore persistence
 */

// Live Firebase Config for Lesa.io
const firebaseConfig = {
    apiKey: "AIzaSyDetPvSSZ4MlO_-5OD1XivtSK23xSK4TqA",
    authDomain: "lesaio.firebaseapp.com",
    projectId: "lesaio",
    storageBucket: "lesaio.firebasestorage.app",
    messagingSenderId: "1020787391398",
    appId: "1:1020787391398:web:fc0e74e04316a7488aad67",
    measurementId: "G-4Z04SYRNZY"
};

class CloudSaveService {
    constructor() {
        this.isInitialized = false;
        this.auth = null;
        this.db = null;
        this.currentUser = null;
        this.hasCompletedInitialSync = false;

        this.init();
    }

    init() {
        if (typeof firebase === 'undefined') return;

        try {
            if (!firebase.apps.length) {
                if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
                    firebase.initializeApp(firebaseConfig);
                    this.auth = firebase.auth();
                    this.db = firebase.firestore();
                    this.isInitialized = true;

                    // Start live listener for distinct device or authenticated player
                    const uid = this.getEffectivePlayerUid();
                    const email = this.getEffectivePlayerEmail();
                    if (uid) {
                        this.startRealtimeListener({ uid, email });
                    }

                    // Listen for real-time auth state changes
                    this.auth.onAuthStateChanged((user) => {
                        if (user) {
                            this.currentUser = user;
                            localStorage.setItem('lesaio_google_linked', 'true');
                            localStorage.setItem('lesaio_google_uid', user.uid);
                            localStorage.setItem('lesaio_google_email', user.email || '');
                            localStorage.setItem('lesaio_google_name', user.displayName || user.email.split('@')[0]);
                            this.startRealtimeListener(user);
                        }
                        if (window.uiController && window.uiController.settingsManager) {
                            window.uiController.settingsManager.updateCloudUI();
                        }
                        if (window.friendService) window.friendService.onAuthChanged();
                    });
                }
            }
        } catch (err) {
            console.warn('Firebase initialization notice:', err);
        }
    }

    getEffectivePlayerUid() {
        return (typeof PlayerIdentity !== 'undefined')
            ? PlayerIdentity.getEffectiveUid(this.auth, this.currentUser)
            : ((this.currentUser && this.currentUser.uid) || localStorage.getItem('lesaio_player_uid') || 'RLqBTfjZATZzePCPDyNCrUGCYrs2');
    }

    getEffectivePlayerEmail() {
        return (typeof PlayerIdentity !== 'undefined')
            ? PlayerIdentity.getEffectiveEmail(this.auth, this.currentUser)
            : ((this.currentUser && this.currentUser.email) || '');
    }

    seedNewPlayerDoc(uid) {
        if (typeof PlayerIdentity !== 'undefined') {
            PlayerIdentity.seedNewPlayerDoc(this.db, uid);
        }
    }

    async signInWithGoogle() {
        // Google OAuth requires http:// or https:// (it forbids file:/// protocols for security)
        if (window.location.protocol === 'file:') {
            alert('ℹ️ Google Sign-In requires running on a web server (http://localhost:8080/ or https://).\n\nPlease open the game in your browser via http://localhost:8080/ or run Lesa.io.exe!');
            return { success: false, fallback: true };
        }

        if (!this.isInitialized || !this.auth) {
            return { success: false, fallback: true };
        }

        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');
            
            const result = await this.auth.signInWithPopup(provider);
            this.currentUser = result.user;

            if (this.currentUser) {
                localStorage.setItem('lesaio_google_linked', 'true');
                localStorage.setItem('lesaio_google_email', this.currentUser.email);
                localStorage.setItem('lesaio_google_name', this.currentUser.displayName || this.currentUser.email.split('@')[0]);
                
                // Synchronize existing cloud save data if present
                let syncResult = null;
                if (typeof AccountSyncManager !== 'undefined') {
                    syncResult = await AccountSyncManager.syncDownCloudSave(this.currentUser, this.db);
                }

                // Attach real-time listener immediately
                this.startRealtimeListener(this.currentUser);
                return { success: true, user: this.currentUser, syncResult };
            }
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            alert(`Google Sign-In Error: ${error.message}`);
            return { success: false, error };
        }
    }

    async triggerCloudSync(saveData) {
        return this.saveToCloud(saveData);
    }

    async saveToCloud(saveData = {}) {
        if (!this.isInitialized || !this.db) return false;
        if (this.isSyncingFromCloud) {
            return false;
        }
        const uid = this.getEffectivePlayerUid();
        const email = this.getEffectivePlayerEmail();
        const user = { uid, email };
        if (!user.uid) return false;

        this._pendingCloudSaves = (this._pendingCloudSaves || 0) + 1;
        try {
            const userDocRef = this.db.collection('players').doc(user.uid);
            this.lastLocalSaveTimestamp = Date.now();

            const fTag = (typeof PlayerIdentity !== 'undefined') ? PlayerIdentity.getOnlineTag(user.uid) : '#HERO00';
            const fTagClean = (typeof PlayerIdentity !== 'undefined') ? PlayerIdentity.normalizeTag(fTag) : 'HERO00';
            let payload;
            if (typeof SaveSerializer !== 'undefined' && typeof SaveSerializer.buildCloudPayload === 'function') {
                payload = SaveSerializer.buildCloudPayload(saveData, user, { friendTag: fTag, friendTagClean: fTagClean });
            } else {
                const rawInput = (saveData && typeof saveData === 'object') ? saveData : {};
                const gsP = (typeof window !== 'undefined' && window.GameState && window.GameState.player) ? window.GameState.player : {};
                const p = rawInput.player || rawInput;
                const pCoins = p.coins !== undefined ? p.coins : (gsP.coins ?? (parseInt(localStorage.getItem('lesaio_coins') || '0', 10) || 0));
                const pGems = p.gems !== undefined ? p.gems : (p.diamonds !== undefined ? p.diamonds : (gsP.gems ?? (parseInt(localStorage.getItem('lesaio_gems') || '0', 10) || 0)));
                const pLevel = p.accountLevel !== undefined ? p.accountLevel : ((rawInput.itemId === undefined && p.level !== undefined) ? p.level : (gsP.accountLevel ?? 1));
                const pXp = p.accountXp !== undefined ? p.accountXp : (p.xp !== undefined ? p.xp : (gsP.accountXp ?? 0));
                const pSkills = p.skillLevels || gsP.skillLevels || { blade_rush: 1, nerobalonaki: 1 };
                const pName = p.name || p.playerName || gsP.name || localStorage.getItem('lesaio_player_name') || 'Psanas';
                payload = {
                    ...rawInput, playerName: pName, playerNameLower: pName.toLowerCase(), friendTag: fTag, friendTagClean: fTagClean,
                    coins: pCoins, gold: pCoins, gems: pGems, diamonds: pGems, level: pLevel, xp: pXp, skillLevels: pSkills,
                    player: { ...gsP, ...(rawInput.player || {}), coins: pCoins, gold: pCoins, gems: pGems, diamonds: pGems, accountLevel: pLevel, accountXp: pXp, skillLevels: pSkills },
                    email: user.email || 'gamedevsixseven@gmail.com'
                };
            }

            this.lastSavedGems = payload.gems;
            this.lastSavedCoins = payload.coins;
            this.lastKnownRootGems = payload.gems;
            this.lastKnownRootCoins = payload.coins;

            await userDocRef.set({
                ...payload,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            return true;
        } catch (error) {
            console.error('Cloud Save Error:', error);
            if (error.code === 'permission-denied') {
                alert('⚠️ Firestore Rules Notice: Please enable test mode in Firestore Database rules in Firebase Console!');
            }
            return false;
        } finally {
            this._pendingCloudSaves = Math.max(0, (this._pendingCloudSaves || 1) - 1);
        }
    }

    async loadFromCloud() {
        if (!this.isInitialized || !this.db) return null;
        const user = this.currentUser || (this.auth ? this.auth.currentUser : null);
        if (!user) return null;

        try {
            const userDocRef = this.db.collection('players').doc(user.uid);
            const doc = await userDocRef.get();

            if (doc.exists) {
                const data = doc.data();
                this.applyCloudData(data);
                return data;
            } else {
                // First time linking -> upload current local progress to cloud
                const localCoins = parseInt(localStorage.getItem('lesaio_coins')) || 1500;
                const localGems = parseInt(localStorage.getItem('lesaio_gems')) || 50;
                const initialData = {
                    coins: localCoins,
                    gems: localGems,
                    playerName: localStorage.getItem('lesaio_player_name') || 'Psanas',
                    level: localStorage.getItem('lesaio_account_level') || localStorage.getItem('lesaio_player_level') || '1',
                    unlockedHeroes: localStorage.getItem('lesaio_unlocked_heroes') || '["psanas"]',
                    highScore: localStorage.getItem('lesaio_highscore') || localStorage.getItem('lesaio_high_score') || '0',
                    maxWave: localStorage.getItem('lesaio_max_wave') || '1'
                };
                await this.saveToCloud(initialData);
                return initialData;
            }
        } catch (error) {
            console.error('Cloud Load Error:', error);
            return null;
        }
    }

    _reconcileDoc(fields) {
        if (!this.db) return;
        const uid = this.getEffectivePlayerUid();
        if (uid) {
            this.db.collection('players').doc(uid).update(fields).catch(() => {});
        }
    }

    applyCloudData(data) {
        if (!data) return;
        if ((this._pendingCloudSaves || 0) > 0 && Date.now() - (this.lastLocalSaveTimestamp || 0) < 4000) {
            return;
        }
        this.lastCloudData = data;
        const isInitialSync = !this.hasCompletedInitialSync;
        this.hasCompletedInitialSync = true;
        this.isSyncingFromCloud = true;
        let changed = false;
        try {

        // 1. Live Gems / Diamonds Sync
        const curGems = (window.GameState && typeof window.GameState.player.gems === 'number')
            ? window.GameState.player.gems
            : parseInt(localStorage.getItem('lesaio_gems') || '0', 10);

        const rawDiamonds = data.diamonds !== undefined ? data.diamonds : (data.player && data.player.diamonds !== undefined ? data.player.diamonds : undefined);
        const rawGems = data.gems !== undefined ? data.gems : (data.player && data.player.gems !== undefined ? data.player.gems : undefined);

        const numDiamonds = rawDiamonds !== undefined ? parseInt(rawDiamonds, 10) : undefined;
        const numGems = rawGems !== undefined ? parseInt(rawGems, 10) : undefined;

        let incomingGems = undefined;
        if (this.lastSeenDiamonds === undefined && this.lastSeenGems === undefined) {
            // First time loading from Firestore
            if (numDiamonds !== undefined && !isNaN(numDiamonds)) {
                incomingGems = numDiamonds;
            } else if (numGems !== undefined && !isNaN(numGems)) {
                incomingGems = numGems;
            }
        } else {
            // Subsequent live snapshots: ONLY update gems if diamonds or gems specifically changed in the cloud!
            const diamondsChanged = (numDiamonds !== undefined && !isNaN(numDiamonds) && numDiamonds !== this.lastSeenDiamonds);
            const gemsChanged = (numGems !== undefined && !isNaN(numGems) && numGems !== this.lastSeenGems);

            if (diamondsChanged) {
                incomingGems = numDiamonds;
            } else if (gemsChanged) {
                incomingGems = numGems;
            }
        }

        if (numDiamonds !== undefined && !isNaN(numDiamonds)) this.lastSeenDiamonds = numDiamonds;
        if (numGems !== undefined && !isNaN(numGems)) this.lastSeenGems = numGems;

        if (incomingGems !== undefined && !isNaN(incomingGems) && incomingGems !== curGems) {
            localStorage.setItem('lesaio_gems', incomingGems.toString());

            if (window.GameState) {
                window.GameState.player.gems = incomingGems;
            }

            // Immediately set text on screen so background tabs or suspended animations never stall it
            const gemEl = document.getElementById('menu-gem-text');
            if (gemEl) {
                gemEl.textContent = incomingGems.toLocaleString();
            }

            const renameGemsEl = document.getElementById('rename-current-gems');
            if (renameGemsEl) {
                renameGemsEl.textContent = `Your Gems: 💎 ${incomingGems.toLocaleString()}`;
            }

            const gemPill = document.querySelector('.gem-pill');
            if (gemPill) {
                gemPill.style.animation = 'none';
                void gemPill.offsetWidth;
                gemPill.style.animation = 'pillDonePop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            }

            if (window.EventBus) {
                window.EventBus.emit('currencyChanged', {
                    coins: (window.GameState && window.GameState.player.coins) || 0,
                    gems: incomingGems,
                    coinsDelta: 0,
                    gemsDelta: incomingGems - curGems,
                    oldCoins: (window.GameState && window.GameState.player.coins) || 0,
                    oldGems: curGems
                });
            }

            this.lastSeenDiamonds = incomingGems;
            this.lastSeenGems = incomingGems;
            this.lastSavedGems = incomingGems;
            changed = true;

            // Reconcile diamonds & gems in Firestore
            this._reconcileDoc({ diamonds: incomingGems, gems: incomingGems, 'player.gems': incomingGems, 'player.diamonds': incomingGems });
        }

        // 2. Live Coins / Gold Sync
        const curCoins = (window.GameState && typeof window.GameState.player.coins === 'number')
            ? window.GameState.player.coins
            : parseInt(localStorage.getItem('lesaio_coins') || '0', 10);

        const rawGold = data.gold !== undefined ? data.gold : (data.player && data.player.gold !== undefined ? data.player.gold : undefined);
        const rawCoins = data.coins !== undefined ? data.coins : (data.player && data.player.coins !== undefined ? data.player.coins : undefined);

        const numGold = rawGold !== undefined ? parseInt(rawGold, 10) : undefined;
        const numCoins = rawCoins !== undefined ? parseInt(rawCoins, 10) : undefined;

        let incomingCoins = undefined;
        if (this.lastSeenCoins === undefined && this.lastSeenGold === undefined) {
            if (numCoins !== undefined && !isNaN(numCoins)) incomingCoins = numCoins;
            else if (numGold !== undefined && !isNaN(numGold)) incomingCoins = numGold;
        } else {
            const coinsChanged = (numCoins !== undefined && !isNaN(numCoins) && numCoins !== this.lastSeenCoins);
            const goldChanged = (numGold !== undefined && !isNaN(numGold) && numGold !== this.lastSeenGold);
            if (coinsChanged) incomingCoins = numCoins;
            else if (goldChanged) incomingCoins = numGold;
        }

        if (numCoins !== undefined && !isNaN(numCoins)) this.lastSeenCoins = numCoins;
        if (numGold !== undefined && !isNaN(numGold)) this.lastSeenGold = numGold;

        if (incomingCoins !== undefined && !isNaN(incomingCoins) && incomingCoins !== curCoins) {
            localStorage.setItem('lesaio_coins', incomingCoins.toString());

            if (window.GameState) window.GameState.player.coins = incomingCoins;

            const coinEl = document.getElementById('menu-coin-text');
            if (coinEl) coinEl.textContent = incomingCoins.toLocaleString();

            const coinPill = document.querySelector('.coin-pill');
            if (coinPill) {
                coinPill.style.animation = 'none';
                void coinPill.offsetWidth;
                coinPill.style.animation = 'pillDonePop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            }

            if (window.EventBus) {
                window.EventBus.emit('currencyChanged', {
                    coins: incomingCoins,
                    gems: (window.GameState && window.GameState.player.gems) || 0,
                    coinsDelta: incomingCoins - curCoins,
                    gemsDelta: 0,
                    oldCoins: curCoins,
                    oldGems: (window.GameState && window.GameState.player.gems) || 0
                });
            }

            this.lastSeenCoins = incomingCoins;
            this.lastSeenGold = incomingCoins;
            this.lastSavedCoins = incomingCoins;
            changed = true;

            // Reconcile coins & gold in Firestore
            this._reconcileDoc({ coins: incomingCoins, gold: incomingCoins, 'player.coins': incomingCoins, 'player.gold': incomingCoins });
        }

        // 3. Live Player / Account Level Sync
        const curLevel = (window.GameState && typeof window.GameState.player.accountLevel === 'number')
            ? window.GameState.player.accountLevel
            : parseInt(localStorage.getItem('lesaio_account_level') || '1', 10);

        const rawLevel = data.level !== undefined ? data.level : (data.accountLevel !== undefined ? data.accountLevel : (data.player && (data.player.accountLevel !== undefined ? data.player.accountLevel : data.player.level)));
        const numLevel = rawLevel !== undefined ? parseInt(rawLevel, 10) : undefined;

        let incomingLevel = undefined;
        if (this.lastSeenLevel === undefined) {
            if (numLevel !== undefined && !isNaN(numLevel)) incomingLevel = numLevel;
        } else {
            const levelChanged = (numLevel !== undefined && !isNaN(numLevel) && numLevel !== this.lastSeenLevel);
            if (levelChanged) incomingLevel = numLevel;
        }

        if (numLevel !== undefined && !isNaN(numLevel)) this.lastSeenLevel = numLevel;

        if (incomingLevel !== undefined && !isNaN(incomingLevel) && incomingLevel !== curLevel) {
            if (window.GameState && typeof window.GameState.setAccountLevel === 'function') {
                window.GameState.setAccountLevel(incomingLevel, undefined);
            } else {
                localStorage.setItem('lesaio_account_level', incomingLevel.toString());
                if (window.GameState) window.GameState.player.accountLevel = incomingLevel;
            }

            const lvlEl = document.getElementById('player-profile-level');
            if (lvlEl) lvlEl.textContent = incomingLevel;
            const modalLvl = document.getElementById('prof-modal-level-badge');
            if (modalLvl) modalLvl.textContent = `LVL ${incomingLevel}`;
            const hudLvl = document.getElementById('level-badge-text');
            if (hudLvl) hudLvl.textContent = `LVL ${incomingLevel}`;

            if (window.uiController && window.uiController.profileManager) {
                window.uiController.profileManager.updateProfileUI();
            }

            this.lastSeenLevel = incomingLevel;
            changed = true;
            this._reconcileDoc({ level: incomingLevel, accountLevel: incomingLevel, 'player.accountLevel': incomingLevel });
        }

        // 4. Live Account XP Sync
        const curXp = (window.GameState && typeof window.GameState.player.accountXp === 'number')
            ? window.GameState.player.accountXp
            : parseInt(localStorage.getItem('lesaio_account_xp') || '0', 10);

        const rawXp = data.xp !== undefined ? data.xp : (data.accountXp !== undefined ? data.accountXp : (data.player && (data.player.accountXp !== undefined ? data.player.accountXp : data.player.xp)));
        const numXp = rawXp !== undefined ? parseInt(rawXp, 10) : undefined;

        let incomingXp = undefined;
        if (this.lastSeenXp === undefined) {
            if (numXp !== undefined && !isNaN(numXp)) incomingXp = numXp;
        } else {
            const xpChanged = (numXp !== undefined && !isNaN(numXp) && numXp !== this.lastSeenXp);
            if (xpChanged) incomingXp = numXp;
        }

        if (numXp !== undefined && !isNaN(numXp)) this.lastSeenXp = numXp;

        if (incomingXp !== undefined && !isNaN(incomingXp) && incomingXp !== curXp) {
            if (window.GameState && typeof window.GameState.setAccountLevel === 'function') {
                window.GameState.setAccountLevel(undefined, incomingXp);
            } else {
                localStorage.setItem('lesaio_account_xp', incomingXp.toString());
                if (window.GameState) window.GameState.player.accountXp = incomingXp;
            }

            if (window.uiController && window.uiController.profileManager) {
                window.uiController.profileManager.updateProfileUI();
            }

            this.lastSeenXp = incomingXp;
            changed = true;
            this._reconcileDoc({ xp: incomingXp, accountXp: incomingXp, 'player.accountXp': incomingXp });
        }

        // 5. Live Skill Levels Sync
        const rawSkills = (data.player && data.player.skillLevels) ? data.player.skillLevels : data.skillLevels;
        if (rawSkills && typeof rawSkills === 'object') {
            const parsedSkills = {};
            for (const [k, v] of Object.entries(rawSkills)) {
                parsedSkills[k] = parseInt(v, 10) || 1;
            }

            const strSkills = JSON.stringify(parsedSkills);
            let skillsChanged = false;
            if (this.lastSeenSkillLevels === undefined || this.lastSeenSkillLevels !== strSkills) {
                skillsChanged = true;
            }

            if (skillsChanged) {
                this.lastSeenSkillLevels = strSkills;
                localStorage.setItem('lesaio_skill_levels', strSkills);

                if (window.GameState && typeof window.GameState.setSkillLevels === 'function') {
                    window.GameState.setSkillLevels(parsedSkills);
                } else if (window.GameState && window.GameState.player) {
                    window.GameState.player.skillLevels = parsedSkills;
                }

                if (window.uiController && window.uiController.skillManager) {
                    window.uiController.skillManager.skillLevels = parsedSkills;
                    window.uiController.skillManager.renderSkillCards();
                    window.uiController.skillManager.updateHUDIcon();
                }

                changed = true;
                this._reconcileDoc({ skillLevels: parsedSkills, 'player.skillLevels': parsedSkills });
            }
        }
        } finally {
            this.isSyncingFromCloud = false;
        }

        // Real-time Developer Mail Inbox Delivery (Explicit mail objects only)
        if (data.mail && typeof data.mail === 'object' && data.mail.title) {
            if (window.uiController && window.uiController.mailManager) {
                window.uiController.mailManager.addOrUpdateFirebaseMail(data.mail, isInitialSync);
            }
        }

        // Real-time Daily Challenge Reset Trigger from Firebase Console
        if (data.resetQuests || data.resetChallenges) {
            if (window.questManager && typeof window.questManager.resetDailyChallenges === 'function') {
                window.questManager.resetDailyChallenges();
                const user = this.currentUser || (this.auth ? this.auth.currentUser : null);
                if (user && this.db) {
                    this.db.collection('players').doc(user.uid).update({
                        resetQuests: firebase.firestore.FieldValue.delete(),
                        resetChallenges: firebase.firestore.FieldValue.delete()
                    }).catch(() => {});
                }
            }
        }

        if (changed && !isInitialSync && window.soundEngine) {
            window.soundEngine.playPickup('star');
        }
    }

    startRealtimeListener(user) {
        if (!this.db || !user) return;
        this.stopRealtimeListener();

        this.unsubscribes = [];

        // 1. Listen by User UID document
        if (user.uid) {
            try {
                const docRef = this.db.collection('players').doc(user.uid);
                const unsubUid = docRef.onSnapshot((doc) => {
                    if (doc.exists) {
                        this.applyCloudData(doc.data());
                    } else {
                        this.seedNewPlayerDoc(user.uid);
                    }
                }, (err) => console.warn('UID listener warning:', err));
                this.unsubscribes.push(unsubUid);
            } catch (e) {}
        } else if (user.email) {
            // 2. Fallback: Listen by Email if UID is not present
            try {
                const unsubEmail = this.db.collection('players').doc(user.email).onSnapshot((doc) => {
                    if (doc.exists) this.applyCloudData(doc.data());
                }, () => {});
                this.unsubscribes.push(unsubEmail);

                const unsubQuery = this.db.collection('players').where('email', '==', user.email).onSnapshot((snapshot) => {
                    snapshot.forEach(doc => {
                        if (doc.exists) this.applyCloudData(doc.data());
                    });
                }, () => {});
                this.unsubscribes.push(unsubQuery);
            } catch (e) {}
        }
    }

    stopRealtimeListener() {
        if (this.unsubscribes && Array.isArray(this.unsubscribes)) {
            this.unsubscribes.forEach(unsub => {
                if (typeof unsub === 'function') unsub();
            });
            this.unsubscribes = [];
        }
    }

    async signOut() {
        this.stopRealtimeListener();
        if (this.auth && this.isInitialized) {
            await this.auth.signOut();
        }
        this.currentUser = null;
        if (window.friendService) window.friendService.onAuthChanged();
    }
}

// Global Cloud Instance
window.cloudSave = new CloudSaveService();
