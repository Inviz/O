describe('O.list', function() {
  it ('should recognize arrays of arrays as lists in AST', function() {
    expect(O.typeof([[]])).toBe('list')
    expect(O.typeof([])).toBe('set')
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

})