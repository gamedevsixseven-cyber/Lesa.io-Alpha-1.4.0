/**
 * Lesa.io - Co-op 4-Player Roster & Snapshot Sync Helper
 * Centralizes multi-peer RemotePlayer management, closest-alive targeting,
 * wave revives, squad KO checks, and Host->Guest peers snapshot packing.
 */

class CoopPeerRoster {
    static buildLocalUserData() {
        const gs = (typeof window !== 'undefined') ? window.GameState : null;
        const cs = (typeof window !== 'undefined') ? window.cloudSave : null;
        const fbUser = cs && (cs.currentUser || (cs.auth && cs.auth.currentUser));
        const authName = (fbUser && (fbUser.displayName || (fbUser.email && fbUser.email.split('@')[0]))) || '';
        const heroType = (gs && gs.player && gs.player.selectedHero) || (typeof localStorage !== 'undefined' && localStorage.getItem('lesaio_selected_hero')) || 'psanas';
        const rawName = (gs && gs.player && gs.player.name) || (typeof localStorage !== 'undefined' && localStorage.getItem('lesaio_player_name')) || '';
        const cleanRaw = String(rawName || '').trim();
        const nameChosen = typeof localStorage !== 'undefined' && localStorage.getItem('lesaio_player_name_chosen') === 'true';
        const name = (cleanRaw && (cleanRaw !== 'Psanas' || nameChosen || !authName)) ? cleanRaw : (authName || cleanRaw || 'Hero');
        const weaponType = (typeof WeaponSystem !== 'undefined')
            ? WeaponSystem.resolveEquippedWeapon((typeof HEROES !== 'undefined' && HEROES[heroType]) ? HEROES[heroType].weaponType : 'pea')
            : ((gs && gs.player && (gs.player.selectedWeapon || gs.player.weaponType)) || localStorage.getItem('lesaio_selected_weapon') || 'pea');
        const heroSkin = (typeof HeroSkinSystem !== 'undefined') ? HeroSkinSystem.getActiveSkin(heroType) : 'default';
        const heroStyle = (heroType === 'psgiannhs' && typeof PsgiannhsHero !== 'undefined') ? PsgiannhsHero.getActiveStyle() : null;
        const starBlessed = (typeof HeroStarBlessing !== 'undefined' && HeroStarBlessing.isBlessed) ? !!HeroStarBlessing.isBlessed(heroType) : false;
        const armorEq = (typeof GearManager !== 'undefined' && typeof GearManager.getEquipped === 'function') ? GearManager.getEquipped('armor') : null;
        const equippedArmorId = armorEq ? armorEq.id : null;
        const armorEvolved = !!(equippedArmorId && typeof HeroArmorRenderer !== 'undefined' && HeroArmorRenderer.isEvolved(equippedArmorId));
        const weaponEvolved = !!(typeof WeaponEvolutionManager !== 'undefined' && WeaponEvolutionManager.isEvolved(weaponType));

        let maxHp = (typeof HEROES !== 'undefined' && HEROES[heroType] && HEROES[heroType].hp) || 100;
        const upgrades = (gs && gs.player && gs.player.upgrades) || {};
        maxHp += (upgrades.maxHealth || 0) * 6;
        let damageReduction = (typeof HEROES !== 'undefined' && HEROES[heroType] && HEROES[heroType].damageReduction) || 0;
        let magnetRadius = 140;
        if (typeof GearManager !== 'undefined') {
            const eq = GearManager.getEquippedTotalStats();
            maxHp += (eq.maxHp || 0);
            damageReduction = Math.min(0.55, damageReduction + (eq.damageReduction || 0) / 100);
            magnetRadius += (eq.magnetRadius || 0);
        }
        if (typeof PerkSystem !== 'undefined' && PerkSystem.hasPerk && PerkSystem.hasPerk('zeus_storm_crown')) {
            const st = PerkSystem.getRankStats ? PerkSystem.getRankStats('zeus_storm_crown') : {};
            maxHp = Math.max(25, Math.round(maxHp * (1 - (st.maxHpPenalty || 0.25))));
        }
        if (starBlessed) maxHp = Math.round(maxHp * 1.10);
        if (typeof ClanBuffs !== 'undefined') maxHp = Math.round(maxHp * ClanBuffs.getMaxHpMultiplier());
        const clanRef = (typeof window !== 'undefined' && window.clanService && window.clanService.currentClan) ? window.clanService.currentClan : null;
        return {
            name, heroType, weaponType, heroSkin, heroStyle, starBlessed,
            equippedArmorId, armorEvolved, weaponEvolved,
            clanId: clanRef ? clanRef.id : null, clanTag: clanRef ? clanRef.tag : null,
            maxHp: Math.min(3000, Math.round(maxHp)), damageReduction,
            magnetRadius: Math.max(80, Math.min(400, Math.round(magnetRadius)))
        };
    }

    static initHostRoster(session, game, networkManager, guestInfoOrPeers) {
        session.remotePlayersMap = new Map();
        session.remotePlayers = [];

        let entries = [];
        if (Array.isArray(guestInfoOrPeers) && guestInfoOrPeers.length > 0) {
            entries = guestInfoOrPeers;
        } else if (networkManager && typeof networkManager.getConnectedPeers === 'function' && networkManager.getConnectedPeers().length > 0) {
            entries = networkManager.getConnectedPeers();
        } else {
            const single = guestInfoOrPeers || (networkManager && networkManager.peerUserData) || {};
            const pid = (networkManager && networkManager.conn && networkManager.conn.peer) || 'p2';
            entries = [{ id: pid, ...single }];
        }

        const offsets = [[60, 0], [-60, 0], [0, 65]];
        for (let i = 0; i < entries.length; i++) {
            const info = entries[i] || {};
            const peerId = info.id || `p${i + 2}`;
            const heroType = info.heroType || 'petros';
            const rawName = info.name ? String(info.name).trim() : '';
            const name = rawName || `Player ${i + 2}`;
            const off = offsets[i % offsets.length];
            const rp = new RemotePlayer(game.player.x + off[0], game.player.y + off[1], heroType, name);
            rp.applyHeroStats(heroType, { ...info, name });
            rp.isHost = false;
            rp.peerId = peerId;
            rp.onShieldConsumed = () => {
                if (session.net) session.net.sendTo(peerId, 'GUEST_DROP_EFFECT', { type: 'shield_break' });
            };
            session.remotePlayersMap.set(peerId, rp);
        }
        this._refreshArray(session);
    }

    static initGuestRoster(session, game, networkManager, hostInfo, meta = null) {
        session.remotePlayersMap = new Map();
        session.remotePlayers = [];
        session.myPeerId = (meta && meta.myPeerId) || (networkManager && networkManager.assignedPeerId) || (networkManager && networkManager.peer && networkManager.peer.id) || null;

        const heroType = (hostInfo && hostInfo.heroType) || 'psanas';
        const rawHostName = (hostInfo && hostInfo.name) ? String(hostInfo.name).trim() : '';
        const hostName = rawHostName || 'Host';
        const hostRp = new RemotePlayer(game.player.x - 60, game.player.y, heroType, hostName);
        hostRp.applyHeroStats(heroType, { ...hostInfo, name: hostName });
        hostRp.isHost = true;
        hostRp.peerId = 'host';
        session.remotePlayersMap.set('host', hostRp);

        const initPeers = (meta && Array.isArray(meta.peers)) ? meta.peers : [];
        const offsets = [[60, -40], [-60, 50], [60, 50]];
        for (let i = 0; i < initPeers.length; i++) {
            const g = initPeers[i];
            if (!g || !g.id || (session.myPeerId && g.id === session.myPeerId)) continue;
            const gHero = g.heroType || 'petros';
            const gName = (g.name ? String(g.name).trim() : '') || `Player ${i + 2}`;
            const off = offsets[i % offsets.length];
            const rp = new RemotePlayer(game.player.x + off[0], game.player.y + off[1], gHero, gName);
            rp.applyHeroStats(gHero, { ...g, name: gName });
            rp.isHost = false;
            rp.peerId = g.id;
            session.remotePlayersMap.set(g.id, rp);
        }
        this._refreshArray(session);
    }

    static _refreshArray(session) {
        session.remotePlayers = session.remotePlayersMap ? Array.from(session.remotePlayersMap.values()) : [];
    }

    static getRemotePlayer(session, peerId = null) {
        if (!session) return null;
        if (session.remotePlayersMap) {
            if (peerId && session.remotePlayersMap.has(peerId)) return session.remotePlayersMap.get(peerId);
            if (!session.isHost && session.remotePlayersMap.has('host')) return session.remotePlayersMap.get('host');
        }
        return (Array.isArray(session.remotePlayers) && session.remotePlayers[0]) || session._legacyRemote || null;
    }

    static getActiveRemoteCount(session) {
        if (!session || !Array.isArray(session.remotePlayers)) return 0;
        let count = 0;
        for (let i = 0; i < session.remotePlayers.length; i++) {
            const rp = session.remotePlayers[i];
            if (rp && !rp.isDownedDisconnected) count++;
        }
        return count;
    }

    static getTotalPlayers(session) {
        if (!session) return 1;
        if (!session.isHost && Number.isFinite(session._syncedTotalPlayers) && session._syncedTotalPlayers >= 1) {
            return session._syncedTotalPlayers;
        }
        return 1 + this.getActiveRemoteCount(session);
    }

    static getAlivePlayers(session) {
        const list = [];
        const p1 = session && session.game && session.game.player;
        if (p1 && p1.hp > 0) list.push(p1);
        const rps = (session && Array.isArray(session.remotePlayers)) ? session.remotePlayers : [];
        for (let i = 0; i < rps.length; i++) {
            const rp = rps[i];
            if (rp && !rp.isDowned && !rp.isDownedDisconnected) list.push(rp);
        }
        return list;
    }

    static pickClosestAliveTarget(session, entity, p1) {
        let best = null, bestDistSq = Infinity;
        if (p1 && p1.hp > 0) {
            best = p1;
            bestDistSq = (entity.x - p1.x) ** 2 + (entity.y - p1.y) ** 2;
        }
        const rps = (session && Array.isArray(session.remotePlayers)) ? session.remotePlayers : [];
        for (let i = 0; i < rps.length; i++) {
            const rp = rps[i];
            if (!rp || rp.isDowned || rp.isDownedDisconnected) continue;
            const dSq = (entity.x - rp.x) ** 2 + (entity.y - rp.y) ** 2;
            if (dSq < bestDistSq) { bestDistSq = dSq; best = rp; }
        }
        return best || p1;
    }

    static areAllPlayersDowned(session) {
        const p1 = session && session.game && session.game.player;
        if (!p1 || p1.hp > 0) return false;
        const rps = (session && Array.isArray(session.remotePlayers)) ? session.remotePlayers : [];
        for (let i = 0; i < rps.length; i++) {
            const rp = rps[i];
            if (rp && !rp.isDownedDisconnected && !rp.isDowned) return false;
        }
        return true;
    }

    static handleWaveClearRevives(session) {
        const game = session && session.game;
        if (!game || game.waveState !== 'WAVE_CLEARED') return;
        const p1 = game.player;
        const rps = Array.isArray(session.remotePlayers) ? session.remotePlayers : [];
        const anyAlive = (p1 && p1.hp > 0) || rps.some(rp => rp && !rp.isDowned && !rp.isDownedDisconnected);
        if (!anyAlive) return;

        for (let i = 0; i < rps.length; i++) {
            const rp = rps[i];
            if (rp && rp.isDowned && !rp.isDownedDisconnected) {
                rp.hp = Math.round((rp.maxHp || 100) * 0.5);
                rp.isDowned = false;
                if (game.ui) game.ui.addKillfeed(`🤝 ${rp.name} REVIVED!`);
            }
        }
        if (p1 && p1.hp <= 0) {
            p1.hp = Math.round((p1.maxHp || 100) * 0.5);
            if (game.ui) game.ui.addKillfeed('🤝 YOU WERE REVIVED!');
        }
    }

    static buildHostPeersPayload(session, safeInt, safeFloat) {
        const list = [];
        if (!session || !session.remotePlayersMap) return list;
        for (const [peerId, rp] of session.remotePlayersMap.entries()) {
            if (!rp) continue;
            list.push({
                id: peerId,
                name: rp.name,
                heroType: rp.heroType,
                x: safeInt(rp.x), y: safeInt(rp.y),
                vx: safeFloat(rp.vx, 2, 0), vy: safeFloat(rp.vy, 2, 0),
                angle: safeFloat(rp.angle, 2, 0),
                hp: safeInt(rp.hp, 0, 100000, 0),
                maxHp: safeInt(rp.maxHp, 25, 100000, 100),
                isMoving: !!rp.isMoving,
                shieldActive: !!rp.shieldActive,
                isDashing: !!rp.isDashing,
                isGrabbed: !!rp.isGrabbed,
                isAirborne: !!rp.isAirborne,
                airZ: safeInt(rp.airZ || 0, 0, 400, 0),
                airRot: safeFloat(rp.airRotation || 0, 2, 0),
                weaponType: rp.weaponType,
                equippedArmorId: rp.equippedArmorId || null,
                armorEvolved: !!rp.armorEvolved,
                weaponEvolved: !!rp.weaponEvolved,
                heroSkin: rp.heroSkin || 'default',
                starBlessed: !!rp.starBlessed,
                ultId: rp.ultActive ? (rp.ultId || '') : '',
                vfAng: (rp.vf185Active || rp.cryptonXActive) ? safeFloat((rp.vf185Active ? rp.vf185Angle : rp.cryptonXAngle) || rp.angle || 0, 2, 0) : undefined,
                bubbleCharge: Number((rp.bubbleCharge || 0).toFixed(2)),
                downed: !!rp.isDowned,
                disc: !!rp.isDownedDisconnected
            });
        }
        return list;
    }

    static applyGuestPeersSnapshot(session, data) {
        if (!session || !data || !Array.isArray(data.peers)) return null;
        let myEntry = null, dirty = false;
        for (let i = 0; i < data.peers.length; i++) {
            const pNet = data.peers[i];
            if (!pNet || !pNet.id) continue;
            if (session.myPeerId && pNet.id === session.myPeerId) {
                myEntry = pNet;
                continue;
            }
            // Legacy 2P fallback when only 1 peer exists and myPeerId wasn't assigned
            if (!session.myPeerId && data.peers.length === 1) {
                myEntry = pNet;
                continue;
            }
            let rp = session.remotePlayersMap.get(pNet.id);
            if (!rp && typeof RemotePlayer !== 'undefined') {
                rp = new RemotePlayer(pNet.x || 0, pNet.y || 0, pNet.heroType || 'petros', pNet.name || 'Teammate');
                rp.applyHeroStats(pNet.heroType || 'petros', { name: pNet.name, maxHp: pNet.maxHp });
                rp.isHost = false;
                rp.peerId = pNet.id;
                session.remotePlayersMap.set(pNet.id, rp);
                dirty = true;
            }
            if (rp) {
                rp.setTargetState(pNet);
                rp.isDowned = !!pNet.downed || rp.hp <= 0;
                rp.isDownedDisconnected = !!pNet.disc;
            }
        }
        if (dirty) this._refreshArray(session);
        return myEntry;
    }
}

if (typeof window !== 'undefined') {
    window.CoopPeerRoster = CoopPeerRoster;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CoopPeerRoster };
}
