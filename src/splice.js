/*
Early OT adopters used DEL/INS/REPLACE/RETAIN
commands which are easier to implement, but make
runtime processing more complex.
It was difficult to compress and normalize big patches,
especially so when interleaved with collaborative metadata. 
It is even harder to predict outcomes of difficult multi-peer
situations.

However there's a great insight in `jot` library, that
all those operations can be seen as `splice(from, to, replacement)`
command. Furthermore, any history of text/sequence editing 
operations can be simplified to a list of non-intersecting
splices. It makes resolving patches easier and gives additional
leverage to keep semantic intent of peers preserved, by taking
out the effect of unobserved changes.
*/

/*
Splice operations can be concatenated into a list, where
each expression needs all previous expressions applied
to the state for absolute indecies to point to correct positions.

Splice list operations don't necessarily have to be sorted
from left to right and can intersect each other, 
O.splice will still produce proper result.
However to transform and concatenate splice lists, 
they are sorted and normalized to remove intersections.
*/
O.splice = function(ours, theirs, normalized) {
  if (ours)
    var result = ours.slice();
  else if (theirs[2] instanceof Array)
    var result = []
  else
    var result = '';
  for (var i = 0, j = theirs.length; i < j; i += 3) { 
    var removed   = result.slice(theirs[i], theirs[i] + theirs[i + 1]);
    var type      = O.splice.typeof(removed, theirs[i + 2])
    var value     = O[type](removed, theirs[i + 2])
    if (result instanceof Array) {
      result.splice.apply(result, [theirs[i], theirs[i + 1]].concat(value))
    } else {
      result = result.slice(0, theirs[i]) + value + result.slice(theirs[i] + theirs[i + 1])
    }
  }
  return result;
}
O.splice.index = 1;

// Produce an optimal sorted set of non-empty 
// spliced ranges without intersections
O.splice.normalize = function(ours, once) {
  var result = [];
  for (var i = 0, j = ours.length; i < j; i += 3)
    O.splice.push(result, ours[i], ours[i + 1], ours[i + 2]);
  if (result.length) 
    return result;
}


O.splice.concat = function(ours, theirs) {
  var result = ours.slice();
  for (var t = 0, tt = theirs.length; t < tt; t += 3)
    O.splice.push(result, theirs[t], theirs[t + 1], theirs[t + 2])
  return result;
}

// Push a splice into a list, simplifying all intersections
/*
  Patches captured in real world applications can be messy and 
  have extra intermediate commands that are not visible in final result,
  like when a writer rewords parts of the sentence a few times.

  `O.splice.push` can be used to add SPLICE command into a list.
  That effectively normalizes commands on insertion.
  It means that the log is always compacted and splices 
  are sorted in order of appearance in document without any intersection.
  It is necessary for effective transformations.
*/
O.splice.push = function(result, index, removing, insertion) {
  if (!result) 
    return;
  var diff  = O.splice.getLength(insertion) - removing;

  // skip zero-length chunks
  if (removing === 0 && diff === 0)
    return

  // find a place in array in case ranges aren't ordered
  for (var o = result.length; o; o -= 3)
    if (result[o - 3] <= index)
      break;

  var skipping  = 0;
  var target = o;
  var deletion = removing;
  var newIndex = index;

  // check if range start intersections with another range
  if (o) {
    var p = o - 3;
    var removed = result[p + 1]
    var shift = O.splice.getLength(result[p + 2]) - removed
    var inserted = shift + removed;
    var distance = index - result[p];
    // new splice deletes previous insertion
    if (distance == 0 && inserted <= removing) {
      deletion -= shift;
      target = p;

    // prepend new value
    } else if (distance === 0) {
      insertion = O.splice.value(result[p + 2], 0, removing, insertion)
      deletion = removed;
      target = p;

    // append value
    } else if (inserted == distance) {
      deletion += removed;
      insertion = O.splice.value(insertion, 0, 0, result[p + 2])
      target = p;

    // splice in the new value
    } else if (inserted >= distance + removing) {
      insertion = O.splice.value(result[p + 2], distance, removing, insertion)
      deletion = removed;
      target = p;

    // replace end of inserted value
    } else if (inserted > distance) {
      insertion = O.splice.value(result[p + 2], distance, inserted - distance, insertion)
      deletion += removed - (inserted - distance)
      target = p;
    }
    if (target === p) {
      skipping += 3;
      newIndex = result[p];
    }
  }

  // iterate ranges to the right that may be removed or shifted
  for (var n = target + skipping; n < result.length; n += 3) {
    var intersection = index + removing - result[n]; 
    if (intersection > 0 && removing > 0) {
      var shift = O.splice.getShift(result, n)
      var removed = result[n + 1]
      var inserted = shift + removed;

      // insertion is consumed
      if (inserted <= intersection) {
        deletion -= shift

      // insertion is concatenated
      } else {
        insertion = O.splice.value(result[n + 2], 0, intersection, insertion)
        deletion += removed - intersection
      }
      skipping += 3;
    }

    // shift following positions to propagate the change
    result[n] += diff;
  }

  // prepend resulting range to another if it comes right after
  if (result[skipping + target] === newIndex + O.splice.getLength(insertion)) {
    deletion += result[skipping + target + 1] 
    insertion = O.splice.value(result[skipping + target + 2], 0, 0, insertion)
    skipping += 3;
  }

  // drop the range if it resulted to empty operation
  if (deletion === 0 && O.splice.getLength(insertion) === 0) {
    var drop = true;
  } else {
    skipping -= 3;
  }

  // Hottest performance spot in the library: 
  // custom Array.splice reimplementation doubles total throughput
  if (skipping > 0) {
    for (var j = target + skipping; j < result.length; j++)
      result[j - skipping] = result[j]
    result.length -= skipping;
  } else if (skipping < 0)
    for (var j = result.length; --j >= target;)
      result[j - skipping] = result[j]

  if (!drop) {
    result[target]     = newIndex
    result[target + 1] = deletion
    result[target + 2] = insertion
  }
  return result;
}

O.splice.value = function(ours, offset, length, theirs) {
  var oursType = O.splice.typeof(ours);
  var theirsType = O.splice.typeof(theirs);
  if (oursType == theirsType && oursType === 'set') {
    if (offset != null)
      return ours.slice(0, offset).concat(theirs, ours.slice(offset + length))
    return ours.concat(theirs)
  }
  return O(ours, theirs)
}

O.splice.getValue = function(value) {
  if (O.splice.typeof(value) === 'list') {
    return O.list(value);
  }
  return value
}
O.splice.getLength = function(value) {
  value = O.splice.getValue(value);
  if (typeof value == 'number')
    return String(value).length
  return value.length
}
O.splice.getShift = function(ours, offset) {
  if (typeof offset != 'number')
    offset = 0;
  return O.splice.getLength(ours[offset + 2]) - ours[offset + 1]
}

// Splice treats third attribute as set value.
// If that value is an array, it is concatenated into
// the final result. However array wrapped in array
// is still treated like a list of operations, and
// can be used to customize splice logic
O.splice.typeof = function(ours, theirs) {
  // list of one operation
  if (theirs 
    && theirs instanceof Array 
    && theirs[0] 
    && theirs[0] instanceof Array)
    return 'list'
  return 'set'
}


O.splice.invert = function (ours, theirs, normalized) {
  if (!normalized) 
    theirs = O.splice.normalize(theirs)
  if (theirs === undefined)
    return
  var inverse = Array(theirs.length);
  var diff = 0;
  for (var i = 0, j = theirs.length; i < j; i += 3) {
    var offset    = theirs[i];
    var length    = theirs[i + 1];
    var operation = theirs[i + 2];
    inverse[i] = diff + theirs[i]
    inverse[i + 1] = O.splice.getLength(theirs[i + 2])
    inverse[i + 2] = O.invert(ours.slice(inverse[i], inverse[i] + theirs[i + 1]), theirs[i + 2], true, true)
    diff += O.splice.getShift(inverse, i)
  }
  return inverse
}

O.splice.compare = function(ours, l, theirs, r) {
  //if (ours[l + 1] > theirs[r + 1])
  //  return 1;
  //if (ours[l + 1] < theirs[r + 1])
  //  return -1;
  return O.compare(O.splice.getValue(ours[l + 2]), O.splice.getValue(theirs[r + 2]))
}

/* # Transform SPLICE set against another SPLICE set
Most of the time, splices just push each other changing the counters.
Though they also can get into conflicting situations:
1. Splice can completely remove another
2. Splices can patch sequences starting at the same position
3. Splices can patch intersecting sequences
4. Splices can insert at the position

To transform splice lists against each other in one pass, they need
to be normalized first to simplify all intersecting ranges.
*/
O.splice.splice = function(ours, theirs, normalized, safe) {
  if (!normalized) {
    ours = O.splice.normalize(ours)
    theirs = O.splice.normalize(theirs)
  }
  if (ours === undefined)
    return theirs;
  if (theirs === undefined)
    return

  var result = [];
  var shiftO = 0;
  var shiftT = 0;
  var offsetT = 0;
  theirs: for (var t = 0, o = 0, tt = theirs.length; t < tt; t += 3) {
    var index     = theirs[t];
    var removing  = theirs[t + 1];
    var insertion = theirs[t + 2];
    var behind, ahead; 
    var left, right, middle;
    // apply intersecting ranges
    for (;ours.length != o &&
          ((behind = shiftT + index - shiftO - ours[o]) >= 0) +
          ((ahead  = shiftT + index + removing - shiftO - ours[o]) >= 0); o+= 3) {

        var left   = Math.abs(behind);
        var right  = Math.abs(ahead - ours[o + 1]);
        var middle = Math.max(shiftT + index + removing, shiftO + ours[o] + ours[o + 1]) -
                     Math.min(shiftT + index, shiftO + ours[o]) - left - right;
      

      if (left > 0 || behind === 0) {
        if (behind >= 0) {
          // put their insertion before ours
          if (insertion && O.splice.compare(ours, o, theirs, t) >= 0) {
            result.push(shiftO + ours[o], 0, insertion)
            shiftT += O.splice.getLength(insertion)
            insertion = '';
          }
          debugger
          //offsetT -= left;
        } else {
          // their replacement at left
          if (O.splice.compare(ours, o, theirs, t) >= 0) {
            result.push(shiftT + theirs[t], left, insertion)
            insertion = '';
            removing -= left;
            shiftO -= left;
            debugger
          // their removal at left
          } else {
            result.push(shiftT + theirs[t], left, '')
            removing -= left;
          }
        }
      }
      if (middle > 0) {
        removing -= middle;
        if (left)
          offsetT += middle
        else
          shiftO -= middle;
      } else {
        shiftO += O.splice.getLength(theirs[t + 2])
        //shiftT += O.splice.getLength(ours[o + 2]);
      }
      if (right > 0 && !removing && middle > 0) {
        shiftT += O.splice.getLength(ours[o + 2])
        shiftO -= middle
        break;
      }
      if (offsetT) {
        shiftT += offsetT;
        offsetT = 0;
      }
      if (behind == 0) {
        shiftT += O.splice.getLength(ours[o + 2])
      }
      else
        shiftT += O.splice.getShift(ours, o)

    }



    // apply their range, log transformed command
    if (removing || insertion) {
      result.push(shiftT + index, removing, insertion);

      shiftO += O.splice.getLength(theirs[t + 2]) - removing;
    }

    /*if (extra) {
      result.push.apply(result, extra)
      extra = undefined;
    }*/
  }
  return result.length ? O.normalize(result) : undefined;
}








O.splice.splice = function(ours, theirs, normalized, safe) {
  if (!normalized) {
    ours = O.splice.normalize(ours)
    theirs = O.splice.normalize(theirs)
  }
  if (ours === undefined)
    return theirs;
  if (theirs === undefined)
    return

  var result = [];
  var shiftL = 0;
  var shiftT = 0;

  theirs: for (var t = 0, o = 0, tt = theirs.length; t < tt; t += 3) {
    var index = theirs[t]
    var removing = theirs[t + 1];
    var insertion = theirs[t + 2];

    for (;ours.length != o; o+= 3) {
      if (index <= ours[o]) {
        // our range intersects their range at start
        if (index + removing >= ours[o]) {
          var before = removing - (index + removing - ours[o])
          var end = index + removing - ours[o] - ours[o + 1]
          var after = Math.max(0, end)
          shiftL += removing - before - after;
          removing = after;
          if (insertion && ours[o + 2] && O.splice.compare(ours, o, theirs, t) < 0) {
            if (before) {
              result.push(index, before, '');
            }
          if (end < 0)
            index += O.splice.getLength(ours[o + 2])
          } else {
            if (insertion || before)
            result.push(index, before, insertion);
            index += O.splice.getLength(insertion)
            insertion = ''
          }
          if (end < 0)
            break
          //shiftT += O.splice.getLength(ours[o + 2])

        // our range at the same place as theirs
        //} else if (index === ours[o]) {
        //  if (insertion && O.splice.compare(ours, o, theirs, t) >= 0) {
        //    result.push(index, removing - ours[o + 1], insertion);
        //    shiftT +=  O.splice.getLength(ours[o + 2])
        //  } else {
        //    result.push(index, removing - ours[o + 1], insertion);
        //    shiftT +=  O.splice.getLength(ours[o + 2])
//
        //  }
        // our range starts at the end of theirs
        //} else if (index + removing == ours[o]) {

        // our range comes after theirs
        } else {
          break;
        }
      } else {

        // our range consumes theirs
        if (index + removing <= ours[o] + ours[o + 1]) {
          if (insertion && ours[o + 2] && O.splice.compare(ours, o, theirs, t) < 0) {
            debugger
            //if (index > ours[o]) {
            //  result.push(ours[o], index - ours[o], '')
            //  result.push(ours[o] + O.splice.getLength(ours[o + 2]), 0, '')
            //} else {
//
              index = ours[o] + O.splice.getLength(ours[o + 2]);
            //}
          } else {
            index = ours[o]

          }
          removing = 0;
          break;
        // our range intersects their at the end
        } else if (index < ours[o] + ours[o + 1] ||
                  index == ours[o] + ours[o + 1] && insertion && ours[o + 2] && O.splice.compare(ours, o, theirs, t) > 0) {
          var intersection = ours[o] + ours[o + 1] - index
          removing -= intersection
          if (insertion && ours[o + 2] && O.splice.compare(ours, o, theirs, t) < 0) {
            //result.push(index, removing - intersection, insertion)
          } else {
            if (insertion)
              result.push(ours[o], 0, insertion)
            shiftT += O.splice.getLength(ours[o + 2])
            index = ours[o] + O.splice.getLength(insertion)
            insertion = '';
          }
          break

        // our range ends at the same place as their range starts
        //} else if (index == ours[o] + ours[o + 1]) {
        //  if (ours[o + 2] && insertion && O.splice.compare(ours, o, theirs, t) > 0) {
        //    result.push(ours[o], 0, insertion)
        //    result.push(ours[o] + O.splice.getLength(ours[o + 2]) + O.splice.getLength(insertion), removing, '');
        //    
        //  } else {
        //    result.push(index + O.splice.getShift(ours, o), removing, insertion);
        //  }
        // our range comes before theirs
        } else if (index > ours[o]) {
          //shiftT += O.splice.getShift(ours, o)
        }
      }
      shiftT += O.splice.getShift(ours, o) + shiftL
      shiftL = 0;
    }

    if (removing || insertion)
      result.push(index + shiftT, removing, insertion);
  }

  return result
}