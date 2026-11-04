# CB Viral Content Hub — weekly research playbook

This is the standing procedure for the weekly drop. It runs every **Sunday night → Monday morning (Europe/Zurich)**,
either as a scheduled Claude session or by hand. Follow it top to bottom.

Work in the repo `evoryder8-collab/cb-viral-content-hub` (public), branch `main`. Pushing to `main`
republishes the live hub at https://evoryder8-collab.github.io/cb-viral-content-hub/. All paths and commands
below are relative to the repo root.

## 0. The rules that never change

1. **No invented ideas.** Every reference must be a real post by a real creator, and every hook a line that
   was actually used (or a documented platform convention). Adapting a proven formula to a niche is fine and is
   labelled as a remix.
2. **No invented numbers.** A views/likes/comments number appears only if it is in a source. Paste the source
   snippet into `stats.quote` and the page into `stats.source_url`. Use `qualifier: "~"` for "about" and
   `"+"` for "over/more than". No source → `null`. `scripts/validate.py` enforces this.
3. **Priority of niches:** massage therapists and PT-led gyms (membership = personal training, PT packages,
   DEXA scans, biohacking) first; then DEXA/biohacking on its own; then ice baths / Wim Hof; then
   photographers & videographers.
4. **Health and safety:** no medical claims (DEXA, biological-age tests, cold exposure, lymphatic drainage).
   Flag risky formats in `notes` and in the remix text.
5. **The viral bar:** the home leaderboards only show references with **≥1M views, or ≥100K likes when views
   are private**. Research for that bar; smaller posts go into a collapsed "below the viral bar" list and are
   only worth adding for an unusually useful formula. Cover every platform (TikTok, Instagram, YouTube): the
   leaderboards rank each one separately.
6. Prefer posts from the **last 4–8 weeks**. Evergreen mega-hits are allowed when they teach a reusable formula.
7. Never repeat a video that is already in an earlier week unless its numbers changed materially.
8. **Blocked creators:** never add @vladimirshmondenko (the "Anatoly" gym-cleaner pranks). His views come from his
   strength, not from a format a client can copy. The list is `BLOCKED_CREATORS` in `scripts/import_research.py`
   (mirrored in `scripts/validate.py`, which fails on any video from it). `BLOCKED_NAMES` also catches him by
   creator name or title when the handle is missing.
9. **Every video gets a visual guide** (`guide`, see below). The detail sheet shows it instead of the paragraphs;
   the paragraphs stay under "Full research notes".

## 1. Research (parallel, one agent per niche + one for science)

Write one JSON file per niche into a scratch folder, e.g. `research/2026-11-09/`:
`massage.json`, `gym_pt.json`, `dexa_biohacking.json`, `icebath.json`, `photo_video.json`, and optionally
`science.json` (only when platform rules or production evidence changed).

Network note: inside Claude cloud sessions only web search works by default (TikTok/Instagram/YouTube pages
are blocked unless those domains are allowed in the environment's network settings). Search snippets often
carry stats, e.g. `"1.2M Likes, 3,400 Comments. TikTok video from @handle"`. The search budget is shared by all
agents in one turn (~200 searches), so give each agent 25–35 searches and keep the brief tight.

### Niche file schema

```json
{
  "niche": "massage",
  "researched_on": "YYYY-MM-DD",
  "videos": [{
    "title": "", "creator_handle": "@handle", "creator_name": "", "creator_followers": null,
    "platform": "tiktok|instagram|youtube|facebook|x", "content_type": "reel|tiktok|short|carousel",
    "url": "", "url_is_exact_post": true,
    "views": null, "likes": null, "comments": null, "shares_or_saves": null,
    "stats_quote": "exact snippet with the numbers", "stats_source_url": "", "stats_reported_date": "YYYY-MM",
    "posted_date": "YYYY-MM", "adjacent": false,
    "hook_verbatim": null, "hook_summary": "what happens in the first 1–3 s",
    "hook_types": ["pattern_interrupt"],
    "format_formula": "one-line repeatable structure",
    "beats": ["0-2s …", "2-8s …", "end …"],
    "why_it_worked": "",
    "production": {"camera": "iphone|pro_camera|mixed|unknown", "asmr": "yes|no|partial", "editing": "raw|light|heavy",
                   "transitions_or_vfx": "", "captions_on_screen": true, "audio": "trending_sound|original_voice|voiceover|natural_sound|music",
                   "approx_length_s": null, "faces": "creator_on_camera|client_only|hands_only|none"},
    "replication_notes": "shot list for this niche",
    "evidence_strength": "high|medium|low"
  }],
  "hooks": [{"template": "fill-in [slots]", "example_verbatim": "", "example_creator": "", "source_url": "",
             "hook_types": [], "delivery": "text_on_screen|spoken|visual_only|combo", "evidence": ""}],
  "carousels": [{"slide1_hook": "", "structure": "", "example_creator": "", "source_url": "", "evidence": ""}],
  "trends_now": [{"trend": "", "evidence": "", "source_url": "", "date": "YYYY-MM"}],
  "production_insights": ["finding + source URL"],
  "notes": "caveats"
}
```

Beats that are guessed from captions start with `Inferred:`; the importer strips the word and the app shows a
"not frame-checked" note.

### Visual guide (`guide` on each video)

The detail sheet draws "Formula", "Why it worked", "How it was shot" and "Repeat it" as a storyboard, icon
points, spec tiles and numbered steps. Keep every line short enough to read at a glance:

```json
"guide": {
  "story": [{"t": "0–2s", "icon": "text", "do": "Husband in the chair, 'I took my husband…'"}, … 3–4 frames, hook first, payoff last],
  "why":   [{"icon": "face", "says": "His face is the show, not the spa"}, … 2–3],
  "shot":  {"camera": "iPhone, vertical", "angle": "…", "light": "…", "sound": "…", "text": "…", "edit": "…", "length": "…", "people": "…"},
  "steps": [{"icon": "people", "do": "Book a couple or two friends", "tip": "Get a signed model release"}, … 3–5],
  "avoid": "optional one-line warning"
}
```

Word limits: story 8, why 8, shot values 5, steps 9, tips 7, avoid 8. `story`, `why` and `shot` describe the
original video only (omit unknown shot keys); `steps` are the copy-it instructions. Icons are the keys of `GI` in
`assets/hub.js` (`GUIDE_ICONS` in `scripts/validate.py`).

Hook-type keys: `pattern_interrupt, curiosity_gap, negative_warning, contrarian, pov, stitch_duet,
green_screen_react, asmr_sensory, before_after_reveal, transformation, myth_bust, listicle, question, storytime,
challenge_day_x, behind_the_scenes, satisfying_process, shock_stat, authority_credential, relatable_pain,
humor_skit, comment_reply, tutorial_howto, price_value_reveal, test_experiment, reaction_face,
social_proof_testimonial, us_vs_them, visual_spectacle, loop`.

### Science file schema (optional)

`formats[]`, `algorithm_facts[]`, `production_factors[]`, `carousel_science[]`, `hooks[]`,
`preflight_checklist[]` — see `scripts/import_research.py → merge_science()` for the exact fields. Items are
upserted by key/text, so only send what changed.

### Where to look each week

- Search phrases per niche: "[niche] TikTok million likes [month year]", "viral [treatment] video",
  "[niche] reel went viral", "TikTok discover [topic]", plus creator handles already in the hub (check their
  newest posts).
- Massage: head spa, lymphatic drainage, knot release, gua sha/IASTM, cupping, Thai/Ashiatsu, scalp ASMR,
  massage championships, massage-business marketing (local search, red flags, booking).
- PT gyms: PT-only studios (Ultimate Performance-style), over-40 transformations, gym-owner skits,
  trainer POV, women's strength, beginner reassurance, PT pricing/value.
- DEXA & biohacking: DEXA/InBody reveals, VO2 max, biological-age tests, CGM graphs, red light, sauna,
  longevity clinics, full-body MRI.
- Ice baths: first-timer and stranger reactions, day-X series, bathhouse/social-wellness clubs, Wim Hof Method.
- Photo & video: BTS vs result, phone hacks, stranger portraits, event/sports BTS, director moments.
- Platform news: Instagram (@mosseri), TikTok Newsroom, YouTube Shorts updates, Social Media Today.

## 1b. Inbox

Before curating, handle every `status: "pending"` item in `data/inbox.json` (posts Constantin sent in) as
described in `BROWSER_PASS.md` → "Inbox". In a cloud session you can't open the post, so use the `meta` the
Action read from the link preview; if there is no `meta` yet, leave the item pending.

## 2. Curate (overlay file)

Run `python3 scripts/import_research.py --week YYYY-MM-DD --research research/YYYY-MM-DD --list` to see the
generated video ids, then write `research/YYYY-MM-DD/overlay.json`:

```json
{
  "headline": "One-sentence thesis of the week",
  "headline_html": "Same, with <em>two</em> words emphasised",
  "lede": "Two sentences with the numbers that prove it.",
  "moves": [{"niche": "massage", "title": "Imperative, 3–6 words", "text": "Why + what to do", "ref": "<video id>"}],
  "picks": ["<12 video ids in ranked order: at least 3 massage, 3 PT/DEXA>"],
  "drop": ["<off-target or weak video ids>"],
  "videos": {
    "<video id>": {"title": "Short card title", "effort": "low|medium|high",
                    "scores": {"relatability": 0, "relevancy": 0},
                    "stats": {"qualifier": "~"},
                    "remix": {"massage": "", "gym_pt": "", "dexa_biohacking": "", "icebath": "", "photo_video": ""}}
  },
  "library_set": {}
}
```

Scoring (0–100):
- **Virality** is computed by the app from the public numbers. Don't set it.
- **Relatability**: how universal the feeling in the hook is, whether a viewer sees themselves in the first
  2 seconds, whether people would send it to someone. 90+ = everyone has felt this.
- **Relevancy**: how directly the formula transfers to the client niches, weighted by priority, and whether it
  can be shot without special access or budget. 90+ = a massage studio or PT gym could shoot it this week.

Every pick gets a `remix` for all five niches (one or two sentences each, faithful to the original formula,
Swiss context welcome: CHF prices, Zurich/Swiss locations, German/French captions).

## 3. Build, check, publish

From the repo root:

```bash
python3 scripts/import_research.py --week YYYY-MM-DD --research research/YYYY-MM-DD --overlay research/YYYY-MM-DD/overlay.json
python3 scripts/validate.py            # must print 0 error(s)
python3 -m http.server 8765            # optional: eyeball http://localhost:8765
python3 scripts/build_single_file.py   # optional: dist/cb-viral-content-hub.html for the private preview
git add data && git commit -m "Hub: weekly drop YYYY-MM-DD" && git push   # to main
```

Real covers: every reference needs its EXACT post URL (`url_is_exact_post: true`), otherwise no cover can be
fetched. Covers are downloaded on GitHub's servers by the **CB Hub covers** workflow
(`.github/workflows/cb-hub-covers.yml`), which runs `scripts/fetch_thumbs.py` whenever week data is pushed and
commits new files to `thumbs/`. After pushing a drop, wait for that commit (`git fetch` until `main` moves,
up to ~10 minutes; check the Actions tab if it doesn't), `git pull`, then build the preview. When publishing
the private preview, pass the map in `<output>.files.json` as the Artifact tool's `files`. Cards without a
cover fall back to the designed poster.

Keep the raw research files out of the repo (they are large and contain unverified snippets); the week file
holds everything the app needs.
