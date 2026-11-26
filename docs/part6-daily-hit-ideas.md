# Part 6 — New game ideas that make people come back every day

Research date: November 2026. Sources are listed at the end. Most player figures come from trade press and analytics blogs, so treat them as rough.

## What the research says

| Finding | What it means for us |
|---|---|
| **Grow a Garden** (Roblox) peaked around 21–22 M players online at once. Plants keep growing while you're away, so people come back to harvest. | **Offline progress** (things happen while the player is gone) is the strongest "come back tomorrow" hook. We can do it without a server: save a timestamp in localStorage. |
| **Steal a Brainrot** (Roblox) passed 25 M concurrent players: collect silly creatures, they earn money in your base, rarer ones earn more. | **Collect + passive income + rarity** keeps people checking in. The meme characters are someone else's, so we invent our own. |
| **Block Blast** was the most downloaded mobile game of 2025 (~356 M installs) and still #1 in early 2026: three pieces at a time, short sessions. | Our **Block Bloom** already has this loop. Adding progression and a daily challenge is cheap. |
| **Wordle** still has ~4 M daily players. One word (BONGO) broke 36,000 streaks in a day. NYT built a subscription business on daily puzzles. | **One puzzle per day, the same for everyone, plus a streak and a shareable result** creates habit and free word of mouth. |
| **Survivors-likes and Balatro-likes** were the big indie trend (Megabonk, Vampire Crawlers; roguelite revenue on Steam up ~80% in 2025), but Steam is now crowded with them. | On the **web** this format is still rare. A short-run roguelite with permanent upgrades fits browser sessions well. |
| Hybrid-casual games (simple play + progression/collection) keep players longer than pure hypercasual: about 5.9% vs 4.6% on day 30 for top games. | Every new game should have a **meta layer**: collection, upgrades, levels. |
| MENA: 72–86 M gamers; puzzle is the #1 mobile genre; 41% prefer or only play Arabic games; under 1% of store games are in Arabic. | **Arabic daily puzzles are a low-competition niche.** We already support RTL. |

**Limit to keep in mind:** the site has no server. Real multiplayer and global leaderboards need one (or a portal SDK such as CrazyGames' or Poki's). Everything below works **without a server**: daily seeds come from the date, offline progress from saved timestamps, and "rivals" are AI or recorded ghosts.

## Six ideas (all original)

### 1. Pocket Grove — idle garden that grows while you sleep ⭐ best for daily return
- Plant seeds; they grow in **real time** (2 minutes to 12 hours). Harvest, sell, buy rarer seeds.
- **Weather events** on a fixed clock (Ink Rain every 2 h, Golden Hour at 8 pm) give **mutations** (glowing, giant, rainbow) that multiply value → reasons to come back at set times.
- The **seed shop restocks every hour** with random rare seeds. Pets give bonuses. A sticker album tracks every plant × mutation.
- Rewarded ads: "watch to grow 2 h instantly", "double this harvest". Very natural ad spots.
- Cost: medium. Retention: very high. Competition on web: low (garden idle games exist but few are polished and trilingual).

### 2. Bubzi Daily — three daily puzzles in EN / FR / AR ⭐ cheapest viral hook
- Every day at midnight: **1 word puzzle, 1 number/logic puzzle, 1 picture puzzle**, the same for everyone (seeded by the date).
- An emoji result card to share ("Bubzi Daily #142 🟩🟩🟨 in 2:14"), plus streaks, freeze tokens (from rewarded ads) and an archive of past days.
- Original mechanics, not a Wordle copy. Example word puzzle: "Letter Ladder", change one letter per step to get from word A to word B.
- Arabic version targets a market where almost nothing exists. SEO: "لغز اليوم", "jeu du jour", "daily puzzle".
- Cost: low–medium (the word lists in 3 languages are the main work). Retention: very high (streaks). Virality: high (share card).

### 3. Ink Survivors — 10-minute horde roguelite with Ink Heroes characters
- Auto-attacking hero, hundreds of Smudged zombies, pick 1 of 3 upgrades on each level up, evolve weapons, beat the boss at minute 10.
- Permanent upgrades between runs, 4 heroes, unlockable stages (reuses the Ink Heroes art, rig and 2.5D worlds).
- **Daily Run:** a fixed seed and modifiers each day, with a personal best and streak.
- Cost: medium (engine and art already exist). Retention: high. Trend fit: very strong (Megabonk / Vampire Survivors style, still rare on the web).

### 4. Critter Vault — collect weird creatures that earn coins
- Original silly creatures (e.g. "Toastopus", "Sir Pickles") roll out of eggs with rarities (common to cosmic).
- Placed in your vault, they **earn coins over time, including offline**. Merge two of the same to rank them up.
- PvE "heists" against AI vaults to steal creatures, with daily vault events and a limited "creature of the day".
- Cost: medium. Retention: high. Note: needs strong original character art. That's the selling point, and it must not look like the meme brainrot characters.

### 5. Bloom Run — Block Bloom becomes a roguelite (Block Blast + Balatro)
- The same three-pieces block puzzle, but you play **runs**: reach a target score in N moves, then pick a **charm** (e.g. "rows of 5 colors ×3", "bombs on corners").
- Charms stack into silly combos. Daily seed run and permanent charm unlocks.
- Cost: low (upgrade of an existing game). Retention: medium–high. Rides the #1 puzzle trend.

### 6. Site-wide "Bubzi Pass" — a reason to open the site every day (applies to all games)
- **3 daily quests** across games ("pop 50 bubbles", "reach wave 5 in Ink Heroes") and a **free 30-tier season track** with skins, coins and stickers.
- A **sticker album** filled from all games, and weekend events (double coins, a boss rush).
- Builds on the existing 7-day daily bonus and shared coin wallet. It increases plays across all 9 games, not just one.
- Cost: low–medium. Retention: high for the whole site.

## Recommended order
1. **Bubzi Pass** (site-wide daily quests): lifts every existing game, cheap.
2. **Bubzi Daily** (EN/FR/AR daily puzzles): habit + sharing + Arabic niche.
3. **Pocket Grove** (offline idle garden): the strongest return loop and natural rewarded ads.
4. Then **Ink Survivors** (reuses Ink Heroes) and **Bloom Run** (reuses Block Bloom).

## Sources
- Grow a Garden / Steal a Brainrot: [Wikipedia: Steal a Brainrot](https://en.wikipedia.org/wiki/Steal_a_Brainrot), [games.gg](https://games.gg/news/roblox-grow-a-garden-tops-charts/), [studiokrew](https://studiokrew.com/blog/top-roblox-games-may-2026/), [maxpowergaming](https://www.maxpowergaming.co/post/from-gardens-to-brainrot-the-most-popular-roblox-games-of-q2-2025), [Sportskeeda](https://www.sportskeeda.com/roblox-news/why-grow-garden-popular), [RoLearn](https://rolearn.dev/insights/grow-a-garden-ccu-record-analysis)
- Block Blast: [PocketGamer.biz](https://www.pocketgamer.biz/the-most-downloaded-mobile-games-of-2025), [games.gg](https://games.gg/news/top-mobile-games-of-2025-by-downloads/), [maf.ad](https://maf.ad/en/blog/block-blast/)
- Daily puzzles: [Udonis on Wordle](https://www.blog.udonis.co/mobile-marketing/mobile-games/wordle), [NBC on streaks](https://www.nbcnewyork.com/entertainment/entertainment-news/hardest-wordle-connections-games-2025/6436464/), [Ivey Business School](https://ivey.uwo.ca/hba/blog/2025/03/the-daily-puzzle-phenomenon-how-nyt-turned-games-into-a-subscription-goldmine), [Sensor Tower](https://sensortower.com/blog/2025-q3-unified-top-5-word%20puzzle%20games-revenue-us-603697f4241bc16eb8570d37)
- Retention benchmarks and mechanics: [GameAnalytics 2025 benchmarks](https://www.gameanalytics.com/reports/2025-mobile-gaming-benchmarks), [Innovecs](https://www.innovecsgames.com/blog/mobile-game-retention-benchmarks/), [GameAnalytics on idle games](https://www.gameanalytics.com/blog/how-to-keep-players-engaged-and-coming-back-to-your-idle-game), [GameAnalytics on appointment mechanics](https://www.gameanalytics.com/blog/appointment-mechanics-how-to-keep-your-players-in-game), [PocketGamer.biz on Gold & Goblins](https://www.pocketgamer.biz/deconstructing-a-100m-idle-game-what-5-years-of-gold-and-goblins-reveals-about-live-ops-and-retention/)
- Roguelite trend: [Substack: the roguelite cull](https://recognizingpatterns.substack.com/p/the-roguelite-cull-hasnt-happened), [GamesRadar](https://www.gamesradar.com/games/roguelike/subnautica-2-exec-is-tired-of-balatro-likes-says-devs-pitched-maybe-250-roguelike-deckbuilders-in-the-last-12-months/), [GamesRadar on Vampire Crawlers](https://www.gamesradar.com/games/roguelike/hope-you-saved-room-after-slay-the-spire-2-because-the-vampire-survivors-deckbuilder-is-already-overwhelmingly-positive-on-steam-after-4-000-reviews/)
- Web portals: [Poki popular](https://poki.com/en/popular), [gamebrief](https://www.gamebrief.net/blog/browser-games-complete-guide-hub), [creategame.ai](https://creategame.ai/blog/are-games-moving-to-the-web/)
- MENA: [PocketGamer.biz](https://www.pocketgamer.biz/mena-3-games-market-set-to-reach-28bn-by-2029), [meatechwatch](https://meatechwatch.com/2025/12/09/7-most-popular-video-game-genres-in-arabic-regions-as-mena-gaming-market-accelerates/), [Arabian Business](https://arabianbusiness.com/industries/technology/why-regional-localisation-matters-in-gaming), [Game Developer](https://www.gamedeveloper.com/business/why-the-arabic-market-is-your-next-target)
