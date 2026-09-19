// perform list operations over document
O.list = function (left, right) {
  var context = left;
  for (var i = 0; i < right.length; i++)
    context = O(context, right[i]);
  return context;
}

O.list.concat = function(left, right) {
  return left.concat(right);
}

/*
  OT is rumored to be unpredictable. It is only true 
  if operation logs are not normalized and compressed. 

  What seems to be unpredictable can often be attributed
  to parts of operation logs which have been undone,
  overwritten or removed away, so they do not affect 
  the final result. An example would be a change to
  delete whole contents of a document together
  with undo command. Naive implementation would send 
  both commands, and the sheer destruction power of 
  the former would consume all concurrent changes 
  by other peers. 

  Instead OT runtime should only send operations
  that actually contribute changes to the final 
  document. Normalized lists are sorted so operations
  match following order:
  
  1. **set** can consume any other operation, removing list altogether
  2. **splice** can be added into a normalized splice set with no intersections
  3. **merge** ops concatenate together naturally into a bigger object
  4. **move** can turn into no-op when splice bubbles up in the list
  
  Reordering of two operations involves transforming
  left against inversed version of right. In this algorithm
  only `merge` and `move` operations need to be inversed, and they
  do not require current state for inversion, unlike inversion of splice 
*/
O.list.normalize = function(ours) {
  var list;
  for (var i = 0; i < ours.length; i++) {
    var o = ours[i];
    if (o === undefined) 
      continue;
    var type = O.typeof(o);
    // set operations restart log
    if (list === undefined || type === 'set') {
      list = [o]
      continue;
    }
    var index = O[type].index;
    for (var j = list.length; j--;) {
      var other = O.typeof(list[j]);
      var l = list[j];
      // reorder operations by rebasing right against inverse of left
      if (index < O[other].index) {
        var inverse = O.invert(undefined, l);
        var old = o;
        o = O.transform(inverse, o)
        l = O.transform(o, l)
        if (l === undefined)
          list.splice(j, 1)
        else
          list[j] = l;
        if (j === 0)
          list.splice(j, 0, o);
      // attempt to concatenate operations of the same type
      } else {
        var concatenated = O(l, o, true);
        if (concatenated === undefined)  {
          list.splice(j, 1);
        } else if (concatenated instanceof Array 
                && concatenated[0] === l 
                && concatenated[1] === o) {
          list.splice(j + 1, 0, o)
        } else {
          list[j] = concatenated
        }
        break;
      }
    }
  }
  if (list !== undefined && list.length == 1)
    return list[0];
  return list;
}


/*
  List transformation is one of the core concepts of OT,
  but it actually is pretty simple. Their ops transform 
  against each of ours in order. If their op is a list,
  our operations need to be transformed on each step as well.
*/

// Compose a LOG of splice operations into the single splice list it is equivalent to.
//
// `O.list.transform` folds operation against operation. That is correct in live coordinates and
// fatal in origin coordinates: an operation's indices are relative to the operations before it
// in the log, so handed over on its own it has no position in the document peers share. Folding
// whole composed logs keeps every coordinate in one frame.
/*
  One log element as the splice list it is equivalent to, with its origin frame restored from
  the wire when it crossed one.

  `null` = nothing to contribute (an empty normalization, or a frame, which is metadata).
  `undefined` = not this path (the element is a move, a set, or a log holding one).
*/
O.list.composeElement = function(op) {
  if (op === undefined) return null;
  var type = O.typeof(op);
  if (type === 'frame') return null;
  if (type === 'list') {
    // A STAMPED answer only: its operations, then the frame they were decided in. An ordinary
    // nested list is declined exactly as it was before the wire format existed.
    var E = O.frame.read(op, 'splice');
    if (!E) return undefined;
    var inner = O.list.compose(O.frame.strip(op));
    return inner === undefined ? undefined : O.splice.attach(inner, E);
  }
  if (type !== 'splice') return undefined;        // a move permutes positions: not this path
  var norm = O.splice.normalize(op);
  return norm === undefined ? null : norm;
}

O.list.compose = function(log) {
  var out;
  for (var i = 0; i < log.length; i++) {
    var norm = O.list.composeElement(log[i]);
    if (norm === undefined) return;
    if (norm === null) continue;
    if (out === undefined) {
      out = norm.slice();
      if (norm._E) O.splice.attach(out, norm._E);   // `slice` keeps indices and drops properties
      O.splice.frame(out);
    } else {
      out = O.splice.concat(out, norm);
    }
  }
  return out === undefined ? out : O.splice.frame(out);
}

O.list.transform = function (ours, theirs, normalized, returnOurs) {
  if (!returnOurs && ours instanceof Array && O.typeof(ours) === 'list'
                  && theirs instanceof Array && O.typeof(theirs) === 'list') {
    var co = O.list.compose(ours), ct = O.list.compose(theirs);
    if (co !== undefined && ct !== undefined) {
      var spliced = O.splice.splice(co, ct, true);
      // The origin frame rides out as array content, so the answer keeps it across a process.
      return (spliced !== undefined && spliced._E)
        ? O.frame.stamp(spliced, { splice: spliced._E })
        : spliced;
    }
  }
  if (O.typeof(theirs) != 'list') {
    // Reorder arguments to return our side after transformation
    if (returnOurs) {
      var swap = ours
      ours = [theirs]
      theirs = swap

    // Transform their single op against each op in our list
    } else {
      var list = theirs;
      for (var i = 0; i < ours.length; i++) 
        list = O.transform(ours[i], list);
      return list;
    }
  }

  /*
    Two whole move logs meet in the identity frame, where composition is set union and the
    answer is the difference between the document this peer holds and the one the union
    names. Every other pairing -- a log carrying a splice or a set, an operation handed over
    on its own, a side asking for its own half back -- goes to the transform below.
  */
  if (!returnOurs) {
    var rebased = O.move.rebaseLogs(ours, theirs);
    if (rebased !== undefined)
      // The identity set rides out as array content, so the answer keeps it across a process.
      return O.frame.stamp(rebased.answer,
        { move: { set: rebased.answer.origin, length: rebased.answer.frame } });
  }

  // Neither frame was read, so neither is in use: fold the edits alone.
  ours = O.frame.strip(ours);
  theirs = O.frame.strip(theirs);

  // Transform each of our ops against each of theirs 2-ways
  var list = theirs.slice();
  for (var i = 0; i < ours.length; i++) {
    var o = ours[i];
    for (var j = 0; j < list.length; j++) {
      var listed = list[j]
      list[j] = O.transform(o, list[j])
      o = O.transform(listed, o)
    }
  }

  return O.list.normalize(list);
}

O.list.invert = function (ours, theirs) {
  var list = [];
  var context = ours;
  for (var i = 0; i < theirs.length; i++) {
    var inverted = O.invert(context, theirs[i]);
    if (inverted !== undefined) {
      list.unshift(inverted);
      context = O(context, theirs[i]);
    }
  }
  return list;
}
