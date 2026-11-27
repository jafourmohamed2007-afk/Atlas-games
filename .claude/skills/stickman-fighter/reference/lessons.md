# Lessons: bugs already fixed (don't reintroduce them)

1. **Teleporting victims**: moving the victim to the fist reads as fake. Move the attacker's
   root (step in), and test contact on every substep so the limb stops at the surface.
2. **Hits on air**: strike windows must be long enough, and the aim must use the strike
   pose's effector offset, not the load pose's.
3. **Follow-through flinging the victim**: never add velocity for overlap. Push position only,
   by at most 3 units per substep, along the contact normal.
4. **Bodies passing through each other**: a ground minimum gap of 30 when idle, 24 while
   striking and 34 in the clinch. A bent-over clinched victim needs a distance of about 40.
5. **Floaty, hovering air combos** (user: "feels steady"): a steering controller that matches
   velocity looks glued. Use ballistic lunges plus full gravity; reliability comes from
   predicting the victim's position, not from correcting mid-flight.
6. **Plank-like airborne bodies**: juggled victims use `airTargets`: limbs trail the velocity
   and flail with several sines, plus `whip` impulses on every hit.
7. **Hands up on the dead** (user: "like a dead body, no hands up"): a lying body is the
   standing skeleton rotated -90 deg. Local *forward* becomes world *up*, so arms and feet
   with a forward angle stick up. The dead pose keeps limbs near 0 (along the body), and the
   lowest-point rule uses limb thickness (2.1), not head radius, so the body lies flat.
8. **Kicks landing early on the thigh**: an extending leg sweeps up through the victim's legs.
   Use `zone`.
9. **Camera popping on respawn**: don't drop the new enemy from the sky (camera height
   follows air). Walk it in from the side with a fade-in.
10. **"Not 60 fps"**: long, heavy slow motion looks like a low frame rate. Keep it short.
    Render videos frame-exact.
11. **A stalled demo**: `readyT` needs the victim idle, standing and not busy. Any new state
    must eventually return to `idle`.
12. A grep with no match exits 1 inside `&&` chains; that is not a real error.
