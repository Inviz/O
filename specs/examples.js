describe('Examples', function() {
  it ('from readme', function() {
    // Two peers start with same identical of data
    var person = {name: 'Bob Woofs'};

    // One makes its changes
    var change1 = {
      name: [[0, 3, 'George']],  // change first name
      title: 'Hustleman',       // set property
      balance: [['+', 100]]     // add value
    }
    var own1 = O(person, change1);
    expect(own1).toEqual({name: 'George Woofs', title: 'Hustleman', balance: 100})

    // Another make conflicting changes
    var change2 = {
      name: [                   
        ['move', 4, 5, 0],      // swap last & first name
        ['move', 5, 3, 9]
      ],
      balance: [['-', 33]]      // remove value
    };
    var own2 = O(person, change2);
    expect(own2).toEqual({name: 'Woofs Bob', balance: -33})

    /* Now they both can apply each others commands.
       They are guaranteed to have identical result
       retaining semantic intent of both peers as much as possible */
       debugger
    var result1 = O(own1, O.transform(change1, change2));
    var result2 = O(own2, O.transform(change2, change1));

    expect(result1).toEqual({name: 'Woofs George', title: 'Hustleman', balance: 67})
    expect(result2).toEqual({name: 'Woofs George', title: 'Hustleman', balance: 67})

    expect(O(own1, O.transform(change1, change2)))
  })

  it ('arrays', function() {

  })
})