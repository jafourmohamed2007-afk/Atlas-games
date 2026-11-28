# Arrow Rampart — 3D item icons rendered with Blender (headless):
#   blender -b -P tools/art/arrow/icons.py -- [only_prefix]
# Every icon is built from primitives with glossy toy-like materials and rendered as a transparent WebP
# into games/art/arrow-rampart/i_<id>.webp (modes m_, bows b_, special arrows s_, upgrades u_, outfits o_, cards c_, misc).
import bpy, math, os, sys
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
OUT = os.path.join(ROOT, 'games', 'art', 'arrow-rampart')
os.makedirs(OUT, exist_ok=True)
ONLY = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv and len(sys.argv) > sys.argv.index('--') + 1 else ''
SIZE = 192
MATS = {}

def hexcol(h, a=1.0):
    h = h.lstrip('#'); r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    lin = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (lin(r), lin(g), lin(b), a)

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True); MATS.clear()
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 48; sc.cycles.use_denoising = False; sc.cycles.max_bounces = 4
    sc.render.resolution_x = sc.render.resolution_y = SIZE; sc.render.resolution_percentage = 100; sc.render.film_transparent = True; sc.render.filter_size = 1.2
    sc.view_settings.view_transform = 'Standard'
    sc.render.image_settings.file_format = 'WEBP'; sc.render.image_settings.color_mode = 'RGBA'; sc.render.image_settings.quality = 85
    w = bpy.data.worlds.new('W'); sc.world = w; w.use_nodes = True; bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = hexcol('#FFF4E0'); bg.inputs[1].default_value = 0.5
    # key, rim and fill lights + a camera looking at the origin from the front, a little above
    for loc, e, col, size in (((-2, -3, 4), 700, '#FFF1DC', 3), ((3, 2, 3), 500, '#9CC8FF', 2.5), ((0, -3, -1), 120, '#FFD9B0', 3)):
        d = bpy.data.lights.new('L', 'AREA'); d.energy = e; d.color = hexcol(col)[:3]; d.size = size
        o = bpy.data.objects.new('L', d); bpy.context.collection.objects.link(o); o.location = loc
        o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat('-Z', 'Y')
    c = bpy.data.cameras.new('C'); c.type = 'ORTHO'; c.ortho_scale = 2.4
    o = bpy.data.objects.new('C', c); bpy.context.collection.objects.link(o); o.location = (1.2, -4.2, 2.0)
    o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = (Vector((0, 0, 0)) - o.location).to_track_quat('-Z', 'Y'); sc.camera = o

def mat(col, rough=0.35, metal=0.0, emit=None, estr=0.0, coat=0.5, alpha=1.0):
    key = (col, rough, metal, emit, estr, coat, alpha)
    if key in MATS: return MATS[key]
    m = bpy.data.materials.new('M'); m.use_nodes = True; p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = hexcol(col); p.inputs['Roughness'].default_value = rough; p.inputs['Metallic'].default_value = metal
    if 'Coat Weight' in p.inputs: p.inputs['Coat Weight'].default_value = coat
    if emit:
        p.inputs['Emission Color'].default_value = hexcol(emit); p.inputs['Emission Strength'].default_value = estr
    if alpha < 1:
        p.inputs['Alpha'].default_value = alpha; p.inputs['Transmission Weight'].default_value = 0.6
    MATS[key] = m; return m

def put(o, m, smooth=True):
    o.data.materials.append(m)
    if smooth:
        for f in o.data.polygons: f.use_smooth = True
    return o
def sphere(loc, r, m, sc=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=32, ring_count=16); o = bpy.context.object; o.scale = sc; return put(o, m)
def box(loc, size, m, rot=(0, 0, 0), bevel=0.02):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot); o = bpy.context.object; o.scale = size
    if bevel: b = o.modifiers.new('b', 'BEVEL'); b.width = bevel; b.segments = 3
    return put(o, m, False)
def cyl(loc, r, d, m, rot=(0, 0, 0), v=32, r2=None):
    if r2 is None: bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=d, location=loc, rotation=rot, vertices=v)
    else: bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r2, depth=d, location=loc, rotation=rot, vertices=v)
    return put(bpy.context.object, m)
def seg(a, b, r, m, r2=None):
    a, b = Vector(a), Vector(b); d = b - a
    bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r if r2 is None else r2, depth=d.length, location=(a + b) / 2, vertices=24)
    o = bpy.context.object; o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = d.to_track_quat('Z', 'Y'); return put(o, m)
def torus(loc, R, r, m, rot=(0, 0, 0), arc=None):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, location=loc, rotation=rot, major_segments=64, minor_segments=16)
    o = bpy.context.object
    if arc:  # keep only part of the ring (a bow limb): delete vertices outside the angle range
        import bmesh
        bm = bmesh.new(); bm.from_mesh(o.data)
        kill = [v for v in bm.verts if abs(math.atan2(v.co.y, v.co.x)) > arc]
        bmesh.ops.delete(bm, geom=kill, context='VERTS'); bm.to_mesh(o.data); bm.free()
    return put(o, m)
def render(name):
    bpy.context.scene.render.filepath = os.path.join(OUT, 'i_' + name); bpy.ops.render.render(write_still=True); print('icon', name)

WOOD = '#8A5A2B'
def arrow(a, b, head_m=None, fl='#E8364F', r=0.035):
    a, b = Vector(a), Vector(b); d = (b - a).normalized()
    seg(a, b, r, mat(WOOD, 0.6, coat=0.2))
    seg(b, b + d * 0.32, 0.11, head_m or mat('#B8C2CE', 0.2, 0.9), 0.0)
    for k in range(3):
        ang = k * 2.094; side = d.cross(Vector((0, 0, 1))).normalized() if abs(d.z) < 0.9 else Vector((1, 0, 0))
        up = d.cross(side); off = (side * math.cos(ang) + up * math.sin(ang)) * 0.09
        seg(a + d * 0.05 + off, a + d * 0.32 + off * 0.4, 0.04, mat(fl, 0.5), 0.01)

def bow_mesh(wood, string='#F4EFE4', glow=None, fire=False, scale=1.0):
    torus((0, 0, 0), 0.95 * scale, 0.07 * scale, mat(wood, 0.35, 0.1 if wood not in ('#C9B458',) else 0.7), rot=(math.pi / 2, 0, 0), arc=1.05)
    tip = (math.cos(1.05) * 0.95 * scale, math.sin(1.05) * 0.95 * scale)
    seg((tip[0], 0, tip[1]), (tip[0], 0, -tip[1]), 0.012, mat(string, 0.5))
    if glow: sphere((0.95 * scale, 0, 0), 0.12, mat(glow, 0.2, emit=glow, estr=4))
    if fire:
        for i, (dx, dz, s) in enumerate(((0.1, 0.6, 0.18), (0.25, 0.2, 0.15), (0.1, -0.4, 0.16))):
            cyl((0.95 + dx, 0, dz), s, s * 2.2, mat('#FF7F45', 0.4, emit='#FF5A1F', estr=3), r2=0.0)

ICONS = {}
def icon(name):
    def deco(fn): ICONS[name] = fn; return fn
    return deco

# ---------- modes
@icon('m_siege')
def _():
    st = mat('#B4AED0', 0.7, coat=0.1); dk = mat('#8F88B0', 0.7)
    cyl((0, 0, -0.2), 0.55, 1.3, st, v=12)
    for i in range(6):
        a = i * math.pi / 3; box((math.cos(a) * 0.5, math.sin(a) * 0.5, 0.55), (0.22, 0.22, 0.25), dk)
    seg((0, 0, 0.45), (0, 0, 1.15), 0.03, mat(WOOD, 0.6)); box((0.22, 0, 1.0), (0.42, 0.02, 0.26), mat('#E8364F', 0.5), bevel=0.01)
    box((0, -0.55, -0.55), (0.3, 0.05, 0.45), mat('#5A3A22', 0.6))
@icon('m_boss')
def _():
    g = mat('#FFD23F', 0.2, 0.9); cyl((0, 0, -0.2), 0.75, 0.55, g, v=48)
    for i in range(6):
        a = i * math.pi / 3; cyl((math.cos(a) * 0.62, math.sin(a) * 0.62, 0.3), 0.18, 0.55, g, r2=0.0)
        sphere((math.cos(a) * 0.62, math.sin(a) * 0.62, 0.6), 0.08, mat('#E8364F', 0.1, emit='#E8364F', estr=1))
    sphere((0, -0.75, -0.2), 0.14, mat('#3EC6FF', 0.05, emit='#3EC6FF', estr=1.5))
@icon('m_head')
def _():
    for i, c in enumerate(('#E8364F', '#FFFFFF', '#E8364F', '#FFFFFF', '#FFD23F')):
        cyl((0, 0.05 * i * 0 - i * 0.01, 0), 0.9 - i * 0.18, 0.12 + i * 0.02, mat(c, 0.4), rot=(math.pi / 2, 0, 0))
    arrow((-1.2, -1.2, 1.0), (-0.12, -0.25, 0.1))
@icon('m_night')
def _():
    m = mat('#FFF1B8', 0.4, emit='#FFE38A', estr=1.2)
    sphere((0, 0, 0), 0.8, m)
    view = Vector((1.2, -4.2, 2.0)).normalized(); side = view.cross(Vector((0, 0, 1))).normalized(); up = side.cross(view)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.7, depth=8, location=tuple(side * -0.42 + up * 0.3), vertices=48)
    cut = bpy.context.object; cut.rotation_mode = 'QUATERNION'; cut.rotation_quaternion = view.to_track_quat('Z', 'Y'); host = [o for o in bpy.context.scene.objects if o.type == 'MESH'][0]
    bo = host.modifiers.new('cut', 'BOOLEAN'); bo.object = cut; bo.operation = 'DIFFERENCE'; cut.hide_render = True
    for (x, z, s) in ((0.9, 0.7, 0.12), (0.7, -0.6, 0.09), (-0.9, 0.8, 0.08)): sphere((x, -0.2, z), s, mat('#FFFFFF', 0.2, emit='#FFF6C8', estr=4))
@icon('m_time')
def _():
    w = mat(WOOD, 0.5); gl = mat('#DDF4FF', 0.05, alpha=0.35); sand = mat('#F2C45A', 0.6)
    cyl((0, 0, 0.85), 0.62, 0.12, w); cyl((0, 0, -0.85), 0.62, 0.12, w)
    for i in range(3):
        a = i * 2.094 + 0.5; seg((math.cos(a) * 0.52, math.sin(a) * 0.52, -0.85), (math.cos(a) * 0.52, math.sin(a) * 0.52, 0.85), 0.04, w)
    cyl((0, 0, 0.4), 0.42, 0.8, gl, r2=0.05); cyl((0, 0, -0.4), 0.05, 0.8, gl, r2=0.42)
    cyl((0, 0, -0.55), 0.3, 0.45, sand, r2=0.05); cyl((0, 0, 0.18), 0.12, 0.25, sand, r2=0.02)

# ---------- bows
BOWS = {'oak': ('#8A5A2B', None, False), 'recurve': ('#6B3F1F', None, False), 'longbow': ('#A8733E', None, False),
        'elven': ('#C9B458', '#9BFF6A', False), 'dragon': ('#C0392B', '#FFB020', True)}
for bid, (wood, glow, fire) in BOWS.items():
    def mk(wood=wood, glow=glow, fire=fire, bid=bid):
        bow_mesh(wood, glow=glow, fire=fire, scale=1.12 if bid == 'longbow' else 1.0)
        if bid == 'recurve':
            for s in (1, -1): torus((0.55, 0, 0.95 * s), 0.18, 0.06, mat(wood, 0.35), rot=(math.pi / 2, 0, 0))
        arrow((-0.6, -0.05, 0), (0.75, -0.05, 0))
    ICONS['b_' + bid] = mk
@icon('b_crossbow')
def _():
    box((-0.1, 0, 0), (1.5, 0.16, 0.16), mat('#4A3A2A', 0.5)); box((-0.75, 0, -0.18), (0.3, 0.14, 0.45), mat('#4A3A2A', 0.5))
    torus((0.55, 0, 0), 0.8, 0.06, mat('#4A4A5A', 0.3, 0.8), rot=(0, 0, 0), arc=1.0)
    seg((0.55 + math.cos(1.0) * 0.8, math.sin(1.0) * 0.8, 0.05), (0.0, 0, 0.05), 0.012, mat('#F4EFE4'))
    seg((0.55 + math.cos(1.0) * 0.8, -math.sin(1.0) * 0.8, 0.05), (0.0, 0, 0.05), 0.012, mat('#F4EFE4'))
    arrow((-0.1, 0, 0.14), (0.9, 0, 0.14))

# ---------- special arrows + bundle
@icon('s_bomb')
def _():
    arrow((-0.9, 0, -0.5), (0.3, 0, 0.2), head_m=mat('#B8C2CE', 0.2, 0.9))
    sphere((0.55, 0, 0.35), 0.45, mat('#22222E', 0.3, 0.3)); seg((0.75, 0, 0.75), (0.95, 0, 1.0), 0.04, mat('#C9A27A', 0.7))
    sphere((0.98, 0, 1.04), 0.08, mat('#FFB020', 0.2, emit='#FF7F45', estr=8))
@icon('s_ice')
def _():
    arrow((-0.9, 0, -0.5), (0.3, 0, 0.2))
    ice = mat('#BEE9FF', 0.05, emit='#5CC8F2', estr=0.6, alpha=0.7)
    for (x, z, rx, ry) in ((0.55, 0.35, 0, 0), (0.7, 0.55, 0.6, 0.3), (0.4, 0.6, -0.5, 0.4), (0.75, 0.2, 0.2, -0.7)):
        cyl((x, 0, z), 0.16, 0.7, ice, rot=(rx, ry, 0), v=6, r2=0.0)
@icon('s_zap')
def _():
    arrow((-0.9, 0, -0.5), (0.3, 0, 0.2))
    y = mat('#FFE14A', 0.2, emit='#FFD23F', estr=3)
    pts = [(0.5, 1.0), (0.25, 0.45), (0.6, 0.45), (0.3, -0.2)]
    for a, b in zip(pts, pts[1:]): seg((a[0] + 0.3, -0.1, a[1]), (b[0] + 0.3, -0.1, b[1]), 0.09, y)
@icon('s_bundle')
def _():
    for i, (hm, fl) in enumerate(((mat('#22222E', 0.3), '#FF7F45'), (mat('#BEE9FF', 0.1, emit='#5CC8F2', estr=0.5), '#5CC8F2'), (mat('#FFE14A', 0.2, emit='#FFD23F', estr=2), '#FFD23F'))):
        a = (i - 1) * 0.45; arrow((-0.8 * math.cos(a), -0.1 * i, -0.8 * math.sin(a) - 0.3), (0.7 * math.cos(a), -0.1 * i, 0.7 * math.sin(a) + 0.2), head_m=hm, fl=fl)
    cyl((0, -0.1, -0.05), 0.22, 0.2, mat('#E8364F', 0.4), rot=(math.pi / 2, 0, 0))

# ---------- upgrades
@icon('u_wall')
def _():
    for row in range(3):
        for col in range(3 - (row % 2)):
            box((-0.6 + col * 0.62 + (row % 2) * 0.31, 0, -0.55 + row * 0.42), (0.58, 0.45, 0.38), mat(('#B4AED0', '#A39CC4', '#C3BDDE')[(row + col) % 3], 0.75, coat=0.1), bevel=0.05)
@icon('u_power')
def _():
    seg((0, 0, -1.0), (0, 0, 0.5), 0.07, mat('#5A3A22', 0.6))
    box((0, 0, -0.45), (0.6, 0.12, 0.1), mat('#FFD23F', 0.2, 0.9))
    cyl((0, 0, 0.75), 0.32, 0.6, mat('#D6DEE8', 0.1, 1.0), v=4, r2=0.0)
@icon('u_reload')
def _():
    cyl((0, 0, -0.2), 0.45, 1.3, mat('#7A4A22', 0.55), r2=0.38)
    box((0, -0.42, -0.2), (0.55, 0.05, 0.9), mat('#5A3A22', 0.6), bevel=0.02)
    for i in range(4):
        x = -0.24 + i * 0.16; seg((x, 0, 0.3), (x * 1.3, 0, 1.0), 0.03, mat(WOOD, 0.6)); cyl((x * 1.3, 0, 1.08), 0.07, 0.16, mat('#E8364F', 0.5), v=3, r2=0.0)
@icon('u_gold')
def _():
    box((0, 0, -0.35), (1.4, 0.85, 0.7), mat('#8A5A2B', 0.55), bevel=0.06)
    cyl((0, 0.05, 0.05), 0.43, 1.4, mat('#A8733E', 0.5), rot=(0, math.pi / 2, 0), v=24)
    for x in (-0.7, 0.7): box((x, 0, -0.1), (0.08, 0.9, 1.05), mat('#FFD23F', 0.2, 0.9), bevel=0.01)
    for (x, z) in ((-0.3, 0.5), (0.1, 0.55), (0.35, 0.45)): cyl((x, -0.1, z), 0.16, 0.05, mat('#FFD23F', 0.15, 1.0), rot=(0.4, 0.3, 0))

# ---------- outfits: archer bust in the outfit colours
OUTFITS = {'ranger': ('#3FA34D', '#6A55E0', '#E8364F'), 'crimson': ('#C0392B', '#E8364F', '#FFD23F'), 'frost': ('#5CC8F2', '#E6F7FF', '#2E86C1'),
           'royal': ('#8E44AD', '#FFD23F', '#8E44AD'), 'shadow': ('#222233', '#3A3A4E', '#7A6CFF'), 'golden': ('#FFD23F', '#FFF1B8', '#E8364F')}
for oid, (hood, body, cape) in OUTFITS.items():
    def mk(hood=hood, body=body, cape=cape):
        sphere((0, 0, -0.75), 0.75, mat(body, 0.45), (1, 0.8, 0.75))
        sphere((0, 0, 0.25), 0.48, mat('#FFD9B8', 0.5))
        sphere((0, 0.04, 0.33), 0.55, mat(hood, 0.5), (1.0, 1.0, 0.95))
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -0.55, 0.15)); cut = bpy.context.object; cut.scale = (0.8, 0.5, 0.7); cut.hide_render = True
        hoodo = [o for o in bpy.context.scene.objects if o.type == 'MESH'][-2]; b = hoodo.modifiers.new('c', 'BOOLEAN'); b.object = cut; b.operation = 'DIFFERENCE'
        for e in (-0.16, 0.16): sphere((e, -0.44, 0.27), 0.06, mat('#241B4D', 0.2))
        cyl((-0.45, 0.2, 0.75), 0.12, 0.6, mat(cape, 0.4), rot=(0.4, -0.9, 0), r2=0.0)
        sphere((0, -0.48, -0.35), 0.1, mat('#FFD23F', 0.2, 0.9))
    ICONS['o_' + oid] = mk

# ---------- upgrade cards
@icon('c_power')
def _(): cyl((0, 0, 0), 0.6, 1.2, mat('#D6DEE8', 0.1, 1.0, emit='#FF5A4E', estr=0.6), v=4, r2=0.0); sphere((0, -0.3, -0.6), 0.25, mat('#E8364F', 0.3))
@icon('c_quick')
def _():
    y = mat('#FFE14A', 0.2, emit='#FFD23F', estr=2); pts = [(0.3, 1.0), (-0.25, 0.1), (0.2, 0.1), (-0.3, -1.0)]
    for a, b in zip(pts, pts[1:]): seg((a[0], 0, a[1]), (b[0], 0, b[1]), 0.16, y)
@icon('c_multi')
def _():
    for i in range(3): a = (i - 1) * 0.35; arrow((-0.9 * math.cos(a), 0, -0.9 * math.sin(a)), (0.75 * math.cos(a), 0, 0.75 * math.sin(a)))
@icon('c_pierce')
def _():
    for x, c in ((-0.35, '#B98BFF'), (0.35, '#7ED957')): cyl((x, 0, 0), 0.5, 0.12, mat(c, 0.4), rot=(0, math.pi / 2, 0))
    arrow((-1.1, 0, 0), (0.75, 0, 0))
@icon('c_fire')
def _():
    arrow((-0.9, 0, -0.4), (0.45, 0, 0.25))
    for (x, z, s) in ((0.7, 0.4, 0.28), (0.5, 0.65, 0.2), (0.85, 0.7, 0.16)): cyl((x, -0.15, z), s, s * 2.4, mat('#FF7F45', 0.4, emit='#FF5A1F', estr=4), r2=0.0)
@icon('c_repair')
def _():
    box((-0.3, 0, -0.45), (0.8, 0.5, 0.45), mat('#B4AED0', 0.75), bevel=0.05)
    seg((0.1, 0, -0.4), (0.7, 0, 0.6), 0.06, mat(WOOD, 0.6)); box((0.72, 0, 0.62), (0.5, 0.25, 0.25), mat('#8A909C', 0.3, 0.8), rot=(0, -0.55, 0))
@icon('c_stone')
def _():
    sphere((0, 0, 0), 0.85, mat('#3B82F6', 0.35, 0.2), (1, 0.25, 1.15)); sphere((0, -0.15, 0.05), 0.35, mat('#FFD23F', 0.2, 0.9), (1, 0.4, 1))

# ---------- currencies and buttons
@icon('feather')
def _():
    seg((-0.6, 0, -0.9), (0.5, 0, 0.9), 0.025, mat('#F4EFE4', 0.4))
    sphere((0.0, 0, 0.0), 0.62, mat('#E8364F', 0.45), (0.5, 0.15, 1.35)); bpy.context.object.rotation_euler = (0, 0.55, 0)
    sphere((0.08, -0.05, 0.15), 0.4, mat('#FF7A8E', 0.45), (0.35, 0.12, 1.0)); bpy.context.object.rotation_euler = (0, 0.55, 0)
@icon('gem')
def _(): cyl((0, 0, 0.25), 0.8, 0.35, mat('#3EC6FF', 0.02, emit='#3EC6FF', estr=0.4), v=8, r2=0.55); cyl((0, 0, -0.45), 0.8, 1.05, mat('#29A8E8', 0.02, emit='#29A8E8', estr=0.3), v=8, r2=0.0)
@icon('pass')
def _():
    box((0, 0, 0), (1.7, 0.08, 0.95), mat('#A855F7', 0.35), rot=(0, -0.25, 0), bevel=0.06)
    box((0.15, -0.06, 0.05), (0.9, 0.04, 0.12), mat('#FFFFFF', 0.4), rot=(0, -0.25, 0), bevel=0.01)
    sphere((-0.45, -0.08, 0.15), 0.18, mat('#FFD23F', 0.2, 0.9), (1, 0.4, 1))
@icon('mis')
def _():
    box((0, 0, 0), (1.1, 0.05, 1.3), mat('#F3E3C0', 0.7), bevel=0.02)
    for z in (0.75, -0.75): cyl((0, 0, z), 0.12, 1.35, mat('#A8733E', 0.5), rot=(0, math.pi / 2, 0))
    for z in (0.3, 0.05, -0.2): box((0, -0.04, z), (0.7, 0.02, 0.06), mat('#8A5A2B', 0.6), bevel=0)
    sphere((0.3, -0.08, -0.5), 0.15, mat('#E8364F', 0.3), (1, 0.4, 1))
@icon('shop')
def _():
    cyl((0, 0, -0.25), 0.7, 1.0, mat('#3B82F6', 0.4), v=24, r2=0.55)
    torus((0, 0, 0.35), 0.38, 0.06, mat('#2B5FC0', 0.4), rot=(math.pi / 2, 0, 0))
    sphere((0, -0.6, -0.1), 0.18, mat('#FFD23F', 0.2, 0.9), (1, 0.4, 1))

for name in sorted(ICONS):
    if ONLY and not name.startswith(ONLY): continue
    reset(); ICONS[name](); render(name)
print('ALL ICONS DONE')
