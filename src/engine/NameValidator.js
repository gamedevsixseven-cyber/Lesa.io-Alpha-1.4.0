/**
 * Lesa.io - Advanced Player Name Validation & Profanity Filter Engine
 * Multi-layer normalization: Unicode NFKD decomposition, Cyrillic/Greek homoglyphs,
 * multi-char and single-char leetspeak, noise stripping, duplicate collapsing, and regex patterns.
 */

class NameValidator {
    constructor() {
        // Reserved system names
        this.reservedNames = [
            'admin', 'administrator', 'system', 'moderator', 'mod',
            'developer', 'dev', 'lesaio', 'lesa_io', 'support',
            'official', 'server', 'bot', 'null', 'undefined'
        ];

        // Comprehensive blacklist of inappropriate, vulgar, offensive, and toxic words (English & Greek)
        this.inappropriateWords = [
            // Vulgar & Explicit (English)
            'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'pussy', 'cock', 'penis', 'vagina',
            'porn', 'porno', 'sex', 'xxx', 'hentai', 'boob', 'tits', 'slut', 'whore', 'blowjob',
            'bastard', 'twat', 'wanker', 'anal', 'anus', 'dildo', 'masturbat', 'orgasm', 'nude',
            'clit', 'jizz', 'cum', 'prick', 'boner', 'scrotum',
            // Slurs & Hate Speech
            'nigger', 'nigga', 'nigg', 'negro', 'faggot', 'fag', 'retard', 'kike', 'chink', 'gook',
            'spic', 'nazi', 'hitler', 'swastika', 'terrorist', 'isis', 'rape', 'rapist', 'pedophile',
            'pedo', 'paedo', 'dyke', 'tranny', 'coon', 'suicide',
            // Greek Slurs / Inappropriate terms (Latinized & Transliterations)
            'malak', 'malaka', 'malakas', 'malakismeno', 'gamo', 'gamw', 'gamis', 'gamisou', 'gamiesai',
            'pousti', 'poustis', 'poustiko', 'mpousti', 'mpoustis', 'kariol', 'karioli', 'kariolis',
            'mouni', 'mounia', 'poutan', 'poutana', 'poutanes', 'kavl', 'kavli', 'kavla', 'kavlotiko',
            'tsouli', 'tsoulia', 'tsoulio', 'skata', 'skato', 'arxid', 'arxidia', 'arhidia', 'psolio',
            'klani', 'klana', 'klane', 'vlaka', 'vlakas'
        ];

        // Evasion regex patterns for phonetic / spacing variations
        this.evasionPatterns = [
            /f+u+c+k+/i,
            /s+h+i+t+/i,
            /b+i+t+c+h+/i,
            /c+u+n+t+/i,
            /p+u+s+s+y+/i,
            /d+i+c+k+/i,
            /c+o+c+k+/i,
            /n+[i1!l]+[g9q]{2,}[ae3r]*/i,
            /f+[a4@]+g+[o0e]?t?/i,
            /p+e+n+[i1!]+s+/i,
            /m+[a4@]+l+[a4@]+k+[a4@]*/i,
            /g+[a4@]+m+[o0w]+[s$]*/i,
            /p+[o0u]+[u]+s+t+[i1]+/i,
            /m+[o0u]+[u]+n+[i1]+/i
        ];

        // Cyrillic & Greek homoglyphs to Latin equivalents
        this.homoglyphMap = {
            // Cyrillic lookalikes
            'а': 'a', 'в': 'b', 'с': 'c', 'е': 'e', 'н': 'h', 'і': 'i', 'ј': 'j', 'к': 'k',
            'м': 'm', 'о': 'o', 'р': 'p', 'т': 't', 'у': 'y', 'х': 'x', 'ѕ': 's',
            // Greek lookalikes
            'α': 'a', 'β': 'b', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'h', 'θ': 'th',
            'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': 'x', 'ο': 'o', 'π': 'p',
            'ρ': 'p', 'σ': 's', 'ς': 's', 'τ': 't', 'υ': 'u', 'φ': 'f', 'χ': 'x', 'ψ': 'ps',
            'ω': 'w'
        };
    }

    /**
     * Advanced multi-pass string normalization
     */
    normalize(str) {
        if (!str) return { original: '', normalized: '', collapsed: '', deduped: '' };

        let s = str.trim().toLowerCase();

        // 1. Unicode NFKD Decomposition: strip accents, umlauts, cedillas (with defensive fallback)
        if (typeof s.normalize === 'function') {
            s = s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
        }

        // 2. Homoglyph translation (Cyrillic & Greek lookalikes to Latin)
        let homoStr = '';
        for (let i = 0; i < s.length; i++) {
            const ch = s[i];
            homoStr += this.homoglyphMap[ch] || ch;
        }
        s = homoStr;

        // 3. Multi-character leetspeak substitutions
        s = s.replace(/ph/g, 'f')
             .replace(/vv/g, 'w')
             .replace(/\\\/\//g, 'w')
             .replace(/\|3/g, 'b')
             .replace(/\|\)/g, 'd')
             .replace(/\|>/g, 'p')
             .replace(/\|0/g, 'lo');

        // 4. Single-character leetspeak and symbols
        const leetMap = {
            '@': 'a', '4': 'a', '^': 'a', '∆': 'a',
            '8': 'b', 'ß': 'b',
            '(': 'c', '<': 'c', '{': 'c', '[': 'c',
            '3': 'e', '€': 'e', '£': 'e',
            '1': 'i', '!': 'i', '|': 'i', ';': 'i', ':': 'i', 'l': 'i', 'j': 'i',
            '0': 'o',
            '5': 's', '$': 's', '§': 's', 'z': 's',
            '7': 't', '+': 't', '†': 't',
            'v': 'u',
            '2': 'z'
        };

        let normalized = '';
        for (let i = 0; i < s.length; i++) {
            const char = s[i];
            normalized += leetMap[char] || char;
        }

        // 5. Remove all non-alphanumeric noise (spaces, dots, underscores, dashes, symbols)
        const collapsed = normalized.replace(/[^a-z0-9]/g, '');

        // 6. Collapse consecutive duplicate characters (e.g. "fuuuuck" -> "fuck", "biitch" -> "bitch")
        const deduped = collapsed.replace(/(.)\1+/g, '$1');

        return { original: str.toLowerCase().trim(), normalized, collapsed, deduped };
    }

    /**
     * Check if a name contains inappropriate words, slurs, or evasion patterns
     */
    checkAppropriate(name) {
        if (!name) return { isValid: false, reason: 'Name cannot be empty!' };

        const { original, normalized, collapsed, deduped } = this.normalize(name);

        // Pass 1: Check against full list on collapsed string (e.g. "f.u.c.k" -> "fuck")
        for (const bad of this.inappropriateWords) {
            if (collapsed.includes(bad)) {
                return { isValid: false, reason: 'This name contains inappropriate language! 🚫' };
            }
        }

        // Pass 2: Check against full list on deduped string (e.g. "fuuuuck" -> "fuck", "shiiit" -> "shit")
        for (const bad of this.inappropriateWords) {
            if (deduped.includes(bad)) {
                return { isValid: false, reason: 'This name contains inappropriate language! 🚫' };
            }
        }

        // Pass 3: Regex pattern evasion checks
        for (const pattern of this.evasionPatterns) {
            if (pattern.test(original) || pattern.test(normalized) || pattern.test(collapsed)) {
                return { isValid: false, reason: 'This name contains inappropriate language! 🚫' };
            }
        }

        // Pass 4: Word boundary match on normalized text
        for (const bad of this.inappropriateWords) {
            const regex = new RegExp(`\\b${bad}\\b`, 'i');
            if (regex.test(normalized) || regex.test(original)) {
                return { isValid: false, reason: 'This name contains inappropriate language! 🚫' };
            }
        }

        return { isValid: true };
    }

    /**
     * Validate length, format, and characters
     */
    validateFormat(name) {
        if (!name || name.trim() === '') {
            return { isValid: false, reason: 'Name cannot be empty!' };
        }

        const trimmed = name.trim();

        if (trimmed.length < 2) {
            return { isValid: false, reason: 'Name must be at least 2 characters long!' };
        }

        if (trimmed.length > 14) {
            return { isValid: false, reason: 'Name cannot exceed 14 characters!' };
        }

        // Only allow letters, numbers, spaces, underscores, and dashes
        const validCharsRegex = /^[a-zA-Z0-9_ -]+$/;
        if (!validCharsRegex.test(trimmed)) {
            return { isValid: false, reason: 'Name can only contain letters, numbers, and spaces!' };
        }

        // Check reserved names
        const lower = trimmed.toLowerCase();
        if (this.reservedNames.includes(lower)) {
            return { isValid: false, reason: 'This name is reserved by the system!' };
        }

        return { isValid: true };
    }

    _getSelfUids(currentUid = null) {
        const set = new Set();
        if (currentUid) set.add(currentUid);
        if (typeof window !== 'undefined' && window.cloudSave) {
            if (typeof window.cloudSave.getEffectivePlayerUid === 'function') set.add(window.cloudSave.getEffectivePlayerUid());
            if (window.cloudSave.currentUser && window.cloudSave.currentUser.uid) set.add(window.cloudSave.currentUser.uid);
        }
        if (typeof localStorage !== 'undefined') {
            const stored = localStorage.getItem('lesaio_player_uid');
            if (stored) set.add(stored);
        }
        set.delete(''); set.delete(null); set.delete(undefined);
        return set;
    }

    _withTimeout(promise, ms = 2200, fallback = null) {
        let timer = null;
        return Promise.race([
            promise,
            new Promise((resolve) => { timer = setTimeout(() => resolve(fallback), ms); })
        ]).finally(() => { if (timer) clearTimeout(timer); });
    }

    /**
     * Check if the name is already claimed by another online player (case-insensitive)
     */
    async checkUniqueName(name, currentUid = null) {
        const trimmed = String(name || '').trim();
        const lower = trimmed.toLowerCase();
        if (!lower) return { isValid: false, reason: 'Name cannot be empty!' };

        const selfUids = this._getSelfUids(currentUid);
        const takenResp = { isValid: false, reason: 'Name taken! Another online player already uses this name.' };

        // 1. Check local claimed names on same browser/device
        try {
            const localClaimed = JSON.parse(localStorage.getItem('lesaio_claimed_names') || '{}');
            const owner = localClaimed[lower];
            if (owner && !selfUids.has(owner)) return takenResp;
        } catch (_) {}

        // 2. Check live Firebase Firestore in parallel with strict timeout (never hang on offline/stalled connections)
        const isOnline = (typeof navigator === 'undefined' || navigator.onLine !== false);
        if (isOnline && typeof window !== 'undefined' && window.cloudSave && window.cloudSave.isInitialized && window.cloudSave.db) {
            const db = window.cloudSave.db;
            const hasConflict = (snap) => {
                let conflict = false;
                if (snap && typeof snap.forEach === 'function') {
                    snap.forEach((doc) => {
                        if (!doc.exists) return;
                        const data = doc.data() || {};
                        const docUid = data.uid || doc.id;
                        if (!selfUids.has(doc.id) && !selfUids.has(docUid)) conflict = true;
                    });
                }
                return conflict;
            };

            const usernameQ = db.collection('usernames').doc(lower).get().catch(() => null);
            const lowerQ = db.collection('players').where('playerNameLower', '==', lower).limit(5).get().catch(() => null);
            const legacyQ = (trimmed !== lower)
                ? db.collection('players').where('playerName', '==', trimmed).limit(5).get().catch(() => null)
                : Promise.resolve(null);

            const [uDoc, lowerSnap, legacySnap] = await this._withTimeout(
                Promise.all([usernameQ, lowerQ, legacyQ]),
                2200,
                [null, null, null]
            );

            if (uDoc && uDoc.exists) {
                const data = uDoc.data() || {};
                if (data.uid && !selfUids.has(data.uid)) return takenResp;
            }
            if (hasConflict(lowerSnap) || hasConflict(legacySnap)) return takenResp;
        }

        return { isValid: true };
    }

    /**
     * Register / Claim the username in Firestore & Local storage (and release previous name if renamed)
     */
    async claimName(name, previousName = null) {
        const trimmed = String(name || '').trim();
        const lower = trimmed.toLowerCase();
        if (!lower) return;

        const selfUids = this._getSelfUids();
        const myUid = (typeof window !== 'undefined' && window.cloudSave && typeof window.cloudSave.getEffectivePlayerUid === 'function' && window.cloudSave.getEffectivePlayerUid())
            || (typeof PlayerIdentity !== 'undefined' ? PlayerIdentity.getEffectiveUid(null, null) : null)
            || (typeof localStorage !== 'undefined' && localStorage.getItem('lesaio_player_uid'))
            || `player_${Math.random().toString(36).substr(2, 9)}`;
        selfUids.add(myUid);

        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('lesaio_player_uid', myUid);
            try {
                const localClaimed = JSON.parse(localStorage.getItem('lesaio_claimed_names') || '{}');
                if (previousName) {
                    const prevLower = String(previousName).trim().toLowerCase();
                    if (prevLower && prevLower !== lower && selfUids.has(localClaimed[prevLower])) {
                        delete localClaimed[prevLower];
                    }
                }
                localClaimed[lower] = myUid;
                localStorage.setItem('lesaio_claimed_names', JSON.stringify(localClaimed));
            } catch (_) {}
        }

        const isOnline = (typeof navigator === 'undefined' || navigator.onLine !== false);
        if (isOnline && typeof window !== 'undefined' && window.cloudSave && window.cloudSave.isInitialized && window.cloudSave.db) {
            const db = window.cloudSave.db;
            try {
                if (previousName) {
                    const prevLower = String(previousName).trim().toLowerCase();
                    if (prevLower && prevLower !== lower) {
                        const prevDoc = await this._withTimeout(db.collection('usernames').doc(prevLower).get().catch(() => null), 2000, null);
                        if (prevDoc && prevDoc.exists && prevDoc.data() && selfUids.has(prevDoc.data().uid)) {
                            await this._withTimeout(
                                db.collection('usernames').doc(prevLower).set({ uid: '', released: true }, { merge: true }).catch(() => {}),
                                2000,
                                null
                            );
                        }
                    }
                }
                const curDoc = await this._withTimeout(db.collection('usernames').doc(lower).get().catch(() => null), 2000, null);
                if (!curDoc || !curDoc.exists || !curDoc.data() || !curDoc.data().uid || selfUids.has(curDoc.data().uid)) {
                    const ts = (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
                        ? firebase.firestore.FieldValue.serverTimestamp() : Date.now();
                    await this._withTimeout(
                        db.collection('usernames').doc(lower).set({ displayName: trimmed, nameLower: lower, uid: myUid, claimedAt: ts }, { merge: true }).catch(() => {}),
                        2500,
                        null
                    );
                }
            } catch (err) {
                console.warn('Firestore username registration notice:', err);
            }
        }
    }

    /**
     * Complete Validation Pipeline (Format + Inappropriate Filter + Uniqueness)
     */
    async validateAll(name, currentUid = null) {
        // 1. Format check
        const formatRes = this.validateFormat(name);
        if (!formatRes.isValid) return formatRes;

        // 2. Advanced Inappropriate Language Check
        const appRes = this.checkAppropriate(name);
        if (!appRes.isValid) return appRes;

        // 3. Uniqueness check
        const uniqueRes = await this.checkUniqueName(name, currentUid);
        if (!uniqueRes.isValid) return uniqueRes;

        return { isValid: true };
    }

    /**
     * Static helper for fast synchronous format and appropriateness validation
     */
    static validate(name) {
        const validator = (typeof window !== 'undefined' && window.nameValidator) ? window.nameValidator : new NameValidator();
        const fmt = validator.validateFormat(name);
        if (!fmt.isValid) {
            return { valid: false, error: fmt.reason };
        }
        const app = validator.checkAppropriate(name);
        if (!app.isValid) {
            return { valid: false, error: app.reason };
        }
        return { valid: true };
    }
}

// Global Name Validator instance
window.nameValidator = new NameValidator();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NameValidator };
}
