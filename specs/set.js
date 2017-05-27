describe('O.set', function() {
  it ('should return value', function() {
    expect(O.set('test')).toBe('test');
    expect(O.set('context', 'test')).toBe('test');
    expect(O.set('context', 1)).toBe(1);
    expect(O.set('context', true)).toBe(true);
    expect(O.set('context', undefined)).toBe(undefined);
  })
  it ('should be default ast node', function() {
    expect(O('cool')).toBe('cool')
    expect(O(1)).toBe(1)
    expect(O(true)).toBe(true)
    expect(O(undefined)).toBe(undefined)
  })
  it ('should overwrite value on concat', function() {
    expect(O('abc', 'cde')).toBe('cde')
    expect(O('abc', 1)).toBe(1)
    expect(O('abc', undefined)).toBe('abc')
    expect(O('abc', null)).toBe(null)
    expect(O('abc', true)).toBe(true)
  })
  it ('should overwrite value on transform', function() {
    expect(O.transform('cde', 'abc')).toBe('cde')
    expect(O.transform('abc', 'cde')).toBe(undefined)

    expect(O.transform(1, 'abc')).toBe(undefined)
    expect(O.transform('abc', 1)).toBe('abc')

    expect(O.transform('abc', undefined)).toBe(undefined)
    expect(O.transform(undefined, 'abc')).toBe('abc')

    expect(O.transform('abc', null)).toBe('abc')
    expect(O.transform(null, 'abc')).toBe(undefined)

    expect(O.transform('abc', true)).toBe('abc')
    expect(O.transform(true, 'abc')).toBe(undefined)
  })
})