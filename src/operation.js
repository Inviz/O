/*
  O implements Operational Transformational
  algorithm to work with json. Its commands
  and patchsets are represented as json as well:
  Any JSON can be seen as set of commands to create a
  an object property by property.

  At the first glance **O(ours, theirs)** accepts
  current state as first argument as operation log
  as the second, and outputs transformed object.
  If we look deeper, generates a normalized combination
  of our and their operations as if they happened sequentially.
  This property is used to compress operation logs. 

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
O.invert = function(ours, theirs) {
  var type = O[O.typeof(theirs)];
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


// Return type of operation used by AST node
O.typeof = function(operation, value) {
  if (operation != null && typeof operation == 'object') {
    if (operation instanceof Array)  {
      switch (typeof operation[0]) {
        case 'number': 
          return value ? 'set' : 'splice';
        case 'string':
          return value ? 'set' : operation[0]
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


