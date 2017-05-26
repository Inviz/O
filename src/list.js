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

O.list.normalize = function(list) {
  var simplified = [];
  for (var i = 0; i < list.length; i++) {
    if (!list[i]) continue;
    if (!simplified.length)
      simplified.push(list[i])
    else
      for (var j = simplified.length; j--;) {
        var concatenated = O.concat(simplified[j], list[i]);
        if (concatenated === undefined)  {
          simplified.splice(j, 1);
        } else if (concatenated === simplified[j]) {
          simplified.splice(j + 1, 0, list[i])
        } else {
          simplified[j] = concatenated
        }
        break;
      }
  }
  if (simplified.length == 0)
    return;
  if (simplified.length == 1)
    return simplified[0];
  return simplified;
}

O.list.transform = function (ours, theirs, normalized, returnOurs) {
  
  if (O.typeof(theirs) != 'list') {
    if (returnOurs) {
      var swap = ours
      ours = [theirs]
      theirs = swap
    } else {
      var transformed = theirs;
      for (var i = 0; i < ours.length; i++) 
        transformed = O.transform(ours[i], transformed);
      return transformed;
    }
  }

  var list = theirs.slice();
  var transformed = [];
  for (var i = 0; i < ours.length; i++) {
    list[0] = O.transform(ours[i], list[0]);
    var o = O.transform(list[0], ours[i]);
    for (var k = 1; k < list.length; k++)
      list[k] = O.transform(o, list[k])

  }
  for (var j = 0; j < list.length; j++) {

      if (O.typeof(list[j]) == 'list')
        transformed.push.apply(transformed, list[j]);
      else
        transformed.push(list[j])
  }
  return transformed;
}

O.list.invert = function (ours, theirs) {
  var inverted = [];
  var context = ours;
  for (var i = 0; i < theirs.length; i++) {
    inverted.unshift(O.invert(context, theirs[i]));
    context = O(context, theirs[i]);
  }
  return inverted;
}
