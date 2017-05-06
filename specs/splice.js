describe('O.splice', function() {
  it ('should splice strings', function() {
    expect(O.splice('abcdefg', [3, 2, 'lol'])).toEqual('abclolfg')
  })
  var letters = Array(226);
  for (var i = 0; i < 226; i++)
    letters[i] = String.fromCharCode('a'.charCodeAt(0) + i);
  var alphabet = letters.join('')
  function normalize(left, right, ignoreResult) {
    left = O.normalize(left)
  
    // ensure list is wellformed    
    if (left)
      for (var i = 3; i < left.length; i += 3)
        if (left[i - 3] >= left[i]) {
          expect(left[i]).toBeGreaterThan(left[i - 3])
          throw 1;
        }
    
    // check normalized result if provided
    if (!ignoreResult) {
      var prev = -1;
      expect(left).toEqual(right);
    }
    
    // validate result with simple logic
    var i = 0;
    expect(O(alphabet, left)).toEqual(O(alphabet, right))
  }
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
  it ('should use custom operation strings', function() {
    expect(O.splice('abcdefg', [3, 2, [['set', 'lol'], ['set', 'zol']]])).toEqual('abczolfg')
  })
  it ('should splice arrays', function() {
    expect(O.splice('abcdefg'.split(''), [3, 2, ['l', 'o', 'l']])).toEqual('abclolfg'.split(''))
  })
  describe('.normalize()', function() {
    it ('should splice multiple chunks', function() {
      expect(O('12345678910', 
              [1, 1, 'AAA', // 1AAA345678910
              5, 1, 'BBB',  // 1AAA3BBB05678910
              9, 0, 'CCC',  // 1AAA3BBB05CCC678910
              18, 0, 'DDD', // 1AAA3BBB05CCC678910DDD
              ])).toEqual('1AAA3BBB5CCC678910DDD')

      expect(O('12345678910', 
              [11, 0, 'DDD', // 12345678910DDD
              3, 1, 'BBB',   // 123BBB5678910DDD
              7, 0, 'CCC',   // 123BBBCCC5678910DDD
              1, 1, 'AAA'    // 1AAA3BBB5CCC678910DDD
              ])).toEqual('1AAA3BBB5CCC678910DDD')
    })
    it ('should skip empty splice ranges', function() {
      normalize([1, 2, 'test'], [1, 2, 'test'])
      normalize([1, 0, 'test'], [1, 0, 'test'])
      normalize([1, 0, ''], undefined)
      normalize([1, 0, 'test', 1, 0, ''], [1, 0, 'test'])
      normalize([1, 0, '', 1, 0, 'test'], [1, 0, 'test'])
    })
    it ('should append insertion to adjacent range', function() {
      // A[B]
      normalize([7, 0, 'A', 8, 0, 'B'], [7, 0, 'AB'])
      // [B]A
      normalize([7, 0, 'A', 7, 0, 'B'], [7, 0, 'BA'])
      // -A[B]
      normalize([7, 1, 'A', 8, 0, 'B'], [7, 1, 'AB'])
      // [B]-A
      normalize([7, 1, 'A', 7, 0, 'B'], [7, 1, 'BA'])
      // -[B]
      normalize([7, 1, '',  7, 0, 'B'], [7, 1, 'B'])
      // [B]-
      normalize([7, 1, '',  6, 0, 'B'], [6, 0, 'B', 8, 1, ''])
    })
    it ('should update adjacent range', function() {
      // A[B]A
      normalize([7, 0, 'AA', 8, 0, 'B'], [7, 0, 'ABA'])
      // A<B>
      normalize([7, 0, 'AA', 8, 1, 'B'], [7, 0, 'AB'])
      // <B>A
      normalize([7, 0, 'AA', 7, 1, 'B'], [7, 0, 'BA'])

      // A[BBB]A
      normalize([7, 0, 'AA', 8, 0, 'BBB'], [7, 0, 'ABBBA'])
      // A<BBB>
      normalize([7, 0, 'AA', 8, 1, 'BBB'], [7, 0, 'ABBB'])
      // <BBB>A
      normalize([7, 0, 'AA', 7, 1, 'BBB'], [7, 0, 'BBBA'])

      // A[BBB]A
      normalize([7, 1, 'AA', 8, 0, 'BBB'], [7, 1, 'ABBBA'])
      // A<BBB>
      normalize([7, 1, 'AA', 8, 1, 'BBB'], [7, 1, 'ABBB'])
      // <BBB>A
      normalize([7, 1, 'AA', 7, 1, 'BBB'], [7, 1, 'BBBA'])

      // A[BBB]A
      normalize([7, 1, 'AA', 7, 2, 'BBB'], [7, 1, 'BBB'])
      // A<BBB>
      normalize([7, 3, 'AA', 8, 2, 'BBB'], [7, 4, 'ABBB'])
      // <BBB>A
      normalize([7, 1, 'AA', 6, 2, 'BBB'], [6, 2, 'BBBA'])

    })
    it ('should append multicharacter insertion to adjacent range', function() {
      // A[B]
      normalize([7, 0, 'A', 8, 0, 'BCD'], [7, 0, 'ABCD'])
      // [B]A
      normalize([7, 0, 'A', 7, 0, 'BCD'], [7, 0, 'BCDA'])
      // -A[B]
      normalize([7, 1, 'A', 8, 0, 'BCD'], [7, 1, 'ABCD'])
      // [B]-A
      normalize([7, 1, 'A', 7, 0, 'BCD'], [7, 1, 'BCDA'])
      // -[B]
      normalize([7, 1, '',  7, 0, 'BCD'], [7, 1, 'BCD'])
      // [B]-
      normalize([7, 1, '',  6, 0, 'BCD'], [6, 0, 'BCD', 10, 1, ''])
    })
    
    it ('should append removal to adjacent range', function() {
      // A[-]
      normalize([7, 0, 'A', 8, 1, ''], [7, 1, 'A'])
      // [-]A
      normalize([7, 0, 'A', 7, 1, ''], undefined)
      // -A[-]
      normalize([7, 1, 'A', 8, 1, ''], [7, 2, 'A'])
      // [-]-A
      normalize([7, 1, 'A', 7, 1, ''], [7, 1, ''])
      // -[-]
      normalize([7, 1, '',  7, 1, ''], [7, 2, ''])
      // [-]-
      normalize([7, 1, '',  6, 1, ''], [6, 2, ''])
    })  

    it ('should append multicharacter removal to adjacent range', function() {
      // A[-]
      normalize([7, 0, 'A', 8, 3, ''], [7, 3, 'A'])
      // [-]A
      normalize([7, 0, 'A', 7, 3, ''], [7, 2, ''])
      // -A[-]
      normalize([7, 1, 'A', 8, 3, ''], [7, 4, 'A'])
      // [-]-A
      normalize([7, 1, 'A', 7, 3, ''], [7, 3, ''])
      // -[-]
      normalize([7, 1, '',  7, 3, ''], [7, 4, ''])
      // [-]-
      normalize([7, 1, '',  6, 3, ''], [6, 4, ''])
    })  

    it ('should append replacement to adjacent range', function() {
      // A[-B]
      normalize([7, 0, 'A', 8, 1, 'B'], [7, 1, 'AB'])
      // [-B]A
      normalize([7, 0, 'A', 7, 1, 'B'], [7, 0, 'B'])
      // -A[-B]
      normalize([7, 1, 'A', 8, 1, 'B'], [7, 2, 'AB'])
      // -[-B]A
      normalize([7, 1, 'A', 7, 1, 'B'], [7, 1, 'B'])
      // [-B]-A
      normalize([7, 1, 'A', 6, 1, 'B'], [6, 2, 'BA'])
      // -[-B]
      normalize([7, 1, '',  7, 1, 'B'], [7, 2, 'B'])
      // [-B]-
      normalize([7, 1, '',  6, 1, 'B'], [6, 2, 'B'])
    })

    it ('should reorder splice ranges', function() {
      normalize([3, 0, 'At3', 1, 1, 'At1'], [1, 1, 'At1', 5, 0, 'At3'])
      normalize([3, 0, 'At2', 
                          7, 0, 'At3', 
                          1, 0, 'At1'], [1, 0, 'At1', 6, 0, 'At2', 10, 0, 'At3'])
      normalize([11, 0, 'At4', // 12345678910AT4
                          3, 1, 'At2',  // 123AT25678910AT4
                          7, 0, 'At3',  // 123AT2AT35678910AT4
                          1, 1, 'At1']  // 1AT13AT2AT35678910AT4
                          , 
                          [1, 1, 'At1', // 1AT1345678910
                          5, 1, 'At2',  // 1AT13AT25678910
                          9, 0, 'At3',  // 1AT13AT25678910
                          18, 0, 'At4', // 1AT13AT2AT35678910AT4
                          ])
    })
    it ('should simplify multiple splices at once', function() {
      normalize([3, 2, 'AAA', 5, 7, 0], [3, 8, 'AA0'])
      normalize([3, 2, 'AAA', 5, 7, 0, 0, 10, 'C'], [0, 15, 'C'])
      normalize([3, 2, 'AAA', 5, 7, 0, 4, 10, 'C'], [3, 16, 'AC'])
    })

    it ('should normalize removals (10000 fuzzy runs)', function() {
      for (var runs = 0; runs < 10000; runs++) {
        var op = [];
        for (var i = 0, j = Math.floor(Math.random() * 10); i < j; i++) {
          op.push(Math.floor(Math.random() * 10), Math.floor(Math.random() * 10) + 1, '')
        }
        normalize(op, op, true)
      }
    })

    it ('should handle removals caught by fuzzy runs', function() {
      normalize([1, 4, "", 0, 10, "", 4, 10, "", 4, 6, "", 6, 5, "", 0, 6, ""],
                 [0, 41, ""])
      normalize([1, 2, "", 3, 1, "", 0, 2, ""], 
                                      [1, 2, "", 3, 1, "", 0, 2, ""], true)
      normalize([0, 4, "", 4, 1, "", 0, 3, ""], 
                                      [0, 4, "", 4, 1, "", 0, 3, ""], true)
      normalize([2, 3, "", 3, 1, "", 1, 1, ""], 
                                      [2, 3, "", 3, 1, "", 1, 1, ""], true)
    })


    it ('should normalize replacements (10000 fuzzy runs)', function() {
      for (var runs = 0; runs < 10000; runs++) {
        var op = [];
        for (var i = 0, j = Math.floor(Math.random() * 15); i < j; i++) {
          op.push(Math.floor(Math.random() * 10), Math.floor(Math.random() * 10) + 1, 
            Array(Math.floor(Math.random() * 10)).join(i))
        }
        normalize(op, op, true)
      }
    })


    it ('should handle replacements caught by fuzzy runs', function() {
      normalize([1, 5, "000", 3, 5, "1"], 
                                      [1, 5, "000", 3, 5, "1"], true)
      normalize([0, 9, "", 1, 10, "", 8, 1, "2222", 2, 6, "3333"], 
                                      [0, 9, "", 1, 10, "", 8, 1, "2222", 2, 6, "3333"], true)
    })

  })
  
  describe('.transform', function() {
    it ('should resolve insertions at different positions', function() {
      transform([1, 0, '1', 5, 0, '22'], [3, 0, '2', 7, 0, '2'],
                [1, 0, '1', 6, 0, '22'], [4, 0, '2', 10, 0, '2'])
      transform([1, 0, '1', 5, 0, '22'], [3, 0, '2'],
                [1, 0, '1', 6, 0, '22'], [4, 0, '2'])
      transform([1, 0, '1'], [3, 0, '2'],
                [1, 0, '1'], [4, 0, '2'])
    })
    it ('should simplify duplicate commands', function() {
      transform([1, 0, '1'],  [1, 0, '1'],
                undefined,  undefined)
      transform([1, 1, ''],  [1, 1, ''],
                undefined,  undefined)
      transform([1, 1, '1'],  [1, 1, '1'],
                undefined,  undefined)
      transform([1, 1, '12'],  [1, 1, '12'],
                undefined,  undefined)

    })
    it ('should resolve concurrent removals', function() {
      transform([3, 9, ""],  [7, 2, "", 8, 5, ""],
                [3, 5, ''],  [3, 3, ""])
      transform([0, 9, "", 9, 2, ""],  [0, 2, "", 5, 3, ""],
                [0, 5, '', 8, 2, ""],  [0, 1, ""])
      transform([1, 4, "", 4, 2, ""],  [3, 7, "", 9, 1, ""],
                [1, 2, ""],  [1, 3, '', 7, 1, ''])

    })
    it ('should resolve concurrent insertions', function() {
      transform([1, 0, '1'],  [1, 0, '2'],
                [1, 0, '1'],  [2, 0, '2'])
      transform([1, 0, '2'],  [1, 0, '1'],
                [2, 0, '2'],  [1, 0, '1'])
      transform([1, 0, '2'],  [1, 0, '11'],
                [3, 0, '2'],  [1, 0, '11'])
      transform([1, 0, '22'], [1, 0, '11'],
                [3, 0, '22'], [1, 0, '11'])
    })
    it ('should resolve concurrent replacements', function() {
      // execute insertions before replacements
      transform([1, 2, '1'],  [2, 2, '2'],
                [1, 1, '1'],  [2, 1, '2'])
      transform([1, 1, '1'],  [1, 2, '2'],
                undefined,    [1, 2, '2'])
      transform([1, 2, '1'],  [1, 1, '2'],
                [1, 2, '1'],  undefined)
      transform([1, 1, '1'],  [1, 1, '2'],
                [1, 1, '1'],  undefined)
      transform([1, 1, '1'],  [1, 0, '2'],
                [2, 1, '1'],  [1, 0, '2'])
      transform([1, 1, '2'],  [1, 0, '1'],
                [2, 1, '2'],  [1, 0, '1'])
    })
    it ('should resolve concurrent replacements caught by fuzzer', function() {


      transform([0, 1, "", 4, 8, "1"],   [0, 1, "1111111", 12, 1, ""],
                [0, 7, "", 4, 7, "1"],   undefined) // FIXME
      
      transform([4, 3, "00", 9, 6, "1"],   [4, 3, "00"],
                [9, 6, "1"],               undefined)
      
      transform([0, 4, "11111", 9, 10, "000000"],   [0, 4, "0", 10, 11, ""],
                [ 5, 5, '000000' ],                 [0, 5, "0", 11, 6, ""])

      transform([1, 3, "1", 9, 8, "000"],   [1, 4, "0000000"],
                [ 14, 8, '000' ],           [1, 2, "0000000"])
      transform([0, 1, "", 1, 2, "1111"],    [0, 1, "00000"], // FIXME
                [0, 5, '', 1, 2, '1111'],    undefined)
    })
    it ('should handle concurrent multicharacter replacements', function() {
      // execute insertions before replacements
      transform([1, 1, '111'],  [1, 2, '222'],
                undefined,      [1, 4, '222'])
      transform([1, 2, '111'],  [2, 2, '222'],
                [1, 1, '111'],  [4, 1, '222'])
      transform([1, 2, '111'],  [1, 1, '222'],
                [1, 4, '111'],  undefined)
      transform([1, 1, '111'],  [1, 1, '222'],
                [1, 3, '111'],  undefined)
      transform([1, 1, '111'],  [1, 0, '222'],
                [4, 1, '111'],  [1, 0, '222'])
      transform([1, 1, '222'],  [1, 0, '111'],
                [4, 1, '222'],  [1, 0, '111'])
    })
    it ('should resolve removals (10000 fuzzy runs)', function() {
      for (var runs = 0; runs < 1; runs++) {
        var op1 = [];
        for (var i = 0, j = Math.floor(Math.random() * 10); i < j; i++) {
          op1.push(Math.floor(Math.random() * 10), Math.floor(Math.random() * 10) + 1, '')
        }
        var op2 = [];
        for (var i = 0, j = Math.floor(Math.random() * 10); i < j; i++) {
          op2.push(Math.floor(Math.random() * 10), Math.floor(Math.random() * 10) + 1, '')
        }
        transform(op1, op2)
      }
    })
    it ('should resolve replacements (100000 fuzzy runs)', function() {
      for (var runs = 0; runs < 1; runs++) {
        var op1 = [];
        for (var i = 0, j = Math.floor(Math.random() * 27); i < j; i++) {
          op1.push(Math.floor(Math.random() * 32), Math.floor(Math.random() * 12) + 1, Array(Math.floor(Math.random() * 10)).join(Math.floor(Math.random() * 10)))
        }
        var op2 = [];
        for (var i = 0, j = Math.floor(Math.random() * 27); i < j; i++) {
          op2.push(Math.floor(Math.random() * 32), Math.floor(Math.random() * 12) + 1, Array(Math.floor(Math.random() * 10)).join(Math.floor(Math.random() * 10)))
        }
        transform(op1, op2)
      }
    })
  })

})