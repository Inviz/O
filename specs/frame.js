/*
  The wire format.

  `splice` and `move` both decide in a shared coordinate frame and both have to carry that
  frame with the answer they emit. Hung on the answer as an array property it does not survive
  `JSON.stringify`, so an answer that crosses a process arrives stripped and the peers disagree
  again. `['frame', payload]` is that frame said as an ordinary operation, which serializes
  like any other.

  Every convergence case below sends every answer through JSON.stringify/parse, which is the
  only thing that makes it a wire.
*/
describe('O.frame', function() {

  // The whole reason the format exists, stated as an assertion.
  it('should survive JSON where an array property does not', function() {
    var withProperty = [0, 0, 'x'];
    withProperty.origin = 'lost';
    Object.defineProperty(withProperty, '_E', { value: 'also lost', enumerable: true });
    var roundTripped = JSON.parse(JSON.stringify(withProperty));
    expect(roundTripped.origin).toBeUndefined();
    expect(roundTripped._E).toBeUndefined();

    var stamped = O.frame.stamp([0, 0, 'x'], { splice: { del: [[1, 2]], ins: [] } });
    expect(O.frame.read(JSON.parse(JSON.stringify(stamped)), 'splice'))
      .toEqual({ del: [[1, 2]], ins: [] });
  });

  it('should edit nothing when applied', function() {
    expect(O('abcdef', ['frame', { move: { set: [], length: 6 } }])).toEqual('abcdef');
    expect(O('abcdef', [[0, 1, 'X'], ['frame', { splice: { del: [], ins: [] } }]])).toEqual('Xbcdef');
    expect(O('abcdef', [['frame', { splice: { del: [], ins: [] } }], [0, 1, 'X']])).toEqual('Xbcdef');
  });

  it('should leave an operation that carries no frame exactly as it was', function() {
    var bare = [[0, 1, 'X'], ['move', 2, 1, 4]];
    expect(O.frame.strip(bare)).toBe(bare);
    expect(O.frame.unstamp(bare)).toBe(bare);
    expect(O.frame.read(bare, 'move')).toBeUndefined();
    expect(O.frame.read([0, 0, 'x'], 'splice')).toBeUndefined();
  });

  it('should be the inverse of stamping', function() {
    expect(O.frame.unstamp(O.frame.stamp(['move', 1, 2, 5], { move: { set: [], length: 9 } })))
      .toEqual(['move', 1, 2, 5]);
    expect(O.frame.unstamp(O.frame.stamp([0, 0, 'x'], { splice: { del: [], ins: [] } })))
      .toEqual([0, 0, 'x']);
    expect(O.frame.unstamp(O.frame.stamp([['move', 1, 2, 5], ['move', 0, 1, 3]], { move: { set: [], length: 9 } })))
      .toEqual([['move', 1, 2, 5], ['move', 0, 1, 3]]);
  });

  /*
    Three peers, every answer serialized between every step. Without the frame on the wire the
    third peer of each case reads a different document from the other two -- the cases are the
    two lanes' own minimal counterexamples.
  */
  function overTheWire(document, contributions) {
    var results = [];
    for (var i = 0; i < contributions.length; i++) {
      var log = JSON.parse(JSON.stringify(contributions[i]));
      for (var j = 0; j < contributions.length; j++) {
        if (j === i) continue;
        var answer = O.transform(log, JSON.parse(JSON.stringify(contributions[j])), true);
        if (answer !== undefined) answer = JSON.parse(JSON.stringify(answer));
        log = log.concat([answer]);
      }
      results.push(O(document, log));
    }
    return results;
  }

  it('should converge three splicing peers across a wire', function() {
    // Two peers insert the same text at the same place and a third deletes what it sits
    // before. The edit set counts one identical insertion once; an array cannot say that.
    expect(overTheWire('abcdef', [[[0, 0, '1']], [[0, 0, '1']], [[0, 1, '']]]))
      .toEqual(['1bcdef', '1bcdef', '1bcdef']);
  });

  it('should converge three moving peers across a wire', function() {
    // "abcd", each peer carrying one element to the end. HEAD's pairwise verdicts are cyclic
    // here: a before b, b before c, c before a.
    expect(overTheWire('abcd', [[['move', 0, 1, 4]], [['move', 1, 1, 4]], [['move', 2, 1, 4]]]))
      .toEqual(['dcba', 'dcba', 'dcba']);
    expect(overTheWire('abc', [[['move', 1, 1, 0]], [['move', 1, 2, 0]], [['move', 2, 1, 1]]]))
      .toEqual(['cba', 'cba', 'cba']);
  });
});
