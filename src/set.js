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

O.set.transform = function(ours, theirs, normalized, returnOurs) {
  if (O.typeof(theirs) === 'set') {
    switch (O.compare(ours, theirs)) {
      // equal sets are already resolved
      case 0:
        return undefined;

      // pick the value that comes first alphanumerically
      case -1:
        return returnOurs ? theirs : undefined;

    }
  }
  return ours;
}