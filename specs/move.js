describe('O.move', function() {
  var moveSplice = function(source, from, count, to) {
    if (typeof source == 'string')
      var array = source.split('');
    else
      var array = source.slice()
    var removed = array.splice(from, count);
    array.splice.apply(array, [
      from < to ? to - count : to, 
      0
    ].concat(removed))

    if (typeof source == 'string')
      return array.join('');
    return array
  }

  var letters = Array(226);
  for (var i = 0; i < 226; i++)
    letters[i] = String.fromCharCode('a'.charCodeAt(0) + i);
  var alphabet = letters.join('')
  function transform(left, right, leftE, rightE) {

    var rightT = O.transform(left, right);
    var leftT  = O.transform(right, left);

    if (arguments.length > 2) {
      expect(leftT).toEqual(leftE)
      expect(rightT).toEqual(rightE)

      expect(   O(O(alphabet, right), leftE))
      .toEqual( O(O(alphabet, left), rightE))

    }

    // ensure that both transformed sides produce the same result
    expect(   O(O(alphabet, right), leftT))
    .toEqual( O(O(alphabet, left), rightT))
  }

  it('should move LTR', function() {
    expect(O.move('abcdefghi', ['move', 2, 2, 6])).toBe(moveSplice('abcdefghi', 2, 2, 6))  
  })

  it ('should move RTL', function() {
    expect(O.move('abcdefghi', ['move', 2, 2, 6])).toBe(moveSplice('abcdefghi', 2, 2, 6))  
  }) 

  describe('.splice', function() {
    it ('should transform LTR moves against splices outside of range', function() {
      transform(['move', 11, 7, 19], [1, 3, 'XXXXXX'],
                ['move', 14, 7, 22], [1, 3, 'XXXXXX'])
      transform(['move', 11, 7, 19], [1, 3, ''],
                ['move', 8, 7, 16],  [1, 3, ''])
      transform(['move', 11, 7, 19], [21, 3, ''],
                ['move', 11, 7, 19], [21, 3, ''])
      transform(['move', 11, 7, 19], [21, 3, 'XXXXXX'],
                ['move', 11, 7, 19], [21, 3, 'XXXXXX'])
    })
    it ('should transform RTL moves against splices outside of range', function() {
      transform(['move', 11, 7, 5], [1, 3, ''],
                ['move', 8, 7, 2],  [1, 3, ''])
      transform(['move', 11, 7, 5], [21, 3, ''],
                ['move', 11, 7, 5], [21, 3, ''])
      transform(['move', 11, 7, 5], [1, 3, 'XXXXXX'],
                ['move', 14, 7, 8], [1, 3, 'XXXXXX'])
      transform(['move', 11, 7, 5], [21, 3, 'XXXXXX'],
                ['move', 11, 7, 5], [21, 3, 'XXXXXX'])
    })
    it ('should transform LTR moves that intersect with splices at start', function() {
      transform(['move', 11, 7, 19], [9, 3, 'X'],
                ['move', 10, 6, 17], [9, 2, 'X', 11, 1, '' ])
      transform(['move', 11, 7, 19], [9, 3, 'XXX'],
                ['move', 12, 6, 19], [9, 2, 'XXX', 13, 1, '' ])
      transform(['move', 11, 7, 19], [9, 3, 'XXXXXX'],
                ['move', 15, 6, 22], [9, 2, 'XXXXXX', 16, 1, '' ])
      transform(['move', 11, 7, 19], [9, 3, ''],
                ['move', 9, 6, 16],  [9, 2, '', 10, 1, '' ])
    })
    it ('should transform RTL moves that intersect with splices at start', function() {
      transform(['move', 11, 7, 0], [9, 3, ''],
                ['move', 9, 6, 0],  [0, 1, '', 15, 2, '' ])
      transform(['move', 11, 7, 0], [10, 3, ''],
                ['move', 10, 5, 0], [0, 2, '', 15, 1, '' ])
      transform(['move', 11, 7, 0], [9, 3, 'XXX'],
                ['move', 12, 6, 0], [0, 1, '', 15, 2, 'XXX' ])
      transform(['move', 11, 7, 0], [10, 3, 'XXXXXX'],
                ['move', 16, 5, 0], [0, 2, '', 15, 1, 'XXXXXX' ])
      transform(['move', 11, 7, 0], [10, 3, 'XXXXXXX'],
                ['move', 17, 5, 0], [0, 2, '', 15, 1, 'XXXXXXX' ])
    })
    it ('should transform LTR moves that intersect with splices at end', function() {
      transform(['move', 11, 7, 29], [16, 3, ''],
                ['move', 11, 5, 26], [11, 1, '', 26, 2, '' ])
      transform(['move', 11, 7, 19], [16, 3, ''],
                undefined,           [11, 1, '', 16, 2, '' ])
      transform(['move', 11, 7, 29], [17, 3, ''],
                ['move', 11, 6, 26], [11, 2, '', 26, 1, '' ])
    })
    it ('should transform LTR moves that have their target position removed', function() {
      // ABCDEFGHIJK LMNOPQ[R S|T] 
      // ABCDEFGHIJK LMNOPQ[R S|T] 
      // ABCDEFGHIJK R LMNOPQR ST
      transform(['move', 11, 7, 19], [17, 3, ''],
                undefined,           [11, 1, '', 17, 2, '' ])
      
    })
    it ('should transform RTL moves that intersect with splices at end', function() {
      transform(['move', 11, 7, 0], [9, 3, ''],
                ['move', 9, 6, 0],  [0, 1, '', 15, 2, '' ])
    })

    it ('should transform RTL moves against splices outside of range', function() {
      transform(['move', 11, 7, 19], [1, 3, ''],
                ['move', 8, 7, 16],  [1, 3, ''])
      transform(['move', 11, 7, 19], [21, 3, ''],
                ['move', 11, 7, 19], [21, 3, ''])
    })

    it ('should resolve cases caught by fuzzer', function() {
      transform(["move", 11, 3, 14], [12, 2, "444444"],  
                undefined, [12, 2, "444444"])

      transform(["move", 11, 1, 16], [12, 4, "333333"],  
                ["move", 11, 1, 18], [ 11, 4, '333333' ])
      transform(['move', 1, 2, 4], [2, 2, "3333"],  
                undefined, [ 1, 1, '', 2, 1, '3333' ])
      transform(["move", 11, 3, 16],[12, 3, "55"],  
                ["move", 11, 1, 15], [11, 1, "55", 15, 2, ''])
      transform(["move", 9, 4, 14], [12, 5, "66666666"],  
                undefined,          [ 9, 1, '', 12, 4, '66666666' ])
      transform(["move", 13, 1, 9], [12, 5, "66666666"],  
                undefined,          [ 9, 1, '', 12, 4, '66666666' ])
      transform(["move", 11, 2, 4], [10, 4, "77"],  
                undefined,          [4, 2, "", 10, 2, "77"])
      transform(["move", 4, 7, 13], [10, 4, "77"],  
                undefined,          [4, 2, "", 10, 2, "77"])
      transform(["move", 12, 2, 2], [11, 4, "8"],  
                undefined,          [2, 2, "", 11, 2, "8"])
      transform(["move", 9, 1, 13], [12, 2, "888888"],  
                [ 'move', 9, 1, 12 ] ,          [ 11, 1, '', 12, 1, '888888' ]  )
      transform(["move", 10, 3, 9], [12, 2, "888888"],  
                [ 'move', 10, 2, 9 ] ,          [ 11, 1, '', 12, 1, '888888' ]  )
      transform(["move", 10, 2, 5], [12, 1, "555"],  
                [ 'move', 10, 2, 5 ] , [ 12, 1, '555' ]  )
      transform(["move", 10, 3, 9], [11, 4, "8"],  
                ["move", 10, 1, 9], [10, 2, "", 11, 2, "8"])
      transform(["move", 12, 2, 5], [10, 5, "9"],  
                undefined,          [5, 2, "", 10, 3, "9"])
      transform(["move", 10, 2, 9], [11, 4, ""],  
                ["move", 10, 1, 9], [10, 1, "", 11, 3, ""])
      transform(["move", 11, 3, 4], [11, 3, "00000"],  
                ["move", 11, 5, 4], [ 4, 3, "00000"])
      transform(["move", 2, 2, 6], [1, 4, ""],  
                undefined,         [ 1, 2, '' , 2, 2, ''])
      transform(["move", 2, 2, 7], [1, 4, ""],  
                undefined,         [ 1, 2, '' , 3, 2, ''])
      transform(["move", 1, 2, 6], [1, 4, ""],  
                undefined,         [ 1, 2, '' , 2, 2, ''])
      transform(["move", 2, 1, 4], [0, 4, "1"],  
                undefined, [ 0, 4, '1' ])
      transform(["move", 2, 2, 4], [0, 4, "1"],  
                undefined, [ 0, 4, '1' ])
    })
    it ('should resolve against single splice (10000 fuzzy runs)', function() {
      for (var runs = 0; runs < 100; runs++) {
        var op1 = ['move', 10 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 5)]
        op1.push(Math.random() > 0.5 ? op1[1] + op1[2] + Math.floor(Math.random() * 5) : op1[1] - Math.floor(Math.random() * 5))
        var op2 = [];
        for (var i = 0, j = 1; i < j; i++) {
          op2.push(10 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 5) + 1, Array(Math.floor(Math.random() * 10)).join(Math.floor(Math.random() * 10)))
        }
        transform(op1, op2)
      }
    })
    it ('should resolve against single replacement (10000 fuzzy runs)', function() {
      for (var runs = 0; runs < 100; runs++) {
        var op1 = ['move', 10 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 5)]
        op1.push(Math.random() > 0.5 ? op1[2] + Math.floor(Math.random() * 5) : op1[1] - Math.floor(Math.random() * 5))
        var op2 = [];
        for (var i = 0, j = 1; i < j; i++) {
          op2.push(10 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 5) + 1, Array(Math.floor(Math.random() * 10)).join(Math.floor(Math.random() * 10)))
        }
        transform(op1, op2)
      }
    })

    it ('should resolve multiple splice cases caught by fuzzer', function() {
      transform(["move", 12, 2, 9],  [11, 4, "", 12, 2, ""],  
               undefined,            [ 9, 2, '', 11, 2, '', 12, 2, ''] )
      transform(["move", 9, 3, 14],  [11, 4, "", 12, 2, ""],  
               undefined,            [ 9, 2, '', 11, 2, '', 12, 2, ''] )

      transform(["move", 12, 2, 18],  [10, 4, "", 12, 3, ""],  
               undefined,             [ 10, 2, '', 12, 5, '' ] )
      transform(["move", 14, 4, 12],  [10, 4, "", 12, 3, ""],  
               undefined,             [ 10, 2, '', 12, 5, '' ] )

      transform(["move", 14, 1, 11],  [11, 3, "", 12, 5, ""],  
               undefined,             [12, 8, ""] )
      transform(["move", 11, 3, 15],  [11, 3, "", 12, 5, ""],  
               undefined,             [12, 8, ""] )

      transform(["move", 14, 1, 11],  [10, 2, "", 11, 3, ""],  
               undefined,            [10, 3, "", 11, 2, ""] )
      transform(["move", 11, 3, 15],  [10, 2, "", 11, 3, ""],  
               undefined,            [10, 3, "", 11, 2, ""] )

      transform(["move", 14, 2, 3],  [10, 2, "", 12, 3, ""],  
               undefined,            [3, 2, "", 10, 2, "", 12  , 1, ""] )
      transform(["move", 3, 11, 16],  [10, 2, "", 12, 3, ""],  
                undefined,  [ 3, 2, '', 10, 2, '', 12, 1, '' ] )

      transform(["move", 5, 6, 13],  [10, 1, "", 11, 4, ""],  
                [ 'move', 5, 5, 11 ],  [ 6, 1, '', 11, 4, "" ] )
      transform(["move", 5, 6, 12],  [10, 1, "", 11, 4, ""],  
                [ 'move', 5, 5, 11 ],  [ 11, 5, '' ] )
      transform(["move", 11, 2, 5],  [12, 4, "", 10, 1, ""],  
                [ 'move', 10, 1, 5 ], [6, 1, "", 11, 4, ""] )


      transform( ["move", 3, 8, 14],  [10, 4, "", 12, 1, ""],  
                 undefined,           [3, 3, "", 10, 1, "", 12, 1, ''] )
      transform( ["move", 11, 3, 3],  [10, 4, "", 12, 1, ""],  
                 undefined,           [3, 3, "", 10, 1, "", 12, 1, ''] )
      transform( ["move", 11, 0, 3],  [10, 4, "", 11, 2, ""],  
                undefined,  [10, 4, "", 11, 2, ""] )
      transform(["move", 3, 10, 15],  [10, 4, "", 12, 5, ""],  
                ["move", 3, 7, 11],  [3, 1, "", 11, 3, "", 12, 5, ""] )
      transform(["move", 13, 2, 3],  [10, 4, "", 12, 5, ""],  
                ["move", 10, 1, 3],  [3, 1, "", 11, 3, "", 12, 5, ""] )

      transform(["move", 14, 4, 5],  [10, 5, "", 12, 1, ""],  
                [ 'move', 10, 2, 5 ], [5, 1, "", 7, 1, "", 12, 4, ""] )
    })
    it ('should resolve against multiple removals (100000 fuzzy runs)', function() {
      for (var runs = 0; runs < 100000; runs++) {
        var op1 = ['move', 10 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 15)]
        op1.push(Math.random() > 0.5 ? op1[1] + op1[2] + Math.floor(Math.random() * 5) : op1[1] - Math.floor(Math.random() * 5))
        var op2 = [];
        for (var i = 0, j = 5; i < j; i++) {
          op2.push(10 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 10) + 1, "")
        }
        transform(op1, op2)
      }

    })

    it ('should resolve against multiple replacements (100000 fuzzy runs)', function() {
      for (var runs = 0; runs < 100000; runs++) {
        var op1 = ['move', 10 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 15)]
        op1.push(Math.random() > 0.5 ? op1[1] + op1[2] + Math.floor(Math.random() * 10) : op1[1] - Math.floor(Math.random() * 10))
        var op2 = [];
        for (var i = 0, j = 5; i < j; i++) {
          op2.push(10 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 5) + 1, Array(Math.floor(Math.random() * 10)).join(Math.floor(Math.random() * 10)))
        }
        transform(op1, op2)
      }
    })
  })
})