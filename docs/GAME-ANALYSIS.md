# Bubzi Games: full analysis, game by game, and what changed

Scope of this pass: all 15 games under `games/` (14 built on the shared kit, plus the 3D Pocket Grove), the shared kit
(`src/kit/`), the website generator (`tools/site.js`), and the new **Ashen Vigil** pixel survivor game.
Everything below was read from the source in `src/`, and the browser checks were run in Chromium.

## 1. What every game contains (step by step)

### Shared by 14 kit games (`src/kit/kit.js`, 899 lines)
1. Title screen with Play, Daily bonus (7-day streak), Skins (8 shared characters), Sound on/off, Exchange, Code.
2. A "show, don't tell" tutorial: an animated hand shows the first action, then disappears once you do it.
3. HUD with score, best score, coins, pause. Score is saved per game; a daily goal and "beat your best" nudge exist.
4. Game feel: particles, confetti, floating text, screen shake, hit-stop (disabled by `prefers-reduced-motion`), white flash, haptics.
5. Synth sound effects only (about 30 effects, no music).
6. Game over screen: score, new best, "watch ad to continue" (once per round) and an interstitial every 2nd restart (placeholders).
7. Three languages (English, French, Arabic right-to-left), per-game currency, Bubzi Exchange (daily rates, one HOT game at x2).
8. Test hooks: `?test` (instant ads, debug state), `?speed=N`, `window.__bubzi`.

### Per-game
**1. Block Bloom** (puzzle). 8x8 board and a tray of 3 pieces. Drag a piece onto the board (keys: 1-3, arrows, Enter). Full rows
and columns clear. Score = cells placed + `n^2 * 40 + (streak-1) * 20` per clear, with combo text and shake. Piece size tier gets bigger
as the score rises. The run ends when no tray piece fits.

**2. Rooftop Rush** (runner). Pseudo-3D, 3 lanes. Speed ramps from 13 to 32. Swipe or arrows: left/right change lane, up jumps, down slides.
Obstacles: chimneys (change lane), vents (jump), low bars (slide), gaps (jump), plus coin trails. Falling or hitting ends the run;
a revive gives 2.2 s of invulnerability.

**3. Hop Hook** (one-touch). Hold to grab the next hook, release to fly. Rope physics with energy pumping, gravity 1500, water at the
bottom ends the run. Coins in the air. Score = distance + coins. The camera leads the player.

**4. Number Pop** (math learning). Bubbles rise, tap or type the one with the right answer. 3 lives. Levels step up: add to 10, add to 20,
subtract, 50s, times 5, times 10, division, add to 100. 3 bubbles, 4 from level 3. A wrong tap or a slow bubble costs a life.

**5. Hill Hopper** (physics driving). Two-wheel car with a rigid axle, gas/brake, 100 fuel with fuel cans, coin trails. Air flips give
+50 and coins, a head-first landing ends the run, air control leans the car.

**6. Jelly Drop** (merge). 10 jelly sizes in a 100-wide jar. Aim and release, identical jellies merge (points 2 to 100). A jelly resting above the
danger line for 2.2 s ends the run. Shows the next jelly and the evolution strip.

**7. Memo Match** (memory). Six board sizes from 2x3 up to 5x6, a short peek, then a timer of about `pairs*5.5+8` seconds. 15 icons. Time up ends the run.

**8. Wiggle Snake** (snake). Grid snake, speed from 6.5 to 14 steps/s, 3-move input queue, fruit (+10), timed golden fruit (+50, grows 2).
You can reverse before the first move. Wall or tail ends it.

**9. Ink Heroes** (2.5D stickman brawler, 3,449 lines, the biggest game). 4 heroes, 8 zombie types, a boss every 5 waves, 11 guns,
8 consumable items, Infinity mode and a 40-level story ("The Inkfall": 5 chapters, 5 bosses, comic cutscenes, 3 stars per level, Nightmare mode).
Details in `docs/ink-heroes-design.md`.

**10. Spear Hills** (turn-based duel). Slingshot-style pull back to aim, wind from level 3, head/body/leg hit zones, 8 rival designs,
hills change shape each level. The rival solves its own throw with some error.

**11. Merge Blasters** (merge + defense). 4x3 grid, 12 blaster levels, rising buy price. Merge identical blasters, they auto-fire at goo
blobs coming for a 5-HP wall. Blob HP is `8 * 1.24^(wave-1)`, fast and big variants, a boss every 5 waves.

**12. Tiny Siege** (lane war). Four units (miner 50, sword 60, archer 85, giant 200), 5 miners max, army cap 26, Attack/Defend stance,
an AI enemy that mines and builds, enemy strength +10% HP and +6% damage per level.

**13. Bubble Bastion** (tower defense). 7x10 board (transposed on wide screens), a winding stream, 20 lives, 4 towers (needle 50, frost 70,
bomb 110, zap 160), 3 upgrade levels, sell panel, waves with breaks.

**14. Arrow Rampart** (archery defense). Pull back and let go with real arrow gravity. 5 foes (grunt, runner, brute, flyer, chief boss every 5th wave),
wave size `min(40, 5+3*wave)`, headshots, combos, and 3 upgrade cards after every wave (power, quick, multi, pierce, fire, repair, stone).

**15. Pocket Grove** (3D idle garden, three.js, 1.2 MB). Plant, water, harvest in real time (30 s to 12 h crops), offline growth, hourly
shop, real-clock events (Ink Rain, Golden Hour, Moonlight), mutations, pets, daily orders, decorations, album. Details in
`docs/pocket-grove-design.md`.

**16. Ashen Vigil (new, see section 3).**

## 2. Findings from the analysis

| Area | Finding | Status |
|---|---|---|
| Difficulty | Memo Match stopped getting harder after level 6 (same 5x6 board, same timer) | **Fixed**: after level 6 the peek shrinks and time per pair drops |
| Audio | No kit game has music, and sound is only on/off (no volume control) | Ashen Vigil has music plus master/music/SFX sliders; kit games need a shared music option (see section 4) |
| Launch blockers | Every canonical URL is `https://www.example.com` | Set `SITE_URL` when building (`SITE_URL=https://yourdomain.com node tools/build.js && node tools/site.js`) |
| Launch blockers | The `creator` cheat code is still in every game | Marked `CREATOR` in the source; remove with `grep -rn CREATOR src/` before launch (the README already says so) |
| Monetisation | All ad calls are placeholders | Plug your network into the `Ads` object in `src/kit/kit.js` |
| Build | `node tools/build.js` crashed without `node_modules` (esbuild) and skipped every game after Pocket Grove | **Fixed**: it now skips Pocket Grove with a message |
| Build | Standalone (non-kit) games could not be built or tested | **Fixed**: `"standalone": true` in `src/games.json`; own builder and test |
| Variety | 8 of 15 games are "defend or survive" variants, none is a swarm survivor | Ashen Vigil fills this gap |

## 3. Ashen Vigil: Night of a Thousand (new game)

Files: `src/ashen-vigil/` (5 modules + template), `tools/build-ashen-vigil.js`, `tools/capture-ashen-vigil.js` (thumbnails),
`tests/ashen-vigil.js`, output `games/ashen-vigil.html` (one file, about 294 KB with 9 embedded narrator clips).

**Rules from your prompt, and how they are met**
- 100% canvas: the page has one `<canvas>` and nothing else (the test checks the DOM). Buttons, sliders, cards and menus are drawn with hitboxes and hover glow.
- Pixel rendering: a low-res buffer (480x270 at 1080p) scaled by an integer factor, no smoothing. All sprites are palette-indexed arrays using one 32-colour palette
  with 2 to 4 frame walk cycles (legs lift, wings flap). A 3x5 bitmap font draws all text.
- Loop: fixed 60 Hz step with a delta-time accumulator, camera lerp, endless tiled ground (grass, ash, ruins, bones, graves, torches).
- Performance: object pools for enemies (720), projectiles, gems, particles, effects, texts and pickups; a spatial hash grid for collisions.
  Verified: 500+ enemies at 60 fps, 700+ in a stress run.
- Controls: WASD/arrows, canvas-drawn virtual joystick on the left half of a touch screen, P/Esc pause (also auto-pause when the tab loses focus).

**Heroes**: Ember Knight (Cinder Blade, +10% armor), Hex Witch (Wraith Bolt, +15% cooldown reduction), Grave Ranger (Bone Volley, +10% move speed).

**Weapons (6 slots, levels 1-8)** and their evolutions (max level weapon + paired passive, unlocked by opening a Bone Golem chest):

| Weapon | Behaviour | Evolution | Needs |
|---|---|---|---|
| Cinder Blade | arc slash (aims at the nearest foe, otherwise your facing), double at lv3, triple at lv6 | Inferno Reaver (full-circle fire ring) | Iron Heart |
| Wraith Bolt | homing missiles, more per level | Soul Storm (ring of 8 extra bolts) | Hourglass |
| Bone Volley | piercing arrows in your move direction (nearest foe when standing still) | Bone Tempest (8 directions, infinite pierce) | Swiftboots |
| Orbiting Runestones | stones circle you | Celestial Halo (two rings, double stones) | Grimoire |
| Holy Font | damaging aura that slows | Sanctum Prime (bigger, heals) | Bloodstone |
| Thunder Sigil | lightning on random foes | Storm Crown (+3 strikes) | Lucky Coin |
| Hellfire Flask | thrown bottles leave burning pools | Volcano Brew | Grimoire |
| Spectral Chain | bouncing lightning | Tesla Maw (two chains, +5 bounces) | Magnet Charm |

**Passives (6 slots, levels 1-5)**: Iron Heart, Swiftboots, Hourglass, Magnet Charm, Grimoire, Lucky Coin (crit and 4th card chance), Bloodstone.

**Enemies**: Bat (fast swarms), Ghoul (slow tank), Skull Archer (keeps range, shoots), Bloat Toad (explodes), Wraith (rings that close in), elites with a pulsing glow outline
(7x HP, 5x XP, always drop gold), Bone Golem mini-boss, Pale Reaper boss (telegraphed dash, scythe rings, summons a wraith ring at half HP).

**Wave director (timeline)**: spawn rate grows each minute and enemy HP grows with the clock. 3:00 bat swarm. 5:00 Bone Golem and chest. 7:00 wraith ring. 10:00 second Golem.
11:00 bigger ring. 14:30 warning. 15:00 the Pale Reaper arrives; defeat it to win.

**Pickups**: gold, roast chicken, Rosary (screen smite), Vacuum Orb (pull every gem), breakable lanterns, boss chest.

**Meta**: gold persists in localStorage. The Ember Shrine sells Might, Armor, Max HP, Speed, Magnet, Revival (2 levels), Greed. Best time, total kills, wins and run count are saved.

**ElevenLabs narrator**: 9 lines generated with the connected ElevenLabs tool (deep voice "Brian", stability 0.35) and embedded as base64 MP3. No runtime calls, no key screen.
Each line is tied to its event with cooldowns so lines never overlap. If a clip is missing or will not decode, the game falls back to subtitles plus a synth rune chime
(tested with deliberately broken clips). A live pixel-rune waveform (Web Audio `AnalyserNode`) and subtitle sit top-center.

**Juice**: white hit flash, knockback, floating damage numbers (yellow crits), death bursts, gem sparkle trails, level-up flash, screen shake, low-HP red vignette pulse, level-up arpeggio,
rising pickup pitch combo, procedural chiptune music whose tempo and layers grow with the run.

**Balance notes**: tuned with a kiting bot that picks upgrades at random. It survives between 2.5 and 13 minutes depending on luck. A god-mode bot beats the Reaper with all
three heroes. Real difficulty still needs human play-testing; the numbers to tune are at the top of `src/ashen-vigil/04-game.js` (`ET`, `director`, `xpNeed`, weapon formulas).

## 4. Recommended improvements for the other 14 games (not done in this pass)

Ordered by value for effort. The survivor prompt's ideas are reused where they fit.
1. **Shared music + volume (kit)**: port the Ashen Vigil procedural music scheduler into `kit.js`, with a music/SFX slider in the pause panel. Every game gains mood at once.
2. **Upgrade cards everywhere**: Arrow Rampart has them; Bubble Bastion, Merge Blasters, Tiny Siege and Spear Hills could offer a pick-1-of-3 modifier after every few waves. Reuse the kit's card styling.
3. **Meta-progression**: the kit already has coins and skins; add one permanent upgrade shop per action game (like the Ember Shrine) so a failed run still pays.
4. **Boss and event beats**: Merge Blasters and Hill Hopper have no scripted moments. A banner plus a short voice or sting at wave 5/10 raises tension cheaply.
5. **Low-health feedback**: a red vignette pulse (already written in Ashen Vigil) for Arrow Rampart, Tiny Siege, Ink Heroes.
6. **Number Pop and Memo Match**: add streak rewards and a daily challenge seed; both are short and ideal for a daily loop.
7. **Pocket Grove size**: 1.2 MB is heavy for portals; load three.js and models after the first tap.
8. **Narrator for the story game**: Ink Heroes has cutscenes with text only; the same ElevenLabs pipeline (`tools/build-ashen-vigil.js` shows how to embed clips) could voice them.

## 5. How to run and test

```bash
node tools/build.js                 # builds all games (Ashen Vigil via tools/build-ashen-vigil.js)
node tools/capture-ashen-vigil.js   # (re)makes its thumbnails
node tools/site.js                  # regenerates the website, now lists Ashen Vigil in EN/FR/AR
node tests/ashen-vigil.js           # 24 checks: canvas-only, controls, performance, evolution, voices, fallback, win run
node tests/site.js                  # 92 pages, 303 links
```
Open `games/ashen-vigil.html?test` to expose `window.__av` (debug hooks used by the tests).
