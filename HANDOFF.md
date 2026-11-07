# HANDOFF — Dalbit (달빛) Korean app

## Goal
Fun, useful Korean course for the user's wife: accurate placement test, long practice that sticks, periodic
recaps, witch-cat guide 지지 in a tasteful "moonlight academy" theme, webtoons that don't look AI-made, reading
and speaking focus, optional AI through her own Claude, runs on her PC, updated online from the husband's PC.

## Done (run 1) — v1.0.0, works locally, not yet online
- App (static PWA, no build step): `app/` — map and rules in `CLAUDE.md`; design (Korean 개조식) in `DESIGN.md`
- Content: Hangul course + 12 real-life chapters, 371 items, 13 webtoon episodes (`app/content/chapters/`),
  102-item adaptive entrance exam (`app/content/placement-bank.js`)
- Engine: learning ladders + SM-2 SRS + Moonlight Recap (`app/js/engine/`), CAT placement (`placement.js`)
- Speaking: TTS + speech-recognition scoring per syllable, record-and-compare fallback, story role-play
- AI: Ask/Talk/New lesson/Real Korean via API key or free Claude.ai copy-paste (`app/js/ai/`), strict validator
- Publishing: `.github/workflows/pages.yml`, `tools/release.mjs`, `tools/build.mjs` (offline cache + icons)
- Tests: `tools/validate.mjs`, `tools/check-routes.mjs`, `tools/e2e.mjs`, `tools/test/*-sim.mjs` — all passing
- Docs for the user: `README.md` (one-time GitHub setup, installing on her PC, using Task Manager)

## Key decisions (details + reasons in NOTES.md)
- Static vanilla JS so any future session can edit without tooling; GitHub Pages for zero-cost updates.
- Own SVG art engine for stories (no generated images). Raw fetch to the Claude API (no bundler for the SDK).
- Default AI model claude-opus-5-5 (Sonnet/Haiku selectable in Settings for lower cost).

## Not verified / needs the user
- GitHub repo + Pages setup (needs his GitHub login) — README "One-time setup". Until then nothing is online.
- Real API calls, real microphone/speech recognition, PWA install on her PC, `claude.ai/new?q=` prefill.
- Placement difficulties are hand-set from TOPIK levels, not calibrated on real answers.

## Exact next step
User: follow README "One-time setup" (create GitHub repo `dalbit`, `git remote add origin …`, `git push -u origin
main`, Pages source = GitHub Actions), then open the Pages URL on her PC in Edge and install it.
Next Claude task: run `node tools/serve.mjs` + `node tools/validate.mjs`, then build what the task asks;
publish with `node tools/release.mjs "note"`. Likely next content: TOPIK 3 chapters (13+).
