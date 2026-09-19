O.set = function(ours, theirs) {
  if (arguments.length === 1)
    return O.set(undefined, ours);
  return O.set.getValue(theirs)
}
O.set.index = 0;

O.set.getValue = function(value) {
  if (value && value instanceof Array && value.length === 2 && value[0] === 'set') 
    return value[1];
  return value;
}

O.set.invert = function(ours, theirs) {
  if (theirs && theirs instanceof Array && theirs.length === 2 && theirs[0] === 'set') 
    return ['set', O.set.getValue(ours)]
  else
    return O.set.getValue(ours)
}

O.set.concat = function (ours, theirs) {
  return theirs;
}

// The total order lives on O.compare, which set only has to feed the value each operation
// carries rather than its wire form.
O.set.rank  = O.rank;
O.set.order = O.compare;

// Order two set operations by the value each carries, so that ['set', v] and a bare v
// rank identically rather than by wire form.
O.set.compare = function(ours, theirs) {
  return O.set.order(O.set.getValue(ours), O.set.getValue(theirs));
}

/*
  Two peers assigning different values to the same position cannot both be honoured, and
  nothing carried by a set says which assignment came later. The tie is broken by the values
  themselves, under a total order, so both peers reach the same winner without talking:
  the higher value survives. Ranking undefined and null lowest is the part of that order
  which is a choice rather than a necessity -- it means a concurrent clear loses to a
  concurrent write instead of destroying it.

  A transform returns what THEIRS contributes, rebased. So the winner is emitted only by the
  peer that does not already hold it: theirs when theirs wins, nothing when ours wins or the
  two already agree. Returning ours would hand a peer back an operation it has applied.

  O.transform binds the set operation to `ours` from either direction -- directly when ours is
  the set, and through the swapped call at the end of O.transform when theirs is. So returning
  `ours` against a non-set is both sides agreeing that the set clobbers the other operation.
*/
O.set.transform = function(ours, theirs, normalized, returnOurs) {
  if (O.typeof(theirs) !== 'set')
    return ours;

  return O.set.compare(ours, theirs) < 0 ? theirs : undefined;
}
