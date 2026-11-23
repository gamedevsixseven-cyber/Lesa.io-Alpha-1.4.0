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
            const primaryRef = db.collection('players').doc(user.uid);
            const candidates = [];
            const seenIds = new Set();
            const collect = (snap) => {
                if (!snap || !snap.exists || seenIds.has(snap.id)) return;
                seenIds.add(snap.id);
                candidates.push(snap);
            };

            const primarySnap = await primaryRef.get().catch(() => null);
            collect(primarySnap);

            // Check sibling / email docs safely by progression score instead of .limit(1)
            const extraLookups = [
                db.collection('players').where('uid', '==', user.uid).limit(5).get().catch(() => null)
            ];
            if (user.email) {
                extraLookups.push(db.collection('players').doc(user.email.toLowerCase()).get().catch(() => null));
                extraLookups.push(db.collection('players').where('email', '==', user.email).limit(10).get().catch(() => null));
            }
            const extraRes = await Promise.all(extraLookups);
            extraRes.forEach((res) => {
                if (!res) return;
                if (typeof res.forEach === 'function') res.forEach(collect);
                else collect(res);
            });

            const scoreDoc = (d) => (typeof SaveMigration !== 'undefined' && typeof SaveMigration.scoreCloudDoc === 'function')
                ? SaveMigration.scoreCloudDoc(d)
                : ((Number(d && (d.level || (d.player && d.player.accountLevel))) || 1) * 1000);
            const tsOf = (v) => (typeof SaveMigration !== 'undefined' && typeof SaveMigration._parseTsValue === 'function')
                ? SaveMigration._parseTsValue(v) : 0;

            let doc = primarySnap && primarySnap.exists ? primarySnap : null;
            const docRef = primaryRef;
            const primaryWipedAt = doc ? tsOf(doc.data() && doc.data().wipedByDevAt) : 0;
            if (candidates.length > 0) {
                const scored = candidates
                    .map((s) => ({ snap: s, data: s.data() || {}, score: scoreDoc(s.data() || {}) }))
                    .filter((item) => !primaryWipedAt || item.snap.id === user.uid || tsOf(item.data.lastUpdated) > primaryWipedAt)
                    .sort((a, b) => (b.score - a.score) || ((a.snap.id === user.uid ? 1 : 0) - (b.snap.id === user.uid ? 1 : 0)) * -1);
                if (scored.length > 0 && (!doc || scored[0].score > scoreDoc(doc.data() || {}))) {
                    doc = scored[0].snap;
                }
            }

            if (doc && doc.exists) {
                const docData = doc.data() || {};
                const p = (typeof SaveMigration !== 'undefined' && typeof SaveMigration.extractNormalizedPlayer === 'function')
                    ? SaveMigration.extractNormalizedPlayer(docData)
                    : (docData.player || docData);

                const hasSavedProgress = (
                    p.coins !== undefined ||
                    p.gems !== undefined ||
                    p.diamonds !== undefined ||
                    p.gold !== undefined ||
                    p.unlockedHeroes !== undefined ||
                    p.unlockedGear !== undefined ||
                    p.gearLevels !== undefined ||
                    p.evolvedGear !== undefined ||
                    p.evolvedWeapons !== undefined ||
                    p.evolutionStones !== undefined ||
                    p.accountLevel !== undefined ||
                    p.level !== undefined ||
                    docData.coins !== undefined ||
                    docData.gems !== undefined ||
                    docData.diamonds !== undefined ||
                    docData.lbHighScore !== undefined ||
                    docData.lbTotalKills !== undefined
                );

                if (hasSavedProgress) {
                    const localEstablished = (typeof SaveMigration !== 'undefined') && SaveMigration.hasEstablishedProgress();
                    const sj = (k, fb) => (typeof SaveSerializer !== 'undefined') ? SaveSerializer._safeJson(k, fb) : fb;
                    const si = (k, fb, min = 0) => (typeof SaveMigration !== 'undefined') ? SaveMigration.safeGetInt(k, fb, min) : fb;

                    const cloudCoins = parseInt(p.coins ?? p.gold ?? docData.coins ?? docData.gold ?? 0, 10) || 0;
                    const cloudGems = parseInt(p.gems ?? p.diamonds ?? docData.gems ?? docData.diamonds ?? 0, 10) || 0;
                    const cloudLvl = parseInt(p.accountLevel ?? p.level ?? docData.level ?? 1, 10) || 1;
                    const coins = localEstablished ? Math.max(cloudCoins, si('lesaio_coins', 0, 0)) : cloudCoins;
                    const gems = localEstablished ? Math.max(cloudGems, si('lesaio_gems', 0, 0)) : cloudGems;
                    const accountLevel = localEstablished ? Math.max(cloudLvl, si('lesaio_account_level', 1, 1)) : cloudLvl;
                    const accountXp = accountLevel > cloudLvl ? si('lesaio_account_xp', 0, 0) : (parseInt(p.accountXp ?? p.xp ?? docData.xp ?? 0, 10) || 0);
                    const localName = localStorage.getItem('lesaio_player_name');
                    const name = (localEstablished && localName && localName !== 'Psanas') ? localName : (p.name || p.playerName || docData.playerName || user.displayName || user.email?.split('@')[0] || 'Psanas');
                    const selectedHero = (localEstablished && localStorage.getItem('lesaio_selected_hero')) || p.selectedHero || docData.selectedHero || 'psanas';
                    const heroStyles = (p.heroStyles && typeof p.heroStyles === 'object') ? { ...p.heroStyles } : ((docData.heroStyles && typeof docData.heroStyles === 'object') ? { ...docData.heroStyles } : {});
                    if (localStorage.getItem('lesaio_hero_style_psgiannhs') && !heroStyles.psgiannhs) heroStyles.psgiannhs = localStorage.getItem('lesaio_hero_style_psgiannhs');

                    let unlockedHeroes = ['psanas'];
                    if (Array.isArray(p.unlockedHeroes)) unlockedHeroes = p.unlockedHeroes;
                    else if (Array.isArray(docData.unlockedHeroes)) unlockedHeroes = docData.unlockedHeroes;
                    else if (typeof docData.unlockedHeroes === 'string') { try { unlockedHeroes = JSON.parse(docData.unlockedHeroes); } catch (e) {} }
                    if (localEstablished) unlockedHeroes = Array.from(new Set([...unlockedHeroes, ...sj('lesaio_unlocked_heroes', [])]));
                    if (!unlockedHeroes.includes('psanas')) unlockedHeroes.unshift('psanas');

                    const selectedSkill = (localEstablished && localStorage.getItem('lesaio_selected_skill')) || p.selectedSkill || docData.selectedSkill || 'blade_rush';
                    let unlockedSkills = Array.isArray(p.unlockedSkills) ? p.unlockedSkills : ['blade_rush', 'nerobalonaki'];
                    if (localEstablished) unlockedSkills = Array.from(new Set([...unlockedSkills, ...sj('lesaio_unlocked_skills', [])]));
                    const selectedWeapon = (localEstablished && localStorage.getItem('lesaio_selected_weapon')) || p.selectedWeapon || p.weaponType || docData.selectedWeapon || 'pea';
                    let unlockedWeapons = Array.isArray(p.unlockedWeapons) ? p.unlockedWeapons : (Array.isArray(docData.unlockedWeapons) ? docData.unlockedWeapons : ['pea']);
                    if (localEstablished) unlockedWeapons = Array.from(new Set([...unlockedWeapons, ...sj('lesaio_unlocked_weapons', [])]));
                    const olympianStarStones = Math.max(parseInt(p.olympianStarStones ?? docData.olympianStarStones ?? 0, 10) || 0, localEstablished ? si('lesaio_olympian_star_stones', 0, 0) : 0);
                    const evolutionStones = Math.max(parseInt(p.evolutionStones ?? docData.evolutionStones ?? 0, 10) || 0, localEstablished ? si('lesaio_evolution_stones', 0, 0) : 0);
                    const ascentCrests = (p.ascentCrests !== undefined || docData.ascentCrests !== undefined)
                        ? (parseInt(p.ascentCrests ?? docData.ascentCrests ?? 0, 10) || 0)
                        : undefined;
                    const ascentCrestsDate = p.ascentCrestsDate || docData.ascentCrestsDate || '';

                    const skillLevels = { ...(p.skillLevels || docData.skillLevels || { blade_rush: 1, nerobalonaki: 1 }) };
                    if (localEstablished) {
                        for (const [k, v] of Object.entries(sj('lesaio_skill_levels', {}))) {
                            skillLevels[k] = Math.max(parseInt(skillLevels[k], 10) || 1, parseInt(v, 10) || 1);
                        }
                    }
                    const upgrades = { ...(p.upgrades || { critChance: 0, critDamage: 0, maxHealth: 0, goldBonus: 0 }) };
                    if (localEstablished) {
                        for (const [k, v] of Object.entries(sj('lesaio_upgrades', {}))) {
                            upgrades[k] = Math.max(parseInt(upgrades[k], 10) || 0, parseInt(v, 10) || 0);
                        }
                    }

                    const unlockedPerks = Array.from(new Set([...(Array.isArray(p.unlockedPerks) ? p.unlockedPerks : []), ...(localEstablished ? sj('lesaio_unlocked_perks', []) : [])]));
                    const equippedPerks = Array.isArray(p.equippedPerks) ? p.equippedPerks.slice(0, 3) : [null, null, null];
                    while (equippedPerks.length < 3) equippedPerks.push(null);
                    const perkRanks = (typeof PerkProgression !== 'undefined')
                        ? PerkProgression.mergePerkRanks(localEstablished ? sj('lesaio_perk_ranks', {}) : {}, p.perkRanks || {}, unlockedPerks)
                        : { ...(localEstablished ? sj('lesaio_perk_ranks', {}) : {}), ...(p.perkRanks || {}) };
                    const combatFeats = (typeof PerkProgression !== 'undefined')
                        ? PerkProgression.mergeFeats(localEstablished ? sj('lesaio_combat_feats', {}) : {}, p.combatFeats || {})
                        : { ...(localEstablished ? sj('lesaio_combat_feats', {}) : {}), ...(p.combatFeats || {}) };

                    const equippedGear = (p.equippedGear && typeof p.equippedGear === 'object')
                        ? { helmet: null, armor: null, belt: null, gloves: null, boots: null, ...p.equippedGear }
                        : { helmet: null, armor: null, belt: null, gloves: null, boots: null };

                    const unlockedGear = Array.from(new Set([...(Array.isArray(p.unlockedGear) ? p.unlockedGear : []), ...(localEstablished ? sj('lesaio_unlocked_gear', []) : [])]));
                    const gearLevels = { ...(p.gearLevels && typeof p.gearLevels === 'object' && !Array.isArray(p.gearLevels) ? p.gearLevels : {}) };
                    if (localEstablished) {
                        for (const [gid, lvl] of Object.entries(sj('lesaio_gear_levels', {}))) {
                            gearLevels[gid] = Math.max(parseInt(gearLevels[gid], 10) || 1, parseInt(lvl, 10) || 1);
                        }
                    }
                    const evolvedGear = Array.from(new Set([...(Array.isArray(p.evolvedGear) ? p.evolvedGear : []), ...(localEstablished ? sj('lesaio_evolved_gear', []) : [])]));
                    const ascendedGear = Array.from(new Set([...(Array.isArray(p.ascendedGear) ? p.ascendedGear : []), ...(localEstablished ? sj('lesaio_ascended_gear', []) : [])]));
                    const evolvedWeapons = Array.from(new Set([...(Array.isArray(p.evolvedWeapons) ? p.evolvedWeapons : []), ...(localEstablished ? sj('lesaio_evolved_weapons', []) : [])]));
                    const starBlessedHeroes = Array.from(new Set([...(Array.isArray(p.starBlessedHeroes) ? p.starBlessedHeroes : []), ...(localEstablished ? sj('lesaio_star_blessed_heroes', []) : [])]));
                    const rawMats = (p.inventory && p.inventory.materials) || p.materials || {};
                    const materials = (typeof MaterialRegistry !== 'undefined')
                        ? MaterialRegistry.normalizeMap(rawMats)
                        : { ...rawMats };

                    const stats = (p.stats && typeof p.stats === 'object') ? p.stats : (docData.stats || {});
                    const social = (docData.socialStats && typeof docData.socialStats === 'object') ? docData.socialStats : {};
                    const highScore = Math.max(parseInt(stats.highScore || docData.lbHighScore || social.highScore || docData.highScore || 0, 10) || 0, localEstablished ? si('lesaio_highscore', 0, 0) : 0);
                    const totalKills = Math.max(parseInt(stats.totalKills || docData.lbTotalKills || social.totalKills || docData.totalKills || 0, 10) || 0, localEstablished ? si('lesaio_total_kills', 0, 0) : 0);
                    const maxWave = Math.max(parseInt(stats.maxWave || docData.lbEndlessWave || social.maxWave || docData.maxWave || 1, 10) || 1, localEstablished ? si('lesaio_max_wave', 1, 1) : 1);

                    // Reconstruct Master Save (preserving full inventory, cosmetics, chests, battlePass, skins)
                    const masterSaveV2 = {
                        version: 3,
                        timestamp: Date.now(),
                        player: {
                            name, accountLevel, accountXp, coins, gold: coins, gems, diamonds: gems,
                            selectedHero, heroStyles, unlockedHeroes, selectedWeapon, unlockedWeapons,
                            olympianStarStones, evolutionStones,
                            ascentCrests: ascentCrests !== undefined ? ascentCrests : (window.ascentCrestManager ? window.ascentCrestManager.count : 0),
                            ascentCrestsDate: ascentCrestsDate || (window.ascentCrestManager ? window.ascentCrestManager.lastDailyDate : ''),
                            selectedSkill, unlockedSkills, skillLevels, upgrades, unlockedPerks, equippedPerks,
                            perkRanks, combatFeats, equippedGear, unlockedGear, gearLevels, evolvedGear,
                            ascendedGear, evolvedWeapons, starBlessedHeroes, materials,
                            inventory: p.inventory || null,
                            cosmetics: p.cosmetics || null,
                            heroSkins: p.heroSkins || null,
                            battlePass: p.battlePass || null,
                            chestSlots: p.chestSlots || null,
                            pendingBossRewards: p.pendingBossRewards || null,
                            flags: p.flags || null,
                            stats: {
                                totalKills,
                                maxWave, highScore,
                                totalFatmirs: Math.max(stats.totalFatmirs || docData.fatmirsKilled || 0, localEstablished ? si('lesaio_total_fatmirs', 0, 0) : 0),
                                totalCasillas: Math.max(stats.totalCasillas || docData.casillasKilled || 0, localEstablished ? si('lesaio_total_casillas', 0, 0) : 0),
                                totalSkarmogyftos: Math.max(stats.totalSkarmogyftos || docData.skarmogyftosKilled || 0, localEstablished ? si('lesaio_total_skarmogyftos', 0, 0) : 0),
                                matchesPlayed: Math.max(stats.matchesPlayed || 0, localEstablished ? si('lesaio_matches_played', 0, 0) : 0),
                                totalTimeSeconds: Math.max(stats.totalTimeSeconds || 0, localEstablished ? si('lesaio_total_time_seconds', 0, 0) : 0),
                                heroPlays: stats.heroPlays || { psanas: 0, psogas: 0, petros: 0 }
                            }
                        },
                        settings: {
                            musicVolume: parseFloat(localStorage.getItem('lesaio_music_volume') || '0.7'),
                            sfxVolume: parseFloat(localStorage.getItem('lesaio_sfx_volume') || '0.8'),
                            showPopups: true,
                            showDamage: true,
                            screenShake: true,
                            privateLoadout: Boolean((docData.settings && docData.settings.privateLoadout) || (docData.publicLoadout && docData.publicLoadout.private))
                        }
                    };

                    if (masterSaveV2.settings && typeof masterSaveV2.settings.privateLoadout === 'boolean') {
                        localStorage.setItem('lesaio_private_loadout', String(masterSaveV2.settings.privateLoadout));
                    }
                    // Persist to local storage
                    localStorage.setItem('lesaio_save_v2', JSON.stringify(masterSaveV2));
                    if (typeof SaveMigration !== 'undefined') SaveMigration.writeBackup(masterSaveV2);
                    localStorage.setItem('lesaio_coins', coins.toString());
                    localStorage.setItem('lesaio_gems', gems.toString());
                    localStorage.setItem('lesaio_player_name', name);
                    if (name && name.trim() && name.trim() !== 'Psanas') {
                        localStorage.setItem('lesaio_player_name_chosen', 'true');
                    }
                    localStorage.setItem('lesaio_account_level', accountLevel.toString());
                    localStorage.setItem('lesaio_account_xp', accountXp.toString());
                    localStorage.setItem('lesaio_selected_hero', selectedHero);
                    if (heroStyles && heroStyles.psgiannhs) {
                        localStorage.setItem('lesaio_hero_style_psgiannhs', heroStyles.psgiannhs);
                    }
                    localStorage.setItem('lesaio_unlocked_heroes', JSON.stringify(unlockedHeroes));
                    localStorage.setItem('lesaio_selected_weapon', selectedWeapon);
                    localStorage.setItem('lesaio_unlocked_weapons', JSON.stringify(unlockedWeapons));
                    if (unlockedWeapons.includes('bubble')) {
                        localStorage.setItem('lesaio_weapon_bubble_unlocked', 'true');
                    }
                    localStorage.setItem('lesaio_olympian_star_stones', olympianStarStones.toString());
                    localStorage.setItem('lesaio_evolution_stones', evolutionStones.toString());
                    if (ascentCrests !== undefined) {
                        localStorage.setItem('lesaio_ascent_crests', String(Math.max(0, Math.min(3, ascentCrests))));
                    }
                    if (ascentCrestsDate) {
                        localStorage.setItem('lesaio_ascent_crests_date', ascentCrestsDate);
                    }
                    if (typeof window !== 'undefined' && window.ascentCrestManager && typeof window.ascentCrestManager.syncExternalState === 'function') {
                        window.ascentCrestManager.syncExternalState(ascentCrests, ascentCrestsDate);
                    }
                    localStorage.setItem('lesaio_selected_skill', selectedSkill);
                    localStorage.setItem('lesaio_unlocked_skills', JSON.stringify(unlockedSkills));
                    localStorage.setItem('lesaio_skill_levels', JSON.stringify(skillLevels));
                    localStorage.setItem('lesaio_upgrades', JSON.stringify(upgrades));
                    localStorage.setItem('lesaio_unlocked_perks', JSON.stringify(unlockedPerks));
                    localStorage.setItem('lesaio_equipped_perks', JSON.stringify(equippedPerks));
                    localStorage.setItem('lesaio_perk_ranks', JSON.stringify(perkRanks));
                    localStorage.setItem('lesaio_combat_feats', JSON.stringify(combatFeats));
                    localStorage.setItem('lesaio_equipped_gear', JSON.stringify(equippedGear));
                    localStorage.setItem('lesaio_unlocked_gear', JSON.stringify(unlockedGear));
                    localStorage.setItem('lesaio_gear_levels', JSON.stringify(gearLevels));
                    localStorage.setItem('lesaio_evolved_gear', JSON.stringify(evolvedGear));
                    localStorage.setItem('lesaio_ascended_gear', JSON.stringify(ascendedGear));
                    if (typeof GearUpgradeManager !== 'undefined' && typeof GearUpgradeManager.setAscendedList === 'function') GearUpgradeManager.setAscendedList(ascendedGear);
                    localStorage.setItem('lesaio_evolved_weapons', JSON.stringify(evolvedWeapons));
                    localStorage.setItem('lesaio_star_blessed_heroes', JSON.stringify(starBlessedHeroes));
                    if (typeof HeroStarBlessing !== 'undefined') HeroStarBlessing.setBlessedList(starBlessedHeroes);
                    if (p.cosmetics && typeof p.cosmetics === 'object' && typeof CosmeticManager !== 'undefined') {
                        CosmeticManager.saveState(p.cosmetics, false);
                    }
                    if (p.heroSkins && typeof p.heroSkins === 'object' && typeof HeroSkinSystem !== 'undefined') {
                        HeroSkinSystem.applyState(p.heroSkins);
                    }
                    if (p.battlePass && typeof p.battlePass === 'object') {
                        if (typeof window !== 'undefined' && window.battlePassManager) window.battlePassManager.applyState(p.battlePass);
                        else localStorage.setItem('lesaio_battle_pass_s1', JSON.stringify(p.battlePass));
                    }
                    try {
                        const existingInv = JSON.parse(localStorage.getItem('lesaio_inventory') || '{}');
                        const mergedCrates = { ...(existingInv.crates || {}) };
                        for (const [k, v] of Object.entries((p.inventory && p.inventory.crates) || {})) mergedCrates[k] = Math.max(mergedCrates[k] || 0, parseInt(v, 10) || 0);
                        const mergedChests = { ...(existingInv.chests || {}) };
                        for (const [k, v] of Object.entries((p.inventory && p.inventory.chests) || {})) mergedChests[k] = Math.max(mergedChests[k] || 0, parseInt(v, 10) || 0);
                        const mergedMats = { ...(existingInv.materials || {}) };
                        for (const [k, v] of Object.entries(materials)) mergedMats[k] = Math.max(mergedMats[k] || 0, parseInt(v, 10) || 0);
                        localStorage.setItem('lesaio_inventory', JSON.stringify({ version: 2, updatedAt: Date.now(), crates: mergedCrates, chests: mergedChests, materials: mergedMats }));
                        if (typeof window !== 'undefined' && window.inventoryManager && typeof window.inventoryManager.load === 'function') {
                            window.inventoryManager.load();
                        }
                    } catch (e) {}
                    if (Array.isArray(p.chestSlots) && p.chestSlots.length === 4) {
                        const curSlots = sj('lesaio_chest_slots', [null, null, null, null]);
                        if (!Array.isArray(curSlots) || curSlots.every(s => !s)) {
                            localStorage.setItem('lesaio_chest_slots', JSON.stringify(p.chestSlots));
                        }
                    }
                    if (Array.isArray(p.pendingBossRewards) && p.pendingBossRewards.length > 0) {
                        const curPend = sj('lesaio_pending_boss_rewards', []);
                        const seen = new Set(curPend.map(x => x && `${x.category}:${x.id}`));
                        const mergedPend = [...curPend];
                        for (const x of p.pendingBossRewards) {
                            const k = x && `${x.category}:${x.id}`;
                            if (k && !seen.has(k)) { seen.add(k); mergedPend.push(x); }
                        }
                        localStorage.setItem('lesaio_pending_boss_rewards', JSON.stringify(mergedPend));
                    }
                    if (p.flags && typeof p.flags === 'object') {
                        if (p.flags.starterPackPurchased) localStorage.setItem('lesaio_starter_pack_purchased', 'true');
                        if (p.flags.tributeClaimed) localStorage.setItem('lesaio_mazonakis_tribute_claimed', 'true');
                        if (p.flags.bubbleMailClaimed) { localStorage.setItem('lesaio_alpha_bubble_mail_claimed', 'true'); localStorage.setItem('lesaio_weapon_bubble_unlocked', 'true'); }
                    }
                    localStorage.setItem('lesaio_highscore', highScore.toString());
                    localStorage.setItem('lesaio_max_wave', maxWave.toString());
                    localStorage.setItem('lesaio_total_kills', (masterSaveV2.player.stats.totalKills || 0).toString());
                    localStorage.setItem('lesaio_total_fatmirs', (masterSaveV2.player.stats.totalFatmirs || 0).toString());
                    localStorage.setItem('lesaio_total_casillas', (masterSaveV2.player.stats.totalCasillas || 0).toString());
                    localStorage.setItem('lesaio_total_skarmogyftos', (masterSaveV2.player.stats.totalSkarmogyftos || 0).toString());
                    localStorage.setItem('lesaio_matches_played', (masterSaveV2.player.stats.matchesPlayed || 0).toString());
                    localStorage.setItem('lesaio_total_time_seconds', (masterSaveV2.player.stats.totalTimeSeconds || 0).toString());
                    if (stats.heroPlays) {
                        localStorage.setItem('lesaio_hero_plays', JSON.stringify(stats.heroPlays));
                    }

                    // Mark account linked, hydrate live GameState in memory, and migrate/push only if needed
                    localStorage.setItem('lesaio_google_linked', 'true');
                    localStorage.setItem('lesaio_google_uid', user.uid);
                    localStorage.setItem('lesaio_google_email', user.email || '');
                    localStorage.setItem('lesaio_google_name', user.displayName || name);
                    localStorage.setItem('lesaio_last_cloud_sync', 'Just now');
                    if (typeof window !== 'undefined') {
                        if (window.GameState && typeof SaveSerializer !== 'undefined') {
                            SaveSerializer.deserialize(masterSaveV2, window.GameState);
                        }
                        if (window.cloudSave) {
                            window.cloudSave.lastCloudData = masterSaveV2;
                            window.cloudSave.hasCompletedInitialSync = true;
                        }
                    }
                    if (localEstablished || doc.id !== user.uid) {
                        const safeDoc = (typeof SaveMigration !== 'undefined' && typeof SaveMigration.mergeMonotonicCloudPayload === 'function')
                            ? SaveMigration.mergeMonotonicCloudPayload(masterSaveV2, docData)
                            : masterSaveV2;
                        await docRef.set({
                            ...safeDoc,
                            uid: user.uid,
                            email: user.email || '',
                            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                        }, { merge: true }).catch(() => {});
                    }

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

            // Fresh account in Firestore: Upload current local state cleanly (preserving any partial fields if doc exists)
            if (typeof window !== 'undefined' && window.SaveSerializer && window.GameState) {
                const baseline = (doc && doc.exists) ? (doc.data() || {}) : null;
                const fTag = (typeof PlayerIdentity !== 'undefined') ? PlayerIdentity.getOnlineTag(user.uid) : '#HERO00';
                const fTagClean = (typeof PlayerIdentity !== 'undefined') ? PlayerIdentity.normalizeTag(fTag) : 'HERO00';
                const currentPayload = (typeof window.SaveSerializer.buildCloudPayload === 'function')
                    ? window.SaveSerializer.buildCloudPayload({}, user, { friendTag: fTag, friendTagClean: fTagClean }, baseline)
                    : window.SaveSerializer.serialize(window.GameState);
                if (currentPayload) {
                    await docRef.set({
                        ...currentPayload,
                        uid: user.uid,
                        email: user.email || '',
                        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                    if (window.cloudSave) {
                        window.cloudSave.lastCloudData = currentPayload;
                        window.cloudSave.hasCompletedInitialSync = true;
                    }
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
        if (typeof window !== 'undefined') window._lesaioSuppressUnloadSave = true;
        const progressionKeys = [
            'lesaio_save_v2',
            'lesaio_save_v2_backup',
            'lesaio_save_pre_update_backup',
            'lesaio_save_schema_version',
            'lesaio_app_version_seen',
            'lesaio_last_local_save_at',
            'lesaio_player_uid',
            'lesaio_coins',
            'lesaio_gems',
            'lesaio_player_name',
            'lesaio_player_name_chosen',
            'lesaio_player_level',
            'lesaio_account_level',
            'lesaio_account_xp',
            'lesaio_selected_hero',
            'lesaio_hero_style_psgiannhs',
            'lesaio_hero_skins',
            'lesaio_unlocked_hero_skins',
            'lesaio_battle_pass_s1',
            'lesaio_unlocked_heroes',
            'lesaio_selected_skill',
            'lesaio_unlocked_skills',
            'lesaio_skill_levels',
            'lesaio_selected_weapon',
            'lesaio_unlocked_weapons',
            'lesaio_weapon_bubble_unlocked',
            'lesaio_evolved_weapons',
            'lesaio_upgrades',
            'lesaio_unlocked_perks',
            'lesaio_equipped_perks',
            'lesaio_perk_ranks',
            'lesaio_combat_feats',
            'lesaio_equipped_gear',
            'lesaio_unlocked_gear',
            'lesaio_gear_levels',
            'lesaio_evolved_gear',
            'lesaio_ascended_gear',
            'lesaio_evolution_stones',
            'lesaio_star_blessed_heroes',
            'lesaio_inventory',
            'lesaio_chest_slots',
            'lesaio_olympian_star_stones',
            'lesaio_equipped_banner',
            'lesaio_equipped_frame',
            'lesaio_displayed_coins',
            'lesaio_unlocked_banners',
            'lesaio_unlocked_frames',
            'lesaio_unlocked_coins',
            'lesaio_ascent_crests',
            'lesaio_ascent_crests_date',
            'lesaio_quests_data',
            'lesaio_quests_date',
            'lesaio_daily_free_skip_date',
            'lesaio_pending_boss_rewards',
            'lesaio_mazonakis_tribute_claimed',
            'lesaio_starter_pack_purchased',
            'lesaio_starter_pack_start',
            'lesaio_alpha_bubble_mail_claimed',
            'lesaio_alpha_mail_claimed',
            'lesaio_alpha11_mail_claimed',
            'lesaio_alpha12_mail_claimed',
            'lesaio_alpha13_mail_claimed',
            'lesaio_alpha14_mail_claimed',
            'lesaio_custom_mails',
            'lesaio_last_dev_mail',
            'lesaio_claimed_names',
            'lesaio_stats',
            'lesaio_highscore',
            'lesaio_high_score',
            'lesaio_max_wave',
            'lesaio_total_kills',
            'lesaio_total_fatmirs',
            'lesaio_total_casillas',
            'lesaio_total_skarmogyftos',
            'lesaio_matches_played',
            'lesaio_total_time_seconds',
            'lesaio_hero_plays',
            'lesaio_cloud_payload',
            'lesaio_last_cloud_sync',
            'lesaio_private_loadout',
            'lesaio_google_linked',
            'lesaio_google_uid',
            'lesaio_google_email',
            'lesaio_google_name'
        ];

        for (const key of progressionKeys) {
            localStorage.removeItem(key);
        }
        try {
            for (const key of Object.keys(localStorage)) {
                if (key.startsWith('lesaio_mail_')) localStorage.removeItem(key);
            }
        } catch (e) {}
        if (typeof window !== 'undefined' && window.GameState && window.GameState.player) {
            window.GameState.player.cosmetics = {
                equippedBanner: 'banner_recruit', equippedFrame: 'frame_rookie',
                displayedCoins: [], unlockedBanners: ['banner_recruit'],
                unlockedFrames: ['frame_rookie'], unlockedCoins: []
            };
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
