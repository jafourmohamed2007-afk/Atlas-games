# Pocket Grove — 3D idle garden

**Goal:** a cozy game people open every day. The garden grows in real time, even while the game is closed, and timed events reward coming back.

## Tech
- **three.js** (r181, MIT) renders the 3D scene into the Bubzi Kit canvas, so menus, ads, sound, coins and languages work like in every other game.
- **Models:** 47 low-poly models from **KayKit** by Kay Lousberg (**CC0**: free for commercial use, credit appreciated): City Builder Bits, Halloween Bits, Medieval Hexagon Pack, Restaurant Bits, Furniture Bits, from the official GitHub releases (github.com/KayKit-Game-Assets).
  `tools/grove/pack-models.js` merges them into one compressed file, `src/grove/kaykit.glb` (368 KB; meshopt + quantization). The list is in `tools/grove/models.txt`.
- Plants, the island, fence, pets and the egg are built in code (procedural low-poly), so they can grow smoothly and change color with mutations.
- `tools/build.js` bundles `src/grove/main.js` + three.js + the models with esbuild into the single file `games/pocket-grove.html` (about 1.2 MB, about 450 KB gzipped).
- Slow devices: resolution drops automatically, then shadows turn off.

## Loop
Tap an empty plot → pick a seed → tap to water (+20% growth) → it grows in real time → tap to harvest for gold → buy more seeds, unlock plots, level up.

| Seed | Grow time | Price | Sells | Level |
|---|---|---|---|---|
| Carrot | 30 s | 5 | 9 | 1 |
| Lettuce | 1.5 min | 15 | 26 | 1 |
| Tomato | 5 min | 40 | 70 | 2 |
| Onion | 15 min | 90 | 160 | 3 |
| Potato | 40 min | 180 | 330 | 4 |
| Pumpkin | 1.5 h | 400 | 760 | 6 |
| Sun Pumpkin | 3 h | 900 | 1750 | 8 |
| Moon Cactus | 6 h | 1800 | 3600 | 10 |
| Ink Bloom | 12 h | 4000 | 8500 | 12 |

## Reasons to come back (all without a server)
- **Real-time growth + offline progress** (timestamps in localStorage), with a "Welcome back" summary.
- **Seed shop restocks every hour** (the same stock for everyone in that hour); rare seeds are limited. "Restock now" = rewarded ad.
- **Real-clock events (local time):** Ink Rain every 2 hours at :30 for 15 min (plants that grew in rain can turn **Wet ×2**), **Golden Hour** 7–8 pm (harvests can turn **Golden ×5**), **Moonlight** 9–10 pm (**Moonlit ×4**). The sky, light and rain change live.
- **Random mutations:** Shiny ×2, Giant ×3, Rainbow ×8 (stack).
- **Harvest Album:** 9 seeds × 7 looks = 63 entries to collect.
- **Pets** from eggs (1500 gold, level 5, hatch in 20 min): Bunny (grow 10% faster), Bee (+50% mutations), Hedgehog (+15% sell), Firefly (+25% XP, rare).
- **Daily seed gift**, plus the site-wide daily coin bonus.
- **Day/night** follows the player's clock, with lanterns at night.

## Ads (placeholders)
Rewarded: "+15 MIN" boost (every 4 min), "Restock now", "×2" on rare harvests. Banner below the game as usual.

## Test
`node tests/grove.js`: 3D load, plant/water/grow/harvest, shop, plots, mutation values, event schedule, Golden Hour drop, egg → pet, offline growth after reload, phone taps.
