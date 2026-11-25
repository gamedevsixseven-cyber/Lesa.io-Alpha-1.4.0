/**
 * Lesa.io - Firebase Cloud Save & Google Authentication Engine
 * Handles Google OAuth Sign-In and Cloud Firestore persistence
 */

// Live Firebase Config for Lesa.io
const firebaseConfig = {
    apiKey: "AIzaSyDetPvSSZ4MlO_-5OD1XivtSK23xSK4TqA",
    authDomain: "lesaio.firebaseapp.com",
    databaseURL: "https://lesaio-default-rtdb.europe-west1.firebasedatabase.app",
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
        this.rtdb = null;
        this.currentUser = null;
        this.hasCompletedInitialSync = false;
        this.isHydratingAuth = false;
        this.hasUnflushedLocalMutation = false;
        this.lastLocalMutationDirtyAt = 0;
        this._localMutationVersion = 0;
        this._activeListenerUid = null;
        this._cloudSyncCooldownMs = 120000;
        this._lastCloudSyncAt = 0;
        this._cloudSyncTimer = null;
        this._pendingCloudSyncData = null;

        this.init();
    }

    markLocalMutationDirty() {
        this._localMutationVersion = (this._localMutationVersion || 0) + 1;
        this.hasUnflushedLocalMutation = true;
        this.lastLocalMutationDirtyAt = Date.now();
    }

    init() {
        if (typeof firebase === 'undefined') return;

        try {
            if (!firebase.apps.length) {
                if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
                    firebase.initializeApp(firebaseConfig);
                    this.auth = firebase.auth();
                    this.db = firebase.firestore();
                    this.rtdb = (typeof firebase.database === 'function') ? firebase.database() : null;
                    this.isInitialized = true;
                    if (typeof window !== 'undefined' && !this._flushBound) {
                        this._flushBound = true;
                        window.addEventListener('pagehide', () => this.flushPendingCloudSync());
                        if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') this.flushPendingCloudSync(); else if (typeof DevGiftTransport !== 'undefined') DevGiftTransport.pullRemotePendingGifts(this, false); });
                    }

                    // Start live listener for distinct device or authenticated player
                    const uid = this.getEffectivePlayerUid();
                    const email = this.getEffectivePlayerEmail();
                    if (uid) {
                        this.startRealtimeListener({ uid, email });
                    }

                    // Listen for real-time auth state changes
                    this.auth.onAuthStateChanged((user) => {
                        if (user) {
                            const switchedUid = !this._activeListenerUid || this._activeListenerUid !== user.uid;
                            this.currentUser = user;
                            if (switchedUid && !this.isHydratingAuth) {
                                this.hasCompletedInitialSync = false;
                                this.lastCloudData = null;
                                this.lastSeenCoins = this.lastSeenGold = this.lastSeenDiamonds = this.lastSeenGems = undefined;
                                this.lastSeenLevel = this.lastSeenXp = this.lastSeenSkillLevels = undefined;
                            }
                            localStorage.setItem('lesaio_google_linked', 'true');
                            localStorage.setItem('lesaio_google_uid', user.uid);
                            localStorage.setItem('lesaio_google_email', user.email || '');
                            localStorage.setItem('lesaio_google_name', user.displayName || (user.email ? user.email.split('@')[0] : 'Google User'));
                            this.startRealtimeListener(user);
                        }
                        if (window.uiController && window.uiController.settingsManager) {
                            window.uiController.settingsManager.updateCloudUI();
                        }
                        if (window.friendService) window.friendService.onAuthChanged();
                        if (window.clanService) window.clanService.onAuthChanged();
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

        this.isHydratingAuth = true;
        this.hasCompletedInitialSync = false;
        this.lastCloudData = null;
        this.lastSeenCoins = this.lastSeenGold = this.lastSeenDiamonds = this.lastSeenGems = undefined;
        this.lastSeenLevel = this.lastSeenXp = this.lastSeenSkillLevels = undefined;
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');
            
            const result = await this.auth.signInWithPopup(provider);
            this.currentUser = result.user;

            if (this.currentUser) {
                localStorage.setItem('lesaio_google_linked', 'true');
                localStorage.setItem('lesaio_google_uid', this.currentUser.uid);
                localStorage.setItem('lesaio_google_email', this.currentUser.email || '');
                localStorage.setItem('lesaio_google_name', this.currentUser.displayName || (this.currentUser.email ? this.currentUser.email.split('@')[0] : 'Google User'));
                
                let syncResult = null;
                if (typeof AccountSyncManager !== 'undefined') {
                    syncResult = await AccountSyncManager.syncDownCloudSave(this.currentUser, this.db);
                }

                this.isHydratingAuth = false;
                this.startRealtimeListener(this.currentUser);
                return { success: true, user: this.currentUser, syncResult };
            }
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            alert(`Google Sign-In Error: ${error.message}`);
            return { success: false, error };
        } finally {
            this.isHydratingAuth = false;
        }
    }

    _clearPendingCloudSync() {
        if (this._cloudSyncTimer) { clearTimeout(this._cloudSyncTimer); this._cloudSyncTimer = null; }
        this._pendingCloudSyncData = null;
    }

    flushPendingCloudSync() {
        if (!this._pendingCloudSyncData || this.isHydratingAuth || this.isSyncingFromCloud) return false;
        if (typeof window !== 'undefined' && window._lesaioSuppressUnloadSave) return false;
        const payload = this._pendingCloudSyncData;
        this._clearPendingCloudSync();
        return this.saveToCloud(payload);
    }

    async triggerCloudSync(saveData) {
        const elapsed = Date.now() - (this._lastCloudSyncAt || 0);
        if (elapsed >= this._cloudSyncCooldownMs) {
            this._clearPendingCloudSync();
            return this.saveToCloud(saveData);
        }
        this._pendingCloudSyncData = saveData;
        if (!this._cloudSyncTimer) {
            this._cloudSyncTimer = setTimeout(() => this.flushPendingCloudSync(), Math.max(1000, this._cloudSyncCooldownMs - elapsed));
        }
        return true;
    }

    async saveToCloud(saveData = {}) {
        this._clearPendingCloudSync();
        this._lastCloudSyncAt = Date.now();
        if (!this.isInitialized || !this.db) return false;
        if (this.isSyncingFromCloud || this.isHydratingAuth) {
            return false;
        }
        const uid = this.getEffectivePlayerUid();
        const email = this.getEffectivePlayerEmail();
        const user = { uid, email };
        if (!user.uid) return false;

        this._pendingCloudSaves = (this._pendingCloudSaves || 0) + 1;
        const saveVer = this._localMutationVersion || 0;
        try {
            const edge = (typeof window !== 'undefined' && window.edgeApi && window.edgeApi.isEnabled()) ? window.edgeApi : null;
            const userDocRef = this.db.collection('players').doc(user.uid);
            if (!this.hasCompletedInitialSync) {
                let preData = null;
                if (edge) {
                    const er = await edge.get(`/player/${encodeURIComponent(user.uid)}`).catch(() => null);
                    if (er && er.ok && er.doc) preData = er.doc;
                }
                if (!preData) {
                    const preSnap = await userDocRef.get().catch(() => null);
                    if (preSnap && preSnap.exists) preData = preSnap.data();
                }
                this.hasCompletedInitialSync = true;
                if (preData) {
                    if (!this.lastCloudData) this.lastCloudData = preData;
                    this.applyCloudData(preData);
                }
            }
            this.lastLocalSaveTimestamp = Date.now();

            const fTag = (typeof PlayerIdentity !== 'undefined') ? PlayerIdentity.getOnlineTag(user.uid) : '#HERO00';
            const fTagClean = (typeof PlayerIdentity !== 'undefined') ? PlayerIdentity.normalizeTag(fTag) : 'HERO00';
            const rawIn = (saveData && typeof saveData === 'object') ? saveData : {};
            const payload = (typeof SaveSerializer !== 'undefined' && typeof SaveSerializer.buildCloudPayload === 'function')
                ? SaveSerializer.buildCloudPayload(rawIn, user, { friendTag: fTag, friendTagClean: fTagClean }, this.lastCloudData)
                : { ...rawIn, friendTag: fTag, friendTagClean: fTagClean, ...(user.email ? { email: user.email } : {}) };

            this.lastSavedGems = payload.gems; this.lastSavedCoins = payload.coins;
            this.lastKnownRootGems = payload.gems; this.lastKnownRootCoins = payload.coins;
            this.lastCloudData = payload;

            let savedToEdge = false;
            if (edge) {
                const putRes = await edge.post(`/player/${encodeURIComponent(user.uid)}`, { ...payload, lastUpdated: Date.now() }).catch(() => null);
                if (putRes && putRes.ok) savedToEdge = true;
            }
            if (!savedToEdge) {
                const writePayload = { ...payload, lastUpdated: firebase.firestore.FieldValue.serverTimestamp() };
                try { await userDocRef.set(writePayload, { merge: true }); } catch (writeErr) {
                    if (writeErr && writeErr.code === 'permission-denied') {
                        const { uid: _u, email: _e, isAdmin: _a, wipedByDevAt: _w, ...safePayload } = writePayload;
                        await userDocRef.set(safePayload, { merge: true });
                    } else throw writeErr;
                }
            }

            if ((this._localMutationVersion || 0) === saveVer) {
                this.hasUnflushedLocalMutation = false;
            }
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
            const edge = (typeof window !== 'undefined' && window.edgeApi && window.edgeApi.isEnabled()) ? window.edgeApi : null;
            if (edge) {
                const er = await edge.get(`/player/${encodeURIComponent(user.uid)}`).catch(() => null);
                if (er && er.ok && er.doc) { this.applyCloudData(er.doc); return er.doc; }
            }
            const doc = await this.db.collection('players').doc(user.uid).get();
            if (doc.exists) { const data = doc.data(); this.applyCloudData(data); return data; }
            const initialData = {
                coins: parseInt(localStorage.getItem('lesaio_coins')) || 1500, gems: parseInt(localStorage.getItem('lesaio_gems')) || 50,
                playerName: localStorage.getItem('lesaio_player_name') || 'Psanas',
                level: localStorage.getItem('lesaio_account_level') || localStorage.getItem('lesaio_player_level') || '1',
                unlockedHeroes: localStorage.getItem('lesaio_unlocked_heroes') || '["psanas"]',
                highScore: localStorage.getItem('lesaio_highscore') || localStorage.getItem('lesaio_high_score') || '0',
                maxWave: localStorage.getItem('lesaio_max_wave') || '1'
            };
            await this.saveToCloud(initialData);
            return initialData;
        } catch (error) { console.error('Cloud Load Error:', error); return null; }
    }

    _reconcileDoc(fields) {
        const uid = this.getEffectivePlayerUid();
        if (!uid) return;
        const edge = (typeof window !== 'undefined' && window.edgeApi && window.edgeApi.isEnabled()) ? window.edgeApi : null;
        if (edge) {
            edge.post(`/player/${encodeURIComponent(uid)}`, fields).then((r) => {
                if (r && r.fallback && this.db) this.db.collection('players').doc(uid).update(fields).catch(() => {});
            }).catch(() => {});
            return;
        }
        if (this.db) this.db.collection('players').doc(uid).update(fields).catch(() => {});
    }

    _animatePill(selector) {
        const pill = document.querySelector(selector);
        if (!pill) return;
        pill.style.animation = 'none';
        void pill.offsetWidth;
        pill.style.animation = 'pillDonePop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }

    _emitCloudCurrency(coins, gems, coinsDelta, gemsDelta) {
        if (window.EventBus) {
            window.EventBus.emit('currencyChanged', {
                coins, gems, coinsDelta, gemsDelta,
                oldCoins: coins - coinsDelta, oldGems: gems - gemsDelta
            });
        }
    }

    _pickIncomingCurrency(primaryNum, aliasNum, lastPrimary, lastAlias, curVal, preferLocal) {
        if (preferLocal) return { incoming: undefined, seenPrimary: curVal, seenAlias: curVal };
        const hasP = primaryNum !== undefined && !isNaN(primaryNum);
        const hasA = aliasNum !== undefined && !isNaN(aliasNum);
        let incoming;
        if (lastPrimary === undefined && lastAlias === undefined) {
            if (hasP && hasA && primaryNum !== aliasNum) incoming = Math.max(primaryNum, aliasNum);
            else if (hasP) incoming = primaryNum;
            else if (hasA) incoming = aliasNum;
        } else {
            const pChanged = hasP && primaryNum !== lastPrimary;
            const aChanged = hasA && aliasNum !== lastAlias;
            if (pChanged && aChanged) incoming = primaryNum;
            else if (pChanged) incoming = primaryNum;
            else if (aChanged && (!hasP || primaryNum === lastPrimary)) incoming = aliasNum;
        }
        return {
            incoming,
            seenPrimary: hasP ? primaryNum : lastPrimary,
            seenAlias: hasA ? aliasNum : lastAlias
        };
    }

    _syncCloudCurrency(kind, data, pData, preferLocal) {
        const isGems = kind === 'gems';
        const lsKey = isGems ? 'lesaio_gems' : 'lesaio_coins';
        const seenKeyP = isGems ? 'lastSeenGems' : 'lastSeenCoins';
        const seenKeyA = isGems ? 'lastSeenDiamonds' : 'lastSeenGold';
        const aliasKey = isGems ? 'diamonds' : 'gold';
        const curVal = (window.GameState && typeof window.GameState.player[kind] === 'number')
            ? window.GameState.player[kind] : parseInt(localStorage.getItem(lsKey) || '0', 10);
        const readInt = (k) => {
            const raw = data[k] !== undefined ? data[k] : (pData && pData[k] !== undefined ? pData[k] : undefined);
            return raw !== undefined ? parseInt(raw, 10) : undefined;
        };
        const res = this._pickIncomingCurrency(readInt(kind), readInt(aliasKey), this[seenKeyP], this[seenKeyA], curVal, preferLocal);
        this[seenKeyP] = res.seenPrimary;
        this[seenKeyA] = res.seenAlias;
        if (res.incoming === undefined || isNaN(res.incoming) || res.incoming === curVal) return false;

        const nextVal = Math.max(0, res.incoming);
        localStorage.setItem(lsKey, nextVal.toString());
        if (window.GameState) window.GameState.player[kind] = nextVal;
        const el = document.getElementById(isGems ? 'menu-gem-text' : 'menu-coin-text');
        if (el) el.textContent = nextVal.toLocaleString();
        if (isGems) {
            const renEl = document.getElementById('rename-current-gems');
            if (renEl) renEl.textContent = `Your Gems: 💎 ${nextVal.toLocaleString()}`;
        }
        this._animatePill(isGems ? '.gem-pill' : '.coin-pill');
        const gsP = window.GameState && window.GameState.player;
        this._emitCloudCurrency(isGems ? (gsP && gsP.coins) || 0 : nextVal, isGems ? nextVal : (gsP && gsP.gems) || 0, isGems ? 0 : nextVal - curVal, isGems ? nextVal - curVal : 0);
        this[seenKeyP] = this[seenKeyA] = nextVal;
        if (isGems) this.lastSavedGems = nextVal; else this.lastSavedCoins = nextVal;
        this._reconcileDoc({ [kind]: nextVal, [aliasKey]: nextVal, [`player.${kind}`]: nextVal, [`player.${aliasKey}`]: nextVal });
        return true;
    }

    applyCloudData(data) {
        if (!data) return;
        const now = Date.now();
        const hasPendingDebounce = !!(typeof window !== 'undefined' && window.SaveManager && window.SaveManager.saveDebounceTimer);
        if (hasPendingDebounce || this.hasUnflushedLocalMutation || ((this._pendingCloudSaves || 0) > 0 && now - (this.lastLocalSaveTimestamp || 0) < 4000) || (now - (this.lastLocalMutationDirtyAt || 0) < 4000)) {
            this.lastCloudData = data;
            this.hasCompletedInitialSync = true;
            if (Array.isArray(data.devGifts) && data.devGifts.length > 0 && typeof DevGiftManager !== 'undefined') {
                DevGiftManager.scheduleClaimRetry(data, this);
            }
            return;
        }
        this.lastCloudData = data;
        const isInitialSync = !this.hasCompletedInitialSync;
        this.hasCompletedInitialSync = true;
        this.isSyncingFromCloud = true;
        let changed = false;
        let _preferLocal = false;
        try {
        if (typeof SaveMigration !== 'undefined') {
            _preferLocal = !!SaveMigration.reconcileCloudSnapshot(data, window.GameState, isInitialSync).preferLocalCurrencies;
        }

        const pObj = data.player && typeof data.player === 'object' ? data.player : null;
        if (this._syncCloudCurrency('gems', data, pObj, _preferLocal)) changed = true;
        if (this._syncCloudCurrency('coins', data, pObj, _preferLocal)) changed = true;

        // 3. Live Player / Account Level Sync
        const curLevel = (window.GameState && typeof window.GameState.player.accountLevel === 'number')
            ? window.GameState.player.accountLevel
            : parseInt(localStorage.getItem('lesaio_account_level') || '1', 10);

        const wiped = (typeof SaveMigration !== 'undefined') && SaveMigration.wasWipedByDev(data, 0);
        const lvlNums = [data.level, data.accountLevel, pObj && pObj.accountLevel, pObj && pObj.level]
            .map(v => parseInt(v, 10)).filter(n => Number.isFinite(n) && n >= 1);
        const numLevel = lvlNums.length ? (wiped ? (parseInt(data.level ?? 1, 10) || 1) : Math.max(...lvlNums)) : undefined;

        let incomingLevel = undefined;
        if (_preferLocal) {
            if (!isNaN(curLevel)) this.lastSeenLevel = curLevel;
        } else if (this.lastSeenLevel === undefined) {
            if (numLevel !== undefined && !isNaN(numLevel)) {
                incomingLevel = (!wiped && isInitialSync && typeof SaveMigration !== 'undefined' && SaveMigration.hasEstablishedProgress()) ? Math.max(curLevel, numLevel) : numLevel;
            }
        } else {
            const levelChanged = (numLevel !== undefined && !isNaN(numLevel) && numLevel !== this.lastSeenLevel);
            if (levelChanged && (wiped || numLevel >= curLevel)) incomingLevel = numLevel;
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

        const xpNums = [data.xp, data.accountXp, pObj && pObj.accountXp, pObj && pObj.xp]
            .map(v => parseInt(v, 10)).filter(n => Number.isFinite(n) && n >= 0);
        const numXp = xpNums.length ? (wiped ? (parseInt(data.xp ?? 0, 10) || 0) : Math.max(...xpNums)) : undefined;

        let incomingXp = undefined;
        if (_preferLocal) {
            if (!isNaN(curXp)) this.lastSeenXp = curXp;
        } else if (this.lastSeenXp === undefined) {
            if (numXp !== undefined && !isNaN(numXp) && (!incomingLevel || incomingLevel >= curLevel)) incomingXp = numXp;
        } else {
            const xpChanged = (numXp !== undefined && !isNaN(numXp) && numXp !== this.lastSeenXp);
            if (xpChanged && (wiped || (numLevel && numLevel > curLevel) || numXp > curXp)) incomingXp = numXp;
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
            const curSkills = (window.GameState && window.GameState.player && window.GameState.player.skillLevels) || {};
            const parsedSkills = {};
            for (const [k, v] of Object.entries(rawSkills)) {
                const n = parseInt(v, 10) || 1;
                parsedSkills[k] = _preferLocal ? Math.max(curSkills[k] || 1, n) : n;
            }
            if (_preferLocal) {
                for (const [k, v] of Object.entries(curSkills)) parsedSkills[k] = Math.max(parsedSkills[k] || 1, parseInt(v, 10) || 1);
            }

            const strSkills = JSON.stringify(parsedSkills);
            if (this.lastSeenSkillLevels === undefined || this.lastSeenSkillLevels !== strSkills) {
                this.lastSeenSkillLevels = strSkills;
                localStorage.setItem('lesaio_skill_levels', strSkills);
                if (window.GameState && typeof window.GameState.setSkillLevels === 'function') window.GameState.setSkillLevels(parsedSkills);
                else if (window.GameState && window.GameState.player) window.GameState.player.skillLevels = parsedSkills;
                if (window.uiController && window.uiController.skillManager) {
                    window.uiController.skillManager.skillLevels = parsedSkills;
                    window.uiController.skillManager.renderSkillCards();
                    window.uiController.skillManager.updateHUDIcon();
                }
                changed = true;
                this._reconcileDoc({ skillLevels: parsedSkills, 'player.skillLevels': parsedSkills });
            }
        }
        } finally { this.isSyncingFromCloud = false; }
        if (changed && window.SaveManager && typeof window.SaveManager.saveLocalOnly === 'function') window.SaveManager.saveLocalOnly();
        if (_preferLocal && window.SaveSerializer && window.GameState) {
            const p = window.SaveSerializer.serialize(window.GameState);
            if (p) setTimeout(() => this.saveToCloud(p), 400);
        } else if (isInitialSync && window.GameState && window.GameState.player && window.SaveSerializer) {
            const localName = (typeof localStorage !== 'undefined' && localStorage.getItem('lesaio_player_name')) || window.GameState.player.name || '';
            const localChosen = typeof localStorage !== 'undefined' && localStorage.getItem('lesaio_player_name_chosen') === 'true';
            const localHigh = (window.GameState.player.stats && Number(window.GameState.player.stats.highScore)) || 0;
            if ((localChosen && localName && localName !== 'Psanas' && localName !== data.playerName) || localHigh > Math.max(Number(data.lbHighScore) || 0, Number(data.highScore) || 0)) {
                const p = window.SaveSerializer.serialize(window.GameState);
                if (p) setTimeout(() => { this.saveToCloud(p); if (window.friendService) window.friendService.syncMyProfile(true); }, 450);
            }
        }
        if (Array.isArray(data.devGifts) && data.devGifts.length > 0 && typeof DevGiftManager !== 'undefined') DevGiftManager.claimPendingGifts(data, this);
        if (typeof DevGiftTransport !== 'undefined') DevGiftTransport.pullRemotePendingGifts(this, false);
        if (data.mail && typeof data.mail === 'object' && data.mail.title && window.uiController && window.uiController.mailManager) window.uiController.mailManager.addOrUpdateFirebaseMail(data.mail, isInitialSync);
        if ((data.resetQuests || data.resetChallenges) && window.questManager && typeof window.questManager.resetDailyChallenges === 'function') {
            window.questManager.resetDailyChallenges();
            const user = this.currentUser || (this.auth ? this.auth.currentUser : null);
            if (user && this.db) this.db.collection('players').doc(user.uid).update({ resetQuests: firebase.firestore.FieldValue.delete(), resetChallenges: firebase.firestore.FieldValue.delete() }).catch(() => {});
        }
        if (changed && !isInitialSync && window.soundEngine) window.soundEngine.playPickup('star');
    }

    startRealtimeListener(user) {
        if (!this.db || !user) return;
        this.stopRealtimeListener();
        this._activeListenerUid = user.uid || user.email || null;
        this.unsubscribes = [];

        if (user.uid === 'RLqBTfjZATZzePCPDyNCrUGCYrs2' && typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) {
            this.db.collection('players').doc('phone_aabwjk_mwrtealt').get().then((s) => {
                if (!s || !s.exists) return;
                const d = s.data() || {};
                const fix = {};
                if ('email' in d) fix.email = firebase.firestore.FieldValue.delete();
                if (!d.playerName || d.playerName === 'Popo') {
                    fix.playerName = 'PsanasIphone';
                    fix.playerNameLower = 'psanasiphone';
                    fix['player.name'] = 'PsanasIphone';
                }
                if (Object.keys(fix).length > 0) s.ref.update(fix).catch(() => {});
            }).catch(() => {});
        }

        if (user.uid) {
            try { const unsubUid = this.db.collection('players').doc(user.uid).onSnapshot((doc) => {
                if (doc.exists) this.applyCloudData(doc.data());
                else if (!(doc.metadata && doc.metadata.fromCache) && !this.isHydratingAuth) { if (!user.email) this.seedNewPlayerDoc(user.uid); this.hasCompletedInitialSync = true; if (typeof DevGiftTransport !== 'undefined') DevGiftTransport.pullRemotePendingGifts(this, true); }
            }, (err) => console.warn('UID listener warning:', err)); this.unsubscribes.push(unsubUid); } catch (e) {}
            if (typeof DevGiftTransport !== 'undefined') DevGiftTransport.pullRemotePendingGifts(this, true);
        } else if (user.email) {
            try {
                this.unsubscribes.push(this.db.collection('players').doc(user.email).onSnapshot((doc) => { if (doc.exists) this.applyCloudData(doc.data()); }, () => {}));
                this.unsubscribes.push(this.db.collection('players').where('email', '==', user.email).onSnapshot((snapshot) => { snapshot.forEach(doc => { if (doc.exists) this.applyCloudData(doc.data()); }); }, () => {}));
            } catch (e) {}
        }
    }
    stopRealtimeListener() {
        if (Array.isArray(this.unsubscribes)) { this.unsubscribes.forEach(u => { if (typeof u === 'function') u(); }); this.unsubscribes = []; }
    }
    async signOut() {
        this.stopRealtimeListener();
        if (this.auth && this.isInitialized) await this.auth.signOut();
        this.currentUser = null;
        if (window.friendService) window.friendService.onAuthChanged();
    }
}
window.cloudSave = new CloudSaveService();
