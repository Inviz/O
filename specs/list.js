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
    var compressed = compress(O.normalize([["move",68,7,84],["move",55,15,72],[64,15,"9"],[73,18,""]]), 
                          [ [62, 8, "", 67, 2, "", 69, 5, "9", 73, 18, ""], [ 'move', 62, 5, 70 ], [ 'move', 55, 7, 64 ] ] )
    var normalized =normalize([["move",68,7,84],["move",55,15,72],[64,15,"9"],[73,18,""]], null, true)
    expect(compressed).toEqual(normalized)

    transform([["move",8,10,23]],    [8,0,"5555"],
                 [ 'move', 12, 10, 27  ],  [ 8, 0, '5555' ] )

    compress([["move",40,1,49],[40,0,"77777777"]],
               [ [ 40, 0, '77777777' ], [ 'move', 48, 1, 57 ] ])

    transform([["move",40,1,49],[40,0,"77777777"]],             [["move",48,12,60]],
               [ [ 'move', 40, 1, 49 ], [ 40, 0, '77777777' ] ] ,  undefined )

    compress([["move",74,19,93],[71,0,"44444"]], [71,0,"44444"] )
    transform([["move",74,19,93],[71,0,"44444"]], ["move",67,11,82],
              [75,0,"44444"],                     ["move",67,16,87] )

    compress([["move",28,7,42],[28,0,"4444"]],  [ [ 28, 0, '4444' ], [ 'move', 32, 7, 46 ] ] )
    transform(["move", 35, 7, 28],    [ 28, 0, '4444' ],  
              ['move', 39, 7, 32 ],  [ 28, 0, '4444' ])

    compress([["move",71,11,86],[75,0,"77"]],  [ [ 86, 0, '77' ], [ 'move', 71, 11, 88 ] ])
    compress([["move",10,5,23],[14,1,"0000"]], [[19,1,"0000"],["move",10,5,26]])
    compress([["move",23,4,32],["move",14,9,23],[17,9,"66666"],[3,2,""], ["move",10,5,23],["move",19,9,29],[14,1,"0000"]], null, true)
    compress([[0, 0, 'b'],  ['move', 10, 20, 40]], 
               [[0, 0, 'b'], ['move', 10, 20, 40]])
    compress([['move', 10, 20, 40], [0, 0, 'b']], 
              [[0, 0, 'b'], ['move', 11, 20, 41]])
    compress([['move', 10, 20, 40], [0, 0, 'b'], ['move', 10, 20, 40]], 
              [[0, 0, 'b'], ['move', 11, 20, 41], ['move', 10, 20, 40]])

  })

  describe('.transform', function() {
    it ('should be eqivalent to concatenated op', function() {
      expect(O.transform(["move",20,5,33], [[20, 5, '666666'], [34, 9, '']], true)).toEqual(
        O.transform(["move",20,5,33], [20, 5, '666666', 34, 9, ''], true)
      )
      expect(O.transform([["move",20,5,33]], [[[20, 5, '666666']], [[34, 9, '']]], true)).toEqual(
        O.transform(["move",20,5,33], [20, 5, '666666', 34, 9, ''], true)
      )
      expect(O.normalize([[["move",20,5,33], ["move",20,1,33]], [[[20, 5, '666666']], [[34, 9, '']]]])).toEqual(
        [["move",20,5,33], ["move",20,1,33], [20, 5, '666666', 34, 9, '']]
      )
    })

    it ('should transform list against single operation', function() {


      compress([["move",20,13,38], [ 20, 5, '666666', 34, 9, '' ]],    [ [ 28, 14, '666666' ], [ 'move', 20, 8, 34 ]  ] )
      
      compress([["move",20,13,38], [33, 9, '' ], [20, 5, '666666']],  [ [ 28, 14, '666666' ], [ 'move', 20, 8, 34 ] ] )

      compress([["move",20,13,38], [20, 5, '666666'], [34, 9, '']],  [ [ 28, 14, '666666' ], [ 'move', 20, 8, 34 ] ] )

      transform([ [20, 5, '666666'], [34, 9, ''] ],  ["move",20,5,38], 
                [ 28, 14, '666666' ] , [ 'move', 20, 6, 34 ]  , alphabet.slice(70, 120), 'untransform')

      transform([20,5,"666666"],  ["move",20,5,38], 
                [ 33, 5, '666666' ],[ 'move', 20, 6, 39 ] )

      //transform([ 33, 5, '666666' ], ["move", 21, 9, 42], 
      //          [ 24, 5, '666666' ],  [ 'move', 21, 9, 43 ] )
      //transform([ 24, 5, '666666' ], ["move", 21, 12, 42], 
      //          [ 33, 5, '666666' ],  ["move", 21, 13, 43] )
      //transform([20,5,"666666",34,9,""],  ["move",25,13,20], 
      //          [ 28, 14, '666666' ],     [ 'move', 20, 14, 20 ] )

      //normalize([["move",21,12,42],[20,14,"666666"]],   [ 20, 5, '666666', 34, 9, '' ]  )

      //normalize([["move",20,13,38],["move",21,12,42],[20,14,"666666"]],  [ 28, 14, '666666' ] )
      

      transform([["move",20,13,38],["move",21,12,42],[20,14,"666666"]],   ["move",64,3,72])
      
      transform([["move",28,7,42],[28,0,"4444"]], [[12,6,""]])
      transform([["move",71,11,86],[75,0,"77"]], ["move",51,5,61], 
                [ [ 'move', 71, 11, 86 ], [ 75, 0, '77' ] ], [ 'move', 51, 5, 61 ] )
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
      var a = transform(
        [[0,15,"",25,13,"000"],["move",73,10,90],[5,1,"",26,12,"33",44,19,""]], 
        [[64,19,""],["move",4,5,17],[52,13,"00"]]
      )

      var a = transform(
        [[14,11,""],["move",9,14,23],[2,0,"00000000",20,12,"111111",54,12,""]], 
        [8,7,"",16,19,"77",31,16,"1111"]
      )

      var a = transform(
        [[20,6,"000"],[70,8,""],[44,0,"44444"]], 
        [[47,19,"999"],[10,19,"99"]]
      )

      // if splices aren't normalized here, insertion intention is not preserved
      var a = transform(
        [[71,17,""]], 
        O.normalize([["move",61,9,77],[66,13,""],[65,2,"99"]]),
        [ 62, 3, '', 64, 8, '' ],
        [ [ 'move', 61, 9, 71 ], [ 62, 9, '99' ] ]
      )
      //var b = transform(
      //  [["move",8,16,31],[71,17,""]], 
      //  [["move",51,5,61],["move",61,9,77],[66,13,""],[65,2,"99"]]
      //)
      //expect(a).toEqual(b)


      transform(
        [[44,18,"55555555"],["move",36,18,63]], 
        [["move",53,10,65],["move",44,17,66]]
      )
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

      var letters = Array(576);
      for (var i = 0; i < 576; i++)
        letters[i] = String.fromCharCode('a'.charCodeAt(0) + i);
      var alphabet = letters.join('')

      for (var c = 0; c < 1000; c++) {
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
              if (list[list.length - 1][1] == 0 && list[list.length - 1][2] === '')
                list.pop()
            }
          }
          // run invertion assertions
          invert(alphabet, list)
          compress(list, null, true)
          ops.push(list)
        }

        // run algorithm twice for normalized & non-normalized lists and compare results
        var raw = transform(ops[0], ops[1])
        var normalized = transform(O.compress(ops[0]), O.compress(ops[1]))
        //if (raw !== normalized)
        //  debugger
        expect(raw).toEqual(normalized)
      }
    })


    it ('should resolve random moves/splices (10000 fuzzy runs) against arrays', function() {
      for (var c = 0; c < 1000; c++) {
        var ops = [];
        for (var i = 0; i < 2; i++) {
          var list = [];
          for (var j = 0, k = Math.floor(Math.random() * 20); j < k; j++) {
            if (Math.random() >= 0.3) { //30% of move, 70% splice
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
        var raw = transform(ops[0], ops[1], undefined,undefined,letters)
        //var normalized = transform(ops[0], ops[1], undefined, undefined, letters)
        //expect(raw).toEqual(normalized)
      }
    })

  })

})