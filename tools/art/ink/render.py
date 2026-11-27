# Ink Heroes — 3D art rendered with Blender (headless):
#   blender -b -P tools/art/ink/render.py -- [only_prefix]
# Builds glossy "ink" stick figures, zombies, bosses and guns from primitives and renders transparent WebP
# images into games/art/ink-heroes/ (portraits p_*, heroes h_*, zombies z_*, guns g_*, key art key.jpg).
import bpy, math, os, sys
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
OUT = os.path.join(ROOT, 'games', 'art', 'ink-heroes')
os.makedirs(OUT, exist_ok=True)
ONLY = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv and len(sys.argv) > sys.argv.index('--') + 1 else ''

MATS = {}
def hexcol(h, a=1.0):
    h = h.lstrip('#'); r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    lin = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (lin(r), lin(g), lin(b), a)

# ---------------------------------------------------------------- scene helpers
def reset(w, h, samples=24):
    bpy.ops.wm.read_factory_settings(use_empty=True); MATS.clear()
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = samples
    sc.cycles.use_denoising = False; sc.cycles.samples = samples * 3; sc.cycles.max_bounces = 4
    sc.render.filter_size = 1.2
    sc.render.resolution_x, sc.render.resolution_y = w, h; sc.render.resolution_percentage = 100
    sc.render.film_transparent = True
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    sc.render.image_settings.file_format = 'WEBP'; sc.render.image_settings.color_mode = 'RGBA'; sc.render.image_settings.quality = 82
    world = bpy.data.worlds.new('W'); sc.world = world; world.use_nodes = True
    bg = world.node_tree.nodes['Background']; bg.inputs[0].default_value = hexcol('#2A1D44'); bg.inputs[1].default_value = 0.35
    return sc

def mat(name, col, rough=0.35, coat=0.6, emit=None, estr=0.0, metal=0.0):
    key = (name, col, rough, coat, emit, estr, metal)
    if key in MATS: return MATS[key]
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = hexcol(col); p.inputs['Roughness'].default_value = rough; p.inputs['Metallic'].default_value = metal
    for k in ('Coat Weight', 'Clearcoat'):
        if k in p.inputs: p.inputs[k].default_value = coat; break
    if emit:
        for k in ('Emission Color', 'Emission'):
            if k in p.inputs: p.inputs[k].default_value = hexcol(emit); break
        p.inputs['Emission Strength'].default_value = estr
    MATS[key] = m; return m

def link(o, m):
    o.data.materials.append(m); return o

def smooth(o):
    for p in o.data.polygons: p.use_smooth = True
    return o

def sphere(loc, r, m, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=32, ring_count=16)
    o = bpy.context.object; o.scale = scale; return link(smooth(o), m)

def limb(a, b, r, m, r2=None):
    a, b = Vector(a), Vector(b); d = b - a
    bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r2 if r2 is not None else r, depth=d.length, location=(a + b) / 2, vertices=24)
    o = bpy.context.object; o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = d.to_track_quat('Z', 'Y')
    link(smooth(o), m)
    sphere(a, r, m); sphere(b, r2 if r2 is not None else r, m)
    return o

def box(loc, size, m, rot=(0, 0, 0), bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object; o.scale = size
    if bevel:
        bv = o.modifiers.new('b', 'BEVEL'); bv.width = bevel; bv.segments = 3
    return link(o, m)

def cyl(loc, r, depth, m, rot=(0, 0, 0), verts=24):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, rotation=rot, vertices=verts)
    return link(smooth(bpy.context.object), m)

def light(kind, loc, energy, col='#FFFFFF', size=1.0, target=(0, 0, 1)):
    d = bpy.data.lights.new('L', kind); d.energy = energy; d.color = hexcol(col)[:3]
    if kind == 'AREA': d.size = size
    o = bpy.data.objects.new('L', d); bpy.context.collection.objects.link(o); o.location = loc
    o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y')
    return o

def camera(loc, target, lens=50, ortho=None):
    d = bpy.data.cameras.new('C'); d.lens = lens
    if ortho: d.type = 'ORTHO'; d.ortho_scale = ortho
    o = bpy.data.objects.new('C', d); bpy.context.collection.objects.link(o); o.location = loc
    o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y')
    bpy.context.scene.camera = o; return o

def rig_lights(acc, rim2='#7A9CFF', key=900):
    light('AREA', (-2.5, -4, 4), key, '#FFE7D0', 4, (0, 0, 1))
    light('AREA', (3, 3, 3), 1400, acc, 2.5, (0, 0, 1.1))
    light('AREA', (-3, 3, 2.5), 900, rim2, 2.5, (0, 0, 1.1))
    light('AREA', (0, -3, -0.5), 120, '#B9A6FF', 3, (0, 0, 1))

def render(name):
    bpy.context.scene.render.filepath = os.path.join(OUT, name)
    bpy.ops.render.render(write_still=True)
    print('rendered', name)

# ---------------------------------------------------------------- stick figures
# joints in metres; x = forward (facing right), y = depth (+ = away from camera), z = up
POSES = {
    'guard': dict(pel=(0, 0, 0.98), neck=(0.04, 0, 1.52), head=(0.06, 0, 1.72), sh=(0.04, 0, 1.47),
                  fe=(0.30, -0.12, 1.30), fh=(0.42, -0.10, 1.50), be=(0.20, 0.14, 1.20), bh=(0.36, 0.12, 1.40),
                  fk=(0.22, -0.11, 0.55), ff=(0.28, -0.12, 0.05), bk=(-0.12, 0.11, 0.52), bf=(-0.30, 0.12, 0.05)),
    'kick': dict(pel=(0, 0, 1.0), neck=(-0.16, 0, 1.52), head=(-0.20, 0, 1.72), sh=(-0.14, 0, 1.47),
                 fe=(0.04, -0.14, 1.36), fh=(0.16, -0.12, 1.50), be=(-0.38, 0.14, 1.32), bh=(-0.58, 0.12, 1.24),
                 fk=(0.38, -0.11, 1.12), ff=(0.82, -0.12, 1.28), bk=(0.02, 0.11, 0.52), bf=(-0.08, 0.12, 0.05)),
    'heavy': dict(pel=(0, 0, 0.95), neck=(0.02, 0, 1.50), head=(0.04, 0, 1.70), sh=(0.02, 0, 1.45),
                  fe=(0.22, -0.16, 1.18), fh=(0.34, -0.12, 1.30), be=(-0.12, 0.16, 1.18), bh=(0.10, 0.12, 1.26),
                  fk=(0.26, -0.13, 0.52), ff=(0.30, -0.14, 0.05), bk=(-0.18, 0.13, 0.50), bf=(-0.32, 0.14, 0.05)),
    'zombie': dict(pel=(0, 0, 0.92), neck=(0.22, 0, 1.42), head=(0.34, 0, 1.56), sh=(0.20, 0, 1.38),
                   fe=(0.48, -0.14, 1.30), fh=(0.80, -0.12, 1.30), be=(0.44, 0.14, 1.24), bh=(0.74, 0.12, 1.20),
                   fk=(0.16, -0.11, 0.48), ff=(0.10, -0.12, 0.05), bk=(-0.14, 0.11, 0.50), bf=(-0.26, 0.12, 0.05)),
    'run': dict(pel=(0, 0, 0.90), neck=(0.30, 0, 1.38), head=(0.44, 0, 1.52), sh=(0.28, 0, 1.34),
                fe=(0.10, -0.14, 1.08), fh=(-0.10, -0.12, 1.02), be=(0.50, 0.14, 1.18), bh=(0.76, 0.12, 1.30),
                fk=(0.34, -0.11, 0.62), ff=(0.30, -0.12, 0.18), bk=(-0.18, 0.11, 0.48), bf=(-0.46, 0.12, 0.26)),
    'crouch': dict(pel=(0, 0, 0.55), neck=(0.30, 0, 0.92), head=(0.44, 0, 1.02), sh=(0.28, 0, 0.88),
                   fe=(0.46, -0.14, 0.62), fh=(0.64, -0.12, 0.42), be=(0.40, 0.14, 0.58), bh=(0.58, 0.12, 0.30),
                   fk=(0.26, -0.11, 0.36), ff=(0.20, -0.12, 0.05), bk=(-0.12, 0.11, 0.30), bf=(-0.24, 0.12, 0.05)),
}

def figure(pose, body, head_m, r=0.055, size=1.0, off=(0, 0, 0), head_r=0.15, belly=0.0):
    P = {k: tuple(v[i] * size + off[i] for i in range(3)) for k, v in POSES[pose].items()}
    rr = r * size
    limb(P['pel'], P['neck'], rr * 1.25, body, rr * 1.1)
    if belly: sphere(tuple((Vector(P['pel']) * 0.55 + Vector(P['neck']) * 0.45)), belly * size, body, (1.05, 0.9, 1.0))
    for a, b, c in (('sh', 'fe', 'fh'), ('sh', 'be', 'bh'), ('pel', 'fk', 'ff'), ('pel', 'bk', 'bf')):
        A = P[a] if a == 'pel' else tuple(P['sh'][i] + (P[b][1] * 0.6 if i == 1 else 0) for i in range(3))
        limb(A, P[b], rr, body); limb(P[b], P[c], rr * 0.92, body)
    sphere(P['head'], head_r * size, head_m)
    return P

def hero_parts(hid, P, s=1.0):
    acc = HERO_ACC[hid]; A = mat('acc_' + hid, acc, 0.4, 0.3)
    hx, hy, hz = P['head']; R = 0.15 * s
    if hid == 'kai':  # headband + flowing scarf tails
        cyl((hx, hy, hz + 0.02 * s), R * 1.04, 0.06 * s, A)
        for i, (dx, dz) in enumerate(((-0.18, -0.02), (-0.34, -0.08), (-0.5, -0.06), (-0.64, -0.14))):
            limb((hx - R + (dx + 0.12) * s, hy + 0.02 * i, hz + dz * s), (hx - R + dx * s, hy + 0.02 * i, hz + (dz - 0.04) * s), 0.028 * s, A, 0.02 * s)
    elif hid == 'rook':  # hard hat + sledgehammer
        bpy.ops.mesh.primitive_uv_sphere_add(radius=R * 1.12, location=(hx, hy, hz + 0.02 * s), segments=32, ring_count=16)
        o = bpy.context.object; o.scale = (1, 1, 0.75); link(smooth(o), A)
        cyl((hx + 0.02 * s, hy, hz - 0.02 * s), R * 1.35, 0.03 * s, A)
        fh = Vector(P['fh']); limb(fh + Vector((-0.1, 0, -0.25)) * s, fh + Vector((0.12, 0, 0.55)) * s, 0.025 * s, mat('wood', '#5A3A22', 0.6, 0))
        box(tuple(fh + Vector((0.14, 0, 0.6)) * s), (0.28 * s, 0.16 * s, 0.16 * s), mat('steel', '#5A606C', 0.4, 0.1, metal=0.8), bevel=0.01)
    elif hid == 'vex':  # glowing visor
        box((hx + 0.07 * s, hy, hz + 0.02 * s), (0.18 * s, 0.30 * s, 0.07 * s), mat('visor', '#0A2A30', 0.1, 1.0, emit=acc, estr=8), bevel=0.02)
    elif hid == 'juno':  # mask band + katana
        cyl((hx, hy, hz - 0.01 * s), R * 1.04, 0.075 * s, A)
        bh = Vector(P['bh']); limb(bh + Vector((-0.05, 0, -0.04)) * s, bh + Vector((0.05, 0, 0.12)) * s, 0.02 * s, mat('grip', '#111111', 0.6, 0))
        box(tuple(bh + Vector((0.18, 0, 0.55)) * s), (0.03 * s, 0.012 * s, 0.85 * s), mat('blade', '#E6EEF8', 0.08, 0.2, metal=1.0), rot=(0, -0.3, 0))

HERO_ACC = {'kai': '#FF3B4E', 'rook': '#FF9F1C', 'vex': '#3EE0FF', 'juno': '#B06CFF'}
HERO_POSE = {'kai': 'kick', 'rook': 'heavy', 'vex': 'guard', 'juno': 'guard'}
INK = lambda: mat('ink', '#141018', 0.28, 1.0)
INKHEAD = lambda: mat('inkhead', '#16121C', 0.22, 1.0)

def do_hero(hid):
    # full body
    reset(512, 640, 28); rig_lights(HERO_ACC[hid])
    P = figure(HERO_POSE[hid], INK(), INKHEAD(), size=1.1 if hid == 'rook' else 1.0)
    hero_parts(hid, P, 1.1 if hid == 'rook' else 1.0)
    camera((0.75, -3.25, 1.15), (0.15, 0, 0.9), 50)
    render('h_' + hid)
    # portrait: same model, tight on the head
    camera((P['head'][0] + 0.9, -1.4, P['head'][2] + 0.05), (P['head'][0], 0, P['head'][2] - 0.08), 70)
    bpy.context.scene.render.resolution_x = bpy.context.scene.render.resolution_y = 256
    render('p_' + hid)


def rot_mat(name, col):
    """Movie-zombie skin: the type colour pushed toward rotten grey, mottled with dark rot and wet blood (procedural noise)."""
    key = ('rot', name, col)
    if key in MATS: return MATS[key]
    base = tuple(a * 0.5 + b * 0.5 for a, b in zip(hexcol(col)[:3], hexcol('#6E7460')[:3])) + (1,)
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; p = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord')
    n1 = nt.nodes.new('ShaderNodeTexNoise'); n1.inputs['Scale'].default_value = 9; n1.inputs['Detail'].default_value = 8
    n2 = nt.nodes.new('ShaderNodeTexNoise'); n2.inputs['Scale'].default_value = 4; n2.inputs['Detail'].default_value = 4
    nt.links.new(tc.outputs['Object'], n1.inputs['Vector']); nt.links.new(tc.outputs['Object'], n2.inputs['Vector'])
    r1 = nt.nodes.new('ShaderNodeValToRGB'); r1.color_ramp.elements[0].position = 0.35; r1.color_ramp.elements[0].color = base
    r1.color_ramp.elements[1].position = 0.75; r1.color_ramp.elements[1].color = hexcol('#2E2A20')
    nt.links.new(n1.outputs['Fac'], r1.inputs['Fac'])
    r2 = nt.nodes.new('ShaderNodeValToRGB'); r2.color_ramp.elements[0].position = 0.62; r2.color_ramp.elements[0].color = (0, 0, 0, 1)
    r2.color_ramp.elements[1].position = 0.68; r2.color_ramp.elements[1].color = (1, 1, 1, 1)
    nt.links.new(n2.outputs['Fac'], r2.inputs['Fac'])
    mx = nt.nodes.new('ShaderNodeMixRGB'); mx.inputs['Color2'].default_value = hexcol('#5A070C')
    nt.links.new(r2.outputs['Color'], mx.inputs['Fac']); nt.links.new(r1.outputs['Color'], mx.inputs['Color1'])
    nt.links.new(mx.outputs['Color'], p.inputs['Base Color'])
    nt.links.new(r2.outputs['Color'], p.inputs['Roughness'])  # blood is wet: rough skin, glossy blood (inverted below)
    inv = nt.nodes.new('ShaderNodeInvert'); nt.links.new(r2.outputs['Color'], inv.inputs['Color']); nt.links.new(inv.outputs['Color'], p.inputs['Roughness'])
    MATS[key] = m; return m

def bone_bits(P, s=1.0):
    """Exposed ribs and a torn shirt on a zombie torso."""
    pel, neck = Vector(P['pel']), Vector(P['neck']); up = neck - pel
    rag = mat('rag', '#3E3A32', 0.9, 0)
    for i in range(3):
        c = pel + up * (0.55 + i * 0.1)
        box(tuple(c + Vector((0.02, -0.075 * s, 0))), (0.13 * s, 0.02 * s, 0.022 * s), mat('bone', '#E6D9C2', 0.5, 0.1), rot=(0, 0.25, 0))
    pass

# ---------------------------------------------------------------- zombies & bosses
ZOMB = {  # id: (col, dark, pose, size, extras)
    'shuffler': ('#8DB34E', '#3F5A1E', 'zombie', 1.0, ''), 'dasher': ('#C3DC3E', '#5C6A12', 'run', 0.92, ''),
    'gloop': ('#E2D23C', '#6B5E08', 'zombie', 1.0, 'drool'), 'biter': ('#3FB59A', '#14503F', 'crouch', 0.95, ''),
    'bruiser': ('#8A63C9', '#3A2266', 'zombie', 1.3, 'bulk'), 'popper': ('#F062A8', '#7A1E52', 'zombie', 1.1, 'belly'),
    'doorman': ('#5E9BE0', '#1F3F6B', 'zombie', 1.05, 'door'), 'gravemaw': ('#C2414F', '#4E0E1A', 'zombie', 1.5, 'bulk jaw'),
    'conductor': ('#2FD8C8', '#0E4A44', 'zombie', 1.4, 'cap bulk'), 'hollow': ('#B06CFF', '#3A1466', 'zombie', 1.35, 'hollow'),
    'mother': ('#E2D23C', '#6B5E08', 'zombie', 1.45, 'belly drool bulk'), 'nullk': ('#0B0B0B', '#222222', 'guard', 1.1, 'null'),
}

def do_zombie(zid):
    col, dark, pose, size, ex = ZOMB[zid]
    reset(384, 480, 24)
    rig_lights('#9BFF6A' if zid != 'nullk' else '#FFFFFF', '#FF5A7A' if 'bulk' in ex else '#7A9CFF')
    body = rot_mat('z_' + zid, col) if zid != 'nullk' else mat('z_' + zid, col, 0.5, 0.2); headm = rot_mat('zh_' + zid, col) if zid != 'nullk' else mat('zh_' + zid, col, 0.45, 0.25)
    r = 0.07 if 'bulk' in ex else 0.055
    P = figure(pose, body, headm, r=r, size=1.0, head_r=0.16, belly=0.2 if 'belly' in ex else (0.12 if 'bulk' in ex else 0))
    if zid not in ('nullk', 'popper', 'mother'): bone_bits(P)
    hx, hy, hz = P['head']
    eye = mat('eye_' + zid, '#FFFFFF', 0.2, 0, emit='#FF3B3B' if 'bulk' in ex else '#E8FF6A', estr=10)
    if zid == 'nullk':
        for e in (-0.05, 0.05): sphere((hx + 0.13, hy + e - 0.02, hz + 0.02), 0.03, mat('nulleye', '#FFFFFF', 0.1, 0, emit='#FFFFFF', estr=14))
    elif 'hollow' in ex:
        for e in (-0.05, 0.05): sphere((hx + 0.12, hy + e - 0.02, hz + 0.02), 0.04, mat('void', '#000000', 1, 0))
    else:
        for e in (-0.05, 0.05): sphere((hx + 0.13, hy + e - 0.02, hz + 0.03), 0.026, eye)
    if 'jaw' in ex: box((hx + 0.12, hy, hz - 0.12), (0.2, 0.2, 0.08), mat('jaw', dark, 0.5, 0), bevel=0.02)
    if 'drool' in ex: limb((hx + 0.12, hy - 0.02, hz - 0.08), (hx + 0.14, hy - 0.02, hz - 0.3), 0.025, mat('goo', col, 0.05, 1.0), 0.012)
    if 'cap' in ex: cyl((hx, hy, hz + 0.12), 0.17, 0.08, mat('cap', '#1B2A3A', 0.5, 0)); box((hx + 0.15, hy, hz + 0.09), (0.14, 0.24, 0.02), mat('cap', '#1B2A3A', 0.5, 0))
    if 'door' in ex: box((P['fh'][0] + 0.06, -0.25, 1.0), (0.06, 0.05, 0.75), mat('door', '#9AA7B8', 0.3, 0.6, metal=0.6), bevel=0.02); box((P['fh'][0] + 0.07, -0.28, 1.16), (0.065, 0.02, 0.32), mat('glass', '#2A3A55', 0.05, 1))
    if zid == 'nullk':  # white glitch shards around NULL
        for i in range(9):
            a = i * 0.7; box((math.cos(a) * 0.55, -0.2 + 0.05 * i, 1.0 + math.sin(a * 1.7) * 0.6), (0.04, 0.02, 0.16), mat('glitch', '#FFFFFF', 0.2, 0, emit='#FFFFFF', estr=4), rot=(0, a, 0))
    for o in bpy.context.scene.objects:
        if o.type == 'MESH': o.scale = o.scale * 1  # keep
    # scale the whole figure for big ones via the camera distance
    camera((0.85, -3.2, 1.05), (0.28, 0, 0.85), 50)
    if size > 1.0:
        for o in list(bpy.context.scene.objects):
            if o.type == 'MESH': o.location = o.location * size; o.scale = o.scale * size
        cam = bpy.context.scene.camera; cam.location = (0.85 * size, -3.2 * size, 1.05 * size)
        cam.rotation_quaternion = (Vector((0.28 * size, 0, 0.85 * size)) - cam.location).to_track_quat('-Z', 'Y')
    render('z_' + zid)

# ---------------------------------------------------------------- guns
GUNS = ['pistol', 'twin', 'smg', 'shotgun', 'rifle', 'sniper', 'lmg', 'laser', 'frost', 'rocket', 'tesla', 'kunai']
def gun(look, x=0, y=0, z=0):
    dark = mat('gdark', '#2A2A34', 0.35, 0.5, metal=0.5); mid = mat('gmid', '#6A6A7E', 0.3, 0.6, metal=0.6)
    wood = mat('gwood', '#7A5230', 0.55, 0.3); gold = mat('ggold', '#C8A030', 0.25, 0.4, metal=1.0)
    B = lambda cx, cz, w, h, m, d=0.075, bv=0.01: box((x + cx, y, z + cz), (w, d, h), m, bevel=bv)
    B(0.0, -0.06, 0.06, 0.13, dark)  # grip
    if look in ('pistol', 'twin'): B(0.09, 0.03, 0.26, 0.07, gold if look == 'twin' else mid)
    elif look == 'kunai':
        box((x + 0.1, y, z), (0.24, 0.01, 0.06), mat('kn', '#C7CED8', 0.15, 0.3, metal=1), bevel=0.004)
    elif look == 'smg': B(0.1, 0.03, 0.32, 0.09, mid); B(0.08, -0.08, 0.05, 0.13, dark); B(0.28, 0.04, 0.08, 0.035, dark)
    elif look == 'shotgun': B(-0.15, 0.0, 0.18, 0.08, wood); B(0.2, 0.03, 0.44, 0.06, mid); B(0.14, -0.03, 0.22, 0.04, wood)
    elif look == 'rifle': B(-0.15, 0.01, 0.18, 0.09, dark); B(0.17, 0.03, 0.42, 0.09, mid); B(0.43, 0.04, 0.12, 0.03, dark); B(0.1, -0.08, 0.05, 0.12, dark)
    elif look == 'sniper': B(-0.18, 0.0, 0.2, 0.08, mat('gsn', '#3A3A28', 0.5, 0.3)); B(0.15, 0.03, 0.38, 0.07, mid); B(0.5, 0.04, 0.34, 0.025, dark); cyl((x + 0.12, y, z + 0.11), 0.03, 0.22, dark, rot=(0, math.pi / 2, 0))
    elif look == 'lmg': B(-0.14, 0.01, 0.16, 0.09, dark); B(0.2, 0.03, 0.48, 0.12, mid); B(0.52, 0.04, 0.18, 0.04, dark); B(0.12, -0.1, 0.12, 0.12, mat('gbox', '#5E6B3A', 0.5, 0.2))
    elif look == 'laser': B(0.13, 0.03, 0.38, 0.11, mat('glw', '#E6F0FF', 0.2, 0.8), bv=0.03); B(0.14, 0.03, 0.3, 0.03, mat('glc', '#3EE0FF', 0.1, 0, emit='#3EE0FF', estr=8), d=0.055)
    elif look == 'frost': B(0.12, 0.03, 0.34, 0.11, mat('gfw', '#DDF4FF', 0.2, 0.8), bv=0.03); B(0.33, 0.03, 0.1, 0.08, mat('gfb', '#38B6FF', 0.1, 0.5, emit='#38B6FF', estr=3), bv=0.02)
    elif look == 'rocket': cyl((x + 0.12, y, z + 0.06), 0.07, 0.62, mat('grk', '#5E7A3A', 0.5, 0.3), rot=(0, math.pi / 2, 0)); cyl((x + 0.44, y, z + 0.06), 0.08, 0.05, dark, rot=(0, math.pi / 2, 0))
    elif look == 'tesla':
        B(0.06, 0.03, 0.24, 0.1, mid)
        for j in range(4): cyl((x + 0.2 + j * 0.05, y, z + 0.03), 0.035, 0.02, mat('gcu', '#B87333', 0.3, 0.3, metal=1), rot=(0, math.pi / 2, 0))
        sphere((x + 0.42, y, z + 0.03), 0.04, mat('gte', '#C08BFF', 0.1, 0, emit='#C08BFF', estr=10))

def do_gun(look):
    reset(320, 160, 20); rig_lights('#FFD08A', '#7A9CFF', 1600)
    if look == 'twin': gun('twin', -0.12, 0.1, 0.05); gun('twin', 0.05, -0.1, -0.05)
    else: gun(look)
    camera((0.75, -2.0, 0.75), (0.15, 0, 0.0), 50, ortho=0.95 if look not in ('pistol', 'twin', 'kunai') else 0.62)
    render('g_' + look)

# ---------------------------------------------------------------- key art (menu background)
def do_key():
    sc = reset(1280, 720, 48); sc.render.film_transparent = False
    sc.render.image_settings.file_format = 'JPEG'; sc.render.image_settings.color_mode = 'RGB'; sc.render.image_settings.quality = 80
    w = sc.world.node_tree.nodes['Background']; w.inputs[0].default_value = hexcol('#1A0F2E'); w.inputs[1].default_value = 0.6
    # sky gradient wall + moon
    box((0, 14, 5), (60, 0.2, 30), mat('sky', '#2A1540', 1, 0, emit='#3A1A55', estr=0.6))
    sphere((4.5, 13, 5.2), 2.2, mat('moon', '#FFE9C7', 1, 0, emit='#FFD9A0', estr=3))
    # skyline: three layers of boxy buildings with lit windows
    import random; random.seed(7)
    for layer, (y, col, hmax) in enumerate(((11, '#2B1A40', 7), (8, '#22142F', 5.5), (5.5, '#1A0F24', 4))):
        x = -16
        while x < 16:
            bw = random.uniform(1.2, 2.6); bh = random.uniform(1.5, hmax)
            box((x + bw / 2, y, bh / 2), (bw, 1.5, bh), mat('b%d' % layer, col, 0.9, 0))
            for wx in range(int(bw / 0.5)):
                for wz in range(int(bh / 0.7)):
                    if random.random() < 0.28:
                        box((x + 0.3 + wx * 0.5, y - 0.76, 0.6 + wz * 0.7), (0.18, 0.02, 0.24), mat('win', '#FFC870', 1, 0, emit='#FFB04A', estr=2.5 - layer * 0.5))
            x += bw + random.uniform(0.05, 0.4)
    # street
    box((0, 0, -0.05), (60, 30, 0.1), mat('street', '#2A2233', 0.25, 0.8))
    # hero mid kick in the centre, zombies closing in
    P = figure('kick', INK(), INKHEAD(), size=1.15, off=(-0.4, 0, 0)); hero_parts('kai', P, 1.15)
    zs = [(1.7, 0.3, 'shuffler', 1.0), (2.6, 1.2, 'bruiser', 1.3), (3.4, 0.6, 'dasher', 0.9), (-2.4, 0.5, 'shuffler', 1.0), (-3.3, 1.5, 'popper', 1.05), (4.6, 2.2, 'gloop', 1.0), (-4.6, 2.4, 'shuffler', 1.0)]
    for x, y, zid, s in zs:
        col = ZOMB[zid][0]; flip = -1 if x > 0 else 1
        Q = {k: (v[0] * flip * s + x, v[1] * s + y, v[2] * s) for k, v in POSES['zombie'].items()}
        bm = rot_mat('z_' + zid, col)
        limb(Q['pel'], Q['neck'], 0.07 * s, bm, 0.06 * s)
        for a, b, c in (('sh', 'fe', 'fh'), ('sh', 'be', 'bh'), ('pel', 'fk', 'ff'), ('pel', 'bk', 'bf')):
            limb(Q[a], Q[b], 0.055 * s, bm); limb(Q[b], Q[c], 0.05 * s, bm)
        sphere(Q['head'], 0.16 * s, bm)
        for e in (-0.05, 0.05): sphere((Q['head'][0] + 0.12 * flip * s, Q['head'][1] + e - 0.03, Q['head'][2] + 0.03), 0.025 * s, mat('zeye', '#FFFFFF', 0.2, 0, emit='#E8FF6A', estr=12))
    # ink splashes on the ground
    for i in range(14):
        a = i * 2.39; r = 0.6 + (i % 5) * 0.45
        bpy.ops.mesh.primitive_cylinder_add(radius=0.12 + (i % 3) * 0.08, depth=0.01, location=(math.cos(a) * r - 0.3, math.sin(a) * r * 0.5, 0.005))
        link(bpy.context.object, mat('splat', '#0A0810', 0.1, 1.0))
    light('AREA', (-3, -5, 6), 2600, '#FFE2C8', 6, (0, 0, 1))
    light('AREA', (2, 4, 3), 3000, '#FF3B4E', 4, (0, 0, 1.2))
    light('AREA', (-3, 4, 3), 2000, '#7A6CFF', 4, (0, 0, 1.2))
    light('POINT', (4.5, 11, 5.2), 4000, '#FFD9A0')
    camera((0.6, -8.2, 1.5), (0.4, 0, 1.55), 35)
    render('key.jpg')

JOBS = [('h_' + h, lambda h=h: do_hero(h)) for h in HERO_ACC] + [('z_' + z, lambda z=z: do_zombie(z)) for z in ZOMB] + \
       [('g_' + g, lambda g=g: do_gun(g)) for g in GUNS] + [('key', do_key)]
for name, fn in JOBS:
    if ONLY and not name.startswith(ONLY): continue
    fn()
print('ALL DONE')
