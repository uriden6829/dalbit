# HANDOFF — Dalbit (달빛) Korean app

## Goal
Fun, useful Korean course for the user's wife: accurate placement test, long practice that sticks, periodic
recaps, witch-cat guide 지지 in a tasteful "moonlight academy" theme, webtoons that don't look AI-made, reading
and speaking focus, optional AI through her own Claude, runs on her PC, updated online from the husband's PC.

## State — v1.2.0 LIVE at https://uriden6829.github.io/dalbit/ (repo github.com/uriden6829/dalbit, main)
- App (static PWA, no build step): `app/` — map and rules in `CLAUDE.md`; design (Korean 개조식) in `DESIGN.md`
- Content: Hangul course + 12 chapters, 371 items, Season 1 webtoon "달빛 배달부" (13 eps), 102-item entrance exam
- v1.1.0 (task 68): freeze fix, Jiji corner, adaptive BGM, word bank, Shift breakdown, new webtoon engine + story
- v1.2.0 (task 69): STUDIO VOICES — every course line pre-rendered with Supertonic 3 (10 neural voices) into
  `app/voice/` (3999 Ogg Opus clips, 18 MB, cached per clip by the service worker); casting in
  `app/js/lib/voicecast.js`; builder `tools/voice/` (dev-only npm deps); browser voice = fallback + Settings switch.
  Research, 7 measured build iterations and numbers: `../69-study-into-latest-tts-and-ai-voice-engin/NOTES.md`.

## Rules that bite
- After ANY Korean content change: `node tools/voice/build-voice.mjs --check` (once: `cd tools/voice && npm install`;
  model downloads to git-ignored `tools/voice/.models/`). validate warns about lines without clips.
- The repo has no git identity: run release.mjs with GIT_AUTHOR_NAME/EMAIL + GIT_COMMITTER_NAME/EMAIL env vars
  (Task Manager used "Claude Task Manager <task-manager@localhost>").
- `gh` CLI is not installed; confirm a deploy by fetching `js/version.js` from the live site.

## Not verified / needs the user
- Nobody has listened to the studio voices by ear (all checks are Whisper read-back + signal stats). Ask her
  which characters' voices she likes; casting is one table in voicecast.js (CAST), then re-run the builder.
- Real microphone/speech recognition, real API calls, PWA install on her PC.

## Exact next step
Get her feedback on v1.2.0 voices (natural enough? slow speed right? any character mis-cast?).
Verify any change with: validate → serve.mjs → check-routes → e2e → test/voice-play.mjs; publish with release.mjs.
