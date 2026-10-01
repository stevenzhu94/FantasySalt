# 🧂 Fantasy Salt

Goofy "what if" stats for your Sleeper fantasy football league. Managers enter their Sleeper username or league ID, pick their team, and see how they stack up:

- **My Team:** actual vs. all-play record, luck, favorite victim/kryptonite, dream/nightmare schedule.
- **Salt Shakeup:** your record if you played team X every single week.
- **Schedule Swap:** your record if you'd had another team's schedule.
- **Weekly Rank / Opponent Rank:** how often you (or your opponent) finished 1st…Nth in weekly scoring.
- **Rank Breakdown:** average ranks, weeks in the top/bottom 3, and results against them.

Every view can be limited to "through week N", and past seasons are reachable from the season dropdown.

It's a static site that talks directly to the free, public [Sleeper API](https://docs.sleeper.com/), so there's no backend and no passwords. "Logging in" just remembers your league and team in the browser.

## Development

```sh
npm install
npm run dev      # local dev server
npm test         # unit tests for the stat calculations
npm run build    # static build in dist/, deployable to GitHub Pages, Netlify, etc.
```

Use the **demo league** link on the start screen to try it without a Sleeper league.

## Deployment

Every push to `master` runs the tests, builds the site, and publishes it to GitHub Pages at <https://stevenzhu94.github.io/FantasySalt/> via `.github/workflows/deploy.yml`. (One-time setup: in the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.)
