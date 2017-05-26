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
      debugger
      transform([['move', 4, 5, 0],  ['move', 5, 3, 9]],   [0, 3, 'George'],
                [['move', 7, 5, 0],  ['move', 5, 6, 12]],  [6, 3, 'George'], 'Bob Woofs')
      transform([['move', 0, 3, 9]],   [[0, 3, 'George']],
                [['move', 0, 6, 12]],  [[6, 3, 'George']], 'Bob Woofs')
      transform([['move', 0, 3, 9]],   [0, 3, 'George'],
                [['move', 0, 6, 12]],  [6, 3, 'George'], 'Bob Woofs')

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
  function transform(left, right, leftE, rightE, input) {
    if (!input) input = alphabet

    var rightT = O.transform(left, right);
    var leftT  = O.transform(right, left);

    if (arguments.length > 2) {
      expect(leftT).toEqual(leftE)
      expect(rightT).toEqual(rightE)
      expect(   O(O(input, right), leftE))
      .toEqual( O(O(input, left), rightE))
    }

    // ensure that both transformed sides produce the same result
    expect(   O(O(input, right), leftT))
    .toEqual( O(O(input, left), rightT))
  }
})