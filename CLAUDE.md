# Dalbit (달빛) — Korean course PWA for one learner

A static web app in `app/` (plain ES modules, no build step, no npm dependencies). It is hosted on GitHub Pages
and installed on the learner's PC; her progress lives only in her browser. Every push to `main` updates her copy.

## Hard rules
- **Static and dependency-free.** Plain JS modules loaded by the browser; tools in `tools/` use only Node built-ins.
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
- Webtoon episodes live inside each chapter (`episode`). Scenes: keys of `SCENES` in `app/js/art/scenes.js`
  (a scene's `behind` range is where staff stand behind its counter/table). Cast: `CAST` in `app/js/art/people.js`
  plus `me` and `jiji`.
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
