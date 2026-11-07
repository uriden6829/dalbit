// Publish an update to her copy of the app.
//   node tools/release.mjs "What changed, in words she understands" ["another note"] [--minor] [--no-push]
// Steps: validate content → bump version + changelog (she sees the notes once) → stamp offline cache →
// git commit → git push (GitHub Actions then deploys app/ to GitHub Pages).
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const args = process.argv.slice(2);
const notes = args.filter((a) => !a.startsWith('--'));
const minor = args.includes('--minor');
const push = !args.includes('--no-push');
if (!notes.length) { console.error('Usage: node tools/release.mjs "note" ["note" ...] [--minor] [--no-push]'); process.exit(1); }

const run = (cmd, a, opts = {}) => execFileSync(cmd, a, { cwd: root, stdio: 'inherit', ...opts });

run(process.execPath, ['tools/validate.mjs']);

const vPath = resolve(root, 'app/js/version.js');
let src = readFileSync(vPath, 'utf8');
const cur = /VERSION = '(\d+)\.(\d+)\.(\d+)'/.exec(src);
const next = minor ? `${cur[1]}.${+cur[2] + 1}.0` : `${cur[1]}.${cur[2]}.${+cur[3] + 1}`;
src = src.replace(/VERSION = '[^']+'/, `VERSION = '${next}'`)
  .replace('export const CHANGELOG = [', `export const CHANGELOG = [\n  { version: '${next}', notes: ${JSON.stringify(notes)} },`);
writeFileSync(vPath, src);

run(process.execPath, ['tools/build.mjs']);
run('git', ['add', '-A']);
run('git', ['commit', '-m', `Release v${next}: ${notes[0]}`]);
if (push) {
  let remote = '';
  try { remote = execFileSync('git', ['remote'], { cwd: root, encoding: 'utf8' }).trim(); } catch { /* none */ }
  if (remote) run('git', ['push', 'origin', 'HEAD:main']);
  else console.log('No git remote yet — committed locally. See README “One-time setup” to connect GitHub.');
}
console.log(`Released v${next}`);
