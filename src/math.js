/////////////////////////////////////////////////////////////////////

O['+'] = function(left, right) {
  return left + right
}
O['+'].normalize = function(right) {
  if (right[1] !== 0)
    return right;
}
O['+'].invert = function(right) {
  return ['-', right[1]];
}
O['+'].concat = function(left, right) {
  return ['+', left[1] + right[1]]
}

O['-'] = function(left, right) {
  return left - right[1]
}
O['-'].invert = function(right) {
  return ['+', right[1]];
}
O['-'].concat = function(left, right) {
  return ['-', left[1] + right[1]]
}

O['*'] = function(left, right) {
  return left * right[1]
}
O['*'].normalize = function(right) {
  if (right[1] !== 1)
    return right;
}
O['*'].invert = function(right) {
  return ['/', right[1]];
}
O['*'].concat = function(left, right) {
  return ['*', left[1] * right[1]];
}

O['/'] = function(left, right) {
  return left / right[1]
}
O['/'].normalize = function(right) {
  if (right[1] !== 1)
    return right;
}
O['/'].invert = function(right) {
  return ['*', right[1]];
}
O['/'].concat = function(left, right) {
  return ['/', left[1] * right[1]];
}


O['^'] = function(left, right) {
  var result = left ^ right[1]
  if (typeof left == 'boolean')
    return Boolean(result)
  return result
}
O['^'].concat = function(left, right) {
  return ['*', left[1] ^ right[1]];
}


O.rot = function(left, right) {
  return left + right[1] % right[2]
}
O.rot.normalize = function(right) {
  if (right[1] !== 0)
    return right;
}
O.rot.invert = function(right) {
  return ['^', -right[1], right[2]];
}
O.rot.concat = function(left, right) {
  if (left[2] === right[2])
    return ['^', left[1] + right[1], left[2]];
}

O['/'].transform =
O['*'].transform =
O['+'].transform =
O['-'].transform =
O['rot'].transform = function(left, right) {
  if (left[0] === right[0]) {
    if (left[0] != 'rot' || left[2] === right[2])
      return [left, right]
  }

  // apply rights in reverse lexicographical order 
  // ("+" comes earlier than '/' in ascii table)
  if (O.compare(left, right) < 0) {
    return [
      left,
      [O.invert(left), left, right]
    ];
  }
}
