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

O.move.concat = function(ours, theirs) {
 // if (ours[2] == theirs[2] && ours[3] - ours[2]  == theirs[1])
 //   return ['move', ours[1], ours[2], theirs[3]]
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
  theirs = O.move.normalize(theirs, false)
  ours = O.move.normalize(ours, false)
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
  //if (move && move[0] === 'move')
  //  return O.move.normalize(move, rtl)
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
  if (normalized === 'untransform') {
    if (theirs && theirs.length > 3) {
      var list = [];
      var o = ours;
      for (var t = theirs.length; (t -= 3) >= 0;) {
        var old = o;
        if (o !== undefined) {
          o = O.move.splice(o, [theirs[t], theirs[t + 1], theirs[t + 2]], true, true);
          list.push(O.move.splice(old, [theirs[t], theirs[t + 1], theirs[t + 2]]))
        } else {
          list.push([theirs[t], theirs[t + 1], theirs[t + 2]])
        }
      }
      return returnOurs ? o : list
    }
  }
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
  if (normalized === false)
    var quick = true;

  theirs: for (var t = 0, tt = theirs.length; t < tt; t+= 3) {
    var index = theirs[t]
    var removing = theirs[t + 1];
    var insertion = theirs[t + 2];
    var length = O.splice.getLength(insertion);
    var m = from === index && removing === 0;
    // Both source and target positions are consumed by single splice
    if (from >= index && from + count <= index + removing &&
       to >= index && to <= index + removing) {
      O.splice.push(splice, index, removing, insertion, quick)
      count = 0

    // Splice happens within move source
    } else if ((from <= index && (from < index || removing)) && from + count >= index + removing) {
      O.splice.push(splice, to + (index - from) - count, removing, insertion, quick)
      count += length - removing


    // Move source range is consumed
    } else if (from >= index && from + count <= index + removing) {
      O.splice.push(splice, to - count, count, nothing, quick)
      O.splice.push(splice, index, removing - count, insertion, quick)
      count = 0

    // Splice intersects with left boundary of moved range
    } else if (index < from && index + removing > from) {
      var left = from - index;
      var right = removing - left;
      O.splice.push(splice, index, left, insertion, quick);
      O.splice.push(splice, to - left - count + length, right, nothing, quick);
      from += right;
      count -= right;

    // Splice intersects with right boundary of moved range
    } else if (index < from + count && index + removing > from + count) {
      var left = from + count - index;
      var right = removing - left;

      // Splice spans until target position so move doesnt happen
      var intersection = index + removing - to;
      if (index < to && intersection > 0) {
        O.splice.push(splice, from, right - intersection, nothing, quick);
        O.splice.push(splice, to - (right - intersection), intersection,  nothing, quick);
        O.splice.push(splice, index, left,  insertion, quick);
        to = index
      } else {
        if (index + removing != to && !rtl) {
          O.splice.push(splice, to - count + (index - from), left, nothing, quick);
          O.splice.push(splice, index - (count - left), right,  insertion, quick);
        } else {
          O.splice.push(splice, to - count + (index - from), left, insertion, quick);
          O.splice.push(splice, index - (count - left), right,  nothing, quick);
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
        O.splice.push(splice, to, right,  insertion, quick);
        O.splice.push(splice, index - count, left, nothing, quick);
        to = index;

      // Splice comes after MOVE source region, but before target
      } else {
        O.splice.push(splice, index - count, removing, insertion, quick)
      }

    // Splice inserts at target position
    } else if (index === to && removing === 0) {
      O.splice.push(splice, index - count, removing, insertion, quick)

    // Splice inserts at starting position
    } else if (index === from && removing === 0) {
      from += length - removing
      to += length - removing
      O.splice.push(splice, index, removing, insertion, quick)
      continue

    // Splice after target or before source is not affected by move
    } else {
      O.splice.push(splice, index, removing, insertion, quick)
    }
    if (index < to || (index === to && removing === 0))
      to += length - removing
    if (index < from)
      from += length - removing
  }
  if (splice && quick && splice.length == 1)
    splice = splice[0]
  return returnOurs ? O.move.normalize(['move', from, count, to], rtl) : splice;
}