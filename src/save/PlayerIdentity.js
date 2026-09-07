/**
 * Lesa.io - Player Identity & Device Multi-Tenancy Engine
 * Distinguishes between authenticated Google accounts and distinct per-device guest profiles
 * Prevents cross-device account collision between PC and mobile phones
 */

class PlayerIdentity {
    static getEffectiveUid(auth, currentUser) {
        // 1. Authenticated Google user in active session
        if (currentUser && currentUser.uid) return currentUser.uid;
        if (auth && auth.currentUser && auth.currentUser.uid) return auth.currentUser.uid;

        // 2. Verified linked Google account in persistent local storage
        const isLinked = localStorage.getItem('lesaio_google_linked') === 'true';
        const savedGoogleUid = localStorage.getItem('lesaio_google_uid');
        if (isLinked && savedGoogleUid && savedGoogleUid !== 'RLqBTfjZATZzePCPDyNCrUGCYrs2') {
            return savedGoogleUid;
        }

        // 3. Developer PC on localhost:8080 or 127.0.0.1:8080 (Dev workstation desktop)
        const isMobile = (typeof navigator !== 'undefined') && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
        const isLocalDevPC = (typeof window !== 'undefined' && 
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
            window.location.port !== '8085' &&
            !isMobile);

        if (isLocalDevPC && (isLinked || !localStorage.getItem('lesaio_player_uid'))) {
            return 'RLqBTfjZATZzePCPDyNCrUGCYrs2';
        }

        // 4. Mobile phones, LAN connections (192.168.x.x), or external guests:
        // Assign and persist a unique per-device player UID so each device has its own distinct Firestore record
        let playerUid = localStorage.getItem('lesaio_player_uid');
        if (!playerUid || playerUid === 'RLqBTfjZATZzePCPDyNCrUGCYrs2') {
            const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
            playerUid = (isMobile ? 'phone_' : 'player_') + Math.random().toString(36).substring(2, 8) + '_' + Date.now().toString(36);
            localStorage.setItem('lesaio_player_uid', playerUid);

            // Clean up any stale developer account credentials from previous shared fallback
            if (!isLinked) {
                localStorage.removeItem('lesaio_google_uid');
                localStorage.removeItem('lesaio_google_email');
                localStorage.removeItem('lesaio_google_name');

                // If mobile device was contaminated with > 500k dev coins, reset to fresh starter values
                const currentCoins = parseInt(localStorage.getItem('lesaio_coins') || '0', 10);
                if (currentCoins > 500000) {
                    localStorage.setItem('lesaio_coins', '1500');
                    localStorage.setItem('lesaio_gems', '50');
                    localStorage.setItem('lesaio_account_level', '1');
                    localStorage.setItem('lesaio_account_xp', '0');
                    localStorage.setItem('lesaio_skill_levels', '{}');
                    if (window.GameState && window.GameState.player) {
                        window.GameState.player.coins = 1500;
                        window.GameState.player.gems = 50;
                        window.GameState.player.accountLevel = 1;
                        window.GameState.player.accountXp = 0;
                        window.GameState.player.skillLevels = {};
                    }
                }
            }
        }
        return playerUid;
    }

    static getEffectiveEmail(auth, currentUser) {
        if (currentUser && currentUser.email) return currentUser.email;
        if (auth && auth.currentUser && auth.currentUser.email) return auth.currentUser.email;
        if (localStorage.getItem('lesaio_google_linked') === 'true') return localStorage.getItem('lesaio_google_email') || '';
        const isLocalDevPC = (typeof window !== 'undefined' && 
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
            window.location.port !== '8085');
        return isLocalDevPC ? 'gamedevsixseven@gmail.com' : '';
    }

    static seedNewPlayerDoc(db, uid) {
        if (!db || !uid) return;
        const isMobile = uid.startsWith('phone_');
        const initial = {
            uid: uid,
            playerName: localStorage.getItem('lesaio_player_name') || (isMobile ? 'Mobile Survivor' : 'Survivor'),
            device: isMobile ? 'Mobile Phone' : 'Web Browser',
            coins: parseInt(localStorage.getItem('lesaio_coins') || '1500', 10),
            gold: parseInt(localStorage.getItem('lesaio_coins') || '1500', 10),
            diamonds: parseInt(localStorage.getItem('lesaio_gems') || '50', 10),
            gems: parseInt(localStorage.getItem('lesaio_gems') || '50', 10),
            level: parseInt(localStorage.getItem('lesaio_account_level') || '1', 10),
            xp: parseInt(localStorage.getItem('lesaio_account_xp') || '0', 10),
            skillLevels: JSON.parse(localStorage.getItem('lesaio_skill_levels') || '{}'),
            selectedHero: localStorage.getItem('lesaio_selected_hero') || 'psanas',
            selectedWeapon: localStorage.getItem('lesaio_selected_weapon') || 'pea',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        db.collection('players').doc(uid).set(initial, { merge: true }).catch(() => {});
    }
}

if (typeof window !== 'undefined') {
    window.PlayerIdentity = PlayerIdentity;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PlayerIdentity };
}
