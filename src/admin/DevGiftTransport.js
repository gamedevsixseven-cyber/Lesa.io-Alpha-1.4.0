/**
 * Lesa.io - Dual-Backend Dev Gift Delivery, Lookup & Cross-Store Claim Transport
 * Coordinates Firestore `players/{uid}.devGifts` and Cloudflare Edge D1 `/player/{uid}`
 * so Dev Gifts reliably reach both Google-linked and Guest accounts regardless of active store.
 */

class DevGiftTransport {
    static _lastRemoteCheckAt = 0;
    static _remoteCheckInFlight = null;

    static getEdge() {
        return (typeof window !== 'undefined' && window.edgeApi && typeof window.edgeApi.isEnabled === 'function' && window.edgeApi.isEnabled())
            ? window.edgeApi : null;
    }

    static getDb() {
        if (typeof window !== 'undefined' && window.cloudSave && window.cloudSave.db) return window.cloudSave.db;
        if (typeof firebase !== 'undefined' && firebase.firestore) return firebase.firestore();
        return null;
    }

    static async lookupEdgeAccounts(rawQuery, formatSummaryFn) {
        const edge = this.getEdge();
        const q = String(rawQuery || '').trim();
        if (!edge || !q || typeof formatSummaryFn !== 'function') return [];
        const rows = [];
        const seen = new Set();
        const addRow = (doc) => {
            if (!doc || typeof doc !== 'object') return;
            const id = doc.uid || doc.id;
            if (!id || seen.has(id)) return;
            seen.add(id);
            rows.push(formatSummaryFn(id, doc));
        };
        try {
            const sr = await edge.get(`/players/search?q=${encodeURIComponent(q)}`).catch(() => null);
            if (sr && sr.ok && Array.isArray(sr.players)) sr.players.forEach(addRow);
            if (!q.includes(' ') && q.length >= 4) {
                const dr = await edge.get(`/player/${encodeURIComponent(q)}`).catch(() => null);
                if (dr && dr.ok && dr.doc) addRow(dr.doc);
            }
        } catch (_) {}
        return rows;
    }

    static async sendGift(targetInfo, giftEntry) {
        const db = this.getDb();
        const edge = this.getEdge();
        const uid = targetInfo && targetInfo.uid ? String(targetInfo.uid).trim() : '';
        if (!uid) throw new Error('Invalid target account UID.');

        const docIds = Array.from(new Set([uid, ...(Array.isArray(targetInfo.altDocIds) ? targetInfo.altDocIds : [])].filter(Boolean)));
        let firestoreOk = false, edgeOk = false, lastErr = null;
        let deliveredDocId = uid;

        if (db && typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) {
            const arrUnion = firebase.firestore.FieldValue.arrayUnion(giftEntry);
            const metaPatch = {
                uid,
                ...(targetInfo.name ? { playerName: targetInfo.name, playerNameLower: String(targetInfo.name).toLowerCase() } : {}),
                ...(targetInfo.tag ? { friendTag: targetInfo.tag, friendTagClean: targetInfo.tag.toUpperCase().replace(/[^A-Z0-9]/g, '') } : {}),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            };
            for (const docId of docIds) {
                try {
                    const patch = docId === uid
                        ? { ...metaPatch, devGifts: arrUnion }
                        : { devGifts: arrUnion, lastUpdated: firebase.firestore.FieldValue.serverTimestamp() };
                    await db.collection('players').doc(docId).set(patch, { merge: true });
                    firestoreOk = true;
                    deliveredDocId = docId;
                } catch (err) {
                    lastErr = err;
                }
            }
        }

        if (edge) {
            try {
                const playerMeta = {
                    playerName: targetInfo.name || 'Hero',
                    friendTag: targetInfo.tag || ''
                };
                const res = await edge.post(`/player/${encodeURIComponent(uid)}/gift`, { gift: giftEntry, playerMeta });
                if (res && !res.fallback && res.ok) {
                    edgeOk = true;
                } else if (res && !res.fallback && res.status === 404) {
                    // Graceful fallback when running against Worker prior to /gift route deployment
                    const cur = await edge.get(`/player/${encodeURIComponent(uid)}`).catch(() => null);
                    const base = (cur && cur.ok && cur.doc) ? cur.doc : { uid, ...playerMeta };
                    const prevGifts = Array.isArray(base.devGifts) ? base.devGifts.filter(g => g && g.id !== giftEntry.id) : [];
                    const postRes = await edge.post(`/player/${encodeURIComponent(uid)}`, {
                        devGifts: [...prevGifts, giftEntry]
                    }).catch(() => null);
                    if (postRes && postRes.ok) edgeOk = true;
                }
            } catch (err) {
                lastErr = lastErr || err;
            }
        }

        if (!firestoreOk && !edgeOk) {
            throw lastErr || new Error('Could not deliver Dev Gift to Firestore or Edge backend.');
        }
        return { ok: true, docId: deliveredDocId, firestoreOk, edgeOk };
    }

    static async pullRemotePendingGifts(cloudSave, force = false) {
        if (!cloudSave || typeof DevGiftManager === 'undefined') return false;
        const uid = (typeof cloudSave.getEffectivePlayerUid === 'function') ? cloudSave.getEffectivePlayerUid() : '';
        if (!uid) return false;

        const now = Date.now();
        if (!force && (now - this._lastRemoteCheckAt < 12000)) return false;
        if (this._remoteCheckInFlight) return this._remoteCheckInFlight;
        this._lastRemoteCheckAt = now;

        this._remoteCheckInFlight = (async () => {
            try {
                const claimedSet = DevGiftManager._getClaimedSet();
                const mergedMap = new Map();
                const collect = (arr) => {
                    if (!Array.isArray(arr)) return;
                    for (const g of arr) {
                        if (g && typeof g === 'object' && g.id && !claimedSet.has(g.id) && !mergedMap.has(g.id)) {
                            mergedMap.set(g.id, g);
                        }
                    }
                };

                const cached = cloudSave.lastCloudData;
                if (cached && Array.isArray(cached.devGifts)) collect(cached.devGifts);

                const edge = this.getEdge();
                const db = cloudSave.db || this.getDb();
                const tasks = [];
                if (edge) {
                    tasks.push(edge.get(`/player/${encodeURIComponent(uid)}`).then(r => { if (r && r.ok && r.doc) collect(r.doc.devGifts); }).catch(() => {}));
                }
                if (db) {
                    tasks.push(db.collection('players').doc(uid).get().then(s => { if (s && s.exists) collect((s.data() || {}).devGifts); }).catch(() => {}));
                    const email = (typeof cloudSave.getEffectivePlayerEmail === 'function') ? cloudSave.getEffectivePlayerEmail() : '';
                    if (email) {
                        tasks.push(db.collection('players').doc(email.toLowerCase()).get().then(s => { if (s && s.exists) collect((s.data() || {}).devGifts); }).catch(() => {}));
                    }
                }
                await Promise.allSettled(tasks);

                const pending = Array.from(mergedMap.values());
                if (pending.length === 0) return false;
                if (cloudSave.lastCloudData && typeof cloudSave.lastCloudData === 'object') {
                    cloudSave.lastCloudData.devGifts = pending;
                }
                return DevGiftManager.claimPendingGifts({ devGifts: pending }, cloudSave);
            } finally {
                this._remoteCheckInFlight = null;
            }
        })();
        return this._remoteCheckInFlight;
    }

    static async markClaimedOnCloud(cloudSave, claimedGifts) {
        if (!Array.isArray(claimedGifts) || claimedGifts.length === 0) return;
        const uid = (cloudSave && typeof cloudSave.getEffectivePlayerUid === 'function')
            ? cloudSave.getEffectivePlayerUid()
            : ((typeof PlayerIdentity !== 'undefined') ? PlayerIdentity.getEffectiveUid(null, null) : '');
        if (!uid) return;

        const giftIds = claimedGifts.map(g => g && g.id).filter(Boolean);
        const claimedSet = new Set(giftIds);
        if (cloudSave && cloudSave.lastCloudData && Array.isArray(cloudSave.lastCloudData.devGifts)) {
            cloudSave.lastCloudData.devGifts = cloudSave.lastCloudData.devGifts.filter(g => g && !claimedSet.has(g.id));
        }

        const db = (cloudSave && cloudSave.db) || this.getDb();
        if (db && typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) {
            const rem = firebase.firestore.FieldValue.arrayRemove(...claimedGifts);
            db.collection('players').doc(uid).update({ devGifts: rem }).catch(() => {});
            const email = (cloudSave && typeof cloudSave.getEffectivePlayerEmail === 'function') ? cloudSave.getEffectivePlayerEmail() : '';
            if (email) db.collection('players').doc(email.toLowerCase()).update({ devGifts: rem }).catch(() => {});
        }

        const edge = this.getEdge();
        if (edge) {
            const res = await edge.post(`/player/${encodeURIComponent(uid)}/gift/claim`, { giftIds }).catch(() => null);
            if (res && !res.fallback && res.status === 404) {
                const cur = await edge.get(`/player/${encodeURIComponent(uid)}`).catch(() => null);
                if (cur && cur.ok && cur.doc && Array.isArray(cur.doc.devGifts)) {
                    const remaining = cur.doc.devGifts.filter(g => g && !claimedSet.has(g.id));
                    edge.post(`/player/${encodeURIComponent(uid)}`, { devGifts: remaining }).catch(() => {});
                }
            }
        }
    }
}

if (typeof window !== 'undefined') window.DevGiftTransport = DevGiftTransport;
if (typeof module !== 'undefined' && module.exports) module.exports = { DevGiftTransport };
