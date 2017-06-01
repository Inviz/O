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
  OT is rumored to be unpredictable.
  However, this is only true when operation logs
  are not normalized and compressed. 

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

*/
O.list.normalize = function(ours) {
  var list;
  for (var i = 0; i < ours.length; i++) {
    var o = ours[i];
    if (o === undefined) 
      continue;
    var type = O.typeof(o);
    if (list === undefined || type === 'set') {
      list = [o]
      continue;
    }
    var index = O[type].index;
    for (var j = list.length; j--;) {
      var other = O.typeof(list[j]);
      var l = list[j];
      if (index < O[other].index) {
        var inverse = O.invert(undefined, l);
        o = O.transform(inverse, o)
        l = O.transform(o, l)
        if (l === undefined)
          list.splice(j, 1)
        else
          list[j] = l;
        if (j === 0)
          list.splice(j, 0, o);
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
O.list.transform = function (ours, theirs, normalized, returnOurs) {
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
