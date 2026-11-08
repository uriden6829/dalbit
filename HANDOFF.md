# HANDOFF — Dalbit (달빛) Korean app

## Goal
Fun, useful Korean course for the user's wife: accurate placement test, long practice that sticks, periodic
recaps, witch-cat guide 지지 in a tasteful "moonlight academy" theme, webtoons that don't look AI-made, reading
and speaking focus, optional AI through her own Claude, runs on her PC, updated online from the husband's PC.

## State — v1.4.0 pushed (repo github.com/uriden6829/dalbit, main; live https://uriden6829.github.io/dalbit/)
- App (static PWA, no build step): `app/` — map and rules in `CLAUDE.md`; design (Korean 개조식) in `DESIGN.md`
- Content: Hangul course + 12 chapters, 371 items, Season 1 webtoon "달빛 배달부" (13 eps), 102-item entrance exam
- v1.1.0 (task 68): freeze fix, Jiji corner, adaptive BGM, word bank, Shift breakdown, webtoon engine v2 + story
- v1.2.0-1.3.2 (task 69): studio voices (Supertonic 3, pre-rendered clips in `app/voice/`), designed character
  voices (`app/js/lib/voicecast.js`, DESIGN.md §22). Research: `../69-study-into-latest-tts-and-ai-voice-engin/NOTES.md`.
- v1.4.0 (task 70): ART ENGINE v3 — redrawn Jiji (`app/js/art/jiji.js`), constructed faces + whole-body IK rig
  (`app/js/art/toon/folk.js`), pastel harbour town / harbour / bus stop (`app/js/art/toon/vista.js`); drawing lab
  `tools/art/` (render, A/B vs git refs, CLIP + LAION aesthetic critics); method + numbers DESIGN.md §23.
  Research and lab rounds: `../70-similar-to-how-you-did-deep-research-abo/NOTES.md`.

## Rules that bite
- After ANY Korean content change: `node tools/voice/build-voice.mjs --check` (once: `cd tools/voice && npm install`).
- Art changes: look with `node tools/art/ab.mjs <set> git:HEAD app`, score with `node tools/art/bench.mjs`
  (once: `cd tools/art && npm install`). Both need `node tools/serve.mjs` running.
- The repo has no git identity: run release.mjs with GIT_AUTHOR_NAME/EMAIL + GIT_COMMITTER_NAME/EMAIL env vars
  ("Claude Task Manager <task-manager@localhost>"), `--no-push`, amend to add the Co-Authored-By trailer, then push.
- `gh` CLI is not installed; confirm a deploy by fetching `js/version.js` from the live site.

## Not verified / needs the user
- Nobody has looked at the new art or listened to the voices as a person (critics + my own render review only).
  Open question: CLIP rates the OLD simpler Jiji as more "charming" (iqa) while aesthetic score prefers the new one.
- Real microphone/speech recognition, real API calls, PWA install on her PC.

## Exact next step
Ask her what she thinks of the new Jiji and the story pictures (ep02 bakery, ep03 harbour). Tuning knobs are listed
under 관련 변수 in DESIGN.md §23 (Jiji EYE/RIM, folk.js profile/build/BUILD, vista.js WALLS/ROOFS).
