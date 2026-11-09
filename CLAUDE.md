# CB Viral Content Hub: rules for every Claude session

This repo is Constantin Barbu's hook and viral-reference browser, live at
https://evoryder8-collab.github.io/cb-viral-content-hub/ (GitHub Pages from `main`; every push republishes it).
Procedures: `RESEARCH_PLAYBOOK.md` (Monday drop), `BROWSER_PASS.md` (Claude in Chrome), `MANUS_BRIEF.md` (Manus run).

## Never

- Never touch `evoryder8-collab/iConstantine-Packages-v2`. It is Constantin's live brand website (iconstantine.ch).
- Never invent a number, a post, a creator or a quote. Every views/likes/comments figure needs `stats.quote` and
  `stats.source_url`; unknown stays `null`. Constantin's own reading of a post is a valid source: label it
  "Reported by Constantin from the post, <date>" and set `stats.user_reported: true` so it gets replaced by the
  exact count when a page shows one.
- Never describe a video you haven't watched as if you had. Descriptions built from the caption and cover say so.

## Rule: every link Constantin sends gets the full evaluation

Whenever Constantin sends a post link (Instagram, TikTok, YouTube…), in any session, run all of this. Don't ask
whether to; don't stop at "queued".

1. **Inbox.** Add it to `data/inbox.json`: clean URL (no `?…` tracking), `added` date, `added_by: "Constantin"`,
   `status: "pending"`, and his own words about it if he gave any (`described_by_constantin`).
2. **Read the post.** With Claude in Chrome, open the post and read caption, numbers and what happens. In a cloud
   session, push the inbox change: the **CB Hub covers** Action reads the post's public embed page (caption, likes,
   comments, cover → `meta`) and the creator's follower count (`data/creators.json`). Wait for its commit
   (poll `git ls-remote` in a background command), then pull.
3. **Build the full entry** (same fields as the other videos): niche, short title, creator, exact URL, stats with
   quote/source/date, hook (verbatim line + what happens), formula, why it worked, production, `replicate`,
   a `remix` for all five niches (massage, gym_pt, dexa_biohacking, icebath, photo_video), `scores.relatability`
   and `scores.relevancy` (rubric in `RESEARCH_PLAYBOOK.md`), `effort`, the visual `guide` (format checked by
   `scripts/validate.py`; from the video when watched, otherwise from cover and caption), `pick: true`,
   `added_by: "Constantin"`, and the cover as `thumbs/<id>.jpg`.
4. **File it** in the **All-time favourites** collection (`data/weeks/my-picks.json`, no viral bar). If it also
   clears 10M views or 1M likes, add it to the Hall of Fame (`hall-of-fame.json`) too. Set the inbox item to
   `status: "added"` with its `id`.
5. **Check:** `python3 scripts/validate.py` → 0 errors; load the app (`python3 -m http.server`, Playwright) and
   confirm the card, cover, scores and detail sheet render. Its Virality must follow the scale below.
6. **Ship and report:** commit, push to `main`, and send Constantin a screenshot of All-time favourites plus a short
   line per new card (likes, Virality, breakout, what makes it work).

**Lessons.** When Constantin says a reel teaches an idea rather than being a video to copy (e.g. a strategy
breakdown), still run all six steps, plus: set `lesson: true` (the card shows a "Lesson" label), write the hook,
formula, guide and remixes about *applying the idea* in each niche, not about recreating that video, and add or
update the matching entry in the **Formats** library (`data/library.json` → `formats`) with this reel as its example.
Link the cards in the hub that prove the idea by giving them the format's key as `format_key`.

## Scoring (shown on every card)

- **Virality** (computed in `assets/hub.js`, never hand-set): Constantin's scale. **20K likes = 90**, 20K–100K =
  90–96, **100K+ likes = 97+** (99 at 10M), below 20K smoothly lower (1K ≈ 49, 5K ≈ 70). Views-only posts count each
  view as 0.04 likes. No numbers, no score.
- **Breakout** (context on each sheet): likes + comments ÷ (followers × platform median engagement: 0.30% Instagram,
  2.01% TikTok, Rival IQ 2026). Needs `data/creators.json`.
- **Relatable / Relevant**: editorial, 0–100, rubric in `RESEARCH_PLAYBOOK.md`. Massage and PT gyms/DEXA weigh most.
- **Leaderboards (viral bar):** ≥1M views or ≥100K likes, or a niche breakout (20× normal with 20K+ likes).
  Collections with `"bar": false` (All-time favourites) show everything.

## Shipping

Work on `main`. Run `python3 scripts/validate.py` before every commit. After changing `assets/hub.css` or `assets/hub.js`, run
`python3 scripts/stamp_assets.py` (phones otherwise keep the old files; validate.py fails on a stale stamp). The covers Action commits covers,
inbox reads and follower counts after pushes that touch `data/weeks/**` or `data/inbox.json`; pull before pushing.
