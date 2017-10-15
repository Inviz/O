describe('O.splice', function() {
  it ('should splice strings', function() {
    expect(O.splice('abcdefg', [3, 2, 'lol'])).toEqual('abclolfg')
  })
  it ('should use custom operation strings', function() {
    expect(O.splice('abcdefg', [3, 2, [['set', 'lol'], ['set', 'zol']]])).toEqual('abczolfg')
  })
  it ('should splice arrays', function() {
    expect(O.splice('abcdefg'.split(''), [3, 2, ['l', 'o', 'l']])).toEqual('abclolfg'.split(''))
  })
  describe('.normalize', function() {
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
  
  describe('.splice', function() {
    describe('multichunk', function() {

      it ('simple command offset', function() {

        transform([0, 1, '111',  10, 0, '1'],  [1, 0, '2'],
                  [ 0, 1, '111', 11, 0, '1'],  [3, 0,'2'])
        transform([0, 0, '222',  10, 0, '1'],  [0, 0, '1'],
                  [ 1, 0, '222', 11, 0, '1'],  [0, 0,'1'])
        transform([0, 1, '222',  10, 0, '1'],  [0, 0, '1'],
                  [ 1, 1, '222', 11, 0, '1'],  [0, 0,'1'])

      })
      it ('long range', function() {

        transform([0, 1, '1',  10, 0, '2'],  [0, 10, ''],
                  [ 0, 0, '1', 1, 0, '2'],  [ 1, 9, '' ])
        transform([0, 1, '3',  10, 0, '1'],  [0, 10, '2'],
                  [ 1, 0, '3', 2, 0, '1'],  [ 0, 0, '2', 1, 9, '' ])
        //transform([0, 0, '222',  10, 0, '1'],  [0, 10, '1'],
        //          [ 1, 0, '222', 11, 0, '1'],  [0, 10, '1'])
        //transform([0, 1, '222',  10, 0, '1'],  [0, 10, '1'],
        //          [ 1, 1, '222', 11, 0, '1'],  [0, 10, '1'])

      })
      it ('interlaving chunk offset', function() {

        transform([0, 1, '222',  10, 0, '1'],  [0, 0, '1', 20, 0, '3'],
                  [ 1, 1, '222', 11, 0, '1'],  [0, 0,'1', 23, 0, '3'] )
        transform([0, 1, '111',  10, 0, '1'],  [1, 0, '2', 20, 0, '3' ],
                  [ 0, 1, '111', 11, 0, '1'],  [3, 0,'2', 23, 0, '3'] )
        transform([0, 0, '222',  10, 0, '1'],  [0, 0, '1', 20, 0, '3'],
                  [ 1, 0, '222', 11, 0, '1'],  [0, 0,'1', 24, 0, '3'] )

      })
    })

    describe('single chunk', function() {
      it ('simple test - intersection and reordering', function() {
        transform([0, 4, '2'],  [1, 2, '1'],
                  [0, 1, '', 1, 1, '2'],  [0,0,'1'])

        debugger
        transform([0, 1, '2'],  [1, 2, '1'],
                  [0, 1, '', 1, 0, '2'],  [0,0,'1', 2, 2, ''])


        transform([0, 4, '1'],  [1, 2, '2'],
                  [ 0, 1, '1', 2, 1, '' ],  [1,0,'2'])
        transform([0, 1, '1'],  [1, 2, '2'],
                  [0, 1, '1'],  [ 1, 2, '2' ])

        transform([0, 3, '2'],  [1, 2, '1'],
                  [0, 1, '', 1, 0, '2'],  [0,0,'1'])
        transform([0, 3, '1'],  [1, 2, '2'],
                   [ 0, 1, '1' ],  [1,0,'2'])

      })
      it ('simple test - basic deletes and edits', function() {


        transform([0, 2, '2'],  [1, 2, '1'],
                  [0, 1, '', 1, 0, '2'],  [0,0,'1', 2, 1, ''])

        transform([0, 1, ''],  [1, 1, '2'],
                  [0, 1, ''],  [0, 1, '2'])

        transform([0, 2, '1'],  [1, 1, '2'],
                  [0, 1, '1'],  [1,0,'2'])


        transform([0, 2, '1'],  [1, 2, '2'],
                  [0, 1, '1'],  [1,1,'2'])

        transform([0, 2, '2'],  [1, 1, '1'],
                  [0, 1, '', 1, 0, '2'],  [0,0,'1'])


        transform([0, 2, ''],  [1, 1, '2'],
                  [0, 1, ''],  [0, 0, '2'])

        transform([0, 1, '1'],  [1, 1, '2'],
                  [0, 1, '1'],  [1, 1, '2'])
      })

      it ('simple test - equal position', function() {


        transform([0, 1, '1'],  [0, 0, '2'],
                  [ 0, 0, '1', 2, 1, '' ],  [1, 0, '2'])

        transform([0, 0, '1'],  [1, 0, '2'],
                  [0, 0, '1'],  [2, 0, '2'])

        transform([0, 0, '1'],  [0, 0, '2'],
                  [0, 0, '1'],  [1, 0, '2'])

        transform([0, 0, '2'],  [0, 0, '1'],
                  [1, 0, '2'],  [0, 0, '1'])

        transform([0, 1, '2'],  [0, 0, '1'],
                  [1, 1, '2'],  [0, 0, '1'])

        transform([0, 0, '1'],  [0, 1, '2'],
                  [0, 0, '1'],  [1, 1, '2'])

        transform([0, 0, '2'],  [0, 1, '1'],
                  [1, 0, '2'],  [0, 0, '1', 2, 1, '' ] )

        transform([0, 0, '111'],  [0, 1, '222'],
                  [0, 0, '111'],  [3, 1, '222'])

        transform([0, 0, '222'],  [0, 1, '111'],
                  [3, 0, '222'],  [0, 0, '111', 6, 1, '' ] )
      })

      it ('simple test - multicharacter edits', function() {

        transform([0, 2, '111'],  [1, 1, '222'],
                  [0, 1, '111'],  [3,0,'222'])

        transform([0, 2, '222'],  [1, 1, '111'],
                  [0, 1, '', 3, 0, '222'],  [0,0,'111'])


        transform([0, 2, ''],  [1, 1, '222'],
                  [0, 1, ''],  [0, 0, '222'])

        transform([0, 1, ''],  [1, 1, '222'],
                  [0, 1, ''],  [0, 1, '222'])

        transform([0, 1, '111'],  [1, 1, '222'],
                  [0, 1, '111'],  [3, 1, '222'])

        transform([0, 1, '111'],  [2, 1, '222'],
                  [0, 1, '111'],  [4, 1, '222'])

        // [A][B]
        transform([0, 0, '111'],  [1, 0, '222'],
                  [0, 0, '111'],  [4, 0, '222'])

      })
    });
    it ('should resolve insertions at different positions', function() {
      debugger

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

      debugger
      transform([3, 9, ""],  [7, 2, "", 8, 5, ""],
                [3, 5, ''],  [3, 3, ""])

      
      transform([1, 4, "", 4, 2, ""],  [3, 7, "", 9, 1, ""],
                [1, 2, ""],  [1, 3, '', 7, 1, ''])

      
      transform([3, 9, ""],  [10, 5, ""],
                [3, 7, ''],  [3, 3, ""])



      transform([3, 9, ""],  [7, 2, ""],
                [3, 7, ''],  undefined)



    })
    it ('should resolve concurrent insertions', function() {
      debugger
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
      transform([61,2,"0000000"], [59,4,"66666"],
                [59,0,"0000000"], [ 59, 2, '', 66, 0, '66666'])

      transform([1, 1, '11'],  [1, 0, '222'],
                [ 1, 0, '11', 6, 1, ''],  [3, 0, '222'])
      transform([1, 2, '11'],  [1, 1, '222'],
                [1, 0, '11', 6, 1, ''],  [ 3, 0, '222' ])

      transform([1, 2, '1'],  [1, 1, '2'],
                [1, 0, '1', 3, 1, ''],  [ 2, 0, '2' ])
      transform([1, 1, '1'],  [1, 0, '2'],
                [ 1, 0, '1', 3, 1, '' ],  [2, 0, '2'])

      transform([1, 1, '1'],  [1, 2, '2'],
                [1, 0, '1'],  [2, 1, '2'])
      transform([1, 1, '1'],  [1, 1, '2'],
                [1, 0, '1'],  [2, 0, '2'])
      // execute insertions before replacements
      transform([1, 2, '1'],  [2, 2, '2'],
                [1, 1, '1'],  [2, 1, '2'])
      transform([1, 1, '2'],  [1, 0, '1'],
                [2, 1, '2'],  [1, 0, '1'])
    })
    it ('should resolve concurrent replacements caught by fuzzer', function() {
      debugger

      transform( [20, 10, "6666"], [19, 9, "99999999"] , 
        [ 19, 0, '6666', 31, 2, '' ] , [ 19, 1, '', 23, 0, '99999999' ])

      transform([1, 3, "1", 9, 8, "000"],    [1, 4, "0000000"],
                 [ 8, 0, '1', 15, 8, '000' ], [ 1, 0, '0000000', 9, 1, '' ] )

      
      transform([4, 3, "00", 9, 6, "1"],   [4, 3, "00"],
                [ 4, 0, '00', 11, 6, '1' ], [ 4, 0, '00' ])


      transform([0, 1, "", 4, 8, "1"],   [0, 1, "1111111", 12, 1, ""],
                [ 11, 7, '1' ] ,   [ 0, 0, '1111111' ])

      transform([44, 0, "44444"], [30, 19, "999"], 
                [30, 0, "44444"], [30, 14, '', 35, 5, '999'  ])



      transform([28, 10, ""], [31, 5, "111111"], 
                [ 28, 3, '', 34, 2, '' ] , [ 28, 0, '111111' ])


      transform([5, 12, "11111111"], [6, 8, "888888"],
                [ 5, 1, '11111111', 19, 3, '' ],  [ 13, 0, '888888' ])


      transform([5, 8, "333"], [6, 1, "555555"])




      transform( [12, 9, "666666"], [9, 3, "8888"], 
                 [ 9, 0, '666666', 19, 9, '' ],  [ 9, 3, '', 15, 0, '8888' ]  )

      transform( [15, 9, "5555555"], [8, 12, "333"], 
                [ 11, 4, '5555555' ], [ 8, 7, '333' ] )

      transform( [17, 9, "444"], [25, 6, "22"], 
                [ 17, 8, '', 19, 0, '444' ] ,  [ 17, 0, '22', 22, 5, '' ] )


      transform([0, 1, "", 1, 2, "1111"],    [0, 1, "00000"],
                [ 6, 2, '1111'],    [ 0, 0, '00000' ])

      transform([20, 6, "000"], [10, 19, "99"], 
                [ 10, 0, '000' ], [ 10, 10, '', 13, 3, '99' ])


    })

    it ('should resolve concurrent replacements caught by fuzzer complex', function() {
      transform([0, 4, "11111", 9, 10, "000000"],    [0, 4, "0", 10, 11, ""],
                 [ 1, 0, '11111', 10, 5, '000000' ], [0, 0, "0", 16, 6, ""])


      transform([20, 6, "000", 37, 0, '2'], [10, 19, "99", 23, 0, '1'], 
                [ 10, 0, '000', 27, 0, '2' ], [ 10, 10, '', 13, 3, '99', 26, 0, '1'  ])

      transform([20, 6, "000", 44, 0, "44444"], [10, 19, "99", 30, 19, "999"], 
                [ 10, 0, '000', 33, 0, "44444"], [ 10, 10, '', 13, 3, '99', 38, 19, '999' ])


      transform([20, 6, "000", 44, 0, "44444", 75, 8, ""],
                [10, 19, "99", 30, 19, "999"], 
                [ 10, 0, '000', 33, 0, '44444', 48, 8, '' ] ,
                 [ 10, 10, '', 13, 3, '99', 38, 19, '999' ] )

      

    })
    it ('should handle concurrent multicharacter replacements', function() {
      debugger
      transform([1, 2, '111'],  [2, 2, '222'],
                [1, 1, '111'],  [4, 1, '222'])
      transform([1, 2, '111'],  [1, 1, '222'],
                [1, 0, '111', 7, 1, ''],  [ 4, 0, '222' ])
      transform([1, 1, '111'],  [1, 2, '222'],
                [1, 0, '111'],  [4, 1, '222'])
      transform([1, 1, '111'],  [1, 1, '222'],
                [1, 0, '111'],  [4, 0, '222'])
      transform([1, 1, '111'],  [1, 0, '222'],
                [ 1, 0, '111', 7, 1, '' ],  [4, 0, '222'])
      transform([1, 1, '222'],  [1, 0, '111'],
                [4, 1, '222'],  [1, 0, '111'])
    })
    it ('should resolve removals (10000 fuzzy runs)', function() {
      for (var runs = 0; runs < 100000; runs++) {
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
    xit ('should resolve replacements (10000 fuzzy runs)', function() {
      for (var runs = 0; runs < 100; runs++) {
        var op1 = [];
        for (var i = 0, j = Math.floor(Math.random() * 2); i < j; i++) {
          op1.push(Math.floor(Math.random() * 32), Math.floor(Math.random() * 12) + 1, Array(Math.floor(Math.random() * 10)).join(Math.floor(Math.random() * 10)))
        }
        var op2 = [];
        for (var i = 0, j = Math.floor(Math.random() * 2); i < j; i++) {
          op2.push(Math.floor(Math.random() * 32), Math.floor(Math.random() * 12) + 1, Array(Math.floor(Math.random() * 10)).join(Math.floor(Math.random() * 10)))
        }
        transform(op1, op2)
      }
    })
  })

  xdescribe('.invert', function() {
    it ('should invert splices s', function() {
      invert('abcdefghijklmnopqrst', [0, 3, "444444", 0, 1, "44444444"])

      invert(['a', 'b', 'c', 'd', 'e', 'f', 'g'], [0, 0, ['x', 'y'], 3, 1, []], [ 0, 2, [],1, 0, ['b']])
      invert(['a', 'b', 'c', 'd', 'e', 'f', 'g'], [0, 0, ['x', 'y'], 3, 1, ['z']], [ 0, 2, [],1, 1, ['b']])
      invert(['a', 'b', 'c', 'd', 'e', 'f', 'g'], [0, 0, ['x', 'y'], 3, 2, ['z']], [ 0, 2, [],1, 1, ['b','c']])
      invert(['a', 'b', 'c', 'd', 'e', 'f', 'g'], [0, 0, ['x', 'y'], 3, 1, ['y', 'z']], [ 0, 2, [],1, 2, ['b']])
      invert(['a', 'b', 'c', 'd', 'e', 'f', 'g'], [0, 0, ['x', 'y'], 3, 2, ['y', 'z']], [ 0, 2, [],1, 2, ['b','c']])


      invert('abcdefg', [0, 0, 'xy', 3, 1, ''], [ 0, 2, '',1, 0, 'b'])
      invert('abcdefg', [0, 0, 'xy', 3, 1, 'z'], [ 0, 2, '',1, 1, 'b'])
      invert('abcdefg', [0, 0, 'xy', 3, 2, 'z'], [ 0, 2, '',1, 1, 'bc'])
      invert('abcdefg', [0, 0, 'xy', 3, 1, 'yz'], [ 0, 2, '',1, 2, 'b'])
      invert('abcdefg', [0, 0, 'xy', 3, 2, 'yz'], [ 0, 2, '',1, 2, 'bc'])

      invert('abcdefg', [0, 0, '1'], [0, 1, ''])
      invert('abcdefg', [0, 1, ''], [0, 0, 'a'])
      invert('abcdefg', [0, 1, 'z'], [0, 1, 'a'])
      invert('abcdefg', [0, 2, 'z'], [0, 1, 'ab'])
      invert('abcdefg', [0, 1, 'yz'], [0, 2, 'a'])
      invert('abcdefg', [0, 2, 'yz'], [0, 2, 'ab'])

      invert('abcdefg', [0, 1, 'ab', 3, 1, ''], [ 0, 2, 'a',2, 0, 'c'])
      invert('abcdefg', [0, 1, 'ab', 3, 1, 'z'], [ 0, 2, 'a',2, 1, 'c'])
      invert('abcdefg', [0, 1, 'ab', 3, 2, 'z'], [ 0, 2, 'a',2, 1, 'cd'])
      invert('abcdefg', [0, 1, 'ab', 3, 1, 'yz'], [ 0, 2, 'a',2, 2, 'c'])
      invert('abcdefg', [0, 1, 'ab', 3, 2, 'yz'], [ 0, 2, 'a',2, 2, 'cd'])
    })
    xit ('should invert splices (10000 fuzzy runs)', function() {

      var letters = Array(226);
      for (var i = 0; i < 226; i++)
        letters[i] = String.fromCharCode('a'.charCodeAt(0) + i);
      var alphabet = letters.join('')
      for (var runs = 0; runs < 10000; runs++) {
        var op1 = [];
        for (var i = 0, j = Math.floor(Math.random() * 27); i < j; i++) {
          op1.push(Math.floor(Math.random() * 32), Math.floor(Math.random() * 12) + 1, Array(Math.floor(Math.random() * 10)).join(Math.floor(Math.random() * 10)))
        }
        invert(alphabet, op1)
      }
    })
  })

})