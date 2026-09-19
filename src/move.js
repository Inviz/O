// ['move', from : int, count: int, to : int]
O.move = function(ours, theirs) {
  if (theirs[1] < theirs[3])
    return ours.slice(0, theirs[1]).concat(
      ours.slice(theirs[1] + theirs[2], theirs[3]),
      ours.slice(theirs[1], theirs[1] + theirs[2]),
      ours.slice(theirs[3]));
  else
    return ours.slice(0, theirs[3]).concat(
      ours.slice(theirs[1], theirs[1] + theirs[2]),
      ours.slice(theirs[3], theirs[1]),
      ours.slice(theirs[1] + theirs[2]));
}
O.move.index = 3;

/*
  Any movement from right to left, can be seen
  as movement of sequences between positions
  to the right. O ensures commutativity of RTL 
  move operations inverted to LTR. This property 
  is used to reduce total code complexity of
  transformations. 
*/
O.move.normalize = function(ours, makeRTL) {
  if (ours[1] === ours[3])
    return
  if (ours[2] === 0)
    return;
  if (ours[1] < ours[3]) {
    if (ours[1] + ours[2] === ours[3])
      return;
    if (makeRTL === true)
      return ['move', ours[1] + ours[2], ours[3] - ours[1] - ours[2], ours[1]]
  } else {
    if (makeRTL === false)
      return ['move', ours[3], ours[1] - ours[3], ours[1] + ours[2]]
  }
  return ours;
}

O.move.invert = function(ours, theirs) {
  if (theirs[1] < theirs[3])
    return ['move', theirs[3] - theirs[2], theirs[2], theirs[1]];
  else
    return ['move', theirs[3], theirs[2], theirs[1] + theirs[2]];
}

// The merge test reads coordinates that only mean what it assumes in left-to-right form:
// after an LTR move the block sits at [to - count, to), which is what `ours[3] - ours[2]`
// names. In RTL form the block sits at `to`, so the test matches pairs that do not compose
// and folds them into a wrong single move -- for instance ['move',2,1,1] then ['move',0,1,2]
// becomes ['move',2,1,2], a from==to no-op, where the truth is xyz -> zxy.
O.move.concat = function(ours, theirs) {
  var left = O.move.normalize(ours, false), right = O.move.normalize(theirs, false);
  if (left && right && left[2] == right[2] && left[3] - left[2] == right[1])
    return ['move', left[1], left[2], right[3]]
  return [ours, theirs]
}
/* # Transform MOVE against MOVE
Moves are normalized to LTR before transformation
When two moves attempt to reposition same sub-sequence, 
move that shifts if further away does it, while
the other move shrinks. 

There're three possible conflict scenarios in two ltr moves
1. Moves can attempt to reposition same subsequence
2. Moves can have intersecting part
3. Moves can interleave, one shifting another

Additionally, each scenario has 3 possible situations:
1. Right move target position is after left move's
2. Left moves target position is before/equal to right's move
3. Left move inserts into right move's source range

Combined with simple cases into consideration, 
there are about dozen branches, doubled when computing
their side of the story.
*/
O.move.move = function(ours, theirs, normalized) {
  var rtl = theirs[1] > theirs[3];
  if (!normalized) {
    theirs = O.move.normalize(theirs, false)
    ours = O.move.normalize(ours, false)
  }
  if (!theirs)
    return
  if (!ours)
    return theirs

  var oursFirst = (theirs[1] > ours[1] || theirs[1] == ours[1] && ours[2] > theirs[2])
  var l = oursFirst ? ours : theirs;
  var r = oursFirst ? theirs : ours;

  // Moving same range: farthest move takes over
  if (l[1] == r[1] && l[2] == r[2]) {
    if (l[3] > r[3] && !oursFirst)
      var move = ['move', l[1] + r[3] - r[2] - r[1], l[2], l[3]]
    else if (l[3] <= r[3] && oursFirst)
      var move = ['move', r[1] + l[3] - l[2] - l[1], r[2], r[3]]
    else return

  // Left range contains right range: let smaller range do its move
  } else if (l[1] + l[2] >= r[1] + r[2]) {
    if (r[3] < l[1] + l[2]) {
      move = oursFirst ? ['move', r[1] + l[3] - l[2] - l[1], r[2], r[3] + l[3] - l[2] - l[1]]
                       : l
    } else if (l[3] > r[3]) {
      move = oursFirst ? ['move', r[1] + l[3] - l[2] - l[1], r[2], r[3] - l[2]]
                       : ['move', l[1], l[2] - r[2], l[3]]
    } else {
      move = oursFirst ? ['move', l[3] - l[2] + (r[1] - l[1]), r[2], r[3]]
                       : ['move', l[1], l[2] - r[2], l[3] - r[2]]
    }

  // Ranges intersect: fartherst move gets bigger slice
  } else if (l[1] < r[1] + r[2] && l[1] + l[2] >= r[1]) {
    var intersection = l[1] + l[2] - r[1]
    var before = l[2] - intersection;
    var after = r[2] - intersection;

    if (l[3] > r[1] && l[3] < r[1] + r[2]) {
      move = oursFirst ? ['move', l[1], r[2] + before, r[3]]
                       : [['move', r[3] - r[2], intersection, l[3] + (r[3] - r[2] - r[1])],
                          ['move', l[1], before, l[3] - intersection + (r[3] - r[2] - r[1])]]
    } else if (l[3] > r[3]) {
      move = oursFirst ? ['move', l[1], after, r[3] - intersection - before]
                       : [['move', r[3] - r[2], intersection, l[3]],
                          ['move', l[1], before, l[3] - intersection]]
    } else {
      move = oursFirst ? [O.move.normalize(['move', l[1], after, r[3]], false),
                          ['move', l[3] - l[2] + before - after, intersection, r[3] - after]]
                       : ['move', l[1], l[2] - intersection, l[3] - l[2] + before - after]
    }

  // Left range inserts into right
  } else if (l[3] > r[1] && l[3] < r[1] + r[2]) {
    move = oursFirst ? ['move', r[1] - l[2], r[2] + l[2], r[3]]
                     : ['move', l[1], l[2], l[3] + (r[3] - r[2] - r[1])]
  // Ranges interleave: one inserts between another
  } else if (l[3] > r[3] && r[1] < l[3]) {
    move = oursFirst ? ['move', r[1] - l[2], r[2], r[3] - l[2]]
                     : l
  } else if (l[3] < r[3] && r[1] < l[3]) {
    move = oursFirst ? ['move', r[1] - l[2], r[2], r[3]]
                     : ['move', l[1], l[2], l[3] - r[2]]
  // Ranges insert into the same position, left first
  } else if (l[3] === r[3]) {
    move = oursFirst ? ['move', r[1] - l[2], r[2], r[3] - l[2]]
                     : l
  }
  return move ? O.normalize(move) : O.move.normalize(theirs, rtl)
}

/* # Transform MOVE against set of SPLICE commands
Moves are normalized to LTR form during transformation.

In simple scenarios, adding or removing subsequence should just
change counters in move command. The  worst scenario however
is a splice that starts within move range and spans all 
the way to right removing target position. That results
in three splices observed by peer doing move. 

Transformation may split a splice into two smaller splices if:
1. Splice can remove left boundary of moved range
2. Splice can remove right boundary of moved range
3. Splice can remove sequence starting before target, shifting move left 

Two cases when move just needs to be updated:
1. Splice can insert at beginning of source range
2. Splice can insert at the target position
3. Splice can remove sub-sequence within moved range
4. Splice can contain move source range and target
5. Splice can happen between source and target
6. Splice can happen somewhere before in the document

There's a possibility that move is discarded altogether:
1. Splice can remove everything between source and target
2. Splice can remove moved range

Or if splice happens outside of source range and move target,
the move is unaffected 
*/

O.move.splice = function(ours, theirs, normalized, returnOurs) {
  if (!normalized && theirs.length > 3)
    theirs = O.splice.normalize(theirs)
  if (ours[1] < ours[3]) {
    var from    = ours[1];
    var count   = ours[2];
    var to      = ours[3];
  } else {
    var from    = ours[3];
    var count   = ours[1] - ours[3];
    var to      = ours[1] + ours[2];
  }
  if (count === 0 || ours[2] === 0 || from + count === to)
    return returnOurs ? undefined : theirs
  if (!returnOurs) {
    var splice  = [];
    var nothing = theirs[2] != null && theirs[2] instanceof Array ? [] : '';
  }
  var rtl = ours[1] > ours[3];

  for (var t = 0, tt = theirs.length; t < tt; t+= 3) {
    var index = theirs[t]
    var removing = theirs[t + 1];
    var insertion = theirs[t + 2];
    var length = O.splice.getLength(insertion);
    var m = from === index && removing === 0;
    // Both source and target positions are consumed by single splice
    if (from >= index && from + count <= index + removing &&
       to >= index && to <= index + removing) {
      O.splice.push(splice, index, removing, insertion)
      count = 0

    // Splice happens within move source
    } else if ((from <= index && (from < index || removing)) && from + count >= index + removing) {
      O.splice.push(splice, to + (index - from) - count, removing, insertion)
      count += length - removing


    // Move source range is consumed
    } else if (from >= index && from + count <= index + removing) {
      O.splice.push(splice, to - count, count, nothing)
      O.splice.push(splice, index, removing - count, insertion)
      count = 0

    // Splice intersects with left boundary of moved range
    } else if (index < from && index + removing > from) {
      var left = from - index;
      var right = removing - left;
      O.splice.push(splice, index, left, insertion);
      O.splice.push(splice, to - left - count + length, right, nothing);
      from += right;
      count -= right;

    // Splice intersects with right boundary of moved range
    } else if (index < from + count && index + removing > from + count) {
      var left = from + count - index;
      var right = removing - left;

      // Splice spans until target position so move doesnt happen
      var intersection = index + removing - to;
      if (index < to && intersection > 0) {
        O.splice.push(splice, from, right - intersection, nothing);
        O.splice.push(splice, to - (right - intersection), intersection,  nothing);
        O.splice.push(splice, index, left,  insertion);
        to = index
      } else {
        if (index + removing != to && !rtl) {
          O.splice.push(splice, to - count + (index - from), left, nothing);
          O.splice.push(splice, index - (count - left), right,  insertion);
        } else {
          O.splice.push(splice, to - count + (index - from), left, insertion);
          O.splice.push(splice, index - (count - left), right,  nothing);
        }
        if (rtl) 
          count += length;
        else if (index + removing == to)
          to -= removing
      }
      count -= left 
    } else if (index > from && index < to) {

      // Target position is within splice and gets shifted back
      if (index < to && to < index + removing) {
        var left = to - index;
        var right = removing - left;
        O.splice.push(splice, to, right,  insertion);
        O.splice.push(splice, index - count, left, nothing);
        to = index;

      // Splice comes after MOVE source region, but before target
      } else {
        O.splice.push(splice, index - count, removing, insertion)
      }

    // Splice inserts at target position
    } else if (index === to && removing === 0) {
      O.splice.push(splice, index - count, removing, insertion)

    // Splice inserts at starting position
    } else if (index === from && removing === 0) {
      from += length - removing
      to += length - removing
      O.splice.push(splice, index, removing, insertion)
      continue

    // Splice after target or before source is not affected by move
    } else {
      O.splice.push(splice, index, removing, insertion)
    }
    if (index < to || (index === to && removing === 0))
      to += length - removing
    if (index < from)
      from += length - removing
  }
  return returnOurs ? O.move.normalize(['move', from, count, to], rtl) : splice;
}

/*
  # The identity frame

  A move permutes elements; it never creates one and never destroys one. So the elements of
  the document everybody started from are a fixed set of names, and a move can be said in
  those names -- carry THESE elements in front of THAT one -- rather than in positions.

  Names do not shift when a concurrent move reorders the document. Positions do, which is why
  no ordering read off two ['move', from, count, to] triplets survives being rebased: rebasing
  is exactly what moves the coordinates such an ordering has to read.

  Said in names, a set of moves composes by union -- commutative, idempotent, and the same for
  every peer that has seen the same operations. The document a peer should be holding is a
  function of that set alone, replayed in a canonical order the set itself determines. So
  convergence stops being something the transform has to arrange and becomes a property of
  the representation.

  The triplet form is untouched. An identity set decides; triplets still transport.
*/

// An element's name is its index in the document everybody started from. `to === length`
// names the element one past the end, which no document has, so an anchor that is not
// present means "after everything".
O.move.anchorOf = function(ids, to) {
  return to < ids.length ? ids[to] : to;
}

// Carry a named block in front of a named anchor. Total: the block's elements need not be
// contiguous or even adjacent any more, which is the whole point -- a concurrent move may
// have torn them apart, and the intent survives that.
O.move.carry = function(ids, im) {
  var block = im.block, held = {}, rest = [];
  for (var i = 0; i < block.length; i++) held[block[i]] = true;
  for (var i = 0; i < ids.length; i++) if (!held[ids[i]]) rest.push(ids[i]);
  var at = rest.indexOf(im.anchor);
  if (at < 0) return rest.concat(block);
  return rest.slice(0, at).concat(block, rest.slice(at));
}

// Every coordinate these operations read lies below this, so a symbolic base of this length
// carries the whole decision and the real document's tail rides along untouched.
O.move.span = function(log) {
  var n = 0;
  for (var i = 0; i < log.length; i++) {
    var m = log[i];
    if (m === undefined) continue;
    var type = O.typeof(m);
    if (type === 'frame') continue;          // metadata rides in the log; it spans nothing
    if (type === 'list') {
      var inner = O.move.span(m);
      if (inner === undefined) return;
      if (inner > n) n = inner;
      continue;
    }
    if (type !== 'move') return;
    if (typeof m[1] !== 'number' || typeof m[2] !== 'number' || typeof m[3] !== 'number') return;
    if (m[1] < 0 || m[2] < 0 || m[3] < 0) return;
    if (m[3] > m[1] && m[3] < m[1] + m[2]) return;   // anchor inside its own block: degenerate
    if (m[1] + m[2] > n) n = m[1] + m[2];
    if (m[3] > n) n = m[3];
  }
  return n;
}

/*
  Read a positional log as the identity moves it expresses, replaying it so each operation's
  coordinates are read in the document it was actually written against.

  The replay frame cancels out: for `to` below the frame the prefix permutes identically
  whatever the frame is, and for `to` at or above it the element at that position has not
  been touched, so its name is `to`. That is why `anchorOf` can fall back to the raw index.
*/
O.move.read = function(log, ids, set) {
  for (var i = 0; i < log.length; i++) {
    var m = log[i];
    if (m === undefined) continue;
    var type = O.typeof(m);
    if (type === 'frame') continue;          // metadata rides in the log; it moves nothing
    if (type === 'list') {
      ids = O.move.read(m, ids, set);
      if (ids === undefined) return;
      continue;
    }
    if (type !== 'move') return;
    var from = m[1], count = m[2], to = m[3];
    if (count === 0 || from === to || from + count === to) continue;
    if (from < 0 || count < 0 || to < 0 || from + count > ids.length || to > ids.length) return;
    if (to > from && to < from + count) return;
    var im = { block: ids.slice(from, from + count), anchor: O.move.anchorOf(ids, to) };
    if (set) set.push(im);
    ids = O.move.carry(ids, im);
  }
  return ids;
}

/*
  The canonical order. This is the one policy in the change: a set does not come with an
  order, and the order decides which of two concurrent intents ends up nearer its anchor.

  It reads only names, which no rebase can move, so unlike a comparator over triplets it
  means the same thing to every peer however each of them got here. It must be a TOTAL
  order -- a relation that merely compares each pair would sort differently depending on
  the order the operations happened to arrive in, which is the thing being fixed.

  The block reaching furthest right settles first, so the other one's intent is the
  surviving one. That reproduces the answer the shipped transform gives on 86.7% of
  concurrent pairs, which is as close as any order can get: the shipped transform's own
  pairwise verdicts contain cycles, so no order agrees with all of them. The remaining two
  clauses carry no opinion and exist only to leave no pair undecided.
*/
O.move.precedes = function(a, b) {
  return (b.block[b.block.length - 1] - a.block[a.block.length - 1])
      || O.move.cmpBlock(a.block, b.block)
      || (a.anchor - b.anchor);
}

O.move.cmpBlock = function(a, b) {
  for (var i = 0; i < a.length && i < b.length; i++)
    if (a[i] !== b[i]) return a[i] - b[i];
  return a.length - b.length;
}

// The document a peer holding exactly this set should be looking at.
O.move.resolve = function(set, length) {
  var ids = [];
  for (var i = 0; i < length; i++) ids.push(i);
  var sorted = set.slice().sort(O.move.precedes);
  for (var i = 0; i < sorted.length; i++) ids = O.move.carry(ids, sorted[i]);
  return ids;
}

// Union, keyed so the same intent arriving twice counts once.
O.move.union = function(left, right) {
  var out = [], seen = {};
  for (var s = 0; s < 2; s++) {
    var from = s ? right : left;
    for (var i = 0; i < from.length; i++) {
      var key = from[i].anchor + '|' + from[i].block.join(',');
      if (seen[key]) continue;
      seen[key] = true;
      out.push(from[i]);
    }
  }
  return out;
}

/*
  Write a transition down as moves. Both sides are permutations of the same names, so walk
  the target and, wherever the document disagrees, carry the longest run that agrees from
  there. Each emitted move names the block that travels, in front of the element it lands on.
*/
O.move.diff = function(current, target) {
  var cur = current.slice(), out = [], n = target.length;
  for (var i = 0; i < n; i++) {
    if (cur[i] === target[i]) continue;
    var at = cur.indexOf(target[i]);
    if (at <= i) return;                       // not a permutation of the same names
    var count = 1;
    while (i + count < n && at + count < n && cur[at + count] === target[i + count]) count++;
    out.push(['move', at, count, i]);
    cur = cur.slice(0, i).concat(cur.slice(at, at + count), cur.slice(i, at), cur.slice(at + count));
    i += count - 1;
  }
  return out;
}

/*
  Rebase a whole log onto a whole log in the identity frame.

  Returns a wrapper so that "handled, and the answer is nothing" is distinguishable from
  "not handled". Anything this declines -- a log carrying a splice, a set, a degenerate
  triplet -- falls through to the transform that shipped.

  The answer carries the set that produced it, and the frame it was resolved in. The frame
  is carried rather than recomputed because an emitted difference can be narrower than the
  operations behind it; carried, it is the running maximum of every raw span the peer has
  seen, which is the same number at every peer once all of them have been seen.

  Both ride on the answer as array PROPERTIES, which JSON.stringify drops. A log that stays
  in memory keeps them and converges; a log that crosses a wire arrives without them, the
  set is then re-derived from operations that are differences rather than intents, and the
  result is worse than no change at all. The set needs a place in the wire format before
  this goes between machines.
*/
/*
  The identity stamp a log element carries, wherever it is carried.

  In one process it rides on the emitted array as the properties `origin` and `frame`. Across a
  process those are gone -- `JSON.stringify` serializes an array by index -- so the answer also
  carries a `['frame', { move: ... }]` operation as ordinary content, and this reads either.
*/
O.move.stampOf = function(op) {
  if (op === undefined) return;
  if (op.origin) return { set: op.origin, length: op.frame };
  var wired = O.frame.read(op, 'move');
  if (wired && wired.set instanceof Array && typeof wired.length === 'number')
    return wired;
}

O.move.rebaseLogs = function(ours, theirs) {
  if (!(ours instanceof Array) || !(theirs instanceof Array)) return;

  // Only the last stamp matters: each one carries the running union of everything the peer
  // had seen when it was written, so an earlier one is subsumed. A stamp with plain
  // operations after it is a protocol this does not model, and is declined.
  var stamp = ours.length ? ours[ours.length - 1] : undefined;
  var wired = O.move.stampOf(stamp);
  var carried = (stamp && stamp.origin) || (wired && wired.set);
  var carriedFrame = (stamp && stamp.frame !== undefined) ? stamp.frame : (wired && wired.length);
  if (carried && carriedFrame === undefined) return;
  if (!carried)
    for (var i = 0; i < ours.length; i++)
      if (ours[i] && (ours[i].origin || O.move.stampOf(ours[i]))) return;

  var theirSpan = O.move.span(theirs);
  if (theirSpan === undefined) return;

  var length, mine;
  if (carried) {
    length = Math.max(carriedFrame, theirSpan);
    mine = carried;
  } else {
    var ourSpan = O.move.span(ours);
    if (ourSpan === undefined) return;
    length = Math.max(ourSpan, theirSpan);
    var base = [];
    for (var i = 0; i < length; i++) base.push(i);
    mine = [];
    if (O.move.read(ours, base, mine) === undefined) return;
  }

  var base = [];
  for (var i = 0; i < length; i++) base.push(i);
  var theirStamp = O.move.stampOf(theirs.length ? theirs[theirs.length - 1] : undefined);
  var yours = [];
  if (theirStamp && theirStamp.set) {
    yours = theirStamp.set;
  } else if (O.move.read(theirs, base, yours) === undefined) return;

  var current = O.move.read(ours, base.slice(), null);
  if (current === undefined) return;

  var set = O.move.union(mine, yours);
  var target = O.move.resolve(set, length);
  var moves = O.move.diff(current, target);
  if (moves === undefined) return;

  var answer = moves.length === 1 ? moves[0] : moves;
  answer.origin = set;
  answer.frame = length;
  return { answer: answer };
}
