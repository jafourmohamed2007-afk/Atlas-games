/* Arrow Rampart — the 3D view (three.js). The game logic stays in screen pixels; this view draws the same
   world in 3D underneath the 2D HUD canvas.
   World units = CSS pixels: world X = screen x, world Y = -screen y, gameplay plane z = 0.
   The camera looks straight down -Z from above eye level with a shifted lens (off-centre frustum), so every point
   on the z = 0 plane lands exactly on its 2D screen position (aim, hit circles, HUD stay aligned) while the
   ground, the castle and the raiders are seen in perspective from slightly above. */
import * as THREE from 'three';

function canvasTex(w, h, paint) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}
const std = (col, o) => new THREE.MeshStandardMaterial(Object.assign({ color: col, roughness: 0.55, metalness: 0 }, o || {}));

export function createView(stage) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' }); }
  catch (e) { return null; } // no WebGL: the game keeps its 2D drawing
  const cv = renderer.domElement; cv.id = 'game3d';
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none';
  stage.insertBefore(cv, stage.firstChild);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const phone = Math.min(screen.width, screen.height) < 600;
  renderer.shadowMap.enabled = !phone; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, 1, 5, 20000);
  // ---- lights
  const hemi = new THREE.HemisphereLight(0xcfeaff, 0x6b8a4a, 1.25); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.2); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; scene.add(sun); scene.add(sun.target);
  const torch = new THREE.PointLight(0xffa040, 0, 0, 1.6); scene.add(torch);
  // ---- sky dome (gradient), sun disc / moon, distant hills, clouds
  const skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, depthWrite: false, map: canvasTex(4, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5DB8F5'); gr.addColorStop(0.55, '#BEE6FF'); gr.addColorStop(1, '#FFF2D8'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) });
  const nightSky = canvasTex(4, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#05061A'); gr.addColorStop(0.6, '#1A1A48'); gr.addColorStop(1, '#3A2A5A'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const daySky = skyMat.map, sky = new THREE.Mesh(new THREE.SphereGeometry(15000, 32, 16), skyMat); scene.add(sky);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.MeshBasicMaterial({ color: 0xfff3c4 })); scene.add(orb);
  const hills = new THREE.Group(); scene.add(hills);
  const hillMats = [std(0x8fcf7a, { roughness: 0.9 }), std(0x6fb85a, { roughness: 0.9 }), std(0x9a8cc8, { roughness: 0.95 })];
  const clouds = new THREE.Group(); scene.add(clouds); const cloudMat = std(0xffffff, { roughness: 1, emissive: 0xffffff, emissiveIntensity: 0.25 });
  // ---- ground: grass with a sandy road where the raiders walk
  const grassTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#7ED957'; g.fillRect(0, 0, w, h); for (let i = 0; i < 1400; i++) { g.fillStyle = ['#6CC84A', '#8EE266', '#5BBF3A', '#A2EA7A'][i % 4]; g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 5 + Math.random() * 7); } });
  const sandTex = canvasTex(256, 64, (g, w, h) => { g.fillStyle = '#E3C48F'; g.fillRect(0, 0, w, h); for (let i = 0; i < 500; i++) { g.fillStyle = ['#D4B27A', '#EED6A6', '#C9A66C'][i % 3]; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 2.5, 0, 7); g.fill(); } });
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), std(0xffffff, { map: grassTex, roughness: 0.95 })); grass.rotation.x = -Math.PI / 2; grass.receiveShadow = true; scene.add(grass);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), std(0xffffff, { map: sandTex, roughness: 0.95 })); road.rotation.x = -Math.PI / 2; road.receiveShadow = true; scene.add(road);
  const dirt = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), std(0x8a5a2b, { roughness: 1 })); scene.add(dirt);
  // ---- castle: brick wall with crenellations, two towers with roofs, a flag and a torch
  const brick = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#9E97C2'; g.fillRect(0, 0, w, h); const bh = 32, bw = 64; for (let r = 0; r < h / bh; r++) for (let c = -1; c < w / bw + 1; c++) { const x = c * bw + (r % 2) * bw / 2, y = r * bh; g.fillStyle = ['#B4AED0', '#ABA4CA', '#BDB7D8', '#A79FC8'][(r * 7 + c * 3) & 3]; g.fillRect(x + 3, y + 3, bw - 6, bh - 6); } });
  const wallMat = std(0xffffff, { map: brick, roughness: 0.85 }), stoneDark = std(0x8f88b0, { roughness: 0.85 }), roofMat = std(0xe8364f, { roughness: 0.6 }), woodMat = std(0x8a5a2b, { roughness: 0.7 });
  const castle = new THREE.Group(); scene.add(castle);
  const wallBox = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), wallMat); wallBox.castShadow = wallBox.receiveShadow = true; castle.add(wallBox);
  const crens = []; for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), wallMat); m.castShadow = true; castle.add(m); crens.push(m); }
  const towers = [0, 1].map(() => { const t = new THREE.Group(), body = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.05, 1, 20), wallMat), roof = new THREE.Mesh(new THREE.ConeGeometry(1.25, 1, 20), roofMat); body.castShadow = roof.castShadow = true; t.add(body, roof); t.userData = { body, roof }; castle.add(t); return t; });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 8), woodMat); castle.add(pole);
  const flagGeo = new THREE.PlaneGeometry(1, 1, 8, 1), flag = new THREE.Mesh(flagGeo, std(0xe8364f, { side: THREE.DoubleSide, roughness: 0.6 })); castle.add(flag);
  const torchPost = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.7, 1, 8), woodMat), flame = new THREE.Mesh(new THREE.ConeGeometry(1, 2, 12), new THREE.MeshBasicMaterial({ color: 0xffb040 })); castle.add(torchPost, flame);
  const cracks = new THREE.Group(); castle.add(cracks); const crackMat = new THREE.LineBasicMaterial({ color: 0x3c325a });
  // ---- archer
  const archer = new THREE.Group(); scene.add(archer);
  const A = { body: std(0x6a55e0, { roughness: 0.45 }), dark: std(0x4b3ba8), hood: std(0x3fa34d, { roughness: 0.5 }), cape: std(0xe8364f, { side: THREE.DoubleSide }), skin: std(0xffd9b8, { roughness: 0.6 }), eye: std(0x241b4d), bow: std(0x8a5a2b, { roughness: 0.4 }), steel: std(0xb8c2ce, { metalness: 0.9, roughness: 0.25 }), fletch: std(0xe8364f) };
  const aBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.5, 6, 16), A.body); aBody.position.y = 0.45; aBody.castShadow = true;
  const aBelt = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.06, 8, 24), A.dark); aBelt.rotation.x = Math.PI / 2; aBelt.position.y = 0.35;
  const aHead = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 16), A.skin); aHead.position.y = 1.15; aHead.castShadow = true;
  const aHood = new THREE.Mesh(new THREE.SphereGeometry(0.45, 24, 16, Math.PI * 0.6, Math.PI * 1.8, 0, Math.PI * 0.62), A.hood); aHood.position.y = 1.2; aHood.castShadow = true;
  const aTip = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 12), A.hood); aTip.position.set(-0.3, 1.55, 0); aTip.rotation.z = 0.9;
  const aCape = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.1, 16, 1, true, Math.PI * 0.5, Math.PI), A.cape); aCape.position.set(-0.12, 0.5, -0.05);
  const aEye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), A.eye); aEye.position.set(0.3, 1.18, 0.16);
  const aEye2 = aEye.clone(); aEye2.position.z = -0.16;
  archer.add(aBody, aBelt, aHead, aHood, aTip, aCape, aEye, aEye2);
  const bowG = new THREE.Group(); bowG.position.y = 0.75; archer.add(bowG);
  const bowArc = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.07, 10, 40, 2.3), A.bow); bowArc.rotation.z = -1.15; bowArc.position.x = 0.25; bowArc.castShadow = true; bowG.add(bowArc);
  const bowGlow = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffb020 })); bowGlow.position.x = 1.0; bowG.add(bowGlow);
  const strGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]), str = new THREE.Line(strGeo, new THREE.LineBasicMaterial({ color: 0xf4efe4 })); bowG.add(str);
  // ---- shared geometry for raiders / arrows
  const G = {
    leg: new THREE.BoxGeometry(0.2, 0.36, 0.22), body: new THREE.CapsuleGeometry(0.46, 0.42, 6, 18), head: new THREE.SphereGeometry(0.38, 22, 16),
    helm: new THREE.SphereGeometry(0.42, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2), brim: new THREE.CylinderGeometry(0.5, 0.5, 0.07, 22), eyeW: new THREE.SphereGeometry(0.13, 12, 10), eyeP: new THREE.SphereGeometry(0.07, 10, 8),
    club: new THREE.CylinderGeometry(0.06, 0.08, 0.75, 10), clubHead: new THREE.SphereGeometry(0.17, 12, 10), spike: new THREE.ConeGeometry(0.1, 0.32, 10), wing: new THREE.SphereGeometry(0.5, 16, 8),
    flame: new THREE.ConeGeometry(0.12, 0.35, 8), ice: new THREE.BoxGeometry(1.25, 1.85, 0.9),
    shaft: new THREE.CylinderGeometry(0.03, 0.03, 1.1, 6), tip: new THREE.ConeGeometry(0.07, 0.25, 8), fl: new THREE.BoxGeometry(0.22, 0.12, 0.01), ring: new THREE.TorusGeometry(1, 0.06, 8, 48)
  };
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xff8a2a }), iceMat = new THREE.MeshStandardMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.45, roughness: 0.05, metalness: 0.1 });
  const steel = A.steel, wood = std(0x8a5a2b, { roughness: 0.6 }), white = std(0xffffff, { roughness: 0.4 }), ink = std(0x241b4d, { roughness: 0.3 }), gold = std(0xffd23f, { metalness: 0.8, roughness: 0.25 });
  const foeMeshes = new Map(), arrowPool = [], fxPool = [];
  function makeFoe(f, d) {
    const g = new THREE.Group(), body = std(d.col, { roughness: 0.45 }), dark = std(d.dark, { roughness: 0.5 }), helm = std(d.helm, { roughness: 0.35, metalness: f.k === 'chief' ? 0.7 : 0.2 });
    const legs = [new THREE.Mesh(G.leg, dark), new THREE.Mesh(G.leg, dark)]; legs[0].position.set(-0.18, 0.18, 0.14); legs[1].position.set(0.15, 0.18, -0.14);
    const b = new THREE.Mesh(G.body, body); b.position.y = 0.78; const h = new THREE.Mesh(G.head, body); h.position.set(-0.05, 1.42, 0);
    const hm = new THREE.Mesh(G.helm, helm); hm.position.set(-0.05, 1.48, 0); const br = new THREE.Mesh(G.brim, helm); br.position.set(-0.05, 1.48, 0);
    const eyes = [0.17, -0.17].map((z) => { const w = new THREE.Mesh(G.eyeW, white); w.position.set(-0.36, 1.42, z); const p = new THREE.Mesh(G.eyeP, ink); p.position.set(-0.47, 1.41, z); g.add(w, p); return p; });
    const club = new THREE.Group(), cs = new THREE.Mesh(G.club, wood), ch = new THREE.Mesh(G.clubHead, std(0xa8733e)); cs.position.y = 0.37; ch.position.y = 0.78; club.add(cs, ch); club.position.set(-0.4, 0.8, 0.35);
    [legs[0], legs[1], b, h, hm, cs, ch].forEach((m) => { m.castShadow = true; });
    g.add(legs[0], legs[1], b, h, hm, br, club);
    if (f.k === 'chief') { for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(G.spike, gold); const a = (i / 5) * Math.PI * 2; s.position.set(-0.05 + Math.cos(a) * 0.32, 1.86, Math.sin(a) * 0.32); g.add(s); } }
    else if (f.k === 'brute') { [-1, 1].forEach((q) => { const s = new THREE.Mesh(G.spike, white); s.position.set(-0.05, 1.8, q * 0.38); s.rotation.x = q * 0.7; g.add(s); }); }
    else if (f.k === 'runner') { const s = new THREE.Mesh(G.spike, std(0xff7f45)); s.position.set(0.35, 1.65, 0); s.rotation.z = -1.3; g.add(s); }
    let wings = null; if (f.fly) { const wm = std(0xffffff, { roughness: 0.3, transparent: true, opacity: 0.92 }); wings = [0.35, -0.35].map((z) => { const w = new THREE.Mesh(G.wing, wm); w.scale.set(0.9, 0.12, 0.45); w.position.set(0.15, 1.05, z); g.add(w); return w; }); }
    const flames = [0, 1, 2].map((i) => { const m = new THREE.Mesh(G.flame, flameMat); m.position.set(-0.3 + i * 0.25, 1.9, 0); m.visible = false; g.add(m); return m; });
    const ice = new THREE.Mesh(G.ice, iceMat); ice.position.y = 0.92; ice.visible = false; g.add(ice);
    const mats = [body, dark, helm];
    g.userData = { legs, club, wings, flames, ice, mats, eyes, body: b }; scene.add(g); return g;
  }
  function makeArrow() {
    const g = new THREE.Group(), s = new THREE.Mesh(G.shaft, wood), t = new THREE.Mesh(G.tip, steel), fl = [0, 1, 2].map((i) => { const m = new THREE.Mesh(G.fl, A.fletch); m.position.y = -0.45; m.rotation.y = i * Math.PI / 3; return m; });
    t.position.y = 0.6; s.castShadow = true; g.add(s, t, ...fl); const fire = new THREE.Mesh(G.flame, flameMat); fire.position.y = 0.72; g.add(fire); g.userData = { fire, tip: t }; scene.add(g); return g;
  }
  let W = 1, H = 1, dpr = 1, lastSeen = 0;
  const v3 = new THREE.Vector3();
  function layoutWorld(st) {
    const u = st.u, gy = st.gy, wx = st.wallX, wt = st.wallTop, D = Math.max(W, H) * 1.55;
    // camera: eye above the action, looking straight at the z = 0 plane through a shifted lens
    const ex = W * 0.5, ey = -Math.max(st.hudH + 20, H * 0.18), ez = D, n = 5;
    camera.position.set(ex, ey, ez); camera.rotation.set(0, 0, 0); camera.updateMatrixWorld();
    const sh = st.shake || { x: 0, y: 0 }, L = (0 - ex - sh.x) * n / ez, R = (W - ex - sh.x) * n / ez, T = (sh.y - ey) * n / ez, B = (sh.y - H - ey) * n / ez;
    camera.projectionMatrix.makePerspective(L, R, T, B, n, 30000); camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    // ground / road / dirt front
    grass.scale.set(W * 8, 9000, 1); grassTex.repeat.set(W * 8 / (u * 6), 9000 / (u * 6)); sandTex.repeat.set(W * 4 / (u * 8), 1); grass.position.set(W / 2, -gy, -3000); road.scale.set(W * 4, u * 2.6, 1); road.position.set(W / 2 + wx, -gy + 0.6, 0);
    dirt.scale.set(W * 8, H, D * 0.9); dirt.position.set(W / 2, -gy - H / 2 - 0.5, D * 0.45 - 200);
    // wall
    const depth = u * 3.2; wallBox.scale.set(wx, gy - wt, depth); wallBox.position.set(wx / 2, -(gy + wt) / 2, -depth * 0.35);
    brick.repeat.set(Math.max(1, wx / (u * 2.4)), Math.max(1, (gy - wt) / (u * 1.25)));
    const cw = u * 0.75, nC = Math.min(crens.length, Math.ceil(wx / (cw * 2))); crens.forEach((m, i) => { m.visible = i < nC; m.scale.set(Math.min(cw, wx - i * cw * 2), u * 0.7, u * 0.7); m.position.set(i * cw * 2 + cw / 2, -wt + u * 0.35, u * 0.45); });
    towers.forEach((t, i) => { const r = u * (i ? 0.95 : 1.2), th = (gy - wt) + u * (i ? 2.2 : 3.4); t.position.set(i ? wx * 0.85 : wx * 0.22, -gy, -depth * (i ? 1.0 : 1.25)); t.userData.body.scale.set(r, th, r); t.userData.body.position.y = th / 2; t.userData.roof.scale.set(r, u * 1.8, r); t.userData.roof.position.y = th + u * 0.9; });
    pole.scale.set(u * 0.07, u * 2.2, u * 0.07); pole.position.set(wx - u * 0.4, -wt + u * 1.6, 0);
    flag.scale.set(u * 0.95, u * 0.55, 1); flag.position.set(wx - u * 0.4 + u * 0.48, -wt + u * 2.35, 0);
    torchPost.scale.set(u * 0.09, u * 0.9, u * 0.09); torchPost.position.set(wx - u * 0.2, -wt + u * 0.45, u * 0.6); flame.scale.set(u * 0.16, u * 0.18, u * 0.16); flame.position.set(wx - u * 0.2, -wt + u * 1.05, u * 0.6);
    // hills + clouds (built once per size)
    if (hills.userData.W !== W) {
      hills.clear(); hills.userData.W = W;
      // rolling hills (low, far), purple mountains behind them
      for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), hillMats[i % 2]); const far = 3200 + (i % 3) * 1500, k = far / 3200; m.scale.set(W * (0.35 + (i * 37 % 10) / 18) * k, H * (0.08 + (i * 53 % 10) / 70) * k, 900 * k); m.position.set(-W * 1.2 + ((i * 0.37) % 1) * W * 3.4, -gy, -far); hills.add(m); }
      for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 7), hillMats[2]); const far = 9000 + (i % 2) * 2000, k = far / 3200; m.scale.set(W * 0.18 * k, H * (0.22 + (i % 3) * 0.06) * k, W * 0.15 * k); m.position.set(-W * 1.6 + i * W * 0.55 * k * 0.5, -gy + H * (0.11 + (i % 3) * 0.03) * k, -far); hills.add(m); }
      // trees, rocks and bushes scattered behind the road (instanced: one draw call each)
      const nT = 70, trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.16, 1, 7), woodMat, nT), crown = new THREE.InstancedMesh(new THREE.ConeGeometry(0.6, 1.5, 8), std(0x3f9a3a, { roughness: 0.8 }), nT), crown2 = new THREE.InstancedMesh(new THREE.SphereGeometry(0.62, 12, 8), std(0x5cb84a, { roughness: 0.85 }), nT);
      const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), Sc = new THREE.Vector3(); let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < nT; i++) { const z = -u * 4 - rnd() * 2600, x = -W * 0.6 + rnd() * W * 2.4, h = u * (2.4 + rnd() * 2.2), round = i % 3 === 0;
        M4.compose(V.set(x, -gy + h * 0.25, z), Q.identity(), Sc.set(h * 0.5, h * 0.5, h * 0.5)); trunk.setMatrixAt(i, M4);
        M4.compose(V.set(x, -gy + h * (round ? 0.75 : 0.8), z), Q.identity(), Sc.set(round ? 0.001 : h * 0.6, round ? 0.001 : h * 0.6, round ? 0.001 : h * 0.6)); crown.setMatrixAt(i, M4);
        M4.compose(V.set(x, -gy + h * 0.75, z), Q.identity(), Sc.set(round ? h * 0.75 : 0.001, round ? h * 0.7 : 0.001, round ? h * 0.75 : 0.001)); crown2.setMatrixAt(i, M4); }
      [trunk, crown, crown2].forEach((m) => { m.castShadow = true; hills.add(m); });
      const nR = 40, rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), std(0x9a94b4, { roughness: 0.9, flatShading: true }), nR), bushes = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), std(0x4fae3f, { roughness: 0.9 }), nR);
      for (let i = 0; i < nR; i++) { const r = u * (0.25 + rnd() * 0.5); M4.compose(V.set(-W * 0.2 + rnd() * W * 1.6, -gy + r * 0.3, (i % 2 ? -u * (1.8 + rnd() * 10) : u * (1.7 + rnd() * 3))), Q.setFromAxisAngle(V.clone().set(0, 1, 0), rnd() * 6), Sc.set(r * 1.3, r * 0.8, r)); rocks.setMatrixAt(i, M4);
        const b = u * (0.4 + rnd() * 0.5); M4.compose(V.set(-W * 0.2 + rnd() * W * 1.6, -gy + b * 0.4, -u * (1.6 + rnd() * 14)), Q.identity(), Sc.set(b * 1.4, b, b)); bushes.setMatrixAt(i, M4); }
      [rocks, bushes].forEach((m) => { m.castShadow = true; m.receiveShadow = true; hills.add(m); });
      clouds.clear(); for (let i = 0; i < 7; i++) { const c = new THREE.Group(); for (let k = 0; k < 4; k++) { const p = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), cloudMat); p.scale.setScalar(u * (2 + k % 2)); p.position.set(k * u * 2.2, Math.sin(k) * u, 0); c.add(p); } c.position.set(i * W * 0.4 - W, -H * 0.05 + (i % 3) * H * 0.12 + 1500 * 0, -3500); c.userData.sp = 8 + i * 3; clouds.add(c); }
    }
    sun.position.set(-W * 0.5, H * 1.6 - gy, D * 0.8); sun.target.position.set(W * 0.5, -gy, 0);
    const sc = sun.shadow.camera, S = Math.max(W, H) * 1.3; sc.left = -S; sc.right = S; sc.top = S; sc.bottom = -S; sc.near = 10; sc.far = 8000; sc.updateProjectionMatrix();
  }
  function setOutfit(o) { A.body.color.set(o.body); A.dark.color.set(o.dark); A.hood.color.set(o.hood); A.cape.color.set(o.cape); }
  return {
    canvas: cv,
    resize(w, h, ratio) { W = w; H = h; dpr = Math.min(ratio || 1, phone ? 1.5 : 2); renderer.setPixelRatio(dpr); renderer.setSize(W, H, false); hills.userData.W = 0; },
    /* st: everything the game knows, in screen pixels (see arrow-rampart.js view3dState) */
    render(st) {
      if (!st || !st.u) return;
      const u = st.u, t = st.time, night = st.mode === 'night';
      layoutWorld(st);
      // sky / mood
      skyMat.map = night ? nightSky : daySky; orb.material.color.set(night ? 0xfff6d8 : 0xfff3c4);
      orb.scale.setScalar(night ? 420 : 520); orb.position.set(W * (night ? 0.78 : 0.82), H * 0.9 - st.gy + 600, -9000);
      hemi.intensity = night ? 0.3 : 1.25; sun.intensity = night ? 0.55 : 2.2; hemi.color.set(night ? 0x6a78c8 : 0xcfeaff); hemi.groundColor.set(night ? 0x1a2030 : 0x6b8a4a); sun.color.set(night ? 0x8aa0ff : 0xfff1dc);
      torch.intensity = night ? 1.6e5 * (1 + Math.sin(t * 13) * 0.1 + Math.sin(t * 7.3) * 0.08) : 0; torch.decay = 2; torch.position.set(st.wallX - u * 0.2, -st.wallTop + u * 1.2, u * 1.2); torch.distance = 0;
      flame.scale.y = u * (0.18 + Math.sin(t * 17) * 0.03); flame.visible = true;
      scene.fog = night ? (scene.userData.nf || (scene.userData.nf = new THREE.Fog(0x141436, 1500, 9000))) : (scene.userData.df || (scene.userData.df = new THREE.Fog(0xdcefff, 6000, 16000)));
      clouds.children.forEach((c) => { c.position.x += c.userData.sp * 0.016; if (c.position.x > W * 2) c.position.x = -W * 1.2; c.visible = !night; });
      // flag wave
      const fp = flagGeo.attributes.position; for (let i = 0; i < fp.count; i++) { const x = fp.getX(i) + 0.5; fp.setZ(i, Math.sin(t * 6 - x * 5) * 0.12 * x); } fp.needsUpdate = true;
      // wall damage: cracks + shake
      castle.position.x = st.wallHit > 0 ? Math.sin(t * 60) * st.wallHit * 2 : 0;
      const dk = st.wallDmg, nCr = dk > 0.75 ? 3 : dk > 0.5 ? 2 : dk > 0.25 ? 1 : 0;
      if (cracks.userData.n !== nCr) { cracks.clear(); cracks.userData.n = nCr; for (let i = 0; i < nCr; i++) { const pts = [], x0 = st.wallX - u * (0.3 + i * 0.9), y0 = -st.wallTop - u * (1 + i * 1.3); for (let k = 0; k < 5; k++) pts.push(new THREE.Vector3(x0 - k * u * 0.35 * (k % 2 ? 1 : 0.4), y0 - k * u * 0.45, u * 1.05)); cracks.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), crackMat)); } }
      // archer + bow
      setOutfit(st.outfit); A.bow.color.set(st.bowWood); bowGlow.visible = !!st.bowFire;
      archer.scale.setScalar(u); archer.position.set(st.archer.x, -st.archer.y - u * 0.75, 0);
      bowG.rotation.z = -st.aimAng; const pull = Math.max(-0.2, st.pull), tipX = 0.25 + Math.cos(1.15) * 0.75, tipY = Math.sin(1.15) * 0.75;
      strGeo.attributes.position.setXYZ(0, tipX, tipY, 0); strGeo.attributes.position.setXYZ(1, tipX - Math.max(0, pull) * 0.75, 0, 0); strGeo.attributes.position.setXYZ(2, tipX, -tipY, 0); strGeo.attributes.position.needsUpdate = true;
      // raiders
      lastSeen++;
      st.foes.forEach((f) => {
        let g = foeMeshes.get(f); if (!g) { g = makeFoe(f, st.kinds[f.k]); foeMeshes.set(f, g); }
        g.userData.seen = lastSeen; const d = st.kinds[f.k], s = d.sz * u, U = g.userData;
        g.scale.setScalar(s); const fy = f.fly ? f.y + Math.sin(t * 4 + f.bob) * u * 0.15 : st.gy;
        g.position.set(f.x, -fy, 0); g.rotation.set(0, 0, f.dead ? -f.dead * 4 : 0);
        const step = f.atk > 0 ? 0 : Math.sin(f.walk) * 0.5; U.legs[0].rotation.z = step; U.legs[1].rotation.z = -step; U.legs.forEach((l) => { l.visible = !f.fly; });
        U.club.rotation.z = f.atk > 0 ? 0.4 + Math.sin(f.atk * 9) * 0.9 : 0.3; U.body.position.y = 0.78 + (f.atk > 0 ? 0 : Math.abs(Math.sin(f.walk)) * 0.04);
        if (U.wings) U.wings.forEach((w, i) => { w.rotation.x = (i ? -1 : 1) * (0.4 + Math.sin(t * 18 + f.bob) * 0.5); });
        U.flames.forEach((m, i) => { m.visible = f.burn > 0; m.scale.y = 1 + Math.sin(t * 15 + i) * 0.3; });
        U.ice.visible = f.frozen > 0;
        const flash = f.hit > 0.5, a = f.dead ? Math.max(0, 1 - f.dead * 3) : 1;
        U.mats.forEach((m) => { m.emissive.set(flash ? 0xffffff : night ? 0x000000 : 0x000000); m.emissiveIntensity = flash ? 0.9 : 0; m.transparent = a < 1; m.opacity = a; });
        U.eyes.forEach((p) => { p.material = night ? flameMat : ink; });
      });
      foeMeshes.forEach((g, f) => { if (g.userData.seen !== lastSeen) { scene.remove(g); foeMeshes.delete(f); } });
      // arrows (flying + stuck)
      let ai = 0; const put = (x, y, ang, fire, alpha) => { const g = arrowPool[ai] || (arrowPool[ai] = makeArrow()); ai++; g.visible = true; g.scale.setScalar(u * 0.9); g.position.set(x, -y, 0); g.rotation.set(0, 0, -ang - Math.PI / 2); g.userData.fire.visible = !!fire; };
      st.arrows.forEach((ar) => put(ar.x, ar.y, Math.atan2(ar.vy, ar.vx), st.fireArrows || ar.sp, 1));
      st.stuck.forEach((s) => { const a = 1 - Math.max(0, s.t - 1.2) / 0.4; if (a <= 0.05) return; if (s.f) put(s.f.x + s.dx, (s.f.fly ? s.f.y : st.gy) + s.dy, s.a, false, a); else put(s.x, s.y, s.a, false, a); });
      if (st.ready) put(st.archer.x + Math.cos(st.aimAng) * u * (0.6 - Math.max(0, st.pull) * 0.5), st.archer.y - u * 0.1 + Math.sin(st.aimAng) * u * (0.6 - Math.max(0, st.pull) * 0.5), st.aimAng, st.fireArrows, 1);
      for (let i = ai; i < arrowPool.length; i++) arrowPool[i].visible = false;
      // special-arrow rings
      let fi = 0; st.fx.forEach((q) => { if (q.k !== 'ring') return; const m = fxPool[fi] || (fxPool[fi] = (() => { const r = new THREE.Mesh(G.ring, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true })); scene.add(r); return r; })()); fi++; m.visible = true; m.material.color.set(q.col); m.material.opacity = Math.max(0, 1 - q.t / 0.5); m.scale.setScalar(q.r * (0.4 + q.t * 1.4)); m.position.set(q.x, -q.y, 0); m.rotation.x = Math.PI / 2.4; });
      for (let i = fi; i < fxPool.length; i++) fxPool[i].visible = false;
      renderer.render(scene, camera);
    }
  };
}
window.ArrowView = createView; // set while this module loads, before the game module runs
