O['+'] = function(ours, theirs) {
  return (ours || 0) + theirs[1]
}
O['+'].normalize = function(theirs) {
  if (theirs[1] !== 0)
    return theirs;
}
O['+'].invert = function(ours, theirs) {
  return ['-', theirs[1]];
}
O['+'].concat = function(ours, theirs) {
  return ['+', ours[1] + theirs[1]]
}

O['-'] = function(ours, theirs) {
  return (ours || 0) - theirs[1]
}
O['-'].invert = function(ours, theirs) {
  return ['+', theirs[1]];
}
O['-'].concat = function(ours, theirs) {
  return ['-', ours[1] + theirs[1]]
}

O['*'] = function(ours, theirs) {
  return (ours || 0) * theirs[1]
}
O['*'].normalize = function(theirs) {
  if (theirs[1] !== 1)
    return theirs;
}
O['*'].invert = function(ours, theirs) {
  return ['/', theirs[1]];
}
O['*'].concat = function(ours, theirs) {
  return ['*', ours[1] * theirs[1]];
}

O['/'] = function(ours, theirs) {
  return (ours || 0) / theirs[1]
}
O['/'].normalize = function(theirs) {
  if (theirs[1] !== 1)
    return theirs;
}
O['/'].invert = function(ours, theirs) {
  return ['*', theirs[1]];
}
O['/'].concat = function(ours, theirs) {
  return ['/', ours[1] * theirs[1]];
}


O['^'] = function(ours, theirs) {
  var result = (ours || 0) ^ theirs[1]
  if (typeof ours == 'boolean')
    return Boolean(result)
  return result
}
O['^'].concat = function(ours, theirs) {
  return ['*', ours[1] ^ theirs[1]];
}


O.rot = function(ours, theirs) {
  return (ours || 0) + theirs[1] % theirs[2]
}
O.rot.normalize = function(theirs) {
  if (theirs[1] !== 0)
    return theirs;
}
O.rot.invert = function(ours, theirs) {
  return ['^', -theirs[1], theirs[2]];
}
O.rot.concat = function(ours, theirs) {
  if (ours[2] === theirs[2])
    return ['^', ours[1] + theirs[1], ours[2]];
}

O['/'].transform =
O['*'].transform =
O['+'].transform =
O['-'].transform =
O['rot'].transform = function(ours, theirs, returnOurs) {
  if (ours[0] === theirs[0]) {
    if (ours[0] != 'rot' || ours[2] === theirs[2])
      return [ours, theirs]
  }

  // apply theirss in reverse lexicographical order 
  // ("+" comes earlier than '/' in ascii table)
  if (O.compare(ours, theirs) < 0) {
    debugger
    return returnOurs ? ours : [O.invert(undefined, ours), theirs, ours];
  }
  return theirs
}
