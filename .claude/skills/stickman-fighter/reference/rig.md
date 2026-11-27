# Rig and pose conventions

Side view, facing right in local space, y down, ground at y = 0. `face` (+1/-1) mirrors x.

## Angles
- `dir(a) = (sin a, cos a)`: 0 = straight down, +PI/2 = forward, PI = up, negative = backward.
- Arms (`a1`, `a2`) and FK legs (`l1`, `l2`) are **world** angles of the upper limb.
  The elbow/knee (`e`, `k`) is relative: forearm = a + e, shin = l + k.
  A negative k bends the knee backward; a positive e bends the elbow up and forward.
- Spine: `t1` = lower-spine lean, `t2` = chest bend relative to it, `h` = head tilt relative
  to the chest. Positive = forward. Segment direction is `up(s) = (sin s, -cos s)`.
- `tw` = shoulder twist (hips use 0.6x). A positive tw puts the lead side (1) forward;
  a negative tw turns the rear side (2) forward, as for a cross, rear uppercut or rear kick.
- `px`, `py` = pelvis offset forward and pelvis height (the stance py of 35.5 means bent knees;
  a full leg is 40.5).
- `fa1`, `fa2` = heel raise / foot point. 1 = up on the toes; used for heel pivots on rear strikes.
- `p1`, `p2` = where planted feet want to be (default +12 lead / -12 rear). `fk1`/`fk2` = that
  leg uses FK angles (kicks, knees, air). `grab: 1` = arms use IK to the opponent's head.
- Side 1 (lead) draws in the main colour, side 2 (rear) in the darker shade, behind the body.

## Lengths
Spine 15+15, neck 4, head radius 8.2, upper arm and forearm 15, thigh 20, shin 20.5, foot 6.5.

## Legs
Standing legs solve 2-bone IK from the hip to an ankle above a planted foot (knee forward).
The pelvis is clamped so a leg never overstretches. A foot more than 5.5 from its wanted spot
swings there in an arc (one foot at a time unless the error is over 18). When a leg switches
IK to FK (kick start, takeoff), the IK angles are copied into the springs. When it switches
back, the foot starts a step from where the ankle is. Both directions avoid pops.

## Ragdoll states
`juggled`, `falling`, `down` and `rising` solve with the pelvis at the origin, rotate every
point by `rot`, and place the lowest point (head + radius, limbs + 2.1) at the current air
height. Moving between standing and ragdoll shifts `x` by `px` so the pelvis doesn't jump.

## Springs
Each joint chases its target with frequency `f` (Hz) and damping `z`. Strike poses use
f 17-23 (snappy); loads and recoveries 8-13; dead bodies 3.2 with z 0.95 (limp, no bounce).
px/py are capped at 13 Hz so the body mass lags the limbs. Hits add *velocity* to the
victim's springs, so the recoil comes from the physics, not from a canned pose.

## Writing a pose
`NAME: D({ ...only the keys that differ from STANCE })`. Then check it in the grid
(`scripts/poses.js`). Typical shapes:
- Straight punch: arm a about 1.55, e about 0.03; shoulder turned (tw ±0.75-0.8); torso leans 0.1-0.2.
- Guard hand: a1 0.72 / e1 2.28 (lead), a2 0.36 / e2 2.68 (rear).
- Body kick: l2 about 1.95, k2 about -0.08; t1 -0.55 (lean away); tw -1; a2 -0.9 (arm swings back); fa1 1.
- High kick: l2 about 2.3; t1 -0.85.
- Knee strike: l2 about 2.3, k2 about -2.6; with grab.
- Dip before an uppercut: py 23-29, t1 0.38-0.5, tw 0.8, rear arm low (a2 0.1-0.15, e2 about 1.9).
