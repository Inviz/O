describe('O.typeof', function() {
  describe('the operation spelling', function() {
    // An operation array is named by its head, and the name has to be one O dispatches on.
    // Without that gate every array of strings is a call to an operation named by its own
    // first element, so a document cannot hold one.
    it ('should read a registered name as the operation it names', function() {
      expect(O.typeof(['move', 0, 2, 4])).toBe('move')
      expect(O.typeof(['set', 'abc'])).toBe('set')
      expect(O.typeof(['+', 3])).toBe('+')
      expect(O.typeof(['rot', 1, 7])).toBe('rot')
    })

    it ('should read an unregistered name as data', function() {
      expect(O.typeof(['approved', 'rejected'])).toBe('set')
      expect(O.typeof(['a', 'b'])).toBe('set')
      expect(O.typeof([''])).toBe('set')
    })

    // O carries helpers beside its operations, so the gate cannot be "does O have a property
    // by that name". Each name here answers to a live function on O that is not an operation.
    it ('should not dispatch on a helper that happens to hang off O', function() {
      expect(O.typeof(['typeof', 'x'])).toBe('set')
      expect(O.typeof(['compare', 'x'])).toBe('set')
      expect(O.typeof(['transform', 'x'])).toBe('set')
      expect(O.typeof(['normalize', 'x'])).toBe('set')
      expect(O.typeof(['invert', 'x'])).toBe('set')
      expect(O.typeof(['with', 'x'])).toBe('set')
    })

    it ('should keep every registered name reachable', function() {
      for (var name in O.operations)
        expect(typeof O[name]).toBe('function')
    })

    it ('should still read a value position as a set', function() {
      expect(O.typeof(['move', 0, 2, 4], true)).toBe('set')
      expect(O.typeof(['approved', 'rejected'], true)).toBe('set')
    })
  })

  describe('a document holding an array of strings', function() {
    it ('should survive being assigned', function() {
      expect(O({status: 'pending'}, {status: ['approved', 'rejected']}))
        .toEqual({status: ['approved', 'rejected']})
    })

    it ('should survive a later merge on another key', function() {
      expect(O({status: ['approved', 'rejected']}, {other: 'z'}))
        .toEqual({status: ['approved', 'rejected'], other: 'z'})
    })

    // JSON is its own patch: an object is still a merge and a scalar still a set.
    it ('should not cost the meta-circularity', function() {
      expect(O(undefined, {a: 1, b: {c: 2}})).toEqual({a: 1, b: {c: 2}})
      expect(O({a: 1, b: 2}, {b: 3})).toEqual({a: 1, b: 3})
      expect(O({k: 'abc'}, {k: [1, 1, 'X']})).toEqual({k: 'aXc'})
      expect(O({n: 1}, {n: ['+', 2]})).toEqual({n: 3})
      expect(O({k: 'abcdef'}, {k: ['move', 0, 2, 4]})).toEqual({k: 'cdabef'})
    })
  })

  // Still ambiguous: a number-headed array is a splice, and an empty or array-headed one is
  // a list, so a document cannot hold [0,3,7] or [] either. Closing those needs the splice
  // and list spellings to take a name head, which moves the triplet loops in src/splice.js,
  // src/move.js and src/merge.js.
  xit ('should read a number-headed or empty array as data', function() {
    expect(O({k: 0}, {k: [0, 3, 7]})).toEqual({k: [0, 3, 7]})
    expect(O({k: 1}, {k: []})).toEqual({k: []})
  })
})

describe('O.compare', function() {
  // Two peers pick the same winner without talking, so a pair O.compare declines to order --
  // or orders differently on another machine -- is a divergence.
  var values = [undefined, null, false, true, NaN, -1, 0, 1.5, '', 'abc', 'cde',
                [], [1], [1,2], ['set','abc'], {}, {a:1}, {b:1}, {a:1,b:2}];

  it ('should be defined on every pair', function() {
    for (var i = 0; i < values.length; i++)
      for (var j = 0; j < values.length; j++) {
        var result = O.compare(values[i], values[j]);
        expect(result === -1 || result === 0 || result === 1).toBe(true);
      }
  })

  it ('should be antisymmetric', function() {
    for (var i = 0; i < values.length; i++)
      for (var j = 0; j < values.length; j++)
        expect(O.compare(values[i], values[j])).toBe(-O.compare(values[j], values[i]));
  })

  it ('should be transitive', function() {
    for (var i = 0; i < values.length; i++)
      for (var j = 0; j < values.length; j++)
        for (var k = 0; k < values.length; k++) {
          var ij = O.compare(values[i], values[j]);
          var jk = O.compare(values[j], values[k]);
          if (ij < 0 && jk < 0) expect(O.compare(values[i], values[k])).toBe(-1);
          if (ij > 0 && jk > 0) expect(O.compare(values[i], values[k])).toBe(1);
          if (ij === 0 && jk === 0) expect(O.compare(values[i], values[k])).toBe(0);
        }
  })

  it ('should order booleans rather than dropping out', function() {
    expect(O.compare(true, false)).toBe(1);
    expect(O.compare(false, true)).toBe(-1);
    expect(O.compare(true, true)).toBe(0);
  })

  it ('should order objects rather than throwing', function() {
    expect(O.compare({a: 1}, {b: 2})).toBe(-1);
    expect(O.compare({b: 2}, {a: 1})).toBe(1);
    expect(O.compare({a: 1}, {a: 1})).toBe(0);
    expect(O.compare({a: 1}, {a: 2})).toBe(-1);
  })

  it ('should not rank null and undefined each below the other', function() {
    expect(O.compare(undefined, null)).toBe(-1);
    expect(O.compare(null, undefined)).toBe(1);
  })

  // localeCompare collates by locale, so two peers in different locales would order the same
  // pair differently. Code-unit order is the same everywhere.
  it ('should order strings by code unit, not by locale', function() {
    expect(O.compare('+', '*')).toBe(1);
    expect(O.compare('a', 'B')).toBe(1);
    expect(O.compare('Z', 'a')).toBe(-1);
  })

  it ('should be the order set uses', function() {
    expect(O.set.order).toBe(O.compare);
    expect(O.set.rank).toBe(O.rank);
  })
})
