---
name: stickman-fighter
description: Build smooth, realistic stick-figure fight animation for HTML5 canvas games - a jointed human rig (spine, hip/shoulder twist, IK legs on planted feet that step), spring-driven key poses, real techniques (jab/cross/hook, low/body/high kicks, teep, clinch knees and headbutts, uppercuts, air juggles, axe slam), hits that land by real contact on the body part touched, dynamic ballistic jumps that crack the ground, limp death bodies that fade, and juicy impact feedback (hit-stop, shake, sparks, smears, afterimages), plus a probe/contact-sheet/60 fps render pipeline to verify it. Use whenever the user wants stickman fights, fighting combos, beat-em-up or brawler animation, combat moves, ragdoll knockouts, or asks to make fight animation smoother, more dynamic or more real, even if they don't say "skill".
---

# Stickman Fighter

A proven engine, not a fresh start. `engine/stick-combo.html` is a complete, verified
single-file lab (about 780 lines, no libraries): two fighters, 4 separate combos, DEMO mode.
**Copy it and change it**; do not rewrite the rig from memory.

## Workflow (follow in order, show results between steps)

1. **Copy** `engine/stick-combo.html` to the target (for example `labs/<name>.html`, or lift
   the sections into a game module). Keep `?capture`, `?seed=N`, `?nofx`, `?poses`, `?fps`
   and `window.__lab`: every verification script depends on them.
2. **Change poses first**, in `POSE`. Render them with `scripts/poses.js` and *look* at the
   picture before simulating anything. Joint conventions are in `reference/rig.md`.
3. **Change moves and combos** in `MOVES` / `COMBOS` (`reference/moves.md`). Every strike
   step needs `hit: { eff, power, kind?, zone? }`, and almost every one needs `aim`.
4. **Probe**: `node scripts/probe.js <page> 1,2,3,4,5,6,7,8`. The target is 0 misses on
   at least 9 of 10 seeds. A miss names the pose; fix it with aim, zone or the pose itself.
5. **Look**: `node scripts/sheet.js <page> <seed> <t0> <t1> 0.1 out.png`, then Read the PNG.
   Check that the limb touches at hit frames, the bodies don't pass through each other,
   the feet don't slide, and nothing points up from a lying body.
   Times are wall-clock: hit-stop and slow motion make them later than the `@simT` in the log.
6. **Render** at 60 fps with `node scripts/render.js <page> out.mp4 27` and send the mp4.
7. Commit, push and publish (the Artifact tool, same file_path, so the link stays the same).

The scripts need Playwright and ffmpeg (both are preinstalled in cloud sessions).

## Non-negotiables (each one was a user complaint once)

- **Contact, not proximity.** A hit lands only when the striking part's capsule touches the
  victim's capsule, tested on every 240 Hz substep. The attacker *steps in* (root spring,
  feet stepping) so the limb reaches; the victim never teleports to the fist.
- **The striking part is the real one**: the fist (h1/h2), shin, foot, knee or head. Punches
  use both hands: the other hand stays on the chin. Rear-hand and rear-leg strikes rotate the
  hips and shoulders (`tw`), and the heel pivots (`fa`).
- **The whole body moves from its joints.** The waist and chest bend separately, the head lags
  the spine, and the knees bend because the hips drop over planted feet (IK). Kicks lean the
  torso away and swing the opposite arm back for balance.
- **Uppercuts load the legs first**: dip (low `py`, torso folded and turned), then the legs
  and hips drive up and the fist rises.
- **Dynamic air: no hovering, no steering.** A jump is a velocity impulse. Each air strike
  is one ballistic lunge (`planAir`) toward the victim's *predicted* position, then full
  gravity takes over. A big takeoff and the slam call `quake()`: crater, slabs, rocks,
  shockwave and a boom.
- **Death is limp.** Finishers set `dead`. The body lies flat (limbs along the floor, head
  rolled down, knees softly bent) with slow, heavily damped joints. It never gets up, stays
  about 2.2 s, fades out, and the next enemy walks in. No hands pointing up.
- **Each combo is separate.** One button per combo, and the moves skip when they don't fit
  the state (air moves need a juggled victim; a downed victim ends the combo).
- **60 fps**: variable dt capped at 1/30, joints substepped at 240 Hz, short slow motion
  (0.2 s at 0.45x). Videos are frame-exact (dt = 1/60 per frame).

## Where things live in the engine

| Section | Key functions |
|---|---|
| Rig and poses | `LEN`, `KEYS`, `STANCE`, `D()`, `POSE`, `Fighter.solve` (FK + 2-bone IK, ragdoll rotation) |
| Moves | `MOVES`, `COMBOS`, `COMBO_NAME`, `aim()` |
| Contact | `capsules`, `effPts`, `touch(E, vic, zone)`, `frontEdge`, `poseOff`, `aimRoot` |
| Timeline | `startStep`, `planAir`, `updateGrab` (clinch arm IK), `stepFeet`, `setLegMode`, `updateFighter` |
| Reactions | `landHit`, `koFall`, `deadPose`, `lieDown`, `knockDown`, `airTargets`, `whip` |
| FX | `star`, `ring`, `sparksDir`, `dust`, `quake`, afterimages (`GHOST`), smears (`trails`) |
| Control and loop | `doMove`, `control`, `spawnEnemy`, `step`, `decayCam`, `render`, `renderPoses` |

Read `reference/lessons.md` before changing contact, air or camera code: it lists the bugs
already fixed and why the code is shaped the way it is. `reference/hits-and-fx.md` holds the
feedback numbers.

## Integrating into a game

- **Lift these sections as one unit**: rig, contact, timeline, reactions and FX. Replace the
  control, loop and HUD with the game's own.
- **Fighter `A` is the player.** Map inputs to `A.play(steps)` for one move, or concatenate
  a combo.
- **Enemies are `Fighter` instances.** `landHit` and the reactions work for any
  attacker/victim pair. Note that `planAir` and the aiming only run for `A` today; make that
  a per-fighter flag for AI.
- **Disappearing in a game**: when `F.dead && F.alpha === 0`, remove the entity.
- **Licensing**: keep everything original. Don't copy choreography, characters or the look
  of existing games or videos.
