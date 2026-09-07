/**
 * Lesa.io - Account Lifecycle & Cloud Synchronization Manager
 * Handles seamless account linking (cloud hydration & reload) and unlinking (guest reset & reload)
 */

class AccountSyncManager {
    /**
     * Inspect and sync down existing cloud progress for an authenticated user.
     * If cloud progress exists, overwrites local storage with the cloud state and returns its details.
     * If new account, uploads local progress to the cloud as initial save.
     * @param {Object} user Firebase User object
     * @param {Object} db Firestore instance
     * @returns {Promise<Object>}
     */
    static async syncDownCloudSave(user, db) {
        if (!user || !db) {
            return { success: false, reason: 'MISSING_USER_OR_DB' };
        }

        try {
            let docRef = db.collection('players').doc(user.uid);
            let doc = await docRef.get();

            // Fallback: check query by email if document not keyed by UID
            if ((!doc || !doc.exists) && user.email) {
                const querySnap = await db.collection('players').where('email', '==', user.email).limit(1).get();
                if (!querySnap.empty) {
                    doc = querySnap.docs[0];
                    docRef = doc.ref;
                }
            }

            if (doc && doc.exists) {
                const docData = doc.data() || {};
                const p = docData.player || docData;

                const hasSavedProgress = (
                    p.coins !== undefined ||
                    p.gems !== undefined ||
                    p.diamonds !== undefined ||
                    p.gold !== undefined ||
                    p.unlockedHeroes !== undefined ||
                    p.unlockedGear !== undefined ||
                    p.accountLevel !== undefined ||
                    p.level !== undefined ||
                    docData.coins !== undefined ||
                    docData.gems !== undefined ||
                    docData.diamonds !== undefined
                );

                if (hasSavedProgress) {
                    const coins = parseInt(p.coins ?? p.gold ?? docData.coins ?? docData.gold ?? 0, 10);
                    const gems = parseInt(p.gems ?? p.diamonds ?? docData.gems ?? docData.diamonds ?? 0, 10);
                    const accountLevel = parseInt(p.accountLevel ?? p.level ?? docData.level ?? 1, 10);
                    const accountXp = parseInt(p.accountXp ?? p.xp ?? docData.xp ?? 0, 10);
                    const name = p.name || p.playerName || docData.playerName || user.displayName || user.email?.split('@')[0] || 'Psanas';
                    const selectedHero = p.selectedHero || docData.selectedHero || 'psanas';

                    let unlockedHeroes = ['psanas'];
                    if (Array.isArray(p.unlockedHeroes)) {
                        unlockedHeroes = p.unlockedHeroes;
                    } else if (Array.isArray(docData.unlockedHeroes)) {
                        unlockedHeroes = docData.unlockedHeroes;
                    } else if (typeof docData.unlockedHeroes === 'string') {
                        try { unlockedHeroes = JSON.parse(docData.unlockedHeroes); } catch (e) {}
                    }
                    if (!unlockedHeroes.includes('psanas')) unlockedHeroes.unshift('psanas');

                    const selectedSkill = p.selectedSkill || docData.selectedSkill || 'blade_rush';
                    const unlockedSkills = Array.isArray(p.unlockedSkills) ? p.unlockedSkills : ['blade_rush', 'nerobalonaki'];
                    const skillLevels = (p.skillLevels && typeof p.skillLevels === 'object')
                        ? p.skillLevels
                        : ((docData.skillLevels && typeof docData.skillLevels === 'object') ? docData.skillLevels : { blade_rush: 1, nerobalonaki: 1 });

                    const upgrades = (p.upgrades && typeof p.upgrades === 'object')
                        ? p.upgrades
                        : { critChance: 0, critDamage: 0, maxHealth: 0, goldBonus: 0 };

                    const unlockedPerks = Array.isArray(p.unlockedPerks) ? p.unlockedPerks : [];
                    const equippedPerks = Array.isArray(p.equippedPerks) ? p.equippedPerks.slice(0, 3) : [null, null, null];
                    while (equippedPerks.length < 3) equippedPerks.push(null);

                    const equippedGear = (p.equippedGear && typeof p.equippedGear === 'object')
                        ? { helmet: null, armor: null, belt: null, gloves: null, boots: null, ...p.equippedGear }
                        : { helmet: null, armor: null, belt: null, gloves: null, boots: null };

                    const unlockedGear = Array.isArray(p.unlockedGear) ? p.unlockedGear : [];

                    const stats = (p.stats && typeof p.stats === 'object') ? p.stats : (docData.stats || {});
                    const highScore = parseInt(stats.highScore || docData.highScore || 0, 10);
                    const maxWave = parseInt(stats.maxWave || docData.maxWave || 1, 10);

                    // Reconstruct Master V2 Save
                    const masterSaveV2 = {
                        version: 2,
                        timestamp: Date.now(),
                        player: {
                            name,
                            accountLevel,
                            accountXp,
                            coins,
                            gold: coins,
                            gems,
                            diamonds: gems,
                            selectedHero,
                            unlockedHeroes,
                            selectedSkill,
                            unlockedSkills,
                            skillLevels,
                            upgrades,
                            unlockedPerks,
                            equippedPerks,
                            equippedGear,
                            unlockedGear,
                            stats: {
                                totalKills: stats.totalKills || 0,
                                maxWave: maxWave,
                                highScore: highScore,
                                totalFatmirs: stats.totalFatmirs || docData.fatmirsKilled || 0,
                                totalCasillas: stats.totalCasillas || docData.casillasKilled || 0,
                                totalSkarmogyftos: stats.totalSkarmogyftos || docData.skarmogyftosKilled || 0,
                                matchesPlayed: stats.matchesPlayed || 0,
                                totalTimeSeconds: stats.totalTimeSeconds || 0,
                                heroPlays: stats.heroPlays || { psanas: 0, psogas: 0, petros: 0 }
                            }
                        },
                        settings: {
                            musicVolume: parseFloat(localStorage.getItem('lesaio_music_volume') || '0.7'),
                            sfxVolume: parseFloat(localStorage.getItem('lesaio_sfx_volume') || '0.8'),
                            showPopups: true,
                            showDamage: true,
                            screenShake: true
                        }
                    };

                    // Persist to local storage
                    localStorage.setItem('lesaio_save_v2', JSON.stringify(masterSaveV2));
                    localStorage.setItem('lesaio_coins', coins.toString());
                    localStorage.setItem('lesaio_gems', gems.toString());
                    localStorage.setItem('lesaio_player_name', name);
                    localStorage.setItem('lesaio_account_level', accountLevel.toString());
                    localStorage.setItem('lesaio_account_xp', accountXp.toString());
                    localStorage.setItem('lesaio_selected_hero', selectedHero);
                    localStorage.setItem('lesaio_unlocked_heroes', JSON.stringify(unlockedHeroes));
                    localStorage.setItem('lesaio_skill_levels', JSON.stringify(skillLevels));
                    localStorage.setItem('lesaio_upgrades', JSON.stringify(upgrades));
                    localStorage.setItem('lesaio_unlocked_perks', JSON.stringify(unlockedPerks));
                    localStorage.setItem('lesaio_equipped_perks', JSON.stringify(equippedPerks));
                    localStorage.setItem('lesaio_equipped_gear', JSON.stringify(equippedGear));
                    localStorage.setItem('lesaio_unlocked_gear', JSON.stringify(unlockedGear));
                    localStorage.setItem('lesaio_highscore', highScore.toString());
                    localStorage.setItem('lesaio_max_wave', maxWave.toString());

                    // Mark account linked
                    localStorage.setItem('lesaio_google_linked', 'true');
                    localStorage.setItem('lesaio_google_uid', user.uid);
                    localStorage.setItem('lesaio_google_email', user.email || '');
                    localStorage.setItem('lesaio_google_name', user.displayName || name);
                    localStorage.setItem('lesaio_last_cloud_sync', 'Just now');

                    return {
                        success: true,
                        hasCloudData: true,
                        details: {
                            name,
                            accountLevel,
                            coins,
                            gems,
                            heroesCount: unlockedHeroes.length,
                            gearCount: unlockedGear.length
                        }
                    };
                }
            }

            // Fresh account in Firestore: Upload current local state to cloud
            if (typeof window !== 'undefined' && window.SaveSerializer && window.GameState) {
                const currentPayload = window.SaveSerializer.serialize(window.GameState);
                if (currentPayload) {
                    await docRef.set({
                        ...currentPayload,
                        email: user.email || '',
                        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                }
            }

            localStorage.setItem('lesaio_google_linked', 'true');
            localStorage.setItem('lesaio_google_uid', user.uid);
            localStorage.setItem('lesaio_google_email', user.email || '');
            localStorage.setItem('lesaio_google_name', user.displayName || user.email?.split('@')[0] || 'Google User');
            localStorage.setItem('lesaio_last_cloud_sync', 'Just now');

            return {
                success: true,
                hasCloudData: false,
                isNewAccount: true
            };
        } catch (err) {
            console.error('[AccountSyncManager] Failed to sync down cloud save:', err);
            return { success: false, error: err };
        }
    }

    /**
     * Reset local storage state back to a default guest profile.
     * Does NOT modify or delete the player's remote cloud Firestore document.
     */
    static resetToGuestAccount() {
        const progressionKeys = [
            'lesaio_save_v2',
            'lesaio_player_uid',
            'lesaio_coins',
            'lesaio_gems',
            'lesaio_player_name',
            'lesaio_account_level',
            'lesaio_account_xp',
            'lesaio_selected_hero',
            'lesaio_unlocked_heroes',
            'lesaio_selected_skill',
            'lesaio_unlocked_skills',
            'lesaio_skill_levels',
            'lesaio_upgrades',
            'lesaio_unlocked_perks',
            'lesaio_equipped_perks',
            'lesaio_equipped_gear',
            'lesaio_unlocked_gear',
            'lesaio_stats',
            'lesaio_highscore',
            'lesaio_high_score',
            'lesaio_max_wave',
            'lesaio_total_fatmirs',
            'lesaio_total_casillas',
            'lesaio_total_skarmogyftos',
            'lesaio_cloud_payload',
            'lesaio_last_cloud_sync',
            'lesaio_google_linked',
            'lesaio_google_uid',
            'lesaio_google_email',
            'lesaio_google_name'
        ];

        for (const key of progressionKeys) {
            localStorage.removeItem(key);
        }

        return true;
    }
}

if (typeof window !== 'undefined') {
    window.AccountSyncManager = AccountSyncManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AccountSyncManager };
}
