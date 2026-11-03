# Manus research run → Hall of Fame (10M+)

A one-off deep research run: Manus (in Constantin's logged-in Chrome) finds hundreds of ultra-viral posts,
Claude in Chrome re-checks each one on the post page, and the verified ones become the hub's evergreen
**Hall of Fame · 10M+** collection (pick it in the week selector). Run it from a Claude session on Constantin's
computer, in this repo, with Claude in Chrome connected.

## Ground rules for the session running this

- Only work in this repo (`evoryder8-collab/cb-viral-content-hub`). Never touch `iConstantine-Packages-v2`
  (the live iconstantine.ch website).
- In Manus: create **one** task with the brief below. Never buy credits, upgrade, change plans or settings, share
  the task, or connect Manus to other accounts. If Manus asks a question, answer it from this brief. If it runs
  out of credits, take whatever it has delivered and continue.
- On TikTok / Instagram / YouTube: read only. No likes, follows, comments, saves, messages or setting changes.
- Check on Manus every ~5 minutes; don't spam it with messages.
- Numbers on cards must come from a source: the post page you re-read (best) or Manus's report (labelled).
- If something blocks you (login wall, a permission prompt nobody can answer, a dialog), skip that item. If the
  whole run is blocked, stop and leave a note for Constantin.

## Part 1 — the brief to paste into Manus

```
Find the most viral short-form videos (TikTok, Instagram Reels, YouTube Shorts) in five niches, for a videographer who makes content for these clients. I need proven hits only, with exact links and the numbers shown on each post.

NICHES AND TARGET COUNTS (aim for roughly 300 in total):
- massage: massage therapists, head spa, lymphatic drainage, gua sha, cupping, sports/deep-tissue massage, Thai massage, ASMR massage, massage studios: 80
- gym_pt: personal trainers, PT studios, client transformations (especially over 40), trainer POV and skits, gym-owner content: 80
- dexa_biohacking: DEXA and body-composition scans, body-fat % reveals, VO2 max, biological-age tests, longevity and biohacking routines: 50
- icebath: ice baths, cold plunge, Wim Hof method, sauna + plunge: 45
- photo_video: photographers and videographers, behind the scenes vs result, phone photo hacks, transitions, client reactions: 45
Spread each niche across TikTok, Instagram and YouTube Shorts, not only TikTok.

THE BAR: at least 10,000,000 views. If the platform hides views (often Instagram), at least 1,000,000 likes.

RULES:
1. Open each post and copy the numbers exactly as the post page shows them. Never estimate, never use numbers from a list article without opening the post.
2. Give the exact post URL (tiktok.com/@user/video/…, instagram.com/reel/…, youtube.com/shorts/…), not a profile or an article.
3. One row per post, no duplicates. Skip posts you can't open.
4. Prefer posts whose idea a massage studio, PT gym, DEXA/biohacking clinic, ice-bath studio or photographer could copy.

DELIVER a CSV file named manus-viral-hall-of-fame.csv with exactly these columns:
niche, platform, url, creator_handle, creator_name, views, likes, comments, posted_date, checked_on, caption_or_title, short_title, hook_first_line, first_3_seconds, hook_types, format_formula, why_it_worked, how_to_repeat, camera, asmr, editing, transitions, audio, length_s

Column notes:
- niche: one of massage, gym_pt, dexa_biohacking, icebath, photo_video
- views/likes/comments: as shown on the post (e.g. 12.4M, 980K); leave empty if not shown
- posted_date and checked_on: YYYY-MM-DD
- short_title: under 70 characters, what happens in the video
- hook_types: up to 3 of pattern_interrupt, curiosity_gap, negative_warning, contrarian, pov, stitch_duet, green_screen_react, asmr_sensory, before_after_reveal, transformation, myth_bust, listicle, question, storytime, challenge_day_x, behind_the_scenes, satisfying_process, shock_stat, authority_credential, relatable_pain, humor_skit, comment_reply, tutorial_howto, price_value_reveal, test_experiment, reaction_face, social_proof_testimonial, us_vs_them, visual_spectacle, loop (separate with ;)
- camera: iphone, pro_camera, mixed or unknown; asmr: yes, no or partial; editing: raw, light or heavy; audio: trending_sound, original_voice, voiceover, natural_sound or music
If you run short of time or credits, deliver the CSV with what you have verified so far.
```

## Part 2 — after Manus delivers

1. Download the CSV (it lands in `~/Downloads`). If Manus only shows a table, copy it into a CSV file with the same
   columns.
2. Convert it (drops rows without an exact link, below the bar, or already in the hub):
   ```bash
   python3 scripts/import_manus_csv.py ~/Downloads/manus-viral-hall-of-fame.csv --out /tmp/manus-findings.json
   ```
3. **Re-check every kept row in Chrome:** open its `url` and read the numbers on the post page.
   - Matches the bar → set `views`/`likes`/`comments` to what the page shows, `stats_quote` to
     `"Read on the post page on YYYY-MM-DD: <numbers as shown>"`, `evidence_strength` to `"high"`.
   - Below the bar, different video, removed or private → delete the row.
   - Short on time: re-check at least the 60 biggest and every massage / gym_pt / dexa_biohacking row; the rest
     keep their "Reported by Manus" label and `evidence_strength: "medium"`.
4. For each row set `scores.relatability` and `scores.relevancy` (0–100, rubric in `RESEARCH_PLAYBOOK.md`),
   `effort` (low / medium / high), and tidy `title_short`.
5. Merge into the collection (creates it on the first run):
   ```bash
   python3 scripts/apply_browser_findings.py --week hall-of-fame --create-collection "Hall of Fame · 10M+" /tmp/manus-findings.json
   ```
   It must end with `0 error(s)`. Then edit `data/weeks/hall-of-fame.json`: a `headline`, a two-sentence `lede`
   with real numbers, and `picks` = the 12 strongest ids (at least 3 massage and 3 gym_pt/dexa_biohacking).
6. Smoke-test: `python3 -m http.server 8765`, open http://localhost:8765, choose **Hall of Fame · 10M+** in the
   week selector, check the leaderboards and the platform filter.
7. Commit only `data/` ("Hub: Hall of Fame 10M+ from Manus, re-checked in Chrome") and push to `main`. The
   **CB Hub covers** Action adds covers a few minutes later; GitHub Pages republishes
   https://evoryder8-collab.github.io/cb-viral-content-hub/ by itself.
8. Leave Constantin a short summary: rows Manus delivered, kept, re-checked, dropped (and why), per niche and
   platform, and the live link.
