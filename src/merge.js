// Applies operations to object keys
O.merge = function(left, right, callback, allowNull) {
  if (left === undefined)
    left = this;
  if (callback === undefined)
    callback = O

  var result;
  for (var property in left) {
    if (property in right)
      var value = callback(left[property], right[property]);
    else
      var value = callback(undefined, left[property])
    if (value != null || allowNull)
      (result || (result = {}))[property] = value;
  }

  for (var property in right) {
    if (property in left) continue;

    var value = callback(left[property], right[property]);
    if (value != null || allowNull)
      (result || (result = {}))[property] = value;
  } 


  return result;
}

O.merge.normalize = function (left) {
  return O.merge(left, {}, O.normalize)
}

O.merge.invert = function (operations, context) {
  var inverted = {};
  for (var property in operations) 
    inverted[property] = O.invert(operations[property], context[property]);
  return inverted
}

O.merge.concat = function(left, right, callback) {
  return O.merge(left, right, O.compose);
}

O.merge.merge = function(left, right) {
  return O.merge(left, right, O.transform, true);
}