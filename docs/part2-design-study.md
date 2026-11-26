# Part 2: Design Study and Direction

## 0. Decisions made for you (you asked me to choose)

| Decision | Choice | Why |
|---|---|---|
| **Brand name** | **Bubzi** (working name) | "Atlas Games" is a registered US trademark of a tabletop publisher (Reg. No. 6297794), so it isn't safe to use. A web search for "Bubzi" found no game, site or studio with that name. It's 2 syllables, easy in EN and FR, and simple in Arabic (بوبزي). **Before buying the domain, run a formal trademark search (USPTO / EUIPO / WIPO).** |
| **Mascot** | **Bubzi**, a round, bouncy jelly creature | A round shape is readable at 32px (favicon) and at 300px. It's easy to animate (squash and stretch), has no gender, age or culture attached, and works in every game as the guide character |
| **Games** | Keep all 5 | Each one targets a **generic genre keyword with high search volume** in 3 languages, where Arabic and French results are still weak (see below) |

### Keyword targeting (search volume × competition)
I couldn't get exact volumes without a paid keyword tool (Google Keyword Planner is free once you open a Google Ads account, so check there before launch). The strategy rests on one known pattern: **English genre keywords are fiercely contested, while the same keywords in French and especially Arabic are searched heavily but answered by low-quality pages.** Brand names of other games (e.g. "Subway Surfers") are off-limits.

| Game | EN cluster (high volume, hard) | FR cluster (high volume, medium) | AR cluster (high volume, easier) |
|---|---|---|---|
| Block Bloom | block puzzle, block games | jeux de blocs, puzzle gratuit | ألعاب ذكاء, ألعاب ألغاز, لعبة بلوك |
| Rooftop Rush | running games, endless runner | jeux de course, jeux de course à pied | ألعاب جري, ألعاب ركض |
| Hop Hook | skill games, hook games | jeux d'adresse | ألعاب مهارة, ألعاب تحدي |
| Number Pop | math games for kids | jeux de maths, calcul mental | ألعاب رياضيات, ألعاب تعليمية للأطفال |
| Hill Hopper | car games, driving games | jeux de voiture | ألعاب سيارات |

Each game gets its own SEO landing page in all 3 languages (built in Part 4).

---

## 1. What makes the top performers work

| Pattern | Poki | CrazyGames | Coolmath | Mobile hits (endless runner, match-3) | Lesson for Bubzi |
|---|---|---|---|---|---|
| **Time to play** | 1 tap from the homepage. The game loads in the page, with no signup | 1 tap, plus a short pre-roll ad | 1 tap. Ads are kid-safe | The game loads straight into gameplay. The tutorial is the first level | **Thumbnail → playing in under 3 seconds.** The first ad comes *after* the first round, never before |
| **Layout** | A dense, irregular mosaic of tiles of mixed sizes. No hero banner, so games ARE the page | A sidebar of categories plus horizontal rows ("carousels") | Category rows, big titles | Not applicable | Mobile-first rows you can swipe, plus one big "featured" card. Categories as icon chips |
| **Thumbnails** | Square, rounded, a character close-up, no text | 16:9, bold art, title shown on hover | Square, title underneath | App icons: one character face, saturated, centered | **Big character or object, saturated colors, one focal point**, readable at 100px. Play a short preview on hover or long-press |
| **Color** | A light, calm background so the colorful thumbnails pop | A dark UI with a purple accent | A dark blue-and-yellow theme | Saturated candy colors with heavy highlights and shadows | Keep the UI neutral so **the games supply the color**, with one strong brand accent |
| **Buttons** | Small and minimal | Standard | Standard | **Huge, 3D, glossy, bouncy** | Mobile-game-style chunky buttons on a clean web layout |
| **Motion** | Tiles lift on hover | Video preview on hover | Minimal | Everything bounces, pops and sparkles | Micro-animations on every tap (scale to 0.95 then back to 1.05), confetti on rewards |
| **Retention** | "Recently played" | Login, favorites, levels | Favorites | Daily rewards, streaks, lives, events | **No login**: Continue Playing, a daily bonus chest, coins and skins saved in the browser (localStorage) |
| **Fonts** | A rounded geometric sans | A clean sans | Bold, playful | Chunky display faces with outlines | A rounded display font for headings plus a clear body font, **with matching Arabic fonts** |

## 2. Rules for an original look
- Bubzi's palettes, mascot, logo and layouts are made fresh. No colors are sampled from any portal (Poki's blue, CrazyGames' purple-on-dark, Coolmath's yellow-on-blue) and no tile layouts are copied.
- One art style for every game: rounded shapes, thick soft outlines, and Bubzi appearing as guide or player.
- Every screen works RTL (Arabic) by design. Icons that suggest direction flip; the logo does not.

## 3. Style options
Three options are drawn on the design canvas (homepage + Block Bloom game screen for each):

- **A: Jelly Pop** (light, bright). A sky-lilac background, violet + orange + mint, glossy 3D "jelly" buttons, the Baloo font family (Latin and Arabic versions match).
- **B: Neon Night** (dark-first, light mode available). Deep indigo with neon cyan, pink and lime glows, an arcade feel aimed at teens.
- **C: Sticker Pack** (flat, bold). Sunny yellow + coral + teal, thick ink outlines and hard offset shadows, like stickers on a notebook. Uses the Rubik font family (built-in Arabic). The friendliest for schools.
