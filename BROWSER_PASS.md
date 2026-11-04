# Browser pass with Claude in Chrome

A check-and-fill pass over the latest weekly drop, run from a Claude session **on Constantin's own computer**
with the Claude in Chrome extension connected (a cloud session cannot reach Chrome). It does what web search
cannot: read real numbers on the post pages, find exact Instagram links, and add top Instagram/YouTube hits.

## Rules

- **Read only.** Don't like, follow, comment, save, message, log in or out, or change any setting. Open new tabs
  and close them when done. If a site asks for permission in the extension, wait for Constantin to allow it.
- **Numbers come from the page you are looking at**, copied as shown ("1.2M views · 89K likes"). Never estimate.
  If a post shows no view count (Instagram often hides it), record likes and comments only.
- **The viral bar:** new references need **≥1M views, or ≥100K likes** when views aren't shown.
- Keep it to these sites: tiktok.com, instagram.com, youtube.com, and the URLs already in the data.
- Stop and ask if a page keeps failing to load, a login wall blocks everything, or a dialog appears.

## Steps

1. In the repo `evoryder8-collab/cb-viral-content-hub` (local copy `~/Downloads/cb-viral-content-hub`), run
   `git pull` on branch `main`. All paths below are relative to the repo root. The latest week is `latest` in
   `data/manifest.json`.
2. **Verify the leaderboards.** For every reference in that week that clears the bar (and every pick), open
   its `url`. Note the current views/likes/comments, or `removed: true` if it's gone or private.
3. **Find exact links.** For references with `url_is_exact_post: false` (all Instagram ones first), open the
   creator's profile or search the platform for the post described in `title`/`hook`. When you find it, note
   the exact URL and its numbers. If you can't find it within a couple of minutes, skip it.
4. **Add top Instagram and YouTube hits.** On Instagram (search, hashtag pages such as #massagetherapist,
   #headspa, #personaltrainer, #pttransformation, #dexascan, #bodycomposition, #icebath, #coldplunge,
   #behindthescenes) and YouTube Shorts (search, sorted by view count), find **4–6 per platform** for the
   priority niches (massage, PT gyms, DEXA/biohacking) that clear the bar and aren't in the week yet. For each,
   record a full research entry (schema in `RESEARCH_PLAYBOOK.md`) with `title_short`, `scores` and `effort`.
5. Write everything into `findings.json` (format at the top of `scripts/apply_browser_findings.py`), then:
   ```bash
   python3 scripts/apply_browser_findings.py --week <latest week> findings.json
   ```
   It must end with `0 error(s)`. Don't commit `findings.json`.
6. Commit `data/` with the message "Hub: browser-verified numbers and links" and push to `main`. The
   **CB Hub covers** GitHub Action then downloads covers for the new exact links; wait for its commit and
   `git pull`.
7. Rebuild and republish the private preview:
   ```bash
   python3 scripts/build_single_file.py /tmp/cb-hub/cb-viral-content-hub.html
   ```
   Then, with the Artifact tool: `read` https://claude.ai/artifact/XQ77wuLX6A8PBSugspkPqy, and publish the built
   file to that same `url`, passing the covers in `thumbs/` as `files` (map printed in
   `cb-viral-content-hub.html.files.json`).
8. Report: references verified, numbers changed, posts removed, exact links found, new hits per platform.

## Inbox: posts Constantin sends in

`data/inbox.json` lists posts Constantin asked to add (`status: "pending"`). The CB Hub covers Action reads each
one's public link preview into `meta` (caption, likes/comments text, preview image) when it can. For every
pending item:

1. Open the post in Chrome and read its numbers and content (fall back to `meta` only if the page won't load,
   and label the quote "From the post's link preview, fetched YYYY-MM-DD").
2. Write a full entry (research schema in `RESEARCH_PLAYBOOK.md`, plus `title_short`, `scores`, `effort`) and
   merge it with `scripts/apply_browser_findings.py`: into `hall-of-fame` if it clears 10M views (1M likes
   when views are hidden), otherwise into the latest week. Constantin's picks are never dropped for being
   below the bar; they go into the latest week's "below the viral bar" list if they're small.
3. Set the item's `status` to `"added"` with the `id` it got, or `"skipped"` with a reason. Commit `data/`.
