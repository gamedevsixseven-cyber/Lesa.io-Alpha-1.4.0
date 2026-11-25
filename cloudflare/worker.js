/**
 * Lesa.io - Cloudflare Worker + D1 Backend API (Zero Dependencies)
 * Paste this entire file into Cloudflare Dashboard -> Workers -> lesaio-api -> Edit code -> Deploy.
 * Requires D1 database binding named: DB
 */

let _schemaReady = false;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json; charset=utf-8'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

function cleanStr(v, max = 64) {
  return String(v == null ? '' : v).replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
}

function validUid(uid) {
  return typeof uid === 'string' && /^[a-zA-Z0-9_@.-]{3,120}$/.test(uid);
}

function validClanId(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{3,80}$/.test(id);
}

function getIsoWeekKey() {
  const d = new Date();
  const u = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = u.getUTCDay() || 7;
  u.setUTCDate(u.getUTCDate() + 4 - day);
  const ys = new Date(Date.UTC(u.getUTCFullYear(), 0, 1));
  const wk = Math.ceil((((u.getTime() - ys.getTime()) / 86400000) + 1) / 7);
  return `${u.getUTCFullYear()}-W${String(wk).padStart(2, '0')}`;
}

function clanLevelFromXp(xp) {
  const caps = [0, 2500, 6500, 13000, 22000, 35000, 52000, 75000, 105000, 145000];
  let lvl = 1;
  for (let i = 0; i < caps.length; i++) {
    if (xp >= caps[i]) lvl = i + 1;
  }
  return lvl;
}

function roleRank(role) {
  return ({ leader: 4, co_leader: 3, officer: 2, member: 1 }[role]) || 1;
}

function roleLabel(role) {
  return ({ leader: 'Leader', co_leader: 'Co-Leader', officer: 'Officer', member: 'Member' }[role]) || 'Member';
}

async function ensureSchema(db) {
  if (_schemaReady) return;
  const stmts = [
    `CREATE TABLE IF NOT EXISTS players (
      uid TEXT PRIMARY KEY, playerName TEXT NOT NULL DEFAULT 'Hero', playerNameLower TEXT NOT NULL DEFAULT 'hero',
      friendTag TEXT NOT NULL DEFAULT '', friendTagClean TEXT NOT NULL DEFAULT '', level INTEGER NOT NULL DEFAULT 1,
      selectedHero TEXT NOT NULL DEFAULT 'psanas', lbHighScore INTEGER NOT NULL DEFAULT 0,
      lbEndlessWave INTEGER NOT NULL DEFAULT 0, lbTotalKills INTEGER NOT NULL DEFAULT 0,
      clanId TEXT, clanTag TEXT, clanName TEXT, lastSeenAt INTEGER NOT NULL DEFAULT 0,
      updatedAt INTEGER NOT NULL DEFAULT 0, dataJson TEXT NOT NULL DEFAULT '{}'
    )`,
    `CREATE INDEX IF NOT EXISTS idx_players_hs ON players(lbHighScore DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_players_ew ON players(lbEndlessWave DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_players_tk ON players(lbTotalKills DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_players_seen ON players(lastSeenAt DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_players_tag ON players(friendTagClean)`,
    `CREATE INDEX IF NOT EXISTS idx_players_name ON players(playerNameLower)`,
    `CREATE TABLE IF NOT EXISTS clans (
      id TEXT PRIMARY KEY, tag TEXT NOT NULL UNIQUE, name TEXT NOT NULL, nameLower TEXT NOT NULL,
      leaderUid TEXT NOT NULL, xp INTEGER NOT NULL DEFAULT 0, level INTEGER NOT NULL DEFAULT 1,
      memberCount INTEGER NOT NULL DEFAULT 1, joinMode TEXT NOT NULL DEFAULT 'open',
      updatedAt INTEGER NOT NULL DEFAULT 0, dataJson TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_clans_xp ON clans(xp DESC)`,
    `CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT, channel TEXT NOT NULL, senderUid TEXT NOT NULL,
      senderName TEXT NOT NULL, senderHero TEXT NOT NULL DEFAULT 'psanas',
      senderRole TEXT NOT NULL DEFAULT 'member', senderLevel INTEGER NOT NULL DEFAULT 1,
      text TEXT NOT NULL, createdAt INTEGER NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_msgs_chan ON messages(channel, createdAt DESC)`
  ];
  await db.batch(stmts.map((s) => db.prepare(s)));
  _schemaReady = true;
}

function parseClanRow(row) {
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.dataJson || '{}');
    return { id: row.id, ...parsed, xp: row.xp, level: row.level, memberCount: row.memberCount, leaderUid: row.leaderUid };
  } catch (_) {
    return null;
  }
}

async function saveClanObj(db, clan) {
  const members = clan.members && typeof clan.members === 'object' ? clan.members : {};
  clan.memberCount = Object.keys(members).length;
  clan.level = clanLevelFromXp(Number(clan.xp) || 0);
  const now = Date.now();
  await db.prepare(
    `INSERT INTO clans (id, tag, name, nameLower, leaderUid, xp, level, memberCount, joinMode, updatedAt, dataJson)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
     ON CONFLICT(id) DO UPDATE SET tag=excluded.tag, name=excluded.name, nameLower=excluded.nameLower,
       leaderUid=excluded.leaderUid, xp=excluded.xp, level=excluded.level, memberCount=excluded.memberCount,
       joinMode=excluded.joinMode, updatedAt=excluded.updatedAt, dataJson=excluded.dataJson`
  ).bind(
    clan.id, clan.tag, clan.name, String(clan.name || '').toLowerCase(),
    clan.leaderUid, Number(clan.xp) || 0, clan.level, clan.memberCount,
    clan.joinMode === 'request' ? 'request' : 'open', now, JSON.stringify(clan)
  ).run();
  return clan;
}

async function syncPlayerClanFields(db, uid, clanOrNull) {
  if (!validUid(uid)) return;
  try {
    const row = await db.prepare('SELECT dataJson FROM players WHERE uid = ?1').bind(uid).first();
    if (!row) return;
    let doc = {};
    try { doc = JSON.parse(row.dataJson || '{}'); } catch (_) { }
    const clanId = clanOrNull ? clanOrNull.id : null;
    const clanTag = clanOrNull ? clanOrNull.tag : null;
    const clanName = clanOrNull ? clanOrNull.name : null;
    doc.clanId = clanId; doc.clanTag = clanTag; doc.clanName = clanName;
    const now = Date.now();
    await db.prepare(
      'UPDATE players SET clanId = ?1, clanTag = ?2, clanName = ?3, updatedAt = ?4, dataJson = ?5 WHERE uid = ?6'
    ).bind(clanId, clanTag, clanName, now, JSON.stringify(doc), uid).run();
  } catch (_) { }
}

async function handlePlayers(method, segs, url, body, db) {
  if (segs[0] === 'leaderboard' && method === 'GET') {
    const [hs, ew, tk, seen] = await db.batch([
      db.prepare('SELECT uid, dataJson FROM players ORDER BY lbHighScore DESC LIMIT 35'),
      db.prepare('SELECT uid, dataJson FROM players ORDER BY lbEndlessWave DESC LIMIT 35'),
      db.prepare('SELECT uid, dataJson FROM players ORDER BY lbTotalKills DESC LIMIT 35'),
      db.prepare('SELECT uid, dataJson FROM players ORDER BY lastSeenAt DESC LIMIT 40')
    ]);
    const map = new Map();
    for (const res of [hs, ew, tk, seen]) {
      for (const r of (res.results || [])) {
        if (!map.has(r.uid)) {
          try {
            const parsed = JSON.parse(r.dataJson || '{}');
            if (!parsed.leaderboardHidden) map.set(r.uid, { id: r.uid, ...parsed });
          } catch (_) { }
        }
      }
    }
    return json({ ok: true, players: Array.from(map.values()) });
  }

  if (segs[0] === 'players' && segs[1] === 'discover' && method === 'GET') {
    const limit = Math.min(25, Math.max(1, Number(url.searchParams.get('limit') || 10)));
    const { results } = await db.prepare('SELECT uid, dataJson FROM players ORDER BY lastSeenAt DESC LIMIT ?1').bind(limit + 3).all();
    return json({ ok: true, players: (results || []).map(r => { try { return { id: r.uid, ...JSON.parse(r.dataJson || '{}') }; } catch (_) { return null; } }).filter(Boolean) });
  }

  if (segs[0] === 'players' && segs[1] === 'search' && method === 'GET') {
    const q = cleanStr(url.searchParams.get('q') || '', 64);
    const cleanTag = q.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const lowerName = q.replace(/^#/, '').trim().toLowerCase();
    const out = [];
    const seen = new Set();
    const addRows = (rows) => {
      for (const r of (rows || [])) {
        if (!seen.has(r.uid)) {
          seen.add(r.uid);
          try { out.push({ id: r.uid, ...JSON.parse(r.dataJson || '{}') }); } catch (_) { }
        }
      }
    };
    if (cleanTag.length >= 4 && cleanTag.length <= 10) {
      const r1 = await db.prepare('SELECT uid, dataJson FROM players WHERE friendTagClean = ?1 LIMIT 6').bind(cleanTag).all();
      addRows(r1.results);
    }
    if (!q.startsWith('#') && lowerName.length >= 2) {
      const r2 = await db.prepare('SELECT uid, dataJson FROM players WHERE playerNameLower >= ?1 AND playerNameLower <= ?2 LIMIT 10').bind(lowerName, lowerName + '\uf8ff').all();
      addRows(r2.results);
    }
    if (validUid(q)) {
      const r3 = await db.prepare('SELECT uid, dataJson FROM players WHERE uid = ?1 LIMIT 1').bind(q).all();
      addRows(r3.results);
    }
    return json({ ok: true, players: out });
  }

  if (segs[0] === 'player' && segs[1]) {
    const uid = decodeURIComponent(segs[1]);
    if (!validUid(uid)) return json({ ok: false, error: 'Invalid player UID.' }, 400);
    if (method === 'POST' && segs[2] === 'gift') {
      const existingRow = await db.prepare('SELECT dataJson FROM players WHERE uid = ?1').bind(uid).first();
      let doc = {};
      if (existingRow && existingRow.dataJson) { try { doc = JSON.parse(existingRow.dataJson); } catch (_) { } }
      if (segs[3] === 'claim') {
        const claimedIds = new Set(Array.isArray(body && body.giftIds) ? body.giftIds : []);
        if (Array.isArray(doc.devGifts)) doc.devGifts = doc.devGifts.filter(g => g && !claimedIds.has(g.id));
        await db.prepare('UPDATE players SET dataJson = ?1, updatedAt = ?2 WHERE uid = ?3').bind(JSON.stringify(doc), Date.now(), uid).run();
        return json({ ok: true, uid, devGifts: doc.devGifts || [] });
      }
      const gift = body && body.gift && typeof body.gift === 'object' ? body.gift : null;
      if (!gift || !gift.id) return json({ ok: false, error: 'Invalid gift payload.' }, 400);
      const prevGifts = Array.isArray(doc.devGifts) ? doc.devGifts : [];
      if (!prevGifts.some(g => g && g.id === gift.id)) prevGifts.push(gift);
      const meta = body && body.playerMeta && typeof body.playerMeta === 'object' ? body.playerMeta : {};
      const nextDoc = { playerName: cleanStr(meta.playerName || 'Hero', 40), friendTag: cleanStr(meta.friendTag || '', 16), ...doc, uid, devGifts: prevGifts };
      const now = Date.now();
      const pName = cleanStr(nextDoc.playerName || 'Hero', 40) || 'Hero';
      const fTag = cleanStr(nextDoc.friendTag || '', 16);
      await db.prepare(
        `INSERT INTO players (uid, playerName, playerNameLower, friendTag, friendTagClean, lastSeenAt, updatedAt, dataJson)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
         ON CONFLICT(uid) DO UPDATE SET updatedAt=excluded.updatedAt, dataJson=excluded.dataJson`
      ).bind(uid, pName, pName.toLowerCase(), fTag, fTag.replace(/[^A-Z0-9]/gi, '').toUpperCase(), Number(nextDoc.lastSeenAt) || now, now, JSON.stringify(nextDoc)).run();
      return json({ ok: true, uid, devGifts: prevGifts });
    }
    if (method === 'GET') {
      const row = await db.prepare('SELECT uid, dataJson, updatedAt FROM players WHERE uid = ?1').bind(uid).first();
      if (!row) return json({ ok: false, error: 'Not found' }, 404);
      let doc = {};
      try { doc = JSON.parse(row.dataJson || '{}'); } catch (_) { }
      return json({ ok: true, doc: { uid: row.uid, ...doc, updatedAt: row.updatedAt } });
    }
    if (method === 'POST') {
      const incoming = body && typeof body === 'object' ? body : {};
      delete incoming.isAdmin;
      delete incoming.wipedByDevAt;
      const existingRow = await db.prepare('SELECT dataJson FROM players WHERE uid = ?1').bind(uid).first();
      let prev = {};
      if (existingRow && existingRow.dataJson) {
        try { prev = JSON.parse(existingRow.dataJson); } catch (_) { }
      }
      const merged = { ...prev, ...incoming, uid };
      if (incoming.devGifts === undefined && prev.devGifts !== undefined) merged.devGifts = prev.devGifts;
      if (prev.clanId && !incoming.clanId && !incoming._clearClan) {
        merged.clanId = prev.clanId;
        if (prev.clanTag) merged.clanTag = prev.clanTag;
        if (prev.clanName) merged.clanName = prev.clanName;
      }
      delete merged._clearClan;
      if (prev.player && incoming.player) merged.player = { ...prev.player, ...incoming.player };
      if (prev.socialStats && incoming.socialStats) merged.socialStats = { ...prev.socialStats, ...incoming.socialStats };
      const jsonStr = JSON.stringify(merged);
      if (jsonStr.length > 260000) return json({ ok: false, error: 'Payload too large.' }, 413);

      const pObj = merged.player || {};
      const stats = pObj.stats || {};
      const soc = merged.socialStats || {};
      const feats = pObj.combatFeats || {};
      const pName = cleanStr(merged.playerName || pObj.name || 'Hero', 40) || 'Hero';
      const fTag = cleanStr(merged.friendTag || '', 16);
      const fTagClean = fTag.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      const lvl = Math.max(1, parseInt(merged.level || merged.accountLevel || pObj.accountLevel || 1, 10) || 1);
      const hero = cleanStr(merged.selectedHero || pObj.selectedHero || 'psanas', 32) || 'psanas';
      const hs = Math.max(0, Number(merged.lbHighScore || soc.highScore || stats.highScore || merged.highScore || 0) || 0);
      const ew = Math.max(0, Number(merged.lbEndlessWave || soc.endlessMaxWave || feats.endlessMaxWave || 0) || 0);
      const tk = Math.max(0, Number(merged.lbTotalKills || soc.totalKills || stats.totalKills || merged.totalKills || 0) || 0);
      const seenAt = Math.max(Date.now(), Number(merged.lastSeenAt) || 0);
      const now = Date.now();
      await db.prepare(
        `INSERT INTO players (uid, playerName, playerNameLower, friendTag, friendTagClean, level, selectedHero, lbHighScore, lbEndlessWave, lbTotalKills, clanId, clanTag, clanName, lastSeenAt, updatedAt, dataJson)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)
         ON CONFLICT(uid) DO UPDATE SET playerName=excluded.playerName, playerNameLower=excluded.playerNameLower,
           friendTag=excluded.friendTag, friendTagClean=excluded.friendTagClean, level=excluded.level,
           selectedHero=excluded.selectedHero, lbHighScore=excluded.lbHighScore, lbEndlessWave=excluded.lbEndlessWave,
           lbTotalKills=excluded.lbTotalKills, clanId=excluded.clanId, clanTag=excluded.clanTag, clanName=excluded.clanName,
           lastSeenAt=excluded.lastSeenAt, updatedAt=excluded.updatedAt, dataJson=excluded.dataJson`
      ).bind(
        uid, pName, pName.toLowerCase(), fTag, fTagClean, lvl, hero,
        hs, ew, tk, merged.clanId || null, merged.clanTag || null, merged.clanName || null,
        seenAt, now, jsonStr
      ).run();
      return json({ ok: true, uid });
    }
  }
  return null;
}

async function handleClans(method, segs, body, db) {
  if (segs[0] === 'clans' && segs.length === 1 && method === 'GET') {
    const { results } = await db.prepare('SELECT id, xp, level, memberCount, leaderUid, dataJson FROM clans ORDER BY xp DESC LIMIT 25').all();
    return json({ ok: true, clans: (results || []).map(parseClanRow).filter(Boolean) });
  }

  if (segs[0] === 'clans' && segs[1] === 'member' && segs[2] && method === 'GET') {
    const uid = decodeURIComponent(segs[2]);
    if (!validUid(uid)) return json({ ok: false, error: 'Invalid player UID.' }, 400);
    const { results } = await db.prepare('SELECT id, xp, level, memberCount, leaderUid, dataJson FROM clans WHERE dataJson LIKE ?1 ORDER BY xp DESC LIMIT 10').bind(`%${uid}%`).all();
    for (const r of (results || [])) {
      const c = parseClanRow(r);
      if (c && c.members && c.members[uid]) { await syncPlayerClanFields(db, uid, c); return json({ ok: true, clan: c }); }
    }
    return json({ ok: true, clan: null });
  }

  if (segs[0] === 'clans' && segs[1] === 'migrate' && method === 'POST') {
    const c = body && body.clan;
    if (!c || !validClanId(c.id)) return json({ ok: false, error: 'Invalid clan migration payload.' }, 400);
    const existing = await db.prepare('SELECT id, xp, level, memberCount, leaderUid, dataJson FROM clans WHERE id = ?1').bind(c.id).first();
    if (existing) return json({ ok: true, clan: parseClanRow(existing), existed: true });
    const saved = await saveClanObj(db, c);
    return json({ ok: true, clan: saved });
  }

  if (segs[0] === 'clans' && segs.length === 1 && method === 'POST') {
    const c = body && body.clan;
    if (!c || !validClanId(c.id) || !c.tag || !c.leaderUid) return json({ ok: false, error: 'Invalid clan payload.' }, 400);
    const dup = await db.prepare('SELECT id FROM clans WHERE tag = ?1 LIMIT 1').bind(String(c.tag).toUpperCase()).first();
    if (dup) return json({ ok: false, error: `Clan Tag [${c.tag}] is already taken!` }, 409);
    const saved = await saveClanObj(db, c);
    await syncPlayerClanFields(db, c.leaderUid, saved);
    return json({ ok: true, clan: saved });
  }

  if (segs[0] !== 'clan' || !segs[1]) return null;
  const clanId = decodeURIComponent(segs[1]);
  if (!validClanId(clanId)) return json({ ok: false, error: 'Invalid clan ID.' }, 400);
  const row = await db.prepare('SELECT id, xp, level, memberCount, leaderUid, dataJson FROM clans WHERE id = ?1').bind(clanId).first();
  if (!row) return json({ ok: false, error: 'Clan not found.' }, 404);
  const data = parseClanRow(row);
  if (!data) return json({ ok: false, error: 'Corrupt clan record.' }, 500);
  if (segs.length === 2 && method === 'GET') return json({ ok: true, clan: data });
  if (method !== 'POST') return null;

  const act = segs[2];
  const me = body && body.me ? body.me : {};
  const myUid = me.uid;
  const members = { ...(data.members || {}) };
  const reqs = { ...(data.joinRequests || {}) };
  const log = Array.isArray(data.activityLog) ? [...data.activityLog] : [];

  if (act === 'join') {
    if (!validUid(myUid)) return json({ ok: false, error: 'Missing player UID.' }, 400);
    if (members[myUid]) { await syncPlayerClanFields(db, myUid, data); return json({ ok: true, outcome: 'joined', clan: data }); }
    const maxMem = Math.max(12, Number(body.maxMembers) || 12);
    if (Object.keys(members).length >= maxMem) return json({ ok: false, error: 'Clan roster is full!' }, 400);
    if (data.joinMode === 'request') {
      reqs[myUid] = { uid: myUid, name: cleanStr(me.name, 32), tag: cleanStr(me.tag, 16), hero: cleanStr(me.hero, 32), level: Number(me.level) || 1, requestedAt: Date.now() };
      data.joinRequests = reqs;
      await saveClanObj(db, data);
      return json({ ok: true, outcome: 'requested', clan: data });
    }
    members[myUid] = { uid: myUid, name: cleanStr(me.name, 32), tag: cleanStr(me.tag, 16), hero: cleanStr(me.hero, 32), level: Number(me.level) || 1, role: 'member', contributedPoints: 0, weeklyContrib: 0, joinedAt: Date.now() };
    data.members = members;
    data.activityLog = [`${cleanStr(me.name, 32)} joined the Clan!`, ...log.slice(0, 9)];
    await saveClanObj(db, data);
    await syncPlayerClanFields(db, myUid, data);
    return json({ ok: true, outcome: 'joined', clan: data });
  }

  if (act === 'respond') {
    const actorRole = members[myUid] && members[myUid].role;
    if (actorRole !== 'leader' && actorRole !== 'officer' && actorRole !== 'co_leader') return json({ ok: false, error: 'Only Leaders or Officers can review requests.' }, 403);
    const tUid = body.targetUid;
    const req = reqs[tUid];
    delete reqs[tUid];
    data.joinRequests = reqs;
    if (body.accept && req) {
      members[tUid] = { uid: tUid, name: req.name, tag: req.tag, hero: req.hero, level: req.level, role: 'member', contributedPoints: 0, weeklyContrib: 0, joinedAt: Date.now() };
      data.members = members;
      data.activityLog = [`${req.name} joined the Clan!`, ...log.slice(0, 9)];
    }
    await saveClanObj(db, data);
    if (body.accept && req) await syncPlayerClanFields(db, tUid, data);
    return json({ ok: true, clan: data });
  }

  if (act === 'role') {
    const tUid = body.targetUid, dir = Number(body.direction) > 0 ? 1 : -1;
    const actor = members[myUid], target = members[tUid];
    if (!actor || !target) return json({ ok: false, error: 'Member not found.' }, 404);
    const aR = roleRank(actor.role), tR = roleRank(target.role);
    if (aR < 3) return json({ ok: false, error: 'Only Leaders or Co-Leaders can adjust roles.' }, 403);
    if (tR >= aR) return json({ ok: false, error: 'You cannot alter a member of equal or higher rank.' }, 403);
    const order = ['member', 'officer', 'co_leader'];
    const nextIdx = Math.max(0, order.indexOf(target.role || 'member')) + dir;
    if (nextIdx < 0 || nextIdx >= order.length) return json({ ok: false, error: dir > 0 ? 'Max promotable role reached.' : 'Already at lowest rank.' }, 400);
    const nextRole = order[nextIdx];
    if (roleRank(nextRole) >= aR) return json({ ok: false, error: 'Only the Leader can promote to Co-Leader.' }, 403);
    members[tUid] = { ...target, role: nextRole };
    data.members = members;
    data.activityLog = [`${cleanStr(me.name, 32)} ${dir > 0 ? 'promoted' : 'demoted'} ${target.name || 'Member'} to ${roleLabel(nextRole)}!`, ...log.slice(0, 9)];
    await saveClanObj(db, data);
    return json({ ok: true, role: nextRole, name: target.name || 'Member', clan: data });
  }

  if (act === 'transfer') {
    if (data.leaderUid !== myUid) return json({ ok: false, error: 'Only the current Leader can transfer Leadership.' }, 403);
    const tUid = body.targetUid;
    if (!members[tUid]) return json({ ok: false, error: 'Member not found.' }, 404);
    members[myUid] = { ...members[myUid], role: 'co_leader' };
    members[tUid] = { ...members[tUid], role: 'leader' };
    data.leaderUid = tUid;
    data.members = members;
    data.activityLog = [`👑 ${cleanStr(me.name, 32)} passed Clan Leadership to ${members[tUid].name || 'Member'}!`, ...log.slice(0, 9)];
    await saveClanObj(db, data);
    return json({ ok: true, name: members[tUid].name || 'Member', clan: data });
  }

  if (act === 'kick') {
    const tUid = body.targetUid, actor = members[myUid], target = members[tUid];
    if (!target) return json({ ok: true, clan: data });
    if (roleRank(actor && actor.role) < 3 || roleRank(actor && actor.role) <= roleRank(target.role)) return json({ ok: false, error: 'Insufficient Clan rank to remove this member.' }, 403);
    delete members[tUid];
    data.members = members;
    data.activityLog = [`${target.name} was removed from the Clan.`, ...log.slice(0, 9)];
    await saveClanObj(db, data);
    await syncPlayerClanFields(db, tUid, null);
    return json({ ok: true, clan: data });
  }

  if (act === 'leave') {
    delete members[myUid];
    const rem = Object.keys(members);
    if (rem.length === 0) {
      await db.prepare('DELETE FROM clans WHERE id = ?1').bind(clanId).run();
      await syncPlayerClanFields(db, myUid, null);
      return json({ ok: true, deleted: true });
    }
    if (data.leaderUid === myUid) {
      rem.sort((a, b) => (members[b].contributedPoints || 0) - (members[a].contributedPoints || 0));
      data.leaderUid = rem[0];
      members[rem[0]] = { ...members[rem[0]], role: 'leader' };
    }
    data.members = members;
    data.activityLog = [`${cleanStr(me.name, 32)} left the Clan.`, ...log.slice(0, 9)];
    await saveClanObj(db, data);
    await syncPlayerClanFields(db, myUid, null);
    return json({ ok: true, deleted: false, clan: data });
  }

  if (act === 'motto') {
    const actor = members[myUid];
    if (!actor || roleRank(actor.role) < 3) return json({ ok: false, error: 'Insufficient rank.' }, 403);
    data.motto = cleanStr(body.motto || '', 72);
    await saveClanObj(db, data);
    return json({ ok: true, clan: data });
  }

  if (act === 'donate') {
    const resId = cleanStr(body.resourceId, 32), qty = Math.floor(Number(body.qty) || 0), xpGain = Math.max(0, Math.round(Number(body.xpGain) || 0)), contribGain = Math.max(0, Math.round(Number(body.contribGain) || 0));
    const weekKey = cleanStr(body.weekKey || getIsoWeekKey(), 16);
    const vault = { ...(data.vault || {}) };
    vault[resId] = (vault[resId] || 0) + qty;
    data.vault = vault;
    data.xp = (Number(data.xp) || 0) + xpGain;
    const prevM = members[myUid] || { uid: myUid, name: cleanStr(me.name, 32), tag: cleanStr(me.tag, 16), hero: cleanStr(me.hero, 32), role: 'member', joinedAt: Date.now() };
    members[myUid] = { ...prevM, name: cleanStr(me.name, 32), level: Number(me.level) || 1, hero: cleanStr(me.hero, 32), contributedPoints: (prevM.contributedPoints || 0) + contribGain, weeklyContrib: (prevM.weeklyContrib || 0) + contribGain };
    data.members = members;
    const bounties = { ...(data.bounties || {}) };
    bounties[weekKey] = { ...(bounties[weekKey] || {}), vault_tributes: ((bounties[weekKey] && bounties[weekKey].vault_tributes) || 0) + contribGain };
    data.bounties = bounties;
    data.activityLog = [`${cleanStr(me.name, 32)} vaulted ${qty.toLocaleString()} ${cleanStr(body.shortName || resId, 16)} (+${contribGain} pts)`, ...log.slice(0, 9)];
    await saveClanObj(db, data);
    return json({ ok: true, clan: data });
  }

  if (act === 'claim-bounty') {
    const key = cleanStr(body.rewardClaimKey, 40), xpGain = Math.max(0, Math.round(Number(body.rewardXp) || 0));
    const claimed = Array.isArray(data.claimedXpKeys) ? [...data.claimedXpKeys] : [];
    if (key && !claimed.includes(key)) {
      claimed.push(key);
      data.claimedXpKeys = claimed.slice(-40);
      data.xp = (Number(data.xp) || 0) + xpGain;
      await saveClanObj(db, data);
    }
    return json({ ok: true, clan: data });
  }

  if (act === 'activate-booster') {
    const actor = members[myUid];
    if (!actor || roleRank(actor.role) < 2) return json({ ok: false, error: 'Only Officers, Co-Leaders, or Leaders can activate Vault Boosters.' }, 403);
    const boosterId = cleanStr(body.boosterId, 32), cost = (body.cost && typeof body.cost === 'object') ? body.cost : {};
    const durationMs = Math.min(24 * 3600000, Math.max(60000, Number(body.durationMs) || 7200000));
    if (!boosterId) return json({ ok: false, error: 'Invalid booster.' }, 400);
    const now = Date.now(), active = { ...(data.activeBoosters || {}) };
    if ((Number(active[boosterId]) || 0) > now) return json({ ok: false, error: 'This Booster is already active!' }, 400);
    const vault = { ...(data.vault || {}) };
    for (const [resId, amt] of Object.entries(cost)) {
      const need = Math.max(0, Math.floor(Number(amt) || 0));
      if ((Number(vault[resId]) || 0) < need) return json({ ok: false, error: `Not enough ${resId.replace(/_/g, ' ')} in Clan Vault!` }, 400);
      vault[resId] = (Number(vault[resId]) || 0) - need;
    }
    active[boosterId] = now + durationMs;
    data.vault = vault; data.activeBoosters = active; data.xp = (Number(data.xp) || 0) + 50;
    const bName = cleanStr(body.boosterName || boosterId, 40), bSum = cleanStr(body.summary || '', 48);
    const note = `⚡ ${cleanStr(me.name, 32)} activated ${bName}${bSum ? ` (${bSum})` : ''} for 2h!`;
    data.activityLog = [note, ...log.slice(0, 9)];
    await saveClanObj(db, data);
    await db.prepare('INSERT INTO messages (channel, senderUid, senderName, senderHero, senderRole, senderLevel, text, createdAt) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)').bind(
      `clan:${clanId}`, myUid, cleanStr(me.name || 'Hero', 32), cleanStr(me.hero || 'psanas', 32),
      cleanStr(actor.role || 'officer', 20), Math.max(1, Number(me.level) || 1), note, now
    ).run().catch(() => { });
    return json({ ok: true, clan: data });
  }

  if (act === 'bounties') {
    const weekKey = cleanStr(body.weekKey || getIsoWeekKey(), 16);
    const ew = Math.max(0, Math.floor(Number(body.endless_waves) || 0));
    const zd = Math.max(0, Math.floor(Number(body.zeus_defeats) || 0));
    const ck = Math.max(0, Math.floor(Number(body.coop_kills) || 0));
    const playPts = Math.min(30, Math.max(0, Math.floor(Number(body.playPts) || 0)));
    const playXp = Math.min(60, Math.max(0, Math.floor(Number(body.playXp) || 0)));
    const contribPts = Math.max(0, Math.floor(Number(body.contribPts) || 0)) + playPts;
    const bounties = { ...(data.bounties || {}) };
    const wk = { ...(bounties[weekKey] || {}) };
    if (ew > 0) wk.endless_waves = (wk.endless_waves || 0) + ew;
    if (zd > 0) wk.zeus_defeats = (wk.zeus_defeats || 0) + zd;
    if (ck > 0) wk.coop_kills = (wk.coop_kills || 0) + ck;
    bounties[weekKey] = wk;
    data.bounties = bounties;
    if (playXp > 0) data.xp = (Number(data.xp) || 0) + playXp;
    if (contribPts > 0 && validUid(myUid) && members[myUid]) {
      members[myUid] = { ...members[myUid], weeklyContrib: (members[myUid].weeklyContrib || 0) + contribPts, contributedPoints: (members[myUid].contributedPoints || 0) + contribPts };
      data.members = members;
    }
    await saveClanObj(db, data);
    return json({ ok: true, clan: data });
  }

  return null;
}

async function handleMessages(method, segs, url, body, db) {
  if (segs[0] !== 'messages' || !segs[1]) return null;
  const channel = cleanStr(decodeURIComponent(segs[1]), 96);
  if (method === 'GET') {
    const limit = Math.min(60, Math.max(1, Number(url.searchParams.get('limit') || 50)));
    const { results } = await db.prepare('SELECT id, senderUid, senderName, senderHero, senderRole, senderLevel, text, createdAt FROM messages WHERE channel = ?1 ORDER BY createdAt DESC LIMIT ?2').bind(channel, limit).all();
    return json({ ok: true, messages: (results || []).reverse() });
  }
  if (method === 'POST') {
    const text = cleanStr(body && body.text, 240);
    if (!text || !validUid(body && body.senderUid)) return json({ ok: false, error: 'Invalid message.' }, 400);
    const now = Date.now();
    await db.prepare('INSERT INTO messages (channel, senderUid, senderName, senderHero, senderRole, senderLevel, text, createdAt) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)').bind(
      channel, body.senderUid, cleanStr(body.senderName || 'Hero', 32), cleanStr(body.senderHero || 'psanas', 32),
      cleanStr(body.senderRole || 'member', 20), Math.max(1, Number(body.senderLevel) || 1), text, now
    ).run();
    return json({ ok: true, createdAt: now });
  }
  return null;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    const url = new URL(request.url);
    const segs = url.pathname.split('/').filter(Boolean);
    if (segs.length === 0) return json({ ok: true, service: 'lesaio-api', db: Boolean(env && env.DB) });
    if (!env || !env.DB) return json({ ok: false, error: 'D1 binding DB missing in Worker settings.' }, 500);
    try {
      await ensureSchema(env.DB);
      const body = request.method === 'POST' ? await request.json().catch(() => ({})) : null;
      const res = (await handlePlayers(request.method, segs, url, body, env.DB))
        || (await handleClans(request.method, segs, body, env.DB))
        || (await handleMessages(request.method, segs, url, body, env.DB));
      return res || json({ ok: false, error: 'Not found' }, 404);
    } catch (err) {
      return json({ ok: false, error: err && err.message ? err.message : 'Worker error' }, 500);
    }
  }
};
