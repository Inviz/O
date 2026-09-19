# `specs/runner` — running O's specs from a terminal

**For whoever maintains O. Evergreen.**

O's specs were written for a browser: `specs/runner.html` loads jasmine and every source and
spec file as `<script>` tags. This directory runs the same specs under node, with no install and
no network, so `npm test` can gate a change.

```
npm test                       # the repo this runner lives in, fixed seed, exits non-zero on failure
npm run test:sweep             # 25 consecutive seeds, reports which specs flicker
npm run test:random            # unseeded, the browser's behaviour

node specs/runner/run.js <root>            # any other checkout or export tree
node specs/runner/run.js --seed 19         # reproduce one seed
node specs/runner/run.js --repeat 30       # sweep 30 seeds from the default
node specs/runner/run.js --verbose         # let the specs' own console output through
```

## Exit codes

| code | meaning |
|---|---|
| `0` | every spec that ran, passed |
| `1` | at least one spec failed |
| `2` | the runner could not produce a trustworthy result — a source file failed to parse, a listed file is missing, or the load order was empty |

`2` is separate from `1` on purpose: "the suite is red" and "the suite did not run" are different
facts, and a gate that conflates them will one day report green because nothing executed.
Read the code off the bare command — `node specs/runner/run.js | tail` reports `tail`'s status.

## `specs/runner.html` is the load order

`run.js` parses the `<script src>` tags out of `specs/runner.html` rather than keeping its own
list, so the browser runner and the terminal runner cannot drift. Registering a new spec file
there is all it takes to include it in `npm test`. The `jasmine/` entries are skipped —
`jasmine-shim.js` supplies `describe`/`it`/`xit`/`expect` with the matchers the specs actually use.

An empty load order is refused rather than reported as a pass.

## Two traps this runner exists to avoid

**The realm trap.** Everything runs inside one `vm` context, and nothing but strings crosses the
boundary. A `vm` context has its own `Array` intrinsic, so an array built in the host realm fails
`x instanceof Array` inside `O.typeof` and `['set','x']` is silently misread as a `merge`. Any
instrument added here must run in-context for the same reason.

**The flake trap.** The fuzz specs call `Math.random` directly (`specs/list.js`, `specs/merge.js`).
Unseeded, the suite flickers red roughly one run in eight — always
`O.list > .transform > should resolve random moves/splices (10000 fuzzy runs)` — which makes it
useless as a gate. `run.js` therefore replaces `Math.random` *inside the context* with a seeded
mulberry32 generator. A fixed seed gives byte-identical results run after run.

Seeding pins a sample; it does not fix the underlying defect. That defect is real and still
there. `--repeat` keeps it measurable: of seeds 1–30, **19 and 26 are red** on an otherwise green
tree. Treat a newly-red seed as a finding, not as noise, and do not change the default seed to
make a failure go away.

## Expected readings

Taken with the default seed on `git archive HEAD | tar -x` exports:

| tree | total | pass | fail | skip |
|---|---|---|---|---|
| pristine `HEAD` | 78 | 77 | 0 | 1 |
| `HEAD` + `CONTRACT-1` + `CONTRACT-2` | 78 | 77 | 0 | 1 |
| + `SET-1` + `SET-2` | 89 | 86 | 0 | 3 |
| + `MATH-1` + `MATH-2` | 90 | 88 | 0 | 2 |

A tree whose numbers differ from its row has diverged from the recorded state; check the row
before assuming the runner is wrong.
