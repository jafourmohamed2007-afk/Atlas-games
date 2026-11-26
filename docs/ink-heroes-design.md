# Ink Heroes: Zombie Night (endless mode)

An original side-scrolling stickman brawler. The genre and the Anger of Stick reference images you sent served as inspiration only: no names, characters, art or code were copied.

## What I took from the references, and how it was enhanced
| In the references | In Ink Heroes |
|---|---|
| Black silhouette stickmen with one bright accessory | 4 original heroes, each with a signature look: Kai's flowing red scarf (simulated cloth), Rook's orange hard hat and sledgehammer, Vex's glowing cyan goggles, Juno's purple ninja mask with tails and katana |
| Colored stick enemies | 8 original zombie types, each with its own color, glowing eyes and a distinct mechanic (below). They splatter colored ink, not blood |
| Weapon shop | Weapon crates drop mid-fight (katana, axe, shotgun, rifle, ink laser, rockets), so the excitement happens in the moment |
| Companions | The "Call a Buddy" power-up recruits up to 2 stick allies who fight beside you |
| HP/MP bars, arrows + round buttons | HP bar, an "ink" power bar, ammo, a combo counter, and big touch buttons (HIT, FIRE, JUMP, POWER) |
| Upgrades | Roguelite: choose 1 of 3 power-ups after every wave (10 kinds) |
| — (new) | Hit-stop, screen shake, ragdolls, a 3-hit combo with a finisher, a dive kick, auto-facing, crits, combo score multipliers, a boss every 5 waves |

## Heroes (unlock with the coins you earn in any Bubzi game)
| Hero | Price | Style | Gun | Special |
|---|---|---|---|---|
| Kai, Shadow Fist | free | fast fists and kick finisher | pistol | Cyclone kick: spins and pulls in zombies |
| Rook, Wrecker | 300 | slow, heavy hammer | shotgun | Ground quake: leaps up and slams down a shockwave |
| Vex, Neon Gunner | 600 | weak fists | SMG | Overdrive: 2.4 s of bullets in both directions, invulnerable |
| Juno, Night Blade | 1000 | katana that hits everything in range | piercing kunai | Blade dash: 3 dashes that cut through everything |

## Zombies
| Zombie | From wave | Mechanic |
|---|---|---|
| Shuffler | 1 | Basic walker |
| Dasher | 2 | Very fast, low health |
| Gloop | 3 | Ranged: spits goo arcs and leaves toxic puddles |
| Ankle-Biter | 4 | Crawls low, so bullets fly over it. Kick it! |
| Bruiser | 5 | Big, heavy, resists knockback, hits hard |
| Popper | 6 | Explodes, hurting you and other zombies (chain reactions) |
| Doorman | 7 | Blocks frontal hits with a car door. Finishers, dive kicks, specials, the axe and explosions break it |
| GRAVEMAW (boss) | every 5 waves | Swipe, charge, and a jump pound whose shockwaves you must jump over |

## Tested
- Engine test suite (desktop, phone, Arabic, 8× speed stress)
- A gameplay bot that reaches wave 3
- A long god-mode run to wave 11 that met 2 bosses, all 8 zombie types and several weapons, with no errors

## Shop (added)
Open it from the hero screen. Guns are bought once and kept; one gun is equipped at a time. Items are consumables you stock up on.

### Guns (each has its own synthesized sound and a stats card)
| Gun | Price | Damage | Shots/s | Ammo | Reload | Special |
|---|---|---|---|---|---|---|
| Hero Gun | free | per hero | | | | Kai pistol, Rook shotgun, Vex SMG, Juno kunai |
| Twin Vipers | 250 | 12 | 9.1 | 24 | 1.2 s | dual pistols |
| Buzzsaw SMG | 450 | 9 | 14.3 | 40 | 1.3 s | |
| Boomstick | 650 | 9 ×7 | 1.7 | 6 | 1.5 s | 7 pellets, short range |
| Ranger AR | 900 | 14 | 10 | 30 | 1.4 s | |
| Longshot Sniper | 1200 | 95 | 1.1 | 5 | 1.8 s | pierces the whole line |
| Thunder LMG | 1600 | 12 | 16.7 | 100 | 2.8 s | 100-round belt |
| Inkjet Laser | 2000 | 24 | 5.6 | 35 | 1.4 s | piercing beam |
| Frost Blaster | 2400 | 11 | 7.7 | 28 | 1.4 s | slows/freezes zombies |
| Hornet Rockets | 3000 | 85 | 1.2 | 6 | 2.2 s | explosive |
| Tesla Coil | 3800 | 20 | 4.2 | 20 | 1.6 s | chain lightning to 3 zombies |

Weapon crates now also drop shop guns, with double ammo, so players can try a gun before buying it.

### Items (on-screen buttons; keys 1–7)
| Item | Price | Max | Effect (scales with the wave) |
|---|---|---|---|
| ❤ Heart | 150 | 5 | When you fall, a 6-second "Revive?" prompt appears. A heart brings you back with full HP and a shockwave |
| Medkit | 60 | 9 | Heal 60% HP |
| Grenade | 40 | 9 | Thrown explosive |
| Freeze Bomb | 100 | 9 | Freezes every zombie for 4 s (bosses 1.6 s) |
| Shield Bubble | 90 | 9 | No damage for 8 s |
| Rage Serum | 70 | 9 | Double damage for 10 s |
| Auto-Turret | 110 | 9 | Gun turret fights for 15 s |
| Airstrike | 140 | 9 | 8 bombs rain across the screen |

New players get a starter pack: 1 heart, 2 grenades and 1 medkit.
The **"+60 · AD"** button in the shop is a rewarded ad (placeholder) that gives 60 coins, available every 90 s.
