// perform list operations over document
O.list = function (left, right) {
  for (var i = 0; i < right.length; i++)
    context = O(left, right[i]);
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
        if (concatenated == null) {
          //if (!optimize)
          //  break;
          simplified.splice(j + 1, 0, concatenated)
        } else {
          if (concatenated === false)  {
            simplified.splice(j, 1);
          } else {
            simplified[j] = concatenated
          }
        } 
      }
  }
  if (simplified.length == 0)
    return false;
  if (simplified.length == 1)
    return simplified[0];
  return simplified;
}

O.list.invert = function (list, document) {
  var inverted = [];
  for (var i = 0; i < list.length; i++) {
    inverted.unshift(O.invert(list[i], document));
    document = O.apply(list[i], document);
  }
  return inverted;
}
