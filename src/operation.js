var O = function(ours, theirs) {
  if (arguments.length === 1)
    return O(undefined, ours);
  if (theirs === undefined)
    return ours;
  var type = O.typeof(theirs);
  if (type)
    return O[type](ours, theirs)
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
O.invert = function(ours, theirs) {
  var type = O[O.typeof(theirs)];
  if (type.invert)
    return type.invert(ours, theirs)
}

// Combine two operations as if they were executed in order
O.compose = function(ours, theirs) {
  var oursType = O.typeof(ours);
  var theirsType = O.typeof(theirs);
  if (oursType === theirsType)
    return O.concat(ours, theirs);
  if (oursType === 'list')
    return ours.concat([theirs])
  if (theirsType === 'list')
    return [[ours]].concat(theirs);
  return [ours, theirs]
}
O.then = O.compose


// Transform two operations as if they were executed simultaneously.
// For example, if two operations were inserting text at different 
// positions in document, the latter insertion position will be offset 
// by number of characters inserted by former operation.
// Rebase can produce transformed versions of both ours and theirs operations.
// When transformed ours is composed on top of original theirs,
// the document will be at the same state as if transformed theirs
// applied after original ours. A + B' = B + A'

O.transform = function(ours, theirs, normalized, retu) {
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

// Attempt to join two operations of the same type into one
O.concat = function(ours, theirs) {
  var oursType = O.typeof(ours);
  var theirsType = O.typeof(theirs);
  var method = O[oursType];
  if (oursType === theirsType) {
    return method.concat(ours, theirs)
  } else {
    var Object = O[typwe]
  }
}

// Return type of operation used by AST node
O.typeof = function(operation, nested) {
  if (operation != null && typeof operation == 'object') {
    if (operation instanceof Array)  {
      switch (typeof operation[0]) {
        case 'number': 
          return 'splice';
        case 'string':
          return operation[0]
        case 'object':
          return 'list';
        case 'undefined':
          if (nested)
            return 'set';
          return 'list';
      }
    } else {
      return 'merge';
    }
  }

  return 'set'

}

// Compare values alphanumerically
O.compare = function(ours, theirs) {
  if (ours === theirs)
    return 0;

  if (ours == null)
    return -1;
  if (theirs == null)
    return 1;

  var oursType = typeof ours;
  if (oursType == 'object' && ours instanceof Array)
    oursType = 'array';
  var theirsType = typeof theirs;
  if (theirsType == 'object' && theirs instanceof Array)
    theirsType = 'array';

  // Comparing strings to numbers, numbers to objects, etc.
  // just sort based on the type name.
  if (oursType != theirsType) {
    return O.compare(oursType, theirsType);
  }

  switch (oursType) {
    case 'string':
      return ours.localeCompare(theirs);

    case 'number':
      if (ours < theirs)
        return -1;
      if (ours > theirs)
        return 1;
      return 0;

    case 'array':
      // First compare on length.
      var x = O.compare(ours.length, theirs.length);
      if (x != 0) return x;

      // Same length, compare on values.
      for (var i = 0; i < ours.length; i++) {
        x = O.compare(ours[i], theirs[i]);
        if (x != 0) return x;
      }

      return 0;

    case 'object':
      return JSON.stringify(ours).localeCompare(JSON.stringify(theirs));

  }
}


