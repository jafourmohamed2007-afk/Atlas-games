# Impact feedback (by power 1-4)

| | 1 | 2 | 3 | 4 (finisher) |
|---|---|---|---|---|
| hit-stop (s) | 0.05 | 0.07 | 0.10 | 0.16 |
| trauma (shake) | 0.20 | 0.30 | 0.42 | 0.85 |
| zoom kick | 0.5 | 0.8 | 1.2 | 2.4 |
| sound | light | medium | heavy | finisher |

On a power-4 hit, also add:
- a one-frame inverted "impact frame" (0.05 s);
- radial speed lines (0.45 s);
- slow motion (0.2 s at 0.45x).

Every hit spawns:
- a star burst at the contact point;
- an expanding ring;
- directional sparks along the strike velocity;
- a white flash core inside the victim's strokes.

`quake(x, s)` (jump takeoff s = 1, slam s = 1.35, hard landing 0.45) spawns:
- a crater ellipse with crack lines (fading over 3.2 s);
- two slabs tilting up;
- rocks with gravity that bounce once;
- dust thrown sideways;
- a ground shockwave ellipse;
- trauma 0.45 s and the `boom` sound.

Motion:
- smear shapes between the elbow/knee and fist/ankle trails (last 75 ms);
- whole-body afterimages (18 joints) while airborne speed is over 480, or for 0.16 s after an air lunge.

Shake uses trauma squared with sums of sines, so it is smooth, not random jitter. The HUD
(combo counter and combo title) never shakes. Everything respects `prefers-reduced-motion`:
no shake or zoom, and fewer particles.
