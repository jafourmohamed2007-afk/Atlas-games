# Part 1: Browser Game Market Research

_Researched 26 November 2026. Traffic numbers come from third-party estimates (Semrush, Similarweb) and from the platforms' own claims, and these sources often disagree. Use them as rough sizes, not exact counts. Sources are listed at the end._

---

## 1. Platform summary table

| Platform | Monthly traffic (est.) | Strongest genres | Trending / top games (examples) | How it earns | What developers get |
|---|---|---|---|---|---|
| **Poki** | ~150M visits/month (Semrush, Jan 2026). Claims **100M monthly players** and ~1B plays/month | Casual, driving, skill/platformer, puzzle, sports, .io | Level Devil, Smash Karts, Subway Surfers, Blocky Blast Puzzle, Drive Mad, Retro Bowl, Monkey Mart, Stickman Hook, Moto X3M, Master Chess | Ads (pre-roll, mid-roll and rewarded) through the Poki SDK | Default is a **web-exclusive revenue share**. A third-party guide reports 50/50 on players Poki sends you and 100% on players you bring (Poki doesn't publish this). There's also a non-exclusive **one-time license fee**. Paid by wire or PayPal |
| **CrazyGames** | Claims **60M+ monthly users** and 3B plays in 2026. ~93M visits in April 2026 (secondary source) | Hypercasual and puzzle (reported at 99% of playtime), .io multiplayer, sandbox | Bloxd.io, Smash Karts, Ragdoll Archers, Mahjongg Solitaire | Ads, plus in-game purchases through Xsolla (invite-only) | Split isn't published. 2026 jam terms gave developers **60% of ad revenue and 70% of IAP revenue**. Paid monthly via Tipalti, **€100 minimum** |
| **Coolmath Games** | Brand searches alone are 11–19M/month. 63% of visits are direct (students who bookmark it) | Logic/puzzle, skill, "restaurant" management, platformers. School-safe content | Run 3, Papa's Freezeria, Fireboy & Watergirl, Moto X3M, Bloxorz, Snake, Papa's Pizzeria | Ads aimed at a K-12 audience | Licensing deals per game. Terms aren't public, and the content standards are strict (school-safe) |
| **Y8** | ~5–6.6M visits/month (Semrush, undated) | **Skill & precision plus driving make up ~27% of all plays** (Y8, March 2026) | Orion Sandbox Enhanced, Earn to Die 2012 pt 2, Hide Online, Bartender: The Right Mix, Real Cars Epic Stunts | Ads, Y8 Account | Accepts uploads, with revenue share through its own program |
| **Armor Games** | No reliable 2026 figure. A legacy portal from the Flash era | Strategy, tower defense, RPG | Kingdom Rush, Crush the Castle, Sushi Cat: Tower Defense (2026) | Ads, plus it now works mostly as a **publisher** (Armor Games Studios: Steam, mobile, console) | Publishing or sponsorship deals, not open revenue share |
| **itch.io (HTML5)** | 43M (Similarweb, Nov 2025) to 107M (Semrush) visits/month for the whole site | Puzzle, visual novel, platformer, jam games | Changes daily. Mostly indie or experimental games | **Players pay you directly**: pay-what-you-want, donations, sales. Not ad-funded | You set itch.io's cut yourself (default 10%). Great for feedback and a portfolio, but browser games earn little there |
| **GameDistribution** | A B2B network that pushes your game to thousands of partner sites | Hypercasual, puzzle, girls/dress-up, driving | n/a (distributor) | Ads through its SDK on partner sites | About **33% of net ad revenue** (figure reported by a competitor), €100 threshold, paid ~60 days after the monthly report |
| **Playgama** | Claims **300–450M players** across 100+ partner platforms, including YouTube Playables and MSN | Hypercasual, puzzle, arcade | n/a (distributor) | Ads and IAP across partner sites | Self-reported tiers: **70% up to $1k, 80% to $3k, 90% above**. 50% for plays on playgama.com itself. $100 threshold |

### How much ads actually pay (rewarded video, web games, 2026)
| Region | Rewarded eCPM (per 1,000 ad views) |
|---|---|
| Global average | ~$3.6 |
| Tier-1 (US, UK, CA, AU) | ~$6–7 (Applixir), up to $15–28 US (Playgama claim) |
| Western Europe | ~$8–15 |
| Tier-3 (India, Brazil, much of Africa) | ~$1–3 |

**Rule of thumb:** with one rewarded ad per session, 100,000 plays a month ≈ **$300–$1,500/month**. Where your players live matters most. Portal revenue share and distribution networks make up the gap until your own site gets traffic.

### Two platform shifts that matter in 2026
- **TikTok Mini Games will stop accepting HTML5 games** from Aug/Sep 2026 and now require Cocos, Laya or Unity builds. TikTok is still very good for **marketing clips**, but it's no longer a place to host HTML5 games.
- **YouTube Playables** (reached through Playgama or a direct application) is still open to HTML5 games. It has a 512MB memory limit, which small canvas games easily stay under.

---

## 2. Market gaps (underserved areas)

| Gap | Evidence | Why it's an opening for you |
|---|---|---|
| **Arabic-first web games** | MENA-3 games revenue is ~$2.8B in 2026, with ~86M players. About 41% of MENA players say they only play, or strongly prefer, Arabic-localized games. Almost no web portal offers games designed for Arabic (most only translate the site menu). Studios like Ouaz Games (Morocco) are growing on browser platforms | Gulf traffic (Saudi Arabia, UAE) pays tier-1-like ad rates. Real right-to-left support plus Arabic-native text in the games is rare |
| **French-first web games** | France, Belgium, Switzerland and Quebec pay Western European eCPMs. Francophone Africa is a large, fast-growing mobile audience | The big portals translate their menus, but games are rarely built French-first |
| **Fun learning games ("stealth learning")** | Coolmath built a top brand on it. Chromebooks are ~60% of US K-12 devices, and schools block most general portals | School-safe, no-signup, short educational games get daily repeat visits from students and teachers |
| **Short, mobile-first sessions** | Hypercasual and puzzle games are reported at 99% of CrazyGames playtime. Poki's trending list is mostly one-thumb games | Sessions of 30 seconds to 3 minutes fit phones, school breaks and short-video marketing |
| **Language-free games** | The top trending games (block puzzles, skill hoppers, driving) need almost no text | One game can serve EN, FR and AR players at once with near-zero localization cost |

**My positioning recommendation:** a **trilingual (EN / FR / AR) portal for quick, school-safe, mobile-first games**. No mainstream competitor owns this mix, and every game is also easy to submit to Poki, CrazyGames, GameDistribution and Playgama for extra income.

What I'm **not** recommending to start with: **.io multiplayer** games (Smash Karts, Bloxd). They're huge, but they need servers, anti-cheat and a player base from day one, which is too expensive and risky for a first launch.

---

## 3. Five recommended game ideas

All names and concepts are placeholders and fully original. Mechanics follow proven genres; nothing visible is copied.

| # | Working title | Genre (proven by) | Core loop | Why it should succeed |
|---|---|---|---|---|
| 1 | **Rooftop Rush** | 3-lane endless runner (Subway Surfers is a top-5 Poki game) | Swipe or use arrow keys to change lanes, jump and slide across colorful rooftops. Collect coins, unlock skins | The single most-played web genre, ideal on mobile, and the best fit for coins, skins and daily bonuses. Gameplay clips look great on TikTok |
| 2 | **Block Bloom** | Block-placement puzzle (Blocky Blast Puzzle is trending on Poki) | Drag shapes onto an 8×8 grid and clear rows and columns to make flowers bloom, with combos and streaks | Appeals to every age, needs no text, is cheap to build and has very high replay value. Also safe for schools |
| 3 | **Hop Hook** | One-tap skill/precision (Level Devil, Stickman Hook; skill + driving = 27% of Y8 plays) | Tap to grapple and swing through short handmade levels, collecting three stars per level | 10-second learning curve, "one more try" pull, and dramatic fails that make great Shorts |
| 4 | **Number Pop** | Educational arcade (the Coolmath model) | Bubbles float up carrying numbers; pop the one that answers the sum before it escapes. Difficulty rises from addition to multiplication | Fills the education gap, is easy to offer in EN/FR/AR (Eastern-Arabic digits optional), and teachers can share it. Its school-safe content sets it apart |
| 5 | **Hill Hopper** | Physics driving/stunts (Drive Mad, Moto X3M, Earn to Die) | Gas and brake buttons drive a bouncy car over hills, loops and ramps. Flips earn bonus coins; upgrade or unlock cars | Driving is a top category on every portal. Physics crashes are naturally fun to watch and share |

**Build order I suggest:** 2 → 1 → 3 → 4 → 5. The order runs from simplest and safest to most complex, so the shared style, sound and reward system get proven on the easiest game first.

**Alternative for any slot:** an **idle/merge shop tycoon** (Monkey Mart-style). It has strong retention, but it's longer to balance.

---

## Sources
- [Semrush: poki.com overview](https://www.semrush.com/website/poki.com/overview/)
- [Tech Insider: CrazyGames vs Poki vs Coolmath 2026](https://tech-insider.org/crazygames-vs-poki-vs-coolmath-games-2026/)
- [Tech Funding News: Poki 1 billion monthly plays](https://techfundingnews.com/browser-gaming-website-poki-won-big-at-the-dutch-game-awards-celebrating-hitting-1-billion-monthly-plays/)
- [Poki homepage (trending)](https://poki.com/) · [Poki popular](https://poki.com/en/popular) · [Rovin Games: Top 10 trending on Poki, Sept 2026](https://rovingames.com/blog/top-10-trending-games-on-poki-to-play-in-your-browser-september-2026/)
- [Cinevva: How to get your game on Poki](https://app.cinevva.com/guides/publish-game-poki) · [Poki SDK FAQ](https://sdk.poki.com/faq)
- [Cinevva: CrazyGames developer guide](https://app.cinevva.com/guides/publish-game-crazygames) · [GamesBeat: CrazyGames users](https://gamesbeat.com/crazygames-hits-35m-users-for-browser-games-and-launches-social-multiplayer-features/) · [Wikipedia: CrazyGames](https://en.wikipedia.org/wiki/CrazyGames) · [Industry.co.id: CrazyGames April 2026](https://www.industry.co.id/read/150924/5-rekomendasi-game-seru-di-crazy-games-buat-nemenin-weekend-kamu)
- [Coolmath Games: Top 10 most popular](https://www.coolmathgames.com/blog/top-10-most-popular-games-on-coolmath-games) · [Designbeep: Cool Math Games 2026](https://designbeep.com/2026/10/13/cool-math-games/) · [Semrush: coolmathgames.com](https://www.semrush.com/website/coolmathgames.com/overview)
- [Y8 newsroom: two categories = 1 in 4 plays](https://ar.y8.com/newsroom/one_in_four_plays_y8_two_categories) · [Semrush: y8.com](https://www.semrush.com/website/y8.com/overview/) · [Gaming ProMax: best Y8 games](https://gamingpromax.com/best-games-on-y8-com/)
- [Wikipedia: Armor Games](https://en.wikipedia.com/wiki/Armor_Games)
- [Semrush: itch.io](https://semrush.com/website/itch.io/overview) · [Similarweb: gamejolt competitors (itch.io visits)](https://www.similarweb.com/website/gamejolt.com/competitors/) · [itch.io forum post on HTML5 revenue](https://itch.io/post/725449)
- [Playgama: Poki vs CrazyGames vs GameDistribution revenue share](https://playgama.com/blog/business-faqs/poki-vs-crazygames-vs-gamedistribution-revenue-share/) · [Playgama for developers](https://playgama.com/developers)
- [Applixir: highest-paying HTML5 ad formats](https://www.applixir.com/blog/whats-the-highest-paying-ad-format-for-html5-games-right-now) · [Playgama: normal eCPM for HTML5](https://playgama.com/blog/business-faqs/what-ecpm-is-normal-for-html5-games/)
- [TikTok: migrate from HTML to native runtime](https://developers.tiktok.com/docs/en/migrate-from-html-to-native-runtime) · [YouTube Playables](https://developers.google.com/youtube/gaming/playables) · [Playables FAQ](https://developers.google.com/youtube/gaming/playables/support/faq)
- [Game Growth Advisor: MENA market entry 2026](https://gamegrowthadvisor.com/blog/2026-05-28-mena-gaming-market-entry-guide-2026/) · [PocketGamer.biz: Top 30 MENA game makers 2026](https://www.pocketgamer.biz/the-top-30-mena-game-makers-of-2026/) · [PocketGamer.biz: MENA players want games made for them](https://www.pocketgamer.biz/mena-region-is-open-to-global-ips-but-players-want-games-made-for-them)
- [About Chromebooks: education adoption stats](https://www.aboutchromebooks.com/chromebooks-in-schools-statistics/)
