describe('O.merge', function() {
  it ('should copy objects', function() {
    var left = {};
    var right = {
      test: 'value'
    };
    var output = O.merge(left, right);
    expect(left).toEqual({})
    expect(output).toEqual({test: 'value'})
    expect(output).not.toBe(right)
  })

  it ('should merge objects', function() {
    var left = {
      key: 'test'
    };
    var right = {
      test: 'value'
    };
    var output = O.merge(left, right);
    expect(left).toEqual({key: 'test'})
    expect(output).toEqual({key: 'test', test: 'value'})
    expect(output).not.toBe(right)
  })

  it ('should deeply merge objects', function() {
    var left = {
      key: 'test',
      person: {
        title: 'abc',
        test: 1
      }
    };
    var right = {
      test: 'value',
      person: {
        name: 'cde',
        test: null
      }
    };
    expect(O.merge(left, right)).toEqual({
      key: 'test', 
      person: {
        title: 'abc',
        name: 'cde'
      },
      test: 'value'})
  })

  it ('should recognize objects in AST', function() {
    var left = {};
    var right = {
      test: 'value'
    };
    var output = O(left, right);
    expect(left).toEqual({})
    expect(output).toEqual({test: 'value'})
    expect(output).not.toBe(right)
  })

  it ('should concat multiple merges', function() {
    var left = {
      key: 'test',
      person: {
        hola: [[3, 1, 'zzz']],
        title: 'abc',
        test: 1
      }
    };
    var right = {
      test: 'value',
      person: {
        hola: [[1, 2, 'test']],
        name: 'cde',
        test: undefined
      }
    };
    expect(O.concat(left, right)).toEqual({
      key: 'test', 
      person: {
        hola: [[3, 1, 'zzz'], [1, 2, 'test']],
        title: 'abc',
        name: 'cde'
      },
      test: 'value'})
  })

})