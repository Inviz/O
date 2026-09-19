// Minimal jasmine surface: describe / it / expect with the matchers specs/ actually use.
function makeJasmine(ctx) {
  const results = { specs: [], suite: null };
  const stack = [];

  function eq(a, b) {
    if (a === b) return true;
    if (typeof a === 'number' && typeof b === 'number' && isNaN(a) && isNaN(b)) return true;
    if (a === null || b === null || a === undefined || b === undefined) return a === b;
    if (typeof a !== 'object' || typeof b !== 'object') return false;
    const aArr = Array.isArray(a), bArr = Array.isArray(b);
    if (aArr !== bArr) return false;
    if (aArr) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) if (!eq(a[i], b[i])) return false;
      return true;
    }
    const ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (const k of ka) { if (!(k in b)) return false; if (!eq(a[k], b[k])) return false; }
    return true;
  }

  let current = null;
  function fail(msg) {
    if (current) current.failures.push(msg);
    else throw new Error('expectation outside a spec: ' + msg);
  }
  const show = v => { try { return JSON.stringify(v); } catch (e) { return String(v); } };

  ctx.expect = function (actual) {
    return {
      toBe: e => { if (actual !== e) fail(`toBe: got ${show(actual)} want ${show(e)}`); },
      toEqual: e => { if (!eq(actual, e)) fail(`toEqual: got ${show(actual)} want ${show(e)}`); },
      toBeGreaterThan: e => { if (!(actual > e)) fail(`toBeGreaterThan: ${show(actual)} !> ${show(e)}`); },
      toBeLessThan: e => { if (!(actual < e)) fail(`toBeLessThan: ${show(actual)} !< ${show(e)}`); },
      toBeDefined: () => { if (actual === undefined) fail('toBeDefined: undefined'); },
      toBeUndefined: () => { if (actual !== undefined) fail(`toBeUndefined: ${show(actual)}`); },
      toBeTruthy: () => { if (!actual) fail(`toBeTruthy: ${show(actual)}`); },
      toBeFalsy: () => { if (actual) fail(`toBeFalsy: ${show(actual)}`); },
      not: {
        toBe: e => { if (actual === e) fail(`not.toBe: ${show(actual)}`); },
        toEqual: e => { if (eq(actual, e)) fail(`not.toEqual: ${show(actual)}`); },
      },
    };
  };

  ctx.describe = function (name, fn) { stack.push(name); try { fn(); } finally { stack.pop(); } };
  ctx.xdescribe = function () {};
  ctx.it = function (name, fn) {
    const rec = { name: stack.concat(name).join(' > '), failures: [], error: null, skipped: false };
    current = rec;
    try { fn(); } catch (e) { rec.error = (e && e.stack) || String(e); }
    current = null;
    results.specs.push(rec);
  };
  ctx.xit = function (name) {
    results.specs.push({ name: stack.concat(name).join(' > '), failures: [], error: null, skipped: true });
  };
  ctx.beforeEach = function () {};
  ctx.afterEach = function () {};
  ctx.eq = eq;
  return results;
}
module.exports = { makeJasmine };
