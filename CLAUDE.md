# Dalbit (달빛) — Korean course PWA for one learner

A static web app in `app/` (plain ES modules, no build step, no npm dependencies). It is hosted on GitHub Pages
and installed on the learner's PC; her progress lives only in her browser. Every push to `main` updates her copy.

## Hard rules
- **Static and dependency-free.** Plain JS modules loaded by the browser; tools in `tools/` use only Node built-ins
  (exception: the dev-only voice builder in `tools/voice/`, which needs onnxruntime-node).
- **Text is data.** Render all text with `h()` from `app/js/lib/dom.js` (textContent). `trustedHTML` / `svg()` take
  only markup built in `app/js/art/`. Content from the AI, the web or a pasted reply goes through
  `app/js/ai/safety.js` `validatePack()` before it is stored or shown.
- **Network allow-list** is the CSP in `app/index.html` (self, Google Fonts, api.anthropic.com). A feature that
  needs another origin changes the CSP deliberately and says why in NOTES.md.
- **Her data stays hers.** No analytics, no remote logging. The API key lives in localStorage only and is never
  in backups (`store.js` keeps it out of state).
- **Relative paths and hash routes** (`#/home`) — the site is served from a sub-path on GitHub Pages.
- **Progress keys are item IDs** (`w:<ko>`, `p:<ko>`, `h:<letter>`, `g:<id>`). Renaming an item's Korean text or
  grammar id resets her progress on it; fix a typo in `en`/`hint` freely, but add `#tag` keys instead of renaming.

## Where things are
- Course content: `app/content/chapters/*.js`, registered in order in `app/content/index.js`. The row format is
  documented at the top of `app/content/dsl.js`; copy an existing chapter as the template.
- Webtoon: Season 1 "달빛 배달부" is ONE continuous story in `app/content/story/season1.js` (one episode per chapter,
  attached in `content/index.js`). Art engine v2 in `app/js/art/toon/`: `folk.js` (characters, moods, poses — FOLK),
  `vista.js` (painted scenes — VISTAS), `compose.js` (shots, props, effects, panel → SVG). Bubbles are HTML in the
  gutter (`ui/stories.js`). Draw/review: `node tools/toon.mjs sheet epNN` (look at it), `critique all`, `lab cast|moods|scenes`;
  dev page `app/toonlab.html`. Old flat engine (`art/scenes.js`, `people.js`, `panel.js`) is kept for AI-made packs.
- Dictionary for Shift breakdown + word bank: `app/js/lib/morph.js` (generates conjugations/particles), extra words in
  `app/content/lexicon.js`. New story/lesson Korean must be covered: `node tools/lexcheck.mjs` (validate fails otherwise).
- Voice: STUDIO voices first — every course line is pre-rendered with Supertonic 3 (10 neural voices) into
  `app/voice/clips/*.ogg` + manifest `app/voice/index.json`; casting (who speaks what, speeds) in
  `app/js/lib/voicecast.js`, shared by the app and the builder. Story characters have DESIGNED voices there (preset blends +
  speed + semitone shift; rationale and measurements in DESIGN.md §22) — a new character gets its own entry, checked
  so it does not sound like anyone it shares an episode with. **After changing any Korean content run
  `node tools/voice/build-voice.mjs --check`** (once: `cd tools/voice && npm install`; the model downloads to the
  git-ignored `tools/voice/.models/`). It renders only new/changed lines and deletes unused clips; validate warns
  about lines without a clip (they fall back to the browser voice). `tools/voice/` is the ONE place with npm deps
  (dev-only, never shipped). Numbers are read via `tools/voice/korean-numbers.mjs`. Playback test:
  `node tools/test/voice-play.mjs`. A two-person example conversation is written one turn per line
  (`'질문?\n대답.'`) and is read by two voices (voicecast `dialogueTurns`). Audio that plays when a question appears
  uses `speakSoon()` (cancelled if she answers first); answering, the next question and every route change stop the
  old line. Browser voice fallback + slow + PERSONAS: `app/js/lib/speech.js`. Music: `app/js/lib/bgm.js` +
  Live Studio runtime in `app/vendor/`; presets built by `node tools/build-bgm.mjs` (do not edit bgm-presets.js by hand).
- Jiji in the corner: `app/js/ui/companion.js`; word tools: `ui/wordtools.js`; word bank screen: `ui/wordbank.js`.
  Screens talk to them through `app/js/lib/bus.js` events (route, exercise, answer, session-end, story, tts, mic).
- Entrance-exam items: `app/content/placement-bank.js` (correct option first; level → difficulty table at top).
- Jiji's voice lines: `app/content/jiji-lines.js` — dry, kind, short; a cat, not a cheerleader.
- Screens: one file per route in `app/js/ui/`; routes are registered in `app/js/main.js`.
- Design rationale (Korean, 개조식): `DESIGN.md`. Working memory for tasks: `NOTES.md`.

## Style of the product
Pretty and calm, never tacky: parchment/ink-blue palette from CSS variables in `app/css/app.css`, serif display
type, gold used sparingly, picture-book flat SVG art with no outlines. Korean must be natural and correct
(polite 해요체 unless the scene calls for otherwise). Long practice beats short quizzes: new items climb a ladder
of several exercise types (`LADDER` in `app/js/engine/exercises.js`) before they graduate.

## Verify every change
1. `node tools/validate.mjs` — content, exercises, sessions, placement bank, safety filter. Must end `content OK`.
2. `node tools/serve.mjs` (keep running), then `node tools/check-routes.mjs` — every screen renders without
   runtime errors (add new routes to its list) — and `node tools/e2e.mjs` — whole sessions, the exam and the
   entrance test play through to their summary in a real headless browser.
3. For visual work: `node tools/shot.mjs "/?demo=1&nosw#/story/ep02" shot.png 900 2400` and look at the image
   (`LIGHT=1` for the parchment theme). `?demo=1` seeds a demo learner in the throwaway browser profile.
4. Engine changes: `node tools/test/session-sim.mjs <lessonId>` and `node tools/test/placement-sim.mjs`.

## Publish to her PC
When the task asks to publish, ship or update her version: `node tools/release.mjs "note she will read"`
(add `--minor` for new chapters). It validates, bumps `app/js/version.js` + changelog (she sees the notes once),
stamps the offline cache, commits and pushes; GitHub Actions deploys. Without a git remote it commits locally
and says so — the one-time GitHub setup is in README.md. When the task does not ask to publish, end your summary
with the release command to run.
