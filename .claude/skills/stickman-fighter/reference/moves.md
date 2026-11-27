# Moves, combos and aiming

A move is a list of steps; a combo is a list of move names (concatenated).

```js
{ p: 'cross', d: 0.16, f: 18, z: 0.55,  // pose, duration (s), spring Hz, damping
  sfx: 'whoosh',                          // optional sound when the step starts
  aim: aim('cross', 'h2', 'edge'),        // step in so this pose's effector reaches the target
  hit: { eff: 'h2', power: 2, kind: 'strike', zone: [...], ko: 1, push: 1, lift: 1 },
  needs: 'air',                           // skip unless the victim is juggled
  jump: 800, quake: 1,                    // takeoff velocity; crack the ground
  plan: 0.1,                              // air: ballistic lunge arriving in 0.1 s
  act: 'clinch' | 'release',              // grab the head / let go
  untilLand: true }                       // hold until grounded
```

## Effectors (eff)
`h1`/`h2` fist; `head`; `kn1`/`kn2` knee; `shin1`/`shin2` (samples 30-100% down the shin);
`foot1`/`foot2` (ankle to toe); `an1`/`an2` ankle.

## Aim modes
- `edge` (the default): the attacker's root steps so the effector of the *strike* pose lands
  5 units inside the victim's front surface at the effector's height (arms ignored).
  Put the strike pose's aim on its load step too, so the step-in starts early.
- `chin`: under the head (uppercuts). `close`: a fixed 40 units (clinch entry).
- `air`: the victim's core, used with `plan`. `above`: over the core (axe kick).
A ground minimum distance of 25 (36 for the clinch) keeps the bodies from overlapping.

## Zones
`zone` limits which victim parts count, so a leg sweeping up through the victim's thigh
doesn't "land" early: teep `['gut','chest']`, body kick `['gut','chest','arm']`,
high kick `['head','arm','chest']`, low kick `['leg']`, knee `['gut','chest','head','arm']`.

## Kinds
- `strike`: standing reaction by part (head snaps back, gut folds, leg buckles).
- `knee`, `headbutt`: strike variants.
- `upper`: an extra head snap and lift.
- `launch`: starts the juggle (vAir 760).
- `air`: re-pops the victim (vAir 430-520), and the attacker follows at 0.82x.
- `slam`: drives the victim down (-1250), sets `dead`, and the impact calls `quake`.
- `ko: 1`: the victim tips over the heels after 0.06 s, dead.

## The four shipped combos
- **Punch**: jab, jab, cross, hook, cross, overhand (KO).
- **Kick**: low kick, teep, body kick, high kick (KO).
- **Head**: clinch entry, knee, knee, headbutt, headbutt, headbutt (KO) with release.
- **Uppercut**: lead uppercut, rear uppercut, jumping uppercut (launch with ground break),
  air lead uppercut, air rear uppercut, axe slam (KO), landing.

## Adding a combo
1. Add the poses.
2. Add the moves (load step with aim, strike step with aim + hit, recovery to stance).
3. Add `COMBOS.name` and `COMBO_NAME.name`.
4. Add a button with `data-m="name"` and a key in the keydown map; add it to the demo list in `doMove`.
5. Run probe, then sheet.
