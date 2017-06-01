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
    expect(O([['set', 'abc']], [['set', 'cde']])).toEqual([['set', 'abc'], ['set', 'cde']])
  })

  it ('should be used to compose operations', function() {
    expect(O([['set', 'abc']], [['splice', 'cde']])).toEqual([['set', 'abc'], ['splice', 'cde']])
  })
  it ('should be used to compose operations', function() {
    expect(O([['set', 'abc']], [['splice', 'cde']])).toEqual([['set', 'abc'], ['splice', 'cde']])
  })

  it ('should normalize operations', function() {
    expect(O.normalize([['set', 'abc'], ['set', 'cde']])).toEqual(['set', 'cde'])
    expect(O.normalize([[2, 0, 'a'], [0, 0, 'b']])).toEqual([0, 0, 'b', 3, 0, 'a'])
  })
  it ('should reorder operations during normalization', function() {
    normalize([["move",10,5,23],[14,1,"0000"]], [[19,1,"0000"],["move",10,5,26]])
    normalize([["move",23,4,32],["move",14,9,23],[17,9,"66666"],[3,2,""], ["move",10,5,23],["move",19,9,29],[14,1,"0000"]], null, true)
    normalize([[0, 0, 'b'], ['move', 10, 20, 40]], 
               [[0, 0, 'b'], ['move', 10, 20, 40]])
    normalize([['move', 10, 20, 40], [0, 0, 'b']], 
              [[0, 0, 'b'], ['move', 11, 20, 41]])
    normalize([['move', 10, 20, 40], [0, 0, 'b'], ['move', 10, 20, 40]], 
              [[0, 0, 'b'], ['move', 11, 20, 41], ['move', 10, 20, 40]])

  })

  describe('.transform', function() {
    it ('should transform list against single operation', function() {
      transform([['move', 4, 5, 0],  ['move', 5, 3, 9]],   [0, 3, 'George'],
                [['move', 7, 5, 0],  ['move', 5, 6, 12]],  [6, 3, 'George'], 'Bob Woofs')
      transform([['move', 0, 3, 9]], [[0, 3, 'George']],
                ['move', 0, 6, 12],  [6, 3, 'George'], 'Bob Woofs')
      transform([['move', 0, 3, 9]], [0, 3, 'George'],
                ['move', 0, 6, 12],  [6, 3, 'George'], 'Bob Woofs')

      transform([[0, 0, 'a'], [2, 0, 'b']], [4, 0, 'c'],
                [0, 0, 'a', 2, 0, 'b'], [6, 0, 'c'])

      transform([[0, 0, 'a'], [2, 0, 'b']], [[4, 0, 'c']],
                [0, 0, 'a', 2, 0, 'b'], [6, 0, 'c'])

      transform([[2, 0, 'a'], [0, 0, 'b']], [[4, 0, 'c']],
                [0, 0, 'b', 3, 0, 'a'], [6, 0, 'c'])

      transform(
        [[23,9,"11111"],[27,7,"77777"]],
        [17,8,"55555555"]
      )
    })
    it ('should transform list against multiple operations', function() {
      transform(
        [[25,8,""],[18,8,""],["move",1,5,14],["move",20,8,33],[26,2,"8888888"],[23,5,""]],
        [["move",23,4,32],["move",14,9,23],[17,9,"66666"],[3,2,""],["move",10,5,23],["move",19,9,29],[14,1,"0000"]]
      )
      transform(
        [[18,8,""]], [[23,1,''],[10,4,''],[14,1,""]],
        [14,6,""], [10,4,""]
      )
    })
    it ('should resolve random moves/splices (10000 fuzzy runs)', function() {
      var ops = [];
      for (var c = 0; c < 10000; c++) {
        for (var i = 0; i < 2; i++) {
          var list = [];
          for (var j = 0, k = Math.floor(Math.random() * 20); j < k; j++) {
            if (Math.random() >= 0.5) {
              var from = Math.floor(Math.random() * 80);
              var count = Math.floor(Math.random() * 20);
              list.push(
                ['move', from, count, from + count + Math.floor(Math.random() * 10)]
              )
            } else {
              list.push([
                Math.floor(Math.random() * 80),
                Math.floor(Math.random() * 20),
                Math.random() > 0.5 ? '' : Array(Math.floor(Math.random() * 10)).join(Math.floor(Math.random() * 10))
              ])
            }
          }
          // run invertion assertions
          invert(alphabet, list)
          ops.push(list)
        }

        // run algorithm twice for normalized & non-normalized lists and compare results
        var raw = transform(ops[0], ops[1], undefined,undefined,undefined, true)
        var normalized = transform(ops[0], ops[1])
        expect(raw).toEqual(normalized)
      }
    })

  })

})