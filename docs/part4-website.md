# Part 4: The Website

## Design: "Night Arcade" (redesigned after reviewing CrazyGames and jeu.fr)
| What the reference sites do well | What Bubzi does |
|---|---|
| Rich, detailed thumbnails | Original lit key art for every game (rendered by `tools/render-art.js`), no text so it works in all 3 languages |
| Gameplay video in the featured card | "Game of the day" hero plays a real gameplay clip recorded from the game; every card plays its clip on hover (desktop) or when in view (phone) |
| Mood tiles ("With friends", "5-minute fun") | 8 mood/category tiles with 3D-style original icons |
| Dark UI so art pops | Dark-first theme with neon accents; light theme in one tap |
| Bottom tab bar on phones | Home · Search · My games · Rewards (daily streak + skins, shared with the games) |
| Fast "Play" | Tap a card and the game is playing in about 0.2 s (measured) |

## Pages (66 total, all generated)
- Home: `/`, `/fr/`, `/ar/`
- 8 game pages × 3 languages: `/play/<game>.html`, with how-to-play, FAQ (FAQPage schema), related games, ad slots
- 8 category/mood pages × 3 languages: `/c/<slug>.html`
- About, privacy, terms, contact × 3 languages. **Fill in the [PLACEHOLDERS] before applying to ad networks.**
- `sitemap.xml` (with hreflang), `robots.txt`, `ads.txt` (placeholder), `manifest.webmanifest`, favicon

## SEO
- A unique title, description and keywords on every page, in its language
- `hreflang` links between EN/FR/AR and canonical URLs
- JSON-LD on every page type: VideoGame, BreadcrumbList, FAQPage, CollectionPage, ItemList
- Social images (1200×630) for every game
- Self-hosted fonts, lazy images and small pages, which keep the site fast

## Partner games (licensed)
1. Sign up as a publisher (website owner) at GameMonetize or GameDistribution and add your domain.
2. Run `node tools/fetch-partners.js --source gamemonetize --count 40` (or `--source gamedistribution`).
3. Run `node tools/site.js`. You'll get a "More games" section plus a page for every partner game.
Violent and horror games are skipped by default to keep the site family-friendly.

## Tests
`node tests/site.js` checks all pages for errors, broken links, SEO tags, a single h1, phone overflow and Arabic RTL. It also tests search, rewards, skins, theme, favorites, continue-playing, language switching and the time from tap to play.
