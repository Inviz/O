// ['move', from : int, count: int, to : int]
O.move = function(ours, theirs) {
  if (theirs[1] < theirs[3])
    return ours.slice(0, theirs[1]).concat(
      ours.slice(theirs[1]+theirs[2], theirs[3]),
      ours.slice(theirs[1], theirs[1] + theirs[2]),
      ours.slice(theirs[3]));
  else
    return ours.slice(0, theirs[3]).concat(
      ours.slice(theirs[1], theirs[1] + theirs[2]),
      ours.slice(theirs[3], theirs[1]),
      ours.slice(theirs[1] + theirs[2]));
}

O.move.normalize = function(ours, makeRTL) {
  if (ours[1] === ours[3])
    return
  if (ours[2] === 0)
    return;
  if (ours[1] < ours[3]) {
    if (ours[1] + ours[2] === ours[3])
      return;
    if (makeRTL) {
      return ['move', ours[1] + ours[2], ours[3] - ours[1] - ours[2], ours[1]]
    }
  } else {
    if (ours[1] - ours[2] === ours[3])
      return;
  }
  return ours;
}

O.move.invert = function(ours) {
  if (ours[2] > ours[0])
    return ['move', ours[2] - ours[1], ours[1], ours[0]];
  else
    return ['move', ours[2], ours[1], ours[0] + ours[1]];
}

O.move.concat = function(ours, theirs) {
  if (ours[2] == theirs[2] && ours[3] == theirs[3])
    return ['move', ours[1], ours[2], theirs[3]]
}


O.move.move = function() {

}

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
  if (!returnOurs) 
    var splice  = [];
  var rtl = ours[1] > ours[3];

  for (var t = 0, tt = theirs.length; t < tt; t+= 3) {
    var index = theirs[t]
    var removing = theirs[t + 1];
    var insertion = theirs[t + 2];
    var length = O.splice.getLength(insertion);
    var change = length - removing;

    // both source and target positions are consumed by single splice
    if (from >= index && from + count <= index + removing &&
       to >= index && to <= index + removing) {
      O.splice.push(splice, index, removing, insertion)
      count = 0

    // move source range is consumed
    } else if (from >= index && from + count <= index + removing) {
      O.splice.push(splice, to - count, count, '')
      O.splice.push(splice, index, removing - count, insertion)
      count = 0

    // splice happens within move source
    } else if (from <= index && from + count >= index + removing) {
      O.splice.push(splice, to + (index - from) - count, removing, insertion)
      count += change

    // Splice intersects with left boundary of moved range
    } else if (index < from && index + removing > from) {
      var left = from - index;
      var right = removing - left;
      O.splice.push(splice, index, left, insertion);
      O.splice.push(splice, to - left - count + length, right, '');
      from += right;
      count -= right;

    // Splice intersects with right boundary of moved range
    } else if (index < from + count && index + removing > from + count) {
      var left = from + count - index;
      var right = removing - left;

      // Splice spans until target position so move doesnt happen
      var intersection = index + removing - to;
      if (index < to && intersection > 0) {
        O.splice.push(splice, from, right - intersection, '');
        O.splice.push(splice, to - (right - intersection), intersection,  '');
        O.splice.push(splice, index, left,  insertion);
        to = index
      } else {
        if (index + removing != to && !rtl) {
          O.splice.push(splice, to - count + (index - from), left, '');
          O.splice.push(splice, index - (count - left), right,  insertion);
        } else {
          O.splice.push(splice, to - count + (index - from), left, insertion);
          O.splice.push(splice, index - (count - left), right,  '');
        }
        if (rtl) 
          count += length;
        else if (index + removing == to)
          to -= removing
      }
      count -= left 
      
    // Splice comes after MOVE source region, but before target
    } else if (index > from && index < to) {

      // Target position is within splice and gets shifted back
      if (index < to && to < index + removing) {
        var left = to - index;
        var right = removing - left;
        O.splice.push(splice, to, right,  insertion);
        O.splice.push(splice, index - count, left, '');
        to = index;
      } else {
        O.splice.push(splice, index - count, removing, insertion)
      }

    // Splice after target or before source is not affected by move
    } else {
      O.splice.push(splice, index, removing, insertion)
    }
    if (index < from)
      from += change
    if (index < to)
      to += change
  }
  return returnOurs ? O.move.normalize(['move', from, count, to], rtl) : splice;
}