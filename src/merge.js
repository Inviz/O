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
    if (value != null || allowNull)
      (result || (result = {}))[property] = value;
  }

  for (var property in theirs) {
    if (property in ours) continue;

    var value = callback(ours[property], theirs[property], arg);
    if (value != null || allowNull)
      (result || (result = {}))[property] = value;
  } 


  return result;
}

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