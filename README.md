# CB Viral Content Hub

A calm, searchable browser of proven hooks, formats and viral references for short-form content
(reels, TikToks, Shorts, carousels) in five niches:

1. **Massage therapists**
2. **PT-led gyms** (personal training memberships, PT packages)
3. **DEXA scans & biohacking**
4. **Ice baths / Wim Hof / cold plunge**
5. **Photographers & videographers**

A new weekly drop lands every Monday morning (Zurich time). The procedure is in
[`RESEARCH_PLAYBOOK.md`](RESEARCH_PLAYBOOK.md).

## What's inside

| Section | What it does |
|---|---|
| **This week** | The week's thesis, 3 moves, 12 ranked top picks (glass cards with platform, views, likes and three scores), trends and new hooks. |
| **Hooks** | Fill-in-the-blank hook templates from real posts, filterable by type, with a roulette, copy button and sources. |
| **Formats** | Proven video structures (pattern interrupt, stitch, POV, before/after…) with a shooting recipe, plus carousel formulas. |
| **Craft** | iPhone vs pro camera, ASMR or not, heavy edits or raw, a format × element matrix, platform algorithm facts, how scores work. |
| **Pre-flight** | A weighted checklist that scores a post's viral readiness before it goes out. |
| **Saved** | Bookmarked references and hooks (stored in the browser). |

Each reference opens a detail sheet with the source quote for every number, the hook, beat-by-beat structure,
how it was shot, how to repeat it, a remix for each niche, and a **Copy shoot brief** button for clients or editors.

## Scores

- **Virality**: computed from public numbers only (views on a log scale plus like-rate; likes when views are private).
- **Relatability** and **Relevancy**: editorial ratings, explained in the app under *Craft → How scores work*.

## Run locally

```bash
cd cb-viral-content-hub
python3 -m http.server 8765
```

Then open http://localhost:8765. Opening `index.html` straight from disk won't load the data, so use a server.

## Files

```
index.html                 page shell
assets/hub.css             liquid-glass design system (light + dark)
assets/hub.js              app (vanilla JS, no build step)
data/manifest.json         list of weekly drops
data/library.json          hooks, formats, production verdicts, algorithm facts, checklist (grows weekly)
data/weeks/YYYY-MM-DD.json one weekly drop: thesis, moves, picks, references, trends
scripts/import_research.py research JSON → weekly drop
scripts/validate.py        data checks (no unsourced numbers, valid ids, scores 0–100)
scripts/build_single_file.py  one self-contained HTML file (for private previews)
```

The page carries `noindex, nofollow`. If this folder is merged into the main branch of the iconstantine.ch site,
it will be reachable (unlisted) at `iconstantine.ch/cb-viral-content-hub/`.
