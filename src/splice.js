/*
Early OT adopters used DEL/INS/REPLACE/RETAIN
commands which are easier to implement, but make
runtime processing more complex.
It was difficult to compress and normalize big patches,
especially so when interleaved with collaborative metadata. 
It is even harder to predict outcomes of difficult multi-peer
situations.

However there's a great insight in `jot` library, that
all those operations can be seen as `splice(from, to, replacement)`
command. Furthermore, any history of text/sequence editing 
operations can be simplified to a list of non-intersecting
splices. It makes resolving patches easier and gives additional
leverage to keep semantic intent of peers preserved, by taking
out the effect of unobserved changes.
*/

/*
Splice operations can be concatenated into a list, where
each expression needs all previous expressions applied
to the state for absolute indecies to point to correct positions.

Splice list operations don't necessarily have to be sorted
from left to right and can intersect each other, 
O.splice will still produce proper result.
However to transform and concatenate splice lists, 
they are sorted and normalized to remove intersections.
*/
O.splice = function(ours, theirs, normalized) {
  if (ours)
    var result = ours.slice();
  else if (theirs[2] instanceof Array)
    var result = []
  else
    var result = '';
  for (var i = 0, j = theirs.length; i < j; i += 3) { 
    var removed   = result.slice(theirs[i], theirs[i] + theirs[i + 1]);
    var type      = O.splice.typeof(removed, theirs[i + 2])
    var value     = O[type](removed, theirs[i + 2])
    if (result instanceof Array) {
      result.splice.apply(result, [theirs[i], theirs[i + 1]].concat(value))
    } else {
      result = result.slice(0, theirs[i]) + value + result.slice(theirs[i] + theirs[i + 1])
    }
  }
  return result;
}
O.splice.index = 1;

// ===========================================================================
// The origin-frame edit set.
//
// HEAD decides using progressively-updated coordinates. They are path-dependent: the same pair
// of operations presents different numbers depending on the order a peer folded its log in, so
// two peers reach opposite branches on the same question. That is the TP2 violation, and no
// ordering of live-frame quantities recovers from it.
//
// `_E` is the operation stated in coordinates no fold order can move: positions in the document
// every peer shares. A deletion is a set of original positions. An insertion is a run anchored
// before an original position, ordered against its rivals at the same anchor by the library's
// own rule (shorter removal first, then content). Composition is set union, which is
// commutative and idempotent -- so every peer that has seen the same operations holds the same
// `_E` and renders the same document, whatever order they arrived in.
//
// The array remains an ordinary progressive splice list: `_E` decides, the array transports.
// ===========================================================================

O.splice.runKey = function(run) {
  return run.a + '\u0000' + run.r + '\u0000' + JSON.stringify(O.splice.getValue(run.v));
}

// Derive the edit set from a bare splice list: origins by prefix sum, one insertion run per
// range. Correct for a FIRST-GENERATION list, which is the only one that has no `_E` to carry.
O.splice.edits = function(list) {
  if (list == null) return { del: [], ins: [] };
  if (list._E) return list._E;
  var del = [], ins = [], diff = 0;
  for (var i = 0; i < list.length; i += 3) {
    var a = list[i] - diff, r = list[i + 1], v = list[i + 2];
    if (r > 0) del.push([a, a + r]);
    if (O.splice.getLength(v) > 0) ins.push({ a: a, r: r, v: v });
    diff += O.splice.getLength(v) - r;
  }
  return { del: del, ins: ins };
}

O.splice.frame = function(list) {
  if (list)
    Object.defineProperty(list, '_frame', { value: true, writable: true, enumerable: false, configurable: true });
  return list;
}

O.splice.attach = function(list, E) {
  if (list && E)
    Object.defineProperty(list, '_E', { value: E, writable: true, enumerable: false, configurable: true });
  return list;
}

O.splice.union = function(a, b) {
  var del = a.del.concat(b.del), seen = {}, ins = [];
  a.ins.concat(b.ins).forEach(function (run) {
    var k = O.splice.runKey(run);
    if (seen[k]) return;              // identical insertions at one anchor count once, as HEAD does
    seen[k] = 1; ins.push(run);
  });
  return { del: del, ins: ins };
}

O.splice.cmpRun = function(x, y) {
  if (x.a !== y.a) return x.a - y.a;
  if (x.r !== y.r) return x.r < y.r ? -1 : 1;
  return O.compare(O.splice.getValue(x.v), O.splice.getValue(y.v));
}

// Render an edit set as the token sequence of the document it describes, over origin positions
// [0, n). A token is either an original position that survived, or an inserted run.
O.splice.tokens = function(E, n) {
  var dead = {};
  for (var i = 0; i < E.del.length; i++)
    for (var p = E.del[i][0]; p < E.del[i][1]; p++) dead[p] = 1;
  var runs = E.ins.slice().sort(O.splice.cmpRun);
  var out = [], ri = 0;
  for (var p = 0; p <= n; p++) {
    while (ri < runs.length && runs[ri].a <= p) {
      out.push({ k: 'r' + O.splice.runKey(runs[ri]), run: runs[ri] });
      ri++;
    }
    if (p < n && !dead[p]) out.push({ k: 'o' + p, p: p });
  }
  while (ri < runs.length) { out.push({ k: 'r' + O.splice.runKey(runs[ri]), run: runs[ri] }); ri++; }
  return out;
}

O.splice.span = function(E) {
  var n = 0;
  for (var i = 0; i < E.del.length; i++) if (E.del[i][1] > n) n = E.del[i][1];
  for (var i = 0; i < E.ins.length; i++) if (E.ins[i].a > n) n = E.ins[i].a;
  return n;
}

// Produce an optimal sorted set of non-empty 
// spliced ranges without intersections
O.splice.normalize = function(ours, once) {
  var result = [];
  for (var i = 0, j = ours.length; i < j; i += 3)
    O.splice.push(result, ours[i], ours[i + 1], ours[i + 2]);
  // Carry an edit set only if there is one to carry. Attaching a DERIVED one would make a
  // sequential own operation indistinguishable from a rebased remote one, and they compose
  // by different rules.
  if (result.length) {
    if (ours._frame) O.splice.frame(result);
    return ours._E ? O.splice.attach(result, ours._E) : result;
  }
}


O.splice.concat = function(ours, theirs) {
  // Two different compositions wear the same name. A REBASED REMOTE contribution (it carries
  // `_E`) is concurrent with ours, so the edit sets union. A SEQUENTIAL own operation does not
  // carry one: its coordinates are relative to the document ours already produced, it may edit
  // characters ours inserted, and union would be a lie -- but `push` merges it into a
  // non-intersecting list whose ranges are all original-anchored, so the origin frame can
  // simply be re-derived from the merged array afterwards.
  var concurrent = theirs._E !== undefined;
  var E = concurrent ? O.splice.union(O.splice.edits(ours), theirs._E) : undefined;
  var result = ours.slice();
  if (ours._frame) O.splice.frame(result);
  for (var t = 0, tt = theirs.length; t < tt; t += 3)
    O.splice.push(result, theirs[t], theirs[t + 1], theirs[t + 2])
  return O.splice.attach(result, E || O.splice.edits(result));
}

// Push a splice into a list, simplifying all intersections
/*
  Patches captured in real world applications can be messy and 
  have extra intermediate commands that are not visible in final result,
  like when a writer rewords parts of the sentence a few times.

  `O.splice.push` can be used to add SPLICE command into a list.
  That effectively normalizes commands on insertion.
  It means that the log is always compacted and splices 
  are sorted in order of appearance in document without any intersection.
  It is necessary for effective transformations.
*/
O.splice.push = function(result, index, removing, insertion, feedback) {
  if (!result) 
    return;
  
  var diff  = O.splice.getLength(insertion) - removing;

  // skip zero-length chunks
  if (removing === 0 && diff === 0)
    return

  // find a place in array in case ranges aren't ordered
  for (var o = result.length; o; o -= 3)
    if (result[o - 3] <= index)
      break;

  var skipping  = 0;
  var target = o;
  var deletion = removing;
  var newIndex = index;

  // check if range start intersections with another range
  if (o) {
    var p = o - 3;
    var removed = result[p + 1]
    var shift = O.splice.getLength(result[p + 2]) - removed
    var inserted = shift + removed;
    var distance = index - result[p];
    // new splice deletes previous insertion
    if (distance == 0 && inserted <= removing) {
      deletion -= shift;
      target = p;

    // prepend new value
    } else if (distance === 0) {
      insertion = O.splice.value(result[p + 2], 0, removing, insertion)
      deletion = removed;
      target = p;

    // append value
    } else if (inserted == distance) {
      deletion += removed;
      insertion = O.splice.value(insertion, 0, 0, result[p + 2])
      target = p;

    // splice in the new value
    } else if (inserted >= distance + removing) {
      insertion = O.splice.value(result[p + 2], distance, removing, insertion)
      deletion = removed;
      target = p;

    // replace end of inserted value
    } else if (inserted > distance) {
      insertion = O.splice.value(result[p + 2], distance, inserted - distance, insertion)
      deletion += removed - (inserted - distance)
      target = p;
    }
    if (target === p) {
      skipping += 3;
      newIndex = result[p];
    }
  }

  // iterate ranges to the right that may be removed or shifted
  for (var n = target + skipping; n < result.length; n += 3) {
    var intersection = index + removing - result[n]; 
    if (intersection > 0 && removing > 0) {
      var shift = O.splice.getShift(result, n)
      var removed = result[n + 1]
      var inserted = shift + removed;

      // insertion is consumed
      if (inserted <= intersection) {
        deletion -= shift

      // insertion is concatenated
      } else {
        insertion = O.splice.value(result[n + 2], 0, intersection, insertion)
        deletion += removed - intersection
      }
      skipping += 3;
    }

    // shift following positions to propagate the change
    result[n] += diff;
  }

  // prepend resulting range to another if it comes right after
  if (result[skipping + target] === newIndex + O.splice.getLength(insertion)) {
    deletion += result[skipping + target + 1] 
    insertion = O.splice.value(result[skipping + target + 2], 0, 0, insertion)
    skipping += 3;
  }

  // drop the range if it resulted to empty operation
  if (deletion === 0 && O.splice.getLength(insertion) === 0) {
    var drop = true;
  } else {
    skipping -= 3;
  }

  // Hottest performance spot in the library: 
  // custom Array.splice reimplementation doubles total throughput
  if (skipping > 0) {
    for (var j = target + skipping; j < result.length; j++)
      result[j - skipping] = result[j]
    result.length -= skipping;
  } else if (skipping < 0)
    for (var j = result.length; --j >= target;)
      result[j - skipping] = result[j]

  if (!drop) {
    result[target]     = newIndex
    result[target + 1] = deletion
    result[target + 2] = insertion
  }
  return result;
}

O.splice.value = function(ours, offset, length, theirs) {
  var oursType = O.splice.typeof(ours);
  var theirsType = O.splice.typeof(theirs);
  if (oursType == theirsType && oursType === 'set') {
    if (offset != null)
      return ours.slice(0, offset).concat(theirs, ours.slice(offset + length))
    return ours.concat(theirs)
  }
  return O(ours, theirs)
}

O.splice.getValue = function(value) {
  if (O.splice.typeof(value) === 'list') {
    debugger
    return O.list(value);
  }
  return value
}
O.splice.getLength = function(value) {
  value = O.splice.getValue(value);
  if (typeof value == 'number')
    return String(value).length
  return value.length
}
O.splice.getShift = function(ours, offset) {
  if (typeof offset != 'number')
    offset = 0;
  return O.splice.getLength(ours[offset + 2]) - ours[offset + 1]
}

// Splice treats third attribute as set value.
// If that value is an array, it is concatenated into
// the final result. However array wrapped in array
// is still treated like a list of operations, and
// can be used to customize splice logic
O.splice.typeof = function(ours, theirs) {
  // list of one operation
  if (theirs 
    && theirs instanceof Array 
    && theirs[0] 
    && theirs[0] instanceof Array)
    return 'list'
  return 'set'
}


O.splice.invert = function (ours, theirs, normalized) {
  if (!normalized) 
    theirs = O.splice.normalize(theirs)
  if (theirs === undefined)
    return
  var inverse = Array(theirs.length);
  var diff = 0;
  for (var i = 0, j = theirs.length; i < j; i += 3) {
    var offset    = theirs[i];
    var length    = theirs[i + 1];
    var operation = theirs[i + 2];
    inverse[i] = diff + theirs[i]
    inverse[i + 1] = O.splice.getLength(theirs[i + 2])
    inverse[i + 2] = O.invert(ours.slice(inverse[i], inverse[i] + theirs[i + 1]), theirs[i + 2], true)
    diff += O.splice.getShift(inverse, i)
  }
  return inverse
}

O.splice.compare = function(ours, l, theirs, r) {
  if (ours[l + 1] > theirs[r + 1])
    return 1;
  if (ours[l + 1] < theirs[r + 1])
    return -1;
  return O.compare(O.splice.getValue(ours[l + 2]), O.splice.getValue(theirs[r + 2]))
}

/* # Transform SPLICE set against another SPLICE set -- in LIVE coordinates (unchanged)

This is the original algorithm, kept verbatim and still the one that runs everywhere except
where a whole composed log is being transformed against another. It walks both lists in
lockstep with running shifts. Those shifts are path-dependent, which is the defect; it is
retained because an operation handed over ALONE, out of the middle of a log, has no position in
the shared document for the origin frame to use.

Original header follows.
# Transform SPLICE set against another SPLICE set
Most of the time, splices just push each other changing the counters.
Though they also can get into conflicting situations:
1. Splice can completely remove another
2. Splices can patch sequences starting at the same position
3. Splices can patch intersecting sequences
4. Splices can insert at the position

To transform splice lists against each other in one pass, they need
to be normalized first to simplify all intersecting ranges.
*/
O.splice.live = function(ours, theirs, normalized, safe) {
  if (!normalized) {
    ours = O.splice.normalize(ours)
    theirs = O.splice.normalize(theirs)
  }
  if (ours === undefined)
    return theirs;
  if (theirs === undefined)
    return

  var result = [];
  var shiftO = 0;
  var shiftT = 0;
  var offsetT = 0;
  theirs: for (var t = 0, o = 0, tt = theirs.length; t < tt; t += 3) {
    var index     = theirs[t];
    var removing  = theirs[t + 1];
    var insertion = theirs[t + 2];
    // apply our ranges coming before their range
    for (; shiftT + index >= shiftO + ours[o]; o += 3) {
      var change  = O.splice.getShift(ours, o)
      var concurrent = shiftT + index == shiftO + ours[o];
      // if ranges start at the same place, pick shorter one first
      if (concurrent) {
        if (O.splice.compare(ours, o, theirs, t) > 0) {
          offsetT += change
          break;

        // two identical insertion, one is ignored
        } else if (O.splice.compare(ours, o, theirs, t) == 0 && !ours[o + 1]) {
          continue theirs
        }
      }
      var intersection = shiftO + ours[o] + ours[o + 1] - (shiftT + theirs[t]);
      if (intersection > 0) {
        // our range consumed by theirs
        if (intersection >= removing) {
          if (shiftT + index == shiftO + ours[o]) {
            shiftT += change;
            o += 3;
          }
          shiftT -= O.splice.getShift(theirs, t);
          continue theirs;

        // their range at the same position partially removes ours
        } else if (concurrent) {
          removing += change
          continue

        // partial intersection
        } else {
          removing -= intersection;
          shiftT += intersection
        }
      }
      shiftT += change;
    }

    // look ahead for ours side ranges removed by theirs 
    if (removing)
    for (; shiftT + index + removing >= shiftO + ours[o]; o += 3) { 
      var change = O.splice.getShift(ours, o);
      var intersection = shiftT + index + removing - (shiftO + ours[o]);
      if (intersection <= 0)
        break;
      // our range is consumed by theirs
      if (intersection >= ours[o + 1]) {
        removing += change;
        offsetT = 0;
      // ranges start at the same position
      } else if (shiftT + index == shiftO + ours[o]) {
        shiftT += intersection - O.splice.getLength(theirs[t + 2])
        offsetT = 0;
        continue theirs;
      // ranges intersect partially
      } else {
        offsetT += intersection
        removing -= intersection
        break;
      }
    }

    // apply their range, log transformed command
    result.push(shiftT + index, removing, insertion);

    shiftO += O.splice.getLength(theirs[t + 2]) - removing;

    if (offsetT) {
      shiftT += offsetT;
      offsetT = 0;
    }
  }
  return result.length ? result : undefined;
}

/* # Transform SPLICE set against another SPLICE set

The answer is the difference between the document we hold now and the document we should hold
once theirs is folded in -- computed in origin coordinates, where "the document we should hold"
is a set union and therefore the same for every peer, whatever order the operations arrived in.
The result is an ordinary progressive splice list; `_E` rides along so the next fold can do the
same thing again.
*/
O.splice.rebase = function(ours, theirs, normalized, safe) {
  if (!normalized) {
    ours = O.splice.normalize(ours)
    theirs = O.splice.normalize(theirs)
  }
  if (ours === undefined)
    return theirs;
  if (theirs === undefined)
    return

  var Eo = O.splice.edits(ours), Et = O.splice.edits(theirs);
  var Eb = O.splice.union(Eo, Et);
  var n = Math.max(O.splice.span(Eo), O.splice.span(Et));
  var To = O.splice.tokens(Eo, n), Tb = O.splice.tokens(Eb, n);

  var inOurs = {}, inBoth = {};
  for (var i = 0; i < To.length; i++) inOurs[To[i].k] = 1;
  for (var i = 0; i < Tb.length; i++) inBoth[Tb[i].k] = 1;

  // `pos` is a LIVE character index, not a token index: an inserted run is one token and any
  // number of characters.
  var width = function (tok) {
    return tok.p !== undefined ? 1 : O.splice.getLength(tok.run.v);
  };
  var pieces = [], i = 0, j = 0, pos = 0;
  while (i < To.length || j < Tb.length) {
    if (i < To.length && j < Tb.length && To[i].k === Tb[j].k) { pos += width(To[i]); i++; j++; continue; }
    if (j < Tb.length && !inOurs[Tb[j].k]) {
      var value = null;
      while (j < Tb.length && !inOurs[Tb[j].k]) {
        value = value === null ? Tb[j].run.v : O.splice.value(value, null, 0, Tb[j].run.v);
        j++;
      }
      pieces.push({ abs: pos, del: 0, ins: value });
      continue;
    }
    if (i < To.length && !inBoth[To[i].k]) {
      var from = pos;
      while (i < To.length && !inBoth[To[i].k]) { pos += width(To[i]); i++; }
      pieces.push({ abs: from, del: pos - from, ins: null });
      continue;
    }
    pos += width(To[i]); i++; j++;   // unreachable while both renderings use one total order
  }

  // A deletion and an insertion landing at the same place are one splice triple: the triple's
  // value replaces what it removes, which is the same document either way.
  var result = [], shift = 0, k = 0;
  while (k < pieces.length) {
    var p = pieces[k], del = p.del, ins = p.ins;
    while (k + 1 < pieces.length && pieces[k + 1].abs === p.abs + del) {
      var q = pieces[++k];
      del += q.del;
      ins = ins === null ? q.ins : (q.ins === null ? ins : O.splice.value(ins, null, 0, q.ins));
    }
    k++;
    if (ins === null) ins = (typeof theirs[2] === 'string') ? '' : [];
    if (del === 0 && O.splice.getLength(ins) === 0) continue;
    result.push(p.abs + shift, del, ins);
    shift += O.splice.getLength(ins) - del;
  }

  if (!result.length)
    return;
  return O.splice.frame(O.splice.attach(result, Et));
}


// Which frame decides.
//
// The origin frame is only meaningful for a list that states a peer's WHOLE contribution
// relative to the document every peer shares -- that is what `O.list.compose` builds and marks
// with `_frame`. Anything else (a single operation pulled out of the middle of a log, a splice
// folded pairwise inside a mixed log) has no such coordinate, and for those the original
// live-coordinate algorithm still runs.
O.splice.splice = function(ours, theirs, normalized, safe) {
  if (ours && theirs && ours._frame && theirs._frame)
    return O.splice.rebase(ours, theirs, normalized, safe);
  return O.splice.live(ours, theirs, normalized, safe);
}
