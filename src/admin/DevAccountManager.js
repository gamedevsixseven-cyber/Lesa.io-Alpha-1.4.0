/**
 * Lesa.io - Primary Developer Account Wipe & Permanent Deletion Engine
 * Restricted exclusively to the primary Developer Firebase Google account.
 * Supports multi-field player lookup, full Lv.1 progress wipe, and complete deletion across
 * Firestore saves, leaderboards (lbHighScore/lbEndlessWave/lbTotalKills), usernames,
 * friendships, friend invites, and local caches.
 */

class DevAccountManager {
    static _requireDev() {
        if (typeof window === 'undefined' || !window.AdminAuth || typeof window.AdminAuth.verifyPrimaryDevAccess !== 'function') {
            throw new Error('AdminAuth unavailable.');
        }
        return window.AdminAuth.verifyPrimaryDevAccess(true);
    }

    static _getDb() {
        if (typeof firebase !== 'undefined' && firebase.firestore) return firebase.firestore();
        if (typeof window !== 'undefined' && window.cloudSave && window.cloudSave.db) return window.cloudSave.db;
        return null;
    }

    static _formatSummary(docId, data = {}) {
        const p = (data.player && typeof data.player === 'object') ? data.player : data;
        const s = (p.stats && typeof p.stats === 'object') ? p.stats : (data.stats || {});
        const social = (data.socialStats && typeof data.socialStats === 'object') ? data.socialStats : {};
        const uid = data.uid || docId;
        const name = p.name || data.playerName || 'Hero';
        return {
            docId,
            uid,
            email: data.email || '',
            name,
            nameLower: String(data.playerNameLower || name || '').trim().toLowerCase(),
            tag: data.friendTag || (typeof PlayerIdentity !== 'undefined' ? PlayerIdentity.getOnlineTag(uid) : '#HERO00'),
            level: parseInt(p.accountLevel ?? data.accountLevel ?? data.level ?? 1, 10) || 1,
            coins: parseInt(p.coins ?? data.coins ?? data.gold ?? 0, 10) || 0,
            gems: parseInt(p.gems ?? data.diamonds ?? data.gems ?? 0, 10) || 0,
            highScore: Math.max(Number(data.lbHighScore) || 0, Number(s.highScore) || 0, Number(social.highScore) || 0, Number(data.highScore) || 0),
            endlessWave: Math.max(Number(data.lbEndlessWave) || 0, Number(social.endlessMaxWave) || 0, Number(s.maxWave) || 0, Number(data.maxWave) || 1),
            totalKills: Math.max(Number(data.lbTotalKills) || 0, Number(s.totalKills) || 0, Number(social.totalKills) || 0),
            isAdmin: data.isAdmin === true,
            lastSeenAt: Number(data.lastSeenAt) || 0,
            altDocIds: [docId]
        };
    }

    static async lookupAccounts(rawQuery) {
        const check = await this._requireDev();
        if (!check.authorized) throw new Error(check.message || 'Primary Dev authorization required.');
        const db = this._getDb();
        if (!db) throw new Error('Firebase Firestore is not initialized.');

        const q = String(rawQuery || '').trim();
        if (!q) return [];

        const foundByUid = new Map();
        const addDoc = (doc) => {
            if (!doc || !doc.exists) return;
            const summary = this._formatSummary(doc.id, doc.data() || {});
            const key = summary.uid;
            if (foundByUid.has(key)) {
                const existing = foundByUid.get(key);
                if (!existing.altDocIds.includes(doc.id)) existing.altDocIds.push(doc.id);
                if (doc.id === key) Object.assign(existing, { ...summary, altDocIds: existing.altDocIds });
            } else {
                foundByUid.set(key, summary);
            }
        };

        const lower = q.replace(/^#/, '').toLowerCase();
        const cleanTag = q.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const tasks = [];

        // 1. Direct document ID lookup (UID or email doc key)
        if (!q.includes(' ')) {
            tasks.push(db.collection('players').doc(q).get().then(addDoc).catch(() => {}));
            if (q.includes('@')) {
                tasks.push(db.collection('players').doc(q.toLowerCase()).get().then(addDoc).catch(() => {}));
                tasks.push(db.collection('players').where('email', '==', q.toLowerCase()).limit(10).get().then(s => s.forEach(addDoc)).catch(() => {}));
                tasks.push(db.collection('players').where('email', '==', q).limit(10).get().then(s => s.forEach(addDoc)).catch(() => {}));
            }
        }

        // 2. Query by UID field
        tasks.push(db.collection('players').where('uid', '==', q).limit(5).get().then(s => s.forEach(addDoc)).catch(() => {}));

        // 3. Query by Online Friend Tag (#ABCDEF)
        if (cleanTag.length >= 4 && cleanTag.length <= 10) {
            tasks.push(db.collection('players').where('friendTagClean', '==', cleanTag).limit(6).get().then(s => s.forEach(addDoc)).catch(() => {}));
            tasks.push(db.collection('players').where('friendTag', '==', `#${cleanTag}`).limit(6).get().then(s => s.forEach(addDoc)).catch(() => {}));
        }

        // 4. Query by username reservation & playerNameLower / exact name
        if (!q.startsWith('#') && lower.length >= 1) {
            tasks.push(
                db.collection('usernames').doc(lower).get().then(async (uDoc) => {
                    if (uDoc.exists && uDoc.data() && uDoc.data().uid) {
                        const pDoc = await db.collection('players').doc(uDoc.data().uid).get().catch(() => null);
                        addDoc(pDoc);
                    }
                }).catch(() => {})
            );
            tasks.push(
                db.collection('players')
                    .where('playerNameLower', '>=', lower)
                    .where('playerNameLower', '<=', lower + '\uf8ff')
                    .limit(12).get().then(s => s.forEach(addDoc)).catch(() => {})
            );
            tasks.push(db.collection('players').where('playerName', '==', q).limit(6).get().then(s => s.forEach(addDoc)).catch(() => {}));
        }

        await Promise.allSettled(tasks);
        return Array.from(foundByUid.values()).sort((a, b) => b.highScore - a.highScore);
    }

    static _isCurrentLocalAccount(uid, email = '') {
        if (typeof window === 'undefined') return false;
        const localUid = localStorage.getItem('lesaio_player_uid');
        const googleUid = localStorage.getItem('lesaio_google_uid');
        const authUid = window.cloudSave && window.cloudSave.currentUser && window.cloudSave.currentUser.uid;
        const effUid = window.cloudSave && typeof window.cloudSave.getEffectivePlayerUid === 'function'
            ? window.cloudSave.getEffectivePlayerUid() : '';
        if (uid && (uid === localUid || uid === googleUid || uid === authUid || uid === effUid)) return true;
        const myEmail = (window.cloudSave && window.cloudSave.currentUser && window.cloudSave.currentUser.email) || localStorage.getItem('lesaio_google_email') || '';
        return !!(email && myEmail && email.toLowerCase().trim() === myEmail.toLowerCase().trim());
    }

    static async _resetLocalClientAfterSelfAction(shouldSignOut = false) {
        if (typeof window === 'undefined') return;
        window._lesaioSuppressUnloadSave = true;
        if (window.SaveManager && window.SaveManager.saveDebounceTimer) {
            clearTimeout(window.SaveManager.saveDebounceTimer);
            window.SaveManager.saveDebounceTimer = null;
        }
        if (window.friendService && window.friendService._presenceTimer) {
            clearInterval(window.friendService._presenceTimer);
            window.friendService._presenceTimer = null;
        }
        if (window.cloudSave) {
            if (typeof window.cloudSave.stopRealtimeListener === 'function') window.cloudSave.stopRealtimeListener();
            if (shouldSignOut && typeof window.cloudSave.signOut === 'function') {
                try { await window.cloudSave.signOut(); } catch (_) {}
            }
        }
        if (typeof AccountSyncManager !== 'undefined' && typeof AccountSyncManager.resetToGuestAccount === 'function') {
            AccountSyncManager.resetToGuestAccount();
        }
        if (shouldSignOut && typeof localStorage !== 'undefined') {
            localStorage.setItem('lesaio_player_uid', `playtest_${Math.random().toString(36).substring(2, 8)}_${Date.now().toString(36)}`);
        }
    }

    static _purgeFromLocalCaches(uid, nameLower = '') {
        if (typeof localStorage !== 'undefined' && uid) {
            try {
                const claimed = JSON.parse(localStorage.getItem('lesaio_claimed_names') || '{}');
                let dirty = false;
                for (const [k, owner] of Object.entries(claimed)) {
                    if (owner === uid || (nameLower && k === nameLower)) {
                        delete claimed[k];
                        dirty = true;
                    }
                }
                if (dirty) localStorage.setItem('lesaio_claimed_names', JSON.stringify(claimed));
            } catch (_) {}
        }
        if (typeof window !== 'undefined' && window.friendService) {
            const fs = window.friendService;
            if (fs.friendProfiles) delete fs.friendProfiles[uid];
            fs.friends = (fs.friends || []).filter(f => f && f.uid !== uid);
            fs.incomingRequests = (fs.incomingRequests || []).filter(r => r && r.uid !== uid && r.fromUid !== uid);
            fs.outgoingRequests = (fs.outgoingRequests || []).filter(r => r && r.uid !== uid && r.toUid !== uid);
            if (typeof fs.emitUpdate === 'function') fs.emitUpdate();
        }
        if (typeof window !== 'undefined' && window.leaderboardModal && Array.isArray(window.leaderboardModal._rows)) {
            window.leaderboardModal._rows = window.leaderboardModal._rows.filter(r => r && r.uid !== uid);
            const modal = document.getElementById('leaderboard-modal');
            if (modal && !modal.classList.contains('hidden')) window.leaderboardModal.render();
        }
    }

    /**
     * Wipe all progression, currencies, gear, cosmetics, and leaderboard records back to Lv.1.
     * Uses .update() without touching `isAdmin` so Firestore security rules are preserved.
     */
    static async wipeAccount(targetInfo) {
        const check = await this._requireDev();
        if (!check.authorized) throw new Error(check.message || 'Primary Dev authorization required.');
        const db = this._getDb();
        if (!db || !targetInfo || !targetInfo.uid) throw new Error('Invalid target account.');

        const uid = targetInfo.uid;
        const freshPlayer = {
            name: targetInfo.name || 'Psanas',
            accountLevel: 1,
            accountXp: 0,
            coins: 1500,
            gold: 1500,
            gems: 50,
            diamonds: 50,
            selectedHero: 'psanas',
            heroStyles: { psgiannhs: 'jacket' },
            unlockedHeroes: ['psanas'],
            selectedWeapon: 'pea',
            unlockedWeapons: ['pea'],
            olympianStarStones: 0,
            evolutionStones: 0,
            ascentCrests: 0,
            ascentCrestsDate: '',
            selectedSkill: 'blade_rush',
            unlockedSkills: ['blade_rush', 'nerobalonaki'],
            skillLevels: { blade_rush: 1, nerobalonaki: 1 },
            upgrades: { critChance: 0, critDamage: 0, maxHealth: 0, goldBonus: 0 },
            unlockedPerks: [],
            equippedPerks: [null, null, null],
            perkRanks: {},
            combatFeats: { storyMaxWave: 1, endlessMaxWave: 0, olympusMaxFloor: 0, defeatedBosses: {}, endlessMiniBossKills: 0 },
            equippedGear: { helmet: null, armor: null, belt: null, gloves: null, boots: null },
            unlockedGear: [],
            gearLevels: {},
            evolvedGear: [],
            ascendedGear: [],
            evolvedWeapons: [],
            starBlessedHeroes: [],
            cosmetics: { equippedBanner: 'banner_recruit', equippedFrame: 'frame_rookie', displayedCoins: [], unlockedBanners: ['banner_recruit'], unlockedFrames: ['frame_rookie'], unlockedCoins: [] },
            heroSkins: { unlocked: [], equipped: {} },
            battlePass: { season: 'season_1', xp: 0, hasPremium: false, claimedFree: [], claimedPremium: [] },
            materials: {},
            inventory: { version: 2, crates: {}, chests: {}, materials: {} },
            chestSlots: [null, null, null, null],
            pendingBossRewards: [],
            stats: { totalKills: 0, maxWave: 1, highScore: 0, totalFatmirs: 0, totalCasillas: 0, totalSkarmogyftos: 0, matchesPlayed: 0, totalTimeSeconds: 0, heroPlays: { psanas: 0, psogas: 0, petros: 0 } }
        };

        const wipePayload = {
            version: 3,
            timestamp: Date.now(),
            coins: 1500,
            gold: 1500,
            gems: 50,
            diamonds: 50,
            level: 1,
            accountLevel: 1,
            xp: 0,
            accountXp: 0,
            selectedHero: 'psanas',
            unlockedHeroes: ['psanas'],
            selectedWeapon: 'pea',
            skillLevels: { blade_rush: 1, nerobalonaki: 1 },
            cosmetics: { banner: 'banner_recruit', frame: 'frame_rookie', coins: [] },
            socialStats: { highScore: 0, maxWave: 1, totalKills: 0, endlessMaxWave: 0, olympusMaxFloor: 0 },
            lbHighScore: 0,
            lbEndlessWave: 1,
            lbTotalKills: 0,
            highScore: 0,
            maxWave: 1,
            fatmirsKilled: 0,
            casillasKilled: 0,
            skarmogyftosKilled: 0,
            player: freshPlayer,
            wipedByDevAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };

        const docIds = Array.from(new Set([uid, ...(targetInfo.altDocIds || [])]));
        for (const docId of docIds) {
            const ref = db.collection('players').doc(docId);
            const snap = await ref.get().catch(() => null);
            if (snap && snap.exists) {
                await ref.update(wipePayload);
            }
        }

        const isSelf = this._isCurrentLocalAccount(uid, targetInfo.email);
        if (isSelf) {
            await this._resetLocalClientAfterSelfAction(false);
            if (typeof window !== 'undefined' && window.location) window.location.reload();
        } else {
            this._purgeFromLocalCaches(uid);
        }
        return { ok: true, uid, selfReset: isSelf };
    }

    /**
     * Permanently delete target player across Firestore (`players`, leaderboard rankings,
     * `usernames`, `friendships`, `friend_invites`) and local caches.
     */
    static async deleteAccountEverywhere(targetInfo) {
        const check = await this._requireDev();
        if (!check.authorized) throw new Error(check.message || 'Primary Dev authorization required.');
        const db = this._getDb();
        if (!db || !targetInfo || !targetInfo.uid) throw new Error('Invalid target account.');

        const uid = targetInfo.uid;
        const nameLower = String(targetInfo.nameLower || '').trim().toLowerCase();
        const counts = { players: 0, usernames: 0, friendships: 0, invites: 0 };

        // 1. Delete all player docs matching this UID / alt doc IDs (removes saves + leaderboard entries)
        const docIdsToDelete = new Set([uid, ...(targetInfo.altDocIds || [])]);
        if (targetInfo.email) docIdsToDelete.add(targetInfo.email.toLowerCase());
        try {
            const extraSnap = await db.collection('players').where('uid', '==', uid).get();
            extraSnap.forEach(d => docIdsToDelete.add(d.id));
        } catch (_) {}

        for (const docId of docIdsToDelete) {
            const ref = db.collection('players').doc(docId);
            const snap = await ref.get().catch(() => null);
            if (snap && snap.exists) {
                await ref.delete();
                counts.players++;
            }
        }

        // 2. Delete claimed username records owned by this account
        const usernameIds = new Set();
        try {
            const uSnap = await db.collection('usernames').where('uid', '==', uid).get();
            uSnap.forEach(d => usernameIds.add(d.id));
        } catch (_) {}
        if (nameLower) usernameIds.add(nameLower);
        for (const uId of usernameIds) {
            const ref = db.collection('usernames').doc(uId);
            const snap = await ref.get().catch(() => null);
            if (snap && snap.exists && (!snap.data().uid || snap.data().uid === uid)) {
                await ref.delete();
                counts.usernames++;
            }
        }

        // 3. Delete all mutual friendships / pending requests involving this UID
        try {
            const fSnap = await db.collection('friendships').where('users', 'array-contains', uid).get();
            for (const d of fSnap.docs) {
                await d.ref.delete();
                counts.friendships++;
            }
        } catch (_) {}

        // 4. Delete all pending co-op room invites sent to or from this UID
        try {
            const [sentSnap, recvSnap] = await Promise.all([
                db.collection('friend_invites').where('fromUid', '==', uid).get(),
                db.collection('friend_invites').where('toUid', '==', uid).get()
            ]);
            const seenInvites = new Set();
            for (const d of [...sentSnap.docs, ...recvSnap.docs]) {
                if (seenInvites.has(d.id)) continue;
                seenInvites.add(d.id);
                await d.ref.delete();
                counts.invites++;
            }
        } catch (_) {}

        this._purgeFromLocalCaches(uid, nameLower);
        const isSelf = this._isCurrentLocalAccount(uid, targetInfo.email);
        if (isSelf) {
            await this._resetLocalClientAfterSelfAction(true);
            if (typeof window !== 'undefined' && window.location) window.location.reload();
        }
        return { ok: true, uid, counts, selfDeleted: isSelf };
    }
}

if (typeof window !== 'undefined') {
    window.DevAccountManager = DevAccountManager;
}
