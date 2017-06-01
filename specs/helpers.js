
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

  return O(O(input, right), leftT);
}

function invert(left, right, rightE) {
  var rightT = O.invert(left, right);
  if (rightE)
    expect(rightT).toEqual(rightE)
  expect(O(O(left, right), rightT)).toEqual(left)
}

function normalize(left, right, ignoreResult) {
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
    expect(O(alphabet, left)).toEqual(O(alphabet, right))
  } else {
    expect(O(alphabet, left)).toEqual(O(alphabet, normalized))
  }
  
}