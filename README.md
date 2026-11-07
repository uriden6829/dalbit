# 달빛 · Moonlight Korean

A cosy Korean course for one learner, guided by 지지 (Jiji), a black cat in a witch's hat.
Hangul from zero → 12 real-life chapters (café, subway, restaurant, family dinner, market, pharmacy, phone…),
an adaptive entrance exam, long spaced-repetition practice, hand-drawn-style webtoon episodes for every chapter,
speaking practice with pronunciation feedback, and optional AI help through her own Claude account.

It is a static web app (`app/`): no installs, no server, works offline once opened. Progress is stored in her browser.

---

## Try it on this PC

```
node tools/serve.mjs
```
Open http://localhost:5173 in Microsoft Edge. (Edge has the best Korean voices; Chrome works too.)

## One-time setup: put it online for her PC (≈10 minutes)

The app is published with **GitHub Pages**. After this, every update you make from this PC reaches her
automatically the next time she opens the app with internet.

1. Create a free account at github.com (if you don't have one) and make a **new repository** named `dalbit`.
   Choose **Public** (free GitHub Pages needs a public repo; the repo contains only course material — her name and
   progress never leave her PC). Don't add a README there.
2. In this folder, connect and push (Git will ask you to sign in to GitHub once):
   ```
   git remote add origin https://github.com/<your-username>/dalbit.git
   git push -u origin main
   ```
3. On GitHub: repository → **Settings → Pages → Source: GitHub Actions**. The included workflow
   (`.github/workflows/pages.yml`) checks the content and publishes `app/`. After a minute the site is at
   `https://<your-username>.github.io/dalbit/`.

> Prefer a private repo? Use Cloudflare Pages or Netlify (both free with private repos): point them at this repo,
> no build command, output folder `app`.

## Install on her PC

1. On her PC, open the site address in **Microsoft Edge**.
2. Click the **App available / Install** icon at the right end of the address bar (or menu **⋯ → Apps → Install
   this site as an app**). 달빛 now has its own window, Start-menu entry and taskbar icon, and works offline.
3. First launch: Jiji introduces the academy and offers the entrance exam (≈8–10 minutes, adapts to her answers).
4. Speaking practice uses the microphone: allow it when Edge asks.
5. Settings → Your progress → **Download backup** now and then (small file; restores on any PC).

### Optional: Jiji's AI help
Settings → *Jiji's magic*:
- **Free Claude.ai** — works with her free claude.ai account. Jiji prepares the message and opens Claude.ai;
  for new lessons she pastes Claude's answer back, and Jiji checks it before adding it.
- **API key** — fully automatic inside the app (questions, conversation practice, custom lessons and stories,
  real-Korean readings from trusted news/tourism sites). Needs an API key from console.anthropic.com with a little
  prepaid credit (a claude.ai subscription doesn't include API use). Typical cost: about 2¢ per chat reply and 10¢
  per new lesson on the default model; cheaper models are selectable.

Everything the AI or the web returns is treated as untrusted data: it's rebuilt field by field, links and
instruction-like text are rejected, and the app can only talk to itself, Google Fonts and api.anthropic.com.

## Improving it from Task Manager

Describe the change in a task and mention this folder, for example:

> In `C:\Users\scott\Documents\Claude\ClaudeTaskManager\data\workspaces\64-main-goal-create-fun-korean-learning-pro`,
> add a chapter about visiting the hair salon, then publish it.

Claude reads `CLAUDE.md` (rules, where things are, how to verify) and publishes with
`node tools/release.mjs "Chapter 13: at the hair salon"`. She sees the note the next time she opens the app.

## How she studies

| Where | What it's for |
|---|---|
| **Tonight** | One button: *Begin tonight's study* — reviews due today first, then new words from her current chapter, sized to her chosen evening length. |
| **Course** | Chapters in order. Each: two lessons (words, then phrases + grammar), a story, speaking, and an exam (80% opens the next chapter). Lessons can be practised again any time — the second time is "deep practice". |
| **Stories** | The webtoon episodes. Tap a bubble to hear it, tap again for English. *Rewind* blanks out words to recall. Sign chips under panels are real Korean signs to read. |
| **Speaking** | Shadow a chapter's phrases, or role-play a story (she reads her character, the others speak). Edge/Chrome score each syllable. |
| **Spellbook** | Everything learned, with moon-phase mastery, search, audio, and *Practise my tricky words*. |
| **Moonlight Recap** | Appears every few lessons or after a week: older words whose memory is fading, plus questions from an earlier story. |
| **Ask Jiji** | Questions, Korean conversation practice, custom lessons on request, real-Korean readings. |

## Project layout

- `app/` — the website (see `CLAUDE.md` for the map)
- `tools/` — `serve.mjs` (preview), `validate.mjs` (content checks), `check-routes.mjs` (screen smoke test),
  `shot.mjs` (screenshots), `build.mjs` (offline cache + icons), `release.mjs` (publish), `test/` (simulations)
- `DESIGN.md` — design document (Korean)
- `NOTES.md`, `HANDOFF.md` — task memory for Claude sessions
