/* ===== ASHEN VIGIL: pixel art (palette-indexed strings) + procedural ground ===== */
function bakeArt() {
  // ---------- heroes (12 x 15), 4-frame walk ----------
  const KN = [
    '.....rr.....',
    '....rre.....',
    '...kkkkkk...',
    '..kGllllGk..',
    '..kGkkkkGk..',
    '..kgkeekgk..',
    '..kgGllGgk..',
    '...kkggkk...',
    '.kGkrrrrkGk.',
    'kGlkreerklGk',
    'kgkkryyrkkgk',
    '.k.kggggk.k.'];
  const legsA = [['...kgk.kgk..', '...kHk.kHk..', '..kkk...kkk.'],
    ['...kgkkgk...', '...kHkkHk...', '...kkkkkk...'],
    ['....kgk.kgk.', '....kHk.kHk.', '...kkk..kkk.'],
    ['...kgkkgk...', '...kHkkHk...', '...kkkkkk...']];
  defSprite('knight', withLegs(KN, legsA));
  const WI = [
    '......kk....',
    '.....kVk....',
    '....kVVk....',
    '...kVvVVk...',
    '..kkkkkkkk..',
    'kVVVVVVVVVVk',
    '...kppppk...',
    '...kpspsk...',
    '...kppppk...',
    '..kVVyyVVk..',
    '.kVVVuuVVVk.',
    '.kpVuVVuVpk.'];
  defSprite('witch', withLegs(WI, [
    ['..kVVVVVVk..', '.kVVuVVuVVk.', '.kkkk..kkkk.'],
    ['..kVVVVVVk..', '..kVVuuVVk..', '..kkkkkkkk..'],
    ['..kVVVVVVk..', '.kVVuVVuVVk.', '..kkkk.kkkk.'],
    ['..kVVVVVVk..', '..kVVuuVVk..', '..kkkkkkkk..']]));
  const RA = [
    '....kkkk....',
    '...kNNNNk...',
    '..kNnnnnNk..',
    '..kNkttkNk..',
    '..kNtktkNk..',
    '..kNttttNk..',
    '...kNNNNk...',
    '..khhNNhhk.k',
    '.kthhnnhhtkt',
    '.kt.hhhhkt.t',
    '..kkHHHHkkkt',
    '...khhhhk..k'];
  defSprite('ranger', withLegs(RA, [
    ['...kH..Hk...', '...kH..Hk...', '..kkk..kkk..'],
    ['....kHHk....', '....kHHk....', '....kkkk....'],
    ['....kH..Hk..', '....kH..Hk..', '...kkk..kkk.'],
    ['....kHHk....', '....kHHk....', '....kkkk....']]));

  // ---------- enemies ----------
  defSprite('bat', [
    ['k..........k', 'kk........kk', 'kuk.k..k.kuk', 'kuukVkkVkuuk', '.kuVVrrVVuk.', '..kVVVVVVk..', '....kVVk....', '............'],
    ['............', '............', 'kk..k..k..kk', 'kuukVkkVkuuk', 'kuuVVrrVVuuk', '.kkVVVVVVkk.', '....kVVk....', '............'],
    ['............', '............', '....k..k....', '...kVkkVk...', '..kVVrrVVk..', '.kuVVVVVVuk.', 'kuuk.kk.kuuk', 'kk........kk']], { outline: C.gold });
  const GH = [
    '....kkkkk.....',
    '...kLnnnnk....',
    '..kLnnnnnnk...',
    '..knkrnkrnk...',
    '..knnnnnnnk...',
    '..knkwkwknk...',
    '...knnnnnk....',
    '..kNnnnnnNk...',
    '.kNnNnnnNnNk..',
    'knnkNnnnNknnk.',
    'knk.kNNNNk.knk',
    '.k..kNNNNk..k.',
    '....kNNNNk....'];
  const GHL = [['....kNk.kNk...', '....kNk.kNk...', '...kkk..kkk...'],
    ['.....kNkNk....', '....kNk..kNk..', '....kk....kk..']];
  defSprite('ghoul', withLegs(GH, GHL), { outline: C.gold });
  defSprite('husk', withLegs(GH, GHL), { outline: C.gold, swap: { n: 'm', L: 'G', N: 'g', r: 'o' } });
  const AR = [
    '...kkkkkk...',
    '..kppppppk..',
    '..kpkkpkkpk.',
    '..kpkrpkrpk.',
    '..kppppppk..',
    '...kpkpkpk..',
    '....kkkkk...',
    '..kHkppkHk..',
    '.khkpppppkhk',
    'khk.kppk.kh.',
    '.k..kpkpk...',
    '....kppk....'];
  defSprite('archer', withLegs(AR, [
    ['....kpkpk...', '....kp.kp...', '...kk..kk...'],
    ['....kpkpk...', '...kp...kp..', '...k....k...']]), { outline: C.gold });
  const TD = [
    '...kk....kk...',
    '..kyLk..kLyk..',
    '..kkLkkkkLkk..',
    '.kLLLLLLLLLLk.',
    'kLnLLLLLLLLnLk',
    'kLLLnLLLLnLLLk',
    'knLLLLttLLLLnk',
    'kLLLLttttLLLLk',
    '.kLLLttttLLLk.',
    '..kkkkkkkkkk..'];
  defSprite('toad', withLegs(TD, [['.kLk......kLk.', 'kkk........kkk'], ['..kLk....kLk..', '.kkk......kkk.']]), { outline: C.gold });
  const WR = [
    '....kkkk....',
    '...kcwwck...',
    '..kcwwwwck..',
    '..kcksskck..',
    '..kcwwwwck..',
    '.kcwcwwcwck.',
    'kcwkcwwckwck',
    '.k.kcwwck.k.',
    '...kcbbck...',
    '...kbccbk...'];
  defSprite('wraith', withLegs(WR, [['....kbbk....', '....kbk.....', '.....k......'], ['....kbbk....', '.....kbk....', '......k.....']]), { outline: C.cyan });
  const GO = [
    '......kkkkkkkk......',
    '.....kttttttttk.....',
    '....kttttttttttk....',
    '....ktkkttttkktk....',
    '....ktkrkttkrktk....',
    '....kttttttttttk....',
    '.....ktkwkwkwtk.....',
    '..kkkkkttttttkkkkk..',
    '.kttttkhhhhhhkttttk.',
    'kttttkhttttttkttttk.',
    'kttkkhtkttttktkkttk.',
    'ktk.khttttttttk.ktk.',
    'kttk.khhhhhhhhk.kttk',
    '.kk..khttttthk...kk.',
    '.....khhhhhhhk......'];
  defSprite('golem', withLegs(GO, [
    ['.....kttk..kttk.....', '.....kttk..kttk.....', '....kkkkk..kkkkk....'],
    ['......kttkkttk......', '.....kttk..kttk.....', '.....kkk....kkk.....']]), { outline: C.red });
  const RP = [
    '...........kkkk.........',
    '..........kppppk........',
    '.........kppppppk.......',
    '........kppkkkkppk......',
    '........kpkkkkkkpk..kkk.',
    '........kpkskkskpk.kwwk',
    '........kpkkkkkkpkkwlk..',
    '.........kpkkkkpk.kwlk..',
    '........kpppppppkkwlk...',
    '.......kpplpppplpkhk....',
    '......kpplppppppkhpk....',
    '.....kpplpppppppkhppk...',
    '.....kplppppppppkhpppk..',
    '....kpplpppppppphkpppk..',
    '....kplppppppppphkppk...',
    '....kplpppppppppkhkk....',
    '...kpplppppppppppkh.....',
    '...kplpppppppppppkh.....',
    '...kplppppppppppppkh....',
    '..kpplpppppppppppppkh...'];
  defSprite('reaper', withLegs(RP, [
    ['..kplplpplpplpplpplpk.h.', '..kpk.kpk.kpk.kpk.kpk...', '...k...k...k...k...k....'],
    ['..kplplpplpplpplpplpk.h.', '...kpk.kpk.kpk.kpk.kpk..', '....k...k...k...k...k...']]), { outline: C.spirit });
  defSprite('lantern', [
    ['...kk...', '..k..k..', '.kkkkkk.', '.kyoyok.', '.koYYok.', '.kyYYyk.', '.koyyok.', '.kkkkkk.', '..kHHk..', '...HH...', '..kHHk..', '.kkkkkk.'],
    ['...kk...', '..k..k..', '.kkkkkk.', '.koyoyk.', '.kyYYyk.', '.koYYok.', '.kyoyyk.', '.kkkkkk.', '..kHHk..', '...HH...', '..kHHk..', '.kkkkkk.']]);

  // ---------- pickups ----------
  const GEM = ['..k..', '.kck.', 'kcwck', 'kbcbk', '.kbk.', '..k..'];
  defSprite('gemB', [GEM], { swap: { c: 'c', b: 'b' } });
  defSprite('gemG', [GEM], { swap: { c: 'L', b: 'n' } });
  defSprite('gemR', [GEM], { swap: { c: 'e', b: 'r' } });
  defSprite('coin', [
    ['.kkkk.', 'kyYYyk', 'kyoyyk', 'kyoyyk', 'kyyyok', '.kkkk.'],
    ['..kk..', '.kYyk.', '.kyok.', '.kyok.', '.kyyk.', '..kk..'],
    ['..k...', '..ky..', '..ko..', '..ko..', '..ky..', '..k...'],
    ['..kk..', '.kyYk.', '.koyk.', '.koyk.', '.kyyk.', '..kk..']]);
  defSprite('bag', [['..kk...', '.kyyk..', '..kk...', '.khhhk.', 'khyhhhk', 'khhyhhk', 'khhhhhk', '.kkkkk.']]);
  defSprite('chicken', [['...kkk....', '..kttttk..', '.kttttttk.', 'kthttthtk.', 'kttttttttk', '.khttttk.k', '..kkkkkkpk', '.......kpk', '........k.']]);
  defSprite('rosary', [['..kkkk..', '.kp..pk.', 'kp....pk', 'kp....pk', '.kp..pk.', '..kyyk..', '..kyyk..', '.kyyyyk.', '..kyyk..', '...kk...']]);
  defSprite('vacuum', [['..kkkk..', '.kbccbk.', 'kbcwwcbk', 'kcwYYwck', 'kcwYYwck', 'kbcwwcbk', '.kbccbk.', '..kkkk..']]);
  defSprite('chest', [
    ['.kkkkkkkkkk.', 'khhhhyyhhhhk', 'khHHHyyHHHhk', 'kkkkkkkkkkkk', 'khhhhkkhhhhk', 'khhhhyyhhhhk', 'khHHHHHHHHhk', 'khhhhhhhhhhk', '.kkkkkkkkkk.'],
    ['.kkkkkkkkkk.', 'kYYYYYYYYYYk', 'kyYYYYYYYYyk', 'kkkkkkkkkkkk', 'khhhhkkhhhhk', 'khhhhyyhhhhk', 'khHHHHHHHHhk', 'khhhhhhhhhhk', '.kkkkkkkkkk.']]);

  // ---------- projectiles ----------
  defSprite('bolt', [['.kvvk.', 'kvwwvk', 'vwYYwv', 'vwYYwv', 'kvwwvk', '.kvvk.'], ['..vv..', '.vwwv.', 'vwYYwv', 'vwYYwv', '.vwwv.', '..vv..']]);
  defSprite('soul', [['.kssk.', 'kswwsk', 'swYYws', 'swYYws', 'kswwsk', '.kssk.'], ['..ss..', '.swws.', 'swYYws', 'swYYws', '.swws.', '..ss..']]);
  defSprite('flask', [['..k..', '.kpk.', '.kpk.', 'krork', 'kroek', 'krrrk', '.kkk.']]);
  defSprite('rune', [['..kkk..', '.kvvvk.', 'kvwcwvk', 'kvcwcvk', 'kvwcwvk', '.kvvvk.', '..kkk..']]);
  defSprite('runeGold', [['..kkk..', '.kyyyk.', 'kyYoYyk', 'kyoYoyk', 'kyYoYyk', '.kyyyk.', '..kkk..']]);
  defSprite('scythe', [['..kkkk..', '.kpppk..', 'kpk.....', 'kp......', 'kp...h..', '.k..h...', '...h....', '..h.....']]);

  // ---------- 8x8 icons (weapons, passives, shop) ----------
  const IC = {
    blade: ['......kw', '.....kwl', '....kwlk', '...kwlk.', 'ok.wlk..', '.okek...', '.kook...', 'k..ko...'],
    bolt: ['..kvvk..', '.kvwwvk.', 'kvwccwvk', 'kvwccwvk', '.kvwwvk.', '..kvvk..', '...kv...', '....k...'],
    volley: ['.....kpk', '......kp', '..k..kpk', '.kpk.p.k', '.kpkp...', '.kpp....', 'kpk.....', 'kk......'],
    orbit: ['...kk...', '..kvvk..', 'kk....kk', 'kvk..kck', 'kvk..kck', 'kk....kk', '..kvvk..', '...kk...'],
    font: ['..kyyk..', '.kyYYyk.', '..kyyk..', 'kkkkkkkk', 'kpppppk.', '.kpppk..', '..kpk...', '.kkkkk..'],
    thunder: ['....kyk.', '...kyk..', '..kyk...', '.kyYYyk.', '...kyk..', '..kyk...', '.kyk....', '.kk.....'],
    flask: ['...kk...', '...kpk..', '..kppk..', '.krrrrk.', 'kroeorrk', 'kreYerrk', 'krroerrk', '.kkkkkk.'],
    chain: ['.kc.....', 'kcwc....', '.kcwc...', '..kcwk..', '...kwck.', '....cwck', '.....cwk', '......k.'],
    heart: ['.kk..kk.', 'krrkkrrk', 'krwrrrrk', 'krrrrrrk', '.krrrrk.', '..krrk..', '...kk...', '........'],
    boots: ['..kkkk..', '..khhk..', '..khhk..', '..khhk..', '.khhhk..', 'khhhhhkk', 'khhhhhhk', 'kkkkkkkk'],
    glass: ['kkkkkkkk', '.kyyyyk.', '..kyyk..', '...kk...', '...kk...', '..kyyk..', '.kyyyyk.', 'kkkkkkkk'],
    magnet: ['kkk..kkk', 'krk..kwk', 'krk..kwk', 'krk..kwk', 'krkkkkwk', 'krrrrrrk', '.krrrrk.', '..kkkk..'],
    book: ['.kkkkkk.', 'kVVVVVVk', 'kVyyyyVk', 'kVyVVyVk', 'kVyyyyVk', 'kVVVVVVk', 'kppppppk', '.kkkkkk.'],
    luck: ['..kkkk..', '.kyYYyk.', 'kyokkoyk', 'kyokyoyk', 'kyokkoyk', 'kyyyyyyk', '.kyYyyk.', '..kkkk..'],
    blood: ['...kk...', '..krrk..', '.krwrrk.', 'krwrrrrk', 'krrrrrRk', '.krrrRk.', '..krRk..', '...kk...'],
    might: ['...kk...', '...kk...', '..kllk..', '..kllk..', '..kllk..', 'kkkkkkkk', '...hh...', '...kk...'],
    armor: ['kkkkkkkk', 'kllGGllk', 'kllGGllk', 'kGGGGGGk', 'kllGGllk', '.kllllk.', '..kllk..', '...kk...'],
    revive: ['..kkk...', '.kyky...', '.ky.yk..', '..kyk...', 'kkkykkk.', 'kyyyyyk.', '...yk...', '...yk...'],
    greed: ['..kk....', '.kyyk...', '..kk....', '.khhhk..', 'khyhhhk.', 'khhyhhk.', '.kkkkk..', '........'],
    skull: ['.kkkkk..', 'kpppppk.', 'kpkpkpk.', 'kpppppk.', '.kpkpk..', '..kkk...', '........', '........'],
    gold: ['.kkkk...', 'kyYYyk..', 'kyoyyk..', 'kyoyyk..', 'kyyyok..', '.kkkk...', '........', '........']
  };
  for (const k in IC) defSprite('i_' + k, [IC[k]]);

  // ---------- ground decorations ----------
  defSprite('d_grave', [['..kkkk..', '.kGlllk.', 'kGllGllk', 'kGlGGGlk', 'kGllGllk', 'kGllllGk', 'kGGllGGk', 'kkkkkkkk']]);
  defSprite('d_tree', [['k.....k..k', '.k...k..k.', '..k.k.kk..', '...kHk....', '..k.Hk.k..', '.....Hkk..', '....kHk...', '....kHk...', '....kHk...', '...kHHHk..', '..kkkkkkk.']]);
  defSprite('d_pillar', [['.kkkkkk.', 'kGlllGGk', '.kGllGk.', '.kGllGk.', '.kGlGGk.', '.kG.lGk.', '.kGllGk.', 'kGGllGGk', 'kkkkkkkk']]);
  defSprite('d_bones', [['..........', '...p...p..', '..kpk.kpkk', '.kpppkppk.', 'kpkpppkpk.', '.kppkpppk.', '..kk.kkk..']]);
  defSprite('d_skull', [['.kkkk.', 'kppppk', 'kpkkpk', 'kppppk', '.kpkk.', '..kk..']]);
  defSprite('d_rock', [['..kkk...', '.kGlGk..', 'kGlGGGk.', 'kGGGGgk.', '.kkkkk..']]);
  defSprite('d_tuft', [['.n...n.', '.nL.Ln.', 'n.nLn.n', '.nnNnn.']]);
  defSprite('d_candle', [['..o..', '..y..', '.kpk.', '.kpk.', '.kpk.', 'kkkkk']]);
}

// ---------- procedural ground: cached 128px chunks ----------
const CHUNK = 128, chunkCache = new Map();
function biomeAt(wx, wy) {
  const v = fbm(wx / 420, wy / 420, 3);
  const ruin = vnoise(wx / 260, wy / 260, 11);
  return { v, ruin };
}
function getChunk(cx, cy) {
  const key = cx + ',' + cy; let c = chunkCache.get(key);
  if (c) return c;
  c = mk(CHUNK, CHUNK); const x = c.getContext('2d'), id = x.createImageData(CHUNK, CHUNK), d = id.data;
  const ox = cx * CHUNK, oy = cy * CHUNK;
  const GR = [18, 18, 17, 19, 18, 17], AS = [4, 3, 4, 5, 3, 4], DI = [28, 28, 3, 29, 28], ST = [5, 4, 5, 6, 4];
  for (let py = 0; py < CHUNK; py++) for (let px = 0; px < CHUNK; px++) {
    const wx = ox + px, wy = oy + py, h = hash2(wx, wy, 1);
    const v = fbm(wx / 420, wy / 420, 3) + (hash2(wx >> 2, wy >> 2, 5) - 0.5) * 0.06;
    const ruin = vnoise(wx / 260, wy / 260, 11);
    let pi;
    if (ruin > 0.74) { // flagstone ruins
      const row = Math.floor(wy / 12), sx = (wx + (row & 1) * 9) % 18, sy = wy % 12;
      const crack = hash2(Math.floor((wx + (row & 1) * 9) / 18), row, 9);
      if (sx === 0 || sy === 0) pi = 2; else if (crack > 0.8 && h < 0.5) pi = 18; else pi = ST[(h * ST.length) | 0];
      if (crack < 0.12) pi = h < 0.7 ? 3 : 2; // missing slab
    } else if (v < 0.47) pi = GR[(h * GR.length) | 0];
    else if (v < 0.53) pi = h < (v - 0.47) / 0.06 ? DI[(h * 7 * DI.length) % DI.length | 0] : GR[(h * 3 * GR.length) % GR.length | 0];
    else if (v < 0.58) pi = DI[(h * DI.length) | 0];
    else pi = AS[(h * AS.length) | 0];
    if (h > 0.996) pi = 6;
    const rgb = PALRGB[pi], o = (py * CHUNK + px) * 4; d[o] = rgb[0]; d[o + 1] = rgb[1]; d[o + 2] = rgb[2]; d[o + 3] = 255;
  }
  x.putImageData(id, 0, 0);
  // decorations, kept fully inside the chunk
  for (let ty = 0; ty < 8; ty++) for (let tx = 0; tx < 8; tx++) {
    const wx = ox + tx * 16, wy = oy + ty * 16, h = hash2(wx >> 4, wy >> 4, 21);
    const b = biomeAt(wx, wy);
    let s = null;
    if (b.ruin > 0.74) { if (h < 0.05) s = 'd_pillar'; else if (h < 0.08) s = 'd_candle'; else if (h < 0.1) s = 'd_skull'; }
    else if (b.v < 0.47) { if (h < 0.12) s = 'd_tuft'; else if (h < 0.15) s = 'd_grave'; else if (h < 0.165) s = 'd_tree'; else if (h < 0.18) s = 'd_rock'; }
    else { if (h < 0.05) s = 'd_bones'; else if (h < 0.08) s = 'd_skull'; else if (h < 0.1) s = 'd_tree'; else if (h < 0.12) s = 'd_rock'; else if (h < 0.135) s = 'd_grave'; }
    if (!s) continue;
    const sp = SPR[s], dx = tx * 16 + ((hash2(wx, wy, 4) * (16 - Math.min(14, sp.w))) | 0), dy = ty * 16 + 2;
    if (dx + sp.w > CHUNK - 1 || dy + sp.h > CHUNK - 1) continue;
    x.globalAlpha = 0.35; x.fillStyle = C.black; x.fillRect(dx + 1, dy + sp.h - 1, sp.w - 1, 2); x.globalAlpha = 1;
    x.drawImage(hash2(wx, wy, 8) < 0.5 ? sp.fr[0].n : sp.fr[0].f, dx, dy);
  }
  chunkCache.set(key, c);
  if (chunkCache.size > 90) { const first = chunkCache.keys().next().value; chunkCache.delete(first); }
  return c;
}
