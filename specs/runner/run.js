#!/usr/bin/env node
// Node-only spec runner for O. No install, no network, no dependencies.
//
//   node specs/runner/run.js [root] [--seed N|--random] [--repeat N] [--verbose]
//
// Load order is read out of specs/runner.html, so the browser runner and this one cannot
// drift apart: adding a <script src> there is all it takes to include a file here.
//
// Everything runs inside one vm context. A context has its own Array intrinsic, so an array
// built in the host realm fails `x instanceof Array` inside O.typeof and ['set','x'] is
// silently misread as a merge. Nothing but strings crosses the boundary.
//
// The spec fuzzers call Math.random directly. Left alone the suite flickers red roughly one
// run in eight, which makes it worthless as a gate, so Math.random is replaced inside the
// context by a seeded generator. --random restores the unseeded behaviour and --repeat N
// sweeps consecutive seeds, so the flake stays measurable instead of hidden.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { makeJasmine } = require('./jasmine-shim.js');

const DEFAULT_SEED = 1;
const REPO = path.resolve(__dirname, '..', '..');

function parseArgs(argv) {
  const opts = { root: REPO, seed: DEFAULT_SEED, repeat: 1, verbose: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--verbose') opts.verbose = true;
    else if (a === '--random') opts.seed = null;
    else if (a === '--seed') opts.seed = Number(argv[++i]);
    else if (a.startsWith('--seed=')) opts.seed = Number(a.slice(7));
    else if (a === '--repeat') opts.repeat = Number(argv[++i]);
    else if (a.startsWith('--repeat=')) opts.repeat = Number(a.slice(9));
    else if (a.startsWith('--')) throw new Error('unknown flag: ' + a);
    else opts.root = path.resolve(a);
  }
  return opts;
}

// Load order, straight out of the browser runner. The jasmine/ files are its harness and are
// replaced here by jasmine-shim.js.
function loadOrder(root) {
  const htmlPath = path.join(root, 'specs', 'runner.html');
  if (!fs.existsSync(htmlPath))
    throw new Error('no specs/runner.html under ' + root + ' — is that an O checkout?');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const src = [], spec = [];
  const re = /<script\s+src\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    const rel = m[1];
    if (/(^|\/)jasmine\//.test(rel)) continue;
    (rel.indexOf('../src/') === 0 ? src : spec).push(path.resolve(root, 'specs', rel));
  }
  if (!src.length || !spec.length)
    throw new Error('specs/runner.html listed ' + src.length + ' sources and ' + spec.length +
                    ' spec files — refusing to report a result on an empty load order');
  return { src, spec };
}

// mulberry32, written into the context so no host-realm function is reachable from specs.
function installSeededRandom(ctx, seed) {
  vm.runInContext(
    '(function(){var a=' + (seed | 0) + '|0;Math.random=function(){' +
    'a=(a+0x6D2B79F5)|0;var t=Math.imul(a^(a>>>15),1|a);' +
    't=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};})();',
    ctx, { filename: 'seeded-random' });
}

function runOnce(root, opts, seed) {
  const { src, spec } = loadOrder(root);
  const quiet = { log() {}, warn() {}, error() {}, info() {}, debug() {} };
  const ctx = vm.createContext({ console: opts.verbose ? console : quiet });
  if (seed !== null) installSeededRandom(ctx, seed);

  for (const f of src) vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
  const results = makeJasmine(ctx);
  for (const f of spec) {
    try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); }
    catch (e) {
      // A spec file that fails to parse must count as a failure, never as absence.
      results.specs.push({
        name: '<spec file ' + path.basename(f) + '>', failures: [],
        error: String((e && e.stack) || e), skipped: false,
      });
    }
  }
  return results;
}

function tally(r) {
  const bad = r.specs.filter(s => !s.skipped && (s.failures.length || s.error));
  const skip = r.specs.filter(s => s.skipped);
  return { bad, skip, total: r.specs.length, pass: r.specs.length - bad.length - skip.length };
}

function report(r, opts, seed, showSkips) {
  const t = tally(r);
  for (const s of t.bad) {
    console.log('FAIL  ' + s.name);
    for (const f of s.failures) console.log('        ' + f);
    if (s.error) console.log('        ERROR ' + String(s.error).split('\n').slice(0, 4).join('\n        '));
  }
  if (showSkips) for (const s of t.skip) console.log('SKIP  ' + s.name);
  console.log('\n  ' + opts.root);
  console.log('  seed=' + (seed === null ? 'random' : seed) +
              '  total=' + t.total + ' pass=' + t.pass + ' fail=' + t.bad.length + ' skip=' + t.skip.length);
  return t;
}

function main() {
  let opts;
  try { opts = parseArgs(process.argv.slice(2)); }
  catch (e) { console.error(String(e.message || e)); process.exit(2); }

  let red = 0;
  const flaky = new Map();
  for (let i = 0; i < opts.repeat; i++) {
    const seed = opts.seed === null ? null : opts.seed + i;
    let t;
    try { t = report(runOnce(opts.root, opts, seed), opts, seed, opts.repeat === 1); }
    catch (e) { console.error('runner error: ' + String((e && e.message) || e)); process.exit(2); }

    // Green because nothing ran is the one result worse than red.
    if (t.total === 0) { console.error('\n  no specs executed — refusing to report green'); process.exit(2); }
    if (t.bad.length) { red++; for (const s of t.bad) flaky.set(s.name, (flaky.get(s.name) || 0) + 1); }
    if (opts.repeat > 1) console.log('');
  }

  if (opts.repeat > 1) {
    console.log('  ' + opts.repeat + ' runs: ' + (opts.repeat - red) + ' green, ' + red + ' red');
    if (flaky.size) {
      console.log('  specs that failed at least once:');
      for (const [name, n] of [...flaky].sort((a, b) => b[1] - a[1]))
        console.log('    ' + n + '/' + opts.repeat + '  ' + name);
    }
  }
  process.exit(red ? 1 : 0);
}

if (require.main === module) main();
module.exports = { runOnce, loadOrder, tally };
