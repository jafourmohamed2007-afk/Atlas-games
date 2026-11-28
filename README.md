# Bubzi Games

**Website:** open `index.html` through any web server (e.g. `npx serve .`). Pages exist in English (`/`), French (`/fr/`) and Arabic (`/ar/`, right-to-left).

Original HTML5 casual games: mobile-first, in **English, French and Arabic (right-to-left)**, with no sign-up.

## The games (`games/` folder: each one is a single self-contained HTML file)

| Game | Genre | Controls |
|---|---|---|
| `block-bloom.html` | Block puzzle | Drag shapes · keys 1-3 + arrows + Enter |
| `rooftop-rush.html` | 3-lane runner | Swipe / tap sides · arrows, Space |
| `hop-hook.html` | One-touch swing | Hold to grab, release to fly · Space |
| `number-pop.html` | Math learning | Tap the right bubble · type the number |
| `hill-hopper.html` | Physics driving | Hold right = gas, left = brake · arrows |
| `jelly-drop.html` | Drop & merge | Aim and release · arrows + Space |
| `memo-match.html` | Memory cards | Tap cards · arrows + Enter |
| `wiggle-snake.html` | Snake | Swipe / tap · arrows |
| `ink-heroes.html` | 2.5D stickman brawler: 40-level story + Infinity | On-screen buttons · arrows, W, J, K, L, R, 1-7 |
| `ink-heroes-remastered.html` | Same game as Ink Heroes with Blender 3D-rendered art (both built from `src/games/ink-heroes.js`; separate saves) | Same as Ink Heroes · M missions, Z Zombie Book, R buys ammo in the shop |
| `spear-hills.html` | Turn-based spear duel | Pull back and let go · Up/Down angle, Left/Right power, Space |
| `merge-blasters.html` | Merge blasters, pop goo blobs before your wall | Drag same numbers together · B buys, arrows + Space |
| `tiny-siege.html` | Lane war: miners, stick army, enemy tower | Tap the unit buttons · 1-4 send units, H Attack/Defend |
| `bubble-bastion.html` | Tower defense: pop bubbles drifting down a stream | Pick a tower, tap the grass · arrows + Space, 1-4 pick, U/S/N |
| `arrow-rampart.html` | 3D wall defense archery (three.js, `src/arrow/`): 5 modes, shop with feathers + gems, Rampart Pass, daily missions, special arrows | Pull back and let go · Up/Down aim, hold Space, 1-3 cards / special arrows · hub: arrows + Enter, S shop, T pass, M missions |
| `pocket-grove.html` | 3D idle garden (three.js) | Tap plots · arrows + Enter, S shop, A album, H pets, B boost |

Every game has a start screen, score, rising difficulty, game over, restart, pause, sound on/off, saved best score,
coins, 8 unlockable skins (shared across all games), a daily bonus streak, a "show, don't tell" tutorial, and ad placeholders.

## Ads: where to plug in your network
All ad calls live in **one place**: the `Ads` object in `src/kit/kit.js` (search for `AD PLACEHOLDER`).
- **Interstitial** between rounds (every 2nd restart): `Ads.interstitial(done)`
- **Rewarded** "watch ad to continue" (once per round): `Ads.rewarded(done)`. Call `done(true)` only when the reward is earned.
- **Banner 320×50** below the game: the `#bannerSlot` element. Add `?embed` to the URL to hide it on partner portals.
- Portal hooks `gameplayStart/Stop` for Poki and CrazyGames.

Example calls for GameDistribution, Poki, CrazyGames and AdSense H5 are in the comments.

## Develop
```bash
node tools/render-art.js                  # original key art, icons, social images → thumbs/
node tools/capture-previews.js            # record gameplay preview clips → thumbs/*-play.webp
SITE_URL=https://yourdomain.com node tools/site.js   # generate the website (all pages, sitemap, robots)
node tools/fetch-partners.js --source gamemonetize   # add licensed partner games (after signing up)
node tools/fetch-partners.js --recat                 # re-sort the saved partner games into categories (no download)
node tests/site.js                        # website tests: every page, links, SEO tags, phone layout, features
node tools/build.js                       # build games/*.html from src/
SITE_URL=https://yourdomain.com node tools/build.js   # set canonical/SEO URLs
node tests/run.js                         # browser tests: menus, ads, saving, languages, touch, 8x-speed stress
node tests/bots.js                        # gameplay bots that play each game and check the rules
node tests/ink-features.js                # Ink Heroes: shop, all 11 guns, all 8 items, heart revive
node tests/ink-story.js                   # Ink Heroes story: 40 levels, cutscenes, 5 bosses, stars, unlocks, Nightmare
node tests/ink-remastered.js              # all Ink tests again, against the Remastered build
blender -b -P tools/art/ink/render.py     # Remastered 3D art → games/art/ink-heroes/
tools/art/ink/gen-audio.sh && tools/art/ink/gen-audio2.sh && tools/art/ink/process-audio.sh   # Ink music, SFX and voices (ElevenLabs) → games/audio/ink-heroes/
node tests/arrow-meta.js                  # Arrow Rampart: hub, 5 modes, shop, pass, special arrows, Headhunter, Time Attack
blender -b -P tools/art/arrow/icons.py    # Arrow Rampart 3D item icons → games/art/arrow-rampart/
tools/art/arrow/gen-audio.sh && tools/art/arrow/process-audio.sh   # Arrow Rampart music/SFX (ElevenLabs) → games/audio/arrow-rampart/
node tests/goals.js                       # daily goal + beat-your-best on every game
node tests/grove.js                       # Pocket Grove (3D): grow, harvest, shop, events, pets, offline growth
```
### Website layout ("Bubzi Bright")
- Bright and colourful by default; the moon button switches to dark mode (remembered).
- Home: a dense mosaic of square tiles (our HOT games are big 2×2 tiles, partner games fill around them), then colour bands that slide sideways: Bubzi Originals, Continue, New, Most played, one band per category.
- Game pages (ours and partner `g/*.html`): the game in the middle, a column of game tiles on the left, an ad and more tiles on the right, and a tile mosaic underneath. Every tile opens and starts its game with one tap. On phones the tiles come right under the game.
- Partner games, while you wait for the partner sign-up: they all live on ONE page, `more-games.html` (one per language), reached from the yellow "More free games" banner and chip. Their own pages are `noindex` and left out of the sitemap.
  After you are approved, run `PARTNERS=live node tools/site.js` to mix them into the home page, categories and game pages.
- Partner games show their network's own ads. If a partner picture cannot load, the tile shows the game name on a coloured background.

Source: `src/kit/` (shared engine and styles), `src/games/*.js` (one file per game), `src/games.json` (titles, SEO text, keywords in 3 languages).
URL flags: `?lang=en|fr|ar`, `?test` (instant ads plus debug hooks), `?speed=N`.

### Pocket Grove (3D)
`npm install` once (three.js, esbuild, glTF tools), then `node tools/build.js` as usual. `node tests/grove.js` tests it.
3D models: [KayKit](https://kaylousberg.com) by Kay Lousberg, CC0. See `docs/pocket-grove-design.md`.

### Currencies and the Bubzi Exchange
Every game has its own currency, earned only in that game: Petals (Block Bloom), Grove Gold (Pocket Grove), Sparks (Rooftop Rush), Sky Gems (Hop Hook), Pop Bubbles (Number Pop), Nuts (Hill Hopper), Jelly Beans (Jelly Drop), Brain Stars (Memo Match), Apples (Wiggle Snake), Ink Drops (Ink Heroes).
**Bubzi Coins** are the website currency: daily bonus and character skins. The **Bubzi Exchange** (Exchange button in each game, and the Rewards panel on the website) turns a game currency into Bubzi Coins.
Rates change every day (0.8 to 1.25) and one game a day is **HOT** (×2), the same for everyone (computed from the date, no server). **Bubzi Tour:** play 3 different games in a day for +50 Bubzi Coins.
Names, icons and base rates are in `src/kit/currency.js` (used by the games and the website).

### Creator code (TEMPORARY, remove before launch)
In any game, press the **Code** button on the menu and enter `creator` (or type `creator` on the keyboard). That game then gets 9,999,999 of its currency and Bubzi Coins (refilled when spent), all skins, and every unlock (Ink Heroes: all heroes, guns, items, story levels; Pocket Grove: gold, seeds, level 12, plots, sprinkler, decorations, pets). It is saved per game.
To remove it: delete every line marked `CREATOR` (`grep -rn CREATOR src/`), then rebuild.
