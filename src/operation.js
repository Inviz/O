/*
  O implements Operational Transformational
  algorithm to work with json. Its commands
  and patchsets are represented as json as well:
  Any JSON can be seen as set of commands to create a
  that JSON object property by property.

  At the first glance **O(ours, theirs)** accepts
  current state as first argument as operation log
  as the second, and outputs transformed object.
  If we look deeper, O generates a normalized combination
  of our and their operations as if they happened sequentially.
  Our state does not have to be fully resolved:
  We can have a set of operations on our side as well.
  This property is used to compress operation logs

*/

var O = function(ours, theirs, scoped) {
  if (arguments.length === 1)
    return O(undefined, ours);
  if (theirs === undefined)
    return ours;
  var type = O.typeof(theirs);
  if (type === undefined) return ours;
  switch (O.typeof(ours, !scoped)) {
    case 'set': case 'merge':
      if (!O[type]) {
        O.typeof(ours, !scoped)
      }
      return O[type](ours, theirs)
    case type:
      return O[type].concat(ours, theirs);
    case 'list':
      return ours.concat([theirs])
    default:
      if (type === 'list')
        return [[ours]].concat(theirs);
      return [ours, theirs];
  }
}
this.O = O;

// Simplify operation if it's possible
O.normalize = function(ours, argument) {
  var type = O[O.typeof(ours)];
  if (type.normalize)
    return type.normalize(ours, argument)
  return ours;
}

// Produce operation that undoes the given one
O.invert = function(ours, theirs, top) {
  var type = O[O.typeof(theirs, top)];
  if (type.invert)
    return type.invert(ours, theirs)
}

/*
  Transform two operations as if they were executed simultaneously.
  For example, if two operations were inserting text at different 
  positions in document, the latter insertion position will be offset 
  by number of characters inserted by former operation.
  Rebase can produce transformed versions of both ours and theirs operations.
  When transformed ours is composed on top of original theirs,
  the document will be at the same state as if transformed theirs
  applied after original ours. A + B' = B + A'
*/


O.transform = function(ours, theirs, normalized) {
  if (theirs === undefined)
    return undefined;
  if (ours === undefined)
    return theirs;

  // Use hardcoded transform logic
  var theirsType = O.typeof(theirs);
  var oursType  = O.typeof(ours);
  var method = O[oursType][theirsType]
  if (method)
    return O[oursType][theirsType](ours, theirs, normalized);

  var method = O[theirsType][oursType];
  if (method && method.length === 4)
    return O[theirsType][oursType](theirs, ours, normalized, true);

  // Fall back to catch-all transform logic
  if (O[oursType].transform)
    return O[oursType].transform(ours, theirs, normalized);

  if (O[theirsType].transform)
    return O[theirsType].transform(theirs, ours, normalized, true);
}

O.with = O.transform;


/*
  The names O dispatches on. A string-headed array is an operation only when its head is
  one of these; any other array is data, so ['approved','rejected'] is two strings rather
  than a call to an operation named "approved". Register a new operation by adding it here.

  The test cannot be `O[name] != null`: O also carries normalize, invert, transform, with,
  typeof and compare, and none of those is an operation.
*/
O.operations = {
  'set': true, 'list': true, 'splice': true, 'merge': true, 'move': true, 'rot': true,
  'frame': true,
  '+': true, '-': true, '*': true, '/': true, '^': true
};

/*
  # frame -- the wire format for an operation's coordinate frame

  `splice` and `move` both converge by deciding in a shared coordinate frame rather than in the
  live document, and both have to carry that frame alongside the answer they emit. Hung on the
  answer as an array property it does not survive `JSON.stringify`, which serializes an array by
  index and drops every named property, enumerable or not. So an answer that crosses a process
  arrives stripped and the peers disagree again -- by measurement, worse than if neither had
  been changed at all.

  A frame is therefore an ORDINARY OPERATION, `['frame', payload]`, appended to the list an
  answer is emitted as. Being array content it serializes like any other operation, and being a
  registered operation it applies (as the identity), transforms (inertly) and normalizes without
  any caller knowing it is there.

  One envelope, one slot per operator: `payload.splice` is an origin-frame edit set,
  `payload.move` an identity set with the frame length it was resolved in. A log that carries no
  frame reads exactly as it did before.

  The cost of registering a name: `['frame', x]` is now an operation rather than the two-element
  array of strings it used to be. That is the same cost every name in `O.operations` carries.
*/
O.frame = function(value, op) {
  return value;      // a frame states where an answer was decided; it edits nothing
}

// Sorts above every editing operation, so `O.list.normalize` never tries to reorder one past
// an edit -- there is no inverse to reorder it by.
O.frame.index = 4;

O.frame.normalize = function(ours) {
  return (ours && ours.length > 1 && ours[1] != null) ? ours : undefined;
}

O.frame.invert = function() {
  return undefined;  // nothing to undo
}

// Inert in both directions: a frame rebases nothing and nothing rebases a frame. Reached only
// as a backstop -- the operators strip frames before folding and stamp them after.
O.frame.transform = function(ours, theirs, normalized, returnOurs) {
  return theirs;
}

// Is this log element a frame?
O.frame.is = function(op) {
  return op instanceof Array && op[0] === 'frame' && op.length > 1;
}

/*
  Read one operator's slot out of the frame a log carries. The LAST frame wins: each stamp holds
  the running union of everything its peer had seen when it was written, so an earlier one is
  subsumed.
*/
O.frame.read = function(log, slot) {
  if (!(log instanceof Array)) return;
  for (var i = log.length; i--;)
    if (O.frame.is(log[i]))
      return log[i][1] ? log[i][1][slot] : undefined;
}

// The log without its frames. Returns the SAME array when there is nothing to strip, so an
// unframed log takes no copy and no behaviour change.
O.frame.strip = function(log) {
  if (!(log instanceof Array)) return log;
  var i = log.length;
  while (i--) if (O.frame.is(log[i])) break;
  if (i < 0) return log;
  var out = [];
  for (var j = 0; j < log.length; j++)
    if (!O.frame.is(log[j])) out.push(log[j]);
  return out;
}

/*
  The inverse of `stamp`: the answer without its frame, in the form it was emitted in. Exactly
  one operation left means the answer was one operation, because that is the only shape `stamp`
  wraps.
*/
O.frame.unstamp = function(op) {
  var bare = O.frame.strip(op);
  if (bare === op) return op;
  return bare.length === 1 ? bare[0] : bare;
}

/*
  Emit `answer` as a list that carries `payload`. The answer keeps its ordinary form -- the
  frame decides, the operations transport -- and the list is appended to a log exactly as an
  unstamped answer is.
*/
O.frame.stamp = function(answer, payload) {
  if (answer === undefined || payload === undefined) return answer;
  var list = (O.typeof(answer) === 'list') ? O.frame.strip(answer).slice() : [answer];
  list.push(['frame', payload]);
  return list;
}

// Return type of operation used by AST node
O.typeof = function(operation, value) {
  if (operation != null && typeof operation == 'object') {
    if (operation instanceof Array)  {
      switch (typeof operation[0]) {
        case 'number': 
          return value ? 'set' : 'splice';
        case 'string':
          return (value || !O.operations[operation[0]]) ? 'set' : operation[0]
        case 'undefined':
          return value ? 'set' : 'list';
        case 'object':
          return operation[0] instanceof Array ? 'list' : 'set';
      }
    } else {
      return 'merge';
    }
  }

  return 'set'

}

/*
  Rank of a value's kind. Ordering across kinds is settled here, before any comparison
  within a kind, so no pair reaches a branch that does not understand it.

  Ranking undefined and null lowest is the one part that is a choice rather than a
  necessity: it means a concurrent clear loses to a concurrent write instead of
  destroying it.
*/
O.rank = function(value) {
  if (value === undefined) return 0;
  if (value === null)      return 1;
  switch (typeof value) {
    case 'boolean': return 2;
    case 'number':  return value !== value ? 3 : 4;
    case 'string':  return 5;
    case 'object':  return value instanceof Array ? 6 : 7;
    default:        return 8;
  }
}

/*
  A total order over values: defined on every pair, antisymmetric, transitive, and the same
  on every machine. Two peers use it to pick the same winner without talking, so a pair it
  declines to order, or orders differently under a different locale, is a divergence.

  Strings compare by code unit rather than through localeCompare, whose collation is
  locale-dependent. Code-unit order is also the ASCII order O['+'].transform already assumes
  when it tie-breaks concurrent math by operator name.
*/
O.compare = function(ours, theirs) {
  var ro = O.rank(ours), rt = O.rank(theirs);
  if (ro !== rt)
    return ro < rt ? -1 : 1;

  switch (ro) {
    case 2:
      return ours === theirs ? 0 : (ours ? 1 : -1);

    case 4: case 5:
      return ours === theirs ? 0 : (ours < theirs ? -1 : 1);

    case 6:
      if (ours.length !== theirs.length)
        return ours.length < theirs.length ? -1 : 1;
      for (var i = 0; i < ours.length; i++) {
        var result = O.compare(ours[i], theirs[i]);
        if (result !== 0)
          return result;
      }
      return 0;

    case 7:
      var ourKeys = Object.keys(ours).sort(), theirKeys = Object.keys(theirs).sort();
      var result = O.compare(ourKeys, theirKeys);
      if (result !== 0)
        return result;
      for (var i = 0; i < ourKeys.length; i++) {
        result = O.compare(ours[ourKeys[i]], theirs[ourKeys[i]]);
        if (result !== 0)
          return result;
      }
      return 0;
  }

  // Same rank with nothing left to tell apart: undefined, null, NaN, and non-JSON kinds.
  return 0;
}
