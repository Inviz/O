describe('O.list', function() {
  it ('should recognize arrays of arrays as lists in AST', function() {
    expect(O.typeof([[]])).toBe('list')
    expect(O.typeof([])).toBe('list')
    expect(O.typeof([], true)).toBe('set')
  })

  it ('should apply operations in order', function() {
    expect(O([['set', 'abc'], ['set', 'cde']])).toBe('cde')
  })

  it ('should concat operations', function() {
    expect(O.concat([['set', 'abc']], [['set', 'cde']])).toEqual([['set', 'abc'], ['set', 'cde']])
  })

  it ('should be used to compose operations', function() {
    expect(O.compose(['set', 'abc'], ['splice', 'cde'])).toEqual([['set', 'abc'], ['splice', 'cde']])
  })

  it ('should normalize operations', function() {
    expect(O.normalize([['set', 'abc'], ['set', 'cde']])).toEqual(['set', 'cde'])
  })

  describe('.transform', function() {
    it ('should transform list against single operation', function() {
      transform([[0, 0, 'a'], [2, 0, 'b']], [4, 0, 'c'],
                [[0, 0, 'a'], [2, 0, 'b']], [6, 0, 'c'])

      transform([[0, 0, 'a'], [2, 0, 'b']], [[4, 0, 'c']],
                [[0, 0, 'a'], [2, 0, 'b']], [[6, 0, 'c']])


    })
  })

  var letters = Array(26);
  for (var i = 0; i < 26; i++)
    letters[i] = String.fromCharCode('a'.charCodeAt(0) + i);
  var alphabet = letters.join('')
  function transform(left, right, leftE, rightE) {

    var rightT = O.transform(left, right);
    var leftT  = O.transform(right, left);

    if (arguments.length > 2) {
      expect(leftT).toEqual(leftE)
      expect(rightT).toEqual(rightE)
    }

    // ensure that both transformed sides produce the same result
    expect(   O(O(alphabet, right), leftT))
    .toEqual( O(O(alphabet, left), rightT))
  }
})