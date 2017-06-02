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
    transform([["move",8,10,23]],    [8,0,"5555"],
                 [ 'move', 12, 10, 27  ],  [ 8, 0, '5555' ] )

    normalize([["move",40,1,49],[40,0,"77777777"]],
               [ [ 40, 0, '77777777' ], [ 'move', 48, 1, 57 ] ])

    transform([["move",40,1,49],[40,0,"77777777"]],             [["move",48,12,60]],
               [ [ 40, 0, '77777777' ], [ 'move', 48, 1, 57 ] ] ,  undefined )

    normalize([["move",74,19,93],[71,0,"44444"]], [71,0,"44444"] )
    transform([["move",74,19,93],[71,0,"44444"]], ["move",67,11,82],
              [75,0,"44444"],                     ["move",67,16,87] )

    normalize([["move",28,7,42],[28,0,"4444"]],  [ [ 28, 0, '4444' ], [ 'move', 32, 7, 46 ] ] )
    transform(["move", 35, 7, 28],    [ 28, 0, '4444' ],  
              ['move', 39, 7, 32 ],  [ 28, 0, '4444' ])

    normalize([["move",71,11,86],[75,0,"77"]],  [ [ 86, 0, '77' ], [ 'move', 71, 11, 88 ] ])
    normalize([["move",10,5,23],[14,1,"0000"]], [[19,1,"0000"],["move",10,5,26]])
    normalize([["move",23,4,32],["move",14,9,23],[17,9,"66666"],[3,2,""], ["move",10,5,23],["move",19,9,29],[14,1,"0000"]], null, true)
    normalize([[0, 0, 'b'],  ['move', 10, 20, 40]], 
               [[0, 0, 'b'], ['move', 10, 20, 40]])
    normalize([['move', 10, 20, 40], [0, 0, 'b']], 
              [[0, 0, 'b'], ['move', 11, 20, 41]])
    normalize([['move', 10, 20, 40], [0, 0, 'b'], ['move', 10, 20, 40]], 
              [[0, 0, 'b'], ['move', 11, 20, 41], ['move', 10, 20, 40]])

  })

  describe('.transform', function() {
    it ('should transform list against single operation', function() {
      transform([["move",28,7,42],[28,0,"4444"]], [[12,6,""]])
      transform([["move",71,11,86],[75,0,"77"]], ["move",51,5,61], 
                [ [ 86, 0, '77' ], [ 'move', 71, 11, 88 ] ], [ 'move', 51, 5, 61 ] )
      transform([["move",26,4,31],["move",34,12,51]], [31,11,""])
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
      for (var c = 0; c < 10000; c++) {
        var ops = [];
        for (var i = 0; i < 2; i++) {
          var list = [];
          for (var j = 0, k = Math.floor(Math.random() * 2) + 1; j < k; j++) {
            /*if (Math.random() >= 0.99) { //rarely a set op
              list.push(['set', Math.random() + alphabet])
            } else*/ if (Math.random() >= 0.3) { //30% of move, 70% splice
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
        //var normalized = transform(ops[0], ops[1])
        //expect(raw).toEqual(normalized)
      }
    })


    xit ('should resolve random moves/splices (10000 fuzzy runs) against arrays', function() {
      for (var c = 0; c < 1000; c++) {
        var ops = [];
        for (var i = 0; i < 2; i++) {
          var list = [];
          for (var j = 0, k = Math.floor(Math.random() * 20); j < k; j++) {
            if (Math.random() >= 1.99) { //rarely a set op
              list.push(['set', [Math.random()].concat(letters)])
            } else if (Math.random() >= 0.3) { //30% of move, 70% splice
              var from = Math.floor(Math.random() * 80);
              var count = Math.floor(Math.random() * 20);
              list.push(
                ['move', from, count, from + count + Math.floor(Math.random() * 10)]
              )
            } else {
              list.push([
                Math.floor(Math.random() * 80),
                Math.floor(Math.random() * 20),
                Math.random() > 0.5 ? [] : Array(Math.floor(Math.random() * 10)).join(Math.floor(Math.random() * 10)).split('')
              ])
            }
          }
          // run invertion assertions
          invert(letters, list)
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