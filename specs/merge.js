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
  it ('should merge arrays of strings', function() {
    var left = {
      keys: ['test']
    };
    var right = {
      keys: [[0, 0, ['value1']]],
      things: [[0, 0, ['value2']]]
    };
    var output = O.merge(left, right);
    expect(left).toEqual({keys: ['test']})
    expect(output).toEqual({keys: ['value1', 'test'], things: ['value2']})
    expect(output).not.toBe(right)
  })

  it ('should apply properties to objects in array', function() {
    var left = {
      keys: [{
        name: 'Boris'
      }]
    };
    var right = {
      keys: [{0: {title: 'Thinker'}}],
      things: {0: {title: 'Maker'}}
    };
    var output = O.merge(left, right);
    expect(left).toEqual({keys: [{name: 'Boris'}]})
    expect(output).toEqual({keys: [{name: 'Boris', title: 'Thinker'}], things: [{title: 'Maker'}]})
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
        test: null
      }
    };
    debugger
    expect(O(left, right)).toEqual({
      key: 'test', 
      person: {
        hola: [[3, 1, 'zzz'], [1, 2, 'test']],
        title: 'abc',
        name: 'cde'
      },
      test: 'value'})
  })

})