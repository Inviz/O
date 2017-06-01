// JSON objects are interpreted as merge commands.

// Applies operations to object keys
O.merge = function(ours, theirs, callback, allowNull, arg) {
  if (ours === undefined) {
    if (theirs === undefined) 
      return

    ours = theirs instanceof Array ? [] : {}
  }
  if (callback === undefined) 
    callback = O

  var result;
  for (var property in ours) {
    if (property in theirs)
      var value = callback(ours[property], theirs[property], arg);
    else
      var value = callback(undefined, ours[property], arg)
    if (value != null || allowNull) {
      if (result === undefined)
        result = ours instanceof Array ? [] : {};
      result[property] = value;
    }
  }

  for (var property in theirs) {
    if (property in ours) continue;

    var value = callback(ours[property], theirs[property], arg);
    if (value != null || allowNull) {
      if (result === undefined)
        result = ours instanceof Array ? [] : {};
      result[property] = value;
    }
  } 


  return result;
}
O.merge.index = 2;

O.merge.normalize = function (ours) {
  return O.merge(ours, {}, O.normalize)
}

O.merge.invert = function (context, operations) {
  var inverted = {};
  for (var property in operations) 
    inverted[property] = O.invert(operations[property], context[property]);
  return inverted
}

O.merge.concat = function(ours, theirs, callback) {
  return O.merge(ours, theirs, O, true);
}

O.merge.merge = function(ours, theirs) {
  return O.merge(ours, theirs, O.transform, true); 
}

/* Splice affects numeric indecies in merged objects. 
It either shifts numbers or removes keys altogether.*/
O.merge.splice = function(ours, theirs, normalized, returnOurs) {
  if (!normalized)
    theirs = O.splice.normalize(theirs);
  if (!returnOurs)
    return theirs;
  ours: for (var property in ours) {
    var number = parseInt(property);
    if (number === number) {
      var change = 0;
      for (var i = 0; i < theirs.length; i += 3) {
        if (change + theirs[i] <= number && change + theirs[i] + theirs[i + 1] > number) {
          continue ours;
        } else if (change + theirs[i] > number) {
          break;
        }
        change += O.splice.getShift(theirs, i);
      }
      if (result === undefined)
        var result = ours instanceof Array ? [] : {}
      result[number + change] = ours[property]
    } else {
      if (result === undefined)
        var result = ours instanceof Array ? [] : {}
      result[property] = ours[property];
    }
  }
  return result;
}

/*
  Move may remap numeric indecies in merged object
*/
O.merge.move = function(ours, theirs, normalized, returnOurs) {
  if (!returnOurs)
    return theirs;

  var move = O.move.normalize(theirs, false);
  if (!move) return;
  var result = ours instanceof Array ? [] : {}
  ours: for (var property in ours) {
    var number = parseInt(property);
    if (number === number) {
      // this index is moved
      if (move[1] <= number && move[1] + move[2] > number) {
        result[number + move[3] - move[2] - move[1]] = ours[property];
      // index comes after source but before target
      } else if (move[1] + move[2] < number && number < move[3]) {
        result[number - move[2]] = ours[property];
      } else {
        result[number] = ours[property]
      }
    } else {
      result[property] = ours[property];
    }
  }
  return result;
}

O.merge.index = 3;