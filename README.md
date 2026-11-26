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
node tests/site.js                        # website tests: every page, links, SEO tags, phone layout, features
node tools/build.js                       # build games/*.html from src/
SITE_URL=https://yourdomain.com node tools/build.js   # set canonical/SEO URLs
node tests/run.js                         # browser tests: menus, ads, saving, languages, touch, 8x-speed stress
node tests/bots.js                        # gameplay bots that play each game and check the rules
node tests/ink-features.js                # Ink Heroes: shop, all 11 guns, all 8 items, heart revive
node tests/ink-story.js                   # Ink Heroes story: 40 levels, cutscenes, 5 bosses, stars, unlocks, Nightmare
```
Source: `src/kit/` (shared engine and styles), `src/games/*.js` (one file per game), `src/games.json` (titles, SEO text, keywords in 3 languages).
URL flags: `?lang=en|fr|ar`, `?test` (instant ads plus debug hooks), `?speed=N`.
