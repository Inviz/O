
var letters = Array(376);
for (var i = 0; i < 376; i++)
  letters[i] = String.fromCharCode('a'.charCodeAt(0) + i);
var alphabet = letters.join('')
function transform(left, right, leftE, rightE, input, normalized) {
  if (!input) input = alphabet

  var rightT = O.transform(left, right, normalized);
  var leftT  = O.transform(right, left, normalized);

  if (arguments.length > 2 && (leftE !== undefined || rightE !== undefined)) {
    expect(leftT).toEqual(leftE)
    expect(rightT).toEqual(rightE)
    expect(   O(O(input, right), leftE))
    .toEqual( O(O(input, left), rightE))
  }

  // ensure that both transformed sides produce the same result
  expect(   O(O(input, right), leftT))
  .toEqual( O(O(input, left), rightT))

  // test ip3 of move-splice pair (transform against undo)
  if (O.typeof(left) == 'move' && O.typeof(right) == 'splice') {
    expect(
      O.transform(O.transform(left, right, 'untransform'), O.invert(input, left))
    ).toEqual(
      O.invert(input, 
        O.transform(right, left, 'untransform')
      )
    )
  //  test ip2 of move-splice pair (transform against pair of do-undo)
    var tested = O.transform([left, O.invert(input, left)], right, false);
    expect(O.normalize(tested)).toEqual(O.normalize(right))
  }

    // test ip3 of splice-splice pair
  /*if (O.typeof(left) == 'splice' && O.typeof(right) == 'splice') {
    var l = left.slice(0, 3)
    var r = right.slice(0, 3)
    expect(
      O.transform(O.transform(l, r, 'untransform'), O.invert(O(input, l), l))
    ).toEqual(
      O.invert(O(input, l), 
        O.transform(r, l, 'untransform')
      )
    )
  }*/



  //expect(O(input, O.transform(left, O.invert(undefined, left)))).toEqual(input)
  return O(O(input, right), leftT);
}

function invert(left, right, rightE) {
  // IP1: Do/Undo pair reverts state back
  var rightT = O.invert(left, right);
  if (rightE)
    expect(rightT).toEqual(rightE)
  expect(O(O(left, right), rightT)).toEqual(left)

  //  IP2: Allow do/undo pairs
  if (O.typeof(right) == 'move') {
    var test = [0, 3, 'd', 5, 8, '', 19, 3, 'zz']
    var tested = O.transform([right, rightT], test, false);
  // 
    expect(O.normalize(tested)).toEqual(test)
  }
  // IP3

  //var test = [0, 3, 'd']
  //expect(
  //  O.transform(test, O.invert(left, right))
  //).toEqual(
  //  O.invert(left, 
  //    O.transform(test, right)
  //  )
  //)
//
  //var test = ['move', 22, 6, 30]
  //expect(
  //  O.transform(test, O.invert(left, right))
  //).toEqual(
  //  O.invert(left, 
  //    O.transform(test, right)
  //  )
  //)
//
  //var test = ['move', 3, 6, 12]
  //expect(
  //  O.transform(test, O.invert(left, right))
  //).toEqual(
  //  O.invert(left, 
  //    O.transform(test, right)
  //  )
  //)
}

function normalize(left, right, ignoreResult, input) {
  if (!input) input = alphabet
  var normalized = O.normalize(left)

  // ensure list is wellformed    
  if (normalized && O.typeof(normalized) == 'splice')
    for (var i = 3; i < normalized.length; i += 3)
      if (normalized[i - 3] >= normalized[i]) {
        expect(normalized[i]).toBeGreaterThan(normalized[i - 3])
        throw 1;
      }
  
  // check normalized result if provided
  if (!ignoreResult) {
    var prev = -1;
    expect(normalized).toEqual(right);
    //expect(O(input, right)).toEqual(O(input, left))
    expect(O(input, right)).toEqual(O(input, left))
  } else {
    expect(O(input, normalized)).toEqual(O(input, left))
  }
  
}

function compress(left, right, ignoreResult, input) {
  if (!input) input = alphabet
  var normalized = O.compress(left)

  // ensure list is wellformed    
  if (normalized && O.typeof(normalized) == 'splice')
    for (var i = 3; i < normalized.length; i += 3)
      if (normalized[i - 3] >= normalized[i]) {
        expect(normalized[i]).toBeGreaterThan(normalized[i - 3])
        throw 1;
      }
  
  // check normalized result if provided
  if (!ignoreResult) {
    var prev = -1;
    expect(normalized).toEqual(right);
    //expect(O(input, right)).toEqual(O(input, left))
    expect(O(input, right)).toEqual(O(input, left))
  } else {
    expect(O(input, normalized)).toEqual(O(input, left))
  }
  
}