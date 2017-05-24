O.set = function(ours, theirs) {
  if (arguments.length === 1)
    return O.set(undefined, ours);
  return O.set.getValue(theirs)
}

O.set.getValue = function(value) {
  if (value && value instanceof Array && value.length === 2 && value[0] === 'set') 
    return value[1];
  return value;
}

O.set.invert = function(ours, theirs) {
  return O.set.getValue(theirs);
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