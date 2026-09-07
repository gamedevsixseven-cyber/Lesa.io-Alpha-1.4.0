/**
 * Lesa.io - Admin Authentication Service
 * Strictly verifies admin privileges via Firebase Cloud Firestore.
 * Access is granted ONLY if the user's UID or Email exists in Firestore
 * under 'admins/{uid}', 'admins/{email}', or 'players/{uid}.isAdmin === true'.
 */

class AdminAuthService {
    constructor() {
        this.cachedAdminStatus = null;
        this.cachedUser = null;
        this.lastCheckTimestamp = 0;
        this.CHECK_TTL_MS = 30000; // Re-verify every 30 seconds
    }

    /**
     * Get the active Firebase user
     */
    getCurrentUser() {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const auth = firebase.auth();
            if (auth && auth.currentUser) return auth.currentUser;
        }
        if (window.cloudSave && window.cloudSave.currentUser) {
            return window.cloudSave.currentUser;
        }
        return null;
    }

    /**
     * Strictly verifies whether the current user is an authorized Admin in Firebase Firestore.
     * @returns {Promise<{ authorized: boolean, reason?: string, user?: object }>}
     */
    async verifyAdminAccess(forceRefresh = false) {
        const user = this.getCurrentUser();

        if (!user) {
            return {
                authorized: false,
                reason: 'NOT_LOGGED_IN',
                message: 'You must sign in with your Google account in Settings to verify Admin privileges.'
            };
        }

        // Use cache if checked recently for snappy responsiveness
        const now = Date.now();
        if (!forceRefresh && this.cachedUser === user.uid && (now - this.lastCheckTimestamp < this.CHECK_TTL_MS)) {
            return {
                authorized: this.cachedAdminStatus,
                user: { uid: user.uid, email: user.email, name: user.displayName || user.email }
            };
        }

        if (typeof firebase === 'undefined' || !firebase.firestore) {
            return {
                authorized: false,
                reason: 'FIREBASE_OFFLINE',
                message: 'Firebase Firestore is not initialized or offline.'
            };
        }

        try {
            const db = firebase.firestore();
            const uid = user.uid;
            const email = (user.email || '').toLowerCase().trim();

            // 1. Check direct document 'admins/{uid}'
            const uidAdminDoc = await db.collection('admins').doc(uid).get();
            if (uidAdminDoc.exists && uidAdminDoc.data()?.active !== false) {
                return this._setAuthorized(user, true);
            }

            // 2. Check direct document 'admins/{email}'
            if (email) {
                const emailAdminDoc = await db.collection('admins').doc(email).get();
                if (emailAdminDoc.exists && emailAdminDoc.data()?.active !== false) {
                    return this._setAuthorized(user, true);
                }
            }

            // 3. Check player profile document 'players/{uid}.isAdmin'
            const playerDoc = await db.collection('players').doc(uid).get();
            if (playerDoc.exists && playerDoc.data()?.isAdmin === true) {
                return this._setAuthorized(user, true);
            }

            // 4. Check global config 'config/admins'
            const configAdminsDoc = await db.collection('config').doc('admins').get();
            if (configAdminsDoc.exists) {
                const data = configAdminsDoc.data();
                if (data && (data[uid] === true || (email && data[email] === true))) {
                    return this._setAuthorized(user, true);
                }
            }

            // Access Denied: Not found in any Firebase Admin records
            this._setAuthorized(user, false);
            return {
                authorized: false,
                reason: 'NOT_AN_ADMIN',
                user: { uid: user.uid, email: user.email },
                message: `Access Denied. Account (${user.email || user.uid}) is not listed as an Admin in Firebase Firestore.\n\nTo grant access:\nAdd a document with your UID or Email in the Firestore 'admins' collection, or set 'isAdmin: true' in your 'players' document.`
            };
        } catch (err) {
            console.error('Admin verification error:', err);
            return {
                authorized: false,
                reason: 'FIRESTORE_ERROR',
                message: `Firebase Verification Error: ${err.message}`
            };
        }
    }

    _setAuthorized(user, isAuth) {
        this.cachedAdminStatus = isAuth;
        this.cachedUser = user.uid;
        this.lastCheckTimestamp = Date.now();
        return {
            authorized: isAuth,
            user: { uid: user.uid, email: user.email, name: user.displayName || user.email }
        };
    }

    /**
     * Grant Admin privileges to another user via Firebase Firestore
     * (Can only be executed if current user is an authorized admin)
     */
    async grantAdminPrivilege(targetEmailOrUid) {
        const check = await this.verifyAdminAccess();
        if (!check.authorized) {
            throw new Error('Unauthorized. Only verified admins can grant admin access.');
        }

        const cleanTarget = (targetEmailOrUid || '').toLowerCase().trim();
        if (!cleanTarget) throw new Error('Target email or UID cannot be blank.');

        const db = firebase.firestore();
        const currentAdmin = this.getCurrentUser();

        await db.collection('admins').doc(cleanTarget).set({
            grantedBy: currentAdmin.email || currentAdmin.uid,
            grantedAt: firebase.firestore.FieldValue.serverTimestamp(),
            active: true
        }, { merge: true });

        return { success: true, target: cleanTarget };
    }

    /**
     * Revoke Admin privileges in Firebase Firestore
     */
    async revokeAdminPrivilege(targetEmailOrUid) {
        const check = await this.verifyAdminAccess();
        if (!check.authorized) {
            throw new Error('Unauthorized. Only verified admins can revoke admin access.');
        }

        const cleanTarget = (targetEmailOrUid || '').toLowerCase().trim();
        const db = firebase.firestore();

        await db.collection('admins').doc(cleanTarget).delete();
        return { success: true, target: cleanTarget };
    }
}

// Global Singleton
window.AdminAuth = new AdminAuthService();
